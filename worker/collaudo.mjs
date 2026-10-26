// Collaudo locale del Worker con `wrangler dev` (nessun login Cloudflare): richieste vere,
// KV simulato in locale, chiave letta da .dev.vars. Costa pochi centesimi di Haiku.
// Uso: node collaudo.mjs        (dalla cartella worker)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEY = (fs.readFileSync('.dev.vars', 'utf8').match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) throw new Error('Manca ANTHROPIC_API_KEY in .dev.vars');
const OK_ORIGIN = 'http://localhost:4173';
const results = [];
const seen = []; // tutto ciò che il Worker ha restituito, per cercare la chiave
const check = (name, cond, info = '') => results.push({ name, ok: !!cond, info });

function start(port, vars = {}) {
  const persist = fs.mkdtempSync(path.join(os.tmpdir(), 'tsc-kv-'));
  const args = ['wrangler', 'dev', '--port', String(port), '--ip', '127.0.0.1', '--persist-to', persist, ...Object.entries(vars).flatMap(([k, v]) => ['--var', `${k}:${v}`])];
  const p = spawn('npx', args, { env: { ...process.env, WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`wrangler dev ${port} non è partito:\n${log.slice(-1500)}`)), 90000);
    const on = (d) => {
      log += d;
      if (/Ready on/i.test(log)) {
        clearTimeout(t);
        resolve({ stop: () => p.kill('SIGTERM'), log: () => log, url: `http://127.0.0.1:${port}` });
      }
    };
    p.stdout.on('data', on);
    p.stderr.on('data', on);
  });
}

async function call(base, { origin = OK_ORIGIN, method = 'POST', body = { domanda: 'chi diventa leader se pareggiamo?' }, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  const t0 = Date.now();
  const r = await fetch(`${base}/proponi`, { method, headers, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined });
  const text = await r.text();
  const hdrs = JSON.stringify([...r.headers.entries()]);
  seen.push(text, hdrs);
  return { status: r.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })(), acao: r.headers.get('access-control-allow-origin'), ms: Date.now() - t0 };
}

// ---- A: origini, CORS, richieste malformate, risposta normale ----
const A = await start(8787, {});
try {
  const pre = await call(A.url, { method: 'OPTIONS' });
  check('OPTIONS da origine consentita → 204 con CORS', pre.status === 204 && pre.acao === OK_ORIGIN, `${pre.status} ${pre.acao}`);
  const evil = await call(A.url, { origin: 'https://sito-qualsiasi.example' });
  check('POST da origine non consentita → 403 senza CORS', evil.status === 403 && !evil.acao, `${evil.status}`);
  const none = await call(A.url, { origin: null });
  check('POST senza origine (es. curl, script) → 403', none.status === 403, `${none.status}`);
  const big = await call(A.url, { raw: JSON.stringify({ domanda: 'x'.repeat(3000) }) });
  check('corpo troppo grande → 413', big.status === 413, `${big.status}`);
  const bad = await call(A.url, { raw: '{non json' });
  check('JSON non valido → 400', bad.status === 400, `${bad.status}`);
  const ok = await call(A.url);
  check('domanda valida → 200 con soli id di voci', ok.status === 200 && Array.isArray(ok.json?.proposte) && Object.keys(ok.json).sort().join() === 'fuori_tema,proposte', ok.text);
  const para = await call(A.url, { body: { domanda: 'il gettone di chi comanda passa a chi mette di più?' } });
  check('parafrasi difficile → nuovo-leader tra le proposte', para.json?.proposte?.includes('nuovo-leader'), para.text);
} finally {
  A.stop();
}

// ---- B: limite orario per visitatore (abbassato a 3) ----
const B = await start(8788, { LIMITE_ORARIO: '3' });
try {
  const st = [];
  for (let i = 0; i < 4; i++) st.push((await call(B.url, { body: { domanda: `quanto costa la rete stradale ${i}` } })).status);
  const last = await call(B.url);
  check('limite orario: 3 risposte, poi 429 "troppe-domande"', st.slice(0, 3).every((s) => s === 200) && st[3] === 429 && last.json?.errore === 'troppe-domande', st.join(','));
} finally {
  B.stop();
}

// ---- C: tetto di spesa (abbassato a un milionesimo di dollaro) ----
const C = await start(8789, { LIMITE_MENSILE_USD: '0.000001' });
try {
  const first = await call(C.url);
  const second = await call(C.url);
  check('tetto di spesa: prima chiamata passa e registra la spesa', first.status === 200, `${first.status} in ${first.ms} ms`);
  check('tetto di spesa: poi 429 "limite-spesa" senza chiamare Haiku', second.status === 429 && second.json?.errore === 'limite-spesa' && second.ms < 300, `${second.status} in ${second.ms} ms`);
} finally {
  C.stop();
}

// ---- D: chiave API non valida → errore generico, senza dettagli ----
const D = await start(8790, { ANTHROPIC_API_KEY: 'sk-ant-api03-chiave-finta-di-collaudo' });
try {
  const r = await call(D.url);
  check('chiave non valida → 502 "ai-non-disponibile", nessun dettaglio dell\'errore', r.status === 502 && r.text === '{"errore":"ai-non-disponibile"}', `${r.status} ${r.text}`);
} finally {
  D.stop();
}

// ---- la chiave non esce mai ----
const all = seen.join('\n');
check('la chiave non compare in nessuna risposta né intestazione', !all.includes(KEY) && !all.includes(KEY.slice(-12)), `${seen.length / 2} risposte controllate`);
const dist = ['../dist/index.html', '../dist/config.json', '../public/config.json', 'src/catalog.json', 'src/index.js', 'wrangler.toml'].filter(fs.existsSync);
check('la chiave non compare nella pagina del bot né nei file del Worker', dist.every((f) => !fs.readFileSync(f, 'utf8').includes(KEY) && !/sk-ant-[a-z0-9]{3,}-[A-Za-z0-9_-]{20,}/.test(fs.readFileSync(f, 'utf8'))), dist.join(', '));

for (const r of results) console.log(`${r.ok ? 'OK  ' : 'NO  '} ${r.name}${r.ok ? '' : `   [${r.info}]`}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} verifiche superate`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
