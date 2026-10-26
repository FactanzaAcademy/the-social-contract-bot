// Edge Function Supabase "proponi": ponte tra il bot (browser) e Claude Haiku 5.5 (strada A).
// Indirizzi: .../proponi (Haiku sceglie le voci), .../proponi/rispondi (risponde), .../proponi/segnala.
// La logica sta in ../_shared/ponte.js, copia di src/ai/ponte.js: i file in _shared li scrive
// tools/ai/build-catalog.mjs, non vanno modificati a mano. Qui ci sono solo i contatori
// (tabella bot_contatori), le segnalazioni (bot_segnalazioni, vedi supabase/migrations) e il client Anthropic.
import Anthropic from 'npm:@anthropic-ai/sdk@0.135.0';
import catalog from '../_shared/catalog.js';
import { handlePonte, configDa } from '../_shared/ponte.js';

const env = (k) => Deno.env.get(k);
const cfg = configDa(env);
const client = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') });

// Chiave di servizio: quella legacy se c'è, altrimenti la chiave segreta "default" dei progetti nuovi.
function chiaveServizio() {
  if (env('SUPABASE_SERVICE_ROLE_KEY')) return env('SUPABASE_SERVICE_ROLE_KEY');
  try {
    return JSON.parse(env('SUPABASE_SECRET_KEYS') || '{}').default;
  } catch {
    return undefined;
  }
}

// Chiamata a una funzione SQL con la chiave di servizio (solo lato server: la chiave anon non può).
async function rpc(nome, args) {
  const key = chiaveServizio();
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (key?.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/${nome}`, { method: 'POST', headers, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`rpc ${nome}: HTTP ${r.status}`);
  return r.status === 204 ? null : r.json();
}

const store = {
  prenota: ({ mese, ora, ip, limiteMicro, limiteOrario, limiteTotale }) =>
    rpc('bot_prenota', { p_mese: mese, p_ora: ora, p_ip: ip, p_limite_micro: limiteMicro, p_limite_orario: limiteOrario, p_limite_totale: limiteTotale }),
  addebita: (mese, micro) => rpc('bot_addebita', { p_mese: mese, p_micro: micro }),
  segnala: ({ ip, domanda }) => rpc('bot_segnala', { p_ip: ip, p_domanda: domanda }),
};

// L'IP lo scrive la piattaforma in x-forwarded-for, ma un client può aggiungerne uno suo:
// per questo, oltre al limite per visitatore, c'è il limite totale per ora.
const ipDi = (request) => (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'sconosciuto';

Deno.serve((request) => handlePonte(request, cfg, { store, client, catalog, ip: ipDi(request), now: new Date() }));
