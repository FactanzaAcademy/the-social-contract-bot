// Ponte (src/ai/ponte.js): protezioni e risposta con contatori e client finti, più il controllo che
// le copie per l'Edge Function Supabase siano allineate agli originali.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handlePonte, configDa } from '../../src/ai/ponte.js';
import { sharedFiles } from '../../tools/ai/build-catalog.mjs';
import catalog from '../../worker/src/catalog.json' with { type: 'json' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ORIGIN = 'https://simoneddu98.github.io';
const NOW = new Date('2026-10-21T09:00:00Z');
const cfg = (over = {}) => ({ ...configDa(() => undefined), origini: [ORIGIN], ...over });

// Contatori in memoria con la stessa logica della funzione SQL bot_prenota.
function memStore() {
  const m = new Map();
  const inc = (k) => (m.set(k, (m.get(k) || 0) + 1), m.get(k));
  return {
    m,
    async prenota({ mese, ora, ip, limiteMicro, limiteOrario, limiteTotale }) {
      if ((m.get(`spesa:${mese}`) || 0) >= limiteMicro) return 'limite-spesa';
      if (inc(`ip:${ip}:${ora}`) > limiteOrario) return 'troppe-domande';
      if (inc(`ora:${ora}`) > limiteTotale) return 'troppe-domande';
      return 'ok';
    },
    async addebita(mese, micro) {
      m.set(`spesa:${mese}`, (m.get(`spesa:${mese}`) || 0) + micro);
    },
  };
}
function fakeClient(payload) {
  let calls = 0;
  const usage = { input_tokens: 50, cache_read_input_tokens: 7000, cache_creation_input_tokens: 0, output_tokens: 40 };
  return {
    calls: () => calls,
    messages: { create: async () => (calls++, { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: JSON.stringify(payload) }] }) },
  };
}
const req = (body, { origin = ORIGIN, method = 'POST', raw } = {}) =>
  new Request('https://x.supabase.co/functions/v1/proponi', {
    method,
    headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' },
    body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined,
  });
const call = (request, { store = memStore(), client = fakeClient({ fuori_tema: false, proposte: [] }), ip = '1.2.3.4', c = cfg() } = {}) =>
  handlePonte(request, c, { store, client, catalog, ip, now: NOW });

describe('ponte', () => {
  it('origini: solo quelle consentite, preflight con CORS', async () => {
    expect((await call(req({ domanda: 'x' }, { origin: 'https://altro.it' }))).status).toBe(403);
    expect((await call(req({ domanda: 'x' }, { origin: null }))).status).toBe(403);
    const pre = await call(req(null, { method: 'OPTIONS' }));
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('richieste malformate', async () => {
    expect((await call(req(null, { raw: JSON.stringify({ domanda: 'x'.repeat(3000) }) }))).status).toBe(413);
    expect((await call(req(null, { raw: '{non json' }))).status).toBe(400);
    expect((await call(req({ domanda: '   ' }))).status).toBe(400);
  });

  it('risponde con le chiavi valide e addebita la spesa', async () => {
    const store = memStore();
    const client = fakeClient({ fuori_tema: false, proposte: [{ id: 'nuovo-leader', focus: 'nessuno' }, { id: 'p03', focus: 'costo' }, { id: 'inventato', focus: 'tutto' }] });
    const r = await call(req({ domanda: 'chi comanda?' }), { store, client });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ proposte: ['nuovo-leader', 'carta:p03:costo'], fuori_tema: false });
    expect(store.m.get('spesa:2026-10')).toBeGreaterThan(0);
  });

  it('oltre il limite di spesa non chiama Haiku', async () => {
    const store = memStore();
    await store.addebita('2026-10', 5.01e6);
    const client = fakeClient({ fuori_tema: false, proposte: [] });
    expect((await call(req({ domanda: 'ciao' }), { store, client })).status).toBe(429);
    expect(client.calls()).toBe(0);
  });

  it('limite per visitatore e limite totale, con IP solo come hash', async () => {
    const store = memStore();
    const c = cfg({ limiteOrario: 2, limiteTotaleOrario: 3 });
    const status = async (ip) => (await call(req({ domanda: 'a' }), { store, ip, c })).status;
    expect(await status('1.2.3.4')).toBe(200);
    expect(await status('1.2.3.4')).toBe(200);
    expect(await status('1.2.3.4')).toBe(429); // stesso visitatore
    expect(await status('5.6.7.8')).toBe(200);
    expect(await status('9.9.9.9')).toBe(429); // totale dell'ora raggiunto, anche con IP nuovo
    expect([...store.m.keys()].some((k) => /\d+\.\d+\.\d+\.\d+/.test(k))).toBe(false);
  });

  it('database giù → 503 senza chiamare Haiku: il bot passa alla base di conoscenza offline', async () => {
    const giu = { prenota: async () => { throw new Error('database in pausa'); }, addebita: async () => {} };
    const client = fakeClient({ fuori_tema: false, proposte: [] });
    const r = await call(req({ domanda: 'ciao' }), { store: giu, client });
    expect(r.status).toBe(503);
    expect(client.calls()).toBe(0);
  });

  it('limiti predefiniti per Lucca: 200 domande all\'ora per IP, 1000 in tutto', () => {
    expect(configDa(() => undefined)).toMatchObject({ limiteOrario: 200, limiteTotaleOrario: 1000 });
  });

  it('Haiku non disponibile → 502, nessun addebito', async () => {
    const store = memStore();
    const client = { messages: { create: async () => { throw new Error('rete'); } } };
    expect((await call(req({ domanda: 'ciao' }), { store, client })).status).toBe(502);
    expect(store.m.has('spesa:2026-10')).toBe(false);
  });

  it('rispondi: risposta con fonti valide; senza fonti valide la risposta non passa', async () => {
    const reqA = (body) => new Request('https://x.supabase.co/functions/v1/proponi/rispondi', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const ok = fakeClient({ fuori_tema: false, trovata: true, risposta: 'Diventa **Leader** chi ha offerto di più.', fonti: [{ id: 'nuovo-leader', focus: 'nessuno' }] });
    const r = await call(reqA({ domanda: 'chi comanda?' }), { client: ok });
    expect(await r.json()).toEqual({ risposta: 'Diventa **Leader** chi ha offerto di più.', trovata: true, fuori_tema: false, proposte: ['nuovo-leader'] });
    const senzaFonti = fakeClient({ fuori_tema: false, trovata: true, risposta: 'Inventata.', fonti: [{ id: 'inventato', focus: 'tutto' }] });
    expect(await (await call(reqA({ domanda: 'boh' }), { client: senzaFonti })).json()).toMatchObject({ risposta: '', trovata: false });
    const fuori = fakeClient({ fuori_tema: true, trovata: false, risposta: '', fonti: [] });
    expect(await (await call(reqA({ domanda: 'che tempo fa?' }), { client: fuori })).json()).toMatchObject({ trovata: false, fuori_tema: true });
  });

  it('segnala: salva solo con il contatore dedicato, senza chiamare Haiku né addebitare', async () => {
    const reqS = (body) => new Request('https://x.supabase.co/functions/v1/proponi/segnala', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const salvate = [];
    const store = { ...memStore(), segnala: async (x) => (salvate.push(x), salvate.length > 2 ? 'troppe-domande' : 'ok') };
    const client = fakeClient({});
    expect((await call(reqS({ domanda: 'si può giocare in 9?' }), { store, client })).status).toBe(200);
    expect(salvate[0].domanda).toBe('si può giocare in 9?');
    expect(salvate[0].ip).not.toContain('1.2.3.4');
    await call(reqS({ domanda: 'b' }), { store, client });
    expect((await call(reqS({ domanda: 'c' }), { store, client })).status).toBe(429);
    expect(client.calls()).toBe(0);
    expect((await call(reqS({ domanda: 'x' }), { store: memStore(), client })).status).toBe(501); // store senza segnalazioni
  });

  it('le copie per Supabase coincidono con gli originali', () => {
    const catalogJson = fs.readFileSync(path.join(root, 'worker/src/catalog.json'), 'utf8');
    for (const [f, text] of Object.entries(sharedFiles(catalogJson))) {
      const copia = fs.readFileSync(path.join(root, 'supabase/functions/_shared', f), 'utf8');
      expect(copia, `supabase/functions/_shared/${f} non aggiornato: rilancia node tools/ai/build-catalog.mjs`).toBe(text);
    }
  });
});
