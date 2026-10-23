// Shortlist diligence data. One object per shortlisted company; `n` must match the company name in data.js.
// All financials are consolidated FY26 (year to 31 Mar 2026) from the audited annual report unless a source says otherwise.
// Revenue part keys: brk broking, dist distribution, ib IB & advisory, int interest/lending, trd trading, oth other.
// Pill tone: g good, w watch, b bad, n neutral. Amounts in ₹ crore. Bullets may use <b> for a lead label.
window.DD_META = { asof: "23 Oct 2026", repo: "project4-gpc/listed-fs-dashboard" };
window.DD = [
{
  n: "SKP Securities Limited", short: "SKP Securities", rank: 1, verdict: ["Best fit", "g"],
  line: "Profit up every year since FY23; only debt is secured bank overdraft funding margin loans; SEBI-regulated, no subsidiaries.",
  px: { mc: 65.4, pb: 1.07, pr: 74.99, date: "23 Oct 2026" },
  rev: { total: 41.0, conf: ["High", "AR FY26 notes 21–22 (standalone; no subsidiaries)"],
    parts: [["brk", "Broking", 16.67], ["dist", "MF and product distribution", 16.20], ["int", "Interest: margin funding 4.05, FDs 2.46, delayed payment 0.65", 7.17], ["oth", "Advisory 0.59, depository 0.39", 0.98]],
    note: "Institutional clients (MFs, institutions) are 56% of revenue. Margin-funding interest grew 44% in FY26. 71 employees." },
  debt: { gross: 19.53, prev: 10.02, nw: 60.40, sec: "100%", tenor: "Short-term", obs: "Bank guarantees ₹5.0 cr (contingent)",
    fac: [["Bank overdraft", 13.44, "Bank", "Pledge of fixed deposits", "Short-term"],
          ["Bank overdraft", 5.45, "Bank", "Mortgage of company's property", "Short-term"],
          ["Vehicle loan", 0.64, "Bank", "Hypothecation of vehicle", "Term"]],
    notes: ["Funds the margin-trading book: ₹34.6 cr of client loans secured by pledged shares, up from ₹25.2 cr. Operating cash flow was −₹7.2 cr (FY25) and −₹7.4 cr (FY26).", "All ₹36.6 cr of fixed deposits are pledged: ₹17.75 cr with exchanges for margin and ₹18.84 cr with the bank for the overdraft and guarantees.", "Drew and repaid a ₹4 cr line of credit from SKP Commodities (promoter group) during FY26."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating. The FY26 report says none is required as it has no listed debt; banks lend against FDs and property." },
  score: { pat: [3.10, 8.65, 9.99, 10.35], profit: ["Stable, growing", "g"], debt: [19.53, "Low", "g"], reg: ["SEBI only", "g", "Broker, DP, merchant banker"], prom: ["74.99%", "Pachisia family"] },
  str: [
    "<b>Consistent growth:</b> PAT ₹3.1 cr (FY23) to ₹10.4 cr (FY26); return on equity around 19%.",
    "<b>Balanced fee base:</b> broking and MF distribution each bring about 40% of revenue.",
    "<b>Institutional franchise:</b> 56% of revenue from MFs and institutions, which tends to be steadier than retail.",
    "<b>Clean structure:</b> no subsidiaries, no regulatory penalties in three years, pays a dividend (₹2 a share)."
  ],
  wk: [
    "<b>Tied to markets:</b> 80% of revenue moves with trading volumes and fund flows. Q1 FY27 PAT ₹2.24 cr vs ₹2.85 cr a year earlier.",
    "<b>Margin book on borrowed money:</b> overdraft went from nil (FY24) to ₹19.5 cr; operating cash flow negative two years running.",
    "<b>Small and regional:</b> ₹41 cr revenue, 71 staff, Kolkata-based and family-run."
  ],
  dd: [
    "<b>RBI exemption:</b> it is exempt from NBFC registration as a stock broker. Routing holdco investments or lending through it could put that at risk.",
    "<b>75% public float rule:</b> the promoter block (74.99%) plus a 26% open offer could take a buyer past 75%, forcing a sell-down.",
    "<b>Leverage policy:</b> agree a ceiling on margin-book funding. Q2 FY27 results due 24 Oct 2026."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/0f9849f9-9639-4961-a98d-0a5663a537b4.pdf"], ["Screener", "https://www.screener.in/company/531169/"]]
},
{
  n: "B. N. Rathi Securities Limited", short: "B N Rathi", rank: 2, verdict: ["Good fit", "g"],
  line: "No borrowings and no contingent liabilities; profit steady but flat; promoter stake falling and split across the family.",
  px: { mc: 67.0, pb: 0.85, pr: 46.76, date: "23 Oct 2026" },
  rev: { total: 63.32, conf: ["High", "AR FY26 consolidated notes 23–24"],
    parts: [["brk", "Broking", 41.74], ["oth", "Other operating revenue (margin funding, depository, MF; not broken out)", 12.06], ["int", "Interest on bank deposits", 8.91], ["oth", "Management fees 0.39, trading 0.20, other 0.02", 0.61]],
    note: "Sub-broker share of brokerage was ₹28.5 cr, 68% of broking income, so most of the gross revenue is passed on. 75 employees." },
  debt: { gross: 0, prev: 0, nw: 79.0, sec: "n/a", tenor: "n/a", obs: "None (contingent liabilities nil)",
    fac: [],
    notes: ["No borrowings at any year-end FY23–FY26; the FY26 report confirms no external borrowings and nil contingent liabilities.", "Cash and bank balances of ₹82.1 cr sit against ₹122.8 cr of other current financial liabilities, which are mostly client money."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating at any agency, consistent with having no borrowings." },
  score: { pat: [7.58, 10.53, 9.46, 9.44], profit: ["Stable, flat", "w"], debt: [0, "Nil", "g"], reg: ["SEBI only", "g", "Broker; merchant banker Oct-26"], prom: ["46.8%", "Rathi family, falling"] },
  str: [
    "<b>No debt</b> and nil contingent liabilities.",
    "<b>Steady earnings:</b> PAT ₹9.4–10.5 cr in each of the last three years; pays a dividend (₹0.50 a share for FY26).",
    "<b>New IB licence:</b> SEBI merchant banker registration granted in Oct-26 adds a fee line."
  ],
  wk: [
    "<b>Thin margins:</b> 68% of broking income goes to sub-brokers; profit flat while total income rose 9% in FY26.",
    "<b>Other income doing heavy lifting:</b> ₹8.9 cr of interest on bank deposits against PBT of ₹13.5 cr; with ₹122.8 cr of client-related liabilities, part of this is likely earned on client balances.",
    "<b>Falling promoter stake:</b> 58.1% (Mar-22) to 46.8%, spread across four family members."
  ],
  dd: [
    "<b>SAST filings of 17 Oct 2026:</b> two Reg 29(2) disclosures (a stake move of 2% or more). Identify the buyer and seller.",
    "<b>Client money:</b> separate the firm's own funds from client funds, and see how much of the deposit interest depends on client balances.",
    "<b>Other operating revenue (₹12.1 cr):</b> ask for the split between margin funding, depository and MF income."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/ba751946-dc2d-4a6e-852f-0349b94227c2.pdf"], ["Screener", "https://www.screener.in/company/523019/consolidated/"]]
},
{
  n: "Nexome Capital Markets Limited", short: "Nexome", rank: 3, verdict: ["Low debt, lumpy profit", "w"],
  line: "Only debt is vehicle loans; FY26 profit came from one large IB year, cut by a ₹13 cr loan write-off; ₹32 cr still lent out.",
  px: { mc: 75.2, pb: 0.36, pr: 51.81, date: "23 Oct 2026" },
  rev: { total: 50.97, conf: ["High", "AR FY26 consolidated notes 25–26, 49"],
    parts: [["ib", "Investment banking", 44.84], ["trd", "Sale of shares and securities (gross)", 3.21], ["int", "Interest on loans 1.98, investment gains and other income", 2.92]],
    note: "The mix flips year to year: in FY25, 83% of revenue was sale of securities and 6% investment banking. 24 employees." },
  debt: { gross: 3.54, prev: 3.00, nw: 172, sec: "100%", tenor: "Vehicle loans, up to 5 yrs", obs: "None (contingent liabilities nil)",
    fac: [["Vehicle loans", 3.54, "HDFC Bank, ICICI Bank, BMW Financial Services", "Hypothecation of vehicles", "36–60 monthly instalments"]],
    notes: ["₹1.19 cr of the vehicle loans falls due within a year. There are also ₹3.32 cr of lease liabilities, which is why Screener shows about ₹7 cr of debt.", "Funded by equity instead: a ₹22 cr rights issue (Mar-26) and ₹9.2 cr on warrant conversion (Apr-26).", "On the asset side it has ₹32.4 cr of loans to unrelated parties (₹30.4 cr after a 6% provision)."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating under Nexome or its former name, SMIFS Capital Markets, and no rating filings on BSE." },
  score: { pat: [0.51, 2.41, 1.17, 10.71], profit: ["Lumpy", "b"], debt: [3.54, "Low", "g"], reg: ["SEBI only", "g", "Cat-I merchant banker"], prom: ["51.8%", "Parekh family"] },
  str: [
    "<b>Light balance sheet:</b> only vehicle loans; raised ₹31 cr of fresh equity across FY26–27 (rights issue and warrant conversion).",
    "<b>IB capability:</b> ₹44.8 cr of investment banking fees in FY26.",
    "<b>Low valuation:</b> 0.36x book; dividend restarted (₹1.50 a share)."
  ],
  wk: [
    "<b>Lumpy profit:</b> PAT ₹0.5 cr, ₹2.4 cr, ₹1.2 cr, then ₹10.7 cr in FY26; ₹9.5 cr of that came in Q4. Q1 FY27 was ₹1.3 cr.",
    "<b>Lending losses:</b> wrote off a ₹13.0 cr loan in FY26 after an arbitration ruling, and took a ₹1.94 cr exceptional charge, a 6% ad hoc provision on the ₹32.4 cr of loans still outstanding.",
    "<b>Book value volatility:</b> a ₹16.4 cr unrealised loss on equity investments, plus a ₹1.47 cr expected-credit-loss charge on the investment portfolio, made FY26 total comprehensive income −₹3.8 cr."
  ],
  dd: [
    "<b>Loan book:</b> who borrowed the written-off ₹13 cr, who holds the remaining ₹32.4 cr, and why a capital-markets firm lends at this scale. Trade receivables also rose from ₹0.28 cr to ₹9.86 cr.",
    "<b>Q4 FY26 deal fees:</b> one mandate or several, and whether they repeat. Professional fees also jumped to ₹5.8 cr.",
    "<b>Promoter group:</b> the Kayan group (9.5%) moved to public in Sep-25; the Parekh family now leads. BSE fined it for a corporate governance report error.",
    "<b>Bombay High Court deposit</b> of ₹0.59 cr: nature of the dispute."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/5515e71e-f958-4254-b214-b171ae7932ff.pdf"], ["Directors' report", "https://www.indiainfoline.com/company/nexome-capital-markets-ltd/reports/directors-report"], ["Screener", "https://www.screener.in/company/508905/consolidated/"]]
},
{
  n: "Pioneer Investcorp Limited", short: "Pioneer Investcorp", rank: 4, verdict: ["High debt", "b"],
  line: "₹105 cr of debt at BBB+; two-thirds of net worth sits in one associate; ₹79 cr unsecured loans out; ~43% of promoter shares pledged.",
  px: { mc: 62.8, pb: 0.36, pr: 65.91, date: "23 Oct 2026" },
  rev: { total: 54.86, conf: ["High", "AR FY26 consolidated notes 21–24"],
    parts: [["ib", "IB, arranger and advisory fees", 32.18], ["trd", "G-sec and bond trading (net of fair-value loss)", 12.41], ["int", "Interest income, mostly on inter-corporate loans", 7.84], ["brk", "Broking and depository", 2.13], ["oth", "Rent and other", 0.30]],
    note: "The associate's share of profit adds ₹4.7 cr below the line; with other income it makes up 66% of PBT. 34 employees in the parent." },
  debt: { gross: 105.39, prev: 138.74, nw: 171.76, sec: "90%", tenor: "Mostly repayable on demand", obs: "Promoter guarantee ₹120 cr; corporate guarantee ₹7.4 cr",
    fac: [["Demand loans (cash credit)", 67.90, "Federal Bank: ₹120 cr limit (parent), ₹100 cr (Pioneer Fundinvest)", "Pledge of G-secs, SDLs, AA/AAA bonds and receivables; 5–15% daily margin", "On demand, revolving"],
          ["Demand loans", 8.19, "Non-bank lenders", "Unsecured", "On demand"],
          ["Term loans", 10.47, "Bank", "MD's personal guarantee; mortgage of company and third-party property", "Up to 5 years"],
          ["Term loans", 18.84, "Financial institutions and others", "As above (part unsecured)", "Non-current"]],
    notes: ["Secured ₹95.3 cr, unsecured ₹10.1 cr. About ₹54 cr of the debt is in subsidiaries.", "Finance cost ₹12.3 cr against PBT of ₹19.4 cr. Shareholders approved up to ₹300 cr of NCDs at the Sep-26 AGM."] },
  credit: { rating: ["IVR BBB+ Stable", "w"],
    rated: [["Pioneer Investcorp", "Infomerics", "IVR BBB+ / Stable", "Dec-25", "₹120 cr cash credit"],
            ["Pioneer Fundinvest (100% subsidiary)", "Infomerics", "IVR BBB / Stable", "Sep-24", "₹100 cr cash credit"]],
    path: [["CARE", "AAA(SO) Jan-19, AA(SO) Apr-20, A(SO) Mar-21; withdrawn at the company's request Mar-22"],
           ["Infomerics", "AA+(CE) Jul-22, A− Jan-23, A− Negative Feb-23, BBB+ Negative 'issuer not cooperating' Mar-24, BBB+ Stable Sep-24, reaffirmed Dec-25"]],
    take: "The earlier high ratings rested on the bank's pledge structure. RBI stopped such 'credit enhanced' ratings in 2022, and the standalone view has been BBB-range since." },
  score: { pat: [2.06, 4.07, 7.89, 15.91], profit: ["Improving, volatile", "w"], debt: [105.39, "High", "b"], reg: ["NBFC subsidiary", "w", "Pioneer Fundinvest"], prom: ["65.9%", "~43% pledged"] },
  str: [
    "<b>Bank-controlled credit lines</b> (CARE, Infomerics): Federal Bank limits can only buy G-secs, SDLs and AA/AAA bonds, with 30/45-day holding limits and daily margin. Average use was 13–17%.",
    "<b>Fee income growing:</b> IB fees ₹6.5 cr (FY24), ₹17.8 cr (FY25), ₹32.2 cr (FY26).",
    "<b>Institutional buyers, long-standing promoter:</b> sells to MFs, banks and insurers; Gaurang Gandhi has over 30 years in debt markets.",
    "<b>Valuable associate:</b> Pioneer Insurance & Reinsurance Brokers grew income from ₹82 cr to ₹99.5 cr and EBITDA from ₹9.9 cr to ₹23.8 cr in FY24 (Infomerics)."
  ],
  wk: [
    "<b>Leverage higher than it looks</b> (Infomerics): adjusted gearing 3.1x and outside liabilities 6.3x net worth once the ₹109 cr associate and subsidiary stakes are deducted.",
    "<b>Thin interest cover:</b> 1.05x (FY24) and 1.68x (FY25).",
    "<b>Depends on the bond market:</b> traded volume fell from ₹20,001 cr (FY20) to ₹6,628 cr (FY22) and was ₹8,099 cr in FY25.",
    "<b>Quality of profit:</b> other income and the associate's share were 66% of FY26 PBT."
  ],
  dd: [
    "<b>Associate is 66% of net worth:</b> carried at ₹113 cr against ₹172 cr and consolidated from unaudited accounts. Much of the value may sit outside the listed company's direct control.",
    "<b>₹79 cr unsecured inter-corporate loans:</b> repayable on demand, no provision, partly funded by borrowing. Who are the borrowers?",
    "<b>Receivables of ₹119 cr</b> (about 795 days of revenue) with no credit-loss provision.",
    "<b>Rating conduct:</b> withdrew from CARE after three downgrades; in Mar-24 stopped sharing information and paying fees, so both group ratings went to 'issuer not cooperating'.",
    "<b>Encumbrances:</b> ~43% of promoter shares pledged; ₹120 cr personal guarantee would need replacing.",
    "<b>Related parties:</b> borrowed ₹53 cr from the associate and repaid it within the year; dealings with about 20 promoter-linked LLPs and companies.",
    "<b>Pioneer Fundinvest's status:</b> listed in an NBFC directory as RBI-registered, but Infomerics calls it a SEBI-registered dealer. Confirm; an NBFC needs RBI approval for a change of control."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/45430ad9-1049-4ed7-944d-cd085753c7d9.pdf"], ["Infomerics Dec-25", "https://www.infomerics.com/admin/uploads/PR_Pioneer_Investcorp10Dec25.pdf"], ["Infomerics Sep-24", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Investcorp_13sep24_76491e04df.pdf"], ["Fundinvest Sep-24", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Fundinvest_13sep24_925d3c70c5.pdf"], ["Fundinvest Jan-23", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Fundinvest_24jan23_34b10e04c5.pdf"], ["Infomerics Mar-24", "https://www.infomerics.com/admin/uploads/pr-Pioneer-Investcorp-19mar24.pdf"], ["Infomerics Jul-22", "https://www.infomerics.com/admin/uploads/pr-Pioneer-Investcorp-8july22.pdf"], ["CARE Mar-22", "https://www.careratings.com/upload/CompanyFiles/PR/29032022064204_Pioneer_Investcorp_Limited.pdf"], ["Screener", "https://www.screener.in/company/507864/consolidated/"]]
},
{
  n: "RR Financial Consultants Limited", short: "RR Financial", rank: 5, verdict: ["Parent is an NBFC", "b"],
  line: "The listed company is an RBI-registered NBFC, which fails the holdco test. One employee, 15 subsidiaries, profit only recent.",
  px: { mc: 66.4, pb: 1.21, pr: 74.87, date: "23 Oct 2026" },
  rev: { total: 33.78, conf: ["High", "AR FY26 consolidated note 35; AOC-1"],
    parts: [["brk", "Brokerage, consultancy and auxiliary services", 27.40], ["trd", "Securities trading (net of ₹525 cr purchases)", 5.67], ["oth", "Other operating revenue 0.27, other income 0.44", 0.71]],
    note: "The report does not split brokerage by business. By subsidiary (AOC-1), RR Insurance Brokers is the main earner: ₹8.1 cr turnover, ₹3.5 cr PAT. RR Investors Capital Services had ₹16.9 cr turnover but ₹0.2 cr PAT." },
  debt: { gross: 13.97, prev: 12.04, nw: 54.9, sec: "~100%", tenor: "Term loan, part current", obs: "Claims against company ₹1.9 cr (contingent)",
    fac: [["Term loan", 13.39, "AU Small Finance Bank (₹9.37 cr current, ₹4.02 cr non-current)", "Book debts, current and movable assets; mortgage of an associate's property; directors' personal guarantees", "Term"],
          ["Vehicle loan", 0.52, "HDFC Bank", "Hypothecation of vehicle", "Term"],
          ["Other loans", 0.04, "Not stated", "Unsecured", "Not stated"]],
    notes: ["Balance sheet total ₹13.97 cr; the facility notes add up to ₹13.95 cr.", "The listed company and an associate are co-borrowers on the AU Bank loan.", "Contingent liability: ₹1.9 cr of client claims in a government-guaranteed bond dispute where RR is a party."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating for the listed company or for RR Fincap, RR Investors Capital Services or RR Insurance Brokers." },
  score: { pat: [0.59, 0.43, 2.85, 8.09], profit: ["New and lumpy", "b"], debt: [13.97, "Moderate", "w"], reg: ["Parent is NBFC", "b", "Plus IRDAI broker"], prom: ["74.87%", "Prasad family"] },
  str: [
    "<b>Broad licence set:</b> stock broking, MF distribution and insurance broking across the group.",
    "<b>Insurance broker</b> is the most profitable unit (₹3.5 cr PAT on ₹8.1 cr turnover).",
    "<b>Single counterparty:</b> the Prasad family holds 74.87%; FY26 return on equity was 15.7%."
  ],
  wk: [
    "<b>The listed company is an RBI NBFC</b> (investment and credit company, registration N-14.03215, confirmed in the auditor's CARO report).",
    "<b>No profit record:</b> under ₹0.6 cr a year from FY16 to FY24, then ₹2.9 cr and ₹8.1 cr. Q4 FY26 PAT was ₹0.01 cr.",
    "<b>Complex group:</b> one employee in the listed company and 15 subsidiaries, four of them real-estate companies."
  ],
  dd: [
    "<b>Real-estate subsidiaries:</b> the AGM approved loans from the parent to them; get balances and recoverability.",
    "<b>Trading book:</b> ₹527 cr of gross securities sales in FY26 for ₹5.7 cr of net income. What is traded, and with what risk limits?",
    "<b>Share price:</b> 52-week high ₹264, now about ₹60; the stock has been under exchange surveillance (GSM). What drove the run-up?",
    "<b>Approvals:</b> RBI for the NBFC parent and IRDAI for RR Insurance Brokers. No dividend despite profit."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/7993af51-fdab-4e5b-841b-9106082beb93.pdf"], ["NBFC reg.", "https://www.rrfinance.com/"], ["Screener", "https://www.screener.in/company/511626/consolidated/"]]
}
];
