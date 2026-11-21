/* Home page: put the newest edition's headline on the Daily Row and Gaming Row lines.
   Reads the small RSS feeds (news.xml, gaming.xml). If anything fails, the plain description stays. */
(function () {
  "use strict";
  if (!window.fetch || !window.DOMParser) return;
  var spots = document.querySelectorAll("[data-latest]");
  function ukDay(d) { try { return d.toLocaleDateString("en-GB", { timeZone: "Europe/London" }); } catch (e) { return d.toDateString(); } }
  [].forEach.call(spots, function (el) {
    fetch(el.getAttribute("data-latest"), { cache: "no-cache" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (txt) {
      if (!txt) return;
      var item = new DOMParser().parseFromString(txt, "application/xml").querySelector("item");
      if (!item) return;
      var title = (item.querySelector("title") || {}).textContent, when = new Date((item.querySelector("pubDate") || {}).textContent || "");
      if (!title) return;
      var today = !isNaN(when) && ukDay(when) === ukDay(new Date());
      el.textContent = (today ? "Today: " : "Latest: ") + "“" + title.trim() + "”";
    }).catch(function () {});
  });
})();
