// Cloudflare Worker: alternativa (non usata) all'Edge Function Supabase, stesso ponte src/ai/ponte.js.
// La chiave API resta qui (segreto del Worker), mai nella pagina.
// Il contatore in KV è "morbido" (KV è eventualmente coerente): il tetto rigido va impostato anche
// sulla Console Anthropic (limite di spesa del workspace), vedi worker/README.md.
import Anthropic from '@anthropic-ai/sdk';
import catalog from './catalog.json';
import { handlePonte, configDa } from '../../src/ai/ponte.js';

// Contatori in KV: spesa del mese, domande per visitatore all'ora, domande totali all'ora.
function kvStore(kv) {
  const num = async (k) => Number((await kv.get(k)) || 0);
  return {
    async prenota({ mese, ora, ip, limiteMicro, limiteOrario, limiteTotale }) {
      if ((await num(`spesa:${mese}`)) >= limiteMicro) return 'limite-spesa';
      const ipKey = `ip:${ip}:${ora}`;
      const perIp = (await num(ipKey)) + 1;
      await kv.put(ipKey, String(perIp), { expirationTtl: 3700 });
      if (perIp > limiteOrario) return 'troppe-domande';
      const oraKey = `ora:${ora}`;
      const totale = (await num(oraKey)) + 1;
      await kv.put(oraKey, String(totale), { expirationTtl: 3700 });
      if (totale > limiteTotale) return 'troppe-domande';
      return 'ok';
    },
    async addebita(mese, micro) {
      const k = `spesa:${mese}`;
      await kv.put(k, String((await num(k)) + micro), { expirationTtl: 60 * 60 * 24 * 40 });
    },
  };
}

export function handle(request, env, deps = {}) {
  return handlePonte(request, configDa((k) => env[k]), {
    store: kvStore(env.SPESA),
    client: deps.client || new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
    catalog,
    ip: request.headers.get('CF-Connecting-IP') || 'sconosciuto',
    now: deps.now ? deps.now() : new Date(),
  });
}

export default { fetch: (request, env) => handle(request, env) };
