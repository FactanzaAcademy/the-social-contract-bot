// Quante partite simulate (su N) incontrano ogni caso aperto. Uso: node tools/frequency.mjs [N]
import { db } from '../src/data.js';
import { createGame, rng } from '../src/engine/state.js';
import { playTurn, randomAgent } from '../src/engine/game.js';
import { finalFromState, scorePlayer, winners } from '../src/engine/scoring.js';

const N = Number(process.argv[2] || 10000);
const games = {};
let won = 0;
const add = (id) => (games[id] = (games[id] || 0) + 1);
for (let g = 0; g < N; g++) {
  const n = 2 + (g % 5);
  const s = createGame(db, { players: Array.from({ length: n }, (_, i) => `G${i + 1}`), seed: g + 1, thinkersPerPlayer: 2 });
  const agent = randomAgent(rng(1000 + g));
  let t = 0;
  while (s.status === 'playing' && t++ < 300) playTurn(s, db, agent);
  new Set(s.flags.map((f) => f.id)).forEach(add);
  if (s.status === 'stalled') add('stallo-tabellone-pieno');
  if (s.status === 'won') {
    won++;
    const final = finalFromState(s);
    const scores = s.players.map((p) => scorePlayer(p.thinkers, final, db));
    if (winners(scores).length > 1) add('pareggio-vittoria');
    for (const [i, p] of s.players.entries()) {
      const mic = scores[i].parti.find((x) => x.thinker === 't13');
      if (mic && mic.interpretazioni.length) {
        const alt = Number((mic.interpretazioni[0].alternativa.match(/= (\d+) PV/) || [])[1]);
        if (alt !== mic.pv) add('michelangelo-costo-differente');
      }
      if (p.thinkers.includes('t26')) add('asso-diplomazia');
    }
  }
}
console.log(JSON.stringify({ N, won, games }, null, 1));
