    /* ==========================================================
       8. GAME 0: SUPER DENNIS (OPTIMIERTE MARIO-PHYSIK & LEVELDESIGN)
       ========================================================== */
    const mCanvas = document.getElementById('marioCanvas');
    const mCtx = mCanvas.getContext('2d');
    const mLivesSpan = document.getElementById('mario-lives');
    const mCoinsSpan = document.getElementById('mario-coins');
    const mLettersSpan = document.getElementById('mario-letters');
    const mScoreSpan = document.getElementById('mario-score');
    const restartMarioBtn = document.getElementById('restart-mario-btn');

    const dennisImg = new Image();
    let dennisImgLoaded = false;
    dennisImg.onload = () => { dennisImgLoaded = true; };
    dennisImg.src = 'characters-clean.png';

    let marioActive = false;
    let marioLoopId = null;
    let cameraX = 0;
    let mScore = 0;
    let mCoins = 0;
    let mLives = 3;
    let mLetters = { M: false, U: false, T: false };

    // Dennis Player Object with advanced platformer feel
    let dennis = {
      x: 80,
      y: 250,
      w: 32,
      h: 50,
      vx: 0,
      vy: 0,
      speed: 4.4,
      jumpForce: -12.2,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      facing: 1,
      invincibleTimer: 0,
      starTimer: 0,
      dead: false,
      won: false
    };

    let mKeys = { left: false, right: false, up: false, jumpPressed: false };

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (marioView.style.display !== 'none') {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') { mKeys.left = true; e.preventDefault(); }
        if (e.code === 'KeyD' || e.code === 'ArrowRight') { mKeys.right = true; e.preventDefault(); }
        if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
          if (!mKeys.up) {
            dennis.jumpBufferTimer = 8; // Jump buffering
          }
          mKeys.up = true;
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') mKeys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') mKeys.right = false;
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        mKeys.up = false;
        // Variable jump: cutting upward velocity on early release for short hops
        if (dennis.vy < -4) {
          dennis.vy = -4;
        }
      }
    });

    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');

    const bindTouch = (elem, pressHandler, releaseHandler) => {
      // Pointer-Capture: Loslassen ausserhalb des Buttons haengt nie fest.
      let down = false;
      const release = (e) => {
        if (e) e.preventDefault();
        if (!down) return;
        down = false;
        elem.classList.remove('is-down');
        releaseHandler();
      };
      elem.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { elem.setPointerCapture(e.pointerId); } catch (_) {}
        if (down) return;
        down = true;
        elem.classList.add('is-down');
        pressHandler();
      });
      elem.addEventListener('pointerup', release);
      elem.addEventListener('pointercancel', release);
      elem.addEventListener('lostpointercapture', release);
      elem.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    function resetMarioKeys() {
      mKeys.left = false; mKeys.right = false; mKeys.up = false;
      document.querySelectorAll('.mario-touch-bar .touch-btn').forEach(b => b.classList.remove('is-down'));
    }
    window.addEventListener('blur', resetMarioKeys);
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetMarioKeys(); });

    bindTouch(btnLeft, () => { mKeys.left = true; }, () => { mKeys.left = false; });
    bindTouch(btnRight, () => { mKeys.right = true; }, () => { mKeys.right = false; });
    bindTouch(btnJump, () => {
      dennis.jumpBufferTimer = 8;
      mKeys.up = true;
    }, () => {
      mKeys.up = false;
      if (dennis.vy < -4) dennis.vy = -4;
    });

    // Level Elements: REDESIGNED WITH ACCESSIBLE PIPES AND FAIR RUNWAY
    let mPlatforms = [];
    let mBlocks = [];
    let mCoinsList = [];
    let mEnemies = [];
    let mFloatingTexts = [];
    let mLastSafe = { x: 80, y: 250 };
    let levelGoal = { x: 2560, y: 120, w: 70, h: 200, touched: false };

    function initMarioLevel() {
      mScore = 0;
      mCoins = 0;
      mLives = 3;
      mLetters = { M: false, U: false, T: false };
      updateMarioHUD();

      cameraX = 0;
      dennis.x = 80;
      dennis.y = 250;
      dennis.vx = 0;
      dennis.vy = 0;
      dennis.grounded = false;
      dennis.coyoteTimer = 0;
      dennis.jumpBufferTimer = 0;
      dennis.dead = false;
      dennis.won = false;
      dennis.invincibleTimer = 0;
      dennis.starTimer = 0;
      dennis.facing = 1;
      mLastSafe = { x: 80, y: 250 };
      resetMarioKeys();

      mFloatingTexts = [];
      levelGoal.touched = false;

      // CONTINUOUS, FAIR SOLID GROUND & CLEAR ACCESSIBLE PIPES
      // Notice: Pipes are now placed SAFELY in the center of solid ground (never near pits!)
      // And pipe heights are comfortable (42px to 54px), so Dennis easily jumps over them!
      mPlatforms = [
        // Solid Ground 1: 0 to 950 (A huge solid runway!)
        { x: 0, y: 320, w: 950, h: 60, type: 'ground' },

        // Solid Ground 2: 1040 to 1800 (Clean 90px pit between 950 and 1040)
        { x: 1040, y: 320, w: 760, h: 60, type: 'ground' },

        // Solid Ground 3: 1890 to 2850 (Clean 90px pit between 1800 and 1890)
        { x: 1890, y: 320, w: 960, h: 60, type: 'ground' },

        // Hörmann Sektionaltor Pipes (Centered comfortably, low height!)
        { x: 340, y: 278, w: 46, h: 42, type: 'pipe' }, // Low tutorial pipe
        { x: 620, y: 268, w: 48, h: 52, type: 'pipe' }, // Low pipe with coin above
        { x: 1380, y: 268, w: 48, h: 52, type: 'pipe' }, // Middle pipe
        { x: 2120, y: 268, w: 50, h: 52, type: 'pipe' }, // Late level pipe

        // Steel girders & bridges (Hörmann Stahlträger overhead)
        { x: 440, y: 220, w: 120, h: 16, type: 'steel' },
        { x: 740, y: 190, w: 140, h: 16, type: 'steel' },
        { x: 1140, y: 210, w: 160, h: 16, type: 'steel' },
        { x: 1540, y: 180, w: 160, h: 16, type: 'steel' },
        { x: 1960, y: 200, w: 120, h: 16, type: 'steel' },

        // Mario-Style Final Staircase to Goal (x: 2320..2480)
        { x: 2320, y: 290, w: 34, h: 30, type: 'step' },
        { x: 2354, y: 260, w: 34, h: 60, type: 'step' },
        { x: 2388, y: 230, w: 34, h: 90, type: 'step' },
        { x: 2422, y: 200, w: 34, h: 120, type: 'step' },
        { x: 2456, y: 170, w: 50, h: 150, type: 'step' }
      ];

      // Question blocks [?] & Bricks [🧱]
      mBlocks = [
        { x: 190, y: 210, w: 32, h: 32, type: 'question', content: 'coin', hit: false, bumpY: 0 },
        { x: 470, y: 110, w: 32, h: 32, type: 'question', content: 'coin', hit: false, bumpY: 0 },
        { x: 502, y: 110, w: 32, h: 32, type: 'brick', bumpY: 0 },
        { x: 534, y: 110, w: 32, h: 32, type: 'question', content: 'star', hit: false, bumpY: 0 },

        { x: 1180, y: 100, w: 32, h: 32, type: 'question', content: 'coin', hit: false, bumpY: 0 },
        { x: 1212, y: 100, w: 32, h: 32, type: 'question', content: 'bisecur', hit: false, bumpY: 0 },

        { x: 1600, y: 70, w: 32, h: 32, type: 'question', content: 'coin', hit: false, bumpY: 0 },
        { x: 1632, y: 70, w: 32, h: 32, type: 'brick', bumpY: 0 },
        { x: 1664, y: 70, w: 32, h: 32, type: 'question', content: 'coin', hit: false, bumpY: 0 }
      ];

      // Coins scattered across level
      mCoinsList = [
        { x: 206, y: 170, collected: false },
        { x: 364, y: 230, collected: false },
        { x: 460, y: 180, collected: false },
        { x: 500, y: 180, collected: false },
        { x: 644, y: 220, collected: false },
        { x: 770, y: 150, collected: false },
        { x: 810, y: 150, collected: false },
        { x: 1100, y: 270, collected: false },
        { x: 1196, y: 62, collected: false },
        { x: 1404, y: 220, collected: false },
        { x: 1580, y: 140, collected: false },
        { x: 1620, y: 140, collected: false },
        { x: 2000, y: 160, collected: false },
        { x: 2144, y: 220, collected: false },
        { x: 2476, y: 130, collected: false }
      ];

      // M-U-T Giant letters
      mCoinsList.push({ x: 518, y: 62, collected: false, letter: 'M' });
      mCoinsList.push({ x: 1232, y: 62, collected: false, letter: 'U' });
      mCoinsList.push({ x: 1980, y: 140, collected: false, letter: 'T' });

      // Zweifel-Enemies (Stompable like Goombas)
      mEnemies = [
        { x: 490, y: 288, w: 30, h: 30, vx: -1.1, name: "Zweifel", alive: true },
        { x: 800, y: 288, w: 30, h: 30, vx: -1.0, name: "Angst", alive: true },
        { x: 1240, y: 288, w: 30, h: 30, vx: 1.1, name: "Aufschieben", alive: true },
        { x: 1500, y: 288, w: 30, h: 30, vx: -1.2, name: "Zweifel", alive: true },
        { x: 2020, y: 288, w: 30, h: 30, vx: -1.1, name: "Blues", alive: true }
      ];
    }

    function updateMarioHUD() {
      let hearts = "";
      for (let i = 0; i < mLives; i++) hearts += "❤️";
      mLivesSpan.textContent = hearts || "💀";
      mCoinsSpan.textContent = `🪙 ${mCoins}`;
      mScoreSpan.textContent = mScore;

      let lStr = "";
      lStr += mLetters.M ? "<span style='color:var(--hoermann-orange)'>M</span>" : "-";
      lStr += mLetters.U ? "<span style='color:var(--hoermann-orange)'>U</span>" : "-";
      lStr += mLetters.T ? "<span style='color:var(--hoermann-orange)'>T</span>" : "-";
      mLettersSpan.innerHTML = lStr;
    }

    function startMarioGame() {
      initMarioLevel();
      scoreSubmitDialog.classList.remove('show');
      highscoreCard.classList.remove('show');

      marioActive = true;
      if (marioLoopId) cancelAnimationFrame(marioLoopId);
      HoermannGameClock.reset("marioLoop");
      marioLoop();
      playSound('coin');
    }

    function stopMarioGame() {
      marioActive = false;
      if (marioLoopId) cancelAnimationFrame(marioLoopId);
      resetMarioKeys();
    }

    restartMarioBtn.addEventListener('click', startMarioGame);

    function marioLoop(frameTime) {
      if (!(marioActive)) return;
      HoermannGameClock.run("marioLoop", frameTime, () => {
      if (!marioActive) return;
      updateMarioPhysics();
      drawMarioScene();

      });
      if (marioActive) marioLoopId = requestAnimationFrame(marioLoop);
    }

    function updateMarioPhysics() {
      if (dennis.dead || dennis.won) return;

      // Horizontal controls
      if (mKeys.left) {
        dennis.vx = -dennis.speed;
        dennis.facing = -1;
      } else if (mKeys.right) {
        dennis.vx = dennis.speed;
        dennis.facing = 1;
      } else {
        dennis.vx *= 0.76;
        if (Math.abs(dennis.vx) < 0.2) dennis.vx = 0;
      }

      // Coyote Time & Jump Buffering
      if (dennis.grounded) {
        dennis.coyoteTimer = 6;
      } else if (dennis.coyoteTimer > 0) {
        dennis.coyoteTimer--;
      }

      if (dennis.jumpBufferTimer > 0) {
        dennis.jumpBufferTimer--;
        if (dennis.coyoteTimer > 0) {
          dennis.vy = dennis.jumpForce;
          dennis.grounded = false;
          dennis.coyoteTimer = 0;
          dennis.jumpBufferTimer = 0;
          playSound('jump');
        }
      }

      // Gravity
      dennis.vy += 0.58;
      if (dennis.vy > 12) dennis.vy = 12;

      // PROPER COLLISION RESOLUTION (SEPARATE AXES WITH SAFE SKIN MARGINS)
      // 1. Move X and resolve X collisions
      dennis.x += dennis.vx;
      if (dennis.x < 0) { dennis.x = 0; dennis.vx = 0; } // linke Levelgrenze
      if (dennis.x > 2850 - dennis.w) dennis.x = 2850 - dennis.w;

      // Inset vertical bounds by 6px so Dennis' feet NEVER snag on floor seams or pipe tops!
      const playerTop = dennis.y + 6;
      const playerBottom = dennis.y + dennis.h - 6;

      const allSolids = [...mPlatforms, ...mBlocks];

      for (let s of allSolids) {
        const solidDrawY = s.y - (s.bumpY || 0);
        if (dennis.x < s.x + s.w && dennis.x + dennis.w > s.x &&
            playerBottom > solidDrawY && playerTop < solidDrawY + s.h) {
          if (dennis.vx > 0) {
            dennis.x = s.x - dennis.w;
            dennis.vx = 0;
          } else if (dennis.vx < 0) {
            dennis.x = s.x + s.w;
            dennis.vx = 0;
          }
        }
      }

      // 2. Move Y and resolve Y collisions
      const prevBottom = dennis.y + dennis.h;
      let landedOn = null;
      dennis.y += dennis.vy;
      dennis.grounded = false;

      // Inset horizontal bounds by 5px so corner clipping never halts Dennis
      const playerLeft = dennis.x + 5;
      const playerRight = dennis.x + dennis.w - 5;

      for (let s of allSolids) {
        const solidDrawY = s.y - (s.bumpY || 0);
        if (playerRight > s.x && playerLeft < s.x + s.w &&
            dennis.y < solidDrawY + s.h && dennis.y + dennis.h > solidDrawY) {
          if (dennis.vy >= 0 && prevBottom <= solidDrawY + 4) {
            // Land on top (nur von oben: kein Hochteleportieren mehr)
            dennis.y = solidDrawY - dennis.h;
            dennis.vy = 0;
            dennis.grounded = true;
            landedOn = s;
          } else if (dennis.vy < 0) {
            // Ecken-Hilfe: nur wenige Pixel Ueberlappung -> seitlich vorbeirutschen
            const ovl = Math.min(playerRight, s.x + s.w) - Math.max(playerLeft, s.x);
            if (ovl <= 8) {
              dennis.x += (dennis.x + dennis.w / 2 < s.x + s.w / 2) ? -ovl : ovl;
              continue;
            }
            // Hit from below
            dennis.y = solidDrawY + s.h;
            dennis.vy = 1;
            if (s.type === 'question' || s.type === 'brick') {
              hitMarioBlock(s);
            }
          }
        }
      }

      // Merke sicheren Boden fuer faires Respawnen nach Sturz
      if (landedOn && landedOn.type === 'ground' &&
          dennis.x > landedOn.x + 40 && dennis.x + dennis.w < landedOn.x + landedOn.w - 40) {
        mLastSafe = { x: dennis.x, y: dennis.y };
      }

      // Fell into pit
      if (dennis.y > mCanvas.height + 60) {
        dennisHurt(true);
      }

      // Collect Coins & MUT Letters
      mCoinsList.forEach(c => {
        if (!c.collected && Math.hypot((dennis.x + dennis.w / 2) - c.x, (dennis.y + dennis.h / 2) - c.y) < 28) {
          c.collected = true;
          if (c.letter) {
            mLetters[c.letter] = true;
            mScore += 300;
            playSound('powerup');
            mFloatingTexts.push({ x: c.x, y: c.y, text: `MUT-BUCHSTABE '${c.letter}'! +300`, color: '#f59c00', alpha: 1 });
            if (mLetters.M && mLetters.U && mLetters.T) {
              mScore += 1000;
              mFloatingTexts.push({ x: c.x, y: c.y - 30, text: `🌟 MUT VOLLSTÄNDIG! +1000`, color: '#f59c00', alpha: 1 });
              triggerParticleEffect('gold');
            }
          } else {
            mCoins++;
            mScore += 50;
            playSound('coin');
            mFloatingTexts.push({ x: c.x, y: c.y, text: "+50", color: '#ffaa1d', alpha: 1 });
          }
          updateMarioHUD();
        }
      });

      // Update Enemies
      mEnemies.forEach(e => {
        if (!e.alive) return;
        // Patrouille: an Rohren/Stufen/Bloecken und Grubenkanten umdrehen
        const nx = e.x + e.vx;
        const frontX = e.vx > 0 ? nx + e.w : nx;
        let turn = false;
        for (const s of allSolids) {
          if (frontX > s.x && frontX < s.x + s.w && e.y + e.h - 2 > s.y && e.y + 2 < s.y + s.h) { turn = true; break; }
        }
        if (!turn) {
          turn = !mPlatforms.some(s => s.type === 'ground' && frontX >= s.x && frontX <= s.x + s.w);
        }
        if (turn) e.vx *= -1; else e.x = nx;

        if (dennis.x < e.x + e.w && dennis.x + dennis.w > e.x &&
            dennis.y < e.y + e.h && dennis.y + dennis.h > e.y) {
          if ((dennis.vy > 0 && dennis.y + dennis.h - dennis.vy <= e.y + 22) || dennis.starTimer > 0) {
            e.alive = false;
            dennis.vy = mKeys.up ? -11.5 : -8.5; // Sprungtaste gehalten = hoeherer Abpraller
            mScore += 200;
            updateMarioHUD();
            playSound('stomp');
            mFloatingTexts.push({ x: e.x, y: e.y, text: "ZWEIFEL BESIEGT! +200", color: '#10b981', alpha: 1 });
          } else {
            dennisHurt(false);
          }
        }
      });

      // Check Werkstor Goal
      if (!levelGoal.touched && dennis.x + dennis.w > levelGoal.x) {
        levelGoal.touched = true;
        dennisWinLevel();
      }

      // Smooth camera follows player
      const targetCamX = dennis.x - mCanvas.width * 0.38 + dennis.facing * 40;
      cameraX += (targetCamX - cameraX) * 0.14;
      if (cameraX < 0) cameraX = 0;
      if (cameraX > 2850 - mCanvas.width) cameraX = 2850 - mCanvas.width;

      if (dennis.invincibleTimer > 0) dennis.invincibleTimer--;
      if (dennis.starTimer > 0) dennis.starTimer--;

      mBlocks.forEach(b => {
        if (b.bumpY > 0) b.bumpY -= 1.5;
        else b.bumpY = 0;
      });
    }

    function hitMarioBlock(b) {
      if (b.hit && b.type === 'question') return;
      b.bumpY = 8;

      if (b.type === 'question') {
        b.hit = true;
        if (b.content === 'coin') {
          mCoins++;
          mScore += 100;
          playSound('coin');
          mFloatingTexts.push({ x: b.x + 16, y: b.y - 10, text: "+100 MÜNZE", color: '#ffaa1d', alpha: 1 });
        } else if (b.content === 'star') {
          dennis.starTimer = 400;
          playSound('powerup');
          triggerParticleEffect('gold');
          mFloatingTexts.push({ x: b.x + 16, y: b.y - 10, text: "⭐ MUT-STERN POWER!", color: '#f59c00', alpha: 1 });
        } else if (b.content === 'bisecur') {
          mScore += 350;
          playSound('powerup');
          mFloatingTexts.push({ x: b.x + 16, y: b.y - 10, text: "🚪 BISECUR SCHLÜSSEL! +350", color: '#38bdf8', alpha: 1 });
        }
        updateMarioHUD();
      } else if (b.type === 'brick') {
        playSound('bump');
        mScore += 10;
        updateMarioHUD();
      }
    }

    function dennisHurt(fellInPit) {
      if (dennis.dead || dennis.won) return;
      // Treffer durch Gegner ignorieren bei Unverwundbarkeit; ein Sturz in die Grube zaehlt immer
      if (!fellInPit && (dennis.invincibleTimer > 0 || dennis.starTimer > 0)) return;

      mLives--;
      updateMarioHUD();
      playSound('hit');

      if (mLives <= 0) {
        dennis.dead = true;
        HoermannGameSession.delay(() => {
          promptScoreSubmit(mScore, 'mario_v02', 'Super Dennis 0.2');
        }, 800);
      } else if (fellInPit) {
        // Respawn auf dem zuletzt sicheren Boden (nie wieder in der Grube)
        dennis.x = mLastSafe.x;
        dennis.y = mLastSafe.y;
        dennis.vx = 0;
        dennis.vy = 0;
        dennis.invincibleTimer = 100;
        cameraX = Math.max(0, Math.min(2850 - mCanvas.width, dennis.x - mCanvas.width * 0.38));
      } else {
        dennis.vy = -7;
        dennis.invincibleTimer = 90;
      }
    }

    function dennisWinLevel() {
      dennis.won = true;
      dennis.vx = 0;
      mScore += 1500;
      updateMarioHUD();
      playSound('victory');
      triggerParticleEffect('confetti');

      HoermannGameSession.delay(() => {
        promptScoreSubmit(mScore, 'mario_v02', 'Super Dennis 0.2');
      }, 1200);
    }

    function drawMarioScene() {
      const skyGrad = mCtx.createLinearGradient(0, 0, 0, mCanvas.height);
      skyGrad.addColorStop(0, '#001a35');
      skyGrad.addColorStop(1, '#002f6c');
      mCtx.fillStyle = skyGrad;
      mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);

      mCtx.save();
      mCtx.translate(-Math.round(cameraX), 0);

      // Parallax warehouse silhouette
      mCtx.fillStyle = 'rgba(0, 20, 50, 0.4)';
      for (let i = 0; i < 9; i++) {
        mCtx.fillRect(i * 380, 160, 260, 160);
        mCtx.beginPath();
        mCtx.moveTo(i * 380, 160);
        mCtx.lineTo(i * 380 + 130, 110);
        mCtx.lineTo(i * 380 + 260, 160);
        mCtx.fill();
      }

      // Draw Platforms, Pipes & Steps
      mPlatforms.forEach(p => {
        if (p.type === 'ground' || p.type === 'step') {
          mCtx.fillStyle = '#1e293b';
          mCtx.fillRect(p.x, p.y, p.w, p.h);

          // Hazard stripe border
          mCtx.fillStyle = '#f59c00';
          mCtx.fillRect(p.x, p.y, p.w, 7);
          mCtx.fillStyle = '#111827';
          for (let s = p.x; s < p.x + p.w; s += 24) {
            mCtx.fillRect(s, p.y, 10, 7);
          }
        } else if (p.type === 'steel') {
          mCtx.fillStyle = '#002d62';
          mCtx.fillRect(p.x, p.y, p.w, p.h);
          mCtx.strokeStyle = '#f59c00';
          mCtx.lineWidth = 2;
          mCtx.strokeRect(p.x, p.y, p.w, p.h);

          mCtx.fillStyle = '#ffffff';
          for (let r = p.x + 8; r < p.x + p.w; r += 25) {
            mCtx.beginPath();
            mCtx.arc(r, p.y + p.h / 2, 2.5, 0, Math.PI * 2);
            mCtx.fill();
          }
        } else if (p.type === 'pipe') {
          // Hörmann Tor-Säule (Industrial Blue / Gray Pipe)
          mCtx.fillStyle = '#1e3a8a';
          mCtx.fillRect(p.x, p.y, p.w, p.h);

          // Top Rim
          mCtx.fillStyle = '#2563eb';
          mCtx.fillRect(p.x - 4, p.y, p.w + 8, 12);
          mCtx.fillStyle = '#f59c00';
          mCtx.fillRect(p.x - 4, p.y, p.w + 8, 3);

          mCtx.fillStyle = '#ffffff';
          mCtx.font = 'bold 8px Inter, sans-serif';
          mCtx.textAlign = 'center';
          mCtx.fillText("HÖRMANN", p.x + p.w / 2, p.y + 9);
        }
      });

      // Draw Blocks
      mBlocks.forEach(b => {
        const drawY = b.y - b.bumpY;
        if (b.type === 'question') {
          mCtx.fillStyle = b.hit ? '#475569' : '#f59c00';
          mCtx.fillRect(b.x, drawY, b.w, b.h);
          mCtx.strokeStyle = '#ffffff';
          mCtx.lineWidth = 2;
          mCtx.strokeRect(b.x, drawY, b.w, b.h);

          mCtx.fillStyle = '#ffffff';
          mCtx.font = 'bold 18px Inter, sans-serif';
          mCtx.textAlign = 'center';
          mCtx.textBaseline = 'middle';
          mCtx.fillText(b.hit ? '⬛' : '?', b.x + b.w / 2, drawY + b.h / 2);
        } else if (b.type === 'brick') {
          mCtx.fillStyle = '#991b1b';
          mCtx.fillRect(b.x, drawY, b.w, b.h);
          mCtx.strokeStyle = '#fca5a5';
          mCtx.lineWidth = 1.5;
          mCtx.strokeRect(b.x, drawY, b.w, b.h);
        }
      });

      // Draw Coins & MUT Letters
      mCoinsList.forEach(c => {
        if (c.collected) return;
        if (c.letter) {
          mCtx.fillStyle = '#f59c00';
          mCtx.beginPath();
          mCtx.arc(c.x, c.y, 16, 0, Math.PI * 2);
          mCtx.fill();
          mCtx.strokeStyle = '#ffffff';
          mCtx.lineWidth = 2.5;
          mCtx.stroke();

          mCtx.fillStyle = '#002d62';
          mCtx.font = '900 16px Inter, sans-serif';
          mCtx.textAlign = 'center';
          mCtx.textBaseline = 'middle';
          mCtx.fillText(c.letter, c.x, c.y);
        } else {
          mCtx.fillStyle = '#f59c00';
          mCtx.beginPath();
          mCtx.arc(c.x, c.y, 9, 0, Math.PI * 2);
          mCtx.fill();
          mCtx.fillStyle = '#ffffff';
          mCtx.font = 'bold 10px sans-serif';
          mCtx.textAlign = 'center';
          mCtx.textBaseline = 'middle';
          mCtx.fillText("H", c.x, c.y);
        }
      });

      // Draw Zweifel Enemies
      mEnemies.forEach(e => {
        if (!e.alive) return;
        mCtx.fillStyle = '#dc2626';
        mCtx.beginPath();
        mCtx.roundRect(e.x, e.y, e.w, e.h, 6);
        mCtx.fill();
        mCtx.strokeStyle = '#f87171';
        mCtx.lineWidth = 2;
        mCtx.stroke();

        mCtx.fillStyle = '#ffffff';
        mCtx.fillRect(e.x + 5, e.y + 7, 6, 6);
        mCtx.fillRect(e.x + 18, e.y + 7, 6, 6);
        mCtx.fillStyle = '#000000';
        mCtx.fillRect(e.x + 7, e.y + 9, 3, 3);
        mCtx.fillRect(e.x + 20, e.y + 9, 3, 3);

        // Wuetende Augenbrauen + gut lesbares Namensschild ueber dem Kopf
        mCtx.strokeStyle = '#450a0a';
        mCtx.lineWidth = 2;
        mCtx.beginPath();
        mCtx.moveTo(e.x + 4, e.y + 4); mCtx.lineTo(e.x + 12, e.y + 8);
        mCtx.moveTo(e.x + 26, e.y + 4); mCtx.lineTo(e.x + 18, e.y + 8);
        mCtx.stroke();
        mCtx.font = '800 11px Inter, sans-serif';
        mCtx.textAlign = 'center';
        mCtx.textBaseline = 'alphabetic';
        mCtx.lineWidth = 3;
        mCtx.strokeStyle = 'rgba(0,10,30,0.9)';
        mCtx.strokeText(e.name, e.x + e.w / 2, e.y - 5);
        mCtx.fillStyle = '#ffffff';
        mCtx.fillText(e.name, e.x + e.w / 2, e.y - 5);
      });

      // Draw Level Goal: Grand Hörmann Werkstor & Flagpole
      mCtx.fillStyle = '#64748b';
      mCtx.fillRect(levelGoal.x + 15, levelGoal.y, 8, levelGoal.h);
      mCtx.fillStyle = '#f59c00';
      mCtx.beginPath();
      mCtx.arc(levelGoal.x + 19, levelGoal.y, 10, 0, Math.PI * 2);
      mCtx.fill();

      mCtx.fillStyle = '#002d62';
      mCtx.fillRect(levelGoal.x + 23, levelGoal.y + 12, 65, 34);
      mCtx.fillStyle = '#f59c00';
      mCtx.font = '900 11px Inter, sans-serif';
      mCtx.textAlign = 'center';
      mCtx.fillText("HÖRMANN", levelGoal.x + 55, levelGoal.y + 28);
      mCtx.fillText("WERKSTOR", levelGoal.x + 55, levelGoal.y + 40);

      // DRAW PLAYER: DENNIS RESSEMANN!
      if (!dennis.dead || (dennis.dead && Math.floor(Date.now() / 100) % 2 === 0)) {
        mCtx.save();
        mCtx.translate(dennis.x + dennis.w / 2, dennis.y + dennis.h / 2);

        if (dennis.starTimer > 0) {
          const rainbow = ['#f59c00', '#10b981', '#3b82f6', '#ec4899'][Math.floor(Date.now() / 80) % 4];
          mCtx.shadowColor = rainbow;
          mCtx.shadowBlur = 18;
        }

        if (dennis.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
          mCtx.globalAlpha = 0.45;
        }

        mCtx.scale(dennis.facing, 1);

        if (dennisImgLoaded) {
          const sw = dennisImg.width / 3;
          const sh = dennisImg.height / 2;
          mCtx.drawImage(
            dennisImg,
            0, 0, sw, sh,
            -dennis.w / 2 - 6, -dennis.h / 2 - 6, dennis.w + 12, dennis.h + 12
          );
        } else {
          // Fallback
          mCtx.fillStyle = '#15803d';
          mCtx.fillRect(-dennis.w / 2 + 2, -dennis.h / 2 + 18, dennis.w - 4, dennis.h - 18);
          mCtx.fillStyle = '#fed7aa';
          mCtx.fillRect(-dennis.w / 2 + 4, -dennis.h / 2 + 2, dennis.w - 8, 16);
          mCtx.fillStyle = '#78350f';
          mCtx.fillRect(-dennis.w / 2 + 3, -dennis.h / 2, dennis.w - 6, 6);
          mCtx.fillStyle = '#0f172a';
          mCtx.fillRect(-dennis.w / 2 + 8, -dennis.h / 2 + 7, 6, 4);
          mCtx.fillRect(-dennis.w / 2 + 18, -dennis.h / 2 + 7, 6, 4);
          mCtx.fillStyle = '#b91c1c';
          mCtx.fillRect(-dennis.w / 2 + 11, -dennis.h / 2 + 13, 8, 2);
        }

        mCtx.restore();
      }

      // Floating points texts
      for (let i = mFloatingTexts.length - 1; i >= 0; i--) {
        const ft = mFloatingTexts[i];
        ft.y -= 1.2;
        ft.alpha -= 0.025;

        mCtx.save();
        mCtx.fillStyle = ft.color;
        mCtx.globalAlpha = Math.max(0, ft.alpha);
        mCtx.font = '800 13px Inter, sans-serif';
        mCtx.textAlign = 'center';
        mCtx.fillText(ft.text, ft.x, ft.y);
        mCtx.restore();

        if (ft.alpha <= 0) mFloatingTexts.splice(i, 1);
      }

      mCtx.restore();

      // Stern-Power Anzeige (Restdauer)
      if (dennis.starTimer > 0 && !dennis.dead && !dennis.won) {
        mCtx.fillStyle = 'rgba(0, 20, 50, 0.75)';
        mCtx.fillRect(10, 10, 150, 22);
        mCtx.fillStyle = '#f59c00';
        mCtx.fillRect(14, 24, 142 * (dennis.starTimer / 400), 5);
        mCtx.fillStyle = '#ffffff';
        mCtx.font = '800 12px Inter, sans-serif';
        mCtx.textAlign = 'left';
        mCtx.textBaseline = 'alphabetic';
        mCtx.fillText('⭐ MUT-STERN', 16, 21);
      }

      // Game state overlays
      if (dennis.won) {
        mCtx.fillStyle = 'rgba(0, 31, 59, 0.88)';
        mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);

        mCtx.fillStyle = '#f59c00';
        mCtx.font = '900 28px Inter, sans-serif';
        mCtx.textAlign = 'center';
        mCtx.fillText("🎉 WERKSTOR ERREICHT!", mCanvas.width / 2, 130);

        mCtx.fillStyle = '#ffffff';
        mCtx.font = '700 18px Inter, sans-serif';
        mCtx.fillText("Dennis hat den Feierabend & vollen Mut verdient!", mCanvas.width / 2, 170);
        mCtx.fillText(`Erreichte Punkte: ${mScore}`, mCanvas.width / 2, 205);
      } else if (dennis.dead) {
        mCtx.fillStyle = 'rgba(0, 20, 40, 0.9)';
        mCtx.fillRect(0, 0, mCanvas.width, mCanvas.height);

        mCtx.fillStyle = '#ef4444';
        mCtx.font = '900 28px Inter, sans-serif';
        mCtx.textAlign = 'center';
        mCtx.fillText("DENNIS BRAUCHT EINE PAUSE!", mCanvas.width / 2, 140);

        mCtx.fillStyle = '#ffffff';
        mCtx.font = '700 18px Inter, sans-serif';
        mCtx.fillText(`Endstand: ${mScore} Mut-Punkte`, mCanvas.width / 2, 185);
      }
    }

