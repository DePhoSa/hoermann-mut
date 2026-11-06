# Admin-Zugang

## Öffnen (unsichtbar)
- Adresse mit `#admin` am Ende aufrufen, z. B. `.../hoermann-mut/#admin`, oder
- fünfmal schnell hintereinander auf "Hörmann Mut-Portal" im Footer tippen.

Danach im Dialog "Mit Google anmelden". Die Anmeldung bleibt im Browser gespeichert.

## Einrichtung (einmalig, in der Firebase-Konsole)
1. Authentication, Anmeldemethode: **Google** aktivieren (Support-E-Mail wählen).
2. Authentication, Einstellungen, Autorisierte Domains: `dephosa.github.io` hinzufügen.
3. Firestore, Dokument `config/admins`: Feld `emails` (Array aus Strings) mit der eigenen Google-Adresse anlegen.
   Das Feld `uids` darf bleiben, wird weiterhin akzeptiert.
4. Firestore, Regeln: Inhalt von `firebase/firestore.rules` einfügen und veröffentlichen.

Die Google-Adresse gehört nur in Firestore, nicht in dieses öffentliche Repository.

## Hinweise
- Die anonyme Spieler-ID bleibt erhalten, das Google-Konto wird damit verknüpft. Spielstände behalten ihren Besitzer.
- Auf einem neuen Gerät führt dieselbe Google-Anmeldung wieder zum Admin-Konto.
- Rechte entscheidet der Server (Regeln), nicht die Seite.
