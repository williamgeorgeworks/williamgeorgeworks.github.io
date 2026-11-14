/* The Weather Row: live data, cartoon icons and the page itself.
   Weather data by Open-Meteo.com (CC BY 4.0). The arguing lives in weather-engine.js. */
(function () {
  "use strict";
  var E = window.WXE;
  if (!E) return;

  var API = "https://api.open-meteo.com/v1/forecast";
  var MARINE = "https://marine-api.open-meteo.com/v1/marine";
  var GEO = "https://geocoding-api.open-meteo.com/v1/search";
  var REFRESH_MS = 5 * 60 * 1000;
  var PRESETS = [
    { name: "Blackpool, Lancashire", lat: 53.8175, lon: -3.0357 },
    { name: "Fleetwood, Lancashire", lat: 53.9249, lon: -3.0113 },
    { name: "Morecambe, Lancashire", lat: 54.0714, lon: -2.8644 },
    { name: "Southport, Merseyside", lat: 53.6475, lon: -3.0053 },
    { name: "Whitby, North Yorkshire", lat: 54.4858, lon: -0.6206 },
    { name: "Brighton, East Sussex", lat: 50.8225, lon: -0.1372 },
    { name: "Preston, Lancashire", lat: 53.7632, lon: -2.7031 }
  ];
  var INK = "#141414", RED = "#d1202f", BLUE = "#22409a", CARD = "#fffdf7", SUN = "#ffd23f", GREY = "#d9dde5";

  /* ---------- cartoon icons: thick ink lines, a face on everything ---------- */
  var S = 'stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
  var CLOUD = "M26 76 A14 14 0 0 1 24 48 A18 18 0 0 1 58 40 A14 14 0 0 1 80 52 A12 12 0 0 1 74 76 Z";
  function face(cx, cy, mood) {
    var eyes = '<circle cx="' + (cx - 8) + '" cy="' + cy + '" r="2.6" fill="' + INK + '"/><circle cx="' + (cx + 8) + '" cy="' + cy + '" r="2.6" fill="' + INK + '"/>';
    var m = mood === "sad" ? '<path d="M' + (cx - 5) + ' ' + (cy + 11) + ' Q' + cx + ' ' + (cy + 5) + ' ' + (cx + 5) + ' ' + (cy + 11) + '" fill="none" ' + S.replace('width="4"', 'width="2.6"') + '/>'
      : mood === "oh" ? '<ellipse cx="' + cx + '" cy="' + (cy + 9) + '" rx="3" ry="4" fill="' + INK + '"/>'
      : mood === "flat" ? '<path d="M' + (cx - 5) + ' ' + (cy + 9) + ' L' + (cx + 5) + ' ' + (cy + 9) + '" fill="none" ' + S.replace('width="4"', 'width="2.6"') + '/>'
      : '<path d="M' + (cx - 6) + ' ' + (cy + 6) + ' Q' + cx + ' ' + (cy + 13) + ' ' + (cx + 6) + ' ' + (cy + 6) + '" fill="none" ' + S.replace('width="4"', 'width="2.6"') + '/>';
    return eyes + m;
  }
  function cloud(fill, mood, dx, dy, sc) {
    return '<g transform="translate(' + (dx || 0) + ' ' + (dy || 0) + ') scale(' + (sc || 1) + ')"><path d="' + CLOUD + '" fill="' + fill + '" ' + S + '/>' + (mood ? face(50, 60, mood) : "") + '</g>';
  }
  function sunBody(cx, cy, r, withFace) {
    var rays = "";
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, x1 = cx + Math.cos(a) * (r + 6), y1 = cy + Math.sin(a) * (r + 6), x2 = cx + Math.cos(a) * (r + 15), y2 = cy + Math.sin(a) * (r + 15);
      rays += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" ' + S + '/>';
    }
    return rays + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + SUN + '" ' + S + '/>' + (withFace ? face(cx, cy - 2, "happy") : "");
  }
  function drops(n, y0) {
    var xs = n === 3 ? [36, 52, 68] : [32, 46, 60, 74], out = "";
    xs.forEach(function (x, i) { var y = y0 + (i % 2) * 6; out += '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 5) + '" y2="' + (y + 11) + '" stroke="' + BLUE + '" stroke-width="5" stroke-linecap="round"/>'; });
    return out;
  }
  function flake(x, y) {
    return '<g stroke="' + BLUE + '" stroke-width="3" stroke-linecap="round"><line x1="' + (x - 5) + '" y1="' + y + '" x2="' + (x + 5) + '" y2="' + y + '"/><line x1="' + x + '" y1="' + (y - 5) + '" x2="' + x + '" y2="' + (y + 5) + '"/><line x1="' + (x - 3.5) + '" y1="' + (y - 3.5) + '" x2="' + (x + 3.5) + '" y2="' + (y + 3.5) + '"/><line x1="' + (x - 3.5) + '" y1="' + (y + 3.5) + '" x2="' + (x + 3.5) + '" y2="' + (y - 3.5) + '"/></g>';
  }
  function icon(name, isDay, size) {
    var g = "";
    if (name === "clear") {
      g = isDay ? sunBody(50, 50, 20, true)
        : '<path d="M62 16 A36 36 0 1 0 86 62 A30 30 0 0 1 62 16 Z" fill="#f6e7a1" ' + S + '/><circle cx="40" cy="52" r="2.6" fill="' + INK + '"/><path d="M34 62 Q42 68 48 62" fill="none" ' + S.replace('width="4"', 'width="2.6"') + '/><circle cx="82" cy="24" r="2.5" fill="' + INK + '"/><circle cx="26" cy="22" r="2" fill="' + INK + '"/>';
    } else if (name === "partly") {
      g = (isDay ? sunBody(36, 36, 14, false) : '<path d="M44 10 A24 24 0 1 0 62 48 A20 20 0 0 1 44 10 Z" fill="#f6e7a1" ' + S + '/>') + cloud(CARD, "happy", 6, 12, 0.86);
    } else if (name === "overcast") {
      g = cloud(GREY, null, -8, -10, 0.8) + cloud("#eef0f4", "flat", 6, 4, 0.92);
    } else if (name === "fog") {
      g = cloud("#eef0f4", "flat", 0, -12, 0.9) + '<path d="M18 76 Q30 70 42 76 T66 76 T88 76" fill="none" ' + S + '/><path d="M24 90 Q36 84 48 90 T72 90 T92 90" fill="none" ' + S + '/>';
    } else if (name === "drizzle") {
      g = cloud("#eef0f4", "flat", 0, -12, 0.9) + drops(3, 72).replace(/stroke-width="5"/g, 'stroke-width="4"');
    } else if (name === "rain") {
      g = cloud(GREY, "sad", 0, -12, 0.9) + drops(4, 70);
    } else if (name === "shower") {
      g = (isDay ? sunBody(38, 32, 12, false) : "") + cloud(GREY, "sad", 6, -6, 0.86) + drops(3, 74);
    } else if (name === "snow") {
      g = cloud("#eef0f4", "oh", 0, -12, 0.9) + flake(34, 80) + flake(52, 88) + flake(70, 80);
    } else if (name === "thunder") {
      g = cloud("#aeb4c0", "oh", 0, -14, 0.9) + '<polygon points="54,62 40,84 51,84 44,98 66,74 54,74 60,62" fill="' + SUN + '" ' + S + '/>';
    }
    return '<svg class="wxi" viewBox="0 0 100 100" width="' + (size || 64) + '" height="' + (size || 64) + '" role="img" aria-hidden="true" focusable="false">' + g + "</svg>";
  }

  /* ---------- tiny DOM helpers (all place names go in as text, never as HTML) ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function html(tag, cls, inner) { var e = el(tag, cls); e.innerHTML = inner; return e; }
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- fetching ---------- */
  function getJSON(url, ms) {
    var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, ms || 12000);
    return fetch(url, { signal: ctl.signal }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function weatherURL(p) {
    return API + "?latitude=" + p.lat + "&longitude=" + p.lon +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day" +
      "&hourly=temperature_2m,precipitation_probability,weather_code,pressure_msl,wind_gusts_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_gusts_10m_max,uv_index_max" +
      "&wind_speed_unit=mph&timezone=auto&past_days=1&forecast_days=7";
  }
  /* The tide model is coarse, so ask for the place itself plus four nearby points, and use the nearest one that is actually sea. */
  function marineURL(p) {
    var d = 0.12, la = [p.lat, p.lat, p.lat, p.lat - d, p.lat + d], lo = [p.lon, p.lon - d, p.lon + d, p.lon, p.lon];
    return MARINE + "?latitude=" + la.join(",") + "&longitude=" + lo.join(",") +
      "&current=wave_height,wave_period,sea_surface_temperature&hourly=sea_level_height_msl&timezone=auto&past_days=1&forecast_days=3";
  }
  function pickSea(res, p) {
    var arr = Array.isArray(res) ? res : [res], best = null;
    for (var i = 0; i < arr.length; i++) {
      var h = arr[i] && arr[i].hourly && arr[i].hourly.sea_level_height_msl;
      if (h && h.some(function (v) { return v != null; })) { best = arr[i]; break; }
    }
    if (!best) return null;
    var dLat = (best.latitude - p.lat) * 111, dLon = (best.longitude - p.lon) * 111 * Math.cos(p.lat * Math.PI / 180);
    best._km = Math.sqrt(dLat * dLat + dLon * dLon);
    return best;
  }
  function loadAll(p) {
    var wx = getJSON(weatherURL(p));
    var sea = getJSON(marineURL(p)).then(function (r) { return pickSea(r, p); }, function () { return null; });
    return Promise.all([wx, sea]);
  }

  /* ---------- turning the raw answers into one tidy picture ---------- */
  function digest(place, wx, sea) {
    var offset = wx.utc_offset_seconds || 0;
    var nowMs = Date.now() + offset * 1000;
    var cur = wx.current, hourly = wx.hourly, daily = wx.daily;
    var hT = hourly.time.map(E.parseNaive);
    var hi = -1;
    for (var i = 0; i < hT.length; i++) if (hT[i] <= nowMs) hi = i;
    if (hi < 0) hi = 0;
    var pop = 0;
    for (var k = hi; k < Math.min(hT.length, hi + 6); k++) pop = Math.max(pop, hourly.precipitation_probability[k] || 0);
    var p3 = hi >= 3 ? hourly.pressure_msl[hi - 3] : null;
    var ptrend = p3 != null && cur.pressure_msl != null ? cur.pressure_msl - p3 : null;
    var days = daily.time.map(function (t, j) {
      return { ms: E.parseNaive(t + "T00:00"), code: daily.weather_code[j], hi: daily.temperature_2m_max[j], lo: daily.temperature_2m_min[j],
        rise: E.parseNaive(daily.sunrise[j]), set: E.parseNaive(daily.sunset[j]), pop: daily.precipitation_probability_max[j], gust: daily.wind_gusts_10m_max[j], uv: daily.uv_index_max[j] };
    });
    var todayKey = E.dayKey(nowMs), ti = 0;
    days.forEach(function (d, j) { if (E.dayKey(d.ms) === todayKey) ti = j; });
    function dayAt(ms) { for (var j = 0; j < days.length; j++) if (E.dayKey(days[j].ms) === E.dayKey(ms)) return days[j]; return null; }
    function isDayAt(ms) { var d = dayAt(ms); return d ? (ms >= d.rise && ms < d.set) : true; }
    var next = [];
    for (var n = hi + 1; n < Math.min(hT.length, hi + 13); n++) next.push({ ms: hT[n], t: hourly.temperature_2m[n], code: hourly.weather_code[n], pop: hourly.precipitation_probability[n], isDay: isDayAt(hT[n]) });
    var out = { place: place, nowMs: nowMs, curTime: E.parseNaive(cur.time), cur: cur, pop: pop, ptrend: ptrend, next: next, days: days.slice(ti, ti + 6), today: days[ti], isDay: cur.is_day !== 0, sea: null };
    if (sea && sea.hourly) {
      var times = sea.hourly.time.map(E.parseNaive), heights = sea.hourly.sea_level_height_msl;
      var ts = E.tideState(times, heights, nowMs);
      if (ts) out.sea = { tide: ts, times: times, heights: heights, km: sea._km, wave: sea.current ? sea.current.wave_height : null, period: sea.current ? sea.current.wave_period : null, sst: sea.current ? sea.current.sea_surface_temperature : null };
    }
    return out;
  }

  /* ---------- drawing ---------- */
  function windArrow(deg) {
    return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" style="transform:rotate(' + ((deg + 180) % 360) + 'deg);vertical-align:-4px"><path d="M12 2 L19 20 L12 16 L5 20 Z" fill="' + INK + '"/></svg>';
  }
  function tile(label, value, sub) {
    var t = el("div", "tile");
    add(t, el("span", "tl", label), el("b", "tv", value));
    if (sub) add(t, el("span", "ts", sub));
    return t;
  }
  function renderNow(d) {
    var c = d.cur, info = E.codeInfo(c.weather_code);
    var card = el("section", "card nowcard");
    var head = el("div", "nowhead");
    add(head, html("div", "bigicon", icon(info.icon, d.isDay, 132)));
    var txt = el("div", "nowtext");
    add(txt, el("p", "scrawl", d.place.name), el("div", "bigtemp", Math.round(c.temperature_2m) + "°C"), el("p", "nowsky", E.codeInfo(c.weather_code).text.replace(/^./, function (m) { return m.toUpperCase(); }) + ". Feels like " + Math.round(c.apparent_temperature) + "°C."));
    add(head, txt);
    add(card, head);
    var grid = el("div", "tiles");
    var pt = d.ptrend == null ? "" : d.ptrend >= 1 ? "rising" : d.ptrend <= -1 ? "falling" : "steady";
    add(grid,
      (function () { var t = tile("Wind", Math.round(c.wind_speed_10m) + " mph", "gusts " + Math.round(c.wind_gusts_10m) + " from the " + E.compass(c.wind_direction_10m)); t.querySelector(".tv").insertAdjacentHTML("beforeend", " " + windArrow(c.wind_direction_10m)); return t; })(),
      tile("Rain", d.pop + "%", "chance, next 6 hours" + (c.precipitation >= 0.1 ? "; " + c.precipitation.toFixed(1) + " mm now" : "")),
      tile("Pressure", Math.round(c.pressure_msl) + " hPa", pt),
      tile("Humidity", Math.round(c.relative_humidity_2m) + "%", "cloud cover " + Math.round(c.cloud_cover) + "%"),
      tile("Sun", E.fmtTime(d.today.rise), "up, and down at " + E.fmtTime(d.today.set)),
      d.sea && d.sea.sst != null ? tile("Sea", d.sea.sst.toFixed(1) + "°C", d.sea.wave != null ? "waves " + d.sea.wave.toFixed(1) + " m" : "") : tile("UV today", d.today.uv == null ? "-" : String(Math.round(d.today.uv)), "highest expected"));
    add(card, grid);
    return card;
  }

  function avatar(who) {
    var a = el("span", "av " + (who === "T" ? "t" : "r"), who === "T" ? "T" : "R");
    a.setAttribute("aria-hidden", "true");
    return a;
  }
  function renderRow(d, bump) {
    var c = d.cur;
    var ctx = E.buildCtx({ place: d.place.name.split(",")[0], isDay: d.isDay, t: c.temperature_2m, feels: c.apparent_temperature, code: c.weather_code, w: c.wind_speed_10m, g: Math.max(c.wind_gusts_10m, c.wind_speed_10m), deg: c.wind_direction_10m, pop: d.pop, mm: c.precipitation, wave: d.sea ? d.sea.wave : null, tide: d.sea ? d.sea.tide : null, nowMs: d.nowMs });
    var seed = E.hash(d.place.name + "|" + E.dayKey(d.nowMs) + "|" + Math.floor(d.nowMs / 36e5)) + bump * 7919;
    var r = E.argue(ctx, seed);
    var card = el("section", "card rowcard");
    add(card, el("p", "scrawl", "The Row"), el("h2", null, "Terry v Reggie"));
    var mood = el("p", "mood"); add(mood, el("span", "moodtag", r.mood)); card.appendChild(mood);
    var ol = el("ol", "bubbles");
    function bubble(t) {
      var li = el("li", "bubble " + (t.who === "T" ? "t" : "r") + (t.clash ? " clash" : ""));
      var who = el("span", "who", t.who === "T" ? "Terry" : "Reggie");
      add(li, avatar(t.who), add(el("div", "say"), who, el("p", null, t.text)));
      return li;
    }
    r.turns.forEach(function (t) { ol.appendChild(bubble(t)); });
    card.appendChild(ol);
    var vh = el("h3", "verdh", "The verdict: how good is it for a walk outside?");
    card.appendChild(vh);
    var meters = el("div", "meters");
    [["T", "Terry"], ["R", "Reggie"]].forEach(function (w) {
      var m = el("div", "meter " + (w[0] === "T" ? "t" : "r")), score = r.scores[w[0]];
      add(m, el("span", "mn", w[1] + " " + String(score).replace(/\.0$/, "") + "/10"));
      var bar = el("span", "bar"), fill = el("i"); fill.style.width = (score * 10) + "%"; add(bar, fill); m.appendChild(bar);
      meters.appendChild(m);
    });
    card.appendChild(meters);
    var vol = el("ol", "bubbles");
    r.verdict.forEach(function (v) { vol.appendChild(bubble({ who: v.who, text: v.text })); });
    card.appendChild(vol);
    add(card, add(el("p", "arthur"), el("b", null, "Arthur’s casting vote: "), document.createTextNode(r.arthur)));
    if (r.serious) {
      var s = el("p", "serious");
      add(s, el("b", null, "Joking aside: "), document.createTextNode(r.serious + ". Check the official warnings from the "), (function () { var a = el("a", null, "Met Office"); a.href = "https://www.metoffice.gov.uk/weather/warnings-and-advice"; a.rel = "noopener"; return a; })(), document.createTextNode(" before you go out."));
      card.appendChild(s);
    }
    var again = el("button", "btn small", "Another round"); again.type = "button"; again.id = "again";
    add(card, add(el("p", "btns"), again));
    return card;
  }

  function tideSVG(sea, nowMs) {
    var W = 600, H = 270, pl = 44, pr = 14, pt = 26, pb = 34;
    var t0 = nowMs - 6 * 36e5, t1 = nowMs + 30 * 36e5, pts = [], lo = Infinity, hi = -Infinity, t;
    for (t = t0; t <= t1; t += 12 * 6e4) { var v = E.levelAt(sea.times, sea.heights, t); if (v != null) { pts.push([t, v]); lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    if (pts.length < 4) return null;
    var padv = Math.max(0.3, (hi - lo) * 0.18); lo -= padv; hi += padv;
    function X(ms) { return pl + (ms - t0) / (t1 - t0) * (W - pl - pr); }
    function Y(v) { return pt + (hi - v) / (hi - lo) * (H - pt - pb); }
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ");
    var area = line + " L" + X(pts[pts.length - 1][0]).toFixed(1) + " " + (H - pb) + " L" + X(pts[0][0]).toFixed(1) + " " + (H - pb) + " Z";
    var g = '<svg class="tidesvg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Tide height over the next 30 hours">';
    g += '<rect x="' + pl + '" y="' + pt + '" width="' + (W - pl - pr) + '" height="' + (H - pt - pb) + '" fill="#fffdf7" stroke="' + INK + '" stroke-width="3"/>';
    if (lo < 0 && hi > 0) g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="' + INK + '" stroke-width="1.5" stroke-dasharray="3 5"/><text x="' + (pl - 6) + '" y="' + (Y(0) + 5).toFixed(1) + '" text-anchor="end" font-size="15" fill="' + INK + '">0</text>';
    var tk = Math.ceil(t0 / (6 * 36e5)) * 6 * 36e5;
    for (; tk <= t1; tk += 6 * 36e5) {
      var hh = new Date(tk).getUTCHours();
      g += '<line x1="' + X(tk).toFixed(1) + '" x2="' + X(tk).toFixed(1) + '" y1="' + (H - pb) + '" y2="' + (H - pb + 6) + '" stroke="' + INK + '" stroke-width="2"/><text x="' + X(tk).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="15" fill="' + INK + '">' + (hh === 0 ? E.dayName(tk) : (hh < 10 ? "0" : "") + hh + ":00") + "</text>";
    }
    g += '<path d="' + area + '" fill="' + BLUE + '" fill-opacity=".22"/><path d="' + line + '" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
    sea.tide.extrema.forEach(function (e) {
      if (e.ms < t0 || e.ms > t1) return;
      var x = X(e.ms), y = Y(e.height), hiTide = e.type === "high";
      g += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="' + (hiTide ? RED : BLUE) + '" stroke="' + INK + '" stroke-width="3"/>';
      var tx = Math.max(pl + 26, Math.min(W - pr - 26, x));
      g += '<text x="' + tx.toFixed(1) + '" y="' + (hiTide ? y - 14 : y + 24).toFixed(1) + '" text-anchor="middle" font-size="15" font-weight="700" fill="' + INK + '">' + (hiTide ? "HW " : "LW ") + E.fmtTime(e.ms) + "</text>";
    });
    var nx = X(nowMs);
    g += '<line x1="' + nx.toFixed(1) + '" x2="' + nx.toFixed(1) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + RED + '" stroke-width="3" stroke-dasharray="6 5"/><text x="' + nx.toFixed(1) + '" y="' + (pt - 8) + '" text-anchor="middle" font-size="16" font-weight="700" fill="' + RED + '">NOW</text>';
    return g + "</svg>";
  }
  function renderTide(d) {
    var card = el("section", "card tidecard");
    add(card, el("p", "scrawl", "The sea"), el("h2", null, "Tides"));
    if (!d.sea) {
      add(card, el("p", null, "No sea within reach of " + d.place.name.split(",")[0] + ". Terry says the nearest tide is a good day out. Reggie says it's a long way to go for a bag of chips."),
        el("p", "fine", "Try a coastal place such as Blackpool, Fleetwood or Brighton."));
      return card;
    }
    var s = d.sea, st = s.tide;
    add(card, el("p", "tidenow", "The tide is " + (st.rising ? "coming in" : "going out") + ". Next " + st.next.type + " water " + E.fmtWhen(st.next.ms, d.nowMs) + " (" + E.fmtIn(st.next.ms, d.nowMs) + ")."));
    var svg = tideSVG(s, d.nowMs);
    if (svg) card.appendChild(html("div", "tidewrap", svg));
    var tbl = el("table", "tidetbl"), tb = el("tbody");
    st.upcoming.forEach(function (e) {
      var tr = el("tr");
      add(tr, el("td", null, e.type === "high" ? "High water" : "Low water"), el("td", null, E.fmtWhen(e.ms, d.nowMs)), el("td", null, (e.height >= 0 ? "+" : "") + e.height.toFixed(1) + " m"), el("td", "dim", E.fmtIn(e.ms, d.nowMs)));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); card.appendChild(tbl);
    add(card, el("p", "fine", "Heights are metres against mean sea level, not the chart datum used on printed tide tables, so they will not match those tables. Times are for " + d.place.name.split(",")[0] + "’s local clock."));
    add(card, el("p", "fine warn", "This is a computer model of the sea on a grid about 8 km wide" + (s.km > 3 ? ", and the nearest sea point it used is about " + Math.round(s.km) + " km from the town" : "") + ". It is good for a rough idea and can be wrong by a fair bit near a coast, an estuary or a harbour. For fishing, boats, causeways or anything that matters, use the official tide tables (UKHO EasyTide or the local harbour office)."));
    return card;
  }

  function renderOutlook(d) {
    var wrap = el("section", "card outlook");
    add(wrap, el("p", "scrawl", "Coming up"), el("h2", null, "Next few hours"));
    var strip = el("ol", "hours");
    d.next.forEach(function (h) {
      var li = el("li", "hour");
      add(li, el("b", null, E.fmtTime(h.ms)), html("span", "hi", icon(E.codeInfo(h.code).icon, h.isDay, 44)), el("span", "ht", Math.round(h.t) + "°"), el("span", "hp", (h.pop || 0) + "%"));
      li.title = E.codeInfo(h.code).text;
      strip.appendChild(li);
    });
    wrap.appendChild(strip);
    add(wrap, el("h3", "dayshead", "The week"));
    var days = el("ol", "days");
    d.days.forEach(function (dy, i) {
      var li = el("li", "day"), info = E.codeInfo(dy.code);
      add(li, el("b", null, i === 0 ? "Today" : E.dayName(dy.ms)), html("span", "hi", icon(info.icon, true, 56)), el("span", "dt", Math.round(dy.hi) + "° / " + Math.round(dy.lo) + "°"), el("span", "ds", info.text), el("span", "hp", "rain " + (dy.pop || 0) + "%"), el("span", "hp", "gusts " + Math.round(dy.gust) + " mph"));
      days.appendChild(li);
    });
    wrap.appendChild(days);
    return wrap;
  }

  /* ---------- the page ---------- */
  var current = null, lastData = null, bump = 0, timer = null;
  function setStatus(msg, bad) { var s = $("status"); s.textContent = msg; s.className = "status" + (bad ? " bad" : ""); }
  function draw() {
    var d = lastData, app = $("app");
    if (!d) return;
    app.textContent = "";
    var left = el("div", "col"), right = el("div", "col");
    add(left, renderNow(d), renderRow(d, bump));
    add(right, renderTide(d), renderOutlook(d));
    add(app, left, right);
    app.hidden = false;
    var again = $("again");
    if (again) again.addEventListener("click", function () { bump++; draw(); });
    var cur = d.cur;
    setStatus("Showing " + d.place.name + ". Weather for " + E.fmtTime(d.curTime) + " local time at the place, fetched at " + new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " on your clock. It refreshes by itself every five minutes.");
  }
  function load(place, quiet) {
    current = place;
    try { localStorage.setItem("wgwWeatherPlace", JSON.stringify(place)); } catch (e) {}
    if (!quiet) setStatus("Asking the sky about " + place.name + "...");
    clearTimeout(timer);
    return loadAll(place).then(function (res) {
      if (current !== place) return;
      lastData = digest(place, res[0], res[1]); lastData._at = Date.now();
      if (!quiet) bump = 0;
      draw();
    }).catch(function (err) {
      if (current !== place) return;
      setStatus(lastData ? "Couldn't refresh just now, so this is the last good reading. Trying again in five minutes." : "Couldn't reach the weather service. Check your connection and try again.", true);
      if (typeof console !== "undefined") console.warn("weather:", err);
    }).then(function () { timer = setTimeout(function () { if (current === place) load(place, true); }, REFRESH_MS); });
  }
  function search(q) {
    q = q.trim();
    if (!q) return;
    setStatus("Looking for " + q + "...");
    var box = $("choices"); box.textContent = "";
    getJSON(GEO + "?name=" + encodeURIComponent(q) + "&count=5&language=en&format=json").then(function (r) {
      var res = (r && r.results) || [];
      if (!res.length) { setStatus("Nowhere called “" + q + "” turned up. Try a town name, perhaps with the county.", true); return; }
      function label(x) { return [x.name, x.admin1, x.country].filter(Boolean).join(", "); }
      var p = { name: label(res[0]), lat: res[0].latitude, lon: res[0].longitude };
      load(p);
      if (res.length > 1) {
        box.appendChild(el("span", "dim", "Did you mean: "));
        res.slice(1).forEach(function (x) {
          var b = el("button", "chip", label(x)); b.type = "button";
          b.addEventListener("click", function () { box.textContent = ""; load({ name: label(x), lat: x.latitude, lon: x.longitude }); });
          box.appendChild(b);
        });
      }
    }).catch(function () { setStatus("Couldn't search just now. Try one of the places below.", true); });
  }
  function init() {
    var chips = $("presets");
    PRESETS.forEach(function (p) {
      var b = el("button", "chip", p.name.split(",")[0]); b.type = "button";
      b.addEventListener("click", function () { $("choices").textContent = ""; $("q").value = ""; load(p); });
      chips.appendChild(b);
    });
    $("finder").addEventListener("submit", function (e) { e.preventDefault(); search($("q").value); });
    var gb = $("here");
    if (!navigator.geolocation) gb.hidden = true;
    gb.addEventListener("click", function () {
      setStatus("Asking your device where you are...");
      navigator.geolocation.getCurrentPosition(function (pos) { load({ name: "Your location", lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) }); },
        function () { setStatus("Your device wouldn't say where you are. Type a place instead.", true); }, { timeout: 10000, maximumAge: 600000 });
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden && current && lastData && Date.now() - lastData.nowMs > 0 && (Date.now() - (lastData._at || 0)) > 120000) load(current, true); });
    var start = PRESETS[0], q = /[?&]place=([^&]+)/.exec(location.search);
    try { var saved = JSON.parse(localStorage.getItem("wgwWeatherPlace") || "null"); if (saved && typeof saved.lat === "number" && typeof saved.lon === "number" && typeof saved.name === "string") start = saved; } catch (e) {}
    if (q) { $("q").value = decodeURIComponent(q[1].replace(/\+/g, " ")); search($("q").value); } else load(start);
  }
  window.__wx = { icon: icon, digest: digest, pickSea: pickSea, tideSVG: tideSVG };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
