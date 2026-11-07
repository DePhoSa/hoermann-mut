// Balance-Messung Tor-Parcours: Bots mit menschlichen Reaktionszeiten, siehe docs/BALANCE-PARCOURS.md.
// Alter Stand (3.4.0): CFG={"FIRST_X":760,"EASE_N":0,"STEP0":110,"BASE_GAP":176} node tests/balance-parcours.cjs
// Mirror of parcours.js physics (60 Hz fixed step). CFG env overrides constants.
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const CFG=Object.assign({BASE_SPEED:2.4,MAX_SPEED:3.4,RAMP:30,BASE_GAP:184,MIN_GAP:144,SPACING:270,STEP:110,STEP0:80,FIRST_X:500,EASE_N:4,EASE_GAP:20,EASE_STEP:50,G:0.36,JUMP:-7.2,GATE_W:56},JSON.parse(process.env.CFG||'{}'));
const H=360,W=640;
function gauss(r){return Math.sqrt(-2*Math.log(1-r()))*Math.cos(2*Math.PI*r())}
function run(seed,bot,maxGates=80){
  const r=mulberry(seed),rb=mulberry(seed*7919+13);
  const C=CFG; let score=0,y=H/2,vy=0,gates=[],last=H/2;
  const diff=()=>Math.min(1,score/C.RAMP);
  let gi=0;function spawn(x){const ease=gi<C.EASE_N;const gap=Math.round(C.BASE_GAP-(C.BASE_GAP-C.MIN_GAP)*diff())+(ease?C.EASE_GAP:0);const STEPn=ease?C.EASE_STEP:(C.STEP0+(C.STEP-C.STEP0)*diff());gi++;const m=34;
    const lo=Math.max(m+gap/2,last-STEPn),hi=Math.min(H-m-gap/2,last+STEPn);
    const c=Math.round(lo+r()*Math.max(0,hi-lo));last=c;const th=c-Math.round(gap/2);gates.push({x,th,by:th+gap,w:C.GATE_W,p:false,c});}
  spawn(C.FIRST_X);spawn(C.FIRST_X+C.SPACING);
  const hist=[];let tapQueue=[],lastTap=-99,t=0,targets=new Map(),started=false,startAt=Math.round(bot.startDelay??30);
  const px=90,hr=15;
  while(t<60*60*3){
    t++;
    if(!started){ if(t>=startAt){started=true;vy=C.JUMP;lastTap=t;} else continue; }
    const D=Math.max(1,Math.round(bot.delay+gauss(rb)*bot.delayJit));
    const ng=gates.filter(g=>g.x+g.w>px-hr).sort((a,b)=>a.x-b.x)[0];
    if(ng){ if(!targets.has(ng)) targets.set(ng,ng.c+gauss(rb)*bot.aimSigma+bot.aimBias);
      const tg=targets.get(ng);
      // forward model: where will I be when a tap decided now takes effect (t+D), given queued taps
      let fy=y+gauss(rb)*bot.obsSigma,fv=vy;
      for(let k=0;k<D;k++){ if(tapQueue.some(q=>q===t+k))fv=C.JUMP; fv=Math.min(9,fv+C.G); fy+=fv; }
      if(fy>tg && t-lastTap>=bot.minInt && rb()>bot.lapse){ lastTap=t; tapQueue.push(t+D+Math.round(gauss(rb)*bot.tapJit)); }
    }
    for(let i=tapQueue.length-1;i>=0;i--) if(tapQueue[i]<=t){vy=C.JUMP;tapQueue.splice(i,1);}
    const speed=C.BASE_SPEED+(C.MAX_SPEED-C.BASE_SPEED)*diff();
    vy=Math.min(9,vy+C.G);y+=vy;
    if(y-17<0){y=17;vy=0}
    if(y+17>H) return score;
    for(const g of gates)g.x-=speed;
    for(let i=gates.length-1;i>=0;i--){const g=gates[i];
      for(const [rx,ry,rw,rh] of [[g.x,-1000,g.w,g.th+1000],[g.x,g.by,g.w,1000]]){
        const cx=Math.max(rx,Math.min(px,rx+rw)),cy=Math.max(ry,Math.min(y,ry+rh));
        if((px-cx)**2+(y-cy)**2<hr*hr)return score;}
      if(!g.p&&g.x+g.w/2<px){g.p=true;score++;}
      if(g.x+g.w<-10)gates.splice(i,1);}
    const lg=gates[gates.length-1];
    if(lg&&lg.x<=W+120-C.SPACING)spawn(lg.x+C.SPACING);
    if(score>=maxGates)return score;
  }
  return score;
}
const LEVELS={
 'Anfaenger (300ms)':{delay:18,delayJit:4,tapJit:3,aimSigma:16,aimBias:30,obsSigma:3,minInt:12,lapse:0.04},
 'Casual (240ms)':{delay:14,delayJit:3,tapJit:2.5,aimSigma:12,aimBias:30,obsSigma:2.5,minInt:10,lapse:0.02},
 'Durchschnitt (200ms)':{delay:12,delayJit:2.5,tapJit:2,aimSigma:9,aimBias:30,obsSigma:2,minInt:9,lapse:0.01},
 'Gut (150ms)':{delay:9,delayJit:2,tapJit:1.5,aimSigma:6,aimBias:30,obsSigma:1.5,minInt:8,lapse:0.003},
 'Sehr gut (120ms)':{delay:7,delayJit:1.5,tapJit:1,aimSigma:4,aimBias:30,obsSigma:1,minInt:7,lapse:0.001},
};
const N=+process.env.N||400;
for(const [name,b] of Object.entries(LEVELS)){
  const res=[];for(let s=1;s<=N;s++)res.push(run(s,b));res.sort((a,b)=>a-b);
  const q=p=>res[Math.floor(p*(N-1))];
  console.log(name.padEnd(26),'min',res[0],'p10',q(.1),'p25',q(.25),'med',q(.5),'p75',q(.75),'p90',q(.9),'max',res[N-1],' <3:',(res.filter(x=>x<3).length/N*100).toFixed(1)+'%',' >=25:',(res.filter(x=>x>=25).length/N*100).toFixed(0)+'%');
}
