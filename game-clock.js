/* Fixed 60 Hz simulation for the existing per-step physics. No game constants or scores changed. */
(function(root) {
  const clocks = new Map(), stepMs = 1000 / 60;
  function reset(key) { clocks.delete(key); }
  function run(key, timestamp, tick) {
    const now = Number.isFinite(timestamp) ? timestamp : performance.now();
    if ((typeof document !== 'undefined' && document.hidden) || root.HoermannGameSession?.blocked()) { reset(key); return 0; }
    let clock = clocks.get(key);
    if (!clock) { clock = { last: now, remainder: 0 }; clocks.set(key, clock); tick(); return 1; }
    const elapsed = Math.max(0, now - clock.last); clock.last = now;
    // A stalled or backgrounded frame must not fast-forward the whole game.
    clock.remainder += elapsed > 250 ? 0 : Math.min(100, elapsed);
    let steps = 0;
    while (clock.remainder + 0.00001 >= stepMs && steps < 6) { clock.remainder -= stepMs; tick(); steps++; }
    return steps;
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => clocks.clear());
  root.HoermannGameClock = Object.freeze({ run, reset });
  if (typeof module === 'object' && module.exports) module.exports = root.HoermannGameClock;
})(globalThis);
