// ElevenLabs adapter for studio2. Authorised by the user in chat on 2026-11-07 ("ElevenLabs ครบ"):
// one narration take, one instrumental score, and the missing sound effects. Every request is cached by content
// hash, never retried automatically, and the API key is read from the parent .env and never printed.
// usage: node studio2/eleven.mjs voice|sfx|dry [--episode episodes/time-machine-success]
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),cmd=args[0],ep=path.join(ROOT,args.includes('--episode')?args[args.indexOf('--episode')+1]:'episodes/time-machine-success');
const sha=s=>createHash('sha256').update(s).digest('hex');
function key(){
 const envs=[path.join(ROOT,'.env'),path.join(ROOT,'..','.env')];
 for(const f of envs)if(fs.existsSync(f)){const m=fs.readFileSync(f,'utf8').match(/^\s*(?:evenlabs_api|ELEVENLABS_API_KEY)\s*=\s*(.*?)\s*$/im);if(m)return m[1].replace(/^["']|["']$/g,'');}
 if(process.env.ELEVENLABS_API_KEY)return process.env.ELEVENLABS_API_KEY;
 throw Error('ElevenLabs key not found in .env');
}
const film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8'));
async function request(endpoint,body,cacheFile,json=false){
 fs.mkdirSync(path.dirname(cacheFile),{recursive:true});
 if(fs.existsSync(cacheFile)){console.log('cache hit',path.basename(cacheFile));return json?JSON.parse(fs.readFileSync(cacheFile,'utf8')):fs.readFileSync(cacheFile);}
 console.log('ElevenLabs request:',endpoint);
 const r=await fetch(`https://api.elevenlabs.io/v1/${endpoint}${endpoint.includes('?')?'&':'?'}output_format=mp3_44100_128`,{method:'POST',headers:{'xi-api-key':key(),'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(600000)});
 if(!r.ok)throw Error(`ElevenLabs ${endpoint} -> HTTP ${r.status}: ${(await r.text()).slice(0,300)}`);
 if(json){const j=await r.json();fs.writeFileSync(cacheFile,JSON.stringify(j));return j;}
 const b=Buffer.from(await r.arrayBuffer());fs.writeFileSync(cacheFile,b);return b;
}
const narration=()=>fs.readFileSync(path.join(ep,'SCRIPT.md'),'utf8').split('## Narration')[1].split('## Delivery')[0].split('\n').filter(l=>l.startsWith('>')).map(l=>l.slice(1).trim());
const probe=f=>Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',f],{encoding:'utf8'}));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9']/g,'');
function wordsFrom(al){
 const ch=al.characters,s=al.character_start_times_seconds,e=al.character_end_times_seconds,out=[];let cur='',st=null,en=null;
 for(let i=0;i<ch.length;i++){if(/\s/.test(ch[i])){if(cur){out.push({word:cur,start:st,end:en});cur='';st=null;}continue;}if(st===null)st=s[i];cur+=ch[i];en=e[i];}
 if(cur)out.push({word:cur,start:st,end:en});return out;
}
const EFFECTS=[
 {id:'hammer-clang',seconds:1.5,prompt:'One heavy steel sledge hammer striking a large metal anchor bolt, a sharp ringing clang with a short metallic ring, no voices'},
 {id:'wallet-moth',seconds:2.5,prompt:'A leather wallet opening with a soft creak, then a tiny moth fluttering away with quick delicate wing flutters, comedic, no voices'},
 {id:'power-flash',seconds:4,prompt:'A quirky sci-fi machine humming up in pitch with electric crackle, then a bright magical zap flash and a quick whoosh, cartoon style, no voices'},
 {id:'pop-sparkle',seconds:1.5,prompt:'A short cartoon magic pop with a sparkly shimmer, something appearing suddenly, no voices'},
 {id:'crowd-cheer',seconds:4,prompt:'A large outdoor fair crowd cheering and applauding happily with a few kids squealing, no intelligible words'},
 {id:'crowd-gasp',seconds:3,prompt:'A big crowd collectively gasping, then falling silent with a faint breeze, no intelligible words'},
 {id:'toy-train',seconds:3,prompt:'A small wooden toy train chugging along a rail with a cheerful rhythmic clickety-clack, no voices'},
];
const MUSIC='Original playful comedic cinematic instrumental underscore: quirky pizzicato strings, marimba and woodwinds, light mounting suspense that resolves into a cheeky sneaky finish, steady bouncy tempo around 120 bpm, no vocals';
async function voice(){
 const paras=narration(),text=paras.join(' '),count=text.split(/\s+/).length;
 const body={text,model_id:'eleven_v3',voice_settings:{stability:.5,similarity_boost:.75,speed:1.08}};
 const j=await request(`text-to-speech/${film.voiceId}/with-timestamps`,body,path.join(ep,'voice/cache',sha(JSON.stringify(body)).slice(0,24)+'.json'),true);
 const words=wordsFrom(j.normalized_alignment||j.alignment),script=text.split(/\s+/);
 if(words.length!==script.length||words.some((w,i)=>norm(w.word)!==norm(script[i])))throw Error('Provider alignment differs from the script: '+words.length+' vs '+script.length);
 const raw=path.join(ep,'voice/source.mp3');fs.writeFileSync(raw,Buffer.from(j.audio_base64,'base64'));
 const rawDur=probe(raw),tempo=Math.min(1.18,Math.max(1,rawDur/64));words.forEach(w=>{w.start/=tempo;w.end/=tempo;});
 const out=path.join(ep,'voice/voice.wav');execFileSync('ffmpeg',['-y','-v','error','-i',raw,'-af','atempo='+tempo+',loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000','-ac','1','-c:a','pcm_s16le',out]);
 // timestamps are divided by the same tempo so they stay aligned
 fs.writeFileSync(path.join(ep,'voice/words.json'),JSON.stringify(words,null,1));
 fs.writeFileSync(path.join(ep,'voice/meta.json'),JSON.stringify({provider:'ElevenLabs',voiceId:film.voiceId,model:'eleven_v3',duration:probe(out),tempoCorrection:tempo,wordCount:count,listened:false},null,1));
 console.log('voice ok:',count,'words,',probe(out).toFixed(2),'s');
}
async function sfx(){
 const meta=JSON.parse(fs.readFileSync(path.join(ep,'voice/meta.json'),'utf8')),dur=Math.ceil((meta.duration+1)*30)/30;
 const out=path.join(ep,'audio');fs.mkdirSync(out,{recursive:true});
 for(const e of EFFECTS){const body={text:e.prompt,duration_seconds:e.seconds,prompt_influence:.65,model_id:'eleven_text_to_sound_v2',loop:false};
  const mp3=await request('sound-generation',body,path.join(out,'cache',sha(JSON.stringify(body)).slice(0,24)+'.mp3'));const raw=path.join(out,e.id+'.mp3');fs.writeFileSync(raw,mp3);
  execFileSync('ffmpeg',['-y','-v','error','-i',raw,'-af','loudnorm=I=-20:TP=-2:LRA=11','-ar','48000','-ac','1','-c:a','pcm_s16le',path.join(out,e.id+'.wav')]);}
 const body={prompt:MUSIC,music_length_ms:Math.round(dur*1000),force_instrumental:true,model_id:'music_v1'};
 const mp3=await request('music',body,path.join(out,'cache',sha(JSON.stringify(body)).slice(0,24)+'.mp3'));const raw=path.join(out,'score.mp3');fs.writeFileSync(raw,mp3);
 execFileSync('ffmpeg',['-y','-v','error','-i',raw,'-af','loudnorm=I=-22:TP=-2:LRA=9','-ar','48000','-ac','2','-c:a','pcm_s16le',path.join(out,'score.wav')]);
 console.log('sfx+music ok:',EFFECTS.length,'effects, score',probe(path.join(out,'score.wav')).toFixed(1),'s');
}
if(cmd==='dry'){const t=narration().join(' ');console.log(JSON.stringify({voiceId:film.voiceId,chars:t.length,words:t.split(/\s+/).length,effects:EFFECTS.map(e=>e.id),music:true,apiCalls:0}));}
else if(cmd==='voice')await voice();
else if(cmd==='sfx')await sfx();
else console.log('usage: voice|sfx|dry');
