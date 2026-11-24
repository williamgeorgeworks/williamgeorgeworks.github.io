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
| `web/fonts/` | Anton + Permanent Marker + Libre Caslon Text woff2, with `OFL-Anton.txt`, `LICENSE-PermanentMarker-Apache-2.0.txt` and `OFL-LibreCaslonText.txt` |
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

**Placeholder (M1 items, status after M2):** the Prom enemies now have real drawings (M2); the postcard art is still CSS cards marked
"placeholder"; the place icons are still simple ink icons; the Last Tram was retuned in M2 (see below); Arthur's wig, the new Quill cards
and the Daily Run now work (M2). The cat signature-card mockups are wired in (M2, see below).

## A Blackpool Day Out: Milestone 2 (six places, unlocks, polish)

Branch `archie/seen-off-dayout`, commits (each pushed after its tests passed):
`2c53d8c` step 1 (boss bill, NEW! stamp, effects setting, keyboard pass, Prom art), `9e642b5` step 2 (six places),
`69008db` step 3 (unlocks, cat card art), then step 4 (playtest tuning, this README, the playtest bot; see `git log`).

| Area | What M2 did |
|---|---|
| Six places | **The Beach, the Rock Shop, the Pleasure Park, the Tower, the Chippy, the Lights** have their own crowds (4-5 enemies, an elite, a boss), their own event and scenery props. Mechanics: the Windbreak shelters everyone; the Ringmaster's *Roll Up*; the Sugar Dummy heals; *You Must Be This Tall* hits 12 if you held more than 5 cards; the Woman Behind the Counter asks *Salt? / Vinegar? / Open or wrapped?* (answer with a Skill / Attack / Power, or she gains 3 Gusto); the Mighty Organ starts half sunk in the organ pit (half damage) and rises; Faulty Bulbs flicker (25% miss); the Queue gains Block when hit; the Stick That Says BLACKPOOL snaps into two at half health; the Crocodile's *Behind You!* hides its number. New: clutter *Unflattering Photo* and *Catchphrase*, keepsake *Ride Photo*, brew *Bag of Scraps*. |
| Prom art | Real ink drawings for the Sea Breeze, Lamppost Gull, Ticket Inspector, Stag Do, Bride, Bridesmaid and the Last Tram (destination blind, bell countdown). |
| Unlocks | Stick #2 **Arthur's wig** (drawn under his red hat; on/off in the album). Sticks #4/#8/#12: **4 new cards** each for Reggie/Terry/Kenneth (the plan's table has 4 each; the plan's stick text said 5, so the stick now says four). Stick #6 souvenir line two (tested). Stick #10 or the first win: **the Daily Run** (date-seeded: same Quill, cats, maps, fights, rewards and shops for everyone that day; best score per date on the report; the Day Tripper streak now only ticks on the Daily). |
| Polish | *TONIGHT ONLY* title card before bosses; **NEW!** stamp on never-seen reward cards; **Effects: full / calm / off** in the menu (off = reduced motion); keyboard/pad walk of shop, rest, edit, event, keepsake and rewards; the Prom's boss tile says "the end of the line" (piers keep "the end of the pier"). |
| Cat card art | The six cats' signature cards (Ruling of the Court, Royal Decree, Rip Your Face Off, Requisition, Wouldn't Say Boo, Who, Me?) show art cropped from the mockups in `../mockups/` (`web/cats/*.jpg`, 360 px). `old-card-royal-decree-reggie.jpg` was skipped as asked. |
| Tuning | `tools/playtest.js` (headless bot, no cheats; `tools/playtest-summary.py` summarises). Before: `ROCK_RATE` .5 gave a winning first day 5-6 sticks; now **.3** gives ~4 (the plan's sticks 1-4). The Last Tram went from 118-124 to **132-138** health: the bot still wins it 17/18 times, losing ~31 health (it was ~28). The Crocodile (Beach boss) is the hardest new boss (bot ends on 7-47 health); the later bosses (Counter, the Man Off the Telly) are on the easy side. |

**Placeholder art in M2 (marked "PLACEHOLDER" on screen):** every enemy at the six new places is a painted cardboard stand-up
with its name on it (`ART.standee`), and the place scenery is a few simple ink props over the matching pier's backdrop.

**Art needed (no AI images were generated for this milestone):**
1. 35 enemy drawings for the six places, in the game's ink style: Beach (Sandcastle, Jellyfish, Windbreak, Shore Crab, the Donkey Who Has
   Had Enough, the Crocodile with the Sausages); Rock Shop (Stick of Rock, Chattering Teeth, Fudge Tray, Sugar Dummy, the Rock Boiler,
   the Stick That Says BLACKPOOL, Half a Stick); Pleasure Park (You Must Be This Tall sign, Dodgem, Ghost Train Skeleton, Log Flume,
   the Ride Photo Kiosk, Old Rattler the wooden coaster); Tower (Ballroom Couple, Lift Attendant, Circus Clown, the Ringmaster,
   the Mighty Organ; the Tower Pigeon reuses the pigeon); Chippy (Battered Sausage, Mushy Peas, Curry Sauce, the Queue, Pickled Onion,
   the Fryer, the Woman Behind the Counter); the Lights (Faulty Bulb, Lit-up Tableau, Coach Party, Moth, the Lit-up Tram, A Man Off the Telly:
   a made-up presenter, not anyone real).
2. Six place backdrops (or overlays for the existing pier backdrops) to replace the prop sketches.
3. Card art for the 12 new Quill cards, and card-art crops for the other cards if the mockup style becomes the standard.
4. The postcard fronts (still CSS placeholders from M1) and the place icons.

**Art credit / disclosure:** `web/cats/*.jpg` are crops of the card mockups supplied in `../mockups/`. If those mockups were made with
AI image tools, they must be declared in Steam's Content Survey (see the Content Survey notes in `content-plan.md`). Nothing else in M2 is an image file.

**Cat colours check:** the in-game cats were compared with the photos in `/workspace/cats/` (from williamgeorgeworks.co.uk). Spyro was fixed
in M1. Dexter was fixed on 23 Nov 2026: he is now smoky black (near-black head, ears and body) with a silver-grey chest ruff and amber eyes,
as in his photos (he was drawn dark grey, and his ruff colour was never drawn). The live website file is untouched.

**Not done / untested in M2:** Daily Rules (the plan's one rule per day) and Steam leaderboards (no Steamworks); Rainy Day tokens; the
legendary cards; Arcades & Bingo, the Winter Gardens, the B&B and the Old Pier still borrow pier crowds ("Coming soon"); the Daily's seed
covers generation (maps, fights, rewards, shops, events), not mid-fight draws after turn 1. Steam Deck hardware and Windows were not run
on real machines (the Windows installer is built and the Linux AppImage smoke-tested under Xvfb).

### Where to pick up next time

State at end of 23 Nov 2026 (branch `archie/seen-off-dayout`, working copy `/workspace/seen-off-steam/desktop`, local git mirrors the pushed commits):

1. **Done:** M2 complete (builds in `/workspace/seen-off-steam/dist/m2/`, not rebuilt since). M3 so far, web only, no desktop rebuild:
   Dexter recoloured to smoky black with a grey ruff; the shared inked card frame (owner tint, larger art window, owner type line,
   Libre Caslon rules text, rarity crest); painted art on the six cat cards and all three heroes' starter cards (Reggie, Terry, Kenneth;
   nine cards). Kenneth's three were redone on 24 Nov from his proper portrait. Screenshots: `/workspace/seen-off-steam/shots/d1-*` and `d2-*.png`.
2. **Tests:** `node tests/verify.js` (about 6 min; 202/202 passing on 24 Nov; `ONLY=m2d` etc. runs one section).
   Playtest: `RUNS=6 node tools/playtest.js out.json`.
3. **Suggested next chunk (small): Kenneth's sprite to match his portrait.** In `drawQuill()` (`web/index.html`, `kind==='k'`):
   swap the paper-bag head for a boxy cream head with round glasses, a black cap with a red feather and round ear-pieces with a red Q;
   waistcoat purple to black with a small red Q badge; tie dark to red; hand prop parcel to a quill (the thrown parcel in his attack
   animation can stay). Also the text: the Credits line "He appears with a bag on his head because nobody has drawn him yet" and the
   report line "The bag is staying on." Decide with Ben whether his owner colour stays purple (`#7a3ff0`: card frame, HUD, title) or moves
   to black/red (red is Reggie's). Re-run tests and refresh the Kenneth title/fight screenshots. After that: the most-seen common reward
   cards, three per hero per session, then a desktop rebuild into `dist/m3/` once the art settles.
4. **Still open for M3 (from the M2 proposal):** real drawings for the 35 new enemies (still labelled PLACEHOLDER stand-ups); the other
   four places (Arcades & Bingo, the Winter Gardens, the B&B, the Old Pier); Daily Rules; legendary cards; a boss-health pass for later places.
5. **Before release:** declare everything in the AI content list below in Steam's Content Survey.

**WebKitGTK note:** `app.security.dangerousDisableAssetCspModification` is `["style-src"]`. Without it Tauri adds hashes to `style-src`,
which switches off `'unsafe-inline'` and silently drops every inline `style="--var:…"` the game sets (place colours, the rock meter fill,
animation delays). Scripts keep Tauri's CSP handling; the policy still allows only `'self'`.

## Milestone 3, step 1: the card frame (23 Nov 2026)

* **One shared inked frame for every card, tinted by owner:** Reggie red `#e3182d`, Terry blue `#2456e6`, Kenneth purple `#7a3ff0`,
  each cat's card in its hat colour, clutter grey `#6b7183` (`.cd::before` in `web/dayout.css`). The title bar keeps its type colour.
* **Larger art window** (48 px on desktop, was 46; 78 px for the cat cards). **Type line names the owner** (`ATTACK – SPYRO`, `SKILL – REGGIE`; `cardOwner()`).
* **Rules text in Libre Caslon Text** (old-style serif, SIL Open Font License 1.1, Copyright 2018 The Libre Caslon Text Project Authors;
  `web/fonts/libre-caslon-text-latin-*.woff2` from @fontsource, licence in `web/fonts/OFL-LibreCaslonText.txt`, shipped under `licences/`).
* **Rarity crest:** a small shield at the bottom centre (grey common, blue uncommon, gold rare).
* **The six cats' signature cards show their mockup art full width** (`web/cats/*.jpg`, 480 px crops of `../mockups/card-*.jpg`;
  `old-card-royal-decree-reggie.jpg` not used).

### Reggie's starter cards (23 Nov 2026)

Red Pen, Polite Cough and Imaginary Invoice (the three cards in Reggie's starter deck: 4 + 4 + 1) have painted art in the cat-card style.
Reggie was drawn from his portrait on williamgeorgeworks.co.uk (`portraits/reggie.jpg`, saved as `../refs/reggie-portrait.jpg`),
passed as a reference image along with the Spyro card art for style. Full images: `../mockups/card-red-pen.jpg`, `card-polite-cough.jpg`,
`card-imaginary-invoice.jpg`; in-game crops: `web/cards/*.jpg`. The backdrop tower is generic and unnamed (its sign is unreadable scribble).

### Terry's starter cards (23 Nov 2026)

Ink Blot, Sketchbook and Splatter (Terry's starter deck: 4 + 4 + 1) have painted art in the same style. Terry was drawn from his portrait
on williamgeorgeworks.co.uk (`portraits/terry.jpg`, the file used on the home page; saved as `../refs/terry-portrait.jpg`): boxy riveted
head, red knob aerial, round bolt ears, red knitted waistcoat with watch chain, white shirt, dark tie. Style references: the Spyro card art
and Reggie's Red Pen. Full images: `../mockups/card-ink-blot.jpg`, `card-sketchbook.jpg`, `card-splatter.jpg`; in-game crops:
`web/cards/inkblot.jpg`, `sketch.jpg`, `splatter.jpg`. Generic unnamed tower and prom backdrop (tower sign is unreadable scribble). One generation each, no retries.

### Kenneth's starter cards (redone 24 Nov 2026)

Firm Handshake, Vague Nod and Who Invited Him? (Kenneth's starter deck: 4 + 4 + 1) have painted art in the same style.
**Likeness source:** Kenneth's proper portrait, sent by Ben on 23 Nov 2026 (`/workspace/seen-off-steam/reference/kenneth-portrait.jpg`,
copied to `../refs/kenneth-portrait.jpg`): boxy cream riveted robot head, round glasses, black cap with a red feather, ear-pieces with a
red Q, white shirt, red tie, black waistcoat with a red Q badge. Style references: the Spyro card art and Terry's Ink Blot.
Full images: `../mockups/card-firm-handshake.jpg`, `card-vague-nod.jpg`, `card-who-invited-him.jpg`; in-game crops: `web/cards/handshake.jpg`,
`nod.jpg`, `whoinv.jpg`. Generic unnamed tower and prom (sign is scribble), plain red chip carton with no brand. One generation each, no retries.
These replace the 23 Nov versions drawn from the Dead Air FM paper-bag crew picture (kept for the record in
`../mockups/old-kenneth-paperbag/`, not shipped).

**Kenneth's in-game sprite** (`drawQuill()` in `web/index.html`, the `else` branch) was redrawn on 24 Nov to match the portrait:
boxy cream head, round glasses, black cap with a red feather, red-Q ear-pieces, black waistcoat with a red Q badge, red tie, red quill in
hand (his attack still lobs a parcel). His UI colour stays purple `#7a3ff0` until Ben decides. Credits and report lines rewritten to suit.

**Steam Content Survey, pre-generated AI content (definite; keep this list up to date):**
- `web/cards/redpen.jpg`, `web/cards/cough.jpg`, `web/cards/invoice.jpg`: AI-generated (23 Nov 2026) from Reggie's portrait and our card style.
- `web/cards/inkblot.jpg`, `web/cards/sketch.jpg`, `web/cards/splatter.jpg`: AI-generated (23 Nov 2026) from Terry's portrait and our card style.
- `web/cards/handshake.jpg`, `web/cards/nod.jpg`, `web/cards/whoinv.jpg`: AI-generated (24 Nov 2026) from Kenneth's portrait (sent by Ben) and our card style.
- `web/cats/*.jpg` (all six cat signature cards): crops of the cat card mockups in `../mockups/card-*.jpg`, which **were AI-generated**
  (from the cats' real photos). Declare them as pre-generated AI content.
- The full-size sources of all of the above in `../mockups/`.

### Cards still needing real art

Only the six cats' signature cards, Reggie's three starter cards (Red Pen, Polite Cough, Imaginary Invoice), Terry's three (Ink Blot, Sketchbook, Splatter) and Kenneth's three (Firm Handshake, Vague Nod, Who Invited Him?) have painted art. Every other card still shows its ink icon on the coloured panel (placeholder):

- **Reggie (19):** Extra Tenner for the Y, Sales Patter, A Nice Little Earner, Fact Check, Line Edit, Itemised Bill, Compound Interest, Kindly Remit, Brave Face, My Old Son, Cartel Pricing, Rounding Up, Proofread, Final Demand, Wounded Dignity, Cash in Hand, VAT Inclusive, Late Payment Charge, The Bailiffs
- **Terry (20):** Cross-Hatch, Theatrical Outrage, Wraparound Cover, Big Bold Title, Full Colour, Rough Draft, Frame Rate, Day One Purchase, Ink Wash, Quick Sketch, Splatter Storm, Two-Page Spread, Steady Hand, Reference Photo, Masterpiece, Scribble, Bleed Edge, Spot Colour, Letters to the Editor, Centre Spread
- **Kenneth (19):** Unexplained Arrival, Says He Knows Terry, Friend of Reggie's, Cousin Once Removed, Nobody Asked, Mysterious Parcel, Turns Up Uninvited, Long Story, Open Invitation, Plus One, Wrong House, Changes the Subject, Coin Toss, Left Without Saying Goodbye, Air of Mystery, Minutes of the Meeting, Reply All, Delegated, Nobody Minuted It
- **Shared / clutter (6):** Form 27B, Mislaid Sock, Parking Ticket, Writer's Block, Unflattering Photo, Catchphrase

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
