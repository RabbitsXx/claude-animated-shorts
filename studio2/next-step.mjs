// What is the next step of a film? node studio2/next-step.mjs [--episode episodes/<id>]   (no argument: every film that is not finished)
// Reads the film's own files and prints the first undone step of the owner's order (studio2/lib/ref-contract.mjs STEPS). The session briefing prints it too.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {nextStep,isLegacy} from './lib/ref-contract.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rd=(f,d=null)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return d;}};
const txt=(f)=>{try{return fs.readFileSync(f,'utf8');}catch{return '';}};
export function episodeState(ep){
 const id=path.basename(ep),o=(f)=>path.join(ep,'out',f),film=rd(path.join(ep,'film.json'),{}),models=rd(path.join(ep,'MODELS.json'),{models:[]}).models||[];
 const script=txt(path.join(ep,'SCRIPT.md')),spec=txt(path.join(ep,'SPEC-BEATS.md'));
 const ok=(f)=>!!rd(o(f),{}).ok,fresh=(f,src)=>{try{return fs.statSync(o(f)).mtimeMs>=fs.statSync(src).mtimeMs;}catch{return false;}};
 return {id,film,approvals:rd(path.join(ep,'approvals.json'),{}),narrationLines:(script.split(/\r?\n/).filter(l=>l.startsWith('> ')&&l.length>8)).length,
  spec:{flavour:/flavour/i.test(spec),reuse:/reuse\s*\/\s*new/i.test(spec)},hook:txt(path.join(ep,'HOOK.md')).length>200,storyOk:ok('story-audit.json'),
  models:{total:models.length,passed:models.filter(m=>m.status==='passed').length},collideOk:ok('collide.json'),sceneQualityOk:ok('scene-quality.json'),cameraPlanOk:ok('camera-plan.json'),
  framesImage:fs.existsSync(o('storyboard-frames.jpg')),voiceReal:fs.existsSync(path.join(ep,'voice/source.mp3')),preflightOk:ok('preflight.json'),
  fullRender:fs.existsSync(path.join(ep,'renders/full'))&&fs.readdirSync(path.join(ep,'renders/full')).length>100,finishOk:ok('finish.json'),packageOk:ok('publish/package-check.json')};
}
export function describe(ep){
 const s=episodeState(ep),n=nextStep(s);
 if(!n)return `${s.id}: all steps done`;
 return `${s.id}: NEXT = ${n.title}${n.owner?' [needs the owner]':''}\n  why: ${n.why}\n${n.commands.map(c=>'  run: '+c.replace('<id>',s.id)).join('\n')}`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2),one=a.includes('--episode')?path.join(ROOT,a[a.indexOf('--episode')+1]):null;
 const eps=one?[one]:fs.readdirSync(path.join(ROOT,'episodes')).map(e=>path.join(ROOT,'episodes',e)).filter(e=>!isLegacy(path.basename(e))&&fs.existsSync(path.join(e,'film.json')));
 for(const e of eps)console.log(describe(e));
}
