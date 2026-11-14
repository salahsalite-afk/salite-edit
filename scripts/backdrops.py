"""Hintergründe für Story-Szenen (1080x1920), Horizont bei FLOOR.

python scripts/backdrops.py <out_dir>
curtain: bordeauxroter Samtvorhang (Umkleide) an goldener Stange mit Ringen, darunter heller Studioboden.
silver: silberne, gebürstete Hohlkehle, Wand geht weich in den Boden über.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

out = sys.argv[1]
W, H = 1080, 1920
FLOOR = 1345
rng = np.random.default_rng(5)
yy, xx = np.mgrid[0:H, 0:W].astype(float)


def save(a, name):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(f"{out}/{name}.jpg", quality=95)
    print("ok", name)


# ---------- Umkleide-Vorhang ----------
# Faltenprofil: Summe von Wellen; oben unter der Stange enger gerafft
x = np.arange(W, dtype=float)
prof = np.zeros((H, W))
for k in range(7):
    lam = rng.uniform(70, 170)
    amp = rng.uniform(0.6, 1.0) * lam / 140
    ph = rng.uniform(0, 2 * np.pi)
    prof += amp * np.sin(2 * np.pi * x[None, :] / lam + ph + 0.0 * yy)
slope = np.gradient(prof, axis=1)
slope = slope / np.abs(slope).max() * 1.6
light = 0.5 + 0.5 * np.tanh(-slope * 1.3 + 0.2)  # Licht von links
sheen = np.clip(np.abs(slope) - 0.9, 0, None) * 0.12  # Samt glänzt leicht an den Faltenkanten
base = np.array([96, 16, 28.0])
cur = base[None, None, :] * (0.35 + 0.75 * light)[..., None] + np.array([120, 50, 58.0]) * sheen[..., None]
cur *= (0.92 + 0.08 * (1 - yy / H))[..., None]  # oben etwas heller
cur += ndimage.gaussian_filter(rng.normal(0, 1, (H, W)), (6, 0.6))[..., None] * 3  # Samtstruktur senkrecht
# Boden
floor = np.dstack([np.full((H, W), v) for v in (238, 238, 236)]).astype(float)
floor *= (1 - 0.06 * np.clip((yy - FLOOR) / 500, 0, 1))[..., None]
ROD0 = 128
# Saum leicht wellig, liegt auf dem Boden auf
hem = FLOOR + 6 + 5 * np.sin(x / 37) + prof[FLOOR] * 4
is_cur = (yy < hem[None, :]) & (yy > ROD0)
img = np.where(is_cur[..., None], cur, floor)
# Kontaktschatten des Vorhangs auf dem Boden
d = np.clip((yy - hem[None, :]) / 28, 0, 1)
shadow = (1 - d) * (yy >= hem[None, :]) * 0.28
img *= (1 - shadow)[..., None]
# goldene Stange mit Ringen
ROD = 128
rod = np.abs(yy - ROD) < 9
g = (yy - ROD + 9) / 18
gold = np.dstack([140 + 95 * np.sin(np.pi * g) ** 3, 106 + 85 * np.sin(np.pi * g) ** 3, 46 + 70 * np.sin(np.pi * g) ** 3])
img = np.where(rod[..., None], gold, img)
for rx in np.arange(30, W, 76):
    ring = (np.abs(np.hypot(xx - rx, (yy - ROD - 6) * 1.25) - 15) < 3) & (yy > ROD - 4)
    shade = 0.75 + 0.25 * np.cos((xx - rx) / 15 * 1.4)
    img = np.where(ring[..., None], np.dstack([176 * shade, 140 * shade, 72 * shade]), img)
# Schatten der Stange auf dem Stoff
img[ROD + 9 : ROD + 40] *= np.linspace(0.75, 1, 31)[:, None, None]
save(img, "bg_curtain")

# ---------- Silberne Hohlkehle ----------
# Höhe 0 Wand bis 1 Boden, weicher Übergang
t = np.clip((yy - (FLOOR - 220)) / 440, 0, 1)
t = t * t * (3 - 2 * t)
wall = 196 + 20 * np.exp(-((xx - W * 0.42) / 330) ** 2) - 10 * (yy / FLOOR)  # breites Licht von vorne links
flo = 212 - 26 * np.clip((yy - FLOOR) / 600, 0, 1) + 14 * np.exp(-((xx - W * 0.5) / 380) ** 2)
v = wall * (1 - t) + flo * t
# gebürstet: feine waagerechte Streifen, auf dem Boden längs
brush_w = ndimage.gaussian_filter(rng.normal(0, 1, (H, W)), (0.5, 30)) * 18
brush_f = ndimage.gaussian_filter(rng.normal(0, 1, (H, W)), (12, 0.6)) * 10
v = v + brush_w * (1 - t) + brush_f * t
# Metall: leicht kühler Ton, Glanzband in der Kehle
v = v + 18 * np.exp(-((yy - FLOOR) / 70) ** 2)
img = np.dstack([v - 3, v, v + 4])
save(img, "bg_silver")
