// Stato di partita di The Social Contract e utility condivise dal motore.
// Le pagine citate (pag. N) sono quelle del Regolamento_DEF_revisione.pdf.

export const ROWS = ['fondanti', 'principali', 'provvisori'];
export const RESOURCES = ['difesa', 'economia', 'tecnologia'];

// pag. 6: monete iniziali per numero di giocatori
export function startingCoins(nPlayers) {
  if (nPlayers === 2) return 25;
  if (nPlayers === 3) return 15;
  if (nPlayers === 4) return 10;
  if (nPlayers === 5 || nPlayers === 6) return 8;
  throw new Error(`Numero di giocatori non valido: ${nPlayers} (il gioco è per 2-6)`);
}

export const TOTAL_COINS = 108; // pag. 5: 108 token moneta
export const EVENTS_TO_WIN = 5; // pag. 19
export const REVEALED_PROJECTS = 4; // pag. 6
export const REVEALED_EVENTS = 3; // pag. 6

// Indicizza i dati delle carte per id.
export function makeDb({ projects, events, thinkers, board }) {
  const byId = (arr) => Object.fromEntries(arr.map((c) => [c.id, c]));
  return {
    projects: byId(projects),
    events: byId(events),
    thinkers: byId(thinkers || []),
    board,
    projectList: projects,
    eventList: events,
    thinkerList: thinkers || [],
  };
}

export function emptyBoard(board) {
  return {
    fondanti: Array(board.fondanti.spazi).fill(null),
    principali: Array(board.principali.spazi).fill(null),
    provvisori: Array(board.provvisori.length).fill(null),
  };
}

// RNG deterministico (mulberry32) per simulazioni riproducibili.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Preparazione (pag. 6). Non distribuisce i Pensatori se non richiesto.
export function createGame(db, { players, seed = 1, leader = null, thinkersPerPlayer = 0 }) {
  const rand = rng(seed);
  const n = players.length;
  const coins = startingCoins(n);
  const projDeck = shuffle(db.projectList.map((p) => p.id), rand);
  const evDeck = shuffle(db.eventList.map((e) => e.id), rand);
  const thDeck = shuffle(db.thinkerList.map((t) => t.id), rand);
  const state = {
    players: players.map((name, i) => ({
      id: i,
      name,
      coins,
      thinkers: thinkersPerPlayer ? thDeck.splice(0, thinkersPerPlayer) : [],
    })),
    leader: leader ?? Math.floor(rand() * n),
    reserve: TOTAL_COINS - coins * n,
    decks: { projects: projDeck, events: evDeck },
    revealed: { projects: [], events: [] },
    board: emptyBoard(db.board),
    archive: [],
    resolved: [],
    outOfGame: { projects: [], events: [] },
    tension: 0,
    turn: 1,
    status: 'playing',
    endReason: null,
    log: [],
    flags: [], // casi in cui il motore ha dovuto applicare un'interpretazione (vedi ambiguities.json)
  };
  if (state.reserve < 0) throw new Error('Monete insufficienti nella scatola');
  state.revealed.projects = state.decks.projects.splice(0, REVEALED_PROJECTS);
  state.revealed.events = state.decks.events.splice(0, REVEALED_EVENTS);
  return state;
}

export function log(state, msg, page) {
  state.log.push(page ? `${msg} (pag. ${page})` : msg);
}

export function flag(state, ambiguityId, note) {
  state.flags.push({ id: ambiguityId, turn: state.turn, note });
}

// Tutti gli slot occupati del tabellone, con riferimento {row, index, card, exhausted}.
export function approvedSlots(state) {
  const out = [];
  for (const row of ROWS) {
    state.board[row].forEach((s, index) => {
      if (s) out.push({ row, index, card: s.card, exhausted: !!s.exhausted });
    });
  }
  return out;
}

export function approvedIds(state) {
  return approvedSlots(state).map((s) => s.card);
}

export function freeSlots(state, row) {
  const out = [];
  state.board[row].forEach((s, i) => {
    if (!s) out.push(i);
  });
  return out;
}

export function hasFreeSlot(state) {
  return ROWS.some((r) => freeSlots(state, r).length > 0);
}

export function leftOf(state, i) {
  return (i + 1) % state.players.length;
}
export function rightOf(state, i) {
  return (i - 1 + state.players.length) % state.players.length;
}

// Monete: il totale (giocatori + riserva) resta sempre 108.
export function payToReserve(state, playerIdx, amount) {
  const p = state.players[playerIdx];
  const paid = Math.min(p.coins, amount);
  if (paid < amount) flag(state, 'monete-insufficienti', `${p.name} doveva perdere ${amount} monete ma ne aveva ${p.coins}`);
  p.coins -= paid;
  state.reserve += paid;
  return paid;
}

export function takeFromReserve(state, playerIdx, amount) {
  const got = Math.min(state.reserve, amount);
  if (got < amount) flag(state, 'riserva-esaurita', `La riserva aveva solo ${state.reserve} monete`);
  state.reserve -= got;
  state.players[playerIdx].coins += got;
  return got;
}

export function coinTotal(state) {
  return state.reserve + state.players.reduce((s, p) => s + p.coins, 0);
}

export function clone(state) {
  return structuredClone(state);
}
