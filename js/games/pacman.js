    /* ==========================================================
       8e. GAME PAC-MAN: HÖRMANN MUT-MAN (ARCADE-KLASSIKER IM MUT-GEWAND)
       ========================================================== */
    const pacmanCanvas = document.getElementById('pacmanCanvas');
    const pacCtx = pacmanCanvas ? pacmanCanvas.getContext('2d') : null;
    const pacmanLivesStat = document.getElementById('pacman-lives-stat');
    const pacmanLevelStat = document.getElementById('pacman-level-stat');
    const pacmanPelletsStat = document.getElementById('pacman-pellets-stat');
    const pacmanScoreStat = document.getElementById('pacman-score-stat');
    const pacmanCashoutBtn = document.getElementById('pacman-cashout-btn');
    const restartPacmanBtn = document.getElementById('restart-pacman-btn');

    const pacBtnLeft = document.getElementById('pac-btn-left');
    const pacBtnUp = document.getElementById('pac-btn-up');
    const pacBtnDown = document.getElementById('pac-btn-down');
    const pacBtnRight = document.getElementById('pac-btn-right');

    const PAC_TILE = 24;
    const PAC_COLS = 28;
    const PAC_ROWS = 30;

    // 0: Weg ohne Pellet / Tunnel, 1: Mut-Pellet, 2: Hörmann-Stahlwand, 3: Power-Pellet (Goldenes Sektionaltor), 4: Geisterhaus-Schranke
    const PAC_MAZE_TEMPLATE = [
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,1,2,2,2,2,1,2,2,2,2,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,1,2],
      [2,3,2,2,2,2,1,2,2,2,2,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,3,2],
      [2,1,2,2,2,2,1,2,2,2,2,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,1,2],
      [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,1,2,2,2,2,1,2,2,1,2,2,2,2,2,2,2,2,1,2,2,1,2,2,2,2,1,2],
      [2,1,2,2,2,2,1,2,2,1,2,2,2,2,2,2,2,2,1,2,2,1,2,2,2,2,1,2],
      [2,1,1,1,1,1,1,2,2,1,1,1,1,2,2,1,1,1,1,2,2,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,1,2,2,2,2,2,0,2,2,0,2,2,2,2,2,1,2,2,2,2,2,2],
      [0,0,0,0,0,2,1,2,2,2,2,2,0,2,2,0,2,2,2,2,2,1,2,0,0,0,0,0],
      [0,0,0,0,0,2,1,2,2,0,0,0,0,0,0,0,0,0,0,2,2,1,2,0,0,0,0,0],
      [0,0,0,0,0,2,1,2,2,0,2,2,2,4,4,2,2,2,0,2,2,1,2,0,0,0,0,0],
      [2,2,2,2,2,2,1,2,2,0,2,0,0,0,0,0,0,2,0,2,2,1,2,2,2,2,2,2],
      [0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0],
      [2,2,2,2,2,2,1,2,2,0,2,0,0,0,0,0,0,2,0,2,2,1,2,2,2,2,2,2],
      [0,0,0,0,0,2,1,2,2,0,2,2,2,2,2,2,2,2,0,2,2,1,2,0,0,0,0,0],
      [0,0,0,0,0,2,1,2,2,0,0,0,0,0,0,0,0,0,0,2,2,1,2,0,0,0,0,0],
      [0,0,0,0,0,2,1,2,2,0,2,2,2,2,2,2,2,2,0,2,2,1,2,0,0,0,0,0],
      [2,2,2,2,2,2,1,2,2,0,2,2,2,2,2,2,2,2,0,2,2,1,2,2,2,2,2,2],
      [2,1,1,1,1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,1,2,2,2,2,1,2,2,2,2,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,1,2],
      [2,1,2,2,2,2,1,2,2,2,2,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,1,2],
      [2,3,1,1,2,2,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,2,2,1,1,3,2],
      [2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2],
      [2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2],
      [2,1,1,1,1,1,1,2,2,1,1,1,1,2,2,1,1,1,1,2,2,1,1,1,1,1,1,2],
      [2,1,2,2,2,2,2,2,2,2,2,2,1,2,2,1,2,2,2,2,2,2,2,2,2,2,1,2],
      [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
      [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
    ];

    let pacState = {
      active: false,
      level: 1,
      score: 0,
      lives: 3,
      pelletsLeft: 0,
      totalPellets: 0,
      grid: [],
      fruit: null,
      fruitTimer: 0,
      frightTimer: 0,
      ghostsEatenInFright: 0,
      bannerText: '',
      bannerTimer: 0,
      mouthAngle: 0.25,
      mouthDir: 1,
      player: {
        x: 13.5 * PAC_TILE,
        y: 23.5 * PAC_TILE,
        dirX: -1,
        dirY: 0,
        nextDirX: -1,
        nextDirY: 0,
        speed: 2.4
      },
      ghosts: []
    };

    let pacLoopId = null;

    function initPacmanLevel(lvl = 1, resetLives = true) {
      if (resetLives) {
        pacState.lives = 3;
        pacState.score = 0;
      }
      pacState.level = lvl;
      pacState.grid = PAC_MAZE_TEMPLATE.map(row => [...row]);
      pacState.pelletsLeft = 0;
      pacState.fruit = null;
      pacState.fruitTimer = 0;
      pacState.frightTimer = 0;
      pacState.ghostsEatenInFright = 0;

      for (let r = 0; r < PAC_ROWS; r++) {
        for (let c = 0; c < PAC_COLS; c++) {
          if (pacState.grid[r][c] === 1 || pacState.grid[r][c] === 3) {
            pacState.pelletsLeft++;
          }
        }
      }
      pacState.totalPellets = pacState.pelletsLeft;

      resetPacmanActors();
      pacState.bannerText = `LEVEL ${lvl} — BEREIT? MUTIG VORAN!`;
      pacState.bannerTimer = 90;
      updatePacmanUI();
    }

    function resetPacmanActors() {
      pacState.player.x = 13.5 * PAC_TILE;
      pacState.player.y = 23.5 * PAC_TILE;
      pacState.player.dirX = -1;
      pacState.player.dirY = 0;
      pacState.player.nextDirX = -1;
      pacState.player.nextDirY = 0;
      pacState.player.speed = 2.4;

      const baseGhostSpeed = 2.0 + Math.min(0.6, (pacState.level - 1) * 0.15);

      pacState.ghosts = [
        {
          id: 'blinky',
          name: 'Zweifel-Blinky',
          color: '#ef4444',
          x: 13.5 * PAC_TILE,
          y: 11.5 * PAC_TILE,
          dirX: -1,
          dirY: 0,
          speed: baseGhostSpeed,
          state: 'chase',
          houseTimer: 0,
          homeX: 13.5 * PAC_TILE,
          homeY: 14.5 * PAC_TILE,
          targetCorner: { x: (PAC_COLS - 2) * PAC_TILE, y: 1.5 * PAC_TILE }
        },
        {
          id: 'pinky',
          name: 'Zauder-Pinky',
          color: '#f472b6',
          x: 13.5 * PAC_TILE,
          y: 14.5 * PAC_TILE,
          dirX: 0,
          dirY: -1,
          speed: baseGhostSpeed * 0.95,
          state: 'leaveHouse',
          houseTimer: 45,
          homeX: 13.5 * PAC_TILE,
          homeY: 14.5 * PAC_TILE,
          targetCorner: { x: 1.5 * PAC_TILE, y: 1.5 * PAC_TILE }
        },
        {
          id: 'inky',
          name: 'Aufschieber-Inky',
          color: '#06b6d4',
          x: 12.0 * PAC_TILE,
          y: 14.5 * PAC_TILE,
          dirX: 0,
          dirY: -1,
          speed: baseGhostSpeed * 0.9,
          state: 'leaveHouse',
          houseTimer: 140,
          homeX: 13.5 * PAC_TILE,
          homeY: 14.5 * PAC_TILE,
          targetCorner: { x: (PAC_COLS - 2) * PAC_TILE, y: (PAC_ROWS - 2) * PAC_TILE }
        },
        {
          id: 'clyde',
          name: 'Angst-Clyde',
          color: '#f97316',
          x: 15.0 * PAC_TILE,
          y: 14.5 * PAC_TILE,
          dirX: 0,
          dirY: -1,
          speed: baseGhostSpeed * 0.85,
          state: 'leaveHouse',
          houseTimer: 240,
          homeX: 13.5 * PAC_TILE,
          homeY: 14.5 * PAC_TILE,
          targetCorner: { x: 1.5 * PAC_TILE, y: (PAC_ROWS - 2) * PAC_TILE }
        }
      ];
    }

    function updatePacmanUI() {
      if (pacmanScoreStat) pacmanScoreStat.textContent = pacState.score;
      if (pacmanLevelStat) pacmanLevelStat.textContent = pacState.level;
      if (pacmanPelletsStat) pacmanPelletsStat.textContent = `${pacState.totalPellets - pacState.pelletsLeft} / ${pacState.totalPellets}`;
      if (pacmanLivesStat) {
        let h = '';
        for (let i = 0; i < pacState.lives; i++) h += '🟡';
        pacmanLivesStat.textContent = h || '☠️';
      }
    }

    function isTileBlockedForActor(tx, ty, isGhost = false, ghostState = '') {
      if (ty < 0 || ty >= PAC_ROWS) return false;
      if (tx < 0 || tx >= PAC_COLS) return false;
      const val = pacState.grid[ty][tx];
      if (val === 2) return true;
      if (val === 4) {
        if (isGhost && (ghostState === 'leaveHouse' || ghostState === 'eyes')) return false;
        return true;
      }
      return false;
    }

    function canMoveInDir(pixelX, pixelY, dirX, dirY, isGhost = false, ghostState = '') {
      if (dirX === 0 && dirY === 0) return true;
      const testDist = 2.5;
      const nextX = pixelX + dirX * testDist;
      const nextY = pixelY + dirY * testDist;

      if (nextX < 0 || nextX > (PAC_COLS - 1) * PAC_TILE) return true;

      const pad = 5;
      const left   = nextX - PAC_TILE / 2 + pad;
      const right  = nextX + PAC_TILE / 2 - pad;
      const top    = nextY - PAC_TILE / 2 + pad;
      const bottom = nextY + PAC_TILE / 2 - pad;

      const tLeft   = Math.floor(left / PAC_TILE);
      const tRight  = Math.floor(right / PAC_TILE);
      const tTop    = Math.floor(top / PAC_TILE);
      const tBottom = Math.floor(bottom / PAC_TILE);

      for (let r = tTop; r <= tBottom; r++) {
        for (let c = tLeft; c <= tRight; c++) {
          if (isTileBlockedForActor(c, r, isGhost, ghostState)) return false;
        }
      }
      return true;
    }

    function updatePacmanPhysics() {
      if (!pacState.active) return;

      if (pacState.bannerTimer > 0) {
        pacState.bannerTimer--;
        return;
      }

      // Mund-Animation
      pacState.mouthAngle += 0.04 * pacState.mouthDir;
      if (pacState.mouthAngle > 0.38) { pacState.mouthAngle = 0.38; pacState.mouthDir = -1; }
      else if (pacState.mouthAngle < 0.04) { pacState.mouthAngle = 0.04; pacState.mouthDir = 1; }

      // 1. Mut-Man Bewegung & Richtungswechsel nach echter Arcade-Tile-Logik
      const p = pacState.player;

      // 180-Grad-Wende immer sofort und überall erlauben:
      if (p.nextDirX === -p.dirX && p.nextDirY === -p.dirY && (p.nextDirX !== 0 || p.nextDirY !== 0)) {
        p.dirX = p.nextDirX;
        p.dirY = p.nextDirY;
        p.nextDirX = 0;
        p.nextDirY = 0;
      }

      const curTileX = Math.floor(p.x / PAC_TILE);
      const curTileY = Math.floor(p.y / PAC_TILE);
      const centerTileX = (curTileX + 0.5) * PAC_TILE;
      const centerTileY = (curTileY + 0.5) * PAC_TILE;

      // Abbiegen (Cornering) an Kachelkreuzungen
      if (p.nextDirX !== 0 || p.nextDirY !== 0) {
        const distToCenter = Math.hypot(p.x - centerTileX, p.y - centerTileY);
        if (distToCenter <= p.speed * 2.2) {
          const targetTileX = curTileX + p.nextDirX;
          const targetTileY = curTileY + p.nextDirY;
          if (!isTileBlockedForActor(targetTileX, targetTileY, false)) {
            p.x = centerTileX;
            p.y = centerTileY;
            p.dirX = p.nextDirX;
            p.dirY = p.nextDirY;
            p.nextDirX = 0;
            p.nextDirY = 0;
          }
        }
      }

      // Vorwärtsbewegung mit Stop am Kachelzentrum vor einer Wand
      if (p.dirX !== 0 || p.dirY !== 0) {
        const aheadTileX = curTileX + p.dirX;
        const aheadTileY = curTileY + p.dirY;

        let pastCenter = false;
        if (p.dirX > 0 && p.x >= centerTileX) pastCenter = true;
        else if (p.dirX < 0 && p.x <= centerTileX) pastCenter = true;
        else if (p.dirY > 0 && p.y >= centerTileY) pastCenter = true;
        else if (p.dirY < 0 && p.y <= centerTileY) pastCenter = true;

        if (pastCenter && isTileBlockedForActor(aheadTileX, aheadTileY, false)) {
          p.x = centerTileX;
          p.y = centerTileY;
          p.dirX = 0;
          p.dirY = 0;
        } else {
          p.x += p.dirX * p.speed;
          p.y += p.dirY * p.speed;
        }

        // Tunnel-Wrapping (links <-> rechts)
        if (p.x < -PAC_TILE / 2) p.x = (PAC_COLS - 0.5) * PAC_TILE;
        else if (p.x > (PAC_COLS - 0.5) * PAC_TILE) p.x = -PAC_TILE / 2;
      }

      // 2. Pellets & Power-Pellets aufsammeln
      const pelletTX = Math.floor(p.x / PAC_TILE);
      const pelletTY = Math.floor(p.y / PAC_TILE);
      if (pelletTY >= 0 && pelletTY < PAC_ROWS && pelletTX >= 0 && pelletTX < PAC_COLS) {
        const cell = pacState.grid[pelletTY][pelletTX];
        if (cell === 1) {
          pacState.grid[pelletTY][pelletTX] = 0;
          pacState.score += 10;
          pacState.pelletsLeft--;
          playSound('pacWaka');
          updatePacmanUI();
        } else if (cell === 3) {
          // Großes Goldenes Hörmann-Tor (Power-Pellet)
          pacState.grid[pelletTY][pelletTX] = 0;
          pacState.score += 50;
          pacState.pelletsLeft--;
          pacState.frightTimer = 340;
          pacState.ghostsEatenInFright = 0;
          playSound('pacPower');
          showToast('🚪 POWER-TOR GEÖFFNET! Geister sind blau – verputze die Zweifel! 🔥');
          pacState.ghosts.forEach(g => {
            if (g.state !== 'eyes' && g.state !== 'leaveHouse') g.state = 'fright';
          });
          triggerParticleEffect('gold');
          updatePacmanUI();
        }
      }

      // 3. Mut-Bonus (BiSecur Fernbedienung)
      pacState.fruitTimer++;
      if (pacState.fruitTimer === 420 && !pacState.fruit) {
        pacState.fruit = { x: 13.5 * PAC_TILE, y: 17.5 * PAC_TILE, type: 'bisecur', points: 300, life: 360 };
      }
      if (pacState.fruit) {
        pacState.fruit.life--;
        const distFruit = Math.hypot(p.x - pacState.fruit.x, p.y - pacState.fruit.y);
        if (distFruit < PAC_TILE * 0.8) {
          pacState.score += pacState.fruit.points;
          showToast('📻 BiSecur-Handsender eingesackt! +300 MUT-PUNKTE! 🚀');
          playSound('bonus');
          triggerParticleEffect('confetti');
          pacState.fruit = null;
          updatePacmanUI();
        } else if (pacState.fruit.life <= 0) {
          pacState.fruit = null;
        }
      }

      // 4. Fright-Timer ablaufen lassen
      if (pacState.frightTimer > 0) {
        pacState.frightTimer--;
        if (pacState.frightTimer === 0) {
          pacState.ghosts.forEach(g => {
            if (g.state === 'fright') g.state = 'chase';
          });
        }
      }

      // 5. Zweifel-Geister KI & Kollision
      pacState.ghosts.forEach(g => {
        updateGhostAI(g);

        const dist = Math.hypot(p.x - g.x, p.y - g.y);
        if (dist < PAC_TILE * 0.72) {
          if (g.state === 'fright') {
            pacState.ghostsEatenInFright++;
            const pts = 200 * Math.pow(2, pacState.ghostsEatenInFright - 1);
            pacState.score += pts;
            g.state = 'eyes';
            playSound('pacGhost');
            showToast(`👻 ${g.name} verputzt! +${pts} Mut-Punkte! 💥`);
            triggerParticleEffect('spark');
            updatePacmanUI();
          } else if (g.state !== 'eyes' && g.state !== 'leaveHouse') {
            pacState.lives--;
            playSound('pacDie');
            updatePacmanUI();
            if (pacState.lives <= 0) {
              handlePacmanGameOver();
            } else {
              pacState.bannerText = `AUTSCH! NOCH ${pacState.lives} MUT-LEBEN!`;
              pacState.bannerTimer = 80;
              resetPacmanActors();
            }
          }
        }
      });

      // 6. Level geschafft?
      if (pacState.pelletsLeft <= 0) {
        handlePacmanLevelComplete();
      }
    }

    function updateGhostAI(g) {
      if (g.houseTimer > 0) {
        g.houseTimer--;
        return;
      }

      if (g.state === 'leaveHouse') {
        const exitX = 13.5 * PAC_TILE;
        const exitY = 11.5 * PAC_TILE;
        const dx = exitX - g.x;
        const dy = exitY - g.y;
        if (Math.abs(dx) > 1.5) {
          g.x += Math.sign(dx) * 1.5;
        } else if (Math.abs(dy) > 1.5) {
          g.y += Math.sign(dy) * 1.5;
        } else {
          g.x = exitX;
          g.y = exitY;
          g.state = 'chase';
          g.dirX = -1;
          g.dirY = 0;
        }
        return;
      }

      if (g.state === 'eyes') {
        const dx = g.homeX - g.x;
        const dy = g.homeY - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          g.x = g.homeX;
          g.y = g.homeY;
          g.state = 'leaveHouse';
          g.houseTimer = 30;
        } else {
          g.x += (dx / dist) * (g.speed * 1.6);
          g.y += (dy / dist) * (g.speed * 1.6);
        }
        return;
      }

      const curTileX = Math.floor(g.x / PAC_TILE);
      const curTileY = Math.floor(g.y / PAC_TILE);
      const centerTileX = (curTileX + 0.5) * PAC_TILE;
      const centerTileY = (curTileY + 0.5) * PAC_TILE;

      const pastCenterX = (g.dirX > 0 && g.x >= centerTileX) || (g.dirX < 0 && g.x <= centerTileX);
      const pastCenterY = (g.dirY > 0 && g.y >= centerTileY) || (g.dirY < 0 && g.y <= centerTileY);

      if ((pastCenterX || pastCenterY || (g.dirX === 0 && g.dirY === 0)) && (!g.lastTurnTile || g.lastTurnTile.x !== curTileX || g.lastTurnTile.y !== curTileY)) {
        g.lastTurnTile = { x: curTileX, y: curTileY };
        g.x = centerTileX;
        g.y = centerTileY;

        let targetX = pacState.player.x;
        let targetY = pacState.player.y;

        if (g.state === 'scatter') {
          targetX = g.targetCorner.x;
          targetY = g.targetCorner.y;
        } else if (g.state === 'fright') {
          targetX = (PAC_COLS * PAC_TILE) - pacState.player.x;
          targetY = (PAC_ROWS * PAC_TILE) - pacState.player.y;
        } else {
          if (g.id === 'blinky') {
            targetX = pacState.player.x;
            targetY = pacState.player.y;
          } else if (g.id === 'pinky') {
            targetX = pacState.player.x + pacState.player.dirX * (PAC_TILE * 4);
            targetY = pacState.player.y + pacState.player.dirY * (PAC_TILE * 4);
          } else if (g.id === 'inky') {
            targetX = pacState.player.x * 2 - g.homeX;
            targetY = pacState.player.y * 2 - g.homeY;
          } else if (g.id === 'clyde') {
            const distToPlayer = Math.hypot(g.x - pacState.player.x, g.y - pacState.player.y);
            if (distToPlayer < PAC_TILE * 6) {
              targetX = g.targetCorner.x;
              targetY = g.targetCorner.y;
            }
          }
        }

        const directions = [
          { dx: 0, dy: -1 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 1, dy: 0 }
        ];

        const valid = directions.filter(d => {
          if (d.dx === -g.dirX && d.dy === -g.dirY) return false;
          return !isTileBlockedForActor(curTileX + d.dx, curTileY + d.dy, true, g.state);
        });

        if (valid.length > 0) {
          valid.sort((a, b) => {
            const distA = Math.hypot((curTileX + a.dx) * PAC_TILE - targetX, (curTileY + a.dy) * PAC_TILE - targetY);
            const distB = Math.hypot((curTileX + b.dx) * PAC_TILE - targetX, (curTileY + b.dy) * PAC_TILE - targetY);
            return distA - distB;
          });
          g.dirX = valid[0].dx;
          g.dirY = valid[0].dy;
        } else if (!isTileBlockedForActor(curTileX - g.dirX, curTileY - g.dirY, true, g.state)) {
          g.dirX = -g.dirX;
          g.dirY = -g.dirY;
        }
      }

      const curSpeed = (g.state === 'fright') ? (g.speed * 0.6) : g.speed;
      g.x += g.dirX * curSpeed;
      g.y += g.dirY * curSpeed;

      if (g.x < -PAC_TILE / 2) g.x = (PAC_COLS - 0.5) * PAC_TILE;
      else if (g.x > (PAC_COLS - 0.5) * PAC_TILE) g.x = -PAC_TILE / 2;
    }

    function handlePacmanLevelComplete() {
      pacState.score += 1000 * pacState.level;
      playSound('victory');
      triggerParticleEffect('confetti');
      showToast(`🏆 LEVEL ${pacState.level} GEMEISTERT! +${1000 * pacState.level} Bonus-Punkte! 🎉`);
      initPacmanLevel(pacState.level + 1, false);
    }

    function handlePacmanGameOver() {
      pacState.active = false;
      showToast(`💥 Alle Mut-Leben aufgebraucht! Endstand: ${pacState.score} Punkte 🏆`);
      HoermannGameSession.delay(() => {
        promptScoreSubmit(pacState.score, 'pacman', 'Hörmann Mut-Man');
      }, 700);
    }

    function drawPacmanScene() {
      if (!pacCtx) return;
      pacCtx.clearRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);

      // 1. Hintergrund & Labyrinth zeichnen
      pacCtx.fillStyle = '#030712';
      pacCtx.fillRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);

      for (let r = 0; r < PAC_ROWS; r++) {
        for (let c = 0; c < PAC_COLS; c++) {
          const tile = pacState.grid[r][c];
          const px = c * PAC_TILE;
          const py = r * PAC_TILE;

          if (tile === 2) {
            // Verzinkte Stahlwand im Hörmann-Blau
            pacCtx.fillStyle = '#002d62';
            pacCtx.fillRect(px, py, PAC_TILE, PAC_TILE);
            pacCtx.strokeStyle = '#38bdf8';
            pacCtx.lineWidth = 1.8;
            pacCtx.strokeRect(px + 1, py + 1, PAC_TILE - 2, PAC_TILE - 2);

            // Subtile Lamellen-Struktur wie Sektionaltor-Paneele
            pacCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            pacCtx.lineWidth = 1;
            pacCtx.beginPath();
            pacCtx.moveTo(px, py + PAC_TILE / 2);
            pacCtx.lineTo(px + PAC_TILE, py + PAC_TILE / 2);
            pacCtx.stroke();
          } else if (tile === 4) {
            // Geisterhaus-Schranke (Torantrieb-Riegel)
            pacCtx.fillStyle = '#f59c00';
            pacCtx.fillRect(px, py + PAC_TILE * 0.35, PAC_TILE, PAC_TILE * 0.3);
          } else if (tile === 1) {
            // Normales Mut-Pellet
            pacCtx.fillStyle = '#fde047';
            pacCtx.beginPath();
            pacCtx.arc(px + PAC_TILE / 2, py + PAC_TILE / 2, 3.2, 0, Math.PI * 2);
            pacCtx.fill();
          } else if (tile === 3) {
            // Goldenes Sektionaltor Power-Pellet (Pulsierend)
            const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.25;
            pacCtx.save();
            pacCtx.translate(px + PAC_TILE / 2, py + PAC_TILE / 2);
            pacCtx.scale(pulse, pulse);

            pacCtx.fillStyle = '#f59c00';
            pacCtx.fillRect(-7, -7, 14, 14);
            pacCtx.strokeStyle = '#ffffff';
            pacCtx.lineWidth = 1.5;
            pacCtx.strokeRect(-7, -7, 14, 14);

            pacCtx.fillStyle = '#002d62';
            pacCtx.fillRect(-5, -5, 10, 10);
            pacCtx.fillStyle = '#fde047';
            pacCtx.font = '900 8px Inter, sans-serif';
            pacCtx.textAlign = 'center';
            pacCtx.textBaseline = 'middle';
            pacCtx.fillText('H', 0, 1);
            pacCtx.restore();
          }
        }
      }

      // 2. Bonus-Item (BiSecur Handsender)
      if (pacState.fruit) {
        pacCtx.save();
        pacCtx.translate(pacState.fruit.x, pacState.fruit.y);
        pacCtx.fillStyle = '#1e293b';
        pacCtx.fillRect(-8, -11, 16, 22);
        pacCtx.strokeStyle = '#38bdf8';
        pacCtx.lineWidth = 1.5;
        pacCtx.strokeRect(-8, -11, 16, 22);

        // BiSecur Tasten
        pacCtx.fillStyle = '#38bdf8';
        pacCtx.beginPath();
        pacCtx.arc(0, -4, 3, 0, Math.PI * 2);
        pacCtx.arc(0, 4, 3, 0, Math.PI * 2);
        pacCtx.fill();

        // Pulsierender Glanz
        pacCtx.fillStyle = '#facc15';
        pacCtx.font = '900 8px Inter, sans-serif';
        pacCtx.textAlign = 'center';
        pacCtx.fillText('+300', 0, -14);
        pacCtx.restore();
      }

      // 3. Mut-Man zeichnen
      const p = pacState.player;
      pacCtx.save();
      pacCtx.translate(p.x, p.y);

      let rot = 0;
      if (p.dirX === 1) rot = 0;
      else if (p.dirX === -1) rot = Math.PI;
      else if (p.dirY === 1) rot = Math.PI / 2;
      else if (p.dirY === -1) rot = -Math.PI / 2;

      pacCtx.rotate(rot);

      // Pac-Man Körper
      pacCtx.fillStyle = '#facc15';
      pacCtx.beginPath();
      pacCtx.arc(0, 0, PAC_TILE * 0.44, pacState.mouthAngle * Math.PI, (2 - pacState.mouthAngle) * Math.PI);
      pacCtx.lineTo(0, 0);
      pacCtx.closePath();
      pacCtx.fill();

      // Dennis/Hörmann Monteurs-Helm & Auge
      pacCtx.fillStyle = '#002d62';
      pacCtx.beginPath();
      pacCtx.arc(1, -6, 2.5, 0, Math.PI * 2);
      pacCtx.fill();

      // Hörmann Helm-Schirm
      pacCtx.fillStyle = '#002d62';
      pacCtx.fillRect(-7, -11, 14, 3.5);

      pacCtx.restore();

      // 4. Zweifel-Geister zeichnen
      pacState.ghosts.forEach(g => {
        pacCtx.save();
        pacCtx.translate(g.x, g.y);

        let bodyColor = g.color;
        if (g.state === 'fright') {
          // Blau / Weiß blinkend kurz vor Ablauf
          const isFlashing = pacState.frightTimer < 100 && (Math.floor(Date.now() / 150) % 2 === 0);
          bodyColor = isFlashing ? '#ffffff' : '#2563eb';
        }

        if (g.state !== 'eyes') {
          // Geist-Kuppel
          pacCtx.fillStyle = bodyColor;
          pacCtx.beginPath();
          pacCtx.arc(0, -2, PAC_TILE * 0.42, Math.PI, 0, false);
          pacCtx.lineTo(PAC_TILE * 0.42, PAC_TILE * 0.38);

          // Geister-Wellen am Saum
          const w = (PAC_TILE * 0.84) / 3;
          pacCtx.lineTo(PAC_TILE * 0.42 - w * 0.5, PAC_TILE * 0.22);
          pacCtx.lineTo(PAC_TILE * 0.42 - w, PAC_TILE * 0.38);
          pacCtx.lineTo(PAC_TILE * 0.42 - w * 1.5, PAC_TILE * 0.22);
          pacCtx.lineTo(PAC_TILE * 0.42 - w * 2, PAC_TILE * 0.38);
          pacCtx.lineTo(PAC_TILE * 0.42 - w * 2.5, PAC_TILE * 0.22);
          pacCtx.lineTo(-PAC_TILE * 0.42, PAC_TILE * 0.38);
          pacCtx.closePath();
          pacCtx.fill();
        }

        // Augen (Blickrichtung angepasst)
        pacCtx.fillStyle = '#ffffff';
        pacCtx.beginPath();
        pacCtx.arc(-4, -4, 3.5, 0, Math.PI * 2);
        pacCtx.arc(4, -4, 3.5, 0, Math.PI * 2);
        pacCtx.fill();

        // Pupillen
        const lookX = g.dirX * 1.5;
        const lookY = g.dirY * 1.5;
        pacCtx.fillStyle = (g.state === 'fright') ? '#f59c00' : '#001830';
        pacCtx.beginPath();
        pacCtx.arc(-4 + lookX, -4 + lookY, 1.8, 0, Math.PI * 2);
        pacCtx.arc(4 + lookX, -4 + lookY, 1.8, 0, Math.PI * 2);
        pacCtx.fill();

        pacCtx.restore();
      });

      // 5. Banner-Meldung (Bereit / Levelanzeige)
      if (pacState.bannerTimer > 0 && pacState.bannerText) {
        pacCtx.save();
        pacCtx.fillStyle = 'rgba(0, 45, 98, 0.9)';
        pacCtx.fillRect(PAC_TILE * 3, PAC_TILE * 13.5, PAC_TILE * 22, PAC_TILE * 2.5);
        pacCtx.strokeStyle = '#f59c00';
        pacCtx.lineWidth = 3;
        pacCtx.strokeRect(PAC_TILE * 3, PAC_TILE * 13.5, PAC_TILE * 22, PAC_TILE * 2.5);
        pacCtx.fillStyle = '#fde047';
        pacCtx.font = '900 15px Inter, sans-serif';
        pacCtx.textAlign = 'center';
        pacCtx.textBaseline = 'middle';
        pacCtx.fillText(pacState.bannerText, pacmanCanvas.width / 2, PAC_TILE * 14.75);
        pacCtx.restore();
      }
    }

    function pacmanLoop(frameTime) {
      if (!(pacState.active)) return;
      HoermannGameClock.run("pacmanLoop", frameTime, () => {
      if (!pacState.active) return;
      updatePacmanPhysics();
      drawPacmanScene();

      });
      if (pacState.active) pacLoopId = requestAnimationFrame(pacmanLoop);
    }

    function startPacmanGame() {
      pacState.active = true;
      initPacmanLevel(1, true);
      if (pacLoopId) cancelAnimationFrame(pacLoopId);
      HoermannGameClock.reset("pacmanLoop");
      pacLoopId = requestAnimationFrame(pacmanLoop);
    }

    function stopPacmanGame() {
      pacState.active = false;
      if (pacLoopId) {
        cancelAnimationFrame(pacLoopId);
        pacLoopId = null;
      }
    }

    function setPacmanNextDir(dx, dy) {
      if (!pacState.active) return;
      pacState.player.nextDirX = dx;
      pacState.player.nextDirY = dy;
      if (pacState.player.dirX === 0 && pacState.player.dirY === 0) {
        pacState.player.dirX = dx;
        pacState.player.dirY = dy;
      }
    }

    // Touch & Button Event-Listener
    if (pacBtnLeft) pacBtnLeft.addEventListener('click', () => setPacmanNextDir(-1, 0));
    if (pacBtnUp) pacBtnUp.addEventListener('click', () => setPacmanNextDir(0, -1));
    if (pacBtnDown) pacBtnDown.addEventListener('click', () => setPacmanNextDir(0, 1));
    if (pacBtnRight) pacBtnRight.addEventListener('click', () => setPacmanNextDir(1, 0));

    if (restartPacmanBtn) {
      restartPacmanBtn.addEventListener('click', () => {
        startPacmanGame();
        showToast('Hörmann Mut-Man neu gestartet! 🟡');
      });
    }

    if (pacmanCashoutBtn) {
      pacmanCashoutBtn.addEventListener('click', () => {
        if (pacState.score <= 0) {
          showToast('Sammle erst Punkte im Labyrinth, bevor du dich in die Bestenliste einträgst! 🟡');
          return;
        }
        promptScoreSubmit(pacState.score, 'pacman', 'Hörmann Mut-Man');
      });
    }

    // Tastatursteuerung für Mut-Man (Pfeile & WASD)
    window.addEventListener('keydown', (e) => {
      if (!pacState.active) return;
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setPacmanNextDir(-1, 0);
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setPacmanNextDir(1, 0);
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setPacmanNextDir(0, -1);
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setPacmanNextDir(0, 1);
      }
    });

