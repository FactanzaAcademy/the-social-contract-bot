// Punteggio del bot (con comprensione semantica) sui set di SVILUPPO: usato da tune.mjs.
// Obiettivo: risposte giuste − 3 × risposte sicure ma sbagliate.
import fs from 'node:fs';
import { loadSemantic } from './node-model.mjs';
import { answer, SEM } from '../../src/chat/router.js';
import { generate } from '../../test/kb/generate-card-questions.js';

loadSemantic();
const DEV = ['test/kb/questions-rules.tsv', 'test/kb/questions-holdout.tsv', 'test/kb/questions-blind.tsv'];
export const rows = DEV.flatMap((f) =>
  fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [q, e] = l.split('\t');
    return { q, exp: e.split('|') };
  }),
).concat(generate().filter((_, i) => i % 3 === 0).map((x) => ({ q: x.q, exp: [x.expect] })));

export function score(rowsToUse = rows) {
  let ok = 0, wrong = 0, clar = 0;
  for (const { q, exp } of rowsToUse) {
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
    else if (confident) wrong++;
    else if (a.type === 'chiarimento' && a.suggestions?.some((s) => exp.includes(s.id))) clar++;
  }
  return { ok, wrong, clar, n: rowsToUse.length, obj: ok - 3 * wrong };
}

