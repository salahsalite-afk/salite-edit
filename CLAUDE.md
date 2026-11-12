# SALITE Edit System

Diese Datei liegt im Projektordner. Claude Code liest sie bei jedem Start und schneidet danach.
Sie beschreibt, wie ein SALITE Video aussieht, klingt und sich bewegt.

## 0. Aktive Kampagne

Bis Ende der Black Week gilt `KAMPAGNE_BLACK_WEEK.md`: jedes Video, jede Story und jede Recherche dient dem Passwort-Drop am 27.11.2026.

## 1. Haltung

Ruhig, teuer, sicher. Das Video erklärt nichts hektisch, es zeigt.
Jeder Effekt hat einen Grund: Er beweist etwas, zeigt etwas oder setzt einen Punkt.
Wenn ein Effekt nur "mehr Action" bringt, fliegt er raus.
Vorbild im Tempo ist ein Filmtrailer, kein Gaming Clip.

## 2. Qualität (nicht verhandelbar)

- Quelle zuerst mit ffprobe prüfen. Framerate, Seitenverhältnis und Farbraum der Quelle übernehmen.
- Footage nie hochskalieren, nachschärfen oder farblich verändern, außer es wird ausdrücklich verlangt.
- Export: H.264, CRF 16 oder besser, yuv420p. Ton AAC 320 kbit/s, 48 kHz.
- Ausgabe 1080x1920 für TikTok und Reels. Für YouTube in der Auflösung der Quelle bleiben (4K bleibt 4K).
- Grafiken und Text als Vektor oder in voller Auflösung bauen.
- Sichere Zone: oben 220 px, unten 420 px, rechts 140 px frei von Text halten (TikTok Oberfläche).

## 3. Look

Die Welt: Espresso, Eiswürfel, Champagner, Leder, Uhren, alte Filme. Vintage und zeitlos, aber modern geschnitten.
Es soll aussehen wie ein Magazin, das sich bewegt, nicht wie eine App.

Farben (aus der SALITE Seite "Our World"):
- Papier     #F2ECE1  (Standard Hintergrund für Vollbild Grafik)
- Papier 2   #E9E0D0  (zweite Fläche, Karten)
- Linie      #D8CBB4  (feine Linien, Rahmen)
- Espresso   #1E1712  (Text, dunkler Hintergrund statt Schwarz)
- Braun      #4A3D31  (Fließtext)
- Taupe      #6B5D4F  (kleine Labels)
- Bordeaux   #5A1A1F  (einzige Akzentfarbe, sparsam, ein Element pro Bild)

Schriften (alle bei Google Fonts, über `@remotion/google-fonts` laden):
- Bodoni Moda, kursiv, Gewicht 400 bis 500: Statements, Zahlen, große Wörter.
- Cormorant Garamond 400 bis 500: Sätze und Untertitel.
- Jost 400 bis 500, Großbuchstaben, Laufweite 0.3em, klein: Labels, Daten, Kapitelzeilen.

Logo: `brand/salite-s-dark.svg` auf hellem Grund, `brand/salite-s-light.svg` auf dunklem Grund.
Das S nie verzerren, nie neu zeichnen, keine Effekte darauf außer Einblenden.

Regeln:
- Ausnahme: nachgebaute TikTok-Elemente (FOLGEN, KOMMENTAR) behalten ihr Originaldesign inklusive TikTok-Rot, sonst wirken sie nicht echt.
- Kein Neongelb, kein Signalrot, keine bunten Sticker, keine Emojis, keine fette Sans in Großbuchstaben als Hauptschrift.
- Keine Farbverläufe in Lila oder Blau, keine Glas Effekte, keine leuchtenden Ränder. Das ist der typische KI Look.
- Vollbild Grafiken laufen auf Papier oder Espresso, nie auf reinem Weiß oder reinem Schwarz.
- Fotos und Clips in Grafik Szenen wie Abzüge behandeln: leicht gedreht (2 bis 6 Grad), weicher warmer Schatten, übereinander gelegt wie auf einem Tisch.
- Freigestellte Produkte bekommen einen dünnen Papierrand wie ausgeschnitten.
- Untertitel: wie native iPhone/Instagram Untertitel, damit es vertrauenswürdig wirkt. Schrift Inter (Google Font, am nächsten an SF Pro), Gewicht 600, ALLES IN GROSSBUCHSTABEN, reines Weiß, nur ein dezenter dunkler Schatten, keine Hervorhebung einzelner Wörter. Eine Zeile, höchstens 3 Wörter. Mittig, unten direkt über der sicheren Zone (Unterkante bei 1920 minus 420 px), nie in der Bildmitte.
- Texte kurz und geladen. Keine Gedankenstriche, keine Schrägstriche.
- Feines Filmkorn auf allen Grafik Szenen (Deckkraft 6 bis 8 Prozent), damit nichts steril wirkt.

## 4. Bewegung

- Standardkurve: weich rein, weich raus (ease out expo für Einblendungen, 14 bis 18 Frames bei 30 fps).
- Federn ohne Nachwippen. Nichts hüpft.
- Zoom auf Sprecher: höchstens 108 bis 115 Prozent, als harter Sprung auf einem betonten Wort oder als langsames Hineinfahren über einen ganzen Satz.
- Übergänge: harter Schnitt ist Standard. Erlaubt sind außerdem Schwarzblende, Bewegungsunschärfe beim schnellen Herauszoomen und Maskenwechsel. Keine Glitches, keine Wischblenden aus Vorlagen.
- Spätestens alle 3 Sekunden ändert sich etwas im Bild: Ausschnitt, Ebene, Einblendung oder Szene.
- Spätestens alle 8 bis 10 Sekunden wechselt der Modus (siehe Baukasten).

## 5. Baukasten

Jede Szene ist einer dieser Bausteine. Bausteine als wiederverwendbare Komponenten anlegen.

| Baustein | Wofür | Umsetzung |
|---|---|---|
| HOOK | Erste 3 Sekunden | Aussage als Text, 1 bis 3 Wörter pro Einblendung, exakt auf die Stimme. Im ersten Satz ein Kamerasprung von nah auf total mit Bewegungsunschärfe. |
| SPRECHER | Erzählen | Originalbild, Zoomsprünge auf betonten Wörtern, sonst nichts. |
| WORTBILD | Zahlen, Daten, Namen | Satz baut sich Wort für Wort auf. Nur das wichtigste Wort in Bodoni kursiv oder Bordeaux. |
| OBJEKT | Gesagtes sichtbar machen | Detailbild plakativ und groß: mindestens 60 bis 80 Prozent der Bildbreite (nie größer als die Quelle), Hintergrund kurz abgedunkelt, klarer schneller Einflug, 2,5 bis 3 Sekunden stehen lassen. Lieber groß und kurz als klein und versteckt. |
| ABZUG | Eigene Inhalte zeigen | Clip oder Foto fällt als Abzug auf den Papier Tisch, leicht gedreht, weitere legen sich darüber. Hintergrund Footage wird dunkler und entsättigt. |
| BEWEIS | Zahlen, Bestellungen, Reichweite | Vollbild auf Papier: große Zahl in Bodoni kursiv läuft hoch, darunter Label in Jost. Oder Produkte als ausgeschnittene Stücke im Raster mit Stempel "SOLD OUT" in Bordeaux. Nur echte Zahlen verwenden. |
| ABLAUF | Etwas erklären | Vollbild, dünne Espresso Linien zeichnen sich von Hand, verbinden zwei bis drei Abzüge, am Ende ein Statement in Bodoni kursiv. |
| LISTE | Aufzählung | Wie eine Menükarte: Punkte erscheinen nacheinander in Cormorant, Nummern in Jost, feine Linie dazwischen. |
| ARCHIV | Echte Momente | Fremdes oder altes Material mittig, unscharfe Kopie füllt den Rand. |
| SCHWARZ | Punkt setzen | 1,5 bis 2,5 Sekunden schwarzes Bild mit Ton darunter. Höchstens zweimal pro Video. |
| TITEL | Datum, Ankündigung | Schwarz, weiße Großbuchstaben, ein Begriff pro Einblendung, harter Wechsel. |
| ABGANG | Ende | 1 bis 2 Sekunden Stille, dann Wortmarke und Handle. |
| HELD | Produkt wird genannt und ist im Bild | Person mit dem Produkt freistellen (`scripts/segment.py`), dünner heller Rand um die Kontur, Hintergrund abdunkeln, Person leicht aufhellen, dazu Zoomsprung oder kurzes Standbild. Der Wow-Moment des Videos, mindestens einmal pro Video. |
| FOLGEN | Handlungsaufruf "folgen" | Originalgetreues TikTok-Folgen-Element, dezent oben links: rundes Profilbild (weißes S-Logo auf Espresso), rotes Plus darunter, beim Wort "folgen" wird das Plus zum Haken. Dazu ein leiser Glocken-Sound (`notify.wav`). |
| KOMMENTAR | Handlungsaufruf "kommentieren" | Originalgetreue TikTok-Kommentarleiste mit Tastatur. Jemand tippt Buchstabe für Buchstabe den gesagten Kommentar (z. B. "Ich brauch ein Passwort"), passend zur Stimme, mit leisem Tastatur-Tippen (`keyboard_tap.wav`) pro Buchstabe. |

## 6. Dramaturgie (für 60 bis 90 Sekunden)

1. HOOK, 0 bis 4 s: das Versprechen in einem Satz.
2. SCHWARZ oder Totale, 2 bis 3 s: Luft holen lassen.
3. BEWEIS oder ABZUG, 10 bis 15 s: warum man uns glauben kann.
4. SPRECHER mit WORTBILD und OBJEKT, 15 bis 20 s: worum es geht.
5. LISTE oder ABLAUF, 5 bis 8 s: so einfach ist es.
6. BEWEIS und ARCHIV, 8 bis 12 s: es ist schon passiert.
7. SPRECHER mit Handlungsaufruf, 8 bis 10 s.
8. TITEL und ABGANG, 6 bis 10 s.

Verhältnis als Richtwert: ein Drittel Sprecher, ein Drittel Vollbild Grafik, ein Drittel Mischformen.

## 7. Ton

Reihenfolge der Wichtigkeit: Stimme, Stille, Effekte, Musik.

- Stimme ist immer klar vorn. Zuerst säubern und auf etwa minus 14 LUFS bringen.
- Musik, falls überhaupt, sehr leise darunter (rund 20 dB unter der Stimme). Unter Vollbild Grafik darf sie 3 dB hochkommen.
- Effekte sitzen auf dem Frame der Bewegung, nicht davor und nicht danach. Zeitpunkte aus `transcript.json` nehmen.
- Pro Sekunde höchstens ein Effekt (Ausnahme: Tastatur-Tippen im Kommentar). Lautstärke 18 bis 22 dB unter der Stimme. Übergänge (Whoosh, Schlag) besonders leise: Kunde fand sie im ersten Video deutlich zu laut. Nach dem Mischen messen, nicht schätzen.
- Tiefe Schläge nur auf Schnitten in neue Szenen und auf Statements.
- Unter SCHWARZ liegt ein tiefer, stehender Ton, der am Ende abreißt.
- Vor dem ABGANG echte Stille.

Dateien in `sfx/` (Namen genau so, fehlt eine Datei, Effekt weglassen und melden):

| Datei | Einsatz |
|---|---|
| `hit_low.wav` | Szenenwechsel, Statement |
| `whoosh_soft.wav` | Einflug von Objekt oder Abzug |
| `tick.wav` | Wort für Wort Text, Zähler |
| `click.wav` | Knopf, Haken |
| `notify.wav` | Benachrichtigung |
| `drone_low.wav` | unter SCHWARZ und TITEL |
| `riser_short.wav` | letzte halbe Sekunde vor einem Schnitt |
| `keyboard_tap.wav` | Tippen im KOMMENTAR, ein Anschlag pro Buchstabe |

SALITE eigene Klänge (das unterscheidet uns, statt der üblichen Vorlagen Sounds):

| Datei | Ersetzt |
|---|---|
| `ice_clink.wav` | `click` bei Haken und Knöpfen |
| `champagne_pop.wav` | `hit_low` bei Ankündigung oder Drop |
| `lighter_flick.wav` | `whoosh_soft` bei Einflug von Objekten |
| `watch_tick.wav` | `tick` bei Zählern und Text |
| `leather_slide.wav` | Wechsel in Vollbild Grafik |

Wenn `sfx/` leer ist: die Standard Sounds selbst mit ffmpeg erzeugen (tiefer Sinus Schlag mit schnellem Abfall, gefiltertes Rauschen als Whoosh, kurzer Klick, tiefe Fläche) und dort ablegen. Dezent mischen.

## 8. Arbeitsweise

1. Quelle analysieren, `transcript.json` mit Zeitstempeln pro Wort erzeugen.
2. Schnittplan als Tabelle vorschlagen: Zeit, Baustein, Inhalt, Ton. Auf Freigabe warten.
3. Erst dann bauen. Vor dem ersten vollen Render drei Standbilder der vollsten Momente zeigen.
4. Nach jedem Render kurz auflisten, was sich geändert hat.
5. Fehlende Fonts, Sounds, Clips oder Zahlen nie erfinden. Nachfragen.
6. Was der Kunde sagt, wird genau so umgesetzt. Zahlen und Preise exakt übernehmen, nichts selbst herleiten oder ergänzen. Nur nachfragen, wenn etwas wirklich fehlt; nicht dieselbe Sache mehrfach.
7. Vor jedem neuen Video `LEARNINGS.md`, `BRAND.md` und die aktive Kampagne lesen. Nach jedem Kunden-Feedback dort eintragen, was gelernt wurde, und die Regeln hier anpassen.
8. Ablauf mit den Agenten in `.claude/agents/` (siehe Abschnitt 10).

## 10. Agenten-Team

Der Hauptagent schneidet. Die Spezialisten prüfen, bevor etwas den Kunden erreicht:

| Agent | Aufgabe | Wann |
|---|---|---|
| `salite-planner` | Effektplan aus `transcript.json` nach Baukasten und LEARNINGS | Schritt 2 |
| `salite-critic` | Prüft Standbilder und Plan gegen CLAUDE.md, Prüfliste und LEARNINGS, gibt eine Fehlerliste | vor jedem vollen Render |
| `salite-sound` | Misst Pegel von Stimme und Effekten, meldet alles, was zu laut ist | vor jedem vollen Render |
| `salite-retention` | Prüft Hook, Tempo (alle 3 s eine Änderung), Wow-Moment, Handlungsaufruf | nach dem Plan und vor dem Render |
| `salite-creative-director` | Kritisiert Skript, Inhalt und Video, liefert Ideen für Formate, Locations, Models; kritisiert die anderen Agenten | vor dem Dreh und nach jedem Video |
| `salite-brand` | Pflegt `BRAND.md`: Nische, Color Grading, Sprache, Formate | vor neuen Formaten |
| `salite-instagram` | Storys und Foto-Dumps passend zum TikTok desselben Tages (Customer Journey TikTok zu Instagram zu Kauf) | für jedes TikTok-Video |
| `salite-trendscout` | Täglicher Trendbericht in `trends/`: Marken (Corteiz, Supreme, Stüssy, 6PM, Peso, None of Us und neue), Hooks, Formate, Plattform-Änderungen, Saison, Posting-Zeiten | täglich als geplanter Task |
| `salite-orchestrator` | Chef des Teams: bewertet alle Agenten (`agents/SCOREBOARD.md`), lässt Herausforderer gegen schwache Agenten antreten, archiviert Verlierer, erschafft ohne Rückfrage neue Agenten, legt Bündnisse fest (`agents/ALLIANZEN.md`) | täglich nach dem Evolver und nach jedem Video |
| `salite-evolver` | Setzt die stärksten Trendfunde selbstständig um, bewertet alle Agenten, ersetzt schwache, schlägt neue Bausteine und Skills vor, protokolliert alles in LEARNINGS | nach jedem Trendbericht und nach jedem Video |

Schleife: bauen, Standbilder, Kritik von `salite-critic`, `salite-sound` und `salite-retention`, korrigieren. Höchstens zwei Runden, dann dem Kunden zeigen.
Nach jedem Video: Wenn Kunden-Feedback zeigt, dass ein Agent etwas übersehen hat, seine Prüfregeln in `.claude/agents/` ergänzen. Ein Agent, der wiederholt nichts Nützliches findet, wird umgeschrieben oder ersetzt. Änderung in `LEARNINGS.md` vermerken.

## 11. Technik (Erfahrung aus Video 1)

- Schriften lokal über `@fontsource` laden; der Render-Browser kommt nicht an Google Fonts.
- 4K-Render dauert auf 4 Kernen rund 1 Stunde und lief bei 3 parallelen Tabs in den Speicher. Für TikTok mit `SCALE=0.5 CONC=4 bash scripts/render.sh` rendern (rund 25 Minuten). Zeitplan beim Kunden vorher erfragen.
- Große Fotos vorher auf höchstens die doppelte Anzeigegröße verkleinern.
- Freistellen: `scripts/segment.py` (BiRefNet lite, MIT-Lizenz, von Hugging Face) erzeugt Masken pro Frame.
- iPhone-Videos: HDR beim Export aus CapCut ausschalten.

## 9. Prüfliste vor dem Export

- [ ] Erste 3 Sekunden verständlich ohne Ton
- [ ] Kein Text in den Randzonen der App
- [ ] Nie länger als 3 Sekunden Stillstand im Bild
- [ ] Höchstens eine Akzentfarbe pro Bild
- [ ] Jeder Effekt hat einen hörbaren Partner oder bewusst keinen
- [ ] Alle Zahlen und Screenshots echt
- [ ] Stimme durchgehend verständlich, auch auf Handy Lautsprecher
- [ ] Export Werte aus Abschnitt 2 eingehalten
- [ ] Effekte 18 bis 22 dB unter der Stimme (gemessen)
- [ ] Detailbilder groß genug, um sie auf dem Handy sofort zu erkennen
- [ ] Handlungsaufruf mit FOLGEN und KOMMENTAR umgesetzt, wenn er im Video gesagt wird
