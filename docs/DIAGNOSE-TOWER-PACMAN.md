# Diagnose: Tower of Mut und Hörmann Mut-Man (pausierte Spiele)

Stand: Portal 3.4.0. Nur Diagnose. An den Spielen und am Portal wurde nichts geändert; beide bleiben pausiert.

## So wurde getestet

- Neuer Prüflauf `tests/abnahme/scenarios/c2-paused-games.js`. Er hebt die Pause **nur in der Testseite** auf (die Datei `game-navigation.js` wird beim Laden im Test umgeschrieben, die echte Datei bleibt unberührt) und spielt beide Spiele wie ein Mensch: Kachel, Bereit-Dialog, Countdown, Pause, spielen, verlieren, Ergebnis speichern, Neustart, "Punkte sichern", Bestenliste im Spiel, zurück ins Menü.
- Bildschirme: Desktop 1360x900, Laptop 1280x720 (1,5-fache Pixeldichte), Handy 390x844. Auf dem Handy mit echten Berührungen (Bildschirmtasten), am PC mit Tastatur und Maus.
- Roboter: Mut-Man wird per Wegsuche zu den Punkten gesteuert, Tower per Sprung-Timing vor Hindernissen. Beide Roboter lesen den Spielzustand nur, setzen ihn nie.
- Dazu laufen die üblichen Prüfungen der Abnahme (JavaScript-Fehler, seitliches Überstehen, 44-px-Tippflächen, abgeschnittener Text, doppelte Knöpfe, überlagerte Fenster). Die Cloud ist eine Attrappe, es wird nichts Echtes geschrieben, es gehen keine Anfragen ins Internet.
- Aufruf: `ABNAHME_ONLY=P node tests/abnahme/run.js` (ca. 3 Minuten, optional `ABNAHME_VP=desktop,laptop15,phone390`). Der normale Lauf (`node tests/abnahme/run.js`) führt dieses Szenario **nicht** aus. Beim Diagnose-Lauf werden alle Befunde als "bekannt (pausiertes Spiel)" geführt, der Lauf endet deshalb mit "ABNAHME BESTANDEN", die Befunde stehen trotzdem in der Ausgabe und in `befunde.json`. Zusätzlich schreibt er `diagnose-<bildschirm>.json` (Messwerte wie Rundenlänge, Größe von Spielfeld und Tasten).
- Screenshots: `tests/abnahme/runs/<Zeitstempel>/P-<spiel>-<bildschirm>-<Nr>-<Schritt>.png`. Die Nummer kann sich leicht verschieben, der Schrittname bleibt stabil. Der Ordner wird nicht eingecheckt, der Lauf erzeugt ihn neu.

Kein JavaScript-Fehler, kein seitliches Überstehen, kein abgeschnittener Text und keine verdeckte Bedienung wurden in einem der Spiele gefunden. Das Ergebnis-Speichern landete korrekt in der richtigen Bestenliste (`tower` bzw. `pacman`, Name, Punkte).

## Tower of Mut (Kategorie `tower`, 0.1)

Grundprinzip: Resse läuft von allein von Wand zu Wand, man springt über Stacheln, Lava, Sägen und Gegner, öffnet Truhen (dann klappt eine Leiter herunter) und klettert Etage für Etage (5 Etagen) bis zum Goldenen Tor. Tutorial plus 5 Level, 3 Herzen.

### Defekte und Auffälligkeiten

| # | Schwere | Befund | Wie reproduziert | Bild (Schrittname) |
|---|---|---|---|---|
| T1 | hoch (Bedienung) | **Keine Tastatursteuerung.** Die Anleitung nennt Leertaste, W und Pfeil hoch, im Code gibt es keinen Tastatur-Handler. Leertaste tut nichts (liegt der Fokus noch auf dem Pause-Knopf, pausiert sie sogar das Spiel). Nur Klick auf das Spielfeld oder auf den großen Knopf springt. | Desktop: Leertaste drücken, Resse springt nicht. | `tower-spiel-start` |
| T2 | hoch | **Kein sauberes Rundenende.** Es gibt keine Endkarte wie bei den fünf Portalspielen ("Nochmal spielen / Bestenliste / Menü"). Nach "Turm-Sturz" öffnet sich nach etwa 0,7 s der Ergebnis-Dialog, danach steht das Spiel mit Banner da. Die Sitzungsverwaltung kennt das Ende nur teilweise. | Bot verliert alle Herzen. | `tower-ende`, `tower-nach-ende` |
| T3 | hoch | **Falle nach dem Ende:** Springen oder Tippen auf das Spielfeld öffnet nach Game Over **erneut den Ergebnis-Dialog** statt eine neue Runde zu starten. Der einzige Weg zur neuen Runde ist der kleine Textlink "Neustart" (71x16 px am PC). | Nach Game Over springen/tippen. | `tower-springen-nach-ende` |
| T4 | mittel | Neustart und "Nochmal" haben **keinen Countdown** (3-2-1-Los), anders als bei allen Portalspielen. Die Runde beginnt sofort. | "Neustart" drücken. | `tower-neustart` |
| T5 | mittel | **"Punkte sichern"** speichert den Zwischenstand, aber das Spiel läuft hinter dem Dialog weiter. Die Sitzung gilt dann als beendet, d. h. Pause und Bestenliste-Pause greifen nicht mehr, während Resse noch Herzen verlieren kann. | Nach ein paar Punkten "Punkte sichern". | `tower-punkte-sichern` |
| T6 | mittel (Handy) | **Handy zeigt Tastatur-Anleitung** ("Leertaste", "W", "Klick", Knopftext "(Leertaste)"). Die Level-Knöpfe (Tutorial, Lvl 1-5) sind nur 27-29 px hoch (Ziel 44 px), sechs Stück direkt nebeneinander. | Handy 390: Spielansicht öffnen. | `tower-bereit`, `tower-spiel-start` |
| T7 | mittel (Handy) | Das Spielfeld schrumpft auf 326x214 px (Faktor 0,44). Banner und Schrift im Spielfeld ("LEVEL 4: ...", "TURM-STURZ!") werden dadurch kaum lesbar. | Handy 390. | `tower-mitten-im-spiel` |
| T8 | niedrig | Level-Direktwahl (Tutorial, Lvl 1-5) erlaubt, jederzeit zu springen. Der Punktestand bleibt dabei stehen. Man kann das höchste Level anwählen und die hohen Clear-Boni (bis 1500) einsammeln. Das ist ein Wertungs-Schlupfloch ("Gratis-Punkte-Trick", verletzt die Definition 1.0 im Masterplan). | Level 5 anwählen, Tor erreichen. Als Code gelesen, im Lauf nur Level-Wechsel gezeigt. | `tower-level-direktwahl` (nur wenn der Bot im Tutorial hängt) |
| T9 | niedrig | Der Pausenschutz und die Bestenliste im Spiel funktionieren (Zeit steht, "Weiter spielen" mit Countdown). Gut. Im Bereit-Dialog läuft das Spiel nicht schon hinter dem Dialog. | – | `tower-pause`, `tower-pause-mitten`, `tower-kopf-bestenliste` |

Die Reihenfolge "Bereit-Dialog, Countdown, Pause, Bestenliste im Spiel, Ergebnis speichern (Namensdialog), Zurück ins Menü" funktioniert bereits, weil das Spiel an die gemeinsame Sitzungsverwaltung angebunden ist. Es fehlen die Endkarte und der Restart-Ablauf.

### Handy-Tauglichkeit
Spielbar: ein großer Knopf (Sprung) und Tippen aufs Spielfeld. Der Roboter kam auf dem Handy bis Level 2-4. Das Prinzip (ein Knopf) passt gut zum Handy. Schwächen: T6 und T7 (Tastaturtexte, kleine Level-Knöpfe, kleine Schrift im Spielfeld). Unverändert fehlt ein echter Tastaturweg (T1) für den Desktop.

### Rundenlänge (typisch)
Ein Level dauert für den Roboter grob 20-40 Sekunden (auf dem Handy kam er in 90 Sekunden bis Level 4). Der Roboter verlor alle 3 Herzen nach 30 bis 90 Sekunden (je nach Lauf, er springt nur nach einer einfachen Regel). Ein Mensch, der alle sechs Stufen schafft, braucht geschätzt 3-6 Minuten, ein typischer Durchgang bis Game Over dürfte 1-3 Minuten dauern. Das ist **kürzer als die geplanten 5-10 Minuten** und liegt eher bei einem Quickie, sofern die Level leicht genug sind. Menschliche Zeiten sind **nicht gemessen** (siehe "Nicht prüfbar").

### Passung zum Thema Mut und zur Rolle
- Thema: mittel. Mut-Herzen, Mut-Leiter, Mut-Truhe, "Zweifel-Schleim" und Hörmann-Anspielungen (Stahlzarge, Sektionaltor) sind vorhanden. Der Mut-Gedanke ist aber nur Beiwerk, das Spiel selbst ist ein Auto-Runner. Die Anleitung nennt es offen eine "Kopie" des Spiels "Tower of Destiny" (Nutzer sollte entscheiden, ob das auf der Firmenseite so stehen soll).
- Rolle: Der Masterplan sieht "mittellang, 5-10 Minuten" vor. Aktuell eher kurz bis mittel. Es gibt Bestenliste (Punkte) und Fortschritt über 6 Level, das passt zu "mittellang".

### Aufwand und Risiko
- Version 0.2 (Defekte T1-T7 beheben, Ende-Karte, Countdown beim Neustart, Handy-Anleitung, größere Tasten, lesbare Schrift): **M**. Das Spiel ist technisch schon an die Sitzung angebunden, es fehlen vor allem Endkarte, Tastatur und Handy-Feinschliff. Risiko niedrig bis mittel (Spielfeld-Größe auf dem Handy erfordert Entwurfsentscheidung).
- Version 1.0 (Balance der sechs Level, Wertungs-Schlupfloch T8, Durchspielen durch einen Menschen): **M bis L**. Die Schwierigkeit ist **nicht testbar mit Robotern**. Es braucht mindestens einen Menschen, der alle Level spielt, und Anpassungen an den Zahlen.
- Bestenliste: Bei Änderung der Wertung (z. B. T8) laut Masterplan neue Liste `tower_v02`.

### Empfehlung: **nach Reparatur reaktivieren**
Begründung: Das Grundprinzip ist klar und funktioniert, die Mechanik läuft stabil (kein Fehler in der Konsole, Pause/Bestenliste/Speichern funktionieren). Es ist ein ein-Knopf-Spiel, das gut aufs Handy passt. Die Mängel sind überwiegend Anbindung und Feinschliff, keine Grundsatzprobleme.
Entscheidung beim Besitzer: (1) Soll das Spiel ein Quickie (kurz, leicht) oder ein Mittellang-Spiel (5-10 Minuten) werden? Davon hängt die Level-Balance ab. (2) Darf die Level-Direktwahl bleiben (dann ohne Punkte-Schlupfloch) oder fällt sie weg? (3) Soll "Kopie von Tower of Destiny" so in der Anleitung stehen bleiben?

## Hörmann Mut-Man (Kategorie `pacman`, 0.1)

Grundprinzip: Labyrinth mit 240 Mut-Punkten, 4 Zweifel-Geister, 4 goldene Power-Tore (Geister werden blau, dürfen gefressen werden), Seitentunnel, 3 Leben, mehrere Level.

### Defekte und Auffälligkeiten

| # | Schwere | Befund | Wie reproduziert | Bild (Schrittname) |
|---|---|---|---|---|
| M1 | hoch | **Kein sauberes Rundenende.** Beim Game Over kommt nur eine Kurzmeldung (Toast) und nach 0,7 s der Ergebnis-Dialog. Keine Endkarte ("Nochmal spielen / Bestenliste / Menü"). Übrig bleibt der kleine Link "Neustart" (71x16 px am PC). | Bot verliert alle Leben. | `pacman-ende`, `pacman-nach-ende` |
| M2 | mittel | "Neustart" hat **keinen Countdown** (wie bei den Portalspielen). | "Neustart" drücken. | `pacman-neustart` |
| M3 | mittel | **"Punkte sichern"** speichert, aber das Spiel läuft hinter dem Dialog weiter. Die Sitzung gilt als beendet (Pause greift nicht), die Geister jagen weiter. | Nach einigen Punkten "Punkte sichern". | `pacman-punkte-sichern` |
| M4 | hoch (Handy) | **Handy zeigt Tastatur-Anleitung** ("W A S D", "Pfeiltasten"). Die vier Pfeiltasten sind 46x42 px (unter dem 44-px-Ziel in der Höhe). Gesteuert wird nur mit Einzel-Tipps auf Pfeiltasten: Wer in einer Kurve zu spät tippt, verpasst die Abzweigung. Wischen als Steuerung gibt es nicht. | Handy 390: Spielansicht, Steuerung. | `pacman-bereit`, `pacman-spiel-start` |
| M5 | mittel (Laptop) | **Spielfeld und Steuerung passen nicht gleichzeitig ins Bild** auf dem Laptop (Spielfeld 726 px hoch, Fenster 720 px, Pfeiltasten bei 814-856 px). Beim Spielen muss man scrollen. Am Desktop (900 px hoch) passt es, auf kleinen Laptops nicht. | Laptop 1280x720. | `pacman-bereit` (Laptop) |
| M6 | niedrig (Handy) | Das Labyrinth wird auf 326x349 px verkleinert (ca. 11,6 px pro Kachel). Spielbar, aber eng; der Daumen verdeckt beim Tippen Teile. Meldung (Toast) beim Game Over überdeckt kurz den Seitenfuß. | Handy 390. | `pacman-mitten-im-spiel` |
| M7 | niedrig (Wertung) | Punkte steigen pro Level um den Bonus `1000 x Level`. Wertung ist prinzipiell fair, aber nicht balanciert getestet. Der Bot räumte Level 1 in etwa 60 Sekunden ab, erreichte also schon Level 2 (zeigt: Level 1 ist leicht, die Wegsuche gegen Geister reicht). | Bot-Lauf. | – |
| M8 | niedrig | Pause, Bereit-Dialog, Bestenliste im Spiel und Ergebnis-Speichern funktionieren (Zeit steht, Countdown nach Pause). Im Bereit-Dialog läuft nichts im Hintergrund. | – | `pacman-pause`, `pacman-pause-mitten`, `pacman-kopf-bestenliste` |

### Handy-Tauglichkeit
Spielbar, aber schwächer als Tower: Der Roboter spielte mit den Pfeiltasten auf dem Handy durchgehend, ein Mensch wird wegen des Timing-Drucks in den Kurven mit Tipp-Tasten ohne Wischen eher unzufrieden sein. Tastaturhinweise und zu kleine Tasten (M4).

### Rundenlänge (typisch)
Der Roboter verlor drei Leben nach 55 bis 78 Sekunden, ein Level hat er in etwa einer Minute geräumt. Ein Mensch braucht für ein Level geschätzt 2-4 Minuten, ein Durchgang bis Game Over liegt damit bei 3-8 Minuten. Das passt zur Rolle "Arcade, 5-10 Minuten". Menschliche Zeiten **nicht gemessen**.

### Passung zum Thema Mut und zur Rolle
- Thema: schwach bis mittel. Mut-Punkte, Zweifel-Geister und goldene Sektionaltore (Power) sind eine Umbenennung des bekannten Spielprinzips. Die Mut-Idee (Zweifel mutig überwinden) steckt in den Geister-Namen, aber nicht im Spielgefühl.
- **Rechtliches Risiko (Hinweis, keine Rechtsberatung):** Das Labyrinth ist erkennbar das des Original-Pac-Man, die Geister heißen wie dort (Blinky usw.), die Anleitung sagt "Pac-Man im Hörmann-Mut-Gewand". Für eine öffentlich erreichbare Firmenseite sollte der Besitzer das bewusst entscheiden.
- Rolle: Passt zu "Arcade 5-10 Minuten". Es ist aber kein Quickie.

### Aufwand und Risiko
- Version 0.2 (M1-M6: Endkarte, Neustart-Countdown, "Punkte sichern" korrekt, Handy-Anleitung entfernen, Tasten 44 px, Wischsteuerung, Laptop-Höhe): **M bis L**. Eine Wischsteuerung und ein kleineres/anderes Labyrinth für Handys sind echte Neuarbeit, die Pause-Anbindung ist vorhanden. Risiko mittel.
- Version 1.0 (Geister-KI und Schwierigkeit über mehrere Level ausbalancieren, Handy-Steuerung von Menschen testen lassen, ggf. eigenes Labyrinth/eigene Figuren wegen des Vorbilds): **L**. Balance und Rechtsrisiko sind mit Robotern nicht zu klären.

### Empfehlung: **umbauen oder einstellen, nicht einfach reaktivieren**
Begründung: Mechanisch läuft es stabil (keine Fehler, speichert korrekt, Pause funktioniert). Aber es ist ein sehr enger Pac-Man-Klon mit schwachem Mut-Bezug, der auf dem Handy mit Tipp-Tasten unbequem ist und für ein Reaktivieren auf 1.0 den größten Aufwand verursacht (L). Nach der Regel im Masterplan ("wird aus einem Spiel etwas ganz anderes, ist es ein neues Spiel") wäre ein Umbau mit eigenem Labyrinth, Wischsteuerung und echtem Mut-Bezug ohnehin ein neues Spiel.
Entscheidung beim Besitzer: (1) Soll die Pac-Man-Vorlage so auf der Firmenseite stehen? (2) Lohnt sich ein größeres Spiel neben Super Dennis und Lagermeister Nico? Bei "nein" streichen (inklusive Frage, ob das Bestenlisten-Archiv `pacman` bleibt, wie beim Mut-Automat). Bei "ja" erst Tower fertigstellen und Mut-Man danach als neues Spiel planen. Ich empfehle: **Tower zuerst, Mut-Man pausiert lassen und mittelfristig einstellen**, sofern kein klarer Wunsch nach einem Arcade-Spiel besteht.

## Nicht prüfbar / nicht getestet (ehrlich)

- **Spielgefühl, Balance, Schwierigkeit, Spaß.** Die Roboter spielen nur mechanisch. Die Rundenzeiten oben sind Roboter-Zeiten plus Schätzung, keine Messung an Menschen. Ob die sechs Tower-Level fair sind oder ob Mut-Man zu leicht oder zu schwer ist, weiß erst ein Mensch.
- **Echte Geräte** (Touch-Gefühl, Software-Tastatur, Safari, Notch). Der Lauf nutzt Chromium mit Touch-Emulation, kleines Handy 360x740 wurde in dieser Diagnose bewusst nicht gefahren (mit `ABNAHME_ALL_VP=1` zuschaltbar).
- **Ton, Animationen, Farben** und ob Emojis (Herzen, Leben) auf allen Geräten erscheinen. In der Testumgebung fehlten Emoji-Schriften, deshalb sind Herzen/Leben auf den Screenshots leer, das ist kein Spielfehler.
- **Tower nicht komplett durchgespielt:** Der Roboter erreichte höchstens Level 4 (Handy). Level 5, die Siegerkrone und der Bonus ("Turm komplett bezwungen") wurden nicht gesehen. Level 5 und der Sieg-Ablauf sind nur als Code gelesen. Genauso Mut-Man: Level 2 und höher, Früchte, Geisterfressen und Geister-KI wurden nicht gezielt geprüft.
- **Echte Cloud** (Firestore, Anmeldung): nur die Verdrahtung gegen eine Attrappe. Das Speichern erzeugte einen korrekt aufgebauten Eintrag (`cat`, `name`, `score`).
- **Wertungs-Schlupfloch T8** (Level-Direktwahl mit Punkte-Mitnahme) wurde im Code gelesen und der Level-Wechsel im Lauf gezeigt, ein Betrug über die Bestenliste wurde nicht nachgespielt.
- **Zufall:** Der Lauf nutzt ein festes Zufalls-Saatgut. Andere Zufallswerte (z. B. Obst in Mut-Man) wurden nicht variiert.
