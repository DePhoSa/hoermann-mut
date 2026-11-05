# Release 3.3.0: Update 0.2 (Stapler, Super Dennis, Mut-Probe, Tor-Parcours) + Portal

- Vier Spiele auf Update 0.2 mit eigenen Bestenlisten (`forklift_v02`, `mario_v02`, `nerve_v02`, `parcours_v02`). 0.1-Rekorde bleiben erhalten und einsehbar.
- Details je Spiel: siehe Update-Hinweise in `game-releases.js`.
- Portal: Chat hinter Knopf mit Ungelesen-Zähler (Vollbild auf dem Handy), aufgeräumte Spielkarten ("Update 0.x" in der Spielansicht), Admin als eigener Dialog, größere Touch-Ziele, ruhigerer Chat, Barrierefreiheit.
- Neue localStorage-Taste: `hoermann_chat_seen_ts`. Bestehende Schlüssel unverändert.

## Rückkehr auf 3.2.0
Vorheriges Laufzeitpaket veröffentlichen. 0.2-Ergebnisse bleiben in Firestore, werden dann aber nicht angezeigt.

## Abnahme
`node --test tests/game-clock.test.cjs tests/game-releases.test.cjs tests/mut-effects.test.cjs`
`node tests/cloud-sync-browser.cjs`, `portal-mobile-browser.cjs`, `v02-leaderboards-browser.cjs`, `chat-admin-browser.cjs` (Attrappe, kein Netz).
Nicht von Menschen geprüft: Spielgefühl und Balance, echte Handy-Tastatur.
