---
name: ki-stimme
description: Eigene deutsche KI-Sprecherstimme für SALITE Videos erzeugen (Nachrichtensprecher, Voice-over), kostenlos und kommerziell nutzbar, und das Video Wort für Wort darauf schneiden. Einsetzen, wenn der Kunde einen Sprecher will, aber nicht selbst aufnimmt.
---

# KI-Stimme

Modell: Chatterbox Multilingual von Resemble AI, MIT-Lizenz, als ONNX (`onnx-community/chatterbox-multilingual-ONNX`). Läuft auf der CPU ohne PyTorch.
Stimme: Referenz aus Thorsten-Voice (Thorsten Müller, CC0, echte deutsche Männerstimme). Nie echte fremde Personen klonen.

## Einrichten (alles im RAM, weil die Platte knapp ist)

```bash
mkdir -p /dev/shm/rtmp /dev/shm/tts && cd /dev/shm/tts && python3.11 -m venv venv
```
```bash
TMPDIR=/dev/shm/rtmp PIP_CACHE_DIR=/dev/shm/tts/pipcache ./venv/bin/pip install onnxruntime==1.22.1 huggingface_hub==0.34.4 transformers==4.46.3 numpy==2.2.6 librosa==0.11.0 soundfile==0.13.1 pyarrow
```
Modelle nach `/dev/shm/tts/models` laden (die vier ONNX-Dateien mit `_data`, Tokenizer), Referenz `ref_thorsten.wav` aus `Thorsten-Voice/TV-44kHz-Full` (Teil `TV-2022.10-Neutral`) bauen: zwei Sätze, zusammen rund 10 s, auf 24 kHz.

## Ablauf

1. **Skript in Sätze teilen**: `raw/<projekt>/vo/zeilen.json` mit `id`, `say` (so gesprochen: Zahlen ausgeschrieben, "G S M", "D M") und `show` (so geschrieben, für Untertitel und Prüfung).
2. **Erzeugen**, drei Kandidaten pro Satz. Kandidat 0 ist ohne Zufall und bricht manchmal ab, 1 und 2 klingen natürlicher.
   ```bash
   TMPDIR=/dev/shm/rtmp /dev/shm/tts/venv/bin/python scripts/tts_chatterbox.py raw/<projekt>/vo/zeilen.json /dev/shm/tts/out --cands 3
   ```
3. **Auswählen und schneiden**: Whisper prüft jeden Kandidaten gegen `show` und nimmt den besten.
   ```bash
   .venv/bin/python scripts/tts_select.py raw/<projekt>/vo/zeilen.json /dev/shm/tts/out /dev/shm/tts/sel
   ```
   In `auswahl.json` die Ähnlichkeit prüfen. Unter 0,85 den Satz neu erzeugen (`--only id`) oder umformulieren.
4. **Zeitleiste** (Sätze, Pausen, Bildmaterial mit Zeitlupe, Wortzeiten): `scripts/news_timeline.py`. Grafiken und Sounds lesen ihre Zeiten aus den Wörtern.

## Regeln

- Lange Sätze aufteilen, höchstens etwa 100 Zeichen pro Satz, sonst findet das Modell das Ende nicht.
- Markenname "Salite" und Slang ("coppen", "gecookt") nach dem Erzeugen per Whisper und beim Kunden gegenprüfen.
- Stimme auf etwa minus 14 LUFS, Effekte 18 bis 22 dB darunter, nach dem Mischen messen.
