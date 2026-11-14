/* Employee of the Month. Reads employee.json and puts a badge on every listing
   marked data-staff="reggie" (or terry). Only shows during the named month. */
(function(){
  var els=document.querySelectorAll("[data-staff]");
  if(!els.length||!window.fetch)return;
  fetch("employee.json",{cache:"no-cache"}).then(function(r){return r.json();}).then(function(d){
    var now=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/London"}));
    var ym=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
    if(d.month!==ym)return;
    var name=(d.names&&d.names[d.winner])||d.winner;
    for(var i=0;i<els.length;i++){
      var who=els[i].getAttribute("data-staff").split(/\s+/);
      if(who.indexOf(d.winner)<0)continue;
      var b=document.createElement("span");
      b.className="eotm";
      b.setAttribute("role","img");
      b.setAttribute("aria-label","Employee of the Month: "+name);
      b.innerHTML="<b>Employee</b> of the Month<i>"+name+"</i>";
      els[i].classList.add("has-eotm");
      els[i].insertBefore(b,els[i].firstChild);
    }
  }).catch(function(){});
})();
