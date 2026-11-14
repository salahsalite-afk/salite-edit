---
name: fit-story
description: Baut aus mehreren Model-Fotos eines Looks (vorne, Seite, Rücken) eine Instagram Story, in der man den Fit aus allen Perspektiven in einem Bild sieht. Figuren stehen mit ihrem echten Bodenschatten frei verteilt mit Tiefe, unten eine dezente Box mit den Model-Angaben. Video-Variante: Figuren wechseln per Swipe die Plätze. Einsetzen, wenn der Kunde Lookbook- oder Shooting-Fotos schickt.
---

# Fit-Story

Ergebnis (1080x1920):
- `out/salite_fit_story.png`: Standbild.
- `out/salite_fit_story.mp4`: 7,5 s. Die Figuren rücken mit jedem Swipe einen Platz weiter, dazu ein leiser Swipe-Sound.

## Ablauf

1. **Fotos sortieren.** Die beste Frontansicht kommt nach vorne. Seite und Rücken verteilen sich links, rechts und klein im Hintergrund. Fotos eines anderen Produkts (zum Beispiel Zip statt Hoodie) nicht mischen, außer der Kunde will es.
2. **Fotos auf 2400 px Höhe verkleinern**, im Scratchpad, nicht in `public/`:
   ```bash
   ffmpeg -i <foto> -vf scale=-2:2400 <tmp>/src_N.png
   ```
3. **Freistellen** (etwa 8 s pro Foto):
   ```bash
   .venv/bin/python scripts/cutout.py <tmp>/src_N.png 0 1 <tmp>/cN <breite> <höhe>
   ```
4. **Figuren mit echtem Bodenschatten** bauen. Das schreibt `fig_N.png` und `figs.json` (Lage der Füße):
   ```bash
   .venv/bin/python scripts/fit_figures.py public/story fig_N:<tmp>/src_N.png:<tmp>/cN/cut_0000.png ...
   ```
   Der Schatten ist die echte Abdunklung des Studiobodens im Foto. Nie künstliche Schatten-Ellipsen bauen: Das sah schwebend und fake aus (Kundenfeedback).
5. **Anordnen** in `src/story/FitStory.tsx`:
   - `SLOTS` sind die Plätze: vorne Mitte groß, links, rechts, zwei klein hinten.
   - Die Figuren dürfen und sollen unterschiedlich groß sein, je nach Tiefe.
   - `FIT_STORY_DEFAULT.figures` legt fest, welche Figur auf welchem Startplatz steht.
6. **Angaben in der Box:** `info`, zum Beispiel "Model: 186 cm | 71 kg | Size L". Zahlen nur exakt so, wie der Kunde sie nennt. Kein "trägt".
7. **Rendern.** Das schlanke `public_card` braucht die Links `story`, `fonts` und `sfx`.
   ```bash
   SCALE=1 node scripts/render_card.mjs out still FitStory 0
   ```
   ```bash
   node scripts/render_card.mjs out video FitStoryVideo salite_fit_story
   ```

## Regeln

- Figuren stehen auf dem Boden, nichts schwebt. Den echten Schatten verwenden, keinen erfundenen.
- Keine Kreisanordnung im Standbild, sondern frei verteilt mit Tiefe.
- Figuren nie verzerren oder spiegeln.
- Hintere Figuren werden nur leicht heller, nicht unscharf.
- Box dezent: Inter fett, dunkle Schrift, ganz leicht graue Fläche, unten mittig.
- Swipe-Sound leise. Gemessen sind es Spitzen um minus 15 dB.
