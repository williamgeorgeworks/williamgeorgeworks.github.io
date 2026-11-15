#!/usr/bin/env node
/* Checks board.json before it is published. Usage: node tools/check-board.js */
const fs = require("fs");
const data = JSON.parse(fs.readFileSync(__dirname + "/../board.json", "utf8"));
const errs = [];
const bad = /https?:|www\.|<|>|@|\b[a-z0-9-]+\.(com|co|uk|net|org|io|me|ly|info|biz|xyz|ru|cn)\b/i;
if (!Array.isArray(data.posts)) errs.push("posts must be an array");
if (!Array.isArray(data.done)) errs.push("done must be an array");
const ids = new Set();
(data.posts || []).forEach((p, i) => {
  const w = "post " + (p.id || i);
  if (!/^[a-z0-9-]{3,24}$/.test(p.id || "")) errs.push(w + ": bad id");
  if (ids.has(p.id)) errs.push(w + ": duplicate id"); ids.add(p.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || "")) errs.push(w + ": bad date");
  if (typeof p.name !== "string" || !p.name.trim() || p.name.length > 24) errs.push(w + ": bad name");
  if (!p.hidden && (typeof p.msg !== "string" || p.msg.length < 1 || p.msg.length > 400)) errs.push(w + ": message missing or over 400 characters");
  if (typeof p.reply !== "string" || p.reply.trim().length < 5 || p.reply.length > 700) errs.push(w + ": reply missing or over 700 characters");
  [p.name, p.msg, p.reply].forEach(t => { if (typeof t === "string" && bad.test(t)) errs.push(w + ": contains a link, email address or angle bracket"); });
  if (!(data.done || []).includes(p.id) && p.id !== "welcome") errs.push(w + ": published but not in done");
});
if ((data.posts || []).length > 200) errs.push("keep the newest 200 posts only");
if ((data.done || []).length > 1000) errs.push("keep the newest 1000 done ids only");
if (errs.length) { errs.forEach(m => console.log("ERROR " + m)); process.exit(1); }
console.log("OK " + (data.posts || []).length + " post(s)");
