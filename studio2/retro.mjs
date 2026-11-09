// End-of-film retro: node studio2/retro.mjs --episode episodes/<id>   (writes episodes/<id>/RETRO.md, prints it)
// Reads out/collide.json, out/gate-history.jsonl, out/story-audit.json, out/qa.json, renders/render-history.jsonl and lists scene files that
// are not in studio2/library/INDEX.json yet (promotion candidates). The AI then logs defects and promotes parts (docs/LESSONS.md section F).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {summarizeHistory,renderRetro,reachableFiles} from './lib/retro.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/retro.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),readJson=(f)=>fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null;
const lines=(f)=>fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const index=readJson(path.join(ROOT,'studio2/library/INDEX.json'));
const promoted=new Set((index?index.parts:[]).flatMap(p=>p.files.map(f=>path.basename(f))));
const scene=path.join(ep,'scene2'),all=fs.existsSync(scene)?fs.readdirSync(scene).filter(f=>/\.mjs$/.test(f)&&!/^cover|looktest/.test(f)):[];
const used=reachableFiles((f)=>{const p=path.join(scene,f);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):undefined;},'main.mjs');
const size=(f)=>fs.statSync(path.join(scene,f)).size;
const candidates=all.filter(f=>used.has(f)&&!promoted.has(f)).map(f=>`${epRel}/scene2/${f} (${size(f)} bytes)`);
const dead=all.filter(f=>!used.has(f)).map(f=>`${epRel}/scene2/${f} (${size(f)} bytes)`);
const md=renderRetro({episode:path.basename(ep),gate:readJson(path.join(ep,'out/collide.json')),gateSummary:summarizeHistory(lines(path.join(ep,'out/gate-history.jsonl'))),
 renderRuns:lines(path.join(ep,'renders/render-history.jsonl')).length||null,story:readJson(path.join(ep,'out/story-audit.json')),qa:readJson(path.join(ep,'out/qa.json')),candidates,dead});
fs.writeFileSync(path.join(ep,'RETRO.md'),md);console.log(md);
