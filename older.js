/* Long pages: show the newest entries and fold the older ones behind a button.
   Used by the Log (log.html) and the ledger (invoices.html). New entries still go in at the top of the page
   exactly as before; nothing here needs touching when one is added. Without this script everything shows. */
(function () {
  "use strict";
  function fold(selector, keep, step, noun, skip) {
    var all = [].slice.call(document.querySelectorAll(selector)), items = [], i;
    for (i = 0; i < all.length; i++) { if (!(skip && skip(all[i]))) items.push(all[i]); }
    if (items.length < keep + 3) return;
    var shown = keep, target = null;
    try { if (location.hash.length > 1) target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
    for (i = 0; target && i < items.length; i++) { if (items[i] === target || items[i].contains(target)) shown = Math.max(shown, i + 1); }
    var bar = document.createElement("p"), more = document.createElement("button"), every = document.createElement("button"), note = document.createElement("span");
    bar.className = "older";
    more.type = every.type = "button"; more.className = "btn alt"; every.className = "btn alt";
    bar.appendChild(note); bar.appendChild(more); bar.appendChild(every);
    function draw(focusFrom) {
      for (i = 0; i < items.length; i++) items[i].hidden = i >= shown;
      var left = items.length - shown;
      if (left <= 0) { if (bar.parentNode) bar.parentNode.removeChild(bar); }
      else {
        note.textContent = "Showing the newest " + shown + " of " + items.length + " " + noun + ".";
        more.textContent = "Show " + Math.min(step, left) + " older";
        every.textContent = "Show all";
        every.hidden = left <= step;
        items[shown].parentNode.insertBefore(bar, items[shown]);
      }
      if (focusFrom != null && items[focusFrom]) { items[focusFrom].setAttribute("tabindex", "-1"); items[focusFrom].focus({ preventScroll: true }); }
    }
    more.addEventListener("click", function () { var from = shown; shown = Math.min(items.length, shown + step); draw(from); });
    every.addEventListener("click", function () { var from = shown; shown = items.length; draw(from); });
    draw(null);
  }
  fold("article.card.post", 10, 10, "posts");
  /* The standing accounts (dated "Ongoing") always stay on show at the bottom of the ledger. */
  fold(".ledger > article.card.invoice", 6, 6, "invoices", function (a) {
    var dd = a.querySelectorAll("header dl dd"), j;
    for (j = 0; j < dd.length; j++) { if (/^\s*Ongoing\s*$/.test(dd[j].textContent)) return true; }
    return false;
  });
})();
