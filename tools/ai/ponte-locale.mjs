// Ponte locale per provare la modalità risposta nel browser senza Supabase: stessa logica di
// src/ai/ponte.js, contatori in memoria, chiave da bot/.env. Le domande costano come in produzione.
// Uso (da bot/): node tools/ai/ponte-locale.mjs   → http://localhost:8787
// Poi nel bot servito su http://localhost:4173 metti in dist/config.json "ai": { "url": "http://localhost:8787" }.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { handlePonte, configDa } from '../../src/ai/ponte.js';
import { buildCatalog } from './build-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (!process.env.ANTHROPIC_API_KEY && fs.existsSync(path.join(root, '.env'))) {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error('Manca ANTHROPIC_API_KEY (bot/.env)');

const cfg = { ...configDa(() => undefined), origini: ['http://localhost:4173'], limiteMensileUsd: 1 };
const conti = new Map();
const store = {
  async prenota({ mese, ora, ip, limiteMicro, limiteOrario, limiteTotale }) {
    const inc = (k) => (conti.set(k, (conti.get(k) || 0) + 1), conti.get(k));
    if ((conti.get(`spesa:${mese}`) || 0) >= limiteMicro) return 'limite-spesa';
    if (inc(`ip:${ip}:${ora}`) > limiteOrario || inc(`ora:${ora}`) > limiteTotale) return 'troppe-domande';
    return 'ok';
  },
  async addebita(mese, micro) {
    conti.set(`spesa:${mese}`, (conti.get(`spesa:${mese}`) || 0) + micro);
    console.log(`spesa del mese: $${((conti.get(`spesa:${mese}`) || 0) / 1e6).toFixed(4)}`);
  },
  async segnala({ domanda }) {
    console.log(`SEGNALAZIONE: ${domanda}`);
    return 'ok';
  },
};
const client = new Anthropic();
const catalog = buildCatalog();

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:8787${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks) });
  const r = await handlePonte(request, cfg, { store, client, catalog, ip: req.socket.remoteAddress, now: new Date() });
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8787, () => console.log('Ponte locale su http://localhost:8787 (origine consentita: http://localhost:4173)'));
