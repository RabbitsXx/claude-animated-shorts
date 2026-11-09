// Fast review pass of a whole film: renders sampled frames at lower quality, prints every limb-reach error,
// and builds contact sheets in episodes/<id>/out/review/. Look at the sheets before any full render.
// usage: node studio2/review.mjs [--episode episodes/time-machine-success] [--step 0.4 | --full] [--from 0] [--to END]
// --full renders one frame per 1/30 s so a final QA covers every frame, not samples.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const ep=get('--episode','episodes/time-machine-success'),full=a.includes('--full'),step=Number(get('--step',full?String(1/30):'0.4'));
const words=JSON.parse(fs.readFileSync(path.join(ROOT,ep,'voice/words.json'),'utf8'));
const end=Number(get('--to',(words.at(-1).end+.6).toFixed(2))),from=Number(get('--from','0'));
const times=[];for(let t=from;t<end;t+=step)times.push(+t.toFixed(3));
const out=path.join(ROOT,ep,'out/review'),frames=path.join(out,'frames');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(frames,{recursive:true});
const r=spawnSync('node',[path.join(ROOT,'studio2/render.mjs'),'--scene',`${ep}/scene2/main.mjs`,'--words',`${ep}/voice/words.json`,'--times',times.join(','),'--out',frames,'--captions','--collide','--quality','0.75','--timeout','1800'],{cwd:ROOT,stdio:'inherit'});
if(r.status)process.exit(r.status);
const per=42;
for(let i=0;i*per<times.length;i++)spawnSync('python',[path.join(ROOT,'studio2/sheet.py'),frames,path.join(out,`sheet-${i}.jpg`),'--cols','6','--width','300','--every','1','--start',String(i*per),'--count',String(per)],{cwd:ROOT,stdio:'inherit'});
console.log('Contact sheets:',out,'- open every sheet and read it frame by frame; a reach line above means a limb is clamped short.');
