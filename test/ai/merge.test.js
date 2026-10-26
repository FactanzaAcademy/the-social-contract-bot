// Fusione delle scelte di Haiku con la ricerca locale, e riserva quando il Worker non risponde.
import { describe, it, expect, vi } from 'vitest';
import { propose, mergeProposals, optionFromKey } from '../../src/chat/router.js';
import { aiFetch } from '../../src/ai/client.js';
import { topicCoverage } from '../../src/chat/matcher.js';

describe('strada A: fusione e riserva', () => {
  it('le scelte di Haiku vanno in testa, le locali completano fino a 3', () => {
    const local = propose('chi diventa leader se pareggiamo');
    const m = mergeProposals(['leader-se-fallisce'], false, local);
    expect(m.options[0].key).toBe('leader-se-fallisce');
    expect(m.options.length).toBeLessThanOrEqual(3);
  });

  it('un calcolo locale resta il primo', () => {
    const local = propose('offriamo 3, 4 e 2 e il progetto costa 8');
    expect(mergeProposals(['approvazione'], false, local).options[0].kind).toBe('calcolo');
  });

  it('chiavi inesistenti o focus non validi vengono scartati', () => {
    expect(optionFromKey('voce-inventata')).toBeNull();
    expect(optionFromKey('carta:p99:costo')).toBeNull();
    expect(optionFromKey('carta:t23:costo')).toBeNull();
    expect(optionFromKey('carta:p03:costo')).toMatchObject({ kind: 'carta', id: 'p03', focus: 'costo' });
  });

  it('fuori tema per Haiku e per la ricerca locale → "non trovo"', () => {
    const local = { type: 'non-so', options: [] };
    expect(mergeProposals([], true, local).type).toBe('non-so');
  });

  it('fuori tema per Haiku vince sulle voci locali deboli, non su una carta nominata', () => {
    const deboli = { type: 'proposte', options: [optionFromKey('numero-giocatori')] };
    expect(mergeProposals([], true, deboli).type).toBe('non-so');
    const carta = { type: 'proposte', options: [optionFromKey('carta:p20:costo')] };
    expect(mergeProposals([], true, carta).options[0].key).toBe('carta:p20:costo');
  });

  it('domanda senza parole del gioco → "non trovo" anche senza AI', () => {
    expect(propose('quanto vale la mia auto?').type).toBe('non-so');
    expect(topicCoverage('siamo in sette amici, ci stiamo tutti?').known).toBeGreaterThan(0); // i numeri in lettere contano
    expect(propose('chi sei?').type).toBe('proposte');
  });

  it('Worker irraggiungibile, lento o al limite → null (il bot usa la ricerca locale)', async () => {
    expect(await aiFetch('https://w.example', 'q', { fetchImpl: () => Promise.reject(new Error('rete')) })).toBeNull();
    expect(await aiFetch('https://w.example', 'q', { fetchImpl: async () => ({ ok: false, status: 429 }) })).toBeNull();
    const slow = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort'))));
    expect(await aiFetch('https://w.example', 'q', { fetchImpl: slow, timeoutMs: 50 })).toBeNull();
    const ok = vi.fn(async () => ({ ok: true, json: async () => ({ proposte: ['turno', 5], fuori_tema: false }) }));
    expect(await aiFetch('https://w.example/', 'q', { fetchImpl: ok })).toEqual({ proposte: ['turno'], fuoriTema: false });
    expect(ok.mock.calls[0][0]).toBe('https://w.example/proponi');
  });
});
