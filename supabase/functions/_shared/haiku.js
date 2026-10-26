// File generato da tools/ai/build-catalog.mjs: non modificarlo, modifica l'originale e rilancia lo script.
// Strada A: Claude Haiku 5.5 sceglie tra le voci del catalogo (non scrive risposte).
// Modulo puro, condiviso dal Cloudflare Worker e dagli script di misura: riceve il client
// Anthropic e il catalogo già costruito (tools/ai/build-catalog.mjs → catalog.json).

export const MODEL = 'claude-haiku-5-5';

// Listino Claude Haiku 5.5 per prompt fino a 100K token, in dollari per milione di token.
export const PREZZI = { input: 0.1, cacheWrite5m: 0.125, cacheRead: 0.01, output: 0.5 };

export function costUSD(usage) {
  if (!usage) return 0;
  return (
    ((usage.input_tokens || 0) * PREZZI.input +
      (usage.cache_creation_input_tokens || 0) * PREZZI.cacheWrite5m +
      (usage.cache_read_input_tokens || 0) * PREZZI.cacheRead +
      (usage.output_tokens || 0) * PREZZI.output) /
    1e6
  );
}

const FOCUS = {
  project: ['costo', 'risorsa', 'effetto', 'ideologie', 'pensatori', 'tutto'],
  event: ['requisiti', 'colpo', 'effetto', 'tutto'],
  thinker: ['obiettivo', 'tutto'],
};

// Testo del catalogo: stabile (stesso ordine a ogni build) perché la cache è un confronto di prefisso.
export function catalogText(catalog) {
  const voci = catalog.voci.map((v) => `${v.id} | ${v.titolo}${v.indizi ? ` | ${v.indizi}` : ''}`).join('\n');
  const carte = catalog.carte.map((c) => `${c.id} | ${c.tipo} | ${c.nome}`).join('\n');
  return `VOCI DEL REGOLAMENTO (id | titolo | indizi):\n${voci}\n\nCARTE (id | tipo | nome):\n${carte}`;
}

export const ISTRUZIONI = `Sei il motore di ricerca dell'assistente alle regole del gioco da tavolo "The Social Contract" (Factanza).
Non rispondi mai alla domanda: scegli quali voci del catalogo la rispondono. Le risposte le scrive già l'assistente, già verificate.

Regole:
- Restituisci da 1 a 3 proposte, la più pertinente per prima. Usa solo id presenti nel catalogo.
- Una carta va proposta solo se la domanda la nomina o la descrive (anche con un soprannome, un refuso o il testo umoristico della carta). Per una carta indica anche il focus:
  Progetto: costo | risorsa | effetto | ideologie | pensatori (a quali Grandi Pensatori conviene) | tutto
  Evento: requisiti (come si risolve) | colpo (Colpo di scena) | effetto (cosa succede quando lo risolvi) | tutto
  Pensatore: obiettivo (come fa punti) | tutto
- Le voci che iniziano con un caso aperto (il regolamento non lo risolve) vanno proposte quando la domanda tocca proprio quel dubbio.
- Le voci bot-info, acquisto, varianti, eta, strategia, pezzi-persi sono risposte oneste a domande che il regolamento non copre: proponile quando la domanda è su quei temi.
- Se la domanda non riguarda il gioco, metti fuori_tema a true e proposte vuote. Se riguarda il gioco ma nessuna voce la risponde, metti fuori_tema a false e proposte vuote.
- I giocatori scrivono in modo informale: "gettone di chi comanda" = segnalino Leader, "fila di mezzo" = Progetti Principali, "termometro" = Tensione Sociale, "carte con le persone famose" = Grandi Pensatori.`;

// Schema degli output strutturati: gli id sono un elenco chiuso, quindi Haiku non può inventarne.
export function outputSchema(catalog) {
  return {
    type: 'object',
    properties: {
      fuori_tema: { type: 'boolean' },
      proposte: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', enum: [...catalog.voci.map((v) => v.id), ...catalog.carte.map((c) => c.id)] },
            focus: { type: 'string', enum: ['nessuno', ...new Set(Object.values(FOCUS).flat())] },
          },
          required: ['id', 'focus'],
          additionalProperties: false,
        },
      },
    },
    required: ['fuori_tema', 'proposte'],
    additionalProperties: false,
  };
}

// Trasforma le scelte di Haiku in chiavi del bot ("turno", "carta:p03:costo"), scartando
// tutto ciò che non è valido. Al massimo 3.
export function toKeys(parsed, catalog) {
  const voci = new Set(catalog.voci.map((v) => v.id));
  const carte = new Map(catalog.carte.map((c) => [c.id, c]));
  const keys = [];
  for (const p of parsed?.proposte || []) {
    let k = null;
    if (voci.has(p.id)) k = p.id;
    else if (carte.has(p.id)) {
      const kind = carte.get(p.id).kind;
      const f = FOCUS[kind].includes(p.focus) ? p.focus : 'tutto';
      k = `carta:${p.id}:${f}`;
    }
    if (k && !keys.includes(k)) keys.push(k);
    if (keys.length === 3) break;
  }
  return keys;
}

// Una chiamata: domanda → { keys, fuoriTema, usage, costo, ms }. Lancia solo per errori di rete/API.
export async function aiPropose(client, catalog, domanda) {
  const t0 = Date.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: outputSchema(catalog) } },
    system: [
      { type: 'text', text: ISTRUZIONI },
      { type: 'text', text: catalogText(catalog), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: String(domanda).slice(0, 300) }],
  });
  const ms = Date.now() - t0;
  const usage = response.usage;
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
    return { keys: [], fuoriTema: false, usage, costo: costUSD(usage), ms, stop: response.stop_reason };
  }
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return { keys: toKeys(parsed, catalog), fuoriTema: !!parsed?.fuori_tema, usage, costo: costUSD(usage), ms, stop: response.stop_reason };
}

// ---- Modalità risposta: Haiku risponde nel merito, ma solo con i testi ufficiali del catalogo ----
// Il catalogo contiene il testo verificato di ogni voce e di ogni carta (tools/ai/build-catalog.mjs).
// Haiku scrive una risposta breve e indica le fonti; il bot mostra le fonti sotto come approfondimento.

export const ISTRUZIONI_RISPOSTA = `Sei Patto, l'assistente alle regole del gioco da tavolo "The Social Contract" (Factanza).
Rispondi alle domande dei giocatori usando SOLO i testi ufficiali qui sotto (sezione REGOLAMENTO). Sono l'unica fonte: non usare quello che sai di altri giochi, non inventare regole, numeri, carte o eccezioni.

Come rispondere:
- Rispondi nel merito, in italiano, in 1-4 frasi brevi, dando del tu. Vai dritto al punto: prima la risposta (sì/no, il numero, chi lo fa), poi il minimo di spiegazione.
- Puoi usare **grassetto** per i termini del gioco. Niente titoli, niente elenchi lunghi, niente emoji.
- Non citare id, "catalogo", "voci" o "testi forniti": parla del regolamento e delle carte.
- Scrivi solo quello che i testi dicono. Non aggiungere conseguenze, eccezioni o casi limite che non sono scritti: se un testo non lo dice, non parlarne.
- Non fare deduzioni a catena ("quindi…", "di conseguenza…") oltre a quello che il testo dice. Quando un testo usa un'espressione precisa (per esempio "il Leader attuale"), riportala con le stesse parole invece di interpretarla.
- Se la domanda tocca un caso che il regolamento non risolve (le voci "[caso aperto]"), dillo chiaramente: il regolamento ufficiale non lo chiarisce. Se la voce ha "Come lo applica questo assistente", puoi riportarlo, dicendo esplicitamente che è l'interpretazione dell'assistente e non una regola ufficiale. Non presentarlo mai come regola.
- Le voci "[decisione ufficiale]" sono regole ufficiali decise da Factanza dove il regolamento stampato non era chiaro: presentale come regola, e puoi dire che è una precisazione ufficiale di Factanza. Se una di queste voci dice che una parte è interpretazione dell'assistente, riporta quella parte come tale.
- Se la domanda chiede un calcolo con numeri precisi (offerte, costi, punti), spiega la regola che si applica: il conto lo fa lo strumento del bot.
- In "fonti" metti da 1 a 3 voci o carte da cui hai preso la risposta, la più importante per prima, con il focus giusto per le carte.

Quando non rispondere:
- Se la domanda riguarda il gioco ma i testi non contengono la risposta, metti trovata a false e risposta vuota. Meglio nessuna risposta che una risposta incerta.
- Se la domanda non riguarda il gioco, metti fuori_tema a true, trovata a false e risposta vuota.

I giocatori scrivono in modo informale: "gettone di chi comanda" = segnalino Leader, "fila di mezzo" = Progetti Principali, "termometro" = Tensione Sociale, "carte con le persone famose" = Grandi Pensatori.`;

export function regolamentoText(catalog) {
  const voci = catalog.voci.map((v) => `### ${v.id} · ${v.titolo}\n${v.testo || ''}`).join('\n\n');
  const carte = catalog.carte.map((c) => `### ${c.id} · ${c.tipo} · ${c.nome}\n${c.testo || ''}`).join('\n\n');
  return `REGOLAMENTO: VOCI\n\n${voci}\n\nREGOLAMENTO: CARTE\n\n${carte}`;
}

export function rispostaSchema(catalog) {
  const fonti = outputSchema(catalog).properties.proposte;
  return {
    type: 'object',
    properties: { fuori_tema: { type: 'boolean' }, trovata: { type: 'boolean' }, risposta: { type: 'string' }, fonti },
    required: ['fuori_tema', 'trovata', 'risposta', 'fonti'],
    additionalProperties: false,
  };
}

// Una chiamata: domanda → { risposta, trovata, fuoriTema, keys (le fonti), usage, costo, ms }. Lancia solo per errori di rete/API.
export async function aiRispondi(client, catalog, domanda, { effort = 'medium' } = {}) {
  const t0 = Date.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    output_config: { effort, format: { type: 'json_schema', schema: rispostaSchema(catalog) } },
    system: [
      { type: 'text', text: ISTRUZIONI_RISPOSTA },
      { type: 'text', text: regolamentoText(catalog), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: String(domanda).slice(0, 300) }],
  });
  const ms = Date.now() - t0;
  const usage = response.usage;
  const vuota = { risposta: '', trovata: false, fuoriTema: false, keys: [], usage, costo: costUSD(usage), ms, stop: response.stop_reason };
  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return vuota;
  let parsed = null;
  try {
    parsed = JSON.parse(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
  } catch {
    return vuota;
  }
  const keys = toKeys({ proposte: parsed?.fonti }, catalog);
  const risposta = String(parsed?.risposta || '').trim().slice(0, 1200);
  // una risposta senza fonti valide non si mostra: deve poggiare su almeno una voce o carta
  const trovata = !!parsed?.trovata && !!risposta && keys.length > 0;
  return { ...vuota, risposta: trovata ? risposta : '', trovata, fuoriTema: !!parsed?.fuori_tema, keys };
}
