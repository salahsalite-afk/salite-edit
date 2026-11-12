"""Person frame-genau freistellen und als PNG mit Alpha speichern (für Text hinter dem Model).

python scripts/cutout.py <video> <start_frame> <end_frame> <out_dir> <breite> <höhe>
Schreibt cut_0000.png ... (RGBA) für die Frames start_frame bis end_frame (ohne end_frame).
Modell: BiRefNet lite (MIT), models/birefnet_lite.onnx.
"""
import os
import subprocess
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

src, a, b, out, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], int(sys.argv[5]), int(sys.argv[6])
os.makedirs(out, exist_ok=True)
sess = ort.InferenceSession("models/birefnet_lite.onnx", providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0]
S = 1024
mean = np.array([0.485, 0.456, 0.406], np.float32)
std = np.array([0.229, 0.224, 0.225], np.float32)

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-vf", f"trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS,scale={W}:{H}:flags=lanczos", "-fps_mode", "passthrough",
     "-an", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True, check=True,
).stdout
n = len(raw) // (W * H * 3)
for i in range(n):
    fr = np.frombuffer(raw, np.uint8, W * H * 3, i * W * H * 3).reshape(H, W, 3)
    img = Image.fromarray(fr)
    x = np.asarray(img.resize((S, S), Image.BILINEAR), np.float32) / 255.0
    x = ((x - mean) / std).transpose(2, 0, 1)[None]
    y = sess.run(None, {inp.name: x})[-1][0, 0]
    y = 1 / (1 + np.exp(-y))
    m = Image.fromarray((y * 255).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
    m = m.filter(ImageFilter.GaussianBlur(1.2))  # weiche Kante
    rgba = img.convert("RGBA")
    rgba.putalpha(m)
    rgba.save(f"{out}/cut_{i:04d}.png", optimize=False, compress_level=1)
    print(i + 1, "/", n, flush=True)
