#!/usr/bin/env node
// Abnahme-Suite: spielt das Portal wie ein Mensch durch (echte Klicks/Taps/Tasten), auf Desktop und Handy,
// speichert nummerierte Screenshots und prueft nach JEDEM Schritt allgemeine Regeln (E).
// Aufruf: node tests/abnahme/run.js            (alles)
//         ABNAHME_ONLY=A,B ABNAHME_VP=phone390 node tests/abnahme/run.js   (Auswahl, zum Entwickeln)
const fs = require('fs'); const path = require('path');
const { chromium, VIEWPORTS, startServer, Run, openSession } = require('./lib');
const SCENARIOS = { A: require('./scenarios/a-portal'), B: require('./scenarios/b-menu'), C: require('./scenarios/c-games'), D: require('./scenarios/d-chat'), P: require('./scenarios/c2-paused-games') }; /* P = Diagnose pausierter Spiele, nur mit ABNAHME_ONLY=P */

(async () => {
  const t0 = Date.now();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(__dirname, 'runs', stamp); fs.mkdirSync(dir, { recursive: true });
  const only = (process.env.ABNAHME_ONLY || 'A,B,C,D').split(','); const vpOnly = process.env.ABNAHME_VP ? process.env.ABNAHME_VP.split(',') : null;
  const run = new Run(dir); const { server, origin } = await startServer(); const browser = await chromium.launch();
  const external = new Set(); const crashes = [];
  console.log('Abnahme-Lauf, Screenshots in: ' + dir);
  for (const key of only) {
    for (const vp of VIEWPORTS.filter(v => !vpOnly || vpOnly.includes(v.name))) {
      const t1 = Date.now(); process.stdout.write(`  ${key} / ${vp.name} ... `);
      const ctx = { browser, run, origin, vp, open: (scenario, opts) => openSession(browser, run, origin, vp, scenario, opts), external };
      try { await SCENARIOS[key].run(ctx); console.log(((Date.now() - t1) / 1000).toFixed(0) + ' s'); }
      catch (e) { crashes.push(`${key}/${vp.name}: ${e.message.split('\n')[0]}`); console.log('ABBRUCH: ' + e.message.split('\n')[0]); }
    }
  }
  await browser.close(); server.close();
  const real = run.findings.filter(f => !f.known), known = run.findings.filter(f => f.known);
  const fmt = f => `  [${f.rule}] ${f.scenario}/${f.vp} ${f.step}: ${f.el} - ${f.detail}${f.known ? '  (bekannt: ' + f.known + ')' : ''}\n      Bild: ${f.shot}`;
  fs.writeFileSync(path.join(dir, 'befunde.json'), JSON.stringify({ findings: run.findings, crashes }, null, 1));
  const shots = fs.readdirSync(dir).filter(f => f.endsWith('.png')).length;
  console.log(`\n${shots} Screenshots in ${dir}`);
  if (known.length) console.log(`\nBekannte offene Punkte (${known.length}):\n` + known.map(fmt).join('\n'));
  if (real.length || crashes.length) {
    console.log(`\nFEHLER (${real.length} Befunde, ${crashes.length} Abbrueche):\n` + real.map(fmt).join('\n') + crashes.map(c => '\n  ABBRUCH ' + c).join(''));
    console.log(`\nABNAHME NICHT BESTANDEN (${((Date.now() - t0) / 60000).toFixed(1)} min)`); process.exit(1);
  }
  console.log(`\nABNAHME BESTANDEN (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
})().catch(e => { console.error(e); process.exit(2); });
