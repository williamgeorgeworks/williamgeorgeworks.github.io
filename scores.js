/* Hall of fame: renders the top three published scores under each game on the arcade page.
   Data lives in scores.json and is edited by hand after a human has checked each submission. */
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
  var holes=document.querySelectorAll('[data-hall]');
  if(!holes.length||!window.fetch)return;
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function fmtDate(d){var p=String(d).split('-');if(p.length!==3)return '';var m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1]-1];return m?(+p[2])+' '+m+' '+p[0]:'';}
  fetch('scores.json',{cache:'no-cache'}).then(function(r){return r.json();}).then(function(data){
    holes.forEach(function(box){
      var g=(data.games||{})[box.getAttribute('data-hall')];
      if(!g)return;
      var rows=(g.entries||[]).slice().sort(function(a,b){return (b.score-a.score)||String(a.date).localeCompare(String(b.date));}).slice(0,3);
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
          ol.appendChild(li);
        });
        box.appendChild(ol);
      }
      var p=el('p','beat');
      p.appendChild(document.createTextNode(rows.length?'Think you can beat that? ':'Be the first. '));
      var a=el('a',null,'Send in your score');a.href='#send-score';var slug=box.getAttribute('data-hall');a.addEventListener('click',function(){pick(slug);});p.appendChild(a);
      box.appendChild(p);
    });
  }).catch(function(){});
})();
