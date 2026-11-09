// Automatisch erzeugt von relay/build.sh aus bomber-arena.html. Nicht von Hand bearbeiten.
// Source: engine.mjs
// Independent game simulation. All time and randomness belong to the authority.
const RULES = Object.freeze({width:15,height:13,fuse:2.5,flame:0.5,roundTime:120,countdown:3,winScore:3,maxPlayers:4,protocol:1});
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const SPAWNS=[[1,1],[13,11],[13,1],[1,11]];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cleanName = n => typeof n==='string' ? n.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,18)||'Spieler' : 'Spieler';
class Arena {
 constructor(random=Math.random){this.random=random;this.players=[];this.phase='lobby';this.round=0;this.clock=0;this.tiles=[];this.items={};this.bombs=[];this.flames=[];this.events=[];this.eventId=0;this.nextBomb=0;this.winner=null;this.matchWinner=null;this.shrink=0;this.shrinkAt=0;this.reason='';}
 add(id,name){if(this.phase!=='lobby'||this.players.length>=4||this.players.some(p=>p.id===id))return false;let slot=[0,1,2,3].find(s=>!this.players.some(p=>p.slot===s));this.players.push({id,name:cleanName(name),slot,ready:false,score:0,alive:false,x:SPAWNS[slot][0],y:SPAWNS[slot][1],capacity:1,power:2,speed:4,input:{x:0,y:0},inputAge:1,seq:-1,bombSeq:0,pendingBomb:false});return true;}
 remove(id){this.players=this.players.filter(p=>p.id!==id);if(this.phase!=='lobby'&&this.players.length<2){this.phase='lobby';this.reason='Zu wenige Spieler. Lade jemanden ein.';this.players.forEach(p=>{p.ready=false;p.score=0;p.alive=false;});this.round=0;this.matchWinner=null;this.bombs=[];this.flames=[];}else if(this.phase==='playing')this.checkEnd();}
 ready(id,value){if(this.phase==='lobby'){let p=this.players.find(p=>p.id===id);if(p)p.ready=value===true;}}
 canStart(){return this.phase==='lobby'&&this.players.length>=2&&this.players.every(p=>p.ready);}
 start(){if(!this.canStart())return false;this.players.forEach(p=>p.score=0);this.round=0;this.matchWinner=null;this.newRound();return true;}
 newRound(){this.round++;this.phase='countdown';this.clock=RULES.countdown;this.reason='';this.winner=null;this.shrink=0;this.shrinkAt=30;this.items={};this.bombs=[];this.flames=[];this.tiles=[];
  const safe=new Set(SPAWNS.flatMap(([x,y])=>[[x,y],[x+(x===1?1:-1),y],[x,y+(y===1?1:-1)]].map(p=>p.join(','))));
  // Mirror the crate distribution for equal starting conditions.
  const crate=new Map();
  for(let y=0;y<13;y++)for(let x=0;x<15;x++){const key=`${Math.min(x,14-x)},${Math.min(y,12-y)}`;if(!crate.has(key))crate.set(key,this.random()<0.78);this.tiles.push(x===0||x===14||y===0||y===12||(x%2===0&&y%2===0)?1:!safe.has(`${x},${y}`)&&crate.get(key)?2:0);}
  this.players.forEach(p=>{const [x,y]=SPAWNS[p.slot];Object.assign(p,{x,y,alive:true,capacity:1,power:2,speed:4,input:{x:0,y:0},inputAge:1,pendingBomb:false});});
 }
 receive(id,m){const p=this.players.find(p=>p.id===id);if(!p||!m||!Number.isSafeInteger(m.seq)||m.seq<=p.seq||m.seq>1e12)return;
  p.seq=m.seq;p.inputAge=0;const x=clamp(Number.isFinite(m.x)?Math.round(m.x):0,-1,1),y=clamp(Number.isFinite(m.y)?Math.round(m.y):0,-1,1);p.input={x,y:x?0:y};
  if(Number.isSafeInteger(m.b)&&m.b>p.bombSeq&&m.b<1e12){p.bombSeq=m.b;if(this.phase==='playing'&&p.alive)p.pendingBomb=true;}
 }
 at(x,y){return x<0||x>=15||y<0||y>=13?1:this.tiles[y*15+x];}
 event(type,data={}){this.events.push({id:++this.eventId,type,...data});this.events=this.events.slice(-40);}
 blocked(p,x,y){const r=.28;for(const cx of [Math.floor(x-r+.5),Math.floor(x+r+.5)])for(const cy of [Math.floor(y-r+.5),Math.floor(y+r+.5)]){if(this.at(cx,cy)!==0)return true;for(const b of this.bombs)if(b.x===cx&&b.y===cy&&!b.pass.includes(p.id))return true;}return false;}
 move(p,dt){let {x:dx,y:dy}=p.input;if(!dx&&!dy)return;const speed=p.speed*dt;let x=p.x+dx*speed,y=p.y+dy*speed;
  // Assist turns into a corridor, without allowing corner clipping.
  if(dx&&Math.abs(p.y-Math.round(p.y))<.22)y=p.y+clamp(Math.round(p.y)-p.y,-speed,speed);
  if(dy&&Math.abs(p.x-Math.round(p.x))<.22)x=p.x+clamp(Math.round(p.x)-p.x,-speed,speed);
  if(!this.blocked(p,x,y)){p.x=x;p.y=y;}else if(dx&&!this.blocked(p,p.x,y)){p.y=y;}else if(dy&&!this.blocked(p,x,p.y)){p.x=x;}
 }
 place(p){const x=Math.round(p.x),y=Math.round(p.y);if(this.at(x,y)!==0||this.bombs.some(b=>b.x===x&&b.y===y)||this.bombs.filter(b=>b.owner===p.id).length>=p.capacity)return;
  this.bombs.push({id:++this.nextBomb,x,y,owner:p.id,power:p.power,fuse:RULES.fuse,pass:this.players.filter(q=>q.alive&&Math.abs(q.x-x)<.79&&Math.abs(q.y-y)<.79).map(q=>q.id)});this.event('place',{x,y});
 }
 explode(first){const pending=[first],seen=new Set();while(pending.length){const b=pending.shift();if(seen.has(b.id)||!this.bombs.includes(b))continue;seen.add(b.id);this.bombs=this.bombs.filter(q=>q!==b);const cells=[[b.x,b.y]];
   for(const [dx,dy] of DIRS)for(let i=1;i<=b.power;i++){const x=b.x+dx*i,y=b.y+dy*i,t=this.at(x,y);if(t===1)break;cells.push([x,y]);if(t===2){this.tiles[y*15+x]=0;this.flames.push({x,y,ttl:RULES.flame,drop:this.random()<.42?['bomb','fire','speed'][Math.floor(this.random()*3)]:null});break;}delete this.items[`${x},${y}`];const chain=this.bombs.find(q=>q.x===x&&q.y===y);if(chain){pending.push(chain);break;}}
   for(const [x,y] of cells)if(!this.flames.some(f=>f.x===x&&f.y===y))this.flames.push({x,y,ttl:RULES.flame,drop:null});else{const f=this.flames.find(f=>f.x===x&&f.y===y);f.ttl=RULES.flame;}
   this.event('explode',{x:b.x,y:b.y});
  }}
 checkEnd(){if(this.phase!=='playing')return;const alive=this.players.filter(p=>p.alive);if(alive.length<=1||this.clock<=0){this.phase='result';this.clock=4;this.winner=alive.length===1?alive[0].id:null;if(this.winner){alive[0].score++;if(alive[0].score>=RULES.winScore)this.matchWinner=this.winner;}this.event('round-end');}}
 tick(dt){dt=clamp(dt,0,1/30);if(this.phase==='lobby')return;this.clock-=dt;
  if(this.phase==='countdown'){if(this.clock<=0){this.phase='playing';this.clock=RULES.roundTime;this.event('start');}return;}
  if(this.phase==='result'){if(this.clock<=0){if(this.matchWinner){this.phase='lobby';this.players.forEach(p=>p.ready=false);this.reason='Match beendet. Für eine Revanche erneut bereit melden.';}else this.newRound();}return;}
  const expired=this.flames.filter(f=>f.ttl-dt<=0);this.flames=this.flames.filter(f=>(f.ttl-=dt)>0);for(const f of expired)if(f.drop&&this.at(f.x,f.y)===0&&!this.flames.some(g=>g.x===f.x&&g.y===f.y))this.items[`${f.x},${f.y}`]=f.drop;
  for(const p of this.players){p.inputAge+=dt;if(p.inputAge>.3)p.input={x:0,y:0};if(!p.alive)continue;this.move(p,dt);if(p.pendingBomb){this.place(p);p.pendingBomb=false;}}
  for(const b of this.bombs){b.fuse-=dt;b.pass=b.pass.filter(id=>{const p=this.players.find(p=>p.id===id);return p?.alive&&Math.abs(p.x-b.x)<.79&&Math.abs(p.y-b.y)<.79;});}
  for(const b of [...this.bombs])if(b.fuse<=0)this.explode(b);
  // Sudden death: one ring every 5 seconds in the final 30 seconds.
  if(this.clock<=this.shrinkAt&&this.shrink<6){this.shrink++;this.shrinkAt-=5;const k=this.shrink;for(let y=k;y<13-k;y++)for(let x=k;x<15-k;x++)if(x===k||x===14-k||y===k||y===12-k){this.tiles[y*15+x]=1;delete this.items[`${x},${y}`];}this.bombs=this.bombs.filter(b=>this.at(b.x,b.y)===0);this.event('shrink');}
  for(const p of this.players){if(!p.alive)continue;if(this.at(Math.round(p.x),Math.round(p.y))===1||this.flames.some(f=>Math.abs(p.x-f.x)<.72&&Math.abs(p.y-f.y)<.72)){p.alive=false;this.event('eliminate',{player:p.id});continue;}const key=`${Math.round(p.x)},${Math.round(p.y)}`,item=this.items[key];if(item){if(item==='bomb')p.capacity=Math.min(8,p.capacity+1);if(item==='fire')p.power=Math.min(8,p.power+1);if(item==='speed')p.speed=Math.min(7,p.speed+.5);delete this.items[key];this.event('item',{player:p.id,item});}}
  this.checkEnd();
 }
 snapshot(){return {v:1,phase:this.phase,round:this.round,clock:this.clock,tiles:[...this.tiles],items:{...this.items},bombs:this.bombs.map(({pass,...b})=>({...b})),flames:this.flames.map(({drop,...f})=>({...f})),players:this.players.map(({input,inputAge,seq,bombSeq,pendingBomb,...p})=>({...p})),events:this.events.map(e=>({...e})),winner:this.winner,matchWinner:this.matchWinner,shrink:this.shrink,reason:this.reason};}
}

// Source: room.mjs

class Room {
 constructor(code,random){this.code=code;this.game=new Arena(random);this.members=new Map();this.host=null;this.age=0;this.closed=false;}
 join(id,name,send){if(this.closed||!this.game.add(id,cleanName(name))){send({type:'error',message:this.game.phase==='lobby'?'Der Raum ist voll. Maximal vier Spieler.':'Die Runde läuft bereits. Bitte später beitreten.'});return false;}this.members.set(id,{send,rate:0});if(this.game.players.length>=2)this.game.reason='';if(!this.host)this.host=id;send({type:'welcome',id,code:this.code});this.broadcast();return true;}
 remove(id){this.members.delete(id);this.game.remove(id);if(this.host===id)this.host=this.members.keys().next().value||null;this.broadcast();}
 receive(id,m){const member=this.members.get(id);if(!member||!m||typeof m!=='object'||++member.rate>120)return;
  if(m.type==='input')this.game.receive(id,m);
  if(m.type==='ready'&&typeof m.ready==='boolean'){this.game.ready(id,m.ready);this.broadcast();}
  if(m.type==='start'&&id===this.host){this.game.start();this.broadcast();}
  if(m.type==='ping')member.send({type:'pong',time:m.time});
 }
 tick(dt){this.game.tick(dt);this.age+=dt;if(this.age>=1){this.age=0;for(const m of this.members.values())m.rate=0;}}
 broadcast(){const message={type:'state',host:this.host,code:this.code,state:this.game.snapshot()};for(const {send} of this.members.values())try{send(message);}catch{ /* Transport close handler removes the member. */ }}
 close(){if(this.closed)return;this.closed=true;for(const {send} of this.members.values())try{send({type:'error',message:'Der Gastgeber hat den Raum geschlossen. Bitte einen neuen Raum erstellen.'});}catch{}this.members.clear();}
}


/* ===== Cloudflare Worker + Durable Object: WebSocket-Relay fuer die Bomber-Arena ===== */
const ALLOWED_ORIGINS = ['https://dephosa.github.io', 'http://localhost:8099', 'http://127.0.0.1:8099'];
const validCode = c => /^[A-HJ-NP-Z2-9]{8}$/.test(c);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Bomber-Arena-Relay läuft.', { status: 200 });
    const origin = request.headers.get('Origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return new Response('Origin nicht erlaubt', { status: 403 });
    const code = (url.searchParams.get('room') || '').toUpperCase();
    if (!validCode(code)) return new Response('Ungültiger Raumcode', { status: 400 });
    return env.ARENA_ROOM.get(env.ARENA_ROOM.idFromName(code)).fetch(request);
  }
};

export class ArenaRoom {
  constructor() { this.room = null; this.timer = null; this.last = 0; this.acc = 0; }
  async fetch(request) {
    const url = new URL(request.url);
    const create = url.searchParams.get('create') === '1';
    const name = url.searchParams.get('name') || 'Spieler';
    const code = url.searchParams.get('room').toUpperCase();
    const pair = new WebSocketPair(); const [client, ws] = Object.values(pair);
    ws.accept();
    const send = m => { try { ws.send(JSON.stringify(m)); } catch {} };
    if (create && this.room && this.room.members.size) { send({ type: 'error', message: 'Dieser Raumcode ist bereits vergeben. Erstelle einen neuen Raum.' }); ws.close(1000); return new Response(null, { status: 101, webSocket: client }); }
    if (!create && !(this.room && this.room.members.size)) { send({ type: 'error', message: 'Raum nicht gefunden. Der Raumersteller muss den Raum geöffnet lassen.' }); ws.close(1000); return new Response(null, { status: 101, webSocket: client }); }
    if (create) this.room = new Room(code);
    const id = crypto.randomUUID();
    if (!this.room.join(id, name, send)) { ws.close(1000); return new Response(null, { status: 101, webSocket: client }); }
    this.start();
    ws.addEventListener('message', e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.room?.receive(id, m); });
    const gone = () => { this.room?.remove(id); if (!this.room?.members.size) this.stop(); };
    ws.addEventListener('close', gone); ws.addEventListener('error', gone);
    return new Response(null, { status: 101, webSocket: client });
  }
  start() {
    if (this.timer) return;
    this.last = Date.now(); this.acc = 0;
    this.timer = setInterval(() => {
      const now = Date.now(); this.acc += Math.min(0.25, (now - this.last) / 1000); this.last = now;
      while (this.acc >= 1 / 60) { this.room?.tick(1 / 60); this.acc -= 1 / 60; }
      this.room?.broadcast();
    }, 50);
  }
  stop() { clearInterval(this.timer); this.timer = null; this.room = null; }
}
