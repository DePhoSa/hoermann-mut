const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../mut-effects.js'),'utf8');
function setup(reduced=false){
  let id=0,textDraws=0;const frames=new Map(),timers=new Map(),listeners={};
  const paint=new Proxy({fillText(){textDraws++;}},{get:(target,key)=>target[key]||(()=>{})});
  const panel=()=>({style:{},animate(){return {cancel(){}}}});
  const overlay={style:{},querySelectorAll:()=>[panel(),panel(),panel()]};
  const canvas={getContext:()=>paint};
  const doc={hidden:false,getElementById:id=>id==='fx-canvas'?canvas:id==='sectional-door-overlay'?overlay:panel(),createElement:()=>({getContext:()=>paint}),addEventListener:(key,fn)=>listeners[key]=fn};
  const context={document:doc,innerWidth:1360,innerHeight:900,matchMedia:()=>({matches:reduced}),addEventListener:(key,fn)=>listeners[key]=fn,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:key=>timers.delete(key)};
  vm.runInNewContext(source,context);
  return {api:context.HoermannMutEffects,frames,timers,listeners,doc,canvas,overlay,textDraws:()=>textDraws,step(t){const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(t);}};
}
test('all seven variants have bounded work and stop cleanly; rocket has a visual effect',()=>{
  const env=setup();for(const type of ['confetti','hands','gold','firework','heart','rocket','door']){
    env.api.trigger(type);assert.ok(env.frames.size<=1);assert.ok(env.api.stats().count<=110);
    if(type==='door'){assert.equal(env.overlay.style.display,'block');for(const fn of [...env.timers.values()])fn();}
    else{assert.ok(env.api.stats().count>0);for(let t=0;t<=4200;t+=1000/60)env.step(t);}
    assert.equal(env.api.stats().active,false);env.api.stop();assert.equal(env.frames.size,0);assert.equal(env.api.stats().animations,0);
  }
});
test('emoji rasterization is cached, replacement has one frame and hidden tabs stop',()=>{
  const env=setup();env.api.trigger('hands');const text=env.textDraws();for(let i=0;i<30;i++)env.step(i*16.667);assert.equal(env.textDraws(),text);
  env.api.trigger('hands');assert.equal(env.textDraws(),text);assert.equal(env.frames.size,1);
  env.doc.hidden=true;env.listeners.visibilitychange();assert.equal(env.frames.size,0);assert.equal(env.api.stats().count,0);
});
test('effect lifetime follows elapsed time at 30 through 240 Hz; reduced motion cuts work',()=>{
  for(const hz of [30,60,120,144,240]){const env=setup();env.api.trigger('gold');for(let i=0;i<=hz*.5;i++)env.step(i*1000/hz);assert.equal(env.api.stats().active,true);for(let i=Math.floor(hz*.5)+1;i<=hz*2;i++)env.step(i*1000/hz);assert.equal(env.api.stats().active,false);}
  const env=setup(true);env.api.trigger('confetti');assert.ok(env.api.stats().count<25);for(let t=0;t<=500;t+=16.667)env.step(t);assert.equal(env.frames.size,0);
});
