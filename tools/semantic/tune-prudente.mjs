// Variante prudente della taratura: ogni risposta sicura ma sbagliata costa 6 risposte giuste.
// Criterio deciso PRIMA di guardare il set cieco nuovo (20-10-2026), solo sui set di sviluppo.
import { SEM } from '../../src/chat/router.js';
import { score } from './tune-score.mjs';

const grid = { w: [0.35, 0.5], sure: [0.85, 0.95, 1.05, 1.15], margin: [0.03, 0.06, 0.1], certain: [1.3, 1.45] };
const keys = Object.keys(grid);
const combos = keys.reduce((acc, k) => acc.flatMap((c) => grid[k].map((v) => ({ ...c, [k]: v }))), [{}]);
let best = null;
for (const c of combos) {
  Object.assign(SEM, c);
  const r = score();
  const obj = r.ok - 6 * r.wrong;
  if (!best || obj > best.obj) best = { c, r, obj };
}
console.log('prudente:', JSON.stringify(best.c), best.r, `giuste ${((100 * best.r.ok) / best.r.n).toFixed(1)}%, sicure-sbagliate ${((100 * best.r.wrong) / best.r.n).toFixed(1)}%`);
