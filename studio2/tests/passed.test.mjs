import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sigFiles,listFiles,passedBefore,markPassed,forget} from '../lib/passed.mjs';

const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'passed-'));
test('a signature changes when a file changes size, is touched, appears or vanishes, and not otherwise',()=>{
 const d=tmp(),a=path.join(d,'a.txt'),b=path.join(d,'b.txt');fs.writeFileSync(a,'one');
 const s0=sigFiles([a,b]);assert.equal(sigFiles([a,b]),s0,'unchanged files give the same signature');
 fs.writeFileSync(b,'x');const s1=sigFiles([a,b]);assert.notEqual(s1,s0,'a new file changes it');
 fs.writeFileSync(a,'one more');assert.notEqual(sigFiles([a,b]),s1,'a changed size changes it');
 const s2=sigFiles([a,b]);const t=new Date(Date.now()+60000);fs.utimesSync(b,t,t);assert.notEqual(sigFiles([a,b]),s2,'a touched file changes it');
 fs.rmSync(b);assert.notEqual(sigFiles([a,b]),s2,'a vanished file changes it');
});
test('a PASS is remembered only for the same key; a different key, or a forgotten check, runs again',()=>{
 const ep=tmp();assert.equal(passedBefore(ep,'flicker check','k1'),null,'nothing recorded yet');
 markPassed(ep,'flicker check','k1','0 flagged');
 assert.equal(passedBefore(ep,'flicker check','k1').detail,'0 flagged');
 assert.equal(passedBefore(ep,'flicker check','k2'),null,'inputs changed');
 assert.equal(passedBefore(ep,'assemble','k1'),null,'another check');
 forget(ep,'flicker check');assert.equal(passedBefore(ep,'flicker check','k1'),null);
});
test('listFiles finds frames by pattern and skips .tmp and node_modules when going deep',()=>{
 const d=tmp();fs.mkdirSync(path.join(d,'sub'));fs.mkdirSync(path.join(d,'.tmp'));fs.writeFileSync(path.join(d,'f00001.jpg'),'');fs.writeFileSync(path.join(d,'sub/x.mjs'),'');fs.writeFileSync(path.join(d,'.tmp/y.mjs'),'');
 assert.deepEqual(listFiles(d,/^f\d{5}\.jpg$/).map(p=>path.basename(p)),['f00001.jpg']);
 assert.deepEqual(listFiles(d,/\.mjs$/,true).map(p=>path.basename(p)),['x.mjs']);
});
