# Seen Off: desktop build (Tauri 2), for a future Steam release

This folder wraps the browser game **Seen Off** (`slay-the-pier.html` on `main` of
`williamgeorgeworks/williamgeorgeworks.github.io`, live at https://williamgeorgeworks.co.uk/slay-the-pier.html)
as an offline desktop app. **The website version is never touched**: the build reads a pinned copy
(`slay-the-pier.original.html`, from commit `676b8e2`, sha256 `3f0dbdb3…48260`) and writes a separate bundle in `web/`.

Steamworks is **not** integrated yet (no sign-ups, no app ID). There is a clean hook for it, see *Achievements* below.

## What is in here

| Path | What it is |
|---|---|
| `slay-the-pier.original.html` | Pinned, unmodified copy of the website game (input to the build) |
| `build_bundle.py` | Turns the original into `web/index.html`. Every edit is an exact match that must hit once, so if the site file changes shape the build fails loudly |
| `web/index.html` | Generated offline game page (committed so `frontendDist` works without Python) |
| `web/desktop.css` | Desktop layout (full window, 1280x800 + 1920x1080), menu, focus ring, control hints |
| `web/desktop.js` | Menu, fullscreen, keyboard + gamepad navigation, canvas fitting, achievement wiring |
| `web/achievements.js` | `SeenOffAchievements.unlock(id)` stub (localStorage + event) for the Steam hook |
| `web/fonts/` | Anton + Permanent Marker woff2, with `OFL-Anton.txt` and `LICENSE-PermanentMarker-Apache-2.0.txt` |
| `THIRD_PARTY_NOTICES.md` | Font licences / attributions (also shipped inside every build under `licences/`) |
| `src-tauri/` | Tauri 2 app (Rust): window, fullscreen-on-Steam-Deck, `steam_unlock` command stub, icons |
| `tests/verify.js` | Headless Chromium check (layouts, zero network, keyboard-only + mock-gamepad play) |
| `tools/` | Icon source (`icon.html`) and renderer. The icon is a placeholder in the game's style |
| `build-all.sh` | Windows (cross) + Linux build in one go |

## What the desktop bundle changes (and only in the bundle)

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
`PIER_CENTRAL`, `PIER_NORTH`, `RUN_WON`, `ENCORE_1`, `ENCORE_5`). `desktop.js` fires them by watching game state, so the game code is
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
python3 build_bundle.py     # regenerate web/index.html from the pinned original
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

### macOS (wanted at launch, not built here)

The config is ready: `bundle.targets` is `all`, icons include `icon.icns`, and `bundle.macOS` sets the minimum version (10.15) and hardened runtime.
You need:
1. **A Mac or a macOS CI runner** (e.g. GitHub Actions `macos-14`). Tauri cannot cross-compile to macOS from Linux.
   Build a universal binary with `rustup target add aarch64-apple-darwin x86_64-apple-darwin` and
   `npx tauri build --target universal-apple-darwin --bundles app,dmg`.
2. **Apple Developer Program** membership (US$99/yr) and a *Developer ID Application* certificate. Set `APPLE_CERTIFICATE`,
   `APPLE_CERTIFICATE_PASSWORD` and `APPLE_SIGNING_IDENTITY` (or `bundle.macOS.signingIdentity`).
3. **Notarisation:** set `APPLE_ID`, `APPLE_PASSWORD` (app-specific password) and `APPLE_TEAM_ID` (or an App Store Connect API key),
   and Tauri notarises and staples during `tauri build`. For Steam, upload the signed and notarised `.app`.
4. Steamworks on Mac needs `libsteam_api.dylib` inside the bundle (`Contents/Frameworks`), and has to be signed as well.

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
