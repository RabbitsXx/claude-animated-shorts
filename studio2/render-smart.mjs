// Render only what changed. After a finished full render, any later change to scene code, camera, light or captions needs only the
// stretches that look different, not another 9 minutes.
//   node studio2/render-smart.mjs --episode episodes/<id> [--fps 2] [--threshold 0.3] [--quality 0.96] [--against DIR] [--frames DIR] [--dry]
// 1 sample render at --fps of the current code, 2 compare with the same frames of renders/full (python studio2/imgdiff.py),
// 3 re-render only the dirty stretches into renders/full (--indexBase keeps the frame numbers), 4 print what was re-rendered.
// --against DIR compares with another frames folder instead (with --dry nothing is rendered: use it to see what a change touches).
// Audio-only changes (cues.mjs, mix) need NO render at all: run assemble.mjs. Engine-wide changes dirty most frames and fall back to a full render.
// Fixed limit: a change that exists only between two sample points can be missed; use --fps 4 for tiny edits (cost about 1.2 s per sample).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirtyRanges,coverage} from './lib/dirty-ranges.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const epRel=get('--episode',null);if(!epRel){console.error('usage: node studio2/render-smart.mjs --episode episodes/<id> [--fps 2] [--threshold .3] [--against DIR] [--frames DIR] [--dry]');process.exit(2);}
const fps=Number(get('--fps','2')),threshold=Number(get('--threshold','.3')),quality=get('--quality','0.96'),dry=a.includes('--dry');
const ep=path.join(ROOT,epRel),full=get('--frames',null)?path.resolve(get('--frames')):path.join(ep,'renders/full'),ref=get('--against',null)?path.resolve(get('--against')):full;
const words=JSON.parse(fs.readFileSync(path.join(ep,'voice/words.json'),'utf8')),film0=fs.existsSync(path.join(ep,'film.json'))?JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')):{},duration=film0.mixSeconds?Math.ceil(film0.mixSeconds*30)/30:Math.ceil((words.at(-1).end+.6)*30)/30,total=Math.round(duration*30); // film.json mixSeconds: a film whose last beat is silent runs past its last word (same rule as mix.mjs and collide.mjs)
const film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8'));void film;
const run=(cmd,args,o={})=>spawnSync(cmd,args,{cwd:ROOT,encoding:'utf8',maxBuffer:1<<28,...o});
const scene=`${epRel}/scene2/main.mjs`,wordsRel=`${epRel}/voice/words.json`;
const renderArgs=(extra)=>['studio2/render.mjs','--scene',scene,'--words',wordsRel,'--captions','--quality',quality,'--timeout','3600',...extra];
const t0=Date.now();
if(!fs.existsSync(ref)||fs.readdirSync(ref).filter(f=>/^f\d{5}\.jpg$/.test(f)).length<total*.1){ // missing frames below that are simply 'dirty' (imgdiff scores them 1000)
 if(dry||ref!==full){console.log(`fewer than 10% of the frames exist in ${ref}: a full render is needed`);process.exit(dry?0:1);}
 fs.mkdirSync(path.dirname(full),{recursive:true});
 console.log(`no complete render yet: rendering all ${total} frames`);
 const r=run('node',renderArgs(['--from','0','--to',String(duration),'--out',full]),{stdio:'inherit'});process.exit(r.status||0);
}
const n=Math.floor(duration*fps),times=Array.from({length:n},(_,k)=>+(k/fps).toFixed(4)),sample=path.join(ROOT,'studio2/.tmp',`smart-${path.basename(ep)}`);
fs.rmSync(sample,{recursive:true,force:true});
let r=run('node',renderArgs(['--times',times.join(','),'--out',sample]));
if(r.status!==0){console.error((r.stderr||r.stdout).split('\n').slice(-6).join('\n'));process.exit(1);}
r=run('python',['studio2/imgdiff.py',sample,ref,String(fps)]);
if(r.status!==0){console.error(r.stderr);process.exit(1);}
const scores=JSON.parse(r.stdout),ranges=dirtyRanges(scores,{fps,totalFrames:total,threshold}),cov=coverage(ranges,total);
console.log(`sample: ${n} frames at ${fps} fps, ${scores.filter(s=>s>threshold).length} differ (threshold ${threshold}); max difference ${Math.max(...scores).toFixed(2)}`);
if(!ranges.length){console.log('UP TO DATE: the render matches the current code, nothing to re-render');process.exit(0);}
for(const g of ranges)console.log(`dirty ${(g.from/30).toFixed(2)}-${(g.to/30).toFixed(2)} s (frames ${g.from}-${g.to})`);
console.log(`dirty share ${(cov*100).toFixed(0)}% of the film`);
if(dry)process.exit(0);
if(ref!==full){console.error('--against needs --dry (it only compares)');process.exit(2);}
if(cov>.6){console.log('over 60% is out of date: rendering in full instead');const x=run('node',renderArgs(['--from','0','--to',String(duration),'--out',full]),{stdio:'inherit'});process.exit(x.status||0);}
for(const g of ranges){
 console.log(`re-rendering ${(g.from/30).toFixed(2)}-${(g.to/30).toFixed(2)} s`);
 const x=run('node',renderArgs(['--from',String(g.from/30),'--to',String(g.to/30),'--indexBase',String(g.from),'--out',full]));
 if(x.status!==0){console.error((x.stderr||x.stdout).split('\n').slice(-6).join('\n'));process.exit(1);}
}
console.log(`DONE: re-rendered ${ranges.reduce((s,g)=>s+g.to-g.from,0)} of ${total} frames in ${((Date.now()-t0)/60000).toFixed(1)} min; run finish.mjs next`);
