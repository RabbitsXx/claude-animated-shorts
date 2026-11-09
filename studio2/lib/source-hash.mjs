// Hash of everything that decides what the film looks like: the episode scene code, the voice timing and the runtime.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const walk=(d,out=[])=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else out.push(p);}return out;};
export function sourceHash(root,ep){
 const files=[...walk(path.join(ep,'scene2')),path.join(ep,'voice/words.json'),...walk(path.join(root,'studio2/runtime'))].filter(f=>fs.existsSync(f)).sort();
 const h=createHash('sha256');for(const f of files){h.update(path.relative(root,f).split(path.sep).join('/'));h.update(fs.readFileSync(f));}
 return h.digest('hex');
}
