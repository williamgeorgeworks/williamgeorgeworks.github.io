/* Badges: the wall on the arcade page and the "badge unlocked" toast on the games.
   Everything is worked out from your own saves in this browser. Nothing is sent anywhere. */
(function () {
  "use strict";
  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null") || {}; } catch (e) { return {}; } }
  function num(k) { try { return parseInt(localStorage.getItem(k) || "0", 10) || 0; } catch (e) { return 0; } }
  function listGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function listSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

  var TIERS = {
    bronze: ["#f0b27a", "#9a5b24", "Bronze"], silver: ["#f4f7f9", "#8f9aa3", "Silver"],
    gold: ["#ffe27a", "#c98a00", "Gold"], legend: ["#ff9ad1", "#6a1fe0", "Legend"]
  };
  function defs() {
    var g = load("gtk-v1"), r = load("rlgl-v1"), f = load("fd-v1"), a = num("arthur-best"), s = load("wgw-streak"), k = load("kgp-v1"), p = load("stp-v1");
    var kw = k.wc || [], kc = k.cats || {}, kb = k.best || [], kcn = Object.keys(kc).filter(function (c) { return kc[c] > 0; }).length;
    var fb = f.book || {}, fn = Object.keys(fb).filter(function (k) { return fb[k] > 0; }).length;
    var bestRun = 0; Object.keys(s).forEach(function (k) { if (s[k] && s[k].best > bestRun) bestRun = s[k].best; });
    var four = (+g.best > 0 ? 1 : 0) + (+r.best > 0 ? 1 : 0) + (a > 0 ? 1 : 0) + (+f.played > 0 ? 1 : 0);
    var five = four + (+k.races > 0 ? 1 : 0);
    var phw = p.hw || {}, pcats = Object.keys(p.cw || {}).length;
    var list = [
      { id: "sticky", name: "Sticky Paws", how: "Steal 1,000 Dreamies in one Grand Theft Kitty run", game: "Grand Theft Kitty", tier: "bronze", icon: "paw", got: +g.best >= 1000 },
      { id: "thief", name: "Master Thief", how: "Steal 5,000 Dreamies in one run", game: "Grand Theft Kitty", tier: "silver", icon: "paw", got: +g.best >= 5000 },
      { id: "gang", name: "The Whole Gang", how: "Bank 25,000 Dreamies and recruit all six cats", game: "Grand Theft Kitty", tier: "gold", icon: "crown", got: +g.bank >= 25000 },
      { id: "pillar", name: "Pillar of the Community", how: "Reach round 5 in Red Light, Green Light", game: "Red Light, Green Light", tier: "bronze", icon: "star", got: +r.round >= 5 },
      { id: "slab", name: "Fish on the Slab", how: "Score 1,000 in Red Light, Green Light", game: "Red Light, Green Light", tier: "silver", icon: "fish", got: +r.best >= 1000 },
      { id: "court", name: "Order in Court", how: "Score 500 in Arthur's Tribunal", game: "Arthur's Tribunal", tier: "bronze", icon: "gavel", got: a >= 500 },
      { id: "jury", name: "Hung Jury", how: "Score 1,000 in Arthur's Tribunal", game: "Arthur's Tribunal", tier: "silver", icon: "gavel", got: a >= 1000 },
      { id: "nobite", name: "Not a Bite", how: "Play Ferret's Ditch", game: "Ferret's Ditch", tier: "bronze", icon: "fish", got: +f.played >= 1 },
      { id: "tench", name: "Tench Tamer", how: "Land a tench", game: "Ferret's Ditch", tier: "bronze", icon: "fish", got: +fb.tench > 0 },
      { id: "specimen", name: "Specimen Hunter", how: "Land a specimen carp", game: "Ferret's Ditch", tier: "silver", icon: "fish", got: +fb.specimen > 0 },
      { id: "golden", name: "Golden Moment", how: "Land the golden carp", game: "Ferret's Ditch", tier: "gold", icon: "star", got: +fb.golden > 0 },
      { id: "perfect", name: "Smooth Operator", how: "Land ten fish with a perfect reel", game: "Ferret's Ditch", tier: "silver", icon: "gavel", got: +f.perfect >= 10 },
      { id: "dlegend", name: "Ditch Legend", how: "Score 1,000 in Ferret's Ditch", game: "Ferret's Ditch", tier: "gold", icon: "crown", got: +f.best >= 1000 },
      { id: "book", name: "Full Book", how: "Fill every page of the catch book (all 11)", game: "Ferret's Ditch", tier: "legend", icon: "book", got: fn >= 11 },
      { id: "reader", name: "Regular Reader", how: "Read a paper three mornings running", game: "The papers", tier: "bronze", icon: "star", got: bestRun >= 3 },
      { id: "devoted", name: "Devoted Reader", how: "Read a paper seven mornings running", game: "The papers", tier: "gold", icon: "book", got: bestRun >= 7 },
      { id: "hero", name: "Four-Game Hero", how: "Play Grand Theft Kitty, Red Light Green Light, Arthur's Tribunal and Ferret's Ditch", game: "The arcade", tier: "legend", icon: "crown", got: four >= 4 },
      /* The Kitty Grand Prix */
      { id: "lplates", name: "L Plates", how: "Finish a race in The Kitty Grand Prix", game: "The Kitty Grand Prix", tier: "bronze", icon: "flag", got: +k.races >= 1 },
      { id: "podium", name: "On the Podium", how: "Finish a race in the top three", game: "The Kitty Grand Prix", tier: "bronze", icon: "cup", got: +k.pod >= 1 || +k.open >= 1 || +k.wins >= 1 },
      { id: "fishmonger", name: "Fishmonger's Friend", how: "Drive over 25 wet fish. Nobody is proud of this one", game: "The Kitty Grand Prix", tier: "bronze", icon: "fish", got: +k.fish >= 25 },
      { id: "champ", name: "Champion of the Promenade", how: "Win a race", game: "The Kitty Grand Prix", tier: "silver", icon: "cup", got: +k.wins >= 1 },
      { id: "proper", name: "Proper Driver", how: "Win a race in the Proper Kart class", game: "The Kitty Grand Prix", tier: "silver", icon: "flag", got: +kw[1] >= 1 || +kw[2] >= 1 },
      { id: "zoomies", name: "Full Zoomies", how: "Win a race in the Full Zoomies class", game: "The Kitty Grand Prix", tier: "gold", icon: "bolt", got: +kw[2] >= 1 },
      { id: "scratch", name: "Not a Scratch", how: "Win a race without touching a wet fish or the fence", game: "The Kitty Grand Prix", tier: "gold", icon: "star", got: +k.clean >= 1 },
      { id: "kgp5k", name: "Five Thousand Club", how: "Score 5,000 points in one race", game: "The Kitty Grand Prix", tier: "gold", icon: "cup", got: +k.score >= 5000 },
      { id: "works", name: "Works Driver", how: "Win a race with every one of the six cats", game: "The Kitty Grand Prix", tier: "legend", icon: "crown", got: kcn >= 6 },
      { id: "laprecord", name: "Faster Than Spyro", how: "Finish a Full Zoomies race in under 1:32", game: "The Kitty Grand Prix", tier: "legend", icon: "bolt", got: +kb[2] > 0 && +kb[2] < 92 },
      /* harder ones for the older games */
      { id: "kingpin", name: "Kingpin", how: "Steal 10,000 Dreamies in one run", game: "Grand Theft Kitty", tier: "gold", icon: "paw", got: +g.best >= 10000 },
      { id: "baron", name: "Dreamie Baron", how: "Bank 100,000 Dreamies", game: "Grand Theft Kitty", tier: "gold", icon: "crown", got: +g.bank >= 100000 },
      { id: "enemy", name: "Public Enemy Number One", how: "Steal 15,000 Dreamies in one run", game: "Grand Theft Kitty", tier: "legend", icon: "paw", got: +g.best >= 15000 },
      { id: "smelly", name: "Smells of Fish", how: "Be handed ten wet fish by Reggie", game: "Red Light, Green Light", tier: "bronze", icon: "fish", got: +r.fish >= 10 },
      { id: "statue", name: "Living Statue", how: "Score 3,000 in Red Light, Green Light", game: "Red Light, Green Light", tier: "gold", icon: "star", got: +r.best >= 3000 },
      { id: "whisker", name: "Not a Whisker", how: "Score 4,000 in Red Light, Green Light", game: "Red Light, Green Light", tier: "legend", icon: "crown", got: +r.best >= 4000 },
      { id: "justice", name: "Lord Chief Justice", how: "Score 1,500 in Arthur's Tribunal", game: "Arthur's Tribunal", tier: "gold", icon: "gavel", got: a >= 1500 },
      { id: "supreme", name: "Supreme Court", how: "Score 2,000 in Arthur's Tribunal", game: "Arthur's Tribunal", tier: "legend", icon: "gavel", got: a >= 2000 },
      { id: "morning", name: "Decent Morning", how: "Score 400 in Ferret's Ditch", game: "Ferret's Ditch", tier: "silver", icon: "fish", got: +f.best >= 400 },
      { id: "peg", name: "Own Peg", how: "Fish Ferret's Ditch 25 times", game: "Ferret's Ditch", tier: "silver", icon: "book", got: +f.played >= 25 },
      { id: "silk", name: "Silk Hands", how: "Land fifty fish with a perfect reel", game: "Ferret's Ditch", tier: "gold", icon: "gavel", got: +f.perfect >= 50 },
      { id: "subscriber", name: "Subscriber", how: "Read a paper twenty-one mornings running", game: "The papers", tier: "legend", icon: "book", got: bestRun >= 21 },
      /* Slay the Pier */
      { id: "daytrip", name: "Day Tripper", how: "Start a climb in Slay the Pier", game: "Slay the Pier", tier: "bronze", icon: "flag", got: +p.runs >= 1 },
      { id: "wrangler", name: "Seagull Wrangler", how: "See off the boss at the end of South Pier", game: "Slay the Pier", tier: "bronze", icon: "star", got: +p.far >= 1 || +p.wins >= 1 },
      { id: "endpier", name: "End of the Pier", how: "Win a run", game: "Slay the Pier", tier: "silver", icon: "cup", got: +p.wins >= 1 },
      { id: "hightide", name: "High Tide", how: "Score 1,500 in one run", game: "Slay the Pier", tier: "silver", icon: "bolt", got: +p.best >= 1500 },
      { id: "quills", name: "Full Set of Quills", how: "Win a run with Reggie, with Terry and with Kenneth", game: "Slay the Pier", tier: "gold", icon: "book", got: phw.r > 0 && phw.t > 0 && phw.k > 0 },
      { id: "encore", name: "Encore!", how: "Win a run on Encore 2 or higher", game: "Slay the Pier", tier: "gold", icon: "cup", got: +p.mw >= 3 },
      { id: "familiar", name: "Familiar Faces", how: "Win runs with each of the six cats along", game: "Slay the Pier", tier: "gold", icon: "paw", got: pcats >= 6 },
      { id: "springtide", name: "Spring Tide", how: "Score 3,000 in one run", game: "Slay the Pier", tier: "gold", icon: "bolt", got: +p.best >= 3000 },
      { id: "catpile", name: "The Whole Pile", how: "Win a run with all six cats at once", game: "Slay the Pier", tier: "legend", icon: "paw", got: +p.six >= 1 },
      { id: "ovation", name: "Standing Ovation", how: "Win a run on Encore 5", game: "Slay the Pier", tier: "legend", icon: "crown", got: +p.mw >= 6 },
      { id: "tour", name: "Grand Tour", how: "Play Grand Theft Kitty, Red Light Green Light, Arthur's Tribunal, Ferret's Ditch and The Kitty Grand Prix", game: "The arcade", tier: "legend", icon: "flag", got: five >= 5 }
    ];
    var n = list.filter(function (b) { return b.got; }).length;
    list.push({ id: "pothunter", name: "Pot Hunter", how: "Win 25 of the other badges", game: "The arcade", tier: "gold", icon: "cup", got: n >= 25 });
    return list;
  }
  var GLYPH = {
    fish: '<ellipse cx="30" cy="35" rx="12" ry="7"/><polygon points="40,35 50,28 50,42"/><circle cx="24" cy="33" r="1.8" fill="#fff"/>',
    paw: '<ellipse cx="32" cy="40" rx="9" ry="7"/><circle cx="21" cy="31" r="3.4"/><circle cx="28" cy="25" r="3.4"/><circle cx="36" cy="25" r="3.4"/><circle cx="43" cy="31" r="3.4"/>',
    gavel: '<rect x="20" y="22" width="22" height="10" rx="2" transform="rotate(-30 31 27)"/><rect x="29" y="31" width="5" height="20" rx="2" transform="rotate(-30 31 41)"/>',
    star: '<polygon points="32,20 36,30 47,31 39,38 41,49 32,43 23,49 25,38 17,31 28,30"/>',
    crown: '<polygon points="18,44 18,26 26,34 32,22 38,34 46,26 46,44"/><rect x="18" y="45" width="28" height="4" rx="1"/>',
    book: '<path d="M18 24h13v26H18z"/><path d="M33 24h13v26H33z"/>',
    flag: '<rect x="18.5" y="20" width="3.5" height="31" rx="1"/><path d="M22 21h24v15H22z"/><g fill="#fff" stroke="none"><rect x="28" y="21.6" width="6" height="4.6"/><rect x="40" y="21.6" width="5.4" height="4.6"/><rect x="22.6" y="26.2" width="5.4" height="4.6"/><rect x="34" y="26.2" width="6" height="4.6"/><rect x="28" y="30.8" width="6" height="4.6"/><rect x="40" y="30.8" width="5.4" height="4.6"/></g>',
    cup: '<path d="M22 21h20v9a10 10 0 0 1-20 0z"/><path d="M22 23h-6v3a7 7 0 0 0 7 7v-3a4 4 0 0 1-4-4v-1h3z"/><path d="M42 23h6v3a7 7 0 0 1-7 7v-3a4 4 0 0 0 4-4v-1h-3z"/><rect x="29.5" y="39" width="5" height="6"/><rect x="23.5" y="45" width="17" height="4.5" rx="1"/>',
    bolt: '<polygon points="36,19 21,38 30.5,38 27,53 44,32 34.5,32"/>'
  };
  function medal(b, size) {
    var t = TIERS[b.tier], got = b.got, c1 = got ? t[0] : "#d9d3c0", c2 = got ? t[1] : "#a9a38f", ink = got ? "#141414" : "#8d8777", gid = "g" + b.id + size;
    var svg = '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<polygon points="16,1 28,1 38,28 26,28" fill="' + (got ? "#d1202f" : "#b9b3a0") + '" stroke="#141414" stroke-width="1.5"/><polygon points="36,1 48,1 38,28 26,28" fill="' + (got ? "#f6f2e7" : "#d9d3c0") + '" stroke="#141414" stroke-width="1.5"/>' +
      '<circle cx="32" cy="38" r="24" fill="url(#' + gid + ')" stroke="#141414" stroke-width="2.5"/><circle cx="32" cy="38" r="18" fill="none" stroke="rgba(20,20,20,.35)" stroke-width="1.5"/>' +
      '<g fill="' + ink + '" stroke="' + (got ? "#141414" : "none") + '" stroke-width="1.2" transform="translate(0 4)">' + GLYPH[b.icon] + '</g>' +
      (got ? '' : '<g transform="translate(40 46)"><rect x="0" y="5" width="12" height="9" rx="2" fill="#6f6a5b"/><path d="M2.5 5V3a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="#6f6a5b" stroke-width="2"/></g>') + '</svg>';
    return svg;
  }
  var css = ".wgwb-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:10px;margin:10px 0 4px}" +
    ".wgwb-shelf{font:400 19px/1.1 Anton,'Arial Narrow',Impact,sans-serif;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 0;padding-bottom:5px;border-bottom:3px solid #141414;display:flex;justify-content:space-between;align-items:baseline;gap:10px}.wgwb-shelf span{font:italic 400 14px Georgia,serif;text-transform:none;letter-spacing:0;color:#4a4639}" +
    ".wgwb-m{position:relative;text-align:center;border:3px solid #141414;border-radius:10px;padding:10px 6px 8px;background:#fffdf7;box-shadow:4px 4px 0 #141414;color:#141414}" +
    ".wgwb-m.locked{background:#ece7d8;box-shadow:3px 3px 0 #b9b3a0;border-color:#8d8777}.wgwb-m b{display:block;font:400 16px/1.15 Anton,'Arial Narrow',Impact,sans-serif;text-transform:uppercase;letter-spacing:.4px;margin-top:4px}" +
    ".wgwb-m.locked b{color:#5f5a4e}.wgwb-m small{display:block;font:400 13px/1.25 Spectral,Georgia,serif;color:#4a4639;margin-top:3px}.wgwb-m .g{font-style:italic;color:#6a6454;font-size:12px}" +
    ".wgwb-md{position:relative;width:76px;height:76px;margin:0 auto}.wgwb-md .sh{position:absolute;left:9.5px;top:16.6px;width:57px;height:57px;border-radius:50%;overflow:hidden;pointer-events:none}.wgwb-md .sh:after{content:'';position:absolute;top:-10%;bottom:-10%;width:30%;left:-40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);transform:skewX(-18deg);animation:wgwbshine 3.6s ease-in-out infinite}" +
    ".wgwb-m.legend.got{background:linear-gradient(160deg,#fff0f8,#efe4ff)}.wgwb-m.gold.got{background:#fff8dc}.wgwb-m .tier{position:absolute;top:6px;right:6px;font:400 11px Anton,Impact,sans-serif;letter-spacing:.5px;text-transform:uppercase;background:#141414;color:#fff;padding:3px 5px 1px;border-radius:4px}" +
    ".wgwb-m.locked .tier{background:#6b6657}.wgwb-new{position:absolute;top:-8px;left:-6px;background:#d1202f;color:#fff;font:400 12px Anton,Impact,sans-serif;letter-spacing:.6px;padding:3px 7px 1px;border-radius:4px;transform:rotate(-6deg);border:2px solid #141414}" +
    ".wgwb-bar{height:14px;border:3px solid #141414;border-radius:9px;background:#fffdf7;overflow:hidden;margin:6px 0}.wgwb-bar i{display:block;height:100%;background:linear-gradient(90deg,#d1202f,#e0a526)}" +
    ".wgwb-rank{font:400 24px Anton,Impact,sans-serif;text-transform:uppercase;letter-spacing:.5px;margin:2px 0}.wgwb-sub{margin:0;font-size:15px}" +
    ".wgwb-toast{position:fixed;left:50%;bottom:18px;transform:translate(-50%,140%);z-index:99999;display:flex;gap:12px;align-items:center;background:#141414;color:#f6f2e7;border:3px solid #e0a526;border-radius:12px;padding:10px 16px 10px 10px;max-width:92vw;box-shadow:0 8px 30px rgba(0,0,0,.5);transition:transform .45s cubic-bezier(.2,1.3,.4,1);font-family:Georgia,serif;cursor:pointer}" +
    ".wgwb-toast.in{transform:translate(-50%,0)}.wgwb-toast .t{font:400 13px Anton,Impact,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#e0a526}.wgwb-toast .n{font:400 22px/1.1 Anton,Impact,sans-serif;text-transform:uppercase}.wgwb-toast .h{font-size:13px;color:#d9d3c2}" +
    "@keyframes wgwbshine{0%{left:-40%}55%,100%{left:130%}}@media (prefers-reduced-motion:reduce){.wgwb-md .sh:after{animation:none;display:none}.wgwb-toast{transition:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var RANKS = [[0, "Window shopper"], [1, "Newcomer"], [3, "Regular"], [6, "Local hero"], [10, "Hall of famer"], [14, "Absolute legend"], [20, "Promenade royalty"], [27, "Keeper of the cabinet"], [34, "Friend of the tribunal"], [41, "Wizard of the promenade"], [51, "The last of the unemployable"]];
  function rankFor(n) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (n >= x[0]) r = x[1]; }); return r; }

  /* the wall */
  var wall = document.getElementById("badges");
  var list = defs(), got = list.filter(function (b) { return b.got; });
  if (wall) {
    var viewed = listGet("wgw-badges-viewed") || [];
    wall.textContent = "";
    wall.appendChild(el("p", "scrawl", "Your trophy cabinet"));
    wall.appendChild(el("div", "wgwb-rank", rankFor(got.length)));
    wall.appendChild(el("p", "wgwb-sub", got.length + " of " + list.length + " badges earned. " + (got.length === list.length ? "That is the lot. Frame it." : "Locked ones show how to win them.")));
    var bar = el("div", "wgwb-bar"), fill = el("i"); fill.style.width = Math.round(got.length / list.length * 100) + "%"; bar.appendChild(fill); wall.appendChild(bar);
    var SHELVES = ["Slay the Pier", "The Kitty Grand Prix", "Grand Theft Kitty", "Red Light, Green Light", "Arthur's Tribunal", "Ferret's Ditch", "The papers", "The arcade"];
    var TORDER = { bronze: 0, silver: 1, gold: 2, legend: 3 };
    SHELVES.forEach(function (name) {
      var mine = list.filter(function (b) { return b.game === name; });
      if (!mine.length) return;
      var have = mine.filter(function (b) { return b.got; }).length;
      var h = el("h3", "wgwb-shelf", name); h.appendChild(el("span", null, have + " of " + mine.length)); wall.appendChild(h);
      var grid = el("div", "wgwb-wall");
      mine.sort(function (a, b) { return ((b.got ? 1 : 0) - (a.got ? 1 : 0)) || (TORDER[a.tier] - TORDER[b.tier]); }).forEach(function (b) {
        var m = el("div", "wgwb-m " + (b.got ? "got " : "locked ") + b.tier);
        if (b.got && viewed.indexOf(b.id) < 0) m.appendChild(el("span", "wgwb-new", "New"));
        m.appendChild(el("span", "tier", TIERS[b.tier][2]));
        var md = el("div", "wgwb-md"); md.innerHTML = medal(b, 76) + (b.got ? '<span class="sh"></span>' : ''); m.appendChild(md);
        m.appendChild(el("b", null, b.name)); m.appendChild(el("small", null, b.how));
        grid.appendChild(m);
      });
      wall.appendChild(grid);
    });
    wall.appendChild(el("p", "fine", "Kept in this browser only, so they will not follow you to another device."));
    listSet("wgw-badges-viewed", got.map(function (b) { return b.id; }));
  }

  /* the toast, on game pages and anywhere else that loads this */
  var q = [], showing = false;
  function toast(b) {
    var t = el("div", "wgwb-toast"); t.setAttribute("role", "status");
    var m = el("div"); m.innerHTML = medal(b, 52); var x = el("div");
    x.appendChild(el("div", "t", "Badge unlocked")); x.appendChild(el("div", "n", b.name)); x.appendChild(el("div", "h", b.how));
    t.appendChild(m); t.appendChild(x); document.body.appendChild(t);
    function bye() { t.classList.remove("in"); setTimeout(function () { t.remove(); showing = false; next(); }, 500); }
    t.addEventListener("click", bye);
    setTimeout(function () { t.classList.add("in"); }, 30); setTimeout(bye, 6500);
  }
  function next() { if (showing || !q.length) return; showing = true; toast(q.shift()); }
  function check() {
    var now = defs().filter(function (b) { return b.got; }), seen = listGet("wgw-badges-toasted");
    if (!seen) { listSet("wgw-badges-toasted", now.map(function (b) { return b.id; })); return; }
    var fresh = now.filter(function (b) { return seen.indexOf(b.id) < 0; });
    if (fresh.length) { listSet("wgw-badges-toasted", seen.concat(fresh.map(function (b) { return b.id; }))); q = q.concat(fresh); next(); }
  }
  if (!wall) { check(); setInterval(check, 2000); } else { listSet("wgw-badges-toasted", got.map(function (b) { return b.id; })); }
})();
