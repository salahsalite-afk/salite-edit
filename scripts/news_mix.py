"""Endmischung SALITE News: Stimme, Beat (mit Ducking), Effekte; misst die Pegel.

.venv/bin/python scripts/news_mix.py <voice.wav> <effekte.wav> <beat.wav> <timeline.json> <bild.mp4> <out.mp4>
Stimme: Kompressor, auf etwa -14 LUFS, Limiter. Beat: etwa 12 dB unter der Stimme (Kunde will ihn hören),
duckt unter der Stimme um ein paar dB, blendet vor dem Abgang aus (danach echte Stille und Logo).
Effekte: wie aus Remotion gerendert (ohne Stimme und Musik).
"""
import json
import re
import subprocess
import sys

voice, sfx, beat, tl_p, video, out = sys.argv[1:7]
tl = json.load(open(tl_p))
total = tl["total"]
fade_at = tl["sections"]["outro"]["start"] + 1.0
T = "/dev/shm/rtmp"


def lufs(path, af=""):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", (af + "," if af else "") + "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])


PRE = "highpass=f=70,equalizer=f=120:t=q:w=1:g=2.5,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=0.05:ratio=4:attack=4:release=120:makeup=2"
i_pre = lufs(voice, PRE)
g = -14 - i_pre + 1.2  # der Limiter nimmt gut 1 dB
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", voice, "-af", f"{PRE},volume={g}dB,alimiter=limit=0.84:attack=3:release=50:level=false,aresample=48000", "-ar", "48000", f"{T}/v.wav"], check=True)
i_v = lufs(f"{T}/v.wav")

i_b = lufs(beat)
gb = (i_v - 12) - i_b
subprocess.run(
    [
        "ffmpeg", "-v", "error", "-y", "-i", beat, "-i", f"{T}/v.wav",
        "-filter_complex",
        f"[0]atrim=0:{total},volume={gb}dB,afade=t=out:st={fade_at}:d=1.0[b];"
        f"[b][1]sidechaincompress=threshold=0.25:ratio=2:attack=30:release=400:makeup=1[d]",
        "-map", "[d]", "-ar", "48000", f"{T}/b.wav",
    ],
    check=True,
)
subprocess.run(
    [
        "ffmpeg", "-v", "error", "-y", "-i", f"{T}/v.wav", "-i", f"{T}/b.wav", "-i", sfx,
        "-filter_complex", "[2]aresample=48000[s];[0][1][s]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.89:level=false",
        "-ar", "48000", f"{T}/mix.wav",
    ],
    check=True,
)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", f"{T}/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out], check=True)
print(f"Stimme {i_v:.1f} LUFS | Beat {lufs(f'{T}/b.wav'):.1f} LUFS (geduckt) | Effekte {lufs(sfx):.1f} LUFS | Mischung {lufs(f'{T}/mix.wav'):.1f} LUFS")
