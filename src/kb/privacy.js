// Informativa privacy del bot, mostrata dal link "Privacy" sotto la casella della chat.
// Versione del 27-10-2026, scritta con i dati di Factanza Media. Descrive il bot così com'è:
// ponte su Supabase (Europa), risposte di Claude (Anthropic), caratteri ospitati nel bot, registro anonimo spento.
// Se cambia qualcosa (un fornitore, il registro, i tempi di conservazione), aggiorna anche questo testo.
// Le parti tra [quadre] sono da completare: finché ci sono, `npm run build` stampa un avviso.

export const PRIVACY_VERSIONE = '2026-10-27';

export const PRIVACY = `**Chi tratta i dati.** Il titolare è **Factanza Media Srl**, Via del Caravaggio 3, 20144 Milano (P. IVA e C.F. 11395070961). Per qualsiasi domanda sulla privacy scrivi a **info@factanzaacademy.com** (PEC: factanzamedia@pec.it).

**Cosa succede alla tua domanda.** Il testo che scrivi (al massimo 300 caratteri) passa dal nostro server su **Supabase**, in Europa, e arriva ad **Anthropic**, l'azienda che fornisce l'intelligenza artificiale Claude: Claude legge la domanda e scrive la risposta usando solo il regolamento ufficiale. Noi non salviamo il testo delle domande. Anthropic lo tratta per nostro conto come fornitore, non lo usa per addestrare i suoi modelli e lo cancella entro 30 giorni (più a lungo solo se serve a contrastare un abuso o lo impone la legge).

**Le segnalazioni.** Se il bot non trova la risposta e tocchi "Sì, segnala", salviamo la domanda e la data per migliorare l'assistente e le FAQ del gioco. Le cancelliamo dopo **12 mesi**.

**Contro gli abusi.** Per limitare il numero di domande per persona usiamo un'impronta del tuo indirizzo IP, calcolata con una chiave segreta: da sola non permette di risalire all'indirizzo. Le impronte si cancellano da sole dopo 2 ore; quella legata a una segnalazione resta con la segnalazione, per lo stesso tempo.

**Cosa non facciamo.** Niente account, niente cookie, niente profilazione né pubblicità, niente dati salvati nel tuo browser. Non scrivere nelle domande dati personali tuoi o di altre persone.

**Chi ospita la pagina.** La pagina del bot è ospitata da **GitHub Pages** ed è inserita nel sito di The Social Contract, realizzato con **Wix**: come per qualsiasi pagina web, questi servizi ricevono l'indirizzo IP del tuo dispositivo per mostrartela. Per il sito vale anche la sua informativa.

**Fuori dall'Unione Europea.** Anthropic e GitHub hanno sede negli Stati Uniti. Il trasferimento dei dati è protetto dalle clausole contrattuali standard approvate dalla Commissione europea, previste nei loro contratti per le aziende, e, dove applicabile, dal Data Privacy Framework UE-USA.

**Perché possiamo farlo.** Rispondiamo alle tue domande perché sei tu a chiederci il servizio (art. 6.1.b del GDPR). Proteggiamo il servizio dagli abusi e usiamo le segnalazioni per migliorarlo sulla base del nostro legittimo interesse (art. 6.1.f).

**I tuoi diritti.** Puoi chiedere di accedere ai tuoi dati, di cancellarli, di limitarne l'uso o di opporti al trattamento scrivendo a info@factanzaacademy.com. Puoi anche presentare reclamo al **Garante per la protezione dei dati personali** (garanteprivacy.it).

_Ultimo aggiornamento: 27 ottobre 2026._`;

// true finché restano parti da completare tra [quadre]
export const privacyDaCompletare = (testo = PRIVACY) => /\[[^\]]+\]/.test(testo);
