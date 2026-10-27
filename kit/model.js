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
    (rules.pct||[]).forEach(r=>{ const a=p.m[r.k], b=c.m[r.k]; if(a>0&&b!=null){ const ch=(b-a)/a*100; if(Math.abs(ch)>=r.th) out.push({id:c.id,name:c.name,kind:r.k,tone:ch>0?"pos":"neg",text:`${r.label} ${ch>0?"up":"down"} ${Math.abs(ch).toFixed(1)}%`,value:`${r1(a)} → ${r1(b)}`}); } });
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
window.Kit = { median, slug, uniqueSlugs, growth, cagr, pctRank, parseAsof, diff };
})();
