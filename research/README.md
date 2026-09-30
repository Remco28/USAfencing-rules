# Shared fencing source library

Browse the [source catalog](SOURCE-CATALOG.md). Start with [Scoring findings](scoring/FINDINGS.md), then the
[cited research inventory](scoring/INVENTORY.md). These are research artifacts;
the guide's published situations are authored separately in
`db/scoring_cases.json`.

## Layout

```text
research/
  SOURCE-CATALOG.md         readable bibliography with edition and scope
  sources.json              source IDs, versions, authority, URLs and SHA-256 hashes
  sources/usa-fencing/      unchanged PDFs and captured official webpage documents
  sources/fie/              unchanged international PDFs and directory snapshot
  extracted/                full layout-preserving PDF text and webpage text
  article-index.json        article → source, original lines and physical PDF pages
  articles/<source-id>/     generated complete heading-bounded article extracts
  pages/<source-id>/        generated full-page domestic context extracts
  scoring/topics.json      authored findings, facts, draft vocabulary and limits
  scoring/INVENTORY.md      generated readable topic inventory
  scoring/FINDINGS.md       interpretation issues, product implications and gaps
  build_inventory.py       offline provenance validation and deterministic generation
```

PDFs retain publisher bytes. Web sources are rendered main-content text/link
snapshots in JSON, with equivalent readable `.txt` extracts; they are explicitly
identified as captures rather than publisher PDFs. This avoids executable scripts,
adverts and browser chrome in the archive. Source records keep the publisher URL,
capture date, version, authority and intended scope. No third-party blog or forum
is used as rule authority. Training/video links are leads, not silently accepted
interpretations.

The USA rulebook, chart, handbook and FIE technical PDF were already in this repo.
They were relocated, not replaced. Original text bytes were retained to preserve
existing source line coordinates. New documents are the 2026–27 USA Operations
Manual and August 2026 FIE Material/Organisation Rules. Original root filenames
are recorded in `sources.json`. Old `rules.txt:` pointers in exported penalty data
mean `extracted/usa-rules-2025-11.txt`; this shorthand remains stable so moving
sources does not change penalty data. `build/` now holds legacy extracted figures,
not the authoritative documentation library.

## Source precedence and scope

- Use domestic rules and verified USA updates for USA events. The current full
  rulebook is November 2025; newer changes can be authoritative separately.
- The official Operations Manual page says to defer to the current Athlete
  Handbook. That statement concerns domestic operations; do not turn it into a
  blanket claim that every handbook paragraph supersedes every technical rule.
- FIE August 2026 books provide comparison and international context. A newer FIE
  date alone does not establish domestic adoption.
- The February 2025 sabre guard interpretation is official domestic guidance.
  Its applicability and exclusions belong with the proposed scenario.
- Existing October 2026 work is complete in
  [the rule-update audit](../docs/RULE-UPDATES-2026-10.md). Reuse it rather than
  repeatedly re-discovering passivity. Historical t.124 extracts stay labeled.

## Reproduce and maintain

```sh
python3 research/build_inventory.py
python3 research/build_inventory.py --check
python3 db/build_db.py
python3 db/build_scoring.py
```

Generation is offline and does not fetch newer documents. `--check` validates
hashes, complete USA technical-article coverage, unique IDs, topic citations and
generated files. Hash matching confirms provenance; it does not approve an
interpretation. Header-based extracts can include following headings, cross-
references and historical language. Layout text cannot reproduce every diagram or
multi-column reading order; use the PDF for those. PDF-page locators are physical
viewer pages, not necessarily printed rulebook page numbers.

For a new revision, save a new versioned file and source ID, retain the previous
version, record publisher URL/date/scope, generate full text with `pdftotext
-layout`, review affected clauses and update hashes. Amend topic findings and
publication limits before promoting content to the app. New extraction does not
silently change an existing cited version. Never fetch on each build or research
the same completed change without a new source or specific unresolved question.

Sources and research are public in Git but remain outside `site/`, so Pages does
not package the library into the app or its offline download.

Repeated printed article headings are retained with occurrence suffixes such
as `o.53--2`; `printed_ref` records the original number. The inventory does not
silently correct publisher numbering. Table/index cross-references are excluded
from article boundaries using the pinned document layout.

## Collected sources

There are 15 pinned sources: seven PDFs and eight official webpage captures.
The practical inventory has 69 topics with facts and draft search phrases. The
article index includes all 178 USA technical articles plus material and
organization context and international comparison articles. Complete extracts
also preserve subjects outside the companion scope. Read `scoring/FINDINGS.md`
for the remaining interpretation and legacy extraction issues.

## Human research review

Open `human_feedback/round-2026-09-30-scoring-research/index.html` directly in a
browser to review findings, missing situations, vocabulary and next priorities.
Export the ZIP before closing; answers and screenshots stay only in the open
page until export. Put the ZIP beside its HTML guide.

Validation for this phase: all original PDF/extract bytes preserved; 717 article
records (including all USA and FIE technical articles, all 60 FIE material and
119 FIE organization articles) indexed; 69 topic citations and 20 context pages
checked; 302 local documentation links resolve. Both app data rebuilds and
retrieval suites pass, and runtime JSON exports remain unchanged.
