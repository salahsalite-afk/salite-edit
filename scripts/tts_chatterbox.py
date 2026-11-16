"""Eigene KI-Stimme: Chatterbox Multilingual (Resemble AI, MIT-Lizenz) als ONNX, läuft ohne GPU und ohne PyTorch.

Aufruf (Modelle und venv liegen wegen des knappen Speichers in /dev/shm):
  /dev/shm/tts/venv/bin/python scripts/tts_chatterbox.py <zeilen.json> <out_dir> [--ref ref.wav] [--lang de] [--exag 0.5]
zeilen.json: Liste von {"id": "...", "say": "Text so wie gesprochen (Zahlen ausgeschrieben)"}.
Schreibt <out_dir>/<id>.wav (24 kHz) je Zeile. Referenzstimme: Thorsten-Voice (Thorsten Müller, CC0),
echte deutsche Männerstimme, siehe ref_thorsten.wav. Keine fremden echten Personen klonen.
"""
import argparse
import json
import os

import librosa
import numpy as np
import onnxruntime
import soundfile as sf
from transformers import AutoTokenizer

ap = argparse.ArgumentParser()
ap.add_argument("lines")
ap.add_argument("out")
ap.add_argument("--models", default="/dev/shm/tts/models")
ap.add_argument("--ref", default="/dev/shm/tts/ref_thorsten.wav")
ap.add_argument("--lang", default="de")
ap.add_argument("--exag", type=float, default=0.5)
ap.add_argument("--only", default="")
ap.add_argument("--cands", type=int, default=3, help="Kandidaten pro Satz (Auswahl danach mit Whisper)")
ap.add_argument("--temp", type=float, default=0.8)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

SR = 24000
START, STOP = 6561, 6562
M = a.models
so = onnxruntime.SessionOptions()
so.intra_op_num_threads = os.cpu_count()
enc = onnxruntime.InferenceSession(f"{M}/onnx/speech_encoder.onnx", so)
emb = onnxruntime.InferenceSession(f"{M}/onnx/embed_tokens.onnx", so)
lm = onnxruntime.InferenceSession(f"{M}/onnx/language_model.onnx", so)
dec = onnxruntime.InferenceSession(f"{M}/onnx/conditional_decoder.onnx", so)
tok = AutoTokenizer.from_pretrained(M)

ref, _ = librosa.load(a.ref, sr=SR)
ref = ref[np.newaxis, :].astype(np.float32)
cond_emb, prompt_token, ref_x, prompt_feat = enc.run(None, {"audio_values": ref})

L, H, D = 30, 16, 64


def synth(text, seed=0):
    rng = np.random.default_rng(seed)
    max_new = int(len(text) * 2.6) + 30  # etwa 25 Tokens pro Sekunde, großzügig
    ids = tok(f"[{a.lang}]{text}", return_tensors="np")["input_ids"].astype(np.int64)
    pos = np.where(ids >= START, 0, np.arange(ids.shape[1])[None, :] - 1)
    feed = {"input_ids": ids, "position_ids": pos.astype(np.int64), "exaggeration": np.array([a.exag], np.float32)}
    gen = np.array([[START]])
    past = {f"past_key_values.{l}.{kv}": np.zeros([1, H, 0, D], np.float32) for l in range(L) for kv in ("key", "value")}
    for i in range(max_new):
        x = emb.run(None, feed)[0]
        if i == 0:
            x = np.concatenate((cond_emb, x), axis=1)
            mask = np.ones((1, x.shape[1]), np.int64)
        logits, *pres = lm.run(None, dict(inputs_embeds=x, attention_mask=mask, **past))
        lg = logits[:, -1, :]
        # Wiederholungsstrafe wie im Original (1.2)
        sc = np.take_along_axis(lg, gen, axis=1)
        sc = np.where(sc < 0, sc * 1.2, sc / 1.2)
        lg = lg.copy()
        np.put_along_axis(lg, gen, sc, axis=1)
        if seed == 0:
            nxt = np.argmax(lg, axis=-1, keepdims=True).astype(np.int64)
        else:
            # wie das Original: Temperatur, min_p 0.05, top_p 0.95
            z = lg[0] / a.temp
            pr = np.exp(z - z.max())
            pr /= pr.sum()
            pr[pr < 0.05 * pr.max()] = 0
            order = np.argsort(-pr)
            cum = np.cumsum(pr[order])
            pr[order[cum > 0.95 * cum[-1] + 1e-9][1:]] = 0
            pr /= pr.sum()
            nxt = np.array([[rng.choice(len(pr), p=pr)]], np.int64)
        gen = np.concatenate((gen, nxt), axis=-1)
        if nxt.item() == STOP:
            break
        feed["input_ids"] = nxt
        feed["position_ids"] = np.full((1, 1), i + 1, np.int64)
        mask = np.concatenate([mask, np.ones((1, 1), np.int64)], axis=1)
        for j, k in enumerate(past):
            past[k] = pres[j]
    speech = np.concatenate([prompt_token, gen[:, 1:-1]], axis=1)
    wav = dec.run(None, {"speech_tokens": speech, "speaker_embeddings": ref_x, "speaker_features": prompt_feat})[0]
    return np.squeeze(wav, 0)


lines = json.load(open(a.lines))
for ln in lines:
    if a.only and ln["id"] not in a.only.split(","):
        continue
    for c in range(a.cands):
        w = synth(ln["say"], seed=c)
        w, _ = librosa.effects.trim(w, top_db=40)
        sf.write(f"{a.out}/{ln['id']}_c{c}.wav", w, SR)
        print(ln["id"], c, round(len(w) / SR, 2), "s", flush=True)
