// Carica public/model in Node (test e misure) e attiva la comprensione semantica nel router.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { modelFromFiles, buildIndex } from '../../src/semantic/index.js';
import { entries } from '../../src/chat/matcher.js';
import { setSemantic } from '../../src/chat/router.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/model');

export function loadSemantic() {
  const bin = fs.readFileSync(path.join(dir, 'emb.bin'));
  const model = modelFromFiles({
    vocab: fs.readFileSync(path.join(dir, 'vocab.txt'), 'utf8'),
    bin: bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength),
    meta: JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')),
  });
  const index = buildIndex(model, entries);
  setSemantic(index);
  return index;
}
