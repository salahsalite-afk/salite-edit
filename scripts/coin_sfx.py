"""Eigene Kassen-Sounds (kein Shopify-Original): "Ka-Ching" für Preise, Intro-Schlag, Swoosh.

python scripts/coin_sfx.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
SR = 48000
rng = np.random.default_rng(31)


def t_(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def save(n, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.89
    wavfile.write(f"{out}/{n}.wav", SR, (np.stack([x, x], 1) * 32767).astype(np.int16))


# Ka-Ching: kurzer mechanischer Klick, dann helle, unharmonische Glocke
t = t_(0.9)
ka = band(rng.normal(0, 1, len(t)), 1500, 6000) * np.exp(-t * 120) * 0.8
ka += np.sin(2 * np.pi * 900 * t) * np.exp(-t * 90) * 0.3
i = int(0.07 * SR)
tt = t[: len(t) - i]
ching = np.zeros_like(t)
for f, a, d in ((2093, 1.0, 5.5), (3136, 0.7, 6.5), (4186, 0.55, 7.5), (5274, 0.35, 9.0), (6645, 0.22, 11.0)):
    ching[i:] += np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)) * np.exp(-tt * d) * a
ching[i:] *= np.minimum(1, tt / 0.003)
save("coin", ka + ching * 0.9)

# Intro-Schlag: tiefer Punch mit kurzem Knack
t = t_(0.7)
boom = np.sin(2 * np.pi * (50 + 110 * np.exp(-t * 22)) * t) * np.exp(-t * 6)
crack = band(rng.normal(0, 1, len(t)), 1800, 8000) * np.exp(-t * 70) * 0.4
save("punch", np.tanh((boom + crack) * 1.7))

# Swoosh für den Übergang
t = t_(0.45)
sw = band(rng.normal(0, 1, len(t)), 600, 5000) * np.sin(np.pi * t / 0.45) ** 2
save("swoosh", sw)
print("ok")
