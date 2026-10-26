// Scarica il modello semantico (≈8 MB) nel browser e attiva l'abbinamento ibrido.
// Nessuna API: sono file statici serviti accanto alla pagina e messi in cache dal browser.
import { modelFromFiles, buildIndex } from './index.js';
import { entries } from '../chat/matcher.js';
import { setSemantic } from '../chat/router.js';

async function fetchWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) {
    const buf = await res.arrayBuffer();
    onProgress(1);
    return buf;
  }
  const reader = res.body.getReader();
  const out = new Uint8Array(total);
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.set(value, got);
    got += value.length;
    onProgress(got / total);
  }
  return out.buffer;
}

// onStatus({ stato: 'caricamento'|'attivo'|'errore', progresso: 0..1 })
export async function loadSemantic(base = 'model/', onStatus = () => {}) {
  try {
    onStatus({ stato: 'caricamento', progresso: 0 });
    const [meta, vocab] = await Promise.all([
      fetch(base + 'meta.json').then((r) => r.json()),
      fetch(base + 'vocab.txt').then((r) => r.text()),
    ]);
    const bin = await fetchWithProgress(base + 'emb.bin', (p) => onStatus({ stato: 'caricamento', progresso: p }));
    const model = modelFromFiles({ vocab, bin, meta });
    setSemantic(buildIndex(model, entries));
    onStatus({ stato: 'attivo', progresso: 1 });
  } catch (e) {
    console.warn('Comprensione semantica non disponibile, uso solo le parole chiave:', e);
    onStatus({ stato: 'errore', progresso: 0 });
  }
}
