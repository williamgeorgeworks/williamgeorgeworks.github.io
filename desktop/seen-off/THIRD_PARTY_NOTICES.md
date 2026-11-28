# Seen Off: third-party notices

Everything in the game (art, music, sound, text) is drawn or generated in code by William George Works,
except the bundled fonts below, the painted card art, the Ferret's pick-screen portrait in `web/heroes/`, and the fourteen painted postcard fronts in `web/postcards/`. The card art is Reggie's, Terry's and Kenneth's starter-, common-, uncommon-, rare-, unlock- and legendary-card art, the Ferret's starter cards (Flick, Bivvy, Cast Out), fifteen reward cards and legendary (The One That Didn't Get Away), and the shared/clutter card images in `web/cards/` including Handout, No Hot Food in Rooms, Groan, Condemned and Wet Sand (AI-generated
pre-release, the hero cards from their portraits, the shared cards as prop still-lifes with no people; the Ferret's portrait, starter cards, fifteen reward cards and legendary 28 Nov 2026 from Terry's illustrated portrait of the Ferret on williamgeorgeworks.co.uk; Plus One repainted 28 Nov 2026 from Kenneth's portrait with a translucent double; Nobody Minuted It, Wrong House, Mysterious Parcel, Catchphrase, Form 27B, Imaginary Invoice and Two-Page Spread repainted 28 Nov 2026 (v2 candidates now shipping, previous images kept as mockups/<id>-v1-rejected.jpg); Bankrupt, Magnum Opus and The Cloud Provides 28 Nov 2026, the four new clutter cards and Handout 28 Nov 2026, previous shared batch 27 Nov 2026; Kenneth's redone 24 Nov 2026 from the portrait Ben supplied). The six cat card images in `web/cats/` are crops of the cat card mockups in `mockups/`, also AI-generated from the
cats' real photos. The postcard fronts (`web/postcards/*.jpg`, one per place, 28 Nov 2026) are AI-generated paintings in the same style; titles are real HTML text, not letters in the image. All of it is pre-generated AI content and must be declared in Steam's Content Survey:

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
