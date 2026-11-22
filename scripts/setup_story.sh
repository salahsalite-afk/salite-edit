#!/usr/bin/env bash
# RAM-Dateien für das Story-TikTok "Freundin fremdgegangen" (src/bf/StoryTikTok.tsx), z. B. nach einem Neustart.
# bash scripts/setup_story.sh
set -e
cd "$(dirname "$0")/.."
D=/dev/shm/story
S=$D/src
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
mkdir -p $D/img $D/snd $S /dev/shm/rtmp
dl() { [ -s "$S/$1" ] || curl -sSL --max-time 900 -o "$S/$1" "https://drive.usercontent.google.com/download?id=$2&export=download&confirm=t"; }
dl story.mov 1grtmTjN3wo6lLX7_mevjuSfeQMyEAQ5O   # Hauptvideo (4K, SDR)
dl beat.mov 1elDEjdC1zWpRdR16o2Cz5OfJcjseWa35     # Beat wie Beat-Schnitt
dl web.mp4 197jQi2zP83ANX6IcOlD3GVxcU6Dkw_tO      # Handy mit Passwort-Seite
[ -s $D/story.mp4 ] || ffmpeg -v error -y -threads 4 -i $S/story.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -c:a aac -b:a 320k -ar 48000 $D/story.mp4
[ -s $D/web.mp4 ] || ffmpeg -v error -y -i $S/web.mp4 -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/web.mp4
[ -s $D/beat.wav ] || ffmpeg -v error -y -i $S/beat.mov -vn -ac 2 -ar 48000 $D/beat.wav
.venv/bin/python - <<'EOF'
from PIL import Image
U = "/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a"
M = "/dev/shm/story/img"
def rgb(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); return bg
    return im.convert("RGB")
for f, name in (("e2e65880-image.png", "paar"), ("57425824-image.jpg", "billard"), ("6cb6d3ee-image.jpg", "selfie"),
                ("c54269a9-image.jpg", "puff"), ("493c62bd-image.jpg", "stack"), ("d5352b9d-image.png", "poster")):
    im = rgb(f"{U}/{f}")
    if im.width > 1100:
        im = im.resize((1100, round(1100 * im.height / im.width)), Image.LANCZOS)
    im.save(f"{M}/{name}.jpg", quality=94)
    print(name, im.size)
EOF
.venv/bin/python scripts/story_sfx.py $D/snd
.venv/bin/python scripts/main_sfx.py $D/snd > /dev/null
.venv/bin/python scripts/cut_sfx.py $D/snd > /dev/null
mkdir -p public_story
ln -sfn ../public/fonts public_story/fonts
ln -sfn ../public/sfx public_story/sfx
ln -sfn ../public/brand public_story/brand
ln -sfn ../public/bf public_story/bf
ln -sfn $D public_story/story
grep -q public_story .gitignore || echo "public_story/" >> .gitignore
echo "Story bereit"
