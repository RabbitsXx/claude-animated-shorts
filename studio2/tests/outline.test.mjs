import test from 'node:test';
import assert from 'node:assert/strict';
import {objectOutline} from '../lib/outline.mjs';
import {LOOKS} from '../runtime/look.js';

test('object-space outline offset gives the same world thickness whatever the mesh scale',()=>{
 for(const s of [[1,1,1],[.218,.235,.19],[.5,.5,.5],[2,2,2]]){
  const w=objectOutline(.02,s),mean=(s[0]+s[1]+s[2])/3;assert.ok(Math.abs(w*mean-.02)<1e-9,String(s));
 }
});
test('a zero or negative scale is rejected, not turned into Infinity',()=>{assert.throws(()=>objectOutline(.02,[0,1,1]),/scale/);});
test('ref look outlines are in world metres and thick enough to read as ink at every distance (about 4% of the head width)',()=>{
 const headWidth=.436*LOOKS.ref.headScale,k=LOOKS.ref.outlineWorld/headWidth;
 assert.ok(k>=.035&&k<=.06,`outline is ${(k*100).toFixed(1)}% of the head width`);assert.equal(LOOKS.classic.outlineWorld,0);
});
