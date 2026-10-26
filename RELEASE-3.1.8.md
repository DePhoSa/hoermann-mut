# Live-Änderung 3.1.8

- Bestehende Spielvorschau-Symbole wieder in allen neun Karten, bei weiterhin
  gleichen Kartengrößen und unveränderter Rangsortierung/Verfügbarkeit.
- Updatehinweise als lesbare Liste mit hervorgehobenen Themen, mehr Abstand und
  mobiler Dialogbreite. Bestehende aktive Bestätigungen werden weiterverwendet;
  kein erneuter 0.2-Pflichthinweis allein durch dieses Darstellungsupdate.
- Countdown im Spielfeld statt im Dialog. 3–2–1–Los, Dauer wie bisher. P/Escape
  hält auch den Countdown an. Fortsetzen zeigt denselben Reststand. Aus der
  Bestenliste bleibt „Jetzt spielen“ mit ausdrücklichem Start erhalten.
- Dekorative Mut-Effekte in `mut-effects.js`: gemeinsame zeitbasierte RAF-Schleife,
  maximal 50 ms Zeitschritt nach Aussetzern, begrenzte Partikel/Zeichenfläche,
  einmal gerasterte und wiederverwendete Emoji-Grafiken. Alle sieben Varianten
  geprüft, Rakete hat jetzt einen eigenen visuellen Ablauf. Wiederholte Klicks
  ersetzen den alten Effekt; alte Tor-/Herzanimationen laufen nicht weiter.
- Herzpuls bewegt den Button statt die gesamte große Hauptkarte um 18 % zu
  skalieren. Tor nutzt Transformanimation. Im Hintergrund/bei Navigation werden
  Effekte beendet. Reduzierte Bewegung verkürzt/begrenzt die Effekte.
- Rasche Spruchwechsel ersetzen den ausstehenden Spruchwechsel-Timer.

Keine Änderung der Spielphysik, 0.2-Wertung, Datenspeicherung, Namen, Konten oder
Bestenlistenverträge. Rückkehr auf 3.1.7 benötigt nur das vorherige Laufzeitpaket;
keine Datenmigration. HTML, neue Effektdatei, Session/Navigation/CSS und Version
gemeinsam veröffentlichen. Firebase-Vorbereitung bleibt getrennt.

## Abnahme

`node --test tests/game-clock.test.cjs tests/game-releases.test.cjs tests/mut-effects.test.cjs`

Mit Playwright/Edge: `node tests/game-session-browser.cjs`,
`node tests/live-game-navigation.cjs`, `node tests/mut-effects-browser.cjs`.
Alle externen Anfragen werden abgefangen. Keine produktiven Testdaten.

Neun Node-Tests: fünf Bildfrequenzen, Lebensdauer, Sprite-Wiederverwendung,
einziger RAF-Lauf, Abbruch, alle Effekte, reduzierte Bewegung und bisherige
Spielregeln. Browser: fünf aktive Spiele, Vorschauen, vier Sperren, Sortierung,
Updatebestätigung, mobile Darstellung, Countdown ohne Dialog samt Pause/Resume,
alte/neue Rekorde. Visuelle Kontrolle Desktop/Mobil.

Effektmessung im isolierten vollständigen Portal, 1360×900 und 390×844,
vierfache CPU-Drosselung: je Variante 150 Bildabstände nach abgeschlossenem
Viewportwechsel; p95 etwa 7,0–7,1 ms auf diesem Rechner. Das ist ein lokaler
Messbereich und keine Bildratenzusage für alle Firmen-PCs. Ein erster kurzer Lauf
direkt beim mobilen Größenwechsel enthielt Layoutaussetzer; der dokumentierte
Effektlauf wartet deshalb auf das Ende des Größenwechsels. Grenzwert im Test
34 ms. Netz-/Chat- und Fremdlast können weiterhin außerhalb dieses Nachweises
liegen. Arbeitsplatzprüfung bleibt offen.
