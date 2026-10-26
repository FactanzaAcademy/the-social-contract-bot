# Worker "tsc-regole-ai" (strada A, alternativa non usata)

> **Non usato.** Il ponte scelto è l'Edge Function Supabase: vedi `supabase/README.md`. Il Worker resta come alternativa e usa lo stesso nucleo `src/ai/ponte.js`; il test `test/ai/worker.test.js` lo tiene allineato.

Ponte tra il bot e **Claude Haiku 5.5**. Haiku non scrive risposte: legge la domanda e sceglie fino a 3 voci dal catalogo del bot (`src/catalog.json`). Le risposte restano quelle verificate. La chiave API vive solo nel Worker.

## Costi

- **Worker:** il piano gratuito di Cloudflare (100.000 richieste al giorno) basta, quindi 0 €.
- **Haiku 5.5:** circa $0,0001 a domanda con la cache calda, $0,001 a cache fredda (il catalogo pesa circa 7.000 token). La spesa reale per domanda la misura `node tools/ai/eval-ai.mjs`.
- **Limite:** `LIMITE_MENSILE_USD` (5 $ di default). Superato il limite il Worker risponde 429 e il bot torna alla sola ricerca locale, senza errori per il visitatore.

## Installazione (una volta)

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create SPESA          # incolla l'id in wrangler.toml
npx wrangler secret put ANTHROPIC_API_KEY       # la chiave della Console Anthropic
npx wrangler secret put SALE                    # una stringa casuale qualsiasi
```

In `wrangler.toml`, `ORIGINI` deve contenere l'URL di GitHub Pages del bot (per esempio `https://simoneddu98.github.io`), separato da virgole se ce ne sono più di uno.

```bash
node ../tools/ai/build-catalog.mjs   # rigenera il catalogo dalle voci attuali
npx wrangler deploy
```

Poi nel bot, in `public/config.json`, aggiungi `"ai": { "url": "https://tsc-regole-ai.<tuo-account>.workers.dev" }`, esegui `npm run build` e ripubblica `dist/`.

## Tetto rigido sulla Console Anthropic (consigliato)

Il contatore in KV è "morbido": KV è eventualmente coerente, quindi con molte richieste simultanee può sforare di qualche centesimo. Il tetto rigido va impostato sulla Console Anthropic: crea un **workspace** dedicato al bot, genera la chiave in quel workspace e imposta il suo **limite di spesa mensile**, per esempio 5 $. Oltre quel limite l'API rifiuta le chiamate e il bot torna alla ricerca locale.

## Prova in locale

```bash
cd worker
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .dev.vars   # file escluso da git
npx wrangler dev --port 8787
```

Poi in `public/config.json` usa `"ai": { "url": "http://localhost:8787" }`; l'origine `http://localhost:4173` è già consentita.

## Privacy

Le domande dei visitatori arrivano ad Anthropic (via Cloudflare). Il Worker non salva il testo: conserva solo la spesa del mese e un contatore orario per visitatore, con l'IP trasformato in hash. Va comunque citato nell'informativa del sito.

## Collaudo locale (senza login Cloudflare)

```bash
cd worker
node collaudo.mjs
```

Avvia `wrangler dev` in locale con impostazioni diverse, fa richieste vere (costa pochi centesimi) e verifica 13 punti: origini e CORS, richieste malformate, limite orario, tetto di spesa, errore generico con chiave non valida, e che la chiave non compaia mai nelle risposte né nei file pubblicati. Esito del 20-10-2026: **13/13**.

**Limite del controllo sull'origine:** blocca i browser di altri siti, ma uno script può falsificare l'intestazione `Origin`. Contro gli script valgono le altre protezioni: il limite orario per IP (in produzione l'IP lo scrive Cloudflare e non è falsificabile), il tetto di spesa del Worker e, soprattutto, il limite di spesa del workspace sulla Console Anthropic, che nessuno può aggirare.
