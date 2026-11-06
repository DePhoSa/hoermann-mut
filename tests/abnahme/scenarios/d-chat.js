// D. Chat: oeffnen, Nachricht senden, ungelesen-Zaehler, GIF-Fach, auf dem Handy Eingabe bei eingeblendeter Tastatur
exports.run = async ({ open, vp }) => {
  const s = await open('D'); const p = s.page;
  try {
    await s.goto(); await s.step('start');
    s.expect(await p.locator('#chat-fab').isVisible(), 'Chat-Knopf nicht sichtbar');
    // Nachricht eines anderen trifft ein, waehrend der Chat zu ist -> Zaehler
    await p.evaluate(() => window.__cloudFeed([{ type: 'CHAT_MSG', msg: { id: 'x1', sender: 'Gast Eins', text: 'Hallo aus der Werkshalle', ts: Date.now() + 2000 } }]));
    await p.waitForTimeout(500); await s.step('ungelesen');
    s.expect(await p.locator('#chat-unread-badge').isVisible() && (await p.locator('#chat-unread-badge').textContent()).trim() === '1', 'Ungelesen-Zaehler zeigt nicht 1');
    await (vp.touch ? p.locator('#chat-fab').tap() : p.locator('#chat-fab').click());
    await p.locator('#online-side-chat.open').waitFor(); await p.waitForTimeout(400); await s.step('chat-offen');
    s.expect(!(await p.locator('#chat-unread-badge').isVisible()), 'Zaehler bleibt nach dem Oeffnen sichtbar');
    s.expect((await p.locator('#chat-messages-list').innerText()).includes('Hallo aus der Werkshalle'), 'Eingegangene Nachricht steht nicht im Chat');
    // Name + Nachricht schreiben (echtes Tippen) und senden
    const name = p.locator('#chat-sender-input'); if (await name.isVisible() && !(await name.inputValue())) await name.fill('Abnahme');
    await p.locator('#chat-text-input').click(); await p.keyboard.type('Test aus der Abnahme'); await s.step('nachricht-getippt');
    await (vp.touch ? p.locator('#chat-send-btn').tap() : p.keyboard.press('Enter')); await p.waitForTimeout(500);
    s.expect((await p.locator('#chat-messages-list').innerText()).includes('Test aus der Abnahme'), 'Gesendete Nachricht erscheint nicht in der Liste');
    s.expect(await p.evaluate(() => window.__pub.some(x => x.type === 'CHAT_MSG')), 'Nachricht wurde nicht an die (Attrappen-)Cloud gegeben');
    await s.step('nachricht-gesendet');
    // GIF-Fach und Smileys
    await (vp.touch ? p.locator('#toggle-gif-tray-btn').tap() : p.locator('#toggle-gif-tray-btn').click());
    await p.locator('#chat-gif-tray').waitFor({ state: 'visible' }).catch(() => s.fail('GIF-Fach oeffnet sich nicht')); await p.waitForTimeout(300); await s.step('gif-fach');
    await p.locator('#chat-gif-search-input').fill('stapler'); await (vp.touch ? p.locator('#chat-gif-search-btn').tap() : p.locator('#chat-gif-search-btn').click()); await p.waitForTimeout(600); await s.step('gif-suche');
    await (vp.touch ? p.locator('#close-gif-tray-btn').tap() : p.locator('#close-gif-tray-btn').click());
    await (vp.touch ? p.locator('#toggle-emoji-tray-btn').tap() : p.locator('#toggle-emoji-tray-btn').click()); await p.waitForTimeout(300); await s.step('smileys');
    await (vp.touch ? p.locator('#toggle-emoji-tray-btn').tap() : p.locator('#toggle-emoji-tray-btn').click());
    // Handy: Tastatur eingeblendet = weniger Hoehe. Eingabe und Senden muessen sichtbar und frei bleiben.
    if (vp.touch) {
      await p.locator('#chat-text-input').tap(); await p.setViewportSize({ width: vp.width, height: Math.round(vp.height * 0.55) }); await p.waitForTimeout(500);
      await s.step('tastatur-da');
      for (const sel of ['#chat-text-input', '#chat-send-btn']) {
        const b = await p.locator(sel).boundingBox(); const ok = b && b.y >= 0 && b.y + b.height <= p.viewportSize().height + 1;
        s.expect(ok, `Bei eingeblendeter Tastatur liegt ${sel} ausserhalb des sichtbaren Bereichs (${JSON.stringify(b)})`);
      }
      await p.setViewportSize({ width: vp.width, height: vp.height }); await p.waitForTimeout(400);
    }
    await (vp.touch ? p.locator('#chat-close-btn').tap() : p.locator('#chat-close-btn').click()); await p.waitForTimeout(300); await s.step('chat-zu');
    s.expect(!(await p.locator('#online-side-chat.open').count()), 'Chat laesst sich nicht schliessen');
  } finally { await s.close(); }
};
