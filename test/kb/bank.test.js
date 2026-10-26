// Banca di domande: misura quante risposte sono corrette e, soprattutto, quante sono
// "sicure ma sbagliate" (il caso peggiore per un bot di regole).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { answer } from '../../src/chat/router.js';
import { generate } from './generate-card-questions.js';

const MIN_ACCURACY = Number(process.env.MIN_ACCURACY || 0.95);
const MAX_WRONG_CONFIDENT = Number(process.env.MAX_WRONG_CONFIDENT || 0.01);

function loadRules() {
  return fs
    .readFileSync(new URL('./questions-rules.tsv', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const [q, exp] = l.split('\t');
      return { q, expect: exp.split('|'), kind: 'regola' };
    });
}

function label(a) {
  if (a.type === 'carta') return `carta:${a.id}:${a.focus}`;
  if (a.type === 'regola' || a.type === 'ambiguita' || a.type === 'fuori') return a.id;
  if (a.type === 'calcolo') return 'calcolo';
  return a.type; // chiarimento | non-so | vuoto
}

export function evaluate(items) {
  const rows = items.map((it) => {
    const a = answer(it.q);
    const got = label(a);
    const exp = Array.isArray(it.expect) ? it.expect : [it.expect];
    const confident = !['chiarimento', 'non-so', 'vuoto', 'fuori'].includes(a.type);
    let cardOk = false;
    const matchOne = (e) => {
      if (e.startsWith('carta:')) {
        const [, id, focus] = e.split(':');
        const idOk = a.type === 'carta' && a.id === id;
        if (idOk) cardOk = true;
        return idOk && (!focus || focus === 'tutto' || a.focus === focus);
      }
      if (e === 'non-so') return !confident;
      return e === got || (a.ambiguities || []).includes(e);
    };
    const ok = exp.some(matchOne);
    const helpful = !ok && a.type === 'chiarimento' && (a.suggestions || []).some((s) => exp.includes(s.id));
    return { q: it.q, expect: exp.join('|'), got, ok, cardOk, confident, helpful, kind: it.kind };
  });
  const n = rows.length;
  const correct = rows.filter((r) => r.ok).length;
  const wrongConfident = rows.filter((r) => !r.ok && r.confident && !(r.cardOk));
  return { n, correct, accuracy: correct / n, wrongConfident, rows };
}

describe('banca di domande', () => {
  const items = [...loadRules(), ...generate()];
  const res = evaluate(items);
  fs.mkdirSync('test/out', { recursive: true });
  const byKind = {};
  for (const r of res.rows) {
    byKind[r.kind] ??= { n: 0, ok: 0 };
    byKind[r.kind].n++;
    if (r.ok) byKind[r.kind].ok++;
  }
  fs.writeFileSync(
    'test/out/bank.json',
    JSON.stringify({ n: res.n, accuracy: res.accuracy, byKind, wrongConfident: res.wrongConfident, failures: res.rows.filter((r) => !r.ok) }, null, 2),
  );

  it(`almeno 600 domande (sono ${items.length})`, () => expect(items.length).toBeGreaterThanOrEqual(600));
  it(`accuratezza ≥ ${MIN_ACCURACY * 100}%`, () => expect(res.accuracy).toBeGreaterThanOrEqual(MIN_ACCURACY));
  it(`risposte sicure ma sbagliate ≤ ${MAX_WRONG_CONFIDENT * 100}%`, () =>
    expect(res.wrongConfident.length / res.n).toBeLessThanOrEqual(MAX_WRONG_CONFIDENT));
});
