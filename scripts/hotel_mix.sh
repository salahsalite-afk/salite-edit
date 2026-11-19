#!/usr/bin/env bash
# Mischung Black-Week-Teaser: Original-Stimmen (beide Clips gleich laut, leicht entrauscht), Straßen-Atmo mit Wind, leiser Beat, Effekte.
# bash scripts/hotel_mix.sh <bild.mp4> <effekte.wav> <out.mp4>
set -e
V=$1; SFX=$2; OUT=$3; L=/dev/shm/lobby; T=/dev/shm/rtmp
A=2.93
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
voice() { ffmpeg -v error -y -i "$1" -vn -af "highpass=f=90,afftdn=nf=-30,acompressor=threshold=0.08:ratio=3:attack=5:release=120:makeup=2,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 -ac 2 "$2"; }
voice $L/clip_mann.mp4 $T/v1.wav
voice $L/clip_frau.mp4 $T/v2.wav
ffmpeg -v error -y -i $T/v1.wav -i $T/v2.wav -i $L/street.wav -i $L/beat.wav -i "$SFX" -filter_complex "\
[0]atrim=0:$A,afade=t=out:st=$(echo "$A-0.05" | bc):d=0.05[a];\
[1]atrim=0:2.93,afade=t=out:st=2.88:d=0.05,adelay=${A}s:all=1[b];\
[2]atrim=0:$DUR,volume=-15dB[s];\
[3]atrim=0:$DUR,volume=-19dB,afade=t=out:st=$(echo "$DUR-0.8" | bc):d=0.8[m];\
[4]aresample=48000[x];\
[a][b][s][m][x]amix=inputs=5:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 $T/hotel_mix.wav
ffmpeg -v error -y -i "$V" -i $T/hotel_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
for f in $T/v1.wav $T/v2.wav $T/hotel_mix.wav; do echo "$f $(ffmpeg -hide_banner -i $f -af ebur128=framelog=quiet -f null - 2>&1 | grep -E '^\s+I:' | tr -s ' ')"; done
