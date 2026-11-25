# Virtual office feed Worker

This is a small, read-only Worker for the virtual office page (`office.html`).
It looks at open Issues in the private `williamgeorgeworks/quill-family-hq` repo
and returns only whether each office bot is `working` or `idle`.
It never returns titles, issue numbers, bodies, comments, usernames or links.

Kenneth deploys this after Ben approves the page. Do not put a token in the
website repo, and do not paste a token into a chat.

The Worker is not deployed as part of this pull request.

## What you get back

```json
{"updated":"2026-11-22T22:00:00.000Z","bots":{"kenneth":"idle","terry":"working","george":"idle"}}
```

A bot is `working` if any open issue (not a pull request) carries its label
(`for-kenneth`, `for-terry`, `for-reggie`, `for-george`, `for-percy`,
`for-boris`, `for-tweety`, `for-archie`, `for-brian`, `for-clive`,
`for-frank`, `for-filament`, `for-oddly`, `for-rupert`). The response is cached for 60 seconds.

## Deploy steps (Kenneth)

You need the Cloudflare account that already runs the arcade scores Worker,
and Wrangler (`npx wrangler` is fine).

### 1. A GitHub token (2 minutes)

1. GitHub > your profile picture > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Name: `office feed worker`. Expiration: the longest it allows (put a reminder in the diary for the date).
3. Repository access: Only select repositories > `williamgeorgeworks/quill-family-hq` only.
4. Permissions > Repository permissions > Issues: Read-only. Metadata: Read-only (GitHub requires this and will tick it itself). Nothing else. No Contents, no Pull requests, no Administration.
5. Generate, and copy the token (it starts `github_pat_`). Do not paste it into any chat, including with George, and do not commit it.

### 2. Deploy the Worker

In a checkout of the website repo, from this folder:

```
cd cloudflare-worker/office-feed
npx wrangler login
npx wrangler deploy
npx wrangler secret put GITHUB_TOKEN
```

When `secret put` asks for a value, paste the token and press Enter. The token
is stored on Cloudflare, not in this repo.

### 3. Check it

Copy the Worker's address from the deploy output (it ends `workers.dev`). Then:

```
curl -sS https://wgw-office-feed.YOUR-ACCOUNT.workers.dev
```

You should get a JSON object with `updated` and a `bots` map of `working` or
`idle` for each office bot, and nothing else. If the secret is missing you
will get a short "office feed offline" error instead.

### 4. Point the page at it

Open `office.js` in the website repo and set this one line to the Worker
address:

```
const OFFICE_FEED_URL = "https://wgw-office-feed.YOUR-ACCOUNT.workers.dev";
```

Leave the quotes on and do not add a trailing slash. Commit that on a branch
and open a PR (or tell George the address and he will do it). Until this line
is set, the office page stays in a friendly offline mode: everyone idles and
the board says the feed is offline.

## Notes

- Allowed page origins: `https://williamgeorgeworks.co.uk`, `www` of the same,
  and `raw.githack.com` / `rawcdn.githack.com` so a branch preview can load the
  feed once the Worker is live.
- The office page polls about once a minute and pauses when the tab is hidden.
- Issue titles never leave the private repo through this Worker. Still, treat
  for-* issue titles as if they might be seen by people with repo access only.
