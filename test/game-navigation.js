/* Shared UI navigation only. Existing score storage, ranking and game rules stay authoritative. */
const portalGameNavigation = {
  forklift: { title: 'Lagermeister Nico malocht', start: startForkliftGame },
  tower: { title: 'Tower of Mut', status: 'Überarbeitung' },
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
launchView.innerHTML = '<h2 id="game-launch-title" tabindex="-1"></h2><p id="game-launch-description"></p><div class="game-launch-actions"><button type="button" class="submit-btn" id="game-launch-play">Jetzt spielen</button><button type="button" class="utility-link" id="game-launch-ranks">Bestenliste ansehen</button><button type="button" class="utility-link" id="game-launch-update">Update</button><button type="button" class="utility-link" id="game-launch-menu">Zur Spieleübersicht</button></div>';
gamesMenuView.insertAdjacentElement('afterend', launchView);

function openGamePreview(category, origin = 'leaderboard') {
  const game = portalGameNavigation[category];
  if (!game) return;
  if (game.status) return; /* pausierte Spiele öffnen nie das Spiel */
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
  const upd = document.getElementById('game-launch-update');
  upd.hidden = !HoermannGameReleases.isVersioned(category);
  if (!upd.hidden) upd.textContent = 'Update ' + HoermannGameReleases.release(category).version;
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
document.getElementById('game-launch-update').addEventListener('click', () => { const g = HoermannGameReleases.baseGame(selectedLaunchGame); if (g) HoermannGameSession.update(g, false); });
document.getElementById('game-launch-ranks').addEventListener('click', () => openGlobalLeaderboard(selectedLaunchGame === 'bomber' ? 'forklift' : selectedLaunchGame));
document.getElementById('game-launch-menu').addEventListener('click', showGamesMenu);

function refreshGameRibbons() {
  const cards = [];
  const name = getLockedPlayerName();
  for (const [category, game] of Object.entries(portalGameNavigation)) {
    const ribbon = document.querySelector('[data-game-rank="' + category + '"]');
    if (!ribbon) { const c = document.querySelector('[data-game="' + category + '"]'); if (c) cards.push({card: c, unavailable: Boolean(game.status), rank: 0, index: Object.keys(portalGameNavigation).indexOf(category)}); continue; }
    const best = category === 'bomber' || !name ? null : findExistingPlayerBest(HoermannGameReleases.release(category).scoreCategory, name);
    const rank = best && best.isUser && best.score > 0 ? best.rank : null;
    ribbon.className = 'game-rank-ribbon' + (rank && rank <= 3 ? ' rank-' + rank : rank ? ' rank-listed' : ' rank-empty');
    ribbon.firstElementChild.textContent = rank ? 'Platz ' + rank : 'Noch kein Rang';
    ribbon.setAttribute('aria-label', game.title + ': ' + (rank ? 'dein Platz ' + rank : 'noch kein eigener Rang') + ' – Bestenliste öffnen');
    const card = ribbon.closest('[data-game]');
    cards.push({card, unavailable: Boolean(game.status), rank: rank || 0, index: Object.keys(portalGameNavigation).indexOf(category)});
    ribbon.title = rank ? 'Dein Bestwert: ' + best.score + ' · Bestenliste öffnen' : 'Noch kein eigener Highscore · Bestenliste öffnen';
  }
  cards.sort((a,b) => Number(a.unavailable)-Number(b.unavailable) || (a.unavailable ? 0 : a.rank===0 ? (b.rank===0 ? 0 : -1) : b.rank===0 ? 1 : b.rank-a.rank) || a.index-b.index);
  const grid = gamesMenuView.querySelector('.games-grid');
  if(cards.some((entry,index) => grid.children[index] !== entry.card)) {
    const focused = document.activeElement;
    grid.append(...cards.map(entry => entry.card));
    if(grid.contains(focused)) focused.focus({preventScroll:true});
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
  const descriptions = {
    forklift: 'Entlade LKWs und staple Hörmann-Paletten sicher ins Lager. Schaffst du 100 %?',
    tower: 'Klettere mit Resse durch den Schicksalsturm: Tutorial und fünf Level.',
    pacman: 'Sammle Mut-Punkte im Labyrinth und weiche den Zweifel-Geistern aus.',
    slots: 'Walzen, Risiko und Jackpot im Hörmann Mut-Automaten.',
    mario: 'Hüpfe mit Dennis durch die Hörmann-Welt, knacke Blöcke und erreiche das Werkstor.',
    buster: 'Zerschlage Zweifel per Klick und baue deine Treffer-Combo für mehr Punkte aus.',
    nerve: 'Wähle eines von drei Toren: Gewinne Punkte und entscheide, wann du sie sicherst.',
    parcours: 'Steuere durch die Sektionaltore und stelle deine Reflexe auf die Probe.',
    bomber: 'Online-Arena für zwei bis vier Spieler mit Bomben und Items.'
  };
  const preview = card.querySelector('.game-icon-large') || [...card.children].find(child => child.tagName==='DIV' && child.style.fontSize && !child.classList.contains('card-badge-rec'));
  card.removeAttribute('style');
  card.replaceChildren();
  if(preview){preview.removeAttribute('style');preview.className='game-card-preview';preview.setAttribute('aria-hidden','true');card.append(preview);}
  else {const preview=document.createElement('div');preview.className='game-card-preview';preview.setAttribute('aria-hidden','true');preview.textContent='💣';card.append(preview);}
  const head = document.createElement('div'); head.className = 'game-card-head';
  head.append(card.querySelector('.game-card-preview'), Object.assign(document.createElement('h3'), {className:'game-card-title',textContent:game.title}));
  card.append(head);
  card.append(Object.assign(document.createElement('p'), {className:'game-card-desc',textContent:descriptions[category]}));
  if (game.status) card.classList.add('game-unavailable');
  const foot = document.createElement('div'); foot.className = 'game-card-foot';
  if (category !== 'bomber') {
    const ribbon = document.createElement('button');
    ribbon.type = 'button'; ribbon.dataset.gameRank = category;
    ribbon.append(Object.assign(document.createElement('span'), {className:'game-rank-chip'}));
    ribbon.addEventListener('click', event => { event.stopPropagation(); openGlobalLeaderboard(HoermannGameReleases.release(category).scoreCategory, getLockedPlayerName()); });
    foot.append(ribbon);
  }
  const action = card.querySelector('.btn-card-start') || document.createElement('button');
  action.style.cssText = ''; action.type = 'button'; action.className = 'game-open-action';
  action.textContent = game.status ? game.status : 'Spielen'; action.disabled = Boolean(game.status);
  action.addEventListener('click', event => { event.stopPropagation(); openGamePreview(category, 'menu'); });
  foot.append(action);
  if(HoermannGameReleases.isVersioned(category)){const news=document.createElement('button');news.type='button';news.className='game-version-button';news.textContent='Neu in Update '+HoermannGameReleases.release(category).version+' – lesen ›';news.addEventListener('click',event=>{event.stopPropagation();HoermannGameSession.update(category,false);});foot.append(news);}
  card.append(foot);
  card.addEventListener('click', event => { if (!game.status && !event.target.closest('button')) openGamePreview(category, 'menu'); });
  if(!game.status){const pause=document.createElement('button');pause.type='button';pause.className='utility-link game-pause-button';pause.textContent='Pause · P / Esc';pause.addEventListener('click',()=>HoermannGameSession.pause());const bar=document.querySelector('#'+category+'-view .game-actions-bar');bar.append(pause);const upd=document.createElement('button');upd.type='button';upd.className='utility-link game-update-button';upd.textContent='Update '+HoermannGameReleases.release(category).version;upd.addEventListener('click',()=>HoermannGameSession.update(category,false));bar.append(upd);}
}
const leaderboardGameLink = document.createElement('button');
leaderboardGameLink.type = 'button'; leaderboardGameLink.id = 'leaderboard-game-link'; leaderboardGameLink.className = 'submit-btn';
highscoreCard.querySelector('.leaderboard-tabs').insertAdjacentElement('beforebegin', leaderboardGameLink);
function updateLeaderboardGameLink() {
  const game = portalGameNavigation[HoermannGameReleases.baseGame(activeGameCategory)];
  if (!game) return;
  leaderboardGameLink.textContent = game.status ? game.title + ' · ' + game.status : 'Zum Spiel: ' + game.title;
  leaderboardGameLink.disabled = false;
  leaderboardGameLink.classList.toggle('is-paused', Boolean(game.status));
  leaderboardGameLink.setAttribute('aria-disabled', game.status ? 'true' : 'false');
}
leaderboardGameLink.addEventListener('click', () => { const base = HoermannGameReleases.baseGame(activeGameCategory); if (portalGameNavigation[base]?.status) return; openGamePreview(base); });
const busterHistoryButton=document.createElement('button');busterHistoryButton.type='button';busterHistoryButton.hidden=true;busterHistoryButton.className='utility-link';busterHistoryButton.id='buster-history-button';leaderboardGameLink.after(busterHistoryButton);
busterHistoryButton.addEventListener('click',()=>{const base=HoermannGameReleases.baseGame(activeGameCategory);switchLeaderboardTab(activeGameCategory===base?HoermannGameReleases.release(base).scoreCategory:base);});
function refreshLeaderboardNavigation(){const visible=HoermannGameReleases.isVersioned(activeGameCategory);busterHistoryButton.hidden=!visible;busterHistoryButton.textContent=activeGameCategory===HoermannGameReleases.baseGame(activeGameCategory)?'Zur aktuellen Bestenliste 0.2':'Bisherige Bestenliste 0.1 ansehen';updateLeaderboardGameLink();refreshGameRibbons();}
window.addEventListener('portal-leaderboard-change',refreshLeaderboardNavigation);
window.addEventListener('storage', refreshGameRibbons);
refreshGameRibbons(); updateLeaderboardGameLink();

/* ===== Bestenlisten als Overlay (Dialog) ===== */
// Beim Öffnen aus einem laufenden Spiel wird das Spiel pausiert (ohne eigenen Dialog), beim Schließen erscheint "Weiter spielen".
const openGlobalLeaderboardOriginal = openGlobalLeaderboard;
openGlobalLeaderboard = function (...args) {
  const phase = HoermannGameSession.state().phase;
  if (phase === 'playing' || phase === 'countdown') HoermannGameSession.pause(true);
  return openGlobalLeaderboardOriginal.apply(this, args);
};
document.body.append(highscoreCard);
const lbOverlay = { opener: null };
const lbOpen = () => highscoreCard.classList.contains('show');
const lbFocusables = () => [...highscoreCard.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && !el.hidden && el.getClientRects().length);
function closeLeaderboardOverlay() { highscoreCard.classList.remove('show'); }
new MutationObserver(() => {
  if (lbOpen()) {
    if (!lbOverlay.opener || !lbOverlay.opener.isConnected) lbOverlay.opener = document.activeElement !== document.body ? document.activeElement : null;
    document.documentElement.classList.add('lb-overlay-open');
    closeLeaderboardBtn.textContent = '✕ Schließen'; closeLeaderboardBtn.setAttribute('aria-label', 'Bestenlisten schließen');
    highscoreCard.scrollTop = 0;
    (highscoreCard.querySelector('.lb-tab-btn.active') || closeLeaderboardBtn).focus({preventScroll: true});
  } else {
    document.documentElement.classList.remove('lb-overlay-open');
    if (HoermannGameSession.state().phase === 'paused') queueMicrotask(() => HoermannGameSession.reopenPause());
    const o = lbOverlay.opener; lbOverlay.opener = null;
    if (o && o.isConnected && o.getClientRects().length && !document.querySelector('dialog[open]')) o.focus({preventScroll: true});
  }
}).observe(highscoreCard, {attributes: true, attributeFilter: ['class']});
document.addEventListener('keydown', event => {
  if (!lbOpen()) return;
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeLeaderboardOverlay(); return; }
  if (event.key !== 'Tab') return;
  const items = lbFocusables(); if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (!highscoreCard.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}, true);
document.addEventListener('pointerdown', event => { if (lbOpen() && !highscoreCard.contains(event.target) && !event.target.closest('#game-session-dialog, #toast')) { lbOverlay.opener = null; closeLeaderboardOverlay(); } }, true);
document.getElementById('header-leaderboard-btn').addEventListener('click', event => {
  lbOverlay.opener = event.currentTarget;
  openGlobalLeaderboard(localStorage.getItem('hoermann_last_lb_cat') || 'forklift_v02', getLockedPlayerName());
});

/* ===== Version und Änderungsverlauf ===== */
(function () {
  const log = globalThis.HoermannChangelog; if (!log) return;
  const latest = log.latest();
  const versionBtn = document.getElementById('version-changelog-btn');
  versionBtn.textContent = 'Version ' + latest.version;
  const chips = document.createElement('div'); chips.id = 'version-highlights'; chips.className = 'version-highlights';
  for (const text of latest.highlights.slice(0, 4)) chips.append(Object.assign(document.createElement('span'), {className: 'version-chip', textContent: text}));
  const dialog = document.createElement('dialog'); dialog.id = 'changelog-dialog'; dialog.setAttribute('aria-labelledby', 'changelog-title');
  dialog.innerHTML = '<h2 id="changelog-title">Was ist neu?</h2><div id="changelog-highlights"></div><div id="changelog-body"></div><button type="button" class="submit-btn" id="changelog-close">Schließen</button>';
  document.body.append(dialog);
  const body = dialog.querySelector('#changelog-body');
  dialog.querySelector('#changelog-highlights').append(chips);
  for (const v of log.versions) {
    const section = document.createElement('section');
    const h = document.createElement('h3'); h.textContent = 'Version ' + v.version + (v.date ? ' · ' + new Date(v.date + 'T12:00:00').toLocaleDateString('de-DE') : '');
    const ul = document.createElement('ul');
    for (const t of v.headlines) ul.append(Object.assign(document.createElement('li'), {textContent: t}));
    section.append(h, ul); body.append(section);
  }
  versionBtn.addEventListener('click', () => { dialog.showModal(); dialog.querySelector('#changelog-close').focus(); });
  dialog.querySelector('#changelog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => versionBtn.focus());
})();

/* ===== Versteckter Admin-Zugang: Adresse mit #admin oder fünfmal schnell auf "Hörmann Mut-Portal" im Footer tippen ===== */
(function () {
  const open = () => { const button = document.getElementById('chat-admin-toggle-btn'); if (button) button.click(); };
  if (location.hash === '#admin') setTimeout(open, 800);
  window.addEventListener('hashchange', () => { if (location.hash === '#admin') open(); });
  let taps = [];
  const brand = document.getElementById('footer-brand');
  if (brand) brand.addEventListener('click', () => { const now = Date.now(); taps = taps.filter(t => now - t < 3000); taps.push(now); if (taps.length >= 5) { taps = []; open(); } });
})();
