// Beweis, dass die Aufteilung der index.html in js/core/* und js/games/* nichts am Verhalten ändert.
// Vergleicht den Stand VOR der Aufteilung (Git-Stand 3.4.0, Commit BASE_REF) mit dem Arbeitsstand.
//   1. Mechanisch: alle js/-Dateien hintereinander == der frühere Inline-Skript-Text (Byte für Byte);
//      die restliche index.html ist bis auf die Skript-Tags identisch.
//   2. Verhalten: gleiche globale Namen (window + Top-Level function/const/let/class, jeweils Typ und
//      Funktionsquelltext), gleiche Seite nach dem Laden, keine Seitenfehler, keine externen Anfragen.
// Aufruf: node tests/split-equivalence.cjs        (BASE_REF=<commit> überschreibt den Vergleichsstand)
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const os = require('os'); const path = require('path');
const cp = require('child_process'); const assert = require('assert');
const root = path.resolve(__dirname, '..');
const BASE_REF = process.env.BASE_REF || '2029791cc260e1041ddfce6aaa50419a9f7bcd80'; // origin/main = Version 3.4.0, vor der Aufteilung

const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png' };
function serve(dir) {
  const server = http.createServer((q, r) => {
    const f = path.join(dir, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!f.startsWith(dir)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
  });
  return new Promise(res => server.listen(0, '127.0.0.1', () => res({ server, origin: 'http://127.0.0.1:' + server.address().port })));
}

// ---- 1. Mechanischer Beweis ----
const SCRIPT_TAG = /^[ \t]*<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>[ \t]*\r?\n/gm;
function inlineScript(html) { // der grosse Inline-Block ohne src
  const all = [...html.matchAll(/<script>\n([\s\S]*?)<\/script>/g)].map(m => m[1]);
  return all.sort((a, b) => b.length - a.length)[0] || '';
}
function localScripts(html) { return [...html.matchAll(/<script\b[^>]*\bsrc="([^"?]+)(\?[^"]*)?"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s)); }

const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mut-base-'));
const ar = cp.spawnSync('sh', ['-c', `git archive ${BASE_REF} | tar -x -C ${baseDir}`], { cwd: root });
if (ar.status !== 0) { console.error('git archive fehlgeschlagen: ' + ar.stderr); process.exit(1); }
const baseHtml = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
const newHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const baseScript = inlineScript(baseHtml).replace(/[ \t]+$/, '');
assert.ok(baseScript.length > 300000, 'Vergleichsstand enthält das grosse Inline-Skript nicht (BASE_REF prüfen)');

const order = localScripts(newHtml);
const split = order.filter(s => s.startsWith('js/'));
assert.ok(split.length >= 12, 'weniger js/-Dateien als erwartet: ' + split.length);
let joined = split.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('');
const rest = inlineScript(newHtml).replace(/[ \t]+$/, ''); // falls noch ein Rest inline steht (Zwischenstände)
joined += rest;
assert.strictEqual(joined.length, baseScript.length, `Länge: neu ${joined.length} vs. alt ${baseScript.length}`);
assert.ok(joined === baseScript, 'Zusammengesetzte js/-Dateien != altes Inline-Skript');
console.log(`[1] Mechanisch OK: ${split.length} Dateien, ${joined.length} Zeichen, ${joined.split('\n').length - 1} Zeilen == altes Inline-Skript`);

// Rest-HTML identisch (Skript-Tags der js/-Dateien und der Inline-Block ausgenommen)
const noInline = h => h.replace(/[ \t]*<script>\n[\s\S]*?<\/script>\n?/g, '');
const noSplitTags = h => h.replace(SCRIPT_TAG, (m, s) => s.startsWith('js/') ? '' : m);
assert.ok(noInline(baseHtml) === noSplitTags(noInline(newHtml)), 'HTML/CSS ausserhalb der Skripte weicht ab');
// Reihenfolge der übrigen Skripte
const others = h => localScripts(h).filter(s => !s.startsWith('js/'));
assert.deepStrictEqual(others(newHtml), others(baseHtml), 'Reihenfolge der übrigen Skript-Tags geändert');
// Position: alle js/-Tags liegen lückenlos an der Stelle des alten Inline-Blocks (zwischen changelog/game-clock und game-session)
const seq = localScripts(newHtml);
const first = seq.findIndex(s => s.startsWith('js/')), last = seq.length - 1 - [...seq].reverse().findIndex(s => s.startsWith('js/'));
assert.ok(seq.slice(first, last + 1).every(s => s.startsWith('js/')), 'js/-Dateien nicht lückenlos');
assert.strictEqual(seq[first - 1], 'game-clock.js'); assert.strictEqual(seq[last + 1], 'game-session.js');
console.log('[1] Rest-HTML identisch, übrige Skript-Reihenfolge und Position der js/-Tags unverändert');

// Doppelte Top-Level-Funktionen (wären beim Aufteilen riskant)
const declRe = /^    (?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^    (?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
const names = []; for (const m of baseScript.matchAll(declRe)) names.push(m[1] || m[2]);
const dup = names.filter((n, i) => names.indexOf(n) !== i);
console.log(`[1] Top-Level-Namen im Quelltext: ${new Set(names).size}, doppelt deklariert: ${[...new Set(dup)].join(', ') || 'keine'}`);

// ---- 2. Verhalten ----
const FIXED = `(() => { let t = 1767268800000; const D = Date; Date.now = () => t;
  // feste Uhr und festes Zufalls-Saatgut, damit beide Läufe vergleichbar sind
  let s = 12345; Math.random = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();`;
const CLOUD = `window.__pub=[]; let cb=null; window.HoermannCloud={uid:'eq-uid',async publish(p){window.__pub.push(p);},async start(f,b){cb=f;b('online');f([]);},async isAdmin(){return false;},async adminSignIn(){}};`;

async function probe(dir, label, candidates) {
  const { server, origin } = await serve(dir);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route(u => !u.href.startsWith(origin), r => { external.push(r.request().url()); r.abort(); });
  await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: CLOUD }));
  await page.addInitScript(FIXED);
  // Auch abgefangene Ausnahmen beim Laden erfassen (z. B. ReferenceError in try/catch), per Debugger-Protokoll
  const cdp = await page.context().newCDPSession(page); const thrown = [];
  cdp.on('Debugger.paused', ev => { const d = ev.data || {}; thrown.push(String((d.description || d.className || ev.reason) + '').split('\n')[0]); cdp.send('Debugger.resume').catch(() => {}); });
  await cdp.send('Debugger.enable'); await cdp.send('Debugger.setPauseOnExceptions', { state: 'all' });
  await page.goto(origin + '/index.html');
  await page.waitForFunction(() => typeof HoermannGameSession !== 'undefined');
  await page.waitForTimeout(1500);
  const thrownAtLoad = thrown.length;
  await page.evaluate(() => { try { nichtVorhandeneFunktion(); } catch (e) {} }); await page.waitForTimeout(100);
  assert.ok(thrown.length > thrownAtLoad, 'Selbsttest: Debugger erfasst abgefangene Ausnahmen nicht');
  thrown.length = thrownAtLoad;
  const data = await page.evaluate((cands) => {
    const g = (0, eval);
    const bindings = {};
    for (const n of cands) {
      try { const v = g(n); bindings[n] = typeof v + (typeof v === 'function' ? ':' + String(v).length + ':' + String(v).slice(0, 80) : ''); }
      catch (e) { bindings[n] = 'ERR:' + e.name; }
    }
    return {
      bindings,
      win: Object.getOwnPropertyNames(window).sort(),
      lsKeys: Object.keys(localStorage).sort(),
      body: document.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g, '').replace(/\s+/g, ' '), // Skript-Tags selbst sind erwartungsgemäß anders
      scripts: [...document.scripts].length,
    };
  }, candidates);
  await browser.close(); server.close();
  return { label, errors, external, thrown, ...data };
}

(async () => {
  const cands = [...new Set(names)].sort();
  const before = await probe(baseDir, 'vorher', cands);
  const after = await probe(root, 'nachher', cands);
  assert.deepStrictEqual(before.errors, [], 'Seitenfehler VORHER: ' + before.errors.join(' | '));
  assert.deepStrictEqual(after.errors, [], 'Seitenfehler NACHHER: ' + after.errors.join(' | '));
  assert.ok(Object.values(after.bindings).filter(v => !v.startsWith('ERR')).length > 400, 'zu wenige gefundene Bindings');
  assert.deepStrictEqual(Object.keys(after.bindings), Object.keys(before.bindings));
  const diff = Object.keys(before.bindings).filter(k => before.bindings[k] !== after.bindings[k]);
  assert.deepStrictEqual(diff.map(k => `${k}: ${before.bindings[k]} -> ${after.bindings[k]}`), [], 'Bindings unterscheiden sich');
  const wdiff = [...new Set([...before.win, ...after.win])].filter(k => before.win.includes(k) !== after.win.includes(k));
  assert.deepStrictEqual(wdiff, [], 'window-Eigenschaften unterscheiden sich');
  assert.deepStrictEqual(after.lsKeys, before.lsKeys, 'localStorage-Schlüssel unterscheiden sich');
  assert.deepStrictEqual(after.thrown, before.thrown, 'Ausnahmen beim Laden (auch abgefangene) unterscheiden sich');
  { let i = 0; while (i < before.body.length && before.body[i] === after.body[i]) i++; assert.ok(before.body === after.body, 'Seiten-DOM unterscheidet sich ab Position ' + i + ': ' + before.body.slice(i - 60, i + 80) + ' <<>> ' + after.body.slice(i - 60, i + 80)); }
  assert.deepStrictEqual(after.external.map(u => new URL(u).host), before.external.map(u => new URL(u).host), 'externe Anfragen unterscheiden sich');
  const refErr = Object.entries(after.bindings).filter(([, v]) => v.startsWith('ERR')).length;
  console.log(`[2] Verhalten OK: ${Object.keys(after.bindings).length} Top-Level-Namen geprüft (${refErr} nicht auflösbar, identisch zu vorher), ${after.win.length} window-Eigenschaften identisch, DOM-Länge ${after.body.length} identisch, keine Seitenfehler, ${after.thrown.length} (auch abgefangene) Ausnahmen beim Laden, identisch zu vorher, ${after.scripts} Skript-Elemente (vorher ${before.scripts}); externe Hosts (blockiert): ${[...new Set(after.external.map(u => new URL(u).host))].join(',') || '-'}`);
  fs.rmSync(baseDir, { recursive: true, force: true });
  console.log('split equivalence ok');
})().catch(e => { console.error(e); process.exit(1); });
