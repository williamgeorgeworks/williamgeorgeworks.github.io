# The Magnificent Nonsense - monthly production

Original full-colour British household comic for William George Works. Keep the established portraits in /kofi as character references. Broad classic British comic energy; no copied publisher branding, characters or panels.

## Every issue
16 pages: cover; contents and cast; one four-panel story each for Ferret, Jo, Arthur, Spyro, Tilly, Trixie, Dexter and Daisy; cousins; website feature; original puzzles; fictional postbag; answers and credits; back cover.

Use a new YYYY-MM directory under issues. Copy issue.json as the schema, increment number, update date/theme, write all eight fresh stories and supply new art. Each art JPEG is a square 2x2 panel sheet ordered left-to-right then top-to-bottom. Text stays in HTML for legibility. Preserve existing issue directories and artwork.

The shared renderer contains November's supporting features. For subsequent issues supply a pages array of {title,html} in issue.json, containing all 16 rendered articles, or extend the renderer with issue-specific supporting content. Never change an archived edition by editing shared editorial text. Add the new registry entry to issues.json only when complete; latest first. Update the homepage feature and reader issue badge.

Run node comic/build-issue.cjs YYYY-MM to validate the eight stories and create the standalone edition. Run node --check comic/reader.js. Test all page controls, archive links, keyboard, touch/mobile and text view in the browser. Inspect art likenesses and all 16 pages; check answers. Verify image paths, then preview the deployed site.

## Editorial rules
Use public website sections as fresh reference. User memories supply interests, not invented factual anecdotes. Mark fictional plots/dialogue; do not expose private health, financial or staff information. Jo fishes; Ferret writes, DJs, fishes and plans. Arthur judges; Spyro reigns; Tilly is quietly dangerous; Trixie commands; Dexter is gentle; Daisy protests innocence. Keep kindness underneath the jokes. Do not imply Reginald reviewed or wrote new work without evidence. Credit AI-assisted creation transparently.

For future scheduled editions prepare a reviewable draft PR with issue and art, check whether one already exists to prevent duplicates, and notify Ferret. Never mark an unfinished future issue published. Preserve unrelated changes from Reggie by basing changes on the latest main head.

