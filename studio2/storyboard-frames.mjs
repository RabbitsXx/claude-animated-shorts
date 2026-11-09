// Renders the storyboard the owner approves: one REAL frame of the built scene per story beat, laid out with narration, camera and action.
//   node studio2/storyboard-frames.mjs --episode episodes/<id>      -> episodes/<id>/out/storyboard-frames.jpg
// Needs scene2/main.mjs and voice/words.json (a placeholder is fine for this step: the scene's beats follow STORY.json, not the voice).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {keyframeTimes,validateStoryboard} from './lib/storyboard.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/storyboard-frames.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),story=JSON.parse(fs.readFileSync(path.join(ep,'STORY.json'),'utf8')),sb=JSON.parse(fs.readFileSync(path.join(ep,'STORYBOARD.json'),'utf8'));
const v=validateStoryboard(sb,story);if(!v.ok){console.error('STORYBOARD.json problems: '+v.problems.join('; '));process.exit(1);}
const words=path.join(ep,'voice/words.json');if(!fs.existsSync(words)){console.error('voice/words.json missing: make a placeholder (see HANDOFF) or the real voice first');process.exit(2);}
const dir=path.join(ROOT,'studio2/.tmp',`storyboard-${path.basename(ep)}`);fs.rmSync(dir,{recursive:true,force:true});
let r=spawnSync('node',['studio2/render.mjs','--scene',`${epRel}/scene2/main.mjs`,'--words',`${epRel}/voice/words.json`,'--times',keyframeTimes(story).join(','),'--out',dir,'--quality','0.9','--timeout','900'],{cwd:ROOT,encoding:'utf8'});
console.log((r.stdout||'').trim().split(String.fromCharCode(10)).pop(),(r.stderr||'').trim().split(String.fromCharCode(10)).slice(-3).join(' '));if(r.status!==0)process.exit(1);
r=spawnSync('python',['studio2/storyboard.py',epRel,'--frames',dir],{cwd:ROOT,encoding:'utf8'});console.log((r.stdout||r.stderr).trim());process.exit(r.status||0);
