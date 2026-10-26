// Valuta il bot su un file di domande TSV (domanda<TAB>etichette).
// Uso: node tools/eval.mjs test/kb/questions-blind.tsv [--semantico] [--dettagli]
// Senza --dettagli stampa solo i totali per categoria (per non "sbirciare" il set cieco).
import fs from 'node:fs';
import { answer } from '../src/chat/router.js';
import { loadSemantic } from './semantic/node-model.mjs';
if (process.argv.includes('--semantico')) loadSemantic();

const file = process.argv[2];
const details = process.argv.includes('--dettagli');
const rows = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => l.split('\t'));

const cat = (exp) => (exp.includes('non-so') ? 'non-so' : exp.some((e) => e.startsWith('carta:')) && !exp.some((e) => !e.startsWith('carta:') && e !== 'calcolo') ? 'carte' : exp.includes('calcolo') ? 'calcolo' : 'regole');
const stats = {};
const fails = [];
for (const [q, e] of rows) {
  const a = answer(q);
  const exp = e.split('|');
  const confident = !['chiarimento', 'non-so', 'vuoto', 'fuori'].includes(a.type);
  const lab = a.type === 'carta' ? `carta:${a.id}:${a.focus}` : a.type === 'regola' || a.type === 'ambiguita' || a.type === 'fuori' ? a.id : a.type;
  const good = exp.some((x) => {
    if (x.startsWith('carta:')) {
      const [, id, f] = x.split(':');
      return a.type === 'carta' && a.id === id && (!f || f === 'tutto' || a.focus === f);
    }
    if (x === 'non-so') return !confident;
    return x === lab || (a.ambiguities || []).includes(x);
  });
  const helpful = !good && a.type === 'chiarimento' && (a.suggestions || []).some((s) => exp.includes(s.id));
  const c = cat(exp);
  stats[c] ??= { n: 0, ok: 0, chiarimentoUtile: 0, sicureSbagliate: 0 };
  stats.tot ??= { n: 0, ok: 0, chiarimentoUtile: 0, sicureSbagliate: 0 };
  for (const s of [stats[c], stats.tot]) {
    s.n++;
    if (good) s.ok++;
    else if (helpful) s.chiarimentoUtile++;
    else if (confident) s.sicureSbagliate++;
  }
  if (!good) fails.push(`${confident ? '!!' : '  '} ${q} | atteso ${e} | ottenuto ${lab}`);
}
for (const [k, s] of Object.entries(stats))
  console.log(`${k.padEnd(8)} ${String(s.ok).padStart(3)}/${String(s.n).padEnd(3)} = ${((100 * s.ok) / s.n).toFixed(1).padStart(5)}%   chiarimento utile ${s.chiarimentoUtile}   sicure ma sbagliate ${s.sicureSbagliate} (${((100 * s.sicureSbagliate) / s.n).toFixed(1)}%)`);
if (details) fails.forEach((f) => console.log(f));
