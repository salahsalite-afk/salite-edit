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
REMOVE_TAG_Y, REMOVE_TAG_X = 62, 957  # Etikett-Rest über dem Bund (Quelle: Zeilen 0 bis 61)


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


def clean_digital(img, keep_mid=0.28, keep_detail=0.55, seam_gain=1.1):
    """Glatt wie ein neues digitales Produkt: Falten und ungleiches Licht entfernen,
    Nähte, Taschenkanten und Rippen behalten, gleichmäßige Melange-Struktur, saubere Kontur."""
    a = np.array(img).astype(float)
    alpha = a[..., 3] / 255.0
    m = alpha > 0.5
    lum = a[..., :3].mean(-1)
    # gewichtete Weichzeichnung nur innerhalb des Stoffs (Rand bleibt hell)
    def wblur(x, s):
        num = ndimage.gaussian_filter(x * m, s)
        den = ndimage.gaussian_filter(m.astype(float), s) + 1e-6
        return num / den
    low = wblur(lum, 28)
    mid = wblur(lum, 3.0) - low
    detail = lum - wblur(lum, 3.0)
    base = TARGET.mean()
    # sanftes Studiolicht von oben links statt Faltenschatten
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    light = 4.0 * (1 - yy / h) + 2.0 * (1 - xx / w) - 3.0
    new_l = base + light + keep_mid * mid + keep_detail * detail
    # Nähte und Taschenkanten zurückholen: schmale dunkle Linien (Falten sind breiter und bleiben weg)
    dog = ndimage.gaussian_filter(wblur(lum, 1.6) - wblur(lum, 7.0), 1.0)
    seam = np.minimum(dog, 0)
    strong = seam < -3.5
    lab, n = ndimage.label(strong)
    if n:
        sz = ndimage.sum(strong, lab, range(1, n + 1))
        keep = np.isin(lab, np.where(sz >= 120)[0] + 1)  # nur lange Linien (Nähte), keine Punkte
    else:
        keep = strong
    seam = ndimage.gaussian_filter(np.where(keep, seam + 3.5, 0), 0.8) * 1.6
    new_l = new_l + seam_gain * seam
    # gleichmäßige Melange-Struktur
    mel = ndimage.gaussian_filter(rng.normal(0, 1, (h, w)), (0.6, 2.2)) * 9.0
    new_l = new_l + mel
    tint = TARGET / TARGET.mean()
    a[..., :3] = np.clip(new_l[..., None] * tint, 0, 255)
    # saubere, glatte Kontur
    sm = ndimage.gaussian_filter(alpha, 2.2)
    a[..., 3] = np.clip((sm - 0.5) * 6 + 0.5, 0, 1) * 255
    return Image.fromarray(a.astype(np.uint8))


hood = match(largest(Image.open("public/real/cut_hoodie/cut_0000.png").convert("RGBA")))
pants = Image.open("public/real/cut_pants/cut_0000.png").convert("RGBA")
_p = np.array(pants)
_p[:REMOVE_TAG_Y, :REMOVE_TAG_X, 3] = 0  # Rest eines Etiketts über dem Bund
pants = largest(Image.fromarray(_p))

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

# Glatt wie ein neues digitales Produkt
hood = clean_digital(hood, keep_detail=0.35)
hood = hood.resize((int(hood.width * 1.06), hood.height), Image.LANCZOS)  # kastiger, oversized
pants = clean_digital(pants, keep_mid=0.30, keep_detail=0.35)

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


place_logo(hood, int(650 * 1.06), 400, 92, 0.80 * 1.06, -4)
place_logo(pants, 640, 400, 105, 0.82, -6)

# gemeinsame feine Körnung, damit beide Teile aus derselben Kamera wirken
hood = grain(hood, 1.0)
pants = grain(pants, 1.0)

H = hood.crop(hood.getbbox())


def hang_sleeves(img, deg=11):
    """Ärmel wie im Shop-Flatlay nah am Körper: Ärmel um die Schulter nach innen drehen."""
    a = np.array(img)
    h, w = a.shape[:2]
    al = a[..., 3] > 0
    yy, xx = np.mgrid[0:h, 0:w]
    out = a.copy()
    layers = []
    for side in (-1, 1):
        if side < 0:
            (x0, y0), (x1, y1) = (int(w * 0.36), int(h * 0.29)), (int(w * 0.2066), int(h * 0.79))
            sleeve = al & ((xx - x0) * (y1 - y0) - (yy - y0) * (x1 - x0) < 0) & (yy > y0 - 40)  # links der Linie
            sleeve |= al & (xx < x1) & (yy >= y1)
            piv = (x0 - 10, y0 - 25)
        else:
            (x0, y0), (x1, y1) = (int(w * 0.615), int(h * 0.29)), (int(w * 0.7274), int(h * 0.814))
            sleeve = al & ((xx - x0) * (y1 - y0) - (yy - y0) * (x1 - x0) > 0) & (yy > y0 - 40)  # rechts der Linie
            sleeve |= al & (xx > x1) & (yy >= y1)
            piv = (x0 + 10, y0 - 25)
        sleeve = ndimage.binary_dilation(sleeve, iterations=3) & al
        soft = np.clip(ndimage.gaussian_filter(sleeve.astype(float), 1.0) * 1.6, 0, 1)
        s_img = a.copy()
        s_img[..., 3] = (a[..., 3] * soft).astype(np.uint8)
        out[..., 3] = (out[..., 3] * (1 - soft)).astype(np.uint8)
        rot = Image.fromarray(s_img).rotate(-side * deg, center=piv, resample=Image.BICUBIC)
        layers.append(rot)
    base = Image.fromarray(out)
    for L in layers:
        # feiner Schatten, wo der Ärmel auf dem Körper liegt
        sh = L.split()[3].point(lambda v: int(v * 0.18)).filter(ImageFilter.GaussianBlur(3))
        shadow_l = Image.new("RGBA", L.size, (30, 28, 26, 0)); shadow_l.putalpha(sh)
        base.alpha_composite(shadow_l, (0, 2))
        base.alpha_composite(L)
    return base.crop(base.getbbox())


_Hm = np.array(H)[..., 3] > 128
_hb = int(np.where(_Hm[:, _Hm.shape[1] // 2].nonzero()[0].max() - 30 >= 0, 0, 0))
_row = _Hm[int(np.where(_Hm[:, _Hm.shape[1] // 2])[0].max()) - 30]
_lab, _n = ndimage.label(_row)
_segs = [(np.where(_lab == i)[0].min(), np.where(_lab == i)[0].max()) for i in range(1, _n + 1)]
_body = min(_segs, key=lambda t: abs((t[0] + t[1]) / 2 - _Hm.shape[1] / 2))
HEM_W = _body[1] - _body[0]
H = hang_sleeves(H)
P0 = pants.crop(pants.getbbox())
H.save("out/mockup/salite_hoodie_grau_transparent.png")
P0.save("out/mockup/salite_jogger_grau_transparent.png")

# Shop-Flatlay wie Referenz: Hoodie oben, Jogger darunter mit kleinem Abstand, Bund sichtbar.
# Hoodie dominiert (oversized): Bundbreite etwa 0,62x Saumbreite, Hosenlänge etwa 1,25x Hoodiehöhe.
Hm = np.array(H)[..., 3] > 128
cxH = Hm.shape[1] // 2
hem_bottom = int(np.where(Hm[:, cxH - 5 : cxH + 5].any(1))[0].max())
row = Hm[hem_bottom - 30]
lab, n = ndimage.label(row)
segs = [(np.where(lab == i)[0].min(), np.where(lab == i)[0].max()) for i in range(1, n + 1)]
body = min(segs, key=lambda t: abs((t[0] + t[1]) / 2 - cxH))  # Segment in der Mitte = Körper
hem_w = HEM_W  # gemessen vor dem Drehen der Ärmel
hem_cx = Hm.shape[1] / 2
Pm = np.array(P0)[..., 3] > 128
waist = Pm[int(Pm.shape[0] * 0.06)]
waist_w = np.where(waist)[0].max() - np.where(waist)[0].min()
sx = (hem_w * 0.62) / waist_w
sy = (H.height * 1.25) / P0.height
P = P0.resize((int(P0.width * sx), int(P0.height * sy)), Image.LANCZOS)
Pm2 = np.array(P)[..., 3] > 128
waist_cx = np.where(Pm2[int(P.height * 0.05)])[0].mean()
W = max(H.width, P.width) + 300
top = 110
hx = (W - H.width) // 2
px = int(hx + hem_cx - waist_cx)
py = top + H.height + 28  # kleiner Abstand, Bund sichtbar
CH = py + P.height + 110


def shadow(img, blur, op, color=(22, 20, 18)):
    a = img.split()[3].point(lambda v: int(v * op)).filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", img.size, color + (0,))
    sh.putalpha(a)
    return sh


def studio_bg(w, h):
    # heller Studio-Hintergrund mit sanftem Lichtabfall zu den Rändern
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w * 0.5) / (w * 0.75)) ** 2 + ((yy - h * 0.42) / (h * 0.8)) ** 2)
    v = 233 - 5 * np.clip(d, 0, 1.4) ** 2
    v = v + rng.normal(0, 0.6, v.shape)
    rgb = np.stack([v, v, v - 1], -1).clip(0, 255).astype(np.uint8)
    return Image.fromarray(rgb).convert("RGBA")


def build(bg):
    c = studio_bg(W, CH) if bg else Image.new("RGBA", (W, CH), (0, 0, 0, 0))
    for img, x, yy in ((P, px, py), (H, hx, top)):
        c.alpha_composite(shadow(img, 18, 0.10), (x, yy + 8))  # sehr weicher Schatten
        c.alpha_composite(shadow(img, 3, 0.14), (x, yy + 2))  # Kontaktschatten
        c.alpha_composite(img, (x, yy))
    return c


build(False).save("out/mockup/salite_tracksuit_set_grau_transparent.png")
build(True).convert("RGB").save("out/mockup/salite_tracksuit_set_grau.jpg", quality=95)
print("fertig", H.size, P0.size, (W, CH), "saum", hem_w, "bund", waist_w, P.size)
