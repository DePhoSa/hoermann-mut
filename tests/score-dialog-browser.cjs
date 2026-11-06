// Ergebnis-Dialog: Rekord mit festem Namen wird automatisch gespeichert, niedrigeres Ergebnis nicht, Erstspieler waehlt Namen.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.resolve(__dirname, '..');
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  for (const vp of [{ width: 1360, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: vp }); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(u => !u.href.startsWith(origin), r => r.abort());
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.__pub=[];window.HoermannCloud={uid:'t',async isAdmin(){return false},async publish(p){window.__pub.push(p)},async start(f,b){b('online')}};` }));
    await page.goto(origin + '/index.html'); await page.waitForTimeout(500);
    const st = () => page.evaluate(() => ({ dlg: document.getElementById('score-submit-dialog').classList.contains('show'), lb: document.getElementById('highscore-card').classList.contains('show'), title: document.getElementById('submit-dialog-title').textContent, fb: document.getElementById('submit-highscore-feedback').textContent, btn: document.getElementById('save-score-btn').textContent, best: (JSON.parse(localStorage.getItem('hoermann_lb_mario_v02') || '[]').find(e => e.name === 'Tester') || {}).score }));
    // Erstspieler ohne Namen: Dialog mit Namenswahl, kein Auto-Save
    await page.evaluate(() => promptScoreSubmit(100, 'mario_v02', 'Super Dennis 0.2'));
    let s = await st(); assert.ok(s.dlg, 'Erstspieler: Dialog erwartet'); assert.ok(!s.best, 'Erstspieler: nichts gespeichert'); assert.strictEqual(s.btn, 'Speichern');
    assert.ok(await page.evaluate(() => !document.getElementById('score-dialog-board-btn') && getComputedStyle(document.getElementById('idea-ticket-box')).display === 'none'), 'Kompaktes Blatt: keine Bestenliste-Taste, Idee eingeklappt');
    await page.fill('#player-name-input', 'Tester'); await page.click('#save-score-btn'); await page.waitForTimeout(300);
    s = await st(); assert.strictEqual(s.best, 100); assert.ok(!s.dlg && !s.lb, 'nach Speichern weder Dialog noch Vollbild-Bestenliste');
    // Fester Name + neuer Rekord: automatisch gespeichert, Dialog erscheint nicht
    await page.evaluate(() => promptScoreSubmit(250, 'mario_v02', 'Super Dennis 0.2')); await page.waitForTimeout(300);
    s = await st(); assert.strictEqual(s.best, 250, 'Auto-Save fehlt'); assert.ok(!s.dlg && !s.lb, 'Auto-Save oeffnet keine Bestenliste');
    assert.ok(await page.evaluate(() => window.__pub.some(p => p.type === 'SCORE' && p.score === 250)), 'Cloud-Score nicht gesendet');
    // Niedrigeres Ergebnis: kein Speichern, kurze Meldung, Hauptknopf gesperrt
    await page.evaluate(() => promptScoreSubmit(50, 'mario_v02', 'Super Dennis 0.2')); await page.waitForTimeout(300);
    s = await st(); assert.strictEqual(s.best, 250); assert.ok(s.dlg); assert.match(s.fb, /Bestwert bleibt 250/); assert.ok(s.fb.length < 80, 'Meldung zu lang');
    assert.ok(await page.evaluate(() => document.getElementById('save-score-btn').disabled));
    assert.deepStrictEqual(errors, []); console.log(vp.width + 'px ok'); await page.close();
  }
  await browser.close(); server.close(); console.log('score dialog ok');
})().catch(e => { console.error(e); process.exit(1); });
