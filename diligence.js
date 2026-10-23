// Shortlist diligence data. One object per shortlisted company; `n` must match the company name in data.js.
// All financials are consolidated FY26 (year to 31 Mar 2026) from the audited annual report unless a source says otherwise.
// Revenue part keys: brk broking, dist distribution, ib IB & advisory, int interest/lending, trd trading, oth other.
// Pill tone: g good, w watch, b bad, n neutral. Amounts in ₹ crore. Bullets may use <b> for a lead label.
// MCA charge data is from the ZaubaCorp charge register (MCA filings), checked 24 Oct 2026.
window.DD_META = { asof: "24 Oct 2026", repo: "project4-gpc/listed-fs-dashboard" };
window.DD = [
{
  n: "SKP Securities Limited", short: "SKP Securities", rank: 1, verdict: ["Best fit", "g"],
  line: "Profit up every year since FY23; only debt is HDFC/ICICI overdraft funding margin loans; SEBI-regulated, no subsidiaries.",
  px: { mc: 65.4, pb: 1.07, pr: 74.99, date: "23 Oct 2026" },
  rev: { total: 41.0, conf: ["High", "AR FY26 notes 21–22 (standalone; no subsidiaries)"],
    parts: [["brk", "Broking", 16.67], ["dist", "MF and product distribution", 16.20], ["int", "Interest: margin funding 4.05, FDs 2.46, delayed payment 0.65", 7.17], ["oth", "Advisory 0.59, depository 0.39", 0.98]],
    note: "Institutional clients (MFs, institutions) are 56% of revenue. Margin-funding interest grew 44% in FY26. 71 employees." },
  debt: { gross: 19.53, prev: 10.02, nw: 60.40, sec: "100%", tenor: "Short-term", obs: "Bank guarantees ₹5.0 cr (contingent)",
    fac: [["Bank overdraft", 13.44, "HDFC Bank / ICICI Bank", "Pledge of ₹18.84 cr of fixed deposits", "Short-term, revolving"],
          ["Bank overdraft", 5.45, "HDFC Bank / ICICI Bank", "Mortgage of company's office (book value ₹8.31 cr)", "Short-term, revolving"],
          ["Vehicle loan", 0.64, "Not named in AR", "Hypothecation of vehicle", "Term (new in FY26)"]],
    notes: ["<b>Lenders and limits:</b> open MCA charges in favour of HDFC Bank (₹2 cr Nov-19; ₹15 cr Jul-21; ₹6.5 cr Mar-22) and ICICI Bank (₹1.8 cr and ₹0.58 cr, Mar-22): about ₹25.9 cr secured against ₹19.5 cr drawn.",
           "<b>Cost and purpose:</b> finance cost ₹1.40 cr on average debt of ₹14.8 cr, about 9.5%. The money funds the margin-trading book: ₹34.6 cr of client loans against pledged shares, up from ₹25.2 cr. Operating cash flow −₹7.2 cr (FY25), −₹7.4 cr (FY26).",
           "<b>Promoter credit line:</b> a ₹4 cr line from SKP Commodities (the Pachisias' company) was drawn and repaid day by day, ₹327.13 cr each way in FY26, at ₹10.88 lakh interest. Nil at year-end.",
           "All ₹36.6 cr of fixed deposits are pledged: ₹17.75 cr with exchanges for margin and ₹18.84 cr with the bank."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating. The FY26 report says none is required as it has no listed debt; banks lend against FDs and property." },
  score: { pat: [3.10, 8.65, 9.99, 10.35], profit: ["Stable, growing", "g"], debt: [19.53, "Low", "g"], reg: ["SEBI only", "g", "Broker, DP, merchant banker"], prom: ["74.99%", "Pachisia family, nil pledged"] },
  str: [
    "<b>Consistent growth:</b> PAT ₹3.1 cr (FY23) to ₹10.4 cr (FY26); return on equity around 19%.",
    "<b>Balanced fee base:</b> broking ₹16.7 cr and MF distribution ₹16.2 cr, each about 40% of revenue.",
    "<b>Institutional franchise:</b> 56% of revenue from MFs and institutions.",
    "<b>Clean ownership:</b> five Pachisia holders (Naresh 26.23%, HUF 14.69%, Manju 14.69%, Nikunj 9.69%, Vaibhav 9.69%), no shares pledged; no subsidiaries; ₹2 dividend."
  ],
  wk: [
    "<b>Tied to markets:</b> 80% of revenue moves with volumes and fund flows. Q1 FY27 PAT ₹2.24 cr vs ₹2.85 cr a year earlier.",
    "<b>Margin book on borrowed money:</b> overdraft from nil (FY24) to ₹19.5 cr; operating cash flow negative two years running.",
    "<b>Leans on the promoters' company:</b> besides the ₹327 cr round-trip credit line, SKP began paying SKP Commodities rent (₹21.96 lakh in FY26). In FY25 it borrowed and repaid ₹1.46 cr from Naresh, ₹0.90 cr from Nikunj and ₹1.90 cr from SKP Commodities."
  ],
  dd: [
    "<b>SKP Commodities:</b> a 100% subsidiary until 30 Sep 2017, when it was sold to Naresh, Manju, Nikunj and Vaibhav Pachisia (MarketScreener). It is now SKP's landlord and intraday lender. Get the terms, and confirm the line ends at closing.",
    "<b>RBI exemption:</b> it is exempt from NBFC registration as a stock broker. Routing holdco investments or lending through it could put that at risk.",
    "<b>75% public float rule:</b> the promoter block (74.99%) plus a 26% open offer could take a buyer past 75%, forcing a sell-down.",
    "<b>Leverage policy:</b> agree a ceiling on margin-book funding. Q2 FY27 results due 24 Oct 2026."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/0f9849f9-9639-4961-a98d-0a5663a537b4.pdf"], ["MCA charges", "https://www.zaubacorp.com/SKP-SECURITIES-LTD-L74140WB1990PLC049032"], ["SKP Commodities sale", "https://www.marketscreener.com/quote/stock/SKP-SECURITIES-LIMITED-20704911/news/Naresh-Pachisia-Manju-Pachisia-Nikunj-Pachisia-and-Vaibhav-Pachisia-agreed-to-acquire-SKP-Commodit-34967533/"], ["Screener", "https://www.screener.in/company/531169/"]]
},
{
  n: "B. N. Rathi Securities Limited", short: "B N Rathi", rank: 2, verdict: ["Good fit", "g"],
  line: "No year-end debt, but a ₹45 cr ICICI line used during the year; profit steady but flat; Rathi family stake falling.",
  px: { mc: 67.0, pb: 0.85, pr: 46.76, date: "23 Oct 2026" },
  rev: { total: 63.32, conf: ["High", "AR FY26 consolidated notes 23–24"],
    parts: [["brk", "Broking", 41.74], ["oth", "Other operating revenue (margin funding, depository, MF; not broken out)", 12.06], ["int", "Interest on bank deposits", 8.91], ["oth", "Management fees 0.39, trading 0.20, other 0.02", 0.61]],
    note: "Sub-broker share of brokerage was ₹28.5 cr, 68% of broking income, so most of the gross revenue is passed on. 75 employees." },
  debt: { gross: 0, prev: 0, nw: 79.0, sec: "n/a", tenor: "n/a", obs: "Bank guarantees backed by ₹20.0 cr margin deposits; amount not disclosed",
    fac: [["Working capital and bank guarantees", 0, "ICICI Bank (₹45 cr charge, Jan-24)", "Personal guarantees of Hari Narayan Rathi (MD) and Chetan Rathi (ED); margin deposits", "Revolving; nil drawn at 31 Mar"]],
    notes: ["<b>Used during the year:</b> working-capital interest ₹0.37 cr (FY25 ₹0.58 cr) plus ₹0.37 cr of other borrowing costs, though year-end borrowings were nil. The auditor confirms working-capital limits above ₹5 cr sanctioned against directors' guarantees.",
           "<b>Charge history:</b> ICICI ₹50 cr (Dec-21) replaced by ₹45 cr on 4 Jan 2024; HDFC Bank ₹5 cr (2018–20).",
           "<b>Contingent liabilities shown as nil</b>, yet ₹20.03 cr of deposits are held as margin against bank guarantees. The guarantee amount is not disclosed."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating at any agency." },
  score: { pat: [7.58, 10.53, 9.46, 9.44], profit: ["Stable, flat", "w"], debt: [0, "Nil at year-end", "g"], reg: ["SEBI only", "g", "Broker; merchant banker Oct-26"], prom: ["46.8%", "Rathi family, nil pledged"] },
  str: [
    "<b>No year-end debt;</b> ₹82.1 cr cash and bank balances.",
    "<b>Steady earnings:</b> PAT ₹9.4–10.5 cr in each of the last three years; ₹0.50 dividend for FY26.",
    "<b>New IB licence:</b> SEBI merchant banker registration (announced 6 Oct 2026) adds a fee line."
  ],
  wk: [
    "<b>Thin margins:</b> 68% of broking income goes to sub-brokers; profit flat while total income rose 9% in FY26.",
    "<b>Other income doing heavy lifting:</b> ₹8.9 cr of deposit interest against PBT of ₹13.5 cr; with ₹122.8 cr of client-related liabilities, part is likely earned on client balances.",
    "<b>Promoter reshuffle:</b> Chetan Rathi, a guarantor of the ICICI line, cut his stake from 10.89% (Sep-23) to 0.14%, while Nisha Rathi rose from 4.40% to 12.17%. Promoters now: Hari Narayan 28.02%, Nisha 12.17%, Chanda Devi 6.43%."
  ],
  dd: [
    "<b>Desai family exit, disclosed 20 months late:</b> Priyanka Darshan Desai and Darshan P Desai HUF (non-promoters) sold 3.53% and 3.26% in the open market between 10 Jan and 5 Feb 2025, cutting their combined stake from 14.31% to 7.51%. The Reg 29(2) disclosures reached BSE only on 17 Oct 2026; the rule allows two working days.",
    "<b>Bank guarantees:</b> get the amount and beneficiaries of the ICICI guarantees, and replace the Rathis' personal guarantees at closing.",
    "<b>Client money:</b> separate firm funds from client funds, and see how much deposit interest depends on client balances.",
    "<b>Other operating revenue (₹12.1 cr):</b> ask for the split between margin funding, depository and MF income."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/ba751946-dc2d-4a6e-852f-0349b94227c2.pdf"], ["Desai Reg 29(2)", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/CF615083_6391_4B2F_8982_46F74EAF3263_174624.pdf"], ["MCA charges", "https://www.zaubacorp.com/B-N-RATHI-SECURITIES-LIMITED-L65993TG1985PLC005838"], ["Screener", "https://www.screener.in/company/523019/consolidated/"]]
},
{
  n: "Nexome Capital Markets Limited", short: "Nexome", rank: 3, verdict: ["Low debt, lumpy profit", "w"],
  line: "Only debt is car loans; FY26 profit came from one big IB quarter, cut by a ₹13 cr loan write-off; ₹32 cr still lent out.",
  px: { mc: 75.2, pb: 0.36, pr: 51.81, date: "23 Oct 2026" },
  rev: { total: 50.97, conf: ["High", "AR FY26 consolidated notes 25–26, 49"],
    parts: [["ib", "Investment banking", 44.84], ["trd", "Sale of shares and securities (gross)", 3.21], ["int", "Interest on loans 1.98, investment gains and other income", 2.92]],
    note: "The mix flips year to year: in FY25, 83% of revenue was sale of securities and 6% investment banking. 24 employees." },
  debt: { gross: 3.54, prev: 3.00, nw: 172, sec: "100%", tenor: "Vehicle loans, up to 5 yrs", obs: "None (contingent liabilities nil)",
    fac: [["Vehicle loan", null, "BMW Financial Services", "Hypothecation of vehicle", "₹5,51,626 × 36 months from Sep-24"],
          ["Vehicle loan", null, "ICICI Bank", "Hypothecation of vehicle", "₹3,15,028 × 60 months from Mar-25"],
          ["Vehicle loans", null, "HDFC Bank", "Hypothecation of vehicles", "Incl. ₹14,903 × 48 months from May-23"]],
    notes: ["Total ₹3.54 cr, ₹1.19 cr due within a year; the AR gives instalments but not rates or a split by lender. There are also ₹3.32 cr of lease liabilities, which is why Screener shows about ₹7 cr of debt.",
           "<b>No open charge on the MCA register:</b> the last ones, HDFC ₹18 cr (2010–13) and Peerless ₹6 cr (1996–2005), are closed.",
           "Funded by equity instead: ₹22.04 cr rights issue (Mar-26) and ₹9.2 cr on warrant conversion (Apr-26). Lends out ₹32.4 cr to unrelated parties (₹30.4 cr after a 6% provision)."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating under Nexome or its former name, SMIFS Capital Markets, and no rating filings on BSE." },
  score: { pat: [0.51, 2.41, 1.17, 10.71], profit: ["Lumpy", "b"], debt: [3.54, "Low", "g"], reg: ["SEBI only", "g", "Cat-I merchant banker"], prom: ["51.8%", "Parekh group, nil pledged"] },
  str: [
    "<b>Light balance sheet:</b> only car loans; ₹31 cr of fresh equity across FY26–27.",
    "<b>IB capability:</b> ₹44.8 cr of investment banking fees in FY26.",
    "<b>Low valuation:</b> 0.36x book; dividend restarted (₹1.50 a share)."
  ],
  wk: [
    "<b>Lumpy profit:</b> PAT ₹0.5 cr, ₹2.4 cr, ₹1.2 cr, then ₹10.7 cr in FY26, ₹9.5 cr of it in Q4. Q1 FY27 was ₹1.3 cr.",
    "<b>Rights money goes to the market:</b> of the ₹22.04 cr raised, ₹13.56 cr (62%) was earmarked for investing in shares, securities and MFs, ₹2.78 cr to meet SEBI's merchant-banker net-worth rule, and ₹5.40 cr for general purposes.",
    "<b>Book value volatility:</b> a ₹16.4 cr unrealised equity loss and a ₹1.47 cr credit-loss charge on investments made FY26 total comprehensive income −₹3.8 cr.",
    "<b>Warrants under water:</b> allotted Oct-24 at ₹64 (Utsav Parekh 3.88 lakh, Panchganga Advisors 3.85 lakh, Monet Securities 3.85 lakh, Forbes EMF 3.82 lakh, Chivas Trading 3.80 lakh), converted 20 Apr 2026; the stock is ₹51.81."
  ],
  dd: [
    "<b>Loan loss not in the offer document:</b> an expected-credit-loss provision on a loan was booked in the Jun-25 quarter, and the auditor drew attention to it in Q3. Yet the rights Letter of Offer (12 Mar 2026) listed only one tax case (₹1.55 cr), no arbitration and no risk factor on the loan. Thirteen days later an arbitration order (25 Mar 2026) led to the ₹13.04 cr write-off. Who was the borrower?",
    "<b>Remaining ₹32.4 cr loan book:</b> borrowers, security and why a merchant banker lends at this scale. Trade receivables rose from ₹0.28 cr to ₹9.86 cr.",
    "<b>Q4 FY26 deal fees:</b> one mandate or several? Professional fees rose to ₹5.8 cr and travel from ₹0.09 cr to ₹1.11 cr.",
    "<b>Promoter group:</b> Progressive Star Finance 17.14%, Lend Lease (India) 14.16%, Stewart Investment 11.76%, Utsav Parekh 4.96%. The Kayan group moved to public in Sep-25. BSE fined it for a corporate governance report error.",
    "<b>City Civil Court, Bombay deposit</b> of ₹0.59 cr, expensed in FY25: nature of the dispute."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/5515e71e-f958-4254-b214-b171ae7932ff.pdf"], ["Letter of Offer", "https://www.bseindia.com/downloads/ipo/Letter%20of%20Offer_120320261206.pdf"], ["MCA charges", "https://www.zaubacorp.com/NEXOME-CAPITAL-MARKETS-LIMITED-L74300WB1983PLC036342"], ["Screener", "https://www.screener.in/company/508905/consolidated/"]]
},
{
  n: "Pioneer Investcorp Limited", short: "Pioneer Investcorp", rank: 4, verdict: ["High debt", "b"],
  line: "₹105 cr of Federal Bank-led debt at BBB+; 35 lakh promoter shares pledged to Federal Bank since 2018; stock in ESM.",
  px: { mc: 62.8, pb: 0.36, pr: 65.91, date: "23 Oct 2026" },
  rev: { total: 54.86, conf: ["High", "AR FY26 consolidated notes 21–24"],
    parts: [["ib", "IB, arranger and advisory fees", 32.18], ["trd", "G-sec and bond trading (net of fair-value loss)", 12.41], ["int", "Interest income, mostly on inter-corporate loans", 7.84], ["brk", "Broking and depository", 2.13], ["oth", "Rent and other", 0.30]],
    note: "The associate's share of profit adds ₹4.7 cr below the line; with other income it makes up 66% of PBT. 34 employees in the parent." },
  debt: { gross: 105.39, prev: 138.74, nw: 171.76, sec: "90%", tenor: "Mostly repayable on demand", obs: "Promoter guarantee ₹120 cr; corporate guarantee ₹7.4 cr",
    fac: [["Demand loans (cash credit)", 67.90, "Federal Bank: ₹120 cr limit (parent), ₹100 cr (Pioneer Fundinvest)", "Pledge of G-secs, SDLs, AA/AAA bonds and receivables; 5–15% daily margin", "On demand, revolving"],
          ["Demand loans", 8.19, "Non-bank lenders (not named)", "Unsecured", "On demand"],
          ["Term loans", 10.47, "Bank", "MD's personal guarantee; mortgage of company and third-party property", "Up to 5 years"],
          ["Term loans", 18.84, "Financial institutions and others", "As above (part unsecured)", "Non-current"]],
    notes: ["<b>Cost:</b> interest on borrowings ₹9.94 cr on average debt of ₹122 cr, about 8.1%, all floating. Other borrowing costs rose from ₹0.38 cr to ₹1.81 cr. Finance cost ₹12.3 cr against PBT of ₹19.4 cr.",
           "<b>Purpose:</b> the demand loans carry the G-sec and bond trading inventory. Parent ₹51.0 cr (FY25 ₹99.0 cr); the rest, about ₹54 cr, is in subsidiaries.",
           "<b>Open MCA charges (parent):</b> Federal Bank ₹360 cr (Nov-17, modified Mar-20), ₹15.5 cr (May-18) and ₹13.07 cr (Jun-18). Closed: Axis ₹100 cr, HDFC ₹50 cr, ICICI ₹36 cr, IIFL ₹15 cr.",
           "<b>Associate's lenders</b> (Pioneer Insurance & Reinsurance Brokers): SBM Bank (India) ₹30 cr (Dec-19, modified Jul-24), Axis ₹1.31 cr (Mar-24), HDFC car loans. Shareholders approved up to ₹300 cr of NCDs at the Sep-26 AGM."] },
  credit: { rating: ["IVR BBB+ Stable", "w"],
    rated: [["Pioneer Investcorp", "Infomerics", "IVR BBB+ / Stable", "Dec-25", "₹120 cr cash credit"],
            ["Pioneer Fundinvest (100% subsidiary)", "Infomerics", "IVR BBB / Stable", "Sep-24", "₹100 cr cash credit"]],
    path: [["CARE", "AAA(SO) Jan-19, AA(SO) Apr-20, A(SO) Mar-21; withdrawn at the company's request Mar-22"],
           ["Infomerics", "AA+(CE) Jul-22, A− Jan-23, A− Negative Feb-23, BBB+ Negative 'issuer not cooperating' Mar-24, BBB+ Stable Sep-24, reaffirmed Dec-25"]],
    take: "The earlier high ratings rested on the bank's pledge structure. RBI stopped such 'credit enhanced' ratings in 2022, and the standalone view has been BBB-range since." },
  score: { pat: [2.06, 4.07, 7.89, 15.91], profit: ["Improving, volatile", "w"], debt: [105.39, "High", "b"], reg: ["NBFC subsidiary", "w", "Pioneer Fundinvest"], prom: ["65.9%", "28.5% of equity pledged"] },
  str: [
    "<b>Bank-controlled credit lines</b> (CARE, Infomerics): Federal Bank limits can only buy G-secs, SDLs and AA/AAA bonds, with 30/45-day holding limits and daily margin. Average use 13–17%.",
    "<b>Fee income growing:</b> IB fees ₹6.5 cr (FY24), ₹17.8 cr (FY25), ₹32.2 cr (FY26).",
    "<b>Debt coming down:</b> ₹138.7 cr to ₹105.4 cr in FY26; the Axis Bank share pledges were fully released by Feb-23.",
    "<b>Valuable associate:</b> Pioneer Insurance & Reinsurance Brokers grew income from ₹82 cr to ₹99.5 cr and EBITDA from ₹9.9 cr to ₹23.8 cr in FY24 (Infomerics)."
  ],
  wk: [
    "<b>Promoter shares pledged for company debt:</b> Gaurang Gandhi has 35,00,000 shares (43.75% of his 79,99,167; 28.46% of the company) pledged to Federal Bank since 31 Mar 2018. They are extra security for ₹9.50 cr Pioneer borrowed for working capital: about ₹17.9 cr of stock at today's price. No other promoter has pledged.",
    "<b>Pledge history:</b> nil until Dec-17, peak 45 lakh (Dec-18 to Jun-19). Axis Bank took 3.5 lakh in Dec-17 and more through Nov-18 to back a ₹6 cr loan to the associate; released in Aug-19, Jan-20 and Feb-23.",
    "<b>Leverage higher than it looks</b> (Infomerics): adjusted gearing 3.1x and outside liabilities 6.3x net worth after deducting associate and subsidiary stakes. Interest cover 1.05x (FY24), 1.68x (FY25).",
    "<b>Earnings and stock sliding:</b> consolidated PAT fell 40.5% YoY in Q4 FY26 and 45.2% in Q1 FY27 (Business Standard). The stock is in BSE's ESM Stage 1, trade-for-trade with a 5% band; free-float market cap ₹20.6 cr."
  ],
  dd: [
    "<b>Pledge release:</b> a buyer needs Federal Bank to release the 35 lakh shares and Gandhi's ₹120 cr personal guarantee. The 1 Oct 2019 disclosure ties the pledge to the company's own loan, so the lender's consent is a closing condition.",
    "<b>Associate is 66% of net worth:</b> carried at ₹113 cr against ₹172 cr and consolidated from unaudited accounts.",
    "<b>₹79 cr unsecured inter-corporate loans:</b> repayable on demand, no provision, partly funded by borrowing. Who are the borrowers?",
    "<b>Receivables of ₹119 cr</b> (about 795 days of revenue) with no credit-loss provision.",
    "<b>Rating conduct:</b> withdrew from CARE after three downgrades; in Mar-24 stopped sharing information and paying fees, so both group ratings went to 'issuer not cooperating'.",
    "<b>Related parties:</b> borrowed ₹53 cr from the associate and repaid it within the year; dealings with about 20 promoter-linked LLPs and companies.",
    "<b>Pioneer Fundinvest's status:</b> listed in an NBFC directory as RBI-registered, but Infomerics calls it a SEBI-registered dealer. Confirm; an NBFC needs RBI approval for a change of control."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/45430ad9-1049-4ed7-944d-cd085753c7d9.pdf"], ["Pledge reasons Oct-19", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/B32912AB_7885_457B_AE23_5EE99606A120_191757.pdf"], ["MCA charges", "https://www.zaubacorp.com/PIONEER-INVESTCORP-LIMITED-L65990MH1984PLC031909"], ["Associate charges", "https://www.zaubacorp.com/PIONEER-INSURANCE-AND-REINSURANCE-BROKERS-PRIVATE-LIMITED-U67200MH2002PTC137896"], ["BS Q4 FY26", "https://www.business-standard.com/amp/markets/capital-market-news/pioneer-investcorp-consolidated-net-profit-declines-40-49-in-the-march-2026-quarter-126060100370_1.html"], ["BS Q1 FY27", "https://www.business-standard.com/amp/markets/capital-market-news/pioneer-investcorp-consolidated-net-profit-declines-45-15-in-the-june-2026-quarter-126081300169_1.html"], ["Infomerics Dec-25", "https://www.infomerics.com/admin/uploads/PR_Pioneer_Investcorp10Dec25.pdf"], ["Infomerics Sep-24", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Investcorp_13sep24_76491e04df.pdf"], ["Fundinvest Sep-24", "https://infomericstorage.blob.core.windows.net/uploads/pr_Pioneer_Fundinvest_13sep24_925d3c70c5.pdf"], ["Infomerics Mar-24", "https://www.infomerics.com/admin/uploads/pr-Pioneer-Investcorp-19mar24.pdf"], ["CARE Mar-22", "https://www.careratings.com/upload/CompanyFiles/PR/29032022064204_Pioneer_Investcorp_Limited.pdf"], ["Screener", "https://www.screener.in/company/507864/consolidated/"]]
},
{
  n: "RR Financial Consultants Limited", short: "RR Financial", rank: 5, verdict: ["Parent is an NBFC", "b"],
  line: "The listed company is an RBI-registered NBFC, which fails the holdco test; just approved up to ₹200 cr of public NCDs.",
  px: { mc: 66.4, pb: 1.21, pr: 74.87, date: "23 Oct 2026" },
  rev: { total: 33.78, conf: ["High", "AR FY26 consolidated note 35; AOC-1"],
    parts: [["brk", "Brokerage, consultancy and auxiliary services", 27.40], ["trd", "Securities trading (net of ₹525 cr purchases)", 5.67], ["oth", "Other operating revenue 0.27, other income 0.44", 0.71]],
    note: "The report does not split brokerage by business. By subsidiary (AOC-1), RR Insurance Brokers is the main earner: ₹8.1 cr turnover, ₹3.5 cr PAT. RR Investors Capital Services had ₹16.9 cr turnover but ₹0.2 cr PAT." },
  debt: { gross: 13.97, prev: 12.04, nw: 54.9, sec: "~100%", tenor: "Term loan, part current", obs: "Claims against company ₹1.9 cr (contingent)",
    fac: [["Term loan", 13.39, "AU Small Finance Bank (₹9.37 cr current, ₹4.02 cr non-current)", "Book debts, current and movable assets; mortgage of an associate's property; directors' personal guarantees", "Term"],
          ["Vehicle loan", 0.52, "HDFC Bank", "Hypothecation of vehicle", "Term"],
          ["Other loans", 0.04, "Not stated", "Unsecured", "Not stated"]],
    notes: ["<b>Who borrows:</b> the AU Bank loan sits in a subsidiary; the listed company and an associate are co-borrowers. The listed company has no open MCA charge (its last, Corporation Bank ₹4 cr, closed Apr-24).",
           "<b>Cost:</b> finance cost ₹0.52 cr; the AR gives no rate. Balance sheet total ₹13.97 cr; the facility notes add to ₹13.95 cr.",
           "<b>Guarantees:</b> the AGM approved up to ₹8.5 cr of borrowings and bank-guarantee commission with RR Investors Capital Services. Contingent: ₹1.9 cr of client claims in a government-guaranteed bond dispute."] },
  credit: { rating: ["Not rated", "n"], rated: [], path: [],
    take: "No credit rating for the listed company or for RR Fincap, RR Investors Capital Services or RR Insurance Brokers. A public NCD issue would need one first." },
  score: { pat: [0.59, 0.43, 2.85, 8.09], profit: ["New and lumpy", "b"], debt: [13.97, "Moderate", "w"], reg: ["Parent is NBFC", "b", "Plus IRDAI broker"], prom: ["74.87%", "Rajat Prasad 70.48%, nil pledged"] },
  str: [
    "<b>Broad licence set:</b> stock broking, MF distribution and insurance broking across the group.",
    "<b>Insurance broker</b> is the most profitable unit (₹3.5 cr PAT on ₹8.1 cr turnover).",
    "<b>Single counterparty:</b> Rajat Prasad went from 58.73% (Sep-24) to 70.48% by folding in family holding companies; FY26 return on equity 15.7%."
  ],
  wk: [
    "<b>The listed company is an RBI NBFC</b> (NBFC-ND-NSI, certificate of 11 Mar 1998, N-14.03215).",
    "<b>Debt plans out of scale:</b> on 21 Sep 2026 shareholders approved NCDs by private placement and a public NCD issue of up to ₹200 cr, 3.6x net worth, for 'working capital and general corporate purposes'. Promoters' 82.8 lakh votes carried both; 57 votes were against.",
    "<b>No profit record:</b> under ₹0.6 cr a year from FY16 to FY24, then ₹2.9 cr and ₹8.1 cr. Q4 FY26 PAT was ₹0.01 cr.",
    "<b>Complex group:</b> one employee in the listed company and 15 subsidiaries, four of them real-estate companies."
  ],
  dd: [
    "<b>NCD intent:</b> what the ₹200 cr is for. An NBFC with public debt adds RBI and debenture-trustee consents to any change of control.",
    "<b>Related-party lending:</b> the AGM approved loans to Priya Darshan Real Estate (₹1.5 cr), RR Equity Brokers (₹3 cr), RR Fine Art Enterprises (₹0.5 cr) and Shivom Holdings (₹0.5 cr). Get balances and recoverability.",
    "<b>Trading book:</b> ₹527 cr of gross securities sales in FY26 for ₹5.7 cr of net income. What is traded, and with what risk limits?",
    "<b>Share price:</b> 52-week high ₹264, now about ₹60; the stock has been under GSM surveillance. An independent director left on 28 Sep 2026."
  ],
  src: [["AR FY26", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/7993af51-fdab-4e5b-841b-9106082beb93.pdf"], ["AGM votes", "https://www.bseindia.com/xml-data/corpfiling/AttachHis/36525d01-3209-4126-a3a3-b28fe6a42937.pdf"], ["MCA charges", "https://www.zaubacorp.com/R-R-FINANCIAL-CONSULTANTS-LTD-L74899DL1986PLC023530"], ["Screener", "https://www.screener.in/company/511626/consolidated/"]]
}
];
