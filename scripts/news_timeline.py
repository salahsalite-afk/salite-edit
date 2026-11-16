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
LEAD = 0.2  # Gong vor dem ersten Wort
GAP_IN = 0.06
GAP_SEC = 0.12
PINK = "bf/pink.mp4"
BARBER = "shm/barber.mp4"
RUNWAY = "shm/runway.mp4"  # 4K-Runway-Film, mittig auf 9:16 zugeschnitten

# Abschnitte: Sätze und Bildmaterial (Quelle, von, bis), immer in Echtzeit (keine Zeitlupe, Kunde: zu langsam).
# Reicht das Material nicht, kommen weitere Schnitte aus der Liste; nur ganz am Ende eines Abschnitts darf ein kurzes Standbild stehen.
SECTIONS = [
    ("hook", ["l01a", "l02a", "l02b", "l03a"], [(PINK, 0.0, 4.715), (PINK, 4.715, 8.298)]),
    ("box", ["l04a"], [(PINK, 14.78, 19.18), (PINK, 8.298, 10.25)]),
    ("expert", ["l05a", "l05b", "l06a"], [(PINK, 10.25, 14.07), (PINK, 19.18, 23.6), (RUNWAY, 8.0, 11.0)]),
    ("witness", ["l06b"], [(PINK, 14.07, 14.78)]),
    ("quality", ["l07a", "l07b"], [(PINK, 23.6, 28.42), (BARBER, 0.0, 2.2)]),
    ("stitch", ["l08a"], [(BARBER, 2.2, 4.16), (BARBER, 11.8, 17.1)]),
    ("restock", ["l09a", "l09b", "l10a", "l10b"], [(RUNWAY, 0.3, 1.8), (RUNWAY, 4.0, 7.0), (RUNWAY, 11.4, 12.9), (BARBER, 5.14, 8.5), (RUNWAY, 30.6, 34.3)]),
    ("extras", ["l10c", "l10d", "l10e"], [(RUNWAY, 8.0, 11.4), (RUNWAY, 14.0, 19.0), (RUNWAY, 19.0, 24.0)]),
    ("password", ["l11a", "l12a"], []),
    ("follow", ["l13a", "l14a"], []),
    ("outro", ["l15a", "l15b"], []),
]
# Kurzfassung 30 bis 40 s (Kunde): ohne Aufsteh-Szene und "gecookt"
SHORT = [
    ("hook", ["s01"], [(PINK, 0.0, 4.715)]),
    ("box", ["s02a", "s02b"], [(PINK, 3.3, 8.298), (PINK, 8.298, 10.25), (PINK, 14.78, 17.05)]),
    ("quality", ["s03a", "s03b"], [(PINK, 17.05, 18.4), (BARBER, 2.2, 4.16), (BARBER, 11.8, 17.1)]),
    ("restock", ["s04a", "s04b"], [(RUNWAY, 0.3, 1.8), (RUNWAY, 4.0, 6.5), (RUNWAY, 30.6, 34.3)]),
    ("comment", ["s04c"], [(BARBER, 5.14, 11.78), (RUNWAY, 11.4, 12.9)]),
    ("extras", ["s05a", "s05b", "s05c"], [(RUNWAY, 8.0, 11.4), (RUNWAY, 14.0, 19.0)]),
    ("password", ["s06a", "s06b"], []),
    ("follow", ["s07"], []),
    ("outro", ["s08"], []),
]
if "s01" in [l["id"] for l in json.load(open(lines_p))]:
    SECTIONS = SHORT
TAIL = 1.5  # kurze Stille und Logo nach dem letzten Wort

import os
import subprocess

PITCH = 2 ** (float(os.environ.get("PITCH_ST", "0")) / 12)  # echte Stimme (ElevenLabs): unverändert lassen
SPEED = 1.0  # Tempo neutral (Kunde)
proc_dir = f"{sel_dir}/proc"
os.makedirs(proc_dir, exist_ok=True)
sel = json.load(open(f"{sel_dir}/auswahl.json"))
for sid, info in sel.items():
    src = f"{sel_dir}/{sid}.wav"
    if not os.path.exists(src):
        continue
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", f"asetrate=24000*{PITCH},aresample=24000,atempo={SPEED / PITCH}", f"{proc_dir}/{sid}.wav"], check=True)
    info["dauer"] = round(info["dauer"] / SPEED, 3)
    info["woerter"] = [{**w, "s": round(w["s"] / SPEED, 3), "e": round(w["e"] / SPEED, 3)} for w in info["woerter"]]
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
        rate = 1.0  # Echtzeit
        at = start
        for src, a, b in footage:
            dur = (b - a) / rate
            if at + dur > end:  # zu viel Material: hinten kürzen
                dur = end - at
            if dur <= 0.02:
                break
            if dur < 0.5 and clips and clips[-1]["at"] + clips[-1]["dur"] >= at - 1e-6 and clips[-1].get("rate") == 1.0:
                clips[-1]["dur"] = round(clips[-1]["dur"] + dur, 4)  # zu kurzer Rest: vorherigen Schnitt verlängern
                at += dur
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
    w, sr = sf.read(f"{proc_dir}/{v['id']}.wav")
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
