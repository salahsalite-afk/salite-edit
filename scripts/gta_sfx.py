"""Game-Soundeffekte im Open-World-Action-Stil, selbst erzeugt (keine Lizenzfragen).

python scripts/gta_sfx.py <out_dir>
punch_a/b/c, hurt, slow_in, slow_out, heartbeat, switch, wheel_tick, cash, star, passed, title, objective.
"""
import os
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
SR = 48000
rng = np.random.default_rng(69)


def t_(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def lowp(x, fc, o=2):
    return sosfilt(butter(o, fc / (SR / 2), "low", output="sos"), x)


def highp(x, fc, o=2):
    return sosfilt(butter(o, fc / (SR / 2), "high", output="sos"), x)


def save(name, x, st=None):
    x = np.asarray(x, float)
    if st is None:
        st = np.stack([x, x], 1)
    st = st / (np.abs(st).max() + 1e-9) * 0.89
    wavfile.write(f"{out}/{name}.wav", SR, (st * 32767).astype(np.int16))


def sweep(f0, f1, d, shape=1.0):
    t = t_(d)
    f = f0 + (f1 - f0) * (t / d) ** shape
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# Schläge: tiefer Körper-Thump, Klatsch, kurzer Knack
for name, (f0, crack, slap) in {"punch_a": (95, 1.0, 0.7), "punch_b": (80, 0.7, 1.0), "punch_c": (110, 1.2, 0.5)}.items():
    t = t_(0.32)
    thump = sweep(f0 * 1.8, f0 * 0.55, 0.32, 0.5) * np.exp(-t * 16)
    n = rng.normal(0, 1, len(t))
    k = band(n, 1800, 6000) * np.exp(-t * 140) * crack
    s = band(n, 500, 2200) * np.exp(-t * 45) * slap
    x = thump * 1.0 + k * 0.55 + s * 0.6
    x = np.tanh(x * 2.2)
    save(name, x)

# Getroffen (dumpf, wie durch Watte)
t = t_(0.45)
save("hurt", lowp(sweep(70, 40, 0.45) * np.exp(-t * 8) + lowp(rng.normal(0, 1, len(t)), 300) * np.exp(-t * 10) * 0.6, 400))

# Zeitlupe rein: Luft saugt ein, Ton fällt nach unten
t = t_(0.9)
air = band(rng.normal(0, 1, len(t)), 300, 5000)
env = np.exp(-((t - 0.45) / 0.28) ** 2)
fall = sweep(320, 55, 0.9, 0.6) * np.minimum(1, t / 0.05) * np.exp(-t * 1.6)
x = lowp(air * env, 3500) * 0.7 + fall * 0.8
save("slow_in", x)

# Zeitlupe raus: Luft zieht hoch, kurzer Schnapp
t = t_(0.5)
air = band(rng.normal(0, 1, len(t)), 400, 7000) * (t / 0.5) ** 2
rise = sweep(60, 420, 0.5, 2.0) * (t / 0.5) ** 1.5
snap = np.zeros_like(t)
i = int(0.47 * SR)
snap[i : i + 900] = highp(rng.normal(0, 1, 900), 2000) * np.exp(-np.arange(900) / SR * 300)
save("slow_out", air * 0.6 + rise * 0.6 + snap * 0.9)

# Herzschlag (lub-dub)
t = t_(0.7)
hb = np.zeros_like(t)
for at, g in ((0.0, 1.0), (0.18, 0.7)):
    j = int(at * SR)
    tt = t_(0.16)
    beat = np.sin(2 * np.pi * (60 + 30 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 22) * g
    hb[j : j + len(tt)] += beat
save("heartbeat", lowp(hb, 200))

# Charakterwechsel: großes Luftwischen nach oben, dann tiefer Boom beim Wieder-Eintauchen
t = t_(1.1)
air = band(rng.normal(0, 1, len(t)), 200, 8000)
env = np.exp(-((t - 0.32) / 0.2) ** 2) + 0.8 * np.exp(-((t - 0.78) / 0.12) ** 2)
up = sweep(200, 1200, 1.1, 0.8) * np.exp(-((t - 0.3) / 0.25) ** 2) * 0.3
tb = t - 0.8
boom = np.where(tb > 0, np.sin(2 * np.pi * (45 + 60 * np.exp(-np.clip(tb, 0, None) * 20)) * np.clip(tb, 0, None)) * np.exp(-np.clip(tb, 0, None) * 6), 0)
L = air * env * 0.6 + up + boom
R = np.roll(air, 400) * env * 0.6 + up + boom
save("switch", None, np.stack([L, R], 1))

# Rad-Auswahl Tick
t = t_(0.06)
save("wheel_tick", np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + highp(rng.normal(0, 1, len(t)), 3000) * np.exp(-t * 200) * 0.3)

# Kasse
t = t_(0.9)
bell = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2093, 5), (2637, 6), (3136, 7), (4186, 9)))
rattle = band(rng.normal(0, 1, len(t)), 3000, 9000) * np.exp(-t * 30) * 0.5
drawer = np.zeros_like(t)
j = int(0.12 * SR)
tt = t_(0.18)
drawer[j : j + len(tt)] = lowp(rng.normal(0, 1, len(tt)), 900) * np.exp(-tt * 25)
bell2 = np.zeros_like(t)
bell2[j:] = bell[: len(t) - j]
save("cash", bell * 0.35 + bell2 * 0.45 + rattle + drawer * 0.6)

# Fahndungsstern
t = t_(0.5)
d = np.where(t < 0.12, np.sin(2 * np.pi * 1318 * t), np.sin(2 * np.pi * 988 * t)) * np.exp(-((t % 0.12) if True else t) * 0) * np.exp(-t * 6)
save("star", d)

# Mission erfüllt: kurze eigene Bläser-Fanfare (Sägezahn-Stack), aufsteigend, Schlussakkord
def brass(f, d):
    t = t_(d)
    x = sum(((2 * ((k * f * t) % 1) - 1) / k) for k in (1, 2, 3)) * 0.5
    env = np.minimum(1, t / 0.02) * np.exp(-t * 2.2)
    return lowp(x, 2600) * env


seq = [(0.0, [392, 494, 587], 0.16), (0.18, [440, 554, 659], 0.16), (0.36, [523, 659, 784], 1.2)]
total = t_(1.7)
mix = np.zeros_like(total)
for at, chord, d in seq:
    j = int(at * SR)
    c = sum(brass(f, d) for f in chord)
    mix[j : j + len(c)] += c[: len(mix) - j]
tt = t_(1.7)
boom = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 3) * (tt > 0.36)
save("passed", mix + boom * 0.6)

# Missionstitel: tiefer Schlag mit Luft
t = t_(1.2)
save("title", lowp(sweep(90, 38, 1.2, 0.5) * np.exp(-t * 3), 300) + band(rng.normal(0, 1, len(t)), 400, 3000) * np.exp(-t * 9) * 0.25)

# Neues Ziel: weicher UI-Pop
t = t_(0.18)
save("objective", np.sin(2 * np.pi * 880 * t) * np.exp(-t * 30) * 0.6 + np.sin(2 * np.pi * 1320 * t) * np.exp(-t * 40) * 0.4)
print("ok", sorted(os.listdir(out)))
