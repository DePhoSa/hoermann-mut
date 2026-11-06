# Hörmann Mut-Portal & Mut-Spiele

Statisches Web-Portal (GitHub Pages) mit Mut-Sprüchen, Spielen, Bestenlisten und Live-Chat für eine kleine Gruppe (max. ca. 10 Personen).

Live: https://dephosa.github.io/hoermann-mut/

## Spiele (je eigene Bestenliste)

Stapler (Lagermeister Nico), Tower of Mut, Mut-Man, Super Dennis, Zweifel-Buster (0.2), Mut-Probe, Tor-Parcours. Bomber-Arena ist als „Coming soon“ vorgesehen.

## Aufbau

- `index.html`: Portal und alle Spiele
- `game-*.js`, `game-navigation.css`, `mut-effects.js`: Navigation, Session, Releases, Effekte
- `version.json`: aktuelle Version (löst das Update-Overlay aus)
- `tests/`: Node-/Playwright-Tests, Aufruf siehe `RELEASE-3.1.8.md`

## Bekannter Zustand (Stand Nov 2026)

Sync läuft über öffentliche Dienste (ntfy.sh, bytebin). Der Basis-Snapshot ist abgelaufen, die Cloud ist leer; Daten liegen nur in den Browsern. Geplant: Umstellung auf Firebase.
