/* Share buttons for the books and the games. Plain links only: no trackers, no third-party scripts.
   Books: every <article class="card book"> gets a row, pointing at its Amazon page if it has one, otherwise at its place on the books page.
   Game cards on the arcade and home pages get a row too, and so do the T-shirts.
   Games: a page that loads this script with data-title and data-text gets a "Share this game" strip above the footer. */
(function(){
  var me=document.currentScript,SITE='https://williamgeorgeworks.co.uk/';
  if(!document.getElementById('wgs-css')){
    var st=document.createElement('style');st.id='wgs-css';
    st.textContent='.wgs{display:block;margin:12px 0 0;padding:0}'+
      '.wgs summary{list-style:none;display:inline-block;cursor:pointer;font:700 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.3px;padding:6px 10px;border:2px solid #141414;background:#fffdf7;color:#141414;user-select:none}'+
      '.wgs summary::-webkit-details-marker{display:none}.wgs summary:hover,.wgs[open] summary{background:#141414;color:#fffdf7}.wgs summary:focus-visible{outline:3px solid #2b4fc2;outline-offset:2px}'+
      '.wgs .wgs-o{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 0}'+
      '.wgs a,.wgs button{font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.2px;padding:8px 10px;border:2px solid #141414;border-radius:0;'+
      'background:#fffdf7!important;color:#141414!important;text-decoration:none!important;cursor:pointer;box-shadow:3px 3px 0 #141414;margin:0;text-transform:none;display:inline-block}'+
      '.wgs a:hover,.wgs button:hover{background:#141414!important;color:#fffdf7!important}.wgs a:focus-visible,.wgs button:focus-visible{outline:3px solid #2b4fc2;outline-offset:2px}'+
      '.wgs-strip{background:#f6f2e7;color:#141414;border-top:4px solid #141414;padding:18px 16px 20px;position:relative;z-index:5;width:100%;box-sizing:border-box;clear:both;text-align:left}'+
      '.wgs-strip>div{max-width:1020px;margin:0 auto}.wgs-strip .wgs{margin:0}';
    document.head.appendChild(st);
  }
  function enc(s){return encodeURIComponent(s);}
  function row(o){
    /* o: {title, text, url, label} */
    /* One quiet "Share" button; the choices open when it is pressed. */
    var wrap=document.createElement('details');wrap.className='wgs';
    var l=document.createElement('summary');l.className='wgs-l';l.textContent=o.label||'Share';wrap.appendChild(l);
    var box=document.createElement('div');box.className='wgs-o';wrap.appendChild(box);
    var msg=o.text+' '+o.url;
    function link(name,href){var a=document.createElement('a');a.textContent=name;a.href=href;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label','Share '+o.title+' on '+name);box.appendChild(a);return a;}
    function button(name,fn){var b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',function(){fn(b);});box.appendChild(b);return b;}
    if(navigator.share){button('Share…',function(){navigator.share({title:o.title,text:o.text,url:o.url}).catch(function(){});}).setAttribute('aria-label','Share '+o.title);}
    link('WhatsApp','https://wa.me/?text='+enc(msg));
    link('Facebook','https://www.facebook.com/sharer/sharer.php?u='+enc(o.url));
    link('X','https://x.com/intent/post?text='+enc(o.text)+'&url='+enc(o.url));
    var em=link('Email','mailto:?subject='+enc(o.title)+'&body='+enc(msg));em.removeAttribute('target');em.setAttribute('aria-label','Share '+o.title+' by email');
    button('Copy link',function(b){
      function done(ok){b.textContent=ok?'Copied':'Copy failed';setTimeout(function(){b.textContent='Copy link';},1800);}
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(o.url).then(function(){done(true);},function(){done(false);});
      else{try{var t=document.createElement('textarea');t.value=o.url;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();var ok=document.execCommand('copy');t.remove();done(ok);}catch(e){done(false);}}
    }).setAttribute('aria-label','Copy the link to '+o.title);
    return wrap;
  }
  function slug(s){return s.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function books(){
    var cards=document.querySelectorAll('article.card.book');
    for(var i=0;i<cards.length;i++){
      var c=cards[i],h=c.querySelector('h3');if(!h||c.querySelector('.wgs'))continue;
      var title=h.textContent.trim(),buy=c.querySelector('a[href*="amazon."]');
      if(!c.id)c.id=slug(title);
      var url=buy?buy.href:SITE+'books.html#'+c.id;
      var r=row({title:title,text:'“'+title+'”, from William George Works.',url:url,label:'Share this book'});
      (h.parentNode||c).appendChild(r);
    }
  }
  function game(){
    var d=me&&me.dataset;if(!d||!d.title)return;
    var url=SITE+location.pathname.replace(/^.*\//,'');
    var strip=document.createElement('div'),inner=document.createElement('div');strip.className='wgs-strip';
    inner.appendChild(row({title:d.title,text:d.text||d.title,url:url,label:'Share this game'}));strip.appendChild(inner);
    var foot=document.querySelector('.wgw-strip');
    if(foot&&foot.parentNode)foot.parentNode.insertBefore(strip,foot);else document.body.appendChild(strip);
  }
  function cards(){
    /* Game cards on the arcade and home pages: share the game's own page. */
    var cs=document.querySelectorAll('article.card.game');
    for(var i=0;i<cs.length;i++){
      var c=cs[i],h=c.querySelector('h3'),play=c.querySelector('a.btn[href$=".html"]');
      if(!h||!play||c.querySelector('.wgs'))continue;
      var file=play.getAttribute('href');if(/^https?:|\//.test(file))continue;
      var title=h.textContent.trim();
      var r=row({title:title,text:title+', free to play from William George Works:',url:SITE+file,label:'Share'});
      play.parentNode.insertBefore(r,play.nextSibling);
    }
  }
  function hooks(){
    /* Anything marked data-share-url="page.html" gets a row of its own. */
    var hs=document.querySelectorAll('[data-share-url]');
    for(var i=0;i<hs.length;i++){
      var e=hs[i],d=e.dataset;if(e.querySelector('.wgs'))continue;
      e.appendChild(row({title:d.shareTitle||document.title,text:d.shareText||d.shareTitle||document.title,url:SITE+d.shareUrl,label:d.shareLabel||'Share'}));
    }
  }
  function shirts(){
    /* Shop items (shirts, the mug, the jigsaw), on the shop page and the home page: share the item's own page at the printer's. */
    var cs=document.querySelectorAll('article.card.product, article.card.game');
    for(var i=0;i<cs.length;i++){
      var c=cs[i],h=c.querySelector('h2,h3'),buy=c.querySelector('a.btn[href*="teemill.com/product/"]');
      if(!h||!buy||c.querySelector('.wgs'))continue;
      var title=h.textContent.trim(),kind=c.getAttribute('data-kind')||'T-shirt';
      var noun=kind==='T-shirt'?'shirt':kind;
      var r=row({title:title+' '+kind,text:'The \u201c'+title+'\u201d '+kind+', from William George Works:',url:buy.href,label:'Share this '+noun});
      var at=buy.parentNode.tagName==='P'?buy.parentNode:buy;
      at.parentNode.insertBefore(r,at.nextSibling);
    }
  }
  function go(){books();cards();shirts();hooks();game();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
