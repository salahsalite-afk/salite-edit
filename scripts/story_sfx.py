"""Effektsounds für das Story-TikTok (selbst erzeugt, keine Apple-Originaltöne):
Herzschlag, dunkle Fläche, Handy-Vibration, Nachricht-Ton, Foto zerreißen, Scratch vor der Wendung.

python scripts/story_sfx.py <out_dir>
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
SR = 48000
rng = np.random.default_rng(21)


def t_(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def low(x, fc, o=2):
    return sosfilt(butter(o, fc / (SR / 2), "low", output="sos"), x)


def save(n, x, st=None):
    if st is None:
        st = np.stack([x, x], 1)
    st = st / (np.abs(st).max() + 1e-9) * 0.89
    wavfile.write(f"{out}/{n}.wav", SR, (st * 32767).astype(np.int16))


# Herzschlag: ein Doppelschlag (lub dub), tief
t = t_(0.75)
h = np.zeros_like(t)
for at, g in ((0.0, 1.0), (0.24, 0.7)):
    i = int(at * SR)
    tt = t[: len(t) - i]
    h[i:] += np.sin(2 * np.pi * (52 + 30 * np.exp(-tt * 25)) * tt) * np.exp(-tt * 16) * g
save("heart", np.tanh(h * 1.4))

# dunkle Fläche (Spannung), 12 s, langsam schwellend
t = t_(12.0)
pad = sum(np.sin(2 * np.pi * f * t + p) * a for f, p, a in ((55, 0, 1), (82.4, 1, 0.5), (110.3, 2, 0.25), (164.8, 0.5, 0.12)))
pad *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * t)
air = low(rng.normal(0, 1, len(t)), 900) * 0.08
env = np.minimum(1, t / 1.5) * np.minimum(1, (12 - t) / 0.4)
save("tension", (pad + air) * env)

# Vibration (zwei kurze Summstöße)
t = t_(0.9)
v = np.zeros_like(t)
for at in (0.0, 0.5):
    i = int(at * SR)
    tt = t[: min(len(t) - i, int(0.3 * SR))]
    v[i : i + len(tt)] += np.sign(np.sin(2 * np.pi * 170 * tt)) * 0.5 * np.minimum(1, tt / 0.01) * np.minimum(1, (0.3 - tt) / 0.02)
save("buzz", low(v, 1200))

# Nachricht-Ton: zwei weiche Glöckchen (eigener Klang)
t = t_(0.6)
d = np.zeros_like(t)
for at, f in ((0.0, 1318.5), (0.09, 1760.0)):
    i = int(at * SR)
    tt = t[: len(t) - i]
    d[i:] += (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 9) * np.minimum(1, tt / 0.004)
save("ding", d)

# Foto zerreißen: knisterndes Rauschen mit Rissen
t = t_(0.45)
r = band(rng.normal(0, 1, len(t)), 1200, 7000) * (0.4 + 0.6 * (rng.random(len(t)) > 0.97)) * np.exp(-t * 4)
save("tear", r * np.minimum(1, t / 0.01))

# Scratch vor der Wendung: kurzer, hoch-runter gezogener Ton
t = t_(0.35)
f = 300 + 900 * np.sin(np.pi * t / 0.35)
ph = 2 * np.pi * np.cumsum(f) / SR
s = (band(rng.normal(0, 1, len(t)), 500, 4000) * 0.6 + np.sign(np.sin(ph)) * 0.4) * np.sin(np.pi * t / 0.35)
save("scratch", low(s, 5000))
print("ok")
