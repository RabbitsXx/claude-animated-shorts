import test from 'node:test';
import assert from 'node:assert/strict';
import {LOOKS,resolveLook,DEFAULT_LOOK} from '../runtime/look.js';

test('both looks define the same settings',()=>{
 assert.deepEqual(Object.keys(LOOKS.ref).sort(),Object.keys(LOOKS.classic).sort());
});
test('ref look is flat, unlit, with a thicker outline and thicker arms than the classic look',()=>{
 const r=LOOKS.ref,c=LOOKS.classic;
 assert.equal(r.flat,true);assert.equal(c.flat,false);
 assert.ok(r.outline>c.outline,'outline');assert.ok(r.armRadius>c.armRadius,'arms');
 assert.ok(r.handRadius>c.handRadius,'hands');assert.ok(r.legRadius<r.armRadius,'legs are the thinner sticks');
});
test('ref face ink is heavier than classic',()=>{assert.ok(LOOKS.ref.faceInk>LOOKS.classic.faceInk);assert.equal(LOOKS.ref.darkEyes,true);});
test('default look is the ref look; unknown names throw; a spec can override',()=>{
 assert.equal(DEFAULT_LOOK,'ref');
 assert.equal(resolveLook(undefined),LOOKS.ref);assert.equal(resolveLook('classic'),LOOKS.classic);
 assert.throws(()=>resolveLook('nope'),/Unknown character look/);
});
test('ref look has no shoulder pads or sleeve puffs; classic keeps them',()=>{assert.equal(LOOKS.ref.shoulders,false);assert.equal(LOOKS.classic.shoulders,true);});
test('ref look: big heavy-lidded eyes, no ears, a real waist of trousers (model-sheet review of the first hero)',()=>{
 assert.ok(LOOKS.ref.eyeScale>=1.2);assert.equal(LOOKS.classic.eyeScale,1);
 assert.equal(LOOKS.ref.ears,false);assert.equal(LOOKS.classic.ears,true);
 assert.ok(LOOKS.ref.trousers>1);assert.equal(LOOKS.classic.trousers,1);
});
test('ref look: flat 2.5D hair and one continuous body (shirt and trousers are not separate parts); classic keeps 3D parts',()=>{
 assert.equal(LOOKS.ref.flatHair,true);assert.equal(LOOKS.ref.oneBody,true);
 assert.equal(LOOKS.classic.flatHair,false);assert.equal(LOOKS.classic.oneBody,false);
});
test('ref look draws a bigger open mouth than classic',()=>{assert.ok(LOOKS.ref.mouthScale>=1.5);assert.equal(LOOKS.classic.mouthScale,1);});
test('ref look: arm roots sit inside the body, below its top edge',()=>{assert.ok(LOOKS.ref.shoulderY<.4&&LOOKS.ref.shoulderY>.25);assert.equal(LOOKS.classic.shoulderY,.42);});
test('ref look has short stick legs (about as long as the body); classic keeps its long legs',()=>{assert.ok(LOOKS.ref.legK<=.75&&LOOKS.ref.legK>=.55);assert.equal(LOOKS.classic.legK,1);});
