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
| `web/postcards/` | Painted postcard fronts for the fourteen places (3:2 JPEGs). Visited album cards use these; titles are HTML text |
| `web/heroes/` | The Ferret's wordless pick-screen and in-fight portrait (`ferret.jpg`), painted from Terry's illustrated portrait |
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

**Placeholder (M1 items, status after the 28 Nov 2026 postcard pass):** the Prom enemies now have real drawings (M2); the fourteen
postcard fronts are painted (`web/postcards/`, 28 Nov 2026) with "Greetings from" and the place name as real HTML text; the place icons
are still simple ink icons; the Last Tram was retuned in M2 (see below); Arthur's wig, the new Quill cards and the Daily Run now work
(M2). The cat signature-card mockups are wired in (M2, see below).

## A Blackpool Day Out: Milestone 2 (six places, unlocks, polish)

Branch `archie/seen-off-dayout`, commits (each pushed after its tests passed):
`2c53d8c` step 1 (boss bill, NEW! stamp, effects setting, keyboard pass, Prom art), `9e642b5` step 2 (six places),
`69008db` step 3 (unlocks, cat card art), then step 4 (playtest tuning, this README, the playtest bot; see `git log`).

| Area | What M2 did |
|---|---|
| Six places | **The Beach, the Rock Shop, the Pleasure Park, the Tower, the Chippy, the Lights** have their own crowds (4-5 enemies, an elite, a boss), their own event and scenery props. Mechanics: the Windbreak shelters everyone; the Ringmaster's *Roll Up*; the Sugar Dummy heals; *You Must Be This Tall* hits 12 if you held more than 5 cards; the Woman Behind the Counter asks *Salt? / Vinegar? / Open or wrapped?* (answer with a Skill / Attack / Power, or she gains 3 Gusto); the Mighty Organ starts half sunk in the organ pit (half damage) and rises; Faulty Bulbs flicker (25% miss); the Queue gains Block when hit; the Stick That Says BLACKPOOL snaps into two at half health; the Crocodile's *Behind You!* hides its number. New: clutter *Unflattering Photo* and *Catchphrase*, keepsake *Ride Photo*, brew *Bag of Scraps*. |
| Prom art | Real ink drawings for the Sea Breeze, Lamppost Gull, Ticket Inspector, Stag Do, Bride, Bridesmaid and the Last Tram (destination blind, bell countdown). |
| Unlocks | Stick #2 **Arthur's wig** (drawn under his red hat; on/off in the album). Sticks #4/#8/#12: **4 new cards** each for Reggie/Terry/Kenneth (the plan's table has 4 each; the plan's stick text said 5, so the stick now says four). Sticks #15/#16/#17: **legendary cards** for Reggie, Terry and Kenneth (Bankrupt, Magnum Opus, The Cloud Provides). Stick #18: **The One That Didn't Get Away**, the Ferret's legendary. The Ferret himself opens after any win, or once 16 rock sticks have been pulled. Stick #6 souvenir line two (tested). Stick #10 or the first win: **the Daily Run** (date-seeded: same Quill, cats, maps, fights, rewards and shops for everyone that day; best score per date on the report; the Day Tripper streak now only ticks on the Daily). |
| Polish | *TONIGHT ONLY* title card before bosses; **NEW!** stamp on never-seen reward cards; **Effects: full / calm / off** in the menu (off = reduced motion); keyboard/pad walk of shop, rest, edit, event, keepsake and rewards; the Prom's boss tile says "the end of the line" (piers keep "the end of the pier"). |
| Cat card art | The six cats' signature cards (Ruling of the Court, Royal Decree, Rip Your Face Off, Requisition, Wouldn't Say Boo, Who, Me?) show art cropped from the mockups in `../mockups/` (`web/cats/*.jpg`, 360 px). `old-card-royal-decree-reggie.jpg` was skipped as asked. |
| Tuning | `tools/playtest.js` (headless bot, no cheats; `tools/playtest-summary.py` summarises). Before: `ROCK_RATE` .5 gave a winning first day 5-6 sticks; now **.3** gives ~4 (the plan's sticks 1-4). The Last Tram went from 118-124 to **132-138** health: the bot still wins it 17/18 times, losing ~31 health (it was ~28). The Crocodile (Beach boss) is the hardest new boss (bot ends on 7-47 health); the later bosses (Counter, the Man Off the Telly) are on the easy side. |

**Placeholder art in M2 (marked "PLACEHOLDER" on screen):** every enemy at the six new places was a painted cardboard stand-up
with its name on it (`ART.standee`; replaced by real drawings in M3, see below), and the place scenery is a few simple ink props over the matching pier's backdrop.

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
4. The postcard fronts are done (28 Nov 2026, `web/postcards/`). The place icons are still simple ink icons.

**Art credit / disclosure:** `web/cats/*.jpg` are crops of the card mockups supplied in `../mockups/`. If those mockups were made with
AI image tools, they must be declared in Steam's Content Survey (see the Content Survey notes in `content-plan.md`). Nothing else in M2 is an image file.

**Cat colours check:** the in-game cats were compared with the photos in `/workspace/cats/` (from williamgeorgeworks.co.uk). Spyro was fixed
in M1. Dexter was fixed on 23 Nov 2026: he is now smoky black (near-black head, ears and body) with a silver-grey chest ruff and amber eyes,
as in his photos (he was drawn dark grey, and his ruff colour was never drawn). The live website file is untouched.

**Not done / untested in M2:** Daily Rules (added in M3, see below) and Steam leaderboards (no Steamworks); Rainy Day tokens. The
legendary cards for the three existing Quills are in M3 (see below); all ten new places have their own crowds (Arcades, Winter Gardens, the B&B and the Old Pier finished 28 Nov); the Daily's seed
covers generation (maps, fights, rewards, shops, events), not mid-fight draws after turn 1. Steam Deck hardware and Windows were not run
on real machines (the Windows installer is built and the Linux AppImage smoke-tested under Xvfb).

### Milestone 3 desktop build and enemy drawings (27 Nov 2026)

**Desktop build `dist/m3/`** (built 27 Nov 2026 from commit `c08ca94`, all 79 painted cards; copies with `SHA256SUMS` in
`/workspace/seen-off-steam/builds-m3/`). Not uploaded or published anywhere.

| File | Bytes | sha256 |
|---|---|---|
| `Seen Off_0.1.0_amd64.AppImage` (Linux / Steam Deck) | 97,864,184 | `523c3a038c155d43b38773b90ac3096f1e5ab8c51d199a010229bfc0f429882d` |
| `Seen Off_0.1.0_amd64.deb` | 6,363,512 | `ac9f7f74271cd84ab3a3da5ac6fdd6b41ae4e23b15c7e25a235c0e4872b909cc` |
| `Seen Off_0.1.0_x64-setup.exe` (Windows NSIS installer) | 7,843,998 | `4844ef4e2d92e2d57467398d541efc9757e56fdb0227f1e59baccaf333bf5c0b` |
| `seen-off.exe` (bare Windows exe, the one for Steam) | 8,047,616 | `ec2829fd6cec30649aa0a5b967187742d5ff9a1960d7a1f8776d287a560de67e` |

The AppImage was smoke-tested under Xvfb (`shots/d5-01-appimage-xvfb.png`, `d5-02-appimage-ingame.png`, `d5-02-appimage-fight.png`).
No Mac build. Windows and Steam Deck were not run on real hardware. The enemy drawings below came after this build, so they are
not in `dist/m3/` until the next rebuild.

**Desktop build `dist/m3b/`** (built 28 Nov 2026 from commit `4ac43723`, which includes all ten new places, Daily Rules, both boss-health passes, enemy drawings and the Handout card art; copies with `SHA256SUMS` in `/workspace/seen-off-steam/builds-m3b/`). Also at `/workspace/seen-off-steam/dist/m3b/`. Not uploaded or published anywhere.

| File | Bytes | sha256 |
|---|---|---|
| `Seen Off_0.1.0_amd64.AppImage` (Linux / Steam Deck) | 97,921,528 | `4361496e1e199064197e553bac5892ad104e6025531ff30876a31c56e11e2177` |
| `Seen Off_0.1.0_amd64.deb` | 6,423,940 | `b88ccdae16491db82a91f666c6332901856cd3fd59c89c1b657a232175a2bda9` |
| `Seen Off_0.1.0_x64-setup.exe` (Windows NSIS installer) | 7,918,743 | `9935a10cee1b234dbd9960ac1dbaf7056fdee9754a555ba9dded47eb940bc1b6` |
| `seen-off.exe` (bare Windows exe) | 8,107,520 | `077ca28444be0ddd7302fe129d9572b04f2a9da170c3c25e7468f7195fc777e7` |

The AppImage was smoke-tested under Xvfb at 1280x800 with `SteamDeck=1` (`shots/d7-01-appimage-xvfb.png`, `d7-02-appimage-ingame.png`, `d7-02b-appimage-map.png`, `d7-03-appimage-fight.png`). No Mac build. Windows and Steam Deck were not run on real hardware.

**Desktop build `dist/m3c/`** (built 28 Nov 2026, 02:42-02:43 Europe/London, from commit `1714a643`, which includes the three Quill legendary cards and their painted art, plus everything in m3b and the later clutter art; copies with `SHA256SUMS` in `/workspace/seen-off-steam/builds-m3c/`). Also at `/workspace/seen-off-steam/dist/m3c/` and `desktop/dist/m3c/` (gitignored). Not uploaded or published anywhere.

| File | Bytes | sha256 |
|---|---|---|
| `Seen Off_0.1.0_amd64.AppImage` (Linux / Steam Deck) | 98,298,360 | `a1872c3d56ef773163ab5bbff0e43a03a5636f239eefaf71eba1d9a6de957d7c` |
| `Seen Off_0.1.0_amd64.deb` | 6,804,036 | `b61782b95353827c300f17e0c5f127bc31817288b67b04b82febaf9f665dbf92` |
| `Seen Off_0.1.0_x64-setup.exe` (Windows NSIS installer) | 8,301,598 | `bde39860d66cdef91c7aa3b817fc873ce8bab2d99ff073b455c653f503f9edcd` |
| `seen-off.exe` (bare Windows exe) | 8,486,912 | `465e2e1ca353e70a1ec4c990f7ab3971302816242a55cba24c2d058345682867` |

The AppImage was smoke-tested under Xvfb at 1280x800 with `SteamDeck=1` (`shots/d9-03-appimage-xvfb.png`, `d9-03-appimage-ingame.png`, `d9-03-appimage-map.png`, `d9-03-appimage-fight.png`). No Mac build. Windows and Steam Deck were not run on real hardware. Missing GStreamer audio elements on the box log warnings; the UI still ran.

**Desktop build `dist/m3d/`** (built 28 Nov 2026, 10:08-10:10 Europe/London, from commit `b17d603e`, which adds the fourteen painted postcard fronts and everything in m3c; copies with `SHA256SUMS` in `/workspace/seen-off-steam/builds-m3d/`). Also at `/workspace/seen-off-steam/dist/m3d/` and `desktop/dist/m3d/` (gitignored). Not uploaded or published anywhere.

| File | Bytes | sha256 |
|---|---|---|
| `Seen Off_0.1.0_amd64.AppImage` (Linux / Steam Deck) | 102,611,448 | `b0d660314cbd031b7a0ebfe82d901b9a575787c243d93897528a5d73c55ebecd` |
| `Seen Off_0.1.0_amd64.deb` | 11,115,382 | `35ec048c42dd5026b3815dafbadaeb48490fb575fe0a7a2e5241c4c72dd09ed3` |
| `Seen Off_0.1.0_x64-setup.exe` (Windows NSIS installer) | 12,642,397 | `0c0f4c0dde3e93c16f2aaa764a35013a4c56a30d4b01cd63de09b816254f48b4` |
| `seen-off.exe` (bare Windows exe) | 12,799,488 | `d51a7c1f4bd3b5c7bb09df31d6f375e25cfcb22c13296b4caa20162bfc64612c` |

The AppImage was smoke-tested under Xvfb at 1280x800 with `SteamDeck=1` (`shots/d10-01-appimage-xvfb.png` title screen, `shots/d10-05-appimage-after-start.png` in-game menu, `shots/d10-04-appimage-album.png` Postcard Album showing the painted Prom front). No Mac build. Windows and Steam Deck were not run on real hardware. Missing GStreamer audio elements on the box log the same warnings as m3c; the UI still ran.

**Desktop build `dist/m3e/`** (built 28 Nov 2026, 10:58-11:00 Europe/London, from commit `6bf73d39`, which adds the Ferret as a playable fourth hero, his Cast/Catch starter deck, The One That Didn't Get Away, and everything in m3d; copies with `SHA256SUMS` in `/workspace/seen-off-steam/builds-m3e/`). Also at `/workspace/seen-off-steam/dist/m3e/` and `desktop/dist/m3e/` (gitignored). Not uploaded or published anywhere.

| File | SHA256 |
|---|---|
| `Seen Off_0.1.0_amd64.AppImage` | `924af749ee20c6fc78c81adacc2ee531ac192b31be111db44b992198d2a29501` |
| `Seen Off_0.1.0_amd64.deb` | `5fa3c1c3151660bcb34fa8e2f6abf934b7e8dfb6f2e5a378e0e62b324f0884a5` |
| `Seen Off_0.1.0_x64-setup.exe` | `a5494552e5b5966d8516d9715f924511b0a22ed090ac724a90050c98d1d1614f` |
| `seen-off.exe` | `211be6bc496482ea6737f91cfd89085f077873f89eecc20ecb7dc876f6ed12a1` |

The AppImage was smoke-tested under Xvfb at 1280x800 with `SteamDeck=1` (`shots/d11-05-appimage-xvfb.png` title screen, three Quills only on a first-run save, `shots/d11-06-appimage-menu.png` in-game menu). No Mac build. Windows and Steam Deck were not run on real hardware. The box needed the documented GTK/WebKit and llvm-rc packages reinstalled before this rebuild.

**Desktop build `dist/m3f/`** (built 28 Nov 2026, 11:26-11:28 Europe/London, from commit `7dd78240`, which adds painted art for the Ferret's fifteen reward cards and a Plus One redo with a see-through double of Kenneth, plus everything in m3e; copies with `SHA256SUMS` in `/workspace/seen-off-steam/builds-m3f/`). Also at `/workspace/seen-off-steam/dist/m3f/` and `desktop/dist/m3f/` (gitignored). Not uploaded or published anywhere.

| File | SHA256 |
|---|---|
| `Seen Off_0.1.0_amd64.AppImage` | `43e0914f7cc10250732f017bf6121425ffda719daf691e4e3d16732c516c174a` |
| `Seen Off_0.1.0_amd64.deb` | `48c537e071937092b53c1cece1d564bf5cb00b5ed31eccc56e7161be1d8da4a5` |
| `Seen Off_0.1.0_x64-setup.exe` | `20299ff287193736f9237f88de67980b7ece2fd897a7d0acaf66579b00c1400d` |
| `seen-off.exe` | `b9092bec8116a563e945060cae7b7b82d0a4dcd9ed040e8c759327277cbb98a4` |

The AppImage was smoke-tested under Xvfb at 1280x800 with `SteamDeck=1` after clearing the leftover box save (`shots/d12-06-appimage-xvfb.png` first-run picker, three Quills only, no Carry on as Terry, `shots/d12-08-appimage-menu.png` menu showing Carry On). No Mac build. Windows and Steam Deck were not run on real hardware.


**Enemy drawings (no AI):** the PLACEHOLDER stand-ups are replaced by canvas ink drawings in the same `ART` style as the pier
enemies, so nothing here is an AI image and nothing needs adding to the AI content list. Done: Beach (Sandcastle, Jellyfish, Windbreak,
Shore Crab, the Donkey, the Crocodile in a striped puppet booth with his string of sausages), Rock Shop (Stick of Rock, Chattering Teeth,
Fudge Tray, Sugar Dummy, the Rock Boiler, the Stick That Says BLACKPOOL, Half a Stick; the lettering is drawn by the game's own font,
so it is never garbled), Pleasure Park (the height sign, Dodgem, Ghost Train Skeleton, Log Flume, Ride Photo Kiosk, Old Rattler, all
generic, no real ride names or brands), the Tower (Ballroom Couple, Lift Attendant, Circus Clown, the Ringmaster, the Mighty Organ,
which still sinks into its ORGAN PIT and rises on Rise), the Chippy (Battered Sausage, Mushy Peas, Curry Sauce, the Queue, Pickled Onion,
the Fryer, the Woman Behind the Counter) and the Lights (Faulty Bulb that flickers, Lit-up Tableau, Coach Party, Moth, the Lit-up Tram,
A Man Off the Telly, drawn as a walking telly with a made-up cartoon presenter on screen, not anyone real). All 35 are done; `ART.standee`
stays only as the fallback. Drawing source per place is kept in `/workspace/seen-off-steam/helpers/art-*.js`. Screenshots:
`shots/d5-03-enemies-*.png`. Test: `m2d … enemies have real drawings` (`window.__SO.ART` exposed for the test only).

**Daily Rules (27–28 Nov 2026):** each Daily Run now has one Daily Rule, picked from the date alone (same for everyone), shown on the
Daily Run button's tooltip, on the cat screen and in the Day Out Report. Six rules, from the v1 plan's list plus *Bank Holiday Crowds* and
*Wakes Week*: **Sea Fret** (everyone starts every fight Soggy, you included), **Everything on Account** (every enemy starts with 5 Invoice; you
start with no Scrumplings), **Two Cats** (you start with two familiars: the one you pick plus the next cat offered), **Seagull Day** (every ordinary
fight gets a Seagull if there is room, max four enemies), **Bank Holiday Crowds** (every ordinary fight gets one more of its first enemy if there is
room) and **Wakes Week** (every shop is a quarter cheaper). Rules only touch Daily Runs; normal days out are unchanged. Left out from the v1
list: *Tide's Out* and *Half-Day Closing* (they need map changes). Screenshot: `shots/d5-04-daily-rule.png`. Tests: two new `m2d` checks.

**Arcades & Bingo (28 Nov 2026):** this place now has its own crowd (no more “Coming soon” stand-ins). Enemies: Tuppenny Falls (drops 2 Scrumplings whenever you hit it), the Fruit Machine (Spin deals 2, 8 or a 24 jackpot), the Change Machine (Short Change steals 10 Scrumplings), Dabbers in pairs, the Claw (Grab takes a card from your hand and gives it back when the Claw is seen off) and the Bingo Caller (traditional calls only: Kelly's Eye, Legs Eleven, Two Little Ducks, Clickety Click; at half health he shouts HOUSE!, gains 25 Block, and later moves hit harder). Event: The Penny Falls (push your luck up to three times: 15, then 30, then 60, with a 1 in 3 chance of losing the tray). Canvas ink drawings, no AI. Screenshots: `shots/d6-01-arcades-foes.png`, `shots/d6-01-arcades-boss.png`.

**The Winter Gardens (28 Nov 2026):** its own crowd, no “Coming soon” stand-ins. Enemies: Conference Delegate (Point of Order adds Form 27B), Darts Fan in Fancy Dress (a banana; One Hundred and Eighty! once a fight), Mirror Ball, Raffle Tickets in fours, the Walk-On Music (Single Twenty below Encore 5, Treble Twenty 20×3 at Encore 5+) and the Keynote Speaker (Next Slide adds a **Handout** clutter card — unplayable, fleeting; painted art done 28 Nov, see below; Any Questions? 2 Soggy and 2 Flustered; Overrunning 12×2 and an extra turn). Event: The Raffle (25 Scrumplings for a keepsake, a brew or a Mislaid Sock, or ask what third prize is: a hamper, heal 5). Canvas ink drawings, no AI. No ballroom trade marks. Screenshots: `shots/d6-02-winter-foes.png`, `shots/d6-02-winter-boss.png`.

**Boss-health pass (28 Nov 2026), first cut:** a 24-run playtest (sticks 14, new places, all three Quills, all wins) on the beach→park→chippy→lights route showed the later bosses on the easy side, as the M2 notes said. The Woman Behind the Counter (was 160–168, plan 190) is now **188–196**; A Man Off the Telly (was 208–216, plan 200, but the bot often finished with 40–60 health) is now **236–244**; Old Rattler (was 132–138) is now **146–154**. The Crocodile (126–132) was left alone: it is still the hard early boss (bot end health down to 3). The Rock Shop and Tower bosses were not in that sample (the bot preferred the first unlocked new place each stage). Bingo Caller and Keynote Speaker are new and untested. A second pass should include those four.

**Boss-health pass (28 Nov 2026), second cut:** a 24-run playtest forced onto rock→tower→arcades→winter (sticks 14, all three Quills, 16 wins) covered the four bosses the first sample missed. The Mighty Organ (was 136–142) is now **154–162**: the bot always won and usually finished on 30–68 health, losing only 4–30. The Stick That Says BLACKPOOL (136–144) was left alone: it is the hard early boss on this route (six losses, end health often in single digits). The Bingo Caller (196–204) and the Keynote Speaker (206–214) were also left alone: every bot that reached them won, but several finishes were down to single-digit health. The playtest driver now takes `PLACES=ids` to pick a route.

**The B&B (28 Nov 2026):** its own crowd, no “Coming soon” stand-ins. Enemies: the House Rules (posts a **No Hot Food in Rooms** clutter card — unplayable, painted art done 28 Nov, see below), the Shower (alternates Scald and Freeze), Squeaky Floorboard, the Other Guests (a pal pair) and the Landlady. Each turn the Landlady announces a house rule that applies until her next turn: **No more than three cards** (the fourth card costs 1 more), **Lights out at eleven** (draw 1 fewer), or **Shoes off** (you lose your Block at the end of your turn). Event: The Breakfast Room (Full English heals 25; Continental draws 2 extra on the next fight’s first turn; asking for a later breakfast leaves you Flustered for the rest of the stage). Canvas ink drawings, no AI. Screenshots: `shots/d6-03-bnb-foes.png`, `shots/d6-03-bnb-boss.png`.

**The Old Pier (28 Nov 2026):** its own crowd, no “Coming soon” stand-ins. Enemies: Sea Fret (adds Wet Sand clutter), Rusty Bolts (in threes and fours, stamped LOOSE or MISSING in the game font), Condemned Notice (adds a Condemned card: lose 3 Block at the end of your turn if it is in your hand), Spider Crab, the Shelter Ladies Mavis and Doris (a pal pair), and the Fortune-Telling Machine (its plan shows “?” until it acts). Elites: the End-of-Pier Comic (adds Groan: fleeting, 1 Flustered when drawn) and the Ventriloquist with Lord Timothy (a pal pair). Boss: the Parliament of Gulls — the King of the Seagulls, Returned, with a bandaged wing, and two Backbenchers; at half health he shouts **Order! Order!**, gains 20 Block, and both Backbenchers return on 20 health. Event: The Fortune-Telling Machine. New clutter (Groan, Condemned, Wet Sand) has painted art as of 28 Nov, see below. Canvas ink drawings, no AI, no real comedians or fortune-machine brands. Screenshots: `shots/d6-04-oldpier-*.png`.

### Where to pick up next time

State at end of 27 Nov 2026 (branch `archie/seen-off-dayout`, working copy `/workspace/seen-off-steam/desktop`, local git mirrors the pushed commits):

1. **Done:** M2 complete (builds in `/workspace/seen-off-steam/dist/m2/`, not rebuilt since). M3 so far, web only, no desktop rebuild:
   Dexter recoloured; the shared inked card frame (owner tint, larger art window, owner type line, Libre Caslon rules text, rarity crest);
   painted art on all 79 cards (finished 27 Nov 2026): the six cat cards, all nine hero starter cards, every base-pool hero card
   (22 commons, 16 uncommons, 7 rares and Scribble), all twelve milestone-2 unlock cards and the six shared/clutter cards.
   Kenneth's sprite redrawn from his portrait, his UI colour is near-black `#1d1c24`, and his hero-pick blurb says he has been drawn.
   Screenshots: `shots/d1-*`, `d2-*`, `d3-*.png`. Local helper scripts (push, screenshots) live in `/workspace/seen-off-steam/helpers/`
   because `/tmp` is wiped when the box is refreshed.
2. **Tests:** `node tests/verify.js` (about 7 min; all passing on 28 Nov: 248 checks, or two fewer when the keyboard bot loses its random first fight and the two Esc-menu checks are skipped; `ONLY=m2d` etc. runs one section). The autoplay driver takes the
   last event option if the first one refuses. Playtest: `RUNS=6 node tools/playtest.js out.json`.
3. **Card art is complete** (plus the Handout card, 28 Nov). Desktop rebuild `dist/m3b/` is done (see above). A later visual pass at 1920x1080 and in the deck viewer is still worth doing. Quality bar if anything is redone: reject any image
   with garbled lettering (prompts ask for a wordless image; signs, papers and cards stay blank; a stray background sign may be
   painted out by hand and logged). Unlock cards are locked at the start of a run, so screenshot them with
   `HAND=... node ../helpers/cardshot.js`, which sets a debug hand in the page without changing the game. Clutter cards are
   unplayable, so in a hand the game shows them desaturated (existing `.cd.no` style); `shots/d4-03b-shared-art.png` shows their art
   in full colour. Overviews for Ben: `shots/d3-08-hand-overview.png`, `shots/d4-04-overview.png`.
4. **Milestone 3 (from the M2 proposal), finished 28 Nov 2026:** legendary cards for the three existing Quills (Bankrupt, Magnum Opus, The Cloud Provides). The Ferret and his legendary followed later the same day, see below. Painted clutter art, enemy drawings, all ten new places, Daily Rules, both boss-health passes and the `dist/m3b/` desktop rebuild were already done, 27-28 Nov, see above. First pass: Counter 188-196, the Man Off the Telly 236-244, Old Rattler 146-154; the Crocodile left as the hard early boss. Second pass: the Mighty Organ 154-162; the Rock Shop stick, the Bingo Caller and the Keynote Speaker left alone. A `dist/m3c/` rebuild follows this change.
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
* **Rarity crest:** a small shield at the bottom centre (grey common, blue uncommon, gold rare) and a foil star for legendary, with a slower gold sheen on the frame.
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

### Most-offered reward cards (24 Nov 2026)

`rollCards()` picks a rarity per slot (58% common, 34% uncommon, 8% rare), then a card uniformly from that hero's pool, so every
base-pool common is offered equally and more often than anything else (the milestone-2 unlock commons only appear after their stick).
From Teatime onwards (`RUN.part >= 2`) there is also a 1% chance a slot is the hero's unlocked legendary, if it is not already in the deck. Boss chests guarantee that legendary when it is unlocked and not already held.
Two base commons per hero were painted, one attack and one skill: **Reggie** Kindly Remit, Fact Check; **Terry** Cross-Hatch, Rough Draft;
**Kenneth** Unexplained Arrival, Changes the Subject. Likeness from `../refs/reggie-portrait.jpg`, `terry-portrait.jpg`,
`kenneth-portrait.jpg`; style from the existing starter-card art and the Spyro card. Generic prom, unnamed tower, no trade marks.
One generation each, no retries. Full images `../mockups/card-kindly-remit.jpg`, `card-fact-check.jpg`, `card-cross-hatch.jpg`,
`card-rough-draft.jpg`, `card-unexplained-arrival.jpg`, `card-changes-the-subject.jpg`; crops in `web/cards/` (`remit`, `factcheck`,
`crosshatch`, `roughdraft`, `arrival`, `subject`).

### Second batch of base commons (24 Nov 2026)

Same method, two more base-pool commons per hero: **Reggie** Sales Patter, Line Edit; **Terry** Full Colour, Big Bold Title;
**Kenneth** Nobody Asked, Says He Knows Terry (Kenneth with Terry, both from their portraits). One generation each, no retries.
Generic prom, unnamed tower, no trade marks (Big Bold Title's block is a plain giant ink letter shape, no word). Full images
`../mockups/card-sales-patter.jpg`, `card-line-edit.jpg`, `card-full-colour.jpg`, `card-big-bold-title.jpg`, `card-nobody-asked.jpg`,
`card-says-he-knows-terry.jpg`; crops in `web/cards/` (`patter`, `lineedit`, `fullcolour`, `bigtitle`, `nobody`, `knowsterry`).
Same chunk: Kenneth's sprite cap redrawn as a flat cap (low flat crown, short peak) and his quill as a thin cream feather with a nib.

### Last ten base commons (24 Nov 2026)

Same method: **Reggie** Extra Tenner for the Y, Brave Face, Proofread; **Terry** Wraparound Cover, Ink Wash, Quick Sketch, Reference Photo;
**Kenneth** Friend of Reggie's (Kenneth with Reggie, both from their portraits), Cousin Once Removed, Turns Up Uninvited.
One generation each, with two retries: Extra Tenner (first try showed real-looking banknotes; redone with plain envelopes and slips)
and Cousin Once Removed (first try missed the decoy). Generic prom/beach, unnamed tower, no trade marks. Full images
`../mockups/card-extra-tenner.jpg`, `card-brave-face.jpg`, `card-proofread.jpg`, `card-wraparound-cover.jpg`, `card-ink-wash.jpg`,
`card-quick-sketch.jpg`, `card-reference-photo.jpg`, `card-friend-of-reggies.jpg`, `card-cousin-once-removed.jpg`,
`card-turns-up-uninvited.jpg`; crops in `web/cards/` (`tenner`, `braveface`, `proofread`, `wraparound`, `inkwash`, `quick`, `refphoto`,
`friendreg`, `cousin`, `uninvited`). Every base-pool common now has painted art.

### Kenneth's colour is black (24 Nov 2026, Ben's decision)

Kenneth's UI colour moved from purple `#7a3ff0` to near-black `#1d1c24` (`--kenneth` / `COL.kenneth`): card frames (`.cd.h-k`, with a light
inner keyline so the frame reads on dark backgrounds), the card owner badge, the HUD name chip (white edge), the hero-pick button and its
portrait disc (tint `#dcdbe2`), the map token and his ink-blot hit particles (`HCOL`/`HTINT`/`HINK`). Purple stays for general effects
(statuses, elites, Air of Mystery) and Tilly's card. His title blurb no longer says nobody has drawn him.

### First six uncommons (25 Nov 2026)

Uncommons are offered the same way as commons (34% of reward slots, then uniform within the hero's base uncommons; the milestone-2
unlock uncommons only after their stick), so every base uncommon is equally "most seen". Picked one attack and one other per hero:
**Reggie** Final Demand, Itemised Bill; **Terry** Splatter Storm, Two-Page Spread; **Kenneth** Wrong House, Coin Toss. Likeness from
`../refs/*-portrait.jpg`, style from the existing card art. One generation each, no retries. Generic prom and plain beach huts, unnamed
tower, no trade marks, no banknotes (Coin Toss shows a blank gold token). Full images `../mockups/card-final-demand.jpg`,
`card-itemised-bill.jpg`, `card-splatter-storm.jpg`, `card-two-page-spread.jpg`, `card-wrong-house.jpg`, `card-coin-toss.jpg`;
crops in `web/cards/` (`finaldemand`, `itemised`, `storm`, `layout`, `wronghouse`, `cointoss`).

### Second six uncommons (25 Nov 2026)

Same method: **Reggie** A Nice Little Earner, Rounding Up; **Terry** Day One Purchase, Theatrical Outrage; **Kenneth** Long Story,
Mysterious Parcel. One generation each; one retry (Theatrical Outrage: the first try had three anonymous human onlookers in the
background, redone with seagulls only so nobody could read as a real person). Blank gold tokens, no banknotes or real coins; plain
parcels, no logos; unnamed tower. Full images `../mockups/card-nice-little-earner.jpg`, `card-rounding-up.jpg`, `card-day-one-purchase.jpg`,
`card-theatrical-outrage.jpg`, `card-long-story.jpg`, `card-mysterious-parcel.jpg`; crops in `web/cards/` (`earner`, `rounding`, `dayone`,
`outrage`, `longstory`, `parcel`).

### Last four uncommons, two rares, and Mysterious Parcel redone (25 Nov 2026)

Same method: **Reggie** My Old Son, Wounded Dignity; **Terry** Steady Hand and the rare Masterpiece; **Kenneth** Left Without Saying
Goodbye and the rare Air of Mystery (rares went to Terry and Kenneth so each hero got two cards this chunk). One generation each, no
retries; every prompt asked for no lettering at all, and each image was checked for stray text. My Old Son's younger robot is an
invented mini-Reggie, not a real person. **Mysterious Parcel** was regenerated once because the first version had garbled lettering on
the tower; the new image came back with a blank billboard but still had a small garbled word band on the tower's top platform, so that
band was painted over by hand (flat fill in the sign's colour, slight blur) to leave a blank sign. The rejected first version is kept as
`../mockups/card-mysterious-parcel-v1-rejected.jpg` (not shipped). Full images `../mockups/card-my-old-son.jpg`, `card-wounded-dignity.jpg`,
`card-steady-hand.jpg`, `card-left-without-saying-goodbye.jpg`, `card-masterpiece.jpg`, `card-air-of-mystery.jpg`,
`card-mysterious-parcel.jpg` (v2); crops in `web/cards/` (`myoldson`, `dignity`, `steady`, `goodbye`, `masterpiece`, `mystery`, `parcel`).

### Last base-pool rares and Scribble (25 Nov 2026)

Same method: **Reggie** Compound Interest, Cartel Pricing; **Terry** Frame Rate, Scribble; **Kenneth** Open Invitation, Plus One.
One generation each; two retries, both for lettering: Compound Interest's first try painted the card title across the sky and put
scribbly writing on its papers and a word on a tower, and Open Invitation's first try had playing cards with letter indices (A, Q and
a garbled M). Both were redone as wordless images (blank papers; sealed envelopes with plain wax seals). Every image was checked
zoomed-in for stray text; Compound Interest's papers carry only faint ruled lines. Papers are blank slips, never banknotes. The rejected
first tries are kept as `../mockups/card-compound-interest-v1-rejected.jpg` and `card-open-invitation-v1-rejected.jpg` (not shipped).
Full images `../mockups/card-compound-interest.jpg`, `card-cartel-pricing.jpg`, `card-frame-rate.jpg`, `card-scribble.jpg`,
`card-open-invitation.jpg`, `card-plus-one.jpg`; crops in `web/cards/` (`compound`, `cartel`, `framerate`, `scribble`, `openinv`, `plusone`).

### First six milestone-2 unlock cards (27 Nov 2026)

Same method: **Reggie** The Bailiffs, Late Payment Charge; **Terry** Bleed Edge, Spot Colour; **Kenneth** Reply All, Delegated.
One generation each, no retries. Every prompt asked for a wordless image and each one was checked zoomed-in: The Bailiffs' long
paper slip carries only squiggle lines, Late Payment Charge's pocket watch has tick marks and no numerals, and every other paper and
card is blank. The Bailiffs is Reggie knocking three times on a beach-hut door: no uniforms, badges, crests or official branding, and
no money anywhere in the six. Full images `../mockups/card-the-bailiffs.jpg`, `card-late-payment-charge.jpg`, `card-bleed-edge.jpg`,
`card-spot-colour.jpg`, `card-reply-all.jpg`, `card-delegated.jpg`; crops in `web/cards/` (`bailiffs`, `latepay`, `bleed`, `spot`,
`replyall`, `delegated`).

### Last six milestone-2 unlock cards (27 Nov 2026)

Same method: **Reggie** Cash in Hand, VAT Inclusive; **Terry** Letters to the Editor, Centre Spread; **Kenneth** Minutes of the
Meeting, Nobody Minuted It. One generation each plus three retries: Letters to the Editor's first try had pseudo-handwriting with
letter-like shapes (redone with completely blank paper and envelopes); Centre Spread's first try had tiny scenes on its pages that
could read as little human figures (redone with abstract paint only); Nobody Minuted It's first try had a dark cloaked silhouette on
the flying card (redone with a plain glowing card). Centre Spread's retry came back with a garbled word on a distant tower's sign,
half hidden by the storm cloud; with the retry used up, the dark letter strokes were painted out by hand in the sign's colour, the
same fix as Mysterious Parcel, leaving a blank sign. Money and paper: Cash in Hand shows plain featureless gold tokens, VAT
Inclusive a stack of plain envelopes; no banknotes, real coins, currency signs, HMRC or other official branding; Minutes' notepad
has squiggle lines only. Rejected tries are kept as `../mockups/card-letters-to-the-editor-v1-rejected.jpg`,
`card-centre-spread-v1-rejected.jpg`, `card-nobody-minuted-it-v1-rejected.jpg` and `card-centre-spread-v2-unretouched.jpg` (none
shipped). Full images `../mockups/card-cash-in-hand.jpg`, `card-vat-inclusive.jpg`, `card-letters-to-the-editor.jpg`,
`card-centre-spread.jpg` (retouched), `card-minutes-of-the-meeting.jpg`, `card-nobody-minuted-it.jpg`; crops in `web/cards/`
(`cashhand`, `vat`, `letters`, `spread`, `minutes`, `nominute`).

### The six shared/clutter cards (27 Nov 2026)

These belong to no hero, so they use a house style: a single prop on the prom with no hero (and no person) in shot, in the same
ink-and-splatter painted style, with the existing neutral grey frame (`--own:#6b7183`). Style reference only (Terry's Ink Blot
card); no portraits needed since no hero appears. **Form 27B** a stack of forms under a blank rubber stamp, sheets blowing away;
**Mislaid Sock** one stripy sock by a puddle, a suspicious seagull; **Parking Ticket** a plain yellow sleeve with a squiggle-line
slip on a wooden handcart's seat, a smug seagull (no road signs, no council or official branding); **Writer's Block** a typewriter
turned to stone, blank keys, crumpled blank paper; **Unflattering Photo** an instant photo of a seagull caught mid-squawk (no
people); **Catchphrase** an empty end-of-pier stage, a microphone and an empty speech bubble, unimpressed seagulls. One generation
each; one retry: Unflattering Photo's first try came out as a near-photographic 3D-looking seagull that did not match the painted
style, redone in the inked style. All papers checked zoomed-in: squiggle lines only. Rejected try kept as
`../mockups/card-unflattering-photo-v1-rejected.jpg` (not shipped). Full images `../mockups/card-form-27b.jpg`,
`card-mislaid-sock.jpg`, `card-parking-ticket.jpg`, `card-writers-block.jpg`, `card-unflattering-photo.jpg`, `card-catchphrase.jpg`;
crops in `web/cards/` (`junk`, `sock`, `ticket`, `wblock`, `photo`, `catchp`).

**Steam Content Survey, pre-generated AI content (definite; keep this list up to date):**
- `web/cards/redpen.jpg`, `web/cards/cough.jpg`, `web/cards/invoice.jpg`: AI-generated (23 Nov 2026) from Reggie's portrait and our card style.
- `web/cards/inkblot.jpg`, `web/cards/sketch.jpg`, `web/cards/splatter.jpg`: AI-generated (23 Nov 2026) from Terry's portrait and our card style.
- `web/cards/handshake.jpg`, `web/cards/nod.jpg`, `web/cards/whoinv.jpg`: AI-generated (24 Nov 2026) from Kenneth's portrait (sent by Ben) and our card style.
- `web/cards/remit.jpg`, `factcheck.jpg`, `crosshatch.jpg`, `roughdraft.jpg`, `arrival.jpg`, `subject.jpg`: AI-generated (24 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/patter.jpg`, `lineedit.jpg`, `fullcolour.jpg`, `bigtitle.jpg`, `nobody.jpg`, `knowsterry.jpg`: AI-generated (24 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/tenner.jpg`, `braveface.jpg`, `proofread.jpg`, `wraparound.jpg`, `inkwash.jpg`, `quick.jpg`, `refphoto.jpg`, `friendreg.jpg`, `cousin.jpg`, `uninvited.jpg`: AI-generated (24 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/finaldemand.jpg`, `itemised.jpg`, `storm.jpg`, `layout.jpg`, `wronghouse.jpg`, `cointoss.jpg`: AI-generated (25 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/earner.jpg`, `rounding.jpg`, `dayone.jpg`, `outrage.jpg`, `longstory.jpg`, `parcel.jpg`: AI-generated (25 Nov 2026) from the three heroes' portraits and our card style. (`parcel.jpg` regenerated the same day, sign retouched blank by hand.)
- `web/cards/myoldson.jpg`, `dignity.jpg`, `steady.jpg`, `goodbye.jpg`, `masterpiece.jpg`, `mystery.jpg`: AI-generated (25 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/compound.jpg`, `cartel.jpg`, `framerate.jpg`, `scribble.jpg`, `openinv.jpg`, `plusone.jpg`: AI-generated (25 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/bailiffs.jpg`, `latepay.jpg`, `bleed.jpg`, `spot.jpg`, `replyall.jpg`, `delegated.jpg`: AI-generated (27 Nov 2026) from the three heroes' portraits and our card style.
- `web/cards/cashhand.jpg`, `vat.jpg`, `letters.jpg`, `spread.jpg`, `minutes.jpg`, `nominute.jpg`: AI-generated (27 Nov 2026) from the three heroes' portraits and our card style (`spread.jpg`'s background sign retouched blank by hand).
- `web/cards/junk.jpg`, `sock.jpg`, `ticket.jpg`, `wblock.jpg`, `photo.jpg`, `catchp.jpg`: AI-generated (27 Nov 2026) prop still-lifes in our card style (no heroes or people depicted).
- `web/cards/handout.jpg`: AI-generated (28 Nov 2026) prop still-life in our card style (blank conference leaflets, no heroes, people, lettering or money). One generation, no retry. Screenshots: `shots/d6-05-handout.jpg`, `shots/d6-05-handout-card.png`, `shots/d6-05-handout-hand.png`.
- `web/cards/nohot.jpg`, `groan.jpg`, `condemned.jpg`, `wetsand.jpg`: AI-generated (28 Nov 2026) prop still-lifes in our card style (No Hot Food in Rooms, Groan, Condemned, Wet Sand; no heroes, people, lettering or money). One generation each, no retry. Screenshots: `shots/d8-01-*.jpg`, `shots/d8-02-clutter-hand.png`, `shots/d8-02-clutter-cards.png`.
- `web/cards/bankrupt.jpg`, `magnum.jpg`, `cloud.jpg`: AI-generated (28 Nov 2026) from the three heroes' portraits and our card style (Bankrupt, Magnum Opus, The Cloud Provides). One generation each, no retry. Wordless papers and cards; no money. Screenshots: `shots/d9-01-*.jpg`, `shots/d9-02-legend-hand.png`.
- `web/heroes/ferret.jpg`: AI-generated bust (28 Nov 2026) from Terry's illustrated portrait of the Ferret on williamgeorgeworks.co.uk (`portraits/ferret.jpg`, copied to the box refs as `refs/ferret-portrait.jpg`). Wordless (the reference's "FERRET THE MAN WITH THE PLAN" lettering is not in the game image). One generation, no retry. Used on the pick screen and as the in-fight token.
- `web/cards/flick.jpg`, `bivvy.jpg`, `castout.jpg`, `didnt.jpg`: AI-generated (28 Nov 2026) from the same portrait and our card style (Flick, Bivvy, Cast Out, and the legendary The One That Didn't Get Away). One generation each, no retry. Wordless; no logos, no other people (a seagull is in Flick).
- `web/cards/six.jpg`, `hairrig.jpg`, `bite.jpg`, `feeder.jpg`, `bait.jpg`, `unhook.jpg`, `wrongpeg.jpg`, `khandle.jpg`, `nobite.jpg`, `twentyp.jpg`, `gotaway.jpg`, `keepnet.jpg`, `greatmorn.jpg`, `nightfish.jpg`, `weighin.jpg`: AI-generated (28 Nov 2026) from the same portrait and our card style, completing the Ferret's fifteen reward cards. One generation each, except Not a Bite (one retry: the first attempt had a bent rod, as if there was a bite) and Weigh-In (one retry: the first attempt had numerals on the scale dial). Wordless; the shipping Weigh-In scale is a blank disc with a needle only. No logos, no other people.
- `web/cards/plusone.jpg`: repainted 28 Nov 2026 from Kenneth's portrait. The first version (kept as `mockups/plusone-v1-rejected.jpg`) had two solid Kennys. The shipping image has one solid Kenneth in front and a faint, translucent double behind, with the promenade showing through. One generation, no retry. Wordless.

- `web/postcards/prom.jpg`, `beach.jpg`, `rock.jpg`, `south.jpg`, `park.jpg`, `tower.jpg`, `central.jpg`, `chippy.jpg`, `arcades.jpg`, `north.jpg`, `lights.jpg`, `winter.jpg`, `bnb.jpg`, `oldpier.jpg`: AI-generated (28 Nov 2026) painted postcard fronts in our card style, one per place. Wordless paintings (no titles, signs, ride names or trade marks); "Greetings from" and the place name are real HTML/CSS text in the album. One generation each; park, arcades, South Pier and North Pier each had one retry (garbled lettering or tiny background figures). South Pier mid-ground figures on the retry were further softened by hand and logged. No people in the other thirteen. The Tower and North Pier lanterns are blank or a plain glow, with no lettering.
- `web/cats/*.jpg` (all six cat signature cards): crops of the cat card mockups in `../mockups/card-*.jpg`, which **were AI-generated**
  (from the cats' real photos). Declare them as pre-generated AI content.
- The full-size sources of all of the above in `../mockups/`.

### Postcard fronts (28 Nov 2026)

The Postcard Album no longer uses CSS gradient placeholders. Each of the fourteen places has a painted 3:2 front in `web/postcards/{id}.jpg`. Unvisited cards stay striped and say "Not yet visited". Visited cards show the painting, with **Greetings from** and the place name (`The Prom`, `The Tower`, `The Lights`, `The Pleasure Park`, and so on) overlaid as real HTML text in Anton / Permanent Marker, never as letters in the painting. Signs, rock, trams, machines and hanging boards in the paintings are blank. No real attraction branding.

### Legendary cards (28 Nov 2026)

As specified in `content-plan.md`. A new top rarity `rar:'l'`, gold foil frame and a foil-star crest. Three cards for the existing Quills, unlocked on the Rock Meter at sticks #15 (Reggie, **Bankrupt**: X cost, every enemy pays its Invoice X times, Exhaust, upgrade keeps the card), #16 (Terry, **Magnum Opus**: deal 60/80, costs 1 less for every Attack already played this fight, base cost 5) and #17 (Kenneth, **The Cloud Provides**: add 5/7 random cards to hand, each costing 0 and Fleeting). They appear as a 1% chance on card rewards from Teatime onwards, and a boss chest guarantees one if it is unlocked and not already in the deck. The Ferret's legendary, **The One That Didn't Get Away** (deal 10 (14) for every Catch this fight, Exhaust), is unlocked on stick #18, with the same 1% Teatime+ chance and boss-chest guarantee.

### The Ferret (28 Nov 2026)

The Ferret is a playable fourth hero, unlocked after any win or once `DAY.sticks >= 16` (a count check, so stick #16 itself stays Terry's legendary). He is hidden on the picker until then, so a first run still shows the three Quills. The Daily Run still picks from `['r','t','k']` so date-seeds stay the same. 70 health, green `#14a84b`, title "The Gaffer (Not Technically a Quill)". His likeness is Terry's illustrated portrait from the site, not a photograph.

Mechanic: **Cast** queues an effect that lands at the start of the next turn (and is already the bigger number printed on the card). **Catch** counts lines reeled in this fight (a green fish-shaped pill). Hair Rig's "if you have a line out" means a Cast is still queued. Night Fishing makes Cast cards land now and next turn. If you are playing as the Ferret, the fishing event is titled "Kenneth is fishing".

Starter deck: 4x Flick, 4x Bivvy, 1x Cast Out. His reward pool is the rest of the section-4 list in `content-plan.md` (18 unique cards plus the legendary).

### Painted card art

Every shipping card now has painted art, including the Ferret's full set (starters, fifteen reward cards and his legendary, finished 28 Nov 2026) and the Plus One redo of the same day. All painted card art is pre-generated AI content (see the list above).

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
`dpkg-dev patchelf file` (linuxdeploy's GTK plugin calls `dpkg-architecture`),
Rust via rustup (stable), Node 18+, Python 3. For the Windows cross-build: `nsis lld llvm clang` (`llvm` provides `llvm-rc`, which tauri-winres needs for the exe icon/version), `rustup target add x86_64-pc-windows-msvc`,
`cargo install --locked cargo-xwin`, and `clang-cl` on PATH (e.g. `ln -s clang-cl-19 /usr/bin/clang-cl`). cargo-xwin downloads the MSVC CRT/SDK
on first run, which means accepting Microsoft's licence for those files.

```bash
npm ci                      # Tauri CLI + playwright-core (tests)
./build-all.sh              # Windows NSIS installer (cross) + Linux .deb + .AppImage
# or one at a time:
npx tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis
APPIMAGE_EXTRACT_AND_RUN=1 NO_STRIP=true npx tauri build --bundles deb,appimage
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
