/* EMS target outreach — adapter. Turns ems/data.js (generated from the "Consol Target Outreach List" sheet)
   and ems/shortlist.js into the kit MODEL. Unlisted companies: no market, ownership or control data.
   Optional row fields from the sheet: nt (Notes column), cm (cell comments), src (Sourced From); shown as "Things to know".
   Optional x: the sheet's other columns ({header: text}); window.SHEET_COLS lists them in sheet order. Each becomes a
   screener column (and a condition when it holds a few short values) and is listed under "Things to know".
   Optional window.INDUSTRY_FIT: the "Consol Industry Strategic Fit" sheet (header row + one row per industry, every cell as text);
   it feeds the Industry fit page and each company's industry-fit points, tag and filter. */
(function(){
const K = window.Kit;
const TOP = 7; // largest segments get their own colour; the rest share the muted colour

function build(src, opts){
  const META = src.DATA_META || {};
  const SL = src.SHORTLIST || {names:[], notes:{}};
  const rows = src.RAW_BASE || [];
  const ids = K.uniqueSlugs(rows.map(r=>r.n));
  const shortNames = new Set(SL.names||[]);
  const segCount = {}; rows.forEach(r=>{ segCount[r.seg]=(segCount[r.seg]||0)+1; });
  const SEGS = Object.keys(segCount).sort((a,b)=>segCount[b]-segCount[a]||a.localeCompare(b));
  const segKey = s => String(SEGS.indexOf(s));
  // each "Sourced From" value (e.g. PWC) gets a flag, a screener condition and a quick screen
  const SRCS = [...new Set(rows.map(r=>r.src).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const srcKey = s => "src-"+s.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  const industryFit = fitModel(src.INDUSTRY_FIT, SEGS, segCount, segKey);
  const fitRow = s => industryFit && industryFit.bySeg[s];
  // the sheet's other columns (Customer Type, Business Model, ...), in sheet order
  const XCOLS = (src.SHEET_COLS || [...new Set(rows.flatMap(r=>Object.keys(r.x||{})))]).map((h,i)=>({key:"x"+i, h}));
  const xCats = XCOLS.map(col=>{ const vs=rows.map(r=>(r.x||{})[col.h]).filter(Boolean), d=[...new Set(vs)].sort((a,b)=>a.localeCompare(b));
    return d.length && d.length<=8 && d.length<vs.length && d.every(v=>v.length<=24) ? d.map(v=>({key:`${col.key}-${v.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`, label:`${col.h}: ${v}`, test:c=>c.x[col.h]===v})) : []; }).flat();

  const companies = rows.map((r,i)=>{
    const m = { r:r.r, e:r.e, p:r.p,
      em: r.r>0 && r.e!=null ? r.e/r.r*100 : null,
      pm: r.r>0 && r.p!=null ? r.p/r.r*100 : null,
      conv: r.e>0 && r.p!=null ? r.p/r.e*100 : null };
    const flags=[], dq=[];
    // the team's notes and cell comments are flagged first, the source last
    const note = [r.nt].concat(r.cm||[]).filter(Boolean).join(" · "), points = [];
    if(r.nt) points.push({label:"Note",tone:"brand",text:r.nt});
    (r.cm||[]).forEach(t=>points.push({label:"Comment",tone:"info",text:t}));
    if(r.src) points.push({label:"Source",tone:"neu",text:`Sourced from ${r.src}`});
    XCOLS.forEach(col=>{ const v=(r.x||{})[col.h]; if(v) points.push({label:"Detail",tone:"neu",text:`${col.h}: ${v}`}); });
    const fr = fitRow(r.seg), ifit = fr && industryFit.rating>=0 ? fr.cells[industryFit.rating] : "";
    if(fr) industryFit.cols.forEach((col,i)=>{ if(fr.cells[i]) points.push({label:"Industry fit",tone:i===industryFit.rating?fitTone(fr.cells[i]):"info",text:col.label?`${col.label}: ${fr.cells[i]}`:fr.cells[i]}); });
    if(note) flags.push({key:"note",label:"Note",tone:"brand",tip:note});
    if(r.ev) flags.push({key:"evaluated",label:"Evaluated",tone:"info",tip:"“Whether evaluated?” is Yes in the sheet."});
    if(r.p!=null&&r.p<0) flags.push({key:"loss",label:"Loss-making",tone:"warn",tip:"FY25 net profit below zero."});
    if(r.e!=null&&r.e<=0) flags.push({key:"ebitdaneg",label:"EBITDA ≤ 0",tone:"warn",tip:"FY25 EBITDA zero or negative."});
    if(r.src) flags.push({key:srcKey(r.src),label:r.src,tone:"neu",tip:`Sourced from ${r.src} (“Sourced From” in the sheet).`});
    if(ifit) flags.push({key:fitKey(ifit),label:`Fit: ${ifit}`,tone:fitTone(ifit),tip:`${industryFit.cols[industryFit.rating].label||"Strategic fit"} of the ${r.seg} industry (“${industryFit.sheet}”).`});
    ["r","e","p"].forEach(k=>{ if(r[k]==null) dq.push({level:"warn",text:`${({r:"Revenue",e:"EBITDA",p:"Net profit"})[k]} is blank in the sheet.`}); });
    if(!r.d) dq.push({level:"info",text:"Business description is blank in the sheet."});
    if(r.e!=null&&r.p!=null&&r.e>0&&r.p>r.e) dq.push({level:"warn",text:`Net profit (₹${r.p} cr) exceeds EBITDA (₹${r.e} cr): check for other income or a data-entry error.`});
    if(r.e!=null&&r.p!=null&&r.e!==0&&r.e===r.p) dq.push({level:"warn",text:`EBITDA and net profit are identical (₹${r.e} cr): one may have been copied into the other.`});
    if(m.em!=null&&Math.abs(m.em)>60) dq.push({level:"warn",text:`EBITDA margin of ${m.em.toFixed(1)}% is unusual for this sector: check revenue and EBITDA units.`});
    if(r.r!=null&&r.r<1) dq.push({level:"info",text:`Revenue under ₹1 cr (₹${r.r} cr): margins are not meaningful at this scale.`});
    const notes = SL.notes && SL.notes[r.n] || {};
    return { id:ids[i], name:r.n, ticker:"", exchange:"Unlisted", code:"",
      groups:[{key:segKey(r.seg), pct:null}], prim:segKey(r.seg), desc:r.d||"", seg:r.seg,
      m, nm:{}, flags, fit:false, dq, ev:!!r.ev, note, points, src:r.src||"", ifit, x:r.x||{},
      shortlisted: shortNames.has(r.n),
      verdict: notes.verdict? {label:notes.verdict, tone:notes.tone||"neu"} : null,
      thesis: notes.thesis || r.d || "", updated: notes.updated || SL.updated || null, open: notes.open||[],
      dd:null, hold:null, revMix:null, contacts:[], sources:[], fin:null };
  });
  // duplicate names are a data-quality issue worth surfacing
  const seen={}; companies.forEach(c=>{ const k=c.name.toLowerCase(); if(seen[k]) { c.dq.push({level:"warn",text:"Duplicate company name in the sheet."}); seen[k].dq.push({level:"warn",text:"Duplicate company name in the sheet."}); } else seen[k]=c; });

  const asofStr = META.asof || null, gsheet = META.source==="google-sheet", tab = META.sheet||"Consol Target Outreach List";
  return {
    key:"ems",
    product:"EMS Target Screener",
    subtitle:"EMS & industrial tech target outreach · FY25 · unlisted",
    asof: asofStr, asofDate: K.parseAsof(asofStr), staleAfterHours: 26,
    asofNote: gsheet ? `Synced from the “${tab}” tab of the team's Google Sheet; checked ${asofStr||"n/a"}${META.modified?`, data last changed ${META.modified}`:""}`
      : `Synced from “${tab}” of ${META.file||"the workbook"}${META.modified?` (saved ${META.modified})`:""}`,
    pointsNote:`Notes, cell comments, “Sourced From” and the other columns of “${tab}”${industryFit?`; industry fit from “${industryFit.sheet}”`:""} · synced ${asofStr||"n/a"}`,
    industryFit,
    failed:[],
    repo:"project4-gpc/listed-fs-dashboard", shortlistFile:"ems/shortlist.js",
    shortlistMeta: SL,
    groupLabel:"Segment", groupLabelPlural:"Segments", multiGroup:false,
    groups: SEGS.map((s,i)=>({key:String(i), label:s, short:s, color:i<TOP?`var(--viz-${i+1})`:"var(--viz-muted)", shape:i<TOP?window.Charts.SHAPES[i]:"circle", n:segCount[s], other:i>=TOP})),
    companies,
    minBase:null,
    mandate:null,
    metrics:{
      r:{label:"Revenue FY25",short:"Revenue",group:"Size",fmt:"cr",def:"Revenue for FY25 as entered in the sheet",formula:"—",source:"Consol Target Outreach List",asof:asofStr,better:"high"},
      e:{label:"EBITDA FY25",short:"EBITDA",group:"Profitability",fmt:"cr",def:"EBITDA for FY25 as entered in the sheet",formula:"—",source:"Consol Target Outreach List",asof:asofStr,better:"high"},
      em:{label:"EBITDA margin FY25",short:"EBITDA mgn",group:"Profitability",fmt:"chg",def:"EBITDA as a share of revenue",formula:"EBITDA ÷ revenue",source:"Derived",asof:asofStr,better:"high"},
      p:{label:"Net profit FY25",short:"Net profit",group:"Profitability",fmt:"cr",def:"Net profit for FY25 as entered in the sheet",formula:"—",source:"Consol Target Outreach List",asof:asofStr,better:"high"},
      pm:{label:"Net margin FY25",short:"Net mgn",group:"Profitability",fmt:"chg",def:"Net profit as a share of revenue",formula:"Net profit ÷ revenue",source:"Derived",asof:asofStr,better:"high"},
      conv:{label:"Net profit ÷ EBITDA",short:"Conversion",group:"Profitability",fmt:"chg",def:"How much of EBITDA reaches net profit (after D&A, interest, tax)",formula:"Net profit ÷ EBITDA (EBITDA > 0 only)",source:"Derived",asof:asofStr,better:"high"}
    },
    textCols:{desc:{label:"Business description",group:"Profile",def:"Business description from the sheet",source:"Consol Target Outreach List"}, ev:{label:"Evaluated?",group:"Status",def:"“Whether evaluated?” column of the sheet",source:"Consol Target Outreach List"},
      ...Object.fromEntries(XCOLS.map(col=>[col.key,{label:col.h,short:col.h,group:"Details",def:`“${col.h}” column of the sheet`,source:tab,get:c=>c.x[col.h]||""}])),
      ...Object.fromEntries((industryFit?industryFit.cols:[]).map((col,i)=>[`if${i}`,{label:`Industry fit: ${col.label||`column ${i+2}`}`,short:col.label||"Industry fit",group:"Industry fit",def:`“${col.label}” of the company's industry in “${industryFit.sheet}”`,source:industryFit.sheet,get:c=>(fitRow(c.seg)||{cells:[]}).cells[i]||"",tone:i===industryFit.rating?fitTone:null}]))},
    columnGroups:["Profile","Details","Industry fit","Size","Profitability","Status"],
    views:[
      {key:"default",label:"Default",cols:["desc","r","e","em","p","pm","ev"]},
      {key:"profit",label:"Profitability",cols:["r","e","em","p","pm","conv","ev"]},
      ...(XCOLS.length||industryFit?[{key:"details",label:"Details",cols:["desc",...XCOLS.map(c=>c.key),...(industryFit?industryFit.cols.map((c,i)=>`if${i}`):[]),"ev"]}]:[]),
      {key:"all",label:"All columns",cols:["desc",...XCOLS.map(c=>c.key),...(industryFit?industryFit.cols.map((c,i)=>`if${i}`):[]),"r","e","em","p","pm","conv","ev"]}
    ],
    filters:{
      ranges:["r","e","p","em","pm"],
      toggles:[
        {key:"ebitdapos",label:"EBITDA positive",test:c=>c.m.e>0},
        {key:"nppos",label:"Net profit positive",test:c=>c.m.p>0},
        {key:"ev",label:"Evaluated",test:c=>c.ev},
        {key:"notev",label:"Not yet evaluated",test:c=>!c.ev},
        {key:"short",label:"Shortlisted",test:c=>c.shortlisted},
        {key:"notes",label:"Has notes",test:c=>!!c.note},
        ...SRCS.map(s=>({key:srcKey(s),label:`Sourced from ${s}`,test:c=>c.src===s})),
        ...(industryFit?industryFit.ratings:[]).map(v=>({key:fitKey(v),label:`Industry fit: ${v}`,test:c=>c.ifit===v})),
        ...xCats
      ]
    },
    presets:[
      {key:"notes",label:"Has notes",desc:"A note or cell comment in the sheet",state:{t:["notes"]}},
      ...SRCS.map(s=>({key:srcKey(s),label:`Sourced from ${s}`,desc:`“Sourced From” is ${s} in the sheet`,state:{t:[srcKey(s)]}})),
      ...(industryFit?industryFit.ratings:[]).map(v=>({key:fitKey(v),label:`Fit: ${v}`,desc:`Industry strategic fit is ${v}`,state:{t:[fitKey(v)]}})),
      {key:"profit",label:"Profitable",desc:"EBITDA and net profit both positive",state:{t:["ebitdapos","nppos"],s:["-em"]}},
      {key:"scale",label:"₹50 cr+ revenue",desc:"FY25 revenue at least ₹50 cr",state:{r:{r:[50,null]}}},
      {key:"fresh",label:"Not yet evaluated",desc:"“Whether evaluated?” is No",state:{t:["notev"]}}
    ],
    funnel:[
      {label:"Universe",desc:"All companies on the outreach list",state:{}},
      {label:"EBITDA positive",desc:"FY25 EBITDA above zero",state:{t:["ebitdapos"]}},
      {label:"Profitable",desc:"…and net profit above zero",state:{t:["ebitdapos","nppos"]}},
      {label:"Evaluated",desc:"…and marked as evaluated",state:{t:["ebitdapos","nppos","ev"]}},
      {label:"Shortlist",desc:"On the team shortlist (ems/shortlist.js)",state:{t:["short"]}}
    ],
    kpis:[
      {key:"universe",label:"Universe",fmt:"int",value:cs=>cs.length,ctx:cs=>`${new Set(cs.map(c=>c.seg)).size} segments`,link:{}},
      {key:"profitable",label:"Profitable",fmt:"int",value:cs=>cs.filter(c=>c.m.e>0&&c.m.p>0).length,ctx:()=>"EBITDA and net profit > 0",link:{t:["ebitdapos","nppos"]}},
      {key:"evaluated",label:"Evaluated",fmt:"int",value:cs=>cs.filter(c=>c.ev).length,ctx:cs=>`${cs.filter(c=>!c.ev).length} not yet evaluated`,link:{t:["ev"]}},
      {key:"short",label:"Shortlist",fmt:"int",value:cs=>cs.filter(c=>c.shortlisted).length,ctx:()=>"team list in the repo",link:{t:["short"]}},
      {key:"notes",label:"With notes",fmt:"int",value:cs=>cs.filter(c=>c.note).length,ctx:()=>"notes and comments in the sheet",link:{t:["notes"]}},
      {key:"rev",label:"Median revenue",fmt:"cr",metric:"r",value:cs=>K.median(cs.map(c=>c.m.r)),ctx:cs=>`₹${Math.round(cs.reduce((a,c)=>a+(c.m.r||0),0)).toLocaleString("en-IN")} cr combined`},
      {key:"em",label:"Median EBITDA margin",fmt:"chg",value:cs=>K.median(cs.map(c=>c.m.em)),ctx:()=>"FY25"},
      {key:"pm",label:"Median net margin",fmt:"chg",value:cs=>K.median(cs.map(c=>c.m.pm)),ctx:()=>"FY25"}
    ],
    pipeline:{seed:c=>c.shortlisted?"short":c.ev?"screened":"long"},
    treemap:{size:["r","e","p"], color:["em","pm","conv"]},
    scatter:{x:"r", y:"em", size:"p", axes:["r","e","p","em","pm","conv"]},
    scoring:{criteria:[
      {key:"scale",label:"Scale",weight:30,explain:"Percentile of FY25 revenue across the list."},
      {key:"ebitda",label:"EBITDA margin",weight:30,explain:"Percentile of FY25 EBITDA margin."},
      {key:"net",label:"Net margin",weight:25,explain:"Percentile of FY25 net margin."},
      {key:"conv",label:"Earnings conversion",weight:15,explain:"Percentile of net profit ÷ EBITDA."}
    ], presets:[
      {key:"balanced",label:"Balanced",w:{scale:30,ebitda:30,net:25,conv:15}},
      {key:"scale",label:"Scale first",w:{scale:50,ebitda:20,net:20,conv:10}},
      {key:"margins",label:"Margins first",w:{scale:15,ebitda:40,net:35,conv:10}}
    ], unavailable:"Growth, leverage, controllability and valuation are not in this sheet (single year, unlisted), so they are not scored.",
    score(c, cs){ return {
      scale: K.pctRank(cs.map(x=>x.m.r), c.m.r) ?? 0,
      ebitda: K.pctRank(cs.map(x=>x.m.em), c.m.em) ?? 0,
      net: K.pctRank(cs.map(x=>x.m.pm), c.m.pm) ?? 0,
      conv: K.pctRank(cs.map(x=>x.m.conv), c.m.conv) ?? 0 }; }},
    compare:[
      {sec:"Size",rows:["r"]},
      {sec:"Profitability",rows:["e","em","p","pm","conv"]}
    ],
    company:{ kpis:["r","e","em","p","pm","conv"], peers:["r","em","pm"], fin:false, pnl:true, hold:false, control:null, revMix:false },
    methodology:[
      {h:"Source and refresh",p:[
        gsheet ? `Every figure comes from the “${tab}” tab of the team's shared Google Sheet; no other tab is read. Every 15 minutes (7:30 AM–11:30 PM IST) a cloud job reads that tab; when the data changed it regenerates ems/data.js, runs the checks and republishes the dashboard, and once a day it records that the sheet was checked. A tab with missing columns, no rows or most rows gone is never published.`
          : `Every figure comes from the “${tab}” sheet of the EMS Target Outreach workbook; the only other sheet read is “Consol Industry Strategic Fit” (text only, for the Industry fit page). A job on the analyst's machine (every 6 hours) checks whether the workbook was saved since the last sync and, if so, regenerates ems/data.js and pushes it to the repo; the dashboard is then rebuilt.`,
        "Revenue, EBITDA and net profit are FY25, ₹ crore, exactly as entered. Segment and “Whether evaluated?” are taken as entered.",
        "The “Notes” column and any comments on a company's cells are flagged with a Note pill and listed, word for word, under “Things to know” on the company page, with “Sourced From”. Each “Sourced From” value (for example PWC) is also a tag on the company and a screener condition and quick screen. Figures quoted in notes or comments (for example FY26) are shown as text only and never enter a metric.",
        "The Industry fit page shows the “Consol Industry Strategic Fit” sheet as entered, one row per industry, matched to the Segment column by name; company counts are worked out from the outreach list. Each company carries its industry's columns under “Things to know”; a rating column (a few short values such as High / Medium / Low) is also a tag, a screener condition and a quick screen."]},
      {h:"Derived measures",p:["EBITDA margin = EBITDA ÷ revenue. Net margin = net profit ÷ revenue. Conversion = net profit ÷ EBITDA, only where EBITDA is positive.","Segment medians are medians across companies in the segment, so one small outlier does not swing them."]},
      {h:"Snapshots and changes",p:["Each sync is a commit in the repo. The Overview compares the current sheet with the previous sync: companies added or removed, figures changed, evaluation status and segment changes."]}
    ],
    changeRules:{any:[{k:"r",label:"Revenue"},{k:"e",label:"EBITDA"},{k:"p",label:"Net profit"}], text:[{k:"seg",label:"Segment"},{k:"desc",label:"Description"},{k:"note",label:"Notes"}], flags:["evaluated","loss","ebitdaneg"]},
    dqGlobal:[],
    sourceLine:`${META.file||"Workbook"} · ${META.sheet||""} · synced ${asofStr||"n/a"}`
  };
}
// ---- industry strategic fit ----
const fitKey = v => "fit-"+v.toLowerCase().replace(/[^a-z0-9]+/g,"-");
const fitTone = v => /^(very high|high|strong|good|core|yes|primary|priority|attractive)\b/i.test(v) ? "pos"
  : /^(medium|moderate|mid|partial|selective|maybe|secondary)\b/i.test(v) ? "warn"
  : /^(low|weak|poor|no|none|exclude|not a fit|unattractive)\b/i.test(v) ? "neg" : "neu";
const norm = s => String(s||"").trim().toLowerCase().replace(/\s+/g," ");
// Rows are matched to segments by name; counts come from the companies, not the sheet. A column whose values are a few
// short labels repeated across industries (e.g. High / Medium / Low) is the rating: it becomes a tag, a filter and a quick screen.
function fitModel(F, SEGS, segCount, segKey){
  if(!F || !F.rows || !F.rows.length) return null;
  const byNorm = {}; SEGS.forEach(s=>{ byNorm[norm(s)]=s; });
  const cols = (F.cols||[]).map((h,i)=>({key:"f"+i, label:h}));
  const rows = F.rows.map(r=>{ const seg = byNorm[norm(r[0])]||null;
    return {label:r[0], seg, key:seg?segKey(seg):null, n:seg?segCount[seg]:0, cells:cols.map((c,i)=>r[i+1]||"")}; });
  const rating = cols.findIndex((c,i)=>{ const vs=rows.map(r=>r.cells[i]).filter(Boolean), d=new Set(vs);
    return vs.length>=Math.min(3,rows.length) && d.size<=8 && d.size<vs.length && [...d].every(v=>v.length<=24 && !/^[-+]?[\d.,]+%?$/.test(v)); });
  const order = ["pos","warn","neu","neg"];
  const ratings = rating<0 ? [] : [...new Set(rows.map(r=>r.cells[rating]).filter(Boolean))].sort((a,b)=>order.indexOf(fitTone(a))-order.indexOf(fitTone(b))||a.localeCompare(b));
  const bySeg = {}; rows.forEach(r=>{ if(r.seg&&!bySeg[r.seg]) bySeg[r.seg]=r; });
  return { sheet:F.sheet||"Consol Industry Strategic Fit", cols, rows, rating, ratings, bySeg, tone:fitTone,
    missing: SEGS.filter(s=>!bySeg[s]), extra: rows.filter(r=>!r.seg).map(r=>r.label) };
}

window.Adapter = { build };
})();
