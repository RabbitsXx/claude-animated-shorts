// Frame QA of a rendered video: node studio2/framecheck.mjs --episode episodes/<id> [--input out/final.mp4]
// Finds flat or black frames (the camera is inside something), hard brightness jumps (review them) and prints the 5-second brightness
// swing. Writes out/framecheck.json; exit code 4 when flat or black frames exist. Analysis lives in studio2/lib/framecheck.mjs (tested).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseSignalStats,analyzeFrames,lumSwing,skyShare,skyRuns} from './lib/framecheck.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const epRel=get('--episode',null);if(!epRel){console.error('usage: node studio2/framecheck.mjs --episode episodes/<id> [--input file]');process.exit(2);}
const ep=path.join(ROOT,epRel),input=path.resolve(ROOT,get('--input',path.join(epRel,'out/final.mp4')));
const r=spawnSync('ffmpeg',['-v','error','-i',input,'-an','-vf','signalstats,metadata=print:file=-','-f','null','-'],{encoding:'utf8',maxBuffer:1<<28});
if(r.status!==0){console.error(r.stderr);process.exit(1);}
const stats=parseSignalStats(r.stdout),res=analyzeFrames(stats),sw=lumSwing(stats,5);
// sky-dominated shots: tiny raw frames, blue share per frame
const W=54,H=96,raw=spawnSync('ffmpeg',['-v','error','-i',input,'-an','-vf',`scale=${W}:${H}`,'-pix_fmt','rgb24','-f','rawvideo','-'],{maxBuffer:1<<29});
const shares=[];if(raw.status===0)for(let o=0;o+W*H*3<=raw.stdout.length;o+=W*H*3)shares.push(skyShare(raw.stdout.subarray(o,o+W*H*3),W,H));
const sky=skyRuns(shares,30,{limit:.8,minSeconds:.4});res.ok=res.ok&&sky.length===0;
const out={input:path.relative(ROOT,input),checkedAt:new Date().toISOString(),frames:res.frames,ok:res.ok,flat:res.flat,dark:res.dark,sky,flashes:res.flashes,hardJumps:res.jumps,lumSwing:sw};
fs.mkdirSync(path.join(ep,'out'),{recursive:true});fs.writeFileSync(path.join(ep,'out/framecheck.json'),JSON.stringify(out,null,1));
console.log(`framecheck ${out.input}: ${res.frames} frames, flat ranges ${res.flat.length}, black ranges ${res.dark.length}, sky-only ranges ${sky.length}, one-frame flashes ${res.flashes.length}, hard jumps ${res.jumps.length}, brightness swing ${sw?sw.swing:'n/a'}`);
for(const x of res.flat)console.log('FLAT',x.from.toFixed(2),'-',x.to.toFixed(2),'s',x.frames,'frames');
for(const x of sky)console.log('SKY-ONLY',x.from.toFixed(2),'-',x.to.toFixed(2),'s',x.frames,'frames (camera aimed at the sky?)');
for(const x of res.dark)console.log('BLACK',x.from.toFixed(2),'-',x.to.toFixed(2),'s',x.frames,'frames');
for(const x of res.flashes)console.log('FLASH one frame at',x.at.toFixed(2),'s (a wrong frame between two good ones)');
for(const x of res.jumps.slice(0,12))console.log('JUMP at',x.t.toFixed(2),'s',x.delta>0?'+':'',x.delta);
if(!res.ok)process.exitCode=4;
