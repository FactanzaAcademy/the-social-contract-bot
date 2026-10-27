// Build: un unico index.html autonomo (JS e CSS inline) + le immagini delle carte.
import * as esbuild from 'esbuild';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { privacyDaCompletare } from '../src/kb/privacy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (privacyDaCompletare()) console.warn('ATTENZIONE: l\'informativa privacy (src/kb/privacy.js) ha ancora parti [da completare]: non pubblicare così.');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'cards'), { recursive: true });

// versione dei file di Patto nell'indirizzo: un modello nuovo non resta nascosto dalla cache del browser
const versione = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(root, 'public/patto', f))).digest('hex').slice(0, 8);
const js = await esbuild.build({
  entryPoints: [path.join(root, 'src/ui/app.js')],
  define: { __PATTO_GLB__: JSON.stringify(`patto/patto.glb?v=${versione('patto.glb')}`), __PATTO_POSTER__: JSON.stringify(`patto/patto-poster.webp?v=${versione('patto-poster.webp')}`) },
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020', 'safari14'],
  write: false,
  legalComments: 'none',
});
const css = await esbuild.build({ entryPoints: [path.join(root, 'src/ui/style.css')], bundle: true, minify: true, write: false });

// Caratteri ospitati nel bot (pacchetti @fontsource, licenza OFL) invece di Google Fonts: nessun
// fornitore esterno riceve l'IP dei visitatori per i caratteri. Solo i sottoinsiemi latin e latin-ext.
const FONTS = [['poppins', [400, 500, 600, 700]], ['barlow-condensed', [600, 700]]];
const fontFiles = [];
let fontFaces = '';
for (const [pkg, weights] of FONTS) {
  for (const w of weights) {
    const cssText = fs.readFileSync(path.join(root, 'node_modules/@fontsource', pkg, `${w}.css`), 'utf8');
    for (const block of cssText.split('/*').slice(1)) {
      const sub = block.match(/^ [\w-]+?-(latin|latin-ext)-\d+-normal \*\//);
      if (!sub) continue;
      const file = block.match(/url\(\.\/files\/([\w-]+\.woff2)\)/)[1];
      fontFiles.push([pkg, file]);
      fontFaces += block.slice(block.indexOf('@font-face')).replace(/src:[^;]+;/, `src:url(fonts/${file}) format('woff2');`).replace(/\s+/g, ' ');
    }
  }
}

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Social Contract · Assistente alle regole</title>
<meta name="description" content="Chiedi a Patto le regole di The Social Contract, il gioco da tavolo di Factanza: risposte brevi dell'AI basate solo sul regolamento ufficiale e sulle carte, con le fonti da aprire e i calcoli di offerte e punteggi.">
<meta property="og:title" content="The Social Contract · Assistente alle regole">
<meta property="og:description" content="Dubbi sulle regole di The Social Contract? Chiedi a Patto: risponde dal regolamento ufficiale.">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#fbf2e2">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'><rect width=\'64\' height=\'64\' rx=\'16\' fill=\'#7e3a3b\'/><text x=\'32\' y=\'41\' font-family=\'Arial Narrow,Arial,sans-serif\' font-weight=\'700\' font-size=\'24\' text-anchor=\'middle\' fill=\'#fbe9d8\'>TSC</text></svg>')}">
<style>${fontFaces}${css.outputFiles[0].text}</style>
</head>
<body>
<main id="app" class="app"></main>
<script>${js.outputFiles[0].text}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dist, 'index.html'), html);
for (const f of fs.readdirSync(path.join(root, 'public/cards'))) fs.copyFileSync(path.join(root, 'public/cards', f), path.join(dist, 'cards', f));
fs.mkdirSync(path.join(dist, 'model'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'public/model'))) fs.copyFileSync(path.join(root, 'public/model', f), path.join(dist, 'model', f));
fs.copyFileSync(path.join(root, 'public/config.json'), path.join(dist, 'config.json'));
fs.mkdirSync(path.join(dist, 'brand'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'public/brand')).filter((f) => f.endsWith('.web.png'))) fs.copyFileSync(path.join(root, 'public/brand', f), path.join(dist, 'brand', f));
// Patto 3D: modello, immagine statica e model-viewer (servito da qui, niente CDN; si carica dopo il primo disegno)
fs.mkdirSync(path.join(dist, 'patto'), { recursive: true });
for (const f of ['patto.glb', 'patto-poster.webp']) fs.copyFileSync(path.join(root, 'public/patto', f), path.join(dist, 'patto', f));
fs.mkdirSync(path.join(dist, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(root, 'node_modules/@google/model-viewer/dist/model-viewer.min.js'), path.join(dist, 'vendor/model-viewer.min.js'));
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
for (const [pkg, file] of fontFiles) fs.copyFileSync(path.join(root, 'node_modules/@fontsource', pkg, 'files', file), path.join(dist, 'fonts', file));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
const kb = (fs.statSync(path.join(dist, 'index.html')).size / 1024).toFixed(0);
console.log(`dist/index.html ${kb} KB + ${fs.readdirSync(path.join(dist, 'cards')).length} carte`);
