// Sceglie peso e soglie dell'abbinamento ibrido sui set di SVILUPPO.
// Obiettivo: risposte giuste − 3 × risposte sicure ma sbagliate. Ci mette qualche minuto.
import { SEM } from '../../src/chat/router.js';
import { score, rows } from './tune-score.mjs';

const grid = { w: [0.2, 0.35, 0.5], sure: [0.85, 0.95, 1.05], margin: [0.03, 0.06, 0.1], certain: [1.15, 1.3], clarify: [0.65, 0.75], off: [0.55, 0.62, 0.68] };
const keys = Object.keys(grid);
const combos = keys.reduce((acc, k) => acc.flatMap((c) => grid[k].map((v) => ({ ...c, [k]: v }))), [{}]);
console.log(`${rows.length} domande di sviluppo, ${combos.length} combinazioni`);
let best = null;
for (const c of combos) {
  Object.assign(SEM, c);
  const r = score();
  if (!best || r.obj > best.r.obj) best = { c, r };
}
console.log('migliore:', JSON.stringify(best.c), best.r, `giuste ${((100 * best.r.ok) / best.r.n).toFixed(1)}%, sicure-sbagliate ${((100 * best.r.wrong) / best.r.n).toFixed(1)}%`);
