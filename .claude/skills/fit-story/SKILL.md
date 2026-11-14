---
name: fit-story
description: Baut aus mehreren Model-Fotos eines Looks (vorne, Seite, Rücken) eine Instagram Story, in der man den Fit aus allen Perspektiven in einem Bild sieht. Beste Frontansicht groß vorne, die anderen im Halbkreis dahinter, unten dezent Größe, Gewicht und getragene Größe. Einsetzen, wenn der Kunde Lookbook- oder Shooting-Fotos schickt und zeigen will, wie etwas sitzt.
---

# Fit-Story

Ergebnis: `out/salite_fit_story.png` (Standbild) und `out/salite_fit_story.mp4` (5 s, Figuren treten von hinten nach vorne auf), 1080x1920.

## Ablauf

1. **Fotos sortieren.** Die beste Frontansicht kommt nach vorne. Dahinter je Seite eine Seiten- und eine Rückenansicht, außen die weiter hinten. Fotos eines anderen Produkts (zum Beispiel Zip statt Hoodie) nicht mischen, außer der Kunde will es.
2. **Freistellen** (BiRefNet, etwa 8 s pro Foto, auch für Einzelbilder):
   ```bash
   .venv/bin/python scripts/cutout.py <foto> 0 1 <tmpdir> <breite> <höhe>
   ```
   Danach nur das größte Teil behalten, auf die Kontur zuschneiden und auf höchstens 2000 px Höhe verkleinern. Ablage als `public/story/fit_<n>.png`. Originale nicht in `public/` liegen lassen, denn der Speicher ist knapp.
3. **Anordnen** in `FIT_STORY_DEFAULT` in `src/story/FitStory.tsx`. Pro Figur gibt es: `src`, `x` (Mitte der Füße), `feet` (y der Sohlen), `h` (Höhe) und `depth` (0 vorne, 1 hinten). Bewährt hat sich:

   | Reihe | feet | h | depth | x |
   |---|---|---|---|---|
   | vorne | 1610 | 1330 | 0 | 540 |
   | Mitte | 1430 | 1090 | 0.55 | 255 und 830 |
   | hinten | 1300 | 900 | 1 | 175 und 905 |

4. **Angaben:** `info` ist zum Beispiel "MODEL 1,86 M · 71 KG · TRÄGT L". Zahlen nur exakt so, wie der Kunde sie nennt. Optional `label` oben (Produktname).
5. **Rendern**, mit schlankem `public` und ohne Cache, weil der Speicher sonst vollläuft:
   ```bash
   SCALE=1 node scripts/render_card.mjs out still FitStory 4.95
   ```
   ```bash
   node scripts/render_card.mjs out video FitStory salite_fit_story
   ```
   Vorher muss der Link `public_card/story` auf `../public/story` existieren.

## Regeln

- Figuren nie verzerren oder spiegeln, außer es wird verlangt (`flip`).
- Hintere Figuren werden heller (Luftperspektive), nicht unscharf.
- Text nur unten dezent: Jost, Großbuchstaben, Laufweite 0,3em, grau. Er steht über dem Antwortfeld der Story.
- Hintergrund heller Studioboden wie auf den Fotos, kein reines Weiß.
