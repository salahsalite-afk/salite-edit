"""Wort-genaue Transkription von public/video.mp4 -> transcript.json"""
import json, sys
from faster_whisper import WhisperModel

src = sys.argv[1] if len(sys.argv) > 1 else "public/video.mp4"
model = WhisperModel("large-v3", device="cpu", compute_type="int8")
segments, info = model.transcribe(src, word_timestamps=True, vad_filter=True, beam_size=5)
words, segs = [], []
for s in segments:
    segs.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
    for w in s.words:
        words.append({"word": w.word.strip(), "start": round(w.start, 3),
                      "end": round(w.end, 3), "probability": round(w.probability, 3)})
json.dump({"language": info.language, "duration": info.duration, "segments": segs, "words": words},
          open("transcript.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"{len(words)} Wörter, Sprache: {info.language}")
