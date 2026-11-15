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
   '.wgw-qs .share{background:#141414}.wgw-qs .sharerow{margin-top:8px}'+
   '.wgw-qs button:disabled{opacity:.6;cursor:default}.wgw-qs small{display:block;margin-top:6px;color:#555}'+
   '.wgw-qs .msg{margin-top:8px;font-weight:700}.wgw-qs .msg.bad{color:#a3141f}';
  document.head.appendChild(css);
  var TITLES={'red-light-green-light':['Reggie\'s Red Light, Green Light','points','#d1202f','red-light-green-light.html'],'grand-theft-kitty':['Grand Theft Kitty','Dreamies stolen','#5b2bff','grand-theft-kitty.html'],'grand-theft-kitty-daily':['Grand Theft Kitty: Daily Challenge','Dreamies stolen','#5b2bff','grand-theft-kitty.html'],'arthurs-tribunal':['Arthur\'s Tribunal','points','#1d7a3a','arthurs-tribunal.html'],'moulding-museum':['The Moulding Museum Adventure','drips caught','#0f4a4a','moulding-museum.html'],'unemployable-arcade':['The Unemployable Arcade','stars','#b06a00','unemployable-arcade.html'],'ferrets-ditch':['Ferret\'s Ditch','points','#1d6a73','ferrets-ditch.html'],'ferrets-ditch-daily':['Ferret\'s Ditch: Daily Challenge','points','#1d6a73','ferrets-ditch.html']};
  function wrapText(c,text,x,y,maxw,lh){var words=text.split(' '),line='';for(var i=0;i<words.length;i++){var t=line?line+' '+words[i]:words[i];if(c.measureText(t).width>maxw&&line){c.fillText(line,x,y);line=words[i];y+=lh;}else line=t;}c.fillText(line,x,y);return y;}
  function drawCard(game,score,name){
    var T=TITLES[game]||[game,'points','#d1202f',''],cv=document.createElement('canvas');cv.width=1080;cv.height=1080;var c=cv.getContext('2d');
    c.fillStyle='#141414';c.fillRect(0,0,1080,1080);c.fillStyle=T[2];c.fillRect(0,0,1080,24);c.fillRect(0,1056,1080,24);
    c.fillStyle='#f6f2e7';c.textAlign='center';
    c.font='700 44px "Anton","Impact","Arial Black",sans-serif';c.fillText('WILLIAM GEORGE WORKS',540,130);
    c.font='700 54px system-ui,Arial,sans-serif';c.fillStyle='#ffffff';var y=wrapText(c,T[0],540,300,900,66);
    c.fillStyle='#f6f2e7';c.font='400 40px system-ui,Arial,sans-serif';c.fillText(name?name+' scored':'A score of',540,y+80);
    c.fillStyle='#ffffff';c.font='400 250px "Anton","Impact","Arial Black",sans-serif';c.fillText(Number(score).toLocaleString('en-GB'),540,y+330);
    c.fillStyle='#f6f2e7';c.font='700 56px system-ui,Arial,sans-serif';c.fillText(T[1],540,y+410);
    c.fillStyle=T[2]==='#141414'?'#d1202f':'#ffd9d9';c.font='700 46px system-ui,Arial,sans-serif';c.fillText('Can you beat it?',540,960);
    c.fillStyle='#f6f2e7';c.font='400 36px system-ui,Arial,sans-serif';c.fillText('williamgeorgeworks.co.uk',540,1012);
    return cv;
  }
  function shareCard(f,name,msg){
    var game=f.getAttribute('data-game'),score=f.getAttribute('data-score'),T=TITLES[game]||['a game','points','','arcade.html'];
    var url='https://williamgeorgeworks.co.uk/'+(T[3]||'arcade.html');
    var text=(name?name+' scored ':'I scored ')+Number(score).toLocaleString('en-GB')+' '+T[1]+' in '+T[0]+'. Can you beat it?';
    var cv=drawCard(game,score,name);
    cv.toBlob(function(blob){
      if(!blob){msg.className='msg bad';msg.textContent='Could not make the picture. Try again.';return;}
      var file=null;try{file=new File([blob],'my-score.png',{type:'image/png'});}catch(e){}
      if(file&&navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
        navigator.share({files:[file],text:text+' '+url}).catch(function(){});return;
      }
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='my-score.png';document.body.appendChild(a);a.click();a.remove();
      var done=function(){msg.className='msg';msg.textContent='Picture saved. Your text is copied too: paste it with the picture.';};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text+' '+url).then(done,function(){msg.className='msg';msg.textContent='Picture saved. Share it with: '+text;});}
      else{msg.className='msg';msg.textContent='Picture saved. Share it with: '+text;}
    },'image/png');
  }
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
    f.innerHTML='<b></b><div class="row"><input type="text" maxlength="24" autocomplete="nickname" placeholder="Your name or handle" aria-label="Your name or handle"><button type="submit">Put me on the wall</button></div><div class="sharerow"><button type="button" class="share">Share my score</button></div><small>Your name and score are published on the arcade page if they make the board.</small><div class="msg" role="status" aria-live="polite"></div>';
    var input=f.querySelector('input'),btn=f.querySelector('button'),msg=f.querySelector('.msg');
    try{input.value=localStorage.getItem('wgw-name')||'';}catch(e){}
    ['keydown','keyup','keypress'].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation();});});
    f.querySelector('.share').addEventListener('click',function(){shareCard(f,input.value.trim(),msg);});
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
          if(j&&j.ok&&j.status==='added'){msg.textContent=(j.alsoPlace?(j.place?'In at number '+j.place+' on today\'s board and number '+j.alsoPlace+' on the main board. ':'Not a top-ten daily score, but good enough for number '+j.alsoPlace+' on the main board. '):'In at number '+j.place+'. ')+'It will be on the wall in about a minute.';btn.textContent='Done';}
          else if(j&&j.ok&&j.status==='duplicate'){msg.textContent='That one is already on the wall.';btn.textContent='Done';}
          else if(j&&j.ok&&j.status==='not-top'){msg.textContent='Not quite enough for the board yet. Have another go.';btn.textContent='Done';}
          else{msg.className='msg bad';msg.textContent=(j&&j.error)||'The court is busy. Try again in a minute.';btn.disabled=false;btn.textContent='Put me on the wall';}
        })
        .catch(function(){msg.className='msg bad';msg.textContent='Could not reach the court. Try again in a minute.';btn.disabled=false;btn.textContent='Put me on the wall';});
    });
    /* The big "Send in your score" button posts the score itself, so nobody is taken off to the arcade page by mistake. */
    a.addEventListener('click',function(ev){
      if(f.hidden)return;
      ev.preventDefault();
      if(btn.disabled||btn.textContent==='Done')return;
      if(input.value.trim()){if(f.requestSubmit)f.requestSubmit();else btn.click();}
      else{input.focus();msg.className='msg bad';msg.textContent='Type your name or handle, then tap Put me on the wall.';try{f.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){}}
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
