#!/usr/bin/env bash
# RAM-Dateien für das Model-Casting-Video (src/bf/ModelsTikTok.tsx), z. B. nach einem Neustart.
# bash scripts/setup_models.sh
set -e
cd "$(dirname "$0")/.."
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
D=/dev/shm/v3
mkdir -p $D/src $D/img $D/snd /dev/shm/rtmp /dev/shm/prev
[ -s $D/src/v.mov ] || curl -sSL --max-time 900 -o $D/src/v.mov "https://drive.usercontent.google.com/download?id=1OI2Z5DSQ1fuai3J3-iKIwBOilQYweq3y&export=download&confirm=t"
[ -s $D/clip.mp4 ] || ffmpeg -v error -y -threads 4 -i $D/src/v.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $D/clip.mp4
# Shooting-Takes (Uploads im Chat) und Runway-Film (Trackies, Ausschnitt 7 bis 25 s, quadratisch)
[ -s $D/takeA.mp4 ] || ffmpeg -v error -y -i $U/e69ef557-28a09818-53d0-4641-b1ad-f076fedeed85.mov -c:v libx264 -crf 14 -pix_fmt yuv420p -an $D/takeA.mp4
[ -s $D/takeB.mp4 ] || ffmpeg -v error -y -i $U/cf95b5c9-51e00cbd-0339-4000-bf03-46e85c77bdaa.mov -c:v libx264 -crf 14 -pix_fmt yuv420p -r 60 -an $D/takeB.mp4
[ -s $D/takeC.mp4 ] || ffmpeg -v error -y -i $U/95ac8022-6930a111-c832-4b78-8c84-778915ade5e9.mov -c:v libx264 -crf 14 -pix_fmt yuv420p -an $D/takeC.mp4
[ -s $D/runway.mp4 ] || ffmpeg -v error -y -ss 7 -t 18 -i public/ig/source.mov -vf "crop=2160:2160:840:0,scale=1080:1080:flags=lanczos" -c:v libx264 -crf 15 -pix_fmt yuv420p -an $D/runway.mp4
[ -s $D/img/crowd.jpg ] || cp $U/10ae6042-image.jpg $D/img/crowd.jpg
# leise Klänge: Pop selbst gebaut, Rest aus sfx/
[ -s $D/snd/pop.wav ] || { .venv/bin/python scripts/cut_sfx.py /dev/shm/rtmp/csfx > /dev/null; cp /dev/shm/rtmp/csfx/pop.wav $D/snd/pop.wav; }
cp sfx/whoosh_soft.wav sfx/notify.wav sfx/click.wav sfx/keyboard_tap1.wav sfx/keyboard_tap2.wav sfx/keyboard_tap3.wav $D/snd/
mkdir -p public_v3
ln -sfn ../public/fonts public_v3/fonts
ln -sfn ../public/brand public_v3/brand
ln -sfn $D public_v3/v3
grep -q public_v3 .gitignore || echo "public_v3/" >> .gitignore
echo "Models bereit"
