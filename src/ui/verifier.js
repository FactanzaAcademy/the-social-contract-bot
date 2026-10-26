// Scheda "Strumenti": quattro strumenti che usano il motore di regole.
import { db } from '../data.js';
import { resolveBids, explainBids } from '../engine/bidding.js';
import { solveEvent, shortfall, requirementText, label } from '../engine/events.js';
import { scoreThinker } from '../engine/scoring.js';
import { EFFECT, objectiveText } from '../kb/templates.js';
import { h, select } from './dom.js';
import { md } from './md.js';

const ROWS = [
  { key: 'fondanti', label: 'Fondanti', cls: 'f', n: 2 },
  { key: 'principali', label: 'Principali', cls: 'p', n: 5 },
  { key: 'provvisori', label: 'Provvisori', cls: 'v', n: 5 },
];
const SINGULAR = { fondanti: 'Fondante', principali: 'Principale', provvisori: 'Provvisorio' };
const SLOT_EFFECT = ['Soldi gratis!', 'Promessa Elettorale', '—', 'Risoluzione Evento', 'Allocazione di Risorse'];

const projectOptions = () =>
  ['economia', 'tecnologia', 'difesa'].map((t) => ({
    group: label(t),
    items: db.projectList.filter((p) => p.risorsa.tipo === t).map((p) => ({ value: p.id, label: `${p.nome} (${p.risorsa.valore}, costo ${p.costo})` })),
  }));
const eventOptions = () => db.eventList.map((e) => ({ value: e.id, label: `${e.nome} (${requirementText(e)})` }));
const thinkerOptions = () => db.thinkerList.map((t) => ({ value: t.id, label: t.nome }));

// Stato condiviso tra gli strumenti Evento e Punteggio.
const state = {
  board: { fondanti: [null, null], principali: Array(5).fill(null), provvisori: Array(5).fill(null) },
  archive: [],
  resolved: [null, null, null, null, null],
  deck: 20,
  tension: 0,
  thinkers: ['t03', 't23'],
  asta: { n: 4, leader: 0, names: ['Giocatore 1', 'Giocatore 2', 'Giocatore 3', 'Giocatore 4', 'Giocatore 5', 'Giocatore 6'], offers: [0, 0, 0, 0, 0, 0], project: '', cost: 6 },
  evento: '',
  effetti: { project: '', slot: 'provvisori:3' },
};

function slotsOf(board) {
  const out = [];
  for (const r of ROWS) board[r.key].forEach((s, index) => s && out.push({ row: r.key, index, card: s.card, exhausted: !!s.exhausted }));
  return out;
}

function boardBuilder(onChange, { withExhausted = true } = {}) {
  const wrap = h('div', { class: 'board' });
  for (const r of ROWS) {
    const slots = h('div', { class: 'slots' });
    state.board[r.key].forEach((s, i) => {
      const cell = h('div', { class: 'slot' });
      cell.append(select(projectOptions(), {
        value: s?.card ?? '',
        placeholder: '— vuoto —',
        label: `${r.label} ${i + 1}`,
        onchange: (v) => { state.board[r.key][i] = v ? { card: v, exhausted: false } : null; onChange(true); },
      }));
      if (r.key === 'provvisori') cell.append(h('div', { class: 'eff' }, `Spazio ${i + 1}: ${SLOT_EFFECT[i]}`));
      if (withExhausted && r.key === 'principali' && s)
        cell.append(h('label', {}, h('input', { type: 'checkbox', checked: s.exhausted, onchange: (e) => { s.exhausted = e.target.checked; onChange(false); } }), 'Mancanza di Risorse'));
      slots.append(cell);
    });
    wrap.append(h('div', { class: 'boardrow' }, h('div', { class: `lbl ${r.cls}` }, r.label), slots));
  }
  return wrap;
}

function pill(row) {
  const r = ROWS.find((x) => x.key === row);
  return h('span', { class: `pill ${r.cls}` }, SINGULAR[row]);
}

// ---------------- Asta ----------------
function toolAsta(root) {
  const a = state.asta;
  const check = a.fromChat
    ? h('div', { class: 'checkme' }, 'Numeri letti dalla tua domanda: controlla offerte, costo e Leader attuale prima di fidarti del risultato.')
    : null;
  a.fromChat = false;
  const res = h('div');
  const players = h('div', { class: 'players' });
  const costField = h('input', { type: 'number', min: 1, max: 20, value: a.cost, oninput: (e) => { a.cost = Number(e.target.value) || 0; a.project = ''; projSel.value = ''; compute(); } });
  const projSel = select(projectOptions(), { value: a.project, placeholder: '— scegli un Progetto (opzionale) —', label: 'Progetto', onchange: (v) => { a.project = v; if (v) { a.cost = db.projects[v].costo; costField.value = a.cost; } compute(); } });

  function drawPlayers() {
    players.replaceChildren();
    for (let i = 0; i < a.n; i++) {
      players.append(h('div', { class: 'player' },
        h('input', { type: 'text', value: a.names[i], 'aria-label': `Nome giocatore ${i + 1}`, oninput: (e) => { a.names[i] = e.target.value || `Giocatore ${i + 1}`; compute(); } }),
        h('div', { class: 'row', style: 'margin:6px 0 0' },
          h('label', { class: 'field' }, 'Offerta', h('input', { type: 'number', min: 0, max: 60, value: a.offers[i], oninput: (e) => { a.offers[i] = Math.max(0, Number(e.target.value) || 0); compute(); } })),
          h('label', { class: 'lead' }, h('input', { type: 'radio', name: 'leader', checked: a.leader === i, onchange: () => { a.leader = i; compute(); } }), 'Leader attuale'))));
    }
  }

  function compute() {
    const offers = a.offers.slice(0, a.n);
    if (!a.cost) { res.replaceChildren(); return; }
    const r = resolveBids({ offers, cost: a.cost, currentLeader: a.leader });
    const lines = explainBids(r, a.names);
    res.replaceChildren(h('div', { class: `result ${r.approved ? 'ok' : 'bad'}` },
      h('h4', {}, r.approved ? `Approvato ${r.canFondante ? '(anche Fondante)' : ''}` : 'Fallito: Tensione +1'),
      h('div', { html: md(lines.map((l) => `- ${l}`).join('\n')) })));
  }

  root.append(h('div', { class: 'box' },
    check,
    h('h3', {}, 'Asta e nuovo Leader'),
    h('p', { class: 'hint' }, 'Inserisci le offerte segrete. Il calcolo segue le pag. 12-13 e 18 del regolamento.'),
    h('div', { class: 'row' },
      h('label', { class: 'field' }, 'Giocatori', select([2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) })), { value: a.n, label: 'Numero di giocatori', onchange: (v) => { a.n = Number(v); if (a.leader >= a.n) a.leader = 0; drawPlayers(); compute(); } })),
      h('label', { class: 'field grow' }, 'Progetto', projSel),
      h('label', { class: 'field' }, 'Costo', costField)),
    players, res));
  drawPlayers();
  compute();
}

// ---------------- Evento ----------------
function toolEvento(root) {
  const res = h('div');
  const boardBox = h('div');
  const evSel = select(eventOptions(), { value: state.evento, placeholder: '— tutti gli Eventi —', label: 'Evento', onchange: (v) => { state.evento = v; compute(); } });

  function drawBoard() { boardBox.replaceChildren(boardBuilder((redraw) => { if (redraw) drawBoard(); compute(); })); }

  function describeCombo(c) {
    return h('div', { class: 'combo' }, c.map((s) => {
      const p = db.projects[s.card];
      return h('span', { style: 'margin-right:10px;display:inline-block' }, pill(s.row), `${p.nome} (${p.risorsa.valore} ${p.risorsa.tipo})`);
    }));
  }

  function compute() {
    const slots = slotsOf(state.board);
    const evs = state.evento ? [db.events[state.evento]] : db.eventList;
    if (!slots.length) { res.replaceChildren(h('div', { class: 'result info' }, 'Aggiungi dei Progetti al tabellone qui sopra.')); return; }
    const out = [];
    for (const ev of evs) {
      const s = solveEvent(ev, slots, db, { limit: 5 });
      if (!state.evento && !s.resolvable) continue;
      const box = h('div', { class: `result ${s.resolvable ? 'ok' : 'bad'}` }, h('h4', {}, `${ev.nome}: ${requirementText(ev)}`));
      if (s.resolvable) {
        box.append(h('div', {}, `${s.totalCombos} combinazion${s.totalCombos === 1 ? 'e' : 'i'} minim${s.totalCombos === 1 ? 'a' : 'e'}. Le migliori (prima quelle che usano Fondanti, che non si consumano):`));
        s.combos.forEach((c) => box.append(describeCombo(c)));
        box.append(h('div', { class: 'meta' }, 'Dopo: i Principali usati prendono Mancanza di Risorse, i Provvisori usati vanno in Archivio, i Fondanti restano.'));
      } else {
        const miss = shortfall(ev, slots, db);
        box.append(h('div', {}, 'Non risolvibile. Manca: ' + Object.entries(miss || {}).map(([k, v]) => (k === 'carte' ? `${v} carte` : `${v} ${label(k)}`)).join(', ')));
      }
      out.push(box);
    }
    if (!out.length) out.push(h('div', { class: 'result bad' }, 'Nessun Evento è risolvibile con questi Progetti (quelli con Mancanza di Risorse non contano).'));
    res.replaceChildren(...out);
  }

  root.append(h('div', { class: 'box' },
    h('h3', {}, 'Posso risolvere questo Evento?'),
    h('p', { class: 'hint' }, 'Metti sul tabellone i Progetti approvati (segna quelli scarichi) e scegli un Evento, oppure lascia "tutti" per vedere quali puoi risolvere. Pag. 13-16.'),
    h('div', { class: 'row' }, h('label', { class: 'field grow' }, 'Evento', evSel)),
    boardBox, res));
  drawBoard();
  compute();
}

// ---------------- Punteggio ----------------
function toolPunteggio(root) {
  const res = h('div');
  const boardBox = h('div');
  const extras = h('div');

  function drawBoard() { boardBox.replaceChildren(boardBuilder((redraw) => { if (redraw) drawBoard(); compute(); }, { withExhausted: false })); }

  function drawExtras() {
    extras.replaceChildren(
      h('div', { class: 'row' },
        ...state.thinkers.map((t, i) => h('label', { class: 'field grow' }, `Grande Pensatore ${i + 1}`, select(thinkerOptions(), { value: t, label: `Pensatore ${i + 1}`, onchange: (v) => { state.thinkers[i] = v; compute(); } })))),
      h('div', { class: 'field', style: 'margin-bottom:6px' }, 'Eventi risolti'),
      h('div', { class: 'row' }, state.resolved.map((e, i) => h('label', { class: 'field grow' }, select(eventOptions(), { value: e ?? '', placeholder: `— Evento ${i + 1} —`, label: `Evento risolto ${i + 1}`, onchange: (v) => { state.resolved[i] = v || null; compute(); } })))),
      h('div', { class: 'row' },
        h('label', { class: 'field' }, 'Progetti in Archivio', h('input', { type: 'number', min: 0, max: 39, value: state.archive.length, oninput: (e) => { state.archive = Array(Math.max(0, Number(e.target.value) || 0)).fill('x'); compute(); } })),
        h('label', { class: 'field' }, 'Carte nel mazzo Progetti', h('input', { type: 'number', min: 0, max: 39, value: state.deck, oninput: (e) => { state.deck = Math.max(0, Number(e.target.value) || 0); compute(); } })),
        h('label', { class: 'field' }, 'Casella Tensione (0 = partenza)', h('input', { type: 'number', min: 0, max: 7, value: state.tension, oninput: (e) => { state.tension = Math.min(7, Math.max(0, Number(e.target.value) || 0)); compute(); } }))));
  }

  function compute() {
    const final = {
      approved: slotsOf(state.board).map((s) => ({ card: s.card, row: s.row })),
      archive: state.archive,
      resolved: state.resolved.filter(Boolean),
      projectDeckCount: state.deck,
      tension: state.tension,
    };
    const parts = state.thinkers.map((id) => scoreThinker(db.thinkers[id], final, db));
    const tot = parts.reduce((s, p) => s + p.pv, 0);
    const all = db.thinkerList.map((t) => ({ t, pv: scoreThinker(t, final, db).pv })).sort((a, b) => b.pv - a.pv);
    res.replaceChildren(
      h('div', { class: 'result info' },
        h('div', { class: 'total' }, `${tot} PV`),
        ...parts.map((p) => h('div', { style: 'margin-top:8px' },
          h('strong', {}, `${p.nome}: ${p.pv} PV`),
          h('div', { class: 'hint', style: 'margin:2px 0 0', html: md(objectiveText(db.thinkers[p.thinker])) }),
          p.righe.length ? h('ul', {}, p.righe.map((r) => h('li', {}, r))) : null,
          ...p.interpretazioni.map((x) => h('div', { class: 'badge amb', style: 'margin-top:6px' }, `⚠︎ ${x.alternativa}`))))),
      h('details', { class: 'box', style: 'margin-top:10px' }, h('summary', {}, 'Confronta: quanti punti farebbe ogni Grande Pensatore con questo tabellone'),
        h('ul', {}, all.map((x) => h('li', {}, `${x.t.nome}: ${x.pv} PV`)))));
  }

  root.append(h('div', { class: 'box' },
    h('h3', {}, 'Punteggio finale'),
    h('p', { class: 'hint' }, '"Approvato" = Progetto sul tabellone (Fondante, Principale o Provvisorio); l\'Archivio conta solo per Sun Tzu. Pag. 19-21.'),
    extras, boardBox, res));
  drawExtras();
  drawBoard();
  compute();
}

// ---------------- Piazzamento ed effetti ----------------
function toolEffetti(root) {
  const res = h('div');
  const e = state.effetti;
  const slotOpts = [];
  ROWS.forEach((r) => { for (let i = 0; i < r.n; i++) slotOpts.push({ value: `${r.key}:${i}`, label: `${SINGULAR[r.key]} ${i + 1}${r.key === 'provvisori' ? ` (${SLOT_EFFECT[i]})` : ''}` }); });

  function compute() {
    if (!e.project) { res.replaceChildren(h('div', { class: 'result info' }, 'Scegli un Progetto e uno spazio.')); return; }
    const p = db.projects[e.project];
    const [row, idx] = e.slot.split(':');
    const i = Number(idx);
    const steps = [];
    if (row === 'fondanti') steps.push(`Per lo spazio Fondante l'offerta totale deve essere almeno **${p.costo + 3}** (costo ${p.costo} + 3). Il Fondante non si esaurirà mai.`);
    else steps.push(`Basta un'offerta totale di almeno **${p.costo}** monete.`);
    steps.push(p.effetto ? `**1° effetto della carta: ${EFFECT[p.effetto].nome}.** ${EFFECT[p.effetto].testo}.` : '1° la carta non ha effetti speciali.');
    if (row === 'provvisori') {
      const se = db.board.provvisori[i].effetto;
      if (!se) steps.push('2° lo spazio Provvisorio 3 non ha effetti.');
      else if (se === 'promessa') steps.push('**2° effetto dello spazio: Promessa Elettorale.** Il Leader può piazzare gratis una seconda Carta Progetto scoperta nel Provvisorio 3, se è vuoto. La seconda carta attiva il proprio Effetto Speciale (decisione ufficiale di Factanza).');
      else steps.push(`**2° effetto dello spazio: ${EFFECT[se].nome}.** ${EFFECT[se].testo}.`);
      steps.push('Quando verrà usato per risolvere un Evento, il Progetto andrà in Archivio e lo spazio si libererà.');
    } else if (row === 'principali') steps.push('Quando verrà usato per un Evento riceverà il segnalino Mancanza di Risorse (si ricarica con un\'Allocazione di Risorse).');
    steps.push('Poi, se un effetto lo ha attivato, il Leader può risolvere un Evento (pag. 15).');
    res.replaceChildren(h('div', { class: 'result info' }, h('h4', {}, `${p.nome} → ${slotOpts.find((o) => o.value === e.slot).label}`), h('div', { html: md(steps.map((s, k) => `${k + 1}. ${s}`).join('\n')) })));
  }

  root.append(h('div', { class: 'box' },
    h('h3', {}, 'Piazzamento ed effetti'),
    h('p', { class: 'hint' }, 'In che ordine succedono le cose quando piazzi un Progetto: prima l\'effetto della carta, poi quello dello spazio (pag. 15).'),
    h('div', { class: 'row' },
      h('label', { class: 'field grow' }, 'Progetto', select(projectOptions(), { value: e.project, placeholder: '— scegli —', label: 'Progetto', onchange: (v) => { e.project = v; compute(); } })),
      h('label', { class: 'field grow' }, 'Spazio', select(slotOpts, { value: e.slot, label: 'Spazio', onchange: (v) => { e.slot = v; compute(); } }))),
    res));
  compute();
}

const TOOLS = [
  { id: 'asta', label: 'Asta', fn: toolAsta },
  { id: 'evento', label: 'Risolvi Evento', fn: toolEvento },
  { id: 'punteggio', label: 'Punteggio finale', fn: toolPunteggio },
  { id: 'effetti', label: 'Piazzamento ed effetti', fn: toolEffetti },
];

export function mountVerifier(root) {
  const bar = h('div', { class: 'tools', role: 'toolbar', 'aria-label': 'Strumenti' });
  const body = h('div');
  root.append(bar, body);
  let current = 'asta';
  function show(id) {
    current = id;
    bar.replaceChildren(...TOOLS.map((t) => h('button', { class: 'tool', type: 'button', 'aria-pressed': String(t.id === id), onclick: () => show(t.id) }, t.label)));
    body.replaceChildren();
    TOOLS.find((t) => t.id === id).fn(body);
  }
  show(current);
  return {
    open(pre) {
      if (pre?.tool === 'asta') {
        const a = state.asta;
        a.n = Math.min(6, Math.max(2, pre.offers.length));
        pre.offers.forEach((o, i) => (a.offers[i] = o));
        a.cost = pre.cost;
        a.project = '';
        a.offers.fill(0, pre.offers.length);
        a.leader = 0;
        a.fromChat = true;
      }
      show(pre?.tool || 'asta');
    },
  };
}
