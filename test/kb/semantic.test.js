// Comprensione semantica (modello statico in public/model): integrità e soglie sui set di sviluppo.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { score } from '../../tools/semantic/tune-score.mjs';
import { answer, hasSemantic } from '../../src/chat/router.js';

describe('comprensione semantica', () => {
  it('il modello per il browser esiste ed è sotto i 10 MB', () => {
    const size = ['emb.bin', 'vocab.txt', 'meta.json'].reduce((s, f) => s + fs.statSync(`public/model/${f}`).size, 0);
    expect(size).toBeLessThan(10e6);
    expect(hasSemantic()).toBe(true);
  });

  // Le soglie sono prudenti (tarate sul set cieco semantico): meglio un "Intendevi…?" che una
  // risposta sicura ma sbagliata. Quindi si misura chi arriva alla risposta giusta entro un clic.
  it('sui set di sviluppo: ≥ 85% giuste subito, ≥ 95% entro un clic, ≤ 2% sicure ma sbagliate', () => {
    const r = score();
    expect(r.ok / r.n).toBeGreaterThanOrEqual(0.85);
    expect((r.ok + r.clar) / r.n).toBeGreaterThanOrEqual(0.95);
    expect(r.wrong / r.n).toBeLessThanOrEqual(0.02);
  }, 60000);

  it.each(['raccontami una barzelletta', 'che tempo fa a milano', 'qual è la capitale della francia'])('fuori tema: "%s" non riceve una risposta sicura', (q) => {
    expect(['non-so', 'chiarimento', 'fuori']).toContain(answer(q).type);
  });
});
