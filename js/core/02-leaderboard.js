    /* ==========================================================
       7. UNIFIED HIGHSCORE & LEADERBOARD SYSTEM (All 7 Games)
       ========================================================== */
    const scoreSubmitDialog = document.getElementById('score-submit-dialog');
    const submitDialogTitle = document.getElementById('submit-dialog-title');
    const submitDialogSubtitle = document.getElementById('submit-dialog-subtitle');
    const playerNameInput = document.getElementById('player-name-input');
    const saveScoreBtn = document.getElementById('save-score-btn');

    const highscoreCard = document.getElementById('highscore-card');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
    const globalLbTitle = document.getElementById('global-lb-title');
    const lbScoreColHeader = document.getElementById('lb-score-col-header');

    const tabForkliftBtn = document.getElementById('tab-forklift-btn');
    const tabTowerBtn = document.getElementById('tab-tower-btn');
    const tabPacmanBtn = document.getElementById('tab-pacman-btn');
    const tabSlotsBtn = document.getElementById('tab-slots-btn');
    const tabMarioBtn = document.getElementById('tab-mario-btn');
    const tabBusterBtn = document.getElementById('tab-buster-btn');
    const tabNerveBtn = document.getElementById('tab-nerve-btn');
    const tabParcoursBtn = document.getElementById('tab-parcours-btn');

    let activeGameCategory = 'forklift';
    let pendingSubmitGame = 'forklift';
    let pendingScoreToSave = 0;

    // Standard-NPC-Bestenlisten (Deutlich niedrigere Startpunkte, damit echte Spieler leicht Platz 1 erobern!)
    const defaultLeaderboards = {
      forklift: [
        { name: "Lagermeister Nico", score: 1850, date: "Startwert", isNpc: true },
        { name: "Schichtführer Uwe", score: 1420, date: "Startwert", isNpc: true },
        { name: "Stapler-König Kai", score: 1150, date: "Startwert", isNpc: true },
        { name: "Dennis Ressemann", score: 880, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 450, date: "Startwert", isNpc: true }
      ],
      tower: [
        { name: "Turm-Meister Resse", score: 1850, date: "Startwert", isNpc: true },
        { name: "Lagermeister Nico", score: 1400, date: "Startwert", isNpc: true },
        { name: "Meister Torsten", score: 1050, date: "Startwert", isNpc: true },
        { name: "Mut-Pionierin Anna", score: 750, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 400, date: "Startwert", isNpc: true }
      ],
      pacman: [
        { name: "Mut-Man Dennis", score: 2450, date: "Startwert", isNpc: true },
        { name: "Lagermeister Nico", score: 1800, date: "Startwert", isNpc: true },
        { name: "Pellet-Pionierin Anna", score: 1250, date: "Startwert", isNpc: true },
        { name: "Geister-Jäger Kai", score: 850, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 450, date: "Startwert", isNpc: true }
      ],
      slots: [
        { name: "Jackpot-Jürgen", score: 1250, date: "Startwert", isNpc: true },
        { name: "Lagermeister Nico", score: 950, date: "Startwert", isNpc: true },
        { name: "Dennis Ressemann", score: 720, date: "Startwert", isNpc: true },
        { name: "Risiko-Rudi", score: 540, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 300, date: "Startwert", isNpc: true }
      ],
      mario: [
        { name: "Dennis Ressemann", score: 850, date: "Startwert", isNpc: true },
        { name: "Meister Torsten", score: 650, date: "Startwert", isNpc: true },
        { name: "Mut-Pionierin Anna", score: 500, date: "Startwert", isNpc: true },
        { name: "Zargen-Profi Dennis", score: 350, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 200, date: "Startwert", isNpc: true }
      ],
      buster: [
        { name: "Meister Torsten", score: 280, date: "Startwert", isNpc: true },
        { name: "Dennis Ressemann", score: 210, date: "Startwert", isNpc: true },
        { name: "Mut-Pionierin Anna", score: 150, date: "Startwert", isNpc: true },
        { name: "Technik-Tobi", score: 110, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 70, date: "Startwert", isNpc: true }
      ],
      nerve: [
        { name: "Risiko-Rudi", score: 400, date: "Startwert", isNpc: true },
        { name: "Dennis Ressemann", score: 300, date: "Startwert", isNpc: true },
        { name: "Stahlmut Sandra", score: 200, date: "Startwert", isNpc: true },
        { name: "Zargen-König", score: 150, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 100, date: "Startwert", isNpc: true }
      ],
      parcours: [
        { name: "Reflex-Robin", score: 5, date: "Startwert", isNpc: true },
        { name: "Dennis Ressemann", score: 4, date: "Startwert", isNpc: true },
        { name: "Meister Torsten", score: 3, date: "Startwert", isNpc: true },
        { name: "Anna Hörmann", score: 2, date: "Startwert", isNpc: true },
        { name: "Azubi Kevin", score: 1, date: "Startwert", isNpc: true }
      ]
    };

    // Liste alter, zu hoher NPC-Dummy-Einträge aus früheren Versionen (werden automatisch bereinigt, echte Spielereinträge bleiben 100% erhalten!)
    const legacyNpcSignatures = new Set([
      "Lagermeister Nico|9840", "Dennis Ressemann|9120", "Stapler-König Kai|8450", "Schichtführer Uwe|7600", "Azubi Kevin|5200",
      "Dennis Ressemann|2850", "Meister Torsten|2100", "Mut-Pionierin Anna|1750", "Zargen-Profi Dennis|1200", "Montage-Hero|850",
      "Meister Torsten|840", "Dennis Ressemann|720", "Mut-Pionierin Anna|650", "Technik-Tobi|380", "Montage-Hero|240",
      "Risiko-Rudi|2450", "Dennis Ressemann|1800", "Stahlmut Sandra|1600", "Zargen-König|750", "Courage-Chris|400",
      "Reflex-Robin|18", "Dennis Ressemann|16", "Meister Torsten|14", "Anna Hörmann|11", "Tor-Tobi|5",
      "Meister Torsten|420", "Mut-Pionierin Anna|350", "Dennis H.|280", "Stahlzargen-Profi|190", "Tor-Legende|140",
      "Stahlzargen-Profi|8", "Tor-Starter|5", "Neuling|2"
    ]);

    function isLegacyNpcEntry(entry) {
      if (!entry || entry.isUser) return false;
      if (entry.isNpc) return true;
      const sig = `${entry.name}|${entry.score}`;
      const oldDates = ["Gestern", "22.10.", "21.10.", "20.10.", "19.10.", "18.10.", "Startwert"];
      return legacyNpcSignatures.has(sig) && oldDates.includes(entry.date);
    }

    // Hilfsfunktion: Behält pro Spielername IMMER NUR den allerbesten Wert (keine doppelten Namen!)
    function deduplicateKeepBestPerName(list) {
      const byName = new Map();
      (list || []).forEach(item => {
        if (!item || !item.name) return;
        const cleanName = String(item.name).trim().slice(0, 24);
        if (!cleanName) return;
        const key = cleanName.toLowerCase();
        const cleanScore = Number(item.score) || 0;
        const existing = byName.get(key);
        if (!existing || cleanScore > existing.score || (cleanScore === existing.score && item.isUser && !existing.isUser)) {
          byName.set(key, {
            name: existing ? existing.name : cleanName,
            score: cleanScore,
            date: item.date || 'Heute',
            isUser: Boolean(item.isUser || (existing && existing.isUser)),
            isNpc: Boolean(item.isNpc && !(item.isUser || (existing && existing.isUser)))
          });
        }
      });
      const result = Array.from(byName.values());
      result.sort((a, b) => b.score - a.score);
      return result;
    }

    // Permanente Speicherung echter Spieler-Highscores (Update-sicher + Dual-Backup in localStorage & window.name)
    const USER_SCORES_MASTER_KEY = 'hoermann_mut_user_scores_v1';

    function loadMasterUserScores() {
      let master = Object.fromEntries(HoermannGameReleases.categories.map(key => [key, []]));
      try {
        const raw = localStorage.getItem(USER_SCORES_MASTER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          Object.keys(master).forEach(k => {
            if (Array.isArray(parsed[k])) master[k] = deduplicateKeepBestPerName(parsed[k]);
          });
        }
      } catch (e) {}

      // Fallback-Wiederherstellung aus window.name falls localStorage geleert wurde
      try {
        if (window.name && window.name.startsWith('HOERMANN_LB_BACKUP:')) {
          const backup = JSON.parse(window.name.replace('HOERMANN_LB_BACKUP:', ''));
          Object.keys(master).forEach(k => {
            if (Array.isArray(backup[k])) {
              master[k] = deduplicateKeepBestPerName([...master[k], ...backup[k]]);
            }
          });
        }
      } catch (e) {}

      return master;
    }

    function saveMasterUserScores(master) {
      try {
        Object.keys(master).forEach(k => {
          if (Array.isArray(master[k])) {
            master[k] = deduplicateKeepBestPerName(master[k]);
          }
        });
        const serialized = JSON.stringify(master);
        localStorage.setItem(USER_SCORES_MASTER_KEY, serialized);
        window.name = 'HOERMANN_LB_BACKUP:' + serialized;
        if (typeof refreshGameRibbons === 'function') queueMicrotask(refreshGameRibbons);
      } catch (e) {}
    }

    // Hilfsfunktion: Führt zwei Master-Objekte konfliktfrei zusammen – pro Name zählt NUR der höchste Wert!
    function mergeScoreMaps(targetMap, incomingMap) {
      const categories = HoermannGameReleases.categories;
      let changed = false;

      categories.forEach(cat => {
        if (!Array.isArray(targetMap[cat])) targetMap[cat] = [];
        // Zuerst bestehende Liste bereinigen (falls noch doppelte Namen aus der Vergangenheit existieren)
        const beforeDedupeLen = targetMap[cat].length;
        targetMap[cat] = deduplicateKeepBestPerName(targetMap[cat]);
        if (targetMap[cat].length !== beforeDedupeLen) changed = true;

        const incomingList = (incomingMap && Array.isArray(incomingMap[cat])) ? incomingMap[cat] : [];

        incomingList.forEach(item => {
          if (!item || !item.name || isLegacyNpcEntry(item)) return;
          const cleanScore = Number(item.score) || 0;
          if (cleanScore <= 0) return;
          const cleanName = String(item.name).trim().slice(0, 24);
          if (!cleanName) return;
          const cleanDate = item.date || 'Heute';
          const nameKey = cleanName.toLowerCase();

          const existing = targetMap[cat].find(e => e.name.trim().toLowerCase() === nameKey);
          if (!existing) {
            targetMap[cat].push({
              name: cleanName,
              score: cleanScore,
              date: cleanDate,
              isUser: true
            });
            changed = true;
          } else if (cleanScore > Number(existing.score)) {
            // Neuer Rekord für diesen Spieler -> alten Wert aktualisieren!
            existing.score = cleanScore;
            existing.date = cleanDate;
            existing.isUser = true;
            changed = true;
          }
        });

        targetMap[cat] = deduplicateKeepBestPerName(targetMap[cat]);
        if (targetMap[cat].length > 30) targetMap[cat] = targetMap[cat].slice(0, 30);
      });

      return changed;
    }

    // Einmalige & laufende Migration: Rettet ALLE jemals eingetragenen echten Spielernamen und behält pro Name nur den Bestwert!
    function migrateAndPreserveAllUserScores() {
      const master = loadMasterUserScores();
      const categories = HoermannGameReleases.categories;

      // Bisher erspielte echte Online-Highscores dauerhaft als Basis sichern, damit sie selbst bei Firewall-Blockaden niemals fehlen
      const permanentRealPlayerBaseline = {
        forklift: [
          { name: "Mario", score: 9150, date: "23.10.", isUser: true },
          { name: "Delia", score: 9137, date: "23.10.", isUser: true },
          { name: "MMR15", score: 9034, date: "23.10.", isUser: true },
          { name: "Lager-Profi", score: 8701, date: "23.10.", isUser: true },
          { name: "Schumi", score: 8347, date: "23.10.", isUser: true }
        ],
        tower: [
          { name: "Jensiboi", score: 2255, date: "23.10.", isUser: true }
        ],
        pacman: [],
        slots: [
          { name: "Mary", score: 1910, date: "23.10.", isUser: true },
          { name: "d.ressemann.n15@hoer", score: 760, date: "23.10.", isUser: true }
        ],
        mario: [
          { name: "MMR15", score: 5780, date: "23.10.", isUser: true },
          { name: "Meister Manni", score: 5770, date: "23.10.", isUser: true },
          { name: "Lager-Profi", score: 5760, date: "23.10.", isUser: true },
          { name: "Nico-Notentriegelung", score: 5760, date: "23.10.", isUser: true },
          { name: "Mario", score: 5760, date: "23.10.", isUser: true },
          { name: "Delia", score: 5760, date: "23.10.", isUser: true },
          { name: "d.ressemann.n15@hoer", score: 5750, date: "23.10.", isUser: true },
          { name: "Sibbelinho", score: 5550, date: "23.10.", isUser: true },
          { name: "Mary", score: 3100, date: "23.10.", isUser: true }
        ],
        buster: [
          { name: "Mario", score: 3470, date: "23.10.", isUser: true },
          { name: "Delia", score: 3445, date: "23.10.", isUser: true },
          { name: "Mary", score: 3340, date: "23.10.", isUser: true },
          { name: "Sibbelinho", score: 3150, date: "23.10.", isUser: true },
          { name: "Nico", score: 1750, date: "23.10.", isUser: true }
        ],
        nerve: [
          { name: "Mary", score: 17835, date: "23.10.", isUser: true },
          { name: "Sibbelinho", score: 9881, date: "23.10.", isUser: true },
          { name: "Mario", score: 9881, date: "23.10.", isUser: true },
          { name: "Delia", score: 5462, date: "23.10.", isUser: true },
          { name: "Nico-Notentriegelung", score: 5462, date: "23.10.", isUser: true },
          { name: "MMR15", score: 3007, date: "23.10.", isUser: true },
          { name: "d.ressemann.n15@hoer", score: 885, date: "23.10.", isUser: true }
        ],
        parcours: [
          { name: "Der wahre Mario", score: 67, date: "23.10.", isUser: true },
          { name: "36 Grad", score: 36, date: "23.10.", isUser: true },
          { name: "Sibbelinho", score: 32, date: "23.10.", isUser: true },
          { name: "Delia", score: 9, date: "23.10.", isUser: true },
          { name: "Lager-Profi", score: 6, date: "23.10.", isUser: true },
          { name: "Mary", score: 5, date: "23.10.", isUser: true }
        ]
      };
      mergeScoreMaps(master, permanentRealPlayerBaseline);

      categories.forEach(cat => {
        master[cat] = deduplicateKeepBestPerName(master[cat]);
        try {
          const stored = localStorage.getItem(`hoermann_lb_${cat}`);
          if (stored) {
            const arr = JSON.parse(stored);
            if (Array.isArray(arr)) {
              arr.forEach(item => {
                if (!isLegacyNpcEntry(item)) {
                  mergeScoreMaps(master, { [cat]: [{ name: item.name, score: Number(item.score) || 0, date: item.date || 'Heute', isUser: true }] });
                }
              });
            }
          }
        } catch (e) {}
      });

      // Auch aus ganz alten Keys (v1 / v2) retten, falls vorhanden
      ['hoermann_mut_leaderboard_v2', 'hoermann_mut_leaderboard'].forEach(oldKey => {
        try {
          const oldRaw = localStorage.getItem(oldKey);
          if (oldRaw) {
            const arr = JSON.parse(oldRaw);
            if (Array.isArray(arr)) {
              arr.forEach(item => {
                if (!isLegacyNpcEntry(item)) {
                  const targetCat = (item.score <= 40) ? 'parcours' : 'buster';
                  mergeScoreMaps(master, { [targetCat]: [{ name: item.name, score: Number(item.score) || 0, date: item.date || 'Heute', isUser: true }] });
                }
              });
            }
          }
        } catch (e) {}
      });

      saveMasterUserScores(master);

      categories.forEach(cat => {
        const combined = deduplicateKeepBestPerName([...master[cat], ...(defaultLeaderboards[cat] || [])]);
        try {
          localStorage.setItem(`hoermann_lb_${cat}`, JSON.stringify(combined));
        } catch (e) {}
      });
    }

    // Direkt beim Start ausführen, damit echte Highscores immer geschützt sind
    migrateAndPreserveAllUserScores();

