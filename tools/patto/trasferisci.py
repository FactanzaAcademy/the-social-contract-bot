# Mette lo scheletro Meshy sul modello con la texture buona (senza scheletro): allinea il modello
# texturizzato a quello con scheletro, copia i pesi dal vertice più vicino, poi toglie la mesh vecchia.
import bpy, mathutils, numpy as np
def mesh_world(o):
    co = np.zeros(len(o.data.vertices) * 3, dtype=np.float32); o.data.vertices.foreach_get('co', co)
    mw = np.array(o.matrix_world, dtype=np.float32); return co.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3]
old = next(o for o in sc.objects if o.type == 'MESH')
prima = set(sc.objects)
bpy.ops.import_scene.gltf(filepath=TEX_GLB)
new = next(o for o in sc.objects if o not in prima and o.type == 'MESH')
for o in set(sc.objects) - prima:
    if o is not new and o.type != 'MESH': bpy.data.objects.remove(o)
A, Bv = mesh_world(old), mesh_world(new)
s = (A[:, 2].max() - A[:, 2].min()) / (Bv[:, 2].max() - Bv[:, 2].min())
off = (A.min(0) + A.max(0)) / 2 - s * (Bv.min(0) + Bv.max(0)) / 2
new.parent = None
M = mathutils.Matrix.Translation(off.tolist()) @ mathutils.Matrix.Scale(s, 4) @ new.matrix_world
new.data.transform(M); new.matrix_world = mathutils.Matrix.Identity(4)
Bv = mesh_world(new)
kd = mathutils.kdtree.KDTree(len(A))
for i, p in enumerate(A): kd.insert(p.tolist(), i)
kd.balance()
names = {g.index: g.name for g in old.vertex_groups}
src = [[(names[g.group], g.weight) for g in v.groups] for v in old.data.vertices]
for n in names.values(): new.vertex_groups.new(name=n)
dist = []
for i, p in enumerate(Bv):
    _, j, d = kd.find(p.tolist()); dist.append(d)
    for n, w in src[j]: new.vertex_groups[n].add([i], w, 'REPLACE')
m = new.modifiers.new('Armature', 'ARMATURE'); m.object = arm
bpy.data.objects.remove(old)
print('TRASFERITO scala %.4f, distanza media %.4f m, massima %.4f m' % (s, float(np.mean(dist)), float(np.max(dist))))
