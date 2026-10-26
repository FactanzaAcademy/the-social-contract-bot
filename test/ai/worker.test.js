// Worker: protezioni (origine, limite di spesa, limite per visitatore) e risposta, con client finto.
import { describe, it, expect } from 'vitest';
import { handle } from '../../worker/src/index.js';
import catalog from '../../worker/src/catalog.json' with { type: 'json' };
import { toKeys, costUSD, outputSchema } from '../../src/ai/haiku.js';

function kv() {
  const m = new Map();
  return { get: async (k) => m.get(k) ?? null, put: async (k, v) => void m.set(k, v), m };
}
function fakeClient(payload, usage = { input_tokens: 50, cache_read_input_tokens: 7000, cache_creation_input_tokens: 0, output_tokens: 40 }) {
  let calls = 0;
  return {
    calls: () => calls,
    messages: { create: async () => (calls++, { stop_reason: 'end_turn', usage, content: [{ type: 'text', text: JSON.stringify(payload) }] }) },
  };
}
const ORIGIN = 'https://simoneddu98.github.io';
const req = (body, origin = ORIGIN, ip = '1.2.3.4') =>
  new Request('https://w.example/proponi', { method: 'POST', headers: { Origin: origin, 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('worker', () => {
  it('rifiuta le origini non consentite', async () => {
    const env = { ORIGINI: ORIGIN, SPESA: kv() };
    expect((await handle(req({ domanda: 'x' }, 'https://altro.it'), env)).status).toBe(403);
  });

  it('risponde con le chiavi valide e conta la spesa', async () => {
    const env = { ORIGINI: ORIGIN, SPESA: kv() };
    const client = fakeClient({ fuori_tema: false, proposte: [{ id: 'nuovo-leader', focus: 'nessuno' }, { id: 'p03', focus: 'costo' }, { id: 'inventato', focus: 'tutto' }] });
    const r = await handle(req({ domanda: 'chi comanda?' }), env, { client, now: () => new Date('2026-10-20T10:00:00Z') });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ proposte: ['nuovo-leader', 'carta:p03:costo'], fuori_tema: false });
    expect(Number(env.SPESA.m.get('spesa:2026-10'))).toBeGreaterThan(0);
  });

  it('oltre il limite di spesa non chiama Haiku', async () => {
    const env = { ORIGINI: ORIGIN, SPESA: kv(), LIMITE_MENSILE_USD: '5' };
    await env.SPESA.put('spesa:2026-10', String(5.01e6));
    const client = fakeClient({ fuori_tema: false, proposte: [] });
    const r = await handle(req({ domanda: 'ciao' }), env, { client, now: () => new Date('2026-10-20T10:00:00Z') });
    expect(r.status).toBe(429);
    expect(client.calls()).toBe(0);
  });

  it('limita le domande per visitatore', async () => {
    const env = { ORIGINI: ORIGIN, SPESA: kv(), LIMITE_ORARIO: '2' };
    const client = fakeClient({ fuori_tema: false, proposte: [] });
    const now = () => new Date('2026-10-20T10:00:00Z');
    expect((await handle(req({ domanda: 'a' }), env, { client, now })).status).toBe(200);
    expect((await handle(req({ domanda: 'b' }), env, { client, now })).status).toBe(200);
    expect((await handle(req({ domanda: 'c' }), env, { client, now })).status).toBe(429);
    expect((await handle(req({ domanda: 'd' }, ORIGIN, '9.9.9.9'), env, { client, now })).status).toBe(200);
    expect([...env.SPESA.m.keys()].some((k) => k.includes('1.2.3.4'))).toBe(false); // IP solo come hash
  });

  it('schema: gli id possibili sono solo quelli del catalogo', () => {
    const ids = outputSchema(catalog).properties.proposte.items.properties.id.enum;
    expect(ids).toHaveLength(catalog.voci.length + catalog.carte.length);
    expect(toKeys({ proposte: [{ id: 't23', focus: 'costo' }] }, catalog)).toEqual(['carta:t23:tutto']); // focus non valido per un Pensatore
  });

  it('costo: listino Haiku 5.5', () => {
    expect(costUSD({ input_tokens: 1e6, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0 })).toBeCloseTo(0.1);
    expect(costUSD({ input_tokens: 0, cache_read_input_tokens: 1e6, cache_creation_input_tokens: 0, output_tokens: 1e6 })).toBeCloseTo(0.51);
  });
});
