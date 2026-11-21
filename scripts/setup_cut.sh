#!/usr/bin/env bash
# Stellt die RAM-Dateien für den Beat-Schnitt (src/bf/CutBeat.tsx) wieder her, z. B. nach einem Neustart.
# bash scripts/setup_cut.sh
# Clips Nummer 1 bis 6 und Beat: Drive-Ordner 1welbrf3w_K23oEhuNK4UBxuDUHzh0O7h
# Bilder und Schnee-Clip: Drive-Ordner 1oOsLOQooYG_VrFyHw07UVzfr8eXs_OX1, Stack-Foto aus dem Chat
set -e
cd "$(dirname "$0")/.."
C=/dev/shm/cut
S=/dev/shm/cutsrc
mkdir -p $C/img $C/snd $S /dev/shm/rtmp
dl() { [ -s "$S/$1" ] || curl -sSL --max-time 900 -o "$S/$1" "https://drive.usercontent.google.com/download?id=$2&export=download&confirm=t"; }
dl beat.mov 1elDEjdC1zWpRdR16o2Cz5OfJcjseWa35
dl nummer_1.mov 1CI0KvyhNwSQWH6Mm6xNqYrska1WiKgP7
dl nummer_2.mov 1mCKCWUN20BF9irAC40XN4FA2yUGqGuyF
dl nummer_3.mov 1v9K6WxYQKXrQwBGmShOiPzpTrV2HQeh6
dl nummer_4.mov 1OezxHc_cKeusD04v49733SHrWGZd7FY6
dl nummer_5.mov 1dVuc9yklqmHfb0Wy3E0IL27jWoZJiiaA
dl nummer_6.mov 1Nk2b8aAEg3OrGZs2gi3o9X3_JKmc_Wtp
dl ls_a.png 1MVHBdUimrEJ5mJrn-1IJ4lqp-hbUKmI0
dl ls_b.png 1LYduZEln_RVgul0TDSxO19MZujnmbh9F
dl ls_c.png 1VL9c0yYj3dPw0UTW-lex9-upL8pxUOjL
dl ls_d.png 1J_aZpVekV62YNqGv9QgncBtXsHRrcxwH
dl glitzer.png 1xonTmCl3llHDd0t86zRD3AVPAZ49Cs20
dl schnee.mov 172ssjLix-KXm7LQ0rKPuPw9fd0MQFZCR
dl winterjacke.jpg 1pStl9u0FVEpjQwoBOUelCwWWW8kEsEen
dl stack.jpg 1WoKetGRycKREbHqZIkyrLBNc8Yl9Dnkk
CHAT=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a/493c62bd-image.jpg
[ -s $S/stack_chat.jpg ] || cp "$CHAT" $S/stack_chat.jpg

# iPhone-HDR (HLG) nach SDR bt709, 1080x1920, 60 fps
HDR="zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=1080:1920:flags=lanczos"
for i in 1 2 3 4 5 6; do
  [ -s $C/n$i.mp4 ] || ffmpeg -v error -y -threads 3 -i $S/nummer_$i.mov -vf "$HDR" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -c:a aac -b:a 320k -ar 48000 $C/n$i.mp4
done
# Schnee-Clip ist schon SDR (bt709), Drehung übernimmt ffmpeg
[ -s $C/schnee.mp4 ] || ffmpeg -v error -y -i $S/schnee.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 60 -an $C/schnee.mp4
[ -s $C/beat.wav ] || ffmpeg -v error -y -i $S/beat.mov -vn -ac 2 -ar 48000 $C/beat.wav
[ -s $C/img/stack_chat.jpg ] || .venv/bin/python scripts/cut_images.py $S $C/img
[ -s $C/snd/drop.wav ] || .venv/bin/python scripts/cut_sfx.py $C/snd

mkdir -p public_cut
ln -sfn ../public/fonts public_cut/fonts
ln -sfn ../public/sfx public_cut/sfx
ln -sfn ../public/brand public_cut/brand
ln -sfn $C public_cut/cut
echo "Beat-Schnitt bereit"
