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

## Offene Fragen an den Nutzer
1. Stimmen die Spielrollen und Ziel-Versionen in der Tabelle? Was ändern?
2. Mut-Automat: behalten, umbauen oder streichen?
3. Tower of Mut und Mut-Man: nach 1.0 der anderen Spiele angehen, oder früher?
4. Wie groß soll ein "Maximum an Features" pro Spiel sein (z. B. ein Zusatzmodus)?
5. Soll es später einen Tages- oder Wochen-Wettbewerb über alle Quickies geben (Mehrkampf)?
