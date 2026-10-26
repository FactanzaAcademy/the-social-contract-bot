// Genera review/carte.html: ogni carta accanto ai dati trascritti, per la verifica umana.
// Uso: node tools/review-sheet.js  → apri review/carte.html nel browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../src/data.js';
import { requirementText, label } from '../src/engine/events.js';
import { EFFECT, ideologies } from '../src/kb/templates.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'review');
fs.mkdirSync(out, { recursive: true });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const img = (p, page) => `../public/cards/${p}-${String(page).padStart(2, '0')}.jpg`;

const row = (id, src, wide, fields, uncertain) => `
<tr id="${id}">
  <td class="img"><img src="${src}" class="${wide ? 'wide' : ''}" loading="lazy" alt=""></td>
  <td><table class="kv">${fields.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>
  ${uncertain ? `<p class="unc">⚠︎ ${esc(uncertain)}</p>` : ''}
  <label class="ok"><input type="checkbox" data-id="${id}"> corretto</label>
  <input class="note" data-note="${id}" placeholder="nota (se c'è un errore)"></td>
</tr>`;

const projects = db.projectList.map((p) => row(p.id, img('p', p.page), true, [
  ['Nome', `<b>${esc(p.nome)}</b> <span class="id">${p.id}</span>`],
  ['Costo', p.costo],
  ['Risorsa', `${p.risorsa.valore} ${label(p.risorsa.tipo)}`],
  ['Icone', ideologies(p)],
  ['Effetto', p.effetto ? EFFECT[p.effetto].nome : '—'],
], p.uncertain));

const events = db.eventList.map((e) => row(e.id, img('e', e.page), false, [
  ['Nome', `<b>${esc(e.nome)}</b> <span class="id">${e.id}</span>`],
  ['Richiede', requirementText(e)],
  ['Effetto se risolto', e.effetto ? EFFECT[e.effetto].nome : '—'],
  ['Colpo di scena', esc(e.colpo_di_scena)],
  ['Codice motore', `<code>${e.twist}</code>`],
], e.uncertain));

const thinkers = db.thinkerList.map((t) => row(t.id, img('t', t.page), false, [
  ['Nome', `<b>${esc(t.nome)}</b> <span class="id">${t.id}</span>`],
  ['Obiettivo (testo)', esc(t.testo_obiettivo)],
  ['Obiettivo (motore)', `<code>${esc(JSON.stringify(t.obiettivo))}</code>`],
], t.uncertain));

const b = db.board;
const boardHtml = `<table class="kv">
<tr><th>Fondanti</th><td>${b.fondanti.spazi} spazi, offerta ≥ costo + ${b.fondanti.sovrapprezzo}</td></tr>
<tr><th>Principali</th><td>${b.principali.spazi} spazi</td></tr>
<tr><th>Provvisori</th><td>${b.provvisori.map((s) => `${s.pos}: ${s.effetto ?? '—'}`).join(' · ')}</td></tr>
<tr><th>Tensione</th><td>${b.tensione.map((s) => `${s.casella}: ${s.effetto ?? 'partenza'}`).join(' · ')}</td></tr></table>
<img src="../cards/board/board-1.png" style="max-width:100%;margin-top:8px;border-radius:8px">`;

const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisione carte</title>
<style>
:root{--bg:#fbf3e6;--card:#fff;--ink:#241a33;--soft:#5d5470;--line:#e7dccb;--accent:#4d2f8f}
@media (prefers-color-scheme:dark){:root{--bg:#1c1626;--card:#271f35;--ink:#f3eefb;--soft:#b9aed0;--line:#3a2f4d;--accent:#b9a2f2}}
body{background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,sans-serif;margin:0;padding:16px;max-width:1000px;margin:auto}
h1{margin:0 0 4px}h2{margin:28px 0 8px;color:var(--accent)}
.bar{position:sticky;top:0;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--line);z-index:2;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
table.list{width:100%;border-collapse:collapse}table.list>tbody>tr>td{border-bottom:1px solid var(--line);padding:10px 6px;vertical-align:top}
td.img{width:200px}td.img img{width:180px;border-radius:8px}td.img img.wide{width:200px}
.kv th{text-align:left;color:var(--soft);font-weight:600;padding:2px 10px 2px 0;white-space:nowrap;vertical-align:top}.kv td{padding:2px 0}
.id{color:var(--soft);font-size:12px}.unc{background:#fff1d6;color:#9a5b00;padding:6px 8px;border-radius:6px;font-size:13px}
.ok{display:inline-flex;gap:6px;margin-top:6px;font-weight:600}.note{display:block;width:100%;margin-top:4px;padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)}
code{font-size:12px;word-break:break-all}button{padding:6px 12px;border-radius:8px;border:0;background:var(--accent);color:#fff;font-weight:700;cursor:pointer}
@media (max-width:600px){td.img{width:120px}td.img img,td.img img.wide{width:110px}}
</style></head><body>
<h1>Revisione delle 88 carte trascritte</h1>
<p>Confronta ogni immagine con i dati che usa il bot. Spunta "corretto" o scrivi una nota. Le spunte restano salvate in questo browser; con il pulsante copi il riepilogo da mandare.</p>
<div class="bar"><span id="count"></span><button id="copy">Copia riepilogo</button></div>
<h2>Tabellone</h2>${boardHtml}
<h2>Progetti (39)</h2><table class="list"><tbody>${projects.join('')}</tbody></table>
<h2>Eventi (23)</h2><table class="list"><tbody>${events.join('')}</tbody></table>
<h2>Grandi Pensatori (26)</h2><table class="list"><tbody>${thinkers.join('')}</tbody></table>
<script>
const KEY='tsc-review';let st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){};upd()};
const boxes=[...document.querySelectorAll('[data-id]')],notes=[...document.querySelectorAll('[data-note]')];
boxes.forEach(b=>{b.checked=!!st[b.dataset.id]?.ok;b.onchange=()=>{(st[b.dataset.id]??={}).ok=b.checked;save()}});
notes.forEach(n=>{n.value=st[n.dataset.note]?.note||'';n.oninput=()=>{(st[n.dataset.note]??={}).note=n.value;save()}});
function upd(){document.getElementById('count').textContent=boxes.filter(b=>b.checked).length+' / '+boxes.length+' verificate'}
document.getElementById('copy').onclick=()=>{const t=boxes.map(b=>{const s=st[b.dataset.id]||{};return b.dataset.id+': '+(s.ok?'OK':'da verificare')+(s.note?' - '+s.note:'')}).join('\\n');navigator.clipboard.writeText(t)};
upd();
</script></body></html>`;
fs.writeFileSync(path.join(out, 'carte.html'), html);
console.log('review/carte.html');
