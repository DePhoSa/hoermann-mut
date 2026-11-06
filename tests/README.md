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

Alle Browser-Tests laufen mit Chromium. Mit `PLAYWRIGHT_CHANNEL=msedge` lassen sich die zwei Tests `game-session-browser` und `mut-effects-browser` auch mit Edge ausführen.
Der frühere Test `live-game-navigation.cjs` wurde entfernt: Er prüfte das alte Menü und wird von
`portal-03-browser.cjs` und `game-session-browser.cjs` abgedeckt.
