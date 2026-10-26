// Genera domande sulle carte (parafrasi, nomi parziali, minuscole, refusi) con la risposta attesa.
// Etichetta attesa: "carta:<id>:<focus>".
import { db } from '../../src/data.js';
import { rng } from '../../src/engine/state.js';

const rand = rng(2026);
const pick = (a) => a[Math.floor(rand() * a.length)];

function typo(word) {
  if (word.length < 6) return word;
  const i = 1 + Math.floor(rand() * (word.length - 2));
  const ops = [
    () => word.slice(0, i) + word.slice(i + 1), // lettera mancante
    () => word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2), // lettere invertite
    () => word.slice(0, i) + word[i] + word.slice(i), // lettera doppia
  ];
  return pick(ops)();
}

// Varianti del nome: completo, minuscolo senza accenti, parziale (parole distintive), con refuso.
function nameVariants(nome) {
  const plain = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[!’']/g, ' ').replace(/\s+/g, ' ').trim();
  const FN = new Set(['della', 'delle', 'dello', 'degli', 'nella', 'sulla', 'sulle', 'dalla', 'alla', 'alle', 'dell', 'nell', 'sull']);
  const words = plain.split(' ').filter((w) => w.length > 3 && !FN.has(w));
  const partial = words.length >= 3 ? words.slice(0, 2).join(' ') : plain;
  const longest = words.sort((a, b) => b.length - a.length)[0] || plain;
  return { full: nome, plain, partial, typo: plain.replace(longest, typo(longest)) };
}

const PROJ = {
  costo: ['quanto costa {n}?', 'qual è il costo di {n}', '{n} quante monete servono per approvarlo', 'prezzo di {n}?'],
  risorsa: ['che risorsa dà {n}?', 'quante risorse fornisce {n}', '{n} che tipo di risorsa produce'],
  effetto: ['cosa fa l\'effetto di {n}?', '{n} ha un effetto speciale?', 'che icona speciale ha {n}'],
  pensatori: ['a quali pensatori conviene {n}?', '{n} fa fare punti a chi?', 'quali obiettivi premiano {n}'],
  tutto: ['{n}', 'dimmi tutto su {n}', 'scheda di {n}'],
};
const EV = {
  requisiti: ['come si risolve {n}?', 'cosa serve per risolvere {n}', 'quante risorse servono per {n}?', '{n} cosa richiede'],
  colpo: ['qual è il colpo di scena di {n}?', 'se pesco {n} col colpo di scena cosa succede', 'colpo di scena {n}'],
  effetto: ['che effetto ha {n} quando lo risolvo?', 'cosa ottengo se risolvo {n}'],
  tutto: ['{n}', 'parlami dell\'evento {n}'],
};
const TH = {
  obiettivo: ['come fa punti {n}?', 'obiettivo di {n}', 'come si vince con {n}', 'quanti punti dà {n}'],
  tutto: ['{n}', 'chi è {n} nel gioco'],
};

export function generate() {
  const out = [];
  const add = (tpls, card, kind) => {
    for (const [focus, list] of Object.entries(tpls)) {
      const v = nameVariants(card.nome);
      const variants = focus === 'tutto' ? [v.plain] : [v.full, v.plain, v.partial, v.typo];
      // due formulazioni per ogni intento, con varianti del nome diverse
      for (let k = 0; k < Math.min(2, list.length); k++) {
        const t = list[(k + Math.floor(rand() * list.length)) % list.length];
        out.push({ q: t.replace('{n}', pick(variants)), expect: `carta:${card.id}:${focus}`, kind });
      }
    }
  };
  db.projectList.forEach((p) => add(PROJ, p, 'project'));
  db.eventList.forEach((e) => add(EV, e, 'event'));
  db.thinkerList.forEach((t) => add(TH, t, 'thinker'));
  return out;
}
