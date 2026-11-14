/* Christmas banner: appears on the main pages from 1 December to 5 January, by the visitor's own clock.
   Add ?xmas=N to any page to preview (N = 1-24 for a day in December, 25 for the days after). */
(function () {
  "use strict";
  var now = new Date(), m = now.getMonth(), d = now.getDate(), day = 0;
  var q = /[?&]xmas=(\d+)/.exec(location.search);
  if (q) { day = Math.min(parseInt(q[1], 10), 25); }
  else if (m === 11) { day = Math.min(d, 25); }
  else if (m === 0 && d <= 5) { day = 25; }
  if (!day) return;
  try { if (!q && sessionStorage.getItem("wgwXmasBanner") === "off") return; } catch (e) {}
  var header = document.querySelector("header.site");
  if (!header) return;
  var bar = document.createElement("div");
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Christmas advent calendar");
  bar.style.cssText = "background:#0d2218;color:#f6ecd2;border-bottom:3px solid #d9a93f;padding:9px 44px 9px 16px;text-align:center;font:600 17px/1.4 Georgia,serif;position:relative";
  var msg = day <= 24
    ? "Door " + day + " of Arthur’s Advent Calendar is open. "
    : "Merry Christmas from Arthur. Every door of the advent calendar is open. ";
  bar.appendChild(document.createTextNode("❄ " + msg));
  var a = document.createElement("a");
  a.href = "advent-calendar.html";
  a.textContent = day <= 24 ? "Open it" : "Have a look";
  a.style.cssText = "color:#d9a93f;text-decoration:underline";
  bar.appendChild(a);
  var x = document.createElement("button");
  x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Dismiss the Christmas banner");
  x.style.cssText = "position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:0;color:#f6ecd2;font-size:26px;line-height:1;cursor:pointer;padding:2px 8px";
  x.onclick = function () { bar.remove(); try { sessionStorage.setItem("wgwXmasBanner", "off"); } catch (e) {} };
  bar.appendChild(x);
  header.parentNode.insertBefore(bar, header);
})();
