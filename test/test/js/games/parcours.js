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
    const P_BASE_GAP = 176, P_MIN_GAP = 144, P_GATE_SPACING = 270, P_MAX_CENTER_STEP = 110;
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
    let pOverAt = 0;
    let pPopups = [];
    let pLastCenter = 180;
    let pBestBefore = 0;

    function parcoursDifficulty() { return Math.min(1, parcoursScore / P_RAMP_GATES); }

    function startParcoursGame() {
      parcoursScore = 0;
      parcoursScoreSpan.textContent = '0';
      pSpeed = P_BASE_SPEED;
      parcoursGameOver = false;
      pReady = true;
      pTick = 0;
      pShake = 0;
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

      spawnParcoursGate(parcoursCanvas.width + 120);
      spawnParcoursGate(parcoursCanvas.width + 120 + P_GATE_SPACING);

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
      const gap = Math.round(P_BASE_GAP - (P_BASE_GAP - P_MIN_GAP) * parcoursDifficulty());
      const margin = 34;
      const H = parcoursCanvas.height;
      // Neues Tor ist immer erreichbar: Lochmitte weicht nur begrenzt vom vorigen Tor ab.
      const lo = Math.max(margin + gap / 2, pLastCenter - P_MAX_CENTER_STEP);
      const hi = Math.min(H - margin - gap / 2, pLastCenter + P_MAX_CENTER_STEP);
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
      if (parcoursGameOver) {
        if (!scoreSubmitDialog.classList.contains('show') && performance.now() - pOverAt > 600) {
          startParcoursGame();
        }
        return;
      }
      if (pReady) pReady = false;
      pPlayer.vy = pPlayer.jumpForce;
      playSound('jump');
    }

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

      c.fillStyle = '#f59c00';
      c.beginPath();
      c.arc(pPlayer.x, pPlayer.y, pPlayer.radius, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.5;
      c.stroke();

      c.textAlign = 'center';
      c.font = '800 16px Inter, sans-serif';
      pPopups.forEach(p => {
        c.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.life / 20)})`;
        c.fillText(p.text, p.x, p.y);
      });

      // Punktestand gross auf dem Spielfeld (auch auf dem Handy gut lesbar)
      c.fillStyle = 'rgba(255, 255, 255, 0.85)';
      c.font = '800 34px Inter, sans-serif';
      c.fillText(String(parcoursScore), W / 2, 44);

      if (pReady && !parcoursGameOver) {
        c.fillStyle = 'rgba(0, 20, 45, 0.6)';
        c.fillRect(W / 2 - 150, H - 72, 300, 40);
        c.fillStyle = '#ffffff';
        c.font = '800 16px Inter, sans-serif';
        c.fillText(matchMedia('(pointer: coarse)').matches ? 'Tippen zum Starten' : 'Tippen / Leertaste zum Starten', W / 2, H - 46);
      }
      c.restore();

      if (parcoursGameOver) {
        c.fillStyle = 'rgba(0, 31, 59, 0.88)';
        c.fillRect(0, 0, W, H);

        // Ergebnis und Neustart zeigt die gemeinsame Rundenende-Karte (HTML), hier nur Abdunkelung.
      }
    }

    function handleParcoursOver() {
      if (parcoursGameOver) return;
      parcoursGameOver = true;
      pOverAt = performance.now();
      pShake = 14;
      playSound('hit');
      if (parcoursScore > pBestBefore) triggerParticleEffect('confetti');

      HoermannGameSession.ended(parcoursScore, 900);
      if (parcoursScore > 0) {
        promptScoreSubmit(parcoursScore, 'parcours_v02', 'Tor-Parcours 0.2');
      }
    }

