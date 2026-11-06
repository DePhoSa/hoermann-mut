# Abnahme-Bericht (UX-Durchgang mit der neuen Abnahme-Suite)

Grundlage: `node tests/abnahme/run.js` auf Desktop 1360x900, Laptop 1280x720 bei 1,5-facher Pixeldichte, Handy 390x844 und kleinem Handy 360x740. Screenshot-Namen verweisen auf den jeweiligen Lauf-Ordner (`tests/abnahme/runs/<Zeitstempel>/`, nicht im Repo). Stand: Branch `dev/abnahme-0.4`.

## Gefunden und behoben (je ein eigener Commit)

| Prio | Befund | Bild (vor dem Fix) | Fix |
|---|---|---|---|
| Hoch | **Mut-Probe auf dem Handy unspielbar:** die drei Tore waren nur 24 px hoch (Text abgeschnitten, Tippfläche winzig). | `C-nerve-phone390-06-nerve-spielfeld` | Tore bekommen auf dem Handy feste Höhe 120 px (`game-navigation.css`). |
| Hoch | **Tor-Parcours zeigte beim ersten Start noch den 3-2-1-Countdown**, obwohl das Spiel einen eigenen „Tippen zum Starten“-Zustand hat (nur der Neustart war ohne Countdown). | `C-parcours-desktop-02-parcours-bereit` | „Jetzt spielen“ startet Parcours direkt im Wartezustand (`game-session.js`). |
| Mittel | **Zwei sichtbare „Bestenliste“-Knöpfe** (Endkarte und Ergebnis-Dialog) für denselben Zweck. | `C-mario-desktop-06-mario-ende1-endkarte` | Endkarte blendet ihren Bestenlisten-Knopf aus, solange der Ergebnis-Dialog offen ist. |
| Mittel | **Chat deckte auf Desktop die Kopfzeile ab** (Bestenlisten, Ton, Zurücksetzen nicht erreichbar, „Bestenlisten“ halb abgeschnitten). | `D-desktop-03-chat-offen` | Seite rückt bei offenem Chat nach links; der Chat-Knopf liegt dann hinter dem Panel und wird ausgeblendet. |
| Mittel | **Handy-Kopfzeile:** „WOCHE 45 - ...“ abgeschnitten. | `A-phone390-01-startseite` | Text darf umbrechen. |
| Niedrig | Chat-Fächer auf dem Handy: Schließen-Kreuz 23 px breit, Emoji-Tasten 43 px, Platzhaltertexte abgeschnitten („Nachricht, Emoji oder GIF-Link (E…“). | `D-phone360-08-smileys`, `D-phone390-03-chat-offen` | Mindestgröße 44 px, kürzere Platzhalter auf dem Handy. |
| Niedrig | „Pause · P / Esc“ auf Touch-Geräten (kein P, keine Esc-Taste). | `C-mario-phone390-02-mario-bereit` | Auf Touch nur „Pause“. |
| – | `tests/restart-browser.cjs` erwartete für Parcours einen Countdown. | – | Test angepasst (Parcours: sofort Spielzustand, kein Countdown). |

Als in Ordnung bestätigt (die Suite prüft es jetzt bei jedem Lauf): Mut-Probe zeigt die Endkarte nach verlorenem Tor innerhalb 2,5 s (`C-nerve-*-24-nerve-alarm-endkarte`); Tor-Parcours hat keine „NOCHMAL“-Taste mehr auf der Leinwand (die Suite überwacht alle auf Leinwände gezeichneten Texte); Admin-Eingang über `#admin` und über den Link im Versions-Dialog; ohne Rechte bleibt der Admin-Bereich gesperrt, mit Attrappen-Admin entsperrt er (`A-*-admin-*`); pausierte Spiele sind grau und nicht anwählbar; Kacheln pro Reihe gleich hoch.

## Offen, nach Priorität (mit Empfehlung)

1. **Hoch – Ergebnis-Dialog beim ersten Speichern ist überladen und verdrängt die Endkarte (Handy und Desktop).** Nach dem Spielende springt die Seite zum Dialog; das Spielfeld mit der Endkarte und „Nochmal spielen“ liegt außerhalb des Bildes (Desktop: `C-forklift-desktop-07-forklift-ende1-endkarte`). Der Dialog zeigt vor dem Namensfeld eine lange Ideen-Ticket-Box („Mega-Leistung … darfst du eine oder mehrere Ideen …“) mit Textfeld, dessen Platzhalter abgeschnitten ist. Bilder: `C-buster-phone390-06-buster-ende1-endkarte`, `C-forklift-phone390-08-forklift-ergebnis-dialog`. Empfehlung: erst Name und „Speichern“ zeigen, die Idee erst danach anbieten (eingeklappt); Dialog nicht unter dem Spiel, sondern als Overlay über der Endkarte.
2. **Mittel – Bestenliste mitten im Spiel hat zwei Hauptaktionen und fünf Bedienelemente vor den Daten:** „Online-Abgleich“, „Schließen“, großes orangefarbenes „Zum Spiel: …“, „Bisherige Bestenliste 0.1 ansehen“, acht Reiter. „Zum Spiel“ und „Schließen“ tun praktisch dasselbe. Bild: `C-mario-phone390-10-mario-kopf-bestenliste-im-spiel`. Empfehlung: ein Knopf („Weiter spielen“), 0.1-Link und Online-Abgleich in ein Menü, Reiter nur für die Spiele mit Einträgen.
3. **Mittel – Nach automatischem Speichern (bekannter Name) öffnet sich die ganze Bestenliste über der Endkarte.** Der Spieler sieht erst nach „Schließen“ wieder „Nochmal spielen“. Bild: `C-nerve-desktop-15-nerve-auto-gespeichert`. Empfehlung: Mitteilung („Neuer Rekord, Platz 1“) auf der Endkarte statt Vollbild-Liste; Liste nur auf Wunsch.
4. **Niedrig – Spiele-Menü wiederholt sich:** auf jeder Kachel „Noch kein Rang“ und „Neu in Update 0.2 – lesen ›“. Bild: `B-laptop15-01-menue`. Empfehlung: ein gemeinsamer Hinweis oben, Rang nur zeigen, wenn vorhanden.
5. **Niedrig – Mut-Probe, Endkarte auf dem Handy:** Die Überschrift darüber („Neuer Versuch?“) und der Knopf „Nochmal spielen“ sagen dasselbe; Tore schimmern am Rand der Karte durch. Bild: `C-nerve-phone390-24-nerve-alarm-endkarte`. Empfehlung: Überschrift nach dem Ende ausblenden, Karte deckend.
6. **Niedrig – Handy zeigt Tastatur-Anleitungen** („Leertaste / ▲ Springen“, „Steuerung: Leertaste“). Empfehlung: auf Touch durch „Tippen“ ersetzen.
7. **Niedrig – Bestenlisten-Reiter auf dem Handy** laufen rechts aus dem Bild (nur wischbar, ohne Hinweis). Bild: `B-phone390-04-kopf-bestenlisten`. Empfehlung: Auslaufkante/Pfeil oder zwei Zeilen.
8. **Niedrig – Chat-Knopf unten rechts** verdeckt auf dem Handy teils Inhalt (z. B. Rand der „Spielen“-Knöpfe, `B-phone390-01-menue`). Die Suite prüft nur den Mittelpunkt eines Elements, solche Randverdeckung meldet sie nicht. Empfehlung: unten Abstand lassen (Platz für den Knopf).
9. **Hinweis (kein Fehler der Seite):** Der Chat zeigt Altnachrichten mit kaputten GIF-Bildern. In der Abnahme sind externe Adressen blockiert, daher fehlen die Bilder dort zwangsläufig.

## Was die Suite nicht sieht

Echte Geräte und Software-Tastatur (nur über kleinere Fensterhöhe nachgestellt), Spielgefühl und Balance, Ton, Farbwirkung, echte Cloud. Siehe `docs/ABNAHME.md`.
