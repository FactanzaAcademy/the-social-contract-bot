// Turno completo, effetti speciali, Tensione Sociale, Colpi di scena, fine partita.
// Le scelte dei giocatori arrivano da un oggetto `agent` (vedi defaultAgent): il simulatore
// usa scelte casuali, il verificatore dell'interfaccia usa le scelte dell'utente.
// Dove il regolamento non decide, il motore applica un'interpretazione e lo segnala con flag()
// (gli id corrispondono a src/kb/ambiguities.json).
import {
  ROWS, REVEALED_PROJECTS, REVEALED_EVENTS, EVENTS_TO_WIN,
  log, flag, freeSlots, hasFreeSlot, approvedSlots, leftOf, rightOf, payToReserve, takeFromReserve,
} from './state.js';
import { resolveBids } from './bidding.js';
import { solveEvent } from './events.js';

const ROW_LABEL = { fondanti: 'Fondante', principali: 'Principale', provvisori: 'Provvisorio' };
const MAX_STALL = 3;

function playing(state) {
  return state.status === 'playing';
}

function lose(state, reason, page) {
  if (!playing(state)) return;
  state.status = 'lost';
  state.endReason = reason;
  log(state, `PARTITA PERSA PER TUTTI: ${reason}`, page);
}

function win(state) {
  if (!playing(state)) return;
  state.status = 'won';
  state.endReason = 'Quinto Evento risolto';
  log(state, 'Quinto Evento risolto: il Consiglio ha SUCCESSO, si contano i punti dei Grandi Pensatori', 19);
}

// ---------- mazzi ----------

// Rivela carte fino ad averne `target` scoperte; se il mazzo non basta la partita è persa (pag. 19).
function refill(state, kind) {
  const target = kind === 'projects' ? REVEALED_PROJECTS : REVEALED_EVENTS;
  const need = target - state.revealed[kind].length;
  if (need <= 0) return;
  if (state.decks[kind].length < need) {
    state.revealed[kind].push(...state.decks[kind].splice(0));
    lose(state, `il mazzo ${kind === 'projects' ? 'Progetti' : 'Eventi'} non ha abbastanza carte per ricaricare le ${target} carte scoperte`, 19);
    return;
  }
  state.revealed[kind].push(...state.decks[kind].splice(0, need));
}

function discardRevealed(state, kind) {
  state.outOfGame[kind].push(...state.revealed[kind]);
  state.revealed[kind] = [];
  refill(state, kind);
}

// ---------- Tensione Sociale (pag. 9, 11, 18) ----------

export function increaseTension(state, db, agent, { squareEffect = true, refresh = true } = {}) {
  if (!playing(state)) return;
  state.tension += 1;
  const track = db.board.tensione;
  const sq = track[state.tension];
  log(state, `La Tensione Sociale sale alla casella ${state.tension}`);
  if (!sq || sq.effetto === 'sconfitta' || state.tension >= track.length - 1) {
    lose(state, 'il segnalino Tensione Sociale ha raggiunto l\'ultima casella', 19);
    return;
  }
  if (squareEffect && sq.effetto) {
    log(state, `Effetto della casella: ${sq.effetto}`, 9);
    applyEffect(state, db, agent, sq.effetto, { source: 'tensione' });
  }
  if (refresh && playing(state)) {
    const kind = agent.chooseRefreshDeck(state, db);
    log(state, `Il Leader scarta tutte le carte ${kind === 'projects' ? 'Progetto' : 'Evento'} scoperte e ne rivela di nuove`, 9);
    discardRevealed(state, kind);
  }
}

// ---------- Risoluzione Eventi (pag. 15) ----------

export function resolutionOptions(state, db) {
  const slots = approvedSlots(state);
  return state.revealed.events
    .map((id) => ({ eventId: id, ...solveEvent(db.events[id], slots, db, { limit: 20 }) }))
    .filter((o) => o.resolvable);
}

// Consuma i Progetti usati: Principale → segnalino Mancanza di Risorse, Provvisorio → Archivio,
// Fondante → nessuna conseguenza (pag. 13-14, 16).
function spendProjects(state, combo) {
  for (const s of combo) {
    const slot = state.board[s.row][s.index];
    if (!slot || slot.card !== s.card) throw new Error(`Slot non valido ${s.row}[${s.index}]`);
    if (s.row === 'principali') slot.exhausted = true;
    if (s.row === 'provvisori') {
      state.board.provvisori[s.index] = null;
      state.archive.push(s.card);
    }
  }
}

export function resolveEvent(state, db, agent, eventId, combo, { viaEffect = true } = {}) {
  const ev = db.events[eventId];
  spendProjects(state, combo);
  state.revealed.events = state.revealed.events.filter((id) => id !== eventId);
  state.resolved.push(eventId);
  log(state, `Evento risolto: ${ev.nome} usando ${combo.map((s) => db.projects[s.card].nome).join(', ')}`, 15);
  if (state.resolved.length >= EVENTS_TO_WIN) return win(state);
  if (ev.effetto && viaEffect) {
    log(state, `Effetto speciale dell'Evento risolto: ${ev.effetto}`, 10);
    applyEffect(state, db, agent, ev.effetto, { source: 'evento' });
  }
}

function triggerResolution(state, db, agent) {
  if (!playing(state)) return false;
  const opts = resolutionOptions(state, db);
  if (!opts.length) {
    log(state, 'Risoluzione Evento: nessun Evento scoperto è risolvibile con i Progetti disponibili ("se possibile")', 9);
    return false;
  }
  const pick = agent.chooseResolution(state, db, opts);
  if (!pick) return false;
  resolveEvent(state, db, agent, pick.eventId, pick.combo);
  return true;
}

// ---------- Effetti speciali ----------

export function applyEffect(state, db, agent, code, ctx = {}) {
  if (!playing(state)) return;
  switch (code) {
    case 'risoluzione':
      // pag. 9: "sceglie UNA Carta Evento"; pag. 15 parla di "una o più". Il motore ne risolve una per innesco.
      if (state.varianti?.risoluzione === 'tutte') {
        // variante: con un innesco si risolvono tutti gli Eventi possibili
        while (playing(state) && triggerResolution(state, db, agent));
      } else if (triggerResolution(state, db, agent) && playing(state) && resolutionOptions(state, db).length)
        flag(state, 'risoluzione-una-o-piu', 'dopo la risoluzione un altro Evento era ancora risolvibile: applicata 1 risoluzione per innesco');
      break;
    case 'soldi':
      state.players.forEach((_, i) => takeFromReserve(state, i, 4));
      log(state, 'Soldi gratis!: tutti ricevono 4 monete dalla riserva', 9);
      break;
    case 'colpo':
      drawTwists(state, db, agent, 1);
      break;
    case 'doppio_colpo':
      drawTwists(state, db, agent, 2);
      break;
    case 'tensione':
      increaseTension(state, db, agent);
      break;
    case 'nuova_linea': {
      const from = state.board.provvisori.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      const to = freeSlots(state, 'principali');
      if (!from.length || !to.length) {
        log(state, 'Nuova linea politica: non applicabile (nessun Provvisorio o nessuno spazio Principale libero)', 9);
        break;
      }
      const choice = agent.choose(state, db, 'nuova_linea', from.flatMap((f) => to.map((t) => ({ from: f, to: t }))).concat([null]));
      if (!choice) break;
      state.board.principali[choice.to] = state.board.provvisori[choice.from];
      state.board.provvisori[choice.from] = null;
      log(state, `Nuova linea politica: ${db.projects[state.board.principali[choice.to].card].nome} passa da Provvisorio a Principale`, 9);
      break;
    }
    case 'cambio_priorita': {
      const from = state.board.principali.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      const to = freeSlots(state, 'provvisori');
      if (!from.length || !to.length) {
        log(state, 'Cambio di priorità: non applicabile', 9);
        break;
      }
      const choice = agent.choose(state, db, 'cambio_priorita', from.flatMap((f) => to.map((t) => ({ from: f, to: t }))).concat([null]));
      if (!choice) break;
      const moved = state.board.principali[choice.from];
      if (moved.exhausted) flag(state, 'segnalino-spostamento', 'un Principale esaurito è stato spostato tra i Provvisori: il segnalino resta');
      state.board.provvisori[choice.to] = moved;
      state.board.principali[choice.from] = null;
      log(state, `Cambio di priorità: ${db.projects[moved.card].nome} passa da Principale a Provvisorio`, 9);
      applySlotEffect(state, db, agent, choice.to);
      break;
    }
    case 'allocazione':
      state.board.principali.forEach((s) => s && (s.exhausted = false));
      log(state, 'Allocazione di Risorse: tolti tutti i segnalini Mancanza di Risorse dai Principali', 14);
      break;
    case 'promessa':
      // gestita in placeApproved perché dipende dallo spazio
      break;
    default:
      throw new Error(`Effetto sconosciuto: ${code}`);
  }
}

function applySlotEffect(state, db, agent, provIndex) {
  const eff = db.board.provvisori[provIndex].effetto;
  if (!eff || !playing(state)) return;
  log(state, `Effetto dello spazio Provvisorio ${provIndex + 1}: ${eff}`, 14);
  if (eff === 'promessa') return promessa(state, db, agent, provIndex);
  applyEffect(state, db, agent, eff, { source: 'spazio' });
}

// pag. 14: piazza gratis una seconda carta scoperta nello spazio Provvisorio vuoto a destra.
function promessa(state, db, agent, provIndex) {
  const right = provIndex + 1;
  if (right >= state.board.provvisori.length || state.board.provvisori[right]) {
    log(state, 'Promessa Elettorale: lo spazio a destra non è libero, nessun effetto', 14);
    return;
  }
  if (!state.revealed.projects.length) return;
  const pick = agent.choose(state, db, 'promessa', state.revealed.projects.concat([null]));
  if (!pick) return;
  state.revealed.projects = state.revealed.projects.filter((id) => id !== pick);
  state.board.provvisori[right] = { card: pick, exhausted: false };
  log(state, `Promessa Elettorale: ${db.projects[pick].nome} piazzato gratis nel Provvisorio ${right + 1}`, 14);
  // decisione di Factanza (caso 'promessa-effetto-carta'): la seconda carta attiva il proprio Effetto Speciale
  if (db.projects[pick].effetto) {
    flag(state, 'promessa-effetto-carta', 'effetto della seconda carta attivato');
    log(state, `Effetto speciale della seconda carta: ${db.projects[pick].effetto}`, 15);
    applyEffect(state, db, agent, db.projects[pick].effetto, { source: 'carta' });
  }
  if (db.board.provvisori[right].effetto) flag(state, 'promessa-effetto-spazio', 'spazio a destra con effetto non attivato');
}

// ---------- Colpi di scena ----------

function drawTwists(state, db, agent, n) {
  const drawn = state.decks.events.splice(0, n);
  if (drawn.length < n) log(state, 'Colpo di scena: il mazzo Eventi non ha abbastanza carte ("se possibile")', 9);
  for (let k = 0; k < drawn.length; k++) {
    const id = drawn[k];
    if (!playing(state)) {
      // partita già finita: le carte pescate e non applicate tornano in cima al mazzo
      state.decks.events.unshift(...drawn.slice(k));
      break;
    }
    const ev = db.events[id];
    log(state, `Colpo di scena da "${ev.nome}": ${ev.colpo_di_scena}`, 9);
    const keep = applyTwist(state, db, agent, ev);
    if (!keep) {
      // variante (caso aperto 'colpo-carta-pescata'): 'scarta' (predefinita) oppure 'fondo' del mazzo
      if (state.varianti?.colpoCarta === 'fondo') state.decks.events.push(id);
      else state.outOfGame.events.push(id);
      flag(state, 'colpo-carta-pescata', 'carta pescata per il Colpo di scena: ' + (state.varianti?.colpoCarta === 'fondo' ? 'in fondo al mazzo' : 'scartata'));
    }
  }
}

// Restituisce true se la carta resta in gioco (es. Cantiere aperto finisce tra gli Eventi risolti).
export function applyTwist(state, db, agent, ev) {
  const L = state.leader;
  const all = (fn) => state.players.forEach((_, i) => fn(i));
  switch (ev.twist) {
    case 'scarta_rivelati_tutti':
      discardRevealed(state, 'projects');
      discardRevealed(state, 'events');
      return false;
    case 'scarta_eventi_rivelati':
      discardRevealed(state, 'events');
      return false;
    case 'scarta_principale_scelta': {
      const opts = state.board.principali.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      if (!opts.length) return false;
      const i = agent.choose(state, db, 'scarta_principale', opts);
      state.outOfGame.projects.push(state.board.principali[i].card);
      state.board.principali[i] = null;
      return false;
    }
    case 'scarta_principale_sinistra': {
      const i = state.board.principali.findIndex((s) => s);
      if (i < 0) return false;
      state.outOfGame.projects.push(state.board.principali[i].card);
      state.board.principali[i] = null;
      return false;
    }
    case 'mancanza_3_principali_sinistra': {
      let k = 0;
      let gap = false;
      for (const s of state.board.principali) {
        if (k >= 3) break;
        if (!s) { gap = true; continue; }
        s.exhausted = true;
        k++;
      }
      if (gap && k > 0) flag(state, 'blackout-sinistra', 'spazi vuoti tra i Principali: segnalino sui primi 3 occupati da sinistra');
      return false;
    }
    case 'sostituisci_approvato_con_pescato': {
      const slots = approvedSlots(state);
      if (!slots.length || !state.decks.projects.length) return false;
      const s = agent.choose(state, db, 'sostituisci', slots);
      const newId = state.decks.projects.shift();
      state.outOfGame.projects.push(s.card);
      state.board[s.row][s.index] = { card: newId, exhausted: false };
      flag(state, 'sostituzione-dettagli', 'carta sostituita fuori dal gioco, nuova carta senza effetti né segnalino');
      return false;
    }
    case 'tutti_piu_4': all((i) => takeFromReserve(state, i, 4)); return false;
    case 'tutti_meno_2': all((i) => payToReserve(state, i, 2)); return false;
    case 'tutti_meno_3': all((i) => payToReserve(state, i, 3)); return false;
    case 'leader_piu_3': takeFromReserve(state, L, 3); return false;
    case 'leader_meno_3': payToReserve(state, L, 3); return false;
    case 'leader_5_o_scarta_risolto': {
      const opts = ['paga5'];
      if (state.resolved.length) opts.push('scarta_risolto');
      const c = agent.choose(state, db, 'incidente', opts);
      if (c === 'paga5') payToReserve(state, L, 5);
      else {
        const id = agent.choose(state, db, 'scarta_risolto', state.resolved.slice());
        state.resolved = state.resolved.filter((x) => x !== id);
        state.outOfGame.events.push(id);
      }
      return false;
    }
    case 'leader_5_o_scarta_5_progetti': {
      const c = agent.choose(state, db, 'disuguaglianze', ['paga5', 'scarta5']);
      if (c === 'paga5') payToReserve(state, L, 5);
      else state.outOfGame.projects.push(...state.decks.projects.splice(0, 5));
      return false;
    }
    case 'leader_7_o_tutti_4': {
      const c = agent.choose(state, db, 'brioche', ['leader7', 'tutti4']);
      if (c === 'leader7') takeFromReserve(state, L, 7);
      else all((i) => takeFromReserve(state, i, 4));
      return false;
    }
    case 'tensione_secca':
      increaseTension(state, db, agent, { squareEffect: false, refresh: false });
      return false;
    case 'provvisorio_a_principale':
    case 'fondante_a_principale': {
      const fromRow = ev.twist === 'provvisorio_a_principale' ? 'provvisori' : 'fondanti';
      const from = state.board[fromRow].map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      const to = freeSlots(state, 'principali');
      if (!from.length || !to.length) return false; // "se c'è spazio"
      const f = agent.choose(state, db, 'sposta_da', from);
      state.board.principali[to[0]] = state.board[fromRow][f];
      state.board[fromRow][f] = null;
      if (to.length > 1) flag(state, 'sposta-quale-spazio', 'più spazi Principali liberi: usato il primo');
      return false;
    }
    case 'scambia_due': {
      const slots = approvedSlots(state);
      if (slots.length < 2) return false;
      const pairs = [];
      for (let a = 0; a < slots.length; a++) for (let b = a + 1; b < slots.length; b++) pairs.push([slots[a], slots[b]]);
      const p = agent.choose(state, db, 'scambia', pairs.concat([null]));
      if (!p) return false;
      const [x, y] = p;
      const tmp = state.board[x.row][x.index];
      state.board[x.row][x.index] = state.board[y.row][y.index];
      state.board[y.row][y.index] = tmp;
      return false;
    }
    case 'incursione': {
      const free = freeSlots(state, 'provvisori');
      if (state.players[L].coins < 5 || !free.length || !state.revealed.projects.length) return false;
      if (!agent.choose(state, db, 'incursione_paga', [true, false])) return false;
      payToReserve(state, L, 5);
      let placed = 0;
      for (let k = 0; k < 2 && playing(state); k++) {
        // gli spazi liberi vanno ricalcolati: l'effetto della prima carta può occuparne uno
        const now = freeSlots(state, 'provvisori');
        if (!now.length || !state.revealed.projects.length) break;
        const id = agent.choose(state, db, 'incursione_carta', state.revealed.projects.slice());
        state.revealed.projects = state.revealed.projects.filter((x) => x !== id);
        state.board.provvisori[now[0]] = { card: id, exhausted: false };
        placed++;
        if (db.projects[id].effetto) {
          flag(state, 'incursione-effetto-carta', 'effetto della carta attivato (solo gli effetti delle caselle sono esclusi)');
          applyEffect(state, db, agent, db.projects[id].effetto);
        }
      }
      if (placed < 2) flag(state, 'incursione-spazi', 'meno di 2 spazi Provvisori liberi');
      return false;
    }
    case 'leader_sinistra':
      state.leader = leftOf(state, L);
      flag(state, 'senso-sinistra', 'sinistra = giocatore successivo nell\'ordine di posto');
      return false;
    case 'leader_destra':
      state.leader = rightOf(state, L);
      return false;
    case 'auto_risolto':
      state.resolved.push(ev.id);
      log(state, `${ev.nome} va subito tra gli Eventi Risolti`);
      flag(state, 'cantiere-effetto', 'l\'effetto di risoluzione dell\'Evento non viene attivato');
      if (state.resolved.length >= EVENTS_TO_WIN) win(state);
      return true;
    case 'metropolis': {
      const fond = state.board.fondanti.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      if (!fond.length || !state.revealed.events.length) return false;
      const c = agent.choose(state, db, 'metropolis', [null, ...fond.flatMap((f) => state.revealed.events.map((e) => ({ f, e })))]);
      if (!c) return false;
      state.outOfGame.projects.push(state.board.fondanti[c.f].card);
      state.board.fondanti[c.f] = null;
      state.revealed.events = state.revealed.events.filter((x) => x !== c.e);
      state.resolved.push(c.e);
      flag(state, 'metropolis-effetto', 'effetto dell\'Evento risolto attivato');
      if (state.resolved.length >= EVENTS_TO_WIN) win(state);
      else if (db.events[c.e].effetto) applyEffect(state, db, agent, db.events[c.e].effetto);
      return false;
    }
    default:
      throw new Error(`Colpo di scena non gestito: ${ev.twist} (${ev.nome})`);
  }
}

// ---------- Piazzamento (pag. 13-14) ----------

export function legalSlots(state, canFondante) {
  const out = [];
  for (const row of ROWS) {
    if (row === 'fondanti' && !canFondante) continue;
    freeSlots(state, row).forEach((index) => out.push({ row, index }));
  }
  return out;
}

function placeApproved(state, db, agent, projectId, slot) {
  state.board[slot.row][slot.index] = { card: projectId, exhausted: false };
  const p = db.projects[projectId];
  log(state, `${p.nome} piazzato come ${ROW_LABEL[slot.row]}`, 13);
  // pag. 15: prima l'effetto della carta, poi quello dello spazio
  if (p.effetto) {
    log(state, `Effetto speciale della carta: ${p.effetto}`, 15);
    applyEffect(state, db, agent, p.effetto, { source: 'carta' });
  }
  if (slot.row === 'provvisori') applySlotEffect(state, db, agent, slot.index);
}

// ---------- Turno (pag. 12) ----------

function endOfTurn(state) {
  if (!playing(state)) return;
  refill(state, 'projects');
  refill(state, 'events');
  state.turn += 1;
}

export function playTurn(state, db, agent) {
  if (!playing(state)) return state;
  // pag. 12: se non ci sono spazi liberi si attiva automaticamente una Risoluzione Evento
  if (!hasFreeSlot(state)) {
    log(state, 'Nessuno spazio libero sul tabellone: Risoluzione Evento automatica, poi nuovo turno con lo stesso Leader', 12);
    const ok = triggerResolution(state, db, agent);
    if (!ok) {
      state.stall = (state.stall || 0) + 1;
      flag(state, 'stallo-tabellone-pieno', 'tabellone pieno e nessun Evento risolvibile');
      // decisione di Factanza: la Tensione sale di 1, con il rinnovo delle carte scoperte.
      // La variante stallo: 'blocco' riproduce il regolamento stampato (la partita resta bloccata).
      if (state.varianti?.stallo !== 'blocco') {
        increaseTension(state, db, agent);
        state.stall = 0;
      }
      if (state.stall >= MAX_STALL) {
        state.status = 'stalled';
        state.endReason = 'Tabellone pieno e nessun Evento risolvibile: il regolamento non prevede come proseguire';
      }
    } else state.stall = 0;
    endOfTurn(state);
    return state;
  }
  state.stall = 0;

  const pid = agent.chooseProject(state, db);
  const project = db.projects[pid];
  state.revealed.projects = state.revealed.projects.filter((x) => x !== pid);
  log(state, `Il Leader propone: ${project.nome} (costo ${project.costo})`, 12);

  const offers = agent.bids(state, db, pid).map((o, i) => Math.max(0, Math.min(o, state.players[i].coins)));
  const r = resolveBids({ offers, cost: project.costo, currentLeader: state.leader, fondanteSurcharge: db.board.fondanti.sovrapprezzo });
  state.leader = r.newLeader;
  let legal = r.approved ? legalSlots(state, r.canFondante) : [];
  if (r.approved && !legal.length) {
    flag(state, 'nessuno-spazio-legale', 'Progetto approvato ma solo spazi Fondanti liberi senza il +3: trattato come fallito');
  }
  if (r.approved && legal.length) {
    offers.forEach((o, i) => payToReserve(state, i, o));
    const slot = agent.chooseSlot(state, db, pid, legal);
    placeApproved(state, db, agent, pid, slot);
  } else {
    state.outOfGame.projects.push(pid);
    log(state, `${project.nome} FALLISCE: le monete restano ai giocatori`, 18);
    increaseTension(state, db, agent);
  }
  endOfTurn(state);
  return state;
}

export function playGame(state, db, agent, { maxTurns = 200 } = {}) {
  while (playing(state) && state.turn <= maxTurns) playTurn(state, db, agent);
  if (playing(state)) {
    state.status = 'stalled';
    state.endReason = `superati ${maxTurns} turni`;
  }
  return state;
}

// Agente casuale per il simulatore.
export function randomAgent(rand) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  return {
    chooseProject: (s) => pick(s.revealed.projects),
    bids: (s, db, pid) => {
      const cost = db.projects[pid].costo;
      return s.players.map((p) => {
        const fair = Math.ceil(cost / s.players.length) + Math.floor(rand() * 3) - 1;
        return Math.max(0, Math.min(p.coins, fair));
      });
    },
    chooseSlot: (s, db, pid, legal) => pick(legal),
    chooseRefreshDeck: () => (rand() < 0.5 ? 'projects' : 'events'),
    chooseResolution: (s, db, opts) => {
      const o = pick(opts);
      return { eventId: o.eventId, combo: o.combos[0] };
    },
    choose: (s, db, key, options) => pick(options),
  };
}
