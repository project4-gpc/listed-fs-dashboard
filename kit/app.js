/* Greater Pacific dashboard kit — app shell and pages (v2). Renders window.MODEL only; never computes or alters a
   source figure (derived values come from kit/model.js and the dashboard's adapter). All state lives in the URL. */
(function(){
"use strict";
const C = window.Charts, K = window.Kit, esc = C.esc;
const DATA = window.DATA || {};
const M = window.Adapter.build(DATA.cur || {});
const PREV = DATA.prev ? window.Adapter.build(DATA.prev) : null;
M.changes = K.diff(M, PREV, M.changeRules || {});
M.prevLabel = DATA.prevLabel || null;
K.enrich(M); if(PREV) K.enrich(PREV);
const byId = new Map(M.companies.map(c=>[c.id,c]));
const G = Object.fromEntries(M.groups.map(g=>[g.key,g]));
const MET = M.metrics, TEXT = M.textCols || {}, LOGO = DATA.logo || "", SIBS = DATA.siblings || [];
const CRIT = M.scoring ? M.scoring.criteria : [];
const RM = ()=> !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
window.MODEL = M;
// deal pipeline: team data, kept on this device or in a private repo (kit/pipeline.js); seeded from the data only
const PIPE = new window.Pipeline.Store({key:M.key, stages:window.Pipeline.STAGES, seed:(M.pipeline&&M.pipeline.seed)||(c=>c.shortlisted?"short":"long"), team:(DATA.cur&&DATA.cur.TEAM_ACCESS)||null});
TEXT.stage = {label:"Pipeline stage",short:"Stage",group:"Pipeline",def:"Deal stage from the team pipeline (team data; not part of the published file)",source:"Pipeline"};
M.views.forEach(v=>{ if((v.key==="default"||v.key==="all")&&!v.cols.includes("stage")) v.cols=v.cols.concat("stage"); });

// ---------- formatting ----------
const MINUS = "−";
const nf = (v,d)=> (Math.abs(v)).toLocaleString("en-IN",{minimumFractionDigits:d,maximumFractionDigits:d});
const NA = '<span class="na" title="Not available">–</span>';
function num(v,d=1){ if(v==null||!isFinite(v)) return NA; return v<0?`<span class="neg">${MINUS}${nf(v,d)}</span>`:nf(v,d); }
function fmt(k, v, c, opt={}){
  const mt = MET[k] || {fmt:opt.fmt||"cr"}; const f = opt.fmt || mt.fmt;
  if(c && c.nm && c.nm[k]) return `<span class="nm" data-tip="${esc(c.nm[k])}" tabindex="0">n.m.</span>`;
  if(f==="spark") return C.spark((mt.series||[]).map(s=>c.m[s]), {aria:mt.label});
  if(v==null||!isFinite(v)) return NA;
  switch(f){
    case "cr": return num(v,1);
    case "inr": return "₹"+num(v,2);
    case "x": return v<0?`<span class="neg">${MINUS}${nf(v,1)}x</span>`:nf(v,1)+"x";
    case "pct": return nf(v,1)+"%";
    case "chg": return `<span class="${v>0?"pos":v<0?"neg":""}">${v>0?"+":v<0?MINUS:""}${nf(v,1)}%</span>`;
    case "pp": return `<span class="${v>0?"pos":v<0?"neg":""}">${v>0?"+":v<0?MINUS:""}${nf(v,1)} pp</span>`;
    case "int": return Math.round(v).toLocaleString("en-IN");
    default: return num(v,1);
  }
}
function fmtPlain(k, v, opt={}){ const f=opt.fmt||(MET[k]||{}).fmt; if(v==null||!isFinite(v)) return "n/a";
  if(f==="x") return (v<0?MINUS:"")+nf(v,1)+"x"; if(f==="pct") return nf(v,1)+"%"; if(f==="chg") return (v>0?"+":v<0?MINUS:"")+nf(v,1)+"%"; if(f==="pp") return (v>0?"+":v<0?MINUS:"")+nf(v,1)+" pp"; if(f==="int") return Math.round(v).toLocaleString("en-IN");
  if(f==="inr") return "₹"+nf(v,2); return "₹"+(v<0?MINUS:"")+nf(v,1)+" cr"; }
const unitOf = k=>({cr:"₹ cr",x:"x",pct:"%",chg:"%",pp:"pp",inr:"₹",int:""})[(MET[k]||{}).fmt]||"";
const pill = (label,tone,tip)=>`<span class="pill ${tone||"neu"}"${tip?` data-tip="${esc(tip)}" tabindex="0"`:""}>${esc(label)}</span>`;
const gpill = key=>{ const g=G[key]; return g?`<span class="vpill"><span class="dot" style="background:${g.color}"></span>${esc(g.short)}</span>`:""; };
const flagPills = c=>c.flags.map(f=>pill(f.label,f.tone,f.tip)).join("");
const shortName = n=>n.replace(/\b(Limited|Ltd\.?|Private|Pvt\.?|Corporation|Company)\b/gi,"").replace(/\s+/g," ").trim().slice(0,26);
function tick(k,v){ const f=(MET[k]||{}).fmt; const s=Math.abs(v)>=1000?v.toLocaleString("en-IN"):String(+(+v).toPrecision(4)); if(f==="x") return s+"x"; if(f==="pct"||f==="chg") return s+"%"; if(f==="pp") return s+" pp"; return s; }
const ord = n=>{ const s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
const ICON = {
  overview:'<path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z"/>',
  screener:'<path d="M3 5h18M3 12h18M3 19h18M8 5v14"/>',
  company:'<path d="M4 21V4h10v17M14 9h6v12M7 8h4M7 12h4M7 16h4M17 13h1M17 17h1"/>',
  shortlist:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  compare:'<path d="M4 4h6v16H4zM14 4h6v16h-6z"/>',
  dq:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  method:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>', collapse:'<path d="M15 6l-6 6 6 6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  down:'<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>', print:'<path d="M6 9V3h12v6M6 17H4v-7h16v7h-2M6 14h12v7H6z"/>',
  link:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  cols:'<path d="M4 4h16v16H4zM10 4v16M16 4v16"/>', prev:'<path d="M15 6l-6 6 6 6"/>', next:'<path d="M9 6l6 6-6 6"/>',
  play:'<path d="M7 4l13 8-13 8z"/>', help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  map:'<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/>', chart:'<path d="M4 20V4M4 20h16M8 16l3-5 3 3 5-8"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', table:'<path d="M3 5h18v14H3zM3 10h18M9 10v9"/>',
  more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>', cloud:'<path d="M7 18h10a4 4 0 00.6-7.95A6 6 0 006.2 9.1 4.5 4.5 0 007 18z"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>', cog:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  pipeline:'<path d="M3 6h5l3 6-3 6H3M11 12h4M15 6h6M15 18h6M15 6l3 6-3 6"/>'
};
const icon = (k,extra="")=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON[k]||""}</svg>`;

// ---------- URL state ----------
const list = s=>s?s.split(",").filter(Boolean).map(decodeURIComponent):[];
function parseR(s){ const o={}; list(s).forEach(p=>{ const [k,v]=p.split(":"); if(!k||!v) return; const [a,b]=v.split("~"); o[k]=[a===""?null:+a, b===undefined||b===""?null:+b]; }); return o; }
function parseW(s){ const o={}; list(s).forEach(p=>{ const [k,v]=p.split(":"); if(k&&v!=null&&isFinite(+v)) o[k]=+v; }); return o; }
function parseZ(s){ if(!s) return null; const v=s.split("~").map(Number); return v.length===4&&v.every(isFinite)?{x:[v[0],v[1]],y:[v[2],v[3]]}:null; }
function route(){
  const h = location.hash.replace(/^#/,"") || "/overview";
  const [path, qs] = h.split("?"); const parts = path.split("/").filter(Boolean);
  const q = new URLSearchParams(qs||"");
  return { page: parts[0]||"overview", arg: decodeURIComponent(parts.slice(1).join("/")||""), st: {
    q:q.get("q")||"", g:list(q.get("g")), t:list(q.get("t")), r:parseR(q.get("r")), s:list(q.get("s")), sel:list(q.get("sel")),
    c:list(q.get("c")), v:q.get("v")||"", cols:list(q.get("cols")), heat:q.get("heat")==="1", bars:q.get("bars")==="1", ch:q.get("ch")==="1", w:parseW(q.get("w")),
    ax:q.get("ax")||"", ay:q.get("ay")||"", sz:q.has("sz")?q.get("sz"):null, lg:q.get("lg")||"", qd:q.get("qd")==="1", lb:q.get("lb")||"sl", z:parseZ(q.get("z")), pin:q.get("pin")||"",
    tm:q.get("tm")||"", tc:q.get("tc")||"", tab:q.get("tab")||"", stg:list(q.get("stg")), pq:q.get("pq")||"", own:q.get("own")||"", od:q.get("od")==="1", open:q.get("open")||"", pack:q.get("pack")==="1", pv:q.has("pv")?(+q.get("pv")||1):0, connect:q.get("connect")==="1" } };
}
function qs(st){
  const q=[]; const e=encodeURIComponent, r4=v=>+(+v).toPrecision(5);
  if(st.q) q.push("q="+e(st.q));
  if(st.g&&st.g.length) q.push("g="+st.g.map(e).join(","));
  if(st.t&&st.t.length) q.push("t="+st.t.map(e).join(","));
  const r=Object.entries(st.r||{}).filter(([k,v])=>v&&(v[0]!=null||v[1]!=null)); if(r.length) q.push("r="+r.map(([k,v])=>`${k}:${v[0]??""}~${v[1]??""}`).join(","));
  if(st.sel&&st.sel.length) q.push("sel="+st.sel.map(e).join(","));
  if(st.s&&st.s.length) q.push("s="+st.s.join(","));
  if(st.c&&st.c.length) q.push("c="+st.c.map(e).join(","));
  if(st.v) q.push("v="+e(st.v)); if(st.cols&&st.cols.length) q.push("cols="+st.cols.join(","));
  if(st.heat) q.push("heat=1"); if(st.bars) q.push("bars=1"); if(st.ch) q.push("ch=1");
  const w=Object.entries(st.w||{}); if(w.length) q.push("w="+w.map(([k,v])=>`${k}:${v}`).join(","));
  if(st.ax) q.push("ax="+st.ax); if(st.ay) q.push("ay="+st.ay); if(st.sz!=null&&st.sz!==undefined) q.push("sz="+st.sz);
  if(st.lg) q.push("lg="+st.lg); if(st.qd) q.push("qd=1"); if(st.lb&&st.lb!=="sl") q.push("lb="+st.lb);
  if(st.z) q.push("z="+[st.z.x[0],st.z.x[1],st.z.y[0],st.z.y[1]].map(r4).join("~"));
  if(st.pin) q.push("pin="+e(st.pin)); if(st.tm) q.push("tm="+st.tm); if(st.tc) q.push("tc="+st.tc); if(st.tab) q.push("tab="+st.tab);
  if(st.stg&&st.stg.length) q.push("stg="+st.stg.join(",")); if(st.pq) q.push("pq="+e(st.pq)); if(st.own) q.push("own="+e(st.own)); if(st.od) q.push("od=1"); if(st.open) q.push("open="+e(st.open));
  return q.length?"?"+q.join("&"):"";
}
const href = (page, arg, st)=>`#/${page}${arg?"/"+encodeURIComponent(arg):""}${qs(st||{})}`;
function go(page, arg, st, replace){ const h=href(page,arg,st); if(replace) history.replaceState(null,"",h); else history.pushState(null,"",h); render(); }
const filterOnly = st=>({q:st.q,g:st.g,t:st.t,r:st.r,sel:st.sel,stg:st.stg});
const withState = (st, patch)=>({...st, ...patch});
const filtersActive = st=>!!(st.q||(st.stg&&st.stg.length)||(st.g&&st.g.length)||(st.t&&st.t.length)||(st.sel&&st.sel.length)||Object.values(st.r||{}).some(v=>v&&(v[0]!=null||v[1]!=null)));

// ---------- filtering + sorting + scoring ----------
const TOG = Object.fromEntries(M.filters.toggles.map(t=>[t.key,t]));
function filtered(st, cs){
  cs = cs || M.companies; const q=(st.q||"").toLowerCase(); const sel=st.sel&&st.sel.length?new Set(st.sel):null;
  return cs.filter(c=>{
    if(sel&&!sel.has(c.id)) return false;
    if(st.stg&&st.stg.length&&!st.stg.includes(PIPE.stageOf(c))) return false;
    if(q){ const hay=(c.name+" "+c.ticker+" "+c.code+" "+c.desc+" "+c.seg+" "+c.groups.map(g=>G[g.key]?.label).join(" ")).toLowerCase(); if(!hay.includes(q)) return false; }
    if(st.g&&st.g.length && !c.groups.some(g=>st.g.includes(g.key))) return false;
    for(const t of st.t||[]) if(TOG[t] && !TOG[t].test(c)) return false;
    for(const [k,[a,b]] of Object.entries(st.r||{})){ const v=c.m[k]; if(a!=null&&(v==null||v<a)) return false; if(b!=null&&(v==null||v>b)) return false; }
    return true;
  });
}
function sortKeys(st){ return (st.s&&st.s.length?st.s:[M.views[0].cols.includes("mc")?"-mc":"-"+(M.scatter.x)]).map(s=>({k:s.replace(/^-/,""),dir:s.startsWith("-")?-1:1})); }
function sorted(cs, st){
  const keys=sortKeys(st);
  const val=(c,k)=> k==="name"?c.name : k==="ev"?(c.ev?1:0) : k==="stage"?PIPE.stageIndex(c) : k==="score"?totalScore(c,st) : (c.nm&&c.nm[k])?null : c.m[k];
  return cs.slice().sort((a,b)=>{ for(const {k,dir} of keys){ const va=val(a,k), vb=val(b,k);
    if(typeof va==="string"||typeof vb==="string"){ const r=String(va||"").localeCompare(String(vb||"")); if(r) return dir*r; continue; }
    if(va==null&&vb==null) continue; if(va==null) return 1; if(vb==null) return -1; if(va!==vb) return dir*(va-vb); } return a.name.localeCompare(b.name); });
}
function weights(st){ const w={}; CRIT.forEach(c=>{ w[c.key]= st.w && st.w[c.key]!=null ? st.w[c.key] : c.weight; }); return w; }
function contributions(c, st){ const w=weights(st), tot=Object.values(w).reduce((a,b)=>a+b,0)||1; const parts={}; CRIT.forEach(k=>{ parts[k.key]=(c.sc[k.key]||0)*w[k.key]/tot*100; }); return parts; }
function totalScore(c, st){ return Object.values(contributions(c,st)).reduce((a,b)=>a+b,0); }

// ---------- shortlist staging (browser draft until published to the repo) ----------
const DRAFT_KEY = "gpc-shortlist-draft-"+M.key;
function draft(){ try{ return JSON.parse(localStorage.getItem(DRAFT_KEY)||"{}"); }catch(e){ return {}; } }
function setDraft(d){ try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); }catch(e){} }
function isStarred(c){ const d=draft(); return d[c.name]!=null ? d[c.name] : c.shortlisted; }
function pendingChanges(){ const d=draft(); return Object.entries(d).filter(([n,v])=>{ const c=M.companies.find(x=>x.name===n); return c && c.shortlisted!==v; }); }
function shortlistFileText(){
  const names = M.companies.filter(isStarred).map(c=>c.name);
  const meta = M.shortlistMeta||{}; const d=new Date();
  const upd = d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  return `// Team shortlist for this dashboard. Edited via the dashboard's "Publish shortlist" button or directly here.\n// names must match the company name in the data file exactly. notes are optional per company.\nwindow.SHORTLIST = ${JSON.stringify({updated:upd, names, notes:meta.notes||{}}, null, 2)};\n`;
}
function addCompare(id){ const st=route().st; const c=[...new Set([...(st.c||[]),id])].slice(-5); history.replaceState(null,"",href(route().page,route().arg,withState(st,{c}))); syncNav(); toast(`Added to compare (${c.length}/5). Open Compare to see them side by side.`); }

// ---------- shell ----------
const NAV = [["overview","Overview"],["pipeline","Pipeline"],["screener","Screener"],["shortlist","Shortlist"],["compare","Compare"]];
const NAV2 = [["dq","Data quality"],["method","Methodology"]];
function freshness(){
  if(!M.asofDate) return {tone:"neu",label:"No as-of date"};
  const h=(Date.now()-M.asofDate.getTime())/36e5;
  if(M.failed&&M.failed.length) return {tone:"warn",label:`${M.failed.length} refresh failure${M.failed.length>1?"s":""}`};
  if(h<=M.staleAfterHours) return {tone:"pos",label:"Fresh"};
  const d=Math.floor(h/24); return {tone:d>4?"neg":"warn",label:`${d} day${d!==1?"s":""} old`};
}
function shell(){
  const f=freshness();
  document.body.innerHTML = `
  <a class="skip" href="#main">Skip to content</a>
  <header class="hdr">
    <button class="iconbtn only-m" id="drawerBtn" aria-label="Open navigation" aria-controls="side" aria-expanded="false">${icon("menu")}</button>
    <a class="logo" href="#/overview" aria-label="Greater Pacific Capital — overview"><img src="${LOGO}" alt="Greater Pacific Capital" width="154" height="28"></a>
    <div class="prod"><b>${esc(M.product)}</b><span>${esc(M.subtitle)}</span></div>
    ${SIBS.length>1?`<nav class="switch" aria-label="Dashboards">${SIBS.map(s=>`<a href="${esc(s.href)}" ${s.key===M.key?'aria-current="true"':""}>${esc(s.label)}</a>`).join("")}</nav>`:""}
    <span class="grow"></span>
    <span class="caption hide-m num" title="${esc(M.asofNote)}">As of ${esc(M.asof||"n/a")}</span>
    <span class="pill ${f.tone}" data-tip="${esc(M.asofNote)}" tabindex="0">${esc(f.label)}</span>
    <button class="iconbtn searchbtn" id="searchBtn" aria-label="Search and commands (Ctrl+K)">${icon("search")}<span class="lbl">Search or jump to…</span><kbd>Ctrl K</kbd></button>
    <button class="btn primary hide-m" id="presentBtn" type="button" data-tip="Full-screen walkthrough (P)">${icon("play")}Present</button>
    <button class="btn hide-m" id="packBtn" type="button">${icon("print")}IC pack</button>
    <button class="iconbtn hide-m" id="keysBtn" aria-label="Keyboard shortcuts (?)">${icon("help")}</button>
    <span class="conf conf-wide">Confidential – internal use only</span>
  </header>
  <div class="shell" id="shell">
    <nav class="side" id="side" aria-label="Main">
      <button class="iconbtn" id="collapseBtn" aria-label="Collapse sidebar" style="align-self:flex-end">${icon("collapse")}</button>
      <span class="sideh">Workspace</span>
      ${NAV.map(([k,l])=>`<a href="#/${k}" data-nav="${k}">${icon(k)}<span>${l}</span>${k==="shortlist"?`<span class="ct" id="slCount"></span>`:k==="compare"?`<span class="ct" id="cmpCount"></span>`:""}</a>`).join("")}
      <span class="sideh">Reference</span>
      ${NAV2.map(([k,l])=>`<a href="#/${k}" data-nav="${k}">${icon(k==="method"?"method":k)}<span>${l}</span></a>`).join("")}
      <a href="#/dev/gallery" data-nav="dev">${icon("chart")}<span>Chart gallery</span></a>
      <div class="sep"></div>
      ${SIBS.length>1?SIBS.filter(s=>s.key!==M.key).map(s=>`<a href="${esc(s.href)}">${icon("bolt")}<span>${esc(s.label)} dashboard</span></a>`).join(""):""}
      <div class="foot">${esc(M.sourceLine||"")}</div>
    </nav>
    <div class="scrim" id="scrim"></div>
    <main class="main" id="main" tabindex="-1"></main>
  </div>
  <div class="modal" id="search" hidden role="dialog" aria-modal="true" aria-label="Search and commands">
    <div class="sbox"><input id="sq" type="search" placeholder="Search companies, or type a command…" autocomplete="off" aria-controls="sres"><ul class="sres" id="sres" role="listbox"></ul></div>
  </div>
  <div class="modal" id="keys" hidden role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div class="keys"></div></div>
  <div class="present" id="present" hidden role="dialog" aria-modal="true" aria-label="Presentation"><div class="pv-stage"></div><div class="pv-bar"></div></div>
  <div class="tip" id="tip" hidden></div><div class="toast" id="toast" hidden></div><div id="pack"></div>`;
  const shellEl=document.getElementById("shell");
  try{ if(localStorage.getItem("gpc-side-collapsed")==="1") shellEl.classList.add("collapsed"); }catch(e){}
  document.getElementById("collapseBtn").onclick=()=>{ shellEl.classList.toggle("collapsed"); try{ localStorage.setItem("gpc-side-collapsed",shellEl.classList.contains("collapsed")?"1":"0"); }catch(e){} lastKey=""; render(); };
  const db=document.getElementById("drawerBtn");
  const setDrawer=open=>{ document.body.classList.toggle("drawer-open",open); db.setAttribute("aria-expanded",open); if(open) document.querySelector(".side a")?.focus(); };
  db.onclick=()=>setDrawer(!document.body.classList.contains("drawer-open"));
  document.getElementById("scrim").onclick=()=>setDrawer(false);
  document.getElementById("side").addEventListener("click",e=>{ if(e.target.closest("a")) setDrawer(false); });
  document.getElementById("searchBtn").onclick=()=>openSearch();
  document.getElementById("packBtn").onclick=()=>exportPack();
  document.getElementById("presentBtn").onclick=()=>Present.open();
  document.getElementById("keysBtn").onclick=showKeys;
  let gPending=false, gTimer;
  addEventListener("keydown",e=>{
    if(!document.getElementById("present").hidden){ Present.key(e); return; }
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); openSearch(); return; }
    if(e.key==="Escape"){ closeSearch(); closeKeys(); setDrawer(false); closePops(); if(PUI) PUI.closeDrawer(); return; }
    const typing=/^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement||{}).tagName||"")||document.activeElement?.isContentEditable;
    if(typing||e.ctrlKey||e.metaKey||e.altKey) return;
    if(gPending){ gPending=false; const map={o:"overview",p:"pipeline",s:"screener",l:"shortlist",c:"compare",d:"dq",m:"method"}; if(map[e.key]){ e.preventDefault(); go(map[e.key],"",filterOnly(route().st)); } return; }
    if(e.key==="g"){ gPending=true; clearTimeout(gTimer); gTimer=setTimeout(()=>gPending=false,900); return; }
    if(e.key==="/"){ e.preventDefault(); openSearch(); }
    else if(e.key==="p"){ e.preventDefault(); Present.open(); }
    else if(e.key==="?"){ e.preventDefault(); showKeys(); }
    else if((e.key==="["||e.key==="]")&&route().page==="company"){ const a=document.querySelector(e.key==="["?"[data-prev]":"[data-next]"); if(a){ e.preventDefault(); a.click(); } }
  });
  document.addEventListener("mouseover",e=>{ const t=e.target.closest("[data-tip]"); if(t) C.Tip.show(esc(t.getAttribute("data-tip")).replace(/\n/g,"<br>"),e); });
  document.addEventListener("mousemove",e=>{ if(e.target.closest("[data-tip]")) C.Tip.move(e); });
  document.addEventListener("mouseout",e=>{ if(e.target.closest("[data-tip]")) C.Tip.hide(); });
  document.addEventListener("focusin",e=>{ const t=e.target.closest("[data-tip]"); if(t){ const r=t.getBoundingClientRect(); C.Tip.show(esc(t.getAttribute("data-tip")).replace(/\n/g,"<br>"),{clientX:r.left,clientY:r.bottom}); } });
  document.addEventListener("focusout",()=>C.Tip.hide());
}
function toast(m){ const t=document.getElementById("toast"); t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2800); }
function showKeys(){ const k=document.getElementById("keys"); k.hidden=false;
  const rows=[["Ctrl K  or  /","Search companies and run commands"],["P","Present (full screen); ← → to move, Esc to exit"],["G then O / P / S / L / C","Go to Overview, Pipeline, Screener, Shortlist, Compare"],["Shift + ← →","Move a focused pipeline card to the previous / next stage"],["[  ]","Previous / next company in the current filter"],["Drag on a chart","Select companies (Shift-drag pans)"],["Ctrl / ⌘ + scroll","Zoom the positioning chart; double-click to reset"],["Arrow keys on a chart","Move between companies; Enter opens, Space pins"],["Esc","Close, clear selection"]];
  k.firstElementChild.innerHTML=`<h2 style="margin-bottom:var(--s-3)">Keyboard shortcuts</h2><table>${rows.map(r=>`<tr><td>${r[0].split("  ").map(x=>`<kbd>${esc(x)}</kbd>`).join(" ")}</td><td>${esc(r[1])}</td></tr>`).join("")}</table>`;
  k.onclick=e=>{ if(e.target===k) closeKeys(); }; }
function closeKeys(){ const k=document.getElementById("keys"); if(k) k.hidden=true; }

// ---------- command palette ----------
let sIdx=0, sItems=[];
function actions(){ const st=route().st; return [
  {label:"Present to the room",icon:"play",hint:"P",run:()=>Present.open()},
  {label:"Export IC pack (PDF)",icon:"print",run:()=>exportPack()},
  {label:"Pipeline storage and team sync",icon:"cog",run:()=>PUI&&PUI.settings(PIPE)},
  ...NAV.concat(NAV2).map(([k,l])=>({label:`Go to ${l}`,icon:k==="method"?"method":k,href:href(k,"",filterOnly(st))})),
  ...M.presets.map(p=>({label:`Screen: ${p.label}`,icon:"bolt",sub:p.desc,href:href("screener","",{t:p.state.t||[],r:p.state.r||{},s:p.state.s||[]})})),
  {label:"Positioning chart in the screener",icon:"chart",href:href("screener","",withState(filterOnly(st),{ch:true}))},
  ...SIBS.filter(s=>s.key!==M.key).map(s=>({label:`Switch to ${s.label} dashboard`,icon:"bolt",href:s.href})),
  {label:"Keyboard shortcuts",icon:"help",hint:"?",run:showKeys}]; }
function openSearch(){ const m=document.getElementById("search"); m.hidden=false; const i=document.getElementById("sq"); i.value=""; doSearch(""); i.focus();
  i.oninput=()=>doSearch(i.value); i.onkeydown=e=>{ if(e.key==="ArrowDown"){e.preventDefault();sIdx=Math.min(sItems.length-1,sIdx+1);paintS(i.value.trim().toLowerCase());} if(e.key==="ArrowUp"){e.preventDefault();sIdx=Math.max(0,sIdx-1);paintS(i.value.trim().toLowerCase());} if(e.key==="Enter"&&sItems[sIdx]){ e.preventDefault(); runItem(sItems[sIdx]); } if(e.key==="Tab"){e.preventDefault();} };
  m.onclick=e=>{ if(e.target===m) closeSearch(); }; }
function closeSearch(){ const m=document.getElementById("search"); if(m&&!m.hidden){ m.hidden=true; document.getElementById("searchBtn")?.focus(); } }
function runItem(it){ closeSearch(); if(it.run) it.run(); else if(it.href) location.href=it.href; }
function doSearch(q){
  q=q.trim().toLowerCase(); const st=route().st;
  const score=c=>{ if(!q) return c.shortlisted?2:0; const n=c.name.toLowerCase(); if(n.startsWith(q)) return 5; if((c.ticker||"").toLowerCase()===q) return 5; if(n.includes(q)) return 4; if((c.ticker+" "+c.code).toLowerCase().includes(q)) return 3; if((c.desc+" "+c.seg+" "+c.groups.map(g=>G[g.key]?.label).join(" ")).toLowerCase().includes(q)) return 1; return 0; };
  const cos = M.companies.map(c=>({c,s:score(c)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||a.c.name.localeCompare(b.c.name)).slice(0,q?10:6).map(x=>({kind:"co",c:x.c,href:href("company",x.c.id,filterOnly(st))}));
  const acts = actions().filter(a=>!q||a.label.toLowerCase().includes(q)).slice(0,q?6:7).map(a=>({kind:"act",...a}));
  sItems = q ? cos.concat(acts) : acts.concat(cos); sIdx=0; paintS(q);
}
function paintS(q){ const ul=document.getElementById("sres"); const hl=s=>{ if(!q) return esc(s); const i=s.toLowerCase().indexOf(q); return i<0?esc(s):esc(s.slice(0,i))+"<mark>"+esc(s.slice(i,i+q.length))+"</mark>"+esc(s.slice(i+q.length)); };
  let lastKind=""; ul.innerHTML = sItems.length ? sItems.map((it,i)=>{ const h=it.kind!==lastKind?`<li class="grp-h">${it.kind==="act"?"Commands":q?"Companies":"Shortlist"}</li>`:""; lastKind=it.kind;
    return h+(it.kind==="act"?`<li><a href="${it.href||"#"}" class="act" role="option" aria-selected="${i===sIdx}" data-i="${i}"><span>${icon(it.icon)}${hl(it.label)}</span><span class="k">${esc(it.hint||it.sub||"")}</span></a></li>`
      :`<li><a href="${it.href}" role="option" aria-selected="${i===sIdx}" data-i="${i}"><span>${hl(it.c.name)}</span><span class="k">${esc([it.c.ticker,G[it.c.prim]?.short].filter(Boolean).join(" · "))}</span></a></li>`); }).join("") : `<li class="empty">Nothing matches “${esc(q||"")}”.</li>`;
  ul.querySelectorAll("a[data-i]").forEach(a=>a.addEventListener("click",e=>{ e.preventDefault(); runItem(sItems[+a.dataset.i]); }));
  ul.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest"}); }

// ---------- filter chips ----------
function rangeLabel(k,[a,b]){ const m=MET[k]; const u=m.fmt==="cr"?"":m.fmt==="x"?"x":m.fmt==="pp"?" pp":"%"; return `${m.short} ${a!=null?a:"…"}–${b!=null?b:"…"}${u}`; }
function chipItems(st){ const items=[];
  if(st.sel&&st.sel.length) items.push({label:`Selection · ${st.sel.length} compan${st.sel.length>1?"ies":"y"}`, rm:{sel:[]}});
  (st.stg||[]).forEach(k=>PIPE.idx[k]!=null&&items.push({label:"Stage: "+PIPE.stages[PIPE.idx[k]].short, rm:{stg:st.stg.filter(x=>x!==k)}}));
  if(st.q) items.push({label:`“${st.q}”`, rm:{q:""}});
  (st.g||[]).forEach(k=>G[k]&&items.push({label:G[k].short, rm:{g:st.g.filter(x=>x!==k)}}));
  (st.t||[]).forEach(k=>TOG[k]&&items.push({label:TOG[k].label, rm:{t:st.t.filter(x=>x!==k)}}));
  Object.entries(st.r||{}).forEach(([k,v])=>{ if(MET[k]&&(v[0]!=null||v[1]!=null)){ const r={...st.r}; delete r[k]; items.push({label:rangeLabel(k,v), rm:{r}}); } });
  return items; }
function chips(st){ const items=chipItems(st); if(!items.length) return "";
  return `<div class="chipbar" role="region" aria-label="Active filters">${items.map((it,i)=>`<span class="fchip">${esc(it.label)}<button type="button" data-chip="${i}" aria-label="Remove filter ${esc(it.label)}">${icon("x")}</button></span>`).join("")}<button type="button" class="linkbtn" data-reset>Reset</button></div>`; }
function bindChips(root, st, page, arg){ const items=chipItems(st);
  root.querySelectorAll("[data-chip]").forEach(b=>b.onclick=()=>go(page,arg,withState(st,items[+b.dataset.chip].rm)));
  root.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>go(page,arg,withState(st,{q:"",g:[],t:[],r:{},sel:[],stg:[]}))); }

// ---------- router ----------
const PAGES = {};
let lastKey="";
function syncNav(){ const {page,arg,st}=route(), cur=page==="company"?"screener":page==="dev"&&arg==="pipeline-sample"?"pipeline":page;
  document.querySelectorAll("[data-nav]").forEach(a=>{ const k=a.dataset.nav; a.href = k==="dev"?"#/dev/gallery":href(k,"",withState(filterOnly(st),{c:st.c,w:st.w})); if(k===cur) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  const sl=document.getElementById("slCount"); if(sl) sl.textContent=M.companies.filter(c=>c.shortlisted).length||"";
  const cc=document.getElementById("cmpCount"); if(cc) cc.textContent=(st.c&&st.c.length)||""; }
function render(){
  const {page,arg,st} = route();
  syncNav();
  const main=document.getElementById("main");
  const fn = PAGES[page] || PAGES.overview;
  const key=page+"|"+arg, same=key===lastKey;
  if(!same&&lastKey&&PUI) PUI.closeDrawer();
  C.Tip.hide();
  if(!same){ main.classList.remove("enter"); void main.offsetWidth; if(!RM()) main.classList.add("enter"); }
  fn(main, st, arg, same);
  if(!same){ if(lastKey) { main.focus({preventScroll:true}); scrollTo({top:0}); } }
  lastKey=key;
  document.title = `${({overview:"Overview",pipeline:"Pipeline",screener:"Screener",company:(byId.get(arg)||{}).name||"Company",shortlist:"Shortlist",compare:"Compare",dq:"Data quality",method:"Methodology",dev:"Chart gallery"})[page]||"Overview"} · ${M.product}`;
}

// ======================================================================================
// Overview
// ======================================================================================
const OV={lab:null, hidden:new Set(), chg:"all", tmKey:""};
function labAxes(st){ const ax=st.ax&&MET[st.ax]?st.ax:M.scatter.x, ay=st.ay&&MET[st.ay]?st.ay:M.scatter.y;
  const sz=st.sz==null?(M.scatter.size||""):(st.sz==="none"?"":(MET[st.sz]?st.sz:"")); return {ax,ay,sz}; }
const axisLabel=k=>`${MET[k].label} (${unitOf(k)})${MET[k].better?(MET[k].better==="high"?" · higher is better":" · lower is better"):""}`;
function labPoints(st, mode){
  const {ax,ay,sz}=labAxes(st), anySl=M.companies.some(c=>c.shortlisted), lb=st.lb||"sl";
  const fst=withState(st,{sel:[]}), match=filtersActive(fst)?new Set(filtered(fst).map(c=>c.id)):null;
  let sv=null; if(sz){ const vals=M.companies.map(c=>c.m[sz]).filter(v=>v!=null&&v>0); if(vals.length) sv={lo:Math.min(...vals), hi:Math.max(...vals)}; }
  return M.companies.filter(c=>!OV.hidden.has(c.prim)||c.shortlisted).map(c=>{ const g=G[c.prim]||{}; let r=5;
    if(sv){ const v=c.m[sz]; r = v>0 ? 3.5+15*Math.sqrt((v-sv.lo)/((sv.hi-sv.lo)||1)) : 3; }
    return {id:c.id, x:c.nm[ax]?null:c.m[ax], y:c.nm[ay]?null:c.m[ay], r, color:g.color||"var(--viz-1)", shape:g.shape||"circle", series:c.prim,
      label: lb==="all"?shortName(c.name) : (lb==="sl"&&c.shortlisted)?shortName(c.name):null, name:shortName(c.name),
      faded: mode!=="screener"&&lb==="sl"&&anySl&&!c.shortlisted, dim: !!match&&!match.has(c.id), c}; });
}
function richTip(c, keys){ const ks=[...new Set(keys.filter(k=>k&&MET[k]))];
  return `<span class="tip-h">${esc(c.name)}</span><span class="tip-sub">${esc([c.ticker?`${c.exchange}: ${c.ticker}`:c.exchange, G[c.prim]?.label].filter(Boolean).join(" · "))}</span>
  <div class="tip-g">${ks.map(k=>`<span>${esc(MET[k].label)}</span><span>${esc(c.nm&&c.nm[k]?"n.m.":fmtPlain(k,c.m[k]))}</span>`).join("")}</div>
  ${c.flags.length?`<div class="tip-pills">${c.flags.map(f=>`<span class="pill ${f.tone}">${esc(f.label)}</span>`).join("")}</div>`:""}
  <div class="tip-foot">Click to pin · double-click to open</div>`; }
function labOpts(st, mode, handlers){ const {ax,ay,sz}=labAxes(st), lg=st.lg||"";
  return { points:labPoints(st,mode), xLabel:axisLabel(ax), yLabel:axisLabel(ay), xTick:v=>tick(ax,v), yTick:v=>tick(ay,v), xFmt:v=>fmtPlain(ax,v), yFmt:v=>fmtPlain(ay,v),
    logX:lg.includes("x"), logY:lg.includes("y"), band:M.mandate&&ax===M.mandate.metric&&!lg.includes("x")?[M.mandate.lo,M.mandate.hi]:null, bandLabel:M.mandate?M.mandate.label:"",
    medianX:(M.stats[ax]||{}).med, medianY:(M.stats[ay]||{}).med, quadrants:!!st.qd,
    quadLabels:{tl:`Higher ${MET[ay].short} · lower ${MET[ax].short}`, tr:`Higher ${MET[ay].short} · higher ${MET[ax].short}`, bl:`Lower ${MET[ay].short} · lower ${MET[ax].short}`, br:`Lower ${MET[ay].short} · higher ${MET[ax].short}`},
    zoom:st.z||null, pinned:mode==="screener"?null:(st.pin||null), selected:st.sel||[], height:mode==="screener"?340:null,
    tipHtml:p=>richTip(p.c,[ax,ay,sz,...M.company.kpis.slice(0,3)]), aria:`Interactive scatter of ${MET[ax].label} against ${MET[ay].label}`, ...handlers }; }
function ovSet(patch, push){ const r=route(); const st=withState(r.st,patch); const h=href("overview","",st); if(push) history.pushState(null,"",h); else history.replaceState(null,"",h); ovUpdate(st); }
const ovHandlers = { onPin:id=>ovSet({pin:id||""}), onSelect:ids=>ovSet({sel:ids,pin:""}), onZoom:z=>ovSet({z:z||null}), onOpen:id=>go("company",id,filterOnly(route().st)) };

function kpiTiles(cs, prevCs, opts={}){
  const vals=Object.fromEntries(M.kpis.map(k=>[k.key,k.value(cs)])), uni=vals.universe||cs.length;
  return M.kpis.map(k=>{ const v=vals[k.key], pv=prevCs?k.value(prevCs):null; let d="";
    if(pv!=null&&v!=null){ const diff=v-pv, ad=Math.abs(diff), dp=ad<0.05?2:1, dtxt=k.fmt==="int"?String(ad):k.fmt==="x"?nf(ad,dp)+"x":k.fmt==="pct"||k.fmt==="chg"?nf(ad,dp)+" pp":"₹"+nf(ad,dp)+" cr";
      d = ad<1e-9?`<span class="delta na">No change vs previous</span>`:`<span class="delta ${diff>0?"pos":"neg"}">${diff>0?"▲":"▼"} ${dtxt} vs previous</span>`; }
    else d=`<span class="delta na">${PREV?"–":"No previous snapshot"}</span>`;
    const metric=k.metric||(MET[k.key]?k.key:null);
    const cnt = v==null?"–" : k.fmt==="int"?String(Math.round(v)) : k.fmt==="cr"?nf(v,1) : fmt(null,v,null,{fmt:k.fmt});
    let mini="";
    if(k.fmt==="int"&&k.key!=="universe"&&uni&&v!=null&&v<=uni) mini=`<span class="kmini"><span class="kb"><i style="width:${(v/uni*100).toFixed(1)}%"></i></span></span>`;
    else if(metric&&M.stats[metric]&&M.stats[metric].n>2){ const vs=cs.map(c=>c.nm&&c.nm[metric]?null:c.m[metric]).filter(x=>x!=null&&isFinite(x)); const [lo,hi]=C.robust(vs), W=200;
      const sx=x=>4+(Math.max(lo,Math.min(hi,x))-lo)/((hi-lo)||1)*(W-8);
      mini=`<span class="kmini"><svg viewBox="0 0 ${W} 16" preserveAspectRatio="none" aria-hidden="true">${vs.map(x=>`<circle class="kd" cx="${sx(x).toFixed(1)}" cy="8" r="2"/>`).join("")}${v!=null?`<line class="km" x1="${sx(v)}" x2="${sx(v)}" y1="1" y2="15"/>`:""}</svg></span>`; }
    const body=`<span class="eyebrow">${esc(k.label)}</span><span class="kpi-v">${cnt}${k.fmt==="cr"?"<small> ₹ cr</small>":""}</span>${mini}${d}<span class="ctx">${esc(k.ctx(cs))}</span>`;
    return k.link&&!opts.static?`<a class="kpi" href="${href("screener","",k.link)}">${body}</a>`:`<div class="kpi">${body}</div>`; }).join("");
}
function headline(cs){ const ch=M.changes, vals=Object.fromEntries(M.kpis.map(k=>[k.key,k.value(cs)]));
  const chTxt = ch==null?"no previous snapshot to compare with yet":ch.length?`<span class="hn">${ch.length}</span> change${ch.length>1?"s":""} since the last refresh`:"no changes since the last refresh";
  const n=v=>`<span class="hn">${v}</span>`, pc=PUI?PUI.counts():null, inPlay=pc?PUI.INPLAY.reduce((a,k)=>a+pc[k],0):0, ip=inPlay?`${n(inPlay)} in play; `:"";
  return M.key==="fs" ? `${n(vals.universe)} companies screened; ${n(vals.fit)} fit the mandate; ${n(vals.short)} on the shortlist; ${ip}${chTxt}.`
    : `${n(vals.universe)} companies on the outreach list; ${n(vals.profitable)} profitable; ${n(vals.evaluated)} evaluated; ${n(vals.short)} on the shortlist; ${ip}${chTxt}.`; }

PAGES.overview = (main, st, arg, same)=>{
  if(same && OV.lab && main.querySelector("#lab")){ ovUpdate(st); return; }
  const cs=M.companies, {ax,ay,sz}=labAxes(st), lg=st.lg||"";
  const axOpts=k=>M.scatter.axes.map(a=>`<option value="${a}" ${a===k?"selected":""}>${esc(MET[a].label)}</option>`).join("");
  const szKeys=(M.treemap&&M.treemap.size)||[];
  main.innerHTML=`
  <section class="hero ov-hero" aria-label="Summary">
    <div class="cst-wrap" id="cst"></div>
    <div class="hero-top"><div><span class="eyebrow">${esc(M.product)} · data as of ${esc(M.asof||"n/a")}</span>
      <h1 class="hero-h">${headline(cs).replace(/^./,ch=>ch.toUpperCase())}</h1>
      <p class="hero-sub">${esc(M.subtitle)}${PREV?` · compared with the snapshot of ${esc(PREV.asof||M.prevLabel||"")}`:""}</p></div>
      <div class="hero-acts"><button class="btn primary" type="button" id="ovPresent">${icon("play")}Present</button><a class="btn" href="${href("screener","",filterOnly(st))}">${icon("screener")}Open screener</a></div></div>
    <div id="ovChips"></div>
    <section class="kpis" aria-label="Key figures">${kpiTiles(cs, PREV?PREV.companies:null)}</section>
  </section>
  <section class="card" id="labCard">
    <div class="card-h"><div><h2 id="labT"></h2><div class="sub" id="labS"></div></div>
      <div class="tools">
        <label class="lbl" for="ax">X</label><select id="ax">${axOpts(ax)}</select>
        <label class="lbl" for="ay">Y</label><select id="ay">${axOpts(ay)}</select>
        <label class="lbl" for="sz">Size</label><select id="sz"><option value="none">None</option>${szKeys.map(k=>`<option value="${k}" ${k===sz?"selected":""}>${esc(MET[k].label)}</option>`).join("")}</select>
        <span class="seg" role="group" aria-label="Scale">${[["","Linear"],["x","Log X"],["xy","Log X·Y"]].map(([v,l])=>`<button type="button" data-lg="${v}" aria-pressed="${lg===v}">${l}</button>`).join("")}</span>
        <span class="seg" role="group" aria-label="Labels">${[["sl","Shortlist"],["all","All"],["none","None"]].map(([v,l])=>`<button type="button" data-lb="${v}" aria-pressed="${(st.lb||"sl")===v}">${l}</button>`).join("")}</span>
        <span class="seg"><button type="button" id="qd" aria-pressed="${!!st.qd}" data-tip="Split the chart at the universe medians">Quadrants</button></span>
      </div></div>
    <div class="lab-wrap"><div><div id="lab"></div>
      <div class="lab-foot"><div class="legend" id="labL"></div><div class="tools"><span class="hint"><kbd>Drag</kbd> select · <kbd>Shift</kbd>+drag pan · <kbd>Ctrl</kbd>+scroll zoom · <kbd>Dbl-click</kbd> open</span>
        <span class="zoombtns"><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-zoom="out" aria-label="Zoom out">−</button><button type="button" data-zoom="reset" aria-label="Reset zoom">⟲</button></span></div></div></div>
      <aside class="spot" id="spot" aria-live="polite"></aside></div>
  </section>
  <div class="grid g-main" style="margin-top:var(--s-4)">
    <section class="card" id="tmCard"><div class="card-h"><div><h2 id="tmT"></h2><div class="sub" id="tmS"></div></div>
      <div class="tools"><label class="lbl" for="tm">Size</label><select id="tmSel">${szKeys.map(k=>`<option value="${k}">${esc(MET[k].label)}</option>`).join("")}</select>
      <label class="lbl" for="tc">Colour</label><select id="tcSel"><option value="group">${esc(M.groupLabel)}</option>${((M.treemap&&M.treemap.color)||[]).filter(k=>MET[k]).map(k=>`<option value="${k}">${esc(MET[k].label)}</option>`).join("")}</select></div></div>
      <div id="tm"></div><div class="legend" id="tmL"></div></section>
    <div class="stack">
      <section class="card"><div class="card-h"><div><h2>Screening funnel</h2><div class="sub">Companies passing each stage · % of universe retained · hover a stage to see who drops out</div></div></div><div id="fn"></div></section>
      <section class="card"><div class="card-h"><div><h2>Shortlist at a glance</h2><div class="sub">Ranked on default weights · score 0–100</div></div><a class="btn sm" href="${href("shortlist","",filterOnly(st))}">Open</a></div><div id="sg"></div></section>
    </div>
  </div>
  <section class="card" style="margin-top:var(--s-4)" id="plGlanceCard"><div class="card-h"><div><h2>Deal pipeline</h2><div class="sub">Companies reaching each stage · % share moving on · next steps by due date · click a stage to open the pipeline</div></div><a class="btn sm" href="${href("pipeline","",{})}">${icon("pipeline")}Open pipeline</a></div><div id="plG"></div></section>
  <section class="card" style="margin-top:var(--s-4)" id="chgCard"></section>`;
  // decoration + count-up
  const cst=main.querySelector("#cst"); C.constellation(cst,{height:Math.max(180,cst.clientHeight||260), points:M.companies.map(c=>({id:c.id,x:c.pct[M.scatter.x],y:c.pct[M.scatter.y],star:c.shortlisted}))});

  main.querySelector("#ovPresent").onclick=()=>Present.open();
  // lab
  OV.lab=new C.Lab(main.querySelector("#lab"), labOpts(st,"overview",ovHandlers));
  main.querySelector("#ax").onchange=e=>ovSet({ax:e.target.value,z:null},true);
  main.querySelector("#ay").onchange=e=>ovSet({ay:e.target.value,z:null},true);
  main.querySelector("#sz").onchange=e=>ovSet({sz:e.target.value},true);
  main.querySelectorAll("[data-lg]").forEach(b=>b.onclick=()=>ovSet({lg:b.dataset.lg,z:null},true));
  main.querySelectorAll("[data-lb]").forEach(b=>b.onclick=()=>ovSet({lb:b.dataset.lb},true));
  main.querySelector("#qd").onclick=()=>ovSet({qd:!route().st.qd},true);
  main.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>{ const z=b.dataset.zoom; if(z==="reset") ovSet({z:null}); else OV.lab.zoomBy(z==="in"?1/1.4:1.4); });
  main.querySelector("#tmSel").onchange=e=>ovSet({tm:e.target.value},true);
  main.querySelector("#tcSel").onchange=e=>ovSet({tc:e.target.value==="group"?"":e.target.value},true);
  OV.tmKey=""; ovUpdate(st);
  ovFunnel(); ovGlance(st); ovChanges(); if(PUI) PUI.glance(main.querySelector("#plG"), st);
};
function ovUpdate(st){
  const main=document.getElementById("main"), {ax,ay,sz}=labAxes(st), lg=st.lg||"";
  if(OV.lab) OV.lab.update(labOpts(st,"overview",ovHandlers));
  const ch=main.querySelector("#ovChips"); if(ch){ ch.innerHTML=chips(st); bindChips(ch,st,"overview",""); }
  // controls reflect state (after back/forward)
  const set=(sel,v)=>{ const e=main.querySelector(sel); if(e&&e.value!==v) e.value=v; };
  set("#ax",ax); set("#ay",ay); set("#sz",sz||"none");
  main.querySelectorAll("[data-lg]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lg===lg)); main.querySelectorAll("[data-lb]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lb===(st.lb||"sl")));
  const qd=main.querySelector("#qd"); if(qd) qd.setAttribute("aria-pressed",!!st.qd);
  // titles
  const pts=OV.lab?OV.lab.pos.size:0, slv=M.companies.filter(c=>c.shortlisted&&c.m[ax]!=null&&c.m[ay]!=null);
  const t=main.querySelector("#labT"); if(t) t.textContent = st.sel&&st.sel.length?`${st.sel.length} companies selected`:st.pin&&byId.get(st.pin)?`Spotlight: ${shortName(byId.get(st.pin).name)}`:slv.length?`${slv.length} shortlisted compan${slv.length>1?"ies":"y"} against the universe`:`${pts} companies by ${MET[ax].label} and ${MET[ay].label}`;
  const s=main.querySelector("#labS"); if(s) s.textContent=`Positioning lab · ${MET[ax].label} (${unitOf(ax)}) vs ${MET[ay].label} (${unitOf(ay)})${sz?` · bubble = ${MET[sz].label} (${unitOf(sz)})`:""}${lg?" · log scale":""} · dashed = universe median · as of ${M.asof||"n/a"}${OV.lab&&OV.lab.logHidden?` · ${OV.lab.logHidden} with values ≤ 0 hidden on log scale`:""}`;
  // legend (isolate a group)
  const used=[...new Set(M.companies.map(c=>c.prim))]; const items=M.groups.filter(g=>used.includes(g.key)&&!g.other).map(g=>({key:g.key,label:g.short,color:g.color,shape:g.shape,on:!OV.hidden.has(g.key),n:M.companies.filter(c=>c.prim===g.key).length}));
  if(M.groups.some(g=>g.other&&used.includes(g.key))) items.push({key:"__other",label:"Other "+M.groupLabelPlural.toLowerCase(),color:"var(--viz-muted)",shape:"circle",on:true});
  const L=main.querySelector("#labL"); if(L) C.legend(L, items, k=>{ if(k==="__other") return; const keys=items.filter(i=>i.key!=="__other").map(i=>i.key); const solo=OV.hidden.size===keys.length-1&&!OV.hidden.has(k);
    OV.hidden=new Set(solo?[]:keys.filter(x=>x!==k)); ovUpdate(route().st); }, null);
  ovSpot(st); ovTreemap(st);
}
function pbar(c,k){ const p=MET[k].better?c.pctGood[k]:c.pct[k]; const v=c.nm&&c.nm[k]?null:c.m[k];
  return `<div class="pbar"><span>${esc(MET[k].label)}</span><b class="num">${esc(c.nm&&c.nm[k]?"n.m.":fmtPlain(k,v))}</b><span class="tr"><i style="width:${p==null?0:p.toFixed(0)}%"></i></span><span class="caption" style="grid-column:1/-1">${p==null?"not ranked":`${MET[k].better?"Better than":"Higher than"} ${Math.round(p)}% of the universe`}</span></div>`; }
function ovSpot(st){
  const el=document.getElementById("spot"); if(!el) return; const {ax,ay,sz}=labAxes(st);
  if(st.pin&&byId.has(st.pin)){ const c=byId.get(st.pin), keys=[ax,ay,sz,...M.company.kpis].filter((k,i,a)=>k&&MET[k]&&a.indexOf(k)===i).slice(0,6);
    el.innerHTML=`<span class="eyebrow">Spotlight</span><h3>${esc(c.name)}</h3><div class="pills">${c.ticker?`<span class="caption num">${esc(c.exchange)}: ${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}${c.verdict?pill(c.verdict.label,c.verdict.tone):""}${flagPills(c)}</div>
      <div class="stack" style="gap:var(--s-3)">${keys.map(k=>pbar(c,k)).join("")}</div>
      <div class="acts"><a class="btn primary sm" href="${href("company",c.id,filterOnly(st))}">Open company</a><button class="btn sm" type="button" data-cmp="${esc(c.id)}">${icon("plus")}Compare</button><button class="btn sm" type="button" data-unpin>Unpin</button></div>`; }
  else if(st.sel&&st.sel.length){ const cs=st.sel.map(id=>byId.get(id)).filter(Boolean), med=k=>K.median(cs.map(c=>c.m[k]));
    el.innerHTML=`<span class="eyebrow">Selection</span><div><span class="big">${cs.length}</span> <span class="caption">compan${cs.length>1?"ies":"y"} selected</span></div>
      <div class="tip-g" style="display:grid">${[ax,ay,sz].filter(Boolean).map(k=>`<span class="caption">Median ${esc(MET[k].short)}</span><b class="num" style="text-align:right">${esc(fmtPlain(k,med(k)))} <span class="subtle">vs ${esc(fmtPlain(k,(M.stats[k]||{}).med))}</span></b>`).join("")}</div>
      <ul class="slist">${cs.slice(0,40).map(c=>`<li><a href="#" data-pinid="${esc(c.id)}">${esc(shortName(c.name))}</a><span class="num subtle">${esc(fmtPlain(ay,c.m[ay]))}</span></li>`).join("")}</ul>
      <div class="acts"><a class="btn primary sm" href="${href("screener","",withState(filterOnly(st),{sel:st.sel}))}">Open in screener</a><a class="btn sm" href="${href("compare","",withState(filterOnly(st),{c:cs.slice(0,5).map(c=>c.id)}))}">Compare first 5</a><button class="btn sm" type="button" data-zsel>Zoom to fit</button><button class="btn sm" type="button" data-clear>Clear</button></div>`; }
  else { const n=OV.lab?OV.lab.pos.size:0;
    el.innerHTML=`<span class="eyebrow">Positioning lab</span><h3>${n} companies plotted</h3><p class="caption" style="margin:0">${esc(M.groupLabelPlural)} by colour and shape${sz?`; bubble size shows ${esc(MET[sz].label)}`:""}. Medians are universe-wide.</p>
      <ul class="hint-list"><li>Drag across the chart to select a group, then open it in the screener or compare it.</li><li>Click a point to pin it here; double-click to open the company.</li><li>Shift-drag to pan, Ctrl/⌘ + scroll to zoom, ⟲ to reset.</li><li>Click a legend item to isolate a ${esc(M.groupLabel.toLowerCase())}.</li><li>Arrow keys move between companies when the chart has focus.</li></ul>`; }
  el.querySelectorAll("[data-unpin]").forEach(b=>b.onclick=()=>ovSet({pin:""}));
  el.querySelectorAll("[data-cmp]").forEach(b=>b.onclick=()=>addCompare(b.dataset.cmp));
  el.querySelectorAll("[data-pinid]").forEach(a=>a.onclick=e=>{ e.preventDefault(); ovSet({pin:a.dataset.pinid}); });
  el.querySelectorAll("[data-clear]").forEach(b=>b.onclick=()=>ovSet({sel:[]}));
  el.querySelectorAll("[data-zsel]").forEach(b=>b.onclick=()=>OV.lab&&OV.lab.zoomToIds(st.sel));
}
function ovTreemap(st){
  const host=document.getElementById("tm"); if(!host) return;
  const sizes=(M.treemap&&M.treemap.size)||[], size=sizes.includes(st.tm)?st.tm:sizes[0], tc=st.tc&&MET[st.tc]?st.tc:"";
  const fs=filtersActive(st), match=fs?new Set(filtered(st).map(c=>c.id)):null;
  const key=[size,tc,fs?[...match].join(","):"",host.clientWidth].join("|"); if(key===OV.tmKey) return; OV.tmKey=key;
  const ts=document.getElementById("tmSel"); if(ts) ts.value=size; const cs=document.getElementById("tcSel"); if(cs) cs.value=tc||"group";
  const groups=M.groups.map(g=>{ const kids=M.companies.filter(c=>c.prim===g.key&&c.m[size]>0).map(c=>{ let fill=`color-mix(in srgb, ${g.color} 30%, var(--surface))`, dark=false;
      if(tc){ const p=MET[tc].better?c.pctGood[tc]:c.pct[tc]; if(p==null){ fill="var(--n-100)"; } else { const f=MET[tc].better?C.divFill((p-50)/50):C.seqFill(p/100); fill=f.fill; dark=f.dark; } }
      return {id:c.id,label:shortName(c.name),value:c.m[size],fill,dark,sub:fmtPlain(size,c.m[size]),dim:!!match&&!match.has(c.id),c}; });
    const tot=kids.reduce((a,b)=>a+b.value,0); return {key:g.key,label:g.short,color:g.color,value:tot,children:kids,sub:`${fmtPlain(size,tot)} · ${kids.length}`}; }).filter(g=>g.value>0);
  const grand=groups.reduce((a,g)=>a+g.value,0), top=groups.slice().sort((a,b)=>b.value-a.value)[0];
  const T=document.getElementById("tmT"); if(T) T.textContent=top?`${top.label} holds ${Math.round(top.value/grand*100)}% of combined ${MET[size].label}`:"Universe map";
  const S=document.getElementById("tmS"); if(S) S.textContent=`Universe map · tile size = ${MET[size].label} (${unitOf(size)})${tc?` · colour = ${MET[tc].label} percentile${MET[tc].better?" (blue = better)":""}`:` · colour = ${M.groupLabel.toLowerCase()}`} · click a tile to open, a header to filter`;
  C.treemap(host,{groups, aria:`Treemap of ${MET[size].label} by ${M.groupLabel.toLowerCase()}`,
    tipLeaf:(k,g)=>{ const c=k.c; return `<span class="tip-h">${esc(c.name)}</span><span class="tip-sub">${esc(G[c.prim]?.label||"")}</span><div class="tip-g"><span>${esc(MET[size].label)}</span><span>${esc(fmtPlain(size,c.m[size]))}</span><span>Share of ${esc(g.label)}</span><span>${(c.m[size]/g.value*100).toFixed(1)}%</span>${tc?`<span>${esc(MET[tc].label)}</span><span>${esc(c.nm&&c.nm[tc]?"n.m.":fmtPlain(tc,c.m[tc]))}</span><span>Percentile</span><span>${c.pct[tc]==null?"n/a":ord(Math.round(MET[tc].better?c.pctGood[tc]:c.pct[tc]))}</span>`:""}</div><div class="tip-foot">Click to open the company</div>`; },
    tipGroup:g=>`<span class="tip-h">${esc(G[g.key]?.label||g.label)}</span><div class="tip-g"><span>Companies</span><span>${g.children.length}</span><span>Combined ${esc(MET[size].short)}</span><span>${esc(fmtPlain(size,g.value))}</span><span>Share</span><span>${(g.value/grand*100).toFixed(1)}%</span></div><div class="tip-foot">Click to open in the screener</div>`,
    onLeaf:id=>go("company",id,filterOnly(route().st)), onGroup:k=>go("screener","",{g:[k]})});
  const L=document.getElementById("tmL"); if(L) L.innerHTML = tc ? (MET[tc].better?C.scaleLegend("div","Worse","Better"):C.scaleLegend("seq","Lower","Higher"))+`<span class="note">${esc(MET[tc].label)} percentile across the universe; grey = not available</span>` : `<span class="note">Each tile is a company sized by ${esc(MET[size].label)}; companies with zero or negative values are left out.</span>`;
}
function ovFunnel(){ const host=document.getElementById("fn"); if(!host) return;
  const stages=M.funnel.map(s=>({...s, ids:filtered(s.state).map(c=>c.id)})).map((s,i,a)=>({...s,n:s.ids.length,href:href("screener","",s.state),dropped:i?a[i-1].ids.filter(id=>!s.ids.includes(id)).map(id=>byId.get(id).name):[]}));
  C.funnel(host,{stages, aria:"Screening funnel", tip:(s,i)=>`<span class="tip-h">${esc(s.label)}</span><span class="tip-sub">${esc(s.desc)}</span><div class="tip-g"><span>Companies</span><span>${s.n}</span><span>Of universe</span><span>${Math.round(s.n/Math.max(1,stages[0].n)*100)}%</span></div>${s.dropped.length?`<div class="tip-foot">Dropped here (${s.dropped.length}): ${esc(s.dropped.slice(0,8).map(shortName).join(", "))}${s.dropped.length>8?` and ${s.dropped.length-8} more`:""}</div>`:""}`}); }
function ovGlance(st){ const host=document.getElementById("sg"); if(!host) return; const sl=M.companies.filter(c=>c.shortlisted).map(c=>({c,t:totalScore(c,{})})).sort((a,b)=>b.t-a.t);
  host.innerHTML = sl.length?`<div class="sg">${sl.slice(0,8).map((x,i)=>`<a class="sg-row" href="${href("company",x.c.id,filterOnly(st))}"><span class="r">#${i+1}</span><span class="n">${esc(shortName(x.c.name))} ${x.c.verdict?pill(x.c.verdict.label,x.c.verdict.tone):""}</span><span class="b"><i style="width:${x.t.toFixed(1)}%;animation-delay:${i*80}ms"></i></span><span class="s">${x.t.toFixed(0)}</span></a>`).join("")}</div>`
    : `<div class="empty-cta"><b>No shortlist yet.</b><span>Star companies in the screener, then publish the shortlist so the whole team sees it.</span><a class="btn sm" href="${href("screener","",{})}">Open screener</a></div>`; }
function ovChanges(){ const host=document.getElementById("chgCard"); if(!host) return; const ch=M.changes;
  const kindOf=x=>x.kind==="price"?"Price":x.kind==="flag"?"Flags":x.kind==="pr"?"Ownership":(x.kind==="added"||x.kind==="removed")?"Universe":x.kind==="failed"?"Refresh":x.kind==="short"?"Shortlist":"Figures";
  const kinds=ch?["all",...new Set(ch.map(kindOf))]:[]; const shown=ch?ch.filter(x=>OV.chg==="all"||kindOf(x)===OV.chg):[];
  host.innerHTML=`<div class="card-h"><div><h2>What changed since the last refresh</h2><div class="sub">${PREV?`Compared with ${esc(PREV.asof||M.prevLabel||"the previous snapshot")} · price moves beyond ±5%, flags, ownership, mandate, refresh status`:"Snapshot history builds up from the next refresh"}</div></div></div>
    ${ch&&ch.length?`<div class="chg-kinds" role="group" aria-label="Filter changes">${kinds.map(k=>`<button type="button" data-kind="${esc(k)}" aria-pressed="${OV.chg===k}">${k==="all"?"All":esc(k)} <span class="num">${k==="all"?ch.length:ch.filter(x=>kindOf(x)===k).length}</span></button>`).join("")}</div>`:""}
    ${ch==null?`<div class="empty">No previous snapshot to compare with yet.</div>`: ch.length?`<ul class="chg">${shown.slice(0,60).map((x,i)=>`<li style="animation-delay:${Math.min(i*25,500)}ms">${pill(x.kind==="failed"?"Failed":kindOf(x)==="Flags"&&/mandate/i.test(x.text)?"Mandate":kindOf(x)==="Flags"?"Flag":kindOf(x),x.tone==="info"?"info":x.tone)}<span class="what">${x.id?`<a href="${href("company",x.id,{})}">${esc(x.name)}</a>`:esc(x.name)}: ${esc(x.text)}${x.pct!=null?`<span class="mb" aria-hidden="true"><i class="${x.pct>0?"up":"down"}" style="width:${Math.min(50,Math.abs(x.pct)/15*50).toFixed(1)}%"></i></span>`:""}</span><span class="v">${esc(x.value||"")}</span></li>`).join("")}</ul>${shown.length>60?`<p class="caption">${shown.length-60} more not shown.</p>`:""}`:`<div class="empty">No changes since the last refresh.</div>`}`;
  host.querySelectorAll("[data-kind]").forEach(b=>b.onclick=()=>{ OV.chg=b.dataset.kind; ovChanges(); }); }

// ======================================================================================
// Screener
// ======================================================================================
const SCR={lab:null, hs:{}};
const ALLCOLS = ()=>Object.keys(MET).concat(Object.keys(TEXT));
function colsFor(st){ if(st.cols&&st.cols.length) return st.cols.filter(k=>MET[k]||TEXT[k]); const v=M.views.find(v=>v.key===st.v)||M.views[0]; return v.cols; }
function colDef(k){ return MET[k]||TEXT[k]; }
function headerTip(k){ const m=colDef(k); return [m.label||k, m.def?`Definition: ${m.def}`:"", m.formula&&m.formula!=="—"?`Formula: ${m.formula}`:"", m.source?`Source: ${m.source}`:"", `As of: ${m.asof||M.asof||"n/a"}`, (MET[k]&&MET[k].fmt!=="spark")?"Click to sort · Shift+click to add a sort key":""].filter(Boolean).join("\n"); }
function heatClass(k, v, stats){ if(v==null||!stats[k]) return ""; const {q1,q3}=stats[k], b=(MET[k]||{}).better; if(!b) return ""; const good=b==="high"?v>=q3:v<=q1, bad=b==="high"?v<=q1:v>=q3; return good?"heat-p1":bad?"heat-n1":""; }
PAGES.screener = (main, st, arg, same)=>{
  if(!same || !main.querySelector("#res")){
    main.innerHTML=`<section class="hero" style="padding:var(--s-5) var(--hero-pad)"><div class="hero-top"><div><span class="eyebrow">Screener · ${M.companies.length} companies · as of ${esc(M.asof||"n/a")}</span><h1 class="hero-h" style="font-size:var(--fs-display)">Find the names that fit</h1><p class="hero-sub">Every filter, sort, column and selection is saved in the link, so any view can be bookmarked or sent.</p></div>
      <div class="hero-acts"><button class="btn" type="button" id="chTog">${icon("chart")}${st.ch?"Hide chart":"Show chart"}</button></div></div><div id="chips"></div></section>
      <div class="scr-layout"><aside class="card" aria-label="Filters"><details class="fold" open><summary>Filters ${icon("down","style='width:var(--icon)'")}</summary><div class="fpanel" id="fp"></div></details></aside><section class="card flush" id="res"></section></div>`;
    paintFilters(main.querySelector("#fp"), st);
    main.querySelector("#chTog").onclick=()=>{ const s=route().st; go("screener","",withState(s,{ch:!s.ch}),true); };
  } else syncFilters(main.querySelector("#fp"), st);
  const tg=main.querySelector("#chTog"); if(tg) tg.innerHTML=`${icon("chart")}${st.ch?"Hide chart":"Show chart"}`;
  const ch=main.querySelector("#chips"); ch.innerHTML=chips(st); bindChips(ch, st, "screener", "");
  paintTable(main.querySelector("#res"), st);
};
function paintFilters(fp, st){
  const used=M.groups.filter(g=>g.n>0);
  fp.innerHTML=`
    <div class="fgrp"><span class="eyebrow">Quick screens</span><div class="pills">${M.presets.map(p=>`<button class="btn sm" type="button" data-preset="${p.key}" data-tip="${esc(p.desc)}">${esc(p.label)}</button>`).join("")}<button class="btn sm" type="button" data-preset="__reset">Reset</button></div></div>
    <div class="fgrp"><label class="eyebrow" for="fq">Search</label><input class="inp" id="fq" type="search" placeholder="Name, ticker or keyword"></div>
    <div class="fgrp"><span class="eyebrow">${esc(M.groupLabel)}</span><div class="pills" id="gch">${used.map(g=>`<button type="button" class="gchip" data-g="${g.key}" aria-pressed="false" title="${esc(g.label)}"><span class="dot" style="background:${g.color}"></span>${esc(g.short)} <span class="n">${g.n}</span></button>`).join("")}</div></div>
    <div class="fgrp"><span class="eyebrow">Conditions</span>${M.filters.toggles.map(t=>`<label class="chk"><input type="checkbox" data-t="${t.key}">${esc(t.label)}</label>`).join("")}</div>
    <div class="fgrp"><span class="eyebrow">Pipeline stage</span><div class="pills" id="stch">${PIPE.stages.map(s=>`<button type="button" class="gchip" data-stg="${s.key}" aria-pressed="false">${PUI?PUI.spill(s.key):esc(s.short)} <span class="n">${M.companies.filter(c=>PIPE.stageOf(c)===s.key).length}</span></button>`).join("")}</div></div>
    <div class="fgrp"><span class="eyebrow">Ranges · drag the handles</span>${M.filters.ranges.map(k=>`<div class="rngbox"><div id="hs-${k}"></div><div class="hs-exact"><input class="inp" type="number" step="any" data-r="${k}" data-side="0" placeholder="min" aria-label="${esc(MET[k].label)} minimum"><span>to</span><input class="inp" type="number" step="any" data-r="${k}" data-side="1" placeholder="max" aria-label="${esc(MET[k].label)} maximum"></div></div>`).join("")}</div>`;
  let deb;
  const setR=(k,val)=>{ const s=route().st, r={...s.r}; if(val[0]==null&&val[1]==null) delete r[k]; else r[k]=val; go("screener","",withState(s,{r}),true); };
  SCR.hs={}; M.filters.ranges.forEach(k=>{ SCR.hs[k]=new C.HistSlider(fp.querySelector("#hs-"+k),{label:`${MET[k].label}${unitOf(k)?` (${unitOf(k)})`:""}`, values:M.companies.map(c=>c.nm&&c.nm[k]?null:c.m[k]), fmt:v=>tick(k,v), sel:st.r[k]||[null,null], onChange:val=>setR(k,val)}); });
  fp.querySelector("#fq").addEventListener("input",e=>{ clearTimeout(deb); const v=e.target.value; deb=setTimeout(()=>go("screener","",withState(route().st,{q:v}),true),180); });
  fp.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ const s=route().st, k=b.dataset.g; go("screener","",withState(s,{g:s.g.includes(k)?s.g.filter(x=>x!==k):s.g.concat(k)})); });
  fp.querySelectorAll("[data-t]").forEach(i=>i.onchange=()=>{ const s=route().st, k=i.dataset.t; go("screener","",withState(s,{t:i.checked?s.t.concat(k):s.t.filter(x=>x!==k)})); });
  fp.querySelectorAll("[data-stg]").forEach(b=>b.onclick=()=>{ const s=route().st, k=b.dataset.stg; go("screener","",withState(s,{stg:s.stg.includes(k)?s.stg.filter(x=>x!==k):s.stg.concat(k)})); });
  fp.querySelectorAll("[data-r]").forEach(i=>i.addEventListener("input",()=>{ clearTimeout(deb); deb=setTimeout(()=>{ const s=route().st, k=i.dataset.r; const cur=(s.r[k]||[null,null]).slice(); cur[+i.dataset.side]=i.value===""?null:+i.value; setR(k,cur); },250); }));
  fp.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{ const s=route().st; const p=M.presets.find(x=>x.key===b.dataset.preset); go("screener","",withState(s,{q:"",g:[],t:[],r:{},sel:[],stg:[],...(p?{t:p.state.t||[],r:p.state.r||{},s:p.state.s||s.s}:{})})); });
  syncFilters(fp, st);
}
function syncFilters(fp, st){
  const fq=fp.querySelector("#fq"); if(document.activeElement!==fq) fq.value=st.q||"";
  fp.querySelectorAll("[data-g]").forEach(b=>b.setAttribute("aria-pressed",st.g.includes(b.dataset.g)));
  fp.querySelectorAll("[data-t]").forEach(i=>i.checked=st.t.includes(i.dataset.t));
  fp.querySelectorAll("[data-stg]").forEach(b=>b.setAttribute("aria-pressed",(st.stg||[]).includes(b.dataset.stg)));
  fp.querySelectorAll("[data-r]").forEach(i=>{ if(document.activeElement===i) return; const v=(st.r[i.dataset.r]||[])[+i.dataset.side]; i.value=v==null?"":v; });
  Object.entries(SCR.hs).forEach(([k,h])=>{ if(!h.host.contains(document.activeElement)) h.set(st.r[k]||[null,null]); });
}
function tableStats(cs, cols){ const s={}; cols.forEach(k=>{ if(!MET[k]||!MET[k].better) return; const v=cs.map(c=>c.nm&&c.nm[k]?null:c.m[k]).filter(x=>x!=null&&isFinite(x)).sort((a,b)=>a-b); if(v.length>4) s[k]={q1:C.quantile(v,.25),q3:C.quantile(v,.75)}; }); return s; }
function barStyle(k, v, mx){ if(v==null||!isFinite(v)||!mx) return ""; const w=Math.min(100,Math.abs(v)/mx*100).toFixed(1); return ` style="background-image:linear-gradient(90deg, var(${v<0?"--bar-neg":"--bar-pos"}) ${w}%, transparent ${w}%)"`; }
function paintTable(res, st){
  const cols=colsFor(st), rows=sorted(filtered(st), st), keys=sortKeys(st), stats=st.heat?tableStats(rows,cols):{};
  const barMax={}; if(st.bars) cols.forEach(k=>{ if(MET[k]&&["cr","x","pct","chg","pp"].includes(MET[k].fmt)){ const v=rows.map(c=>c.nm&&c.nm[k]?null:c.m[k]).filter(x=>x!=null&&isFinite(x)).map(Math.abs).sort((a,b)=>a-b); barMax[k]=v.length?C.quantile(v,.95):0; } });
  const grpOf=k=>(MET[k]||TEXT[k]).group||"";
  const spans=[]; cols.forEach(k=>{ const g=grpOf(k); if(spans.length&&spans[spans.length-1].g===g) spans[spans.length-1].n++; else spans.push({g,n:1}); });
  const starts=new Set(); let i=0; spans.forEach(s=>{ starts.add(cols[i]); i+=s.n; });
  const sortInd=k=>{ const ix=keys.findIndex(x=>x.k===k); if(ix<0) return ""; return `<span class="sortk">${keys[ix].dir>0?"▲":"▼"}${keys.length>1?ix+1:""}</span>`; };
  const ariaSort=k=>{ const x=keys.find(x=>x.k===k); return x?` aria-sort="${x.dir>0?"ascending":"descending"}"`:""; };
  const pend=pendingChanges().length;
  const pb=M.views.map(v=>`<option value="${v.key}" ${(!st.cols.length&&(st.v||M.views[0].key)===v.key)?"selected":""}>${esc(v.label)}</option>`).join("")+(st.cols.length?`<option selected value="__custom">Custom columns</option>`:"")+savedViews().map(v=>`<option value="saved:${esc(v.name)}">★ ${esc(v.name)}</option>`).join("");
  const {ax,ay}=labAxes(st);
  res.innerHTML=`
    <div class="tbar"><b class="num">${rows.length}</b><span class="muted">of ${M.companies.length} companies</span><span class="grow"></span>
      <label class="sr" for="vsel">View</label><select id="vsel" aria-label="Column view">${pb}</select>
      <button class="btn sm" type="button" id="colBtn" aria-haspopup="true">${icon("cols")}Columns</button>
      <label class="chk"><input type="checkbox" id="heat" ${st.heat?"checked":""}>Heat</label><label class="chk"><input type="checkbox" id="bars" ${st.bars?"checked":""}>Data bars</label>
      <button class="btn sm" type="button" id="csvBtn">${icon("down")}CSV</button><button class="btn sm" type="button" id="xlsxBtn">${icon("down")}XLSX</button>
      <button class="btn sm" type="button" id="linkBtn">${icon("link")}Copy link</button></div>
    ${pend?`<div class="tbar" style="background:var(--warning-bg)"><span>${pend} shortlist change${pend>1?"s":""} staged in this browser.</span><span class="grow"></span><a class="btn sm" href="${href("shortlist","",st)}">Review and publish</a></div>`:""}
    ${st.ch?`<div class="chartpanel"><div class="card-h"><div><h2>Filtered companies on the map</h2><div class="sub">${esc(MET[ax].label)} (${esc(unitOf(ax))}) vs ${esc(MET[ay].label)} (${esc(unitOf(ay))}) · drag to select rows · hover a row to find it</div></div>
      <div class="tools"><label class="lbl" for="sax">X</label><select id="sax">${M.scatter.axes.map(a=>`<option value="${a}" ${a===ax?"selected":""}>${esc(MET[a].label)}</option>`).join("")}</select><label class="lbl" for="say">Y</label><select id="say">${M.scatter.axes.map(a=>`<option value="${a}" ${a===ay?"selected":""}>${esc(MET[a].label)}</option>`).join("")}</select></div></div><div id="scrLab"></div></div>`:""}
    <div class="tscroll"><table class="grid-t" aria-rowcount="${rows.length}">
      <thead><tr class="grp"><th class="stk l" rowspan="1"></th>${spans.map(s=>`<th colspan="${s.n}" class="gstart">${esc(s.g)}</th>`).join("")}</tr>
      <tr class="cols"><th class="stk l sortable" data-k="name"${ariaSort("name")} tabindex="0" data-tip="Company name, ticker, ${esc(M.groupLabel.toLowerCase())} and flags. Click to sort.">Company ${sortInd("name")}</th>${cols.map(k=>{ const m=colDef(k), sortable=MET[k]?MET[k].fmt!=="spark":(k==="ev"||k==="stage");
        return `<th class="${TEXT[k]?"l":""} ${starts.has(k)?"gstart":""} ${sortable?"sortable":""}" data-k="${k}"${ariaSort(k)} ${sortable?'tabindex="0"':""} data-tip="${esc(headerTip(k))}">${esc(m.short||m.label)}${MET[k]&&unitOf(k)&&MET[k].fmt!=="spark"?` <span class="subtle">${esc(unitOf(k))}</span>`:""}${sortInd(k)}</th>`; }).join("")}</tr></thead>
      <tbody>${rows.length?rows.map(c=>`<tr data-id="${c.id}" class="${c.fit?"mandate-edge":""}">
        <td class="stk l first"><span style="display:flex;gap:var(--s-2);align-items:flex-start"><button class="iconbtn" style="height:var(--s-6);min-width:var(--s-6);padding:var(--s-0);color:${isStarred(c)?"var(--warning)":"var(--n-300)"}" data-star="${c.id}" aria-pressed="${isStarred(c)}" aria-label="${isStarred(c)?"Remove from":"Add to"} shortlist: ${esc(c.name)}">${icon("shortlist",isStarred(c)?'fill="currentColor"':"")}</button><span><a class="cname" href="${href("company",c.id,filterOnly(st))}">${esc(c.name)}</a>
          <span class="cmeta">${c.ticker?`<span>${esc(c.exchange)}: ${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}${flagPills(c)}<span class="rowacts"><button class="iconbtn miniicon" type="button" data-cmp="${esc(c.id)}" aria-label="Add ${esc(c.name)} to compare" data-tip="Add to compare">${icon("plus")}</button></span></span></span></span></td>
        ${cols.map(k=>{ if(k==="desc") return `<td class="desc ${starts.has(k)?"gstart":""}">${esc(c.desc)}</td>`; if(k==="stage") return `<td class="l ${starts.has(k)?"gstart":""}">${PUI?PUI.stagePill(c):""}</td>`; if(k==="ev") return `<td class="${starts.has(k)?"gstart":""}">${c.ev?pill("Yes","pos"):pill("No","neu")}</td>`;
          const v=c.nm&&c.nm[k]?null:c.m[k]; return `<td class="${starts.has(k)?"gstart":""} ${st.heat?heatClass(k,v,stats):""}"${st.bars&&barMax[k]?barStyle(k,v,barMax[k]):""}>${fmt(k,c.m[k],c)}</td>`; }).join("")}</tr>`).join("")
        : `<tr><td class="l" colspan="${cols.length+1}"><div class="empty">No companies match these filters. Remove a chip above or press Reset.</div></td></tr>`}</tbody></table></div>`;
  // chart panel (linked)
  SCR.lab=null;
  if(st.ch){ const host=res.querySelector("#scrLab");
    SCR.lab=new C.Lab(host, labOpts(st,"screener",{ onSelect:ids=>{ go("screener","",withState(route().st,{sel:ids}),true); }, onZoom:z=>{ const s=withState(route().st,{z:z||null}); history.replaceState(null,"",href("screener","",s)); SCR.lab.update({zoom:z||null}); },
      onPin:id=>{ const tr=res.querySelector(`tr[data-id="${CSS.escape(id||"")}"]`); if(tr){ tr.scrollIntoView({block:"center",behavior:RM()?"auto":"smooth"}); tr.classList.add("ext"); setTimeout(()=>tr.classList.remove("ext"),1600); } },
      onOpen:id=>go("company",id,filterOnly(route().st)), onHover:id=>{ res.querySelectorAll("tr.ext").forEach(r=>r.classList.remove("ext")); if(id){ const tr=res.querySelector(`tr[data-id="${CSS.escape(id)}"]`); if(tr) tr.classList.add("ext"); } } }));
    res.querySelector("#sax").onchange=e=>go("screener","",withState(route().st,{ax:e.target.value,z:null}),true);
    res.querySelector("#say").onchange=e=>go("screener","",withState(route().st,{ay:e.target.value,z:null}),true); }
  // events
  res.querySelector("#vsel").onchange=e=>{ const v=e.target.value; if(v.startsWith("saved:")){ const sv=savedViews().find(x=>"saved:"+x.name===v); if(sv) go("screener","",withState(st,{cols:sv.cols,v:""})); } else if(v!=="__custom") go("screener","",withState(st,{v,cols:[]})); };
  res.querySelector("#heat").onchange=e=>go("screener","",withState(st,{heat:e.target.checked}));
  res.querySelector("#bars").onchange=e=>go("screener","",withState(st,{bars:e.target.checked}));
  res.querySelector("#colBtn").onclick=e=>colChooser(e.currentTarget, st);
  res.querySelector("#csvBtn").onclick=()=>exportView(st,"csv");
  res.querySelector("#xlsxBtn").onclick=()=>exportView(st,"xlsx");
  res.querySelector("#linkBtn").onclick=()=>{ navigator.clipboard?.writeText(location.href).then(()=>toast("Link to this view copied.")).catch(()=>toast("Copy blocked; use the address bar.")); };
  res.querySelectorAll("th.sortable").forEach(th=>{ const k=th.dataset.k; const act=e=>{ let s=sortKeys(st).map(x=>(x.dir<0?"-":"")+x.k); const cur=s.find(x=>x.replace("-","")===k);
      const nextDir = cur? (cur.startsWith("-")?"":"-") : (k==="name"||TEXT[k]?"":"-");
      if(e.shiftKey){ s = cur? s.map(x=>x===cur?nextDir+k:x) : s.concat(nextDir+k); } else s=[nextDir+k];
      C.flip(res, "tbody tr[data-id]", "data-id", ()=>go("screener","",withState(st,{s}))); };
    th.addEventListener("click",act); th.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); act(e); } }); });
  res.querySelectorAll("tbody tr[data-id]").forEach(tr=>{ tr.addEventListener("click",e=>{ if(e.target.closest("a,button")) return; go("company",tr.dataset.id,filterOnly(st)); });
    tr.addEventListener("mouseenter",()=>SCR.lab&&SCR.lab.highlight(tr.dataset.id)); tr.addEventListener("mouseleave",()=>SCR.lab&&SCR.lab.highlight(null)); });
  res.querySelectorAll("[data-star]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const c=byId.get(b.dataset.star); const d=draft(); d[c.name]=!isStarred(c); if(d[c.name]===c.shortlisted) delete d[c.name]; setDraft(d); paintTable(res, route().st); toast(`${isStarred(c)?"Staged: add":"Staged: remove"} ${c.name}. Publish from the Shortlist page.`); });
  res.querySelectorAll("[data-cmp]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); addCompare(b.dataset.cmp); });
}
function savedViews(){ try{ return JSON.parse(localStorage.getItem("gpc-views-"+M.key)||"[]"); }catch(e){ return []; } }
let openPop=null; function closePops(){ if(openPop){ openPop.remove(); openPop=null; } }
function colChooser(btn, st){
  closePops(); const cur=new Set(colsFor(st)); const groups={};
  ALLCOLS().forEach(k=>{ const g=(colDef(k).group)||"Other"; (groups[g]=groups[g]||[]).push(k); });
  const p=document.createElement("div"); p.className="pop"; p.setAttribute("role","dialog"); p.setAttribute("aria-label","Choose columns");
  p.innerHTML=Object.entries(groups).map(([g,ks])=>`<h4>${esc(g)}</h4>${ks.map(k=>`<label class="chk"><input type="checkbox" value="${k}" ${cur.has(k)?"checked":""}>${esc(colDef(k).label)}</label>`).join("")}`).join("")+
    `<div class="pills" style="margin-top:var(--s-3)"><button class="btn sm primary" type="button" data-apply>Apply</button><button class="btn sm" type="button" data-save>Save as view…</button><button class="btn sm" type="button" data-close>Close</button></div>`;
  document.body.appendChild(p); const r=btn.getBoundingClientRect(); p.style.top=(scrollY+r.bottom+6)+"px"; p.style.left=Math.max(8,Math.min(innerWidth-p.offsetWidth-8, r.left))+"px"; openPop=p; p.querySelector("input")?.focus();
  const chosen=()=>ALLCOLS().filter(k=>p.querySelector(`input[value="${k}"]`).checked);
  p.querySelector("[data-apply]").onclick=()=>{ closePops(); go("screener","",withState(st,{cols:chosen(),v:""})); };
  p.querySelector("[data-save]").onclick=()=>{ const name=prompt("Name this view"); if(!name) return; const v=savedViews().filter(x=>x.name!==name).concat({name,cols:chosen()}); try{ localStorage.setItem("gpc-views-"+M.key,JSON.stringify(v)); }catch(e){} closePops(); go("screener","",withState(st,{cols:chosen(),v:""})); toast(`Saved view “${name}” in this browser. The link also carries the columns.`); };
  p.querySelector("[data-close]").onclick=closePops;
  setTimeout(()=>document.addEventListener("click",function h(e){ if(openPop&&!openPop.contains(e.target)&&e.target!==btn){ closePops(); document.removeEventListener("click",h); } }),0);
}
function exportRows(st){
  const cols=colsFor(st).filter(k=>!MET[k]||MET[k].fmt!=="spark"), rows=sorted(filtered(st),st);
  const head=["Company","Ticker",M.groupLabel].concat(cols.map(k=>{ const m=colDef(k); return m.label+(MET[k]&&unitOf(k)?` (${unitOf(k).replace("₹","INR")})`:""); })).concat(["Flags","Shortlisted"]);
  const body=rows.map(c=>[c.name,c.code||c.ticker,c.groups.map(g=>G[g.key]?.label).join("; ")].concat(cols.map(k=>k==="desc"?c.desc:k==="stage"?PIPE.stages[PIPE.stageIndex(c)].label:k==="ev"?(c.ev?"Yes":"No"):(c.nm&&c.nm[k])?"n.m.":(c.m[k]==null?"":+c.m[k].toFixed(4)))).concat([c.flags.map(f=>f.label).join("; "), c.shortlisted?"Yes":""]));
  return [head].concat(body);
}
function download(blob, name){ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
function exportView(st, kind){
  const rows=exportRows(st), stamp=new Date().toISOString().slice(0,10), base=`${M.key}-screener-${stamp}`;
  if(kind==="csv"){ const csv=rows.map(r=>r.map(v=>{ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }).join(",")).join("\r\n"); download(new Blob(["﻿"+csv],{type:"text/csv"}),base+".csv"); }
  else download(window.XLSX_LITE.build(rows,"Screener"), base+".xlsx");
  toast(`Exported ${rows.length-1} rows.`);
}

// ======================================================================================
// Company
// ======================================================================================
const safeHtml = s=>esc(s).replace(/&lt;(\/?)b&gt;/g,"<$1b>");
function topPart(r){ const p=r.parts.slice().sort((a,b)=>b.value-a.value)[0]; return `${p.label} is ${Math.round(p.value/r.total*100)}% of income`; }
function segMedian(c,k){ const s=M.gstats[c.prim]&&M.gstats[c.prim][k]; return s&&s.n?s.med:null; }
function kpiValue(c,k){ return k==="nd"&&c.m.nd!=null&&c.m.nd<=0?`<span class="pos">${nf(-c.m.nd,1)}</span><small> ₹ cr net cash</small>`:fmt(k,c.m[k],c)+(MET[k].fmt==="cr"?"<small> ₹ cr</small>":""); }
function kpiCtx(c,k){
  if(k==="roe"){ if(c.m.roe26==null) return "FY26 ROE not available"; const d=c.m.roe-c.m.roe26; return `vs FY26 ROE ${nf(c.m.roe26,1)}%: ${Math.abs(d)<0.05?"flat":(d>0?"up ":"down ")+nf(d,1)+" pp"}`; }
  if(k==="roe26"&&c.m.roe26==null) return "not reported for FY26";
  if(k==="nd") return c.m.nd==null?"cash not recorded":c.m.nd<=0?"cash exceeds borrowings":"borrowings exceed cash";
  const med=segMedian(c,k), g=G[c.prim], r=c.grank[k]; return med==null?"":`${g?g.short:"peer"} median ${fmtPlain(k,med)}${r&&MET[k].better?` · #${r.rank} of ${r.of}`:""}`; }
function diligenceUrl(c){ // issue title carries no company name (public repo)
  const ref=(c.id.length*7919+[...c.id].reduce((a,ch)=>a+ch.charCodeAt(0),0)).toString(16);
  return `https://github.com/${M.repo}/issues/new?labels=diligence&title=${encodeURIComponent("Diligence request "+ref)}&body=${encodeURIComponent(`Company: ${c.name} (${c.code})\n\nRun shortlist diligence and add it to diligence.js, following .github/diligence-prompt.md.`)}`; }
function radarSeries(c, extra){ const s=[{key:c.id,label:shortName(c.name),color:"var(--viz-1)",values:c.sc,fill:true,shape:"diamond"}];
  if(extra!==false){ if(M.scoreMed.shortlist&&!c.shortlisted) s.push({key:"sl",label:"Shortlist median",color:"var(--viz-2)",values:M.scoreMed.shortlist,dash:true,shape:"square"});
    s.push({key:"uni",label:"Universe median",color:"var(--viz-7)",values:M.scoreMed.universe,dash:true,shape:"circle"}); } return s; }
const radarAxes = ()=>CRIT.map(k=>({key:k.key,label:k.label,explain:k.explain}));
function legendIsolate(host, svgs, items){ let iso=null; C.legend(host, items, k=>{ iso=iso===k?null:k; svgs().forEach(s=>C.isolate(s,iso)); host.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",!iso||b.dataset.k===iso)); }, null); }
PAGES.company = (main, st, id)=>{
  const c=byId.get(id);
  if(!c){ main.innerHTML=`<div class="empty">No company with id “${esc(id)}”. <a href="${href("screener","",st)}">Back to the screener</a></div>`; return; }
  const list=sorted(filtered(st),st), i=list.findIndex(x=>x.id===c.id), prev=i>0?list[i-1]:null, nxt=i>=0&&i<list.length-1?list[i+1]:null;
  const cfg=M.company, mx=M.scatter.x, my=M.scatter.y, total=totalScore(c,{}), rank=M.companies.map(x=>totalScore(x,{})).filter(v=>v>total).length+1;
  main.innerHTML=`
  <section class="hero co-hero" aria-label="${esc(c.name)} summary">
    <div class="co-grid"><div>
      <span class="eyebrow"><a href="${href("screener","",st)}">Screener</a> / Company${i>=0?` · ${i+1} of ${list.length} in the current filter`:" · outside the current filter"}</span>
      <h1 class="hero-h">${esc(c.name)}</h1>
      <div class="pills" style="margin-top:var(--s-2)">${c.ticker?`<span class="num caption" style="color:var(--on-dark-muted)">${esc(c.exchange)}: ${esc(c.ticker)}</span>`:`<span class="caption" style="color:var(--on-dark-muted)">${esc(c.exchange)}</span>`}${c.groups.map(g=>gpill(g.key)+(g.pct!=null?` <span class="num caption" style="color:var(--on-dark-subtle)">${g.pct}%</span>`:"")).join("")}
        ${c.verdict?pill(c.verdict.label,c.verdict.tone,"Verdict from shortlist diligence"):""}${M.mandate?(c.fit?pill("Mandate fit","info",M.mandate.desc):pill("Outside mandate","neu",M.mandate.desc)):""}${c.shortlisted?pill("Shortlisted","brand"):""}${CRIT.length?pill(`Score ${total.toFixed(0)} · #${rank} of ${M.companies.length}`,"outline","Weighted score on default weights, ranked across the universe"):""}${PUI?PUI.heroPills(c):""}</div>
      <p class="hero-sub" style="margin-top:var(--s-2)">Last refreshed ${esc(M.asof||"n/a")}${c.updated?` · diligence ${esc(c.updated)}`:""}</p>
      <div class="hero-acts" style="margin-top:var(--s-3)">${prev?`<a class="btn" data-prev href="${href("company",prev.id,st)}" aria-label="Previous company: ${esc(prev.name)}">${icon("prev")}Previous</a>`:""}${nxt?`<a class="btn" data-next href="${href("company",nxt.id,st)}" aria-label="Next company: ${esc(nxt.name)}">Next${icon("next")}</a>`:""}
        <button class="btn" type="button" data-cmp="${esc(c.id)}">${icon("plus")}Compare</button><a class="btn" href="${href("overview","",withState(filterOnly(st),{pin:c.id}))}">${icon("target")}Show on map</a></div></div>
      <div class="co-mini" style="position:relative"><span class="cap">Rank map · ${esc(MET[mx].short)} × ${esc(MET[my].short)} percentiles · ★ = ${esc(G[c.prim]?.short||"peers")}</span><div id="coMini" style="height:100%"></div></div></div>
    <section class="kpis" aria-label="Key figures">${cfg.kpis.map(k=>`<div class="kpi"><span class="eyebrow">${esc(MET[k].label)}</span><span class="kpi-v">${kpiValue(c,k)}</span><span class="ctx">${esc(kpiCtx(c,k))}</span></div>`).join("")}</section>
  </section>
  ${c.desc?`<p class="prose" style="margin:var(--s-0) var(--s-0) var(--s-4)">${esc(c.desc)}</p>`:""}
  <div class="grid g2" id="cg"></div>`;
  main.querySelector("[data-cmp]").onclick=()=>addCompare(c.id);
  const mini=main.querySelector("#coMini"); C.constellation(mini,{mini:true,height:Math.max(160,mini.clientHeight||200),pad:18,xLabel:MET[mx].short,yLabel:MET[my].short,aria:`${c.name} against the universe on ${MET[mx].label} and ${MET[my].label} percentiles`,
    points:M.companies.map(x=>({id:x.id,x:x.pct[mx],y:x.pct[my],star:x.prim===c.prim&&x.id!==c.id,self:x.id===c.id,tip:`<b>${esc(x.name)}</b><br>${esc(MET[mx].short)} ${esc(fmtPlain(mx,x.m[mx]))} · ${esc(MET[my].short)} ${esc(fmtPlain(my,x.m[my]))}`}))});
  mini.querySelectorAll("circle[data-id]").forEach(n=>n.addEventListener("click",()=>go("company",n.dataset.id,filterOnly(st))));
  const cg=main.querySelector("#cg"); const card=(id,t,sub,body="",cls="")=>{ cg.insertAdjacentHTML("beforeend",`<section class="card ${cls}" id="${id}"><div class="card-h"><div><h2>${t}</h2><div class="sub">${sub}</div></div></div>${body}</section>`); return cg.lastElementChild; };
  if(PUI){ const el=card("pipe","Deal pipeline","Stage, owner, next step and activity · team data kept outside the published dashboard",`<div class="pp"></div>`); PUI.companyPanel(el.querySelector(".pp"), c); }
  if(cfg.fin && c.fin){
    const pat=c.fin.pat, lastG=c.nm.pg?null:c.m.pg;
    const t = lastG!=null? `FY26 PAT ${lastG>=0?"up":"down"} ${Math.abs(lastG).toFixed(0)}% on FY25` : pat[2]!=null?`FY26 PAT ₹${nf(pat[2],1)} cr (growth n.m.)`:"Revenue and PAT";
    const el=card("fin",esc(t),"Revenue and PAT, ₹ cr, FY24–FY26 · PAT margin % in the band above · hover a bar for the year",`<div class="cv"></div><div class="legend"></div>`);
    const margins=c.fin.cats.map((x,j)=>c.fin.rev[j]?c.fin.pat[j]/c.fin.rev[j]*100:null);
    C.combo(el.querySelector(".cv"),{cats:c.fin.cats, fmt:v=>(v<0?MINUS:"")+nf(v,1),
      bars:[{key:"rev",label:"Revenue",values:c.fin.rev,color:"var(--viz-1)"},{key:"pat",label:"PAT",values:c.fin.pat,color:"var(--viz-3)"}],
      tip:(b,j,v)=>`${c.fin.cats[j]} ${b.label} ₹${nf(v,1)} cr${j>0&&b.values[j-1]>0?`, ${v>=b.values[j-1]?"+":MINUS}${Math.abs((v-b.values[j-1])/b.values[j-1]*100).toFixed(0)}% vs ${c.fin.cats[j-1]}`:""}.`,
      line:{values:margins,color:"var(--viz-2)",shape:"diamond",short:"PAT margin",fmt:v=>v==null?"":`${v.toFixed(1)}%`,tick:v=>v+"%",axis:"PAT margin %",tipFn:(j,v)=>`${c.fin.cats[j]} PAT margin ${v.toFixed(1)}%.`},
      yLabel:"₹ cr", yTick:v=>v.toLocaleString("en-IN"), aria:"Revenue and PAT bars with PAT margin line"});
    C.legend(el.querySelector(".legend"),[{key:"rev",label:"Revenue",color:"var(--viz-1)",shape:"square"},{key:"pat",label:"PAT",color:"var(--viz-3)",shape:"square"},{key:"m",label:"PAT margin",color:"var(--viz-2)",shape:"diamond"}],null);
  }
  if(cfg.pnl){
    const sm=segMedian(c,"em");
    const el=card("pnl",esc(c.m.em!=null?`EBITDA margin ${c.m.em.toFixed(1)}% vs ${M.groupLabel.toLowerCase()} median ${sm==null?"n/a":sm.toFixed(1)+"%"}`:"FY25 P&L"),"Revenue, EBITDA and net profit, ₹ cr, FY25",`<div class="cv"></div>`);
    C.columns(el.querySelector(".cv"),{items:[{label:"Revenue",value:c.m.r},{label:"EBITDA",value:c.m.e},{label:"Net profit",value:c.m.p}],fmt:v=>(v<0?MINUS:"")+nf(v,1),yLabel:"₹ cr",
      tip:(it,v)=>`FY25 ${it.label.toLowerCase()} ₹${nf(v,1)} cr${it.label!=="Revenue"&&c.m.r?`, ${(v/c.m.r*100).toFixed(1)}% of revenue`:""}.`, aria:"FY25 revenue, EBITDA and net profit"});
  }
  if(CRIT.length){
    const above=CRIT.filter(k=>(c.sc[k.key]||0)>(M.scoreMed.universe[k.key]||0)).length;
    const el=card("radar",esc(`Above the universe median on ${above} of ${CRIT.length} criteria`),"Percentile score 0–100 per criterion, scored across the universe · hover an axis for detail",`<div class="rv"></div><div class="legend"></div><div class="badges">${CRIT.map(k=>`<span class="badge" data-tip="${esc(k.explain)}">${esc(k.label)} <b>${Math.round((c.sc[k.key]||0)*100)}</b></span>`).join("")}</div>`);
    const ser=radarSeries(c); C.radar(el.querySelector(".rv"),{axes:radarAxes(),series:ser,aria:`Score radar for ${c.name}`});
    legendIsolate(el.querySelector(".legend"),()=>[el.querySelector(".radar")],ser.map(s=>({key:s.key,label:s.label,color:s.color,shape:s.shape})));
  }
  const swk=[...new Set([...(cfg.peers||[]), M.scatter.x])].filter(k=>MET[k]);
  if(swk.length){
    const g=G[c.prim], k0=swk[0], r0=c.grank[k0];
    const el=card("swarm",esc(r0&&c.m[k0]!=null?`${MET[k0].label}: #${r0.rank} of ${r0.of} in ${g?g.short:"peers"}`:`Against ${g?g.short:"peers"}`),`Universe distribution per metric (${esc(swk.map(k=>`${MET[k].short} ${unitOf(k)}`).join(", "))}) · ◆ ${esc(shortName(c.name))} · coloured = ${esc(g?g.short:"")} peers · dashed = universe median, solid = ${esc(g?g.short:"")} median · click a dot to open`,`<div class="sv"></div>`);
    C.swarm(el.querySelector(".sv"),{aria:`${c.name} against the universe`, onOpen:id=>go("company",id,filterOnly(st)),
      rows:swk.map(k=>{ const r=c.grank[k], p=MET[k].better?c.pctGood[k]:c.pct[k], v=c.nm&&c.nm[k]?null:c.m[k];
        return {key:k,label:`${MET[k].label} (${unitOf(k)})`,note:v==null?"not available":`${fmtPlain(k,v)} · ${p==null?"":ord(Math.round(p))+" pct"}${r&&MET[k].better?` · #${r.rank} of ${r.of}`:""}`,
          items:M.companies.map(x=>({id:x.id,v:x.nm&&x.nm[k]?null:x.m[k],name:x.name,kind:x.id===c.id?"self":x.prim===c.prim?"peer":"other"})),
          med:(M.stats[k]||{}).med, gmed:segMedian(c,k), gcolor:g?g.color:null, tick:v=>tick(k,v), tipFn:it=>`<b>${esc(it.name)}</b><br>${esc(MET[k].label)}: ${esc(fmtPlain(k,it.v))}${it.kind==="peer"?`<br><span class="tip-sub">${esc(g.short)} peer</span>`:""}`}; })});
  }
  if(cfg.control && c.m.mc!=null){
    const oo=cfg.control.openOffer, pr=c.m.pr, mc=c.m.mc, pct=pr==null?null:Math.min(100,pr+oo), base=pct==null?null:mc*pct/100;
    const el=card("ctrl",esc(base==null?"Cost to control":`Control from ${fmtPlain("ctrl",base)} at today's price`),`₹ cr · market cap × (promoter stake + ${oo}% open offer), capped at 100% · current price ${esc(M.asof||"")}`,`<div class="calc">
      <label for="prem" class="rlab"><span>Control premium over the current price</span><em id="premV">0%</em></label><input id="prem" type="range" min="0" max="50" step="1" value="0" aria-describedby="premNote">
      <div id="wf"></div>
      <div class="out"><div><span class="eyebrow">At current price</span><b id="c0"></b></div><div><span class="eyebrow">With premium</span><b id="c1"></b></div><div><span class="eyebrow">Stake acquired</span><b id="c2"></b></div></div>
      <p class="caption" id="premNote">Under SEBI SAST the open-offer price is the highest of several reference prices (including the negotiated price and recent averages), so it can exceed today's price. Range shown: current price to current price + premium.</p></div>`);
    const upd=()=>{ const p=+el.querySelector("#prem").value; el.querySelector("#premV").textContent=p+"%";
      el.querySelector("#c0").innerHTML=base==null?NA:num(base,1); el.querySelector("#c1").innerHTML=base==null?NA:num(base*(1+p/100),1); el.querySelector("#c2").textContent=pct==null?"n/a":nf(pct,1)+"%";
      if(base!=null){ const pv=mc*pr/100; C.waterfall(el.querySelector("#wf"),{max:base*1.5,fmt:v=>nf(v,1),steps:[
        {label:`Promoter block (${nf(pr,1)}%)`,start:0,end:pv,kind:"add",tip:`Market cap × promoter stake = ₹${nf(pv,1)} cr`},
        {label:`Open offer (${nf(pct-pr,1)}%)`,start:pv,end:base,kind:"offer",tip:`Market cap × open offer share = ₹${nf(base-pv,1)} cr`},
        {label:`Premium (${p}%)`,start:base,end:base*(1+p/100),kind:"premium",tip:`Premium of ${p}% on ₹${nf(base,1)} cr`},
        {label:"Total cost to control",start:0,end:base*(1+p/100),kind:"total",tip:"Promoter block + open offer + premium"}]}); } else el.querySelector("#wf").innerHTML=`<p class="caption">No promoter holding reported, so control would need acquisitions in the market or a full open offer.</p>`; };
    el.querySelector("#prem").oninput=upd; upd();
  }
  if(cfg.hold && c.hold){
    const parts=c.hold.parts.filter(p=>p.value!=null).map((p,j)=>({...p,color:["var(--viz-1)","var(--viz-2)","var(--viz-4)","var(--viz-7)"][j]}));
    const el=card("hold",esc(c.m.pr>0?`Promoter holds ${nf(c.m.pr,1)}%`:"No promoter holding reported"),`Shareholding, % of equity · ${esc(c.hold.asof||"latest quarter")} · only the latest quarter is in the data`,`<div class="cv"></div>`);
    parts.length? C.stackBar(el.querySelector(".cv"),{parts, tip:(g,p)=>`${g.label} holds ${nf(g.value,1)}% of the equity.`, aria:"Shareholding mix"}) : el.querySelector(".cv").innerHTML=`<div class="empty">No shareholding data.</div>`;
  }
  if(cfg.revMix){
    const el=card("mix",c.revMix?esc(`${c.revMix.parts[0]?topPart(c.revMix):"Revenue mix"}`):"Revenue mix",c.revMix?`Share of FY26 total income (₹${nf(c.revMix.total,1)} cr) · ${esc(c.revMix.conf)} confidence · ${esc(c.revMix.source)}`:"From shortlist diligence",`<div class="cv"></div>${c.revMix&&c.revMix.note?`<p class="caption">${esc(c.revMix.note)}</p>`:""}`);
    if(c.revMix) C.stackBar(el.querySelector(".cv"),{parts:c.revMix.parts.map((p,j)=>({...p,color:C.vizVar(j)})),tip:(g,p)=>`${g.label}: ₹${nf(g.value,2)} cr, ${p.toFixed(0)}% of FY26 total income (${g.detail}).`,aria:"Revenue mix"});
    else el.querySelector(".cv").innerHTML=`<div class="empty">No diligence yet, so no revenue split. ${M.repo?`<a href="${diligenceUrl(c)}" target="_blank" rel="noopener">Request diligence</a>`:""}</div>`;
  }
  const dd=c.dd, tabs=[["str","Strengths",dd&&dd.str],["wk","Weaknesses",dd&&dd.wk],["open","Open items",c.open],["src","Sources",c.sources]].filter(t=>t[2]&&t[2].length);
  if(tabs.length){ const cur=tabs.some(t=>t[0]===st.tab)?st.tab:tabs[0][0];
    const el=card("dd","Diligence",`From shortlist diligence${c.updated?` · ${esc(c.updated)}`:""}`,`<div class="tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" data-tab="${t[0]}" aria-selected="${t[0]===cur}">${t[1]}<span class="n">${t[2].length}</span></button>`).join("")}</div><div class="tabp"></div>`);
    const paint=k=>{ const t=tabs.find(x=>x[0]===k); el.querySelector(".tabp").innerHTML = k==="src"?`<div class="srcs">${c.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("")}<span class="subtle">checked ${esc(c.updated||"")}</span></div>`:`<ul class="notes">${t[2].map(x=>`<li>${safeHtml(x)}</li>`).join("")}</ul>`;
      el.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===k)); };
    el.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{ paint(b.dataset.tab); history.replaceState(null,"",href("company",c.id,withState(route().st,{tab:b.dataset.tab}))); }); paint(cur); }
  card("dqc","Contacts and data quality",`${c.dq.length} data-quality note${c.dq.length!==1?"s":""} for this company`,`
    ${c.contacts.length?`<h3>Contacts</h3><div class="srcs" style="margin-bottom:var(--s-3)">${c.contacts.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join("")}</div>`:""}
    ${c.dq.length?`<ul class="dq">${c.dq.map(d=>`<li>${pill(d.level==="neg"?"Error":d.level==="warn"?"Check":"Note",d.level==="neg"?"neg":d.level==="warn"?"warn":"info")}<span>${esc(d.text)}</span></li>`).join("")}</ul>`:`<p class="caption">No data-quality flags.</p>`}`);
};

// ======================================================================================
// Shortlist (animated re-ranking) and Compare (profiles)
// ======================================================================================
const SL={board:null};
function rankRows(st){ const sl=M.companies.filter(c=>c.shortlisted); const def=sl.map(c=>({c,t:totalScore(c,{})})).sort((a,b)=>b.t-a.t).map(x=>x.c.id);
  return sl.map(c=>({c,parts:contributions(c,st),total:totalScore(c,st)})).sort((a,b)=>b.total-a.total).map((x,i)=>({...x,rank:i+1,delta:def.indexOf(x.c.id)+1-(i+1)})); }
function activePreset(st){ const w=weights(st); const p=(M.scoring.presets||[]).find(p=>CRIT.every(k=>(p.w[k.key]??0)===w[k.key])); return p?p.key:"custom"; }
function scard(x, st){ const c=x.c, keys=M.company.kpis.slice(0,3);
  return `<article class="card scard lift" data-id="${esc(c.id)}">${c.verdict&&x.rank===1?`<span class="ribbon">Top ranked</span>`:""}<div class="top2"><div class="mini-radar" data-r="${esc(c.id)}"></div><div style="min-width:var(--s-0)"><span class="rank">#${x.rank}</span><a class="cname" href="${href("company",c.id,filterOnly(st))}">${esc(c.name)}</a><div class="cmeta">${c.ticker?`<span>${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}</div></div></div>
    <div class="pills">${c.verdict?pill(c.verdict.label,c.verdict.tone):pill("No verdict yet","outline")}<span class="pill info sc-pill" data-tip="Weighted score on the current weights">Score ${x.total.toFixed(0)}</span></div>
    <p class="thesis">${esc(c.thesis||"No thesis recorded.")}</p>
    <div class="mini">${keys.map(k=>`<div>${esc(MET[k].short)}<b>${fmt(k,c.m[k],c)}</b></div>`).join("")}</div>
    <div class="caption">${c.open.length} open diligence item${c.open.length!==1?"s":""} · updated ${esc(c.updated||"n/a")}</div></article>`; }
PAGES.shortlist = (main, st)=>{
  const sl=M.companies.filter(c=>c.shortlisted), pend=pendingChanges(), w=weights(st), rows=rankRows(st);
  main.innerHTML=`
  <section class="hero" style="padding:var(--s-5) var(--hero-pad)"><div class="hero-top"><div><span class="eyebrow">Shortlist · stored in the repo (${esc(M.shortlistFile)})</span><h1 class="hero-h" style="font-size:var(--fs-display)">${sl.length?`${sl.length} compan${sl.length>1?"ies":"y"} under consideration`:"No shortlist yet"}</h1><p class="hero-sub">One list for the whole team. Move the weights and watch the ranking re-order; the weights travel with the link.</p></div>
    <div class="hero-acts">${sl.length?`<a class="btn primary" href="${href("compare","",withState(filterOnly(st),{c:rows.slice(0,5).map(x=>x.c.id),w:st.w}))}">${icon("compare")}Compare top ${Math.min(5,rows.length)}</a>`:""}<button class="btn" type="button" id="slPresent">${icon("play")}Present</button></div></div></section>
  ${pend.length?`<section class="card" style="margin-bottom:var(--s-4);border-color:var(--warning)"><div class="card-h"><div><h2>${pend.length} staged change${pend.length>1?"s":""} not yet published</h2><div class="sub">Staged in this browser only. Publishing updates ${esc(M.shortlistFile)} in the repo for everyone.</div></div>
    <div class="pills"><button class="btn primary sm" id="pub">Copy file and open GitHub editor</button><button class="btn sm" id="discard">Discard</button></div></div>
    <ul class="chg">${pend.map(([n,v])=>`<li>${pill(v?"Add":"Remove",v?"pos":"neg")}<span class="what">${esc(n)}</span><span></span></li>`).join("")}</ul></section>`:""}
  ${sl.length?`<section class="card" id="scoreCard"><div class="card-h"><div><h2 id="scT"></h2><div class="sub">Score 0–100 = Σ weight × criterion score (0–1) ÷ Σ weights · criteria scored across all ${M.companies.length} companies · ▲▼ = places moved vs default weights</div></div><button class="btn sm" id="resetW">Reset weights</button></div>
    <div class="wpresets"><span class="lbl">Presets</span><span class="seg" id="wps">${(M.scoring.presets||[]).map(p=>`<button type="button" data-p="${p.key}" aria-pressed="false">${esc(p.label)}</button>`).join("")}<button type="button" data-p="custom" aria-pressed="false" disabled>Custom</button></span></div>
    <div class="wts">${CRIT.map(k=>`<label class="wt" data-tip="${esc(k.explain)}"><span>${esc(k.label)}</span><b id="w-${k.key}">${w[k.key]}</b><input type="range" min="0" max="50" step="5" value="${w[k.key]}" data-w="${k.key}" aria-label="${esc(k.label)} weight"></label>`).join("")}</div>
    ${M.scoring.unavailable?`<p class="caption">${esc(M.scoring.unavailable)}</p>`:""}
    <div id="sbHost" style="margin-top:var(--s-4)"></div><div class="legend" id="sbL"></div></section>
  <div class="cards" id="cards" style="margin-top:var(--s-4)">${rows.map(x=>scard(x,st)).join("")}</div>`
  :`<div class="empty-cta"><b>The shortlist is empty.</b><span>Star companies in the screener (☆ next to each name), then publish the shortlist from here so the whole team sees one list.</span><a class="btn sm" href="${href("screener","",{})}">Open screener</a></div>`}`;
  main.querySelector("#slPresent").onclick=()=>Present.open();
  const pub=main.querySelector("#pub"); if(pub) pub.onclick=()=>{ const txt=shortlistFileText(); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>{ toast("New shortlist file copied. Paste it over the file in GitHub and commit."); window.open(`https://github.com/${M.repo}/edit/main/${M.shortlistFile}`,"_blank","noopener"); }).catch(()=>{ download(new Blob([txt],{type:"text/javascript"}),M.shortlistFile.split("/").pop()); toast("Clipboard blocked: file downloaded instead."); }); };
  const dis=main.querySelector("#discard"); if(dis) dis.onclick=()=>{ setDraft({}); render(); };
  if(!sl.length) return;
  main.querySelectorAll(".mini-radar").forEach(h=>{ const c=byId.get(h.dataset.r); C.radar(h,{compact:true,height:118,axes:radarAxes(),series:[{key:c.id,label:c.name,color:"var(--viz-1)",values:c.sc,fill:true}],aria:`Score shape for ${c.name}`}); });
  SL.board=new C.Scoreboard(main.querySelector("#sbHost"),{rowH:44,max:100,keys:CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j)}))});
  C.legend(main.querySelector("#sbL"),CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j),shape:"square"})),null,"Bars stack each criterion's contribution");
  const draw=(animate)=>{ const s=route().st, rows=rankRows(s);
    SL.board.update(rows.map(x=>({id:x.c.id,label:shortName(x.c.name),parts:x.parts,total:x.total,delta:x.delta,href:href("company",x.c.id,filterOnly(s))})));
    main.querySelector("#scT").textContent=`${shortName(rows[0].c.name)} ranks first on ${activePreset(s)==="custom"?"these":"the "+((M.scoring.presets||[]).find(p=>p.key===activePreset(s))||{label:""}).label.toLowerCase()} weights`;
    const ap=activePreset(s); main.querySelectorAll("#wps [data-p]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.p===ap));
    const cards=main.querySelector("#cards"), move=()=>{ rows.forEach(x=>{ const el=cards.querySelector(`[data-id="${CSS.escape(x.c.id)}"]`); if(!el) return; el.querySelector(".rank").textContent="#"+x.rank; el.querySelector(".sc-pill").textContent="Score "+x.total.toFixed(0); cards.appendChild(el); }); };
    if(animate) C.flip(cards,".scard","data-id",move); else move(); };
  draw(false);
  const setW=(w2,anim)=>{ const s=route().st; history.replaceState(null,"",href("shortlist","",withState(s,{w:w2}))); CRIT.forEach(k=>{ const r=main.querySelector(`[data-w="${k.key}"]`); if(r) r.value=w2[k.key]; const b=main.querySelector("#w-"+k.key); if(b) b.textContent=w2[k.key]; }); draw(anim); syncNav(); };
  let wt; main.querySelectorAll("[data-w]").forEach(r=>r.oninput=()=>{ const s=route().st; const w2={...weights(s),[r.dataset.w]:+r.value}; main.querySelector("#w-"+r.dataset.w).textContent=r.value; history.replaceState(null,"",href("shortlist","",withState(s,{w:w2}))); clearTimeout(wt); wt=setTimeout(()=>draw(true),60); });
  main.querySelectorAll("#wps [data-p]").forEach(b=>b.onclick=()=>{ const p=(M.scoring.presets||[]).find(x=>x.key===b.dataset.p); if(p) setW({...p.w},true); });
  main.querySelector("#resetW").onclick=()=>setW(Object.fromEntries(CRIT.map(k=>[k.key,k.weight])),true);
};

PAGES.compare = (main, st)=>{
  let ids=(st.c||[]).filter(id=>byId.has(id)).slice(0,5);
  if(!ids.length) ids=M.companies.filter(c=>c.shortlisted).map(c=>({c,t:totalScore(c,st)})).sort((a,b)=>b.t-a.t).slice(0,5).map(x=>x.c.id);
  const cs=ids.map(id=>byId.get(id));
  const best=(k,vals)=>{ const b=(MET[k]||{}).better; const ok=vals.filter(v=>v!=null&&isFinite(v)); if(!b||ok.length<2) return {}; const mx=Math.max(...ok), mn=Math.min(...ok); if(mx===mn) return {}; return b==="high"?{best:mx,worst:mn}:{best:mn,worst:mx}; };
  const rowHtml=(k)=>{ const vals=cs.map(c=>c.nm&&c.nm[k]?null:c.m[k]); const bw=best(k,vals); return `<tr><td class="l" data-tip="${esc(headerTip(k))}">${esc(MET[k].label)} <span class="subtle">${esc(unitOf(k))}</span></td>${cs.map((c,i)=>{ const p=MET[k].better?c.pctGood[k]:c.pct[k]; return `<td class="${vals[i]!=null&&vals[i]===bw.best?"best":vals[i]!=null&&vals[i]===bw.worst?"worst":""}">${fmt(k,c.m[k],c)}${p!=null?`<span class="cbar" data-tip="${esc(`${Math.round(p)}${MET[k].better?" (100 = best)":""} percentile in the universe`)}"><i style="width:${p.toFixed(0)}%"></i></span>`:""}</td>`; }).join("")}</tr>`; };
  const opts=M.companies.filter(c=>!ids.includes(c.id)).sort((a,b)=>(b.shortlisted-a.shortlisted)||a.name.localeCompare(b.name));
  const axes=M.compare.flatMap(s=>s.rows).filter(k=>MET[k]&&M.stats[k]&&M.stats[k].n>2);
  const lead=cs.length?cs.map(c=>({c,n:axes.filter(k=>{ const p=x=>MET[k].better?x.pctGood[k]:x.pct[k]; const v=p(c); return v!=null&&cs.every(o=>p(o)==null||p(o)<=v); }).length})).sort((a,b)=>b.n-a.n)[0]:null;
  main.innerHTML=`
    <div class="ph"><div><span class="eyebrow">Compare</span><h1>Side by side</h1><p>Up to five companies. Green = best and red = worst in each row, using each metric's direction (e.g. lower P/E is better).</p></div>
      <div class="acts noprint">${ids.length<5?`<label class="sr" for="addc">Add company</label><select id="addc" class="inp" style="width:auto"><option value="">Add a company…</option>${opts.map(c=>`<option value="${c.id}">${c.shortlisted?"★ ":""}${esc(c.name)}</option>`).join("")}</select>`:""}<button class="btn" id="prt">${icon("print")}Print</button></div></div>
    ${cs.length>0?`<section class="card noprint" style="margin-bottom:var(--s-4)"><div class="card-h"><div><h2>${esc(lead&&lead.n?`${shortName(lead.c.name)} leads on ${lead.n} of ${axes.length} measures`:"Profiles across the measures")}</h2><div class="sub">Percentile within the universe, 0–100 (100 = best) · hover a line or an axis · click a name to isolate it</div></div></div><div class="pc-scroll" id="pc"></div><div class="legend" id="pcL"></div></section>
      <div class="grid g2 noprint" style="margin-bottom:var(--s-4)">${CRIT.length?`<section class="card"><div class="card-h"><div><h2>Score shapes</h2><div class="sub">Percentile score 0–100 per criterion · hover an axis</div></div></div><div id="cr"></div></section>`:""}
      <section class="card"><div class="card-h"><div><h2>Who leads where</h2><div class="sub">Measures on which each company has the best percentile among those compared (100 = best)</div></div></div><div class="lw">${cs.map((c,j)=>{ const won=axes.filter(k=>{ const p=x=>MET[k].better?x.pctGood[k]:x.pct[k]; const v=p(c); return v!=null&&cs.every(o=>o===c||p(o)==null||p(o)<v); }); return `<div class="lw-row"><span class="lw-n">${C.legendSwatch(C.vizVar(j),C.shapeOf(j))}<b>${esc(shortName(c.name))}</b> <span class="num subtle">${won.length}</span></span><span class="pills">${won.map(k=>`<span class="pill outline">${esc(MET[k].short)}</span>`).join("")||`<span class="caption">None outright</span>`}</span></div>`; }).join("")}</div></section></div>`:""}
    ${cs.length?`<section class="card flush"><div class="tscroll" style="max-height:none"><table class="cmp"><thead><tr><th class="l">Metric</th>${cs.map(c=>`<th><a href="${href("company",c.id,filterOnly(st))}">${esc(shortName(c.name))}</a><div class="caption">${esc(c.ticker||G[c.prim]?.short||"")}</div><button class="linkbtn noprint" data-rm="${c.id}" aria-label="Remove ${esc(c.name)}">remove</button></th>`).join("")}</tr></thead>
      <tbody>${M.compare.map(sec=>`<tr class="sec"><td colspan="${cs.length+1}">${esc(sec.sec)}</td></tr>${sec.rows.map(rowHtml).join("")}`).join("")}
      <tr class="sec"><td colspan="${cs.length+1}">Score</td></tr><tr><td class="l">Weighted score (0–100)</td>${(()=>{ const v=cs.map(c=>totalScore(c,st)); const mx=Math.max(...v), mn=Math.min(...v); return v.map(x=>`<td class="${cs.length>1&&x===mx?"best":cs.length>1&&x===mn?"worst":""}">${x.toFixed(1)}</td>`).join(""); })()}</tr>
      <tr><td class="l">Verdict</td>${cs.map(c=>`<td class="note">${c.verdict?pill(c.verdict.label,c.verdict.tone):"–"}</td>`).join("")}</tr>
      <tr class="sec"><td colspan="${cs.length+1}">Pipeline</td></tr><tr><td class="l">Stage</td>${cs.map(c=>`<td class="note">${PUI?PUI.stagePill(c):"–"}</td>`).join("")}</tr><tr><td class="l">Owner · next step</td>${cs.map(c=>{ const r=PIPE.get(c); return `<td class="note">${esc([r.owner,r.next].filter(Boolean).join(" · ")||"–")}</td>`; }).join("")}</tr>
      <tr class="sec"><td colspan="${cs.length+1}">Notes</td></tr><tr><td class="l">Thesis / notes</td>${cs.map(c=>`<td class="note">${esc(c.thesis||"–")}</td>`).join("")}</tr></tbody></table></div></section>`
    :`<div class="empty">Nothing to compare. Add companies above or shortlist some first.</div>`}
    <p class="caption">Prints on one landscape page. Figures as of ${esc(M.asof||"n/a")}.</p>`;
  const add=main.querySelector("#addc"); if(add) add.onchange=()=>{ if(add.value) go("compare","",withState(st,{c:ids.concat(add.value)})); };
  main.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>go("compare","",withState(st,{c:ids.filter(x=>x!==b.dataset.rm)})));
  main.querySelector("#prt").onclick=()=>{ document.body.classList.add("print-compare"); window.print(); setTimeout(()=>{ document.body.classList.remove("print-compare"); },500); };
  if(!cs.length) return;
  const ser=cs.map((c,j)=>({id:c.id,key:c.id,label:shortName(c.name),color:C.vizVar(j),shape:C.shapeOf(j)}));
  C.parallel(main.querySelector("#pc"),{aria:"Percentile profiles of the compared companies",axes:axes.map(k=>({key:k,label:MET[k].short,note:`${MET[k].label}${MET[k].better?` · ${MET[k].better==="high"?"higher":"lower"} is better`:""}`})),
    series:ser.map((s,j)=>({...s,pts:Object.fromEntries(axes.map(k=>{ const c=cs[j], p=MET[k].better?c.pctGood[k]:c.pct[k]; return [k,{p,raw:c.nm&&c.nm[k]?"n.m.":fmtPlain(k,c.m[k])}]; }))}))});
  if(CRIT.length) C.radar(main.querySelector("#cr"),{axes:radarAxes(),series:cs.map((c,j)=>({key:c.id,label:shortName(c.name),color:C.vizVar(j),values:c.sc,fill:j===0,shape:C.shapeOf(j)})),aria:"Score shapes of the compared companies"});
  legendIsolate(main.querySelector("#pcL"),()=>[main.querySelector(".pc"),main.querySelector("#cr .radar")].filter(Boolean),ser.map(s=>({key:s.key,label:s.label,color:s.color,shape:s.shape})));
};

// ======================================================================================
// Data quality, Methodology
// ======================================================================================
PAGES.dq = (main, st)=>{
  const all=M.companies.flatMap(c=>c.dq.map(d=>({...d,c})));
  const n=l=>all.filter(d=>d.level===l).length;
  const cs=M.companies.filter(c=>c.dq.length).sort((a,b)=>b.dq.filter(d=>d.level!=="info").length-a.dq.filter(d=>d.level!=="info").length||a.name.localeCompare(b.name));
  main.innerHTML=`<div class="ph"><div><span class="eyebrow">Data quality</span><h1>Figures to check</h1><p>Issues are flagged, never “fixed” in the dashboard. Correct the source file and the next refresh picks it up.</p></div></div>
    <section class="kpis"><div class="kpi"><span class="eyebrow">Errors</span><span class="kpi-v">${n("neg")}</span><span class="ctx">e.g. failed refresh</span></div><div class="kpi"><span class="eyebrow">To check</span><span class="kpi-v">${n("warn")}</span><span class="ctx">figures that look wrong</span></div><div class="kpi"><span class="eyebrow">Notes</span><span class="kpi-v">${n("info")}</span><span class="ctx">missing or not meaningful</span></div><div class="kpi"><span class="eyebrow">Snapshot</span><span class="kpi-v" style="font-size:var(--fs-h2)">${PREV?"Available":"None yet"}</span><span class="ctx">${esc(PREV?`previous: ${PREV.asof||M.prevLabel||""}`:"builds from the next refresh")}</span></div></section>
    ${M.dqGlobal.length?`<section class="card" style="margin-top:var(--s-4)"><h2>Dataset</h2><ul class="dq" style="margin-top:var(--s-2)">${M.dqGlobal.map(d=>`<li>${pill(d.level==="neg"?"Error":"Check",d.level==="neg"?"neg":"warn")}<span>${esc(d.text)}</span></li>`).join("")}</ul></section>`:""}
    <section class="card flush" style="margin-top:var(--s-4)"><div class="tscroll"><table class="grid-t"><thead><tr class="cols"><th class="l stk">Company</th><th class="l">Issues</th></tr></thead><tbody>
      ${cs.map(c=>`<tr data-id="${c.id}"><td class="l stk first"><a class="cname" href="${href("company",c.id,filterOnly(st))}">${esc(c.name)}</a></td><td class="l" style="white-space:normal"><ul class="dq">${c.dq.map(d=>`<li>${pill(d.level==="neg"?"Error":d.level==="warn"?"Check":"Note",d.level==="neg"?"neg":d.level==="warn"?"warn":"info")}<span>${esc(d.text)}</span></li>`).join("")}</ul></td></tr>`).join("")}
    </tbody></table></div></section>`;
};
PAGES.method = (main)=>{
  main.innerHTML=`<div class="ph"><div><span class="eyebrow">Methodology</span><h1>How the numbers are built</h1></div></div>
    <div class="grid g2">${M.methodology.map(s=>`<section class="card prose"><h2>${esc(s.h)}</h2>${s.p.map(p=>`<p>${esc(p)}</p>`).join("")}</section>`).join("")}
    <section class="card prose"><h2>Scoring</h2>${CRIT.map(k=>`<p><b>${esc(k.label)}</b> (default weight ${k.weight}): ${esc(k.explain)}</p>`).join("")}${M.scoring.unavailable?`<p>${esc(M.scoring.unavailable)}</p>`:""}</section>
    <section class="card prose"><h2>Formats, charts and accessibility</h2><p>₹ crore to one decimal with Indian digit grouping; multiples as 8.3x; growth and margins signed to one decimal; negatives in red with a minus sign. Growth off a small or negative base shows n.m. with the reason on hover.</p><p>Percentiles rank each company within the universe (100 = best where a metric has a direction). The radar, swarm, treemap colours and profile lines use these percentiles; every underlying figure is in the screener.</p><p>Colours come from the Greater Pacific palette; every chart series also has its own marker shape, so colour is never the only cue. All text meets WCAG AA contrast. Animations are switched off when the device asks for reduced motion.</p></section></div>
    <section class="card flush" style="margin-top:var(--s-4)"><div class="card-h"><h2>Definitions</h2></div><div class="tscroll" style="max-height:none"><table class="defs"><thead><tr><th>Measure</th><th>Definition</th><th>Formula</th><th>Source</th><th>As of</th></tr></thead><tbody>
      ${Object.entries(MET).map(([k,m])=>`<tr><td><b>${esc(m.label)}</b></td><td>${esc(m.def||"")}</td><td>${esc(m.formula||"")}</td><td>${esc(m.source||"")}</td><td class="num">${esc(m.asof||"–")}</td></tr>`).join("")}</tbody></table></div></section>`;
};

// ======================================================================================
// Dev chart gallery (every chart type, live data)
// ======================================================================================
let SAMPLE=null;
PAGES.dev = (main, st, arg, same)=>{
  if(arg==="pipeline-sample"&&PUI){ PUI.page(main, st, arg, same, SAMPLE||(SAMPLE=PUI.sampleCtx())); return; }
  const sl=M.companies.filter(c=>c.shortlisted)[0]||M.companies[0], x=M.scatter.x, y=M.scatter.y;
  const items=[["Positioning lab (interactive scatter)",`${MET[x].label} (${unitOf(x)}) vs ${MET[y].label} (${unitOf(y)}) · drag, pin, zoom`],["Treemap",`Tile size ₹ cr by ${M.groupLabel.toLowerCase()}`],["Funnel","Companies per stage · % of universe"],["Radar scorecard","Percentile score 0–100"],["Beeswarm vs peers","Universe distribution in each metric's units (x, %, ₹ cr)"],["Parallel profiles","Percentile within the universe, 0–100"],["Bars with margin band","Revenue and PAT ₹ cr, margin %"],["Columns (single series)","₹ cr"],["Dot plot vs peers","Peer distribution in each metric's units (x, %, ₹ cr)"],["Labelled stacked bar","Share of total, %"],["Score contribution bars (static)","Score points, 0–100 scale"],["Animated scoreboard","Score points, 0–100 scale"],["Histogram range slider","Distribution of ₹ cr values"],["Waterfall","₹ cr"],["Sparklines","Trend, ₹ cr"],["Palette and shapes","Categorical palette with marker shapes; sequential and diverging scales"],["Pipeline river","Companies reaching each stage · % share moving on"]];
  main.innerHTML=`<div class="ph"><div><span class="eyebrow">Developer · chart gallery</span><h1>Every chart type, live data</h1><p>For design review: hover, legends, labels, keyboard and reduced motion. <a href="#/dev/pipeline-sample">Pipeline design preview with sample data</a>.</p></div></div>
    <div class="grid g2">${items.map((t,i)=>`<section class="card gallery-item"><div class="card-h"><div><h2>${t[0]}</h2><div class="sub">${esc(t[1])}</div></div></div><div id="g${i}" class="${i===5?"pc-scroll":""}"></div><div class="legend" id="gl${i}"></div></section>`).join("")}</div>`;
  new C.Lab(main.querySelector("#g0"),{...labOpts({lb:"sl"},"overview",{}),height:340});
  const sz=(M.treemap&&M.treemap.size||[])[0]; C.treemap(main.querySelector("#g1"),{height:320,groups:M.groups.map(g=>{ const kids=M.companies.filter(c=>c.prim===g.key&&c.m[sz]>0).map(c=>({id:c.id,label:shortName(c.name),value:c.m[sz],fill:`color-mix(in srgb, ${g.color} 30%, var(--surface))`,sub:fmtPlain(sz,c.m[sz])})); return {key:g.key,label:g.short,color:g.color,value:kids.reduce((a,b)=>a+b.value,0),children:kids,sub:""}; }),tipLeaf:k=>esc(k.label),tipGroup:g=>esc(g.label)});
  C.funnel(main.querySelector("#g2"),{stages:M.funnel.map(s=>({...s,n:filtered(s.state).length,href:href("screener","",s.state)})),tip:s=>esc(s.label)});
  C.radar(main.querySelector("#g3"),{axes:radarAxes(),series:radarSeries(sl)});
  C.swarm(main.querySelector("#g4"),{rows:(M.company.peers||[]).slice(0,2).map(k=>({key:k,label:MET[k].label,note:"",items:M.companies.map(c=>({id:c.id,v:c.m[k],name:c.name,kind:c.id===sl.id?"self":c.prim===sl.prim?"peer":"other"})),med:(M.stats[k]||{}).med,gmed:segMedian(sl,k),gcolor:G[sl.prim].color,tick:v=>tick(k,v),tipFn:it=>esc(it.name)}))});
  const top=M.companies.slice(0,4), ax=M.compare.flatMap(s=>s.rows).filter(k=>MET[k]).slice(0,8);
  C.parallel(main.querySelector("#g5"),{axes:ax.map(k=>({key:k,label:MET[k].short})),series:top.map((c,j)=>({id:c.id,label:shortName(c.name),color:C.vizVar(j),shape:C.shapeOf(j),pts:Object.fromEntries(ax.map(k=>[k,{p:MET[k].better?c.pctGood[k]:c.pct[k],raw:fmtPlain(k,c.m[k])}]))}))});
  const fc=M.companies.find(c=>c.fin)||null;
  if(fc) C.combo(main.querySelector("#g6"),{cats:fc.fin.cats,fmt:v=>nf(v,1),bars:[{key:"rev",label:"Revenue",values:fc.fin.rev,color:"var(--viz-1)"},{key:"pat",label:"PAT",values:fc.fin.pat,color:"var(--viz-3)"}],tip:(b,j,v)=>`${fc.fin.cats[j]} ${b.label} ₹${nf(v,1)} cr.`,line:{values:fc.fin.cats.map((_,j)=>fc.fin.rev[j]?fc.fin.pat[j]/fc.fin.rev[j]*100:null),color:"var(--viz-2)",short:"Margin",fmt:v=>v==null?"":v.toFixed(1)+"%",tick:v=>v+"%",axis:"Margin %",tipFn:(j,v)=>`Margin ${v.toFixed(1)}%.`},yLabel:"₹ cr"});
  else main.querySelector("#g6").innerHTML=`<p class="caption">No multi-year series in this dataset.</p>`;
  C.columns(main.querySelector("#g7"),{items:M.company.kpis.filter(k=>MET[k].fmt==="cr").slice(0,3).map(k=>({label:MET[k].short,value:sl.m[k]})),fmt:v=>nf(v,1),yLabel:"₹ cr",tip:(it,v)=>`${it.label} ₹${nf(v,1)} cr.`});
  C.dotPlot(main.querySelector("#g8"),{rows:(M.company.peers||[]).map(k=>({label:MET[k].short,value:sl.m[k],peers:M.companies.filter(x=>x.prim===sl.prim).map(x=>x.m[k]),fmt:v=>fmtPlain(k,v),tick:v=>tick(k,v)})),labelW:90});
  const rm=(M.companies.find(c=>c.revMix)||{}).revMix; C.stackBar(main.querySelector("#g9"),{parts:rm?rm.parts.map((p,j)=>({...p,color:C.vizVar(j)})):M.groups.slice(0,5).map(g=>({label:g.short,value:g.n,color:g.color})),tip:(g,p)=>`${g.label}: ${p.toFixed(0)}%.`});
  const rk=M.companies.slice(0,6); C.scoreBars(main.querySelector("#g10"),{rows:rk.map(c=>({label:shortName(c.name),parts:contributions(c,{}),total:totalScore(c,{})})),keys:CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j)})),fmt:v=>v.toFixed(0),tip:(r,k,v)=>`${r.label}: ${k.label} ${v.toFixed(1)} points.`});
  const sb=new C.Scoreboard(main.querySelector("#g11"),{rowH:44,keys:CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j)}))}); sb.update(rk.map(c=>({id:c.id,label:shortName(c.name),parts:contributions(c,{}),total:totalScore(c,{}),delta:0})).sort((a,b)=>b.total-a.total));
  const hk=M.filters.ranges[0]; new C.HistSlider(main.querySelector("#g12"),{label:MET[hk].label,values:M.companies.map(c=>c.m[hk]),fmt:v=>tick(hk,v),sel:[null,null]});
  C.waterfall(main.querySelector("#g13"),{max:100,fmt:v=>nf(v,1),steps:[{label:"Step A",start:0,end:40,kind:"add"},{label:"Step B",start:40,end:65,kind:"offer"},{label:"Premium",start:65,end:80,kind:"premium"},{label:"Total",start:0,end:80,kind:"total"}]});
  main.querySelector("#g14").innerHTML=M.companies.slice(0,6).map(c=>`<span style="display:inline-flex;gap:var(--s-2);align-items:center;margin-right:var(--s-5)">${esc(shortName(c.name))} ${M.metrics.sRev?C.spark([c.m.r24,c.m.r25,c.m.r26]):C.spark([c.m.p,c.m.e,c.m.r])}</span>`).join("");
  if(PUI) PUI.drawSlide(main.querySelector("#g16"));
  main.querySelector("#g15").innerHTML=`<div class="legend">${C.SHAPES.map((s,j)=>`<span style="display:inline-flex;align-items:center;gap:var(--s-1)">${C.legendSwatch(C.vizVar(j),s)} viz-${j+1}</span>`).join("")}</div><div class="legend">${C.scaleLegend("seq","seq-1","seq-7")} ${C.scaleLegend("div","div-n3","div-p3")}</div>`;
};

// ======================================================================================
// Slides: one builder for the IC pack (print) and presentation mode (screen)
// ======================================================================================
function slide(title, section, inner){ return `<section class="slide"><div class="sh"><img src="${LOGO}" alt="Greater Pacific Capital"><h2>${esc(title)}</h2><span class="sec">${esc(section)}</span></div><div class="sb"><div class="fit">${inner}</div></div><div class="sf"><span>Confidential – internal use only</span><span>${esc(M.product)} · data as of ${esc(M.asof||"n/a")}</span><span class="pg"></span></div></section>`; }
function chipText(st){ const p=[]; if(st.q) p.push(`search “${st.q}”`); if(st.sel&&st.sel.length) p.push(`selection of ${st.sel.length}`); (st.g||[]).forEach(k=>G[k]&&p.push(G[k].short)); (st.t||[]).forEach(k=>TOG[k]&&p.push(TOG[k].label)); Object.entries(st.r||{}).forEach(([k,v])=>MET[k]&&p.push(rangeLabel(k,v))); return p.length?"Filters: "+p.join(" · ")+".":"No filters."; }
function slidesHtml(st){
  const today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const cs=M.companies, funnel=M.funnel.map(s=>({...s,n:filtered(s.state).length}));
  let html=`<section class="slide cover"><img src="${LOGO}" alt="Greater Pacific Capital"><h1>${esc(M.product)}</h1><p>Investment committee pack · ${esc(today)}</p><p class="caption" style="color:var(--brand-accent)">Data as of ${esc(M.asof||"n/a")}</p><span class="conf-big">Confidential – internal use only</span></section>`;
  html+=slide("Overview","Overview",`<p class="headline">${headline(cs)}</p><section class="kpis">${kpiTiles(cs,PREV?PREV.companies:null,{static:true})}</section>
    <div class="grid" style="grid-template-columns:1.6fr 1fr;margin-top:var(--s-4)"><section class="card"><div class="card-h"><div><h2>Positioning</h2><div class="sub">${esc(MET[M.scatter.x].label)} (${unitOf(M.scatter.x)}) vs ${esc(MET[M.scatter.y].label)} (${unitOf(M.scatter.y)}) · dashed = median</div></div></div><div data-chart="scatter"></div></section>
    <section class="card"><div class="card-h"><h2>Screening funnel</h2></div><div class="funnel">${funnel.map(s=>`<div class="fstage"><span><span class="l">${esc(s.label)}</span><br><span class="d">${esc(s.desc)}</span></span><b>${s.n}</b><span class="bar"><i style="width:${(s.n/Math.max(1,funnel[0].n)*100).toFixed(1)}%"></i></span></div>`).join("")}</div></section></div>`);
  if(PUI) html+=slide("Deal pipeline","Pipeline",PUI.slideHtml());
  const sz=(M.treemap&&M.treemap.size||[])[0];
  if(sz) html+=slide("Universe map","Overview",`<p class="caption">Each tile is a company sized by ${esc(MET[sz].label.toLowerCase())} (₹ cr), grouped by ${esc(M.groupLabel.toLowerCase())}.</p><div data-chart="treemap" data-size="${sz}"></div>`);
  const rows=sorted(filtered(st),st), top=rows.slice(0,14), cols=colsFor(st).filter(k=>k!=="desc"&&(!MET[k]||MET[k].fmt!=="spark")).slice(0,11);
  html+=slide("Screener: top of the current view","Screener",`<p class="caption">Showing ${top.length} of ${rows.length} companies, sorted as on screen. ${esc(chipText(st))} ₹ crore unless stated.</p>
    <table class="grid-t" style="width:100%"><thead><tr class="cols"><th class="l">Company</th>${cols.map(k=>`<th class="${TEXT[k]?"l":""}">${esc((MET[k]||TEXT[k]).short||(MET[k]||TEXT[k]).label)}${MET[k]&&unitOf(k)?` <span class="subtle">${esc(unitOf(k))}</span>`:""}</th>`).join("")}</tr></thead>
    <tbody>${top.map(c=>`<tr><td class="l"><b>${esc(shortName(c.name))}</b> <span class="subtle">${esc(c.ticker||G[c.prim]?.short||"")}</span></td>${cols.map(k=>k==="ev"?`<td>${c.ev?"Yes":"No"}</td>`:`<td>${fmt(k,c.m[k],c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
  const sl=M.companies.filter(c=>c.shortlisted).map(c=>({c,t:totalScore(c,st)})).sort((a,b)=>b.t-a.t);
  sl.forEach(({c,t},i)=>{ const open=(c.open||[]).slice(0,4);
    html+=slide(c.name,`Shortlist #${i+1}`,`<div class="pills" style="margin-bottom:var(--s-3)">${c.ticker?`<span class="num">${esc(c.exchange)}: ${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}${c.verdict?pill(c.verdict.label,c.verdict.tone):""}${M.mandate?(c.fit?pill("Mandate fit","info"):pill("Outside mandate","neu")):""}${pill(`Score ${t.toFixed(0)}`,"info")}</div>
      <section class="kpis">${M.company.kpis.map(k=>`<div class="kpi"><span class="eyebrow">${esc(MET[k].label)}</span><span class="kpi-v">${kpiValue(c,k)}</span></div>`).join("")}</section>
      <div class="grid" style="grid-template-columns:1.15fr 1fr 1.1fr;margin-top:var(--s-4)">
        <section class="card"><div class="card-h"><div><h2>${c.fin?"Revenue and PAT":"FY25 P&L"}</h2><div class="sub">${c.fin?"₹ cr, FY24–FY26 · PAT margin % band":"₹ cr, FY25"}</div></div></div><div data-chart="fin" data-id="${c.id}"></div></section>
        <section class="card"><div class="card-h"><div><h2>Scorecard</h2><div class="sub">Percentile score 0–100 · vs universe median</div></div></div><div data-chart="radar" data-id="${c.id}"></div></section>
        <section class="card"><h2>Thesis</h2><p class="prose" style="margin:var(--s-2) var(--s-0)">${esc(c.thesis||"No thesis recorded.")}</p>${open.length?`<h3 style="margin-top:var(--s-3)">Open diligence items (${c.open.length})</h3><ul class="notes">${open.map(x=>`<li>${safeHtml(x)}</li>`).join("")}</ul>${c.open.length>4?`<p class="caption">${c.open.length-4} more on the company page.</p>`:""}`:""}</section>
      </div>`); });
  if(sl.length){ const ccs=sl.slice(0,5).map(x=>x.c); const trim=s=>s&&s.length>120?s.slice(0,117)+"…":s;
    const best=(k,vals)=>{ const b=(MET[k]||{}).better; const ok=vals.filter(v=>v!=null&&isFinite(v)); if(!b||ok.length<2) return {}; const mx=Math.max(...ok), mn=Math.min(...ok); if(mx===mn) return {}; return b==="high"?{best:mx,worst:mn}:{best:mn,worst:mx}; };
    html+=slide("Comparison","Compare",`<table class="cmp"><thead><tr><th class="l">Metric</th>${ccs.map(c=>`<th>${esc(shortName(c.name))}</th>`).join("")}</tr></thead><tbody>
      ${M.compare.map(sec=>`<tr class="sec"><td colspan="${ccs.length+1}">${esc(sec.sec)}</td></tr>${sec.rows.map(k=>{ const v=ccs.map(c=>c.nm&&c.nm[k]?null:c.m[k]), bw=best(k,v); return `<tr><td class="l">${esc(MET[k].label)} <span class="subtle">${esc(unitOf(k))}</span></td>${ccs.map((c,i)=>`<td class="${v[i]!=null&&v[i]===bw.best?"best":v[i]!=null&&v[i]===bw.worst?"worst":""}">${fmt(k,c.m[k],c)}</td>`).join("")}</tr>`; }).join("")}`).join("")}
      <tr class="sec"><td colspan="${ccs.length+1}">Notes</td></tr><tr><td class="l">Thesis</td>${ccs.map(c=>`<td class="note">${esc(trim(c.thesis||"–"))}</td>`).join("")}</tr></tbody></table><p class="caption">Green = best, red = worst in each row by the metric's direction.</p>`); }
  html+=slide("Methodology","Methodology",`<div class="grid g2">${M.methodology.map(s=>`<section class="prose"><h2>${esc(s.h)}</h2>${s.p.map(p=>`<p>${esc(p)}</p>`).join("")}</section>`).join("")}<section class="prose"><h2>Scoring</h2><p>${CRIT.map(k=>`${esc(k.label)} ${weights(st)[k.key]}`).join(" · ")} (weights). ${CRIT.map(k=>`${esc(k.label)}: ${esc(k.explain)}`).join(" ")}</p></section></div>`);
  return html;
}
function drawSlideCharts(root){
  root.querySelectorAll("[data-chart]").forEach(el=>{ const kind=el.dataset.chart, c=byId.get(el.dataset.id);
    if(kind==="scatter"){ const ax=M.scatter.x, ay=M.scatter.y, any=M.companies.some(x=>x.shortlisted); C.scatter(el,{domainAll:true,height:300,points:M.companies.map(x=>({id:x.id,x:x.m[ax],y:x.m[ay],color:G[x.prim].color,shape:G[x.prim].shape,series:x.prim,label:x.shortlisted?shortName(x.name):null,faded:any&&!x.shortlisted,c:x})),xLabel:`${MET[ax].label} (${unitOf(ax)})`,yLabel:`${MET[ay].label} (${unitOf(ay)})`,band:M.mandate&&ax===M.mandate.metric?[M.mandate.lo,M.mandate.hi]:null,bandLabel:M.mandate?M.mandate.label:"",medianY:(M.stats[ay]||{}).med,xTick:v=>tick(ax,v),yTick:v=>tick(ay,v),tip:p=>richTip(p.c,[ax,ay])}); }
    if(kind==="treemap"){ const sz=el.dataset.size; C.treemap(el,{height:520,groups:M.groups.map(g=>{ const kids=M.companies.filter(x=>x.prim===g.key&&x.m[sz]>0).map(x=>({id:x.id,label:shortName(x.name),value:x.m[sz],fill:`color-mix(in srgb, ${g.color} 30%, var(--surface))`,sub:fmtPlain(sz,x.m[sz])})); return {key:g.key,label:g.short,color:g.color,value:kids.reduce((a,b)=>a+b.value,0),children:kids,sub:fmtPlain(sz,kids.reduce((a,b)=>a+b.value,0))}; }),tipLeaf:k=>esc(k.label),tipGroup:g=>esc(g.label)}); }
    if(kind==="fin"){ if(c.fin) C.combo(el,{height:230,cats:c.fin.cats,fmt:v=>(v<0?MINUS:"")+nf(v,1),bars:[{key:"rev",label:"Revenue",values:c.fin.rev,color:"var(--viz-1)"},{key:"pat",label:"PAT",values:c.fin.pat,color:"var(--viz-3)"}],tip:()=>"",line:{values:c.fin.cats.map((_,j)=>c.fin.rev[j]?c.fin.pat[j]/c.fin.rev[j]*100:null),color:"var(--viz-2)",short:"PAT margin",fmt:v=>v==null?"":v.toFixed(1)+"%",tick:v=>v+"%",axis:"PAT margin %",tipFn:()=>""},yLabel:"₹ cr"});
      else C.columns(el,{height:230,items:[{label:"Revenue",value:c.m.r},{label:"EBITDA",value:c.m.e},{label:"Net profit",value:c.m.p}],fmt:v=>(v<0?MINUS:"")+nf(v,1),yLabel:"₹ cr",tip:()=>""}); }
    if(kind==="radar"&&CRIT.length) C.radar(el,{height:250,axes:radarAxes(),series:radarSeries(c)});
    if(kind==="river"&&PUI) PUI.drawSlide(el);
  });
}
function fitSlides(root){
  root.querySelectorAll(".sb").forEach(sb=>{ const f=sb.firstElementChild, cs=getComputedStyle(sb);
    const W=sb.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight), H=sb.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    const fits=s=>{ f.style.width=(W/s)+"px"; return f.scrollHeight*s<=H+0.5 && f.scrollWidth*s<=W+0.5; };
    let lo=0.5, hi=1; if(fits(1)){ lo=1; } else { for(let i=0;i<10;i++){ const mid=(lo+hi)/2; if(fits(mid)) lo=mid; else hi=mid; } }
    f.style.width=(W/lo)+"px"; f.style.transform=`scale(${lo})`; f.dataset.scale=lo.toFixed(3);
    if(f.scrollHeight*lo>H+1) sb.dataset.overflow="1"; });
  const pages=root.querySelectorAll(".slide"); pages.forEach((p,i)=>{ const pg=p.querySelector(".pg"); if(pg) pg.textContent=`Page ${i+1} of ${pages.length}`; });
}
function buildPack(){ const pack=document.getElementById("pack"); pack.innerHTML=slidesHtml(route().st); document.body.classList.add("printing"); pack.style.display="block"; drawSlideCharts(pack); fitSlides(pack); return pack; }
function exportPack(){ buildPack(); setTimeout(()=>{ window.print(); },60); }
addEventListener("afterprint",()=>{ document.body.classList.remove("printing","print-compare"); const p=document.getElementById("pack"); if(p&&!document.body.classList.contains("pack-preview")){ p.innerHTML=""; p.style.display=""; } });

// Presentation mode: the same slides, full screen, arrow keys to move.
const Present={ i:0, n:0, slides:[],
  open(start){ const p=document.getElementById("present"); if(!p) return; p.hidden=false; const stage=p.querySelector(".pv-stage");
    stage.innerHTML=slidesHtml(route().st); this.slides=[...stage.querySelectorAll(".slide")]; this.n=this.slides.length; this.slides.forEach(s=>s.classList.add("pv-slide"));
    drawSlideCharts(stage); fitSlides(stage); this.layout();
    p.querySelector(".pv-bar").innerHTML=`<button class="btn sm" type="button" data-pv="prev" aria-label="Previous slide">${icon("prev")}</button><span class="num pv-count"></span><button class="btn sm" type="button" data-pv="next" aria-label="Next slide">${icon("next")}</button><div class="pv-dots">${this.slides.map((s,j)=>`<button type="button" data-pv-i="${j}" aria-label="Slide ${j+1}"></button>`).join("")}</div><span class="grow"></span><span>${esc(M.product)} · Confidential</span><button class="btn sm" type="button" data-pv="pack">${icon("print")}IC pack</button><button class="btn sm" type="button" data-pv="close">Exit · Esc</button>`;
    p.querySelectorAll("[data-pv]").forEach(b=>b.onclick=()=>{ const a=b.dataset.pv; if(a==="prev") this.go(this.i-1); else if(a==="next") this.go(this.i+1); else if(a==="close") this.close(); else if(a==="pack"){ this.close(); exportPack(); } });
    p.querySelectorAll("[data-pv-i]").forEach(b=>b.onclick=()=>this.go(+b.dataset.pvI));
    stage.onclick=e=>{ if(e.target===stage) this.go(this.i+1); };
    this._rz=()=>this.layout(); addEventListener("resize",this._rz);
    try{ if(document.documentElement.requestFullscreen&&!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); }catch(e){}
    this.go(start||0); p.querySelector("[data-pv=next]").focus(); },
  layout(){ const stage=document.querySelector("#present .pv-stage"); if(!stage) return; const W=stage.clientWidth, H=stage.clientHeight; const s=Math.max(.2,Math.min((W-32)/1280,(H-24)/720)); this.slides.forEach(sl=>{ sl.style.transform=`translate(-50%,-50%) scale(${s})`; }); },
  go(i){ if(!this.n) return; this.i=Math.max(0,Math.min(this.n-1,i)); this.slides.forEach((s,j)=>s.classList.toggle("on",j===this.i));
    const p=document.getElementById("present"); p.querySelector(".pv-count").textContent=`${this.i+1} / ${this.n}`; p.querySelectorAll("[data-pv-i]").forEach((b,j)=>b.setAttribute("aria-current",j===this.i)); },
  close(){ const p=document.getElementById("present"); if(!p||p.hidden) return; p.hidden=true; p.querySelector(".pv-stage").innerHTML=""; this.slides=[]; this.n=0; removeEventListener("resize",this._rz); C.Tip.hide();
    try{ if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }catch(e){} document.getElementById("presentBtn")?.focus(); },
  key(e){ const k=e.key; if(["ArrowRight","PageDown"," ","Enter"].includes(k)){ e.preventDefault(); this.go(this.i+1); } else if(["ArrowLeft","PageUp","Backspace"].includes(k)){ e.preventDefault(); this.go(this.i-1); } else if(k==="Home"){ e.preventDefault(); this.go(0); } else if(k==="End"){ e.preventDefault(); this.go(this.n-1); } else if(k==="Escape"){ e.preventDefault(); this.close(); } } };
document.addEventListener("fullscreenchange",()=>{ if(!document.fullscreenElement&&!document.getElementById("present")?.hidden) Present.layout(); });

PAGES.pipeline = (main, st, arg, same)=>{ if(!PUI){ main.innerHTML=`<div class="empty">Pipeline module missing.</div>`; return; } PUI.page(main, st, arg, same); };
const PUI = window.PipelineUI ? window.PipelineUI({M,G,MET,C,esc,fmt,fmtPlain,href,go,route,withState,filterOnly,pill,icon,shortName,totalScore,toast,nf,PIPE,RM,addCompare,download,present:()=>Present.open()}) : null;

// ---------- boot ----------
PIPE.init();
shell();
addEventListener("hashchange", render);
addEventListener("popstate", render);
let rz, rw=innerWidth; addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ if(Math.abs(innerWidth-rw)>40 && !document.body.classList.contains("printing") && document.getElementById("present").hidden){ rw=innerWidth; lastKey=""; OV.tmKey=""; render(); } },200); });
render();
if(route().st.pack){ buildPack(); document.body.classList.add("pack-preview"); document.documentElement.setAttribute("data-pack-ready","1"); }
else if(route().st.pv){ Present.open(route().st.pv-1); }
window.__APP = { render, route, filtered, sorted, fmt, fmtPlain, buildPack, M, PREV, PAGES, OV, SCR, SL, Present, PIPE, PUI };
})();
