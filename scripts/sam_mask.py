"""Objekt-Masken pro Frame mit Segment Anything (Meta, Apache 2.0, ONNX: Xenova/sam-vit-base).

.venv/bin/python scripts/sam_mask.py <video> <out_dir> "<x,y;x,y>" "<x,y;...>" [start end]
Erste Punktliste: auf dem Objekt (z. B. Auto), zweite: daneben (Hintergrund). Koordinaten in Video-Pixeln.
Schreibt <out_dir>/m_0000.png ... (Graustufen 0/255). Modelle in /dev/shm/sam.
Für Objekte, die das Personen-Freistellen (scripts/cutout.py) nicht erfasst, z. B. Autos.
"""
import os
import subprocess
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image

video, out = sys.argv[1], sys.argv[2]
pos = [tuple(map(float, p.split(","))) for p in sys.argv[3].split(";") if p]
neg = [tuple(map(float, p.split(","))) for p in sys.argv[4].split(";") if p]
a = int(sys.argv[5]) if len(sys.argv) > 5 else 0
b = int(sys.argv[6]) if len(sys.argv) > 6 else 100000
os.makedirs(out, exist_ok=True)

w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], capture_output=True, text=True).stdout.strip().split(","))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)

so = ort.SessionOptions()
so.intra_op_num_threads = os.cpu_count()
enc = ort.InferenceSession("/dev/shm/sam/vision_encoder.onnx", so, providers=["CPUExecutionProvider"])
dec = ort.InferenceSession("/dev/shm/sam/prompt_encoder_mask_decoder.onnx", so, providers=["CPUExecutionProvider"])

S = 1024
scale = S / max(w, h)
rw, rh = round(w * scale), round(h * scale)
mean = np.array([0.485, 0.456, 0.406], np.float32)
std = np.array([0.229, 0.224, 0.225], np.float32)
pts = np.array([[p[0] * scale, p[1] * scale] for p in pos + neg], np.float32)[None, None]
labels = np.array([[1] * len(pos) + [0] * len(neg)], np.int64)[None]

for i in range(a, min(b, len(frames))):
    img = Image.fromarray(frames[i]).resize((rw, rh), Image.BILINEAR)
    x = (np.asarray(img, np.float32) / 255 - mean) / std
    pad = np.zeros((S, S, 3), np.float32)
    pad[:rh, :rw] = x
    emb, pe = enc.run(None, {"pixel_values": pad.transpose(2, 0, 1)[None]})
    iou, masks = dec.run(None, {"input_points": pts, "input_labels": labels, "image_embeddings": emb, "image_positional_embeddings": pe})
    k = int(np.argmax(iou[0, 0]))
    m = Image.fromarray(masks[0, 0, k].astype(np.float32)).resize((S, S), Image.BILINEAR)
    m = np.asarray(m)[:rh, :rw]
    m = np.asarray(Image.fromarray(m).resize((w, h), Image.BILINEAR)) > 0
    Image.fromarray((m * 255).astype(np.uint8)).save(f"{out}/m_{i:04d}.png")
    print(i, round(float(iou[0, 0, k]), 3), round(float(m.mean()), 3), flush=True)
