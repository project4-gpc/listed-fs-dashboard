# Working on the GPC screening dashboards

Instructions for any Claude that changes this repo: a Claude chat with code execution (the team's shared project),
Claude Code, or anything else. The full standards are in `docs/STANDARDS.md`; read the parts you need before changing anything.

## What this is
- Two screening dashboards built from one shared kit and published with GitHub Pages:
  FS at the repo root (`index.html`) and EMS (`ems/index.html`), live at https://project4-gpc.github.io/listed-fs-dashboard/
- Source code: `kit/` (shell, pages, charts and styles; `kit/tokens.css` holds every colour, font size and spacing) and
  `src/<key>/adapter.js` (each dashboard's data layer: metrics, groups, filters, presets, mandate, funnel, scoring, compare rows).
- `build.ps1` inlines everything into one self-contained HTML file per dashboard; `qa.ps1` and `tools/qa-browser.js` check it.
  GitHub rebuilds and republishes the dashboards after every change to `main`. Never commit the built HTML files yourself.
- The repo is public.

## Rules (no exceptions)
1. **Never change a number.** Figures come only from the data files, which you must never edit:
   `data.js`, `market.js`, `diligence.js`, `ems/data.js`. New companies and corrected figures come from the team's Excel,
   which is synced automatically; tell the person to update the Excel instead. If a figure looks wrong, say so; never
   "fix" it in code. Don't change how an existing figure is calculated unless the person explicitly asks for a new
   definition, and then say clearly what changed.
2. **One design system.** Colours, font sizes and spacing only through the variables in `kit/tokens.css`; no literal
   values anywhere else (QA fails on them). A theme change is a change to the tokens.
3. **One self-contained HTML file per dashboard** that works offline: no CDNs, external scripts, fonts or images.
4. **Charts only through the kit** (`kit/charts.js`, `kit/charts-x.js`). Chart titles state the finding; subtitles give
   units and as-of; every series has a colour and a marker shape.
5. **All view state in the URL** (`#/page/arg?filters`).
6. **No new libraries or tools.**
7. **Nothing confidential in anything public**: commit messages, branch names, file names. Never put company names,
   people's names or figures in them. The edit kit writes generic messages; keep it that way.
8. Deal-pipeline (team) data never goes in this repo.
9. Never show, print or paste the GitHub key.

## Files
- You may change: `kit/**`, `src/**`, `brand/**`, `build.ps1` (only to add a dashboard), `shortlist.js`,
  `ems/shortlist.js`, `docs/STANDARDS.md`.
- Never change: the data files above, `index.html`, `ems/index.html`, `team.js`, `qa.ps1`, `tools/**`, `scripts/**`,
  `.github/**`, `CLAUDE.md`, `.gitattributes`, `docs/palette-report.txt`. The preview check rejects edits that touch them.

## Where things are
- Mandate and screening criteria: `mandate`, `filters`, `presets` and `funnel` in `src/<key>/adapter.js`.
- Scoring criteria and weights: `scoring` in the same file.
- Metrics shown (labels, definitions, formats) and table views: `metrics`, `textCols`, `views` in the same file.
- Theme: `kit/tokens.css`. Layout and pages: `kit/app.js`. Charts: `kit/charts.js`, `kit/charts-x.js`.
  Styles: `kit/base.css`, `kit/ui.css`. Pipeline page: `kit/pipeline*.js`, `kit/pipeline.css`.

## Making a change from a Claude chat (the edit kit)
The GitHub key is the project file `gpc-github-key.txt`; the edit kit finds it by itself. If it reports that no key was
found, locate that file and run the command with `GPC_KEY` set from the file's contents, without ever printing them.
1. Get the code: `git clone https://github.com/project4-gpc/listed-fs-dashboard.git dash && cd dash`
   (if `dash` already exists in this chat: `cd dash && git checkout -q main && git pull -q`).
2. `bash tools/edit/edit.sh start`
3. Make the change, small and focused. Read the files you touch first. Follow the rules above.
4. `bash tools/edit/edit.sh submit` sends it to GitHub, which builds the dashboards and runs every check (4-8 minutes).
5. `bash tools/edit/edit.sh wait` (run it again while it is still building).
   - Passed: share the preview file(s) it names with the person (each is the whole dashboard in one file that opens in
     any browser) and explain the change in plain words.
   - Failed: read the reason, fix it, then submit and wait again.
6. Publish only when the person clearly says so: `bash tools/edit/edit.sh publish`. The live dashboards update 3-5
   minutes later.
7. `bash tools/edit/edit.sh undo` reverses the last published edit (`undo <id>` for a specific one);
   `bash tools/edit/edit.sh list` shows recent edits; `bash tools/edit/edit.sh discard` drops an unpublished edit.
   If publish reports a clash with newer changes: `bash tools/edit/edit.sh refresh`, then submit and wait again.

The people asking are not developers. Before changing anything, say in a sentence or two what you will change, and ask if
the request is unclear. Keep code out of your replies unless they ask for it.

## Working locally (Claude Code)
Pull first: the data sync and the build bot push to `main` every hour. Then run `pwsh ./build.ps1`, `pwsh ./qa.ps1`, the
browser QA (`tools/qa-browser.js`) and screenshots at 1440 and 390 wide (`tools/shots.ps1`, saved outside the repo).
Commit with generic messages only.
