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
    function nervePotAfterSafe(pot) {
      return pot <= 0 ? 100 : Math.round(pot * 1.5 / 10) * 10;
    }

    function updateNerveHint() {
      const next = nervePotAfterSafe(nerveCurrentStake);
      nerveHint.textContent = nerveCurrentStake > 0
        ? `Im Topf: ${nerveCurrentStake}. Ein sicheres Tor (2 von 3) macht daraus ${next} – ein Alarm (1 von 3) kostet alles im Topf.`
        : 'Hinter 2 Toren wartet gewaltiger Mut – hinter 1 Tor ein Zweifel-Alarm! Erster Treffer bringt 100.';
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
      nerveTitle.innerHTML = 'Runde <span id="nerve-round">1</span>: Welches Tor wagst du zu öffnen?';
      bankNerveBtn.style.display = 'inline-flex';
      bankNerveBtn.disabled = true;
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
        const content = document.getElementById(`door-content-${i}`);

        if (i === alarmDoorIndex) {
          if (i === chosenIndex) d.classList.add('alarm');
          content.innerHTML = `
            <span style="font-size:2rem;">⚠️</span>
            <strong style="color:#ef4444; font-size:1.1rem; margin-top:4px;">ZWEIFEL-ALARM!</strong>
            <small style="color:#cbd5e1; font-size:0.75rem;">${i === chosenIndex ? 'Dieses Tor hast du gewählt' : 'Hier lauerte der Alarm'}</small>
          `;
        } else {
          content.innerHTML = `
            <span style="font-size:2rem;">🌟</span>
            <strong style="color:var(--hoermann-orange); font-size:1.1rem; margin-top:4px;">${i === chosenIndex ? 'Topf: ' + newPot : 'Sicher'}</strong>
            <small style="color:#cbd5e1; font-size:0.75rem;">${i === chosenIndex ? 'Mut-Bonus!' : 'Hier war Mut'}</small>
          `;
        }
      }

      if (isAlarm) {
        nerveOver = true;
        HoermannGameSession.ended(0, 900);
        const lost = nerveCurrentStake;
        playSound('alarm');
        nerveTitle.textContent = lost > 0
          ? `Zweifel-Alarm! Der Topf (${lost}) ist verloren – nächstes Mal früher sichern?`
          : 'Zweifel-Alarm gleich beim ersten Tor! Neuer Versuch?';
        nerveHint.textContent = 'Gewertet wird nur gesicherter Mut.';
        nerveCurrentStake = 0;
        nerveCurrentSpan.textContent = '0';
        bankNerveBtn.style.display = 'none';
        nextNerveRoundBtn.style.display = 'none';
        restartNerveBtn.style.display = 'inline-flex';
        // Nichts gesichert: kein Score. (Sichern beendet den Durchgang, daher ist banked hier immer 0.)
      } else {
        playSound('powerup');
        triggerParticleEffect('gold');
        nerveCurrentStake = newPot;
        nerveCurrentSpan.textContent = nerveCurrentStake;
        nerveTitle.textContent = `Geschafft! Im Topf: ${nerveCurrentStake}. Sichern oder weiter wagen?`;
        updateNerveHint();

        bankNerveBtn.style.display = 'inline-flex';
        bankNerveBtn.disabled = false;
        nextNerveRoundBtn.style.display = 'inline-flex';
        restartNerveBtn.style.display = 'none';
      }
    }

    nextNerveRoundBtn.addEventListener('click', () => {
      if (nerveOver) return;
      nerveRound++;
      nerveTitle.innerHTML = `Runde <span id="nerve-round">${nerveRound}</span>: Welches Tor wagst du zu öffnen?`;
      nextNerveRoundBtn.style.display = 'none';
      resetDoorsUI();
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
      nerveTitle.textContent = `Erfolgreich gesichert: ${nerveBanked} Punkte!`;
      nerveHint.textContent = 'Mutig und klug – das ist dein Ergebnis.';
      bankNerveBtn.style.display = 'none';
      nextNerveRoundBtn.style.display = 'none';
      restartNerveBtn.style.display = 'inline-flex';

      promptScoreSubmit(nerveBanked, 'nerve_v02', 'Die Mut-Probe 0.2');
    });

    restartNerveBtn.addEventListener('click', startNerveGame);

