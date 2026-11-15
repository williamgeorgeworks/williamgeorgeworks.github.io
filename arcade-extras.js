/* Player of the week. The week board is worked out from scores.json. Badges now live in badges.js. */
(function () {
  "use strict";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function ukDate(d) { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d); } catch (e) { return d.toISOString().slice(0, 10); } }
  var potw = document.getElementById("potw");

  if (potw) {
    fetch("scores.json", { cache: "no-store" }).then(function (x) { return x.json(); }).then(function (d) {
      var cutoff = ukDate(new Date(Date.now() - 6 * 86400000)), tally = {};
      Object.keys(d.games || {}).forEach(function (k) {
        (d.games[k].entries || []).forEach(function (e) {
          if (!e.date || e.date < cutoff) return;
          var n = e.name.toLowerCase(), t = tally[n] || (tally[n] = { name: e.name, n: 0, games: {} });
          t.n++; t.games[k] = 1;
        });
      });
      var arr = Object.keys(tally).map(function (k) { tally[k].g = Object.keys(tally[k].games).length; return tally[k]; });
      arr.sort(function (a, b) { return b.g - a.g || b.n - a.n; });
      potw.textContent = "";
      potw.appendChild(el("h3", null, "Player of the week"));
      if (!arr.length) { potw.appendChild(el("p", "none", "Nobody on the boards in the last seven days. The throne is empty and Reggie is not pleased.")); return; }
      var w = arr[0];
      var p = el("p", "potwname"); p.appendChild(el("b", null, w.name));
      p.appendChild(document.createTextNode(" has a place on the boards in " + w.g + (w.g === 1 ? " game" : " games") + " this week."));
      potw.appendChild(p);
      potw.appendChild(el("p", "fine", "Most games on the boards in the last seven days wins. Ties go to whoever has the most entries."));
    }).catch(function () { potw.hidden = true; });
  }
})();
