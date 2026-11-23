/* Daily Row voting: a "Best story" button on each story, and one Terry v Reggie vote for the sign-off.
   Counts live in the Worker; if it isn't there, nothing is drawn. */
(function () {
  "use strict";
  var WORKER = "https://arcade-scores.williamgeorgeworks.workers.dev";
  var out = document.getElementById("paper");
  if (!out || !window.fetch) return;
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function mine() { try { return JSON.parse(localStorage.getItem("wgw-votes") || "{}") || {}; } catch (e) { return {}; } }
  function remember(key, i, side) { try { var v = mine(); (v[key] = v[key] || {})[i] = side; localStorage.setItem("wgw-votes", JSON.stringify(v)); } catch (e) {} }
  function post(key, story, side) {
    return fetch(WORKER + "/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ edition: key, story: story, side: side }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j || !j.ok) throw new Error("no"); return j; });
  }
  function faveBox(key, i, st) {
    var box = el("div", "nvote");
    function paint(st, done) {
      box.textContent = "";
      var n = (st && st.fave) || 0;
      var b = el("button", "nbtn" + (done ? " on" : ""), (done ? "★ You picked this" : "☆ Best story of the day") + " · " + n);
      b.type = "button"; b.disabled = !!done;
      b.addEventListener("click", function () {
        b.disabled = true;
        post(key, i, "fave").then(function (j) { remember(key, i, "fave"); paint(j.stories && j.stories[i], true); })
          .catch(function () { b.disabled = false; });
      });
      box.appendChild(b);
    }
    paint(st, (mine()[key] || {})[i] === "fave");
    return box;
  }
  function signBox(key, st, total) {
    var box = el("div", "nvote sign");
    function paint(st, total, done) {
      box.textContent = "";
      var t = (st && st.terry) || 0, r = (st && st.reggie) || 0;
      box.appendChild(el("b", null, done ? "You backed " + (done === "terry" ? "Terry" : "Reggie") + "." : "Whose sign-off was funnier today?"));
      var row = el("div", "nrow");
      [["terry", "Terry"], ["reggie", "Reggie"]].forEach(function (x) {
        var b = el("button", "nbtn " + x[0], x[1] + (done ? " " + (x[0] === "terry" ? t : r) : "")); b.type = "button"; b.disabled = !!done;
        b.addEventListener("click", function () {
          row.querySelectorAll("button").forEach(function (q) { q.disabled = true; });
          post(key, 14, x[0]).then(function (j) { remember(key, 14, x[0]); paint(j.stories && j.stories[14], j.total, x[0]); })
            .catch(function () { row.querySelectorAll("button").forEach(function (q) { q.disabled = false; }); });
        });
        row.appendChild(b);
      });
      box.appendChild(row);
      if (total) box.appendChild(el("small", null, "All-time across both papers: Terry " + (total.terry || 0) + ", Reggie " + (total.reggie || 0) + "."));
    }
    paint(st, total, (mine()[key] || {})[14] || null);
    return box;
  }
  var busy = false;
  function decorate() {
    var date = out.getAttribute("data-edition");
    if (!date || busy || out.querySelector(".nvote")) return;
    busy = true;
    var key = "n-" + date;
    fetch(WORKER + "/tally?edition=" + key).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
      if (!j || !j.ok || out.getAttribute("data-edition") !== date || out.querySelector(".nvote")) return;
      var st = j.stories || {};
      out.querySelectorAll("article.story").forEach(function (c, i) { c.insertBefore(faveBox(key, i, st[i]), c.querySelector(".alsolink") || null); });
      var so = out.querySelector(".signoff");
      if (so) so.parentNode.insertBefore(signBox(key, st[14], j.total), so.nextSibling);
    }).catch(function () { /* votes not set up: show nothing */ }).then(function () { busy = false; });
  }
  new MutationObserver(decorate).observe(out, { childList: true });
  decorate();
})();
