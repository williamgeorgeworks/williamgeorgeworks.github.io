# Seen Off: desktop build (Tauri 2), for a future Steam release

This folder wraps the browser game **Seen Off** (`slay-the-pier.html` on `main` of
`williamgeorgeworks/williamgeorgeworks.github.io`, live at https://williamgeorgeworks.co.uk/slay-the-pier.html)
as an offline desktop app, and grows it into **A Blackpool Day Out** for Steam. **The website version is never touched.**

Platforms: **Windows, Linux and Steam Deck.** (Mac has been dropped: no Mac targets, no `.icns`, no `bundle.macOS`.)

**`web/index.html` is now a hand-maintained fork.** It started as the output of the old build step (the pinned
`slay-the-pier.original.html` from commit `676b8e2`, with the network calls and site chrome stripped), and from Milestone 1 on
the day-out code is written straight into it. `tools/strip_original.py` re-creates that starting point
(`tools/stripped-baseline.html`) for provenance and diffing only; it no longer writes `web/` and is not part of the build.

Steamworks is **not** integrated yet (no sign-ups, no app ID). There is a clean hook for it, see *Achievements* below.

## What is in here

| Path | What it is |
|---|---|
| `slay-the-pier.original.html` | Pinned, unmodified copy of the website game (input to the build) |
| `tools/strip_original.py` | The old bundle step (strips network + chrome from the original). Now only writes `tools/stripped-baseline.html`, the fork's starting point |
| `web/index.html` | **The game (hand-maintained fork).** The day-out block is marked `/* a day out (desktop, milestone 1) */` |
| `web/dayout.css` | Styles for the day-out screens: stage picker, stamp, combo, postcards, report, rock meter, souvenir shop |
| `web/desktop.css` | Desktop layout (full window, 1280x800 + 1920x1080), menu, focus ring, control hints |
| `web/desktop.js` | Menu, fullscreen, keyboard + gamepad navigation, canvas fitting, achievement wiring |
| `web/achievements.js` | `SeenOffAchievements.unlock(id)` stub (localStorage + event) for the Steam hook |
| `web/fonts/` | Anton + Permanent Marker woff2, with `OFL-Anton.txt` and `LICENSE-PermanentMarker-Apache-2.0.txt` |
| `THIRD_PARTY_NOTICES.md` | Font licences / attributions (also shipped inside every build under `licences/`) |
| `src-tauri/` | Tauri 2 app (Rust): window, fullscreen-on-Steam-Deck, `steam_unlock` command stub, icons |
| `tests/verify.js` | Headless Chromium check (layouts, zero network, keyboard-only + mock-gamepad play, the whole Milestone 1 day out) |
| `tests/dayout-driver.js` | In-page helpers for the day-out checks (autoplay through the game's own buttons, a no-scroll/no-clip check) |
| `tools/` | Icon source (`icon.html`) and renderer. The icon is a placeholder in the game's style |
| `build-all.sh` | Windows (cross) + Linux build in one go |

## A Blackpool Day Out: Milestone 1 (the day-out skeleton and the reward loop)

**The run.** A run is a day out in five parts: **Morning, Afternoon, Teatime, Evening, Last Orders.** Before each part a stage
picker offers three places (two for Last Orders); each place is a five-stop map ending in a boss. The **first run is locked to the
classic route** (the Prom, then South, Central and North Pier). Other places open from the stick-of-rock meter (Beach at stick 1,
the Pleasure Park 3, the Chippy 5, the Lights 7, the Rock Shop 9, the Tower 11, Arcades & Bingo 13, the Winter Gardens 14).
**Last Orders** (the B&B, the Old Pier) opens after your first win; at the Evening's end you may go on or *Call it a day*.
Falling over during Last Orders still counts the day as won.

| Place | Content in M1 |
|---|---|
| The Prom | **Real:** new enemies (Sea Breeze, Seagull on a Lamppost, Ticket Inspector, the Stag Do; elite the Bride and her Bridesmaids; boss **the Last Tram**, which counts down "Ding Ding 3, 2… Terminus"), and its own event *The Man Who Wanted to Sue God*. Their drawings are **borrowed from existing enemies (placeholder art)**. |
| South, Central, North Pier | The original game's piers, unchanged. |
| Beach, Rock Shop, Pleasure Park, Tower, Chippy, Arcades & Bingo, Lights, Winter Gardens, B&B, Old Pier | **Coming soon.** Real unlocking, picking, postcards and saving, but they reuse the matching pier's (or the Prom's) enemies and say so on the card and the map. B&B ×1.15 and Old Pier ×1.2 enemy health. |

**The reward loop.** A red **SEEN OFF!** rubber stamp lands on each enemy as it falls (a different sub-line per place, *PAID* for Reggie),
with a small screen shake that grows with overkill. A **combo counter** counts cards played in a turn (3 *Nice.*, 5 *Proper job!*,
7 *Ey up!*, 10 *SCENES!*) and pays +2/+5/+10/+10 Scrumplings at the end of the fight. The reward screen gets a **coin shower**.
Each place has a **postcard** (Visited / Seen Off / Gold foil on Encore 3+) in the **Postcard Album**, which also holds the
**Rock collection** (30 sticks, each with a phrase) and the **Souvenir Shelf**. Every run ends on the **Day Out Report**, a postcard
back written in the Quill's own voice with counted-up stats, the score and the rock meter, then the **souvenir shop** spends what is left
(anything unspent becomes a bag of fudge). The **stick-of-rock meter** takes half a point of rock per point of score (`ROCK_RATE`, a tuning
knob) plus bonuses (+100 win, +50 per new place, +50 new Quill-and-cat pair). The Day Tripper streak is cosmetic and only halves on a missed day.
Saves: `so-day-v1` (rock, album, shelf, streak), alongside the game's `stp-v1` / `stp-run`.

**Other fork changes:** the currency is **Scrumplings**; the Lights replace any "Illuminations" naming; Kenneth is "Chief of Staff,
by way of the Cloud"; **Spyro now matches his photos** (pure white, ginger ringed tail, a tiny ginger smudge on the forehead: the website's
drawing had a white tail and a large off-centre patch, the website file itself is untouched).

**Placeholder (to replace in later milestones):** the Prom enemies' art (borrowed drawings), the postcard art (CSS cards marked
"placeholder"), the new place icons (simple ink icons), the Last Tram's health (120, not the plan's 150, until playtested), and the
unlocks that only show as a name for now (Arthur's wig, new Quill cards, Daily Run, the later sticks: they are recorded but do nothing yet).

## What the desktop bundle changes

* **Removed (all network + site chrome):** Google Fonts link, `hits.js`, `share.js`, `badges.js`, `quickscore.js`,
  the `scores.json` fetch / top-ten wall, "Send in your score" link to the arcade (Cloudflare worker), Back to the
  arcade / Merch bar, "Before you go" strip, link to `cats.html`, social/canonical meta tags.
* `ON_SITE` is forced to `false`. (Tauri on Linux serves from `tauri://localhost`, which the site's
  `/^localhost$/` check would otherwise mistake for the dev server.)
* A strict Content-Security-Policy is added (page + Tauri config): only `'self'`, `data:`/`blob:` and Tauri IPC.
  Even a stray external URL could not load.
* **Kept:** all gameplay, art, music, sound, and saves (`localStorage` keys `stp-v1`, `stp-run`; they persist in the webview's
  app-data folder). "Copy my result" still copies to the clipboard.
* The masthead is gone (the HUD already says SEEN OFF). The *How it works*, glossary, piers, familiars and record panels move into
  **Menu → How to play**, and the footer goes into **Menu → Credits**.
* One small hook is exposed for the desktop layer: `window.__SO` (state + `act`).

## Layout

* The booth fills the window. In a fight, the scene canvas keeps its 680x360 shape and is sized to whatever height is left
  after the HUD, the detail line and a full hand. The energy orb and End turn sit to the right of the hand, so
  **1280x800 (Steam Deck)** gets a big scene with no scrolling. **1920x1080** and up also scale the type and cards up (root font 19px, 140px cards).
* Long screens (deck, shop, map on short windows) scroll inside the booth. The right stick or d-pad scrolls them when there is nothing further to move to.
* Min window 1024x640; default 1280x800. **F11** or Menu → Full screen toggles fullscreen. On a Steam Deck (`SteamDeck=1`), in Steam Big Picture
  (`SteamGamepadUI`), or with `SEEN_OFF_FULLSCREEN=1`, it starts fullscreen.

## Controls

| Action | Keyboard | Controller (standard / Xbox / Steam Deck) |
|---|---|---|
| Move focus (Quills, cats, map stops, cards, enemies, buttons, menu) | Arrows / WASD, Tab | D-pad / left stick |
| Choose / pick up a card / play it / hit the focused enemy | Enter / Space | A |
| Back (put card down, close deck, close menu); opens the menu if nothing to back out of | Esc / Backspace | B |
| End turn | E | X |
| Deck | (HUD Deck chip) | Y |
| Previous / next card in hand | Q / R | LB / RB |
| Pick card by number (game's own) | 1-9, 0 | n/a |
| Scroll long pages | (arrows at the end of a list) | Right stick |
| Menu | Esc | Start / ☰ |
| Fullscreen | F11 | View / Back |

The focus highlight is a pulsing gold, ink-outlined ring in the game's own style. Enemy targets get a dashed pink ring with a
Permanent Marker "Target" tag, and a picked-up card is labelled "Again to play". The ring hides when the mouse moves, so mouse and touch play is
unchanged. The hint bar at the bottom shows keyboard keys, and switches to coloured A/B/X/Y controller glyphs as soon as a pad is used.

## Achievements (Steam hook)

`web/achievements.js` defines `SeenOffAchievements.unlock(id)` and a list of IDs (`FIRST_BLOOD`, `FIRST_FAMILIAR`, `PIER_SOUTH`,
`PIER_CENTRAL`, `PIER_NORTH`, `RUN_WON`, `ENCORE_1`, `ENCORE_5`, and from M1 `PROPER_JOB`, `SCENES`, `FIRST_POSTCARD`, `FIRST_STICK`). `desktop.js` fires them by watching game state, so the game code is
unchanged. Today each unlock goes to localStorage, shows a toast and appears in Menu → Achievements. To go live on Steam:
1. Create the same API names in Steamworks.
2. Add the `steamworks` crate to `src-tauri`, init the client in `setup`, and implement `steam_unlock` in `src-tauri/src/lib.rs`
   (`user_stats().achievement(id).set()` + `store_stats()`).
3. Uncomment the `invoke('steam_unlock', …)` line in `achievements.js`'s `backend()`. Ship `steam_api64.dll` / `libsteam_api.so` next to the binary.

## Building

Prerequisites (Debian/Ubuntu): `libwebkit2gtk-4.1-dev build-essential libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`,
Rust via rustup (stable), Node 18+, Python 3. For the Windows cross-build: `nsis lld llvm clang`, `rustup target add x86_64-pc-windows-msvc`,
`cargo install --locked cargo-xwin`, and `clang-cl` on PATH (e.g. `ln -s clang-cl-19 /usr/bin/clang-cl`). cargo-xwin downloads the MSVC CRT/SDK
on first run, which means accepting Microsoft's licence for those files.

```bash
npm ci                      # Tauri CLI + playwright-core (tests)
./build-all.sh              # Windows NSIS installer (cross) + Linux .deb + .AppImage
# or one at a time:
npx tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
NO_STRIP=true npx tauri build --bundles deb,appimage
node tests/verify.js        # headless checks + screenshots into ../shots/
```

Outputs:
* Windows: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Seen Off_0.1.0_x64-setup.exe` (installer, per-user, embeds the WebView2 bootstrapper),
  and the bare `…/release/seen-off.exe`. **For Steam, upload the bare exe plus files, not the installer.** WebView2 ships with Windows 10/11.
  For older machines, add the WebView2 runtime as a Steam redistributable or switch `webviewInstallMode` to `fixedRuntime`.
* Linux: `src-tauri/target/release/bundle/appimage/Seen Off_0.1.0_amd64.AppImage` (self-contained, the one to use for Steam / Steam Deck) and `…/deb/Seen Off_0.1.0_amd64.deb`.

## Steam Deck (must-have) status

* Controller navigation is generic: every enabled `[data-a]` button the game draws, plus enemies when a card or brew needs a target,
  can be reached by spatial d-pad movement, with A to choose and B to back out. **Tested end to end:** title, cat, map, fight (cards, targets,
  End turn), deck view, reward, and the menu pages. **Not yet walked by a test:** shop, rest/improve, event, treasure, red-pen cut, boss
  rewards, game over. They use the same buttons, so they should work, but they need a manual pass before Deck Verified review.
* 1280x800 is the default window and the layout target. The smallest in-game text (card text) is about 12px at 1280x800, inside
  Valve's readability guidance, but check it on a real Deck.
* On-screen glyphs switch to A/B/X/Y (Deck/Xbox layout) when a controller is used.
* The AppImage was launched under Xvfb at 1280x800 with `SteamDeck=1`. It starts fullscreen, the fonts render, and a keyboard-only run got into the
  first fight in the real WebKitGTK webview (see `../shots/linux-appimage-*.png`).
* **Still needs a real Deck:** WebKitGTK's Gamepad API depends on the distro build (libmanette). The mock-gamepad tests pass in Chromium,
  but the Deck's own webview has not been checked yet. Fallback: ship a Steam Input config that maps the Deck's controls to the keyboard
  keys above, which already cover every action. Run it in Game Mode with the Steam Linux Runtime, check that saves persist
  (`~/.local/share/uk.co.williamgeorgeworks.seenoff`), and that suspend/resume does not lose audio.

## Verification (this build)

`node tests/verify.js` serves `web/` on 127.0.0.1 and drives headless Chromium at **1280x800** and **1920x1080**:
bundled fonts load, no page scroll, **zero external requests** (every request stays on 127.0.0.1 or data:), no page errors,
keyboard-only: pick a Quill → Begin → pick a cat → map → first fight → play cards (including targeting) → End turn until the fight is won;
Esc menu + How to play; mock gamepad: d-pad + A, Start/B menu, and at 1280x800 a full **controller-only** first fight (Y deck/B back,
A to pick/target, X to end turn) through to taking a reward card and returning to the map. Screenshots go to `../shots/`.

The **Milestone 1** section (`m1 …` checks, 1280x800) plays a first day out end to end: the locked first-run picker, keyboard into the Prom,
Prom enemies, the combo tiers at 3/5/7, the stamp, the coin shower and combo bonus, every stage through the game's own buttons
(fights shortened by setting enemy health to 1), the Day Out Report (count-up, Quill note, first win opens Last Orders), the album and
rock tabs and the souvenir shop by keyboard, saving across a reload, a second day with the Beach unlocked, resume, Last Orders and
Call it a day, the new achievements, a trade-mark scan of the page, zero external requests and no page errors. Each new screen is
checked for no scrolling and nothing clipped at 1280x800.
