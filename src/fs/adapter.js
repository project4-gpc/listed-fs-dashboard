/* Listed FS screener — adapter. Turns data.js + market.js + diligence.js + shortlist.js into the kit MODEL.
   Merge rules are unchanged from the previous dashboard (see comments); no figure is altered here. */
(function(){
const K = window.Kit;
const MIN_BASE = 2; // ₹ cr: growth off a smaller prior-year base is shown as n.m.
const MANDATE = {lo:40, hi:130, pat:5};
const VERTS = [
  ["NBFC - Lending & Investment","NBFC lending"],
  ["Investment Banking & Advisory","IB & advisory"],
  ["Stock & Commodity Broking","Broking"],
  ["Fintech / Digital Lending & Payments","Fintech & payments"],
  ["Financial Products Distribution","Distribution"],
  ["Forex & Remittance Services","Forex & remittance"],
  ["Asset/Equipment Finance","Asset finance"],
  ["Other / Diversified","Other / diversified"]
];
const PART = {brk:"Broking",dist:"Distribution",ib:"IB & advisory",int:"Interest / lending",trd:"Trading",oth:"Other"};
const PART_ORDER = ["brk","dist","ib","int","trd","oth"];
const TONE = {g:"pos",w:"warn",b:"neg",n:"neu"};

function merge(src){
  const MKT = src.MKT || {asof:null, co:{}};
  const MKT_KEYS = ["mc","pe","pb","r24","r25","r26","p24","p25","p26","pr","fii","dii","rt","gd"];
  return (src.RAW_BASE||[]).map(r=>{
    const m = MKT.co && MKT.co[r.t]; if(!m) return {...r, _mkt:false};
    const o = {...r, _mkt:true, price:m.price, shq:m.shq, basis:m.basis};
    // Screener rounds figures above ~₹100 cr (and many FY totals) to whole crores; keep the more precise base value when it rounds to the same number.
    MKT_KEYS.forEach(k=>{ if(m[k]==null) return; if(k!=="mc" && Number.isInteger(m[k]) && r[k]!=null && Math.abs(r[k]-m[k])<1) return; o[k]=m[k]; });
    // Borrowings: Screener's figure folds in leases; keep the audited figure in data.js whenever one is recorded.
    if(r.gd!=null) o.gd=r.gd;
    if(m.fii!=null || m.dii!=null) o.inst = +((o.fii||0)+(o.dii||0)).toFixed(2);
    if(o.gd!=null && r.cash!=null) o.nd = +(o.gd - r.cash).toFixed(2);
    return o;
  });
}

function build(src, opts){
  opts = opts||{};
  const MKT = src.MKT || {asof:null, co:{}, failed:[]};
  const DD = (src.DD||[]).slice().sort((a,b)=>a.rank-b.rank);
  const DDM = src.DD_META || {};
  const SL = src.SHORTLIST || {names:[], notes:{}};
  const rows = merge(src);
  const ids = K.uniqueSlugs(rows.map(r=>r.n));
  const shortNames = new Set(SL.names||[]);
  const failed = new Set((MKT.failed||[]).map(f=>typeof f==="string"?f:(f.t||f.ticker||f.n)));
  const vkey = full => VERTS.findIndex(v=>v[0]===full);

  const companies = rows.map((r,i)=>{
    const [ex,tk] = String(r.t||":").split(":");
    const rg=K.growth(r.r26,r.r25,MIN_BASE), pg=K.growth(r.p26,r.p25,MIN_BASE), rg3=K.cagr(r.r26,r.r24,2,MIN_BASE), pg3=K.cagr(r.p26,r.p24,2,MIN_BASE);
    const ctrlPct = r.pr==null?null:Math.min(100,r.pr+26);
    const groups = (r.v||[]).map(v=>({key:String(Math.max(0,vkey(v[0]))), pct:v[1]}));
    const prim = (r.v||[]).slice().sort((a,b)=>(b[1]??-1)-(a[1]??-1))[0]?.[0] || "Other / Diversified";
    const dd = DD.find(x=>x.n===r.n) || null;
    const m = { mc:r.mc, price:r.price??null, r24:r.r24, r25:r.r25, r26:r.r26, p24:r.p24, p25:r.p25, p26:r.p26,
      rg:rg.v, pg:pg.v, rg3:rg3.v, pg3:pg3.v,
      pm: r.r26 ? r.p26/r.r26*100 : null,
      pe:r.pe, pb:r.pb, roe:(r.pb&&r.pe)? r.pb/r.pe*100 : null,
      pr:r.pr, fii:r.fii, dii:r.dii, rt:r.rt, inst:r.inst??null,
      gd:r.gd, cash:r.cash, nd:r.nd??null,
      ndmc: (r.nd!=null&&r.mc)? r.nd/r.mc*100 : null,
      ctrl: ctrlPct==null||r.mc==null?null:r.mc*ctrlPct/100 };
    const nm = {rg:rg.nm, pg:pg.nm, rg3:rg3.nm, pg3:pg3.nm};
    const fit = r.mc>=MANDATE.lo && r.mc<=MANDATE.hi && r.p26>=MANDATE.pat;
    const review = !!r.rv || /flagged for review/i.test(r.ev||"");
    const oddPE = r.pe!=null && r.pe<2;
    const flags = [];
    if(fit) flags.push({key:"mandate",label:"Mandate",tone:"info",tip:`Market cap ₹${MANDATE.lo}–${MANDATE.hi} cr and FY26 PAT ≥ ₹${MANDATE.pat} cr.`});
    if(dd) flags.push({key:"diligence",label:"Diligence",tone:"brand",tip:`Shortlist diligence on file (as of ${DDM.asof||"n/a"}).`});
    if(review) flags.push({key:"review",label:"Review",tone:"warn",tip:"Vertical classification flagged for review in the source workbook."});
    if(oddPE) flags.push({key:"checkpat",label:"Check PAT",tone:"warn",tip:"P/E below 2x: FY26 PAT likely includes one-offs or associate income."});
    if(!(r.pr>0)) flags.push({key:"nopromoter",label:"No promoter",tone:"warn",tip:"No promoter shareholding is reported."});
    const dq = [];
    if(failed.has(r.t)) dq.push({level:"neg",text:"Latest market refresh failed for this company; market figures are from the previous refresh."});
    if(!r._mkt) dq.push({level:"warn",text:"No Screener refresh for this ticker; all figures are from the workbook."});
    if(review) dq.push({level:"warn",text:"Vertical classification flagged for review in the source."});
    if(oddPE) dq.push({level:"warn",text:`P/E of ${r.pe}x looks too low for an operating business; check FY26 PAT for one-offs.`});
    if(r.cash==null) dq.push({level:"info",text:"Cash not recorded, so net debt cannot be computed."});
    ["mc","pe","pb","r26","p26","pr"].forEach(k=>{ if(r[k]==null) dq.push({level:"info",text:`${k.toUpperCase()} missing in the source.`}); });
    Object.entries(nm).forEach(([k,v])=>{ if(v) dq.push({level:"info",text:`${({rg:"Revenue growth",pg:"PAT growth",rg3:"Revenue CAGR",pg3:"PAT CAGR"})[k]}: ${v}`}); });
    if(r.basis==="standalone") dq.push({level:"info",text:"Screener has no consolidated figures; standalone figures shown."});
    if(r.p26!=null&&r.r26!=null&&r.p26>r.r26) dq.push({level:"warn",text:"FY26 PAT exceeds FY26 revenue: check for other income or a data error."});
    const notes = SL.notes && SL.notes[r.n] || {};
    return {
      id:ids[i], name:r.n, ticker:tk||"", exchange:ex==="NSEI"?"NSE":ex||"", code:r.t,
      groups, prim:String(Math.max(0,vkey(prim))), desc:r.ev||"", seg:r.seg||"",
      m, nm, flags, fit, dq,
      shortlisted: shortNames.has(r.n),
      verdict: dd? {label:dd.verdict[0], tone:TONE[dd.verdict[1]]||"neu"} : (notes.verdict? {label:notes.verdict, tone:"neu"} : null),
      thesis: dd? dd.line : (notes.thesis||""),
      updated: dd? (DDM.asof||null) : (notes.updated||SL.updated||null),
      open: dd? dd.dd||[] : [],
      dd,
      hold: {asof:r.shq||null, parts:[{label:"Promoter",value:r.pr},{label:"FII",value:r.fii},{label:"DII",value:r.dii},{label:"Public",value:r.rt}]},
      revMix: dd&&dd.rev? {total:dd.rev.total, source:dd.rev.conf?dd.rev.conf[1]:"", conf:dd.rev.conf?dd.rev.conf[0]:"", note:dd.rev.note||"",
        parts: dd.rev.parts.slice().sort((a,b)=>PART_ORDER.indexOf(a[0])-PART_ORDER.indexOf(b[0])).map(p=>({key:p[0], label:PART[p[0]]||p[0], detail:p[1], value:p[2]}))} : null,
      contacts:(r.li||[]).map(u=>({label:u.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//,"").replace(/[\/?].*$/,""), url:u})),
      sources: dd? dd.src.map(s=>({label:s[0],url:s[1],date:DDM.asof||""})) : [],
      fin:{cats:["FY24","FY25","FY26"], rev:[r.r24,r.r25,r.r26], pat:[r.p24,r.p25,r.p26]}
    };
  });

  const asofStr = MKT.asof || null;
  return {
    key:"fs",
    product:"Listed FS Platform Screener",
    subtitle:"Small-cap listed Indian financial services · consolidated FY24–FY26",
    asof: asofStr, asofDate: K.parseAsof(asofStr), staleAfterHours: 30,
    asofNote:"Market data refresh from Screener.in, weekdays 4 PM IST",
    failed:[...failed],
    repo: DDM.repo || "project4-gpc/listed-fs-dashboard", shortlistFile:"shortlist.js",
    shortlistMeta: SL,
    groupLabel:"Vertical", groupLabelPlural:"Verticals", multiGroup:true,
    groups: VERTS.map((v,i)=>({key:String(i), label:v[0], short:v[1], color:`var(--viz-${i+1})`, shape:window.Charts.SHAPES[i], n:companies.filter(c=>c.groups.some(g=>g.key===String(i))).length})),
    companies,
    minBase: MIN_BASE,
    mandate:{metric:"mc", lo:MANDATE.lo, hi:MANDATE.hi, label:`Mandate ₹${MANDATE.lo}–${MANDATE.hi} cr`, desc:`Market cap ₹${MANDATE.lo}–${MANDATE.hi} cr and FY26 PAT ≥ ₹${MANDATE.pat} cr`},
    metrics: METRICS(asofStr, DDM.asof),
    columnGroups:["Size","Valuation","Growth","Profitability","Ownership","Control"],
    views:[
      {key:"default",label:"Default",cols:["mc","r26","p26","pe","pb","roe","rg","pg","pg3","sRev","sPat","pm","pr","inst","nd","ctrl"]},
      {key:"valuation",label:"Valuation",cols:["mc","pe","pb","roe","p26","pm","pr","ctrl"]},
      {key:"growth",label:"Growth",cols:["mc","r24","r25","r26","rg","rg3","sRev","p24","p25","p26","pg","pg3","sPat"]},
      {key:"ownership",label:"Ownership & control",cols:["mc","pr","fii","dii","inst","rt","gd","cash","nd","ctrl"]},
      {key:"all",label:"All columns",cols:["mc","price","r24","r25","r26","p24","p25","p26","pe","pb","roe","rg","rg3","sRev","pg","pg3","sPat","pm","pr","fii","dii","inst","rt","gd","cash","nd","ndmc","ctrl"]}
    ],
    filters:{
      ranges:["mc","p26","r26","pe","pb","pr","inst","nd"],
      toggles:[
        {key:"fit",label:"Mandate fit",test:c=>c.fit},
        {key:"short",label:"Shortlisted",test:c=>c.shortlisted},
        {key:"netcash",label:"Net cash (net debt ≤ 0)",test:c=>c.m.nd!=null&&c.m.nd<=0},
        {key:"patup",label:"FY26 PAT above FY25",test:c=>c.m.p26>c.m.p25},
        {key:"prom",label:"Has a promoter",test:c=>c.m.pr>0},
        {key:"prom50",label:"Promoter ≥ 50%",test:c=>c.m.pr>=50},
        {key:"nse",label:"Listed on NSE",test:c=>c.exchange==="NSE"},
        {key:"multi",label:"Multi-vertical",test:c=>c.groups.length>1}
      ]
    },
    presets:[
      {key:"mandate",label:"Mandate fit",desc:"Market cap ₹40–130 cr and FY26 PAT ≥ ₹5 cr",state:{t:["fit"]}},
      {key:"clean",label:"Clean & controllable",desc:"Mandate fit, promoter ≥ 50%, net cash",state:{t:["fit","prom50","netcash"]}},
      {key:"growth",label:"Profit growers",desc:"FY26 PAT ≥ ₹5 cr and above FY25",state:{r:{p26:[5,null]},t:["patup"],s:["-pg"]}}
    ],
    funnel:[
      {label:"Universe",desc:"All screened companies",state:{}},
      {label:"Mandate fit",desc:"Market cap ₹40–130 cr, FY26 PAT ≥ ₹5 cr",state:{t:["fit"]}},
      {label:"Clean & controllable",desc:"…and promoter ≥ 50%, net cash",state:{t:["fit","prom50","netcash"]}},
      {label:"Shortlist",desc:"On the team shortlist (shortlist.js)",state:{t:["short"]}}
    ],
    kpis:[
      {key:"universe",label:"Universe",fmt:"int",value:cs=>cs.length,ctx:cs=>`${new Set(cs.map(c=>c.prim)).size} verticals`,link:{}},
      {key:"fit",label:"Mandate fit",fmt:"int",value:cs=>cs.filter(c=>c.fit).length,ctx:()=>"₹40–130 cr, PAT ≥ ₹5 cr",link:{t:["fit"]}},
      {key:"short",label:"Shortlist",fmt:"int",value:cs=>cs.filter(c=>c.shortlisted).length,ctx:cs=>`${cs.filter(c=>c.shortlisted&&c.dd).length} with diligence`,link:{t:["short"]}},
      {key:"pe",label:"Median P/E",fmt:"x",value:cs=>K.median(cs.map(c=>c.m.pe)),ctx:()=>"trailing, FY26 PAT"},
      {key:"pb",label:"Median P/B",fmt:"x",value:cs=>K.median(cs.map(c=>c.m.pb)),ctx:cs=>`${cs.filter(c=>c.m.pb!=null&&c.m.pb<1).length} trade below book`},
      {key:"pr",label:"Median promoter",fmt:"pct",value:cs=>K.median(cs.map(c=>c.m.pr)),ctx:cs=>`${cs.filter(c=>!(c.m.pr>0)).length} with no promoter`},
      {key:"netcash",label:"Net cash",fmt:"int",value:cs=>cs.filter(c=>c.m.nd!=null&&c.m.nd<=0).length,ctx:()=>"net debt ≤ 0",link:{t:["netcash"]}}
    ],
    scatter:{x:"mc", y:"pb", axes:["mc","pe","pb","roe","r26","p26","pg","pg3","pm","pr","inst","nd","ctrl"]},
    scoring:{criteria:[
      {key:"size",label:"Size fit",weight:20,explain:"1 inside the ₹40–130 cr band, falling linearly to 0 at ₹65 cr outside it."},
      {key:"growth",label:"Growth",weight:15,explain:"Percentile of FY24–FY26 PAT CAGR across the universe (n.m. scores 0)."},
      {key:"profit",label:"Profitability",weight:20,explain:"Percentile of implied ROE (P/B ÷ P/E)."},
      {key:"leverage",label:"Leverage",weight:15,explain:"Percentile of net debt ÷ market cap, lower is better."},
      {key:"control",label:"Controllability",weight:15,explain:"Promoter stake ÷ 75%, capped at 1 (0 with no promoter)."},
      {key:"value",label:"Valuation",weight:15,explain:"Percentile of P/B, lower is better."}
    ], score(c, cs){
      const mc=c.m.mc, d = mc==null?null: mc<MANDATE.lo? MANDATE.lo-mc : mc>MANDATE.hi? mc-MANDATE.hi : 0;
      return {
        size: d==null?0:Math.max(0,1-d/65),
        growth: K.pctRank(cs.map(x=>x.m.pg3), c.m.pg3) ?? 0,
        profit: K.pctRank(cs.map(x=>x.m.roe), c.m.roe) ?? 0,
        leverage: K.pctRank(cs.map(x=>x.m.ndmc), c.m.ndmc, true) ?? 0,
        control: c.m.pr>0 ? Math.min(1,c.m.pr/75) : 0,
        value: K.pctRank(cs.map(x=>x.m.pb), c.m.pb, true) ?? 0 };
    }},
    compare:[
      {sec:"Size",rows:["mc","r26","p26"]},
      {sec:"Valuation",rows:["pe","pb","roe"]},
      {sec:"Growth",rows:["rg","rg3","pg","pg3"]},
      {sec:"Profitability",rows:["pm"]},
      {sec:"Ownership",rows:["pr","inst"]},
      {sec:"Control",rows:["nd","ctrl"]}
    ],
    company:{ kpis:["mc","pe","pb","roe","pr","nd"], peers:["pe","pb","roe"], fin:true, hold:true, control:{openOffer:26}, revMix:true },
    methodology:[
      {h:"Sources and refresh",p:[
        "Market cap, price, P/E, P/B, revenue, PAT, borrowings and shareholding come from Screener.in (consolidated where available, otherwise standalone), refreshed every weekday at 4 PM IST by a scheduled job in the repo.",
        "Cash, vertical tags, classification evidence and LinkedIn contacts come from the Listed FS Companies Screen workbook (data.js). Diligence comes from audited annual reports and filings (diligence.js), with sources and dates on each company page.",
        "Where Screener rounds a figure to whole crores and the workbook value rounds to the same number, the more precise workbook value is kept. Audited borrowings in the workbook take precedence over Screener's figure, which includes leases."]},
      {h:"Mandate and screens",p:[
        `Mandate fit = market cap ₹${MANDATE.lo}–${MANDATE.hi} cr and FY26 PAT ≥ ₹${MANDATE.pat} cr. Clean & controllable = mandate fit, promoter ≥ 50% and net cash.`,
        "The shortlist is stored in the repo (shortlist.js) so the whole team sees one list. Starring in the screener stages a change you then publish to the repo."]},
      {h:"Derived measures",p:[
        `Growth and CAGR are shown as n.m. (not meaningful) when the prior-year or start value is zero, negative or below ₹${MIN_BASE} cr.`,
        "Implied ROE = P/B ÷ P/E. Net debt = latest borrowings − workbook cash. Cost to control = market cap × (promoter stake + 26% open offer under SEBI SAST), capped at 100%, at the current price before any premium. The regulatory open-offer price can be higher than the current price."]},
      {h:"Snapshots and changes",p:["Each refresh is a commit in the repo. The Overview compares the current data with the previous refresh commit: price moves beyond ±5%, flag changes, shareholding changes, mandate entries and exits, and failed refreshes."]}
    ],
    changeRules:{pct:[{k:"price",th:5,label:"Price"}], abs:[{k:"pr",th:0.01,label:"Promoter stake",unit:" pp"}], flags:["mandate","review","checkpat","nopromoter","diligence"]},
    dqGlobal: (failed.size? [{level:"neg",text:`${failed.size} compan${failed.size>1?"ies":"y"} failed the latest market refresh.`}] : []),
    sourceLine: `Screener.in market data ${asofStr||"n/a"} · workbook · diligence ${DDM.asof||"n/a"}`
  };
}

function METRICS(asof, ddAsof){
  const mk="Screener.in, daily refresh", wb="Listed FS workbook (data.js)", der="Derived";
  return {
    mc:{label:"Market cap",short:"Mkt cap",group:"Size",fmt:"cr",def:"Equity market value",formula:"Shares outstanding × price",source:mk,asof,better:null},
    price:{label:"Share price",short:"Price",group:"Size",fmt:"inr",def:"Last traded price",formula:"—",source:mk,asof},
    r24:{label:"Revenue FY24",short:"Rev FY24",group:"Growth",fmt:"cr",def:"Total revenue, FY24",formula:"—",source:mk,asof,better:"high"},
    r25:{label:"Revenue FY25",short:"Rev FY25",group:"Growth",fmt:"cr",def:"Total revenue, FY25",formula:"—",source:mk,asof,better:"high"},
    r26:{label:"Revenue FY26",short:"Rev FY26",group:"Size",fmt:"cr",def:"Total revenue, FY26 (year to 31 Mar 2026)",formula:"—",source:mk,asof,better:"high"},
    p24:{label:"PAT FY24",short:"PAT FY24",group:"Growth",fmt:"cr",def:"Profit after tax, FY24",formula:"—",source:mk,asof,better:"high"},
    p25:{label:"PAT FY25",short:"PAT FY25",group:"Growth",fmt:"cr",def:"Profit after tax, FY25",formula:"—",source:mk,asof,better:"high"},
    p26:{label:"PAT FY26",short:"PAT FY26",group:"Size",fmt:"cr",def:"Profit after tax, FY26",formula:"—",source:mk,asof,better:"high"},
    rg:{label:"Revenue growth FY26",short:"Rev Δ",group:"Growth",fmt:"chg",def:"Year-on-year revenue growth",formula:"(Rev FY26 − Rev FY25) ÷ |Rev FY25|; n.m. if FY25 < ₹2 cr or ≤ 0",source:der,asof,better:"high"},
    pg:{label:"PAT growth FY26",short:"PAT Δ",group:"Growth",fmt:"chg",def:"Year-on-year PAT growth",formula:"(PAT FY26 − PAT FY25) ÷ |PAT FY25|; n.m. if FY25 < ₹2 cr or ≤ 0",source:der,asof,better:"high"},
    rg3:{label:"Revenue CAGR FY24–26",short:"Rev CAGR",group:"Growth",fmt:"chg",def:"Two-year compound revenue growth",formula:"(Rev FY26 ÷ Rev FY24)^(1/2) − 1; n.m. if FY24 < ₹2 cr or either end ≤ 0",source:der,asof,better:"high"},
    pg3:{label:"PAT CAGR FY24–26",short:"PAT CAGR",group:"Growth",fmt:"chg",def:"Two-year compound PAT growth",formula:"(PAT FY26 ÷ PAT FY24)^(1/2) − 1; n.m. if FY24 < ₹2 cr or either end ≤ 0",source:der,asof,better:"high"},
    sRev:{label:"Revenue trend FY24–26",short:"Rev trend",group:"Growth",fmt:"spark",series:["r24","r25","r26"],def:"Revenue FY24 → FY26",formula:"Sparkline; dot green if FY26 ≥ FY24",source:mk,asof},
    sPat:{label:"PAT trend FY24–26",short:"PAT trend",group:"Growth",fmt:"spark",series:["p24","p25","p26"],def:"PAT FY24 → FY26",formula:"Sparkline; dot green if FY26 ≥ FY24",source:mk,asof},
    pm:{label:"PAT margin FY26",short:"PAT margin",group:"Profitability",fmt:"chg",def:"Net profit as a share of revenue",formula:"PAT FY26 ÷ Revenue FY26",source:der,asof,better:"high"},
    pe:{label:"P/E",short:"P/E",group:"Valuation",fmt:"x",def:"Price to trailing earnings",formula:"Market cap ÷ PAT",source:mk,asof,better:"low"},
    pb:{label:"P/B",short:"P/B",group:"Valuation",fmt:"x",def:"Price to book",formula:"Market cap ÷ book value",source:mk,asof,better:"low"},
    roe:{label:"Implied ROE",short:"Impl. ROE",group:"Valuation",fmt:"chg",def:"Return on equity implied by the two multiples",formula:"P/B ÷ P/E",source:der,asof,better:"high"},
    pr:{label:"Promoter holding",short:"Promoter",group:"Ownership",fmt:"pct",def:"Promoter and promoter-group shareholding",formula:"Latest quarterly shareholding pattern",source:mk,asof,better:"high"},
    fii:{label:"FII holding",short:"FII",group:"Ownership",fmt:"pct",def:"Foreign institutional shareholding",formula:"—",source:mk,asof},
    dii:{label:"DII holding",short:"DII",group:"Ownership",fmt:"pct",def:"Domestic institutional shareholding",formula:"—",source:mk,asof},
    inst:{label:"Institutional holding",short:"Inst.",group:"Ownership",fmt:"pct",def:"FII + DII shareholding",formula:"FII + DII",source:der,asof},
    rt:{label:"Public holding",short:"Public",group:"Ownership",fmt:"pct",def:"Retail and other public shareholding",formula:"—",source:mk,asof},
    gd:{label:"Gross debt",short:"Gross debt",group:"Control",fmt:"cr",def:"Borrowings (audited figure from the workbook when recorded)",formula:"—",source:"Workbook, else Screener",asof,better:"low"},
    cash:{label:"Cash",short:"Cash",group:"Control",fmt:"cr",def:"Cash and equivalents per the workbook",formula:"—",source:wb,asof:null,better:"high"},
    nd:{label:"Net debt",short:"Net debt",group:"Control",fmt:"cr",def:"Borrowings less cash; negative = net cash",formula:"Gross debt − cash",source:der,asof,better:"low"},
    ndmc:{label:"Net debt ÷ market cap",short:"ND/MC",group:"Control",fmt:"chg",def:"Leverage relative to equity value",formula:"Net debt ÷ market cap",source:der,asof,better:"low"},
    ctrl:{label:"Cost to control",short:"Cost to control",group:"Control",fmt:"cr",def:"Indicative cost of the promoter block plus a 26% open offer at today's price",formula:"Market cap × min(100%, promoter % + 26%)",source:der,asof,better:"low"}
  };
}

window.Adapter = { build };
})();
