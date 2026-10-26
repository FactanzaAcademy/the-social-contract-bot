#!/bin/zsh
# Rigenera le animazioni di Patto (public/patto/*.webp) dai due file Meshy.
# Uso (da bot/): tools/patto/genera.sh <con-scheletro.glb> <con-texture.glb>
# Il modello con scheletro dà le ossa e le animazioni; quello con texture dà l'aspetto (la texture
# del modello con scheletro è rifatta a pezzetti e sbava ai bordi). trasferisci.py unisce i due,
# fix_pesi.py rende rigido il foglio perché le braccia non lo accartoccino.
# Serve Blender 4.2 o successivo (provato con 5.2). Ogni stato è una striscia orizzontale di
# fotogrammi 256×256 con trasparenza; il CSS (.patto in src/ui/style.css) la fa scorrere a 16 fps.
set -e
GLB=${1:?indica il file .glb con lo scheletro (es. Meshy_AI_patto_rigged_All_Animations.glb)}
export TEX_GLB=${2:?indica il file .glb con la texture (es. Meshy_AI_patto_character_3d_..._texture.glb)}
export FIX_PESI=$PWD/tools/patto/fix_pesi.py
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
T=tools/patto
TMP=$(mktemp -d)
OUT=public/patto
run() { "$B" -b --factory-startup -P "$@" 2>&1 | grep -E 'DONE|SHEET|CROP|Error|Traceback' || true; }

# saluto: fotogrammi 46-96 dell'animazione Meshy "Big_Wave_Hello" (24 fps), uno ogni 1,5 → 34 a 16 fps
run $T/rend.py -- "$GLB" $TMP/saluto Big_Wave_Hello $(python3 -c "print(','.join(str(46+1.5*i) for i in range(34)))") 256
# pensa: posa costruita in pose_pensa.py, 32 fotogrammi in ciclo
run $T/rend.py -- "$GLB" $TMP/pensa - $(python3 -c "print(','.join(str(i) for i in range(32)))") 256 $T/pose_pensa.py

run $T/sheet.py -- $TMP/saluto $OUT/patto-saluto.webp 34 82
run $T/sheet.py -- $TMP/pensa $OUT/patto-pensa.webp 32 82
# viso per l'avatar dei messaggi: ritaglio dell'ultimo fotogramma del saluto
run $T/crop.py -- $TMP/saluto/f033.png $OUT/patto-viso.webp 84 14 132 96
echo "Fatto. Fotogrammi intermedi in $TMP"
