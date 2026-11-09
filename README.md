# Hörmann Mut-Portal & Mut-Spiele

**Schwerpunkt PC:** Entwicklung und Abnahme richten sich dauerhaft nach der PC-Umsetzung (Desktop/Laptop). Die Spiele bleiben auf dem Handy spielbar, mobile Darstellung ist aber nicht mehr Schwerpunkt; dafür gibt es keine aufwendigen Handy-Tests mehr (Abnahme-Standard: `ABNAHME_VP=desktop,laptop15`).


Statisches Web-Portal (GitHub Pages) mit Mut-Sprüchen, Spielen, Bestenlisten und Live-Chat für eine kleine Gruppe (max. ca. 10 Personen).

Live: https://dephosa.github.io/hoermann-mut/

## Spiele (je eigene Bestenliste)

Stapler (Lagermeister Nico), Tower of Mut, Mut-Man, Super Dennis, Zweifel-Buster (0.2), Mut-Probe, Tor-Parcours. Bomber-Arena (Online-Multiplayer, 2–4 Spieler) ist unter „Multiplayerspiele“ spielbar; die übrigen Spiele stehen unter „Solospiele“.

## Aufbau

- `index.html`: Portal und alle Spiele
- `game-*.js`, `game-navigation.css`, `mut-effects.js`: Navigation, Session, Releases, Effekte
- `version.json`: aktuelle Version (löst das Update-Overlay aus)
- `tests/`: Node-/Playwright-Tests, Aufruf siehe `RELEASE-3.1.8.md`

## Bekannter Zustand (Stand Nov 2026)

Sync läuft über öffentliche Dienste (ntfy.sh, bytebin). Der Basis-Snapshot ist abgelaufen, die Cloud ist leer; Daten liegen nur in den Browsern. Geplant: Umstellung auf Firebase.
