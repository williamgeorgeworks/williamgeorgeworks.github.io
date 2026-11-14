/* The Weather Row: the numbers and the arguing.
   Pure functions, no network and no page. weather.js feeds this live data and draws the result.
   Terry's and Reggie's opinions are rules written by Reginald that react to the numbers on screen.
   Nobody is generating them live, and Terry has not seen them. */
(function (root) {
  "use strict";

  /* ---------- small helpers ---------- */
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  /* Local times from Open-Meteo arrive as "2026-11-14T15:00" with no offset. We keep them as "naive"
     milliseconds (the clock on the wall at the place), so nothing depends on the visitor's own timezone. */
  function parseNaive(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : NaN;
  }
  function fmtTime(ms) { var d = new Date(ms); return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()); }
  function dayKey(ms) { var d = new Date(ms); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function dayName(ms) { return DAYS[new Date(ms).getUTCDay()]; }
  function fmtWhen(ms, nowMs) {
    var t = fmtTime(ms);
    if (dayKey(ms) === dayKey(nowMs)) return t;
    if (dayKey(ms) === dayKey(nowMs + 864e5)) return "tomorrow " + t;
    return dayName(ms) + " " + t;
  }
  function fmtIn(ms, nowMs) {
    var mins = Math.round((ms - nowMs) / 60000), h = Math.floor(Math.abs(mins) / 60), m = Math.abs(mins) % 60;
    var s = h ? h + "h " + pad(m) + "m" : m + "m";
    return mins >= 0 ? "in " + s : s + " ago";
  }
  function compass(deg) { return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- WMO weather codes ---------- */
  function codeInfo(code) {
    var c = +code;
    if (c === 0) return { cat: "clear", text: "clear sky", icon: "clear" };
    if (c === 1) return { cat: "clear", text: "mainly clear", icon: "clear" };
    if (c === 2) return { cat: "partly", text: "partly cloudy", icon: "partly" };
    if (c === 3) return { cat: "overcast", text: "overcast", icon: "overcast" };
    if (c === 45 || c === 48) return { cat: "fog", text: c === 48 ? "freezing fog" : "fog", icon: "fog" };
    if (c >= 51 && c <= 55) return { cat: "drizzle", text: c === 51 ? "light drizzle" : c === 53 ? "drizzle" : "heavy drizzle", icon: "drizzle" };
    if (c === 56 || c === 57) return { cat: "drizzle", text: "freezing drizzle", icon: "drizzle" };
    if (c === 61) return { cat: "rain", text: "light rain", icon: "rain" };
    if (c === 63) return { cat: "rain", text: "rain", icon: "rain" };
    if (c === 65) return { cat: "rain", text: "heavy rain", icon: "rain" };
    if (c === 66 || c === 67) return { cat: "rain", text: "freezing rain", icon: "rain" };
    if (c === 71) return { cat: "snow", text: "light snow", icon: "snow" };
    if (c === 73) return { cat: "snow", text: "snow", icon: "snow" };
    if (c === 75) return { cat: "snow", text: "heavy snow", icon: "snow" };
    if (c === 77) return { cat: "snow", text: "snow grains", icon: "snow" };
    if (c === 80) return { cat: "showers", text: "light showers", icon: "shower" };
    if (c === 81) return { cat: "showers", text: "showers", icon: "shower" };
    if (c === 82) return { cat: "showers", text: "violent showers", icon: "shower" };
    if (c === 85 || c === 86) return { cat: "snow", text: "snow showers", icon: "snow" };
    if (c === 95) return { cat: "thunder", text: "thunderstorm", icon: "thunder" };
    if (c === 96 || c === 99) return { cat: "thunder", text: "thunderstorm with hail", icon: "thunder" };
    return { cat: "overcast", text: "unsettled", icon: "overcast" };
  }

  /* ---------- tides ----------
     The free source gives sea level every hour. A tide is a smooth wave, so we find the peaks and troughs
     and nudge each one to its true minute by fitting a parabola through the three hourly points around it. */
  function tideExtrema(times, heights) {
    var out = [], n = times.length;
    for (var i = 1; i < n - 1; i++) {
      var a = heights[i - 1], b = heights[i], c = heights[i + 1];
      if (a == null || b == null || c == null) continue;
      var hi = b > a && b >= c, lo = b < a && b <= c;
      if (!hi && !lo) continue;
      var den = a - 2 * b + c;
      var off = den !== 0 ? 0.5 * (a - c) / den : 0;
      off = clamp(off, -0.5, 0.5);
      var step = times[i + 1] - times[i];
      var peak = b - 0.25 * (a - c) * off;
      out.push({ type: hi ? "high" : "low", ms: Math.round(times[i] + off * step), height: peak });
    }
    return out;
  }
  /* Where are we in the tide right now? Interpolate smoothly between the hourly values. */
  function levelAt(times, heights, ms) {
    var n = times.length;
    for (var i = 0; i < n - 1; i++) {
      if (ms >= times[i] && ms <= times[i + 1] && heights[i] != null && heights[i + 1] != null) {
        var f = (ms - times[i]) / (times[i + 1] - times[i]);
        var s = (1 - Math.cos(Math.PI * f)) / 2;
        return heights[i] + (heights[i + 1] - heights[i]) * s;
      }
    }
    return null;
  }
  function tideState(times, heights, nowMs) {
    var ex = tideExtrema(times, heights);
    var prev = null, next = null;
    for (var i = 0; i < ex.length; i++) { if (ex[i].ms <= nowMs) prev = ex[i]; else { next = ex[i]; break; } }
    var cur = levelAt(times, heights, nowMs);
    if (cur == null || !next) return null;
    var lo = Infinity, hi = -Infinity;
    for (var k = 0; k < times.length; k++) {
      if (heights[k] == null) continue;
      if (Math.abs(times[k] - nowMs) <= 13 * 36e5) { lo = Math.min(lo, heights[k]); hi = Math.max(hi, heights[k]); }
    }
    var f = hi > lo ? (cur - lo) / (hi - lo) : 0.5;
    var upcoming = ex.filter(function (e) { return e.ms > nowMs; }).slice(0, 4);
    return { extrema: ex, prev: prev, next: next, upcoming: upcoming, level: cur, f: f, rising: next.type === "high", range: hi - lo };
  }

  /* ---------- the case file: everything the two of them argue about ---------- */
  function buildCtx(r) {
    var info = codeInfo(r.code);
    return {
      place: r.place, isDay: r.isDay !== false, info: info,
      t: Math.round(r.t), feels: Math.round(r.feels), w: Math.round(r.w), g: Math.round(r.g),
      dir: compass(r.deg), pop: Math.round(r.pop || 0), mm: r.mm || 0, wave: r.wave == null ? null : r.wave,
      tide: r.tide || null, nowMs: r.nowMs
    };
  }

  /* ---------- how each of them sees each thing ----------
     The two have different tastes on purpose: Terry is a hardy showman who loves a spectacle,
     Reggie is a cautious dealer who likes it dry, calm and warm. So they disagree on the middle ground
     and agree when the weather is properly lovely or properly foul. */
  var W = { good: 2, meh: 0, bad: -2 };
  function skyView(who, cat) {
    if (who === "T") return /^(clear|partly|fog|snow|thunder)$/.test(cat) ? "good" : "meh";
    return /^(clear|partly)$/.test(cat) ? "good" : cat === "overcast" ? "meh" : "bad";
  }
  function tempView(who, f) {
    if (who === "T") return f < 3 ? "cold" : f < 10 ? "meh" : f < 30 ? "good" : "hot";
    return f < 8 ? "cold" : f < 16 ? "meh" : f < 26 ? "good" : "hot";
  }
  function windView(who, g) {
    if (who === "T") return g >= 50 ? "rough" : g >= 18 ? "fresh" : "calm";
    return g >= 28 ? "rough" : g >= 14 ? "fresh" : "calm";
  }
  function rainView(who, c) {
    var raining = c.mm >= 0.1;
    if (who === "T") return (c.mm >= 2.5 || c.pop >= 85) ? "wet" : (raining || c.pop >= 50) ? "mixed" : "dry";
    return (raining || c.pop >= 40) ? "wet" : c.pop >= 15 ? "mixed" : "dry";
  }
  function seaView(who, h) {
    if (who === "T") return h >= 4 ? "big" : h >= 1 ? "lively" : "flat";
    return h >= 1.5 ? "rough" : h < 0.6 ? "calm" : "choppy";
  }
  function tideLevel(f) { return f >= 0.66 ? "high" : f <= 0.34 ? "low" : "mid"; }
  function weightOf(topic, who, view) {
    var good = { sky: { T: "good", R: "good" }, temp: { T: "good", R: "good" }, wind: { T: "fresh", R: "calm" },
      rain: { T: "dry", R: "dry" }, sea: { T: "lively", R: "calm" }, tide: { T: "high", R: "low" } };
    var bad = { sky: { T: "", R: "bad" }, temp: { T: "cold|hot", R: "cold|hot" }, wind: { T: "rough", R: "rough" },
      rain: { T: "wet", R: "wet" }, sea: { T: "big", R: "rough" }, tide: { T: "low", R: "high" } };
    if (good[topic][who] === view) return W.good;
    if (bad[topic][who] && ("|" + bad[topic][who] + "|").indexOf("|" + view + "|") >= 0) return W.bad;
    return W.meh;
  }
  var TOPIC_WEIGHT = { sky: 1, temp: 1, wind: 1, rain: 1.5, sea: 0.7, tide: 0.5 };

  /* ---------- what they say ---------- */
  var OPEN = {
    sky: {
      T: { good: ["Ladies and gentlemen, look up! {Sky}! Nobody could have scripted this.", "{Sky} over {place}. I'd watch that every night of the week.", "{Sky}! That is what I call a sky with a bit of production value."],
           meh: ["{Sky} in {place}. Not my finest episode, but we work with what we are given.", "Today's sky is {sky}. A supporting role, but it is a role.", "{Sky}. The sky is phoning it in a little, but I admire the commitment."] },
      R: { good: ["{Sky}, my old son. You can't say fairer than that. A nice little earner for the whole town.", "{Sky} in {place}. I'd bottle it and sell it, but 'er indoors says that is not how weather works.", "{Sky}. Lovely. I'd put it on the books as pure profit."],
           meh: ["{Sky}. Nothing to write home about, nothing to complain about.", "It is {sky}. Strictly average, and I'd charge accordingly.", "{Sky}. Neither one thing nor the other, my old son."],
           bad: ["{Sky}. I'd advise a coat, a brolly and a very long think.", "{Sky} in {place}. Don't shoot the messenger, I only deliver the bad news. Invoice to follow.", "{Sky}. I've seen better skies at a closing-down sale."] }
    },
    temp: {
      T: { cold: ["It feels like {feels}°! Even I'd put a scarf on, and I'm made of pure enthusiasm.", "{t}° and feeling like {feels}°. A hat is not optional, ladies and gentlemen."],
           meh: ["{t}° and feeling like {feels}°. Crisp! Refreshing! Character-building!", "{feels}° feels-like. A proper bit of nip. I'll take it."],
           good: ["{t}°, feeling like {feels}°. Perfectly respectable. I've had worse on a Tuesday.", "{feels}° feels-like. That's a temperature with manners."],
           hot: ["{feels}° feels-like! Even the sea is sweating.", "{t}° and feeling like {feels}°. Somebody call the ice cream van."] },
      R: { cold: ["{t}° with a feels-like of {feels}°. Thermals, my old son. I've a pair in the van.", "{feels}° feels-like. My fingers have filed a formal complaint."],
           meh: ["{feels}° feels-like. Jumper weather. Not my favourite, not my worst.", "{t}°, feeling like {feels}°. Fair enough, but I'd keep the coat handy."],
           good: ["{feels}° feels-like. Lovely. Shirtsleeves and a sensible hat.", "{t}° and it feels like {feels}°. Now we're talking, my old son."],
           hot: ["{feels}° feels-like. Too hot for a man in a good suit. Strictly shade for me.", "{t}° and feeling like {feels}°. I'm melting into the margins."] }
    },
    wind: {
      T: { rough: ["{g} mph gusts from the {dir}! That is not weather, it is a spectacle, and also a hazard.", "Gusting {g} mph. Hold onto your hats, your toupees and your dignity."],
           fresh: ["{w} mph from the {dir}, gusting {g}. Bracing! The wind has personality.", "Wind from the {dir} at {w} mph. Now that is a proper blow-dry."],
           calm: ["{w} mph. Hardly a breath. Where is the drama? Where is the hair?", "Gusts of only {g} mph. I've had more excitement in a lift."] },
      R: { rough: ["{g} mph gusts. Strictly no umbrellas, they'll end up in the next county.", "Gusting {g} mph from the {dir}. I'd secure the wheelie bins and the toupee."],
           fresh: ["{w} mph from the {dir}, gusting {g}. Breezy but fair. Hat on firmly.", "A {g} mph gust or two. Nothing a decent scarf can't handle."],
           calm: ["Only {w} mph from the {dir}. Beautifully calm. I couldn't have ordered it better.", "{w} mph. Gentle as a Sunday morning."] }
    },
    rain: {
      T: { dry: ["{pop}% chance of rain over the next six hours. Practically a drought, ladies and gentlemen.", "Rain chance {pop}%. The clouds have been told to behave."],
           mixed: ["{pop}% chance of rain. A bit of drizzle never hurt a presenter.", "{pop}% chance of a shower. I'll risk it, I've got excellent hair product."],
           wet: ["Rain! {pop}% chance over the next six hours. Even I will concede it is wet.", "{pop}% chance of rain and the sky is committed. Umbrellas up!"] },
      R: { dry: ["{pop}% chance of rain. Dry as a bone, my old son. Hang the washing out.", "Rain chance only {pop}%. I'll write the brolly off as unsold stock."],
           mixed: ["{pop}% chance of rain. Not nothing. Bring a brolly, I'll lend you mine for a small fee.", "{pop}% chance of rain. I never trust anything that isn't zero."],
           wet: ["{pop}% chance of rain and I've seen it creep up on better men in better suits. Brolly, strictly cash.", "Rain, or near enough. {pop}% chance. I'm staying put, my old son."] }
    },
    sea: {
      T: { lively: ["{wave} metre waves! The sea is putting on a show.", "Waves of {wave} m. That's what I call audience participation."],
           big: ["{wave} metres!! That is not a sea, that is a rumour of a tsunami. Watch it from a very safe distance.", "{wave} m waves. Magnificent, and I am begging you not to go in."],
           flat: ["Only {wave} m waves. The sea is phoning it in.", "Waves of {wave} m. Flat as a pancake. Where's the theatre?"] },
      R: { rough: ["{wave} metre waves. I'm not going near it, not for any commission.", "{wave} m waves. That sea is nobody's friend today."],
           calm: ["{wave} m waves. Like a millpond, my old son. Lovely.", "Waves at {wave} m. Gentle as you like."],
           choppy: ["Waves at {wave} m. A bit of a lump, but nothing a sensible man can't watch from the cafe.", "{wave} m waves. Choppy, but I've survived worse in a bumper boat."] }
    },
    tide: {
      T: { high: ["The tide is {rf} and up in the top third. Next {nexttxt}. Magnificent! The sea at full majesty.", "Tide {rf} and well up the shore. Next {nexttxt}. Now that is an entrance."],
           mid: ["The tide is {rf}. Next {nexttxt}. Halfway to glory.", "Tide {rf}, somewhere in the middle. Next {nexttxt}. The suspense!"],
           low: ["The sea is well out and {rf}. Next {nexttxt}. Where did she go? I'm bereft.", "Tide {rf}, down in the bottom third. Next {nexttxt}. A sea without drama is just a puddle."] },
      R: { high: ["The tide is {rf} and well up. Next {nexttxt}. Not much beach left, my old son.", "Tide {rf}, up in the top third. Next {nexttxt}. Not a lot of room to stand."],
           mid: ["The tide is {rf}. Next {nexttxt}. Plenty of time yet.", "Tide {rf}, somewhere in the middle. Next {nexttxt}. No panic."],
           low: ["The tide is {rf}, sea well out. Next {nexttxt}. A long walk and no wet feet.", "Tide {rf}, down in the bottom third. Next {nexttxt}. All that lovely sand, and not a penny charged."] }
    }
  };
  var PREFIX = {
    agree: { T: ["Reggie, we agree!", "Same page, Reg!", "Hold the front page, Reg, we agree."], R: ["Fair play, Terry.", "For once, he's right.", "Can't argue with that, Terry, and I've tried."] },
    moreGood: { T: ["Oh, don't be a misery, Reg.", "Where is your sense of occasion, Reg?", "Reggie, Reggie, Reggie."], R: ["Steady on, Terry.", "Calm down, my old son.", "Not everything's a drama, Terry."] },
    moreBad: { T: ["For once I'm the worried one, Reg.", "Don't look at me like that, Reg.", "Reggie, you cheerful soul, what's got into you?"], R: ["Don't believe the hype, Terry.", "I'll believe it when I'm dry.", "That's what they all say, Terry."] }
  };
  var BAND = {
    T: [[8, ["{s}/10. Get out there, put your best face on and be seen!", "{s}/10. Spectacular. Go and have an adventure."]],
        [6, ["{s}/10. Perfectly lovely. Off you go.", "{s}/10. A grand day, with only minor reservations."]],
        [4, ["{s}/10. Go out if you must, you'll live.", "{s}/10. A middling day with a good story in it, if you're daft enough."]],
        [2, ["{s}/10. Fine, I admit it: stay in.", "{s}/10. Even I am reaching for the slippers."]],
        [-1, ["{s}/10. Cancel everything, ladies and gentlemen.", "{s}/10. Today is a day for blankets and regret."]]],
    R: [[8, ["{s}/10. I'll allow it. Don't tell anyone I said so.", "{s}/10. Cracking. Put it on my account."]],
        [6, ["{s}/10. Respectable. Take a coat anyway.", "{s}/10. Fair to middling, with a nice little upside."]],
        [4, ["{s}/10. I'd stay in the warm and watch it through the window.", "{s}/10. Dicey. I'm sending my apologies in advance."]],
        [2, ["{s}/10. Strictly indoors, my old son. Kettle on.", "{s}/10. I'd rather be audited."]],
        [-1, ["{s}/10. I'm not going out and I'm sending my apologies to everyone.", "{s}/10. Shut the shop, bolt the door."]]]
  };
  var ARTHUR = [
    [7, ["Arthur has looked out of the window, found it acceptable and gone back to sleep. Motion carried: go out."]],
    [4, ["Arthur has tried the door, thought about it and sat on the mat. Motion carried: go out, but not far."]],
    [-1, ["Arthur has found the warmest spot in the house and refuses to leave it. Motion carried: stay in."]]
  ];
  var MOODS = [
    [1.5, "For once, they agree"], [3, "A mild squabble"], [5, "A proper row"], [99, "Absolute carnage"]
  ];

  function fmtLine(s, v) { return s.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
  function band(table, score, rand) {
    for (var i = 0; i < table.length; i++) if (score >= table[i][0]) { var p = table[i][1]; return p[Math.floor(rand() * p.length)]; }
    return table[table.length - 1][1][0];
  }

  /* ---------- the argument ---------- */
  function argue(ctx, seed) {
    var rand = rng(seed >>> 0 || 1), turns = [];
    var vars = {
      place: ctx.place, sky: ctx.info.text, Sky: cap(ctx.info.text), t: ctx.t, feels: ctx.feels, w: ctx.w, g: ctx.g,
      dir: ctx.dir, pop: ctx.pop, wave: ctx.wave == null ? "" : (Math.round(ctx.wave * 10) / 10).toFixed(1)
    };
    var topics = [], total = { T: 0, R: 0 }, wsum = 0;
    function addTopic(name, tv, rv, extra) { topics.push({ name: name, T: tv, R: rv, extra: extra || {} }); }
    addTopic("sky", skyView("T", ctx.info.cat), skyView("R", ctx.info.cat));
    addTopic("temp", tempView("T", ctx.feels), tempView("R", ctx.feels));
    addTopic("wind", windView("T", ctx.g), windView("R", ctx.g));
    addTopic("rain", rainView("T", ctx), rainView("R", ctx));
    if (ctx.wave != null) addTopic("sea", seaView("T", ctx.wave), seaView("R", ctx.wave));
    if (ctx.tide) {
      var lvl = tideLevel(ctx.tide.f);
      vars.rf = ctx.tide.rising ? "coming in" : "going out";
      vars.nexttxt = ctx.tide.next.type + " water " + fmtWhen(ctx.tide.next.ms, ctx.nowMs) + " (" + fmtIn(ctx.tide.next.ms, ctx.nowMs) + ")";
      addTopic("tide", lvl, lvl);
    }
    /* Thunder gets its own opening exchange. */
    if (ctx.info.cat === "thunder") {
      turns.push({ who: "T", topic: "sky", text: "THUNDER! Somebody fetch me a cape." });
      turns.push({ who: "R", topic: "sky", text: "Keep away from open ground and tall trees, my old son. That isn't a joke, that's free advice." });
    }
    var first = rand() < 0.5 ? "T" : "R";
    topics.forEach(function (tp, idx) {
      var a = idx % 2 === 0 ? first : (first === "T" ? "R" : "T"), b = a === "T" ? "R" : "T";
      var bankT = OPEN[tp.name].T, bankR = OPEN[tp.name].R;
      function pick(who) { var pool = (who === "T" ? bankT : bankR)[tp[who]] || (who === "T" ? bankT : bankR).meh; return fmtLine(pool[Math.floor(rand() * pool.length)], vars); }
      var wt = weightOf(tp.name, "T", tp.T), wr = weightOf(tp.name, "R", tp.R);
      /* Equal weight means they feel the same way about it, even if the words differ. */
      var same = (wt === wr);
      var first1 = pick(a);
      var second = pick(b), pre;
      if (same) pre = PREFIX.agree[b];
      else { var bMoreGood = (b === "T" ? wt : wr) > (b === "T" ? wr : wt); pre = (bMoreGood ? PREFIX.moreGood : PREFIX.moreBad)[b]; }
      turns.push({ who: a, topic: tp.name, text: first1 });
      turns.push({ who: b, topic: tp.name, text: pre[Math.floor(rand() * pre.length)] + " " + second, clash: !same });
      var wgt = TOPIC_WEIGHT[tp.name];
      total.T += wt * wgt; total.R += wr * wgt; wsum += wgt;
    });
    var ts = clamp(Math.round((5 + total.T / wsum * 2.5) * 2) / 2, 0, 10), rs = clamp(Math.round((5 + total.R / wsum * 2.5) * 2) / 2, 0, 10);
    var d = Math.abs(ts - rs), avg = (ts + rs) / 2;
    /* Serious business: joking aside when the weather can actually hurt someone. */
    var serious = [];
    if (ctx.info.cat === "thunder") serious.push("there is thunder about");
    if (ctx.g >= 50) serious.push("gusts are near " + ctx.g + " mph");
    if (ctx.feels <= -5) serious.push("it feels like " + ctx.feels + "°");
    if (ctx.feels >= 32) serious.push("it feels like " + ctx.feels + "°");
    if (ctx.wave != null && ctx.wave >= 4) serious.push("the sea is running at " + vars.wave + " m");
    var ord = rand() < 0.5 ? ["T", "R"] : ["R", "T"];
    var out = { turns: turns, scores: { T: ts, R: rs }, diff: d, avg: avg, serious: serious.length ? serious.join(", ") : null };
    out.verdict = ord.map(function (w) { return { who: w, text: fmtLine(band(BAND[w], w === "T" ? ts : rs, rand), { s: (w === "T" ? ts : rs).toFixed(1).replace(".0", "") }) }; });
    for (var m = 0; m < MOODS.length; m++) if (d < MOODS[m][0]) { out.mood = MOODS[m][1]; break; }
    if (d < 1.5 && avg < 3) out.mood = "United in misery";
    if (d < 1.5 && avg >= 7.5) out.mood = "United in delight";
    out.arthur = band(ARTHUR, avg, rand);
    out.topics = topics;
    return out;
  }

  root.WXE = {
    parseNaive: parseNaive, fmtTime: fmtTime, fmtWhen: fmtWhen, fmtIn: fmtIn, dayKey: dayKey, dayName: dayName, compass: compass,
    codeInfo: codeInfo, tideExtrema: tideExtrema, levelAt: levelAt, tideState: tideState, buildCtx: buildCtx,
    argue: argue, hash: hash, tideLevel: tideLevel,
    _views: { skyView: skyView, tempView: tempView, windView: windView, rainView: rainView, seaView: seaView }
  };
})(typeof window !== "undefined" ? window : globalThis);
