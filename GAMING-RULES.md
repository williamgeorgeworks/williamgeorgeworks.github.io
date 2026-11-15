# The Daily Gaming Row: editorial rules

The Daily Gaming Row (gaming.html, data in gaming-data.json) is the games-news cousin of the Daily Row (news.html, NEWS-RULES.md).
It is satirical, written from real, recent gaming news, and read out by Terry and Reggie, who ARGUE about every story.
A new edition is drafted each morning at about 7.30 on a `gaming/YYYY-MM-DD` branch. Ferret chose to publish automatically (15 Nov 2026):
when the branch is pushed, a GitHub Action (`.github/workflows/publish-gaming.yml`) runs `node tools/check-news.js gaming-data.json` and, only if it prints OK, merges the branch into main.
There is no human check, so the rules matter. The page carries a disclaimer saying so. If the checker fails, nothing goes live.
Everything in NEWS-RULES.md applies here too (read it first), with the changes below.

## The golden rule (from Ferret, same as the Daily Row)
Never take sides. Laugh at the situation, not at the content. The joke is the absurdity of the moment (the announcement, the fuss, the gap between the headline and real life), never the console, company, studio, game, publisher, developer or player behind it.
No console wars, no fan wars, no "X is better than Y", no rivalry jokes that pick a winner. If a joke only works because the reader already likes or dislikes something, cut it.

## Scope
- Gaming news from anywhere (the games world is global), but a UK angle is welcome when there is one: UK release dates, UK shops, UK events.
- Consoles, PC, handheld, mobile, tabletop-video crossovers, releases, patches, sales milestones, awards, events, daft stories, hardware, subscriptions, delays, odd bugs, gaming records.
- Only things that are reported or announced. Rumours and leaks are not facts: skip them unless the story is plainly that a leak or rumour exists, and then say so in the "real" box.
- No politics, no international politics, no wars. No lawsuits, no regulators, no court cases.
- No layoffs, redundancies, studio closures, cancelled games where jobs were lost, or anyone's working conditions. Skip them entirely, do not joke about them.
- No jokes about piracy, cheating, hacking or crime against real people.

## Hard rules (in addition to NEWS-RULES.md)
1. Every story starts from a real report from the last 4 days. Check the date of every story. If you cannot confirm it is recent, do not use it.
2. Every story has a plain "real" sentence using only facts found in the source, and an https source link. Do not state any number, name or date that is not in the source. Use a link to the actual article, never to a front page or a listing, unless you cannot find one, and then say so in the commit message.
3. Never invent quotes or statements for any real named person or organisation. Terry and Reggie may speak; they are Ferret's own characters.
4. Do not name private individuals. Do not name developers, executives, streamers, voice actors, journalists or other people at all. Refer to the company, the studio or the game. Companies, games and consoles may be named.
5. Never joke about deaths, serious injury, health, abuse, crime victims, or anyone's race, religion, sexuality, disability or immigration status. If a day's news is mostly grim, publish fewer stories.
6. The satire must be obviously absurd. Do not copy source wording. Mild language only.
7. Do not mock fans or players. Do not mock a game's quality or sales, or say a company is greedy, lazy or in trouble. Gentle teasing of the situation is the limit.
8. Aim for 12 stories and never more than 15. Spread them across platforms, genres and topics. Fewer is fine if that is all that is safe and verified (at least 3; say why in the commit message if there are fewer than 9).

## Voice (this is the point of the page)
Each story is a short argument. Terry (breathless showman, loves everything, wrong about most of it) and Reggie (Arthur Daley: "my old son", imaginary invoices, "a nice little earner", wounded dignity) disagree about the report in the "satire" text. Both must appear in every story. Vary who wins. They never fall out for real.
Silly beats clever. Affectionate beats cruel. Do not reuse the same punchline shape twice in an edition. Reggie's invoice joke can appear at most twice per edition.

## Format
Edit gaming-data.json: add a new edition at the front of "editions" (newest first), keep the newest 30. Fields: date, title, standfirst, terry, reggie, stories[{kicker, headline, satire (max 700 chars), real (max 450 chars), source{name,url}, optional link{text,url}}].
`link` points to one of our own pages (a plain filename ending .html). Use it when a story connects: Grand Theft Kitty for cat, tricycle or crime-caper stories, arcade.html for stories about big games, boxes, downloads or prices.
Run `node tools/check-news.js gaming-data.json` before committing. It must print OK. Read every WARN.
Do NOT edit news-data.json or any page. Only gaming-data.json changes in the daily commit.
