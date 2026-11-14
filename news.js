/* The Daily Row: shows the newest edition from news-data.json. All text goes in as text, links only if https. */
(function () {
  "use strict";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function pretty(d) { var p = d.split("-"), dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); return DAYS[dt.getUTCDay()] + " " + (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  function safeUrl(u) { return typeof u === "string" && /^https:\/\//.test(u) ? u : null; }
  function line(who, text) {
    var l = el("div", "line " + (who === "T" ? "t" : "r")), a = el("span", "av " + (who === "T" ? "t" : "r"), who);
    a.setAttribute("aria-hidden", "true");
    return add(l, a, add(el("div", "say"), el("span", "sayer", who === "T" ? "Terry" : "Reggie"), el("p", null, text)));
  }
  function draw(ed, eds) {
    var out = document.getElementById("paper"); out.textContent = "";
    var mast = el("header", "masthead");
    add(mast, el("p", "when", pretty(ed.date)), el("h2", null, ed.title), el("p", "standfirst", ed.standfirst));
    out.appendChild(mast);
    var grid = el("div", "stories");
    ed.stories.forEach(function (s) {
      var c = el("article", "card story");
      add(c, add(el("div"), el("span", "tag sat", "Satire"), document.createTextNode(" "), el("span", "tag idea", s.kicker)), el("h3", null, s.headline), el("p", "satire", s.satire));
      var r = el("div", "real");
      add(r, el("b", null, "What actually happened"), el("p", null, s.real));
      var u = safeUrl(s.source && s.source.url);
      if (u) { var a = el("a", null, "Source: " + s.source.name); a.href = u; a.rel = "noopener"; r.appendChild(a); }
      c.appendChild(r); grid.appendChild(c);
    });
    out.appendChild(grid);
    add(out, add(el("div", "signoff"), line("T", ed.terry), line("R", ed.reggie)));
    var w = el("p", "wxlink"), wa = el("a", null, "Want the real weather? Terry and Reggie argue about that too."); wa.href = "weather.html"; w.appendChild(wa); out.appendChild(w);
    var days = document.getElementById("days"); days.textContent = "";
    if (eds.length > 1) eds.forEach(function (e) {
      var b = el("button", "chip", e.date); b.type = "button"; b.setAttribute("aria-pressed", e === ed ? "true" : "false");
      b.addEventListener("click", function () { draw(e, eds); });
      days.appendChild(b);
    });
  }
  fetch("news-data.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    var eds = (d && Array.isArray(d.editions) ? d.editions : []).filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Array.isArray(e.stories); });
    var out = document.getElementById("paper");
    if (!eds.length) { out.textContent = ""; out.appendChild(el("p", "status", "No edition yet. The first front page is being set in type. Check back soon.")); return; }
    draw(eds[0], eds);
  }).catch(function () {
    var out = document.getElementById("paper"); out.textContent = ""; out.appendChild(el("p", "status bad", "Couldn't fetch the paper just now. Try again in a minute."));
  });
})();
