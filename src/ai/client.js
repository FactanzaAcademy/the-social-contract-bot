// Browser: chiede al Worker quali voci propone Haiku. Se il Worker non risponde in tempo,
// è al limite di spesa o è spento, restituisce null e il bot usa solo la ricerca locale.
export async function aiFetch(url, domanda, { timeoutMs = 6000, fetchImpl = globalThis.fetch } = {}) {
  if (!url) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(`${url.replace(/\/$/, '')}/proponi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domanda }),
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!Array.isArray(j.proposte)) return null;
    return { proposte: j.proposte.filter((k) => typeof k === 'string').slice(0, 3), fuoriTema: !!j.fuori_tema };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Risposta nel merito: Haiku risponde con i testi ufficiali e indica le fonti (voci da approfondire).
// null se il ponte non risponde in tempo o rifiuta: il bot torna alle sole proposte locali.
export async function aiAnswer(url, domanda, { timeoutMs = 12000, fetchImpl = globalThis.fetch } = {}) {
  const j = await post(url, 'proponi/rispondi', { domanda }, { timeoutMs, fetchImpl });
  if (!j || typeof j.risposta !== 'string' || !Array.isArray(j.proposte)) return null;
  return {
    risposta: j.risposta.slice(0, 1200),
    trovata: !!j.trovata && !!j.risposta.trim(),
    fuoriTema: !!j.fuori_tema,
    proposte: j.proposte.filter((k) => typeof k === 'string').slice(0, 3),
  };
}

// Segnalazione agli sviluppatori di una domanda senza risposta: true se il ponte l'ha salvata.
export async function aiReport(url, domanda, { timeoutMs = 8000, fetchImpl = globalThis.fetch } = {}) {
  return !!(await post(url, 'proponi/segnala', { domanda }, { timeoutMs, fetchImpl }))?.ok;
}

async function post(url, azione, body, { timeoutMs, fetchImpl }) {
  if (!url) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(`${url.replace(/\/$/, '')}/${azione}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
