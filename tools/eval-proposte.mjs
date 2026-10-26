// Modalità proposte: quante volte la voce giusta è tra le (max 3) proposte.
// Non esistono risposte "sicure ma sbagliate": il bot risponde solo dopo la scelta dell'utente.
// Uso: node tools/eval-proposte.mjs <file.tsv> [--semantico] [--dettagli]
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { propose } from '../src/chat/router.js';
import { loadSemantic } from './semantic/node-model.mjs';

if (process.argv.includes('--semantico')) loadSemantic();

export function evalRows(rows) {
  let found = 0, first = 0, offOk = 0, offN = 0;
  const miss = [];
  for (const { q, exp } of rows) {
    const p = propose(q);
    const keys = p.options.map((o) => o.key);
    const hit = (k, x) => {
      if (x.startsWith('carta:')) {
        const [, id, f] = x.split(':');
        return k.startsWith(`carta:${id}:`) && (!f || f === 'tutto' || k === `carta:${id}:${f}`);
      }
      return k === x;
    };
    const onlyOff = exp.every((x) => x === 'non-so');
    if (onlyOff) {
      offN++;
      // fuori tema: va bene "non trovo" oppure proposte che l'utente può scartare con "Nessuna di queste"
      if (p.type === 'non-so') offOk++;
      continue;
    }
    const idx = keys.findIndex((k) => exp.some((x) => hit(k, x)));
    if (idx >= 0) found++;
    if (idx === 0) first++;
    if (idx < 0) miss.push(`${q} | atteso ${exp.join('|')} | proposte ${keys.join(', ') || '(nessuna)'}`);
  }
  const n = rows.length - offN;
  return { n, found, first, offN, offOk, miss };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [q, e] = l.split('\t');
    return { q, exp: e.split('|') };
  });
  const r = evalRows(rows);
  const pct = (a, b) => ((100 * a) / b).toFixed(1) + '%';
  console.log(`voce giusta tra le proposte ${r.found}/${r.n} = ${pct(r.found, r.n)}  (prima proposta: ${pct(r.first, r.n)})  fuori tema con "non trovo": ${r.offOk}/${r.offN}`);
  if (process.argv.includes('--dettagli')) r.miss.forEach((m) => console.log('  ' + m));
}
