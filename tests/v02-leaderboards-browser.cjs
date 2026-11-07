// Prüft für alle vier 0.2-Spiele: Ergebnis speichern, in der 0.2-Liste sichtbar, 0.1-Liste bleibt getrennt.
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
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.HoermannCloud={uid:'t',async publish(){},async start(f,b){b('online')}};` }));
    await page.goto(origin + '/index.html'); await page.waitForTimeout(500);
    for (const g of ['forklift', 'mario', 'nerve', 'parcours']) {
      const res = await page.evaluate(async (g) => {
        localStorage.setItem('hoermann_locked_player_name_v1', 'Tester'); localStorage.setItem('hoermann_player_name', 'Tester');
        promptScoreSubmit(4321, g + '_v02', g + ' 0.2');
        document.getElementById('player-name-input') && (document.getElementById('player-name-input').value = 'Tester');
        saveScoreBtn.click(); await new Promise(r => setTimeout(r, 300));
        const lb = k => (JSON.parse(localStorage.getItem('hoermann_lb_' + k) || '[]')).some(e => e.name === 'Tester' && e.score === 4321);
        return { v02: lb(g + '_v02'), old: lb(g), title: document.getElementById('global-lb-title').textContent, rel: HoermannGameReleases.release(g).notes.length };
      }, g);
      assert.ok(res.v02, g + ': nicht in 0.2-Liste'); assert.ok(!res.old, g + ': fälschlich in 0.1-Liste'); assert.match(res.title, /0\.2/, g + ': Titel'); assert.ok(res.rel >= 4, g + ': Update-Hinweise fehlen');
    }
    assert.deepStrictEqual(errors, []); console.log(vp.width + 'px ok'); await page.close();
  }
  await browser.close(); server.close(); console.log('v02 leaderboards ok');
})().catch(e => { console.error(e); process.exit(1); });
