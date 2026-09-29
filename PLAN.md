# Build plan — interactive penalty reference

## Phase 0 — Extract (no guessing)
1. `pdftotext -layout` all three PDFs → `build/rules.txt`, `build/chart.txt` (handbook extract for completeness only).
2. `pdfimages -png` rules PDF → `build/figures/` + `build/figures.json` (`figure, caption, page, related articles`).
3. Inventory check: list all `Figure N` captions found in text vs images extracted; flag gaps.

## Phase 1 — Structure + audit
4. Hand-transcribe chart into `site/data/chart.json` with schema:
   `id | group (1-4, plus presence/unwillingness preamble) | offense_plain | offense_official |
   articles[] | penalties {first, second, third} | card fields | annuls_touch (bool, `*`) |
   team_special (bool, `+`) | footnotes[] | figure_refs[] | plain_explainer (1 line) |
   verbatim_excerpts[] {article, quote, rules_txt_line_ref}`
5. Full audit: second pass cell-by-cell vs `chart.txt`; script-check every `articles[]` entry
   greps in `rules.txt`; missing-article report must be empty before proceeding. Compare each
   chart summary with the complete cited rule, particularly t.124 passivity procedures.
6. Pull verbatim excerpts only for cited articles (not whole chapters) to stay excerpt-only per copyright note in README.

## Phase 2 — Site (static, GH Pages, mobile-first)
7. `site/`: `index.html`, `styles.css`, `app.js`, `data/chart.json`, `figures/` (optimized copies).
8. Views: Browse by situation / Lookup (search + card/group/weapon filters) / By-card lookup /
   Diagrams + About. Show the full t.124 passivity procedure, not only the chart’s P-card ladder;
   link the November 2025 source PDFs.
9. Accessibility/perf: labels + icons with every color, keyboard + screen-reader usable,
   Lighthouse-mobile friendly, works offline after first load, sunlight-readable type.

## Phase 3 — Verify
10. Audit report in `build/AUDIT.md`: who checked what, date, remaining doubts (ambiguous cells listed, not silently resolved).
11. Human spot-check of high-risk rows (`*` annulments, P-cards, Groups 3–4 Black cards) + parent-readability read-through.
12. `site` builds with no build step (or single `npm run build` if Vite chosen) and deploys to `gh-pages` branch.

## Open questions for build — RESOLVED 2026-09-29
- Hand-rolled HTML/CSS/JS, zero build step. `site/` deploys as-is.
- Offline via service worker (`site/sw.js`, cache-first same-origin) + bundled JSON.
- Figures capped at 1400px wide; `site/figures/` = 1.9MB total.

## Deploy
- Preview locally: `cd site && python3 -m http.server` → http://localhost:8000
  (must serve over http; browsers block data JSON on file://).
- GitHub Pages: publish the `site/` directory (repo Settings → Pages → deploy from branch,
  `site/` folder). No build command.
