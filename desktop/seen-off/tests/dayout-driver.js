// In-page helpers for tests/verify.js: drive a day out quickly (fights are shortened by
// setting enemy health to 1, everything else goes through the game's own buttons).
module.exports = {
  // one step of autoplay; returns a short label of what it did
  step: (opt) => {
    const S = __SO.S, B = __SO.B(), q = s => document.querySelector(s), click = s => { const e = q(s); if (e && !e.disabled) { e.click(); return true; } return false; };
    if (!document.getElementById('soMenu').hidden) { document.querySelector('#soMenu [data-m="close"]') ? document.querySelector('#soMenu [data-m="close"]').click() : 0; }
    if (S.mode) { __SO.act('back'); return 'back'; }
    const ov = q('.arrive'); if (ov && ov.click) { ov.click(); }
    switch (S.scr) {
      case 'stage': { const want = opt && opt.pick && opt.pick[__SO.run().part]; if (want && click(`#view [data-a="place"][data-i="${want}"]`)) return 'place ' + want;
        return click('#view [data-a="place"]:not([disabled])') ? 'place' : 'stage?'; }
      case 'map': return click('#view .node.go') ? 'node' : 'map?';
      case 'combat': {
        if (!B || B.over) return 'wait';
        if (opt && opt.cheat) B.en.forEach(e => { if (!e.dead) { e.hp = Math.min(e.hp, 1); e.block = 0; } });
        if (S.sel >= 0) { const d = __SO.CARDS[B.hand[S.sel].id]; const t = B.en.findIndex(e => !e.dead); if (d.o && d.o.t) __SO.act('enemy', t); else click(`#hand .cd[data-i="${S.sel}"]`); return 'play'; }
        const i = B.hand.findIndex(c => __SO.playable(c));
        if (i < 0) { __SO.act('end'); return 'end'; }
        click(`#hand .cd[data-i="${i}"]`); return 'pick';
      }
      case 'reward': return click('#view [data-a="boss"]') || click('#view [data-a="take"]') || click('#view [data-a="leave"]') ? 'reward' : 'reward?';
      case 'report': case 'title': return 'stop';
      default: {
        /* an event option can refuse (e.g. "Pay it (40 Scrumplings)" when short): if the first option did nothing last time, take the last one */
        const os = document.querySelectorAll('#view [data-a="opt"]');
        if (os.length && S.scr === 'event' && S.ev && !S.ev.res && window.__drvEv === S.ev) { os[os.length - 1].click(); return 'event-last'; }
        if (os.length && S.scr === 'event') window.__drvEv = S.ev;
      }
      return click('#view [data-a="opt"]') || click('#view [data-a="rest"]') || click('#view [data-a="leave"]') || click('#view .btn.go') || click('#view [data-a]') ? S.scr : S.scr + '?';
    }
  },
  // no scrolling and nothing clipped inside the panel at this size
  fits: () => { const d = document.documentElement, v = document.getElementById('view'), p = v.querySelector('.panel');
    const r = { sw: d.scrollWidth, sh: d.scrollHeight, iw: innerWidth, ih: innerHeight, vs: v.scrollHeight - v.clientHeight, ps: 0 };
    if (p) { const pr = p.getBoundingClientRect(); [...p.children].forEach(c => { const cs = getComputedStyle(c); if (cs.position === 'absolute' || cs.display === 'none') return; const b = c.getBoundingClientRect(); r.ps = Math.max(r.ps, Math.round(b.bottom - pr.bottom), Math.round(pr.top - b.top), Math.round(b.right - pr.right)); }); }
    r.ok = r.sw <= r.iw && r.sh <= r.ih && r.vs <= 1 && r.ps <= 1; return r; }
};
