// Riconoscimento dei nomi delle carte nella domanda (anche parziali o con refusi).
import { db } from '../data.js';
import { basic, levenshtein, STOP } from './normalize.js';

const EXTRA_STOP = new Set(['per', 'di', 'del', 'della', 'delle', 'dei', 'un', 'una', 'nel', 'lungo']);

// Alias brevi riconosciuti come parola esatta (cognomi, soprannomi).
const ALIASES = {
  t01: ['keynes', 'scavatore di buche'],
  t02: ['hetty', 'green', 'austerity'],
  t03: ['amrita', 'bishnoi', 'ambientalista'],
  t04: ['thoreau'],
  t05: ['mansa', 'musa'],
  t06: ['marx', 'comunista'],
  t07: ['matteotti'],
  t08: ['curie', 'marie', 'scienziata'],
  t09: ['corbusier', 'funzionalista'],
  t10: ['orazio', 'flacco'],
  t11: ['nietzsche', 'nietzche', 'niezsche', 'nietzshe'],
  t12: ['imhotep'],
  t13: ['michelangelo'],
  t14: ['bartolina', 'sisa', 'vargas'],
  t15: ['watt', 'ingegnere'],
  t16: ['mendel'],
  t17: ['ahaha', 'mercante'],
  t18: ['thatcher', 'lady di ferro'],
  t19: ['pio ix', 'pio nono', 'papa'],
  t20: ['leonardo', 'da vinci'],
  t21: ['toussaint', 'louverture'],
  t22: ['buddha', 'budda'],
  t23: ['gandhi', 'ghandi'],
  t24: ['morris', 'artigiano'],
  t25: ['sun tzu', 'suntzu', 'sun tsu'],
  t26: ['asso', 'diplomazia'],
  p38: ['morto', 'alleanza'],
  e23: ['metropolis'],
  e06: ['expo', 'esposizione universale'],
  e16: ['giochi orbitali', 'olimpiadi'],
};

function contentTokens(name) {
  return basic(name).replace(/!/g, '').split(' ').filter((t) => t.length > 1 && !STOP.has(t) && !EXTRA_STOP.has(t));
}

const cards = [
  ...db.projectList.map((c) => ({ kind: 'project', card: c })),
  ...db.eventList.map((c) => ({ kind: 'event', card: c })),
  ...db.thinkerList.map((c) => ({ kind: 'thinker', card: c })),
].map((x) => ({ ...x, toks: contentTokens(x.card.nome), aliases: (ALIASES[x.card.id] || []).map(basic) }));

// IDF dei token dei nomi: parole come "sistema" o "ricerca" pesano meno.
// Termini di gioco che compaiono anche nei nomi delle carte ("Proteste popolari per la mancanza di risorse"):
// da soli non bastano a dire che la domanda parla di quella carta.
const GAME_TERMS = new Set(['mancanza', 'risorse', 'difesa', 'tensione', 'evento', 'eventi', 'progetto', 'progetti', 'principale', 'sociale', 'costo', 'monete', 'leader', 'pubblico', 'pubbliche', 'privato', 'privati', 'private']);

const df = {};
cards.forEach((c) => new Set(c.toks).forEach((t) => (df[t] = (df[t] || 0) + 1)));
const idf = (t) => Math.log(1 + cards.length / (df[t] || 1));

function tokenMatch(qt, t) {
  if (qt === t) return 1;
  if (t.length >= 5 && qt.length >= 4 && (t.startsWith(qt) || qt.startsWith(t.slice(0, Math.max(5, t.length - 2))))) return 0.9;
  const max = t.length >= 8 ? 2 : t.length >= 5 ? 1 : 0;
  return max && levenshtein(qt, t, max) <= max ? 0.85 : 0;
}

// Restituisce le carte nominate nella domanda, ordinate per punteggio (0-1).
export function findEntities(text) {
  const q = basic(text).replace(/!/g, ' ');
  const qt = q.split(' ').filter(Boolean);
  const out = [];
  const partial = [];
  for (const c of cards) {
    let score = 0;
    for (const a of c.aliases) {
      const re = new RegExp(`(^|\\s)${a}(\\s|$)`);
      if (re.test(q)) score = Math.max(score, a.includes(' ') || a.length >= 6 ? 0.95 : 0.8);
    }
    if (c.toks.length) {
      let got = 0;
      let tot = 0;
      for (const t of c.toks) {
        const w = idf(t);
        tot += w;
        got += w * Math.max(0, ...qt.map((x) => tokenMatch(x, t)));
      }
      let s = got / tot;
      // un solo token generico non basta (es. "ricerca")
      const matched = c.toks.filter((t) => qt.some((x) => tokenMatch(x, t) > 0));
      if (matched.length === 1 && c.toks.length > 1 && df[matched[0]] > 1) s *= 0.5;
      if (matched.length && matched.every((t) => GAME_TERMS.has(t)) && matched.length < c.toks.length) s *= 0.4;
      // una sola parola, ma che compare solo in questa carta e non è un termine di gioco ("blackout", "pandemia")
      // (solo in domande brevi: in una frase lunga "società" o "guerra" sono parole comuni, non nomi di carte)
      const short = qt.filter((x) => x.length > 2 && !STOP.has(x)).length <= 4;
      if (short && c.toks.length <= 2 && matched.length === 1 && df[matched[0]] === 1 && matched[0].length >= 6 && !GAME_TERMS.has(matched[0]) && qt.includes(matched[0])) s = Math.max(s, 0.65);
      score = Math.max(score, s);
    }
    const hits = c.toks.filter((t) => !GAME_TERMS.has(t) && qt.some((x) => tokenMatch(x, t) >= 0.85)).length;
    if (score >= 0.6) out.push({ kind: c.kind, id: c.card.id, nome: c.card.nome, score, hits });
    else if (hits >= 2) partial.push({ kind: c.kind, id: c.card.id, nome: c.card.nome, score: Math.max(score, 0.6), hits });
  }
  // Nome parziale ("centri ricerca"): vale solo se UNA carta ha più parole in comune delle altre.
  if (!out.length && partial.length) {
    partial.sort((a, b) => b.hits - a.hits || b.score - a.score);
    if (partial.length === 1 || partial[0].hits > partial[1].hits) out.push(partial[0]);
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
