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

function openGamePreview(category, origin = 'leaderboard') {
  const game = portalGameNavigation[category];
  if (!game) return;
  if (scoreSubmitDialog.classList.contains('show') && !confirm('Dein Ergebnis ist noch nicht abgeschlossen. Zum Spiel wechseln, ohne es jetzt zu speichern?')) return;
  hideAllViews();
  if (!game.status) {
    HoermannGameSession.update(category, true, () => {
      selectedLaunchGame = category;
      const view = document.getElementById(category + '-view'); view.style.display = 'flex';
      HoermannGameSession.enter(category, origin);
      game.start();
      const render = {forklift: drawForkliftScene, tower: drawTowerScene, mario: drawMarioScene, buster: drawBusterScene, parcours: drawParcoursScene}[category];
      if (render) render();
      else {
        const canvas=view.querySelector('canvas');
        if(canvas){const ctx=canvas.getContext('2d');ctx.fillStyle='#001f3b';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 26px sans-serif';ctx.fillText(game.title,canvas.width/2,canvas.height/2);}
      }
      view.scrollIntoView({block:'start',behavior:'auto'});
    });
    return;
  }
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
    const best = category === 'bomber' || !name ? null : findExistingPlayerBest(HoermannGameReleases.release(category).scoreCategory, name);
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
  ribbon.addEventListener('click', event => { event.stopPropagation(); openGlobalLeaderboard(category === 'bomber' ? 'forklift' : HoermannGameReleases.release(category).scoreCategory, getLockedPlayerName()); });
  card.append(ribbon);
  const action = card.querySelector('.btn-card-start') || document.createElement('button');
  action.style.cssText = ''; action.type = 'button'; action.className = 'game-open-action';
  action.textContent = game.status ? game.status : 'Spielen'; action.disabled = Boolean(game.status);
  action.addEventListener('click', event => { event.stopPropagation(); openGamePreview(category, 'menu'); });
  card.append(action);
  const version=document.createElement('button');version.type='button';version.className='game-version-button';
  version.textContent='Update '+HoermannGameReleases.release(category).version;
  version.addEventListener('click',event=>{event.stopPropagation();HoermannGameSession.update(category,false);});card.append(version);
  card.addEventListener('click', event => { if (!game.status && !event.target.closest('button')) openGamePreview(category, 'menu'); });
  if(!game.status){const pause=document.createElement('button');pause.type='button';pause.className='utility-link game-pause-button';pause.textContent='Pause · P / Esc';pause.addEventListener('click',()=>HoermannGameSession.pause());document.querySelector('#'+category+'-view .game-actions-bar').append(pause);}
}
const leaderboardGameLink = document.createElement('button');
leaderboardGameLink.type = 'button'; leaderboardGameLink.id = 'leaderboard-game-link'; leaderboardGameLink.className = 'submit-btn';
highscoreCard.querySelector('.leaderboard-tabs').insertAdjacentElement('beforebegin', leaderboardGameLink);
function updateLeaderboardGameLink() {
  const game = portalGameNavigation[activeGameCategory === 'buster_v02' ? 'buster' : activeGameCategory];
  if (!game) return;
  leaderboardGameLink.textContent = game.status ? game.title + ' · ' + game.status : 'Zum Spiel: ' + game.title;
  leaderboardGameLink.disabled = false;
}
leaderboardGameLink.addEventListener('click', () => openGamePreview(activeGameCategory === 'buster_v02' ? 'buster' : activeGameCategory));
const busterHistoryButton=document.createElement('button');busterHistoryButton.type='button';busterHistoryButton.hidden=true;busterHistoryButton.className='utility-link';busterHistoryButton.id='buster-history-button';leaderboardGameLink.after(busterHistoryButton);
busterHistoryButton.addEventListener('click',()=>switchLeaderboardTab(activeGameCategory==='buster'?'buster_v02':'buster'));
function refreshLeaderboardNavigation(){const visible=['buster','buster_v02'].includes(activeGameCategory);busterHistoryButton.hidden=!visible;busterHistoryButton.textContent=activeGameCategory==='buster'?'Zur aktuellen Bestenliste 0.2':'Bisherige Bestenliste 0.1 ansehen';updateLeaderboardGameLink();refreshGameRibbons();}
window.addEventListener('portal-leaderboard-change',refreshLeaderboardNavigation);
window.addEventListener('storage', refreshGameRibbons);
refreshGameRibbons(); updateLeaderboardGameLink();
