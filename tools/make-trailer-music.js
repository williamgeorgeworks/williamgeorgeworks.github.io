#!/usr/bin/env node
/* Builds the music for the home-page trailer (promo.js): an original spy theme in D minor, played as
   drum and bass at 174 beats a minute. Every sound is made here from sums and noise; there are no samples.
   Tune and noises: Reginald Quill, who has never heard any of it.

   Usage, from the repo root:
     node tools/make-trailer-music.js /tmp/promo-theme.wav
     ffmpeg -y -i /tmp/promo-theme.wav -codec:a libmp3lame -b:a 160k promo-theme.mp3

   Bar numbers here are the same bar numbers promo.js cuts the pictures to. Change one, change both. */
"use strict";
const fs = require("fs");
const SR = 44100, BPM = 174, BEAT = 60 / BPM, BAR = BEAT * 4, STEP = BEAT / 4, BARS = 68;
const LEN = Math.ceil((BARS * BAR + 0.6) * SR);
const T = (bar, beat = 1) => (bar - 1) * BAR + (beat - 1) * BEAT;                   // seconds at a beat (1-based)
const S = (bar, step) => (bar - 1) * BAR + step * STEP + (step % 2 ? 0.045 * STEP : 0);   // seconds at a 16th, lightly swung
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

/* ---------- nuts and bolts ---------- */
function R(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function noise(n, seed) { const r = R(seed), o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = r() * 2 - 1; return o; }
function bus() { return { l: new Float32Array(LEN), r: new Float32Array(LEN) }; }
function put(b, sig, at, gain = 1, pan = 0) {
  const i0 = Math.round(at * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4) * 1.4142, gr = gain * Math.sin((pan + 1) * Math.PI / 4) * 1.4142;
  for (let i = 0; i < sig.length; i++) { const j = i0 + i; if (j < 0) continue; if (j >= LEN) break; b.l[j] += sig[i] * gl; b.r[j] += sig[i] * gr; }
}
function put2(b, st, at, gain = 1) {
  const i0 = Math.round(at * SR);
  for (let i = 0; i < st.l.length; i++) { const j = i0 + i; if (j < 0) continue; if (j >= LEN) break; b.l[j] += st.l[i] * gain; b.r[j] += st.r[i] * gain; }
}
function bq(x, type, f, q = 0.707, db = 0) {
  const w = 2 * Math.PI * Math.min(f, SR * 0.45) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q), A = Math.pow(10, db / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === "bp") { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else { b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; }
  const o = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; o[i] = y; }
  return o;
}
function svf(x, fc, q, mode = "lp") {                       // a filter whose cutoff may move: fc is a number or a function of the sample index
  const o = new Float32Array(x.length), k = 1 / q, fn = typeof fc === "function"; let ic1 = 0, ic2 = 0;
  for (let i = 0; i < x.length; i++) {
    const f = Math.max(20, Math.min(fn ? fc(i) : fc, SR * 0.45)), g = Math.tan(Math.PI * f / SR);
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2, v3 = x[i] - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2; o[i] = mode === "lp" ? v2 : mode === "bp" ? k * v1 : x[i] - k * v1 - v2;
  }
  return o;
}
function saw(n, fAt, ph = 0) {                              // band-limited sawtooth
  const o = new Float32Array(n), fn = typeof fAt === "function";
  for (let i = 0; i < n; i++) {
    const dt = (fn ? fAt(i) : fAt) / SR; let v = 2 * ph - 1;
    if (ph < dt) { const x = ph / dt; v -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; v -= x * x + x + x + 1; }
    o[i] = v; ph += dt; if (ph >= 1) ph -= 1;
  }
  return o;
}
function norm(x, peak = 1) { let m = 1e-9; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); const g = peak / m; for (let i = 0; i < x.length; i++) x[i] *= g; return x; }
function fadeOut(x, secs) { const n = Math.min(x.length, Math.floor(secs * SR)); for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; }
function rate(x, r) { const n = Math.floor(x.length / r), o = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * r, a = Math.floor(p), f = p - a; o[i] = x[a] * (1 - f) + (x[a + 1] || 0) * f; } return o; }
function reverse(x) { const o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = x[x.length - 1 - i]; return o; }

/* ---------- the drum kit ---------- */
function mkKick() {
  const n = Math.floor(0.36 * SR), o = new Float32Array(n), cl = bq(noise(n, 3), "hp", 2500); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 54 + 140 * Math.exp(-t / 0.024) + 90 * Math.exp(-t / 0.005); ph += 2 * Math.PI * f / SR;
    o[i] = Math.tanh((Math.sin(ph) * Math.min(1, t / 0.0012) * Math.exp(-t / 0.095) + cl[i] * 0.22 * Math.exp(-t / 0.003)) * 1.9);
  }
  return fadeOut(norm(o), 0.01);
}
function mkSnare() {
  const n = Math.floor(0.42 * SR), o = new Float32Array(n), nz = bq(bq(noise(n, 9), "hp", 1300), "lp", 9500), cr = bq(noise(n, 10), "bp", 4200, 1.2); let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; p1 += 2 * Math.PI * (186 + 130 * Math.exp(-t / 0.011)) / SR; p2 += 2 * Math.PI * 334 / SR;
    const tone = Math.sin(p1) * Math.exp(-t / 0.07) + 0.4 * Math.sin(p2) * Math.exp(-t / 0.04);
    const hiss = nz[i] * (0.85 * Math.exp(-t / 0.075) + 0.2 * Math.exp(-t / 0.2)) + cr[i] * 0.5 * Math.exp(-t / 0.03);
    o[i] = Math.tanh((0.8 * tone + 0.85 * hiss) * Math.min(1, t / 0.0008) * 1.7);
  }
  return fadeOut(norm(o), 0.02);
}
function metal(n, seed, mul = 1) {                         // the clangy part of a cymbal: six square waves that do not agree
  const fr = [205.3, 304.4, 369.6, 522.7, 540, 800], o = new Float32Array(n), r = R(seed);
  fr.forEach(f => { let ph = r(); const dt = f * 14.1 * mul / SR; for (let i = 0; i < n; i++) { o[i] += ph < 0.5 ? 1 : -1; ph += dt; if (ph >= 1) ph -= 1; } });
  return o;
}
function mkHat(tau, seed) {
  const n = Math.floor(Math.min(0.6, tau * 7 + 0.02) * SR), m = bq(bq(metal(n, seed), "hp", 7200), "hp", 7200), z = bq(noise(n, seed + 1), "hp", 8500), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = (m[i] * 0.16 + z[i] * 0.7) * Math.exp(-t / tau) * Math.min(1, t / 0.0006); }
  return fadeOut(norm(o), 0.005);
}
function mkRide(seed) {
  const n = Math.floor(0.9 * SR), m = bq(bq(metal(n, seed, 0.62), "hp", 4200), "lp", 11000), z = bq(noise(n, seed + 1), "bp", 7800, 0.8), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = (m[i] * 0.17 * (0.6 * Math.exp(-t / 0.04) + 0.4 * Math.exp(-t / 0.3)) + z[i] * 0.5 * Math.exp(-t / 0.2)) * Math.min(1, t / 0.0008); }
  return fadeOut(norm(o), 0.03);
}
function mkCrash(seed, secs = 2.6, tau = 0.75) {
  const n = Math.floor(secs * SR), mk = sd => { const m = bq(metal(n, sd, 0.8), "hp", 3600), z = bq(bq(noise(n, sd + 5), "hp", 3200), "lp", 13000), o = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / SR; o[i] = (m[i] * 0.09 + z[i] * 0.75) * (0.7 * Math.exp(-t / tau) + 0.3 * Math.exp(-t / (tau * 0.25))) * Math.min(1, t / 0.002); } return fadeOut(o, 0.2); };
  const l = mk(seed), r = mk(seed + 50); let m = 1e-9; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(l[i]), Math.abs(r[i])); for (let i = 0; i < n; i++) { l[i] /= m; r[i] /= m; }
  return { l, r };
}
function mkSnap() {
  const n = Math.floor(0.16 * SR), z = bq(noise(n, 77), "bp", 2300, 2.2), o = new Float32Array(n), d = Math.floor(0.012 * SR);
  for (let i = 0; i < n; i++) { const t = i / SR; o[i] = z[i] * 0.5 * Math.exp(-t / 0.006) + (i >= d ? z[i - d + 300] * Math.exp(-(t - 0.012) / 0.022) : 0); }
  return fadeOut(norm(o), 0.01);
}
function mkTom(f0) {
  const n = Math.floor(0.4 * SR), o = new Float32Array(n), z = bq(noise(n, f0), "lp", 900); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * f0 * (1 + 0.7 * Math.exp(-t / 0.03)) / SR; o[i] = Math.tanh((Math.sin(ph) * Math.exp(-t / 0.13) + z[i] * 0.3 * Math.exp(-t / 0.02)) * 1.5) * Math.min(1, t / 0.001); }
  return fadeOut(norm(o), 0.02);
}
function mkRim() {
  const n = Math.floor(0.07 * SR), o = new Float32Array(n), z = bq(noise(n, 41), "bp", 3000, 2); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * 1750 / SR; o[i] = (Math.sin(ph) * 0.8 + z[i] * 0.5) * Math.exp(-t / 0.011); }
  return norm(o);
}
function mkImpact() {
  const n = Math.floor(2.4 * SR), o = new Float32Array(n), z = bq(noise(n, 5), "lp", 240), c = bq(noise(n, 6), "bp", 1400, 0.7); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (40 + 55 * Math.exp(-t / 0.07)) / SR;
    o[i] = Math.tanh((Math.sin(ph) * Math.exp(-t / 0.6) + z[i] * 1.6 * Math.exp(-t / 0.16) + c[i] * 0.5 * Math.exp(-t / 0.05)) * 1.5) * Math.min(1, t / 0.002); }
  return fadeOut(norm(o), 0.3);
}
function riser(secs, seed) {
  const n = Math.floor(secs * SR), mk = sd => { const z = svf(noise(n, sd), i => 350 * Math.pow(30, Math.pow(i / n, 1.3)), 2.2, "bp"), s = bq(saw(n, i => 147 * Math.pow(2, 2 * i / n)), "lp", 2400), o = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i / n; o[i] = (z[i] * 1.2 + s[i] * 0.22) * p * p; } return fadeOut(o, 0.012); };
  return { l: mk(seed), r: mk(seed + 1) };
}

/* ---------- things with a pitch ---------- */
function pluck(midi, secs, o = {}) {                       // a plucked string (Karplus and Strong), with a wobble bar
  const f = hz(midi), n = Math.floor(secs * SR), out = new Float32Array(n), size = 1 << Math.ceil(Math.log2(SR / f * 1.3 + 8)), mask = size - 1, ring = new Float32Array(size);
  const P = Math.round(SR / f), bright = o.bright == null ? 0.7 : o.bright, s = 0.5 * (1 - bright), sus = o.sustain || 0.997, vib = o.vib || 0, vr = o.vibRate || 5.8, vd = o.vibDelay == null ? 0.16 : o.vibDelay;
  let exc = noise(P + 2, (o.seed || 1) * 7919 + midi); exc = bq(exc, "lp", Math.min(SR * 0.4, 1500 + 9000 * bright));
  const k = Math.max(1, Math.round((o.pick || 0.13) * P)), e2 = new Float32Array(P); for (let i = 0; i < P; i++) e2[i] = exc[i] - (i >= k ? exc[i - k] : 0);
  let prev = 0, w = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR; let ff = f;
    if (vib && t > vd) ff *= 1 + vib * Math.sin(2 * Math.PI * vr * (t - vd)) * Math.min(1, (t - vd) / 0.15);
    if (o.bend) ff *= Math.pow(2, o.bend(t) / 12);
    const d = SR / ff - s, rp = w - d + size * 4, i0 = Math.floor(rp), fr = rp - i0, y = ring[i0 & mask] * (1 - fr) + ring[(i0 + 1) & mask] * fr;
    const lp = (1 - s) * y + s * prev; prev = y; ring[w & mask] = (i < P ? e2[i] : 0) + lp * sus; out[i] = y; w++;
  }
  return out;
}
function twang(midi, secs, o = {}) {                       // the spy guitar: bright string, a little grit, wobble bar
  let y = pluck(midi, secs + 0.12, { bright: o.bright == null ? 0.8 : o.bright, sustain: o.sustain || 0.9978, vib: o.vib == null ? 0.0045 : o.vib, vibRate: 5.6, vibDelay: 0.2, pick: 0.12, seed: o.seed, bend: o.bend });
  norm(y); y = bq(bq(y, "hp", 150), "pk", 2500, 1.0, 5); for (let i = 0; i < y.length; i++) y[i] = Math.tanh(y[i] * 1.9); y = bq(y, "lp", 5600, 0.8);
  const rel = Math.floor(0.09 * SR), n0 = Math.floor(secs * SR);
  for (let i = 0; i < y.length; i++) { const t = i / SR; let a = Math.min(1, t / 0.002); if (i > n0) a *= Math.max(0, 1 - (i - n0) / rel); if (o.trem) a *= 1 - o.trem * (0.5 + 0.5 * Math.sin(2 * Math.PI * 6.2 * t - 1.2)); y[i] *= a; }
  return norm(y);
}
function upright(midi, secs) {
  let y = bq(pluck(midi, secs + 0.05, { bright: 0.3, sustain: 0.9935, pick: 0.22, seed: 3 }), "lp", 1300); norm(y); let ph = 0; const f = hz(midi);
  for (let i = 0; i < y.length; i++) { const t = i / SR; ph += 2 * Math.PI * f / SR; y[i] = Math.tanh((y[i] * 0.8 + Math.sin(ph) * 0.7 * Math.exp(-t / 0.4)) * 1.3) * Math.min(1, t / 0.003); }
  return fadeOut(norm(y), 0.06);
}
function brassNote(midi, secs, vel, o = {}) {
  const tail = o.fall ? 0.26 : 0.07, n = Math.floor((secs + tail) * SR), f = hz(midi), r = R(midi * 131 + Math.floor(secs * 1000));
  const fAt = det => i => {
    const t = i / SR; let m = Math.pow(2, -0.7 * Math.exp(-t / 0.016) / 12);
    if (o.fall && t > secs * 0.45) { const p = (t - secs * 0.45) / (secs * 0.55 + tail); m *= Math.pow(2, -10 * p * p / 12); }
    if (o.shake && t > 0.07) m *= Math.pow(2, (0.5 + 0.5 * Math.sin(2 * Math.PI * 10.5 * t)) * 1.6 / 12);
    if (secs > 0.45 && t > 0.2) m *= 1 + 0.0045 * Math.sin(2 * Math.PI * 5.4 * t) * Math.min(1, (t - 0.2) / 0.3);
    return f * m * det;
  };
  const a = saw(n, fAt(Math.pow(2, 5 / 1200)), r()), b = saw(n, fAt(Math.pow(2, -6 / 1200)), r()), x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = (a[i] + b[i]) * 0.5;
  const cut = i => { const t = i / SR, e = t < 0.028 ? t / 0.028 : 0.5 + 0.5 * Math.exp(-(t - 0.028) / 0.13), sw = o.swell ? 0.45 + 0.55 * Math.min(1, t / secs) : 1; return 280 + (700 + 5000 * vel) * e * sw * (t > secs ? Math.exp(-(t - secs) / 0.05) : 1); };
  let y = bq(bq(svf(x, cut, 0.95, "lp"), "pk", 1350, 1.0, 4), "hp", Math.max(110, f * 0.45));
  for (let i = 0; i < n; i++) { const t = i / SR; let amp = Math.min(1, t / 0.012); if (o.swell) amp *= 0.4 + 0.6 * Math.min(1, t / secs); if (t > secs) amp *= Math.max(0, 1 - (t - secs) / tail); y[i] = Math.tanh(y[i] * 1.5) * amp; }
  return y;
}
function reese(midi, secs, o = {}) {                       // the growling bass: three saws slightly out of tune with each other
  const n = Math.floor((secs + 0.02) * SR), f = hz(midi), r = R(midi * 17 + Math.floor((o.at || 0) * 1000)), x = new Float32Array(n);
  const a = saw(n, f, r()), b = saw(n, f * Math.pow(2, 14 / 1200), r()), c = saw(n, f * Math.pow(2, -11 / 1200), r()), d = saw(n, f * 2, r());
  for (let i = 0; i < n; i++) x[i] = (a[i] + b[i] + c[i]) / 3 + d[i] * 0.3;
  const open = o.open == null ? 1 : o.open, wob = o.wob || 0, at = o.at || 0, cf = o.cut;
  const cut = cf || (i => { const t = i / SR; return 230 + open * (1000 * Math.exp(-t / 0.085) + 420) + wob * 900 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (at + t) / (BEAT * 0.75))); });
  let y = svf(x, cut, 1.5, "lp"); for (let i = 0; i < n; i++) y[i] = Math.tanh(y[i] * 2.4);
  y = bq(bq(y, "lp", 3400), "hp", 90);
  const n0 = Math.floor(secs * SR); for (let i = 0; i < n; i++) { let amp = Math.min(1, i / (0.005 * SR)); if (i > n0) amp *= Math.max(0, 1 - (i - n0) / (0.018 * SR)); y[i] *= amp; }
  return y;
}
function subNote(midi, secs) {
  const f = hz(midi <= 45 ? midi : midi - 12), n = Math.floor((secs + 0.03) * SR), o = new Float32Array(n), n0 = Math.floor(secs * SR); let ph = 0;
  for (let i = 0; i < n; i++) { ph += 2 * Math.PI * f / SR; let amp = Math.min(1, i / (0.008 * SR)); if (i > n0) amp *= Math.max(0, 1 - (i - n0) / (0.028 * SR)); o[i] = Math.tanh(Math.sin(ph) * 1.3) * amp; }
  return o;
}
function padChord(notes, secs, o = {}) {
  const att = o.att || 0.9, rel = o.rel || 1.2, n = Math.floor((secs + rel) * SR), l = new Float32Array(n), rr = new Float32Array(n), r = R(notes[0] * 31 + notes.length);
  notes.forEach((m, k) => {
    const f = hz(m), a = saw(n, f * Math.pow(2, 7 / 1200), r()), b = saw(n, f * Math.pow(2, -8 / 1200), r()); let x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = a[i] + b[i];
    x = bq(x, "lp", o.cut || 1200, 0.7); const pan = notes.length > 1 ? (k / (notes.length - 1) - 0.5) * 1.2 * (k % 2 ? 1 : -1) : 0, gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < n; i++) { const t = i / SR, e = Math.min(1, t / att) * (t > secs ? Math.max(0, 1 - (t - secs) / rel) : 1); l[i] += x[i] * e * gl; rr[i] += x[i] * e * gr; }
  });
  const g = 0.5 / Math.sqrt(notes.length); for (let i = 0; i < n; i++) { l[i] *= g; rr[i] *= g; }
  return { l, r: rr };
}
function vibe(midi, secs = 1.6) {
  const n = Math.floor(secs * SR), f = hz(midi), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, w = 2 * Math.PI * f * t; o[i] = (Math.sin(w) + 0.32 * Math.sin(4 * w) * Math.exp(-t / 0.2) + 0.1 * Math.sin(10 * w) * Math.exp(-t / 0.04)) * Math.exp(-t / 0.75) * (1 + 0.28 * Math.sin(2 * Math.PI * 5.2 * t)) * Math.min(1, t / 0.002); }
  return fadeOut(norm(o), 0.1);
}
function bell() {
  const n = Math.floor(2.2 * SR), f = 2093, o = new Float32Array(n), ps = [[1, 1, 0.9], [2.76, 0.55, 0.5], [5.4, 0.22, 0.25], [8.93, 0.1, 0.12]];
  for (let i = 0; i < n; i++) { const t = i / SR; let v = 0; ps.forEach(p => { v += Math.sin(2 * Math.PI * f * p[0] * t) * p[1] * Math.exp(-t / p[2]); }); o[i] = v * Math.min(1, t / 0.0008); }
  return fadeOut(norm(o), 0.2);
}
function whistle(secs, f0, f1) {                           // a slide whistle, for the avoidance of dignity
  const n = Math.floor(secs * SR), o = new Float32Array(n), fq = i => { const p = i / n, t = i / SR; return f0 * Math.pow(f1 / f0, Math.pow(p, 1.7)) * (1 + 0.013 * p * Math.sin(2 * Math.PI * 6.8 * t)); };
  const br = svf(noise(n, 61), fq, 5, "bp"); let ph = 0;
  for (let i = 0; i < n; i++) { ph += 2 * Math.PI * fq(i) / SR; const t = i / SR; o[i] = (Math.sin(ph) + 0.17 * Math.sin(2 * ph) + 0.05 * Math.sin(3 * ph) + br[i] * 0.35) * Math.min(1, t / 0.03) * Math.min(1, (secs - t) / 0.03); }
  return norm(o);
}
function meow(secs = 0.64, pitch = 1) {                     // a cat, more or less: a rising and falling note pushed through "ee-ah-oo"
  const n = Math.floor(secs * SR), f0 = i => { const p = i / n; return pitch * (p < 0.2 ? 470 + 270 * Math.sin(p / 0.2 * Math.PI / 2) : 740 - 320 * Math.pow((p - 0.2) / 0.8, 1.4)) * (1 + 0.01 * Math.sin(2 * Math.PI * 29 * i / SR) * p); };
  const src = bq(saw(n, f0), "lp", 3600, 0.7), br = bq(noise(n, 88), "hp", 2500);
  const F1 = i => { const p = i / n; return p < 0.25 ? 520 + 640 * (p / 0.25) : 1160 - 720 * Math.pow((p - 0.25) / 0.75, 1.2); };
  const F2 = i => { const p = i / n; return p < 0.25 ? 2750 - 750 * (p / 0.25) : 2000 - 1050 * Math.pow((p - 0.25) / 0.75, 1.1); };
  const a = svf(src, F1, 7, "bp"), b = svf(src, F2, 9, "bp"), c = bq(src, "bp", 3400, 5), o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = i / n, e = Math.pow(Math.sin(Math.PI * Math.min(1, p / 0.22) / 2), 1.5) * (p > 0.72 ? Math.pow(Math.cos(Math.PI * (p - 0.72) / 0.56), 1.3) : 1); o[i] = (a[i] + 0.65 * b[i] + 0.22 * c[i] + 0.06 * src[i] + br[i] * 0.02) * e; }
  return norm(o);
}

/* ---------- the desk ---------- */
const B = {}; ["drums", "bass", "sub", "brass", "lead", "pad", "fx", "rev", "dly"].forEach(k => { B[k] = bus(); });
const duck = new Float32Array(LEN).fill(1);
const KICK = mkKick(), SNARE = mkSnare(), HATC = mkHat(0.017, 21), HATO = mkHat(0.1, 23), RIDE = mkRide(31), CRASH = mkCrash(11), SPLASH = mkCrash(71, 1.3, 0.3), CHOKE = mkCrash(91, 0.5, 0.09),
  SNAP = mkSnap(), TOMH = mkTom(178), TOMM = mkTom(132), TOML = mkTom(96), RIM = mkRim(), IMPACT = mkImpact(), SNGH = bq(SNARE, "lp", 4500);
const REVC = { l: reverse(CRASH.l.subarray(0, Math.floor(1.5 * SR))), r: reverse(CRASH.r.subarray(0, Math.floor(1.5 * SR))) };
function kick(t, g = 1, d = true) { put(B.drums, KICK, t, 0.95 * g); if (d) { const i0 = Math.round(t * SR), n = Math.floor(0.17 * SR), dep = 0.62 * Math.min(1, g); for (let i = 0; i < n && i0 + i < LEN; i++) { const v = 1 - dep * (1 - Math.pow(i / n, 1.6)); if (v < duck[i0 + i]) duck[i0 + i] = v; } } }
function snare(t, g = 1, pitch = 1) { const s = pitch === 1 ? (g < 0.35 ? SNGH : SNARE) : rate(SNARE, pitch); put(B.drums, s, t, 0.8 * g); put(B.rev, s, t, 0.11 * g); }
function hat(t, g, open) { put(B.drums, open ? HATO : HATC, t, 0.17 * g, 0.22); }
function ride(t, g) { put(B.drums, RIDE, t, 0.1 * g, -0.3); }
function tom(t, w, g = 0.6) { put(B.drums, w === 0 ? TOMH : w === 1 ? TOMM : TOML, t, g, w === 0 ? -0.4 : w === 1 ? 0.1 : 0.45); put(B.rev, w === 0 ? TOMH : w === 1 ? TOMM : TOML, t, g * 0.1); }
function crash(t, g = 1, which) { const c = which || CRASH; put2(B.drums, c, t, 0.26 * g); put2(B.rev, c, t, 0.05 * g); }
function impact(t, g = 1) { put(B.fx, IMPACT, t, 0.85 * g); put(B.rev, IMPACT, t, 0.14 * g); }
function snap(t, g = 1) { put(B.drums, SNAP, t, 0.5 * g, 0.15); put(B.rev, SNAP, t, 0.22 * g); }
function rim(t, g = 1) { put(B.drums, RIM, t, 0.3 * g, -0.2); put(B.rev, RIM, t, 0.12 * g); }
function lead(y, t, g = 1, pan = 0, wet = 1) { put(B.lead, y, t, 0.42 * g, pan); put(B.dly, y, t, 0.15 * g * wet); put(B.rev, y, t, 0.1 * g * wet); }
function brass(notes, t, secs, vel = 0.8, o = {}, lvl = 1) {
  const g = lvl * 0.3 / Math.sqrt(notes.length) * (0.55 + 0.45 * vel);
  notes.forEach((m, k) => { const y = brassNote(m, secs, vel, o), pan = notes.length > 1 ? (k / (notes.length - 1) - 0.5) * 0.8 : 0; put(B.brass, y, t, g, pan); put(B.rev, y, t, g * 0.2); });
}
function bassNote(midi, t, secs, o = {}) { put(B.bass, reese(midi, secs, Object.assign({ at: t }, o)), t, 0.26 * (o.g || 1)); put(B.sub, subNote(midi, secs), t, 0.3 * (o.g || 1)); }
function snareRoll(bar, fromStep, toStep, g0, g1, p0 = 1, p1 = 1, div = 1) {   // div 2 = thirty-second notes
  const n = (toStep - fromStep) * div; for (let k = 0; k < n; k++) { const p = n > 1 ? k / (n - 1) : 1; snare((bar - 1) * BAR + (fromStep + k / div) * STEP, g0 + (g1 - g0) * p, p0 + (p1 - p0) * p); }
}

/* ---------- the tune ---------- */
const CYC = [{ ch: [62, 65, 69, 72, 76] }, { ch: [62, 65, 69, 72, 76] }, { ch: [58, 62, 65, 69, 72] }, { ch: [57, 61, 64, 67, 73] }];   // Dm9, Dm9, B flat major 9, A7: two bars each
const BASS = [
  [[38, 0, 3], [38, 3, 3], [50, 6, 2], [38, 8, 2], [38, 10, 3], [45, 13, 3]],
  [[38, 0, 3], [38, 3, 3], [50, 6, 2], [38, 8, 2], [41, 10, 2], [43, 12, 2], [45, 14, 2]],
  [[38, 0, 3], [38, 3, 3], [50, 6, 2], [38, 8, 2], [38, 10, 3], [48, 13, 3]],
  [[38, 0, 3], [38, 3, 3], [50, 6, 2], [38, 8, 2], [41, 10, 2], [38, 12, 2], [36, 14, 2]],
  [[34, 0, 3], [34, 3, 3], [46, 6, 2], [34, 8, 2], [34, 10, 3], [41, 13, 3]],
  [[34, 0, 3], [34, 3, 3], [46, 6, 2], [34, 8, 2], [38, 10, 2], [36, 12, 2], [34, 14, 2]],
  [[33, 0, 3], [33, 3, 3], [45, 6, 2], [33, 8, 2], [33, 10, 3], [40, 13, 3]],
  [[33, 0, 3], [33, 3, 3], [45, 6, 2], [33, 8, 2], [37, 10, 2], [40, 12, 2], [43, 14, 2]]
];
const THEME = [[[69, 0, 3], [74, 3, 2], [72, 5, 3]], [[72, 0, 2], [69, 2, 2], [65, 4, 4]], [[67, 0, 3], [70, 3, 2], [69, 5, 3]], [[69, 0, 2], [64, 2, 2], [61, 4, 2.4]]];   // [note, beat, beats] in each two-bar chord
const RUN = [64, 67, 69, 73, 76, 81];                       // the scramble up to the next chorus
const RIFF = [                                               // the brass tune of the second chorus: [note, step of 32, steps, fall or shake]
  [[62, 0, 2], [62, 3, 1], [65, 4, 2], [67, 6, 2], [69, 8, 3], [65, 12, 1], [67, 14, 2], [69, 16, 2], [69, 19, 1], [72, 20, 2], [69, 22, 2], [74, 24, 5, 1]],
  [[62, 0, 2], [62, 3, 1], [65, 4, 2], [67, 6, 2], [69, 8, 3], [65, 12, 1], [67, 14, 2], [69, 16, 2], [69, 19, 1], [72, 20, 2], [74, 22, 2], [77, 24, 5, 1]],
  [[58, 0, 2], [58, 3, 1], [62, 4, 2], [65, 6, 2], [67, 8, 3], [65, 12, 1], [67, 14, 2], [70, 16, 2], [70, 19, 1], [72, 20, 2], [70, 22, 2], [74, 24, 5, 1]],
  [[57, 0, 2], [57, 3, 1], [61, 4, 2], [64, 6, 2], [67, 8, 3], [64, 12, 1], [67, 14, 2], [69, 16, 2], [69, 19, 1], [73, 20, 2], [76, 22, 2], [81, 24, 6, 2]]
];
function bassCycle(start, o = {}, bars = 8) { for (let b = 0; b < bars; b++) BASS[b].forEach(e => bassNote(e[0], S(start + b, e[1]), e[2] * STEP * 0.92, { wob: o.wob || 0, open: e[1] === 0 ? 1.25 : 1, g: o.g })); }
function themeCycle(start, o = {}, chords = 4) {
  const up = o.up || 0, g = o.g || 1;
  for (let c = 0; c < chords; c++) THEME[c].forEach((e, k) => {
    const t = T(start + c * 2) + e[1] * BEAT, secs = e[2] * BEAT;
    if (o.trem) { const n = Math.round(e[2] * 4); for (let j = 0; j < n; j++) lead(twang(e[0] + up, STEP * 1.5, { seed: c * 100 + k * 10 + j, vib: 0 }), t + j * STEP, g * (j % 2 ? 0.55 : 0.85) * (j === 0 ? 1.15 : 1), 0.1); }
    else lead(twang(e[0] + up, secs, { seed: c * 10 + k }), t, g, 0.1);
    if (o.dbl) lead(twang(e[0] + up + 12, secs, { seed: c * 10 + k + 5 }), t + 0.008, g * 0.42, -0.25);
  });
  if (chords === 4 && !o.noRun) RUN.forEach((m, j) => lead(twang(m + up, STEP * 1.6, { seed: 900 + j, vib: 0 }), S(start + 7, 10 + j), g * (0.7 + 0.06 * j), 0.1));
}
function compCycle(start, o = {}, chords = 4) {             // the brass punctuation
  const tb = o.low ? 1 : 0;
  for (let c = 0; c < chords; c++) {
    const ch = CYC[c].ch, a = start + c * 2, b = a + 1, low = [ch[0] - 12], hitA = (s, d, v, oo) => { brass(ch, S(a, s), d, v, oo); if (tb) brass(low, S(a, s), d, v, oo); }, hitB = (s, d, v, oo) => { brass(ch, S(b, s), d, v, oo); if (tb) brass(low, S(b, s), d, v, oo); };
    hitA(0, 0.13, 0.9); hitA(10, 0.1, 0.6); hitB(3, 0.09, 0.5);
    if (c === 3 && !o.noFall) hitB(6, 0.42, 0.85, { fall: true }); else { hitB(6, 0.11, 0.65); hitB(14, 0.14, 0.8); }
  }
}
function riffCycle(start) {
  for (let c = 0; c < 4; c++) RIFF[c].forEach(e => { const t = S(start + c * 2 + Math.floor(e[1] / 16), e[1] % 16), d = e[2] * STEP * 0.8, oo = e[3] === 1 ? { fall: true } : e[3] === 2 ? { shake: true } : {}; brass([e[0], e[0] - 12], t, d, 0.8, oo, 0.72); brass([e[0] + 12], t, d, 0.5, oo, 0.6); });
}
function dnb(bar, o = {}) {
  const ev = bar % 2 === 0, lim = o.fill ? 8 : 16, g = o.g || 1;
  [[0, 1], [10, 0.92]].concat(ev ? [[7, 0.68]] : []).forEach(e => { if (e[0] < lim) kick(S(bar, e[0]), e[1] * g); });
  [[4, 1], [12, 1]].forEach(e => { if (e[0] < lim) snare(S(bar, e[0]), g); });
  (ev ? [[9, 0.2], [14, 0.16], [15, 0.26]] : [[7, 0.2], [15, 0.22]]).forEach(e => { if (e[0] < lim) snare(S(bar, e[0]), e[1] * g); });
  for (let s = 0; s < 16; s++) { if (s >= lim && o.fill === 2) continue; const open = (ev && s === 6) || (!ev && s === 14); hat(S(bar, s), (s % 2 ? 0.34 : (s % 4 ? 0.66 : 0.9)) * g, open); }
  if (o.ride) for (let s = 0; s < 16; s += 2) ride(S(bar, s), s % 4 ? 0.55 : 0.95);
  if (o.perc) [[1, 0], [3, 1], [6, 0], [9, 1], [11, 0], [14, 2]].forEach(e => tom(S(bar, e[0]), e[1], 0.2));
  if (o.fill === 1) { kick(S(bar, 8), 0.85); [8, 10, 11, 12, 13, 14, 15].forEach((s, i) => snare(S(bar, s), 0.42 + 0.08 * i)); tom(S(bar, 13), 0, 0.5); tom(S(bar, 14), 1, 0.55); tom(S(bar, 15), 2, 0.6); }
  if (o.fill === 2) { kick(S(bar, 8), 0.9); kick(S(bar, 12), 0.9); snareRoll(bar, 8, 16, 0.4, 0.85); tom(S(bar, 10), 0, 0.45); tom(S(bar, 11), 0, 0.45); tom(S(bar, 12), 1, 0.5); tom(S(bar, 13), 1, 0.5); tom(S(bar, 14), 2, 0.55); tom(S(bar, 15), 2, 0.6); }
  if (o.fill === 3) { snare(S(bar, 14), 0.5); snare(S(bar, 15), 0.7); tom(S(bar, 13), 1, 0.4); }
}
function halfTime(bar, g = 1, o = {}) { kick(S(bar, 0), g); if (o.push) kick(S(bar, 10), 0.6 * g); snare(S(bar, 8), g); for (let s = 0; s < 16; s += 2) hat(S(bar, s), (s % 4 ? 0.5 : 0.85) * g, s === 14); if (o.ride) for (let s = 0; s < 16; s += 4) ride(S(bar, s), 0.9); }

/* ---------- the arrangement. Bar numbers match promo.js ---------- */
// 1 to 8: night. A stake-out, at half speed.
(function intro() {
  const n = Math.floor(8 * BAR * SR), a = bq(saw(n, hz(26)), "lp", 170), b = bq(saw(n, hz(38) * 1.003), "lp", 320), d = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * hz(38) / SR; d[i] = (Math.sin(ph) * 0.55 + a[i] * 0.5 + b[i] * 0.3 * (0.6 + 0.4 * Math.sin(2 * Math.PI * t / (BAR * 2)))) * Math.min(1, t / 1.6) * Math.min(1, (8 * BAR - t) / 0.5); }
  put(B.pad, d, 0, 0.22);
  lead(twang(50, BAR * 1.6, { trem: 0.55, vib: 0.006, bright: 0.6, seed: 1 }), T(1, 1), 1.3, 0, 1.6); lead(twang(38, BAR * 1.6, { trem: 0.55, bright: 0.5, seed: 2 }), T(1, 1), 0.7, 0, 1);
  lead(twang(57, BEAT * 3, { trem: 0.5, vib: 0.006, bright: 0.6, seed: 3 }), T(2, 3), 1.0, 0, 1.6);
  [[57, 0, 3], [62, 3, 2], [60, 5, 3]].forEach((e, k) => lead(twang(e[0], e[2] * BEAT, { trem: 0.45, seed: 20 + k, bright: 0.7 }), T(3) + e[1] * BEAT, 1.2, 0.1, 1.5));
  for (let bar = 3; bar <= 8; bar++) { snap(T(bar, 3), bar < 5 ? 0.7 : 1); for (let s = 0; s < 16; s += 2) hat(S(bar, s), s % 4 ? 0.3 : 0.5); }
  for (let bar = 5; bar <= 8; bar++) { kick(T(bar, 1), 0.62); if (bar % 2 === 0) kick(S(bar, 14), 0.45); }
  [[38, 38], [41, 43], [45, 45], [43, 41]].forEach((p, k) => p.forEach((m, j) => { const y = upright(m, BEAT * 1.9); put(B.bass, y, T(5 + k, 1 + j * 2), 0.4); }));
  put2(B.pad, padChord([50, 57, 62, 65, 69, 76], BAR * 3.6, { att: 1.4, rel: 0.6, cut: 1000 }), T(5), 0.42);
  [62, 65, 69, 72, 76].forEach((m, j) => { const v = vibe(m); put(B.pad, v, T(5, 1) + j * BEAT / 2, 0.2, j % 2 ? 0.4 : -0.4); put(B.rev, v, T(5, 1) + j * BEAT / 2, 0.1); });
  [74, 72, 69, 65].forEach((m, j) => { const v = vibe(m); put(B.pad, v, T(7, 1) + j * BEAT / 2, 0.18, j % 2 ? -0.4 : 0.4); put(B.rev, v, T(7, 1) + j * BEAT / 2, 0.1); });
  THEME[0].forEach((e, k) => lead(twang(e[0], e[2] * BEAT, { seed: 40 + k, trem: 0.25 }), T(5) + e[1] * BEAT, 1.35, 0.1, 1.3));
  [[72, 0, 2], [69, 2, 2], [65, 4, 3]].forEach((e, k) => lead(twang(e[0], e[2] * BEAT, { seed: 50 + k, trem: 0.25 }), T(7) + e[1] * BEAT, 1.35, 0.1, 1.3));
  put2(B.fx, REVC, T(9) - 1.5, 0.2);
})();
// 9 to 12: one human, two machines, six cats. Three slams, a roll, and a gap for the cat.
(function build1() {
  [[9, [62, 65, 69, 74], 50], [10, [65, 69, 72, 77], 53], [11, [64, 67, 70, 73, 76], 45]].forEach(e => { impact(T(e[0]), 0.95); brass(e[1], T(e[0]), 0.5, 0.95); brass([e[2], e[2] - 12], T(e[0]), 0.55, 0.9); kick(T(e[0]), 1, false); crash(T(e[0]), 0.55, SPLASH); });
  snare(T(9, 3), 0.5); for (let b = 2; b <= 4; b++) snare(T(10, b), 0.5 + 0.03 * b);
  snareRoll(11, 0, 16, 0.45, 0.72, 1, 1.06, 0.5); snareRoll(12, 0, 4, 0.6, 0.85, 1.06, 1.2); snareRoll(12, 4, 8, 0.8, 1.0, 1.2, 1.4, 2);
  const secs = T(12, 3) - T(11, 1), r = riser(secs, 4); put2(B.fx, r, T(11, 1), 0.3); put2(B.rev, r, T(11, 1), 0.04);
  const n = Math.floor((T(12, 3) - T(9, 1)) * SR); put(B.bass, reese(38, n / SR - 0.02, { cut: i => 180 + 1700 * Math.pow(i / n, 2) }), T(9), 0.2); put(B.sub, subNote(38, n / SR - 0.02), T(9), 0.2);
  const m = meow(0.62); put(B.fx, m, T(12, 3) + 0.02, 0.42); put(B.rev, m, T(12, 3) + 0.02, 0.2);
})();
// 13 to 28: the first chorus. The cast, the bench, the books.
(function drop1() {
  impact(T(13), 0.75); crash(T(13)); crash(T(21)); crash(T(17), 0.8, SPLASH); crash(T(25), 0.8, SPLASH);
  for (let bar = 13; bar <= 28; bar++) dnb(bar, { fill: bar === 20 ? 1 : bar === 28 ? 2 : (bar === 16 || bar === 24) ? 3 : 0, ride: bar >= 21 });
  bassCycle(13); bassCycle(21, { wob: 0.4 });
  themeCycle(13); themeCycle(21, { dbl: true });
  compCycle(13); compCycle(21, { low: true });
})();
// 29 to 36: the Accord. Everything stops and behaves, then four slams and a slide whistle.
(function breakdown() {
  crash(T(29), 0.9); impact(T(29), 0.9);
  put2(B.pad, padChord([50, 57, 62, 65, 69, 76], BAR * 3.7, { att: 0.5, rel: 0.8 }), T(29), 0.6);
  put2(B.pad, padChord([46, 53, 58, 62, 65, 69], BAR * 1.8, { att: 0.4, rel: 0.6 }), T(33), 0.6);
  put2(B.pad, padChord([45, 52, 57, 62, 64, 67], BAR * 0.9, { att: 0.3, rel: 0.3 }), T(35), 0.6);
  put2(B.pad, padChord([45, 52, 57, 61, 64, 67, 70], BAR * 0.95, { att: 0.2, rel: 0.1, cut: 1800 }), T(36), 0.6);
  [[29, 38, 4], [33, 34, 2], [35, 33, 2]].forEach(e => put(B.sub, subNote(e[1], e[2] * BAR - 0.05), T(e[0]), 0.2));
  const arp = { 29: [62, 69, 65, 72, 69, 76, 72, 69], 33: [58, 65, 62, 69, 65, 72, 69, 65], 35: [57, 64, 61, 67, 64, 69, 67, 64] };
  for (let bar = 29; bar <= 35; bar++) { const p = arp[bar >= 35 ? 35 : bar >= 33 ? 33 : 29]; p.forEach((m, j) => { const v = vibe(m, 1.1); put(B.pad, v, T(bar, 1) + j * BEAT / 2, 0.2, j % 2 ? 0.45 : -0.45); put(B.rev, v, T(bar, 1) + j * BEAT / 2, 0.09); }); }
  [[57, 0, 3], [62, 3, 2], [60, 5, 3]].forEach((e, k) => lead(twang(e[0], e[2] * BEAT, { trem: 0.6, seed: 60 + k, bright: 0.65 }), T(29) + e[1] * BEAT, 1.6, 0.1, 1.5));
  [[60, 0, 2], [57, 2, 2], [53, 4, 4]].forEach((e, k) => lead(twang(e[0], e[2] * BEAT, { trem: 0.6, seed: 70 + k, bright: 0.65 }), T(31) + e[1] * BEAT, 1.6, 0.1, 1.5));
  for (let bar = 29; bar <= 32; bar++) { kick(S(bar, 0), 0.6); kick(S(bar, 3), 0.4); for (let s = 0; s < 16; s += 2) hat(S(bar, s), s % 4 ? 0.22 : 0.4); rim(T(bar, 3), 0.8); }
  [[33, [58, 62, 65, 70], 46], [34, [62, 65, 70, 74], 46], [35, [57, 61, 64, 69], 45], [36, [64, 67, 70, 73, 81], 45]].forEach(e => { impact(T(e[0]), 0.95); brass(e[1], T(e[0]), 0.5, 0.95); brass([e[2], e[2] - 12], T(e[0]), 0.55, 0.9); kick(T(e[0]), 1, false); crash(T(e[0]), 0.55, SPLASH); });
  snare(T(33, 3), 0.5); for (let b = 2; b <= 4; b++) snare(T(34, b), 0.5 + 0.03 * b);
  snareRoll(35, 0, 16, 0.45, 0.72, 1, 1.06, 0.5); snareRoll(36, 0, 8, 0.55, 0.8, 1.06, 1.2); snareRoll(36, 8, 12, 0.8, 0.9, 1.2, 1.3); snareRoll(36, 12, 16, 0.85, 1.0, 1.3, 1.45, 2);
  const secs = T(37) - T(35, 1), r = riser(secs, 8); put2(B.fx, r, T(35, 1), 0.26); put2(B.rev, r, T(35, 1), 0.04);
  const w = whistle(T(37) - T(36, 1.5) - 0.02, 480, 2300); put(B.fx, w, T(36, 1.5), 0.3, -0.1); put(B.rev, w, T(36, 1.5), 0.12);
})();
// 37 to 59: the second chorus. The whole site, at speed.
(function drop2() {
  impact(T(37), 0.85); crash(T(37)); crash(T(45)); crash(T(53)); [41, 49, 57].forEach(b => crash(T(b), 0.8, SPLASH));
  for (let bar = 37; bar <= 58; bar++) dnb(bar, { fill: bar === 44 ? 1 : bar === 52 ? 2 : (bar === 40 || bar === 48 || bar === 56) ? 3 : 0, ride: bar >= 45, perc: bar >= 53 });
  bassCycle(37, { wob: 0.7 }); bassCycle(45, { wob: 0.7 }); bassCycle(53, { wob: 1 }, 7);
  riffCycle(37);
  RUN.forEach((m, j) => lead(twang(m, STEP * 1.6, { seed: 950 + j, vib: 0 }), S(44, 10 + j), 0.7 + 0.06 * j, 0.1));
  themeCycle(45, { dbl: true }); compCycle(45, { low: true });
  themeCycle(53, { trem: true, up: 12, noRun: true }, 3); themeCycle(53, { noRun: true, g: 0.75 }, 3); compCycle(53, { low: true }, 3);
  // bar 59: everything at double speed, climbing
  for (let s = 0; s < 16; s++) hat(S(59, s), s % 2 ? 0.5 : 0.9); [0, 4, 8, 12].forEach(s => kick(S(59, s), 0.95)); [2, 6, 10].forEach(s => snare(S(59, s), 0.9)); snareRoll(59, 12, 16, 0.7, 1.0, 1, 1.25);
  [[57, 61, 64, 67], [61, 64, 67, 70], [64, 67, 70, 73], [67, 70, 73, 76]].forEach((c, b) => { brass(c, T(59, b + 1), 0.16, 0.85 + 0.05 * b); brass([45 + b * 3], T(59, b + 1), 0.16, 0.85); });
  THEME[3].slice(0, 2).forEach((e, k) => lead(twang(e[0] + 12, e[2] * BEAT, { seed: 990 + k }), T(59) + e[1] * BEAT, 0.9, 0.1));
})();
// 60 and 61: the stop. One thump, some ticking, and the cat again.
(function stop() {
  kick(T(60), 1, false); snare(T(60), 1); put2(B.drums, CHOKE, T(60), 0.3); brass([57, 61, 64, 67, 70, 76], T(60), 0.11, 1); brass([45, 33], T(60), 0.11, 1); bassNote(33, T(60), STEP * 1.5); impact(T(60), 0.5);
  [2, 3, 4].forEach(b => rim(T(60, b), 0.9));
  const m = meow(0.66, 1.06); put(B.fx, m, T(61, 1) + 0.02, 0.42); put(B.rev, m, T(61, 1) + 0.02, 0.22);
  put2(B.fx, REVC, T(62) - 1.5, 0.3); snareRoll(61, 12, 16, 0.5, 1.0); tom(S(61, 10), 1, 0.5); tom(S(61, 11), 2, 0.55);
})();
// 62 to 68: the name on the door. Half speed, big chords, two stabs and a desk bell.
(function finale() {
  impact(T(62), 1); crash(T(62), 1.1); crash(T(64), 0.7, SPLASH);
  for (let bar = 62; bar <= 65; bar++) halfTime(bar, 1, { push: true, ride: true });
  snareRoll(65, 12, 16, 0.5, 0.95); tom(S(65, 13), 0, 0.5); tom(S(65, 14), 1, 0.55); tom(S(65, 15), 2, 0.6);
  brass([50, 57, 62, 65, 69, 72, 76], T(62), BAR * 1.9, 0.9, { swell: true }); brass([38], T(62), BAR * 1.9, 0.9);
  brass([58, 62, 65, 69, 72], T(64), BAR * 0.92, 0.7, { swell: true }); brass([46, 34], T(64), BAR * 0.92, 0.8);
  brass([57, 61, 64, 67, 70], T(65), BAR * 0.92, 0.85, { swell: true }); brass([45, 33], T(65), BAR * 0.92, 0.9);
  [[62, 38, 0], [63, 38, 0], [64, 34, 0], [65, 33, 0]].forEach(e => { bassNote(e[1], T(e[0]), BEAT * 2.4, { wob: 0.5 }); bassNote(e[1], S(e[0], 10), BEAT * 1.4, { wob: 0.5 }); });
  [[74, 62, 1, 4], [77, 63, 1, 1.5], [76, 63, 2.5, 0.5], [74, 63, 3, 2], [74, 64, 1, 1.5], [72, 64, 2.5, 0.5], [70, 64, 3, 2], [69, 65, 1, 1.5], [73, 65, 2.5, 1.5], [76, 65, 4, 1]].forEach((e, k) => {
    lead(twang(e[0], e[3] * BEAT, { seed: 300 + k, vib: 0.006 }), T(e[1], e[2]), 1.05, 0.1); lead(twang(e[0] + 12, e[3] * BEAT, { seed: 320 + k }), T(e[1], e[2]) + 0.008, 0.45, -0.25); });
  // the two last stabs
  kick(T(66), 1, false); snare(T(66), 1); impact(T(66), 0.8); put2(B.drums, CHOKE, T(66), 0.3); brass([50, 57, 62, 65, 69, 76], T(66), 0.14, 1); brass([38, 26], T(66), 0.14, 1); bassNote(38, T(66), STEP * 2);
  const t2 = T(66, 2.5); kick(t2, 1, false); snare(t2, 1); impact(t2, 1); crash(t2, 1.2);
  brass([50, 57, 62, 65, 69, 74, 76, 81], t2, 1.5, 1); brass([38, 26], t2, 1.5, 1); bassNote(38, t2, 1.3, { open: 1.4 });
  const dive = t => t < 0.35 ? 0 : -2.5 * Math.min(1, (t - 0.35) / 1.1);
  lead(twang(74, 1.9, { seed: 400, bend: dive, vib: 0.008 }), t2, 1.1, 0.15, 1.5); lead(twang(62, 1.9, { seed: 401, bend: dive }), t2 + 0.012, 0.8, -0.15, 1.5); lead(twang(50, 1.9, { seed: 402, bend: dive, bright: 0.6 }), t2 + 0.024, 0.7, 0, 1.5);
  const b = bell(); put(B.fx, b, T(67, 3), 0.2, 0.2); put(B.rev, b, T(67, 3), 0.1);
})();

/* ---------- echo, room, and the master ---------- */
function pingPong(inp) {                                    // dotted-quaver echo bouncing left to right, plus a short slap
  const d = Math.round(0.75 * BEAT * SR), slap = Math.round(0.105 * SR), l = new Float32Array(LEN), r = new Float32Array(LEN), src = bq(bq(inp.l, "lp", 3600), "hp", 250); let lpL = 0, lpR = 0;
  for (let i = d; i < LEN; i++) { lpL += 0.45 * (src[i - d] + r[i - d] * 0.4 - lpL); lpR += 0.45 * (l[i - d] * 0.7 - lpR); l[i] = lpL; r[i] = lpR; }
  for (let i = LEN - 1; i >= slap; i--) { l[i] += src[i - slap] * 0.5; r[i] += src[i - slap] * 0.5; }
  return { l, r };
}
function freeverb(inp, room, damp) {
  const cT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aT = [556, 441, 341, 225], out = { l: new Float32Array(LEN), r: new Float32Array(LEN) };
  const pre = Math.round(0.018 * SR), mono = new Float32Array(LEN); for (let i = pre; i < LEN; i++) mono[i] = (inp.l[i - pre] + inp.r[i - pre]) * 0.5;
  const src = bq(bq(mono, "hp", 280), "lp", 7500);
  ["l", "r"].forEach((ch, c) => {
    const combs = cT.map(n => ({ b: new Float32Array(n + c * 23), i: 0, f: 0 })), aps = aT.map(n => ({ b: new Float32Array(n + c * 23), i: 0 })), o = out[ch];
    for (let n = 0; n < LEN; n++) {
      const x = src[n] * 0.03; let y = 0;
      for (let k = 0; k < 8; k++) { const cb = combs[k], v = cb.b[cb.i]; cb.f = v * (1 - damp) + cb.f * damp; cb.b[cb.i] = x + cb.f * room; if (++cb.i >= cb.b.length) cb.i = 0; y += v; }
      for (let k = 0; k < 4; k++) { const ap = aps[k], v = ap.b[ap.i], w = -y + v; ap.b[ap.i] = y + v * 0.5; if (++ap.i >= ap.b.length) ap.i = 0; y = w; }
      o[n] = y;
    }
  });
  return out;
}
const mix = { l: new Float32Array(LEN), r: new Float32Array(LEN) };
const wetD = pingPong(B.dly), wetR = freeverb(B.rev, 0.86, 0.3);
const stats = {};
function rms(st, a, b) { const i0 = Math.round(a * SR), i1 = Math.min(LEN, Math.round(b * SR)); let s = 0, pk = 0; for (let i = i0; i < i1; i++) { s += st.l[i] * st.l[i] + st.r[i] * st.r[i]; pk = Math.max(pk, Math.abs(st.l[i]), Math.abs(st.r[i])); } return [10 * Math.log10(s / (2 * (i1 - i0)) + 1e-12), 20 * Math.log10(pk + 1e-9)]; }
const SECTS = { intro: [T(1), T(9)], build: [T(9), T(13)], drop1: [T(13), T(29)], brk: [T(29), T(37)], drop2: [T(37), T(60)], out: [T(62), T(67)] };
const GAIN = { drums: 0.34, bass: 0.62, sub: 0.33, brass: 0.74, lead: 0.6, pad: 0.25, fx: 0.3 }, DUCK = { bass: 1, sub: 0.6, brass: 0.35, pad: 0.8, lead: 0.2 };
Object.keys(GAIN).forEach(k => { const b = B[k], dk = DUCK[k] || 0; for (let i = 0; i < LEN; i++) { const g = GAIN[k] * (1 - dk * (1 - duck[i])); mix.l[i] += b.l[i] * g; mix.r[i] += b.r[i] * g; } stats[k] = b; });
for (let i = 0; i < LEN; i++) { mix.l[i] += wetD.l[i] * 0.36 + wetR.l[i] * 0.58; mix.r[i] += wetD.r[i] * 0.36 + wetR.r[i] * 0.58; }
stats.echo = wetD; stats.room = wetR; stats.MIX = mix;
if (process.argv.includes("--stats")) { console.log("rms / peak in dB".padEnd(12), Object.keys(SECTS).map(s => s.padStart(15)).join("")); Object.keys(stats).forEach(k => console.log(k.padEnd(12), Object.keys(SECTS).map(s => { const v = rms(stats[k], SECTS[s][0], SECTS[s][1]); return (v[0].toFixed(1) + " /" + v[1].toFixed(1)).padStart(15); }).join(""))); }
// keep the lows in the middle, lift the whole thing, then a look-ahead limiter so nothing clips
mix.l = bq(mix.l, "hp", 36); mix.r = bq(mix.r, "hp", 36);
const PRE = Math.pow(10, (parseFloat((process.argv.find(a => a.startsWith("--pre=")) || "--pre=1.5").slice(6))) / 20), CEIL = 0.8, LOOK = Math.round(0.004 * SR);
const need = new Float32Array(LEN); for (let i = 0; i < LEN; i++) { mix.l[i] = Math.tanh(mix.l[i] * PRE * 0.7) / 0.7; mix.r[i] = Math.tanh(mix.r[i] * PRE * 0.7) / 0.7; const p = Math.max(Math.abs(mix.l[i]), Math.abs(mix.r[i])); need[i] = p > CEIL ? CEIL / p : 1; }
const held = new Float32Array(LEN); { let g = 1; const relc = 1 - Math.exp(-1 / (0.09 * SR)); const dq = []; let head = 0;      // minimum over the look-ahead window, then a slow release
  for (let i = 0; i < LEN + LOOK; i++) { if (i < LEN) { while (dq.length > head && need[dq[dq.length - 1]] >= need[i]) dq.pop(); dq.push(i); } const j = i - LOOK; if (j < 0) continue; while (dq[head] < j) head++; const m = need[dq[head]]; g = m < g ? m : g + (1 - g) * relc; if (g > m) g = m; held[j] = g; } }
{ let acc = 0; const sm = new Float32Array(LEN); for (let i = 0; i < LEN; i++) { acc += held[i]; if (i >= LOOK) acc -= held[i - LOOK]; sm[i] = acc / Math.min(i + 1, LOOK); } let gr = 0; for (let i = 0; i < LEN; i++) { const g = sm[i]; mix.l[i] *= g; mix.r[i] *= g; gr = Math.max(gr, 1 - g); } if (process.argv.includes("--stats")) console.log("limiter: deepest cut", (20 * Math.log10(1 - gr)).toFixed(1), "dB"); }
{ const f = Math.floor(0.5 * SR); for (let i = 0; i < f; i++) { const g = i / f; mix.l[LEN - 1 - i] *= g; mix.r[LEN - 1 - i] *= g; } }

/* ---------- write it down ---------- */
const out = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "promo-theme.wav";
const data = Buffer.alloc(LEN * 4); let clip = 0;
for (let i = 0; i < LEN; i++) { [mix.l[i], mix.r[i]].forEach((v, c) => { if (Math.abs(v) > 0.999) clip++; data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 32767))), i * 4 + c * 2); }); }
const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(data.length, 40);
fs.writeFileSync(out, Buffer.concat([h, data]));
console.log(out + ":", (LEN / SR).toFixed(2) + "s,", BARS, "bars at", BPM, "bpm, bar =", BAR.toFixed(4) + "s, clipped samples:", clip);
