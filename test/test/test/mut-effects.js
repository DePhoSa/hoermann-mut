/* Decorative effects only: one clock, cached emoji sprites, bounded canvas work. */
(function(root) {
  const canvas=document.getElementById('fx-canvas'), ctx=canvas.getContext('2d');
  const sprites=new Map(), animations=new Set();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let particles=[], frame=null, last=null, elapsed=0, cleanupTimer=null, scale=1;
  function resize(){
    scale=Math.min(1,Math.sqrt(1600000/(innerWidth*innerHeight)));
    canvas.width=Math.ceil(innerWidth*scale);canvas.height=Math.ceil(innerHeight*scale);
    ctx.setTransform(scale,0,0,scale,0,0);
  }
  function sprite(emoji){
    if(!sprites.has(emoji)){const image=document.createElement('canvas');image.width=image.height=80;
      const paint=image.getContext('2d');paint.font='48px sans-serif';paint.textAlign='center';paint.textBaseline='middle';paint.fillText(emoji,40,42);sprites.set(emoji,image);}
    return sprites.get(emoji);
  }
  function clear(){ctx.clearRect(0,0,innerWidth,innerHeight);}
  function stop(){
    if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;particles=[];clearTimeout(cleanupTimer);
    for(const animation of animations)animation.cancel();animations.clear();
    document.getElementById('sectional-door-overlay').style.display='none';clear();
  }
  function animateElement(element,keyframes,options){
    const animation=element.animate(keyframes,options);animations.add(animation);
    animation.onfinish=()=>{if(options.fill!=='forwards'){animations.delete(animation);animation.cancel();}};return animation;
  }
  function trigger(type){
    stop();elapsed=0;if(document.hidden)return;
    const w=innerWidth,h=innerHeight, small=w<600;
    const count=n=>Math.max(1,Math.round(n*(reduced.matches ? .18 : small ? .65 : 1)));
    const add=(kind,n,emojis)=>{for(let i=0;i<count(n);i++){
      const angle=Math.random()*Math.PI*2, speed=2+Math.random()*7;
      const p={kind,x:w*.5,y:h*.5,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:4+Math.random()*5,
        color:['#f59c00','#38bdf8','#fb7185','#34d399','#fff'][i%5],life:1,fade:.016,gravity:0,rotation:Math.random()*6.28};
      if(kind==='confetti')Object.assign(p,{vy:-5-Math.random()*14,vx:(Math.random()-.5)*16,gravity:.42,fade:.007,size:6+Math.random()*10});
      if(kind==='emoji'){p.emoji=emojis[i%emojis.length];p.image=sprite(p.emoji);p.size=32+Math.random()*12;p.vx=(Math.random()-.5)*4;p.vy=-4-Math.random()*6;p.fade=.01;
        if(type==='hands'){p.x=Math.random()*w;p.y=h+30;}}
      if(kind==='firework'){p.x=w*(.25+(i%3)*.25);p.y=h*(.2+(i%3)*.1);p.gravity=.15;}
      particles.push(p);
    }};
    if(type==='confetti')add('confetti',110);
    else if(type==='hands')add('emoji',28,['🙌','👏','💪','🦁','🌟','🚀','🔥','⚡']);
    else if(type==='gold'||type==='spark')add('spark',64);
    else if(type==='firework')add('firework',90);
    else if(type==='heart'){
      add('emoji',24,['❤️‍🔥','🧡','💪','🛡️','⚡']);
      if(!reduced.matches)animateElement(document.getElementById('mut-btn'),[{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:600,easing:'ease-out'});
    }else if(type==='rocket'){
      add('spark',40);const image=sprite('🚀');particles.push({kind:'emoji',image,x:w*.5,y:h*.8,vx:0,vy:-9,size:60,life:1,fade:.008,gravity:0});
    }else if(type==='door'){
      const overlay=document.getElementById('sectional-door-overlay');overlay.style.display='block';
      overlay.querySelectorAll('.door-panel').forEach((panel,index)=>animateElement(panel,[{transform:'translateY(0)'},{transform:`translateY(-${(index+1)*120}%)`}],{duration:reduced.matches?150:900,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'}));
      cleanupTimer=setTimeout(stop,reduced.matches?160:920);
    }
    if(particles.length)frame=requestAnimationFrame(draw);
  }
  function draw(now){
    frame=null;if(document.hidden){stop();return;}
    const delta=last===null?0:Math.min(50,Math.max(0,now-last));last=now;elapsed+=delta;
    const step=delta/(1000/60);clear();
    let alive=0;
    for(const p of particles){
      if(p.life<=0)continue;
      p.x+=p.vx*step;p.y+=p.vy*step+.5*p.gravity*step*step;p.vy+=p.gravity*step;
      if(p.kind==='confetti')p.vx*=Math.pow(.98,step);
      p.life-=p.fade*step;p.rotation+=.08*step;
      if(p.life<=0)continue;alive++;
      if(p.y < -100||p.y>innerHeight+100||p.x < -100||p.x>innerWidth+100)continue;
      ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;
      if(p.kind==='emoji')ctx.drawImage(p.image,p.x-p.size/2,p.y-p.size/2,p.size,p.size);
      else if(p.kind==='confetti'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);ctx.restore();}
      else{ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    }
    ctx.globalAlpha=1;
    if(alive&&elapsed<(reduced.matches?450:4000))frame=requestAnimationFrame(draw);else{particles=[];last=null;clear();}
  }
  addEventListener('resize',()=>{stop();resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  resize();root.HoermannMutEffects=Object.freeze({trigger,stop,stats:()=>({count:particles.length,active:frame!==null,elapsed,sprites:sprites.size,animations:animations.size})});
})(globalThis);
