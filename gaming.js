/* The Daily Gaming Row: shows the newest edition from gaming-data.json. All text goes in as text, links only if https. */
(function () {
  "use strict";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function pretty(d) { var p = d.split("-"), dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); return DAYS[dt.getUTCDay()] + " " + (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  var WORKER = "https://arcade-scores.benharding75.workers.dev";
  var tallyCache = {};
  function getVotes() { try { return JSON.parse(localStorage.getItem("wgw-votes") || "{}") || {}; } catch (e) { return {}; } }
  function setVote(date, i, side) { try { var v = getVotes(); (v[date] = v[date] || {})[i] = side; localStorage.setItem("wgw-votes", JSON.stringify(v)); } catch (e) {} }
  function loadTally(date) {
    if (tallyCache[date]) return tallyCache[date];
    tallyCache[date] = fetch(WORKER + "/tally?edition=" + date).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { if (!j || !j.ok) throw new Error("no"); return j; });
    tallyCache[date].catch(function () { delete tallyCache[date]; });
    return tallyCache[date];
  }
  function scoreboard(total) {
    var box = el("div", "scoreboard");
    var t = total.terry || 0, r = total.reggie || 0;
    add(box, el("b", null, "The running score"),
      add(el("p", null), el("span", "st", "Terry " + t), document.createTextNode("  v  "), el("span", "sr", "Reggie " + r)),
      el("small", null, t === r ? "Dead level. Nobody is happy." : (t > r ? "Terry leads, and will not shut up about it." : "Reggie leads, and has already sent an invoice.")));
    return box;
  }
  function voteBox(date, i, tally) {
    var box = el("div", "vote");
    function paint(st, mine) {
      box.textContent = "";
      var t = (st && st.terry) || 0, r = (st && st.reggie) || 0, n = t + r;
      if (!mine) {
        add(box, el("b", null, "Who won this argument?"));
        var row = el("div", "vrow");
        [["terry", "Terry (PC, full price)"], ["reggie", "Reggie (PS5, in a sale)"]].forEach(function (x) {
          var b = el("button", "vbtn " + x[0], x[1]); b.type = "button";
          b.addEventListener("click", function () {
            row.querySelectorAll("button").forEach(function (q) { q.disabled = true; });
            fetch(WORKER + "/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ edition: date, story: i, side: x[0] }) })
              .then(function (rr) { return rr.json(); })
              .then(function (j) { if (!j || !j.ok) throw new Error("no"); setVote(date, i, x[0]); delete tallyCache[date]; paint(j.stories && j.stories[i], x[0]); if (j.total) refreshBoard(j.total); })
              .catch(function () { row.querySelectorAll("button").forEach(function (q) { q.disabled = false; }); box.appendChild(el("small", "vbad", "Couldn't count that one. Try again in a minute.")); });
          });
          row.appendChild(b);
        });
        box.appendChild(row);
      } else {
        add(box, el("b", null, "You backed " + (mine === "terry" ? "Terry" : "Reggie") + ". Readers say:"));
        var bar = el("div", "vbar");
        var pt = n ? Math.round(t * 100 / n) : 50;
        var a = el("span", "vt", "Terry " + t), c = el("span", "vr", "Reggie " + r);
        a.style.flexBasis = pt + "%"; c.style.flexBasis = (100 - pt) + "%";
        add(bar, a, c); box.appendChild(bar);
      }
    }
    var mine = (getVotes()[date] || {})[i] || null;
    paint(tally.stories && tally.stories[i], mine);
    return box;
  }
  function refreshBoard(total) {
    var old = document.querySelector(".scoreboard"); if (!old) return;
    old.parentNode.replaceChild(scoreboard(total), old);
  }
  function addVoting(ed, out) {
    loadTally(ed.date).then(function (tally) {
      var cards = out.querySelectorAll("article.story");
      cards.forEach(function (c, i) { if (!c.querySelector(".vote")) c.insertBefore(voteBox(ed.date, i, tally), c.querySelector(".alsolink") || null); });
      var mast = out.querySelector("header.masthead");
      if (mast && !mast.querySelector(".scoreboard")) mast.appendChild(scoreboard(tally.total || {}));
    }).catch(function () { /* votes not set up yet: show nothing */ });
  }
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
      c.appendChild(r);
      var k = s.link && typeof s.link.url === "string" && /^[a-z0-9-]+\.html$/.test(s.link.url) ? s.link : null;
      if (k) { var kp = el("p", "alsolink"), ka = el("a", null, k.text); ka.href = k.url; kp.appendChild(ka); c.appendChild(kp); }
      grid.appendChild(c);
    });
    out.appendChild(grid);
    addVoting(ed, out);
    add(out, add(el("div", "signoff"), line("T", ed.terry), line("R", ed.reggie)));
    var w = el("p", "wxlink"), wa = el("a", null, "Want the proper news? The Daily Row is next door, and they argue there too."); wa.href = "news.html"; w.appendChild(wa); out.appendChild(w);
    var days = document.getElementById("days"); days.textContent = "";
    if (eds.length > 1) eds.forEach(function (e) {
      var b = el("button", "chip", e.date); b.type = "button"; b.setAttribute("aria-pressed", e === ed ? "true" : "false");
      b.addEventListener("click", function () { draw(e, eds); });
      days.appendChild(b);
    });
  }
  fetch("gaming-data.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    var eds = (d && Array.isArray(d.editions) ? d.editions : []).filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Array.isArray(e.stories); });
    var out = document.getElementById("paper");
    if (!eds.length) { out.textContent = ""; out.appendChild(el("p", "status", "No edition yet. The first gaming front page is being set in type. Check back soon.")); return; }
    draw(eds[0], eds);
  }).catch(function () {
    var out = document.getElementById("paper"); out.textContent = ""; out.appendChild(el("p", "status bad", "Couldn't fetch the paper just now. Try again in a minute."));
  });
})();
