    /* ==========================================================
       14. SPIEL NEU: TOWER OF MUT (TOWER OF DESTINY KOPIE MIT RESSE - TUTORIAL + 5 LEVEL)
       ========================================================== */
    const towerCanvas = document.getElementById('towerCanvas');
    const twCtx = towerCanvas ? towerCanvas.getContext('2d') : null;
    const towerLevelStat = document.getElementById('tower-level-stat');
    const towerLivesStat = document.getElementById('tower-lives-stat');
    const towerChestsStat = document.getElementById('tower-chests-stat');
    const towerScoreStat = document.getElementById('tower-score-stat');
    const towerJumpBtn = document.getElementById('tower-jump-btn');
    const towerCashoutBtn = document.getElementById('tower-cashout-btn');
    const restartTowerBtn = document.getElementById('restart-tower-btn');
    const towerLvlButtons = document.querySelectorAll('[data-tower-lvl]');

    // Wand-Begrenzungen des Hörmann-Schicksalsturms
    const TW_WALL_LEFT = 54;
    const TW_WALL_RIGHT = 686;
    const TW_FLOOR_Y = [426, 336, 246, 156, 66]; // 5 Stockwerke pro Turm-Level (0 = Erdgeschoss .. 4 = Dachboden mit Goldenem Tor!)

    // Handgebaute Original-Levels im "Tower of Destiny"-Stil (Tutorial + 5 ausgewogene, anspruchsvolle Levels)
    const TOWER_LEVEL_DEFS = [
      {
        id: 0,
        title: 'TUTORIAL: DIE GRUNDLAGEN DES MUTS',
        subtitle: 'Resse läuft von allein! Springe über Stacheln, öffne die goldene Truhe 📦 und springe an der Leiter 🪜 nach oben!',
        wallColor: '#1e3a8a',
        bgTint: '#09152b',
        speed: 3.1,
        clearBonus: 250,
        floors: [
          {
            // Etage 0: Sicherer Start + erste Truhe & Leiter
            chestX: 430,
            ladderX: 590,
            hazards: [],
            enemies: [],
            gems: [{ x: 240 }, { x: 320 }, { x: 510 }],
            hint: '1. Resse läuft automatisch! Berühre die goldene Hörmann-Truhe 📦, damit rechts die Leiter 🪜 erscheint!'
          },
          {
            // Etage 1: Erster kleiner Stachel-Sprung
            chestX: 250,
            ladderX: 140,
            hazards: [{ type: 'spikes', x: 400, w: 34 }],
            enemies: [],
            gems: [{ x: 400, yOff: -42 }, { x: 310 }],
            hint: '2. Drücke [LEERTASTE] oder Klick zum Springen über die Stahlzargen-Stacheln ⚠️!'
          },
          {
            // Etage 2: Erster Zweifel-Schleim (Draufspringen für +100 Pkt oder drüberspringen!)
            chestX: 520,
            ladderX: 610,
            hazards: [],
            enemies: [{ type: 'slime', x: 350, minX: 220, maxX: 460, vx: 1.3 }],
            gems: [{ x: 200 }, { x: 480 }],
            hint: '3. Springe von oben auf den Zweifel-Gegner 👾 (+100 Pkt) oder direkt über ihn hinweg!'
          },
          {
            // Etage 3: Vorletzte Etage vor dem Dach
            chestX: 300,
            ladderX: 160,
            hazards: [{ type: 'spikes', x: 450, w: 34 }],
            enemies: [],
            gems: [{ x: 450, yOff: -42 }, { x: 220 }],
            hint: '4. Öffne die letzte Truhe und klettere aufs Turmdach!'
          },
          {
            // Etage 4: Turmdach mit Goldenem Hörmann-Sektionaltor
            portalX: 560,
            hazards: [],
            enemies: [],
            gems: [{ x: 280 }, { x: 380 }, { x: 470 }],
            hint: '5. Lauf durch das Goldene Hörmann-Sektionaltor 🚪✨ zum Abschluss des Tutorials!'
          }
        ]
      },
      {
        id: 1,
        title: 'LEVEL 1: STAHLZARGEN-FUNDAMENT',
        subtitle: 'Der Aufstieg beginnt: Weiche den Stachelfallen und Wächtern im Werksturm aus!',
        wallColor: '#002d62',
        bgTint: '#020617',
        speed: 3.4,
        clearBonus: 400,
        floors: [
          {
            chestX: 520,
            ladderX: 615,
            hazards: [{ type: 'spikes', x: 310, w: 36 }],
            enemies: [],
            gems: [{ x: 310, yOff: -42 }, { x: 430 }]
          },
          {
            chestX: 210,
            ladderX: 120,
            hazards: [{ type: 'spikes', x: 460, w: 36 }],
            enemies: [{ type: 'slime', x: 330, minX: 250, maxX: 420, vx: 1.5 }],
            gems: [{ x: 460, yOff: -42 }, { x: 260 }]
          },
          {
            chestX: 560,
            ladderX: 370,
            hazards: [{ type: 'spikes', x: 240, w: 38 }, { type: 'spikes', x: 460, w: 38 }],
            enemies: [],
            gems: [{ x: 240, yOff: -42 }, { x: 460, yOff: -42 }, { x: 610 }]
          },
          {
            chestX: 190,
            ladderX: 600,
            hazards: [{ type: 'spikes', x: 380, w: 38 }],
            enemies: [{ type: 'slime', x: 490, minX: 430, maxX: 560, vx: 1.7 }],
            gems: [{ x: 140 }, { x: 380, yOff: -42 }]
          },
          {
            portalX: 150,
            hazards: [{ type: 'spikes', x: 370, w: 40 }],
            enemies: [],
            gems: [{ x: 480 }, { x: 370, yOff: -42 }, { x: 250 }]
          }
        ]
      },
      {
        id: 2,
        title: 'LEVEL 2: DIE HALLE DER ROTIERENDEN SÄGEN',
        subtitle: 'Vorsicht vor den rotierenden Stahl-Kreissägen ⚙️ und dem Mut-Schild-PowerUp 🛡️!',
        wallColor: '#1e293b',
        bgTint: '#0f172a',
        speed: 3.6,
        clearBonus: 550,
        floors: [
          {
            chestX: 540,
            ladderX: 620,
            hazards: [{ type: 'saw', x: 340, minX: 250, maxX: 430, vx: 1.8 }],
            enemies: [],
            gems: [{ x: 210 }, { x: 470 }],
            shieldX: 180
          },
          {
            chestX: 170,
            ladderX: 110,
            hazards: [{ type: 'spikes', x: 490, w: 40 }, { type: 'spikes', x: 310, w: 38 }],
            enemies: [],
            gems: [{ x: 490, yOff: -42 }, { x: 310, yOff: -42 }, { x: 220 }]
          },
          {
            chestX: 580,
            ladderX: 480,
            hazards: [{ type: 'saw', x: 290, minX: 200, maxX: 390, vx: 2.0 }],
            enemies: [{ type: 'slime', x: 520, minX: 430, maxX: 630, vx: 1.6 }],
            gems: [{ x: 300, yOff: -44 }, { x: 620 }]
          },
          {
            chestX: 160,
            ladderX: 610,
            hazards: [{ type: 'spikes', x: 290, w: 38 }, { type: 'spikes', x: 450, w: 38 }],
            enemies: [],
            gems: [{ x: 290, yOff: -42 }, { x: 450, yOff: -42 }, { x: 120 }]
          },
          {
            portalX: 140,
            hazards: [{ type: 'saw', x: 390, minX: 270, maxX: 500, vx: 2.1 }],
            enemies: [],
            gems: [{ x: 520 }, { x: 390, yOff: -45 }, { x: 230 }]
          }
        ]
      },
      {
        id: 3,
        title: 'LEVEL 3: FEUERSCHUTZ-GLUTKAMMER',
        subtitle: 'T30-Brandschutz-Test! Überwinde Feuergruben 🔥, Fledermäuse 🦇 und doppelte Fallen!',
        wallColor: '#4c0519',
        bgTint: '#1f040d',
        speed: 3.75,
        clearBonus: 700,
        floors: [
          {
            chestX: 560,
            ladderX: 130,
            hazards: [{ type: 'lava', x: 320, w: 54 }],
            enemies: [],
            gems: [{ x: 347, yOff: -45 }, { x: 490 }, { x: 610 }]
          },
          {
            chestX: 590,
            ladderX: 630,
            hazards: [{ type: 'spikes', x: 270, w: 38 }],
            enemies: [{ type: 'bat', x: 430, minX: 330, maxX: 540, vx: 2.0, yOff: -34 }],
            gems: [{ x: 270, yOff: -42 }, { x: 520 }],
            shieldX: 200
          },
          {
            chestX: 150,
            ladderX: 370,
            hazards: [{ type: 'lava', x: 480, w: 52 }, { type: 'spikes', x: 250, w: 36 }],
            enemies: [],
            gems: [{ x: 506, yOff: -45 }, { x: 250, yOff: -42 }, { x: 110 }]
          },
          {
            chestX: 600,
            ladderX: 125,
            hazards: [{ type: 'saw', x: 370, minX: 250, maxX: 490, vx: 2.2 }],
            enemies: [{ type: 'slime', x: 540, minX: 490, maxX: 640, vx: 1.8 }],
            gems: [{ x: 370, yOff: -45 }, { x: 635 }]
          },
          {
            portalX: 600,
            hazards: [{ type: 'lava', x: 290, w: 54 }, { type: 'spikes', x: 450, w: 38 }],
            enemies: [],
            gems: [{ x: 317, yOff: -45 }, { x: 450, yOff: -42 }, { x: 530 }]
          }
        ]
      },
      {
        id: 4,
        title: 'LEVEL 4: HOCHREGAL-FESTUNG DER ZWEIFEL',
        subtitle: 'Präzisions-Sprünge für echte Mut-Pioniere: Kombiniere Truhen-Läufe und Wand-Wenden!',
        wallColor: '#1e1b4b',
        bgTint: '#090721',
        speed: 3.9,
        clearBonus: 900,
        floors: [
          {
            chestX: 600,
            ladderX: 120,
            hazards: [{ type: 'spikes', x: 260, w: 38 }, { type: 'spikes', x: 430, w: 38 }],
            enemies: [],
            gems: [{ x: 260, yOff: -42 }, { x: 430, yOff: -42 }, { x: 540 }],
            shieldX: 345
          },
          {
            chestX: 580,
            ladderX: 630,
            hazards: [{ type: 'saw', x: 310, minX: 210, maxX: 420, vx: 2.3 }],
            enemies: [{ type: 'slime', x: 490, minX: 430, maxX: 560, vx: 1.9 }],
            gems: [{ x: 310, yOff: -45 }, { x: 530 }]
          },
          {
            chestX: 140,
            ladderX: 110,
            hazards: [{ type: 'lava', x: 460, w: 56 }],
            enemies: [{ type: 'bat', x: 290, minX: 200, maxX: 390, vx: 2.2, yOff: -34 }],
            gems: [{ x: 488, yOff: -45 }, { x: 190 }]
          },
          {
            chestX: 610,
            ladderX: 370,
            hazards: [{ type: 'spikes', x: 240, w: 40 }, { type: 'spikes', x: 490, w: 40 }],
            enemies: [],
            gems: [{ x: 240, yOff: -42 }, { x: 490, yOff: -42 }, { x: 640 }]
          },
          {
            portalX: 135,
            hazards: [{ type: 'saw', x: 260, minX: 190, maxX: 330, vx: 2.2 }, { type: 'spikes', x: 500, w: 38 }],
            enemies: [],
            gems: [{ x: 260, yOff: -45 }, { x: 180 }]
          }
        ]
      },
      {
        id: 5,
        title: 'LEVEL 5: DER GIPFEL DES HÖRMANN-MUTS (FINALE)',
        subtitle: 'Das Meisterstück für Resse: Erklimme die Spitze des Schicksalsturms und sichere dir die Krone!',
        wallColor: '#3b0764',
        bgTint: '#130224',
        speed: 4.05,
        clearBonus: 1500,
        floors: [
          {
            chestX: 610,
            ladderX: 115,
            hazards: [{ type: 'lava', x: 270, w: 54 }, { type: 'spikes', x: 450, w: 40 }],
            enemies: [],
            gems: [{ x: 297, yOff: -45 }, { x: 450, yOff: -42 }, { x: 550 }],
            shieldX: 190
          },
          {
            chestX: 600,
            ladderX: 635,
            hazards: [{ type: 'saw', x: 280, minX: 190, maxX: 380, vx: 2.4 }, { type: 'spikes', x: 470, w: 38 }],
            enemies: [],
            gems: [{ x: 280, yOff: -45 }, { x: 470, yOff: -42 }, { x: 560 }]
          },
          {
            chestX: 135,
            ladderX: 370,
            hazards: [{ type: 'lava', x: 500, w: 56 }],
            enemies: [
              { type: 'slime', x: 260, minX: 180, maxX: 340, vx: 2.0 },
              { type: 'bat', x: 430, minX: 360, maxX: 490, vx: 2.2, yOff: -34 }
            ],
            gems: [{ x: 528, yOff: -45 }, { x: 190 }, { x: 370 }],
            shieldX: 430
          },
          {
            chestX: 130,
            ladderX: 625,
            hazards: [{ type: 'spikes', x: 250, w: 40 }, { type: 'saw', x: 480, minX: 390, maxX: 565, vx: 2.4 }],
            enemies: [],
            gems: [{ x: 250, yOff: -42 }, { x: 480, yOff: -45 }, { x: 170 }]
          },
          {
            portalX: 135,
            hazards: [{ type: 'lava', x: 460, w: 56 }, { type: 'spikes', x: 280, w: 40 }],
            enemies: [],
            gems: [{ x: 488, yOff: -45 }, { x: 370 }, { x: 280, yOff: -42 }, { x: 195 }]
          }
        ]
      }
    ];

    let towerAnimId = null;
    let twState = {
      active: false,
      levelIdx: 0,
      score: 0,
      lives: 3,
      chestsOpenedInLevel: 0,
      totalChestsInLevel: 4,
      resse: {
        x: 90,
        y: TW_FLOOR_Y[0],
        vy: 0,
        dir: 1,
        floor: 0,
        onGround: true,
        climbing: false,
        climbTargetY: 0,
        climbLadderX: 0,
        hasShield: false,
        invulnTimer: 0,
        animTick: 0
      },
      floorsRuntime: [],
      floatingTexts: [],
      particles: [],
      bannerText: '',
      bannerTimer: 0,
      levelTransitionTimer: 0,
      gameOver: false,
      victoryAll: false
    };

    function cloneFloorRuntime(levelDef) {
      return levelDef.floors.map((f, fIdx) => {
        const floorY = TW_FLOOR_Y[fIdx];
        return {
          floorIdx: fIdx,
          y: floorY,
          chest: f.chestX ? { x: f.chestX, y: floorY, opened: false, openAnim: 0 } : null,
          ladder: f.ladderX ? { x: f.ladderX, yBottom: floorY, yTop: TW_FLOOR_Y[fIdx + 1], active: false, dropProgress: 0 } : null,
          portal: f.portalX ? { x: f.portalX, y: floorY, pulse: 0 } : null,
          shieldItem: f.shieldX ? { x: f.shieldX, y: floorY - 18, collected: false } : null,
          hint: f.hint || '',
          hazards: (f.hazards || []).map(h => ({ ...h, curX: h.x, angle: 0 })),
          enemies: (f.enemies || []).map(e => ({ ...e, curX: e.x, alive: true, dir: 1 })),
          gems: (f.gems || []).map(g => ({ x: g.x, y: floorY + (g.yOff || -16), collected: false }))
        };
      });
    }

    function loadTowerLevel(lvlIdx, resetScoreAndLives = false) {
      const clampedIdx = Math.max(0, Math.min(TOWER_LEVEL_DEFS.length - 1, lvlIdx));
      const def = TOWER_LEVEL_DEFS[clampedIdx];
      twState.levelIdx = clampedIdx;
      if (resetScoreAndLives) {
        twState.score = 0;
        twState.lives = 3;
      }
      twState.gameOver = false;
      twState.victoryAll = false;
      twState.levelTransitionTimer = 0;
      twState.floorsRuntime = cloneFloorRuntime(def);
      twState.chestsOpenedInLevel = 0;
      twState.totalChestsInLevel = twState.floorsRuntime.filter(f => f.chest).length;

      twState.resse.floor = 0;
      twState.resse.x = TW_WALL_LEFT + 36;
      twState.resse.y = TW_FLOOR_Y[0];
      twState.resse.vy = 0;
      twState.resse.dir = 1;
      twState.resse.onGround = true;
      twState.resse.climbing = false;
      twState.resse.invulnTimer = 35;

      twState.bannerText = `🏰 ${def.title}`;
      twState.bannerTimer = 140;

      updateTowerUi();
    }

    function updateTowerUi() {
      if (!towerLevelStat) return;
      const def = TOWER_LEVEL_DEFS[twState.levelIdx] || TOWER_LEVEL_DEFS[0];
      towerLevelStat.textContent = twState.levelIdx === 0 ? '🎓 Tutorial (0/5)' : `Level ${twState.levelIdx} / 5`;
      towerLivesStat.textContent = '❤️'.repeat(Math.max(0, twState.lives)) + (twState.resse.hasShield ? ' 🛡️' : '');
      towerChestsStat.textContent = `📦 ${twState.chestsOpenedInLevel}/${twState.totalChestsInLevel}`;
      towerScoreStat.textContent = `${twState.score}`;

      towerLvlButtons.forEach(btn => {
        const bLvl = Number(btn.getAttribute('data-tower-lvl'));
        const isCurrent = bLvl === twState.levelIdx;
        btn.style.background = isCurrent ? 'var(--hoermann-orange)' : '#1e293b';
        btn.style.borderColor = isCurrent ? '#fde047' : '#475569';
      });
    }

    function startTowerGame(startLvl = 0) {
      stopTowerGame();
      twState.active = true;
      loadTowerLevel(typeof startLvl === 'number' ? startLvl : 0, true);
      HoermannGameClock.reset("towerLoop");
      towerLoop();
    }

    function stopTowerGame() {
      twState.active = false;
      if (towerAnimId) {
        cancelAnimationFrame(towerAnimId);
        towerAnimId = null;
      }
    }

    function spawnTowerFloater(text, x, y, color = '#fde047') {
      twState.floatingTexts.push({ text, x, y, color, life: 1.0 });
    }

    function spawnTowerParticles(x, y, color, count = 14) {
      for (let i = 0; i < count; i++) {
        twState.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 7,
          vy: -Math.random() * 6 - 1,
          color,
          size: 3 + Math.random() * 4,
          life: 1.0
        });
      }
    }

    function triggerTowerJump() {
      if (!twState.active) return;

      if (twState.gameOver || twState.victoryAll) {
        if (twState.score > 0) {
          promptScoreSubmit(twState.score, 'tower', 'Tower of Mut');
        } else {
          startTowerGame(0);
        }
        return;
      }

      if (twState.levelTransitionTimer > 0) return;

      const r = twState.resse;
      if (r.climbing) return;

      const curFloorObj = twState.floorsRuntime[r.floor];

      // Prüfen, ob Resse direkt vor einer aktiven Mut-Leiter steht -> Beim Springen klettert er sofort in die nächste Etage!
      if (curFloorObj && curFloorObj.ladder && curFloorObj.ladder.active) {
        const distToLadder = Math.abs(r.x - curFloorObj.ladder.x);
        if (distToLadder <= 34) {
          r.climbing = true;
          r.x = curFloorObj.ladder.x;
          r.vy = 0;
          r.climbLadderX = curFloorObj.ladder.x;
          r.climbTargetY = TW_FLOOR_Y[r.floor + 1];
          playSound('ladderStep');
          spawnTowerFloater('🪜 AUFSTIEG!', r.x, r.y - 28, '#38bdf8');
          return;
        }
      }

      // Klassischer Tower-of-Destiny Sprung
      if (r.onGround) {
        r.vy = -8.7;
        r.onGround = false;
        playSound('jump');
        spawnTowerParticles(r.x, r.y, '#94a3b8', 6);
      }
    }

    function hurtResseInTower(reasonText) {
      const r = twState.resse;
      if (r.invulnTimer > 0 || r.climbing || twState.levelTransitionTimer > 0) return;

      if (r.hasShield) {
        r.hasShield = false;
        r.invulnTimer = 55;
        playSound('hydraulic');
        spawnTowerParticles(r.x, r.y - 16, '#38bdf8', 18);
        spawnTowerFloater('🛡️ STAHLZARGEN-SCHILD GEBLOCKT!', r.x, r.y - 34, '#38bdf8');
        updateTowerUi();
        return;
      }

      twState.lives--;
      r.invulnTimer = 65;
      playSound('crunch');
      spawnTowerParticles(r.x, r.y - 16, '#ef4444', 20);
      spawnTowerFloater(`💥 AUTSCH! (${reasonText})`, r.x, r.y - 34, '#f87171');

      // Resse startet sicher am Anfang der aktuellen Etage neu
      r.x = TW_WALL_LEFT + 36;
      r.y = TW_FLOOR_Y[r.floor];
      r.vy = 0;
      r.dir = 1;
      r.onGround = true;

      updateTowerUi();

      if (twState.lives <= 0) {
        twState.gameOver = true;
        playSound('alarm');
        twState.bannerText = `💔 TURM-STURZ! GESAMTPUNKTE: ${twState.score}`;
        twState.bannerTimer = 300;
        HoermannGameSession.delay(() => {
          if (twState.active && twState.gameOver && twState.score > 0) {
            promptScoreSubmit(twState.score, 'tower', 'Tower of Mut');
          }
        }, 700);
      }
    }

    function completeCurrentTowerLevel() {
      const def = TOWER_LEVEL_DEFS[twState.levelIdx];
      const bonus = def ? def.clearBonus : 300;
      twState.score += bonus;
      playSound('jackpot');
      triggerParticleEffect('gold');
      spawnTowerFloater(`🚪 ETAPPEN-SIEG! +${bonus} PKT`, twState.resse.x, twState.resse.y - 40, '#fde047');
      updateTowerUi();

      if (twState.levelIdx >= TOWER_LEVEL_DEFS.length - 1) {
        // Alle 5 Level + Tutorial komplett gemeistert!
        const crownBonus = twState.lives * 250;
        twState.score += crownBonus;
        twState.victoryAll = true;
        updateTowerUi();
        playSound('victory');
        triggerParticleEffect('firework');
        twState.bannerText = `👑 TURM DES MUTS KOMPLETT BEZWUNGEN! (${twState.score} PKT)`;
        twState.bannerTimer = 400;
        HoermannGameSession.delay(() => {
          if (twState.active && twState.victoryAll) {
            promptScoreSubmit(twState.score, 'tower', 'Tower of Mut');
          }
        }, 800);
      } else {
        twState.levelTransitionTimer = 75;
        const nextLvl = twState.levelIdx + 1;
        twState.bannerText = `🎉 ${def.title} GESCHAFFT! WEITER ZU LEVEL ${nextLvl}...`;
        twState.bannerTimer = 90;
      }
    }

    function updateTowerPhysics() {
      if (twState.gameOver || twState.victoryAll) return;

      if (twState.bannerTimer > 0) twState.bannerTimer--;

      if (twState.levelTransitionTimer > 0) {
        twState.levelTransitionTimer--;
        if (twState.levelTransitionTimer === 0) {
          loadTowerLevel(twState.levelIdx + 1, false);
        }
        return;
      }

      const def = TOWER_LEVEL_DEFS[twState.levelIdx] || TOWER_LEVEL_DEFS[0];
      const r = twState.resse;
      r.animTick++;
      if (r.invulnTimer > 0) r.invulnTimer--;

      // 1. Leiter-Kletter-Animation in die nächste Etage
      if (r.climbing) {
        r.y -= 4.2;
        if (r.y <= r.climbTargetY) {
          r.floor = Math.min(4, r.floor + 1);
          r.y = TW_FLOOR_Y[r.floor];
          r.climbing = false;
          r.onGround = true;
          r.vy = 0;
          twState.score += 50;
          playSound('score');
          updateTowerUi();
        }
        return;
      }

      // 2. Original Tower-of-Destiny Auto-Run von Wand zu Wand!
      r.x += r.dir * def.speed;
      if (r.x <= TW_WALL_LEFT + 16) {
        r.x = TW_WALL_LEFT + 16;
        r.dir = 1;
      } else if (r.x >= TW_WALL_RIGHT - 16) {
        r.x = TW_WALL_RIGHT - 16;
        r.dir = -1;
      }

      // 3. Vertikale Sprung-Physik
      const floorY = TW_FLOOR_Y[r.floor];
      if (!r.onGround) {
        r.y += r.vy;
        r.vy += 0.46; // Schwerkraft
        if (r.y >= floorY) {
          r.y = floorY;
          r.vy = 0;
          r.onGround = true;
        }
      }

      // 4. Alle Etagen-Objekte (Sägen, Gegner, Truhen, Leitern, Diamanten) aktualisieren
      twState.floorsRuntime.forEach((fl) => {
        if (fl.chest && fl.chest.opened && fl.chest.openAnim < 1) {
          fl.chest.openAnim = Math.min(1, fl.chest.openAnim + 0.08);
        }
        if (fl.ladder && fl.ladder.active && fl.ladder.dropProgress < 1) {
          fl.ladder.dropProgress = Math.min(1, fl.ladder.dropProgress + 0.07);
        }
        if (fl.portal) {
          fl.portal.pulse += 0.08;
        }

        fl.hazards.forEach(h => {
          if (h.type === 'saw') {
            h.curX += h.vx;
            h.angle += 0.22;
            if (h.curX <= h.minX || h.curX >= h.maxX) h.vx *= -1;
          }
        });

        fl.enemies.forEach(en => {
          if (!en.alive) return;
          en.curX += en.vx * en.dir;
          if (en.curX <= en.minX) { en.curX = en.minX; en.dir = 1; }
          if (en.curX >= en.maxX) { en.curX = en.maxX; en.dir = -1; }
        });
      });

      // 5. Kollisionen auf Resses aktueller Etage prüfen
      const curFl = twState.floorsRuntime[r.floor];
      if (!curFl) return;

      // 5a. Mut-Diamanten / Münzen einsammeln
      curFl.gems.forEach(g => {
        if (!g.collected && Math.abs(r.x - g.x) < 22 && Math.abs((r.y - 16) - g.y) < 24) {
          g.collected = true;
          twState.score += 35;
          playSound('coin');
          spawnTowerParticles(g.x, g.y, '#fde047', 8);
          spawnTowerFloater('+35', g.x, g.y - 10, '#fde047');
          updateTowerUi();
        }
      });

      // 5b. Stahlzargen-Schutzschild einsammeln
      if (curFl.shieldItem && !curFl.shieldItem.collected) {
        if (Math.abs(r.x - curFl.shieldItem.x) < 24 && Math.abs((r.y - 16) - curFl.shieldItem.y) < 24) {
          curFl.shieldItem.collected = true;
          r.hasShield = true;
          twState.score += 75;
          playSound('powerup');
          spawnTowerFloater('🛡️ MUT-SCHILD AKTIV!', r.x, r.y - 32, '#38bdf8');
          updateTowerUi();
        }
      }

      // 5c. Goldene Hörmann-Truhe öffnen -> Lässt die Leiter nach oben herunterklappen!
      if (curFl.chest && !curFl.chest.opened) {
        if (Math.abs(r.x - curFl.chest.x) < 28 && Math.abs(r.y - curFl.chest.y) < 30) {
          curFl.chest.opened = true;
          twState.chestsOpenedInLevel++;
          twState.score += 120;
          if (curFl.ladder) {
            curFl.ladder.active = true;
          }
          playSound('powerup');
          spawnTowerParticles(curFl.chest.x, curFl.chest.y - 14, '#f59c00', 18);
          spawnTowerFloater('📦 TRUHE OFFEN! +120 PKT (LEITER FREI!)', curFl.chest.x, curFl.chest.y - 32, '#fbbf24');
          updateTowerUi();
        }
      }

      // 5d. Falls Resse im Sprung direkt durch die aktivierte Leiter fliegt -> Automatisch festhalten & hochklettern!
      if (curFl.ladder && curFl.ladder.active && !r.onGround && r.vy < 0) {
        if (Math.abs(r.x - curFl.ladder.x) <= 26) {
          r.climbing = true;
          r.x = curFl.ladder.x;
          r.vy = 0;
          r.climbLadderX = curFl.ladder.x;
          r.climbTargetY = TW_FLOOR_Y[r.floor + 1];
          playSound('ladderStep');
          spawnTowerFloater('🪜 AUFSTIEG!', r.x, r.y - 28, '#38bdf8');
          return;
        }
      }

      // 5e. Goldenes Sektionaltor auf Etage 4 erreichen -> Level geschafft!
      if (curFl.portal && Math.abs(r.x - curFl.portal.x) < 28 && Math.abs(r.y - curFl.portal.y) < 32) {
        completeCurrentTowerLevel();
        return;
      }

      // 5f. Gegner-Kollision (Von oben draufspringen = besiegen + Bounce; seitlich = Schaden)
      curFl.enemies.forEach(en => {
        if (!en.alive) return;
        const enemyY = en.type === 'bat' ? curFl.y + (en.yOff || -34) : curFl.y;
        const dx = Math.abs(r.x - en.curX);
        if (dx < 22) {
          if (en.type === 'slime' && !r.onGround && r.vy > 0 && r.y < enemyY - 6) {
            // Stomp auf Zweifel-Schleim!
            en.alive = false;
            r.vy = -7.2;
            twState.score += 100;
            playSound('score');
            spawnTowerParticles(en.curX, enemyY - 10, '#10b981', 15);
            spawnTowerFloater('💥 ZWEIFEL ZERSTAMPFT! +100', en.curX, enemyY - 28, '#34d399');
            updateTowerUi();
          } else if (Math.abs((r.y - 14) - (enemyY - 12)) < 20) {
            hurtResseInTower(en.type === 'bat' ? 'Flatter-Zweifel' : 'Zweifel-Schleim');
          }
        }
      });

      // 5g. Gefahren-Kollision (Stacheln, Kreissägen, Feuergruben)
      curFl.hazards.forEach(h => {
        if (h.type === 'spikes') {
          if (r.x > h.x - h.w / 2 + 4 && r.x < h.x + h.w / 2 - 4 && r.y >= curFl.y - 10) {
            hurtResseInTower('Stahl-Stacheln');
          }
        } else if (h.type === 'lava') {
          if (r.x > h.x - h.w / 2 + 6 && r.x < h.x + h.w / 2 - 6 && r.y >= curFl.y - 6) {
            hurtResseInTower('Feuergrube');
          }
        } else if (h.type === 'saw') {
          const dist = Math.hypot(r.x - h.curX, (r.y - 12) - (curFl.y - 12));
          if (dist < 22) {
            hurtResseInTower('Kreissäge');
          }
        }
      });
    }

    function drawTowerScene() {
      if (!twCtx) return;
      const def = TOWER_LEVEL_DEFS[twState.levelIdx] || TOWER_LEVEL_DEFS[0];
      twCtx.save();

      // 1. Turm-Hintergrund
      twCtx.fillStyle = def.bgTint || '#020617';
      twCtx.fillRect(0, 0, towerCanvas.width, towerCanvas.height);

      // Backstein-Muster im Hintergrund
      twCtx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      twCtx.lineWidth = 1;
      for (let by = 20; by < towerCanvas.height; by += 24) {
        const shift = (by / 24) % 2 === 0 ? 0 : 24;
        for (let bx = TW_WALL_LEFT; bx < TW_WALL_RIGHT; bx += 48) {
          twCtx.strokeRect(bx + shift, by, 48, 24);
        }
      }

      // Linke & Rechte Hörmann-Stahlzargen-Turmmauer
      twCtx.fillStyle = def.wallColor || '#002d62';
      twCtx.fillRect(0, 0, TW_WALL_LEFT, towerCanvas.height);
      twCtx.fillRect(TW_WALL_RIGHT, 0, towerCanvas.width - TW_WALL_RIGHT, towerCanvas.height);

      twCtx.strokeStyle = '#f59c00';
      twCtx.lineWidth = 3;
      twCtx.beginPath();
      twCtx.moveTo(TW_WALL_LEFT, 0);
      twCtx.lineTo(TW_WALL_LEFT, towerCanvas.height);
      twCtx.moveTo(TW_WALL_RIGHT, 0);
      twCtx.lineTo(TW_WALL_RIGHT, towerCanvas.height);
      twCtx.stroke();

      // 2. Alle 5 Etagen zeichnen
      twState.floorsRuntime.forEach((fl, fIdx) => {
        const fy = fl.y;

        // Stahl-Träger-Boden der Etage
        twCtx.fillStyle = fIdx === twState.resse.floor ? '#1e3a8a' : '#1e293b';
        twCtx.fillRect(TW_WALL_LEFT, fy, TW_WALL_RIGHT - TW_WALL_LEFT, 12);
        twCtx.strokeStyle = fIdx === twState.resse.floor ? '#f59c00' : '#475569';
        twCtx.lineWidth = 2;
        twCtx.strokeRect(TW_WALL_LEFT, fy, TW_WALL_RIGHT - TW_WALL_LEFT, 12);

        // Etagen-Nummer links in der Turmwand
        twCtx.fillStyle = fIdx === twState.resse.floor ? '#fde047' : '#94a3b8';
        twCtx.font = '900 11px monospace';
        twCtx.textAlign = 'center';
        twCtx.fillText(`E${fIdx + 1}`, TW_WALL_LEFT / 2, fy - 6);

        // Tutorial-/Etagen-Hinweis auf der aktiven Etage
        if (fl.hint && fIdx === twState.resse.floor) {
          twCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          twCtx.fillRect(TW_WALL_LEFT + 14, fy - 76, TW_WALL_RIGHT - TW_WALL_LEFT - 28, 22);
          twCtx.fillStyle = '#fde047';
          twCtx.font = '800 11px Inter, sans-serif';
          twCtx.textAlign = 'center';
          twCtx.fillText(fl.hint, towerCanvas.width / 2, fy - 61);
        }

        // Gefahren zeichnen (Stacheln, Feuergrube, Säge)
        fl.hazards.forEach(h => {
          if (h.type === 'spikes') {
            const startX = h.x - h.w / 2;
            const spikeCount = Math.max(3, Math.floor(h.w / 9));
            const sw = h.w / spikeCount;
            twCtx.fillStyle = '#ef4444';
            for (let s = 0; s < spikeCount; s++) {
              twCtx.beginPath();
              twCtx.moveTo(startX + s * sw, fy);
              twCtx.lineTo(startX + (s + 0.5) * sw, fy - 15);
              twCtx.lineTo(startX + (s + 1) * sw, fy);
              twCtx.closePath();
              twCtx.fill();
            }
          } else if (h.type === 'lava') {
            twCtx.fillStyle = '#dc2626';
            twCtx.fillRect(h.x - h.w / 2, fy - 3, h.w, 14);
            twCtx.fillStyle = '#fde047';
            const wave = Math.sin(Date.now() * 0.01) * 3;
            twCtx.fillRect(h.x - h.w / 2 + 4, fy - 2 + wave * 0.3, h.w - 8, 5);
          } else if (h.type === 'saw') {
            twCtx.save();
            twCtx.translate(h.curX, fy - 12);
            twCtx.rotate(h.angle);
            twCtx.fillStyle = '#cbd5e1';
            twCtx.beginPath();
            twCtx.arc(0, 0, 15, 0, Math.PI * 2);
            twCtx.fill();
            twCtx.strokeStyle = '#ef4444';
            twCtx.lineWidth = 3;
            twCtx.stroke();
            twCtx.fillStyle = '#0f172a';
            twCtx.beginPath();
            twCtx.arc(0, 0, 5, 0, Math.PI * 2);
            twCtx.fill();
            twCtx.restore();
          }
        });

        // Mut-Diamanten / Goldmünzen
        fl.gems.forEach(g => {
          if (g.collected) return;
          twCtx.fillStyle = '#38bdf8';
          twCtx.beginPath();
          twCtx.moveTo(g.x, g.y - 9);
          twCtx.lineTo(g.x + 8, g.y);
          twCtx.lineTo(g.x, g.y + 9);
          twCtx.lineTo(g.x - 8, g.y);
          twCtx.closePath();
          twCtx.fill();
          twCtx.strokeStyle = '#e0f2fe';
          twCtx.lineWidth = 1.5;
          twCtx.stroke();
        });

        // Schutzschild-Item
        if (fl.shieldItem && !fl.shieldItem.collected) {
          const sx = fl.shieldItem.x;
          const sy = fl.shieldItem.y;
          twCtx.fillStyle = '#0284c7';
          twCtx.beginPath();
          twCtx.arc(sx, sy, 12, 0, Math.PI * 2);
          twCtx.fill();
          twCtx.strokeStyle = '#fde047';
          twCtx.lineWidth = 2;
          twCtx.stroke();
          twCtx.fillStyle = '#ffffff';
          twCtx.font = '900 11px Inter, sans-serif';
          twCtx.textAlign = 'center';
          twCtx.fillText('🛡️', sx, sy + 4);
        }

        // Goldene Hörmann-Truhe
        if (fl.chest) {
          const cx = fl.chest.x;
          const cy = fl.chest.y;
          twCtx.fillStyle = fl.chest.opened ? '#16a34a' : '#d97706';
          twCtx.fillRect(cx - 18, cy - 24, 36, 24);
          twCtx.strokeStyle = '#fde047';
          twCtx.lineWidth = 2;
          twCtx.strokeRect(cx - 18, cy - 24, 36, 24);

          twCtx.fillStyle = '#fde047';
          twCtx.fillRect(cx - 4, cy - 15, 8, 7);
          if (!fl.chest.opened) {
            twCtx.fillStyle = '#fde047';
            twCtx.font = '900 9.5px Inter, sans-serif';
            twCtx.textAlign = 'center';
            twCtx.fillText('TRUHE', cx, cy - 28);
          }
        }

        // Ausklappbare Mut-Leiter (Tower of Destiny Kern-Mechanik!)
        if (fl.ladder) {
          const lx = fl.ladder.x;
          if (fl.ladder.active) {
            const currentTop = fl.ladder.yBottom - (fl.ladder.yBottom - fl.ladder.yTop) * fl.ladder.dropProgress;
            twCtx.strokeStyle = '#fde047';
            twCtx.lineWidth = 3.5;
            twCtx.beginPath();
            twCtx.moveTo(lx - 11, fl.ladder.yBottom);
            twCtx.lineTo(lx - 11, currentTop);
            twCtx.moveTo(lx + 11, fl.ladder.yBottom);
            twCtx.lineTo(lx + 11, currentTop);
            twCtx.stroke();

            for (let ry = fl.ladder.yBottom - 10; ry >= currentTop; ry -= 12) {
              twCtx.beginPath();
              twCtx.moveTo(lx - 11, ry);
              twCtx.lineTo(lx + 11, ry);
              twCtx.stroke();
            }

            if (fIdx === twState.resse.floor) {
              twCtx.fillStyle = '#38bdf8';
              twCtx.font = '900 10px Inter, sans-serif';
              twCtx.textAlign = 'center';
              twCtx.fillText('⬆️ HIER SPRINGEN!', lx, currentTop - 6);
            }
          } else {
            // Noch eingeklappte Leiter-Markierung an der Decke
            twCtx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
            twCtx.setLineDash([4, 4]);
            twCtx.strokeRect(lx - 10, fl.ladder.yTop, 20, fl.ladder.yBottom - fl.ladder.yTop);
            twCtx.setLineDash([]);
          }
        }

        // Goldenes Hörmann-Sektionaltor (Ziel-Portal auf Etage 5)
        if (fl.portal) {
          const px = fl.portal.x;
          const py = fl.portal.y;
          twCtx.fillStyle = '#002d62';
          twCtx.fillRect(px - 26, py - 48, 52, 48);
          twCtx.strokeStyle = '#fde047';
          twCtx.lineWidth = 3;
          twCtx.strokeRect(px - 26, py - 48, 52, 48);

          for (let l = 0; l < 4; l++) {
            twCtx.fillStyle = l === 1 ? '#38bdf8' : '#f59c00';
            twCtx.fillRect(px - 22, py - 44 + l * 10, 44, 7);
          }

          twCtx.fillStyle = '#fde047';
          twCtx.font = '900 10px Inter, sans-serif';
          twCtx.textAlign = 'center';
          twCtx.fillText('🚪 ZIEL-TOR', px, py - 53);
        }

        // Gegner zeichnen
        fl.enemies.forEach(en => {
          if (!en.alive) return;
          const ex = en.curX;
          const ey = en.type === 'bat' ? fy + (en.yOff || -34) + Math.sin(Date.now() * 0.01) * 5 : fy;
          if (en.type === 'slime') {
            twCtx.fillStyle = '#a855f7';
            twCtx.beginPath();
            twCtx.arc(ex, ey - 10, 13, Math.PI, 0);
            twCtx.lineTo(ex + 13, ey);
            twCtx.lineTo(ex - 13, ey);
            twCtx.closePath();
            twCtx.fill();
            twCtx.fillStyle = '#ffffff';
            twCtx.fillRect(ex - 6, ey - 12, 4, 4);
            twCtx.fillRect(ex + 2, ey - 12, 4, 4);
          } else {
            twCtx.fillStyle = '#f43f5e';
            twCtx.beginPath();
            twCtx.arc(ex, ey, 9, 0, Math.PI * 2);
            twCtx.fill();
            const wingY = Math.sin(Date.now() * 0.025) * 6;
            twCtx.strokeStyle = '#fb7185';
            twCtx.lineWidth = 3;
            twCtx.beginPath();
            twCtx.moveTo(ex - 8, ey);
            twCtx.lineTo(ex - 18, ey - wingY);
            twCtx.moveTo(ex + 8, ey);
            twCtx.lineTo(ex + 18, ey - wingY);
            twCtx.stroke();
          }
        });
      });

      // 3. SPIELFIGUR: DENNIS "RESSE" RESSEMANN (im Hörmann-Outfit mit Schutzhelm & Mut-Wappen!)
      const r = twState.resse;
      if (r.invulnTimer % 4 < 2) {
        twCtx.save();
        twCtx.translate(r.x, r.y);

        if (r.hasShield) {
          twCtx.strokeStyle = '#38bdf8';
          twCtx.lineWidth = 2.5;
          twCtx.beginPath();
          twCtx.arc(0, -18, 24, 0, Math.PI * 2);
          twCtx.stroke();
        }

        // Schuhe / Lauf-Animation
        const legSwing = r.onGround ? Math.sin(r.animTick * 0.35) * 5 : 4;
        twCtx.fillStyle = '#1e293b';
        twCtx.fillRect(-9 + legSwing, -6, 7, 6);
        twCtx.fillRect(2 - legSwing, -6, 7, 6);

        // Blaue Hörmann-Latzhose & Arbeitsjacke
        twCtx.fillStyle = '#002d62';
        twCtx.fillRect(-11, -24, 22, 18);
        twCtx.fillStyle = '#f59c00';
        twCtx.fillRect(-11, -17, 22, 4); // Goldener Hörmann-Gürtelstreifen

        // Kopf
        twCtx.fillStyle = '#fde68a';
        twCtx.fillRect(-9, -35, 18, 12);

        // Augen in Laufrichtung
        twCtx.fillStyle = '#0f172a';
        const eyeX = r.dir >= 0 ? 3 : -6;
        twCtx.fillRect(eyeX, -32, 3, 3);

        // Gelb-Goldener Hörmann-Meisterhelm
        twCtx.fillStyle = '#fbbf24';
        twCtx.beginPath();
        twCtx.arc(0, -35, 11, Math.PI, 0);
        twCtx.fill();
        twCtx.fillRect(-13, -36, 26, 3);

        // Namens-Tag "RESSE" über der Figur
        twCtx.fillStyle = '#fde047';
        twCtx.font = '900 9.5px Inter, sans-serif';
        twCtx.textAlign = 'center';
        twCtx.fillText('RESSE', 0, -48);

        twCtx.restore();
      }

      // 4. Partikel & Schwebetexte
      for (let i = twState.particles.length - 1; i >= 0; i--) {
        const p = twState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life -= 0.03;
        if (p.life <= 0) {
          twState.particles.splice(i, 1);
          continue;
        }
        twCtx.fillStyle = p.color;
        twCtx.globalAlpha = Math.max(0, p.life);
        twCtx.fillRect(p.x, p.y, p.size, p.size);
        twCtx.globalAlpha = 1.0;
      }

      for (let i = twState.floatingTexts.length - 1; i >= 0; i--) {
        const ft = twState.floatingTexts[i];
        ft.y -= 0.8;
        ft.life -= 0.022;
        if (ft.life <= 0) {
          twState.floatingTexts.splice(i, 1);
          continue;
        }
        twCtx.save();
        twCtx.globalAlpha = Math.max(0, ft.life);
        twCtx.fillStyle = ft.color;
        twCtx.font = '900 12px Inter, sans-serif';
        twCtx.textAlign = 'center';
        twCtx.fillText(ft.text, ft.x, ft.y);
        twCtx.restore();
      }

      // 5. Oberes Level-Banner
      const curDef = TOWER_LEVEL_DEFS[twState.levelIdx] || TOWER_LEVEL_DEFS[0];
      twCtx.fillStyle = 'rgba(0, 24, 48, 0.9)';
      twCtx.fillRect(TW_WALL_LEFT, 0, TW_WALL_RIGHT - TW_WALL_LEFT, 26);
      twCtx.fillStyle = '#fde047';
      twCtx.font = '900 12px Inter, sans-serif';
      twCtx.textAlign = 'center';
      twCtx.fillText(`${curDef.title} — „Mut bringt Resse an die Spitze!“`, towerCanvas.width / 2, 17);

      if (twState.bannerTimer > 0 && twState.bannerText) {
        twCtx.fillStyle = 'rgba(0, 45, 98, 0.92)';
        twCtx.fillRect(140, 210, 460, 54);
        twCtx.strokeStyle = '#f59c00';
        twCtx.lineWidth = 3;
        twCtx.strokeRect(140, 210, 460, 54);
        twCtx.fillStyle = '#ffffff';
        twCtx.font = '900 15px Inter, sans-serif';
        twCtx.textAlign = 'center';
        twCtx.fillText(twState.bannerText, towerCanvas.width / 2, 242);
      }

      twCtx.restore();
    }

    function towerLoop(frameTime) {
      if (!(twState.active)) return;
      HoermannGameClock.run("towerLoop", frameTime, () => {
      if (!twState.active) return;
      updateTowerPhysics();
      drawTowerScene();

      });
      if (twState.active) towerAnimId = requestAnimationFrame(towerLoop);
    }

    if (towerJumpBtn) {
      towerJumpBtn.addEventListener('click', triggerTowerJump);
    }
    if (towerCanvas) {
      towerCanvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        triggerTowerJump();
      });
    }
    if (restartTowerBtn) {
      restartTowerBtn.addEventListener('click', () => startTowerGame(twState.levelIdx));
    }
    if (towerCashoutBtn) {
      towerCashoutBtn.addEventListener('click', () => {
        if (twState.score <= 0) {
          showToast('Sammle erst Punkte im Turm, bevor du dich in die Bestenliste einträgst! 🏰');
          return;
        }
        promptScoreSubmit(twState.score, 'tower', 'Tower of Mut');
      });
    }
    towerLvlButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetLvl = Number(btn.getAttribute('data-tower-lvl')) || 0;
        loadTowerLevel(targetLvl, false);
      });
    });

