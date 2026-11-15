/* The main menu. On a phone it folds away behind a Menu button. On a wider screen the less-visited
   pages sit under "Explore". Without this script the full menu simply shows, as before. */
(function(){
  var h=document.querySelector('header.site'),n=h&&h.querySelector('nav.main');if(!n)return;
  if(!n.querySelector('a[href="comic.html"]')){var comic=document.createElement('a');comic.href='comic.html';comic.textContent='Monthly comic';n.appendChild(comic);}
  if(!n.querySelector('a[href="employee-of-the-month.html"]')){var eo=document.createElement('a');eo.href='employee-of-the-month.html';eo.textContent='Employee of the Month';n.appendChild(eo);}
  if(!n.querySelector('a[href="board.html"]')){var bd=document.createElement('a');bd.href='board.html';bd.textContent='Reggie\'s Board';n.appendChild(bd);}
  var MAIN=['index.html','books.html','arcade.html','comic.html','story.html','cats.html'];
  var b=document.createElement('button');b.type='button';b.className='navbtn';b.textContent='Menu';
  n.id=n.id||'mainnav';b.setAttribute('aria-controls',n.id);b.setAttribute('aria-expanded','false');
  n.parentNode.insertBefore(b,n);h.classList.add('js-nav');
  b.addEventListener('click',function(){var open=h.classList.toggle('open');b.setAttribute('aria-expanded',open?'true':'false');b.textContent=open?'Close':'Menu';});

  var links=[].slice.call(n.querySelectorAll('a')),rest=[],i;
  for(i=0;i<links.length;i++){var f=(links[i].getAttribute('href')||'').replace(/^\//,'');if(MAIN.indexOf(f)<0)rest.push(links[i]);}
  if(rest.length<3)return;
  var more=document.createElement('div'),mb=document.createElement('button'),list=document.createElement('div');
  more.className='more';mb.type='button';mb.className='morebtn';mb.textContent='Explore';mb.setAttribute('aria-expanded','false');list.className='morelist';list.id='morelist';mb.setAttribute('aria-controls','morelist');
  for(i=0;i<rest.length;i++){if(rest[i].getAttribute('aria-current'))mb.className+=' here';if(/tribunal\.html$/.test(rest[i].getAttribute('href')))rest[i].textContent='Summon the Tribunal';list.appendChild(rest[i]);}
  more.appendChild(mb);more.appendChild(list);n.appendChild(more);
  function set(open){more.classList.toggle('open',open);mb.setAttribute('aria-expanded',open?'true':'false');}
  mb.addEventListener('click',function(e){e.stopPropagation();set(!more.classList.contains('open'));});
  document.addEventListener('click',function(e){if(!more.contains(e.target))set(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&more.classList.contains('open')){set(false);mb.focus();}});
})();

