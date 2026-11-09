# Bomber-Arena-Relay (kostenlos, Cloudflare Workers)

WebSocket-Relay über HTTPS/443. Funktioniert in Firmennetzen/VPN meist ohne Freigaben, weil es normaler Web-Verkehr ist.
Spiellogik wird aus `bomber-arena.html` übernommen (`sh relay/build.sh` erzeugt `worker.js`).

## Einrichtung (einmalig, ca. 5 Minuten)
1. Kostenloses Konto auf https://dash.cloudflare.com anlegen (keine Zahlungsdaten nötig).
2. Account-ID: im Dashboard unter „Workers & Pages“ rechts als „Account ID“.
3. API-Token: „My Profile → API Tokens → Create Token“, Vorlage **Edit Cloudflare Workers**.
4. In GitHub: Repository → Settings → Secrets and variables → Actions → Secrets `CLOUDFLARE_API_TOKEN` und `CLOUDFLARE_ACCOUNT_ID` anlegen.
5. Actions → „Bomber-Relay veröffentlichen“ → Run workflow. Die Adresse steht danach im Log: `https://hoermann-arena-relay.<konto>.workers.dev`.
6. Erledigt: `DEFAULT_RELAY` in `bomber-arena.html` zeigt auf `wss://hoermann-arena-relay.saschasibbel.workers.dev`.

Grenzen Free-Tarif: ca. 100.000 Anfragen pro Tag, Räume liegen nur im Arbeitsspeicher (Neustart beendet Räume).
