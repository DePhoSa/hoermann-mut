    /* ==========================================================
       7c. PERMANENTES ONLINE LIVE-CHAT-SYSTEM, SMILEYS, GIF-SUCHE, NAMENSANTRAG & SHA-256 ADMIN
       ========================================================== */
    const chatMessagesList      = document.getElementById('chat-messages-list');
    const adminIdeasList        = document.getElementById('admin-ideas-list');
    const adminRenamesList      = document.getElementById('admin-renames-list');
    const adminIdeasCountSpan   = document.getElementById('admin-ideas-count');
    const adminRenamesCountSpan = document.getElementById('admin-renames-count');
    const chatSenderInput       = document.getElementById('chat-sender-input');
    const chatTextInput         = document.getElementById('chat-text-input');
    const chatSendBtn           = document.getElementById('chat-send-btn');

    const chatAdminToggleBtn    = document.getElementById('chat-admin-toggle-btn');
    const chatAdminPanel        = document.getElementById('chat-admin-panel');
    const chatAdminLoginRow     = document.getElementById('chat-admin-login-row');
    const chatAdminActionsRow   = document.getElementById('chat-admin-actions-row');
    const chatAdminPassInput    = document.getElementById('chat-admin-pass-input');
    const chatAdminLoginBtn     = document.getElementById('chat-admin-login-btn');
    const chatAdminLogoutBtn    = document.getElementById('chat-admin-logout-btn');
    const chatAdminClearBtn     = document.getElementById('chat-admin-clear-chat-btn');
    const chatAdminChangePwBtn  = document.getElementById('chat-admin-change-pw-btn');
    const chatAdminNewPwBox     = document.getElementById('chat-admin-new-pw-box');
    const chatAdminNewPwInput   = document.getElementById('chat-admin-new-pw-input');
    const chatAdminSavePwBtn    = document.getElementById('chat-admin-save-pw-btn');

    const chatAdminTabs         = document.getElementById('chat-admin-tabs');
    const adminTabChatBtn       = document.getElementById('admin-tab-chat-btn');
    const adminTabIdeasBtn      = document.getElementById('admin-tab-ideas-btn');
    const adminTabRenamesBtn    = document.getElementById('admin-tab-renames-btn');

    // Moderne Chat-Erweiterungen: Smileys & öffentliche GIF-Suche + Direkt-Link / Strg+V
    const toggleEmojiTrayBtn    = document.getElementById('toggle-emoji-tray-btn');
    const toggleGifTrayBtn      = document.getElementById('toggle-gif-tray-btn');
    const closeEmojiTrayBtn     = document.getElementById('close-emoji-tray-btn');
    const closeGifTrayBtn       = document.getElementById('close-gif-tray-btn');
    const chatEmojiTray         = document.getElementById('chat-emoji-tray');
    const chatGifTray           = document.getElementById('chat-gif-tray');
    const chatEmojiGrid         = document.getElementById('chat-emoji-grid');
    const chatGifSearchInput    = document.getElementById('chat-gif-search-input');
    const chatGifSearchBtn      = document.getElementById('chat-gif-search-btn');
    const chatGifResults        = document.getElementById('chat-gif-results');
    const chatGifUrlInput       = document.getElementById('chat-gif-url-input');
    const chatGifUrlBtn         = document.getElementById('chat-gif-url-btn');
    const chatPendingGifBar     = document.getElementById('chat-pending-gif-bar');
    const chatPendingGifImg     = document.getElementById('chat-pending-gif-img');
    const chatRemoveGifBtn      = document.getElementById('chat-remove-gif-btn');

    let pendingChatGifUrl = '';

    // Vorbelegen des Chat-Namens aus dem gespeicherten Spielernamen
    if (chatSenderInput) {
      const savedPlayer = getLockedPlayerName() || localStorage.getItem('hoermann_player_name') || '';
      if (savedPlayer) chatSenderInput.value = savedPlayer;
    }

    // ==========================================================
    // SMILEYS & EMOJI-AUSWAHLMENÜ
    // ==========================================================
    const POPULAR_CHAT_EMOJIS = [
      '😀', '😂', '🤣', '😎', '🥳', '🤩', '😅', '😉',
      '🙌', '👏', '👍', '💪', '🔥', '⚡', '🏆', '🥇',
      '🚜', '📦', '🏗️', '🚪', '🛠️', '🚨', '🚀', '🎯',
      '🎉', '🍻', '☕', '🍕', '❤️', '💯', '🤯', '😱',
      '🤔', '🫡', '🤝', '👀', '🙈', '🤦‍♂️', '🤷‍♂️', '👑'
    ];

    if (chatEmojiGrid) {
      chatEmojiGrid.innerHTML = '';
      POPULAR_CHAT_EMOJIS.forEach(emo => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-item-btn';
        btn.textContent = emo;
        btn.addEventListener('click', () => {
          if (!chatTextInput) return;
          const start = chatTextInput.selectionStart || chatTextInput.value.length;
          const end = chatTextInput.selectionEnd || chatTextInput.value.length;
          const before = chatTextInput.value.slice(0, start);
          const after = chatTextInput.value.slice(end);
          chatTextInput.value = (before + emo + after).slice(0, 300);
          chatTextInput.focus();
          const newPos = Math.min(chatTextInput.value.length, start + emo.length);
          chatTextInput.setSelectionRange(newPos, newPos);
        });
        chatEmojiGrid.appendChild(btn);
      });
    }

    if (toggleEmojiTrayBtn && chatEmojiTray) {
      toggleEmojiTrayBtn.addEventListener('click', () => {
        const willOpen = !chatEmojiTray.classList.contains('show');
        chatEmojiTray.classList.toggle('show', willOpen);
        toggleEmojiTrayBtn.classList.toggle('active', willOpen);
        if (willOpen && chatGifTray) {
          chatGifTray.classList.remove('show');
          if (toggleGifTrayBtn) toggleGifTrayBtn.classList.remove('active');
        }
      });
    }
    if (closeEmojiTrayBtn && chatEmojiTray) {
      closeEmojiTrayBtn.addEventListener('click', () => {
        chatEmojiTray.classList.remove('show');
        if (toggleEmojiTrayBtn) toggleEmojiTrayBtn.classList.remove('active');
      });
    }

    // ==========================================================
    // ÖFFENTLICHE GIF-SUCHE (INKL. DEUTSCHE SUCHBEGRIFFE WIE "LACHENDER TYP") & EXTERNE GIFS
    // ==========================================================
    const PUBLIC_GIPHY_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';

    const CURATED_FALLBACK_GIFS = [
      { title: 'Lachender Typ', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
      { title: 'Lachflash',     url: 'https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif' },
      { title: 'Stapler Profi', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
      { title: 'Sieg & Party',  url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
      { title: 'Daumen hoch',   url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
      { title: 'Mind Blown',    url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' }
    ];

    // Übersetzt häufige deutsche Mehrwort-Suchbegriffe (wie "lachender typ"), damit öffentliche GIF-Datenbanken sofort perfekte Treffer liefern
    function enhanceGermanGifSearchQuery(rawQuery) {
      const q = String(rawQuery || '').trim().toLowerCase();
      if (!q) return 'funny reaction';
      const phraseMap = {
        'lachender typ': 'laughing guy',
        'lachender mann': 'laughing man',
        'lachende frau': 'laughing woman',
        'lachen': 'laughing',
        'lachflash': 'laughing hard',
        'stapler': 'forklift',
        'gabelstapler': 'forklift',
        'lager': 'warehouse forklift',
        'sieg': 'winner celebration',
        'gewonnen': 'winner celebration',
        'feierabend': 'friday party dance',
        'party': 'party celebration',
        'daumen hoch': 'thumbs up',
        'krass': 'mind blown',
        'wütend': 'angry',
        'sauer': 'angry',
        'weinen': 'crying funny',
        'traurig': 'sad',
        'kaffee': 'coffee morning',
        'müde': 'tired sleepy',
        'applaus': 'applause clapping',
        'tanzen': 'dancing happy',
        'fail': 'epic fail'
      };
      if (phraseMap[q]) return phraseMap[q];
      return q
        .replace(/\blachender\b/g, 'laughing')
        .replace(/\blachende\b/g, 'laughing')
        .replace(/\blachen\b/g, 'laughing')
        .replace(/\btyp\b/g, 'guy')
        .replace(/\bmann\b/g, 'man')
        .replace(/\bstapler\b/g, 'forklift')
        .replace(/\bsieg\b/g, 'winner')
        .replace(/\bgewonnen\b/g, 'winner')
        .replace(/\bfeierabend\b/g, 'party')
        .replace(/\bwütend\b/g, 'angry')
        .replace(/\btanzen\b/g, 'dancing');
    }

    function selectPendingGifForChat(gifUrl) {
      const clean = String(gifUrl || '').trim();
      if (!clean) return;
      pendingChatGifUrl = clean;
      if (chatPendingGifImg) chatPendingGifImg.src = clean;
      if (chatPendingGifBar) chatPendingGifBar.classList.add('show');
      if (chatGifTray) chatGifTray.classList.remove('show');
      if (toggleGifTrayBtn) toggleGifTrayBtn.classList.remove('active');
      if (chatTextInput) chatTextInput.focus();
    }

    function clearPendingGifForChat() {
      pendingChatGifUrl = '';
      if (chatPendingGifImg) chatPendingGifImg.src = '';
      if (chatPendingGifBar) chatPendingGifBar.classList.remove('show');
    }

    if (chatRemoveGifBtn) {
      chatRemoveGifBtn.addEventListener('click', clearPendingGifForChat);
    }

    function renderGifThumbnails(gifItems) {
      if (!chatGifResults) return;
      chatGifResults.innerHTML = '';
      if (!gifItems || !gifItems.length) {
        chatGifResults.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#64748b; font-size:0.75rem; padding:0.8rem;">Keine GIFs gefunden.</div>`;
        return;
      }
      gifItems.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gif-thumb-btn';
        btn.title = (item.title || 'GIF auswählen') + ' (Klicken zum Einfügen)';
        const img = document.createElement('img');
        img.src = item.preview || item.url;
        img.alt = item.title || 'GIF';
        img.loading = 'lazy';
        btn.appendChild(img);
        btn.addEventListener('click', () => selectPendingGifForChat(item.url));
        chatGifResults.appendChild(btn);
      });
    }

    async function searchPublicGifs(rawQuery) {
      if (!chatGifResults) return;
      const queryText = String(rawQuery || '').trim();
      chatGifResults.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#64748b; font-size:0.75rem; padding:0.8rem;">🔎 Suche passende GIFs...</div>`;

      const apiQuery = enhanceGermanGifSearchQuery(queryText || 'lachender typ');
      try {
        const endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${PUBLIC_GIPHY_KEY}&q=${encodeURIComponent(apiQuery)}&limit=12&rating=pg-13&lang=de`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          let items = Array.isArray(data.data) ? data.data : [];

          // Falls ein sehr spezieller mehrteiliger Begriff 0 Treffer ergab, automatisch mit dem Hauptbegriff erneut suchen
          if (items.length === 0 && queryText.includes(' ')) {
            const fallbackWord = enhanceGermanGifSearchQuery(queryText.split(/\s+/)[0]);
            const res2 = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${PUBLIC_GIPHY_KEY}&q=${encodeURIComponent(fallbackWord)}&limit=12&rating=pg-13`);
            if (res2.ok) {
              const data2 = await res2.json();
              items = Array.isArray(data2.data) ? data2.data : [];
            }
          }

          const mapped = items.map(g => {
            const imgs = g.images || {};
            const sendUrl = (imgs.fixed_height && imgs.fixed_height.url) ||
                            (imgs.downsized && imgs.downsized.url) ||
                            (imgs.original && imgs.original.url) || '';
            const prevUrl = (imgs.fixed_width_small && imgs.fixed_width_small.url) ||
                            (imgs.fixed_height_small && imgs.fixed_height_small.url) ||
                            sendUrl;
            return {
              title: g.title || queryText || 'GIF',
              url: sendUrl,
              preview: prevUrl
            };
          }).filter(x => Boolean(x.url));

          if (mapped.length > 0) {
            renderGifThumbnails(mapped);
            return;
          }
        }
      } catch (e) {}

      // Garantierter Fallback, falls das Firmennetzwerk externe APIs blockiert
      renderGifThumbnails(CURATED_FALLBACK_GIFS);
    }

    if (toggleGifTrayBtn && chatGifTray) {
      toggleGifTrayBtn.addEventListener('click', () => {
        const willOpen = !chatGifTray.classList.contains('show');
        chatGifTray.classList.toggle('show', willOpen);
        toggleGifTrayBtn.classList.toggle('active', willOpen);
        if (willOpen) {
          if (chatEmojiTray) chatEmojiTray.classList.remove('show');
          if (toggleEmojiTrayBtn) toggleEmojiTrayBtn.classList.remove('active');
          if (chatGifSearchInput) chatGifSearchInput.focus();
          if (chatGifResults && !chatGifResults.children.length) {
            searchPublicGifs(chatGifSearchInput ? chatGifSearchInput.value : 'lachender typ');
          }
        }
      });
    }
    if (closeGifTrayBtn && chatGifTray) {
      closeGifTrayBtn.addEventListener('click', () => {
        chatGifTray.classList.remove('show');
        if (toggleGifTrayBtn) toggleGifTrayBtn.classList.remove('active');
      });
    }

    if (chatGifSearchBtn && chatGifSearchInput) {
      chatGifSearchBtn.addEventListener('click', () => searchPublicGifs(chatGifSearchInput.value));
      chatGifSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchPublicGifs(chatGifSearchInput.value);
        }
      });
    }

    document.querySelectorAll('.gif-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-q') || 'lachender typ';
        if (chatGifSearchInput) chatGifSearchInput.value = q;
        searchPublicGifs(q);
      });
    });

    // Externe GIFs über Direkt-Link (https://...) oder kopierte Grafik (Strg+V / Drag & Drop) einfügen
    function isLikelyImageUrl(str) {
      const s = String(str || '').trim();
      if (/^data:image\/(gif|png|jpeg|jpg|webp);base64,/i.test(s)) return true;
      if (!/^https?:\/\/\S+$/i.test(s)) return false;
      if (/\.(gif|webp|png|jpe?g)(\?.*)?$/i.test(s)) return true;
      if (/giphy\.com\/media\/|media\d*\.giphy\.com|tenor\.com\/view|media\.tenor\.com|imgur\.com/i.test(s)) return true;
      return false;
    }

    function handleExternalGifUrlInput() {
      if (!chatGifUrlInput) return;
      const raw = chatGifUrlInput.value.trim();
      if (!raw) {
        showToast('Bitte füge einen Bild-/GIF-Link (https://...) ein oder nutze Strg+V! 🔗');
        return;
      }
      if (!/^https?:\/\//i.test(raw) && !/^data:image\//i.test(raw)) {
        showToast('Bitte eine gültige Grafik-URL (beginnend mit https://) eingeben! 🔗');
        return;
      }
      chatGifUrlInput.value = '';
      selectPendingGifForChat(raw);
      showToast('🎬 Externe Grafik / GIF angehängt!');
    }

    if (chatGifUrlBtn) chatGifUrlBtn.addEventListener('click', handleExternalGifUrlInput);
    if (chatGifUrlInput) {
      chatGifUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleExternalGifUrlInput();
        }
      });
    }

    // Zwischenablage-Paste (Strg+V) für kopierte GIF-Dateien/Bilder ODER direkte Bild-Links im Chat
    function handleChatPasteEvent(e) {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          e.preventDefault();

          // Falls es ein kompaktes GIF ist (< 220 KB), original animiertes Data-URL behalten, sonst kompakt skalieren
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = String(ev.target.result || '');
            if (file.type === 'image/gif' && dataUrl.length <= 280000) {
              selectPendingGifForChat(dataUrl);
              showToast('🎬 Kopiertes GIF direkt aus der Zwischenablage eingefügt!');
            } else {
              const img = new Image();
              img.onload = () => {
                const maxW = 280;
                const scale = Math.min(1, maxW / (img.width || maxW));
                const cv = document.createElement('canvas');
                cv.width = Math.max(1, Math.round(img.width * scale));
                cv.height = Math.max(1, Math.round(img.height * scale));
                const ctx = cv.getContext('2d');
                ctx.drawImage(img, 0, 0, cv.width, cv.height);
                const compressed = cv.toDataURL('image/webp', 0.82);
                selectPendingGifForChat(compressed);
                showToast('🖼️ Grafik aus der Zwischenablage eingefügt!');
              };
              img.src = dataUrl;
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      // Prüfen, ob ein direkter GIF/Bild-Link per Strg+V eingefügt wurde
      const pastedText = (e.clipboardData.getData('text/plain') || '').trim();
      if (isLikelyImageUrl(pastedText)) {
        e.preventDefault();
        selectPendingGifForChat(pastedText);
        showToast('🎬 GIF-Link erkannt & als Grafik angehängt!');
      }
    }

    if (chatTextInput) chatTextInput.addEventListener('paste', handleChatPasteEvent);
    if (chatGifUrlInput) chatGifUrlInput.addEventListener('paste', handleChatPasteEvent);

    // ==========================================================
    // EINMALIGER NAMENSKORREKTUR-ANTRAG (FALLS NAME FALSCH GESPEICHERT WURDE)
    // ==========================================================
    function openRenameRequestDialog() {
      const currentLocked = getLockedPlayerName();
      if (!currentLocked) {
        showToast('Du hast noch keinen festen Namen gespeichert – du kannst ihn direkt eingeben!');
        return;
      }
      if (localStorage.getItem(RENAME_REQ_USED_KEY) === '1') {
        showToast('ℹ️ Du hast deinen einmaligen Namens-Korrekturantrag bereits gestellt.');
        return;
      }
      // Falls der Nutzer auf "✏️ Name falsch?" im Chat klickt und das Highscore-Fenster nicht offen ist -> kompaktes Prompt oder Formular öffnen
      if (scoreSubmitDialog && scoreSubmitDialog.classList.contains('show') && renameRequestBox) {
        renameRequestBox.style.display = 'flex';
        if (renameRequestInput) {
          renameRequestInput.value = currentLocked;
          renameRequestInput.focus();
          renameRequestInput.select();
        }
      } else {
        const wished = window.prompt(
          `📝 Einmaliger Namens-Korrekturantrag an den Admin:\n\nDein aktuell gespeicherter Name lautet: „${currentLocked}“\nWie soll dein richtiger Spielername lauten (max. 20 Zeichen)?`,
          currentLocked
        );
        if (wished !== null) {
          submitPlayerRenameRequest(wished);
        }
      }
    }

    function submitPlayerRenameRequest(rawNewName) {
      const oldName = getLockedPlayerName();
      const newName = String(rawNewName || '').trim().slice(0, 20);
      if (!oldName) return;
      if (localStorage.getItem(RENAME_REQ_USED_KEY) === '1') {
        showToast('ℹ️ Ein Namensantrag ist nur einmalig pro Spieler möglich.');
        return;
      }
      if (!newName || newName.length < 2) {
        showToast('Bitte gib einen gültigen neuen Namen (mind. 2 Zeichen) ein! ✍️');
        return;
      }
      if (newName.toLowerCase() === oldName.toLowerCase() && newName === oldName) {
        showToast('Der eingegebene Name ist identisch mit deinem aktuellen Namen.');
        return;
      }

      // Prüfen, ob der gewünschte neue Name nicht schon einem anderen Spieler gehört
      if (newName.toLowerCase() !== oldName.toLowerCase()) {
        const check = isNameTakenByAnotherPlayer(newName);
        if (check.taken) {
          playSound('alarm');
          showToast('🚫 ' + check.reason);
          return;
        }
      }

      const now = new Date();
      const reqObj = {
        id: 'ren_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        oldName: oldName,
        newName: newName,
        deviceToken: MY_DEVICE_TOKEN,
        date: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' +
              now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now()
      };

      const renameState = loadRenameState();
      renameState.requests.unshift(reqObj);
      saveRenameState(renameState);

      try {
        localStorage.setItem(RENAME_REQ_USED_KEY, '1');
      } catch (e) {}

      if (renameRequestBox) renameRequestBox.style.display = 'none';
      refreshLockedNameUi();
      renderAdminRenamesList();
      playSound('coin');
      showToast(`📨 Namensantrag („${oldName}“ ➔ „${newName}“) an den Admin gesendet!`);

      publishCloudSnapshot({
        type: 'RENAME_REQ',
        renameReq: reqObj,
        ts: Date.now()
      }).catch(() => {});
    }

    if (openRenameReqBtn) openRenameReqBtn.addEventListener('click', openRenameRequestDialog);
    if (chatRenameReqBtn) chatRenameReqBtn.addEventListener('click', openRenameRequestDialog);
    if (cancelRenameReqBtn && renameRequestBox) {
      cancelRenameReqBtn.addEventListener('click', () => {
        renameRequestBox.style.display = 'none';
      });
    }
    if (sendRenameReqBtn && renameRequestInput) {
      sendRenameReqBtn.addEventListener('click', () => submitPlayerRenameRequest(renameRequestInput.value));
      renameRequestInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitPlayerRenameRequest(renameRequestInput.value);
        }
      });
    }

    async function approveRenameRequest(req) {
      if (!isAdminUnlocked || !req || !req.id) return;
      const renameState = loadRenameState();
      const approvedObj = {
        id: req.id,
        oldName: req.oldName,
        newName: req.newName,
        deviceToken: req.deviceToken || '',
        approvedAt: Date.now()
      };
      if (!renameState.approvedRenames.some(a => a.id === req.id)) {
        renameState.approvedRenames.push(approvedObj);
      }
      renameState.requests = renameState.requests.filter(r => r.id !== req.id);
      saveRenameState(renameState);

      const localMaster = loadMasterUserScores();
      const chatState = loadChatState();
      const ideasState = loadIdeasState();
      const milestones = loadPlayerMilestones();

      applySingleApprovedRename(approvedObj, localMaster, chatState, ideasState, milestones);

      saveMasterUserScores(localMaster);
      saveChatState(chatState);
      saveIdeasState(ideasState);
      savePlayerMilestones(milestones);

      HoermannGameReleases.categories.forEach(cat => {
        try {
          localStorage.setItem(`hoermann_lb_${cat}`, JSON.stringify(getGameLeaderboard(cat)));
        } catch (e) {}
      });

      renderChatMessages();
      renderAdminIdeasList();
      renderAdminRenamesList();
      if (highscoreCard && highscoreCard.classList.contains('show')) {
        switchLeaderboardTab(activeGameCategory);
      }

      await publishCloudSnapshot({
        type: 'RENAME_APPROVE',
        approvedRename: approvedObj,
        ts: Date.now()
      });
      showToast(`✅ Namensänderung „${req.oldName}“ ➔ „${req.newName}“ genehmigt & überall aktualisiert!`);
    }

    async function rejectRenameRequest(reqId) {
      if (!isAdminUnlocked || !reqId) return;
      const renameState = loadRenameState();
      if (!renameState.rejectedIds.includes(reqId)) {
        renameState.rejectedIds.push(reqId);
      }
      renameState.requests = renameState.requests.filter(r => r.id !== reqId);
      saveRenameState(renameState);
      renderAdminRenamesList();

      await publishCloudSnapshot({
        type: 'RENAME_REJECT',
        reqId: reqId,
        ts: Date.now()
      });
      showToast('✕ Namensantrag abgelehnt & entfernt.');
    }

    function renderAdminRenamesList() {
      const renameState = loadRenameState();
      if (adminRenamesCountSpan) {
        adminRenamesCountSpan.textContent = renameState.requests.length;
      }
      if (!adminRenamesList) return;
      adminRenamesList.innerHTML = '';

      if (!renameState.requests.length) {
        adminRenamesList.innerHTML = `
          <div style="text-align:center; color:#64748b; font-size:0.8rem; padding:1.4rem 0.5rem;">
            Keine offenen Namensanträge. Wenn sich ein Spieler beim ersten Speichern vertippt hat, erscheint sein Antrag hier zur Freigabe! ✏️
          </div>
        `;
        return;
      }

      renameState.requests.forEach(req => {
        const card = document.createElement('div');
        card.className = 'admin-idea-card';
        card.style.background = '#eff6ff';
        card.style.borderColor = '#93c5fd';

        const titleRow = document.createElement('div');
        titleRow.style.fontWeight = '800';
        titleRow.style.color = '#1e3a8a';
        titleRow.style.fontSize = '0.82rem';
        titleRow.textContent = `✏️ „${req.oldName}“ ➔ „${req.newName}“`;

        const metaRow = document.createElement('div');
        metaRow.style.fontSize = '0.7rem';
        metaRow.style.color = '#475569';
        metaRow.textContent = `Eingereicht am ${req.date || 'Heute'} (Einmaliger Antrag)`;

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '6px';
        btnRow.style.marginTop = '4px';

        const approveBtn = document.createElement('button');
        approveBtn.type = 'button';
        approveBtn.className = 'chat-send-btn';
        approveBtn.style.padding = '3px 8px';
        approveBtn.style.fontSize = '0.73rem';
        approveBtn.style.background = '#16a34a';
        approveBtn.textContent = '✅ Genehmigen & umbenennen';
        approveBtn.addEventListener('click', () => approveRenameRequest(req));

        const rejectBtn = document.createElement('button');
        rejectBtn.type = 'button';
        rejectBtn.className = 'chat-delete-btn';
        rejectBtn.style.padding = '3px 8px';
        rejectBtn.style.fontSize = '0.73rem';
        rejectBtn.textContent = '✕ Ablehnen';
        rejectBtn.addEventListener('click', () => rejectRenameRequest(req.id));

        btnRow.appendChild(approveBtn);
        btnRow.appendChild(rejectBtn);

        card.appendChild(titleRow);
        card.appendChild(metaRow);
        card.appendChild(btnRow);
        adminRenamesList.appendChild(card);
      });
    }

    // Kryptografischer SHA-256 Hash (damit niemals ein Klartext-Passwort im Code steht)
    async function computeSha256Hex(str) {
      const clean = String(str || '').trim();
      if (window.crypto && window.crypto.subtle) {
        const buf = new TextEncoder().encode(clean);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      return '';
    }

    function updateAdminUiState() {
      if (!chatAdminToggleBtn) return;
      if (isAdminUnlocked) {
        chatAdminToggleBtn.classList.add('unlocked');
        chatAdminToggleBtn.textContent = '🛡️ Admin aktiv';
        chatAdminLoginRow.style.display = 'none';
        chatAdminActionsRow.style.display = 'flex';
        switchAdminViewTab(activeAdminTab);
        chatAdminTabs.classList.add('show');
      } else {
        chatAdminToggleBtn.classList.remove('unlocked');
        chatAdminToggleBtn.textContent = '🔒 Admin';
        chatAdminLoginRow.style.display = 'flex';
        chatAdminActionsRow.style.display = 'none';
        chatAdminTabs.classList.remove('show');
        switchAdminViewTab('chat');
      }
      renderChatMessages();
      renderAdminChatModeration();
      renderAdminIdeasList();
      renderAdminRenamesList();
    }

    function switchAdminViewTab(tab) {
      activeAdminTab = tab;
      const panes = { chat: 'admin-chat-pane', ideas: 'admin-ideas-list', renames: 'admin-renames-list', stats: 'admin-stats-pane', pw: 'admin-pw-pane' };
      const btns = { chat: adminTabChatBtn, ideas: adminTabIdeasBtn, renames: adminTabRenamesBtn, stats: document.getElementById('admin-tab-stats-btn'), pw: chatAdminChangePwBtn };
      Object.keys(panes).forEach(k => {
        const el = document.getElementById(panes[k]);
        const on = isAdminUnlocked && k === tab;
        if (el) el.classList.toggle('show', on);
        if (btns[k]) { btns[k].classList.toggle('active', on); btns[k].setAttribute('aria-selected', String(on)); }
      });
      if (isAdminUnlocked && tab === 'stats') loadAdminStats();
    }

    // Statistik-Reiter: Zähler der letzten 7 Tage je Spiel (nur Admin darf sie lesen, siehe firestore.rules)
    const STAT_TITLES = { forklift: 'Stapler', mario: 'Dennis', buster: 'Buster', nerve: 'Nerven', parcours: 'Parcours' };
    async function loadAdminStats() {
      const body = document.getElementById('admin-stats-body'), S = globalThis.HoermannStats;
      if (!body || !S) return;
      body.textContent = 'Lade …';
      try {
        const days = S.lastDays(7, Date.now());
        const docs = await HoermannCloud.statsRead(days[days.length - 1]);
        const pct = v => v === null ? '–' : Math.round(v * 100) + ' %';
        const dur = v => v === null ? '–' : v >= 60 ? Math.floor(v / 60) + ':' + String(Math.round(v % 60)).padStart(2, '0') : Math.round(v) + ' s';
        const rows = S.perGame(docs, days).map(g => '<tr><td>' + STAT_TITLES[g.game] + '</td><td>' + g.rounds + '</td><td>' + pct(g.finishRate) + '</td><td>' + dur(g.avgSecs) + '</td><td>' + (g.restartsPerRound === null ? '–' : g.restartsPerRound.toFixed(1).replace('.', ',')) + '</td><td>' + pct(g.abortRate) + '</td><td>' + g.players + '</td></tr><tr><td colspan="7" class="stat-verdict">' + g.verdict + '</td></tr>').join('');
        body.innerHTML = '<p class="stat-note">Letzte 7 Tage, anonym. Rd. = Runden, Fertig = Runden bis zum Ende, Neustarts pro Runde, Abbruch = Menü/Schließen vor dem Ende, Spieler = Summe der täglich verschiedenen Spieler.</p><table><thead><tr><th>Spiel</th><th>Rd.</th><th>Fertig</th><th>Ø Zeit</th><th>Neu&shy;starts</th><th>Abbruch</th><th>Spieler</th></tr></thead><tbody>' + rows + '</tbody></table>';
      } catch (e) { body.textContent = 'Statistik nicht verfügbar (Regeln noch nicht veröffentlicht oder offline).'; }
    }
    const statsReload = document.getElementById('admin-stats-reload');
    if (statsReload) statsReload.addEventListener('click', loadAdminStats);
    const statsTabBtn = document.getElementById('admin-tab-stats-btn');
    if (statsTabBtn) statsTabBtn.addEventListener('click', () => switchAdminViewTab('stats'));

    if (adminTabChatBtn) adminTabChatBtn.addEventListener('click', () => switchAdminViewTab('chat'));
    if (adminTabIdeasBtn) adminTabIdeasBtn.addEventListener('click', () => switchAdminViewTab('ideas'));
    if (adminTabRenamesBtn) adminTabRenamesBtn.addEventListener('click', () => switchAdminViewTab('renames'));
    if (chatAdminChangePwBtn) chatAdminChangePwBtn.addEventListener('click', () => { switchAdminViewTab('pw'); if (chatAdminNewPwInput) chatAdminNewPwInput.focus(); });

    // Admin-Dialog (modal)
    const adminDialogBackdrop = document.getElementById('admin-dialog-backdrop');
    let adminDialogReturnFocus = null;
    function openAdminDialog() {
      adminDialogReturnFocus = document.activeElement;
      adminDialogBackdrop.classList.add('show');
      chatAdminToggleBtn.setAttribute('aria-expanded', 'true');
      renderAdminChatModeration();
      switchAdminViewTab(activeAdminTab);
      if (!isAdminUnlocked && chatAdminPassInput) chatAdminPassInput.focus();
      else if (adminTabChatBtn) adminTabChatBtn.focus();
    }
    function closeAdminDialog() {
      adminDialogBackdrop.classList.remove('show');
      chatAdminToggleBtn.setAttribute('aria-expanded', 'false');
      if (adminDialogReturnFocus && adminDialogReturnFocus.focus) adminDialogReturnFocus.focus();
    }
    if (chatAdminToggleBtn) chatAdminToggleBtn.addEventListener('click', openAdminDialog);
    document.getElementById('admin-dialog-close').addEventListener('click', closeAdminDialog);
    adminDialogBackdrop.addEventListener('click', e => { if (e.target === adminDialogBackdrop) closeAdminDialog(); });
    document.addEventListener('keydown', e => {
      if (!adminDialogBackdrop.classList.contains('show')) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeAdminDialog(); return; }
      if (e.key === 'Tab') {
        const f = [...adminDialogBackdrop.querySelectorAll('button, input')].filter(x => x.offsetParent && !x.disabled);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }, true);

    function renderAdminChatModeration() {
      const list = document.getElementById('admin-chat-mod-list');
      if (!list || !isAdminUnlocked) return;
      const msgs = loadChatState().messages.slice(-60).reverse();
      list.innerHTML = '';
      if (!msgs.length) { list.textContent = 'Keine Nachrichten im Chat.'; return; }
      msgs.forEach(msg => {
        const row = document.createElement('div');
        row.className = 'chat-msg-item';
        row.style.cssText = 'display:flex; gap:8px; align-items:center; justify-content:space-between;';
        const txt = document.createElement('div');
        txt.style.cssText = 'min-width:0; overflow-wrap:anywhere;';
        const who = document.createElement('strong'); who.textContent = (msg.sender || 'Spieler') + ' · ' + (msg.time || '');
        const body = document.createElement('div'); body.textContent = (msg.text || '') + (msg.gifUrl ? ' [GIF]' : '');
        txt.append(who, body);
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'chat-delete-btn'; del.title = 'Nachricht löschen (Admin)'; del.setAttribute('aria-label', 'Nachricht löschen'); del.textContent = '🗑️';
        del.addEventListener('click', async () => { await deleteSingleChatMessage(msg.id); renderAdminChatModeration(); });
        row.append(txt, del);
        list.appendChild(row);
      });
    }

    // Admin-Anmeldung: feste Google-Anmeldung. Entscheidend ist die serverseitige Liste config/admins in Firestore.
    function adminErrorText(e) {
      const c = (e && e.code) || '';
      if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return 'Anmeldung abgebrochen.';
      if (c === 'auth/popup-blocked') return 'Das Anmelde-Fenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.';
      if (c === 'auth/unauthorized-domain') return 'Diese Domain ist in Firebase noch nicht für die Anmeldung freigegeben.';
      if (c === 'auth/operation-not-allowed') return 'Google-Anmeldung ist in Firebase noch nicht aktiviert.';
      return 'Anmeldung fehlgeschlagen' + (c ? ' (' + c + ')' : '') + '.';
    }
    async function attemptAdminLogin() {
      let ok = false;
      try { ok = await HoermannCloud.isAdmin(); } catch (e) {}
      if (!ok) {
        try {
          await HoermannCloud.adminSignIn();
          ok = await HoermannCloud.isAdmin();
        } catch (e) {
          playSound('alarm');
          showToast('❌ ' + adminErrorText(e));
          return;
        }
      }
      if (ok) {
        isAdminUnlocked = true;
        sessionStorage.setItem('hoermann_admin_unlocked', '1');
        updateAdminUiState();
        playSound('powerup');
        showToast('🛡️ Admin-Rechte aktiv: Chat moderieren, Ideen lesen & Namensanträge prüfen.');
      } else {
        playSound('alarm');
        showToast('❌ Dieses Google-Konto ist kein Admin. Geräte-ID: ' + (HoermannCloud.uid || 'unbekannt'));
      }
    }

    if (chatAdminLoginBtn) chatAdminLoginBtn.addEventListener('click', attemptAdminLogin);
    if (chatAdminPassInput) {
      chatAdminPassInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptAdminLogin();
      });
    }

    if (chatAdminLogoutBtn) {
      chatAdminLogoutBtn.addEventListener('click', () => {
        isAdminUnlocked = false;
        sessionStorage.removeItem('hoermann_admin_unlocked');
        updateAdminUiState();
        showToast('🔒 Admin-Modus gesperrt.');
      });
    }

    if (chatAdminSavePwBtn) {
      chatAdminSavePwBtn.addEventListener('click', async () => {
        if (!isAdminUnlocked || !chatAdminNewPwInput) return;
        const newPw = chatAdminNewPwInput.value.trim();
        if (newPw.length < 3) {
          showToast('Bitte mindestens 3 Zeichen für das neue Admin-Passwort eingeben!');
          return;
        }
        const newHash = await computeSha256Hex(newPw);
        if (newHash) {
          localStorage.setItem(CUSTOM_ADMIN_HASH_KEY, newHash);
          chatAdminNewPwInput.value = '';
          await publishCloudSnapshot({
            type: 'ADMIN_HASH',
            customAdminHash: newHash,
            ts: Date.now()
          });
          showToast('🔑 Neues Admin-Passwort (verschlüsselt) gespeichert!');
        }
      });
    }

    if (chatAdminClearBtn) {
      chatAdminClearBtn.addEventListener('click', async () => {
        if (!isAdminUnlocked) return;
        const chatState = loadChatState();
        const nowTs = Date.now();
        chatState.clearedBefore = nowTs;
        chatState.messages = [];
        saveChatState(chatState);
        renderChatMessages();
        await publishCloudSnapshot({
          type: 'CHAT_CLEAR',
          clearedBefore: nowTs,
          ts: nowTs
        });
        showToast('🗑️ Gesamter Live-Chat wurde durch Admin geleert.');
      });
    }

    async function deleteSingleChatMessage(msgId) {
      if (!isAdminUnlocked || !msgId) return;
      const chatState = loadChatState();
      if (!chatState.deletedIds.includes(msgId)) {
        chatState.deletedIds.push(msgId);
      }
      chatState.messages = chatState.messages.filter(m => m.id !== msgId);
      saveChatState(chatState);
      renderChatMessages();
      await publishCloudSnapshot({
        type: 'CHAT_DELETE',
        msgId: msgId,
        ts: Date.now()
      });
      showToast('🗑️ Chat-Nachricht gelöscht.');
    }

    async function deleteSinglePlayerIdea(ideaId) {
      if (!isAdminUnlocked || !ideaId) return;
      const ideasState = loadIdeasState();
      if (!ideasState.deletedIdeaIds.includes(ideaId)) {
        ideasState.deletedIdeaIds.push(ideaId);
      }
      ideasState.ideas = ideasState.ideas.filter(i => i.id !== ideaId);
      saveIdeasState(ideasState);
      renderAdminIdeasList();
      await publishCloudSnapshot({
        type: 'IDEA_DELETE',
        ideaId: ideaId,
        ts: Date.now()
      });
      showToast('🗑️ Spieler-Idee aus dem Postfach entfernt.');
    }

    // ---- Chat hinter Button: Panel, Ungelesen-Zähler, Tastatur (visualViewport) ----
    const chatFab = document.getElementById('chat-fab');
    const chatPanelEl = document.getElementById('online-side-chat');
    const chatUnreadBadge = document.getElementById('chat-unread-badge');
    const CHAT_SEEN_KEY = 'hoermann_chat_seen_ts';
    function chatLatestTs(state) { return state.messages.reduce((m, x) => Math.max(m, Number(x.ts) || 0), 0); }
    function chatPanelOpen() { return chatPanelEl.classList.contains('open'); }
    function updateChatUnreadBadge(state) {
      if (!chatUnreadBadge) return;
      if (localStorage.getItem(CHAT_SEEN_KEY) === null) localStorage.setItem(CHAT_SEEN_KEY, String(chatLatestTs(state) || Date.now()));
      if (chatPanelOpen()) { localStorage.setItem(CHAT_SEEN_KEY, String(Math.max(Number(localStorage.getItem(CHAT_SEEN_KEY)) || 0, chatLatestTs(state)))); }
      const seen = Number(localStorage.getItem(CHAT_SEEN_KEY)) || 0;
      const me = (getLockedPlayerName() || '').trim().toLowerCase();
      const n = chatPanelOpen() ? 0 : state.messages.filter(m => (Number(m.ts) || 0) > seen && !(me && String(m.sender || '').trim().toLowerCase() === me)).length;
      chatUnreadBadge.hidden = n === 0;
      chatUnreadBadge.textContent = n > 99 ? '99+' : String(n);
      chatFab.setAttribute('aria-label', n ? 'Live-Chat öffnen, ' + n + ' ungelesene Nachrichten' : 'Live-Chat öffnen');
    }
    function fitChatToViewport() {
      const vv = window.visualViewport;
      if (!vv || !chatPanelOpen() || window.innerWidth > 640) { chatPanelEl.style.removeProperty('--chat-vvh'); chatPanelEl.style.top = ''; return; }
      chatPanelEl.style.setProperty('--chat-vvh', vv.height + 'px');
      chatPanelEl.style.top = vv.offsetTop + 'px';
      if (chatMessagesList) chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
    }
    function setChatPanel(open) {
      chatPanelEl.classList.toggle('open', open);
      chatFab.setAttribute('aria-expanded', String(open));
      chatFab.style.display = open && window.innerWidth <= 640 ? 'none' : '';
      if (open) {
        fitChatToViewport();
        updateChatUnreadBadge(loadChatState());
        chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
        document.getElementById('chat-close-btn').focus({ preventScroll: true });
      } else {
        fitChatToViewport();
        updateChatUnreadBadge(loadChatState());
        chatFab.focus({ preventScroll: true });
      }
    }
    chatFab.addEventListener('click', () => setChatPanel(!chatPanelOpen()));
    document.getElementById('chat-close-btn').addEventListener('click', () => setChatPanel(false));
    chatPanelEl.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.defaultPrevented) setChatPanel(false); });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitChatToViewport); window.visualViewport.addEventListener('scroll', fitChatToViewport); }
    window.addEventListener('resize', () => { if (chatPanelOpen()) { chatFab.style.display = window.innerWidth <= 640 ? 'none' : ''; fitChatToViewport(); } });
    updateChatUnreadBadge(loadChatState());

    function renderChatMessages() {
      if (!chatMessagesList) return;
      const chatState = loadChatState();
      updateChatUnreadBadge(chatState);
      const myName = (getLockedPlayerName() || (chatSenderInput ? chatSenderInput.value.trim() : '') || (localStorage.getItem('hoermann_player_name') || '')).trim().toLowerCase();

      // Unveränderte Liste nicht neu aufbauen (verhindert GIF-Neuladen, Flackern und Scroll-Sprünge)
      const renderSig = [myName, isAdminUnlocked ? 1 : 0, chatState.messages.length, chatState.messages.map(m => m.id + '|' + (m.text || '') + '|' + (m.gifUrl || '')).join('~')].join('#');
      if (chatMessagesList.dataset.renderSig === renderSig) return;
      chatMessagesList.dataset.renderSig = renderSig;
      const wasAtBottom = chatMessagesList.scrollHeight - chatMessagesList.scrollTop - chatMessagesList.clientHeight < 80 || !chatMessagesList.childElementCount;

      chatMessagesList.innerHTML = '';
      if (!chatState.messages.length) {
        chatMessagesList.innerHTML = `
          <div style="text-align:center; color:#64748b; font-size:0.8rem; padding:1.4rem 0.5rem;">
            Noch keine Nachrichten im Chat. Schreib den ersten Gruß oder schick ein GIF! 💬🎬
          </div>
        `;
        return;
      }

      // Nur die letzten 60 Nachrichten zeichnen (Daten bleiben unverändert gespeichert)
      chatState.messages.slice(-60).forEach(msg => {
        const div = document.createElement('div');
        const isOwn = myName && msg.sender && msg.sender.trim().toLowerCase() === myName;
        div.className = 'chat-msg-item' + (isOwn ? ' own-msg' : '');

        const meta = document.createElement('div');
        meta.className = 'chat-msg-meta';

        const authorSpan = document.createElement('span');
        authorSpan.className = 'chat-msg-author';
        authorSpan.textContent = msg.sender || 'Spieler';

        const rightMeta = document.createElement('div');
        rightMeta.style.display = 'flex';
        rightMeta.style.alignItems = 'center';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'chat-msg-time';
        timeSpan.textContent = msg.time || '';
        rightMeta.appendChild(timeSpan);

        if (isAdminUnlocked) {
          const delBtn = document.createElement('button');
          delBtn.className = 'chat-delete-btn';
          delBtn.title = 'Nachricht löschen (Admin)';
          delBtn.textContent = '🗑️';
          delBtn.addEventListener('click', () => deleteSingleChatMessage(msg.id));
          rightMeta.appendChild(delBtn);
        }

        meta.appendChild(authorSpan);
        meta.appendChild(rightMeta);
        div.appendChild(meta);

        // Falls der Text selbst nur eine Bild-/GIF-URL ist, automatisch als Grafik rendern
        let displayText = String(msg.text || '').trim();
        let displayGifUrl = String(msg.gifUrl || '').trim();
        if (!displayGifUrl && isLikelyImageUrl(displayText)) {
          displayGifUrl = displayText;
          displayText = '';
        }

        if (displayText) {
          const body = document.createElement('div');
          body.className = 'chat-msg-text';
          body.textContent = displayText;
          div.appendChild(body);
        }

        if (displayGifUrl) {
          const mediaImg = document.createElement('img');
          mediaImg.className = 'chat-media-img';
          mediaImg.src = displayGifUrl;
          mediaImg.alt = 'Chat GIF';
          mediaImg.loading = 'lazy';
          mediaImg.decoding = 'async';
          mediaImg.addEventListener('load', () => {
            if (wasAtBottom) chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
          });
          div.appendChild(mediaImg);
        }

        chatMessagesList.appendChild(div);
      });

      if (wasAtBottom) chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
    }

    function renderAdminIdeasList() {
      const ideasState = loadIdeasState();
      if (adminIdeasCountSpan) {
        adminIdeasCountSpan.textContent = ideasState.ideas.length;
      }
      if (!adminIdeasList) return;
      adminIdeasList.innerHTML = '';

      if (!ideasState.ideas.length) {
        adminIdeasList.innerHTML = `
          <div style="text-align:center; color:#64748b; font-size:0.8rem; padding:1.4rem 0.5rem;">
            Noch keine Spieler-Ideen im Admin-Postfach. Sobald ein Spieler beim Highscore eine Idee einträgt, erscheint sie sofort hier! 💡
          </div>
        `;
        return;
      }

      ideasState.ideas.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-idea-card';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';
        topRow.style.gap = '4px';

        const titleEl = document.createElement('strong');
        titleEl.style.color = 'var(--hoermann-blue)';
        titleEl.textContent = `👤 ${item.player} (Platz ${item.rank || '?'} • ${item.score || 0} Pkt)`;

        const delBtn = document.createElement('button');
        delBtn.className = 'chat-delete-btn';
        delBtn.textContent = '🗑️';
        delBtn.title = 'Idee löschen';
        delBtn.addEventListener('click', () => deleteSinglePlayerIdea(item.id));

        topRow.appendChild(titleEl);
        topRow.appendChild(delBtn);

        const subRow = document.createElement('div');
        subRow.style.fontSize = '0.72rem';
        subRow.style.color = '#b45309';
        subRow.style.fontWeight = '700';
        subRow.textContent = `🎮 ${item.game} • ${item.reason || 'Highscore'} • ${item.date || ''}`;

        const textEl = document.createElement('div');
        textEl.style.color = '#0f172a';
        textEl.style.marginTop = '3px';
        textEl.style.whiteSpace = 'pre-wrap';
        textEl.style.lineHeight = '1.38';
        textEl.textContent = item.text;

        card.appendChild(topRow);
        card.appendChild(subRow);
        card.appendChild(textEl);
        adminIdeasList.appendChild(card);
      });
    }

    async function sendLiveChatMessage() {
      if (!chatTextInput || !chatSenderInput) return;
      const locked = getLockedPlayerName();
      const sender = (locked || chatSenderInput.value.trim()).slice(0, 20);
      let text = chatTextInput.value.trim();
      let gifUrlToSend = pendingChatGifUrl;

      if (!sender) {
        showToast('Bitte gib oben im Chat einmalig deinen festen Spielernamen ein! ✍️');
        chatSenderInput.focus();
        return;
      }

      // Falls ein direkter Bild-/GIF-Link ins Textfeld eingegeben wurde
      if (!gifUrlToSend && isLikelyImageUrl(text)) {
        gifUrlToSend = text;
        text = '';
      }

      if (!text && !gifUrlToSend) return;

      if (!locked) {
        const ownership = isNameTakenByAnotherPlayer(sender);
        if (ownership.taken) {
          playSound('alarm');
          showToast('🚫 ' + ownership.reason);
          chatSenderInput.focus();
          return;
        }
        setLockedPlayerName(sender);
      }

      const now = new Date();
      const timeLabel = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' +
                        now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        sender: sender.slice(0, 20),
        text: text.slice(0, 300),
        gifUrl: gifUrlToSend || '',
        time: timeLabel,
        ts: Date.now()
      };

      chatTextInput.value = '';
      clearPendingGifForChat();
      if (chatEmojiTray) chatEmojiTray.classList.remove('show');
      if (chatGifTray) chatGifTray.classList.remove('show');
      if (toggleEmojiTrayBtn) toggleEmojiTrayBtn.classList.remove('active');
      if (toggleGifTrayBtn) toggleGifTrayBtn.classList.remove('active');

      const chatState = loadChatState();
      chatState.messages.push(newMsg);
      if (chatState.messages.length > 80) chatState.messages = chatState.messages.slice(-80);
      saveChatState(chatState);
      renderChatMessages();

      await publishCloudSnapshot({
        type: 'CHAT_MSG',
        msg: newMsg,
        ts: newMsg.ts
      });
    }

    if (chatSendBtn) chatSendBtn.addEventListener('click', sendLiveChatMessage);
    if (chatTextInput) {
      chatTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendLiveChatMessage();
      });
    }

    // Initiales Rendering & Online-Stream + 3,5-Sekunden-Live-Polling starten (damit Chat & Scores IMMER ohne Refresh erscheinen!)
    refreshLockedNameUi();
    updateAdminUiState();
    syncOnlineLeaderboards(true);

