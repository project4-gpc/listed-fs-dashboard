// Shortlist diligence data. One object per shortlisted company; `n` must match the company name in data.js.
// Revenue part keys: brk broking, dist distribution, ib IB & advisory, int interest/lending, trd trading, oth other.
// Pill tone: g good, w watch, b bad, n neutral. Amounts in ₹ crore. Bullets may use <b> for a lead label.
// str / wk: our view of strengths and weaknesses; credit-agency points are tagged with the agency.
window.DD_META = { asof: "23 Oct 2026", repo: "project4-gpc/listed-fs-dashboard" };
window.DD = [
{
  n: "SKP Securities Limited", short: "SKP Securities", rank: 1, verdict: ["Best fit", "g"],
  line: "Five years of rising profit; debt is short-term secured OD funding MTF; SEBI-only, no subsidiaries.",
  px: { mc: 65.4, pb: 1.07, pr: 74.99, date: "23 Oct 2026" },
  rev: { total: 41.0, conf: ["High", "Audited · AR FY26 note 22"],
    parts: [["brk", "Broking", 16.7], ["dist", "MF / product distribution", 16.2], ["int", "Interest (MTF 4.1, FD and delayed payment 3.1)", 7.2], ["oth", "Advisory 0.6, DP 0.4", 1.0]],
    note: "56% from institutional clients. MTF interest up 44% in FY26. 71 employees." },
  debt: { gross: 19.5, prev: 10.0, de: 0.32, sec: "100%", tenor: "Short-term", obs: "Exchange BGs backed by FDs",
    fac: [["Overdraft", 13.4, "Bank", "Pledged FDs", "Short-term"],
          ["Overdraft", 5.5, "Bank", "Mortgage of own property", "Short-term"],
          ["Vehicle loan", 0.6, "Bank", "Vehicle", "Term"],
          ["Line of credit (repaid in year)", 0, "SKP Commodities (promoter group), ₹4 cr", "Not stated", "Interest ₹0.11 cr"]],
    notes: ["Funds the MTF book: ₹34.6 cr of client loans against pledged shares (FY25 ₹25.1 cr); op. cash flow −₹7 cr in FY25 and FY26.", "₹36.6 cr FDs mostly pledged, so dashboard net cash is encumbered."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No rating on record. FY26 AR says none is required: no debt instruments, only secured bank OD." },
  score: { profit: ["Stable, growing", "g", "3.1 · 8.7 · 10.0 · 10.4"], debt: ["Low", "g", "₹19.5 cr, secured"], reg: ["SEBI only", "g", "Broker, DP, merchant banker"], prom: ["74.99%", "Pachisia family"] },
  str: [
    "<b>Steady compounding:</b> PAT ₹3.1 → 10.4 cr (FY23–26); ROE ~19% over 3 and 5 years.",
    "<b>Two fee engines:</b> broking 41% and MF distribution 40%, so neither dominates.",
    "<b>Institutional franchise:</b> 56% of revenue from MFs and institutions, which is stickier than retail.",
    "<b>Simple and clean:</b> no subsidiaries, no penalties in 3 years, pays a dividend."
  ],
  wk: [
    "<b>Market-linked:</b> 81% of revenue moves with volumes and MF flows; Q1 FY27 PAT fell to ₹2.2 cr from ₹2.9 cr.",
    "<b>MTF funded by debt:</b> OD rose from nil to ₹19.5 cr in two years; operating cash flow negative.",
    "<b>Small and regional:</b> ₹41 cr revenue, 71 staff, Kolkata-centred; family-run."
  ],
  dd: [
    "<b>RBI exemption is conditional:</b> it is exempt as a stock broker; routing holdco investments or lending through it could trigger NBFC registration.",
    "<b>75% cap:</b> promoter block (74.99%) plus 26% open offer can push the buyer past 75%, forcing a sell-down.",
    "<b>Debt policy:</b> agree a cap on MTF funding before signing. Q2 FY27 results due 24 Oct 2026."
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
  debt: { gross: 0, prev: 0, de: 0, sec: "n/a", tenor: "n/a", obs: "₹52.5 cr contingent liabilities",
    fac: [],
    notes: ["Nil borrowings at every year-end FY23–FY26; FY26 BSE disclosure shows zero incremental borrowing.", "₹82 cr dashboard net cash sits against ~₹127 cr client payables: mostly client money."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No rating at any agency, consistent with zero borrowings." },
  score: { profit: ["Stable, flat", "w", "7.6 · 10.5 · 9.5 · 9.4"], debt: ["Nil", "g", "Contingent ₹52.5 cr"], reg: ["SEBI only", "g", "Broker; merchant banker Oct-26"], prom: ["46.8%", "Rathi family, falling"] },
  str: [
    "<b>No debt:</b> nil borrowings for four year-ends.",
    "<b>Steady profit:</b> ₹9.4–10.5 cr a year; pays ~20% of profit as dividend.",
    "<b>Room to expand:</b> new SEBI merchant banker licence (Oct-26) adds an IB line."
  ],
  wk: [
    "<b>Thin margins:</b> sub-broker payouts take ~70% of brokerage; profit flat while revenue grew 11%.",
    "<b>Fragmented, falling promoter:</b> 58.1% (Mar-22) → 46.8% across four family members.",
    "<b>Contingent liabilities ₹52.5 cr</b>, about 0.7x net worth (Screener)."
  ],
  dd: [
    "<b>Two SAST 29(2) filings on 17 Oct 2026</b> (≥2% stake move): identify who bought or sold. Desai HUF selling, now 4.1%.",
    "<b>Contingent liabilities:</b> confirm they are exchange bank guarantees and not guarantees for third parties.",
    "<b>Client money:</b> separate own funds from client funds before valuing the cash.",
    "<b>Group perimeter:</b> a past 100% subsidiary transfer; confirm what remains. Revenue split needs the AR note."
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
  debt: { gross: 3.5, prev: 3.0, de: 0.02, sec: "Not disclosed", tenor: "Long-term", obs: "None found",
    fac: [["Long-term borrowing", 3.5, "Not disclosed", "Not disclosed", "Long-term"]],
    notes: ["Screener shows ₹7 cr consolidated; finance cost ₹0.45 cr (FY25 ₹0.08 cr). Fixed assets doubled to ₹10 cr, so likely an asset or office loan.", "Equity-funded: ₹22 cr rights issue (Mar-26) + ₹9.2 cr warrant conversion (Apr-26)."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No rating under Nexome or SMIFS Capital Markets; no rating filings on BSE. SMIFS Ltd (Kolkata) is a separate unlisted broker." },
  score: { profit: ["Lumpy", "b", "0.6 · 2.4 · 1.2 · ~11"], debt: ["Low", "g", "₹3.5–7 cr"], reg: ["SEBI only", "g", "Cat-I merchant banker"], prom: ["51.8%", "Parekh family"] },
  str: [
    "<b>Clean balance sheet:</b> near debt-free; promoters put in fresh equity (₹31 cr in FY26–27).",
    "<b>Deal capability:</b> Cat-I merchant banker that earned ₹44.7 cr of IB fees in FY26.",
    "<b>Cheap:</b> 0.36x book, lowest in the set; dividend restarted (₹1.50)."
  ],
  wk: [
    "<b>Deal-dependent:</b> ₹9.5 cr of ~₹11 cr FY26 PAT came in Q4; Q1 FY27 back to ₹1.3 cr. 3-year ROE ~3%.",
    "<b>Unstable model:</b> FY24 trading, FY25 capital markets, FY26 IB.",
    "<b>Book value risk:</b> ₹123 cr of investments against ₹172 cr net worth."
  ],
  dd: [
    "<b>Deal list behind Q4 FY26 fees:</b> one-off or repeatable?",
    "<b>Promoter reshuffle:</b> Kayan group (9.5%) reclassified to public Sep-25; Parekh family leads; stake 58.7% → 51.8% after warrants.",
    "<b>Governance:</b> BSE fine for a corporate governance report error; delisted from CSE Jan-26.",
    "<b>Investments:</b> get the list and marking basis. Borrowing lender and security undisclosed."
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
  debt: { gross: 105.4, prev: 138.7, de: 0.61, sec: "90%", tenor: "Mostly on demand", obs: "₹120 cr promoter guarantee; ₹7.4 cr corp. guarantee",
    fac: [["Demand loans / CC", 67.9, "Federal Bank (₹120 cr parent + ₹100 cr Fundinvest limits)", "Pledged G-secs, SDLs, AA/AAA bonds + receivables; 5–15% daily margin", "On demand, revolving"],
          ["Demand loans", 8.2, "Non-bank lenders", "Unsecured", "On demand"],
          ["Term loans", 10.5, "Bank", "MD guarantee + mortgage of own and third-party property", "Up to 5 yrs"],
          ["Term loans", 18.8, "FIs and others", "As above", "Non-current"]],
    notes: ["~₹54 cr sits in subsidiaries. AGM (Sep-26) approved up to ₹300 cr NCDs ≈ 1.7x net worth."] },
  credit: { rating: ["IVR BBB+ Stable", "w"],
    rated: [["Pioneer Investcorp (parent)", "Infomerics", "IVR BBB+ / Stable", "Dec-25", "₹120 cr CC"],
            ["Pioneer Fundinvest (100% sub, G-sec dealer)", "Infomerics", "IVR BBB / Stable", "Sep-24", "₹100 cr CC"]],
    path: [["CARE", "AAA(SO) Jan-19 → AA(SO) Apr-20 → A(SO) Mar-21 → withdrawn at company's request Mar-22"],
           ["Infomerics", "AA+(CE) Jul-22 → A− Jan-23 → A− Neg Feb-23 → BBB+ Neg, issuer not cooperating Mar-24 → BBB+ Stable Sep-24, reaffirmed Dec-25"]],
    take: "High ratings came from the bank's pledge structure. After RBI barred pledge-backed 'credit enhanced' ratings in 2022, the standalone view settled in the BBB range." },
  score: { profit: ["Improving, volatile", "w", "1.7 · 4.1 · 7.9 · 15.7"], debt: ["High", "b", "₹105 cr, BBB+"], reg: ["NBFC subsidiary", "w", "Pioneer Fundinvest"], prom: ["65.9%", "43% pledged"] },
  str: [
    "<b>Bank-controlled lines</b> (CARE, Infomerics): Federal Bank limits only buy G-secs, SDLs and AA/AAA bonds; 30/45-day holding caps; daily margin; bank can sell collateral. Average utilisation only ~13–17%.",
    "<b>Growing fee business:</b> IB fees ₹6.5 → 17.8 → 32.2 cr (FY24–26); EBITDA margin 47.5% in FY25.",
    "<b>Institutional buyers and experienced promoter:</b> sells to MFs, banks, insurers; Gaurang Gandhi has 30+ years in debt markets.",
    "<b>Valuable associate:</b> Pioneer Insurance & Reinsurance Brokers grew income ₹82 → 99.5 cr and EBITDA ₹9.9 → 23.8 cr (FY23–24), gearing 0.43x (Infomerics)."
  ],
  wk: [
    "<b>Real leverage is high</b> (Infomerics): adjusted gearing 3.12x, TOL/adjusted TNW 6.25x once the ₹109 cr associate and subsidiary stakes are deducted.",
    "<b>Thin cover:</b> interest cover 1.05x (FY24), 1.68x (FY25); DSCR 1.41–1.54x. Finance cost ₹12.3 cr vs PBT ₹19.4 cr.",
    "<b>Bond-cycle earnings:</b> traded volume ₹20,001 cr (FY20) → ₹6,628 cr (FY22) → ₹8,099 cr (FY25); TTM other income ₹15.3 cr vs PBT ~₹17 cr.",
    "<b>Fundinvest is tiny standalone:</b> income ₹2.4 cr, PAT −₹0.04 cr (FY22) against a ₹100 cr line."
  ],
  dd: [
    "<b>Associate = 65% of net worth:</b> carried at ₹113 cr vs ~₹172 cr, consolidated on unaudited accounts. Value may sit there, not in the listed parent.",
    "<b>₹79 cr unsecured ICDs</b>, on demand, no provision, partly debt-funded. Who are the borrowers?",
    "<b>Receivables ₹119 cr</b> (~795 debtor days), no credit-loss provision.",
    "<b>Rating conduct:</b> withdrew from CARE after three downgrades (Mar-22); in Mar-24 stopped giving information and paying fees, so both entities went to 'issuer not cooperating'.",
    "<b>Encumbrance:</b> 43% of promoter stake pledged; ₹120 cr personal guarantee to replace.",
    "<b>Related parties:</b> ₹53 cr lent to and repaid by the associate in-year; ~20 promoter LLPs and private companies.",
    "<b>Regulatory:</b> Pioneer Fundinvest is listed as an RBI base-layer NBFC but described by Infomerics as a SEBI dealer; confirm, as an NBFC adds RBI change-of-control approval."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/45430ad9-1049-4ed7-944d-cd085753c7d9.pdf"], ["Infomerics Dec-25", "https://www.infomerics.com/admin/uploads/PR_Pioneer_Investcorp10Dec25.pdf"], ["Fundinvest Sep-24", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Fundinvest_13sep24_925d3c70c5.pdf"], ["Fundinvest Jan-23", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Fundinvest_24jan23_34b10e04c5.pdf"], ["Infomerics Mar-24", "https://www.infomerics.com/admin/uploads/pr-Pioneer-Investcorp-19mar24.pdf"], ["CARE Mar-22", "https://www.careratings.com/upload/CompanyFiles/PR/29032022064204_Pioneer_Investcorp_Limited.pdf"], ["Screener", "https://www.screener.in/company/507864/consolidated/"]]
},
{
  n: "RR Financial Consultants Limited", short: "RR Financial", rank: 5, verdict: ["Parent is an NBFC", "b"],
  line: "Listed parent is RBI-registered NBFC: fails holdco test. One employee, 15 subsidiaries, new and lumpy profit.",
  px: { mc: 66.4, pb: 1.21, pr: 74.87, date: "23 Oct 2026" },
  rev: { total: 32.3, conf: ["Medium", "Aggregator + AOC-1 cross-check"],
    parts: [["brk", "Brokerage and commission (broking, MF, insurance)", 27.4], ["trd", "Trading and principal", 5.7], ["oth", "Other", 0.4]],
    note: "Largest subsidiaries appear to be RR Investors Capital Services (~₹16.9 cr) and RR Insurance Brokers (~₹8.1 cr, top profit ~₹3.5 cr); mapping unverified." },
  debt: { gross: 14.0, prev: 12.0, de: 0.25, sec: "Not disclosed", tenor: "Not disclosed", obs: "₹8.5 cr BG for a subsidiary",
    fac: [],
    notes: ["₹8–18 cr range for a decade; interest ₹1.19 cr (~8–9%). AR financials are scanned, so lender, security and tenor are unreadable.", "Parent also gives ₹6.5 cr loan limits to 5 subsidiaries, two in real estate."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No rating for the parent, RR Fincap, RR Investors Capital or RR Insurance Brokers: ₹14 cr of debt and an NBFC licence with no external credit view." },
  score: { profit: ["New and lumpy", "b", "0.6 · 0.4 · 2.9 · 8.1"], debt: ["Moderate", "w", "₹14 cr + guarantees"], reg: ["Parent is NBFC", "b", "Plus IRDAI broker sub"], prom: ["74.87%", "Prasad family"] },
  str: [
    "<b>Broad licence set:</b> broking, MF distribution and insurance broking across the group.",
    "<b>Profitable insurance broker</b> appears to be the best business (~₹3.5 cr PAT).",
    "<b>One counterparty:</b> 74.87% with the Prasad family; FY26 ROE 15.7%."
  ],
  wk: [
    "<b>Listed parent is an RBI NBFC</b> (ICC, Reg. N-14.03215, per CARO): the holdco structure to avoid.",
    "<b>No profit record:</b> under ₹0.6 cr a year FY16–FY24, then ₹2.9 and ₹8.1 cr; Q4 FY26 ₹0.01 cr.",
    "<b>Complex group:</b> 1 employee in the parent, 15 subsidiaries including 4 real-estate companies."
  ],
  dd: [
    "<b>Real-estate exposure:</b> parent lends to real-estate subsidiaries; size and recoverability.",
    "<b>Stock:</b> 52-week high ₹264, now ₹60, with recent GSM restrictions. What drove the run-up?",
    "<b>Lenders:</b> get sanction letters for the ₹14 cr; no dividend despite profit.",
    "<b>Approvals:</b> RBI for the NBFC parent and IRDAI for RR Insurance Brokers."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/7993af51-fdab-4e5b-841b-9106082beb93.pdf"], ["NBFC reg.", "https://www.rrfinance.com/"], ["Screener", "https://www.screener.in/company/511626/consolidated/"], ["Line items", "https://stockanalysis.com/quote/bom/511626/financials/income-statement/"]]
}
];
