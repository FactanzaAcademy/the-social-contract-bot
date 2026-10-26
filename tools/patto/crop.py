# Uso: blender -b -P crop.py -- <png> <out.webp> <x0> <y0 dall'alto> <lato> <lato finale>
import bpy, sys, numpy as np
a = sys.argv[sys.argv.index('--')+1:]
src, out, x0, y0, side, fin = a[0], a[1], int(a[2]), int(a[3]), int(a[4]), int(a[5])
im = bpy.data.images.load(src); w, h = im.size
px = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)
yb = h - y0 - side
crop = px[yb:yb + side, x0:x0 + side].copy()
o = bpy.data.images.new('c', side, side, alpha=True); o.pixels = crop.ravel(); o.scale(fin, fin)
sc = bpy.context.scene; s = sc.render.image_settings; s.file_format = 'WEBP'; s.color_mode = 'RGBA'; s.quality = 85
sc.view_settings.view_transform = 'Standard'
o.save_render(out, scene=sc); print('CROP', out)
