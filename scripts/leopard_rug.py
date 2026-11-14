"""Bordeauxroter Leoparden-Läufer als Requisit (Draufsicht-Textur, danach perspektivisch gestaucht).

python scripts/leopard_rug.py <out.png> <breite> <tiefe_auf_dem_bildschirm>
Rosetten wie beim Leopardenfell (gebrochene dunkle Ringe mit hellerem Kern), Florstruktur,
dunkle Einfassung, sanftes Licht. Ausgabe RGBA, Boden-Perspektive: hinten schmaler (gestaucht).
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

out, W, D = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
rng = np.random.default_rng(11)
TW, TH = W, int(W * 0.2)  # Draufsicht: Läufer 5:1
S = 2  # Supersampling

base = np.array([104, 24, 34.0])  # Bordeaux
ring = np.array([38, 8, 12.0])  # dunkle Rosette
core = np.array([140, 52, 56.0])  # hellerer Kern

img = Image.new("RGB", (TW * S, TH * S), tuple(base.astype(int)))
d = ImageDraw.Draw(img)
# Rosetten auf einem gestörten Raster: offene, unregelmäßige Bögen um einen helleren Kern
step = 78 * S
for gy in range(-1, TH * S // step + 2):
    for gx in range(-1, TW * S // step + 2):
        cx = (gx + 0.5 + rng.uniform(-0.3, 0.3) + (0.5 if gy % 2 else 0)) * step
        cy = (gy + 0.5 + rng.uniform(-0.3, 0.3)) * step
        r = rng.uniform(17, 26) * S
        sq = rng.uniform(0.75, 1.0)
        d.ellipse((cx - r * 0.75, cy - r * 0.75 * sq, cx + r * 0.75, cy + r * 0.75 * sq), fill=tuple(core.astype(int)))
        k = rng.integers(2, 4)
        a0 = rng.uniform(0, 360)
        for j in range(k):
            span = rng.uniform(55, 95)
            st = a0 + j * 360 / k + rng.uniform(-15, 15)
            w = int(rng.uniform(5, 9) * S)
            d.arc((cx - r, cy - r * sq, cx + r, cy + r * sq), st, st + span, fill=tuple(ring.astype(int)), width=w)
        for _ in range(rng.integers(0, 3)):
            px, py = cx + rng.uniform(-step / 2, step / 2), cy + rng.uniform(-step / 2, step / 2)
            pr = rng.uniform(3, 6) * S
            d.ellipse((px - pr * 1.3, py - pr, px + pr * 1.3, py + pr), fill=tuple(ring.astype(int)))
img = img.filter(ImageFilter.GaussianBlur(1.4 * S)).resize((TW, TH), Image.LANCZOS)
a = np.asarray(img).astype(float)
# Flor: feines, leicht gerichtetes Rauschen
fur = ndimage.gaussian_filter(rng.normal(0, 1, (TH, TW)), (0.6, 1.4)) * 7
a += fur[..., None]
# Einfassung
yy, xx = np.mgrid[0:TH, 0:TW]
edge = np.minimum.reduce([yy, TH - 1 - yy, xx, TW - 1 - xx]).astype(float)
band = (edge < 14).astype(float)
a = a * (1 - band[..., None] * 0.55)
# sanftes Licht von oben links
a *= (1.06 - 0.12 * (yy / TH) - 0.04 * (xx / TW))[..., None]
a = np.clip(a, 0, 255)
alpha = np.clip(edge / 2.0, 0, 1) * 255
tex = np.dstack([a, alpha]).astype(np.uint8)

# Perspektive: Zeilen hinten (oben) gestaucht, vorne breiter
t = (np.arange(D) / (D - 1))  # 0 hinten, 1 vorne
k = 1.8
src_y = np.log1p(t * (np.exp(k) - 1)) / k * (TH - 1)  # hinten mehr Fläche pro Zeile
src = np.asarray(tex).astype(float)
rows = np.stack([src[int(y)] * (1 - (y % 1)) + src[min(int(y) + 1, TH - 1)] * (y % 1) for y in src_y])
# hinten etwas dunkler (weiter weg vom Licht)
rows[..., :3] *= (0.9 + 0.1 * t)[:, None, None]
Image.fromarray(np.clip(rows, 0, 255).astype(np.uint8)).save(out, optimize=True)
print("ok", W, D)
