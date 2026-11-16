"""Baut die Zeitleiste für SALITE News aus den ausgewählten Sprach-Takes.

.venv/bin/python scripts/news_timeline.py <auswahl_dir> <zeilen.json> <voice_out.wav> <timeline.json>
- legt die Sätze mit Pausen hintereinander (im Satzblock kurz, zwischen Abschnitten länger)
- verteilt das Bildmaterial je Abschnitt, Footage wird bei Bedarf verlangsamt (mindestens 0,5x, bei 60 fps noch flüssig)
  oder am Ende gekürzt; reicht es nicht, steht das letzte Bild (Standbild mit Push-in)
- schreibt Wortzeiten (Skript-Wörter mit Whisper-Zeiten) für Untertitel und Effekte
"""
import json
import re
import sys

import numpy as np
import soundfile as sf

sel_dir, lines_p, voice_out, tl_out = sys.argv[1:5]
SR = 48000
LEAD = 0.45  # Gong vor dem ersten Wort
GAP_IN = 0.22
GAP_SEC = 0.42
PINK = "bf/pink.mp4"
BARBER = "shm/barber.mp4"
RUNWAY = "shm/runway.mp4"  # 4K-Runway-Film, mittig auf 9:16 zugeschnitten

# Abschnitte: Sätze und Bildmaterial (Quelle, von, bis) in Reihenfolge
SECTIONS = [
    ("hook", ["l01a", "l02a", "l02b", "l03a"], [(PINK, 0.0, 4.715)]),
    ("box", ["l04a"], [(PINK, 4.715, 8.298)]),
    ("expert", ["l05a", "l05b", "l06a"], [(PINK, 8.298, 14.07)]),
    ("witness", ["l06b"], [(PINK, 14.07, 14.78)]),
    ("quality", ["l07a", "l07b"], [(PINK, 14.78, 19.18), (PINK, 19.18, 23.6)]),
    ("stitch", ["l08a"], [(BARBER, 2.2, 4.16), (BARBER, 11.8, 17.1)]),
    ("restock", ["l09a", "l09b", "l10a", "l10b"], [(RUNWAY, 0.3, 1.8), (RUNWAY, 4.0, 7.0), (RUNWAY, 11.4, 12.9), (RUNWAY, 30.6, 34.3)]),
    ("extras", ["l10c", "l10d"], []),
    ("password", ["l11a", "l12a"], []),
    ("follow", ["l13a", "l14a"], []),
    ("outro", ["l15a", "l15b"], []),
]
TAIL = 2.6  # Stille und Logo nach dem letzten Wort

sel = json.load(open(f"{sel_dir}/auswahl.json"))
show = {l["id"]: l["show"] for l in json.load(open(lines_p))}

voice = []
words = []
sections = {}
clips = []
t = LEAD
for si, (name, ids, footage) in enumerate(SECTIONS):
    if si > 0:
        t += GAP_SEC
    s0 = t
    for k, sid in enumerate(ids):
        if k > 0:
            t += GAP_IN
        info = sel[sid]
        voice.append({"id": sid, "at": round(t, 3), "dur": info["dauer"]})
        # Skript-Wörter mit Whisper-Zeiten verbinden
        sw = [w for w in re.split(r"\s+", show[sid].strip()) if w]
        ww = info["woerter"]
        if len(ww) == len(sw):
            for w, x in zip(sw, ww):
                words.append({"w": w, "s": round(t + x["s"], 3), "e": round(t + x["e"], 3), "id": sid})
        else:
            a, b = (ww[0]["s"], ww[-1]["e"]) if ww else (0, info["dauer"])
            lens = np.array([len(w) + 1 for w in sw], float)
            edges = a + (b - a) * np.concatenate([[0], np.cumsum(lens) / lens.sum()])
            for i, w in enumerate(sw):
                words.append({"w": w, "s": round(t + edges[i], 3), "e": round(t + edges[i + 1], 3), "id": sid})
        t += info["dauer"]
    s1 = t
    # Bild deckt den Abschnitt bis zum Beginn des nächsten (inklusive Pause danach)
    end = s1 + (GAP_SEC if si < len(SECTIONS) - 1 else TAIL)
    sections[name] = {"start": round(s0 if si > 0 else 0.0, 3), "voiceStart": round(s0, 3), "voiceEnd": round(s1, 3), "end": round(end, 3)}
    if footage:
        start = 0.0 if si == 0 else s0
        need = end - start
        have = sum(b - a for _, a, b in footage)
        rate = min(1.0, max(0.5, have / need))
        at = start
        for src, a, b in footage:
            dur = (b - a) / rate
            if at + dur > end:  # zu viel Material: hinten kürzen
                dur = end - at
            if dur <= 0.02:
                break
            clips.append({"src": src, "from": a, "rate": round(rate, 4), "at": round(at, 4), "dur": round(dur, 4)})
            at += dur
        if at < end - 0.02:  # zu wenig: letztes Bild stehen lassen
            last = clips[-1]
            clips.append({"src": last["src"], "from": round(last["from"] + last["dur"] * last["rate"] - 1 / 60, 4), "rate": 0, "at": round(at, 4), "dur": round(end - at, 4), "freeze": True})
    t = s1
total = round(t + TAIL, 3)

# Sprachspur zusammensetzen (48 kHz)
out = np.zeros(int(total * SR) + SR)
from scipy.signal import resample_poly

for v in voice:
    w, sr = sf.read(f"{sel_dir}/{v['id']}.wav")
    if w.ndim > 1:
        w = w.mean(1)
    w = resample_poly(w.astype(np.float32), SR // 1000, sr // 1000)
    i = int(v["at"] * SR)
    out[i : i + len(w)] += w[: len(out) - i]
out = out[: int(total * SR)]
sf.write(voice_out, out.astype(np.float32), SR)

json.dump({"total": total, "sections": sections, "clips": clips, "voice": voice, "words": words}, open(tl_out, "w"), ensure_ascii=False, indent=1)
print("Gesamt", total, "s")
for k, v in sections.items():
    print(f"{k:9s} {v['start']:6.2f} bis {v['end']:6.2f}  Sprache {v['voiceStart']:6.2f} bis {v['voiceEnd']:6.2f}")
for c in clips:
    print(c)
