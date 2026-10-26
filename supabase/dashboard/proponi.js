// Edge Function "proponi" in un solo file per la dashboard Supabase.
// File generato da tools/ai/build-catalog.mjs: non modificarlo, modifica l'originale e rilancia lo script.


// supabase/functions/proponi/index.js
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";

// supabase/functions/_shared/catalog.js
var catalog_default = {
  "versione": "2026-10-26",
  "voci": [
    {
      "id": "scopo",
      "titolo": "Qual \xE8 lo scopo del gioco?",
      "indizi": "scopo, obiettivo, vincere, come si gioca",
      "testo": "Il gruppo deve **risolvere 5 Eventi** che mettono a rischio la societ\xE0. Per farlo usa le risorse dei **Progetti** che approva turno dopo turno, con un'asta a offerte segrete.\n\nOgni giocatore per\xF2 ha anche **obiettivi segreti**, dati da 2 carte Grandi Pensatori: se il gruppo vince, vince chi ha pi\xF9 punti con i propri obiettivi. Se il gruppo fallisce, perdono tutti."
    },
    {
      "id": "semi-cooperativo",
      "titolo": "\xC8 un gioco cooperativo o competitivo?",
      "indizi": "cooperativo, competitivo, semicooperativo, insieme",
      "testo": "\xC8 **semi-cooperativo**. Se il gruppo non riesce a risolvere 5 Eventi, **perdono tutti**. Se ci riesce, vince **una sola persona**: chi ha pi\xF9 punti con i propri Grandi Pensatori. Bisogna quindi collaborare per non far crollare la societ\xE0 e, nello stesso tempo, spingere i Progetti che fanno comodo ai propri obiettivi segreti."
    },
    {
      "id": "numero-giocatori",
      "titolo": "In quanti si gioca?",
      "indizi": "quanti giocatori, numero giocatori, in due, in sei",
      "testo": "Da **2 a 6 giocatori**: il regolamento d\xE0 le monete iniziali solo per 2, 3, 4, 5 e 6 giocatori e nella scatola ci sono 6 schermi. Non sono previste regole per giocare da soli o in pi\xF9 di 6."
    },
    {
      "id": "componenti",
      "titolo": "Cosa c'\xE8 nella scatola?",
      "indizi": "componenti, scatola, contenuto, quante carte",
      "testo": "- 1 tabellone\n- 88 carte: 39 Progetto, 23 Evento, 25+1 Grandi Pensatori\n- 1 segnalino Tensione Sociale\n- 1 segnalino Leader\n- 5 segnalini Mancanza di Risorse\n- 108 monete\n- 6 schermi protettivi (uno per giocatore)"
    },
    {
      "id": "ambientazione",
      "titolo": "Qual \xE8 la storia del gioco?",
      "indizi": "storia, ambientazione, trama, 2157",
      "testo": 'Terra, **anno 2157**: crisi climatica, guerre, la democrazia \xE8 finita e il Contratto Sociale si \xE8 sciolto. Due funzionari del Comitato di Controllo delle Specie pre-spaziali avviano il **Progetto Ex Machina**: prendono un gruppo di persone comuni (voi) e le portano su un pianeta di prova per ricostruire da zero una societ\xE0.\n\nCome mentori ricevete dei **Grandi Pensatori** della storia, scelti a caso. Il nome viene dal "Contratto Sociale" di Hobbes e Rousseau.'
    },
    {
      "id": "crediti",
      "titolo": "Chi ha creato il gioco?",
      "indizi": "autore, illustratore, creato, factanza",
      "testo": "The Social Contract \xE8 il gioco di **Factanza Media**. Autore: Dario Massa. Illustratore: Carlo Esposito. Direzione artistica: Bianca Arrighini e Livia Vigan\xF2. Regolamento: Martina La Rocca."
    },
    {
      "id": "preparazione",
      "titolo": "Come si prepara la partita?",
      "indizi": "preparazione, setup, preparare, iniziare",
      "testo": "1. Tabellone al centro; segnalino **Tensione Sociale** sulla casella pi\xF9 a sinistra.\n2. Mescolate il mazzo **Progetti** e scoprite 4 carte in basso; mescolate il mazzo **Eventi** e scoprite 3 carte in alto. I mazzi restano coperti accanto.\n3. Date **2 Grandi Pensatori** coperti a ciascuno: si pu\xF2 scartarne uno, una sola volta, e pescarne un altro.\n4. Date a ciascuno uno **schermo** e le **monete** (25 in 2, 15 in 3, 10 in 4, 8 in 5-6). Il resto delle monete va nella riserva comune.\n5. Scegliete a caso il **Leader** e dategli il segnalino."
    },
    {
      "id": "monete-iniziali",
      "titolo": "Quante monete si ricevono all'inizio?",
      "indizi": "monete iniziali, soldi iniziali, quante monete, a testa",
      "testo": "Dipende dal numero di giocatori:\n- 2 giocatori: **25** monete a testa\n- 3 giocatori: **15**\n- 4 giocatori: **10**\n- 5 o 6 giocatori: **8**\n\nLe altre monete (ce ne sono 108 in tutto) formano la riserva comune."
    },
    {
      "id": "pensatori-distribuzione",
      "titolo": "Quanti Grandi Pensatori si ricevono? Si possono cambiare?",
      "indizi": "pensatori, scartare pensatore, cambiare pensatore, carte obiettivo",
      "testo": "Ognuno riceve **2 Grandi Pensatori** coperti. Ciascuno pu\xF2, **una sola volta** e senza mostrarla, scartare una delle due carte e pescarne un'altra, fino ad averne di nuovo 2. Le carte scartate e quelle non distribuite tornano nella scatola e non si usano in quella partita."
    },
    {
      "id": "pensatori-segreti",
      "titolo": "I Grandi Pensatori sono segreti? Posso dire i miei obiettivi?",
      "indizi": "segreti, segreto, rivelare, nascosto",
      "testo": "S\xEC, sono **obiettivi segreti**: si ricevono coperti e si rivelano solo a fine partita, se il gruppo vince, per contare i punti. Il regolamento incoraggia a discutere e permette di bluffare. Non vieta esplicitamente di parlare dei propri obiettivi, ma il gioco \xE8 pensato perch\xE9 restino nascosti."
    },
    {
      "id": "leader-iniziale",
      "titolo": "Chi \xE8 il primo Leader?",
      "indizi": "primo leader, chi inizia, chi comincia, primo giocatore",
      "testo": "Il primo Leader si sceglie **a caso**. Poi il Leader cambia durante la partita: diventa Leader chi fa l'offerta pi\xF9 alta in un'asta."
    },
    {
      "id": "turno",
      "titolo": "Come funziona un turno?",
      "indizi": "turno, fasi, svolgimento, consiglio",
      "testo": "Ogni turno \xE8 una riunione del Consiglio:\n1. Il **Leader propone** un Progetto tra i 4 scoperti\n2. **Dibattito**\n3. Il Leader **sceglie** il Progetto da approvare\n4. **Offerte segrete** di tutti\n5. Si determina il **nuovo Leader** (chi ha offerto di pi\xF9)\n6. Il Progetto \xE8 **approvato o fallisce**\n7. Il Leader **piazza** il Progetto approvato\n8. Si applicano gli **effetti speciali** della carta e dello spazio\n9. **Risoluzione** degli Eventi, se attivata\n10. **Fine turno** e ricarica delle carte scoperte"
    },
    {
      "id": "leader-ruolo",
      "titolo": "Cosa fa il Leader?",
      "indizi": "leader, poteri, ruolo, chi decide",
      "testo": `Il Leader:
- **sceglie quale Progetto** proporre all'asta;
- **decide dove piazzarlo** sul tabellone;
- sceglie **quale Evento risolvere** e con quali Progetti;
- fa le scelte richieste dagli effetti speciali e dai Colpi di scena, e subisce quelli che colpiscono "il Leader";
- quando la Tensione sale, sceglie se rinnovare gli Eventi o i Progetti scoperti.

Il gruppo pu\xF2 discutere, ma la decisione finale spetta al Leader.`
    },
    {
      "id": "proposta",
      "titolo": "Come si sceglie il Progetto da approvare?",
      "indizi": "proporre, propone, scegliere progetto, scoperti",
      "testo": "All'inizio del turno, se c'\xE8 almeno uno spazio libero sul tabellone, il **Leader** sceglie uno dei **4 Progetti scoperti** e lo mette davanti a s\xE9. Il gruppo pu\xF2 discutere e fare pressione, ma **la scelta finale \xE8 solo del Leader**. Non si pu\xF2 scegliere una carta coperta del mazzo."
    },
    {
      "id": "dibattito",
      "titolo": "Quanto si pu\xF2 discutere?",
      "indizi": "dibattito, discutere, trattativa, parlare",
      "testo": "Si pu\xF2 discutere in **tutte le fasi**: proporre alternative, fare strategie, promettere offerte. \xC8 una meccanica centrale del gioco. Il regolamento suggerisce di regolare intensit\xE0 e frequenza delle discussioni secondo i gusti del tavolo. Le promesse non sono vincolanti: si pu\xF2 bluffare."
    },
    {
      "id": "offerte",
      "titolo": "Come funzionano le offerte?",
      "indizi": "offerte, offerta, asta, pugno",
      "testo": "Tutti, Leader compreso, decidono **in segreto**, dietro lo schermo, quante monete offrire, e le chiudono nel **pugno**. Quando tutti sono pronti si portano i pugni al centro e si aprono **insieme**.\n\nSe il totale \xE8 **uguale o superiore al costo**, il Progetto \xE8 approvato. Chi ha offerto di pi\xF9 diventa Leader."
    },
    {
      "id": "bluff",
      "titolo": "Si pu\xF2 bluffare sulle offerte?",
      "indizi": "bluff, bluffare, mentire, promettere",
      "testo": "S\xEC. Il regolamento dice esplicitamente che **si pu\xF2 bluffare**, facendo offerte diverse da quelle promesse."
    },
    {
      "id": "offerta-zero",
      "titolo": "Posso offrire zero monete? Posso offrire tutto?",
      "indizi": "zero, niente, nulla, limite",
      "testo": 'Il regolamento dice solo che ognuno sceglie "quante monete offrire", senza minimi n\xE9 massimi. Si pu\xF2 quindi offrire **0**, cio\xE8 il pugno vuoto, e al massimo **tutte le monete che si hanno**. Non si possono offrire monete che non si possiedono.'
    },
    {
      "id": "nuovo-leader",
      "titolo": "Chi diventa il nuovo Leader?",
      "indizi": "nuovo leader, diventa leader, cambia leader, offre di piu",
      "testo": "Chi ha offerto **pi\xF9 monete** diventa **subito** il nuovo Leader, prende il segnalino e sceglie dove piazzare il Progetto.\n\nIn caso di **pareggio** sull'offerta pi\xF9 alta, **il Leader non cambia**: resta quello del turno precedente, anche se la sua offerta \xE8 stata superata da chi \xE8 in pareggio."
    },
    {
      "id": "pareggio-leader",
      "titolo": "Cosa succede se c'\xE8 un pareggio nelle offerte?",
      "indizi": "pareggio, parit\xE0, pari, uguale",
      "testo": "Se due o pi\xF9 persone sono in **pareggio** sull'offerta pi\xF9 alta, **il Leader resta quello di prima**. Questo vale anche se il Leader ha offerto meno di loro. Esempio: Leader 1, Anna 3, Marco 3 \u2192 il Leader resta lo stesso."
    },
    {
      "id": "leader-se-fallisce",
      "titolo": "Se il Progetto fallisce, chi ha offerto di pi\xF9 diventa comunque Leader?",
      "indizi": "fallisce, fallito, leader, fallisce leader",
      "testo": "S\xEC. Il nuovo Leader viene determinato al **passo 5**, prima di vedere se il Progetto \xE8 approvato (passo 6). Chi offre di pi\xF9 diventa Leader **anche se il Progetto fallisce**. Dopo il fallimento, il turno successivo lo inizia il Leader attuale (pag. 18)."
    },
    {
      "id": "approvazione",
      "titolo": "Quando un Progetto \xE8 approvato?",
      "indizi": "approvato, approvare, approvazione, costo",
      "testo": "Un Progetto \xE8 **approvato** se il **totale** delle monete offerte da **tutti** i giocatori \xE8 **uguale o superiore al suo costo** (il numero in alto a destra sulla carta). Tutte le monete offerte vanno poi nella **riserva comune**, anche quelle in pi\xF9. Se il totale arriva ad almeno **costo + 3**, il Progetto pu\xF2 andare anche in uno spazio Fondante."
    },
    {
      "id": "monete-spese",
      "titolo": "Dove vanno le monete offerte?",
      "indizi": "monete offerte, riserva, perdono, restituite",
      "testo": "- Progetto **approvato**: **tutte** le monete offerte, comprese quelle oltre il costo, vanno nella **riserva comune**. Non c'\xE8 resto.\n- Progetto **fallito**: le monete **restano ai giocatori**."
    },
    {
      "id": "progetto-fallito",
      "titolo": "Cosa succede se un Progetto fallisce?",
      "indizi": "fallisce, fallito, bocciato, insufficiente",
      "testo": "Se il totale offerto \xE8 **inferiore al costo**:\n1. La carta viene **scartata fuori dal tabellone**: non torna pi\xF9 in gioco e non conta per i punti.\n2. Le monete **restano ai giocatori**.\n3. La **Tensione Sociale sale di 1**: si applica l'effetto della casella di arrivo.\n4. Il Leader sceglie un mazzo tra Eventi e Progetti, **scarta tutte le carte scoperte** di quel tipo e ne scopre di nuove.\n5. Il turno finisce; il prossimo lo inizia il Leader attuale."
    },
    {
      "id": "piazzamento",
      "titolo": "Dove si piazza un Progetto approvato?",
      "indizi": "piazzare, piazzamento, posizionare, spazio",
      "testo": "Lo decide il **Leader** (quello nuovo, appena determinato dall'asta). Ci sono 3 righe:\n- **Fondanti** (2 spazi): solo se l'offerta totale \xE8 almeno costo + 3. Non si esauriscono mai.\n- **Principali** (5 spazi): nessuna condizione. Quando vengono usati ricevono il segnalino Mancanza di Risorse.\n- **Provvisori** (5 spazi): alcuni hanno un effetto immediato. Quando vengono usati vanno in Archivio."
    },
    {
      "id": "fondanti",
      "titolo": "Come funzionano i Progetti Fondanti?",
      "indizi": "fondante, fondanti, +3, pi\xF9 tre",
      "testo": "I **Progetti Fondanti** sono le basi della societ\xE0:\n- ci sono **2 spazi**;\n- per piazzarci un Progetto, l'offerta totale deve superare il costo di **almeno 3 monete** (costo 7 \u2192 almeno 10);\n- **non si esauriscono mai**: si possono usare per risolvere Eventi tutte le volte che si vuole, senza segnalino e senza Archivio;\n- per gli obiettivi a coppie di icone valgono **6 PV**."
    },
    {
      "id": "principali",
      "titolo": "Come funzionano i Progetti Principali?",
      "indizi": "principale, principali, spazi principali, quanti principali",
      "testo": "I **Progetti Principali**:\n- occupano **5 spazi**, senza condizioni per piazzarli;\n- quando vengono usati per risolvere un Evento ricevono un segnalino **Mancanza di Risorse** e non si possono pi\xF9 usare finch\xE9 non vengono ricaricati da un'**Allocazione di Risorse**;\n- per gli obiettivi a coppie di icone valgono **3 PV**."
    },
    {
      "id": "provvisori",
      "titolo": "Come funzionano i Progetti Provvisori?",
      "indizi": "provvisorio, provvisori, spazi provvisori, quanti provvisori",
      "testo": "I **Progetti Provvisori**:\n- occupano **5 spazi**; da sinistra: Soldi gratis!, Promessa Elettorale, spazio vuoto, Risoluzione Evento, Allocazione di Risorse. L'effetto dello spazio si attiva **subito** quando ci si piazza un Progetto;\n- quando vengono usati per risolvere un Evento vanno in **Archivio** e lo spazio si libera;\n- per gli obiettivi a coppie di icone **non danno punti**."
    },
    {
      "id": "ordine-effetti",
      "titolo": "Se carta e spazio hanno entrambi un effetto, quale viene prima?",
      "indizi": "ordine, prima, dopo, entrambi",
      "testo": "Prima l'effetto della **Carta Progetto**, subito dopo quello dello **spazio Provvisorio**. Gli effetti si attivano appena la carta viene piazzata."
    },
    {
      "id": "tabellone-pieno",
      "titolo": "Cosa succede se non ci sono spazi liberi?",
      "indizi": "spazi liberi, pieno, occupati",
      "testo": "Se all'inizio del turno **non c'\xE8 nessuno spazio libero**, non si propone nessun Progetto. Si attiva **automaticamente** una **Risoluzione Evento**, poi inizia un nuovo turno con **lo stesso Leader**.\n\nSe nessun Evento \xE8 risolvibile, il regolamento stampato non lo dice. Decisione ufficiale di Factanza: **la Tensione Sociale sale di 1**, con il rinnovo delle carte scoperte, poi nuovo turno con lo stesso Leader."
    },
    {
      "id": "archivio",
      "titolo": "Cos'\xE8 l'Archivio?",
      "indizi": "archivio, archiviati, archiviato",
      "testo": "Nell'**Archivio** (in basso a destra) vanno, coperti, i Progetti **Provvisori** usati per risolvere Eventi. I Progetti archiviati:\n- **non contano come approvati** e non si possono pi\xF9 usare;\n- **contano per i punti** solo se un obiettivo lo prevede (es. Sun Tzu: 2 PV per Progetto in Archivio)."
    },
    {
      "id": "mancanza-risorse",
      "titolo": "Cos'\xE8 il segnalino Mancanza di Risorse?",
      "indizi": "mancanza di risorse, scarico, esaurito, ricaricare",
      "testo": "Quando un Progetto **Principale** viene usato per risolvere un Evento riceve il segnalino **Mancanza di Risorse**: finch\xE9 ce l'ha **non si pu\xF2 usare**. Il segnalino si toglie solo con un'**Allocazione di Risorse** (spazio Provvisorio con la batteria verde), che ricarica **tutti** i Principali. I Fondanti non ricevono mai il segnalino. Nella scatola ci sono 5 segnalini Mancanza di Risorse."
    },
    {
      "id": "riserva",
      "titolo": "Cos'\xE8 la riserva comune?",
      "indizi": "riserva, banca, monete comuni, comune",
      "testo": "\xC8 il mucchio di monete accanto al tabellone, a disposizione di tutti. Da l\xEC si prendono le monete degli effetti (es. Soldi gratis!) e l\xEC finiscono le monete spese per approvare i Progetti o perse con i Colpi di scena."
    },
    {
      "id": "schermo",
      "titolo": "A cosa serve lo schermo?",
      "indizi": "schermo, nascondere, nascoste",
      "testo": "Ogni giocatore ha uno **schermo**: dietro si prepara in segreto l'offerta e si tengono le proprie monete. Il segnalino Leader si mette davanti allo schermo."
    },
    {
      "id": "anatomia-tabellone",
      "titolo": "Come \xE8 fatto il tabellone?",
      "indizi": "tabellone, plancia, zone, aree",
      "testo": "- **In basso al centro**: i 4 Progetti scoperti\n- **Al centro**: i Progetti approvati, su 3 righe (2 Fondanti, 5 Principali, 5 Provvisori)\n- **In basso a destra**: l'Archivio\n- **In alto al centro**: i 3 Eventi scoperti\n- **In alto a destra**: gli Eventi risolti e il termometro della Tensione Sociale"
    },
    {
      "id": "quando-risolvere",
      "titolo": "Quando si pu\xF2 risolvere un Evento?",
      "indizi": "quando, risolvere, risoluzione, qualsiasi momento",
      "testo": "**Non** si risolvono Eventi a piacere: serve un innesco con l'icona **!** (Risoluzione Evento):\n- il Progetto appena approvato ha l'icona !;\n- il Progetto viene piazzato nello **spazio Provvisorio con il !**;\n- la **Tensione Sociale** arriva su una casella con il !;\n- il tabellone \xE8 pieno a inizio turno (risoluzione automatica)."
    },
    {
      "id": "risolvere-evento",
      "titolo": "Come si risolve un Evento?",
      "indizi": "risolvere evento, risolve, risorse richieste, sommare",
      "testo": "Il **Leader**:\n1. sceglie uno degli Eventi scoperti;\n2. sceglie uno o pi\xF9 **Progetti in tabellone** (Fondanti, Principali senza segnalino, Provvisori; quelli in **Archivio** non valgono);\n3. **somma** le loro risorse, che devono **raggiungere o superare** quelle richieste dall'Evento, tipo per tipo.\n\nPoi l'Evento va tra gli **Eventi risolti** e si attiva il suo eventuale effetto. I Principali usati ricevono il segnalino Mancanza di Risorse, i Provvisori usati vanno in Archivio, i Fondanti restano come sono."
    },
    {
      "id": "risorse-in-eccesso",
      "titolo": "Posso usare pi\xF9 risorse del necessario? Le risorse in pi\xF9 si conservano?",
      "indizi": "eccesso, avanzano, pi\xF9 del necessario",
      "testo": "S\xEC, si possono usare Progetti che danno **pi\xF9 risorse del necessario**, ma l'eccedenza **si perde**: non c'\xE8 nessun beneficio in pi\xF9."
    },
    {
      "id": "risorse-tipi-misti",
      "titolo": "Posso usare un tipo di risorsa al posto di un altro?",
      "indizi": "al posto, intercambiabili, convertire, pagare con",
      "testo": "No. L'Evento richiede risorse **specifiche**: ogni tipo (Difesa, Economia, Tecnologia) va coperto con Progetti di **quel tipo**. Fanno eccezione gli **Eventi a ventaglio**, che chiedono solo un numero di carte, di qualsiasi tipo."
    },
    {
      "id": "eventi-ventaglio",
      "titolo": "Cosa sono gli Eventi con l'icona a ventaglio di carte?",
      "indizi": "ventaglio, icona carte, spendere, spendere carte",
      "testo": "Alcuni Eventi, invece delle risorse, mostrano un **ventaglio di carte con un numero**. Per risolverli **le risorse non contano**: bisogna **spendere** quel numero di Progetti approvati, di qualsiasi tipo. Sono 4: Primi passi (3), Crescita sostenuta (4), Cantiere aperto (5), Metropolis! (6)."
    },
    {
      "id": "eventi-risolti",
      "titolo": "Quanti Eventi bisogna risolvere?",
      "indizi": "quanti eventi, cinque, 5 eventi",
      "testo": `Bisogna risolverne **5**. La partita finisce con il successo del gruppo **nel momento in cui** si risolve il quinto. Gli Eventi risolti si mettono nell'area "Eventi risolti" in alto a destra.`
    },
    {
      "id": "anatomia-evento",
      "titolo": "Come \xE8 fatta una Carta Evento?",
      "indizi": "carta evento, capovolto",
      "testo": "- **A sinistra**: le risorse richieste, oppure il ventaglio con il numero di carte.\n- **In alto, capovolto**: il **Colpo di scena**, da leggere solo quando un effetto Colpo di scena lo attiva.\n- **In basso a destra**, su alcune carte: l'**effetto speciale**, che si attiva quando l'Evento viene risolto."
    },
    {
      "id": "anatomia-progetto",
      "titolo": "Come \xE8 fatta una Carta Progetto?",
      "indizi": "carta progetto, numeri, alto a sinistra, alto a destra",
      "testo": "- **In alto a sinistra**: la **risorsa** che fornisce: tipo (scudo = Difesa e Sicurezza, grafico = Economia e Welfare, chip = Tecnologia e Sopravvivenza) e valore da 1 a 4.\n- **In alto a destra**: il **costo**, cio\xE8 le monete minime per approvarlo.\n- **In basso a sinistra**: 3 **icone ideologiche**.\n- **A destra del nome**, su alcune carte: l'**effetto speciale**."
    },
    {
      "id": "risorse-tipi",
      "titolo": "Quali sono i tipi di risorse?",
      "indizi": "risorse, difesa, economia, tecnologia",
      "testo": "Tre tipi, ognuno con valore da 1 a 4:\n- **Difesa e Sicurezza** (scudo)\n- **Economia e Welfare** (grafico a barre)\n- **Tecnologia e Sopravvivenza** (chip)\n\nNel mazzo ci sono 13 Progetti per ogni tipo."
    },
    {
      "id": "icone-ideologiche",
      "titolo": "A cosa servono le icone ideologiche?",
      "indizi": "icone, ideologiche, ideologia, pubblico",
      "testo": "Ogni Progetto ha **3 icone**, una per ogni coppia di opposti:\n- **Pubblico** (tre persone, blu) / **Privato** (una persona, viola)\n- **Preservazione** (foglia, verde) / **Consumo** (mattoni, rosso)\n- **Innovazione** (lampadina, gialla) / **Tradizione** (colonna, grigia)\n\n**Non influiscono sulla partita**: servono solo per i punti finali dei Grandi Pensatori a coppie di icone."
    },
    {
      "id": "effetti-speciali",
      "titolo": "Quali sono gli effetti speciali?",
      "indizi": "effetti speciali, effetto speciale, icona, legenda",
      "testo": "- **!** Risoluzione Evento: il Leader, se pu\xF2, risolve un Evento scoperto.\n- **Monete** Soldi gratis!: tutti prendono 4 monete.\n- **Sirena** Colpo di scena: il Leader pesca 1 Evento e ne applica il Colpo di scena.\n- **Due sirene** Doppio Colpo di scena: 2 Eventi, applicati nell'ordine di pesca.\n- **Teschio**: la Tensione Sociale sale di 1.\n- **Freccia verde su** Nuova linea politica: un Provvisorio diventa Principale.\n- **Freccia rossa gi\xF9** Cambio di priorit\xE0: un Principale diventa Provvisorio (e si applica l'effetto dello spazio).\n- **Batteria verde**: Allocazione di Risorse. Su 4 Progetti la legenda non la spiega: per decisione ufficiale di Factanza ha lo stesso effetto dello spazio."
    },
    {
      "id": "risoluzione-effetto",
      "titolo": "Effetto Risoluzione Evento (!)",
      "indizi": "punto esclamativo, esclamativo, risoluzione evento",
      "testo": "Il **Leader**, se possibile, sceglie un Evento scoperto e lo risolve con i Progetti in tabellone. Se nessun Evento \xE8 risolvibile, l'effetto non fa nulla. Si trova sulle carte, sul 4\xB0 spazio Provvisorio e sulle caselle 2, 4 e 6 della Tensione."
    },
    {
      "id": "soldi-gratis",
      "titolo": "Soldi gratis!",
      "indizi": "soldi gratis, gratis, 4 monete, icona monete",
      "testo": "**Tutti** i giocatori prendono subito **4 monete** dalla riserva comune. Si trova sul 1\xB0 spazio Provvisorio e sulle caselle 1, 5 e 7 della Tensione. Nessuna Carta Progetto ce l'ha; alcuni Eventi lo attivano quando vengono risolti."
    },
    {
      "id": "colpo-di-scena",
      "titolo": "Come funziona il Colpo di scena?",
      "indizi": "colpo di scena, sirena, colpo",
      "testo": "Il **Leader pesca 1 carta dal mazzo Eventi coperto** e applica subito il testo **capovolto in alto** (il Colpo di scena), se possibile. L'Evento pescato **non** si aggiunge agli Eventi scoperti. Poi **viene scartato ed esce dal gioco** (decisione ufficiale di Factanza: il regolamento stampato non lo dice), salvo Cantiere aperto, che va tra gli Eventi Risolti."
    },
    {
      "id": "doppio-colpo",
      "titolo": "Doppio Colpo di scena",
      "indizi": "doppio, due sirene",
      "testo": "Il Leader pesca **2 carte** dal mazzo Eventi e applica i loro Colpi di scena **uno dopo l'altro, nell'ordine in cui sono state pescate**."
    },
    {
      "id": "tensione-effetto",
      "titolo": "Effetto Aumenta la Tensione Sociale (teschio)",
      "indizi": "teschio, aumenta tensione, teschio progetto, teschio carta",
      "testo": "Il Leader sposta il segnalino Tensione Sociale di **una casella** e applica l'effetto della casella di arrivo. Poi sceglie tra Eventi e Progetti, **scarta tutte le carte scoperte** di quel tipo e ne scopre di nuove."
    },
    {
      "id": "nuova-linea",
      "titolo": "Nuova linea politica (freccia verde)",
      "indizi": "nuova linea, freccia verde, freccia su",
      "testo": "Il Leader **pu\xF2** spostare un Progetto da uno spazio **Provvisorio** a uno spazio **Principale**, se ce n'\xE8 uno libero."
    },
    {
      "id": "cambio-priorita",
      "titolo": "Cambio di priorit\xE0 (freccia rossa)",
      "indizi": "cambio di priorita, freccia rossa, freccia giu",
      "testo": "Il Leader **pu\xF2** spostare un Progetto da uno spazio **Principale** a uno spazio **Provvisorio** libero, e applica **l'effetto dello spazio** in cui lo mette. \xC8 un modo per riattivare gli effetti degli spazi (es. Soldi gratis!)."
    },
    {
      "id": "promessa",
      "titolo": "Promessa Elettorale (pacco regalo)",
      "indizi": "promessa elettorale, regalo, gratuitamente",
      "testo": "\xC8 l'effetto del **2\xB0 spazio Provvisorio**. Chi piazza un Progetto l\xEC pu\xF2 piazzare **subito e gratis** una **seconda** Carta Progetto, scelta tra quelle scoperte, nello **spazio Provvisorio vuoto alla sua destra** (il 3\xB0). Se quello spazio \xE8 occupato non succede nulla. La seconda carta **attiva il proprio Effetto Speciale** (decisione ufficiale di Factanza)."
    },
    {
      "id": "allocazione",
      "titolo": "Allocazione di Risorse (batteria verde)",
      "indizi": "allocazione, batteria, ricarica",
      "testo": "Si tolgono i segnalini **Mancanza di Risorse** da **tutti** i Progetti Principali, che tornano usabili. \xC8 l'effetto del **5\xB0 spazio Provvisorio**. La stessa icona compare su 4 Progetti (Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali, Ricerca di armi high-tech), anche se la legenda di pag. 9 non la elenca."
    },
    {
      "id": "tensione",
      "titolo": "Come funziona la Tensione Sociale?",
      "indizi": "tensione, termometro, tracciato",
      "testo": "La **Tensione Sociale** misura l'instabilit\xE0 della societ\xE0. Sale quando un **Progetto fallisce** o per alcuni effetti (teschio, Guerra civile). Non scende mai. Il tracciato ha **8 caselle** dopo la partenza:\n1. Soldi gratis!\n2. Risoluzione Evento\n3. Colpo di scena\n4. Risoluzione Evento\n5. Soldi gratis!\n6. Risoluzione Evento\n7. Soldi gratis!\n8. **Teschio**: la partita \xE8 persa per tutti\n\nOgni volta che sale si applica l'effetto della casella, poi il Leader rinnova le carte scoperte di un mazzo."
    },
    {
      "id": "rinnovo-carte",
      "titolo": "Quando la Tensione sale, quali carte si scartano?",
      "indizi": "scartare, rinnovare, carte visibili, scoperte",
      "testo": "Dopo l'effetto della casella, il **Leader sceglie un mazzo**, **Eventi oppure Progetti**: scarta **tutte** le carte scoperte di quel tipo e ne scopre altrettante nuove. \xC8 anche un'occasione per liberarsi di Eventi impossibili o di Progetti che non piacciono."
    },
    {
      "id": "tensione-scende",
      "titolo": "La Tensione Sociale pu\xF2 scendere?",
      "indizi": "scendere, abbassare, ridurre",
      "testo": "No: il regolamento non prevede nessun modo per far **scendere** la Tensione Sociale. Pu\xF2 solo salire."
    },
    {
      "id": "fine-turno",
      "titolo": "Cosa succede a fine turno?",
      "indizi": "fine turno, turno successivo, ricaricare, ripescare",
      "testo": "- I Principali usati ricevono il segnalino **Mancanza di Risorse**.\n- I Provvisori usati vanno in **Archivio**.\n- Si scoprono Progetti fino ad averne di nuovo **4**.\n- Si scoprono Eventi fino ad averne di nuovo **3**.\n- Inizia un nuovo turno con il **Leader attuale**."
    },
    {
      "id": "vittoria-gruppo",
      "titolo": "Quando finisce la partita con successo?",
      "indizi": "finisce, fine partita, successo, vinto",
      "testo": "La partita finisce **subito** con il successo del gruppo quando si risolve il **quinto Evento**. Allora tutti rivelano i Grandi Pensatori e contano i punti: **vince chi ne ha di pi\xF9**."
    },
    {
      "id": "sconfitta",
      "titolo": "Come si perde?",
      "indizi": "perde, perdere, sconfitta, fallimento",
      "testo": "La partita \xE8 **persa per tutti**, e finisce subito, se:\n- il segnalino Tensione Sociale arriva all'**ultima casella** (teschio);\n- un mazzo (**Progetti** o **Eventi**) **non ha abbastanza carte** per tornare a 4 Progetti o 3 Eventi scoperti.\n\nIn caso di sconfitta non si contano i punti: non vince nessuno."
    },
    {
      "id": "mazzo-esaurito",
      "titolo": "Cosa succede se finisce il mazzo?",
      "indizi": "mazzo finito, esaurito, vuoto, non ci sono pi\xF9 carte",
      "testo": "Se un mazzo non ha abbastanza carte per riportare a **4 i Progetti scoperti** o a **3 gli Eventi scoperti**, la partita \xE8 **persa per tutti** e finisce subito. Scartare carte (con la Tensione o con certi Colpi di scena) avvicina questo momento: Matteotti fa punti proprio se il mazzo Progetti \xE8 quasi vuoto."
    },
    {
      "id": "durata",
      "titolo": "Quanti turni dura una partita?",
      "indizi": "durata, quanto dura, quanti turni, limite di turni",
      "testo": "Il regolamento **non fissa** un numero di turni n\xE9 una durata. La partita finisce quando si risolve il quinto Evento (vittoria) oppure quando la Tensione arriva al teschio o un mazzo non basta pi\xF9 (sconfitta)."
    },
    {
      "id": "punteggio",
      "titolo": "Come si contano i punti a fine partita?",
      "indizi": "punti, punteggio, pv, vincitore",
      "testo": "Solo se il gruppo vince: ognuno rivela i suoi **2 Grandi Pensatori** e somma i **PV** (punti vittoria) dei due obiettivi. **Vince chi ha pi\xF9 punti.**\n\nContano solo gli **Eventi risolti** e i **Progetti approvati e/o archiviati**. I Progetti falliti o scartati non contano mai."
    },
    {
      "id": "approvato-definizione",
      "titolo": 'Cosa vuol dire "Progetto APPROVATO" sulle carte Pensatore?',
      "indizi": "approvato, approvati, archiviati, contano",
      "testo": `Sono i Progetti **sul tabellone**: Fondanti, Principali e Provvisori. Quelli in **Archivio non sono pi\xF9 approvati** (pag. 11) e contano solo per gli obiettivi che parlano espressamente di Archivio (Sun Tzu). Nell'esempio di pag. 21, Nietzsche e Curie contano i Progetti "approvati (non archiviati)".`
    },
    {
      "id": "coppie-ideologiche",
      "titolo": "Come funzionano gli obiettivi a coppie di icone?",
      "indizi": "coppia, coppie, due icone, 3 pv",
      "testo": "13 Grandi Pensatori premiano i Progetti approvati che hanno **entrambe** le icone indicate:\n- **3 PV** per ognuno in uno spazio **Principale**\n- **6 PV** per ognuno in uno spazio **Fondante**\n- **0 PV** se \xE8 **Provvisorio** o in Archivio\n\nEsempio: Amrita Devi Bishnoi conta i Progetti con foglia + tre persone (preservazione + pubblico)."
    },
    {
      "id": "pensatori-elenco",
      "titolo": "Chi sono i Grandi Pensatori?",
      "indizi": "grandi pensatori, elenco, lista, mentori",
      "testo": "- **Maynard Keynes** (Lo scavatore di buche): 4 PV per ogni progetto approvato con costo superiore a 8\n- **Hetty Green** (La campionessa dell\u2019austerity): 4 PV per ogni progetto approvato con costo inferiore a 5\n- **Amrita Devi Bishnoi** (L\u2019ambientalista): Per ogni progetto approvato con la coppia **Preservazione + Pubblico** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Henry David Thoreau** (Il responsabile): Per ogni progetto approvato con la coppia **Preservazione + Privato** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Mansa Musa** (Il capitalista): Per ogni progetto approvato con la coppia **Consumo + Privato** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Karl Marx** (Il comunista): Per ogni progetto approvato con la coppia **Consumo + Pubblico** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Giacomo Matteotti** (Il leader dell\u2019opposizione): Conta il numero di carte nel mazzo progetti. Ottieni: 20 PV se ha 3 carte o meno, 15 PV se \xE8 minore di 10, 10 PV se \xE8 minore di 15\n- **Marie Sk\u0142odowska Curie** (La scienziata): 3 PV per ogni progetto approvato con un effetto speciale\n- **Le Corbusier** (Il funzionalista): 4 PV per ogni progetto approvato senza effetti speciali\n- **Quinto Orazio Flacco** (L\u2019equilibrato): 4 PV per ogni progetto approvato con costo 5, 6, 7 o 8\n- **Friedrich Nietzsche** (Il rigeneratore): Conta il numero di progetti approvati. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n- **Imhotep** (Il grande costruttore): 4 PV per ogni progetto approvato oltre il quinto\n- **Michelangelo** (L\u2019artista): 3 PV per ogni progetto approvato con costo differente dagli altri\n- **Bartolina Sisa Vargas** (L\u2019indigena): Per ogni progetto approvato con la coppia **Preservazione + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **James Watt** (L\u2019ingegnere): Per ogni progetto approvato con la coppia **Consumo + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Gregor Mendel** (Il visionario): Per ogni progetto approvato con la coppia **Preservazione + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **A\u1E2B\u0101\u1E2B\u0101** (La mercante): Per ogni progetto approvato con la coppia **Consumo + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Margaret Thatcher** (La conservatrice): Per ogni progetto approvato con la coppia **Privato + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Pio IX** (Il Papa): Per ogni progetto approvato con la coppia **Pubblico + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Leonardo da Vinci** (L\u2019inventore): Per ogni progetto approvato con la coppia **Privato + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Toussaint Louverture** (Il rivoluzionario): Per ogni progetto approvato con la coppia **Pubblico + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n- **Buddha** (Il distaccato): Conta le icone Economia tra gli eventi risolti. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n- **Mahatma Gandhi** (Il pacifista): Conta le icone Difesa tra gli eventi risolti. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n- **William Morris** (L\u2019artigiano): Conta le icone Tecnologia tra gli eventi risolti. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n- **Sun Tzu** (Lo stratega): 2 PV per ogni progetto nell\u2019archivio\n- **Asso della Diplomazia**: Controlla la casella su cui si trova il segnalino della Tensione Sociale. Ottieni: 25 PV se \xE8 al punto di partenza o nelle prime 2, 15 PV se \xE8 nella 3\xAA o nella 4\xAA, 6 PV se \xE8 nella 5\xAA o nella 6\xAA"
    },
    {
      "id": "scambio-monete",
      "titolo": "Si possono scambiare o prestare monete tra giocatori?",
      "indizi": "scambiare, prestare, regalare, dare monete",
      "testo": "Il regolamento **non prevede** scambi, prestiti o regali di monete tra giocatori: le monete si muovono solo con le offerte e con gli effetti. Non c'\xE8 un divieto esplicito, ma nemmeno un modo previsto per farlo. Se volete permetterlo, decidetelo come regola di casa prima di iniziare."
    },
    {
      "id": "video-qr",
      "titolo": "C'\xE8 un video che spiega le regole?",
      "indizi": "video, qr, tutorial, extra",
      "testo": "S\xEC: nel regolamento c'\xE8 un **QR code** che porta a un video con la spiegazione delle regole, e un altro QR code con contenuti extra (video, approfondimenti, un'illustrazione speciale)."
    },
    {
      "id": "bot-info",
      "titolo": "Chi sei?",
      "indizi": "ti chiami, chi sei, intelligenza artificiale, chatgpt",
      "testo": "Sono l'assistente alle regole di The Social Contract. **Non uso intelligenza artificiale** e non invio niente a nessun server: confronto la tua domanda con il regolamento ufficiale e con i dati di tutte le 88 carte, e per i casi concreti faccio i calcoli con un motore che applica le regole. Quando il regolamento non dice qualcosa, te lo dico."
    },
    {
      "id": "acquisto",
      "titolo": "Prezzo e acquisto del gioco",
      "indizi": "comprare, acquistare, negozio, amazon",
      "testo": "Il regolamento non parla di prezzo n\xE9 di dove acquistare il gioco: per queste informazioni guarda le pagine di Factanza Media. Io posso aiutarti solo con le regole."
    },
    {
      "id": "varianti",
      "titolo": "Varianti, squadre, espansioni, edizioni",
      "indizi": "squadre, a squadre, espansione, espansioni",
      "testo": "Il regolamento **non prevede** varianti a squadre, modalit\xE0 in solitario, tornei, espansioni o altre edizioni. Descrive una sola modalit\xE0: da 2 a 6 giocatori, ognuno con i propri Grandi Pensatori. Se volete inventare una variante, decidetela insieme prima di iniziare."
    },
    {
      "id": "eta",
      "titolo": "Et\xE0 consigliata",
      "indizi": "eta, bambini, ragazzi, anni minimo",
      "testo": "Il testo del regolamento non indica un'et\xE0 minima consigliata. Se \xE8 stampata sulla scatola, fa fede quella."
    },
    {
      "id": "strategia",
      "titolo": "Consigli di strategia",
      "indizi": "strategia, trucchi, consigli, piu forte",
      "testo": 'Il regolamento non d\xE0 consigli di strategia e io non voglio inventarli. Posso per\xF2 dirti **esattamente come fa punti** ogni Grande Pensatore e quali Progetti lo premiano: scrivi il suo nome. Nella scheda "Strumenti" puoi anche confrontare i punti di tutti i Pensatori su un tabellone.'
    },
    {
      "id": "pezzi-persi",
      "titolo": "Ho perso un pezzo",
      "indizi": "perso, mancante, rotto, smarrito",
      "testo": 'Il regolamento non dice cosa fare se manca un componente. Per un segnalino o una moneta basta un sostituto qualsiasi; per una carta mancante il mazzo cambia e la partita non \xE8 pi\xF9 quella prevista. Puoi controllare cosa dovrebbe esserci nella scatola nella voce "Componenti".'
    },
    {
      "id": "risoluzione-una-o-piu",
      "titolo": "[decisione ufficiale] Un effetto Risoluzione Evento permette di risolvere uno o pi\xF9 Eventi?",
      "indizi": "risolvere due eventi, piu eventi insieme, un solo punto esclamativo, uno o piu eventi",
      "testo": '**Un effetto Risoluzione Evento permette di risolvere uno o pi\xF9 Eventi?**\n\nUn **!** fa risolvere **un solo Evento**. Il "una o pi\xF9" di pag. 15 vale quando nello stesso turno scattano **inneschi diversi** (per esempio una carta con ! piazzata sullo spazio Provvisorio con !): un Evento per ogni innesco.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "riuso-stesso-turno",
      "titolo": "[decisione ufficiale] Un Progetto Principale o Provvisorio pu\xF2 servire a due Eventi nello stesso turno?",
      "indizi": "due eventi stesso turno, stesso progetto due eventi, riusare un principale, usare due volte nello stesso turno",
      "testo": "**Un Progetto Principale o Provvisorio pu\xF2 servire a due Eventi nello stesso turno?**\n\n**No**: un Progetto **Principale** o **Provvisorio** usato per risolvere un Evento \xE8 **consumato subito** e non si pu\xF2 riusare nello stesso turno. Solo i **Fondanti** si possono usare pi\xF9 volte.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "stallo-tabellone-pieno",
      "titolo": "[decisione ufficiale] Tabellone pieno e nessun Evento risolvibile: cosa succede?",
      "indizi": "tabellone pieno nessun evento, nessun evento risolvibile, partita bloccata, stallo",
      "testo": "**Tabellone pieno e nessun Evento risolvibile: cosa succede?**\n\nSe il tabellone \xE8 pieno e **nessun Evento scoperto \xE8 risolvibile**, **la Tensione Sociale sale di 1**, con il rinnovo delle carte scoperte come ogni volta che sale la Tensione. Poi inizia un nuovo turno con lo stesso Leader. Cos\xEC la partita non si blocca.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "nessuno-spazio-legale",
      "titolo": "[decisione ufficiale] Progetto approvato ma restano liberi solo gli spazi Fondanti e l'offerta non arriva a costo +3",
      "indizi": "solo fondante libero, fondante libero senza +3, approvato ma non posso piazzarlo",
      "testo": "**Progetto approvato ma restano liberi solo gli spazi Fondanti e l'offerta non arriva a costo +3**\n\nIl Progetto \xE8 **fallito**: le monete offerte tornano ai giocatori e la Tensione Sociale sale di 1, come per ogni Progetto fallito.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "promessa-effetto-carta",
      "titolo": "[decisione ufficiale] Promessa Elettorale: la seconda carta piazzata gratis attiva il proprio Effetto Speciale?",
      "indizi": "seconda carta effetto, promessa elettorale effetto, carta gratis attiva effetto",
      "testo": "**Promessa Elettorale: la seconda carta piazzata gratis attiva il proprio Effetto Speciale?**\n\n**S\xEC**: la seconda Carta Progetto piazzata gratis con la Promessa Elettorale **attiva il proprio Effetto Speciale**, come ogni Carta Progetto messa sul tabellone (pag. 15). Lo spazio in cui finisce (il 3\xB0 Provvisorio) non ha effetti.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "colpo-carta-pescata",
      "titolo": "[decisione ufficiale] Dove va la Carta Evento pescata per un Colpo di scena?",
      "indizi": "carta pescata colpo di scena, dove va la carta pescata, evento pescato dove va, va scartata",
      "testo": "**Dove va la Carta Evento pescata per un Colpo di scena?**\n\nLa Carta Evento pescata per un Colpo di scena **viene scartata ed esce dal gioco**. Fa eccezione solo **Cantiere aperto**, che il suo Colpo di scena mette tra gli Eventi Risolti. Ogni carta scartata cos\xEC riduce il mazzo Eventi e avvicina la sconfitta per mazzo esaurito.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "segnalino-spostamento",
      "titolo": "[decisione ufficiale] Un Principale con segnalino Mancanza di Risorse spostato tra i Provvisori (Cambio di priorit\xE0) tiene il segnalino?",
      "indizi": "principale scarico spostato, tiene il segnalino, cambio di priorita segnalino",
      "testo": "**Un Principale con segnalino Mancanza di Risorse spostato tra i Provvisori (Cambio di priorit\xE0) tiene il segnalino?**\n\nIl segnalino Mancanza di Risorse **resta**: il Progetto spostato tra i Provvisori resta scarico. Il segnalino si toglie solo con un'Allocazione di Risorse.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "blackout-sinistra",
      "titolo": '[decisione ufficiale] Blackout frequenti: "i 3 Progetti Principali pi\xF9 a sinistra" se alcuni spazi sono vuoti',
      "indizi": "blackout frequenti spazi vuoti, tre principali piu a sinistra",
      "testo": '**Blackout frequenti: "i 3 Progetti Principali pi\xF9 a sinistra" se alcuni spazi sono vuoti**\n\nIl segnalino va sui **primi 3 Progetti Principali presenti**, partendo da sinistra: gli spazi vuoti si saltano.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "sostituzione-dettagli",
      "titolo": "[decisione ufficiale] Mancanza di produttivit\xE0: cosa succede alla carta sostituita e a quella nuova?",
      "indizi": "carta sostituita dove va, mancanza di produttivita carta sostituita",
      "testo": "**Mancanza di produttivit\xE0: cosa succede alla carta sostituita e a quella nuova?**\n\nLa carta tolta **esce dal gioco**. La carta nuova prende il suo posto ed **entra carica**, senza segnalino Mancanza di Risorse. Se la carta nuova attivi il proprio Effetto Speciale non \xE8 stato precisato: questo assistente non lo attiva (interpretazione, non regola ufficiale).\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "sposta-quale-spazio",
      "titolo": "[decisione ufficiale] Corsa al riarmo / Problemi di approvvigionamento: in quale spazio Principale va la carta?",
      "indizi": "in quale spazio principale, quale spazio principale libero",
      "testo": "**Corsa al riarmo / Problemi di approvvigionamento: in quale spazio Principale va la carta?**\n\nLo spazio Principale libero lo **sceglie il Leader**.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "incursione-effetto-carta",
      "titolo": "[decisione ufficiale] Incursione militare: i due Progetti piazzati attivano il proprio Effetto Speciale?",
      "indizi": "incursione militare effetto delle carte, incursione attiva effetti",
      "testo": '**Incursione militare: i due Progetti piazzati attivano il proprio Effetto Speciale?**\n\n**S\xEC**: i Progetti piazzati con Incursione militare **attivano gli Effetti Speciali delle carte**. Sono esclusi solo gli effetti degli **spazi Provvisori** in cui finiscono (le "caselle" del testo della carta).\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "senso-sinistra",
      "titolo": '[caso aperto] Primi passi / Crescita sostenuta: chi \xE8 "a sinistra" del Leader?',
      "indizi": "chi e a sinistra del leader, a destra del leader",
      "testo": '**Primi passi / Crescita sostenuta: chi \xE8 "a sinistra" del Leader?**\n\n**Cosa dice il regolamento:** Colpi di scena: la persona a sinistra (Primi passi) o a destra (Crescita sostenuta) del Leader diventa Leader.\n\n**Cosa non dice:** Nulla di ambiguo al tavolo: \xE8 la persona seduta fisicamente a sinistra/destra. Nel verificatore i giocatori vanno inseriti in senso orario.\n\n**Come lo applica questo assistente** (interpretazione, non regola ufficiale): Ordine orario: sinistra = giocatore successivo.'
    },
    {
      "id": "cantiere-effetto",
      "titolo": "[decisione ufficiale] Cantiere aperto finito tra gli Eventi Risolti col Colpo di scena: conta per la vittoria?",
      "indizi": "cantiere aperto conta per vincere, cantiere aperto colpo di scena",
      "testo": "**Cantiere aperto finito tra gli Eventi Risolti col Colpo di scena: conta per la vittoria?**\n\n**S\xEC**: Cantiere aperto finito tra gli Eventi Risolti con il suo Colpo di scena **conta a tutti gli effetti**, sia per la vittoria al quinto Evento risolto sia per i punti dei Grandi Pensatori.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "metropolis-effetto",
      "titolo": "[decisione ufficiale] Metropolis!: l'Evento risolto scartando un Fondante attiva il suo effetto?",
      "indizi": "metropolis attiva effetto, metropolis effetto evento risolto",
      "testo": "**Metropolis!: l'Evento risolto scartando un Fondante attiva il suo effetto?**\n\n**S\xEC**: l'Evento risolto con Metropolis! \xE8 risolto **a tutti gli effetti** e il suo effetto si attiva.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "monete-insufficienti",
      "titolo": "[decisione ufficiale] Devo perdere monete ma non ne ho abbastanza",
      "indizi": "non ho abbastanza monete, perdere monete che non ho, ne ho meno, monete negative",
      "testo": "**Devo perdere monete ma non ne ho abbastanza**\n\nChi deve perdere pi\xF9 monete di quelle che ha **perde tutte quelle che ha**: si arriva a zero, senza andare sotto e senza debiti.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "riserva-esaurita",
      "titolo": "[decisione ufficiale] La riserva comune finisce le monete",
      "indizi": "riserva finita, banca ha finito, monete finite nella riserva",
      "testo": "**La riserva comune finisce le monete**\n\nSe la riserva non ha abbastanza monete, **si distribuisce quello che c'\xE8**. In che ordine distribuirle non \xE8 stato precisato.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "michelangelo-costo-differente",
      "titolo": '[decisione ufficiale] Michelangelo: "costo DIFFERENTE dagli altri"',
      "indizi": "costo differente, costi differenti, costo diverso dagli altri",
      "testo": '**Michelangelo: "costo DIFFERENTE dagli altri"**\n\nSi conta **un Progetto per ogni costo distinto** tra i Progetti approvati. Esempio: con costi 2, 2, 5 e 7 i costi distinti sono 3 (2, 5 e 7), quindi **9 PV**. Due Progetti con lo stesso costo valgono 3 PV una volta sola.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "fondante-ventaglio",
      "titolo": "[decisione ufficiale] Eventi a ventaglio (spendi N carte): un Fondante conta? Si consuma?",
      "indizi": "fondante evento ventaglio, fondante spendere carte, ventaglio con fondante",
      "testo": "**Eventi a ventaglio (spendi N carte): un Fondante conta? Si consuma?**\n\nNegli Eventi a ventaglio un **Fondante conta** tra le carte da spendere e **resta in tabellone**, come negli Eventi a risorse.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "pareggio-vittoria",
      "titolo": "[decisione ufficiale] Pareggio nel punteggio finale",
      "indizi": "pareggio punti, stesso punteggio, stessi punti, parita finale",
      "testo": "**Pareggio nel punteggio finale**\n\nCon un pareggio nel punteggio pi\xF9 alto la **vittoria \xE8 condivisa**.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "asso-diplomazia",
      "titolo": "[decisione ufficiale] Asso della Diplomazia: carta da personalizzare o obiettivo sulla Tensione?",
      "indizi": "asso della diplomazia, carta vuota, pensatore personalizzato",
      "testo": "**Asso della Diplomazia: carta da personalizzare o obiettivo sulla Tensione?**\n\nVale l'**obiettivo stampato** sulla carta, basato sulla casella della Tensione Sociale: 25 PV dalla partenza alla casella 2, 15 PV nelle caselle 3-4, 6 PV nelle caselle 5-6. Il regolamento (pag. 8) la descrive come la carta senza nome n\xE9 illustrazione, fatta per essere personalizzata: per i punti vale comunque l'obiettivo stampato.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "esempio-andrea",
      "titolo": "[decisione ufficiale] Errore nell'esempio di punteggio di pag. 21 (Andrea)",
      "indizi": "esempio di andrea, pagina 21, esempio sbagliato, 32 punti",
      "testo": `**Errore nell'esempio di punteggio di pag. 21 (Andrea)**

L'esempio di pag. 21 ha due refusi, che il regolamento stampato non segnala. Primo: per Hetty Green elenca 5 Progetti di costo inferiore a 5 (20 PV), ma Istituzione dell'alleanza M.O.R.T.O. costa 10, quindi sono 4 (16 PV). Secondo: il totale stampato \xE8 "20 PV + 12 PV = 32 PV", ma Toussaint Louverture fa 0 PV, perch\xE9 **i Progetti Provvisori non danno punti** per gli obiettivi a coppie di icone (regola confermata da Factanza). Andrea fa quindi **16 PV**; Matteo vince comunque con 22. In pi\xF9, pag. 19 rimanda all'esempio "a pagina 18", ma \xE8 a pag. 20-21.

_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._`
    },
    {
      "id": "allocazione-su-carta",
      "titolo": "[decisione ufficiale] Icona batteria (Allocazione di Risorse) sulle Carte Progetto",
      "indizi": "batteria sulle carte, batteria sul progetto, batteria disegnata, icona batteria progetto",
      "testo": "**Icona batteria (Allocazione di Risorse) sulle Carte Progetto**\n\nL'icona della **batteria verde** sulle Carte Progetto ha **lo stesso effetto dello spazio** Allocazione di Risorse: si tolgono i segnalini Mancanza di Risorse da tutti i Progetti Principali. \xC8 stampata su Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali e Ricerca di armi high-tech.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "matteotti-mazzo",
      "titolo": "[decisione ufficiale] Matteotti: quali carte si contano?",
      "indizi": "matteotti carte coperte, matteotti carte scoperte",
      "testo": "**Matteotti: quali carte si contano?**\n\nSi contano **solo le carte del mazzo coperto** dei Progetti, non le 4 scoperte.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    }
  ],
  "carte": [
    {
      "id": "p01",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Corsi cittadini di artigianato (La lobby dei falegnami sta protestando da sei mesi.)",
      "testo": "**Corsi cittadini di artigianato**\n- Costo: **2** monete (Fondante: almeno 5)\n- Risorsa: **1 Economia e Welfare**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: nessuno\n\n_La lobby dei falegnami sta protestando da sei mesi._"
    },
    {
      "id": "p02",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Contributi per asili nido aziendali (Come la giornata \u201CPorta i tuoi figli a lavoro\u201D, per\xF2 tutto l'anno!)",
      "testo": "**Contributi per asili nido aziendali**\n- Costo: **3** monete (Fondante: almeno 6)\n- Risorsa: **1 Economia e Welfare**\n- Icone: Privato \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Come la giornata \u201CPorta i tuoi figli a lavoro\u201D, per\xF2 tutto l'anno!_"
    },
    {
      "id": "p03",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Rete stradale (Abbiamo tutte queste automobili! Dovremo farci qualcosa prima o poi.)",
      "testo": "**Rete stradale**\n- Costo: **4** monete (Fondante: almeno 7)\n- Risorsa: **2 Economia e Welfare**\n- Icone: Pubblico \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Allocazione di Risorse (batteria verde)**: si tolgono i segnalini Mancanza di Risorse da tutti i Principali (sulle carte l'icona non \xE8 nella legenda di pag. 9: per decisione ufficiale di Factanza vale come lo spazio)\n\n_Abbiamo tutte queste automobili! Dovremo farci qualcosa prima o poi._\n\n---\n**Icona batteria (Allocazione di Risorse) sulle Carte Progetto**\n\nL'icona della **batteria verde** sulle Carte Progetto ha **lo stesso effetto dello spazio** Allocazione di Risorse: si tolgono i segnalini Mancanza di Risorse da tutti i Progetti Principali. \xC8 stampata su Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali e Ricerca di armi high-tech.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "p04",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Universit\xE0 private (Come quelle che vedete nei film! Ma con molto meno gossip.)",
      "testo": "**Universit\xE0 private**\n- Costo: **9** monete (Fondante: almeno 12)\n- Risorsa: **3 Economia e Welfare**\n- Icone: Privato \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: **Aumenta la Tensione Sociale (teschio)**: la Tensione sale di 1: si applica l'effetto della casella, poi il Leader rinnova gli Eventi o i Progetti scoperti\n\n_Come quelle che vedete nei film! Ma con molto meno gossip._"
    },
    {
      "id": "p05",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Digitalizzazione delle imprese (Paolo ha di nuovo dimenticato la password dello SPID...)",
      "testo": "**Digitalizzazione delle imprese**\n- Costo: **7** monete (Fondante: almeno 10)\n- Risorsa: **2 Economia e Welfare**\n- Icone: Privato \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: **Allocazione di Risorse (batteria verde)**: si tolgono i segnalini Mancanza di Risorse da tutti i Principali (sulle carte l'icona non \xE8 nella legenda di pag. 9: per decisione ufficiale di Factanza vale come lo spazio)\n\n_Paolo ha di nuovo dimenticato la password dello SPID..._\n\n---\n**Icona batteria (Allocazione di Risorse) sulle Carte Progetto**\n\nL'icona della **batteria verde** sulle Carte Progetto ha **lo stesso effetto dello spazio** Allocazione di Risorse: si tolgono i segnalini Mancanza di Risorse da tutti i Progetti Principali. \xC8 stampata su Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali e Ricerca di armi high-tech.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "p06",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Polo industriale (Se mettiamo tutte le industrie in un unico punto, ci servir\xE0 una sola fermata metro! Geniale.)",
      "testo": "**Polo industriale**\n- Costo: **10** monete (Fondante: almeno 13)\n- Risorsa: **3 Economia e Welfare**\n- Icone: Privato \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Nuova linea politica (freccia verde)**: il Leader pu\xF2 spostare un Provvisorio in uno spazio Principale libero\n\n_Se mettiamo tutte le industrie in un unico punto, ci servir\xE0 una sola fermata metro! Geniale._"
    },
    {
      "id": "p07",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Cooperative economiche (Dividetevi i rischi, e condividiamo gli utili.)",
      "testo": "**Cooperative economiche**\n- Costo: **8** monete (Fondante: almeno 11)\n- Risorsa: **3 Economia e Welfare**\n- Icone: Privato \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Dividetevi i rischi, e condividiamo gli utili._"
    },
    {
      "id": "p08",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Reddito di base universale (Soldi gratis? Senza bisogno di lavorare? Dove firmo?)",
      "testo": "**Reddito di base universale**\n- Costo: **10** monete (Fondante: almeno 13)\n- Risorsa: **4 Economia e Welfare**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: **Cambio di priorit\xE0 (freccia rossa)**: il Leader pu\xF2 spostare un Principale in uno spazio Provvisorio libero, applicando l'effetto dello spazio\n\n_Soldi gratis? Senza bisogno di lavorare? Dove firmo?_"
    },
    {
      "id": "p09",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Sistema pensionistico privato (Se lo Stato non riesce a pagare le pensioni, dovremo pensarci da soli.)",
      "testo": "**Sistema pensionistico privato**\n- Costo: **12** monete (Fondante: almeno 15)\n- Risorsa: **4 Economia e Welfare**\n- Icone: Privato \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Se lo Stato non riesce a pagare le pensioni, dovremo pensarci da soli._"
    },
    {
      "id": "p10",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Istituzione di una borsa finanziaria (Bellissimo quando i numeri vanno su! Quando vanno gi\xF9 per\xF2...)",
      "testo": "**Istituzione di una borsa finanziaria**\n- Costo: **5** monete (Fondante: almeno 8)\n- Risorsa: **2 Economia e Welfare**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n\n_Bellissimo quando i numeri vanno su! Quando vanno gi\xF9 per\xF2..._"
    },
    {
      "id": "p11",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Aumento delle pensioni pubbliche (Per i 20enni \xE8 un importantissimo investimento per il futuro.)",
      "testo": "**Aumento delle pensioni pubbliche**\n- Costo: **6** monete (Fondante: almeno 9)\n- Risorsa: **2 Economia e Welfare**\n- Icone: Pubblico \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Per i 20enni \xE8 un importantissimo investimento per il futuro._"
    },
    {
      "id": "p12",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Mutui garantiti dallo Stato per giovani e famiglie (Per mandarli via di casa prima dei 40 anni.)",
      "testo": "**Mutui garantiti dallo Stato per giovani e famiglie**\n- Costo: **4** monete (Fondante: almeno 7)\n- Risorsa: **2 Economia e Welfare**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n\n_Per mandarli via di casa prima dei 40 anni._"
    },
    {
      "id": "p13",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Banca di microcredito (A volte l'economia si basa sull'acquisto di una stalla, non di una casa.)",
      "testo": "**Banca di microcredito**\n- Costo: **7** monete (Fondante: almeno 10)\n- Risorsa: **3 Economia e Welfare**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n\n_A volte l'economia si basa sull'acquisto di una stalla, non di una casa._"
    },
    {
      "id": "p14",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Potenziamento energie rinnovabili (Se solo ci fosse un modo per coprirsi dal Sole e fornire energia a basso costo al quartiere...)",
      "testo": "**Potenziamento energie rinnovabili**\n- Costo: **7** monete (Fondante: almeno 10)\n- Risorsa: **3 Tecnologia e Sopravvivenza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n\n_Se solo ci fosse un modo per coprirsi dal Sole e fornire energia a basso costo al quartiere..._"
    },
    {
      "id": "p15",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Sviluppo di una rete elettrica capillare (E fu cos\xEC che inventammo i black-out.)",
      "testo": "**Sviluppo di una rete elettrica capillare**\n- Costo: **10** monete (Fondante: almeno 13)\n- Risorsa: **4 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_E fu cos\xEC che inventammo i black-out._"
    },
    {
      "id": "p16",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Costruzione data center per lo sviluppo dell'AI (Certo! Ti scrivo subito una descrizione arguta per la carta di un gioco da tavolo...)",
      "testo": "**Costruzione data center per lo sviluppo dell'AI**\n- Costo: **8** monete (Fondante: almeno 11)\n- Risorsa: **3 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: nessuno\n\n_Certo! Ti scrivo subito una descrizione arguta per la carta di un gioco da tavolo..._"
    },
    {
      "id": "p17",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Allevamenti intensivi (Non so bene cosa succeda l\xE0 dentro, ma la carne costa poco.)",
      "testo": "**Allevamenti intensivi**\n- Costo: **2** monete (Fondante: almeno 5)\n- Risorsa: **2 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n\n_Non so bene cosa succeda l\xE0 dentro, ma la carne costa poco._"
    },
    {
      "id": "p18",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Wifi-pubblico e diffuso (Per qualche motivo per\xF2 il MIO non va mai.)",
      "testo": "**Wifi-pubblico e diffuso**\n- Costo: **1** monete (Fondante: almeno 4)\n- Risorsa: **2 Tecnologia e Sopravvivenza**\n- Icone: Pubblico \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Doppio Colpo di scena (due sirene)**: il Leader pesca 2 Eventi e applica i loro Colpi di scena nell'ordine di pesca\n\n_Per qualche motivo per\xF2 il MIO non va mai._"
    },
    {
      "id": "p19",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Selezione ottimizzata delle sementi (Molto interessante. La prossima volta per\xF2 valutiamo a monte la reale utilit\xE0 di un pomodoro blu.)",
      "testo": "**Selezione ottimizzata delle sementi**\n- Costo: **2** monete (Fondante: almeno 5)\n- Risorsa: **1 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Molto interessante. La prossima volta per\xF2 valutiamo a monte la reale utilit\xE0 di un pomodoro blu._"
    },
    {
      "id": "p20",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Efficientamento delle batterie per auto elettriche (No, non possiamo semplicemente \u201Cmetterci pi\xF9 pile\u201D.)",
      "testo": "**Efficientamento delle batterie per auto elettriche**\n- Costo: **2** monete (Fondante: almeno 5)\n- Risorsa: **1 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: nessuno\n\n_No, non possiamo semplicemente \u201Cmetterci pi\xF9 pile\u201D._"
    },
    {
      "id": "p21",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Ricerca sulla fusione nucleare (\u201CLa potenza del Sole... nel palmo della mia mano\u201D Cit.)",
      "testo": "**Ricerca sulla fusione nucleare**\n- Costo: **8** monete (Fondante: almeno 11)\n- Risorsa: **3 Tecnologia e Sopravvivenza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: nessuno\n\n_\u201CLa potenza del Sole... nel palmo della mia mano\u201D Cit._"
    },
    {
      "id": "p22",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Centrale a carbone statale (Qui si festeggia la Befana tutto l'anno.)",
      "testo": "**Centrale a carbone statale**\n- Costo: **4** monete (Fondante: almeno 7)\n- Risorsa: **3 Tecnologia e Sopravvivenza**\n- Icone: Pubblico \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Doppio Colpo di scena (due sirene)**: il Leader pesca 2 Eventi e applica i loro Colpi di scena nell'ordine di pesca\n\n_Qui si festeggia la Befana tutto l'anno._"
    },
    {
      "id": "p23",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Pozzi petroliferi statali (Ci serve benzina per far funzionare i pozzi petroliferi per avere pi\xF9 benzina per far funzionare pi\xF9 pozzi petroliferi...)",
      "testo": "**Pozzi petroliferi statali**\n- Costo: **6** monete (Fondante: almeno 9)\n- Risorsa: **2 Tecnologia e Sopravvivenza**\n- Icone: Pubblico \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Allocazione di Risorse (batteria verde)**: si tolgono i segnalini Mancanza di Risorse da tutti i Principali (sulle carte l'icona non \xE8 nella legenda di pag. 9: per decisione ufficiale di Factanza vale come lo spazio)\n\n_Ci serve benzina per far funzionare i pozzi petroliferi per avere pi\xF9 benzina per far funzionare pi\xF9 pozzi petroliferi..._\n\n---\n**Icona batteria (Allocazione di Risorse) sulle Carte Progetto**\n\nL'icona della **batteria verde** sulle Carte Progetto ha **lo stesso effetto dello spazio** Allocazione di Risorse: si tolgono i segnalini Mancanza di Risorse da tutti i Progetti Principali. \xC8 stampata su Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali e Ricerca di armi high-tech.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "p24",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Agricoltura idroponica domestica (Un ecosistema in ogni casa. Stavolta senza insetti.)",
      "testo": "**Agricoltura idroponica domestica**\n- Costo: **2** monete (Fondante: almeno 5)\n- Risorsa: **1 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: nessuno\n\n_Un ecosistema in ogni casa. Stavolta senza insetti._"
    },
    {
      "id": "p25",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Centri di ricerca di nuovi medicinali (Abbiamo curato tutto, ma i dolori improvvisi tra le costole sono ancora un mistero. Richiediamo maggiori finanziamenti.)",
      "testo": "**Centri di ricerca di nuovi medicinali**\n- Costo: **7** monete (Fondante: almeno 10)\n- Risorsa: **3 Tecnologia e Sopravvivenza**\n- Icone: Pubblico \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n\n_Abbiamo curato tutto, ma i dolori improvvisi tra le costole sono ancora un mistero. Richiediamo maggiori finanziamenti._"
    },
    {
      "id": "p26",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Computer quantistici (Possono completare una Settimana Enigmistica in 4 giorni. Rivoluzionario.)",
      "testo": "**Computer quantistici**\n- Costo: **5** monete (Fondante: almeno 8)\n- Risorsa: **3 Tecnologia e Sopravvivenza**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Cambio di priorit\xE0 (freccia rossa)**: il Leader pu\xF2 spostare un Principale in uno spazio Provvisorio libero, applicando l'effetto dello spazio\n\n_Possono completare una Settimana Enigmistica in 4 giorni. Rivoluzionario._"
    },
    {
      "id": "p27",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Piano di difesa anti-crisi (Dobbiamo essere pronti ANCHE nel caso in cui vada tutto bene. Non si sa mai.)",
      "testo": "**Piano di difesa anti-crisi**\n- Costo: **10** monete (Fondante: almeno 13)\n- Risorsa: **2 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: **Risoluzione Evento (!)**: il Leader, se possibile, sceglie un Evento scoperto e lo risolve\n\n_Dobbiamo essere pronti ANCHE nel caso in cui vada tutto bene. Non si sa mai._"
    },
    {
      "id": "p28",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Societ\xE0 di spionaggio (No signora, non possiamo dirle le ricerche su internet di suo figlio.)",
      "testo": "**Societ\xE0 di spionaggio**\n- Costo: **4** monete (Fondante: almeno 7)\n- Risorsa: **1 Difesa e Sicurezza**\n- Icone: Privato \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: **Aumenta la Tensione Sociale (teschio)**: la Tensione sale di 1: si applica l'effetto della casella, poi il Leader rinnova gli Eventi o i Progetti scoperti\n\n_No signora, non possiamo dirle le ricerche su internet di suo figlio._"
    },
    {
      "id": "p29",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Satelliti militari (Possono vedere TUTTO quello che fate, a qualsiasi ora del giorno e della notte! Non siete felici?)",
      "testo": "**Satelliti militari**\n- Costo: **10** monete (Fondante: almeno 13)\n- Risorsa: **4 Difesa e Sicurezza**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Cambio di priorit\xE0 (freccia rossa)**: il Leader pu\xF2 spostare un Principale in uno spazio Provvisorio libero, applicando l'effetto dello spazio\n\n_Possono vedere TUTTO quello che fate, a qualsiasi ora del giorno e della notte! Non siete felici?_"
    },
    {
      "id": "p30",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Controllo delle frontiere (Senza il timbro non si entra, mi dispiace.)",
      "testo": "**Controllo delle frontiere**\n- Costo: **6** monete (Fondante: almeno 9)\n- Risorsa: **2 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Senza il timbro non si entra, mi dispiace._"
    },
    {
      "id": "p31",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Artiglieria di difesa orbitale (Il tasto di lancio lo mettiamo lontano dalla scrivania questa volta.)",
      "testo": "**Artiglieria di difesa orbitale**\n- Costo: **12** monete (Fondante: almeno 15)\n- Risorsa: **3 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Nuova linea politica (freccia verde)**: il Leader pu\xF2 spostare un Provvisorio in uno spazio Principale libero\n\n_Il tasto di lancio lo mettiamo lontano dalla scrivania questa volta._"
    },
    {
      "id": "p32",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Caserme di polizia (Mi raccomando, come poliziotti \xE8 nostro dovere fermare SOLO chi va incredibilmente di fretta.)",
      "testo": "**Caserme di polizia**\n- Costo: **3** monete (Fondante: almeno 6)\n- Risorsa: **1 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Mi raccomando, come poliziotti \xE8 nostro dovere fermare SOLO chi va incredibilmente di fretta._"
    },
    {
      "id": "p33",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Programmi di addestramento militare cittadino (Un cittadino pronto \xE8 un cittadino al sicuro. Tranne Giulia, Giulia \xE8 un caso perso.)",
      "testo": "**Programmi di addestramento militare cittadino**\n- Costo: **6** monete (Fondante: almeno 9)\n- Risorsa: **2 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Un cittadino pronto \xE8 un cittadino al sicuro. Tranne Giulia, Giulia \xE8 un caso perso._"
    },
    {
      "id": "p34",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Centri di detenzione extra-territoriali (A volte i problemi si risolvono solo spostandoli da qualche altra parte.)",
      "testo": "**Centri di detenzione extra-territoriali**\n- Costo: **9** monete (Fondante: almeno 12)\n- Risorsa: **2 Difesa e Sicurezza**\n- Icone: Privato \xB7 Consumo \xB7 Tradizione\n- Effetto speciale: **Risoluzione Evento (!)**: il Leader, se possibile, sceglie un Evento scoperto e lo risolve\n\n_A volte i problemi si risolvono solo spostandoli da qualche altra parte._"
    },
    {
      "id": "p35",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Ricerca di armi high-tech (La vera arma del futuro \xE8 quella che non ha bisogno di essere usata.)",
      "testo": "**Ricerca di armi high-tech**\n- Costo: **7** monete (Fondante: almeno 10)\n- Risorsa: **2 Difesa e Sicurezza**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Allocazione di Risorse (batteria verde)**: si tolgono i segnalini Mancanza di Risorse da tutti i Principali (sulle carte l'icona non \xE8 nella legenda di pag. 9: per decisione ufficiale di Factanza vale come lo spazio)\n\n_La vera arma del futuro \xE8 quella che non ha bisogno di essere usata._\n\n---\n**Icona batteria (Allocazione di Risorse) sulle Carte Progetto**\n\nL'icona della **batteria verde** sulle Carte Progetto ha **lo stesso effetto dello spazio** Allocazione di Risorse: si tolgono i segnalini Mancanza di Risorse da tutti i Progetti Principali. \xC8 stampata su Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali e Ricerca di armi high-tech.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "p36",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Richiesta di salvataggio interplanetario (\u201CAbbiamo finito la carta igienica. Vi imploriamo. Siete l'ultima speranza dell'umanit\xE0.\u201D)",
      "testo": "**Richiesta di salvataggio interplanetario**\n- Costo: **12** monete (Fondante: almeno 15)\n- Risorsa: **4 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: nessuno\n\n_\u201CAbbiamo finito la carta igienica. Vi imploriamo. Siete l'ultima speranza dell'umanit\xE0.\u201D_"
    },
    {
      "id": "p37",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Corsi di peacekeeping (Stretta di mano e larghe vedute. Il segreto della convivenza.)",
      "testo": "**Corsi di peacekeeping**\n- Costo: **1** monete (Fondante: almeno 4)\n- Risorsa: **1 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Tradizione\n- Effetto speciale: nessuno\n\n_Stretta di mano e larghe vedute. Il segreto della convivenza._"
    },
    {
      "id": "p38",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Istituzione dell'alleanza M.O.R.T.O. (Altro che NATO...)",
      "testo": "**Istituzione dell'alleanza M.O.R.T.O.**\n- Costo: **10** monete (Fondante: almeno 13)\n- Risorsa: **3 Difesa e Sicurezza**\n- Icone: Pubblico \xB7 Preservazione \xB7 Innovazione\n- Effetto speciale: **Aumenta la Tensione Sociale (teschio)**: la Tensione sale di 1: si applica l'effetto della casella, poi il Leader rinnova gli Eventi o i Progetti scoperti\n\n_Altro che NATO..._"
    },
    {
      "id": "p39",
      "kind": "project",
      "tipo": "Progetto",
      "nome": "Sistema di sorveglianza biometrica (Sorridi!)",
      "testo": "**Sistema di sorveglianza biometrica**\n- Costo: **4** monete (Fondante: almeno 7)\n- Risorsa: **1 Difesa e Sicurezza**\n- Icone: Privato \xB7 Consumo \xB7 Innovazione\n- Effetto speciale: **Risoluzione Evento (!)**: il Leader, se possibile, sceglie un Evento scoperto e lo risolve\n\n_Sorridi!_"
    },
    {
      "id": "e01",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Costo della vita in aumento (Quanto hai detto che costa il latte senza glutine?!)",
      "testo": "**Costo della vita in aumento** (Evento)\n- Per risolverlo: **5 Economia e Welfare**\n- Effetto quando risolto: **Aumenta la Tensione Sociale (teschio)**: la Tensione sale di 1: si applica l'effetto della casella, poi il Leader rinnova gli Eventi o i Progetti scoperti\n- Colpo di scena: Scarta tutti i PROGETTI e gli EVENTI rivelati e rivelane altrettanti\n\n_Quanto hai detto che costa il latte senza glutine?!_"
    },
    {
      "id": "e02",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Inverno demografico (Chi ci pagher\xE0 la pensione, se non lavora nessuno?)",
      "testo": "**Inverno demografico** (Evento)\n- Per risolverlo: **7 Economia e Welfare**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Il Leader sceglie un PROGETTO PRINCIPALE approvato da scartare\n\n_Chi ci pagher\xE0 la pensione, se non lavora nessuno?_"
    },
    {
      "id": "e03",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Esplode la disoccupazione (\u201CCi sei per un aperitivo?\u201D \u201CAmico \xE8 mercoled\xEC, e sono le 11:00 del mattino...\u201D)",
      "testo": "**Esplode la disoccupazione** (Evento)\n- Per risolverlo: **9 Economia e Welfare**\n- Effetto quando risolto: **Nuova linea politica (freccia verde)**: il Leader pu\xF2 spostare un Provvisorio in uno spazio Principale libero\n- Colpo di scena: Tutti i giocatori ottengono 4 MONETE\n\n_\u201CCi sei per un aperitivo?\u201D \u201CAmico \xE8 mercoled\xEC, e sono le 11:00 del mattino...\u201D_"
    },
    {
      "id": "e04",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Blackout frequenti (Ugh, senza luce n\xE9 Wi-Fi non ci resta che giocare a qualche stupido gioco da tavolo...)",
      "testo": '**Blackout frequenti** (Evento)\n- Per risolverlo: **5 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n- Colpo di scena: Posiziona il segnalino \u201CMancanza di Risorse\u201D sui 3 PROGETTI PRINCIPALI pi\xF9 a sinistra del tabellone\n\n_Ugh, senza luce n\xE9 Wi-Fi non ci resta che giocare a qualche stupido gioco da tavolo..._\n\n---\n**Blackout frequenti: "i 3 Progetti Principali pi\xF9 a sinistra" se alcuni spazi sono vuoti**\n\nIl segnalino va sui **primi 3 Progetti Principali presenti**, partendo da sinistra: gli spazi vuoti si saltano.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "e05",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Mancanza di produttivit\xE0 (Senza Intelligenza Artificiale chi le scrive le nostre mail?)",
      "testo": "**Mancanza di produttivit\xE0** (Evento)\n- Per risolverlo: **7 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Il Leader pesca la prima Carta del Mazzo Progetti e la sostituisce ad un PROGETTO APPROVATO\n\n_Senza Intelligenza Artificiale chi le scrive le nostre mail?_\n\n---\n**Mancanza di produttivit\xE0: cosa succede alla carta sostituita e a quella nuova?**\n\nLa carta tolta **esce dal gioco**. La carta nuova prende il suo posto ed **entra carica**, senza segnalino Mancanza di Risorse. Se la carta nuova attivi il proprio Effetto Speciale non \xE8 stato precisato: questo assistente non lo attiva (interpretazione, non regola ufficiale).\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "e06",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Organizzazione di un\u2019Esposizione Universale (Per quella di Parigi del 1889 costruirono la Torre Eiffel. Vedete cosa dovete fare stavolta.)",
      "testo": "**Organizzazione di un\u2019Esposizione Universale** (Evento)\n- Per risolverlo: **8 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Nuova linea politica (freccia verde)**: il Leader pu\xF2 spostare un Provvisorio in uno spazio Principale libero\n- Colpo di scena: Tutti i giocatori perdono 2 MONETE\n\n_Per quella di Parigi del 1889 costruirono la Torre Eiffel. Vedete cosa dovete fare stavolta._"
    },
    {
      "id": "e07",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Incidente diplomatico (Col senno di poi, anche quella battuta sui giapponesi \xE8 stata un errore.)",
      "testo": "**Incidente diplomatico** (Evento)\n- Per risolverlo: **5 Difesa e Sicurezza**\n- Effetto quando risolto: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n- Colpo di scena: Il Leader deve scegliere tra: - perdere personalmente 5 MONETE; - scartare una CARTA EVENTO dalla sezione Eventi Risolti.\n\n_Col senno di poi, anche quella battuta sui giapponesi \xE8 stata un errore._"
    },
    {
      "id": "e08",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Disordini lungo i confini (Sicuramente non apriremo le porte proprio ora che hanno dei forconi in mano.)",
      "testo": "**Disordini lungo i confini** (Evento)\n- Per risolverlo: **6 Difesa e Sicurezza**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Scarta tutte le CARTE EVENTO rivelate e rivelane altrettante\n\n_Sicuramente non apriremo le porte proprio ora che hanno dei forconi in mano._"
    },
    {
      "id": "e09",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Guerra civile (Nessuno ricordava come fosse iniziata: sapevano solo che c\u2019entrava Sanremo.)",
      "testo": "**Guerra civile** (Evento)\n- Per risolverlo: **9 Difesa e Sicurezza**\n- Effetto quando risolto: **Nuova linea politica (freccia verde)**: il Leader pu\xF2 spostare un Provvisorio in uno spazio Principale libero\n- Colpo di scena: Aumenta la TENSIONE SOCIALE di 1 (senza attivare Effetti Speciali n\xE9 scartare Carte)\n\n_Nessuno ricordava come fosse iniziata: sapevano solo che c\u2019entrava Sanremo._"
    },
    {
      "id": "e10",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Proteste popolari per la mancanza di risorse (Che mangino brioche!)",
      "testo": "**Proteste popolari per la mancanza di risorse** (Evento)\n- Per risolverlo: **5 Difesa e Sicurezza + 5 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Soldi gratis!**: tutti prendono 4 monete dalla riserva\n- Colpo di scena: Il Leader sceglie tra: - Guadagnare personalmente 7 MONETE - Ognuno ottiene 4 MONETE\n\n_Che mangino brioche!_"
    },
    {
      "id": "e11",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Corsa al riarmo (Devo riarmarmi prima che tu ti riarmi prima che io mi riarmi prima che tu...)",
      "testo": "**Corsa al riarmo** (Evento)\n- Per risolverlo: **7 Difesa e Sicurezza + 2 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Il Leader sceglie una Carta Progetto PROVVISORIA e, se c\u2019\xE8 spazio, la rende PRINCIPALE\n\n_Devo riarmarmi prima che tu ti riarmi prima che io mi riarmi prima che tu..._\n\n---\n**Corsa al riarmo / Problemi di approvvigionamento: in quale spazio Principale va la carta?**\n\nLo spazio Principale libero lo **sceglie il Leader**.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "e12",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Problemi di approvvigionamento (Senza ricotta come la faccio la pastiera? Qualcuno pensi alla pastiera!)",
      "testo": "**Problemi di approvvigionamento** (Evento)\n- Per risolverlo: **3 Economia e Welfare + 4 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Cambio di priorit\xE0 (freccia rossa)**: il Leader pu\xF2 spostare un Principale in uno spazio Provvisorio libero, applicando l'effetto dello spazio\n- Colpo di scena: Il Leader sceglie una Carta Progetto FONDANTE e, se c\u2019\xE8 spazio, la rende PRINCIPALE\n\n_Senza ricotta come la faccio la pastiera? Qualcuno pensi alla pastiera!_\n\n---\n**Corsa al riarmo / Problemi di approvvigionamento: in quale spazio Principale va la carta?**\n\nLo spazio Principale libero lo **sceglie il Leader**.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "e13",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Forza lavoro non qualificata (\u201CMio padre non aveva poi sbagliato, a dir che un laureato, conta pi\xF9 di un cantante\u201D Cit.)",
      "testo": "**Forza lavoro non qualificata** (Evento)\n- Per risolverlo: **5 Economia e Welfare + 3 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Il Leader pu\xF2 SCAMBIARE LA POSIZIONE di 2 Carte Progetto approvate\n\n_\u201CMio padre non aveva poi sbagliato, a dir che un laureato, conta pi\xF9 di un cantante\u201D Cit._"
    },
    {
      "id": "e14",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Aumento delle disuguaglianze economiche (Se tu hai un pollo e io ho zero polli, la media \xE8 di mezzo pollo a testa. Ma io vado a letto senza cena.)",
      "testo": "**Aumento delle disuguaglianze economiche** (Evento)\n- Per risolverlo: **3 Difesa e Sicurezza + 5 Economia e Welfare**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Il Leader deve scegliere tra: - perdere personalmente 5 MONETE - SCARTARE le prime 5 carte del Mazzo Progetti\n\n_Se tu hai un pollo e io ho zero polli, la media \xE8 di mezzo pollo a testa. Ma io vado a letto senza cena._"
    },
    {
      "id": "e15",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Criminalit\xE0 in aumento (Per l\u2019ultima volta, signora, anche se promette di riportarla non pu\xF2 \u201Cprendere in prestito\u201D la carta igienica dal supermercato. \xC8 comunque furto.)",
      "testo": "**Criminalit\xE0 in aumento** (Evento)\n- Per risolverlo: **3 Difesa e Sicurezza + 2 Economia e Welfare**\n- Effetto quando risolto: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n- Colpo di scena: SCARTA il Progetto Principale approvato pi\xF9 a sinistra sul Tabellone\n\n_Per l\u2019ultima volta, signora, anche se promette di riportarla non pu\xF2 \u201Cprendere in prestito\u201D la carta igienica dal supermercato. \xC8 comunque furto._"
    },
    {
      "id": "e16",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Organizzazione dei Giochi Orbitali (Annunciata la nuova disciplina di questa edizione: Maratona di Scrolling)",
      "testo": "**Organizzazione dei Giochi Orbitali** (Evento)\n- Per risolverlo: **3 Difesa e Sicurezza + 3 Economia e Welfare + 3 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Cambio di priorit\xE0 (freccia rossa)**: il Leader pu\xF2 spostare un Principale in uno spazio Provvisorio libero, applicando l'effetto dello spazio\n- Colpo di scena: Il Leader perde 3 MONETE\n\n_Annunciata la nuova disciplina di questa edizione: Maratona di Scrolling_"
    },
    {
      "id": "e17",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Disastro climatico (Lo scioglimento dei ghiacciai \xE8 la grande vendetta dell\u2019umanit\xE0 per quello che hanno fatto al Titanic.)",
      "testo": "**Disastro climatico** (Evento)\n- Per risolverlo: **3 Difesa e Sicurezza + 3 Economia e Welfare + 5 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Soldi gratis!**: tutti prendono 4 monete dalla riserva\n- Colpo di scena: Il Leader ottiene 3 MONETE\n\n_Lo scioglimento dei ghiacciai \xE8 la grande vendetta dell\u2019umanit\xE0 per quello che hanno fatto al Titanic._"
    },
    {
      "id": "e18",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Pandemia (\u201CTranquilli, tempo una settimana e sar\xE0 tutto finito.\u201D)",
      "testo": "**Pandemia** (Evento)\n- Per risolverlo: **4 Difesa e Sicurezza + 5 Economia e Welfare + 3 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Soldi gratis!**: tutti prendono 4 monete dalla riserva\n- Colpo di scena: Tutti i giocatori perdono 3 MONETE\n\n_\u201CTranquilli, tempo una settimana e sar\xE0 tutto finito.\u201D_"
    },
    {
      "id": "e19",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Incursione militare (Oh ma guarda! Ci hanno lasciato davanti alle porte un bellissimo cavallo di legno!)",
      "testo": '**Incursione militare** (Evento)\n- Per risolverlo: **5 Difesa e Sicurezza + 4 Economia e Welfare + 3 Tecnologia e Sopravvivenza**\n- Effetto quando risolto: **Soldi gratis!**: tutti prendono 4 monete dalla riserva\n- Colpo di scena: Il Leader pu\xF2 pagare 5 monete per scegliere 2 Progetti rivelati e piazzarli tra i Provvisori, senza attivare gli Effetti Speciali delle caselle\n\n_Oh ma guarda! Ci hanno lasciato davanti alle porte un bellissimo cavallo di legno!_\n\n---\n**Incursione militare: i due Progetti piazzati attivano il proprio Effetto Speciale?**\n\n**S\xEC**: i Progetti piazzati con Incursione militare **attivano gli Effetti Speciali delle carte**. Sono esclusi solo gli effetti degli **spazi Provvisori** in cui finiscono (le "caselle" del testo della carta).\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "e20",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Primi passi (Ci serve un Bar, la prima cosa che ci serve \xE8 proprio un Bar.)",
      "testo": `**Primi passi** (Evento)
- Per risolverlo: **3 Carte Progetto qualsiasi**
- Effetto quando risolto: **Aumenta la Tensione Sociale (teschio)**: la Tensione sale di 1: si applica l'effetto della casella, poi il Leader rinnova gli Eventi o i Progetti scoperti
- Colpo di scena: La persona a sinistra dell\u2019attuale Leader diventa il nuovo Leader

_Ci serve un Bar, la prima cosa che ci serve \xE8 proprio un Bar._

---
**Primi passi / Crescita sostenuta: chi \xE8 "a sinistra" del Leader?**

**Cosa dice il regolamento:** Colpi di scena: la persona a sinistra (Primi passi) o a destra (Crescita sostenuta) del Leader diventa Leader.

**Cosa non dice:** Nulla di ambiguo al tavolo: \xE8 la persona seduta fisicamente a sinistra/destra. Nel verificatore i giocatori vanno inseriti in senso orario.

**Come lo applica questo assistente** (interpretazione, non regola ufficiale): Ordine orario: sinistra = giocatore successivo.`
    },
    {
      "id": "e21",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Crescita sostenuta (Qualcuno dovr\xE0 prendersi la briga di dare un nome a queste vie.)",
      "testo": '**Crescita sostenuta** (Evento)\n- Per risolverlo: **4 Carte Progetto qualsiasi**\n- Effetto quando risolto: **Colpo di scena (sirena)**: il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena\n- Colpo di scena: La persona a destra dell\u2019attuale Leader diventa il nuovo Leader\n\n_Qualcuno dovr\xE0 prendersi la briga di dare un nome a queste vie._\n\n---\n**Primi passi / Crescita sostenuta: chi \xE8 "a sinistra" del Leader?**\n\n**Cosa dice il regolamento:** Colpi di scena: la persona a sinistra (Primi passi) o a destra (Crescita sostenuta) del Leader diventa Leader.\n\n**Cosa non dice:** Nulla di ambiguo al tavolo: \xE8 la persona seduta fisicamente a sinistra/destra. Nel verificatore i giocatori vanno inseriti in senso orario.\n\n**Come lo applica questo assistente** (interpretazione, non regola ufficiale): Ordine orario: sinistra = giocatore successivo.'
    },
    {
      "id": "e22",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Cantiere aperto (I vecchietti che guardano stanno diventando un problema.)",
      "testo": "**Cantiere aperto** (Evento)\n- Per risolverlo: **5 Carte Progetto qualsiasi**\n- Effetto quando risolto: nessuno\n- Colpo di scena: Aggiungi subito questa Carta Evento agli Eventi Risolti\n\n_I vecchietti che guardano stanno diventando un problema._\n\n---\n**Cantiere aperto finito tra gli Eventi Risolti col Colpo di scena: conta per la vittoria?**\n\n**S\xEC**: Cantiere aperto finito tra gli Eventi Risolti con il suo Colpo di scena **conta a tutti gli effetti**, sia per la vittoria al quinto Evento risolto sia per i punti dei Grandi Pensatori.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "e23",
      "kind": "event",
      "tipo": "Evento",
      "nome": "Metropolis! (Tentacolare, caotica, viva! Se avesse il mare sarebbe una piccola Bari.)",
      "testo": "**Metropolis!** (Evento)\n- Per risolverlo: **6 Carte Progetto qualsiasi**\n- Effetto quando risolto: **Soldi gratis!**: tutti prendono 4 monete dalla riserva\n- Colpo di scena: Il Leader pu\xF2 scartare un Progetto Fondante approvato per risolvere un Evento rivelato a sua scelta\n\n_Tentacolare, caotica, viva! Se avesse il mare sarebbe una piccola Bari._\n\n---\n**Metropolis!: l'Evento risolto scartando un Fondante attiva il suo effetto?**\n\n**S\xEC**: l'Evento risolto con Metropolis! \xE8 risolto **a tutti gli effetti** e il suo effetto si attiva.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "t01",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Maynard Keynes, Lo scavatore di buche",
      "testo": "**Maynard Keynes**, Lo scavatore di buche\nObiettivo: 4 PV per ogni progetto approvato con costo superiore a 8\n\nProgetti che contano (11): Universit\xE0 private (9), Polo industriale (10), Reddito di base universale (10), Sistema pensionistico privato (12), Sviluppo di una rete elettrica capillare (10), Piano di difesa anti-crisi (10), Satelliti militari (10), Artiglieria di difesa orbitale (12), Centri di detenzione extra-territoriali (9), Richiesta di salvataggio interplanetario (12), Istituzione dell'alleanza M.O.R.T.O. (10). Conta il costo stampato, non quanto \xE8 stato offerto. Valgono tutti gli spazi del tabellone, l'Archivio no.\n\n_Lo Stato deve sostenere la domanda economica del Paese, costi quel che costi._"
    },
    {
      "id": "t02",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Hetty Green, La campionessa dell\u2019austerity",
      "testo": "**Hetty Green**, La campionessa dell\u2019austerity\nObiettivo: 4 PV per ogni progetto approvato con costo inferiore a 5\n\nProgetti che contano (14): Corsi cittadini di artigianato (2), Contributi per asili nido aziendali (3), Rete stradale (4), Mutui garantiti dallo Stato per giovani e famiglie (4), Allevamenti intensivi (2), Wifi-pubblico e diffuso (1), Selezione ottimizzata delle sementi (2), Efficientamento delle batterie per auto elettriche (2), Centrale a carbone statale (4), Agricoltura idroponica domestica (2), Societ\xE0 di spionaggio (4), Caserme di polizia (3), Corsi di peacekeeping (1), Sistema di sorveglianza biometrica (4). Conta il costo stampato, non quanto \xE8 stato offerto. Valgono tutti gli spazi del tabellone, l'Archivio no.\n\n_Il denaro risparmiato \xE8 denaro guadagnato!_"
    },
    {
      "id": "t03",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Amrita Devi Bishnoi, L\u2019ambientalista",
      "testo": "**Amrita Devi Bishnoi**, L\u2019ambientalista\nObiettivo: Per ogni progetto approvato con la coppia **Preservazione + Pubblico** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **11 Progetti** con Preservazione + Pubblico: Corsi cittadini di artigianato, Reddito di base universale, Aumento delle pensioni pubbliche, Mutui garantiti dallo Stato per giovani e famiglie, Potenziamento energie rinnovabili, Ricerca sulla fusione nucleare, Piano di difesa anti-crisi, Programmi di addestramento militare cittadino, Richiesta di salvataggio interplanetario, Corsi di peacekeeping, Istituzione dell'alleanza M.O.R.T.O..\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_La Terra \xE8 una responsabilit\xE0 di tutte le anime che la abitano._"
    },
    {
      "id": "t04",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Henry David Thoreau, Il responsabile",
      "testo": "**Henry David Thoreau**, Il responsabile\nObiettivo: Per ogni progetto approvato con la coppia **Preservazione + Privato** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **8 Progetti** con Preservazione + Privato: Contributi per asili nido aziendali, Universit\xE0 private, Digitalizzazione delle imprese, Cooperative economiche, Sistema pensionistico privato, Selezione ottimizzata delle sementi, Agricoltura idroponica domestica, Societ\xE0 di spionaggio.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_\u201COgni creatura \xE8 meglio viva che morta, e chi lo capisce preferir\xE0 preservarne la vita che distruggerla.\u201D_"
    },
    {
      "id": "t05",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Mansa Musa, Il capitalista",
      "testo": "**Mansa Musa**, Il capitalista\nObiettivo: Per ogni progetto approvato con la coppia **Consumo + Privato** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **12 Progetti** con Consumo + Privato: Polo industriale, Istituzione di una borsa finanziaria, Banca di microcredito, Sviluppo di una rete elettrica capillare, Costruzione data center per lo sviluppo dell'AI, Allevamenti intensivi, Efficientamento delle batterie per auto elettriche, Computer quantistici, Satelliti militari, Centri di detenzione extra-territoriali, Ricerca di armi high-tech, Sistema di sorveglianza biometrica.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_Una carovana d\u2019oro che attraversa il Sahara. Questo far\xE0 la storia dell\u2019Impero del Mali._"
    },
    {
      "id": "t06",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Karl Marx, Il comunista",
      "testo": "**Karl Marx**, Il comunista\nObiettivo: Per ogni progetto approvato con la coppia **Consumo + Pubblico** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **8 Progetti** con Consumo + Pubblico: Rete stradale, Wifi-pubblico e diffuso, Centrale a carbone statale, Pozzi petroliferi statali, Centri di ricerca di nuovi medicinali, Controllo delle frontiere, Artiglieria di difesa orbitale, Caserme di polizia.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_Che i mezzi di produzione tornino nelle mani del popolo!_"
    },
    {
      "id": "t07",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Giacomo Matteotti, Il leader dell\u2019opposizione",
      "testo": "**Giacomo Matteotti**, Il leader dell\u2019opposizione\nObiettivo: Conta il numero di carte nel mazzo progetti. Ottieni: 20 PV se ha 3 carte o meno, 15 PV se \xE8 minore di 10, 10 PV se \xE8 minore di 15\n\nSi contano solo le carte del mazzo coperto, non i 4 Progetti scoperti. Hai interesse a far scartare carte.\n\n_Ora basta, tutti fuori dal Parlamento!_\n\n---\n**Matteotti: quali carte si contano?**\n\nSi contano **solo le carte del mazzo coperto** dei Progetti, non le 4 scoperte.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    },
    {
      "id": "t08",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Marie Sk\u0142odowska Curie, La scienziata",
      "testo": "**Marie Sk\u0142odowska Curie**, La scienziata\nObiettivo: 3 PV per ogni progetto approvato con un effetto speciale\n\nNel mazzo ci sono 23 Progetti con effetto speciale.\n\n_A volte anche gli atomi possono avere un Effetto Speciale: meglio saperli distinguere._"
    },
    {
      "id": "t09",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Le Corbusier, Il funzionalista",
      "testo": "**Le Corbusier**, Il funzionalista\nObiettivo: 4 PV per ogni progetto approvato senza effetti speciali\n\nNel mazzo ci sono 16 Progetti senza effetto speciale.\n\n_Non voglio vedere nemmeno un orpello, un arco o una spirale su quell\u2019ospedale._"
    },
    {
      "id": "t10",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Quinto Orazio Flacco, L\u2019equilibrato",
      "testo": "**Quinto Orazio Flacco**, L\u2019equilibrato\nObiettivo: 4 PV per ogni progetto approvato con costo 5, 6, 7 o 8\n\nProgetti che contano (14): Digitalizzazione delle imprese (7), Cooperative economiche (8), Istituzione di una borsa finanziaria (5), Aumento delle pensioni pubbliche (6), Banca di microcredito (7), Potenziamento energie rinnovabili (7), Costruzione data center per lo sviluppo dell'AI (8), Ricerca sulla fusione nucleare (8), Pozzi petroliferi statali (6), Centri di ricerca di nuovi medicinali (7), Computer quantistici (5), Controllo delle frontiere (6), Programmi di addestramento militare cittadino (6), Ricerca di armi high-tech (7). Conta il costo stampato, non quanto \xE8 stato offerto. Valgono tutti gli spazi del tabellone, l'Archivio no.\n\n_\u201CChiunque l\u2019aurea via di mezzo predilige, al sicuro sta lontano dallo squallore.\u201D Ode X, Libro II_"
    },
    {
      "id": "t11",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Friedrich Nietzsche, Il rigeneratore",
      "testo": "**Friedrich Nietzsche**, Il rigeneratore\nObiettivo: Conta il numero di progetti approvati. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n\nContano i Progetti sul tabellone (non l'Archivio). Meno ne approvate, pi\xF9 punti fai: con 9 o pi\xF9 fai 0.\n\n_\u201CSempre distrugge chi \xE8 costretto a creare.\u201D Cos\xEC parl\xF2 Zarathustra_"
    },
    {
      "id": "t12",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Imhotep, Il grande costruttore",
      "testo": "**Imhotep**, Il grande costruttore\nObiettivo: 4 PV per ogni progetto approvato oltre il quinto\n\n_Per passare alla storia bisogna costruire, costruire e ancora costruire._"
    },
    {
      "id": "t13",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Michelangelo, L\u2019artista",
      "testo": '**Michelangelo**, L\u2019artista\nObiettivo: 3 PV per ogni progetto approvato con costo differente dagli altri\n\nSi conta **un Progetto per ogni costo distinto** (decisione ufficiale di Factanza): con costi 2, 2, 5 e 7 valgono 3 Progetti, 9 PV.\n\n_\u201COgni blocco di pietra ha una statua al suo interno, ed \xE8 compito dello scultore scoprirla.\u201D_\n\n---\n**Michelangelo: "costo DIFFERENTE dagli altri"**\n\nSi conta **un Progetto per ogni costo distinto** tra i Progetti approvati. Esempio: con costi 2, 2, 5 e 7 i costi distinti sono 3 (2, 5 e 7), quindi **9 PV**. Due Progetti con lo stesso costo valgono 3 PV una volta sola.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._'
    },
    {
      "id": "t14",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Bartolina Sisa Vargas, L\u2019indigena",
      "testo": "**Bartolina Sisa Vargas**, L\u2019indigena\nObiettivo: Per ogni progetto approvato con la coppia **Preservazione + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **9 Progetti** con Preservazione + Tradizione: Contributi per asili nido aziendali, Universit\xE0 private, Cooperative economiche, Sistema pensionistico privato, Aumento delle pensioni pubbliche, Selezione ottimizzata delle sementi, Societ\xE0 di spionaggio, Programmi di addestramento militare cittadino, Corsi di peacekeeping.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_C\u2019\xE8 solo da imparare dalle voci indigene._"
    },
    {
      "id": "t15",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "James Watt, L\u2019ingegnere",
      "testo": "**James Watt**, L\u2019ingegnere\nObiettivo: Per ogni progetto approvato con la coppia **Consumo + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **10 Progetti** con Consumo + Innovazione: Istituzione di una borsa finanziaria, Banca di microcredito, Costruzione data center per lo sviluppo dell'AI, Efficientamento delle batterie per auto elettriche, Centri di ricerca di nuovi medicinali, Computer quantistici, Satelliti militari, Artiglieria di difesa orbitale, Ricerca di armi high-tech, Sistema di sorveglianza biometrica.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_Se avessi chiesto alle persone cosa volevano, mi avrebbero detto \u201Ccavalli pi\xF9 veloci\u201D._"
    },
    {
      "id": "t16",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Gregor Mendel, Il visionario",
      "testo": "**Gregor Mendel**, Il visionario\nObiettivo: Per ogni progetto approvato con la coppia **Preservazione + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **10 Progetti** con Preservazione + Innovazione: Corsi cittadini di artigianato, Digitalizzazione delle imprese, Reddito di base universale, Mutui garantiti dallo Stato per giovani e famiglie, Potenziamento energie rinnovabili, Ricerca sulla fusione nucleare, Agricoltura idroponica domestica, Piano di difesa anti-crisi, Richiesta di salvataggio interplanetario, Istituzione dell'alleanza M.O.R.T.O..\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_\u201CLe forze della Natura agiscono secondo una segreta armonia, che \xE8 compito dell\u2019uomo scoprire.\u201D_"
    },
    {
      "id": "t17",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "A\u1E2B\u0101\u1E2B\u0101, La mercante",
      "testo": "**A\u1E2B\u0101\u1E2B\u0101**, La mercante\nObiettivo: Per ogni progetto approvato con la coppia **Consumo + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **10 Progetti** con Consumo + Tradizione: Rete stradale, Polo industriale, Sviluppo di una rete elettrica capillare, Allevamenti intensivi, Wifi-pubblico e diffuso, Centrale a carbone statale, Pozzi petroliferi statali, Controllo delle frontiere, Caserme di polizia, Centri di detenzione extra-territoriali.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_Il mestiere pi\xF9 antico del mondo? La mercante._"
    },
    {
      "id": "t18",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Margaret Thatcher, La conservatrice",
      "testo": "**Margaret Thatcher**, La conservatrice\nObiettivo: Per ogni progetto approvato con la coppia **Privato + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **10 Progetti** con Privato + Tradizione: Contributi per asili nido aziendali, Universit\xE0 private, Polo industriale, Cooperative economiche, Sistema pensionistico privato, Sviluppo di una rete elettrica capillare, Allevamenti intensivi, Selezione ottimizzata delle sementi, Societ\xE0 di spionaggio, Centri di detenzione extra-territoriali.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_C\u2019\xE8 chi l\u2019ha amata e chi l\u2019ha odiata. Alla Lady di Ferro questo non importava._"
    },
    {
      "id": "t19",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Pio IX, Il Papa",
      "testo": "**Pio IX**, Il Papa\nObiettivo: Per ogni progetto approvato con la coppia **Pubblico + Tradizione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **9 Progetti** con Pubblico + Tradizione: Rete stradale, Aumento delle pensioni pubbliche, Wifi-pubblico e diffuso, Centrale a carbone statale, Pozzi petroliferi statali, Controllo delle frontiere, Caserme di polizia, Programmi di addestramento militare cittadino, Corsi di peacekeeping.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_L\u2019istituzione pi\xF9 antica del mondo \xE8 sopravvissuta nei millenni per un motivo._"
    },
    {
      "id": "t20",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Leonardo da Vinci, L\u2019inventore",
      "testo": "**Leonardo da Vinci**, L\u2019inventore\nObiettivo: Per ogni progetto approvato con la coppia **Privato + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **10 Progetti** con Privato + Innovazione: Digitalizzazione delle imprese, Istituzione di una borsa finanziaria, Banca di microcredito, Costruzione data center per lo sviluppo dell'AI, Efficientamento delle batterie per auto elettriche, Agricoltura idroponica domestica, Computer quantistici, Satelliti militari, Ricerca di armi high-tech, Sistema di sorveglianza biometrica.\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_Il genio che ha stabilito per i posteri le vette dell\u2019ingegno umano._"
    },
    {
      "id": "t21",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Toussaint Louverture, Il rivoluzionario",
      "testo": "**Toussaint Louverture**, Il rivoluzionario\nObiettivo: Per ogni progetto approvato con la coppia **Pubblico + Innovazione** ottieni: 3 PV se \xE8 principale, 6 PV se \xE8 fondante\n\nNel mazzo ci sono **10 Progetti** con Pubblico + Innovazione: Corsi cittadini di artigianato, Reddito di base universale, Mutui garantiti dallo Stato per giovani e famiglie, Potenziamento energie rinnovabili, Ricerca sulla fusione nucleare, Centri di ricerca di nuovi medicinali, Piano di difesa anti-crisi, Artiglieria di difesa orbitale, Richiesta di salvataggio interplanetario, Istituzione dell'alleanza M.O.R.T.O..\nRicorda: 3 PV se Principale, 6 PV se Fondante, 0 PV se Provvisorio o in Archivio.\n\n_Non puoi cambiare il mondo se non hai un sogno abbastanza grande._"
    },
    {
      "id": "t22",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Buddha, Il distaccato",
      "testo": '**Buddha**, Il distaccato\nObiettivo: Conta le icone Economia tra gli eventi risolti. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n\nSi sommano le icone **Economia e Welfare** richieste dagli Eventi risolti: "minore di" \xE8 stretto (6 non \xE8 minore di 6). Conviene risolvere Eventi che ne chiedono poche. Eventi che ne richiedono: Costo della vita in aumento 5, Inverno demografico 7, Esplode la disoccupazione 9, Problemi di approvvigionamento 3, Forza lavoro non qualificata 5, Aumento delle disuguaglianze economiche 5, Criminalit\xE0 in aumento 2, Organizzazione dei Giochi Orbitali 3, Disastro climatico 3, Pandemia 5, Incursione militare 4.\n\n_\u201CSii libero da ogni attaccamento e da ogni timore. \xC8 la via per superare la miseria del nascere e del morire.\u201D_'
    },
    {
      "id": "t23",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Mahatma Gandhi, Il pacifista",
      "testo": '**Mahatma Gandhi**, Il pacifista\nObiettivo: Conta le icone Difesa tra gli eventi risolti. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n\nSi sommano le icone **Difesa e Sicurezza** richieste dagli Eventi risolti: "minore di" \xE8 stretto (6 non \xE8 minore di 6). Conviene risolvere Eventi che ne chiedono poche. Eventi che ne richiedono: Incidente diplomatico 5, Disordini lungo i confini 6, Guerra civile 9, Proteste popolari per la mancanza di risorse 5, Corsa al riarmo 7, Aumento delle disuguaglianze economiche 3, Criminalit\xE0 in aumento 3, Organizzazione dei Giochi Orbitali 3, Disastro climatico 3, Pandemia 4, Incursione militare 5.\n\n_\u201CUn uomo pu\xF2 uccidere un fiore, due fiori, tre... ma non pu\xF2 contenere la Primavera.\u201D_'
    },
    {
      "id": "t24",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "William Morris, L\u2019artigiano",
      "testo": '**William Morris**, L\u2019artigiano\nObiettivo: Conta le icone Tecnologia tra gli eventi risolti. Ottieni: 20 PV se \xE8 minore di 4, 15 PV se \xE8 minore di 6, 7 PV se \xE8 minore di 9\n\nSi sommano le icone **Tecnologia e Sopravvivenza** richieste dagli Eventi risolti: "minore di" \xE8 stretto (6 non \xE8 minore di 6). Conviene risolvere Eventi che ne chiedono poche. Eventi che ne richiedono: Blackout frequenti 5, Mancanza di produttivit\xE0 7, Organizzazione di un\u2019Esposizione Universale 8, Proteste popolari per la mancanza di risorse 5, Corsa al riarmo 2, Problemi di approvvigionamento 4, Forza lavoro non qualificata 3, Organizzazione dei Giochi Orbitali 3, Disastro climatico 5, Pandemia 3, Incursione militare 3.\n\n_Se fosse vivo oggi, non apprezzerebbe molto l\u2019IA generativa._'
    },
    {
      "id": "t25",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Sun Tzu, Lo stratega",
      "testo": "**Sun Tzu**, Lo stratega\nObiettivo: 2 PV per ogni progetto nell\u2019archivio\n\n_\u201CTutti possono vedere la mie tattiche, nessuno pu\xF2 conoscere la mia strategia.\u201D L\u2019arte della guerra_"
    },
    {
      "id": "t26",
      "kind": "thinker",
      "tipo": "Grande Pensatore",
      "nome": "Asso della Diplomazia",
      "testo": "**Asso della Diplomazia**\nObiettivo: Controlla la casella su cui si trova il segnalino della Tensione Sociale. Ottieni: 25 PV se \xE8 al punto di partenza o nelle prime 2, 15 PV se \xE8 nella 3\xAA o nella 4\xAA, 6 PV se \xE8 nella 5\xAA o nella 6\xAA\n\nLa casella 0 \xE8 la partenza. Pi\xF9 la societ\xE0 resta tranquilla, pi\xF9 punti fai. Vale l'obiettivo stampato sulla carta (decisione ufficiale di Factanza).\n\n---\n**Asso della Diplomazia: carta da personalizzare o obiettivo sulla Tensione?**\n\nVale l'**obiettivo stampato** sulla carta, basato sulla casella della Tensione Sociale: 25 PV dalla partenza alla casella 2, 15 PV nelle caselle 3-4, 6 PV nelle caselle 5-6. Il regolamento (pag. 8) la descrive come la carta senza nome n\xE9 illustrazione, fatta per essere personalizzata: per i punti vale comunque l'obiettivo stampato.\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._"
    }
  ]
};

// supabase/functions/_shared/haiku.js
var MODEL = "claude-haiku-5-5";
var PREZZI = { input: 0.1, cacheWrite5m: 0.125, cacheRead: 0.01, output: 0.5 };
function costUSD(usage) {
  if (!usage) return 0;
  return ((usage.input_tokens || 0) * PREZZI.input + (usage.cache_creation_input_tokens || 0) * PREZZI.cacheWrite5m + (usage.cache_read_input_tokens || 0) * PREZZI.cacheRead + (usage.output_tokens || 0) * PREZZI.output) / 1e6;
}
var FOCUS = {
  project: ["costo", "risorsa", "effetto", "ideologie", "pensatori", "tutto"],
  event: ["requisiti", "colpo", "effetto", "tutto"],
  thinker: ["obiettivo", "tutto"]
};
function catalogText(catalog) {
  const voci = catalog.voci.map((v) => `${v.id} | ${v.titolo}${v.indizi ? ` | ${v.indizi}` : ""}`).join("\n");
  const carte = catalog.carte.map((c) => `${c.id} | ${c.tipo} | ${c.nome}`).join("\n");
  return `VOCI DEL REGOLAMENTO (id | titolo | indizi):
${voci}

CARTE (id | tipo | nome):
${carte}`;
}
var ISTRUZIONI = `Sei il motore di ricerca dell'assistente alle regole del gioco da tavolo "The Social Contract" (Factanza).
Non rispondi mai alla domanda: scegli quali voci del catalogo la rispondono. Le risposte le scrive gi\xE0 l'assistente, gi\xE0 verificate.

Regole:
- Restituisci da 1 a 3 proposte, la pi\xF9 pertinente per prima. Usa solo id presenti nel catalogo.
- Una carta va proposta solo se la domanda la nomina o la descrive (anche con un soprannome, un refuso o il testo umoristico della carta). Per una carta indica anche il focus:
  Progetto: costo | risorsa | effetto | ideologie | pensatori (a quali Grandi Pensatori conviene) | tutto
  Evento: requisiti (come si risolve) | colpo (Colpo di scena) | effetto (cosa succede quando lo risolvi) | tutto
  Pensatore: obiettivo (come fa punti) | tutto
- Le voci che iniziano con un caso aperto (il regolamento non lo risolve) vanno proposte quando la domanda tocca proprio quel dubbio.
- Le voci bot-info, acquisto, varianti, eta, strategia, pezzi-persi sono risposte oneste a domande che il regolamento non copre: proponile quando la domanda \xE8 su quei temi.
- Se la domanda non riguarda il gioco, metti fuori_tema a true e proposte vuote. Se riguarda il gioco ma nessuna voce la risponde, metti fuori_tema a false e proposte vuote.
- I giocatori scrivono in modo informale: "gettone di chi comanda" = segnalino Leader, "fila di mezzo" = Progetti Principali, "termometro" = Tensione Sociale, "carte con le persone famose" = Grandi Pensatori.`;
function outputSchema(catalog) {
  return {
    type: "object",
    properties: {
      fuori_tema: { type: "boolean" },
      proposte: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: [...catalog.voci.map((v) => v.id), ...catalog.carte.map((c) => c.id)] },
            focus: { type: "string", enum: ["nessuno", ...new Set(Object.values(FOCUS).flat())] }
          },
          required: ["id", "focus"],
          additionalProperties: false
        }
      }
    },
    required: ["fuori_tema", "proposte"],
    additionalProperties: false
  };
}
function toKeys(parsed, catalog) {
  const voci = new Set(catalog.voci.map((v) => v.id));
  const carte = new Map(catalog.carte.map((c) => [c.id, c]));
  const keys = [];
  for (const p of parsed?.proposte || []) {
    let k = null;
    if (voci.has(p.id)) k = p.id;
    else if (carte.has(p.id)) {
      const kind = carte.get(p.id).kind;
      const f = FOCUS[kind].includes(p.focus) ? p.focus : "tutto";
      k = `carta:${p.id}:${f}`;
    }
    if (k && !keys.includes(k)) keys.push(k);
    if (keys.length === 3) break;
  }
  return keys;
}
async function aiPropose(client2, catalog, domanda) {
  const t0 = Date.now();
  const response = await client2.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: { effort: "low", format: { type: "json_schema", schema: outputSchema(catalog) } },
    system: [
      { type: "text", text: ISTRUZIONI },
      { type: "text", text: catalogText(catalog), cache_control: { type: "ephemeral" } }
    ],
    messages: [{ role: "user", content: String(domanda).slice(0, 300) }]
  });
  const ms = Date.now() - t0;
  const usage = response.usage;
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    return { keys: [], fuoriTema: false, usage, costo: costUSD(usage), ms, stop: response.stop_reason };
  }
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { keys: toKeys(parsed, catalog), fuoriTema: !!parsed?.fuori_tema, usage, costo: costUSD(usage), ms, stop: response.stop_reason };
}
var ISTRUZIONI_RISPOSTA = `Sei Patto, l'assistente alle regole del gioco da tavolo "The Social Contract" (Factanza).
Rispondi alle domande dei giocatori usando SOLO i testi ufficiali qui sotto (sezione REGOLAMENTO). Sono l'unica fonte: non usare quello che sai di altri giochi, non inventare regole, numeri, carte o eccezioni.

Come rispondere:
- Rispondi nel merito, in italiano, in 1-4 frasi brevi, dando del tu. Vai dritto al punto: prima la risposta (s\xEC/no, il numero, chi lo fa), poi il minimo di spiegazione.
- Puoi usare **grassetto** per i termini del gioco. Niente titoli, niente elenchi lunghi, niente emoji.
- Non citare id, "catalogo", "voci" o "testi forniti": parla del regolamento e delle carte.
- Scrivi solo quello che i testi dicono. Non aggiungere conseguenze, eccezioni o casi limite che non sono scritti: se un testo non lo dice, non parlarne.
- Non fare deduzioni a catena ("quindi\u2026", "di conseguenza\u2026") oltre a quello che il testo dice. Quando un testo usa un'espressione precisa (per esempio "il Leader attuale"), riportala con le stesse parole invece di interpretarla.
- Se la domanda tocca un caso che il regolamento non risolve (le voci "[caso aperto]"), dillo chiaramente: il regolamento ufficiale non lo chiarisce. Se la voce ha "Come lo applica questo assistente", puoi riportarlo, dicendo esplicitamente che \xE8 l'interpretazione dell'assistente e non una regola ufficiale. Non presentarlo mai come regola.
- Le voci "[decisione ufficiale]" sono regole ufficiali decise da Factanza dove il regolamento stampato non era chiaro: presentale come regola, e puoi dire che \xE8 una precisazione ufficiale di Factanza. Se una di queste voci dice che una parte \xE8 interpretazione dell'assistente, riporta quella parte come tale.
- Se la domanda chiede un calcolo con numeri precisi (offerte, costi, punti), spiega la regola che si applica: il conto lo fa lo strumento del bot.
- In "fonti" metti da 1 a 3 voci o carte da cui hai preso la risposta, la pi\xF9 importante per prima, con il focus giusto per le carte.

Quando non rispondere:
- Se la domanda riguarda il gioco ma i testi non contengono la risposta, metti trovata a false e risposta vuota. Meglio nessuna risposta che una risposta incerta.
- Se la domanda non riguarda il gioco, metti fuori_tema a true, trovata a false e risposta vuota.

I giocatori scrivono in modo informale: "gettone di chi comanda" = segnalino Leader, "fila di mezzo" = Progetti Principali, "termometro" = Tensione Sociale, "carte con le persone famose" = Grandi Pensatori.`;
function regolamentoText(catalog) {
  const voci = catalog.voci.map((v) => `### ${v.id} \xB7 ${v.titolo}
${v.testo || ""}`).join("\n\n");
  const carte = catalog.carte.map((c) => `### ${c.id} \xB7 ${c.tipo} \xB7 ${c.nome}
${c.testo || ""}`).join("\n\n");
  return `REGOLAMENTO: VOCI

${voci}

REGOLAMENTO: CARTE

${carte}`;
}
function rispostaSchema(catalog) {
  const fonti = outputSchema(catalog).properties.proposte;
  return {
    type: "object",
    properties: { fuori_tema: { type: "boolean" }, trovata: { type: "boolean" }, risposta: { type: "string" }, fonti },
    required: ["fuori_tema", "trovata", "risposta", "fonti"],
    additionalProperties: false
  };
}
async function aiRispondi(client2, catalog, domanda, { effort = "medium" } = {}) {
  const t0 = Date.now();
  const response = await client2.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort, format: { type: "json_schema", schema: rispostaSchema(catalog) } },
    system: [
      { type: "text", text: ISTRUZIONI_RISPOSTA },
      { type: "text", text: regolamentoText(catalog), cache_control: { type: "ephemeral" } }
    ],
    messages: [{ role: "user", content: String(domanda).slice(0, 300) }]
  });
  const ms = Date.now() - t0;
  const usage = response.usage;
  const vuota = { risposta: "", trovata: false, fuoriTema: false, keys: [], usage, costo: costUSD(usage), ms, stop: response.stop_reason };
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return vuota;
  let parsed = null;
  try {
    parsed = JSON.parse(response.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
  } catch {
    return vuota;
  }
  const keys = toKeys({ proposte: parsed?.fonti }, catalog);
  const risposta = String(parsed?.risposta || "").trim().slice(0, 1200);
  const trovata = !!parsed?.trovata && !!risposta && keys.length > 0;
  return { ...vuota, risposta: trovata ? risposta : "", trovata, fuoriTema: !!parsed?.fuori_tema, keys };
}

// supabase/functions/_shared/ponte.js
var json = (body, status, cors) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
function corsHeaders(request, origini) {
  const origin = request.headers.get("Origin") || "";
  if (!origini.includes(origin)) return null;
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
}
async function hashIp(sale, ip) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${sale}:${ip}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function configDa(get) {
  return {
    origini: (get("ORIGINI") || "").split(",").map((s) => s.trim()).filter(Boolean),
    limiteMensileUsd: Number(get("LIMITE_MENSILE_USD") || 5),
    // Tarati per Lucca Comics: molte persone escono dallo stesso IP (Wi-Fi della fiera, reti mobili con
    // IP condiviso), quindi il limite per IP è alto; il tetto alla spesa lo fanno il totale orario e il mese.
    limiteOrario: Number(get("LIMITE_ORARIO") || 200),
    limiteTotaleOrario: Number(get("LIMITE_TOTALE_ORARIO") || 1e3),
    sale: get("SALE") || "tsc"
  };
}
function seContatoriGiu(errore, cors) {
  return json({ errore: "contatori-non-disponibili" }, 503, cors);
}
async function handlePonte(request, cfg2, { store: store2, client: client2, catalog, ip = "sconosciuto", now = /* @__PURE__ */ new Date() }) {
  const cors = corsHeaders(request, cfg2.origini);
  if (!cors) return new Response("Origine non consentita", { status: 403 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const percorso = new URL(request.url).pathname;
  const azione = percorso.endsWith("/rispondi") ? "rispondi" : percorso.endsWith("/segnala") ? "segnala" : percorso.endsWith("/proponi") ? "proponi" : null;
  if (request.method !== "POST" || !azione) return json({ errore: "non-trovato" }, 404, cors);
  let domanda = "";
  try {
    const raw = await request.text();
    if (raw.length > 2e3) return json({ errore: "richiesta-troppo-lunga" }, 413, cors);
    domanda = String(JSON.parse(raw).domanda || "").trim().slice(0, 300);
  } catch {
    return json({ errore: "richiesta-non-valida" }, 400, cors);
  }
  if (!domanda) return json({ errore: "domanda-vuota" }, 400, cors);
  if (azione === "segnala") {
    if (!store2.segnala) return json({ errore: "segnalazioni-non-attive" }, 501, cors);
    try {
      const esito2 = await store2.segnala({ ip: await hashIp(cfg2.sale, ip), domanda });
      return esito2 === "ok" ? json({ ok: true }, 200, cors) : json({ errore: esito2 }, 429, cors);
    } catch {
      return json({ errore: "segnalazione-non-salvata" }, 503, cors);
    }
  }
  const mese = now.toISOString().slice(0, 7);
  const ora = now.toISOString().slice(0, 13);
  let esito;
  try {
    esito = await store2.prenota({
      mese,
      ora,
      ip: await hashIp(cfg2.sale, ip),
      limiteMicro: Math.round(cfg2.limiteMensileUsd * 1e6),
      limiteOrario: cfg2.limiteOrario,
      limiteTotale: cfg2.limiteTotaleOrario
    });
  } catch (e) {
    const stop = seContatoriGiu(e, cors);
    if (stop) return stop;
    esito = "ok";
  }
  if (esito !== "ok") return json({ errore: esito }, 429, cors);
  let r;
  try {
    r = await (azione === "rispondi" ? aiRispondi : aiPropose)(client2, catalog, domanda);
  } catch {
    return json({ errore: "ai-non-disponibile" }, 502, cors);
  }
  try {
    await store2.addebita(mese, Math.round(r.costo * 1e6));
  } catch {
  }
  if (azione === "rispondi") return json({ risposta: r.risposta, trovata: r.trovata, fuori_tema: r.fuoriTema, proposte: r.keys }, 200, cors);
  return json({ proposte: r.keys, fuori_tema: r.fuoriTema }, 200, cors);
}

// supabase/functions/proponi/index.js
var env = (k) => Deno.env.get(k);
var cfg = configDa(env);
var client = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY") });
function chiaveServizio() {
  if (env("SUPABASE_SERVICE_ROLE_KEY")) return env("SUPABASE_SERVICE_ROLE_KEY");
  try {
    return JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}").default;
  } catch {
    return void 0;
  }
}
async function rpc(nome, args) {
  const key = chiaveServizio();
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key?.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const r = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/${nome}`, { method: "POST", headers, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`rpc ${nome}: HTTP ${r.status}`);
  return r.status === 204 ? null : r.json();
}
var store = {
  prenota: ({ mese, ora, ip, limiteMicro, limiteOrario, limiteTotale }) => rpc("bot_prenota", { p_mese: mese, p_ora: ora, p_ip: ip, p_limite_micro: limiteMicro, p_limite_orario: limiteOrario, p_limite_totale: limiteTotale }),
  addebita: (mese, micro) => rpc("bot_addebita", { p_mese: mese, p_micro: micro }),
  segnala: ({ ip, domanda }) => rpc("bot_segnala", { p_ip: ip, p_domanda: domanda })
};
var ipDi = (request) => (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "sconosciuto";
Deno.serve((request) => handlePonte(request, cfg, { store, client, catalog: catalog_default, ip: ipDi(request), now: /* @__PURE__ */ new Date() }));
