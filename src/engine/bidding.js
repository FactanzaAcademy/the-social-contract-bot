// Asta segreta, nuovo Leader, approvazione (pag. 12-13, 18).

// offers: array di monete offerte, indicizzato per giocatore.
// Restituisce l'esito completo, con la spiegazione passo per passo.
export function resolveBids({ offers, cost, currentLeader, fondanteSurcharge = 3 }) {
  if (!Array.isArray(offers) || offers.length < 2) throw new Error('Servono le offerte di almeno 2 giocatori');
  if (offers.some((o) => !Number.isInteger(o) || o < 0)) throw new Error('Le offerte devono essere numeri interi ≥ 0');
  const total = offers.reduce((a, b) => a + b, 0);
  const max = Math.max(...offers);
  const top = offers.map((o, i) => (o === max ? i : -1)).filter((i) => i >= 0);

  // pag. 13: chi offre di più diventa Leader; in caso di pareggio resta il Leader precedente,
  // anche se la sua offerta è stata superata da chi è in pareggio.
  let newLeader;
  let leaderReason;
  if (top.length === 1) {
    newLeader = top[0];
    leaderReason = newLeader === currentLeader ? 'unico_maggiore_gia_leader' : 'unico_maggiore';
  } else {
    newLeader = currentLeader;
    leaderReason = 'pareggio';
  }

  const approved = total >= cost; // pag. 13: "uguale o superiore al suo costo"
  const canFondante = approved && total >= cost + fondanteSurcharge; // pag. 13: superare di almeno 3
  return {
    total,
    cost,
    approved,
    canFondante,
    newLeader,
    leaderChanged: newLeader !== currentLeader,
    leaderReason,
    tiedPlayers: top.length > 1 ? top : [],
    maxOffer: max,
    // Se approvato le monete offerte vanno nella riserva; se fallisce restano ai giocatori (pag. 13).
    coinsToReserve: approved ? total : 0,
    tensionIncrease: approved ? 0 : 1,
  };
}

export function explainBids(r, names = []) {
  const nm = (i) => names[i] ?? `Giocatore ${i + 1}`;
  const lines = [];
  lines.push(`Totale offerto: ${r.total} monete; costo del Progetto: ${r.cost}.`);
  if (r.approved) {
    lines.push(`Il totale raggiunge il costo: il Progetto è APPROVATO (pag. 13). Tutte le ${r.total} monete offerte vanno nella riserva comune.`);
    lines.push(
      r.canFondante
        ? `Il totale supera il costo di almeno 3 (${r.total} ≥ ${r.cost + 3}): il Leader può metterlo anche in uno spazio FONDANTE, se libero (pag. 13).`
        : `Per uno spazio Fondante servivano almeno ${r.cost + 3} monete: può andare solo in uno spazio Principale o Provvisorio.`,
    );
  } else {
    lines.push(`Il totale non raggiunge il costo: il Progetto FALLISCE (pag. 18). La carta esce dal gioco, le monete restano ai giocatori e la Tensione Sociale sale di 1.`);
  }
  if (r.leaderReason === 'pareggio') {
    lines.push(`Offerta più alta (${r.maxOffer}) in pareggio tra ${r.tiedPlayers.map(nm).join(', ')}: il Leader NON cambia, resta ${nm(r.newLeader)} (pag. 13).`);
  } else if (r.leaderChanged) {
    lines.push(`${nm(r.newLeader)} ha fatto l'offerta più alta (${r.maxOffer}) e diventa subito il nuovo Leader (pag. 13).`);
  } else {
    lines.push(`${nm(r.newLeader)} ha fatto l'offerta più alta ed era già Leader: resta Leader.`);
  }
  lines.push('Il nuovo Leader viene determinato PRIMA di sapere se il Progetto passa: vale anche se il Progetto fallisce (pag. 12, passo 5 prima del passo 6).');
  return lines;
}
