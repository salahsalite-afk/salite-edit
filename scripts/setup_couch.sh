#!/usr/bin/env bash
# RAM-Dateien für das Couch-Dialog-Video (src/bf/CouchTikTok.tsx), z. B. nach einem Neustart.
# bash scripts/setup_couch.sh
set -e
cd "$(dirname "$0")/.."
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
D=/dev/shm/au
mkdir -p $D/src $D/img $D/snd /dev/shm/rtmp /dev/shm/prev
[ -s $D/src/v.mov ] || curl -sSL --max-time 900 -o $D/src/v.mov "https://drive.usercontent.google.com/download?id=1MWN3BCD6Shl3cVQ79WBFKjVj833ia6aF&export=download&confirm=t"
# Proxy 1440x2560 (Original 4K hochkant, 60 fps, SDR; ffmpeg dreht automatisch), Spielraum für Zoomsprünge bis 1,33
[ -s $D/clip.mp4 ] || ffmpeg -v error -y -threads 4 -i $D/src/v.mov -map 0:v:0 -vf "scale=1440:2560:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/clip.mp4
# Detail der Jogger (Glitzersteine, Puffprint) direkt aus dem 4K-Bild: 1350x2400 um das Logo, 1,5 bis 6,2 s
[ -s $D/detail.mp4 ] || ffmpeg -v error -y -ss 1.5 -t 4.7 -i $D/src/v.mov -map 0:v:0 -vf "crop=1350:2400:105:1280" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/detail.mp4
.venv/bin/python - <<'PY'
from PIL import Image
U = "/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a"
im = Image.open(f"{U}/493c62bd-image.jpg").convert("RGB")
im.resize((1100, round(1100 * im.height / im.width)), Image.LANCZOS).save("/dev/shm/au/img/stack.jpg", quality=94)
print("Bild ok")
PY
.venv/bin/python scripts/coin_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/cut_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/main_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/models_sfx.py $D/snd > /dev/null
cp sfx/whoosh_soft.wav sfx/click.wav sfx/hit_low.wav sfx/keyboard_tap1.wav sfx/keyboard_tap2.wav sfx/keyboard_tap3.wav $D/snd/
mkdir -p public_au
ln -sfn ../public/fonts public_au/fonts
ln -sfn ../public/brand public_au/brand
ln -sfn $D public_au/au
grep -q public_au .gitignore || echo "public_au/" >> .gitignore
echo "Couch bereit"
