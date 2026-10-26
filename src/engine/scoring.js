// Punteggio finale dei Grandi Pensatori (pag. 8, 19-21).
// "Approvato" = Progetto in tabellone (Fondante, Principale o Provvisorio). L'Archivio
// NON conta come approvato (pag. 11: "non sono più considerati come approvati"), ma
// conta per gli obiettivi che lo citano esplicitamente (Sun Tzu).
import { RESOURCES } from './state.js';

const ROW_LABEL = { fondanti: 'Fondante', principali: 'Principale', provvisori: 'Provvisorio' };

function cmp(op, a, b) {
  switch (op) {
    case '<': return a < b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '>=': return a >= b;
    case '==': return a === b;
    default: throw new Error(`Operatore sconosciuto ${op}`);
  }
}

// final: { approved: [{card,row}], archive: [ids], resolved: [ids], projectDeckCount, tension }
export function finalFromState(state) {
  const approved = [];
  for (const row of ['fondanti', 'principali', 'provvisori'])
    state.board[row].forEach((s) => s && approved.push({ card: s.card, row }));
  return {
    approved,
    archive: state.archive.slice(),
    resolved: state.resolved.slice(),
    projectDeckCount: state.decks.projects.length,
    tension: state.tension,
  };
}

function thresholds(value, soglie) {
  for (const s of soglie) if (cmp(s.cond, value, s.n)) return s;
  return null;
}

// Restituisce { pv, righe: [testo], dettaglio, interpretazioni: [] }
export function scoreThinker(thinker, final, db) {
  const o = thinker.obiettivo;
  const P = (id) => db.projects[id];
  const righe = [];
  const interpretazioni = [];
  let pv = 0;

  switch (o.tipo) {
    case 'per_progetto_costo': {
      let match;
      if (o.op === 'in') match = (c) => o.valore.includes(c);
      else if (o.op === 'diverso') {
        // "costo DIFFERENTE dagli altri": decisione di Factanza, un Progetto per ogni costo distinto
        // (con costi 2, 2, 5 contano un 2 e il 5). Vale il primo Progetto approvato con quel costo.
        const seen = new Set();
        match = (c) => !seen.has(c) && !!seen.add(c);
      } else match = (c) => cmp(o.op, c, o.valore);
      const ok = final.approved.filter((a) => match(P(a.card).costo));
      ok.forEach((a) => righe.push(`${P(a.card).nome} (costo ${P(a.card).costo}, ${ROW_LABEL[a.row]}): +${o.pv}`));
      pv = ok.length * o.pv;
      break;
    }
    case 'coppia_ideologica': {
      const [i1, i2] = o.ideologie;
      for (const a of final.approved) {
        const ids = Object.values(P(a.card).ideologie);
        if (!(ids.includes(i1) && ids.includes(i2))) continue;
        const v = a.row === 'fondanti' ? o.pv_fondante : a.row === 'principali' ? o.pv_principale : 0;
        righe.push(`${P(a.card).nome} (${ROW_LABEL[a.row]}): +${v}${a.row === 'provvisori' ? ' (i Provvisori non danno punti per questo obiettivo)' : ''}`);
        pv += v;
      }
      break;
    }
    case 'per_progetto_effetto': {
      const ok = final.approved.filter((a) => (P(a.card).effetto != null) === o.con_effetto);
      ok.forEach((a) => righe.push(`${P(a.card).nome}: +${o.pv}`));
      pv = ok.length * o.pv;
      break;
    }
    case 'oltre_n': {
      const n = final.approved.length;
      const extra = Math.max(0, n - o.n);
      righe.push(`${n} Progetti approvati, ${extra} oltre il ${o.n}°: ${extra} × ${o.pv}`);
      pv = extra * o.pv;
      break;
    }
    case 'soglie': {
      let value;
      if (o.conta === 'mazzo_progetti') value = final.projectDeckCount;
      else if (o.conta === 'progetti_approvati') value = final.approved.length;
      else if (o.conta === 'risorsa_eventi_risolti') {
        value = 0;
        for (const id of final.resolved) {
          const v = db.events[id].requisiti[o.risorsa] || 0;
          righe.push(`${db.events[id].nome}: ${v}`);
          value += v;
        }
      } else throw new Error(`conta sconosciuto ${o.conta}`);
      const s = thresholds(value, o.soglie);
      pv = s ? s.pv : 0;
      righe.push(`Valore contato: ${value} → ${pv} PV`);
      break;
    }
    case 'archivio': {
      pv = final.archive.length * o.pv;
      righe.push(`${final.archive.length} Progetti in Archivio × ${o.pv}`);
      break;
    }
    case 'tensione': {
      const s = o.soglie.find((x) => x.caselle.includes(final.tension));
      pv = s ? s.pv : 0;
      righe.push(`Segnalino Tensione sulla casella ${final.tension} → ${pv} PV`);
      break;
    }
    default:
      throw new Error(`Obiettivo non gestito: ${o.tipo}`);
  }
  return { thinker: thinker.id, nome: thinker.nome, pv, righe, interpretazioni };
}

export function scorePlayer(thinkerIds, final, db) {
  const parts = thinkerIds.map((id) => scoreThinker(db.thinkers[id], final, db));
  return { totale: parts.reduce((s, p) => s + p.pv, 0), parti: parts };
}

export function winners(scores) {
  const max = Math.max(...scores.map((s) => s.totale));
  return scores.map((s, i) => (s.totale === max ? i : -1)).filter((i) => i >= 0);
}

export { RESOURCES };
