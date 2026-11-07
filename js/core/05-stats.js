/* Anonyme Spielstatistik: nur Zähler je Spiel und Tag, keine Namen. Siehe docs/STATISTIK.md.
   Reine Funktionen (testbar mit node) oben, Laufzeit-Anbindung an HoermannGameSession unten. */
(function(root) {
  const GAMES = ['forklift', 'mario', 'buster', 'nerve', 'parcours'];
  const FIELDS = ['rounds', 'finished', 'secs', 'restarts', 'aborts'];
  const CAPS = { rounds: 100, finished: 100, restarts: 100, aborts: 100, secs: 7200 }; // je Schreibvorgang, wie in firestore.rules
  const MAX_ROUND_SECS = 3600;
  const FLUSH_MS = 60000, HIDDEN_GAP_MS = 15000;

  const pad = n => String(n).padStart(2, '0');
  const dayKey = ms => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const docId = (day, game) => day + '__' + game;

  function add(pending, day, game, field, n) {
    if (!GAMES.includes(game) || !FIELDS.includes(field) || !(n > 0)) return;
    const key = day + '|' + game;
    const row = pending[key] || (pending[key] = { day, game, d: {} });
    row.d[field] = (row.d[field] || 0) + Math.round(n);
  }
  /* Zerlegt die gesammelten Zähler in Schreibvorgänge, die jeweils die Obergrenzen der Regeln einhalten. */
  function takeBatches(pending) {
    const out = [];
    for (const key of Object.keys(pending)) {
      const { day, game, d } = pending[key];
      const left = Object.assign({}, d);
      while (FIELDS.some(f => left[f] > 0)) {
        const part = {};
        for (const f of FIELDS) if (left[f] > 0) { part[f] = Math.min(left[f], CAPS[f]); left[f] -= part[f]; }
        out.push({ day, game, d: part });
      }
      delete pending[key];
    }
    return out;
  }
  const hasPending = pending => Object.keys(pending).length > 0;

  /* Kennzahlen aus einem oder mehreren Tageszählern (werden aufsummiert). */
  function summarize(docs) {
    const t = { rounds: 0, finished: 0, secs: 0, restarts: 0, aborts: 0, players: 0 };
    for (const d of docs || []) for (const k of Object.keys(t)) t[k] += Number(d && d[k]) || 0;
    const r = t.rounds;
    return {
      rounds: r, players: t.players,
      finishRate: r ? t.finished / r : null,
      avgSecs: r ? t.secs / r : null,
      restartsPerRound: r ? t.restarts / r : null,
      abortRate: r ? t.aborts / r : null
    };
  }
  function verdict(m) {
    if (!m.rounds) return 'noch keine Daten';
    if (m.rounds < 10) return 'wenig gespielt';
    if (m.abortRate >= 0.5) return 'hohe Abbruchquote';
    if (m.avgSecs < 20) return 'Runden sehr kurz';
    if (m.finishRate < 0.4) return 'wird selten zu Ende gespielt';
    if (m.restartsPerRound >= 0.8) return 'wird gern wiederholt';
    return 'unauffällig';
  }
  /* docs: Tageszähler (Felder game/day/Zähler), days: erlaubte Tage. Ergebnis je Spiel. */
  function perGame(docs, days) {
    const set = new Set(days);
    return GAMES.map(game => {
      const m = summarize((docs || []).filter(d => d && d.game === game && set.has(d.day)));
      return Object.assign({ game }, m, { verdict: verdict(m) });
    });
  }
  function lastDays(n, ms) { const out = []; for (let i = 0; i < n; i++) out.push(dayKey(ms - i * 86400000)); return out; }

  const pure = { GAMES, FIELDS, CAPS, dayKey, docId, add, takeBatches, hasPending, summarize, verdict, perGame, lastDays };
  if (typeof module === 'object' && module.exports) module.exports = pure;
  if (typeof document === 'undefined') return;

  /* ===== Laufzeit ===== */
  const pending = {}, markers = new Map(), markerDone = new Set();
  let active = null, timer = 0, lastFlush = 0, failures = 0, flushing = false;
  const now = () => performance.now();

  const markerKey = (day, game) => 'hoermann_stats_marker:' + day + ':' + game;
  function needsMarker(day, game) {
    const k = markerKey(day, game);
    if (markerDone.has(k)) return false;
    try { if (localStorage.getItem(k)) { markerDone.add(k); return false; } } catch {}
    return true;
  }
  function schedule() {
    if (timer || (!hasPending(pending) && !markers.size)) return;
    timer = setTimeout(() => { timer = 0; flush(); }, FLUSH_MS);
  }
  function count(game, field, n) {
    add(pending, dayKey(Date.now()), game, field, n === undefined ? 1 : n);
    schedule();
  }
  function closeRound(outcome) {
    const r = active; if (!r) return;
    active = null;
    if (r.t0 !== null) r.acc += (now() - r.t0) / 1000;
    const secs = Math.min(MAX_ROUND_SECS, Math.max(0, Math.round(r.acc)));
    if (secs) count(r.game, 'secs', secs);
    if (outcome === 'finished') count(r.game, 'finished');
    else if (outcome === 'aborted') count(r.game, 'aborts');
  }
  function startRound(game) {
    const day = dayKey(Date.now());
    active = { game, acc: 0, t0: null };
    count(game, 'rounds');
    if (needsMarker(day, game)) { markers.set(day + '|' + game, { day, game }); schedule(); }
  }
  /* mode: 'page' = sofort (pagehide), 'hidden' = höchstens alle 15 s, sonst höchstens einmal pro Minute. */
  async function flush(mode) {
    const c = root.HoermannCloud;
    if (flushing || failures >= 2 || !c || !c.statsAdd || !c.statsPlayer) return;
    if (!hasPending(pending) && !markers.size) return;
    const t = Date.now(), gap = mode === 'page' ? 0 : mode === 'hidden' ? HIDDEN_GAP_MS : FLUSH_MS - 1000;
    if (t - lastFlush < gap) { schedule(); return; }
    lastFlush = t; flushing = true;
    const ms = [...markers.values()]; markers.clear();
    const batches = takeBatches(pending);
    try {
      for (const m of ms) {
        try { localStorage.setItem(markerKey(m.day, m.game), '1'); } catch {}
        markerDone.add(markerKey(m.day, m.game));
        await c.statsPlayer(m.day, m.game);
      }
      for (const b of batches) await c.statsAdd(b.day, b.game, b.d);
      failures = 0;
    } catch (e) { failures++; /* Regeln evtl. noch nicht veröffentlicht: Daten verwerfen, kein Wiederholungssturm */ }
    flushing = false;
  }
  root.HoermannStats = Object.assign({}, pure, {
    /* Spielzeit läuft ab "Los!" bzw. beim Fortsetzen; ohne laufende Runde wird eine neue gezählt. */
    begin(game) {
      if (!GAMES.includes(game)) return;
      if (!active) startRound(game);
      if (active.t0 === null) active.t0 = now();
    },
    pause() { if (active && active.t0 !== null) { active.acc += (now() - active.t0) / 1000; active.t0 = null; } },
    finish() { closeRound('finished'); },
    abort() { closeRound('aborted'); },
    /* "Nochmal spielen": laufende Runde ohne Abbruchwertung beenden, Neustart zählen, neue Runde vormerken. */
    restart(game, immediate) {
      if (!GAMES.includes(game)) return;
      closeRound(null); count(game, 'restarts'); startRound(game);
      if (immediate) active.t0 = now();
    },
    flush,
    _state: () => ({ pending: JSON.parse(JSON.stringify(pending)), active: active && active.game, failures, markers: markers.size })
  });
  root.addEventListener('pagehide', () => { closeRound('aborted'); flush('page'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && (hasPending(pending) || markers.size)) flush('hidden'); });
})(globalThis);
