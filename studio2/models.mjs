// Per-model gate, one model at a time (rule 2026-11-08: sculpt each model beautifully on its own, pass it, only then assemble the scene).
//   node studio2/models.mjs --episode episodes/<id> --status                      list models and the next one to build
//   node studio2/models.mjs --episode episodes/<id> --sheet <modelId>             render the 4-view model sheet -> out/models/<modelId>.jpg
//   node studio2/models.mjs --episode episodes/<id> --pass <modelId> --by claude --checks "check one|check two|check three"
//   node studio2/models.mjs --episode episodes/<id> --reject <modelId> --by user --reason "why"
// Models live in episodes/<id>/scene2/models/<modelId>.mjs (see studio2/library/modelsheet.mjs for the contract).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateModels,nextModel} from './lib/models.mjs';
import {isLegacy} from './lib/ref-contract.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=k=>a.includes(k)?a[a.indexOf(k)+1]:null;
const epRel=get('--episode');if(!epRel){console.error('usage: node studio2/models.mjs --episode episodes/<id> (--status | --sheet <id> | --pass <id> --by <who> --checks "a|b|c" | --reject <id> --by <who> --reason "...")');process.exit(2);}
const ep=path.join(ROOT,epRel),file=path.join(ep,'MODELS.json'),doc=JSON.parse(fs.readFileSync(file,'utf8')),save=()=>fs.writeFileSync(file,JSON.stringify(doc,null,1));
let fidelity=false;try{fidelity=!!JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')).fidelityGate;}catch{}
let detail=false;try{detail=!!JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')).detailGate;}catch{}
const find=id=>{const m=doc.models.find(x=>x.id===id);if(!m){console.error('unknown model '+id);process.exit(2);}return m;};
if(a.includes('--sheet')){
 const id=get('--sheet'),m=find(id),idx=doc.models.indexOf(m),before=doc.models.slice(0,idx).find(x=>x.status!=='passed');
 if(before){console.error(`BLOCKED: ${before.id} is not passed yet; models are built one by one`);process.exit(1);}
 const mod=path.join(ep,'scene2/models',id+'.mjs');if(!fs.existsSync(mod)){console.error('missing '+path.relative(ROOT,mod));process.exit(2);}
 const outDir=path.join(ep,'out/models');fs.mkdirSync(outDir,{recursive:true});
 const wrap=path.join(ep,'scene2/models',`_sheet-${id}.mjs`);
 fs.writeFileSync(wrap,`import {sheetScene} from '/repo/studio2/library/modelsheet.mjs';\nimport * as model from './${id}.mjs';\nexport const authored=true;\nexport const build=sheetScene(model);\n`);
 const words=path.join(outDir,'words.json');fs.writeFileSync(words,JSON.stringify([{word:'x',start:0,end:4}]));
 const tmp=path.join(ROOT,'studio2/.tmp',`model-${id}`);fs.rmSync(tmp,{recursive:true,force:true});
 let r=spawnSync('node',['studio2/render.mjs','--scene',path.relative(ROOT,wrap),'--words',path.relative(ROOT,words),'--times','0.5,1.5,2.5,3.5','--out',tmp,'--quality','0.9','--timeout','600','--meta-out',path.join(tmp,'meta.json')],{cwd:ROOT,encoding:'utf8'});
 console.log((r.stdout||'').trim().split('\n').pop(),(r.stderr||'').trim().split('\n').slice(-3).join(' '));if(r.status!==0)process.exit(1);
 const out=path.join(outDir,id+'.jpg');
 r=spawnSync('python',['studio2/sheet.py',tmp,out,'--cols','4','--width','300'],{cwd:ROOT,encoding:'utf8'});if(r.status!==0){console.error(r.stderr);process.exit(1);}
 try{const meta=JSON.parse(fs.readFileSync(path.join(tmp,'meta.json'),'utf8')),mm=/meshes (\d+) names (\d+)/.exec((meta[0]||{}).note||'');if(mm){m.meshes=+mm[1];m.names=+mm[2];}}catch{}
 m.sheet=path.relative(ep,out).replace(/\\/g,'/');if(m.status==='planned'||m.status==='building')m.status='built';save();console.log('SHEET',path.relative(ROOT,out));
}else if(a.includes('--pass')){
 const m=find(get('--pass')),by=get('--by'),checks=(get('--checks')||'').split('|').map(s=>s.trim()).filter(Boolean);
 if(!by||checks.length<3){console.error('--pass needs --by <who> and at least 3 checks separated by |');process.exit(2);}
 if(!m.sheet||!fs.existsSync(path.join(ep,m.sheet))){console.error('render the model sheet first (--sheet)');process.exit(2);}
 {const src=fs.existsSync(path.join(ep,'scene2/models',m.id+'.mjs'))?fs.readFileSync(path.join(ep,'scene2/models',m.id+'.mjs'),'utf8'):'';const bl=!isLegacy(path.basename(ep))&&!/glbInstance\(/.test(src)&&!m.detailWaiver&&!m.reusedFrom&&!m.codeWaiver;if(bl){console.error('NOT PASSED: models are sculpted in Blender and exported as GLB (owner order 2026-11-09). Write episodes/<id>/blender/'+m.id+'.py, run node studio2/blender-build.mjs, load the GLB with studio2/library/glb.mjs. An actor rig carries a detailWaiver, a reused model reusedFrom; anything else needs codeWaiver with a quoted OK from the owner.');process.exit(1);}}
 Object.assign(m,{status:'passed',passedBy:by,checks,passedAt:new Date().toISOString()});const v=validateModels(doc,{fidelity,detail});
 if(!v.ok){console.error('NOT PASSED: '+v.problems.join('; '));process.exit(1);}save();console.log('passed',m.id);
}else if(a.includes('--reject')){
 const m=find(get('--reject'));Object.assign(m,{status:'rejected',rejectedBy:get('--by'),reason:get('--reason')});
 for(const x of doc.models.slice(doc.models.indexOf(m)+1))if(x.status==='passed')x.status='built'; // a later model must be re-checked against the reworked one
 save();console.log('rejected',m.id);
}else{
 const v=validateModels(doc,{fidelity,detail});for(const m of doc.models)console.log(`${m.status.padEnd(9)} ${m.id}${m.passedBy?'  (by '+m.passedBy+')':''}${m.meshes?'  ['+m.meshes+' meshes, '+m.names+' names]':''}`);
 const n=nextModel(doc);console.log(v.ok?'MODELS OK':'MODELS PROBLEMS: '+v.problems.join('; '));console.log(n?`next: ${n.id}`:'all models passed: assemble the scene');
}
