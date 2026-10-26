// Registro anonimo delle domande: serve a scoprire cosa i giocatori chiedono davvero e
// quali domande restano senza risposta. Nessun dato personale: niente nomi, niente IP salvati
// da noi, email e numeri di telefono mascherati nel testo.
//
// Configurazione (config.json accanto alla pagina):
//   { "registro": { "tipo": "nessuno" } }                         → niente esce dal browser (predefinito)
//   { "registro": { "tipo": "apps-script", "url": "https://script.google.com/macros/s/…/exec" } }
//   { "registro": { "tipo": "wix" } }                             → postMessage alla pagina Wix (elemento HTML + Velo)

export const VERSIONE = '2026-10-20';
const sessione = Math.random().toString(36).slice(2, 10); // casuale per ogni apertura della pagina

let config = { tipo: 'nessuno' };
let send = () => {};

// Maschera email, telefoni e numeri lunghi (es. codici) prima di registrare il testo.
export function sanitize(text) {
  return String(text || '')
    .slice(0, 300)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/(\+?\d[\d\s.-]{7,}\d)/g, '[numero]');
}

export function configure(cfg, { fetchImpl = globalThis.fetch, parent = globalThis.window?.parent } = {}) {
  config = { tipo: 'nessuno', ...(cfg || {}) };
  if (config.tipo === 'apps-script' && config.url) {
    // text/plain evita la richiesta preliminare CORS; la risposta non serve (no-cors)
    send = (ev) => fetchImpl(config.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(ev) }).catch(() => {});
  } else if (config.tipo === 'wix' && parent && parent !== globalThis.window) {
    send = (ev) => parent.postMessage({ tipo: 'tsc-registro', evento: ev }, '*');
  } else {
    config.tipo = 'nessuno';
    send = () => {};
  }
  return config.tipo;
}

export function enabled() {
  return config.tipo !== 'nessuno';
}

// tipo: 'domanda' | 'scelta' | 'nessuna' | 'non-so' | 'utile'
export function log(tipo, dati = {}) {
  const ev = { tipo, ts: new Date().toISOString(), sessione, versione: VERSIONE, ...dati };
  if (ev.domanda) ev.domanda = sanitize(ev.domanda);
  if (ev.nota) ev.nota = sanitize(ev.nota);
  send(ev);
  return ev;
}

export async function loadConfig(url = 'config.json') {
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return configure(null);
    const j = await r.json();
    return configure(j.registro);
  } catch {
    return configure(null);
  }
}
