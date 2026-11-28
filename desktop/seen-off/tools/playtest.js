// Headless playtest bot: plays whole days out with no cheats and a simple sensible policy.
// usage: RUNS=n HEROES=rtk [SECOND=1 STICKS=14 NEWPLACES=1 PLACES=rock,tower,arcades,winter FRESH=0] node tools/playtest.js out.json
// SECOND=1 skips the first-day route lock, STICKS sets the rock sticks, NEWPLACES=1 prefers the milestone-2 places,
// PLACES=ids picks those places when offered and otherwise Calls it a day at Last Orders.
const path=require('path'),http=require('http'),fs=require('fs');const {chromium}=require('playwright-core');
const WEB=process.env.WEB||path.join(__dirname,'..','web');
const EXE=process.env.CHROME||[path.join(process.env.HOME,'.cache/ms-playwright/chromium-1148/chrome-linux/chrome'),path.join(process.env.HOME,'.cache/ms-playwright/chromium-1255/chrome-linux64/chrome')].find(f=>fs.existsSync(f));
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png'};
const srv=http.createServer((q,r)=>{const f=path.join(WEB,decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/,'/index.html'));if(!fs.existsSync(f)){r.writeHead(404);return r.end();}r.writeHead(200,{'content-type':T[path.extname(f)]||'x'});fs.createReadStream(f).pipe(r);});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const policy=()=>{ // one bot step in the page; returns a label
  const S=__SO.S,B=__SO.B(),R=__SO.run(),q=s=>document.querySelector(s),click=s=>{const e=q(s);if(e&&!e.disabled){e.click();return true;}return false;};
  const L=window.__PT||(window.__PT={fights:[],cur:null});
  if(S.mode){__SO.act('back');return 'back';}
  const ov=q('.arrive');if(ov&&ov.click)ov.click();
  switch(S.scr){
    case 'title':return 'stop';case 'report':return 'stop';
    case 'cat':{__SO.act('cat',S.offer[0]);return 'cat';}
    case 'stage':{const all=[...document.querySelectorAll('#view [data-a="place"]:not([disabled])')];const want=window.__PTPLACES||[];const hit=want.map(id=>all.find(b=>b.dataset.i===id)).find(Boolean);if(hit){hit.click();return 'place';}if(want.length&&click('#view [data-a="callday"]'))return 'callday';if(window.__PTNEW){const ps=all.filter(b=>!['prom','south','central','north'].includes(b.dataset.i));if(ps.length){ps[0].click();return 'place';}}return click('#view [data-a="place"]:not([disabled])')?'place':'stage?';}
    case 'map':{const go=[...document.querySelectorAll('#view .node.go')];if(!go.length)return 'map?';
      const hpf=R.hp/R.max,pref=hpf<.5?['R','S','E','T','F','L','B']:['L','T','F','E','S','R','B'];
      go.sort((a,b)=>{const ta=(a.className.match(/t-(\w)/)||[])[1],tb=(b.className.match(/t-(\w)/)||[])[1];return pref.indexOf(ta)-pref.indexOf(tb);});go[0].click();return 'node';}
    case 'combat':{
      if(!B||B.over)return 'wait';
      if(!L.cur||L.cur.b!==B){L.cur={b:B,kind:B.kind,stage:R.stage,hp0:R.hp,max:R.max,en:B.en.map(e=>e.k).join(),hero:R.hero,deck:R.deck.length};L.fights.push(L.cur);}
      L.cur.turns=B.turn;L.cur.hp1=R.hp;
      const H=__SO.H(),al=B.en.filter(e=>!e.dead),C=__SO.CARDS;
      if(R.hp<R.max*.4&&R.brews.length){const bi=R.brews.findIndex(b=>b==='tea'||b==='scraps'||b==='mac');if(bi>=0){__SO.useBrew(bi,null);__SO.render();return 'brew';}}
      let inc=0;al.forEach(e=>{const m=e.mv||{};if(m.a)inc+=(m.tall&&B.hand.length>5?m.tall:m.a)*(m.x||1)+(e.st.gus||0)*(m.x||1);});
      const need=Math.max(0,inc-H.block);
      const pl=B.hand.map((c,i)=>({c,i,d:C[c.id]})).filter(x=>__SO.playable(x.c));
      if(!pl.length){__SO.endTurn();__SO.render();return 'end';}
      const isBlk=x=>/Block/.test(x.d.tx)&&x.d.type!=='A';
      let pickx=pl.find(x=>x.d.type==='P')||null;
      if(!pickx&&need>0&&R.hp-need<R.max*.6)pickx=pl.find(isBlk);
      if(!pickx)pickx=pl.find(x=>x.d.type==='A')||pl.find(x=>!isBlk(x)||need>0)||null;
      if(!pickx){__SO.endTurn();__SO.render();return 'end';}
      let t=null;if(pickx.d.o.t){t=B.en.indexOf(al.slice().sort((a,b)=>(a.hp+a.block)-(b.hp+b.block))[0]);}
      if(!__SO.playCard(pickx.i,t)){__SO.endTurn();__SO.render();return 'end!';}
      __SO.render();return 'play';}
    case 'reward':{if(L.cur&&!L.cur.done){L.cur.done=1;L.cur.won=1;L.cur.hp1=R.hp;}
      return click('#view [data-a="boss"]')||click('#view [data-a="take"]')||click('#view [data-a="leave"]')?'reward':'reward?';}
    case 'rest':return click('#view [data-a="rest"]')||click('#view [data-a="leave"]')?'rest':'rest?';
    case 'shop':return click('#view [data-a="leave"]')?'shop':'shop?';
    default:return click('#view [data-a="opt"]')||click('#view [data-a="leave"]')||click('#view .btn.go')||click('#view [data-a]')?S.scr:S.scr+'?';
  }
};
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port;
const b=await chromium.launch({executablePath:EXE});const out=[];const N=+(process.env.RUNS||4),HE=(process.env.HEROES||'rtk').split('');
for(const hero of HE)for(let n=0;n<N;n++){
  const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/`);await sleep(500);
  const fresh=process.env.FRESH!=='0';
  await p.evaluate(a=>{if(a.fresh){localStorage.clear();}__SO.setFx(0);__SO.S.hero=a.hero;__SO.DAY.done1=a.second?1:0;if(a.sticks!=null)__SO.DAY.sticks=a.sticks;window.__PTNEW=a.newp;window.__PTPLACES=a.places;__SO.act('begin');},{newp:process.env.NEWPLACES==='1',places:(process.env.PLACES||'').split(',').filter(Boolean),hero,fresh,second:process.env.SECOND==='1',sticks:process.env.STICKS?+process.env.STICKS:null});
  const rock0=await p.evaluate(()=>__SO.DAY.rock);let steps=0,lab='';
  const hist=[];while(steps<(+process.env.MAXSTEPS||6000)){lab=await p.evaluate(policy).catch(e=>'err '+e.message);steps++;hist.push(lab+':'+(await p.evaluate(()=>__SO.S.scr)));if(hist.length>12)hist.shift();if(lab==='stop')break;if(/\?$|wait|err/.test(lab))await sleep(60);else await sleep(4);}
  await sleep(2500);
  const res=await p.evaluate(()=>{const e=__SO.S.end||{},r=e.rep||{};return {won:!!e.won,pts:e.pts,places:r.places,part:r.places?r.places.length:0,rock:__SO.DAY.rock,sticks:__SO.DAY.sticks,fights:(window.__PT||{fights:[]}).fights.map(f=>({kind:f.kind,stage:f.stage,en:f.en,won:!!f.won,turns:f.turns,hp0:f.hp0,hp1:f.hp1,max:f.max,deck:f.deck}))};});
  res.hero=hero;res.hist=hist;console.log(hist.join(' '));res.rockGain=res.rock-rock0;res.steps=steps;res.errs=errs.slice(0,3);out.push(res);
  console.log(hero,n,'won',res.won,'pts',res.pts,'places',(res.places||[]).join('>'),'rock+',res.rockGain,'sticks',res.sticks,'steps',steps,errs.length?'ERR '+errs[0]:'');
  await ctx.close();}
fs.writeFileSync(process.argv[2]||'playtest.json',JSON.stringify(out,null,1));await b.close();srv.close();})();
