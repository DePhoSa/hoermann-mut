    /* ==========================================================
       10. GAME 2: DIE MUT-PROBE (Risk & Reward)
       ========================================================== */
    const nerveBankedSpan = document.getElementById('nerve-banked');
    const nerveCurrentSpan = document.getElementById('nerve-current');
    const nerveRoundSpan = document.getElementById('nerve-round');
    const nerveTitle = document.getElementById('nerve-title');
    const bankNerveBtn = document.getElementById('bank-nerve-btn');
    const nextNerveRoundBtn = document.getElementById('next-nerve-round-btn');
    const restartNerveBtn = document.getElementById('restart-nerve-btn');

    const nerveHint = document.getElementById('nerve-hint');
    let nerveRound = 1;
    let nerveCurrentStake = 0; // Topf: wird bei Sicherung gutgeschrieben, bei Alarm verloren
    let nerveBanked = 0;
    let nerveCanClick = true;
    let nerveOver = false;
    let nerveNextTimer = null;

    // Fairer Topf: 2 von 3 Toren sind sicher, Topf waechst um x1.5 (= Break-even bei 2/3 Trefferchance).
    // Weiterspielen lohnt sich also nie "automatisch" - es ist eine echte Risiko-Entscheidung.
    //
    // Erwartungswert (Simulation, 1 Mio. Durchgaenge je Strategie "sichere nach n sicheren Toren"):
    //   Topf nach n Toren: 100, 150, 230, 350, 530, 800, 1200, 1800 ...   Ueberleben: (2/3)^n
    //   n=1: 66,7   n=2: 66,6   n=3: 68,0   n=4: 68,9   n=5: 69,8   n=6..10: ca. 70   (Muenzwurf-Strategie: 67)
    //   Der Erwartungswert ist flach (max. +5 % durch Runden auf 10er): keine Strategie schlaegt die anderen deutlich.
    //   Nur die Streuung unterscheidet sich (n=1: 67 % fuer 100; n=6: nur 8,8 % fuer 1200). Faire Risiko-Entscheidung,
    //   daher UNVERAENDERT. Die Wertung (Punkte = gesicherter Topf, 0 bei Alarm) bleibt gleich: Kategorie nerve_v02.
    function nervePotAfterSafe(pot) {
      return pot <= 0 ? 100 : Math.round(pot * 1.5 / 10) * 10;
    }

    function updateNerveHint() {
      const next = nervePotAfterSafe(nerveCurrentStake);
      nerveHint.textContent = nerveCurrentStake > 0
        ? `Nächstes Tor: sicher (2 von 3) = Topf ${next}, Alarm (1 von 3) = alles weg.`
        : 'Hinter 2 Toren wartet Mut, hinter 1 ein Zweifel-Alarm. Das erste sichere Tor bringt 100.';
    }

    function setBankLabel() {
      bankNerveBtn.textContent = nerveCurrentStake > 0 ? `💰 Sichern (${nerveCurrentStake})` : '💰 Sichern';
    }

    function startNerveGame() {
      clearTimeout(nerveNextTimer);
      nerveRound = 1;
      nerveCurrentStake = 0;
      nerveBanked = 0;
      nerveOver = false;
      nerveCanClick = true;
      nerveCurrentSpan.textContent = '0';
      nerveBankedSpan.textContent = '0';
      nerveTitle.innerHTML = 'Runde <span id="nerve-round">1</span>: Welches Tor wagst du?';
      bankNerveBtn.style.display = 'inline-flex';
      bankNerveBtn.disabled = true;
      setBankLabel();
      nextNerveRoundBtn.style.display = 'none';
      restartNerveBtn.style.display = 'none';
      scoreSubmitDialog.classList.remove('show');
      highscoreCard.classList.remove('show');
      resetDoorsUI();
      updateNerveHint();
    }

    function resetDoorsUI() {
      nerveCanClick = !nerveOver;
      for (let i = 1; i <= 3; i++) {
        const door = document.getElementById(`door-${i}`);
        door.classList.remove('opened', 'chosen', 'alarm');
        door.setAttribute('aria-disabled', 'false');
        document.getElementById(`door-content-${i}`).innerHTML = "";
      }
    }

    for (let i = 1; i <= 3; i++) {
      const door = document.getElementById(`door-${i}`);
      door.addEventListener('click', () => {
        if (!nerveCanClick) return;
        openMysteryDoor(i);
      });
      door.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (nerveCanClick) openMysteryDoor(i);
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!nerveView.classList.contains('active') && getComputedStyle(nerveView).display === 'none') return;
      if (!nerveCanClick || nerveOver) return;
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.key >= '1' && e.key <= '3') openMysteryDoor(Number(e.key));
    });

    // Mut-Spruch nach dem Sichern (OPTIONALES Feature, getrennt abschaltbar: NERVE_QUOTE = false).
    // Nutzt die vorhandene Liste mutSpruche (js/core/01-ui-navigation.js), nur kurze Sprueche (bis 120 Zeichen).
    const NERVE_QUOTE = true;
    let nerveLastQuote = -1;
    function nerveQuoteText() {
      if (!NERVE_QUOTE || typeof mutSpruche === 'undefined') return '';
      const pool = mutSpruche.map((q, i) => i).filter(i => mutSpruche[i].quote.length <= 120 && i !== nerveLastQuote);
      if (!pool.length) return '';
      nerveLastQuote = pool[Math.floor(Math.random() * pool.length)];
      const q = mutSpruche[nerveLastQuote];
      return `„${q.quote}“ – ${q.author}`;
    }

    function doorHtml(kind, mine) {
      const own = mine ? '<small>Dein Tor</small>' : '';
      return kind === 'alarm'
        ? `<span class="door-icon">⚠️</span><strong class="door-label door-label-alarm">Alarm</strong>${own}`
        : `<span class="door-icon">🌟</span><strong class="door-label door-label-safe">Sicher</strong>${own}`;
    }

    function openMysteryDoor(chosenIndex) {
      if (!nerveCanClick) return;
      nerveCanClick = false;
      playSound('gate');

      const alarmDoorIndex = Math.floor(Math.random() * 3) + 1;
      const isAlarm = (chosenIndex === alarmDoorIndex);
      const newPot = nervePotAfterSafe(nerveCurrentStake);

      for (let i = 1; i <= 3; i++) {
        const d = document.getElementById(`door-${i}`);
        d.classList.add('opened');
        d.setAttribute('aria-disabled', 'true');
        if (i === chosenIndex) d.classList.add('chosen');
        if (i === alarmDoorIndex && i === chosenIndex) d.classList.add('alarm');
        document.getElementById(`door-content-${i}`).innerHTML = doorHtml(i === alarmDoorIndex ? 'alarm' : 'safe', i === chosenIndex);
      }

      // Ergebnis-Ton/Effekt erst, wenn das Tor offen ist (kein Matsch aus Tor- und Ergebnis-Ton gleichzeitig).
      const afterOpen = (fn) => HoermannGameSession.delay(fn, 420);

      if (isAlarm) {
        nerveOver = true;
        const lost = nerveCurrentStake;
        nerveTitle.textContent = 'Zweifel-Alarm!';
        nerveHint.textContent = lost > 0 ? `Der Topf (${lost}) ist verloren. Gewertet wird nur gesicherter Mut.` : 'Gleich beim ersten Tor. Gewertet wird nur gesicherter Mut.';
        nerveCurrentStake = 0;
        nerveCurrentSpan.textContent = '0';
        bankNerveBtn.style.display = 'none';
        nextNerveRoundBtn.style.display = 'none';
        restartNerveBtn.style.display = 'none';
        HoermannGameSession.endText({ score: '0 Punkte', detail: lost > 0 ? 'Nächstes Mal früher sichern?' : 'Neuer Versuch?' });
        HoermannGameSession.ended(0, 800);
        afterOpen(() => playSound('alarm'));
        // Nichts gesichert: kein Score. (Sichern beendet den Durchgang, daher ist banked hier immer 0.)
      } else {
        nerveCurrentStake = newPot;
        nerveCurrentSpan.textContent = nerveCurrentStake;
        nerveTitle.textContent = 'Tor sicher – sichern oder weiter?';
        updateNerveHint();
        setBankLabel();
        afterOpen(() => { playSound('powerup'); triggerParticleEffect('gold'); });

        bankNerveBtn.style.display = 'inline-flex';
        bankNerveBtn.disabled = false;
        nextNerveRoundBtn.style.display = 'inline-flex';
        restartNerveBtn.style.display = 'none';
      }
    }

    nextNerveRoundBtn.addEventListener('click', () => {
      if (nerveOver) return;
      nerveRound++;
      nerveTitle.innerHTML = `Runde <span id="nerve-round">${nerveRound}</span>: Welches Tor wagst du?`;
      nextNerveRoundBtn.style.display = 'none';
      resetDoorsUI();
      // Der Knopf verschwindet: Fokus auf das erste Tor, damit die Tastatur nicht ins Leere faellt.
      document.getElementById('door-1').focus({ preventScroll: true });
    });

    bankNerveBtn.addEventListener('click', () => {
      if (nerveOver || nerveCurrentStake <= 0) return;
      nerveOver = true;
      nerveCanClick = false;
      nerveBanked += nerveCurrentStake;
      nerveCurrentStake = 0;
      nerveCurrentSpan.textContent = '0';
      nerveBankedSpan.textContent = nerveBanked;
      playSound('score');
      triggerParticleEffect('confetti');
      nerveTitle.textContent = 'Gesichert!';
      nerveHint.textContent = `Du hast ${nerveRound} ${nerveRound === 1 ? 'Tor' : 'Tore'} gewagt. Mutig und klug.`;
      bankNerveBtn.style.display = 'none';
      nextNerveRoundBtn.style.display = 'none';
      restartNerveBtn.style.display = 'none';

      HoermannGameSession.endText({ score: `${nerveBanked} Punkte`, quote: nerveQuoteText() });
      promptScoreSubmit(nerveBanked, 'nerve_v02', 'Die Mut-Probe 0.2');
    });

    restartNerveBtn.addEventListener('click', startNerveGame);

