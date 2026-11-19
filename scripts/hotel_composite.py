"""Hintergrund tauschen: Personen und Auto vor einen neuen Ort setzen (hier Hotel-Einfahrt bei Nacht).

.venv/bin/python scripts/hotel_composite.py <clip> <cut_dir> <car_dir> <bg.jpg> <out.mp4> <preset> [frame]
cut_dir: Personen-Freistellung (scripts/cutout.py, cut_XXXX.png), car_dir: Auto-Maske (scripts/sam_mask.py, m_XXXX.png).
Ausgabe 1080x1920, 30 fps, CRF 14. Mit [frame] nur ein Standbild als PNG (zum Prüfen).
- Hintergrund folgt der Handkamera (Verschiebung der Auto-Maske), leichte Tiefenschärfe, feines Korn
- Auto und Personen leicht wärmer und dunkler (Abendlicht), Lichtsaum aus dem Hintergrund an den Kanten
- Kontaktschatten unter dem Auto und unter den Füßen aus den echten Umrissen
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

clip, cut_dir, car_dir, bg_p, out = sys.argv[1:6]
preset = sys.argv[6]
single = int(sys.argv[7]) if len(sys.argv) > 7 else None
W, H = 1080, 1920
P = {
    # bg_scale: Hintergrund relativ zu "füllt das Bild", bg_y: vertikale Position 0 oben bis 1 unten, blur: Tiefenschärfe
    "mann": dict(bg_scale=1.35, bg_y=1.0, blur=2.2, keep_below=None, feet=True, car_shadow=True, grade=(0.82, 0.77, 0.68), bright=1.3),
    "frau": dict(bg_scale=1.30, bg_y=0.92, blur=6.0, keep_below=760, feet=False, car_shadow=False, grade=(0.84, 0.79, 0.70), bright=1.25),
}[preset]

w, h = 720, 1280
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", clip, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
N = len(frames)

bg0 = Image.open(bg_p).convert("RGB")
s = max(W / bg0.width, H / bg0.height) * P["bg_scale"]
BG = np.asarray(bg0.resize((round(bg0.width * s), round(bg0.height * s)), Image.LANCZOS)).astype(np.float32)
BG = ndimage.gaussian_filter(BG, (P["blur"], P["blur"], 0))
BG = np.clip(BG * P["bright"], 0, 255)
by, bx = BG.shape[:2]
oy0 = (by - H) * P["bg_y"]
ox0 = (bx - W) / 2


def load_mask(d, pref, i, chan=None):
    p = f"{d}/{pref}_{i:04d}.png"
    if not os.path.exists(p):
        return np.zeros((h, w), np.float32)
    im = Image.open(p)
    a = np.asarray(im)[..., 3] if chan == "a" else np.asarray(im.convert("L"))
    return a.astype(np.float32) / 255


# Kamerabewegung aus dem Schwerpunkt der Auto-Maske
cent = []
for i in range(N):
    m = load_mask(car_dir, "m", i) > 0.5
    cent.append(ndimage.center_of_mass(m) if m.any() else (h / 2, w / 2))
cent = np.array(cent)
cent = ndimage.gaussian_filter1d(cent, 1.5, axis=0)
shake = (cent - cent[0]) * (W / w)  # in Ausgabe-Pixeln
rng = np.random.default_rng(3)


def compose(i):
    f = frames[i].astype(np.float32)
    person = load_mask(cut_dir, "cut", i, "a")
    car = load_mask(car_dir, "m", i)
    car = ndimage.binary_closing(car > 0.5, iterations=4)
    car = ndimage.binary_fill_holes(car).astype(np.float32)
    lab, n = ndimage.label(car > 0.5)
    if n > 1:  # nur das größte Stück (das Auto), kleine Inseln weg
        sz = ndimage.sum(car > 0.5, lab, range(1, n + 1))
        car = (lab == (np.argmax(sz) + 1)).astype(np.float32)
    fg = np.maximum(person, ndimage.gaussian_filter(car, 1.2))
    if P["keep_below"]:
        yy = np.arange(h)[:, None]
        fg = np.maximum(fg, np.clip((yy - P["keep_below"]) / 40, 0, 1) * np.ones((1, w)))
    # auf 1080x1920
    F = np.asarray(Image.fromarray(f.astype(np.uint8)).resize((W, H), Image.LANCZOS)).astype(np.float32)
    A = np.asarray(Image.fromarray((fg * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255
    Cm = np.asarray(Image.fromarray((car * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255
    Pm = np.asarray(Image.fromarray((person * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255
    # Hintergrund mit Kamerafolge (Parallaxe 0,8) und sehr langsamem Hineinfahren
    dy, dx = shake[i] * 0.8
    push = 1 + 0.015 * i / max(1, N - 1)
    oy = int(np.clip(oy0 + dy + (H * (push - 1)) / 2, 0, by - H))
    ox = int(np.clip(ox0 + dx, 0, bx - W))
    bg = BG[oy : oy + H, ox : ox + W].copy()
    # Kontaktschatten
    if P["car_shadow"] and Cm.any():
        rows = np.where(Cm.max(1) > 0.5)[0]
        yb = rows.max()
        band = np.zeros_like(Cm)
        band[max(0, yb - 60) : yb + 1] = Cm[max(0, yb - 60) : yb + 1]
        sh = ndimage.gaussian_filter(np.roll(band, 18, axis=0), (14, 30))
        bg *= (1 - 0.8 * np.clip(sh * 2.0, 0, 1))[..., None]
    if P["feet"] and Pm.any():
        rows = np.where(Pm.max(1) > 0.5)[0]
        yb = rows.max()
        band = np.zeros_like(Pm)
        band[max(0, yb - 40) : yb + 1] = Pm[max(0, yb - 40) : yb + 1]
        sh = ndimage.gaussian_filter(np.roll(band, 8, axis=0), (6, 16))
        bg *= (1 - 0.55 * np.clip(sh * 1.8, 0, 1))[..., None]
    bg += rng.normal(0, 2.2, (H, W, 1))  # Korn wie im Handyvideo
    # Vordergrund ans Abendlicht anpassen
    G = F * np.array(P["grade"], np.float32)
    G = (G - 128) * 1.04 + 128
    # Lichtsaum: Hintergrundlicht an den Kanten
    edge = np.clip(A - ndimage.grey_erosion(A, size=(7, 7)), 0, 1)
    glow = ndimage.gaussian_filter(bg, (8, 8, 0))
    G = G * (1 - 0.35 * edge[..., None]) + glow * 0.35 * edge[..., None]
    out_img = G * A[..., None] + bg * (1 - A[..., None])
    return np.clip(out_img, 0, 255).astype(np.uint8)


if single is not None:
    Image.fromarray(compose(single)).save(out)
    print("ok", out)
    sys.exit()
enc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
     "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", out],
    stdin=subprocess.PIPE,
)
for i in range(N):
    enc.stdin.write(compose(i).tobytes())
enc.stdin.close()
enc.wait()
print("ok", out, N)
