# Uso: blender -b -P rend.py -- <glb> <outdir> <action|-> <frames comma> <size> [pose.py]
import bpy, sys, math, os, runpy
argv = sys.argv[sys.argv.index('--')+1:]
src, outdir, action, frames, size = argv[0], argv[1], argv[2], [float(f) for f in argv[3].split(',')], int(argv[4])
posefile = argv[5] if len(argv) > 5 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc = bpy.context.scene
for o in list(sc.objects):
    if o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
arm = next((o for o in sc.objects if o.type=='ARMATURE'), None)
for m in bpy.data.materials:
    if m.use_nodes:
        p = m.node_tree.nodes.get('Principled BSDF')
        if p:
            p.inputs['Roughness'].default_value = 0.75
            for k in ('Specular IOR Level', 'Specular'):
                if k in p.inputs: p.inputs[k].default_value = 0.25
if arm and os.environ.get('TEX_GLB'):
    runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trasferisci.py'), init_globals={'sc': sc, 'bpy': bpy, 'arm': arm, 'TEX_GLB': os.environ['TEX_GLB']})
if arm and os.environ.get('FIX_PESI'):
    runpy.run_path(os.environ['FIX_PESI'], init_globals={'sc': sc, 'bpy': bpy})
if arm:
    if action != '-':
        arm.animation_data.action = bpy.data.actions[action]
    elif arm.animation_data: arm.animation_data.action = None
    if posefile: runpy.run_path(posefile, init_globals={'arm': arm, 'sc': sc, 'bpy': bpy, 'math': math})
# camera fissa per tutti gli stati
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.9
cam.location = (0, -6, 0.80); cam.rotation_euler = (math.radians(90), 0, 0); sc.camera = cam
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (1, 0.97, 0.95, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.55
def light(kind, energy, rot, size=1):
    l = bpy.data.objects.new(kind, bpy.data.lights.new(kind, kind)); l.data.energy = energy
    l.rotation_euler = [math.radians(r) for r in rot]; sc.collection.objects.link(l); return l
light('SUN', 2.6, (55, 0, -35))
light('SUN', 0.8, (70, 0, 140))
sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
sc.view_settings.view_transform = 'Standard'
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = size
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
os.makedirs(outdir, exist_ok=True)
for i, f in enumerate(frames):
    sc.frame_set(int(f), subframe=f - int(f))
    sc.render.filepath = os.path.join(outdir, f'f{i:03d}.png')
    bpy.ops.render.render(write_still=True)
print('DONE', len(frames), bpy.app.version_string)
