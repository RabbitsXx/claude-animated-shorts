// Mix narration + ducked score + word-anchored effects + ambience into one 48 kHz stereo wav, then master to about -14 LUFS.
// usage: node studio2/mix.mjs --episode episodes/time-machine-success
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {makeSynth} from './lib/synth.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),ep=path.join(ROOT,args.includes('--episode')?args[args.indexOf('--episode')+1]:'episodes/time-machine-success');
const words=JSON.parse(fs.readFileSync(path.join(ep,'voice/words.json'),'utf8')),meta=JSON.parse(fs.readFileSync(path.join(ep,'voice/meta.json'),'utf8'));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9']/g,'');
const T=(q,n=1)=>{const p=q.split(/\s+/).map(norm);let c=0;for(let i=0;i+p.length<=words.length;i++)if(p.every((x,k)=>norm(words[i+k].word)===x)&&++c===n)return words[i].start;throw Error('anchor '+q);};
const A=f=>path.join(ep,'audio',f);
const filmJson=fs.existsSync(path.join(ep,'film.json'))?JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')):{};
const duration=filmJson.mixSeconds?Math.ceil(filmJson.mixSeconds*30)/30:Math.ceil((words.at(-1).end+.6)*30)/30; // film.json mixSeconds: a film whose last beat is silent is longer than its last word
const SFX=f=>path.join(ROOT,'assets/sfx',f+'.wav');
const lib={whoosh:SFX('whoosh'),chime:SFX('chime'),ambience:SFX('ambience'),lever:SFX('lever'),bolt:SFX('bolt'),block:SFX('block')};
// [file, time, volume, optional trim seconds]
const tHit=.66-.02;
const legacyCues=()=>[
 [A('hammer-clang.wav'),tHit,.9],
 [lib.whoosh,1.2,.35],
 [A('wallet-moth.wav'),T('It')+.1,.55],
 [lib.lever,T('hummed')-.55,.6],
 [A('power-flash.wav'),T('hummed')-.35,.8],
 [A('pop-sparkle.wav'),T('flashed')+.0,.55],
 [lib.whoosh,T('His')-.2,.3],
 [A('toy-train.wav'),T('stepping')-.9,.35],
 [A('pop-sparkle.wav'),T('going')+.05,.4],
 [A('pop-sparkle.wav'),T('landing')+.0,.35],
 [lib.bolt,T('bolted')-.05,.7],
 [lib.bolt,T('bolted')+.35,.45],
 [A('pop-sparkle.wav'),T('arrived'),.65],
 [A('crowd-cheer.wav'),T('Opening')-.2,.7],
 [lib.lever,T('Lever'),.7],
 [A('power-flash.wav'),T('Flash')-.45,.7],
 [A('crowd-gasp.wav'),T('Flash')+.15,.7],
 [lib.chime,T('tiny')+.1,.35],
 [lib.bolt,T('tightened')+.15,.65],
 [lib.chime,T('tightened')+.7,.55],
];
// An episode may carry its own sound design: episodes/<id>/audio/cues.mjs exports default async ({T,A,lib,duration,synth})
// returning {cues:[[file,time,volume],...], score?, ambience?}. Without it the original time-machine cue list is used.
let cues,scoreFile=A('score.wav'),ambFile=lib.ambience,scoreVolume=.55,ambVolume=.16,duck={threshold:.03,ratio:8};
const cuesFile=path.join(ep,'audio/cues.mjs');
if(fs.existsSync(cuesFile)){const mod=await import(pathToFileURL(cuesFile).href);const r=await mod.default({T,A,lib,duration,ep,ROOT,synth:makeSynth(path.join(ep,'audio/synth'))});cues=r.cues;if(r.score)scoreFile=r.score;if(r.ambience)ambFile=r.ambience;if(r.scoreVolume!=null)scoreVolume=r.scoreVolume;if(r.ambVolume!=null)ambVolume=r.ambVolume;if(r.duck)duck={...duck,...r.duck};}
else cues=legacyCues();
const inputs=[meta&&path.join(ep,'voice/voice.wav'),scoreFile,ambFile,...cues.map(c=>c[0])];
const f=[];
f.push(`[0:a]aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur=${duration}[v]`);
f.push(`[v]asplit=2[vm][vs]`);
f.push(`[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${scoreVolume},atrim=0:${duration},apad=whole_dur=${duration}[m0]`);
f.push(`[m0][vs]sidechaincompress=threshold=${duck.threshold}:ratio=${duck.ratio}:attack=20:release=450[m]`);
f.push(`[2:a]aformat=sample_rates=48000:channel_layouts=stereo,aloop=loop=-1:size=2e9,atrim=0:${duration},volume=${ambVolume},afade=t=in:d=1.2[amb]`);
cues.forEach((c,i)=>{const d=Math.max(0,Math.round(c[1]*1000));f.push(`[${i+3}:a]aformat=sample_rates=48000:channel_layouts=stereo${c[3]?`,atrim=0:${c[3]},afade=t=out:st=${Math.max(0,c[3]-0.15).toFixed(3)}:d=0.15`:''},volume=${c[2]},adelay=${d}|${d}[s${i}]`);});
const sfx=cues.map((_,i)=>`[s${i}]`).join('');
f.push(`${sfx}amix=inputs=${cues.length}:normalize=0:dropout_transition=0[fx]`);
f.push(`[vm][m][amb][fx]amix=inputs=4:normalize=0:dropout_transition=0,atrim=0:${duration},alimiter=limit=.97[mix]`);
const out=path.join(ep,'audio/mix-raw.wav'),final=path.join(ep,'audio/mix.wav');
execFileSync('ffmpeg',['-y','-v','error',...inputs.flatMap(i=>['-i',i]),'-filter_complex',f.join(';'),'-map','[mix]','-ar','48000','-ac','2','-c:a','pcm_s16le',out],{stdio:'inherit'});
execFileSync('ffmpeg',['-y','-v','error','-i',out,'-af','loudnorm=I=-14:TP=-1.5:LRA=7','-ar','48000','-ac','2','-c:a','pcm_s16le',final],{stdio:'inherit'});
const m=execFileSync('ffmpeg',['-i',final,'-af','loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json','-f','null','-'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
console.log('mix ok, duration',duration,'cues',cues.length);
