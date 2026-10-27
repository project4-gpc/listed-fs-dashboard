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
    main.querySelectorAll("svg.chart").forEach((s,i)=>{ if(!s.querySelector("path,rect,circle")) fail(where,`chart ${i} is empty`); });
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
  out.ok = out.failures.length===0;
  return out;
})();
