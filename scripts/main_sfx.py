"""Effektsounds für das Main-TikTok (selbst erzeugt): Mausklick, Stempel.

python scripts/main_sfx.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def save(n, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.89
    wavfile.write(f"{out}/{n}.wav", SR, (np.stack([x, x], 1) * 32767).astype(np.int16))


def click(tt, gain):
    """ein Mausklick-Transient: heller Knack plus kurze Resonanz des Gehäuses"""
    n = band(rng.normal(0, 1, len(tt)), 1800, 9000) * np.exp(-tt * 900)
    r = np.sin(2 * np.pi * 4300 * tt) * np.exp(-tt * 260) * 0.5
    b = np.sin(2 * np.pi * 1200 * tt) * np.exp(-tt * 180) * 0.25
    return (n + r + b) * gain


# Mausklick: Drücken und Loslassen
t = t_(0.16)
m = np.zeros_like(t)
m += click(t, 1.0)
i = int(0.058 * SR)
m[i:] += click(t[: len(t) - i], 0.55)
save("mouse", m)

# Stempel: dumpfer Schlag plus Papier
t = t_(0.5)
thump = np.sin(2 * np.pi * (48 + 70 * np.exp(-t * 30)) * t) * np.exp(-t * 14)
slap = band(rng.normal(0, 1, len(t)), 400, 3200) * np.exp(-t * 38) * 0.6
save("stamp", np.tanh((thump + slap) * 1.6))
# Warnton für den Hook: zwei kurze, weiche Töne (kein Sirenen-Kreischen)
t = t_(0.5)
a = np.zeros_like(t)
for at, fq in ((0.0, 988), (0.13, 740)):
    i = int(at * SR)
    tt = t[: len(t) - i]
    env = np.minimum(1, tt / 0.006) * np.exp(-tt * 14)
    a[i:] += (np.sin(2 * np.pi * fq * tt) + 0.3 * np.sin(2 * np.pi * 2 * fq * tt)) * env
save("alarm", a)

# Durchstreichen: kurzer Marker-Strich (gefiltertes Rauschen, steigend)
t = t_(0.18)
w = band(rng.normal(0, 1, len(t)), 2500, 7000) * np.sin(np.pi * t / 0.18) ** 1.5
save("strike", w)
print("ok")
