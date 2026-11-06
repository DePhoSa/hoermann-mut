# Abnahme vor jeder Übergabe an den Product Owner

## Regel (gilt ausnahmslos)

Bevor eine Version, ein Branch oder ein Fix dem Product Owner gemeldet wird:

1. `node tests/abnahme/run.js` ausführen. Der Lauf spielt das Portal wie ein Mensch durch (echte Klicks, Taps, Tasten) auf vier Bildschirmen: Desktop 1360x900, Laptop 1280x720 bei 1,5-facher Pixeldichte, Handy 390x844 und kleines Handy 360x740. Er muss mit `ABNAHME BESTANDEN` enden.
2. Alle Tests aus `tests/README.md` ausführen (`node --test tests/*.test.cjs` und die Browser-Tests). Alle müssen grün sein.
3. **Screenshots ansehen.** Der Lauf druckt den Ordner (`tests/abnahme/runs/<Zeitstempel>/`). Mindestens ansehen: Startseite, Spiele-Menü, je Spiel Bereit-Dialog, Countdown, Endkarte und Ergebnis-Dialog, Chat, jeweils Desktop **und** Handy. Automatische Prüfungen finden Fehler, aber nicht „sieht das gut aus und ist es verständlich?“.
4. Erst danach den Product Owner informieren. In der Meldung steht, was geprüft wurde (Lauf bestanden, Screenshots gesichtet) und was **nicht** prüfbar ist (siehe unten).

Wird ein Defekt gefunden, kommt zuerst ein Fix (oder ein bewusster Eintrag in `tests/abnahme/known-issues.json` mit Begründung), dann ein neuer Lauf. Es wird nie „trotzdem“ übergeben.

## Befehle

```
node tests/abnahme/run.js                          # alles, ca. 5 Minuten
node tests/abnahme/selftest.js                     # Prüft die Prüfungen selbst (10 s)
ABNAHME_ONLY=C ABNAHME_VP=phone390 node tests/abnahme/run.js   # Auswahl zum Entwickeln
```

`ABNAHME_ONLY`: A (Startseite, Admin), B (Spiele-Menü), C (fünf Spiele), D (Chat). `ABNAHME_VP`: `desktop`, `laptop15`, `phone390`, `phone360`.

## Was der Lauf abdeckt

- **A** Startseite, Footer, Versions-Dialog, versteckter Admin-Zugang (`#admin` und „Admin“ im Versions-Dialog); ohne Rechte bleibt er gesperrt, mit Attrappen-Admin entsperrt er.
- **B** Spiele-Menü: gleich hohe Kacheln je Reihe, pausierte Spiele grau und nicht anwählbar, Kopf-Bestenlisten.
- **C** Forklift, Mario, Buster, Mut-Probe, Tor-Parcours: Kachel, „Jetzt spielen“, Countdown 3-2-1-Los (Parcours: keiner), Pause im Countdown und Weiter (Countdown wieder bei 3), Spielen bis zu einem echten Ende (Roboter mit echten Eingaben), Endkarte mit genau einem „Nochmal spielen“, Nochmal, Kopf-Bestenliste im Spiel und Rückkehr über „Weiter spielen“, Namens-Dialog beim ersten Mal, automatisches Speichern bei bekanntem Namen, Kurzmeldung bei niedrigerem Ergebnis, Mut-Probe-Alarm mit Endkarte in unter 2,5 s.
- **D** Chat: öffnen, Ungelesen-Zähler, Nachricht senden, GIF-Fach, Smileys, auf dem Handy Eingabe und Senden bei eingeblendeter Tastatur.
- **E** nach **jedem** Schritt auf jedem Bildschirm: keine JavaScript-Fehler, kein Überstand zur Seite, Touch-Ziele mindestens 44 px, kein abgeschnittener Text (auch Platzhalter), kein Bedienelement von einem anderen verdeckt, nie zwei sichtbare Elemente mit gleichem Zweck (Neustart, Bestenliste, Menü; auch auf die Leinwand gezeichneter Text), keine zwei Overlays gleichzeitig.

Der Lauf nutzt einen lokalen Server, blockiert jede externe Anfrage und ersetzt die Cloud durch eine Attrappe. Es wird nie in die echte Firestore-Datenbank geschrieben. Zufall und Zeit werden nur festgelegt (festes Zufalls-Saatgut, `page.clock`), Spielzustand wird nicht gesetzt.

## Bekannte Lücken: was kein Lauf prüfen kann

- Echte Geräte (Touch-Gefühl, Software-Tastatur, Adressleiste, Notch, Browser-Eigenheiten von Safari). Der Lauf nutzt Chromium mit Touch-Emulation.
- Spielgefühl, Balance, Schwierigkeit, Tempo. Roboter spielen nur „irgendwie“ bis zum Ende.
- Ton, Animationsqualität, Lesbarkeit in praller Sonne, Farbwirkung.
- Echte Cloud (Firestore, Anmeldung mit Google). Nur die Verdrahtung gegen eine Attrappe.
- Verständlichkeit für neue Spieler. Dafür ist die Checkliste unten und ein Blick auf die Screenshots da.

## UX-Checkliste (beim Screenshot-Durchgang abhaken)

- **Klarheit:** Versteht jemand in drei Sekunden, was hier zu tun ist? Steht die wichtigste Aktion oben bzw. sofort sichtbar?
- **Überladung:** Mehr als etwa fünf Bedienelemente auf einem Bildschirm? Texte, die niemand liest (lange Erklärungen vor einem Eingabefeld)? Dann kürzen oder wegklappen.
- **Doppelte Texte und Knöpfe:** Gleiche Beschriftung oder gleicher Zweck zweimal sichtbar (z. B. zwei „Bestenliste“, „Neustart“ und „Nochmal spielen“, Überschrift und Knopf sagen dasselbe)?
- **Höchstens eine Hauptaktion je Bildschirm:** Genau ein auffälliger (orangefarbener) Hauptknopf. Alles andere ist sichtbar zweitrangig.
- **Einheitliche Knöpfe:** Gleiche Aufgabe, gleiche Beschriftung, gleiche Form, gleiche Stelle in allen Spielen.
- **Handy:** Daumenreichweite, nichts unter dem Chat-Knopf versteckt, Tastaturhinweise („P / Esc“, „Leertaste“) nur wo es eine Tastatur gibt.
- **Zustände:** Nach Niederlage, Sieg, Pause, Abbruch: ist immer klar, wie es weitergeht (ein Weg, nicht drei)?
- **Overlays:** Liegt nie ein Fenster über einem anderen, und ist hinter einem Fenster nichts, was man für bedienbar hält?
