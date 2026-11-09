// Assemble frames + mix into out/final.mp4 and run technical QA (decode, black/freeze, loudness, sync length).
// usage: node studio2/assemble.mjs --episode episodes/time-machine-success [--frames renders/full]
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const ep=path.join(ROOT,get('--episode','episodes/time-machine-success')),frames=path.join(ep,get('--frames','renders/full')),out=path.join(ep,'out');
fs.mkdirSync(out,{recursive:true});
// Gate: the film may only be assembled after `node studio2/collide.mjs` passed on the CURRENT scene code (no model overlaps).
import {sourceHash} from './lib/source-hash.mjs';
if(!a.includes('--skip-collide')){
 const rep=path.join(out,'collide.json');
 if(!fs.existsSync(rep)){console.error('REFUSED: no collision report. Run: node studio2/collide.mjs --episode '+path.relative(ROOT,ep));process.exit(4);}
 const c=JSON.parse(fs.readFileSync(rep,'utf8')),now=sourceHash(ROOT,ep);
 if(!c.ok){console.error('REFUSED: the collision report lists '+c.overlaps.length+' overlap(s). Fix them and rerun node studio2/collide.mjs.');process.exit(4);}
 if(c.sourceHash!==now){console.error('REFUSED: the collision report is for older scene code. Rerun node studio2/collide.mjs.');process.exit(4);}
 if(!(c.step<=1/30+1e-6)){console.error('REFUSED: the collision report was not made at every frame (step '+c.step+'). Rerun node studio2/collide.mjs (default is every frame).');process.exit(4);}
}

const count=fs.readdirSync(frames).filter(f=>/^f\d{5}\.jpg$/.test(f)).length;
if(!count)throw Error('no frames in '+frames);
const final=path.join(out,'final.mp4'),dur=count/30;
execFileSync('ffmpeg',['-y','-v','error','-framerate','30','-i',path.join(frames,'f%05d.jpg'),'-i',path.join(ep,'audio/mix.wav'),'-map','0:v','-map','1:a','-t',String(dur),'-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',final],{stdio:'inherit'});
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',final],{encoding:'utf8'}));
const v=probe.streams.find(s=>s.codec_type==='video'),au=probe.streams.find(s=>s.codec_type==='audio');
const run=(args)=>spawnSync('ffmpeg',['-hide_banner','-nostats',...args],{encoding:'utf8'}).stderr;
const dec=run(['-v','error','-i',final,'-f','null','-']);
const black=(run(['-i',final,'-vf','blackdetect=d=0.15:pix_th=0.12','-an','-f','null','-']).match(/black_start/g)||[]).length;
const freeze=run(['-i',final,'-vf','freezedetect=n=-60dB:d=1.2','-an','-f','null','-']).match(/freeze_start: [\d.]+/g)||[];
const loud=run(['-i',final,'-af','ebur128=peak=true','-vn','-f','null','-']);
const I=[...loud.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop()?.[1],TP=[...loud.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop()?.[1];
const report={frames:count,seconds:+dur.toFixed(2),width:v.width,height:v.height,fps:v.r_frame_rate,videoCodec:v.codec_name,audioCodec:au?.codec_name,sampleRate:au?.sample_rate,formatDuration:+Number(probe.format.duration).toFixed(2),
 decodeErrors:dec.trim()||'none',blackSegments:black,freezeSegments:freeze,integratedLUFS:I,truePeakDBFS:TP,limits:['Agent has not listened to the audio or watched the film continuously; loudness and decode are measured only.']};
fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(report,null,1));console.log(JSON.stringify(report,null,1));
