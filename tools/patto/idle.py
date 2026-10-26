# Crea l'azione "Idle" di Patto: posa naturale (primo fotogramma del saluto) che respira e ondeggia
# piano, 3 s in ciclo chiuso. Le rotazioni sono nello spazio dell'armatura (Z in alto, -Y verso chi guarda).
import bpy, math, mathutils
N = 72  # 3 s a 24 fps
arm.animation_data_create(); arm.animation_data.action = bpy.data.actions['Big_Wave_Hello']
sc.frame_set(0)
base = {b.name: b.matrix.copy() for b in arm.pose.bones}   # pose space
arm.animation_data.action = None
act = bpy.data.actions.new('Idle'); arm.animation_data.action = act
# (osso, asse, ampiezza in gradi, armonica, fase)
MOTI = {
    'mixamorig:Hips': [((0, 0, 1), 3.5, 1, 0.0), ((0, 1, 0), 1.2, 1, 0.25)],
    'mixamorig:Spine1': [((1, 0, 0), 1.5, 2, 0.0)],          # respiro: avanti e indietro, due volte per ciclo
    'mixamorig:Neck': [((0, 1, 0), 3.0, 1, 0.5), ((1, 0, 0), 1.5, 2, 0.3)],
    'mixamorig:LeftArm': [((0, 1, 0), 4.0, 1, 0.1)],
    'mixamorig:RightArm': [((0, 1, 0), -4.0, 1, 0.6)],
}
order = [b for b in arm.pose.bones]  # già in ordine genitore → figlio nell'import glTF
for f in range(N + 1):
    t = 2 * math.pi * f / N
    for pb in order:
        pb.matrix_basis = mathutils.Matrix.Identity(4)
    bpy.context.view_layer.update()
    for pb in order:
        m = base[pb.name]
        if pb.parent is not None:
            # il genitore è già stato messo: riparto dalla relazione di base genitore → figlio
            m = pb.parent.matrix @ (base[pb.parent.name].inverted() @ base[pb.name])
        for ax, amp, k, ph in MOTI.get(pb.name, []):
            head = m.to_translation()
            r = mathutils.Matrix.Rotation(math.radians(amp) * math.sin(k * t + 2 * math.pi * ph), 4, ax)
            m = mathutils.Matrix.Translation(head) @ r @ mathutils.Matrix.Translation(-head) @ m
        pb.matrix = m
        bpy.context.view_layer.update()
    for pb in order:
        pb.rotation_mode = 'QUATERNION'
        pb.keyframe_insert('rotation_quaternion', frame=f, group=pb.name)
        pb.keyframe_insert('location', frame=f, group=pb.name)
        pb.keyframe_insert('scale', frame=f, group=pb.name)
act.use_fake_user = True
sc.frame_start, sc.frame_end = 0, N - 1
print('IDLE', len(act.fcurves) if hasattr(act, 'fcurves') else 'ok')
