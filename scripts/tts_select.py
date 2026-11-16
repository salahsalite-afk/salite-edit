"""Beste KI-Sprachaufnahme pro Satz auswählen (Whisper prüft gegen das Skript) und sauber schneiden.

.venv/bin/python scripts/tts_select.py <zeilen.json> <kandidaten_dir> <out_dir>
Für jeden Satz: alle Kandidaten <id>_c<n>.wav transkribieren, Ähnlichkeit zum Text "show" messen,
unnatürlich langsame oder abgebrochene Takes abwerten, den besten nehmen und nach dem letzten Wort schneiden.
Schreibt <out_dir>/<id>.wav und <out_dir>/auswahl.json (Text, Wertung, Wörter mit Zeiten).
"""
import difflib
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

lines_p, cand_dir, out_dir = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)
model = WhisperModel("small", device="cpu", compute_type="int8", download_root="/dev/shm/tts/whisper")


def norm(t):
    t = t.lower().replace("ß", "ss")
    t = re.sub(r"[^a-z0-9äöü ]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


report = {}
for ln in json.load(open(lines_p)):
    best = None
    for fn in sorted(os.listdir(cand_dir)):
        if not fn.startswith(ln["id"] + "_c"):
            continue
        wav, sr = sf.read(f"{cand_dir}/{fn}")
        segs, _ = model.transcribe(f"{cand_dir}/{fn}", language="de", word_timestamps=True, beam_size=5)
        words = [w for s in segs for w in s.words]
        text = " ".join(w.word.strip() for w in words)
        sim = difflib.SequenceMatcher(None, norm(text), norm(ln["show"])).ratio()
        dur = len(wav) / sr
        rate = len(ln["show"]) / max(dur, 0.1)  # Zeichen pro Sekunde, Nachrichtentempo etwa 11 bis 16
        pen = 0.0 if 9 <= rate <= 18 else 0.15
        score = sim - pen
        print(ln["id"], fn, round(sim, 3), round(dur, 2), "s", round(rate, 1), "|", text, flush=True)
        if best is None or score > best[0]:
            best = (score, fn, wav, sr, words, text, sim)
    score, fn, wav, sr, words, text, sim = best
    a = max(0.0, words[0].start - 0.06) if words else 0.0
    b = min(len(wav) / sr, words[-1].end + 0.14) if words else len(wav) / sr
    cut = wav[int(a * sr) : int(b * sr)]
    # weiche Kanten
    f = int(0.01 * sr)
    cut[:f] *= np.linspace(0, 1, f)
    cut[-f:] *= np.linspace(1, 0, f)
    sf.write(f"{out_dir}/{ln['id']}.wav", cut, sr)
    report[ln["id"]] = {
        "take": fn,
        "aehnlichkeit": round(sim, 3),
        "text": text,
        "dauer": round(len(cut) / sr, 3),
        "woerter": [{"w": w.word.strip(), "s": round(w.start - a, 3), "e": round(w.end - a, 3)} for w in words],
    }
json.dump(report, open(f"{out_dir}/auswahl.json", "w"), ensure_ascii=False, indent=1)
print("fertig")
