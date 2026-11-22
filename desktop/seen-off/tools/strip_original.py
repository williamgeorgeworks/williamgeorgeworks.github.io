#!/usr/bin/env python3
"""Re-create the stripped offline baseline of Seen Off (pre-fork).

Input : slay-the-pier.original.html  (pinned copy of slay-the-pier.html from
        williamgeorgeworks/williamgeorgeworks.github.io main @ 676b8e2)
Output: web/index.html  (plus the hand-written desktop.css, desktop.js,
        achievements.js and fonts/ that already live in web/)

Every edit is an exact string replacement that must match once, so if the
website version changes shape the build fails loudly instead of silently
shipping something half-stripped.  The website file itself is never touched.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent.parent
SRC = HERE / "slay-the-pier.original.html"
# Since milestone 1 (Day Out) web/index.html is a hand-maintained fork; this script now only
# re-creates the stripped baseline it was forked from, for diffing against the website version.
OUT = HERE / "tools" / "stripped-baseline.html"

html = SRC.read_text(encoding="utf-8")

def once(old, new, label):
    global html
    n = html.count(old)
    if n != 1:
        sys.exit(f"strip_original: expected 1 match for [{label}], found {n}")
    html = html.replace(old, new)

def regex_once(pat, new, label, flags=re.S):
    global html
    found = re.findall(pat, html, flags)
    if len(found) != 1:
        sys.exit(f"strip_original: expected 1 regex match for [{label}], found {len(found)}")
    html = re.sub(pat, lambda m: new, html, count=1, flags=flags)

CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; "
       "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "font-src 'self'; media-src 'self' data: blob:; "
       "connect-src 'self' ipc: http://ipc.localhost; object-src 'none'; base-uri 'none'; form-action 'none'")

# 1. head: drop social/canonical tags and Google Fonts, add CSP + local fonts + desktop styles
regex_once(r'<meta property="og:type".*?<meta name="twitter:card"[^>]*>\n', "", "og/twitter/canonical meta")
once('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Permanent+Marker&display=swap">',
     f'<meta http-equiv="Content-Security-Policy" content="{CSP}">\n'
     '<link rel="stylesheet" href="fonts/fonts.css">\n<link rel="icon" href="data:,">',
     "google fonts link")
once('<title>Seen Off: a card game of doubtful magic</title>', '<title>Seen Off</title>', "title")

# 1b. desktop styles must come after the game's own <style> so they win
once('</style>\n</head>', '</style>\n<link rel="stylesheet" href="desktop.css">\n</head>', "desktop.css after game style")

# 2. site chrome: arcade/merch top bar
regex_once(r'<div class="topbar">.*?</div>\n', "", "topbar")

# 3. masthead: the booth's own HUD already says "Seen Off"; every pixel of
#    height goes to the game. (The Menu button lives in the hint bar, see desktop.js.)
regex_once(r'  <header class="mast">.*?</header>\n', '', "masthead")

# 4. side panel stays in the DOM (the game writes to #catList, #rs*, #lb) but is
#    shown inside the menu's "How to play" page; drop the link to cats.html
once('<section class="side">', '<section class="side" id="dkSide">', "side id")
regex_once(r'\n\s*<p style="margin-top:10px"><a href="cats.html">.*?</a></p>', "", "cats.html link")

# 5. footer: becomes the Credits page; drop the website-only top-ten sentence
once('<p class="foot">', '<p class="foot" id="dkFoot">', "foot id")
once(' Until 22 November 2026 it was called Slay the Pier; your record and the top ten have come with it.', '', "top ten sentence")

# 6. the game script: never "on site" (Tauri on Linux serves from tauri://localhost,
#    which the site check would otherwise mistake for localhost dev)
once("var ON_SITE=/williamgeorgeworks|^localhost$/.test(location.hostname);",
     "var ON_SITE=false; /* desktop build: no score wall, no fetch, no send-in */", "ON_SITE")

# 6b. the score wall loader: remove the fetch of scores.json outright
regex_once(r"  try\{fetch\('scores\.json'.*?\}\)\.catch\(function\(\)\{\}\);\}catch\(e\)\{\}\n",
           "  /* desktop build: no score wall */\n", "loadWall fetch")

# 6c. the "Send in your score" link to the arcade score wall
regex_once(r"\(ON_SITE&&e\.pts>0\?'<div class=\"row\"[^\n]*?Send in your score</a></div>':''\)\+", "", "send score button")

# 7. expose a small, read-mostly handle for desktop.js (input layer + achievements)
once("if(window.__STP_TEST)window.__STP=",
     "window.__SO={S:S,act:act,render:render,run:function(){return RUN;},B:function(){return B;},H:function(){return H;},"
     "BOX:function(){return BOX;},cvPos:cvPos,beating:beating,trav:function(){return TRAV;},beat:function(){return BEAT;},"
     "META:META,CARDS:CARDS,alive:alive,playable:playable,A:A};\n"
     "if(window.__STP_TEST)window.__STP=", "hook")

# 8. 'before you go' strip and the site scripts (share, quickscore, badges, hits)
regex_once(r'<style>\.wgw-strip\{.*?</div></div>\n?', "", "wgw-strip")
regex_once(r'<script src="share\.js[^>]*></script>\n<script src="quickscore\.js[^>]*></script>\n'
           r'<script src="badges\.js[^>]*></script>\n<script src="hits\.js[^>]*></script>\n',
           '<script src="achievements.js"></script>\n<script src="desktop.js"></script>\n', "site scripts")

# 9. sanity: nothing external may remain except plain text / the SVG namespace
leftover = [u for u in re.findall(r'https?://[^\s"\'<>)]+', html) if not u.startswith("http://www.w3.org/")]
bad = [u for u in leftover if not u.startswith("http://ipc.localhost")]
if bad:
    sys.exit("strip_original: external URLs left: " + ", ".join(sorted(set(bad))))
for needle in ("fetch(", "XMLHttpRequest", "sendBeacon", "arcade.html", "shop.html", "cats.html", "hits.js", "quickscore", "badges.js", "share.js", "scores.json", "wgw-strip"):
    if needle in html:
        sys.exit(f"strip_original: '{needle}' still present")

OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
