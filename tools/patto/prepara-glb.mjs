// Primo passo di ottimizza.sh: prepara il GLB Meshy con scheletro prima della compressione.
// Uso (lo lancia ottimizza.sh da una cartella con @gltf-transform/cli installato):
//   node prepara-glb.mjs <con-scheletro.glb> <con-texture.glb> <uscita.glb>
// 1. texture: il modello con scheletro ha lo stesso UV di quello "solo texture", ma i colori spenti e la
//    texture usata anche come emissiva (Patto sembrerebbe senza luci). Prende colore e rilievo dal secondo.
// 2. pesi: come fix_pesi.py, il foglio (corpo color panna) segue solo la colonna (Hips … Head), così le
//    braccia non lo accartocciano quando la mano lo tocca. Le parti lavanda (braccia) restano come sono.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';

const [rigPath, texPath, outPath] = process.argv.slice(2);
if (!outPath) throw new Error('uso: node prepara-glb.mjs <con-scheletro.glb> <con-texture.glb> <uscita.glb>');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(rigPath);
const src = (await io.read(texPath)).getRoot().listMaterials()[0];

// ---- 1. materiale ----
const mat = doc.getRoot().listMaterials()[0];
const color = src.getBaseColorTexture().getImage();
mat.getBaseColorTexture().setImage(color).setMimeType(src.getBaseColorTexture().getMimeType());
mat.setNormalTexture(doc.createTexture('rilievo').setImage(src.getNormalTexture().getImage()).setMimeType(src.getNormalTexture().getMimeType()));
mat.setEmissiveTexture(null).setEmissiveFactor([0, 0, 0]).setMetallicFactor(0).setRoughnessFactor(0.75);

// ---- 2. pesi ----
const SPINA = new Set(['mixamorig:Hips', 'mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2', 'mixamorig:Neck', 'mixamorig:Head', 'headfront']);
const joints = doc.getRoot().listSkins()[0].listJoints().map((j) => j.getName());
const spina = new Set(joints.flatMap((n, i) => (SPINA.has(n) ? [i] : [])));
const spine1 = joints.indexOf('mixamorig:Spine1');

const { data: px, info } = await sharp(Buffer.from(color)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION'), uv = prim.getAttribute('TEXCOORD_0');
const J = prim.getAttribute('JOINTS_0'), Wt = prim.getAttribute('WEIGHTS_0');
const n = pos.getCount();

// glTF: Y in alto, metri, posa di riposo (in Blender era Z)
let corpo = new Uint8Array(n), zona = new Uint8Array(n);
const p = [], t = [];
for (let i = 0; i < n; i++) {
  pos.getElement(i, p); uv.getElement(i, t);
  const x = Math.min(W - 1, Math.max(0, Math.floor((((t[0] % 1) + 1) % 1) * (W - 1))));
  const y = Math.min(H - 1, Math.max(0, Math.floor((((t[1] % 1) + 1) % 1) * (H - 1))));
  const k = (y * W + x) * 4, r = px[k] / 255, g = px[k + 1] / 255, b = px[k + 2] / 255;
  const lavanda = b - r > 0.08 && b - g > 0.1;
  // dove può stare il foglio: sopra le scarpe e, sotto le spalle, dentro la sua larghezza (lì ci sono le mani)
  zona[i] = p[1] > 0.3 && (Math.abs(p[0]) < 0.4 || p[1] > 0.75) ? 1 : 0;
  corpo[i] = !lavanda && zona[i] ? 1 : 0;
}
// i colori ai bordi delle isole UV sbagliano qualche vertice: voto di maggioranza tra i vicini
const idx = prim.getIndices().getArray();
const seen = new Set(), ea = [], eb = [];
for (let f = 0; f < idx.length; f += 3) {
  for (const [a, b] of [[idx[f], idx[f + 1]], [idx[f + 1], idx[f + 2]], [idx[f + 2], idx[f]]]) {
    const key = Math.min(a, b) * n + Math.max(a, b);
    if (!seen.has(key)) { seen.add(key); ea.push(a); eb.push(b); }
  }
}
for (let pass = 0; pass < 4; pass++) {
  const vic = new Float32Array(n), tot = new Float32Array(n);
  for (let e = 0; e < ea.length; e++) {
    vic[ea[e]] += corpo[eb[e]]; vic[eb[e]] += corpo[ea[e]];
    tot[ea[e]]++; tot[eb[e]]++;
  }
  const next = new Uint8Array(n);
  for (let i = 0; i < n; i++) next[i] = (tot[i] > 0 ? (vic[i] + corpo[i]) / (tot[i] + 1) > 0.5 : corpo[i]) && zona[i] ? 1 : 0;
  corpo = next;
}
let corretti = 0, nCorpo = 0;
const jj = [], ww = [];
for (let i = 0; i < n; i++) {
  if (!corpo[i]) continue;
  nCorpo++;
  J.getElement(i, jj); Wt.getElement(i, ww);
  const usati = [0, 1, 2, 3].filter((s) => ww[s] > 0);
  const keep = usati.filter((s) => spina.has(jj[s]));
  if (keep.length === usati.length) continue;
  const somma = keep.reduce((s, k) => s + ww[k], 0);
  const nj = [0, 0, 0, 0], nw = [0, 0, 0, 0];
  if (somma <= 0) { nj[0] = spine1; nw[0] = 1; }
  else keep.forEach((s, k) => { nj[k] = jj[s]; nw[k] = ww[s] / somma; });
  J.setElement(i, nj); Wt.setElement(i, nw);
  corretti++;
}
console.log(`PESI ${nCorpo} vertici corpo, ${corretti} corretti`);
await io.write(outPath, doc);
