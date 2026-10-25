# Online-Ausgabe

Die veröffentlichte Browser-Ausgabe ist `bomber-arena.html`. Sie bündelt die unten beschriebenen Browser-Module und PeerJS lokal in einer HTML-Datei. Die Quellen und der optionale Server liegen im lokalen Komplettpaket.

## Lizenz der eingebundenen PeerJS-Bibliothek

Copyright (c) 2015 Michelle Bu and Eric Zhang, http://peerjs.com

(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


---

# Bomber-Arena für das Hörmann Mut-Portal

Eigenständige Browser-Nachbildung einer klassischen Bomber-Arena für **2–4 Personen**, kein offizieller R2-Port. Keine Installation des Originalspiels erforderlich. Eigene Canvas-Grafiken und synthetisch erzeugte Sounds; keine exportierten Originalgrafiken oder Originalmusik enthalten.

## Auf GitHub Pages spielen

Für die gebündelte Online-Ausgabe `bomber-arena.html` und diese Anleitung in das Stammverzeichnis übernehmen. Die modulare Entwicklungsfassung im Komplettpaket liegt weiterhin im Ordner `bomber-arena`. Danach ist die Arena unter `https://dephosa.github.io/hoermann-mut/bomber-arena.html` erreichbar, sobald GitHub Pages die Änderung veröffentlicht hat. Das ist die vorgesehene Zieladresse, keine Bestätigung einer bereits erfolgten Veröffentlichung.

1. Namen eingeben und einen offenen Spielraum auswählen oder „Eigenen Raum erstellen“ auswählen.
2. Andere Spieler sehen den Raum automatisch in der Lobby und wählen „Beitreten“. Alternativ kannst du einen Einladungslink weitergeben; der Raumcode bleibt optional aufklappbar.
3. Alle wählen „Ich bin bereit“. Der Gastgeber startet das Match.
4. WASD oder Pfeiltasten bewegen, Leertaste legt eine Bombe. Auf Touch-Geräten gibt es Bildschirmtasten.
5. Drei Rundensiege gewinnen das Match. Danach können alle eine Revanche starten.

Ein alleiniger Spieler kann weder Runde noch Match starten. Es gibt keine Bots, kein Training und keinen Singleplayer. Während einer laufenden Runde ist kein später Beitritt vorgesehen. Bei Ausscheiden bleibt man Zuschauer bis zur nächsten Runde. Verlässt ein Spieler den Raum, scheidet er aus; bei weniger als zwei verbundenen Spielern wird das Match abgebrochen.

## Gemeinsame Lobby mit Firebase

Projekt `bomberman-a6456`, Realtime Database in Belgien (`europe-west1`), kostenloser Spark-Tarif. Firebase speichert nur Gastgebername, Raumkennung, Spieleranzahl, Status, Versionsnummer und Aktualisierungszeit. Die Spielsimulation läuft weiterhin über WebRTC. Analytics, Firestore, Storage, Cloud Functions und kostenpflichtiges Hosting werden von dieser Erweiterung nicht verwendet.

Die Browser melden sich automatisch als anonyme Gäste an; die Spieler brauchen kein Konto und keine Anmeldedaten. Pro Browser-Tab wird eine eigene temporäre Identität verwendet. Der Gastgebername ist in der Raumliste sichtbar. Es gibt keine dauerhafte Spieler- oder Ergebnisdatenbank in dieser Erweiterung.

Die Regeln in `database.rules.json` erlauben nur dem Eigentümer des Raumeintrags dessen Änderung und Löschung. Sie begrenzen Schema, Felder, Werte und Listenabfragen. Abgerufen werden höchstens 30 zuletzt aktualisierte Räume, ungültige oder mehr als 75 Sekunden alte Einträge werden nicht angezeigt. Gastgeber aktualisieren ihren Eintrag bei Änderungen und etwa alle 20 Sekunden. Beim Verlassen wird der Eintrag entfernt; `onDisconnect` sorgt zusätzlich für serverseitige Bereinigung bei Verbindungsverlust.

Laufende Matches und volle Räume bleiben sichtbar, ihre Beitreten-Schaltfläche ist gesperrt. Bei Ausfall der Raumliste sind Einladungslink und Raumcode weiterhin nutzbar. Eigene Relay-Räume werden nicht im öffentlichen Verzeichnis eingetragen.

Zum Einrichtungszeitpunkt umfasst Spark für Realtime Database 100 gleichzeitige Verbindungen, 1 GB Speicher und 10 GB Downloads pro Monat. Es wurde kein Abrechnungskonto verknüpft und kein Blaze-Upgrade ausgeführt. Die Begrenzungen gelten für das gesamte Projekt. Quelle: https://firebase.google.com/pricing

Browser-SDK: Firebase 13.1.0, bedarfsgerecht vom offiziellen Google-CDN geladen. Die Web-Konfiguration im Quelltext ist öffentliche Client-Konfiguration; sie ist kein Admin-Zugang. Der tatsächliche Datenzugriff wird durch anonyme Authentifizierung und die Datenbankregeln begrenzt. Firebase und die Vermittlungsdienste erhalten verbindungsbedingte Netzwerkdaten.

## Kostenloser Standardmodus: WebRTC

Die statische Seite nutzt die lokal mitgelieferte MIT-Bibliothek PeerJS 1.5.5 und den kostenlosen öffentlichen PeerJS-Vermittlungsdienst. Der Gastgeber-Browser berechnet den Spielzustand, die anderen Browser schicken ausschließlich Eingaben. Maximal drei direkte Datenkanäle. Der Gastgeber sollte den Tab im Vordergrund und den PC wach halten. Es gibt keine Host-Migration im Direktmodus: Schließt er den Tab, muss ein neuer Raum erstellt werden. Unterbrechungen erfordern erneutes Beitreten; während laufender Runden ist das erst nach Matchabbruch oder Matchende möglich.

**Kosten-/Verfügbarkeitsgrenze:** Es werden keine Zahlungsdaten, Abos oder kostenpflichtigen APIs eingerichtet. Der kostenlose öffentliche Vermittlungsdienst hat keine hier zugesicherte Verfügbarkeit. STUN-Anfragen an Google und Cloudflare helfen bei der Verbindung. Manche Router, VPNs und Firmennetze verhindern direkte Verbindungen. Ein TURN-Relay ist **nicht** enthalten. PeerJS bietet kein kostenloses TURN mehr an. Deshalb ist Verbindung über beliebige Netzwerke im kostenlosen Direktmodus nicht garantiert.

Quellen, geprüft am 25.10.2026:
- https://peerjs.com/client/faq
- https://peerjs.com/server/cloud
- https://github.com/orgs/peers/discussions/1172
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Ausweichlösung: eigener kostenloser Relay-Server

Node.js 22 oder neuer und npm oder pnpm erforderlich. Aus diesem Ordner:

```powershell
npm install
npm test
npm start
```

Alternativ `pnpm install`, `pnpm test`, `pnpm start`. Die einzige Server-Abhängigkeit ist `ws` (MIT, Version im Lockfile festgehalten).

Öffnen: http://127.0.0.1:8787/ . Unter „Verbindungsoptionen“ für **alle** Spieler `ws://127.0.0.1:8787/relay` eintragen, wenn alle Testbrowser auf demselben PC laufen.

Für andere PCs im selben lokalen Netz:

```powershell
$env:HOST='0.0.0.0'
node server.mjs
```

Sie öffnen `http://DEINE-LAN-IP:8787/` und verwenden `ws://DEINE-LAN-IP:8787/relay`. Der Betrieb auf anderen PCs und die Windows-Firewall müssen separat geprüft werden. Der Standard bindet absichtlich nur an Loopback; es wird keine Firewall-Einstellung automatisch verändert.

Für Internet-Spiel über die HTTPS-Webseite ist ein öffentlich erreichbarer **wss://**-Endpunkt nötig. Ein eigener Rechner mit vorhandenem TLS-Reverse-Proxy oder ein bewusst eingerichteter Tunnel kann ihn bereitstellen. Eine lokale ws-Adresse funktioniert von GitHub Pages aus nicht. Dieser Schritt ist nicht automatisch eingerichtet. Eigener Server verursacht keine Software-Lizenzkosten; Strom, vorhandener Internetanschluss, Verfügbarkeit und gegebenenfalls notwendige Infrastruktur sind davon getrennt. Es wird kein pauschal „kostenloser und zuverlässig erreichbarer“ Server versprochen.

Im Relay-Modus berechnet der Node-Server das Spiel. Wenn der Raumersteller geht und mindestens zwei Spieler übrig sind, wird der nächste Spieler Gastgeber für den Startknopf. Spielstände sind flüchtig; ein Serverneustart beendet alle Räume. Maximal 64 gleichzeitige Räume, maximal vier Spieler pro Raum. Heartbeats entfernen verlorene Verbindungen. Eingaben werden begrenzt, Positionen und Treffer zentral berechnet.

## Regeln dieser Browser-Umsetzung

- 15 × 13 Felder einschließlich Rand, feste Pfeiler, symmetrisch verteilte Kisten, geschützte Startfelder.
- Bombenzünder 2,5 s, Feuer 0,5 s, Runde 120 s, Countdown 3 s.
- Eine Bombe, Reichweite zwei Felder und Tempo vier Felder/s zum Start.
- Bombe+: bis acht gleichzeitig; Feuer+: Reichweite bis acht; Tempo+: +0,5 bis sieben Felder/s.
- Kisten können ein Item hinterlassen (42 %; drei Itemtypen gleich gewichtet). Items erscheinen erst nach Erlöschen der Flammen. Offene Items verbrennen in Explosionen.
- Feste Wände stoppen Explosionen. Kisten werden zerstört und stoppen diesen Explosionsarm. Bomben lösen Kettenreaktionen aus. Eigene Bomben sind ebenso tödlich.
- Man kann nach dem Legen von einer Bombe herunterlaufen, aber danach nicht wieder hineinlaufen.
- Letzte 30 s: alle fünf Sekunden ein weiterer Randring. Bei gleichzeitiger Eliminierung aller Spieler unentschieden, kein Punkt.

**Diese Zahlen sind festgelegte Browser-Spielregeln, keine aus R2 bestätigten Originalkonstanten.** R2-Spezialfähigkeiten, Castle, Story, Bombenkick/-wurf, Schädel, Fernzünder und sämtliche Original-Items sind nicht Bestandteil des bestätigten Standard-Arena-Umfangs.

## Technische Struktur

- `engine.mjs`: Simulation mit festen 60 Schritten/s, Kollision, Bomben, Items, Runden.
- `room.mjs`: Lobby, maximal vier Teilnehmer, Bereitschaft und Gastgeberrechte.
- `network.mjs`: PeerJS-Direktmodus sowie optional WebSocket-Relay.
- `directory.mjs`: automatische offene Raumliste, anonyme Gastkennung und Bereinigung von Raumeinträgen.
- `database.rules.json`: in Firebase veröffentlichte Regeln für das Raumverzeichnis.
- `app.mjs`, `render.mjs`, `style.css`: Bedienung, synthetischer Ton und eigene Canvas-Grafiken. 20 Zustandsupdates/s, interpolierte Darstellung.
- `server.mjs`: optionaler HTTP-/WebSocket-Server mit erlaubter Liste statischer Dateien und Heartbeats.
- `tests/`: Simulationstests sowie Integration über vier echte WebSocket-Verbindungen.

Das Projekt hat noch keinen Zugangsschutz, wie vom Nutzer ausdrücklich zurückgestellt. Raumcode und Link sind keine Authentifizierung. Im Direktmodus wird dem Gastgeber vertraut; das ist kein manipulationssicherer Wettkampfserver. Es gibt keine Nutzerdatenbank oder dauerhaft gespeicherte Ergebnisse. Der Name bleibt lokal im Browser gespeichert. Der öffentliche Vermittlungsdienst und die STUN-Anbieter erhalten verbindungsbedingte Netzwerkdaten.

## Original-Untersuchung

Installation gefunden: `C:\Games\Super Bomberman R2`. Unity mit IL2CPP, Metadatenformat 27. `GameAssembly.dll`, `global-metadata.dat`, `ScriptingAssemblies.json`, Bundle-Manifestdateien und Dateistruktur wurden gelesen. Manifeste enthalten VS-Levelnamen und MapData-Typen wie `BlockDeployParam`, `PlayerStartPointParam` und `RandomItemParam`. Die externen Asset-Dateien haben einen proprietären/verschleierten Header und wurden von UnityPy 1.25.4 nicht als normale Unity-Bundles gelesen. Eine Verschlüsselung wurde nicht abschließend nachgewiesen oder entschlüsselt. Daher keine Behauptung einer vollständig rekonstruierten R2-Spielsimulation oder eines exakt extrahierten Original-Levels.

Die Originalinstallation wurde nicht verändert, gepatcht oder veröffentlicht.
