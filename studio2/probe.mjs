// Shot probe: look at a few moments of the film in about 15 seconds, before any full check or render.
//   node studio2/probe.mjs --episode episodes/<id> --times 1.0,2.4,3.0 [--no-captions] [--sky]
// Renders exactly those times (captions on, small JPEG), tiles them into studio2/.tmp/view/probe-<id>.jpg (read it with the image viewer), and runs the
// collision pass on the same times: overlaps, shot rows (subject hidden / off-centre / camera inside a solid), grip rows and, for every moment inside an
// INTENTS window, where each thing it must show sits in the frame (sx, sy, share of the frame height, ok or the reason). --sky adds the sky share of each
// frame (the preflight rule: no shot that is more than 80 % sky/blue glass for half a second).
// Why: every camera or pose fix used to wait for a 5-15 minute gate to learn one number; this answers the same question on 3-8 frames.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const epRel=get('--episode',null),times=get('--times',null);
if(!epRel||!times){console.error('usage: node studio2/probe.mjs --episode episodes/<id> --times 1.0,2.4,3.0 [--no-captions] [--sky]');process.exit(2);}
const id=path.basename(epRel),work=path.join(ROOT,'studio2/.tmp/probe-'+id),view=path.join(ROOT,'studio2/.tmp/view');
fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work,{recursive:true});fs.mkdirSync(view,{recursive:true});
const base=['studio2/render.mjs','--scene',`${epRel}/scene2/main.mjs`,'--words',`${epRel}/voice/words.json`,'--times',times,'--timeout','300'];
const run=(args)=>spawnSync('node',args,{cwd:ROOT,encoding:'utf8',maxBuffer:1<<26});
const n=times.split(',').length,shot=path.join(work,'frames');
const r1=run([...base,...(a.includes('--no-captions')?[]:['--captions']),'--out',shot,'--quality','0.8']);
if(!fs.existsSync(path.join(shot,'f00000.jpg'))){console.error('render failed:\n'+(r1.stderr||r1.stdout||'').split('\n').slice(-8).join('\n'));process.exit(1);}
const sheet=path.join(view,`probe-${id}.jpg`);
spawnSync('ffmpeg',['-y','-v','error','-framerate','1','-i',path.join(shot,'f%05d.jpg'),'-vf',`scale=${n>6?200:300}:-1,tile=${Math.min(n,8)}x${Math.ceil(n/8)}`,'-frames:v','1',sheet]);
console.log('contact sheet: '+path.relative(ROOT,sheet)+'  (times '+times+')');
const rep=path.join(work,'c.json'),r2=run([...base,'--out',path.join(work,'c'),'--collide-only','--collide-out',rep]);
for(const l of (r2.stdout||'').split('\n'))if(/^(OVERLAP|COLLIDE)/.test(l))console.log(l.slice(0,200));
if(fs.existsSync(rep)){const d=JSON.parse(fs.readFileSync(rep,'utf8'));
 for(const r of d.intent||[])console.log(r.t,r.id,r.rows.map(x=>`${x.name}[sx ${x.sx} sy ${x.sy} size ${x.frac} ${x.ok?'ok':x.why}]`).join(' '));}
if(a.includes('--sky')){
 const {skyShare}=await import('./lib/framecheck.mjs'),W=54,H=96;
 const raw=spawnSync('ffmpeg',['-v','error','-framerate','1','-i',path.join(shot,'f%05d.jpg'),'-vf',`scale=${W}:${H}`,'-pix_fmt','rgb24','-f','rawvideo','-'],{maxBuffer:1<<26});
 const out=[];for(let o=0,k=0;o+W*H*3<=raw.stdout.length;o+=W*H*3,k++)out.push(`${times.split(',')[k]}s:${skyShare(raw.stdout.subarray(o,o+W*H*3),W,H).toFixed(2)}`);
 console.log('sky share per frame (limit 0.8): '+out.join('  '));
}
