// Echte Eingaben: Tastatur auf dem Desktop, echte Mehrfinger-Beruehrung (CDP) auf dem Handy.
exports.makeInput = (s) => {
  const { page, vp, ctx } = s; let cdp = null; const active = new Map(); let nextId = 1;
  const send = async (type, pts) => { cdp = cdp || await ctx.newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts || [...active.values()] }); };
  const center = async sel => { const b = await page.locator(sel).boundingBox(); if (!b) throw new Error('Kein Feld fuer ' + sel); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  return {
    // Halten: name = logischer Name, key = Taste (Desktop), sel = Bildschirmtaste (Handy)
    async hold(name, key, sel) {
      if (!vp.touch) return page.keyboard.down(key);
      if (active.has(name)) return; active.set(name, { ...(await center(sel)), id: nextId++ }); await send('touchStart');
    },
    async release(name, key) {
      if (!vp.touch) return page.keyboard.up(key);
      const pt = active.get(name); if (!pt) return; active.delete(name); await send('touchEnd', active.size ? [pt] : []);
    },
    // Kurz tippen/druecken (Taste oder Tippen auf Selektor/Koordinate)
    async tap(key, sel) { if (!vp.touch) return page.keyboard.press(key); const c = await center(sel); await page.touchscreen.tap(c.x, c.y); },
    async tapAt(x, y) { if (vp.touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); },
    // Klick bzw. Tippen auf ein Element
    async press(sel) { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); if (vp.touch) await l.tap(); else await l.click(); },
    async releaseAll() { if (!active.size) return; active.clear(); await send('touchEnd'); },
  };
};
