"""Sprachspur für den WhatsApp-Aufruf mit Freeze: weicher Übergang statt hartem Schnitt.

python scripts/wa_voice_track.py <voice.wav> <out.wav> <cut> <freeze> <clip> <tail>
- bis <cut> Originalstimme, kurzes Ausblenden nach "Channel"
- im Freeze: "Channel" hallt als Echo nach, jede Wiederholung leiser, dumpfer und etwas langsamer (wie eine Erinnerung im Film),
  dazu ein leiser Raumhall der ganzen Phrase "WhatsApp-Channel"
- nach dem Freeze: Stimme blendet weich wieder ein
- am Ende: "Passwort" hallt im Standbild nach
"""
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample, sosfilt

src_p, out_p = sys.argv[1], sys.argv[2]
CUT, FREEZE, CLIP, TAIL = map(float, sys.argv[3:7])
x, SR = sf.read(src_p)
if x.ndim > 1:
    x = x.mean(1)
total = CLIP + FREEZE + TAIL
y = np.zeros(int(total * SR) + SR)
rng = np.random.default_rng(1)


def seg(a, b):
    return x[int(a * SR) : int(b * SR)].copy()


def fade(s, fi=0.0, fo=0.0):
    n = len(s)
    if fi:
        k = min(n, int(fi * SR))
        s[:k] *= np.linspace(0, 1, k) ** 1.5
    if fo:
        k = min(n, int(fo * SR))
        s[-k:] *= np.linspace(1, 0, k) ** 1.5
    return s


def put(s, at, g=1.0):
    i = int(at * SR)
    m = min(len(s), len(y) - i)
    y[i : i + m] += s[:m] * g


def lowp(s, fc):
    return sosfilt(butter(2, fc / (SR / 2), "low", output="sos"), s)


def reverb(s, length=1.4, mix=0.35):
    t = np.arange(int(length * SR)) / SR
    ir = rng.normal(0, 1, len(t)) * np.exp(-t * 4.0)
    ir = lowp(ir, 3500)
    ir /= np.sqrt(np.sum(ir**2))
    wet = np.convolve(s, ir)[: len(s) + len(ir)]
    out = np.zeros(len(wet))
    out[: len(s)] += s * (1 - mix)
    return out + wet * mix


def echo_word(word, start, repeats, gap, gain, slow):
    """Wiederholungen eines Wortes: leiser, dumpfer, etwas langsamer."""
    for k in range(1, repeats + 1):
        r = slow**k
        w = resample(word, int(len(word) / r)) if r != 1 else word
        w = lowp(w, max(900, 3600 * 0.75**k))
        w = reverb(w, 1.0, 0.45)
        put(fade(w, 0.02, 0.15), start + k * gap, gain**k)


# 1) bis zum Freeze, weich aus
put(fade(seg(0, CUT), 0, 0.08), 0)
# 2) Echo im Freeze: "Channel" und leiser Hall der Phrase
channel = fade(seg(1.10, CUT), 0.02, 0.06)
echo_word(channel, 1.10, repeats=5, gap=0.55, gain=0.6, slow=0.94)
phrase = fade(seg(0.84, CUT), 0.03, 0.08)
put(reverb(lowp(phrase, 2500), 2.4, 1.0) * 0.35, 0.84)
# 3) nach dem Freeze weich wieder rein
FE = CUT + FREEZE
put(fade(seg(CUT, CLIP), 0.18, 0.05), FE)
# 4) Ende: "Passwort" hallt nach
pw_src = (2.58, 2.95)
pw = fade(seg(*pw_src), 0.02, 0.06)
echo_word(pw, pw_src[0] + FREEZE, repeats=3, gap=0.5, gain=0.55, slow=0.95)

y = y[: int(total * SR)]
end_fade = int(0.35 * SR)
y[-end_fade:] *= np.linspace(1, 0, end_fade)
peak = np.abs(y).max()
if peak > 0.95:
    y *= 0.95 / peak
sf.write(out_p, np.stack([y, y], 1).astype(np.float32), SR)
print("ok", round(total, 2))
