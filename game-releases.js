(function(root) {
  const releases = {
    buster: { version: '0.2', scoreCategory: 'buster_v02', notes: [
      'Sanfter Einstieg: 15 % weniger neue Blasen, innerhalb von 8 Sekunden gleichmäßig auf Normaltempo.',
      'Combo: je 5 Treffer in Folge +5 % Punkte, maximal +25 % bei 25 Treffern.',
      'Fehlklick: −15 Punkte (mindestens 0) und Combo zurück auf 0.',
      'Neue Bestenliste für 0.2. Deine bisherigen 0.1-Rekorde bleiben separat erreichbar.'
    ] }
  };
  const placeholder = ['(Platzhalter: Update-Hinweise folgen vor der Veröffentlichung.)'];
  ['forklift','mario','nerve','parcours'].forEach(game => { releases[game] = { version: '0.2', scoreCategory: game + '_v02', notes: placeholder }; });
  const categories = Object.freeze(['forklift','tower','pacman','slots','mario','buster','nerve','parcours','buster_v02','forklift_v02','mario_v02','nerve_v02','parcours_v02']);
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
