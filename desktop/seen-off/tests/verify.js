// Headless check of the offline bundle: layout at 1280x800 + 1920x1080, zero external
// requests, keyboard-only start of a run (Quill, cat, map, first fight), mock-gamepad nav.
// Usage: node tests/verify.js  (serves ./web on 127.0.0.1, writes ../shots/*.png)
const path = require('path'), http = require('http'), fs = require('fs');
const { chromium } = require('playwright-core');
const D = require('./dayout-driver.js');
const WEB = path.join(__dirname, '..', 'web'), SHOTS = path.join(__dirname, '..', '..', 'shots');
const EXE = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
fs.mkdirSync(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => { const f = path.join(WEB, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(WEB) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (name, cond, extra) => { results.push({ name, pass: !!cond, extra }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

async function run(browser, w, h, tag, port) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const external = [], errors = [], all = [];
  page.on('request', rq => { const u = rq.url(); all.push(u); if (!/^(http:\/\/127\.0\.0\.1:\d+\/|data:|blob:|about:)/.test(u)) external.push(u); });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  // mock gamepad, driven from the test via window.__pad
  await page.addInitScript(() => {
    const pad = { id: 'Mock Xbox pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    window.__pad = { on: false, press(n, v) { pad.buttons[n] = { pressed: v, touched: v, value: v ? 1 : 0 }; pad.timestamp++; } };
    navigator.getGamepads = () => window.__pad.on ? [pad] : [];
    try { localStorage.clear(); } catch (e) {}
  });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await sleep(600);
  const fontsOk = await page.evaluate(() => document.fonts.check('40px Anton') && document.fonts.check('20px "Permanent Marker"') && [...document.fonts].filter(f => f.status === 'loaded').length >= 2);
  ok(`${tag} bundled fonts load`, fontsOk);
  const fit = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, bw: document.querySelector('.booth').getBoundingClientRect().width }));
  ok(`${tag} no page scroll`, fit.sw <= innerWidth(w) && fit.sh <= h, JSON.stringify(fit));
  function innerWidth(x) { return x; }
  await page.screenshot({ path: `${SHOTS}/${tag}-01-title.png` });

  const key = async (k, wait = 350) => { await page.keyboard.press(k); await sleep(wait); };
  const st = () => page.evaluate(() => ({ scr: __SO.S.scr, mode: __SO.S.mode, sel: __SO.S.sel, hero: __SO.S.hero, focus: __SODesktop.focus() && __SODesktop.focus().key, run: !!__SO.run(), cats: __SO.run() ? __SO.run().cats.slice() : [], over: __SO.B() ? __SO.B().over : null }));

  // keyboard only from here. Pick Kenneth (third Quill): right, right, Enter
  await key('ArrowRight'); await key('ArrowRight'); await key('Enter');
  let s = await st(); ok(`${tag} keyboard: pick a Quill`, s.hero === 'k', JSON.stringify(s));
  await page.screenshot({ path: `${SHOTS}/${tag}-02-title-kenneth-focused.png` });
  // down to "Begin the climb"
  for (let i = 0; i < 6 && !(s.focus || '').startsWith('begin'); i++) { await key((s.focus || '').startsWith('album') ? 'ArrowLeft' : 'ArrowDown'); s = await st(); }
  ok(`${tag} keyboard: reach Begin`, (s.focus || '').startsWith('begin'), s.focus);
  await key('Enter', 900);
  s = await st(); ok(`${tag} keyboard: cat screen`, s.scr === 'cat', s.scr);
  await key('ArrowRight');
  await page.screenshot({ path: `${SHOTS}/${tag}-03-cat-pick.png` });
  await key('Enter', 900);
  s = await st(); ok(`${tag} keyboard: cat chosen, on the stage picker`, s.scr === 'stage' && s.cats.length === 1, JSON.stringify(s.cats));
  const fitS = await page.evaluate(D.fits); ok(`${tag} stage picker fits, nothing scrolls`, fitS.ok, JSON.stringify(fitS));
  ok(`${tag} first day out: only the Prom is open for the morning`, (await page.evaluate(() => [...document.querySelectorAll('[data-a=place]')].map(b => b.dataset.i + (b.disabled ? '-' : '+')).join(' '))) === 'prom+ beach- rock-');
  await page.screenshot({ path: `${SHOTS}/${tag}-03b-stage-picker.png` });
  await key('Enter', 900);
  s = await st(); ok(`${tag} keyboard: Enter goes to the Prom`, s.scr === 'map' && (await page.evaluate(() => __SO.run().stage)) === 'prom', s.scr);
  await sleep(1800); // pier arrival card fades on its own
  await page.screenshot({ path: `${SHOTS}/${tag}-04-map.png` });
  await key('Enter', 2600); // first stop (bottom row is all fights)
  s = await st(); ok(`${tag} keyboard: into first fight`, s.scr === 'combat', s.scr);
  await sleep(1200);
  await page.screenshot({ path: `${SHOTS}/${tag}-05-fight.png` });
  // play the hand: Enter picks up the focused card, Enter again (or on a target) plays it
  let played = 0, shotTarget = false;
  for (let turn = 0; turn < 12; turn++) {
    s = await st(); if (s.scr !== 'combat' || s.over) break;
    for (let g = 0; g < 8; g++) {
      const can = await page.evaluate(() => __SO.B() && !__SO.B().over && __SO.B().hand.some(c => __SO.playable(c)) && __SO.S.scr === 'combat');
      if (!can) break;
      const before = await page.evaluate(() => __SO.B().hand.length + ':' + __SO.B().energy);
      await key('Enter', 450);
      s = await st();
      if ((s.focus || '').startsWith('enemy')) {
        if (!shotTarget) { await page.screenshot({ path: `${SHOTS}/${tag}-06-targeting.png` }); shotTarget = true; }
        await key('Enter', 900);
      } else if (s.sel >= 0) { if (!shotTarget) { await page.screenshot({ path: `${SHOTS}/${tag}-06-card-picked.png` }); } await key('Enter', 900); }
      const after = await page.evaluate(() => __SO.B() ? __SO.B().hand.length + ':' + __SO.B().energy : 'x');
      if (after !== before) played++; else { await key('ArrowRight'); }
    }
    s = await st(); if (s.scr !== 'combat' || s.over) break;
    await key('e', 2600);
  }
  ok(`${tag} keyboard: cards played`, played > 0, 'played=' + played);
  await sleep(1500);
  s = await st();
  await page.screenshot({ path: `${SHOTS}/${tag}-07-after-fight-${s.scr}.png` });
  ok(`${tag} first fight resolved`, s.scr === 'reward' || s.scr === 'over' || (s.scr==='combat' && s.over), s.scr);
  // Escape opens the menu (when there is nothing to back out of)
  if (s.scr === 'reward' || s.scr === 'map') {
    await key('Escape', 400); const m = await page.evaluate(() => !document.getElementById('soMenu').hidden);
    ok(`${tag} Esc opens menu`, m); await page.screenshot({ path: `${SHOTS}/${tag}-08-menu.png` });
    for (let i = 0; i < 8 && !(await page.evaluate(() => (__SODesktop.focus() || {}).key || '')).startsWith('howto'); i++) await key('ArrowDown');
    await key('Enter', 400);
    await page.screenshot({ path: `${SHOTS}/${tag}-09-howto.png` });
    await key('Escape'); await key('Escape');
    ok(`${tag} menu closes`, await page.evaluate(() => document.getElementById('soMenu').hidden));
  }
  // mock gamepad: start a fresh tab state at the title and navigate with the d-pad + A
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' }); await sleep(500);
  await page.evaluate(() => { window.__pad.on = true; });
  const tap = async n => { await page.evaluate(n => __pad.press(n, true), n); await sleep(120); await page.evaluate(n => __pad.press(n, false), n); await sleep(250); };
  await sleep(200); await tap(15); await tap(0);
  s = await st(); ok(`${tag} gamepad: d-pad right + A picks Terry`, s.hero === 't', JSON.stringify(s));
  await page.screenshot({ path: `${SHOTS}/${tag}-10-gamepad-title.png` });
  await tap(9); ok(`${tag} gamepad: Start opens menu`, await page.evaluate(() => !document.getElementById('soMenu').hidden));
  await tap(1); ok(`${tag} gamepad: B closes menu`, await page.evaluate(() => document.getElementById('soMenu').hidden));

  // controller only (no keyboard, no mouse): a whole first fight and back to the map
  if (w === 1280) {
    await page.evaluate(() => { localStorage.clear(); }); await page.reload({ waitUntil: 'networkidle' }); await sleep(500);
    await page.evaluate(() => { window.__pad.on = true; }); await sleep(200);
    const fk = () => page.evaluate(() => (__SODesktop.focus() || {}).key || '');
    const padTo = async (pre, btn = 13) => { for (let i = 0; i < 8 && !(await fk()).startsWith(pre); i++) await tap((await fk()).startsWith('album') ? 14 : btn); return (await fk()).startsWith(pre); };
    ok(`${tag} pad: reach Begin`, await padTo('begin')); await tap(0); await sleep(700);
    s = await st(); ok(`${tag} pad: cat screen`, s.scr === 'cat'); await tap(0); await sleep(700);
    s = await st(); ok(`${tag} pad: stage picker`, s.scr === 'stage'); await tap(0); await sleep(2400);
    s = await st(); ok(`${tag} pad: map`, s.scr === 'map'); await page.screenshot({ path: `${SHOTS}/${tag}-11-pad-map.png` });
    await tap(0); await sleep(2600); s = await st(); ok(`${tag} pad: fight`, s.scr === 'combat');
    await tap(3); await sleep(500); s = await st(); ok(`${tag} pad: Y opens deck`, s.mode === 'deck');
    await page.screenshot({ path: `${SHOTS}/${tag}-12-pad-deck.png` });
    await tap(1); await sleep(500); s = await st(); ok(`${tag} pad: B closes deck`, s.mode === null && s.scr === 'combat');
    let shot = false;
    for (let turn = 0; turn < 14; turn++) {
      s = await st(); if (s.scr !== 'combat' || s.over) break;
      for (let g = 0; g < 8; g++) {
        const can = await page.evaluate(() => __SO.B() && !__SO.B().over && __SO.S.scr === 'combat' && __SO.B().hand.some(c => __SO.playable(c)));
        if (!can) break;
        const before = await page.evaluate(() => __SO.B().hand.length + ':' + __SO.B().energy);
        await tap(0); await sleep(300);
        if (!shot) { await page.screenshot({ path: `${SHOTS}/${tag}-13-pad-fight.png` }); shot = true; }
        await tap(0); await sleep(800);
        const after = await page.evaluate(() => __SO.B() ? __SO.B().hand.length + ':' + __SO.B().energy : 'x');
        if (after === before) { await tap(1); await tap(15); }
      }
      s = await st(); if (s.scr !== 'combat' || s.over) break;
      await tap(2); await sleep(2600);
    }
    await sleep(1500); s = await st(); ok(`${tag} pad: fight won`, s.scr === 'reward', s.scr);
    await page.screenshot({ path: `${SHOTS}/${tag}-14-pad-reward.png` });
    if (s.scr === 'reward') { await tap(0); await sleep(1200); s = await st(); ok(`${tag} pad: took a card, back on map`, s.scr === 'map', s.scr); }
  }

  ok(`${tag} zero external requests`, external.length === 0, external.slice(0, 5).join(' ') + ` (total requests ${all.length})`);
  ok(`${tag} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
// "A Blackpool Day Out" (milestone 1): stage picker, unlocks, stamp, combo, coin shower,
// postcard album, Day Out Report, souvenir shop, saving, Last Orders. 1280x800 (Steam Deck).
async function dayOut(browser, port) {
  const tag = 'm1', ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), external = [], errors = [];
  page.on('request', rq => { const u = rq.url(); if (!/^(http:\/\/127\.0\.0\.1:\d+\/|data:|blob:|about:)/.test(u)) external.push(u); });
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('m1')) { localStorage.clear(); sessionStorage.setItem('m1', '1'); } });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' }); await sleep(700);
  const ev = (f, a) => page.evaluate(f, a), key = async (k, w = 350) => { await page.keyboard.press(k); await sleep(w); };
  const fk = () => ev(() => (__SODesktop.focus() || {}).key || ''), scr = () => ev(() => __SO.S.scr);
  const fits = async name => { const f = await ev(D.fits); ok(`${tag} ${name} fits 1280x800, nothing scrolls or clips`, f.ok, JSON.stringify(f)); };
  const places = () => ev(() => [...document.querySelectorAll('[data-a=place]')].map(b => b.dataset.i + (b.disabled ? '-' : '+')).join(' '));
  const auto = async (until, opt, max = 900) => { for (let k = 0; k < max; k++) { const s = await scr(); if (until(s)) return true; const r = await ev(D.step, opt); if (r === 'stop') return until(await scr()); await sleep(r === 'play' || r === 'end' ? 650 : 320); } return false; };

  // --- first day out: keyboard into the Prom
  await ev(() => { __SO.act('hero', 't'); __SO.act('begin'); }); await sleep(400); await ev(() => __SO.act('cat', 'spyro')); await sleep(500);
  ok(`${tag} first run: stage picker locked to the classic route`, (await places()) === 'prom+ beach- rock-');
  await page.screenshot({ path: `${SHOTS}/m1-01a-stage-picker-first-run.png` });
  await key('ArrowLeft');
  ok(`${tag} keyboard: focus starts on the Prom`, (await fk()).startsWith('place|prom'), await fk());
  await key('Enter', 900); ok(`${tag} Prom map, five stops`, (await scr()) === 'map' && (await ev(() => __SO.run().map.length)) === 5);
  await sleep(1500); await ev(() => document.querySelector('#view .node.go').click()); await sleep(2600);
  ok(`${tag} first Prom fight uses Prom enemies`, (await ev(() => __SO.B().en.map(e => e.k).every(k => ['breeze', 'lamppost', 'inspector', 'stag', 'pigeon'].includes(k)))), await ev(() => __SO.B().en.map(e => e.k).join(',')));

  // --- combo: 7 cards in one turn, then the last card sees everything off
  await ev(() => { const B = __SO.B(); B.energy = 99; B.en.forEach(e => { e.hp = e.max = 999; }); while (B.hand.length < 9 && B.draw.length) B.hand.push(B.draw.pop()); while (B.hand.length < 9) B.hand.push({ id: B.hand[0].id, u: 0 }); __SO.render(); });
  const tiers = [];
  const playOne = () => ev(() => { const B = __SO.B(), S = __SO.S, i = B.hand.findIndex(c => __SO.playable(c)); if (i < 0) return false; __SO.act('card', i); const d = __SO.CARDS[B.hand[i].id]; if (d.o && d.o.t) __SO.act('enemy', B.en.findIndex(e => !e.dead)); else __SO.act('card', i); return true; });
  for (let n = 0; n < 7; n++) { await ev(() => { __SO.B().energy = 99; }); await playOne(); await sleep(420); tiers.push(await ev(() => (document.querySelector('#soCombo span') || {}).textContent || '')); }
  ok(`${tag} combo counter: Nice. at 3, Proper job! at 5, Ey up! at 7`, tiers[2] === 'Nice.' && tiers[4] === 'Proper job!' && tiers[6] === 'Ey up!', tiers.join(' | '));
  ok(`${tag} combo shown in the 1280x800 stage`, await ev(() => { const c = document.getElementById('soCombo'), r = c.getBoundingClientRect(); return c.classList.contains('on') && r.right <= innerWidth && r.top >= 0; }));
  await ev(() => { const B = __SO.B(); B.energy = 99; B.en.forEach(e => { e.hp = 1; e.block = 0; }); }); await playOne();
  let stamped = false; for (let i = 0; i < 12 && !stamped; i++) { await sleep(120); stamped = await ev(() => document.querySelectorAll('.so-stamp').length > 0); }
  ok(`${tag} SEEN OFF! stamp lands on the fallen`, stamped && await ev(() => /SEEN OFF!/.test(document.querySelector('.so-stamp').textContent)));
  await sleep(250); await page.screenshot({ path: `${SHOTS}/m1-02-seen-off-stamp-combo.png` });
  ok(`${tag} combo of 8 recorded`, (await ev(() => __SO.B().cmax)) >= 8, String(await ev(() => __SO.B().cmax)));
  let rw = false; for (let i = 0; i < 60 && !rw; i++) { await sleep(100); rw = await ev(() => __SO.S.scr === 'reward' && !__SO.beating()); }
  await sleep(250);
  const coins = await ev(() => __SO.fx());
  ok(`${tag} coin shower on the reward screen`, rw && coins > 10, 'particles=' + coins);
  ok(`${tag} combo bonus in the loot (Ey up! +10)`, await ev(() => !!(__SO.S.rw.combo && __SO.S.rw.combo.g === 10 && document.querySelector('.lt.combo'))));
  await sleep(900); await page.screenshot({ path: `${SHOTS}/m1-02b-reward-coins.png` });

  // --- the rest of the day, through the game's own buttons (fights shortened)
  ok(`${tag} Prom done, afternoon picker`, await auto(s => s === 'stage', { cheat: true }));
  ok(`${tag} afternoon locked to South Pier on the first run`, (await places()) === 'south+ park- tower-', await places());
  ok(`${tag} Prom postcard: visited + seen off`, await ev(() => !!(__SO.DAY.album.prom.v && __SO.DAY.album.prom.s)));
  ok(`${tag} rock banked after the stage`, (await ev(() => __SO.DAY.rock)) > 0, String(await ev(() => __SO.DAY.rock)));
  await fits('afternoon picker');
  ok(`${tag} played through to the Day Out Report`, await auto(s => s === 'report', { cheat: true }));
  await sleep(3200);
  const rep = await ev(() => __SO.S.end.rep);
  ok(`${tag} report: a won day, four places`, rep.won && rep.places.join(',') === 'prom,south,central,north', rep.places.join(','));
  ok(`${tag} report counts up its stats`, await ev(() => [...document.querySelectorAll('.report dd[data-n]')].every(d => d.textContent === d.dataset.n)));
  ok(`${tag} report: Quill-voice postcard note`, /Hit everything/.test(rep.note), rep.note);
  ok(`${tag} first win opens Last Orders`, rep.firstWin && /Last Orders is now open/.test(await ev(() => document.querySelector('.report').textContent)));
  ok(`${tag} sticks of rock pulled`, (await ev(() => __SO.DAY.sticks)) >= 1, 'sticks=' + await ev(() => __SO.DAY.sticks) + ' rock=' + await ev(() => __SO.DAY.rock));
  await fits('Day Out Report');
  await page.screenshot({ path: `${SHOTS}/m1-04-day-out-report.png` });
  ok(`${tag} keyboard: report focus on the way home`, (await fk()).startsWith('home'), await fk());

  // --- album by keyboard
  for (let i = 0; i < 4 && !(await fk()).startsWith('album'); i++) await key('ArrowRight');
  await key('Enter', 500);
  ok(`${tag} postcard album opens`, (await ev(() => __SO.S.mode)) === 'album');
  ok(`${tag} album: 4 postcards visited, 10 still blank`, (await ev(() => document.querySelectorAll('.pcard:not(.blank)').length)) === 4 && (await ev(() => document.querySelectorAll('.pcard.blank').length)) === 10);
  await fits('postcard album'); await page.screenshot({ path: `${SHOTS}/m1-03-postcard-album.png` });
  await key('ArrowRight'); await key('Enter', 400);
  ok(`${tag} album: rock collection tab by keyboard`, (await ev(() => __SO.S.tab)) === 'rock', await ev(() => __SO.S.tab));
  await fits('rock collection'); await page.screenshot({ path: `${SHOTS}/m1-03b-rock-collection.png` });
  await key('Escape', 400); ok(`${tag} Esc closes the album`, (await ev(() => __SO.S.mode)) === null && (await scr()) === 'report');

  // --- souvenir shop
  for (let i = 0; i < 4 && !(await fk()).startsWith('home'); i++) await key('ArrowLeft');
  await key('Enter', 500); ok(`${tag} souvenir shop`, (await scr()) === 'souvenir');
  await fits('souvenir shop');
  const g0 = await ev(() => __SO.run().gold); await key('Enter', 400); const g1 = await ev(() => __SO.run().gold);
  ok(`${tag} keyboard: buy a souvenir with leftover Scrumplings`, g1 < g0 && Object.keys(await ev(() => __SO.DAY.shelf)).length >= 1, g0 + ' -> ' + g1);
  await page.screenshot({ path: `${SHOTS}/m1-05-souvenir-shop.png` });
  await ev(() => document.querySelector('[data-a=gohome]').click()); await sleep(500);
  ok(`${tag} home to the title`, (await scr()) === 'title' && !(await ev(() => __SO.run())));

  // --- saved between sessions; second day out has new places
  await page.reload({ waitUntil: 'networkidle' }); await sleep(600);
  ok(`${tag} album and rock survive a restart`, (await ev(() => Object.keys(__SO.DAY.album).length)) === 4 && (await ev(() => __SO.META.wins)) === 1);
  await ev(() => { __SO.act('hero', 'k'); __SO.act('begin'); }); await sleep(400); await ev(() => __SO.act('cat', 'dexter')); await sleep(500);
  ok(`${tag} second day: the Beach has opened`, /beach\+/.test(await places()), await places());
  ok(`${tag} new place wears a New! tag`, await ev(() => !!document.querySelector('[data-i=beach] .tag.new')));
  await fits('second-day picker'); await page.screenshot({ path: `${SHOTS}/m1-01-stage-picker.png` });
  await ev(() => document.querySelector('[data-i=beach]').click()); await sleep(900);
  ok(`${tag} coming-soon place says so and borrows Prom enemies`, /Coming soon/.test(await ev(() => document.querySelector('#view .panel').textContent)) && (await ev(() => __SO.run().stage)) === 'beach');
  await page.reload({ waitUntil: 'networkidle' }); await sleep(600);
  ok(`${tag} resume shows the place`, /The Beach/.test(await ev(() => (document.querySelector('[data-a=resume]') || {}).textContent || '')));
  await ev(() => document.querySelector('[data-a=resume]').click()); await sleep(600);
  ok(`${tag} resumed run is still at the Beach`, (await ev(() => __SO.run().stage)) === 'beach' && (await scr()) === 'map');

  // --- Last Orders (open after the first win)
  await ev(() => { const R = __SO.run(); R.part = 4; __SO.S.scr = 'stage'; __SO.render(); }); await sleep(600);
  ok(`${tag} Last Orders: the B&B and the Old Pier are open`, (await places()) === 'bnb+ oldpier+', await places());
  ok(`${tag} Last Orders: Call it a day`, await ev(() => !!document.querySelector('[data-a=callday]')));
  await fits('Last Orders picker'); await page.screenshot({ path: `${SHOTS}/m1-06-last-orders.png` });
  await ev(() => document.querySelector('[data-a=callday]').click()); await sleep(1200);
  ok(`${tag} calling it a day ends on the report`, (await scr()) === 'report' && await ev(() => __SO.S.end.won));

  ok(`${tag} achievements: combo, postcard, rock`, await ev(() => { const u = SeenOffAchievements.unlocked(); return !!(u.PROPER_JOB && u.FIRST_POSTCARD && u.FIRST_STICK && u.RUN_WON); }), Object.keys(await ev(() => SeenOffAchievements.unlocked())).join(','));
  ok(`${tag} trade-mark check: no banned names in the page`, !(await ev(() => /Pleasure Beach|Illuminations|Blackpool Tower|Dreamies|Grok/i.test(document.documentElement.outerHTML))));
  ok(`${tag} zero external requests`, external.length === 0, external.slice(0, 5).join(' '));
  ok(`${tag} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
// Milestone 2a: boss bill, NEW! stamp, boss-tile wording, effects setting, and a keyboard
// walk through the screens M1 only clicked: shop, rest, red-pen edit, event, keepsake, boss rewards.
async function m2a(browser, port) {
  const tag = 'm2a', ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), external = [], errors = [];
  page.on('request', rq => { const u = rq.url(); if (!/^(http:\/\/127\.0\.0\.1:\d+\/|data:|blob:|about:)/.test(u)) external.push(u); });
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('m2a')) { localStorage.clear(); sessionStorage.setItem('m2a', '1'); } });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' }); await sleep(700);
  const ev = (f, a) => page.evaluate(f, a), key = async (k, w = 350) => { await page.keyboard.press(k); await sleep(w); };
  const fk = () => ev(() => (__SODesktop.focus() || {}).key || ''), scr = () => ev(() => __SO.S.scr);
  const focusTo = async (pre, keys = ['ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) => { for (let i = 0; i < 24 && !(await fk()).startsWith(pre); i++) await key(keys[i % keys.length], 160); return (await fk()).startsWith(pre); };
  const force = t => ev(t => { const R = __SO.run(); R.map[R.row + 1].forEach(n => n.t = t); __SO.render(); }, t);
  const enterNext = async () => { await key('ArrowLeft', 200); await key('Enter', 1400); };
  await ev(() => { __SO.act('hero', 'r'); __SO.act('begin'); }); await sleep(400); await ev(() => __SO.act('cat', 'arthur')); await sleep(400);
  await ev(() => document.querySelector('[data-i=prom]').click()); await sleep(1500);
  ok(`${tag} Prom boss tile says "the end of the line"`, /the end of the line/.test(await ev(() => document.querySelector('.node.t-B').textContent)), await ev(() => document.querySelector('.node.t-B').textContent));
  // shop by keyboard
  await force('S'); await enterNext(); ok(`${tag} keyboard: into the shop`, (await scr()) === 'shop');
  ok(`${tag} keyboard: reach Leave in the shop`, await focusTo('leave'), await fk()); await key('Enter', 900); ok(`${tag} keyboard: out of the shop`, (await scr()) === 'map');
  // rest, then red-pen edit by keyboard
  await force('R'); await enterNext(); ok(`${tag} keyboard: rest stop`, (await scr()) === 'rest');
  ok(`${tag} keyboard: reach Edit`, await focusTo('edit'), await fk()); await key('Enter', 500);
  ok(`${tag} keyboard: edit opens the deck`, (await ev(() => __SO.S.mode)) === 'edit');
  const up0 = await ev(() => __SO.run().deck.filter(c => c.u).length); await key('Enter', 900);
  ok(`${tag} keyboard: a card improved, back on the map`, (await ev(() => __SO.run().deck.filter(c => c.u).length)) === up0 + 1 && (await scr()) === 'map', await scr());
  // event by keyboard
  await force('E'); await enterNext(); ok(`${tag} keyboard: event`, (await scr()) === 'event');
  await key('Enter', 600); ok(`${tag} keyboard: event option chosen`, await ev(() => !!__SO.S.ev.res));
  await focusTo('leave'); await key('Enter', 900); ok(`${tag} keyboard: event left`, (await scr()) === 'map', await scr());
  // keepsake
  await force('T'); await enterNext(); ok(`${tag} keyboard: keepsake stop`, (await scr()) === 'treasure');
  await focusTo('leave'); await key('Enter', 900); ok(`${tag} keyboard: keepsake left`, (await scr()) === 'map');
  // boss: the bill, NEW! cards and the boss reward by keyboard
  await force('B'); await enterNext(); await sleep(300);
  const bill = await ev(() => { const b = document.querySelector('.so-bill'); return b ? b.textContent : ''; });
  ok(`${tag} TONIGHT ONLY bill before the boss`, /Tonight only/i.test(bill) && /Last Tram/i.test(bill), bill);
  await page.screenshot({ path: `${SHOTS}/m2-01-boss-bill.png` });
  await ev(() => { const B = __SO.B(); B.energy = 99; B.en.forEach(e => { e.hp = 1; e.block = 0; }); const i = B.hand.findIndex(c => __SO.playable(c) && __SO.CARDS[c.id].type === 'A'); __SO.act('card', i); if (__SO.CARDS[B.hand[i].id].o.t) __SO.act('enemy', 0); else __SO.act('card', i); });
  for (let i = 0; i < 60 && !(await ev(() => __SO.S.scr === 'reward' && !__SO.beating())); i++) await sleep(100);
  await sleep(1200);
  ok(`${tag} boss reward heading names the place`, /The Prom is yours/.test(await ev(() => document.querySelector('.panel h2').textContent)));
  await key('ArrowLeft', 200); ok(`${tag} keyboard: boss reward focused first`, (await fk()).startsWith('boss'), await fk()); await key('Enter', 500);
  ok(`${tag} keyboard: boss reward taken`, await ev(() => !!__SO.S.rw.bossTook)); await sleep(900);
  const nw = await ev(() => document.querySelectorAll('.so-newst').length);
  ok(`${tag} NEW! stamp on never-seen reward cards`, nw >= 1, 'new=' + nw);
  await page.screenshot({ path: `${SHOTS}/m2-02-new-stamp.png` });
  await focusTo('take'); await key('Enter', 700); ok(`${tag} keyboard: card taken`, await ev(() => !!__SO.S.rw.took));
  await focusTo('leave'); await key('Enter', 900); ok(`${tag} keyboard: card taken, on to the afternoon`, (await scr()) === 'stage', await scr());
  // effects setting from the menu
  await key('Escape', 400); ok(`${tag} menu opens`, await ev(() => !document.getElementById('soMenu').hidden));
  ok(`${tag} keyboard: reach Effects`, await focusTo('fx', ['ArrowDown']), await fk());
  await key('Enter', 300); ok(`${tag} effects: full -> calm`, (await ev(() => __SO.fxl())) === 1 && !(await ev(() => __SO.rm())) && /calm/.test(await ev(() => document.getElementById('soFx').textContent)));
  await key('Enter', 300); ok(`${tag} effects: calm -> off (reduced motion)`, (await ev(() => __SO.fxl())) === 0 && await ev(() => __SO.rm()), await ev(() => __SO.fxl() + ' rm=' + __SO.rm()));
  await key('Enter', 300); await key('Enter', 300); ok(`${tag} effects: back round to calm`, (await ev(() => __SO.fxl())) === 1);
  await page.reload({ waitUntil: 'networkidle' }); await sleep(500); ok(`${tag} effects setting saved`, (await ev(() => __SO.fxl())) === 1);
  await ev(() => __SO.setFx(2));
  ok(`${tag} zero external requests`, external.length === 0, external.slice(0, 5).join(' '));
  ok(`${tag} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
const M2 = { m2a };
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  const ONLY = (process.env.ONLY || '').split(',').filter(Boolean), want = n => !ONLY.length || ONLY.includes(n);
  try { if (want('base')) { await run(browser, 1280, 800, '1280x800', port); await run(browser, 1920, 1080, '1920x1080', port); }
    if (want('m1')) await dayOut(browser, port);
    for (const [n, f] of Object.entries(M2)) if (want(n)) await f(browser, port); }
  catch (e) { console.error(e); results.push({ name: 'exception', pass: false, extra: String(e) }); }
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(SHOTS, 'verify-results.json'), JSON.stringify(results, null, 2));
  const f = results.filter(r => !r.pass).length; console.log(`\n${results.length - f}/${results.length} passed`); process.exit(f ? 1 : 0);
})();
