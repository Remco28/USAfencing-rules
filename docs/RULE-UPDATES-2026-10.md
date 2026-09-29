# Verified October 1, 2026 updates

Research completed September 29, 2026. The UI deliberately treats October 1 as
current, as requested in the original task. Do not restart source discovery;
revisit these findings only for a new official revision or a concrete discrepancy.

## Primary sources

- [USA Fencing adoption announcement, September 20, 2026](https://www.usafencing.org/news/2026/september/20/p-yellow-card-eliminated-at-usa-fencing-events-beginning-oct-1).
  Full article read successfully in Chromium with agent-browser; simple extraction
  returned 403. Board approval September 19; domestic effective date October 1.
- [FIE Technical Rules, August 2026](https://static.fie.org/uploads/40/204126-Technical%20rules%20August%202026%20ang.pdf).
  Saved as `FIE_Technical_Rules_August_2026.pdf`; text extracted with
  `pdftotext -layout` to `build/fie-technical-2026.txt`.

## t.124 clause audit

| Clause | Printed page / extracted lines | Verified behavior |
|---|---|---|
| Definition | 40 / 2171–2175 | One minute of fencing without a hit or off-target hit; referee halts. |
| 1.a–b | 40 / 2180–2198 | Individual DE: simultaneous P-red first; second occurrence P-black to lower score, or lower initial seeding at a tie. |
| 2.a–b | 40 / 2200–2216 | Teams: simultaneous P-red first; second occurrence P-black by score or initial seeding. No third-occurrence step. |
| 3.a | 40 / 2219–2226 | History applies within the bout/match, across all nine relays; no P-cards at 14–14 / 44–44. |
| 3.b | 40 / 2228–2230 | P-black is a bout/match loss; classification and corresponding points remain. |
| 3.c–e | 41 / 2236–2243 | Continue period/relay after P-red; restart timer at touches, annulled/off-target/penalty hits and period/relay starts; keep P-cards separate. |
| 3.f | 41 / 2245–2246 | At a tied score when regulation expires, use t.40.3 / t.41.5 instead. |

The FIE seeding clause refers to its ranking and draws among unranked individual
fencers. The beginner guide explains initial seeding without inventing a domestic
ranking procedure, and tells readers to check their event's official seeding.

The PDF contains an older passivity chart row adjacent to the newer row on page 49.
The operative t.124 text on pages 40–41 is the source for current guidance.

## Other domestic updates

The USA announcement also identifies t.72 mask secondary safety devices/straps
and t.20 full equipment for practice bouts, chest protectors for fencers taking
lessons, and long pants for coaches. It explicitly says the FIE knee-covering
requirement was not adopted domestically. These two entries now show an update
panel sourced to the USA announcement; their November excerpts are historical.
This is a chart reference with these verified updates, not a full-rulebook audit.

## Content and data decisions

- Keep all 41 original chart rows and 66 article references, including the old
  P-yellow row, unchanged in the source transcription.
- Store current summaries with dates and source URLs in `rule_updates` in SQLite;
  the builder exports `updates.json`. The app never presents the historical
  P-yellow cells as the current progression.
- Display historical labels before readers open outdated excerpts.
- Remove explainers that repeat chips; retain definitions, annulment and team
  exceptions. Spell out group numbers and offense/call counts.
- Preserve the existing favicon. Cache current updates and all eight diagrams
  on the first complete online load.

## Completed validation

- Database rebuild: 41 offenses, 66 cited references, all excerpts and source
  pointers match; no missing excerpts or plain summaries.
- Confirmed the 2025 `OFFENSES` transcription is unchanged from baseline `ff79d50`.
- JavaScript syntax and Git whitespace checks passed.
- 24 browser assertions passed at 320px, 375px and 1280px: current individual/team
  progression, historical labels, score exceptions, group/citation/current-update
  search, filters, card browsing, diagrams and no horizontal overflow in any tab.
- Offline reload with the HTTP server stopped: all 41 entries, current updates
  and diagram bytes loaded from the service worker cache. The installed
  agent-browser offline toggle did not actually block requests, so stopping the
  dedicated local server was used for a reliable check.
- Standalone file:// feedback guide export with one image produced a valid ZIP
  containing `feedback.md`, `feedback.json`, `round.json` and a screenshot; answers
  and project metadata checked after decoding.

Repeat the browser assertions on the served guide with:

```sh
agent-browser open http://localhost:8000
agent-browser eval --stdin < tests/browser-check.js
```

Human wording feedback remains a human test, not an automated accuracy claim.
Open `human_feedback/round-2026-10-beginner-guide/index.html`, export before closing,
and put `human-feedback-round-2026-10-beginner-guide.zip` beside that page.
