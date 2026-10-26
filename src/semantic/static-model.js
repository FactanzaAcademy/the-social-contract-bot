// Modello semantico a embedding statici (sentence-transformers/static-similarity-mrl-multilingual-v1,
// Apache-2.0): tokenizer WordPiece BERT multilingue + media degli embedding dei token.
// Niente rete neurale da eseguire: per ogni parola si legge un vettore e si fa la media.
// Funziona uguale in Node (misure, build) e nel browser.

// ---------- tokenizer WordPiece (BertNormalizer: minuscole + niente accenti) ----------

function isPunct(cp) {
  return (cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) || (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126) || /\p{P}/u.test(String.fromCodePoint(cp));
}

export function basicTokens(text) {
  const norm = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000�]/g, '')
    .replace(/\s+/g, ' ');
  const out = [];
  let cur = '';
  for (const ch of norm) {
    const cp = ch.codePointAt(0);
    if (ch === ' ') {
      if (cur) out.push(cur);
      cur = '';
    } else if (isPunct(cp)) {
      if (cur) out.push(cur);
      out.push(ch);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export function wordpiece(word, vocab, unkId) {
  if (word.length > 100) return [unkId];
  const ids = [];
  let start = 0;
  while (start < word.length) {
    let end = word.length;
    let found = -1;
    while (start < end) {
      const piece = (start > 0 ? '##' : '') + word.slice(start, end);
      const id = vocab.get(piece);
      if (id !== undefined) {
        found = id;
        break;
      }
      end--;
    }
    if (found < 0) return [unkId];
    ids.push(found);
    start = end;
  }
  return ids;
}

// ---------- modello ----------

// tokens: array di stringhe (indice = id). rows: per ogni id, l'indice di riga nella matrice
// (-1 se la riga è stata tolta perché inutile per l'italiano). data: Int8Array dims*nRighe.
// scale: Float32Array con la scala di quantizzazione di ogni riga.
export function createModel({ tokens, rows, data, scale, dims }) {
  const vocab = new Map(tokens.map((t, i) => [t, i]));
  const unkId = vocab.get('[UNK]');
  function tokenize(text) {
    return basicTokens(text).flatMap((w) => wordpiece(w, vocab, unkId));
  }
  function embed(text) {
    const ids = tokenize(text);
    const v = new Float32Array(dims);
    let n = 0;
    for (const id of ids) {
      const r = rows ? rows[id] : id;
      if (r < 0 || r === undefined) continue;
      const s = scale[r];
      const off = r * dims;
      for (let k = 0; k < dims; k++) v[k] += data[off + k] * s;
      n++;
    }
    if (!n) return null;
    let norm = 0;
    for (let k = 0; k < dims; k++) norm += v[k] * v[k];
    norm = Math.sqrt(norm) || 1;
    for (let k = 0; k < dims; k++) v[k] /= norm;
    return v;
  }
  return { tokenize, embed, dims };
}

export function cosine(a, b) {
  let s = 0;
  for (let k = 0; k < a.length; k++) s += a[k] * b[k];
  return s;
}
