// Test esaustivi: asta contro un oracolo indipendente, Eventi contro tutti i tabelloni,
// Pensatori contro ricalcolo diretto.
import { describe, it, expect } from 'vitest';
import { db } from '../../src/data.js';
import { resolveBids } from '../../src/engine/bidding.js';
import { solveEvent, comboSatisfies, usableSlots } from '../../src/engine/events.js';
import { scoreThinker } from '../../src/engine/scoring.js';
import { rng, shuffle } from '../../src/engine/state.js';

// Oracolo scritto in modo diverso dall'implementazione (ordinamento invece di max/filter).
function oracle(offers, cost, leader) {
  const sorted = offers.map((o, i) => ({ o, i })).sort((a, b) => b.o - a.o);
  const total = offers.reduce((a, b) => a + b, 0);
  const tie = sorted.length > 1 && sorted[0].o === sorted[1].o;
  return { approved: total >= cost, canFondante: total - cost >= 3, newLeader: tie ? leader : sorted[0].i };
}

function* allOffers(n, max) {
  const cur = Array(n).fill(0);
  while (true) {
    yield cur.slice();
    let k = 0;
    while (k < n && cur[k] === max) cur[k++] = 0;
    if (k === n) return;
    cur[k]++;
  }
}

describe('asta: tutte le combinazioni', () => {
  for (const n of [2, 3, 4, 5, 6]) {
    const max = n <= 4 ? 6 : 4;
    it(`${n} giocatori, offerte 0-${max}, costi 1-12, ogni Leader`, () => {
      let count = 0;
      for (const offers of allOffers(n, max))
        for (let cost = 1; cost <= 12; cost++)
          for (let leader = 0; leader < n; leader++) {
            const r = resolveBids({ offers, cost, currentLeader: leader });
            const o = oracle(offers, cost, leader);
            if (r.approved !== o.approved || r.canFondante !== o.canFondante || r.newLeader !== o.newLeader)
              throw new Error(`Discrepanza ${JSON.stringify({ offers, cost, leader, r, o })}`);
            count++;
          }
      expect(count).toBeGreaterThan(1000);
    });
  }
});

describe('Eventi: solutore su tabelloni casuali', () => {
  const rand = rng(42);
  const rows = ['fondanti', 'fondanti', 'principali', 'principali', 'principali', 'principali', 'principali', 'provvisori', 'provvisori', 'provvisori', 'provvisori', 'provvisori'];
  it('per ogni Evento, 400 tabelloni: risolvibile ⇔ basterebbero tutte le risorse; ogni combinazione è valida e minimale', () => {
    let checks = 0;
    for (const ev of db.eventList) {
      for (let t = 0; t < 400; t++) {
        const k = Math.floor(rand() * 13);
        const cards = shuffle(db.projectList, rand).slice(0, k);
        const slots = cards.map((c, i) => ({ row: rows[i], index: i, card: c.id, exhausted: rows[i] === 'principali' && rand() < 0.3 }));
        const s = solveEvent(ev, slots, db, { limit: 1000 });
        // L'aggiunta di carte non peggiora mai: risolvibile sse l'insieme di tutte le utilizzabili basta.
        expect(s.resolvable).toBe(comboSatisfies(ev, usableSlots(slots), db));
        for (const c of s.combos) {
          expect(c.every((x) => !x.exhausted)).toBe(true);
          expect(comboSatisfies(ev, c, db)).toBe(true);
          for (let j = 0; j < c.length; j++) expect(comboSatisfies(ev, c.filter((_, i) => i !== j), db)).toBe(false);
        }
        checks++;
      }
    }
    expect(checks).toBe(23 * 400);
  });
});

describe('Pensatori: ricalcolo diretto su tabelloni casuali', () => {
  const rand = rng(7);
  const rows = ['fondanti', 'principali', 'provvisori'];
  it('ogni Pensatore × 300 fine partita', () => {
    for (const th of db.thinkerList) {
      for (let t = 0; t < 300; t++) {
        const cards = shuffle(db.projectList, rand);
        const approved = cards.slice(0, Math.floor(rand() * 13)).map((c) => ({ card: c.id, row: rows[Math.floor(rand() * 3)] }));
        const archive = cards.slice(13, 13 + Math.floor(rand() * 8)).map((c) => c.id);
        const resolved = shuffle(db.eventList, rand).slice(0, 5).map((e) => e.id);
        const final = { approved, archive, resolved, projectDeckCount: Math.floor(rand() * 30), tension: Math.floor(rand() * 8) };
        const got = scoreThinker(th, final, db).pv;
        expect(got).toBe(expected(th, final));
      }
    }
  });
});

// Calcolo di riferimento scritto direttamente dal testo delle carte.
function expected(th, f) {
  const o = th.obiettivo;
  const costs = f.approved.map((a) => db.projects[a.card].costo);
  const tiers = (v, s) => (s.find((x) => (x.cond === '<=' ? v <= x.n : v < x.n)) || { pv: 0 }).pv;
  switch (o.tipo) {
    case 'per_progetto_costo':
      if (o.op === '>') return costs.filter((c) => c > o.valore).length * o.pv;
      if (o.op === '<') return costs.filter((c) => c < o.valore).length * o.pv;
      if (o.op === 'in') return costs.filter((c) => o.valore.includes(c)).length * o.pv;
      // Michelangelo, decisione di Factanza: un Progetto per ogni costo distinto
      return new Set(costs).size * o.pv;
    case 'coppia_ideologica':
      return f.approved.reduce((s, a) => {
        const ids = Object.values(db.projects[a.card].ideologie);
        if (!o.ideologie.every((i) => ids.includes(i))) return s;
        return s + (a.row === 'fondanti' ? 6 : a.row === 'principali' ? 3 : 0);
      }, 0);
    case 'per_progetto_effetto':
      return f.approved.filter((a) => !!db.projects[a.card].effetto === o.con_effetto).length * o.pv;
    case 'oltre_n':
      return Math.max(0, f.approved.length - 5) * 4;
    case 'archivio':
      return f.archive.length * 2;
    case 'tensione':
      return f.tension <= 2 ? 25 : f.tension <= 4 ? 15 : f.tension <= 6 ? 6 : 0;
    case 'soglie': {
      const v = o.conta === 'mazzo_progetti' ? f.projectDeckCount : o.conta === 'progetti_approvati' ? f.approved.length
        : f.resolved.reduce((s, id) => s + db.events[id].requisiti[o.risorsa], 0);
      return tiers(v, o.soglie);
    }
  }
  throw new Error(o.tipo);
}
