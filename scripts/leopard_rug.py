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
SHAPE = sys.argv[4] if len(sys.argv) > 4 else "runner"  # runner oder oval (kleiner Teppich mit goldener Kante)
rng = np.random.default_rng(11)
TW, TH = (W, int(W * 0.2)) if SHAPE == "runner" else (W, int(W * 0.62))  # Draufsicht
S = 2  # Supersampling

base = np.array([104, 24, 34.0])  # Bordeaux
ring = np.array([38, 8, 12.0])  # dunkle Rosette
core = np.array([140, 52, 56.0]) if SHAPE == "runner" else np.array([124, 38, 46.0])  # hellerer Kern

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
img = img.filter(ImageFilter.GaussianBlur((1.4 if SHAPE == 'runner' else 0.5) * S)).resize((TW, TH), Image.LANCZOS)
a = np.asarray(img).astype(float)
# Flor: feines, leicht gerichtetes Rauschen
fur = ndimage.gaussian_filter(rng.normal(0, 1, (TH, TW)), (0.6, 1.4)) * 7
a += fur[..., None]
# Einfassung
yy, xx = np.mgrid[0:TH, 0:TW]
if SHAPE == "oval":
    # Abstand zum Ovalrand, leicht unregelmäßig wie ein echter, benutzter Teppich
    nx, ny = (xx - TW / 2) / (TW / 2), (yy - TH / 2) / (TH / 2)
    rr = np.sqrt(nx**2 + ny**2)
    wobble = ndimage.gaussian_filter(rng.normal(0, 1, (TH, TW)), 14) * 20
    edge = (1 - rr) * TH / 2 + wobble
    gold = ((edge > 16) & (edge < 20.5)).astype(float)  # feine goldene Linie, sehr dezent
    dark = (edge < 16).astype(float)
    a = a * (1 - dark[..., None] * 0.5)
    gcol = np.array([176, 142, 82.0])
    a = a * (1 - gold[..., None] * 0.75) + gcol * gold[..., None] * 0.75
    # Schattierung: zum Rand hin dunkler (Flor kippt), großflächige Ton-Unterschiede
    ao = np.clip(1 - edge / 70, 0, 1) ** 2
    a *= (1 - 0.14 * ao)[..., None]
    tone = ndimage.gaussian_filter(rng.normal(0, 1, (TH, TW)), 40) * 40
    a *= (1 + 0.05 * tone)[..., None]
    # Gebrauchsspuren: Staub und Fusseln hell, ein paar dunkle Krümel, alles winzig und scharf
    inside = edge > 22
    for _ in range(int(TW * TH / 1200)):
        y0, x0 = rng.integers(0, TH), rng.integers(0, TW)
        if not inside[y0, x0]:
            continue
        if rng.random() < 0.75:
            ln = rng.integers(1, 5)
            ang = rng.uniform(0, np.pi)
            for t in range(ln):
                yy0 = int(y0 + np.sin(ang) * t); xx0 = int(x0 + np.cos(ang) * t)
                if 0 <= yy0 < TH and 0 <= xx0 < TW:
                    a[yy0, xx0] = a[yy0, xx0] * 0.45 + np.array([215, 205, 200.0]) * 0.55
        else:
            a[y0, x0] *= 0.55
    # Fransen-Andeutung: einzelne Fasern stehen über die Kante
    fib = (edge > -2.5) & (edge < 0) & (rng.random((TH, TW)) < 0.35)
    edge = np.where(fib, 0.6, edge)
    a = a + rng.normal(0, 1, (TH, TW))[..., None] * 5  # Flor, fein und scharf
else:
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
k = 1.8 if SHAPE == "runner" else 0.6
src_y = np.log1p(t * (np.exp(k) - 1)) / k * (TH - 1)  # hinten mehr Fläche pro Zeile
src = np.asarray(tex).astype(float)
rows = np.stack([src[int(y)] * (1 - (y % 1)) + src[min(int(y) + 1, TH - 1)] * (y % 1) for y in src_y])
# hinten etwas dunkler (weiter weg vom Licht)
rows[..., :3] *= (0.9 + 0.1 * t)[:, None, None]
if SHAPE == "oval":
    # Dicke des Teppichs: dunkle Kante vorne, darunter ein schmaler weicher Kontaktschatten
    lip = 6
    pad = np.zeros((D + lip + 10, TW, 4))
    al = rows[..., 3] / 255
    for o in range(1, lip + 1):
        pad[o : o + D, :, :3] = np.where(al[..., None] > 0, np.array([48, 10, 14.0]), pad[o : o + D, :, :3])
        pad[o : o + D, :, 3] = np.maximum(pad[o : o + D, :, 3], rows[..., 3])
    sh = ndimage.gaussian_filter(np.pad(al, ((lip + 2, 8), (0, 0)))[: D + lip + 10], 5) * 0.38
    out_a = np.zeros_like(pad)
    out_a[..., 3] = sh * 255
    for c in range(4):
        pass
    comp = out_a.copy()
    m = pad[..., 3:4] / 255
    comp[..., :3] = pad[..., :3]
    comp[..., 3] = np.maximum(pad[..., 3], out_a[..., 3])
    top = rows[..., 3:4] / 255
    comp[:D, :, :3] = rows[..., :3] * top + comp[:D, :, :3] * (1 - top)
    comp[:D, :, 3] = np.maximum(comp[:D, :, 3], rows[..., 3])
    rows = comp
Image.fromarray(np.clip(rows, 0, 255).astype(np.uint8)).save(out, optimize=True)
print("ok", W, D)
