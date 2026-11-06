// Portal 0.3: Spielkacheln, Bestenlisten-Overlay, Änderungsverlauf, Startfluss mit Bereitschaftszustand.
// Kein Netz, Cloud-Attrappe. Ausführen mit PLAYWRIGHT_CHANNEL=chromium (optional) und SHOTS=<Ordner> für Screenshots.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.resolve(__dirname, '..');
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const shots = process.env.SHOTS; if (shots) fs.mkdirSync(shots, { recursive: true });
  const viewports = [{ n: 'desktop', width: 1360, height: 900 }, { n: 'laptop', width: 1280, height: 720, deviceScaleFactor: 1.5 }, { n: 'phone390', width: 390, height: 844, mobile: true }, { n: 'phone360', width: 360, height: 740, mobile: true }];
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1, hasTouch: !!vp.mobile, isMobile: !!vp.mobile });
    const page = await ctx.newPage(); const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(u => !u.href.startsWith(origin), r => { external.push(r.request().url()); r.abort(); });
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.HoermannCloud={uid:'u1',async publish(){},async start(f,b){b('online');f([]);}};` }));
    await page.addInitScript(() => { if (!localStorage.getItem('qa03')) { localStorage.setItem('qa03', '1'); localStorage.setItem('hoermann_locked_player_name_v1', 'Tester'); localStorage.setItem('hoermann_player_name', 'Tester');
      localStorage.setItem('hoermann_mut_user_scores_v1', JSON.stringify({ forklift_v02: [{ name: 'Tester', score: 5000, isUser: true, date: 'Heute' }], tower: [{ name: 'Tester', score: 300, isUser: true, date: 'Heute' }] })); } });
    await page.goto(origin + '/index.html'); await page.waitForTimeout(600);
    const L = vp.n + ': ';
    const noOverflow = async label => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), L + label + ' horizontaler Überlauf');
    const tooSmall = async (sel, label) => { const bad = await page.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent || getComputedStyle(e).position === 'fixed').map(e => { const r = e.getBoundingClientRect(); return [e.id || e.textContent.trim().slice(0, 24), Math.round(r.width), Math.round(r.height)]; }).filter(x => x[2] < 43.5 || x[1] < 43.5), sel); assert.deepStrictEqual(bad, [], L + label + ' Ziele < 44px'); };
    const shot = async name => { if (shots) await page.screenshot({ path: path.join(shots, vp.n + '-' + name + '.png') }); };

    // Kein Leaderboard mehr am Seitenende
    assert.equal(await page.locator('#highscore-card').isVisible(), false);
    // Footer: Version als Knopf + Highlights, Änderungsverlauf-Dialog
    assert.equal(await page.locator('#version-changelog-btn').textContent(), 'Version ' + await page.evaluate(() => HoermannChangelog.latest().version));
    assert.ok(await page.locator('.version-chip').count() >= 2);
    await noOverflow('Start');
    await page.locator('#version-changelog-btn').scrollIntoViewIfNeeded(); await shot('footer');
    await page.locator('#version-changelog-btn').click();
    await page.locator('#changelog-dialog').waitFor({ state: 'visible' });
    const logText = await page.locator('#changelog-dialog').innerText();
    for (const t of ['Lagermeister Nico, Super Dennis, Mut-Probe, Tor-Parcours: Update 0.2', 'Neue Cloud-Bestenlisten (0.2)', 'Chat hinter Knopf', 'Eigener Admin-Dialog', 'Kompaktere Spielübersicht', 'Version 3.2.0', 'Version 3.1.8', 'Spielvorschauen, Countdown im Spielfeld, Mut-Effekte']) assert.ok(logText.includes(t), L + 'Changelog fehlt: ' + t);
    await shot('changelog');
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#changelog-dialog').isVisible(), false);

    // Leaderboard-Overlay aus Kopfzeile
    await tooSmall('#header-leaderboard-btn', 'Header-Knopf');
    await page.locator('#header-leaderboard-btn').click();
    await page.locator('#highscore-card.show').waitFor();
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('highscore-card')).position), 'fixed');
    await noOverflow('Overlay'); await shot('leaderboard');
    await tooSmall('#highscore-card button', 'Overlay-Knöpfe');
    const box = await page.locator('#highscore-card').boundingBox();
    assert.ok(box.x >= -0.5 && box.x + box.width <= vp.width + 0.5 && box.y >= -0.5 && box.y + box.height <= vp.height + 0.5, L + 'Overlay ragt aus dem Fenster');
    if (vp.mobile) assert.ok(Math.abs(box.width - vp.width) < 1 && Math.abs(box.height - vp.height) < 1, L + 'Phone: Vollbild erwartet');
    else assert.ok(box.width >= 700, L + 'Desktop: großer Dialog erwartet');
    // Fokusfalle
    assert.equal(await page.evaluate(() => document.getElementById('highscore-card').contains(document.activeElement)), true);
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.getElementById('highscore-card').contains(document.activeElement)), true, L + 'Fokus verlässt Overlay'); }
    // Tabs: alle Spiele, auch pausierte
    await page.locator('#tab-tower-btn').click();
    assert.equal(await page.evaluate(() => activeGameCategory), 'tower');
    assert.match(await page.locator('#leaderboard-body').innerText(), /Tester/);
    assert.equal(await page.locator('#leaderboard-game-link').getAttribute('aria-disabled'), 'true');
    assert.match(await page.locator('#leaderboard-game-link').textContent(), /Überarbeitung/);
    // Zum Spiel bei pausiertem Spiel: nichts passiert, Overlay bleibt
    await page.locator('#leaderboard-game-link').click({ force: true });
    assert.equal(await page.locator('#highscore-card.show').count(), 1);
    assert.equal(await page.locator('#tower-view').isVisible(), false);
    assert.equal(await page.locator('#game-launch-view').isVisible(), false);
    assert.equal(await page.locator('#game-session-dialog').isVisible(), false);
    // Schließen mit Esc
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#highscore-card.show').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'header-leaderboard-btn');
    // Schließen mit ✕
    await page.locator('#header-leaderboard-btn').click(); await page.locator('#close-leaderboard-btn').click();
    assert.equal(await page.locator('#highscore-card.show').count(), 0);

    // Spielübersicht: einheitliche Kacheln
    await page.locator('#menu-btn').click(); await page.locator('#games-menu-view').waitFor({ state: 'visible' }); await page.waitForTimeout(200);
    await noOverflow('Spielmenü'); await shot('tiles');
    assert.equal(await page.locator('.game-state-label').count(), 0, L + 'Label "Jetzt verbessern" muss weg sein');
    await tooSmall('.game-open-action, .game-version-button, .game-rank-ribbon', 'Kacheln');
    const tiles = await page.locator('.game-choice-card').evaluateAll(cs => cs.map(c => { const r = c.getBoundingClientRect(); const kids = [...c.children].map(k => k.className); return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), kids: kids.join('|') }; }));
    assert.equal(new Set(tiles.map(t => t.kids)).size <= 2, true, L + 'Kachelaufbau uneinheitlich');
    const rows = {}; for (const t of tiles) (rows[t.top] = rows[t.top] || []).push(t.h);
    for (const hs of Object.values(rows)) assert.ok(Math.max(...hs) - Math.min(...hs) <= 1, L + 'Kachelhöhen je Zeile ungleich');
    // Rangchip öffnet Overlay
    await page.locator('[data-game-rank="forklift"]').click();
    await page.locator('#highscore-card.show').waitFor();
    assert.equal(await page.evaluate(() => activeGameCategory), 'forklift_v02');
    await page.keyboard.press('Escape');
    // Pausierte Spiele: Knopf aus, keine Navigation
    for (const g of ['tower', 'pacman', 'slots', 'bomber']) {
      assert.equal(await page.locator(`[data-game="${g}"] .game-open-action`).isDisabled(), true);
      await page.locator(`[data-game="${g}"] .game-card-title`).click();
      assert.equal(await page.locator('#games-menu-view').isVisible(), true, L + g + ' hat Übersicht verlassen');
      assert.equal(await page.evaluate(() => HoermannGameSession.state().game), null);
    }
    assert.equal(await page.locator('[data-game="bomber"] [data-game-rank]').count(), 0);
    await page.locator('[data-game-rank="tower"]').click(); await page.locator('#highscore-card.show').waitFor(); await page.keyboard.press('Escape');

    // Startfluss: Kachel -> Bereitschaft -> erst nach "Jetzt spielen" Countdown
    await page.locator('[data-game="mario"] .game-open-action').click();
    await page.locator('#game-session-dialog').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'preview');
    assert.equal(await page.locator('#game-countdown').isVisible(), false);
    assert.equal(await page.locator('#game-session-action').textContent(), 'Jetzt spielen');
    await shot('ready');
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'preview');
    assert.equal(await page.locator('#game-countdown').isVisible(), false);
    await page.locator('#game-session-action').click();
    assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'countdown');
    assert.equal(await page.locator('#game-countdown').isVisible(), true);
    await shot('countdown');
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'paused');
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'countdown');
    await page.evaluate(()=>document.getElementById('exit-mario-btn').click());

    // Overlay -> Zum Spiel: ebenfalls Bereitschaft
    await page.locator('#header-leaderboard-btn').click(); await page.locator('#tab-mario-btn').click();
    await page.locator('#leaderboard-game-link').click();
    await page.locator('#game-session-dialog').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#highscore-card.show').count(), 0);
    assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'preview');
    assert.equal(await page.locator('#game-countdown').isVisible(), false);
    await page.locator('#game-session-action').click();
    assert.equal(await page.evaluate(() => HoermannGameSession.state().phase), 'countdown');
    await page.evaluate(()=>document.getElementById('exit-mario-btn').click());

    // Score speichern -> keine Vollbild-Liste ueber dem Spiel; Kopf-Bestenliste zeigt den eigenen Namen hervorgehoben
    await page.evaluate(() => { promptScoreSubmit(777, 'mario_v02', 'Super Dennis 0.2'); });
    await page.evaluate(() => { saveScoreBtn.click(); });
    assert.equal(await page.locator('#highscore-card.show').count(), 0, 'Speichern oeffnet keine Bestenliste');
    await page.evaluate(() => openGlobalLeaderboard('mario_v02', getLockedPlayerName()));
    await page.locator('#highscore-card.show').waitFor();
    assert.ok(await page.locator('#leaderboard-body tr.highlight').count() >= 1, L + 'eigener Name nicht hervorgehoben');
    await noOverflow('Overlay nach Speichern');
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual([...new Set(external)].filter(u => !u.startsWith('https://fonts.googleapis.com/')), []); /* alles Externe wird blockiert */
    console.log(vp.n + ' ok'); await ctx.close();
  }
  await browser.close(); server.close(); console.log('portal 0.3 ok');
})().catch(e => { console.error(e); process.exit(1); });
