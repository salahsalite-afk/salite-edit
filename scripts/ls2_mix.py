"""Ton für Longsleeve-Video 2 (src/bf/LongsleeveTikTok2.tsx): Originalstimme unverändert, dazu Effekte.

python scripts/ls2_mix.py <original.mov> <snd_dir> <out.wav>
Stimme ohne EQ, Rauschminderung oder Lautheitsanpassung (Kunde). Effekte einzeln auf ein Ziel relativ zur Stimme
gepegelt (Spitze 50 ms RMS gegen p70 der Stimme in 400 ms Fenstern): plakativ nur im Hook, danach leise.
Kassen-Sound (eigene Synthese, kein Shopify-Original) auf "bedienen", "39" und "30".
"""
import subprocess
import sys

import numpy as np
import soundfile as sf

src, snd, out = sys.argv[1:4]
SR = 48000
TOTAL = 25.05
N = int(round(TOTAL * SR))
raw = "/dev/shm/rtmp/_ls2_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ar", str(SR), "-c:a", "pcm_f32le", raw], check=True)
v, _ = sf.read(raw)
if v.ndim == 1:
    v = np.stack([v, v], 1)
mix = np.zeros((N, 2))
m = min(len(v), N)
mix[:m] = v[:m]


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


vr = mov_rms(v.mean(1), int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-4], 70))
# Zeit, Datei, Ziel in dB relativ zur Stimme (höchstens ein Effekt pro Sekunde)
FX = [
    (0.02, "punch", -9),    # LONGSLEEVE
    (1.10, "punch", -8),    # FOR FREE
    (1.68, "swoosh", -15),  # Übergang mit Zoom-Unschärfe, Ibos Kommentar fliegt mit rein
    (4.45, "pop", -26),     # Longsleeve am Model
    (5.40, "swoosh", -23),  # Detail Nappaleder
    (6.50, "pop", -26),     # 100 % Baumwolle
    (8.90, "swoosh", -23),  # Neck Detail
    (11.86, "pop", -25),    # 1 bestellen
    (13.10, "ping", -22),   # 3 Longsleeve gratis
    (15.22, "coin", -13),   # reichlich bedienen
    (16.32, "coin", -13),   # Hoodie 39 €
    (17.82, "coin", -13),   # Jogger 30 €
    (19.26, "pop", -25),    # letzte Passwörter
    (22.04, "ping", -20),   # Folgen-Haken
    (23.20, "pop", -26),    # Accounts
    (24.58, "ping", -23),   # Slot geschafft
]
rep = []
for at, name, target in FX:
    x, r = sf.read(f"{snd}/{name}.wav")
    assert r == SR, (name, r)
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(0.05 * SR))).max() + 1e-12)
    i = int(at * SR)
    n = min(len(x), N - i)
    y = x[:n] * 10 ** ((ref + target - pk) / 20)
    mix[i : i + n] += y
    rep.append((at, name, target))
peak = np.abs(mix).max()
if peak > 0.99:
    mix *= 0.99 / peak
sf.write(out, mix.astype(np.float32), SR)
print("Stimme p70", round(ref, 1), "dBFS, Spitze", round(float(peak), 3))
