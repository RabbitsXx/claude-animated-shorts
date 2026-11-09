// Cover depth of field: the engine's own bokeh pass, focused on the face, far background blurred (approved on square-wheel).
import test from 'node:test';
import assert from 'node:assert/strict';
import {coverDof,COVER_DOF} from '../library/cover-dof.mjs';

test('focus sits a little behind the face so the face and the prop beside it both stay sharp',()=>{
 const d=coverDof([0,1,3],{x:0,y:1,z:0});
 assert.ok(Math.abs(d.focus-(3+COVER_DOF.behindFace))<1e-9);
});
test('the approved square-wheel values are the defaults',()=>{
 const d=coverDof([0,0,2],[0,0,0]);
 assert.equal(d.aperture,.0055);assert.equal(d.maxblur,.026);
});
test('strength scales the blur but never past the limit that makes ghosting and halos',()=>{
 const soft=coverDof([0,0,2],[0,0,0],{strength:.5}),hard=coverDof([0,0,2],[0,0,0],{strength:9});
 assert.ok(soft.aperture<.0055&&soft.maxblur<.026);
 assert.equal(hard.aperture,COVER_DOF.maxAperture);assert.equal(hard.maxblur,COVER_DOF.maxMaxblur);
});
test('accepts a face given as an array or as {x,y,z} and rejects nonsense',()=>{
 assert.equal(coverDof([1,2,3],[1,2,0]).focus,coverDof([1,2,3],{x:1,y:2,z:0}).focus);
 assert.throws(()=>coverDof([0,0,0],null),/face/);
});
