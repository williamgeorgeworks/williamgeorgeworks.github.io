/* The William George Works trailer: an original spy-thriller title sequence that turns into a tour of the
   whole site, drawn on a canvas and cut to the beat. A minute and a half, sixty-eight bars at 174 a minute.
   22 November 2026: recut for nine games, with the two new ones featured, and cinema bars on the opening.
   23 November 2026: recut with Dead Air FM leading the arcade, and no counts, so new games need no re-edit.
   Pictures: Terrance Quill. Animation and tune: Reginald Quill. No film was harmed or copied.
   The music is promo-theme.mp3, built by tools/make-trailer-music.js. Its bar numbers are the B(n) used here. */
(function () {
  "use strict";
  var cv = document.getElementById("promo");
  if (!cv || !cv.getContext) return;
  var g = cv.getContext("2d"), W = 1280, H = 720;
  var INK = "#141414", PAPER = "#f6f2e7", CARD = "#fffdf7", RED = "#d1202f", BLUE = "#22409a", TEAL = "#0f4a4a", YEL = "#ffd23f",
      NIGHT = "#130a35", PURPLE = "#5b2bff", LIME = "#b5ff3c", PINK = "#ff3d9a", CYAN = "#19e3ff";
  var DISP = "Anton,'Arial Narrow',Impact,sans-serif", HAND = "'Permanent Marker','Segoe Print','Bradley Hand',cursive", MONO = "'Courier New',Courier,monospace";
  var BEAT = 60 / 174, BAR = BEAT * 4, END = BAR * 68, MUSIC = "promo-theme.mp3?v=20261119a";
  function B(n, beat) { return (n - 1) * BAR + ((beat || 1) - 1) * BEAT; }     // the time of bar n, beat b
  var calm = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);   // no shaking or flashing for those who have asked
  var playing = false, shown = END - 0.01;

  /* ---------- pictures: only the poster's picture loads with the page, the rest when Play is pressed ---------- */
  var pics = {}, waiting = {}, FILES = {
    cast: "portraits-collage.jpg", arthur: "promo-arthur.webp", judge: "promo-judge.jpg", sign: "accord-signatories.jpg",
    comic: "comic/issues/2026-11/art/arthur.jpg", music: "og-music.jpg", m1: "merch-the-court-is-in-session.jpg", m2: "merch-william-george-works.jpg",
    c1: "cover-great-british-disagreement.jpg", c2: "cover-last-of-the-unemployable.jpg", c3: "cover-man-who-wanted-to-sue-god.jpg",
    c4: "cover-lancashire-ghost-stories.jpg", c5: "cover-haunted-lancashire.jpg", c6: "cover-small-stove-cookbook.jpg",
    g1: "thumb-grand-theft-kitty.jpg", g2: "thumb-red-light-green-light.jpg", g3: "thumb-arthurs-tribunal.jpg", g4: "thumb-ferrets-ditch.jpg",
    g5: "thumb-moulding-museum.jpg", g6: "thumb-unemployable-arcade.jpg", g7: "thumb-lion-and-albert.jpg", g8: "thumb-kitty-grand-prix.jpg", g9: "thumb-slay-the-pier.jpg", g10: "games/dead-air-fm/arcade.webp"
  };
  var CAST = ["ferret", "jo", "terry", "reggie", "arthur", "spyro", "tilly", "trixie", "dexter", "daisy"];   // the order they stand in the collage
  CAST.forEach(function (n) { FILES["p_" + n] = "portraits/" + n + ".jpg"; });
  function fetchPic(k, done) {
    if (pics[k] || waiting[k] === false) { if (done) done(); return; }
    if (waiting[k]) { if (done) waiting[k].push(done); return; }
    waiting[k] = done ? [done] : [];
    var im = new Image(), fin = function (ok) { var q = waiting[k]; waiting[k] = false; if (ok) pics[k] = im; if (!playing) draw(shown); q.forEach(function (f) { f(); }); };
    im.onload = function () { fin(true); }; im.onerror = function () { fin(false); }; im.src = FILES[k];
  }
  function fetchAll(done, tick) { var ks = Object.keys(FILES), left = ks.length; ks.forEach(function (k) { fetchPic(k, function () { left--; if (tick) tick(1 - left / ks.length); if (!left && done) done(); }); }); }
  fetchPic("cast");

  /* ---------- small helpers ---------- */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function back(x) { x = clamp(x); var c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function glide(x) { x = clamp(x); var c = 0.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }   // like back, with less overshoot
  function span(t, a, b) { return clamp((t - a) / (b - a)); }
  function fill(col) { g.fillStyle = col; g.fillRect(0, 0, W, H); }

  var blots = {};
  function blotShape(seed) {
    if (blots[seed]) return blots[seed];
    var R = rng(seed), n = 44, pts = [], sats = [], i;
    for (i = 0; i < n; i++) { var rad = 0.62 + 0.3 * R(); if (R() < 0.17) rad *= 1.5 + 1.4 * R(); pts.push(rad); }
    for (i = 0; i < 10; i++) sats.push([R() * 6.283, 1.5 + 1.7 * R(), 0.03 + 0.09 * R()]);
    return (blots[seed] = { pts: pts, sats: sats });
  }
  function blot(x, y, r, seed, col, p) {
    p = back(p); if (p <= 0) return;
    var s = blotShape(seed), n = s.pts.length, i, a, q, rr = r * p;
    g.fillStyle = col; g.beginPath();
    for (i = 0; i <= n; i++) {
      a = 6.283 * (i % n) / n; q = s.pts[i % n] * rr;
      var a2 = 6.283 * ((i + 1) % n) / n, q2 = s.pts[(i + 1) % n] * rr;
      var px = x + Math.cos(a) * q, py = y + Math.sin(a) * q, mx = (px + x + Math.cos(a2) * q2) / 2, my = (py + y + Math.sin(a2) * q2) / 2;
      if (i === 0) g.moveTo(mx, my); else g.quadraticCurveTo(px, py, mx, my);
    }
    g.fill();
    for (i = 0; i < s.sats.length; i++) { g.beginPath(); g.arc(x + Math.cos(s.sats[i][0]) * s.sats[i][1] * rr, y + Math.sin(s.sats[i][0]) * s.sats[i][1] * rr, s.sats[i][2] * rr, 0, 6.283); g.fill(); }
  }
  function text(str, x, y, size, col, font, align, track, maxW) {
    align = align || "center"; font = font || DISP; var pre = "";
    if (font.indexOf("bold ") === 0) { pre = "bold "; font = font.slice(5); }
    var lim = (maxW ? maxW : (align === "center" ? W - 90 : W - x - 50));
    g.font = pre + size + "px " + font; var wide = g.measureText(str).width + (track || 0) * str.length, k = wide > lim ? lim / wide : 1;
    size *= k; g.font = pre + size + "px " + font; g.fillStyle = col; g.textAlign = align; g.textBaseline = "alphabetic";
    if (track && g.letterSpacing !== undefined) g.letterSpacing = (track * k) + "px";
    g.fillText(str, x, y);
    if (g.letterSpacing !== undefined) g.letterSpacing = "0px";
    return size;
  }
  function slam(str, x, y, size, col, t, at, rot, maxW) {      // a word that lands with a thump
    var p = span(t, at, at + 0.2); if (p <= 0) return;
    var k = 1 + (1 - ease(p)) * 1.4;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(k, k); g.globalAlpha = clamp(p * 2.5);
    text(str, 0, 0, size, col, DISP, "center", 0, maxW || (W - 110)); g.restore(); g.globalAlpha = 1;
  }
  function typed(str, x, y, size, col, t, at, rate, align, maxW) {   // typewriter lettering
    var n = Math.floor((t - at) * (rate || 26)); if (n <= 0) return;
    var f = "bold " + size + "px " + MONO; g.font = f; var full = g.measureText(str).width, lim = maxW || (align === "center" ? W - 120 : W - x - 60);
    if (full > lim) { size = size * lim / full; f = "bold " + size + "px " + MONO; g.font = f; full = g.measureText(str).width; }
    g.fillStyle = col; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(str.slice(0, n), align === "center" ? x - full / 2 : x, y);
  }
  function hand(str, x, y, size, col, p, rot, maxW) {          // marker-pen scrawl, fading in
    if (p <= 0) return; g.save(); g.globalAlpha = clamp(p); g.translate(x, y + (1 - ease(p)) * 14); g.rotate(rot == null ? -0.02 : rot);
    text(str, 0, 0, size, col, HAND, "center", 0, maxW || 1100); g.restore(); g.globalAlpha = 1;
  }
  function cover(im, box) {                                // draw a picture filling a box
    if (!im) return; var s = Math.max(box[2] / im.width, box[3] / im.height);
    g.drawImage(im, box[0] + (box[2] - im.width * s) / 2, box[1] + (box[3] - im.height * s) / 2, im.width * s, im.height * s);
  }
  function card(k, cx, cy, w, h, rot, o) {                  // a picture with an ink border and a hard shadow
    o = o || {}; var sh = o.sh == null ? 11 : o.sh, im = pics[k];
    g.save(); g.translate(cx, cy); g.rotate(rot || 0);
    if (sh) { g.fillStyle = o.shadow || INK; g.fillRect(-w / 2 + sh, -h / 2 + sh, w, h); }
    g.fillStyle = CARD; g.fillRect(-w / 2, -h / 2, w, h);
    if (im) { g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); if (o.zoom) g.scale(o.zoom, o.zoom); if (o.src) g.drawImage(im, o.src[0], o.src[1], o.src[2], o.src[3], -w / 2, -h / 2, w, h); else cover(im, [-w / 2, -h / 2, w, h]); g.restore(); }
    g.strokeStyle = o.line || INK; g.lineWidth = o.lw || 5; g.strokeRect(-w / 2, -h / 2, w, h); g.restore();
  }
  function stamp(str, x, y, t, at, col, size, rot, backing) {
    var p = span(t, at, at + 0.16); if (p <= 0) return; size = size || 34;
    g.save(); g.translate(x, y); g.rotate(rot == null ? -0.14 : rot); var k = 1 + (1 - ease(p)) * 1.2; g.scale(k, k); g.globalAlpha = 0.92 * clamp(p * 3);
    g.font = size + "px " + DISP; var w = Math.min(g.measureText(str).width, 560) + size, hh = size * 1.55;
    if (backing) { g.fillStyle = backing; g.fillRect(-w / 2, -hh * 0.62, w, hh); }
    g.strokeStyle = col; g.lineWidth = Math.max(4, size / 7); g.strokeRect(-w / 2, -hh * 0.62, w, hh); text(str, 0, size * 0.3, size, col, DISP, "center", 0, 560);
    g.restore(); g.globalAlpha = 1;
  }
  function label(str, x, y, size, bg, fg, rot, p, maxW) {       // lettering on a solid strip
    if (p <= 0) return; g.save(); g.translate(x, y); g.rotate(rot || 0); var k = 1 + (1 - ease(p)) * 0.5; g.scale(k, k); g.globalAlpha = clamp(p * 2);
    g.font = size + "px " + DISP; var w0 = g.measureText(str).width, lim = maxW || 1000, s = w0 > lim ? size * lim / w0 : size, w = Math.min(w0, lim) + s * 0.7;
    g.fillStyle = bg; g.fillRect(-w / 2, -s * 0.95, w, s * 1.3); text(str, 0, 0, s, fg, DISP, "center", 0, lim); g.restore(); g.globalAlpha = 1;
  }
  function rays(cx, cy, col, alpha, rot, n) {                  // a comic-book sunburst
    g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.fillStyle = col; g.globalAlpha = alpha; n = n || 14; var a = Math.PI / n, r = 1800, hw = r * Math.tan(a / 2);
    for (var i = 0; i < n; i++) { g.rotate(2 * a); g.beginPath(); g.moveTo(0, 0); g.lineTo(r, -hw); g.lineTo(r, hw); g.fill(); }
    g.restore(); g.globalAlpha = 1;
  }
  var pats = {};
  function pattern(name, make, size, scale) {
    if (pats[name]) return pats[name];
    var c = document.createElement("canvas"); c.width = c.height = size; make(c.getContext("2d"), size);
    var p = g.createPattern(c, "repeat"); try { if (scale && p.setTransform) p.setTransform(new DOMMatrix().scale(scale)); } catch (e) {}
    return (pats[name] = p);
  }
  function dots(x, y, w, h, col, alpha) {                     // halftone dots
    var p = pattern("dots" + col, function (q, s) { q.fillStyle = col; q.beginPath(); q.arc(s / 4, s / 4, s * 0.11, 0, 6.3); q.fill(); q.beginPath(); q.arc(s * 0.75, s * 0.75, s * 0.11, 0, 6.3); q.fill(); }, 96, 0.25);
    g.save(); g.globalAlpha = alpha; g.fillStyle = p; g.fillRect(x, y, w, h); g.restore();
  }
  function grain() {                                           // a little paper tooth over everything
    var p = pattern("grain", function (q, s) { var R = rng(99), d = q.createImageData(s, s), i; for (i = 0; i < d.data.length; i += 4) { var v = R() < 0.5 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = R() * 34; } q.putImageData(d, 0, 0); }, 256, 0.5);
    g.save(); g.globalAlpha = 0.5; g.fillStyle = p; g.fillRect(0, 0, W, H); g.restore();
  }
  function shade(y0, y1, a) { var v = g.createLinearGradient(0, y0, 0, y1); v.addColorStop(0, "rgba(20,20,20,0)"); v.addColorStop(1, "rgba(20,20,20," + a + ")"); g.fillStyle = v; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); }

  /* ---------- a picture one side, words the other: used for the cast, the cats, the books and the notices ---------- */
  function spread(lt, o) {
    var q = o.quick ? 0.55 : 1, L = !o.flip, pw = o.pw || 480, ph = o.ph || 480, px = L ? 338 : 942, tx = L ? 928 : 352, acc = o.acc || RED, fg = o.fg || INK, i;
    fill(o.bg || PAPER);
    g.save(); g.beginPath();                                   // a slab of colour behind the picture
    if (L) { g.moveTo(0, 0); g.lineTo(620, 0); g.lineTo(520, H); g.lineTo(0, H); } else { g.moveTo(W, 0); g.lineTo(660, 0); g.lineTo(760, H); g.lineTo(W, H); }
    g.closePath(); g.fillStyle = acc; g.fill(); g.clip(); dots(0, 0, W, H, acc === INK ? "#f6f2e7" : "#141414", acc === INK ? 0.12 : 0.16); g.restore();
    var p = glide(lt / (0.24 * q)), cx = px + (o.rise ? 0 : (L ? -1 : 1) * (1 - p) * 720), cy = 368 + (o.rise ? (1 - p) * 640 : 0), rot = (L ? -0.045 : 0.045) * p;
    if (o.prop) { g.save(); g.translate(cx, cy); g.rotate(rot); o.prop(lt); g.restore(); }
    else card(o.key, cx, cy, pw, ph, rot, { shadow: acc === INK ? RED : INK, src: o.src });
    if (o.file) typed(o.file, tx, 136, 23, o.tc || fg, lt, 0.04, 70, "center", 560);
    var head = o.head, hs = o.hs || 190, hy = o.hy || (head.length > 1 ? 290 : 340), gap = o.gap || hs * 1.02;
    for (i = 0; i < head.length; i++) slam(head[i], tx, hy + i * gap, hs, (o.hc && o.hc[i]) || fg, lt, (0.03 + i * 0.1) * q, 0, 580);
    var qy = o.qy || (hy + (head.length - 1) * gap + 78);
    if (o.sub) { typed(o.sub, tx, qy - 14, 24, o.tc || fg, lt, 0.22 * q, 60, "center", 580); qy += 44; }
    if (o.quip) for (i = 0; i < o.quip.length; i++) hand(o.quip[i], tx, qy + i * 48, o.qs || 38, o.qc || BLUE, span(lt, (0.28 + i * 0.12) * q, (0.46 + i * 0.12) * q), -0.02, 580);
    if (o.stamp) stamp(o.stamp, tx, o.sy || 622, lt, 0.58 * q, o.sc || RED, 44);
  }

  /* ---------- the film: each scene draws itself from lt, the time since its own cut ---------- */
  var STARS = (function () { var R = rng(7), a = [], i; for (i = 0; i < 70; i++) a.push([R() * W, R() * 420, 0.6 + R() * 1.6, R() * 6.3]); return a; })();
  function night(lt, dur, t) {                                // 1. night. searchlights. a cat.
    fill(INK); var i, found = ease(span(t, B(5), B(5) + 1.3));
    for (i = 0; i < STARS.length; i++) { g.globalAlpha = (0.35 + 0.3 * Math.sin(t * 2.2 + STARS[i][3])) * (1 - found * 0.7); g.fillStyle = PAPER; g.fillRect(STARS[i][0], STARS[i][1], STARS[i][2], STARS[i][2]); }
    g.globalAlpha = 1;
    var beams = [[210, -40, 0.9, 0.55, 0.0], [1070, -40, 0.75, -0.5, 1.7]];
    g.save(); g.globalCompositeOperation = "lighter";
    beams.forEach(function (b) {
      var sw = Math.sin(t * b[2] + b[4]) * 0.5 * (1 - found), ang = Math.atan2(430 + 40, 640 - b[0]) * found + (Math.PI / 2 - b[3] + sw) * (1 - found);
      g.save(); g.translate(b[0], b[1]); g.rotate(ang - Math.PI / 2);
      var gr = g.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, "rgba(246,242,231,0.34)"); gr.addColorStop(1, "rgba(246,242,231,0)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(-8, 0); g.lineTo(-150, 900); g.lineTo(150, 900); g.lineTo(8, 0); g.fill(); g.restore();
    });
    g.restore();
    if (pics.arthur && found > 0) {
      g.save(); g.globalAlpha = found; var z = 1 + 0.06 * span(t, B(5), B(9)), aw = 620 * z, ah = aw * pics.arthur.height / pics.arthur.width;
      var gl = g.createRadialGradient(640, 400, 40, 640, 400, 430); gl.addColorStop(0, "rgba(246,242,231,0.95)"); gl.addColorStop(1, "rgba(246,242,231,0)");
      g.fillStyle = gl; g.fillRect(0, 0, W, H); g.drawImage(pics.arthur, 640 - aw / 2, 392 - ah / 2, aw, ah); g.restore();
    }
    if (t < B(5)) { typed("SOMEWHERE IN LANCASHIRE", 70, 580, 32, PAPER, t, 0.4, 22); typed("NIGHT. PROBABLY A TUESDAY.", 70, 628, 32, PAPER, t, B(3), 24); }
    else { g.fillStyle = "rgba(20,20,20,0.8)"; g.fillRect(0, 532, W, 188); typed("A CAT IS ASLEEP ON THE EVIDENCE.", 70, 588, 34, PAPER, t, B(5) + 0.7, 26); typed("HE WILL NOT BE RUSHED.", 70, 638, 34, YEL, t, B(7), 24); }
    var p = span(t, B(9) - 0.1, B(9)); if (p > 0) { g.fillStyle = "rgba(246,242,231," + p + ")"; g.fillRect(0, 0, W, H); }
  }
  function cards(lt, dur, t) {                                 // 2. one human, a few machines, six cats
    fill(PAPER);
    blot(1185, 105, 100, 7, INK, span(t, B(9), B(9) + 0.3)); blot(95, 640, 85, 21, RED, span(t, B(10), B(10) + 0.3)); blot(1200, 650, 62, 33, BLUE, span(t, B(11), B(11) + 0.3));
    text("WILLIAM GEORGE WORKS PRESENTS", 560, 96, 30, INK, DISP, "center", 4, 820);
    slam("ONE HUMAN.", 640, 280, 150, INK, t, B(9), 0, 900); slam("A FEW MACHINES.", 640, 430, 150, RED, t, B(10), 0, 900); slam("SIX CATS.", 640, 580, 150, INK, t, B(11), 0, 900);
    hand("and not one of them in charge", 640, 668, 40, BLUE, span(t, B(12), B(12) + 0.25), -0.02, 800);
    var p = span(t, B(12, 3), B(12, 3) + 0.12); if (p > 0) { g.save(); g.translate(1066, 552); g.rotate(0.1 + (calm ? 0 : 0.03 * Math.sin(t * 40))); label("MIAOW.", 0, 0, 62, INK, PAPER, 0, p, 300); g.restore(); }
  }
  var PEOPLE = [
    { key: "p_ferret", acc: RED, file: "FILE 01 · THE HUMAN", head: ["THE FERRET"], quip: ["starts new projects at a rate", "that alarms everybody"], stamp: "CANNOT BE STOPPED" },
    { key: "p_terry", acc: BLUE, flip: 1, file: "FILE 02 · THE MACHINE", head: ["TERRY"], quip: ["draws the lot. Purveyor of", "industrial-grade bollocks"], stamp: "ON THE COVER" },
    { key: "p_reggie", acc: INK, file: "FILE 03 · THE COUSIN", head: ["REGGIE"], quip: ["built this. Cannot draw", "to save his life"], stamp: "INVOICE ENCLOSED" },
    { key: "p_jo", acc: RED, flip: 1, file: "FILE 04 · THE CHAIRPERSON", head: ["JO"], hs: 230, quip: ["the champion.", "It says so on the mug"], stamp: "ACTUALLY IN CHARGE" }
  ];
  var BENCH = [
    { key: "p_arthur", acc: RED, file: "THE BENCH · CHIEF JUSTICE", head: ["ARTHUR"], quip: ["his signature", "is still withheld"], stamp: "ASLEEP" },
    { key: "p_spyro", acc: BLUE, flip: 1, quick: 1, head: ["SPYRO"], quip: ["the true king. Allegedly"] },
    { key: "p_tilly", acc: INK, quick: 1, head: ["TILLY"], quip: ["will rip your face off"] },
    { key: "p_trixie", acc: RED, flip: 1, quick: 1, head: ["TRIXIE"], quip: ["has annexed the sofa"] },
    { key: "p_dexter", acc: BLUE, quick: 1, head: ["DEXTER"], quip: ["would not say boo to a goose"] },
    { key: "p_daisy", acc: INK, flip: 1, quick: 1, head: ["DAISY"], quip: ["butter would not melt"] }
  ];
  function bench(lt) {                                          // all six, for the half-second they will sit still
    fill(PAPER); rays(640, 330, RED, 0.1, lt * 0.3, 16);
    for (var i = 0; i < 6; i++) { var p = back((lt - i * 0.035) / 0.16); if (p > 0) card("p_" + CAST[4 + i], 115 + i * 210, 300 + (1 - p) * 500, 196, 196, (i % 2 ? 0.03 : -0.03) * p, { sh: 7, lw: 4 }); }
    slam("SIX CATS SIT IN JUDGMENT.", 640, 560, 104, INK, lt, 0.06, 0, 1150); stamp("FINDINGS ADVISORY", 640, 648, lt, 0.3, RED, 40, -0.04);
  }
  var BOOKS = [
    { key: "c1", acc: BLUE, head: ["MILK FIRST", "OR LAST?"], quip: ["every side gets a fair hearing.", "Then every side gets laughed at"] },
    { key: "c2", acc: YEL, flip: 1, head: ["AN ENTIRELY AVOIDABLE", "LANCASHIRE CATASTROPHE"], quip: ["one museum, one leaking roof,", "no cathedral"] },
    { key: "c3", acc: RED, head: ["FIFTY-ONE YEARS", "OF GRIEVANCES"], quip: ["his wife would like", "the bins put out first"] },
    { key: "c4", acc: BLUE, flip: 1, head: ["THE HOUND", "WITHOUT A HEAD"], quip: ["twenty-five tales", "for after dark"] },
    { key: "c5", acc: YEL, head: ["A BOGGART", "IN THE LUGGAGE"], quip: ["eighteen places.", "Some stories refuse to leave"] },
    { key: "c6", acc: RED, flip: 1, head: ["A SMALL STOVE.", "A BIG APPETITE."], quip: ["twenty-four recipes", "for dawn by the water"] }
  ];
  function book(i) { return function (lt) { var b = BOOKS[i]; spread(lt, { key: b.key, acc: b.acc, flip: b.flip, rise: 1, pw: 310, ph: 465, file: "THE FILES · BOOK " + (i + 1) + " OF 6", head: b.head, hs: 92, hy: 262, gap: 100, quip: b.quip, qs: 34, stamp: "OUT NOW", sy: 628 }); }; }
  function shelf(lt, dur, t) {                                 // six books in a row
    fill(PAPER); blot(90, 96, 78, 52, BLUE, span(lt, 0, 0.3)); blot(1200, 92, 78, 88, RED, span(lt, 0.15, 0.45));
    text("THE FILES", 640, 92, 60, INK, DISP, "center", 3);
    for (var i = 0; i < 6; i++) { var p = ease((lt - i * 0.05) / 0.3); if (p > 0) card("c" + (i + 1), 140 + i * 200, 300 + (1 - p) * 520, 172, 258, [-0.05, 0.035, -0.025, 0.05, -0.035, 0.03][i] * p, { sh: 8, lw: 4 }); }
    slam("THE BOOKS. OUT NOW.", 640, 572, 120, INK, lt, 0.28, 0, 1100);
    hand("written with AI. We say so on the cover.", 640, 640, 36, BLUE, span(t, B(28), B(28) + 0.25), -0.012, 1100);
    stamp("FREE TO READ IN KINDLE UNLIMITED", 640, 690, t, B(28, 3), RED, 30, -0.02);
  }
  function accord(lt, dur, t) {                                // 3. the paperwork
    fill(INK); rays(640, 360, PAPER, 0.035, lt * 0.05, 18);
    var z = 1 + 0.05 * lt / dur, p = ease(lt / 0.5);
    g.save(); g.translate(640, 360 + (1 - p) * 700); g.scale(z, z); g.rotate(-0.012);
    g.fillStyle = RED; g.fillRect(-520 + 12, -292 + 12, 1040, 584); g.fillStyle = PAPER; g.fillRect(-520, -292, 1040, 584); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(-502, -274, 1004, 548);
    text("THE FERRET–QUILL ACCORD", 0, -182, 82, INK, DISP, "center", 2, 940); g.fillStyle = RED; g.fillRect(-300, -160, 600, 6);
    if (pics.sign) { g.drawImage(pics.sign, -420, -128, 840, 210); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(-420, -128, 840, 210); }
    typed("A PARTNERSHIP AGREEMENT OF DUBIOUS LEGAL STANDING", 0, 134, 24, INK, t, B(30), 46, "center", 940);
    typed("AND CONSIDERABLE EMOTIONAL SIGNIFICANCE.", 0, 170, 24, INK, t, B(30, 3.5), 46, "center", 940);
    stamp("NOT LEGALLY BINDING", 200, 10, t, B(31, 3), RED, 58, -0.16, "rgba(246,242,231,.9)");
    hand("taken very seriously", 0, 240, 46, BLUE, span(t, B(32), B(32) + 0.25), -0.03, 800);
    g.restore();
    typed("ARTICLE VI: THE MACHINES MAY INVOICE. IN COMPLIMENTS.", 640, 700, 18, "rgba(246,242,231,.75)", t, B(32), 60, "center", 1100);
  }
  function word(str, bg, fg, n, wild) {                         // the four founding principles, one a bar
    return function (lt, dur, t) {
      fill(bg); rays(640, 400, fg, 0.07, lt * 0.4 + n, 12);
      typed("THE FOUNDING PRINCIPLES · " + n + " OF 4", 640, 96, 24, fg, lt, 0.03, 70, "center");
      if (!wild) { slam(str, 640, 500, 300, fg, lt, 0, 0, 1140); return; }
      var k = 0.8 + 0.3 * ease(lt / dur), R = rng(Math.floor(t * 14)), cols = [PAPER, YEL, PAPER, INK, PAPER, YEL, PAPER, INK], x = 0, i, ws = [];
      g.save(); g.translate(640, 470); g.scale(k, k); g.rotate(calm ? 0 : 0.03 * Math.sin(t * 9)); g.font = "270px " + DISP;
      for (i = 0; i < str.length; i++) { ws.push(g.measureText(str[i]).width + 14); x += ws[i]; }
      var s = Math.min(1, 1120 / x), cx = -x / 2; g.scale(s, s);
      for (i = 0; i < str.length; i++) { g.save(); g.translate(cx + ws[i] / 2, (calm ? 0 : (R() - 0.5) * 40) + 90); g.rotate(calm ? 0 : (R() - 0.5) * 0.26); g.fillStyle = cols[i % 8]; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(str[i], 0, 0); g.restore(); cx += ws[i]; }
      g.restore();
      blot(1170, 630, 64 * ease(lt / dur), 61, INK, 1); blot(1150, 120, 56 * ease(lt / dur), 62, YEL, 1);
      hand("(the important one)", 640, 668, 40, PAPER, span(lt, 0.45, 0.65), -0.02, 700);
    };
  }
  var GAMES = [["g1", "GRAND THEFT KITTY", "you do not have to be a RockStar"], ["g2", "REGGIE’S RED LIGHT, GREEN LIGHT", "move, and it’s a wet fish"], ["g3", "ARTHUR’S TRIBUNAL", "catch the cream, dodge the teabags"],
    ["g4", "FERRET’S DITCH", "not a bite. Great morning."], ["g5", "THE MOULDING MUSEUM ADVENTURE", "no money, no cathedral"], ["g6", "THE UNEMPLOYABLE ARCADE", "a fruit machine nobody will discuss"], ["g7", "THE LION AND ALBERT ADVENTURE", "Mother will remember your choices"]];
  function nightSky(lt) { var v = g.createLinearGradient(0, 0, W, H); v.addColorStop(0, NIGHT); v.addColorStop(0.62, "#2a0f6b"); v.addColorStop(1, PURPLE); g.fillStyle = v; g.fillRect(0, 0, W, H); dots(0, 0, W, H, LIME, 0.06); }
  function glow(str, x, y, size, t, at, maxW) { slam(str, x + 6, y + 6, size, PINK, t, at, 0, maxW); slam(str, x, y, size, LIME, t, at, 0, maxW); }
  function gridFloor(t) {                                       // a neon floor, rushing at you in time with the drums
    var hz = 452, i, ph = calm ? 0 : (t / BEAT) % 1;
    g.save(); g.strokeStyle = PINK; g.lineWidth = 2; g.globalAlpha = 0.3; g.beginPath();
    for (i = -14; i <= 14; i++) { g.moveTo(640 + i * 26, hz); g.lineTo(640 + i * 210, H); }
    for (i = 0; i < 9; i++) { var q = (i + ph) / 9, y = hz + (H - hz) * q * q; g.moveTo(0, y); g.lineTo(W, y); }
    g.stroke(); g.globalAlpha = 0.5; g.fillStyle = PINK; g.fillRect(0, hz - 1, W, 2); g.restore(); g.globalAlpha = 1;
  }
  function newBurst(x, y, lt, at) {                             // NEW!, in a star, like a soap powder
    var p = back((lt - at) / 0.14); if (p <= 0) return; var i, spin = calm ? 0 : lt * 0.5, k = p * (1 + (calm ? 0 : 0.06 * Math.sin(lt * 18)));
    g.save(); g.translate(x, y); g.scale(k, k); g.save(); g.rotate(spin); g.fillStyle = YEL; g.strokeStyle = INK; g.lineWidth = 6; g.lineJoin = "round"; g.beginPath();
    for (i = 0; i < 24; i++) { var a = i / 24 * 6.283, r = i % 2 ? 78 : 104; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fill(); g.stroke(); g.restore(); g.rotate(-0.14); text("NEW", 0, 26, 72, RED, DISP, "center", 0, 150); g.restore();
  }
  function arcadeHead(n) { text("THE ARCADE", 60, 66, 40, LIME, DISP, "left"); text("FREE TO PLAY", W - 60, 66, 40, PINK, DISP, "right", 0, 400); }
  function arcade(lt) {                                         // 4. the arcade: the screens light up, then the sign
    nightSky(lt); var i, order = [4, 0, 7, 2, 8, 5, 1, 6, 3], tilt = [-0.02, 0.015, -0.01, 0.02, -0.015, 0.012, -0.012, 0.018, -0.02];
    for (i = 0; i < 9; i++) { var q = back((lt - 0.02 - order[i] * 0.03) / 0.14); if (q > 0) card("g" + (i + 1), 216 + (i % 3) * 424, 124 + Math.floor(i / 3) * 236, 400 * q, 222 * q, tilt[i], { shadow: PINK, line: LIME, lw: 4, sh: 8 }); }
    g.fillStyle = "rgba(19,10,53,.6)"; g.fillRect(0, 0, W, H); rays(640, 360, PURPLE, 0.22, lt * 0.5, 14);
    glow("THE ARCADE", 640, 380, 250, lt, 0, 1100); var p = span(lt, 0.1, 0.22); if (p > 0) { g.globalAlpha = p; text("FREE GAMES. NO SIGN-UP.", 640, 476, 46, "#e9e4ff", DISP, "center", 3, 1000); g.globalAlpha = 1; }
  }
  var KARTS = [[RED, "#f3e9d8", "#8a8c99"], ["#e9a400", "#ffffff", "#d98a3a"], ["#8a5aa8", "#e4dccf", "#b9b2a8"], ["#3d9a52", "#6a564b", "#3f322c"], [BLUE, "#3c3c44", "#9a9aa3"], ["#e8799a", "#f8ecd9", "#ffffff"]];   // kart, fur, face
  function kart(x, y, K, t) {                                   // a cat in a kart, from the side, in a hurry
    var wob = calm ? 0 : Math.sin(t * 40 + x * 0.01) * 2, spin = calm ? 0.6 : t * 30, i;
    g.save(); g.translate(x, y + wob); g.scale(1.3, 1.3); g.lineJoin = "round"; g.lineCap = "round";
    g.strokeStyle = "rgba(233,228,255,.75)"; g.lineWidth = 4; g.beginPath(); for (i = 0; i < 3; i++) { g.moveTo(-78 - i * 12, -40 + i * 16); g.lineTo(-150 - i * 30, -40 + i * 16); } g.stroke();
    g.strokeStyle = INK; g.lineWidth = 3;
    g.fillStyle = K[0]; g.beginPath(); g.moveTo(-8, -52); g.lineTo(-60, -68 + wob * 2); g.lineTo(-56, -52 + wob * 2); g.lineTo(-8, -42); g.closePath(); g.fill(); g.stroke();   // the scarf
    g.beginPath(); g.moveTo(-56, -30); g.lineTo(34, -30); g.lineTo(62, -14); g.lineTo(62, -6); g.lineTo(-56, -6); g.closePath(); g.fill(); g.stroke();                          // the kart
    g.fillStyle = PAPER; g.fillRect(-64, -44, 10, 30); g.strokeRect(-64, -44, 10, 30); g.fillRect(-74, -50, 28, 8); g.strokeRect(-74, -50, 28, 8);
    g.fillStyle = K[1]; g.beginPath(); g.moveTo(-13, -70); g.lineTo(-9, -94); g.lineTo(3, -78); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(8, -78); g.lineTo(19, -94); g.lineTo(23, -70); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(5, -58, 22, 0, 6.3); g.fill(); g.stroke();                                                                                                                 // the driver
    g.fillStyle = K[2]; g.beginPath(); g.arc(14, -50, 9, 0, 6.3); g.fill();
    g.fillStyle = K[0]; g.fillRect(-17, -69, 44, 9); g.strokeRect(-17, -69, 44, 9);                                                                                                 // goggles
    g.fillStyle = PAPER; g.beginPath(); g.arc(16, -63, 8, 0, 6.3); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(18, -63, 3, 0, 6.3); g.fill();
    [-36, 38].forEach(function (wx) { g.fillStyle = "#2c2c33"; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(wx, -4, 15, 0, 6.3); g.fill(); g.stroke(); g.strokeStyle = PAPER; g.lineWidth = 2.5; g.beginPath(); g.moveTo(wx + Math.cos(spin) * 9, -4 + Math.sin(spin) * 9); g.lineTo(wx - Math.cos(spin) * 9, -4 - Math.sin(spin) * 9); g.stroke(); });
    g.restore();
  }
  function featRadio(lt, dur, t) {                              // newest: Dead Air FM, on air
    var p = glide(lt / 0.16), i;
    nightSky(lt); gridFloor(t); arcadeHead(1);
    for (i = 0; i < 4; i++) {                                   // the broadcast, rippling out over the booth
      var r = ((calm ? 0.5 : lt * 0.9) + i / 4) % 1;
      g.save(); g.globalAlpha = (1 - r) * 0.8 * span(lt, 0.05, 0.2); g.strokeStyle = i % 2 ? CYAN : LIME; g.lineWidth = 6;
      g.beginPath(); g.arc(640, 292, 240 + r * 420, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.restore();
    }
    card("g10", 640, 292 + (1 - p) * 520, 640, 400, -0.012 * p, { shadow: PINK, line: LIME, lw: 6, sh: 12, zoom: 1 + 0.07 * lt / dur });
    newBurst(1016, 178, lt, 0.1);
    label("DEAD AIR FM", 640, 634, 56, LIME, NIGHT, -0.015, span(lt, 0.08, 0.22), 1000); hand("pirate-radio pinball. Arthur has the bass fader", 640, 698, 36, CYAN, span(lt, 0.2, 0.36), -0.012, 1100);
  }
  function featKart(lt, dur, t) {                               // The Kitty Grand Prix, with the field going past
    var p = glide(lt / 0.16), i, off = (lt * 900) % 96;
    nightSky(lt); gridFloor(t); arcadeHead(2);
    card("g8", 640 - (1 - p) * 900, 292, 640, 400, 0.016 * p, { shadow: PINK, line: LIME, lw: 6, sh: 12, zoom: 1 + 0.07 * lt / dur });
    for (i = -2; i < 30; i++) { g.fillStyle = i % 2 ? PAPER : INK; g.fillRect(i * 48 - off, 566, 48, 12); }
    for (i = 0; i < 6; i++) { var x = -140 + (lt - 0.08) * 1750 - i * 220; if (x > -260 && x < W + 300) kart(x, 564, KARTS[i], t); }
    label("THE KITTY GRAND PRIX", 640, 634, 56, LIME, NIGHT, -0.015, span(lt, 0.08, 0.22), 1000); hand("six cats, six karts, nobody has read the rules", 640, 698, 36, CYAN, span(lt, 0.2, 0.36), -0.012, 1100);
  }
  var DEALT = [["#e3182d", "1", "RED PEN", "", "#ffb53d"], ["#2456e6", "1", "POLITE", "COUGH", "#5fd9e6"], ["#7a3ff0", "1", "THEATRICAL", "OUTRAGE", "#ff7ab8"], ["#e3182d", "1", "ROYAL", "DECREE", "#ffb53d"], ["#2456e6", "0", "WHO INVITED", "HIM?", "#5fd9e6"]];
  function playingCard(c) {                                     // one card from the deck, 104 by 142: a coloured band for its kind, a picture, a gold coin for its cost
    var i, a, d;
    g.fillStyle = INK; g.fillRect(-46, -65, 104, 142); g.fillStyle = CARD; g.fillRect(-52, -71, 104, 142);
    g.fillStyle = c[0]; g.fillRect(-52, -71, 104, 38); g.fillStyle = c[4]; g.fillRect(-52, -33, 104, 34);
    g.fillStyle = INK; g.fillRect(-52, -35, 104, 3); g.fillRect(-52, 0, 104, 3);
    g.beginPath(); for (i = 0; i < 16; i++) { a = -1.5708 + i * 0.3927; d = i % 2 ? 6.5 : 14; g.lineTo(Math.cos(a) * d, -16 + Math.sin(a) * d); } g.closePath(); g.fillStyle = "#fff"; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = "rgba(20,20,20,.28)"; g.fillRect(-40, 16, 80, 5); g.fillRect(-40, 28, 80, 5); g.fillRect(-40, 40, 52, 5);
    g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(-52, -71, 104, 142);
    text(c[2], 8, c[3] ? -53 : -45, 15, "#fff", DISP, "center", 0, 74); if (c[3]) text(c[3], 8, -39, 15, "#fff", DISP, "center", 0, 74);
    g.beginPath(); g.arc(-44, -63, 16, 0, 6.3); g.fillStyle = "#ffc61a"; g.fill(); g.strokeStyle = INK; g.lineWidth = 3.5; g.stroke(); text(c[1], -44, -54, 24, INK, DISP, "center", 0, 28);
  }
  function featPier(lt, dur, t) {                               // Seen Off, with a hand dealt
    var p = glide(lt / 0.16), i;
    nightSky(lt); gridFloor(t); arcadeHead(3);
    card("g9", 640 + (1 - p) * 900, 292, 640, 400, -0.016 * p, { shadow: PINK, line: LIME, lw: 6, sh: 12, zoom: 1 + 0.07 * lt / dur });
    for (i = 0; i < 5; i++) { var q = back((lt - 0.12 - i * 0.05) / 0.2); if (q <= 0) continue; g.save(); g.translate(640, 1400); g.rotate((i - 2) * 0.13 * q + (calm ? 0 : Math.sin(t * 6 + i) * 0.006)); g.translate(0, -901 + (1 - q) * 320); playingCard(DEALT[i]); g.restore(); }
    label("SEEN OFF", 640, 634, 56, LIME, NIGHT, -0.015, span(lt, 0.08, 0.22), 1000); hand("a card game of doubtful magic. The cats wear hats", 640, 698, 36, CYAN, span(lt, 0.2, 0.36), -0.012, 1100);
  }
  function game(i) { return function (lt, dur, t) {             // the other seven, two beats each
    var G = GAMES[i], p = glide(lt / 0.16), dir = i % 2 ? 1 : -1;
    nightSky(lt); gridFloor(t); arcadeHead(i + 4);
    card(G[0], 640 + dir * (1 - p) * 900, 338, 784, 490, dir * -0.018 * p, { shadow: PINK, line: LIME, lw: 6, sh: 12, zoom: 1 + 0.06 * lt / dur });
    label(G[1], 640, 606, 56, LIME, NIGHT, -0.015, span(lt, 0.08, 0.22), 1000); hand(G[2], 640, 682, 38, CYAN, span(lt, 0.18, 0.32), -0.012, 1100);
  }; }
  function dailyRow(lt, dur, t) {                              // 5. the papers
    fill(INK); rays(640, 360, RED, 0.3, lt * 0.6, 16);
    var p = ease(lt / 0.42), i, R = rng(5);
    g.save(); g.translate(640, 372); g.rotate((1 - p) * (calm ? 0 : 12.56) - 0.025); g.scale(0.08 + 0.92 * p, 0.08 + 0.92 * p);
    g.fillStyle = "#000"; g.fillRect(-470 + 12, -322 + 12, 940, 644); g.fillStyle = PAPER; g.fillRect(-470, -322, 940, 644);
    g.fillStyle = INK; g.fillRect(-440, -296, 880, 5); text("EXTRA!  NEW EDITION EVERY MORNING, 7ISH  ·  PRICE: NOTHING", 0, -266, 18, INK, MONO, "center", 0, 860);
    g.fillRect(-440, -252, 880, 2); text("THE DAILY ROW", 0, -96, 176, INK, DISP, "center", 2, 860); g.fillRect(-440, -72, 880, 8); g.fillRect(-440, -58, 880, 2);
    text("ALL THE NEWS THAT’S FIT TO EXAGGERATE.", 0, -14, 40, RED, DISP, "center", 1, 860);
    for (i = 0; i < 3; i++) { var x0 = -440 + i * 300; g.fillStyle = INK; g.fillRect(x0, 20, 280, 26); g.fillStyle = "rgba(20,20,20,.3)"; for (var j = 0; j < 6; j++) g.fillRect(x0, 62 + j * 20, 180 + R() * 100, 9); }
    g.strokeStyle = BLUE; g.lineWidth = 4; g.strokeRect(-440, 252, 880, 46); text("WHAT ACTUALLY HAPPENED: SEE THE BOX UNDER EVERY STORY", 0, 283, 20, BLUE, MONO, "center", 0, 840);
    hand("Reggie is perfectly capable of a balls-up", 0, 226, 40, BLUE, span(t, B(44, 2.5), B(44, 2.5) + 0.2), -0.012, 840);
    stamp("NO EDITOR", 250, 110, t, B(44), RED, 84, -0.2); g.restore();
  }
  function gamingRow(lt, dur, t) {
    nightSky(lt); var p = glide(lt / 0.2), jig = calm ? 0 : Math.sin(t * 34) * 5, turn = Math.floor(lt / (BEAT * 2)) % 2;
    card("p_terry", 300 - (1 - p) * 700 + (turn ? 0 : jig), 400, 400, 400, -0.05, { shadow: PINK, line: LIME, lw: 6 }); card("p_reggie", 980 + (1 - p) * 700 + (turn ? jig : 0), 400, 400, 400, 0.05, { shadow: PINK, line: LIME, lw: 6 });
    glow("THE DAILY GAMING ROW", 640, 118, 96, lt, 0, 1100);
    slam("V", 640 + 5, 470 + 5, 240, PINK, lt, 0.15, 0.1); slam("V", 640, 470, 240, YEL, lt, 0.15, 0.1);
    label("TERRY SAYS PC.", 300, 650, 50, LIME, NIGHT, -0.03, span(t, B(45, 1.75), B(45, 1.75) + 0.14), 420); label("REGGIE SAYS PS5.", 980, 650, 50, PINK, NIGHT, 0.03, span(t, B(45, 2.5), B(45, 2.5) + 0.14), 420);
    hand("all the news that’s fit to button-mash", 640, 704, 30, CYAN, span(t, B(45, 3), B(45, 3) + 0.2), -0.01, 560);
  }
  var RAIN = (function () { var R = rng(31), a = [], i; for (i = 0; i < 110; i++) a.push([R() * 1700, R() * 900, 26 + R() * 40, 0.7 + R() * 0.6]); return a; })();
  function weather(lt, dur, t) {
    fill(BLUE); var i, bolt = span(t, B(46, 3), B(46, 3) + 0.3), fl = bolt > 0 && bolt < 1 && !calm ? (1 - bolt) * 0.35 : 0;
    g.strokeStyle = "rgba(246,242,231,.5)"; g.lineWidth = 3; g.beginPath();
    for (i = 0; i < RAIN.length; i++) { var r = RAIN[i], y = (r[1] + lt * 900 * r[3]) % 900 - 90, x = r[0] - y * 0.35; g.moveTo(x, y); g.lineTo(x - r[2] * 0.35, y + r[2]); }
    g.stroke();
    g.fillStyle = PAPER; [[990, 105, 80], [1085, 90, 98], [1170, 120, 72], [915, 130, 54], [1045, 150, 88]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 6.3); g.fill(); });
    if (bolt > 0) { g.fillStyle = YEL; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(1075, 236); g.lineTo(1010, 386); g.lineTo(1062, 386); g.lineTo(1005, 520); g.lineTo(1135, 346); g.lineTo(1078, 346); g.lineTo(1125, 236); g.closePath(); g.fill(); g.stroke(); }
    slam("THE WEATHER ROW", 500, 380, 150, PAPER, lt, 0, -0.02, 860); typed("LIVE FROM THE SKY.", 80, 446, 34, PAPER, lt, 0.2, 40);
    slam("DISPUTED BY THE COUSINS.", 500, 556, 88, YEL, t, B(46, 2), -0.02, 860);
    hand("the worse the weather, the more they argue", 640, 664, 36, PAPER, span(t, B(46, 2.5), B(46, 2.5) + 0.16), -0.012, 1100);
    if (fl) { g.fillStyle = "rgba(255,255,255," + fl + ")"; g.fillRect(0, 0, W, H); }
  }
  function tribunal(lt, dur, t) {
    fill(INK); var a = lt / dur, z = 1.02 + a * 0.1;
    if (pics.judge) { var jw = W * z, jh = jw * pics.judge.height / pics.judge.width; g.drawImage(pics.judge, (W - jw) / 2, -20 - a * 80, jw, jh); }
    shade(300, H, 0.95);
    slam("SUMMON THE TRIBUNAL", 640, 590, 128, PAPER, lt, 0, 0, 1160); g.fillStyle = RED; g.fillRect(180, 612, 920 * ease(lt / 0.4), 8);
    typed("ALL RISE. OR DON’T. HE ISN’T LOOKING.", 640, 672, 30, PAPER, t, B(47, 3), 40, "center");
    stamp("BANG THE GAVEL", 1030, 110, t, B(48), YEL, 50, 0.08, "rgba(20,20,20,.82)");
  }
  function invoice() {                                          // an invoice, drawn rather than raised
    g.fillStyle = RED; g.fillRect(-190 + 12, -250 + 12, 380, 500); g.fillStyle = CARD; g.fillRect(-190, -250, 380, 500); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-190, -250, 380, 500);
    text("INVOICE R-012", 0, -180, 58, INK, DISP, "center", 1, 320); g.fillStyle = INK; g.fillRect(-160, -160, 320, 5);
    [["To services rendered", "3 compliments"], ["To wounded dignity", "1 raised eyebrow"], ["Supplement for the Y", "£10"], ["Biscuits", "at cost"]].forEach(function (r, i) {
      text(r[0], -160, -108 + i * 62, 19, INK, MONO, "left", 0, 320); text(r[1], 160, -80 + i * 62, 22, RED, "bold " + MONO, "right", 0, 300); g.fillStyle = "rgba(20,20,20,.25)"; g.fillRect(-160, -66 + i * 62, 320, 2); });
    text("TOTAL DUE: THE LOT", 0, 200, 34, INK, DISP, "center", 0, 320);
  }
  function rosette(lt) {
    var i; g.fillStyle = BLUE; g.beginPath(); g.moveTo(-70, 60); g.lineTo(-120, 290); g.lineTo(-60, 250); g.lineTo(-20, 300); g.lineTo(10, 60); g.fill(); g.beginPath(); g.moveTo(70, 60); g.lineTo(130, 280); g.lineTo(66, 246); g.lineTo(30, 300); g.lineTo(-10, 60); g.fill();
    g.save(); g.rotate(lt * 0.5); g.fillStyle = YEL; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); for (i = 0; i <= 40; i++) { var a = i / 40 * 6.283, r = i % 2 ? 190 : 162; g.lineTo(Math.cos(a) * r, Math.sin(a) * r - 40); } g.closePath(); g.fill(); g.stroke(); g.restore();
    g.fillStyle = PAPER; g.beginPath(); g.arc(0, -40, 126, 0, 6.3); g.fill(); g.stroke(); text("1st", 0, -4, 110, RED, DISP, "center", 0, 200); text("(OF TEN)", 0, 38, 24, INK, DISP, "center", 2, 200);
  }
  function comicPage(lt) {
    fill(YEL); dots(0, 0, W, H, RED, 0.22); rays(338, 368, PAPER, 0.4, lt * 0.4, 12);
    var p = glide(lt / 0.2); card("comic", 338 - (1 - p) * 720, 368, 500, 500, -0.045 * p, { shadow: RED });
    slam("THE MAGNIFICENT", 928, 250, 110, INK, lt, 0.03, 0, 580); slam("NONSENSE", 928, 400, 170, RED, lt, 0.12, 0, 580);
    typed("A COMIC. EVERY MONTH.", 928, 462, 26, INK, lt, 0.22, 60, "center", 580); hand("no prospect of a quiet life", 928, 540, 38, BLUE, span(lt, 0.3, 0.48), -0.02, 580); stamp("BY TERRY", 928, 630, lt, 0.58, INK, 44);
  }
  function music(lt, dur, t) {
    fill("#07101f"); var i, R = rng(3), bt = (t / BEAT) % 1;
    for (i = 0; i < 40; i++) { var h = (22 + R() * 74) * (0.45 + 0.55 * Math.abs(Math.sin(t * (5 + R() * 9) + i))) * (1 - 0.3 * bt); g.fillStyle = i % 3 ? CYAN : PINK; g.fillRect(24 + i * 31, H - h, 22, h); }
    var p = back(lt / 0.2); card("music", 640, 250 - (1 - p) * 560, 720, 378, -0.012, { shadow: PINK, line: CYAN, lw: 5 });
    slam("THE FERRET ON THE DECKS", 640, 546, 98, PAPER, lt, 0.06, 0, 1100); typed("REMIXES AND MASHUPS. MIXED BY HAND.", 640, 594, 26, CYAN, lt, 0.2, 70, "center");
    var s = span(lt, 0.5, 0.64); if (s > 0) { g.save(); g.translate(1130, 120); g.rotate(0.14); g.scale(1 + (1 - ease(s)), 1 + (1 - ease(s))); g.fillStyle = PINK; g.beginPath(); g.arc(0, 0, 70, 0, 6.3); g.fill(); g.strokeStyle = PAPER; g.lineWidth = 6; g.stroke(); text("18+", 0, 26, 70, PAPER, DISP, "center", 0, 120); g.restore(); }
  }
  function merch(lt) {
    fill(PAPER); rays(640, 360, RED, 0.08, lt * 0.3, 14); var p = glide(lt / 0.2);
    card("m1", 250 - (1 - p) * 600, 330, 380, 380, -0.06 * p, {}); card("m2", 1030 + (1 - p) * 600, 330, 380, 380, 0.06 * p, { shadow: RED });
    slam("MERCH", 640, 396, 210, RED, lt, 0.05, 0, 372); typed("SHIRTS. A MUG. A TOTE. A JIGSAW.", 640, 596, 30, INK, lt, 0.2, 70, "center");
    hand("worn with wounded dignity", 640, 664, 40, BLUE, span(lt, 0.34, 0.5), -0.015, 900);
  }
  var XMAS = new Date() < new Date(2026, 11, 26);                // the calendar until Boxing Day, the Log after
  function seasonal(lt, dur, t) {
    if (!XMAS) { spread(lt, { prop: logBook, acc: BLUE, head: ["THE FERRET’S", "LOG"], hs: 150, hy: 250, gap: 160, sub: "WRITTEN EVERY MORNING. BY REGGIE.", quip: ["nobody reads it first"], stamp: "UNSUPERVISED" }); return; }
    fill(TEAL); var i, R = rng(12);
    g.fillStyle = PAPER; for (i = 0; i < 90; i++) { var x = R() * W, y = (R() * H + lt * (60 + R() * 120)) % H, r = 2 + R() * 4; g.globalAlpha = 0.5 + R() * 0.5; g.beginPath(); g.arc(x + Math.sin(lt * 2 + i) * 10, y, r, 0, 6.3); g.fill(); }
    g.globalAlpha = 1;
    for (i = 0; i < 12; i++) { var p = back((lt - i * 0.02) / 0.15); if (p <= 0) continue; var cx = 150 + (i % 6) * 196, cy = 150 + Math.floor(i / 6) * 150; g.save(); g.translate(cx, cy); g.scale(p, p); g.fillStyle = i % 2 ? RED : CARD; g.fillRect(-80, -58, 160, 116); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(-80, -58, 160, 116); text(String([7, 19, 2, 24, 11, 5, 16, 1, 22, 9, 14, 3][i]), 0, 28, 74, i % 2 ? PAPER : RED, DISP, "center", 0, 140); g.restore(); }
    slam("ARTHUR’S ADVENT CALENDAR", 640, 500, 104, PAPER, lt, 0.05, 0, 1140); typed("TWENTY-FOUR DOORS. FROM 1 DECEMBER.", 640, 566, 30, YEL, lt, 0.2, 70, "center");
    hand("traditional, cosy and a little bit daft", 640, 650, 40, PAPER, span(lt, 0.34, 0.5), -0.015, 1000);
  }
  function logBook() {
    g.fillStyle = INK; g.fillRect(-170 + 12, -220 + 12, 340, 440); g.fillStyle = CARD; g.fillRect(-170, -220, 340, 440); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-170, -220, 340, 440); g.fillStyle = RED; g.fillRect(-170, -220, 46, 440);
    text("THE LOG", 20, -130, 60, INK, DISP, "center", 1, 240); g.fillStyle = "rgba(20,20,20,.3)"; for (var i = 0; i < 10; i++) g.fillRect(-100, -80 + i * 28, 200 + (i * 37) % 50, 8);
  }
  var FLASH = [["c1", "BOOKS!", 0], ["g8", "GAMES!", 1], ["p_spyro", "CATS!", 0], ["judge", "ROWS!", 1], ["c4", "GHOSTS!", 0], ["p_reggie", "INVOICES!", 1], ["p_ferret", "CARP!", 0], ["p_daisy", "DREAMIES!", 1]];
  function flash(i) { return function (lt) {                    // one thing a beat
    var F = FLASH[i], p = back(lt / 0.1), wide = F[0].charAt(0) === "g" || F[0] === "judge", tall = F[0].charAt(0) === "c";
    fill(PAPER); rays(640, 300, i % 2 ? BLUE : RED, 0.12, i * 0.4 + lt, 14);
    card(F[0], 640, 258, (wide ? 592 : tall ? 262 : 384) * (0.8 + 0.2 * p), (wide ? 370 : tall ? 393 : 384) * (0.8 + 0.2 * p), (i % 2 ? 0.04 : -0.04), {});
    slam(F[1], 640, 668, 190, i % 2 ? RED : INK, lt, 0, i % 2 ? 0.02 : -0.02, 1150);
  }; }
  function faces(lt, dur, t) {                                 // everybody, twice a beat
    fill(PAPER); rays(640, 300, RED, 0.1, t, 14);
    var n = Math.min(7, Math.floor(lt / (BEAT / 2))), k = ["ferret", "jo", "terry", "reggie", "arthur", "tilly", "trixie", "dexter"][n];
    card("p_" + k, 640, 262, 392, 392, n % 2 ? 0.03 : -0.03, {});
    typed("AND MOST OF IT RUNS ITSELF.", 640, 536, 36, INK, lt, 0, 60, "center"); stamp("UNSUPERVISED", 640, 640, lt, 0.2, RED, 84, -0.04);
  }
  function email(lt, dur, t) {                                 // 6. the stop
    fill(PAPER); blot(110, 110, 84, 301, BLUE, span(lt, 0, 0.3));
    slam("EVERYONE HERE HAS", 640, 190, 110, INK, lt, 0, 0, 1000); slam("AN EMAIL ADDRESS.", 640, 310, 110, INK, lt, 0.08, 0, 1000);
    if (t < B(61)) return;
    var l2 = t - B(61); blot(1160, 600, 90, 302, RED, span(l2, 0, 0.3));
    slam("INCLUDING THE CATS.", 640, 470, 150, RED, l2, 0, -0.015, 1120);
    typed("arthur@williamgeorgeworks.co.uk", 640, 548, 34, BLUE, l2, 0.12, 60, "center");
    hand("he has yet to reply in person", 640, 640, 38, INK, span(l2, 0.5, 0.7), -0.02, 900);
    var p = span(l2, 0.02, 0.14); if (p > 0) { g.save(); g.translate(1066, 640); g.rotate(-0.1 + (calm ? 0 : 0.03 * Math.sin(t * 40))); label("MIAOW.", 0, 0, 62, INK, PAPER, 0, p, 300); g.restore(); }
  }
  function finale(lt, dur, t) {                                // 7. the name on the door
    fill(PAPER);
    blot(1196, 92, 92, 140, INK, span(t, B(62), B(62) + 0.3)); blot(84, 150, 70, 175, RED, span(t, B(62, 3), B(62, 3) + 0.3)); blot(1208, 640, 56, 101, BLUE, span(t, B(66), B(66) + 0.25)); blot(70, 650, 64, 207, INK, span(t, B(66, 2.5), B(66, 2.5) + 0.25));
    slam("WILLIAM GEORGE", 640, 150, 120, INK, t, B(62), 0, 900); slam("WORKS", 640, 345, 215, RED, t, B(62, 3), 0, 900);
    var p = span(t, B(63), B(63) + 0.3); if (p > 0) { g.globalAlpha = p; text("BOOKS, GAMES & MAGNIFICENT NONSENSE", 640, 398, 34, INK, DISP, "center", 3, 900); g.globalAlpha = 1; }
    for (var i = 0; i < 10; i++) { p = back((t - B(64) - i * 0.045) / 0.18); if (p > 0) card("cast", 104 + i * 119.2, 484 + (1 - p) * 320, 108, 108, (i % 2 ? 0.035 : -0.035) * p, { src: [(i % 5) * 200, Math.floor(i / 5) * 200, 200, 200], sh: 5, lw: 3 }); }
    label("WILLIAMGEORGEWORKS.CO.UK", 640, 608, 46, INK, PAPER, -0.008, span(t, B(65), B(65) + 0.16), 760);
    hand("The Chief Justice was not consulted.", 640, 676, 34, BLUE, span(t, B(66, 2.5), B(66, 2.5) + 0.3), -0.012, 800);
    typed("NO CATS WERE RUSHED IN THE MAKING OF THIS FILM.", 640, 708, 15, "#5f5a4e", t, B(67, 3), 60, "center");
  }

  /* ---------- the cutting list: [bar, beat, scene, thump]. thump: 0 none, 1 a nudge, 2 a proper wallop ---------- */
  var CUTS = [], i;
  function cut(bar, beat, fn, thump) { CUTS.push({ at: B(bar, beat), fn: fn, thump: thump || 0 }); }
  function person(P) { return function (lt) { spread(lt, P); }; }
  cut(1, 1, night, 0); cut(9, 1, cards, 0);
  for (i = 0; i < 4; i++) cut(13 + i, 1, person(PEOPLE[i]), i ? 1 : 2);
  cut(17, 1, person(BENCH[0]), 2); for (i = 1; i < 6; i++) cut(18 + Math.floor((i - 1) / 2), (i - 1) % 2 ? 3 : 1, person(BENCH[i]), 1);
  cut(20, 3, bench, 1);
  for (i = 0; i < 6; i++) cut(21 + i, 1, book(i), i ? 1 : 2);
  cut(27, 1, shelf, 1); cut(29, 1, accord, 2);
  cut(33, 1, word("HONESTY.", PAPER, INK, 1), 2); cut(34, 1, word("INTEGRITY.", INK, PAPER, 2), 2); cut(35, 1, word("KINDNESS.", BLUE, PAPER, 3), 2); cut(36, 1, word("NONSENSE.", RED, PAPER, 4, true), 2);
  cut(37, 1, arcade, 2); cut(37, 3, featRadio, 1); cut(38, 3, featKart, 1); cut(39, 1, featPier, 1);   // the arcade in six bars: the sign, a bar of Dead Air FM, two beats each for the karts and the pier, then seven more
  for (i = 0; i < 7; i++) cut(39 + Math.floor((2 + 2 * i) / 4), (2 + 2 * i) % 4 + 1, game(i), 1);
  cut(43, 1, dailyRow, 1); cut(45, 1, gamingRow, 2); cut(46, 1, weather, 1); cut(47, 1, tribunal, 1);
  cut(49, 1, person({ key: "p_terry", acc: BLUE, head: ["DEAR TERRY"], hs: 160, hc: [RED], sub: "YOUR PROBLEMS, SOLVED", quip: ["with total confidence. He has", "never had one in his life"], stamp: "AGONY UNCLE" }), 1);
  cut(50, 1, person({ prop: invoice, flip: 1, bg: INK, acc: YEL, fg: PAPER, head: ["INVOICES"], hs: 170, sub: "TERMS: STRICTLY IMAGINARY.", quip: ["payable in compliments"], qc: YEL, stamp: "PLUS A TENNER FOR THE Y", sc: YEL }), 1);
  cut(51, 1, person({ prop: rosette, bg: RED, acc: INK, fg: PAPER, head: ["EMPLOYEE", "OF THE MONTH"], hs: 120, hy: 250, gap: 128, sub: "STAFF RECOGNITION. MANDATORY.", quip: ["nobody is paid"], qc: YEL, stamp: "DRAWN AT RANDOM", sc: PAPER }), 1);
  cut(52, 1, person({ key: "p_reggie", flip: 1, acc: BLUE, head: ["REGGIE’S", "MESSAGE BOARD"], hs: 118, hy: 250, gap: 126, sub: "OPEN THREE TIMES A DAY.", quip: ["a lot on his plate.", "Most of it is biscuits"] }), 1);
  cut(53, 1, comicPage, 2); cut(54, 1, music, 1); cut(55, 1, merch, 1); cut(56, 1, seasonal, 1);
  for (i = 0; i < 8; i++) cut(57 + Math.floor(i / 4), 1 + i % 4, flash(i), 0);
  cut(59, 1, faces, 0); cut(60, 1, email, 2); cut(62, 1, finale, 2);
  var HITS = [[B(9), 2], [B(10), 2], [B(11), 2], [B(48), 2], [B(61), 1], [B(62, 3), 2], [B(66), 2], [B(66, 2.5), 2]];   // thumps that are not cuts
  CUTS.forEach(function (c) { if (c.thump) HITS.push([c.at, c.thump]); });

  function draw(t) {
    shown = t;
    g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); g.globalAlpha = 1;
    var n = 0, k; for (k = 0; k < CUTS.length; k++) if (CUTS[k].at <= t + 1e-6) n = k;
    var c = CUTS[n], lt = t - c.at, dur = (n + 1 < CUTS.length ? CUTS[n + 1].at : END) - c.at, sx = 0, sy = 0, zoom = 1, white = 0;
    if (!calm) for (k = 0; k < HITS.length; k++) {
      var d = t - HITS[k][0]; if (d < 0 || d > 0.4) continue; var amp = HITS[k][1] === 2 ? 11 : 5, e = Math.exp(-d / 0.09);
      sx += Math.sin(d * 95) * amp * e; sy += Math.cos(d * 80) * amp * 0.7 * e; zoom += (HITS[k][1] === 2 ? 0.045 : 0.02) * e; if (HITS[k][1] === 2 && d < 0.07) white = Math.max(white, 0.4 * (1 - d / 0.07));
    }
    g.fillStyle = INK; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2 + sx, H / 2 + sy); g.scale(zoom, zoom); g.translate(-W / 2, -H / 2);
    c.fn(lt, dur, t); g.restore(); g.globalAlpha = 1;
    grain();
    if (t < B(9) + 0.3) { var lb = 56 * (1 - ease(span(t, B(9) - 0.04, B(9) + 0.26))); if (lb > 0.5) { g.fillStyle = "#000"; g.fillRect(0, 0, W, lb); g.fillRect(0, H - lb, W, lb); } }
    if (white > 0) { g.fillStyle = "rgba(255,253,247," + white + ")"; g.fillRect(0, 0, W, H); }
  }

  /* ---------- running it ---------- */
  var ac = null, master = null, src = null, tune = null, tuneAsked = 0, tuneWait = [], muted = false, t0 = 0, p0 = 0, raf = 0, loading = false, VOL = 0.9;
  var btn = document.getElementById("promo-play"), snd = document.getElementById("promo-sound"), stage = cv.parentNode;
  function fetchTune(done) {                                    // the music arrives as bytes; it is decoded once Play has made a player for it
    if (tuneAsked === 2) { if (done) done(); return; }
    if (done) tuneWait.push(done); if (tuneAsked) return;
    tuneAsked = 1; var fin = function (buf) { tune = buf || null; tuneAsked = tune ? 2 : 0; var q = tuneWait; tuneWait = []; q.forEach(function (f) { f(); }); };
    try { fetch(MUSIC).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(fin, function () { fin(null); }); } catch (e) { fin(null); }
  }
  function now() {
    if (ac && src && ac.state === "running") { var lag = ac.outputLatency || ac.baseLatency || 0; return ac.currentTime - t0 - Math.min(0.3, lag); }
    return (performance.now() - p0) / 1000;
  }
  function frame() {
    if (!playing) return;
    var t = now();
    if (t >= END) { stop(true); return; }
    draw(Math.max(0, t)); raf = requestAnimationFrame(frame);
  }
  function stop(finished) {
    playing = false; loading = false; cancelAnimationFrame(raf);
    if (src) { try { src.stop(); } catch (e) {} src = null; }
    if (ac) { try { ac.close(); } catch (e) {} ac = null; }
    draw(END - 0.01); stage.classList.remove("running"); btn.textContent = finished ? "Play it again" : "Play the trailer";
  }
  function begin(buf) {
    loading = false; btn.textContent = "Stop the trailer";
    p0 = performance.now() + 120;
    if (ac && buf) { try { src = ac.createBufferSource(); src.buffer = buf; src.connect(master); t0 = ac.currentTime + 0.12; src.start(t0); } catch (e) { src = null; } }
    playing = true; stage.classList.add("running"); raf = requestAnimationFrame(frame);
  }
  function play() {
    if (playing || loading) return;
    loading = true; btn.textContent = "Loading the band…";
    var AC = window.AudioContext || window.webkitAudioContext; ac = null; src = null;
    if (AC) { try { ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : VOL; master.connect(ac.destination); if (ac.resume) ac.resume(); } catch (e) { ac = null; } }
    var left = 2, bytes = null, timer = 0, go = function () {
      if (--left > 0 || !loading) return; clearTimeout(timer);
      if (!ac || !tune) { begin(null); return; }
      var mine = ac, ok = function (b) { if (loading && ac === mine) begin(b); }, bad = function () { if (loading && ac === mine) begin(null); };
      try { var pr = ac.decodeAudioData(tune.slice(0), ok, bad); if (pr && pr.catch) pr.catch(function () {}); } catch (e) { bad(); }
    };
    fetchAll(go, function (p) { if (loading) btn.textContent = "Loading the band… " + Math.round(p * 100) + "%"; }); fetchTune(go);
    timer = setTimeout(function () { if (loading && left > 0) { left = 1; go(); } }, 15000);   // a slow line gets the film with whatever has arrived
    if (document.fonts && document.fonts.load) { try { document.fonts.load("40px Anton"); document.fonts.load("40px 'Permanent Marker'"); } catch (e) {} }
  }
  function toggle() { if (playing || loading) stop(false); else play(); }      // the button and the picture both start it and stop it
  btn.addEventListener("click", toggle); cv.addEventListener("click", toggle);
  snd.addEventListener("click", function () {
    muted = !muted; snd.textContent = muted ? "Sound: off" : "Sound: on"; snd.setAttribute("aria-pressed", muted ? "true" : "false");
    if (master && ac) master.gain.setValueAtTime(muted ? 0 : VOL, ac.currentTime);
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden && (playing || loading)) stop(false); });
  function warm() { fetchAll(); fetchTune(); }                  // a head start when somebody looks interested
  btn.addEventListener("pointerenter", warm); cv.addEventListener("pointerenter", warm); btn.addEventListener("focus", warm); cv.addEventListener("touchstart", warm, { passive: true });
  function size() { var r = Math.min(window.devicePixelRatio || 1, 2), box = Math.min(stage.clientWidth || W, 1400), w = Math.max(320, Math.min(2560, Math.round(box * r))); if (w === cv.width) { if (!playing) draw(shown); return; } cv.width = w; cv.height = Math.round(w * H / W); if (!playing) draw(shown); }
  window.addEventListener("resize", size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!playing) draw(shown); });
  window.__promo = { seek: function (t) { draw(t); }, end: END, bar: BAR, cuts: CUTS.map(function (c) { return c.at; }), load: function (cb) { fetchAll(cb); }, time: function () { return playing ? now() : -1; } };
  size();
})();
