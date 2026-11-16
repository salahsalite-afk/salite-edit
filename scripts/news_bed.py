"""Leise, spannende Nachrichten-Musik und Nachrichten-Gong, selbst erzeugt (keine Lizenzfragen).

python scripts/news_bed.py <musik.wav> <gong.wav> <sekunden>
Musik: 96 BPM, weiche tiefe Pulse auf jedem Schlag, feines Ticken wie ein Fernschreiber,
dunkle Moll-Fläche mit langsamem Filter, Basslinie A F G E. 48 kHz Stereo.
Gong: zwei weiche Glockentöne wie vor einer Meldung.
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

out_music, out_gong, dur = sys.argv[1], sys.argv[2], float(sys.argv[3])
SR = 48000
n = int(dur * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(3)
BPM = 96
beat = 60 / BPM


def lp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "low")
    return lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high")
    return lfilter(b, a, x)


def note(f):
    return 440 * 2 ** ((f - 69) / 12)


mix = np.zeros((n, 2))

# Basslinie: je 2 Takte A, F, G, E (MIDI 45, 41, 43, 40)
roots = [45, 41, 43, 40]
bar = 4 * beat
idx = ((t // (2 * bar)) % 4).astype(int)
fb = np.array([note(roots[i]) for i in range(4)])[idx]
phase = 2 * np.pi * np.cumsum(fb) / SR
bass = np.sin(phase) + 0.25 * np.sin(2 * phase)
# Bass atmet mit den Schlägen
bpos = (t % beat) / beat
bass *= 0.55 + 0.45 * np.exp(-bpos * 3)
mix += (lp(bass, 220) * 0.22)[:, None]

# Fläche: Moll-Akkord über der Basslinie, verstimmt, langsam öffnender Filter
pad = np.zeros(n)
for off in (12, 15, 19, 24):  # Grundton+Oktave, kleine Terz, Quinte, Oktave
    for det in (-0.12, 0.12):
        f = fb * 2 ** ((off + det) / 12)
        ph = 2 * np.pi * np.cumsum(f) / SR
        pad += np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
pad /= 8
sweep = 0.5 + 0.5 * np.sin(2 * np.pi * t / (8 * bar) - np.pi / 2)
pad = lp(pad, 900) * (0.35 + 0.65 * sweep)
pad_l, pad_r = pad, np.roll(pad, int(0.011 * SR))
mix[:, 0] += pad_l * 0.10
mix[:, 1] += pad_r * 0.10

# Weicher Puls auf jedem Schlag (tiefer Sinus, schnell abfallend)
pulse = np.zeros(n)
k = np.arange(int(0.25 * SR)) / SR
kick = np.sin(2 * np.pi * (52 + 40 * np.exp(-k * 30)) * k) * np.exp(-k * 14)
for b0 in np.arange(0, dur, beat):
    i = int(b0 * SR)
    pulse[i : i + len(kick)] += kick[: max(0, min(len(kick), n - i))]
mix += (pulse * 0.30)[:, None]

# Ticken in Sechzehnteln, leicht unregelmäßig betont (Fernschreiber)
tick = np.zeros(n)
cl = hp(rng.normal(0, 1, int(0.012 * SR)), 5000) * np.exp(-np.arange(int(0.012 * SR)) / SR * 500)
for j, b0 in enumerate(np.arange(0, dur, beat / 4)):
    i = int(b0 * SR)
    g = 1.0 if j % 4 == 0 else (0.55 if j % 2 == 0 else 0.35)
    tick[i : i + len(cl)] += cl[: max(0, min(len(cl), n - i))] * g
mix[:, 0] += tick * 0.05
mix[:, 1] += np.roll(tick, int(0.004 * SR)) * 0.05

# Ein- und Ausblenden
fade = np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 2.5)
mix *= fade[:, None]
mix /= np.abs(mix).max() / 0.7
wavfile.write(out_music, SR, (mix * 32767).astype(np.int16))

# Nachrichten-Gong: zwei Glockentöne (E5, dann A5), weich
g = np.zeros(int(1.6 * SR))
tg = np.arange(len(g)) / SR
for start, f in ((0.0, note(76)), (0.18, note(81))):
    s = int(start * SR)
    tt = tg[: len(g) - s]
    tone = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.01 * tt) + 0.12 * np.sin(2 * np.pi * f * 3.0 * tt)) * np.exp(-tt * 3.2)
    tone *= np.minimum(1, tt / 0.004)
    g[s:] += tone
g /= np.abs(g).max() / 0.7
wavfile.write(out_gong, SR, (np.stack([g, g], 1) * 32767).astype(np.int16))
print("ok")
