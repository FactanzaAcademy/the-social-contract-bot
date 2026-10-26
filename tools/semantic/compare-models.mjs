// Confronta i modelli semantici sui set di SVILUPPO (mai sul set cieco finale nuovo).
// Per ogni domanda di regola: voce più vicina per somiglianza con gli esempi.
// Uso: node tools/semantic/compare-models.mjs [static|e5|all]
import fs from 'node:fs';
import { entries, rank } from '../../src/chat/matcher.js';
import { cosine } from '../../src/semantic/static-model.js';
import { loadReduced } from './load-static.mjs';

const which = process.argv[2] || 'all';
const DEV = ['test/kb/questions-rules.tsv', 'test/kb/questions-holdout.tsv', 'test/kb/questions-blind.tsv'];
const ids = new Set(entries.map((e) => e.id));
const qs = DEV.flatMap((f) =>
  fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
    const [q, e] = l.split('\t');
    return { q, exp: e.split('|') };
  }),
);
const ruleQs = qs.filter((x) => x.exp.some((e) => ids.has(e)));
const offQs = qs.filter((x) => x.exp.length === 1 && x.exp[0] === 'non-so');
console.log(`domande di regola: ${ruleQs.length}, fuori tema: ${offQs.length}`);

function evaluate(name, embedQ, embedDoc) {
  const t0 = Date.now();
  const ex = [];
  for (const e of entries) for (const s of [e.titolo, ...e.esempi]) ex.push({ id: e.id, v: embedDoc(s) });
  const t1 = Date.now();
  const best = (q) => {
    const v = embedQ(q);
    const per = new Map();
    if (!v) return { top: [], max: 0 };
    for (const x of ex) if (x.v) per.set(x.id, Math.max(per.get(x.id) ?? -1, cosine(v, x.v)));
    const top = [...per.entries()].sort((a, b) => b[1] - a[1]);
    return { top, max: top[0][1] };
  };
  let ok = 0, ok3 = 0, hyb = 0;
  const onScores = [];
  for (const x of ruleQs) {
    const r = best(x.q);
    onScores.push(r.max);
    if (x.exp.includes(r.top[0]?.[0])) ok++;
    if (r.top.slice(0, 3).some(([id]) => x.exp.includes(id))) ok3++;
    // ibrido: punteggio parole chiave + somiglianza
    const kw = new Map(rank(x.q).results.map((y) => [y.entry.id, y.score]));
    const h = r.top.map(([id, s]) => [id, s + 0.35 * Math.min(1.2, kw.get(id) || 0)]).sort((a, b) => b[1] - a[1]);
    if (x.exp.includes(h[0]?.[0])) hyb++;
  }
  const offScores = offQs.map((x) => best(x.q).max);
  const pct = (a) => ((100 * a) / ruleQs.length).toFixed(1) + '%';
  const avg = (a) => (a.reduce((s, x) => s + x, 0) / a.length).toFixed(3);
  console.log(`${name.padEnd(28)} top1 ${pct(ok)}  top3 ${pct(ok3)}  ibrido ${pct(hyb)}  | sim media in tema ${avg(onScores)} fuori ${avg(offScores)} | indicizzazione ${t1 - t0} ms`);
}

// riferimento: solo parole chiave
{
  let ok = 0;
  for (const x of ruleQs) if (x.exp.includes(rank(x.q).results[0]?.entry.id)) ok++;
  console.log(`${'parole chiave (attuale)'.padEnd(28)} top1 ${((100 * ok) / ruleQs.length).toFixed(1)}%`);
}

if (which === 'static' || which === 'all') {
  for (const [dims, prune] of [[1024, false], [256, false], [256, true], [128, true]]) {
    const m = loadReduced({ dims, prune });
    const mb = ((m.raw.nRows * dims + m.raw.nRows * 4) / 1e6).toFixed(1);
    evaluate(`statico ${dims}d${prune ? ' latino' : ''} (${mb} MB)`, m.embed, m.embed);
  }
}

if (which === 'e5' || which === 'all') {
  const { pipeline } = await import('@huggingface/transformers');
  const fe = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small', { dtype: 'q8' });
  const cache = new Map();
  const emb = async (t) => {
    if (!cache.has(t)) cache.set(t, Float32Array.from((await fe(t, { pooling: 'mean', normalize: true })).data));
    return cache.get(t);
  };
  // pre-calcolo asincrono, poi valutazione sincrona dalla cache
  const all = [...new Set([...entries.flatMap((e) => [e.titolo, ...e.esempi]).map((s) => 'query: ' + s), ...qs.map((x) => 'query: ' + x.q)])];
  const t0 = Date.now();
  for (const s of all) await emb(s);
  console.log(`e5-small: ${all.length} frasi in ${Date.now() - t0} ms`);
  const get = (t) => cache.get('query: ' + t);
  evaluate('e5-small q8 (~118 MB)', get, get);
}
