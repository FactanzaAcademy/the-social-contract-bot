// Gli esempi ufficiali del regolamento (pag. 13, 16-18, 20-21) devono tornare identici.
import { describe, it, expect } from 'vitest';
import { db, byName } from '../../src/data.js';
import { resolveBids } from '../../src/engine/bidding.js';
import { solveEvent } from '../../src/engine/events.js';
import { scoreThinker } from '../../src/engine/scoring.js';

const P = (n) => byName('project', n).id;
const E = (n) => byName('event', n).id;
const T = (n) => byName('thinker', n);

describe('esempi di turno', () => {
  it('pag. 13: Progetto costo 7 in uno spazio Fondante richiede almeno 10 monete', () => {
    expect(resolveBids({ offers: [6, 4], cost: 7, currentLeader: 0 }).canFondante).toBe(true);
    expect(resolveBids({ offers: [5, 4, 0], cost: 7, currentLeader: 0 }).total).toBe(9);
    expect(resolveBids({ offers: [5, 4, 0], cost: 7, currentLeader: 0 }).canFondante).toBe(false);
  });

  it('pag. 16: Sorveglianza biometrica (costo 4), gruppo offre 6, Andrea 3 (1 più di Bianca) → approvato, Andrea Leader', () => {
    const cost = byName('project', 'Sistema di sorveglianza biometrica').costo;
    expect(cost).toBe(4);
    // Bianca(0, Leader) 2, Andrea(1) 3, Matteo(2) 1
    const r = resolveBids({ offers: [2, 3, 1], cost, currentLeader: 0 });
    expect(r).toMatchObject({ approved: true, newLeader: 1, total: 6 });
  });

  it('pag. 17: Aumento delle disuguaglianze risolto con Satelliti militari + Rete stradale + Università private', () => {
    const ev = db.events[E('Aumento delle disuguaglianze')];
    const slots = [
      { row: 'fondanti', index: 0, card: P('Satelliti militari') },
      { row: 'principali', index: 0, card: P('Rete stradale') },
      { row: 'provvisori', index: 0, card: P('Università private') },
    ];
    const s = solveEvent(ev, slots, db);
    expect(s.resolvable).toBe(true);
    expect(s.combos[0].map((x) => x.card).sort()).toEqual(slots.map((x) => x.card).sort());
  });

  it('pag. 18: offerta totale 3 su costo 4 → fallito, Tensione +1', () => {
    const r = resolveBids({ offers: [1, 1, 1], cost: 4, currentLeader: 2 });
    expect(r).toMatchObject({ approved: false, tensionIncrease: 1, coinsToReserve: 0, newLeader: 2 });
  });
});

describe('esempio di punteggio pag. 20-21', () => {
  const resolved = ['Aumento delle disuguaglianze', 'Inverno demografico', 'Disastro climatico', 'Primi passi', 'Costo della vita'].map(E);

  it('Bianca: Gandhi 7 PV + Sun Tzu 6 PV = 13', () => {
    const final = { approved: [], archive: ['a', 'b', 'c'], resolved, projectDeckCount: 10, tension: 2 };
    expect(scoreThinker(T('Gandhi'), final, db).pv).toBe(7);
    expect(scoreThinker(T('Sun Tzu'), final, db).pv).toBe(6);
  });

  it('Matteo: Curie 15 PV (5 con effetto) + Nietzsche 7 PV (8 approvati) = 22', () => {
    const withEffect = ['Centri di detenzione', 'Satelliti militari', 'Rete stradale', 'Sistema di sorveglianza', 'M.O.R.T.O.'].map(P);
    withEffect.forEach((id) => expect(db.projects[id].effetto).not.toBeNull());
    const filler = db.projectList.filter((p) => !p.effetto).slice(0, 3).map((p) => p.id);
    const approved = [...withEffect, ...filler].map((card, i) => ({ card, row: i < 2 ? 'fondanti' : i < 7 ? 'principali' : 'provvisori' }));
    const final = { approved, archive: [], resolved, projectDeckCount: 10, tension: 2 };
    expect(scoreThinker(T('Curie'), final, db).pv).toBe(15);
    expect(scoreThinker(T('Nietzsche'), final, db).pv).toBe(7);
  });

  it('Andrea: Hetty Green conta i Progetti di costo < 5. Il regolamento ne elenca 5 (20 PV) ma M.O.R.T.O. costa 10: con le carte reali sono 16 PV', () => {
    const names = ['asili nido', 'batterie per auto', 'Rete stradale', 'Sistema di sorveglianza', 'M.O.R.T.O.'];
    const approved = names.map((n) => ({ card: P(n), row: 'principali' }));
    const r = scoreThinker(T('Hetty Green'), { approved, archive: [], resolved, projectDeckCount: 10, tension: 2 }, db);
    expect(byName('project', 'M.O.R.T.O.').costo).toBe(10);
    expect(r.pv).toBe(16);
  });

  it('Andrea: Toussaint 0 PV perché M.O.R.T.O. (pubblico+innovazione) è Provvisorio', () => {
    const morto = byName('project', 'M.O.R.T.O.');
    expect(Object.values(morto.ideologie)).toEqual(expect.arrayContaining(['pubblico', 'innovazione']));
    const final = { approved: [{ card: morto.id, row: 'provvisori' }], archive: [], resolved, projectDeckCount: 10, tension: 2 };
    expect(scoreThinker(T('Toussaint'), final, db).pv).toBe(0);
    final.approved[0].row = 'principali';
    expect(scoreThinker(T('Toussaint'), final, db).pv).toBe(3);
    final.approved[0].row = 'fondanti';
    expect(scoreThinker(T('Toussaint'), final, db).pv).toBe(6);
  });

  it('pag. 8: Amrita conta preservazione + pubblico', () => {
    expect(T('Amrita').obiettivo.ideologie.sort()).toEqual(['preservazione', 'pubblico']);
  });
});
