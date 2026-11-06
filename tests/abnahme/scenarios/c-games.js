// C. Die fuenf spielbaren Spiele wie ein Mensch: Kachel -> Bereit -> Countdown -> Spielen bis zum ECHTEN Ende
//    -> Endkarte -> Nochmal -> Pause/Weiter -> Kopf-Bestenliste im Spiel -> Ergebnis speichern.
// Zeit laeuft mit page.clock (echte Zeit + runFor zum Beschleunigen). Zufall ist festgelegt, Spielzustand wird nie gesetzt.
const { makeInput } = require('../input');
const NAMES = { forklift: 'Lagermeister Nico', mario: 'Super Dennis', buster: 'Zweifel-Buster', nerve: 'Die Mut-Probe', parcours: 'Tor-Parcours' };
const NO_COUNTDOWN = { parcours: true };

const T = s => ms => s.page.clock.runFor(ms);
const phase = s => s.page.evaluate(() => HoermannGameSession.state().phase);
const visible = (s, sel) => s.page.locator(sel).first().isVisible().catch(() => false);
const countdownText = s => s.page.evaluate(() => { const e = document.getElementById('game-countdown'); return e && !e.hidden && getComputedStyle(e).display !== 'none' ? e.querySelector('strong').textContent : null; });

async function untilPhase(s, want, maxMs, stepMs = 100) { const list = [].concat(want); for (let t = 0; t <= maxMs; t += stepMs) { if (list.includes(await phase(s))) return t; await T(s)(stepMs); } return -1; }

// Menue -> Kachel -> "Bereit"-Dialog (ohne "Jetzt spielen" zu druecken)
async function openGame(s, g, inp) {
  await s.page.locator('#menu-btn').click(); await s.page.locator('.games-grid').first().waitFor();
  await s.page.locator(`[data-game="${g}"]`).scrollIntoViewIfNeeded(); await s.step(g + '-kachel');
  await inp.press(`[data-game="${g}"] .game-open-action`);
  await s.page.locator('#game-session-dialog[open]').waitFor({ timeout: 5000 }).catch(() => s.fail('Kein Bereit-Dialog nach Tipp auf die Kachel ' + g));
  if (/Verstanden/.test(await s.page.locator('#game-session-action').textContent())) { await s.step(g + '-update-hinweis'); await s.page.locator('#game-session-action').click(); }
  const label = (await s.page.locator('#game-session-action').textContent()).trim();
  s.expect(/Jetzt spielen/.test(label), `${g}: Bereit-Dialog hat statt "Jetzt spielen" den Knopf "${label}"`);
  s.expect(!(await visible(s, '#game-session-restart')), `${g}: Bereit-Dialog zeigt "Neu starten" (nichts zum Neustarten)`);
  await s.step(g + '-bereit');
}

// 3 - 2 - 1 - Los! pruefen: Text laufend abfragen (die Uhr laeuft auch waehrend Screenshots weiter), dann "playing"
async function checkCountdown(s, g, tag) {
  const seen = []; let shot = false;
  for (let t = 0; t < 6000; t += 100) {
    const txt = await countdownText(s); if (txt !== null && seen[seen.length - 1] !== txt) seen.push(txt);
    if (txt === '3' && !shot) { shot = true; await s.step(`${g}-${tag}-countdown-3`); }
    if ((await phase(s)) === 'playing') break; await T(s)(100);
  }
  s.expect(seen.join(',') === '3,2,1,Los!', `${g} (${tag}): Countdown zeigt ${JSON.stringify(seen)} statt 3,2,1,Los!`);
  s.expect((await phase(s)) === 'playing', `${g} (${tag}): Spiel startet nach dem Countdown nicht`);
}

// Pause waehrend des Countdowns, Weiter -> Countdown beginnt wieder bei 3
async function pauseCheck(s, g, inp, during) {
  await T(s)(1100); // Countdown bei 2
  await inp.press(`#${g}-view .game-pause-button`); await s.page.locator('#game-session-dialog[open]').waitFor().catch(() => s.fail(g + ': Pause-Knopf oeffnet keinen Pause-Dialog'));
  s.expect((await phase(s)) === 'paused', g + ': Phase nach Pause ist nicht paused');
  s.expect(/Weiter spielen/.test(await s.page.locator('#game-session-action').textContent()), g + ': Pause-Dialog ohne "Weiter spielen"');
  await s.step(`${g}-pause-${during}`); await T(s)(1500);
  await s.page.locator('#game-session-action').click();
  s.expect((await countdownText(s)) === '3', `${g}: Nach "Weiter spielen" beginnt der Countdown nicht bei 3 (${await countdownText(s)})`);
  await s.step(`${g}-weiter-countdown`);
}

// Endkarte pruefen. since = Spielzeit seit dem Ereignis, das das Ende ausloest.
async function endCard(s, g, label, maxMs = 3500) {
  let t = 0; for (; t <= maxMs; t += 100) { if (await visible(s, '#game-end-card')) break; await T(s)(100); }
  if (!s.expect(t <= maxMs, `${g} (${label}): Endkarte erscheint nicht innerhalb ${maxMs} ms`)) { await s.step(`${g}-${label}-ohne-endkarte`); return false; }
  await T(s)(500); await s.page.waitForTimeout(600); // Einblend-Animation (CSS laeuft in echter Zeit, nicht in der Testuhr)
  const txt = (await s.page.locator('#game-end-again').textContent()).trim();
  s.expect(/Nochmal spielen/.test(txt), `${g}: Endkarte hat "${txt}" statt "Nochmal spielen"`);
  s.expect((await phase(s)) === 'finished', `${g}: Phase nach Ende ist nicht finished`);
  await s.step(`${g}-${label}-endkarte`); return true;
}

// Ergebnis-Dialog nach dem Ende: Erstspieler (Name), bekannter Name (automatisch), niedrigeres Ergebnis (Kurzmeldung)
async function scoreDialog(s, g, mode) {
  const dlg = s.page.locator('#score-submit-dialog.show'); const lb = s.page.locator('#highscore-card.show');
  if (mode === 'name') {
    await dlg.waitFor({ timeout: 4000 }).catch(() => s.fail(g + ': Erstspieler bekommt keinen Namens-Dialog'));
    await T(s)(300); await s.step(`${g}-name-dialog`);
    s.expect(await visible(s, '#player-name-input'), g + ': Namensfeld fehlt');
    await s.page.locator('#player-name-input').fill('Abnahme'); await s.page.locator('#save-score-btn').scrollIntoViewIfNeeded();
    s.expect(await visible(s, '#save-score-btn'), g + ': Speichern-Knopf nicht sichtbar'); await s.step(`${g}-name-eingegeben`);
    await (s.vp.touch ? s.page.locator('#save-score-btn').tap() : s.page.locator('#save-score-btn').click());
    await lb.waitFor({ timeout: 4000 }).catch(() => s.fail(g + ': Nach Speichern erscheint die Bestenliste nicht'));
    await T(s)(400); await s.step(`${g}-gespeichert`);
    s.expect((await s.page.locator('#highscore-card').innerText()).includes('Abnahme'), g + ': Gespeicherter Name steht nicht in der Bestenliste');
  } else if (mode === 'auto') {
    await lb.waitFor({ timeout: 4000 }).catch(() => s.fail(g + ': Bekannter Name: Ergebnis wurde nicht automatisch gespeichert'));
    s.expect(!(await dlg.count()), g + ': Bekannter Name: Dialog erscheint trotz automatischer Speicherung');
    await T(s)(400); await s.step(`${g}-auto-gespeichert`);
  } else if (mode === 'lower') {
    await dlg.waitFor({ timeout: 4000 }).catch(() => s.fail(g + ': Niedrigeres Ergebnis zeigt keine Meldung'));
    await T(s)(300); const msg = (await s.page.locator('#submit-highscore-feedback').innerText()).trim();
    s.expect(/Bestwert bleibt/.test(msg), `${g}: Meldung bei niedrigerem Ergebnis ist "${msg}"`); await s.step(`${g}-niedriger`);
    await s.page.locator('#score-dialog-close-btn').scrollIntoViewIfNeeded(); await s.page.locator('#score-dialog-close-btn').click();
    await s.step(`${g}-niedriger-zu`);
  } else if (mode === 'close') { // beliebiger Dialog (z. B. Erstspieler mit Punkten ohne Namens-Test): schliessen
    if (await dlg.count()) { await T(s)(300); await s.step(`${g}-ergebnis-dialog`); await s.page.locator('#score-dialog-close-btn').scrollIntoViewIfNeeded(); await s.page.locator('#score-dialog-close-btn').click(); }
  }
  if (await s.page.locator('#highscore-card.show').count()) { await s.page.locator('#close-leaderboard-btn').click(); await T(s)(300); }
  await s.page.locator('#game-end-card').waitFor({ state: 'visible' }).catch(() => s.fail(g + ': Endkarte nach dem Ergebnis-Dialog nicht mehr sichtbar'));
  await s.page.locator('#game-end-card').scrollIntoViewIfNeeded(); await T(s)(200); await s.step(`${g}-endkarte-nach-ergebnis`);
}

// Nochmal spielen -> Countdown (ausser Parcours: sofort bereit, Tippen startet)
async function again(s, g, inp, tag) {
  await s.page.locator('#game-end-again').scrollIntoViewIfNeeded(); await inp.press('#game-end-again');
  if (NO_COUNTDOWN[g]) {
    s.expect((await countdownText(s)) === null, g + ': Nach Nochmal spielen erscheint ein Countdown (Parcours hat keinen)');
    s.expect(!(await visible(s, '#game-end-card')), g + ': Endkarte bleibt nach Nochmal sichtbar'); await s.step(`${g}-${tag}-nochmal-bereit`);
    s.expect((await phase(s)) === 'playing', g + ': Parcours nach Nochmal nicht im Spielzustand');
  } else {
    s.expect((await countdownText(s)) === '3', `${g}: Nach "Nochmal spielen" kein Countdown 3 (${await countdownText(s)})`);
    s.expect(!(await visible(s, '#game-end-card')), g + ': Endkarte bleibt nach Nochmal sichtbar');
    await checkCountdown(s, g, tag);
  }
}

// Kopf-Bestenliste waehrend des Spiels: pausiert, danach "Weiter spielen" + Countdown
async function headerLeaderboardInPlay(s, g, inp) {
  await T(s)(600);
  await inp.press('#header-leaderboard-btn'); await s.page.locator('#highscore-card.show').waitFor().catch(() => s.fail(g + ': Kopf-Bestenliste oeffnet sich im Spiel nicht'));
  await T(s)(300); s.expect((await phase(s)) === 'paused', g + ': Spiel pausiert nicht bei geoeffneter Bestenliste (' + await phase(s) + ')'); await s.step(`${g}-kopf-bestenliste-im-spiel`);
  await s.page.locator('#close-leaderboard-btn').click(); await T(s)(300);
  const open = await visible(s, '#game-session-dialog[open] #game-session-action') && /Weiter spielen/.test(await s.page.locator('#game-session-action').textContent());
  s.expect(open, g + ': Nach Schliessen der Bestenliste fehlt "Weiter spielen"'); await s.step(`${g}-nach-bestenliste-weiter`);
  if (open) { await s.page.locator('#game-session-action').click(); s.expect((await countdownText(s)) === '3', g + ': Nach der Bestenliste kein Countdown 3'); await checkCountdown(s, g, 'nach-bestenliste'); }
}

// ---- Spieler-Roboter (nur echte Eingaben; Zustand wird nur gelesen) ----
const BOTS = {
  async forklift(s, inp) { // ein Stueck fahren, Oelfleck weghupen (+120), dann Schicht abgeben (echtes Rundenende)
    await inp.hold('down', 'ArrowDown', '#fl-btn-down'); await T(s)(500); await inp.release('down', 'ArrowDown'); await inp.releaseAll(); await T(s)(300);
    await inp.tap('h', '#fl-btn-horn'); await T(s)(400); await s.step('forklift-gehupt');
    s.expect(+(await s.page.locator('#fl-score-stat').textContent()) > 0, 'forklift: Hupen am Oelfleck bringt keine Punkte');
    await inp.press('#fl-finish-shift-btn'); return 'Schicht abgegeben';
  },
  async mario(s, inp) { // nach rechts laufen und springen, bis Level geschafft oder alle Leben weg
    await inp.hold('right', 'ArrowRight', '#btn-right');
    for (let t = 0; t < 120000; t += 300) { if ((await phase(s)) === 'finished') break; await inp.hold('jump', ' ', '#btn-jump'); await T(s)(250); await inp.release('jump', ' '); await T(s)(50); }
    await inp.release('right', 'ArrowRight'); await inp.releaseAll(); return 'Level oder Leben';
  },
  async buster(s, inp) { // sichtbare Zweifel anklicken, bis die 30 Sekunden um sind
    for (let t = 0; t < 40000; t += 150) {
      if ((await phase(s)) === 'finished') break;
      const pt = await s.page.evaluate(() => { const r = busterCanvas.getBoundingClientRect(); const c = targets.filter(x => x.life > 40).sort((a, b) => b.life - a.life)[0]; return c ? { x: r.left + c.x * r.width / busterCanvas.width, y: r.top + c.y * r.height / busterCanvas.height } : null; });
      if (pt) await inp.tapAt(pt.x, pt.y); await T(s)(150);
    }
    return 'Zeit abgelaufen';
  },
  async parcours(s, inp) { // ein paar Tore durchfliegen, dann nichts mehr tun -> Absturz
    const flap = async () => { if (s.vp.touch) { const r = await s.page.locator('#parcoursCanvas').boundingBox(); await inp.tapAt(r.x + r.width / 2, r.y + r.height / 2); } else await s.page.keyboard.press(' '); };
    await flap();
    for (let t = 0; t < 60000; t += 40) {
      const st = await s.page.evaluate(() => ({ over: parcoursGameOver, y: pPlayer.y, vy: pPlayer.vy, score: parcoursScore, g: pGates.filter(g => g.x + g.width > pPlayer.x - 20).sort((a, b) => a.x - b.x)[0] }));
      if (st.over) break;
      if (st.score < 2 && st.g) { const target = (st.g.topHeight + st.g.bottomY) / 2 + 22; if (st.y > target && st.vy > -1) await flap(); }
      await T(s)(40);
    }
    return 'Absturz';
  },
};

async function playToEnd(s, g, inp) {
  const how = await BOTS[g](s, inp); const t = await untilPhase(s, 'finished', 8000);
  s.expect(t >= 0, `${g}: Spiel endet nicht (Bot: ${how}, Phase ${await phase(s)})`); return t >= 0;
}

async function genericGame(s, g, inp) {
  await openGame(s, g, inp);
  await inp.press('#game-session-action');
  s.expect(NO_COUNTDOWN[g] ? (await countdownText(s)) === null : (await countdownText(s)) === '3', `${g}: nach "Jetzt spielen" ${NO_COUNTDOWN[g] ? 'darf kein Countdown laufen' : 'startet der Countdown nicht bei 3'} (${await countdownText(s)})`);
  if (!NO_COUNTDOWN[g]) { await pauseCheck(s, g, inp, 'im-countdown'); await checkCountdown(s, g, 'start'); }
  else { await s.step(g + '-bereit-zum-tippen'); s.expect((await phase(s)) === 'playing', g + ': Tor-Parcours wartet nicht im Spielzustand auf Tippen'); }
  if (!(await playToEnd(s, g, inp))) return;
  if (!(await endCard(s, g, 'ende1'))) return;
  await scoreDialogIfAny(s, g);
  await again(s, g, inp, 'runde2');
  await headerLeaderboardInPlay(s, g, inp);
}
async function scoreDialogIfAny(s, g) { if (await s.page.locator('#score-submit-dialog.show').count()) await scoreDialog(s, g, 'close'); }

// Mut-Probe: Zufall festlegt (Math.random=0 -> Tor 1 = Alarm, Tor 2 und 3 sicher)
async function nerveGame(s, g, inp) {
  const rnd = v => s.page.evaluate(v => { Math.random = () => v; }, 0);
  const door = n => inp.press(`#door-${n}`);
  await openGame(s, g, inp); await inp.press('#game-session-action'); await pauseCheck(s, g, inp, 'im-countdown'); await checkCountdown(s, g, 'start');
  await s.step('nerve-spielfeld'); await rnd();
  // Runde 1: sicheres Tor, sichern -> Erstspieler-Namensdialog
  await door(2); await T(s)(400); await s.step('nerve-tor-sicher');
  await inp.press('#bank-nerve-btn'); await T(s)(100);
  await endCard(s, g, 'gesichert'); await scoreDialog(s, g, 'name');
  // Runde 2: zwei sichere Tore -> hoeher als Rekord, Name bekannt -> automatisch
  await again(s, g, inp, 'runde2'); await rnd();
  await door(2); await T(s)(300); await inp.press('#next-nerve-round-btn'); await T(s)(300); await s.step('nerve-naechste-stufe'); await door(3); await T(s)(300);
  await inp.press('#bank-nerve-btn'); await scoreDialog(s, g, 'auto'); await endCard(s, g, 'gesichert2');
  // Runde 3: niedrigeres Ergebnis -> Kurzmeldung
  await again(s, g, inp, 'runde3'); await rnd(); await door(2); await T(s)(300); await inp.press('#bank-nerve-btn');
  await endCard(s, g, 'gesichert3'); await scoreDialog(s, g, 'lower');
  // Runde 4: verloren (Alarm-Tor) -> Endkarte muss schnell kommen
  await again(s, g, inp, 'runde4'); await rnd(); await door(1);
  await endCard(s, g, 'alarm', 2500);
  await again(s, g, inp, 'runde5'); await headerLeaderboardInPlay(s, g, inp);
}

// Zweifel-Buster: zusaetzlich Ergebnis-Flows (bekannter Name, hoeher/niedriger) kommen ueber Mut-Probe; hier Erstspieler mit echten Treffern
async function busterGame(s, g, inp) {
  await genericGame(s, g, inp);
}

const RUN = { forklift: genericGame, mario: genericGame, buster: busterGame, nerve: nerveGame, parcours: genericGame };

exports.run = async ({ open, vp }) => {
  for (const g of Object.keys(NAMES)) {
    const s = await open('C-' + g, { clock: true, seedRandom: 20260611 });
    try { await s.goto(); const inp = makeInput(s); await RUN[g](s, g, inp); }
    finally { await s.close(); }
  }
};
