# Seen Off: third-party notices

Everything in the game (art, music, sound, text) is drawn or generated in code by William George Works,
except the bundled fonts below and the painted card art: Reggie's, Terry's and Kenneth's starter-, common-, uncommon-, rare- and unlock-card art in `web/cards/` (AI-generated
pre-release from their portraits, latest batch 27 Nov 2026; Kenneth's redone 24 Nov 2026 from the portrait Ben supplied) and the six cat card images in `web/cats/` (crops of the cat card mockups in `mockups/`, also AI-generated from the
cats' real photos). All of it is pre-generated AI content and must be declared in Steam's Content Survey:

| Font | Files | Licence | Copyright |
|---|---|---|---|
| Anton | `web/fonts/anton-latin.woff2`, `web/fonts/anton-latin-ext.woff2` | SIL Open Font License 1.1 (`OFL-Anton.txt`) | Copyright 2020 The Anton Project Authors (https://github.com/googlefonts/AntonFont) |
| Libre Caslon Text | `web/fonts/libre-caslon-text-latin-400-normal.woff2`, `-700-normal`, `-400-italic` | SIL Open Font License 1.1 (`OFL-LibreCaslonText.txt`) | Copyright 2018 The Libre Caslon Text Project Authors (https://github.com/thundernixon/Libre-Caslon) |
| Permanent Marker | `web/fonts/permanent-marker-latin.woff2` | Apache License 2.0 (`LICENSE-PermanentMarker-Apache-2.0.txt`) | Font Diner |

The woff2 files are the unmodified subsets served by Google Fonts (Anton v27, Permanent Marker v16).
Both licences allow bundling in a commercial game; the licence texts ship in the `licences/` folder of every build.

The desktop wrapper uses Tauri 2 (MIT/Apache-2.0) and its Rust dependencies; on Windows it uses Microsoft Edge WebView2,
on Linux WebKitGTK (LGPL-2.1, dynamically linked / bundled in the AppImage). A full Rust dependency licence list can be
produced before release with `cargo about` or `cargo license` in `src-tauri/`.
