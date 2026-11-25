#!/usr/bin/env bash
# RAM-Datei für die Instagram-Story vom Shooting (src/bf/IgStoryShoot.tsx): HDR-Clip nach SDR.
set -e
cd "$(dirname "$0")/.."
mkdir -p /dev/shm/igs /dev/shm/rtmp
F=/root/.claude/uploads/a17b8c1e-3970-57a6-9962-bdd85193fd8a/933a45fe-IMG_0201.mov
[ -s /dev/shm/igs/clip.mp4 ] || ffmpeg -v error -y -i $F -vf "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 14 -pix_fmt yuv420p -r 30 -an /dev/shm/igs/clip.mp4
mkdir -p public_igs && ln -sfn ../public/fonts public_igs/fonts && ln -sfn ../public/brand public_igs/brand && ln -sfn /dev/shm/igs public_igs/igs
echo "IGS bereit"
