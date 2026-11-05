# Tests

Alle Tests laufen ohne Netz und ohne echte Daten (externe Anfragen blockiert, Cloud als Attrappe).

```
node --test tests/*.test.cjs
node tests/cloud-sync-browser.cjs
node tests/portal-mobile-browser.cjs
node tests/portal-03-browser.cjs
node tests/v02-leaderboards-browser.cjs
node tests/chat-admin-browser.cjs
PLAYWRIGHT_CHANNEL=chromium node tests/game-session-browser.cjs
PLAYWRIGHT_CHANNEL=chromium node tests/mut-effects-browser.cjs
```

Ohne `PLAYWRIGHT_CHANNEL` verwenden die zwei letzten Tests den Browser Edge (`msedge`).
Der frühere Test `live-game-navigation.cjs` wurde entfernt: Er prüfte das alte Menü und wird von
`portal-03-browser.cjs` und `game-session-browser.cjs` abgedeckt.
