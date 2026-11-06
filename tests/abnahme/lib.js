// Gemeinsame Bausteine der Abnahme-Suite: Server, Seite, Attrappen-Cloud, Schritt-Pruefungen, Befunde.
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' };

const VIEWPORTS = [
  { name: 'desktop', width: 1360, height: 900, touch: false },
  { name: 'laptop15', width: 1280, height: 720, deviceScaleFactor: 1.5, touch: false },
  { name: 'phone390', width: 390, height: 844, isMobile: true, hasTouch: true, touch: true },
  { name: 'phone360', width: 360, height: 740, isMobile: true, hasTouch: true, touch: true },
];

async function startServer() {
  const server = http.createServer((q, r) => {
    const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, origin: 'http://127.0.0.1:' + server.address().port };
}

// Attrappe der Cloud: nichts verlaesst den Rechner, Firestore wird nie beschrieben.
const cloudMock = (isAdmin) => `
  window.__pub = []; let cb = null;
  window.HoermannCloud = { uid: 'abnahme-uid', async publish(p) { window.__pub.push(p); }, async start(f, b) { cb = f; b('online'); f([]); },
    async isAdmin() { return ${isAdmin ? 'true' : 'false'}; }, async adminSignIn() {} };
  window.__cloudFeed = items => cb && cb(items);`;

// Merkt, welche Texte die Spiele auf ihre Leinwand zeichnen (um "Nochmal" hinter der Endkarte zu finden).
const canvasSpy = `(() => { const log = window.__cv = []; for (const fn of ['fillText', 'strokeText']) { const o = CanvasRenderingContext2D.prototype[fn];
  CanvasRenderingContext2D.prototype[fn] = function (t, ...a) { try { log.push({ t: String(t), at: performance.now(), id: this.canvas && this.canvas.id }); if (log.length > 400) log.splice(0, 200); } catch (e) {} return o.call(this, t, ...a); }; } })();`;

// ---- Pruefungen, die im Browser laufen (E) ----
function inPageChecks(opts) {
  const { touch } = opts; const out = []; const vw = innerWidth, vh = innerHeight;
  const labelOf = e => (e.innerText || e.getAttribute('aria-label') || e.value || '').replace(/\s+/g, ' ').trim();
  const desc = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); const tx = labelOf(el).slice(0, 28); return tx ? s + ' "' + tx + '"' : s; };
  const clipRect = el => {
    const r = el.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0 || p.inert) return null;
      if (/(hidden|auto|scroll|clip)/.test(c.overflowX + c.overflowY)) { const pr = p.getBoundingClientRect(); L = Math.max(L, pr.left); T = Math.max(T, pr.top); R = Math.min(R, pr.right); B = Math.min(B, pr.bottom); }
    }
    if (R - L < 1 || B - T < 1) return null; return { L, T, R, B };
  };
  const visible = el => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return null; if (el.closest('[aria-hidden="true"],[hidden]')) return null; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null; return clipRect(el); };
  const add = (rule, el, detail) => out.push({ rule, el: desc(el), detail: detail || '' });

  // 1. Seitliches Scrollen
  if (document.documentElement.scrollWidth > vw + 1) add('overflow-x', document.documentElement, 'scrollWidth ' + document.documentElement.scrollWidth + ' > ' + vw);

  // Elemente, die rechts/links aus dem Bildschirm ragen (auch wenn die Seite das Scrollen unterdrueckt)
  { let n = 0; for (const e of document.body.querySelectorAll('*')) { if (n >= 3) break; if (e.closest('canvas,svg,#chat-drawer,#online-side-chat')) continue; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || (r.right <= vw + 2 && r.left >= -2)) continue; if (getComputedStyle(e).position === 'fixed' && !e.closest('dialog')) continue;
      let sc = false; for (let p = e.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) { sc = true; break; } if (sc || !visible(e)) continue; n++; add('overflow-x', e, 'ragt aus dem Bildschirm: ' + Math.round(r.left) + '..' + Math.round(r.right) + ' von ' + vw); } }

  // Overlay-Ebenen: ein modales Fenster darf nie zusammen mit einem zweiten offen sein.
  const blocking = [...document.querySelectorAll('dialog[open], #highscore-card.show, #admin-dialog-backdrop.show, #score-submit-dialog.show')].filter(e => visible(e));
  const chatEl = document.querySelector('#online-side-chat.open'); if (chatEl && visible(chatEl) && chatEl.getBoundingClientRect().width >= vw * 0.9) blocking.push(chatEl); /* Handy: Chat ist ein Vollbild-Blatt */
  const topDialog = blocking.filter(e => e.tagName === 'DIALOG').pop();
  const layer = topDialog || blocking.find(e => e.id === 'admin-dialog-backdrop') || blocking.find(e => e.id === 'online-side-chat') || blocking[0] || null;
  if (blocking.length > 1) add('overlay-stack', blocking[blocking.length - 1], 'gleichzeitig offen: ' + blocking.map(desc).join(' + '));
  const scope = layer || document.body;

  // 2. Interaktive Elemente: Groesse, Verdeckung
  const SEL = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [onclick]';
  const endCardEl = document.getElementById('game-end-card'); const shield = endCardEl && visible(endCardEl) ? endCardEl.parentElement : null; /* Endkarte deckt das Spielfeld absichtlich ab */
  const ctl = [...document.querySelectorAll(SEL)].filter(e => scope.contains(e) && !e.closest('#game-countdown') && !(shield && shield.contains(e) && !endCardEl.contains(e)) && visible(e));
  for (const e of ctl) {
    const r = e.getBoundingClientRect(); const v = clipRect(e); if (!v) continue;
    if (touch && (r.width < 43.5 || r.height < 43.5) && !e.disabled) add('touch-size', e, Math.round(r.width) + 'x' + Math.round(r.height) + 'px');
    const cx = Math.min(Math.max((v.L + v.R) / 2, 0), vw - 1), cy = (v.T + v.B) / 2;
    if (cy < 0 || cy >= vh || v.R < 0 || v.L > vw) continue;
    const top = document.elementFromPoint(cx, cy);
    if (top && !(top === e || e.contains(top) || top.contains(e) || (e.labels && [...e.labels].some(l => l.contains(top))))) add('covered', e, 'verdeckt von ' + desc(top));
  }

  // 2b. Der feste Chat-Knopf darf kein Bedienelement teilweise verdecken (nicht nur den Mittelpunkt, sondern das ganze Rechteck),
  //     soweit es sich am Seitenende nicht mehr wegscrollen laesst.
  { const fab = document.getElementById('chat-fab'); const atEnd = scrollY + vh >= document.documentElement.scrollHeight - 2; /* nur dort ist ein Element nicht mehr wegscrollbar */
    const fr = fab && scope === document.body && atEnd && visible(fab) ? fab.getBoundingClientRect() : null;
    if (fr) for (const e of ctl) { if (e === fab || fab.contains(e)) continue; const v = clipRect(e); if (!v) continue;
      const ix = Math.min(v.R, fr.right) - Math.max(v.L, fr.left), iy = Math.min(v.B, fr.bottom) - Math.max(v.T, fr.top);
      if (ix >= 8 && iy >= 8) add('covered-by-chat', e, 'Chat-Knopf liegt ueber ' + Math.round(ix) + 'x' + Math.round(iy) + 'px des Elements'); } }

  // 3. Abgeschnittener Text
  const textEls = [...scope.querySelectorAll('button,a,label,h1,h2,h3,h4,p,span,div,li,strong,small,td,th,summary')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && visible(e));
  for (const e of textEls) {
    const rg = document.createRange(); rg.selectNodeContents(e); const tr = rg.getBoundingClientRect(); if (tr.width < 1) continue;
    if (e.closest('.door-face')) continue; /* Tor-Blende gleitet absichtlich nach oben */
    const cs = getComputedStyle(e); const hid = /(hidden|clip)/;
    if ((cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) || (cs.webkitLineClamp !== 'none' && e.scrollHeight > e.clientHeight + 1)) { add('text-clipped', e, 'abgeschnitten (Ellipsis/Clamp)'); continue; }
    if (e.clientWidth > 0 && ((hid.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 1) || (hid.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1))) { add('text-clipped', e, 'Inhalt ' + e.scrollWidth + 'x' + e.scrollHeight + ' > Box ' + e.clientWidth + 'x' + e.clientHeight); continue; }
    for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const c = getComputedStyle(p); if (/(auto|scroll)/.test(c.overflowX + c.overflowY)) break; /* scrollbarer Bereich: Rest ist erreichbar */ if (!hid.test(c.overflowX + c.overflowY)) continue;
      const pr = p.getBoundingClientRect(); const ox = hid.test(c.overflowX), oy = hid.test(c.overflowY);
      if ((ox && (tr.right > pr.right + 1.5 || tr.left < pr.left - 1.5)) || (oy && (tr.bottom > pr.bottom + 1.5 || tr.top < pr.top - 1.5))) { add('text-clipped', e, 'Text ragt aus ' + desc(p) + ' heraus'); break; }
    }
    let scrollable = false; for (let p = e.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth) scrollable = true;
    if (!scrollable && (tr.left < -1 || tr.right > vw + 1)) add('text-offscreen', e, 'Text ausserhalb des Bildschirms');
  }

  // 3b. Platzhaltertext in leeren Eingabefeldern abgeschnitten?
  for (const e of ctl) { if (!/^(INPUT|TEXTAREA)$/.test(e.tagName) || e.value || !e.placeholder) continue; const cs = getComputedStyle(e); const c = document.createElement('canvas').getContext('2d'); c.font = cs.font;
    const room = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); if (e.tagName === 'INPUT' && c.measureText(e.placeholder).width > room + 1) add('placeholder-clipped', e, 'Platzhalter "' + e.placeholder.slice(0, 40) + '" braucht ' + Math.round(c.measureText(e.placeholder).width) + 'px, frei sind ' + Math.round(room) + 'px'); }

  // 4. Doppelte Zwecke (Neustart / Bestenliste / Menue), auch auf die Leinwand gezeichnete Texte.
  const PURPOSE = { restart: /nochmal|neustart|neu starten|neuer durchgang|noch einmal/i, leaderboard: /bestenliste\b/i, menu: /^\W*men[üu]\W*$/i };
  for (const [name, rx] of Object.entries(PURPOSE)) {
    const hits = ctl.filter(e => e.matches('button,a,[role=button]') && rx.test(labelOf(e)));
    const cv = name === 'restart' ? [...new Set((window.__cv || []).filter(x => performance.now() - x.at < 1200 && rx.test(x.t) && document.getElementById(x.id) && visible(document.getElementById(x.id))).map(x => x.t))] : [];
    const n = hits.length + cv.length;
    if (n > 1) add('duplicate-' + name, hits[0] || document.body, n + 'x: ' + [...hits.map(desc), ...cv.map(t => 'Leinwand-Text "' + t + '"')].join(' | '));
  }
  return out;
}

class Run {
  constructor(dir) { this.dir = dir; this.findings = []; this.seen = new Set(); this.known = []; try { this.known = JSON.parse(fs.readFileSync(path.join(__dirname, 'known-issues.json'), 'utf8')); } catch (e) {} }
  isKnown(f) { return this.known.find(k => k.rule === f.rule && (!k.vp || k.vp === f.vp) && (!k.scenario || f.scenario.startsWith(k.scenario)) && (!k.match || f.el.includes(k.match) || f.detail.includes(k.match))); }
  add(f) { const key = [f.rule, f.vp, f.scenario, f.el, f.detail.slice(0, 60), f.step.replace(/^\d+-/, '')].join('|'); if (this.seen.has(key)) return; this.seen.add(key); const k = this.isKnown(f); f.known = k ? k.reason : null; this.findings.push(f); }
}

// Eine Sitzung (Kontext + Seite) fuer einen Viewport.
async function openSession(browser, run, origin, vp, scenario, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor || 1, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, locale: 'de-DE', serviceWorkers: 'block' });
  await ctx.addInitScript(canvasSpy);
  if (opts.seedRandom) await ctx.addInitScript(`(() => { let s = ${opts.seedRandom}; Math.random = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; })();`);
  if (opts.name) await ctx.addInitScript(n => { if (!localStorage.getItem('abnahme-seeded')) { localStorage.setItem('hoermann_locked_player_name_v1', n); localStorage.setItem('hoermann_player_name', n); localStorage.setItem('abnahme-seeded', '1'); } }, opts.name);
  const page = await ctx.newPage(); page.setDefaultTimeout(12000);
  const s = { ctx, page, vp, run, scenario, errors: [], external: [], n: 0, errSeen: 0, lastStep: '00', lastShot: '' };
  page.on('pageerror', e => s.errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) s.errors.push('console.error: ' + m.text()); });
  await page.route(u => !u.href.startsWith(origin), r => { s.external.push(r.request().url()); r.abort(); });
  await page.route('**/firebase-sync.js*', r => r.fulfill({ contentType: 'text/javascript', body: cloudMock(opts.admin) }));
  if (opts.clock) await page.clock.install();
  // Ablauf-Fehler (ein erwarteter Zustand trat nicht ein)
  s.fail = (detail, el) => run.add({ rule: 'ablauf', el: el || 'Ablauf', detail, vp: vp.name, scenario, step: s.lastStep, shot: s.lastShot });
  s.expect = (cond, detail, el) => { if (!cond) s.fail(detail, el); return !!cond; };
  // Schritt: Screenshot + allgemeine Pruefungen (E).
  s.step = async (label, o = {}) => {
    s.n++; const id = String(s.n).padStart(2, '0') + '-' + label.replace(/[^a-z0-9_-]+/gi, '_'); s.lastStep = id;
    const file = `${scenario}-${vp.name}-${id}.png`; s.lastShot = file; await page.waitForTimeout(120);
    try { await page.screenshot({ path: path.join(run.dir, file) }); } catch (e) {}
    let res = []; try { res = await page.evaluate(inPageChecks, { touch: !!vp.touch }); } catch (e) { res = [{ rule: 'check-error', el: 'Pruefung', detail: e.message }]; }
    for (const r of res) { if (o.skip && o.skip.includes(r.rule)) continue; run.add({ ...r, vp: vp.name, scenario, step: id, shot: file }); }
    while (s.errSeen < s.errors.length) run.add({ rule: 'js-error', el: 'Konsole', detail: s.errors[s.errSeen++], vp: vp.name, scenario, step: id, shot: file });
  };
  s.goto = async (hash = '') => { await page.goto(origin + '/index.html' + hash); await page.waitForFunction(() => typeof HoermannGameSession !== 'undefined'); await page.waitForTimeout(500); };
  s.close = async () => { await ctx.close(); };
  return s;
}

module.exports = { chromium, root, VIEWPORTS, startServer, Run, openSession, inPageChecks };
