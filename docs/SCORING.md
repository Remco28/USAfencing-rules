# Scoring companion

The guide lives at https://penalties.teamremco.org/scoring/. Both guides share
this repository, source library and GitHub Pages deployment.

## Current scope

The collection has **82 situations and 141 validated source excerpts**. Shared
entries give 62 épée, 63 foil and 63 sabre uses. Weapon choice is remembered;
search stays visible and category filters start collapsed. Each explanation
states conditions, questions to establish, source wording and related situations.
Optional fact notes describe uncertainty; they never compute a verdict.

The [coverage map](https://penalties.teamremco.org/scoring/#/coverage) maps every
topic in our 69-topic practical research inventory. This is **not a claim that
every rulebook provision or possible fencing situation is explained**.

| Weapon | Inventory topics | Bounded explanations | Partial coverage |
|---|---:|---:|---:|
| Épée | 54 | 48 | 6 |
| Foil | 52 | 40 | 12 |
| Sabre | 53 | 41 | 12 |

“Bounded” means the listed situation and stated conditions are explained; it is
not independent referee certification. A partial topic identifies what remains
outside its explanation. See [the maintained map](../research/scoring/COVERAGE.md).
Topic counts and case counts measure different things; many cases share a topic.

Épée limits include modified finishing targets/team 44–44, all local/age-specific
adaptations, medical diagnosis and staffing exceptions, complete equipment
inspection/certification, every electrical test, and all qualification/rating or
disciplinary systems. Basic foil/sabre written conventions are included, but
borderline visual priority judgments are not a complete interpretation curriculum.

## Finishing doubles and source distinctions

Standard épée 14–14 doubles are annulled; the score stays 14–14. This established
practice was confirmed by the user and corroborated by an official USA Fencing
competition report. We archived only the relevant 22-word report excerpt. It is
labeled **corroborating competition report**, not a rule amendment. An explicit
14–14 provision has not been located in the pinned rulebook; that is a citation
gap, not uncertainty about the included standard practice. Do not infer modified
targets or team 44–44 from it. Pool 4–4 and deciding-extra-minute doubles have
their separately quoted provisions in t.38/t.40/t.41.

The unsupported o.79 citation was removed earlier: that article is about
withdrawal. Current content does not cite it for finishing doubles.

## Sources and maintenance

Authored content lives in `db/scoring_cases.json`; generated browser data is
`site/scoring/data/cases.json`. Do not edit the generated file. The pinned library
has 16 sources: seven PDFs, eight official webpage captures and one selected
competition-report excerpt. [The catalog](../research/SOURCE-CATALOG.md) records
editions, publisher URLs, authority, scope and hashes.

Use domestic sources and verified USA adoption for USA events. FIE editions are
comparison material, not automatic domestic authority. Reuse the completed
[October update audit](RULE-UPDATES-2026-10.md); the non-combativity case reuses
its reviewed individual/team guidance and labels its October 1 effective date.
Historical November t.124 wording must not silently replace current guidance.

`db/build_scoring.py` checks every excerpt against the pinned article or declared
source/page/column range. It rejoins layout line-end hyphens and ignores whitespace;
it does not rewrite passages. It rejects empty/fabricated quotes, missing sources,
invalid related-case links and unmapped topic/weapon combinations. Source details
show document title, edition, authority and physical PDF page where available.
Exact text matching validates provenance, **not the interpretation of the rule**.

Add a case only after checking its clause, exceptions, weapon applicability and
event scope. Add reviewed everyday search terms and a retrieval example. Map the
case to its inventory topic, preserving partial limits. For revisions, archive a
new version and source ID, then compare affected content; builds never auto-fetch.

## Procedure and interface

Equipment testing, official video, rule-application protest and scoresheet
correction are separate routes. The newer domestic Operations Manual describes
Head Referee screening and full Bout Committee appellate review. The guide also
shows the November t.174 wording and asks officials to identify the event's
applicable procedure. It does not promise a right to overturn a factual call.

Cases link at `#/case/<id>` and the coverage map at `#/coverage`. Weapon scope is
strict; a direct link to another weapon offers an explicit switch. Search uses
the shared local engine and reviewed aliases; see [SEARCH.md](SEARCH.md).
The navy/blue companion links back to the penalty guide. Diagrams explain bounded
examples, not observed facts or priority judgments.

The `/scoring/` worker has its own `fencing-scoring-*` cache; both guides preserve
each other's scope and caches. After a complete online visit, the guide, search,
coverage map and excerpts work offline. Official PDF links require a connection.
Research archives remain outside the Pages artifact.

## Verification and human review

```sh
python3 research/build_inventory.py --check
python3 tests/source_extraction.py
python3 db/build_db.py
python3 tests/scoring_sources.py
python3 db/build_scoring.py
node tests/search.test.cjs
node tests/scoring.test.cjs
python3 -m http.server 8000 --directory site
agent-browser open http://localhost:8000/scoring/
agent-browser eval --stdin < tests/scoring-browser.js
agent-browser eval --stdin < tests/scoring-all-cases-browser.js
```

The exhaustive browser sweep checks every case in each applicable weapon view,
source rendering, related links and expanded-panel overflow. Source rejection
fixtures check provenance failures. Neither these checks nor inventory mapping
certifies all interpretations. Independent referee review and concrete missing
or misleading searches remain useful.

Open `human_feedback/round-2026-09-30-scoring-coverage/index.html` directly in a
browser. Try any useful scenarios, add screenshots if helpful, and **export the
ZIP before closing**. Put the ZIP beside the guide. Nothing is uploaded or saved
to the repository by the form.


### Comprehensive release checks — September 30, 2026

- All 141 excerpts pass pinned-source validation; seven negative fixtures reject
  false/empty quotes, wrong pages, missing sources and invalid related links.
- All 95 scoring retrieval examples and 36 penalty examples pass, with additional
  weapon/citation boundaries and reviewed-phrase/no-fallback checks.
- All 188 applicable case/weapon views render matching titles, summaries and
  source text, valid related links and expanded panels without overflow at 375px.
- The 47 scoring browser checks pass at 375px and 1280px, and after offline reload.
  The 28 penalty browser checks pass at both widths and after offline reload.
- The standalone review form opens locally with seven scenarios and no external
  assets; ZIP export contains readable answers, structured data and round metadata.

These results establish software behavior and excerpt provenance, not complete
rule interpretation accuracy or official referee endorsement.
