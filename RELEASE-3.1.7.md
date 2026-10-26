# Live-Änderung 3.1.7

Erweiterung des noch unveröffentlichten Releases: einheitliche Spielkarten mit
gleicher Breite/Höhe, zwei Spalten am Desktop und einer auf Mobilgeräten.
Verfügbare Spiele ohne eigenen Rang zuerst, danach absteigend nach numerischem
Rang (z. B. 3 vor 2 vor 1). Gleiche Ränge behalten die feste Katalogreihenfolge.
Gesperrte/angekündigte Spiele folgen unabhängig von vorhandenen Rängen am Ende.
Sortiert wird der DOM, damit Tastatur- und Lesereihenfolge übereinstimmen.
Die jeweils aktuelle Spielwertung ist maßgeblich; Buster 0.1 bleibt separat.
Tower of Mut ist wie der Automat mit „Überarbeitung“ vorübergehend gesperrt;
seine Bestenliste bleibt erreichbar. Jetzt sind fünf Spiele aktiv, vier gesperrt.

Spiele: Pause mit P und Escape sowie sichtbarem Pause-Button. Eingabefelder
behalten ihre normale Tastaturbedienung. Beim Verlassen des Tabs pausiert eine
laufende Runde; Fortsetzen erfolgt ausdrücklich. Simulation und verwaltete
Spielverzögerungen bleiben stehen, Neustart/Verlassen entfernt alte Verzögerungen.

Aus dem Spielemenü beginnt eine Runde mit 3–2–1–Los (drei Sekunden, anschließend
350 ms Los-Anzeige). Ein direkter Neustart hat keinen Countdown. Aus der
Bestenliste erscheint das vorbereitete Spiel hinter einem kompakten modalen
„Jetzt spielen“-Fenster; Escape und Klick außerhalb starten oder schließen es
nicht. Gesperrte Spiele bleiben gesperrt.

Alle neun Spielkarten haben ein anklickbares Updatefenster. Ausgangsrelease ist
0.1, Zweifel-Buster ist 0.2. Bei einem vorhandenen eigenen Buster-Bestenlistenwert
öffnet sich vor dem nächsten Start das Update 0.2. Erst „Verstanden“ speichert die
Bestätigung pro lokalem Namen, Spiel und Version im aktuellen Browser. Löschen
des Browserspeichers oder ein anderer Browser kann den Hinweis erneut zeigen.
Bei Speicherfehlern bleibt eine verständliche Warnung mit ausdrücklicher
Fortsetzung. Keine zentrale Kontobestätigung wird behauptet.

## Zweifel-Buster 0.2 / Spielregelnversion 2

- Anfangs 15 % weniger neue Blasen: Wahrscheinlichkeit pro 60-Hz-Schritt 0,0425
  statt 0,05, linear über acht aktive Spielsekunden auf 0,05. Das entspricht vor
  der Begrenzung auf sechs gleichzeitige Blasen durchschnittlich 2,55 statt
  3 neuen Blasen pro Sekunde. Zufall und bestehende Blasenbegrenzung bleiben.
- Sichtbare Combo; je fünf aufeinanderfolgende Treffer +5 %, maximal +25 % bei
  25 Treffern. Normale Basis 35, Power-Basis 100; Ergebnis auf ganze Punkte gerundet.
- Fehlklick: minus 15 Punkte, Untergrenze null; Combo zurück auf null.
- Rundenzeit bleibt 30 aktive Spielsekunden, gekoppelt an die Simulationsuhr.
- Alte Kategorie `buster` bleibt unverändert lesbar. Neue Ergebnisse gehen an
  `buster_v02`, im selben bestehenden Masterbestand. Kein Kopieren oder Löschen
  alter Rekorde. Schalter in der Buster-Bestenliste wechselt zwischen 0.1 und 0.2.
  Rangband verwendet die neue Wertung. Alte Clients kennen die neue Kategorie
  nicht; Browser nach Veröffentlichung neu laden. Rückkehr zu 3.1.6 blendet 0.2
  aus und ist kein verlustfreier Schreib-Rollback; vorher private Sicherung.

Zentrale Regeln: `game-releases.js`; zentraler Sitzungsablauf: `game-session.js`.
Beide zusammen mit HTML, Navigation, Uhr, CSS und Versionsdatei ausliefern.
Die öffentliche Legacy-Synchronisierung wird nicht durch Firebase ersetzt.
Ihre bekannten Identitäts-/Parallelitätsgrenzen bestehen weiterhin.

## Isolierte Abnahme

`node --test tests/game-clock.test.cjs tests/game-releases.test.cjs`

Mit Playwright und Edge: `node tests/live-game-navigation.cjs` und
`node tests/game-session-browser.cjs`. Externe Verbindungen werden abgefangen.
Abgedeckt sind die fünf verbleibenden aktiven Spiele, Pause/Resume, eingefrorene Zeit/Blasen und
verzögerte Aktionen, Countdown, direkter Neustart, modale Vorschau, aktive
Updatebestätigung samt Neuladen, Combo/Fehlklick, Erhalt alter/neuer Kategorien,
vier gesperrte Spiele, einheitliche Kartengrößen, gemischte Ränge samt Sortierung
und Desktop/Mobil. Sieben Schleifen werden bei
30/60/120/144/240 Hz auf identische Simulationsschritte geprüft.

Keine produktiven Testnachrichten oder Testrekorde. Die vorbereiteten Konto-/
Firebase-Änderungen im Hauptarbeitsverzeichnis sind nicht Teil dieses Releases.
