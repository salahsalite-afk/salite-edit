"""Straßen-Atmo nachts vor einem Hotel: Wind mit Böen, Stadtrauschen, ab und zu ein vorbeifahrendes Auto in der Ferne.

python scripts/street_ambience.py <out.wav> <sekunden>
Selbst erzeugt (keine Lizenzfragen), Stereo 48 kHz, leise genug, dass Stimmen klar vorne bleiben.
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, sosfilt

out, dur = sys.argv[1], float(sys.argv[2])
SR = 48000
n = int(dur * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(21)


def band(x, lo, hi, o=2):
    sos = butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x)


def lowp(x, fc, o=2):
    sos = butter(o, fc / (SR / 2), "low", output="sos")
    return sosfilt(sos, x)


def smooth_rand(rate, depth):
    k = max(2, int(dur * rate) + 2)
    pts = rng.uniform(1 - depth, 1, k)
    return np.interp(t, np.linspace(0, dur, k), pts)


chans = []
for ch in range(2):
    # Wind: tieffrequentes Rauschen, Böen als langsame Lautstärke- und Klangänderung
    gust = smooth_rand(0.7, 0.85) ** 2
    w_low = band(rng.normal(0, 1, n), 60, 500) * (0.35 + 0.65 * gust)
    w_hi = band(rng.normal(0, 1, n), 700, 2600) * (gust**2) * 0.35  # Pfeifen in Böen
    # Stadt: tiefes Grundrauschen, sehr leise
    city = lowp(rng.normal(0, 1, n), 180) * 0.6
    chans.append(w_low + w_hi + city)

L, R = chans
# vorbeifahrendes Auto in der Ferne (Anschwellen und Abklingen, wandert von links nach rechts)
for start in rng.uniform(0.3, max(0.4, dur - 3), max(1, int(dur / 6))):
    seg = int(3.2 * SR)
    i = int(start * SR)
    if i + seg > n:
        continue
    tt = np.linspace(0, 1, seg)
    env = np.exp(-((tt - 0.5) / 0.22) ** 2)
    car = band(rng.normal(0, 1, seg), 90, 900) * env * 0.9
    pan = tt
    L[i : i + seg] += car * (1 - pan)
    R[i : i + seg] += car * pan

mix = np.stack([L, R], 1)
fade = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.6)
mix *= fade[:, None]
mix /= np.abs(mix).max() / 0.7
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
