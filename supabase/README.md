# Ponte AI su Supabase (strada A)

Edge Function `proponi`: ponte tra il bot e **Claude Haiku 5.5**. La chiave API vive solo nei segreti della funzione, mai nella pagina. Tre azioni:

| Indirizzo | Cosa fa |
| --- | --- |
| `…/functions/v1/proponi/rispondi` | **Quella che usa il bot.** Haiku risponde nel merito in 1-4 frasi usando solo i testi ufficiali di voci e carte (sono nel catalogo), e indica le fonti: il bot le mostra sotto come "Approfondisci nel regolamento". Se nei testi non c'è la risposta, non la inventa: il bot dice "Non trovo nulla tra le regole" e offre di segnalarlo. |
| `…/functions/v1/proponi/segnala` | Salva in `bot_segnalazioni` una domanda senza risposta, solo quando il visitatore tocca "Sì, segnala". |
| `…/functions/v1/proponi` | Modalità precedente: Haiku sceglie solo le voci, senza scrivere. Resta per compatibilità. |

Qualità misurata il 21-10-2026 con `node tools/ai/eval-risposte.mjs` (effort medium): set finale 39/40 con la fonte giusta e 0/8 risposte su domande fuori tema; set con parafrasi 27/30 e 0/9. Le risposte lette una per una corrispondono ai testi ufficiali.

## Com'è fatto

| File | Cosa fa |
| --- | --- |
| `functions/proponi/index.js` | Adattatore Deno: legge i segreti, chiama i contatori, passa tutto al ponte |
| `functions/_shared/*.js` | Copie generate di `src/ai/ponte.js`, `src/ai/haiku.js` e del catalogo: **non modificarle a mano** |
| `migrations/…_contatori_bot.sql` | Tabella `bot_contatori` e funzioni `bot_prenota` / `bot_addebita` |
| `migrations/…_segnalazioni_bot.sql` | Tabella `bot_segnalazioni` e funzione `bot_segnala` (massimo 5 all'ora per visitatore) |
| `dashboard/proponi.js` | La funzione in un solo file, da incollare nell'editor della dashboard (rigenerato da `build-catalog.mjs`) |
| `config.toml` | `verify_jwt = false` per `proponi`: il bot non ha utenti Supabase |

Dopo ogni modifica alla base di conoscenza, alle carte o a `src/ai/`, rigenera le copie (il test `test/ai/ponte.test.js` fallisce se non sono allineate):

```bash
node tools/ai/build-catalog.mjs
```

## Protezioni

1. **Origini:** risponde solo all'URL di GitHub Pages del bot (`ORIGINI`). Blocca i browser di altri siti, ma uno script può falsificare l'intestazione `Origin`: per questo ci sono i punti seguenti.
2. **Per visitatore:** `LIMITE_ORARIO` domande all'ora per IP (predefinito 200), salvato solo come hash con `SALE`. È alto apposta per Lucca Comics: in fiera molte persone escono dallo stesso IP (Wi-Fi dello stand, reti mobili con IP condiviso). L'IP arriva da `x-forwarded-for`, che un client può alterare.
3. **Totale:** `LIMITE_TOTALE_ORARIO` domande all'ora per tutti i visitatori insieme (predefinito 1000). Regge anche se l'IP viene falsificato: al massimo circa 1000 × 0,0007 $ ≈ 70 centesimi all'ora.
4. **Spesa del mese:** `LIMITE_MENSILE_USD`, calcolata dai token realmente usati. I contatori sono upsert atomici in Postgres: più preciso del KV di Cloudflare. Si può sforare solo delle domande già in volo nello stesso istante.
5. **Tetto rigido:** il limite di spesa del workspace sulla Console Anthropic, che nessuno può aggirare. Va impostato comunque.
6. **Solo regolamento:** `/rispondi` restituisce al massimo 1.200 caratteri e le fonti sono id del catalogo (output strutturato con `enum`). Una risposta senza almeno una fonte valida non passa, e alle domande fuori tema Haiku non risponde: l'endpoint non è utilizzabile come chatbot gratuito.

La tabella ha la RLS attiva senza policy e le funzioni sono eseguibili solo con la chiave di servizio, che resta dentro la funzione: con la chiave anon (pubblica) non si legge e non si altera nulla.

Quando un limite scatta, o se Haiku o i contatori non rispondono, il bot riceve una risposta non 200 e usa la sola ricerca locale. Il visitatore non vede errori. Se il database non risponde, la domanda **non** va ad Haiku (`seContatoriGiu` in `src/ai/ponte.js`, scelta del 26-10-2026): senza contatori la spesa non si può controllare, quindi il bot risponde con la base di conoscenza offline.

**Interruttore d'emergenza:** `LIMITE_MENSILE_USD=0` nei Secrets. Tutte le domande passano subito alla ricerca locale, senza ripubblicare il bot.

## Installazione (una volta)

Account: **Supabase di Factanza Academy** (info@factanzaacademy.com). Il login lo fa Simone. Servono il Supabase CLI e un progetto già creato dalla dashboard di quell'account.

```bash
cd bot
supabase login
supabase link --project-ref <ref-del-progetto>
supabase db push
supabase secrets set ANTHROPIC_API_KEY=<chiave del workspace "TSC bot"> SALE=<stringa casuale> ORIGINI=https://factanzaacademy.github.io LIMITE_MENSILE_USD=20 LIMITE_ORARIO=200 LIMITE_TOTALE_ORARIO=1000
supabase functions deploy proponi --no-verify-jwt
```

`LIMITE_MENSILE_USD`: con 5 $ si coprono circa 7.000 domande, che a Lucca possono non bastare. Tenerlo uguale o poco sotto il limite mensile del workspace sulla Console Anthropic.

### Con il repository GitHub collegato

Il repository è `FactanzaAcademy/the-social-contract-bot` (privato), con la cartella `supabase/` alla radice. Dalla dashboard: **Project Settings → Integrations → GitHub**, collega il repository, cartella Supabase `.` e ramo di produzione `main`. A ogni push su `main` Supabase applica le migrazioni e pubblica la funzione `proponi` (`config.toml` ha già `verify_jwt = false`; controlla dopo il primo deploy che sia davvero spento). I Secrets vanno comunque impostati a mano, una volta: non stanno nel repository.

`ORIGINI` è l'origine della pagina del bot (schema + dominio, senza percorso), separata da virgole se ce n'è più di una. Per le prove in locale aggiungi `http://localhost:4173`.

Poi nel bot, in `public/config.json`:

```json
{ "registro": { "tipo": "nessuno" }, "ai": { "url": "https://<ref-del-progetto>.supabase.co/functions/v1" } }
```

Il client chiama `<url>/proponi/rispondi` (e `<url>/proponi/segnala`). Esegui `npm run build` e ripubblica `dist/`.

### Dalla dashboard, senza CLI

1. **SQL Editor:** incolla ed esegui `migrations/…_contatori_bot.sql`, poi `migrations/…_segnalazioni_bot.sql`.
2. **Edge Functions → Deploy a new function → Via editor:** nome `proponi`, incolla tutto `dashboard/proponi.js`, poi Deploy. Nelle impostazioni della funzione disattiva **Verify JWT**.
3. **Edge Functions → Secrets:** gli stessi segreti del comando qui sopra.
4. `public/config.json` come sopra, `npm run build`, ripubblica.

Dopo ogni modifica alla base di conoscenza: `node tools/ai/build-catalog.mjs` e incolla di nuovo `dashboard/proponi.js`.

### Leggere le segnalazioni

Dashboard → **Table Editor → bot_segnalazioni**: domanda e data. Sono le domande a cui il regolamento non risponde: materiale per le FAQ o per i casi aperti.

## Da sapere

- **Pausa dei progetti gratuiti:** sul piano Free, Supabase mette in pausa i progetti inattivi per una settimana. Con il database in pausa i contatori non rispondono e il bot risponde solo con la ricerca locale finché non si riattiva il progetto dalla dashboard.
- **Costi:** il piano Free di Supabase basta (500.000 chiamate di Edge Function al mese). Con `/rispondi` Haiku costa circa 0,0007 $ a domanda (il regolamento intero, circa 25.000 token, resta nella cache per 5 minuti; la prima domanda dopo una pausa costa circa 0,003 $). Con 5 $ al mese sono almeno 1.600 domande, di solito molte di più.
- **Privacy:** le domande dei visitatori arrivano ad Anthropic passando da Supabase. La funzione non salva il testo delle domande, tranne quelle che il visitatore sceglie di segnalare (`bot_segnalazioni`, con l'IP solo come hash). Per il resto conserva la spesa del mese e i contatori orari. Va citato nell'informativa del sito.
- **Prova in locale:** `supabase functions serve` richiede Docker, che su questo Mac è spento. In alternativa `node tools/ai/ponte-locale.mjs` avvia lo stesso ponte su `http://localhost:8787` con la chiave di `bot/.env` (contatori in memoria, segnalazioni stampate nel terminale): poi in `dist/config.json` metti `"ai": { "url": "http://localhost:8787" }`. La logica è coperta dai test vitest (`test/ai/ponte.test.js`) e l'SQL dei contatori è stato provato su pglite.
