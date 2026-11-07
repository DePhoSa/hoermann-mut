const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const { execFileSync } = require('node:child_process');
const S = require('../js/core/05-stats.js');

test('dayKey und docId', () => {
  assert.equal(S.dayKey(new Date(2026, 10, 6, 23, 59).getTime()), '2026-11-06');
  assert.equal(S.docId('2026-11-06', 'mario'), '2026-11-06__mario');
  assert.deepEqual(S.lastDays(3, new Date(2026, 0, 2, 12).getTime()), ['2026-01-02', '2026-01-01', '2025-12-31']);
});
test('add ignoriert unbekannte Spiele/Felder/Nullwerte', () => {
  const p = {}; S.add(p, 'd', 'tetris', 'rounds', 1); S.add(p, 'd', 'mario', 'name', 1); S.add(p, 'd', 'mario', 'rounds', 0); S.add(p, 'd', 'mario', 'rounds', -2);
  assert.equal(S.hasPending(p), false);
  S.add(p, 'd', 'mario', 'rounds', 1); S.add(p, 'd', 'mario', 'rounds', 2); S.add(p, 'd', 'mario', 'secs', 12.6);
  assert.deepEqual(p['d|mario'].d, { rounds: 3, secs: 13 });
});
test('takeBatches leert und teilt an den Obergrenzen der Regeln', () => {
  const p = {}; S.add(p, 'd', 'buster', 'rounds', 250); S.add(p, 'd', 'buster', 'secs', 15000); S.add(p, 'd', 'nerve', 'aborts', 1);
  const b = S.takeBatches(p);
  assert.equal(S.hasPending(p), false);
  const buster = b.filter(x => x.game === 'buster');
  assert.equal(buster.length, 3);
  for (const x of b) for (const [k, v] of Object.entries(x.d)) assert.ok(v > 0 && v <= S.CAPS[k], k + ' ' + v);
  assert.equal(buster.reduce((a, x) => a + (x.d.rounds || 0), 0), 250);
  assert.equal(buster.reduce((a, x) => a + (x.d.secs || 0), 0), 15000);
});
test('summarize/Kennzahlen', () => {
  const m = S.summarize([{ rounds: 10, finished: 6, secs: 600, restarts: 4, aborts: 3, players: 2 }, { rounds: 10, finished: 8, secs: 400, restarts: 6, aborts: 1, players: 3 }]);
  assert.deepEqual(m, { rounds: 20, players: 5, finishRate: 0.7, avgSecs: 50, restartsPerRound: 0.5, abortRate: 0.2 });
  const e = S.summarize([]); assert.equal(e.rounds, 0); assert.equal(e.finishRate, null);
});
test('Hinweistexte', () => {
  const v = o => S.verdict(S.summarize([Object.assign({ rounds: 20, finished: 15, secs: 1200, restarts: 2, aborts: 2, players: 4 }, o)]));
  assert.equal(S.verdict(S.summarize([])), 'noch keine Daten');
  assert.equal(v({ rounds: 5 }), 'wenig gespielt');
  assert.equal(v({ aborts: 12 }), 'hohe Abbruchquote');
  assert.equal(v({ secs: 200 }), 'Runden sehr kurz');
  assert.equal(v({ finished: 5 }), 'wird selten zu Ende gespielt');
  assert.equal(v({ restarts: 20 }), 'wird gern wiederholt');
  assert.equal(v({}), 'unauffällig');
});
test('perGame filtert Spiel und Tage', () => {
  const docs = [{ game: 'mario', day: 'a', rounds: 3 }, { game: 'mario', day: 'old', rounds: 99 }, { game: 'buster', day: 'a', rounds: 1 }];
  const r = S.perGame(docs, ['a']);
  assert.equal(r.length, 5); assert.equal(r.find(x => x.game === 'mario').rounds, 3); assert.equal(r.find(x => x.game === 'forklift').rounds, 0);
});

/* Offline-Prüfung der Regeln: Klammern/Anführungszeichen, definierte Funktionen, bestehende Regeln unverändert. */
test('firestore.rules: Syntax-Grobprüfung und unveränderte Altregeln', () => {
  const root = path.resolve(__dirname, '..');
  const rules = fs.readFileSync(path.join(root, 'firebase/firestore.rules'), 'utf8');
  const code = rules.replace(/\/\/.*$/gm, '');
  const stack = []; const pairs = { ')': '(', ']': '[', '}': '{' }; let q = null;
  for (const ch of code) {
    if (q) { if (ch === q) q = null; continue; }
    if (ch === "'") { q = ch; continue; }
    if ('([{'.includes(ch)) stack.push(ch);
    else if (pairs[ch]) assert.equal(stack.pop(), pairs[ch], 'Klammer ' + ch);
  }
  assert.equal(q, null, 'offenes Anführungszeichen'); assert.deepEqual(stack, []);
  const defined = new Set([...code.matchAll(/function\s+(\w+)\s*\(/g)].map(m => m[1]));
  const builtins = new Set(['exists', 'existsAfter', 'get', 'getAfter', 'hasOnly', 'diff', 'affectedKeys', 'keys', 'size', 'lower', 'if', 'function', 'return']);
  for (const m of code.matchAll(/(?<![\w$])(\w+)\s*\(/g)) assert.ok(defined.has(m[1]) || builtins.has(m[1]), 'unbekannte Funktion ' + m[1]);
  for (const m of code.matchAll(/:\s*if\b([^;]*);/g)) assert.ok(!/(&&|\|\|)\s*$/.test(m[1].trim()), 'Bedingung endet mit Operator');
  const strip = t => t.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
  let old = '';
  try { old = execFileSync('git', ['show', 'origin/main:firebase/firestore.rules'], { cwd: root, encoding: 'utf8' }); } catch { return; }
  let pos = 0; const now = strip(rules);
  for (const line of old.split('\n').map(strip).filter(Boolean)) { const i = now.indexOf(line, pos); assert.ok(i >= 0, 'Altregel verändert: ' + line); pos = i; }
  assert.match(rules, /match \/\{statsCol\}\/\{statsId\}\/players\/\{pid\}/);
  assert.doesNotMatch((rules.split('match /{statsCol}')[1] || '').replace(/\/\/.*$/gm, ''), /allow\s+(delete|write)/);
});
