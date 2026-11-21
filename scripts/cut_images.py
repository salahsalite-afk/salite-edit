"""Bilder für den Beat-Schnitt vorbereiten (keine Hochskalierung, keine Farbänderung).

python scripts/cut_images.py <src_dir> <out_dir>
- 9:16-Fotos (Stack, Stack aus dem Chat, Winterjacke): auf 1080x1920 verkleinert, Vollbild
- andere Formate (Glitzersteine, Longsleeves): Originalgröße als JPG, im Video als Karte auf Espresso
- Longsleeve-Nahaufnahme (ls_c): rechten Rand abschneiden (fremder heller Streifen im Bild)
"""
import os
import sys

from PIL import Image

src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)


def rgb(p):
    im = Image.open(p)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    r = im.resize((max(w, round(im.width * s)), max(h, round(im.height * s))), Image.LANCZOS)
    x = (r.width - w) // 2
    y = (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))


for name in ("stack", "stack_chat", "winterjacke"):
    im = rgb(f"{src}/{name}.jpg")
    cover(im, 1080, 1920).save(f"{out}/{name}.jpg", quality=95)

for name in ("glitzer", "ls_a", "ls_b", "ls_c", "ls_d"):
    im = rgb(f"{src}/{name}.png")
    if name == "ls_c":
        im = im.crop((100, 0, 950, im.height))
    im.save(f"{out}/{name}.jpg", quality=95)
    print(name, im.size)
print("ok")
