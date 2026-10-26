# Correzione dei pesi dello scheletro Meshy: il foglio (corpo color panna) segue solo la colonna
# (Hips, Spine, Neck, Head); braccia e gambe non lo tirano più. Le parti lavanda (braccia) restano come sono.
import numpy as np
SPINA = {'mixamorig:Hips', 'mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2', 'mixamorig:Neck', 'mixamorig:Head', 'headfront'}
ob = next(o for o in sc.objects if o.type == 'MESH')
me = ob.data
bsdf = next(n for m in me.materials for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
img = bsdf.inputs['Base Color'].links[0].from_node.image  # la texture del colore, non quella del rilievo
W, H = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)
uv = me.uv_layers.active.data
vuv = np.zeros((len(me.vertices), 2), dtype=np.float32)
loops_v = np.zeros(len(me.loops), dtype=np.int64); me.loops.foreach_get('vertex_index', loops_v)
luv = np.zeros(len(me.loops) * 2, dtype=np.float32); uv.foreach_get('uv', luv); luv = luv.reshape(-1, 2)
vuv[loops_v] = luv
xs = np.clip((vuv[:, 0] % 1) * (W - 1), 0, W - 1).astype(int); ys = np.clip((vuv[:, 1] % 1) * (H - 1), 0, H - 1).astype(int)
col = px[ys, xs, :3]
lavanda = (col[:, 2] - col[:, 0] > 0.08) & (col[:, 2] - col[:, 1] > 0.1)
co = np.zeros(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); mw = np.array(ob.matrix_world, dtype=np.float32)
w3 = co.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3]  # metri, posa di riposo
z = w3[:, 2]
# dove può stare il foglio: sopra le scarpe e, sotto le spalle, dentro la sua larghezza (lì ci sono le mani)
zona = (z > 0.3) & ((np.abs(w3[:, 0]) < 0.40) | (z > 0.75))
corpo = (~lavanda) & zona
# i colori ai bordi delle isole UV sbagliano qualche vertice: voto di maggioranza tra i vicini
ed = np.zeros(len(me.edges) * 2, dtype=np.int64); me.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
for _ in range(int(globals().get('PASSI', 4))):
    n = np.zeros(len(corpo)); k = np.zeros(len(corpo))
    np.add.at(n, ed[:, 0], corpo[ed[:, 1]]); np.add.at(n, ed[:, 1], corpo[ed[:, 0]])
    np.add.at(k, ed[:, 0], 1); np.add.at(k, ed[:, 1], 1)
    corpo = np.where(k > 0, (n + corpo) / (k + 1) > 0.5, corpo) & zona
names = {g.index: g.name for g in ob.vertex_groups}
tolti = 0
for v in me.vertices:
    if not corpo[v.index]: continue
    gs = [(names[g.group], g.weight) for g in v.groups]
    keep = [(n, w) for n, w in gs if n in SPINA and w > 0]
    if len(keep) == len(gs): continue
    tot = sum(w for _, w in keep)
    for n, _ in gs: ob.vertex_groups[n].remove([v.index])
    if tot <= 0: keep, tot = [('mixamorig:Spine1', 1.0)], 1.0
    for n, w in keep: ob.vertex_groups[n].add([v.index], w / tot, 'REPLACE')
    tolti += 1
print('PESI', int(corpo.sum()), 'vertici corpo,', tolti, 'corretti,', int(lavanda.sum()), 'lavanda')
