    /* ==========================================================
       11. GAME 3: TOR-PARCOURS (Flappy)
       ========================================================== */
    const parcoursCanvas = document.getElementById('parcoursCanvas');
    const parcoursCtx = parcoursCanvas.getContext('2d');
    const parcoursScoreSpan = document.getElementById('parcours-score');
    const parcoursHighscoreSpan = document.getElementById('parcours-highscore');
    const restartParcoursBtn = document.getElementById('restart-parcours-btn');

    let parcoursScore = 0;
    let parcoursActive = false;
    let parcoursLoopId = null;
    let parcoursGameOver = false;

    function updateParcoursHighscoreDisplay() {
      const pList = getGameLeaderboard('parcours_v02');
      const maxScore = pList.length > 0 ? Math.max(...pList.map(x => x.score)) : 0;
      parcoursHighscoreSpan.textContent = maxScore;
    }

    const P_BASE_SPEED = 2.4, P_MAX_SPEED = 3.4, P_RAMP_GATES = 30;
    const P_BASE_GAP = 184, P_MIN_GAP = 144, P_GATE_SPACING = 270, P_MAX_CENTER_STEP = 110;
    // Sanfter Einstieg (Balance-Messung: docs/BALANCE-PARCOURS.md): die ersten Tore sind weiter und
    // liegen hoeher/tiefer nur wenig auseinander; der Hoehensprung waechst bis Tor 30 auf das Maximum.
    const P_EASE_GATES = 4, P_EASE_GAP = 20, P_EASE_STEP = 50, P_START_CENTER_STEP = 80;
    const P_FIRST_GATE_X = 500;
    // Endkarte erscheint nach dem Absturz verzoegert; danach noch kurz gesperrt, damit wildes
    // Weitertippen im Absturzmoment nicht sofort "Nochmal spielen" ausloest.
    const P_CARD_DELAY = 900, P_RESTART_LOCK = 450;
    let pPlayer = {
      x: 90,
      y: 180,
      radius: 17,
      hitRadius: 15,
      vy: 0,
      gravity: 0.36,
      jumpForce: -7.2,
      trail: []
    };
    let pGates = [];
    let pSpeed = P_BASE_SPEED;
    let pReady = true;
    let pTick = 0;
    let pShake = 0;
    let pPopups = [];
    let pLastCenter = 180;
    let pBestBefore = 0;
    let pGateIndex = 0;
    let pFlash = 0;
    let pLockUntil = 0;

    function pHaptic(pattern) {
      try {
        if (!navigator.vibrate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        navigator.vibrate(pattern);
      } catch (e) { /* Vibration ist optional */ }
    }

    function parcoursDifficulty() { return Math.min(1, parcoursScore / P_RAMP_GATES); }

    function startParcoursGame() {
      parcoursScore = 0;
      parcoursScoreSpan.textContent = '0';
      pSpeed = P_BASE_SPEED;
      parcoursGameOver = false;
      pReady = true;
      pTick = 0;
      pShake = 0;
      pFlash = 0;
      pLockUntil = 0;
      pGateIndex = 0;
      pPopups = [];
      pPlayer.y = parcoursCanvas.height / 2;
      pPlayer.vy = 0;
      pPlayer.trail = [];
      pGates = [];
      pLastCenter = parcoursCanvas.height / 2;
      updateParcoursHighscoreDisplay();
      pBestBefore = parseInt(parcoursHighscoreSpan.textContent, 10) || 0;
      scoreSubmitDialog.classList.remove('show');
      highscoreCard.classList.remove('show');

      spawnParcoursGate(P_FIRST_GATE_X);
      spawnParcoursGate(P_FIRST_GATE_X + P_GATE_SPACING);

      parcoursActive = true;
      if (parcoursLoopId) cancelAnimationFrame(parcoursLoopId);
      HoermannGameClock.reset("parcoursLoop");
      parcoursLoop();
      playSound('mut');
    }

    function stopParcoursGame() {
      parcoursActive = false;
      if (parcoursLoopId) cancelAnimationFrame(parcoursLoopId);
    }

    restartParcoursBtn.addEventListener('click', startParcoursGame);

    function spawnParcoursGate(posX) {
      const easing = pGateIndex < P_EASE_GATES;
      const gap = Math.round(P_BASE_GAP - (P_BASE_GAP - P_MIN_GAP) * parcoursDifficulty()) + (easing ? P_EASE_GAP : 0);
      const maxStep = easing ? P_EASE_STEP : P_START_CENTER_STEP + (P_MAX_CENTER_STEP - P_START_CENTER_STEP) * parcoursDifficulty();
      pGateIndex++;
      const margin = 34;
      const H = parcoursCanvas.height;
      // Neues Tor ist immer erreichbar: Lochmitte weicht nur begrenzt vom vorigen Tor ab.
      const lo = Math.max(margin + gap / 2, pLastCenter - maxStep);
      const hi = Math.min(H - margin - gap / 2, pLastCenter + maxStep);
      const center = Math.round(lo + Math.random() * Math.max(0, hi - lo));
      pLastCenter = center;
      const topHeight = center - Math.round(gap / 2);

      pGates.push({
        x: posX,
        topHeight: topHeight,
        bottomY: topHeight + gap,
        width: 56,
        passed: false
      });
    }

    function parcoursJump() {
      // Nach dem Absturz startet nur die gemeinsame Endkarte (Knopf / Leertaste / Enter) neu,
      // ein Tippen auf das Spielfeld nicht (kein versehentlicher Neustart).
      if (parcoursGameOver || !parcoursActive) return;
      if (pReady) pReady = false;
      pPlayer.vy = pPlayer.jumpForce;
      playSound('jump');
    }

    function parcoursRestartLocked() {
      return parcoursGameOver && performance.now() < pLockUntil && getComputedStyle(parcoursView).display !== 'none';
    }
    // Registriert vor der gemeinsamen Endkarte (game-session.js), faengt daher Leertaste/Enter/Klick dort ab.
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.key === 'Enter') && parcoursRestartLocked()) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    document.addEventListener('click', (e) => {
      if (parcoursRestartLocked() && e.target.closest && e.target.closest('#game-end-again')) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && getComputedStyle(parcoursView).display !== 'none' && !scoreSubmitDialog.classList.contains('show')) {
        e.preventDefault();
        if (e.repeat) return;
        parcoursJump();
      }
    });

    parcoursCanvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      parcoursJump();
    });

    function parcoursHitsGate(g) {
      const r = pPlayer.hitRadius, px = pPlayer.x, py = pPlayer.y;
      const rects = [[g.x, -1000, g.width, g.topHeight + 1000], [g.x, g.bottomY, g.width, 1000]];
      return rects.some(([rx, ry, rw, rh]) => {
        const cx = Math.max(rx, Math.min(px, rx + rw));
        const cy = Math.max(ry, Math.min(py, ry + rh));
        return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
      });
    }

    function parcoursLoop(frameTime) {
      if (!(parcoursActive)) return;
      HoermannGameClock.run("parcoursLoop", frameTime, () => {
      if (!parcoursActive) return;
      pTick++;
      if (pShake > 0) pShake--;
      if (pFlash > 0) pFlash--;
      pPopups.forEach(p => { p.y -= 0.8; p.life--; });
      pPopups = pPopups.filter(p => p.life > 0);

      if (pReady) {
        pPlayer.y = parcoursCanvas.height / 2 + Math.sin(pTick / 14) * 8;
      } else if (!parcoursGameOver) {
        pSpeed = P_BASE_SPEED + (P_MAX_SPEED - P_BASE_SPEED) * parcoursDifficulty();
        pPlayer.vy = Math.min(9, pPlayer.vy + pPlayer.gravity);
        pPlayer.y += pPlayer.vy;
        pPlayer.trail.push({ x: pPlayer.x, y: pPlayer.y });
        if (pPlayer.trail.length > 14) pPlayer.trail.shift();

        if (pPlayer.y - pPlayer.radius < 0) {
          pPlayer.y = pPlayer.radius;
          pPlayer.vy = 0;
        }
        if (pPlayer.y + pPlayer.radius > parcoursCanvas.height) {
          pPlayer.y = parcoursCanvas.height - pPlayer.radius;
          handleParcoursOver();
        }

        pGates.forEach(g => { g.x -= pSpeed; });
        for (let i = pGates.length - 1; i >= 0; i--) {
          const g = pGates[i];
          if (!parcoursGameOver && parcoursHitsGate(g)) handleParcoursOver();
          if (!parcoursGameOver && !g.passed && g.x + g.width / 2 < pPlayer.x) {
            g.passed = true;
            parcoursScore++;
            parcoursScoreSpan.textContent = parcoursScore;
            pPopups.push({ x: pPlayer.x + 26, y: pPlayer.y - 24, life: 40, text: '+1' });
            playSound('coin');
            pHaptic(8);
          }
          if (g.x + g.width < -10) pGates.splice(i, 1);
        }

        const lastGate = pGates[pGates.length - 1];
        if (lastGate && lastGate.x <= parcoursCanvas.width + 120 - P_GATE_SPACING) {
          spawnParcoursGate(lastGate.x + P_GATE_SPACING);
        }
      }

      drawParcoursScene();
      });
      if (parcoursActive) parcoursLoopId = requestAnimationFrame(parcoursLoop);
    }

    function drawParcoursScene() {
      const c = parcoursCtx, W = parcoursCanvas.width, H = parcoursCanvas.height;
      c.save();
      if (pShake > 0) c.translate((Math.random() - 0.5) * pShake * 0.8, (Math.random() - 0.5) * pShake * 0.8);
      c.fillStyle = '#001a35';
      c.fillRect(-10, -10, W + 20, H + 20);

      pGates.forEach(g => {
        c.fillStyle = '#0a4a94';
        c.fillRect(g.x, 0, g.width, g.topHeight);
        c.fillRect(g.x, g.bottomY, g.width, H - g.bottomY);
        c.strokeStyle = '#6fb1ff';
        c.lineWidth = 2;
        c.strokeRect(g.x + 1, -2, g.width - 2, g.topHeight + 1);
        c.strokeRect(g.x + 1, g.bottomY, g.width - 2, H - g.bottomY + 2);

        c.fillStyle = '#f59c00';
        c.fillRect(g.x + 3, g.topHeight - 6, g.width - 6, 6);
        c.fillRect(g.x + 3, g.bottomY, g.width - 6, 6);
      });

      pPlayer.trail.forEach((t, i) => {
        c.fillStyle = `rgba(245, 156, 0, ${(i / pPlayer.trail.length) * 0.3})`;
        c.beginPath();
        c.arc(t.x - (pPlayer.trail.length - i) * pSpeed, t.y, pPlayer.radius * (0.4 + 0.5 * i / pPlayer.trail.length), 0, Math.PI * 2);
        c.fill();
      });

      c.fillStyle = parcoursGameOver ? '#e5483b' : '#f59c00';
      c.beginPath();
      c.arc(pPlayer.x, pPlayer.y, pPlayer.radius, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.5;
      c.stroke();

      c.textAlign = 'center';
      c.font = '800 24px Inter, sans-serif';
      pPopups.forEach(p => {
        c.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.life / 20)})`;
        c.fillText(p.text, p.x, p.y);
      });

      // Punktestand gross auf dem Spielfeld (auch auf dem Handy gut lesbar)
      c.font = '800 46px Inter, sans-serif';
      c.lineJoin = 'round';
      c.lineWidth = 7;
      c.strokeStyle = 'rgba(0, 20, 45, 0.85)';
      c.strokeText(String(parcoursScore), W / 2, 50);
      c.fillStyle = '#ffffff';
      c.fillText(String(parcoursScore), W / 2, 50);

      if (pReady && !parcoursGameOver) {
        // Hinweis links vom ersten Tor (x=500), damit er kein Tor verdeckt
        const hx = 310;
        c.fillStyle = 'rgba(0, 20, 45, 0.72)';
        c.fillRect(hx - 185, H - 82, 370, 52);
        c.fillStyle = '#ffffff';
        c.font = '800 22px Inter, sans-serif';
        c.fillText(matchMedia('(pointer: coarse)').matches ? 'Tippen zum Starten' : 'Tippen / Leertaste zum Starten', hx, H - 48);
      }
      if (pFlash > 0) {
        c.fillStyle = `rgba(229, 72, 59, ${(pFlash / 14) * 0.45})`;
        c.fillRect(-10, -10, W + 20, H + 20);
      }
      c.restore();

      if (parcoursGameOver) {
        // Erst kurz der rote Blitz sichtbar, dann blendet die Abdunkelung hinter der Endkarte ein.
        c.fillStyle = `rgba(0, 31, 59, ${0.88 * (1 - pFlash / 14)})`;
        c.fillRect(0, 0, W, H);

        // Ergebnis und Neustart zeigt die gemeinsame Rundenende-Karte (HTML), hier nur Abdunkelung.
      }
    }

    function handleParcoursOver() {
      if (parcoursGameOver) return;
      parcoursGameOver = true;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      pShake = reduced ? 0 : 16;
      pFlash = 14;
      pLockUntil = performance.now() + P_CARD_DELAY + P_RESTART_LOCK;
      playSound('hit');
      const record = parcoursScore > pBestBefore;
      pHaptic(record ? [40, 50, 40] : 60);
      if (record) triggerParticleEffect('confetti');

      HoermannGameSession.ended(parcoursScore, P_CARD_DELAY);
      if (parcoursScore > 0) {
        promptScoreSubmit(parcoursScore, 'parcours_v02', 'Tor-Parcours 0.2');
      }
    }

