"""Ton für das Trackie-Video (src/bf/TrackieTikTok.tsx): Originalstimme unverändert, Effekte dazu.

python scripts/trackie_mix.py <original.mov> <snd_dir> <out.wav>
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
TOTAL = 35.7
N = int(round(TOTAL * SR))
raw = "/dev/shm/rtmp/_tr_voice.wav"
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
    (0.02, "punch", -9),          # 69 €
    (0.75, "strike", -22),        # 144 € gestrichen
    (1.24, "pop", -18),           # TRACKIE
    (2.12, "pop", -24),           # Winterjacke erscheint
    (2.60, "strike", -18),        # Winterjacke gestrichen
    (3.24, "swoosh", -16),        # Übergang nach dem Hook
    (5.50, "coin", -15),          # Shop auseinandergenommen: Mitteilungen
    (6.58, "whoosh_soft", -27),   # Clip mit Mitteilungen
    (12.40, "pop", -30),          # Kommentar-Fenster
    (16.36, "pop", -24),          # Herz: wir picken Leute raus
    (17.85, "pop", -27),          # Passwort per DM
    (19.90, "whoosh_soft", -24),  # 550 GSM
    (21.48, "strike", -19),       # Winterjacke gestrichen
    (22.42, "whoosh_soft", -25),  # Stack
    (23.28, "pop", -27),          # Glitzersteine
    (24.76, "pop", -27),          # Puffprint
    (29.30, "whoosh_soft", -25),  # Poster
    (32.20, "pop", -30), (32.55, "click", -28), (32.58, "ding", -15),  # Plus weg, Glocke
]
TEXT, TA, TE, SENT = "Ich brauch ein Passwort", 13.6, 14.95, 15.05
for i, ch in enumerate(TEXT):
    if ch != " ":
        FX.append((TA + (TE - TA) * i / len(TEXT), f"keyboard_tap{1 + i % 3}", -31))
FX.append((SENT - 0.03, "click", -26))
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
