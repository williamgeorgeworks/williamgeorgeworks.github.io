/* Mailing list signup, live on Buttondown since 14 November 2026. The form appears
   on every page that has <div id="join-list"></div>. The form posts straight to the service in a new tab,
   so no keys are needed on the site.
     Buttondown: action "https://buttondown.com/api/emails/embed-subscribe/YOURNAME", field "email"
     Kit:        action "https://app.kit.com/forms/FORMID/subscriptions",             field "email_address"
     Mailchimp:  action the "form action" URL from the embedded form,               field "EMAIL"   */
(function () {
  "use strict";
  var CONFIG = window.WGW_LIST || { action: "https://buttondown.com/api/emails/embed-subscribe/williamgeorgeworks", field: "email", hidden: { embed: "1" } };
  var host = document.getElementById("join-list");
  if (!host || !CONFIG.action || !/^https:\/\//.test(CONFIG.action)) return;
  var sec = document.createElement("section");
  sec.className = "band";
  sec.style.paddingTop = "10px";
  var wrap = document.createElement("div");
  wrap.className = "wrap";
  var card = document.createElement("article");
  card.className = "card";
  card.innerHTML = '<p class="scrawl">Stay in the loop</p><h2 style="font-size:clamp(30px,5vw,44px)">The mailing list</h2>' +
    '<p>New books, new games and the odd piece of nonsense, sent when there is something to say. No spam, and you can leave whenever you like.</p>';
  var f = document.createElement("form");
  f.method = "post"; f.action = CONFIG.action; f.target = "_blank";
  f.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;align-items:center";
  var lab = document.createElement("label"); lab.className = "vh"; lab.htmlFor = "join-email"; lab.textContent = "Email address";
  lab.style.cssText = "position:absolute;left:-999px";
  var inp = document.createElement("input");
  inp.type = "email"; inp.id = "join-email"; inp.name = CONFIG.field || "email"; inp.required = true; inp.autocomplete = "email"; inp.placeholder = "you@example.com"; inp.maxLength = 120;
  inp.style.cssText = "flex:1 1 240px;min-width:0;font:inherit;font-size:19px;padding:10px 13px;border:3px solid #141414;background:#fff;color:#141414";
  var btn = document.createElement("button");
  btn.type = "submit"; btn.className = "btn"; btn.textContent = "Join the list"; btn.style.cursor = "pointer";
  f.appendChild(lab); f.appendChild(inp);
  var h = CONFIG.hidden || {};
  Object.keys(h).forEach(function (k) { var i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = h[k]; f.appendChild(i); });
  f.appendChild(btn);
  var fine = document.createElement("p");
  fine.style.cssText = "font-size:16px;color:#5f5a4e;margin:14px 0 0";
  fine.appendChild(document.createTextNode("Your address goes to our mailing service and is used only for news from William George Works. Signing up opens a confirmation page in a new tab, and every email has an unsubscribe link. The "));
  var pl = document.createElement("a"); pl.href = "privacy.html"; pl.textContent = "privacy page"; fine.appendChild(pl);
  fine.appendChild(document.createTextNode(" has the rest."));
  card.appendChild(f); card.appendChild(fine);
  wrap.appendChild(card); sec.appendChild(wrap); host.appendChild(sec);
})();
