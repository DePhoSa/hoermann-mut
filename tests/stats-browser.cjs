// Spielstatistik: Zähler, Flush (60 s / pagehide), nichts ohne Runde, stilles Scheitern, Admin-Reiter. Cloud-Attrappe, kein Netz.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const assert = require('assert');
const root = path.resolve(__dirname, '..'); const shots = process.env.SHOTS || '';
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  const mock = `window.__calls=[];window.__fail=false;
    window.__docs=[];
    window.HoermannCloud={uid:'u1',async isAdmin(){return true},async adminSignIn(){},async publish(){},async start(f,b){b('online');f([]);},
      async statsAdd(day,game,d){window.__calls.push({t:'add',day,game,d});if(window.__fail)throw new Error('permission-denied');},
      async statsPlayer(day,game){window.__calls.push({t:'player',day,game});if(window.__fail)throw new Error('permission-denied');},
      async statsRead(since){return window.__docs;}};`;
  async function open(vp, fail) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600, isMobile: vp.width < 600 }); const page = await ctx.newPage(); const errors = []; page.errors = errors;
    page.on('pageerror', e => errors.push(e.message));
    await page.route(u => !u.href.startsWith(origin), r => r.abort());
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: mock + (fail ? 'window.__fail=true;' : '') }));
    await page.clock.install({ time: new Date('2026-11-06T10:00:00') }); await page.goto(origin + '/index.html'); await page.waitForFunction(() => typeof HoermannGameSession !== 'undefined' && window.HoermannStats);
    return page;
  }
  const play = async (page, game) => { await page.evaluate(g => { document.getElementById('menu-btn')?.click(); }, game); await page.locator('[data-game="' + game + '"] .game-open-action').click(); await page.locator('#game-session-action').click(); };
  const exit = (page, game) => page.evaluate(g => document.getElementById('exit-' + g + '-btn').click(), game);
  const calls = page => page.evaluate(() => window.__calls);

  // 1) Ohne Runde wird nichts gezählt und nichts gesendet
  let page = await open({ width: 1360, height: 900 });
  await page.clock.runFor(130000); await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); });
  assert.deepStrictEqual(await calls(page), [], 'ohne Runde darf nichts gesendet werden');
  assert.deepStrictEqual((await page.evaluate(() => HoermannStats._state())).pending, {});
  // Vorschau ohne Start zählt nicht
  await page.locator('#menu-btn').click(); await page.locator('[data-game="buster"] .game-open-action').click();
  assert.deepStrictEqual((await page.evaluate(() => HoermannStats._state())).pending, {}, 'Vorschau ist keine Runde');
  await page.locator('#game-session-action').click(); await page.clock.runFor(3600); // Runde läuft
  await page.clock.runFor(10000);
  let st = await page.evaluate(() => HoermannStats._state());
  const key = Object.keys(st.pending)[0]; assert.ok(/\|buster$/.test(key)); assert.strictEqual(st.pending[key].d.rounds, 1);
  assert.deepStrictEqual(await calls(page), [], 'vor Ablauf der Minute nichts senden');
  // Rundenende (Spielende) -> finished + Dauer
  await page.evaluate(() => HoermannGameSession.finish());
  st = await page.evaluate(() => HoermannStats._state());
  assert.strictEqual(st.pending[key].d.finished, 1); assert.ok(st.pending[key].d.secs >= 9 && st.pending[key].d.secs <= 11, 'Dauer ' + st.pending[key].d.secs);
  // Nochmal spielen
  await page.evaluate(() => HoermannGameSession.restartWithCountdown()); await page.clock.runFor(3600); await page.clock.runFor(5000);
  st = await page.evaluate(() => HoermannStats._state());
  assert.strictEqual(st.pending[key].d.restarts, 1); assert.strictEqual(st.pending[key].d.rounds, 2);
  // Pause zählt nicht in die Dauer
  const secsBefore = st.pending[key].d.secs;
  await page.keyboard.press('p'); await page.clock.runFor(30000); await page.keyboard.press('Escape'); await page.clock.runFor(3600);
  // Abbruch über Menü (Runde 2 offen)
  await exit(page, 'buster');
  st = await page.evaluate(() => HoermannStats._state());
  assert.strictEqual(st.pending[key].d.aborts, 1);
  assert.ok(st.pending[key].d.secs - secsBefore >= 4 && st.pending[key].d.secs - secsBefore <= 12, 'Pause darf nicht zählen: ' + (st.pending[key].d.secs - secsBefore));
  // Flush nach ~60 s: ein Marker + ein Zähler-Schreibvorgang
  await page.clock.runFor(61000); await page.waitForTimeout(100);
  let c = await calls(page);
  assert.deepStrictEqual(c.map(x => x.t), ['player', 'add'], JSON.stringify(c));
  assert.deepStrictEqual(c[1].d, { rounds: 2, finished: 1, secs: c[1].d.secs, restarts: 1, aborts: 1 });
  assert.ok(Object.keys(c[1].d).every(k => ['rounds', 'finished', 'secs', 'restarts', 'aborts'].includes(k)));
  assert.match(c[1].day, /^\d{4}-\d{2}-\d{2}$/); assert.strictEqual(c[1].game, 'buster');
  assert.ok(!JSON.stringify(c).includes('QA') && !JSON.stringify(c).toLowerCase().includes('name'), 'keine Namen');
  assert.deepStrictEqual((await page.evaluate(() => HoermannStats._state())).pending, {});
  // zweite Runde am selben Tag: kein weiterer Marker; pagehide sendet sofort
  await play(page, 'buster'); await page.clock.runFor(3600); await page.clock.runFor(7000);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.waitForTimeout(100);
  c = await calls(page);
  assert.deepStrictEqual(c.map(x => x.t), ['player', 'add', 'add'], JSON.stringify(c));
  assert.strictEqual(c[2].d.rounds, 1); assert.strictEqual(c[2].d.aborts, 1); assert.ok(c[2].d.secs >= 6);
  // alle fünf Spiele zählen
  for (const g of ['forklift', 'mario', 'nerve', 'parcours']) {
    await page.evaluate(() => { document.getElementById('menu-btn')?.click(); });
    await page.locator('[data-game="' + g + '"] .game-open-action').click(); await page.locator('#game-session-action').click(); await page.clock.runFor(3600);
    const s = await page.evaluate(() => HoermannStats._state()); assert.ok(Object.keys(s.pending).some(k => k.endsWith('|' + g)), g + ' nicht gezählt');
    await exit(page, g);
  }
  assert.deepStrictEqual(page.errors, []); await page.context().close();

  // 2) Regeln noch nicht veröffentlicht: Fehler still, kein Wiederholungssturm, kein UI-Fehler
  page = await open({ width: 1360, height: 900 }, true);
  for (let i = 0; i < 4; i++) { await play(page, 'buster'); await page.clock.runFor(3600); await page.evaluate(() => HoermannGameSession.finish()); await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.waitForTimeout(50); await exit(page, 'buster'); await page.clock.runFor(70000); }
  c = await calls(page); assert.ok(c.length <= 3, 'zu viele Versuche trotz Fehler: ' + c.length);
  assert.deepStrictEqual(page.errors, []); assert.strictEqual(await page.locator('#toast, .toast').filter({ hasText: /Fehler|❌/ }).count(), 0);
  await page.context().close();

  // 3) Admin-Reiter, Desktop und Handy
  for (const vp of [{ width: 1360, height: 900 }, { width: 390, height: 844 }]) {
    page = await open(vp); const tag = vp.width;
    const today = await page.evaluate(() => HoermannStats.dayKey(Date.now()));
    await page.evaluate(d => { window.__docs = [
      { day: d, game: 'buster', rounds: 40, finished: 30, secs: 2400, restarts: 20, aborts: 8, players: 5 },
      { day: d, game: 'mario', rounds: 30, finished: 5, secs: 900, restarts: 3, aborts: 20, players: 4 },
      { day: d, game: 'nerve', rounds: 4, finished: 4, secs: 120, restarts: 0, aborts: 0, players: 2 },
      { day: '2000-01-01', game: 'forklift', rounds: 999, finished: 1, secs: 1, restarts: 0, aborts: 0, players: 9 }]; }, today);
    await page.evaluate(() => { sessionStorage.setItem('hoermann_admin_unlocked', '1'); }); await page.reload(); await page.waitForFunction(() => window.HoermannStats);
    await page.evaluate(d => { window.__docs = [
      { day: d, game: 'buster', rounds: 40, finished: 30, secs: 2400, restarts: 20, aborts: 8, players: 5 },
      { day: d, game: 'mario', rounds: 30, finished: 5, secs: 900, restarts: 3, aborts: 20, players: 4 },
      { day: d, game: 'nerve', rounds: 4, finished: 4, secs: 120, restarts: 0, aborts: 0, players: 2 }]; }, today);
    await page.evaluate(() => document.getElementById('chat-admin-toggle-btn').click());
    if (await page.locator('#chat-admin-login-row').isVisible()) { await page.locator('#chat-admin-login-btn').click(); await page.waitForTimeout(200); }
    await page.locator('#admin-tab-stats-btn').click(); await page.waitForFunction(() => document.querySelector('#admin-stats-body table'));
    const text = await page.locator('#admin-stats-body').innerText();
    assert.ok(/Buster/.test(text) && /75 %/.test(text) && /hohe Abbruchquote/.test(text) && /wenig gespielt/.test(text) && /noch keine Daten/.test(text), text);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), tag + ' Überlauf');
    if (shots) await page.screenshot({ path: `${shots}/stats-admin-${tag}.png` }); assert.ok(await page.evaluate(() => { const b = document.getElementById('admin-stats-body'); return b.scrollWidth <= b.clientWidth + 1; }), tag + ' Tabelle läuft über');
    if (shots) await page.screenshot({ path: `${shots}/stats-admin-${tag}.png` });
    assert.deepStrictEqual(page.errors, []); await page.context().close();
  }
  // 4) Datenschutz-Hinweis im Änderungsverlauf
  page = await open({ width: 390, height: 844 }); await page.locator('#version-changelog-btn').click();
  assert.match(await page.locator('#changelog-privacy').innerText(), /Anonyme Spielstatistik, keine Namen, nur Zähler/);
  if (shots) await page.screenshot({ path: `${shots}/stats-privacy-390.png` });
  await browser.close(); server.close(); console.log('stats browser ok');
})().catch(e => { console.error(e); process.exit(1); });
