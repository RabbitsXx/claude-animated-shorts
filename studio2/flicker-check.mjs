// Flicker / z-fight check on the rendered frames (studio2/lib/flicker-stats.mjs). Streams renders/full through ffmpeg at 270x480 gray (area
// scaling, so thin lines do not alias) and looks for AREAS that flip for one frame.
// usage: node studio2/flicker-check.mjs --episode episodes/<id> [--frames renders/full] [--contact] [--from S --to S]
//   --from/--to (seconds): check only that stretch (plus one frame each side) and merge the verdict into the existing out/flicker.json; frames outside keep their earlier result.
// Writes out/flicker.json; exit 3 when an area blip is found. --contact also writes out/flicker-worst.jpg (worst 6 frames with their neighbours).
import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {blipRow,judgeFlicker,LIMITS} from './lib/flicker-stats.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const ep=path.join(ROOT,get('--episode','episodes/pendulum-tower')),dir=path.join(ep,get('--frames','renders/full'));
if(!fs.existsSync(dir)){console.log('FLICKER CHECK FAIL: missing '+path.relative(ROOT,dir));process.exit(3);}
const W=270,H=480,N=W*H,t0=Date.now(),rows=[],win=[];let buf=Buffer.alloc(0),n=0,failed=false;
const partial=a.includes('--from')||a.includes('--to'),s0=partial?Math.max(0,Math.round(Number(get('--from','0'))*30)-1):0,s1=partial?Math.round(Number(get('--to','999'))*30)+1:1e9;n=s0;
const ff=spawn('ffmpeg',['-v','error','-framerate','30','-start_number',String(s0),'-i',path.join(dir,'f%05d.jpg'),'-vf',`scale=${W}:${H}:flags=area`,'-frames:v',String(partial?s1-s0+1:1e9),'-pix_fmt','gray','-f','rawvideo','-'],{stdio:['ignore','pipe','inherit']});
ff.stdout.on('data',d=>{
 buf=buf.length?Buffer.concat([buf,d]):d;
 while(buf.length>=N){const f=Uint8Array.from(buf.subarray(0,N));buf=buf.subarray(N);n++;win.push(f);
  if(win.length===3){const r=blipRow(win[0],win[1],win[2],W,H);if(r.area>0)rows.push({frame:n-2,...r});win.shift();}}
});
ff.on('close',code=>{
 if(code!==0)failed=true;
 if(failed||n-s0<3){console.log('FLICKER CHECK FAIL: ffmpeg could not decode the frames');process.exit(3);}
 let verdict=judgeFlicker(rows);
 const jf=path.join(ep,'out/flicker.json'),prev=partial&&fs.existsSync(jf)?JSON.parse(fs.readFileSync(jf,'utf8')):null;
 if(prev){const keep=(prev.flagged||[]).filter(r=>r.frame<s0+1||r.frame>s1-1);verdict={...verdict,flagged:[...keep,...verdict.flagged],ok:keep.length+verdict.flagged.length===0};}
 fs.mkdirSync(path.join(ep,'out'),{recursive:true});
 fs.writeFileSync(jf,JSON.stringify({frames:partial&&prev?prev.frames:n,partial:partial?{from:s0,to:s1}:undefined,ok:verdict.ok,flagged:verdict.flagged,anyArea:rows.length,limits:LIMITS,at:new Date().toISOString()},null,1));
 console.log(`flicker: ${n} frames, ${rows.length} with a small area blip, ${verdict.flagged.length} flagged (${((Date.now()-t0)/1000).toFixed(0)} s)`);
 for(const p of verdict.problems)console.log('  '+p);
 if(verdict.notes.length)console.log(`  ${verdict.notes.length} short blip(s) not counted (under 4 frames in a row): `+verdict.notes.slice(0,4).join('; '));
 if(a.includes('--contact')&&verdict.flagged.length){
  const worst=[...verdict.flagged].sort((x,y)=>y.area-x.area).slice(0,6),list=path.join(ROOT,'studio2/.tmp/flicker-list.txt');
  fs.mkdirSync(path.dirname(list),{recursive:true});
  fs.writeFileSync(list,worst.flatMap(w=>[w.frame-1,w.frame,w.frame+1].map(f=>`file '${path.join(dir,'f'+String(f).padStart(5,'0')+'.jpg').replace(/\\/g,'/')}'`)).join('\n'));
  spawnSync('ffmpeg',['-y','-v','error','-r','1','-f','concat','-safe','0','-i',list,'-vf','scale=240:-1,tile=3x6','-frames:v','1',path.join(ep,'out/flicker-worst.jpg')]);
  console.log('contact sheet: '+path.relative(ROOT,path.join(ep,'out/flicker-worst.jpg')));
 }
 console.log(verdict.ok?'FLICKER CHECK PASS':'FLICKER CHECK FAIL');
 process.exit(verdict.ok?0:3);
});
