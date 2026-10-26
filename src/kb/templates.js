// Risposte generate dai dati delle carte.
import { db } from '../data.js';
import { requirementText, label } from '../engine/events.js';

export const EFFECT = {
  risoluzione: { nome: 'Risoluzione Evento (!)', testo: 'il Leader, se possibile, sceglie un Evento scoperto e lo risolve' },
  soldi: { nome: 'Soldi gratis!', testo: 'tutti prendono 4 monete dalla riserva' },
  colpo: { nome: 'Colpo di scena (sirena)', testo: 'il Leader pesca 1 Evento dal mazzo e ne applica subito il Colpo di scena' },
  doppio_colpo: { nome: 'Doppio Colpo di scena (due sirene)', testo: 'il Leader pesca 2 Eventi e applica i loro Colpi di scena nell\'ordine di pesca' },
  tensione: { nome: 'Aumenta la Tensione Sociale (teschio)', testo: 'la Tensione sale di 1: si applica l\'effetto della casella, poi il Leader rinnova gli Eventi o i Progetti scoperti' },
  nuova_linea: { nome: 'Nuova linea politica (freccia verde)', testo: 'il Leader può spostare un Provvisorio in uno spazio Principale libero' },
  cambio_priorita: { nome: 'Cambio di priorità (freccia rossa)', testo: 'il Leader può spostare un Principale in uno spazio Provvisorio libero, applicando l\'effetto dello spazio' },
  allocazione: { nome: 'Allocazione di Risorse (batteria verde)', testo: 'si tolgono i segnalini Mancanza di Risorse da tutti i Principali (sulle carte l\'icona non è nella legenda di pag. 9: per decisione ufficiale di Factanza vale come lo spazio)' },
};

const IDEO = { pubblico: 'Pubblico', privato: 'Privato', preservazione: 'Preservazione', consumo: 'Consumo', innovazione: 'Innovazione', tradizione: 'Tradizione' };

export function ideologies(p) {
  return Object.values(p.ideologie).map((i) => IDEO[i]).join(' · ');
}

// Testo dell'obiettivo leggibile: segnaposto delle icone → parole, maiuscole stampate → minuscole.
export function objectiveText(t) {
  const ICON = { difesa: 'icone Difesa', economia: 'icone Economia', tecnologia: 'icone Tecnologia' };
  return (t.testo_obiettivo || '')
    .replace(/\[moneta (\d+)\]/g, '$1')
    .replace(/\[(\w+)\] \[(\w+)\]/g, (_, a, b) => `**${IDEO[a] || a} + ${IDEO[b] || b}**`)
    .replace(/\bla \[(difesa|economia|tecnologia)\]/g, (_, w) => `le ${ICON[w]}`)
    .replace(/\[(\w+)\]/g, (_, w) => ICON[w] || (IDEO[w] ? `**${IDEO[w]}**` : w))
    .replace(/segnalino \[segnalino ([^\]]+)\]/gi, 'segnalino della $1')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\b([A-ZÀ-Ù]{1,}(?:\s+[A-ZÀ-Ù]{2,})*)\b/g, (m) => (m === 'PV' || m.length === 1 && m !== 'O' ? m : m.toLowerCase()));
}

// Quali Pensatori fanno punti con questo Progetto (e a quali condizioni).
export function thinkersForProject(p) {
  const out = [];
  const ids = Object.values(p.ideologie);
  for (const t of db.thinkerList) {
    const o = t.obiettivo;
    let why = null;
    if (o.tipo === 'coppia_ideologica' && o.ideologie.every((i) => ids.includes(i))) why = `${o.pv_principale} PV se Principale, ${o.pv_fondante} se Fondante`;
    if (o.tipo === 'per_progetto_costo') {
      if (o.op === '>' && p.costo > o.valore) why = `${o.pv} PV (costo > ${o.valore})`;
      if (o.op === '<' && p.costo < o.valore) why = `${o.pv} PV (costo < ${o.valore})`;
      if (o.op === 'in' && o.valore.includes(p.costo)) why = `${o.pv} PV (costo tra 5 e 8)`;
      if (o.op === 'diverso') why = `${o.pv} PV se nessun altro Progetto approvato ha costo ${p.costo}`;
    }
    if (o.tipo === 'per_progetto_effetto' && (p.effetto != null) === o.con_effetto) why = `${o.pv} PV (${o.con_effetto ? 'ha' : 'non ha'} un effetto speciale)`;
    if (o.tipo === 'oltre_n') why = `conta come Progetto approvato (${o.pv} PV per ognuno oltre il ${o.n}°)`;
    if (o.tipo === 'archivio') why = 'se finisce in Archivio, 2 PV';
    if (why) out.push({ t, why });
  }
  return out;
}

export function projectAnswer(p, focus = 'tutto') {
  const eff = p.effetto ? EFFECT[p.effetto] : null;
  const parts = {
    costo: `**${p.nome}** costa **${p.costo} monete**: si approva se il totale delle offerte è almeno ${p.costo}. Per metterlo in uno spazio **Fondante** servono almeno **${p.costo + 3}** monete.`,
    risorsa: `**${p.nome}** fornisce **${p.risorsa.valore} ${label(p.risorsa.tipo)}**.`,
    effetto: eff
      ? `**${p.nome}** ha l'effetto **${eff.nome}**: ${eff.testo}. Si attiva appena viene piazzato, prima dell'effetto dello spazio Provvisorio.`
      : `**${p.nome}** non ha effetti speciali.`,
    ideologie: `Icone ideologiche di **${p.nome}**: ${ideologies(p)}. Non contano durante la partita, solo per i punti finali.`,
    pensatori: (() => {
      const th = thinkersForProject(p).filter((x) => x.t.obiettivo.tipo !== 'oltre_n' && x.t.obiettivo.tipo !== 'archivio');
      if (!th.length) return `Nessun Grande Pensatore premia in modo specifico **${p.nome}** (a parte quelli che contano tutti i Progetti approvati).`;
      return `**${p.nome}** fa punti per:\n${th.map((x) => `- **${x.t.nome}**: ${x.why}`).join('\n')}`;
    })(),
  };
  if (focus !== 'tutto' && parts[focus]) return parts[focus];
  return [
    `**${p.nome}**`,
    `- Costo: **${p.costo}** monete (Fondante: almeno ${p.costo + 3})`,
    `- Risorsa: **${p.risorsa.valore} ${label(p.risorsa.tipo)}**`,
    `- Icone: ${ideologies(p)}`,
    `- Effetto speciale: ${eff ? `**${eff.nome}**: ${eff.testo}` : 'nessuno'}`,
    p.flavor ? `\n_${p.flavor}_` : '',
  ].join('\n');
}

export function eventAnswer(e, focus = 'tutto') {
  const eff = e.effetto ? EFFECT[e.effetto] : null;
  const req = requirementText(e);
  const parts = {
    requisiti: (e.requisiti.carte
      ? `Per risolvere **${e.nome}** bisogna **spendere ${e.requisiti.carte} Progetti approvati** qualsiasi: le risorse non contano (Evento a ventaglio, pag. 15).`
      : `Per risolvere **${e.nome}** servono Progetti in tabellone che insieme diano almeno **${req}**. Si possono usare Fondanti, Principali senza segnalino e Provvisori; l'Archivio no.`) +
      useful(e),
    colpo: `Colpo di scena di **${e.nome}** (si applica solo quando la carta viene pescata per un effetto Colpo di scena):\n> ${e.colpo_di_scena}`,
    effetto: eff
      ? `Quando risolvi **${e.nome}** si attiva **${eff.nome}**: ${eff.testo}.`
      : `**${e.nome}** non ha effetti quando viene risolto.`,
  };
  if (focus !== 'tutto' && parts[focus]) return parts[focus];
  return [
    `**${e.nome}** (Evento)`,
    `- Per risolverlo: **${req}**`,
    `- Effetto quando risolto: ${eff ? `**${eff.nome}**: ${eff.testo}` : 'nessuno'}`,
    `- Colpo di scena: ${e.colpo_di_scena}`,
    e.flavor ? `\n_${e.flavor}_` : '',
  ].join('\n');
}

function useful(e) {
  if (e.requisiti.carte) return '';
  const types = ['difesa', 'economia', 'tecnologia'].filter((r) => e.requisiti[r] > 0);
  const best = db.projectList
    .filter((p) => types.includes(p.risorsa.tipo))
    .sort((a, b) => b.risorsa.valore - a.risorsa.valore || a.costo - b.costo)
    .slice(0, 4)
    .map((p) => `${p.nome} (${p.risorsa.valore} ${p.risorsa.tipo}, costo ${p.costo})`);
  return `\n\nProgetti che danno di più per questo Evento: ${best.join('; ')}.`;
}

export function thinkerAnswer(t, focus = 'tutto') {
  const o = t.obiettivo;
  let detail = '';
  if (o.tipo === 'coppia_ideologica') {
    const ps = db.projectList.filter((p) => o.ideologie.every((i) => Object.values(p.ideologie).includes(i)));
    detail = `\n\nNel mazzo ci sono **${ps.length} Progetti** con ${o.ideologie.map((i) => IDEO[i]).join(' + ')}: ${ps.map((p) => p.nome).join(', ')}.\nRicorda: ${o.pv_principale} PV se Principale, ${o.pv_fondante} PV se Fondante, 0 PV se Provvisorio o in Archivio.`;
  } else if (o.tipo === 'per_progetto_costo' && o.op !== 'diverso') {
    const ok = (c) => (o.op === '>' ? c > o.valore : o.op === '<' ? c < o.valore : o.valore.includes(c));
    const ps = db.projectList.filter((p) => ok(p.costo));
    detail = `\n\nProgetti che contano (${ps.length}): ${ps.map((p) => `${p.nome} (${p.costo})`).join(', ')}. Conta il costo stampato, non quanto è stato offerto. Valgono tutti gli spazi del tabellone, l'Archivio no.`;
  } else if (o.tipo === 'per_progetto_effetto') {
    const ps = db.projectList.filter((p) => (p.effetto != null) === o.con_effetto);
    detail = `\n\nNel mazzo ci sono ${ps.length} Progetti ${o.con_effetto ? 'con' : 'senza'} effetto speciale.`;
  } else if (o.tipo === 'soglie' && o.conta === 'risorsa_eventi_risolti') {
    const vals = db.eventList.map((e) => `${e.nome} ${e.requisiti[o.risorsa]}`).filter((s) => !s.endsWith(' 0'));
    detail = `\n\nSi sommano le icone **${label(o.risorsa)}** richieste dagli Eventi risolti: "minore di" è stretto (6 non è minore di 6). Conviene risolvere Eventi che ne chiedono poche. Eventi che ne richiedono: ${vals.join(', ')}.`;
  } else if (o.tipo === 'per_progetto_costo' && o.op === 'diverso') {
    detail = '\n\nSi conta **un Progetto per ogni costo distinto** (decisione ufficiale di Factanza): con costi 2, 2, 5 e 7 valgono 3 Progetti, 9 PV.';
  } else if (o.tipo === 'tensione') {
    detail = '\n\nLa casella 0 è la partenza. Più la società resta tranquilla, più punti fai. Vale l\'obiettivo stampato sulla carta (decisione ufficiale di Factanza).';
  } else if (o.tipo === 'soglie' && o.conta === 'mazzo_progetti') {
    detail = '\n\nSi contano solo le carte del mazzo coperto, non i 4 Progetti scoperti. Hai interesse a far scartare carte.';
  } else if (o.tipo === 'soglie' && o.conta === 'progetti_approvati') {
    detail = '\n\nContano i Progetti sul tabellone (non l\'Archivio). Meno ne approvate, più punti fai: con 9 o più fai 0.';
  }
  const head = `**${t.nome}**${t.titolo ? `, ${t.titolo}` : ''}\nObiettivo: ${objectiveText(t)}`;
  if (focus === 'obiettivo') return head + detail;
  return head + detail + (t.citazione ? `\n\n_${t.citazione}_` : '');
}
