// Model-overlap gate: renders NO images, just poses every actor at every frame and tests every body part against every
// solid prop and every other actor (studio2/runtime/collide.js). Writes episodes/<id>/out/collide.json, which
// assemble.mjs requires. Exit code 3 = overlaps found.
// usage: node studio2/collide.mjs [--episode episodes/time-machine-success] [--step 0.0333333]
//   --workers N  split the frames into N contiguous ranges, check them at the same time in N browsers and merge the reports (same frames, same checks, same
//                out/collide.json; the ranges only meet at their ends). Default 1. Added 2026-11-09 after a day lost waiting 9 minutes per full pass.
//   --ranges 52-56,10-12  re-check ONLY those seconds and merge them into the existing PASSING full report (what changed since: scene code of those beats).
//                Everything outside stays as it was checked; the report records the ranges in `incremental`. Refuses when there is no passing full-frame
//                report to merge into. A change that reaches other beats (engine, shared helpers, models) needs a full pass.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sourceHash} from './lib/source-hash.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const epRel=get('--episode','episodes/time-machine-success'),ep=path.join(ROOT,epRel);
const words=JSON.parse(fs.readFileSync(path.join(ep,'voice/words.json'),'utf8'));
const filmJson=fs.existsSync(path.join(ep,'film.json'))?JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')):{},end=Math.max(words.at(-1).end+.6,filmJson.mixSeconds||0), // a film whose last beat is silent runs past its last word (film.json mixSeconds)
 step=Number(get('--step',String(1/30))),n=Math.floor(end/step);
const times=Array.from({length:n},(_,i)=>+(i*step).toFixed(4));
fs.mkdirSync(path.join(ep,'out'),{recursive:true});
const rep=path.join(ep,'out/collide.json');
const workers=Math.max(1,Math.min(6,Number(get('--workers','1'))|0)),hash=sourceHash(ROOT,ep);
const renderArgs=(ts,outDir,collideOut)=>[path.join(ROOT,'studio2/render.mjs'),'--scene',`${epRel}/scene2/main.mjs`,'--words',`${epRel}/voice/words.json`,'--times',ts.join(','),'--out',outDir,'--collide-only','--collide-out',collideOut,'--source-hash',hash,'--timeout','1800'];
const rangesArg=get('--ranges',null);
if(rangesArg){
 const RR=rangesArg.split(',').map(x=>x.split('-').map(Number)),inR=(t)=>RR.some(([a0,b0])=>t>=a0-1e-6&&t<=b0+1e-6);
 const old=fs.existsSync(rep)?JSON.parse(fs.readFileSync(rep,'utf8')):null;
 // an earlier FAIL may be merged into when every failing row lies wholly inside the ranges being re-checked (they are replaced by the new result)
 const rowIn=(o)=>RR.some(([a0,b0])=>o.from>=a0-1e-6&&o.to<=b0+1e-6),rowTouches=(o)=>RR.some(([a0,b0])=>o.to>=a0-1e-6&&o.from<=b0+1e-6);
 if(!old||old.checkedFrames<times.length-1||old.step>step+1e-6||old.overlaps.some(o=>rowTouches(o)&&!rowIn(o))||old.overlaps.some(o=>!rowTouches(o))){console.error('COLLIDE INCREMENTAL REFUSED: needs a full-frame report whose failing rows (if any) all lie inside the ranges; run a full pass (--workers 4)');process.exit(3);}
 const sel=times.filter(inR),partDir=path.join(ROOT,'studio2/.tmp/collide-inc');fs.rmSync(partDir,{recursive:true,force:true});fs.mkdirSync(partDir,{recursive:true});
 const t1=Date.now(),csize=Math.ceil(sel.length/Math.max(1,workers)),chunks=Array.from({length:Math.max(1,workers)},(_,k)=>sel.slice(k*csize,(k+1)*csize)).filter(c=>c.length);
 const runChunk=(ts,k)=>new Promise(res=>{let log='';const c=spawn('node',renderArgs(ts,path.join(partDir,'frames'+k),path.join(partDir,'part'+k+'.json')),{cwd:ROOT});c.stdout.on('data',d=>{log+=d;});c.stderr.on('data',d=>{log+=d;});c.on('close',code=>res({k,code,log}));});
 const done=await Promise.all(chunks.map(runChunk));
 const j={cameras:[],dressing:[],intent:[],overlaps:[],ok:true};
 chunks.forEach((ts,k)=>{const f=path.join(partDir,'part'+k+'.json');
  if(!fs.existsSync(f)){console.error('range chunk '+k+' wrote no report (exit '+done[k].code+'): '+done[k].log.split(String.fromCharCode(10)).slice(-6).join(' | '));process.exit(1);}
  const q=JSON.parse(fs.readFileSync(f,'utf8'));ts.forEach((t,i)=>{old.cameras[Math.round(t/step)]=q.cameras[i];});j.dressing.push(...q.dressing);j.intent.push(...(q.intent||[]));j.overlaps.push(...q.overlaps);j.ok=j.ok&&q.ok;});
 j.overlaps.sort((x,y)=>x.from-y.from);
 old.dressing=[...old.dressing.filter(d=>!inR(d.t)),...j.dressing];old.intent=[...(old.intent||[]).filter(d=>!inR(d.t)),...(j.intent||[])];
 old.overlaps=j.overlaps;old.ok=j.ok;old.sourceHash=hash;old.checkedAt=new Date().toISOString();(old.incremental=old.incremental||[]).push({ranges:RR,frames:sel.length,at:old.checkedAt});
 for(const o of j.overlaps)console.log('OVERLAP',o.what,`t=${o.from}-${o.to}s`,`frames=${o.frames}`,`depth<=${o.maxDepthM}m`,'at',JSON.stringify(o.at));
 fs.writeFileSync(rep,JSON.stringify(old));
 console.log(j.overlaps.length?`COLLIDE FAIL: ${j.overlaps.length} overlap(s) in the ${sel.length} re-checked frames`:`COLLIDE PASS (incremental): ${sel.length} frames re-checked, the other ${old.checkedFrames-sel.length} kept (${((Date.now()-t1)/60000).toFixed(1)} min)`);
 process.exit(j.ok?0:3);
}
if(workers<=1||times.length<workers*20){
 const r=spawnSync('node',renderArgs(times,path.join(ROOT,'studio2/.tmp/collide-frames'),rep),{cwd:ROOT,stdio:'inherit'});
 process.exit(r.status||0);
}
// parallel: contiguous ranges, each into its own temp folder (its own gate-history too), then one merged report
const parts=path.join(ROOT,'studio2/.tmp/collide-parts',path.basename(ep));fs.rmSync(parts,{recursive:true,force:true});fs.mkdirSync(parts,{recursive:true});
const size=Math.ceil(times.length/workers),chunks=Array.from({length:workers},(_,k)=>times.slice(k*size,(k+1)*size)).filter(c=>c.length);
const runPart=(ts,k)=>new Promise(res=>{let log='';const c=spawn('node',renderArgs(ts,path.join(parts,'frames'+k),path.join(parts,'part'+k+'.json')),{cwd:ROOT});c.stdout.on('data',d=>{log+=d;});c.stderr.on('data',d=>{log+=d;});c.on('close',code=>res({k,code,log}));});
const t0=Date.now(),results=await Promise.all(chunks.map(runPart));
let bad=false;const merged={checkedFrames:0,times:[chunks[0][0],chunks.at(-1).at(-1)],step:step,overlaps:[],cameras:[],dressing:[],intent:[],ok:true,sourceHash:hash};
for(const r of results){
 const f=path.join(parts,'part'+r.k+'.json');
 if(!fs.existsSync(f)){console.error('part '+r.k+' wrote no report (exit '+r.code+')\n'+r.log.split('\n').slice(-6).join('\n'));bad=true;continue;}
 const j=JSON.parse(fs.readFileSync(f,'utf8'));
 merged.checkedFrames+=j.checkedFrames;merged.overlaps.push(...j.overlaps);merged.cameras.push(...j.cameras);merged.dressing.push(...j.dressing);merged.intent.push(...(j.intent||[]));merged.ok=merged.ok&&j.ok;
}
if(bad)process.exit(1);
merged.overlaps.sort((x,y)=>x.from-y.from);merged.checkedAt=new Date().toISOString();
for(const o of merged.overlaps)console.log('OVERLAP',o.what,`t=${o.from}-${o.to}s`,`frames=${o.frames}`,`depth<=${o.maxDepthM}m`,'at',JSON.stringify(o.at));
fs.writeFileSync(rep,JSON.stringify(merged));
fs.appendFileSync(path.join(ep,'out/gate-history.jsonl'),JSON.stringify({at:merged.checkedAt,ok:merged.ok,overlaps:merged.overlaps.length,frames:merged.checkedFrames,workers,kinds:merged.overlaps.map(x=>x.what.replace(/crowd\d+/g,'crowd').replace(/ \d+(\.\d+)?$/,''))})+String.fromCharCode(10));
console.log(merged.overlaps.length?`COLLIDE FAIL: ${merged.overlaps.length} overlap(s) in ${merged.checkedFrames} frames (${workers} workers, ${((Date.now()-t0)/60000).toFixed(1)} min)`:`COLLIDE PASS: ${merged.checkedFrames} frames, no overlaps (${workers} workers, ${((Date.now()-t0)/60000).toFixed(1)} min)`);
process.exit(merged.ok?0:3);
