// Adds the pauses listed in film.json `voiceGaps` (one per narration paragraph, seconds) to the narration take. Local only: no API call.
// The raw take stays in voice/source.mp3 and voice/words.raw.json, so this can be re-run with different gaps.
// usage: node studio2/voicegaps.mjs --episode episodes/<id>
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {planGaps,paragraphCounts} from './lib/voice-gaps.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/voicegaps.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8'));
if(!film.voiceGaps){console.error('film.json has no voiceGaps');process.exit(2);}
const raw=path.join(ep,'voice/words.raw.json'),cur=path.join(ep,'voice/words.json');
if(!fs.existsSync(raw))fs.copyFileSync(cur,raw);
const words=JSON.parse(fs.readFileSync(raw,'utf8')),counts=paragraphCounts(fs.readFileSync(path.join(ep,'SCRIPT.md'),'utf8'));
const plan=planGaps(words,counts,film.voiceGaps);
const src=path.join(ep,'voice/source.mp3'),out=path.join(ep,'voice/voice.wav');
const tempo=(()=>{try{return JSON.parse(fs.readFileSync(path.join(ep,'voice/meta.json'),'utf8')).tempoCorrection||1;}catch{return 1;}})(); // eleven.mjs speeds the take up and divides the word times by the same tempo: cut the SPED-UP take, not the raw one
const parts=plan.segments.map((s,i)=>`[0:a]atempo=${tempo},atrim=start=${s.from.toFixed(4)}:end=${s.to.toFixed(4)},asetpts=PTS-STARTPTS,apad=pad_dur=${s.gap.toFixed(3)}[s${i}]`);
const filter=parts.join(';')+';'+plan.segments.map((_,i)=>`[s${i}]`).join('')+`concat=n=${plan.segments.length}:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=9[o]`;
execFileSync('ffmpeg',['-y','-v','error','-i',src,'-filter_complex',filter,'-map','[o]','-ar','48000','-ac','1','-c:a','pcm_s16le',out]);
fs.writeFileSync(cur,JSON.stringify(plan.words,null,1));
const dur=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',out],{encoding:'utf8'}));
const meta=JSON.parse(fs.readFileSync(path.join(ep,'voice/meta.json'),'utf8'));
fs.writeFileSync(path.join(ep,'voice/meta.json'),JSON.stringify({...meta,duration:dur,gapSeconds:+film.voiceGaps.reduce((x,y)=>x+y,0).toFixed(2),listened:false},null,1));
console.log(`voice with pauses: ${dur.toFixed(2)} s (raw take ${words.at(-1).end.toFixed(2)} s + ${film.voiceGaps.reduce((x,y)=>x+y,0).toFixed(1)} s of pauses)`);
