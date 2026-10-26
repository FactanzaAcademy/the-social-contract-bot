// Decisioni ufficiali sui casi che il regolamento non risolve (src/kb/ambiguities.json).
// Finché un caso non ha una decisione, il bot mostra "Cosa dice / Cosa non dice / interpretazione".
// Quando Factanza decide, il bot mostra la decisione come regola ufficiale.
//
// Fonte: risposte di Factanza al documento "The Social Contract: casi aperti del regolamento",
// ricevute il 26-10-2026. Qui c'è solo quello che Factanza ha deciso: le parti che ha lasciato
// aperte restano interpretazione dell'assistente e sono dette come tali.
// Ogni id qui deve avere "stato": "confermata" in ambiguities.json, e viceversa (test/kb/house-rules.test.js).

export const DECISIONI = {
  // caso 1
  'colpo-carta-pescata':
    'La Carta Evento pescata per un Colpo di scena **viene scartata ed esce dal gioco**. Fa eccezione solo **Cantiere aperto**, che il suo Colpo di scena mette tra gli Eventi Risolti. Ogni carta scartata così riduce il mazzo Eventi e avvicina la sconfitta per mazzo esaurito.',
  // caso 2
  'risoluzione-una-o-piu':
    'Un **!** fa risolvere **un solo Evento**. Il "una o più" di pag. 15 vale quando nello stesso turno scattano **inneschi diversi** (per esempio una carta con ! piazzata sullo spazio Provvisorio con !): un Evento per ogni innesco.',
  // caso 3
  'promessa-effetto-carta':
    '**Sì**: la seconda Carta Progetto piazzata gratis con la Promessa Elettorale **attiva il proprio Effetto Speciale**, come ogni Carta Progetto messa sul tabellone (pag. 15). Lo spazio in cui finisce (il 3° Provvisorio) non ha effetti.',
  // caso 4
  'monete-insufficienti':
    'Chi deve perdere più monete di quelle che ha **perde tutte quelle che ha**: si arriva a zero, senza andare sotto e senza debiti.',
  // caso 5
  'cantiere-effetto':
    '**Sì**: Cantiere aperto finito tra gli Eventi Risolti con il suo Colpo di scena **conta a tutti gli effetti**, sia per la vittoria al quinto Evento risolto sia per i punti dei Grandi Pensatori.',
  // caso 6
  'stallo-tabellone-pieno':
    'Se il tabellone è pieno e **nessun Evento scoperto è risolvibile**, **la Tensione Sociale sale di 1**, con il rinnovo delle carte scoperte come ogni volta che sale la Tensione. Poi inizia un nuovo turno con lo stesso Leader. Così la partita non si blocca.',
  // caso 7
  'michelangelo-costo-differente':
    'Si conta **un Progetto per ogni costo distinto** tra i Progetti approvati. Esempio: con costi 2, 2, 5 e 7 i costi distinti sono 3 (2, 5 e 7), quindi **9 PV**. Due Progetti con lo stesso costo valgono 3 PV una volta sola.',
  // caso 8
  'asso-diplomazia':
    "Vale l'**obiettivo stampato** sulla carta, basato sulla casella della Tensione Sociale: 25 PV dalla partenza alla casella 2, 15 PV nelle caselle 3-4, 6 PV nelle caselle 5-6. Il regolamento (pag. 8) la descrive come la carta senza nome né illustrazione, fatta per essere personalizzata: per i punti vale comunque l'obiettivo stampato.",
  // caso 9
  'allocazione-su-carta':
    "L'icona della **batteria verde** sulle Carte Progetto ha **lo stesso effetto dello spazio** Allocazione di Risorse: si tolgono i segnalini Mancanza di Risorse da tutti i Progetti Principali. È stampata su Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali e Ricerca di armi high-tech.",
  // caso 10: Factanza ha deciso dove va la carta tolta e che la nuova entra carica, non se la nuova attiva il suo effetto
  'sostituzione-dettagli':
    'La carta tolta **esce dal gioco**. La carta nuova prende il suo posto ed **entra carica**, senza segnalino Mancanza di Risorse. Se la carta nuova attivi il proprio Effetto Speciale non è stato precisato: questo assistente non lo attiva (interpretazione, non regola ufficiale).',
  // caso 11
  'segnalino-spostamento':
    "Il segnalino Mancanza di Risorse **resta**: il Progetto spostato tra i Provvisori resta scarico. Il segnalino si toglie solo con un'Allocazione di Risorse.",
  // caso 12
  'nessuno-spazio-legale':
    'Il Progetto è **fallito**: le monete offerte tornano ai giocatori e la Tensione Sociale sale di 1, come per ogni Progetto fallito.',
  // caso 13
  'blackout-sinistra':
    'Il segnalino va sui **primi 3 Progetti Principali presenti**, partendo da sinistra: gli spazi vuoti si saltano.',
  // caso 14
  'metropolis-effetto':
    "**Sì**: l'Evento risolto con Metropolis! è risolto **a tutti gli effetti** e il suo effetto si attiva.",
  // caso 15
  'incursione-effetto-carta':
    '**Sì**: i Progetti piazzati con Incursione militare **attivano gli Effetti Speciali delle carte**. Sono esclusi solo gli effetti degli **spazi Provvisori** in cui finiscono (le "caselle" del testo della carta).',
  // caso 16
  'pareggio-vittoria': 'Con un pareggio nel punteggio più alto la **vittoria è condivisa**.',
  // caso 17
  'riuso-stesso-turno':
    '**No**: un Progetto **Principale** o **Provvisorio** usato per risolvere un Evento è **consumato subito** e non si può riusare nello stesso turno. Solo i **Fondanti** si possono usare più volte.',
  // caso 18
  'fondante-ventaglio':
    'Negli Eventi a ventaglio un **Fondante conta** tra le carte da spendere e **resta in tabellone**, come negli Eventi a risorse.',
  // caso 19: Factanza ha confermato che i Provvisori non danno punti; il resto è il conto con le carte stampate
  'esempio-andrea':
    "L'esempio di pag. 21 ha due refusi, che il regolamento stampato non segnala. Primo: per Hetty Green elenca 5 Progetti di costo inferiore a 5 (20 PV), ma Istituzione dell'alleanza M.O.R.T.O. costa 10, quindi sono 4 (16 PV). Secondo: il totale stampato è \"20 PV + 12 PV = 32 PV\", ma Toussaint Louverture fa 0 PV, perché **i Progetti Provvisori non danno punti** per gli obiettivi a coppie di icone (regola confermata da Factanza). Andrea fa quindi **16 PV**; Matteo vince comunque con 22. In più, pag. 19 rimanda all'esempio \"a pagina 18\", ma è a pag. 20-21.",
  // caso 20
  'senso-sinistra':
    "Conta il **posto fisico al tavolo**, rispetto al Leader: con Primi passi diventa Leader chi siede **alla sinistra del Leader**, con Crescita sostenuta chi siede **alla sua destra**. Nel verificatore del bot i giocatori vanno inseriti in senso orario, così chi viene dopo il Leader nell'elenco è quello alla sua sinistra.",
  // caso 21
  'sposta-quale-spazio': 'Lo spazio Principale libero lo **sceglie il Leader**.',
  // caso 22
  'incursione-spazi':
    'Si può usare anche con **un solo spazio Provvisorio libero**: si piazza un solo Progetto e si pagano comunque 5 monete.',
  // caso 23
  'riserva-esaurita':
    "Se la riserva non ha abbastanza monete, **si distribuisce quello che c'è**. In che ordine distribuirle non è stato precisato.",
  // caso 25
  'matteotti-mazzo': 'Si contano **solo le carte del mazzo coperto** dei Progetti, non le 4 scoperte.',
};

// Restituisce la decisione da mostrare per un caso aperto, oppure null se non è ancora decisa.
// ambiguity: la voce di ambiguities.json ({ id, titolo, interpretazione, stato, ... })
export function resolveAmbiguity(ambiguity) {
  if (ambiguity?.stato !== 'confermata') return null;
  return DECISIONI[ambiguity.id] || null;
}
