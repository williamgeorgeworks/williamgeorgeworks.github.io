/* Hall of fame: renders each game's leaderboard (the best three, with the rest behind a button) on the arcade page.
   Data lives in scores.json. When SCORES_WORKER is set, submissions are checked and added to it
   automatically by a small Cloudflare Worker (see cloudflare-worker/README.md). While it is empty,
   the form falls back to emailing Formspree and a human adds scores by hand.
   Board length comes from "top" in scores.json (default 3). Game end screens use quickscore.js. */
var SCORES_WORKER='https://arcade-scores.benharding75.workers.dev';
(function(){
  /* Pre-fill the submission form from ?game=slug&score=123, or when a hall link is clicked. */
  var sel=document.getElementById('sc-game'),scoreBox=document.getElementById('sc-score');
  function pick(slug){
    if(!sel)return;
    for(var i=0;i<sel.options.length;i++){if(sel.options[i].getAttribute('data-slug')===slug){sel.selectedIndex=i;return;}}
  }
  try{
    var q=new URLSearchParams(location.search),g=q.get('game'),sc=q.get('score');
    if(g)pick(g);
    if(sc&&scoreBox&&/^[0-9]{1,6}$/.test(sc))scoreBox.value=sc;
  }catch(e){}

  /* Automatic submission */
  var form=sel&&sel.form;
  if(form&&SCORES_WORKER&&window.fetch){
    var msg=document.getElementById('sc-msg'),btn=form.querySelector('button[type=submit]');
    function say(t,ok){if(!msg)return;msg.hidden=false;msg.textContent=t;msg.className='formmsg '+(ok?'good':'bad');}
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      var fd=new FormData(form),slug=sel.options[sel.selectedIndex].getAttribute('data-slug');
      var trap=form.querySelector('[name=_gotcha]');
      var body={game:slug,name:fd.get('name'),score:fd.get('score'),website:trap?trap.value:''};
      if(btn){btn.disabled=true;btn.textContent='Lodging...';}
      /* An emailed copy still goes to Ferret, quietly, so notes and replies are not lost. */
      try{fetch(form.action,{method:'POST',body:fd,headers:{'Accept':'application/json'}}).catch(function(){});}catch(e){}
      fetch(SCORES_WORKER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json().catch(function(){return {ok:false};});})
        .then(function(j){
          if(btn){btn.disabled=false;btn.textContent='Lodge my score';}
          if(j&&j.ok&&j.status==='added'){say('In at number '+j.place+'. It will be on the wall in about a minute. Refresh the page to see it.',true);form.reset();}
          else if(j&&j.ok&&j.status==='duplicate'){say('That one is already on the wall.',true);}
          else if(j&&j.ok&&j.status==='not-top'){say('Thank you. That is not quite good enough to make the board yet, so it has not gone on the wall. Have another go.',true);}
          else if(j&&j.ok){say('Thank you.',true);}
          else{say((j&&j.error)||'The court is busy. Please try again in a minute.',false);}
        })
        .catch(function(){
          if(btn){btn.disabled=false;btn.textContent='Lodge my score';}
          say('Could not reach the court. Please try again in a minute.',false);
        });
    });
  }
  var holes=document.querySelectorAll('[data-hall]');
  if(!holes.length||!window.fetch)return;
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function fmtDate(d){var p=String(d).split('-');if(p.length!==3)return '';var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1]-1];return m?(+p[2])+' '+m+' '+p[0]:'';}
  fetch('scores.json',{cache:'no-cache'}).then(function(r){return r.json();}).then(function(data){
    /* A game listed in scores.json with a cap and a title appears in the form's dropdown automatically. */
    if(sel){Object.keys(data.games||{}).forEach(function(slug){
      var g=data.games[slug],have=false;
      if(!g||typeof g.cap!=='number'||!g.title)return;
      for(var i=0;i<sel.options.length;i++){if(sel.options[i].getAttribute('data-slug')===slug)have=true;}
      if(have)return;
      var o=document.createElement('option');o.value=g.title;o.setAttribute('data-slug',slug);
      o.textContent=g.title+' ('+(g.unit||g.label)+')';sel.appendChild(o);
    });
    var q2=new URLSearchParams(location.search).get('game');if(q2)pick(q2);}
    holes.forEach(function(box){
      var g=(data.games||{})[box.getAttribute('data-hall')];
      if(!g)return;
      var N=(typeof g.top==='number'&&g.top>=1)?Math.min(Math.floor(g.top),25):3;
      var rows=(g.entries||[]).slice().sort(function(a,b){return (b.score-a.score)||String(a.date).localeCompare(String(b.date));}).slice(0,N);
      box.textContent='';
      box.appendChild(el('h4',null,'Top players'));
      if(!rows.length){
        box.appendChild(el('p','none','Nobody yet. The leaderboard is wide open.'));
      }else{
        var ol=el('ol');
        rows.forEach(function(r,i){
          var li=el('li');
          li.appendChild(el('span','rank',(i+1)+'.'));
          li.appendChild(el('span','who',r.name));
          li.appendChild(el('span','pts',r.score+(g.max?' of '+g.max:'')+' '+g.label));
          var d=fmtDate(r.date); if(d)li.appendChild(el('span','when',d));
          if(i>=3)li.style.display='none';
          ol.appendChild(li);
        });
        box.appendChild(ol);
        if(rows.length>3){
          var more=el('button','showmore','Show the whole top '+N);more.type='button';
          var open=false;
          more.addEventListener('click',function(){open=!open;Array.prototype.forEach.call(ol.children,function(li,i){if(i>=3)li.style.display=open?'':'none';});more.textContent=open?'Show the top three only':'Show the whole top '+N;});
          box.appendChild(more);
        }
      }
      var p=el('p','beat');
      p.appendChild(document.createTextNode(rows.length?'Think you can beat that? ':'Be the first. '));
      var a=el('a',null,'Send in your score');a.href='#send-score';var slug=box.getAttribute('data-hall');a.addEventListener('click',function(){pick(slug);});p.appendChild(a);
      box.appendChild(p);
    });
  }).catch(function(){});
})();
