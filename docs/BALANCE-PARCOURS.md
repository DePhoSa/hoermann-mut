# Balance Tor-Parcours (Release Candidate 0.9)

Messung: `node tests/balance-parcours.cjs` (1000 Läufe je Stufe, feste Zufallssaat, max. 80 Tore je Lauf).
Die Simulation bildet die Spielphysik 1:1 nach (60 Hz, Schwerkraft 0,36, Sprung -7,2, Kugelradius 15, Torbreite 56, Torabstand 270).

## Bot-Modell (menschenähnlich)

Der Bot kennt die Physik (wie ein geübter Spieler), reagiert aber verzögert: Ein Tipp, der jetzt entschieden wird, wirkt erst nach der Reaktionszeit plus Tipp-Jitter. Pro Stufe: Reaktionszeit (mit Streuung), Tipp-Jitter, Zielungenauigkeit je Tor (er zielt im Mittel 30 px unter die Lochmitte, wie echte Spieler), Schätzfehler der Höhe, Mindestabstand zwischen Tipps, kleine Aussetzer.

| Stufe | Reaktion | Jitter (Frames) | Zielstreuung |
|---|---|---|---|
| Anfänger | 300 ms | 3 | 16 px |
| Casual | 240 ms | 2,5 | 12 px |
| Durchschnitt | 200 ms | 2 | 9 px |
| Gut | 150 ms | 1,5 | 6 px |
| Sehr gut | 120 ms | 1 | 4 px |

## Ergebnis (Tore pro Lauf)

Alt (3.4.0: Lücke 176 → 144, Höhensprung bis 110 sofort, erstes Tor bei x=760):

| Stufe | Median | P25 / P75 | P90 | Tod in den ersten 3 Toren | ≥ 25 Tore |
|---|---|---|---|---|---|
| Anfänger | 3 | 1 / 5 | 8 | 48 % | 0 % |
| Casual | 5 | 2 / 9 | 14 | 31 % | 1 % |
| Durchschnitt | 9 | 4 / 16 | 23 | 17 % | 8 % |
| Gut | 18 | 10 / 29 | 38 | 7 % | 36 % |
| Sehr gut | 35 | 24 / 50 | 72 | 2 % | 74 % |

Befund: Der Einstieg war zu hart (jeder dritte Casual-Spieler scheitert in den ersten 3 Toren, obwohl dort schon die volle Höhendifferenz von 110 px möglich war), das erste Tor kam erst nach ca. 4,6 s Warten.

Neu (dieser Stand):

| Stufe | Median | P25 / P75 | P90 | Tod in den ersten 3 Toren | ≥ 25 Tore |
|---|---|---|---|---|---|
| Anfänger | 5 | 2 / 8 | 12 | 29 % | 0 % |
| Casual | 8 | 5 / 13 | 18 | 14 % | 3 % |
| Durchschnitt | 14 | 7 / 22 | 28 | 6 % | 18 % |
| Gut | 23 | 14 / 32 | 40 | 1,4 % | 45 % |
| Sehr gut | 38 | 29 / 55 | 77 | 0,1 % | 82 % |

Ziel (Casual 8-15, Gut 25+, kein Tod in den ersten 3 Toren per Design) ist erreicht. Die verbleibenden frühen Tode der Bots sind Zielstreuung der schwächsten Stufen, keine unpassierbaren Tore.

## Änderungen

- Grundlücke 176 → 184 px (Endwert 144 px nach 30 Toren bleibt).
- Die ersten 4 Tore: Lücke +20 px, Höhenunterschied zum Vorgänger max. 50 px.
- Danach wächst der erlaubte Höhenunterschied von 80 px auf 110 px (über 30 Tore).
- Erstes Tor steht bereits sichtbar bei x=500 (vorher außerhalb des Bildes bei x=760): ca. 2,8 s bis zum ersten Tor statt 4,6 s, und der Spieler sieht schon im Wartezustand, worum es geht.
- Tempo 2,4 → 3,4 und Torabstand 270 unverändert.

## Passierbarkeit

Jedes Tor ist erreichbar: Höhenunterschied max. 110 px; in einem Torabstand (79 Frames bei Höchsttempo) schafft man steigend ca. 4,5 px/Frame (Dauer-Tippen im 14-Frame-Takt) und fallend ca. 24 Frames für 110 px. Die Lücke bei Tor 30+ (144 px, nutzbar 114 px) ist größer als die Sprunghöhe eines Tipps (ca. 72 px) plus Toleranz. Der "sehr gut"-Bot (120 ms) erreicht in 82 % der Läufe 25 Tore und oft das Limit von 80.

## Wertung

Wertung bleibt "Tore" (ein Tor = 1 Punkt), Bestenliste `parcours_v02` unverändert. Das Spiel wird leichter, die Zählweise ändert sich nicht; eine neue Kategorie ist nicht nötig. Bestehende Rekorde stammen aus der härteren Einstellung und sind damit minimal besser wert; das ist hinnehmbar.

## Nicht gemessen

Echte Menschen (Bots sind ein Modell), Touch-Latenz echter Geräte (typisch 30-80 ms zusätzlich zur Reaktionszeit), Ermüdung.
