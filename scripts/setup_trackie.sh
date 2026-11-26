#!/usr/bin/env bash
# RAM-Dateien für das Trackie-Video (src/bf/TrackieTikTok.tsx), z. B. nach einem Neustart.
# bash scripts/setup_trackie.sh
set -e
cd "$(dirname "$0")/.."
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
D=/dev/shm/tr
mkdir -p $D/src $D/img $D/snd /dev/shm/rtmp /dev/shm/prev
dl() { [ -s "$D/src/$1" ] || curl -sSL --max-time 900 -o "$D/src/$1" "https://drive.usercontent.google.com/download?id=$2&export=download&confirm=t"; }
dl v.mov 1YzfyQ12BYY2nNspx1YcLjbF5mBrdT3Wd          # Video (4K HEVC, SDR, 59,94 fps, Ton 44,1 kHz)
dl glitzer.png 1xonTmCl3llHDd0t86zRD3AVPAZ49Cs20     # Glitzersteine
# Proxy 1440x2560: Spielraum für Zoomsprünge bis 1,33 ohne Hochskalieren
[ -s $D/clip.mp4 ] || ffmpeg -v error -y -threads 4 -i $D/src/v.mov -vf "scale=1440:2560:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/clip.mp4
# Shopify-Mitteilungen (Clip aus dem Chat)
[ -s $D/orders.mp4 ] || ffmpeg -v error -y -i $U/50c3720e-0ca4f5b7a5fc42c38d90ba098628088b.mov -c:v libx264 -crf 14 -pix_fmt yuv420p -r 60 -an $D/orders.mp4
.venv/bin/python - <<'PY'
from PIL import Image
U = "/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a"
D = "/dev/shm/tr"
def rgb(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); return bg
    return im.convert("RGB")
for name, p in (("stack", f"{U}/493c62bd-image.jpg"), ("puff", f"{U}/c54269a9-image.jpg"), ("glitzer", f"{D}/src/glitzer.png"), ("poster", f"{U}/d5352b9d-image.png")):
    im = rgb(p)
    if im.width > 1100:
        im = im.resize((1100, round(1100 * im.height / im.width)), Image.LANCZOS)
    im.save(f"{D}/img/{name}.jpg", quality=94)
# Screenshot Mitteilungen: obere drei Bestellungen mit Markierung und "Bro friert keinen Winter mehr"
rgb(f"{U}/5d6e149d-image.jpg").crop((0, 80, 1206, 1110)).save(f"{D}/img/orders.jpg", quality=95)
print("Bilder ok")
PY
.venv/bin/python scripts/coin_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/cut_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/main_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/models_sfx.py $D/snd > /dev/null
cp sfx/whoosh_soft.wav sfx/click.wav sfx/keyboard_tap1.wav sfx/keyboard_tap2.wav sfx/keyboard_tap3.wav $D/snd/
mkdir -p public_tr
ln -sfn ../public/fonts public_tr/fonts
ln -sfn ../public/brand public_tr/brand
ln -sfn $D public_tr/tr
grep -q public_tr .gitignore || echo "public_tr/" >> .gitignore
echo "Trackie bereit"
