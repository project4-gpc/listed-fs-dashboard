// Refreshes market data, headline financials, borrowings and shareholding for every company in data.js
// from Screener.in, and writes market.js. Run: node scripts/update-market.mjs
// A company that fails to fetch keeps its previous values, so one bad page never blanks the dashboard.
import fs from "node:fs";
import vm from "node:vm";

const load = (file, key) => {
  try { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx); return ctx.window[key]; }
  catch { return undefined; }
};
const RAW = load("data.js", "RAW_BASE");
if (!Array.isArray(RAW) || !RAW.length) { console.error("data.js has no RAW_BASE"); process.exit(1); }
const prev = (load("market.js", "MKT") || {}).co || {};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s ?? "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const num = s => {
  const t = clean(s).replace(/[,₹%+\s]/g, "");
  if (t === "" || t === "-" || t === "--") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
};

// Top ratios block: <span class="name">Market Cap</span> ... <span class="number">75.2</span>
function ratio(html, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const m = html.match(new RegExp('<span class="name">\\s*' + esc + '\\s*</span>[\\s\\S]*?<span class="number">([^<]*)</span>'));
  return m ? num(m[1]) : null;
}

// First data table inside a section (#profit-loss, #balance-sheet, #shareholding).
function table(html, id) {
  const i = html.indexOf(`id="${id}"`);
  if (i < 0) return null;
  const j = html.indexOf("<table", i), k = html.indexOf("</table>", j);
  if (j < 0 || k < 0) return null;
  const t = html.slice(j, k);
  const head = t.slice(0, t.indexOf("</thead>"));
  const cols = [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => clean(m[1])).slice(1);
  const rows = {};
  for (const r of t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (cells.length < 2) continue;
    rows[clean(cells[0]).replace(/\s*\+$/, "").toLowerCase()] = cells.slice(1).map(num);
  }
  return { cols, rows };
}
const row = (tb, labels) => tb && labels.map(l => tb.rows[l]).find(Boolean) || null;
const fy = (tb, r, year) => {
  if (!tb || !r) return null;
  const idx = tb.cols.findIndex(c => c === `Mar ${year}`);
  return idx >= 0 ? (r[idx] ?? null) : null;
};
const last = r => { if (!r) return null; for (let i = r.length - 1; i >= 0; i--) if (r[i] != null) return r[i]; return null; };

async function page(code, consolidated) {
  const url = `https://www.screener.in/company/${encodeURIComponent(code)}/${consolidated ? "consolidated/" : ""}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" } });
      if (res.status === 404) return null;
      if (res.ok) return await res.text();
    } catch {}
    await sleep(3000 * attempt);
  }
  return null;
}

function parse(html) {
  const pl = table(html, "profit-loss"), bs = table(html, "balance-sheet"), sh = table(html, "shareholding");
  const rev = row(pl, ["sales", "revenue"]), pat = row(pl, ["net profit"]), bor = row(bs, ["borrowings", "borrowing"]);
  const price = ratio(html, "Current Price"), bv = ratio(html, "Book Value");
  return {
    mc: ratio(html, "Market Cap"), price, pe: ratio(html, "Stock P/E"),
    pb: price != null && bv ? +(price / bv).toFixed(2) : null,
    r24: fy(pl, rev, 2024), r25: fy(pl, rev, 2025), r26: fy(pl, rev, 2026),
    p24: fy(pl, pat, 2024), p25: fy(pl, pat, 2025), p26: fy(pl, pat, 2026),
    gd: bs ? last(bor) : null,
    pr: last(row(sh, ["promoters"])), fii: last(row(sh, ["fiis"])), dii: last(row(sh, ["diis"])), rt: last(row(sh, ["public"])),
    shq: sh ? sh.cols[sh.cols.length - 1] : null
  };
}

const out = {};
let ok = 0, failed = [];
for (const r of RAW) {
  const code = r.t.split(":")[1];
  let html = await page(code, true), basis = "consolidated";
  let d = html ? parse(html) : null;
  // Companies without consolidated accounts show empty figures on the consolidated page.
  if (!d || d.mc == null || d.r26 == null) {
    await sleep(1200);
    const h2 = await page(code, false);
    const d2 = h2 ? parse(h2) : null;
    if (d2 && d2.mc != null) { d = d2; basis = "standalone"; }
  }
  if (d && d.mc != null) {
    const p = prev[r.t] || {};
    const merged = { ...p };
    for (const [k, v] of Object.entries(d)) if (v != null) merged[k] = v;
    merged.basis = basis;
    out[r.t] = merged; ok++;
  } else {
    if (prev[r.t]) out[r.t] = prev[r.t];
    failed.push(r.t);
  }
  await sleep(1500);
}

if (ok === 0) { console.error("No companies refreshed; leaving market.js unchanged."); process.exit(1); }
const asof = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) + " IST";
fs.writeFileSync("market.js", "// Generated by scripts/update-market.mjs. Do not edit by hand.\nwindow.MKT = " + JSON.stringify({ asof, ok, failed, co: out }) + ";\n");
console.log(`Refreshed ${ok}/${RAW.length}.` + (failed.length ? ` Failed: ${failed.join(", ")}` : ""));
