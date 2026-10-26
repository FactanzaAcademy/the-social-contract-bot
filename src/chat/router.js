// Decide come rispondere: calcolo con il motore, scheda di una carta, voce di regola,
// caso aperto del regolamento, richiesta di chiarimento o "non lo so" onesto.
import { db } from '../data.js';
import { basic, canonical } from './normalize.js';
import { findEntities } from './entities.js';
import { rank, THRESHOLD, entries, topicCoverage } from './matcher.js';

// Comprensione semantica (modello statico nel browser). Finché non è caricata, il bot usa solo
// le parole chiave. setSemantic(index) la attiva; SEM sono le soglie dell'abbinamento ibrido.
let semantic = null;
// Valori scelti con tools/semantic/calibrate.mjs sulla metà di TARATURA del set cieco semantico (20-10-2026):
// le soglie tarate sullo sviluppo (sure 0.85) erano troppo sicure di sé su domande nuove.
export const SEM = { w: 0.5, sure: 1.05, certain: 1.3, margin: 0.03, clarify: 0.6, off: 0.55, near: 0.48 };
export function setSemantic(index) {
  semantic = index;
}
export function hasSemantic() {
  return !!semantic;
}

// Classifica ibrida: somiglianza semantica + peso delle parole chiave.
function hybridRank(raw, kwResults) {
  const sims = semantic.rank(raw);
  const kw = new Map(kwResults.map((r) => [r.entry.id, r]));
  const out = entries.map((e) => {
    const k = kw.get(e.id);
    const sim = sims.get(e.id) ?? 0;
    const kws = Math.min(1.2, k?.score ?? 0);
    return { entry: e, score: sim + SEM.w * kws, sim, kw: kws, kwHits: k?.kwHits ?? 0 };
  });
  out.sort((a, b) => b.score - a.score);
  return out;
}
import { projectAnswer, eventAnswer, thinkerAnswer, objectiveText } from '../kb/templates.js';
import { resolveBids, explainBids } from '../engine/bidding.js';
import { resolveAmbiguity } from '../kb/house-rules.js';

const has = (q, re) => re.test(q);

// Carte che toccano un caso aperto del regolamento: la scheda lo mostra sempre.
const CARD_AMBIGUITIES = {
  t13: ['michelangelo-costo-differente'],
  t26: ['asso-diplomazia'],
  t07: ['matteotti-mazzo'],
  e04: ['blackout-sinistra'],
  e05: ['sostituzione-dettagli'],
  e11: ['sposta-quale-spazio'],
  e12: ['sposta-quale-spazio'],
  e19: ['incursione-effetto-carta'],
  e20: ['senso-sinistra'],
  e21: ['senso-sinistra'],
  e22: ['cantiere-effetto'],
  e23: ['metropolis-effetto'],
  p03: ['allocazione-su-carta'],
  p05: ['allocazione-su-carta'],
  p23: ['allocazione-su-carta'],
  p35: ['allocazione-su-carta'],
};

// Toglie il nome della carta dalla domanda, così "Piano di difesa" non sembra una domanda sulla Difesa.
function stripName(raw, nome) {
  const words = new Set(basic(nome).replace(/!/g, '').split(' ').filter((w) => w.length > 2));
  return basic(raw)
    .split(' ')
    .filter((w) => ![...words].some((n) => w === n || (w.length >= 5 && n.startsWith(w.slice(0, 5)))))
    .join(' ');
}

// Intento sulla carta in base alle parole della domanda (testo canonico).
function cardFocus(kind, q) {
  if (kind === 'project') {
    if (has(q, /\b(pensatori|punti|conviene|chi (lo|la) vuole|obiettiv)/)) return 'pensatori';
    if (has(q, /\b(costo|monete|quanto)\b/) && !has(q, /\brisors/)) return 'costo';
    if (has(q, /\b(risors|fornisce|produce|da quanto|difesa|economia|tecnologia)/)) return 'risorsa';
    if (has(q, /\b(effett|cosa fa|che fa|a cosa serve|icona|speciale|attiva|succede quando)/)) return 'effetto';
    if (has(q, /\b(ideolog|icone|pubblico|privato|preservazione|consumo|innovazione|tradizione)/)) return 'ideologie';
    return 'tutto';
  }
  if (kind === 'event') {
    if (has(q, /colpo scena|capovolt|pescat|pesco/)) return 'colpo';
    if (has(q, /\b(effett|ricompens|premio|bonus|ottengo|guadagn|cosa succede (se|quando) (lo )?risolv|dopo averlo risolto|risolvendol)/)) return 'effetto';
    if (has(q, /\b(risolver|serve|servono|richied|chiede|vuole|ci vuole|occorr|risors|quant[aeio]|come si|come lo|bisogno|difesa|economia|tecnologia)/)) return 'requisiti';
    return 'tutto';
  }
  if (has(q, /\b(punti|obiettiv|come (fa|faccio|si fa)|conta|vince|vuole|icone|premia|progetti|guadagn|ottien)/)) return 'obiettivo';
  return 'tutto';
}

// Domande di calcolo sull'asta: "offriamo 3, 4 e 2, il progetto costa 8: posso fondante?"
const NUM_WORDS = { zero: 0, nulla: 0, niente: 0, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20 };

export function parseBidQuestion(text, cardCost) {
  let q = basic(text).replace(/!/g, ' ');
  const bidWords = /(offr|offert|punt|asta|monet|soldi|mett|pag|diam|dato)/.test(q);
  q = q.replace(/\b(zero|nulla|niente|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|tredici|quattordici|quindici|sedici|diciassette|diciotto|diciannove|venti)\b/g, (w) => String(NUM_WORDS[w]));
  // "uno" solo come numero isolato ("uno a testa", "1")
  q = q.replace(/\buno\b/g, '1');
  let cost = cardCost ?? null;
  const costRes = [
    /\bcost[aoi]?(?:\s+(?:di|pari a|:))?\s+(\d+)/,
    /\bcosto\s*(\d+)/,
    /(\d+)\s+di\s+costo/,
    /\b(?:progetto|carta)\s+(?:che\s+costa\s+|da\s+|di\s+)(\d+)/,
    /\bservono\s+(\d+)/,
  ];
  let costFound = false;
  for (const re of costRes) {
    const m = q.match(re);
    if (m) {
      cost = Number(m[1]);
      q = q.replace(m[0], ' ');
      costFound = true;
      break;
    }
  }
  if (!bidWords && !costFound) return null;
  // numero di giocatori ("in 4", "siamo 5", "5 giocatori") non è un'offerta
  let players = null;
  const mp = q.match(/\b(?:in|siamo)\s+(\d)\b(?!\s*monet)|\b(\d)\s+giocator/);
  if (mp) {
    players = Number(mp[1] || mp[2]);
    q = q.replace(mp[0], ' ');
  }
  q = q.replace(/\bpag(?:ina|\.)?\s*\d+/g, ' ');
  let nums = (q.match(/\d+/g) || []).map(Number).filter((n) => n <= 60);
  // "3 a testa" / "ognuno 3": tutti offrono lo stesso
  const each = q.match(/(\d+)\s+(?:monete\s+)?(?:a testa|ciascuno|per uno|ognuno)|(?:ognuno|ciascuno)\s+(?:offre\s+|mette\s+)?(\d+)/);
  if (each && players) nums = Array(players).fill(Number(each[1] || each[2]));
  if (nums.length === 1 && /da sol[oa]|solo io|solo lui|solo lei|gli altri (?:0|niente|nulla)/.test(basic(text))) nums = [nums[0], 0];
  if (cost == null || nums.length < 2 || nums.length > 6) return null;
  return { offers: nums, cost };
}

function bidCalc(text, cardCost) {
  const parsed = parseBidQuestion(text, cardCost);
  if (!parsed) return null;
  const { offers: nums, cost } = parsed;
  const r = resolveBids({ offers: nums, cost, currentLeader: -1 });
  const lines = explainBids(r, nums.map((_, i) => `Il giocatore ${i + 1} (offerta ${nums[i]})`));
  return {
    type: 'calcolo',
    title: `Asta: offerte ${nums.join(' + ')} su costo ${cost}`,
    text:
      lines.filter((l) => !(r.leaderReason === 'pareggio' && l.includes('NON cambia'))).join('\n') +
      (r.leaderReason === 'pareggio' ? `\nC'è un pareggio sull'offerta più alta (${r.maxOffer}): il Leader resta quello di prima, anche se aveva offerto meno (pag. 13).` : ''),
    pages: [13],
    verifier: { tool: 'asta', offers: nums, cost },
  };
}

function ambiguityText(a) {
  const ruling = resolveAmbiguity(a);
  if (ruling) return `**${a.titolo}**\n\n${ruling}\n\n_Decisione ufficiale di Factanza: il regolamento stampato non lo specifica._`;
  return `**${a.titolo}**\n\n**Cosa dice il regolamento:** ${a.cosa_dice}\n\n**Cosa non dice:** ${a.cosa_non_dice}\n\n**Come lo applica questo assistente** (interpretazione, non regola ufficiale): ${a.interpretazione}`;
}

function entryAnswer(entry) {
  if (entry.kind === 'ambiguita')
    return { type: 'ambiguita', id: entry.id, title: entry.titolo, text: ambiguityText(entry.data), pages: [], ufficiale: !!resolveAmbiguity(entry.data) };
  let text = entry.risposta;
  if (text === '__ELENCO_PENSATORI__')
    text = db.thinkerList.map((t) => `- **${t.nome}**${t.titolo ? ` (${t.titolo})` : ''}: ${objectiveText(t)}`).join('\n');
  return { type: entry.fuori ? 'fuori' : 'regola', id: entry.id, title: entry.titolo, text, pages: entry.pagine, related: entry.vedi };
}

export function answer(question) {
  const raw = (question || '').trim();
  if (!raw) return { type: 'vuoto', text: 'Scrivi una domanda sulle regole di The Social Contract.' };
  const q = canonical(raw);
  const ents = findEntities(raw);
  const top = ents[0];

  const card = top && top.kind === 'project' ? db.projects[top.id] : null;
  const calc = bidCalc(raw, card?.costo);
  if (calc) return calc;

  const { results } = rank(raw);
  const best = results[0];
  const second = results[1];

  // Una carta nominata: rispondo sulla carta, salvo che la domanda sia chiaramente una regola generale
  if (top && top.score >= 0.6) {
    const focus = cardFocus(top.kind, canonical(stripName(raw, top.nome)));
    const extraWords = basic(stripName(raw, top.nome)).split(' ').filter((w) => w.length > 3).length;
    const ruleStrong =
      best && focus === 'tutto' &&
      ((best.entry.kind === 'regola' && best.score >= 0.75 && best.kwHits > 0 && top.score < 0.9) ||
        (extraWords >= 7 && best.score >= 0.6 && !CARD_AMBIGUITIES[top.id]?.includes(best.entry.id)));
    if (!ruleStrong) {
      const extra = best && best.entry.kind === 'ambiguita' && best.score >= THRESHOLD.sicuro ? [best.entry.id] : [];
      return { ...cardAnswer(top.kind, top.id, focus, extra), also: ents.slice(1, 4).map((e) => e.nome) };
    }
  }

  if (semantic) return decideHybrid(raw, results);

  const margin = second ? best.score - second.score : 1;
  if (best && best.score >= THRESHOLD.sicuro && (margin >= THRESHOLD.margine || best.score >= THRESHOLD.certo)) {
    const alternatives = results.slice(1, 3).filter((r) => best.score - r.score < 0.12).map((r) => ({ id: r.entry.id, title: r.entry.titolo }));
    return { ...entryAnswer(best.entry), confidence: best.score, alternatives };
  }
  if (best && best.score >= THRESHOLD.chiarimento) {
    return {
      type: 'chiarimento',
      text: 'Non sono sicuro di aver capito. Intendevi una di queste?',
      suggestions: results.filter((r) => r.score >= THRESHOLD.chiarimento * 0.8).slice(0, 3).map((r) => ({ id: r.entry.id, title: r.entry.titolo })),
      confidence: best.score,
    };
  }
  return {
    type: 'non-so',
    text: 'Non trovo nulla tra le regole su questo.',
    suggestions: results.slice(0, 3).filter((r) => r.score > 0.15).map((r) => ({ id: r.entry.id, title: r.entry.titolo })),
  };
}

const NON_SO_TEXT =
  'Non trovo nulla tra le regole su questo.';

function decideHybrid(raw, kwResults) {
  const results = hybridRank(raw, kwResults);
  const best = results[0];
  const second = results[1];
  const margin = best.score - (second?.score ?? 0);
  const maxSim = Math.max(...results.map((r) => r.sim));
  const sugg = (list) => list.map((r) => ({ id: r.entry.id, title: r.entry.titolo }));
  // fuori tema: la domanda non somiglia a niente e non ha parole chiave del gioco
  if (maxSim < SEM.off && best.kw < 0.5) {
    // poco somigliante: niente risposta sicura, ma se qualcosa è vicino lo propongo
    const near = results.filter((r) => r.sim >= SEM.near).slice(0, 2);
    return near.length
      ? { type: 'chiarimento', text: 'Non sono sicuro di aver capito. Forse intendevi una di queste?', suggestions: sugg(near), confidence: best.score }
      : { type: 'non-so', text: NON_SO_TEXT, suggestions: [], confidence: best.score };
  }
  if (best.score >= SEM.sure && (margin >= SEM.margin || best.score >= SEM.certain)) {
    const alternatives = sugg(results.slice(1, 3).filter((r) => best.score - r.score < 0.1));
    return { ...entryAnswer(best.entry), confidence: best.score, alternatives };
  }
  if (best.score >= SEM.clarify)
    return { type: 'chiarimento', text: 'Non sono sicuro di aver capito. Intendevi una di queste?', suggestions: sugg(results.slice(0, 3)), confidence: best.score };
  return { type: 'non-so', text: NON_SO_TEXT, suggestions: sugg(results.slice(0, 3).filter((r) => r.score > SEM.clarify * 0.8)), confidence: best.score };
}

// Scheda di una carta con un certo intento (costo, effetto, requisiti…), con i casi aperti collegati.
export function cardAnswer(kind, id, focus = 'tutto', extraAmbiguities = []) {
  const c = kind === 'project' ? db.projects[id] : kind === 'event' ? db.events[id] : db.thinkers[id];
  const fn = kind === 'project' ? projectAnswer : kind === 'event' ? eventAnswer : thinkerAnswer;
  const ambIds = new Set([...(CARD_AMBIGUITIES[id] || []), ...extraAmbiguities]);
  const ambs = [...ambIds].map((x) => entries.find((e) => e.id === x)).filter(Boolean);
  return {
    type: 'carta',
    kind,
    id,
    focus,
    title: c.nome,
    text: fn(c, focus) + ambs.map((a) => `\n\n---\n${ambiguityText(a.data)}`).join(''),
    ambiguities: ambs.map((a) => a.id),
    aperti: ambs.filter((a) => !resolveAmbiguity(a.data)).length,
    pages: [],
  };
}

// ---------------- Modalità "proposte": il bot non risponde mai da solo ----------------
// Per ogni domanda propone fino a 3 voci; la risposta arriva solo dopo la scelta dell'utente.
// Così una risposta sbagliata data come sicura non può esistere per costruzione.

const FOCUS_LABEL = {
  project: { costo: 'quanto costa', risorsa: 'che risorsa fornisce', effetto: 'il suo effetto speciale', ideologie: 'le sue icone', pensatori: 'a quali Pensatori conviene', tutto: 'la scheda completa' },
  event: { requisiti: 'come si risolve', colpo: 'il suo Colpo di scena', effetto: 'cosa succede quando lo risolvi', tutto: 'la scheda completa' },
  thinker: { obiettivo: 'come fa punti', tutto: 'la scheda completa' },
};
const KIND_LABEL = { project: 'Progetto', event: 'Evento', thinker: 'Grande Pensatore' };

function cardOption(kind, id, focus) {
  const c = kind === 'project' ? db.projects[id] : kind === 'event' ? db.events[id] : db.thinkers[id];
  return { kind: 'carta', cardKind: kind, id, focus, key: `carta:${id}:${focus}`, title: `${KIND_LABEL[kind]} «${c.nome}»: ${FOCUS_LABEL[kind][focus]}` };
}
function entryOption(id) {
  const e = entries.find((x) => x.id === id);
  return e && { kind: e.kind === 'ambiguita' ? 'ambiguita' : 'regola', id, key: id, title: e.titolo, ufficiale: e.kind === 'ambiguita' && !!resolveAmbiguity(e.data) };
}

export const PROPOSTE_MAX = 3;

// Fuori tema sicuro: nessuna parola di contenuto che il bot conosca. Una soglia sulla quota di parole
// conosciute bloccava troppe domande buone scritte con parole proprie (provato sui set di sviluppo il
// 21-10-2026): il resto dei fuori tema lo riconosce Haiku (strada A).
// Solo parole generiche ("chi sei?") non basta: decide la ricerca normale.
const isOffTopic = (raw) => {
  const c = topicCoverage(raw);
  return c.content > 0 && c.known === 0;
};

export function propose(question) {
  const raw = (question || '').trim();
  if (!raw) return { type: 'vuoto', text: 'Scrivi una domanda sulle regole di The Social Contract.', options: [] };
  const opts = [];
  const add = (o) => o && !opts.some((x) => x.key === o.key) && opts.push(o);

  const ents = findEntities(raw);
  const top = ents[0];
  // 1. un calcolo: mai una risposta testuale, solo il verificatore già compilato da controllare
  const parsed = parseBidQuestion(raw, top && top.kind === 'project' ? db.projects[top.id].costo : undefined);
  if (parsed)
    add({ kind: 'calcolo', key: 'calcolo', title: `Calcola l'asta: offerte ${parsed.offers.join(' + ')} su un Progetto da ${parsed.cost}`, verifier: { tool: 'asta', ...parsed } });

  // fuori tema: niente carte né calcoli e quasi nessuna parola del gioco → "non trovo", non voci a caso
  if (!opts.length && !ents.length && isOffTopic(raw)) return { type: 'non-so', text: NON_SO_TEXT, options: [] };

  // 2. la scelta che il bot farebbe da solo, poi le alternative
  const a = answer(raw);
  if (a.type === 'carta') add(cardOption(a.kind, a.id, a.focus));
  else if (['regola', 'ambiguita', 'fuori'].includes(a.type)) add(entryOption(a.id));
  for (const s of [...(a.alternatives || []), ...(a.suggestions || [])]) add(entryOption(s.id));

  // 3. le carte riconosciute nella domanda (da confermare)
  for (const e of ents.slice(0, 2)) add(cardOption(e.kind, e.id, cardFocus(e.kind, canonical(stripName(raw, e.nome)))));

  // 4. completamento con le voci più vicine
  const kw = rank(raw).results;
  const ranked = semantic ? hybridRank(raw, kw) : kw;
  // solo voci vicine alla migliore; dopo una carta o un calcolo, solo voci forti
  const strongOnly = opts.some((o) => o.kind === 'carta' || o.kind === 'calcolo');
  const floor = strongOnly ? (semantic ? SEM.sure : THRESHOLD.sicuro) : semantic ? SEM.clarify * 0.9 : THRESHOLD.chiarimento * 0.8;
  const min = Math.max(floor, 0.8 * (ranked[0]?.score ?? 0));
  for (const r of ranked) {
    if (opts.length >= PROPOSTE_MAX) break;
    if (r.score >= min) add(entryOption(r.entry.id));
  }

  const options = opts.slice(0, PROPOSTE_MAX);
  if (!options.length) return { type: 'non-so', text: NON_SO_TEXT, options: [] };
  return { type: 'proposte', text: options.length === 1 ? 'Ho trovato questa voce. È quella che cerchi?' : 'Ho trovato queste voci. Scegli quella che risponde alla tua domanda:', options };
}

// Chiave ("turno", "carta:p03:costo") → proposta, se esiste davvero nel catalogo del bot.
export function optionFromKey(key) {
  const m = /^carta:([pet]\d{2}):(\w+)$/.exec(key);
  if (m) {
    const kind = m[1][0] === 'p' ? 'project' : m[1][0] === 'e' ? 'event' : 'thinker';
    const exists = kind === 'project' ? db.projects[m[1]] : kind === 'event' ? db.events[m[1]] : db.thinkers[m[1]];
    if (!exists || !FOCUS_LABEL[kind][m[2]]) return null;
    return cardOption(kind, m[1], m[2]);
  }
  return entryOption(key) || null;
}

// Strada A: le scelte di Haiku (già validate dal Worker) vanno in testa, poi le proposte locali.
// Un calcolo riconosciuto in locale resta sempre primo: lo fa il motore, non l'AI.
export function mergeProposals(aiKeys, aiFuoriTema, local) {
  const out = [];
  const add = (o) => o && !out.some((x) => x.key === o.key) && out.push(o);
  local.options.filter((o) => o.kind === 'calcolo').forEach(add);
  (aiKeys || []).map(optionFromKey).forEach(add);
  local.options.forEach(add);
  const options = out.slice(0, PROPOSTE_MAX);
  // Haiku dice "fuori tema" e non sceglie voci: vale la sua parola, tranne se in locale c'è una carta
  // nominata o un calcolo (sui set ciechi: 17/17 fuori tema giusti, 2 falsi allarmi su 293 domande).
  const solide = local.options.some((o) => o.kind === 'carta' || o.kind === 'calcolo');
  if (!options.length || (aiFuoriTema && !(aiKeys || []).length && !solide)) return { type: 'non-so', text: NON_SO_TEXT, options: [] };
  return { type: 'proposte', text: options.length === 1 ? 'Ho trovato questa voce. È quella che cerchi?' : 'Ho trovato queste voci. Scegli quella che risponde alla tua domanda:', options };
}

// Risposta a una proposta scelta dall'utente.
export function answerOption(o) {
  if (o.kind === 'carta') return cardAnswer(o.cardKind, o.id, o.focus);
  return answerById(o.id);
}

export function answerById(id) {
  const e = entries.find((x) => x.id === id);
  return e ? entryAnswer(e) : null;
}
