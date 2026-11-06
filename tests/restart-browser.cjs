// Rundenende-Karte + "Nochmal spielen" (Neustart mit 3-2-1-Los, ausser Tor-Parcours: kein Countdown) fuer alle fuenf Spiele.
// Kein Netz, keine echten Daten (Cloud als Attrappe, externe Anfragen blockiert).
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const os = require('os'); const assert = require('assert');
const root = path.resolve(__dirname, '..');
const shots = process.env.SHOTS_DIR || os.tmpdir();
const GAMES = {
  mario: { ends: [['Tod', () => { mLives = 1; dennisHurt(true); }, true], ['Levelsieg', () => { dennisWinLevel(); }, true]] },
  buster: { ends: [['Zeit abgelaufen', () => { busterScore = 120; endBusterGame(); }, true]] },
  forklift: { ends: [['Schicht beendet', () => { flState.score = 300; finishForkliftShift(true); }, true]] },
  nerve: { ends: [['Alarm (0 Punkte)', () => { Math.random = () => 0.99; openMysteryDoor(3); }, false], ['Sichern', () => { Math.random = () => 0; openMysteryDoor(2); nerveCurrentStake = 40; nerveOver = false; bankNerveBtn.disabled = false; bankNerveBtn.click(); }, true]] },
  parcours: { ends: [['0 Tore', () => { parcoursScore = 0; handleParcoursOver(); }, false], ['5 Tore', () => { parcoursScore = 5; handleParcoursOver(); }, true]] },
};
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  const viewports = [{ name: 'desktop', width: 1360, height: 900 }, { name: 'dpr15', width: 1280, height: 720, deviceScaleFactor: 1.5 }, { name: 'phone390', width: 390, height: 844, isMobile: true, hasTouch: true }, { name: 'phone360', width: 360, height: 740, isMobile: true, hasTouch: true }];
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    await ctx.addInitScript(() => { if (!localStorage.getItem('qa-seeded')) { localStorage.setItem('hoermann_locked_player_name_v1', 'QA Restart'); localStorage.setItem('hoermann_player_name', 'QA Restart'); localStorage.setItem('qa-seeded', 'yes'); } });
    const page = await ctx.newPage(); const errors = []; const external = [];
    page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(10000);
    await page.route(u => !u.href.startsWith(origin), r => { external.push(r.request().url()); r.abort(); });
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.HoermannCloud={uid:'u1',async publish(){},async start(f,b){b('online');f([]);}};` }));
    await page.goto(origin + '/index.html'); await page.waitForFunction(() => typeof HoermannGameSession !== 'undefined');
    const phase = () => page.evaluate(() => HoermannGameSession.state().phase);
    const noOverflow = async tag => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Ueberbreite: ' + tag);
    const cardCheck = async tag => {
      const s = await page.locator('#game-end-card').evaluate(el => ({ sh: el.scrollHeight, ch: el.clientHeight, sw: el.scrollWidth, cw: el.clientWidth }));
      assert.ok(s.sh <= s.ch + 1 && s.sw <= s.cw + 1, 'Karte ueberlaeuft (' + tag + ') ' + JSON.stringify(s));
      for (const id of ['#game-end-again', '#game-end-lb', '#game-end-menu']) { const bb = await page.locator(id).boundingBox(); assert.ok(bb.height >= 43.5 && bb.width >= 43.5, id + ' < 44px (' + tag + ') ' + JSON.stringify(bb)); }
    };
    const afterEnd = async savesScore => {
      if (!savesScore) return;
      // Erstspieler ohne festen Namen: Ergebnis-Dialog liegt unter dem Spiel (Bestenliste oeffnet nicht automatisch), Karte bleibt bedienbar.
      await page.locator('#score-submit-dialog.show').waitFor();
      await page.locator('#score-dialog-close-btn').click();
    };
    for (const [game, cfg] of Object.entries(GAMES)) {
      await page.locator('#menu-btn').click();
      await page.locator(`[data-game="${game}"] .game-open-action`).click();
      if (/Verstanden/.test(await page.locator('#game-session-action').textContent())) await page.locator('#game-session-action').click();
      await page.locator('#game-session-action').click();
      /* Tor-Parcours hat bewusst keinen Countdown (eigener Tipp-zum-Starten-Zustand). */
      assert.equal(await phase(), game === 'parcours' ? 'playing' : 'countdown');
      assert.equal(await page.locator(`#restart-${game}-btn`).evaluate(el => { const r = el.getBoundingClientRect(); return (r.width <= 1 && r.height <= 1) || getComputedStyle(el).display === 'none'; }), true, 'altes Neustart-Element sichtbar: ' + game);
      await page.waitForFunction(() => HoermannGameSession.state().phase === 'playing', null, { timeout: 6000 });
      let n = 0;
      for (const [label, force, savesScore] of cfg.ends) {
        n++; const tag = `${vp.name}/${game}/${label}`;
        await page.evaluate(force);
        await afterEnd(savesScore);
        await page.locator('#game-end-card').waitFor({ state: 'visible', timeout: 6000 });
        assert.equal(await phase(), 'finished', tag);
        assert.match(await page.locator('#game-end-again').textContent(), /Nochmal spielen/);
        await page.waitForTimeout(500); await cardCheck(tag); await noOverflow(tag);
        await page.screenshot({ path: path.join(shots, `restart-${vp.name}-${game}-${n}.png`) });
        if (n === 1) {
          await page.locator('#game-end-lb').click(); await page.locator('#highscore-card.show').waitFor();
          assert.equal(await page.locator('#game-end-card').isVisible(), false);
          await page.locator('#close-leaderboard-btn').click(); await page.locator('#game-end-card').waitFor({ state: 'visible' });
        }
        if (n === 1 && !vp.isMobile && !savesScore) await page.keyboard.press(game === 'parcours' ? ' ' : 'Enter'); else await page.locator('#game-end-again').click();
        assert.equal(await phase(), game === 'parcours' ? 'playing' : 'countdown', 'Zustand nach Nochmal spielen ' + tag);
        assert.equal(await page.locator('#game-end-card').isVisible(), false);
        assert.equal(await page.locator('#game-countdown').isVisible(), game !== 'parcours', 'Countdown sichtbar? ' + tag);
        await page.keyboard.press('Escape'); assert.equal(await phase(), 'paused');
        assert.equal(await page.locator('#game-session-restart').isVisible(), true, 'Neu starten im Pausendialog');
        await page.keyboard.press('Escape'); assert.equal(await phase(), 'countdown');
        await page.waitForFunction(() => HoermannGameSession.state().phase === 'playing', null, { timeout: 7000 });
      }
      await page.evaluate(cfg.ends[0][1]);
      await afterEnd(cfg.ends[0][2]);
      await page.locator('#game-end-card').waitFor({ state: 'visible', timeout: 6000 });
      await page.locator('#game-end-menu').click();
      assert.equal(await page.locator('#game-end-card').isVisible(), false);
      await page.reload(); await page.waitForFunction(() => typeof HoermannGameSession !== 'undefined');
    }
    assert.deepStrictEqual(errors, [], vp.name);
    console.log(vp.name + ' ok; externe Anfragen blockiert: ' + ([...new Set(external.map(u => new URL(u).host))].join(',') || '-'));
    await ctx.close();
  }
  await browser.close(); server.close(); console.log('PASS: restart-browser');
})().catch(e => { console.error(e); process.exit(1); });
