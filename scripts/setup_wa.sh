#!/usr/bin/env bash
# Stellt die RAM-Dateien für den WhatsApp-Aufruf (src/bf/WaChannel.tsx) wieder her, z. B. nach einem Neustart.
# bash scripts/setup_wa.sh
set -e
cd "$(dirname "$0")/.."
SRC=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a/537281d2-IMG_4660.MOV
mkdir -p /dev/shm/wa/snd /dev/shm/rtmp
if [ ! -f /dev/shm/wa/clip.mp4 ]; then
  ffmpeg -v error -y -i "$SRC" -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 30 -an /dev/shm/wa/clip.mp4
fi
if [ ! -f /dev/shm/wa/voice.wav ]; then
  ffmpeg -v error -y -i "$SRC" -vn -ac 2 -ar 48000 /dev/shm/wa/voice_raw.wav
  PRE="highpass=f=90,afftdn=nf=-32,acompressor=threshold=0.06:ratio=3:attack=5:release=120:makeup=2"
  I=$(ffmpeg -hide_banner -i /dev/shm/wa/voice_raw.wav -af "$PRE,ebur128=framelog=quiet" -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  G=$(python3 -c "print(-14-($I)+1)")
  ffmpeg -v error -y -i /dev/shm/wa/voice_raw.wav -af "$PRE,volume=${G}dB,alimiter=limit=0.84:attack=3:release=60:level=false" -ar 48000 /dev/shm/wa/voice.wav
fi
[ -f /dev/shm/wa/snd/bell.wav ] || .venv/bin/python scripts/wa_sounds.py /dev/shm/wa/snd
mkdir -p public_wa
ln -sfn ../public/fonts public_wa/fonts
ln -sfn ../public/sfx public_wa/sfx
ln -sfn ../public/brand public_wa/brand
ln -sfn /dev/shm/wa public_wa/wa
echo "WA bereit"
