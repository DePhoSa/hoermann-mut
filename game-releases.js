(function(root) {
  const releases = {
    buster: { version: '0.2', scoreCategory: 'buster_v02', notes: [
      'Sanfter Einstieg: 15 % weniger neue Blasen, innerhalb von 8 Sekunden gleichmäßig auf Normaltempo.',
      'Combo: je 5 Treffer in Folge +5 % Punkte, maximal +25 % bei 25 Treffern.',
      'Fehlklick: −15 Punkte (mindestens 0) und Combo zurück auf 0.',
      'Neue Bestenliste für 0.2. Deine bisherigen 0.1-Rekorde bleiben separat erreichbar.'
    ] }
  };
  const notes02 = {
    forklift: [
      'Neue Touch-Steuerung: große Knöpfe, auf dem Handy gut bedienbar.',
      'Gedrückt gehaltene Tasten lösen Aufnehmen, Mast und Hupe nicht mehr mehrfach aus.',
      'Der Stapler bleibt nicht mehr hängen, wenn du das Fenster wechselst oder den Finger wegziehst.',
      'Fairere Wertung: mehr Zeit zum Liefern, Absetzen bis 6 km/h, Strafe für falsche Mast-Höhe nur noch einmal pro Versuch.',
      'Ersatzpaletten nach Totalschaden liegen nicht mehr auf anderen Paletten.',
      'Lesbarere Fach-Beschriftungen und Hinweise.',
      'Neue Bestenliste für 0.2. Deine 0.1-Rekorde bleiben erhalten.'
    ],
    mario: [
      'Neue Bestenliste: Super Dennis 0.2 startet mit frischen Punkten, die 0.1-Ergebnisse bleiben erhalten.',
      'Gegner patrouillieren fair und laufen nicht mehr durch Rohre oder über Gruben.',
      'Nach einem Sturz in die Grube geht es auf sicherem Boden weiter, mit kurzem Schutz.',
      'Block-Gruppen sind so platziert, dass du Blöcke und MUT-Buchstaben sicher erreichst.',
      'Genaueres Landen und Köpfen, keine Teleport-Aussetzer mehr, Ecken-Hilfe bei knappen Sprüngen.',
      'Größere Touch-Buttons, die nicht mehr hängen bleiben.',
      'Besser lesbare Gegner-Namen und eine Anzeige für die Dauer der Stern-Power.'
    ],
    nerve: [
      'Fairere Mathe: Der Topf wächst um das 1,5-Fache, Weiterspielen ist eine echte Risiko-Entscheidung.',
      'Sichern geht erst nach dem ersten geschafften Tor, kein Gratis-Punkte-Trick mehr.',
      'Angezeigter Topf und gesicherte Punkte stimmen immer überein.',
      'Klarere Rückmeldung: dein gewähltes Tor wird hervorgehoben, ein Alarm zeigt, was du verloren hast.',
      'Neue Hinweiszeile mit nächstem Topfwert und Risiko.',
      'Bedienung per Tastatur (1/2/3, Enter) und besser lesbar auf dem Handy.',
      'Neue Bestenliste für 0.2. Deine 0.1-Punkte bleiben erhalten.'
    ],
    parcours: [
      'Faireres Torprofil: Jedes Tor ist sicher erreichbar, keine unmöglichen Höhensprünge mehr.',
      'Sanfter Einstieg: Es startet langsamer und mit größeren Lücken, beides steigert sich über die ersten 30 Tore.',
      'Genauere Kollision: Nur echte Berührungen zählen.',
      'Du startest selbst: Der Ball wartet auf dein erstes Tippen oder die Leertaste.',
      'Bessere Steuerung auf dem Handy: kein versehentliches Neustarten, kein Dauerhüpfen durch gehaltene Taste.',
      'Besseres Spielgefühl: Schweif, Punkteanzeige, Wackeln beim Crash und Konfetti nur bei neuem Rekord.',
      'Neue Bestenliste für 0.2. Deine 0.1-Rekorde bleiben separat erhalten.'
    ]
  };
  Object.keys(notes02).forEach(game => { releases[game] = { version: '0.2', scoreCategory: game + '_v02', notes: notes02[game] }; });
  const categories = Object.freeze(['forklift','tower','pacman','mario','buster','nerve','parcours','buster_v02','forklift_v02','mario_v02','nerve_v02','parcours_v02']);
  const baseGame = category => String(category).replace(/_v02$/, '');
  const isVersioned = category => Boolean(releases[baseGame(category)]);
  function release(game) { return releases[game] || { version: '0.1', scoreCategory: game, notes: ['Erstveröffentlichung 0.1.'] }; }
  const comboFactor = combo => 1 + Math.min(5, Math.floor(Math.max(0, combo) / 5)) * 0.05;
  const api = Object.freeze({ categories, release, baseGame, isVersioned,
    spawnRate: seconds => 0.05 * (0.85 + 0.15 * Math.min(1, Math.max(0, seconds / 8))),
    comboFactor,
    award: (base, combo) => Math.round(base * comboFactor(combo)),
    miss: score => Math.max(0, score - 15)
  });
  root.HoermannGameReleases = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
