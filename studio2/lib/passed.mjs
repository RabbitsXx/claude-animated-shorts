// "Already passed, nothing changed": a check is skipped only when the exact inputs it looked at are byte-for-byte the ones of its last PASS.
// Signatures use name + size + modified time of the files (fast, no reading), stored per episode in out/passed.json. A changed input, a missing
// record or a different key always means the check runs; nothing here lowers a gate.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function sigFiles(files){
 const h=createHash('sha256');
 for(const f of [...files].sort()){let s=null;try{s=fs.statSync(f);}catch{}h.update(f.split(path.sep).join('/')+'|'+(s?s.size+'|'+Math.round(s.mtimeMs):'missing')+';');}
 return h.digest('hex').slice(0,24);
}
export function listFiles(dir,re,deep=false,out=[]){
 if(!fs.existsSync(dir))return out;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){if(deep&&e.name!=='.tmp'&&e.name!=='node_modules')listFiles(p,re,deep,out);}
  else if(re.test(e.name))out.push(p);
 }
 return out;
}
const file=(ep)=>path.join(ep,'out/passed.json');
const load=(ep)=>{try{return JSON.parse(fs.readFileSync(file(ep),'utf8'));}catch{return {};}};
export function passedBefore(ep,name,key){const r=load(ep)[name];return r&&r.key===key?r:null;}
export function markPassed(ep,name,key,detail){
 const all=load(ep);all[name]={key,detail:String(detail||'').slice(0,200),at:new Date().toISOString()};
 fs.mkdirSync(path.join(ep,'out'),{recursive:true});fs.writeFileSync(file(ep),JSON.stringify(all,null,1));
}
export function forget(ep,name){const all=load(ep);delete all[name];fs.writeFileSync(file(ep),JSON.stringify(all,null,1));}
