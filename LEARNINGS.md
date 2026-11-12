# SALITE Learnings

Jedes Video bekommt einen Eintrag: was der Kunde gesagt hat, was wir daraus gelernt haben, welche Regel oder welcher Agent geändert wurde.

## Video 1: Therapeut-Sketch, Black Friday Tracksuit (11.11.2026)

Ergebnis: online. Kunde: "für das erste Mal schon gut gemacht".

Was gestört hat und die neue Regel:
1. Soundeffekte und Übergänge zu laut. Jetzt 18 bis 22 dB unter der Stimme, gemessen von `salite-sound`.
2. Detailbilder (Puffprint, Stack) zu klein und zu versteckt. Jetzt plakativ: 60 bis 80 Prozent Bildbreite, Hintergrund abgedunkelt, 2,5 bis 3 s.
3. Untertitel wirkten komisch (Serifenschrift, zu hoch, Wörter hervorgehoben). Jetzt: Inter, Großbuchstaben, weiß, schlicht, unten mittig, eine Zeile.
4. Kein Wow-Moment für das Produkt. Neuer Baustein HELD: Person freistellen, Rand, Hintergrund dunkel, Person heller, wenn "dieser Tracksuit" gesagt wird.
5. Handlungsaufruf zu abstrakt (Menükarte). Neue Bausteine FOLGEN (TikTok-Profilbild, Plus wird Haken, Glocken-Sound, oben links) und KOMMENTAR (TikTok-Kommentarleiste, jemand tippt "Ich brauch ein Passwort", Tastatur-Sound).
6. Zu viele Rückfragen. Was der Kunde sagt, genau so umsetzen. Preise exakt übernehmen (130 € auf 69 €, "bis zu 80 %" bezieht sich auf andere Teile im Shop).
7. Zeitdruck beim Posten: 4K dauert zu lange. Zeitplan am Anfang erfragen, TikTok-Fassung in 1080x1920 rendern.

Was gut ankam: Therapeuten-Vibe (Patientenakte, Stempel BESESSEN, Tagtraum), Black-Friday-Preisbild, Zoomsprünge auf Pointen.

Fakten zur Marke:
- TikTok @saliteclothing1, Instagram @saliteclothing
- Tracksuit 550 GSM

## Änderungen am System
- 12.11.2026: Agenten `salite-creative-director`, `salite-brand`, `salite-instagram` und `salite-evolver` angelegt, `BRAND.md` begonnen (Wunsch des Kunden: Kritik und Ideen, Nische und Grading, Instagram-Storys und Dumps zur Customer Journey, ständige Weiterentwicklung).
- 12.11.2026: `salite-trendscout` angelegt (täglicher Trendbericht in `trends/`). `salite-evolver` setzt die stärksten Funde jetzt selbstständig um (Wunsch des Kunden), außer Qualitätsregeln, Look und Markenfakten.
- 12.11.2026: `salite-orchestrator` angelegt (Wunsch des Kunden): entscheidet selbstständig über neue, ersetzte und archivierte Agenten, Wettbewerb über Herausforderer, Bündnisse in `agents/ALLIANZEN.md`, Noten in `agents/SCOREBOARD.md`. Höchstens 15 aktive Agenten, Archiv statt Löschen.
- 12.11.2026: Aktive Kampagne `KAMPAGNE_BLACK_WEEK.md` angelegt (Passwort-Drop, Tracksuit 69 €, Start 27.11.2026). Alle Agenten richten sich danach aus.

## Video 2: Instagram-Post Black Friday, RED-Runway-Film (12.11.2026)

Quelle: fertig geschnittener Runway-Film 3840x2160, 25 fps, 37,5 s, mit Musik, fünf Looks. Ohne Sprecher, ohne Untertitel.
Umsetzung: Film unverändert und vollständig im 4:5 Rahmen (1080x1350), Blendenschnitt an jedem Look-Wechsel, Kontaktbogen mit einem Abzug pro Look, Schlusskarte mit Preis.

Kunden-Feedback während der Arbeit und neue Regeln:
1. Grau und Schwarz sind die meistverkauften Tracksuits. Sie stehen immer im Vordergrund: größer, mit Label BESTSELLER, auf der Schlusskarte als große Abzüge.
2. Für Sale-Posts mehr Streetwear, moderner, heller, weniger elegant: heller Hintergrund, kräftige Schrift (Anton für Schlagzeilen, Inter für Labels), Preis und Rabatt in Rot. Das ist die Sale-Variante; der elegante SALITE Look bleibt für Marken-Inhalte.
3. Instagram ist exklusiver als TikTok, aber Sale-Kommunikation muss trotzdem sofort ins Auge springen.

Feedback zur ersten Fassung (12.11.2026) und neue Regeln:
4. Rahmen-Vorlagen um einen fertigen Film zerstören ihn: Der Fit und die Schuhe sind nicht mehr richtig zu sehen. Fertige Kampagnenfilme bleiben im Vollbild in ihrem Originalformat, ohne Rahmen. Text höchstens ganz dezent im Bild, an einer freien Stelle (z. B. links mittig auf der Wand), erst nach einem Filmtitel.
5. Nicht passende Looks werden ganz herausgeschnitten (hier: Model im weißen Tanktop, zu wenig seriös für den Film). Die Musik läuft dabei ungeschnitten weiter; die entstandene Lücke füllt das stehende Endbild.
6. Varianten pro Plattform liefern: Instagram plain ohne Text, Instagram mit dezentem Text und DM-Aufruf ("Schreib uns per DM: Ich brauch ein Passwort"), TikTok nur mit "Black Friday" und Preis.
7. Preis im Runway-Film laut Kunde: Tracksuit 60 €.
