// Prints the session briefing: node studio2/briefing.mjs  (also run by the SessionStart hook in .claude/settings.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildBriefing} from './lib/briefing.mjs';
import {episodesByChannel} from './lib/channels.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rd=(f,d)=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'));}catch{return d;}};
const eps=fs.existsSync(path.join(ROOT,'episodes'))?fs.readdirSync(path.join(ROOT,'episodes')).filter(e=>fs.existsSync(path.join(ROOT,'episodes',e,'HANDOFF.md'))):[];
const newest=eps.map(e=>({e,t:fs.statSync(path.join(ROOT,'episodes',e,'HANDOFF.md')).mtimeMs})).sort((a,b)=>b.t-a.t)[0];
let state='';if(newest){const t=fs.readFileSync(path.join(ROOT,'episodes',newest.e,'HANDOFF.md'),'utf8').split('\n').filter(l=>l.startsWith('- ')).slice(-1)[0]||'';state=t.replace(/^- /,'').replace(/[`*]/g,'').slice(0,220);}
console.log(buildBriefing({active:newest&&newest.e,handoffState:state,parts:rd('studio2/library/INDEX.json',{parts:[]}).parts,defects:rd('docs/DEFECTS.json',{defects:[]}).defects,channels:(()=>{try{return episodesByChannel(ROOT);}catch{return null;}})()}));
// Next step of every unfinished non-legacy film (owner order, studio2/lib/ref-contract.mjs): a new session needs no instruction to know what comes next.
{const {describe}=await import('./next-step.mjs'),{isLegacy}=await import('./lib/ref-contract.mjs');
 for(const e of eps.filter(e=>!isLegacy(e)&&fs.existsSync(path.join(ROOT,'episodes',e,'film.json'))))console.log('NEXT STEP  '+describe(path.join(ROOT,'episodes',e)));}
