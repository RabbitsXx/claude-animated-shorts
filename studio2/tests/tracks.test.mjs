// Written after the first implementation of tracks.js/face.js; all later runtime code is test-first.
import test from 'node:test';
import assert from 'node:assert/strict';
import {key,ramp,bell,anchors,ease,dissolveK,dissolving} from '../runtime/tracks.js';
const words=['It','races','around','the','Sun','.','Go','back','an','hour','Go','back'].map((w,i)=>({word:w,start:i,end:i+.5}));
test('key holds first value before and last value after the track',()=>{
 const k=[[1,10],[2,20]];assert.equal(key(k,0),10);assert.equal(key(k,9),20);
});
test('key hits every keyed value exactly and eases between',()=>{
 const k=[[0,0],[1,10,'lin'],[2,0,'lin']];assert.equal(key(k,1),10);assert.equal(key(k,.5),5);assert.equal(key(k,1.5),5);
});
test('key interpolates vectors per component',()=>{
 assert.deepEqual(key([[0,[0,10]],[1,[10,0],'lin']],.5),[5,5]);
});
test('key rejects an unknown ease name',()=>{assert.throws(()=>key([[0,0],[1,1,'nope']],.5),/unknown ease/);});
test('ramp is clamped to 0..1 and bell returns to zero',()=>{
 assert.equal(ramp(-1,0,1),0);assert.equal(ramp(2,0,1),1);assert.equal(bell(1.5,0,1,2,3),1);assert.equal(bell(.5,0,1,2,3),.5);assert.equal(bell(3.5,0,1,2,3),0);
});
test('anchors finds a phrase and its second occurrence',()=>{
 const T=anchors(words);assert.equal(T('go back'),6);assert.equal(T('go back',2),10);assert.equal(T('the sun'),3);
});
test('anchors throws loudly on a missing phrase',()=>{assert.throws(()=>anchors(words)('lever down'),/No word anchor/);});
test('back ease overshoots then settles',()=>{assert.ok(ease.back(.8)>1);assert.equal(ease.back(1),1);});

test('dissolveK clamps, eases and is monotonic',()=>{
 assert.equal(dissolveK(0,1,.5),0);assert.equal(dissolveK(2,1,.5),1);assert.equal(dissolveK(1.25,1,.5),.5);
 let prev=0;for(let i=0;i<=50;i++){const k=dissolveK(1+i*.01,1,.5);assert.ok(k>=prev);prev=k;}
});

test('a dissolve is in progress from its very first frame (k=0 shows the outgoing shot), not before or after',()=>{
 assert.equal(dissolving(undefined),false);assert.equal(dissolving(0),true,'k=0 is the first frame of the dissolve: the outgoing shot, not the incoming one');
 assert.equal(dissolving(.5),true);assert.equal(dissolving(1),false);
});
