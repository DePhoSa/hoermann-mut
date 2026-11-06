/* One session controller: pause, delayed callbacks, update acknowledgements and start dialogs. */
(function(root) {
  let game = null, phase = 'idle', beforePause = null, pauseAt = 0, next = null;
  let countdownValue = '3';
  const countdownElement = document.createElement('div');countdownElement.id='game-countdown';countdownElement.hidden=true;countdownElement.setAttribute('role','status');countdownElement.setAttribute('aria-live','polite');
  countdownElement.innerHTML='<span class=game-countdown-label>Mach dich bereit</span><strong></strong>';
  function stageOf(){const view=document.getElementById(game+'-view');const field=view.querySelector('canvas,.doors-arena');let stage=field.parentElement;if(!stage.classList.contains('game-stage')){stage=document.createElement('div');stage.className='game-stage';field.before(stage);stage.append(field);}return stage;}
  function showCountdown(){const stage=stageOf();stage.append(countdownElement);countdownElement.querySelector('strong').textContent=countdownValue;countdownElement.hidden=false;}
  /* Rundenende-Karte: Nochmal spielen / Bestenliste / Menue, im Spielfeld (.game-stage). */
  const NO_COUNTDOWN={parcours:true};
  const END_GAMES={mario:'Punkte',buster:'Mut-Punkte',forklift:'Punkte',nerve:'Punkte',parcours:'Tore'};
  const endCard=document.createElement('div');endCard.id='game-end-card';endCard.hidden=true;endCard.setAttribute('role','group');endCard.setAttribute('aria-label','Runde beendet');
  endCard.innerHTML='<div class=game-end-panel><span class=game-end-kicker>Runde beendet</span><strong class=game-end-score></strong><button type=button id=game-end-again class=game-end-primary>🔁 Nochmal spielen</button><div class=game-end-row><button type=button id=game-end-lb class=game-end-secondary>🏆 Bestenliste</button><button type=button id=game-end-menu class=game-end-text>✕ Menü</button></div></div>';
  let endTimer=0,endScore=null;
  function hideEnd(){clearTimeout(endTimer);endTimer=0;endCard.hidden=true;}
  function endVisible(){return !endCard.hidden&&endCard.offsetParent!==null&&!document.querySelector('#highscore-card.show');}
  function keyReady(){return endVisible()&&!document.querySelector('#score-submit-dialog.show');} /* Tastatur nur ohne offenen Punkte-Dialog, damit kein Rekord versehentlich verfaellt */
  function revealEnd(){
    if(!END_GAMES[game]||phase!=='finished')return;
    let score=endScore;if(score===null&&typeof pendingScoreToSave!=='undefined'&&Number.isFinite(pendingScoreToSave))score=pendingScoreToSave;
    endCard.querySelector('.game-end-score').textContent=score===null?'Das war deine Runde.':score+' '+END_GAMES[game];
    stageOf().append(endCard);endCard.hidden=false;
    if(keyReady())endCard.querySelector('#game-end-again').focus({preventScroll:true});
  }
  function showEnd(score,ms){if(!END_GAMES[game])return;endScore=Number.isFinite(score)?score:null;clearTimeout(endTimer);endTimer=setTimeout(revealEnd,ms??700);}
  function ended(score,ms){if(!game||!END_GAMES[game]||!['playing','finished'].includes(phase))return;clearTimers();close();phase='finished';showEnd(score,ms);}
  function restartWithCountdown(){
    if(!game||!END_GAMES[game])return;const btn=document.getElementById('restart-'+game+'-btn');if(!btn)return;
    hideEnd();btn.click(); /* Capture-Listener setzt phase=playing; danach Zeitgeber einfrieren wie in resume() */
    if(NO_COUNTDOWN[game])return; /* Tor-Parcours hat einen eigenen Wartezustand (Tippen zum Starten) */
    for(const timer of timers)clearTimeout(timer.id);held=new Set(timers);timers.clear();holdStart=performance.now();countdown();
  }
  endCard.querySelector('#game-end-again').addEventListener('click',restartWithCountdown);
  endCard.querySelector('#game-end-lb').addEventListener('click',()=>document.getElementById(game+'-leaderboard-btn')?.click());
  endCard.querySelector('#game-end-menu').addEventListener('click',()=>document.getElementById('exit-'+game+'-btn')?.click());
  for(const name of Object.keys(END_GAMES)){const old=document.getElementById('restart-'+name+'-btn');if(old){old.tabIndex=-1;old.setAttribute('aria-hidden','true');}}
  const timers = new Set(), memorySeen = new Set();
  let cdTimer = null;
  let held = new Set(), holdStart = 0; // Spiel-Zeitgeber, die beim Fortsetzen bis "Los!" eingefroren bleiben
  const dialog = document.createElement('dialog'); dialog.id = 'game-session-dialog';
  dialog.setAttribute('aria-labelledby','game-session-title');
  dialog.innerHTML = '<h2 id="game-session-title"></h2><div id="game-session-copy"></div><p id="game-session-status" role="status"></p><button type="button" id="game-session-action" class="submit-btn"></button><button type="button" id="game-session-restart" class="game-session-secondary" hidden>🔁 Neu starten</button>';
  document.body.append(dialog);
  dialog.addEventListener('cancel', event => event.preventDefault());
  const heading = dialog.querySelector('h2'), copy = dialog.querySelector('#game-session-copy'), action = dialog.querySelector('button'), status = dialog.querySelector('#game-session-status');
  const restartBtn=dialog.querySelector('#game-session-restart');
  restartBtn.addEventListener('click',()=>{next=null;if(dialog.open)dialog.close();restartWithCountdown();});
  function modal(title, text, label, callback, canRestart) {
    restartBtn.hidden=!(canRestart&&END_GAMES[game]);
    heading.textContent = title; copy.replaceChildren();
    if(Array.isArray(text)){const list=document.createElement('ul');for(const line of text){const item=document.createElement('li');const colon=line.indexOf(':');if(colon>0){const label=document.createElement('strong');label.textContent=line.slice(0,colon+1);item.append(label,document.createTextNode(' '+line.slice(colon+1).trim()));}else item.textContent=line;list.append(item);}copy.append(list);}else{const p=document.createElement('p');p.textContent=text;copy.append(p);}
    status.textContent = ''; action.textContent = label || ''; action.hidden = !label; next = callback;
    if (!dialog.open) dialog.showModal(); if (label) action.focus();
  }
  action.addEventListener('click', () => { const callback = next; next = null; callback?.(); });
  function arm(timer) {
    timer.started = performance.now(); timer.id = setTimeout(() => { timers.delete(timer); timer.callback(); }, timer.remaining);
  }
  function delay(callback, ms) { const timer = {callback, remaining: Math.max(0,ms), started:0, id:null}; timers.add(timer); if(phase!=='paused') arm(timer); return timer; }
  function clearTimers() { for(const timer of timers) clearTimeout(timer.id); timers.clear(); held.clear(); }
  function blocked() { return ['preview','countdown','paused','update'].includes(phase); }
  function close() { if(dialog.open) dialog.close();countdownElement.hidden=true; }
  function stop() { hideEnd(); clearTimers(); close(); phase='idle'; game=null; next=null; }
  function resume() {
    if(phase!=='paused') return;
    const pausedMs=performance.now()-pauseAt;
    if(game==='forklift' && nico?.cargo) nico.cargo.pickupTime += pausedMs;
    if(beforePause==='playing' || beforePause==='countdown') {
      /* Fortsetzen: immer wieder volles 3-2-1-Los von vorn, die Spielzeit bleibt bis dahin eingefroren. */
      close();
      if(beforePause==='playing') { held=new Set(timers); timers.clear(); holdStart=performance.now(); }
      else if(cdTimer) { clearTimeout(cdTimer.id); timers.delete(cdTimer); }
      cdTimer=null; countdown(); return;
    }
    phase=beforePause; close(); for(const timer of timers) arm(timer);
    if(phase==='countdown') showCountdown();
  }
  function releaseHeld() {
    if(!held.size) return;
    const waited=performance.now()-holdStart;
    if(game==='forklift' && nico?.cargo) nico.cargo.pickupTime += waited;
    for(const timer of held){timers.add(timer);arm(timer);}
    held=new Set();
  }
  function pause(silent) {
    if(!game || !['playing','countdown'].includes(phase)) return;
    beforePause=phase;phase='paused';pauseAt=performance.now();
    for(const timer of timers){clearTimeout(timer.id);timer.remaining=Math.max(0,timer.remaining-(pauseAt-timer.started));}
    if(typeof mKeys!=='undefined'){mKeys.left=false;mKeys.right=false;mKeys.up=false;mKeys.jumpPressed=false;}
    if(typeof flKeys!=='undefined') for(const key of Object.keys(flKeys)) flKeys[key]=false;
    if(silent!==true) modal('Spiel pausiert','Mit P, Escape oder dem Button fortsetzen.','Weiter spielen',resume,true);
  }
  function reopenPause() { if(phase==='paused' && game) modal('Spiel pausiert','Mit P, Escape oder dem Button fortsetzen.','Weiter spielen',resume,true); }
  function beginPlaying(){phase='playing';close();releaseHeld();}
  function countdown(){phase='countdown';let remaining=3;
    const step=()=>{countdownValue=remaining>0?String(remaining):'Los!';showCountdown();
      if(remaining>0){remaining--;cdTimer=delay(step,1000);}else cdTimer=delay(beginPlaying,350);}; step();
  }
  function enter(category, origin) {
    /* Immer zuerst Bereitschaftszustand; der Countdown startet erst nach „Jetzt spielen“. */
    stop(); game=category; phase='preview';
    modal('Bereit für die nächste Runde?','Dein Spiel wartet im Hintergrund. Es läuft erst nach deinem Start.','Jetzt spielen',()=>{if(phase==='preview'){close();if(NO_COUNTDOWN[game])phase='playing';else countdown();}});
  }
  function update(category, automatic, done) {
    const release=HoermannGameReleases.release(category), name=getLockedPlayerName();
    const key='hoermann_game_update_seen_v1:'+encodeURIComponent(name)+':'+category+':'+release.version;
    const seen=memorySeen.has(key)||(()=>{try{return localStorage.getItem(key)==='seen';}catch{return false;}})();
    const scoreCategories=release.scoreCategory!==category?[category,release.scoreCategory]:[category];
    const played=name && scoreCategories.some(score=>{const best=findExistingPlayerBest(score,name);return best?.isUser && best.score>0;});
    if(automatic && (!played || seen || release.version==='0.1')){done?.();return;}
    phase='update';
    modal((release.version==='0.1'?'Release ':'Update ')+release.version+' · '+portalGameNavigation[category].title,release.notes,'Verstanden',()=>{
      if(automatic){
        try{localStorage.setItem(key,'seen');if(localStorage.getItem(key)!=='seen')throw Error();memorySeen.add(key);}
        catch{status.textContent='Bestätigung lässt sich nicht dauerhaft speichern. Mit „Trotzdem weiter“ fortfahren; beim nächsten Besuch kann der Hinweis erneut erscheinen.';action.textContent='Trotzdem weiter';next=()=>{memorySeen.add(key);close();phase='idle';done?.();};return;}
      }
      close();phase='idle';done?.();
    });
  }
  window.addEventListener('keydown',event=>{
    const typing=event.target.closest?.('input,textarea,select,[contenteditable="true"]');
    if((event.key==='Enter'||event.key===' ')&&keyReady()&&(event.target===document.body||endCard.contains(event.target))){
      event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)restartWithCountdown();return;
    }
    if(typing || event.repeat || (!game && !dialog.open) || document.querySelector('#highscore-card.show'))return;
    if(event.key==='Escape'||event.key.toLowerCase()==='p'){
      event.preventDefault();event.stopImmediatePropagation();
      if(phase==='paused' && !document.hidden)resume();else pause();return;
    }
    if(blocked()){if(!event.target.closest?.('#game-session-dialog'))event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('pointerdown',event=>{
    if(blocked()&&!event.target.closest('#game-session-dialog')&&!(phase==='countdown'&&event.target.closest('.game-actions-bar'))){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('click',event=>{if(event.target.closest('[id^="restart-"]') && game){hideEnd();clearTimers();phase='playing';close();}},true);
  root.HoermannGameSession=Object.freeze({delay,blocked,stop,enter,update,pause,reopenPause,resume,state:()=>({game,phase}),ended,restartWithCountdown,finish:()=>{clearTimers();phase='finished';close();showEnd(null);},restart:()=>{hideEnd();clearTimers();phase='playing';close();}});
})(globalThis);


