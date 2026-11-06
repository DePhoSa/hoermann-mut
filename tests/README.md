# Tests

Alle Tests laufen ohne Netz und ohne echte Daten (externe Anfragen blockiert, Cloud als Attrappe).

**Vor jeder Übergabe an den Product Owner zusätzlich:** `node tests/abnahme/run.js` (Abnahme-Lauf wie ein Mensch, Desktop und Handy, mit Screenshots), siehe `docs/ABNAHME.md`.

```
node --test tests/*.test.cjs
node tests/cloud-sync-browser.cjs
node tests/portal-mobile-browser.cjs
node tests/portal-03-browser.cjs
node tests/v02-leaderboards-browser.cjs
node tests/chat-admin-browser.cjs
node tests/lb-in-game-browser.cjs
node tests/score-dialog-browser.cjs
node tests/game-session-browser.cjs
node tests/restart-browser.cjs
node tests/mut-effects-browser.cjs
node tests/abnahme/run.js
node tests/abnahme/selftest.js
```

`tests/version-consistency.test.cjs` (läuft mit `node --test`) prüft, dass jedes lokale `?v=` in `index.html` zu `version.json` passt.

Ausgemustert: `tests/split-equivalence.cjs` bewies, dass die Aufteilung in `js/core/*` und `js/games/*` nichts verändert hat: (1) die `js/`-Dateien hintereinander sind Byte für Byte der frühere Inline-Skript-Text, (2) globale Namen, `window`, DOM nach dem Laden, geworfene Ausnahmen und Seitenfehler sind vor/nach identisch (Vergleichsstand: Commit 2029791 = 3.4.0, per `BASE_REF=<commit>` änderbar). Siehe `docs/ARCHITEKTUR.md`.

Alle Browser-Tests laufen mit Chromium. Mit `PLAYWRIGHT_CHANNEL=msedge` lassen sich die zwei Tests `game-session-browser` und `mut-effects-browser` auch mit Edge ausführen.
Der frühere Test `live-game-navigation.cjs` wurde entfernt: Er prüfte das alte Menü und wird von
`portal-03-browser.cjs` und `game-session-browser.cjs` abgedeckt.

Begründung: Der Test verglich byte-genau gegen den Stand vor der Aufteilung (Commit 2029791). Mit dem Entfernen des Mut-Automaten ist dieser Vergleich absichtlich nicht mehr gleich; ein Anpassen hätte nur noch den Vergleich mit sich selbst geprüft. Die Aufteilung ist bewiesen und abgeschlossen. Den laufenden Schutz übernehmen `version-consistency.test.cjs` (jede Datei in `js/` eingebunden, `?v=` stimmt) und alle Browser-Tests/Abnahme-Läufe (fangen fehlende Funktionen als Seitenfehler). `cloud-sync-browser.cjs` prüft zusätzlich, dass Altdaten und Cloud-Einträge der Kategorie `slots` ignoriert werden, ohne Fehler und ohne die gespeicherten Daten zu ändern.
