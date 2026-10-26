// Normalizzazione del testo italiano: minuscole, niente accenti, sinonimi, stemming leggero.
import { synonyms } from '../kb/glossary.js';

export const STOP = new Set(
  ('il lo la i gli le un uno una di a da in con su per tra fra e ed o ma se che cosa cos come quale quali ' +
    'del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle ' +
    'mi ti si ci vi ne me te se lo non anche ancora gia poi solo pure proprio molto tanto tutto tutti tutte questo questa questi queste quello quella quelli quelle ' +
    'mio mia miei mie tuo tua suoi sue nostro nostra loro essere e sono sei siamo siete era erano stato stata ho hai ha abbiamo avete hanno avere fa fare fanno ' +
    'devo deve devono dovere posso puo possono potere voglio vuole c ce gioco giocatore giocatori regola regole the social contract scusa ciao grazie allora ok quindi tipo ' +
    'bot dimmi spiegami spiega sai sapere vorrei volevo capire domanda esempio succede funziona funzionano significa vuol dire serve servono').split(/\s+/),
);

// Abbreviazioni da chat.
const ABBR = { cm: 'come', nn: 'non', pk: 'perche', xke: 'perche', xk: 'perche', perke: 'perche', cmq: 'comunque', qnt: 'quanto', qnd: 'quando', tt: 'tutti', x: 'per', ke: 'che', c: 'ci', dv: 'dove', qlc: 'qualcosa', sn: 'sono' };

export function basic(text) {
  return (text || '')
    .toLowerCase()
    .replace(/\b([a-z]{1,5})\b/g, (w) => ABBR[w] ?? w)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, ' ')
    .replace(/(\d)\s*\+\s*(\d)/g, '$1 + $2')
    .replace(/[^a-z0-9+!\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sinonimi: frasi colloquiali → forma canonica. Applicati a parole intere, prima le più lunghe.
const SYN = Object.entries(synonyms)
  .flatMap(([canon, alts]) => alts.map((a) => [basic(a), basic(canon)]))
  .sort((a, b) => b[0].length - a[0].length)
  .map(([from, to]) => [new RegExp(`(^|\\s)${from.replace(/[+!]/g, '\\$&')}(?=\\s|$)`, 'g'), ` ${to}`]);

export function canonical(text) {
  let t = ` ${basic(text)} `;
  for (const [re, to] of SYN) t = t.replace(re, `$1${to.trim()}`);
  return t.replace(/\s+/g, ' ').trim();
}

const SUFFIXES = ['amento', 'amenti', 'mente', 'zioni', 'zione', 'ando', 'endo', 'ato', 'ata', 'ati', 'ate', 'ito', 'ita', 'iti', 'ite', 'are', 'ere', 'ire', 'iamo', 'ano', 'ono', 'i', 'e', 'a', 'o'];

export function stem(tok) {
  if (tok.length < 5 || /^\d+$/.test(tok)) return tok;
  for (const s of SUFFIXES) if (tok.endsWith(s) && tok.length - s.length >= 4) return tok.slice(0, -s.length);
  return tok;
}

export function tokens(text) {
  return canonical(text).split(' ').filter((t) => t && !STOP.has(t));
}

export function stems(text) {
  return tokens(text).map(stem);
}

export function levenshtein(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length];
}

// Corregge un refuso cercando la parola più vicina nel vocabolario noto.
export function correct(tok, vocab) {
  if (vocab.has(tok) || tok.length < 4 || /\d/.test(tok)) return tok;
  const max = tok.length >= 10 ? 2 : 1;
  let best = null;
  let bestD = max + 1;
  for (const v of vocab) {
    if (v[0] !== tok[0]) continue;
    const d = levenshtein(tok, v, max);
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best || tok;
}
