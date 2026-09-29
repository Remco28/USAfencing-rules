# USA Fencing — Penalty Quick Reference

A mobile-first, unofficial guide to the November 2025 USA Fencing penalty chart.
Browse by situation, search by citation, or filter by card and weapon. Each entry
pairs a plain summary with its chart penalties and cited rule text. It includes the October 1, 2026 USA Fencing updates for individual/team passivity,
mask safety and warm-up requirements. The static site runs on
GitHub Pages and can be used offline after it has loaded.

## October 2026 update

The initial project is saved in Git commit `ff79d50` on the public repository
[Remco28/USAfencing-rules](https://github.com/Remco28/USAfencing-rules).
The verified adoption and exact rule-clause mapping are recorded in
[docs/RULE-UPDATES-2026-10.md](docs/RULE-UPDATES-2026-10.md); research is complete.
The FIE PDF is kept locally as `FIE_Technical_Rules_August_2026.pdf`, with its
text in `build/fie-technical-2026.txt`. USA Fencing adoption controls domestic changes.

Rebuild data with `python3 db/build_db.py`. Current guidance is stored in the
SQLite `rule_updates` table and exported as `site/data/updates.json`. The original
2025 chart cells and excerpts remain intact for comparison.

Preview: `python3 -m http.server 8000 --directory site`, then open
http://localhost:8000. For human testing, open
`human_feedback/round-2026-10-beginner-guide/index.html` directly in a browser.
Export its feedback ZIP before closing and put it beside the guide.

## Official source links

- [USA Fencing Rules for Competition — November 2025 (PDF)](https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt0f86b976c72458f2/690baa8337acae1b6b5ac0d3/2025-11_USA_Fencing_Rules.pdf)
- [USA Fencing Penalty Chart — November 2025 (PDF)](https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt803f2e6496b433ce/690baa837e4cc4746887c300/2025-11_USA_Fencing_Penalty_Chart.pdf)
- [USA Fencing Rules & Compliance](https://www.usafencing.org/rules-compliance)

## Sources (in this folder)

| File | Pages | Notes |
|------|-------|-------|
| `2025-11_USA_Fencing_Rules (1).pdf` | 214 | Text layer present (Word for M365, tagged). Normative source. |
| `2025-11_USA_Fencing_Penalty_Chart.pdf` | 2 | Text layer present + AcroForm. 12 tiny swatch images = card colors. Source for data model. |
| `USA_Fencing_Athlete_Handbook_2026-27-Sept-27-2026.pdf` | 88 | InDesign, mostly full-page decorative backgrounds. Out of scope for v1. |

UI source dates: **November 2025 chart · October 2026 updates**. Changed entries explicitly mark their older excerpts as historical.

## Locked decisions

1. **Preprocessing: simple text extract.** `pdftotext -layout` (poppler, already installed).
   No OCR needed — all three PDFs have real text. No `pymupdf`/`marker`/paid tools unless
   layout proves insufficient.
2. **Text is normative, diagrams are guidance.** The rulebook itself repeats:
   _"This diagram is for guidance purposes only. In case of any doubt, the wording
   of the appropriate text takes precedence."_ Accuracy = text must be exact; figures are aids.
3. **Diagrams: relevant-only, embedded.** Only 6 figures matter for penalties: Fig 1–2 strips
   (page-render crops, visually verified with captions), Fig 3 referee signals (3 native rasters),
   Fig 4–6 valid targets (native rasters, blue = target). Weapon schematics, jackets, gauge
   excluded per your call. All in `site/figures/` (1.9MB), linked per-offense via `figure_refs`.
   Mapping verified via contact sheet after a naive guess got 9 slots wrong — see `db/AUDIT.md`.
4. **Colors carry meaning — store as meaning, not pixels.** Chart swatches →
   explicit `card: yellow | red | black | p-yellow | p-red | p-black` +
   `meaning: warning | penalty touch | exclusion | ...`. Labels + icons always accompany
   color (color-blind safe, print-grayscale safe).
5. **Accuracy bar: full audit.** Every chart row (`offense | articles[] | 1st | 2nd | 3rd | group | annuls?`)
   checked cell-by-cell against `chart.txt`. Every `t.xxx` in chart must exist in `rules.txt`.
   Every `Figure N` caption accounted for. Second-pass diff before calling data good.
6. **Users:** competitive fencers, coaches and parents. Referees should use the official book.
7. **Two uses:** a complete reference for study and a quick lookup when a card is shown.
   Strip-side means look up the call; the page does not issue rulings.
8. **Content pattern per offense:** concise summary → official offense title →
   visual `1st → 2nd → 3rd` escalation + chart badges (`*` annuls touch, `+` team special) →
   collapsible rule excerpt with citation and relevant figure. Rule t.124 passivity includes
   individual/team escalation, score/seeding conditions and timing exceptions beyond the chart’s
   P-yellow/P-red/P-black summary; include the full procedure in the UI.
9. **Format: static site for GitHub Pages, mobile-first.** No native iOS/Android.
   `HTML + CSS + JS + JSON`, no backend, offline after first load. Browse by situation,
   search by citation or terms, filter by card/group/weapon, browse by card, and view
   diagrams or source details.
10. **Tone: straightforward and concise.** Plain summary first; official offense name and rule text for detail.
11. **Interface:** large touch targets, readable in bright venues, fast client-side search, piste-inspired colors. Always pair card colors with labels.
12. **Build location:** `site/` in this repo, GH-Pages-ready.
13. **Database first, UI second.** `db/penalties.sqlite` (built by `db/build_db.py`) is the source
    of truth — 41 offenses, 66 cited refs with verbatim excerpts, 16 figures, card legend,
    footnotes. `site/data/*.json` is regenerated from SQLite on every build, never hand-edited.
    Any future build (quiz app, ref tool, printables) reads the same DB. Accuracy procedure in
    `db/AUDIT.md` (visual transcription + automated checks + independent verifier agent).

## Scope v1

Penalty chart + linked rule excerpts + figures, with the t.124 passivity procedure needed to explain the P-cards. NOT a full rulebook rewrite. Handbook out of scope.

## Copyright / freshness

- Personal, family use only (you + your kids). Per your call: include verbatim rule excerpts
  with `t.xxx` citations. Show an unofficial-reference notice, version date and link to the
  official rules on usafencing.org. Do not redistribute commercially.
- Rulebook footer for reference: © 2025 USA Fencing. Chart states it "is not a substitute
  for the full texts ... which should be consulted in any case of doubt."
- Source files cross-checked on 2026-09-29: all 41 chart rows and 51 distinct cited rule-article
  headings are present. See `db/AUDIT.md` for details and source quirks.
- Rules update yearly-ish; plan for re-extract + diff when a new November revision drops.
