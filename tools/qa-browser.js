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
  for(const p of ["overview","pipeline","screener","shortlist","compare","dq","method","dev/gallery","dev/pipeline-sample"]){ goto("#/"+p); check(p); out.pages++; }
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
  // pipeline: board, moves, drawer, drag and drop, persistence, and team sync against a mocked GitHub API
  try{
    const P=A.PIPE, U=A.PUI, PL=window.Pipeline;
    if(!P||!U) fail("pipeline","pipeline module missing");
    else {
      const backup=JSON.stringify(P.state);
      goto("#/pipeline");
      if(document.querySelectorAll(".pl-col").length<8) fail("pipeline","board columns missing");
      if(document.querySelectorAll("#plRiver .rv-node").length!==7) fail("pipeline","river stages missing");
      // fresh pipeline (nothing in play, no next steps): path ahead in the river, sample link, and a start-here list that moves a company on
      if(!M.companies.some(x=>{ const r=P.get(x); return r.next||U.INPLAY.includes(r.stage); })){
        if(!document.querySelector("#plRiver .rv-ghost")) fail("pipeline","river has no path ahead for unreached stages");
        if(!document.querySelector('#plHero a[href*="pipeline-sample"]')) fail("pipeline","sample preview link missing from the empty pipeline");
        const sb=document.querySelector("#plAgenda [data-start]");
        if(!sb){ if(M.companies.some(x=>["short","screened"].includes(P.stageOf(x)))) fail("pipeline","start-here list missing"); }
        else { const sc=M.companies.find(x=>x.id===sb.dataset.start), i0=P.stageIndex(sc); sb.click();
          if(P.stageIndex(sc)!==i0+1) fail("pipeline","start-here did not move the company on");
          const sd=document.querySelector(".drawer"); if(!sd||sd.hidden) fail("pipeline","start-here did not open the deal card");
          U.closeDrawer(); goto("#/pipeline");
          if(U.INPLAY.includes(P.stageOf(sc))&&!document.querySelector('#plAgenda [data-focus="next"]')) fail("pipeline","a deal in play without a next step is not flagged in the agenda"); } }
      const c=M.companies.find(x=>P.stageOf(x)==="screened")||M.companies.find(x=>P.stageOf(x)==="long");
      P.update(c,{stage:"outreach"}); goto("#/pipeline");
      if(!document.querySelector(`.pl-col[data-stage="outreach"] .pc[data-id="${CSS.escape(c.id)}"]`)) fail("pipeline","moved card is not in the Outreach column");
      const lg=P.get(c).log; if(!lg.length||lg[lg.length-1].k!=="stage"||lg[lg.length-1].to!=="outreach") fail("pipeline","stage move was not logged");
      // drawer edits and notes
      U.openDrawer(c); const dr=document.querySelector(".drawer");
      if(!dr||dr.hidden) fail("pipeline","drawer did not open");
      else { const o=dr.querySelector('[data-f="owner"]'); o.value="QA Owner"; o.dispatchEvent(new Event("change"));
        if(P.get(c).owner!=="QA Owner") fail("pipeline","owner edit not saved");
        const ta=dr.querySelector("#drNote"); ta.value="QA note"; dr.querySelector("[data-addnote]").click();
        if(!P.get(c).log.some(e=>e.k==="note"&&e.text==="QA note")) fail("pipeline","note not saved"); }
      U.closeDrawer();
      // drag and drop with a simulated mouse
      goto("#/pipeline"); const card=document.querySelector(`.pc[data-id="${CSS.escape(c.id)}"]`), board=document.getElementById("plBoard"), col=document.querySelector('.pl-col[data-stage="engaged"]');
      if(card&&board&&col){ card.scrollIntoView({block:"center",inline:"center"}); const a=card.getBoundingClientRect(); const ev=(t,x,y)=>new PointerEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,buttons:1,pointerId:7,pointerType:"mouse",isPrimary:true});
        card.dispatchEvent(ev("pointerdown",a.left+30,a.top+12)); col.scrollIntoView({block:"nearest",inline:"nearest"}); const b=col.getBoundingClientRect();
        const tx=b.left+b.width/2, ty=Math.min(Math.max(b.top,90)+60, Math.min(b.bottom,innerHeight)-30);
        board.dispatchEvent(ev("pointermove",a.left+60,a.top+40)); board.dispatchEvent(ev("pointermove",tx,ty)); board.dispatchEvent(ev("pointerup",tx,ty));
        if(P.stageOf(c)!=="engaged") fail("pipeline",`drag and drop did not move the card (stage ${P.stageOf(c)})`); }
      else fail("pipeline","drag test setup failed");
      await P.push(); let saved=null; try{ saved=JSON.parse(localStorage.getItem("gpc-pipe-"+M.key)||"null"); }catch(e){}
      if(!saved||!saved.recs||!saved.recs[c.name]) fail("pipeline","pipeline not kept on this device");
      // one connection setup serves every dashboard on the site; only the file path is per dashboard
      const keep=localStorage.getItem("gpc-pipe-cfg");
      try{ const sa=new PL.Store({key:"qa-a"}); sa.saveCfg({mode:"github",repo:"o/r",token:"t",me:"QA",path:"pipeline/qa-a.json"});
        const cb=PL.Store.loadCfg("qa-b"); if(cb.mode!=="github"||cb.repo!=="o/r"||cb.token!=="t"||cb.me!=="QA"||cb.path) fail("pipeline","connection settings are not shared across dashboards");
        if(PL.Store.loadCfg("qa-a").path!=="pipeline/qa-a.json") fail("pipeline","per-dashboard file path not kept"); }
      finally{ if(keep==null) localStorage.removeItem("gpc-pipe-cfg"); else localStorage.setItem("gpc-pipe-cfg",keep); localStorage.removeItem("gpc-pipe-cfg-qa-a"); }
      // the ?connect=1 link opens the storage dialog on the team option, and closing it drops the flag from the address
      goto("#/pipeline?connect=1"); const dlg=document.getElementById("pipeCfg");
      if(!dlg||dlg.hidden||(P.cfg.mode!=="github"&&dlg.querySelector('[data-mode="team"]').getAttribute("aria-pressed")!=="true")) fail("pipeline","connect link did not open the team storage setup");
      if(dlg&&!P.team&&!dlg.querySelector(".cfg-own").open) fail("pipeline","with no team access yet, the connect link does not show the owner setup");
      if(dlg){ dlg.querySelector("[data-close]").click(); if(/connect=/.test(location.hash)) fail("pipeline","connect flag left in the address"); }
      // team sync against a mocked GitHub API (no network, no real token)
      const realFetch=window.fetch, srv={priv:true,content:null,sha:null,conflict:true}, J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"Content-Type":"application/json"}});
      window.fetch=async(url,opt={})=>{ const u=String(url); if(!u.startsWith("https://mock.test/")) return realFetch(url,opt);
        if(/\/repos\/o\/r$/.test(u)) return J({private:srv.priv,full_name:"o/r"});
        if((opt.method||"GET")==="GET"){ if(!srv.content) return J({message:"Not Found"},404);
          if(srv.big) return (opt.headers||{}).Accept==="application/vnd.github.raw+json"?new Response(srv.content,{status:200}):J({sha:srv.sha,content:"",encoding:"none",size:2e6});
          return J({sha:srv.sha,content:PL.b64encode(srv.content),encoding:"base64"}); }
        const body=JSON.parse(opt.body);
        if(srv.conflict){ srv.conflict=false; srv.content=JSON.stringify({v:1,recs:{"Teammate Co":{stage:"nda",u:new Date().toISOString(),log:[]}}}); srv.sha="s2"; return J({message:"conflict"},409); }
        if(srv.sha&&body.sha!==srv.sha) return J({message:"stale"},409);
        srv.content=PL.b64decode(body.content); srv.sha="s"+(Math.random()*1e6|0); return J({content:{sha:srv.sha}}); };
      try{
        const s=new PL.Store({key:"qa-mock",memory:true}); s.saveCfg({mode:"github",repo:"o/r",token:"t",api:"https://mock.test"});
        s.update({name:"QA Co"},{stage:"engaged"}); await s.push();
        const remote=JSON.parse(srv.content||"{}");
        if(s.status.state!=="synced") fail("pipeline sync",`not synced: ${s.status.state} ${s.status.msg}`);
        if(!remote.recs||!remote.recs["QA Co"]||!remote.recs["Teammate Co"]) fail("pipeline sync","a concurrent teammate edit was lost in the merge");
        srv.priv=false; const s2=new PL.Store({key:"qa-mock2",memory:true}); s2.saveCfg({mode:"github",repo:"o/r",token:"t",api:"https://mock.test"}); s2.update({name:"QA Co"},{stage:"outreach"}); await s2.push();
        if(s2.status.state!=="error"||!/public/i.test(s2.status.msg)) fail("pipeline sync","a public repo was not refused");
        // a file over 1 MB is read through the raw media type
        srv.priv=true; srv.big=true; const ld=await new PL.GitHubBackend({repo:"o/r",path:"p.json",token:"t",api:"https://mock.test"}).load();
        if(!ld.data||!ld.data.recs||!ld.data.recs["QA Co"]) fail("pipeline sync","a large pipeline file was not read");
        // records kept on a device before it connected are uploaded on the first sync
        srv.big=false; srv.content=null; srv.sha=null; const s3=new PL.Store({key:"qa-mock3",memory:true}); s3.saveCfg({mode:"github",repo:"o/r",token:"t",api:"https://mock.test"});
        s3.state={v:1,recs:{"Local Co":{stage:"outreach",u:new Date().toISOString(),log:[]}}}; await s3.pull();
        const up=JSON.parse(srv.content||"{}"); if(!up.recs||!up.recs["Local Co"]) fail("pipeline sync","records kept on this device before connecting were not uploaded");
        // team password: wrong password refused, right one opens; a token replaced under the same password keeps devices unlocked
        const TM=PL.Team, pw="correct horse battery staple", A1=await TM.create({token:"tok-1",password:pw,repo:"o/r"});
        let refused=false; try{ await TM.unlock(A1.access,"not the team password at all"); }catch(e){ refused=true; }
        if(!refused) fail("team access","a wrong team password was accepted");
        if((await TM.unlock(A1.access,pw)).token!=="tok-1") fail("team access","the team password did not open the access code");
        if(JSON.stringify(A1.access).includes("tok-1")) fail("team access","the access code contains the token in clear");
        const A2=await TM.create({token:"tok-2",password:pw,repo:"o/r",prev:A1.access});
        if(!A2.kept||A2.access.salt!==A1.access.salt||await TM.open(A2.access,A1.key)!=="tok-2") fail("team access","replacing the token under the same password would lock devices out");
        const A3=await TM.create({token:"tok-3",password:"a different long team password",repo:"o/r",prev:A2.access});
        if(A3.kept||await TM.open(A3.access,A1.key)) fail("team access","a new team password did not lock out the old key");
        // a device unlocks with the password, syncs, and on its next visit opens with the kept key alone
        srv.content=null; srv.sha=null; const team={...A2.access,api:"https://mock.test"};
        const s5=new PL.Store({key:"qa-team",memory:true,team});
        if(s5.teamState()!=="locked") fail("team access",`a new device should be locked, got ${s5.teamState()}`);
        await s5.unlockTeam(pw,"QA");
        if(s5.teamState()!=="open"||s5.status.state!=="synced") fail("team access",`unlocking did not sync: ${s5.teamState()} ${s5.status.state} ${s5.status.msg}`);
        s5.update({name:"Team Co"},{stage:"engaged"}); await s5.push();
        const tf=JSON.parse(srv.content||"{}"); if(!tf.recs||!tf.recs["Team Co"]) fail("team access","a change made after unlocking did not reach the team file");
        const s6=new PL.Store({key:"qa-team",memory:true,team}); s6._mem=s5._mem; s6.cfg={...s5.cfg}; await s6.init();
        if(s6.teamState()!=="open"||!s6.rec("Team Co")) fail("team access","an unlocked device asked for the password again");
        // the Pipeline page offers the team password on a locked device, and unlocking there syncs it
        const keepCfg=localStorage.getItem("gpc-pipe-cfg"), keepMode=P.cfg.mode, keepOff=P.cfg.teamOff;
        try{ P.team=team; P.saveCfg({mode:"local",teamOff:false}); goto("#/pipeline");
          const uf=document.getElementById("plUnlock");
          if(!uf) fail("team access","the Pipeline page did not ask a locked device for the team password");
          else { uf.elements.pw.value=pw; uf.elements.me.value="QA"; uf.requestSubmit(); await U._pg.unlocking;
            if(P.teamState()!=="open"||P.status.state!=="synced") fail("team access",`unlocking from the page failed: ${P.teamState()} ${P.status.state} ${P.status.msg}`); } }
        finally{ P.kv("teamkey",null); P.teamToken=null; P.team=P.teamPub; P.saveCfg({mode:keepMode||"local",teamOff:keepOff});
          if(keepCfg==null) localStorage.removeItem("gpc-pipe-cfg"); else localStorage.setItem("gpc-pipe-cfg",keepCfg); await P.pull(); }
      } finally { window.fetch=realFetch; }
      P.state=JSON.parse(backup); await P.push(); goto("#/pipeline");
    }
    if(window.__ERRORS.length) fail("pipeline","script error: "+window.__ERRORS.splice(0).join(" | "));
  }catch(e){ fail("pipeline", String(e&&e.stack||e)); }
  goto("#/overview");
  out.ok = out.failures.length===0;
  return out;
})();
