# Greater Pacific dashboard standards

Every screening dashboard in this repo (and every future one) is built on the shared kit in `kit/`.
A new dashboard is one adapter file plus its data files; the shell, pages, charts, exports and IC pack come for free.

## Rules
1. **Never change a number.** Data comes only from the data files. The build inlines them verbatim (`qa.ps1` checks).
   Derived figures are computed in the data layer (`kit/model.js`, `src/<key>/adapter.js`), never in UI code.
   If a figure looks wrong, add a data-quality flag in the adapter; never "fix" it in the UI.
2. **One design system.** Colours, font sizes and spacing come only from `kit/tokens.css`. `qa.ps1` fails on any literal elsewhere.
3. **One self-contained HTML file per dashboard**, offline: fonts, logo, styles, scripts and data are inlined by `build.ps1`.
4. **One chart library** (`kit/charts.js`). Titles state the finding; subtitles state units and as-of. Every series has a colour *and* a marker shape.
5. **All state in the URL** (`#/page/arg?filters`), so any view can be bookmarked or sent.
6. **Shortlists live in the repo** (`shortlist.js` per dashboard), not in the browser.
7. **Ask before adding a dependency.** Current external tools: git, PowerShell (build/QA), Playwright in CI only.
8. **Nothing confidential in commit messages, issue titles or other public metadata.** Bot commits say "Market refresh", "Rebuild dashboards", "EMS data sync", "Diligence update (issue #n)".

## Brand
Source: `brand/brand.json` (logo pixels, website, decks; no brand guide was supplied).
Primary `#010039`, secondary `#002060`, accent `#97A8C1`; Martel for display headings, Heebo for body and every number (tabular digits).
Light theme only. Logo is the official raster file, unmodified; a proper SVG and logo mark are still needed (favicon is the wordmark on navy).

## Adding a dashboard
1. Put its data file(s) in a folder, e.g. `newdash/data.js` setting `window.RAW_BASE` (and `window.DATA_META` with `asof`).
2. Add `newdash/shortlist.js` (`window.SHORTLIST = {updated:null, names:[], notes:{}}`).
3. Write `src/newdash/adapter.js` exposing `window.Adapter.build(src)` returning the MODEL (copy `src/ems/adapter.js` as the template:
   companies, metrics with definition/formula/source/as-of, groups, filters, presets, funnel, KPIs, scoring, compare rows, change rules, methodology).
4. Add an entry to `$dashboards` in `build.ps1` and to `qa.ps1` / `tools/pack.mjs`.
5. Run `./build.ps1`, `./qa.ps1`, the browser QA (`tools/qa-browser.js`) and screenshots at 1440 and 390 (`tools/shots.ps1`).

## Checks
- `build.ps1` builds every dashboard; previous snapshot for "what changed" = parent of the last commit that changed the primary data file.
- `qa.ps1` token rule, offline output, verbatim data, palette report (`docs/palette-report.txt`), ASCII scripts, public-metadata rule.
- `tools/qa-browser.js` every page and company renders without errors, no NaN/undefined, charts carry units, every screener cell equals the model value.
- `tools/pack.mjs` (CI) runs the browser QA, checks 390px has no horizontal scroll, and prints each IC pack to a 16:9 PDF artifact.
