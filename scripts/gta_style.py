"""Foto -> Illustration im Stil eines Spiel-Ladebildschirms (gemalt, Konturen, warme Farben). Ohne KI-Generator.

PYTHONPATH=/dev/shm/pylib python scripts/gta_style.py <in.jpg> <out_dir> [name] [maske.png]
Schreibt <name>_scharf.jpg (nur nachgeschärft, Kunde: "schärfer machen") und <name>_gta.jpg (Illustration).
OpenCV liegt wegen der vollen Festplatte in /dev/shm/pylib (pip install --target).
"""
import os
import sys

import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
name = sys.argv[3] if len(sys.argv) > 3 else os.path.splitext(os.path.basename(src))[0]
os.makedirs(out, exist_ok=True)
img = cv2.imread(src, cv2.IMREAD_COLOR)


def sharpen(bgr):
    """Unscharf maskieren plus leichter lokaler Kontrast (CLAHE) auf der Helligkeit."""
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8)).apply(l)
    bgr = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    blur = cv2.GaussianBlur(bgr, (0, 0), 1.4)
    return cv2.addWeighted(bgr, 1.7, blur, -0.7, 0)


def xdog(gray, s=1.1, k=1.6, p=22.0, eps=0.0, phi=12.0):
    g = gray.astype(np.float32) / 255.0
    g1 = cv2.GaussianBlur(g, (0, 0), s)
    g2 = cv2.GaussianBlur(g, (0, 0), s * k)
    d = (1 + p) * g1 - p * g2
    e = np.where(d >= eps, 1.0, 1.0 + np.tanh(phi * (d - eps)))
    return np.clip(e, 0, 1)


def quantize(bgr, k=20):
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    sample = lab[np.random.default_rng(3).choice(len(lab), 60000, replace=False)]
    _, _, centers = cv2.kmeans(sample, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.5), 3, cv2.KMEANS_PP_CENTERS)
    d = ((lab[:, None, :] - centers[None, :, :]) ** 2).sum(-1) if len(lab) < 2_000_000 else None
    if d is None:
        idx = np.concatenate([((lab[i : i + 500000, None, :] - centers[None]) ** 2).sum(-1).argmin(1) for i in range(0, len(lab), 500000)])
    else:
        idx = d.argmin(1)
    q = centers[idx].reshape(bgr.shape).astype(np.uint8)
    return cv2.cvtColor(q, cv2.COLOR_LAB2BGR)


def grade(bgr):
    """warm, satt, etwas mehr Kontrast (Sonnenuntergang-Look der Ladebildschirme)"""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.28, 0, 255)
    out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255.0
    lum = out.mean(2, keepdims=True)
    warm = np.array([0.0, 0.035, 0.07])[None, None, :]  # BGR: mehr Rot und Gelb in den Lichtern
    cool = np.array([0.04, 0.015, -0.02])[None, None, :]  # leicht kühle Schatten
    out = out + warm * lum + cool * (1 - lum)
    out = 0.5 + (out - 0.5) * 1.12
    return np.clip(out, 0, 1)


sharp = sharpen(img)
cv2.imwrite(f"{out}/{name}_scharf.jpg", sharp, [cv2.IMWRITE_JPEG_QUALITY, 95])

# Maske der Person (optional, aus scripts/cutout.py): dicke Kontur und etwas mehr Leuchtkraft wie auf den Artworks
mask = None
mp = sys.argv[4] if len(sys.argv) > 4 else None
if mp and os.path.exists(mp):
    m = cv2.imread(mp, cv2.IMREAD_UNCHANGED)
    mask = (m[..., 3] if m.ndim == 3 and m.shape[2] == 4 else m).astype(np.float32) / 255.0
    mask = cv2.resize(mask, (img.shape[1], img.shape[0]))

paint = cv2.stylization(sharp, sigma_s=70, sigma_r=0.32)
paint = cv2.addWeighted(quantize(paint, 28), 0.45, paint, 0.55, 0)
col = grade(paint)
# Farbverlauf wie Abendlicht: Schatten violett, Mitten orange, Lichter creme (35 %)
lum = cv2.cvtColor((col * 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None] / 255.0
stops = np.array([[0.24, 0.11, 0.17], [0.20, 0.42, 0.85], [0.80, 0.90, 0.98]])  # BGR: violett, orange, creme
mapc = np.where(lum < 0.5, stops[0] + (stops[1] - stops[0]) * (lum / 0.5), stops[1] + (stops[2] - stops[1]) * ((lum - 0.5) / 0.5))
col = col * 0.68 + mapc * 0.32
if mask is not None:
    sub = mask[..., None]
    col = col * (1 - sub) + np.clip(col * 1.08 + 0.02, 0, 1) * sub
gray = cv2.cvtColor(sharp, cv2.COLOR_BGR2GRAY)
lines = xdog(gray, s=1.3, p=20.0, phi=9.0)
ink = lines
if mask is not None:
    hard = (mask > 0.5).astype(np.uint8)
    ring = cv2.dilate(hard, np.ones((9, 9), np.uint8)) - cv2.erode(hard, np.ones((3, 3), np.uint8))
    ring = cv2.GaussianBlur(ring.astype(np.float32), (0, 0), 1.2)
    ink = np.clip(ink * (1 - 0.9 * ring), 0, 1)
col = col * (0.2 + 0.8 * ink[..., None])
grain = np.random.default_rng(5).normal(0, 0.01, col.shape[:2])[..., None]
col = np.clip(col + grain, 0, 1)
cv2.imwrite(f"{out}/{name}_gta.jpg", (col * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
print("ok", name)
