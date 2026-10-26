// Carica il modello statico originale (float32, 1024 dimensioni) da models-src/ e lo riduce:
// troncamento Matryoshka a `dims` dimensioni, quantizzazione int8 per riga, righe opzionalmente
// limitate ai token utili (alfabeto latino).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createModel } from '../../src/semantic/static-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'models-src/static-mrl');

export function readSafetensors(file) {
  const buf = fs.readFileSync(file);
  const hlen = Number(buf.readBigUInt64LE(0));
  const header = JSON.parse(buf.slice(8, 8 + hlen).toString('utf8'));
  const name = Object.keys(header).find((k) => k !== '__metadata__');
  const { dtype, shape, data_offsets } = header[name];
  if (dtype !== 'F32') throw new Error(`dtype inatteso ${dtype}`);
  const start = 8 + hlen + data_offsets[0];
  const ab = buf.buffer.slice(buf.byteOffset + start, buf.byteOffset + 8 + hlen + data_offsets[1]);
  return { shape, data: new Float32Array(ab) };
}

export function loadTokens() {
  const tj = JSON.parse(fs.readFileSync(path.join(dir, 'tokenizer.json'), 'utf8'));
  const tokens = [];
  for (const [t, id] of Object.entries(tj.model.vocab)) tokens[id] = t;
  return tokens;
}

// Token utili per l'italiano: lettere latine (anche accentate), cifre, punteggiatura, speciali.
export function isUseful(tok) {
  const t = tok.startsWith('##') ? tok.slice(2) : tok;
  if (/^\[(UNK|CLS|SEP|PAD|MASK)\]$/.test(tok)) return true;
  return /^[\p{Script=Latin}0-9\p{P}\p{S}]+$/u.test(t);
}

export function reduce({ dims = 256, prune = false } = {}) {
  const { shape, data } = readSafetensors(path.join(dir, 'model.safetensors'));
  const [V, D] = shape;
  const tokens = loadTokens();
  const keep = tokens.map((t) => (prune ? isUseful(t) : true));
  const rows = new Int32Array(V).fill(-1);
  let n = 0;
  for (let i = 0; i < V; i++) if (keep[i]) rows[i] = n++;
  const q = new Int8Array(n * dims);
  const scale = new Float32Array(n);
  for (let i = 0; i < V; i++) {
    const r = rows[i];
    if (r < 0) continue;
    let max = 0;
    for (let k = 0; k < dims; k++) max = Math.max(max, Math.abs(data[i * D + k]));
    const s = max / 127 || 1;
    scale[r] = s;
    for (let k = 0; k < dims; k++) q[r * dims + k] = Math.round(data[i * D + k] / s);
  }
  return { tokens, rows, data: q, scale, dims, nRows: n, V };
}

export function loadReduced(opts) {
  const r = reduce(opts);
  return { ...createModel(r), raw: r };
}
