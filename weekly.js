/* Best of the week: the most-voted stories from the last seven days of this paper. Worked out in the browser. */
(function () {
  "use strict";
  var box = document.getElementById("weekbest");
  if (!box || !window.fetch) return;
  var gaming = /gaming\.html/.test(location.pathname);
  var WORKER = "https://arcade-scores.benharding75.workers.dev";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function ukDate(d) { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d); } catch (e) { return d.toISOString().slice(0, 10); } }
  var cutoff = ukDate(new Date(Date.now() - 6 * 86400000));
  fetch(gaming ? "gaming-data.json" : "news-data.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var eds = (d.editions || []).filter(function (e) { return e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.date >= cutoff && Array.isArray(e.stories); }).slice(0, 7);
    if (!eds.length) return;
    var keys = eds.map(function (e) { return (gaming ? "" : "n-") + e.date; });
    return fetch(WORKER + "/tally?editions=" + keys.join(",")).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (t) {
      if (!t || !t.ok) throw new Error("no");
      var rows = [];
      eds.forEach(function (e, ei) {
        var st = (t.editions || {})[keys[ei]] || {};
        e.stories.forEach(function (s, i) {
          var v = st[i] || {}, n = gaming ? (v.terry || 0) + (v.reggie || 0) : (v.fave || 0);
          if (n > 0) rows.push({ n: n, ed: e.date, s: s, v: v });
        });
      });
      rows.sort(function (a, b) { return b.n - a.n || (a.ed < b.ed ? 1 : -1); });
      box.textContent = "";
      box.appendChild(el("h3", null, "Best of the week"));
      if (!rows.length) { box.appendChild(el("p", "none", gaming ? "No votes yet this week. Settle an argument and you'll be the first on the board." : "No votes yet this week. Pick a best story and you'll be the first on the board.")); box.hidden = false; return; }
      var ol = el("ol", "weeklist");
      rows.slice(0, 3).forEach(function (r) {
        var li = el("li"); li.appendChild(el("b", null, r.s.headline));
        var note = gaming ? r.n + (r.n === 1 ? " vote" : " votes") + " (Terry " + (r.v.terry || 0) + ", Reggie " + (r.v.reggie || 0) + ")" : r.n + (r.n === 1 ? " vote" : " votes") + " for best story";
        li.appendChild(el("span", null, r.ed + " · " + note));
        var chip = Array.prototype.filter.call(document.querySelectorAll("#days .chip"), function (c) { return c.textContent === r.ed; })[0];
        if (chip) { var a = el("button", "chip small", "Read it"); a.type = "button"; a.addEventListener("click", function () { chip.click(); var p = document.getElementById("paper"); if (p && p.scrollIntoView) p.scrollIntoView(); }); li.appendChild(a); }
        ol.appendChild(li);
      });
      box.appendChild(ol);
      box.appendChild(el("p", "fine", "Votes from the last seven days. Not verified, so treat it as fun and not as a poll."));
      box.hidden = false;
    });
  }).catch(function () { box.hidden = true; });
})();
