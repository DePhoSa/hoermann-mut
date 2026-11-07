# Architektur (für Nicht-Entwickler)

Die Seite ist weiterhin eine reine Website ohne Build-Schritt (GitHub Pages). Seit Version 0.5 der Code-Struktur steckt der Programmcode nicht mehr in einer einzigen 11.500 Zeilen langen `index.html`, sondern in einzelnen Dateien. Das Verhalten ist unverändert (damals per Äquivalenztest gegen den Stand 3.4.0 bewiesen; der Test wurde mit der Entfernung des Mut-Automaten ausgemustert, siehe `tests/README.md`).

## Ordner-Karte

| Datei | Inhalt |
|---|---|
| `index.html` | Seitenaufbau (HTML), das gesamte Aussehen (Stile, noch inline) und die Liste der Programmdateien |
| `js/core/01-ui-navigation.js` | Datum, Sound, Mut-Sprüche, Mut-Effekte, "Gib mir Mut", Ansichtswechsel (Portal/Spiele-Menü) |
| `js/core/02-leaderboard.js` | Bestenlisten und Punkte-Speicher |
| `js/core/03-cloud-hub.js` | Cloud-Anbindung (Bestenlisten, Ideen-Box, Zwangsupdate, `APP_VERSION`) |
| `js/core/04-chat-admin.js` | Live-Chat, Smileys, GIFs, Namensantrag, Admin |
| `js/core/05-stats.js` | Anonyme Spielstatistik (Zähler je Spiel/Tag), siehe `docs/STATISTIK.md` |
| `js/games/mario.js` | Super Dennis |
| `js/games/buster.js` | Zweifel-Buster |
| `js/games/nerve.js` | Die Mut-Probe |
| `js/games/parcours.js` | Tor-Parcours |
| `js/games/forklift.js` | Lagermeister Nico (Stapler) |
| `js/games/tower.js` | Tower of Mut |
| `js/games/pacman.js` | Mut-Man |
| `mut-effects.js`, `firebase-sync.js`, `game-releases.js`, `changelog.js`, `game-clock.js`, `game-session.js`, `game-navigation.js/.css` | bestehende gemeinsame Bausteine (unverändert, liegen im Hauptordner) |
| `version.json` | aktuelle Versionsnummer, daran erkennen offene Seiten ein Update |
| `tests/`, `docs/` | Tests und Dokumentation (werden nicht veröffentlicht) |

Ein Spiel ändern oder ersetzen: nur seine Datei in `js/games/` anfassen. Gemeinsames (Bestenliste, Cloud, Chat) steht in `js/core/` und wird von allen Spielen genutzt.

## Ladereihenfolge (wichtig)

Die Dateien sind normale Skripte (keine Module) und teilen sich einen gemeinsamen globalen Bereich, genau wie vorher das eine große Skript. Die Reihenfolge in `index.html` ist daher Teil des Programms:

`mut-effects.js` → `firebase-sync.js` → `game-releases.js` → `changelog.js` → `game-clock.js` → `game-navigation.css` → **`js/core/01…04`** → **`js/games/mario, buster, nerve, parcours, forklift, tower, pacman`** → `game-session.js` → `game-navigation.js`

Nicht umsortieren. Hintergrund: Eine Funktion ist nur innerhalb ihrer eigenen Datei "vorab bekannt". Code, der beim Laden sofort läuft, darf deshalb nur Dinge benutzen, die in der gleichen oder einer früheren Datei stehen. Aus diesem Grund sind Ansichtswechsel und Seitenkopf in `01-ui-navigation.js` zusammen geblieben. Ob alles passt, zeigen `node tests/version-consistency.test.cjs` (alle Dateien eingebunden, `?v=` stimmt) und die Browser-Tests.

## Neues Spiel hinzufügen

1. Neue Datei `js/games/<name>.js` anlegen (Start-Funktion, Spiellogik, spielspezifische Konstanten).
2. In `index.html` einen Eintrag `<script src="js/games/<name>.js?v=x.y.z"></script>` vor `game-session.js` ergänzen (Version wie in `version.json`).
3. Kachel/Ansicht in `index.html` ergänzen, Bestenliste in `js/core/02-leaderboard.js`, Release-Hinweise in `game-releases.js`, Eintrag in `game-session.js`/`game-navigation.js` wie bei den vorhandenen Spielen.
4. `node tests/version-consistency.test.cjs` und die Abnahme laufen lassen.

Neue Spiel-Version (Update-Kette): Datei des Spiels ändern, Bestenlisten-Muster `<spiel>_v02` beachten, siehe `docs/MASTERPLAN.md`.

## Version hochzählen (Cache-Busting)

Browser merken sich Dateien. Damit nach einem Update wirklich alles neu geladen wird, hängt an jeder Datei `?v=<Version>`. Beim Hochzählen müssen **alle** diese Stellen zusammen geändert werden:

1. `version.json` (`version` und `notes`)
2. `APP_VERSION` in `js/core/03-cloud-hub.js`
3. Sichtbarer Text "Version x.y.z" in `index.html` (Fußzeile)
4. Alle `?v=` an Skripten und Stilen in `index.html`, z. B.: `sed -i 's/?v=3.4.0/?v=3.5.0/g' index.html`
5. `node tests/version-consistency.test.cjs` muss grün sein (schlägt an, wenn ein `?v=` abweicht).

Ablauf des Zwangsupdates: Offene Seiten holen regelmäßig `version.json`. Ist sie neuer, lädt die Seite `index.html` neu (mit neuer Adresse `?v=…&t=…`). Die frische `index.html` verweist auf alle Dateien mit dem neuen `?v=`, dadurch werden auch die ausgelagerten Spiel-Dateien neu geholt. Die Vorab-Prüfung (`verifyAndPrefetchNewHtml`) liest dafür weiter nur `index.html` und sucht dort "Version x.y.z", `</html>` und eine Mindestgröße von 50.000 Zeichen. Deshalb bleibt der Stil-Block absichtlich in `index.html` (ohne ihn wäre die Datei zu klein, und das Update würde nie angezeigt). Der Test `version-consistency` überwacht das.

## Vorschau (`/test/`)

Der Workflow `.github/workflows/preview.yml` kopiert alles außer `tests`, `docs`, `firebase` und den `*.md`-Dateien. Die Ordner `js/` und `css/` werden also automatisch mitkopiert.

## Entfernte Spiele
- **Mut-Automat (`slots`)** ist gelöscht (Datei, Kachel, Ansicht, Tab, Kategorie). Gespeicherte Punkte in Firestore und `localStorage` (`hoermann_lb_slots`) bleiben unangetastet liegen, werden aber nicht mehr geladen oder angezeigt. Alle Schleifen laufen über `HoermannGameReleases.categories`; fremde Cloud-Einträge mit Kategorie `slots` fallen dadurch still weg.
