/* Arcade scores Worker.
   Takes a score from the arcade form, checks it, and, if it makes a game's top three,
   adds it to scores.json in the GitHub repo. GitHub Pages then republishes the site.
   Secret needed: GITHUB_TOKEN (fine-grained token, this repo only, Contents: read and write). */

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
function today() { return new Date().toISOString().slice(0, 10); }
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

async function gh(env, path, init) {
  return fetch("https://api.github.com/repos/" + REPO + path, {
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
    const out = applyScore(data, v);
    if (!out.changed) return out;
    const put = await gh(env, "/contents/" + FILE, {
      method: "PUT",
      body: JSON.stringify({
        message: "Arcade: " + v.name + " scores " + v.score + " in " + v.game + " (automatic)",
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "POST") return reply(405, { ok: false, error: "POST only." }, origin);
    if (!ORIGINS.includes(origin)) return reply(403, { ok: false, error: "Not from here." }, origin);
    let input;
    try { input = await request.json(); } catch (e) { return reply(400, { ok: false, error: "Bad request." }, origin); }
    if (input && input.website) return reply(200, { ok: true, status: "skipped" }, origin); /* honeypot */
    const v = validate(input);
    if (v.error) return reply(400, { ok: false, error: v.error }, origin);
    if (!env.GITHUB_TOKEN) return reply(500, { ok: false, error: "Not set up yet." }, origin);
    try {
      const out = await save(env, v);
      if (out.error) return reply(400, { ok: false, error: out.error }, origin);
      if (out.changed) return reply(200, { ok: true, status: "added", place: out.place }, origin);
      return reply(200, { ok: true, status: out.reason }, origin);
    } catch (e) {
      return reply(502, { ok: false, error: "The court is busy. Please try again in a minute." }, origin);
    }
  }
};
export { validate, applyScore, cleanName, isRude };
