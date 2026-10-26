// Scheda "Chat". Con l'AI collegata (config.json → "ai") Patto risponde nel merito con una risposta
// breve scritta da Haiku sui soli testi ufficiali, e sotto mette le schede da cui l'ha presa per
// approfondire. Senza AI (o se il ponte non risponde) propone 2-3 voci e la risposta arriva dopo la
// scelta. Se nelle regole non c'è nulla, lo dice e offre di segnalarlo agli sviluppatori.
import { propose, answerOption, answerById, optionFromKey } from '../chat/router.js';
import { aiAnswer, aiReport } from '../ai/client.js';
import { db } from '../data.js';
import { md } from './md.js';
import { h, cardImage } from './dom.js';
import { icon } from './icons.js';
import { createPatto } from './patto3d.js';
import { log, enabled } from '../log/logger.js';

const STARTERS = [
  { id: 'turno', title: 'Come funziona un turno?' },
  { id: 'pareggio-leader', title: 'Chi diventa Leader se c\'è un pareggio?' },
  { id: 'risolvere-evento', title: 'Come si risolve un Evento?' },
  { id: 'punteggio', title: 'Come si contano i punti a fine partita?' },
];

// Mascotte: nome provvisorio, usato solo qui.
const MASCOTTE = 'Patto';

const KIND = {
  ai: { icon: 'spark', label: `Risposta di ${MASCOTTE}` },
  regola: { icon: 'rule', label: 'Regola' },
  carta: { icon: 'card', label: 'Carta' },
  calcolo: { icon: 'calc', label: 'Calcolo' },
  ambiguita: { icon: 'open', label: 'Caso aperto' },
  decisione: { icon: 'rule', label: 'Decisione ufficiale' },
  fuori: { icon: 'info', label: 'Fuori regolamento' },
};

// ?attesa nell'indirizzo simula l'attesa dell'AI (3 s) per vedere Patto che pensa anche senza ponte
const attesaProva = new URLSearchParams(location.search).has('attesa');
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion() ? 0 : ms));

export function mountChat(root, { openVerifier, onImage, onStarted = () => {} }) {
  let aiUrl = null; // URL del Worker (strada A), da config.json
  let busy = false;

  const list = h('div', { class: 'messages', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversazione' });
  const input = h('input', { type: 'text', placeholder: 'Scrivi la tua domanda', 'aria-label': 'Domanda', autocomplete: 'off', enterkeyhint: 'send', maxlength: 300 });
  const send = h('button', { class: 'send', type: 'submit', 'aria-label': 'Invia', disabled: true, html: icon('send', { size: 18 }) });
  input.addEventListener('input', () => (send.disabled = !input.value.trim() || busy));
  const form = h('form', { class: 'composer', onsubmit: (e) => { e.preventDefault(); ask(input.value); } }, h('div', { class: 'field-pill' }, input, send));
  const note = h('p', { class: 'note' });
  const dockRow = h('div', { class: 'dock-row' }, form);
  root.append(list, h('div', { class: 'dock' }, dockRow, note));
  // nota sotto la casella: dice onestamente dove va la domanda
  const updateNote = () => {
    const ai = aiUrl ? 'Patto risponde con l\'AI a partire dal regolamento ufficiale: la domanda viene inviata ad Anthropic per la risposta.' : 'Risposte dal regolamento ufficiale. Niente di quello che scrivi lascia questa pagina.';
    note.textContent = enabled() ? `${ai} Le domande vengono anche registrate in forma anonima per migliorare l'assistente.` : ai;
  };
  updateNote();

  const scroll = (el) =>
    requestAnimationFrame(() => {
      list.scrollTo({ top: Math.max(0, el ? el.offsetTop - 16 : list.scrollHeight), behavior: reduceMotion() ? 'auto' : 'smooth' });
    });

  // ---- mattoni della conversazione ----
  // Patto 3D: nel benvenuto saluta in grande; iniziata la chat sta in piedi accanto alla casella di
  // scrittura, a riposo (Idle), e reagisce ai messaggi. stato = animazione (saluto, attesa, confuso, riposo)
  const patto = createPatto();
  const stage = patto.slot();
  stage.classList.add('in-dock');
  dockRow.prepend(stage);
  let started = false;
  function start() {
    welcome?.classList.add('compact');
    onStarted(true);
    if (!started) patto.vivo(stage, 'riposo');
    started = true;
  }
  function botRow(...children) {
    const stato = typeof children[0] === 'string' ? children.shift() : 'riposo';
    const bubble = h('div', { class: 'bubble' }, ...children);
    const row = h('div', { class: 'row bot' }, bubble);
    list.append(row);
    patto.stato(stato);
    scroll(row);
    return bubble;
  }
  function userRow(text) {
    const row = h('div', { class: 'row user' }, h('div', { class: 'bubble' }, text));
    list.append(row);
    scroll(row);
  }
  // attesa: Patto cammina sul posto mentre cerca; con l'AI (attesa lunga) anche una scritta
  function typing(lungo = false) {
    const row = h('div', { class: `row bot thinking${lungo ? ' lungo' : ''}`, 'aria-label': `${MASCOTTE} sta cercando` },
      h('div', { class: 'bubble typing' }, lungo && h('em', {}, `${MASCOTTE} ci sta pensando`), h('span'), h('span'), h('span')));
    list.append(row);
    patto.stato('attesa');
    scroll(row);
    return () => row.remove();
  }
  const eyebrow = (kind) => h('div', { class: `eyebrow k-${kind}`, html: `${icon(KIND[kind].icon, { size: 15 })}<span>${KIND[kind].label}</span>` });
  const chipRow = (items, onClick, cls = '') =>
    h('div', { class: `chips ${cls}` }, items.map((it) => h('button', { class: 'chip', type: 'button', onclick: () => onClick(it) }, it.title)));

  // ---- feedback ----
  function feedback(domanda, scelta) {
    const box = h('div', { class: 'feedback' }, h('span', {}, 'Ti è stata utile?'));
    const done = (utile) => {
      log('utile', { domanda, scelta, utile });
      box.replaceChildren(h('span', { class: 'thanks' }, utile ? 'Grazie del riscontro.' : 'Grazie: la useremo per migliorare.'));
      if (!utile) box.append(h('button', { class: 'linkish', type: 'button', onclick: () => input.focus() }, 'Riformula la domanda'));
    };
    box.append(
      h('button', { class: 'thumb', type: 'button', 'aria-label': 'Sì, utile', title: 'Utile', onclick: () => done(true), html: icon('thumbUp', { size: 17 }) }),
      h('button', { class: 'thumb', type: 'button', 'aria-label': 'No, non utile', title: 'Non utile', onclick: () => done(false), html: icon('thumbDown', { size: 17 }) }),
    );
    return box;
  }

  // ---- risposta (solo dopo una scelta) ----
  function showAnswer(a, domanda, scelta) {
    const kind = a.type === 'carta' ? 'carta' : a.type === 'ambiguita' ? (a.ufficiale ? 'decisione' : 'ambiguita') : a.type === 'fuori' ? 'fuori' : 'regola';
    const parts = [eyebrow(kind)];
    if (a.type === 'carta' && a.ambiguities?.length) {
      const testo = a.aperti ? 'Questa carta tocca un caso che il regolamento non risolve: trovi i dettagli in fondo.' : 'Questa carta ha una precisazione ufficiale di Factanza: la trovi in fondo.';
      parts.push(h('div', { class: 'callout', html: `${icon(a.aperti ? 'open' : 'rule', { size: 16 })}<span>${testo}</span>` }));
    }
    if (a.title && a.type !== 'carta') parts.push(h('h3', { class: 'answer-title' }, a.title));
    parts.push(h('div', { class: 'prose', html: md(a.text) }));
    if (a.type === 'carta') {
      const c = a.kind === 'project' ? db.projects[a.id] : a.kind === 'event' ? db.events[a.id] : db.thinkers[a.id];
      const src = cardImage(a.kind, c.page);
      parts.push(h('button', { class: `cardshot${a.kind === 'project' ? '' : ' portrait'}`, type: 'button', 'aria-label': `Ingrandisci la carta ${c.nome}`, onclick: () => onImage(src) },
        h('img', { src, alt: `Carta ${c.nome}`, loading: 'lazy' })));
    }
    if (a.pages?.length) parts.push(h('div', { class: 'sources', html: `${icon('page', { size: 14 })}<span>Regolamento, pag. ${a.pages.join(', ')}</span>` }));
    if (a.related?.length) {
      const rel = a.related.map((id) => answerById(id)).filter(Boolean).map((r) => ({ id: r.id, title: r.title }));
      if (rel.length) parts.push(h('div', { class: 'see-also' }, h('span', { class: 'label' }, 'Vedi anche'), chipRow(rel, (it) => pick({ kind: 'regola', id: it.id, key: it.id, title: it.title }, it.title))));
    }
    parts.push(feedback(domanda, scelta));
    const bubble = botRow(...parts);
    bubble.classList.add('answer');
  }

  async function pick(option, domanda) {
    userRow(option.title);
    log('scelta', { domanda, scelta: option.key });
    const stop = typing();
    await wait(260);
    stop();
    if (option.kind === 'calcolo') {
      botRow(eyebrow('calcolo'),
        h('p', {}, 'Ho aperto gli strumenti con i numeri letti dalla tua domanda. Controlla offerte, costo e Leader: il risultato lo calcola il motore delle regole, non io.'),
        feedback(domanda, option.key));
      openVerifier(option.verifier);
      return;
    }
    showAnswer(answerOption(option), domanda, option.key);
  }

  // ---- schede da scegliere (proposte o approfondimenti) ----
  function optionList(options, q, onPick = () => {}) {
    let el;
    const lock = () => el.closest('.bubble')?.querySelectorAll('.option, .none').forEach((b) => (b.disabled = true));
    el = h('div', { class: 'options', role: 'group', 'aria-label': 'Schede' }, options.map((o, i) =>
      h('button', { class: `option k-${o.kind}`, type: 'button', style: `--i:${i}`, onclick: (e) => { lock(); onPick(); e.currentTarget.classList.add('chosen'); pick(o, q); } },
        h('span', { class: 'oicon', html: icon(KIND[o.ufficiale ? 'decisione' : o.kind].icon, { size: 17 }) }),
        h('span', { class: 'otext' }, h('span', { class: 'okind' }, KIND[o.ufficiale ? 'decisione' : o.kind].label), h('span', { class: 'otitle' }, o.title)),
        h('span', { class: 'ochev', html: icon('chevron', { size: 16 }) }))));
    return { el, lock };
  }

  // ---- nessuna risposta nelle regole: lo dico e propongo di segnalarlo agli sviluppatori ----
  function notFound(q, intro = 'Non trovo nulla tra le regole su questo.') {
    log('non-so', { domanda: q });
    if (!aiUrl) return botRow('confuso', h('p', {}, `${intro} Prova a chiedermelo in un altro modo.`));
    const box = h('div', { class: 'report' });
    const answer = (text) => box.replaceChildren(h('span', { class: 'thanks' }, text));
    box.append(
      h('button', { class: 'chip primary', type: 'button', onclick: async (e) => {
        box.querySelectorAll('button').forEach((b) => (b.disabled = true));
        e.currentTarget.textContent = 'Invio…';
        answer((await aiReport(aiUrl, q)) ? 'Grazie! L\'ho segnalato agli sviluppatori del gioco.' : 'Non sono riuscito a inviare la segnalazione. Riprova più tardi.');
      } }, 'Sì, segnala'),
      h('button', { class: 'chip', type: 'button', onclick: () => answer('Va bene, nessun problema.') }, 'No, grazie'));
    return botRow('confuso', h('p', {}, `${intro} Vuoi segnalarlo agli sviluppatori del gioco?`), box);
  }

  // ---- risposta dell'AI, con le schede da cui viene per approfondire ----
  function showAi(ai, q, local) {
    const opts = [];
    const add = (o) => o && !opts.some((x) => x.key === o.key) && opts.push(o);
    local.options.filter((o) => o.kind === 'calcolo').forEach(add); // un calcolo lo fa sempre il motore
    ai.proposte.map(optionFromKey).forEach(add);
    log('domanda', { domanda: q, proposte: opts.map((o) => o.key) });
    const parts = [eyebrow('ai'), h('div', { class: 'prose', html: md(ai.risposta) })];
    if (opts.length) parts.push(h('div', { class: 'deepen' }, h('span', { class: 'label' }, 'Approfondisci nel regolamento'), optionList(opts.slice(0, 3), q).el));
    parts.push(h('p', { class: 'ai-note' }, 'Risposta scritta dall\'AI a partire dal regolamento ufficiale: le schede qui sopra sono il testo originale.'));
    parts.push(feedback(q, 'ai'));
    botRow(...parts).classList.add('answer');
  }

  // ---- proposte locali (senza AI): 2-3 voci, la risposta dopo la scelta ----
  function showProposals(p, q, lead = p.text) {
    log('domanda', { domanda: q, proposte: p.options.map((o) => o.key) });
    let list;
    const none = h('button', { class: 'none', type: 'button', onclick: () => {
      list.lock();
      log('nessuna', { domanda: q, proposte: p.options.map((o) => o.key) });
      notFound(q, 'Ok, allora non è tra queste.');
    } }, 'Nessuna di queste');
    list = optionList(p.options, q);
    botRow(h('p', { class: 'lead' }, lead), list.el, none);
  }

  async function ask(q) {
    q = (q || '').trim();
    if (!q || busy) return;
    busy = true;
    input.value = '';
    send.disabled = true;
    start();
    userRow(q);
    const stop = typing(!!aiUrl || attesaProva);
    const local = propose(q);
    let ai = null;
    if (aiUrl) ai = await aiAnswer(aiUrl, q); // null se il ponte non risponde: restano le proposte locali
    else await wait(attesaProva ? 3000 : 420);
    stop();
    const solide = local.options.filter((o) => o.kind === 'carta' || o.kind === 'calcolo');
    if (ai?.trovata) showAi(ai, q, local);
    else if (ai && solide.length) showProposals({ ...local, options: solide }, q, 'Non ho una risposta diretta, ma queste schede possono aiutarti:');
    else if (ai?.fuoriTema) {
      log('non-so', { domanda: q });
      botRow('confuso', h('p', {}, 'Posso aiutarti solo con le regole di The Social Contract: turni, offerte, carte, Eventi, punteggio. Chiedimi pure!'));
    } else if (ai || local.type === 'non-so') notFound(q);
    else showProposals(local, q);
    busy = false;
    send.disabled = !input.value.trim();
    input.focus({ preventScroll: true });
  }

  // ---- benvenuto ----
  let welcome = null;
  function renderWelcome() {
    // un tocco su Patto ripete il saluto
    const slot = patto.slot({ grande: true, role: 'img', 'aria-hidden': null, 'aria-label': `${MASCOTTE}, la mascotte, che saluta`, title: `Ciao, sono ${MASCOTTE}`, onclick: () => patto.stato('saluto') });
    welcome = h('section', { class: 'welcome', 'aria-label': 'Benvenuto' },
      h('picture', { class: 'brand' },
        h('img', { src: 'brand/tsc-logo-3d.web.png', alt: 'The Social Contract', width: 960, height: 178 })),
      slot,
      h('p', { class: 'welcome-lead' }, `Ciao, sono ${MASCOTTE}! Conosco il regolamento di The Social Contract a memoria. Scrivimi il tuo dubbio o il nome di una carta: ti porto alla risposta ufficiale.`),
      h('div', { class: 'starters' }, STARTERS.map((it, i) =>
        h('button', { class: 'starter', type: 'button', style: `--i:${i}`, onclick: () => { start(); pick({ kind: 'regola', id: it.id, key: it.id, title: it.title }, it.title); } },
          h('span', { html: icon('rule', { size: 16 }) }), h('span', {}, it.title)))));
    list.append(welcome);
    patto.vivo(slot, 'saluto');
  }
  function reset() {
    onStarted(false);
    started = false;
    list.replaceChildren();
    renderWelcome();
    input.value = '';
    send.disabled = true;
  }
  renderWelcome();

  return { ask, updateNote, reset, setAi: (url) => { aiUrl = url || null; updateNote(); }, focus: () => input.focus() };
}
