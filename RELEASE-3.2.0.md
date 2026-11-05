# Release 3.2.0: neue Cloud (Firebase)

- Bestenlisten, Chat, Ideen und Namensanträge liegen in Firebase Firestore statt in ntfy/bytebin.
  Daten bleiben dauerhaft erhalten, es gibt keinen Ablauf mehr.
- Bestenliste: Der Name gehört dem Ersteller (serverseitig geprüft), nur er kann den Wert erhöhen, nie senken.
- Admin-Rechte kommen aus `config/admins` (Firestore), nicht mehr aus einem Hash im Quelltext.
- Wegfall: ntfy, bytebin, 3,5-s-Polling, 25-s-Vollabgleich. Eine Live-Verbindung statt vieler Abfragen.
- Migration: Beim ersten Öffnen schickt jeder Browser seine eigenen Bestwerte unter seinem festen Namen in die Cloud.
- Spielphysik, Wertung, Namen und Oberfläche unverändert.

## Rückkehr auf 3.1.8
Altes Laufzeitpaket veröffentlichen. Die alte Cloud (ntfy/bytebin) ist leer, daher bleiben nur lokale Browserdaten.

## Abnahme
`node --test tests/game-clock.test.cjs tests/game-releases.test.cjs tests/mut-effects.test.cjs`
`node tests/cloud-sync-browser.cjs` (Attrappe, kein Netz). Echtlauf gegen Firebase am 2026-11-05: Anmeldung, Lesen, Score, Chat ok, Admin-Aktion ohne Recht abgelehnt.

## Offen
Admin-Eintrag `config/admins`, Mehrgeräte- und echter Handytest, feste Admin-Anmeldung.
