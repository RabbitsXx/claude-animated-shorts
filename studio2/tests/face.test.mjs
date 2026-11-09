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
import {lensMouth,faceParams as fp} from '../runtime/face.js';
test('lens mouth (reference look): a filled leaf shape that is flat when neutral, a smile when smile>0, a frown when smile<0',()=>{
 const n=lensMouth(fp('neutral')),s=lensMouth(fp('grin')),f=lensMouth(fp('sad'));
 assert.ok(n.thick>0);assert.ok(Math.abs(n.left[1]-n.right[1])<1e-6,'neutral corners level');
 assert.ok(s.left[1]<s.mid,'smile: corners above the middle (canvas y grows downward)');
 assert.ok(f.left[1]>f.mid,'frown: corners below the middle');
 assert.ok(lensMouth(fp({width:1.3})).right[0]>n.right[0],'wider face parameter, wider mouth');
});
test('lens mouth smirk lifts one corner more than the other',()=>{
 const m=lensMouth(fp('smirk'));assert.ok(m.right[1]<m.left[1]);
});
import {drawFace} from '../runtime/face.js';
test('open mouth: the outline is stroked on the mouth path, never on the tongue (black ring bug)',()=>{
 const ops=[],pen=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>ops.push(k),set:(t,k,v)=>{t[k]=v;return true;}});
 drawFace(pen,fp('laugh'),{});
 const ell=ops.map((o,i)=>o==='ellipse'?i:-1).filter(i=>i>=0),tongueFill=ops.lastIndexOf('restore')-2; // tongue ellipse is filled just before restore
 const strokeAfter=ops.indexOf('stroke',ops.lastIndexOf('restore'));
 assert.ok(strokeAfter>0);assert.ok(ops.slice(ops.lastIndexOf('restore'),strokeAfter).includes('beginPath'),'a fresh mouth path must be started before the outline stroke');
});
