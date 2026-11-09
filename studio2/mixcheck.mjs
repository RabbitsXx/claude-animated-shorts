// How far under the voice is the ducked score? Reads scoreVolume and duck from the film's cues.mjs and measures with ffmpeg.
//   node studio2/mixcheck.mjs --episode episodes/<id>
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {judgeMusicDistance,parseIntegrated} from './lib/mixlevels.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/mixcheck.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),words=JSON.parse(fs.readFileSync(path.join(ep,'voice/words.json'),'utf8'));
const norm=s=>s.toLowerCase().replace(/[^a-z0-9']/g,''),T=(q,n=1)=>{const p=q.split(/\s+/).map(norm);let c=0;for(let i=0;i+p.length<=words.length;i++)if(p.every((x,k)=>norm(words[i+k].word)===x)&&++c===n)return words[i].start;throw Error('anchor '+q);};
const mod=await import(pathToFileURL(path.join(ep,'audio/cues.mjs')).href);
const cfg=await mod.default({T,duration:words.at(-1).end+.6,synth:()=>{throw Error('synth needed');},ep,ROOT});
const lufs=(args)=>parseIntegrated(spawnSync('ffmpeg',['-hide_banner','-nostats',...args],{encoding:'utf8'}).stderr);
const voice=lufs(['-i',path.join(ep,'voice/voice.wav'),'-af','ebur128','-f','null','-']);
const duck=cfg.duck||{threshold:.05,ratio:8};
const music=lufs(['-i',cfg.score,'-i',path.join(ep,'voice/voice.wav'),'-filter_complex',`[0:a]volume=${cfg.scoreVolume},aformat=sample_rates=48000:channel_layouts=stereo[m0];[1:a]aformat=sample_rates=48000:channel_layouts=stereo[vs];[m0][vs]sidechaincompress=threshold=${duck.threshold}:ratio=${duck.ratio}:attack=20:release=450,ebur128[m]`,'-map','[m]','-f','null','-']);
if(voice==null||music==null){console.error('could not measure');process.exit(1);}
const j=judgeMusicDistance(voice-music);console.log(`voice ${voice} LUFS, ducked score ${music} LUFS: ${j.message}`);process.exit(j.ok?0:1);
