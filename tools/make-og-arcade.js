#!/usr/bin/env node
/* Builds og-arcade.jpg, the 1200 by 630 picture that appears when the arcade page is shared.
   Run it by hand whenever a game is added: change COUNT, put the four games you want in TILES, then

     node tools/make-og-arcade.js            (from the repo root; writes og-arcade.jpg)

   and bump the ?v= on the two og-arcade.jpg lines in the head of arcade.html, so that sites which have
   already fetched the old picture fetch the new one.

   Needs the "sharp" package and the Poppins font installed on the machine. Neither is in this repo,
   which is why this is not part of any workflow. */
"use strict";
const path = require("path");
let sharp; try { sharp = require("sharp"); } catch (e) { console.error("This needs the sharp package: npm install sharp, or set NODE_PATH to wherever it lives."); process.exit(1); }

const COUNT = "Nine";                       // how many games the arcade page says it has
const LINES = [COUNT + " free games, daily challenges", "and a hall of fame."];
/* Four thumbnails, the newest games on the top row. Each tile shows a window cut from the 800 by 500
   thumbnail: x and y are its top left corner and w its width (its height follows, about 1.06 times w).
   Left alone, the window is the full height of the thumbnail and 471 wide. Choose it so the cats are in. */
const TILES = [
  { file: "thumb-kitty-grand-prix.jpg", x: 318 },
  { file: "thumb-slay-the-pier.jpg", x: 0 },
  { file: "thumb-grand-theft-kitty.jpg", x: 40, y: 75, w: 400 },
  { file: "thumb-ferrets-ditch.jpg", x: 40 }
];

const W = 1200, H = 630, BAR = 14, NAVY = "#130a35", LIME = "#b6ff3c", LILAC = "#eae3ff", TEXT = "#e9e0fb";
const TW = 252, TH = 267, EDGE = 4, SPOTS = [[656, 46], [913, 46], [656, 318], [913, 318]];
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${NAVY}"/>
<rect width="${W}" height="${BAR}" fill="${LIME}"/><rect y="${H - BAR}" width="${W}" height="${BAR}" fill="${LIME}"/>
${SPOTS.map(p => `<rect x="${p[0]}" y="${p[1]}" width="${TW}" height="${TH}" fill="${LILAC}"/>`).join("")}
<text x="49" y="188" font-family="Poppins" font-weight="700" font-size="64" fill="${TEXT}">The arcade</text>
${LINES.map((l, i) => `<text x="48" y="${247 + 42 * i}" font-family="Poppins" font-weight="500" font-size="30" fill="${LIME}">${esc(l)}</text>`).join("")}
<text x="48" y="588" font-family="Poppins" font-weight="700" font-size="26" fill="${TEXT}">williamgeorgeworks.co.uk</text>
</svg>`;

(async () => {
  const root = path.join(__dirname, "..");
  const iw = TW - 2 * EDGE, ih = TH - 2 * EDGE;
  const tiles = await Promise.all(TILES.map(async (t, i) => {
    const w = t.w || Math.round(500 * iw / ih), h = Math.min(500 - (t.y || 0), Math.round(w * ih / iw));
    return {
      input: await sharp(path.join(root, t.file)).extract({ left: t.x || 0, top: t.y || 0, width: w, height: h }).resize(iw, ih).toBuffer(),
      left: SPOTS[i][0] + EDGE, top: SPOTS[i][1] + EDGE
    };
  }));
  const out = path.join(root, process.argv[2] || "og-arcade.jpg");
  await sharp(Buffer.from(svg)).composite(tiles).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
  console.log("Wrote " + out);
})().catch(e => { console.error(e.message); process.exit(1); });
