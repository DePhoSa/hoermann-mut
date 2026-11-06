// A. Startseite, Footer, Versions-Dialog, versteckter Admin-Zugang (gesperrt / entsperrt)
exports.run = async ({ open }) => {
  // Normaler Besucher
  let s = await open('A');
  try {
    await s.goto(); await s.step('startseite');
    await s.page.locator('footer').scrollIntoViewIfNeeded(); await s.step('footer');
    s.expect(!(await s.page.locator('#chat-admin-toggle-btn').isVisible()), 'Admin-Knopf ist im Footer sichtbar, soll versteckt sein');
    await s.page.locator('#version-changelog-btn').click();
    await s.page.locator('#changelog-dialog[open]').waitFor(); await s.step('versions-dialog');
    s.expect(await s.page.locator('#changelog-admin-link').isVisible(), 'Admin-Link im Versions-Dialog nicht sichtbar');
    await s.page.locator('#changelog-close').click(); await s.step('versions-dialog-zu');
    // Versteckter Weg 1: Admin-Link im Versions-Dialog
    await s.page.locator('#version-changelog-btn').click(); await s.page.locator('#changelog-dialog[open]').waitFor();
    await s.page.locator('#changelog-admin-link').click();
    await s.page.locator('#admin-dialog-backdrop.show').waitFor(); await s.step('admin-ueber-versions-dialog');
    s.expect(await s.page.locator('#chat-admin-login-row').isVisible(), 'Anmeldezeile im gesperrten Admin-Dialog fehlt');
    s.expect(!(await s.page.locator('#chat-admin-actions-row').isVisible()), 'Admin-Leiste ohne Rechte sichtbar');
    await s.page.locator('#chat-admin-login-btn').click(); await s.page.waitForTimeout(400);
    s.expect(!(await s.page.locator('#chat-admin-actions-row').isVisible()), 'Nicht-Admin wurde entsperrt');
    await s.step('admin-bleibt-gesperrt');
    await s.page.locator('#admin-dialog-close').click(); await s.step('admin-zu');
    // Weg 2: #admin in der Adresse
    await s.goto('#admin');
    await s.page.locator('#admin-dialog-backdrop.show').waitFor({ timeout: 4000 }).catch(() => s.fail('#admin oeffnet den Admin-Dialog nicht'));
    await s.step('admin-ueber-hash');
  } finally { await s.close(); }
  // Mit Admin-Rechten (Attrappe isAdmin = true)
  s = await open('A', { admin: true });
  try {
    await s.goto(); await s.page.locator('#version-changelog-btn').scrollIntoViewIfNeeded(); await s.page.locator('#version-changelog-btn').click();
    await s.page.locator('#changelog-admin-link').click(); await s.page.locator('#admin-dialog-backdrop.show').waitFor();
    await s.page.locator('#chat-admin-login-btn').click();
    await s.page.locator('#chat-admin-actions-row').waitFor({ state: 'visible', timeout: 4000 }).catch(() => s.fail('Mit isAdmin=true wird der Admin-Bereich nicht entsperrt'));
    await s.step('admin-entsperrt');
    for (const [btn, pane] of [['#admin-tab-ideas-btn', '#admin-ideas-list'], ['#admin-tab-renames-btn', '#admin-renames-list'], ['#chat-admin-change-pw-btn', '#admin-pw-pane']]) {
      await s.page.locator(btn).click(); s.expect(await s.page.locator(pane).isVisible(), 'Admin-Reiter ' + btn + ' zeigt keinen Inhalt'); await s.step('admin-reiter');
    }
    await s.page.locator('#admin-dialog-close').click(); await s.step('admin-zu');
  } finally { await s.close(); }
};
