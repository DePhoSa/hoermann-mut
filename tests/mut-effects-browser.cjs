const {chromium}=require('playwright');const http=require('node:http');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
  const root=path.resolve(__dirname,'..');const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));let instance;
  try{
    instance=await chromium.launchServer({headless:true,channel:'msedge'});const browser=await chromium.connect(instance.wsEndpoint());const page=await browser.newPage({viewport:{width:1360,height:900}});const origin='http://127.0.0.1:'+server.address().port;
    await page.route('**/*',r=>{const url=r.request().url();if(url.startsWith(origin+'/'))return r.continue();if(url.startsWith('https://ntfy.sh/'))return r.fulfill({contentType:'application/x-ndjson',body:''});if(url.startsWith('https://bytebin.lucko.me/'))return r.fulfill({json:{scores:{},chat:[]}});return r.abort();});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>globalThis.HoermannMutEffects);
    const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    for(const viewport of [{width:1360,height:900},{width:390,height:844}]){
      await page.setViewportSize(viewport);await page.waitForTimeout(250);
      for(const effect of ['confetti','hands','door','gold','firework','heart','rocket']){
        const sample=await page.evaluate(async effect=>{
          const frameTimes=[];let previous=null;HoermannMutEffects.trigger(effect);
          await new Promise(resolve=>{function tick(now){if(previous!==null)frameTimes.push(now-previous);previous=now;if(frameTimes.length<150)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
          frameTimes.sort((a,b)=>a-b);const stats=HoermannMutEffects.stats();HoermannMutEffects.stop();return {p95:Math.round(frameTimes[Math.floor(frameTimes.length*.95)]*10)/10,count:stats.count};
        },effect);
        assert.ok(sample.p95<34,`${effect}: prolonged frame stalls at ${viewport.width}px: ${sample.p95}ms`);
        assert.equal(await page.evaluate(()=>HoermannMutEffects.stats().active),false);
        console.log(`${viewport.width}px ${effect}: p95 frame ${sample.p95}ms (4x CPU throttle)`);
      }
    }
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>HoermannMutEffects.trigger('confetti'));assert.ok(await page.evaluate(()=>HoermannMutEffects.stats().count)<25);await page.evaluate(()=>HoermannMutEffects.stop());assert.deepEqual(errors,[]);console.log('PASS: all seven effects desktop/mobile, reduced motion, no page errors or external traffic.');
  }finally{if(instance)await instance.kill();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
