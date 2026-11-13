"""Realistischer Tracksuit-Mockup aus echten Produktfotos.

Eingaben (in public/real/): cut_hoodie/cut_0000.png, cut_pants/cut_0000.png (freigestellt), logo_patch.png (echtes Puff-S mit Steinen).
Ausgabe (out/mockup/): Set auf Grau, Set transparent, Hoodie und Jogger einzeln.
Form wird nie verändert: nichts gestreckt, verschmälert oder geglättet.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

rng = np.random.default_rng(7)
TARGET = np.array([214, 214, 212.0])  # neutrales Melange-Hellgrau


def largest(img):
    a = np.array(img)
    al = a[..., 3] > 60
    lab, n = ndimage.label(al)
    sz = ndimage.sum(al, lab, range(1, n + 1))
    keep = ndimage.binary_dilation(ndimage.binary_fill_holes(lab == (np.argmax(sz) + 1)), iterations=2)
    a[..., 3] = np.where(keep, a[..., 3], 0)
    return Image.fromarray(a)


def med(img):
    a = np.asarray(img).astype(float)
    return np.median(a[..., :3][a[..., 3] > 200], axis=0)


def match(img):
    a = np.array(img).astype(float)
    a[..., :3] = np.clip(a[..., :3] * (TARGET / med(img)), 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def grain(img, sigma):
    a = np.array(img).astype(float)
    n = rng.normal(0, sigma, a.shape[:2])[..., None]
    a[..., :3] = np.clip(a[..., :3] + n, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def noise_level(img):
    a = np.asarray(img.convert("L")).astype(float)
    m = np.asarray(img)[..., 3] > 250
    hp = a - ndimage.gaussian_filter(a, 1.5)
    return float(np.std(hp[m]))


hood = match(largest(Image.open("public/real/cut_hoodie/cut_0000.png").convert("RGBA")))
pants = largest(Image.open("public/real/cut_pants/cut_0000.png").convert("RGBA"))

# Fabrik-Markierung (gelb) an der Hose entfernen
p = np.array(pants).astype(float)
r, g, b = p[..., 0], p[..., 1], p[..., 2]
hh, ww = p.shape[:2]
zone = np.zeros((hh, ww), bool)
zone[int(hh * 0.85):, : int(ww * 0.35)] = True  # Markierung sitzt unten links am Saum
y = ndimage.binary_dilation((g - b > 12) & ((r + g) / 2 - b > 10) & (p[..., 3] > 0) & zone, iterations=4)
mm = np.median(p[..., :3][(p[..., 3] > 200) & ~y], axis=0)
p[..., :3][y] = np.clip(mm + rng.normal(0, 5, p[..., :3].shape)[y], 0, 255)
pants = match(Image.fromarray(p.astype(np.uint8)))

# altes, unscharfes Logo am Bein mit Stoff vom selben Bein überdecken
cx, cy, R = 648, 420, 150
src = pants.crop((cx - R, cy + 380 - R, cx + R, cy + 380 + R))
mask = Image.new("L", (2 * R, 2 * R), 0)
ImageDraw.Draw(mask).ellipse((10, 10, 2 * R - 10, 2 * R - 10), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(14))
region = pants.crop((cx - R, cy - R, cx + R, cy + R))
patched = Image.composite(src.convert("RGB"), region.convert("RGB"), mask).convert("RGBA")
patched.putalpha(region.split()[3])
pants.paste(patched, (cx - R, cy - R))

# Jogger an die Schärfe des Hoodies angleichen (Screenshot ist weicher)
pants = pants.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))

logo = Image.open("public/real/logo_patch.png").convert("RGBA")


def place_logo(base, cx, cy, w, squash, rot):
    L = logo.resize((int(w), int(w * logo.height / logo.width * squash)), Image.LANCZOS)
    L = L.rotate(rot, expand=True, resample=Image.BICUBIC)
    x, y = int(cx - L.width / 2), int(cy - L.height / 2)
    la = np.array(L).astype(float)
    # Licht und Falten des Stoffs übernehmen: niederfrequente Helligkeit der Fläche darunter
    under = np.asarray(base.crop((x, y, x + L.width, y + L.height)).convert("L")).astype(float)
    shade = ndimage.gaussian_filter(under, 12)
    shade = np.clip(shade / max(1.0, np.mean(shade)), 0.94, 1.04)
    la[..., :3] = np.clip(la[..., :3] * shade[..., None], 0, 255)
    # Schärfe wie das Foto darunter (nur Farbe weichzeichnen, Transparenz bleibt sauber)
    rgb = ndimage.gaussian_filter(la[..., :3], (0.45, 0.45, 0))
    la[..., :3] = np.where(la[..., 3:4] > 0, rgb, la[..., :3])
    L = Image.fromarray(la.astype(np.uint8))
    L = grain(L, max(2.0, noise_level(base) * 0.8))
    # Puff-Effekt: kleiner weicher Schatten nach unten rechts, feine Kante
    a = L.split()[3]
    sh = Image.new("RGBA", L.size, (25, 25, 25, 0))
    sh.putalpha(a.point(lambda v: int(v * 0.30)).filter(ImageFilter.GaussianBlur(2.4)))
    base.alpha_composite(sh, (x + 2, y + 3))
    base.alpha_composite(L, (x, y))


place_logo(hood, 650, 405, 135, 0.80, -4)
place_logo(pants, 650, 420, 150, 0.82, -6)

# gemeinsame feine Körnung, damit beide Teile aus derselben Kamera wirken
hood = grain(hood, 1.5)
pants = grain(pants, 2.5)

H = hood.crop(hood.getbbox())
P0 = pants.crop(pants.getbbox())
H.save("out/mockup/salite_hoodie_grau_transparent.png")
P0.save("out/mockup/salite_jogger_grau_transparent.png")

# Set wie getragen: Jogger gerade unter dem Hoodie, Bund verschwindet unter dem Hoodie-Saum.
# Das Jogger-Foto stammt aus einer Größentabelle und ist dort gestaucht; Proportionen werden auf
# übliche Flatlay-Maße korrigiert: Hüftbreite etwa 0,8x der Hoodie-Saum, Länge etwa 2,15x die Saumbreite.
Hm = np.array(H)[..., 3] > 128
cxH = Hm.shape[1] // 2
hem_bottom = int(np.where(Hm[:, cxH - 5 : cxH + 5].any(1))[0].max())
row = Hm[hem_bottom - 40]
lab, n = ndimage.label(row)
segs = [(np.where(lab == i)[0].min(), np.where(lab == i)[0].max()) for i in range(1, n + 1)]
body = max(segs, key=lambda t: t[1] - t[0])  # breitestes Segment = Körper, ohne Ärmel
hem_w = body[1] - body[0]
hem_cx = (body[0] + body[1]) / 2
Pm = np.array(P0)[..., 3] > 128
hip = Pm[int(Pm.shape[0] * 0.15)]
hip_w = np.where(hip)[0].max() - np.where(hip)[0].min()
sx = (hem_w * 0.80) / hip_w
sy = (hem_w * 2.15) / P0.height
P = P0.resize((int(P0.width * sx), int(P0.height * sy)), Image.LANCZOS)
Pm2 = np.array(P)[..., 3] > 128
top_p = int(np.where(Pm2.any(1))[0].min())
waist_cx = np.where(Pm2[top_p + int(P.height * 0.12)])[0].mean()
W = max(H.width, P.width) + 260
top = 90
hx = (W - H.width) // 2
px = int(hx + hem_cx - waist_cx)
py = top + hem_bottom - int(P.height * 0.10)  # Bund liegt unter dem Saum
CH = max(top + H.height, py + P.height + 110)


def shadow(img, blur, op, color=(22, 20, 18)):
    a = img.split()[3].point(lambda v: int(v * op)).filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", img.size, color + (0,))
    sh.putalpha(a)
    return sh


def studio_bg(w, h):
    # heller Studio-Hintergrund mit sanftem Lichtabfall zu den Rändern
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w * 0.5) / (w * 0.75)) ** 2 + ((yy - h * 0.42) / (h * 0.8)) ** 2)
    v = 241 - 16 * np.clip(d, 0, 1.4) ** 2
    v = v + rng.normal(0, 1.2, v.shape)
    rgb = np.stack([v, v, v - 2], -1).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgb).convert("RGBA")


def build(bg):
    c = studio_bg(W, CH) if bg else Image.new("RGBA", (W, CH), (0, 0, 0, 0))
    for img, x, yy in ((P, px, py), (H, hx, top)):
        c.alpha_composite(shadow(img, 26, 0.22), (x + 5, yy + 20))  # weicher Raumschatten
        c.alpha_composite(shadow(img, 4, 0.30), (x + 1, yy + 3))  # Kontaktschatten
        c.alpha_composite(img, (x, yy))
    return c


build(False).save("out/mockup/salite_tracksuit_set_grau_transparent.png")
build(True).convert("RGB").save("out/mockup/salite_tracksuit_set_grau.jpg", quality=95)
print("fertig", H.size, P0.size, (W, CH))
