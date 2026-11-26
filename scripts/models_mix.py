"""Ton für das Model-Casting-Video (src/bf/ModelsTikTok.tsx): Originalstimme unverändert, leise Effekte dazu.

python scripts/models_mix.py <original.mov> <snd_dir> <out.wav>
Stimme ohne EQ, Rauschminderung oder Lautheitsanpassung; der eigene Swish nach dem Intro ist schon im Original.
Effekte ruhig und leise (Kunde: angenehm, nicht plakativ), einzeln gepegelt: Spitze 50 ms RMS gegen p70 der Stimme
in 400 ms Fenstern. Höchstens ein Effekt pro Sekunde, Ausnahme Tastatur beim Kommentar.
"""
import subprocess
import sys

import numpy as np
import soundfile as sf

src, snd, out = sys.argv[1:4]
SR = 48000
TOTAL = 29.2
N = int(round(TOTAL * SR))
raw = "/dev/shm/rtmp/_mod_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ar", str(SR), "-c:a", "pcm_f32le", raw], check=True)
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
    (3.30, "pop", -29),          # Model Casting
    (5.62, "whoosh_soft", -27),  # Menschenmenge
    (11.25, "whoosh_soft", -27), # Klappe
    (12.60, "pop", -30),         # Shooting-Takes
    (14.85, "whoosh_soft", -27), # Runway
    (17.36, "notify", -26),      # Plus weg, Haken
    (20.30, "pop", -30),         # Instagram
    (21.92, "click", -25),       # Nachricht
    (24.30, "whoosh_soft", -28), # Shooting
    (26.42, "notify", -27),      # Plus weg
]
# Kommentar "Ich hab Bock": ein leiser Anschlag pro Buchstabe (wie im Bild getippt)
TEXT, TA, TE, SENT = "Ich hab Bock", 19.42, 19.9, 19.95
for i, ch in enumerate(TEXT):
    if ch != " ":
        FX.append((TA + (TE - TA) * i / len(TEXT), f"keyboard_tap{1 + i % 3}", -31))
FX.append((SENT, "click", -27))
cache = {}
for at, name, target in FX:
    if name not in cache:
        x, r = sf.read(f"{snd}/{name}.wav")
        assert r == SR, (name, r)
        x = np.stack([x, x], 1) if x.ndim == 1 else x
        pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(0.05 * SR))).max() + 1e-12)
        cache[name] = (x, pk)
    x, pk = cache[name]
    i = int(at * SR)
    n = min(len(x), N - i)
    mix[i : i + n] += x[:n] * 10 ** ((ref + target - pk) / 20)
peak = np.abs(mix).max()
if peak > 0.99:
    mix *= 0.99 / peak
sf.write(out, mix.astype(np.float32), SR)
print("Stimme p70", round(ref, 1), "dBFS, Spitze", round(float(peak), 3), "Effekte", len(FX))
