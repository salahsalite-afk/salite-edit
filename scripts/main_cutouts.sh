#!/usr/bin/env bash
# Freistellungen für das Main-TikTok (Zahlen und Bestellungen hinter den Personen).
# bash scripts/main_cutouts.sh
# Masken liegen dauerhaft (klein, nur Alpha) in raw/main/masks, damit ein Neustart sie nicht löscht.
# Sind sie da, werden die RGBA-Bilder in Sekunden neu gebaut, sonst rechnet BiRefNet (rund 7 s pro Bild, 12 GB RAM).
set -e
cd "$(dirname "$0")/.."
M=/dev/shm/main
[ -s $M/main30.mp4 ] || ffmpeg -v error -y -i $M/main.mp4 -vf fps=30 -c:v libx264 -preset veryfast -crf 12 -pix_fmt yuv420p -an $M/main30.mp4
mkdir -p raw/main/masks $M/fg
# Name, erstes Bild, letztes Bild (exklusiv) bei 30 fps
for r in "r550 223 275" "r10 793 827" "rord 1027 1106"; do
  set -- $r
  n=$(( $3 - $2 ))
  if [ "$(ls raw/main/masks/$1 2>/dev/null | wc -l)" -ge "$n" ]; then
    .venv/bin/python - "$1" "$2" "$3" <<'EOF'
import os, subprocess, sys
import numpy as np
from PIL import Image
name, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
W, H = 1080, 1920
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "/dev/shm/main/main30.mp4", "-vf", f"trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
out = f"/dev/shm/main/fg/{name}"
os.makedirs(out, exist_ok=True)
for i in range(b - a):
    fr = np.frombuffer(raw, np.uint8, W * H * 3, i * W * H * 3).reshape(H, W, 3)
    m = np.asarray(Image.open(f"raw/main/masks/{name}/m_{i:04d}.png"))
    Image.fromarray(np.dstack([fr, m])).save(f"{out}/cut_{i:04d}.png", compress_level=1)
print(name, "aus Masken gebaut")
EOF
  else
    .venv/bin/python scripts/cutout.py $M/main30.mp4 $2 $3 $M/fg/$1 1080 1920 > $M/fg/$1.log 2>&1
    mkdir -p raw/main/masks/$1
    .venv/bin/python - "$1" <<'EOF'
import glob, sys
from PIL import Image
name = sys.argv[1]
for i, p in enumerate(sorted(glob.glob(f"/dev/shm/main/fg/{name}/cut_*.png"))):
    Image.open(p).split()[-1].save(f"raw/main/masks/{name}/m_{i:04d}.png", optimize=True)
print(name, "freigestellt, Masken gespeichert")
EOF
  fi
done
echo CUTOUTS_FERTIG
