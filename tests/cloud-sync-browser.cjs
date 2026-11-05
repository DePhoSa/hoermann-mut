// Prüft die Cloud-Verdrahtung mit einer Attrappe (kein Netz, keine echten Daten).
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const assert = require('assert');
const root = path.resolve(__dirname, '..');
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  for (const vp of [{ width: 1360, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport: vp }); const external = []; const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(u => !u.href.startsWith(origin), r => { external.push(r.request().url()); r.abort(); });
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `
      window.__pub=[]; let cb=null;
      window.HoermannCloud={uid:'u1',async publish(p){window.__pub.push(p); if(cb) cb([p]);},async start(f,b){cb=f;b('online');f([{type:'SCORE',cat:'buster_v02',name:'Testerin',score:777,date:'Heute'},{type:'CHAT_MSG',msg:{id:'m1',sender:'Gast',text:'Hallo aus der Cloud',ts:Date.now()}}]);}};` }));
    await page.goto(origin + '/index.html'); await page.waitForTimeout(800);
    assert.deepStrictEqual(errors, []);
    const state = await page.evaluate(() => ({ lb: JSON.parse(localStorage.getItem('hoermann_lb_buster_v02')).some(e => e.name === 'Testerin' && e.score === 777), chat: JSON.parse(localStorage.getItem('hoermann_mut_live_chat_v3')).messages.some(m => m.id === 'm1'), badge: document.getElementById('cloud-sync-badge').textContent }));
    assert.ok(state.lb, 'Cloud-Score kam nicht an'); assert.ok(state.chat, 'Cloud-Chat kam nicht an');
    await page.evaluate(() => broadcastSingleScoreLive('buster_v02', { name: 'Ich', score: 5, date: 'Heute' }));
    assert.strictEqual(await page.evaluate(() => window.__pub.some(p => p.type === 'SCORE' && p.name === 'Ich')), true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(vp.width + 'px ok, Überbreite:', overflow, 'externe Anfragen blockiert:', [...new Set(external.map(u => new URL(u).host))].join(',') || '-');
    await page.close();
  }
  await browser.close(); server.close(); console.log('cloud sync ok');
})().catch(e => { console.error(e); process.exit(1); });
