# Stato "pensa": mano destra al mento (IK), corpo che oscilla piano con perno ai piedi.
# Ciclo di N fotogrammi chiuso su se stesso. Lo esegue rend.py, che passa arm, sc, bpy, math.
# I valori si possono provare senza modificare il file: PENSA="{'rh': (x, y, z)}" (metri, Z in alto).
import math
import os
N = 32
P = dict(rh=(-0.15, -0.27, 0.91), rpole=(-0.8, -0.1, 0.5), pa=-100.0, yaw=5.0, tilt=3.5)
P.update(eval(os.environ.get('PENSA', '{}')))

def empty(name, loc):
    e = bpy.data.objects.new(name, None); e.location = loc; sc.collection.objects.link(e); return e

# posa di partenza: il primo fotogramma del saluto (gambe e busto naturali), resa statica
arm.animation_data_create(); arm.animation_data.action = bpy.data.actions['Big_Wave_Hello']
sc.frame_set(0)
base = {b.name: b.matrix_basis.copy() for b in arm.pose.bones}
arm.animation_data.action = None
for b in arm.pose.bones: b.matrix_basis = base[b.name]

rt, rp = empty('rh', P['rh']), empty('rp', P['rpole'])
c = arm.pose.bones['mixamorig:RightForeArm'].constraints.new('IK')
c.target, c.pole_target, c.pole_angle, c.chain_count = rt, rp, math.radians(P['pa']), 2

sc.frame_start, sc.frame_end = 0, N - 1
for f in range(N + 1):
    t = 2 * math.pi * f / N
    arm.rotation_euler = (0, math.radians(P['tilt'] * math.sin(t)), math.radians(P['yaw'] * math.sin(t)))
    arm.keyframe_insert('rotation_euler', frame=f)
    rt.location = (P['rh'][0], P['rh'][1], P['rh'][2] + 0.025 * math.sin(2 * t))  # picchietta il mento
    rt.keyframe_insert('location', frame=f)
