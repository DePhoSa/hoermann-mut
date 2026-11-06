/* Änderungsverlauf des Portals. Neue Version: oben einen Eintrag ergänzen (neueste zuerst). */
(function (root) {
  const versions = [
    {
      version: '3.4.0', date: '2026-11-06',
      highlights: ['Neustart direkt im Spiel', 'Rekorde speichern automatisch', 'Aufgeräumte Oberfläche'],
      headlines: [
        'Nochmal spielen direkt am Spielende',
        'Rekorde werden automatisch gespeichert',
        'Bestenliste: Hauptaktion klarer, kompaktes Ergebnisblatt',
        'Countdown nach Pause jedes Mal ab 3',
        'Schlanker Footer, Admin-Zugang mit Google-Anmeldung',
        'Viele Handy-Verbesserungen (Mut-Probe, Chat, Beschriftungen)'
      ]
    },
    {
      version: '3.3.0', date: '2026-11-05',
      highlights: ['Update 0.2 für vier Spiele', 'Neue Cloud-Bestenlisten', 'Chat hinter Knopf'],
      headlines: [
        'Lagermeister Nico, Super Dennis, Mut-Probe, Tor-Parcours: Update 0.2',
        'Neue Cloud-Bestenlisten (0.2)',
        'Chat hinter Knopf',
        'Eigener Admin-Dialog',
        'Kompaktere Spielübersicht'
      ]
    },
    {
      version: '3.2.0', date: '2026-11-05',
      highlights: ['Neue Firebase-Cloud'],
      headlines: ['Neue Firebase-Cloud, dauerhafte Bestenlisten und Chat']
    },
    {
      version: '3.1.8', date: '2026-10-26',
      highlights: ['Spielvorschauen', 'Mut-Effekte'],
      headlines: ['Spielvorschauen, Countdown im Spielfeld, Mut-Effekte']
    }
  ];
  root.HoermannChangelog = Object.freeze({ versions, latest: () => versions[0] });
})(globalThis);
