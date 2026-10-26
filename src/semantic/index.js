// Indice semantico delle voci della base di conoscenza: ogni formulazione di esempio
// diventa un vettore; una domanda viene confrontata con tutti.
import { createModel, cosine } from './static-model.js';

// files: { vocab: string (vocab.txt), bin: ArrayBuffer (emb.bin), meta: {dims, rows} }
export function modelFromFiles({ vocab, bin, meta }) {
  const tokens = vocab.split('\n');
  const n = meta.rows;
  const data = new Int8Array(bin, 0, n * meta.dims);
  const scale = new Float32Array(bin.slice(n * meta.dims, n * meta.dims + n * 4));
  return createModel({ tokens, rows: null, data, scale, dims: meta.dims });
}

export function buildIndex(model, entries) {
  const items = [];
  for (const e of entries)
    for (const s of [e.titolo, ...e.esempi]) {
      const v = model.embed(s);
      if (v) items.push({ id: e.id, v });
    }
  return {
    // Restituisce Map id → somiglianza massima con gli esempi di quella voce.
    rank(text) {
      const v = model.embed(text);
      const per = new Map();
      if (!v) return per;
      for (const it of items) {
        const s = cosine(v, it.v);
        if (s > (per.get(it.id) ?? -1)) per.set(it.id, s);
      }
      return per;
    },
    size: items.length,
  };
}
