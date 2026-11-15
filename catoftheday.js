/* Cat of the day: one of the six, one of their photos, with a ruling from Terry and Reggie. Same for everyone, all day. */
(function () {
  "use strict";
  var holes = document.querySelectorAll("[data-cotd]");
  if (!holes.length) return;
  var CATS = [
    { n: "Arthur", id: "arthur", photos: 5, title: "Chief Justice", lines: [
      ["Terry says the Chief Justice is on top form and demands a standing ovation.", "Reggie says it is a nap, my old son, and the bench is billing by the hour."],
      ["Terry has declared today an official day of Arthur, with bunting.", "Reggie asks who is paying for the bunting. Nobody answers. Arthur does not blink."],
      ["Terry says His Supreme Fluffiness has issued a ruling.", "Reggie says the ruling is that dinner is late and everyone is guilty."] ] },
    { n: "Spyro", id: "spyro", photos: 4, title: "Associate Justice", lines: [
      ["Terry says the true king has arrived and the room should stand.", "Reggie says the king is sitting on the paperwork again."],
      ["Terry says Spyro has never lost an argument.", "Reggie says that is because Spyro has never attended one."],
      ["Terry would like it noted that the king looks magnificent today.", "Reggie would like it noted that the king looks exactly as he does every day, and invoices accordingly."] ] },
    { n: "Tilly", id: "tilly", photos: 7, title: "Associate Justice", lines: [
      ["Terry says Tilly is shy and brilliant and should be left entirely alone.", "Reggie says she has already left the room, which is a verdict in itself."],
      ["Terry says the quiet ones are the cleverest.", "Reggie says the quiet ones are the ones who knocked it off the shelf."],
      ["Terry says Tilly is a delicate flower.", "Reggie says she is a delicate flower with a very firm opinion about breakfast."] ] },
    { n: "Trixie", id: "trixie", photos: 5, title: "Associate Justice", lines: [
      ["Terry says Trixie was chosen on appearance and the panel regrets nothing.", "Reggie says the appointment process was a disgrace, and he would have done the same."],
      ["Terry says Trixie is simply the best-looking justice in the building.", "Reggie says that is a conflict of interest and he would like a recount."],
      ["Terry says Trixie has the look of a cat who knows things.", "Reggie says she knows where the treats are, and that is all anybody needs to know."] ] },
    { n: "Dexter", id: "dexter", photos: 7, title: "Associate Justice", lines: [
      ["Terry says the grey wolf has been spotted and the village is fine.", "Reggie says the village is not fine, the village is on the floor."],
      ["Terry says Dexter is majestic and misunderstood.", "Reggie says Dexter is majestic and understood perfectly, which is why the biscuits keep vanishing."],
      ["Terry says Dexter has the most fearsome silhouette on the bench.", "Reggie says he would not say boo to a goose, and the goose knows it."] ] },
    { n: "Daisy", id: "daisy", photos: 6, title: "Associate Justice", lines: [
      ["Terry says butter would not melt.", "Reggie says butter would not dare."],
      ["Terry says Daisy is an angel in a fur coat.", "Reggie says the court has learned to treat that as evidence in itself."],
      ["Terry says Daisy is sweetness itself.", "Reggie says sweetness itself has just walked across the keyboard, and the invoice has changed."] ] }
  ];
  function ukDate() { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  var p = ukDate().split("-"), day = Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  var cat = CATS[day % CATS.length];
  var photo = (Math.floor(day / CATS.length) % cat.photos) + 1;
  var line = cat.lines[Math.floor(day / CATS.length) % cat.lines.length];
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  Array.prototype.forEach.call(holes, function (h) {
    h.textContent = "";
    var fig = el("figure", "cotd");
    var img = el("img"); img.src = "cat-" + cat.id + "-" + photo + ".jpg"; img.alt = cat.n + ", " + cat.title + " of the tribunal, today's cat of the day"; img.loading = "lazy"; 
    fig.appendChild(img);
    var cap = el("figcaption");
    cap.appendChild(el("b", null, "Cat of the day: " + cat.n));
    var a = el("p"); a.appendChild(el("span", "ct", "Terry ")); a.appendChild(document.createTextNode(line[0].replace(/^Terry /, "")));
    var r = el("p"); r.appendChild(el("span", "cr", "Reggie ")); r.appendChild(document.createTextNode(line[1].replace(/^Reggie /, "")));
    cap.appendChild(a); cap.appendChild(r);
    var m = el("p", "more"); var l = el("a", null, "Meet all six cats"); l.href = "cats.html"; m.appendChild(l); cap.appendChild(m);
    fig.appendChild(cap); h.appendChild(fig);
  });
})();
