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

## Interface (v2)
- **Hero bands** in brand navy open the Overview, Screener, Shortlist and Company pages; KPI tiles sit on frosted glass with a micro-chart (share of universe or distribution with the company/median marked).
- **Numbers are never animated** (no count-ups): every figure is final from the first frame so screenshots and prints are always right. Motion is limited to entrances, chart transitions and re-ranking, and is switched off for reduced motion.
- **Positioning lab** (kit/charts-x.js `Lab`): drag to select, Shift-drag to pan, Ctrl/⌘+scroll to zoom, click to pin, double-click to open, arrow keys to move; axis, size, log scale, labels and quadrant choices, zoom, pin and selection all live in the URL. A selection is also a screener filter (`sel=`).
- Other chart types: universe treemap, funnel, radar scorecard, peer beeswarm, parallel profiles, animated scoreboard, waterfall, histogram range slider, constellation (decorative, aria-hidden). See the dev chart gallery (`#/dev/gallery`).
- **Presentation mode** (`P`, the Present button, or `?pv=1` in a link) shows the IC pack slides full screen with arrow-key navigation. The same slide builder prints the IC pack.
- **Command palette** (Ctrl/⌘+K or `/`): companies and commands. `?` lists shortcuts.

## Deal pipeline
- Every dashboard gets a **Pipeline** page (kit/pipeline.js store, kit/pipeline-ui.js views): flow river, drag-and-drop board, deal drawer (stage stepper, owner, priority, next step, due and last-contact dates, pass reasons, notes, activity timeline), next-actions agenda, stalled-but-attractive chart, team workload and activity feed. Stages: Long list, Screened, Shortlisted, Outreach, Engaged, NDA & data, IC, plus Passed / On hold.
- **Pipeline data is team data and never enters the published dashboard or the public repo.** It is kept on the user's device by default, or in the **private** repo `project4-gpc/gpc-pipeline` (one file per dashboard, `pipeline/<key>.json`; the store checks the repo is private before every session and refuses a public one). Commits there say only "Pipeline update". The repo's README has the connection steps.
- **Team password (the normal way in).** `team.js`, published with both dashboards, holds the access code: the GitHub token for the private repo encrypted with the team password (PBKDF2-SHA256, 600,000 iterations, AES-256-GCM; `null` = not set up). Everyone uses the normal dashboard link; a locked device gets an unlock box on the Pipeline page, and after one correct password it keeps the derived key (never the password or the token) and syncs on every visit. The owner creates the code under Storage → "Set up team access" and publishes it as `team.js` (a push to it rebuilds both dashboards). Replacing the token under the same password keeps every device unlocked; a new password locks them until each enters it once. Because the access code is public, the team password must be at least 16 characters.
- An own GitHub token (Storage → Own GitHub token) still works for individual access. The connection is set once per browser and shared by every dashboard on the site; `#/pipeline?connect=1` opens the Storage dialog on the team option. Records kept on a device before it connects are merged and uploaded on the first sync. Files over 1 MB are read through GitHub's raw media type.
- Because the token sits in the browser's storage for `project4-gpc.github.io`, no other (untrusted) GitHub Pages site may be published under that account: it would share the same storage.
- Before any deal is in play, the river draws the stages not reached yet as a dotted path ahead, the agenda becomes a "Start here" list (highest weighted score among shortlisted, then screened companies, each with a one-click move to the next stage), and the hero links to the sample preview. Deals in play without a next step are listed in the agenda.
- Starting stages come from the data only (shortlisted, then screened via the adapter's `pipeline.seed`); nothing else is pre-filled. The design preview (`#/dev/pipeline-sample`) uses made-up sample companies, never real names with invented activity.
- Records are keyed by company name; merges keep the newer record per company and the union of histories, so concurrent edits to different companies are never lost. Export / import of a JSON backup is in the Storage dialog.

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
