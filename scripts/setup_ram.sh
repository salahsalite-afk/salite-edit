#!/usr/bin/env bash
# Baut die Arbeitsumgebung im RAM (/dev/shm) neu auf, z. B. nach einem Neustart der Sitzung.
# KI-Stimme (Chatterbox ONNX, Thorsten-Referenzen), Video-Zwischenstände für SALITE News, Musik.
set -e
cd "$(dirname "$0")/.."
export TMPDIR=/dev/shm/rtmp PIP_CACHE_DIR=/dev/shm/tts/pipcache HF_HOME=/dev/shm/tts/hf HF_HUB_DISABLE_PROGRESS_BARS=1
mkdir -p /dev/shm/rtmp /dev/shm/tts /dev/shm/bf raw/bf/vo/refs

# 1) Python-Umgebung für die Stimme (SKIP_TTS=1 überspringt Stimme und Modell)
if [ -z "$SKIP_TTS" ] && [ ! -x /dev/shm/tts/venv/bin/python ]; then
  python3.11 -m venv /dev/shm/tts/venv
  /dev/shm/tts/venv/bin/pip install -q --upgrade pip
  /dev/shm/tts/venv/bin/pip install -q onnxruntime==1.22.1 huggingface_hub==0.34.4 transformers==4.46.3 numpy==2.2.6 tqdm librosa==0.11.0 soundfile==0.13.1 pyarrow
fi

# 2) Modell und Referenzstimmen (Referenzen bleiben auf der Platte in raw/bf/vo/refs)
[ -n "$SKIP_TTS" ] || /dev/shm/tts/venv/bin/python - <<'EOF'
import io, os
import numpy as np, soundfile as sf, librosa, pyarrow.parquet as pq
from huggingface_hub import hf_hub_download
m = "onnx-community/chatterbox-multilingual-ONNX"
for fn in ["speech_encoder", "embed_tokens", "conditional_decoder", "language_model"]:
    for ext in [".onnx", ".onnx_data"]:
        hf_hub_download(repo_id=m, filename=fn + ext, subfolder="onnx", local_dir="/dev/shm/tts/models")
for fn in ["tokenizer.json", "tokenizer_config.json", "generation_config.json"]:
    hf_hub_download(repo_id=m, filename=fn, local_dir="/dev/shm/tts/models")
R = "raw/bf/vo/refs"
def build(shard, pick, name):
    if os.path.exists(f"{R}/{name}.wav"):
        return
    p = hf_hub_download(repo_id="Thorsten-Voice/TV-44kHz-Full", repo_type="dataset", filename=shard, local_dir="/dev/shm/tts/thorsten")
    rows = pq.read_table(p).to_pylist()
    parts = []
    for r in pick(rows):
        d, sr = sf.read(io.BytesIO(r["audio"]["bytes"]))
        d = d.mean(1) if d.ndim > 1 else d
        d = librosa.resample(d.astype(np.float32), orig_sr=sr, target_sr=24000)
        d, _ = librosa.effects.trim(d, top_db=35)
        parts += [d, np.zeros(int(0.3 * 24000), np.float32)]
    sf.write(f"{R}/{name}.wav", np.concatenate(parts), 24000)
    os.remove(p)
build("TV-2022.10-Neutral/train-00000-of-00008.parquet", lambda rows: [rows[5], rows[27]], "ref_thorsten")
emo = "TV-2021.06-Emotional/train-00000-of-00002.parquet"
build(emo, lambda rows: [r for r in rows if r["style"] == "amused | amüsiert" and 3.5 <= float(r["durationSeconds"]) <= 6][:2], "ref_amused")
build(emo, lambda rows: [r for r in rows if r["style"] == "surprised | überrascht" and 3.5 <= float(r["durationSeconds"]) <= 6][:2], "ref_surprised")
print("modell und referenzen ok")
EOF

# 3) Video-Zwischenstände
[ -f /dev/shm/bf/runway.mp4 ] || ffmpeg -v error -y -threads 4 -i public/ig/source.mov -vf "crop=1215:2160:1312:0,scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 15 -pix_fmt yuv420p -an /dev/shm/bf/runway.mp4
if [ ! -f /dev/shm/bf/barber.mp4 ]; then
  curl -sSL --max-time 600 -o /dev/shm/rtmp/barber.mov "https://drive.usercontent.google.com/download?id=1ej4UO7hye1RdOhnaLxnCz2K9M0PX9Usi&export=download&confirm=t"
  ffmpeg -v error -y -threads 4 -i /dev/shm/rtmp/barber.mov -vf "scale=1080:1920:flags=lanczos" -c:v libx264 -preset medium -crf 15 -pix_fmt yuv420p -an /dev/shm/bf/barber.mp4
  rm -f /dev/shm/rtmp/barber.mov
fi
[ -f /dev/shm/bf/news_beat.wav ] || .venv/bin/python scripts/news_beat.py /dev/shm/bf/news_beat.wav 90
ln -sfn /dev/shm/bf public_news_v/shm
ln -sfn /dev/shm/bf public_news/shm
echo "RAM-Umgebung bereit"
