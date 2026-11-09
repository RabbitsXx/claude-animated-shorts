// Render the whole film (or any frame range) with several browsers at the same time.
//   node studio2/render-parallel.mjs --episode episodes/<id> [--workers 3] [--quality 0.96] [--out DIR] [--captions-off] [--from S --to S]
// --from/--to (seconds) re-render ONLY that stretch into the existing --out and leave every other frame untouched (nothing is moved to previous).
// The frames are identical to a single render: each worker renders a contiguous range with render.mjs --from/--to/--indexBase (the same flags
// render-smart.mjs uses), into its own folder; the frames (f00000.jpg ...) are then moved into --out (default episodes/<id>/renders/full).
// The film is a pure function of time, so splitting it changes nothing but the wall time. An existing --out is moved to renders/previous first.
// Never copies a manifest.json (a copied manifest once overwrote frames: docs/DEFECTS.json render-segment-near-boundary-nondeterministic).
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const epRel=get('--episode',null);if(!epRel){console.error('usage: node studio2/render-parallel.mjs --episode episodes/<id> [--workers 3] [--quality 0.96] [--out DIR]');process.exit(2);}
const ep=path.join(ROOT,epRel),workers=Math.max(1,Math.min(6,Number(get('--workers','3'))|0)),quality=get('--quality','0.96');
const out=get('--out',null)?path.resolve(get('--out')):path.join(ep,'renders/full');
const words=JSON.parse(fs.readFileSync(path.join(ep,'voice/words.json'),'utf8')),film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8'));
const duration=film.mixSeconds?Math.ceil(film.mixSeconds*30)/30:Math.ceil((words.at(-1).end+.6)*30)/30,total=Math.round(duration*30);
// balance by frames; the last worker takes the remainder
const partial=a.includes('--from')||a.includes('--to'),f0=partial?Math.round(Number(get('--from','0'))*30):0,f1=partial?Math.min(total,Math.round(Number(get('--to',String(total/30)))*30)):total;
const span=f1-f0,size=Math.ceil(span/workers),ranges=Array.from({length:workers},(_,k)=>({from:f0+k*size,to:Math.min(f1,f0+(k+1)*size)})).filter(r=>r.to>r.from);
const tmp=path.join(ep,'renders/_parallel');fs.rmSync(tmp,{recursive:true,force:true});fs.mkdirSync(tmp,{recursive:true});
const t0=Date.now();
const runRange=(r,k)=>new Promise(res=>{
 const dir=path.join(tmp,'w'+k);let log='';
 const args=['studio2/render.mjs','--scene',`${epRel}/scene2/main.mjs`,'--words',`${epRel}/voice/words.json`,...(a.includes('--captions-off')?[]:['--captions']),'--quality',quality,'--timeout','3600','--from',String(r.from/30),'--to',String(r.to/30),'--indexBase',String(r.from),'--out',dir];
 const c=spawn('node',args,{cwd:ROOT});c.stdout.on('data',d=>{log+=d;});c.stderr.on('data',d=>{log+=d;});c.on('close',code=>res({k,code,log,dir,r}));
});
console.log(`rendering ${total} frames with ${ranges.length} workers: ${ranges.map(r=>`${r.from}-${r.to-1}`).join(' | ')}`);
const results=await Promise.all(ranges.map(runRange));
let failed=false;
for(const x of results){const n=fs.existsSync(x.dir)?fs.readdirSync(x.dir).filter(f=>/^f\d{5}\.jpg$/.test(f)).length:0,want=x.r.to-x.r.from;
 if(x.code!==0||n!==want){failed=true;console.error(`worker ${x.k} failed: exit ${x.code}, ${n}/${want} frames\n`+x.log.split('\n').slice(-6).join('\n'));}}
if(failed){console.error('PARALLEL RENDER FAILED; partial frames are left in '+tmp);process.exit(1);}
if(!partial&&fs.existsSync(out)){const prev=path.join(path.dirname(out),'previous');fs.rmSync(prev,{recursive:true,force:true});fs.renameSync(out,prev);console.log('moved the old frames to '+path.relative(ROOT,prev));}
fs.mkdirSync(out,{recursive:true});
for(const x of results)for(const f of fs.readdirSync(x.dir))if(/^f\d{5}\.jpg$/.test(f))fs.renameSync(path.join(x.dir,f),path.join(out,f));
fs.rmSync(tmp,{recursive:true,force:true});
const have=fs.readdirSync(out).filter(f=>/^f\d{5}\.jpg$/.test(f)).length;if(partial)console.log(`re-rendered frames ${f0}-${f1-1}; the other ${have-span} frames untouched`);
fs.appendFileSync(path.join(path.dirname(out),'render-history.jsonl'),JSON.stringify({at:new Date().toISOString(),frames:have,from:0,to:duration,quality:Number(quality),workers:ranges.length,minutes:+((Date.now()-t0)/60000).toFixed(2)})+String.fromCharCode(10));
console.log(`DONE: ${have}/${total} frames in ${((Date.now()-t0)/60000).toFixed(1)} min with ${ranges.length} workers -> ${path.relative(ROOT,out)}`);
process.exit(have===total?0:1);
