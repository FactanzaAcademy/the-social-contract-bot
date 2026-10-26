# Assistente alle regole di The Social Contract

Bot offline per il sito Wix di Factanza: risponde alle domande sulle regole e sulle 88 carte, e calcola le situazioni concrete (asta, risoluzione Eventi, punteggio finale, ordine degli effetti). **Nessuna API e nessun servizio esterno**: tutto gira nel browser del visitatore. Per capire le parafrasi usa un piccolo modello semantico statico (8 MB) scaricato insieme alla pagina.

## Come funziona

| Parte | File | Cosa fa |
|---|---|---|
| Dati delle carte | `data/*.json` | 39 Progetti, 23 Eventi, 26 Pensatori e il tabellone, trascritti dalle immagini (icone comprese) |
| Motore di regole | `src/engine/` | asta e Leader, piazzamento, effetti, Colpi di scena, Tensione, risolutore degli Eventi, punteggi, fine partita |
| Base di conoscenza | `src/kb/rules.js`, `paraphrases.js`, `rules-extra.js` | 75 voci (69 di regola con citazione di pagina, 6 "fuori dal regolamento"), quasi 1.500 formulazioni di esempio |
| Casi aperti | `src/kb/ambiguities.json` | 25 casi che il regolamento stampato non risolve. 23 sono decisi da Factanza (`"stato": "confermata"`, 26-10-2026); per gli altri 2 il bot dice cosa dice il testo, cosa non dice e quale interpretazione applica |
| Decisioni ufficiali | `src/kb/house-rules.js` | `DECISIONI` e `resolveAmbiguity()`: il testo ufficiale di ogni caso deciso. Il test `test/kb/house-rules.test.js` controlla che coincida con gli stati di `ambiguities.json` |
| Chat | `src/chat/` | normalizzazione, sinonimi, riconoscimento dei nomi delle carte, abbinamento alle voci, calcolo dell'asta da testo |
| Comprensione semantica | `src/semantic/`, `public/model/` | modello statico (static-similarity-mrl-multilingual-v1, Apache-2.0) ridotto a 128 dimensioni int8 e ai soli token latini: 8,1 MB. Si carica dopo la pagina; finché non è pronto il bot usa solo le parole chiave |
| Interfaccia | `src/ui/` | schede "Chiedi" e "Verifica una situazione" |

## Comandi

```bash
npm install
npm test              # motore, esempi ufficiali, 10.000 partite simulate, banca domande
npm run build         # crea dist/ (index.html + immagini delle carte)
npm run review        # crea review/carte.html per controllare la trascrizione delle carte
node tools/eval.mjs test/kb/questions-final.tsv --semantico   # accuratezza su un set di domande
node tools/semantic/build-model.mjs   # ricrea public/model da models-src/ (pesi originali, 434 MB, da Hugging Face)
```

## Set di domande

- `test/kb/questions-rules.tsv` + domande generate sulle carte: set di **sviluppo** (usato per mettere a punto il bot).
- `questions-holdout.tsv`, `questions-blind.tsv`: nati come set ciechi, poi usati per correggere errori → ora di **sviluppo**.
- `questions-final.tsv`: set cieco scritto da un agente che non ha visto codice né esempi. Misurato una volta per ogni versione, mai usato per tarare.
- `questions-semantic-blind.tsv`: set cieco di parafrasi difficili. Le righe dispari sono servite a tarare le soglie del modello (`tools/semantic/calibrate.mjs`); le pari solo per la verifica, misurata una volta.

Per una misura onesta dopo nuove modifiche serve un nuovo set mai visto.

## Pubblicazione

1. Repository privato `FactanzaAcademy/the-social-contract-bot` (account GitHub **FactanzaAcademy**). A ogni push su `main` il workflow `.github/workflows/pages.yml` esegue i test, `npm run build` e pubblica `dist/` su GitHub Pages; se un test fallisce, il sito resta alla versione precedente.
2. In locale basta `npm run build` per provare `dist/`.
3. In Wix: **Aggiungi → Incorpora codice → Incorpora un sito** (Embed a site), incolla l'URL di GitHub Pages. Altezza consigliata: almeno 700 px. Il bot scorre al suo interno.

Per aggiornare il bot basta rifare la build e ripubblicare `dist/`: in Wix non va toccato nulla.

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

- **Un errore in una carta**: correggi `data/*.json`, poi `npm test` e `npm run review`.
- **Una risposta da cambiare**: modifica la voce in `src/kb/rules.js`.
- **Una domanda che il bot non capisce**: aggiungi la formulazione agli `esempi` della voce giusta (o in `paraphrases.js`).
- **Factanza decide un caso aperto**: aggiungi la decisione in `src/kb/house-rules.js` e metti `"stato": "confermata"` in `ambiguities.json`.

## Risultati misurati (20-10-2026)

**Motore di regole** (`npm test`):
- 86 test superati;
- esempi ufficiali di pag. 13, 16-18 e 20-21 riprodotti: Bianca 13, Matteo 22. L'esempio di Andrea contiene un refuso (M.O.R.T.O. costa 10), vedi `esempio-andrea`;
- asta verificata su tutte le combinazioni di offerte (2-6 giocatori);
- Eventi verificati su 9.200 tabelloni casuali;
- 26 Pensatori confrontati con un calcolo indipendente su 7.800 fine partita;
- 10.000 partite simulate senza violazioni: monete conservate, nessuna carta persa o duplicata.

**Chat**, domande in testo libero:

| Set | Giuste al primo colpo | Giuste entro un clic ("Intendevi…?") | Sicure ma sbagliate |
|---|---|---|---|
| Sviluppo (829 domande) | 98,3% | — | 0,5% |
| Ex-cieco 1 (63) | 87,3% | — | 3,2% |
| Ex-cieco 2 (220) | 86,4% | 96,4% | 1,4% |
| **Cieco finale (200, mai visto)** | **70,0%** | **85,5%** | **7,5%** |

La riga che conta è l'ultima. Sulle domande nuove le regole scendono al 58% al primo colpo. Le carte (85%) e i calcoli dell'asta (82%) reggono meglio, perché lì il bot riconosce nomi e numeri invece di indovinare il senso della frase. La differenza tra set di sviluppo e set cieco è il limite di un abbinamento a parole chiave senza AI.

### Con la comprensione semantica (20-10-2026)

Le soglie dell'abbinamento ibrido (somiglianza semantica + parole chiave) sono **prudenti**: quando il bot non è abbastanza sicuro propone 2-3 voci ("Intendevi…?") invece di rispondere.

| Set cieco | Modalità | Giuste al primo colpo | Giuste entro un clic | Sicure ma sbagliate |
|---|---|---|---|---|
| Set cieco finale (200) | solo parole chiave | 70,0% | 85,5% | 7,5% |
| | **semantica, soglie prudenti** | 64,5% | **90,5%** | **4,5%** |
| Parafrasi difficili, metà di verifica (110) | solo parole chiave | 58,2% | 72,7% | 7,3% |
| | semantica, soglie dello sviluppo | 57,3% | 74,5% | 6,4% |
| | **semantica, soglie prudenti** | 43,6% | **76,4%** | **4,5%** |

Cosa vuol dire:
- Il modello statico aiuta a **raggiungere** la risposta giusta (da +4 a +5 punti entro un clic) e **riduce di circa il 40% le risposte sicure ma sbagliate**. In cambio il bot chiede conferma più spesso.
- Sulle parafrasi molto lontane dal lessico del gioco ("il gettone di chi comanda") resta debole: un modello statico fa la media delle parole, non capisce la frase.
- Un transformer piccolo (multilingual-e5-small) sui set di sviluppo fa circa 7 punti in più del modello statico (91% contro 84% al primo colpo), ma pesa circa 118 MB.
- Le risposte sicure ma sbagliate rimaste vengono soprattutto dal riconoscimento dei nomi delle carte, che è ancora a parole chiave.

## Modalità proposte (attiva dal 20-10-2026)

Il bot **non risponde mai da solo**:
1. a ogni domanda propone fino a 3 voci: regola, caso aperto, carta riconosciuta (da confermare) o calcolo;
2. la risposta arriva solo dopo la scelta dell'utente;
3. i calcoli dell'asta non hanno mai una risposta testuale: aprono il verificatore già compilato, l'utente controlla i numeri letti dalla domanda e il risultato lo calcola il motore;
4. ogni risposta chiede "Ti è stata utile? Sì / No", e c'è sempre "Nessuna di queste".

Le risposte sicure ma sbagliate sono quindi **0% per costruzione**. Restano i casi in cui la voce giusta non è tra le proposte, misurati su set ciechi mai usati per questa modalità:

| Set cieco | Voce giusta tra le proposte | Come prima proposta |
|---|---|---|
| Set cieco finale (192 domande in tema) | 90,6% | 78,6% |
| Parafrasi difficili, metà di verifica (101) | 77,2% | 70,3% |

Lì l'utente preme "Nessuna di queste" e la domanda finisce nel registro. Il contenuto delle risposte è a 0 errori solo dopo due passi umani: l'approvazione delle 88 carte (`npm run review`) e la decisione di Factanza sui 25 casi aperti (documento "The Social Contract: casi aperti del regolamento"). Al 26-10-2026 ne sono decisi 23: manca la conferma sul caso 20 ("a sinistra" del Leader), e il caso 24 non può capitare col tabellone attuale. Tre decisioni hanno cambiato il motore: la seconda carta della Promessa Elettorale attiva il suo effetto, a tabellone pieno senza Eventi risolvibili la Tensione sale di 1 (variante `stallo: 'blocco'` per il regolamento stampato), Michelangelo conta un Progetto per ogni costo distinto.

## Registro delle domande

Il registro è anonimo: per ogni apertura della pagina c'è un identificativo casuale, email e numeri di telefono vengono mascherati, nessun dato personale. Registra le domande, le proposte mostrate, la scelta, "Nessuna di queste", "non trovo" e il voto utile sì/no. È **spento di default** (`public/config.json` → `"tipo": "nessuno"`): finché è spento non esce nulla dalla pagina.

Per attivarlo, scegli uno dei due modi:
- **Google Sheet** (consigliato, funziona con "Incorpora un sito"): segui le istruzioni in `tools/registro/apps-script.gs`, poi `{"registro": {"tipo": "apps-script", "url": "…/exec"}}`. Il foglio "Senza risposta" raccoglie da solo le domande da trasformare in nuove voci.
- **Collezione Wix**: richiede l'elemento "HTML iframe" e Velo; codice e istruzioni in `tools/registro/wix-velo.js`. Poi `{"registro": {"tipo": "wix"}}`.

Dopo la modifica: `npm run build` e ripubblica `dist/`. Quando il registro è attivo, sotto la chat compare l'avviso che le domande vengono registrate in forma anonima. Prima di attivarlo, verifica con chi si occupa della privacy di Factanza se va citato nell'informativa del sito.

## Strada A: Claude Haiku 5.5 sceglie le voci (prototipo, 20-10-2026)

Facoltativa e spenta di default. Se in `public/config.json` c'è `"ai": {"url": "<Worker>"}`, il bot chiede a **Claude Haiku 5.5**, tramite un Cloudflare Worker, quali voci del catalogo rispondono alla domanda. Haiku non scrive risposte: restituisce solo id di voci, presi da un elenco chiuso (schema JSON con `enum`), che il bot valida di nuovo. Le risposte restano quelle verificate, quindi resta **0% di risposte sicure ma sbagliate** e 0 testo inventato. Se il Worker non risponde entro 6 secondi, è al limite di spesa o è spento, il bot usa la sola ricerca locale. Il codice è in `src/ai/` (modulo condiviso), `worker/` (istruzioni in `worker/README.md`) e `tools/ai/eval-ai.mjs` (misura).

Misura su set ciechi mai usati per costruire o tarare questa versione:

| Set cieco | Voce giusta tra le proposte: locale → **Haiku + locale** | Come prima proposta: locale → **Haiku + locale** |
|---|---|---|
| Set cieco finale (192 in tema) | 90,6% → **96,9%** | 78,6% → **91,1%** |
| Parafrasi difficili, metà di verifica (101) | 77,2% → **98,0%** | 70,3% → **93,1%** |

- **Costo misurato:** $0,00017 a domanda. 10.000 domande al mese costano circa 1,70 $, più le scritture in cache quando il traffico è rado (cache fredda: $0,0015 a domanda).
- **Latenza:** mediana 1,4 s, 95° percentile 2,9 s.
- **Fuori tema:** in 10 casi su 17 il bot risponde "non trovo"; negli altri mostra proposte locali che l'utente scarta con "Nessuna di queste". Si potrebbe fidarsi di più del "fuori tema" di Haiku, ma va misurato su un set nuovo.
- **Catalogo:** 11.704 token. Va rigenerato con `node tools/ai/build-catalog.mjs` a ogni modifica delle voci.
