// Informativa privacy del bot, mostrata dal link "Privacy" sotto la casella della chat.
// BOZZA del 26-10-2026, da far approvare a chi segue la privacy di Factanza prima del lancio.
// Le parti tra [quadre] vanno completate: finché ci sono, `npm run build` stampa un avviso.
// Descrive il bot così com'è: ponte su Supabase, risposte di Claude (Anthropic), registro anonimo spento.

export const PRIVACY_VERSIONE = '2026-10-26';

export const PRIVACY = `**Chi tratta i dati.** Il titolare è [ragione sociale di Factanza, sede], contattabile a [email privacy].

**Cosa succede alla tua domanda.** Quando scrivi una domanda, il testo (al massimo 300 caratteri) passa dal nostro server su Supabase e arriva ad **Anthropic**, l'azienda che fornisce l'intelligenza artificiale Claude, che scrive la risposta. Le risposte sono generate dall'AI a partire dal regolamento ufficiale. Noi non salviamo il testo delle domande. Anthropic lo tratta per nostro conto come fornitore e [lo conserva per un massimo di N giorni, senza usarlo per addestrare i suoi modelli: da verificare nei termini del contratto].

**Le segnalazioni.** Se il bot non trova la risposta e tocchi "Sì, segnala", salviamo la domanda e la data per migliorare l'assistente. Le conserviamo per [12 mesi].

**Contro gli abusi.** Per limitare le domande per persona usiamo un'impronta del tuo indirizzo IP, calcolata in modo che non si possa risalire all'indirizzo senza una chiave segreta. Le impronte si cancellano da sole dopo 2 ore; quelle legate a una segnalazione restano con la segnalazione.

**Cosa non facciamo.** Niente account, niente cookie di profilazione, niente dati salvati nel tuo browser. Non scrivere nelle domande dati personali tuoi o di altri.

**Altri fornitori tecnici.** La pagina è ospitata da GitHub (Pages) e inserita nel sito [thesocialcontract.it] (Wix); i caratteri tipografici arrivano da Google Fonts. Ognuno di questi servizi riceve l'indirizzo IP del tuo dispositivo per mostrarti la pagina.

**Fuori dall'Unione Europea.** Anthropic, GitHub e Google hanno sede negli Stati Uniti. [Il trasferimento è protetto da: Data Privacy Framework / clausole contrattuali standard, da verificare per ciascuno].

**Base giuridica.** [Da confermare con il consulente: esecuzione del servizio che richiedi (art. 6.1.b GDPR) per le risposte; legittimo interesse (art. 6.1.f) per la protezione dagli abusi e per le segnalazioni.]

**I tuoi diritti.** Puoi chiedere accesso, cancellazione o opposizione scrivendo a [email privacy], e puoi fare reclamo al Garante per la protezione dei dati personali.`;

// true finché restano parti da completare tra [quadre]
export const privacyDaCompletare = (testo = PRIVACY) => /\[[^\]]+\]/.test(testo);
