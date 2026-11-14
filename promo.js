/* The William George Works trailer: an original spy-thriller title sequence, drawn on a canvas.
   Pictures: Terrance Quill. Animation and tune: Reginald Quill. No film was harmed or copied. */
(function () {
  "use strict";
  var cv = document.getElementById("promo");
  if (!cv || !cv.getContext) return;
  var g = cv.getContext("2d"), W = 1280, H = 720;
  var INK = "#141414", PAPER = "#f6f2e7", RED = "#d1202f", BLUE = "#22409a";
  var DISP = "Anton,'Arial Narrow',Impact,sans-serif", HAND = "'Permanent Marker','Segoe Print',cursive";
  var BAR = 60 / 132 * 4, END = BAR * 20;                 // 132 beats a minute, twenty bars
  function B(n) { return (n - 1) * BAR; }                  // start time of bar n

  /* ---------- pictures ---------- */
  var pics = {}, names = {
    arthur: "promo-arthur.webp", judge: "promo-judge.jpg",
    c1: "cover-last-of-the-unemployable.jpg", c2: "cover-man-who-wanted-to-sue-god.jpg",
    c3: "cover-lancashire-ghost-stories.jpg", c4: "cover-small-stove-cookbook.jpg"
  };
  Object.keys(names).forEach(function (k) {
    var im = new Image(); im.onload = function () { pics[k] = im; if (!playing) draw(shown); };
    im.src = names[k];
  });

  /* ---------- small helpers ---------- */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function back(x) { x = clamp(x); var c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function span(t, a, b) { return clamp((t - a) / (b - a)); }

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
    align = align || "center"; font = font || DISP;
    var lim = (maxW ? maxW : (align === "center" ? W - 90 : W - x - 50));
    g.font = size + "px " + font; var wide = g.measureText(str).width + (track || 0) * str.length;
    if (wide > lim) size = size * lim / wide;
    g.font = size + "px " + font; g.fillStyle = col; g.textAlign = align; g.textBaseline = "alphabetic";
    if (track && g.letterSpacing !== undefined) g.letterSpacing = track + "px";
    g.fillText(str, x, y);
    if (g.letterSpacing !== undefined) g.letterSpacing = "0px";
  }
  function slam(str, x, y, size, col, t, at, rot, maxW) {      // a word that lands with a thump
    var p = span(t, at, at + 0.22); if (p <= 0) return;
    var k = 1 + (1 - ease(p)) * 1.4;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(k, k); g.globalAlpha = clamp(p * 2.5);
    text(str, 0, 0, size, col, DISP, "center", 0, maxW || (W - 110)); g.restore(); g.globalAlpha = 1;
  }
  function typed(str, x, y, size, col, t, at, rate) {
    var n = Math.floor((t - at) * (rate || 22)); if (n <= 0) return;
    g.font = size + "px 'Courier New',Courier,monospace"; var full = g.measureText(str).width, lim = W - x - 60; if (full > lim) size = size * lim / full;
    g.font = size + "px 'Courier New',Courier,monospace"; g.fillStyle = col; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(str.slice(0, n), x, y);
  }
  function cover(im, box) {                                // draw a picture filling a box
    if (!im) return; var s = Math.max(box[2] / im.width, box[3] / im.height);
    g.drawImage(im, box[0] + (box[2] - im.width * s) / 2, box[1] + (box[3] - im.height * s) / 2, im.width * s, im.height * s);
  }
  function stamp(str, x, y, t, at, col) {
    var p = span(t, at, at + 0.18); if (p <= 0) return;
    g.save(); g.translate(x, y); g.rotate(-0.16); var k = 1 + (1 - ease(p)) * 1.2; g.scale(k, k); g.globalAlpha = 0.9 * clamp(p * 3);
    g.font = "34px " + DISP; var w = g.measureText(str).width + 34;
    g.strokeStyle = col; g.lineWidth = 5; g.strokeRect(-w / 2, -30, w, 52); text(str, 0, 10, 34, col);
    g.restore(); g.globalAlpha = 1;
  }

  /* ---------- the film ---------- */
  function draw(t) {
    shown = t;
    g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    g.globalAlpha = 1; g.fillStyle = INK; g.fillRect(0, 0, W, H);
    var a, p, i;

    if (t < B(5)) {                                        // 1. night. searchlights. a cat.
      var beams = [[210, -40, 0.9, 0.55, 0.0], [1070, -40, 0.75, -0.5, 1.7]];
      var found = ease(span(t, B(3), B(3) + 1.4));
      g.save(); g.globalCompositeOperation = "lighter";
      beams.forEach(function (b) {
        var sw = Math.sin(t * b[2] + b[4]) * 0.5 * (1 - found), ang = Math.atan2(430 + 40, 640 - b[0]) * found + (Math.PI / 2 - b[3] + sw) * (1 - found);
        g.save(); g.translate(b[0], b[1]); g.rotate(ang - Math.PI / 2);
        var gr = g.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, "rgba(246,242,231,0.34)"); gr.addColorStop(1, "rgba(246,242,231,0)");
        g.fillStyle = gr; g.beginPath(); g.moveTo(-8, 0); g.lineTo(-150, 900); g.lineTo(150, 900); g.lineTo(8, 0); g.fill(); g.restore();
      });
      g.restore();
      if (pics.arthur && found > 0) {
        g.save(); g.globalAlpha = found; var aw = 620, ah = aw * pics.arthur.height / pics.arthur.width;
        var gl = g.createRadialGradient(640, 430, 40, 640, 430, 430); gl.addColorStop(0, "rgba(246,242,231,0.95)"); gl.addColorStop(1, "rgba(246,242,231,0)");
        g.fillStyle = gl; g.fillRect(0, 0, W, H); g.drawImage(pics.arthur, 640 - aw / 2, 430 - ah / 2 + 10, aw, ah); g.restore();
      }
      if (t <= B(3) + 1.2) typed("SOMEWHERE IN LANCASHIRE", 70, 668, 32, PAPER, t, 0.5);
      else { g.fillStyle = "rgba(20,20,20,0.78)"; g.fillRect(0, 612, W, 108); typed("A CAT IS ASLEEP ON THE EVIDENCE.", 70, 676, 34, PAPER, t, B(3) + 1.3, 26); }
      p = span(t, B(5) - 0.12, B(5)); if (p > 0) { g.fillStyle = "rgba(246,242,231," + p + ")"; g.fillRect(0, 0, W, H); }
      return;
    }

    if (t < B(9)) {                                        // 2. one human, two machines, six cats
      g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
      blot(1185, 105, 100, 7, INK, span(t, B(5), B(5) + 0.35));
      blot(95, 640, 85, 21, RED, span(t, B(6), B(6) + 0.35));
      blot(1200, 650, 62, 33, BLUE, span(t, B(7), B(7) + 0.35));
      text("WILLIAM GEORGE WORKS PRESENTS", 560, 96, 30, INK, DISP, "center", 4, 820);
      slam("ONE HUMAN.", 640, 280, 150, INK, t, B(5), 0, 900);
      slam("TWO MACHINES.", 640, 430, 150, RED, t, B(6), 0, 900);
      slam("SIX CATS.", 640, 580, 150, INK, t, B(7), 0, 900);
      p = span(t, B(8), B(8) + 0.3);
      if (p > 0) { g.save(); g.globalAlpha = p; g.translate(640, 668); g.rotate(-0.02); text("and not one of them in charge", 0, 0, 40, BLUE, HAND, "center", 0, 800); g.restore(); }
      p = span(t, B(9) - 0.25, B(9)); if (p > 0) { g.fillStyle = "rgba(20,20,20," + p + ")"; g.fillRect(0, 0, W, H); }
      return;
    }

    if (t < B(13)) {                                       // 3. the chief justice
      a = span(t, B(9), B(13)); var z = 1.0 + a * 0.1;
      if (pics.judge) { var jw = W * z, jh = jw * pics.judge.height / pics.judge.width; g.drawImage(pics.judge, (W - jw) / 2, -10 - a * 90, jw, jh); }
      var vg = g.createLinearGradient(0, 330, 0, H); vg.addColorStop(0, "rgba(20,20,20,0)"); vg.addColorStop(0.75, "rgba(20,20,20,0.92)");
      g.fillStyle = vg; g.fillRect(0, 300, W, 420);
      p = ease(span(t, B(9) + 0.3, B(9) + 0.8));
      g.fillStyle = RED; g.fillRect(70, 530, 520 * p, 8);
      if (p > 0.2) { g.globalAlpha = p; text("ARTHUR", 70, 640, 120, PAPER, DISP, "left"); g.globalAlpha = 1; }
      typed("CHIEF JUSTICE.", 74, 690, 28, PAPER, t, B(10), 24);
      p = span(t, B(11), B(11) + 0.2);
      if (p > 0) { g.save(); g.translate(930, 610); g.rotate(-0.04); g.globalAlpha = clamp(p * 2); g.fillStyle = PAPER; g.fillRect(-300, -52, 600, 82); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-300, -52, 600, 82); text("HE WILL NOT BE RUSHED.", 0, 8, 50, INK, DISP, "center", 0, 560); g.restore(); g.globalAlpha = 1; }
      stamp("ASLEEP", 1120, 540, t, B(12), RED);
      p = span(t, B(9), B(9) + 0.3); if (p < 1) { g.fillStyle = "rgba(20,20,20," + (1 - p) + ")"; g.fillRect(0, 0, W, H); }
      p = span(t, B(13) - 0.12, B(13)); if (p > 0) { g.fillStyle = "rgba(246,242,231," + p + ")"; g.fillRect(0, 0, W, H); }
      return;
    }

    if (t < B(17)) {                                       // 4. the files
      g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
      blot(85, 95, 80, 52, BLUE, span(t, B(13), B(13) + 0.35));
      blot(1205, 95, 80, 88, RED, span(t, B(14), B(14) + 0.35));
      text("THE FILES", 640, 100, 76, INK, DISP, "center", 3);
      var ks = ["c1", "c2", "c3", "c4"], rot = [-0.05, 0.035, -0.025, 0.05];
      for (i = 0; i < 4; i++) {
        var at = B(13) + 0.25 + i * (BAR / 2.2); p = ease(span(t, at, at + 0.4)); if (p <= 0) continue;
        var cx = 205 + i * 290, cy = 375 + (1 - p) * 520;
        g.save(); g.translate(cx, cy); g.rotate(rot[i] * p);
        g.fillStyle = INK; g.fillRect(-112 + 9, -165 + 9, 224, 330);
        g.save(); g.beginPath(); g.rect(-112, -165, 224, 330); g.clip(); g.fillStyle = "#fff"; g.fillRect(-112, -165, 224, 330); cover(pics[ks[i]], [-112, -165, 224, 330]); g.restore();
        g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-112, -165, 224, 330);
        g.restore();
        stamp("OUT NOW", cx, cy + 120, t, at + 0.5, RED);
      }
      slam("FOUR BOOKS. FOUR GAMES. NO DIGNITY.", 640, 662, 56, INK, t, B(16), 0, 1100);
      return;
    }

    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);           // 5. the name
    blot(1195, 95, 95, 140, INK, span(t, B(17), B(17) + 0.35));
    blot(85, 640, 80, 175, RED, span(t, B(17) + 0.3, B(17) + 0.65));
    blot(1205, 655, 58, 101, BLUE, span(t, B(18), B(18) + 0.35));
    slam("WILLIAM GEORGE", 640, 250, 140, INK, t, B(17), 0, 900);
    slam("WORKS", 640, 470, 250, RED, t, B(17) + BAR / 2, 0, 900);
    p = span(t, B(18) + 0.3, B(18) + 0.8);
    if (p > 0) { g.globalAlpha = p; text("BOOKS, GAMES & MAGNIFICENT NONSENSE", 640, 548, 40, INK, DISP, "center", 3, 900); g.globalAlpha = 1; }
    p = span(t, B(19), B(19) + 0.5);
    if (p > 0) { g.save(); g.globalAlpha = p; g.translate(640, 650); g.rotate(-0.015); text("The Chief Justice was not consulted.", 0, 0, 38, BLUE, HAND, "center", 0, 800); g.restore(); }
  }

  /* ---------- the tune: an original spy number in D minor ---------- */
  var ac = null, master = null, muted = false;
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function tone(type, midi, at, dur, vol, cut) {
    var o = ac.createOscillator(), f = ac.createBiquadFilter(), v = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(hz(midi), at); f.type = "lowpass"; f.frequency.setValueAtTime(cut || 1800, at);
    v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(vol, at + 0.015); v.gain.setValueAtTime(vol, at + Math.max(0.02, dur - 0.06)); v.gain.linearRampToValueAtTime(0, at + dur);
    o.connect(f); f.connect(v); v.connect(master); o.start(at); o.stop(at + dur + 0.03);
  }
  function brass(notes, at, dur, vol) { notes.forEach(function (m) { tone("sawtooth", m, at, dur, vol, 1500); tone("sawtooth", m + 0.08, at, dur, vol * 0.6, 1100); }); }
  function twang(midi, at, dur, vol) {
    var o = ac.createOscillator(), v = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(hz(midi), at); l.frequency.value = 6.5; lg.gain.value = 4; l.connect(lg); lg.connect(o.frequency);
    v.gain.setValueAtTime(0, at); v.gain.linearRampToValueAtTime(vol, at + 0.008); v.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(v); v.connect(master); o.start(at); l.start(at); o.stop(at + dur + 0.02); l.stop(at + dur + 0.02);
  }
  var noiseBuf = null;
  function hit(at, dur, vol, freq, type) {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
    s.buffer = noiseBuf; f.type = type || "highpass"; f.frequency.value = freq; v.gain.setValueAtTime(vol, at); v.gain.exponentialRampToValueAtTime(0.001, at + dur);
    s.connect(f); f.connect(v); v.connect(master); s.start(at); s.stop(at + dur + 0.02);
  }
  function thud(at, vol) {
    var o = ac.createOscillator(), v = ac.createGain(); o.frequency.setValueAtTime(130, at); o.frequency.exponentialRampToValueAtTime(42, at + 0.16);
    v.gain.setValueAtTime(vol, at); v.gain.exponentialRampToValueAtTime(0.001, at + 0.3); o.connect(v); v.connect(master); o.start(at); o.stop(at + 0.32);
  }
  function score(t0) {
    var q = BAR / 4, e = q / 2, bar, i, at;
    var bass = [[38, 38, 41, 43], [45, 45, 43, 41], [34, 34, 38, 41], [33, 33, 36, 40]];      // Dm, Dm, Bb, A
    var chords = [[62, 65, 69, 72], [62, 65, 69, 72], [58, 62, 65, 68], [57, 61, 64, 67]];
    tone("sine", 38, t0, BAR * 4, 0.16, 400); tone("sawtooth", 26, t0, BAR * 4, 0.05, 240);   // the stake-out
    for (bar = 1; bar <= 20; bar++) {
      at = t0 + B(bar); var k = (bar - 1) % 4;
      for (i = 0; i < 8; i++) { if (bar <= 4) { if (i % 2 === 0) hit(at + i * e, 0.05, 0.05, 7000); } else if (bar < 19) hit(at + i * e, 0.045, i % 2 ? 0.035 : 0.07, 7500); }
      if (bar >= 3 && bar < 19) {
        for (i = 0; i < 4; i++) { tone("triangle", bass[k][i], at + i * q, q * 0.9, 0.3, 700); tone("sine", bass[k][i] - 12, at + i * q, q * 0.9, 0.2, 300); }
        hit(at + q, 0.09, 0.16, 1800, "bandpass"); hit(at + 3 * q, 0.09, 0.16, 1800, "bandpass");   // finger snaps on two and four
      }
      if (bar >= 5 && bar < 19) { thud(at, 0.5); thud(at + 2 * q + e, 0.3); }
      if (bar >= 5 && bar <= 8) { brass(chords[k], at, 0.16, 0.085); brass(chords[k], at + q + e, 0.5, 0.075); }
      if (bar >= 9 && bar <= 16) {                          // the tune, on a twangy guitar
        var tunes = [[[69, 0, 3], [74, 3, 2], [72, 5, 3]], [[72, 0, 2], [69, 2, 2], [65, 4, 4]], [[67, 0, 3], [70, 3, 2], [69, 5, 3]], [[69, 0, 2], [64, 2, 2], [61, 4, 4]]];
        var up = bar >= 13 ? 5 : 0, line = tunes[k];
        for (i = 0; i < line.length; i++) twang(line[i][0] + (k === 3 ? 0 : up), at + line[i][1] * e, line[i][2] * e * 1.25, 0.2);
        brass(chords[k], at + 3 * q + e, 0.14, 0.06);
      }
      if (bar === 17 || bar === 18) { brass(chords[0], at, 0.2, 0.09); brass(chords[0], at + q + e, 0.2, 0.09); brass([chords[0][0] + 12], at + 2 * q + e, 0.5, 0.08); twang(74, at, q * 3, 0.16); }
      if (bar === 19) { thud(at, 0.6); hit(at, 0.5, 0.12, 5000); brass([50, 57, 62, 65, 69, 76], at, BAR * 1.7, 0.06); twang(86, at + q, BAR * 1.2, 0.12); }
    }
    hit(t0 + B(5) - 0.02, 0.6, 0.14, 4000); hit(t0 + B(13) - 0.02, 0.5, 0.12, 4000);
  }

  /* ---------- running it ---------- */
  var playing = false, t0 = 0, shown = END - 0.01, raf = 0, clock = null;
  var btn = document.getElementById("promo-play"), snd = document.getElementById("promo-sound"), stage = cv.parentNode;
  function now() { return clock ? clock() - t0 : 0; }
  function frame() {
    if (!playing) return;
    var t = now();
    if (t >= END) { stop(true); return; }
    draw(t); raf = requestAnimationFrame(frame);
  }
  function stop(finished) {
    playing = false; cancelAnimationFrame(raf);
    if (ac) { try { ac.close(); } catch (e) {} ac = null; }
    draw(END - 0.01); stage.classList.remove("running"); btn.textContent = finished ? "Play it again" : "Play the trailer"; btn.hidden = false;
  }
  function play() {
    if (playing) return;
    var AC = window.AudioContext || window.webkitAudioContext; ac = null; clock = function () { return performance.now() / 1000; };
    if (AC) { try { ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.6; var lim = ac.createDynamicsCompressor(); lim.threshold.value = -14; lim.ratio.value = 8; lim.attack.value = 0.004; lim.release.value = 0.18; master.connect(lim); lim.connect(ac.destination); if (ac.resume) ac.resume(); clock = function () { return ac.currentTime; }; } catch (e) { ac = null; } }
    t0 = clock() + 0.12; if (ac) { try { score(t0); } catch (e) {} }
    playing = true; stage.classList.add("running"); btn.hidden = true; raf = requestAnimationFrame(frame);
  }
  btn.addEventListener("click", play);
  cv.addEventListener("click", function () { if (playing) stop(false); else play(); });
  snd.addEventListener("click", function () {
    muted = !muted; snd.textContent = muted ? "Sound: off" : "Sound: on"; snd.setAttribute("aria-pressed", muted ? "true" : "false");
    if (master && ac) master.gain.setValueAtTime(muted ? 0 : 0.6, ac.currentTime);
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden && playing) stop(false); });
  function size() { var r = Math.min(window.devicePixelRatio || 1, 2), box = Math.min(stage.clientWidth || W, 1400), w = Math.max(320, Math.min(2560, Math.round(box * r))); if (w === cv.width) { if (!playing) draw(shown); return; } cv.width = w; cv.height = Math.round(w * H / W); if (!playing) draw(shown); }
  window.addEventListener("resize", size);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!playing) draw(shown); });
  window.__promo = { seek: function (t) { draw(t); }, end: END, bar: BAR };
  size();
})();
