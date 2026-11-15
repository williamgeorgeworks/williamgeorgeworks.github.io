#!/usr/bin/env node
/* Builds news.xml and gaming.xml (RSS 2.0) from the edition files. Run after publishing. */
const fs = require("fs");
const SITE = "https://williamgeorgeworks.co.uk";
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function feed(dataFile, outFile, page, title, desc) {
  const d = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const eds = (d.editions || []).slice(0, 14);
  const items = eds.map(e => {
    const link = `${SITE}/${page}`;
    const pub = new Date(e.date + "T07:00:00Z").toUTCString();
    const body = [`<p>${esc(e.standfirst)}</p>`]
      .concat((e.stories || []).map(s => `<p><b>${esc(s.kicker)}: ${esc(s.headline)}</b></p>`))
      .concat([`<p><a href="${link}">Read the whole edition</a></p>`]).join("");
    return `<item><title>${esc(e.title)}</title><link>${esc(link)}</link><guid isPermaLink="false">${esc(page + "-" + e.date)}</guid><pubDate>${pub}</pubDate><description>${esc(body)}</description></item>`;
  }).join("\n");
  const last = eds.length ? new Date(eds[0].date + "T07:00:00Z").toUTCString() : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(title)}</title><link>${SITE}/${page}</link><description>${esc(desc)}</description><language>en-gb</language><lastBuildDate>${last}</lastBuildDate><atom:link href="${SITE}/${outFile}" rel="self" type="application/rss+xml"/>\n${items}\n</channel></rss>\n`;
  fs.writeFileSync(outFile, xml);
  console.log("wrote", outFile, eds.length, "editions");
}
feed("news-data.json", "news.xml", "news.html", "The Daily Row", "Satire on top, the real story underneath. Terry and Reggie read the news so you do not have to.");
feed("gaming-data.json", "gaming.xml", "gaming.html", "The Daily Gaming Row", "Gaming news, the real story and the argument about it. Terry says PC, Reggie says PS5.");
