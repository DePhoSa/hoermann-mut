    /* ==========================================================
       9. GAME 1: ZWEIFEL-BUSTER (Anti-Rage & Satisfying)
       ========================================================== */
    const busterCanvas = document.getElementById('busterCanvas');
    const busterCtx = busterCanvas.getContext('2d');
    const busterScoreSpan = document.getElementById('buster-score');
    const busterTimeSpan = document.getElementById('buster-time');
    const restartBusterBtn = document.getElementById('restart-buster-btn');

    let busterScore = 0, busterCombo = 0, busterElapsed = 0;
    let busterTimeLeft = 30;
    let busterTimer = null;
    let busterActive = false;
    let busterLoopId = null;

    let targets = [];
    let splats = [];

    const doubtsList = [
      "Zweifel", "Angst", "Aufschieberitis", "Bequemlichkeit",
      "Montagsblues", "Was denken die?", "Geht nicht", "Morgen reicht auch",
      "Zu schwer", "Unsicherheit", "Fehlerangst"
    ];

    function startBusterGame() {
      busterScore = 0; busterCombo = 0; busterElapsed = 0;
      updateBusterCombo();
      busterScoreSpan.textContent = '0';
      busterTimeLeft = 30;
      busterTimeSpan.textContent = '30s';
      targets = [];
      splats = [];
      scoreSubmitDialog.classList.remove('show');
      highscoreCard.classList.remove('show');

      busterActive = true;
      if (busterTimer) clearInterval(busterTimer);


      if (busterLoopId) cancelAnimationFrame(busterLoopId);
      HoermannGameClock.reset("busterLoop");
      busterLoop();
      playSound('mut');
    }

    function stopBusterGame() {
      busterActive = false;
      if (busterTimer) clearInterval(busterTimer);
      if (busterLoopId) cancelAnimationFrame(busterLoopId);
    }

    restartBusterBtn.addEventListener('click', startBusterGame);

    function updateBusterCombo() {
      document.getElementById("buster-combo").textContent = `${busterCombo} · ×${HoermannGameReleases.comboFactor(busterCombo).toFixed(2)}`;
    }

    function spawnBusterTarget() {
      const isPowerup = Math.random() < 0.22;
      const radius = isPowerup ? 30 : Math.floor(Math.random() * 15 + 32);
      const x = Math.random() * (busterCanvas.width - radius * 2) + radius;
      const y = Math.random() * (busterCanvas.height - radius * 2) + radius;

      targets.push({
        x: x,
        y: y,
        radius: radius,
        maxLife: isPowerup ? 120 : 160,
        life: isPowerup ? 120 : 160,
        isPowerup: isPowerup,
        text: isPowerup ? "HÖRMANN POWER" : doubtsList[Math.floor(Math.random() * doubtsList.length)],
        color: isPowerup ? "#f59c00" : "#ef4444"
      });
    }

    busterCanvas.addEventListener('pointerdown', (e) => {
      if (!busterActive) return;
      const rect = busterCanvas.getBoundingClientRect();
      const scaleX = busterCanvas.width / rect.width;
      const scaleY = busterCanvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      let hit = false;
      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        const dist = Math.hypot(clickX - t.x, clickY - t.y);
        if (dist <= t.radius + 8) {
          hit = true; busterCombo++; updateBusterCombo();
          const award = HoermannGameReleases.award(t.isPowerup ? 100 : 35, busterCombo);
          if (t.isPowerup) {
            busterScore += award;
            playSound('powerup');
            triggerParticleEffect('gold');
            splats.push({ x: t.x, y: t.y, text: `+${award} DENNIS-POWER!`, color: "#f59c00", alpha: 1 });
          } else {
            busterScore += award;
            playSound('smash');
            splats.push({ x: t.x, y: t.y, text: `+${award} ZERSCHLAGEN!`, color: "#ffffff", alpha: 1 });
          }
          busterScoreSpan.textContent = busterScore;
          targets.splice(i, 1);
          break;
        }
      }

      if (!hit) {
        const lostPoints = Math.min(15, busterScore); busterScore = HoermannGameReleases.miss(busterScore); busterCombo = 0; updateBusterCombo(); busterScoreSpan.textContent = busterScore;
        splats.push({ x: clickX, y: clickY, text: `DANEBEN! −${lostPoints} · COMBO 0`, color: "#9ca3af", alpha: 0.8 });
      }
    });

    function busterLoop(frameTime) {
      if (!(busterActive)) return;
      HoermannGameClock.run("busterLoop", frameTime, () => {
      if (!busterActive) return;

      busterElapsed += 1 / 60; busterTimeLeft = Math.max(0, 30 - busterElapsed);
      busterTimeSpan.textContent = `${Math.ceil(busterTimeLeft)}s`;
      if (busterElapsed + 0.00001 >= 30) { endBusterGame(); return; }
      if (Math.random() < HoermannGameReleases.spawnRate(busterElapsed) && targets.length < 6) {
        spawnBusterTarget();
      }

      drawBusterScene(true);
      });
      if (busterActive) busterLoopId = requestAnimationFrame(busterLoop);
    }

    function drawBusterScene(advance = false) {
      busterCtx.fillStyle = '#001830';
      busterCtx.fillRect(0, 0, busterCanvas.width, busterCanvas.height);

      busterCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = 0; x < busterCanvas.width; x += 35) {
        busterCtx.beginPath();
        busterCtx.moveTo(x, 0);
        busterCtx.lineTo(x, busterCanvas.height);
        busterCtx.stroke();
      }

      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        if (advance) t.life--;
        if (t.life <= 0) {
          targets.splice(i, 1);
          continue;
        }

        const scale = Math.sin((t.life / t.maxLife) * Math.PI);
        const currentR = Math.max(10, t.radius * scale);

        busterCtx.save();
        busterCtx.translate(t.x, t.y);

        if (t.isPowerup) {
          busterCtx.fillStyle = '#f59c00';
          busterCtx.beginPath();
          busterCtx.arc(0, 0, currentR, 0, Math.PI * 2);
          busterCtx.fill();
          busterCtx.strokeStyle = '#ffffff';
          busterCtx.lineWidth = 3;
          busterCtx.stroke();

          busterCtx.fillStyle = '#002d62';
          busterCtx.font = 'bold 13px Inter, sans-serif';
          busterCtx.textAlign = 'center';
          busterCtx.textBaseline = 'middle';
          busterCtx.fillText('HÖRMANN', 0, 0);
        } else {
          busterCtx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          busterCtx.beginPath();
          busterCtx.arc(0, 0, currentR, 0, Math.PI * 2);
          busterCtx.fill();
          busterCtx.strokeStyle = '#ffffff';
          busterCtx.lineWidth = 2;
          busterCtx.stroke();

          busterCtx.fillStyle = '#ffffff';
          busterCtx.font = 'bold 11px Inter, sans-serif';
          busterCtx.textAlign = 'center';
          busterCtx.textBaseline = 'middle';
          busterCtx.fillText(t.text, 0, 0);
        }
        busterCtx.restore();
      }

      for (let i = splats.length - 1; i >= 0; i--) {
        const s = splats[i];
        if (advance) s.y -= 1.2;
        if (advance) s.alpha -= 0.03;

        busterCtx.save();
        busterCtx.fillStyle = s.color;
        busterCtx.globalAlpha = Math.max(0, s.alpha);
        busterCtx.font = '800 14px Inter, sans-serif';
        busterCtx.textAlign = 'center';
        busterCtx.fillText(s.text, s.x, s.y);
        busterCtx.restore();

        if (s.alpha <= 0) splats.splice(i, 1);
      }
    }

    function endBusterGame() {
      stopBusterGame();
      playSound('score');
      triggerParticleEffect('confetti');

      busterCtx.fillStyle = 'rgba(0, 31, 59, 0.9)';
      busterCtx.fillRect(0, 0, busterCanvas.width, busterCanvas.height);

      busterCtx.fillStyle = '#f59c00';
      busterCtx.font = '800 28px Inter, sans-serif';
      busterCtx.textAlign = 'center';
      busterCtx.fillText('ZEIT ABGELAUFEN!', busterCanvas.width / 2, 120);

      busterCtx.fillStyle = '#ffffff';
      busterCtx.font = '700 20px Inter, sans-serif';
      busterCtx.fillText(`Zweifel zerschlagen: ${busterScore} Mut-Punkte!`, busterCanvas.width / 2, 165);

      promptScoreSubmit(busterScore, 'buster_v02', 'Zweifel-Buster 0.2');
    }

