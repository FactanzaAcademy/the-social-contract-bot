// File generato da tools/ai/build-catalog.mjs: non modificarlo, modifica l'originale e rilancia lo script.
// Ponte tra il bot (browser) e Claude Haiku 5.5, indipendente dalla piattaforma.
// Lo usano l'Edge Function di Supabase (supabase/functions/proponi) e il Worker Cloudflare (worker/),
// che gli passano solo i contatori e il client Anthropic. La chiave API resta sul server, mai nella pagina.
//
// Protezioni:
//  - solo le origini in `origini` possono chiamarlo (CORS);
//  - limite di domande per visitatore all'ora, con l'IP salvato solo come hash;
//  - limite di domande all'ora per tutti i visitatori insieme: regge anche se l'IP è falsificabile;
//  - limite di spesa mensile, calcolato dall'uso reale dei token;
//  - /proponi risponde solo con gli id delle voci; /rispondi aggiunge una risposta breve scritta da Haiku
//    a partire dai soli testi ufficiali, sempre con le fonti (le voci da aprire per verificare);
//  - /segnala salva una domanda senza risposta solo quando il visitatore lo chiede (testo max 300 caratteri).
// Il tetto rigido resta il limite di spesa del workspace sulla Console Anthropic.
import { aiPropose, aiRispondi } from './haiku.js';

export const json = (body, status, cors) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

function corsHeaders(request, origini) {
  const origin = request.headers.get('Origin') || '';
  if (!origini.includes(origin)) return null;
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' };
}

export async function hashIp(sale, ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${sale}:${ip}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Legge le impostazioni dalle variabili d'ambiente (stessi nomi su Supabase e Cloudflare).
export function configDa(get) {
  return {
    origini: (get('ORIGINI') || '').split(',').map((s) => s.trim()).filter(Boolean),
    limiteMensileUsd: Number(get('LIMITE_MENSILE_USD') || 5),
    // Tarati per Lucca Comics: molte persone escono dallo stesso IP (Wi-Fi della fiera, reti mobili con
    // IP condiviso), quindi il limite per IP è alto; il tetto alla spesa lo fanno il totale orario e il mese.
    limiteOrario: Number(get('LIMITE_ORARIO') || 200),
    limiteTotaleOrario: Number(get('LIMITE_TOTALE_ORARIO') || 1000),
    sale: get('SALE') || 'tsc',
  };
}

// Cosa fare quando i contatori non rispondono (database in pausa o irraggiungibile).
// Restituisce null per lasciar passare la domanda verso Haiku, oppure una Response per fermarla.
// Scelta di Simone (26-10-2026): senza contatori niente Haiku, perché i limiti di spesa non si possono
// controllare. Il bot riceve 503 e risponde con la base di conoscenza offline (ricerca locale).
export function seContatoriGiu(errore, cors) {
  return json({ errore: 'contatori-non-disponibili' }, 503, cors);
}

// deps.store.prenota({ mese, ora, ip, limiteMicro, limiteOrario, limiteTotale }) → 'ok' | 'limite-spesa' | 'troppe-domande'
// deps.store.addebita(mese, micro) aggiunge la spesa della domanda (in milionesimi di dollaro).
// deps.store.segnala({ ip, domanda }) → 'ok' | 'troppe-domande' (facoltativo: senza, /segnala risponde 501).
// Gli indirizzi finiscono con l'azione: .../proponi, .../rispondi, .../segnala (su Supabase la funzione
// si chiama "proponi", quindi sono /functions/v1/proponi, /functions/v1/proponi/rispondi e .../segnala).
export async function handlePonte(request, cfg, { store, client, catalog, ip = 'sconosciuto', now = new Date() }) {
  const cors = corsHeaders(request, cfg.origini);
  if (!cors) return new Response('Origine non consentita', { status: 403 });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const percorso = new URL(request.url).pathname;
  const azione = percorso.endsWith('/rispondi') ? 'rispondi' : percorso.endsWith('/segnala') ? 'segnala' : percorso.endsWith('/proponi') ? 'proponi' : null;
  if (request.method !== 'POST' || !azione) return json({ errore: 'non-trovato' }, 404, cors);

  let domanda = '';
  try {
    const raw = await request.text();
    if (raw.length > 2000) return json({ errore: 'richiesta-troppo-lunga' }, 413, cors);
    domanda = String(JSON.parse(raw).domanda || '').trim().slice(0, 300);
  } catch {
    return json({ errore: 'richiesta-non-valida' }, 400, cors);
  }
  if (!domanda) return json({ errore: 'domanda-vuota' }, 400, cors);

  if (azione === 'segnala') {
    if (!store.segnala) return json({ errore: 'segnalazioni-non-attive' }, 501, cors);
    try {
      const esito = await store.segnala({ ip: await hashIp(cfg.sale, ip), domanda });
      return esito === 'ok' ? json({ ok: true }, 200, cors) : json({ errore: esito }, 429, cors);
    } catch {
      return json({ errore: 'segnalazione-non-salvata' }, 503, cors);
    }
  }

  const mese = now.toISOString().slice(0, 7);
  const ora = now.toISOString().slice(0, 13);
  let esito;
  try {
    esito = await store.prenota({
      mese,
      ora,
      ip: await hashIp(cfg.sale, ip),
      limiteMicro: Math.round(cfg.limiteMensileUsd * 1e6),
      limiteOrario: cfg.limiteOrario,
      limiteTotale: cfg.limiteTotaleOrario,
    });
  } catch (e) {
    const stop = seContatoriGiu(e, cors);
    if (stop) return stop;
    esito = 'ok';
  }
  if (esito !== 'ok') return json({ errore: esito }, 429, cors);

  let r;
  try {
    r = await (azione === 'rispondi' ? aiRispondi : aiPropose)(client, catalog, domanda);
  } catch {
    return json({ errore: 'ai-non-disponibile' }, 502, cors);
  }
  try {
    await store.addebita(mese, Math.round(r.costo * 1e6));
  } catch {
    // la risposta è già pagata: meglio darla comunque che perderla
  }
  if (azione === 'rispondi') return json({ risposta: r.risposta, trovata: r.trovata, fuori_tema: r.fuoriTema, proposte: r.keys }, 200, cors);
  return json({ proposte: r.keys, fuori_tema: r.fuoriTema }, 200, cors);
}
