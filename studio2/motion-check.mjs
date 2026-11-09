// Editing and motion check against the reference clip: decodes out/final.mp4 at 108x192 gray, measures the frame-to-frame motion, hard cuts and soft transitions
// (studio2/lib/motion-stats.mjs) and writes out/motion.json. Exit 3 when the film is more static or more chopped up than the reference allows.
// usage: node studio2/motion-check.mjs --episode episodes/<id> [--file out/final.mp4]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {frameDeltas,analyzeMotion,judgeMotion,LIMITS} from './lib/motion-stats.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const ep=path.join(ROOT,get('--episode','episodes/time-machine-success')),file=path.join(ep,get('--file','out/final.mp4'));
if(!fs.existsSync(file)){console.log('MOTION CHECK FAIL: missing '+path.relative(ROOT,file));process.exit(3);}
const W=108,H=192,r=spawnSync('ffmpeg',['-v','error','-i',file,'-vf',`fps=30,scale=${W}:${H}`,'-pix_fmt','gray','-f','rawvideo','-'],{maxBuffer:1<<29});
if(r.status!==0){console.log('MOTION CHECK FAIL: ffmpeg could not decode the video');process.exit(3);}
const n=Math.floor(r.stdout.length/(W*H)),frames=Array.from({length:n},(_,i)=>r.stdout.subarray(i*W*H,(i+1)*W*H));
const stats=analyzeMotion(frameDeltas(frames),{fps:30}),verdict=judgeMotion(stats);
fs.mkdirSync(path.join(ep,'out'),{recursive:true});
fs.writeFileSync(path.join(ep,'out/motion.json'),JSON.stringify({...stats,ok:verdict.ok,problems:verdict.problems,limits:LIMITS,at:new Date().toISOString()},null,1));
console.log(`motion: ${Math.round(stats.staticShare*100)}% near-still, ${stats.hardCuts} hard cuts, ${stats.softTransitions} soft transitions, 4 s windows ${stats.windows.join(' ')}`);
for(const p of verdict.problems)console.log('  - '+p);
console.log(verdict.ok?'MOTION CHECK PASS':`MOTION CHECK FAIL: ${verdict.problems.length} problem(s)`);
process.exit(verdict.ok?0:3);
