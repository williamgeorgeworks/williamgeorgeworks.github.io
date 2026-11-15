/* Reading streaks for the two daily papers. Kept in the reader's own browser; nothing is sent anywhere. */
(function () {
  "use strict";
  var page = /gaming\.html/.test(location.pathname) ? "gaming" : "news";
  var paper = page === "gaming" ? "Daily Gaming Row" : "Daily Row";
  function ukDate(d) { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d || new Date()); } catch (e) { return (d || new Date()).toISOString().slice(0, 10); } }
  function dayNum(s) { var p = s.split("-"); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  var data = {};
  try { data = JSON.parse(localStorage.getItem("wgw-streak") || "{}") || {}; } catch (e) { data = {}; }
  var s = data[page] || { last: "", count: 0, best: 0, total: 0 };
  var today = ukDate();
  if (s.last !== today) {
    if (s.last && dayNum(today) - dayNum(s.last) === 1) s.count += 1; else s.count = 1;
    s.last = today; s.total = (s.total || 0) + 1;
    if (s.count > (s.best || 0)) s.best = s.count;
    data[page] = s;
    try { localStorage.setItem("wgw-streak", JSON.stringify(data)); } catch (e) {}
  }
  var notes = { 3: "Three in a row. Terry has noticed. Reggie has started charging for the privilege.", 7: "A whole week. Terry is calling you a legend. Reggie is calling you a regular, which in his book is worth more.", 14: "A fortnight. You are now part of the furniture, and the furniture is delighted.", 30: "Thirty mornings. Terry is weeping. Reggie wants to put you on the payroll." };
  var box = document.createElement("p");
  box.className = "streak";
  var msg = s.count + (s.count === 1 ? " morning" : " mornings in a row") + " reading the " + paper + ".";
  if (s.count === 1) msg = "First morning of your " + paper + " streak. Come back tomorrow to keep it going.";
  if (s.best > s.count) msg += " Best: " + s.best + ".";
  var b = document.createElement("b"); b.textContent = "Reading streak: "; box.appendChild(b); box.appendChild(document.createTextNode(msg));
  if (notes[s.count]) { var sm = document.createElement("small"); sm.textContent = notes[s.count]; box.appendChild(sm); }
  var anchor = document.getElementById("days") || document.getElementById("paper");
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
})();
