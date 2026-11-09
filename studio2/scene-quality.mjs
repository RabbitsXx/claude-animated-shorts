// Scene quality gate: is every beat's key frame dressed as richly as the reference (props, depth layers, backdrop, detail parts)?
// Reads out/collide.json (written by collide.mjs, which measures the dressing of the real scene through the real camera) and STORY.json.
// usage: node studio2/scene-quality.mjs --episode episodes/<id>      exit 3 = a beat is under-dressed
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {judgeFilm,LIMITS} from './lib/scene-quality.mjs';
import {keyframeTimes} from './lib/storyboard.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const ep=path.join(ROOT,get('--episode','episodes/time-machine-success'));
const read=(f)=>JSON.parse(fs.readFileSync(path.join(ep,f),'utf8'));
let collide,story;
try{collide=read('out/collide.json');story=read('STORY.json');}catch(e){console.log('SCENE QUALITY FAIL: run collide.mjs first (needs out/collide.json) and STORY.json');process.exit(3);}
if(!collide.dressing||!collide.dressing.length){console.log('SCENE QUALITY FAIL: out/collide.json has no dressing data; re-run collide.mjs');process.exit(3);}
const step=collide.step||1/30,times=keyframeTimes(story);
const keys=times.map((t,i)=>{const c=(collide.cameras||[])[Math.round(t/step)];const d=c&&c.p&&c.t?Math.hypot(c.p[0]-c.t[0],c.p[1]-c.t[1],c.p[2]-c.t[2]):99;return {beat:i+1,t,closeUp:d<=LIMITS.closeUpDist};});
const r=judgeFilm(collide.dressing,keys);
for(const f of r.failures){console.log(`BEAT ${f.beat} (t=${f.t}s)`+(f.measured?` props ${f.measured.count} layers ${f.measured.layers} parts ${f.measured.parts}`:''));for(const p of f.problems)console.log('  - '+p);}
const worst=collide.dressing.length;
fs.writeFileSync(path.join(ep,'out/scene-quality.json'),JSON.stringify({...r,measuredFrames:worst,limits:LIMITS,at:new Date().toISOString()},null,1));
console.log(r.ok?`SCENE QUALITY PASS: ${r.checked} beat key frames dressed to the limits`:`SCENE QUALITY FAIL: ${r.failures.length}/${r.checked} beats under-dressed`);
process.exit(r.ok?0:3);
