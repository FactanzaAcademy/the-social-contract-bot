// Modalità proposte (combinazione 2 + 3 + 4): il bot non risponde mai da solo.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { loadSemantic } from '../../tools/semantic/node-model.mjs';
import { propose, answerOption, PROPOSTE_MAX } from '../../src/chat/router.js';
import { evalRows } from '../../tools/eval-proposte.mjs';
import { generate } from './generate-card-questions.js';

loadSemantic();
const DEV = ['test/kb/questions-rules.tsv', 'test/kb/questions-holdout.tsv', 'test/kb/questions-blind.tsv'];
const rows = DEV.flatMap((f) =>
  fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [q, e] = l.split('\t');
    return { q, exp: e.split('|') };
  }),
);

describe('modalità proposte', () => {
  it('ogni domanda riceve al massimo 3 proposte o "non trovo", mai una risposta diretta', () => {
    for (const { q } of [...rows, ...generate().map((x) => ({ q: x.q }))]) {
      const p = propose(q);
      expect(['proposte', 'non-so']).toContain(p.type);
      expect(p.options.length).toBeLessThanOrEqual(PROPOSTE_MAX);
      if (p.type === 'proposte') expect(p.text).not.toMatch(/\*\*/); // il messaggio delle proposte non contiene risposte
    }
  }, 120000);

  it('ogni proposta ha una risposta', () => {
    for (const { q } of rows) for (const o of propose(q).options) if (o.kind !== 'calcolo') expect(answerOption(o)?.text?.length).toBeGreaterThan(10);
  }, 120000);

  it('un calcolo va sempre al verificatore, come prima proposta', () => {
    const p = propose('offriamo 3, 4 e 2 e il progetto costa 8');
    expect(p.options[0]).toMatchObject({ kind: 'calcolo', verifier: { tool: 'asta', offers: [3, 4, 2], cost: 8 } });
  });

  it('una carta riconosciuta è una proposta da confermare', () => {
    const p = propose('quanto costa la rete stradale');
    expect(p.options[0]).toMatchObject({ kind: 'carta', id: 'p03', focus: 'costo' });
  });

  it('sui set di sviluppo la voce giusta è tra le proposte in almeno il 95% dei casi', () => {
    const r = evalRows(rows);
    expect(r.found / r.n).toBeGreaterThanOrEqual(0.95);
  }, 120000);
});
