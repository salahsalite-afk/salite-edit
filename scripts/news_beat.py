"""Treibender, positiver Nachrichten-Beat für SALITE News (selbst erzeugt, keine Lizenzfragen).

python scripts/news_beat.py <out.wav> <sekunden>
122 BPM, Dur-Folge C G Am F, Kick, Clap, Hi-Hats, pulsierender Bass, Pluck-Arpeggio, warme Fläche.
Lauter und präsenter als die ruhige Fläche (Kunde: Musik soll hörbar sein, Video soll Tempo haben).
"""
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

out, dur = sys.argv[1], float(sys.argv[2])
SR = 48000
n = int(dur * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(9)
BPM = 122
beat = 60 / BPM
bar = 4 * beat


def lp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), "low")
    return lfilter(b, a, x)


def hp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), "high")
    return lfilter(b, a, x)


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    m = min(len(sig), len(buf) - i)
    buf[i : i + m] += sig[:m] * gain


# Akkorde: C G Am F (je ein Takt), Grundtöne und Dreiklänge
chords = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
L = np.zeros(n)
R = np.zeros(n)

# Kick: 1 und 3, plus leichte Kick auf "und" von 4
kt = np.arange(int(0.3 * SR)) / SR
kick = np.sin(2 * np.pi * (48 + 110 * np.exp(-kt * 38)) * kt) * np.exp(-kt * 9)
# Clap: Rauschen, Bandpass, kurz
ct = np.arange(int(0.18 * SR)) / SR
clap = hp(lp(rng.normal(0, 1, len(ct)), 4000), 900) * np.exp(-ct * 28)
# Hi-Hat
ht = np.arange(int(0.05 * SR)) / SR
hat = hp(rng.normal(0, 1, len(ht)), 7000) * np.exp(-ht * 90)

nb = int(dur / beat) + 1
for b in range(nb):
    tb = b * beat
    pos = b % 4
    if pos in (0, 2):
        place(L, kick, tb, 0.9); place(R, kick, tb, 0.9)
    if pos in (1, 3):
        place(L, clap, tb, 0.28); place(R, clap, tb + 0.004, 0.28)
    if pos == 3:
        place(L, kick, tb + beat / 2, 0.5); place(R, kick, tb + beat / 2, 0.5)
    for s in range(4):  # Sechzehntel-Hats, Offbeats betont
        g = 0.16 if s == 2 else 0.07
        place(L, hat, tb + s * beat / 4, g)
        place(R, hat, tb + s * beat / 4 + 0.003, g * 0.9)

# Bass: Achtel, pumpt (leiser direkt nach der Kick)
bt = np.arange(int(beat / 2 * SR)) / SR
for k in range(int(dur / (beat / 2)) + 1):
    tk = k * beat / 2
    root = chords[int(tk // bar) % 4][0]
    f = note(root)
    tone = np.sin(2 * np.pi * f * bt) + 0.4 * np.sin(2 * np.pi * 2 * f * bt)
    env = np.minimum(1, bt / 0.01) * np.exp(-bt * 5)
    duck = 0.55 if k % 2 == 0 else 1.0
    place(L, lp(tone * env, 400), tk, 0.32 * duck); place(R, lp(tone * env, 400), tk, 0.32 * duck)

# Pluck-Arpeggio in Sechzehnteln über die Akkordtöne (positiv, Werbe-Gefühl)
pt = np.arange(int(0.22 * SR)) / SR
for k in range(int(dur / (beat / 4)) + 1):
    tk = k * beat / 4
    ch = chords[int(tk // bar) % 4][1]
    m = ch[k % 3] + (12 if (k // 3) % 2 else 0)
    f = note(m)
    tone = (np.sin(2 * np.pi * f * pt) + 0.3 * np.sin(2 * np.pi * 2 * f * pt)) * np.exp(-pt * 16)
    pan = 0.5 + 0.35 * np.sin(k * 0.9)
    place(L, tone, tk, 0.07 * (1 - pan) * 2); place(R, tone, tk, 0.07 * pan * 2)

# Fläche: Akkorde, weich
pad = np.zeros(n)
idx = (t // bar).astype(int) % 4
for v in range(3):
    fm = np.array([note(chords[i][1][v]) for i in range(4)])[idx]
    ph = 2 * np.pi * np.cumsum(fm) / SR
    pad += np.sin(ph) + 0.2 * np.sin(2 * ph)
pad = lp(pad / 3, 1800) * 0.06
L += pad; R += np.roll(pad, int(0.012 * SR))

fade = np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 2.0)
mix = np.stack([L, R], 1) * fade[:, None]
mix /= np.abs(mix).max() / 0.8
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("ok")
