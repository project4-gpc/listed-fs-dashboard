/* Greater Pacific dashboard kit — data-layer helpers shared by every adapter.
   Adapters (src/<dashboard>/adapter.js) turn the generated data files into one MODEL object.
   All derived figures are computed here or in the adapter, never in UI code. */
(function(){
const median = a=>{ a=a.filter(x=>x!=null&&isFinite(x)).sort((x,y)=>x-y); if(!a.length) return null; const m=a.length>>1; return a.length%2?a[m]:(a[m-1]+a[m])/2; };
const slug = s=>String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60);
function uniqueSlugs(names){ const seen={}; return names.map(n=>{ let s=slug(n)||"company"; if(seen[s]){ seen[s]++; s=s+"-"+seen[s]; } else seen[s]=1; return s; }); }
/** YoY growth %; returns {v, nm} where nm is a reason string when growth is not meaningful. */
function growth(cur, prev, minBase){
  if(cur==null||prev==null) return {v:null, nm:null};
  if(prev<=0) return {v:null, nm:`Prior-year value is ${prev<0?"negative":"zero"}, so growth is not meaningful.`};
  if(minBase!=null && prev<minBase) return {v:null, nm:`Prior-year value ₹${prev} cr is below the ₹${minBase} cr base threshold, so growth is not meaningful.`};
  return {v:(cur-prev)/Math.abs(prev)*100, nm:null};
}
/** n-year CAGR %; nm when either end is non-positive or start is below the base threshold. */
function cagr(end, start, years, minBase){
  if(end==null||start==null) return {v:null, nm:null};
  if(start<=0||end<=0) return {v:null, nm:"CAGR needs positive values at both ends."};
  if(minBase!=null && start<minBase) return {v:null, nm:`Start value ₹${start} cr is below the ₹${minBase} cr base threshold, so CAGR is not meaningful.`};
  return {v:(Math.pow(end/start,1/years)-1)*100, nm:null};
}
/** Percentile rank 0..1 of v within values (ties averaged); null if v missing. */
function pctRank(values, v, lowerIsBetter){
  if(v==null||!isFinite(v)) return null;
  const a=values.filter(x=>x!=null&&isFinite(x)); if(a.length<2) return .5;
  const below=a.filter(x=>x<v).length, eq=a.filter(x=>x===v).length;
  const p=(below+(eq-1)/2)/(a.length-1);
  return lowerIsBetter?1-p:p;
}
function parseAsof(s){
  if(!s) return null;
  const m=String(s).match(/(\d{1,2}) (\w{3})\w* (\d{4})(?:,? (\d{1,2}):(\d{2}))?(?:\s*(IST))?/);
  if(!m) { const d=new Date(s); return isNaN(d)?null:d; }
  const mon=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(m[2].toLowerCase());
  const hh=+(m[4]||0), mm=+(m[5]||0);
  // IST is UTC+5:30; strings without a zone are treated as IST (all sources are Indian).
  return new Date(Date.UTC(+m[3], mon, +m[1], hh, mm) - 330*60000);
}
/** Snapshot diff between two models built by the same adapter. rules: {pct:[{k,th,label}], abs:[{k,th,label,unit}], any:[{k,label}], text:[{k,label}], flags:[keys]} */
function diff(cur, prev, rules){
  if(!prev) return null;
  const out=[], P=new Map(prev.companies.map(c=>[c.name,c])), C=new Map(cur.companies.map(c=>[c.name,c]));
  const r1=v=>v==null?"–":(+v).toLocaleString("en-IN",{maximumFractionDigits:2});
  for(const c of cur.companies){
    const p=P.get(c.name);
    if(!p){ out.push({id:c.id,name:c.name,kind:"added",tone:"info",text:"Added to the list"}); continue; }
    (rules.pct||[]).forEach(r=>{ const a=p.m[r.k], b=c.m[r.k]; if(a>0&&b!=null){ const ch=(b-a)/a*100; if(Math.abs(ch)>=r.th) out.push({id:c.id,name:c.name,kind:r.k,tone:ch>0?"pos":"neg",text:`${r.label} ${ch>0?"up":"down"} ${Math.abs(ch).toFixed(1)}%`,value:`${r1(a)} → ${r1(b)}`,pct:ch}); } });
    (rules.abs||[]).forEach(r=>{ const a=p.m[r.k], b=c.m[r.k]; if(a!=null&&b!=null&&Math.abs(b-a)>=r.th) out.push({id:c.id,name:c.name,kind:r.k,tone:"info",text:`${r.label} ${b>a?"rose":"fell"} ${Math.abs(b-a).toFixed(2)}${r.unit||""}`,value:`${r1(a)}${r.unit||""} → ${r1(b)}${r.unit||""}`}); else if((a==null)!==(b==null)) out.push({id:c.id,name:c.name,kind:r.k,tone:"warn",text:`${r.label} ${b==null?"no longer reported":"now reported"}`,value:`${r1(a)} → ${r1(b)}`}); });
    (rules.any||[]).forEach(r=>{ const a=p.m[r.k], b=c.m[r.k]; if(a!==b && !(a==null&&b==null)) out.push({id:c.id,name:c.name,kind:r.k,tone:"info",text:`${r.label} changed`,value:`${r1(a)} → ${r1(b)}`}); });
    (rules.text||[]).forEach(r=>{ if((p[r.k]||"")!==(c[r.k]||"")) out.push({id:c.id,name:c.name,kind:r.k,tone:"info",text:`${r.label} changed`,value:`${p[r.k]||"–"} → ${c[r.k]||"–"}`}); });
    const pf=new Set(p.flags.map(f=>f.key)), cf=new Set(c.flags.map(f=>f.key));
    (rules.flags||[]).forEach(k=>{ const lab=(c.flags.find(f=>f.key===k)||p.flags.find(f=>f.key===k)||{}).label||k;
      if(cf.has(k)&&!pf.has(k)) out.push({id:c.id,name:c.name,kind:"flag",tone:k==="mandate"||k==="evaluated"?"pos":"warn",text:k==="mandate"?"Entered the mandate":`New flag: ${lab}`});
      if(!cf.has(k)&&pf.has(k)) out.push({id:c.id,name:c.name,kind:"flag",tone:k==="mandate"?"neg":"pos",text:k==="mandate"?"Left the mandate":`Flag cleared: ${lab}`}); });
    if(c.shortlisted!==p.shortlisted) out.push({id:c.id,name:c.name,kind:"short",tone:"info",text:c.shortlisted?"Added to the shortlist":"Removed from the shortlist"});
  }
  for(const p of prev.companies){ if(!C.has(p.name)) out.push({id:null,name:p.name,kind:"removed",tone:"warn",text:"Removed from the list"}); }
  (cur.failed||[]).forEach(t=>{ const c=cur.companies.find(x=>x.code===t); out.push({id:c?c.id:null,name:c?c.name:t,kind:"failed",tone:"neg",text:"Market refresh failed"}); });
  return out;
}
/** Quantile of a sorted array (linear interpolation). */
function q(sorted, p){ if(!sorted.length) return null; const i=(sorted.length-1)*p, lo=Math.floor(i), hi=Math.ceil(i); return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo); }
function statsOf(vals){ const s=vals.filter(v=>v!=null&&isFinite(v)).sort((a,b)=>a-b); if(!s.length) return {n:0};
  return {n:s.length, min:s[0], max:s[s.length-1], p05:q(s,.05), q1:q(s,.25), med:q(s,.5), q3:q(s,.75), p95:q(s,.95)}; }
/**
 * Enrich a MODEL with derived, read-only statistics used by the charts (never changes a source figure):
 *  M.stats[k]           distribution of metric k across the universe (n, min, quartiles, max)
 *  M.gstats[g][k]       same within primary group g
 *  c.pct[k]             percentile rank 0..100 of c's value within the universe (ascending)
 *  c.pctGood[k]         same, oriented so 100 = best (uses metric.better; raw percentile if no direction)
 *  c.grank[k]           {rank, of} within c's primary group, 1 = best (or highest when no direction)
 *  c.sc                 scoring criteria 0..1 (adapter's scoring.score)
 *  M.scoreMed           {universe:{crit:median}, shortlist:{crit:median}}
 */
function enrich(M){
  const cs=M.companies, keys=Object.keys(M.metrics).filter(k=>M.metrics[k].fmt!=="spark");
  const val=(c,k)=> c.nm&&c.nm[k] ? null : c.m[k];
  M.stats={}; M.gstats={};
  keys.forEach(k=>{ M.stats[k]=statsOf(cs.map(c=>val(c,k))); });
  const groups=[...new Set(cs.map(c=>c.prim))];
  groups.forEach(g=>{ const gc=cs.filter(c=>c.prim===g); M.gstats[g]={}; keys.forEach(k=>{ M.gstats[g][k]=statsOf(gc.map(c=>val(c,k))); }); });
  cs.forEach(c=>{ c.pct={}; c.pctGood={}; c.grank={}; });
  keys.forEach(k=>{
    const all=cs.map(c=>val(c,k)), better=M.metrics[k].better;
    cs.forEach(c=>{ const v=val(c,k); const p=pctRank(all, v); c.pct[k]=p==null?null:p*100; c.pctGood[k]=p==null?null:(better==="low"?(1-p)*100:p*100); });
    groups.forEach(g=>{ const gc=cs.filter(c=>c.prim===g&&val(c,k)!=null);
      const ord=gc.slice().sort((a,b)=> better==="low" ? val(a,k)-val(b,k) : val(b,k)-val(a,k));
      ord.forEach((c,i)=>{ c.grank[k]={rank:i+1, of:ord.length}; }); });
  });
  if(M.scoring){ cs.forEach(c=>{ c.sc=M.scoring.score(c, cs); });
    const crit=M.scoring.criteria.map(x=>x.key), med=list=>Object.fromEntries(crit.map(k=>[k, median(list.map(c=>c.sc[k]))]));
    const sl=cs.filter(c=>c.shortlisted);
    M.scoreMed={universe:med(cs), shortlist:sl.length?med(sl):null}; }
  else cs.forEach(c=>{ c.sc={}; });
  return M;
}
/** Equal-width histogram over [lo, hi]; values outside are counted in the end bins. */
function histogram(vals, lo, hi, bins){
  const out=Array.from({length:bins},(_,i)=>({x0:lo+(hi-lo)*i/bins, x1:lo+(hi-lo)*(i+1)/bins, n:0}));
  if(!(hi>lo)) return out;
  vals.forEach(v=>{ if(v==null||!isFinite(v)) return; let i=Math.floor((v-lo)/(hi-lo)*bins); i=Math.max(0,Math.min(bins-1,i)); out[i].n++; });
  return out;
}
window.Kit = { median, slug, uniqueSlugs, growth, cagr, pctRank, parseAsof, diff, enrich, statsOf, quantile:q, histogram };
})();
