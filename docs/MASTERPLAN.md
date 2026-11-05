# Masterplan Hörmann Mut-Portal (Entwurf, vom Nutzer zu korrigieren)

## Leitidee
- **Thema ist Mut.** Spiele bleiben Mut-Spiele oder haben Mut-Bezug. Launige Ideen sind erlaubt, sie müssen nicht "richtig" sein.
- **Gegeneinander über die Bestenliste.** Jedes Spiel erzeugt Vergleich. Wertung muss fair und nachvollziehbar sein.
- **Übersichtlich.** Max. ca. 10 Nutzer, aufgeräumte Oberfläche, Handy-tauglich, nichts Überflüssiges.
- **Kein Kosten-Risiko.** Nur kostenlose Dienste (GitHub Pages, Firebase Spark). Vor jeder Ausnahme fragen.

## Spielrollen (Vorschlag)
| Spiel | Rolle | Dauer pro Runde | Stand | Ziel 1.0 |
|---|---|---|---|---|
| Die Mut-Probe | Quickie, am nächsten am Thema Mut | 1-3 min | 0.2 | nach Test sofort 1.0 |
| Tor-Parcours | Quickie, Reflex | 1-3 min | 0.2 | nach Test nahe 1.0 |
| Zweifel-Buster | Quickie, Klick/Reflex | 1-2 min | 0.2 | 0.3 = Feinschliff, dann 1.0 |
| Super Dennis | Mittellang, Jump'n'Run | 5-10 min | 0.2 | Level fair und durchspielbar, 1.0 |
| Lagermeister Nico | Größer, Richtung Simulation | 10-15 min | 0.2 | scharfe Schrift (HiDPI), Wertung austesten, 1.0 |
| Tower of Mut | Mittellang, pausiert | 5-10 min | pausiert | später prüfen |
| Mut-Man | Arcade, pausiert (Coming soon) | 5-10 min | pausiert | später prüfen |
| Mut-Automat | Glück, Mut-Bezug schwach, pausiert | 1-2 min | pausiert | Entscheidung nötig: behalten, umbauen, streichen |
| Bomber-Arena | Multiplayer, eigenes Projekt | 5 min | Platzhalter | braucht neues Backend, siehe Merkliste |

## Regeln der Update-Kette
1. **Jedes Spiel hat ein Ende der Kette.** Version **1.0** = fehlerfrei, Gameplay ok, Grundprinzip unverändert. Danach höchstens kleine, abgesprochene Features (bis ein Maximum, das wir pro Spiel festlegen).
2. **Grundprinzip bleibt.** Wird aus einem Spiel etwas ganz anderes, ist es ein **neues Spiel** und kein Update.
3. **Neue Spielidee statt Dauer-Umbau**, sobald sich aus einem Spiel eine eigene Idee ableitet.
4. **Neue Bestenliste pro Update**, wenn sich die Wertung ändert (Muster `<spiel>_v02`). 0.1-Rekorde bleiben einsehbar.
5. **Quickies bleiben kurz.** Wer nach ein paar Minuten keine Lust mehr hat, ist gewollt.

## Definition 1.0 (Checkliste pro Spiel)
- Keine bekannten Fehler (Softlocks, Steuerung, hängende Tasten).
- Handy und PC spielbar, Schrift lesbar.
- Wertung fair, ohne Gratis-Punkte-Tricks.
- Update-Hinweise vorhanden, Bestenliste getestet.
- Mindestens ein Mensch hat es durchgespielt (Nutzer-Ok).

## Arbeitsablauf
- Pro Spiel ein Branch `dev/<spiel>-<version>`. Agenten arbeiten parallel, ich integriere auf `dev/0.2-integration` (bzw. nächster Integrationsstand).
- Vorschau unter `/test/` (Branch `test`, getrennte Datenbank-Sammlungen `test_*`).
- **Jedes Update braucht das Ok des Nutzers**, bevor es nach `main` geht. Während der Nutzer prüft, planen und entwickeln wir die nächste Version.
- Der Nutzer gibt Feedback, ich darf es hinterfragen und Alternativen vorschlagen. Das letzte Wort hat der Nutzer.

## Portal-Versionen
- Portal-Version (z. B. 3.3.0) und Spiel-Version (z. B. 0.2) sind getrennt. Ein Changelog auf der Seite zeigt nur Überschriften.

## Entscheidungen des Nutzers (2026-11-05)
1. Spielrollen und Ziel-Versionen aus der Tabelle: bestätigt.
2. **Mut-Automat wird gestrichen** (Entfernung in der nächsten Welle nach Release 3.3.0, inklusive Bestenliste-Archiv-Frage).
3. **Tower of Mut und Mut-Man werden früher angegangen**, mit der nächsten Update-Welle.
4. Feature-Umfang pro Spiel: individuell festlegen und testen. Überladen ist schlecht.
5. **Mehrkampf/Wettbewerb über Quickies: ja**, später.

## Rhythmus und Ziele
- **Kurzfristig:** Spiele schnell auf 1.0 bringen (Mut-Probe, Tor-Parcours, Buster zuerst).
- **Danach Wochenrhythmus:** pro Woche ein Update-Paket, innerhalb der Woche nur kleine notwendige Fixes. Spiele werden so aufgefrischt, bis sie ersetzt oder eingestellt werden.
- **Dezember:** neues Motto der Seite, Planung erst danach.

## Spielstatistiken (später, für Analyse)
Ziel: erkennen, ob ein Spiel verbessert, erneuert, ersetzt oder eingestellt werden soll.
- Kennzahlen je Spiel: Anzahl Runden, Spieldauer pro Runde, Neustarts pro Sitzung, Abbruchzeitpunkt (Game over, Menü, Fenster zu), Punkteverteilung, Rückkehrer pro Woche.
- Umsetzung (Entwurf): kleine zusammengefasste Zähler pro Spiel und Tag in Firestore statt vieler Einzelereignisse, damit das kostenlose Kontingent (Spark) reicht. Keine Daten außer Gerät-ID und Spielname, nur intern einsehbar (Admin).
- Vor dem Bau klären: Datenschutz-Hinweis auf der Seite, Auswertung als Admin-Ansicht.

## Weiter offen
- Wie groß ist ein sinnvolles Feature-Maximum pro Spiel? Wird pro Spiel entschieden.
