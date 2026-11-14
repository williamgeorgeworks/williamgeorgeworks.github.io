/* Checks news-data.json against the rules in NEWS-RULES.md that a machine can check. Usage: node tools/check-news.js */
const fs = require("fs");
const data = JSON.parse(fs.readFileSync(__dirname + "/../news-data.json", "utf8"));
const errs = [], warn = [];
const grim = /\b(murder\w*|kill(ed|ing)?|dead|death|died|dies|suicide|stabb\w*|rape\w*|abuse\w*|terror\w*|shooting|massacre|war|victim\w*|killed|fatal\w*)\b/i;
if (!Array.isArray(data.editions)) errs.push("editions must be an array");
(data.editions || []).forEach((e, i) => {
  const w = "edition " + (e.date || i);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) errs.push(w + ": bad date");
  ["title", "standfirst", "terry", "reggie"].forEach(k => { if (typeof e[k] !== "string" || !e[k].trim()) errs.push(w + ": missing " + k); });
  if (!Array.isArray(e.stories) || e.stories.length < 3 || e.stories.length > 5) errs.push(w + ": needs 3 to 5 stories");
  (e.stories || []).forEach((s, j) => {
    const sw = w + " story " + (j + 1);
    ["kicker", "headline", "satire", "real"].forEach(k => { if (typeof s[k] !== "string" || !s[k].trim()) errs.push(sw + ": missing " + k); });
    if (!s.source || !/^https:\/\//.test(s.source.url || "") || !(s.source.name || "").trim()) errs.push(sw + ": needs source {name, url} with an https url");
    if ((s.satire || "").length > 700) errs.push(sw + ": satire too long (max 700 characters)");
    if ((s.real || "").length > 450) errs.push(sw + ": real sentence too long (max 450 characters)");
    if (grim.test(s.satire + " " + s.headline)) warn.push(sw + ": satire text contains a grim word; check rule 5");
    if (/\bsaid\b[^.]*["“]/.test(s.satire)) warn.push(sw + ": looks like a quote in the satire; check rule 3");
  });
});
if ((data.editions || []).length > 30) errs.push("keep the newest 30 editions only");
warn.forEach(m => console.log("WARN " + m));
if (errs.length) { errs.forEach(m => console.log("ERROR " + m)); process.exit(1); }
console.log("OK " + (data.editions || []).length + " edition(s)");
