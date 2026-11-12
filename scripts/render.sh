#!/usr/bin/env bash
# Voller Render nach CLAUDE.md Abschnitt 2
# 1) Remotion: H.264, CRF 16, yuv420p, bt709 (siehe remotion.config.ts)
# 2) ffmpeg: Lautheit auf -14 LUFS (nur Pegel, kein Filter auf der Stimme), AAC 320 kbit/s, 48 kHz, Bild wird kopiert
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render src/index.ts Main out/master.mp4 --log=info --scale=${SCALE:-1} --concurrency=${CONC:-2}
M=$(ffmpeg -hide_banner -i out/master.mp4 -vn -af loudnorm=I=-14:TP=-1:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -y -i out/master.mp4 -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=20:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/salite_final.mp4
echo FERTIG
