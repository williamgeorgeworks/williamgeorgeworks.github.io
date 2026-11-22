// Headless check of the offline bundle: layout at 1280x800 + 1920x1080, zero external
// requests, keyboard-only start of a run (Quill, cat, map, first fight), mock-gamepad nav.
// Usage: node tests/verify.js  (serves ./web on 127.0.0.1, writes ../shots/*.png)
const path = require('path'), http = require('http'), fs = require('fs');
const { chromium } = require('playwright-core');
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
  for (let i = 0; i < 4 && !(s.focus || '').startsWith('begin'); i++) { await key('ArrowDown'); s = await st(); }
  ok(`${tag} keyboard: reach Begin`, (s.focus || '').startsWith('begin'), s.focus);
  await key('Enter', 900);
  s = await st(); ok(`${tag} keyboard: cat screen`, s.scr === 'cat', s.scr);
  await key('ArrowRight');
  await page.screenshot({ path: `${SHOTS}/${tag}-03-cat-pick.png` });
  await key('Enter', 900);
  s = await st(); ok(`${tag} keyboard: cat chosen, on map`, s.scr === 'map' && s.cats.length === 1, JSON.stringify(s.cats));
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
    await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown'); await key('Enter', 400);
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
    const padTo = async (pre, btn = 13) => { for (let i = 0; i < 8 && !(await fk()).startsWith(pre); i++) await tap(btn); return (await fk()).startsWith(pre); };
    ok(`${tag} pad: reach Begin`, await padTo('begin')); await tap(0); await sleep(700);
    s = await st(); ok(`${tag} pad: cat screen`, s.scr === 'cat'); await tap(0); await sleep(2400);
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
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: EXE, headless: true });
  try { await run(browser, 1280, 800, '1280x800', port); await run(browser, 1920, 1080, '1920x1080', port); }
  catch (e) { console.error(e); results.push({ name: 'exception', pass: false, extra: String(e) }); }
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(SHOTS, 'verify-results.json'), JSON.stringify(results, null, 2));
  const f = results.filter(r => !r.pass).length; console.log(`\n${results.length - f}/${results.length} passed`); process.exit(f ? 1 : 0);
})();
