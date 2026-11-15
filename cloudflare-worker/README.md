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
