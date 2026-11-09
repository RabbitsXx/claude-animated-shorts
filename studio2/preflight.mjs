// Everything that is cheap to check BEFORE the 10-15 minute full render, in one command:
//   node studio2/preflight.mjs --episode episodes/<id>
// 1 unit tests, 2 story audit, 3 collision gate (includes camera-inside-solid), 4 a one-frame-per-second sample render,
// 5 flat/black frames and the day-night brightness swing on that sample, 6 parity against the reference (richness of the look).
// Prints PASS/FAIL per step and writes out/preflight.json. Exit code 1 if any step fails. A film that passes can be rendered in full.
// Speed (2026-11-09, nothing is weaker): the collision pass and the sample render are independent, so they run at the same time; a collision report that is
// already complete (every frame) for the CURRENT scene code is reused instead of rerun. `--fast` is for iterating on a look: collision every 3rd frame
// (step 0.1), no unit tests, and it writes out/preflight-fast.json only. A fast run never replaces preflight.json, and assemble.mjs refuses a coarse
// collision report (step above 1/30), so a fast PASS cannot send a film to the render. Run the full command once before the full render.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {sourceHash} from './lib/source-hash.mjs';
import {fileURLToPath} from 'node:url';
import {findWhips} from './lib/camera-motion.mjs';
import {contractProblems} from './lib/ref-contract.mjs';
import {judgeCameraPlan} from './lib/camera-plan.mjs';
import {frameSat,judgeLook} from './lib/look-stats.mjs';
import {humanChecklist} from './lib/briefing.mjs';
import {parseSignalStats,analyzeFrames,lumSwing,skyShare,skyRuns} from './lib/framecheck.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/preflight.mjs --episode episodes/<id>');process.exit(2);}
const FAST=a.includes('--fast'),runAsync=(cmd,args)=>new Promise(res=>{const c=spawn(cmd,args,{cwd:ROOT});let so='',se='';c.stdout.on('data',d=>{so+=d;});c.stderr.on('data',d=>{se+=d;});c.on('close',code=>res({status:code,stdout:so,stderr:se}));});
const ep=path.join(ROOT,epRel),id=path.basename(ep),run=(cmd,args,o={})=>spawnSync(cmd,args,{cwd:ROOT,encoding:'utf8',maxBuffer:1<<28,...o});
const steps=[],add=(name,ok,detail)=>{steps.push({name,ok,detail});console.log(`${ok?'PASS':'FAIL'}  ${name}${detail?'  - '+detail:''}`);};
const film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')),words=JSON.parse(fs.readFileSync(path.join(ep,'voice/words.json'),'utf8'));
const duration=Math.ceil((words[words.length-1].end+.6)*30)/30;

{const cp=contractProblems(film,id);add('Ref contract: every gate is on in film.json',cp.length===0,cp.join('; '));}
const tests=fs.readdirSync(path.join(ROOT,'studio2/tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>path.join('studio2/tests',f));
let r;if(FAST)console.log('SKIP  unit tests (fast mode; the full preflight runs them)');else{r=run('node',['--test',...tests]);const m=(r.stdout.match(/ℹ fail (\d+)/)||[])[1],p=(r.stdout.match(/ℹ pass (\d+)/)||[])[1];
add('unit tests',r.status===0,`${p} pass, ${m} fail`);}

r=run('node',['studio2/story-audit.mjs','--episode',epRel]);add('story audit',r.status===0,(r.stdout.match(/STORY (PASS|FAIL.*)/)||[])[0]);

if(fs.existsSync(path.join(ep,'audio/cues.mjs'))){r=run('node',['studio2/mixcheck.mjs','--episode',epRel]);add('music sits 8.5-15 dB under the voice',r.status===0,(r.stdout||r.stderr||'').trim().split(String.fromCharCode(10)).pop().slice(0,160));}

const dir=path.join(ROOT,'studio2/.tmp',`preflight-${id}`);fs.rmSync(dir,{recursive:true,force:true});
const times=[];for(let t=.45;t<duration;t+=1)times.push(+t.toFixed(2));
const renderP=runAsync('node',['studio2/render.mjs','--scene',`${epRel}/scene2/main.mjs`,'--words',`${epRel}/voice/words.json`,'--times',times.join(','),'--out',dir,'--captions','--quality','0.85','--timeout','900']); // starts now, runs next to the collision pass
let reuse=false;if(!FAST){try{const old=JSON.parse(fs.readFileSync(path.join(ep,'out/collide.json'),'utf8'));reuse=!!old.ok&&old.step<=1/30+1e-6&&old.sourceHash===sourceHash(ROOT,ep);}catch{}}
if(reuse)console.log('NOTE  collision report reused: complete, every frame, same scene code (sourceHash)');
r=reuse?{status:0}:await runAsync('node',['studio2/collide.mjs','--episode',epRel,...(FAST?['--step','0.1']:[])]);
let gate=null;try{gate=JSON.parse(fs.readFileSync(path.join(ep,'out/collide.json'),'utf8'));}catch{}
add('collision gate (overlaps, hidden subject, camera inside a solid)',r.status===0&&gate&&gate.ok,gate?`${gate.checkedFrames} frames, ${gate.overlaps.length} problems`+(gate.overlaps[0]?`; first: ${gate.overlaps[0].what} at ${gate.overlaps[0].from}s`:''):'no report');

{let sceneGate=false;try{sceneGate=!!JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')).sceneGate;}catch{} // films made after the owner's scene-quality rule (2026-11-08) set sceneGate:true; older films are exempt
 if(sceneGate){const q=run('node',['studio2/scene-quality.mjs','--episode',epRel]);add('scene quality: every beat dressed to the reference level (props, kinds, depth layers, backdrop)',q.status===0,(q.stdout||q.stderr||'').trim().split(String.fromCharCode(10)).filter(l=>/BEAT|SCENE QUALITY/.test(l)).slice(0,4).join(' | ').slice(0,300));}}
{const whips=gate&&gate.cameras?findWhips(gate.cameras,{step:gate.step||1/30}):null;
 add('no whip-pan: the camera never sweeps through empty space (view turns over 4 deg per frame for 3+ frames)',!whips||whips.length===0,whips?(whips.length?whips.map(w=>`${w.from.toFixed(2)}-${w.to.toFixed(2)}s up to ${w.maxDegPerFrame.toFixed(1)} deg/frame`).join('; '):`${gate.cameras.length} camera frames checked`):'no camera path in the gate report (run collide.mjs again)');}

{if(film.cameraGate===true){const cr=gate&&gate.cameras?judgeCameraPlan(gate.cameras,{fps:Math.round(1/(gate.step||1/30))}):null;add('camera plan: every shot travels (push, orbit, track or crane, floor 3% of the frame width per second, target 10%)',!!cr&&cr.ok,cr?(cr.ok?`${cr.shots.length} shots checked`:cr.problems.slice(0,3).join(' | ').slice(0,300)):'no camera path in the gate report');}}
r=await renderP;
const rendered=r.status===0&&fs.existsSync(path.join(dir,'f00000.jpg'));add('sample render, one frame per second',rendered,rendered?`${times.length} frames`:(r.stderr||r.stdout||'').split('\n').slice(-3).join(' '));

if(rendered){
 r=run('ffmpeg',['-v','error','-framerate','1','-i',path.join(dir,'f%05d.jpg'),'-vf','signalstats,metadata=print:file=-','-f','null','-']);
 const stats=parseSignalStats(r.stdout),res=analyzeFrames(stats,{minFrames:1});
 add('no flat or black frames in the sample',res.ok,res.ok?`${res.frames} frames clean`:[...res.flat.map(x=>`flat ${x.from.toFixed(0)}s`),...res.dark.map(x=>`black ${x.from.toFixed(0)}s`)].join(', '));
 {const W=54,H=96,raw=spawnSync('ffmpeg',['-v','error','-framerate','1','-i',path.join(dir,'f%05d.jpg'),'-vf',`scale=${W}:${H}`,'-pix_fmt','rgb24','-f','rawvideo','-'],{maxBuffer:1<<28}),shares=[];
  const sats=[];if(raw.status===0)for(let o=0;o+W*H*3<=raw.stdout.length;o+=W*H*3){const fr=raw.stdout.subarray(o,o+W*H*3);shares.push(skyShare(fr,W,H));sats.push(frameSat(fr,W,H));}
  if(film.cameraGate===true){const lk=judgeLook(sats);add('colour: saturated like the reference (median saturation, strongly coloured share)',lk.ok,lk.ok?`saturation ${lk.sat}, strong share ${lk.share}`:lk.problems.join(' | ').slice(0,300));}
  const sky=skyRuns(shares,1,{limit:.8,minSeconds:.5});add('no shot that is mostly sky in the sample',sky.length===0,sky.length?sky.map(x=>`${x.from.toFixed(0)}s`).join(', '):`${shares.length} frames checked`);}
 const sw=lumSwing(stats,5),need=film.colorScript==='flat'?0:.2;
 add(`brightness swing between 5 s windows at least ${need} (reference .28)`,!sw||sw.swing>=need,sw?`swing ${sw.swing}`:'film too short to measure');
 if(film.cameraGate===true){const dr=run('python',['studio2/detail-check.py','check',dir,'reference/study/detail-stats.json',path.join(ep,'out/detail.json')]);add('detail: fine surface detail like the reference (Laplacian energy and edge share, at least 75% of the reference median)',dr.status===0,(dr.stdout||dr.stderr||'').trim().split(String.fromCharCode(10)).pop().slice(0,200));}
 r=run('python',['studio2/parity.py','check',dir,'reference/study/metrics.json',path.join(dir,'parity.json'),path.join(dir,'worst.jpg')]);
 let par=null;try{par=JSON.parse(fs.readFileSync(path.join(dir,'parity.json'),'utf8'));}catch{}
 add('parity with the reference (richness of the look)',!!par&&par.ok,par?`${Math.round(par.passShare*1000)/10}% pass, need ${Math.round(par.needShare*1000)/10}%`:'parity.py failed');
}
if(rendered){ // ONE image for the whole film: look at it before the full render (a 40-frame sheet costs about as much as one full-size frame)
 const sheet=path.join(ep,'out/preflight-sheet.jpg');fs.mkdirSync(path.join(ep,'out'),{recursive:true});
 const sr=run('python',['studio2/sheet.py',dir,sheet,'--cols','8','--width','135']);add('review sheet of the whole film, one image',sr.status===0&&fs.existsSync(sheet),sr.status===0?path.relative(ROOT,sheet):'sheet.py failed');
}
let todo=[];try{todo=humanChecklist(JSON.parse(fs.readFileSync(path.join(ROOT,'docs/DEFECTS.json'),'utf8')));}catch{}
if(todo.length){console.log(String.fromCharCode(10)+'LOOK FOR these on the sheet (defects no tool catches yet, from docs/DEFECTS.json):');for(const l of todo)console.log(' - '+l);}
const ok=steps.every(s=>s.ok);fs.mkdirSync(path.join(ep,'out'),{recursive:true});
fs.writeFileSync(path.join(ep,'out',FAST?'preflight-fast.json':'preflight.json'),JSON.stringify({at:new Date().toISOString(),ok,fast:FAST,steps,lookFor:todo},null,1));
console.log(FAST?(ok?'FAST CHECK PASS (collision every 3rd frame, no unit tests): NOT a preflight pass, run the full preflight once before the full render':'FAST CHECK FAIL: fix the lines above'):(ok?'PREFLIGHT PASS: safe to render in full':'PREFLIGHT FAIL: fix the lines above before rendering in full'));
process.exitCode=ok?0:1;
