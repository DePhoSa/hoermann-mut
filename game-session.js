/* One session controller: pause, delayed callbacks, update acknowledgements and start dialogs. */
(function(root) {
  let game = null, phase = 'idle', beforePause = null, pauseAt = 0, next = null;
  const timers = new Set(), memorySeen = new Set();
  const dialog = document.createElement('dialog'); dialog.id = 'game-session-dialog';
  dialog.setAttribute('aria-labelledby','game-session-title');
  dialog.innerHTML = '<h2 id="game-session-title"></h2><div id="game-session-copy"></div><p id="game-session-status" role="status"></p><button type="button" id="game-session-action" class="submit-btn"></button>';
  document.body.append(dialog);
  dialog.addEventListener('cancel', event => event.preventDefault());
  const heading = dialog.querySelector('h2'), copy = dialog.querySelector('#game-session-copy'), action = dialog.querySelector('button'), status = dialog.querySelector('#game-session-status');
  function modal(title, text, label, callback) {
    heading.textContent = title; copy.replaceChildren();
    for (const line of Array.isArray(text) ? text : [text]) { const p = document.createElement('p'); p.textContent = line; copy.append(p); }
    status.textContent = ''; action.textContent = label || ''; action.hidden = !label; next = callback;
    if (!dialog.open) dialog.showModal(); if (label) action.focus();
  }
  action.addEventListener('click', () => { const callback = next; next = null; callback?.(); });
  function arm(timer) {
    timer.started = performance.now(); timer.id = setTimeout(() => { timers.delete(timer); timer.callback(); }, timer.remaining);
  }
  function delay(callback, ms) { const timer = {callback, remaining: Math.max(0,ms), started:0, id:null}; timers.add(timer); if(phase!=='paused') arm(timer); return timer; }
  function clearTimers() { for(const timer of timers) clearTimeout(timer.id); timers.clear(); }
  function blocked() { return ['preview','countdown','paused','update'].includes(phase); }
  function close() { if(dialog.open) dialog.close(); }
  function stop() { clearTimers(); close(); phase='idle'; game=null; next=null; }
  function resume() {
    if(phase!=='paused') return;
    const pausedMs=performance.now()-pauseAt;
    if(game==='forklift' && nico?.cargo) nico.cargo.pickupTime += pausedMs;
    phase=beforePause; close(); for(const timer of timers) arm(timer);
    if(phase==='countdown') modal('Gleich geht’s los', 'Der Countdown läuft weiter.', null);
  }
  function pause() {
    if(!game || !['playing','countdown'].includes(phase)) return;
    beforePause=phase;phase='paused';pauseAt=performance.now();
    for(const timer of timers){clearTimeout(timer.id);timer.remaining=Math.max(0,timer.remaining-(pauseAt-timer.started));}
    if(typeof mKeys!=='undefined'){mKeys.left=false;mKeys.right=false;mKeys.up=false;mKeys.jumpPressed=false;}
    if(typeof flKeys!=='undefined') for(const key of Object.keys(flKeys)) flKeys[key]=false;
    modal('Spiel pausiert','Mit P, Escape oder dem Button fortsetzen.','Weiter spielen',resume);
  }
  function beginPlaying(){phase='playing';close();}
  function countdown(){phase='countdown';let remaining=3;
    const step=()=>{modal(remaining>0?String(remaining):'Los!',remaining>0?'Mach dich bereit.':'Viel Erfolg!',null);
      if(remaining>0){remaining--;delay(step,1000);}else delay(beginPlaying,350);}; step();
  }
  function enter(category, origin) {
    stop(); game=category; phase=origin==='menu'?'countdown':'preview';
    if(origin==='menu')countdown();else modal('Bereit für die nächste Runde?','Dein Spiel wartet im Hintergrund. Es läuft erst nach deinem Start.','Jetzt spielen',beginPlaying);
  }
  function update(category, automatic, done) {
    const release=HoermannGameReleases.release(category), name=getLockedPlayerName();
    const key='hoermann_game_update_seen_v1:'+encodeURIComponent(name)+':'+category+':'+release.version;
    const seen=memorySeen.has(key)||(()=>{try{return localStorage.getItem(key)==='seen';}catch{return false;}})();
    const scoreCategories=category==='buster'?['buster','buster_v02']:[release.scoreCategory];
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
    if(typing || event.repeat || (!game && !dialog.open))return;
    if(event.key==='Escape'||event.key.toLowerCase()==='p'){
      event.preventDefault();event.stopImmediatePropagation();
      if(phase==='paused' && !document.hidden)resume();else pause();return;
    }
    if(blocked()){if(!event.target.closest?.('#game-session-dialog'))event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('pointerdown',event=>{
    if(blocked()&&!event.target.closest('#game-session-dialog')){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('click',event=>{if(event.target.closest('[id^="restart-"]') && game){clearTimers();phase='playing';close();}},true);
  root.HoermannGameSession=Object.freeze({delay,blocked,stop,enter,update,pause,resume,state:()=>({game,phase}),finish:()=>{clearTimers();phase='finished';close();},restart:()=>{clearTimers();phase='playing';close();}});
})(globalThis);


