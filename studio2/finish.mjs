// One command for the end of a film: unit tests -> collision gate -> assemble -> frame check -> retro, then package notes.
//   node studio2/finish.mjs --episode episodes/<id>
// Stops at the first failing step (except retro), prints PASS/FAIL per step, writes out/finish.json. Never publishes anything.
// Run studio2/preflight.mjs BEFORE the full render; run this AFTER it (the full render must exist in renders/full).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {FINISH_STEPS,summarize,packageNotes} from './lib/finish.mjs';
import {sigFiles,listFiles,passedBefore,markPassed} from './lib/passed.mjs';
import {sourceHash} from './lib/source-hash.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/finish.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),run=(args)=>spawnSync('node',args,{cwd:ROOT,encoding:'utf8',maxBuffer:1<<28});
const tests=fs.readdirSync(path.join(ROOT,'studio2/tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>path.join('studio2/tests',f));
const last=(t)=>(t||'').trim().split('\n').filter(Boolean).slice(-1)[0]||'';
const doers={
 'unit tests':()=>{const r=run(['--test',...tests]);return {ok:r.status===0,detail:`${(r.stdout.match(/ℹ pass (\d+)/)||[])[1]} pass, ${(r.stdout.match(/ℹ fail (\d+)/)||[])[1]} fail`};},
 'collision gate':()=>{const r=run(['studio2/collide.mjs','--episode',epRel,'--workers','4']);return {ok:r.status===0,detail:(r.stdout.match(/COLLIDE (PASS|FAIL)[^\n]*/)||[last(r.stdout)])[0]};},
 'intent check':()=>{const r=spawnSync('python',['studio2/intent-sheet.py','--episode',epRel],{cwd:ROOT,encoding:'utf-8'});return {ok:r.status===0,detail:((r.stdout||'').match(/INTENT CHECK[^\n]*/)||[last(r.stdout||r.stderr)])[0].slice(0,220)};},
 'flicker check':()=>{const r=run(['studio2/flicker-check.mjs','--episode',epRel]);return {ok:r.status===0,detail:(r.stdout.match(/flicker: [^\n]*/)||[last(r.stdout)])[0].slice(0,200)};},
 'assemble':()=>{const r=run(['studio2/assemble.mjs','--episode',epRel]);return {ok:r.status===0&&fs.existsSync(path.join(ep,'out/final.mp4')),detail:r.status===0?'out/final.mp4':last(r.stderr||r.stdout)};},
 'frame check':()=>{const r=run(['studio2/framecheck.mjs','--episode',epRel]);return {ok:r.status===0,detail:(r.stdout.match(/framecheck [^\n]*/)||[last(r.stdout)])[0].slice(0,200)};},
 'motion check':()=>{let gated=false;try{gated=!!JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')).motionGate;}catch{}const r=run(['studio2/motion-check.mjs','--episode',epRel]);const d=(r.stdout.match(/motion: [^\n]*/)||[last(r.stdout)])[0].slice(0,220);return gated?{ok:r.status===0,detail:d+(r.status===0?'':' (see out/motion.json)')}:{ok:true,detail:'reported only, film.json has no motionGate: '+d};},
 'retro':()=>{const r=run(['studio2/retro.mjs','--episode',epRel]);return {ok:r.status===0,detail:r.status===0?'RETRO.md written':last(r.stderr||r.stdout)};},
};
// A step whose inputs are exactly the ones of its last PASS is not run again (studio2/lib/passed.mjs). The retro is never skipped.
const frames=sigFiles(listFiles(path.join(ep,'renders/full'),/^f\d{5}\.jpg$/)),finalSig=sigFiles([path.join(ep,'out/final.mp4')]);
const collideOk=()=>{try{const c=JSON.parse(fs.readFileSync(path.join(ep,'out/collide.json'),'utf8'));return c.ok&&c.sourceHash===sourceHash(ROOT,ep)&&c.step<=1/30+1e-6&&c.checkedFrames>0?c.checkedAt:null;}catch{return null;}};
const keyOf={
 'unit tests':()=>sigFiles(listFiles(path.join(ROOT,'studio2'),/\.(mjs|js|py|json)$/,true)),
 'collision gate':()=>{const c=collideOk();return c?'current:'+c:null;},
 'intent check':()=>{const c=collideOk();return c?c+'|'+frames:null;},
 'flicker check':()=>frames,
 'assemble':()=>frames+'|'+sigFiles([path.join(ep,'audio/mix.wav'),path.join(ep,'voice/words.json')])+'|'+(fs.existsSync(path.join(ep,'out/final.mp4'))?'has':'none'),
 'frame check':()=>finalSig,
 'motion check':()=>finalSig,
};
const results=[];
for(const s of FINISH_STEPS){
 const key=keyOf[s.name]?keyOf[s.name]():null,prev=key?passedBefore(ep,s.name,key):null;
 const r=prev?{name:s.name,ok:true,detail:'not run again: nothing changed since it passed ('+prev.detail+')',skipped:true}:{name:s.name,...doers[s.name]()};
 if(!prev&&r.ok&&key)markPassed(ep,s.name,s.name==='assemble'?keyOf.assemble():key,r.detail);
 results.push(r);console.log(`${r.ok?'PASS':'FAIL'}  ${r.name}${r.detail?'  - '+r.detail:''}`);if(!r.ok&&s.stopOnFail)break;}
const pub=path.join(ep,'out/publish'),files=fs.existsSync(pub)?fs.readdirSync(pub):[],fin=path.join(pub,'final.mp4'),sum=summarize(results);
const notes=packageNotes({finalBytes:fs.existsSync(fin)?fs.statSync(fin).size:0,files});
for(const n of notes)console.log('NOTE  '+n);
fs.mkdirSync(path.join(ep,'out'),{recursive:true});fs.writeFileSync(path.join(ep,'out/finish.json'),JSON.stringify({results,notes,ok:sum.ok},null,1));
console.log(sum.ok?'FINISH OK (nothing published; a person must still watch and listen)':'FINISH NOT OK');process.exit(sum.ok?0:1);
