# Merkliste (offene Entscheidungen)

## Bomber-Arena (derzeit nur Platzhalter "Coming soon")
- Die Git-Historie (Commits 163e7ce, 937a71e, 62c560f) zeigt eine frühere Version: WebRTC über PeerJS,
  Lobby mit offenen Räumen über Firebase Realtime Database (Spark), anonyme Identitäten, Regeln pro Besitzer.
- Diese Dateien sind im aktuellen Stand nicht mehr vorhanden (`bomber-arena.html` ist ein Platzhalter).
- **Wenn das Spiel wieder lauffähig gemacht wird:** Lobby-Backend neu aufsetzen, und zwar auf dem jetzigen
  Firebase-Projekt `hoermann-mut` (Firestore, anonyme Anmeldung) oder einer Alternative. Der alte
  Realtime-Database-Teil ist nicht mehr verdrahtet und müsste neu gebaut und mit eigenen Regeln versehen werden.
- Vorher klären: Ist die alte Realtime Database im Projekt aktiv? Falls ja, Regeln dort prüfen (keine offenen Regeln).

## Weitere offene Punkte
- Feste Admin-Anmeldung (z. B. Google) statt anonymer ID.
- Alte Browser-Tests laufen nur mit Edge, auf Chromium umstellen.
- Index.html (11.500 Zeilen) in Module je Spiel aufteilen.
