# Live-Änderung 3.1.6

Veröffentlicht werden ausschließlich die Änderungen an Spielemenü, Navigation,
Verfügbarkeit und der gemeinsamen Simulationsuhr. Firebase-/Kontoumbau und
Datenmigration aus der laufenden Entwicklung sind nicht Bestandteil dieses Releases.

- Bomber-Arena und Mut-Man: Coming soon. Automat: Überarbeitung.
  Bisherige Highscores bleiben sichtbar. Direkter Bomber-Aufruf startet kein Spiel.
- Diagonale Rang-Schaltflächen öffnen die jeweilige Bestenliste. Gold/Silber/Bronze
  für die ersten drei Plätze, neutral ohne eigenen Rang. Grundlage bleibt die
  vorhandene Legacy-Bestenliste und der lokal gespeicherte Spielername.
- Aus der Bestenliste direkt zur Spielvorschau. Start ausschließlich durch
  „Jetzt spielen“. Verfügbarkeitsregeln zentral in game-navigation.js.
- Vorhandene per-Frame-Physik jetzt über gemeinsame 60-Hz-Simulationsuhr.
  Keine Änderung von Geschwindigkeits-/Punkte-/Spielkonstanten. Alle sieben
  Animationsschleifen verwenden dieselbe Uhr. Lange Pausen werden nicht nachgeholt.
- Künftige Appupdates verwenden normale Navigation anstelle document.write,
  damit alte JavaScript-Schleifen nicht im bestehenden Kontext weiterleben.

Prüfung: Node 22+, `node --test tests/game-clock.test.cjs`; mit vorhandenem
Playwright/Edge `node tests/live-game-navigation.cjs`. Alle externen Verbindungen
werden dort lokal abgefangen, keine produktiven Nachrichten/Spielstände erzeugt.
Nachweis: identische Simulationsschritte bei 30/60/120/144/240 Hz, sieben eingebundene
Schleifen, Pausen, Neustart, Rang-/Kein-Rang, gesperrte Spiele, direkte Navigation,
expliziter Start, Desktop/Mobil, keine abgeschnittenen Karteninhalte.

Grenzen: Das bestehende öffentliche Legacy-Backend und seine bekannten
Identitäts-/Sicherheitsprobleme sind damit nicht ersetzt. Kein Gesamtnachweis
auf allen Firmen-PCs. Nach Veröffentlichung alte offene Seiten einmal normal
neu laden, damit die alte Aktualisierungslogik verlassen wird.

index.html, version.json, game-clock.js, game-navigation.js und
 game-navigation.css gemeinsam ausliefern. App-Version und Asset-Queries: 3.1.6.
Keine Datenmigration, kein Löschen von Nutzerbeständen. Bei Code-Rücknahme
Release-Dateien gemeinsam zurücknehmen; Spielstände nicht zurücksetzen.
