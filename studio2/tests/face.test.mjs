import test from 'node:test';
import assert from 'node:assert/strict';
import {faceParams,mixFace,faceTrack,FACE0,FACES} from '../runtime/face.js';
test('every named preset resolves to the full parameter set',()=>{
 for(const n of Object.keys(FACES))assert.deepEqual(Object.keys(faceParams(n)).sort(),Object.keys(FACE0).sort(),n);
});
test('unknown face name throws',()=>{assert.throws(()=>faceParams('nope'),/Unknown face/);});
test('mixFace midpoint is the average of every parameter',()=>{
 const a=faceParams('neutral'),b=faceParams('shock'),m=mixFace('neutral','shock',.5);
 for(const k of Object.keys(FACE0))assert.ok(Math.abs(m[k]-(a[k]+b[k])/2)<1e-9,k);
});
test('faceTrack holds ends and blends between keys',()=>{
 const k=[[0,'neutral'],[1,'shock','lin']];
 assert.deepEqual(faceTrack(k,-1),faceParams('neutral'));assert.deepEqual(faceTrack(k,5),faceParams('shock'));
 assert.ok(Math.abs(faceTrack(k,.5).eyeL-(1+FACES.shock.eyeL)/2)<1e-9);
});
