    /* ==========================================================
       1. DATE / WEEK HEADER (Matches Screenshot)
       ========================================================== */
    const days = ['SONNTAG', 'MONTAG', 'DIENSTAG', 'MITTWOCH', 'DONNERSTAG', 'FREITAG', 'SAMSTAG'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const firstJan = new Date(now.getFullYear(), 0, 1);
    const pastDays = (now - firstJan) / 86400000;
    const weekNum = Math.ceil((pastDays + firstJan.getDay() + 1) / 7);
    document.getElementById('date-label').textContent = `WOCHE ${weekNum} - ${dayName}`;

    /* ==========================================================
       2. SOUND EFFECTS (Web Audio API)
       ========================================================== */
    let audioCtx = null;
    let soundEnabled = true;

    function getAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playSound(type) {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        const nowTime = ctx.currentTime;

        if (type === 'chime' || type === 'mut') {
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, nowTime + idx * 0.08);
            gain.gain.setValueAtTime(0.001, nowTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.2, nowTime + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, nowTime + idx * 0.08 + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nowTime + idx * 0.08);
            osc.stop(nowTime + idx * 0.08 + 0.65);
          });
        } else if (type === 'coin') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, nowTime);
          osc.frequency.setValueAtTime(1318.51, nowTime + 0.08);
          gain.gain.setValueAtTime(0.12, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.36);
        } else if (type === 'stomp' || type === 'smash') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(340, nowTime);
          osc.frequency.exponentialRampToValueAtTime(70, nowTime + 0.12);
          gain.gain.setValueAtTime(0.25, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.13);
        } else if (type === 'bump') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, nowTime);
          osc.frequency.linearRampToValueAtTime(80, nowTime + 0.1);
          gain.gain.setValueAtTime(0.2, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.11);
        } else if (type === 'powerup') {
          const notes = [330, 392, 659, 523, 587, 784];
          notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, nowTime + i * 0.05);
            gain.gain.setValueAtTime(0.1, nowTime + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, nowTime + i * 0.05 + 0.09);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nowTime + i * 0.05);
            osc.stop(nowTime + i * 0.05 + 0.1);
          });
        } else if (type === 'victory') {
          const notes = [523, 659, 783, 1046, 783, 1046];
          notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(f, nowTime + i * 0.14);
            gain.gain.setValueAtTime(0.15, nowTime + i * 0.14);
            gain.gain.exponentialRampToValueAtTime(0.001, nowTime + i * 0.14 + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nowTime + i * 0.14);
            osc.stop(nowTime + i * 0.14 + 0.3);
          });
        } else if (type === 'jump') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(160, nowTime);
          osc.frequency.exponentialRampToValueAtTime(580, nowTime + 0.14);
          gain.gain.setValueAtTime(0.11, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.15);
        } else if (type === 'gate') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(110, nowTime);
          osc.frequency.linearRampToValueAtTime(220, nowTime + 0.45);
          gain.gain.setValueAtTime(0.12, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.6);
        } else if (type === 'hit' || type === 'alarm') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, nowTime);
          osc.frequency.setValueAtTime(140, nowTime + 0.12);
          gain.gain.setValueAtTime(0.2, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.26);
        } else if (type === 'horn') {
          [293.66, 369.99].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, nowTime);
            gain.gain.setValueAtTime(0.14, nowTime);
            gain.gain.setValueAtTime(0.14, nowTime + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.28);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nowTime);
            osc.stop(nowTime + 0.29);
          });
        } else if (type === 'hydraulic') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160, nowTime);
          osc.frequency.linearRampToValueAtTime(290, nowTime + 0.22);
          gain.gain.setValueAtTime(0.12, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.26);
        } else if (type === 'beep') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1020, nowTime);
          gain.gain.setValueAtTime(0.08, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.13);
        } else if (type === 'crunch') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(95, nowTime);
          osc.frequency.linearRampToValueAtTime(45, nowTime + 0.18);
          gain.gain.setValueAtTime(0.28, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.23);
        } else if (type === 'jackpot') {
          const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1567.98];
          fanfare.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = idx % 2 === 0 ? 'square' : 'triangle';
            osc.frequency.setValueAtTime(f, nowTime + idx * 0.09);
            gain.gain.setValueAtTime(0.16, nowTime + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, nowTime + idx * 0.09 + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nowTime + idx * 0.09);
            osc.stop(nowTime + idx * 0.09 + 0.24);
          });
        } else if (type === 'pacWaka') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(380, nowTime);
          osc.frequency.linearRampToValueAtTime(540, nowTime + 0.04);
          osc.frequency.linearRampToValueAtTime(260, nowTime + 0.08);
          gain.gain.setValueAtTime(0.09, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.095);
        } else if (type === 'pacPower') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, nowTime);
          osc.frequency.linearRampToValueAtTime(880, nowTime + 0.22);
          gain.gain.setValueAtTime(0.14, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.25);
        } else if (type === 'pacGhost') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, nowTime);
          osc.frequency.linearRampToValueAtTime(1320, nowTime + 0.08);
          gain.gain.setValueAtTime(0.18, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.21);
        } else if (type === 'pacDie') {
          const freqs = [620, 580, 540, 500, 460, 420, 380, 340, 300, 260, 220, 180, 140];
          freqs.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, nowTime + idx * 0.04);
            gain.gain.setValueAtTime(0.14, nowTime + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, nowTime + idx * 0.04 + 0.07);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(nowTime + idx * 0.04);
            osc.stop(nowTime + idx * 0.04 + 0.08);
          });
        } else if (type === 'ladderStep') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(587.33, nowTime);
          osc.frequency.setValueAtTime(880, nowTime + 0.07);
          gain.gain.setValueAtTime(0.15, nowTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nowTime + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(nowTime);
          osc.stop(nowTime + 0.19);
        }
      } catch (e) {
        console.warn('Audio error:', e);
      }
    }

    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundIconOn = document.getElementById('sound-icon-on');
    const soundIconOff = document.getElementById('sound-icon-off');

    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundIconOn.style.display = soundEnabled ? 'block' : 'none';
      soundIconOff.style.display = soundEnabled ? 'none' : 'block';
      showToast(soundEnabled ? 'Ton aktiviert 🔊' : 'Ton stummgeschaltet 🔇');
      if (soundEnabled) playSound('score');
    });

    /* ==========================================================
       3. 100% EIGENE MUT-SPRÜCHE
       ========================================================== */
    const mutSpruche = [
      { quote: "Ein geschlossenes Tor ist kein Stoppschild – es ist die Einladung, den Hebel mutig in die Hand zu nehmen.", author: "Dennis Ressemann" },
      { quote: "Manche warten ihr Leben lang, bis sich Türen von alleine öffnen. Die Mutigen bauen den Torantrieb einfach selbst ein.", author: "Hörmann Mut-Schmiede" },
      { quote: "Steh fest wie eine verzinkte Stahlzarge: Lass dich von Gegenwind nicht verbiegen und gib deinen Träumen verlässlichen Halt.", author: "Dennis Ressemann" },
      { quote: "Ein Sektionaltor öffnet sich Lamelle für Lamelle. Genauso wächst dein Mut: Nicht auf einen Schlag, sondern Schritt für Schritt, bis der ganze Horizont frei ist.", author: "Der innere Toröffner" },
      { quote: "Schwingtore beweisen es jeden Tag aufs Neue: Mit dem richtigen Schwung und Ausgleich wird selbst das schwerste Gewicht federleicht.", author: "Meister Dennis" },
      { quote: "Zweifel sind wie Flugrost auf blankem Stahl: Wenn du sie sofort kraftvoll abwischst, bleibt deine Entschlossenheit unzerstörbar.", author: "Hörmann Philosophie" },
      { quote: "Wenn das Leben dir eine Mauer vor die Nase setzt, bau ein Hörmann-Industrietor hinein und fahre mit Vollgas hindurch.", author: "Dennis Ressemann" },
      { quote: "Hinter dem Tor, vor dem du am meisten zögerst, liegt fast immer die größte Erleichterung deines Lebens.", author: "Mut-Pionier Dennis" },
      { quote: "Wahres Selbstvertrauen braucht kein lautes Poltern. Es steht so felsenfest und passgenau wie eine meisterhaft verankerte Blockzarge.", author: "Stahlharte Entschlossenheit" },
      { quote: "Angst fragt dich: ‚Was, wenn etwas schiefgeht?‘ – Mut lächelt und antwortet: ‚Aber stell dir vor, wie gigantisch es wird, wenn es gelingt!‘", author: "Dennis Ressemann" },
      { quote: "Wer immer nur in der warmen Garage parkt, wird nie erfahren, welche Straßen die Welt zu bieten hat. Öffne das Tor und fahr los!", author: "Hörmann Mut-Schmiede" },
      { quote: "Kein Tor ist für die Ewigkeit verriegelt, wenn man die Funkfernbedienung des eigenen Mutes betätigt.", author: "BiSecur Mut-Impuls" },
      { quote: "Ein klares Ziel schützt dich vor Unsicherheit und Chaos genauso zuverlässig wie eine geprüfte Feuerschutztür vor den Flammen.", author: "Dennis Ressemann" },
      { quote: "Zögern verbraucht exakt dieselbe Energie wie Handeln – nur dass Handeln dich am Ende des Tages stolz in den Feierabend entlässt.", author: "Feierabend-Motto" },
      { quote: "Fehler sind keine Bauschäden, sondern wertvolle Montage-Erfahrungen für dein nächstes Meisterstück.", author: "Dennis Ressemann" },
      { quote: "Ein Tag voller Mut beginnt mit dem einfachen Gedanken: ‚Ich packe das heute an. Punkt.‘", author: "Dennis Ressemann" },
      { quote: "Mut ist wie ein Qualitäts-Kugellager: Gut geschmiert läuft es reibungslos durch jede Lebenslage.", author: "Werkstatt-Mut" },
      { quote: "Halte den Kurs, auch wenn es mal ruckelt. Die besten Tore gleiten auch nach tausenden Zyklen noch butterweich.", author: "Dennis Ressemann" },
      { quote: "Ein guter Staplerfahrer weiß: Auch ein 6er-Pack Schwingtore hebt sich leicht, wenn das Gegengewicht aus purem Mut besteht!", author: "Lagermeister Nico" },
      { quote: "Vor der Kurve kurz vom Gas, vor dem Hochregal sauber ansetzen – wahrer Mut in der Logistik zeigt sich in Ruhe und Präzision.", author: "Lagermeister Nico" },
      { quote: "Wenn der nächste LKW schon an der Rampe piept: Brust raus, Gabel senken und Palette für Palette sauber wegarbeiten!", author: "Lagermeister Nico & die Lagerjungs" },
      { quote: "Ob lange Führungsschiene oder hohe Stahltür: Für unsere Lagerjungs ist keine Last zu sperrig und kein Regal zu hoch.", author: "Lagermeister Nico" }
    ];

    /* ==========================================================
       4. DYNAMIC MUT-EFFECTS
       ========================================================== */
    const effects = [
      { id: 'confetti', name: 'Konfetti-Regen', icon: '🎉', sound: 'mut' },
      { id: 'hands', name: 'Jubelnde Hände & Power', icon: '🙌', sound: 'mut' },
      { id: 'door', name: 'Hörmann Sektionaltor öffnet sich', icon: '🚪', sound: 'gate' },
      { id: 'gold', name: 'Goldener Mut-Schein', icon: '✨', sound: 'chime' },
      { id: 'firework', name: 'Mut-Feuerwerk', icon: '🎆', sound: 'mut' },
      { id: 'heart', name: 'Herzklopfen & Energie-Puls', icon: '❤️‍🔥', sound: 'mut' },
      { id: 'rocket', name: 'Raketen-Durchbruch', icon: '🚀', sound: 'gate' }
    ];

    let lastEffectIndex = -1;
    let lastQuoteIndex = -1;

    function triggerParticleEffect(effectType) { HoermannMutEffects.trigger(effectType); }

    /* ==========================================================
       5. "GIB MIR MUT" BUTTON CLICK
       ========================================================== */
    const mutBtn = document.getElementById('mut-btn');
    const mainHeadline = document.getElementById('main-headline');
    const mainSubline = document.getElementById('main-subline');
    const effectBadge = document.getElementById('effect-badge');
    const effectIcon = document.getElementById('effect-icon');
    const effectName = document.getElementById('effect-name');
    const copyQuoteBtn = document.getElementById('copy-quote-btn');

    let currentQuoteText = "";

    let quoteChangeTimer = null;
    function giveMeMut() {
      clearTimeout(quoteChangeTimer);
      let qIndex;
      do {
        qIndex = Math.floor(Math.random() * mutSpruche.length);
      } while (qIndex === lastQuoteIndex && mutSpruche.length > 1);
      lastQuoteIndex = qIndex;
      const item = mutSpruche[qIndex];

      let effIndex;
      do {
        effIndex = Math.floor(Math.random() * effects.length);
      } while (effIndex === lastEffectIndex && effects.length > 1);
      lastEffectIndex = effIndex;
      const effect = effects[effIndex];

      effectIcon.textContent = effect.icon;
      effectName.textContent = `Muteffekt: ${effect.name}`;
      effectBadge.classList.add('show');

      mainHeadline.style.opacity = '0';
      mainSubline.style.opacity = '0';

      quoteChangeTimer = setTimeout(() => {
        mainHeadline.innerHTML = `„${item.quote}“`;
        mainSubline.innerHTML = `<span class="quote-author">&mdash; ${item.author}</span>`;
        mainHeadline.style.opacity = '1';
        mainSubline.style.opacity = '1';
        currentQuoteText = `„${item.quote}“ — ${item.author}`;
        copyQuoteBtn.style.display = 'inline-flex';
      }, 200);

      playSound(effect.sound);
      triggerParticleEffect(effect.id);
    }

    mutBtn.addEventListener('click', giveMeMut);

    copyQuoteBtn.addEventListener('click', () => {
      if (!currentQuoteText) return;
      navigator.clipboard.writeText(currentQuoteText).then(() => {
        showToast('Mutspruch in die Zwischenablage kopiert! 📋');
      }).catch(() => {
        showToast('Konnte nicht kopiert werden.');
      });
    });

    const toggleThoughtsBtn = document.getElementById('toggle-thoughts-btn');
    const thoughtsBox = document.getElementById('thoughts-box');
    const saveThoughtsBtn = document.getElementById('save-thoughts-btn');
    const t1 = document.getElementById('thought-1');
    const t2 = document.getElementById('thought-2');
    const t3 = document.getElementById('thought-3');

    try {
      const saved = JSON.parse(localStorage.getItem('hoermann_mut_thoughts') || '[]');
      if (saved[0]) t1.value = saved[0];
      if (saved[1]) t2.value = saved[1];
      if (saved[2]) t3.value = saved[2];
    } catch(e){}

    toggleThoughtsBtn.addEventListener('click', () => {
      thoughtsBox.classList.toggle('open');
      if (thoughtsBox.classList.contains('open')) t1.focus();
    });

    saveThoughtsBtn.addEventListener('click', () => {
      const arr = [t1.value, t2.value, t3.value];
      localStorage.setItem('hoermann_mut_thoughts', JSON.stringify(arr));
      playSound('coin');
      showToast('Deine Mut-Gedanken wurden gesichert! 💡');
    });

    document.getElementById('reset-view-btn').addEventListener('click', showPortalView);

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 2600);
    }

    /* ==========================================================
       6. VIEW NAVIGATION SYSTEM
       ========================================================== */
    const portalView = document.getElementById('portal-view');
    const gamesMenuView = document.getElementById('games-menu-view');
    const forkliftView = document.getElementById('forklift-view');
    const towerView = document.getElementById('tower-view');
    const pacmanView = document.getElementById('pacman-view');
    const marioView = document.getElementById('mario-view');
    const busterView = document.getElementById('buster-view');
    const nerveView = document.getElementById('nerve-view');
    const parcoursView = document.getElementById('parcours-view');

    function hideAllViews() {
      if(globalThis.HoermannMutEffects) HoermannMutEffects.stop();
      if (globalThis.HoermannGameSession) HoermannGameSession.stop();
      const launch = document.getElementById('game-launch-view');
      if (launch) launch.style.display = 'none';
      portalView.style.display = 'none';
      gamesMenuView.style.display = 'none';
      forkliftView.style.display = 'none';
      if (towerView) towerView.style.display = 'none';
      if (pacmanView) pacmanView.style.display = 'none';
      marioView.style.display = 'none';
      busterView.style.display = 'none';
      nerveView.style.display = 'none';
      parcoursView.style.display = 'none';
      scoreSubmitDialog.classList.remove('show');
      highscoreCard.classList.remove('show');
      if (typeof stopForkliftGame === 'function') stopForkliftGame();
      if (typeof stopTowerGame === 'function') stopTowerGame();
      if (typeof stopPacmanGame === 'function') stopPacmanGame();
      stopMarioGame();
      stopBusterGame();
      stopParcoursGame();
    }

    function showPortalView() {
      hideAllViews();
      portalView.style.display = 'flex';
      mainHeadline.textContent = "Was bedeutet Mut für Sie?";
      mainSubline.textContent = "Nehmen Sie sich einen Moment Zeit und notieren Sie drei Gedanken zum Thema Mut.";
      effectBadge.classList.remove('show');
      copyQuoteBtn.style.display = 'none';
      thoughtsBox.classList.remove('open');
      if (typeof checkAndApplyDeferredUpdateIfOutOfGame === 'function') {
        setTimeout(checkAndApplyDeferredUpdateIfOutOfGame, 300);
      }
    }

    function showGamesMenu() {
      hideAllViews();
      gamesMenuView.style.display = 'flex';
      if (typeof refreshGameRibbons === 'function') refreshGameRibbons();
      playSound('coin');
      if (typeof checkAndApplyDeferredUpdateIfOutOfGame === 'function') {
        setTimeout(checkAndApplyDeferredUpdateIfOutOfGame, 300);
      }
    }

    document.getElementById('menu-btn').addEventListener('click', showGamesMenu);

    // Game selection is coordinated by game-navigation.js.

    document.getElementById('exit-forklift-btn').addEventListener('click', showGamesMenu);
    const exitTowerBtn = document.getElementById('exit-tower-btn');
    if (exitTowerBtn) exitTowerBtn.addEventListener('click', showGamesMenu);
    const exitPacmanBtn = document.getElementById('exit-pacman-btn');
    if (exitPacmanBtn) exitPacmanBtn.addEventListener('click', showGamesMenu);
    document.getElementById('exit-mario-btn').addEventListener('click', showGamesMenu);
    document.getElementById('exit-buster-btn').addEventListener('click', showGamesMenu);
    document.getElementById('exit-nerve-btn').addEventListener('click', showGamesMenu);
    document.getElementById('exit-parcours-btn').addEventListener('click', showGamesMenu);

