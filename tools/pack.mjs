// CI: runs the in-browser QA on every built dashboard and prints each IC pack to PDF (16:9).
// Usage: node tools/pack.mjs   (needs `playwright` installed; see .github/workflows/build.yml)
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const dashboards = [{ key: "fs", file: "index.html" }, { key: "ems", file: "ems/index.html" }];
const qa = fs.readFileSync(path.join(root, "tools/qa-browser.js"), "utf8");
fs.mkdirSync(path.join(root, "out"), { recursive: true });

const browser = await chromium.launch();
let failed = 0;
for (const d of dashboards) {
  const url = pathToFileURL(path.join(root, d.file)).href;
  // 1. QA: every page and company renders, numbers match the model. A run takes about 2 minutes, but in CI it has
  //    sometimes stalled until the job timed out, so each run gets 5 minutes and, if it stalls, one more on a fresh page.
  let page, errors, r;
  for (let attempt = 1; attempt <= 2 && !r; attempt++) {
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(url + "#/overview");
    const run = page.evaluate(qa); run.catch(() => {});
    let timer; r = await Promise.race([run, new Promise(res => { timer = setTimeout(res, 300000); })]); clearTimeout(timer);
    if (!r) { console.log(`  - ${d.key}: browser QA stalled at #${page.url().split("#")[1] || ""} (attempt ${attempt} of 2)`); await page.close().catch(() => {}); }
  }
  if (!r) { failed++; continue; }
  console.log(`${d.key}: ${r.pages} pages, ${r.companies} companies, ${r.cellsChecked} cells checked, ${r.failures.length} failures`);
  r.failures.slice(0, 20).forEach(f => console.log("  - " + f));
  if (!r.ok || errors.length) { failed++; errors.forEach(e => console.log("  page error: " + e)); }
  // 2. Phone width: no horizontal scroll. The app re-renders 200 ms after a resize, so give the page up to
  //    3 s to settle before measuring; measuring at once caught the 1440px layout mid-change and failed at random.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["overview", "screener", "shortlist"]) {
    await page.goto(url + "#/" + route);
    await page.waitForFunction(() => document.documentElement.scrollWidth - innerWidth <= 1, null, { timeout: 3000 }).catch(() => {});
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) { console.log(`  - ${route} overflows by ${over}px at 390px`); failed++; }
  }
  await page.close();
  // 3. IC pack PDF
  const pp = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await pp.goto(url + "#/overview?pack=1");
  await pp.waitForSelector("html[data-pack-ready]");
  const over = await pp.evaluate(() => [...document.querySelectorAll("#pack .sb[data-overflow]")].length);
  if (over) { console.log(`  - ${over} IC pack slide(s) overflow`); failed++; }
  await pp.emulateMedia({ media: "print" });
  await pp.pdf({ path: path.join(root, "out", `${d.key}-ic-pack.pdf`), preferCSSPageSize: true, printBackground: true });
  console.log(`  IC pack written: out/${d.key}-ic-pack.pdf`);
  await pp.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
