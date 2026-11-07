// Lagermeister Nico: Roboter, der eine Palette WIRKLICH vom LKW aufnimmt und in ein Regal liefert.
// Nur echte Eingaben (Tasten bzw. Bildschirmtasten per Mehrfinger-Touch); der Spielzustand wird nur GELESEN
// (Position, Tempo), um zu lenken. Wird von c-games.js (Abnahme) genutzt.
const T = s => ms => s.page.clock.runFor(ms);
const KEYS = { up: ['ArrowUp', '#fl-btn-up'], down: ['ArrowDown', '#fl-btn-down'], left: ['ArrowLeft', '#fl-btn-left'], right: ['ArrowRight', '#fl-btn-right'] };
const STEP = 50; // Spielzeit pro Regelschritt (ms)

const read = async s => { const r = await readRaw(s); if (s.trace) s.trace.push(r); return r; }; // s.trace: optionaler Verlauf (Gleichheitsbeweis)
const readRaw = s => s.page.evaluate(() => ({ x: nico.x, y: nico.y, a: nico.angle, kmh: nico.kmh, mast: nico.mastLevel, cargo: nico.cargo ? nico.cargo.type : null, cond: nico.cargo ? nico.cargo.condition : null,
  score: flState.score, pallets: flState.palletsDelivered, q: flState.qualityHistory.slice(), phase: flState.truckPhase, ticks: flState.ticks, done: flState.shiftComplete,
  lkw: lkwPallets.length, bays: storageBays.map(b => b.id + ':' + b.items.length), oil: oilSpill && oilSpill.active }));
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

function makeDriver(s, inp) {
  const down = new Set();
  const set = async (want) => {
    for (const k of [...down]) if (!want.includes(k)) { await inp.release('fl-' + k, KEYS[k][0]); down.delete(k); }
    for (const k of want) if (!down.has(k)) { await inp.hold('fl-' + k, KEYS[k][0], KEYS[k][1]); down.add(k); }
  };
  // Zum Punkt (x, y) fahren (Mitte des Staplers), dort ausrollen. vmax in km/h. wantAngle: danach so ausrichten.
  const goTo = async (x, y, { tol = 6, vmax = 9, maxMs = 25000 } = {}) => {
    for (let t = 0; t < maxMs; t += STEP) {
      const p = await read(s); const dx = x - p.x, dy = y - p.y, dist = Math.hypot(dx, dy);
      if (dist < tol) break;
      const e = wrap(Math.atan2(dy, dx) - p.a); const want = [];
      if (e > 0.06) want.push('right'); else if (e < -0.06) want.push('left');
      const speed = p.kmh / 6.4, stopDist = speed * 15 + tol;
      const slow = Math.abs(e) > 0.5 ? 3 : vmax; // enge Kurve: langsam
      if (Math.abs(e) < 1.2 && dist > stopDist && p.kmh < slow) want.push('up');
      await set(want); await T(s)(STEP);
    }
    await set([]);
    for (let t = 0; t < 4000; t += STEP) { const p = await read(s); if (p.kmh < 0.5) break; await T(s)(STEP); }
  };
  // Auf der Stelle ausrichten geht beim Stapler nicht (Lenken braucht Tempo): kurz anrollen und drehen.
  const turnTo = async (angle, { maxMs = 8000 } = {}) => {
    for (let t = 0; t < maxMs; t += STEP) {
      const p = await read(s); const e = wrap(angle - p.a); if (Math.abs(e) < 0.04) break;
      const want = [e > 0 ? 'right' : 'left']; if (p.kmh < 3.2) want.push('up');
      await set(want); await T(s)(STEP);
    }
    await set([]); for (let t = 0; t < 4000; t += STEP) { const p = await read(s); if (p.kmh < 0.5) break; await T(s)(STEP); }
  };
  return { goTo, turnTo, set };
}

// Antriebe-Palette aufnehmen, an der Hupe vorbei (+120), in Fach B1 liefern. Gibt eine Zusammenfassung zurueck.
exports.deliveryBot = async (s, inp, g = 'forklift') => {
  const d = makeDriver(s, inp); const out = {};
  const hud = () => s.page.evaluate(() => ({ score: +document.getElementById('fl-score-stat').textContent, q: document.getElementById('fl-quality-stat').textContent, pal: document.getElementById('fl-pallet-stat').textContent }));
  const press = async (key, sel) => { await inp.tap(key, sel); await T(s)(120); };
  let p = await read(s);
  s.expect(p.phase === 'DOCKED' && !p.cargo && p.score === 0, `${g}: Startzustand unerwartet (LKW ${p.phase}, Ladung ${p.cargo}, Punkte ${p.score})`);
  // 1. Zum LKW (mittlere Palette: Antriebe), Gabelspitze 28 px vor dem Stapler
  await d.goTo(172, 244, { vmax: 8, tol: 7 }); await d.turnTo(Math.PI);
  p = await read(s); await s.step(g + '-am-lkw');
  await press(' ', '#fl-btn-action'); p = await read(s);
  if (!s.expect(p.cargo === 'antriebe', `${g}: Aufnehmen vom LKW klappt nicht (Ladung ${p.cargo}, Abstand x ${p.x.toFixed(0)}, y ${p.y.toFixed(0)}, ${p.kmh.toFixed(1)} km/h)`)) return 'Aufnehmen fehlgeschlagen';
  s.expect(p.lkw === 2, `${g}: Palette bleibt auf dem LKW (noch ${p.lkw})`);
  await s.step(g + '-palette-aufgenommen');
  // 2. Unterwegs am Oelfleck vorbei: Hupe (+120)
  const before = p.score; await d.goTo(380, 190, { vmax: 7 });
  await press('h', '#fl-btn-horn'); p = await read(s);
  s.expect(p.score === before + 120 && p.oil === false, `${g}: Hupen am Oelfleck gibt keine +120 (Punkte ${before} -> ${p.score}, Stapler bei ${p.x.toFixed(0)}/${p.y.toFixed(0)}, Abstand zum Fleck ${Math.hypot(p.x - 430, p.y - 280).toFixed(0)})`);
  // 3. Zu Regal B1 (Zone B, rechts oben, Boden-Ebene), Gabel zeigt nach rechts
  await d.goTo(560, 96, { vmax: 7, tol: 12 }); await d.turnTo(0);
  await d.goTo(640, 96, { vmax: 6, tol: 5 }); await d.turnTo(0);
  p = await read(s); await s.step(g + '-am-regal');
  const qBefore = (await hud()).q, scoreBefore = p.score;
  await press(' ', '#fl-btn-action'); p = await read(s); const h = await hud();
  if (!s.expect(p.pallets === 1 && !p.cargo, `${g}: Absetzen im Regal B1 klappt nicht (Paletten ${p.pallets}, Ladung ${p.cargo}, ${p.kmh.toFixed(1)} km/h, x ${p.x.toFixed(0)}, y ${p.y.toFixed(0)}, Winkel ${p.a.toFixed(2)})`)) return 'Absetzen fehlgeschlagen';
  const gained = p.score - scoreBefore;
  s.expect(gained >= 700 && gained <= 1500, `${g}: Punkte fuer die Lieferung unplausibel (+${gained}, erwartet 700 bis 1500)`);
  s.expect(+h.score === p.score && p.score >= 1000, `${g}: Punkteanzeige (${h.score}) passt nicht zum Spielstand (${p.score})`);
  s.expect(h.pal === '1 / 6', `${g}: Palettenanzeige "${h.pal}" statt "1 / 6"`);
  s.expect(h.q !== qBefore && p.q.length === 1 && p.q[0] > 70 && p.q[0] < 100, `${g}: Qualitaet aendert sich nicht (vorher ${qBefore}, nachher ${h.q})`);
  s.expect(p.bays.includes('B1:1'), `${g}: Regal B1 enthaelt die Palette nicht (${p.bays.join(' ')})`);
  await T(s)(300); await s.step(g + '-geliefert');
  out.delivered = { gained, quality: h.q, score: p.score };
  return out;
};
exports.read = read;
