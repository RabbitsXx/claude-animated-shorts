// Camera plan gate, no render needed: node studio2/camera-plan.mjs --episode episodes/<id>   (reads out/collide.json, run collide.mjs first)
// Fails (exit 3) when a shot does not travel: studio2/lib/camera-plan.mjs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {judgeCameraPlan} from './lib/camera-plan.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),ep=path.join(ROOT,a.includes('--episode')?a[a.indexOf('--episode')+1]:'.');
let g;try{g=JSON.parse(fs.readFileSync(path.join(ep,'out/collide.json'),'utf8'));}catch{console.log('CAMERA PLAN FAIL: no out/collide.json, run collide.mjs first');process.exit(3);}
if(!g.cameras||!g.cameras.length){console.log('CAMERA PLAN FAIL: collide.json has no camera path');process.exit(3);}
const r=judgeCameraPlan(g.cameras,{fps:Math.round(1/(g.step||1/30))});
fs.writeFileSync(path.join(ep,'out/camera-plan.json'),JSON.stringify({...r,at:new Date().toISOString(),collideChecked:g.checkedFrames},null,1));
console.log(`hero head height: median ${r.head?Math.round(r.head.median*100):'?'}% of the frame, ${r.head?Math.round(r.head.bigShare*100):'?'}% of frames over 12%`);
console.log(`camera plan: ${r.shots.length} shots, travel per second ${r.shots.map(s=>Math.round(s.travelPerSecond*100)+'%').join(' ')}`);
for(const p of r.problems)console.log('  - '+p);for(const w of r.warnings)console.log('  warning: '+w);
console.log(r.ok?'CAMERA PLAN PASS':`CAMERA PLAN FAIL: ${r.problems.length} problem(s): travel range or hero size`);process.exit(r.ok?0:3);
