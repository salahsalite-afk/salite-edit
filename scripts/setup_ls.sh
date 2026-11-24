#!/usr/bin/env bash
# RAM-Dateien für das Longsleeve-Video (src/bf/LongsleeveTikTok.tsx), z. B. nach einem Neustart.
# bash scripts/setup_ls.sh
set -e
cd "$(dirname "$0")/.."
D=/dev/shm/ls
S=$D/src
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
mkdir -p $D/img $S /dev/shm/rtmp /dev/shm/prev
dl() { [ -s "$S/$1" ] || curl -sSL --max-time 900 -o "$S/$1" "https://drive.usercontent.google.com/download?id=$2&export=download&confirm=t"; }
dl long.mov 1SNZ3fwjL43ObFpClmv4q057oCrluFsDw     # Video (4K, SDR, Ton 44,1 kHz)
dl glitzer.png 1xonTmCl3llHDd0t86zRD3AVPAZ49Cs20  # Glitzersteine (grauer Trackie)
[ -s $D/clip.mp4 ] || ffmpeg -v error -y -threads 4 -i $S/long.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/clip.mp4
.venv/bin/python - <<'EOF'
from PIL import Image
U = "/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a"
S = "/dev/shm/ls/src"
M = "/dev/shm/ls/img"
def rgb(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); return bg
    return im.convert("RGB")
src = {
    "ls_model": f"{U}/2f3d0970-image.jpg", "ls_patch": f"{U}/5203d307-image.jpg", "ls_flat": f"{U}/48a463ce-image.jpg",
    "ls_logo": f"{U}/e332ebeb-image.jpg", "puff": f"{U}/c54269a9-image.jpg", "stack": f"{U}/493c62bd-image.jpg",
    "poster": f"{U}/d5352b9d-image.png", "glitzer": f"{S}/glitzer.png",
}
for name, p in src.items():
    im = rgb(p)
    if im.width > 1100:
        im = im.resize((1100, round(1100 * im.height / im.width)), Image.LANCZOS)
    im.save(f"{M}/{name}.jpg", quality=94)
    print(name, im.size)
# grauer Trackie aus dem Poster (Originalauflösung, ohne Preise)
rgb(src["poster"]).crop((0, 800, 290, 1530)).save(f"{M}/poster_grey.jpg", quality=95)
EOF
mkdir -p public_ls
ln -sfn ../public/fonts public_ls/fonts
ln -sfn ../public/brand public_ls/brand
ln -sfn $D public_ls/ls
grep -q public_ls .gitignore || echo "public_ls/" >> .gitignore
echo "LS bereit"
