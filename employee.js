/* Employee of the Month. Reads employee.json and puts a badge on:
   1. every listing marked data-staff="reggie" (or terry), and
   2. every picture of the winner (portraits/<winner>.jpg), wherever it appears.
   Only shows during the named month (UK time). */
(function(){
  if(!window.fetch)return;
  fetch("employee.json",{cache:"no-cache"}).then(function(r){return r.json();}).then(function(d){
    var now=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/London"}));
    var ym=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
    if(d.month!==ym)return;
    var name=(d.names&&d.names[d.winner])||d.winner;
    function make(cls){
      var b=document.createElement("span");
      b.className="eotm "+cls;
      b.setAttribute("role","img");
      b.setAttribute("aria-label","Employee of the Month: "+name);
      b.innerHTML="<b>Employee</b> of the Month<i>"+name+"</i>";
      return b;
    }
    /* listings */
    var els=document.querySelectorAll("[data-staff]");
    for(var i=0;i<els.length;i++){
      if(els[i].getAttribute("data-staff").split(/\s+/).indexOf(d.winner)<0)continue;
      els[i].classList.add("has-eotm");
      els[i].insertBefore(make("card-badge"),els[i].firstChild);
    }
    /* pictures */
    var imgs=document.querySelectorAll('img[src*="portraits/'+d.winner+'.jpg"]'),pairs=[];
    for(var j=0;j<imgs.length;j++){
      var host=imgs[j].offsetParent||document.body,b=make("pic-badge");
      host.appendChild(b);pairs.push([imgs[j],b]);
    }
    function place(){
      for(var k=0;k<pairs.length;k++){
        var im=pairs[k][0],b=pairs[k][1];
        b.style.top=(im.offsetTop+im.offsetHeight-b.offsetHeight-8)+"px";
        b.style.left=(im.offsetLeft+im.offsetWidth-b.offsetWidth-8)+"px";
      }
    }
    place();
    window.addEventListener("load",place);
    window.addEventListener("resize",place);
    for(var m=0;m<imgs.length;m++)imgs[m].addEventListener("load",place);
  }).catch(function(){});
})();
