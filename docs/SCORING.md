# Scoring companion

The companion lives at `penalties.teamremco.org/scoring/`. Both guides are authored
in this repository and published by the same Pages workflow. No additional domain,
deployment repository, backend or paid hosting is required.

## Experience and first collection

The default is épée. Weapon choice stays visible and is remembered in browser
localStorage. Search stays visible, categories occupy a small optional row, and
each card leads to a short explanation, applicable conditions, source excerpts,
optional fact notes and the review procedure. Notes never compute a verdict.
Direct links use `#/case/<id>`; selected weapon is explicit even for shared cases.
A link to a different weapon's case offers a deliberate weapon switch.

Ten reviewed situations cover six épée, five foil and five sabre uses. The initial
épée focus includes the four requested scenarios: side exit near the rear line,
passing and turning, a floor light, and a missing light with a disconnected plug.
Foil/sabre priority entries explain the role of conventions but do not pretend to
resolve every attack/counterattack. Complete priority, score/time outcomes and
video procedure are future content, not implied coverage.

The distinct navy/blue interface uses bounded diagrams for boundaries and passing.
Diagrams do not establish facts, resolve priority or replace rule wording.

## Sources and audit

Domestic source: preserved November 2025 USA Fencing rulebook and
`research/extracted/usa-rules-2025-11.txt`. USA Fencing's official rules page still identifies that edition
as its current full rulebook (checked September 30, 2026). The completed
October-update audit is shared at `RULE-UPDATES-2026-10.md`; those findings are not
rediscovered or silently extrapolated to every international change.

Authored data: `db/scoring_cases.json`. Each situation has reviewed vocabulary,
source references, conditions, questions, scope caveats and applicable weapons.
Source excerpts are selected verbatim passages, not complete articles.
`db/build_scoring.py` requires every excerpt to occur in the cited base article
of the preserved USA source and validates IDs, weapon coverage and required fields.
It exports `site/scoring/data/cases.json`. Do not edit the generated file.

| Situation | Sources | Distinction preserved |
|---|---|---|
| Side exit | t.22.9, t.33.1, t.34–36 | Side exit costs ground; both feet beyond rear line matters; attack-start and accidental-exit exception. |
| Passing | t.23.3, t.27.2, t.28.1–2, t.101.5 | Passing fencer vs passed fencer; immediate vs later touch; sabre crossing restriction. |
| Floor light | t.54–56, t.91, t.93–94 | Foot vs ground; observed location vs demonstrated fault; successful grounding test does not prove original location. |
| Missing light | t.28.3, t.47.2.d, t.54.2, t.56, t.94.2, t.95.1, m.55.4 | Precise plug location; retaining-device exception; post-hit reel tear-out; annulment cannot create a missing point. |
| Épée double | t.33.4, t.91–92, t.94.5 | Both registered touches must be valid; boundary exceptions. |
| Halt | t.23.3–4, t.28.2, t.33.4, t.55.1 | Already-started movement vs new action; specific stop conditions still apply. |
| Foil white light | t.77.2, t.78 | Ordinary off-target stops the phrase; covering/substitution not covered by this basic case. |
| Foil two lights | t.54.2, t.82 | Registration vs conventions; detailed priority not yet covered. |
| Sabre two lights | t.54.2, t.100 | Registration vs conventions; detailed priority not yet covered. |
| Sabre off target | t.98 | Ordinary off-target does not stop the phrase; other stopping faults can. |
| Review route | t.172–175, t.56 | Facts vs definite rule; individual fencer/team captain; immediate request; Head Referee rather than blanket Bout Committee advice. |

Important: clause matching and software tests validate provenance and behavior,
not every interpretation. Human referee review remains valuable. Future rule
revisions should trigger a targeted comparison of these clauses, explanations
and vocabulary. FIE text is a comparison source, not automatic USA authority.

## Search, cache and verification

Both guides use `site/search.js`; scoring maps its titles and summaries into the
existing index shape. Reviewed aliases stay with their scoring case. Weapon and
category filters are strict. Related matches are labeled. See `SEARCH.md` for
ranking, typo and citation behavior. New synonyms need concrete examples and a
retrieval test; they must not broaden a rule's scope.

Scoring registers `scoring/sw.js` with `/scoring/` scope and a separate
`fencing-scoring-*` cache. The parent worker excludes companion requests and
does not delete scoring caches. The companion excludes penalty requests, and
only shares the search script. Both guides can work offline after their own
complete online visit. External official PDF links require a connection.

```sh
python3 db/build_db.py
python3 db/build_scoring.py
node tests/search.test.cjs
node tests/scoring.test.cjs
python3 -m http.server 8000 --directory site
agent-browser open http://localhost:8000/scoring/
agent-browser eval --stdin < tests/scoring-browser.js
```

Review with `human_feedback/round-2026-10-scoring/index.html`. Export the feedback
ZIP before closing and put it beside the guide. Questions include misleading
conditions, missing vocabulary, weapon selection, fast lookup and review wording.

## Release validation — September 30, 2026

- 41 scoring excerpts match their cited base articles in the stored USA rulebook.
- 22 scoring retrieval examples, strict weapon exclusions, exact-subsection
  negatives and content nonmutation pass; all 36 penalty retrieval examples pass.
- 22 scoring browser assertions and 28 penalty browser assertions pass at 320px
  and 1280px. Checked weapon persistence, cross-weapon deep links, source details,
  fact notes, passing stages, search from a detail and no horizontal overflow.
- Both complete browser suites pass with the dedicated HTTP server stopped,
  proving actual offline data, search and source/diagram availability. Official
  PDF links remain online-only. Both scoped service workers coexist.
- Rebuilding the penalty database leaves its checked-in data unchanged.
- The shared domain has an approved certificate and enforced HTTPS; `/scoring/`
  needs no DNS changes.

These checks do not certify every explanation as an official interpretation.
Human review of the conditions and procedural wording is part of this release.

## Research phase

The shared [source library](../research/README.md) now has pinned publisher
documents, complete extracts and a cited [scenario inventory](../research/scoring/INVENTORY.md).
Read [research findings](../research/scoring/FINDINGS.md) before expanding content.
In particular, the 2026–27 Operations Manual gives a more detailed domestic
on-strip protest route than the original guide's blanket Head Referee wording.
That procedure needs reconciliation and revision; the original release checks
validated the implementation, not completeness of procedural interpretation.
