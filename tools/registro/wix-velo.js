// Registro delle domande del bot → collezione Wix (alternativa a Google Sheet).
//
// Funziona solo se il bot è inserito con l'elemento "HTML iframe" di Wix (Incorpora codice →
// Incorpora HTML → "Indirizzo del sito web" con l'URL di GitHub Pages), NON con "Incorpora un sito":
// solo l'elemento HTML riceve i messaggi della pagina incorporata.
//
// Installazione:
// 1. Attiva la Modalità sviluppatore (Velo) nell'editor Wix.
// 2. Crea la collezione "DomandeBot" con i campi: tipo (Testo), domanda (Testo), proposte (Testo),
//    scelta (Testo), utile (Testo), sessione (Testo), versione (Testo), ts (Testo).
//    Permessi: "Chiunque" può aggiungere elementi, solo l'amministratore può leggerli.
// 3. Incolla questo codice nella pagina che contiene l'elemento (ID dell'elemento: #botRegole).
// 4. Nel bot, in public/config.json: { "registro": { "tipo": "wix" } }, poi build e ripubblica.
import wixData from 'wix-data';

const TIPI = ['domanda', 'scelta', 'nessuna', 'non-so', 'utile'];

$w.onReady(() => {
  $w('#botRegole').onMessage(async (event) => {
    const msg = event.data;
    if (!msg || msg.tipo !== 'tsc-registro' || !TIPI.includes(msg.evento?.tipo)) return;
    const ev = msg.evento;
    await wixData.insert('DomandeBot', {
      tipo: ev.tipo,
      domanda: String(ev.domanda ?? '').slice(0, 500),
      proposte: Array.isArray(ev.proposte) ? ev.proposte.join(', ') : '',
      scelta: String(ev.scelta ?? ''),
      utile: ev.utile === true ? 'sì' : ev.utile === false ? 'no' : '',
      sessione: String(ev.sessione ?? ''),
      versione: String(ev.versione ?? ''),
      ts: String(ev.ts ?? ''),
    });
  });
});
