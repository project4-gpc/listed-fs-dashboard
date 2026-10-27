/* Greater Pacific dashboard kit — app shell and pages. Renders window.MODEL only; never computes or alters a
   source figure (derived values come from kit/model.js and the dashboard's adapter). All state lives in the URL. */
(function(){
"use strict";
const C = window.Charts, K = window.Kit, esc = C.esc;
const DATA = window.DATA || {};
const M = window.Adapter.build(DATA.cur || {});
const PREV = DATA.prev ? window.Adapter.build(DATA.prev) : null;
M.changes = K.diff(M, PREV, M.changeRules || {});
M.prevLabel = DATA.prevLabel || null;
const byId = new Map(M.companies.map(c=>[c.id,c]));
const G = Object.fromEntries(M.groups.map(g=>[g.key,g]));
const MET = M.metrics;
const TEXT = M.textCols || {};
const LOGO = DATA.logo || "";
window.MODEL = M;

// scores (0..1 per criterion) — data layer; weights are a UI choice kept in the URL
const CRIT = M.scoring ? M.scoring.criteria : [];
M.companies.forEach(c=>{ c.sc = M.scoring ? M.scoring.score(c, M.companies) : {}; });

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
const ICON = {
  overview:'<path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z"/>',
  screener:'<path d="M3 5h18M3 12h18M3 19h18M8 5v14"/>',
  company:'<path d="M4 21V4h10v17M14 9h6v12M7 8h4M7 12h4M7 16h4M17 13h1M17 17h1"/>',
  shortlist:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  compare:'<path d="M4 4h6v16H4zM14 4h6v16h-6z"/>',
  dq:'<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  method:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  collapse:'<path d="M15 6l-6 6 6 6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  down:'<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>',
  print:'<path d="M6 9V3h12v6M6 17H4v-7h16v7h-2M6 14h12v7H6z"/>',
  link:'<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  cols:'<path d="M4 4h16v16H4zM10 4v16M16 4v16"/>',
  prev:'<path d="M15 6l-6 6 6 6"/>', next:'<path d="M9 6l6 6-6 6"/>'
};
const icon = (k,extra="")=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON[k]||""}</svg>`;

// ---------- URL state ----------
const list = s=>s?s.split(",").filter(Boolean).map(decodeURIComponent):[];
function parseR(s){ const o={}; list(s).forEach(p=>{ const [k,v]=p.split(":"); if(!k||!v) return; const [a,b]=v.split("~"); o[k]=[a===""?null:+a, b===undefined||b===""?null:+b]; }); return o; }
function parseW(s){ const o={}; list(s).forEach(p=>{ const [k,v]=p.split(":"); if(k&&v!=null&&isFinite(+v)) o[k]=+v; }); return o; }
function route(){
  const h = location.hash.replace(/^#/,"") || "/overview";
  const [path, qs] = h.split("?"); const parts = path.split("/").filter(Boolean);
  const q = new URLSearchParams(qs||"");
  return { page: parts[0]||"overview", arg: decodeURIComponent(parts.slice(1).join("/")||""), st: {
    q:q.get("q")||"", g:list(q.get("g")), t:list(q.get("t")), r:parseR(q.get("r")), s:list(q.get("s")),
    c:list(q.get("c")), v:q.get("v")||"", cols:list(q.get("cols")), heat:q.get("heat")==="1", w:parseW(q.get("w")),
    ax:q.get("ax")||"", ay:q.get("ay")||"", pack:q.get("pack")==="1" } };
}
function qs(st){
  const q=[]; const e=encodeURIComponent;
  if(st.q) q.push("q="+e(st.q));
  if(st.g&&st.g.length) q.push("g="+st.g.map(e).join(","));
  if(st.t&&st.t.length) q.push("t="+st.t.map(e).join(","));
  const r=Object.entries(st.r||{}).filter(([k,v])=>v&&(v[0]!=null||v[1]!=null)); if(r.length) q.push("r="+r.map(([k,v])=>`${k}:${v[0]??""}~${v[1]??""}`).join(","));
  if(st.s&&st.s.length) q.push("s="+st.s.join(","));
  if(st.c&&st.c.length) q.push("c="+st.c.map(e).join(","));
  if(st.v) q.push("v="+e(st.v)); if(st.cols&&st.cols.length) q.push("cols="+st.cols.join(","));
  if(st.heat) q.push("heat=1");
  const w=Object.entries(st.w||{}); if(w.length) q.push("w="+w.map(([k,v])=>`${k}:${v}`).join(","));
  if(st.ax) q.push("ax="+st.ax); if(st.ay) q.push("ay="+st.ay);
  return q.length?"?"+q.join("&"):"";
}
const href = (page, arg, st)=>`#/${page}${arg?"/"+encodeURIComponent(arg):""}${qs(st||{})}`;
function go(page, arg, st, replace){ const h=href(page,arg,st); if(replace) history.replaceState(null,"",h); else history.pushState(null,"",h); render(); }
const filterOnly = st=>({q:st.q,g:st.g,t:st.t,r:st.r});
const withState = (st, patch)=>({...st, ...patch});

// ---------- filtering + sorting ----------
const TOG = Object.fromEntries(M.filters.toggles.map(t=>[t.key,t]));
function filtered(st, cs){
  cs = cs || M.companies; const q=(st.q||"").toLowerCase();
  return cs.filter(c=>{
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
  const val=(c,k)=> k==="name"?c.name : k==="ev"?(c.ev?1:0) : k==="score"?totalScore(c,st) : (c.nm&&c.nm[k])?null : c.m[k];
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

// ---------- shell ----------
const NAV = [["overview","Overview"],["screener","Screener"],["shortlist","Shortlist"],["compare","Compare"],["dq","Data quality"],["method","Methodology"]];
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
    <span class="grow"></span>
    <span class="caption hide-m num" title="${esc(M.asofNote)}">As of ${esc(M.asof||"n/a")}</span>
    <span class="pill ${f.tone}" data-tip="${esc(M.asofNote)}" tabindex="0">${esc(f.label)}</span>
    <button class="iconbtn searchbtn" id="searchBtn" aria-label="Search companies (Ctrl+K)">${icon("search")}<span class="lbl">Search companies</span><kbd>Ctrl K</kbd></button>
    <button class="btn hide-m" id="packBtn" type="button">${icon("print")}Export IC pack</button>
    <span class="conf conf-wide">Confidential – internal use only</span>
  </header>
  <div class="shell" id="shell">
    <nav class="side" id="side" aria-label="Main">
      <button class="iconbtn" id="collapseBtn" aria-label="Collapse sidebar" style="align-self:flex-end">${icon("collapse")}</button>
      ${NAV.map(([k,l])=>`<a href="#/${k}" data-nav="${k}">${icon(k==="method"?"method":k)}<span>${l}</span>${k==="shortlist"?`<span class="ct" id="slCount"></span>`:""}</a>`).join("")}
      <div class="sep"></div>
      <a href="#/dev/gallery" data-nav="dev">${icon("cols")}<span>Chart gallery (dev)</span></a>
      <div class="foot">${esc(M.sourceLine||"")}</div>
    </nav>
    <div class="scrim" id="scrim"></div>
    <main class="main" id="main" tabindex="-1"></main>
  </div>
  <div class="modal" id="search" hidden role="dialog" aria-modal="true" aria-label="Search companies">
    <div class="sbox"><input id="sq" type="search" placeholder="Company, ticker or keyword…" autocomplete="off" aria-controls="sres"><ul class="sres" id="sres" role="listbox"></ul></div>
  </div>
  <div class="tip" id="tip" hidden></div><div class="toast" id="toast" hidden></div><div id="pack"></div>`;
  const shellEl=document.getElementById("shell");
  try{ if(localStorage.getItem("gpc-side-collapsed")==="1") shellEl.classList.add("collapsed"); }catch(e){}
  document.getElementById("collapseBtn").onclick=()=>{ shellEl.classList.toggle("collapsed"); try{ localStorage.setItem("gpc-side-collapsed",shellEl.classList.contains("collapsed")?"1":"0"); }catch(e){} };
  const db=document.getElementById("drawerBtn");
  const setDrawer=open=>{ document.body.classList.toggle("drawer-open",open); db.setAttribute("aria-expanded",open); if(open) document.querySelector(".side a")?.focus(); };
  db.onclick=()=>setDrawer(!document.body.classList.contains("drawer-open"));
  document.getElementById("scrim").onclick=()=>setDrawer(false);
  document.getElementById("side").addEventListener("click",e=>{ if(e.target.closest("a")) setDrawer(false); });
  document.getElementById("searchBtn").onclick=openSearch;
  document.getElementById("packBtn").onclick=()=>exportPack();
  addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); openSearch(); }
    if(e.key==="Escape"){ closeSearch(); setDrawer(false); closePops(); }
  });
  // tooltips for any [data-tip]
  document.addEventListener("mouseover",e=>{ const t=e.target.closest("[data-tip]"); if(t) C.Tip.show(esc(t.getAttribute("data-tip")).replace(/\n/g,"<br>"),e); });
  document.addEventListener("mousemove",e=>{ if(e.target.closest("[data-tip]")) C.Tip.move(e); });
  document.addEventListener("mouseout",e=>{ if(e.target.closest("[data-tip]")) C.Tip.hide(); });
  document.addEventListener("focusin",e=>{ const t=e.target.closest("[data-tip]"); if(t){ const r=t.getBoundingClientRect(); C.Tip.show(esc(t.getAttribute("data-tip")).replace(/\n/g,"<br>"),{clientX:r.left,clientY:r.bottom}); } });
  document.addEventListener("focusout",()=>C.Tip.hide());
}
function toast(m){ const t=document.getElementById("toast"); t.textContent=m; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2600); }

// ---------- search ----------
let sIdx=0, sItems=[];
function openSearch(){ const m=document.getElementById("search"); m.hidden=false; const i=document.getElementById("sq"); i.value=""; doSearch(""); i.focus();
  i.oninput=()=>doSearch(i.value); i.onkeydown=e=>{ if(e.key==="ArrowDown"){e.preventDefault();sIdx=Math.min(sItems.length-1,sIdx+1);paintS();} if(e.key==="ArrowUp"){e.preventDefault();sIdx=Math.max(0,sIdx-1);paintS();} if(e.key==="Enter"&&sItems[sIdx]){ e.preventDefault(); closeSearch(); location.hash=sItems[sIdx].href; } if(e.key==="Tab"){e.preventDefault();} };
  m.onclick=e=>{ if(e.target===m) closeSearch(); }; }
function closeSearch(){ const m=document.getElementById("search"); if(m&&!m.hidden){ m.hidden=true; document.getElementById("searchBtn")?.focus(); } }
function doSearch(q){
  q=q.trim().toLowerCase(); const st=route().st;
  const score=c=>{ if(!q) return c.shortlisted?2:1; const n=c.name.toLowerCase(); if(n.startsWith(q)) return 5; if((c.ticker||"").toLowerCase()===q) return 5; if(n.includes(q)) return 4; if((c.ticker+" "+c.code).toLowerCase().includes(q)) return 3; if((c.desc+" "+c.seg+" "+c.groups.map(g=>G[g.key]?.label).join(" ")).toLowerCase().includes(q)) return 1; return 0; };
  sItems = M.companies.map(c=>({c,s:score(c)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||a.c.name.localeCompare(b.c.name)).slice(0,12).map(x=>({c:x.c,href:href("company",x.c.id,filterOnly(st))}));
  const pages = NAV.filter(([k,l])=>q&&l.toLowerCase().includes(q)).map(([k,l])=>({page:l,href:href(k,"",st)}));
  sItems = pages.concat(sItems); sIdx=0; paintS(q);
}
function paintS(q){ const ul=document.getElementById("sres"); const hl=s=>{ if(!q) return esc(s); const i=s.toLowerCase().indexOf(q); return i<0?esc(s):esc(s.slice(0,i))+"<mark>"+esc(s.slice(i,i+q.length))+"</mark>"+esc(s.slice(i+q.length)); };
  ul.innerHTML = sItems.length ? sItems.map((it,i)=>it.page?`<li><a href="${it.href}" role="option" aria-selected="${i===sIdx}">Go to ${esc(it.page)}<span class="k">page</span></a></li>`:`<li><a href="${it.href}" role="option" aria-selected="${i===sIdx}"><span>${hl(it.c.name)}</span><span class="k">${esc([it.c.ticker,G[it.c.prim]?.short].filter(Boolean).join(" · "))}</span></a></li>`).join("") : `<li class="empty">No company matches “${esc(q||"")}”.</li>`;
  ul.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>closeSearch()));
  ul.querySelector('[aria-selected="true"]')?.scrollIntoView({block:"nearest"}); }

// ---------- filter chips ----------
function rangeLabel(k,[a,b]){ const m=MET[k]; const u=m.fmt==="cr"?"":m.fmt==="x"?"x":"%"; return `${m.short} ${a!=null?a:"…"}–${b!=null?b:"…"}${u}`; }
function chips(st, page){
  const items=[];
  if(st.q) items.push({label:`“${st.q}”`, rm:{q:""}});
  (st.g||[]).forEach(k=>G[k]&&items.push({label:G[k].short, rm:{g:st.g.filter(x=>x!==k)}}));
  (st.t||[]).forEach(k=>TOG[k]&&items.push({label:TOG[k].label, rm:{t:st.t.filter(x=>x!==k)}}));
  Object.entries(st.r||{}).forEach(([k,v])=>{ if(MET[k]&&(v[0]!=null||v[1]!=null)){ const r={...st.r}; delete r[k]; items.push({label:rangeLabel(k,v), rm:{r}}); } });
  if(!items.length) return "";
  return `<div class="chipbar" role="region" aria-label="Active filters">${items.map((it,i)=>`<span class="fchip">${esc(it.label)}<button type="button" data-chip="${i}" aria-label="Remove filter ${esc(it.label)}">${icon("x")}</button></span>`).join("")}<button type="button" class="linkbtn" data-reset>Reset</button></div>`;
  // handlers bound in bindChips
}
function bindChips(root, st, page, arg){
  const items=[]; if(st.q) items.push({q:""}); (st.g||[]).forEach(k=>G[k]&&items.push({g:st.g.filter(x=>x!==k)})); (st.t||[]).forEach(k=>TOG[k]&&items.push({t:st.t.filter(x=>x!==k)}));
  Object.entries(st.r||{}).forEach(([k,v])=>{ if(MET[k]&&(v[0]!=null||v[1]!=null)){ const r={...st.r}; delete r[k]; items.push({r}); } });
  root.querySelectorAll("[data-chip]").forEach(b=>b.onclick=()=>go(page,arg,withState(st,items[+b.dataset.chip])));
  root.querySelectorAll("[data-reset]").forEach(b=>b.onclick=()=>go(page,arg,withState(st,{q:"",g:[],t:[],r:{}})));
}

// ---------- pages ----------
const PAGES = {};
let lastPage="", lastKey="";
function render(){
  const {page,arg,st} = route();
  document.querySelectorAll("[data-nav]").forEach(a=>{ const k=a.dataset.nav; a.href = k==="dev"?"#/dev/gallery":href(k,"",withState(st,{c:k==="compare"?st.c:[]})); if(k===page||(page==="company"&&k==="screener")) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  const sl=document.getElementById("slCount"); if(sl) sl.textContent=M.companies.filter(c=>c.shortlisted).length;
  const main=document.getElementById("main");
  const fn = PAGES[page] || PAGES.overview;
  const key=page+"|"+arg;
  C.Tip.hide();
  fn(main, st, arg, key===lastKey);
  if(key!==lastKey){ if(lastKey) { main.focus({preventScroll:true}); scrollTo({top:0}); } }
  lastKey=key; lastPage=page;
  document.title = `${({overview:"Overview",screener:"Screener",company:(byId.get(arg)||{}).name||"Company",shortlist:"Shortlist",compare:"Compare",dq:"Data quality",method:"Methodology",dev:"Chart gallery"})[page]||"Overview"} · ${M.product}`;
}

// Overview -----------------------------------------------------------
function kpiVal(k, cs){ return k.value(cs); }
PAGES.overview = (main, st)=>{
  const cs=M.companies, prevCs=PREV?PREV.companies:null;
  const ch=M.changes;
  const vals=Object.fromEntries(M.kpis.map(k=>[k.key,k.value(cs)]));
  const chTxt = ch==null?"no previous snapshot to compare with yet":ch.length?`${ch.length} change${ch.length>1?"s":""} since the last refresh`:"no changes since the last refresh";
  const head = M.key==="fs"
    ? `${vals.universe} companies screened; ${vals.fit} fit the mandate; ${vals.short} on the shortlist; ${chTxt}.`
    : `${vals.universe} companies on the outreach list; ${vals.profitable} profitable; ${vals.evaluated} evaluated; ${vals.short} on the shortlist; ${chTxt}.`;
  const tiles=M.kpis.map(k=>{ const v=vals[k.key], pv=prevCs?k.value(prevCs):null; let d="";
    if(pv!=null&&v!=null){ const diff=v-pv; const ad=Math.abs(diff), dp=ad<0.05?2:1, dtxt = k.fmt==="int"?String(ad) : k.fmt==="x"?nf(ad,dp)+"x" : k.fmt==="pct"||k.fmt==="chg"?nf(ad,dp)+" pp" : "₹"+nf(ad,dp)+" cr";
    d = ad<1e-9?`<span class="delta na">No change vs previous</span>`:`<span class="delta ${diff>0?"pos":"neg"}">${diff>0?"▲":"▼"} ${dtxt} vs previous</span>`; }
    else d=`<span class="delta na">${PREV?"–":"No previous snapshot"}</span>`;
    const body=`<span class="eyebrow">${esc(k.label)}</span><span class="kpi-v">${k.fmt==="int"?(v??"–"):fmt(null,v,null,{fmt:k.fmt})}${k.fmt==="cr"?"<small> ₹ cr</small>":""}</span>${d}<span class="ctx">${esc(k.ctx(cs))}</span>`;
    return k.link?`<a class="kpi" href="${href("screener","",k.link)}">${body}</a>`:`<div class="kpi">${body}</div>`; }).join("");
  const funnel=M.funnel.map(s=>({...s,n:filtered(s.state).length}));
  const ax=st.ax&&MET[st.ax]?st.ax:M.scatter.x, ay=st.ay&&MET[st.ay]?st.ay:M.scatter.y;
  main.innerHTML=`
    <div class="ph"><div><span class="eyebrow">Overview · as of ${esc(M.asof||"n/a")}</span><h1>Where we stand</h1></div></div>
    <p class="headline">${esc(head.charAt(0).toUpperCase()+head.slice(1))}</p>
    <section class="kpis" aria-label="Key figures">${tiles}</section>
    <div class="grid g-main" style="margin-top:var(--s-4)">
      <section class="card"><div class="card-h"><div><h2 id="scT"></h2><div class="sub" id="scS"></div></div>
        <div class="axes"><label for="ax">X</label><select id="ax">${M.scatter.axes.map(k=>`<option value="${k}" ${k===ax?"selected":""}>${esc(MET[k].label)}</option>`).join("")}</select><label for="ay">Y</label><select id="ay">${M.scatter.axes.map(k=>`<option value="${k}" ${k===ay?"selected":""}>${esc(MET[k].label)}</option>`).join("")}</select></div></div>
        <div id="sc"></div><div class="legend" id="scL"></div></section>
      <div class="stack">
        <section class="card"><div class="card-h"><div><h2>Screening funnel</h2><div class="sub">Companies passing each stage · click to open in the screener</div></div></div>
          <div class="funnel">${funnel.map(s=>`<a class="fstage" href="${href("screener","",s.state)}"><span><span class="l">${esc(s.label)}</span><br><span class="d">${esc(s.desc)}</span></span><b>${s.n}</b><span class="bar"><i style="width:${(s.n/Math.max(1,funnel[0].n)*100).toFixed(1)}%"></i></span></a>`).join("")}</div></section>
        <section class="card"><div class="card-h"><div><h2>What changed since the last refresh</h2><div class="sub">${PREV?`Compared with ${esc(PREV.asof||M.prevLabel||"the previous snapshot")}`:"Snapshot history builds up from the next refresh"}</div></div></div>
          ${ch==null?`<div class="empty">No previous snapshot to compare with yet.</div>`: ch.length?`<ul class="chg">${ch.slice(0,40).map(x=>`<li>${pill(x.kind==="failed"?"Failed":x.tone==="pos"?"Up":x.tone==="neg"?"Down":"Change",x.tone==="info"?"info":x.tone)}<span class="what">${x.id?`<a href="${href("company",x.id,{})}">${esc(x.name)}</a>`:esc(x.name)}: ${esc(x.text)}</span><span class="v">${esc(x.value||"")}</span></li>`).join("")}</ul>${ch.length>40?`<p class="caption">${ch.length-40} more not shown.</p>`:""}`:`<div class="empty">No changes since the last refresh.</div>`}
        </section>
      </div>
    </div>`;
  drawOverviewScatter(st, ax, ay);
  main.querySelector("#ax").onchange=e=>go("overview","",withState(st,{ax:e.target.value}));
  main.querySelector("#ay").onchange=e=>go("overview","",withState(st,{ay:e.target.value}));
};
function scatterTip(c, ax, ay){ return `<b>${esc(c.name)}</b>${c.ticker?` (${esc(c.ticker)})`:""}: ${esc(MET[ax].label)} ${esc(fmtPlain(ax,c.m[ax]))}, ${esc(MET[ay].label)} ${esc(fmtPlain(ay,c.m[ay]))}.${c.shortlisted?" On the shortlist.":""}`; }
function drawOverviewScatter(st, ax, ay){
  const hidden=new Set(scatterHidden), anySl=M.companies.some(c=>c.shortlisted);
  const pts=M.companies.map(c=>{ const g=G[c.prim]||{}; return {id:c.id, x:c.nm[ax]?null:c.m[ax], y:c.nm[ay]?null:c.m[ay], color:g.color, shape:g.shape, series:c.prim, label:c.shortlisted?shortName(c.name):null, faded:(anySl&&!c.shortlisted) || hidden.has(c.prim), c}; }).filter(p=>!hidden.has(p.series)||p.label);
  const n=pts.filter(p=>p.x!=null&&p.y!=null).length;
  const sl=M.companies.filter(c=>c.shortlisted&&c.m[ax]!=null&&c.m[ay]!=null);
  const medY=K.median(M.companies.map(c=>c.m[ay]));
  document.getElementById("scT").textContent = sl.length? `${sl.length} shortlisted compan${sl.length>1?"ies":"y"} against the universe` : `${n} companies by ${MET[ax].label} and ${MET[ay].label}`;
  document.getElementById("scS").textContent = `${MET[ax].label} (${unitOf(ax)}) vs ${MET[ay].label} (${unitOf(ay)}) · as of ${M.asof||"n/a"} · dashed line = universe median`;
  C.scatter(document.getElementById("sc"), {points:pts, domainAll:true, xLabel:`${MET[ax].label} (${unitOf(ax)})`, yLabel:`${MET[ay].label} (${unitOf(ay)})`,
    band: M.mandate&&ax===M.mandate.metric?[M.mandate.lo,M.mandate.hi]:null, bandLabel:M.mandate?M.mandate.label:"", medianY:medY,
    xTick:v=>tick(ax,v), yTick:v=>tick(ay,v), tip:p=>scatterTip(p.c,ax,ay), onClick:id=>go("company",id,filterOnly(st)), aria:`Scatter of ${MET[ax].label} against ${MET[ay].label}`});
  legendFor(document.getElementById("scL"), ()=>drawOverviewScatter(st,ax,ay), (anySl?"Shortlist labelled · others faded · ":"")+"shape and colour = "+M.groupLabel.toLowerCase()+" · click a legend item to isolate it");
}
let scatterHidden=[];
function legendFor(host, redraw, note){
  const used=[...new Set(M.companies.map(c=>c.prim))];
  const items=M.groups.filter(g=>used.includes(g.key)&&!g.other).map(g=>({key:g.key,label:g.short,color:g.color,shape:g.shape,on:!scatterHidden.includes(g.key)}));
  if(M.groups.some(g=>g.other&&used.includes(g.key))) items.push({key:"__other",label:"Other "+M.groupLabelPlural.toLowerCase(),color:"var(--viz-muted)",shape:"circle",on:true});
  C.legend(host, items, k=>{ if(k==="__other") return; const solo = scatterHidden.length===items.length-1-(items.some(i=>i.key==="__other")?1:0) && !scatterHidden.includes(k);
    scatterHidden = solo ? [] : items.filter(i=>i.key!==k&&i.key!=="__other").map(i=>i.key); redraw(); }, note);
}
const shortName = n=>n.replace(/\b(Limited|Ltd\.?|Private|Pvt\.?|Corporation|Company)\b/gi,"").replace(/\s+/g," ").trim().slice(0,26);
function tick(k,v){ const f=(MET[k]||{}).fmt; if(f==="x") return v+"x"; if(f==="pct"||f==="chg") return v+"%"; if(f==="pp") return v+" pp"; return v.toLocaleString("en-IN"); }

// Screener -----------------------------------------------------------
const ALLCOLS = ()=>Object.keys(MET).concat(Object.keys(TEXT));
function colsFor(st){ if(st.cols&&st.cols.length) return st.cols.filter(k=>MET[k]||TEXT[k]); const v=M.views.find(v=>v.key===st.v)||M.views[0]; return v.cols; }
function colDef(k){ const m=MET[k]||TEXT[k]; return m; }
function headerTip(k){ const m=colDef(k); return [m.label||k, m.def?`Definition: ${m.def}`:"", m.formula&&m.formula!=="—"?`Formula: ${m.formula}`:"", m.source?`Source: ${m.source}`:"", `As of: ${m.asof||M.asof||"n/a"}`, (MET[k]&&MET[k].fmt!=="spark")?"Click to sort · Shift+click to add a sort key":""].filter(Boolean).join("\n"); }
function heatClass(k, v, stats){ if(v==null||!stats[k]) return ""; const {q1,q3}=stats[k], b=(MET[k]||{}).better; if(!b) return ""; const good=b==="high"?v>=q3:v<=q1, bad=b==="high"?v<=q1:v>=q3; return good?"heat-p1":bad?"heat-n1":""; }
PAGES.screener = (main, st, arg, same)=>{
  if(!same || !main.querySelector("#res")){
    main.innerHTML=`<div class="ph"><div><span class="eyebrow">Screener</span><h1>All companies</h1><p>Filter on the left; every filter, sort and column choice is saved in the link, so you can bookmark or send any view.</p></div></div>
      <div id="chips"></div>
      <div class="scr-layout"><aside class="card" aria-label="Filters"><details class="fold" open><summary>Filters ${icon("down","style='width:var(--icon)'")}</summary><div class="fpanel" id="fp"></div></details></aside><section class="card flush" id="res"></section></div>`;
    paintFilters(main.querySelector("#fp"), st);
  } else syncFilters(main.querySelector("#fp"), st);
  const ch=main.querySelector("#chips"); ch.innerHTML=chips(st); bindChips(ch, st, "screener", "");
  paintTable(main.querySelector("#res"), st);
};
function paintFilters(fp, st){
  const rng=M.filters.ranges.map(k=>{ const vals=M.companies.map(c=>c.m[k]).filter(v=>v!=null&&isFinite(v)); const lo=Math.min(...vals), hi=Math.max(...vals);
    return `<div><div class="rlab"><span>${esc(MET[k].label)}</span><em>${esc(fmtPlain(k,lo).replace("₹",""))} to ${esc(fmtPlain(k,hi).replace("₹",""))}</em></div><div class="rng"><input class="inp" type="number" step="any" data-r="${k}" data-side="0" placeholder="min" aria-label="${esc(MET[k].label)} minimum"><span>to</span><input class="inp" type="number" step="any" data-r="${k}" data-side="1" placeholder="max" aria-label="${esc(MET[k].label)} maximum"></div></div>`; }).join("");
  const used=M.groups.filter(g=>g.n>0);
  fp.innerHTML=`
    <div class="fgrp"><span class="eyebrow">Quick screens</span><div class="pills">${M.presets.map(p=>`<button class="btn sm" type="button" data-preset="${p.key}" data-tip="${esc(p.desc)}">${esc(p.label)}</button>`).join("")}<button class="btn sm" type="button" data-preset="__reset">Reset</button></div></div>
    <div class="fgrp"><label class="eyebrow" for="fq">Search</label><input class="inp" id="fq" type="search" placeholder="Name, ticker or keyword"></div>
    <div class="fgrp"><span class="eyebrow">${esc(M.groupLabel)}</span><div class="pills" id="gch">${used.map(g=>`<button type="button" class="gchip" data-g="${g.key}" aria-pressed="false" title="${esc(g.label)}"><span class="dot" style="background:${g.color}"></span>${esc(g.short)} <span class="n">${g.n}</span></button>`).join("")}</div></div>
    <div class="fgrp"><span class="eyebrow">Conditions</span>${M.filters.toggles.map(t=>`<label class="chk"><input type="checkbox" data-t="${t.key}">${esc(t.label)}</label>`).join("")}</div>
    <div class="fgrp"><span class="eyebrow">Ranges</span>${rng}</div>`;
  let deb;
  fp.querySelector("#fq").addEventListener("input",e=>{ clearTimeout(deb); const v=e.target.value; deb=setTimeout(()=>go("screener","",withState(route().st,{q:v}),true),180); });
  fp.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ const s=route().st, k=b.dataset.g; go("screener","",withState(s,{g:s.g.includes(k)?s.g.filter(x=>x!==k):s.g.concat(k)})); });
  fp.querySelectorAll("[data-t]").forEach(i=>i.onchange=()=>{ const s=route().st, k=i.dataset.t; go("screener","",withState(s,{t:i.checked?s.t.concat(k):s.t.filter(x=>x!==k)})); });
  fp.querySelectorAll("[data-r]").forEach(i=>i.addEventListener("input",()=>{ clearTimeout(deb); deb=setTimeout(()=>{ const s=route().st, k=i.dataset.r, r={...s.r}; const cur=r[k]?r[k].slice():[null,null]; cur[+i.dataset.side]=i.value===""?null:+i.value; if(cur[0]==null&&cur[1]==null) delete r[k]; else r[k]=cur; go("screener","",withState(s,{r}),true); },250); }));
  fp.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{ const s=route().st; const p=M.presets.find(x=>x.key===b.dataset.preset); go("screener","",withState(s,{q:"",g:[],t:[],r:{},...(p?{t:p.state.t||[],r:p.state.r||{},s:p.state.s||s.s}:{})})); });
  syncFilters(fp, st);
}
function syncFilters(fp, st){
  const fq=fp.querySelector("#fq"); if(document.activeElement!==fq) fq.value=st.q||"";
  fp.querySelectorAll("[data-g]").forEach(b=>b.setAttribute("aria-pressed",st.g.includes(b.dataset.g)));
  fp.querySelectorAll("[data-t]").forEach(i=>i.checked=st.t.includes(i.dataset.t));
  fp.querySelectorAll("[data-r]").forEach(i=>{ if(document.activeElement===i) return; const v=(st.r[i.dataset.r]||[])[+i.dataset.side]; i.value=v==null?"":v; });
}
function tableStats(cs, cols){ const s={}; cols.forEach(k=>{ if(!MET[k]||!MET[k].better) return; const v=cs.map(c=>c.nm&&c.nm[k]?null:c.m[k]).filter(x=>x!=null&&isFinite(x)).sort((a,b)=>a-b); if(v.length>4) s[k]={q1:C.quantile(v,.25),q3:C.quantile(v,.75)}; }); return s; }
function paintTable(res, st){
  const cols=colsFor(st), rows=sorted(filtered(st), st), keys=sortKeys(st), stats=st.heat?tableStats(rows,cols):{};
  const grpOf=k=>(MET[k]||TEXT[k]).group||"";
  const spans=[]; cols.forEach(k=>{ const g=grpOf(k); if(spans.length&&spans[spans.length-1].g===g) spans[spans.length-1].n++; else spans.push({g,n:1}); });
  const starts=new Set(); let i=0; spans.forEach(s=>{ starts.add(cols[i]); i+=s.n; });
  const sortInd=k=>{ const ix=keys.findIndex(x=>x.k===k); if(ix<0) return ""; return `<span class="sortk">${keys[ix].dir>0?"▲":"▼"}${keys.length>1?ix+1:""}</span>`; };
  const ariaSort=k=>{ const x=keys.find(x=>x.k===k); return x?` aria-sort="${x.dir>0?"ascending":"descending"}"`:""; };
  const pend=pendingChanges().length;
  const pb=M.views.map(v=>`<option value="${v.key}" ${(!st.cols.length&&(st.v||M.views[0].key)===v.key)?"selected":""}>${esc(v.label)}</option>`).join("")+(st.cols.length?`<option selected value="__custom">Custom columns</option>`:"")+savedViews().map(v=>`<option value="saved:${esc(v.name)}">★ ${esc(v.name)}</option>`).join("");
  res.innerHTML=`
    <div class="tbar"><b class="num">${rows.length}</b><span class="muted">of ${M.companies.length} companies</span><span class="grow"></span>
      <label class="sr" for="vsel">View</label><select id="vsel" aria-label="Column view">${pb}</select>
      <button class="btn sm" type="button" id="colBtn" aria-haspopup="true">${icon("cols")}Columns</button>
      <label class="chk"><input type="checkbox" id="heat" ${st.heat?"checked":""}>Heat shading</label>
      <button class="btn sm" type="button" id="csvBtn">${icon("down")}CSV</button><button class="btn sm" type="button" id="xlsxBtn">${icon("down")}XLSX</button>
      <button class="btn sm" type="button" id="linkBtn">${icon("link")}Copy link</button></div>
    ${pend?`<div class="tbar" style="background:var(--warning-bg)"><span>${pend} shortlist change${pend>1?"s":""} staged in this browser.</span><span class="grow"></span><a class="btn sm" href="${href("shortlist","",st)}">Review and publish</a></div>`:""}
    <div class="tscroll"><table class="grid-t" aria-rowcount="${rows.length}">
      <thead><tr class="grp"><th class="stk l" rowspan="1"></th>${spans.map(s=>`<th colspan="${s.n}" class="gstart">${esc(s.g)}</th>`).join("")}</tr>
      <tr class="cols"><th class="stk l sortable" data-k="name"${ariaSort("name")} tabindex="0" data-tip="Company name, ticker, ${esc(M.groupLabel.toLowerCase())} and flags. Click to sort.">Company ${sortInd("name")}</th>${cols.map(k=>{ const m=colDef(k), sortable=MET[k]?MET[k].fmt!=="spark":k==="ev";
        return `<th class="${TEXT[k]?"l":""} ${starts.has(k)?"gstart":""} ${sortable?"sortable":""}" data-k="${k}"${ariaSort(k)} ${sortable?'tabindex="0"':""} data-tip="${esc(headerTip(k))}">${esc(m.short||m.label)}${MET[k]&&unitOf(k)&&MET[k].fmt!=="spark"?` <span class="subtle">${esc(unitOf(k))}</span>`:""}${sortInd(k)}</th>`; }).join("")}</tr></thead>
      <tbody>${rows.length?rows.map(c=>`<tr data-id="${c.id}" class="${c.fit?"mandate-edge":""}">
        <td class="stk l first"><span style="display:flex;gap:var(--s-2);align-items:flex-start"><button class="iconbtn" style="height:var(--s-6);min-width:var(--s-6);padding:var(--s-0);color:${isStarred(c)?"var(--warning)":"var(--n-300)"}" data-star="${c.id}" aria-pressed="${isStarred(c)}" aria-label="${isStarred(c)?"Remove from":"Add to"} shortlist: ${esc(c.name)}">${icon("shortlist",isStarred(c)?'fill="currentColor"':"")}</button><span><a class="cname" href="${href("company",c.id,filterOnly(st))}">${esc(c.name)}</a>
          <span class="cmeta">${c.ticker?`<span>${esc(c.exchange)}: ${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}${flagPills(c)}</span></span></span></td>
        ${cols.map(k=>{ if(k==="desc") return `<td class="desc ${starts.has(k)?"gstart":""}">${esc(c.desc)}</td>`; if(k==="ev") return `<td class="${starts.has(k)?"gstart":""}">${c.ev?pill("Yes","pos"):pill("No","neu")}</td>`;
          return `<td class="${starts.has(k)?"gstart":""} ${st.heat?heatClass(k,c.nm&&c.nm[k]?null:c.m[k],stats):""}">${fmt(k,c.m[k],c)}</td>`; }).join("")}</tr>`).join("")
        : `<tr><td class="l" colspan="${cols.length+1}"><div class="empty">No companies match these filters. Remove a chip above or press Reset.</div></td></tr>`}</tbody></table></div>`;
  // events
  res.querySelector("#vsel").onchange=e=>{ const v=e.target.value; if(v.startsWith("saved:")){ const sv=savedViews().find(x=>"saved:"+x.name===v); if(sv) go("screener","",withState(st,{cols:sv.cols,v:""})); } else if(v!=="__custom") go("screener","",withState(st,{v,cols:[]})); };
  res.querySelector("#heat").onchange=e=>go("screener","",withState(st,{heat:e.target.checked}));
  res.querySelector("#colBtn").onclick=e=>colChooser(e.currentTarget, st);
  res.querySelector("#csvBtn").onclick=()=>exportView(st,"csv");
  res.querySelector("#xlsxBtn").onclick=()=>exportView(st,"xlsx");
  res.querySelector("#linkBtn").onclick=()=>{ navigator.clipboard?.writeText(location.href).then(()=>toast("Link to this view copied.")).catch(()=>toast("Copy blocked; use the address bar.")); };
  res.querySelectorAll("th.sortable").forEach(th=>{ const k=th.dataset.k; const act=e=>{ let s=sortKeys(st).map(x=>(x.dir<0?"-":"")+x.k); const cur=s.find(x=>x.replace("-","")===k);
      const nextDir = cur? (cur.startsWith("-")?"":"-") : (k==="name"||TEXT[k]?"":"-");
      if(e.shiftKey){ s = cur? s.map(x=>x===cur?nextDir+k:x) : s.concat(nextDir+k); } else s=[nextDir+k];
      go("screener","",withState(st,{s})); };
    th.addEventListener("click",act); th.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); act(e); } }); });
  res.querySelectorAll("tbody tr[data-id]").forEach(tr=>tr.addEventListener("click",e=>{ if(e.target.closest("a,button")) return; go("company",tr.dataset.id,filterOnly(st)); }));
  res.querySelectorAll("[data-star]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); const c=byId.get(b.dataset.star); const d=draft(); d[c.name]=!isStarred(c); if(d[c.name]===c.shortlisted) delete d[c.name]; setDraft(d); paintTable(res, route().st); toast(`${isStarred(c)?"Staged: add":"Staged: remove"} ${c.name}. Publish from the Shortlist page.`); });
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
  const body=rows.map(c=>[c.name,c.code||c.ticker,c.groups.map(g=>G[g.key]?.label).join("; ")].concat(cols.map(k=>k==="desc"?c.desc:k==="ev"?(c.ev?"Yes":"No"):(c.nm&&c.nm[k])?"n.m.":(c.m[k]==null?"":+c.m[k].toFixed(4)))).concat([c.flags.map(f=>f.label).join("; "), c.shortlisted?"Yes":""]));
  return [head].concat(body);
}
function download(blob, name){ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
function exportView(st, kind){
  const rows=exportRows(st), stamp=new Date().toISOString().slice(0,10), base=`${M.key}-screener-${stamp}`;
  if(kind==="csv"){ const csv=rows.map(r=>r.map(v=>{ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }).join(",")).join("\r\n"); download(new Blob(["﻿"+csv],{type:"text/csv"}),base+".csv"); }
  else download(window.XLSX_LITE.build(rows,"Screener"), base+".xlsx");
  toast(`Exported ${rows.length-1} rows.`);
}

// Company ------------------------------------------------------------
PAGES.company = (main, st, id)=>{
  const c=byId.get(id);
  if(!c){ main.innerHTML=`<div class="empty">No company with id “${esc(id)}”. <a href="${href("screener","",st)}">Back to the screener</a></div>`; return; }
  const list=sorted(filtered(st),st), i=list.findIndex(x=>x.id===c.id), prev=i>0?list[i-1]:null, nxt=i>=0&&i<list.length-1?list[i+1]:null;
  const cfg=M.company;
  main.innerHTML=`
    <div class="co-h"><div>
      <span class="eyebrow"><a href="${href("screener","",st)}">Screener</a> / Company${i>=0?` · ${i+1} of ${list.length} in the current filter`:" · outside the current filter"}</span>
      <h1 style="margin-top:var(--s-1)">${esc(c.name)}</h1>
      <div class="meta">${c.ticker?`<span class="num">${esc(c.exchange)}: ${esc(c.ticker)}</span>`:`<span>${esc(c.exchange)}</span>`}${c.groups.map(g=>gpill(g.key)+(g.pct!=null?` <span class="num subtle">${g.pct}%</span>`:"")).join("")}
        ${c.verdict?pill(c.verdict.label,c.verdict.tone,"Verdict from shortlist diligence"):""}${M.mandate?(c.fit?pill("Mandate fit","info",M.mandate.desc):pill("Outside mandate","neu",M.mandate.desc)):""}${c.shortlisted?pill("Shortlisted","brand"):""}
        <span class="caption">Last refreshed ${esc(M.asof||"n/a")}${c.updated?` · diligence ${esc(c.updated)}`:""}</span></div></div>
      <div class="pn noprint">${prev?`<a class="btn" href="${href("company",prev.id,st)}" aria-label="Previous company: ${esc(prev.name)}">${icon("prev")}Previous</a>`:""}${nxt?`<a class="btn" href="${href("company",nxt.id,st)}" aria-label="Next company: ${esc(nxt.name)}">Next${icon("next")}</a>`:""}
        <a class="btn" href="${href("compare","",withState(filterOnly(st),{c:[...new Set([c.id].concat(M.companies.filter(x=>x.shortlisted&&x.id!==c.id).slice(0,4).map(x=>x.id)))]}))}">${icon("compare")}Compare</a></div></div>
    <section class="kpis" aria-label="Key figures">${cfg.kpis.map(k=>`<div class="kpi"><span class="eyebrow">${esc(MET[k].label)}</span><span class="kpi-v">${kpiValue(c,k)}</span><span class="ctx">${esc(kpiCtx(c,k))}</span></div>`).join("")}</section>
    ${c.desc?`<p class="prose" style="margin-top:var(--s-4)">${esc(c.desc)}</p>`:""}
    <div class="grid g2" style="margin-top:var(--s-4)" id="cg"></div>`;
  const cg=main.querySelector("#cg"); const card=(id,t,sub,body="")=>{ cg.insertAdjacentHTML("beforeend",`<section class="card" id="${id}"><div class="card-h"><div><h2>${t}</h2><div class="sub">${sub}</div></div></div>${body}</section>`); return cg.lastElementChild; };
  if(cfg.fin && c.fin){
    const pat=c.fin.pat, lastG=c.nm.pg?null:c.m.pg;
    const t = lastG!=null? `FY26 PAT ${lastG>=0?"up":"down"} ${Math.abs(lastG).toFixed(0)}% on FY25` : pat[2]!=null?`FY26 PAT ₹${nf(pat[2],1)} cr (growth n.m.)`:"Revenue and PAT";
    const el=card("fin",esc(t),"Revenue and PAT, ₹ cr, FY24–FY26 · PAT margin %, right axis",`<div class="cv"></div><div class="legend"></div>`);
    const margins=c.fin.cats.map((x,j)=>c.fin.rev[j]?c.fin.pat[j]/c.fin.rev[j]*100:null);
    C.combo(el.querySelector(".cv"),{cats:c.fin.cats, fmt:v=>nf(v,1).replace(/^/,v<0?MINUS:""),
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
  if(cfg.hold && c.hold){
    const parts=c.hold.parts.filter(p=>p.value!=null).map((p,j)=>({...p,color:["var(--viz-1)","var(--viz-2)","var(--viz-4)","var(--viz-7)"][j]}));
    const el=card("hold",esc(c.m.pr>0?`Promoter holds ${nf(c.m.pr,1)}%`:"No promoter holding reported"),`Shareholding, % of equity · ${esc(c.hold.asof||"latest quarter")} · only the latest quarter is in the data`,`<div class="cv"></div>`);
    parts.length? C.stackBar(el.querySelector(".cv"),{parts, tip:(g,p)=>`${g.label} holds ${nf(g.value,1)}% of the equity.`, aria:"Shareholding mix"}) : el.querySelector(".cv").innerHTML=`<div class="empty">No shareholding data.</div>`;
  }
  if(cfg.peers&&cfg.peers.length){
    const peers=M.companies.filter(x=>x.prim===c.prim);
    const rows=cfg.peers.map(k=>({label:MET[k].short, value:c.nm[k]?null:c.m[k], peers:peers.map(x=>x.m[k]), fmt:v=>fmtPlain(k,v), tick:v=>tick(k,v)}));
    const k0=cfg.peers[0], med0=K.median(peers.map(x=>x.m[k0]));
    const el=card("peers",esc(c.m[k0]!=null&&med0!=null?`${MET[k0].label} ${c.m[k0]>med0?"above":"below"} the ${G[c.prim]?.short||""} median`:`Against ${G[c.prim]?.short||"peers"}`),`${esc(cfg.peers.map(k=>`${MET[k].short} (${unitOf(k)})`).join(", "))} vs ${peers.length} companies in ${esc(G[c.prim]?.label||"")} · ◆ this company, dashed = median, shaded = middle half`,`<div class="cv"></div>`);
    C.dotPlot(el.querySelector(".cv"),{rows, labelW:90, aria:"Company versus peers"});
  }
  if(cfg.revMix){
    const el=card("mix",c.revMix?esc(`${c.revMix.parts[0]?topPart(c.revMix):"Revenue mix"}`):"Revenue mix",c.revMix?`Share of FY26 total income (₹${nf(c.revMix.total,1)} cr) · ${esc(c.revMix.conf)} confidence · ${esc(c.revMix.source)}`:"From shortlist diligence",`<div class="cv"></div>${c.revMix&&c.revMix.note?`<p class="caption">${esc(c.revMix.note)}</p>`:""}`);
    if(c.revMix) C.stackBar(el.querySelector(".cv"),{parts:c.revMix.parts.map((p,j)=>({...p,color:C.vizVar(j)})),tip:(g,p)=>`${g.label}: ₹${nf(g.value,2)} cr, ${p.toFixed(0)}% of FY26 total income (${g.detail}).`,aria:"Revenue mix"});
    else el.querySelector(".cv").innerHTML=`<div class="empty">No diligence yet, so no revenue split. ${M.repo?`<a href="${diligenceUrl(c)}" target="_blank" rel="noopener">Request diligence</a>`:""}</div>`;
  }
  if(cfg.control && c.m.mc!=null){
    const el=card("ctrl","Cost to control",`₹ cr · market cap × (promoter stake + ${cfg.control.openOffer}% open offer), capped at 100% · current price ${esc(M.asof||"")}`,`<div class="calc">
      <label for="prem" class="rlab"><span>Control premium over the current price</span><em id="premV">0%</em></label><input id="prem" type="range" min="0" max="50" step="1" value="0" aria-describedby="premNote">
      <div class="out"><div><span class="eyebrow">At current price</span><b id="c0"></b></div><div><span class="eyebrow">With premium</span><b id="c1"></b></div><div><span class="eyebrow">Stake acquired</span><b id="c2"></b></div></div>
      <p class="caption" id="premNote">Under SEBI SAST the open-offer price is the highest of several reference prices (including the negotiated price and recent averages), so it can exceed today's price. Range shown: current price to current price + premium.</p></div>`);
    const pct=c.m.pr==null?null:Math.min(100,c.m.pr+cfg.control.openOffer);
    const upd=()=>{ const p=+el.querySelector("#prem").value; el.querySelector("#premV").textContent=p+"%"; const base=pct==null?null:c.m.mc*pct/100;
      el.querySelector("#c0").innerHTML=base==null?NA:num(base,1); el.querySelector("#c1").innerHTML=base==null?NA:num(base*(1+p/100),1); el.querySelector("#c2").textContent=pct==null?"n/a":nf(pct,1)+"%"; };
    el.querySelector("#prem").oninput=upd; upd();
  }
  // diligence + contacts + dq
  const dd=c.dd;
  if(dd || c.open.length){
    card("dd","Diligence notes",`From shortlist diligence${c.updated?` · ${esc(c.updated)}`:""}`,`
      ${dd&&dd.str?`<h3>Strengths</h3><ul class="notes">${dd.str.map(t=>`<li>${safeHtml(t)}</li>`).join("")}</ul>`:""}
      ${dd&&dd.wk?`<h3 style="margin-top:var(--s-3)">Weaknesses</h3><ul class="notes">${dd.wk.map(t=>`<li>${safeHtml(t)}</li>`).join("")}</ul>`:""}
      ${c.open.length?`<h3 style="margin-top:var(--s-3)">Open diligence items</h3><ul class="notes">${c.open.map(t=>`<li>${safeHtml(t)}</li>`).join("")}</ul>`:""}
      ${c.sources.length?`<h3 style="margin-top:var(--s-3)">Sources</h3><div class="srcs">${c.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("")}<span class="subtle">checked ${esc(c.updated||"")}</span></div>`:""}`);
  }
  card("dqc","Contacts and data quality",`${c.dq.length} data-quality note${c.dq.length!==1?"s":""} for this company`,`
    ${c.contacts.length?`<h3>Contacts</h3><div class="srcs" style="margin-bottom:var(--s-3)">${c.contacts.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join("")}</div>`:""}
    ${c.dq.length?`<ul class="dq">${c.dq.map(d=>`<li>${pill(d.level==="neg"?"Error":d.level==="warn"?"Check":"Note",d.level==="neg"?"neg":d.level==="warn"?"warn":"info")}<span>${esc(d.text)}</span></li>`).join("")}</ul>`:`<p class="caption">No data-quality flags.</p>`}`);
};
const safeHtml = s=>esc(s).replace(/&lt;(\/?)b&gt;/g,"<$1b>");
function topPart(r){ const p=r.parts.slice().sort((a,b)=>b.value-a.value)[0]; return `${p.label} is ${Math.round(p.value/r.total*100)}% of income`; }
function segMedian(c,k){ return K.median(M.companies.filter(x=>x.prim===c.prim).map(x=>x.m[k])); }
function kpiValue(c,k){ return k==="nd"&&c.m.nd!=null&&c.m.nd<=0?`<span class="pos">${nf(-c.m.nd,1)}</span><small> ₹ cr net cash</small>`:fmt(k,c.m[k],c)+(MET[k].fmt==="cr"?"<small> ₹ cr</small>":""); }
function kpiCtx(c,k){
  if(k==="roe"){ if(c.m.roe26==null) return "FY26 ROE not available"; const d=c.m.roe-c.m.roe26; return `vs FY26 ROE ${nf(c.m.roe26,1)}%: ${Math.abs(d)<0.05?"flat":(d>0?"up ":"down ")+nf(d,1)+" pp"}`; }
  if(k==="roe26"&&c.m.roe26==null) return "not reported for FY26";
  const med=segMedian(c,k); const g=G[c.prim]; if(k==="nd") return c.m.nd==null?"cash not recorded":c.m.nd<=0?"cash exceeds borrowings":"borrowings exceed cash"; return med==null?"":`${g?g.short:"peer"} median ${fmtPlain(k,med)}`; }
function diligenceUrl(c){ // issue title carries no company name (public repo)
  const ref=(c.id.length*7919+[...c.id].reduce((a,ch)=>a+ch.charCodeAt(0),0)).toString(16);
  return `https://github.com/${M.repo}/issues/new?labels=diligence&title=${encodeURIComponent("Diligence request "+ref)}&body=${encodeURIComponent(`Company: ${c.name} (${c.code})\n\nRun shortlist diligence and add it to diligence.js, following .github/diligence-prompt.md.`)}`; }

// Shortlist ----------------------------------------------------------
PAGES.shortlist = (main, st)=>{
  const sl=M.companies.filter(c=>c.shortlisted), pend=pendingChanges();
  const w=weights(st), ranked=sl.map(c=>({c,parts:contributions(c,st),total:totalScore(c,st)})).sort((a,b)=>b.total-a.total);
  main.innerHTML=`
    <div class="ph"><div><span class="eyebrow">Shortlist · stored in the repo (${esc(M.shortlistFile)})</span><h1>Shortlist (${sl.length})</h1><p>One list for the whole team. Weights below are saved in the link, so a ranking can be shared.</p></div>
      <div class="acts"><a class="btn" href="${href("compare","",withState(filterOnly(st),{c:ranked.slice(0,5).map(x=>x.c.id),w:st.w}))}">${icon("compare")}Compare top ${Math.min(5,ranked.length)}</a></div></div>
    ${pend.length?`<section class="card" style="margin-bottom:var(--s-4);border-color:var(--warning)"><div class="card-h"><div><h2>${pend.length} staged change${pend.length>1?"s":""} not yet published</h2><div class="sub">Staged in this browser only. Publishing updates ${esc(M.shortlistFile)} in the repo for everyone.</div></div>
      <div class="pills"><button class="btn primary sm" id="pub">Copy file and open GitHub editor</button><button class="btn sm" id="discard">Discard</button></div></div>
      <ul class="chg">${pend.map(([n,v])=>`<li>${pill(v?"Add":"Remove",v?"pos":"neg")}<span class="what">${esc(n)}</span><span></span></li>`).join("")}</ul></section>`:""}
    <section class="card" style="margin-bottom:var(--s-4)"><div class="card-h"><div><h2>${ranked.length?esc(`${shortName(ranked[0].c.name)} ranks first on the current weights`):"Weighted scoring"}</h2><div class="sub">Score 0–100 = Σ weight × criterion score (0–1) ÷ Σ weights · criteria scored across all ${M.companies.length} companies</div></div><button class="btn sm" id="resetW">Reset weights</button></div>
      <div class="wts">${CRIT.map(k=>`<label class="wt" data-tip="${esc(k.explain)}"><span>${esc(k.label)}</span><b id="w-${k.key}">${w[k.key]}</b><input type="range" min="0" max="50" step="5" value="${w[k.key]}" data-w="${k.key}" aria-label="${esc(k.label)} weight"></label>`).join("")}</div>
      ${M.scoring.unavailable?`<p class="caption">${esc(M.scoring.unavailable)}</p>`:""}
      <div id="sb" style="margin-top:var(--s-3)"></div><div class="legend" id="sbL"></div></section>
    <div class="cards" id="cards">${ranked.length?ranked.map((x,i)=>scard(x.c,i+1,x.total,st)).join(""):`<div class="empty">The shortlist is empty. Star companies in the screener, then publish.</div>`}</div>`;
  const drawScores=()=>{ const s=route().st, rk=sl.map(c=>({c,parts:contributions(c,s),total:totalScore(c,s)})).sort((a,b)=>b.total-a.total);
    if(!rk.length){ main.querySelector("#sb").innerHTML=""; return; }
    C.scoreBars(main.querySelector("#sb"),{rows:rk.map(x=>({label:shortName(x.c.name),parts:x.parts,total:x.total})),keys:CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j)})),max:100,fmt:v=>v.toFixed(0),
      tip:(r,k,v)=>`${r.label}: ${k.label} adds ${v.toFixed(1)} of ${r.total.toFixed(1)} points.`, aria:"Score contributions by company"});
    C.legend(main.querySelector("#sbL"),CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j),shape:"square"})),null,"Bars stack each criterion's contribution");
    main.querySelector("#cards").innerHTML=rk.map((x,i)=>scard(x.c,i+1,x.total,s)).join("");
    main.querySelector("h2").textContent=`${shortName(rk[0].c.name)} ranks first on the current weights`; };
  drawScores();
  main.querySelectorAll("[data-w]").forEach(r=>r.oninput=()=>{ const s=route().st; const w2={...weights(s),[r.dataset.w]:+r.value}; main.querySelector("#w-"+r.dataset.w).textContent=r.value; history.replaceState(null,"",href("shortlist","",withState(s,{w:w2}))); drawScores(); });
  main.querySelector("#resetW").onclick=()=>go("shortlist","",withState(st,{w:{}}),true);
  const pub=main.querySelector("#pub"); if(pub) pub.onclick=()=>{ const txt=shortlistFileText(); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>{ toast("New shortlist file copied. Paste it over the file in GitHub and commit."); window.open(`https://github.com/${M.repo}/edit/main/${M.shortlistFile}`,"_blank","noopener"); }).catch(()=>{ download(new Blob([txt],{type:"text/javascript"}),M.shortlistFile.split("/").pop()); toast("Clipboard blocked: file downloaded instead."); }); };
  const dis=main.querySelector("#discard"); if(dis) dis.onclick=()=>{ setDraft({}); render(); };
};
function scard(c, rank, total, st){
  const keys=M.company.kpis.slice(0,3);
  return `<article class="card scard"><div class="top"><div><a class="cname" href="${href("company",c.id,filterOnly(st))}">${esc(c.name)}</a><div class="cmeta">${c.ticker?`<span>${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}</div></div><span class="rank" title="Rank on current weights">#${rank}</span></div>
    <div class="pills">${c.verdict?pill(c.verdict.label,c.verdict.tone):pill("No verdict yet","outline")}${pill(`Score ${total.toFixed(0)}`,"info","Weighted score on the current weights")}</div>
    <p class="thesis">${esc(c.thesis||"No thesis recorded.")}</p>
    <div class="mini">${keys.map(k=>`<div>${esc(MET[k].short)}<b>${fmt(k,c.m[k],c)}</b></div>`).join("")}</div>
    <div class="caption">${c.open.length} open diligence item${c.open.length!==1?"s":""} · updated ${esc(c.updated||"n/a")}</div></article>`;
}

// Compare ------------------------------------------------------------
PAGES.compare = (main, st)=>{
  let ids=(st.c||[]).filter(id=>byId.has(id)).slice(0,5);
  if(!ids.length) ids=M.companies.filter(c=>c.shortlisted).map(c=>({c,t:totalScore(c,st)})).sort((a,b)=>b.t-a.t).slice(0,5).map(x=>x.c.id);
  const cs=ids.map(id=>byId.get(id));
  const best=(k,vals)=>{ const b=(MET[k]||{}).better; const ok=vals.filter(v=>v!=null&&isFinite(v)); if(!b||ok.length<2) return {}; const mx=Math.max(...ok), mn=Math.min(...ok); if(mx===mn) return {}; return b==="high"?{best:mx,worst:mn}:{best:mn,worst:mx}; };
  const rowHtml=(k)=>{ const vals=cs.map(c=>c.nm&&c.nm[k]?null:c.m[k]); const bw=best(k,vals); return `<tr><td class="l" data-tip="${esc(headerTip(k))}">${esc(MET[k].label)} <span class="subtle">${esc(unitOf(k))}</span></td>${cs.map((c,i)=>`<td class="${vals[i]!=null&&vals[i]===bw.best?"best":vals[i]!=null&&vals[i]===bw.worst?"worst":""}">${fmt(k,c.m[k],c)}</td>`).join("")}</tr>`; };
  const opts=M.companies.filter(c=>!ids.includes(c.id)).sort((a,b)=>(b.shortlisted-a.shortlisted)||a.name.localeCompare(b.name));
  main.innerHTML=`
    <div class="ph"><div><span class="eyebrow">Compare</span><h1>Side by side</h1><p>Up to five companies. Green = best and red = worst in each row, using each metric's direction (e.g. lower P/E is better).</p></div>
      <div class="acts noprint">${ids.length<5?`<label class="sr" for="addc">Add company</label><select id="addc" class="inp" style="width:auto"><option value="">Add a company…</option>${opts.map(c=>`<option value="${c.id}">${c.shortlisted?"★ ":""}${esc(c.name)}</option>`).join("")}</select>`:""}<button class="btn" id="prt">${icon("print")}Print</button></div></div>
    ${cs.length?`<section class="card flush"><div class="tscroll" style="max-height:none"><table class="cmp"><thead><tr><th class="l">Metric</th>${cs.map(c=>`<th><a href="${href("company",c.id,filterOnly(st))}">${esc(shortName(c.name))}</a><div class="caption">${esc(c.ticker||G[c.prim]?.short||"")}</div><button class="linkbtn noprint" data-rm="${c.id}" aria-label="Remove ${esc(c.name)}">remove</button></th>`).join("")}</tr></thead>
      <tbody>${M.compare.map(sec=>`<tr class="sec"><td colspan="${cs.length+1}">${esc(sec.sec)}</td></tr>${sec.rows.map(rowHtml).join("")}`).join("")}
      <tr class="sec"><td colspan="${cs.length+1}">Score</td></tr><tr><td class="l">Weighted score (0–100)</td>${(()=>{ const v=cs.map(c=>totalScore(c,st)); const mx=Math.max(...v), mn=Math.min(...v); return v.map(x=>`<td class="${cs.length>1&&x===mx?"best":cs.length>1&&x===mn?"worst":""}">${x.toFixed(1)}</td>`).join(""); })()}</tr>
      <tr><td class="l">Verdict</td>${cs.map(c=>`<td class="note">${c.verdict?pill(c.verdict.label,c.verdict.tone):"–"}</td>`).join("")}</tr>
      <tr class="sec"><td colspan="${cs.length+1}">Notes</td></tr><tr><td class="l">Thesis / notes</td>${cs.map(c=>`<td class="note">${esc(c.thesis||"–")}</td>`).join("")}</tr></tbody></table></div></section>`
    :`<div class="empty">Nothing to compare. Add companies above or shortlist some first.</div>`}
    <p class="caption">Printed on one landscape page. Figures as of ${esc(M.asof||"n/a")}.</p>`;
  const add=main.querySelector("#addc"); if(add) add.onchange=()=>{ if(add.value) go("compare","",withState(st,{c:ids.concat(add.value)})); };
  main.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>go("compare","",withState(st,{c:ids.filter(x=>x!==b.dataset.rm)})));
  main.querySelector("#prt").onclick=()=>{ document.body.classList.add("print-compare"); setLandscape(true); window.print(); setTimeout(()=>{ document.body.classList.remove("print-compare"); },500); };
};
function setLandscape(){ /* @page is 16:9 landscape for every print */ }

// Data quality -------------------------------------------------------
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

// Methodology --------------------------------------------------------
PAGES.method = (main)=>{
  main.innerHTML=`<div class="ph"><div><span class="eyebrow">Methodology</span><h1>How the numbers are built</h1></div></div>
    <div class="grid g2">${M.methodology.map(s=>`<section class="card prose"><h2>${esc(s.h)}</h2>${s.p.map(p=>`<p>${esc(p)}</p>`).join("")}</section>`).join("")}
    <section class="card prose"><h2>Scoring</h2>${CRIT.map(k=>`<p><b>${esc(k.label)}</b> (default weight ${k.weight}): ${esc(k.explain)}</p>`).join("")}${M.scoring.unavailable?`<p>${esc(M.scoring.unavailable)}</p>`:""}</section>
    <section class="card prose"><h2>Formats and accessibility</h2><p>₹ crore to one decimal with Indian digit grouping; multiples as 8.3x; growth and margins signed to one decimal; negatives in red with a minus sign. Growth off a small or negative base shows n.m. with the reason on hover.</p><p>Colours come from the Greater Pacific palette; every chart series also has its own marker shape, so colour is never the only cue. All text meets WCAG AA contrast.</p></section></div>
    <section class="card flush" style="margin-top:var(--s-4)"><div class="card-h"><h2>Definitions</h2></div><div class="tscroll" style="max-height:none"><table class="defs"><thead><tr><th>Measure</th><th>Definition</th><th>Formula</th><th>Source</th><th>As of</th></tr></thead><tbody>
      ${Object.entries(MET).map(([k,m])=>`<tr><td><b>${esc(m.label)}</b></td><td>${esc(m.def||"")}</td><td>${esc(m.formula||"")}</td><td>${esc(m.source||"")}</td><td class="num">${esc(m.asof||"–")}</td></tr>`).join("")}</tbody></table></div></section>`;
};

// Dev chart gallery --------------------------------------------------
PAGES.dev = (main)=>{
  const sl=M.companies.filter(c=>c.shortlisted)[0]||M.companies[0];
  main.innerHTML=`<div class="ph"><div><span class="eyebrow">Developer · not in the main navigation flow</span><h1>Chart gallery</h1><p>Every chart type in the kit, drawn from live data, for design review. Check hover, legends, labels and reduced motion here.</p></div></div>
    <div class="stack">${["Scatter with band, median, labels","Bars with value labels and margin line","Columns (single series)","Dot plot vs peers","Labelled stacked bar","Score contribution bars","Sparklines","Palette and shapes"].map((t,i)=>`<section class="card gallery-item"><div class="card-h"><div><h2>${t}</h2><div class="sub" id="gs${i}"></div></div></div><div id="g${i}"></div><div class="legend" id="gl${i}"></div></section>`).join("")}</div>`;
  const x=M.scatter.x, y=M.scatter.y;
  [`${MET[x].label} (${unitOf(x)}) vs ${MET[y].label} (${unitOf(y)}), all companies; band = mandate, dashed = median`,"Revenue and PAT, ₹ cr, with margin %, right axis","₹ cr, first shortlisted company","Peer distribution in the company's own units (x, %, ₹ cr)","Share of total, %","Score points, 0–100 scale","Trend, ₹ cr, FY24–FY26 (or FY25 P&L order)","Categorical palette with marker shapes; sequential and diverging scales"].forEach((s,i)=>{ const e=main.querySelector("#gs"+i); if(e) e.textContent=s; });
  C.scatter(main.querySelector("#g0"),{domainAll:true,points:M.companies.map(c=>({id:c.id,x:c.m[x],y:c.m[y],color:G[c.prim].color,shape:G[c.prim].shape,series:c.prim,label:c.shortlisted?shortName(c.name):null,faded:!c.shortlisted,c})),xLabel:MET[x].label,yLabel:MET[y].label,band:M.mandate?[M.mandate.lo,M.mandate.hi]:null,bandLabel:M.mandate?M.mandate.label:"",medianY:K.median(M.companies.map(c=>c.m[y])),tip:p=>scatterTip(p.c,x,y),xTick:v=>tick(x,v),yTick:v=>tick(y,v)});
  legendFor(main.querySelector("#gl0"),()=>PAGES.dev(main),"click to isolate");
  const fc=M.companies.find(c=>c.fin)||null;
  if(fc) C.combo(main.querySelector("#g1"),{cats:fc.fin.cats,fmt:v=>nf(v,1),bars:[{key:"rev",label:"Revenue",values:fc.fin.rev,color:"var(--viz-1)"},{key:"pat",label:"PAT",values:fc.fin.pat,color:"var(--viz-3)"}],tip:(b,j,v)=>`${fc.fin.cats[j]} ${b.label} ₹${nf(v,1)} cr.`,line:{values:fc.fin.cats.map((_,j)=>fc.fin.rev[j]?fc.fin.pat[j]/fc.fin.rev[j]*100:null),color:"var(--viz-2)",fmt:v=>v==null?"":v.toFixed(1)+"%",tick:v=>v+"%",axis:"Margin %",tipFn:(j,v)=>`Margin ${v.toFixed(1)}%.`},yLabel:"₹ cr"});
  else main.querySelector("#g1").innerHTML=`<p class="caption">No multi-year series in this dataset.</p>`;
  C.columns(main.querySelector("#g2"),{items:M.company.kpis.slice(0,3).filter(k=>MET[k].fmt==="cr").map(k=>({label:MET[k].short,value:sl.m[k]})),fmt:v=>nf(v,1),yLabel:"₹ cr",tip:(it,v)=>`${it.label} ₹${nf(v,1)} cr.`});
  const pk=M.company.peers; C.dotPlot(main.querySelector("#g3"),{rows:pk.map(k=>({label:MET[k].short,value:sl.m[k],peers:M.companies.filter(x=>x.prim===sl.prim).map(x=>x.m[k]),fmt:v=>fmtPlain(k,v),tick:v=>tick(k,v)})),labelW:90});
  const rm=(M.companies.find(c=>c.revMix)||{}).revMix; C.stackBar(main.querySelector("#g4"),{parts:rm?rm.parts.map((p,j)=>({...p,color:C.vizVar(j)})):M.groups.slice(0,5).map((g,j)=>({label:g.short,value:g.n,color:g.color})),tip:(g,p)=>`${g.label}: ${p.toFixed(0)}%.`});
  const rk=M.companies.slice(0,6); C.scoreBars(main.querySelector("#g5"),{rows:rk.map(c=>({label:shortName(c.name),parts:contributions(c,{}),total:totalScore(c,{})})),keys:CRIT.map((k,j)=>({key:k.key,label:k.label,color:C.vizVar(j)})),fmt:v=>v.toFixed(0),tip:(r,k,v)=>`${r.label}: ${k.label} ${v.toFixed(1)} points.`});
  main.querySelector("#g6").innerHTML=M.companies.slice(0,6).map(c=>`<span style="display:inline-flex;gap:var(--s-2);align-items:center;margin-right:var(--s-5)">${esc(shortName(c.name))} ${M.metrics.sRev?C.spark([c.m.r24,c.m.r25,c.m.r26]):C.spark([c.m.p,c.m.e,c.m.r])}</span>`).join("");
  main.querySelector("#g7").innerHTML=`<div class="legend">${C.SHAPES.map((s,j)=>`<span style="display:inline-flex;align-items:center;gap:var(--s-1)">${C.legendSwatch(C.vizVar(j),s)} viz-${j+1}</span>`).join("")}</div><div class="legend">${[1,2,3,4,5,6,7].map(j=>`<span class="pill" style="background:var(--seq-${j});color:var(--${j>4?"n-0":"n-900"})">seq-${j}</span>`).join("")}${["n3","n2","n1","0","p1","p2","p3"].map(j=>`<span class="pill" style="background:var(--div-${j});color:var(--${j==="n3"||j==="p3"?"n-0":"n-900"})">div-${j}</span>`).join("")}</div>`;
};

// IC pack ------------------------------------------------------------
function slide(title, section, inner, idx){ return `<section class="slide"><div class="sh"><img src="${LOGO}" alt="Greater Pacific Capital"><h2>${esc(title)}</h2><span class="sec">${esc(section)}</span></div><div class="sb"><div class="fit">${inner}</div></div><div class="sf"><span>Confidential – internal use only</span><span>${esc(M.product)} · data as of ${esc(M.asof||"n/a")}</span><span class="pg"></span></div></section>`; }
function buildPack(){
  const st=route().st, pack=document.getElementById("pack");
  const today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  const kpiRow=(cs)=>`<section class="kpis">${M.kpis.map(k=>{ const v=k.value(cs); return `<div class="kpi"><span class="eyebrow">${esc(k.label)}</span><span class="kpi-v">${k.fmt==="int"?(v??"–"):fmt(null,v,null,{fmt:k.fmt})}</span><span class="ctx">${esc(k.ctx(cs))}</span></div>`; }).join("")}</section>`;
  const vals=Object.fromEntries(M.kpis.map(k=>[k.key,k.value(M.companies)]));
  const ch=M.changes, chTxt=ch==null?"no previous snapshot yet":ch.length?`${ch.length} change${ch.length>1?"s":""} since the last refresh`:"no changes since the last refresh";
  const head = M.key==="fs" ? `${vals.universe} companies screened; ${vals.fit} fit the mandate; ${vals.short} on the shortlist; ${chTxt}.` : `${vals.universe} companies on the outreach list; ${vals.profitable} profitable; ${vals.evaluated} evaluated; ${vals.short} on the shortlist; ${chTxt}.`;
  const funnel=M.funnel.map(s=>({...s,n:filtered(s.state).length}));
  let html=`<section class="slide cover"><img src="${LOGO}" alt="Greater Pacific Capital"><h1>${esc(M.product)}</h1><p>Investment committee pack · ${esc(today)}</p><p class="caption" style="color:var(--brand-accent)">Data as of ${esc(M.asof||"n/a")}</p><span class="conf-big">Confidential – internal use only</span></section>`;
  html+=slide("Overview","Overview",`<p class="headline">${esc(head)}</p>${kpiRow(M.companies)}
    <div class="grid" style="grid-template-columns:1.6fr 1fr;margin-top:var(--s-4)"><section class="card"><div class="card-h"><div><h2>Positioning</h2><div class="sub">${esc(MET[M.scatter.x].label)} (${unitOf(M.scatter.x)}) vs ${esc(MET[M.scatter.y].label)} (${unitOf(M.scatter.y)}) · dashed = median</div></div></div><div data-chart="scatter"></div></section>
    <section class="card"><div class="card-h"><h2>Screening funnel</h2></div><div class="funnel">${funnel.map(s=>`<div class="fstage"><span><span class="l">${esc(s.label)}</span><br><span class="d">${esc(s.desc)}</span></span><b>${s.n}</b><span class="bar"><i style="width:${(s.n/Math.max(1,funnel[0].n)*100).toFixed(1)}%"></i></span></div>`).join("")}</div></section></div>`);
  // screener: top rows of the current view
  const rows=sorted(filtered(st),st), top=rows.slice(0,14), cols=colsFor(st).filter(k=>k!=="desc"&&(!MET[k]||MET[k].fmt!=="spark")).slice(0,11);
  html+=slide("Screener: top of the current view","Screener",`<p class="caption">Showing ${top.length} of ${rows.length} companies, sorted as on screen. ${esc(chipText(st))} ₹ crore unless stated.</p>
    <table class="grid-t" style="width:100%"><thead><tr class="cols"><th class="l">Company</th>${cols.map(k=>`<th class="${TEXT[k]?"l":""}">${esc((MET[k]||TEXT[k]).short||(MET[k]||TEXT[k]).label)}${MET[k]&&unitOf(k)?` <span class="subtle">${esc(unitOf(k))}</span>`:""}</th>`).join("")}</tr></thead>
    <tbody>${top.map(c=>`<tr><td class="l"><b>${esc(shortName(c.name))}</b> <span class="subtle">${esc(c.ticker||G[c.prim]?.short||"")}</span></td>${cols.map(k=>k==="ev"?`<td>${c.ev?"Yes":"No"}</td>`:`<td>${fmt(k,c.m[k],c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
  const sl=M.companies.filter(c=>c.shortlisted).map(c=>({c,t:totalScore(c,st)})).sort((a,b)=>b.t-a.t);
  sl.forEach(({c,t},i)=>{
    const open=(c.open||[]).slice(0,4);
    html+=slide(c.name,`Shortlist #${i+1}`,`<div class="pills" style="margin-bottom:var(--s-3)">${c.ticker?`<span class="num">${esc(c.exchange)}: ${esc(c.ticker)}</span>`:""}${c.groups.map(g=>gpill(g.key)).join("")}${c.verdict?pill(c.verdict.label,c.verdict.tone):""}${M.mandate?(c.fit?pill("Mandate fit","info"):pill("Outside mandate","neu")):""}${pill(`Score ${t.toFixed(0)}`,"info")}</div>
      <section class="kpis">${M.company.kpis.map(k=>`<div class="kpi"><span class="eyebrow">${esc(MET[k].label)}</span><span class="kpi-v">${kpiValue(c,k)}</span></div>`).join("")}</section>
      <div class="grid" style="grid-template-columns:1fr 1fr 1fr;margin-top:var(--s-4)">
        <section class="card"><div class="card-h"><div><h2>${c.fin?"Revenue and PAT":"FY25 P&L"}</h2><div class="sub">${c.fin?"₹ cr, FY24–FY26 · PAT margin % below":"₹ cr, FY25"}</div></div></div><div data-chart="fin" data-id="${c.id}"></div></section>
        <section class="card"><div class="card-h"><div><h2>Against ${esc(G[c.prim]?.short||"peers")}</h2><div class="sub">${esc(M.company.peers.map(k=>`${MET[k].short} (${unitOf(k)})`).join(", "))} · ◆ company, dashed = median</div></div></div><div data-chart="peers" data-id="${c.id}"></div></section>
        <section class="card"><h2>Thesis</h2><p class="prose" style="margin:var(--s-2) var(--s-0)">${esc(c.thesis||"No thesis recorded.")}</p>${open.length?`<h3 style="margin-top:var(--s-3)">Open diligence items (${c.open.length})</h3><ul class="notes">${open.map(x=>`<li>${safeHtml(x)}</li>`).join("")}</ul>${c.open.length>4?`<p class="caption">${c.open.length-4} more on the company page.</p>`:""}`:""}</section>
      </div>`);
  });
  if(sl.length){ const cs=sl.slice(0,5).map(x=>x.c); const trim=s=>s&&s.length>120?s.slice(0,117)+"…":s;
    const best=(k,vals)=>{ const b=(MET[k]||{}).better; const ok=vals.filter(v=>v!=null&&isFinite(v)); if(!b||ok.length<2) return {}; const mx=Math.max(...ok), mn=Math.min(...ok); if(mx===mn) return {}; return b==="high"?{best:mx,worst:mn}:{best:mn,worst:mx}; };
    html+=slide("Comparison","Compare",`<table class="cmp"><thead><tr><th class="l">Metric</th>${cs.map(c=>`<th>${esc(shortName(c.name))}</th>`).join("")}</tr></thead><tbody>
      ${M.compare.map(sec=>`<tr class="sec"><td colspan="${cs.length+1}">${esc(sec.sec)}</td></tr>${sec.rows.map(k=>{ const v=cs.map(c=>c.nm&&c.nm[k]?null:c.m[k]), bw=best(k,v); return `<tr><td class="l">${esc(MET[k].label)} <span class="subtle">${esc(unitOf(k))}</span></td>${cs.map((c,i)=>`<td class="${v[i]!=null&&v[i]===bw.best?"best":v[i]!=null&&v[i]===bw.worst?"worst":""}">${fmt(k,c.m[k],c)}</td>`).join("")}</tr>`; }).join("")}`).join("")}
      <tr class="sec"><td colspan="${cs.length+1}">Notes</td></tr><tr><td class="l">Thesis</td>${cs.map(c=>`<td class="note">${esc(trim(c.thesis||"–"))}</td>`).join("")}</tr></tbody></table><p class="caption">Green = best, red = worst in each row by the metric's direction.</p>`);
  }
  html+=slide("Methodology","Methodology",`<div class="grid g2">${M.methodology.map(s=>`<section class="prose"><h2>${esc(s.h)}</h2>${s.p.map(p=>`<p>${esc(p)}</p>`).join("")}</section>`).join("")}<section class="prose"><h2>Scoring</h2><p>${CRIT.map(k=>`${esc(k.label)} ${weights(st)[k.key]}`).join(" · ")} (weights). ${CRIT.map(k=>`${esc(k.label)}: ${esc(k.explain)}`).join(" ")}</p></section></div>`);
  pack.innerHTML=html;
  const pages=pack.querySelectorAll(".slide"); pages.forEach((p,i)=>{ const pg=p.querySelector(".pg"); if(pg) pg.textContent=`Page ${i+1} of ${pages.length}`; });
  document.body.classList.add("printing"); pack.style.display="block";
  // charts are drawn after insertion so they size to the slide
  pack.querySelectorAll("[data-chart]").forEach(el=>{ const kind=el.dataset.chart, c=byId.get(el.dataset.id);
    if(kind==="scatter"){ const ax=M.scatter.x, ay=M.scatter.y, any=M.companies.some(x=>x.shortlisted); C.scatter(el,{domainAll:true,height:300,points:M.companies.map(x=>({id:x.id,x:x.m[ax],y:x.m[ay],color:G[x.prim].color,shape:G[x.prim].shape,series:x.prim,label:x.shortlisted?shortName(x.name):null,faded:any&&!x.shortlisted,c:x})),xLabel:`${MET[ax].label} (${unitOf(ax)})`,yLabel:`${MET[ay].label} (${unitOf(ay)})`,band:M.mandate&&ax===M.mandate.metric?[M.mandate.lo,M.mandate.hi]:null,bandLabel:M.mandate?M.mandate.label:"",medianY:K.median(M.companies.map(x=>x.m[ay])),xTick:v=>tick(ax,v),yTick:v=>tick(ay,v),tip:p=>scatterTip(p.c,ax,ay)}); }
    if(kind==="fin"){ if(c.fin) C.combo(el,{height:230,cats:c.fin.cats,fmt:v=>(v<0?MINUS:"")+nf(v,1),bars:[{key:"rev",label:"Revenue",values:c.fin.rev,color:"var(--viz-1)"},{key:"pat",label:"PAT",values:c.fin.pat,color:"var(--viz-3)"}],tip:()=>"",line:{values:c.fin.cats.map((_,j)=>c.fin.rev[j]?c.fin.pat[j]/c.fin.rev[j]*100:null),color:"var(--viz-2)",short:"PAT margin",fmt:v=>v==null?"":v.toFixed(1)+"%",tick:v=>v+"%",axis:"PAT margin %",tipFn:()=>""},yLabel:"₹ cr"});
      else C.columns(el,{height:230,items:[{label:"Revenue",value:c.m.r},{label:"EBITDA",value:c.m.e},{label:"Net profit",value:c.m.p}],fmt:v=>(v<0?MINUS:"")+nf(v,1),yLabel:"₹ cr",tip:()=>""}); }
    if(kind==="peers"){ const peers=M.companies.filter(x=>x.prim===c.prim); C.dotPlot(el,{labelW:80,rows:M.company.peers.map(k=>({label:MET[k].short,value:c.nm[k]?null:c.m[k],peers:peers.map(x=>x.m[k]),fmt:v=>fmtPlain(k,v),tick:v=>tick(k,v)}))}); }
  });
  // fit: largest scale s (0.5..1) at which the content, laid out at width W/s, fits the slide body in both directions
  pack.querySelectorAll(".sb").forEach(sb=>{ const f=sb.firstElementChild, cs=getComputedStyle(sb);
    const W=sb.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight), H=sb.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
    const fits=s=>{ f.style.width=(W/s)+"px"; return f.scrollHeight*s<=H+0.5 && f.scrollWidth*s<=W+0.5; };
    let lo=0.5, hi=1; if(fits(1)){ lo=1; } else { for(let i=0;i<10;i++){ const mid=(lo+hi)/2; if(fits(mid)) lo=mid; else hi=mid; } }
    f.style.width=(W/lo)+"px"; f.style.transform=`scale(${lo})`; f.dataset.scale=lo.toFixed(3);
    if(f.scrollHeight*lo>H+1) sb.dataset.overflow="1"; });
  return pack;
}function chipText(st){ const p=[]; if(st.q) p.push(`search “${st.q}”`); (st.g||[]).forEach(k=>G[k]&&p.push(G[k].short)); (st.t||[]).forEach(k=>TOG[k]&&p.push(TOG[k].label)); Object.entries(st.r||{}).forEach(([k,v])=>MET[k]&&p.push(rangeLabel(k,v))); return p.length?"Filters: "+p.join(" · ")+".":"No filters."; }
function exportPack(){ buildPack(); setTimeout(()=>{ window.print(); },50); }
addEventListener("afterprint",()=>{ document.body.classList.remove("printing","print-compare"); const p=document.getElementById("pack"); if(p){ p.innerHTML=""; p.style.display=""; } });

// ---------- boot ----------
shell();
addEventListener("hashchange", render);
addEventListener("popstate", render);
let rz, rw=innerWidth; addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ if(Math.abs(innerWidth-rw)>40 && !document.body.classList.contains("printing")){ rw=innerWidth; lastKey=""; render(); } },200); });
render();
if(route().st.pack){ buildPack(); document.body.classList.add("pack-preview"); document.documentElement.setAttribute("data-pack-ready","1"); }
window.__APP = { render, route, filtered, sorted, fmt, fmtPlain, buildPack, M, PREV, PAGES };
})();
