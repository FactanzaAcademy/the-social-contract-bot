/**
 * Registro delle domande del bot di The Social Contract → Google Sheet.
 *
 * Installazione (5 minuti, account Google di Factanza):
 * 1. Crea un Google Sheet vuoto, poi Estensioni → Apps Script, incolla questo file e salva.
 * 2. Esegui → Esegui il deployment → Nuovo deployment → tipo "App web":
 *      Esegui come: Me · Chi ha accesso: Chiunque
 *    Copia l'URL che finisce con /exec.
 * 3. Nel bot, in public/config.json:
 *      { "registro": { "tipo": "apps-script", "url": "<URL /exec>" } }
 *    poi npm run build e ripubblica dist/.
 *
 * Il foglio "Registro" riceve una riga per evento. Il foglio "Senza risposta" si aggiorna da solo
 * con le domande a cui il bot non ha saputo rispondere o la cui risposta è stata giudicata inutile.
 */
const COLONNE = ['ts', 'tipo', 'domanda', 'proposte', 'scelta', 'utile', 'sessione', 'versione'];
const TIPI = ['domanda', 'scelta', 'nessuna', 'non-so', 'utile'];

function doPost(e) {
  try {
    const ev = JSON.parse(e.postData.contents);
    if (!TIPI.includes(ev.tipo)) return ContentService.createTextOutput('ignorato');
    const sheet = foglio_('Registro', COLONNE);
    sheet.appendRow(COLONNE.map((c) => {
      // "sì"/"no" come testo: Sheets trasformerebbe "true"/"false" in booleani
      const v = c === 'utile' ? (ev.utile === true ? 'sì' : ev.utile === false ? 'no' : '') : ev[c];
      if (Array.isArray(v)) return v.join(', ');
      if (v === undefined || v === null) return '';
      return String(v).slice(0, 500);
    }));
    preparaSenzaRisposta_();
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('errore');
  }
}

function foglio_(nome, intestazione) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(intestazione);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Vista filtrata: domande senza risposta ("Nessuna di queste", "non so") e risposte giudicate inutili.
function preparaSenzaRisposta_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Senza risposta')) return;
  const sh = ss.insertSheet('Senza risposta');
  sh.getRange('A1').setFormula(
    '=QUERY(Registro!A:H, "select A, B, C, D, E where B = \'nessuna\' or B = \'non-so\' or (B = \'utile\' and F = \'no\') order by A desc", 1)'
  );
}
