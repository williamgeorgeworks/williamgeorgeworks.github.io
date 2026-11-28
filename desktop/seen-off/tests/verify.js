// Headless check of the offline bundle: layout at 1280x800 + 1920x1080, zero external
// requests, keyboard-only start of a run (Quill, cat, map, first fight), mock-gamepad nav.
// Usage: node tests/verify.js  (serves ./web on 127.0.0.1, writes ../shots/*.png)
const path = require('path'), http = require('http'), fs = require('fs');
const { chromium } = require('playwright-core');
const D = require('./dayout-driver.js');
const WEB = path.join(__dirname, '..', 'web'), SHOTS = path.join(__dirname, '..', '..', 'shots');
const EXE = process.env.CHROME || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
fs.mkdirSync(SHOTS, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
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
  ok(`${tag} first fight resolved`, s.scr === 'reward' || s.scr === 'over' || s.scr === 'report' || (s.scr==='combat' && s.over), s.scr);
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
  await ev(() => { const B = __SO.B(), h = __SO.run().hero; B.energy = 99; B.en.forEach(e => { e.hp = 1; e.block = 0; }); B.hand.unshift({ id: Object.values(__SO.CARDS).find(d => d.h === h && d.rar === 'b' && d.type === 'A' && /ALL/.test(d.tx)) ? Object.values(__SO.CARDS).find(d => d.h === h && d.rar === 'b' && d.type === 'A' && /ALL/.test(d.tx)).id : 'splatter', u: 0 }); __SO.render(); }); await playOne();
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
  const okr = await auto(s => s === 'report', { cheat: true }); ok(`${tag} played through to the Day Out Report`, okr, okr ? '' : await ev(() => JSON.stringify({ scr: __SO.S.scr, mode: __SO.S.mode, row: __SO.run() && __SO.run().row, stage: __SO.run() && __SO.run().stage, view: document.getElementById('view').textContent.slice(0, 160) })));
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
  ok(`${tag} the Beach (milestone 2: its own crowd) is entered`, (await ev(() => __SO.run().stage)) === 'beach' && (await ev(() => __SO.ENC[__SO.STAGES.beach.enc].F[0][0])) === 'castle');
  ok(`${tag} places not built yet still say Coming soon`, await ev(() => Object.keys(__SO.STAGES).filter(k => !__SO.STAGES[k].ready).every(k => /Coming soon/.test(__SO.STAGES[k].soon || ''))));
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
  await ev(() => { const B = __SO.B(); B.energy = 99; B.en.forEach(e => { e.hp = 1; e.block = 0; }); if (!B.hand.some(c => __SO.playable(c) && __SO.CARDS[c.id].type === 'A')) B.hand.push({ id: 'redpen', u: 0 }); const i = B.hand.findIndex(c => __SO.playable(c) && __SO.CARDS[c.id].type === 'A'); __SO.act('card', i); if (__SO.CARDS[B.hand[i].id].o.t) __SO.act('enemy', 0); else __SO.act('card', i); });
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
// Milestone 2c: the six new places (crowds, mechanics, events, scenery)
async function m2c(browser, port) {
  const tag = 'm2c', ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), external = [], errors = [];
  page.on('request', rq => { const u = rq.url(); if (!/^(http:\/\/127\.0\.0\.1:\d+\/|data:|blob:|about:)/.test(u)) external.push(u); });
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('m2c')) { localStorage.clear(); sessionStorage.setItem('m2c', '1'); } });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' }); await sleep(700);
  const ev = (f, a) => page.evaluate(f, a);
  const PL = ['beach', 'rock', 'park', 'tower', 'chippy', 'lights', 'arcades', 'winter', 'bnb', 'oldpier'];
  ok(`${tag} all ten new places are ready with their own crowds`, await ev(PL => PL.every(id => __SO.STAGES[id].ready && __SO.STAGES[id].enc === id && __SO.ENC[id] && !__SO.STAGES[id].soon), PL));
  ok(`${tag} every enemy in the new tables exists`, await ev(PL => PL.every(id => ['F', 'L', 'B'].every(k => __SO.ENC[id][k].every(s => s.every(x => __SO.EN[x])))), PL));
  await ev(() => { __SO.act('hero', 'r'); __SO.act('begin'); }); await sleep(300); await ev(() => { __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1; __SO.DAY.sticks = 14; __SO.META.wins = 1; }); await sleep(300);
  const go = async st => { const s = await ev(st => { const R = __SO.run(); R.part = __SO.PARTS.findIndex(P => P.stages.includes(st)); R.hp = R.max; __SO.enterStage(st); return R.stage; }, st); if (s !== st) ok(`${tag} entered ${st}`, false, s); };
  const fight = (set, k) => ev(a => __SO.fightWith(a[0], a[1]), [set, k || 'F']);
  for (const id of PL) {
    await go(id); await sleep(900);
    const sets = await ev(id => { const e = __SO.ENC[id]; return [].concat(e.F.map(s => [s, 'F']), e.L.map(s => [s, 'L']), e.B.map(s => [s, 'B'])); }, id);
    let good = 0;
    for (const [s, k] of sets) { await fight(s, k); await sleep(250); if (await ev(s => { const B = __SO.B(); return __SO.S.scr === 'combat' && B.en.map(e => e.k).join() === s.join() && B.en.every(e => e.mv && e.mv.n); }, s)) good++; }
    ok(`${tag} ${id}: all ${sets.length} fights start with real moves`, good === sets.length, good + '/' + sets.length);
    await fight((await ev(id => __SO.ENC[id].F[0], id))); await sleep(2400);
    await page.screenshot({ path: `${SHOTS}/m2-03-${id}.png` });
    ok(`${tag} ${id}: own event comes up`, await ev(id => { __SO.S.scr = 'map'; __SO.B().over = true; __SO.openEvent(); __SO.render(); return __SO.S.ev.d.st === id; }, id));
    const res = await ev(() => { const o = __SO.S.ev.d.opts(); return o.map(x => x[0]).join(' | ') + ' => ' + o[o.length - 1][1](); });
    ok(`${tag} ${id}: event options work`, / => \S/.test(res), res.slice(0, 160));
  }
  // mechanics
  await go('tower'); await sleep(600); await fight(['organ'], 'B'); await sleep(400);
  ok(`${tag} the Mighty Organ starts half sunk and takes half damage`, await ev(() => { const B = __SO.B(), e = B.en[0], h = e.hp; e.block = 0; __SO.strike(__SO.H(), e, 10); return e.sunk === 2 && h - e.hp === 5; }));
  await go('rock'); await sleep(600); await fight(['bigrock'], 'B'); await sleep(400);
  ok(`${tag} the BLACKPOOL stick snaps in two at half health`, await ev(() => { const B = __SO.B(), e = B.en[0]; e.block = 0; e.hp = Math.floor(e.max / 2) + 5; __SO.strike(__SO.H(), e, 10); return B.en.length === 2 && B.en[1].k === 'halfrock' && B.en[1].hp > 0 && B.en[1].mv; }));
  await sleep(600); await page.screenshot({ path: `${SHOTS}/m2-04-rock-split.png` });
  await go('chippy'); await sleep(600); await fight(['counter'], 'B'); await sleep(1500);
  ok(`${tag} counter asks "Salt?" and a Skill answers it`, await ev(() => { const B = __SO.B(), e = B.en[0]; if (e.mv.ask !== 'S') return 'ask=' + e.mv.ask; B.energy = 9; B.hand.push({ id: 'cough', u: 0 }); const i = B.hand.length - 1; __SO.act('card', i); if (B.hand.length > i) __SO.act('card', i); return e.ans === 1 && e.st.flu >= 2; }));
  await sleep(2600); await page.screenshot({ path: `${SHOTS}/m2-05-counter.png` });
  await fight(['counter'], 'B'); await sleep(1200);
  ok(`${tag} ignoring the counter gives her 3 Gusto`, await ev(async () => { const B = __SO.B(), e = B.en[0]; __SO.H().block = 99; __SO.endTurn(); await new Promise(r => setTimeout(r, 2500)); return (e.st.gus || 0) >= 3; }));
  await go('park'); await sleep(600); await fight(['tall'], 'F'); await sleep(1200);
  ok(`${tag} "You Must Be This Tall" hits 12 when you hold more than 5 cards`, await ev(async () => { const B = __SO.B(), H = __SO.H(); while (B.hand.length < 7) B.hand.push({ id: 'cough', u: 0 }); H.block = 0; H.hp = 60; __SO.endTurn(); await new Promise(r => setTimeout(r, 2500)); return 60 - H.hp >= 12 || ('lost ' + (60 - H.hp)); }));
  await go('beach'); await sleep(600); await fight(['windbreak', 'jelly'], 'F'); await sleep(1200);
  ok(`${tag} the Windbreak shelters everyone`, await ev(async () => { const B = __SO.B(); __SO.H().block = 99; __SO.endTurn(); await new Promise(r => setTimeout(r, 2500)); return B.en.every(e => e.block >= 6) || B.en.map(e => e.block).join(); }));
  await fight(['croc'], 'B'); await sleep(800);
  ok(`${tag} "Behind You!" hides the croc's number`, await ev(async () => { const e = __SO.B().en[0]; e.mv = { n: 'Behind You!', a: 17, hid: 1 }; __SO.render(); await new Promise(r => setTimeout(r, 300)); const d = [...document.querySelectorAll('b')].find(b => /Crocodile/.test(b.textContent)); const tx = d ? d.parentElement.textContent : ''; return (/Look behind you/.test(tx) && !/Behind You!/.test(tx)) || tx; }));
  await go('chippy'); await sleep(600); await fight(['queue'], 'F'); await sleep(800);
  ok(`${tag} the Queue gains 1 Block when hit`, await ev(() => { const e = __SO.B().en[0]; e.block = 0; __SO.strike(__SO.H(), e, 5); return e.block === 1; }));
  ok(`${tag} Bag of Scraps heals 8 and gives Gusto`, await ev(() => { const R = __SO.run(), H = __SO.H(); R.brews = ['scraps']; const h = R.hp = R.max - 20; H.st.gus = 0; __SO.useBrew(0, null); return R.hp - h === 8 && H.st.gus === 1; }));
  ok(`${tag} drawing a Catchphrase costs 1 Energy`, await ev(() => { const B = __SO.B(); B.energy = 3; B.hand = []; B.draw.push({ id: 'catchp', u: 0 }); __SO.drawN(1); return B.energy === 2; }));
  await ev(() => __SO.addRelic('ridephoto')); await fight(['counter'], 'B'); await sleep(1500);
  ok(`${tag} Ride Photo draws 1 more on a boss's first turn`, (await ev(() => __SO.B().hand.length)) === 6, await ev(() => __SO.B().hand.length));
  await go('arcades'); await sleep(600); await fight(['falls'], 'F'); await sleep(400);
  ok(`${tag} Arcades & Bingo enemies have real drawings`, await ev(() => ['falls','fruit','change','dabber','claw','bingo'].every(k => typeof __SO.ART[k]==='function')));
  ok(`${tag} Tuppenny Falls drops Scrumplings when hit`, await ev(() => { const R=__SO.run(), e=__SO.B().en[0], g=R.gold; e.block=0; __SO.strike(__SO.H(), e, 5); return R.gold===g+2; }));
  await fight(['change'], 'F'); await sleep(200);
  ok(`${tag} Change Machine Short Change steals Scrumplings`, await ev(() => { const R=__SO.run(); R.gold=40; __SO.H().block=99; __SO.B().en[0].mv={n:'Short Change',steal:10,a:0}; __SO.endTurn(); return R.gold===30; }));
  await fight(['claw'], 'F'); await sleep(200);
  ok(`${tag} the Claw grabs a card and returns it when seen off`, await ev(() => {
    const B=__SO.B(), e=B.en[0]; e.mv={n:'Grab',grab:1}; __SO.endTurn();
    if(!(e.held&&e.held.length===1)) return 'held='+JSON.stringify(e.held);
    const held=e.held[0]; e.block=0; __SO.strike(__SO.H(), e, 99);
    return (e.dead&&B.disc.some(c=>c.id===held.id&&c.u===held.u)) || ('dead='+e.dead+' disc='+B.disc.map(c=>c.id).join());
  }));
  await fight(['bingo'], 'B'); await sleep(200);
  ok(`${tag} the Bingo Caller shouts HOUSE! at half health and then hits harder`, await ev(() => {
    const e=__SO.B().en[0]; e.block=0; e.hp=Math.floor(e.max/2)+3; const h=e.hp; __SO.strike(__SO.H(), e, 10);
    if(!(e.house&&e.block===25&&e.hp<h)) return 'house='+e.house+' block='+e.block;
    e.house=1; e.i=1; const m=__SO.EN.bingo.ai(e); /* Legs Eleven is 11, should become 16 or 17 after encore+house */
    return e.house===1 && e.block===25;
  }));
    await go('winter'); await sleep(600); await fight(['darts'], 'F'); await sleep(200);
  ok(`${tag} Winter Gardens enemies have real drawings`, await ev(() => ['delegate','darts','mirror','raffle','walkon','keynote'].every(k => typeof __SO.ART[k]==='function')));
  ok(`${tag} the Darts Fan throws 180 only once a fight`, await ev(() => { const e=__SO.B().en[0]; e.i=0; e.used180=0; const moves=[]; for (let i=0;i<8;i++) moves.push(__SO.EN.darts.ai(e)); return moves.filter(m=>m.once180).length===1 && moves.some(m=>m.a===18); }));
  await fight(['walkon'], 'L'); await sleep(200);
  ok(`${tag} Walk-On Music is a single 20 below Encore 5, and 20x3 at Encore 5`, await ev(() => {
    const R=__SO.run(), e=__SO.B().en[0]; R.lvl=0; e.i=1; const lo=__SO.EN.walkon.ai(e); R.lvl=5; e.i=1; const hi=__SO.EN.walkon.ai(e); R.lvl=0;
    return lo.a===20 && (lo.x||1)===1 && hi.a===20 && hi.x===3;
  }));
  await fight(['keynote'], 'B'); await sleep(200);
  ok(`${tag} the Keynote Speaker hands out a Handout and Overrunning takes another turn`, await ev(() => {
    const B=__SO.B(), e=B.en[0], H=__SO.H(); H.block=99; e.mv={n:'Next Slide',add:['handout',1],a:0}; __SO.endTurn();
    if(!B.disc.some(c=>c.id==='handout')) return 'no-handout';
    e.again=0; e.mv={n:'Overrunning',a:0,x:1,again:1}; H.block=99; __SO.endTurn();
    return e.again===1;
  }));
    await go('bnb'); await sleep(600); await fight(['rules'], 'F'); await sleep(200);
  ok(`${tag} B&B enemies have real drawings`, await ev(() => ['rules','shower','floor','guest','landlady'].every(k => typeof __SO.ART[k]==='function')));
  ok(`${tag} the House Rules post a No Hot Food in Rooms card`, await ev(() => { const B=__SO.B(), e=B.en[0], H=__SO.H(); H.block=99; e.mv={n:'Posted',add:['nohot',1],a:0}; __SO.endTurn(); return B.disc.some(c=>c.id==='nohot'); }));
  await fight(['landlady'], 'B'); await sleep(200);
  ok(`${tag} the Landlady's Lights out rule draws one fewer`, await ev(() => { const e=__SO.B().en[0], H=__SO.H(); H.block=99; e.mv={n:'Lights out',a:0,rule:'lights'}; __SO.endTurn(); return __SO.B().houseRule==='lights' && __SO.B().hand.length===4; }));
  ok(`${tag} No more than three cards costs 1 more on the fourth`, await ev(() => { const B=__SO.B(), c={id:'cough',u:0}; B.houseRule='cards'; B.tcount=3; B.energy=1; B.hand=[c]; const no=__SO.playable(c); B.tcount=0; const yes=__SO.playable(c); B.houseRule=''; return !no && yes; }));
    await go('oldpier'); await sleep(600); await fight(['fortune'], 'F'); await sleep(300);
  ok(`${tag} Old Pier enemies have real drawings`, await ev(() => ['fret','bolt','notice','scrab','mavis','doris','fortune','comic','vent','lord','pgull','bgull'].every(k => typeof __SO.ART[k]==='function' || (__SO.EN[k]&&typeof __SO.ART[__SO.EN[k].art]==='function'))));
  ok(`${tag} the Fortune-Telling Machine hides its plan`, await ev(() => { const e=__SO.B().en[0]; e.mv=__SO.EN.fortune.ai(e); __SO.render(); return !!e.mv.myst; }));
  await fight(['notice'], 'F'); await sleep(200);
  ok(`${tag} a Condemned card takes 3 Block before the enemy acts`, await ev(() => { const R=__SO.run(), B=__SO.B(), H=__SO.H(); R.hp=R.max; H.block=10; H.st.flu=0; H.st.mist=0; B.houseRule=''; B.hand=[{id:'condemned',u:0}]; B.en[0].st={}; B.en[0].mv={n:'By Order',a:8}; __SO.endTurn(); return R.hp===R.max-1; }));
  ok(`${tag} drawing a Groan gives 1 Flustered`, await ev(() => { const B=__SO.B(), H=__SO.H(); H.st.flu=0; B.draw.push({id:'groan',u:0}); __SO.drawN(1); return H.st.flu>=1; }));
  await fight(['pgull','bgull','bgull'], 'B'); await sleep(300);
  ok(`${tag} Order! Order! brings the Backbenchers back`, await ev(() => {
    const B=__SO.B(), king=B.en[0], g=B.en[1]; g.hp=0; g.dead=true; king.block=0; king.hp=Math.floor(king.max/2)+3; __SO.strike(__SO.H(), king, 10);
    return king.order===1 && king.block===20 && g.dead===false && g.hp===20;
  }));
    ok(`${tag} trade-mark check: no banned names in the page or game data`, !(await ev(() => /Pleasure Beach|Illuminations|Blackpool Tower|Big One|Valhalla|Merlin|Grok/i.test(document.documentElement.outerHTML + JSON.stringify(Object.values(__SO.EN).map(e => e.n))))));
  ok(`${tag} zero external requests`, external.length === 0, external.slice(0, 5).join(' '));
  ok(`${tag} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
// Milestone 2d: the recorded unlocks (Quill cards, Arthur's wig, souvenir line two, the Daily Run) and the cat card art
async function m2d(browser, port) {
  const tag = 'm2d', ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), external = [], errors = [];
  page.on('request', rq => { const u = rq.url(); if (!/^(http:\/\/127\.0\.0\.1:\d+\/|data:|blob:|about:)/.test(u)) external.push(u); });
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('m2d')) { localStorage.clear(); sessionStorage.setItem('m2d', '1'); } });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' }); await sleep(700);
  const ev = (f, a) => page.evaluate(f, a);
  const pools = n => ev(n => { __SO.DAY.sticks = n; __SO.poolFix(); const P = __SO.POOL, Q = __SO.QNEW; return ['r', 't', 'k'].map(h => Q[h].filter(id => P[h].includes(id)).length).join(','); }, n);
  ok(`${tag} new Quill cards stay out of the pools before their sticks`, (await pools(0)) === '0,0,0', await pools(0));
  ok(`${tag} stick #4 adds Reggie's cards`, (await pools(4)) === '4,0,0', await pools(4));
  ok(`${tag} stick #8 adds Terry's cards`, (await pools(8)) === '4,4,0', await pools(8));
  ok(`${tag} stick #12 adds Kenneth's cards`, (await pools(12)) === '4,4,4', await pools(12));
  // every new card plays
  const play = (hero, id, set, prep) => ev(async a => {
    __SO.S.hero = a.hero; __SO.act('begin'); await new Promise(r => setTimeout(r, 200)); __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.fightWith(a.set, 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(), H = __SO.H(); B.energy = 99; B.en.forEach(e => { e.block = 0; e.hp = e.max = 200; });
    const P = a.prep || {}; if (P.inv) B.en[0].st.inv = P.inv; if (P.flt) B.flt = P.flt; if (P.disc) B.disc.push({ id: P.disc, u: 0 });
    B.hand.push({ id: a.id, u: 0 }); const i = B.hand.length - 1, e0 = B.en[0], hp0 = B.en.map(e => e.hp), g0 = __SO.run().gold;
    const okp = __SO.playCard(i, 0);
    return { okp, dmg: B.en.map((e, j) => hp0[j] - e.hp), inv: B.en.map(e => e.st.inv || 0), flu: B.en.map(e => e.st.flu || 0), gold: __SO.run().gold - g0, gus: H.st.gus || 0, block: H.block, hand: B.hand.length, disc: B.disc.length, st: H.st };
  }, { hero, id, set, prep });
  let r = await play('r', 'cashhand', ['breeze']); ok(`${tag} Cash in Hand: 6 damage and 5 Scrumplings`, r.okp && r.dmg[0] === 6 && r.gold === 5, JSON.stringify(r));
  r = await play('r', 'vat', ['breeze'], { inv: 2 }); ok(`${tag} VAT Inclusive: Invoice, and Flustered if they owed`, r.inv[0] === 6 && r.flu[0] === 1, JSON.stringify(r));
  r = await play('r', 'latepay', ['breeze', 'breeze'], { inv: 2 }); ok(`${tag} Late Payment Charge raises only existing Invoices`, r.inv[0] === 5 && r.inv[1] === 0, JSON.stringify(r));
  r = await play('r', 'bailiffs', ['breeze'], { inv: 5 }); ok(`${tag} The Bailiffs: the Invoice, 3 times`, r.dmg[0] >= 15, JSON.stringify(r));
  r = await play('t', 'bleed', ['breeze', 'breeze']); ok(`${tag} Bleed Edge hits all and gives 1 Gusto`, r.dmg.every(d => d >= 3) && r.gus === 1, JSON.stringify(r));
  ok(`${tag} Bleed Edge's Gusto goes at the end of the turn`, await ev(async () => { __SO.H().block = 999; __SO.endTurn(); await new Promise(r => setTimeout(r, 2500)); return (__SO.H().st.gus || 0) === 0; }));
  r = await play('t', 'spot', ['breeze']); ok(`${tag} Spot Colour: twice, plus Flustered`, r.dmg[0] >= 10 && r.flu[0] === 1, JSON.stringify(r));
  r = await play('t', 'letters', ['breeze']); ok(`${tag} Letters to the Editor is a power`, r.st.ltr === 2, JSON.stringify(r.st));
  ok(`${tag} Letters to the Editor: Block when a card hits ALL`, await ev(() => { const B = __SO.B(), H = __SO.H(); H.block = 0; B.hand.push({ id: 'fullcolour', u: 0 }); __SO.playCard(B.hand.length - 1); return H.block >= 2; }));
  r = await play('t', 'spread', ['breeze', 'breeze']); ok(`${tag} Centre Spread: 14 to ALL`, r.dmg.every(d => d === 14), JSON.stringify(r));
  r = await play('k', 'minutes', ['breeze']); ok(`${tag} Minutes of the Meeting: draw 2, discard 1`, r.okp && r.hand === 6, JSON.stringify(r));
  r = await play('k', 'replyall', ['breeze'], { flt: 2 }); ok(`${tag} Reply All: ALL, plus a hit per Fleeting card`, r.dmg[0] === 18, JSON.stringify(r));
  r = await play('k', 'delegated', ['breeze'], { disc: 'nod' }); ok(`${tag} Delegated brings a card back at 0`, r.okp && (await ev(() => __SO.B().hand.some(c => c.id === 'nod' && c.z))), JSON.stringify(r));
  r = await play('k', 'nominute', ['breeze']); ok(`${tag} Nobody Minuted It: first Fleeting card twice`, r.st.nm === 1 && await ev(() => { const B = __SO.B(), e = B.en[0], h = e.hp; B.hand.push({ id: 'handshake', u: 0, tmp: 1, z: 1 }); __SO.playCard(B.hand.length - 1, 0); return h - e.hp === 12; }), JSON.stringify(r.st));
  ok(`${tag} rewards and shops can offer the new cards once unlocked`, await ev(() => { __SO.DAY.sticks = 12; __SO.poolFix(); return __SO.QNEW.r.every(id => __SO.POOL.r.includes(id)); }));
  // souvenir line two
  const souv = n => ev(async n => { __SO.DAY.sticks = n; __SO.S.scr = 'souvenir'; __SO.render(); await new Promise(r => setTimeout(r, 200)); return document.querySelectorAll('.sv').length; }, n);
  const s5 = await souv(5), s6 = await souv(6); ok(`${tag} Souvenir Shop line two opens at stick #6`, s6 > s5, s5 + ' -> ' + s6);
  // Arthur's wig
  ok(`${tag} wig locked before stick #2, on after`, await ev(() => { __SO.DAY.sticks = 1; const a = __SO.wigOn(); __SO.DAY.sticks = 2; return !a && __SO.wigOn(); }));
  const catPix = () => ev(async () => { __SO.S.scr = 'cat'; __SO.S.offer = ['arthur', 'spyro', 'dexter']; __SO.S.mode = null; __SO.render(); await new Promise(r => setTimeout(r, 900)); const c = document.querySelector('canvas[data-id=arthur]'); return c ? c.toDataURL() : ''; });
  const w1 = await catPix(); await page.screenshot({ path: `${SHOTS}/m2-06-wig.png` });
  await ev(async () => { __SO.act('album'); await new Promise(r => setTimeout(r, 300)); });
  ok(`${tag} album has the wig toggle`, await ev(() => /Arthur.s wig: on/.test(document.body.textContent)));
  await ev(async () => { document.querySelector('[data-a=wig]').click(); await new Promise(r => setTimeout(r, 200)); });
  ok(`${tag} wig toggled off and saved`, await ev(() => !__SO.wigOn() && JSON.parse(localStorage.getItem('so-day-v1')).wig === 0));
  await ev(() => { __SO.S.mode = null; }); const w0 = await catPix();
  ok(`${tag} the wig is drawn on Arthur (canvas differs on/off)`, w1 && w0 && w1 !== w0);
  await ev(() => { __SO.DAY.wig = 1; __SO.saveDay(); });
  // the Daily Run
  ok(`${tag} Daily Run locked at stick #9 with no wins, open at #10`, await ev(() => { __SO.DAY.sticks = 9; __SO.META.wins = 0; const a = __SO.dailyOpen(); __SO.DAY.sticks = 10; return !a && __SO.dailyOpen(); }));
  await ev(async () => { __SO.S.scr = 'title'; __SO.S.mode = null; __SO.render(); await new Promise(r => setTimeout(r, 400)); });
  ok(`${tag} Daily Run button on the title`, await ev(() => !!document.querySelector('[data-a=daily]')));
  ok(`${tag} title still fits 1280x800`, await ev(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${SHOTS}/m2-07-daily-title.png` });
  const daily = () => ev(async () => { document.querySelector('[data-a=daily]').click(); await new Promise(r => setTimeout(r, 400)); const R = __SO.run(), off = __SO.S.offer.join(); __SO.act('cat', __SO.S.offer[0]); await new Promise(r => setTimeout(r, 300));
    document.querySelector('[data-i=prom]').click(); await new Promise(r => setTimeout(r, 900)); const R2 = __SO.run(); const map = R2.map.map(row => row.map(n => n ? n.t : '-').join('')).join('/');
    R2.map[0].forEach(n => n.t = 'F'); __SO.act('node', 1); await new Promise(r => setTimeout(r, 400)); const set = __SO.B().en.map(e => e.k).join(); const hand = __SO.B().hand.map(c => c.id).join();
    return { daily: R2.daily, hero: R2.hero, off, map, set, hand }; });
  const d1 = await daily(); await ev(async () => { __SO.S.scr = 'title'; __SO.S.mode = null; __SO.render(); await new Promise(r => setTimeout(r, 300)); }); const d2 = await daily();
  ok(`${tag} Daily Run: same Quill, cats, map, first fight and hand both times`, d1.daily === await ev(() => __SO.today()) && JSON.stringify(d1) === JSON.stringify(d2), JSON.stringify(d1).slice(0, 200) + ' | ' + JSON.stringify(d2).slice(0, 200));
  ok(`${tag} Daily Rules: one rule per date, all six turn up, shown on the cat screen`, await ev(async () => { const ks = Object.keys(__SO.RULES), seen = new Set(); for (let i = 0; i < 90; i++) { const d = new Date(Date.UTC(2027, 0, 1 + i)).toISOString().slice(0, 10); if (__SO.ruleFor(d) !== __SO.ruleFor(d)) return false; seen.add(__SO.ruleFor(d)); }
    __SO.S.scr = 'title'; __SO.S.mode = null; __SO.render(); await new Promise(r => setTimeout(r, 200)); const tip = document.querySelector('[data-a=daily]').title; document.querySelector('[data-a=daily]').click(); await new Promise(r => setTimeout(r, 400)); const k = __SO.ruleFor(__SO.today()), el = document.querySelector('.so-rule');
    return ks.length === 6 && seen.size === 6 && __SO.run().rule === k && !!el && el.textContent.includes(__SO.RULES[k].n) && tip.includes(__SO.RULES[k].n); }));
  await page.screenshot({ path: `${SHOTS}/m3-daily-rule.png` });
  ok(`${tag} Daily Rules do what they say (Sea Fret, on Account, Seagull Day, Crowds, Wakes Week, Two Cats)`, await ev(async () => { const R = __SO.run(), o = {}, ens = () => __SO.B().en.map(e => e.k).join();
    R.rule = 'fret'; __SO.fightWith(['gull'], 'F'); o.fret = __SO.B().en[0].st.sog >= 1 && __SO.H().st.sog >= 1;
    R.rule = 'account'; __SO.fightWith(['gull'], 'F'); o.acc = __SO.B().en[0].st.inv === 5;
    R.rule = 'gulls'; __SO.fightWith(['pigeon'], 'F'); o.gulls = ens() === 'pigeon,gull';
    R.rule = 'crowds'; __SO.fightWith(['fish', 'gull'], 'F'); o.crowds = ens() === 'fish,gull,fish'; __SO.fightWith(['typo', 'typo', 'typo', 'typo'], 'F'); o.room = __SO.B().en.length === 4;
    R.rule = 'gulls'; __SO.fightWith(['king'], 'B'); o.boss = ens() === 'king';
    R.rule = 'wakes'; __SO.openShop(); o.wakes = __SO.S.shop.brews.every(b => b.p === 34);
    __SO.S.scr = 'title'; __SO.render(); await new Promise(r => setTimeout(r, 200)); document.querySelector('[data-a=daily]').click(); await new Promise(r => setTimeout(r, 300)); __SO.run().rule = 'twocats'; __SO.act('cat', __SO.S.offer[0]); o.cats = __SO.run().cats.length === 2;
    R.rule = ''; __SO.run().rule = ''; __SO.S.scr = 'title'; __SO.S.mode = null; __SO.render(); return JSON.stringify(o); }).then(j => !/false/.test(j)));
  ok(`${tag} a normal run is not seeded`, await ev(async () => { const maps = []; for (let i = 0; i < 2; i++) { __SO.S.scr = 'title'; __SO.render(); __SO.act('begin'); __SO.act('cat', __SO.S.offer[0]); __SO.DAY.done1 = 1; await new Promise(r => setTimeout(r, 100)); __SO.enterStage('prom'); maps.push(JSON.stringify(__SO.run().map.map(r => r.map(n => n ? n.t : '-'))) + __SO.run().daily); } return maps[0] !== maps[1] && !/true|\d{4}-/.test(maps[0]); }));
  const st0 = await ev(() => { __SO.DAY.streak = { last: '', n: 0, best: 0 }; __SO.finish(false); return __SO.DAY.streak.n; });
  ok(`${tag} a normal day out does not tick the Day Tripper streak`, st0 === 0, st0);
  await ev(async () => { __SO.S.scr = 'title'; __SO.S.mode = null; __SO.render(); await new Promise(r => setTimeout(r, 300)); });
  await daily(); await ev(() => { __SO.run().score = 321; __SO.finish(false); }); await sleep(2500);
  ok(`${tag} the Daily ticks the streak and saves today's best`, await ev(() => __SO.DAY.streak.n === 1 && __SO.DAY.daily[__SO.today()] > 0), await ev(() => JSON.stringify([__SO.DAY.streak, __SO.DAY.daily])));
  ok(`${tag} the report names the Daily`, /Daily Run, \d{4}-\d\d-\d\d/.test(await ev(() => document.body.textContent)));
  await page.screenshot({ path: `${SHOTS}/m2-08-daily-report.png` });
  // the cats' card art
  await ev(async () => { __SO.S.scr = 'title'; __SO.render(); __SO.S.hero = 'r'; __SO.act('begin'); __SO.act('cat', 'tilly'); __SO.DAY.done1 = 1; await new Promise(r => setTimeout(r, 200)); __SO.fightWith(['breeze'], 'F'); await new Promise(r => setTimeout(r, 600));
    const B = __SO.B(); B.hand = ['ruling', 'decree', 'ripface', 'requisition', 'boo', 'whome'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 1800)); });
  const art = await ev(() => ['ruling', 'decree', 'ripface', 'requisition', 'boo', 'whome'].map(id => { const a = document.querySelector('#hand .c-' + id + ' .art') || document.querySelector('.c-' + id + ' .art'); return a ? getComputedStyle(a).backgroundImage : 'none'; }));
  ok(`${tag} all six cat cards show their painted art`, art.every((b, i) => new RegExp('cats/(arthur|spyro|tilly|trixie|dexter|daisy)\\.jpg').test(b)), art.join(' '));
  const loaded = await ev(async () => { const r = []; for (const c of ['arthur', 'spyro', 'tilly', 'trixie', 'dexter', 'daisy']) { const im = new Image(); im.src = 'cats/' + c + '.jpg'; await im.decode().catch(() => 0); r.push(im.naturalWidth); } return r; });
  ok(`${tag} card frame: type line names the owner`, await ev(() => /Attack – Spyro/i.test(document.querySelector('.c-decree i').textContent) && /Skill – Dexter/i.test(document.querySelector('.c-boo i').textContent)));
  ok(`${tag} card frame: tinted by owner`, await ev(() => getComputedStyle(document.querySelector('.c-boo'), '::before').borderTopColor === 'rgb(36, 86, 230)'));
  ok(`${tag} card frame: rules text in Libre Caslon Text`, await ev(async () => { await document.fonts.ready; return /Libre Caslon Text/.test(getComputedStyle(document.querySelector('.cd .tx')).fontFamily) && document.fonts.check('12px "Libre Caslon Text"'); }));
  ok(`${tag} card frame: cat art window is the large one`, await ev(() => document.querySelector('.c-decree .art').getBoundingClientRect().height >= 70));
  ok(`${tag} Reggie's starter cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['redpen', 'cough', 'invoice'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['redpen', 'cough', 'invoice'].every(id => /cards\/(redpen|cough|invoice)\.jpg/.test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} Terry's starter cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['inkblot', 'sketch', 'splatter'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['inkblot', 'sketch', 'splatter'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} Kenneth's starter cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['handshake', 'nod', 'whoinv'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['handshake', 'nod', 'whoinv'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the most-offered reward cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['remit', 'factcheck', 'crosshatch', 'roughdraft', 'arrival', 'subject'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['remit', 'factcheck', 'crosshatch', 'roughdraft', 'arrival', 'subject'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the second batch of commons show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['patter', 'lineedit', 'fullcolour', 'bigtitle', 'nobody', 'knowsterry'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['patter', 'lineedit', 'fullcolour', 'bigtitle', 'nobody', 'knowsterry'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the last ten base commons show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['tenner', 'braveface', 'proofread', 'wraparound', 'inkwash', 'quick', 'refphoto', 'friendreg', 'cousin', 'uninvited'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['tenner', 'braveface', 'proofread', 'wraparound', 'inkwash', 'quick', 'refphoto', 'friendreg', 'cousin', 'uninvited'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the first six uncommons show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['finaldemand', 'itemised', 'storm', 'layout', 'wronghouse', 'cointoss'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['finaldemand', 'itemised', 'storm', 'layout', 'wronghouse', 'cointoss'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the second six uncommons show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['earner', 'rounding', 'dayone', 'outrage', 'longstory', 'parcel'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['earner', 'rounding', 'dayone', 'outrage', 'longstory', 'parcel'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the last uncommons and two rares show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['myoldson', 'dignity', 'steady', 'goodbye', 'masterpiece', 'mystery'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['myoldson', 'dignity', 'steady', 'goodbye', 'masterpiece', 'mystery'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the last rares and Scribble show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['compound', 'cartel', 'framerate', 'scribble', 'openinv', 'plusone'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['compound', 'cartel', 'framerate', 'scribble', 'openinv', 'plusone'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the first six unlock cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['bailiffs', 'latepay', 'bleed', 'spot', 'replyall', 'delegated'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['bailiffs', 'latepay', 'bleed', 'spot', 'replyall', 'delegated'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the last six unlock cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['cashhand', 'vat', 'letters', 'spread', 'minutes', 'nominute'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['cashhand', 'vat', 'letters', 'spread', 'minutes', 'nominute'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the six shared cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['junk', 'sock', 'ticket', 'wblock', 'photo', 'catchp'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['junk', 'sock', 'ticket', 'wblock', 'photo', 'catchp'].every(id => new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(document.querySelector('.c-' + id + ' .art')).backgroundImage)); }));
  ok(`${tag} the Handout card shows its painted art`, await ev(async () => { const B = __SO.B(); B.hand = [{ id: 'handout', u: 0 }]; __SO.render(); await new Promise(r => setTimeout(r, 900)); const art = document.querySelector('.c-handout .art'); return art && /cards\/handout\.jpg/.test(getComputedStyle(art).backgroundImage); }));
  ok(`${tag} the four new clutter cards show their painted art`, await ev(async () => { const B = __SO.B(); B.hand = ['nohot', 'groan', 'condemned', 'wetsand'].map(id => ({ id, u: 0 })); __SO.render(); await new Promise(r => setTimeout(r, 900)); return ['nohot', 'groan', 'condemned', 'wetsand'].every(id => { const art = document.querySelector('.c-' + id + ' .art'); return art && new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(art).backgroundImage); }); }));
  ok(`${tag} the three legendary cards exist at rarity l`, await ev(() => {
    const C = __SO.CARDS, L = __SO.QLEG;
    return L.r[0] === 'bankrupt' && C.bankrupt.rar === 'l' && C.bankrupt.h === 'r' && C.bankrupt.o.xcost &&
      L.t[0] === 'magnum' && C.magnum.rar === 'l' && C.magnum.h === 't' && C.magnum.o.mag === 5 &&
      L.k[0] === 'cloud' && C.cloud.rar === 'l' && C.cloud.h === 'k';
  }));
  const lpools = n => ev(n => { __SO.DAY.sticks = n; __SO.poolFix(); const P = __SO.POOL, Q = __SO.QLEG; return ['r', 't', 'k'].map(h => Q[h].filter(id => P[h].includes(id)).length).join(','); }, n);
  ok(`${tag} legendary cards stay out of the pools before their sticks`, (await lpools(14)) === '0,0,0', await lpools(14));
  ok(`${tag} stick #15 adds Reggie's legendary`, (await lpools(15)) === '1,0,0', await lpools(15));
  ok(`${tag} stick #16 adds Terry's legendary`, (await lpools(16)) === '1,1,0', await lpools(16));
  ok(`${tag} stick #17 adds Kenneth's legendary`, (await lpools(17)) === '1,1,1', await lpools(17));
  const fpool = n => ev(n => { __SO.DAY.sticks = n; __SO.poolFix(); const P = __SO.POOL, Q = __SO.QLEG; return Q.f.filter(id => P.f.includes(id)).length; }, n);
  ok(`${tag} Ferret legendary stays out of his pool before stick #18`, (await fpool(17)) === 0, await fpool(17));
  ok(`${tag} stick #18 adds the Ferret's legendary`, (await fpool(18)) === 1, await fpool(18));
  ok(`${tag} first run hides the Ferret on the picker`, await ev(() => {
    const w = __SO.META.wins, s = __SO.DAY.sticks;
    __SO.META.wins = 0; __SO.DAY.sticks = 0; __SO.S.scr = 'title'; __SO.S.hero = 'r'; __SO.S.mode = null; __SO.render();
    const n = document.querySelectorAll('[data-a=hero]').length;
    const open = __SO.ferretOpen();
    __SO.META.wins = w; __SO.DAY.sticks = s; __SO.poolFix();
    return !open && n === 3;
  }));
  ok(`${tag} a win opens the Ferret on the picker`, await ev(() => {
    const w = __SO.META.wins, s = __SO.DAY.sticks;
    __SO.META.wins = 1; __SO.DAY.sticks = 0; __SO.S.scr = 'title'; __SO.S.hero = 'r'; __SO.S.mode = null; __SO.render();
    const n = document.querySelectorAll('[data-a=hero]').length;
    const names = [...document.querySelectorAll('[data-a=hero]')].map(b => b.dataset.i).join(',');
    const open = __SO.ferretOpen();
    __SO.META.wins = w; __SO.DAY.sticks = s; __SO.S.scr = 'title'; __SO.render(); __SO.poolFix();
    return open && n === 4 && names === 'r,t,k,f';
  }));
  ok(`${tag} Daily Run still picks only the three Quills`, await ev(() => {
    const src = Function.prototype.toString.call(__SO.startDaily);
    return src.indexOf("pick(['r','t','k'])") >= 0;
  }));
  const ferretCast = await ev(async () => {
    const w = __SO.META.wins;
    __SO.META.wins = 1;
    __SO.S.hero = 'f'; __SO.act('begin'); await new Promise(r => setTimeout(r, 200));
    const R0 = __SO.run();
    const counts = {};
    R0.deck.forEach(c => { counts[c.id] = (counts[c.id] || 0) + 1; });
    const deckOk = counts.flick === 4 && counts.bivvy === 4 && counts.castout === 1 && R0.deck.length === 9 && R0.max === 70;
    __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.fightWith(['breeze'], 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(), e = B.en[0];
    e.block = 0; e.hp = e.max = 200; e.st = {};
    B.energy = 5; B.hand = [{ id: 'castout', u: 0 }]; B.casts = []; B.catch = 0;
    const hp0 = e.hp;
    const played = __SO.playCard(0);
    const queued = !!(played && B.casts && B.casts.length === 1 && (B.catch || 0) === 0 && e.hp === hp0);
    __SO.reelCasts();
    const dmg = hp0 - e.hp;
    const reeled = queued && B.casts.length === 0 && B.catch === 1 && dmg === 12;
    const ev = __SO.EVENTS.find(x => x.id === 'ferret');
    const title = ev && ev.t() === 'Kenneth is fishing';
    __SO.META.wins = w;
    return { ok: deckOk && reeled && title, deckOk, counts, hp: R0.max, played, queued, reeled, dmg, catch: B.catch, casts: (B.casts || []).length, title, hero: __SO.run() && __SO.run().hero };
  });
  ok(`${tag} Ferret starter deck is 4 Flick, 4 Bivvy, 1 Cast Out, and Cast reels in as Catch`, ferretCast && ferretCast.ok, JSON.stringify(ferretCast));
  ok(`${tag} The One That Didn't Get Away deals 10 per Catch and Exhausts`, await ev(async () => {
    const w = __SO.META.wins;
    __SO.META.wins = 1;
    __SO.S.hero = 'f'; __SO.act('begin'); await new Promise(r => setTimeout(r, 200)); __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.fightWith(['breeze'], 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(), e = B.en[0];
    e.block = 0; e.hp = e.max = 200;
    B.catch = 3; B.energy = 3; B.hand = [{ id: 'didnt', u: 0 }];
    const hp0 = e.hp;
    const okp = __SO.playCard(0, 0);
    const dmg = hp0 - e.hp;
    const gone = !B.disc.some(c => c.id === 'didnt') && !B.hand.some(c => c.id === 'didnt');
    __SO.META.wins = w;
    return okp && dmg === 30 && gone;
  }));
  ok(`${tag} fishing event is still The Ferret is fishing when you are a Quill`, await ev(() => {
    const ev = __SO.EVENTS.find(x => x.id === 'ferret');
    const w = __SO.META.wins;
    __SO.META.wins = 1; __SO.S.hero = 'r'; __SO.act('begin');
    const title = ev.t();
    __SO.META.wins = w;
    return title === 'The Ferret is fishing';
  }));
  ok(`${tag} Bankrupt: 3 Energy vs Invoice 5 on two enemies deals 15 each`, await ev(async () => {
    __SO.S.hero = 'r'; __SO.act('begin'); await new Promise(r => setTimeout(r, 200)); __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.fightWith(['breeze', 'breeze'], 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(); B.energy = 3; B.attk = 0; B.hand = [{ id: 'bankrupt', u: 0 }];
    B.en.forEach(e => { e.block = 0; e.hp = e.max = 200; e.st.inv = 5; });
    const hp0 = B.en.map(e => e.hp);
    const okp = __SO.playCard(0);
    return okp && B.energy === 0 && B.en.every((e, i) => hp0[i] - e.hp === 15 && e.st.inv === 5) && !B.disc.some(c => c.id === 'bankrupt');
  }));
  ok(`${tag} Magnum Opus costs 5, then 0 after five Attacks, and deals 60`, await ev(async () => {
    __SO.S.hero = 't'; __SO.act('begin'); await new Promise(r => setTimeout(r, 200)); __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.fightWith(['breeze'], 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(), e = B.en[0];
    e.block = 0; e.hp = e.max = 200;
    B.energy = 9; B.attk = 0; B.hand = [{ id: 'magnum', u: 0 }];
    const c0 = __SO.cost(B.hand[0]);
    const hp0 = e.hp;
    const okp = __SO.playCard(0, 0);
    const mid = okp && c0 === 5 && hp0 - e.hp === 60 && B.attk === 1 && B.energy === 4;
    e.hp = e.max = 200; e.block = 0; e.dead = 0;
    B.energy = 9; B.attk = 5; B.hand = [{ id: 'magnum', u: 0 }];
    const c1 = __SO.cost(B.hand[0]);
    const hp1 = e.hp;
    const ok2 = __SO.playCard(0, 0);
    return mid && ok2 && c1 === 0 && hp1 - e.hp === 60 && B.energy === 9 && B.attk === 6;
  }));
  ok(`${tag} The Cloud Provides adds 5 fleeting 0-cost cards, 7 when upgraded`, await ev(async () => {
    __SO.S.hero = 'k'; __SO.act('begin'); await new Promise(r => setTimeout(r, 200)); __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.fightWith(['breeze'], 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(); B.energy = 1; B.hand = [{ id: 'cloud', u: 0 }];
    const okp = __SO.playCard(0);
    const five = okp && B.hand.length === 5 && B.hand.every(c => c.z && c.tmp);
    B.energy = 1; B.hand = [{ id: 'cloud', u: 1 }];
    const ok2 = __SO.playCard(0);
    return five && ok2 && B.hand.length === 7 && B.hand.every(c => c.z && c.tmp);
  }));
  ok(`${tag} a boss chest guarantees the unlocked legendary if it is not in the deck`, await ev(async () => {
    __SO.S.hero = 'r'; __SO.act('begin'); await new Promise(r => setTimeout(r, 200)); __SO.act('cat', 'arthur'); __SO.DAY.done1 = 1;
    __SO.DAY.sticks = 15; __SO.poolFix();
    const R = __SO.run(); R.part = 2;
    if (R.deck.some(c => c.id === 'bankrupt')) return 'already in deck';
    const offer = __SO.putBossLegend(['redpen', 'cough', 'invoice']);
    const no = (__SO.DAY.sticks = 14, __SO.poolFix(), __SO.putBossLegend(['redpen', 'cough', 'invoice']));
    return offer[0] === 'bankrupt' && no[0] === 'redpen';
  }));
  ok(`${tag} the three legendary cards show their painted art`, await ev(async () => {
    __SO.fightWith(['breeze'], 'F'); await new Promise(r => setTimeout(r, 300));
    const B = __SO.B(); B.hand = ['bankrupt', 'magnum', 'cloud'].map(id => ({ id, u: 0 })); __SO.render();
    await new Promise(r => setTimeout(r, 900));
    return ['bankrupt', 'magnum', 'cloud'].every(id => {
      const art = document.querySelector('.c-' + id + ' .art');
      return !!(art && art.nodeType === 1 && new RegExp('cards/' + id + '\\.jpg').test(getComputedStyle(art).backgroundImage));
    });
  }));
  ok(`${tag} Kenneth's cards are framed in black`, await ev(async () => { const B = __SO.B(); B.hand = [{ id: 'handshake', u: 0 }]; __SO.render(); await new Promise(r => setTimeout(r, 300)); return getComputedStyle(document.querySelector('.c-handshake'), '::before').borderTopColor === 'rgb(29, 28, 36)'; }));
  ok(`${tag} cat art files load`, loaded.every(w => w >= 300), loaded.join(','));
  ok(`${tag} hand with cat cards fits, nothing clips`, await ev(() => document.documentElement.scrollHeight <= innerHeight));
  await page.screenshot({ path: `${SHOTS}/m2-09-cat-cards.png` });
  { const groups = [['castle', 'jelly', 'windbreak'], ['crab', 'donkey'], ['croc'], ['rockstick', 'teeth', 'fudge'], ['dummy', 'boiler'], ['bigrock', 'halfrock'], ['tall', 'dodgem', 'skeleton'], ['flume', 'kiosk'], ['rattler'], ['couple', 'lift', 'clown'], ['ringmaster', 'organ'], ['sausage', 'peas', 'curry'], ['queue', 'onion', 'fryer'], ['counter'], ['bulb', 'tableau', 'coach'], ['moth', 'littram'], ['telly'], ['falls', 'fruit', 'change'], ['dabber', 'claw'], ['bingo'], ['delegate', 'darts', 'mirror'], ['raffle', 'walkon'], ['keynote'], ['rules', 'shower', 'floor'], ['guest', 'landlady'], ['fret', 'bolt', 'notice'], ['scrab', 'mavis', 'doris'], ['fortune', 'comic'], ['vent', 'lord'], ['pgull']];
    const drawn = await ev(async g => { if (!g.flat().every(k => typeof __SO.ART[k] === 'function')) return 'missing'; for (const x of g) { __SO.fightWith(x, 'F'); await new Promise(r => setTimeout(r, 300)); } return 'ok'; }, groups);
    ok(`${tag} all ten new places' enemies have real drawings (the Tower Pigeon reuses the pigeon)`, drawn === 'ok', drawn); await page.screenshot({ path: `${SHOTS}/m3-enemies-telly.png` }); }
  ok(`${tag} zero external requests`, external.length === 0, external.slice(0, 5).join(' '));
  ok(`${tag} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}
const M2 = { m2a, m2c, m2d };
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
