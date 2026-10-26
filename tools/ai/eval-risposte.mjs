// Misura la modalità risposta (Haiku risponde nel merito) su un set di domande, chiamando l'API davvero.
// Conta: fonte giusta tra quelle indicate, risposte date su domande fuori tema, domande in tema senza risposta.
// Stampa ogni risposta per la revisione a occhio. Uso: [EFFORT=low] node tools/ai/eval-risposte.mjs <file.tsv> [quante]
// Chiave: ANTHROPIC_API_KEY nell'ambiente oppure in bot/.env.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { aiRispondi } from '../../src/ai/haiku.js';
import { buildCatalog } from './build-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (!process.env.ANTHROPIC_API_KEY && fs.existsSync(path.join(root, '.env'))) {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error('Manca ANTHROPIC_API_KEY (bot/.env)');

const [file, quante = '40'] = process.argv.slice(2);
const all = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
  const [q, e] = l.split('\t');
  return { q, exp: e.split('|') };
});
const off = all.filter((r) => r.exp.every((x) => x === 'non-so'));
const on = all.filter((r) => !off.includes(r));
const passo = Math.max(1, Math.floor(on.length / Number(quante)));
const rows = [...on.filter((_, i) => i % passo === 0).slice(0, Number(quante)), ...off]; // campione regolare, non scelto

const client = new Anthropic();
const catalog = buildCatalog();
const hit = (k, x) => (x.startsWith('carta:') ? k.startsWith(`carta:${x.split(':')[1]}:`) : k === x);
let fonteOk = 0, nOn = 0, senza = 0, nOff = 0, offRisposte = 0, costo = 0, ms = 0;
for (const { q, exp } of rows) {
  const r = await aiRispondi(client, catalog, q, { effort: process.env.EFFORT || 'medium' });
  costo += r.costo;
  ms += r.ms;
  const isOff = exp.every((x) => x === 'non-so');
  if (isOff) {
    nOff++;
    if (r.trovata) offRisposte++;
  } else {
    nOn++;
    if (!r.trovata) senza++;
    else if (r.keys.some((k) => exp.some((x) => hit(k, x)))) fonteOk++;
  }
  const stato = isOff ? (r.trovata ? 'FUORI TEMA CON RISPOSTA' : 'fuori tema ok') : !r.trovata ? 'SENZA RISPOSTA' : r.keys.some((k) => exp.some((x) => hit(k, x))) ? 'ok' : 'FONTE DIVERSA';
  console.log(`\n[${stato}] ${q}\n  atteso ${exp.join('|')} · fonti ${r.keys.join(', ') || '-'}${r.fuoriTema ? ' · fuori tema' : ''}\n  ${r.risposta.replace(/\n/g, ' ') || '(nessuna risposta)'}`);
}
const pct = (a, b) => `${((100 * a) / Math.max(b, 1)).toFixed(1)}%`;
console.log(`\nIn tema: ${nOn} · con risposta e fonte giusta ${fonteOk} (${pct(fonteOk, nOn)}) · senza risposta ${senza} (${pct(senza, nOn)})`);
console.log(`Fuori tema: ${nOff} · con risposta ${offRisposte}`);
console.log(`Costo $${costo.toFixed(4)} · tempo medio ${(ms / rows.length / 1000).toFixed(1)} s`);
