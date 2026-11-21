"""Tonmischung für den Beat-Schnitt (src/bf/CutBeat.tsx): Stimmen + bearbeiteter Beat + Effekte.

python scripts/cut_mix.py <cut_dir> <sfx_dir> <out.wav>
- Stimmen je Clip säubern, auf etwa -14 LUFS, an die Ausgabezeiten legen (Clip 4 ohne Ton)
- Beat ab 3,17 s (Drop bei 3,62 s im Video): Bass +3 dB, Höhen +1,5 dB, leichte Sättigung,
  kurze Pause direkt vor dem Drop, unter der Stimme weich abgesenkt (Ducking), am Ende ausblenden
- Effekte einzeln eingepegelt: Ziel = Spitze (50 ms RMS) relativ zum Sprachpegel, gemessen statt geschätzt
- Gesamt auf -14 LUFS mit Limiter
"""
import json
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import lfilter

cut, sfx_dir, out_p = sys.argv[1:4]
SR = 48000
BEAT = 0.441
DROP = 3.62
B0 = 6.79 - DROP


def b(k):
    return DROP + k * BEAT


# gleiche Segmente wie in CutBeat.tsx: (Clip, Quelle, Ausgabe, Dauer, Ton an)
SEGS = [
    (1, 0.0, 0.0, DROP, True),
    (2, 0.0, b(0), 4 * BEAT, True),
    (3, 0.12, b(4), 7 * BEAT, True),
    (4, 0.0, b(11), 4 * BEAT, False),
    (5, 0.06, b(15), 8 * BEAT, True),
    (6, 0.0, b(23), 6.85, True),
]
TOTAL = b(40)
N = int(round(TOTAL * SR))


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    lines = [ln for ln in r.stderr.splitlines() if ln.strip().startswith("I:")]
    return float(lines[-1].split()[1])


def lufs_arr(x, tag):
    p = f"/dev/shm/rtmp/_m_{tag}.wav"
    sf.write(p, x.astype(np.float32), SR)
    return lufs(p)


def shelf(x, f0, gain_db, kind):
    """RBJ-Shelving-Filter."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    cs, sn = np.cos(w), np.sin(w)
    al = sn / 2 * np.sqrt(2)
    sA = 2 * np.sqrt(A) * al
    if kind == "low":
        bb = [A * ((A + 1) - (A - 1) * cs + sA), 2 * A * ((A - 1) - (A + 1) * cs), A * ((A + 1) - (A - 1) * cs - sA)]
        aa = [(A + 1) + (A - 1) * cs + sA, -2 * ((A - 1) + (A + 1) * cs), (A + 1) + (A - 1) * cs - sA]
    else:
        bb = [A * ((A + 1) + (A - 1) * cs + sA), -2 * A * ((A - 1) + (A + 1) * cs), A * ((A + 1) + (A - 1) * cs - sA)]
        aa = [(A + 1) - (A - 1) * cs + sA, 2 * ((A - 1) - (A + 1) * cs), (A + 1) - (A - 1) * cs - sA]
    return lfilter(np.array(bb) / aa[0], np.array(aa) / aa[0], x, axis=0)


def env_follow(x, att, rel):
    a_a = np.exp(-1 / (att * SR))
    a_r = np.exp(-1 / (rel * SR))
    e = np.zeros_like(x)
    v = 0.0
    for i, s in enumerate(x):
        c = a_a if s > v else a_r
        v = c * v + (1 - c) * s
        e[i] = v
    return e


# 1) Stimmen
PRE = "highpass=f=90,lowpass=f=14000,afftdn=nf=-30,acompressor=threshold=0.08:ratio=3:attack=5:release=120:makeup=2"
voice = np.zeros(N)
for clip, src, at, dur, on in SEGS:
    if not on:
        continue
    raw = f"/dev/shm/rtmp/_v{clip}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{cut}/n{clip}.mp4", "-vn", "-ac", "1", "-ar", str(SR), "-af", PRE, raw], check=True)
    g = -14 - lufs(raw)
    x, _ = sf.read(raw)
    x = x[int(src * SR) : int((src + dur) * SR)] * 10 ** (g / 20)
    fi, fo = int(0.006 * SR), int(0.012 * SR)
    x[:fi] *= np.linspace(0, 1, fi)
    x[-fo:] *= np.linspace(1, 0, fo)
    i = int(round(at * SR))
    m = min(len(x), N - i)
    voice[i : i + m] += x[:m]
    print(f"Stimme {clip}: {g:+.1f} dB")

# 2) Beat
beat, bsr = sf.read(f"{cut}/beat.wav")
assert bsr == SR, bsr
if beat.ndim == 1:
    beat = np.stack([beat, beat], 1)
bt = beat[int(B0 * SR) : int(B0 * SR) + N].copy()
if len(bt) < N:
    bt = np.pad(bt, ((0, N - len(bt)), (0, 0)))
bt = shelf(bt, 70, 3.0, "low")
bt = shelf(bt, 9000, 1.5, "high")
pk = np.abs(bt).max()
bt = np.tanh(bt / pk * 1.3) / np.tanh(1.3) * pk  # leichte Sättigung für mehr Druck
t = np.arange(N) / SR
# kurze Pause direkt vor dem Drop (eine Achtel), dann voll rein
gap = np.ones(N)
gap[(t >= DROP - 0.16) & (t < DROP)] = 10 ** (-14 / 20)
k = int(0.01 * SR)
ga = int((DROP - 0.16) * SR)
gap[ga : ga + k] = np.linspace(1, 10 ** (-14 / 20), k)
# Ende: über den Standbild-Rest ausblenden
fade = np.clip((TOTAL - t) / 0.9, 0, 1) ** 1.5
# Ducking unter der Stimme: bis 7 dB, weich
ve = env_follow(np.abs(voice), 0.01, 0.25)
thr = 10 ** (-38 / 20)
duck_db = np.clip(20 * np.log10(np.maximum(ve, 1e-9) / thr) * 0.35, 0, 7)
duck = 10 ** (-duck_db / 20)
bt *= (gap * fade * duck)[:, None]
# Beat-Pegel: ohne Ducking 6 LU unter der Stimme
lb = lufs_arr(beat[int(B0 * SR) : int(B0 * SR) + N], "b")
bt *= 10 ** ((-20 - lb) / 20)

# 3) Effekte: (Zeit, Datei, Ziel in dB relativ zur Stimme)
SFX = [
    (0.0, f"{sfx_dir}/whoosh_soft.wav", -20),
    (0.95, f"{cut}/snd/ping.wav", -20),
    (1.30, f"{cut}/snd/ping.wav", -21),
    (1.65, f"{cut}/snd/ping.wav", -22),
    (2.00, f"{cut}/snd/ping.wav", -22),
    (DROP - 0.55, f"{sfx_dir}/riser_short.wav", -16),
    (DROP, f"{cut}/snd/drop.wav", -9),
    (4.30, f"{cut}/snd/pop.wav", -16),
    (5.45, f"{cut}/snd/shimmer.wav", -18),
    (7.40, f"{sfx_dir}/whoosh_soft.wav", -18),
    (b(11) - 0.05, f"{sfx_dir}/whoosh_soft.wav", -16),
    (b(15) - 0.5, f"{sfx_dir}/riser_short.wav", -18),
    (10.96, f"{sfx_dir}/hit_low.wav", -16),
    (12.40, f"{cut}/snd/wind.wav", -18),
    (14.30, f"{sfx_dir}/notify.wav", -16),
    (16.30, f"{sfx_dir}/click.wav", -18),
    (19.10, f"{sfx_dir}/tick.wav", -20),
]


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


vr = mov_rms(voice, int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-3], 70))
fx = np.zeros((N, 2))
for at, path, target in SFX:
    x, r = sf.read(path)
    if r != SR:
        raise SystemExit(f"{path}: {r} Hz")
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(0.05 * SR))).max() + 1e-12)
    g = 10 ** ((ref + target - pk) / 20)
    i = int(round(at * SR))
    m = min(len(x), N - i)
    fx[i : i + m] += x[:m] * g

mix = np.stack([voice, voice], 1) + bt + fx
lm = lufs_arr(mix, "mix")
mix *= 10 ** ((-14 - lm) / 20)
sf.write("/dev/shm/rtmp/_pre.wav", mix.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/dev/shm/rtmp/_pre.wav", "-af", "alimiter=limit=0.89:attack=3:release=60:level=false", "-ar", str(SR), "-c:a", "pcm_s24le", out_p], check=True)
print(json.dumps({"mix_lufs_vor": round(lm, 1), "beat_lufs_roh": round(lb, 1), "final": round(lufs(out_p), 1)}))
# Stems zum Messen
sf.write("/dev/shm/rtmp/_voice.wav", np.stack([voice, voice], 1).astype(np.float32), SR)
sf.write("/dev/shm/rtmp/_beat.wav", bt.astype(np.float32), SR)
sf.write("/dev/shm/rtmp/_fx.wav", fx.astype(np.float32), SR)
