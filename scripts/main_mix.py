"""Tonmischung für das Main-TikTok (src/bf/MainTikTok.tsx): Stimme + Beat + Effekte.

python scripts/main_mix.py <main_dir> <sfx_dir> <out.wav> [beat_lufs|none]
- Stimme aus dem Original säubern, auf -14 LUFS, Pausen wie im Bild herausschneiden (kurze Blenden)
- Beat (wie Beat-Schnitt): Drop auf "69 €", danach im Takt verlängert (Schleifen an Taktgrenzen),
  unter der Stimme abgesenkt. Pegel als 4. Argument (z. B. -36 = sehr leise), "none" = ohne Musik
  (für einen Song, der in der TikTok-App dazukommt)
- Effekte einzeln auf ein gemessenes Ziel relativ zur Stimme gepegelt
- Gesamt auf -14 LUFS mit Limiter
"""
import json
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import lfilter

main_dir, sfx_dir, out_p = sys.argv[1:4]
BEAT_LUFS = sys.argv[4] if len(sys.argv) > 4 else "-36"
SR = 48000
EDL = [(0, 9.16), (9.42, 29.95), (30.29, 40.08)]
STARTS = [0.0]
for a, b in EDL[:-1]:
    STARTS.append(STARTS[-1] + b - a)
TOTAL = STARTS[-1] + EDL[-1][1] - EDL[-1][0]
N = int(round(TOTAL * SR))


def o(s):
    for i in range(len(EDL) - 1, -1, -1):
        if s >= EDL[i][0]:
            return STARTS[i] + min(s, EDL[i][1]) - EDL[i][0]
    return 0.0


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    return float([ln for ln in r.stderr.splitlines() if ln.strip().startswith("I:")][-1].split()[1])


def lufs_arr(x, tag):
    p = f"/dev/shm/rtmp/_mm_{tag}.wav"
    sf.write(p, x.astype(np.float32), SR)
    return lufs(p)


def shelf(x, f0, gain_db, kind):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    cs, sn = np.cos(w), np.sin(w)
    sA = 2 * np.sqrt(A) * sn / 2 * np.sqrt(2)
    if kind == "low":
        bb = [A * ((A + 1) - (A - 1) * cs + sA), 2 * A * ((A - 1) - (A + 1) * cs), A * ((A + 1) - (A - 1) * cs - sA)]
        aa = [(A + 1) + (A - 1) * cs + sA, -2 * ((A - 1) + (A + 1) * cs), (A + 1) + (A - 1) * cs - sA]
    else:
        bb = [A * ((A + 1) + (A - 1) * cs + sA), -2 * A * ((A - 1) + (A + 1) * cs), A * ((A + 1) + (A - 1) * cs - sA)]
        aa = [(A + 1) - (A - 1) * cs + sA, 2 * ((A - 1) - (A + 1) * cs), (A + 1) - (A - 1) * cs - sA]
    return lfilter(np.array(bb) / aa[0], np.array(aa) / aa[0], x, axis=0)


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


# 1) Stimme
PRE = "highpass=f=90,lowpass=f=14000,afftdn=nf=-30,acompressor=threshold=0.08:ratio=3:attack=5:release=120:makeup=2"
raw = "/dev/shm/rtmp/_mm_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{main_dir}/main.mp4", "-vn", "-ac", "1", "-ar", str(SR), "-af", PRE, raw], check=True)
g = -14 - lufs(raw)
src, _ = sf.read(raw)
src *= 10 ** (g / 20)
voice = np.zeros(N)
for (a, b), at in zip(EDL, STARTS):
    x = src[int(a * SR) : int(b * SR)].copy()
    k = int(0.01 * SR)
    x[:k] *= np.linspace(0, 1, k)
    x[-k:] *= np.linspace(1, 0, k)
    i = int(round(at * SR))
    m = min(len(x), N - i)
    voice[i : i + m] += x[:m]
print(f"Stimme {g:+.1f} dB")

# 2) Beat: Drop (Beat-Zeit 6,79) auf "69 €", danach Schleifen an Taktgrenzen (8 Takte ab Drop)
BEAT, DROP_B = 0.441, 6.79
BAR = 4 * BEAT
drop_out = o(3.25)
beat, bsr = sf.read(f"{main_dir}/beat.wav")
assert bsr == SR
if beat.ndim == 1:
    beat = np.stack([beat, beat], 1)
loop_end = DROP_B + 8 * BAR
parts = [(DROP_B - drop_out, loop_end)]
need = TOTAL - (loop_end - (DROP_B - drop_out))
while need > 0:
    seg = min(need, loop_end - DROP_B)
    parts.append((DROP_B, DROP_B + seg))
    need -= seg
bt = np.zeros((0, 2))
xf = int(0.012 * SR)
for a, b in parts:
    x = beat[int(a * SR) : int(b * SR)].copy()
    if len(bt) and xf:
        x[:xf] *= np.linspace(0, 1, xf)[:, None]
        bt[-xf:] *= np.linspace(1, 0, xf)[:, None]
        bt = np.concatenate([bt[:-xf], bt[-xf:] + x[:xf], x[xf:]])
    else:
        bt = np.concatenate([bt, x])
bt = bt[:N]
if len(bt) < N:
    bt = np.pad(bt, ((0, N - len(bt)), (0, 0)))
bt = shelf(bt, 70, 2.0, "low")
t = np.arange(N) / SR
fade = np.clip((TOTAL - t) / 0.35, 0, 1)
ve = mov_rms(np.pad(np.abs(voice), (2400, 2399)), 4800)[: N]
thr = 10 ** (-40 / 20)
duck_db = np.clip(20 * np.log10(np.maximum(ve, 1e-9) / thr) * 0.3, 0, 6)
# geglättet, damit nichts pumpt
k = int(0.15 * SR)
duck_db = np.convolve(duck_db, np.ones(k) / k, "same")
bt *= (fade * 10 ** (-duck_db / 20))[:, None]
lb = lufs_arr(beat[int(DROP_B * SR) : int(loop_end * SR)], "b")
bt *= 0.0 if BEAT_LUFS == "none" else 10 ** ((float(BEAT_LUFS) - lb) / 20)  # Kunde: Beat viel leiser

# 3) Effekte (Quellzeit, Datei, Ziel dB relativ zur Stimme)
CARDS = [5.25, 9.5, 10.65, 12.0, 14.25, 15.0, 16.2, 19.2, 20.15, 21.05, 21.95, 23.3, 27.6, 33.3]  # Instagram-Karte bei 3.04 ohne Klick
COMMENT = "Ich brauche ein Passwort"
TA, TE = 31.42, 32.55
SND = f"{main_dir}/snd"
SFX = [(0.0, f"{SND}/alarm.wav", -18), (0.84, f"{SND}/strike.wav", -20), (1.32, f"{SND}/strike.wav", -20), (1.6, f"{sfx_dir}/hit_low.wav", -16), (5.82, f"{SND}/strike.wav", -20)]  # Hook, Puffer; kein Schlag bei "69 €" (Kunde: hackt)
SFX += [(a, f"{SND}/mouse.wav", -16) for a in CARDS]
SFX += [
    (7.5, f"{sfx_dir}/hit_low.wav", -18),
    (26.55, f"{sfx_dir}/hit_low.wav", -18),
    (17.06, f"{sfx_dir}/tick.wav", -20),
    (31.0, f"{sfx_dir}/notify.wav", -18),
    (32.68, f"{sfx_dir}/click.wav", -20),
    (33.8, f"{SND}/stamp.wav", -14),
    (34.25, f"{sfx_dir}/whoosh_soft.wav", -20),
    (35.45, f"{sfx_dir}/hit_low.wav", -18),
    (37.6, f"{sfx_dir}/notify.wav", -18),
    (38.1, f"{sfx_dir}/whoosh_soft.wav", -20),
]
for i, ch in enumerate(COMMENT):
    if ch != " ":
        SFX.append((TA + (TE - TA) * i / len(COMMENT), f"{sfx_dir}/keyboard_tap{i % 3 + 1}.wav", -26))

vr = mov_rms(voice, int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-3], 70))
fx = np.zeros((N, 2))
report = []
for at_src, path, target in SFX:
    x, r = sf.read(path)
    if r != SR:
        raise SystemExit(f"{path}: {r} Hz")
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(0.05 * SR))).max() + 1e-12)
    gain = 10 ** ((ref + target - pk) / 20)
    i = int(round(o(at_src) * SR))
    m = min(len(x), N - i)
    if m > 0:
        fx[i : i + m] += x[:m] * gain
    report.append((round(o(at_src), 2), path.split("/")[-1], target))

mix = np.stack([voice, voice], 1) + bt + fx
lm = lufs_arr(mix, "mix")
mix *= 10 ** ((-14 - lm) / 20)
sf.write("/dev/shm/rtmp/_mm_pre.wav", mix.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/dev/shm/rtmp/_mm_pre.wav", "-af", "alimiter=limit=0.89:attack=3:release=60:level=false", "-ar", str(SR), "-c:a", "pcm_s24le", out_p], check=True)
sf.write("/dev/shm/rtmp/_mm_v.wav", np.stack([voice, voice], 1).astype(np.float32), SR)
sf.write("/dev/shm/rtmp/_mm_b.wav", bt.astype(np.float32), SR)
sf.write("/dev/shm/rtmp/_mm_fx.wav", fx.astype(np.float32), SR)
print(json.dumps({"dauer": round(TOTAL, 2), "beat_teile": [(round(a, 2), round(b, 2)) for a, b in parts], "final_lufs": round(lufs(out_p), 1), "effekte": len(report)}))
