# Fencing Penalties — Quick Reference

A mobile-first, unofficial reference for fencers and parents. Find a situation,
understand the card and its consequences, and open the cited rule when needed.
Readers do not need the external penalty sheet or its note-number conventions.
The app retrieves reference information; it does not issue rulings.

## Current behavior

- Browse 41 situations, with category shortcuts and clearly explained groups.
- Search everyday descriptions, equipment names, exact citations and modest typos.
  Ranked results distinguish related matches. Card/group/weapon filters are strict.
- The search field stays visible; filters start collapsed and show active selections.
- Entries integrate touch cancellation, exclusion scope, serious-case exceptions
  and team warnings beside the penalty progression.
- Official offense titles and verbatim excerpts are inside expandable details.
  Shared article excerpts appear once; all cited references remain available.
- Tabs retain reading positions. By card can open a filtered search.
- The existing card-bar favicon and eight relevant diagrams are bundled.
- Everything runs locally in the browser and works offline after a complete online
  load. No backend, LLM calls, analytics or model downloads.

This static site is compatible with GitHub Pages. Repository:
[Remco28/USAfencing-rules](https://github.com/Remco28/USAfencing-rules).
GitHub Pages automatically publishes validated changes from `main` to
https://penalties.teamremco.org once DNS is configured. See [deployment setup](docs/DEPLOYMENT.md).

## Run and verify

```sh
python3 db/build_db.py
node tests/search.test.cjs
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000. The app needs HTTP to load bundled data; the feedback
forms below can be opened directly as files. Browser regression checks:

```sh
agent-browser open http://localhost:8000
agent-browser eval --stdin < tests/browser-check.js
```

## Sources and accuracy

The original November 2025 chart/rulebook transcriptions are preserved. Current
guidance includes the October 1, 2026 USA Fencing changes for t.124 passivity,
t.72 mask safety and t.20 warm-up requirements. Changed entries clearly label
older excerpts as historical. Official rules take precedence.

- [November 2025 USA Fencing Rules PDF](https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt0f86b976c72458f2/690baa8337acae1b6b5ac0d3/2025-11_USA_Fencing_Rules.pdf)
- [November 2025 penalty chart PDF](https://assets.contentstack.io/v3/assets/blteb7d012fc7ebef7f/blt803f2e6496b433ce/690baa837e4cc4746887c300/2025-11_USA_Fencing_Penalty_Chart.pdf)
- [USA Fencing October adoption announcement](https://www.usafencing.org/news/2026/september/20/p-yellow-card-eliminated-at-usa-fencing-events-beginning-oct-1)
- [FIE Technical Rules, August 2026](https://static.fie.org/uploads/40/204126-Technical%20rules%20August%202026%20ang.pdf)
- [USA Fencing rules and resources](https://www.usafencing.org/rules-compliance)

Local PDFs and extracted text remain in the repository, including
`FIE_Technical_Rules_August_2026.pdf` and `build/fie-technical-2026.txt`.
[Completed rule audit](docs/RULE-UPDATES-2026-10.md) records the exact clauses and
verification. Do not repeat discovery without a new revision or concrete discrepancy.
The athlete handbook remains outside this reference's scope. Diagrams are guidance;
written rules control. This is a family study reference, not a full-rulebook audit
or a commercial redistribution project. Source excerpts retain USA Fencing attribution.

## Data and maintenance

`db/build_db.py` rebuilds SQLite and all `site/data/*.json`. Keep source
transcription, plain summaries, current updates, standalone consequences and
search vocabulary distinct. Never edit generated JSON or SQLite manually.
Search terms are authored in `db/search_terms.json` and stored in SQLite before export.
41 offenses, 66 cited-reference records and eight displayed diagrams are bundled.

- [Search vocabulary, behavior and maintenance](docs/SEARCH.md)
- [Data audit and source quirks](db/AUDIT.md)
- [Recent changes and Git checkpoints](docs/CHANGELOG.md)
- [Current plan](PLAN.md)

The initial pre-takeover snapshot is `ff79d50`. Standalone-content and flow passes
were committed separately. For new rules, extract and compare sources, update
affected guidance and search terms, rebuild, and rerun checks. Historical rows
must not silently be presented as current where they conflict with an update.

## Human review

- Existing app review: `human_feedback/round-2026-10-beginner-guide/index.html`.
- Search review: `human_feedback/round-2026-10-search/index.html`.

Open the form, try the described checks, attach or paste screenshots if helpful,
and export a ZIP before closing. Unexported feedback can be lost. Place the ZIP
beside its HTML guide. Files are packaged locally and are not uploaded.

## Deployment

`.github/workflows/pages.yml` rebuilds the data, verifies checked-in exports, runs
search and JavaScript checks, and publishes only `site/` through GitHub Pages.
Every push to `main` deploys; manual runs are also available. No paid GitHub plan
or frontend dependencies are required for this public repository.

The custom domain is `penalties.teamremco.org`. In the `teamremco.org` DNS zone,
add `CNAME penalties → remco28.github.io` (no repository path or URL scheme).
The custom domain is configured in Pages settings, not a CNAME file: custom
Actions deployments use that setting. Enable Enforce HTTPS when GitHub finishes
issuing the certificate. [Deployment and recovery](docs/DEPLOYMENT.md).
