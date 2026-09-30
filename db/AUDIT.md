# Audit report — penalty database (source of truth)

DB: `db/penalties.sqlite`, built by `db/build_db.py`. Exports: `site/data/*.json`.
Version: November 2025 rules. Transcription pass 1: 2026-09-29 (visual). Fix pass: 2026-09-29.

## Method (three layers)

1. **Pass 1 — visual transcription.** Both chart pages rendered at 250dpi (`pdftoppm`) and read
   as images. 41 penalty-chart rows entered with `as_printed` (literal, quirks preserved) +
   normalized `articles[]`. Passivity's t.124 rule is presented separately because the chart
   summarizes it as a single row while the rulebook specifies distinct procedures. Never
   transcribed from `pdftotext` flow alone.
2. **Automated checks.**
   - 41 chart entries; source offense titles checked against the chart, accounting for PDF
     line wrapping, footnote marks and punctuation.
   - All 66 distinct article refs resolve to an excerpt; 0 missing, 0 empty.
   - Build-script self-checks assert every `source_lines` pointer equals a grep-visible heading
     line, and no form-feed characters remain in excerpts. All pass.
3. **Pass 2 — independent verifier agent.** Re-rendered the PDF at 200dpi, checked all 41 rows
   field-by-field (wording, articles, merged-cell penalties, `*`/`+`/superscripts) + 6 excerpt
   spot-checks. Result: **no content discrepancies in offenses**; visual row count 41 = DB 41.

## Bugs found and fixed (by either layer)

- **Stale `source_lines` pointers (verifier found, fixed).** Root cause: parser used Python
  `splitlines()`, which splits on `\f` — and `pdftotext` emits 214 `\f` page breaks. Line numbers
  inflated ~62 lines by t.119 and grew with page count. Fix: delete `\f` (safe: rejoins words
  split across page breaks, leaves line count identical to grep/sed), split on `'\n'`. Pointers
  now match grep headings exactly (e.g. t.119 → 2232).
- **Apparent excerpt truncations (verifier flagged t.73, o.107 — same root cause).** The `\f`
  splits made excerpts *look* cut off mid-word / missing final paragraphs. After the fix, t.73
  runs to its true end (¶3) and o.107 through the anti-doping competence clause. No data loss.
- **Passivity was under-presented (2026-09-29 PDF comparison).** The chart has a single
  “Unwillingness to fight” row with P-yellow → P-red → P-black. Rule t.124 defines the trigger
  and separate individual direct-elimination/team procedures, plus score, seeding and timing
  conditions. The site now summarizes these separately. It must not imply the chart alone is
  the full procedure.
- **Weak Publicity Code excerpt (verifier flagged, fixed).** Was appendix TOC only. Now: appendix
  header + operative clause (individual-contract failure → "penalties as provided for in Articles
  t.158-162, t.168, t.170/3rd group"), which is exactly the chart's Red → Black. Pointer:
  `rules.txt:6935-6942+7176-7195`.
- **Verifier claim rejected with evidence — m.5.5.d.** Verifier reported the excerpt "does not
  contain the cited m.5.5.d clause". Direct query shows it does: tail contains "Any fencer or other
  person who tries to register touches in a way that does not comply with the rules ... will be
  excluded from the competition...". Verdict: excerpt CORRECT, flag was mistaken (likely read a
  stale pre-fix export). Kept as-is.

## Known source quirks (preserved, not silently fixed)

- `t.29,2` printed with a comma (covering-target row). Stored verbatim in `as_printed`;
  normalized to `t.29.2` in `articles[]`; noted on the row.
- `*` placement on the jostling row sits after "disorderly fencing" mid-list — annulment may apply
  only to that sub-offense, not mask removal/undressing. `annuls_touch=1` with an explicit note;
  needs a referee-manual cross-check before presenting as certain in UI.
- 3rd Group `Black¹` cell visually shared across 3 rows; modeled per-row with `shared` note.
- Cosmetic only: source prints `equipment*`/`touched*` (no space); DB stores `equipment *`.
  Meaning and flags unaffected.

## Figures — relevant-only, visually verified (2026-09-29)

User decision: embed only figures relevant to penalties. Weapon schematics, jackets, gauge excluded.
Contact-sheet verification caught 9 wrong mappings from the naive `pdfimages`-order guess
(strip files were actually referee signals; target slots were card-swatch thumbnails).

- Fig 1 (finals strip) + Fig 2 (standard strip): VECTOR diagrams — `pdfimages` can't see them.
  Cropped from 200dpi page renders (pdf p.23/24 = book pp.8/9, offset +15), crops visually
  confirmed to include plan + legend + note + side elevation (Fig 1) + captions.
  → `site/figures/fig-1.png`, `fig-2.png` (1400px wide).
- Fig 3 referee signals: native rasters `build/fig-004/005/006.png` (pdf pp.41-43), visually
  confirmed as signals artwork. → `fig-3a/b/c.png`.
- Fig 4/5/6 valid targets (foil/epee/sabre): native rasters `build/fig-007/008/009.png`
  (pdf pp.49/54/57), visually confirmed (blue = target area). → `fig-4/5/6.png`.
- Total `site/figures/`: 1.9MB. Offenses carry `figure_refs` (strips→leaving/crossing/enclosure;
  targets→covering/sabre-guard/off-target; signals→refusal/jostling/appeal).

## Source cross-check — 2026-09-29

Re-read the original local November 2025 chart and rulebook PDFs with `pdftotext -layout`;
compared against the exported chart rows and cited article headings. The source has 41 chart
rows, matching the database; all 51 distinct cited base-article headings appear in the rulebook.
A literal title comparison differs on 17 rows where PDF line wrapping, footnote markers, or
punctuation changes the extracted string; manual check found no missing offense. Important
source/database differences retained as printed include t.29,2 (comma), the t.137.3/4 range,
and the 4th Group shared Black penalty; these are transcription/normalization details rather
than omitted offenses. The chart has one passivity summary row, but the prior UI showed only its
three P-card cells; t.124's individual/team procedure was missing from the user-facing explanation.
The official rulebook PDF, chart PDF and rules-compliance page were verified and linked in the UI
and README.

## Plain language — draft status

`plain` table: 41/41 one-liners + explainers, all `status=draft`. They are concise guides
based on the chart, but have NOT had a parent/fencer read-through. Exported into `offenses.json`
as `one_liner`/`explainer`/`plain_status`. They are not authoritative; show each beside the
chart penalties and retain access to the cited rule text.

## Pivot-ready schema

- `offenses(id, section, sort, offense_official, as_printed, articles_json, pen_first/second/third,
  annuls_touch, team_special, superscript, notes)` — 41 chart rows; t.124 passivity detail is shown in the app.
- `articles(ref, base_ref, book, excerpt, verified, source_lines)` — 66 rows, `verified=0`
  until human line-by-line sign-off (content already machine-verified genuine).
- `figures(num, caption, rules_txt_line, file, related)` — 16 rows (Fig 1–16).
- `card_legend`, `footnotes` (`*`/`+`/`1`–`4`), `meta` (version, source, transcription date).
- `site/data/*.json` regenerated from SQLite on every build — the site never hand-edits data.

## October 2026 overlays

See `docs/RULE-UPDATES-2026-10.md` for the completed primary-source audit.
`rule_updates(offense_id, content_json)` holds current guidance for t.124, t.72
and t.20, exported to `site/data/updates.json`. Original chart cells and excerpts
remain November 2025 transcriptions; the UI labels changed excerpts historical.

## Standalone consequences — September 29, 2026

Source superscripts and penalty cells remain unchanged. `entry_effects` stores
plain meanings for exclusion scope (event, tournament, venue), serious-case
immediate action, touch cancellation and team-wide Yellow warnings. These export
as `effects` on each offense. Mixed scope 1/2 stays “event or tournament”; the UI
does not invent a choice rule. Jostling's cancellation is limited using t.121.2;
mask removal and undressing are not automatically assigned cancellation.
The main app displays consequences beside penalties and omits source-note numbers.

## Reviewed search vocabulary

`db/search_terms.json` supplies one reviewed entry per offense, with terms, cited
basis and review notes. `search_vocabulary` stores these separately from source
penalties and normative excerpts; `search_terms` exports with each offense.
The builder checks coverage, duplicate aliases and reference pointers. Search
tests cover expected rankings, ambiguity, conservative typos, exact citations
and unknown queries. Search never mutates reference fields or generates rulings.
The one-time comparison against the pre-search Git snapshot confirmed all
existing exported offense fields remained unchanged. See docs/SEARCH.md.

## Source-library relocation — September 30, 2026

Publisher PDFs and full text now live under `research/`; source IDs/legacy paths
and SHA-256 hashes are in `research/sources.json`. The rulebook extract bytes and
line positions are unchanged. Existing `rules.txt:<lines>` source pointers mean
`research/extracted/usa-rules-2025-11.txt`. Builder input paths were updated;
this organization change must leave all penalty and scoring runtime exports
unchanged. `build/fig-*.png` remains the legacy extracted image staging area.


Reconciliation (2026-09-30): domestic review routes now cite the 2026–27 Operations Manual and Athlete Handbook alongside the November rulebook. Equipment tests, video, rule application and scoresheet correction are separate. The penalty t.117 extraction collision is fixed with a source-boundary regression check. The unsupported o.79 finishing-double citation was removed; regulation DE 14–14 remains an explicit research gap.
