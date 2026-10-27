/* Greater Pacific dashboard kit — pipeline interface: deal-flow hero, river, drag-and-drop board, deal drawer,
   next-actions agenda, stalled-but-attractive chart, team workload, activity feed, storage settings.
   Installed by app.js: window.PipelineUI(api) returns the page and the pieces other pages embed.
   Renders pipeline records and model figures only; it never changes a source figure. */
window.PipelineUI = function(A){
"use strict";
const {M,G,MET,C,esc,fmt,fmtPlain,href,go,route,withState,filterOnly,pill,icon,shortName,totalScore,toast,nf,PIPE,RM,addCompare,download}=A;
const ST=PIPE.stages, IDX=PIPE.idx, FLOW=ST.filter(s=>!s.closed), ACTIVE=ST.filter(s=>!s.pool&&!s.closed), CLOSED=ST.filter(s=>s.closed);
const INPLAY=["outreach","engaged","nda","ic"];
const SEQ=["--seq-1","--seq-2","--seq-3","--seq-4","--seq-5","--seq-6","--seq-7"];
const sizeKey=((M.treemap&&M.treemap.size)||[])[0];
const REASONS=["Valuation","Promoter not selling","Governance","Size","Business quality","Regulatory","Timing","Other"];
const stageOf=k=>ST[IDX[k]]||ST[0];
const stageColor=k=>k==="passed"?"var(--n-300)":k==="hold"?"var(--warning)":`var(${SEQ[Math.min(6,IDX[k]||0)]})`;
const stageDark=k=>k==="hold"||(IDX[k]>=4&&k!=="passed");
const spill=k=>`<span class="spill ${stageDark(k)?"dk":""}" style="--sc:${stageColor(k)}">${esc(stageOf(k).short)}</span>`;
const initials=n=>String(n||"").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase()||"?";
const avColor=n=>C.vizVar([...String(n)].reduce((a,ch)=>((a*31)+ch.charCodeAt(0))>>>0,7)%8);
const avatar=(n,cls="")=>n?`<span class="av ${cls}" style="--avc:${avColor(n)}" title="${esc(n)}">${esc(initials(n))}</span>`:`<span class="av av-none ${cls}" title="No owner yet">+</span>`;
const todayMid=()=>{ const t=new Date(); t.setHours(0,0,0,0); return t; };
function dueInfo(r){ if(!r||!r.due) return null; const d=new Date(r.due+"T00:00:00"); if(isNaN(d)) return null; const days=Math.round((d-todayMid())/864e5);
  const label=days<0?`${-days}d overdue`:days===0?"Today":days===1?"Tomorrow":d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
  return {days,label,tone:days<0?"neg":days<=2?"warn":days<=7?"info":"neu"}; }
const ageTone=d=>d==null?"neu":d<14?"pos":d<30?"warn":"neg";
const ageW=d=>d==null?0:Math.min(100,Math.max(4,d/45*100));
const rel=t=>{ const s=(Date.now()-new Date(t).getTime())/1000; if(s<60) return "just now"; if(s<3600) return Math.floor(s/60)+"m ago"; if(s<86400) return Math.floor(s/3600)+"h ago"; const d=Math.floor(s/86400); return d<30?d+"d ago":new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); };
const priRank=p=>({A:0,B:1,C:2})[p]??3;
const REAL={cs:M.companies, store:PIPE, byId:new Map(M.companies.map(c=>[c.id,c])), sample:false};

// ---------- small views ----------
function card(c, r, ctx){
  const due=dueInfo(r), days=ctx.store.daysInStage(c), score=totalScore(c,{}), g=G[c.prim], k1=M.company.kpis[0], k2=M.company.kpis[1];
  return `<article class="pc" tabindex="0" data-id="${esc(c.id)}" style="--acc:${g?g.color:"var(--viz-1)"}" aria-label="${esc(c.name)}: ${esc(stageOf(r.stage).label)}${r.owner?", owner "+esc(r.owner):""}${r.next?", next: "+esc(r.next):""}">
    <div class="pc-top"><span class="pc-name">${esc(shortName(c.name))}</span>${r.pri?`<span class="pri p-${esc(r.pri.toLowerCase())}" title="Priority ${esc(r.pri)}">${esc(r.pri)}</span>`:""}<span class="pc-score num" title="Weighted score on default weights">${score.toFixed(0)}</span></div>
    <div class="pc-meta">${g?`<span class="vpill"><span class="dot" style="background:${g.color}"></span>${esc(g.short)}</span>`:""}${k1?`<span class="num">${esc(fmtPlain(k1,c.m[k1]))}</span>`:""}${k2?`<span class="num">${esc(MET[k2].short)} ${esc(c.nm&&c.nm[k2]?"n.m.":fmtPlain(k2,c.m[k2]))}</span>`:""}</div>
    ${r.next?`<div class="pc-next ${due?due.tone:"neu"}">${icon("bolt")}<span>${esc(r.next)}</span>${due?`<b>${esc(due.label)}</b>`:""}</div>`:""}
    <div class="pc-foot">${avatar(r.owner)}<span class="pc-age" title="${days==null?"Stage set from the data; not moved yet":days+" days in this stage"}"><i class="${ageTone(days)}" style="width:${ageW(days)}%"></i></span><span class="pc-d num">${days==null?"auto":days+"d"}</span>
      <button class="iconbtn miniicon pc-menu" type="button" data-menu="${esc(c.id)}" aria-label="Actions for ${esc(c.name)}">${icon("more")}</button></div>
  </article>`;
}
function sortCards(list, ctx){ return list.sort((a,b)=>priRank(a.r.pri)-priRank(b.r.pri) || ((dueInfo(a.r)||{days:999}).days-(dueInfo(b.r)||{days:999}).days) || totalScore(b.c,{})-totalScore(a.c,{})); }
function counts(ctx){ const n={}; ST.forEach(s=>n[s.key]=0); ctx.cs.forEach(c=>{ n[ctx.store.stageOf(c)]++; }); return n; }
function flowStats(ctx){ const cur={}, exit={}; FLOW.forEach(s=>{ cur[s.key]=0; exit[s.key]=0; }); let passed=0, hold=0;
  ctx.cs.forEach(c=>{ const r=ctx.store.get(c), s=stageOf(r.stage); if(s.closed){ const pk=FLOW[Math.min(FLOW.length-1,r.peak||0)].key; exit[pk]++; if(s.key==="passed") passed++; else hold++; } else cur[s.key]++; });
  const stages=FLOW.map((s,i)=>({key:s.key,label:s.label,short:s.short,color:stageColor(s.key),count:cur[s.key],exit:exit[s.key],reach:FLOW.slice(i).reduce((a,x)=>a+cur[x.key]+exit[x.key],0)}));
  return {stages, exits:{passed,hold}}; }
function riverTip(s, ctx){ const here=ctx.cs.filter(c=>ctx.store.stageOf(c)===s.key); return `<span class="tip-h">${esc(s.label)}</span><div class="tip-g"><span>Here now</span><span>${s.count}</span><span>Reached this stage</span><span>${s.reach}</span><span>Dropped out here</span><span>${s.exit}</span></div>${here.length&&s.key!=="long"?`<div class="tip-foot">${esc(here.slice(0,10).map(c=>shortName(c.name)).join(", "))}${here.length>10?` and ${here.length-10} more`:""}</div>`:""}`; }
function syncPill(store){ const s=store.status, t=s.at?` · ${rel(s.at)}`:"";
  const [tone,label]= s.mode==="memory"?["neu","Sample data · not saved"] : s.mode!=="github"?["neu","This device only"] : s.state==="synced"?["pos","Synced"+t] : s.state==="saving"||s.state==="syncing"?["info","Syncing…"] : s.state==="offline"?["warn","Offline · will sync"] : s.state==="error"?["neg","Sync problem"] : ["neu","Team sync"];
  return `<button type="button" class="pill ${tone} syncpill" data-sync data-tip="${esc(s.msg|| (s.mode==="github"?`Private repo ${store.cfg.repo}`:"Pipeline data is kept in this browser. Set up team sync to share it."))}">${icon(s.mode==="github"?"cloud":"lock")}${esc(label)}</button>`; }

// ---------- page ----------
const PG={ctx:null, root:null, unsub:null, poolLimit:40, closedTab:"passed", raf:0};
function page(main, st, arg, same, ctx){
  ctx=ctx||REAL; PG.ctx=ctx;
  const sample=ctx.sample;
  main.innerHTML=`
  ${sample?`<div class="sample-banner">${icon("help")}<b>Design preview with made-up sample companies and activity.</b> Nothing here is real or saved. <a href="${href("pipeline","",{})}">Open the real pipeline</a></div>`:""}
  <section class="hero pl-hero" aria-label="Pipeline summary"><div class="cst-wrap" id="plCst"></div><div id="plHero"></div></section>
  <section class="card" id="plRiverCard"><div class="card-h"><div><h2 id="plRiverT"></h2><div class="sub">Pipeline flow · companies reaching each stage (count) · % = share moving on · drop-outs fall to the lane below · hover a stage, click to jump to it</div></div><div class="tools" id="plRiverTools"></div></div><div id="plRiver"></div></section>
  <section class="card flush pl-boardcard" id="plBoardCard" style="margin-top:var(--s-4)">
    <div class="tbar"><b>Board</b><span class="muted" id="plBoardN"></span><span class="grow"></span>
      <label class="sr" for="plQ">Search the pipeline</label><input class="inp" id="plQ" type="search" placeholder="Search company, owner or next step" style="width:auto;min-width:calc(var(--s-16) * 3.4)">
      <span class="owners" id="plOwners" role="group" aria-label="Filter by owner"></span>
      <label class="chk"><input type="checkbox" id="plOd">Overdue only</label>
      <button class="btn sm" type="button" id="plAdd">${icon("plus")}Add company</button></div>
    <div class="pl-board" id="plBoard" aria-label="Pipeline board. Drag cards between stages, or focus a card and press Shift+Arrow to move it."></div>
    <p class="caption pl-hint">Drag a card to another stage · Shift + ← / → on a focused card moves it · ⋯ for more · Enter opens details</p>
  </section>
  <div class="grid g-main" style="margin-top:var(--s-4)">
    <section class="card"><div class="card-h"><div><h2 id="plAgT">Next actions</h2><div class="sub" id="plAgS">Next steps by due date · click to open the deal</div></div></div><div id="plAgenda"></div></section>
    <div class="stack">
      <section class="card"><div class="card-h"><div><h2>Stalled but attractive</h2><div class="sub">Days in current stage vs weighted score (0–100) · bubble = ${esc(sizeKey?MET[sizeKey].label:"size")} (₹ cr) · top-right needs a push</div></div></div><div id="plStall"></div></section>
      <section class="card"><div class="card-h"><div><h2>Team workload</h2><div class="sub">Active deals per owner, by stage · count</div></div></div><div id="plTeam"></div></section>
    </div>
  </div>
  <section class="card" style="margin-top:var(--s-4)"><div class="card-h"><div><h2>Activity</h2><div class="sub">Every stage move, edit and note, newest first</div></div></div><div id="plFeed"></div></section>`;
  PG.root=main.querySelector("#plBoard");
  C.constellation(main.querySelector("#plCst"),{height:Math.max(180,main.querySelector("#plCst").clientHeight||260),points:ctx.cs.map(c=>({id:c.id,x:(c.pct||{})[M.scatter.x]??(((c.id.length*37)%100)),y:(c.pct||{})[M.scatter.y]??(((c.id.length*53)%100)),star:INPLAY.includes(ctx.store.stageOf(c))}))});
  const q=main.querySelector("#plQ"); q.value=st.pq||""; let deb; q.oninput=()=>{ clearTimeout(deb); deb=setTimeout(()=>setP({pq:q.value}),160); };
  const od=main.querySelector("#plOd"); od.checked=!!st.od; od.onchange=()=>setP({od:od.checked});
  main.querySelector("#plAdd").onclick=e=>addPicker(e.currentTarget, ctx);
  enableDnD(PG.root, ctx);
  PG.root.addEventListener("click", e=>boardClick(e, ctx));
  PG.root.addEventListener("keydown", e=>boardKey(e, ctx));
  paintAll(st, ctx, false);
  if(PG.unsub) PG.unsub(); PG.unsub=ctx.store.on(()=>{ cancelAnimationFrame(PG.raf); PG.raf=requestAnimationFrame(()=>{ if(PG.root&&PG.root.isConnected&&PG.ctx===ctx) paintAll(route().st, ctx, true); }); });
  if(st.open){ const c=ctx.byId.get(st.open); if(c) openDrawer(c, ctx); }
}
function setP(patch){ const r=route(); const st=withState(r.st,patch); history.replaceState(null,"",href(r.page,r.arg,st)); paintAll(st, PG.ctx, true); }
function paintAll(st, ctx, animate){ paintHero(st,ctx); paintRiver(ctx); paintOwners(st,ctx); paintBoard(st,ctx,animate); paintAgenda(ctx); paintStall(ctx); paintTeam(ctx); paintFeed(ctx); }
function paintHero(st, ctx){
  const host=document.getElementById("plHero"); if(!host) return; const n=counts(ctx), uni=ctx.cs.length;
  const inplay=INPLAY.reduce((a,k)=>a+n[k],0), overdue=ctx.cs.filter(c=>{ const r=ctx.store.get(c), d=dueInfo(r); return d&&d.days<0&&!stageOf(r.stage).closed; }).length;
  const ages=ctx.cs.filter(c=>INPLAY.includes(ctx.store.stageOf(c))).map(c=>ctx.store.daysInStage(c)).filter(v=>v!=null).sort((a,b)=>a-b), med=ages.length?ages[ages.length>>1]:null;
  const h=v=>`<span class="hn">${v}</span>`, s=v=>v===1?"":"s";
  const head = inplay ? `${h(inplay)} target${s(inplay)} in play: ${h(n.outreach)} in outreach, ${h(n.engaged)} engaged, ${h(n.nda)} at NDA & data, ${h(n.ic)} at IC${overdue?`; ${h(overdue)} next step${s(overdue)} overdue`:""}.`
    : `Pipeline ready: ${h(n.short)} shortlisted and ${h(n.screened)} screened. Drag a card into Outreach to start tracking a deal.`;
  const tile=(label,v,ctxt,frac,key)=>`<${key?"button type=\"button\" data-jump=\""+key+"\"":"div"} class="kpi"><span class="eyebrow">${esc(label)}</span><span class="kpi-v">${v}</span>${frac!=null?`<span class="kmini"><span class="kb"><i style="width:${Math.max(frac>0?2:0,Math.min(100,frac*100)).toFixed(1)}%"></i></span></span>`:""}<span class="ctx">${esc(ctxt)}</span></${key?"button":"div"}>`;
  host.innerHTML=`<div class="hero-top"><div><span class="eyebrow">Deal pipeline · ${esc(M.product)} · ${uni} companies</span><h1 class="hero-h">${head}</h1>
    <p class="hero-sub">${ctx.sample?"Sample companies and activity for design review.":"Stages, owners and next steps are team data kept outside the published dashboard. Starting stages come from the data: shortlisted, then screened."}${!ctx.sample&&!inplay?` <a class="hero-link" href="${href("dev","pipeline-sample",{})}">See a full pipeline with sample data →</a>`:""}</p></div>
    <div class="hero-acts">${syncPill(ctx.store)}<button class="btn" type="button" data-sync>${icon("cog")}Storage</button><button class="btn primary" type="button" id="plPresent">${icon("play")}Present</button></div></div>
    <section class="kpis" aria-label="Pipeline figures">${[["Screened","screened"],["Shortlisted","short"],["Outreach","outreach"],["Engaged","engaged"],["NDA & data","nda"],["At IC","ic"]].map(([l,k])=>tile(l,n[k],`${Math.round(n[k]/Math.max(1,uni)*1000)/10}% of ${uni}`,n[k]/Math.max(1,uni),k)).join("")}
      ${tile("Overdue",overdue,overdue?"next steps past due":"nothing overdue",null,null)}${tile("Median days in stage",med==null?"–":med,inplay?"deals in play":"no deals in play yet",null,null)}</section>`;
  host.querySelectorAll("[data-sync]").forEach(b=>b.onclick=()=>settings(ctx.store));
  const pp=host.querySelector("#plPresent"); if(pp) pp.onclick=()=>A.present();
  host.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
}
function paintRiver(ctx){ const host=document.getElementById("plRiver"); if(!host) return; const f=flowStats(ctx);
  const deepest=[...f.stages].reverse().find(s=>s.count>0&&s.key!=="long");
  const T=document.getElementById("plRiverT"); if(T) T.textContent = deepest?`${f.stages[0].reach} in the funnel; the furthest deal${deepest.count>1?"s are":" is"} at ${deepest.label}`:"Pipeline flow";
  C.river(host,{stages:f.stages, exits:f.exits, aria:"Pipeline flow by stage", tip:s=>riverTip(s,ctx), onNode:k=>jumpTo(k)}); }
function jumpTo(k){ const col=document.querySelector(`.pl-col[data-stage="${CSS.escape(k)}"]`)||document.querySelector(`.pl-col[data-stage="${CLOSED.some(s=>s.key===k)?"closed":"long"}"]`); if(!col) return;
  col.scrollIntoView({behavior:RM()?"auto":"smooth",block:"nearest",inline:"center"}); col.classList.remove("flash"); void col.offsetWidth; col.classList.add("flash"); }
function paintOwners(st, ctx){ const host=document.getElementById("plOwners"); if(!host) return; const os=ctx.store.owners();
  host.innerHTML=os.length?os.map(o=>`<button type="button" class="ownbtn" aria-pressed="${st.own===o}" data-own="${esc(o)}" title="Show ${esc(o)}'s deals">${avatar(o)}</button>`).join(""):"";
  host.querySelectorAll("[data-own]").forEach(b=>b.onclick=()=>setP({own:route().st.own===b.dataset.own?"":b.dataset.own})); }
function paintBoard(st, ctx, animate){
  const host=PG.root; if(!host) return; const q=(st.pq||"").toLowerCase(), own=st.own||"", od=!!st.od;
  const all=ctx.cs.map(c=>({c,r:ctx.store.get(c)}));
  const ok=x=>(!q||(x.c.name+" "+(x.r.owner||"")+" "+(x.r.next||"")+" "+(G[x.c.prim]?.label||"")).toLowerCase().includes(q))&&(!own||(x.r.owner||"")===own)&&(!od||((dueInfo(x.r)||{days:1}).days<0));
  const vis=all.filter(ok), by=k=>vis.filter(x=>x.r.stage===k);
  const N=document.getElementById("plBoardN"); if(N) N.textContent=`${vis.filter(x=>x.r.stage!=="long").length} on the board · ${by("long").length} in the long list${q||own||od?" (filtered)":""}`;
  const html=()=>{
    const pool=by("long").sort((a,b)=>totalScore(b.c,{})-totalScore(a.c,{})), show=pool.slice(0,PG.poolLimit);
    let s=`<section class="pl-col pl-pool" data-stage="long" style="--sc:${stageColor("long")}" aria-label="Long list: ${pool.length}"><header class="pl-colh"><span class="pl-colt">Long list</span><span class="pl-ct num">${pool.length}</span><span class="pl-sum">ranked by score</span></header><div class="pl-cards">${show.map(x=>`<div class="pl-prow" data-id="${esc(x.c.id)}" tabindex="0"><span class="pl-pn">${esc(shortName(x.c.name))}</span><span class="num subtle">${totalScore(x.c,{}).toFixed(0)}</span><button class="iconbtn miniicon" type="button" data-promote="${esc(x.c.id)}" aria-label="Move ${esc(x.c.name)} to Screened" data-tip="Move to Screened">${icon("next")}</button></div>`).join("")}${pool.length>show.length?`<button class="linkbtn pl-more" type="button" data-more>Show ${Math.min(60,pool.length-show.length)} more</button>`:""}${!pool.length?`<div class="pl-empty">Empty</div>`:""}</div></section>`;
    ACTIVE.forEach(stg=>{ const items=sortCards(by(stg.key),ctx); const sum=sizeKey?items.reduce((a,x)=>a+(x.c.m[sizeKey]>0?x.c.m[sizeKey]:0),0):0; const ages=items.map(x=>ctx.store.daysInStage(x.c)).filter(v=>v!=null); const avg=ages.length?Math.round(ages.reduce((a,b)=>a+b,0)/ages.length):null;
      s+=`<section class="pl-col ${stageDark(stg.key)?"dkh":""}" data-stage="${stg.key}" style="--sc:${stageColor(stg.key)}" aria-label="${esc(stg.label)}: ${items.length}"><header class="pl-colh"><span class="pl-colt">${esc(stg.label)}</span><span class="pl-ct num">${items.length}</span><span class="pl-sum num">${sizeKey&&items.length?esc(fmtPlain(sizeKey,sum)):""}${avg!=null?` · avg ${avg}d`:""}</span></header><div class="pl-cards">${items.length?items.map(x=>card(x.c,x.r,ctx)).join(""):`<div class="pl-empty">Drop a company here</div>`}</div></section>`; });
    const cl=vis.filter(x=>stageOf(x.r.stage).closed), tab=PG.closedTab, list=cl.filter(x=>x.r.stage===tab).sort((a,b)=>(b.r.since||"")>(a.r.since||"")?1:-1);
    s+=`<section class="pl-col pl-closed" data-stage="closed" style="--sc:var(--n-300)" aria-label="Closed: ${cl.length}"><header class="pl-colh"><span class="pl-colt">Closed</span><span class="pl-ct num">${cl.length}</span><span class="pl-sum"><span class="seg mini">${CLOSED.map(s2=>`<button type="button" data-ctab="${s2.key}" aria-pressed="${tab===s2.key}">${esc(s2.short)} ${cl.filter(x=>x.r.stage===s2.key).length}</button>`).join("")}</span></span></header>
      <div class="pl-cards">${list.length?list.map(x=>`<div class="pl-prow closed" data-id="${esc(x.c.id)}" tabindex="0"><span class="pl-pn">${esc(shortName(x.c.name))}<span class="caption">${esc(x.r.reason||"No reason recorded")} · from ${esc(FLOW[Math.min(FLOW.length-1,x.r.peak||0)].short)}</span></span><button class="iconbtn miniicon" type="button" data-reopen="${esc(x.c.id)}" aria-label="Reopen ${esc(x.c.name)}" data-tip="Reopen at ${esc(FLOW[Math.min(FLOW.length-1,x.r.peak||0)].short)}">${icon("prev")}</button></div>`).join(""):`<div class="pl-empty">Drop here to pass or hold</div>`}</div></section>`;
    return s; };
  const apply=()=>{ const sc=host.scrollLeft; host.innerHTML=html(); host.scrollLeft=sc; };
  if(animate) C.flip(host,".pc","data-id",apply); else apply();
  if(PG.landed){ const el=host.querySelector(`.pc[data-id="${CSS.escape(PG.landed)}"]`); if(el){ el.classList.add("landed"); if(PG.focus) el.focus({preventScroll:true}); } PG.landed=null; PG.focus=false; }
}
/** Where to start when nothing has a next step: the highest-scored shortlisted companies, then screened ones. */
function starters(ctx){ const pick=k=>ctx.cs.filter(c=>ctx.store.stageOf(c)===k).sort((a,b)=>totalScore(b,{})-totalScore(a,{})); return [...pick("short"),...pick("screened")].slice(0,5); }
function paintAgenda(ctx){ const host=document.getElementById("plAgenda"); if(!host) return;
  const all=ctx.cs.map(c=>({c,r:ctx.store.get(c)}));
  const items=all.filter(x=>x.r.next&&!stageOf(x.r.stage).closed).map(x=>({...x,due:dueInfo(x.r)}));
  const bare=all.filter(x=>INPLAY.includes(x.r.stage)&&!x.r.next).sort((a,b)=>IDX[b.r.stage]-IDX[a.r.stage]||totalScore(b.c,{})-totalScore(a.c,{}));
  const grp=[["Overdue",x=>x.due&&x.due.days<0],["This week",x=>x.due&&x.due.days>=0&&x.due.days<7],["Next week",x=>x.due&&x.due.days>=7&&x.due.days<14],["Later",x=>x.due&&x.due.days>=14],["No date",x=>!x.due]];
  const T=document.getElementById("plAgT"), S=document.getElementById("plAgS"), od=items.filter(grp[0][1]).length, wk=items.filter(grp[1][1]).length, sub="Next steps by due date · click to open the deal";
  if(items.length||bare.length){
    if(T) T.textContent=items.length?`${wk} due this week${od?`, ${od} overdue`:""}`:`${bare.length} deal${bare.length===1?"":"s"} in play without a next step`; if(S) S.textContent=sub;
    host.innerHTML=grp.map(([g,f])=>{ const l=items.filter(f).sort((a,b)=>(a.due?a.due.days:999)-(b.due?b.due.days:999)); return l.length?`<div class="ag-g"><span class="eyebrow">${g} · ${l.length}</span>${l.map(x=>`<button type="button" class="ag-row" data-open="${esc(x.c.id)}"><span class="ag-date ${x.due?x.due.tone:"neu"}">${esc(x.due?x.due.label:"—")}</span><span class="ag-what"><b>${esc(shortName(x.c.name))}</b><span>${esc(x.r.next)}</span></span>${spill(x.r.stage)}${avatar(x.r.owner)}</button>`).join("")}</div>`:""; }).join("")
      +(bare.length?`<div class="ag-g"><span class="eyebrow">In play, no next step · ${bare.length}</span>${bare.map(x=>`<button type="button" class="ag-row" data-open="${esc(x.c.id)}" data-focus="next"><span class="ag-date neu">Add step</span><span class="ag-what"><b>${esc(shortName(x.c.name))}</b><span>No next step set</span></span>${spill(x.r.stage)}${avatar(x.r.owner)}</button>`).join("")}</div>`:"");
  } else {
    const st=starters(ctx), kinds=[...new Set(st.map(c=>ctx.store.stageOf(c)))], k1=M.company.kpis[0];
    if(T) T.textContent=st.length?"Start here":"Next actions"; if(S) S.textContent=st.length?"Highest weighted score first (0–100) · moving one on opens its deal card":sub;
    host.innerHTML=st.length?`<p class="ag-lead"><b>No next steps yet.</b> These are the highest-scored ${kinds.map(k=>stageOf(k).label.toLowerCase()).join(" and ")} companies. Move one on, then set an owner and the first step.</p>
      <div class="ag-g">${st.map(c=>{ const k=ctx.store.stageOf(c), nx=FLOW[Math.min(FLOW.length-1,(IDX[k]||0)+1)], g=G[c.prim];
        return `<div class="ag-row ag-sug"><span class="ag-date sc num" title="Weighted score on default weights (0–100)">Score ${totalScore(c,{}).toFixed(0)}</span><button type="button" class="ag-what" data-open="${esc(c.id)}"><b>${esc(shortName(c.name))}</b><span>${[g?g.short:"",k1?fmtPlain(k1,c.m[k1]):""].filter(Boolean).map(esc).join(" · ")}</span></button>${spill(k)}<button type="button" class="btn sm" data-start="${esc(c.id)}" aria-label="Move ${esc(c.name)} to ${esc(nx.label)}">${icon("next")}${nx.key==="outreach"?"Start outreach":nx.key==="short"?"Shortlist":"Move to "+esc(nx.short)}</button></div>`; }).join("")}</div>`
      :`<div class="empty-cta"><b>No next steps yet.</b><span>Open a deal card and add a next step with a due date; it appears here, grouped by when it is due.</span></div>`;
  }
  host.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ const c=ctx.byId.get(b.dataset.open); if(c) openDrawer(c,ctx,b.dataset.focus); });
  host.querySelectorAll("[data-start]").forEach(b=>b.onclick=()=>{ const c=ctx.byId.get(b.dataset.start); if(!c) return; move(c,FLOW[Math.min(FLOW.length-1,(IDX[ctx.store.stageOf(c)]||0)+1)].key,ctx); openDrawer(c,ctx,"owner"); }); }
function paintStall(ctx){ const host=document.getElementById("plStall"); if(!host) return;
  const pts=ctx.cs.filter(c=>["short",...INPLAY].includes(ctx.store.stageOf(c))&&ctx.store.daysInStage(c)!=null).map(c=>{ const v=sizeKey?c.m[sizeKey]:null; return {c,x:ctx.store.daysInStage(c),y:totalScore(c,{}),v}; });
  if(pts.length<2){ host.innerHTML=`<div class="st-q" aria-hidden="true"><span>Attractive, moving</span><span class="hot">Attractive, stalled</span><span>Lower score, moving</span><span>Lower score, stalled</span></div><div class="empty-cta"><b>Builds up as deals move.</b><span>Each deal is plotted by days in its stage against its score; attractive deals that sit too long land top right.</span></div>`; return; }
  const vs=pts.map(p=>p.v).filter(v=>v>0), lo=Math.min(...vs), hi=Math.max(...vs);
  host.innerHTML=`<div id="plStallLab"></div>`;
  new C.Lab(host.firstChild,{height:280,points:pts.map(p=>({id:p.c.id,x:p.x,y:p.y,r:p.v>0?4+12*Math.sqrt((p.v-lo)/((hi-lo)||1)):4,color:stageColor(ctx.store.stageOf(p.c)),shape:"circle",label:shortName(p.c.name),name:shortName(p.c.name),c:p.c})),
    xLabel:"Days in current stage",yLabel:"Weighted score (0–100)",xTick:v=>String(Math.round(v)),yTick:v=>String(Math.round(v)),xFmt:v=>Math.round(v)+" days",yFmt:v=>v.toFixed(0),
    medianX:21,medianY:60,medianLabel:"score 60 · 21 days",quadrants:true,quadLabels:{tl:"Attractive, moving",tr:"Attractive, stalled",bl:"Lower score, moving",br:"Lower score, stalled"},
    tipHtml:p=>{ const r=ctx.store.get(p.c); return `<span class="tip-h">${esc(p.c.name)}</span><div class="tip-g"><span>Stage</span><span>${esc(stageOf(r.stage).label)}</span><span>Days in stage</span><span>${p.x}</span><span>Score</span><span>${p.y.toFixed(0)}</span>${r.owner?`<span>Owner</span><span>${esc(r.owner)}</span>`:""}</div><div class="tip-foot">Click to open the deal</div>`; },
    onPin:id=>{ const c=ctx.byId.get(id); if(c) openDrawer(c,ctx); }, onOpen:id=>{ const c=ctx.byId.get(id); if(c) openDrawer(c,ctx); }, aria:"Days in stage against score"}); }
function paintTeam(ctx){ const host=document.getElementById("plTeam"); if(!host) return; const act=ctx.cs.map(c=>({c,r:ctx.store.get(c)})).filter(x=>["short",...INPLAY].includes(x.r.stage));
  const owners=[...new Set(act.map(x=>x.r.owner||""))].sort((a,b)=>(a?0:1)-(b?0:1)||a.localeCompare(b));
  if(!act.length){ host.innerHTML=`<div class="empty-cta"><b>No active deals yet.</b><span>Shortlisted and in-play deals appear here per owner.</span></div>`; return; }
  const mx=Math.max(1,...owners.map(o=>act.filter(x=>(x.r.owner||"")===o).length)), ks=["short",...INPLAY];
  host.innerHTML=`<div class="tw">${owners.map(o=>{ const mine=act.filter(x=>(x.r.owner||"")===o); return `<div class="tw-row">${avatar(o)}<span class="tw-n">${esc(o||"Unassigned")}</span><span class="tw-bar">${ks.map(k=>{ const n=mine.filter(x=>x.r.stage===k).length; return n?`<i style="width:${n/mx*100}%;background:${stageColor(k)}" data-tip="${esc(`${o||"Unassigned"}: ${n} at ${stageOf(k).label}`)}"></i>`:""; }).join("")}</span><b class="num">${mine.length}</b></div>`; }).join("")}</div><div class="legend">${ks.map(k=>`<span style="display:inline-flex;align-items:center;gap:var(--s-1)"><i style="display:inline-block;width:var(--s-3);height:var(--s-2);border-radius:var(--r-1);background:${stageColor(k)}"></i>${esc(stageOf(k).short)}</span>`).join("")}</div>`; }
function logText(e, c){ const n=`<b>${esc(shortName(c.name))}</b>`; if(e.k==="stage") return `${n}: ${esc(stageOf(e.from).short)} → ${esc(stageOf(e.to).short)}`; if(e.k==="note") return `${n}: “${esc(e.text)}”`;
  const f={owner:"owner",next:"next step",due:"due date",last:"last contact",pri:"priority",reason:"reason"}[e.field]||e.field; return `${n}: ${esc(f)} ${e.to?`set to ${esc(e.to)}`:"cleared"}`; }
function paintFeed(ctx){ const host=document.getElementById("plFeed"); if(!host) return;
  const ev=[]; ctx.cs.forEach(c=>{ const r=ctx.store.rec(c.name); (r&&r.log||[]).forEach(e=>ev.push({e,c})); }); ev.sort((a,b)=>a.e.t<b.e.t?1:-1);
  host.innerHTML=ev.length?`<ul class="feed">${ev.slice(0,30).map(({e,c})=>`<li>${avatar(e.by)}<span class="fd-dot ${e.k}" ${e.k==="stage"?`style="--sc:${stageColor(e.to)}"`:""}></span><button type="button" class="linkbtn fd-t" data-open="${esc(c.id)}">${logText(e,c)}</button><span class="fd-w num">${esc(rel(e.t))}</span></li>`).join("")}</ul>`
    :`<div class="empty-cta"><b>Nothing logged yet.</b><span>Every stage move, edit and note is recorded here with who did it and when. Set your name under Storage so the team can tell entries apart.</span></div>`;
  host.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ const c=ctx.byId.get(b.dataset.open); if(c) openDrawer(c,ctx); }); }

// ---------- board interactions ----------
function move(c, stage, ctx, focus){ const r=ctx.store.get(c); if(r.stage===stage) return; PG.landed=c.id; PG.focus=!!focus; ctx.store.update(c,{stage});
  const s=stageOf(stage); toast(`${shortName(c.name)} → ${s.label}`); if(s.closed) openDrawer(c, ctx, "reason"); }
function boardClick(e, ctx){
  if(PG.justDragged){ PG.justDragged=false; return; }
  const t=e.target, id=x=>ctx.byId.get(x);
  const pr=t.closest("[data-promote]"); if(pr){ const c=id(pr.dataset.promote); if(c) move(c,"screened",ctx); return; }
  const ro=t.closest("[data-reopen]"); if(ro){ const c=id(ro.dataset.reopen); if(c){ const r=ctx.store.get(c); move(c, FLOW[Math.min(FLOW.length-1,Math.max(1,r.peak||1))].key, ctx); } return; }
  const mo=t.closest("[data-more]"); if(mo){ PG.poolLimit+=60; paintBoard(route().st,ctx,false); return; }
  const ct=t.closest("[data-ctab]"); if(ct){ PG.closedTab=ct.dataset.ctab; paintBoard(route().st,ctx,false); return; }
  const mn=t.closest("[data-menu]"); if(mn){ const c=id(mn.dataset.menu); if(c) cardMenu(mn, c, ctx); return; }
  const cd=t.closest(".pc,.pl-prow"); if(cd&&!t.closest("button,a")){ const c=id(cd.dataset.id); if(c) openDrawer(c,ctx); }
}
function boardKey(e, ctx){ const cd=e.target.closest&&e.target.closest(".pc,.pl-prow"); if(!cd) return; const c=ctx.byId.get(cd.dataset.id); if(!c) return;
  if(e.key==="Enter"){ e.preventDefault(); openDrawer(c,ctx); return; }
  if(e.shiftKey&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){ e.preventDefault(); const i=Math.min(FLOW.length-1,IDX[ctx.store.stageOf(c)]??0), j=Math.max(0,Math.min(FLOW.length-1,i+(e.key==="ArrowRight"?1:-1))); if(j!==i) move(c,FLOW[j].key,ctx,true); } }
let menuEl=null; function closeMenu(){ if(menuEl){ menuEl.remove(); menuEl=null; } }
function cardMenu(btn, c, ctx){ closeMenu(); const r=ctx.store.get(c), cur=r.stage;
  const m=document.createElement("div"); m.className="pop pl-menu"; m.setAttribute("role","menu");
  m.innerHTML=`<button type="button" role="menuitem" data-a="open">${icon("bolt")}Open deal details</button>${ctx.sample?"":`<a role="menuitem" href="${href("company",c.id,{})}">${icon("company")}Company page</a><button type="button" role="menuitem" data-a="cmp">${icon("plus")}Add to compare</button>`}<h4>Move to</h4>${ST.filter(s=>s.key!==cur).map(s=>`<button type="button" role="menuitem" data-mv="${s.key}">${spill(s.key)}</button>`).join("")}`;
  document.body.appendChild(m); const rc=btn.getBoundingClientRect(); m.style.top=(scrollY+rc.bottom+4)+"px"; m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,rc.right-m.offsetWidth))+"px"; menuEl=m; m.querySelector("button")?.focus();
  m.onclick=e=>{ const b=e.target.closest("[data-a],[data-mv]"); if(!b) return; closeMenu(); if(b.dataset.mv) move(c,b.dataset.mv,ctx); else if(b.dataset.a==="open") openDrawer(c,ctx); else if(b.dataset.a==="cmp") addCompare(c.id); };
  m.onkeydown=e=>{ if(e.key==="Escape"){ closeMenu(); btn.focus(); } };
  setTimeout(()=>document.addEventListener("click",function h(e){ if(menuEl&&!menuEl.contains(e.target)){ closeMenu(); document.removeEventListener("click",h); } }),0); }
function enableDnD(board, ctx){
  let d=null;
  const colAt=(x,y)=>{ const el=document.elementFromPoint(x,y); return el&&el.closest?el.closest(".pl-col"):null; };
  board.addEventListener("pointerdown",e=>{ if(e.button!==0||e.pointerType==="touch") return; const it=e.target.closest(".pc,.pl-prow"); if(!it||e.target.closest("button,a,input,select,textarea")) return;
    d={it,id:it.dataset.id,x0:e.clientX,y0:e.clientY,pid:e.pointerId,started:false}; });
  board.addEventListener("pointermove",e=>{ if(!d) return; const dx=e.clientX-d.x0, dy=e.clientY-d.y0;
    if(!d.started){ if(Math.hypot(dx,dy)<6) return; d.started=true; const r=d.it.getBoundingClientRect(); d.ox=d.x0-r.left; d.oy=d.y0-r.top;
      const g=d.it.cloneNode(true); g.classList.add("drag-ghost"); g.style.width=r.width+"px"; g.removeAttribute("tabindex"); document.body.appendChild(g); d.g=g; d.it.classList.add("drag-src"); document.body.classList.add("dragging");
      try{ board.setPointerCapture(d.pid); }catch(err){} }
    d.g.style.transform=`translate(${e.clientX-d.ox}px,${e.clientY-d.oy}px) rotate(1.5deg) scale(1.03)`;
    const col=colAt(e.clientX,e.clientY); if(col!==d.over){ if(d.over) d.over.classList.remove("drop-on"); d.over=col; if(col) col.classList.add("drop-on"); }
    const br=board.getBoundingClientRect(); if(e.clientX>br.right-60) board.scrollLeft+=14; else if(e.clientX<br.left+60) board.scrollLeft-=14; });
  const end=(e,cancel)=>{ if(!d) return; const x=d; d=null; if(!x.started) return; PG.justDragged=true; setTimeout(()=>PG.justDragged=false,60);
    try{ board.releasePointerCapture(x.pid); }catch(err){} document.body.classList.remove("dragging"); if(x.over) x.over.classList.remove("drop-on"); x.it.classList.remove("drag-src"); if(x.g) x.g.remove();
    if(cancel||!x.over) return; const c=ctx.byId.get(x.id); let stage=x.over.dataset.stage; if(!c) return;
    if(stage==="closed") stage=PG.closedTab||"passed"; if(stage&&stage!==ctx.store.stageOf(c)) move(c,stage,ctx); };
  board.addEventListener("pointerup",e=>end(e,false)); board.addEventListener("pointercancel",e=>end(e,true));
  board.addEventListener("keydown",e=>{ if(e.key==="Escape"&&d) end(e,true); });
}
function addPicker(btn, ctx){ closeMenu(); const m=document.createElement("div"); m.className="pop pl-menu pl-pick"; m.setAttribute("role","dialog"); m.setAttribute("aria-label","Add a company to the pipeline");
  m.innerHTML=`<input class="inp" type="search" placeholder="Find a company…" aria-label="Find a company"><div class="pl-pickl"></div>`; document.body.appendChild(m);
  const rc=btn.getBoundingClientRect(); m.style.top=(scrollY+rc.bottom+4)+"px"; m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,rc.right-m.offsetWidth))+"px"; menuEl=m;
  const inp=m.querySelector("input"), L=m.querySelector(".pl-pickl");
  const paint=()=>{ const q=inp.value.trim().toLowerCase(); const l=ctx.cs.filter(c=>!q||c.name.toLowerCase().includes(q)).sort((a,b)=>(IDX[ctx.store.stageOf(a)]-IDX[ctx.store.stageOf(b)])||totalScore(b,{})-totalScore(a,{})).slice(0,12);
    L.innerHTML=l.map(c=>`<button type="button" data-pick="${esc(c.id)}"><span>${esc(shortName(c.name))}</span>${spill(ctx.store.stageOf(c))}</button>`).join("")||`<p class="caption">No match.</p>`; };
  paint(); inp.oninput=paint; inp.focus();
  L.onclick=e=>{ const b=e.target.closest("[data-pick]"); if(!b) return; const c=ctx.byId.get(b.dataset.pick); closeMenu(); if(!c) return; const i=IDX[ctx.store.stageOf(c)]; if(i<IDX.outreach&&!stageOf(ctx.store.stageOf(c)).closed) move(c,"outreach",ctx); openDrawer(c,ctx); };
  m.onkeydown=e=>{ if(e.key==="Escape"){ closeMenu(); btn.focus(); } };
  setTimeout(()=>document.addEventListener("click",function h(e){ if(menuEl&&!menuEl.contains(e.target)&&e.target!==btn){ closeMenu(); document.removeEventListener("click",h); } }),0); }

// ---------- drawer ----------
const DR={el:null,scrim:null,c:null,ctx:null,unsub:null,ret:null};
function ensureDrawer(){ if(DR.el&&DR.el.isConnected) return; const s=document.createElement("div"); s.className="dr-scrim"; s.hidden=true; const a=document.createElement("aside"); a.className="drawer"; a.hidden=true; a.setAttribute("role","dialog"); a.setAttribute("aria-modal","true"); a.setAttribute("aria-labelledby","drT");
  document.body.append(s,a); DR.el=a; DR.scrim=s; s.onclick=closeDrawer;
  a.addEventListener("keydown",e=>{ if(e.key==="Escape"){ e.stopPropagation(); closeDrawer(); } if(e.key==="Tab"){ const f=[...a.querySelectorAll("button,a[href],input,select,textarea")].filter(x=>!x.disabled&&x.offsetParent!==null); if(!f.length) return; const first=f[0], last=f[f.length-1]; if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); } } }); }
function openDrawer(c, ctx, focusField){ ctx=ctx||REAL; ensureDrawer(); DR.c=c; DR.ctx=ctx; DR.ret=document.activeElement; DR.el.hidden=false; DR.scrim.hidden=false;
  const show=()=>{ if(!DR.el.hidden){ DR.el.classList.add("open"); DR.scrim.classList.add("open"); } }; requestAnimationFrame(show); setTimeout(show,80);
  paintDrawer(); if(DR.unsub) DR.unsub(); DR.unsub=ctx.store.on(()=>{ if(DR.c===c&&!DR.el.hidden) paintDrawerLive(); });
  const r=route(); if(r.page==="pipeline"&&r.st.open!==c.id) history.replaceState(null,"",href(r.page,r.arg,withState(r.st,{open:c.id})));
  setTimeout(()=>{ const f=focusField?DR.el.querySelector(`[data-f="${focusField}"]`):DR.el.querySelector(".dr-close"); if(f) f.focus(); },focusField?260:30); }
function closeDrawer(){ if(!DR.el||DR.el.hidden) return; DR.el.classList.remove("open"); DR.scrim.classList.remove("open"); if(DR.unsub){ DR.unsub(); DR.unsub=null; }
  setTimeout(()=>{ if(!DR.el.classList.contains("open")){ DR.el.hidden=true; DR.scrim.hidden=true; } },RM()?0:280);
  const r=route(); if(r.st.open) history.replaceState(null,"",href(r.page,r.arg,withState(r.st,{open:""}))); if(DR.ret&&DR.ret.isConnected) DR.ret.focus(); }
function stepper(c, ctx){ const r=ctx.store.get(c), cur=IDX[r.stage]??0, closed=stageOf(r.stage).closed, pk=closed?(r.peak||0):cur;
  return `<div class="dr-steps ${closed?"is-closed":""}" style="--p:${(pk/(FLOW.length-1)*100).toFixed(1)}%" role="group" aria-label="Stage">${FLOW.map((s,i)=>`<button type="button" class="dr-step ${i<=pk?"done":""} ${!closed&&i===cur?"cur":""}" data-stage="${s.key}" style="--sc:${stageColor(s.key)}" aria-pressed="${!closed&&i===cur}" aria-label="Move to ${esc(s.label)}"><i></i><span>${esc(s.short)}</span></button>`).join("")}</div>
    <div class="dr-close-row">${CLOSED.map(s=>`<button type="button" class="btn sm ${r.stage===s.key?"primary":""}" data-stage="${s.key}">${esc(s.label)}</button>`).join("")}${closed?`<span class="caption">Left at ${esc(FLOW[Math.min(FLOW.length-1,r.peak||0)].label)}</span>`:""}</div>`; }
function timeline(c, ctx){ const r=ctx.store.rec(c.name); const log=((r&&r.log)||[]).slice().reverse();
  return log.length?`<ol class="tl">${log.map(e=>`<li class="tl-${e.k}"><span class="tl-dot" ${e.k==="stage"?`style="--sc:${stageColor(e.to)}"`:""}></span><div><div class="tl-t">${e.k==="stage"?`Moved ${esc(stageOf(e.from).short)} → <b>${esc(stageOf(e.to).short)}</b>`:e.k==="note"?esc(e.text):`${esc({owner:"Owner",next:"Next step",due:"Due date",last:"Last contact",pri:"Priority",reason:"Reason"}[e.field]||e.field)}: ${e.to?`<b>${esc(e.to)}</b>`:"cleared"}`}</div><div class="tl-m">${e.by?`${avatar(e.by,"sm")} ${esc(e.by)} · `:""}${esc(rel(e.t))}</div></div></li>`).join("")}</ol>`
    :`<p class="caption">No activity yet. Moves, edits and notes are logged here with the date.</p>`; }
function paintDrawer(){ const c=DR.c, ctx=DR.ctx, r=ctx.store.get(c), g=G[c.prim], days=ctx.store.daysInStage(c), owners=ctx.store.owners(), closed=stageOf(r.stage).closed, kp=M.company.kpis.slice(0,3);
  DR.el.innerHTML=`
  <div class="dr-head"><div class="dr-top"><span class="eyebrow">${ctx.sample?"Sample deal":"Deal"} · ${esc(stageOf(r.stage).label)}${days!=null?` · ${days} day${days===1?"":"s"} in stage`:""}</span><button type="button" class="iconbtn dr-close" aria-label="Close">${icon("x")}</button></div>
    <h2 id="drT">${esc(c.name)}</h2><div class="pills">${g?`<span class="vpill"><span class="dot" style="background:${g.color}"></span>${esc(g.short)}</span>`:""}<span class="pill outline">Score ${totalScore(c,{}).toFixed(0)}</span>${c.verdict?pill(c.verdict.label,c.verdict.tone):""}${ctx.sample?"":`<a class="linkbtn" href="${href("company",c.id,{})}">Company page →</a>`}</div>
    ${stepper(c,ctx)}</div>
  <div class="dr-body">
    <div class="dr-facts">${kp.map(k=>`<div><span class="eyebrow">${esc(MET[k].short)}</span><b class="num">${esc(c.nm&&c.nm[k]?"n.m.":fmtPlain(k,c.m[k]))}</b></div>`).join("")}<div><span class="eyebrow">Since</span><b class="num">${r.since?esc(new Date(r.since).toLocaleDateString("en-GB",{day:"numeric",month:"short"})):"—"}</b></div></div>
    <div class="dr-form">
      <label><span>Owner</span><input class="inp" data-f="owner" list="drOwners" value="${esc(r.owner||"")}" placeholder="Who leads this"><datalist id="drOwners">${owners.map(o=>`<option value="${esc(o)}">`).join("")}</datalist></label>
      <label><span>Priority</span><span class="seg" data-f="pri" role="group" aria-label="Priority">${["A","B","C",""].map(p=>`<button type="button" data-pri="${p}" aria-pressed="${(r.pri||"")===p}">${p||"–"}</button>`).join("")}</span></label>
      <label class="wide"><span>Next step</span><input class="inp" data-f="next" value="${esc(r.next||"")}" placeholder="e.g. Intro call with the promoter"></label>
      <label><span>Due</span><input class="inp" type="date" data-f="due" value="${esc(r.due||"")}"></label>
      <label><span>Last contact</span><span class="dr-inl"><input class="inp" type="date" data-f="last" value="${esc(r.last||"")}"><button type="button" class="btn sm" data-today>Today</button></span></label>
      ${closed?`<label class="wide"><span>Reason</span><select class="inp" data-f="reason"><option value="">Choose a reason…</option>${REASONS.map(x=>`<option ${r.reason===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>`:""}
    </div>
    <div class="dr-note"><label for="drNote" class="eyebrow">Add a note</label><textarea id="drNote" class="inp" rows="2" placeholder="Call notes, concerns, what was agreed… (Ctrl+Enter to add)"></textarea><button type="button" class="btn sm primary" data-addnote>Add note</button></div>
    <h3 class="eyebrow" style="margin-top:var(--s-4)">Activity</h3><div class="dr-tl">${timeline(c,ctx)}</div>
  </div>
  <div class="dr-foot">${ctx.sample?"":`<button type="button" class="btn sm" data-cmp>${icon("plus")}Compare</button>`}<span class="grow"></span><span class="dr-saved caption" aria-live="polite"></span>${syncPill(ctx.store)}</div>`;
  const el=DR.el, save=patch=>{ ctx.store.update(c,patch); const s=el.querySelector(".dr-saved"); if(s){ s.textContent="Saved"; clearTimeout(s._t); s._t=setTimeout(()=>s.textContent="",1600); } };
  el.querySelector(".dr-close").onclick=closeDrawer;
  el.querySelectorAll(".dr-steps [data-stage], .dr-close-row [data-stage]").forEach(b=>b.onclick=()=>{ const k=b.dataset.stage; if(ctx.store.stageOf(c)===k) return; PG.landed=c.id; ctx.store.update(c,{stage:k}); paintDrawer(); if(stageOf(k).closed){ const f=el.querySelector('[data-f="reason"]'); if(f) f.focus(); } });
  el.querySelectorAll("input[data-f]").forEach(i=>i.addEventListener("change",()=>save({[i.dataset.f]:i.value.trim()})));
  const rs=el.querySelector('select[data-f="reason"]'); if(rs) rs.onchange=()=>save({reason:rs.value});
  el.querySelectorAll("[data-pri]").forEach(b=>b.onclick=()=>{ save({pri:b.dataset.pri}); el.querySelectorAll("[data-pri]").forEach(x=>x.setAttribute("aria-pressed",x===b)); });
  el.querySelector("[data-today]").onclick=()=>{ const v=window.Pipeline.dayKey(); el.querySelector('[data-f="last"]').value=v; save({last:v}); };
  const ta=el.querySelector("#drNote"), add=()=>{ if(!ta.value.trim()) return; ctx.store.note(c,ta.value); ta.value=""; };
  el.querySelector("[data-addnote]").onclick=add; ta.onkeydown=e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); add(); } };
  const cb=el.querySelector("[data-cmp]"); if(cb) cb.onclick=()=>addCompare(c.id);
  el.querySelectorAll("[data-sync]").forEach(b=>b.onclick=()=>settings(ctx.store)); }
function paintDrawerLive(){ const el=DR.el, c=DR.c, ctx=DR.ctx; if(!el||!c) return; const tl=el.querySelector(".dr-tl"); if(tl) tl.innerHTML=timeline(c,ctx);
  const ft=el.querySelector(".dr-foot .syncpill"); if(ft) ft.outerHTML=syncPill(ctx.store); el.querySelectorAll(".dr-foot [data-sync]").forEach(b=>b.onclick=()=>settings(ctx.store)); }

// ---------- storage settings ----------
function settings(store){ let m=document.getElementById("pipeCfg"); if(!m){ m=document.createElement("div"); m.id="pipeCfg"; m.className="modal"; m.setAttribute("role","dialog"); m.setAttribute("aria-modal","true"); m.setAttribute("aria-label","Pipeline storage"); document.body.appendChild(m); }
  if(store.memory){ toast("The sample preview is not saved anywhere."); return; }
  const cfg={mode:"local",branch:"main",...store.cfg}, owner=(M.repo||"").split("/")[0]||"";
  m.hidden=false; m.innerHTML=`<div class="keys cfg"><h2>Pipeline storage</h2><p class="caption">Stages, owners, next steps and notes are team data. They are never written to the published dashboard or its public repo.</p>
    <div class="seg" role="group" aria-label="Where to keep the pipeline"><button type="button" data-mode="local" aria-pressed="${cfg.mode!=="github"}">This device only</button><button type="button" data-mode="github" aria-pressed="${cfg.mode==="github"}">Private GitHub repo (team)</button></div>
    <div class="cfg-gh" ${cfg.mode==="github"?"":"hidden"}>
      <label><span>Private repo</span><input class="inp" data-c="repo" value="${esc(cfg.repo||(owner?owner+"/gpc-pipeline":""))}" placeholder="owner/name"></label>
      <label><span>Branch</span><input class="inp" data-c="branch" value="${esc(cfg.branch||"main")}"></label>
      <label><span>File</span><input class="inp" data-c="path" value="${esc(cfg.path||`pipeline/${store.key}.json`)}"></label>
      <label><span>Your GitHub token</span><input class="inp" type="password" data-c="token" value="${esc(cfg.token||"")}" autocomplete="off" placeholder="Fine-grained token: Contents read and write on that repo only"></label>
      <p class="caption">The token is stored only in this browser and sent only to GitHub. The repo must be private; a public repo is refused. Each teammate uses their own token.</p></div>
    <label><span>Your name (shown on your activity)</span><input class="inp" data-c="me" value="${esc(cfg.me||"")}" placeholder="e.g. Faizan Ansari"></label>
    <div class="cfg-st caption" aria-live="polite">${esc(store.status.msg||"")}</div>
    <div class="pills"><button type="button" class="btn primary sm" data-save>Save</button><button type="button" class="btn sm" data-test ${cfg.mode==="github"?"":"hidden"}>Test connection</button><button type="button" class="btn sm" data-export>${icon("down")}Export backup</button><label class="btn sm">Import backup<input type="file" accept="application/json,.json" hidden data-import></label><button type="button" class="btn sm" data-close>Close</button></div></div>`;
  const val=k=>(m.querySelector(`[data-c="${k}"]`)||{}).value||"", st=m.querySelector(".cfg-st");
  let mode=cfg.mode==="github"?"github":"local";
  m.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{ mode=b.dataset.mode; m.querySelectorAll("[data-mode]").forEach(x=>x.setAttribute("aria-pressed",x===b)); m.querySelector(".cfg-gh").hidden=mode!=="github"; m.querySelector("[data-test]").hidden=mode!=="github"; });
  m.querySelector("[data-test]").onclick=async()=>{ st.textContent="Checking…"; try{ const be=new window.Pipeline.GitHubBackend({repo:val("repo").trim(),branch:val("branch").trim()||"main",path:val("path").trim(),token:val("token").trim()}); const j=await be.check(); const r=await be.load(); st.textContent=`Connected to private repo ${j.full_name}. ${r.data?`Pipeline file found (${Object.keys(r.data.recs||{}).length} deals).`:"The pipeline file will be created on the first save."}`; }catch(e){ st.textContent=e.message; } };
  m.querySelector("[data-save]").onclick=async()=>{ store.saveCfg({mode, repo:val("repo").trim(), branch:val("branch").trim()||"main", path:val("path").trim(), token:val("token").trim(), me:val("me").trim()}); st.textContent="Saved. Syncing…"; await store.pull(); if(store.status.state==="synced"&&Object.keys(store.state.recs).length) await store.push(); st.textContent=store.status.msg||(mode==="github"?"Team sync is on.":"Kept on this device."); };
  m.querySelector("[data-export]").onclick=()=>download(new Blob([store.exportJSON()],{type:"application/json"}),`${store.key}-pipeline-${window.Pipeline.dayKey()}.json`);
  m.querySelector("[data-import]").onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ store.importJSON(t); st.textContent="Backup merged into the pipeline."; }).catch(err=>st.textContent=err.message); };
  m.querySelector("[data-close]").onclick=()=>{ m.hidden=true; }; m.onclick=e=>{ if(e.target===m) m.hidden=true; }; m.onkeydown=e=>{ if(e.key==="Escape") m.hidden=true; };
  m.querySelector("[data-mode]").focus(); }

// ---------- embeds for other pages ----------
function stagePill(c){ return spill(PIPE.stageOf(c)); }
function heroPills(c){ const r=PIPE.get(c), d=dueInfo(r); return `<span class="spill ${stageDark(r.stage)?"dk":""}" style="--sc:${stageColor(r.stage)}" title="Deal pipeline stage">Pipeline: ${esc(stageOf(r.stage).short)}</span>${r.owner?`<span class="pill outline">${esc(r.owner)}</span>`:""}${r.next?`<span class="pill ${d&&d.days<0?"neg":"outline"}">Next: ${esc(r.next)}${d?` · ${esc(d.label)}`:""}</span>`:""}`; }
function companyPanel(host, c){ const paint=()=>{ const r=PIPE.get(c), d=dueInfo(r);
    host.innerHTML=`<div class="dr-head pp-band">${stepper(c,REAL)}</div><div class="cp-row"><span>${avatar(r.owner)} ${esc(r.owner||"No owner")}</span>${r.next?`<span class="pc-next ${d?d.tone:"neu"}">${icon("bolt")}<span>${esc(r.next)}</span>${d?`<b>${esc(d.label)}</b>`:""}</span>`:`<span class="caption">No next step</span>`}</div><div class="dr-tl">${timeline(c,REAL)}</div>
      <div class="pills" style="margin-top:var(--s-3)"><button type="button" class="btn sm primary" data-edit>${icon("bolt")}Edit deal</button><a class="btn sm" href="${href("pipeline","",{open:c.id})}">Open in pipeline</a>${syncPill(PIPE)}</div>`;
    host.querySelectorAll(".dr-steps [data-stage], .dr-close-row [data-stage]").forEach(b=>b.onclick=()=>{ if(PIPE.stageOf(c)!==b.dataset.stage){ PIPE.update(c,{stage:b.dataset.stage}); if(stageOf(b.dataset.stage).closed) openDrawer(c,REAL,"reason"); } });
    host.querySelector("[data-edit]").onclick=()=>openDrawer(c,REAL); host.querySelectorAll("[data-sync]").forEach(b=>b.onclick=()=>settings(PIPE)); };
  paint(); const un=PIPE.on(()=>{ if(host.isConnected) paint(); else un(); }); }
function glance(host, st){ const f=flowStats(REAL), n=counts(REAL), items=M.companies.map(c=>({c,r:PIPE.get(c)})).filter(x=>x.r.next&&!stageOf(x.r.stage).closed).map(x=>({...x,due:dueInfo(x.r)})).sort((a,b)=>(a.due?a.due.days:999)-(b.due?b.due.days:999)).slice(0,4);
  host.innerHTML=`<div class="gl"><div class="gl-r" id="glRiver"></div><div class="gl-a">${items.length?items.map(x=>`<a class="ag-row" href="${href("pipeline","",{open:x.c.id})}"><span class="ag-date ${x.due?x.due.tone:"neu"}">${esc(x.due?x.due.label:"—")}</span><span class="ag-what"><b>${esc(shortName(x.c.name))}</b><span>${esc(x.r.next)}</span></span>${avatar(x.r.owner)}</a>`).join(""):`<p class="caption">No next steps yet. ${INPLAY.reduce((a,k)=>a+n[k],0)} deals in play; open the pipeline to start tracking.</p>`}</div></div>`;
  C.river(host.querySelector("#glRiver"),{compact:true,stages:f.stages,exits:f.exits,aria:"Pipeline flow",tip:s=>riverTip(s,REAL),onNode:()=>go("pipeline","",{})}); }
function slideHtml(){ const n=counts(REAL), inp=M.companies.map(c=>({c,r:PIPE.get(c)})).filter(x=>INPLAY.includes(x.r.stage)||x.r.stage==="short").sort((a,b)=>IDX[b.r.stage]-IDX[a.r.stage]||totalScore(b.c,{})-totalScore(a.c,{})).slice(0,10);
  return `<p class="headline">${INPLAY.reduce((a,k)=>a+n[k],0)} in play · ${n.short} shortlisted · ${n.screened} screened</p><div data-chart="river"></div>
    <table class="cmp" style="margin-top:var(--s-3)"><thead><tr><th class="l">Company</th><th class="l">Stage</th><th class="l">Owner</th><th class="l">Next step</th><th class="l">Due</th></tr></thead><tbody>${inp.length?inp.map(x=>`<tr><td class="l"><b>${esc(shortName(x.c.name))}</b></td><td class="l">${spill(x.r.stage)}</td><td class="l note">${esc(x.r.owner||"–")}</td><td class="l note">${esc(x.r.next||"–")}</td><td class="l note">${esc((dueInfo(x.r)||{}).label||"–")}</td></tr>`).join(""):`<tr><td class="l note" colspan="5">No deals in play yet.</td></tr>`}</tbody></table>`; }
function drawSlide(el){ const f=flowStats(REAL); C.river(el,{stages:f.stages,exits:f.exits,height:240,aria:"Pipeline flow",tip:s=>riverTip(s,REAL)}); }

// ---------- sample preview (design review only; made-up companies, never saved) ----------
function sampleCtx(){
  const words=["Aurora","Beacon","Cobalt","Delta","Ember","Fable","Granite","Harbor","Iris","Juniper","Kestrel","Lumen","Meridian","Nimbus","Onyx","Pinnacle","Quarry","Ridge","Summit","Tidal","Umber","Vertex","Willow","Zenith","Atlas","Borealis","Cedar","Dune"];
  const gs=M.groups.filter(g=>!g.other).slice(0,6), crit=(M.scoring?M.scoring.criteria:[]);
  const cs=words.map((w,i)=>{ const g=gs[i%gs.length], m={}; Object.keys(MET).forEach(k=>{ const s=M.stats[k]; if(s&&s.n) m[k]=s.q1+(((i*37+k.length*11)%100)/100)*((s.q3-s.q1)||Math.abs(s.med)||1); });
    const sc={}; crit.forEach((k,j)=>{ sc[k.key]=((i*53+j*29)%100)/100; }); return {id:"sample-"+i,name:`${w} Sample Co`,prim:g.key,groups:[{key:g.key}],m,nm:{},sc,flags:[],verdict:null,pct:{},sample:true}; });
  const store=new window.Pipeline.Store({key:"sample",stages:ST,seed:()=>"long",memory:true});
  const day=86400000, now=Date.now(), iso=d=>new Date(now-d*day).toISOString(), due=d=>window.Pipeline.dayKey(new Date(now+d*day));
  const plan=[["ic","Principal","Final IC memo",3,"A",9],["ic","VP","Pre-IC review",-1,"A",21],["nda","Associate","Data room review",-2,"A",12],["nda","VP","Management meeting",5,"B",33],["engaged","Associate","Second call with promoter",1,"A",6],["engaged","VP","Site visit",9,"B",18],["engaged","Principal","Send NDA",2,"B",41],["outreach","Associate","Follow up on intro email",-3,"B",15],["outreach","Associate","Warm intro via advisor",12,"C",4],["outreach","VP","Call the promoter",0,"",27],["outreach","Principal","",null,"",8],["short","Associate","Desk diligence",6,"B",11],["short","","",null,"",3],["short","VP","Peer comparison",10,"C",24],["screened","","",null,"",5],["screened","","",null,"",2],["screened","","",null,"",19],["passed","VP","",null,"",14,"Valuation",4],["passed","Associate","",null,"",30,"Promoter not selling",3],["hold","Principal","",null,"",22,"Timing",5]];
  plan.forEach((p,i)=>{ const c=cs[i]; const [stage,owner,next,dd,pri,age,reason,peak]=p; const idx=IDX[stage]; const pk=peak!=null?peak:idx; const log=[];
    let t=age+6*Math.max(1,pk); for(let s=1;s<=pk;s++){ log.push({t:iso(t),k:"stage",from:FLOW[s-1].key,to:FLOW[s].key,by:owner||"Associate"}); t=Math.max(age,t-6); }
    if(stageOf(stage).closed) log.push({t:iso(age),k:"stage",from:FLOW[pk].key,to:stage,by:owner||"Associate"});
    if(next) log.push({t:iso(Math.max(0,age-1)),k:"edit",field:"next",to:next,by:owner||"Associate"});
    if(i%3===0) log.push({t:iso(Math.max(0,age-2)),k:"note",text:["Promoter open to a conversation; wants to understand our timeline.","Asked for three years of segment numbers.","Valuation expectations look high; revisit after results."][i%3===0?(i/3)%3:0],by:owner||"Associate"});
    store.state.recs[c.name]={stage,owner,next,due:dd==null?"":due(dd),pri,since:iso(age),peak:pk,reason:reason||"",u:iso(Math.max(0,age-1)),by:owner,log}; });
  return {cs, store, byId:new Map(cs.map(c=>[c.id,c])), sample:true};
}

return { page, stagePill, heroPills, companyPanel, glance, slideHtml, drawSlide, openDrawer, closeDrawer, settings, syncPill:()=>syncPill(PIPE), sampleCtx, stageColor, spill, counts:()=>counts(REAL), INPLAY, _pg:PG };
};
