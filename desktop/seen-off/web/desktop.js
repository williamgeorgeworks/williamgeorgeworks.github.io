/* Seen Off desktop layer: menu, fullscreen, keyboard + gamepad focus navigation,
 * achievement hook wiring. It drives the game only through what a player could do
 * (clicking its own [data-a] buttons) plus window.__SO.act('enemy', i) for canvas targets.
 */
(function(){
'use strict';
var SO=window.__SO;if(!SO){console.error('Seen Off: game hook missing');return;}
var S=SO.S,$=function(id){return document.getElementById(id);};
var TAURI=window.__TAURI__||null;
function tWin(){try{return TAURI&&TAURI.window&&TAURI.window.getCurrentWindow();}catch(e){return null;}}

/* ================= fullscreen ================= */
function isFull(){var w=tWin();if(w)return w.isFullscreen();return Promise.resolve(!!document.fullscreenElement);}
function setFull(on){var w=tWin();if(w)return w.setFullscreen(on).then(menuLabels);
  try{if(on&&!document.fullscreenElement)return document.documentElement.requestFullscreen().then(menuLabels,menuLabels);
      if(!on&&document.fullscreenElement)return document.exitFullscreen().then(menuLabels,menuLabels);}catch(e){}return Promise.resolve();}
function toggleFull(){return isFull().then(function(f){return setFull(!f);});}
document.addEventListener('fullscreenchange',menuLabels);window.addEventListener('resize',function(){menuLabels();});

/* ================= menu ================= */
var menu=document.createElement('div');menu.id='soMenu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','Menu');
menu.innerHTML='<div class="so-dlg"><div class="so-in" id="soIn"></div></div>';
document.body.appendChild(menu);
var PAGE='main';
var CREDITS='<p class="so-small">Fonts are bundled with the game, not fetched. <b>Anton</b>: Copyright 2020 The Anton Project Authors, SIL Open Font License 1.1. <b>Permanent Marker</b>: by Font Diner, Apache License 2.0. Full licence texts are in the <code>fonts</code> folder that ships with the game.</p>';
function pageHTML(){
  if(PAGE==='howto')return '<h2>How to play</h2><div class="so-page" id="soHowto"></div><div class="so-col"><button type="button" class="btn quiet" data-m="main">Back</button></div>';
  if(PAGE==='credits')return '<h2>Credits</h2><div class="so-page" id="soCredits"></div>'+CREDITS+'<div class="so-col"><button type="button" class="btn quiet" data-m="main">Back</button></div>';
  if(PAGE==='ach'){var L=window.SeenOffAchievements?SeenOffAchievements.list():{},U=window.SeenOffAchievements?SeenOffAchievements.unlocked():{},h='<h2>Achievements</h2><div class="so-page"><ul>';
    Object.keys(L).forEach(function(k){h+='<li>'+(U[k]?'&#9733; ':'&#9734; ')+L[k]+'</li>';});
    return h+'</ul><p class="so-small">These are kept on this computer for now. Steam achievements come later.</p></div><div class="so-col"><button type="button" class="btn quiet" data-m="main">Back</button></div>';}
  return '<h2>Seen Off</h2><div class="so-col">'+
    '<button type="button" class="btn go" data-m="resume">Carry on</button>'+
    '<button type="button" class="btn quiet" data-m="full" id="soFull">Full screen</button>'+
    '<button type="button" class="btn quiet" data-m="sound" id="soSound">Sound</button>'+
    '<button type="button" class="btn quiet" data-m="howto">How to play</button>'+
    '<button type="button" class="btn quiet" data-m="ach">Achievements</button>'+
    '<button type="button" class="btn quiet" data-m="credits">Credits</button>'+
    (TAURI?'<button type="button" class="btn" data-m="quit">Quit to desktop</button>':'')+
    '</div><p class="so-small">F11 or the menu switches full screen. Your record and any run in progress are saved on this computer.</p>';
}
var side=$('dkSide'),foot=$('dkFoot');
function showPage(p){
  /* hand the borrowed panels back before the page is rebuilt */
  var home=document.querySelector('.cols');if(side&&side.parentNode!==home)home.appendChild(side);
  var wrap=document.querySelector('.wrap');if(foot&&foot.parentNode!==wrap)wrap.appendChild(foot);
  PAGE=p;$('soIn').innerHTML=pageHTML();
  if(p==='howto'&&side)$('soHowto').appendChild(side);
  if(p==='credits'&&foot)$('soCredits').appendChild(foot);
  $('soIn').scrollTop=0;menuLabels();setFocus(null);
}
function menuLabels(){
  var s=$('soSound');if(s)s.textContent='Sound: '+(SO.A.muted?'off':'on');
  var f=$('soFull');if(f)isFull().then(function(v){f.textContent='Full screen: '+(v?'on':'off');});
}
function openMenu(){if(!menu.hidden)return;menu.hidden=false;showPage('main');}
function closeMenu(){if(menu.hidden)return;showPage('main');menu.hidden=true;setFocus(null);}
function menuOpen(){return !menu.hidden;}
menu.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-m]');if(!b){if(ev.target===menu)closeMenu();return;}
  var m=b.getAttribute('data-m');
  if(m==='resume')closeMenu();
  else if(m==='full')toggleFull();
  else if(m==='sound'){SO.act('mute');menuLabels();}
  else if(m==='quit'){var w=tWin();if(w)w.close();}
  else showPage(m);
});
var menuBtn=document.createElement('button');menuBtn.type='button';menuBtn.className='chip dk-menu-btn';menuBtn.id='dkMenuBtn';menuBtn.setAttribute('aria-haspopup','dialog');
menuBtn.innerHTML='Menu <kbd class="dk-key" data-k="menu">Esc</kbd>';
menuBtn.addEventListener('click',function(){menuOpen()?closeMenu():openMenu();});

/* ================= focus navigation ================= */
var ring=document.createElement('div');ring.id='soRing';ring.innerHTML='<b></b>';document.body.appendChild(ring);
var FOC=null;            /* {el} or {enemy:i} */
var SIG='';              /* which screen the focus belongs to */
var NAV=false;           /* last input was keyboard/pad (ring shown) */
var PAD=false;           /* last input was a pad (hint glyphs) */
function vis(el){if(!el||el.disabled||el.hidden)return false;var r=el.getBoundingClientRect();if(!r.width||!r.height)return false;var cs=getComputedStyle(el);return cs.visibility!=='hidden'&&cs.display!=='none';}
function overlay(){return document.querySelector('#view .beat,#view .arrive');}
function targeting(){ /* only when the thing in hand actually wants an enemy picked */
  var B=SO.B();if(S.scr!=='combat'||!B||B.over)return false;if(S.brewSel>=0)return true;if(S.sel<0)return false;
  var c=B.hand[S.sel],d=c&&SO.CARDS[c.id];return !!(d&&d.o&&d.o.t&&SO.playable(c)&&SO.alive().length>1);}
function enemyRect(i){var bx=SO.BOX(),b=null,k;for(k=0;k<bx.length;k++)if(bx[k].i===i)b=bx[k];if(!b)return null;
  var a=SO.cvPos(b.x,b.y),c=SO.cvPos(b.x+b.w,b.y+b.h);if(!a||!c)return null;var st=$('stage').getBoundingClientRect();
  return {left:st.left+a[0],top:st.top+a[1],right:st.left+c[0],bottom:st.top+c[1],width:c[0]-a[0],height:c[1]-a[1]};}
function items(){
  if(menuOpen())return Array.prototype.filter.call(menu.querySelectorAll('button'),vis).map(function(el){return {el:el};});
  var ov=overlay();if(ov)return [{el:ov}];
  var out=Array.prototype.filter.call(document.querySelectorAll('#stage [data-a]'),function(el){return el.getAttribute('data-a')!=='skip'&&vis(el);}).map(function(el){return {el:el};});
  if(targeting()){var B=SO.B();SO.BOX().forEach(function(b){var e=B.en[b.i];if(e&&!e.dead)out.push({enemy:b.i});});}
  out.push({el:$('dkMenuBtn')});
  return out;
}
function rectOf(it){if(!it)return null;if(it.enemy!=null)return enemyRect(it.enemy);if(!it.el||!it.el.isConnected)return null;return it.el.getBoundingClientRect();}
function same(a,b){if(!a||!b)return false;if(a.enemy!=null||b.enemy!=null)return a.enemy===b.enemy;return a.el===b.el;}
function keyOf(it){if(!it)return '';if(it.enemy!=null)return 'enemy|'+it.enemy;var el=it.el;return (el.getAttribute('data-a')||el.getAttribute('data-m')||el.id)+'|'+(el.getAttribute('data-i')||'');}
function sig(){return (menuOpen()?'menu:'+PAGE:'')+'|'+S.scr+'|'+(S.mode||'')+'|'+(overlay()?'ov':'')+'|'+(targeting()?'tgt':'');}
function q(sel){var el=document.querySelector(sel);return el&&vis(el)?{el:el}:null;}
function defaultItem(list){
  if(menuOpen())return list[0]||null;
  var ov=overlay();if(ov)return {el:ov};
  if(targeting()){var en=list.filter(function(x){return x.enemy!=null;});if(en.length)return en[0];}
  var m=S.mode,c=null;
  if(m==='cut'||m==='edit')c=q('#view .cd:not(.no)[data-a="dk"]')||q('#view [data-a="back"]');
  else if(m==='album')c=q('#view .chip.on')||q('#view [data-a="back"]');
  else if(m)c=q('#view [data-a="back"]');
  else if(S.scr==='title')c=q('#view .pick.on')||q('#view [data-a="begin"]');
  else if(S.scr==='cat')c=q('#view [data-a="cat"]');
  else if(S.scr==='map')c=q('#view .node.go');
  else if(S.scr==='combat')c=q('#hand .cd.sel')||q('#hand .cd:not(.no)')||q('#view [data-a="end"]');
  else if(S.scr==='stage')c=q('#view [data-a="place"]:not([disabled])');
  else if(S.scr==='report')c=q('#view [data-a="home"]');
  else if(S.scr==='souvenir')c=q('#view [data-a="souv"]:not([disabled])')||q('#view [data-a="gohome"]');
  else if(S.scr==='reward')c=q('#view [data-a="boss"]')||q('#view [data-a="take"]')||q('#view [data-a="leave"]');
  else c=q('#view .btn.go')||q('#view [data-a="opt"]')||q('#view .cd:not(.no)')||q('#view [data-a]');
  return c||list[0]||null;
}
/* after a re-render the old element is gone: find its twin (same action, nearest index) */
function relink(old,list){
  if(!old||!old.key)return null;var p=old.key.split('|'),a=p[0],i=p[1],best=null,bd=1e9;
  list.forEach(function(it){var k=keyOf(it).split('|');if(k[0]!==a)return;if(k[1]===i){best=it;bd=-1;return;}
    var d=Math.abs((+k[1])-(+i));if(!isNaN(d)&&d<bd){bd=d;best=it;}});
  return best;
}
function setFocus(it){FOC=it?{el:it.el,enemy:it.enemy,key:keyOf(it)}:null;SIG=sig();
  if(FOC&&FOC.el){try{FOC.el.focus({preventScroll:true});}catch(e){}scrollInto(FOC.el);}}
function scrollInto(el){try{el.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}}
function ensure(){
  var list=items(),s=sig();
  if(FOC&&s===SIG&&list.some(function(x){return same(x,FOC);}))return list;
  var tw=s===SIG?relink(FOC,list):null;
  setFocus(tw||defaultItem(list));return list;
}
function move(dx,dy){
  if(SO.trav&&SO.trav())return;
  var list=ensure();if(!FOC)return;var r=rectOf(FOC);if(!r)return;
  var cx=r.left+r.width/2,cy=r.top+r.height/2,best=null,bs=1e9;
  list.forEach(function(it){if(same(it,FOC))return;var q=rectOf(it);if(!q)return;
    var px=q.left+q.width/2,py=q.top+q.height/2,main=dx?(px-cx)*dx:(py-cy)*dy;if(main<=4)return;
    var ov=dx?Math.max(0,Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top)):Math.max(0,Math.min(r.right,q.right)-Math.max(r.left,q.left));
    var off=dx?Math.abs(py-cy):Math.abs(px-cx),sc=main+(ov>0?0:off*2.5);
    if(sc<bs){bs=sc;best=it;}});
  if(best){setFocus(best);blip();}
  else if(dy)scrollBy(dy*140);   /* nothing further that way: scroll long pages (menu, deck, shop) */
}
function scroller(){
  if(menuOpen())return $('soIn');
  var v=$('view');return v&&v.scrollHeight>v.clientHeight+2?v:null;
}
function scrollBy(d){var sc=scroller();if(sc)sc.scrollTop+=d;}
function cycle(n){var list=ensure();if(!list.length)return;var i=0;list.forEach(function(it,k){if(same(it,FOC))i=k;});setFocus(list[(i+n+list.length)%list.length]);blip();}
function handStep(n){ /* LB/RB: previous/next card in the hand */
  if(S.scr!=='combat'||menuOpen())return cycle(n);
  var cards=Array.prototype.filter.call(document.querySelectorAll('#hand .cd'),vis);if(!cards.length)return;
  var i=cards.indexOf(FOC&&FOC.el);i=i<0?0:(i+n+cards.length)%cards.length;setFocus({el:cards[i]});blip();
}
function blip(){} /* hook for a nav sound later */
function confirm(){
  if(SO.trav&&SO.trav())return;
  ensure();if(!FOC)return;
  if(FOC.enemy!=null){SO.act('enemy',FOC.enemy);afterAct();return;}
  var el=FOC.el,wasSel=S.sel;el.click();
  /* picked up a card that needs a target: hop to the first enemy */
  if(S.scr==='combat'&&S.sel>=0&&S.sel!==wasSel){var B=SO.B(),c=B&&B.hand[S.sel],d=c&&SO.CARDS[c.id];
    if(d&&d.o&&d.o.t&&SO.alive().length>1&&SO.playable(c)){var list=items(),en=list.filter(function(x){return x.enemy!=null;});if(en.length){setFocus(en[0]);return;}}}
  afterAct();
}
function afterAct(){SIG='';ensure();}
function back(){
  if(menuOpen()){if(PAGE!=='main')showPage('main');else closeMenu();return;}
  var ov=overlay();if(ov){ov.click();afterAct();return;}
  if(S.scr==='combat'&&(S.sel>=0||S.brewSel>=0)){var k=S.sel;S.sel=-1;S.brewSel=-1;SO.render();var c=k>=0&&q('#hand .cd[data-i="'+k+'"]');SIG='';if(c)setFocus(c);else ensure();return;}
  var b=q('#view [data-a="back"]');if(b){b.el.click();afterAct();return;}
  openMenu();
}
function endTurn(){if(menuOpen()||S.scr!=='combat')return;var b=q('#view [data-a="end"]');if(b){b.el.click();afterAct();}}
function deck(){if(menuOpen())return;if(S.mode==='deck'||S.mode==='relics'){back();return;}var b=q('#hud [data-a="deck"]');if(b){b.el.click();afterAct();}}

/* ring follows the focused thing every frame (cards bob, the canvas moves) */
var lastSel=-1;
function paintRing(){
  if(!NAV||!FOC){ring.classList.remove('on');return;}
  if(!menuOpen()&&FOC.el&&!FOC.el.isConnected)ensure();
  var r=rectOf(FOC);if(!r){ring.classList.remove('on');return;}
  var pad=FOC.enemy!=null?2:5;
  ring.style.left=(r.left-pad)+'px';ring.style.top=(r.top-pad)+'px';ring.style.width=(r.width+pad*2)+'px';ring.style.height=(r.height+pad*2)+'px';
  ring.classList.toggle('tgt',FOC.enemy!=null);
  var lab=FOC.enemy!=null?'Target':(FOC.el&&FOC.el.classList.contains('sel')?'Again to play':'');
  if(ring.firstChild.textContent!==lab)ring.firstChild.textContent=lab;
  ring.classList.add('on');
}
function setNav(on,pad){NAV=on;if(pad!=null&&PAD!==pad){PAD=pad;hints();}document.body.classList.toggle('so-nav',on);document.body.classList.toggle('so-mouse',!on);if(on)ensure();}
document.addEventListener('mousemove',function(e){if(NAV&&(Math.abs(e.movementX)+Math.abs(e.movementY))>2)setNav(false);},{passive:true});
document.addEventListener('mousedown',function(){if(NAV)setNav(false);},true);

/* ================= keyboard ================= */
var KEYS={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1],A:[-1,0],D:[1,0],W:[0,-1],S:[0,1]};
window.addEventListener('keydown',function(e){
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  var k=e.key,h=true;
  if(k==='F11'){toggleFull();}
  else if(KEYS[k]){setNav(true,false);move(KEYS[k][0],KEYS[k][1]);}
  else if(k==='Enter'||k===' '){if(e.repeat){e.preventDefault();e.stopImmediatePropagation();return;}setNav(true,false);confirm();}
  else if(k==='Escape'||k==='Backspace'){setNav(true,false);back();}
  else if(k==='Tab'){setNav(true,false);cycle(e.shiftKey?-1:1);}
  else if(menuOpen()){h=true;}            /* swallow game keys (E, numbers) under the menu */
  else if(k==='q'||k==='Q'){setNav(true,false);handStep(-1);}
  else if(k==='r'||k==='R'){setNav(true,false);handStep(1);}
  else if(k==='Tab'){}
  else h=false;                            /* E and the number keys go on to the game */
  if(h){e.preventDefault();e.stopImmediatePropagation();}
  else if(/^[0-9eE]$/.test(k)){setNav(true,false);}
},true);

/* ================= gamepad (standard mapping) ================= */
var PREVB=[],HOLD={},AX={x:0,y:0};
var FIRST=360,REPEAT=120,DEAD=.5;
function pressed(b){return b&&(b.pressed||b.value>.5);}
function rep(id,on,t,fn){if(!on){delete HOLD[id];return;}var h=HOLD[id];if(!h){HOLD[id]=t+FIRST;fn();}else if(t>=h){HOLD[id]=t+REPEAT;fn();}}
function poll(t){
  var pads=navigator.getGamepads?navigator.getGamepads():[],gp=null,i;
  for(i=0;i<pads.length;i++)if(pads[i]&&pads[i].connected){gp=pads[i];break;}
  if(!gp||!document.hasFocus())return;
  var b=gp.buttons,ax=gp.axes||[],now=[],any=false;
  for(i=0;i<b.length;i++){now[i]=pressed(b[i]);if(now[i])any=true;}
  var lx=ax[0]||0,ly=ax[1]||0;if(Math.abs(lx)>DEAD||Math.abs(ly)>DEAD)any=true;
  if(any&&!(NAV&&PAD))setNav(true,true);
  function edge(n){return now[n]&&!PREVB[n];}
  /* d-pad and left stick, with key-style repeat */
  rep('L',now[14]||lx<-DEAD,t,function(){move(-1,0);});
  rep('R',now[15]||lx>DEAD,t,function(){move(1,0);});
  rep('U',now[12]||ly<-DEAD,t,function(){move(0,-1);});
  rep('D',now[13]||ly>DEAD,t,function(){move(0,1);});
  rep('LB',now[4],t,function(){handStep(-1);});
  rep('RB',now[5],t,function(){handStep(1);});
  var ry=ax[3]||0;if(Math.abs(ry)>.25)scrollBy(ry*22);   /* right stick scrolls long pages */
  if(edge(0))confirm();          /* A */
  if(edge(1))back();             /* B */
  if(edge(2))endTurn();          /* X */
  if(edge(3))deck();             /* Y */
  if(edge(9))menuOpen()?closeMenu():openMenu();   /* Start / Menu */
  if(edge(8))toggleFull();       /* Back / View */
  PREVB=now;
}
window.addEventListener('gamepadconnected',function(){setNav(true,true);});

/* ================= hints ================= */
var hintBar=document.createElement('div');hintBar.className='so-hints';hintBar.id='soHints';document.querySelector('.wrap').appendChild(hintBar);
function hints(){
  hintBar.innerHTML=PAD?
    '<span><i>&#10010;</i>Move</span><span><i>R&#8202;S</i>Scroll</span><span><i class="a">A</i>Choose</span><span><i class="b">B</i>Back</span><span><i class="x">X</i>End turn</span><span><i class="y">Y</i>Deck</span><span><i>LB</i><i>RB</i>Cards</span>':
    '<span><i>&larr;&uarr;&darr;&rarr;</i>Move</span><span><i>Enter</i>Choose</span><span><i>Esc</i>Back</span><span><i>E</i>End turn</span><span><i>1</i>-<i>9</i>Pick a card</span><span><i>Q</i><i>R</i>Cards</span><span><i>F11</i>Full screen</span>';
  hintBar.appendChild(menuBtn);
  var k=menuBtn.querySelector('.dk-key');if(k)k.innerHTML=PAD?'&#9776;':'Esc';
}
hints();

/* ================= achievements (hook only; Steam comes later) ================= */
var AW={scr:'',cats:0};
function watchAch(){
  var U=window.SeenOffAchievements;if(!U)return;var run=SO.run(),B=SO.B();
  if(S.scr!==AW.scr){
    if(S.scr==='reward'&&B&&B.won){U.unlock('FIRST_BLOOD');if(S.rw&&S.rw.kind==='B'&&run)U.unlock({south:'PIER_SOUTH',central:'PIER_CENTRAL',north:'PIER_NORTH'}[run.stage]);
      if(B.cmax>=5)U.unlock('PROPER_JOB');if(B.cmax>=10)U.unlock('SCENES');}
    if(S.scr==='report'&&S.end&&S.end.won){U.unlock('RUN_WON');if(S.end.lvl>=1)U.unlock('ENCORE_1');if(S.end.lvl>=5)U.unlock('ENCORE_5');}
    var D=SO.DAY;if(D){if(Object.keys(D.album).length)U.unlock('FIRST_POSTCARD');if(D.sticks>=1)U.unlock('FIRST_STICK');}
    AW.scr=S.scr;}
  if(run&&run.cats&&run.cats.length>AW.cats){U.unlock('FIRST_FAMILIAR');}AW.cats=run&&run.cats?run.cats.length:0;
}
window.addEventListener('seenoff:stick',function(e){var D=SO.DAY;if(!D)return;e.detail.sticks.forEach(function(k,j){setTimeout(function(){var d=document.createElement('div');d.className='so-toast stick';d.innerHTML='Stick of rock pulled<small></small>';d.lastChild.textContent=SO.STICKS[k][3];document.body.appendChild(d);setTimeout(function(){d.remove();},3200);},j*900);});});
window.addEventListener('seenoff:achievement',function(e){var d=document.createElement('div');d.className='so-toast';d.innerHTML='Achievement<small></small>';d.lastChild.textContent=e.detail.name;document.body.appendChild(d);setTimeout(function(){d.remove();},3800);});

/* ================= fit the fight to the window ================= */
/* the scene canvas keeps the game's 680x360 shape; it gets whatever height is left
   once the HUD, the energy bar, the detail line and a full hand of cards are in */
var cvEl=$('scene'),lastFit='';
function fitCanvas(){
  if(cvEl.hidden)return;var st=$('stage'),hud=$('hud'),v=$('view');if(!st||!v)return;
  var need=hud.offsetHeight,bar=v.querySelector('.bar'),det=v.querySelector('.detail'),hand=v.querySelector('.hand'),k;
  var side=bar&&hand&&getComputedStyle(v).display==='grid';   /* bar beside the hand */
  if(det)need+=det.offsetHeight;
  var hh=0;if(hand){var ch=0;Array.prototype.forEach.call(hand.children,function(c){ch=Math.max(ch,c.offsetHeight);});var cs=getComputedStyle(hand);hh=(ch||180)+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+4;}
  if(bar){var bh=0;Array.prototype.forEach.call(bar.children,function(c){bh+=c.offsetHeight+10;});bh+=10;
    if(side)hh=Math.max(hh,bh);else need+=bar.offsetHeight;}
  need+=hand?hh:(v.querySelector('.beat')?0:220);
  var H=st.clientHeight-need,Wd=st.clientWidth,w=Math.max(320,Math.min(Wd,Math.floor(H*680/360)));
  k=w+'';if(k!==lastFit){lastFit=k;cvEl.style.width=w+'px';}
}
window.addEventListener('resize',function(){lastFit='';});

/* ================= loop ================= */
function frame(t){
  try{poll(t||0);}catch(e){}
  try{watchAch();}catch(e){}
  try{fitCanvas();}catch(e){}
  if(NAV){if(sig()!==SIG)ensure();
    if(S.scr==='combat'&&S.sel!==lastSel&&S.sel>=0&&!(FOC&&FOC.enemy!=null)){var c=q('#hand .cd[data-i="'+S.sel+'"]');if(c&&!(FOC&&FOC.el===c.el))setFocus(c);}}
  lastSel=S.sel;
  paintRing();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__SODesktop={openMenu:openMenu,closeMenu:closeMenu,toggleFull:toggleFull,focus:function(){return FOC&&{key:FOC.key};}};
})();
