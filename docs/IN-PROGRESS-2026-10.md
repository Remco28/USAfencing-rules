# Work in progress: October 2026 fencing-rule and beginner UX update

This handoff describes the unfinished update requested on 2026-09-29. It is intentionally a status document, not a claim that the app changes are complete or fully verified.

## User's requests — detailed handoff of the original prompt

The user said the previous iteration was much improved, then asked for a further beginner-focused content and usability review. The intent is not merely to add content, but to examine why each piece of text is there and whether it helps someone new to fencing.

### Specific requested changes

1. **Browser favicon from the existing logo**
   - Turn the created site logo into a favicon shown in the browser tab.
   - The visible logo is the existing CSS-drawn mark: a small dark-green rounded rectangle containing three narrow yellow, red and black bars/cards.
   - Match the existing logo rather than introducing a new visual identity; make sure the static GitHub Pages site can serve it and the offline service worker caches it.

2. **Review text for redundancy and scanability**
   - The user noticed copy of this form: **“First call: Yellow. Second: Red. Third: elimination.”** They like how compact it is but find it difficult to parse while scanning quickly.
   - On inspection, this appears to repeat the penalty cells directly underneath (the first-, second- and third-call progression). The user asks us to question the logic of why that prose exists, not just preserve/populate every possible content field.
   - Review similar explainer/summary text across entries: remove prose that merely repeats adjacent penalty chips/cells; keep, rewrite or expand text when it supplies genuinely useful context (for example, what the offense means, when an exception applies, a touch is annulled, or a team rule differs).
   - Do not indiscriminately delete all explainers; evaluate their purpose and whether a beginner gains information not already plainly displayed.

3. **Research/update passivity rules effective Oct. 1, 2026**
   - User states the changes take effect **October 1, 2026** and wants research and an app update.
   - Assume it is already Oct. 1, 2026; write the guidance as current, not as a future change that has yet to happen.
   - Research primary sources (USA Fencing adoption/current rules and FIE rules) before presenting the current progression. Preserve official source links and clearly warn that this is an unofficial guide; do not present the Nov. 2025 chart/excerpt as current where it conflicts with the 2026 t.124 update.
   - Make individual direct-elimination and team explanations understandable to beginners, and verify their distinct mechanics before asserting details.

4. **Make penalty-group concepts meaningful to a novice**
   The user's exact questions/observations were:
   - **“What does Before Groups” mean? (maybe we can name this something else)**
   - **“I see first group, second group, etc. What does that mean? (while that may be the official wording, it's kind of meaningless to someone who has never seen the penalty chart before)”**
   - **“In the search screen, what is 1st, 2nd...” (same as what I was saying before)**
   - **“In the filter, what does groups mean?”**

   Address all surfaces where the term appears: learn/browse section headings, the `preamble` category currently shown as “Before groups,” the category eyebrow on each offense card, search/filter legend and chip labels, and how a user may search for the group. Explain in ordinary language what groups classify (penalty-chart categories/severity or typical penalty treatment, not bout rounds or stages), without implying every entry in a group has identical penalties. Use full, self-explanatory labels such as “Group 1” instead of unexplained “1st/2nd/3rd/4th”; give useful plain-language context for the groups and the preamble category. Keep official numbering/terminology visible where it helps users find the same category in the official chart.

### User's stated audience and perspective

The user explicitly asks us to look through the eyes of someone new to the sport. The app is intended to help beginner fencers and parents understand what a referee’s call means and quickly scan a penalty guide. Keep copy straightforward, concise, and immediately understandable; don’t assume readers have seen a penalty chart before.

### Completion standard

The task is not complete just because values have been filled or labels changed. Review the logic and information hierarchy, preserve source accuracy, verify the changed rules, and check all affected views at small/mobile widths. The handoff below records what has and has not been done so another session can continue without asking the user to repeat these requirements.

## Work already present in the working tree

### `site/favicon.svg` (created)

A small SVG favicon matching the site mark: dark-green rounded square with yellow, red and black card bars. `site/index.html` references it as an SVG favicon. `site/sw.js` includes it in the core offline assets and uses cache `fencing-penalties-v4` (previous value was v3).

### `site/index.html` (partially updated)

- Header version now says the chart is November 2025 and t.124 was updated October 2026.
- Unofficial-reference notice calls out the Oct. 1, 2026 t.124 update.
- Search intro/filter wording says "penalty group" and notes groups are not rounds/stages.
- About/source section distinguishes the Nov. 2025 chart from the Oct. 2026 passivity update and links the USA Fencing announcement and August 2026 FIE Technical Rules PDF.
- Earlier editing left several blank lines in the source link block; harmless but clean up when continuing.

### `site/app.js` (partially updated; needs review and verification)

- Learn section titles/subtitles use "Group 1–4" and plain-language context instead of "1st Group" etc.
- Group filter values display "Calls & passivity" and "Group 1–4"; search includes those labels.
- Cards display "Calls & passivity" or "Group N" in the eyebrow.
- Non-passivity penalty columns are labeled by offense/call count rather than unexplained "1st/2nd/3rd+"; optional later stages are omitted when empty.
- The redundant presence/passivity explainer paragraph is suppressed; other short explainers have been edited to remove repeated penalty progressions where possible.
- Passivity panel has a 2026-effective date, new individual two-step progression, team explanation, historical-source warning, and revised two-step P-card display.
- P-yellow card legend describes it as historical/removed, and passivity browse labels mention P-red then P-black.

**Caution:** the team-event sequence in `site/app.js` is not yet adequately verified. It currently says each team receives P-red the first time *that team* is penalized, then describes a P-black on its next passivity penalty. Do not consider that final. Confirm exact t.124 team timing and how often both teams receive P-red from the official August 2026 FIE Technical Rules PDF and USA Fencing adoption announcement before editing this copy further. Also verify the one-minute trigger wording and any score/timing exceptions against the 2026 text; the existing Nov. 2025 detailed exceptions were removed from the UI in favor of a warning to consult the current official text.

### `db/build_db.py` (partially updated)

- Passivity plain-language explainer mentions the Oct. 1 update and warns that the November 2025 chart is superseded for passivity.
- Some repeated penalty-progress explanations were blanked or shortened in `PLAIN` entries.
- The `OFFENSES` passivity penalty fields intentionally remain the verbatim 2025 chart (`P-yellow → P-red → P-black`), because they transcribe that chart. Do not change those source transcription fields to the 2026 sequence. The app should make the updated progression unambiguous and explicitly mark the embedded chart row/excerpt as historical for t.124.
- Build was not run after these edits; generated JSON/SQLite may not match the changed script.

## Source research completed

1. USA Fencing announcement (primary source):
   `https://www.usafencing.org/news/2026/september/20/p-yellow-card-eliminated-at-usa-fencing-events-beginning-oct-1`
   Search snippets say the Board adopted the FIE's 2025 Congress rule changes on Sept. 19, effective at USA Fencing events Oct. 1; t.124 removes P-yellow and uses a two-step P-red → P-black progression. `read_url` could not extract readable article text, but indexed search results returned the announcement and its claims.
2. FIE Technical Rules, August 2026 (primary rules PDF):
   `https://static.fie.org/uploads/40/204126-Technical%20rules%20August%202026%20ang.pdf`
   Search-indexed excerpts confirm t.124 wording that both fencers receive P-red at the first direct-elimination occurrence, then P-black at the second, decided by score or initial seeding. Another excerpt confirms team P-red cards are awarded to both teams simultaneously and says the P-black rule is specified separately in the team section. The PDF reader cannot extract PDF content; use official FIE document/search result snippets and/or a PDF-capable local workflow if available to transcribe exact team wording.
3. Australian Fencing Federation announcement (secondary federation confirmation):
   `https://www.ausfencing.org/adoption-of-updated-fie-p-card-rules/`
   Readable page confirms P-yellow removed, P-red after one minute, P-black after a further minute, and the score/seed decision for individual fencing. It describes AFF practice; do not treat it as a substitute for USA/FIE team text.
4. USA Fencing 2022 rules explainer for old team mechanics:
   `https://www.usafencing.org/news/2022/december/19/updated-unwillingness-to-fight-noncombativity-rules-take-effect-jan-1-2023`
   It describes the old 3-step progression and team consequences only; do not reuse its old card order as the new order.

## Verification not yet done

- No syntax check, database rebuild, automated data validation, or browser smoke test has been run after the partial edits.
- No complete official text audit of the October 2026 t.124 team clauses or score/clock exceptions has been completed.
- The source site still uses the Nov. 2025 rulebook/chart for the other 40 entries, so keep that source date and the unofficial-source disclaimer visible.
- This working tree has no `.git` directory according to a check in the project folder; do not rely on git status/diff for inventory.

## Suggested resume sequence

1. Read this note and inspect the live `site/app.js`, `site/index.html`, `site/styles.css`, `site/sw.js`, `site/favicon.svg`, `db/build_db.py`, and the current generated `site/data/offenses.json`.
2. Finish primary-source verification of 2026 t.124, especially team progression. Be conservative: omit a fine-grained team claim if it cannot be confirmed, while stating the verified two-step summary and linking the rules.
3. Fix/finish the passivity UI and label copy. Decide whether to show historical P-card values from the Nov. 2025 chart at all; if shown, visibly call them historical and avoid presenting them as current.
4. Clean the redundant explainers and group labels while preserving unique useful explanations and correct penalties.
5. Rebuild generated data using the project’s documented build script only after reviewing its file-writing effects; then validate JSON, syntax and app behavior on mobile and desktop.
6. Check favicon appearance and availability, source links, filters, search (including "1st"/"Group 1" novice-facing query behavior), and the passivity panel in a browser.
7. Update README/audit documentation only for findings that are verified; close this handoff note or replace it with a final report when done.
