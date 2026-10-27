/* EMS target outreach — adapter. Turns ems/data.js (generated from the "Consol Target Outreach List" sheet)
   and ems/shortlist.js into the kit MODEL. Unlisted companies: no market, ownership or control data. */
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

  const companies = rows.map((r,i)=>{
    const m = { r:r.r, e:r.e, p:r.p,
      em: r.r>0 && r.e!=null ? r.e/r.r*100 : null,
      pm: r.r>0 && r.p!=null ? r.p/r.r*100 : null,
      conv: r.e>0 && r.p!=null ? r.p/r.e*100 : null };
    const flags=[], dq=[];
    if(r.ev) flags.push({key:"evaluated",label:"Evaluated",tone:"info",tip:"“Whether evaluated?” is Yes in the sheet."});
    if(r.p!=null&&r.p<0) flags.push({key:"loss",label:"Loss-making",tone:"warn",tip:"FY25 net profit below zero."});
    if(r.e!=null&&r.e<=0) flags.push({key:"ebitdaneg",label:"EBITDA ≤ 0",tone:"warn",tip:"FY25 EBITDA zero or negative."});
    ["r","e","p"].forEach(k=>{ if(r[k]==null) dq.push({level:"warn",text:`${({r:"Revenue",e:"EBITDA",p:"Net profit"})[k]} is blank in the sheet.`}); });
    if(!r.d) dq.push({level:"info",text:"Business description is blank in the sheet."});
    if(r.e!=null&&r.p!=null&&r.e>0&&r.p>r.e) dq.push({level:"warn",text:`Net profit (₹${r.p} cr) exceeds EBITDA (₹${r.e} cr): check for other income or a data-entry error.`});
    if(r.e!=null&&r.p!=null&&r.e!==0&&r.e===r.p) dq.push({level:"warn",text:`EBITDA and net profit are identical (₹${r.e} cr): one may have been copied into the other.`});
    if(m.em!=null&&Math.abs(m.em)>60) dq.push({level:"warn",text:`EBITDA margin of ${m.em.toFixed(1)}% is unusual for this sector: check revenue and EBITDA units.`});
    if(r.r!=null&&r.r<1) dq.push({level:"info",text:`Revenue under ₹1 cr (₹${r.r} cr): margins are not meaningful at this scale.`});
    const notes = SL.notes && SL.notes[r.n] || {};
    return { id:ids[i], name:r.n, ticker:"", exchange:"Unlisted", code:"",
      groups:[{key:segKey(r.seg), pct:null}], prim:segKey(r.seg), desc:r.d||"", seg:r.seg,
      m, nm:{}, flags, fit:false, dq, ev:!!r.ev,
      shortlisted: shortNames.has(r.n),
      verdict: notes.verdict? {label:notes.verdict, tone:notes.tone||"neu"} : null,
      thesis: notes.thesis || r.d || "", updated: notes.updated || SL.updated || null, open: notes.open||[],
      dd:null, hold:null, revMix:null, contacts:[], sources:[], fin:null };
  });
  // duplicate names are a data-quality issue worth surfacing
  const seen={}; companies.forEach(c=>{ const k=c.name.toLowerCase(); if(seen[k]) { c.dq.push({level:"warn",text:"Duplicate company name in the sheet."}); seen[k].dq.push({level:"warn",text:"Duplicate company name in the sheet."}); } else seen[k]=c; });

  const asofStr = META.asof || null;
  return {
    key:"ems",
    product:"EMS Target Screener",
    subtitle:"EMS & industrial tech target outreach · FY25 · unlisted",
    asof: asofStr, asofDate: K.parseAsof(asofStr), staleAfterHours: 26,
    asofNote:`Synced from “${META.sheet||"Consol Target Outreach List"}” of ${META.file||"the workbook"}${META.modified?` (saved ${META.modified})`:""}`,
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
    textCols:{desc:{label:"Business description",group:"Profile",def:"Business description from the sheet",source:"Consol Target Outreach List"}, ev:{label:"Evaluated?",group:"Status",def:"“Whether evaluated?” column of the sheet",source:"Consol Target Outreach List"}},
    columnGroups:["Profile","Size","Profitability","Status"],
    views:[
      {key:"default",label:"Default",cols:["desc","r","e","em","p","pm","ev"]},
      {key:"profit",label:"Profitability",cols:["r","e","em","p","pm","conv","ev"]},
      {key:"all",label:"All columns",cols:["desc","r","e","em","p","pm","conv","ev"]}
    ],
    filters:{
      ranges:["r","e","p","em","pm"],
      toggles:[
        {key:"ebitdapos",label:"EBITDA positive",test:c=>c.m.e>0},
        {key:"nppos",label:"Net profit positive",test:c=>c.m.p>0},
        {key:"ev",label:"Evaluated",test:c=>c.ev},
        {key:"notev",label:"Not yet evaluated",test:c=>!c.ev},
        {key:"short",label:"Shortlisted",test:c=>c.shortlisted}
      ]
    },
    presets:[
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
      {key:"rev",label:"Median revenue",fmt:"cr",value:cs=>K.median(cs.map(c=>c.m.r)),ctx:cs=>`₹${Math.round(cs.reduce((a,c)=>a+(c.m.r||0),0)).toLocaleString("en-IN")} cr combined`},
      {key:"em",label:"Median EBITDA margin",fmt:"chg",value:cs=>K.median(cs.map(c=>c.m.em)),ctx:()=>"FY25"},
      {key:"pm",label:"Median net margin",fmt:"chg",value:cs=>K.median(cs.map(c=>c.m.pm)),ctx:()=>"FY25"}
    ],
    scatter:{x:"r", y:"em", axes:["r","e","p","em","pm","conv"]},
    scoring:{criteria:[
      {key:"scale",label:"Scale",weight:30,explain:"Percentile of FY25 revenue across the list."},
      {key:"ebitda",label:"EBITDA margin",weight:30,explain:"Percentile of FY25 EBITDA margin."},
      {key:"net",label:"Net margin",weight:25,explain:"Percentile of FY25 net margin."},
      {key:"conv",label:"Earnings conversion",weight:15,explain:"Percentile of net profit ÷ EBITDA."}
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
        `Every figure comes from the “${META.sheet||"Consol Target Outreach List"}” sheet of the EMS Target Outreach workbook; no other sheet is read. An hourly job on the analyst's machine (8 AM–10 PM) checks whether the workbook was saved since the last sync and, if so, regenerates ems/data.js and pushes it to the repo; the dashboard is then rebuilt.`,
        "Revenue, EBITDA and net profit are FY25, ₹ crore, exactly as entered. Segment and “Whether evaluated?” are taken as entered."]},
      {h:"Derived measures",p:["EBITDA margin = EBITDA ÷ revenue. Net margin = net profit ÷ revenue. Conversion = net profit ÷ EBITDA, only where EBITDA is positive.","Segment medians are medians across companies in the segment, so one small outlier does not swing them."]},
      {h:"Snapshots and changes",p:["Each sync is a commit in the repo. The Overview compares the current sheet with the previous sync: companies added or removed, figures changed, evaluation status and segment changes."]}
    ],
    changeRules:{any:[{k:"r",label:"Revenue"},{k:"e",label:"EBITDA"},{k:"p",label:"Net profit"}], text:[{k:"seg",label:"Segment"},{k:"desc",label:"Description"}], flags:["evaluated","loss","ebitdaneg"]},
    dqGlobal:[],
    sourceLine:`${META.file||"Workbook"} · ${META.sheet||""} · synced ${asofStr||"n/a"}`
  };
}
window.Adapter = { build };
})();
