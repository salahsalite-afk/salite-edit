"""Effektsounds für den Beat-Schnitt (selbst erzeugt): Bestell-Ping, Pop, Glitzer, Wind, Drop-Schlag.

python scripts/cut_sfx.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
SR = 48000
rng = np.random.default_rng(12)


def t_(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def save(n, x, st=None):
    if st is None:
        st = np.stack([x, x], 1)
    st = st / (np.abs(st).max() + 1e-9) * 0.89
    wavfile.write(f"{out}/{n}.wav", SR, (st * 32767).astype(np.int16))


# Bestell-Ping: zwei kurze helle Töne
t = t_(0.35)
p = np.zeros_like(t)
for at, f in ((0.0, 1568), (0.07, 2093)):
    i = int(at * SR)
    tt = t[: len(t) - i]
    p[i:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 18)
save("ping", p)

# Pop (Puff-Print)
t = t_(0.14)
save("pop", np.sin(2 * np.pi * (520 + 700 * np.exp(-t * 55)) * t) * np.exp(-t * 34) + band(rng.normal(0, 1, len(t)), 800, 4000) * np.exp(-t * 90) * 0.3)

# Glitzer: viele kurze hohe Glöckchen, leicht im Stereo verteilt
t = t_(1.4)
L = np.zeros_like(t)
R = np.zeros_like(t)
for k in range(16):
    at = rng.uniform(0, 1.0)
    f = rng.choice([2637, 3136, 3520, 3951, 4699, 5274])
    i = int(at * SR)
    tt = t[: len(t) - i]
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * rng.uniform(9, 16)) * rng.uniform(0.3, 1)
    pan = rng.uniform(0.2, 0.8)
    L[i:] += s * (1 - pan)
    R[i:] += s * pan
env = np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 0.9) * 4)
save("shimmer", None, np.stack([L * env, R * env], 1))

# Wind: gefiltertes Rauschen mit Böe
t = t_(1.6)
g = np.exp(-((t - 0.7) / 0.45) ** 2)
w = band(rng.normal(0, 1, len(t)), 200, 1400) * (0.3 + 0.7 * g) + band(rng.normal(0, 1, len(t)), 1500, 3500) * g**2 * 0.3
save("wind", w * np.minimum(1, t / 0.2) * np.minimum(1, (1.6 - t) / 0.3))

# Drop-Schlag: tiefer Boom mit kurzem Knack
t = t_(0.9)
boom = np.sin(2 * np.pi * (42 + 90 * np.exp(-t * 18)) * t) * np.exp(-t * 4.5)
crack = band(rng.normal(0, 1, len(t)), 1500, 7000) * np.exp(-t * 60)
save("drop", np.tanh((boom + crack * 0.35) * 1.8))
print("ok")
