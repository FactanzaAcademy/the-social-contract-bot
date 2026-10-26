// Confronta le varianti di regola per i casi aperti più importanti su N partite simulate.
// Uso: node tools/varianti.mjs [N]
import { db } from '../src/data.js';
import { createGame, rng } from '../src/engine/state.js';
import { playTurn, randomAgent } from '../src/engine/game.js';

const N = Number(process.argv[2] || 10000);
function run(varianti) {
  const out = { won: 0, lost: 0, stalled: 0, turni: 0, persaTensione: 0, persaMazzo: 0 };
  for (let g = 0; g < N; g++) {
    const n = 2 + (g % 5);
    const s = createGame(db, { players: Array.from({ length: n }, (_, i) => `G${i + 1}`), seed: g + 1, thinkersPerPlayer: 2 });
    s.varianti = varianti;
    const agent = randomAgent(rng(1000 + g));
    let t = 0;
    while (s.status === 'playing' && t++ < 300) playTurn(s, db, agent);
    out[s.status]++;
    out.turni += s.turn;
    if (s.status === 'lost') /Tensione/.test(s.endReason) ? out.persaTensione++ : out.persaMazzo++;
  }
  const p = (x) => `${((100 * x) / N).toFixed(1)}%`;
  return `vinte ${p(out.won)} · perse per Tensione ${p(out.persaTensione)} · perse per mazzo finito ${p(out.persaMazzo)} · bloccate ${p(out.stalled)} · turni medi ${(out.turni / N).toFixed(1)}`;
}
for (const [nome, v] of [
  ['regole ufficiali (decisioni del 26-10-2026)', {}],
  ['carta del Colpo di scena in fondo al mazzo', { colpoCarta: 'fondo' }],
  ['un innesco risolve tutti gli Eventi possibili', { risoluzione: 'tutte' }],
  ['regolamento stampato: la partita resta bloccata', { stallo: 'blocco' }],
]) console.log(`${nome.padEnd(48)} ${run(v)}`);
