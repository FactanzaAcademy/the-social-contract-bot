// Risoluzione degli Eventi (pag. 15): solutore esaustivo sulle combinazioni di Progetti in tabellone.
import { RESOURCES } from './state.js';

// Un Progetto è utilizzabile se è in tabellone (non in Archivio) e non ha il segnalino
// "Mancanza di Risorse". I Fondanti non si esauriscono mai (pag. 13).
export function usableSlots(slots) {
  return slots.filter((s) => !s.exhausted);
}

export function isFanEvent(ev) {
  return (ev.requisiti.carte || 0) > 0;
}

export function requirementText(ev) {
  if (isFanEvent(ev)) return `${ev.requisiti.carte} Carte Progetto qualsiasi`;
  return RESOURCES.filter((r) => ev.requisiti[r] > 0)
    .map((r) => `${ev.requisiti[r]} ${label(r)}`)
    .join(' + ');
}

export function label(r) {
  return { difesa: 'Difesa e Sicurezza', economia: 'Economia e Welfare', tecnologia: 'Tecnologia e Sopravvivenza' }[r] || r;
}

function sumResources(combo, db) {
  const tot = { difesa: 0, economia: 0, tecnologia: 0 };
  for (const s of combo) {
    const p = db.projects[s.card];
    tot[p.risorsa.tipo] += p.risorsa.valore;
  }
  return tot;
}

export function comboSatisfies(ev, combo, db) {
  if (isFanEvent(ev)) return combo.length >= ev.requisiti.carte;
  const tot = sumResources(combo, db);
  return RESOURCES.every((r) => tot[r] >= (ev.requisiti[r] || 0));
}

// Tutte le combinazioni MINIMALI (nessuna carta superflua) che risolvono l'evento.
// slots: [{row,index,card,exhausted}]. Ordinate per "costo" di consumo: prima quelle
// che usano Fondanti (gratis), poi meno carte Principali/Provvisorie.
export function solveEvent(ev, slots, db, { limit = 50 } = {}) {
  const usable = usableSlots(slots);
  const n = usable.length;
  if (n > 16) throw new Error('Troppi progetti per il solutore');
  const valid = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    const combo = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) combo.push(usable[i]);
    if (!comboSatisfies(ev, combo, db)) continue;
    // minimale: togliendo qualsiasi carta non basta più
    const minimal = combo.every((_, k) => !comboSatisfies(ev, combo.filter((__, j) => j !== k), db));
    if (minimal) valid.push(combo);
  }
  const consumes = (c) => c.filter((s) => s.row !== 'fondanti').length;
  valid.sort((a, b) => consumes(a) - consumes(b) || a.length - b.length);
  return { resolvable: valid.length > 0, combos: valid.slice(0, limit), totalCombos: valid.length };
}

// Cosa manca per risolvere l'evento usando TUTTE le risorse disponibili.
export function shortfall(ev, slots, db) {
  const usable = usableSlots(slots);
  if (isFanEvent(ev)) {
    const miss = ev.requisiti.carte - usable.length;
    return miss > 0 ? { carte: miss } : null;
  }
  const tot = sumResources(usable, db);
  const out = {};
  for (const r of RESOURCES) if ((ev.requisiti[r] || 0) > tot[r]) out[r] = ev.requisiti[r] - tot[r];
  return Object.keys(out).length ? out : null;
}

export function resolvableEvents(state, db) {
  const slots = [];
  for (const row of ['fondanti', 'principali', 'provvisori'])
    state.board[row].forEach((s, index) => s && slots.push({ row, index, card: s.card, exhausted: !!s.exhausted }));
  return state.revealed.events
    .map((id) => ({ id, ...solveEvent(db.events[id], slots, db, { limit: 5 }) }))
    .filter((x) => x.resolvable);
}
