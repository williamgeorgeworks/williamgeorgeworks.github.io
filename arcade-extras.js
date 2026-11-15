/* Player of the week and your badges. Week board is worked out from scores.json; badges from your own saves. */
(function () {
  "use strict";
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function ukDate(d) { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d); } catch (e) { return d.toISOString().slice(0, 10); } }
  var potw = document.getElementById("potw"), badges = document.getElementById("badges");

  if (badges) {
    function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null") || {}; } catch (e) { return {}; } }
    var g = load("gtk-v1"), r = load("rlgl-v1"), a = 0;
    try { a = parseInt(localStorage.getItem("arthur-best") || "0", 10) || 0; } catch (e) {}
    var list = [
      ["Sticky Paws", "Steal 1,000 Dreamies in one Grand Theft Kitty run", +g.best >= 1000],
      ["Master Thief", "Steal 5,000 Dreamies in one run", +g.best >= 5000],
      ["Pillar of the Community", "Reach round 5 in Red Light, Green Light", +r.round >= 5],
      ["Fish on the Slab", "Score 1,000 in Red Light, Green Light", +r.best >= 1000],
      ["Order in Court", "Score 500 in Arthur's Tribunal", a >= 500],
      ["Hung Jury", "Score 1,000 in Arthur's Tribunal", a >= 1000]
    ];
    var got = list.filter(function (x) { return x[2]; }).length;
    badges.textContent = "";
    badges.appendChild(el("h3", null, "Your badges (" + got + " of " + list.length + ")"));
    var ul = el("ul", "badgelist");
    list.forEach(function (x) { var li = el("li", x[2] ? "got" : "locked"); li.appendChild(el("b", null, (x[2] ? "★ " : "☆ ") + x[0])); li.appendChild(el("span", null, x[1])); ul.appendChild(li); });
    badges.appendChild(ul);
    badges.appendChild(el("p", "fine", "Kept in this browser only, so they will not follow you to another device."));
  }

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
