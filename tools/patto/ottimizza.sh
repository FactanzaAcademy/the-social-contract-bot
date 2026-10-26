#!/bin/zsh
# Rigenera public/patto/patto.glb (Patto 3D per <model-viewer>) dai due file Meshy.
# Uso (da bot/): tools/patto/ottimizza.sh <con-scheletro.glb> <con-texture.glb>
# es. tools/patto/ottimizza.sh ~/Downloads/Meshy_AI_patto_rigged_All_Animations.glb ~/Downloads/Meshy_AI_patto_character_3d_…_texture.glb
# Da 31 MB a meno di 1 MB: texture 1024 WebP, mesh semplificata a ~23k triangoli, compressione meshopt
# (il decodificatore è già dentro model-viewer; Draco e KTX2 invece lo scaricherebbero da un CDN).
# Scheletro e nomi delle animazioni Meshy restano invariati; si aggiunge "Idle" (Blender). gltf-transform è installato a parte, a versione fissa.
set -e
RIG=${1:?indica il file .glb con lo scheletro}
TEX=${2:?indica il file .glb con la texture}
OUT=public/patto/patto.glb
V=4.5.1
TMP=$(mktemp -d)
npm i --prefix $TMP --no-save --no-audit --no-fund --silent @gltf-transform/cli@$V
cp tools/patto/prepara-glb.mjs $TMP/  # da lì trova @gltf-transform/core e sharp
G=$TMP/node_modules/.bin/gltf-transform

# 0. Blender aggiunge l'animazione "Idle" (tools/patto/idle.py): Meshy non la dà
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
"$B" -b --factory-startup -P tools/patto/aggiungi-idle.py -- "$RIG" $TMP/0.glb 2>&1 | grep -E 'IDLE-GLB|Error|Traceback' || true
node $TMP/prepara-glb.mjs $TMP/0.glb "$TEX" $TMP/1.glb
$G weld $TMP/1.glb $TMP/2.glb
$G simplify $TMP/2.glb $TMP/3.glb --ratio 0.1 --error 0.01
$G resample $TMP/3.glb $TMP/4.glb
$G resize $TMP/4.glb $TMP/5.glb --width 1024 --height 1024
$G webp $TMP/5.glb $TMP/6.glb --quality 85
$G meshopt $TMP/6.glb $OUT
$G inspect $OUT | grep -E 'TRIANGLES|image/webp|Big_Wave|Confused|Walking|Running|Idle'
ls -l $OUT
