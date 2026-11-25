#!/usr/bin/env node
/* Builds sitemap.xml from the .html pages, using each file's last git commit date. Run from the repo root. */
const fs = require("fs"), cp = require("child_process");
const SITE = "https://williamgeorgeworks.co.uk";
const pages = fs.readdirSync(".").filter(f => f.endsWith(".html") && f !== "404.html" && f !== "stats.html" && !/<meta name="robots" content="noindex/i.test(fs.readFileSync(f, "utf8"))).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));
const daily = { "news.html": 1, "gaming.html": 1, "index.html": 1, "arcade.html": 1, "log.html": 1, "invoices.html": 1 };
/* Pages whose content lives in a data file: date them by whichever changed last, the page or its data. */
const data = { "news.html": "news-data.json", "gaming.html": "gaming-data.json", "arcade.html": "scores.json", "comic.html": "comic/issues.json", "employee-of-the-month.html": "employee.json" };
const urls = pages.map(f => {
  let d = ""; try { d = cp.execSync(`git log -1 --format=%cs -- ${f}${data[f] ? " " + data[f] : ""}`, { encoding: "utf8" }).trim(); } catch (e) {}
  const loc = f === "index.html" ? SITE + "/" : SITE + "/" + f;
  return `<url><loc>${loc}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}<changefreq>${daily[f] ? "daily" : "monthly"}</changefreq></url>`;
});
fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
console.log("sitemap.xml:", urls.length, "urls");
