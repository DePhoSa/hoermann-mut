// B. Spiele-Menue: gleich hohe Kacheln, kein abgeschnittener Text, pausierte Spiele grau und nicht anwaehlbar, Kopf-Bestenlisten
const PAUSED = ['tower', 'pacman'], PLAYABLE = ['forklift', 'mario', 'buster', 'nerve', 'parcours'];
exports.run = async ({ open }) => {
  const s = await open('B');
  try {
    await s.goto(); await s.page.locator('#menu-btn').click(); await s.page.locator('.games-grid').first().waitFor();
    await s.step('menue');
    const tiles = await s.page.evaluate(() => [...document.querySelectorAll('.games-grid > [data-game]')].filter(c => !c.hidden).map(c => { const r = c.getBoundingClientRect(); return { g: c.dataset.game, top: Math.round(r.top + scrollY), h: Math.round(r.height), cls: c.className }; }));
    s.expect(tiles.length === 7, 'Erwartet 7 Solo-Kacheln, gefunden ' + tiles.length);
    const rows = {}; for (const t of tiles) (rows[t.top] = rows[t.top] || []).push(t);
    for (const row of Object.values(rows)) { const hs = new Set(row.map(t => t.h)); s.expect(hs.size === 1, 'Kacheln einer Reihe sind unterschiedlich hoch: ' + row.map(t => t.g + '=' + t.h).join(', '), 'Kachelreihe'); }
    for (const g of PAUSED) { const t = tiles.find(t => t.g === g); s.expect(t && /game-unavailable/.test(t.cls), 'Pausiertes Spiel nicht ausgegraut: ' + g, g); }
    for (const g of PLAYABLE) { const t = tiles.find(t => t.g === g); s.expect(t && !/game-unavailable/.test(t.cls), 'Spielbares Spiel ausgegraut: ' + g, g); }
    // Umschalter: Bomber-Arena nur unter Multiplayerspiele
    s.expect(await s.page.locator('[data-game="bomber"]').isHidden(), 'Bomber-Arena darf unter Solospiele nicht erscheinen');
    await s.page.locator('#games-mode-switch [data-mode="multi"]').click();
    s.expect(await s.page.locator('[data-game="bomber"]').isVisible() && await s.page.locator('[data-game="forklift"]').isHidden(), 'Multiplayer-Reiter zeigt nicht nur Bomber-Arena');
    await s.page.locator('#games-mode-switch [data-mode="solo"]').click();
    // Update-Hinweis je spielbarer Kachel (eigene Notizen), kein gemeinsamer Hinweis ueber dem Raster; Rang-Chip nur wenn es einen Rang gibt
    const notice = await s.page.evaluate(() => ({ shared: document.querySelectorAll('#games-update-notice').length, links: [...document.querySelectorAll('.games-grid > [data-game]:not(.game-unavailable) .game-update-link')].filter(l => l.getClientRects().length).length, onPaused: document.querySelectorAll('.games-grid > .game-unavailable .game-update-link').length, rank: [...document.querySelectorAll('.game-card-foot .game-rank-ribbon')].filter(r => r.getClientRects().length).length, noRank: /Noch kein Rang/.test(document.querySelector('.games-grid').textContent) }));
    s.expect(notice.shared === 0, 'Gemeinsamer Update-Hinweis ueber dem Raster darf nicht mehr da sein');
    s.expect(notice.links === 5 && notice.onPaused === 0, 'Jede spielbare Kachel braucht genau einen Update-Hinweis, pausierte keinen: ' + JSON.stringify(notice));
    s.expect(!notice.noRank, 'Rang-Chip ohne Rang sichtbar');
    await s.page.locator('.games-grid > [data-game="mario"] .game-update-link').click(); await s.page.locator('#game-session-dialog[open]').waitFor().catch(() => s.fail('Update-Hinweis der Kachel oeffnet keine Notizen')); await s.step('update-hinweis-offen');
    await s.page.locator('#game-session-action').click();
    await s.page.locator('.games-grid > [data-game]').last().scrollIntoViewIfNeeded(); await s.step('menue-ende');
    // Pausierte Spiele: Knopf deaktiviert, Antippen oeffnet kein Spiel
    for (const g of PAUSED) {
      const card = s.page.locator(`[data-game="${g}"]`); await card.scrollIntoViewIfNeeded();
      s.expect(await card.locator('.game-open-action').isDisabled(), 'Aktionsknopf bei pausiertem Spiel nicht deaktiviert: ' + g, g);
      await card.click({ position: { x: 20, y: 20 }, force: true }).catch(() => {}); await s.page.waitForTimeout(150);
      const opened = await s.page.evaluate(() => HoermannGameSession.state().game !== null || [...document.querySelectorAll('section[id$="-view"]')].some(v => v.id !== 'portal-view' && getComputedStyle(v).display !== 'none' && v.id !== 'games-menu-view'));
      s.expect(!opened, 'Pausiertes Spiel liess sich oeffnen: ' + g, g);
    }
    await s.step('pausierte-spiele-nicht-anwaehlbar');
    // Kopf-Bestenlisten
    await s.page.evaluate(() => scrollTo(0, 0));
    await s.page.locator('#header-leaderboard-btn').click(); await s.page.locator('#highscore-card.show').waitFor(); await s.step('kopf-bestenlisten');
    await s.page.locator('#close-leaderboard-btn').click(); await s.step('bestenlisten-zu');
    s.expect(!(await s.page.locator('#highscore-card.show').count()), 'Bestenliste liess sich nicht schliessen');
  } finally { await s.close(); }
};
