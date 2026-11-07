    /* ==========================================================
       12. GAME NEU: LAGERMEISTER NICO MALOCHT (2.5D ISO PIXEL-ART)
       ========================================================== */
    const flCanvas = document.getElementById('forkliftCanvas');
    const flCtx = flCanvas.getContext('2d');

    /* Scharfe Darstellung (0.3): Die Spiel-Koordinaten bleiben 780 x 470 ("logische Groesse"). Die Leinwand hat
       intern mehr Pixel (Geraete-Pixeldichte, hoechstens 2), der Kontext wird vor jedem Bild entsprechend skaliert.
       Die CSS-Groesse aendert sich nicht. */
    const FL_W = 780, FL_H = 470;
    let flDpr = 1;       // Pixel pro logischer Einheit (Backing-Aufloesung)
    let flCssScale = 1;  // angezeigte CSS-Breite / 780 (Handy: ca. 0,45)
    let flCompact = false; // schmale Anzeige: Texte groesser und kuerzer
    function flFitCanvas() {
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const w = Math.round(FL_W * dpr), h = Math.round(FL_H * dpr);
      if (flCanvas.width !== w || flCanvas.height !== h) { flCanvas.width = w; flCanvas.height = h; }
      flDpr = w / FL_W;
      flCssScale = (flCanvas.clientWidth || FL_W) / FL_W;
      flCompact = flCssScale < 0.8;
    }
    // Schriftgroesse in logischen Einheiten: auf schmalen Anzeigen so vergroessert, dass der Text mindestens ca. 11 CSS-Pixel hoch ist.
    function flFs(px, cap) {
      if (!flCompact) return px;
      return px * Math.min(cap || 2.6, Math.max(1, 11 / (px * flCssScale)));
    }
    function flFont(weight, px, family, cap) { return weight + ' ' + flFs(px, cap) + 'px ' + family; }
    // Text mit Hoechstbreite (nur schmale Anzeige staucht, sonst unveraendert)
    function flFill(text, x, y, maxW) {
      if (flCompact && maxW) flCtx.fillText(text, x, y, maxW); else flCtx.fillText(text, x, y);
    }
    // Zeilenumbruch fuer laengere Meldungen (nur schmale Anzeige): liefert Zeilen mit Hoechstbreite
    function flWrap(text, maxW) {
      const words = String(text).split(' '); const lines = []; let cur = '';
      for (const w of words) { const test = cur ? cur + ' ' + w : w; if (cur && flCtx.measureText(test).width > maxW) { lines.push(cur); cur = w; } else cur = test; }
      if (cur) lines.push(cur); return lines;
    }
    const flTruckStat = document.getElementById('fl-truck-stat');
    const flPalletStat = document.getElementById('fl-pallet-stat');
    const flQualityStat = document.getElementById('fl-quality-stat');
    const flScoreStat = document.getElementById('fl-score-stat');

    let flActive = false;
    let flLoopId = null;

    // 5 Authentic Hörmann Pallet Cargo Definitions
    const CARGO_TYPES = {
      schwingtore: {
        id: 'schwingtore',
        name: 'Schwingtore (6er-Pack)',
        shortName: '6er Schwingtore',
        zone: 'A',
        zoneName: 'ZONE A (Tore-Lager)',
        safeKmh: 12.0,
        heightFactor: 1.35, // High center of gravity
        widthSpan: 34,
        depthSpan: 30,
        color: '#2563eb'
      },
      sektionaltore: {
        id: 'sektionaltore',
        name: 'Sektionaltore (Großpalette)',
        shortName: 'Sektionaltor-Pack',
        zone: 'A',
        zoneName: 'ZONE A (Tore-Lager)',
        safeKmh: 14.0,
        heightFactor: 1.05,
        widthSpan: 42, // Wide pallet
        depthSpan: 28,
        color: '#0d448a'
      },
      antriebe: {
        id: 'antriebe',
        name: 'Europalette mit Antrieben',
        shortName: 'EPAL Antriebe',
        zone: 'B',
        zoneName: 'ZONE B (Antriebe/Schienen)',
        safeKmh: 16.0,
        heightFactor: 0.9,
        widthSpan: 28,
        depthSpan: 24,
        color: '#f59c00'
      },
      schienen: {
        id: 'schienen',
        name: 'Führungsschienen (Langgut)',
        shortName: 'Langgut Schienen',
        zone: 'B',
        zoneName: 'ZONE B (Antriebe/Schienen)',
        safeKmh: 13.0,
        heightFactor: 1.1,
        widthSpan: 54, // Extra long!
        depthSpan: 20,
        color: '#10b981'
      },
      stahltueren: {
        id: 'stahltueren',
        name: 'Stahltüren (Hochkant)',
        shortName: 'Stahltüren Hoch',
        zone: 'C',
        zoneName: 'ZONE C (Stahltüren)',
        safeKmh: 11.0,
        heightFactor: 1.5, // Very tall, sensitive in curves!
        widthSpan: 32,
        depthSpan: 26,
        color: '#ef4444'
      }
    };

    // Game State
    let flState = {
      score: 0,
      palletsDelivered: 0,
      totalPalletsInShift: 6,
      qualityHistory: [],
      truckNumber: 1,
      maxTrucks: 2,
      truckPhase: 'DOCKED', // 'DOCKED', 'LEAVING', 'ARRIVING'
      truckSlideX: 0,
      truckTimer: 0,
      shiftComplete: false,
      screenShake: 0,
      warningBanner: '',
      warningTimer: 0
    };

    // Nico's Blue Hörmann Forklift
    let nico = {
      x: 290,
      y: 245,
      angle: Math.PI, // Facing left toward the LKW initially
      speed: 0,       // Internal velocity (-2.2 to +3.75 => mapped to 0..24 km/h)
      maxFwdSpeed: 3.75,
      maxRevSpeed: -2.1,
      kmh: 0,
      mastLevel: 1,   // 1 = Boden (Ebene 1), 2 = Hochstapel (Ebene 2)
      forkZ: 2,       // Animated visual height (2 = down, 24 = high stack)
      cargo: null,    // Currently carried pallet object
      wobbleAngle: 0, // Centrifugal curve tilt
      wobbleWarning: false,
      collisionCooldown: 0,
      hornCooldown: 0
    };

    let flKeys = { up: false, down: false, left: false, right: false };
    let lkwPallets = [];
    let storageBays = [];
    let skidMarks = [];
    let flFloatingTexts = [];
    let flParticles = [];
    let oilSpill = null;

    function initForkliftLevel() {
      flState = {
        score: 0,
        palletsDelivered: 0,
        totalPalletsInShift: 6,
        qualityHistory: [],
        truckNumber: 1,
        maxTrucks: 2,
        truckPhase: 'DOCKED',
        truckSlideX: 0,
        truckTimer: 0,
        shiftComplete: false,
        screenShake: 0,
        warningBanner: '',
        warningTimer: 0
      };

      nico = {
        x: 295,
        y: 245,
        angle: Math.PI,
        speed: 0,
        maxFwdSpeed: 3.75,
        maxRevSpeed: -2.1,
        kmh: 0,
        mastLevel: 1,
        forkZ: 2,
        cargo: null,
        wobbleAngle: 0,
        wobbleWarning: false,
        collisionCooldown: 0,
        hornCooldown: 0
      };

      skidMarks = [];
      flFloatingTexts = [];
      flParticles = [];

      // Create an interactive warehouse floor obstacle (can be honked away with H!)
      oilSpill = {
        x: 430,
        y: 280,
        r: 22,
        active: true,
        label: 'Ölfleck (Hupe [H] für Azubi!)'
      };

      // Initialize the 6 wide storage bays across 3 Zones (Level 1: Wide, generous spacing)
      // Notice: Some bays start at 1/2 so Nico gets to use high-stacking (Ebene 2) right away!
      storageBays = [
        {
          id: 'A1', zone: 'A', label: 'TOR-FACH A1',
          x: 230, y: 44, w: 112, h: 66,
          targetAngle: -Math.PI / 2, // Facing up into rack
          items: [{ type: 'schwingtore', condition: 100 }], // 1/2 occupied -> next must be stacked on Level 2!
          maxItems: 2
        },
        {
          id: 'A2', zone: 'A', label: 'TOR-FACH A2',
          x: 358, y: 44, w: 112, h: 66,
          targetAngle: -Math.PI / 2,
          items: [], // 0/2 empty -> Level 1 floor
          maxItems: 2
        },
        {
          id: 'B1', zone: 'B', label: 'ANTRIEBE B1',
          x: 612, y: 62, w: 120, h: 68,
          targetAngle: 0, // Facing right into rack
          items: [], // 0/2 empty -> Level 1 floor
          maxItems: 2
        },
        {
          id: 'B2', zone: 'B', label: 'LANGGUT B2',
          x: 612, y: 142, w: 120, h: 68,
          targetAngle: 0,
          items: [{ type: 'antriebe', condition: 100 }], // 1/2 occupied -> Level 2 high-stack!
          maxItems: 2
        },
        {
          id: 'C1', zone: 'C', label: 'TÜREN C1',
          x: 612, y: 240, w: 120, h: 66,
          targetAngle: 0,
          items: [{ type: 'stahltueren', condition: 100 }], // 1/2 occupied -> Level 2 high-stack!
          maxItems: 2
        },
        {
          id: 'C2', zone: 'C', label: 'TÜREN C2',
          x: 612, y: 318, w: 120, h: 66,
          targetAngle: 0,
          items: [], // 0/2 empty -> Level 1 floor
          maxItems: 2
        }
      ];

      spawnTruckPallets(1);
      updateForkliftHUD();
    }

    function spawnTruckPallets(truckNum) {
      // Truck 1 brings: Schwingtore (6er-Pack), Europalette Antriebe, Stahltüren (Hochkant)
      // Truck 2 brings: Sektionaltore (Großpalette), Führungsschienen (Langgut), Stahltüren / Antriebe
      const manifest = (truckNum === 1)
        ? ['schwingtore', 'antriebe', 'stahltueren']
        : ['sektionaltore', 'schienen', 'stahltueren'];

      const slotYs = [186, 244, 302];
      lkwPallets = manifest.map((typeKey, idx) => ({
        slotIndex: idx,
        x: 136,
        y: slotYs[idx],
        type: typeKey,
        condition: 100.0,
        pickupTime: 0
      }));
    }

    function updateForkliftHUD() {
      flTruckStat.textContent = `${flState.truckNumber} / ${flState.maxTrucks}`;
      flPalletStat.textContent = `${flState.palletsDelivered} / ${flState.totalPalletsInShift}`;

      let avgQ = 100.0;
      if (flState.qualityHistory.length > 0) {
        const sum = flState.qualityHistory.reduce((a, b) => a + b, 0);
        avgQ = sum / flState.qualityHistory.length;
      } else if (nico.cargo) {
        avgQ = nico.cargo.condition;
      }
      flQualityStat.textContent = `${avgQ.toFixed(1)}%`;
      flScoreStat.textContent = flState.score;
    }

    function startForkliftGame() {
      initForkliftLevel();
      flReleaseAllKeys();
      scoreSubmitDialog.classList.remove('show');
      highscoreCard.classList.remove('show');
      flActive = true;
      if (flLoopId) cancelAnimationFrame(flLoopId);
      HoermannGameClock.reset("flLoop");
      flLoop();
      playSound('horn');
    }

    function stopForkliftGame() {
      flActive = false;
      if (flLoopId) cancelAnimationFrame(flLoopId);
    }

    document.getElementById('restart-forklift-btn').addEventListener('click', startForkliftGame);
    document.getElementById('fl-finish-shift-btn').addEventListener('click', () => {
      if (flState.score <= 0) {
        showToast('Staple erst mindestens eine Palette ins Lager, bevor du abrechnest! 🚜');
        return;
      }
      finishForkliftShift(false);
    });

    // Keyboard Controls for Forklift
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (forkliftView.style.display === 'none') return;
      const flOneShot = ['Space', 'KeyE', 'ShiftLeft', 'ShiftRight', 'KeyH'].includes(e.code);
      if (flOneShot && e.repeat) { e.preventDefault(); return; } // Halten der Taste soll nicht dauernd umschalten

      if (e.code === 'KeyW' || e.code === 'ArrowUp') { flKeys.up = true; e.preventDefault(); }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') { flKeys.down = true; e.preventDefault(); }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') { flKeys.left = true; e.preventDefault(); }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') { flKeys.right = true; e.preventDefault(); }

      if (e.code === 'Space') {
        e.preventDefault();
        handleForkliftAction();
      }
      if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        toggleForkliftMast();
      }
      if (e.code === 'KeyH') {
        e.preventDefault();
        triggerForkliftHorn();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') flKeys.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') flKeys.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') flKeys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') flKeys.right = false;
    });

    function flReleaseAllKeys() { flKeys.up = flKeys.down = flKeys.left = flKeys.right = false; }
    window.addEventListener('blur', flReleaseAllKeys);
    document.addEventListener('visibilitychange', flReleaseAllKeys);

    // Touch / Button bindings for Forklift
    ['fl-btn-left', 'fl-btn-right', 'fl-btn-up', 'fl-btn-down'].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', (ev) => { try { el.setPointerCapture(ev.pointerId); } catch (_) {} });
      el.addEventListener('contextmenu', (ev) => ev.preventDefault());
    });
    bindTouch(document.getElementById('fl-btn-left'), () => { flKeys.left = true; }, () => { flKeys.left = false; });
    bindTouch(document.getElementById('fl-btn-right'), () => { flKeys.right = true; }, () => { flKeys.right = false; });
    bindTouch(document.getElementById('fl-btn-up'), () => { flKeys.up = true; }, () => { flKeys.up = false; });
    bindTouch(document.getElementById('fl-btn-down'), () => { flKeys.down = true; }, () => { flKeys.down = false; });

    document.getElementById('fl-btn-action').addEventListener('click', handleForkliftAction);
    document.getElementById('fl-btn-mast').addEventListener('click', toggleForkliftMast);
    document.getElementById('fl-btn-horn').addEventListener('click', triggerForkliftHorn);

    function toggleForkliftMast() {
      if (flState.shiftComplete) return;
      nico.mastLevel = (nico.mastLevel === 1) ? 2 : 1;
      playSound('hydraulic');
      const label = nico.mastLevel === 2 ? '⬆️ GABEL AUF EBENE 2 (HOCHSTAPEL)' : '⬇️ GABEL AUF EBENE 1 (BODEN)';
      flFloatingTexts.push({
        x: nico.x,
        y: nico.y - 34,
        text: label,
        color: nico.mastLevel === 2 ? '#38bdf8' : '#10b981',
        alpha: 1.2
      });
    }

    function triggerForkliftHorn() {
      if (flState.shiftComplete || nico.hornCooldown > 0) return;
      nico.hornCooldown = 25;
      playSound('horn');
      flFloatingTexts.push({
        x: nico.x,
        y: nico.y - 38,
        text: '📯 MÖÖÖP! FREIE BAHN FÜR NICO!',
        color: '#f59c00',
        alpha: 1.2
      });

      // If near oil spill, Azubi Kevin cleans it up for a Mut-Bonus!
      if (oilSpill && oilSpill.active && Math.hypot(nico.x - oilSpill.x, nico.y - oilSpill.y) < 150) {
        oilSpill.active = false;
        flState.score += 120;
        playSound('coin');
        flFloatingTexts.push({
          x: oilSpill.x,
          y: oilSpill.y - 15,
          text: '🧹 AZUBI KEVIN HAT GEWISCHT! +120 MUT-PKT',
          color: '#10b981',
          alpha: 1.5
        });
        updateForkliftHUD();
      }
    }

    function handleForkliftAction() {
      if (flState.shiftComplete) return;

      const forkReach = 28;
      const forkX = nico.x + Math.cos(nico.angle) * forkReach;
      const forkY = nico.y + Math.sin(nico.angle) * forkReach;

      // CASE 1: NOT CARRYING CARGO -> TRY TO PICK UP FROM LKW
      if (!nico.cargo) {
        if (flState.truckPhase !== 'DOCKED') {
          showForkliftWarning('⏳ Warte kurz, bis der nächste Hörmann-LKW angedockt hat!');
          return;
        }

        if (nico.kmh > 6.5) {
          showForkliftWarning('⚠️ Zu schnell zum Aufnehmen! Bremse vor der Palette ab!');
          playSound('bump');
          return;
        }

        // Find closest pallet on LKW
        let bestIdx = -1;
        let bestDist = 46;
        for (let i = 0; i < lkwPallets.length; i++) {
          const p = lkwPallets[i];
          const d = Math.hypot(forkX - p.x, forkY - p.y);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }

        if (bestIdx !== -1) {
          const picked = lkwPallets.splice(bestIdx, 1)[0];
          const cInfo = CARGO_TYPES[picked.type];
          nico.cargo = {
            type: picked.type,
            condition: picked.condition,
            pickupTime: flState.ticks || 0
          };
          playSound('hydraulic');
          flFloatingTexts.push({
            x: nico.x,
            y: nico.y - 36,
            text: `📦 ${cInfo.shortName} AUFGENOMMEN! ➔ ${cInfo.zoneName}`,
            color: '#f59c00',
            alpha: 1.5
          });
          updateForkliftHUD();
        } else {
          showForkliftWarning('💡 Fahre mit der Gabel nah an eine Palette auf dem LKW heran!');
          playSound('bump');
        }
        return;
      }

      // CASE 2: CARRYING CARGO -> TRY TO PLACE IN STORAGE BAY
      if (nico.kmh > 6.5) {
        showForkliftWarning('⚠️ Zum Absetzen fast stillstehen (< 6 km/h)!');
        playSound('bump');
        return;
      }

      const cInfo = CARGO_TYPES[nico.cargo.type];

      // Find bay under fork tip
      let targetBay = null;
      for (let b of storageBays) {
        if (forkX >= b.x - 12 && forkX <= b.x + b.w + 12 &&
            forkY >= b.y - 12 && forkY <= b.y + b.h + 12) {
          targetBay = b;
          break;
        }
      }

      if (!targetBay) {
        showForkliftWarning(`📍 Fahre die Ladung in ${cInfo.zoneName} zum Absetzen!`);
        playSound('bump');
        return;
      }

      // Check correct Zone
      if (targetBay.zone !== cInfo.zone) {
        showForkliftWarning(`❌ Falsches Lagerregal! ${cInfo.shortName} gehört in ${cInfo.zoneName}!`);
        playSound('alarm');
        return;
      }

      // Check capacity (Max 2 per bay)
      if (targetBay.items.length >= targetBay.maxItems) {
        showForkliftWarning(`🚫 ${targetBay.label} ist bereits VOLL (2/2)! Nutze das Nachbarfach!`);
        playSound('alarm');
        return;
      }

      // Check required mast height (Ebene 1 if 0 items, Ebene 2 if 1 item already in bay!)
      const requiredMast = targetBay.items.length + 1; // 1 or 2
      if (nico.mastLevel !== requiredMast) {
        if (requiredMast === 2) {
          showForkliftWarning('⬆️ Unten steht schon Ware (1/2)! Drücke [E] zum HOCHSTAPELN auf Ebene 2!');
        } else {
          showForkliftWarning('⬇️ Fach ist leer (0/2)! Senke den Mast mit [E] auf Ebene 1 (Boden)!');
        }
        // Tiny hesitation penalty on condition so 100% requires knowing the mast level beforehand
        if (!nico.cargo.lastHesitation || (flState.ticks - nico.cargo.lastHesitation) > 90) {
          nico.cargo.condition = Math.max(10, nico.cargo.condition - 0.8);
          nico.cargo.lastHesitation = flState.ticks;
          updateForkliftHUD();
        }
        playSound('bump');
        return;
      }

      // SUCCESSFUL PLACEMENT! Calculate Precision, Time & Condition Score
      const bayCenterX = targetBay.x + targetBay.w / 2;
      const bayCenterY = targetBay.y + targetBay.h / 2;
      const distOffset = Math.hypot(forkX - bayCenterX, forkY - bayCenterY);

      // Angle alignment difference
      let angleDiff = Math.abs(Math.atan2(Math.sin(nico.angle - targetBay.targetAngle), Math.cos(nico.angle - targetBay.targetAngle)));
      // Precision percentage (100% requires < 2px offset and < 1 degree angle diff -> nearly impossible to get 100.0%!)
      const posPrecision = Math.max(55, 100 - distOffset * 0.72);
      const angPrecision = Math.max(55, 100 - (angleDiff * 180 / Math.PI) * 0.65);
      const placementPrecision = (posPrecision * 0.6 + angPrecision * 0.4);

      // Delivery duration factor (Optimal under 11.5 seconds)
      const elapsedSec = ((flState.ticks || 0) - nico.cargo.pickupTime) / 60; // Spielzeit, pausiert mit dem Spiel
      const timeEfficiency = elapsedSec <= 14 ? 100 : Math.max(70, 100 - (elapsedSec - 14) * 1.2);

      const condPct = nico.cargo.condition;
      // Weighted total quality for this pallet (Max = 100.0%)
      const totalQualityPct = (condPct * 0.52) + (placementPrecision * 0.33) + (timeEfficiency * 0.15);
      const highStackBonus = (requiredMast === 2) ? 100 : 0;
      const palletScore = Math.round(1500 * (totalQualityPct / 100)) + highStackBonus;

      targetBay.items.push({
        type: nico.cargo.type,
        condition: condPct
      });

      flState.score += palletScore;
      flState.palletsDelivered++;
      flState.qualityHistory.push(totalQualityPct);
      nico.cargo = null;

      playSound('powerup');
      flFloatingTexts.push({
        x: bayCenterX,
        y: bayCenterY - 20,
        text: `✅ +${palletScore} PKT (${totalQualityPct.toFixed(1)}% QUALITÄT${requiredMast === 2 ? ' +STAPELBONUS' : ''})`,
        color: '#10b981',
        alpha: 1.8
      });

      updateForkliftHUD();

      // Check if LKW is now completely unloaded AND Nico has no cargo
      if (lkwPallets.length === 0) {
        if (flState.palletsDelivered >= flState.totalPalletsInShift) {
          // Shift complete!
          HoermannGameSession.delay(() => finishForkliftShift(true), 700);
        } else {
          // Trigger LKW departure & arrival of next LKW!
          flState.truckPhase = 'LEAVING';
          flState.truckTimer = 0;
          flState.score += 300; // LKW Unload Bonus
          updateForkliftHUD();
          playSound('horn');
          showForkliftWarning('🚛 LKW 1 leer! Er fährt ab & der nächste Hörmann-LKW rückt an! (+300 Pkt)');
        }
      }
    }

    function showForkliftWarning(msg) {
      flState.warningBanner = msg;
      flState.warningTimer = 170;
    }

    function finishForkliftShift(completedAll) {
      if (flState.shiftComplete) return;
      flState.shiftComplete = true;
      playSound('victory');
      triggerParticleEffect('confetti');

      const avgQ = flState.qualityHistory.length > 0
        ? (flState.qualityHistory.reduce((a, b) => a + b, 0) / flState.qualityHistory.length).toFixed(1)
        : '0.0';

      HoermannGameSession.delay(() => {
        promptScoreSubmit(
          flState.score,
          'forklift_v02',
          `Lagermeister Nico 0.2 (${avgQ}% Präzision)`
        );
      }, 1100);
    }

    function flLoop(frameTime) {
      if (!(flActive)) return;
      HoermannGameClock.run("flLoop", frameTime, () => {
      if (!flActive) return;
      updateForkliftPhysics();
      drawForkliftScene();

      });
      if (flActive) flLoopId = requestAnimationFrame(flLoop);
    }

    function updateForkliftPhysics() {
      if (flState.shiftComplete) return;
      flState.ticks = (flState.ticks || 0) + 1;

      // Smoothly animate fork height
      const targetZ = (nico.mastLevel === 2) ? 24 : 2;
      nico.forkZ += (targetZ - nico.forkZ) * 0.16;

      if (nico.collisionCooldown > 0) nico.collisionCooldown--;
      if (nico.hornCooldown > 0) nico.hornCooldown--;
      if (flState.warningTimer > 0) flState.warningTimer--;
      if (flState.screenShake > 0) flState.screenShake *= 0.82;

      // LKW Departure & Arrival Animation State Machine
      if (flState.truckPhase === 'LEAVING') {
        flState.truckTimer++;
        flState.truckSlideX -= 2.4;
        if (flState.truckTimer % 12 === 0) {
          flParticles.push({
            x: 110 + flState.truckSlideX,
            y: 162,
            vx: -1.5,
            vy: -0.8,
            size: 9,
            color: '#94a3b8',
            alpha: 0.85
          });
        }
        if (flState.truckSlideX < -165) {
          flState.truckNumber++;
          spawnTruckPallets(flState.truckNumber);
          flState.truckPhase = 'ARRIVING';
          flState.truckTimer = 0;
          updateForkliftHUD();
        }
      } else if (flState.truckPhase === 'ARRIVING') {
        flState.truckTimer++;
        if (flState.truckTimer % 28 === 0) playSound('beep');
        flState.truckSlideX += 2.1;
        if (flState.truckSlideX >= 0) {
          flState.truckSlideX = 0;
          flState.truckPhase = 'DOCKED';
          playSound('hydraulic');
          showForkliftWarning('🚛 Neuer Hörmann-LKW angedockt! Tore auf & ausladen!');
        }
      }

      // Acceleration & Braking
      const prevSpeed = nico.speed;
      if (flKeys.up) {
        nico.speed += 0.085;
        if (nico.speed > nico.maxFwdSpeed) nico.speed = nico.maxFwdSpeed;
      } else if (flKeys.down) {
        // Hard braking check when carrying cargo at high speed
        if (nico.speed > 2.6 && nico.cargo) {
          nico.cargo.condition = Math.max(0, nico.cargo.condition - 0.1);
          nico.wobbleAngle = (Math.random() - 0.5) * 0.35;
          showForkliftWarning('⚠️ VOLLBREMSUNG! Ladung verrutscht auf der Gabel!');
          updateForkliftHUD();
        }
        nico.speed -= 0.11;
        if (nico.speed < nico.maxRevSpeed) nico.speed = nico.maxRevSpeed;
      } else {
        nico.speed *= 0.94;
        if (Math.abs(nico.speed) < 0.03) nico.speed = 0;
      }

      // Convert internal speed to realistic Forklift km/h (0.0 to 24.0 km/h)
      nico.kmh = Math.abs(nico.speed) * 6.4;

      // Steering (Rear-wheel forklift agility)
      let turnInput = 0;
      if (flKeys.left) turnInput = -1;
      if (flKeys.right) turnInput = 1;

      // Oil spill slip check
      if (oilSpill && oilSpill.active && Math.hypot(nico.x - oilSpill.x, nico.y - oilSpill.y) < oilSpill.r + 14) {
        if (nico.kmh > 7) {
          turnInput += Math.sin(performance.now() * 0.02) * 1.4;
          showForkliftWarning('🛢️ ÖLFLECK-RUTSCHER! Drücke [H] Hupe, damit Azubi Kevin wischt!');
        }
      }

      const speedFactor = Math.min(1, Math.abs(nico.speed) / 0.6);
      const reverseDir = nico.speed >= -0.05 ? 1 : -1;
      const angularVel = turnInput * 0.046 * (0.35 + 0.65 * speedFactor) * reverseDir;
      nico.angle += angularVel;

      // CURVE SPEED & MAST HEIGHT STABILITY PHYSICS
      nico.wobbleWarning = false;
      if (nico.cargo) {
        const cInfo = CARGO_TYPES[nico.cargo.type];
        // If mast is raised to Level 2 during driving, safe curve speed drops by 35%!
        const effectiveSafeKmh = (nico.mastLevel === 2) ? cInfo.safeKmh * 0.65 : cInfo.safeKmh;

        if (Math.abs(turnInput) > 0 && nico.kmh > effectiveSafeKmh) {
          const overspeed = nico.kmh - effectiveSafeKmh;
          const damageRate = overspeed * 0.032 * cInfo.heightFactor * (nico.mastLevel === 2 ? 1.5 : 1.0);
          nico.cargo.condition = Math.max(0, nico.cargo.condition - damageRate);
          nico.wobbleAngle = Math.sin(performance.now() * 0.035) * Math.min(0.45, overspeed * 0.045);
          nico.wobbleWarning = true;

          if (nico.mastLevel === 2) {
            showForkliftWarning('🚨 GABEL OBEN IN DER KURVE! Kippgefahr! Mast senken mit [E]!');
          } else {
            showForkliftWarning(`🚨 ZU SCHNELL FÜR KURVE (${nico.kmh.toFixed(0)} km/h > Max ${cInfo.safeKmh} km/h)! Ware nimmt Schaden!`);
          }
          updateForkliftHUD();

          // Leave tire skid marks in fast corners
          if (Math.random() < 0.45) {
            skidMarks.push({ x: nico.x, y: nico.y, alpha: 0.45 });
            if (skidMarks.length > 90) skidMarks.shift();
          }
        } else {
          nico.wobbleAngle *= 0.82;
        }
      } else {
        nico.wobbleAngle *= 0.8;
      }

      // Move Forklift X & Y
      const nextX = nico.x + Math.cos(nico.angle) * nico.speed;
      const nextY = nico.y + Math.sin(nico.angle) * nico.speed;

      // Check Collisions with Warehouse Walls, LKW Cab/Body, and Rack Uprights
      let collided = false;
      let hitLabel = '';

      // 1. Outer Warehouse Walls
      if (nextX < 42 || nextX > 746 || nextY < 42 || nextY > 374) {
        collided = true;
        hitLabel = 'HALLENSÄULE TOUCHIERT!';
      }

      // 2. LKW Solid Body (x: 16..118, y: 155..345) - Note: 118..158 is the accessible loading tail!
      if (flState.truckPhase === 'DOCKED' && nextX < 120 && nextY > 152 && nextY < 348) {
        collided = true;
        hitLabel = 'GEGEN LKW GEPRALLT!';
      }

      // 3. Floor-level pallet collision inside bays if Nico drives in with Mast Level 1 while bay already has 1 item!
      const forkTipX = nextX + Math.cos(nico.angle) * 26;
      const forkTipY = nextY + Math.sin(nico.angle) * 26;
      for (let b of storageBays) {
        if (b.items.length >= 1 && nico.mastLevel === 1 && nico.cargo) {
          if (forkTipX > b.x + 12 && forkTipX < b.x + b.w - 12 &&
              forkTipY > b.y + 12 && forkTipY < b.y + b.h - 12) {
            collided = true;
            hitLabel = 'BODENFACH BELEGT! [E] FÜR EBENE 2!';
          }
        }
      }

      if (collided) {
        const impactKmh = nico.kmh;
        nico.speed = -nico.speed * 0.45; // Bounce back

        if (nico.collisionCooldown === 0 && impactKmh > 2.5) {
          nico.collisionCooldown = 28;
          flState.screenShake = Math.min(10, impactKmh * 0.55);
          playSound('crunch');

          // Spawn impact sparks
          for (let s = 0; s < 10; s++) {
            flParticles.push({
              x: forkTipX,
              y: forkTipY,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              size: 4,
              color: '#f59c00',
              alpha: 1
            });
          }

          if (nico.cargo) {
            const dmg = Math.max(2.5, impactKmh * 0.85);
            nico.cargo.condition = Math.max(0, nico.cargo.condition - dmg);
            flFloatingTexts.push({
              x: nico.x,
              y: nico.y - 35,
              text: `💥 ${hitLabel} -${dmg.toFixed(1)}% ZUSTAND`,
              color: '#ef4444',
              alpha: 1.5
            });
            updateForkliftHUD();
          } else {
            flFloatingTexts.push({
              x: nico.x,
              y: nico.y - 35,
              text: `💥 ${hitLabel}`,
              color: '#f59c00',
              alpha: 1.2
            });
          }
        }
      } else {
        nico.x = nextX;
        nico.y = nextY;
      }

      // Check if cargo reached 0% condition (destroyed)
      if (nico.cargo && nico.cargo.condition <= 0) {
        playSound('alarm');
        flFloatingTexts.push({
          x: nico.x,
          y: nico.y - 40,
          text: '💔 WARE TOTALSCHADEN! ERSATZPALETTE BEREIT!',
          color: '#ef4444',
          alpha: 1.8
        });
        // Respawn replacement on LKW with penalty
        const flFreeY = [186, 244, 302].find(y => !lkwPallets.some(q => Math.abs(q.y - y) < 20)) || 244;
        lkwPallets.push({
          slotIndex: 0,
          x: 136,
          y: flFreeY,
          type: nico.cargo.type,
          condition: 85.0,
          pickupTime: 0
        });
        nico.cargo = null;
        flState.score = Math.max(0, flState.score - 250);
        updateForkliftHUD();
      }
    }

    // 2.5D Isometric Box Helper (Clean Pixel-Art Extrusion)
    function drawIsoBox(ctx, x, y, w, h, zBase, zHeight, topColor, frontColor, sideColor) {
      const isoX = Math.round(x);
      const isoY = Math.round(y - zBase);
      const hZ = Math.round(zHeight);

      // Drop shadow if elevated
      if (zBase > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.fillRect(Math.round(x + 3), Math.round(y + 3), Math.round(w), Math.round(h));
      }

      // Front face (south)
      ctx.fillStyle = frontColor;
      ctx.fillRect(isoX, isoY + h - hZ, w, hZ);

      // Top face
      ctx.fillStyle = topColor;
      ctx.fillRect(isoX, isoY - hZ, w, h);

      // Crisp pixel highlight & outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(isoX, isoY - hZ, w, h);
    }

    // Detailed Pixel-Art Renderer for all 5 Hörmann Pallet Types
    function drawHoermannPallet(ctx, typeKey, cx, cy, zOffset, angleRad, wobbleRad, conditionPct) {
      ctx.save();
      ctx.translate(Math.round(cx), Math.round(cy - zOffset));
      ctx.rotate(angleRad + wobbleRad);

      // 1. Wooden / Steel Euro-Pallet Base
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-16, -14, 32, 28);
      ctx.fillStyle = '#d97706';
      for (let slat = -12; slat <= 8; slat += 6) {
        ctx.fillRect(-15, slat, 30, 4);
      }

      if (typeKey === 'schwingtore') {
        // 6er-Pack Stehende Schwingtore in blauem Stahl-Transportgestell
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(-17, -15, 34, 4);
        ctx.fillRect(-17, 11, 34, 4);
        // 6 upright white/silver Berry Schwingtore with grooves
        for (let i = 0; i < 6; i++) {
          const py = -10 + i * 3.5;
          ctx.fillStyle = (i % 2 === 0) ? '#f8fafc' : '#cbd5e1';
          ctx.fillRect(-15, py, 30, 2.8);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-12, py + 0.8, 24, 1);
        }
        // Orange Hörmann securing strap across top
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(-3, -15, 6, 30);
      } else if (typeKey === 'sektionaltore') {
        // Größere Palette Sektionaltore (Breit, Anthrazit-Silber Lamellen-Paket)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-18, -21, 36, 42);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-16, -19, 32, 38);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-14, -17, 28, 34);
        // Yellow packing straps
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(-16, -9, 32, 3);
        ctx.fillRect(-16, 6, 32, 3);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SEKTIONAL', 0, 1);
      } else if (typeKey === 'antriebe') {
        // Europalette mit Antrieben (SupraMatic / ProMatic Kartons)
        const boxes = [
          [-13, -11, 12, 10], [1, -11, 12, 10],
          [-13, 1, 12, 10], [1, 1, 12, 10]
        ];
        boxes.forEach(([bx, by, bw, bh]) => {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(bx, by, bw, bh);
          ctx.fillStyle = '#002d62';
          ctx.fillRect(bx + 1, by + 1, bw - 2, 3);
          ctx.fillStyle = '#f59c00';
          ctx.fillRect(bx + 2, by + 5, bw - 4, 3);
        });
      } else if (typeKey === 'schienen') {
        // Lange Führungsschienen von Antrieben (ragen weit heraus + rote Warnfähnchen!)
        ctx.fillStyle = '#94a3b8';
        for (let r = -9; r <= 6; r += 5) {
          ctx.fillRect(-14, -27, 4, 54);
          ctx.fillRect(-6, -27, 4, 54);
          ctx.fillRect(2, -27, 4, 54);
          ctx.fillRect(10, -27, 4, 54);
        }
        // Galvanized rail shine & orange straps
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(-15, -10, 30, 3);
        ctx.fillRect(-15, 8, 30, 3);
        // Red long-load safety flags at both ends
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-14, -29, 28, 4);
        ctx.fillRect(-14, 25, 28, 4);
      } else if (typeKey === 'stahltueren') {
        // Hohe Stahltüren (ZK / Feuerschutz) mit orangen Kantenschützern & Sichtfenster
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-15, -14, 30, 28);
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(-13, -12, 26, 24);
        // Glazing window in door
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-5, -6, 10, 12);
        ctx.strokeStyle = '#002d62';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-5, -6, 10, 12);
        // Orange corner protectors
        ctx.fillStyle = '#f59c00';
        ctx.fillRect(-16, -15, 7, 7);
        ctx.fillRect(9, -15, 7, 7);
        ctx.fillRect(-16, 8, 7, 7);
        ctx.fillRect(9, 8, 7, 7);
      }

      // Condition bar floating if damaged
      if (conditionPct < 99.9) {
        ctx.rotate(-(angleRad + wobbleRad));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(-18, -26, 36, 6);
        ctx.fillStyle = conditionPct > 80 ? '#10b981' : (conditionPct > 50 ? '#f59c00' : '#ef4444');
        ctx.fillRect(-17, -25, Math.max(0, 34 * (conditionPct / 100)), 4);
      }

      ctx.restore();
    }

    function drawForkliftScene() {
      flFitCanvas();
      flCtx.setTransform(flDpr, 0, 0, flDpr, 0, 0);
      flCtx.save();

      // Screen shake on collision
      if (flState.screenShake > 0.4) {
        flCtx.translate(
          (Math.random() - 0.5) * flState.screenShake,
          (Math.random() - 0.5) * flState.screenShake
        );
      }

      // 1. WAREHOUSE CONCRETE FLOOR (Pixel-Art Industrial Tile Grid)
      flCtx.fillStyle = '#334155';
      flCtx.fillRect(0, 0, FL_W, 392);

      // Concrete tile seams
      flCtx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
      flCtx.lineWidth = 1;
      for (let gx = 0; gx < FL_W; gx += 40) {
        flCtx.beginPath();
        flCtx.moveTo(gx, 32);
        flCtx.lineTo(gx, 392);
        flCtx.stroke();
      }
      for (let gy = 32; gy < 392; gy += 40) {
        flCtx.beginPath();
        flCtx.moveTo(0, gy);
        flCtx.lineTo(FL_W, gy);
        flCtx.stroke();
      }

      // Yellow safety lane markings on floor
      flCtx.strokeStyle = 'rgba(245, 156, 0, 0.45)';
      flCtx.lineWidth = 2;
      flCtx.setLineDash([10, 8]);
      flCtx.strokeRect(175, 122, 415, 250);
      flCtx.setLineDash([]);

      // Tire skid marks
      skidMarks.forEach(sm => {
        flCtx.fillStyle = `rgba(15, 23, 42, ${sm.alpha})`;
        flCtx.fillRect(Math.round(sm.x - 4), Math.round(sm.y - 4), 8, 8);
      });

      // Oil spill obstacle (if active)
      if (oilSpill && oilSpill.active) {
        flCtx.fillStyle = '#0f172a';
        flCtx.beginPath();
        flCtx.ellipse(oilSpill.x, oilSpill.y, oilSpill.r, oilSpill.r * 0.68, 0.2, 0, Math.PI * 2);
        flCtx.fill();
        flCtx.fillStyle = '#38bdf8';
        flCtx.globalAlpha = 0.25;
        flCtx.beginPath();
        flCtx.ellipse(oilSpill.x - 4, oilSpill.y - 2, oilSpill.r * 0.5, oilSpill.r * 0.3, 0.2, 0, Math.PI * 2);
        flCtx.fill();
        flCtx.globalAlpha = 1;

        flCtx.fillStyle = '#cbd5e1';
        flCtx.font = flFont('bold', 9, 'Inter, sans-serif');
        flCtx.textAlign = 'center';
        flFill(flCompact ? '🛢️ Ölfleck: Hupe!' : '🛢️ Ölfleck ([H] Hupen!)', oilSpill.x, oilSpill.y + 24, 200);
      }

      // 2. WAREHOUSE PERIMETER WALLS & HEADER BANNER
      drawIsoBox(flCtx, 0, 0, FL_W, 32, 0, 14, '#002d62', '#001f3b', '#001830');
      flCtx.fillStyle = '#f59c00';
      flCtx.font = flFont('900', 11, 'Inter, sans-serif');
      flCtx.textAlign = 'center';
      if (!flCompact) flCtx.fillText('HÖRMANN LOGISTIK-HALLE 1 // LAGERMEISTER NICO MALOCHT: MIT MUT AM MAST', FL_W / 2, 16); // schmale Anzeige: reine Zierschrift weglassen

      // 3. STORAGE BAYS (ZONES A, B, C) WITH 2 STACK LEVELS (BODEN & HOCHREGAL)
      const activeTargetZone = nico.cargo ? CARGO_TYPES[nico.cargo.type].zone : null;

      storageBays.forEach(b => {
        const isTargetZone = (activeTargetZone === b.zone);
        const isFull = b.items.length >= b.maxItems;
        const pulse = Math.sin(performance.now() * 0.008) * 0.5 + 0.5;

        // Floor Bay Stencil
        flCtx.fillStyle = isFull
          ? 'rgba(239, 68, 68, 0.16)'
          : (isTargetZone ? `rgba(16, 185, 129, ${0.18 + pulse * 0.18})` : 'rgba(15, 23, 42, 0.35)');
        flCtx.fillRect(b.x, b.y, b.w, b.h);

        // Bay border (Orange/Blue heavy-duty rack uprights)
        flCtx.strokeStyle = isFull
          ? '#ef4444'
          : (isTargetZone ? '#10b981' : '#f59c00');
        flCtx.lineWidth = (isTargetZone && !isFull) ? 3 : 2;
        flCtx.strokeRect(b.x, b.y, b.w, b.h);

        // 2.5D Heavy-Duty Rack Uprights & Orange Traverse Beams
        drawIsoBox(flCtx, b.x - 4, b.y - 2, 8, 8, 0, 32, '#2563eb', '#1e3a8a', '#172554');
        drawIsoBox(flCtx, b.x + b.w - 4, b.y - 2, 8, 8, 0, 32, '#2563eb', '#1e3a8a', '#172554');

        // Draw stored pallets inside this bay (Level 1 Floor at z=2, Level 2 High-Stack at z=22)
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2 + 4;

        if (b.items[0]) {
          drawHoermannPallet(flCtx, b.items[0].type, cx, cy, 2, b.targetAngle, 0, 100);
        }

        // Upper rack orange traverse bar (Ebene 2 shelf frame)
        flCtx.fillStyle = 'rgba(245, 156, 0, 0.85)';
        flCtx.fillRect(b.x, b.y - 18, b.w, 4);

        if (b.items[1]) {
          drawHoermannPallet(flCtx, b.items[1].type, cx, cy, 22, b.targetAngle, 0, 100);
        }

        // Bay Label & Fill Status Badge (0/2, 1/2 -> STAPELN, 2/2 VOLL)
        let statusText = `${b.items.length}/2 FREI (Ebene 1)`;
        let badgeBg = '#0f172a';
        let badgeColor = '#38bdf8';

        if (b.items.length === 1) {
          statusText = '1/2 ⬆ STAPELN [E]';
          badgeColor = '#f59c00';
        } else if (b.items.length >= 2) {
          statusText = '2/2 FACH VOLL!';
          badgeColor = '#ef4444';
        }

        if (flCompact) { // schmale Anzeige: kurzer Text, hoeheres Schild
          statusText = b.items.length >= 2 ? 'VOLL' : (b.items.length === 1 ? '1/2 [E]' : 'FREI');
        }
        flCtx.fillStyle = badgeBg;
        if (flCompact) flCtx.fillRect(b.x + 4, b.y + b.h - 27, b.w - 8, 25); else flCtx.fillRect(b.x + 4, b.y + b.h - 17, b.w - 8, 15);
        flCtx.fillStyle = badgeColor;
        flCtx.font = flFont('800', 9, 'Inter, sans-serif');
        flCtx.textAlign = 'center';
        flFill(`${b.id}: ${statusText}`, b.x + b.w / 2, b.y + b.h - (flCompact ? 9 : 6), b.w - 10);
      });

      // Zone Header Signs
      flCtx.fillStyle = '#ffffff';
      flCtx.font = flFont('900', 10, 'Inter, sans-serif');
      flCtx.textAlign = 'center';
      flFill(flCompact ? 'ZONE A: TORE' : 'ZONE A: SCHWING- & SEKTIONALTORE', 352, 36, 260);
      flFill(flCompact ? 'ZONE B: ANTRIEBE' : 'ZONE B: ANTRIEBE & SCHIENEN', 672, 54, 140);
      flFill(flCompact ? 'ZONE C: TÜREN' : 'ZONE C: STAHLTÜREN (HOCH)', 672, 232, 140);

      // 4. BLUE HÖRMANN LKW AT THE LOADING DOCK (Left Side)
      const tx = Math.round(flState.truckSlideX);
      flCtx.save();
      flCtx.translate(tx, 0);

      // Dock yellow-black bumpers
      flCtx.fillStyle = '#f59c00';
      flCtx.fillRect(156, 150, 6, 196);
      flCtx.fillStyle = '#0f172a';
      for (let by = 154; by < 344; by += 16) {
        flCtx.fillRect(156, by, 6, 8);
      }

      // LKW Cab (Driver cabin on the left)
      drawIsoBox(flCtx, 10, 178, 34, 140, 0, 26, '#0d448a', '#002d62', '#001a35');
      // Windshield
      flCtx.fillStyle = '#38bdf8';
      flCtx.fillRect(14, 162, 10, 128);

      // LKW Trailer Box & Open Loading Bed
      drawIsoBox(flCtx, 42, 155, 114, 190, 0, 22, '#002d62', '#001f3b', '#001224');

      // Open loading bed floor where pallets sit
      flCtx.fillStyle = '#475569';
      flCtx.fillRect(108, 162, 48, 176);

      // Hörmann Branding on LKW Roof/Side
      flCtx.fillStyle = '#f59c00';
      flCtx.font = flFont('900', 13, 'Inter, sans-serif');
      flCtx.textAlign = 'center';
      flCtx.save();
      flCtx.translate(76, 250);
      flCtx.rotate(-Math.PI / 2);
      flFill(`HÖRMANN LKW #${flState.truckNumber}`, 0, 0, 180);
      flCtx.restore();

      // Draw Remaining Pallets on the LKW
      lkwPallets.forEach(p => {
        drawHoermannPallet(flCtx, p.type, p.x, p.y, 4, 0, 0, p.condition);
        // Small label under pallet on truck
        const info = CARGO_TYPES[p.type];
        flCtx.fillStyle = 'rgba(0, 20, 45, 0.85)';
        if (flCompact) flCtx.fillRect(p.x - 40, p.y + 15, 80, 24); else flCtx.fillRect(p.x - 36, p.y + 15, 72, 12);
        flCtx.fillStyle = '#ffaa1d';
        flCtx.font = flFont('bold', 8, 'Inter, sans-serif');
        flCtx.textAlign = 'center';
        flFill(flCompact ? info.shortName.replace(/^6er /, '').replace('Sektionaltor-Pack', 'Sektional') : info.shortName, p.x, p.y + (flCompact ? 32 : 24), 76);
      });

      flCtx.restore();

      // 5. NICO'S BLUE HÖRMANN FORKLIFT (2.5D Rotated Pixel-Art Vehicle)
      flCtx.save();
      flCtx.translate(Math.round(nico.x), Math.round(nico.y));
      flCtx.rotate(nico.angle);

      // Headlight beams
      flCtx.fillStyle = 'rgba(254, 240, 138, 0.14)';
      flCtx.beginPath();
      flCtx.moveTo(14, -10);
      flCtx.lineTo(75, -32);
      flCtx.lineTo(75, 32);
      flCtx.lineTo(14, 10);
      flCtx.closePath();
      flCtx.fill();

      // 4 Rubber Tires
      flCtx.fillStyle = '#0f172a';
      flCtx.fillRect(-18, -16, 10, 5);
      flCtx.fillRect(-18, 11, 10, 5);
      flCtx.fillRect(4, -16, 10, 5);
      flCtx.fillRect(4, 11, 10, 5);

      // Steel Forks (extending forward at height nico.forkZ)
      const fShift = Math.round(nico.forkZ * 0.45);
      flCtx.fillStyle = '#94a3b8';
      flCtx.fillRect(14, -10 - fShift * 0.1, 24, 4);
      flCtx.fillRect(14, 6 - fShift * 0.1, 24, 4);
      // Orange fork tips for visibility
      flCtx.fillStyle = '#f59c00';
      flCtx.fillRect(33, -10 - fShift * 0.1, 5, 4);
      flCtx.fillRect(33, 6 - fShift * 0.1, 5, 4);

      // Forklift Chassis (Hörmann Royal Blue + Orange Counterweight)
      flCtx.fillStyle = '#002d62';
      flCtx.fillRect(-18, -13, 32, 26);
      flCtx.fillStyle = '#2563eb';
      flCtx.fillRect(-14, -11, 24, 22);
      // Heavy rear counterweight in Hörmann Orange
      flCtx.fillStyle = '#f59c00';
      flCtx.fillRect(-20, -12, 6, 24);

      // Hydraulic Mast Rails at front of cab
      flCtx.fillStyle = '#1e293b';
      flCtx.fillRect(11, -13, 4, 26);

      // Overhead Guard Cage & Lagermeister Nico inside
      flCtx.strokeStyle = '#0f172a';
      flCtx.lineWidth = 2;
      flCtx.strokeRect(-11, -10, 20, 20);

      // Lagermeister Nico (Yellow/Orange Safety Vest & Blue Cap)
      flCtx.fillStyle = '#f59c00'; // Safety vest
      flCtx.fillRect(-6, -6, 10, 12);
      flCtx.fillStyle = '#fed7aa'; // Head
      flCtx.beginPath();
      flCtx.arc(-1, 0, 5, 0, Math.PI * 2);
      flCtx.fill();
      flCtx.fillStyle = '#002d62'; // Nico's Cap
      flCtx.fillRect(-4, -4, 8, 8);

      // Rotating Amber Warning Beacon on Roof
      const beaconPulse = Math.sin(performance.now() * 0.015) > 0;
      flCtx.fillStyle = beaconPulse ? '#facc15' : '#ca8a04';
      flCtx.beginPath();
      flCtx.arc(-9, -7, 3.5, 0, Math.PI * 2);
      flCtx.fill();

      flCtx.restore();

      // Draw Carried Cargo on Nico's Forks (Rendered on top when raised!)
      if (nico.cargo) {
        const cargoX = nico.x + Math.cos(nico.angle) * 27;
        const cargoY = nico.y + Math.sin(nico.angle) * 27;
        drawHoermannPallet(
          flCtx,
          nico.cargo.type,
          cargoX,
          cargoY,
          nico.forkZ + 3,
          nico.angle,
          nico.wobbleAngle,
          nico.cargo.condition
        );
      }

      // Nameplate above Nico
      flCtx.fillStyle = 'rgba(0, 31, 59, 0.82)';
      if (flCompact) flCtx.fillRect(nico.x - 44, nico.y - 48 - nico.forkZ * 0.4, 88, 27); else flCtx.fillRect(nico.x - 44, nico.y - 34 - nico.forkZ * 0.4, 88, 13);
      flCtx.fillStyle = nico.mastLevel === 2 ? '#38bdf8' : '#ffffff';
      flCtx.font = flFont('800', 8.5, 'Inter, sans-serif');
      flCtx.textAlign = 'center';
      flFill(
        flCompact ? `EBENE ${nico.mastLevel} ${nico.mastLevel === 2 ? '⬆️' : '⬇️'}` : `NICO • EBENE ${nico.mastLevel} ${nico.mastLevel === 2 ? '⬆️' : '⬇️'}`,
        nico.x,
        nico.y - (flCompact ? 28 : 25) - nico.forkZ * 0.4,
        84
      );

      // 6. PARTICLES & FLOATING TEXTS
      for (let i = flParticles.length - 1; i >= 0; i--) {
        const pt = flParticles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;
        flCtx.fillStyle = pt.color;
        flCtx.globalAlpha = Math.max(0, pt.alpha);
        flCtx.fillRect(pt.x, pt.y, pt.size, pt.size);
        flCtx.globalAlpha = 1;
        if (pt.alpha <= 0) flParticles.splice(i, 1);
      }

      for (let i = flFloatingTexts.length - 1; i >= 0; i--) {
        const ft = flFloatingTexts[i];
        ft.y -= 0.75;
        ft.alpha -= 0.018;
        flCtx.save();
        flCtx.fillStyle = ft.color;
        flCtx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
        flCtx.font = flFont('900', 11.5, 'Inter, sans-serif', 2.3);
        flCtx.textAlign = 'center';
        if (flCompact) { // schmale Anzeige: umbrechen und im Bild halten
          const lines = flWrap(ft.text, 330); const lh = flFs(11.5, 2.3) * 1.15;
          lines.forEach((ln, i) => flCtx.fillText(ln, Math.min(FL_W - 170, Math.max(170, ft.x)), ft.y + (i - (lines.length - 1)) * lh));
        } else flCtx.fillText(ft.text, ft.x, ft.y);
        flCtx.restore();
        if (ft.alpha <= 0) flFloatingTexts.splice(i, 1);
      }

      // Live Warning Banner (Overspeed Curve / Mast Warning)
      if (flState.warningTimer > 0 && flState.warningBanner) {
        flCtx.font = flFont('800', 11.5, 'Inter, sans-serif', 2.3);
        const bnLines = flCompact ? flWrap(flState.warningBanner, 430) : [flState.warningBanner];
        const bnLh = flCompact ? flFs(11.5, 2.3) * 1.15 : 0; const bnH = flCompact ? bnLines.length * bnLh + 10 : 28; const bnY = 384 - bnH;
        flCtx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        flCtx.fillRect(160, bnY, 460, bnH);
        flCtx.strokeStyle = '#f59c00';
        flCtx.lineWidth = 2;
        flCtx.strokeRect(160, bnY, 460, bnH);
        flCtx.fillStyle = '#ffaa1d';
        flCtx.textAlign = 'center';
        if (flCompact) bnLines.forEach((ln, i) => flCtx.fillText(ln, 390, bnY + 5 + (i + 0.8) * bnLh));
        else flCtx.fillText(flState.warningBanner, 390, 374);
      }

      // 7. BOTTOM COCKPIT DASHBOARD (km/h TACHO, MAST INDICATOR & CARGO MONITOR)
      flCtx.fillStyle = '#0f172a';
      flCtx.fillRect(0, 392, FL_W, 78);
      flCtx.fillStyle = '#f59c00';
      flCtx.fillRect(0, 392, FL_W, 3);

      // Left Panel: KM/H SPEEDOMETER (TACHO)
      flCtx.fillStyle = '#1e293b';
      flCtx.fillRect(14, 401, 240, 60);
      flCtx.strokeStyle = nico.wobbleWarning ? '#ef4444' : '#334155';
      flCtx.lineWidth = 2;
      flCtx.strokeRect(14, 401, 240, 60);

      const currentSafeLimit = nico.cargo
        ? (nico.mastLevel === 2 ? CARGO_TYPES[nico.cargo.type].safeKmh * 0.65 : CARGO_TYPES[nico.cargo.type].safeKmh)
        : 18.0;
      const isTooFastForCurve = nico.kmh > currentSafeLimit;

      flCtx.fillStyle = isTooFastForCurve ? '#ef4444' : '#38bdf8';
      flCtx.font = flFont('900', 22, 'monospace');
      flCtx.textAlign = 'left';
      flFill(flCompact ? nico.kmh.toFixed(1) : `${nico.kmh.toFixed(1)} km/h`, 24, 427, 120);

      flCtx.fillStyle = isTooFastForCurve ? '#fca5a5' : '#94a3b8';
      flCtx.font = flFont('700', 9.5, 'Inter, sans-serif');
      if (flCompact) { flCtx.textAlign = 'right'; }
      flFill(
        flCompact
          ? (isTooFastForCurve ? '⚠️ ZU SCHNELL!' : `km/h · Kurve max ${currentSafeLimit.toFixed(0)}`)
          : (isTooFastForCurve ? '⚠️ ZU SCHNELL FÜR KURVEN!' : `Max. Kurve: ${currentSafeLimit.toFixed(0)} km/h`),
        flCompact ? 248 : 142,
        flCompact ? 427 : 423,
        flCompact ? 160 : 0
      );
      flCtx.textAlign = 'left';

      // Speedometer Bar (0 to 24 km/h)
      flCtx.fillStyle = '#0f172a';
      flCtx.fillRect(24, 437, 218, 14);
      const barWidth = Math.min(218, (nico.kmh / 24) * 218);
      flCtx.fillStyle = isTooFastForCurve ? '#ef4444' : (nico.kmh > 11 ? '#f59c00' : '#10b981');
      flCtx.fillRect(24, 437, barWidth, 14);

      // Safe curve speed marker line on the tacho bar
      const limitX = 24 + Math.min(218, (currentSafeLimit / 24) * 218);
      flCtx.fillStyle = '#ffffff';
      flCtx.fillRect(limitX, 435, 3, 18);

      // Middle Panel: CURRENT PALLET & CONDITION (%)
      flCtx.fillStyle = '#1e293b';
      flCtx.fillRect(266, 401, 290, 60);
      flCtx.strokeStyle = '#334155';
      flCtx.strokeRect(266, 401, 290, 60);

      if (nico.cargo) {
        const cInfo = CARGO_TYPES[nico.cargo.type];
        flCtx.fillStyle = '#f59c00';
        flCtx.font = flFont('800', 11.5, 'Inter, sans-serif');
        flFill(flCompact ? cInfo.name : `LADUNG: ${cInfo.name}`, 278, flCompact ? 421 : 420, 266);

        flCtx.fillStyle = '#ffffff';
        flCtx.font = flFont('700', 10.5, 'Inter, sans-serif');
        flFill(flCompact ? `${cInfo.zoneName.split(' (')[0]} · ${nico.cargo.condition.toFixed(0)}%` : `Ziel: ${cInfo.zoneName}  |  Zustand: ${nico.cargo.condition.toFixed(1)}%`, 278, flCompact ? 446 : 437, 266);

        // Cargo Integrity Bar
        flCtx.fillStyle = '#0f172a';
        const flBarY = flCompact ? 451 : 444, flBarH = flCompact ? 6 : 9;
        flCtx.fillRect(278, flBarY, 264, flBarH);
        flCtx.fillStyle = nico.cargo.condition > 85 ? '#10b981' : (nico.cargo.condition > 55 ? '#f59c00' : '#ef4444');
        flCtx.fillRect(278, flBarY, 264 * (nico.cargo.condition / 100), flBarH);
      } else {
        flCtx.fillStyle = '#94a3b8';
        flCtx.font = flFont('800', 12, 'Inter, sans-serif');
        flFill(flCompact ? 'GABEL LEER' : 'GABEL LEER — BEREIT ZUM AUFLADEN', 278, flCompact ? 428 : 424, 266);
        flCtx.fillStyle = '#38bdf8';
        flCtx.font = flFont('700', 10.5, 'Inter, sans-serif');
        flFill(flState.truckPhase === 'DOCKED' ? (flCompact ? '➔ Zum LKW fahren' : '➔ Zum LKW fahren, dann Aufnehmen') : (flCompact ? '⏳ LKW fährt …' : '⏳ LKW fährt – gleich geht es weiter'), 278, flCompact ? 454 : 444, 266);
      }

      // Right Panel: MAST HEIGHT & PERFECTION METER
      flCtx.fillStyle = '#1e293b';
      flCtx.fillRect(568, 401, 198, 60);
      flCtx.strokeStyle = nico.mastLevel === 2 ? '#38bdf8' : '#334155';
      flCtx.strokeRect(568, 401, 198, 60);

      flCtx.fillStyle = nico.mastLevel === 2 ? '#38bdf8' : '#10b981';
      flCtx.font = flFont('900', 12, 'Inter, sans-serif');
      flFill(
        flCompact
          ? (nico.mastLevel === 2 ? '⬆️ MAST: EBENE 2' : '⬇️ MAST: EBENE 1')
          : (nico.mastLevel === 2 ? '⬆️ MAST: EBENE 2 (HOCH)' : '⬇️ MAST: EBENE 1 (BODEN)'),
        580,
        flCompact ? 428 : 422,
        176
      );
      flCtx.fillStyle = '#cbd5e1';
      flCtx.font = flFont('700', 9.5, 'Inter, sans-serif');
      if (!flCompact) flCtx.fillText('Taste [E]: Heben / Senken', 580, 438);
      flCtx.fillStyle = '#f59c00';
      flFill(flCompact ? '100% = 10.000 Pkt' : '100% = 10.000 Pkt (Millimeterarbeit!)', 580, flCompact ? 454 : 453, 176);

      // 8. SHIFT COMPLETE OVERLAY
      if (flState.shiftComplete) {
        flCtx.fillStyle = 'rgba(0, 24, 48, 0.9)';
        flCtx.fillRect(0, 0, FL_W, FL_H);

        const avgQ = flState.qualityHistory.length > 0
          ? (flState.qualityHistory.reduce((a, b) => a + b, 0) / flState.qualityHistory.length).toFixed(2)
          : '0.00';

        flCtx.fillStyle = '#f59c00';
        flCtx.font = flFont('900', 28, 'Inter, sans-serif');
        flCtx.textAlign = 'center';
        flFill('🚜 SCHICHT ERFOLGREICH ABGERECHNET!', FL_W / 2, 145, 740);

        flCtx.fillStyle = '#ffffff';
        flCtx.font = flFont('700', 18, 'Inter, sans-serif');
        flFill(`Lagermeister Nico hat ${flState.palletsDelivered} Paletten eingelagert!`, FL_W / 2, 190, 740);
        flFill(`Durchschnittliche Präzision & Warenqualität: ${avgQ}%`, FL_W / 2, 225, 740);

        flCtx.fillStyle = '#10b981';
        flCtx.font = flFont('900', 24, 'Inter, sans-serif');
        flFill(`Gesamtpunkte: ${flState.score} / 10.000 Pkt`, FL_W / 2, 270, 740);
      }

      flCtx.restore();
    }

