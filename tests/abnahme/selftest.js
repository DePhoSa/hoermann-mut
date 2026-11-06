#!/usr/bin/env node
// Selbsttest der Pruefungen: baut absichtlich Fehler in die Seite ein und prueft, dass die Abnahme sie meldet.
// Aufruf: node tests/abnahme/selftest.js  (laeuft ca. 10 s)
const assert = require('assert'); const os = require('os'); const fs = require('fs'); const path = require('path');
const { chromium, VIEWPORTS, startServer, Run, openSession } = require('./lib');
(async () => {
  const { server, origin } = await startServer(); const browser = await chromium.launch();
  const run = new Run(fs.mkdtempSync(path.join(os.tmpdir(), 'abnahme-selftest-'))); const vp = VIEWPORTS[2];
  const s = await openSession(browser, run, origin, vp, 'S'); await s.goto();
  await s.page.evaluate(() => {
    const d = document.createElement('div'); d.id = 'fake'; d.style.cssText = 'position:fixed;left:0;top:100px;width:200px;z-index:50;background:#fff';
    d.innerHTML = '<button id=f1 style="width:30px;height:20px">Nochmal</button><button id=f2>Neustart</button><button id=f3 style="width:60px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:block">Ein sehr langer Knopftext</button><button id=f4 style="position:absolute;left:300px;top:0">Weit rechts</button>';
    document.body.append(d);
    const cover = document.createElement('div'); cover.style.cssText = 'position:fixed;left:0;top:90px;width:260px;height:60px;z-index:60;background:rgba(255,0,0,.3)'; document.body.append(cover);
    const wide = document.createElement('div'); wide.style.cssText = 'width:900px;height:10px'; document.body.append(wide);
    console.error('selftest-error');
  });
  await s.page.waitForTimeout(200); await s.step('selbsttest');
  const rules = new Set(run.findings.map(f => f.rule));
  for (const r of ['touch-size', 'covered', 'text-clipped', 'overflow-x', 'duplicate-restart', 'js-error']) assert.ok(rules.has(r), 'Pruefung "' + r + '" hat den eingebauten Fehler NICHT gefunden. Gefunden: ' + [...rules].join(','));
  await s.close(); await browser.close(); server.close(); console.log('Selbsttest ok: alle eingebauten Fehler wurden gefunden (' + [...rules].join(', ') + ')');
})().catch(e => { console.error(e); process.exit(1); });
