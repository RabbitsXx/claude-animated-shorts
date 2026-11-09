// Clarity gate of studio2/story-audit.mjs: a film that passes the shape limits must also be understandable.
// Limits come from the reference clip measured in reference/study/DEEP-ANALYSIS.md (one fact, one carrier object, plant -> reveal).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const AUDIT=path.join(ROOT,'studio2','story-audit.mjs');

function base(){
 const beats=[];
 for(let i=0;i<15;i++)beats.push({t0:i*4,t1:i*4+4,kind:i%4===2?'gag':'event',inWorld:true,silent:true,cuts:i%3===0?0:1,event:`thing ${i} happens`,consequence:`result ${i} is visible`});
 return {want:'The hero wants to win the cup this year.',stakes:'If he loses the workshop is sold.',reversal:'The tool backfires and then helps him.',payoff:'The rival fails because of the same flaw.',
  thesis:'Your nerves are slower than your reflexes.',
  carrier:{object:'the big clock board',beats:[1,2,3,5,6,8,9,11,13,15]},
  facts:[{fact:'nerves are slow',beat:9,plant:3,onScreen:'glowing pulse crawls down the rival arm'}],
  beats};
}
function run(story){
 const rel=path.join('studio2','.tmp','clarity-'+process.pid);
 const dir=path.join(ROOT,rel);fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'STORY.json'),JSON.stringify(story));
 const r=spawnSync(process.execPath,[AUDIT,'--episode',rel],{encoding:'utf8'});
 fs.rmSync(dir,{recursive:true,force:true});
 return {code:r.status,out:r.stdout+r.stderr};
}

test('a clear story with thesis, one carrier, one fact planted then revealed passes',()=>{
 const r=run(base());assert.equal(r.code,0,r.out);assert.match(r.out,/STORY PASS/);
});
test('a story without a one-sentence thesis fails',()=>{
 const s=base();delete s.thesis;const r=run(s);assert.equal(r.code,6);assert.match(r.out,/thesis/);
});
test('more than two facts fails (reference teaches one)',()=>{
 const s=base();s.facts=[9,10,11].map(n=>({fact:`fact ${n}`,beat:n,plant:3,onScreen:`a large object shows fact ${n}`}));
 const r=run(s);assert.equal(r.code,6);assert.match(r.out,/facts/);
});
test('a fact that lands on a floating widget fails',()=>{
 const s=base();s.beats[8].kind='explain';s.beats[8].inWorld=false;
 const r=run(s);assert.equal(r.code,6);assert.match(r.out,/floating widget/);
});
test('a fact with no big on-screen carrier fails',()=>{
 const s=base();s.facts[0].onScreen='';const r=run(s);assert.equal(r.code,6);assert.match(r.out,/onScreen/);
});
test('a carrier object seen in too few beats fails',()=>{
 const s=base();s.carrier.beats=[1,9];const r=run(s);assert.equal(r.code,6);assert.match(r.out,/carrier/);
});
test('a story with no carrier object fails',()=>{
 const s=base();delete s.carrier;const r=run(s);assert.equal(r.code,6);assert.match(r.out,/carrier/);
});
test('the main fact revealed too early fails (no curiosity gap)',()=>{
 const s=base();s.facts[0].beat=2;s.facts[0].plant=1;const r=run(s);assert.equal(r.code,6);assert.match(r.out,/reveal/);
});
test('the main fact with no earlier planted consequence fails',()=>{
 const s=base();delete s.facts[0].plant;const r=run(s);assert.equal(r.code,6);assert.match(r.out,/plant/);
});
