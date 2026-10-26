// Le decisioni di Factanza sui casi aperti che cambiano il motore (risposte del 26-10-2026).
import { describe, it, expect } from 'vitest';
import { db, byName } from '../../src/data.js';
import { createGame, rng } from '../../src/engine/state.js';
import { playTurn, randomAgent } from '../../src/engine/game.js';
import { scoreThinker } from '../../src/engine/scoring.js';

const resolved = [];

describe('caso 7: Michelangelo conta un Progetto per ogni costo distinto', () => {
  const michelangelo = byName('thinker', 'Michelangelo');
  const byCost = (c, skip = 0) => db.projectList.filter((p) => p.costo === c)[skip].id;
  const final = (cards) => ({ approved: cards.map((card) => ({ card, row: 'principali' })), archive: [], resolved, projectDeckCount: 10, tension: 0 });
  // due costi ripetuti almeno due volte nel mazzo e un terzo costo, per l'esempio del documento (2, 2, 5, 7)
  const costi = [...new Set(db.projectList.map((p) => p.costo))].filter((c) => db.projectList.filter((p) => p.costo === c).length >= 2);

  it('costi a, a, b, c → 3 costi distinti = 9 PV', () => {
    const [a, b, c] = costi;
    const r = scoreThinker(michelangelo, final([byCost(a), byCost(a, 1), byCost(b), byCost(c)]), db);
    expect(r.pv).toBe(9);
    expect(r.righe).toHaveLength(3);
  });

  it('due Progetti con lo stesso costo valgono 3 PV, non 0', () => {
    const [a] = costi;
    expect(scoreThinker(michelangelo, final([byCost(a), byCost(a, 1)]), db).pv).toBe(3);
  });
});

// Agente che segue un copione e per il resto sceglie a caso.
function scripted(over) {
  return { ...randomAgent(rng(1)), ...over };
}

describe('caso 3: la seconda carta della Promessa Elettorale attiva il suo effetto', () => {
  it('Università private (effetto: Tensione +1) piazzata con la Promessa fa salire la Tensione', () => {
    const s = createGame(db, { players: ['A', 'B', 'C'], seed: 3, leader: 0 });
    const prima = db.projectList.find((p) => !p.effetto && p.costo <= 4).id;
    const seconda = byName('project', 'Università private').id;
    expect(db.projects[seconda].effetto).toBe('tensione');
    expect(db.board.provvisori[1].effetto).toBe('promessa');
    s.decks.projects = s.decks.projects.filter((id) => id !== prima && id !== seconda);
    s.revealed.projects = [prima, seconda, ...s.revealed.projects.filter((id) => id !== prima && id !== seconda)].slice(0, 4);
    const agent = scripted({
      chooseProject: () => prima,
      bids: (st) => st.players.map((_, i) => (i === 0 ? db.projects[prima].costo : 0)),
      chooseSlot: () => ({ row: 'provvisori', index: 1 }),
      choose: (st, d, key, options) => (key === 'promessa' ? seconda : options[0]),
      chooseRefreshDeck: () => 'projects',
    });
    playTurn(s, db, agent);
    expect(s.board.provvisori[2]?.card).toBe(seconda);
    expect(s.tension).toBeGreaterThanOrEqual(1);
    expect(s.log.some((l) => l.startsWith('Effetto speciale della seconda carta: tensione'))).toBe(true);
  });
});

describe('caso 6: tabellone pieno e nessun Evento risolvibile → la Tensione sale di 1', () => {
  function pieno(varianti) {
    const s = createGame(db, { players: ['A', 'B', 'C'], seed: 5, leader: 0 });
    for (const row of ['fondanti', 'principali', 'provvisori'])
      s.board[row] = s.board[row].map(() => ({ card: s.decks.projects.shift(), exhausted: false }));
    if (varianti) s.varianti = varianti;
    // nessuna risoluzione scelta = nessun Evento risolvibile
    playTurn(s, db, scripted({ chooseResolution: () => null, chooseRefreshDeck: () => 'events' }));
    return s;
  }

  it('regola ufficiale: la Tensione sale e la partita prosegue', () => {
    const s = pieno();
    expect(s.tension).toBe(1);
    expect(s.status).toBe('playing');
    expect(s.flags.some((f) => f.id === 'stallo-tabellone-pieno')).toBe(true);
  });

  it('variante "blocco" (regolamento stampato): la Tensione non sale', () => {
    const s = pieno({ stallo: 'blocco' });
    expect(s.tension).toBe(0);
    expect(s.stall).toBe(1);
  });
});
