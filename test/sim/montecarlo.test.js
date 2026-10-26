// Simulatore Monte Carlo: migliaia di partite complete con scelte casuali.
// Controlla gli invarianti e raccoglie le ambiguità che il motore ha dovuto interpretare.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { db } from '../../src/data.js';
import { createGame, rng, coinTotal, approvedSlots, TOTAL_COINS } from '../../src/engine/state.js';
import { playTurn, randomAgent } from '../../src/engine/game.js';
import { finalFromState, scorePlayer } from '../../src/engine/scoring.js';
import ambig from '../../src/kb/ambiguities.json' with { type: 'json' };

const GAMES = Number(process.env.SIM_GAMES || 10000);
const knownAmbiguities = new Set(ambig.ambiguities.map((a) => a.id));

function checkInvariants(s, prevTension) {
  if (coinTotal(s) !== TOTAL_COINS) throw new Error(`Monete non conservate: ${coinTotal(s)}`);
  if (s.players.some((p) => p.coins < 0) || s.reserve < 0) throw new Error('Monete negative');
  if (s.tension < prevTension) throw new Error('La Tensione è scesa');
  if (approvedSlots(s).length > 12) throw new Error('Più di 12 Progetti in tabellone');
  const proj = [...s.decks.projects, ...s.revealed.projects, ...approvedSlots(s).map((x) => x.card), ...s.archive, ...s.outOfGame.projects];
  if (proj.length !== 39 || new Set(proj).size !== 39) throw new Error(`Progetti persi o duplicati: ${proj.length}`);
  const ev = [...s.decks.events, ...s.revealed.events, ...s.resolved, ...s.outOfGame.events];
  if (ev.length !== 23 || new Set(ev).size !== 23) throw new Error(`Eventi persi o duplicati: ${ev.length}`);
  if (s.status === 'playing') {
    if (s.revealed.projects.length !== 4) throw new Error(`Progetti scoperti: ${s.revealed.projects.length}`);
    if (s.revealed.events.length !== 3) throw new Error(`Eventi scoperti: ${s.revealed.events.length}`);
  }
}

describe('Monte Carlo', () => {
  it(`${GAMES} partite complete senza violazioni`, () => {
    const outcomes = {};
    const flags = {};
    for (let g = 0; g < GAMES; g++) {
      const n = 2 + (g % 5);
      const rand = rng(1000 + g);
      const s = createGame(db, { players: Array.from({ length: n }, (_, i) => `G${i + 1}`), seed: g + 1, thinkersPerPlayer: 2 });
      const agent = randomAgent(rand);
      let prev = 0;
      let turns = 0;
      while (s.status === 'playing' && turns++ < 300) {
        try {
          playTurn(s, db, agent);
          checkInvariants(s, prev);
        } catch (e) {
          throw new Error(`Partita ${g}, turno ${s.turn}: ${e.message}\n${s.log.slice(-15).join('\n')}`);
        }
        prev = s.tension;
      }
      outcomes[s.status] = (outcomes[s.status] || 0) + 1;
      for (const f of s.flags) flags[f.id] = (flags[f.id] || 0) + 1;
      if (s.status === 'won') {
        const final = finalFromState(s);
        for (const p of s.players) {
          const sc = scorePlayer(p.thinkers, final, db);
          expect(Number.isFinite(sc.totale)).toBe(true);
        }
      }
    }
    // Ogni interpretazione usata dal motore deve essere documentata nel registro.
    for (const id of Object.keys(flags)) expect(knownAmbiguities.has(id), `ambiguità non registrata: ${id}`).toBe(true);
    fs.mkdirSync('test/out', { recursive: true });
    fs.writeFileSync('test/out/montecarlo.json', JSON.stringify({ games: GAMES, outcomes, flags }, null, 2));
    expect(outcomes.won).toBeGreaterThan(0);
    expect(outcomes.lost).toBeGreaterThan(0);
  }, 300000);
});
