# Release 3.5.0 (Welle 2)

- Lagermeister Nico 0.3: scharfes Spielfeld (höhere Auflösung), größere Schrift am Handy, Zwei-Daumen-Steuerung behoben.
- Die Mut-Probe 0.9 (Release-Kandidat): Endleiste unter den Toren, kürzere Texte, ruhigerer Ton, optional Mut-Spruch (`NERVE_QUOTE`).
- Tor-Parcours 0.9 (Release-Kandidat): ausgewogener Einstieg (Daten in docs/BALANCE-PARCOURS.md), Absturz-Feedback, Vibration, Neustart-Sperre.
- Zweifel-Buster 0.3: größere Trefferflächen, Zeitleiste, Combo-Anzeige.
- Hörmann Mut-Automat entfernt (gespeicherte Rekorde bleiben unangetastet).
- Anonyme Spielstatistik mit Admin-Reiter (Regeln in firebase/firestore.rules müssen in der Konsole veröffentlicht werden, siehe docs/STATISTIK.md).
- Wertungen unverändert: Bestenlisten bleiben `<spiel>_v02`.
- Tower/Mut-Man bleiben pausiert, Diagnose in docs/DIAGNOSE-TOWER-PACMAN.md.

## Rückkehr auf 3.4.0
Vorheriges Laufzeitpaket veröffentlichen. Statistik-Zähler in Firestore bleiben bestehen und sind harmlos.

## Offen
Regeln für die Statistik veröffentlichen, Google-Anmeldung einrichten (docs/ADMIN.md), Spielgefühl und echte Geräte.
