#!/usr/bin/env bash
# RAM-Dateien für den WhatsApp-Kanal V2 (src/bf/WaChannel2.tsx), z. B. nach einem Neustart.
# bash scripts/setup_wa2.sh
set -e
cd "$(dirname "$0")/.."
D=/dev/shm/wa2
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
mkdir -p $D/snd /dev/shm/rtmp /dev/shm/prev
[ -s $D/clip.mp4 ] || ffmpeg -v error -y -threads 4 -i $U/f945d4be-IMG_6813.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/clip.mp4
[ -s $D/web_src.mp4 ] || curl -sSL --max-time 300 -o $D/web_src.mp4 "https://drive.usercontent.google.com/download?id=197jQi2zP83ANX6IcOlD3GVxcU6Dkw_tO&export=download&confirm=t"
[ -s $D/snd/ding.wav ] || .venv/bin/python scripts/story_sfx.py $D/snd > /dev/null
[ -s $D/snd/pop.wav ] || .venv/bin/python scripts/cut_sfx.py $D/snd > /dev/null
mkdir -p public_wa2
ln -sfn ../public/fonts public_wa2/fonts
ln -sfn ../public/sfx public_wa2/sfx
ln -sfn ../public/brand public_wa2/brand
ln -sfn $D public_wa2/wa2
echo "WA2 bereit"
