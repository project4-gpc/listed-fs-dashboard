# Shortlist diligence brief

You are adding one company to the **Shortlist diligence** tab of this dashboard. The company is named in the triggering issue title (`Diligence: <name> (<ticker>)`). The name must match an `n` value in the `RAW` array in `index.html`.

## Mandate (what the investing team screens for)
- Profit must be broadly stable; growth is welcome but secondary. Revenue size matters little.
- Debt matters a lot. Find every borrowing: who lent it, secured or unsecured, what secures it, tenor (on demand / short / long), and any guarantees given or received.
- Avoid targets where the listed company is itself an RBI-registered NBFC (it would become the holdco). Flag NBFC subsidiaries too.
- Flag anything that affects acquirability: promoter holding and pledges, defaults, credit ratings and rating history, regulatory actions, related-party flows, earnings quality (other income, one-off quarters), client money in cash balances.

## Research steps
1. Pull the latest annual report and recent filings from BSE/NSE. BSE blocks plain fetches; download with
   `curl -L -A "Mozilla/5.0" -e "https://www.bseindia.com/" -o ar.pdf <url>` and extract text with `pdftotext -layout ar.pdf ar.txt`. Find annual report links on the company's Screener page (`https://www.screener.in/company/<code>/consolidated/`).
2. From the annual report, read: revenue note / Ind AS 115 disaggregation / segment note; borrowings note (and its security sub-note); CARO clause (xvi) on RBI registration; related-party note; contingent liabilities; subsidiaries (AOC-1); permanent employees count.
3. Search for credit rating rationales (CRISIL, ICRA, CARE, India Ratings, Infomerics, Acuité, Brickwork) and read the latest one.
4. Get the latest price, market cap, P/B and promoter % from Screener.
5. If a figure cannot be confirmed from an audited note, use the best available source and mark confidence Medium (aggregator) or Low (unverified). Never invent a number; write "Not disclosed" instead.

## Output
Append one object to `window.DD` in `diligence.js`, following the exact shape of the existing entries:
- `n` (exact RAW name), `short`, `rank` (place it in the ranking against the existing companies and renumber others if needed), `verdict` [label, tone].
- `line`: one sentence, under 120 characters.
- `px`: `{mc, pb, pr, date}`.
- `rev`: `{total, conf:[level, source], parts:[[key,label,amount],...], note}`. Part keys: brk, dist, ib, int, trd, oth.
- `debt`: `{gross, prev, de, sec, tenor, rating:[label,tone], obs, fac:[[facility, amount, lender, security, tenor],...], notes:[...]}`.
- `score`: `{profit:[label,tone,"FY23 · FY24 · FY25 · FY26 PAT"], debt:[label,tone,detail], reg:[label,tone,detail], prom:[pct, holder]}`.
- `dd`: 4–7 bullets. Lead with a short bold label, then the fact and the number. Brief and pointed; no filler.
- `src`: [[label, url], ...].

Tone: g good, w watch, b bad, n neutral. Keep every string short. Update `DD_META.asof` if you refresh prices. Do not change `index.html`. When done, reply on the issue with a 3–5 line summary of the verdict and the main flags.
