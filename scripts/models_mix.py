"""Ton für das Model-Casting-Video V2 (src/bf/ModelsTikTok.tsx): Originalstimme unverändert, leise Effekte dazu.

python scripts/models_mix.py <original.mov> <snd_dir> <out.wav>
- Stimme ohne EQ, Rauschminderung oder Lautheitsanpassung; nur die Pausen an den Schnitten fallen heraus
  (Abschnitte aus src/bf/models_edl.json, 8 ms Blenden gegen Knacken). Der eigene Swish nach dem Intro bleibt.
- Zu jeder Einblendung ein leiser Klang (Kunde), einzeln gepegelt: Spitze 50 ms RMS gegen p70 der Stimme
  in 400 ms Fenstern. Glocke beim Folgen deutlicher (minus 15 dB), alles andere minus 20 bis 32 dB.
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

src, snd, out = sys.argv[1:4]
SR = 48000
E = json.load(open(os.path.join(os.path.dirname(__file__), "..", "src", "bf", "models_edl.json")))
FPS = E["fps"]
SEG = [(a / FPS, b / FPS) for a, b in E["seg"]]
STARTS = [0.0]
for a, b in SEG[:-1]:
    STARTS.append(STARTS[-1] + b - a)
TOTAL = STARTS[-1] + SEG[-1][1] - SEG[-1][0]
N = int(round(TOTAL * SR))


def o(s):
    for (a, b), st in zip(SEG, STARTS):
        if s < b:
            return st + max(0.0, s - a)
    return TOTAL


raw = "/dev/shm/rtmp/_mod_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ar", str(SR), "-c:a", "pcm_f32le", raw], check=True)
v, _ = sf.read(raw)
if v.ndim == 1:
    v = np.stack([v, v], 1)
mix = np.zeros((N, 2))
k = int(0.008 * SR)
for (a, b), st in zip(SEG, STARTS):
    x = v[int(round(a * SR)) : int(round(b * SR))].copy()
    if a > 0:
        x[:k] *= np.linspace(0, 1, k)[:, None]
    x[-k:] *= np.linspace(1, 0, k)[:, None]
    i = int(round(st * SR))
    n = min(len(x), N - i)
    mix[i : i + n] += x[:n]


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


vr = mov_rms(v.mean(1), int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-4], 70))
# (Quellzeit, Klang, Ziel in dB relativ zur Stimme)
FX = [
    (0.84, "afbeep", -30), (1.08, "shutter", -20),            # Sucher: Fokus, Auslöser auf "Models"
    (2.0, "pop", -32),                                        # Slot erscheint
    (3.30, "pop", -28),                                       # Model Casting
    (5.62, "whoosh_soft", -25), (5.72, "paper", -26),         # Abzug Menschenmenge
    (11.40, "clack", -24),                                    # Abzug Filmklappe
    (12.70, "paper", -26), (13.42, "paper", -27),             # Shooting-Abzüge legen sich darüber
    (14.85, "whoosh_soft", -25), (16.0, "paper", -26),        # Runway, zweiter Abzug
    (16.95, "pop", -31), (17.33, "click", -28), (17.36, "ding", -15),  # Folgen: Plus weg, Glocke
    (17.83, "click", -24),                                    # Speichern
    (18.62, "pop", -30),                                      # Kommentarleiste
    (20.30, "pop", -27), (21.89, "click", -23),               # Instagram, Nachricht
    (24.30, "whoosh_soft", -26), (24.40, "paper", -27),       # Abzug Shooting
    (25.95, "pop", -31), (26.39, "click", -28), (26.42, "ding", -15),  # Plus weg, Glocke
    (28.40, "afbeep", -30), (28.68, "shutter", -20), (28.86, "chime", -22),  # Auslöser, Slot geschafft
]
TEXT, TA, TE, SENT = "Ich hab Bock", 19.4, 19.76, 19.8
for i, ch in enumerate(TEXT):
    if ch != " ":
        FX.append((TA + (TE - TA) * i / len(TEXT), f"keyboard_tap{1 + i % 3}", -31))
FX.append((SENT - 0.03, "click", -26))
events = [(o(s), n, g) for s, n, g in FX]
# Swish an jedem Schnitt (Ausgabezeit)
events += [(st - 0.08, "whoosh_soft", -25) for st in STARTS[1:]]
cache = {}
for at, name, target in events:
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
print("Länge", round(TOTAL, 3), "s, Stimme p70", round(ref, 1), "dBFS, Spitze", round(float(peak), 3), "Effekte", len(events))
