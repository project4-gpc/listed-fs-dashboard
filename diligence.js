// Shortlist diligence data. One object per shortlisted company; `n` must match the company name in RAW (index.html).
// Revenue part keys: brk broking, dist distribution, ib IB & advisory, int interest/lending, trd trading, oth other.
// Pill tone: g good, w watch, b bad, n neutral. Amounts in ₹ crore.
window.DD_META = { asof: "23 Oct 2026", repo: "project4-gpc/listed-fs-dashboard" };
window.DD = [
{
  n: "SKP Securities Limited", short: "SKP Securities", rank: 1, verdict: ["Best fit", "g"],
  line: "Five years of rising profit; debt is short-term secured OD funding MTF; SEBI-only, no subsidiaries.",
  px: { mc: 65.4, pb: 1.07, pr: 74.99, date: "23 Oct 2026" },
  rev: { total: 41.0, conf: ["High", "Audited · AR FY26 note 22"],
    parts: [["brk", "Broking", 16.7], ["dist", "MF / product distribution", 16.2], ["int", "Interest (MTF 4.1, FD and delayed payment 3.1)", 7.2], ["oth", "Advisory 0.6, DP 0.4", 1.0]],
    note: "56% from institutional clients. MTF interest up 44% in FY26. 71 employees." },
  debt: { gross: 19.5, prev: 10.0, de: 0.32, sec: "100%", tenor: "Short-term", rating: ["Not rated", "n"],
    obs: "Exchange BGs backed by FDs",
    fac: [["Overdraft", 13.4, "Bank", "Pledged FDs", "Short-term"],
          ["Overdraft", 5.5, "Bank", "Mortgage of own property", "Short-term"],
          ["Vehicle loan", 0.6, "Bank", "Vehicle", "Term"],
          ["Line of credit (repaid in year)", 0, "SKP Commodities (promoter group), ₹4 cr", "Not stated", "Interest ₹0.11 cr"]],
    notes: ["Funds the MTF book: ₹34.6 cr of client loans against pledged shares (FY25 ₹25.1 cr).", "Op. cash flow −₹7 cr in FY25 and FY26 because of MTF growth.", "₹36.6 cr FDs mostly pledged, so dashboard net cash is encumbered."] },
  score: { profit: ["Stable, growing", "g", "3.1 · 8.7 · 10.0 · 10.4"], debt: ["Low", "g", "₹19.5 cr, secured"], reg: ["SEBI only", "g", "Broker, DP, merchant banker"], prom: ["74.99%", "Pachisia family"] },
  dd: [
    "<b>RBI exemption is conditional.</b> Auditor exempts it as a stock broker; routing holdco investments or lending through it could trigger NBFC registration.",
    "<b>Debt trend:</b> nil → ₹10 cr → ₹19.5 cr in two years with the MTF book. Agree a cap.",
    "<b>Market-linked:</b> broking + distribution are 81% of revenue. Q1 FY27 PAT ₹2.2 cr vs ₹2.9 cr a year ago; Q2 due 24 Oct.",
    "<b>75% cap:</b> promoter block (74.99%) plus 26% open offer can push the buyer past 75%, forcing a sell-down.",
    "Clean otherwise: no subsidiaries, no penalties in 3 years, ₹2 dividend. Key-person risk: Pachisia family."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/0f9849f9-9639-4961-a98d-0a5663a537b4.pdf"], ["Screener", "https://www.screener.in/company/531169/"]]
},
{
  n: "B. N. Rathi Securities Limited", short: "B N Rathi", rank: 2, verdict: ["Good fit", "g"],
  line: "Debt-free since FY23; profit steady but flat; promoter stake falling and split across the family.",
  px: { mc: 67.0, pb: 0.85, pr: 46.76, date: "23 Oct 2026" },
  rev: { total: 63.3, conf: ["Medium", "Aggregator line items"],
    parts: [["brk", "Equity and commodity brokerage", 41.7], ["int", "Interest (FDs, MTF, delayed payment), DP, MF", 21.0], ["oth", "Asset management", 0.4]],
    note: "Sub-broker payouts ₹29 cr ≈ 70% of brokerage: franchise-heavy, thin margin." },
  debt: { gross: 0, prev: 0, de: 0, sec: "n/a", tenor: "n/a", rating: ["Not rated", "n"],
    obs: "None disclosed",
    fac: [],
    notes: ["Nil borrowings at every year-end FY23–FY26; FY26 BSE disclosure shows zero incremental borrowing.", "~₹0.4 cr interest a year, likely BG/OD charges on exchange margin.", "₹82 cr dashboard net cash sits against ~₹127 cr client payables: mostly client money."] },
  score: { profit: ["Stable, flat", "w", "7.6 · 10.5 · 9.5 · 9.4"], debt: ["Nil", "g", ""], reg: ["SEBI only", "g", "Broker; merchant banker Oct-26"], prom: ["46.8%", "Rathi family, falling"] },
  dd: [
    "<b>Fragmented promoter:</b> 58.1% (Mar-22) → 46.8%. Hari Narayan 28.0%, Nisha 12.2%, Chanda Devi 6.4%, Chetan 0.1%.",
    "<b>Two SAST 29(2) filings on 17 Oct 2026</b> (≥2% stake move). Identify who bought or sold. Desai HUF selling, now 4.1%.",
    "<b>Flat profit:</b> ₹9.4–10.5 cr for three years while revenue grew 11%.",
    "<b>Client money:</b> separate own funds from client funds before valuing the cash.",
    "New SEBI merchant banker licence (Oct-26) and a past 100% subsidiary transfer: confirm what remains in the group.",
    "Revenue split is from aggregator data; get the AR revenue note."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/ba751946-dc2d-4a6e-852f-0349b94227c2.pdf"], ["Screener", "https://www.screener.in/company/523019/consolidated/"], ["Line items", "https://stockanalysis.com/quote/bom/523019/financials/income-statement/"]]
},
{
  n: "Nexome Capital Markets Limited", short: "Nexome", rank: 3, verdict: ["Low debt, lumpy profit", "w"],
  line: "Nearly debt-free and equity-funded, but FY26 profit came from one quarter of deal fees.",
  px: { mc: 75.2, pb: 0.36, pr: 51.81, date: "23 Oct 2026" },
  rev: { total: 50.9, conf: ["High", "Audited · AR FY26 note 48 (segments)"],
    parts: [["ib", "Investment banking", 44.7], ["brk", "Capital market operations", 3.2], ["oth", "Unallocated", 2.9]],
    note: "Mix flips with deal flow: FY25 was 83% capital market ops and 5% IB. FY24 revenue of ₹237 cr was mostly gross sale of securities." },
  debt: { gross: 3.5, prev: 3.0, de: 0.02, sec: "Not disclosed", tenor: "Long-term", rating: ["Not rated", "n"],
    obs: "None found",
    fac: [["Long-term borrowing", 3.5, "Not disclosed", "Not disclosed", "Long-term"]],
    notes: ["Screener shows ₹7 cr consolidated. Finance cost ₹0.45 cr (FY25 ₹0.08 cr).", "Fixed assets doubled to ₹10 cr in FY26, so likely an asset or office loan.", "Equity-funded: ₹22 cr rights issue (Mar-26) + ₹9.2 cr warrant conversion (Apr-26)."] },
  score: { profit: ["Lumpy", "b", "0.6 · 2.4 · 1.2 · ~11"], debt: ["Low", "g", "₹3.5–7 cr"], reg: ["SEBI only", "g", "Cat-I merchant banker"], prom: ["51.8%", "Parekh family"] },
  dd: [
    "<b>One-quarter profit:</b> ₹9.5 cr of ~₹11 cr FY26 PAT came in Q4; Q1 FY27 back to ₹1.3 cr. Get the deal list behind it.",
    "<b>Promoter reshuffle:</b> Kayan group (9.5%) reclassified to public Sep-25; Parekh family leads; stake 58.7% → 51.8% after warrants.",
    "<b>Book value:</b> ₹123 cr of investments against ₹172 cr net worth; check how they are marked.",
    "BSE fine for a corporate governance report error; delisted from CSE Jan-26.",
    "Two small loss-making subsidiaries; no NBFC found. Borrowing lender and security undisclosed."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/5515e71e-f958-4254-b214-b171ae7932ff.pdf"], ["Directors' report", "https://www.indiainfoline.com/company/nexome-capital-markets-ltd/reports/directors-report"], ["Screener", "https://www.screener.in/company/508905/consolidated/"]]
},
{
  n: "Pioneer Investcorp Limited", short: "Pioneer Investcorp", rank: 4, verdict: ["High debt", "b"],
  line: "₹105 cr debt at BBB+; 65% of net worth in one unaudited associate; ₹79 cr unsecured ICDs; 43% pledged.",
  px: { mc: 62.8, pb: 0.36, pr: 65.91, date: "23 Oct 2026" },
  rev: { total: 54.9, conf: ["High", "Audited · AR FY26 notes 21–24"],
    parts: [["ib", "IB, arranger and advisory fees", 32.2], ["trd", "G-sec and bond trading", 12.6], ["int", "Interest, mostly on ICDs", 7.8], ["brk", "Broking and DP", 2.1]],
    note: "Associate profit adds ₹4.7 cr below the line (24% of PBT). Advisory fees were ₹6.5 cr in FY24. 34 employees." },
  debt: { gross: 105.4, prev: 138.7, de: 0.61, sec: "90%", tenor: "Mostly on demand", rating: ["IVR BBB+ Stable", "w"],
    obs: "₹120 cr promoter guarantee; ₹7.4 cr corp. guarantee",
    fac: [["Demand loans / CC", 67.9, "Federal Bank (₹120 cr limit)", "Pledged G-secs, SDLs, AA/AAA bonds + receivables; 5–15% daily margin", "On demand, revolving"],
          ["Demand loans", 8.2, "Non-bank lenders", "Unsecured", "On demand"],
          ["Term loans", 10.5, "Bank", "MD guarantee + mortgage of own and third-party property", "Up to 5 yrs"],
          ["Term loans", 18.8, "FIs and others", "As above", "Non-current"]],
    notes: ["~₹54 cr sits in subsidiaries. Interest cover 1.68x; adjusted gearing 3.12x (Infomerics, FY25).", "Rating: AA+(CE) Jul-22 → A− → BBB+ 'issuer not cooperating' Mar-24 → BBB+ Stable, reaffirmed Dec-25.", "AGM (Sep-26) approved up to ₹300 cr NCDs ≈ 1.7x net worth."] },
  score: { profit: ["Improving, volatile", "w", "1.7 · 4.1 · 7.9 · 15.7"], debt: ["High", "b", "₹105 cr"], reg: ["NBFC subsidiary", "w", "Pioneer Fundinvest"], prom: ["65.9%", "43% pledged"] },
  dd: [
    "<b>Associate = 65% of net worth:</b> Pioneer Insurance & Reinsurance Brokers carried at ₹113 cr vs ~₹172 cr; consolidated on unaudited accounts.",
    "<b>₹79 cr unsecured ICDs</b>, on demand, no provision, partly debt-funded. Borrowers unknown.",
    "<b>Receivables ₹119 cr</b> (~795 debtor days), no credit-loss provision.",
    "<b>43% of promoter stake pledged</b>; ₹120 cr personal guarantee to be replaced on exit.",
    "<b>Related parties:</b> ₹53 cr lent to and repaid by the associate in-year; ~20 promoter LLPs and private companies.",
    "<b>Earnings quality:</b> TTM other income ₹15.3 cr vs PBT ~₹17 cr; Q4 FY26 operating loss.",
    "NBFC subsidiary (Pioneer Fundinvest) means RBI change-of-control approval on top of SEBI."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/45430ad9-1049-4ed7-944d-cd085753c7d9.pdf"], ["Infomerics Dec-25", "https://www.infomerics.com/admin/uploads/PR_Pioneer_Investcorp10Dec25.pdf"], ["Infomerics Mar-24", "https://www.infomerics.com/admin/uploads/pr-Pioneer-Investcorp-19mar24.pdf"], ["Screener", "https://www.screener.in/company/507864/consolidated/"]]
},
{
  n: "RR Financial Consultants Limited", short: "RR Financial", rank: 5, verdict: ["Parent is an NBFC", "b"],
  line: "Listed parent is RBI-registered NBFC: fails holdco test. One employee, 15 subsidiaries, new and lumpy profit.",
  px: { mc: 66.4, pb: 1.21, pr: 74.87, date: "23 Oct 2026" },
  rev: { total: 32.3, conf: ["Medium", "Aggregator + AOC-1 cross-check"],
    parts: [["brk", "Brokerage and commission (broking, MF, insurance)", 27.4], ["trd", "Trading and principal", 5.7], ["oth", "Other", 0.4]],
    note: "Largest subsidiaries appear to be RR Investors Capital Services (~₹16.9 cr) and RR Insurance Brokers (~₹8.1 cr, top profit ~₹3.5 cr); mapping unverified." },
  debt: { gross: 14.0, prev: 12.0, de: 0.25, sec: "Not disclosed", tenor: "Not disclosed", rating: ["Not rated", "n"],
    obs: "₹8.5 cr BG for a subsidiary",
    fac: [],
    notes: ["₹8–18 cr range for a decade; interest ₹1.19 cr (~8–9%).", "AR financials are scanned: lender, security and tenor unreadable.", "Parent also gives ₹6.5 cr loan limits to 5 subsidiaries, two in real estate."] },
  score: { profit: ["New and lumpy", "b", "0.6 · 0.4 · 2.9 · 8.1"], debt: ["Moderate", "w", "₹14 cr + guarantees"], reg: ["Parent is NBFC", "b", "Plus IRDAI broker sub"], prom: ["74.87%", "Prasad family"] },
  dd: [
    "<b>Listed parent is an RBI NBFC</b> (ICC, Reg. N-14.03215, per auditor's CARO). The structure to avoid.",
    "<b>Shell parent:</b> 1 employee; 15 subsidiaries incl. 4 real-estate companies, which the parent lends to.",
    "<b>Profit:</b> under ₹0.6 cr a year FY16–FY24, then ₹2.9 cr and ₹8.1 cr; Q4 FY26 ₹0.01 cr.",
    "<b>Stock:</b> 52-week high ₹264, now ₹60; recent GSM trading restrictions. Find out what drove the run-up.",
    "No dividend despite profit. IRDAI approval needed for RR Insurance Brokers."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/7993af51-fdab-4e5b-841b-9106082beb93.pdf"], ["NBFC reg.", "https://www.rrfinance.com/"], ["Screener", "https://www.screener.in/company/511626/consolidated/"], ["Line items", "https://stockanalysis.com/quote/bom/511626/financials/income-statement/"]]
}
];
