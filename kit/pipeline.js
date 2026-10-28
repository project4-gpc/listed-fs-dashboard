/* Greater Pacific dashboard kit — pipeline store: deal status per company (stage, owner, next step, dates, notes,
   history). This is team data, so it is never part of the published dashboard:
     - "local": kept in this browser (default; works offline);
     - "github": a PRIVATE GitHub repo, read and written with each user's own token (checked to be private before
       every session; a public repo is refused).
   Records are keyed by company name. Each change is stamped (u, by) and logged; merges keep the newer record per
   company and the union of their histories, so two people editing different companies never lose work. */
(function(){
"use strict";
const STAGES=[
  {key:"long",     label:"Long list",            short:"Long list",   pool:true},
  {key:"screened", label:"Screened",             short:"Screened"},
  {key:"short",    label:"Shortlisted",          short:"Shortlisted"},
  {key:"outreach", label:"Outreach",             short:"Outreach"},
  {key:"engaged",  label:"Engaged",              short:"Engaged"},
  {key:"nda",      label:"NDA & data",           short:"NDA & data"},
  {key:"ic",       label:"Investment committee", short:"IC"},
  {key:"passed",   label:"Passed",               short:"Passed",      closed:true},
  {key:"hold",     label:"On hold",              short:"On hold",     closed:true}
];
const nowISO=()=>new Date().toISOString();
const dayKey=d=>{ const x=d?new Date(d):new Date(); return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0"); };
function b64encode(str){ const bytes=new TextEncoder().encode(str); let bin=""; for(let i=0;i<bytes.length;i+=0x8000) bin+=String.fromCharCode.apply(null, bytes.subarray(i,i+0x8000)); return btoa(bin); }
function b64decode(b64){ const bin=atob(String(b64).replace(/\s/g,"")); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
function mergeLogs(a,b){ const seen=new Set(), out=[]; [...(a||[]),...(b||[])].forEach(e=>{ const k=[e.t,e.k,e.text||"",e.to||"",e.field||""].join("|"); if(!seen.has(k)){ seen.add(k); out.push(e); } }); return out.sort((x,y)=>x.t<y.t?-1:x.t>y.t?1:0); }
/** Merge two pipeline states: per company the record with the later stamp wins its fields; histories are unioned. */
function mergeState(a,b){
  const recs={...((a&&a.recs)||{})}, br=(b&&b.recs)||{};
  Object.keys(br).forEach(n=>{ const x=recs[n], y=br[n]; if(!x){ recs[n]=y; return; }
    const win=(y.u||"")>(x.u||"")?y:x; recs[n]={...win, log:mergeLogs(x.log,y.log), peak:Math.max(x.peak??0,y.peak??0)}; });
  return {v:1, recs};
}
/** True when state a holds a record that b lacks or has an older version of, i.e. b needs a push. */
function aheadOf(a,b){ const br=(b&&b.recs)||{}; return Object.entries((a&&a.recs)||{}).some(([n,x])=>{ const y=br[n]; return !y||(x.u||"")>(y.u||""); }); }

class MemoryBackend{ constructor(){ this.kind="memory"; this.data=null; } async load(){ return {data:this.data}; } async save(d){ this.data=JSON.parse(JSON.stringify(d)); return {}; } }
class LocalBackend{
  constructor(key){ this.k="gpc-pipe-"+key; this.kind="local"; }
  async load(){ try{ const s=localStorage.getItem(this.k); return {data:s?JSON.parse(s):null}; }catch(e){ return {data:null}; } }
  async save(data){ try{ localStorage.setItem(this.k, JSON.stringify(data)); }catch(e){ throw new Error("This browser blocked local storage, so changes cannot be kept."); } return {}; }
}
class GitHubBackend{
  constructor(cfg){ this.kind="github"; this.repo=cfg.repo; this.branch=cfg.branch||"main"; this.path=cfg.path; this.token=cfg.token; this.sha=null; this.checked=false; this.api=cfg.api||"https://api.github.com"; }
  h(){ return {"Accept":"application/vnd.github+json","Authorization":"Bearer "+this.token,"X-GitHub-Api-Version":"2022-11-28"}; }
  async check(){
    const r=await fetch(`${this.api}/repos/${this.repo}`,{headers:this.h(),cache:"no-store"});
    if(r.status===401) throw new Error("GitHub rejected the token.");
    if(r.status===404) throw new Error("Repo not found, or the token cannot see it.");
    if(!r.ok) throw new Error("GitHub error "+r.status+".");
    const j=await r.json();
    if(!j.private) throw new Error("This repo is public, so pipeline data would be exposed. Use a private repo.");
    this.checked=true; return j;
  }
  async load(){
    if(!this.checked) await this.check();
    const url=`${this.api}/repos/${this.repo}/contents/${this.path}?ref=${encodeURIComponent(this.branch)}`;
    const r=await fetch(url,{headers:this.h(),cache:"no-store"});
    if(r.status===404){ this.sha=null; return {data:null}; }
    if(!r.ok) throw new Error("GitHub error "+r.status+" reading the pipeline.");
    const j=await r.json(); this.sha=j.sha;
    let text=j.encoding==="none"?null:b64decode(j.content||"");
    if(text==null){ // files over 1 MB come without inline content: read the raw file instead
      const raw=await fetch(url,{headers:{...this.h(),"Accept":"application/vnd.github.raw+json"},cache:"no-store"});
      if(!raw.ok) throw new Error("GitHub error "+raw.status+" reading the pipeline."); text=await raw.text(); }
    return {data:text.trim()?JSON.parse(text):null};
  }
  async save(data){
    if(!this.checked) await this.check();
    const body={message:"Pipeline update",content:b64encode(JSON.stringify(data,null,1)),branch:this.branch}; if(this.sha) body.sha=this.sha;
    const r=await fetch(`${this.api}/repos/${this.repo}/contents/${this.path}`,{method:"PUT",headers:{...this.h(),"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(r.status===409||r.status===422){ const e=new Error("conflict"); e.conflict=true; throw e; }
    if(!r.ok) throw new Error("GitHub error "+r.status+" saving the pipeline.");
    const j=await r.json(); this.sha=j.content&&j.content.sha; return {};
  }
}

// ---------- team access: one team password instead of tokens ----------
// The pipeline owner encrypts the GitHub token for the private repo with a team password (PBKDF2-SHA256, 600,000
// iterations, then AES-256-GCM). The result ("access code") is published with the dashboards in team.js: without the
// password it is useless. A device that has unlocked once keeps the derived key (never the password or the token),
// so the owner can replace the token under the same password without anyone entering anything again.
const TEAM_ITER=600000, enc8=new TextEncoder();
const u8b64=buf=>{ const b=new Uint8Array(buf); let s=""; for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); };
const b64u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function teamKey(password, salt, iter){ const base=await crypto.subtle.importKey("raw",enc8.encode(password),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},true,["encrypt","decrypt"]); }
async function openWith(key, a){ try{ const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64u8(a.iv)},key,b64u8(a.ct)); const j=JSON.parse(new TextDecoder().decode(pt)); return j&&j.token?j.token:null; }catch(e){ return null; } }
const Team={
  MIN:16,
  /** Encrypt a token under the team password. With prev (the current access code) and the same password, the salt is kept so unlocked devices stay unlocked. */
  async create({token, password, repo, branch, prev}){
    let salt=null, iter=TEAM_ITER, key=null, kept=false;
    if(prev&&prev.salt){ const k=await teamKey(password,b64u8(prev.salt),prev.iter||TEAM_ITER); if(await openWith(k,prev)){ salt=b64u8(prev.salt); iter=prev.iter||TEAM_ITER; key=k; kept=true; } }
    if(!key){ salt=crypto.getRandomValues(new Uint8Array(16)); key=await teamKey(password,salt,iter); }
    const iv=crypto.getRandomValues(new Uint8Array(12)), ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc8.encode(JSON.stringify({token})));
    return {access:{v:1,repo,branch:branch||"main",kdf:"PBKDF2-SHA256",iter,salt:u8b64(salt),iv:u8b64(iv),ct:u8b64(ct),t:nowISO()}, key:u8b64(await crypto.subtle.exportKey("raw",key)), kept};
  },
  /** Open an access code with the team password: the token, plus the derived key for this device to keep. */
  async unlock(a, password){ const key=await teamKey(password,b64u8(a.salt),a.iter||TEAM_ITER), token=await openWith(key,a);
    if(!token) throw new Error("That team password doesn't match."); return {token, key:u8b64(await crypto.subtle.exportKey("raw",key))}; },
  /** Open an access code with a key kept from an earlier unlock; null when the team password has changed since. */
  async open(a, rawKey){ if(!a||!rawKey) return null; try{ const key=await crypto.subtle.importKey("raw",b64u8(rawKey),{name:"AES-GCM"},false,["decrypt"]); return await openWith(key,a); }catch(e){ return null; } },
  /** team.js as published with the dashboards. */
  file(a){ return `/* Team access for the deal pipeline, created in the dashboard's Storage dialog by the pipeline owner.\n   The GitHub token for the private pipeline repo, encrypted with the team password (PBKDF2-SHA256, ${a.iter} iterations,\n   AES-256-GCM): safe to publish, only the team password opens it. null = not set up (each device keeps its own pipeline). */\nwindow.TEAM_ACCESS = ${JSON.stringify(a)};\n`; }
};

class Store{
  constructor(o){
    this.key=o.key; this.stages=o.stages||STAGES; this.idx=Object.fromEntries(this.stages.map((s,i)=>[s.key,i]));
    this.seed=o.seed||(()=>"long"); this.state={v:1,recs:{}}; this.subs=new Set();
    this.memory=!!o.memory; this.cfg=this.memory?{}:Store.loadCfg(o.key); this._mem={};
    this.teamPub=o.team||null; this.team=this.pickTeam(); this.teamToken=null;
    this.teamOpening=this.cfg.mode==="team"&&!!this.team&&!!this.kv("teamkey");
    this.status={mode:this.memory?"memory":(this.cfg.mode||"local"),state:"idle",at:null,msg:""};
    this.cacheKey="gpc-pipe-cache-"+o.key; this.local=this.memory?new MemoryBackend():new LocalBackend(o.key); this.dirty=false;
    if(!this.memory) addEventListener("online",()=>{ if(this.dirty) this.push(); else this.pull(); });
  }
  // The connection (mode, repo, branch, token, name) is shared by every dashboard on this site; only the file path is per dashboard.
  static loadCfg(key){ try{ const own=JSON.parse(localStorage.getItem("gpc-pipe-cfg-"+key)||"{}"), sh=JSON.parse(localStorage.getItem("gpc-pipe-cfg")||"{}"), c={...own,...sh};
    if(own.path) c.path=own.path; else delete c.path; return c; }catch(e){ return {}; } }
  saveCfg(cfg){ this.cfg={...this.cfg,...cfg}; this._gh=null; if(this.memory) return;
    try{ const {path,...shared}=this.cfg; localStorage.setItem("gpc-pipe-cfg", JSON.stringify(shared)); localStorage.setItem("gpc-pipe-cfg-"+this.key, JSON.stringify(path?{path}:{})); }catch(e){} }
  path(){ return this.cfg.path||`pipeline/${this.key}.json`; }
  backend(){
    if(this.cfg.mode==="team"&&this.team&&this.teamToken){ if(!this._gh) this._gh=new GitHubBackend({repo:this.team.repo,branch:this.team.branch,path:this.path(),token:this.teamToken,api:this.team.api}); return this._gh; }
    if(this.cfg.mode==="github"&&this.cfg.repo&&this.cfg.token){ if(!this._gh) this._gh=new GitHubBackend({repo:this.cfg.repo,branch:this.cfg.branch,path:this.path(),token:this.cfg.token,api:this.cfg.api}); return this._gh; }
    return this.local; }
  repoName(){ return this.cfg.mode==="team"&&this.team?this.team.repo:this.cfg.repo; }
  // device-level keeps shared by every dashboard on the site: the derived team key, and an access code created here that is not published yet
  kv(k, v){ const n="gpc-pipe-"+k; if(this.memory){ if(v===undefined) return this._mem[n]??null; this._mem[n]=v; return; }
    try{ if(v===undefined) return JSON.parse(localStorage.getItem(n)||"null"); if(v===null) localStorage.removeItem(n); else localStorage.setItem(n, JSON.stringify(v)); }catch(e){ return null; } }
  pickTeam(){ const pub=this.teamPub, pend=this.kv("teampending"); if(pend&&(!pub||(pend.t||"")>(pub.t||""))) return pend; if(pend) this.kv("teampending",null); return pub; }
  /** "none" (not set up), "open" (this device syncs as the team), "own" (own token), "opening", or "locked". */
  teamState(){ return !this.team?"none":this.cfg.mode==="team"&&this.teamToken?"open":this.teamOpening?"opening":this.cfg.mode==="github"?"own":"locked"; }
  async openTeam(){ this.teamToken=null; this._gh=null; const k=this.kv("teamkey");
    this.teamToken=this.team&&k&&k.salt===this.team.salt?await Team.open(this.team,k.key):null; this.teamOpening=false; return !!this.teamToken; }
  async unlockTeam(password, me){ if(!this.team) throw new Error("Team access has not been set up yet."); const r=await Team.unlock(this.team,password);
    this.kv("teamkey",{salt:this.team.salt,key:r.key}); this.teamToken=r.token; this.saveCfg({mode:"team",teamOff:false,...(me?{me}:{})}); await this.pull(); return this.status; }
  /** The owner created a new access code on this device: use it now, and keep it until the published dashboards carry it. */
  async adoptTeam(res){ this.kv("teampending",res.access); this.team=res.access; this.kv("teamkey",{salt:res.access.salt,key:res.key}); this.saveCfg({mode:"team",teamOff:false}); await this.openTeam(); await this.pull(); return this.status; }
  lockTeam(){ this.kv("teamkey",null); this.teamToken=null; this.saveCfg({mode:"local"}); return this.pull(); }
  me(){ return String(this.cfg.me||"").trim(); }
  on(fn){ this.subs.add(fn); return ()=>this.subs.delete(fn); }
  emit(){ this.subs.forEach(f=>{ try{ f(); }catch(e){ (window.__ERRORS||[]).push(String(e)); } }); }
  setStatus(s){ this.status={...this.status,...s}; this.emit(); }
  cache(){ if(this.memory) return; try{ localStorage.setItem(this.cacheKey, JSON.stringify(this.state)); }catch(e){} }
  async init(){
    if(!this.memory){ try{ const c=localStorage.getItem(this.cacheKey); if(c) this.state=mergeState(this.state, JSON.parse(c)); }catch(e){} }
    const l=await this.local.load(); if(l.data) this.state=mergeState(this.state,l.data);
    if(this.cfg.mode==="team") await this.openTeam();
    this.emit(); return this.pull();
  }
  teamMsg(e){ return this.cfg.mode==="team"&&/token/i.test(e.message)?"The team access has expired or been revoked. The pipeline owner needs to renew it under Storage.":e.message; }
  async pull(){
    if(this.cfg.mode==="team"&&!this.teamToken){ this._gh=null; this.setStatus({mode:"team",state:"locked",at:null,msg:this.team?"Enter the team password to sync with the team.":"Team access has not been set up yet."}); return; }
    const be=this.backend(); this.setStatus({mode:be.kind});
    if(be.kind!=="github"){ this.setStatus({state:be.kind,at:new Date(),msg:""}); return; }
    this.setStatus({state:"syncing"});
    try{ const r=await be.load(), ahead=aheadOf(this.state,r.data); if(r.data) this.state=mergeState(this.state,r.data); this.cache(); this.setStatus({state:"synced",at:new Date(),msg:""}); if(this.dirty||ahead) await this.push(); }
    catch(e){ this.setStatus({state:navigator.onLine===false?"offline":"error",msg:this.teamMsg(e)}); }
  }
  schedule(){ this.dirty=true; this.cache(); clearTimeout(this._t); this._t=setTimeout(()=>this.push(),this.memory?0:1200); }
  async push(){
    const be=this.backend(); this.cache();
    if(be.kind!=="github"){ await be.save(this.state); const locked=this.cfg.mode==="team"; this.dirty=locked; this.setStatus(locked?{mode:"team",state:"locked"}:{state:be.kind,at:new Date(),msg:""}); return; }
    this.setStatus({state:"saving"});
    for(let i=0;i<4;i++){
      try{ if(i===0&&!be.sha){ const r=await be.load(); if(r.data) this.state=mergeState(this.state,r.data); }
        await be.save(this.state); this.dirty=false; this.cache(); this.setStatus({state:"synced",at:new Date(),msg:""}); return; }
      catch(e){ if(e.conflict){ const r=await be.load().catch(()=>({data:null})); if(r.data) this.state=mergeState(this.state,r.data); continue; }
        this.setStatus({state:navigator.onLine===false?"offline":"error",msg:this.teamMsg(e)+" Changes are kept on this device and will sync later."}); return; }
    }
    this.setStatus({state:"error",msg:"Could not save after several tries; changes are kept on this device."});
  }
  rec(name){ return this.state.recs[name]||null; }
  get(c){ const r=this.rec(c.name); if(r) return r; const st=this.seed(c); return {stage:st, auto:true, peak:this.idx[st]||0, log:[]}; }
  stageOf(c){ return this.get(c).stage; }
  stageIndex(c){ return this.idx[this.stageOf(c)]??0; }
  update(c, patch){
    const prev=this.get(c), now=nowISO(), by=this.me();
    const next={...prev, ...patch, u:now, by}; delete next.auto;
    const log=[...(prev.log||[])];
    if(patch.stage&&patch.stage!==prev.stage){
      log.push({t:now,k:"stage",from:prev.stage,to:patch.stage,by}); next.since=now;
      const s=this.stages[this.idx[patch.stage]];
      next.peak=Math.max(prev.peak??0, s&&!s.closed?this.idx[patch.stage]:(this.idx[prev.stage]||0));
      if(s&&!s.closed) delete next.reason;
    } else {
      ["owner","next","due","last","pri","reason"].forEach(k=>{ if(k in patch && (patch[k]||"")!==(prev[k]||"")) log.push({t:now,k:"edit",field:k,to:patch[k]||"",by}); });
    }
    next.log=log; this.state.recs[c.name]=next; this.emit(); this.schedule(); return next;
  }
  note(c, text){ const t=String(text||"").trim(); if(!t) return this.get(c); const prev=this.get(c), now=nowISO(), by=this.me();
    const next={...prev,u:now,by,log:[...(prev.log||[]),{t:now,k:"note",text:t,by}]}; delete next.auto; this.state.recs[c.name]=next; this.emit(); this.schedule(); return next; }
  daysInStage(c){ const r=this.get(c); if(!r.since) return null; return Math.max(0,Math.floor((Date.now()-new Date(r.since).getTime())/864e5)); }
  owners(){ return [...new Set(Object.values(this.state.recs).map(r=>String(r.owner||"").trim()).filter(Boolean))].sort(); }
  exportJSON(){ return JSON.stringify(this.state,null,1); }
  importJSON(s){ const d=JSON.parse(s); if(!d||typeof d.recs!=="object") throw new Error("That is not a pipeline file."); this.state=mergeState(this.state,d); this.emit(); this.schedule(); }
}
window.Pipeline={ STAGES, Store, Team, GitHubBackend, LocalBackend, MemoryBackend, mergeState, mergeLogs, aheadOf, b64encode, b64decode, dayKey };
})();
