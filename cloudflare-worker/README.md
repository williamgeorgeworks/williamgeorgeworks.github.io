# Arcade scores Worker: one-time setup

This lets the arcade add top-three scores to the hall of fame by itself. It runs free on Cloudflare Workers
(100,000 requests a day on the free plan; nobody will get near that).

## 1. A GitHub token (2 minutes)

1. GitHub > your profile picture > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Name: `arcade scores worker`. Expiration: the longest it allows (put a reminder in the diary for the date).
3. Repository access: Only select repositories > `williamgeorgeworks/williamgeorgeworks.github.io`.
4. Permissions > Repository permissions > Contents: Read and write. Nothing else.
5. Generate, and copy the token (starts `github_pat_`). Do not paste it into any chat, including with Reggie.

## 2. The Worker (5 minutes)

1. Sign up at cloudflare.com (free) and open Workers & Pages > Create > Create Worker > Hello World > Deploy.
2. Click Edit code, delete what is there, paste in the whole of `scores-worker.js` from this folder, and Deploy.
3. Settings > Variables and Secrets > Add > type Secret, name `GITHUB_TOKEN`, value the token from step 1. Deploy.
4. Copy the Worker's address (ends `workers.dev`) and send it to Reggie. The address is not secret.

## 3. Reggie does the rest

He puts the address into `scores.js`, switches the arcade page's wording from "a human checks" to "a machine checks", and tests it.

## How it behaves

- Accepts a score only from the William George site, only for the five arcade games, and only if the name is clean and the score is possible.
- If the score makes a game's top three, it commits `scores.json` to the repo and the site republishes within about a minute. Anything else is quietly ignored, so spam cannot flood the history.
- Ties go to whoever got there first. Duplicates are ignored.
- An emailed copy of every submission still goes to Ferret through Formspree, so notes and replies are not lost.
- To remove a score, edit `scores.json` and delete the entry. To add rude words, edit `RUDE_*` at the top of the Worker (and redeploy).

## Adding a new game later (no Cloudflare needed)

In `scores.json`, add the game under `games` with `label`, `max` (or null), `cap` (the highest believable score), `title`, `unit` and `entries: []`. A game with a `cap` accepts scores, and a game with a `title` appears in the arcade form's dropdown by itself. Then add its card with a `data-hall` box to `arcade.html`.

## Version 4: Daily Row votes and Best of the week

Re-paste `scores-worker.js` (Edit code, replace everything, Deploy), same as the version 3 step 1. No new bindings needed. Adds `n-` (Daily Row) editions, a `fave` vote and `GET /tally?editions=a,b,c`.

## Version 3: daily boards and votes (extra one-time step)

1. Open the Worker in Cloudflare, choose Edit code, replace everything with the contents of https://williamgeorgeworks.co.uk/cloudflare-worker/scores-worker.js and click Deploy.
2. Create a KV namespace (Storage and databases, then KV, then Create, name it `wgw-votes`).
3. Open the Worker, then Settings, Bindings, Add, KV namespace. Set the variable name to exactly `VOTES`, choose `wgw-votes`, and save.
4. Until step 3 is done the Terry v Reggie vote stays hidden on the Gaming Row; scores keep working throughout.

Routes: `POST /` takes a score, `POST /vote` takes a vote, `GET /tally?edition=YYYY-MM-DD` returns the counts. Games marked `"daily": true` in scores.json keep only today's entries (UK date), one per player.

## Daily boards that also feed a main board

A game in scores.json can carry `"alsoTo": "<main game slug>"`. A score posted to it is also offered to that main board (top ten rules as normal), so a strong Daily Challenge run lands on both. Grand Theft Kitty Daily Challenge uses this.

## v7: private page counter

`hits.js` (on every page) posts the page name, and the referring site once per visit, to `POST /hit`. The Worker keeps one KV key per day (`h:YYYY-MM-DD`, kept 60 days) holding view counts per page, visits and referrers. No cookies, no IDs, bots and Do Not Track skipped, counting pauses at 700 views a day to protect the free KV write allowance. `stats.html` (noindex, not linked) reads `GET /stats`. Optional: add a Worker secret `STATS_KEY` and the stats page will ask for it. Visit `stats.html?me` once on your own devices to stop counting yourself.

## v8: stats are private (key required)

From v8, `GET /stats` only answers when the Worker has a secret called `STATS_KEY` **and** the request sends the header
`Authorization: Bearer <STATS_KEY>`. If `STATS_KEY` is missing (or shorter than 12 characters) the stats are locked for everyone.
The key is never put in a web address, so it does not end up in logs or browser history. Counting (`POST /hit`) is unchanged.

1. Make up a long random key (24+ characters; a password manager is ideal). Do not paste it into any chat or commit it.
2. Cloudflare > Workers & Pages > the arcade-scores Worker > Settings > Variables and Secrets > Add > type Secret,
   name `STATS_KEY`, value your key. Save.
3. Edit code, replace everything with the v8 `scores-worker.js`, and Deploy.
4. Check: open `https://arcade-scores.benharding75.workers.dev/stats` in a private window. It should say the stats are locked.
5. Open `stats.html` on the site and type the key when asked. It is kept only for that browser tab.
6. Bots that need the numbers get the key through their own secret store, never in chat, and read them with
   `curl -H "Authorization: Bearer $STATS_KEY" "https://arcade-scores.benharding75.workers.dev/stats?days=30"`.
