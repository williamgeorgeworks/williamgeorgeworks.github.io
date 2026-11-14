/* Fold-away menu for phones. Without this script the full menu simply shows, as before. */
(function(){
  var h=document.querySelector('header.site'),n=h&&h.querySelector('nav.main');if(!n)return;
  var b=document.createElement('button');b.type='button';b.className='navbtn';b.textContent='Menu';
  n.id=n.id||'mainnav';b.setAttribute('aria-controls',n.id);b.setAttribute('aria-expanded','false');
  n.parentNode.insertBefore(b,n);h.classList.add('js-nav');
  b.addEventListener('click',function(){var open=h.classList.toggle('open');b.setAttribute('aria-expanded',open?'true':'false');b.textContent=open?'Close':'Menu';});
})();
