/* William George Works Worker.
   1. POST /        a score from the arcade: checked, and if it makes the board it is added to scores.json
                    in the GitHub repo (GitHub Pages then republishes the site).
   2. POST /vote    a Terry-or-Reggie vote on a Daily Gaming Row story (needs the VOTES KV binding).
   3. GET  /tally   the vote counts for an edition, plus the running total.
   4. POST /board   a message for Reggie's message board. It is checked, encrypted so that only Reggie's private key can
                    read it, and added to board-inbox.json. Reggie reads the post, replies and publishes board.json.
   5. POST /hit     a page view for the private stats counter (no cookies, nothing personal: day, page, referrer site).
   6. GET  /stats   the counts for the stats page. If you add a secret called STATS_KEY it must be given as ?key=.
   Secret needed: GITHUB_TOKEN (fine-grained token, this repo only, Contents: read and write).
   Binding needed for votes: VOTES (a Workers KV namespace). Scores work without it. */

const REPO = "williamgeorgeworks/williamgeorgeworks.github.io";
const BRANCH = "main";
const FILE = "scores.json";
const ORIGINS = [
  "https://williamgeorgeworks.co.uk",
  "https://www.williamgeorgeworks.co.uk",
  "https://williamgeorgeworks.github.io"
];
/* Which games take scores, and the highest believable score for each, now live in scores.json:
   a game accepts submissions only if it has a "cap" there. Adding a game never needs this file changed. */
const KEEP_PER_GAME = 40;
const DEFAULT_TOP = 3; /* board length; a game can set "top" (1 to 25) in scores.json */
/* Rude words. Matched per word, after turning look-alike characters into letters, so Scunthorpe,
   Hancock and Dickens stay welcome. Kept short on purpose; Ferret can add to it. */
const RUDE_ANYWHERE = ["fuck", "nigg", "fagg", "hitler"];
const RUDE_START = ["cunt", "twat", "wank", "bollock", "shit", "nazi"];
const RUDE_WORD = ["dick", "cock", "piss", "rape", "slut", "whore", "bastard", "retard", "spastic", "paki"];

function cors(origin) {
  const ok = ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function reply(status, body, origin) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });
}
function cleanName(raw) {
  let n = String(raw == null ? "" : raw).replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
  if (n.length > 24) n = n.slice(0, 24).trim();
  return n;
}
function isRude(name) {
  const norm = name.toLowerCase().replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/[$5]/g, "s");
  const flat = norm.replace(/[^a-z]/g, "");
  if (RUDE_ANYWHERE.some(w => flat.includes(w))) return true;
  return norm.split(/[^a-z]+/).filter(Boolean).some(t =>
    RUDE_START.some(w => t.startsWith(w)) ||
    RUDE_WORD.some(w => new RegExp("^" + w + "(s|es|ed|er|ers|ing|y|head|heads)?$").test(t)));
}
/* Checks the parts that do not depend on the game list. */
function validate(input) {
  const slug = String(input && input.game || "");
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return { error: "Unknown game." };
  const name = cleanName(input.name);
  if (name.length < 1) return { error: "Please give a name or handle." };
  if (/https?:|www\.|@.+\./i.test(name)) return { error: "Please leave links and emails out of the name." };
  if (isRude(name)) return { error: "That name is not going on the wall. Try another." };
  const s = String(input.score == null ? "" : input.score).trim();
  if (!/^[0-9]{1,6}$/.test(s)) return { error: "The score must be a whole number." };
  const score = parseInt(s, 10);
  if (score < 1) return { error: "A score of nothing is a perfectly good score, but it does not go on the wall." };
  return { game: slug, name, score };
}
function today() {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function b64decode(b64) { const bin = atob(b64.replace(/\n/g, "")); const bytes = Uint8Array.from(bin, c => c.charCodeAt(0)); return new TextDecoder().decode(bytes); }
function b64encode(text) { const bytes = new TextEncoder().encode(text); let bin = ""; bytes.forEach(b => (bin += String.fromCharCode(b))); return btoa(bin); }
function ranked(entries) {
  return entries.slice().sort((a, b) => (b.score - a.score) || String(a.date).localeCompare(String(b.date)));
}
/* Pure decision, so it can be tested without GitHub. */
function applyScore(data, v) {
  const game = data.games && data.games[v.game];
  if (!game || typeof game.cap !== "number") return { changed: false, error: "Unknown game." };
  if (v.score > game.cap) return { changed: false, error: "That score is beyond what the court believes possible." };
  game.entries = game.entries || [];
  if (game.daily) {
    /* A daily board shows only today's scores, one per player (their best). */
    const day = today();
    game.entries = game.entries.filter(e => e.date === day);
    const mine = game.entries.find(e => e.name.toLowerCase() === v.name.toLowerCase());
    if (mine && v.score <= mine.score) return { changed: false, reason: "duplicate" };
    if (mine) game.entries = game.entries.filter(e => e !== mine);
  }
  const TOP = typeof game.top === "number" ? Math.min(Math.max(Math.floor(game.top), 1), 25) : DEFAULT_TOP;
  const top = ranked(game.entries).slice(0, TOP);
  const last = top.length >= TOP ? top[TOP - 1].score : 0;
  if (v.score <= last) return { changed: false, reason: "not-top" };
  if (game.entries.some(e => e.name.toLowerCase() === v.name.toLowerCase() && e.score === v.score)) return { changed: false, reason: "duplicate" };
  game.entries.push({ name: v.name, score: v.score, date: today() });
  game.entries = ranked(game.entries).slice(0, KEEP_PER_GAME);
  data.updated = today();
  const place = ranked(game.entries).findIndex(e => e.name === v.name && e.score === v.score) + 1;
  return { changed: true, place };
}

/* A score on a board with "alsoTo" (the Daily Challenge) is also offered to that main board, so a great daily run
   lands on both. Each board applies its own rules (top ten, one entry per player on a daily board). */
function applyScoreEverywhere(data, v) {
  const out = applyScore(data, v);
  const game = data.games && data.games[v.game];
  const parent = game && typeof game.alsoTo === "string" ? data.games[game.alsoTo] : null;
  if (!parent || typeof parent.cap !== "number" || parent.daily || parent.alsoTo) return out;
  const alt = applyScore(data, { ...v, game: game.alsoTo });
  if (!alt.changed) return out;
  return { changed: true, place: out.changed ? out.place : undefined, alsoPlace: alt.place, alsoGame: game.alsoTo };
}
async function gh(env, path, init, repo) {
  return fetch("https://api.github.com/repos/" + (repo || REPO) + path, {
    ...init,
    headers: {
      "Authorization": "Bearer " + env.GITHUB_TOKEN,
      "Accept": "application/vnd.github+json",
      "User-Agent": "wgw-scores-worker",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init && init.headers)
    }
  });
}
async function save(env, v) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await gh(env, "/contents/" + FILE + "?ref=" + BRANCH);
    if (!r.ok) throw new Error("read " + r.status);
    const file = await r.json();
    const data = JSON.parse(b64decode(file.content));
    const out = applyScoreEverywhere(data, v);
    if (!out.changed) return out;
    const put = await gh(env, "/contents/" + FILE, {
      method: "PUT",
      body: JSON.stringify({
        message: "Arcade: " + v.name + " scores " + v.score + " in " + v.game + (out.alsoGame ? " and " + out.alsoGame : "") + " (automatic)",
        content: b64encode(JSON.stringify(data, null, 1) + "\n"),
        sha: file.sha,
        branch: BRANCH,
        committer: { name: "Reginald Quill", email: "noreply@anthropic.com" }
      })
    });
    if (put.ok) return out;
    if (put.status !== 409 && put.status !== 422) throw new Error("write " + put.status);
  }
  throw new Error("busy");
}


/* ---- Reggie's message board -------------------------------------------------------------------
   Waiting messages go into inbox.json in a PRIVATE repo (the post room), never the public site repo.
   Reggie's post round reads them there, publishes or drops each one in board.json, and handled
   messages are cleared out of the tray the next time a message arrives. No encryption key is needed. */
const INBOX_REPO = "williamgeorgeworks/post-room";
const INBOX = "inbox.json";
const BOARD = "board.json";
const INBOX_MAX = 80;
const BOARD_PER_HOUR = 3;
const BOARD_PER_DAY = 60;
function boardTokensRude(text) { return String(text).split(/\s+/).filter(Boolean).some(t => t.length < 40 && isRude(t)); }
function validateBoard(input) {
  const name = cleanName(input && input.name) || "Anonymous";
  let msg = String(input && input.message == null ? "" : input.message).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (msg.length < 5) return { error: "Reggie needs a little more than that to go on." };
  if (msg.length > 400) return { error: "Keep it to 400 characters. Reggie reads a lot of post." };
  if (/https?:|www\.|\b[a-z0-9-]+\.(com|co|uk|net|org|io|me|ly|info|biz|xyz|ru|cn)\b|@/i.test(name + " " + msg)) return { error: "No web addresses or email addresses, please. Reggie does not click things." };
  if (/(\d[\s().-]*){9,}/.test(name + " " + msg)) return { error: "That looks like a phone number. Please leave numbers out." };
  if (isRude(name) || boardTokensRude(msg)) return { error: "Reggie keeps a clean board. Try that again with fewer swear words." };
  return { name, msg };
}
async function sha256hex(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}
async function boardAllowed(env, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const hour = new Date().toISOString().slice(0, 13);
  const day = new Date().toISOString().slice(0, 10);
  const kIp = "rl:" + (await sha256hex(ip + "|" + hour)), kDay = "rl:day:" + day;
  const nIp = parseInt((await env.VOTES.get(kIp)) || "0", 10), nDay = parseInt((await env.VOTES.get(kDay)) || "0", 10);
  if (nIp >= BOARD_PER_HOUR) return { error: "Steady on. Three messages an hour is the limit. Reggie needs a sit down." };
  if (nDay >= BOARD_PER_DAY) return { error: "Reggie's post room is full for today. Try again tomorrow." };
  await env.VOTES.put(kIp, String(nIp + 1), { expirationTtl: 7200 });
  await env.VOTES.put(kDay, String(nDay + 1), { expirationTtl: 172800 });
  return { ok: true };
}
async function readJsonFile(env, path, repo) {
  const r = await gh(env, "/contents/" + path + "?ref=" + BRANCH, undefined, repo);
  if (r.status === 404) return { sha: null, data: null };
  if (!r.ok) throw new Error("read " + r.status);
  const file = await r.json();
  return { sha: file.sha, data: JSON.parse(b64decode(file.content)) };
}
async function addToInbox(env, post) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const inbox = await readJsonFile(env, INBOX, INBOX_REPO);
    const board = await readJsonFile(env, BOARD);
    const done = new Set((board.data && board.data.done) || []);
    const items = ((inbox.data && inbox.data.items) || []).filter(i => !done.has(i.id));
    if (items.length >= INBOX_MAX) return { error: "Reggie's post room is full. He will clear it at the next post round." };
    const id = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, "0")).join("");
    items.push({ id, t: new Date().toISOString().slice(0, 16) + "Z", name: post.name, msg: post.msg });
    const body = { message: "Post for Reggie (automatic)", content: b64encode(JSON.stringify({ items }, null, 1) + "\n"), branch: BRANCH, committer: { name: "Reginald Quill", email: "noreply@anthropic.com" } };
    if (inbox.sha) body.sha = inbox.sha;
    const put = await gh(env, "/contents/" + INBOX, { method: "PUT", body: JSON.stringify(body) }, INBOX_REPO);
    if (put.ok) return { ok: true };
    if (put.status !== 409 && put.status !== 422) throw new Error("write " + put.status);
  }
  throw new Error("busy");
}

const SIDES = ["terry", "reggie", "fave"];
const EDITION_RE = /^(n-)?\d{4}-\d{2}-\d{2}$/; /* n- marks a Daily Row edition; plain dates are the Gaming Row */
const MAX_STORY = 14;
async function readTally(env) {
  const raw = await env.VOTES.get("tally");
  const t = raw ? JSON.parse(raw) : {};
  t.total = t.total || { terry: 0, reggie: 0 };
  t.editions = t.editions || {};
  return t;
}
function viewTally(t, edition) {
  return { ok: true, total: t.total, stories: (t.editions && t.editions[edition]) || {} };
}

/* ---------- privacy-friendly page counter (v7) ---------- */
const HIT_DAILY_CAP = 700; /* stays inside the free KV write allowance, which is shared with votes and the board */
const HIT_KEEP_DAYS = 60;
function hitDay(d) { return (d || new Date()).toISOString().slice(0, 10); }
function cleanPage(p) {
  p = String(p == null ? "" : p).split("?")[0].split("#")[0];
  if (!/^\/[A-Za-z0-9_\-.\/]{0,60}$/.test(p)) return null;
  return p === "/" || p === "/index.html" ? "/" : p.replace(/\.html$/, "");
}
function cleanRef(r) {
  try { const h = new URL(String(r)).hostname.replace(/^www\./, ""); return /^[a-z0-9.\-]{3,60}$/i.test(h) ? h.toLowerCase() : ""; } catch (e) { return ""; }
}
function recordHit(day, page, ref, first) {
  day = day && typeof day === "object" ? day : {};
  day.n = (day.n || 0) + 1;
  day.p = day.p || {};
  day.p[page] = (day.p[page] || 0) + 1;
  if (first) {
    day.v = (day.v || 0) + 1;
    if (ref && ref !== "williamgeorgeworks.co.uk" && ref !== "williamgeorgeworks.github.io") {
      day.r = day.r || {};
      if (day.r[ref] || Object.keys(day.r).length < 30) day.r[ref] = (day.r[ref] || 0) + 1;
    }
  }
  return day;
}
async function addHit(env, input, ua) {
  if (/bot|crawl|spider|slurp|preview|monitor|curl|python|node-fetch/i.test(ua || "")) return { ok: true, counted: false };
  const page = cleanPage(input && input.page);
  if (!page) return { ok: false, error: "Bad page." };
  const key = "h:" + hitDay();
  let day = null;
  try { day = JSON.parse((await env.VOTES.get(key)) || "null"); } catch (e) { day = null; }
  if (day && day.n >= HIT_DAILY_CAP) return { ok: true, counted: false };
  day = recordHit(day, page, cleanRef(input && input.ref), !!(input && input.first));
  await env.VOTES.put(key, JSON.stringify(day), { expirationTtl: HIT_KEEP_DAYS * 86400 });
  return { ok: true, counted: true };
}
async function readStats(env, days) {
  days = Math.max(1, Math.min(HIT_KEEP_DAYS, days || 30));
  const out = [], now = Date.now();
  for (let i = 0; i < days; i++) {
    const d = hitDay(new Date(now - i * 86400000));
    let v = null;
    try { v = JSON.parse((await env.VOTES.get("h:" + d)) || "null"); } catch (e) { v = null; }
    out.push({ date: d, views: v ? v.n || 0 : 0, visits: v ? v.v || 0 : 0, pages: v ? v.p || {} : {}, refs: v ? v.r || {} : {} });
  }
  return { ok: true, cap: HIT_DAILY_CAP, days: out };
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

    if (request.method === "GET" && path === "/tally") {
      if (!env.VOTES) return reply(503, { ok: false, error: "Votes are not set up yet." }, origin);
      const edition = url.searchParams.get("edition") || "";
      if (edition && !EDITION_RE.test(edition)) return reply(400, { ok: false, error: "Bad edition." }, origin);
      const many = (url.searchParams.get("editions") || "").split(",").filter(Boolean);
      if (many.length > 10 || many.some(x => !EDITION_RE.test(x))) return reply(400, { ok: false, error: "Bad editions." }, origin);
      try {
        const t = await readTally(env);
        if (many.length) { const eds = {}; many.forEach(x => { eds[x] = t.editions[x] || {}; }); return reply(200, { ok: true, total: t.total, editions: eds }, origin); }
        return reply(200, viewTally(t, edition), origin);
      }
      catch (e) { return reply(502, { ok: false, error: "Try again in a minute." }, origin); }
    }

    if (request.method === "GET" && path === "/stats") {
      if (!env.VOTES) return reply(503, { ok: false, error: "Not set up yet." }, origin);
      if (env.STATS_KEY && url.searchParams.get("key") !== env.STATS_KEY) return reply(403, { ok: false, error: "Wrong key." }, origin);
      try { return reply(200, await readStats(env, parseInt(url.searchParams.get("days") || "30", 10)), origin); }
      catch (e) { return reply(502, { ok: false, error: "Try again in a minute." }, origin); }
    }

    if (request.method !== "POST") return reply(405, { ok: false, error: "POST only." }, origin);
    if (!ORIGINS.includes(origin)) return reply(403, { ok: false, error: "Not from here." }, origin);
    let input;
    try { input = await request.json(); } catch (e) { return reply(400, { ok: false, error: "Bad request." }, origin); }

    if (path === "/hit") {
      if (!env.VOTES) return reply(200, { ok: true, counted: false }, origin);
      try { return reply(200, await addHit(env, input, request.headers.get("User-Agent")), origin); }
      catch (e) { return reply(200, { ok: true, counted: false }, origin); }
    }

    if (path === "/board") {
      if (!env.VOTES || !env.GITHUB_TOKEN) return reply(503, { ok: false, error: "The post room is closed for now." }, origin);
      if (input && input.website) return reply(200, { ok: true, status: "queued" }, origin); /* honeypot */
      const v = validateBoard(input);
      if (v.error) return reply(400, { ok: false, error: v.error }, origin);
      try {
        const allowed = await boardAllowed(env, request);
        if (allowed.error) return reply(429, { ok: false, error: allowed.error }, origin);
        const out = await addToInbox(env, { name: v.name, msg: v.msg });
        if (out.error) return reply(503, { ok: false, error: out.error }, origin);
        return reply(200, { ok: true, status: "queued" }, origin);
      } catch (err) { return reply(502, { ok: false, error: "The post room is busy. Try again in a minute." }, origin); }
    }

    if (path === "/vote") {
      if (!env.VOTES) return reply(503, { ok: false, error: "Votes are not set up yet." }, origin);
      const edition = String(input && input.edition || "");
      const story = Number(input && input.story);
      const side = String(input && input.side || "");
      if (!EDITION_RE.test(edition) || !Number.isInteger(story) || story < 0 || story > MAX_STORY || !SIDES.includes(side))
        return reply(400, { ok: false, error: "Bad vote." }, origin);
      try {
        const t = await readTally(env);
        const e = (t.editions[edition] = t.editions[edition] || {});
        const st = (e[story] = e[story] || { terry: 0, reggie: 0 });
        st[side] = (st[side] || 0) + 1;
        if (side !== "fave") t.total[side] += 1;
        const keep = [];
        [k => k.startsWith("n-"), k => !k.startsWith("n-")].forEach(pick => keep.push(...Object.keys(t.editions).filter(pick).sort().slice(-60)));
        Object.keys(t.editions).forEach(k => { if (!keep.includes(k)) delete t.editions[k]; });
        await env.VOTES.put("tally", JSON.stringify(t));
        return reply(200, viewTally(t, edition), origin);
      } catch (err) { return reply(502, { ok: false, error: "Try again in a minute." }, origin); }
    }

    if (path !== "/") return reply(404, { ok: false, error: "Not found." }, origin);
    if (input && input.website) return reply(200, { ok: true, status: "skipped" }, origin); /* honeypot */
    const v = validate(input);
    if (v.error) return reply(400, { ok: false, error: v.error }, origin);
    if (!env.GITHUB_TOKEN) return reply(500, { ok: false, error: "Not set up yet." }, origin);
    try {
      const out = await save(env, v);
      if (out.error) return reply(400, { ok: false, error: out.error }, origin);
      if (out.changed) return reply(200, { ok: true, status: "added", place: out.place, alsoPlace: out.alsoPlace }, origin);
      return reply(200, { ok: true, status: out.reason }, origin);
    } catch (e) {
      return reply(502, { ok: false, error: "The court is busy. Please try again in a minute." }, origin);
    }
  }
};
export { cleanPage, cleanRef, recordHit, addHit, readStats, validate, applyScore, applyScoreEverywhere, cleanName, isRude, validateBoard, addToInbox };
