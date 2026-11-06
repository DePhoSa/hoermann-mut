    /* ==========================================================
       7b. GLOBAL ONLINE CLOUD HUB (HIGHSCORES, IDEEN-BOX, LIVE-CHAT & ZWANGSUPDATE)
       ========================================================== */
    const APP_VERSION           = '3.4.0';
    const cloudSyncBadge        = document.getElementById('cloud-sync-badge');
    const submitHighscoreFeedback = document.getElementById('submit-highscore-feedback');
    const ideaTicketBox         = document.getElementById('idea-ticket-box');
    const ideaTicketBadge       = document.getElementById('idea-ticket-badge');
    const ideaTicketReason      = document.getElementById('idea-ticket-reason');
    const playerIdeaInput       = document.getElementById('player-idea-input');
    const lockedPlayerBadge     = document.getElementById('locked-player-badge');
    const lockedPlayerNameText  = document.getElementById('locked-player-name-text');
    const firstTimeNameRow      = document.getElementById('first-time-name-row');
    const openRenameReqBtn      = document.getElementById('open-rename-request-btn');
    const chatRenameReqBtn      = document.getElementById('chat-rename-req-btn');
    const renameRequestBox      = document.getElementById('rename-request-box');
    const renameRequestInput    = document.getElementById('rename-request-input');
    const sendRenameReqBtn      = document.getElementById('send-rename-request-btn');
    const cancelRenameReqBtn    = document.getElementById('cancel-rename-request-btn');

    let pendingGameDisplayName  = '';
    let updateForcedAlready     = false;
    let prefetchedNewHtml       = '';
    let hasCompletedInitialCloudSync = false;
    let currentIdeaEligibility  = { eligible: false, reason: '', badge: '', oldRank: null, newRank: null, rule: 'NONE' };

    // Feste Geräte-ID & Namens-Eigentümerschaft (verhindert, dass man fremde Namen eingibt oder sich mehrfach einträgt!)
    const DEVICE_TOKEN_KEY      = 'hoermann_device_token_v1';
    const LOCKED_NAME_KEY       = 'hoermann_locked_player_name_v1';
    const NAME_OWNERS_KEY       = 'hoermann_name_owners_map_v1';
    const RENAME_REQ_USED_KEY   = 'hoermann_rename_request_used_v1';
    const RENAME_STATE_KEY      = 'hoermann_rename_requests_state_v1';

    function getOrCreateDeviceToken() {
      let token = '';
      try {
        token = localStorage.getItem(DEVICE_TOKEN_KEY) || '';
        if (!token && window.name && window.name.includes('||DEVTOKEN:')) {
          token = window.name.split('||DEVTOKEN:')[1].split('||')[0] || '';
        }
        if (!token) {
          token = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        }
        localStorage.setItem(DEVICE_TOKEN_KEY, token);
      } catch (e) {
        token = 'dev_fallback';
      }
      return token;
    }

    const MY_DEVICE_TOKEN = getOrCreateDeviceToken();

    function getLockedPlayerName() {
      try {
        const locked = (localStorage.getItem(LOCKED_NAME_KEY) || '').trim();
        if (locked) return locked;
        const legacy = (localStorage.getItem('hoermann_player_name') || '').trim();
        if (legacy) {
          localStorage.setItem(LOCKED_NAME_KEY, legacy);
          return legacy;
        }
      } catch (e) {}
      return '';
    }

    function setLockedPlayerName(name) {
      const clean = String(name || '').trim().slice(0, 20);
      if (!clean) return;
      try {
        localStorage.setItem(LOCKED_NAME_KEY, clean);
        localStorage.setItem('hoermann_player_name', clean);
        const owners = loadNameOwnersMap();
        const key = clean.toLowerCase();
        if (!owners[key]) {
          owners[key] = MY_DEVICE_TOKEN;
          saveNameOwnersMap(owners);
        }
      } catch (e) {}
      refreshLockedNameUi();
    }

    function loadNameOwnersMap() {
      try {
        const raw = localStorage.getItem(NAME_OWNERS_KEY);
        if (raw) return JSON.parse(raw) || {};
      } catch (e) {}
      return {};
    }

    function saveNameOwnersMap(map) {
      try {
        localStorage.setItem(NAME_OWNERS_KEY, JSON.stringify(map || {}));
      } catch (e) {}
    }

    // Prüft, ob ein Name bereits einem anderen Spieler/Gerät oder einem Hörmann-NPC gehört
    function isNameTakenByAnotherPlayer(candidateName) {
      const clean = String(candidateName || '').trim();
      if (!clean) return { taken: false, reason: '' };
      const key = clean.toLowerCase();
      const myLocked = getLockedPlayerName().toLowerCase();

      // Wenn es bereits der eigene feste Name auf diesem Gerät ist -> immer erlaubt!
      if (myLocked && myLocked === key) {
        return { taken: false, reason: '' };
      }

      // 1. Prüfen, ob es ein reservierter NPC-Name ist
      const categories = HoermannGameReleases.categories;
      for (const cat of categories) {
        const npcs = defaultLeaderboards[cat] || [];
        if (npcs.some(n => n.name.trim().toLowerCase() === key)) {
          return {
            taken: true,
            reason: `Der Name „${clean}“ gehört einem festen Hörmann-Charakter. Bitte wähle deinen eigenen Spitznamen!`
          };
        }
      }

      // 2. Prüfen, ob ein anderes Gerät diesen Namen bereits registriert hat
      const owners = loadNameOwnersMap();
      if (owners[key] && owners[key] !== MY_DEVICE_TOKEN) {
        return {
          taken: true,
          reason: `Der Name „${clean}“ ist bereits fest an einen anderen Spieler vergeben! Bitte wähle deinen eigenen Namen.`
        };
      }

      // 3. Prüfen, ob der Name schon in den Online-Bestenlisten existiert (und nicht der eigene gespeicherte Name ist)
      const master = loadMasterUserScores();
      for (const cat of categories) {
        const list = master[cat] || [];
        if (list.some(entry => entry.name && entry.name.trim().toLowerCase() === key)) {
          if (!owners[key] || owners[key] !== MY_DEVICE_TOKEN) {
            return {
              taken: true,
              reason: `Der Name „${clean}“ steht bereits für einen anderen Spieler in der Bestenliste! Fremde Namen können nicht genutzt werden.`
            };
          }
        }
      }

      return { taken: false, reason: '' };
    }

    function refreshLockedNameUi() {
      const locked = getLockedPlayerName();
      const renameAlreadyUsed = localStorage.getItem(RENAME_REQ_USED_KEY) === '1';
      if (locked) {
        if (playerNameInput) {
          playerNameInput.value = locked;
          playerNameInput.readOnly = true;
        }
        if (lockedPlayerBadge && lockedPlayerNameText) {
          lockedPlayerNameText.textContent = locked;
          lockedPlayerBadge.style.display = 'flex';
        }
        if (openRenameReqBtn) {
          openRenameReqBtn.style.display = renameAlreadyUsed ? 'none' : 'inline-flex';
        }
        if (chatRenameReqBtn) {
          chatRenameReqBtn.style.display = renameAlreadyUsed ? 'none' : 'inline-flex';
        }
        if (firstTimeNameRow) {
          firstTimeNameRow.style.display = 'none';
        }
        const chatSenderEl = document.getElementById('chat-sender-input');
        if (chatSenderEl) {
          chatSenderEl.value = locked;
          chatSenderEl.readOnly = true;
          chatSenderEl.style.background = '#f1f5f9';
          chatSenderEl.style.color = '#002d62';
          chatSenderEl.style.fontWeight = '800';
          chatSenderEl.title = 'Dein fester Spielername (identisch mit der Bestenliste)';
        }
      } else {
        if (playerNameInput) {
          playerNameInput.readOnly = false;
        }
        if (lockedPlayerBadge) {
          lockedPlayerBadge.style.display = 'none';
        }
        if (openRenameReqBtn) openRenameReqBtn.style.display = 'none';
        if (chatRenameReqBtn) chatRenameReqBtn.style.display = 'none';
        if (firstTimeNameRow) {
          firstTimeNameRow.style.display = 'flex';
        }
      }
    }

    function loadRenameState() {
      try {
        const raw = localStorage.getItem(RENAME_STATE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            requests: Array.isArray(parsed.requests) ? parsed.requests : [],
            approvedRenames: Array.isArray(parsed.approvedRenames) ? parsed.approvedRenames : [],
            rejectedIds: Array.isArray(parsed.rejectedIds) ? parsed.rejectedIds : []
          };
        }
      } catch (e) {}
      return { requests: [], approvedRenames: [], rejectedIds: [] };
    }

    function saveRenameState(state) {
      try {
        localStorage.setItem(RENAME_STATE_KEY, JSON.stringify(state));
      } catch (e) {}
    }

    // Führt eine vom Admin genehmigte Namensänderung für Highscores, Chat, Meilensteine & dieses Gerät aus
    function applySingleApprovedRename(renObj, localMaster, chatState, ideasState, milestones) {
      if (!renObj || !renObj.oldName || !renObj.newName) return false;
      const oldClean = String(renObj.oldName).trim();
      const newClean = String(renObj.newName).trim().slice(0, 20);
      if (!oldClean || !newClean) return false;
      const oldKey = oldClean.toLowerCase();
      const newKey = newClean.toLowerCase();
      let changed = false;

      // 1. In allen 8 Bestenlisten alten Namen auf neuen Namen umschreiben
      HoermannGameReleases.categories.forEach(cat => {
        if (!Array.isArray(localMaster[cat])) return;
        let catTouched = false;
        localMaster[cat].forEach(entry => {
          if (entry && entry.name && entry.name.trim().toLowerCase() === oldKey) {
            entry.name = newClean;
            catTouched = true;
            changed = true;
          }
        });
        if (catTouched) {
          localMaster[cat] = deduplicateKeepBestPerName(localMaster[cat]);
        }
      });

      // 2. Im Chatverlauf alten Absendernamen aktualisieren
      if (chatState && Array.isArray(chatState.messages)) {
        chatState.messages.forEach(m => {
          if (m && m.sender && m.sender.trim().toLowerCase() === oldKey) {
            m.sender = newClean;
            changed = true;
          }
        });
      }

      // 3. In Ideen-Einträgen aktualisieren
      if (ideasState && Array.isArray(ideasState.ideas)) {
        ideasState.ideas.forEach(idItem => {
          if (idItem && idItem.player && idItem.player.trim().toLowerCase() === oldKey) {
            idItem.player = newClean;
            changed = true;
          }
        });
      }

      // 4. Eigentümer-Zuordnung (nameOwners) übertragen
      const owners = loadNameOwnersMap();
      const ownerToken = renObj.deviceToken || owners[oldKey] || '';
      if (ownerToken) {
        delete owners[oldKey];
        owners[newKey] = ownerToken;
        saveNameOwnersMap(owners);
      }

      // 5. Meilensteine übertragen
      if (milestones && typeof milestones === 'object') {
        HoermannGameReleases.categories.forEach(cat => {
          const oldMKey = `${cat}:${oldKey}`;
          const newMKey = `${cat}:${newKey}`;
          if (milestones[oldMKey]) {
            milestones[newMKey] = { ...milestones[oldMKey] };
            changed = true;
          }
        });
      }

      // 6. Wenn DIESES Gerät der Antragsteller ist -> lokalen gesperrten Namen automatisch auf den neuen Namen ändern!
      const myLocked = getLockedPlayerName();
      if ((renObj.deviceToken && renObj.deviceToken === MY_DEVICE_TOKEN) || (myLocked && myLocked.toLowerCase() === oldKey)) {
        if (myLocked !== newClean) {
          try {
            localStorage.setItem(LOCKED_NAME_KEY, newClean);
            localStorage.setItem('hoermann_player_name', newClean);
          } catch (e) {}
          refreshLockedNameUi();
          showToast(`✅ Dein Namensantrag wurde genehmigt! Dein neuer fester Name ist jetzt „${newClean}“.`);
          changed = true;
        }
      }

      return changed;
    }

    // Lokaler & Cloud-synchronisierter Status für Chat, gelöschte Nachrichten, Spieler-Ideen & Spieler-Meilensteine
    const CHAT_STORAGE_KEY      = 'hoermann_mut_live_chat_v3';
    const IDEAS_STORAGE_KEY     = 'hoermann_mut_player_ideas_v3';
    const MILESTONE_STORAGE_KEY = 'hoermann_mut_idea_milestones_v3';
    const CUSTOM_ADMIN_HASH_KEY = 'hoermann_mut_custom_admin_hash_v3';

    // SHA-256 Hashes der Admin-Zugänge (KEIN Klartext-Passwort oder E-Mail im Quellcode sichtbar!)
    const DEFAULT_ADMIN_HASHES = new Set([
      'e6ebcbc1b665b1572775d503c80d174bf29028ad57f81e2f649e1de765c14fb5',
      '90bbc9533a02213ffdf4d1482eb9b97a5feec554e33641d40f24777cbe5a8341'
    ]);
    let isAdminUnlocked = sessionStorage.getItem('hoermann_admin_unlocked') === '1';
    let activeAdminTab  = 'chat';

    // In-Memory-Sicherung für den Live-Chat (Garantiert, dass neu geschriebene Nachrichten NIEMALS verschwinden, selbst wenn localStorage durch ein großes GIF voll sein sollte!)
    let inMemoryChatCache = null;

    function deduplicateAndSortChatMessages(messages, deletedIds, clearedBefore) {
      const delSet = new Set(Array.isArray(deletedIds) ? deletedIds : []);
      const clearTs = Number(clearedBefore) || 0;
      const byId = new Map();
      (Array.isArray(messages) ? messages : []).forEach(m => {
        if (!m || !m.id || (!m.text && !m.gifUrl)) return;
        if (delSet.has(m.id)) return;
        const msgTs = Number(m.ts) || 0;
        if (clearTs > 0 && msgTs > 0 && msgTs < clearTs) return;
        const prev = byId.get(m.id);
        byId.set(m.id, {
          id: String(m.id),
          sender: String(m.sender || (prev && prev.sender) || 'Spieler').slice(0, 24),
          text: String(m.text !== undefined ? m.text : (prev ? prev.text : '')).slice(0, 300),
          gifUrl: m.gifUrl ? String(m.gifUrl).slice(0, 120000) : (prev && prev.gifUrl ? prev.gifUrl : ''),
          time: String(m.time || (prev && prev.time) || 'Heute'),
          ts: msgTs || (prev && prev.ts) || 1729660000000
        });
      });
      return Array.from(byId.values())
        .sort((a, b) => (a.ts || 0) - (b.ts || 0))
        .slice(-80);
    }

    function loadChatState() {
      let stored = null;
      try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          stored = JSON.parse(raw);
        }
      } catch (e) {}

      const baseMessages = [
        {
          id: 'welcome_msg_1',
          sender: 'Lagermeister Nico',
          text: 'Willkommen im Hörmann Live-Chat! Hier könnt ihr euch ungefiltert austauschen & eure Rekorde feiern. 🚜🔥',
          time: 'Live',
          ts: 1729660000000
        },
        {
          id: 'msg_1792740422298_ker2s',
          sender: 'Sibbelinho',
          text: 'Dies ist ein Test',
          gifUrl: '',
          time: '23.10. 09:27',
          ts: 1792740422298
        },
        {
          id: 'msg_1792740503540_m420z',
          sender: 'Mary',
          text: 'Hallöchen ihr Spielemäuse',
          gifUrl: '',
          time: '23.10. 09:28',
          ts: 1792740503540
        },
        {
          id: 'msg_1792740527347_t2c8i',
          sender: 'Sibbelinho',
          text: 'Guck guck',
          gifUrl: '',
          time: '23.10. 09:28',
          ts: 1792740527347
        },
        {
          id: 'msg_1792743552905_bqvmt',
          sender: 'Sibbelinho',
          text: '',
          gifUrl: 'https://media3.giphy.com/media/v1.Y2lkPWE1YTU4ZDcwaXhncGE0dWkyYzFweHB3ZGNzY2h6Njh1YW42Mm1kaWEwa252eGhhayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cO39srN2EUIRaVqaVq/200.gif',
          time: '23.10. 10:19',
          ts: 1792743552905
        },
        {
          id: 'msg_1792744140798_6n0kl',
          sender: 'Der wahre Mario',
          text: '',
          gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPWE1YTU4ZDcwOXNvenc2a3dpenR2YjA3MmpoYWN0eWM3ZXVmdmZqMm5oYXViZnN4MiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/75ZaxapnyMp2w/200.gif',
          time: '23.10. 10:29',
          ts: 1792744140798
        },
        {
          id: 'msg_1792744145137_ywlqi',
          sender: 'Sibbelinho',
          text: '',
          gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPWE1YTU4ZDcwM3AyampxczZydWltNDVtMzRsYTQ5djY3YWFtcW52Y250YTFraGJyYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mcH0upG1TeEak/200.gif',
          time: '23.10. 10:29',
          ts: 1792744145137
        },
        {
          id: 'msg_1792747803823_rbinv',
          sender: 'Jensiboi',
          text: 'Stimmung!',
          gifUrl: 'https://media4.giphy.com/media/v1.Y2lkPWE1YTU4ZDcwODkwYzZodzk2anhpOWVtZmp4ZGo1MGg5bmcwaWFtaDEzMHRtbWwwbSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10dHotK4K8R0AM/200.gif',
          time: '23.10. 11:30',
          ts: 1792747803823
        }
      ];

      const mergedDeleted = Array.from(new Set([
        ...(stored && Array.isArray(stored.deletedIds) ? stored.deletedIds : []),
        ...(inMemoryChatCache && Array.isArray(inMemoryChatCache.deletedIds) ? inMemoryChatCache.deletedIds : [])
      ]));
      const mergedClearedBefore = Math.max(
        Number(stored && stored.clearedBefore) || 0,
        Number(inMemoryChatCache && inMemoryChatCache.clearedBefore) || 0
      );

      const rawList = [
        ...baseMessages,
        ...(stored && Array.isArray(stored.messages) ? stored.messages : []),
        ...(inMemoryChatCache && Array.isArray(inMemoryChatCache.messages) ? inMemoryChatCache.messages : [])
      ];

      const finalState = {
        messages: deduplicateAndSortChatMessages(rawList, mergedDeleted, mergedClearedBefore),
        deletedIds: mergedDeleted,
        clearedBefore: mergedClearedBefore
      };
      inMemoryChatCache = finalState;
      return finalState;
    }

    function saveChatState(state) {
      if (!state || typeof state !== 'object') return;
      const cleanState = {
        messages: deduplicateAndSortChatMessages(state.messages, state.deletedIds, state.clearedBefore),
        deletedIds: Array.isArray(state.deletedIds) ? state.deletedIds.slice(-150) : [],
        clearedBefore: Number(state.clearedBefore) || 0
      };
      inMemoryChatCache = cleanState;
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleanState));
      } catch (e) {
        // Falls localStorage wegen eines großen Base64-Bildes voll ist, ältere Base64-Bilder für localStorage kürzen, damit Textnachrichten immer Platz haben
        try {
          const compact = {
            ...cleanState,
            messages: cleanState.messages.slice(-40).map((m, idx, arr) => ({
              ...m,
              gifUrl: (m.gifUrl && m.gifUrl.startsWith('data:') && idx < arr.length - 5) ? '' : m.gifUrl
            }))
          };
          localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(compact));
        } catch (e2) {}
      }
    }

    function loadIdeasState() {
      try {
        const raw = localStorage.getItem(IDEAS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
            deletedIdeaIds: Array.isArray(parsed.deletedIdeaIds) ? parsed.deletedIdeaIds : []
          };
        }
      } catch (e) {}
      return { ideas: [], deletedIdeaIds: [] };
    }

    function saveIdeasState(state) {
      try {
        localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
    }

    function loadPlayerMilestones() {
      try {
        const raw = localStorage.getItem(MILESTONE_STORAGE_KEY);
        if (raw) return JSON.parse(raw) || {};
      } catch (e) {}
      return {};
    }

    function savePlayerMilestones(m) {
      try {
        localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(m));
      } catch (e) {}
    }

    // Vergleicht zwei Versions-Strings (z.B. "2.7.0" > "2.6.0"), damit niemals ältere SSE-Nachrichten ein Update auslösen!
    function isNewerSemver(remoteVer, localVer) {
      if (!remoteVer || !localVer) return false;
      const rParts = String(remoteVer).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
      const lParts = String(localVer).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
      for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
        const r = rParts[i] || 0;
        const l = lParts[i] || 0;
        if (r > l) return true;
        if (r < l) return false;
      }
      return false;
    }

    // Prüft, ob der Spieler sich gerade mitten in einem der 6 Spiele befindet (damit ein Live-Update ihn NIEMALS aus einer laufenden Runde wirft!)
    function isPlayerCurrentlyInGame() {
      const activeGameViews = [forkliftView, towerView, pacmanView, slotsView, marioView, busterView, nerveView, parcoursView];
      const inAnyGameView = activeGameViews.some(v => v && v.style.display === 'flex');
      const inSubmitDialog = scoreSubmitDialog && scoreSubmitDialog.classList.contains('show');
      return Boolean(inAnyGameView || inSubmitDialog);
    }

    let pendingDeferredUpdate = null;

    // Prüft vor dem Anzeigen des Update-Modals, ob SOWOHL version.json ALS AUCH die komplette neue index.html (inkl. </html>) auf dem Server fertig ausgerollt sind!
    async function verifyAndPrefetchNewHtml(targetVersion) {
      try {
        // 1. Prüfen, ob das CDN bereits die aktuelle version.json ausliefert
        const vRes = await fetch(`./version.json?_verify=${encodeURIComponent(targetVersion)}_${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });
        if (!vRes.ok) return false;
        const vJson = await vRes.json();
        if (!vJson || String(vJson.version).trim() !== String(targetVersion).trim()) {
          return false;
        }

        // 2. Komplette neue HTML-Datei vorab in den Speicher laden & auf Vollständigkeit prüfen
        const cleanPath = window.location.origin + window.location.pathname;
        const res = await fetch(`${cleanPath}?_verify=${encodeURIComponent(targetVersion)}_${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return false;
        const htmlText = await res.text();
        const hasExactVersion = htmlText && (
          htmlText.includes(`APP_VERSION           = '${targetVersion}'`) ||
          htmlText.includes(`Version ${targetVersion}`)
        );
        const isCompleteHtml = htmlText && htmlText.includes('</html>') && htmlText.length > 50000;
        if (hasExactVersion && isCompleteHtml) {
          prefetchedNewHtml = htmlText;
          return true;
        }
      } catch (e) {}
      return false;
    }

    // Wechselt per normaler Navigation in einen frischen JavaScript-Kontext
    async function performHardCacheBustReload(targetVersion) {
      try {
        sessionStorage.setItem('hoermann_updated_to_version', String(targetVersion || ''));
      } catch (e) {}

      // Normal navigation replaces the JS context and all old game loops.
      hideAllViews();
      const cleanPath = window.location.origin + window.location.pathname;
      window.location.replace(`${cleanPath}?v=${encodeURIComponent(targetVersion || Date.now())}&t=${Date.now()}`);
    }

    function showDeferredUpdateBanner(remoteVersion, releaseNotes) {
      pendingDeferredUpdate = { version: remoteVersion, notes: releaseNotes };
      const bar = document.getElementById('deferred-update-bar');
      const verSpan = document.getElementById('deferred-update-ver');
      const applyBtn = document.getElementById('deferred-update-apply-btn');
      if (verSpan) verSpan.textContent = `v${remoteVersion}`;
      if (bar) bar.style.display = 'flex';
      if (applyBtn) {
        applyBtn.onclick = () => {
          if (bar) bar.style.display = 'none';
          performHardCacheBustReload(remoteVersion);
        };
      }
    }

    function checkAndApplyDeferredUpdateIfOutOfGame() {
      if (!pendingDeferredUpdate || updateForcedAlready) return;
      if (!isPlayerCurrentlyInGame()) {
        const { version, notes } = pendingDeferredUpdate;
        pendingDeferredUpdate = null;
        const bar = document.getElementById('deferred-update-bar');
        if (bar) bar.style.display = 'none';
        triggerForcedUpdateModal(version, notes);
      }
    }

    async function triggerForcedUpdateModal(remoteVersion, releaseNotes) {
      if (updateForcedAlready) return;
      if (!isNewerSemver(remoteVersion, APP_VERSION)) return;

      // Schutz gegen Endlosschleife, falls soeben schon auf diese Version aktualisiert wurde
      try {
        if (sessionStorage.getItem('hoermann_updated_to_version') === String(remoteVersion)) {
          return;
        }
      } catch (e) {}

      // 1. Erst sicherstellen, dass das CDN (GitHub Pages) sowohl version.json als auch die komplette neue index.html (inkl. </html>) zu 100% bereitstellt!
      const isHtmlReadyOnCdn = await verifyAndPrefetchNewHtml(remoteVersion);
      if (!isHtmlReadyOnCdn) {
        // Noch nicht vollständig auf dem Server bereit -> Spieler noch NICHT benachrichtigen, sondern im nächsten Intervall lautlos erneut prüfen!
        return;
      }

      // 2. SPIELSCHUTZ: Falls der Spieler gerade mitten in einem Spiel ist (oder seinen Highscore einträgt), KEIN Popup öffnen und NICHT rauswerfen!
      if (isPlayerCurrentlyInGame()) {
        showDeferredUpdateBanner(remoteVersion, releaseNotes);
        return;
      }

      if (updateForcedAlready) return;
      updateForcedAlready = true;

      const overlay     = document.getElementById('force-update-overlay');
      const notesEl     = document.getElementById('force-update-notes');
      const countEl     = document.getElementById('force-update-countdown');
      const nowBtn      = document.getElementById('force-update-now-btn');
      const postponeBtn = document.getElementById('force-update-postpone-btn');

      if (notesEl) {
        notesEl.textContent = releaseNotes
          ? `Neu in v${remoteVersion}: ${releaseNotes}`
          : `Neue Version v${remoteVersion} ist komplett geladen (Aktuell: v${APP_VERSION})`;
      }
      if (overlay) {
        overlay.style.display = 'flex';
        if (nowBtn) nowBtn.focus({ preventScroll: true });
      }
      playSound('powerup');

      let secondsLeft = 12;
      if (countEl) countEl.textContent = secondsLeft;

      let timer = null;
      if (nowBtn) {
        nowBtn.onclick = () => {
          if (timer) clearInterval(timer);
          nowBtn.disabled = true;
          nowBtn.textContent = '🚀 Schalte sofort auf neue Version um...';
          performHardCacheBustReload(remoteVersion);
        };
      }

      if (postponeBtn) {
        postponeBtn.onclick = () => {
          if (timer) clearInterval(timer);
          if (overlay) overlay.style.display = 'none';
          updateForcedAlready = false;
          showDeferredUpdateBanner(remoteVersion, releaseNotes);
        };
      }

      timer = setInterval(() => {
        // Falls der Spieler inzwischen ein Spiel gestartet hat, Countdown sofort abbrechen & auf Spielende verschieben!
        if (isPlayerCurrentlyInGame()) {
          clearInterval(timer);
          if (overlay) overlay.style.display = 'none';
          updateForcedAlready = false;
          showDeferredUpdateBanner(remoteVersion, releaseNotes);
          return;
        }
        secondsLeft--;
        if (countEl) countEl.textContent = Math.max(0, secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(timer);
          performHardCacheBustReload(remoteVersion);
        }
      }, 1000);
    }

    // Prüft regelmäßig version.json auf dem Server (mit Zeitstempel gegen Browser-Cache)
    async function checkServerAppVersion() {
      if (updateForcedAlready) return;
      try {
        const res = await fetch(`./version.json?nocache=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const vData = await res.json();
          if (vData && vData.version && isNewerSemver(vData.version, APP_VERSION)) {
            await triggerForcedUpdateModal(vData.version, vData.notes);
          }
        }
      } catch (e) {}
    }

    window.addEventListener('focus', checkServerAppVersion);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkServerAppVersion();
        syncOnlineLeaderboards(false);
      }
    });
    setInterval(() => { if (document.visibilityState === 'visible') checkServerAppVersion(); }, 20000);
    setTimeout(checkServerAppVersion, 1500);

    function setCloudBadgeState(status, text) {
      if (!cloudSyncBadge) return;
      if (status === 'syncing') {
        cloudSyncBadge.style.background = '#fef3c7';
        cloudSyncBadge.style.color = '#b45309';
        cloudSyncBadge.style.borderColor = '#fcd34d';
        cloudSyncBadge.textContent = text || '🔄 Synchronisiere Online-Daten...';
      } else if (status === 'online') {
        cloudSyncBadge.style.background = '#dcfce7';
        cloudSyncBadge.style.color = '#15803d';
        cloudSyncBadge.style.borderColor = '#86efac';
        cloudSyncBadge.textContent = text || '🟢 ONLINE LIVE-BESTENLISTE (NUR BESTWERT PRO SPIELER)';
      } else {
        cloudSyncBadge.style.background = '#f1f5f9';
        cloudSyncBadge.style.color = '#475569';
        cloudSyncBadge.style.borderColor = '#cbd5e1';
        cloudSyncBadge.textContent = text || '💾 Lokal gespeichert (Online-Sync folgt)';
      }
    }

    // Führt einen eingehenden Snapshot oder ein Echtzeit-Event mit dem lokalen Stand zusammen
    function applyIncomingCloudData(data, localMaster, chatState, ideasState, milestones) {
      if (!data || typeof data !== 'object') return false;
      let changed = false;

      if (data.version && data.version !== APP_VERSION) {
        checkServerAppVersion();
      }

      if (data.scores) {
        if (mergeScoreMaps(localMaster, data.scores)) changed = true;
      } else if (HoermannGameReleases.categories.some(category => Array.isArray(data[category]))) {
        if (mergeScoreMaps(localMaster, data)) changed = true;
      }

      if (typeof data.clearedBefore === 'number' && data.clearedBefore > chatState.clearedBefore) {
        chatState.clearedBefore = data.clearedBefore;
        changed = true;
      }

      if (Array.isArray(data.deletedChatIds)) {
        data.deletedChatIds.forEach(id => {
          if (id && !chatState.deletedIds.includes(id)) {
            chatState.deletedIds.push(id);
            changed = true;
          }
        });
      }

      if (Array.isArray(data.chat)) {
        const beforeSignature = chatState.messages.map(m => `${m.id}:${m.text || ''}:${m.gifUrl || ''}`).join('|');
        const combinedChat = [...chatState.messages, ...data.chat];
        chatState.messages = deduplicateAndSortChatMessages(combinedChat, chatState.deletedIds, chatState.clearedBefore);
        const afterSignature = chatState.messages.map(m => `${m.id}:${m.text || ''}:${m.gifUrl || ''}`).join('|');
        if (beforeSignature !== afterSignature) {
          changed = true;
        }
      } else {
        chatState.messages = deduplicateAndSortChatMessages(chatState.messages, chatState.deletedIds, chatState.clearedBefore);
      }

      if (Array.isArray(data.deletedIdeaIds)) {
        data.deletedIdeaIds.forEach(id => {
          if (id && !ideasState.deletedIdeaIds.includes(id)) {
            ideasState.deletedIdeaIds.push(id);
            changed = true;
          }
        });
      }

      if (Array.isArray(data.ideas)) {
        const existingIdeaIds = new Set(ideasState.ideas.map(i => i.id));
        data.ideas.forEach(idea => {
          if (!idea || !idea.id || !idea.text) return;
          if (ideasState.deletedIdeaIds.includes(idea.id)) return;
          if (!existingIdeaIds.has(idea.id)) {
            ideasState.ideas.push({
              id: String(idea.id),
              player: String(idea.player || 'Spieler').slice(0, 24),
              game: String(idea.game || ''),
              score: Number(idea.score) || 0,
              rank: Number(idea.rank) || 0,
              reason: String(idea.reason || 'Highscore-Idee'),
              text: String(idea.text).slice(0, 500),
              date: String(idea.date || 'Heute'),
              ts: Number(idea.ts) || Date.now()
            });
            existingIdeaIds.add(idea.id);
            changed = true;
          }
        });
      }

      ideasState.ideas = ideasState.ideas
        .filter(i => !ideasState.deletedIdeaIds.includes(i.id))
        .sort((a, b) => (b.ts || 0) - (a.ts || 0))
        .slice(0, 100);

      if (data.milestones && typeof data.milestones === 'object') {
        Object.keys(data.milestones).forEach(k => {
          const inc = data.milestones[k];
          if (!inc) return;
          if (!milestones[k]) {
            milestones[k] = { ...inc };
            changed = true;
          } else {
            if (inc.firstIdeaUsed) milestones[k].firstIdeaUsed = true;
            if (inc.wasEverInTop3) milestones[k].wasEverInTop3 = true;
            if (typeof inc.bestTop3RankIdeaUsed === 'number') {
              if (typeof milestones[k].bestTop3RankIdeaUsed !== 'number' || inc.bestTop3RankIdeaUsed < milestones[k].bestTop3RankIdeaUsed) {
                milestones[k].bestTop3RankIdeaUsed = inc.bestTop3RankIdeaUsed;
              }
            }
          }
        });
      }

      if (data.nameOwners && typeof data.nameOwners === 'object') {
        const owners = loadNameOwnersMap();
        Object.keys(data.nameOwners).forEach(k => {
          if (data.nameOwners[k] && !owners[k]) {
            owners[k] = String(data.nameOwners[k]);
            changed = true;
          }
        });
        saveNameOwnersMap(owners);
      }

      // Namensänderungs-Anträge & bereits vom Admin genehmigte Namensänderungen abgleichen
      const renameState = loadRenameState();
      let renameStateChanged = false;

      if (Array.isArray(data.rejectedRenameIds)) {
        data.rejectedRenameIds.forEach(id => {
          if (id && !renameState.rejectedIds.includes(id)) {
            renameState.rejectedIds.push(id);
            renameStateChanged = true;
            changed = true;
          }
        });
      }

      if (Array.isArray(data.approvedRenames)) {
        const existingApprovedIds = new Set(renameState.approvedRenames.map(a => a.id));
        data.approvedRenames.forEach(ren => {
          if (!ren || !ren.oldName || !ren.newName) return;
          const renId = ren.id || `${ren.oldName}->${ren.newName}`;
          if (!existingApprovedIds.has(renId)) {
            renameState.approvedRenames.push({ ...ren, id: renId });
            existingApprovedIds.add(renId);
            renameStateChanged = true;
          }
          if (applySingleApprovedRename(ren, localMaster, chatState, ideasState, milestones)) {
            changed = true;
          }
        });
      }

      if (Array.isArray(data.renameRequests)) {
        const existingReqIds = new Set(renameState.requests.map(r => r.id));
        const approvedSet = new Set(renameState.approvedRenames.map(a => a.id));
        data.renameRequests.forEach(req => {
          if (!req || !req.id || !req.oldName || !req.newName) return;
          if (renameState.rejectedIds.includes(req.id) || approvedSet.has(req.id)) return;
          if (!existingReqIds.has(req.id)) {
            renameState.requests.push({
              id: String(req.id),
              oldName: String(req.oldName).slice(0, 20),
              newName: String(req.newName).slice(0, 20),
              deviceToken: String(req.deviceToken || ''),
              date: String(req.date || 'Heute'),
              ts: Number(req.ts) || Date.now()
            });
            existingReqIds.add(req.id);
            renameStateChanged = true;
            changed = true;
          }
        });
      }

      const approvedIdsNow = new Set(renameState.approvedRenames.map(a => a.id));
      renameState.requests = renameState.requests.filter(
        r => !renameState.rejectedIds.includes(r.id) && !approvedIdsNow.has(r.id)
      );
      if (renameStateChanged) {
        saveRenameState(renameState);
      }

      if (data.customAdminHash && typeof data.customAdminHash === 'string' && data.customAdminHash.length === 64) {
        localStorage.setItem(CUSTOM_ADMIN_HASH_KEY, data.customAdminHash);
      }

      return changed;
    }

    // Schreibt ein Ereignis (Score, Chat, Idee ...) in die Firebase-Cloud (Firestore).
    // Ohne Payload: überträgt die eigenen lokalen Bestwerte einmalig in die Cloud (Migration).
    async function publishCloudSnapshot(payload = null) {
      try {
        if (payload) {
          await HoermannCloud.publish(payload);
        } else {
          const me = getLockedPlayerName().toLowerCase();
          const master = loadMasterUserScores();
          if (me) {
            for (const cat of HoermannGameReleases.categories) {
              for (const e of (master[cat] || [])) {
                if (e && e.name && e.name.trim().toLowerCase() === me) {
                  await HoermannCloud.publish({ type: 'SCORE', cat, name: e.name, score: e.score, date: e.date });
                }
              }
            }
          }
        }
        setCloudBadgeState('online');
      } catch (e) { setCloudBadgeState('offline'); }
    }

    // Verhindert überlappende Cloud-Sync-Läufe, damit niemals ein alter Sync-Stand eine gerade geschriebene Chat-Nachricht überschreibt!

    // Hilfsfunktion: Verarbeitet ein einzelnes Cloud-Ereignis in die übergebenen Status-Objekte
    function processSingleNtfyPayload(payload, localMaster, chatState, ideasState, milestones) {
      if (!payload || typeof payload !== 'object') return { changed: false, scoreToast: null };
      let changed = false;
      let scoreToast = null;

      if (payload.type === 'FORCE_UPDATE' && payload.version && isNewerSemver(payload.version, APP_VERSION)) {
        triggerForcedUpdateModal(payload.version, payload.notes);
      } else if (payload.type === 'SCORE' && payload.cat && payload.name && payload.score) {
        if (payload.deviceToken && payload.name) {
          if (applyIncomingCloudData({ nameOwners: { [String(payload.name).trim().toLowerCase()]: payload.deviceToken } }, localMaster, chatState, ideasState, milestones)) {
            changed = true;
          }
        }
        if (mergeScoreMaps(localMaster, { [payload.cat]: [{ name: payload.name, score: payload.score, date: payload.date || 'Heute', isUser: true }] })) {
          changed = true;
          scoreToast = { name: payload.name, score: payload.score, cat: payload.cat };
        }
      } else if (payload.type === 'CHAT_MSG' && payload.msg) {
        if (applyIncomingCloudData({ chat: [payload.msg] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'CHAT_DELETE' && payload.msgId) {
        if (applyIncomingCloudData({ deletedChatIds: [payload.msgId] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'CHAT_CLEAR' && payload.clearedBefore) {
        if (applyIncomingCloudData({ clearedBefore: payload.clearedBefore }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'IDEA_ADD' && payload.idea) {
        if (applyIncomingCloudData({ ideas: [payload.idea] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'IDEA_DELETE' && payload.ideaId) {
        if (applyIncomingCloudData({ deletedIdeaIds: [payload.ideaId] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'RENAME_REQ' && (payload.renameReq || payload.req)) {
        if (applyIncomingCloudData({ renameRequests: [payload.renameReq || payload.req] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'RENAME_APPROVE' && (payload.approvedRename || payload.ren)) {
        if (applyIncomingCloudData({ approvedRenames: [payload.approvedRename || payload.ren] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'RENAME_REJECT' && payload.reqId) {
        if (applyIncomingCloudData({ rejectedRenameIds: [payload.reqId] }, localMaster, chatState, ideasState, milestones)) changed = true;
      } else if (payload.type === 'ADMIN_HASH' && payload.customAdminHash) {
        if (applyIncomingCloudData({ customAdminHash: payload.customAdminHash }, localMaster, chatState, ideasState, milestones)) changed = true;
      }
      return { changed, scoreToast };
    }

    // Verarbeitet Daten aus der Cloud (Start: alles Bestehende, danach live Änderungen).
    function applyLiveItems(items) {
      try {
        const localMaster = loadMasterUserScores();
        const chatState   = loadChatState();
        const ideasState  = loadIdeasState();
        const milestones  = loadPlayerMilestones();
        let anyChanged = false, toast = null;
        items.forEach(item => {
          if (item && item.type === 'FORCE_UPDATE' && item.version && isNewerSemver(item.version, APP_VERSION)) {
            triggerForcedUpdateModal(item.version, item.notes);
            return;
          }
          const r = processSingleNtfyPayload(item, localMaster, chatState, ideasState, milestones);
          if (r.changed) anyChanged = true;
          if (r.scoreToast) toast = r.scoreToast;
        });
        hasCompletedInitialCloudSync = true;
        if (!anyChanged) return;
        saveMasterUserScores(localMaster);
        saveChatState(chatState);
        saveIdeasState(ideasState);
        savePlayerMilestones(milestones);
        HoermannGameReleases.categories.forEach(cat => {
          const combined = deduplicateKeepBestPerName([...(localMaster[cat] || []), ...(defaultLeaderboards[cat] || [])]);
          try { localStorage.setItem(`hoermann_lb_${cat}`, JSON.stringify(combined)); } catch (e) {}
        });
        if (typeof renderChatMessages === 'function') renderChatMessages();
        if (typeof renderAdminIdeasList === 'function') renderAdminIdeasList();
        if (typeof renderAdminRenamesList === 'function') renderAdminRenamesList();
        if (highscoreCard.classList.contains('show')) {
          switchLeaderboardTab(activeGameCategory, (toast && toast.name) || getLockedPlayerName());
        }
        if (scoreSubmitDialog.classList.contains('show')) evaluatePersonalHighscoreCheck();
        if (typeof updateParcoursHighscoreDisplay === 'function') updateParcoursHighscoreDisplay();
        if (toast && hasCompletedInitialCloudSync && toast.name !== getLockedPlayerName()) {
          showToast(`🌐 Neuer Bestwert: ${toast.name} hat ${toast.score} Pkt erreicht! 🏆`);
        }
      } catch (e) {}
    }

    // Verbindet mit der Cloud (einmalig, Firestore hält die Live-Verbindung selbst).
    async function syncOnlineLeaderboards(pushIfLocalHasMore = false) {
      setCloudBadgeState('syncing');
      try {
        await HoermannCloud.start(applyLiveItems, setCloudBadgeState);
        if (pushIfLocalHasMore) await publishCloudSnapshot();
      } catch (e) { setCloudBadgeState('offline'); }
    }

    function startLiveScoreStream() { syncOnlineLeaderboards(false); }

    async function broadcastSingleScoreLive(category, entryObj) {
      await publishCloudSnapshot({ type: 'SCORE', cat: category, name: entryObj.name, score: entryObj.score, date: entryObj.date, ts: Date.now() });
    }

    const refreshLbBtn = document.getElementById('refresh-leaderboard-btn');
    if (refreshLbBtn) {
      refreshLbBtn.addEventListener('click', () => {
        syncOnlineLeaderboards(true);
        showToast('Online-Bestenliste & Chat werden abgeglichen... 🌐');
      });
    }

    function getGameLeaderboard(category) {
      const master = loadMasterUserScores();
      const userEntries = master[category] || [];
      const npcEntries = defaultLeaderboards[category] || [];
      return deduplicateKeepBestPerName([...userEntries, ...npcEntries]);
    }

    // Sucht den bestehenden Bestwert + Platzierung eines Spielernamens in der gesamten Bestenliste der Spielkategorie
    function findExistingPlayerBest(category, playerName) {
      if (!playerName) return null;
      const key = String(playerName).trim().toLowerCase();
      if (!key) return null;
      const fullList = getGameLeaderboard(category);
      const idx = fullList.findIndex(e => e.name.trim().toLowerCase() === key);
      if (idx === -1) return null;
      return { ...fullList[idx], rank: idx + 1 };
    }

    // Berechnet, auf welchem Platz (1-basiert) ein Spieler mit newScore landen würde
    function calculateProjectedRank(category, playerName, newScore) {
      const cleanName = (playerName && playerName.trim()) ? playerName.trim() : '__temp_player__';
      const key = cleanName.toLowerCase();
      const master = loadMasterUserScores();
      const simulated = deduplicateKeepBestPerName([
        ...(master[category] || []),
        ...(defaultLeaderboards[category] || []),
        { name: cleanName, score: Number(newScore) || 0, date: 'Heute', isUser: true }
      ]);
      const idx = simulated.findIndex(e => e.name.trim().toLowerCase() === key);
      return idx === -1 ? simulated.length : (idx + 1);
    }

    // Prüft nach den 4 Regeln, ob der Spieler eine Spiel-Idee einreichen darf
    function evaluateIdeaTicketEligibility(category, playerName, newScore, existingBest) {
      const cleanName = (playerName || '').trim();
      const nameKey = cleanName ? cleanName.toLowerCase() : '__guest__';
      const milestoneKey = `${category}:${nameKey}`;
      const milestones = loadPlayerMilestones();
      const m = milestones[milestoneKey] || {
        firstIdeaUsed: false,
        wasEverInTop3: false,
        bestTop3RankIdeaUsed: null
      };

      const oldRank = existingBest ? existingBest.rank : null;
      const newRank = calculateProjectedRank(category, cleanName, newScore);

      const hadTop3Before = Boolean(m.wasEverInTop3 || (oldRank !== null && oldRank <= 3));

      // Regel 4: In den Top 3 gewesen und sich um mindestens einen Platz innerhalb der Top 3 verbessert (z.B. Platz 3 -> 2 oder 2 -> 1)
      if (oldRank !== null && oldRank <= 3 && newRank < oldRank) {
        return {
          eligible: true,
          oldRank,
          newRank,
          rule: 'TOP3_IMPROVED',
          badge: `🥇 TOP-3 VERBESSERUNG (PLATZ ${oldRank} ➔ PLATZ ${newRank})`,
          reason: `Stark! Du hast dich in den Top 3 von Platz ${oldRank} auf Platz ${newRank} verbessert – dafür darfst du noch einmal eine Spiel-Idee einreichen!`
        };
      }

      // Regel 3: Aus den Top 3 rausgeflogen gewesen (aktuell Platz 4+ oder nicht in Top 3, aber früher schon mal Top 3 gewesen) und jetzt wieder Top 3 geschafft!
      if ((oldRank === null || oldRank > 3) && newRank <= 3 && hadTop3Before) {
        return {
          eligible: true,
          oldRank,
          newRank,
          rule: 'TOP3_COMEBACK',
          badge: `🔥 TOP-3 COMEBACK AUF PLATZ ${newRank}!`,
          reason: `Willkommen zurück auf dem Podium (Platz ${newRank})! Weil du dir deinen Platz in den Top 3 zurückerobert hast, darfst du wieder eine Idee hinterlassen!`
        };
      }

      // Regel 2: Zum ersten Mal unter die Top 3 geschafft (oder Top 3 direkt beim Einstieg erreicht)
      if (newRank <= 3 && (oldRank === null || oldRank > 3)) {
        return {
          eligible: true,
          oldRank,
          newRank,
          rule: 'TOP3_ENTRY',
          badge: `🏆 TOP-3 PODIUM ERREICHT (PLATZ ${newRank})!`,
          reason: `Mega-Leistung: Du hast es auf Platz ${newRank} unter die Top 3 geschafft! Zur Belohnung darfst du eine oder mehrere Ideen fürs Spiel hinterlassen.`
        };
      }

      // Regel 1: Erstmalige Highscore-Platzierung dieses Spielers in dieser Spiel-Bestenliste
      if (oldRank === null || !m.firstIdeaUsed) {
        return {
          eligible: true,
          oldRank,
          newRank,
          rule: 'FIRST_HIGHSCORE',
          badge: `💡 BONUS ZUR HIGHSCORE-PLATZIERUNG (PLATZ ${newRank})`,
          reason: `Glückwunsch zu deiner Highscore-Platzierung! Du darfst einmalig eine oder mehrere Ideen hinterlassen, die wir ins Spiel einbauen können.`
        };
      }

      return {
        eligible: false,
        oldRank,
        newRank,
        rule: 'NONE',
        badge: '',
        reason: ''
      };
    }

    function saveGameLeaderboard(category, newEntry) {
      const master = loadMasterUserScores();
      if (!master[category]) master[category] = [];
      let cleanEntry = null;
      if (newEntry && !Array.isArray(newEntry)) {
        cleanEntry = {
          name: newEntry.name,
          score: Number(newEntry.score) || 0,
          date: newEntry.date || 'Heute',
          isUser: true
        };
        mergeScoreMaps(master, { [category]: [cleanEntry] });
      }
      saveMasterUserScores(master);
      const combined = getGameLeaderboard(category);
      try {
        localStorage.setItem(`hoermann_lb_${category}`, JSON.stringify(combined));
      } catch (e) {}

      if (cleanEntry) {
        broadcastSingleScoreLive(category, cleanEntry);
      }
    }

    function switchLeaderboardTab(category, highlightName = "") {
      activeGameCategory = category;
      tabForkliftBtn.classList.toggle('active', HoermannGameReleases.baseGame(category) === 'forklift');
      if (tabTowerBtn) tabTowerBtn.classList.toggle('active', category === 'tower');
      if (tabPacmanBtn) tabPacmanBtn.classList.toggle('active', category === 'pacman');
      if (tabSlotsBtn) tabSlotsBtn.classList.toggle('active', category === 'slots');
      tabMarioBtn.classList.toggle('active', HoermannGameReleases.baseGame(category) === 'mario');
      tabBusterBtn.classList.toggle('active', HoermannGameReleases.baseGame(category) === 'buster');
      tabNerveBtn.classList.toggle('active', HoermannGameReleases.baseGame(category) === 'nerve');
      tabParcoursBtn.classList.toggle('active', HoermannGameReleases.baseGame(category) === 'parcours');

      const titles = {
        forklift: "🏆 Lagermeister Nico · 0.1 (bisherige Rekorde)",
        tower: "🏆 Bestenliste: 🏰 Tower of Mut (Resse im Schicksalsturm • Tutorial + 5 Level)",
        pacman: "🏆 Bestenliste: 🟡 Hörmann Mut-Man (Labyrinth, Zweifel-Geister & Power-Tore)",
        slots: "🏆 Bestenliste: 🎰 Der Hörmann Mut-Automat (Walzen & Risiko-Jackpot)",
        mario: "🏆 Super Dennis · 0.1 (bisherige Rekorde)",
        buster: "🏆 Zweifel-Buster · 0.1 (bisherige Rekorde)",
        buster_v02: "🏆 Zweifel-Buster · Update 0.2",
        forklift_v02: "🏆 Lagermeister Nico · Update 0.2 (Max: 10.000 Pkt = 100%)",
        mario_v02: "🏆 Super Dennis · Update 0.2",
        nerve_v02: "🏆 Die Mut-Probe · Update 0.2",
        parcours_v02: "🏆 Tor-Parcours · Update 0.2",
        nerve: "🏆 Die Mut-Probe · 0.1 (bisherige Rekorde)",
        parcours: "🏆 Tor-Parcours · 0.1 (bisherige Rekorde)"
      };
      globalLbTitle.textContent = titles[category] || titles.forklift;
      lbScoreColHeader.textContent = (HoermannGameReleases.baseGame(category) === 'parcours') ? 'Tore' : 'Punkte';

      const list = getGameLeaderboard(category);
      const top10 = list.slice(0, 10);
      const highlightKey = highlightName ? highlightName.trim().toLowerCase() : '';

      leaderboardBody.innerHTML = "";
      top10.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        if (highlightKey && entry.name.trim().toLowerCase() === highlightKey) {
          tr.classList.add('highlight');
        }
        let rankBadge = `${idx + 1}.`;
        if (idx === 0) rankBadge = '🥇 1.';
        if (idx === 1) rankBadge = '🥈 2.';
        if (idx === 2) rankBadge = '🥉 3.';

        const scoreLabel = (HoermannGameReleases.baseGame(category) === 'forklift')
          ? `${entry.score} <small style="color:#64748b; font-weight:600; font-size:0.75rem;">(${(entry.score / 100).toFixed(1)}%)</small>`
          : entry.score;

        const userBadge = entry.isUser
          ? ` <span style="background:rgba(245,156,0,0.18); color:#d97706; font-size:0.68rem; padding:1px 6px; border-radius:99px; margin-left:4px; font-weight:800;">⭐ BESTWERT</span>`
          : '';

        tr.innerHTML = `
          <td>${rankBadge}</td>
          <td><strong>${escapeHtml(entry.name)}</strong>${userBadge}</td>
          <td style="text-align:right; color:var(--hoermann-orange); font-weight:800; font-size:1.05rem;">
            ${scoreLabel}
          </td>
          <td style="text-align:right; color:var(--text-muted); font-size:0.8rem;">
            ${entry.date || 'Heute'}
          </td>
        `;
        leaderboardBody.appendChild(tr);
      });
      window.dispatchEvent(new Event('portal-leaderboard-change'));
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    tabForkliftBtn.addEventListener('click', () => switchLeaderboardTab(HoermannGameReleases.release('forklift').scoreCategory));
    if (tabTowerBtn) tabTowerBtn.addEventListener('click', () => switchLeaderboardTab('tower'));
    if (tabPacmanBtn) tabPacmanBtn.addEventListener('click', () => switchLeaderboardTab('pacman'));
    if (tabSlotsBtn) tabSlotsBtn.addEventListener('click', () => switchLeaderboardTab('slots'));
    tabMarioBtn.addEventListener('click', () => switchLeaderboardTab(HoermannGameReleases.release('mario').scoreCategory));
    tabBusterBtn.addEventListener('click', () => switchLeaderboardTab('buster_v02'));
    tabNerveBtn.addEventListener('click', () => switchLeaderboardTab(HoermannGameReleases.release('nerve').scoreCategory));
    tabParcoursBtn.addEventListener('click', () => switchLeaderboardTab(HoermannGameReleases.release('parcours').scoreCategory));

    function openGlobalLeaderboard(category = 'forklift', highlightName = "") {
      switchLeaderboardTab(category, highlightName);
      highscoreCard.classList.add('show');
      syncOnlineLeaderboards(false);
    }

    closeLeaderboardBtn.addEventListener('click', () => {
      highscoreCard.classList.remove('show');
    });

    document.getElementById('forklift-leaderboard-btn').addEventListener('click', () => openGlobalLeaderboard('forklift_v02'));
    const towerLbBtn = document.getElementById('tower-leaderboard-btn');
    if (towerLbBtn) towerLbBtn.addEventListener('click', () => openGlobalLeaderboard('tower'));
    const pacmanLbBtn = document.getElementById('pacman-leaderboard-btn');
    if (pacmanLbBtn) pacmanLbBtn.addEventListener('click', () => openGlobalLeaderboard('pacman'));
    const slotsLbBtn = document.getElementById('slots-leaderboard-btn');
    if (slotsLbBtn) slotsLbBtn.addEventListener('click', () => openGlobalLeaderboard('slots'));
    document.getElementById('mario-leaderboard-btn').addEventListener('click', () => openGlobalLeaderboard('mario_v02'));
    document.getElementById('buster-leaderboard-btn').addEventListener('click', () => openGlobalLeaderboard('buster_v02'));
    document.getElementById('nerve-leaderboard-btn').addEventListener('click', () => openGlobalLeaderboard('nerve_v02'));
    document.getElementById('parcours-leaderboard-btn').addEventListener('click', () => openGlobalLeaderboard('parcours_v02'));

    // Prüft live, ob der eingegebene Name frei/gültig ist, ob bereits ein höherer Highscore vorliegt + ob ein Ideen-Ticket freigeschaltet wird
    // Kompakter Ergebnis-Dialog: kurze Texte, ein klarer Hauptknopf. Rekorde unter einem festen Namen werden automatisch gespeichert (siehe promptScoreSubmit).
    function setSubmitFeedback(kind, html) {
      const palette = {
        ok:   ['#ecfdf5', '#047857', '1px solid #6ee7b7'],
        info: ['#eff6ff', '#1e40af', '1px solid #93c5fd'],
        warn: ['#fef2f2', '#b91c1c', '1px solid #fca5a5']
      }[kind];
      submitHighscoreFeedback.style.background = palette[0];
      submitHighscoreFeedback.style.color = palette[1];
      submitHighscoreFeedback.style.border = palette[2];
      submitHighscoreFeedback.style.display = html ? 'block' : 'none';
      submitHighscoreFeedback.innerHTML = html;
    }
    function setSaveButton(enabled, label) {
      saveScoreBtn.disabled = !enabled;
      saveScoreBtn.style.opacity = enabled ? '1' : '0.5';
      saveScoreBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
      saveScoreBtn.textContent = label;
    }

    function evaluatePersonalHighscoreCheck() {
      const unit = (HoermannGameReleases.baseGame(pendingSubmitGame) === 'parcours') ? 'Tore' : 'Punkte';
      const lockedName = getLockedPlayerName();
      const typedName = lockedName || playerNameInput.value.trim();
      submitDialogSubtitle.textContent = '';
      submitDialogSubtitle.style.display = 'none';

      // 1. Noch kein fester Name auf diesem Gerät: Gehört der eingegebene Name schon jemand anderem?
      if (!lockedName && typedName) {
        const ownershipCheck = isNameTakenByAnotherPlayer(typedName);
        if (ownershipCheck.taken) {
          submitDialogTitle.textContent = '🔒 Name bereits vergeben';
          setSubmitFeedback('warn', escapeHtml(ownershipCheck.reason));
          if (ideaTicketBox) ideaTicketBox.classList.remove('show');
          currentIdeaEligibility = { eligible: false, reason: '', badge: '', oldRank: null, newRank: null, rule: 'NONE' };
          setSaveButton(false, 'Anderen Namen wählen');
          return false;
        }
      }

      const existingBest = findExistingPlayerBest(pendingSubmitGame, typedName);

      // 2. Unter oder gleich dem eigenen Bestwert: nichts zu speichern.
      if (existingBest && pendingScoreToSave <= existingBest.score) {
        submitDialogTitle.textContent = `📊 ${pendingScoreToSave} ${unit}`;
        setSubmitFeedback('warn', `Dein Bestwert bleibt <strong>${existingBest.score} ${unit}</strong> (Platz ${existingBest.rank}).`);
        if (ideaTicketBox) ideaTicketBox.classList.remove('show');
        currentIdeaEligibility = { eligible: false, reason: '', badge: '', oldRank: existingBest.rank, newRank: existingBest.rank, rule: 'NONE' };
        setSaveButton(false, `Unter deinem Rekord (${existingBest.score})`);
        if (highscoreCard.classList.contains('show')) switchLeaderboardTab(pendingSubmitGame, existingBest.name);
        return false;
      }

      // 3. Gültiges Ergebnis (neuer Rekord oder Ersteintrag): Ideen-Ticket prüfen.
      currentIdeaEligibility = evaluateIdeaTicketEligibility(pendingSubmitGame, typedName, pendingScoreToSave, existingBest);
      if (ideaTicketBox) {
        if (currentIdeaEligibility.eligible) {
          ideaTicketBadge.textContent = currentIdeaEligibility.badge;
          ideaTicketReason.textContent = currentIdeaEligibility.reason;
          ideaTicketBox.classList.add('show');
        } else {
          ideaTicketBox.classList.remove('show');
        }
      }

      if (existingBest) {
        submitDialogTitle.textContent = `🎉 Neuer Rekord: ${pendingScoreToSave} ${unit}`;
        setSubmitFeedback('ok', `Bisher ${existingBest.score} (Platz ${existingBest.rank}) – jetzt Platz ${currentIdeaEligibility.newRank}.`);
        setSaveButton(true, 'Speichern');
      } else {
        submitDialogTitle.textContent = `🎉 ${pendingScoreToSave} ${unit}`;
        setSubmitFeedback('info', typedName ? `Das bringt dich auf <strong>Platz ${currentIdeaEligibility.newRank}</strong>.` : '');
        setSaveButton(true, 'Speichern');
      }
      return true;
    }

    playerNameInput.addEventListener('input', evaluatePersonalHighscoreCheck);

    function promptScoreSubmit(score, category, gameDisplayName) {
      if (globalThis.HoermannGameSession) HoermannGameSession.finish();
      pendingScoreToSave = score;
      pendingSubmitGame = category;
      pendingGameDisplayName = gameDisplayName;

      if (playerIdeaInput) playerIdeaInput.value = '';
      resetIdeaToggle();

      refreshLockedNameUi();
      const currentName = getLockedPlayerName() || playerNameInput.value.trim();

      // Mit festem Namen wird ein neuer Rekord sofort automatisch gespeichert (kein Klick nötig).
      const valid = evaluatePersonalHighscoreCheck();
      if (getLockedPlayerName() && valid && !currentIdeaEligibility.eligible) { executeScoreSubmit(); return; }

      scoreSubmitDialog.classList.add('show');
      keepEndCardInView();

      // Fokus sofort setzen: Wenn Name schon fest ist -> direkt auf den Speichern-Button (1x Enter reicht!), sonst ins Namensfeld
      setTimeout(() => {
        if (getLockedPlayerName()) {
          if (!saveScoreBtn.disabled) saveScoreBtn.focus({ preventScroll: true });
        } else if (playerNameInput) {
          playerNameInput.focus({ preventScroll: true });
        }
      }, 60);

      // Hintergrund-Sync OHNE das Formular oder den Spieler auszubremsen
      syncOnlineLeaderboards(false).then(() => {
        if (scoreSubmitDialog.classList.contains('show')) {
          evaluatePersonalHighscoreCheck();
        }
      }).catch(() => {});
    }

    saveScoreBtn.addEventListener('click', executeScoreSubmit);
    document.getElementById('score-dialog-close-btn').addEventListener('click', () => scoreSubmitDialog.classList.remove('show'));
    // Optionale Idee: eingeklappt hinter "Idee hinterlassen"
    const ideaToggleBtn = document.getElementById('idea-ticket-toggle');
    function resetIdeaToggle() {
      if (ideaTicketBox) ideaTicketBox.classList.remove('open');
      ideaToggleBtn.setAttribute('aria-expanded', 'false');
    }
    ideaToggleBtn.addEventListener('click', () => {
      const open = ideaTicketBox.classList.toggle('open');
      ideaToggleBtn.setAttribute('aria-expanded', String(open));
      if (open) { playerIdeaInput.focus({ preventScroll: true }); keepEndCardInView(); }
    });
    // Das Ergebnisblatt liegt fest am unteren Rand: die Endkarte mit "Nochmal spielen" bleibt darueber sichtbar.
    function keepEndCardInView() {
      requestAnimationFrame(() => {
        const again = document.getElementById('game-end-again');
        if (!again || again.getClientRects().length === 0) return;
        const sheetTop = scoreSubmitDialog.getBoundingClientRect().top;
        const panel = document.querySelector('#game-end-card .game-end-panel');
        const bottom = (panel || again).getBoundingClientRect().bottom;
        if (bottom > sheetTop - 8) window.scrollBy(0, bottom - sheetTop + 12);
      });
    }
    playerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeScoreSubmit();
    });

    // INSTANT-SUBMIT (0,0 Sek. Wartezeit!): Speichert sofort lokal + aktualisiert sofort die UI, Cloud-Sync läuft im Hintergrund!
    function executeScoreSubmit() {
      const lockedName = getLockedPlayerName();
      const name = (lockedName || playerNameInput.value.trim()).slice(0, 20);
      if (!name) {
        showToast('Bitte wähle einmalig deinen festen Spielernamen! ✍️');
        playerNameInput.focus();
        return;
      }

      const canSubmit = evaluatePersonalHighscoreCheck();
      if (!canSubmit) {
        playSound('alarm');
        return;
      }

      // Namen jetzt dauerhaft auf diesem Gerät sperren & als Eigentümer registrieren!
      setLockedPlayerName(name);

      const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      localStorage.setItem('hoermann_last_lb_cat', pendingSubmitGame);

      // Meilenstein-Status für diesen Spieler aktualisieren & ggf. optionale Spiel-Idee ins Admin-Postfach legen
      const nameKey = name.toLowerCase();
      const milestoneKey = `${pendingSubmitGame}:${nameKey}`;
      const milestones = loadPlayerMilestones();
      const prevM = milestones[milestoneKey] || { firstIdeaUsed: false, wasEverInTop3: false, bestTop3RankIdeaUsed: null };
      const projectedRank = currentIdeaEligibility.newRank || calculateProjectedRank(pendingSubmitGame, name, pendingScoreToSave);

      prevM.firstIdeaUsed = true;
      if (projectedRank <= 3) {
        prevM.wasEverInTop3 = true;
        if (typeof prevM.bestTop3RankIdeaUsed !== 'number' || projectedRank < prevM.bestTop3RankIdeaUsed) {
          prevM.bestTop3RankIdeaUsed = projectedRank;
        }
      }
      milestones[milestoneKey] = prevM;
      savePlayerMilestones(milestones);

      const submittedIdeaText = (playerIdeaInput && currentIdeaEligibility.eligible) ? playerIdeaInput.value.trim() : '';
      let createdIdeaObj = null;
      if (submittedIdeaText) {
        const ideasState = loadIdeasState();
        createdIdeaObj = {
          id: 'idea_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          player: name,
          game: pendingGameDisplayName || pendingSubmitGame,
          score: pendingScoreToSave,
          rank: projectedRank,
          reason: currentIdeaEligibility.badge || 'Highscore-Platzierung',
          text: submittedIdeaText.slice(0, 500),
          date: today + ' ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          ts: Date.now()
        };
        ideasState.ideas.unshift(createdIdeaObj);
        saveIdeasState(ideasState);
        if (typeof renderAdminIdeasList === 'function') renderAdminIdeasList();
      }

      // SOFORT lokal speichern & Tabelle in 0,0 Sek. aktualisieren (kein await vor dem Schließen!)
      saveGameLeaderboard(pendingSubmitGame, {
        name: name,
        score: pendingScoreToSave,
        date: today,
        isUser: true
      });

      if (playerIdeaInput) playerIdeaInput.value = '';
      scoreSubmitDialog.classList.remove('show');
      // Keine Vollbild-Liste ueber der Endkarte: Platz steht auf der Endkarte, die Liste oeffnet der Bestenliste-Knopf dort.
      switchLeaderboardTab(pendingSubmitGame, name);
      globalThis.HoermannGameSession?.recordNote('🎉 Neuer Rekord · Platz ' + projectedRank, name);
      playSound('victory');
      triggerParticleEffect('confetti');
      showToast(
        createdIdeaObj
          ? `⚡ Rekord (${pendingScoreToSave}) & deine Spiel-Idee gespeichert! 💡`
          : `⚡ Rekord (${pendingScoreToSave}) gespeichert! 🏅`
      );

      // Falls eine Idee eingegeben wurde, im Hintergrund in die Cloud pushen
      if (createdIdeaObj) {
        publishCloudSnapshot({
          type: 'IDEA_ADD',
          idea: createdIdeaObj,
          ts: Date.now()
        }).catch(() => {});
      }
    }

