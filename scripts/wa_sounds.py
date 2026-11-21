"""Kleine UI-Sounds für den WhatsApp-Aufruf: Glocke (zwei Anschläge), Kamera-Auslöser, weicher Pop.

python scripts/wa_sounds.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
SR = 48000
rng = np.random.default_rng(4)


def t_(d):
    return np.arange(int(d * SR)) / SR


def save(n, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.89
    wavfile.write(f"{out}/{n}.wav", SR, (np.stack([x, x], 1) * 32767).astype(np.int16))


# Glocke: zwei Anschläge, inharmonische Teiltöne, leichtes Tremolo
t = t_(1.3)
bell = np.zeros_like(t)
for at, g in ((0.0, 1.0), (0.16, 0.75)):
    i = int(at * SR)
    tt = t[: len(t) - i]
    b = sum(a * np.sin(2 * np.pi * 1180 * r * tt) * np.exp(-tt * d) for r, a, d in ((1, 1, 4.5), (2.76, 0.5, 7), (5.4, 0.25, 11), (8.9, 0.1, 16)))
    b *= 1 + 0.08 * np.sin(2 * np.pi * 7 * tt)
    bell[i:] += b * g
save("bell", bell)

# Auslöser: kurzer Doppelklick wie eine Kamera
t = t_(0.18)
s = np.zeros_like(t)
for at in (0.0, 0.07):
    i = int(at * SR)
    n = int(0.025 * SR)
    s[i : i + n] += sosfilt(butter(2, [1500 / (SR / 2), 9000 / (SR / 2)], "band", output="sos"), rng.normal(0, 1, n)) * np.exp(-np.arange(n) / SR * 180)
save("shutter", s)

# weicher Pop
t = t_(0.12)
save("pop", np.sin(2 * np.pi * (700 + 500 * np.exp(-t * 60)) * t) * np.exp(-t * 40))
print("ok")
