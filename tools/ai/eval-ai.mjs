// Misura la strada A (Haiku sceglie tra le voci) su un set di domande, chiamando l'API davvero.
// Confronta: solo ricerca locale · solo Haiku · Haiku + locale (come nel bot).
// Uso: node tools/ai/eval-ai.mjs test/kb/questions-final.tsv [--dettagli]
// Chiave: ANTHROPIC_API_KEY nell'ambiente oppure nel file bot/.env (mai nel codice).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { loadSemantic } from '../semantic/node-model.mjs';
import { propose, mergeProposals } from '../../src/chat/router.js';
import { aiPropose } from '../../src/ai/haiku.js';
import { buildCatalog } from './build-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (!process.env.ANTHROPIC_API_KEY && fs.existsSync(path.join(root, '.env'))) {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Manca ANTHROPIC_API_KEY: crea bot/.env con la riga ANTHROPIC_API_KEY=sk-ant-... (il file è in .gitignore).');
  process.exit(1);
}

const file = process.argv[2];
const details = process.argv.includes('--dettagli');
const rows = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
  const [q, e] = l.split('\t');
  return { q, exp: e.split('|') };
});

loadSemantic();
const catalog = buildCatalog();
const client = new Anthropic();

const hit = (k, x) => {
  if (x.startsWith('carta:')) {
    const [, id, f] = x.split(':');
    return k.startsWith(`carta:${id}:`) && (!f || f === 'tutto' || k === `carta:${id}:${f}`);
  }
  return k === x;
};
const pos = (keys, exp) => keys.findIndex((k) => exp.some((x) => hit(k, x)));

console.log(`${rows.length} domande. Stima di spesa: circa $${(rows.length * 0.0002).toFixed(2)} (con la cache calda).`);

const res = [];
let i = 0;
async function worker() {
  while (i < rows.length) {
    const row = rows[i++];
    const local = propose(row.q);
    let ai;
    try {
      ai = await aiPropose(client, catalog, row.q);
    } catch (e) {
      ai = { keys: [], fuoriTema: false, costo: 0, ms: 0, errore: e.status || e.message };
    }
    const merged = mergeProposals(ai.keys, ai.fuoriTema, local);
    res.push({ ...row, local: local.options.map((o) => o.key), localType: local.type, ai, merged: merged.options.map((o) => o.key), mergedType: merged.type });
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

const inTema = res.filter((r) => !r.exp.every((x) => x === 'non-so'));
const fuori = res.filter((r) => r.exp.every((x) => x === 'non-so'));
const pct = (a, b) => `${((100 * a) / b).toFixed(1)}%`;
for (const [nome, get] of [['solo locale', (r) => r.local], ['solo Haiku', (r) => r.ai.keys], ['Haiku + locale', (r) => r.merged]]) {
  const found = inTema.filter((r) => pos(get(r), r.exp) >= 0).length;
  const first = inTema.filter((r) => pos(get(r), r.exp) === 0).length;
  console.log(`${nome.padEnd(15)} voce giusta tra le proposte ${found}/${inTema.length} = ${pct(found, inTema.length)}   prima proposta ${pct(first, inTema.length)}`);
}
const offOk = fuori.filter((r) => r.mergedType === 'non-so').length;
console.log(`fuori tema con "non trovo" (Haiku + locale): ${offOk}/${fuori.length}`);
const costo = res.reduce((s, r) => s + (r.ai.costo || 0), 0);
const ms = res.map((r) => r.ai.ms).filter(Boolean).sort((a, b) => a - b);
const errori = res.filter((r) => r.ai.errore).length;
console.log(`spesa reale $${costo.toFixed(4)} ($${(costo / res.length).toFixed(5)} a domanda) · latenza mediana ${ms[Math.floor(ms.length / 2)]} ms, 95° percentile ${ms[Math.floor(ms.length * 0.95)]} ms · errori API ${errori}`);
fs.mkdirSync(path.join(root, 'test/out'), { recursive: true });
fs.writeFileSync(path.join(root, `test/out/ai-${path.basename(file, '.tsv')}.json`), JSON.stringify(res, null, 1));
if (details) for (const r of inTema) if (pos(r.merged, r.exp) < 0) console.log(`  ${r.q} | atteso ${r.exp.join('|')} | proposte ${r.merged.join(', ') || '(nessuna)'}`);
