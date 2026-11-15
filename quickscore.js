/* One-tap scores: finds each "Send in your score" link in a game (they point at
   arcade.html?game=SLUG&score=N) and puts a small name box and button under it, so a player
   can lodge a score without leaving the game. The arcade form remains as the fallback. */
(function(){
  var WORKER='https://arcade-scores.benharding75.workers.dev';
  if(!window.fetch||!window.MutationObserver)return;
  var css=document.createElement('style');
  css.textContent='.wgw-qs{display:block;box-sizing:border-box;max-width:380px;margin:12px auto;padding:10px 12px;background:#fff;color:#141414;border:3px solid #141414;font:16px/1.35 system-ui,sans-serif;text-align:left}'+
   '.wgw-qs[hidden]{display:none}.wgw-qs b{display:block;margin-bottom:6px}.wgw-qs .row{display:flex;gap:8px;flex-wrap:wrap}'+
   '.wgw-qs input{flex:1 1 140px;min-width:0;padding:8px;font:inherit;color:#141414;background:#fff;border:2px solid #141414}'+
   '.wgw-qs button{padding:8px 14px;font:inherit;font-weight:700;color:#fff;background:#d1202f;border:2px solid #141414;cursor:pointer}'+
   '.wgw-qs button:disabled{opacity:.6;cursor:default}.wgw-qs small{display:block;margin-top:6px;color:#555}'+
   '.wgw-qs .msg{margin-top:8px;font-weight:700}.wgw-qs .msg.bad{color:#a3141f}';
  document.head.appendChild(css);
  function parse(a){
    try{var u=new URL(a.getAttribute('href'),location.href);var g=u.searchParams.get('game'),s=u.searchParams.get('score');
      if(g&&/^[a-z0-9-]+$/.test(g)&&s&&/^[0-9]{1,6}$/.test(s))return {game:g,score:s};}catch(e){}
    return null;
  }
  function visible(el){return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);}
  function sync(a){
    var f=a._qs,info=parse(a);
    if(!f)return;
    var show=!!info&&visible(a);
    if(!show){if(!f.hidden)f.hidden=true;return;}
    if(f.getAttribute('data-score')!==info.score||f.getAttribute('data-game')!==info.game){
      f.setAttribute('data-score',info.score);f.setAttribute('data-game',info.game);
      f.querySelector('.msg').textContent='';f.querySelector('button').disabled=false;f.querySelector('button').textContent='Put me on the wall';
    }
    var label='Score of '+info.score+'. Put your name on the wall:',bb=f.querySelector('b');
    if(bb.textContent!==label)bb.textContent=label;
    if(f.hidden)f.hidden=false;
  }
  function build(a){
    var f=document.createElement('form');f.className='wgw-qs';f.hidden=true;
    f.innerHTML='<b></b><div class="row"><input type="text" maxlength="24" autocomplete="nickname" placeholder="Your name or handle" aria-label="Your name or handle"><button type="submit">Put me on the wall</button></div><small>Your name and score are published on the arcade page if they make the board.</small><div class="msg" role="status" aria-live="polite"></div>';
    var input=f.querySelector('input'),btn=f.querySelector('button'),msg=f.querySelector('.msg');
    try{input.value=localStorage.getItem('wgw-name')||'';}catch(e){}
    ['keydown','keyup','keypress'].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation();});});
    f.addEventListener('submit',function(ev){
      ev.preventDefault();ev.stopPropagation();
      var info={game:f.getAttribute('data-game'),score:f.getAttribute('data-score')};
      var name=input.value.trim();
      if(!name){msg.className='msg bad';msg.textContent='Please give a name or handle.';return;}
      try{localStorage.setItem('wgw-name',name);}catch(e){}
      btn.disabled=true;btn.textContent='Lodging...';msg.className='msg';msg.textContent='';
      fetch(WORKER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game:info.game,name:name,score:info.score,website:''})})
        .then(function(r){return r.json().catch(function(){return {ok:false};});})
        .then(function(j){
          if(j&&j.ok&&j.status==='added'){msg.textContent='In at number '+j.place+'. It will be on the wall in about a minute.';btn.textContent='Done';}
          else if(j&&j.ok&&j.status==='duplicate'){msg.textContent='That one is already on the wall.';btn.textContent='Done';}
          else if(j&&j.ok&&j.status==='not-top'){msg.textContent='Not quite enough for the board yet. Have another go.';btn.textContent='Done';}
          else{msg.className='msg bad';msg.textContent=(j&&j.error)||'The court is busy. Try again in a minute.';btn.disabled=false;btn.textContent='Put me on the wall';}
        })
        .catch(function(){msg.className='msg bad';msg.textContent='Could not reach the court. Try again in a minute.';btn.disabled=false;btn.textContent='Put me on the wall';});
    });
    a.parentNode.insertBefore(f,a.nextSibling);a._qs=f;
  }
  function scan(){
    var links=document.querySelectorAll('a[href*="arcade.html"]');
    Array.prototype.forEach.call(links,function(a){
      if(!/send in your score/i.test(a.textContent))return;
      if(!a._qs)build(a);
      sync(a);
    });
  }
  var t=null;function later(){clearTimeout(t);t=setTimeout(scan,30);}
  new MutationObserver(later).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','href','hidden','class']});
  scan();
})();
