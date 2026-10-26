# Assistente alle regole di The Social Contract

Chatbot per il sito Wix di Factanza: risponde alle domande sulle regole e sulle 88 carte del gioco da tavolo, e calcola le situazioni concrete (asta, risoluzione Eventi, punteggio finale, ordine degli effetti). La mascotte si chiama Patto.

- **Con l'AI** (in produzione): Claude Haiku 5.5 risponde nel merito in 1-4 frasi usando **solo** i testi ufficiali di voci e carte, e sotto mostra le fonti ("Approfondisci nel regolamento"). Le domande passano da un ponte su Supabase (account Factanza Academy), che tiene la chiave API e i limiti di spesa.
- **Senza AI** (ripiego automatico, se il ponte non risponde o un limite è raggiunto): ricerca locale nel browser con un piccolo modello semantico (8 MB). Propone 2-3 schede del regolamento e risponde dopo la scelta.
- I calcoli li fa sempre il motore delle regole, mai l'AI.

## Come funziona

| Parte | File | Cosa fa |
|---|---|---|
| Dati delle carte | `data/*.json` | 39 Progetti, 23 Eventi, 26 Pensatori e il tabellone, trascritti dalle immagini (icone comprese) |
| Motore di regole | `src/engine/` | asta e Leader, piazzamento, effetti, Colpi di scena, Tensione, risolutore degli Eventi, punteggi, fine partita |
| Base di conoscenza | `src/kb/rules.js`, `paraphrases.js`, `rules-extra.js` | 75 voci (69 di regola con citazione di pagina, 6 "fuori dal regolamento"), quasi 1.500 formulazioni di esempio |
| Casi aperti | `src/kb/ambiguities.json` | 25 casi che il regolamento stampato non risolve. 23 sono decisi da Factanza (`"stato": "confermata"`, 26-10-2026); per gli altri 2 il bot dice cosa dice il testo, cosa non dice e quale interpretazione applica |
| Decisioni ufficiali | `src/kb/house-rules.js` | `DECISIONI` e `resolveAmbiguity()`: il testo ufficiale di ogni caso deciso. Il test `test/kb/house-rules.test.js` controlla che coincida con gli stati di `ambiguities.json` |
| AI | `src/ai/haiku.js`, `src/ai/ponte.js`, `src/ai/client.js` | istruzioni e catalogo per Haiku, ponte con limiti e contatori, chiamate dal browser con ripiego locale |
| Ponte su Supabase | `supabase/` | Edge Function `proponi`, migrazioni SQL di contatori e segnalazioni. Guida: [`supabase/README.md`](supabase/README.md) |
| Chat | `src/chat/` | normalizzazione, sinonimi, riconoscimento dei nomi delle carte, abbinamento alle voci, calcolo dell'asta da testo |
| Comprensione semantica | `src/semantic/`, `public/model/` | modello statico (static-similarity-mrl-multilingual-v1, Apache-2.0) ridotto a 128 dimensioni int8 e ai soli token latini: 8,1 MB |
| Interfaccia | `src/ui/` | schede "Chat" e "Strumenti" (verificatore), mascotte Patto |
| Privacy | `src/kb/privacy.js` | informativa mostrata dal link "Privacy" sotto la casella. **Bozza**: le parti tra [quadre] vanno completate prima della pubblicazione (la build avvisa) |

## Comandi

```bash
npm ci
npm test                                   # motore, decisioni, esempi ufficiali, partite simulate, banca domande, ponte
npm run build                              # crea dist/ (index.html + carte + modello + Patto)
npm run review                             # crea review/carte.html per controllare la trascrizione delle carte
node tools/ai/build-catalog.mjs            # rigenera il catalogo per Haiku e le copie per Supabase (dopo ogni modifica a voci, carte o src/ai/)
node tools/eval-proposte.mjs test/kb/questions-final.tsv --semantico   # ricerca locale su un set cieco
node tools/ai/eval-risposte.mjs test/kb/questions-final.tsv 40         # risposte AI su un set cieco (chiave in .env, circa 3 centesimi)
node tools/varianti.mjs 10000              # partite simulate con le varianti di regola
```

`.env` (non nel repository) contiene `ANTHROPIC_API_KEY`, solo per le misure in locale. In produzione la chiave sta nei Secrets di Supabase.

## Pubblicazione

1. Repository privato `FactanzaAcademy/the-social-contract-bot` (account GitHub **FactanzaAcademy**). A ogni push su `main` il workflow `.github/workflows/pages.yml` esegue i test, `npm run build` e pubblica `dist/` su GitHub Pages; se un test fallisce, il sito resta alla versione precedente.
2. Ponte AI: repository collegato al progetto Supabase di Factanza Academy (vedi `supabase/README.md`); `public/config.json` deve contenere `"ai": {"url": "https://<ref>.supabase.co/functions/v1"}`.
3. In Wix: **Aggiungi → Incorpora codice → Incorpora un sito** (Embed a site), incolla l'URL di GitHub Pages. Altezza consigliata: almeno 700 px, da sistemare anche nella vista mobile di Wix.

Per aggiornare il bot basta un push su `main`: in Wix non va toccato nulla.

## Risposte con l'AI: qualità misurata (26-10-2026)

Misurate con `tools/ai/eval-risposte.mjs` (effort medium) dopo le decisioni di Factanza, su set ciechi mai usati per tarare:

| Set | Fonte giusta | Domande fuori tema con risposta |
|---|---|---|
| Set cieco finale, campione di 40 + 8 fuori tema | 40/40 | 0/8 |
| Domande sui casi decisi (39, dai due set ciechi) | 39/39, rilette tutte a mano | — |

- **Costo:** circa 0,0007 $ a domanda (il catalogo resta in cache per 5 minuti); 48 domande sono costate 0,035 $. Tempo medio 2,9 s.
- **Protezioni del ponte:** origini consentite, 200 domande all'ora per IP e 1000 in tutto (tarati per Lucca Comics), limite di spesa mensile, e il limite del workspace sulla Console Anthropic. Se il database non risponde, la domanda non va all'AI e il bot usa la ricerca locale.
- **Ripiego:** con l'AI giù il bot propone le schede locali (scheda giusta tra le proposte nel 90,6% del set cieco finale).

## Patto, la mascotte 3D (nome provvisorio)

Patto compare accanto ai messaggi del bot (`src/ui/patto3d.js`). Una sola istanza di `<model-viewer>` (4.4.0, servito da `dist/vendor/`, nessun CDN) vive sull'ultimo messaggio; i precedenti mostrano l'immagine statica. La libreria si carica dopo il primo disegno: la chat non la aspetta.

| Stato | Animazione Meshy | Quando |
|---|---|---|
| saluto | `Big_Wave_Hello` | benvenuto (un tocco su Patto lo ripete) |
| attesa | `Walking` in ciclo | mentre il bot cerca o aspetta l'AI |
| confuso | `Confused_Scratch` | "Non trovo una risposta" e "Nessuna di queste" |
| riposo | coda di `Big_Wave_Hello` | tutte le altre risposte; è la posa del poster |

Senza WebGL, con prefers-reduced-motion o con `?statico` nell'indirizzo resta solo l'immagine statica e model-viewer non viene scaricato.

- `public/patto/patto.glb`: da rigenerare con `tools/patto/ottimizza.sh <con-scheletro.glb> <con-texture.glb>` (gltf-transform 4.5.1: texture del modello "solo texture", pesi del foglio sulla colonna, ~23k triangoli, texture 1024 WebP, meshopt).
- `public/patto/patto-poster.webp`: 240×288 con trasparenza, da rigenerare con `tools/patto/poster.html` (istruzioni nel file). L'inquadratura è la stessa di `patto3d.js`.
- Pesi: GLB 537 KB, poster 10 KB, model-viewer 1,04 MB (282 KB compresso gzip).

## Aggiornare le regole

- **Un errore in una carta**: correggi `data/*.json`, poi `npm test`, `npm run review` e `node tools/ai/build-catalog.mjs`.
- **Una risposta da cambiare**: modifica la voce in `src/kb/rules.js`, poi rigenera il catalogo.
- **Una domanda che il bot non capisce**: aggiungi la formulazione agli `esempi` della voce giusta (o in `paraphrases.js`).
- **Factanza decide un caso aperto**: aggiungi il testo in `DECISIONI` (`src/kb/house-rules.js`), metti `"stato": "confermata"` in `ambiguities.json`, rigenera il catalogo. Se la decisione cambia una regola, aggiorna `src/engine/` e `test/engine/decisioni.test.js`.

Le decisioni del 26-10-2026 che hanno cambiato il motore: la seconda carta della Promessa Elettorale attiva il suo effetto; a tabellone pieno senza Eventi risolvibili la Tensione sale di 1 (variante `stallo: 'blocco'` per il regolamento stampato); Michelangelo conta un Progetto per ogni costo distinto. Manca la conferma sul caso 20 ("a sinistra" del Leader); il caso 24 non può capitare col tabellone attuale.

## Set di domande

- `test/kb/questions-rules.tsv` + domande generate sulle carte: set di **sviluppo** (usato per mettere a punto il bot).
- `questions-holdout.tsv`, `questions-blind.tsv`: nati come set ciechi, poi usati per correggere errori → ora di **sviluppo**.
- `questions-final.tsv`: set cieco scritto da un agente che non ha visto codice né esempi. Misurato una volta per ogni versione, mai usato per tarare.
- `questions-semantic-blind.tsv`: set cieco di parafrasi difficili. Le righe dispari sono servite a tarare le soglie del modello (`tools/semantic/calibrate.mjs`); le pari solo per la verifica.

Per una misura onesta dopo nuove modifiche serve un nuovo set mai visto: dopo il lancio, le domande vere (segnalazioni e registro) diventano nuovi set ciechi.

## Registro delle domande

Il registro è anonimo: per ogni apertura della pagina c'è un identificativo casuale, email e numeri di telefono vengono mascherati. Registra le domande, le proposte mostrate, la scelta, "Nessuna di queste", "non trovo" e il voto utile sì/no. È **spento di default** (`public/config.json` → `"tipo": "nessuno"`).

Per attivarlo: **Google Sheet** (`tools/registro/apps-script.gs`, poi `{"registro": {"tipo": "apps-script", "url": "…/exec"}}`) oppure **collezione Wix** (`tools/registro/wix-velo.js`, poi `{"registro": {"tipo": "wix"}}`). Quando è attivo, sotto la chat compare l'avviso. Va citato nell'informativa privacy prima di accenderlo.

Le segnalazioni ("Sì, segnala" quando il bot non trova la risposta) sono un'altra cosa: si salvano sempre in `bot_segnalazioni` su Supabase.

## Storico delle misure

### Ricerca locale (20-10-2026)

Prima versione, a parole chiave, che rispondeva da sola: sul set cieco finale 70,0% giuste al primo colpo e 7,5% sicure ma sbagliate. Con il modello semantico e soglie prudenti: 90,5% entro un clic e 4,5% sicure ma sbagliate. Da qui la **modalità proposte**: senza AI il bot non risponde mai da solo, propone fino a 3 schede e risponde dopo la scelta, quindi le risposte sicure ma sbagliate sono 0% per costruzione.

| Set cieco | Scheda giusta tra le proposte | Come prima proposta |
|---|---|---|
| Set cieco finale (192 domande in tema) | 90,6% | 78,6% |
| Parafrasi difficili, metà di verifica (101) | 77,2% | 70,3% |

### Haiku che sceglie le voci, senza scrivere (20-10-2026)

Prima dell'attuale modalità con risposta, Haiku restituiva solo gli id delle voci: scheda giusta tra le proposte 96,9% sul set finale e 98,0% sulle parafrasi. L'endpoint `…/proponi` resta per compatibilità. Il Cloudflare Worker in `worker/` è un'alternativa non usata: il ponte gira su Supabase.
