// Cache-Busting: jedes lokale <script src> und <link href> in index.html trägt ?v=<Version> und
// diese stimmt mit version.json (und APP_VERSION im Code) überein. Sonst laden Spieler nach einem
// Update alte Dateien aus dem Browser-Zwischenspeicher.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;

const refs = [
  ...[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]),
  ...[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)].map(m => m[1]),
  ...[...html.matchAll(/<link\b[^>]*\bhref="([^"]+)"[^>]*\brel="stylesheet"/g)].map(m => m[1]),
].filter(u => !/^(https?:)?\/\//.test(u));

test('es gibt lokale Skripte/Styles', () => { assert.ok(refs.length >= 20, 'nur ' + refs.length + ' lokale Verweise gefunden'); });

test('jeder lokale Verweis hat ?v=<version.json>', () => {
  const bad = refs.filter(u => { const m = u.match(/\?v=([^&#]+)$/); return !m || m[1] !== version; });
  assert.deepStrictEqual(bad, [], `Verweise ohne/mit falschem ?v= (erwartet ${version}): ${bad.join(', ')}`);
});

test('jede referenzierte Datei existiert', () => {
  const missing = refs.map(u => u.split('?')[0]).filter(f => !fs.existsSync(path.join(root, f)));
  assert.deepStrictEqual(missing, []);
});

test('alle Dateien in js/ sind in index.html eingebunden (keine vergessene Spieldatei)', () => {
  const files = [];
  for (const d of ['js/core', 'js/games']) for (const f of fs.readdirSync(path.join(root, d))) if (f.endsWith('.js')) files.push(d + '/' + f);
  const used = refs.map(u => u.split('?')[0]);
  assert.deepStrictEqual(files.filter(f => !used.includes(f)), []);
});

test('APP_VERSION im Code und sichtbare Version in index.html passen zu version.json', () => {
  const core = fs.readFileSync(path.join(root, 'js/core/03-cloud-hub.js'), 'utf8');
  assert.ok(core.includes(`APP_VERSION           = '${version}'`), 'APP_VERSION != version.json');
  assert.ok(html.includes(`Version ${version}`), 'sichtbare "Version x.y.z" in index.html != version.json');
});

test('Zwangsupdate: neue index.html bleibt für verifyAndPrefetchNewHtml prüfbar', () => {
  // verifyAndPrefetchNewHtml (js/core/03-cloud-hub.js) lädt die neue index.html und verlangt "Version <neu>",
  // "</html>" und mehr als 50000 Zeichen. Die index.html muss das auch ohne den ausgelagerten Code erfüllen.
  assert.ok(html.includes('</html>') && html.length > 50000, 'index.html zu klein/unvollständig: ' + html.length);
  const hub = fs.readFileSync(path.join(root, 'js/core/03-cloud-hub.js'), 'utf8');
  assert.ok(hub.includes("htmlText.length > 50000") && hub.includes('Version ${targetVersion}'), 'Prüflogik geändert: Test anpassen');
});
