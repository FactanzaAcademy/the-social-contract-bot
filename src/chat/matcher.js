// Abbinamento domanda → voce della base di conoscenza, senza AI:
// somiglianza pesata (IDF) con ogni formulazione di esempio, più bonus per le parole chiave.
import { rules } from '../kb/rules.js';
import { extra } from '../kb/rules-extra.js';
import { paraphrases } from '../kb/paraphrases.js';
import ambig from '../kb/ambiguities.json' with { type: 'json' };
import { stems, tokens, stem, correct } from './normalize.js';

export const entries = [
  ...rules.map((r) => ({
    ...r,
    kind: 'regola',
    parole: [...r.parole, ...(extra[r.id]?.parole || [])],
    esempi: [...r.esempi, ...(extra[r.id]?.esempi || []), ...(paraphrases[r.id] || [])],
  })),
  ...ambig.ambiguities
    .filter((a) => a.parole && a.parole.length)
    .map((a) => ({ id: a.id, kind: 'ambiguita', titolo: a.titolo, esempi: [a.titolo, ...a.parole, ...(paraphrases[a.id] || [])], parole: a.parole, data: a })),
];

const prep = (text) => [...new Set(stems(text))];

const docs = entries.map((e) => ({
  e,
  examples: e.esempi.map(prep),
  keywords: e.parole.map(prep).filter((k) => k.length),
}));

// vocabolario (parole intere normalizzate) per correggere i refusi
export const vocab = new Set(entries.flatMap((e) => [...e.esempi, ...e.parole, e.titolo].flatMap(tokens)));

// radici che la base di conoscenza usa da qualche parte (esempi e parole chiave)
export const knownStems = new Set(docs.flatMap((d) => d.examples.flat().concat(d.keywords.flat())));

// Parole che da sole non dicono niente del gioco: "quanto vale la mia auto?" non deve
// somigliare a "In quanti si gioca?" solo per "quanto".
const GENERICHE = new Set(['quant', 'chi', 'quand', 'dove', 'perch', 'qual', 'vale', 'valg', 'fatt', 'puoi', 'poss', 'raccontam', 'consigl', 'consigliam', 'scrivim', 'oggi', 'ieri', 'adess', 'ora', 'bene', 'megli', 'poco', 'trov', 'cie']);

const NUMERI = new Set(['due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci']);

// Quanto la domanda parla del gioco: parole di contenuto (non generiche) e quante il bot ne conosce.
// Una parola corta "corretta" dal correttore di refusi non conta: "auto" diventerebbe "alto".
export function topicCoverage(text) {
  let content = 0;
  let known = 0;
  for (const t of tokens(text)) {
    const s = stem(t);
    if (GENERICHE.has(s)) continue;
    content++;
    if (/^\d+$/.test(t) || NUMERI.has(t) || knownStems.has(s) || vocab.has(t)) known++;
    else if (t.length >= 6 && knownStems.has(stem(correct(t, vocab)))) known++;
  }
  return { content, known, ratio: content ? known / content : 0 };
}

const df = {};
docs.forEach((d) => new Set(d.examples.flat().concat(d.keywords.flat())).forEach((s) => (df[s] = (df[s] || 0) + 1)));
const N = docs.length;
const idf = (s) => Math.log(1 + N / (df[s] || 0.5));

export function queryStems(text, extraVocab) {
  const voc = extraVocab ? new Set([...vocab, ...extraVocab]) : vocab;
  return [...new Set(tokens(text).map((t) => stem(correct(t, voc))))];
}

function dice(q, ex) {
  let inter = 0;
  let qs = 0;
  let es = 0;
  const exSet = new Set(ex);
  for (const s of q) {
    const w = idf(s);
    qs += w;
    if (exSet.has(s)) inter += w;
  }
  for (const s of ex) es += idf(s);
  return qs + es ? (2 * inter) / (qs + es) : 0;
}

// Restituisce le voci ordinate con un punteggio 0..~1.2
export function rank(text, { extraVocab } = {}) {
  const q = queryStems(text, extraVocab);
  if (!q.length) return { q, results: [] };
  const qSet = new Set(q);
  // Copertura: quota di parole della domanda che il bot conosce. Domande fuori tema → punteggio più basso.
  const coverage = q.filter((s) => knownStems.has(s) || /^\d+$/.test(s)).length / q.length;
  const penalty = Math.pow(coverage, 1.5);
  const results = docs.map((d) => {
    const best = Math.max(...d.examples.map((ex) => dice(q, ex)));
    const kwHits = d.keywords.filter((k) => k.every((s) => qSet.has(s)));
    const kwWeight = kwHits.reduce((s, k) => s + k.reduce((a, x) => a + idf(x), 0), 0);
    const qWeight = q.reduce((s, x) => s + idf(x), 0);
    const kwScore = Math.min(0.35, (0.35 * kwWeight) / Math.max(qWeight, 1));
    return { entry: d.e, score: (best + kwScore) * penalty, best, kwHits: kwHits.length, coverage };
  });
  results.sort((a, b) => b.score - a.score);
  return { q, results, coverage };
}

export const THRESHOLD = { sicuro: 0.5, certo: 1.0, margine: 0.08, chiarimento: 0.28 };
