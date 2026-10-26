// Taratura onesta delle soglie sul set cieco nuovo, diviso in due metà fisse:
//   righe dispari → TARATURA (si scelgono peso e soglie)
//   righe pari    → VERIFICA (misurata una volta, con le soglie scelte; mai usata per scegliere)
// Uso: node tools/semantic/calibrate.mjs test/kb/questions-semantic-blind.tsv
import fs from 'node:fs';
import { loadSemantic } from './node-model.mjs';
import { answer, SEM } from '../../src/chat/router.js';

loadSemantic();
const file = process.argv[2];
const all = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
  const [q, e] = l.split('\t');
  return { q, exp: e.split('|') };
});
const calib = all.filter((_, i) => i % 2 === 1);
const test = all.filter((_, i) => i % 2 === 0);

function score(rows) {
  let ok = 0, wrong = 0, clar = 0;
  for (const { q, exp } of rows) {
    const a = answer(q);
    const confident = !['chiarimento', 'non-so', 'vuoto', 'fuori'].includes(a.type);
    const lab = a.type === 'carta' ? `carta:${a.id}:${a.focus}` : ['regola', 'ambiguita', 'fuori'].includes(a.type) ? a.id : a.type;
    const good = exp.some((x) => {
      if (x.startsWith('carta:')) {
        const [, id, f] = x.split(':');
        return a.type === 'carta' && a.id === id && (!f || f === 'tutto' || a.focus === f);
      }
      if (x === 'non-so') return !confident;
      return x === lab || (a.ambiguities || []).includes(x);
    });
    if (good) ok++;
    else if (a.type === 'chiarimento' && a.suggestions?.some((s) => exp.includes(s.id))) clar++;
    else if (confident) wrong++;
  }
  return { n: rows.length, ok, clar, wrong };
}
const fmt = (r) => `giuste ${((100 * r.ok) / r.n).toFixed(1)}%  entro un clic ${((100 * (r.ok + r.clar)) / r.n).toFixed(1)}%  sicure-sbagliate ${((100 * r.wrong) / r.n).toFixed(1)}%  (n=${r.n})`;

const before = { ...SEM };
console.log('soglie attuali   TARATURA:', fmt(score(calib)));
const grid = { w: [0.2, 0.35, 0.5], sure: [0.85, 0.95, 1.05, 1.15], margin: [0.03, 0.06, 0.1], certain: [1.3, 1.45, 1.6], clarify: [0.6, 0.65, 0.75] };
const keys = Object.keys(grid);
const combos = keys.reduce((acc, k) => acc.flatMap((c) => grid[k].map((v) => ({ ...c, [k]: v }))), [{}]);
let best = null;
for (const c of combos) {
  Object.assign(SEM, before, c);
  const r = score(calib);
  const obj = r.ok + 0.5 * r.clar - 3 * r.wrong;
  if (!best || obj > best.obj) best = { c, r, obj };
}
Object.assign(SEM, before, best.c);
console.log('scelte sulla TARATURA:', JSON.stringify(best.c), fmt(best.r));
console.log('VERIFICA (una volta):', fmt(score(test)));
console.log('soglie attuali   VERIFICA (per confronto):', (() => { const keep = { ...SEM }; Object.assign(SEM, before); const r = fmt(score(test)); Object.assign(SEM, keep); return r; })());
