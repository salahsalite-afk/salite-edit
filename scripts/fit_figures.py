"""Figuren für die Fit-Story: freigestellte Person plus ihr ECHTER Bodenschatten aus dem Originalfoto.

python scripts/fit_figures.py <out_dir> <name>:<foto>:<maske> [...]
<maske> ist die BiRefNet-Ausgabe (scripts/cutout.py) in derselben Auflösung wie <foto>.
Schreibt <out_dir>/<name>.png und <out_dir>/figs.json mit der Lage des Körpers im PNG
(top, bottom = Fußsohle, cx), damit die Figur in Remotion auf ihren Füßen steht.
Der Schatten ist die Abdunklung des Bodens gegenüber dem leeren Studiohintergrund, nichts wird erfunden.
"""
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

out_dir = sys.argv[1]
meta = {}
for spec in sys.argv[2:]:
    name, photo, maskp = spec.split(":")
    rgb = np.asarray(Image.open(photo).convert("RGB")).astype(float)
    al = np.asarray(Image.open(maskp).convert("RGBA"))[..., 3].astype(float) / 255
    H, W = al.shape
    m = al > 0.4
    lab, n = ndimage.label(m)
    body = ndimage.binary_fill_holes(lab == (np.argmax(ndimage.sum(m, lab, range(1, n + 1))) + 1))
    al = al * ndimage.binary_dilation(body, iterations=3)
    ys, xs = np.where(body)
    top, bot = ys.min(), ys.max()
    hgt = bot - top
    # leerer Studiohintergrund: Weichzeichnung nur aus Pixeln außerhalb der Person
    L = rgb.mean(-1)
    free = ~ndimage.binary_dilation(body, iterations=int(hgt * 0.05))
    s = hgt * 0.06
    bg = ndimage.gaussian_filter(L * free, s) / (ndimage.gaussian_filter(free.astype(float), s) + 1e-6)
    # Abdunklung = echter Schatten, nur am Boden um die Füße
    dark = np.clip(1 - L / np.maximum(bg, 1), 0, 1)
    dark = ndimage.gaussian_filter(dark, 1.2)
    yy, xx = np.mgrid[0:H, 0:W]
    feet_x = xs[ys > bot - hgt * 0.06].mean()
    region = np.clip(1 - np.abs(yy - bot) / (hgt * 0.09), 0, 1) * np.clip(1 - np.abs(xx - feet_x) / (hgt * 0.32), 0, 1)
    region = np.clip(region * 2.2, 0, 1) * (yy > bot - hgt * 0.12)
    sh = np.where(dark > 0.015, dark, 0) * region * (1 - al)
    # zusammensetzen: Person deckend, Schatten als halbtransparentes Schwarz (wirkt wie Multiplizieren)
    a = np.clip(al + sh, 0, 1)
    col = np.where(al[..., None] > 0, rgb, 30) * 1.0
    col = (rgb * al[..., None] + 30 * sh[..., None]) / np.maximum(a[..., None], 1e-6)
    out = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
    img = Image.fromarray(out)
    bb = img.getbbox()
    img = img.crop(bb)
    img.save(f"{out_dir}/{name}.png", optimize=True)
    meta[name] = {
        "w": img.width,
        "h": img.height,
        "top": (top - bb[1]) / img.height,
        "bottom": (bot - bb[1]) / img.height,
        "cx": (feet_x - bb[0]) / img.width,
    }
    print(name, img.size, round(float(sh.max()), 3))
json.dump(meta, open(f"{out_dir}/figs.json", "w"), indent=1)
