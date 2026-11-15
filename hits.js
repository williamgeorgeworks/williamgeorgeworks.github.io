/* Private page counter: sends the page name (and the site you came from, once per visit) to our own Worker.
   No cookies, no IDs, nothing personal. Skips Do Not Track and Ferret's own browser (visit stats.html?me once). */
(function(){
  try{
    if(navigator.doNotTrack==='1'||localStorage.getItem('wgw-nostats'))return;
    var page=location.pathname,k='wgw-hit:'+page;
    if(sessionStorage.getItem(k))return;
    sessionStorage.setItem(k,'1');
    var first=!sessionStorage.getItem('wgw-visit');
    if(first)sessionStorage.setItem('wgw-visit','1');
    fetch('https://arcade-scores.benharding75.workers.dev/hit',{method:'POST',headers:{'Content-Type':'text/plain'},keepalive:true,
      body:JSON.stringify({page:page,ref:first?document.referrer:'',first:first})}).catch(function(){});
  }catch(e){}
})();
