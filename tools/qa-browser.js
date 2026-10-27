/* In-browser QA. Paste into the console of a built dashboard (or run via Playwright) and await the result:
   visits every page and every company page; checks for script errors, NaN/undefined/>999% text, charts without
   unit labels, and that every screener cell equals the model value formatted by the shared formatter. */
(async function(){
  const A = window.__APP, M = window.MODEL, out = {pages:0, companies:0, failures:[]};
  const fail = (where, what)=>out.failures.push(`${where}: ${what}`);
  const goto = h=>{ history.replaceState(null,"",h); A.render(); };
  const bad = /\bNaN\b|undefined|Infinity|\[object|>999%|\+>999/;
  const check = (where)=>{ const main=document.getElementById("main"); const t=main.innerText;
    const m=t.match(bad); if(m) fail(where, `text contains "${m[0]}"`);
    main.querySelectorAll("svg.chart").forEach((s,i)=>{ if(!s.querySelector("path,rect,circle,polygon,line")) fail(where,`chart ${i} is empty`); });
    main.querySelectorAll("section.card").forEach(card=>{ if(card.querySelector("svg.chart")){ const sub=(card.querySelector(".sub")||{}).textContent||""; if(!/₹|%|x\b|cr|score|share|0–100/i.test(sub)) fail(where,`chart "${(card.querySelector("h2")||{}).textContent}" subtitle has no unit`); } });
    if(window.__ERRORS.length) fail(where, "script error: "+window.__ERRORS.splice(0).join(" | ")); };
  for(const p of ["overview","screener","shortlist","compare","dq","method","dev/gallery"]){ goto("#/"+p); check(p); out.pages++; }
  for(const c of M.companies){ goto("#/company/"+encodeURIComponent(c.id)); check("company/"+c.id);
    if(!document.querySelector("#main .kpis")) fail("company/"+c.id,"no KPI strip"); out.companies++; }
  // numbers trace to the model: every visible screener cell = fmt(model value)
  goto("#/screener?v=all");
  const ths=[...document.querySelectorAll("thead tr.cols th")].map(th=>th.dataset.k);
  let cells=0;
  document.querySelectorAll("tbody tr[data-id]").forEach(tr=>{ const c=M.companies.find(x=>x.id===tr.dataset.id);
    [...tr.children].forEach((td,i)=>{ const k=ths[i]; if(!k||k==="name"||k==="desc"||k==="ev"||!M.metrics[k]||M.metrics[k].fmt==="spark") return;
      const tmp=document.createElement("span"); tmp.innerHTML=A.fmt(k,c.m[k],c); if(tmp.textContent!==td.textContent) fail("screener",`${c.name} ${k}: cell "${td.textContent}" != model "${tmp.textContent}"`); cells++; }); });
  out.cellsChecked=cells;
  // KPI universe equals company count
  goto("#/overview");
  const u=document.querySelector(".kpi .kpi-v"); if(!u||+u.textContent!==M.companies.length) fail("overview","universe KPI does not equal the company count");
  // interactions: positioning lab select / pin / zoom
  try{
    goto("#/overview"); const lab=A.OV.lab; if(!lab) fail("overview","positioning lab missing");
    else { const ids=[...lab.pos.keys()].slice(0,3); lab.o.onSelect(ids);
      if(A.route().st.sel.length!==3) fail("overview","brush selection did not reach the URL");
      if(!/3 companies selected/.test(document.getElementById("labT").textContent)) fail("overview","selection title not updated");
      lab.o.onPin(ids[0]); if(A.route().st.pin!==ids[0]) fail("overview","pin did not reach the URL");
      lab.zoomBy(0.5); if(!A.route().st.z) fail("overview","zoom did not reach the URL");
      lab.o.onZoom(null); lab.o.onSelect([]); lab.o.onPin(null); }
    if(document.querySelectorAll("#tm .tm-leaf").length<1) fail("overview","treemap has no tiles");
    // screener histogram slider writes a range filter
    goto("#/screener"); const k=M.filters.ranges[0], hs=A.SCR.hs[k];
    if(!hs) fail("screener","histogram slider missing"); else { hs.a.value=300; hs.a.dispatchEvent(new Event("input")); hs.a.dispatchEvent(new Event("change"));
      if(!A.route().st.r[k]||A.route().st.r[k][0]==null) fail("screener","range slider did not set a filter");
      goto("#/screener"); }
    goto("#/screener?ch=1"); if(!A.SCR.lab) fail("screener","linked chart missing");
    // shortlist re-ranking order matches the weights
    if(M.companies.some(c=>c.shortlisted)){ goto("#/shortlist"); const r=document.querySelector("[data-w]");
      if(r){ r.value=50; r.dispatchEvent(new Event("input")); await new Promise(res=>setTimeout(res,120));
        const ty=x=>+((x.style.transform.match(/translateY\(([-\d.]+)px\)/)||[0,0])[1]); const rows=[...document.querySelectorAll(".sb-row")].sort((a,b)=>ty(a)-ty(b));
        const scores=rows.map(x=>+x.querySelector(".sb-tot").textContent); if(scores.some((s,i)=>i&&s>scores[i-1]+1e-9)) fail("shortlist","scoreboard order does not follow the scores"); } }
    // presentation mode
    A.Present.open(); if(!(A.Present.n>2)) fail("present","too few slides"); A.Present.go(A.Present.n-1); if(A.Present.i!==A.Present.n-1) fail("present","navigation failed");
    if(document.querySelector("#present .sb[data-overflow]")) fail("present","a slide overflows"); A.Present.close();
    // command palette
    dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true})); if(document.getElementById("search").hidden) fail("palette","Ctrl+K did not open the palette");
    dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}));
    if(window.__ERRORS.length) fail("interactions","script error: "+window.__ERRORS.splice(0).join(" | "));
  }catch(e){ fail("interactions", String(e&&e.stack||e)); }
  goto("#/overview");
  out.ok = out.failures.length===0;
  return out;
})();
