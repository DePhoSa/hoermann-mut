// Mobil-Layout des Portals (390x844, 360x740): kein Überlauf, Touch-Ziele, Chat bedienbar. Kein Netz, Cloud-Attrappe.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const assert = require('assert');
const root = path.resolve(__dirname, '..');
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 740 }]) {
    const page = await browser.newPage({ viewport: vp, hasTouch: true, isMobile: true }); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(u => !u.href.startsWith(origin), r => r.abort());
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.__pub=[];window.HoermannCloud={uid:'u1',async publish(p){window.__pub.push(p)},async start(f,b){b('online');f([]);}};` }));
    await page.goto(origin + '/index.html'); await page.waitForTimeout(600);
    const noOverflow = async label => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), vp.width + ' ' + label + ': horizontaler Überlauf');
    const small = async (sel, label) => { const bad = await page.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [e.id || e.textContent.trim().slice(0, 20), Math.round(r.width), Math.round(r.height)]; }).filter(x => x[2] < 43 || x[1] < 43), sel); assert.deepStrictEqual(bad, [], vp.width + ' ' + label + ' zu klein'); };
    await noOverflow('Start');
    for (const id of ['mut-btn', 'menu-btn']) assert.ok(await page.isVisible('#' + id));
    await small('#mut-btn, #menu-btn, #sound-toggle-btn, #reset-view-btn', 'Startseite');
    await page.click('#menu-btn'); await page.waitForTimeout(300);
    await noOverflow('Spielmenü');
    await small('.game-open-action, .game-version-button, .game-rank-ribbon', 'Spielkarten');
    assert.ok(await page.locator('.game-choice-card').count() >= 8);
    await page.click('#header-leaderboard-btn'); await page.waitForTimeout(300);
    await noOverflow('Bestenliste'); await page.keyboard.press('Escape');
    await page.click('#chat-fab'); await page.waitForTimeout(150);
    await page.fill('#chat-sender-input', 'Tester'); await page.fill('#chat-text-input', 'Hallo mobil');
    assert.ok(await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('chat-text-input')).fontSize) >= 16), 'Chat-Eingabe < 16px (iOS-Zoom)');
    await page.click('#chat-send-btn'); await page.waitForTimeout(300);
    assert.ok((await page.textContent('#chat-messages-list')).includes('Hallo mobil'), 'Chat-Nachricht fehlt');
    await small('#chat-send-btn, #toggle-emoji-tray-btn, #toggle-gif-tray-btn, #chat-close-btn', 'Chat');
    await page.click('#toggle-gif-tray-btn'); await noOverflow('GIF-Tray');
    assert.deepStrictEqual(errors, []);
    console.log(vp.width + 'x' + vp.height + ' ok'); await page.close();
  }
  await browser.close(); server.close(); console.log('portal mobile ok');
})().catch(e => { console.error(e); process.exit(1); });
