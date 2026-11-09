// Whip-pan check: the camera swept through empty space between two subjects (square-wheel, 3.2 s, found only after a full render).
import test from 'node:test';
import assert from 'node:assert/strict';
import {lookAngles,findWhips} from '../lib/camera-motion.mjs';

const cam=(deg)=>({p:[0,1,0],t:[Math.sin(deg*Math.PI/180)*5,1,-Math.cos(deg*Math.PI/180)*5]}); // looks along a horizontal arc
const path=(degs)=>degs.map(cam);

test('lookAngles gives the angle the view direction turns between frames, in degrees',()=>{
 const a=lookAngles(path([0,10,25]));
 assert.equal(a.length,2);assert.ok(Math.abs(a[0]-10)<1e-6&&Math.abs(a[1]-15)<1e-6);
});
test('a slow steady pan is fine',()=>{
 const degs=Array.from({length:60},(_,i)=>i*1.2);assert.deepEqual(findWhips(path(degs),{step:1/30}),[]);
});
test('a hard cut (one huge jump between two still shots) is not a whip',()=>{
 const degs=[...Array(20).fill(0),...Array(20).fill(100)];assert.deepEqual(findWhips(path(degs),{step:1/30}),[]);
});
test('several consecutive fast frames are a whip-pan, reported with their time range',()=>{
 const degs=[...Array(10).fill(0)];let d=0;for(let i=0;i<6;i++){d+=9;degs.push(d);}for(let i=0;i<10;i++)degs.push(d);
 const w=findWhips(path(degs),{step:1/30});
 assert.equal(w.length,1);assert.ok(Math.abs(w[0].from-9/30)<1e-9);assert.ok(w[0].maxDegPerFrame>=8.9);assert.ok(w[0].frames>=3);
});
test('two fast frames only (a snappy move) stay under the limit',()=>{
 const degs=[0,0,0,9,18,18,18,18];assert.deepEqual(findWhips(path(degs),{step:1/30}),[]);
});
test('missing camera frames are skipped, not crashed on',()=>{
 assert.deepEqual(findWhips([null,cam(0),cam(1)],{step:1/30}),[]);
});
test('the square-wheel defect (about 100 degrees in 3 frames) is a whip-pan even though each frame is a big step',()=>{
 const degs=[0,0,0,0,33,66,100,100,100];const w=findWhips(path(degs),{step:1/30});
 assert.equal(w.length,1);assert.ok(w[0].totalDeg>=99);
});
test('a quick move that turns the view only about 27 degrees in 6 frames is allowed',()=>{
 const degs=[0,0,0];let d=0;for(let i=0;i<6;i++){d+=4.5;degs.push(d);}degs.push(d,d,d);assert.deepEqual(findWhips(path(degs),{step:1/30}),[]);
});
