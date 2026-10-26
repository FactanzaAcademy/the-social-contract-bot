// Costruisce il catalogo per Haiku (voci + carte) e lo scrive in worker/src/catalog.json e, con il
// codice del ponte, in supabase/functions/_shared/ (l'Edge Function non vede i file fuori da supabase/).
// Rilanciare dopo ogni modifica alla base di conoscenza, alle carte o a src/ai/haiku.js e ponte.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../../src/data.js';
import { entries } from '../../src/chat/matcher.js';
import { answerById, cardAnswer } from '../../src/chat/router.js';
import { resolveAmbiguity } from '../../src/kb/house-rules.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Caso deciso da Factanza → regola ufficiale; caso ancora aperto → Haiku deve dire che non è ufficiale.
const etichetta = (e) => (e.kind !== 'ambiguita' ? '' : resolveAmbiguity(e.data) ? '[decisione ufficiale] ' : '[caso aperto] ');

export function buildCatalog() {
  const voci = entries.map((e) => ({
    id: e.id,
    titolo: `${etichetta(e)}${e.titolo}`,
    indizi: (e.parole || []).slice(0, 4).join(', '),
    testo: answerById(e.id)?.text || '', // testo verificato: la base delle risposte di Haiku
  }));
  const carte = [
    ...db.projectList.map((c) => ({ id: c.id, kind: 'project', tipo: 'Progetto', nome: `${c.nome} (${c.flavor || ''})`.replace(/ \(\)$/, '') })),
    ...db.eventList.map((c) => ({ id: c.id, kind: 'event', tipo: 'Evento', nome: `${c.nome} (${c.flavor || ''})`.replace(/ \(\)$/, '') })),
    ...db.thinkerList.map((c) => ({ id: c.id, kind: 'thinker', tipo: 'Grande Pensatore', nome: `${c.nome}${c.titolo ? `, ${c.titolo}` : ''}` })),
  ].map((c) => ({ ...c, testo: cardAnswer(c.kind, c.id).text }));
  return { versione: new Date().toISOString().slice(0, 10), voci, carte };
}

const GENERATO = '// File generato da tools/ai/build-catalog.mjs: non modificarlo, modifica l\'originale e rilancia lo script.\n';

// Contenuto dei file per l'Edge Function, a partire dal catalogo già scritto per il Worker.
export function sharedFiles(catalogJson) {
  const src = (f) => fs.readFileSync(path.join(root, 'src/ai', f), 'utf8');
  return {
    'catalog.js': `${GENERATO}export default ${catalogJson.trim()};\n`,
    'haiku.js': GENERATO + src('haiku.js'),
    'ponte.js': GENERATO + src('ponte.js'),
  };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const cat = buildCatalog();
  const out = path.join(root, 'worker/src/catalog.json');
  const catalogJson = JSON.stringify(cat, null, 1) + '\n';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, catalogJson);
  console.log(`${out}: ${cat.voci.length} voci, ${cat.carte.length} carte`);
  const shared = path.join(root, 'supabase/functions/_shared');
  fs.mkdirSync(shared, { recursive: true });
  for (const [f, text] of Object.entries(sharedFiles(catalogJson))) fs.writeFileSync(path.join(shared, f), text);
  console.log(`${shared}: catalog.js, haiku.js, ponte.js`);
  // Versione in un solo file, da incollare nell'editor della dashboard Supabase (che non vede _shared).
  const { buildSync } = await import('esbuild');
  const single = path.join(root, 'supabase/dashboard/proponi.js');
  buildSync({
    entryPoints: [path.join(root, 'supabase/functions/proponi/index.js')],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    external: ['npm:*'],
    legalComments: 'none',
    banner: { js: '// Edge Function "proponi" in un solo file per la dashboard Supabase.\n' + GENERATO },
    outfile: single,
  });
  console.log(`${single}: ${(fs.statSync(single).size / 1024).toFixed(0)} KB`);
}
