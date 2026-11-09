// The fun gate (studio2/lib/story-fun.mjs): a story that is a list of low-stakes gags must fail; a story with pressure, an early rival, a planted twist and rule-based gags must pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFun} from '../lib/story-fun.mjs';

function good(){
 const kinds=['event','event','gag','gag','gag','event','event','event','reveal','reaction','event','gag','event','event','event'];
 const pressure=[3,3,2,2,3,3,4,3,5,5,4,3,2,2,3];
 return {retell:'A late worker stops time, wastes it, and the dark almost ruins him.',antagonist:{who:'the smirking rival',firstBeat:2},wantResolvedAt:12,
  twist:{plantBeat:6,payoffBeat:15},endingTone:'twist',weakestBeat:{beat:8,fix:'he relaxes so the black-out lands on a calm beat'},
  beats:kinds.map((k,i)=>({t0:i*4,t1:i*4+4,kind:k,funny:'a frozen thing is rock solid and hurts',pressure:pressure[i],...(k==='gag'?{fromRule:true}:{})}))};
}
test('a story with pressure, an early rival, a plant and a payoff passes',()=>{assert.deepEqual(auditFun(good()),[]);});
test('the want resolved at the middle, a late rival and a sad ending all fail',()=>{
 const s=good();s.wantResolvedAt=6;s.antagonist.firstBeat=8;s.endingTone='sad';
 const f=auditFun(s).join(' | ');assert.match(f,/resolved at beat 6/);assert.match(f,/antagonist must be on screen/);assert.match(f,/sad ending/);
});
test('a flat list of pranks fails: no pressure steps, same pressure for many beats, generic gags',()=>{
 const s=good();s.beats.forEach(b=>{b.pressure=2;if(b.kind==='gag')b.fromRule=false;});
 const f=auditFun(s).join(' | ');assert.match(f,/only rises 0/);assert.match(f,/in a row/);assert.match(f,/never reaches pressure 4/);assert.match(f,/70% of the gags/);
});
test('a beat without a funny line, a missing retell and a twist that pays off too early all fail',()=>{
 const s=good();s.beats[4].funny='';delete s.retell;s.twist={plantBeat:6,payoffBeat:8};
 const f=auditFun(s).join(' | ');assert.match(f,/beat 5 has no "funny"/);assert.match(f,/"retell" is missing/);assert.match(f,/last two beats/);
});
test('the peak must fall between 55% and 90% of the film and the red-team record is required',()=>{
 const s=good();s.beats.forEach((b,i)=>{b.pressure=i===2?5:Math.min(b.pressure,3);});delete s.weakestBeat;
 const f=auditFun(s).join(' | ');assert.match(f,/peak pressure first appears at beat 3/);assert.match(f,/weakestBeat/);
});
