/* William George Works — virtual office feed Worker.
   GET /  returns only whether each office bot is working or idle,
   based on open Issues in the private quill-family-hq repo.
   Secret needed: GITHUB_TOKEN (fine-grained, that repo only, Issues: read-only).
   Nothing else is returned: no titles, numbers, bodies, links, usernames or counts. */

const REPO = "williamgeorgeworks/quill-family-hq";

/* Everyone on the office page. Kenneth, Terrance and Reginald have private
   offices; the other twenty have desks on the open floor. */
export const OFFICE_BOTS = [
  "kenneth", "terry", "reggie",
  "boris", "tweety", "percy", "george",
  "archie", "brian", "clive", "frank", "filament", "oddly", "rupert",
  "penny", "sheila", "sarge", "mona", "hettie",
  "stockley", "grant", "vinnie", "keith"
];

export const LABEL_TO_BOT = {
  "for-kenneth": "kenneth",
  "for-terry": "terry",
  "for-reggie": "reggie",
  "for-boris": "boris",
  "for-tweety": "tweety",
  "for-percy": "percy",
  "for-george": "george",
  "for-archie": "archie",
  "for-brian": "brian",
  "for-clive": "clive",
  "for-frank": "frank",
  "for-filament": "filament",
  "for-oddly": "oddly",
  "for-rupert": "rupert",
  "for-penny": "penny",
  "for-sheila": "sheila",
  "for-sarge": "sarge",
  "for-mona": "mona",
  "for-hettie": "hettie",
  "for-stockley": "stockley",
  "for-grant": "grant",
  "for-vinnie": "vinnie",
  "for-keith": "keith"
};

const ORIGINS = [
  "https://williamgeorgeworks.co.uk",
  "https://www.williamgeorgeworks.co.uk",
  "https://raw.githack.com",
  "https://rawcdn.githack.com"
];

const CACHE_SECONDS = 60;
const CACHE_URL = "https://wgw-office-feed.internal/bots";

function corsHeaders(origin) {
  const ok = ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

export function sanitise(issues, updatedAt = new Date()) {
  const bots = {};
  for (const id of OFFICE_BOTS) bots[id] = "idle";
  if (Array.isArray(issues)) {
    for (const issue of issues) {
      if (!issue || issue.pull_request) continue;
      if (String(issue.state || "").toLowerCase() !== "open") continue;
      const labels = Array.isArray(issue.labels) ? issue.labels : [];
      for (const lab of labels) {
        const name = typeof lab === "string" ? lab : lab && lab.name;
        const bot = LABEL_TO_BOT[name];
        if (bot) bots[bot] = "working";
      }
    }
  }
  return { updated: new Date(updatedAt).toISOString(), bots };
}

async function readOpenIssues(token) {
  const url = "https://api.github.com/repos/" + REPO + "/issues?state=open&per_page=100";
  const res = await fetch(url, {
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "User-Agent": "wgw-office-feed",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!res.ok) throw new Error("github " + res.status);
  return res.json();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "office feed offline" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
      });
    }

    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=" + CACHE_SECONDS,
      ...corsHeaders(origin)
    };

    try {
      const cache = caches.default;
      const cached = await cache.match(CACHE_URL);
      if (cached) {
        const body = await cached.text();
        return new Response(body, { status: 200, headers });
      }
      if (!env || !env.GITHUB_TOKEN) {
        return new Response(JSON.stringify({ error: "office feed offline" }), {
          status: 503,
          headers
        });
      }
      const issues = await readOpenIssues(env.GITHUB_TOKEN);
      const payload = JSON.stringify(sanitise(issues));
      const cachedResponse = new Response(payload, {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + CACHE_SECONDS }
      });
      await cache.put(CACHE_URL, cachedResponse);
      return new Response(payload, { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: "office feed offline" }), {
        status: 503,
        headers
      });
    }
  }
};
