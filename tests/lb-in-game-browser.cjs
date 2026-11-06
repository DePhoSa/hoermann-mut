// Bestenliste aus einem laufenden Spiel: Spiel pausiert, Liste sichtbar, danach "Weiter spielen".
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.resolve(__dirname, '..');
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  for (const trigger of ['#header-leaderboard-btn']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.route(u => !u.href.startsWith(origin), r => r.abort());
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.HoermannCloud={uid:'t',async isAdmin(){return false},async publish(){},async start(f,b){b('online')}};` }));
    await page.goto(origin + '/index.html'); await page.waitForTimeout(500);
    await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => /Mut-Spiel/.test(x.textContent)).click(); });
    await page.click('[data-game="forklift"] .game-open-action'); await page.click('#game-session-action'); await page.waitForTimeout(4500);
    const st = () => page.evaluate(() => ({ phase: HoermannGameSession.state().phase, lb: document.getElementById('highscore-card').classList.contains('show'), dlg: !!document.querySelector('#game-session-dialog[open]') }));
    assert.strictEqual((await st()).phase, 'playing');
    await page.click(trigger, { force: true }); await page.waitForTimeout(400);
    let s = await st(); assert.deepStrictEqual([s.phase, s.lb, s.dlg], ['paused', true, false], trigger + ': Spiel muss pausieren und Liste zeigen');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    s = await st(); assert.deepStrictEqual([s.phase, s.lb, s.dlg], ['paused', false, true], trigger + ': nach Schließen "Weiter spielen"');
    await page.click('#game-session-action'); await page.waitForTimeout(300);
    assert.strictEqual((await st()).phase, 'countdown', trigger + ': nach Weiter spielen erst Countdown');
    await page.keyboard.press('p'); await page.waitForTimeout(200);
    assert.strictEqual((await st()).phase, 'paused', trigger + ': Pause waehrend Countdown');
    await page.click('#game-session-action'); await page.waitForTimeout(300);
    assert.strictEqual((await st()).phase, 'countdown', trigger + ': wieder Countdown');
    await page.waitForTimeout(4500);
    assert.strictEqual((await st()).phase, 'playing', trigger + ': danach läuft das Spiel');
    await page.close();
  }
  await browser.close(); server.close(); console.log('leaderboard in game ok');
})().catch(e => { console.error(e); process.exit(1); });
