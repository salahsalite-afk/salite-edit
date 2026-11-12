"""Person freistellen: python scripts/segment.py <video> <start_s> <end_s> <out_dir> [fps]
Schreibt pro Frame eine Graustufen-Maske (PNG, 1080x1920) für die Tracksuit-Hervorhebung."""
import sys, os, subprocess, numpy as np, onnxruntime as ort
from PIL import Image
src, a, b, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
fps = int(sys.argv[5]) if len(sys.argv) > 5 else 30
os.makedirs(out, exist_ok=True)
sess = ort.InferenceSession("models/birefnet_lite.onnx", providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0]; S = 1024
W, H = 1080, 1920
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-to", str(b), "-i", src, "-vf", f"fps={fps},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
n = len(raw) // (W * H * 3)
mean = np.array([0.485, 0.456, 0.406], np.float32); std = np.array([0.229, 0.224, 0.225], np.float32)
for i in range(n):
    fr = np.frombuffer(raw, np.uint8, W * H * 3, i * W * H * 3).reshape(H, W, 3)
    x = np.asarray(Image.fromarray(fr).resize((S, S), Image.BILINEAR), np.float32) / 255.0
    x = ((x - mean) / std).transpose(2, 0, 1)[None]
    y = sess.run(None, {inp.name: x})[-1][0, 0]
    y = 1 / (1 + np.exp(-y))
    Image.fromarray((y * 255).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR).save(f"{out}/m_{i:04d}.png")
    print(i + 1, "/", n, flush=True)
