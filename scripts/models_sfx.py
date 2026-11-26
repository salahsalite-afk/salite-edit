"""Eigene leise Klänge für das Model-Casting-Video V2 (keine Fremd- oder Markenklänge).

python scripts/models_sfx.py <out_dir>
ding    Glocke beim Folgen ("Plus weg")
chime   zwei helle Töne, Slot geschafft
shutter Kamera-Auslöser (Hook und Ende)
afbeep  zwei leise Fokus-Pieptöne vor dem Auslöser
paper   Abzug landet auf dem Stapel
clack   Filmklappe
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


def bell(t, f0, parts):
    y = np.zeros_like(t)
    for r, a, d in parts:
        y += np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t * d) * a
    return y * np.minimum(1, t / 0.003)


# Glocke: warmes "Ding" (E6), leichter Anschlag
t = t_(1.8)
ding = bell(t, 1318.5, ((1.0, 1.0, 2.2), (2.0, 0.22, 3.6), (2.76, 0.3, 4.2), (5.4, 0.1, 8.0)))
ding += band(rng.normal(0, 1, len(t)), 3000, 8000) * np.exp(-t * 400) * 0.15
save("ding", ding)

# Geschafft: zwei Töne nacheinander (E6, H6)
t = t_(1.2)
ch = bell(t, 1318.5, ((1.0, 1.0, 4.0), (2.0, 0.15, 6.0)))
i = int(0.14 * SR)
ch[i:] += bell(t[: len(t) - i], 1975.5, ((1.0, 0.9, 3.5), (2.0, 0.12, 6.0)))
save("chime", ch)

# Kamera-Auslöser: zwei mechanische Klicks mit kurzem Körper
t = t_(0.35)
def klick(t, amp):
    n = band(rng.normal(0, 1, len(t)), 1200, 9000) * np.exp(-t * 140)
    body = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 70) * 0.5
    ring = np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 160) * 0.2
    return (n + body + ring) * amp
sh = klick(t, 1.0)
i = int(0.075 * SR)
sh[i:] += klick(t[: len(t) - i], 0.7)
save("shutter", sh)

# Fokus: zwei kurze leise Pieptöne
t = t_(0.045)
b = np.sin(2 * np.pi * 2700 * t) * np.minimum(1, t / 0.004) * np.clip((0.04 - t) / 0.006, 0, 1)
pip = np.zeros(int(0.22 * SR))
pip[: len(b)] += b
pip[int(0.1 * SR) : int(0.1 * SR) + len(b)] += b
save("afbeep", pip)

# Abzug landet: weiches Papier mit kleinem Tisch-Ton
t = t_(0.22)
pp = band(rng.normal(0, 1, len(t)), 300, 3200) * np.minimum(1, t / 0.008) * np.exp(-t * 32)
pp += np.sin(2 * np.pi * 110 * t) * np.exp(-t * 40) * 0.35
save("paper", pp)

# Filmklappe: Holz-Klack
t = t_(0.25)
cl = band(rng.normal(0, 1, len(t)), 800, 5000) * np.exp(-t * 180)
cl += np.sin(2 * np.pi * 1150 * t) * np.exp(-t * 70) * 0.5 + np.sin(2 * np.pi * 700 * t) * np.exp(-t * 50) * 0.4
save("clack", cl)
print("ok")
