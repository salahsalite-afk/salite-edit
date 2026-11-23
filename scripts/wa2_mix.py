"""Ton für den WhatsApp-Kanal V2: Originalstimme unverändert (Kunde), danach nur leise UI-Töne im Standbild.

python scripts/wa2_mix.py <original.mov> <snd_dir> <out.wav>
Die Stimme wird nicht bearbeitet (kein EQ, keine Rauschminderung, keine Lautheitsanpassung). Effekte liegen erst
nach dem Satz (ab 2,6 s), überlagern die Stimme also nicht.
"""
import subprocess
import sys

import numpy as np
import soundfile as sf

src, snd, out = sys.argv[1:4]
SR = 48000
TOTAL = 6.9
N = int(round(TOTAL * SR))
raw = "/dev/shm/rtmp/_wa2_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ar", str(SR), "-c:a", "pcm_f32le", raw], check=True)
v, _ = sf.read(raw)
if v.ndim == 1:
    v = np.stack([v, v], 1)
mix = np.zeros((N, 2))
m = min(len(v), N)
mix[:m] = v[:m]
k = int(0.02 * SR)
end = int(2.55 * SR)
mix[end - k : end] *= np.linspace(1, 0, k)[:, None]  # nur 20 ms gegen Knacken am Clip-Ende
mix[end:] = 0


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


vr = mov_rms(v.mean(1), int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-4], 70))
for at, name, target in ((2.62, "ding", -16), (3.12, "pop", -24), (3.5, "pop", -26), (3.88, "pop", -26), (4.26, "pop", -26)):
    x, r = sf.read(f"{snd}/{name}.wav")
    x = np.stack([x, x], 1) if x.ndim == 1 else x
    pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(0.05 * SR))).max() + 1e-12)
    i = int(at * SR)
    n = min(len(x), N - i)
    mix[i : i + n] += x[:n] * 10 ** ((ref + target - pk) / 20)
peak = np.abs(mix).max()
if peak > 0.99:
    mix *= 0.99 / peak
sf.write(out, mix.astype(np.float32), SR)
print("ok", round(ref, 1), "peak", round(float(peak), 3))
