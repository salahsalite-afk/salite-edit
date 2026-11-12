#!/usr/bin/env bash
# Voller Render nach CLAUDE.md Abschnitt 2
# 1) Remotion: H.264, CRF 16, yuv420p, bt709 (siehe remotion.config.ts)
# 2) ffmpeg: Lautheit auf -14 LUFS, AAC 320 kbit/s, 48 kHz, Bild wird kopiert
# Optionen: COMP (Komposition), OUT (Dateiname), SCALE, CONC,
#           FOCUS="a,b" (Sekunden): Musik in diesem Fenster dunkler und leiser (Film-Fokus)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render src/index.ts ${COMP:-Main} out/master.mp4 --log=info --scale=${SCALE:-1} --concurrency=${CONC:-2}
PRE=""
if [ -n "${FOCUS:-}" ]; then
  A=${FOCUS%,*}; B=${FOCUS#*,}
  G="clip((t-$A)/0.35\,0\,1)*clip(($B-t)/0.5\,0\,1)"
  PRE="asplit[d][w];[d]volume='1-$G':eval=frame[d2];[w]lowpass=f=600,lowpass=f=600,volume='0.42*$G':eval=frame[w2];[d2][w2]amix=inputs=2:normalize=0,"
fi
M=$(ffmpeg -hide_banner -i out/master.mp4 -vn -filter_complex "[0:a]${PRE}loudnorm=I=-14:TP=-1:LRA=20:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -y -i out/master.mp4 -c:v copy \
  -filter_complex "[0:a]${PRE}loudnorm=I=-14:TP=-1:LRA=20:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true[a]" \
  -map 0:v -map "[a]" -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/${OUT:-salite_final}.mp4
echo FERTIG
