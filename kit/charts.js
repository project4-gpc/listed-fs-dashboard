/* Greater Pacific dashboard kit — charts. The single chart library for every dashboard (SVG, no dependencies).
   Standards: colours only from theme tokens (var(--viz-n)); every series also has a marker shape; direct labels
   preferred; clickable legends isolate a series; hover highlights one series and dims the rest; tooltips are
   sentences; medians dashed; bands shaded; entry animation honours prefers-reduced-motion (CSS). */
(function(){
const NS = "http://www.w3.org/2000/svg";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SHAPES = ["circle","square","triangle","diamond","tdown","cross","wye","star"];
function shapePath(kind, x, y, r){
  const p = (a)=>a.map((q,i)=>(i?"L":"M")+(x+q[0]).toFixed(1)+" "+(y+q[1]).toFixed(1)).join("")+"Z";
  switch(kind){
    case "square":  return p([[-r*.88,-r*.88],[r*.88,-r*.88],[r*.88,r*.88],[-r*.88,r*.88]]);
    case "triangle":return p([[0,-r*1.15],[r*1.05,r*.75],[-r*1.05,r*.75]]);
    case "tdown":   return p([[0,r*1.15],[r*1.05,-r*.75],[-r*1.05,-r*.75]]);
    case "diamond": return p([[0,-r*1.2],[r*1.05,0],[0,r*1.2],[-r*1.05,0]]);
    case "cross":   { const a=r*.38, b=r*1.05; return p([[-a,-b],[a,-b],[a,-a],[b,-a],[b,a],[a,a],[a,b],[-a,b],[-a,a],[-b,a],[-b,-a],[-a,-a]]); }
    case "wye":     { const pts=[]; for(let i=0;i<6;i++){ const ang=-Math.PI/2+i*Math.PI/3, rr=i%2?r*.45:r*1.15; pts.push([Math.cos(ang)*rr,Math.sin(ang)*rr]); } return p(pts); }
    case "star":    { const pts=[]; for(let i=0;i<10;i++){ const ang=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.5:r*1.2; pts.push([Math.cos(ang)*rr,Math.sin(ang)*rr]); } return p(pts); }
    default: return `M${(x-r).toFixed(1)} ${y.toFixed(1)}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`;
  }
}
const vizVar = i => `var(--viz-${(i%8)+1})`;
const shapeOf = i => SHAPES[i%SHAPES.length];
function legendSwatch(color, shape){ return `<svg viewBox="-7 -7 14 14" aria-hidden="true"><path d="${shapePath(shape||"circle",0,0,5)}" fill="${color}"/></svg>`; }

// ---------- scales ----------
function niceTicks(lo, hi, n=5){
  if(!isFinite(lo)||!isFinite(hi)){ lo=0; hi=1; }
  if(lo===hi){ lo-=1; hi+=1; }
  const span=hi-lo, step0=span/n, mag=Math.pow(10,Math.floor(Math.log10(step0)));
  const step=[1,2,2.5,5,10].map(m=>m*mag).find(s=>span/s<=n)||10*mag;
  const a=Math.floor(lo/step)*step, b=Math.ceil(hi/step)*step, t=[];
  for(let v=a; v<=b+step/2; v+=step) t.push(+v.toFixed(10));
  return {a, b, t, step};
}
function quantile(sorted, q){ if(!sorted.length) return null; const p=(sorted.length-1)*q, lo=Math.floor(p), hi=Math.ceil(p); return sorted[lo]+(sorted[hi]-sorted[lo])*(p-lo); }
function robustDomain(vals, clip){ const s=vals.filter(v=>v!=null&&isFinite(v)).sort((a,b)=>a-b); if(!s.length) return [0,1];
  if(!clip || s.length<8) return [Math.min(0,s[0]), s[s.length-1]];
  const q1=quantile(s,.25), q3=quantile(s,.75), f=3*(q3-q1||Math.abs(q3)||1);
  return [Math.min(0,Math.max(s[0],q1-f)), Math.min(s[s.length-1],q3+f)]; }

// ---------- shared interaction ----------
const Tip = { el:null,
  show(html, e, opt){ if(!this.el||!this.el.isConnected){ this.el=document.getElementById("tip"); } if(!this.el) return; this.el.classList.toggle("rich",!!(opt&&opt.rich)); this.el.innerHTML=html; this.el.hidden=false; this.move(e); },
  move(e){ if(!this.el||this.el.hidden||!e) return; const w=this.el.offsetWidth, h=this.el.offsetHeight; let x=e.clientX+14, y=e.clientY+14; if(x+w>innerWidth-8) x=e.clientX-w-14; if(y+h>innerHeight-8) y=e.clientY-h-14; this.el.style.left=x+"px"; this.el.style.top=y+"px"; },
  hide(){ if(this.el) this.el.hidden=true; } };
function bindHover(svg){
  svg.querySelectorAll("[data-tip-html]").forEach(n=>{
    const s=n.getAttribute("data-s");
    const on=e=>{ Tip.show(n.getAttribute("data-tip-html"), e); if(s!=null){ svg.classList.add("hovering"); svg.querySelectorAll(`[data-s="${CSS.escape(s)}"]`).forEach(x=>x.classList.add("on")); } };
    const off=()=>{ Tip.hide(); svg.classList.remove("hovering"); svg.querySelectorAll(".on").forEach(x=>x.classList.remove("on")); };
    n.addEventListener("mouseenter",on); n.addEventListener("mousemove",e=>Tip.move(e)); n.addEventListener("mouseleave",off);
    n.addEventListener("focus",e=>{ const r=n.getBoundingClientRect(); on({clientX:r.right,clientY:r.top}); }); n.addEventListener("blur",off);
  });
}
function legend(host, items, onToggle, note){
  if(!items||!items.length){ host.innerHTML = note?`<span class="note">${esc(note)}</span>`:""; return; }
  host.innerHTML = items.map(it=>`<button type="button" aria-pressed="${it.on!==false}" data-k="${esc(it.key)}" title="Click to isolate; click again to show all">${legendSwatch(it.color,it.shape)}${esc(it.label)}${it.n!=null?` <span class="note">${it.n}</span>`:""}</button>`).join("") + (note?`<span class="note">${esc(note)}</span>`:"");
  host.querySelectorAll("button").forEach(b=>b.onclick=()=>onToggle&&onToggle(b.dataset.k));
}
function animClass(){ return "chart ch-anim"; }
// draw at the container's real pixel width so text renders at its token size (no SVG scaling)
function hostW(host, fallback){ const w=host&&host.clientWidth; return w&&w>200?Math.round(w):fallback; }

// ---------- label placement (greedy, no overlaps, clamped to plot) ----------
function placeLabels(items, box, fontPx){
  const placed=[], out=[];
  const w=t=>t.length*fontPx*0.56+4, h=fontPx+2;
  const hit=(r)=>placed.some(q=>!(r.x+r.w<q.x||q.x+q.w<r.x||r.y+r.h<q.y||q.y+q.h<r.y));
  for(const it of items){
    const lw=w(it.text);
    const cands=[[8,-h/2],[-8-lw,-h/2],[-lw/2,-h-8],[-lw/2,8],[10,-h-6],[-10-lw,-h-6],[10,6],[-10-lw,6],[-lw/2,-h-20],[-lw/2,20],[22,-h/2],[-22-lw,-h/2]];
    let done=null;
    for(const [dx,dy] of cands){ const r={x:it.x+dx,y:it.y+dy,w:lw,h}; if(r.x<box.l||r.x+r.w>box.r||r.y<box.t||r.y+r.h>box.b) continue; if(hit(r)) continue; done=r; break; }
    if(!done){ continue; } // never overlap: skip label (still in tooltip)
    placed.push(done); out.push({...it, lx:done.x, ly:done.y+h-3, leader:Math.hypot(done.x+lw/2-it.x, done.y+h/2-it.y)>16});
  }
  for(const p of items){ placed.push({x:p.x-5,y:p.y-5,w:10,h:10}); }
  return out;
}

// ---------- scatter ----------
function scatter(host, o){
  const W=o.width||hostW(host,760), H=o.height||(W<520?320:380), m={l:58,r:18,t:16,b:44};
  const pts=o.points.filter(p=>p.x!=null&&p.y!=null&&isFinite(p.x)&&isFinite(p.y));
  const active=pts.filter(p=>!p.faded);
  const src=(o.domainAll||!active.length)?pts:active;
  const [x0,x1]=robustDomain(src.map(p=>p.x), o.clip!==false), [y0,y1]=robustDomain(src.map(p=>p.y), o.clip!==false);
  const X=niceTicks(Math.min(x0, o.band?o.band[0]:x0), Math.max(x1, o.band?Math.min(o.band[1], x1*1.4):x1)), Y=niceTicks(y0,y1);
  const sx=v=>m.l+(Math.max(X.a,Math.min(X.b,v))-X.a)/(X.b-X.a)*(W-m.l-m.r);
  const sy=v=>H-m.b-(Math.max(Y.a,Math.min(Y.b,v))-Y.a)/(Y.b-Y.a)*(H-m.t-m.b);
  let s=`<svg class="${animClass()}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Scatter chart")}">`;
  if(o.band){ const a=sx(Math.max(o.band[0],X.a)), b=sx(Math.min(o.band[1],X.b)); if(b>a) s+=`<rect class="band" x="${a}" y="${m.t}" width="${b-a}" height="${H-m.t-m.b}"/><text class="bandt" x="${a+6}" y="${m.t+13}">${esc(o.bandLabel||"")}</text>`; }
  Y.t.forEach(v=>{ s+=`<line class="${v===0?"zero":"grid"}" x1="${m.l}" x2="${W-m.r}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${m.l-8}" y="${sy(v)+3.5}" text-anchor="end">${esc(o.yTick?o.yTick(v):v.toLocaleString("en-IN"))}</text>`; });
  X.t.forEach(v=>{ s+=`<text x="${sx(v)}" y="${H-m.b+16}" text-anchor="middle">${esc(o.xTick?o.xTick(v):v.toLocaleString("en-IN"))}</text>`; });
  if(X.a<0&&X.b>0) s+=`<line class="zero" x1="${sx(0)}" x2="${sx(0)}" y1="${m.t}" y2="${H-m.b}"/>`;
  if(o.medianX!=null) s+=`<line class="med" x1="${sx(o.medianX)}" x2="${sx(o.medianX)}" y1="${m.t}" y2="${H-m.b}"/><text x="${sx(o.medianX)+4}" y="${H-m.b-6}">median</text>`;
  if(o.medianY!=null) s+=`<line class="med" x1="${m.l}" x2="${W-m.r}" y1="${sy(o.medianY)}" y2="${sy(o.medianY)}"/><text x="${W-m.r-4}" y="${sy(o.medianY)-5}" text-anchor="end">median</text>`;
  s+=`<text class="ttl" x="${(m.l+W-m.r)/2}" y="${H-6}" text-anchor="middle">${esc(o.xLabel)}</text>`;
  s+=`<text class="ttl" transform="translate(13 ${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle">${esc(o.yLabel)}</text>`;
  const order=pts.slice().sort((a,b)=>(!a.faded)-(!b.faded)||(!!a.label)-(!!b.label));
  order.forEach(p=>{
    const out=p.x<X.a||p.x>X.b||p.y<Y.a||p.y>Y.b;
    const r=p.label?6.5:5;
    s+=`<path class="mk fade ${p.faded?"faded":""} ${out?"out":""} ${p.hl?"hl":""}" data-s="${esc(p.series)}" d="${shapePath(p.shape,sx(p.x),sy(p.y),r)}" fill="${p.color}" tabindex="${p.faded?-1:0}" data-id="${esc(p.id)}" data-tip-html="${esc(o.tip(p)+(out?"<br><i>Off the chart scale; drawn at the edge.</i>":""))}"/>`;
  });
  const lab=placeLabels(pts.filter(p=>p.label&&!p.faded).map(p=>({x:sx(p.x),y:sy(p.y),text:p.label})),{l:m.l,r:W-m.r,t:m.t,b:H-m.b},11);
  lab.forEach(l=>{ if(l.leader) s+=`<line class="leader" x1="${l.x}" y1="${l.y}" x2="${l.lx<l.x?l.lx+l.text.length*6.2:l.lx}" y2="${l.ly-4}"/>`; s+=`<text class="lbl-strong halo" x="${l.lx}" y="${l.ly}">${esc(l.text)}</text>`; });
  s+=`</svg>`;
  host.innerHTML=s; const svg=host.firstChild; bindHover(svg);
  if(o.onClick) svg.querySelectorAll(".mk").forEach(n=>{ n.addEventListener("click",()=>o.onClick(n.dataset.id)); n.addEventListener("keydown",e=>{ if(e.key==="Enter") o.onClick(n.dataset.id); }); });
  return svg;
}

// ---------- bars + margin line (category axis) ----------
function combo(host, o){
  const W=o.width||hostW(host,560), H=o.height||280, m={l:52,r:o.line?52:16,t:24,b:o.line?54:36};
  const cats=o.cats, ns=o.bars.length, all=o.bars.flatMap(b=>b.values).filter(v=>v!=null);
  const Y=niceTicks(Math.min(0,...all), Math.max(0,...all));
  // with a line series, bars use the lower 70% and the line the top 26%, so line and bar labels never collide
  const barTop = o.line ? m.t+(H-m.t-m.b)*0.30 : m.t;
  const sy=v=>H-m.b-(v-Y.a)/(Y.b-Y.a)*(H-m.b-barTop);
  const bw=(W-m.l-m.r)/cats.length, gw=bw*0.72, w=gw/ns;
  let s=`<svg class="${animClass()}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Bar chart")}">`;
  Y.t.forEach(v=>{ s+=`<line class="${v===0?"zero":"grid"}" x1="${m.l}" x2="${W-m.r}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${m.l-8}" y="${sy(v)+3.5}" text-anchor="end">${esc(o.yTick?o.yTick(v):v.toLocaleString("en-IN"))}</text>`; });
  cats.forEach((c,i)=>{ s+=`<text x="${m.l+bw*i+bw/2}" y="${H-m.b+16}" text-anchor="middle">${esc(c)}</text>`; });
  o.bars.forEach((b,j)=>{
    b.values.forEach((v,i)=>{ if(v==null) return; const x=m.l+bw*i+(bw-gw)/2+w*j, y0=sy(0), y1=sy(v), top=Math.min(y0,y1), h=Math.max(1,Math.abs(y1-y0));
      s+=`<g data-s="${esc(b.key)}"><rect class="grow" x="${x+1}" y="${top}" width="${w-2}" height="${h}" fill="${b.color}" rx="2" data-s="${esc(b.key)}" data-tip-html="${esc(o.tip(b,i,v))}" tabindex="0"/>`;
      const inside=h>24&&w>26; s+=`<text class="lbl fade" x="${x+w/2}" y="${inside?(v>=0?top+15:top+h-6):(v>=0?top-5:top+h+12)}" text-anchor="middle" data-s="${esc(b.key)}"${inside?' style="fill:var(--n-0)"':""}>${esc(o.fmt(v))}</text></g>`; });
  });
  if(o.line){ const L=o.line, vals=L.values.filter(v=>v!=null); if(vals.length){
    const Z=niceTicks(Math.min(...vals), Math.max(...vals), 2); const zTop=m.t, zBot=m.t+(H-m.t-m.b)*0.26; const sz=v=>zBot-(v-Z.a)/(Z.b-Z.a)*(zBot-zTop);
    Z.t.forEach(v=>{ s+=`<text x="${W-m.r+8}" y="${sz(v)+3.5}">${esc(L.tick(v))}</text>`; });
    const P=L.values.map((v,i)=>v==null?null:[m.l+bw*i+bw/2, sz(v)]);
    const d=P.filter(Boolean).map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join("");
    s+=`<g data-s="line"><path d="${d}" fill="none" stroke="${L.color}" stroke-width="2" class="fade" data-s="line"/>`;
    P.forEach((p,i)=>{ if(!p) return; s+=`<path class="mk fade" d="${shapePath(L.shape||"diamond",p[0],p[1],4.5)}" fill="${L.color}" data-s="line" tabindex="0" data-tip-html="${esc(L.tipFn(i,L.values[i]))}"/><text class="lbl fade" x="${p[0]}" y="${H-m.b+34}" text-anchor="middle" data-s="line" style="fill:${L.color}">${esc(L.fmt(L.values[i]))}</text>`; });
    s+=`<text class="ttl" x="${m.l-8}" y="${H-m.b+34}" text-anchor="end" style="fill:${L.color}">${esc(L.short||"margin")}</text>`;
    s+=`</g><text class="ttl" x="${W-4}" y="${m.t-10}" text-anchor="end">${esc(L.axis)}</text>`;
  } }
  s+=`<text class="ttl" x="${m.l-48}" y="${m.t-10}">${esc(o.yLabel||"")}</text></svg>`;
  host.innerHTML=s; bindHover(host.firstChild); return host.firstChild;
}

// ---------- dot plot vs peers (median + IQR) ----------
function dotPlot(host, o){
  const rowH=46, W=o.width||hostW(host,560), m={l:o.labelW||120,r:24,t:10,b:26}, H=m.t+m.b+rowH*o.rows.length;
  let s=`<svg class="${animClass()}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Dot plot versus peers")}">`;
  o.rows.forEach((r,i)=>{
    const vals=r.peers.filter(v=>v!=null&&isFinite(v)).sort((a,b)=>a-b);
    const y=m.t+rowH*i+rowH/2;
    const lo=Math.min(quantile(vals,.05)??0, r.value??Infinity, 0), hi=Math.max(quantile(vals,.95)??1, r.value??-Infinity);
    const T=niceTicks(lo,hi,4), sx=v=>m.l+(Math.max(T.a,Math.min(T.b,v))-T.a)/(T.b-T.a)*(W-m.l-m.r);
    const q1=quantile(vals,.25), q3=quantile(vals,.75), med=quantile(vals,.5);
    s+=`<text class="ttl lbl" x="${m.l-10}" y="${y+4}" text-anchor="end">${esc(r.label)}</text>`;
    s+=`<line class="grid" x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}"/>`;
    T.t.forEach(v=>{ s+=`<text x="${sx(v)}" y="${y+20}" text-anchor="middle">${esc(r.tick(v))}</text>`; });
    vals.forEach(v=>{ s+=`<circle cx="${sx(v)}" cy="${y}" r="3" fill="var(--viz-muted)" class="fade"/>`; });
    if(q1!=null) s+=`<rect class="band" x="${sx(q1)}" y="${y-8}" width="${Math.max(2,sx(q3)-sx(q1))}" height="16" rx="3" data-tip-html="${esc(`Peers' middle half sits between ${r.fmt(q1)} and ${r.fmt(q3)} (n = ${vals.length}).`)}"/>`;
    if(med!=null) s+=`<line class="med" x1="${sx(med)}" x2="${sx(med)}" y1="${y-12}" y2="${y+12}" data-tip-html="${esc(`Peer median ${r.fmt(med)}.`)}"/>`;
    if(r.value!=null&&isFinite(r.value)) s+=`<path class="mk hl fade" d="${shapePath("diamond",sx(r.value),y,7)}" fill="var(--viz-1)" tabindex="0" data-tip-html="${esc(`${r.label}: ${r.fmt(r.value)} vs peer median ${med==null?"n/a":r.fmt(med)}.`)}"/>`;
    else s+=`<text x="${m.l+6}" y="${y-8}">not available</text>`;
  });
  s+=`</svg>`; host.innerHTML=s; bindHover(host.firstChild); return host.firstChild;
}

// ---------- labelled horizontal stacked bar (100%) ----------
function stackBar(host, o){
  const W=o.width||hostW(host,560), bh=26, H=bh+4;
  const parts=o.parts.filter(p=>(p.value||0)>0), zero=o.parts.filter(p=>!((p.value||0)>0));
  const tot=parts.reduce((a,p)=>a+p.value,0)||1;
  let x=0, s=`<svg class="${animClass()}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Stacked bar")}: ${esc(parts.map(p=>p.label+" "+Math.round(p.value/tot*100)+"%").join(", "))}">`;
  parts.forEach((p,i)=>{ const w=p.value/tot*W; const idx=o.parts.indexOf(p);
    s+=`<rect class="growx" x="${x}" y="2" width="${Math.max(0,w-1)}" height="${bh}" fill="${p.color}" data-s="${idx}" tabindex="0" data-tip-html="${esc(o.tip(p, p.value/tot*100))}"/>`;
    if(w>40) s+=`<text x="${x+6}" y="${2+17}" style="fill:var(--n-0)" class="fade" data-s="${idx}">${Math.round(p.value/tot*100)}%</text>`; x+=w; });
  s+=`</svg><div class="legend">${parts.map(p=>`<span style="display:inline-flex;align-items:center;gap:var(--s-1)">${legendSwatch(p.color, shapeOf(o.parts.indexOf(p)))}<span>${esc(p.label)} <b class="num">${Math.round(p.value/tot*100)}%</b></span></span>`).join("")}${zero.length?`<span class="note">${esc(zero.map(p=>p.label).join(", "))}: 0%</span>`:""}</div>`;
  host.innerHTML=s; bindHover(host.firstChild); return host.firstChild;
}
// ---------- horizontal stacked score bars (contributions) ----------
function scoreBars(host, o){
  const rowH=30, W=o.width||hostW(host,760), m={l:o.labelW||170,r:56,t:6,b:6}, H=m.t+m.b+rowH*o.rows.length;
  const max=o.max||100, sx=v=>v/max*(W-m.l-m.r);
  let s=`<svg class="${animClass()}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Score contributions")}">`;
  o.rows.forEach((r,i)=>{ const y=m.t+rowH*i; let x=m.l;
    s+=`<text class="lbl ttl" x="${m.l-10}" y="${y+rowH/2+4}" text-anchor="end">${esc(r.label)}</text>`;
    o.keys.forEach((k,j)=>{ const v=r.parts[k.key]||0; if(v<=0) return; const w=sx(v);
      s+=`<rect class="growx" x="${x}" y="${y+5}" width="${Math.max(0,w-1)}" height="${rowH-10}" fill="${k.color}" data-s="${esc(k.key)}" tabindex="0" data-tip-html="${esc(o.tip(r,k,v))}"/>`; x+=w; });
    s+=`<text class="lbl fade" x="${x+6}" y="${y+rowH/2+4}">${esc(o.fmt(r.total))}</text>`; });
  s+=`</svg>`; host.innerHTML=s; bindHover(host.firstChild); return host.firstChild;
}

// ---------- vertical columns (simple single-series, labelled) ----------
function columns(host, o){
  return combo(host, {...o, cats:o.items.map(i=>i.label), bars:[{key:"v",label:o.series||"",values:o.items.map(i=>i.value),color:o.color||"var(--viz-1)"}], tip:(b,i,v)=>o.tip(o.items[i],v)});
}

// ---------- sparkline (inline string) ----------
function spark(values, opt={}){
  const v=values.map(x=>x==null||!isFinite(x)?null:x), ok=v.filter(x=>x!=null);
  if(ok.length<2) return `<span class="na">–</span>`;
  const W=64, H=18, lo=Math.min(...ok), hi=Math.max(...ok), sy=x=>hi===lo?H/2:H-2-(x-lo)/(hi-lo)*(H-4), sx=i=>2+i*(W-4)/(v.length-1);
  const d=v.map((x,i)=>x==null?null:`${sx(i).toFixed(1)} ${sy(x).toFixed(1)}`).filter(Boolean).map((p,i)=>(i?"L":"M")+p).join("");
  const last=ok[ok.length-1], first=ok[0], col=last>=first?"var(--positive)":"var(--negative)";
  return `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.aria||"trend")}"><path d="${d}" fill="none" stroke="var(--viz-7)" stroke-width="1.5"/><circle cx="${sx(v.length-1)}" cy="${sy(last)}" r="2.5" fill="${col}"/></svg>`;
}

window.Charts = { scatter, combo, dotPlot, stackBar, scoreBars, columns, spark, legend, legendSwatch, shapePath, vizVar, shapeOf, SHAPES, niceTicks, quantile, Tip, esc, placeLabels, bindHover };
})();
