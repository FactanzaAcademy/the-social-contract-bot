# Primo passo di ottimizza.sh: aggiunge l'azione "Idle" (idle.py) al modello Meshy con scheletro e lo
# riesporta in GLB con tutte le animazioni. Uso: blender -b -P aggiungi-idle.py -- <con-scheletro.glb> <uscita.glb>
import bpy, sys, os, runpy, math
src, out = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
for o in list(sc.objects):
    if o.name.startswith('Icosphere'): bpy.data.objects.remove(o)  # sfera di servizio di Meshy
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'idle.py'), init_globals={'arm': arm, 'sc': sc, 'bpy': bpy, 'math': math})
for a in bpy.data.actions: a.use_fake_user = True
arm.animation_data.action = None
for pb in arm.pose.bones: pb.matrix_basis.identity()
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animation_mode='ACTIONS', export_force_sampling=True, export_yup=True)
print('IDLE-GLB', out, sorted(a.name for a in bpy.data.actions))
