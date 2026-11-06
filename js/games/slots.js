    /* ==========================================================
       13. SPIEL NEU: DER HÖRMANN MUT-AUTOMAT (ARCADE SLOT MACHINE)
       ========================================================== */
    // 10-Spins Hörmann Mut-Automat (Übersichtlich, spannend, ~1.5 bis 2.5 Min. Spielzeit!)
    const slotsCanvas = document.getElementById('slotsCanvas');
    const sCtx = slotsCanvas ? slotsCanvas.getContext('2d') : null;
    const slotSpinsStat = document.getElementById('slot-spins-stat');
    const slotLastWinStat = document.getElementById('slot-lastwin-stat');
    const slotScoreStat = document.getElementById('slot-score-stat');

    const slotSpinBtn = document.getElementById('slot-spin-btn');
    const slotCollectBtn = document.getElementById('slot-collect-btn');
    const slotGambleBtn = document.getElementById('slot-gamble-btn');
    const slotCashoutBtn = document.getElementById('slot-cashout-btn');
    const restartSlotsBtn = document.getElementById('restart-slots-btn');
    const slotHoldBtns = [
      document.getElementById('slot-hold-0-btn'),
      document.getElementById('slot-hold-1-btn'),
      document.getElementById('slot-hold-2-btn')
    ];

    const MAX_SLOT_SPINS = 10;

    // 6 prägnante, hochwertige Hörmann-Symbole (klar erkennbar & übersichtlich!)
    const SLOT_SYMBOLS = [
      {
        id: 'WILD',
        name: 'Hörmann Gold-Wappen (WILD)',
        short: 'WILD-JOKER',
        pay3: 1000,
        pay2: 140,
        weight: 2,
        color: '#fbbf24',
        bg: '#451a03',
        isWild: true
      },
      {
        id: 'GATE',
        name: 'Goldenes Sektionaltor',
        short: 'SEKTIONALTOR',
        pay3: 600,
        pay2: 85,
        weight: 3,
        color: '#f59c00',
        bg: '#1e3a8a'
      },
      {
        id: 'FORKLIFT',
        name: 'Lagermeister Nicos Stapler',
        short: 'BLAUER STAPLER',
        pay3: 400,
        pay2: 60,
        weight: 4,
        color: '#38bdf8',
        bg: '#0f172a'
      },
      {
        id: 'DENNIS',
        name: 'Super Dennis Meister-Helm',
        short: 'SUPER DENNIS',
        pay3: 250,
        pay2: 40,
        weight: 5,
        color: '#34d399',
        bg: '#064e3b'
      },
      {
        id: 'MOTOR',
        name: 'SupraMatic Torantrieb',
        short: 'TORANTRIEB',
        pay3: 160,
        pay2: 25,
        weight: 6,
        color: '#a78bfa',
        bg: '#2e1065'
      },
      {
        id: 'COFFEE',
        name: 'Lager-Kaffee & Mut-Becher',
        short: 'MUT-KAFFEE',
        pay3: 100,
        pay2: 15,
        weight: 7,
        color: '#fcd34d',
        bg: '#1e293b'
      }
    ];

    // 5 klassische Gewinnlinien über das 3x3 Walzenfenster (Oben, Mitte, Unten + 2 Diagonalen)
    const SLOT_PAYLINES = [
      { id: 0, name: 'MITTE-LINIE', rows: [1, 1, 1], color: '#f59c00' },
      { id: 1, name: 'OBERE LINIE', rows: [0, 0, 0], color: '#38bdf8' },
      { id: 2, name: 'UNTERE LINIE', rows: [2, 2, 2], color: '#10b981' },
      { id: 3, name: 'DIAGONALE ↘', rows: [0, 1, 2], color: '#ec4899' },
      { id: 4, name: 'DIAGONALE ↗', rows: [2, 1, 0], color: '#a855f7' }
    ];

    const SLOT_REEL_STRIP = [];
    SLOT_SYMBOLS.forEach((sym, symIdx) => {
      for (let w = 0; w < sym.weight; w++) {
        SLOT_REEL_STRIP.push(symIdx);
      }
    });

    let slotAnimId = null;
    let slotState = {
      active: false,
      spinsLeft: MAX_SLOT_SPINS,
      spinsUsed: 0,
      bankScore: 0,
      pendingWin: 0,
      lastWin: 0,
      holds: [false, false, false],
      holdAllowedThisTurn: true,
      gambleStep: 0, // max 3x verdoppeln pro Gewinn
      leverPullProgress: 0,
      bulbPhase: 0,
      shakeTimer: 0,
      bannerText: '10 SPINS STARTKLAR! ZIEH AM BISECUR-HEBEL (LEERTASTE)!',
      bannerColor: '#fbbf24',
      winningLines: [],
      floatingCoins: [],
      reels: [
        { pos: 0, speed: 0, spinning: false, stopDelay: 0, bounce: 0, symbols: [1, 0, 2] },
        { pos: 4, speed: 0, spinning: false, stopDelay: 0, bounce: 0, symbols: [2, 1, 3] },
        { pos: 8, speed: 0, spinning: false, stopDelay: 0, bounce: 0, symbols: [3, 2, 4] }
      ],
      roundFinished: false
    };

    function pickRandomSymbolIndex() {
      return SLOT_REEL_STRIP[Math.floor(Math.random() * SLOT_REEL_STRIP.length)];
    }

    function initSlotsGame() {
      slotState.active = true;
      slotState.spinsLeft = MAX_SLOT_SPINS;
      slotState.spinsUsed = 0;
      slotState.bankScore = 0;
      slotState.pendingWin = 0;
      slotState.lastWin = 0;
      slotState.holds = [false, false, false];
      slotState.holdAllowedThisTurn = true;
      slotState.gambleStep = 0;
      slotState.leverPullProgress = 0;
      slotState.winningLines = [];
      slotState.floatingCoins = [];
      slotState.roundFinished = false;
      slotState.bannerText = '🎰 10 MUT-SPINS BEREIT! HALT WALZEN FEST ODER ZIEH DEN HEBEL!';
      slotState.bannerColor = '#fbbf24';

      slotState.reels = [0, 1, 2].map((rIdx) => ({
        pos: rIdx * 3,
        speed: 0,
        spinning: false,
        stopDelay: 0,
        bounce: 0,
        symbols: [
          pickRandomSymbolIndex(),
          rIdx === 1 ? 0 : pickRandomSymbolIndex(),
          pickRandomSymbolIndex()
        ]
      }));

      updateSlotsUiControls();
    }

    function startSlotsGame() {
      stopSlotsGame();
      initSlotsGame();
      HoermannGameClock.reset("slotLoop");
      slotLoop();
    }

    function stopSlotsGame() {
      slotState.active = false;
      if (slotAnimId) {
        cancelAnimationFrame(slotAnimId);
        slotAnimId = null;
      }
    }

    function updateSlotsUiControls() {
      if (!slotSpinsStat) return;
      const isAnySpinning = slotState.reels.some(r => r.spinning);

      slotSpinsStat.textContent = `${slotState.spinsUsed} / ${MAX_SLOT_SPINS} (${slotState.spinsLeft} frei)`;
      slotLastWinStat.textContent = slotState.pendingWin > 0 ? `${slotState.pendingWin} (Offen)` : `${slotState.lastWin}`;
      slotScoreStat.textContent = `${slotState.bankScore}`;

      slotHoldBtns.forEach((btn, idx) => {
        if (!btn) return;
        const held = slotState.holds[idx];
        btn.textContent = held ? `🔒 Walze ${idx + 1} GEHALTEN` : `🔓 Walze ${idx + 1} halten (${idx + 1})`;
        btn.style.background = held ? '#f59c00' : '#1e293b';
        btn.style.borderColor = held ? '#fde047' : '#475569';
        btn.style.color = held ? '#001830' : '#ffffff';
        btn.disabled = isAnySpinning || !slotState.holdAllowedThisTurn || slotState.pendingWin > 0 || slotState.roundFinished;
        btn.style.opacity = btn.disabled ? '0.5' : '1';
      });

      if (slotGambleBtn && slotCollectBtn) {
        const showGamble = !isAnySpinning && slotState.pendingWin > 0 && slotState.gambleStep < 3;
        slotGambleBtn.style.display = showGamble ? 'inline-flex' : 'none';
        if (showGamble) {
          slotGambleBtn.textContent = `🔥 Mut-Risiko: ${slotState.pendingWin} ➔ ${slotState.pendingWin * 2} Pkt (R)`;
        }
        slotCollectBtn.style.display = (!isAnySpinning && slotState.pendingWin > 0) ? 'inline-flex' : 'none';
        if (slotState.pendingWin > 0) {
          slotCollectBtn.textContent = `💰 ${slotState.pendingWin} Pkt sichern (Enter)`;
        }
      }

      if (slotSpinBtn) {
        if (isAnySpinning) {
          slotSpinBtn.textContent = '🛑 WALZE STOPPEN (Leertaste)';
          slotSpinBtn.style.background = '#ef4444';
        } else if (slotState.roundFinished) {
          slotSpinBtn.textContent = '🏆 HIGHSCORE EINTRAGEN';
          slotSpinBtn.style.background = '#10b981';
        } else {
          slotSpinBtn.textContent = `🎰 HEBEL ZIEHEN (${slotState.spinsLeft} Spins übrig)`;
          slotSpinBtn.style.background = 'var(--hoermann-orange)';
        }
      }
    }

    function toggleSlotHold(reelIdx) {
      if (!slotState.active || slotState.roundFinished) return;
      if (slotState.reels.some(r => r.spinning)) return;
      if (slotState.pendingWin > 0) {
        showToast('Sichere erst deinen offenen Gewinn (Enter) oder geh ins Mut-Risiko (R)! 💰');
        return;
      }
      if (!slotState.holdAllowedThisTurn) {
        showToast('Nach einem gehaltenen Dreh müssen beim nächsten Spin wieder alle 3 Walzen frei rollen! 🔄');
        return;
      }

      const currentlyHeldCount = slotState.holds.filter(Boolean).length;
      if (!slotState.holds[reelIdx] && currentlyHeldCount >= 2) {
        showToast('Du kannst maximal 2 Walzen gleichzeitig festhalten! 🔒');
        return;
      }

      slotState.holds[reelIdx] = !slotState.holds[reelIdx];
      playSound('hydraulic');
      updateSlotsUiControls();
    }

    function spawnSlotCoins(count, xOrigin, yOrigin) {
      for (let i = 0; i < count; i++) {
        slotState.floatingCoins.push({
          x: xOrigin + (Math.random() - 0.5) * 180,
          y: yOrigin + (Math.random() - 0.5) * 45,
          vx: (Math.random() - 0.5) * 9,
          vy: -Math.random() * 9 - 3,
          size: 8 + Math.random() * 6,
          life: 1
        });
      }
    }

    function collectSlotPendingWin() {
      if (slotState.pendingWin <= 0) return;
      const won = slotState.pendingWin;
      slotState.bankScore += won;
      slotState.lastWin = won;
      slotState.pendingWin = 0;
      slotState.gambleStep = 0;
      playSound('coin');
      spawnSlotCoins(20, 390, 220);
      slotState.bannerText = `💰 +${won} PUNKTE AUF DEIN MUT-KONTO GEBUCHT!`;
      slotState.bannerColor = '#34d399';
      checkIfSlotSeriesFinished();
      updateSlotsUiControls();
    }

    // Klares, direktes Mut-Risiko (Bis zu 3x pro Gewinn verdoppeln - Doppelt oder Trostpflaster!)
    function gambleSlotPendingWin() {
      if (slotState.pendingWin <= 0 || slotState.reels.some(r => r.spinning)) return;
      if (slotState.gambleStep >= 3) {
        collectSlotPendingWin();
        return;
      }

      const winChance = 0.55; // Faire 55% Mut-Chance für den Spieler!
      if (Math.random() < winChance) {
        slotState.pendingWin *= 2;
        slotState.gambleStep++;
        slotState.shakeTimer = 10;
        playSound('ladderStep');
        spawnSlotCoins(24, 390, 220);
        if (slotState.gambleStep >= 3) {
          slotState.bannerText = `👑 3x VERDOPPELT! ${slotState.pendingWin} PUNKTE SOFORT GESICHERT!`;
          slotState.bannerColor = '#fbbf24';
          triggerParticleEffect('firework');
          playSound('jackpot');
          collectSlotPendingWin();
          return;
        } else {
          slotState.bannerText = `🔥 MUT BELOHNT! VERDOPPELT AUF ${slotState.pendingWin} PKT (${slotState.gambleStep}/3)! NOCHMAL [R] ODER SICHERN [ENTER]?`;
          slotState.bannerColor = '#fbbf24';
        }
      } else {
        const consolation = 20;
        slotState.bankScore += consolation;
        slotState.lastWin = consolation;
        slotState.pendingWin = 0;
        slotState.gambleStep = 0;
        playSound('crunch');
        slotState.bannerText = `💥 VERZOCKT! ABER +${consolation} PKT HÖRMANN-TROSTPFLASTER FÜRS MUT-KONTO!`;
        slotState.bannerColor = '#f87171';
        checkIfSlotSeriesFinished();
      }
      updateSlotsUiControls();
    }

    function pullSlotLeverOrStop() {
      if (!slotState.active) return;

      if (slotState.roundFinished) {
        finishSlotsAndSubmitScore();
        return;
      }

      // Falls noch ein offener Gewinn wartet -> erst automatisch aufs Konto sichern, bevor der nächste Spin startet!
      if (slotState.pendingWin > 0 && !slotState.reels.some(r => r.spinning)) {
        collectSlotPendingWin();
        if (slotState.roundFinished) return;
      }

      // 1. Wenn Walzen gerade drehen -> Nächste drehende Walze sofort manuell per Skill-Stopp anhalten!
      const spinningReel = slotState.reels.find(r => r.spinning);
      if (spinningReel) {
        spinningReel.stopDelay = 0;
        stopSingleReel(slotState.reels.indexOf(spinningReel));
        return;
      }

      // 2. Prüfen, ob noch einer der 10 festen Spins übrig ist
      if (slotState.spinsLeft <= 0) {
        checkIfSlotSeriesFinished();
        return;
      }

      slotState.spinsLeft--;
      slotState.spinsUsed++;
      slotState.winningLines = [];
      slotState.leverPullProgress = 1.0;
      playSound('leverPull');

      const usedAnyHold = slotState.holds.some(Boolean);

      slotState.reels.forEach((reel, idx) => {
        if (slotState.holds[idx]) {
          reel.spinning = false;
          reel.speed = 0;
          reel.bounce = 6;
        } else {
          reel.spinning = true;
          reel.speed = 28 + idx * 3;
          reel.stopDelay = 24 + idx * 18;
        }
      });

      slotState.holdAllowedThisTurn = !usedAnyHold;
      slotState.holds = [false, false, false];

      slotState.bannerText = `🎰 SPIN ${slotState.spinsUsed} VON ${MAX_SLOT_SPINS} LÄUFT... DRÜCKE [LEERTASTE] ZUM STOPPEN!`;
      slotState.bannerColor = '#38bdf8';

      updateSlotsUiControls();

      if (!slotState.reels.some(r => r.spinning)) {
        evaluateSlotSpinResult();
      }
    }

    function stopSingleReel(reelIdx) {
      const reel = slotState.reels[reelIdx];
      if (!reel || !reel.spinning) return;
      reel.spinning = false;
      reel.speed = 0;
      reel.bounce = 14;

      reel.symbols = [
        pickRandomSymbolIndex(),
        pickRandomSymbolIndex(),
        pickRandomSymbolIndex()
      ];

      // Keine identischen Symbole direkt übereinander auf derselben Walze
      if (reel.symbols[1] === reel.symbols[0]) {
        reel.symbols[1] = (reel.symbols[0] + 1) % SLOT_SYMBOLS.length;
      }
      if (reel.symbols[2] === reel.symbols[1]) {
        reel.symbols[2] = (reel.symbols[1] + 2) % SLOT_SYMBOLS.length;
      }

      playSound('reelStop');

      if (!slotState.reels.some(r => r.spinning)) {
        evaluateSlotSpinResult();
      } else {
        updateSlotsUiControls();
      }
    }

    // Wertet alle 5 Gewinnlinien klar & nachvollziehbar aus (Ohne Endlos-Freispiele!)
    function evaluateSlotSpinResult() {
      const grid = [
        slotState.reels[0].symbols,
        slotState.reels[1].symbols,
        slotState.reels[2].symbols
      ];

      let totalWin = 0;
      const hitLines = [];

      SLOT_PAYLINES.forEach(line => {
        const s0 = grid[0][line.rows[0]];
        const s1 = grid[1][line.rows[1]];
        const s2 = grid[2][line.rows[2]];
        const syms = [s0, s1, s2];

        // 1. Prüfen auf 3 Gleiche (mit Hörmann-Wappen index 0 als WILD-Joker!)
        const nonWilds = syms.filter(s => s !== 0);
        let isThreeOfAKind = false;
        let targetSymIdx = 0;

        if (nonWilds.length === 0) {
          isThreeOfAKind = true;
          targetSymIdx = 0;
        } else {
          const firstNonWild = nonWilds[0];
          if (nonWilds.every(s => s === firstNonWild)) {
            isThreeOfAKind = true;
            targetSymIdx = firstNonWild;
          }
        }

        if (isThreeOfAKind) {
          const symObj = SLOT_SYMBOLS[targetSymIdx];
          const lineWin = symObj.pay3;
          totalWin += lineWin;
          hitLines.push({
            line: line,
            sym: symObj,
            count: 3,
            win: lineWin
          });
          return;
        }

        // 2. Auf den 3 waagerechten Linien zählen auch 2 nebeneinanderliegende Gleiche (Pärchen)!
        if (line.id <= 2) {
          let pairSymIdx = -1;
          if (s0 === s1 || s0 === 0 || s1 === 0) {
            pairSymIdx = s0 !== 0 ? s0 : s1;
          } else if (s1 === s2 || s2 === 0) {
            pairSymIdx = s1 !== 0 ? s1 : s2;
          }
          if (pairSymIdx >= 0) {
            const symObj = SLOT_SYMBOLS[pairSymIdx];
            const pairWin = symObj.pay2;
            totalWin += pairWin;
            hitLines.push({
              line: line,
              sym: symObj,
              count: 2,
              win: pairWin
            });
          }
        }
      });

      slotState.winningLines = hitLines;

      if (totalWin > 0) {
        slotState.pendingWin = totalWin;
        slotState.gambleStep = 0;
        const has3OfAKind = hitLines.some(h => h.count === 3);

        if (has3OfAKind) {
          slotState.shakeTimer = 16;
          playSound('jackpot');
          triggerParticleEffect('gold');
          spawnSlotCoins(32, 390, 220);
          const bestHit = hitLines.find(h => h.count === 3) || hitLines[0];
          slotState.bannerText = `🏆 3x ${bestHit.sym.short}! +${totalWin} PKT! VERDOPPELN [R] ODER SICHERN [ENTER]?`;
          slotState.bannerColor = '#fbbf24';
        } else {
          playSound('score');
          spawnSlotCoins(14, 390, 220);
          slotState.bannerText = `✨ GEWINN: +${totalWin} PKT! MUT-RISIKO: VERDOPPELN [R] ODER SICHERN [ENTER]?`;
          slotState.bannerColor = '#34d399';
        }
      } else {
        slotState.bannerText = slotState.spinsLeft > 0
          ? '⚡ KEIN TREFFER – HALT GUTE WALZEN MIT [1] [2] [3] FEST & ZIEH NOCHMAL!'
          : '🏁 ALLE 10 SPINS GESPIELT!';
        slotState.bannerColor = '#94a3b8';
        checkIfSlotSeriesFinished();
      }

      updateSlotsUiControls();
    }

    function checkIfSlotSeriesFinished() {
      if (slotState.spinsLeft <= 0 && slotState.pendingWin <= 0) {
        slotState.roundFinished = true;
        playSound('victory');
        triggerParticleEffect('confetti');
        slotState.bannerText = `🏁 10 SPINS BEENDET! DEIN ERGEBNIS: ${slotState.bankScore} PUNKTE!`;
        slotState.bannerColor = '#10b981';
        updateSlotsUiControls();
        HoermannGameSession.delay(() => {
          if (slotState.active && slotState.roundFinished && slotState.bankScore > 0) {
            promptScoreSubmit(slotState.bankScore, 'slots', 'Der Hörmann Mut-Automat');
          }
        }, 600);
      }
    }

    function finishSlotsAndSubmitScore() {
      if (slotState.pendingWin > 0) {
        collectSlotPendingWin();
      }
      if (slotState.bankScore <= 0) {
        showToast('Erspiele erst Punkte am Automaten, bevor du dich einträgst! 🎰');
        return;
      }
      slotState.roundFinished = true;
      updateSlotsUiControls();
      promptScoreSubmit(slotState.bankScore, 'slots', 'Der Hörmann Mut-Automat');
    }

    if (slotSpinBtn) slotSpinBtn.addEventListener('click', pullSlotLeverOrStop);
    if (slotCollectBtn) slotCollectBtn.addEventListener('click', collectSlotPendingWin);
    if (slotGambleBtn) slotGambleBtn.addEventListener('click', gambleSlotPendingWin);
    if (slotCashoutBtn) slotCashoutBtn.addEventListener('click', finishSlotsAndSubmitScore);
    if (restartSlotsBtn) restartSlotsBtn.addEventListener('click', startSlotsGame);
    slotHoldBtns.forEach((btn, idx) => {
      if (btn) btn.addEventListener('click', () => toggleSlotHold(idx));
    });

    if (slotsCanvas) {
      slotsCanvas.addEventListener('pointerdown', (e) => {
        if (!slotState.active) return;
        const rect = slotsCanvas.getBoundingClientRect();
        const scaleX = slotsCanvas.width / rect.width;
        const scaleY = slotsCanvas.height / rect.height;
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        // Falls ein Gewinn offen ist: Klick auf die eingeblendeten Risiko-/Sichern-Buttons unten im Canvas
        if (slotState.pendingWin > 0 && !slotState.reels.some(re => re.spinning)) {
          if (mx >= 115 && mx <= 380 && my >= 340 && my <= 382) {
            gambleSlotPendingWin();
            return;
          }
          if (mx >= 400 && mx <= 665 && my >= 340 && my <= 382) {
            collectSlotPendingWin();
            return;
          }
        }

        // Klick direkt auf eine der 3 großen Walzen (stoppt im Lauf oder schaltet HOLD um)
        for (let r = 0; r < 3; r++) {
          const rx = 96 + r * 186;
          if (mx >= rx && mx <= rx + 170 && my >= 95 && my <= 380) {
            if (slotState.reels.some(re => re.spinning)) {
              stopSingleReel(r);
            } else {
              toggleSlotHold(r);
            }
            return;
          }
        }

        // Klick auf den BiSecur-Hebel rechts oder Restfläche startet den Spin
        pullSlotLeverOrStop();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!slotState.active) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        pullSlotLeverOrStop();
      } else if (e.key === '1') {
        e.preventDefault();
        toggleSlotHold(0);
      } else if (e.key === '2') {
        e.preventDefault();
        toggleSlotHold(1);
      } else if (e.key === '3') {
        e.preventDefault();
        toggleSlotHold(2);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        gambleSlotPendingWin();
      } else if (e.key === 'Enter' && slotState.pendingWin > 0) {
        e.preventDefault();
        collectSlotPendingWin();
      }
    });

    // Zeichnet jedes der 6 Hörmann-Symbole groß, kontrastreich & aufgeräumt
    function drawSlotSymbolIcon(ctx, symIdx, cx, cy, isHighlighted) {
      const sym = SLOT_SYMBOLS[symIdx] || SLOT_SYMBOLS[0];
      ctx.save();

      // Große, klare Walzen-Karte (148 x 68 px)
      ctx.fillStyle = isHighlighted ? '#fef3c7' : sym.bg;
      ctx.fillRect(cx - 74, cy - 34, 148, 68);
      ctx.strokeStyle = isHighlighted ? '#f59c00' : sym.color;
      ctx.lineWidth = isHighlighted ? 3.5 : 2;
      ctx.strokeRect(cx - 74, cy - 34, 148, 68);

      // Icon links auf der Karte (cx - 38), Name & Punkte rechts daneben für perfekte Lesbarkeit!
      const ix = cx - 36;
      const iy = cy;

      if (sym.id === 'WILD') {
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(ix - 26, iy - 20, 52, 40);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.strokeRect(ix - 26, iy - 20, 52, 40);
        ctx.fillStyle = '#002d62';
        ctx.font = '900 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HÖRMANN', ix, iy - 3);
        ctx.fillStyle = '#fde047';
        ctx.font = '900 10px Inter, sans-serif';
        ctx.fillText('★ WILD ★', ix, iy + 12);
      } else if (sym.id === 'GATE') {
        ctx.fillStyle = '#002d62';
        ctx.fillRect(ix - 25, iy - 21, 50, 42);
        for (let l = 0; l < 4; l++) {
          ctx.fillStyle = l === 1 ? '#38bdf8' : '#f59c00';
          ctx.fillRect(ix - 21, iy - 17 + l * 9, 42, 7);
        }
      } else if (sym.id === 'FORKLIFT') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(ix - 22, iy - 8, 26, 18);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ix - 16, iy - 20, 16, 12);
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(ix + 5, iy - 22, 4, 34);
        ctx.fillRect(ix + 9, iy + 2, 14, 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(ix + 10, iy - 8, 12, 10);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ix - 15, iy + 12, 5, 0, Math.PI * 2);
        ctx.arc(ix - 1, iy + 12, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (sym.id === 'DENNIS') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(ix, iy - 6, 16, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(ix - 19, iy - 7, 38, 5);
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(ix - 11, iy - 2, 22, 15);
        ctx.fillStyle = '#002d62';
        ctx.fillRect(ix - 7, iy + 2, 4, 4);
        ctx.fillRect(ix + 3, iy + 2, 4, 4);
      } else if (sym.id === 'MOTOR') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(ix - 22, iy - 16, 44, 28);
        ctx.fillStyle = '#002d62';
        ctx.fillRect(ix - 17, iy - 11, 34, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(ix - 12, iy - 7, 24, 4);
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(ix - 6, iy + 5, 12, 5);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix - 14, iy - 16, 26, 30);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(ix + 12, iy - 10, 7, 14);
        ctx.fillStyle = '#002d62';
        ctx.fillRect(ix - 14, iy - 6, 26, 11);
        ctx.fillStyle = '#f59c00';
        ctx.font = '900 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MUT', ix - 1, iy + 2);
      }

      // Klar lesbarer Symbolname & Gewinnwert rechts neben dem Icon
      ctx.fillStyle = isHighlighted ? '#002d62' : '#ffffff';
      ctx.font = '900 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(sym.short, cx - 2, cy - 4);

      ctx.fillStyle = isHighlighted ? '#d97706' : sym.color;
      ctx.font = '900 11px monospace';
      ctx.fillText(`3x = ${sym.pay3} Pkt`, cx - 2, cy + 14);

      ctx.restore();
    }

    function slotLoop(frameTime) {
      if (!(slotState.active && sCtx)) return;
      HoermannGameClock.run("slotLoop", frameTime, () => {
      if (!slotState.active || !sCtx) return;

      slotState.bulbPhase += 0.1;

      if (slotState.leverPullProgress > 0) {
        slotState.leverPullProgress = Math.max(0, slotState.leverPullProgress - 0.06);
      }

      slotState.reels.forEach((reel, idx) => {
        if (reel.spinning) {
          const prevTick = Math.floor(reel.pos / 26);
          reel.pos += reel.speed;
          const newTick = Math.floor(reel.pos / 26);
          if (newTick !== prevTick && idx === 0) {
            playSound('slotTick');
          }
          if (reel.stopDelay > 0) {
            reel.stopDelay--;
            if (reel.stopDelay <= 0) {
              stopSingleReel(idx);
            }
          }
        } else if (reel.bounce > 0) {
          reel.bounce = Math.max(0, reel.bounce - 1.5);
        }
      });

      for (let i = slotState.floatingCoins.length - 1; i >= 0; i--) {
        const c = slotState.floatingCoins[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.42;
        c.life -= 0.022;
        if (c.life <= 0) slotState.floatingCoins.splice(i, 1);
      }

      drawSlotsScene();

      });
      if (slotState.active && sCtx) slotAnimId = requestAnimationFrame(slotLoop);
    }

    function drawSlotsScene() {
      if (!sCtx) return;
      sCtx.save();

      if (slotState.shakeTimer > 0) {
        slotState.shakeTimer--;
        const sx = (Math.random() - 0.5) * 6;
        const sy = (Math.random() - 0.5) * 6;
        sCtx.translate(sx, sy);
      }

      // 1. Aufgeräumter dunkelblauer Hörmann-Hintergrund
      const bgGrad = sCtx.createLinearGradient(0, 0, 0, slotsCanvas.height);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      sCtx.fillStyle = bgGrad;
      sCtx.fillRect(0, 0, slotsCanvas.width, slotsCanvas.height);

      // 2. TOP HEADER & KOMPAKTE GEWINN-ÜBERSICHT
      sCtx.fillStyle = '#002d62';
      sCtx.fillRect(20, 10, 740, 72);
      sCtx.strokeStyle = '#f59c00';
      sCtx.lineWidth = 3;
      sCtx.strokeRect(20, 10, 740, 72);

      // Dezente Lichterkette oben
      for (let b = 0; b < 24; b++) {
        const bx = 34 + b * 31;
        const isLit = Math.floor(slotState.bulbPhase + b) % 2 === 0;
        sCtx.fillStyle = isLit ? '#fde047' : '#78350f';
        sCtx.beginPath();
        sCtx.arc(bx, 16, 3, 0, Math.PI * 2);
        sCtx.fill();
      }

      sCtx.fillStyle = '#fde047';
      sCtx.font = '900 17px Inter, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('🎰 DER HÖRMANN MUT-AUTOMAT • 10 SPINS ZUM REKORD 🎰', 390, 36);

      // Kompakte 1-Zeilen-Gewinntabelle im Header
      sCtx.fillStyle = '#cbd5e1';
      sCtx.font = '700 10.5px Inter, sans-serif';
      sCtx.fillText('3x Gleiche:  🛡️ WILD 1000  •  🚪 Tor 600  •  🚜 Stapler 400  •  👷 Dennis 250  •  ⚡ Antrieb 160  •  ☕ Kaffee 100', 390, 54);

      // Status-Banner
      sCtx.fillStyle = slotState.bannerColor || '#ffffff';
      sCtx.font = '800 12px Inter, sans-serif';
      sCtx.fillText(slotState.bannerText, 390, 74);

      // 3. GROSSES ZENTRALES 3-WALZEN-GEHÄUSE (Übersichtlich & ohne Seiten-Ballast!)
      sCtx.fillStyle = '#020617';
      sCtx.fillRect(80, 90, 580, 298);
      sCtx.strokeStyle = slotState.pendingWin > 0 ? '#fde047' : '#f59c00';
      sCtx.lineWidth = 4;
      sCtx.strokeRect(80, 90, 580, 298);

      const rowCentersY = [136, 212, 288];
      rowCentersY.forEach((ry, rIdx) => {
        sCtx.fillStyle = rIdx === 1 ? '#f59c00' : '#38bdf8';
        sCtx.fillRect(80, ry - 8, 8, 16);
        sCtx.fillRect(652, ry - 8, 8, 16);
      });

      // Die 3 großen, breiten Walzen zeichnen
      for (let r = 0; r < 3; r++) {
        const reel = slotState.reels[r];
        const rx = 96 + r * 186;
        const centerX = rx + 85;

        sCtx.fillStyle = '#0f172a';
        sCtx.fillRect(rx, 98, 170, 236);
        sCtx.strokeStyle = slotState.holds[r] ? '#f59c00' : '#334155';
        sCtx.lineWidth = slotState.holds[r] ? 3 : 1.5;
        sCtx.strokeRect(rx, 98, 170, 236);

        sCtx.save();
        sCtx.beginPath();
        sCtx.rect(rx, 98, 170, 236);
        sCtx.clip();

        if (reel.spinning) {
          const offset = (reel.pos % 76);
          for (let k = -1; k <= 3; k++) {
            const symIdx = Math.abs(Math.floor((reel.pos / 76) + k + r * 2)) % SLOT_SYMBOLS.length;
            const sy = 136 + k * 76 + offset - 38;
            drawSlotSymbolIcon(sCtx, symIdx, centerX, sy, false);
          }
        } else {
          const bounceY = Math.sin(reel.bounce * 0.6) * (reel.bounce * 0.8);
          for (let row = 0; row < 3; row++) {
            const symIdx = reel.symbols[row];
            const sy = rowCentersY[row] + bounceY;
            const isWinCell = slotState.winningLines.some(w => w.line.rows[r] === row);
            drawSlotSymbolIcon(sCtx, symIdx, centerX, sy, isWinCell);
          }
        }
        sCtx.restore();

        // Wenn kein Gewinn offen ist: Große, klickbare HOLD-Buttons direkt unter jeder Walze
        if (slotState.pendingWin <= 0) {
          const isHeld = slotState.holds[r];
          sCtx.fillStyle = isHeld ? '#f59c00' : '#1e293b';
          sCtx.fillRect(rx + 8, 342, 154, 34);
          sCtx.strokeStyle = isHeld ? '#fde047' : '#475569';
          sCtx.lineWidth = 2;
          sCtx.strokeRect(rx + 8, 342, 154, 34);

          sCtx.fillStyle = isHeld ? '#001830' : '#e2e8f0';
          sCtx.font = '900 11.5px Inter, sans-serif';
          sCtx.textAlign = 'center';
          sCtx.fillText(isHeld ? `🔒 WALZE ${r + 1} GEHALTEN` : `🔓 WALZE ${r + 1} HALTEN [${r + 1}]`, centerX, 363);
        }
      }

      // Falls ein Gewinn offen ist: Statt der Hold-Leiste erscheint eine unübersehbare MUT-RISIKO Entscheidungsleiste!
      if (slotState.pendingWin > 0 && !slotState.reels.some(re => re.spinning)) {
        // Button Links: Verdoppeln (R)
        sCtx.fillStyle = '#dc2626';
        sCtx.fillRect(104, 340, 265, 38);
        sCtx.strokeStyle = '#fde047';
        sCtx.lineWidth = 2.5;
        sCtx.strokeRect(104, 340, 265, 38);
        sCtx.fillStyle = '#ffffff';
        sCtx.font = '900 12px Inter, sans-serif';
        sCtx.textAlign = 'center';
        sCtx.fillText(`🔥 RISIKO: VERDOPPELN AUF ${slotState.pendingWin * 2} [R]`, 236, 363);

        // Button Rechts: Sichern (Enter)
        sCtx.fillStyle = '#16a34a';
        sCtx.fillRect(380, 340, 265, 38);
        sCtx.strokeStyle = '#86efac';
        sCtx.lineWidth = 2.5;
        sCtx.strokeRect(380, 340, 265, 38);
        sCtx.fillStyle = '#ffffff';
        sCtx.fillText(`💰 +${slotState.pendingWin} PUNKTE SICHERN [ENTER]`, 512, 363);
      }

      // Gewinnlinien einzeichnen
      slotState.winningLines.forEach(winItem => {
        const line = winItem.line;
        const xCoords = [181, 367, 553];
        sCtx.save();
        sCtx.strokeStyle = line.color;
        sCtx.lineWidth = 5;
        sCtx.shadowColor = line.color;
        sCtx.shadowBlur = 12;
        sCtx.beginPath();
        sCtx.moveTo(xCoords[0], rowCentersY[line.rows[0]]);
        sCtx.lineTo(xCoords[1], rowCentersY[line.rows[1]]);
        sCtx.lineTo(xCoords[2], rowCentersY[line.rows[2]]);
        sCtx.stroke();
        sCtx.restore();
      });

      // 4. GROSSER GOLDENER BISECUR-HEBEL RECHTS AM GEHÄUSE
      const leverX = 706;
      const leverTopY = 125 + slotState.leverPullProgress * 135;
      sCtx.fillStyle = '#334155';
      sCtx.fillRect(660, 225, 24, 52);
      sCtx.strokeStyle = '#94a3b8';
      sCtx.lineWidth = 8;
      sCtx.beginPath();
      sCtx.moveTo(leverX, 252);
      sCtx.lineTo(leverX, leverTopY);
      sCtx.stroke();

      sCtx.fillStyle = '#f59c00';
      sCtx.beginPath();
      sCtx.arc(leverX, leverTopY, 18, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.strokeStyle = '#fde047';
      sCtx.lineWidth = 3;
      sCtx.stroke();

      sCtx.fillStyle = '#94a3b8';
      sCtx.font = '800 10px Inter, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('HEBEL', leverX, 305);
      sCtx.fillText('[SPACE]', leverX, 320);

      // 5. UNTERE FORTSCHRITTS- & KONTO-LEISTE (10 Spins Kugeln + Punktestand)
      sCtx.fillStyle = '#0f172a';
      sCtx.fillRect(20, 395, 740, 38);
      sCtx.strokeStyle = '#334155';
      sCtx.lineWidth = 1.5;
      sCtx.strokeRect(20, 395, 740, 38);

      // Links: 10 Spin-Lämpchen zur klaren Runden-Übersicht
      sCtx.fillStyle = '#cbd5e1';
      sCtx.font = '800 11.5px Inter, sans-serif';
      sCtx.textAlign = 'left';
      sCtx.fillText(`SPINS (${slotState.spinsLeft} übrig):`, 34, 418);

      for (let s = 0; s < MAX_SLOT_SPINS; s++) {
        const sx = 155 + s * 22;
        const isRemaining = s < slotState.spinsLeft;
        sCtx.fillStyle = isRemaining ? '#f59c00' : '#334155';
        sCtx.beginPath();
        sCtx.arc(sx, 414, 7, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.strokeStyle = isRemaining ? '#fde047' : '#475569';
        sCtx.lineWidth = 1.5;
        sCtx.stroke();
      }

      // Rechts: Aktuelles Mut-Konto
      sCtx.fillStyle = '#fde047';
      sCtx.font = '900 14px monospace';
      sCtx.textAlign = 'right';
      sCtx.fillText(`💰 MUT-KONTO: ${slotState.bankScore} PUNKTE`, 744, 419);

      // Fliegende Goldmünzen zeichnen
      slotState.floatingCoins.forEach(c => {
        sCtx.save();
        sCtx.globalAlpha = Math.max(0, c.life);
        sCtx.fillStyle = '#fde047';
        sCtx.beginPath();
        sCtx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.strokeStyle = '#d97706';
        sCtx.lineWidth = 2;
        sCtx.stroke();
        sCtx.restore();
      });

      sCtx.restore();
    }

