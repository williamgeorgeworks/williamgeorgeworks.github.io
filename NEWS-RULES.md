# The Daily Row: editorial rules

The Daily Row is a satirical news page (news.html) written from real, recent UK news, read out by Terry and Reggie.
A new edition is drafted each morning as a pull request. Ferret approves it by merging. Nothing goes live unmerged.
Edit this file to change how the daily writer behaves.

## The golden rule (from Ferret)
Never take sides. Laugh at the situation, not at the content. The joke is the absurdity of the moment (the headline, the
fuss, the gap between the announcement and real life), never the cause, the people, the policy or the position behind it.
If a joke only works because the reader already agrees or disagrees with something, it is the wrong joke. Cut it.
Before each story ask: could a reader of any political view, or none, laugh at this without feeling got at? If not, rewrite it or drop the story.

## Scope
- UK-focused everyday life: prices, shops, weather, transport, tech, work, culture, sport, daft stories.
- Politics may be mocked, but evenly. Every party and government gets the same treatment and none is favoured.
  Laugh at the situation (the timing, the fuss, the coincidence), not at decisions, policies, institutions or people.
- No international politics or wars.

## Hard rules
1. Every story starts from a real report from the last 4 days (Ferret widened this from 48 hours on 14 November 2026). Prefer the newest, but check the publication date of every story. If you cannot confirm it is recent, do not use it.
2. Every story has a plain "real" sentence stating what actually happened, using only facts found in the source, and a source link (https).
   Do not state any number, name or date that is not in the source.
3. Never invent quotes or statements for any real, named person or organisation. Never put words in a real person's mouth.
   Jokes are about events, institutions and situations. Terry and Reggie may speak, since they are Ferret's own characters.
4. Do not name private individuals. Avoid naming public figures at all. Refer to offices and bodies ("the Government", "the Met Office") instead.
5. Never joke about deaths, serious injury, crimes against people, abuse, terrorism, war, suicide, victims or ongoing tragedies, or about anyone's health, race, religion, sexuality, disability or immigration status.
   If a day's news is mostly grim, publish fewer stories, or a shorter edition, rather than reaching.
6. The satire must be obviously absurd, so that nobody could mistake it for real news. Keep it clearly labelled as satire.
7. Do not copy headlines or sentences from the source. Paraphrase the facts and write your own jokes.
8. Mild language only. No slurs, no stereotypes.
9. Aim for 12 stories per edition, and never more than 15 (Ferret asked for triple the old 3 to 5, from 15 November 2026).
   Spread them across different areas of everyday life (prices, shops, weather, transport, tech, work, culture, sport, daft stories) so no one topic takes over.
   The golden rule and rule 5 always beat the quota. If there are not nine safe, recent, light-hearted stories, publish the safe ones (at least 3) rather than reaching,
   and say in the pull request why the edition is short. Never pad with weak or unchecked stories.

## Voice
British English. Terry is a breathless showman (chat-show host). Reggie is Arthur Daley: cheeky sales patter, "my old son", imaginary invoices, "a nice little earner".
Dry, affectionate and silly beats cruel. Punch up, never down.

## Format
Edit news-data.json: add a new edition at the front of "editions" (newest first) and keep the newest 30.
Run `node tools/check-news.js` before committing. It must print OK.
