/* Greater Pacific dashboard kit — interactive charts. Same family as charts.js (one library, no dependencies).
   Lab (zoom / pan / brush scatter), Treemap, Funnel, Radar, Swarm, Parallel, Scoreboard, Waterfall, HistSlider,
   Constellation, flip. Colours only via CSS variables (tokens.css). Motion honours prefers-reduced-motion. */
(function(){
"use strict";
const C = window.Charts, esc = C.esc;
const RM = ()=> !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=s=>[...String(s)].reduce((a,ch)=>((a*31)+ch.charCodeAt(0))>>>0,7);
const hostW=(host,fb)=>{ const w=host&&host.clientWidth; return w&&w>200?Math.round(w):fb; };

// ---------- scales ----------
function linScale(d0,d1,r0,r1){ const f=v=>r0+(v-d0)/((d1-d0)||1)*(r1-r0); f.inv=p=>d0+(p-r0)/((r1-r0)||1)*(d1-d0); f.d=[d0,d1]; f.log=false; return f; }
function logScale(d0,d1,r0,r1){ const l0=Math.log10(d0), l1=Math.log10(d1); const f=v=>r0+(Math.log10(Math.max(v,1e-12))-l0)/((l1-l0)||1)*(r1-r0); f.inv=p=>Math.pow(10,l0+(p-r0)/((r1-r0)||1)*(l1-l0)); f.d=[d0,d1]; f.log=true; return f; }
function logTicks(d0,d1,max){ let t=[]; for(let e=Math.floor(Math.log10(d0)); e<=Math.ceil(Math.log10(d1)); e++){ [1,2,5].forEach(m=>{ const v=+(m*Math.pow(10,e)).toPrecision(6); if(v>=d0*0.999&&v<=d1*1.001) t.push(v); }); }
  if(t.length>(max||8)) t=t.filter(v=>String(v).replace(/^0\.0*/,"")[0]==="1"); return t; }
function robust(vals){ const s=vals.filter(v=>v!=null&&isFinite(v)).sort((a,b)=>a-b); if(!s.length) return [0,1]; if(s.length<8) return [s[0],s[s.length-1]];
  const q1=C.quantile(s,.25), q3=C.quantile(s,.75), f=3*((q3-q1)||Math.abs(q3)||1); return [Math.max(s[0],q1-f), Math.min(s[s.length-1],q3+f)]; }
const fmtTick=v=>Math.abs(v)>=1000?v.toLocaleString("en-IN"):String(+v.toPrecision(4));

// ======================================================================================
// Lab: interactive scatter. Drag = select, Shift+drag = pan, Ctrl/⌘+wheel = zoom, double-click = open / reset,
// click = pin, Shift/Ctrl+click = add to selection, arrows = move between points, Enter = open, Space = pin.
// ======================================================================================
class Lab{
  constructor(host, o){
    this.host=host; this.o={}; this.nodes=new Map(); this.pos=new Map(); this.sel=new Set(); this.kidx=-1;
    this.cid="lc"+(hash(Math.random())%1e6).toString(36);
    host.classList.add("lab-host");
    host.innerHTML=`<svg class="chart lab-svg" tabindex="0" role="application" aria-roledescription="interactive scatter chart">
      <defs><clipPath id="${this.cid}"><rect/></clipPath></defs>
      <g class="l-band"></g><g class="l-grid"></g><g class="l-quad"></g>
      <g class="l-plot" clip-path="url(#${this.cid})"><g class="l-back"></g><g class="l-front"></g><g class="l-pulse"></g></g>
      <g class="l-labels"></g><g class="l-axes"></g>
      <g class="l-cross" visibility="hidden"><line class="cx"/><line class="cy"/><g class="rx"><rect rx="3"/><text text-anchor="middle"/></g><g class="ry"><rect rx="3"/><text text-anchor="end"/></g></g>
      <rect class="l-brush" visibility="hidden" rx="2"/></svg>`;
    this.svg=host.querySelector("svg");
    this.g={band:this.q(".l-band"),grid:this.q(".l-grid"),quad:this.q(".l-quad"),back:this.q(".l-back"),front:this.q(".l-front"),pulse:this.q(".l-pulse"),labels:this.q(".l-labels"),axes:this.q(".l-axes"),cross:this.q(".l-cross"),brush:this.q(".l-brush")};
    this.bind(); this.update(o||{});
  }
  q(s){ return this.svg.querySelector(s); }
  update(o){
    const O=this.o=Object.assign(this.o,o); const W=this.W=Math.max(300,hostW(this.host,760)), H=this.H=O.height||(W<560?340:470);
    const m=this.m={l:W<560?48:62, r:16, t:16, b:46};
    this.svg.setAttribute("viewBox",`0 0 ${W} ${H}`); this.svg.setAttribute("aria-label",O.aria||"Interactive scatter chart");
    const logX=!!O.logX, logY=!!O.logY;
    const all=(O.points||[]).filter(p=>p.x!=null&&p.y!=null&&isFinite(p.x)&&isFinite(p.y));
    const pts=all.filter(p=>(!logX||p.x>0)&&(!logY||p.y>0)); this.logHidden=all.length-pts.length;
    let xd, yd;
    if(O.zoom&&O.zoom.x&&O.zoom.y){ xd=O.zoom.x.slice(); yd=O.zoom.y.slice(); }
    else{
      const base=O.domainFrom?pts.filter(O.domainFrom):pts, src=base.length?base:pts;
      xd=robust(src.map(p=>p.x)); yd=robust(src.map(p=>p.y));
      if(O.band&&!logX){ xd=[Math.min(xd[0],O.band[0]), Math.max(xd[1], Math.min(O.band[1], xd[1]*1.4))]; }
      const pad=(d,lg)=>{ if(lg){ return [d[0]/1.3, d[1]*1.3]; } if(d[0]>0) d[0]=0; const s=(d[1]-d[0])||1; return [d[0]<0?d[0]-s*.04:d[0], d[1]+s*.04]; };
      xd=pad(xd,logX); yd=pad(yd,logY);
      if(!logX){ const T=C.niceTicks(xd[0],xd[1],W<560?4:7); xd=[T.a,T.b]; } if(!logY){ const T=C.niceTicks(yd[0],yd[1],5); yd=[T.a,T.b]; }
    }
    if(logX&&!(xd[0]>0)) xd[0]=Math.min(...pts.map(p=>p.x))/1.3||0.01; if(logY&&!(yd[0]>0)) yd[0]=Math.min(...pts.map(p=>p.y))/1.3||0.01;
    const sx=this.sx=(logX?logScale:linScale)(xd[0],xd[1],m.l,W-m.r), sy=this.sy=(logY?logScale:linScale)(yd[0],yd[1],H-m.b,m.t);
    this.xd=xd; this.yd=yd; this.zoomed=!!O.zoom;
    const cr=this.svg.querySelector(`#${this.cid} rect`); cr.setAttribute("x",m.l-8); cr.setAttribute("y",m.t-8); cr.setAttribute("width",W-m.l-m.r+16); cr.setAttribute("height",H-m.t-m.b+16);
    // grid, band, axes
    const xt=logX?logTicks(xd[0],xd[1],W<560?5:8):C.niceTicks(xd[0],xd[1],W<560?4:7).t.filter(v=>v>=xd[0]-1e-9&&v<=xd[1]+1e-9);
    const yt=logY?logTicks(yd[0],yd[1],6):C.niceTicks(yd[0],yd[1],5).t.filter(v=>v>=yd[0]-1e-9&&v<=yd[1]+1e-9);
    const xT=O.xTick||fmtTick, yT=O.yTick||fmtTick;
    let gs="", ax="";
    yt.forEach(v=>{ const y=sy(v); gs+=`<line class="${v===0?"zero":"grid"}" x1="${m.l}" x2="${W-m.r}" y1="${y}" y2="${y}"/>`; ax+=`<text x="${m.l-8}" y="${y+3.5}" text-anchor="end">${esc(yT(v))}</text>`; });
    xt.forEach(v=>{ const x=sx(v); gs+=`<line class="${v===0?"zero":"grid gx"}" x1="${x}" x2="${x}" y1="${m.t}" y2="${H-m.b}"/>`; ax+=`<text x="${x}" y="${H-m.b+16}" text-anchor="middle">${esc(xT(v))}</text>`; });
    ax+=`<text class="ttl" x="${(m.l+W-m.r)/2}" y="${H-6}" text-anchor="middle">${esc(O.xLabel||"")}</text><text class="ttl" transform="translate(13 ${(m.t+H-m.b)/2}) rotate(-90)" text-anchor="middle">${esc(O.yLabel||"")}</text>`;
    this.g.grid.innerHTML=gs; this.g.axes.innerHTML=ax;
    let bs="";
    if(O.band){ const a=sx(clamp(O.band[0],xd[0],xd[1])), b=sx(clamp(O.band[1],xd[0],xd[1])); if(b-a>1) bs=`<rect class="band" x="${a}" y="${m.t}" width="${b-a}" height="${H-m.t-m.b}"/><text class="bandt" x="${a+6}" y="${m.t+13}">${esc(O.bandLabel||"")}</text>`; }
    this.g.band.innerHTML=bs;
    let qs="";
    const inX=v=>v!=null&&v>=xd[0]&&v<=xd[1], inY=v=>v!=null&&v>=yd[0]&&v<=yd[1];
    if(inX(O.medianX)) qs+=`<line class="med" x1="${sx(O.medianX)}" x2="${sx(O.medianX)}" y1="${m.t}" y2="${H-m.b}"/>`;
    if(inY(O.medianY)) qs+=`<line class="med" x1="${m.l}" x2="${W-m.r}" y1="${sy(O.medianY)}" y2="${sy(O.medianY)}"/><text class="medt" x="${W-m.r-4}" y="${sy(O.medianY)-5}" text-anchor="end">${esc(O.medianLabel||"median")}</text>`;
    if(O.quadrants&&O.quadLabels&&inX(O.medianX)&&inY(O.medianY)&&W>480){ const L=O.quadLabels;
      qs+=`<text class="quadt" x="${m.l+8}" y="${m.t+28}">${esc(L.tl)}</text><text class="quadt" x="${W-m.r-8}" y="${m.t+28}" text-anchor="end">${esc(L.tr)}</text><text class="quadt" x="${m.l+8}" y="${H-m.b-10}">${esc(L.bl)}</text><text class="quadt" x="${W-m.r-8}" y="${H-m.b-10}" text-anchor="end">${esc(L.br)}</text>`; }
    this.g.quad.innerHTML=qs;
    // marks (persistent nodes so changes glide)
    const seen=new Set(); this.pos.clear(); this.sel=new Set(O.selected||[]); this.pinned=O.pinned||null;
    const anySel=this.sel.size>0;
    pts.forEach(p=>{
      const out=p.x<xd[0]||p.x>xd[1]||p.y<yd[0]||p.y>yd[1];
      const px=sx(clamp(p.x,xd[0],xd[1])), py=sy(clamp(p.y,yd[0],yd[1]));
      let n=this.nodes.get(p.id), fresh=false;
      if(!n){ n=document.createElementNS("http://www.w3.org/2000/svg","g"); n.setAttribute("class","lm");
        n.innerHTML=`<path class="mk" vector-effect="non-scaling-stroke"/>`; n.dataset.id=p.id; fresh=true; this.nodes.set(p.id,n); }
      const front=!p.faded&&!p.dim; const layer=front?this.g.front:this.g.back;
      if(n.parentNode!==layer){ if(fresh&&!RM()){ n.style.transform=`translate(${px}px,${py}px) scale(.01)`; } layer.appendChild(n); }
      const path=n.firstChild; path.setAttribute("d",C.shapePath(p.shape||"circle",0,0,10)); path.style.fill=p.color||"var(--viz-1)";
      const r=(p.r||5)/10;
      n.classList.toggle("faded",!!p.faded); n.classList.toggle("dim",!!p.dim); n.classList.toggle("out",!this.zoomed&&out); n.classList.toggle("gone",this.zoomed&&out);
      n.classList.toggle("sel",this.sel.has(p.id)); n.classList.toggle("unsel",anySel&&!this.sel.has(p.id)); n.classList.toggle("pin",this.pinned===p.id);
      n.classList.toggle("lbl",!!p.label);
      const tr=`translate(${px}px,${py}px)`;
      if(fresh&&!RM()){ requestAnimationFrame(()=>{ n.style.transform=tr; }); } else n.style.transform=tr;
      path.style.transform=`scale(${r})`;
      seen.add(p.id); if(!(this.zoomed&&out)) this.pos.set(p.id,{x:px,y:py,p});
    });
    for(const [id,n] of this.nodes){ if(!seen.has(id)){ n.classList.add("gone"); this.nodes.delete(id); setTimeout(()=>n.remove(),400); } }
    this.drawLabels(); this.drawPulse();
    this.order=[...this.pos.values()];
  }
  drawLabels(){
    const O=this.o, m=this.m, items=[];
    for(const {x,y,p} of this.pos.values()){ const show=p.label||p.id===this.pinned||p.id===this.hoverId; if(show&&!p.dim) items.push({x,y,text:p.label||p.short||p.name||"",id:p.id,pri:p.id===this.pinned?0:p.label?1:2}); }
    items.sort((a,b)=>a.pri-b.pri);
    const lab=C.placeLabels(items,{l:m.l,r:this.W-m.r,t:m.t,b:this.H-m.b},11);
    this.g.labels.innerHTML=lab.map(l=>`${l.leader?`<line class="leader" x1="${l.x}" y1="${l.y}" x2="${l.lx<l.x?l.lx+l.text.length*6.2:l.lx}" y2="${l.ly-4}"/>`:""}<text class="lbl-strong halo ${l.id===this.pinned?"pinl":""}" x="${l.lx}" y="${l.ly}">${esc(l.text)}</text>`).join("");
    this.g.labels.classList.remove("l-in"); requestAnimationFrame(()=>this.g.labels.classList.add("l-in"));
  }
  drawPulse(){ const p=this.pinned&&this.pos.get(this.pinned); this.g.pulse.innerHTML=p?`<circle class="pulse" cx="${p.x}" cy="${p.y}" r="10"/><circle class="pulse p2" cx="${p.x}" cy="${p.y}" r="10"/>`:""; }
  local(e){ const r=this.svg.getBoundingClientRect(); return [(e.clientX-r.left)*this.W/r.width, (e.clientY-r.top)*this.H/r.height]; }
  inPlot(x,y){ const m=this.m; return x>=m.l&&x<=this.W-m.r&&y>=m.t&&y<=this.H-m.b; }
  nearest(x,y,max){ let best=null, bd=max*max; for(const [id,v] of this.pos){ if(v.p.dim) continue; const d=(v.x-x)**2+(v.y-y)**2; if(d<bd){ bd=d; best=id; } } return best; }
  cross(x,y){ const O=this.o, m=this.m, c=this.g.cross; if(x==null){ c.setAttribute("visibility","hidden"); return; }
    c.setAttribute("visibility","visible");
    const cx=c.querySelector(".cx"), cy=c.querySelector(".cy"); cx.setAttribute("x1",x); cx.setAttribute("x2",x); cx.setAttribute("y1",m.t); cx.setAttribute("y2",this.H-m.b); cy.setAttribute("x1",m.l); cy.setAttribute("x2",this.W-m.r); cy.setAttribute("y1",y); cy.setAttribute("y2",y);
    const xv=(O.xFmt||fmtTick)(this.sx.inv(x)), yv=(O.yFmt||fmtTick)(this.sy.inv(y));
    const rx=c.querySelector(".rx"), ry=c.querySelector(".ry"), wx=String(xv).length*6.4+12, wy=String(yv).length*6.4+12;
    rx.querySelector("rect").setAttribute("x",x-wx/2); rx.querySelector("rect").setAttribute("y",this.H-m.b+3); rx.querySelector("rect").setAttribute("width",wx); rx.querySelector("rect").setAttribute("height",17);
    rx.querySelector("text").setAttribute("x",x); rx.querySelector("text").setAttribute("y",this.H-m.b+15); rx.querySelector("text").textContent=xv;
    ry.querySelector("rect").setAttribute("x",m.l-wy-2); ry.querySelector("rect").setAttribute("y",y-9); ry.querySelector("rect").setAttribute("width",wy); ry.querySelector("rect").setAttribute("height",17);
    ry.querySelector("text").setAttribute("x",m.l-8); ry.querySelector("text").setAttribute("y",y+3.5); ry.querySelector("text").textContent=yv; }
  setHover(id, e){
    if(this.hoverId===id){ if(id&&e) C.Tip.move(e); return; }
    const prev=this.hoverId&&this.nodes.get(this.hoverId); if(prev) prev.classList.remove("hover");
    this.hoverId=id; const n=id&&this.nodes.get(id);
    if(n){ n.classList.add("hover"); if(n.parentNode) n.parentNode.appendChild(n); const v=this.pos.get(id); if(v&&this.o.tipHtml) C.Tip.show(this.o.tipHtml(v.p), e||this.clientAt(v), {rich:true}); this.svg.style.cursor="pointer"; }
    else { C.Tip.hide(); this.svg.style.cursor=""; }
    this.drawLabels(); if(this.o.onHover) this.o.onHover(id);
  }
  clientAt(v){ const r=this.svg.getBoundingClientRect(); return {clientX:r.left+v.x*r.width/this.W, clientY:r.top+v.y*r.height/this.H}; }
  highlight(id){ this.nodes.forEach(n=>n.classList.remove("ext")); const n=id&&this.nodes.get(id); if(n){ n.classList.add("ext"); if(n.parentNode) n.parentNode.appendChild(n); } }
  zoomTo(z){ if(this.o.onZoom) this.o.onZoom(z); else this.update({zoom:z}); }
  zoomBy(f, x, y){ const m=this.m; x=x==null?(m.l+this.W-m.r)/2:x; y=y==null?(m.t+this.H-m.b)/2:y;
    const nx=[this.sx.inv(x-(x-m.l)*f), this.sx.inv(x+(this.W-m.r-x)*f)], ny=[this.sy.inv(y+(this.H-m.b-y)*f), this.sy.inv(y-(y-m.t)*f)];
    this.zoomTo({x:nx,y:ny}); }
  zoomToIds(ids){ const v=ids.map(id=>this.o.points.find(p=>p.id===id)).filter(p=>p&&p.x!=null&&p.y!=null); if(!v.length) return;
    let x0=Math.min(...v.map(p=>p.x)), x1=Math.max(...v.map(p=>p.x)), y0=Math.min(...v.map(p=>p.y)), y1=Math.max(...v.map(p=>p.y));
    const px=(x1-x0)*.12||Math.abs(x0)*.1||1, py=(y1-y0)*.12||Math.abs(y0)*.1||1; this.zoomTo({x:[x0-px,x1+px], y:[y0-py,y1+py]}); }
  bind(){
    const s=this.svg; let drag=null;
    s.addEventListener("pointermove",e=>{
      const [x,y]=this.local(e);
      if(drag){ const dx=x-drag.x0, dy=y-drag.y0; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true;
        if(drag.mode==="pan"&&drag.moved){ const m=this.m; s.classList.add("panning");
          const nx=[drag.sx.inv(m.l-dx), drag.sx.inv(this.W-m.r-dx)], ny=[drag.sy.inv(this.H-m.b-dy), drag.sy.inv(m.t-dy)]; drag.z={x:nx,y:ny}; this.update({zoom:drag.z}); }
        else if(drag.mode==="brush"&&drag.moved){ const b=this.g.brush; b.setAttribute("visibility","visible"); b.setAttribute("x",Math.min(x,drag.x0)); b.setAttribute("y",Math.min(y,drag.y0)); b.setAttribute("width",Math.abs(dx)); b.setAttribute("height",Math.abs(dy)); }
        return; }
      if(this.inPlot(x,y)){ this.cross(x,y); this.setHover(this.nearest(x,y,e.pointerType==="touch"?30:22), e); } else { this.cross(null); this.setHover(null); }
    });
    s.addEventListener("pointerleave",()=>{ if(!drag){ this.cross(null); this.setHover(null); } });
    s.addEventListener("pointerdown",e=>{ if(e.button!==0) return; const [x,y]=this.local(e); if(!this.inPlot(x,y)) return;
      if(e.pointerType==="touch"){ drag={x0:x,y0:y,mode:"tap",moved:false}; return; }
      drag={x0:x,y0:y,mode:e.shiftKey?"pan":"brush",moved:false,sx:this.sx,sy:this.sy}; try{ s.setPointerCapture(e.pointerId); }catch(err){} });
    s.addEventListener("pointerup",e=>{ if(!drag) return; const d=drag; drag=null; s.classList.remove("panning"); this.g.brush.setAttribute("visibility","hidden");
      const [x,y]=this.local(e);
      if(!d.moved){ this.click(x,y,e); return; }
      if(d.mode==="pan"&&d.z){ if(this.o.onZoom) this.o.onZoom(d.z); return; }
      if(d.mode==="brush"){ const x0=Math.min(x,d.x0), x1=Math.max(x,d.x0), y0=Math.min(y,d.y0), y1=Math.max(y,d.y0);
        const ids=[...this.pos.entries()].filter(([id,v])=>!v.p.dim&&v.x>=x0&&v.x<=x1&&v.y>=y0&&v.y<=y1).map(([id])=>id);
        const next=(e.shiftKey||e.ctrlKey||e.metaKey)?[...new Set([...this.sel,...ids])]:ids;
        if(this.o.onSelect) this.o.onSelect(next); } });
    s.addEventListener("dblclick",e=>{ const [x,y]=this.local(e); const id=this.nearest(x,y,22); if(id&&this.o.onOpen) this.o.onOpen(id); else if(this.zoomed) this.zoomTo(null); });
    s.addEventListener("wheel",e=>{ if(!(e.ctrlKey||e.metaKey)) return; e.preventDefault(); const [x,y]=this.local(e); this.zoomBy(e.deltaY<0?1/1.25:1.25,x,y); },{passive:false});
    s.addEventListener("keydown",e=>{
      const ord=this.order.filter(v=>!v.p.dim); if(!ord.length) return;
      const cur=this.kidx>=0&&this.kidx<ord.length?ord[this.kidx]:null;
      const pickBy=(axis,dir)=>{ if(!cur) return 0; const cand=ord.map((v,i)=>({v,i})).filter(o=>dir>0?o.v[axis]>cur[axis]+.5:o.v[axis]<cur[axis]-.5);
        if(!cand.length) return this.kidx; cand.sort((a,b)=>Math.abs(a.v[axis]-cur[axis])+Math.abs(a.v[axis==="x"?"y":"x"]-cur[axis==="x"?"y":"x"])*.5-(Math.abs(b.v[axis]-cur[axis])+Math.abs(b.v[axis==="x"?"y":"x"]-cur[axis==="x"?"y":"x"])*.5)); return cand[0].i; };
      let handled=true;
      if(e.key==="ArrowRight") this.kidx=pickBy("x",1); else if(e.key==="ArrowLeft") this.kidx=pickBy("x",-1);
      else if(e.key==="ArrowUp") this.kidx=pickBy("y",-1); else if(e.key==="ArrowDown") this.kidx=pickBy("y",1);
      else if(e.key==="Enter"&&cur){ if(this.o.onOpen) this.o.onOpen(cur.p.id); }
      else if(e.key===" "&&cur){ if(this.o.onPin) this.o.onPin(this.pinned===cur.p.id?null:cur.p.id); }
      else if(e.key==="Escape"){ if(this.sel.size&&this.o.onSelect) this.o.onSelect([]); else if(this.o.onPin) this.o.onPin(null); }
      else if(e.key==="+"||e.key==="=") this.zoomBy(1/1.25); else if(e.key==="-"||e.key==="_") this.zoomBy(1.25); else if(e.key==="0") this.zoomTo(null);
      else handled=false;
      if(handled){ e.preventDefault(); const v=ord[this.kidx]; if(v&&/Arrow/.test(e.key)){ this.cross(v.x,v.y); this.setHover(v.p.id); } }
    });
    s.addEventListener("blur",()=>{ this.cross(null); this.setHover(null); });
  }
  click(x,y,e){ const id=this.nearest(x,y,e.pointerType==="touch"?30:22);
    if(e.shiftKey||e.ctrlKey||e.metaKey){ if(!id) return; const n=new Set(this.sel); n.has(id)?n.delete(id):n.add(id); if(this.o.onSelect) this.o.onSelect([...n]); return; }
    if(id){ if(this.o.onPin) this.o.onPin(this.pinned===id?null:id); }
    else if(this.sel.size){ if(this.o.onSelect) this.o.onSelect([]); }
    else if(this.pinned&&this.o.onPin) this.o.onPin(null); }
}

// ======================================================================================
// Treemap (squarified, two levels: group → company). Click a tile to open, a header to filter.
// ======================================================================================
function squarify(items, x, y, w, h){
  const out=[]; const total=items.reduce((a,b)=>a+b.value,0); if(!(total>0)||w<=0||h<=0) return out;
  let rest=items.map(it=>({...it, area:it.value*(w*h)/total})), row=[], rx=x, ry=y, rw=w, rh=h;
  const worst=(r,side)=>{ const s=r.reduce((a,b)=>a+b.area,0), mx=Math.max(...r.map(i=>i.area)), mn=Math.min(...r.map(i=>i.area)); return Math.max(side*side*mx/(s*s),(s*s)/(side*side*mn)); };
  const lay=()=>{ const s=row.reduce((a,b)=>a+b.area,0);
    if(rw>=rh){ const cw=s/rh; let cy=ry; row.forEach(r=>{ const hh=r.area/cw; out.push({...r,x:rx,y:cy,w:cw,h:hh}); cy+=hh; }); rx+=cw; rw-=cw; }
    else { const ch=s/rw; let cx=rx; row.forEach(r=>{ const ww=r.area/ch; out.push({...r,x:cx,y:ry,w:ww,h:ch}); cx+=ww; }); ry+=ch; rh-=ch; }
    row=[]; };
  while(rest.length){ const side=Math.min(rw,rh), it=rest[0]; if(!row.length||worst(row.concat(it),side)<=worst(row,side)){ row.push(it); rest.shift(); } else lay(); }
  if(row.length) lay(); return out;
}
function treemap(host, o){
  const W=hostW(host,760), H=o.height||(W<560?420:430), HH=20, P=2;
  const groups=o.groups.filter(g=>g.value>0).sort((a,b)=>b.value-a.value);
  const gr=squarify(groups,0,0,W,H);
  let s=`<svg class="chart tm" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Treemap")}">`;
  gr.forEach((g,gi)=>{
    const hh=(g.h>54&&g.w>64)?HH:0, kids=squarify(g.children.filter(c=>c.value>0).sort((a,b)=>b.value-a.value), g.x+P, g.y+hh+P, Math.max(0,g.w-2*P), Math.max(0,g.h-hh-2*P));
    s+=`<g class="tm-g" data-g="${esc(g.key)}" style="animation-delay:${Math.min(gi*45,600)}ms">`;
    s+=`<rect class="tm-gbox" x="${g.x+.5}" y="${g.y+.5}" width="${Math.max(0,g.w-1)}" height="${Math.max(0,g.h-1)}" style="fill:color-mix(in srgb, ${g.color} 10%, var(--surface))"/>`;
    kids.forEach(k=>{ const tw=Math.max(0,k.w-1), th=Math.max(0,k.h-1); const big=tw>58&&th>26, chars=Math.floor((tw-10)/6.3);
      s+=`<g class="tm-leaf${k.dim?" dim":""}" data-id="${esc(k.id)}" data-tip-html="${esc(o.tipLeaf(k,g))}"><rect x="${k.x}" y="${k.y}" width="${tw}" height="${th}" rx="2" style="fill:${k.fill}"/>`;
      if(big) s+=`<text class="tm-t ${k.dark?"on-dark":""}" x="${k.x+6}" y="${k.y+15}">${esc(k.label.length>chars?k.label.slice(0,Math.max(1,chars-1))+"…":k.label)}</text>${th>42?`<text class="tm-s ${k.dark?"on-dark":""}" x="${k.x+6}" y="${k.y+29}">${esc(k.sub||"")}</text>`:""}`;
      s+=`</g>`; });
    if(hh){ const chars=Math.floor((g.w-14)/6.6); const t=`${g.label} · ${g.sub||""}`;
      s+=`<g class="tm-h" tabindex="0" role="button" data-g="${esc(g.key)}" aria-label="${esc(g.label)}: open in screener" data-tip-html="${esc(o.tipGroup(g))}"><rect x="${g.x+.5}" y="${g.y+.5}" width="${Math.max(0,g.w-1)}" height="${hh}" style="fill:color-mix(in srgb, ${g.color} 22%, var(--surface))"/><rect x="${g.x+.5}" y="${g.y+.5}" width="3" height="${hh}" style="fill:${g.color}"/><text class="tm-gt" x="${g.x+9}" y="${g.y+14}">${esc(t.length>chars?t.slice(0,Math.max(1,chars-1))+"…":t)}</text></g>`; }
    s+=`</g>`;
  });
  s+=`</svg>`; host.innerHTML=s; const svg=host.firstChild;
  svg.querySelectorAll(".tm-leaf").forEach(n=>{ n.addEventListener("click",()=>o.onLeaf&&o.onLeaf(n.dataset.id)); });
  svg.querySelectorAll(".tm-h").forEach(n=>{ const go=()=>o.onGroup&&o.onGroup(n.dataset.g); n.addEventListener("click",go); n.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); } }); });
  svg.querySelectorAll(".tm-g").forEach(g=>{ g.addEventListener("mouseenter",()=>{ svg.classList.add("tm-hovering"); g.classList.add("on"); }); g.addEventListener("mouseleave",()=>{ svg.classList.remove("tm-hovering"); g.classList.remove("on"); }); });
  bindTips(svg); return svg;
}
function bindTips(root){ root.querySelectorAll("[data-tip-html]").forEach(n=>{ n.addEventListener("mouseenter",e=>C.Tip.show(n.getAttribute("data-tip-html"),e,{rich:true})); n.addEventListener("mousemove",e=>C.Tip.move(e)); n.addEventListener("mouseleave",()=>C.Tip.hide());
  n.addEventListener("focus",()=>{ const r=n.getBoundingClientRect(); C.Tip.show(n.getAttribute("data-tip-html"),{clientX:r.left,clientY:r.bottom},{rich:true}); }); n.addEventListener("blur",()=>C.Tip.hide()); }); }
const SEQ=["seq-1","seq-2","seq-3","seq-4","seq-5","seq-6","seq-7"], SEQ_DARK=[0,0,0,0,1,1,1];
const DIV=["div-n3","div-n2","div-n1","div-0","div-p1","div-p2","div-p3"], DIV_DARK=[1,0,0,0,0,0,1];
function seqFill(t){ const i=clamp(Math.round(t*6),0,6); return {fill:`var(--${SEQ[i]})`, dark:!!SEQ_DARK[i]}; }
function divFill(t){ const i=clamp(Math.round((t+1)/2*6),0,6); return {fill:`var(--${DIV[i]})`, dark:!!DIV_DARK[i]}; }
function scaleLegend(kind, lo, hi){ const ks=kind==="div"?DIV:SEQ; return `<span class="scale-leg"><span>${esc(lo)}</span>${ks.map(k=>`<i style="background:var(--${k})"></i>`).join("")}<span>${esc(hi)}</span></span>`; }

// ======================================================================================
// Funnel: stage bars with drop connectors; hover a stage to see who dropped out.
// ======================================================================================
function funnel(host, o){
  const W=hostW(host,420), rowH=54, top=4, H=top+rowH*o.stages.length, n0=Math.max(1,o.stages[0].n), lw=W;
  let s=`<svg class="chart fn" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Screening funnel")}">`;
  o.stages.forEach((st,i)=>{ const y=top+i*rowH, bw=Math.max(4,st.n/n0*lw), by=y+24, drop=i?o.stages[i-1].n-st.n:0;
    s+=`<a href="${esc(st.href)}" class="fn-row" data-tip-html="${esc(o.tip(st,i))}"><rect class="fn-hit" x="0" y="${y}" width="${W}" height="${rowH-4}" rx="6"/>
      <text class="fn-l" x="4" y="${y+15}">${esc(st.label)}</text><text class="fn-d" x="${W-4}" y="${y+15}" text-anchor="end"><tspan class="fn-n">${st.n}</tspan> · ${Math.round(st.n/n0*100)}%${drop>0?` <tspan class="fn-dt">(−${drop})</tspan>`:""}</text>
      <rect class="fn-track" x="4" y="${by}" width="${W-8}" height="14" rx="4"/><rect class="fn-bar growx" x="4" y="${by}" width="${Math.max(4,bw-8)}" height="14" rx="4" style="animation-delay:${i*110}ms"/></a>`; });
  s+=`</svg>`; host.innerHTML=s; bindTips(host.firstChild); return host.firstChild;
}
// ======================================================================================
// Radar: percentile scorecard (0..1 per axis) for up to ~5 series.
// ======================================================================================
function radar(host, o){
  const W=hostW(host,360), H=o.height||Math.min(W,o.max||360), cx=W/2, cy=H/2+4, R=Math.max(40,Math.min(W,H)/2-(o.compact?18:58)), n=o.axes.length;
  const ang=i=>-Math.PI/2+i*2*Math.PI/n, pt=(i,v)=>[cx+Math.cos(ang(i))*R*v, cy+Math.sin(ang(i))*R*v];
  let s=`<svg class="chart radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Radar chart")}">`;
  [.25,.5,.75,1].forEach(r=>{ s+=`<polygon class="r-ring ${r===.5?"mid":""}" points="${o.axes.map((a,i)=>pt(i,r).join(",")).join(" ")}"/>`; });
  o.axes.forEach((a,i)=>{ const [x,y]=pt(i,1); s+=`<line class="r-spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
  if(!o.compact){ [25,50,75].forEach(v=>{ const [x,y]=pt(0,v/100); s+=`<text class="r-tick" x="${x+4}" y="${y+3}">${v}</text>`; }); }
  s+=`<g class="r-series" style="transform-origin:${cx}px ${cy}px">`;
  o.series.forEach((se,j)=>{ const P=o.axes.map((a,i)=>pt(i,clamp(se.values[a.key]??0,0,1)));
    s+=`<g data-s="${esc(se.key)}"><polygon class="r-area ${se.fill?"":"nofill"} ${se.dash?"dash":""}" points="${P.map(p=>p.join(",")).join(" ")}" style="stroke:${se.color};fill:${se.color}"/>`;
    if(!o.compact) P.forEach((p,i)=>{ if(se.values[o.axes[i].key]==null) return; s+=`<path class="mk" d="${C.shapePath(se.shape||"circle",p[0],p[1],se.fill?4:3)}" style="fill:${se.color}"/>`; });
    s+=`</g>`; });
  s+=`</g>`;
  if(!o.compact) o.axes.forEach((a,i)=>{ const [x,y]=pt(i,1.13), an=Math.cos(ang(i)); const anchor=Math.abs(an)<.25?"middle":an>0?"start":"end";
    const tip=`<b>${esc(a.label)}</b>${a.explain?`<br><span class="tip-sub">${esc(a.explain)}</span>`:""}<br>`+o.series.map(se=>`${esc(se.label)}: <b>${se.values[a.key]==null?"n/a":Math.round(se.values[a.key]*100)}</b>`).join("<br>");
    s+=`<g class="r-ax" tabindex="0" data-tip-html="${esc(tip)}"><path class="r-hit" d="M${cx} ${cy}L${pt(i-.5,1.05).join(" ")}A${R*1.05} ${R*1.05} 0 0 1 ${pt(i+.5,1.05).join(" ")}Z"/><text class="r-lab" x="${x}" y="${y+4}" text-anchor="${anchor}">${esc(a.label)}</text></g>`; });
  s+=`</svg>`; host.innerHTML=s; bindTips(host.firstChild); return host.firstChild;
}

// ======================================================================================
// Swarm: one beeswarm row per metric across the universe; peers coloured, the company highlighted.
// ======================================================================================
function swarm(host, o){
  const dense=Math.max(0,...o.rows.map(r=>r.items.length))>150, W=hostW(host,560), m={l:8,r:8}, rowH=o.rowH||(dense?116:84), H=rowH*o.rows.length+6, band=(rowH-34)/2-3;
  let s=`<svg class="chart swarm" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Peer beeswarm")}">`;
  o.rows.forEach((row,ri)=>{
    const y0=ri*rowH, cy=y0+18+(rowH-34)/2, items=row.items.filter(it=>it.v!=null&&isFinite(it.v));
    const [d0,d1]=robust(items.map(it=>it.v)); const T=C.niceTicks(Math.min(d0,0<d0&&d0<d1*.25?0:d0),d1,W<560?4:6);
    const sx=v=>m.l+(clamp(v,T.a,T.b)-T.a)/((T.b-T.a)||1)*(W-m.l-m.r);
    s+=`<text class="sw-l" x="${m.l}" y="${y0+14}">${esc(row.label)}</text><text class="sw-r" x="${W-m.r}" y="${y0+14}" text-anchor="end">${esc(row.note||"")}</text>`;
    s+=`<line class="grid" x1="${m.l}" x2="${W-m.r}" y1="${cy}" y2="${cy}"/>`;
    T.t.forEach(v=>{ if(v<T.a-1e-9||v>T.b+1e-9) return; s+=`<text class="sw-t" x="${sx(v)}" y="${y0+rowH-2}" text-anchor="middle">${esc(row.tick(v))}</text>`; });
    if(row.med!=null) s+=`<line class="med" x1="${sx(row.med)}" x2="${sx(row.med)}" y1="${cy-band}" y2="${cy+band}"/>`;
    if(row.gmed!=null) s+=`<line class="sw-gm" x1="${sx(row.gmed)}" x2="${sx(row.gmed)}" y1="${cy-band+4}" y2="${cy+band-4}" style="stroke:${row.gcolor||"var(--viz-1)"}"/>`;
    // dodge
    const placed=[], r=3.4, gap=2*r+.6; const ord=items.slice().sort((a,b)=>(a.kind==="self")-(b.kind==="self")||a.v-b.v);
    ord.forEach(it=>{ const x=sx(it.v); let dy=0;
      if(it.kind!=="self"){ for(let k=0;k<(dense?22:14);k++){ const cand=(k===0?0:(k%2?1:-1)*Math.ceil(k/2)*gap*.85); if(!placed.some(p=>Math.abs(p.x-x)<gap&&Math.abs(p.y-cand)<gap)){ dy=cand; break; } dy=cand; } dy=clamp(dy,-band+3,band-3); placed.push({x,y:dy}); }
      const out=it.v<T.a||it.v>T.b, tip=esc(row.tipFn(it));
      if(it.kind==="self") s+=`<path class="sw-self" d="${C.shapePath("diamond",x,cy,7.5)}" tabindex="0" data-tip-html="${tip}"/>`;
      else s+=`<circle class="sw-d ${it.kind} ${out?"out":""}" cx="${x}" cy="${cy+dy}" r="${it.kind==="peer"?r+.6:r}" ${it.kind==="peer"?`style="fill:${row.gcolor||"var(--viz-1)"}"`:""} data-id="${esc(it.id)}" data-tip-html="${tip}"/>`; });
  });
  s+=`</svg>`; host.innerHTML=s; const svg=host.firstChild; bindTips(svg);
  if(o.onOpen) svg.querySelectorAll(".sw-d").forEach(n=>n.addEventListener("click",()=>o.onOpen(n.dataset.id)));
  return svg;
}

// ======================================================================================
// Parallel coordinates on percentiles (100 = best). Hover a line or an axis.
// ======================================================================================
function parallel(host, o){
  const n=o.axes.length, minW=Math.max(560,n*64), W=Math.max(hostW(host,760),minW), H=o.height||330, m={l:36,r:24,t:54,b:24};
  const ax=i=>m.l+i*(W-m.l-m.r)/Math.max(1,n-1), sy=p=>H-m.b-(p/100)*(H-m.t-m.b);
  const rot=(W-m.l-m.r)/Math.max(1,n-1)<84;
  let s=`<svg class="chart pc" viewBox="0 0 ${W} ${H}" style="min-width:${minW}px" role="img" aria-label="${esc(o.aria||"Parallel coordinates")}">`;
  [0,25,50,75,100].forEach(p=>{ s+=`<line class="${p===50?"med":"grid"}" x1="${m.l}" x2="${W-m.r}" y1="${sy(p)}" y2="${sy(p)}"/>`; s+=`<text class="pc-tk" x="${m.l-8}" y="${sy(p)+3.5}" text-anchor="end">${p}</text>`; });
  o.axes.forEach((a,i)=>{ const x=ax(i); const tip=`<b>${esc(a.label)}</b><br><span class="tip-sub">${esc(a.note||"")}</span><br>`+o.series.map(se=>`${esc(se.label)}: <b>${esc(se.pts[a.key]?se.pts[a.key].raw:"n/a")}</b>${se.pts[a.key]&&se.pts[a.key].p!=null?` <span class="tip-sub">(${Math.round(se.pts[a.key].p)})</span>`:""}`).join("<br>");
    s+=`<g class="pc-ax" tabindex="0" data-tip-html="${esc(tip)}"><rect class="pc-hit" x="${x-14}" y="${m.t-40}" width="28" height="${H-m.t-m.b+44}"/><line class="axis" x1="${x}" x2="${x}" y1="${m.t}" y2="${H-m.b}"/>
      <text class="pc-l" ${rot?`transform="translate(${x} ${m.t-10}) rotate(-32)" x="0" y="0" text-anchor="start"`:`x="${x}" y="${m.t-12}" text-anchor="middle"`}>${esc(a.label)}</text></g>`; });
  o.series.forEach((se,j)=>{ let d="", pen=false; o.axes.forEach((a,i)=>{ const v=se.pts[a.key]; if(!v||v.p==null){ pen=false; return; } d+=(pen?"L":"M")+ax(i).toFixed(1)+" "+sy(v.p).toFixed(1); pen=true; });
    const tip=`<b>${esc(se.label)}</b><br>`+o.axes.filter(a=>se.pts[a.key]).map(a=>`${esc(a.label)}: ${esc(se.pts[a.key].raw)}`).join("<br>");
    s+=`<g class="pc-s" data-s="${esc(se.id)}"><path class="pc-line draw" d="${d}" pathLength="1" style="stroke:${se.color};animation-delay:${j*120}ms"/><path class="pc-hitl" d="${d}" data-s="${esc(se.id)}" data-tip-html="${esc(tip)}"/>`;
    o.axes.forEach((a,i)=>{ const v=se.pts[a.key]; if(!v||v.p==null) return; s+=`<path class="mk" d="${C.shapePath(se.shape||"circle",ax(i),sy(v.p),4)}" style="fill:${se.color}"/>`; });
    s+=`</g>`; });
  s+=`<text class="pc-note" x="${m.l}" y="${H-4}">Percentile within the universe · 100 = best (direction-adjusted)</text></svg>`;
  host.innerHTML=s; const svg=host.firstChild; bindTips(svg);
  svg.querySelectorAll(".pc-hitl").forEach(h=>{ const id=h.dataset.s; h.addEventListener("mouseenter",()=>{ svg.classList.add("hovering"); svg.querySelector(`.pc-s[data-s="${CSS.escape(id)}"]`).classList.add("on"); }); h.addEventListener("mouseleave",()=>{ svg.classList.remove("hovering"); svg.querySelectorAll(".pc-s.on").forEach(x=>x.classList.remove("on")); }); });
  return svg;
}
function isolate(svg, id){ if(!svg) return; svg.classList.toggle("hovering",!!id); svg.querySelectorAll(".pc-s,[data-s]").forEach(g=>g.classList.toggle("on",!!id&&g.getAttribute("data-s")===id)); }

// ======================================================================================
// Scoreboard (HTML): rows glide to their new rank when weights change.
// ======================================================================================
class Scoreboard{
  constructor(host, o){ this.host=host; this.o=o; this.rows=new Map(); host.classList.add("sb"); host.setAttribute("role","list"); }
  update(rows){
    const o=this.o, rh=o.rowH||44, max=o.max||100; this.host.style.height=(rows.length*rh)+"px";
    const seen=new Set();
    rows.forEach((r,i)=>{ let n=this.rows.get(r.id), fresh=!n;
      if(!n){ n=document.createElement("div"); n.className="sb-row"; n.setAttribute("role","listitem");
        n.innerHTML=`<span class="sb-rank num"></span><a class="sb-name"></a><span class="sb-track">${o.keys.map(k=>`<i data-k="${esc(k.key)}" style="background:${k.color}"></i>`).join("")}</span><b class="sb-tot num"></b><span class="sb-d num"></span>`;
        this.host.appendChild(n); this.rows.set(r.id,n); if(!RM()) n.style.transform=`translateY(${i*rh+12}px)`; n.style.opacity=fresh&&!RM()?"0":"1"; }
      n.querySelector(".sb-rank").textContent="#"+(i+1); const a=n.querySelector(".sb-name"); a.textContent=r.label; a.href=r.href||"#";
      o.keys.forEach(k=>{ const seg=n.querySelector(`i[data-k="${CSS.escape(k.key)}"]`), v=r.parts[k.key]||0; seg.style.width=(v/max*100)+"%"; seg.setAttribute("data-tip",`${r.label}: ${k.label} adds ${v.toFixed(1)} of ${r.total.toFixed(1)} points`); });
      n.querySelector(".sb-tot").textContent=r.total.toFixed(1);
      const d=n.querySelector(".sb-d"); d.textContent=r.delta?(r.delta>0?"▲"+r.delta:"▼"+(-r.delta)):""; d.className="sb-d num "+(r.delta>0?"pos":r.delta<0?"neg":"");
      const tr=`translateY(${i*rh}px)`; if(fresh&&!RM()) requestAnimationFrame(()=>{ n.style.transform=tr; n.style.opacity="1"; }); else { n.style.transform=tr; n.style.opacity="1"; }
      seen.add(r.id); });
    for(const [id,n] of this.rows){ if(!seen.has(id)){ n.remove(); this.rows.delete(id); } }
  }
}

// ======================================================================================
// Waterfall (HTML): additive steps to a total; updates animate (cost-to-control calculator).
// ======================================================================================
function waterfall(host, o){
  const max=o.max||Math.max(1,...o.steps.map(s=>s.end));
  if(!host.__wf||host.__wf.n!==o.steps.length){ host.innerHTML=`<div class="wf">${o.steps.map((s,i)=>`<div class="wf-row ${s.kind}"><span class="wf-l">${esc(s.label)}</span><span class="wf-track"><i class="wf-bar"></i></span><b class="wf-v num"></b></div>`).join("")}</div>`; host.__wf={n:o.steps.length}; }
  host.querySelectorAll(".wf-row").forEach((row,i)=>{ const s=o.steps[i]; const bar=row.querySelector(".wf-bar");
    bar.style.left=(s.start/max*100)+"%"; bar.style.width=(Math.max(0,s.end-s.start)/max*100)+"%"; row.querySelector(".wf-v").textContent=o.fmt(s.end-s.start); row.setAttribute("data-tip",s.tip||""); row.querySelector(".wf-l").textContent=s.label; });
}

// ======================================================================================
// HistSlider (HTML+SVG): distribution of a metric with a two-thumb range; ends mean "no limit".
// ======================================================================================
class HistSlider{
  constructor(host, o){
    this.host=host; this.o=o; const vals=o.values.filter(v=>v!=null&&isFinite(v)); this.vals=vals;
    let [lo,hi]=robust(vals); if(lo===hi){ lo-=1; hi+=1; } this.lo=lo; this.hi=hi;
    this.bins=window.Kit.histogram(vals,lo,hi,o.bins||26); const mx=Math.max(1,...this.bins.map(b=>b.n));
    const W=240, Hh=30, bw=W/this.bins.length;
    host.innerHTML=`<div class="hs"><div class="hs-top"><span class="hs-lab">${esc(o.label)}</span><span class="hs-read num"></span></div>
      <svg class="hs-hist" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true">${this.bins.map((b,i)=>`<rect x="${i*bw+.5}" y="${Hh-Math.max(1.5,b.n/mx*Hh)}" width="${Math.max(.5,bw-1)}" height="${Math.max(1.5,b.n/mx*Hh)}"/>`).join("")}</svg>
      <div class="hs-range"><input type="range" class="hs-a" min="0" max="1000" step="1" aria-label="${esc(o.label)} minimum"><input type="range" class="hs-b" min="0" max="1000" step="1" aria-label="${esc(o.label)} maximum"></div>
      <div class="hs-ends num"><span>${esc(o.fmt(lo))}${vals.some(v=>v<lo)?" ≤":""}</span><span class="hs-n"></span><span>${vals.some(v=>v>hi)?"≥ ":""}${esc(o.fmt(hi))}</span></div></div>`;
    this.a=host.querySelector(".hs-a"); this.b=host.querySelector(".hs-b");
    const t2v=t=>this.lo+(this.hi-this.lo)*t/1000, v2t=v=>clamp(Math.round((v-this.lo)/((this.hi-this.lo)||1)*1000),0,1000);
    this.t2v=t2v; this.v2t=v2t;
    const live=()=>{ let a=+this.a.value, b=+this.b.value; if(a>b){ if(document.activeElement===this.a){ a=b; this.a.value=a; } else { b=a; this.b.value=b; } } this.paint(); };
    const commit=()=>{ const sel=this.sel(); if(o.onChange) o.onChange(sel); };
    [this.a,this.b].forEach(i=>{ i.addEventListener("input",live); i.addEventListener("change",commit); });
    this.set(o.sel||[null,null]);
  }
  sel(){ const a=+this.a.value, b=+this.b.value; const r=v=>+(+v.toPrecision(4)); return [a<=0?null:r(this.t2v(a)), b>=1000?null:r(this.t2v(b))]; }
  set([a,b]){ this.a.value=a==null?0:this.v2t(a); this.b.value=b==null?1000:this.v2t(b); this.paint(); }
  paint(){ const [a,b]=this.sel(), A=a==null?-Infinity:a, B=b==null?Infinity:b; const rects=this.host.querySelectorAll(".hs-hist rect");
    this.bins.forEach((bn,i)=>rects[i].classList.toggle("in", bn.x1>A&&bn.x0<B));
    const n=this.vals.filter(v=>v>=A&&v<=B).length; this.host.querySelector(".hs-n").textContent=(a==null&&b==null)?`${this.vals.length} companies`:`${n} in range`;
    this.host.querySelector(".hs-read").textContent=(a==null&&b==null)?"any":`${a==null?"…":this.o.fmt(a)} – ${b==null?"…":this.o.fmt(b)}`;
    const ta=+this.a.value/10, tb=+this.b.value/10; this.host.querySelector(".hs-range").style.setProperty("--a",ta+"%"); this.host.querySelector(".hs-range").style.setProperty("--b",tb+"%"); }
}

// ======================================================================================
// Constellation: decorative "every company as a star" field for hero bands (aria-hidden),
// or an interactive mini-map when o.self is given.
// ======================================================================================
function constellation(host, o){
  const W=hostW(host,560), H=o.height||220, pad=o.pad||14;
  const sx=p=>pad+p/100*(W-2*pad), sy=p=>H-pad-p/100*(H-2*pad);
  let s=`<svg class="${o.mini?"chart":""} cst ${o.mini?"cst-mini":""}" viewBox="0 0 ${W} ${H}" ${o.mini?`role="img" aria-label="${esc(o.aria||"Position in the universe")}"`:'aria-hidden="true"'}>`;
  if(o.mini){ s+=`<line class="cst-ax" x1="${pad}" x2="${W-pad}" y1="${sy(50)}" y2="${sy(50)}"/><line class="cst-ax" x1="${sx(50)}" x2="${sx(50)}" y1="${pad}" y2="${H-pad}"/>`;
    s+=`<text class="cst-l" x="${W-pad}" y="${sy(50)-6}" text-anchor="end">${esc(o.xLabel||"")} →</text><text class="cst-l" x="${sx(50)+6}" y="${pad+10}">↑ ${esc(o.yLabel||"")}</text>`; }
  o.points.forEach((p,i)=>{ if(p.x==null||p.y==null) return; const h=hash(p.id), r=p.star?2.6:(1+((h%10)/10)*1.3), x=sx(p.x), y=sy(p.y);
    s+=`<circle class="${p.self?"cst-self":p.star?"cst-star":"cst-dot"}" data-id="${esc(p.id)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.self?5:r}" style="animation-delay:${(h%2400)}ms"${p.tip?` data-tip-html="${esc(p.tip)}"`:""}/>`;
    if(p.self) s+=`<circle class="cst-ring" cx="${x}" cy="${y}" r="5"/><circle class="cst-ring r2" cx="${x}" cy="${y}" r="5"/>`; });
  s+=`</svg>`; host.innerHTML=s; if(o.mini) bindTips(host.firstChild); return host.firstChild;
}

// ======================================================================================
// flip: rows animate from old to new positions after a re-render (sorting).
// ======================================================================================
function flip(container, sel, key, mutate){
  if(RM()){ mutate(); return; }
  const before=new Map(); container.querySelectorAll(sel).forEach(n=>{ const r=n.getBoundingClientRect(); before.set(n.getAttribute(key), {x:r.left,y:r.top}); });
  mutate();
  const moved=[]; container.querySelectorAll(sel).forEach(n=>{ const b=before.get(n.getAttribute(key)); if(!b) return; const r=n.getBoundingClientRect(), dx=b.x-r.left, dy=b.y-r.top; if(Math.abs(dx)<1&&Math.abs(dy)<1) return; n.style.transition="none"; n.style.transform=`translate(${dx}px,${dy}px)`; moved.push(n); });
  if(moved.length) requestAnimationFrame(()=>requestAnimationFrame(()=>moved.forEach(n=>{ n.style.transition="transform var(--dur-3) var(--ease)"; n.style.transform=""; })));
}

// ======================================================================================
// River: the deal pipeline as a flow. Node height = companies that reached the stage; ribbons carry those moving on;
// drop-outs (passed / on hold) fall into the lane below. Hover a stage to list companies; click to jump to it.
// ======================================================================================
function river(host, o){
  const W=hostW(host,900), compact=!!o.compact, H=o.height||(compact?150:(W<600?250:300)), n=o.stages.length;
  const m={l:compact?6:14, r:compact?6:14, t:compact?22:44, b:compact?20:(W<600?54:62)}, nodeW=compact?8:14, lane=compact?0:30;
  const Hn=H-m.t-m.b, mid=m.t+Hn/2, r0=Math.max(1,o.stages[0].reach), k=Hn*(compact?.92:.88)/r0;
  const xs=o.stages.map((s,i)=>m.l+i*(W-m.l-m.r-nodeW)/Math.max(1,n-1));
  const hs=o.stages.map(s=>s.reach>0?Math.max(compact?4:6,s.reach*k):2), tops=hs.map(h=>mid-h/2);
  let defs="", rib="", parts="", nodes="", labels="", exits="";
  o.stages.forEach((s,i)=>{
    const x=xs[i], h=hs[i], top=tops[i];
    if(i<n-1){ const nx=o.stages[i+1], ow=s.reach>0?h*nx.reach/s.reach:0;
      if(ow>0.5){ const x0=x+nodeW, x1=xs[i+1], y0=top, y0b=top+ow, y1=tops[i+1], y1b=tops[i+1]+hs[i+1], cx=(x0+x1)/2, gid=`rg${i}-${(Math.random()*1e6|0)}`;
        defs+=`<linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" style="stop-color:${s.color}"/><stop offset="1" style="stop-color:${nx.color}"/></linearGradient>`;
        rib+=`<path class="rv-rib" data-s="${esc(s.key)}" d="M${x0} ${y0}C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}L${x1} ${y1b}C${cx} ${y1b} ${cx} ${y0b} ${x0} ${y0b}Z" style="fill:url(#${gid})"/>`;
        if(!compact&&ow>3){ const ya=y0+ow/2, yb=y1+hs[i+1]/2; parts+=`<path class="rv-flow" d="M${x0} ${ya}C${cx} ${ya} ${cx} ${yb} ${x1} ${yb}" style="stroke-width:${Math.max(1.2,Math.min(3,ow*.35)).toFixed(1)}px;animation-duration:${(2.6+i*.25).toFixed(2)}s"/>`; }
        if(!compact&&s.reach>0&&W>=640){ labels+=`<text class="rv-pct" x="${cx}" y="${Math.min(y0,y1)-5}" text-anchor="middle">${Math.round(nx.reach/s.reach*100)}%</text>`; } } }
    if(!compact&&s.exit>0&&s.reach>0){ const eh=Math.max(1.5,h*s.exit/s.reach), y0=top+h-eh, x0=x+nodeW/2, ly=H-m.b+lane*.55, x1=x+(i<n-1?(xs[i+1]-x)*.55:nodeW+18);
      exits+=`<path class="rv-exit" d="M${x+nodeW} ${y0}C${x1} ${y0} ${x1} ${ly-eh} ${x1+12} ${ly-eh}L${x1+12} ${ly}C${x1} ${ly} ${x1-4} ${y0+eh} ${x+nodeW} ${y0+eh}Z"/>`; }
    nodes+=`<g class="rv-node" tabindex="${compact?-1:0}" role="button" data-k="${esc(s.key)}" aria-label="${esc(s.label)}: ${s.reach} reached, ${s.count} here now" data-tip-html="${esc(o.tip?o.tip(s):s.label)}">
      <rect class="rv-hit" x="${x-10}" y="${m.t-34}" width="${nodeW+20}" height="${Hn+48}"/>
      <rect class="rv-bar" x="${x}" y="${top}" width="${nodeW}" height="${h}" rx="${compact?2:4}" style="fill:${s.color}"/>
      ${s.count>0&&s.reach>0?`<rect class="rv-here" x="${x}" y="${top+h*(1-(s.count+s.exit)/s.reach)}" width="${nodeW}" height="${h*s.count/s.reach}" rx="2"/>`:""}</g>`;
    if(compact){ labels+=`<text class="rv-l c" x="${x+nodeW/2}" y="${m.t-8}" text-anchor="${i===0?"start":i===n-1?"end":"middle"}">${esc(s.short)}</text><text class="rv-n c" x="${x+nodeW/2}" y="${H-4}" text-anchor="${i===0?"start":i===n-1?"end":"middle"}">${s.count}</text>`; }
    else if(W<640){ const anchor=i===0?"start":i===n-1?"end":"middle", lx=i===0?x:i===n-1?x+nodeW:x+nodeW/2;
      labels+=`<text class="rv-l c" x="${lx}" y="${i%2?m.t-8:m.t-26}" text-anchor="${anchor}">${esc(s.short)} <tspan class="rv-n c">${s.count}</tspan></text>`; }
    else { const anchor=i===0?"start":i===n-1?"end":"middle", lx=i===0?x:i===n-1?x+nodeW:x+nodeW/2;
      labels+=`<text class="rv-l" x="${lx}" y="${m.t-26}" text-anchor="${anchor}">${esc(s.short)}</text><text class="rv-n" x="${lx}" y="${m.t-8}" text-anchor="${anchor}">${s.count}<tspan class="rv-r"> here${s.reach!==s.count?` · ${s.reach} reached`:""}</tspan></text>`; }
  });
  if(!compact){ const ly=H-m.b+lane*.55, ex=o.exits||{};
    exits=`<rect class="rv-lane" x="${m.l}" y="${ly}" width="${W-m.l-m.r}" height="10" rx="5"/>`+exits+`<text class="rv-lt" x="${W-m.r}" y="${ly+26}" text-anchor="end">Passed ${ex.passed||0} · On hold ${ex.hold||0}</text><text class="rv-lt" x="${m.l}" y="${ly+26}">Drop-outs by the stage they left</text>`; }
  host.innerHTML=`<svg class="chart river ${compact?"compact":""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"Pipeline flow")}"><defs>${defs}</defs><g class="rv-ribs">${rib}</g>${exits}<g class="rv-parts">${parts}</g>${nodes}${labels}</svg>`;
  const svg=host.firstChild; bindTips(svg);
  svg.querySelectorAll(".rv-node").forEach(g=>{ const k=g.dataset.k, act=()=>o.onNode&&o.onNode(k);
    g.addEventListener("click",act); g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); act(); } });
    g.addEventListener("mouseenter",()=>{ svg.classList.add("hovering"); svg.querySelectorAll(`[data-s="${CSS.escape(k)}"]`).forEach(x=>x.classList.add("on")); });
    g.addEventListener("mouseleave",()=>{ svg.classList.remove("hovering"); svg.querySelectorAll(".on").forEach(x=>x.classList.remove("on")); }); });
  return svg;
}
Object.assign(C, { Lab, treemap, squarify, funnel, radar, swarm, parallel, isolate, Scoreboard, waterfall, HistSlider, constellation, flip, river, seqFill, divFill, scaleLegend, robust, linScale, logScale, bindTips });
})();
