// Crea public/model/: il modello statico ridotto per il browser (e per i test in Node).
//   vocab.txt  token tenuti, uno per riga (indice = riga della matrice)
//   emb.bin    Int8 [n × dims] seguito da Float32 [n] (scala di ogni riga)
//   meta.json  dimensioni, origine e licenza
// Richiede models-src/static-mrl (scaricato da Hugging Face, vedi README).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reduce } from './load-static.mjs';

const DIMS = 128;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'public/model');
fs.mkdirSync(out, { recursive: true });

const r = reduce({ dims: DIMS, prune: true });
const kept = [];
for (let id = 0; id < r.V; id++) if (r.rows[id] >= 0) kept[r.rows[id]] = r.tokens[id];
fs.writeFileSync(path.join(out, 'vocab.txt'), kept.join('\n'));
const bin = Buffer.alloc(r.data.byteLength + r.scale.byteLength);
Buffer.from(r.data.buffer).copy(bin, 0);
Buffer.from(r.scale.buffer).copy(bin, r.data.byteLength);
fs.writeFileSync(path.join(out, 'emb.bin'), bin);
fs.writeFileSync(
  path.join(out, 'meta.json'),
  JSON.stringify({
    dims: DIMS,
    rows: r.nRows,
    origine: 'sentence-transformers/static-similarity-mrl-multilingual-v1 (Apache-2.0)',
    riduzione: `prime ${DIMS} dimensioni (Matryoshka), int8 per riga, solo token in alfabeto latino`,
  }, null, 2),
);
const mb = (f) => (fs.statSync(path.join(out, f)).size / 1e6).toFixed(2);
console.log(`public/model: ${r.nRows} token, emb.bin ${mb('emb.bin')} MB, vocab.txt ${mb('vocab.txt')} MB`);
