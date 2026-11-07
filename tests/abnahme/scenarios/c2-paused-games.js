// P. DIAGNOSE der zwei pausierten Spiele Tower of Mut und Hoermann Mut-Man (nicht Teil des normalen Laufs).
//    Aufruf: ABNAHME_ONLY=P node tests/abnahme/run.js        (optional ABNAHME_VP=desktop,laptop15,phone390)
//    Die Spiele sind im Portal pausiert (status 'Ueberarbeitung' / 'Coming soon'). Nur in der Testseite wird die Pause
//    aufgehoben: game-navigation.js wird beim Laden umgeschrieben (kein Eingriff in Dateien des Portals).
//    Alle Befunde werden als "bekannt (pausiertes Spiel)" markiert, damit der Lauf nicht scheitert; sie stehen trotzdem
//    in der Ausgabe und in befunde.json. Gespielt wird mit echten Eingaben (Tastatur, Klick, Touch). Zustand wird nur gelesen.
const fs = require('fs'); const path = require('path');
const { makeInput } = require('../input');
const GAMES = { tower: 'Tower of Mut', pacman: 'Hörmann Mut-Man' };
const KNOWN = 'pausiertes Spiel, Diagnose (docs/DIAGNOSE-TOWER-PACMAN.md)';

const T = s => ms => { s.simMs = (s.simMs || 0) + ms; return s.page.clock.runFor(ms); };
const phase = s => s.page.evaluate(() => HoermannGameSession.state().phase);
const visible = (s, sel) => s.page.locator(sel).first().isVisible().catch(() => false);
const countdownText = s => s.page.evaluate(() => { const e = document.getElementById('game-countdown'); return e && !e.hidden && getComputedStyle(e).display !== 'none' ? e.querySelector('strong').textContent : null; });

// Pause im Portal aufheben (nur in dieser Testseite): Statuszeile durch Startfunktion ersetzen.
async function enablePausedGames(s) {
  await s.page.route(u => /\/game-navigation\.js/.test(u.pathname), async r => {
    const res = await r.fetch(); let body = await res.text();
    body = body.replace("tower: { title: 'Tower of Mut', status: 'Überarbeitung' }", "tower: { title: 'Tower of Mut', start: startTowerGame }")
               .replace("pacman: { title: 'Hörmann Mut-Man', status: 'Coming soon' }", "pacman: { title: 'Hörmann Mut-Man', start: startPacmanGame }");
    await r.fulfill({ response: res, body });
  });
}

async function state(s, g) {
  return s.page.evaluate(g => g === 'tower'
    ? { over: twState.gameOver || twState.victoryAll, score: twState.score, lives: twState.lives, lvl: twState.levelIdx, floor: twState.resse.floor, x: Math.round(twState.resse.x), active: twState.active }
    : { over: !pacState.active, score: pacState.score, lives: pacState.lives, lvl: pacState.level, left: pacState.pelletsLeft, total: pacState.totalPellets, x: Math.round(pacState.player.x), y: Math.round(pacState.player.y), active: pacState.active }, g);
}

// Menue -> Kachel -> Antippen -> (Update-Hinweis?) -> Bereit-Dialog
async function openGame(s, g, inp, notes) {
  await s.page.locator('#menu-btn').click(); await s.page.locator('.games-grid').first().waitFor();
  const card = s.page.locator(`[data-game="${g}"]`);
  if (!(await card.count())) { s.fail(`${g}: keine Kachel im Spiele-Menü`); return false; }
  await card.scrollIntoViewIfNeeded(); await s.step(g + '-kachel');
  await inp.press(`[data-game="${g}"] .game-open-action`);
  const ok = await s.page.locator('#game-session-dialog[open]').waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
  if (!ok) { s.fail(`${g}: kein Bereit-Dialog nach Tipp auf die Kachel`); await s.step(g + '-kein-bereit'); return false; }
  if (/Verstanden/.test(await s.page.locator('#game-session-action').textContent())) { await s.step(g + '-update-hinweis'); await s.page.locator('#game-session-action').click(); }
  const label = (await s.page.locator('#game-session-action').textContent()).trim();
  s.expect(/Jetzt spielen/.test(label), `${g}: Bereit-Dialog hat statt "Jetzt spielen" den Knopf "${label}"`);
  await s.step(g + '-bereit');
  // Läuft das Spiel schon hinter dem Bereit-Dialog? (Zustand zweimal lesen, Zeit laufen lassen)
  const a = await state(s, g); await T(s)(1500); const b = await state(s, g);
  notes.runsBehindDialog = JSON.stringify(a) !== JSON.stringify(b); return true;
}

async function checkCountdown(s, g, tag) {
  const seen = []; let shot = false;
  for (let t = 0; t < 6000; t += 100) {
    const txt = await countdownText(s); if (txt !== null && seen[seen.length - 1] !== txt) seen.push(txt);
    if (txt === '3' && !shot && (shot = true)) await s.step(`${g}-${tag}-countdown-3`);
    if ((await phase(s)) === 'playing') break; await T(s)(100);
  }
  s.expect(seen.join(',') === '3,2,1,Los!', `${g} (${tag}): Countdown zeigt ${JSON.stringify(seen)} statt 3,2,1,Los!`);
}

// Touch-Geraete: keine Tastatur-Anleitungen im sichtbaren Text.
async function noKeyboardHints(s, g) {
  if (!s.vp.touch) return;
  const hits = await s.page.evaluate(g => { const v = document.getElementById(g + '-view'); const out = []; const rx = /Leertaste|WASD|W A S D|Pfeiltasten|\(Leertaste\)|Klick/;
    for (const e of v.querySelectorAll('*')) { if (!e.getClientRects().length || getComputedStyle(e).visibility === 'hidden') continue; const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' '); if (rx.test(own)) out.push(own.trim().slice(0, 60)); }
    return out; }, g);
  s.expect(!hits.length, `${g}: Touch-Gerät zeigt Tastatur-Anleitung: ${hits.join(' | ')}`);
}

// Sichtbar auf der Seite (nicht abgeschnitten): das ganze Spielfeld und die Bedienung ohne Scrollen erreichbar?
async function layoutProbe(s, g, notes) {
  const r = await s.page.evaluate(g => {
    const v = document.getElementById(g + '-view'); const cv = document.getElementById(g + 'Canvas').getBoundingClientRect();
    const ctrl = g === 'tower' ? document.getElementById('tower-jump-btn') : document.getElementById('pac-btn-up');
    const cr = ctrl.getBoundingClientRect();
    return { vh: innerHeight, canvasTop: Math.round(cv.top), canvasBottom: Math.round(cv.bottom), canvasW: Math.round(cv.width), canvasH: Math.round(cv.height), ctrlTop: Math.round(cr.top), ctrlBottom: Math.round(cr.bottom), scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight };
  }, g);
  notes.layout = r;
  s.expect(r.ctrlBottom <= r.vh, `${g}: Steuerung liegt unterhalb des sichtbaren Bildes (${r.ctrlTop}..${r.ctrlBottom} von ${r.vh}); Spielfeld und Steuerung nicht gleichzeitig sichtbar`);
  s.expect(r.canvasTop >= 0 && r.canvasBottom <= r.vh, `${g}: Spielfeld nicht ganz im Bild (${r.canvasTop}..${r.canvasBottom} von ${r.vh})`);
}

// ---------------- Tower of Mut ----------------
async function towerJump(s, inp) { // bevorzugt die Bildschirmtaste (Handy) bzw. Klick auf das Spielfeld (Desktop)
  if (s.vp.touch) await inp.press('#tower-jump-btn'); else { const b = await s.page.locator('#towerCanvas').boundingBox(); await s.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
}
const towerLook = s => s.page.evaluate(() => {
  const r = twState.resse, fl = twState.floorsRuntime[r.floor]; if (!fl) return null;
  const ahead = [];
  for (const h of fl.hazards) { const x = h.type === 'saw' ? h.curX : h.x; const w = h.type === 'saw' ? 24 : h.w; ahead.push({ d: (x - r.x) * r.dir, w, saw: h.type === 'saw' }); }
  for (const e of fl.enemies) if (e.alive) ahead.push({ d: (e.curX - r.x) * r.dir, w: 24, saw: false });
  return { over: twState.gameOver || twState.victoryAll, ground: r.onGround, climbing: r.climbing, dir: r.dir, ahead, ladder: fl.ladder && fl.ladder.active ? Math.abs(r.x - fl.ladder.x) : null, transition: twState.levelTransitionTimer > 0, banner: twState.bannerTimer > 0, speed: TOWER_LEVEL_DEFS[twState.levelIdx].speed };
});
async function playTower(s, inp, notes, budgetMs) {
  const t0 = s.simMs; let jumps = 0;
  for (; s.simMs - t0 < budgetMs; ) {
    const L = await towerLook(s); if (!L || L.over) { notes.botStop = L ? 'over' : 'null'; break; }
    let go = false;
    if (L.ground && !L.climbing && !L.transition) {
      if (L.ladder !== null && L.ladder <= 30) go = true;
      for (const a of L.ahead) { const lead = L.speed * 13; if (a.d > -4 && a.d - a.w / 2 < lead + 8 && a.d - a.w / 2 > lead - 18) go = true; }
    }
    if (go) { await towerJump(s, inp); jumps++; }
    await T(s)(33);
  }
  notes.botJumps = (notes.botJumps || 0) + jumps;
}

// ---------------- Mut-Man ----------------
// Richtungswahl: kuerzester Weg zum naechsten Pellet (BFS), Geister-Felder in der Naehe sind tabu. Nur Lesen, dann Taste/Tipp.
const pacPlan = s => s.page.evaluate(() => {
  const p = pacState.player, TL = PAC_TILE, cols = PAC_COLS, rows = PAC_ROWS; const tx = Math.floor(p.x / TL), ty = Math.floor(p.y / TL);
  const bad = new Set(); for (const g of pacState.ghosts) { if (g.state === 'eaten' || pacState.frightTimer > 120) continue; const gx = Math.floor(g.x / TL), gy = Math.floor(g.y / TL); for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) bad.add((gx + dx) + ',' + (gy + dy)); }
  const wrap = x => (x + cols) % cols; const walk = (x, y) => { if (y < 0 || y >= rows) return false; const c = pacState.grid[y][wrap(x)]; return c !== 2 && c !== 4; };
  const q = [[tx, ty, null]], seen = new Set([tx + ',' + ty]); let pick = null;
  while (q.length) { const [x, y, first] = q.shift(); if ((pacState.grid[y] || [])[x] === 1 || (pacState.grid[y] || [])[x] === 3) { if (first) { pick = first; break; } }
    for (const [dx, dy, name] of [[-1, 0, 'L'], [1, 0, 'R'], [0, -1, 'U'], [0, 1, 'D']]) { const nx = wrap(x + dx), ny = y + dy, k = nx + ',' + ny; if (seen.has(k) || !walk(nx, ny) || (bad.has(k) && !(nx === tx && ny === ty))) continue; seen.add(k); q.push([nx, ny, first || name]); } }
  if (!pick) { // sicherstes Nachbarfeld wählen
    let best = null, bestD = -1; for (const [dx, dy, name] of [[-1, 0, 'L'], [1, 0, 'R'], [0, -1, 'U'], [0, 1, 'D']]) { const nx = tx + dx, ny = ty + dy; if (!walk(nx, ny)) continue; let d = 99; for (const g of pacState.ghosts) d = Math.min(d, Math.abs(g.x / TL - nx) + Math.abs(g.y / TL - ny)); if (d > bestD) { bestD = d; best = name; } } pick = best; }
  return { over: !pacState.active, dir: pick };
});
const PAC_KEYS = { L: ['ArrowLeft', '#pac-btn-left'], R: ['ArrowRight', '#pac-btn-right'], U: ['ArrowUp', '#pac-btn-up'], D: ['ArrowDown', '#pac-btn-down'] };
async function pacSteer(s, inp, d) { const [key, sel] = PAC_KEYS[d]; if (s.vp.touch) await inp.press(sel); else await s.page.keyboard.press(key); }
async function playPacman(s, inp, notes, budgetMs, stopAtLevel2) {
  const t0 = s.simMs; let last = ''; let moves = 0;
  for (; s.simMs - t0 < budgetMs; ) {
    const P = await pacPlan(s); if (P.over) break;
    if (P.dir && P.dir !== last) { await pacSteer(s, inp, P.dir); last = P.dir; moves++; }
    await T(s)(120);
    if (stopAtLevel2 && (await state(s, 'pacman')).lvl >= 2) break;
    if (moves % 7 === 0) last = ''; // gelegentlich erneut senden (Richtung kann verbraucht sein)
  }
  notes.botMoves = (notes.botMoves || 0) + moves;
}

// ---------------- Ergebnis-Weg ----------------
async function scoreFlow(s, g, notes, label) {
  const dlg = s.page.locator('#score-submit-dialog.show');
  const shown = await dlg.waitFor({ timeout: 4000 }).then(() => true).catch(() => false);
  for (let i = 0; i < 20 && !shown; i++) { await T(s)(100); }
  const appeared = shown || (await dlg.count()) > 0;
  notes[label + 'Dialog'] = appeared;
  if (!appeared) { s.fail(`${g}: Nach dem Spielende (${label}) erscheint kein Ergebnis-Dialog`); await s.step(`${g}-${label}-ohne-dialog`); return false; }
  await T(s)(300); await s.step(`${g}-${label}-ergebnis-dialog`);
  const need = await visible(s, '#player-name-input');
  if (need) { await s.page.locator('#player-name-input').fill('Diagnose'); }
  await (s.vp.touch ? s.page.locator('#save-score-btn').tap() : s.page.locator('#save-score-btn').click());
  await T(s)(500); await s.step(`${g}-${label}-gespeichert`);
  const pub = await s.page.evaluate(() => window.__pub.map(p => JSON.stringify(p).slice(0, 160)));
  notes[label + 'Published'] = pub.length; notes[label + 'PubSample'] = pub[0] || '';
  s.expect(pub.length > 0, `${g}: Speichern schickt nichts an die (Attrappen-)Cloud`);
  if (await s.page.locator('#highscore-card.show').count()) { await s.step(`${g}-${label}-bestenliste-offen`); await s.page.locator('#close-leaderboard-btn').click(); await T(s)(300); }
  if (await s.page.locator('#score-submit-dialog.show').count()) { await s.page.locator('#score-dialog-close-btn').click().catch(() => {}); await T(s)(300); }
  return true;
}

// Was sieht der Spieler nach dem Ende, und wie geht es weiter? Zaehlt die sichtbaren Wege zum Neustart.
async function afterEnd(s, g, notes) {
  await T(s)(500); await s.step(`${g}-nach-ende`);
  const info = await s.page.evaluate(g => {
    const vis = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().bottom > 0 && e.getBoundingClientRect().top < innerHeight;
    return { endCard: !!vis(document.getElementById('game-end-card')), restartBtn: !!vis(document.getElementById('restart-' + g + '-btn')), restartRect: (() => { const b = document.getElementById('restart-' + g + '-btn').getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); })(), phase: HoermannGameSession.state().phase };
  }, g);
  notes.afterEnd = info;
  s.expect(info.endCard, `${g}: Nach dem Ende keine Endkarte ("Nochmal spielen") - Einheitlichkeit mit den fünf Portalspielen fehlt (nur kleiner Link "Neustart" ${info.restartRect})`);
  s.expect(info.phase === 'finished', `${g}: Sitzung kennt das Ende nicht (Phase "${info.phase}" statt finished): kein Spielende-Ablauf, kein Pause-Schutz`);
}

async function runGame(s, g, inp, notes) {
  await enablePausedGames(s); await s.goto(); s.simMs = 0;
  if (!(await openGame(s, g, inp, notes))) return;
  s.expect(!notes.runsBehindDialog, `${g}: Spiel läuft hinter dem Bereit-Dialog schon weiter`);
  await layoutProbe(s, g, notes); await noKeyboardHints(s, g);
  await inp.press('#game-session-action');
  s.expect((await countdownText(s)) === '3', `${g}: nach "Jetzt spielen" startet der Countdown nicht bei 3 (${await countdownText(s)})`);
  // Pause im Countdown
  await T(s)(1100); await inp.press(`#${g}-view .game-pause-button`);
  const pd = await s.page.locator('#game-session-dialog[open]').waitFor({ timeout: 3000 }).then(() => true).catch(() => false);
  s.expect(pd, `${g}: Pause-Knopf oeffnet keinen Pause-Dialog`);
  if (pd) { await s.step(`${g}-pause`); await T(s)(1000); await s.page.locator('#game-session-action').click(); }
  await checkCountdown(s, g, 'start');
  const s0 = await state(s, g); const tPlay = s.simMs;
  await s.step(`${g}-spiel-start`);
  // Tastatur-Test (nur Desktop): Tower wirbt mit Leertaste/W/Pfeil hoch.
  if (g === 'tower' && !s.vp.touch) {
    await T(s)(400); let j0 = await s.page.evaluate(() => ({ g: twState.resse.onGround, y: twState.resse.y }));
    await s.page.evaluate(() => document.activeElement && document.activeElement.blur()); // sonst löst Leertaste den fokussierten Pause-Knopf aus
    await s.page.keyboard.press(' '); await T(s)(100); const j1 = await s.page.evaluate(() => ({ g: twState.resse.onGround, y: twState.resse.y }));
    notes.towerSpaceJumps = j1.y < j0.y - 1 || !j1.g; s.expect(notes.towerSpaceJumps, 'tower: Leertaste (in der Anleitung genannt) löst keinen Sprung aus; Tastatursteuerung fehlt');
    await T(s)(1200);
  }
  // Tastatur Mut-Man: Pfeile steuern? (Desktop) wird durch den Bot abgedeckt.
  if (g === 'tower') await playTower(s, inp, notes, 90000); else await playPacman(s, inp, notes, 60000, false);
  const mid = await state(s, g); notes.midState = mid; await s.step(`${g}-mitten-im-spiel`);
  // Pause mittendrin: Zeit muss stehen
  await inp.press(`#${g}-view .game-pause-button`).catch(() => {});
  if (await s.page.locator('#game-session-dialog[open]').count()) {
    const p0 = await state(s, g); await T(s)(1500); const p1 = await state(s, g);
    s.expect(JSON.stringify(p0) === JSON.stringify(p1), `${g}: Spiel läuft während der Pause weiter`);
    await s.step(`${g}-pause-mitten`); await s.page.locator('#game-session-action').click(); await checkCountdown(s, g, 'nach-pause');
  } else s.fail(`${g}: Pause mitten im Spiel nicht möglich`);
  // Spiel verlieren lassen
  if (g === 'tower') {
    let st = await state(s, g);
    if (!st.over && st.floor === 0) { // Tutorial-Erdgeschoss hat nichts Gefährliches: über Level-Direktwahl in Level 3
      await inp.press('[data-tower-lvl="3"]'); await T(s)(300); await s.step('tower-level-direktwahl'); notes.levelSelectUsed = true;
    }
  }
  const tDie = s.simMs; let guard = 0;
  while (!(await state(s, g)).over && guard++ < 1500) { if (g === 'pacman' && guard % 10 === 0) await pacSteer(s, inp, ['L', 'U', 'R', 'D'][guard % 4]); await T(s)(100); }
  const end = await state(s, g); notes.endState = end; notes.simToEndMs = s.simMs - tPlay; notes.idleToEndMs = s.simMs - tDie;
  s.expect(end.over, `${g}: Spiel endet nicht, auch wenn der Bot nichts mehr tut (${JSON.stringify(end)})`);
  await s.step(`${g}-ende`);
  await scoreFlow(s, g, notes, 'ende1');
  await afterEnd(s, g, notes);
  // Weiter spielen: was geht?
  if (g === 'tower') {
    await towerJump(s, inp).catch(() => {}); await T(s)(1000);
    const again = await s.page.locator('#score-submit-dialog.show').count(); notes.towerJumpAfterOver = again ? 'öffnet wieder den Ergebnis-Dialog (kein Neustart)' : 'nichts';
    s.expect(!again, 'tower: Nach dem Ende öffnet Tippen/Springen erneut den Ergebnis-Dialog statt eine neue Runde zu starten');
    if (again) { await s.step('tower-springen-nach-ende'); await s.page.locator('#score-dialog-close-btn').click().catch(() => {}); await T(s)(300); }
  }
  // Neustart
  await inp.press(`#restart-${g}-btn`); await T(s)(400);
  const ph = await phase(s); const st2 = await state(s, g); notes.afterRestart = { phase: ph, state: st2, countdown: await countdownText(s) };
  s.expect(!(st2.over) && st2.active, `${g}: Nach "Neustart" läuft keine neue Runde (${JSON.stringify(st2)})`);
  s.expect((await countdownText(s)) === '3', `${g}: Nach "Neustart" gibt es keinen Countdown (wie bei den Portalspielen); Phase "${ph}"`);
  await s.step(`${g}-neustart`);
  // Bestenliste im Spiel
  await inp.press('#header-leaderboard-btn').catch(() => {}); await T(s)(400);
  const lb = await s.page.locator('#highscore-card.show').count(); notes.headerLb = !!lb;
  if (lb) { await s.step(`${g}-kopf-bestenliste`); notes.phaseInLb = await phase(s); const gl = (await s.page.locator('#leaderboard-game-link').textContent()).trim(); notes.lbLink = gl; s.expect(/Weiter spielen/.test(gl), `${g}: Bestenliste im laufenden Spiel bietet "${gl}" statt "Weiter spielen"`); await s.page.locator('#close-leaderboard-btn').click(); await T(s)(400); await s.step(`${g}-nach-bestenliste`); if (await s.page.locator('#game-session-dialog[open]').count()) { await s.page.locator('#game-session-action').click(); await checkCountdown(s, g, 'nach-bestenliste'); } }
  else s.fail(`${g}: Kopf-Bestenliste öffnet sich im Spiel nicht`);
  // Punkte sichern (Cashout) mitten im Spiel
  if (g === 'tower') { await T(s)(2500); await playTower(s, inp, notes, 6000); } else { await T(s)(2500); await playPacman(s, inp, notes, 6000, false); }
  const sc = (await state(s, g)).score; notes.cashoutScore = sc;
  const cash = `#${g}-cashout-btn`; await inp.press(cash).catch(() => s.fail(`${g}: "Punkte sichern" nicht bedienbar`));
  await T(s)(500);
  const cashDlg = await s.page.locator('#score-submit-dialog.show').count();
  notes.cashoutDialog = !!cashDlg; s.expect(cashDlg || sc <= 0, `${g}: "Punkte sichern" öffnet bei ${sc} Punkten keinen Dialog`);
  await s.step(`${g}-punkte-sichern`);
  const stillRunning = (await state(s, g)).active && !(await state(s, g)).over; notes.cashoutKeepsPlaying = stillRunning;
  notes.phaseAfterCashout = await phase(s);
  s.expect(!stillRunning, `${g}: "Punkte sichern" speichert, aber die Runde läuft hinter dem Dialog weiter (Punkte könnten danach noch wachsen/Leben verloren gehen)`);
  if (cashDlg) { await s.page.locator('#score-dialog-close-btn').click().catch(() => {}); await T(s)(300); }
  // Menue verlassen
  if (await s.page.locator('#game-session-dialog[open]').count()) { await s.page.locator('#game-session-action').click().catch(() => {}); await T(s)(200); }
  await inp.press('#reset-view-btn').catch(e => s.fail(`${g}: Kopf-Knopf "Ansicht zurücksetzen" (✕, einziger Weg zurück) nicht bedienbar (${e.message.split('\n')[0].slice(0, 80)})`)); await T(s)(400);
  const ph2 = await s.page.evaluate(g => ({ view: getComputedStyle(document.getElementById(g + '-view')).display, loop: g === 'tower' ? twState.active : pacState.active, phase: HoermannGameSession.state().phase }), g);
  notes.afterExit = ph2; s.expect(ph2.view === 'none' && !ph2.loop, `${g}: Nach Verlassen (✕ oben) läuft das Spiel im Hintergrund weiter (${JSON.stringify(ph2)})`);
  await s.step(`${g}-menue`);
}

exports.run = async ({ open, vp, run }) => {
  if (vp.name === 'phone360' && !process.env.ABNAHME_ALL_VP) return; // Diagnose: Desktop, Laptop 1,5 und Handy 390 genügen
  const out = {};
  for (const g of Object.keys(GAMES)) {
    const s = await open('P-' + g, { clock: true, seedRandom: 20260611 }); const notes = out[g] = {};
    try { await runGame(s, g, makeInput(s), notes); } catch (e) { notes.abbruch = e.message.split('\n')[0]; s.fail('Abbruch im Ablauf: ' + notes.abbruch); }
    finally { notes.externalRequests = s.external.length; await s.close(); }
  }
  for (const f of run.findings) if (/^P-/.test(f.scenario) && !f.known) f.known = KNOWN;
  // gleiche Befunde aus mehreren Schritten zu einem zusammenfassen (erster Schritt bleibt, "x N Schritte" im Text)
  const groups = new Map(); for (const f of run.findings.slice()) { if (!/^P-/.test(f.scenario)) continue; const k = [f.rule, f.vp, f.scenario, f.el, f.detail].join('|'); const g = groups.get(k); if (g) { g.n++; run.findings.splice(run.findings.indexOf(f), 1); } else groups.set(k, f), f.n = 1; }
  for (const f of groups.values()) if (f.n > 1) f.detail += ` (in ${f.n} Schritten)`;
  fs.writeFileSync(path.join(run.dir, `diagnose-${vp.name}.json`), JSON.stringify(out, null, 1));
  console.log('\n  DIAGNOSE ' + vp.name + ': ' + JSON.stringify(out));
};
