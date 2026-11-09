import test from 'node:test';
import assert from 'node:assert/strict';
import {frameSat,judgeLook} from '../lib/look-stats.mjs';
const solid=(r,g,b,n=100)=>{const a=new Uint8Array(n*3);for(let i=0;i<n;i++){a[i*3]=r;a[i*3+1]=g;a[i*3+2]=b;}return a;};
test('frameSat reads grey as 0 and a pure colour as 1',()=>{
 assert.equal(frameSat(solid(120,120,120),10,10).sat,0);
 assert.equal(frameSat(solid(255,0,0),10,10).share,1);
});
test('washed-out frames fail and vivid frames pass',()=>{
 const dull=Array.from({length:5},()=>frameSat(solid(180,170,160),10,10)),vivid=Array.from({length:5},()=>frameSat(solid(220,60,40),10,10));
 assert.equal(judgeLook(dull).ok,false);
 assert.equal(judgeLook(vivid).ok,true);
});
