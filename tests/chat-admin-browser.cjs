// Chat hinter Button, Ungelesen-Badge, Admin-Dialog: Desktop 1360x900, Phone 390x844 und 360x740. Kein Netz, Cloud-Attrappe.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path'); const assert = require('assert');
const root = path.resolve(__dirname, '..'); const shots = process.env.SHOTS || '';
(async () => {
  const server = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.json') ? 'application/json' : 'text/html' }); r.end(d); } }); });
  await new Promise(r => server.listen(0, r)); const origin = 'http://localhost:' + server.address().port;
  const browser = await chromium.launch();
  for (const vp of [{ width: 1360, height: 900, m: false }, { width: 390, height: 844, m: true }, { width: 360, height: 740, m: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.m, isMobile: vp.m }); const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(u => !u.href.startsWith(origin), r => r.abort());
    await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: `window.__pub=[];window.HoermannCloud={uid:'u1',async isAdmin(){return !!window.__isAdmin},async publish(p){window.__pub.push(p)},async start(f,b){b('online');f([]);}};` }));
    await page.goto(origin + '/index.html'); await page.waitForTimeout(500);
    const tag = vp.width + 'x' + vp.height;
    const noOverflow = async l => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), tag + ' ' + l + ': Ueberlauf');
    const big = async (sel, l) => { const b = await page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.width, r.height]; }, sel); assert.ok(b[0] >= 44 && b[1] >= 44, tag + ' ' + l + ' < 44px ' + b); };
    assert.ok(await page.isVisible('#chat-fab')); assert.ok(!(await page.isVisible('#online-side-chat')), 'Chat darf nicht unter dem Portal stehen');
    await big('#chat-fab', 'Chat-Button'); await noOverflow('zu');
    await page.evaluate(() => { const st = loadChatState(); st.messages.push({ id: 'x1', sender: 'Anna', text: 'Hi', time: '01.01. 10:00', ts: Date.now() + 1000 }, { id: 'x2', sender: 'Anna', text: 'Hi2', time: '01.01. 10:01', ts: Date.now() + 2000 }); saveChatState(st); renderChatMessages(); });
    assert.ok(await page.isVisible('#chat-unread-badge'), 'Badge fehlt'); assert.strictEqual((await page.textContent('#chat-unread-badge')).trim(), '2');
    if (shots) await page.screenshot({ path: `${shots}/${tag}-fab.png` });
    await page.click('#chat-fab'); await page.waitForTimeout(150);
    assert.ok(await page.isVisible('#online-side-chat')); assert.ok(await page.isHidden('#chat-unread-badge'), 'Badge nach Oeffnen weg');
    assert.ok((await page.textContent('#chat-messages-list')).includes('Hi2'));
    await big('#chat-close-btn', 'Schliessen'); await big('#chat-send-btn', 'Senden'); await noOverflow('offen'); if (shots) await page.screenshot({ path: `${shots}/${tag}-open.png` });
    const box = await page.locator('#online-side-chat').boundingBox();
    if (vp.m) assert.ok(box.width >= vp.width - 1 && box.height >= vp.height - 1, tag + ' Vollbild-Sheet ' + JSON.stringify(box)); else assert.ok(box.width <= 420 && box.x + box.width >= vp.width - 1, 'Seitenpanel');
    assert.ok(await page.evaluate(() => document.getElementById('chat-text-input').getBoundingClientRect().bottom <= innerHeight), 'Eingabe sichtbar');
    await page.fill('#chat-sender-input', 'Tester'); await page.fill('#chat-text-input', 'Hallo'); await page.click('#chat-send-btn'); await page.waitForTimeout(250);
    assert.ok((await page.textContent('#chat-messages-list')).includes('Hallo')); assert.ok(await page.evaluate(() => window.__pub.some(p => p.type === 'CHAT_MSG')));
    await page.click('#toggle-gif-tray-btn'); await noOverflow('GIF'); await page.click('#toggle-gif-tray-btn');
    if (shots) await page.screenshot({ path: `${shots}/${tag}-chat.png` });
    await page.click('#chat-close-btn'); assert.ok(await page.isHidden('#online-side-chat'));
    assert.ok(await page.isHidden('#admin-dialog')); await big('#chat-admin-toggle-btn', 'Admin-Link');
    await page.click('#chat-admin-toggle-btn'); assert.ok(await page.isVisible('#admin-dialog'));
    assert.ok(await page.isHidden('#chat-admin-pass-input'), 'kein Passwortfeld mehr'); assert.ok(await page.isHidden('#admin-tab-ideas-btn'), 'Tabs vor Login sichtbar'); assert.ok(await page.isHidden('#admin-chat-pane'));
    await big('#chat-admin-login-btn', 'Login'); await big('#admin-dialog-close', 'Admin schliessen'); await noOverflow('Admin');
    await page.click('#chat-admin-login-btn'); await page.waitForTimeout(200);
    assert.ok(await page.isHidden('#admin-tab-ideas-btn'), 'Nicht-Admin darf nicht entsperren');
    if (shots) await page.screenshot({ path: `${shots}/${tag}-admin-login.png` });
    await page.keyboard.press('Escape'); assert.ok(await page.isHidden('#admin-dialog'));
    await page.evaluate(() => { isAdminUnlocked = true; updateAdminUiState(); });
    await page.click('#chat-admin-toggle-btn');
    for (const id of ['admin-tab-chat-btn', 'admin-tab-ideas-btn', 'admin-tab-renames-btn', 'chat-admin-change-pw-btn']) { assert.ok(await page.isVisible('#' + id), id); await big('#' + id, id); }
    assert.ok(await page.isVisible('#admin-chat-mod-list .chat-delete-btn')); await big('#admin-chat-mod-list .chat-delete-btn', 'Loeschen');
    await page.click('#admin-tab-ideas-btn'); assert.ok(await page.isVisible('#admin-ideas-list'));
    await page.click('#admin-tab-renames-btn'); assert.ok(await page.isVisible('#admin-renames-list'));
    await page.click('#chat-admin-change-pw-btn'); assert.ok(await page.isVisible('#chat-admin-new-pw-input')); await noOverflow('Admin-Tabs');
    await page.click('#admin-tab-chat-btn'); await page.locator('#admin-chat-mod-list .chat-delete-btn').first().click(); await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => window.__pub.some(p => p.type === 'CHAT_DELETE')));
    if (shots) await page.screenshot({ path: `${shots}/${tag}-admin.png` });
    assert.deepStrictEqual(errors, []); console.log(tag + ' ok'); await ctx.close();
  }
  await browser.close(); server.close(); console.log('chat/admin ok');
})().catch(e => { console.error(e); process.exit(1); });
