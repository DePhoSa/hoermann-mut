# Anonyme Spielstatistik (MVP)

Ziel: je Spiel erkennen, ob es verbessert, ersetzt oder eingestellt werden soll (siehe MASTERPLAN, "Spielstatistiken").

## Was gezählt wird (je Spiel und Tag, nie Namen)
| Feld | Bedeutung |
|---|---|
| rounds | gestartete Runden (ab "Los!", auch nach "Nochmal spielen") |
| finished | Runden, die ein Ende erreicht haben (`ended` / `finish` in game-session.js) |
| secs | Summe der Rundendauern in Sekunden (Pause und Countdown zählen nicht, je Runde max. 3600) |
| restarts | "Nochmal spielen" / Neu starten |
| aborts | Runde verlassen ohne Ende (Menü, anderes Spiel, Fenster zu / pagehide) |
| players | verschiedene Spieler an diesem Tag (anonyme Firebase-uid, über Marker-Dokument genau einmal gezählt) |

Bekannte Ungenauigkeit: Eine Runde, die ohne Punkte-Dialog endet (z. B. 0 Punkte in Stapler/Dennis/Buster), ruft kein `finish()` auf und zählt als Abbruch. Nerven und Parcours rufen `ended()` immer auf.

## Aufbau
- `js/core/05-stats.js`: reine Funktionen (Aggregation, Aufteilung, Kennzahlen, Hinweise; mit node testbar) und die Anbindung an `HoermannGameSession` (kleine Aufrufe `root.HoermannStats?.…` in `game-session.js`: `begin`, `pause`, `finish`, `abort` in `stop`, `restart`).
- `firebase-sync.js`: `statsAdd` (ein `setDoc(merge)` mit `increment()`), `statsPlayer` (Batch: Marker anlegen + `players` +1), `statsRead` (nur Admin).
- Dokumente: `stats/<YYYY-MM-DD>__<spiel>` (Vorschau unter /test/: `test_stats/...`), Marker: `stats/<tag>__<spiel>/players/<uid>` (nur Feld `ts`).
- Senden: gesammelt im Speicher, höchstens einmal pro ~60 s (Timer startet erst bei vorhandenen Zählern), zusätzlich bei `pagehide` (sofort) und beim Verbergen des Tabs (mindestens 15 s Abstand). Ohne Runde entsteht nichts und es wird nichts gesendet.
- Fehler (z. B. Regeln nicht veröffentlicht, offline): still verworfen, kein UI-Fehler. Nach 2 Fehlschlägen in Folge sendet die Sitzung nicht mehr (kein Wiederholungssturm). Der Marker wird je Tag/Spiel nur einmal versucht (Merker in localStorage).
- Admin-Ansicht: Reiter "Statistik" im Admin-Dialog, letzte 7 Tage, ein Lesevorgang (`where day >= …`) über die vorhandenen Dokumente.

## Kosten (Firebase Spark: 20 000 Schreibvorgänge/Tag, 50 000 Lesevorgänge/Tag)
Annahmen für den Schlimmstfall mit 10 Spielern: jeder spielt 8 Stunden am Tag ununterbrochen und löst jede Minute einen Flush aus, dabei in der Hälfte der Minuten für zwei Spiele (Wechsel).
- Zähler-Schreibvorgänge: 10 Spieler x 480 Minuten x 1 (bis 2) = 4 800 bis 9 600 pro Tag, also 24 bis 48 % des Tageskontingents. Zusätzlich je Spieler und Spiel einmal pro Tag ein Marker-Batch (2 Schreibvorgänge): 10 x 5 x 2 = 100. Gesamt Schreiben: höchstens etwa 9 700.
- Realistisch (10 Spieler x 30 Minuten): etwa 300 bis 400 Schreibvorgänge pro Tag.
- Lesen durch Regeln: nur beim Marker-Batch (`exists`/`existsAfter`, je 1 Lesevorgang): höchstens 100 pro Tag. Normale Zähler-Updates lösen keine Regel-Lesevorgänge aus.
- Lesen im Admin: höchstens 35 Dokumente pro Öffnen des Reiters (7 Tage x 5 Spiele, nur vorhandene werden gelesen). 20 Aufrufe pro Tag = 700 Lesevorgänge.
- Gesamt Lesen: unter 1 000 pro Tag (2 % des Kontingents). Es gibt keine Live-Listener auf `stats`.
- Speicher: 5 Dokumente pro Tag plus Marker, vernachlässigbar.

## Sicherheit (firebase/firestore.rules)
- Nur angemeldete Nutzer (auch anonym), nur die Sammlungen `stats`/`test_stats`.
- Zähler: Anlegen nur mit bekannten Feldern, Spiel aus fester Liste, Dokument-ID = `<tag>__<spiel>`; Ändern nur als Erhöhung der Felder rounds/finished/restarts/aborts (je <= 100), secs (<= 7200), players (<= 1) pro Schreibvorgang. `players` darf nur steigen, wenn im selben Schreibvorgang der eigene Marker neu angelegt wird (verhindert Aufblähen und Doppelzählung).
- Marker: nur der eigene (`pid == uid`), nur Feld `ts`, nur anlegen (kein Ändern/Löschen).
- Löschen: niemand. Lesen: nur Admins (`config/admins`).
- Restrisiko: Ein böswilliger Client kann pro Schreibvorgang bis zu den Obergrenzen erhöhen (Verfälschung der Statistik, aber kein Kostenrisiko über Spark hinaus und keine Daten Dritter).

## Datenschutz-Hinweis (im Änderungsverlauf, Klick auf die Version im Footer)
"Datenschutz: Anonyme Spielstatistik, keine Namen, nur Zähler (Runden, Spieldauer, Neustarts, Abbrüche je Spiel und Tag). Es werden keine Namen oder persönlichen Daten gespeichert, nur zufällige Geräte-Kennungen zum Zählen der Spieler. Einsehbar nur für die Admins."

## Tests
`tests/stats.test.cjs` (reine Funktionen, Regel-Grobprüfung), `tests/stats-browser.cjs` (Zähler, Flush, pagehide, nichts ohne Runde, stilles Scheitern, Admin-Reiter, Datenschutz-Hinweis; Cloud-Attrappe).
Die Regeln selbst wurden offline nur grob geprüft (Klammern, Funktionsnamen, Altregeln unverändert); die Firebase-Konsole meldet Syntaxfehler beim Veröffentlichen. Ein Emulator-Test steht aus.
