"""Ton für das Couch-Dialog-Video (src/bf/CouchTikTok.tsx): Originalstimme unverändert, Effekte dazu.

python scripts/couch_mix.py <original.mov> <snd_dir> <out.wav>
Stimme ohne EQ, Rauschminderung, Schnitt oder Lautheitsanpassung (Kunde: Audioqualität nicht verändern).
Effekte einzeln gepegelt (Spitze 50 ms RMS gegen p70 der Stimme in 400 ms Fenstern): Hook plakativ,
danach leise und angenehm. Kassen-Sound selbst gebaut (kein Shopify-Original).
"""
import subprocess
import sys

import numpy as np
import soundfile as sf

src, snd, out = sys.argv[1:4]
SR = 48000
TOTAL = 22.67
N = int(round(TOTAL * SR))
raw = "/dev/shm/rtmp/_co_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:a:0", "-vn", "-ar", str(SR), "-c:a", "pcm_f32le", raw], check=True)
v, _ = sf.read(raw)
if v.ndim == 1:
    v = np.stack([v, v], 1)
mix = np.zeros((N, 2))
m = min(len(v), N)
mix[:m] = v[:m]


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


vr = mov_rms(v.mean(1), int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-4], 70))
FX = [
    (1.56, "whoosh_soft", -22),   # Hook: Sprung auf die Jogger bei "das"
    (3.42, "whoosh_soft", -25),   # Detail Glitzersteine
    (4.80, "pop", -28),           # enger auf den Puffprint
    (6.00, "whoosh_soft", -25),   # Stack
    (7.40, "hit_low", -24),       # "Okay", Sprung aufs Gesicht
    (9.60, "pop", -28),           # Passwort-Feld
    (11.40, "pop", -27),          # Insta
    (15.04, "hit_low", -26),      # "Nee", Sprung aufs Gesicht
    (15.45, "pop", -29),          # 80 % der Passwörter weg
    (18.64, "coin", -16),         # 30 €
    (20.40, "chime", -26),        # wie geschenkt
    (21.64, "stamp", -20),        # Black Friday
]
# Passwort wird getippt: acht leise Anschläge
for i in range(8):
    FX.append((9.8 + 0.6 * i / 8, f"keyboard_tap{1 + i % 3}", -31))
cache = {}
for at, name, target in FX:
    if name not in cache:
        x, r = sf.read(f"{snd}/{name}.wav")
        assert r == SR, (name, r)
        x = np.stack([x, x], 1) if x.ndim == 1 else x
        pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(0.05 * SR))).max() + 1e-12)
        cache[name] = (x, pk)
    x, pk = cache[name]
    i = int(round(at * SR))
    n = min(len(x), N - i)
    mix[i : i + n] += x[:n] * 10 ** ((ref + target - pk) / 20)
peak = np.abs(mix).max()
if peak > 0.99:
    mix *= 0.99 / peak
sf.write(out, mix.astype(np.float32), SR)
print("Stimme p70", round(ref, 1), "dBFS, Spitze", round(float(peak), 3), "Effekte", len(FX))
