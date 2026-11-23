/* Reggie's message board: shows board.json, and sends new messages to the Worker. All text goes in as text. */
(function () {
  "use strict";
  var WORKER = "https://arcade-scores.williamgeorgeworks.workers.dev";
  var list = document.getElementById("bd-list");
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function pretty(d) { var p = String(d).split("-"); return (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  var shown = 20, posts = [];
  function paragraphs(parent, text) { String(text).split(/\n{2,}|\n/).forEach(function (t) { if (t.trim()) parent.appendChild(el("p", null, t.trim())); }); }
  function draw() {
    list.textContent = "";
    if (!posts.length) { list.appendChild(el("p", "none", "The tray is empty. Be the first to post, and Reggie will pretend he was not just standing there.")); return; }
    posts.slice(0, shown).forEach(function (p) {
      var c = el("article", "card bpost");
      if (!p.hidden) {
        var top = el("div", "bwho"); top.appendChild(el("b", null, p.name)); top.appendChild(el("span", null, " · " + pretty(p.date))); c.appendChild(top);
        var m = el("div", "bmsg"); paragraphs(m, p.msg); c.appendChild(m);
      } else {
        var t2 = el("div", "bwho"); t2.appendChild(el("b", null, "A message that Reggie has kept private")); t2.appendChild(el("span", null, " · " + pretty(p.date))); c.appendChild(t2);
      }
      var r = el("div", "breply"); var av = el("span", "bav", "R"); av.setAttribute("aria-hidden", "true"); r.appendChild(av);
      var body = el("div", "bbody"); body.appendChild(el("b", null, "Reggie")); paragraphs(body, p.reply); r.appendChild(body); c.appendChild(r);
      list.appendChild(c);
    });
    if (posts.length > shown) { var b = el("button", "btn small alt", "Show older posts"); b.type = "button"; b.addEventListener("click", function () { shown += 20; draw(); }); list.appendChild(b); }
  }
  fetch("board.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    posts = (d && Array.isArray(d.posts) ? d.posts : []).filter(function (p) { return p && typeof p.reply === "string"; });
    draw();
  }).catch(function () { list.textContent = ""; list.appendChild(el("p", "status bad", "Couldn't fetch the board just now. Try again in a minute.")); });

  var form = document.getElementById("bd-form"), msg = document.getElementById("bd-msg"), name = document.getElementById("bd-name"), cnt = document.getElementById("bd-count"), status = document.getElementById("bd-status"), send = document.getElementById("bd-send");
  if (!form) return;
  try { var saved = localStorage.getItem("wgw-name"); if (saved && !name.value) name.value = saved.slice(0, 24); } catch (e) {}
  msg.addEventListener("input", function () { cnt.textContent = msg.value.length + " / 400"; });
  function say(text, bad) { status.hidden = false; status.textContent = text; status.className = "formmsg" + (bad ? " bad" : " good"); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (msg.value.trim().length < 5) { say("Reggie needs a little more than that to go on.", true); return; }
    send.disabled = true; say("Sending...", false);
    fetch(WORKER + "/board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.value, message: msg.value, website: document.getElementById("bd-web").value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (j && j.ok) { try { if (name.value.trim()) localStorage.setItem("wgw-name", name.value.trim().slice(0, 24)); } catch (e) {} msg.value = ""; cnt.textContent = "0 / 400"; say("In the tray. Reggie reads the post at about 9, 2 and 7, and if your message passes the sniff test it will appear above with his reply.", false); }
        else say((j && j.error) || "The post room is busy. Try again in a minute.", true);
      })
      .catch(function () { say("Couldn't reach the post room. Try again in a minute.", true); })
      .then(function () { send.disabled = false; });
  });
})();
