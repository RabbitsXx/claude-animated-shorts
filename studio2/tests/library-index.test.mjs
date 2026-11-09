// The shared library index and the defects log are only useful if they stay true: every listed file and test must exist,
// every entry must say what it is for, and every defect must say how it is caught (a check, or an honest "none yet").
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const read=(p)=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const exists=(p)=>fs.existsSync(path.join(ROOT,p));

test('library index lists real files, real tests and says when to use each part',()=>{
 const idx=read('studio2/library/INDEX.json');
 assert.ok(Array.isArray(idx.parts)&&idx.parts.length>=6,'at least the six parts proven in square-wheel');
 const names=new Set();
 for(const p of idx.parts){
  assert.ok(p.name&&!names.has(p.name),`unique name: ${p.name}`);names.add(p.name);
  assert.ok(['proven','experimental'].includes(p.status),`${p.name} status`);
  assert.ok(Array.isArray(p.tags)&&p.tags.length>0,`${p.name} tags`);
  assert.ok(p.useWhen&&p.useWhen.length>15,`${p.name} useWhen`);
  assert.ok(Array.isArray(p.files)&&p.files.length>0,`${p.name} files`);
  for(const f of p.files)assert.ok(exists(f),`${p.name}: missing file ${f}`);
  for(const t of p.tests||[])assert.ok(exists(t),`${p.name}: missing test ${t}`);
  if(p.status==='proven')assert.ok((p.tests||[]).length>0||p.provenBy,`${p.name} is proven but names no test or gate`);
  assert.ok(Array.isArray(p.usedIn)&&p.usedIn.length>0,`${p.name} usedIn`);
 }
});

test('defects log: every defect has a symptom, a cause, films it was seen in, and a check or an honest none',()=>{
 const log=read('docs/DEFECTS.json');
 assert.ok(Array.isArray(log.defects)&&log.defects.length>=8);
 const ids=new Set();
 for(const d of log.defects){
  assert.ok(d.id&&!ids.has(d.id),`unique id: ${d.id}`);ids.add(d.id);
  for(const k of ['symptom','cause','rule'])assert.ok(d[k]&&d[k].length>10,`${d.id} ${k}`);
  assert.ok(Array.isArray(d.seenIn)&&d.seenIn.length>0,`${d.id} seenIn`);
  assert.ok(d.check&&['gate','test','review','none'].includes(d.check.kind),`${d.id} check.kind`);
  if(d.check.kind!=='none'&&d.check.path)assert.ok(exists(d.check.path),`${d.id}: missing ${d.check.path}`);
  if(d.check.kind==='none')assert.ok(d.check.why&&d.check.why.length>10,`${d.id} says why there is no check`);
 }
});

test('AGENTS.md sends a new session to the library index and the defects log',()=>{
 const a=fs.readFileSync(path.join(ROOT,'AGENTS.md'),'utf8');
 assert.match(a,/studio2\/library\/INDEX\.json/);assert.match(a,/docs\/DEFECTS\.json/);
});
