# Uso: blender -b -P sheet.py -- <indir> <out> <cols> [webp quality] [bg r,g,b]
import bpy, sys, os, numpy as np
argv = sys.argv[sys.argv.index('--')+1:]
indir, out, cols = argv[0], argv[1], int(argv[2])
q = int(argv[3]) if len(argv) > 3 else 0
bg = [float(x) for x in argv[4].split(',')] if len(argv) > 4 else None
files = sorted(f for f in os.listdir(indir) if f.endswith('.png'))
imgs = [bpy.data.images.load(os.path.join(indir, f)) for f in files]
w, h = imgs[0].size; rows = (len(imgs) + cols - 1) // cols
big = np.zeros((rows * h, cols * w, 4), dtype=np.float32)
for i, im in enumerate(imgs):
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)
    r, c = i // cols, i % cols
    y0 = (rows - 1 - r) * h  # i pixel di Blender partono dal basso
    big[y0:y0 + h, c * w:(c + 1) * w] = a
if bg:
    al = big[..., 3:4]; big[..., :3] = big[..., :3] * al + np.array(bg) * (1 - al); big[..., 3] = 1
out_im = bpy.data.images.new('sheet', cols * w, rows * h, alpha=True)
out_im.pixels = big.ravel()
sc = bpy.context.scene
s = sc.render.image_settings
if out.endswith('.webp'):
    s.file_format = 'WEBP'; s.color_mode = 'RGBA'; s.quality = q or 85
else:
    s.file_format = 'PNG'; s.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
out_im.save_render(out, scene=sc)
print('SHEET', out, cols * w, rows * h, os.path.getsize(out))
