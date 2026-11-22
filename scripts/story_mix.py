"""Tonmischung für das Story-TikTok (src/bf/StoryTikTok.tsx): Stimme, Spannung bis zur Wendung, dann leiser Beat, Effekte.

python scripts/story_mix.py <story_dir> <sfx_dir> <out.wav>
- Stimme gesäubert, -14 LUFS, Ende direkt nach dem letzten Wort
- bis "dass es einen 550 GSM Trackie": dunkle Fläche plus Herzschlag (schneller werdend), Scratch auf der Wendung
- ab der Wendung der Beat (Drop auf "550"), leise, im Takt verlängert, unter der Stimme abgesenkt
- Effekte einzeln auf ein gemessenes Ziel relativ zur Stimme
"""
import json
import subprocess
import sys

import numpy as np
import soundfile as sf

D, SFX_DIR, OUT = sys.argv[1:4]
SR = 48000
TOTAL = 33.9
N = int(round(TOTAL * SR))
SND = f"{D}/snd"


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    return float([ln for ln in r.stderr.splitlines() if ln.strip().startswith("I:")][-1].split()[1])


def lufs_arr(x, tag):
    p = f"/dev/shm/rtmp/_sm_{tag}.wav"
    sf.write(p, x.astype(np.float32), SR)
    return lufs(p)


def mov_rms(x, k):
    c = np.concatenate([[0], np.cumsum(x**2)])
    return np.sqrt(np.maximum(c[k:] - c[:-k], 0) / k)


def load(path):
    x, r = sf.read(path)
    if r != SR:
        raise SystemExit(f"{path}: {r} Hz")
    return np.stack([x, x], 1) if x.ndim == 1 else x


# 1) Stimme
PRE = "highpass=f=90,lowpass=f=14000,afftdn=nf=-30,acompressor=threshold=0.08:ratio=3:attack=5:release=120:makeup=2"
raw = "/dev/shm/rtmp/_sm_voice.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/story.mp4", "-vn", "-ac", "1", "-ar", str(SR), "-af", PRE, raw], check=True)
g = -14 - lufs(raw)
v, _ = sf.read(raw)
v = v[:N] * 10 ** (g / 20)
v = np.pad(v, (0, max(0, N - len(v))))
k = int(0.03 * SR)
v[-k:] *= np.linspace(1, 0, k)
vr = mov_rms(v, int(0.4 * SR))
ref = 20 * np.log10(np.percentile(vr[vr > 1e-3], 70))

# 2) Spannung bis zur Wendung (10,65 s): Fläche, Herzschlag schneller werdend
fx = np.zeros((N, 2))


def place(at, x, target, peak_ms=50):
    pk = 20 * np.log10(mov_rms(x.mean(1), min(len(x), int(peak_ms / 1000 * SR))).max() + 1e-12)
    gain = 10 ** ((ref + target - pk) / 20)
    i = int(round(at * SR))
    m = min(len(x), N - i)
    if m > 0:
        fx[i : i + m] += x[:m] * gain


pad = load(f"{SND}/tension.wav")[: int(10.65 * SR)].copy()
k = int(0.06 * SR)
pad[-k:] *= np.linspace(1, 0, k)[:, None]
place(0.0, pad, -26, peak_ms=400)
for at in (0.0, 0.85, 1.7, 6.3, 7.05, 7.75, 8.4, 9.0, 9.55, 10.05):
    place(at, load(f"{SND}/heart.wav"), -18)

# 3) Beat ab der Wendung: Drop (Beat-Zeit 6,79) auf "550" (11,24 s), Schleifen an Taktgrenzen
BEAT, DROP_B, DROP_OUT, START = 0.441, 6.79, 11.24, 10.72
BAR = 4 * BEAT
beat = load(f"{D}/beat.wav")
loop_end = DROP_B + 8 * BAR
parts = [(DROP_B - (DROP_OUT - START), loop_end)]
need = (TOTAL - START) - (parts[0][1] - parts[0][0])
while need > 0:
    seg = min(need, loop_end - DROP_B)
    parts.append((DROP_B, DROP_B + seg))
    need -= seg
bt = np.zeros((0, 2))
xf = int(0.012 * SR)
for a, b in parts:
    x = beat[int(a * SR) : int(b * SR)].copy()
    if len(bt):
        x[:xf] *= np.linspace(0, 1, xf)[:, None]
        bt[-xf:] *= np.linspace(1, 0, xf)[:, None]
        bt = np.concatenate([bt[:-xf], bt[-xf:] + x[:xf], x[xf:]])
    else:
        bt = x
lb = lufs_arr(beat[int(DROP_B * SR) : int(loop_end * SR)], "b")
bt *= 10 ** ((-36 - lb) / 20)  # leise wie im Main-TikTok (rund 20 dB unter der Stimme)
full = np.zeros((N, 2))
i0 = int(START * SR)
m = min(len(bt), N - i0)
full[i0 : i0 + m] = bt[:m]
t = np.arange(N) / SR
full *= np.clip((t - START) / 0.05, 0, 1)[:, None] * np.clip((TOTAL - t) / 0.35, 0, 1)[:, None]

# 4) Effekte
EV = [
    (1.8, f"{SND}/tear.wav", -16),
    (3.3, f"{SFX_DIR}/whoosh_soft.wav", -20),
    (4.88, f"{SND}/buzz.wav", -18),
    (8.92, f"{SFX_DIR}/click.wav", -22),
    (10.6, f"{SND}/scratch.wav", -14),
    (11.0, f"{SND}/ding.wav", -22),
    (14.6, f"{SND}/ding.wav", -22),
    (17.3, f"{SND}/ding.wav", -22),
    (18.95, f"{SND}/ding.wav", -22),
    (21.02, f"{SND}/ding.wav", -22),
    (22.45, f"{SND}/mouse.wav", -16),
    (23.3, f"{SFX_DIR}/tick.wav", -20),
    (23.84, f"{SFX_DIR}/hit_low.wav", -18),
    (24.9, f"{SND}/mouse.wav", -16),
    (30.55, f"{SFX_DIR}/click.wav", -20),
    (31.58, f"{SFX_DIR}/notify.wav", -18),
]
COMMENT = "Ich brauche ein Passwort"
TA, TE = 28.8, 30.42
for i, ch in enumerate(COMMENT):
    if ch != " ":
        EV.append((TA + (TE - TA) * i / len(COMMENT), f"{SFX_DIR}/keyboard_tap{i % 3 + 1}.wav", -26))
for at, path, target in EV:
    place(at, load(path), target)

mix = np.stack([v, v], 1) + full + fx
lm = lufs_arr(mix, "mix")
mix *= 10 ** ((-14 - lm) / 20)
sf.write("/dev/shm/rtmp/_sm_pre.wav", mix.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/dev/shm/rtmp/_sm_pre.wav", "-af", "alimiter=limit=0.89:attack=3:release=60:level=false", "-ar", str(SR), "-c:a", "pcm_s24le", OUT], check=True)
vb = mov_rms(full.mean(1), int(0.4 * SR))
print(json.dumps({"final_lufs": round(lufs(OUT), 1), "beat_rel_stimme_db": round(20 * np.log10(np.percentile(vb[vb > 1e-5], 70)) - ref, 1), "beat_teile": [(round(a, 2), round(b, 2)) for a, b in parts]}))
