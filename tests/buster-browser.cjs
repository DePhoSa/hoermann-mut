// Zweifel-Buster 0.3: Treffer-Flaeche auf dem Handy (>= 44 px wirksam), Combo-/Fehlklick-Logik per Bot (Trefferquoten),
// echte Eingaben (Maus bzw. Touch), nichts abgeschnitten. Kein Netz, Cloud als Attrappe.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const os = require('os'); const assert = require('assert');
const root = path.resolve(__dirname, '..'); const shots = process.env.SHOTS_DIR || os.tmpdir();
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  const viewports = [{ name: 'desktop', width: 1360, height: 900 }, { name: 'dpr15', width: 1280, height: 720, deviceScaleFactor: 1.5 }, { name: 'phone390', width: 390, height: 844, isMobile: true, hasTouch: true }, { name: 'phone360', width: 360, height: 740, isMobile: true, hasTouch: true }];
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    await ctx.addInitScript(() => { if (!localStorage.getItem('qa-seeded')) { localStorage.setItem('hoermann_locked_player_name_v1', 'QA Buster'); localStorage.setItem('hoermann_player_name', 'QA Buster'); localStorage.setItem('qa-seeded', 'yes'); } });
    const page = await ctx.newPage(); const errors = []; const external = [];
    page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(10000);
    await page.route(u => !u.href.startsWith(origin), r => { external.push(r.request().url()); r.abort(); });
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.HoermannCloud={uid:'u1',async publish(){},async start(f,b){b('online');f([]);}};` }));
    await page.goto(origin + '/index.html'); await page.waitForFunction(() => typeof HoermannGameSession !== 'undefined');
    await page.locator('#menu-btn').click(); await page.locator('[data-game="buster"] .game-open-action').click();
    if (/Verstanden/.test(await page.locator('#game-session-action').textContent())) await page.locator('#game-session-action').click();
    await page.locator('#game-session-action').click();
    await page.waitForFunction(() => HoermannGameSession.state().phase === 'playing', null, { timeout: 6000 });
    const tag = vp.name;
    // Alles sichtbar, nichts quer, kein Zoom/Scroll auf der Spielflaeche
    const geo = await page.evaluate(() => { busterCanvas.scrollIntoView({ block: 'center' }); const r = busterCanvas.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, iw: innerWidth, ih: innerHeight, over: document.documentElement.scrollWidth > innerWidth, ta: getComputedStyle(busterCanvas).touchAction }; });
    assert.ok(geo.l >= 0 && geo.r <= geo.iw + 0.5, 'Canvas quer abgeschnitten ' + tag + JSON.stringify(geo)); assert.ok(geo.t >= 0 && geo.b <= geo.ih, 'Canvas vertikal nicht komplett sichtbar ' + tag + JSON.stringify(geo));
    assert.equal(geo.over, false, 'Ueberbreite ' + tag); assert.equal(geo.ta, 'none', 'touch-action ' + tag);
    // Einzelnes Ziel (Radius 32 = kleinstes); Math.random fest, damit der Spawner ruht
    const setTarget = () => page.evaluate(() => { Math.random = () => 0.99; busterScore = 100; busterCombo = 0; updateBusterCombo(); targets = [{ x: 320, y: 180, radius: 32, life: 9999, maxLife: 9999, isPowerup: false, text: 'Angst' }]; });
    const scale = geo.w / 640;
    const tapAt = async cssDx => { const x = geo.l + 320 * scale + cssDx, y = geo.t + 180 * scale; if (vp.hasTouch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
    // Wirksam >= 44 px: Treffer bei 21 CSS-px Abstand (sichtbarer Radius auf dem Handy nur ~15 px)
    await setTarget(); await tapAt(21);
    let st = await page.evaluate(() => ({ score: busterScore, combo: busterCombo, n: targets.length }));
    // Ein Tipp = genau ein Ereignis: 100+35, Combo 1, kein nachfolgender Fehlklick
    assert.deepEqual(st, { score: 135, combo: 1, n: 0 }, 'Treffer/Doppelausloesung ' + tag);
    // weit daneben bleibt Fehlklick: -15, Combo 0, Ziel bleibt
    await setTarget(); await tapAt(80);
    st = await page.evaluate(() => ({ score: busterScore, combo: busterCombo, n: targets.length })); assert.deepEqual(st, { score: 85, combo: 0, n: 1 }, 'Fehlklick ' + tag);
    // Bot-Szenarien (Trefferquote) gegen die Regel
    const bot = await page.evaluate(() => {
      const rules = HoermannGameReleases; const out = {}; const rect = busterCanvas.getBoundingClientRect();
      const fire = (cx, cy) => busterCanvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: rect.left + cx * rect.width / 640, clientY: rect.top + cy * rect.height / 360 }));
      const patterns = { alle: () => true, achtzig: i => i % 5 !== 4, fuenfzig: i => i % 2 === 0, keine: () => false, einMiss: i => i !== 26 };
      for (const [name, pattern] of Object.entries(patterns)) {
        busterScore = 0; busterCombo = 0; updateBusterCombo(); let exp = 0, ec = 0, maxF = 1;
        for (let i = 0; i < 60; i++) {
          const hit = pattern(i), pow = i % 7 === 3;
          targets = hit ? [{ x: 320, y: 180, radius: 32, life: 9999, maxLife: 9999, isPowerup: pow, text: 'X' }] : [];
          if (hit) { ec++; exp += rules.award(pow ? 100 : 35, ec); } else { exp = Math.max(0, exp - 15); ec = 0; }
          maxF = Math.max(maxF, rules.comboFactor(ec));
          fire(hit ? 320 : 5, hit ? 180 : 355);
        }
        out[name] = { score: busterScore, exp, combo: busterCombo, ec, maxF };
      }
      return out;
    });
    for (const [k, v] of Object.entries(bot)) { assert.equal(v.score, v.exp, `Bot ${k} ${tag} ${JSON.stringify(v)}`); assert.equal(v.combo, v.ec); assert.ok(v.maxF <= 1.25 + 1e-9); }
    assert.ok(bot.alle.score > bot.einMiss.score && bot.einMiss.score > bot.achtzig.score && bot.achtzig.score > bot.fuenfzig.score && bot.fuenfzig.score > bot.keine.score, 'Wertung steigt mit Trefferquote ' + tag + JSON.stringify(bot));
    assert.equal(bot.keine.score, 0);
    await page.screenshot({ path: path.join(shots, `buster-${tag}.png`) });
    // Ende bei 0 s: Anzeige zeigt 0s (nicht 1s)
    await page.evaluate(() => { busterElapsed = 29.9999; });
    await page.waitForFunction(() => !busterActive, null, { timeout: 4000 });
    assert.equal(await page.locator('#buster-time').textContent(), '0s', 'Restzeit am Ende ' + tag);
    assert.deepEqual(errors, [], 'JS-Fehler ' + tag); if (external.length) console.log('blockiert:', external.length);
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log('PASS: buster 0.3 Trefferflaeche, Doppelausloesung, Miss/Combo-Bot, 4 Bildschirme');
})().catch(e => { console.error(e); process.exit(1); });
