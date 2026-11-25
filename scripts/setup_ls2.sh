#!/usr/bin/env bash
# RAM-Dateien für Longsleeve-Video 2 (src/bf/LongsleeveTikTok2.tsx), z. B. nach einem Neustart.
# bash scripts/setup_ls2.sh
set -e
cd "$(dirname "$0")/.."
D=/dev/shm/ls2
S=$D/src
mkdir -p $D/img $D/snd $S /dev/shm/rtmp /dev/shm/prev
[ -s $S/v.mov ] || curl -sSL --max-time 900 -o $S/v.mov "https://drive.usercontent.google.com/download?id=12iNYV80lnykIJiud7dxSIk_OBrdNWKMS&export=download&confirm=t"
[ -s $D/clip.mp4 ] || ffmpeg -v error -y -threads 4 -i $S/v.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/clip.mp4
.venv/bin/python - <<'EOF'
from PIL import Image, ImageFilter
U = "/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a"
M = "/dev/shm/ls2/img"
def rgb(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); return bg
    return im.convert("RGB")
for name, f in (("ls_model", "2f3d0970-image.jpg"), ("ls_patch", "5203d307-image.jpg"), ("ls_flat", "48a463ce-image.jpg"), ("ls_logo", "e332ebeb-image.jpg")):
    im = rgb(f"{U}/{f}")
    im.resize((1100, round(1100 * im.height / im.width)), Image.LANCZOS).save(f"{M}/{name}.jpg", quality=94)
# Ibos Kommentar (TikTok-Screenshot): nur Kommentar, Bestellbild und Antwort; Name in der Lieferadresse unscharf
src = rgb(f"{U}/ab6b8236-image.png")
k = src.width / 920  # Koordinaten aus der 920 px breiten Ansicht
c = src.crop((0, round(918 * k), src.width, round(1680 * k)))
box = (round(140 * k), round((1390 - 918) * k), round(400 * k), round((1432 - 918) * k))
c.paste(c.crop(box).filter(ImageFilter.GaussianBlur(7)), box[:2])
c.save(f"{M}/ibo.jpg", quality=95)
print("Bilder ok", c.size)
EOF
.venv/bin/python scripts/coin_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/main_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/cut_sfx.py $D/snd > /dev/null
mkdir -p public_ls2
ln -sfn ../public/fonts public_ls2/fonts
ln -sfn ../public/brand public_ls2/brand
ln -sfn $D public_ls2/ls2
grep -q public_ls2 .gitignore || echo "public_ls2/" >> .gitignore
echo "LS2 bereit"
