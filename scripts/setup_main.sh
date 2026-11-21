#!/usr/bin/env bash
# Stellt die RAM-Dateien für das Main-TikTok (src/bf/MainTikTok.tsx) wieder her, z. B. nach einem Neustart.
# bash scripts/setup_main.sh
set -e
cd "$(dirname "$0")/.."
M=/dev/shm/main
S=/dev/shm/mainsrc
U=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a
mkdir -p $M/img $M/snd $S /dev/shm/rtmp
dl() { [ -s "$S/$1" ] || curl -sSL --max-time 900 -o "$S/$1" "https://drive.usercontent.google.com/download?id=$2&export=download&confirm=t"; }
dl main.mov 1whXjEflw8meIeP2qHny3tuA2NTUwf0Fx      # Main-Video (4K, SDR)
dl web.mp4 197jQi2zP83ANX6IcOlD3GVxcU6Dkw_tO       # Handy mit Passwort-Seite
dl orders.mp4 1A1-660DJYuePE0_fKmXndXY7L_XJIONk    # Shopify-Mitteilungen
dl beat.mov 1elDEjdC1zWpRdR16o2Cz5OfJcjseWa35      # Beat (wie Beat-Schnitt)
dl nummer_2.mov 1mCKCWUN20BF9irAC40XN4FA2yUGqGuyF  # Puff-Print
dl glitzer.png 1xonTmCl3llHDd0t86zRD3AVPAZ49Cs20
dl schnee.mov 172ssjLix-KXm7LQ0rKPuPw9fd0MQFZCR
[ -s $S/poster.png ] || cp $U/d5352b9d-image.png $S/poster.png
[ -s $S/stack_chat.jpg ] || cp $U/493c62bd-image.jpg $S/stack_chat.jpg

[ -s $M/main.mp4 ] || ffmpeg -v error -y -threads 4 -i $S/main.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -c:a aac -b:a 320k -ar 48000 $M/main.mp4
[ -s $M/web.mp4 ] || ffmpeg -v error -y -i $S/web.mp4 -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $M/web.mp4
[ -s $M/orders.mp4 ] || ffmpeg -v error -y -i $S/orders.mp4 -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $M/orders.mp4
[ -s $M/schnee.mp4 ] || ffmpeg -v error -y -i $S/schnee.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $M/schnee.mp4
[ -s $M/beat.wav ] || ffmpeg -v error -y -i $S/beat.mov -vn -ac 2 -ar 48000 $M/beat.wav
# Puff-Print: Ausschnitt um das Brust-Logo aus dem 4K-HDR-Original, nach SDR, 900x900 (verkleinert)
HDR="zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"
if [ ! -s $M/puff.mp4 ]; then
  # Anzeigebreite (Drehung beachten, ffmpeg dreht vor den Filtern)
  W=$(ffprobe -v error -select_streams v -show_entries stream=width,height:stream_side_data=rotation -of csv=p=0 $S/nummer_2.mov | python3 -c "import sys; v=sys.stdin.read().replace(',',' ').split(); w,h=int(v[0]),int(v[1]); r=abs(int(v[-1])) if len(v)>2 and v[-1].lstrip('-').isdigit() else 0; print(h if r in (90,270) else w)")
  # Logo liegt im 1080x1920-Bild bei etwa (620, 720)
  K=$(python3 -c "print($W/1080)")
  C=$(python3 -c "print(int(560*$K)//2*2)")
  X=$(python3 -c "print(int(620*$K - $C/2))")
  Y=$(python3 -c "print(int(720*$K - $C/2))")
  ffmpeg -v error -y -i $S/nummer_2.mov -vf "crop=$C:$C:$X:$Y,$HDR,scale=900:900:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $M/puff.mp4
fi
.venv/bin/python - <<'EOF'
from PIL import Image
S, M = "/dev/shm/mainsrc", "/dev/shm/main/img"
def rgb(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); return bg
    return im.convert("RGB")
rgb(f"{S}/poster.png").save(f"{M}/poster.jpg", quality=95)
rgb(f"{S}/glitzer.png").save(f"{M}/glitzer.jpg", quality=95)
im = rgb(f"{S}/stack_chat.jpg"); im.resize((1080, round(1080 * im.height / im.width)), Image.LANCZOS).save(f"{M}/stack.jpg", quality=95)
print("Bilder ok")
EOF
mkdir -p public_main
ln -sfn ../public/fonts public_main/fonts
ln -sfn ../public/sfx public_main/sfx
ln -sfn ../public/brand public_main/brand
ln -sfn ../public/bf public_main/bf
ln -sfn $M public_main/main
grep -q public_main .gitignore || echo "public_main/" >> .gitignore
echo "Main bereit"
