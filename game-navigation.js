/* Shared UI navigation only. Existing score storage, ranking and game rules stay authoritative. */
const portalGameNavigation = {
  forklift: { title: 'Lagermeister Nico malocht', start: startForkliftGame },
  tower: { title: 'Tower of Mut', start: startTowerGame },
  pacman: { title: 'Hörmann Mut-Man', status: 'Coming soon' },
  slots: { title: 'Hörmann Mut-Automat', status: 'Überarbeitung' },
  mario: { title: 'Super Dennis', start: startMarioGame },
  buster: { title: 'Zweifel-Buster', start: startBusterGame },
  nerve: { title: 'Die Mut-Probe', start: startNerveGame },
  parcours: { title: 'Tor-Parcours', start: startParcoursGame },
  bomber: { title: 'Bomber-Arena', status: 'Coming soon' }
};
let selectedLaunchGame = null;
const launchView = document.createElement('section');
launchView.id = 'game-launch-view'; launchView.className = 'card-content';
launchView.style.display = 'none';
launchView.innerHTML = '<h2 id="game-launch-title" tabindex="-1"></h2><p id="game-launch-description"></p><div class="game-launch-actions"><button type="button" class="submit-btn" id="game-launch-play">Jetzt spielen</button><button type="button" class="utility-link" id="game-launch-ranks">Bestenliste ansehen</button><button type="button" class="utility-link" id="game-launch-menu">Zur Spieleübersicht</button></div>';
gamesMenuView.insertAdjacentElement('afterend', launchView);

function openGamePreview(category) {
  const game = portalGameNavigation[category];
  if (!game) return;
  if (scoreSubmitDialog.classList.contains('show') && !confirm('Dein Ergebnis ist noch nicht abgeschlossen. Zum Spiel wechseln, ohne es jetzt zu speichern?')) return;
  hideAllViews();
  selectedLaunchGame = category;
  launchView.style.display = 'flex';
  document.getElementById('game-launch-title').textContent = game.title;
  document.getElementById('game-launch-description').textContent = game.status
    ? game.status + ' – dieses Spiel ist vorübergehend nicht verfügbar. Bestehende Highscores bleiben in der Bestenliste sichtbar.'
    : 'Bereit für die nächste Runde? Dein Spiel beginnt erst, wenn du „Jetzt spielen“ auswählst.';
  const play = document.getElementById('game-launch-play');
  play.disabled = Boolean(game.status); play.textContent = game.status || 'Jetzt spielen';
  document.getElementById('game-launch-title').focus({ preventScroll: true });
  launchView.scrollIntoView({ behavior: 'auto', block: 'start' });
}
document.getElementById('game-launch-play').addEventListener('click', () => {
  const game = portalGameNavigation[selectedLaunchGame];
  if (!game || game.status || typeof game.start !== 'function') return;
  hideAllViews();
  document.getElementById(selectedLaunchGame + '-view').style.display = 'flex';
  game.start();
});
document.getElementById('game-launch-ranks').addEventListener('click', () => openGlobalLeaderboard(selectedLaunchGame === 'bomber' ? 'forklift' : selectedLaunchGame));
document.getElementById('game-launch-menu').addEventListener('click', showGamesMenu);

function refreshGameRibbons() {
  const name = getLockedPlayerName();
  for (const [category, game] of Object.entries(portalGameNavigation)) {
    const ribbon = document.querySelector('[data-game-rank="' + category + '"]');
    if (!ribbon) continue;
    const best = category === 'bomber' || !name ? null : findExistingPlayerBest(category, name);
    const rank = best && best.isUser && best.score > 0 ? best.rank : null;
    ribbon.className = 'game-rank-ribbon' + (rank && rank <= 3 ? ' rank-' + rank : rank ? ' rank-listed' : ' rank-empty');
    ribbon.textContent = rank ? 'Platz ' + rank : category === 'bomber' ? 'Bestenlisten' : 'Noch kein Rang';
    ribbon.setAttribute('aria-label', game.title + ': ' + (rank ? 'dein Platz ' + rank : 'noch kein eigener Rang') + ' – Bestenliste öffnen');
    ribbon.title = rank ? 'Dein Bestwert: ' + best.score + ' · Bestenliste öffnen' : 'Noch kein eigener Highscore · Bestenliste öffnen';
  }
}
for (const [category, game] of Object.entries(portalGameNavigation)) {
  let card = category === 'bomber' ? gamesMenuView.querySelector('a[href="bomber-arena.html"]') : document.getElementById('choose-' + category + '-btn');
  if (!card) continue;
  if (card.tagName === 'A') {
    const replacement = document.createElement('div');
    replacement.className = card.className; replacement.style.cssText = card.style.cssText;
    replacement.innerHTML = card.innerHTML; card.replaceWith(replacement); card = replacement;
  }
  card.dataset.game = category;
  card.querySelectorAll('.card-badge-rec').forEach(badge => badge.remove());
  if (category === 'bomber') card.querySelector('span')?.remove();
  if (game.status) {
    card.classList.add('game-unavailable');
    card.append(Object.assign(document.createElement('strong'), { className: 'game-state-label', textContent: game.status }));
  }
  const ribbon = document.createElement('button');
  ribbon.type = 'button'; ribbon.dataset.gameRank = category;
  ribbon.addEventListener('click', event => { event.stopPropagation(); openGlobalLeaderboard(category === 'bomber' ? 'forklift' : category, getLockedPlayerName()); });
  card.append(ribbon);
  const action = card.querySelector('.btn-card-start') || document.createElement('button');
  action.style.cssText = ''; action.type = 'button'; action.className = 'game-open-action';
  action.textContent = game.status ? game.status : 'Spiel ansehen'; action.disabled = Boolean(game.status);
  action.addEventListener('click', event => { event.stopPropagation(); openGamePreview(category); });
  card.append(action);
  card.addEventListener('click', event => { if (!game.status && !event.target.closest('button')) openGamePreview(category); });
}
const leaderboardGameLink = document.createElement('button');
leaderboardGameLink.type = 'button'; leaderboardGameLink.id = 'leaderboard-game-link'; leaderboardGameLink.className = 'submit-btn';
highscoreCard.querySelector('.leaderboard-tabs').insertAdjacentElement('beforebegin', leaderboardGameLink);
function updateLeaderboardGameLink() {
  const game = portalGameNavigation[activeGameCategory];
  if (!game) return;
  leaderboardGameLink.textContent = game.status ? game.title + ' · ' + game.status : 'Zum Spiel: ' + game.title;
  leaderboardGameLink.disabled = false;
}
leaderboardGameLink.addEventListener('click', () => openGamePreview(activeGameCategory));
new MutationObserver(() => { updateLeaderboardGameLink(); refreshGameRibbons(); }).observe(leaderboardBody, { childList: true });
window.addEventListener('storage', refreshGameRibbons);
refreshGameRibbons(); updateLeaderboardGameLink();
