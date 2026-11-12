---
name: cinematic-video-edit
description: Schneidet und veredelt Videos (TikTok, Reels, Instagram, YouTube) im ruhigen, cinematischen Stil mit Remotion und ffmpeg. Analyse, Transkript, Effektplan, dezente Effekte, Freistellen, Fokus-Look, Sound, Export. Einsetzen, sobald ein Video bearbeitet werden soll.
---

# Cinematic Video Edit

Diese Datei ist das gesammelte Wissen aus mehreren echten Projekten. Als `CLAUDE.md` in einen Projektordner legen oder als Skill (`.claude/skills/cinematic-video-edit/SKILL.md`) speichern.

## 1. Haltung

- Ruhig, teuer, sicher. Das Video spricht für sich, Effekte unterstützen nur.
- Jeder Effekt braucht einen Grund: zeigen, beweisen oder einen Punkt setzen. Reine "mehr Action"-Effekte fliegen raus.
- Lieber dezent und plakativ genug als laut. Text am Anfang wirkt schnell billig.
- Fertige, schon geschnittene Filme nie mit Rahmen oder Vorlagen zerstören. Den Fit, die Schuhe, das ganze Bild sichtbar lassen.
- Was der Auftraggeber sagt, genau so umsetzen. Zahlen, Preise, Namen exakt übernehmen, nichts selbst herleiten. Nur fragen, wenn wirklich etwas fehlt, und nicht zweimal dasselbe.
- Fakten nie erfinden: keine Zahlen, Adressen, Handles, Preise. Fehlt etwas, kurz nachfragen.

## 2. Arbeitsweise

1. **Quelle prüfen** mit ffprobe: Auflösung, Framerate, Bitrate, Codec, Farbraum, HDR, Rotation, Länge. Werte nennen.
2. **Transkript** mit Zeitstempel pro Wort, wenn gesprochen wird (faster-whisper large-v3, `word_timestamps=True`, Sprache automatisch). Unsichere Wörter melden, Halluzinationen am Ende (Wörter ohne Dauer) entfernen.
3. **Kontaktbogen** der Quelle ansehen (`fps=1/2,scale=240:-1,tile=...`), Schnitte frame-genau finden (Streifen mit 25 Bildern pro Sekunde um die Stelle).
4. **Plan** als Tabelle: Zeit, Baustein, Inhalt, Ton. Bei klarem Auftrag direkt bauen.
5. **Standbilder** der vollsten Momente rendern und selbst ansehen, dann dem Auftraggeber zeigen.
6. **Voller Render**, danach die fertige Datei prüfen (ffprobe, Lautheit, Bilder aus der Datei) und kurz auflisten, was drin ist und was sich geändert hat.
7. Jedes Feedback sofort als Regel festhalten (Learnings-Datei), damit es beim nächsten Video nicht wieder passiert.
8. Bei Zeitdruck vorher fragen, wann gepostet wird, und passend rendern.

## 3. Qualität

- Framerate und Seitenverhältnis der Quelle übernehmen. Footage nie hochskalieren. Zooms bis 115 Prozent nur, wenn die Quelle genug Auflösung hat.
- Farbe nur verändern, wenn es gewollt ist (Fokus-Effekt, Angleichen von Fremdmaterial).
- Export: H.264, CRF 16 oder besser, yuv420p, bt709. Ton AAC 320 kbit/s, 48 kHz, Lautheit -14 LUFS, True Peak unter -1 dB.
- TikTok und Reels 1080x1920. Instagram-Feed 1080x1350 (4:5) oder das Originalformat. Querformat-Filme im Original 16:9 lassen statt zu beschneiden.
- Text und Grafik als Vektor oder in voller Auflösung.
- Sichere Zone bei TikTok (bei 1080 Breite): oben 220, unten 420, rechts 140 px frei von Text.
- iPhone-Aufnahmen: HDR beim Export ausschalten (CapCut: 1080p, Original-fps, höchste Bitrate, HDR aus).

## 4. Baukasten der Effekte

| Effekt | Wann | Umsetzung |
|---|---|---|
| Untertitel | Gesprochenes Video | Wie native iPhone/Instagram-Untertitel: Inter 600, GROSSBUCHSTABEN, weiß, dezenter dunkler Schatten, eine Zeile, höchstens 3 Wörter, unten mittig über der sicheren Zone. Wort für Wort aus dem Transkript. |
| Zoomsprung | Pointe, betontes Wort | 108 bis 115 Prozent, harter Sprung oder langsames Hineinfahren über einen Satz. Ursprung auf das Gesicht setzen. |
| Tagtraum | Erinnern, Nachdenken | Langsam hineinfahren, Ränder abdunkeln, kleine Fotos schweben herein, mit Bewegungsunschärfe zurück. |
| Detailbild | Produktdetail wird genannt | Groß und plakativ (60 bis 80 Prozent Bildbreite, nie größer als die Quelle), Hintergrund kurz abdunkeln, 2,5 bis 3 s stehen lassen. Fotos wie Abzüge mit Papierrand, leicht gedreht. |
| Text hinter der Person | Plakative Ankündigung | Großer Text an der Wand, die freigestellte Person läuft davor und verdeckt ihn immer mehr. Nur kurz. Wichtige Zahlen (z. B. Rabatt) vor die Person legen, damit sie lesbar bleiben. |
| Fokus-Moment | Produkt glänzen lassen | Person freigestellt und scharf, leicht heller. Hintergrund dunkler und weich (blur 6, brightness 0.6), Vignette. Ein Lichtstreifen fährt einmal über die Person (Maske = Freistellung). Dazu Musik dunkler und leiser. |
| Standbild mit Preisen | Preise zeigen | Bester Fit-Moment (ganzer Körper, Schuhe sichtbar), Zeitlupe hinein und heraus, langsames Hineinfahren, feine weiße Lookbook-Pfeile mit Punkt auf dem Kleidungsstück, Preise weich ein und aus. |
| Verfolgen | Preise ohne Stopp | Wie Fokus-Moment, aber die Person läuft weiter, Pfeile wandern mit (Ankerpunkte pro Frame, an Keyframes per Hand gesetzt und interpoliert). Optional Zeitlupen-Rampe: normal, langsam, kurz schnell, normal. |
| Drohnen- oder Fremdmaterial | Zusätzliche Perspektive | Im Fluss einschneiden (Bewegung muss zur Einstellung davor passen), farblich an den Film angleichen, beim Standbild Fokus und Preise, schnell mit Bewegungsunschärfe wieder hinaus. |
| Alte Preise | Rabatt zeigen | Klein, durchgestrichen, in Rot neben dem neuen Preis. |
| Fallende Linie | Sale, Black Friday | Kleine rote Statistik-Linie, die sich einmal zeichnet und nach unten fällt, neben einem roten Label. |
| Glas-Schrift | Text soll ruhig bleiben | Buchstaben als Milchglas: Ebene mit backdrop-filter, auf die Textform zugeschnitten (SVG clipPath), feine helle Kontur. |
| Handy-Outro | Handlungsaufruf | Smartphone in der Bildmitte über dem Endbild: Webseite, Tipp auf den Button (Klick), Wechsel zum DM-Chat, Nachricht wird mit Tastatur-Ton getippt und gesendet. Daneben dezente Infos. |
| Folgen und Kommentar | "folgt" und "kommentiert" werden gesagt | Originalgetreue App-Elemente: Profilbild mit Plus, das zum Haken wird (Glocken-Ton); Kommentarleiste, in der jemand den gesagten Kommentar tippt (Tastatur-Ton). Originaldesign der App behalten. |
| Story-Fluss | Viele Anfragen zeigen | Bildschirmaufnahme in ein Band aus ganzen Reihen schneiden, nahtlos wiederholen, konstant scrollen, stark weichzeichnen (gblur sigma 26), damit nichts Privates lesbar ist. |

Übergänge: harter Schnitt ist Standard. Erlaubt sind Schwarzblende, Bewegungsunschärfe beim schnellen Herauszoomen, Maskenwechsel (z. B. Blende wie ein Kameraverschluss). Keine Glitches, keine Wischblenden aus Vorlagen. Federn ohne Nachwippen. Einblendungen ease-out-expo, 14 bis 18 Frames bei 30 fps.

## 5. Ton

- Reihenfolge: Stimme, Stille, Effekte, Musik. Stimme immer klar vorn.
- Soundeffekte 18 bis 22 dB unter der Stimme, Übergänge besonders leise. Lieber zu leise als zu laut. Nach dem Mischen messen.
- Effekte sitzen exakt auf dem Frame der Bewegung (Zeitpunkte aus dem Transkript).
- Höchstens ein Effekt pro Sekunde (Ausnahme: Tastatur-Tippen).
- Musik nie zerschneiden: Wenn Bild herausgeschnitten wird, läuft die Musik weiter, die Lücke füllt ein stehendes Endbild.
- Film-Fokus: während eines Fokus-Moments Musik dunkler und leiser (Tiefpass rund 600 Hz, etwa 6 bis 8 dB leiser, weich ein- und ausblenden).
- Eigene Effekte mit ffmpeg erzeugen, wenn keine vorhanden: tiefer Sinus-Schlag, gefiltertes Rauschen als Whoosh, kurzer Klick, tiefe Fläche, Tastatur-Klicks, Scanner (steigender Ton mit leichtem Flimmern und leisem Piep am Ende).

## 6. Werkzeuge und Rezepte

**Remotion** (React-Videos):
- Eine Komposition pro Version, Varianten über Props. Quelle per `OffthreadVideo`, Ton per `Audio`, Standbild per `Freeze`.
- Schriften lokal über `@fontsource` laden (FontFace + delayRender), weil der Render-Browser oft nicht ins Internet kommt.
- Hohe Auflösung (4K) dauert lange und braucht viel Speicher. Für Social Media direkt in 1080 rendern (`--scale=0.5` bei 4K-Komposition), 2 bis 4 parallele Tabs.
- Große Rohdateien nie in `public/` legen; Remotion kopiert den Ordner bei jedem Render. Alte Kopien `/tmp/remotion-webpack-bundle-*` regelmäßig löschen.

**Freistellen** (Person vom Hintergrund trennen):
- BiRefNet lite als ONNX (MIT-Lizenz, Hugging Face `onnx-community/BiRefNet_lite-ONNX`), Eingabe 1024x1024, Ausgabe Alpha-Maske, auf Bildgröße hochskalieren, leicht weichzeichnen, als PNG mit Alpha speichern.
- Rund 8 s pro Frame auf 4 CPU-Kernen: nur die nötigen Frames freistellen.
- Frames frame-genau holen: `trim=start_frame=A:end_frame=B,setpts=PTS-STARTPTS` und `-fps_mode passthrough`.
- Wenn Nebenpersonen mit freigestellt werden: nur die größte zusammenhängende Fläche behalten (scipy `ndimage.label`).

**Zeitlupe**: `setpts=2.2*(PTS-STARTPTS),minterpolate=fps=25:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`.
**Schnell mit Bewegungsunschärfe**: `setpts=PTS/2.4,fps=50,tmix=frames=3,fps=25`.

**Farbangleich von Fremdmaterial**: Mittelwert pro Farbkanal von Film und Fremdmaterial messen, nur Helligkeit und Weißabgleich angleichen (`lutrgb`), Kontrast fast lassen (Faktor 0,9), leichte Vignette. Nicht über die Streuung angleichen, das macht das Bild flau und verwaschen.

**Lautheit**: zwei Durchgänge `loudnorm=I=-14:TP=-1:LRA=20` (messen, dann `linear=true` mit den Messwerten), Bild per `-c:v copy`.

**Film-Fokus im Ton** (Fenster a bis b in Sekunden):
```
G="clip((t-a)/0.35\,0\,1)*clip((b-t)/0.5\,0\,1)"
asplit[d][w];[d]volume='1-$G':eval=frame[d2];[w]lowpass=f=600,lowpass=f=600,volume='0.42*$G':eval=frame[w2];[d2][w2]amix=inputs=2:normalize=0
```

**Downloads großer Dateien**: Google-Drive-Links mit "Jeder mit dem Link" freigeben, dann `https://drive.usercontent.google.com/download?id=ID&export=download&confirm=t`.

## 7. Prüfliste vor dem Export

- [ ] Erste 3 Sekunden verständlich ohne Ton
- [ ] Kein Text in den Randzonen der App
- [ ] Nie länger als 3 Sekunden Stillstand im Bild (außer bewusst ruhigen Filmen)
- [ ] Ganzer Fit sichtbar, wenn Kleidung gezeigt wird (inklusive Schuhe)
- [ ] Alle Zahlen, Preise, Namen exakt wie vorgegeben
- [ ] Effekte leise genug, Stimme überall verständlich
- [ ] Musik nicht zerschnitten
- [ ] Fremdmaterial farblich angeglichen und im Fluss eingeschnitten
- [ ] Export-Werte aus Abschnitt 3 eingehalten, fertige Datei geprüft

## 8. Gelernt aus Feedback

1. Soundeffekte waren zu laut: deutlich leiser mischen, Übergänge am leisesten.
2. Detailbilder waren zu klein und zu kurz: groß, plakativ, 2,5 bis 3 s.
3. Untertitel in Zierschrift mitten im Bild wirkten komisch: schlicht wie iPhone/Instagram, unten.
4. Produkt braucht einen Wow-Moment: freistellen, Rand oder Lichtstreifen, Hintergrund dunkel, Person hell.
5. Handlungsaufrufe nicht abstrakt (Menükarte), sondern wie in der echten App.
6. Rahmen-Vorlagen um einen fertigen Film zerstören ihn: Vollbild im Original lassen.
7. Unpassende Szenen ganz herausschneiden, Musik weiterlaufen lassen.
8. Text am Anfang wirkt billig: Infos dezent ans Ende.
9. Ein Standbild braucht Dynamik: Zeitlupe, Hineinfahren, Fokus, weiche Ein- und Ausblendungen, gedämpfte Musik.
10. Fremdmaterial muss im Fluss beginnen: dort, wo sich die Person noch bewegt, wie in der Einstellung davor; erst danach stehen bleiben.
11. Farbangleich nicht verwaschen: Kontrast erhalten, nur Helligkeit und Weißabgleich angleichen.
12. Bei Zeitdruck lieber 1080 statt 4K rendern; Speicher und Festplatte im Blick behalten.
