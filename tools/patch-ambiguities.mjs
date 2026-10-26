// Patch una tantum del registro ambiguità con le scoperte della trascrizione.
import fs from 'node:fs';
const f = new URL('../src/kb/ambiguities.json', import.meta.url);
const d = JSON.parse(fs.readFileSync(f));
const a = d.ambiguities.find((x) => x.id === 'esempio-andrea');
a.cosa_dice = "Pag. 21: Andrea (Hetty Green + Toussaint Louverture) fa 20 PV con Hetty Green contando 5 Progetti di costo inferiore a 5, e 0 PV con Toussaint (l'unico Progetto con pubblico+innovazione, M.O.R.T.O., è Provvisorio). Il totale stampato è però \"20 PV + 12 PV = 32 PV\".";
a.cosa_non_dice = "Due errori: (1) il totale non è 32; (2) tra i Progetti di costo inferiore a 5 c'è \"Istituzione dell'alleanza M.O.R.T.O.\", che sulla carta costa 10. Con le carte reali Andrea fa 4 × 4 = 16 PV. Matteo vince comunque (22). Inoltre pag. 19 rimanda all'esempio \"a pagina 18\", ma è a pag. 20-21.";
a.interpretazione = "Refusi dell'esempio: con le carte Andrea ha 16 PV.";
const add = [
  {
    id: 'allocazione-su-carta',
    titolo: 'Icona batteria (Allocazione di Risorse) sulle Carte Progetto',
    parole: ['batteria', 'icona batteria', 'fulmine', 'allocazione di risorse carta', 'ricarica'],
    cosa_dice: 'La batteria verde con il fulmine è spiegata a pag. 14 come effetto dello spazio Provvisorio "Allocazione di Risorse": toglie i segnalini Mancanza di Risorse da tutti i Principali. La stessa icona compare su 4 Carte Progetto (Rete stradale, Digitalizzazione delle imprese, Pozzi petroliferi statali, Ricerca di armi high-tech).',
    cosa_non_dice: 'La legenda degli effetti delle Carte Progetto (pag. 9) non elenca questa icona.',
    interpretazione: 'Sulle carte ha lo stesso significato che ha sullo spazio: Allocazione di Risorse.',
    stato: 'aperta',
  },
  {
    id: 'matteotti-mazzo',
    titolo: 'Matteotti: quali carte si contano?',
    parole: ['matteotti carte mazzo', 'carte nel mazzo progetti'],
    cosa_dice: 'Si conta il numero di carte nel mazzo Progetti (pag. 8: "quante carte restano nel mazzo coperto dei Progetti").',
    cosa_non_dice: 'Nulla di ambiguo: si contano solo le carte coperte, non le 4 scoperte.',
    interpretazione: 'Solo il mazzo coperto.',
    stato: 'confermata',
  },
];
for (const x of add) if (!d.ambiguities.some((y) => y.id === x.id)) d.ambiguities.push(x);
fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
console.log(d.ambiguities.length);
