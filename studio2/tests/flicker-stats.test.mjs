import test from 'node:test';
import assert from 'node:assert/strict';
import {flickerFrames,judgeFlicker,blipRow,LIMITS} from '../lib/flicker-stats.mjs';
const W=64,H=64,flat=v=>new Uint8Array(W*H).fill(v);
const patch=(f,x0,y0,s,v)=>{const g=Uint8Array.from(f);for(let y=y0;y<y0+s;y++)for(let x=x0;x<x0+s;x++)g[y*W+x]=v;return g;};

test('a patch that flips for one frame is flagged as an area blip',()=>{
 const a=flat(100),b=patch(a,10,10,30,200),rows=flickerFrames([a,b,a],{W,H});
 assert.equal(rows.length,1);assert.equal(rows[0].frame,1);assert.ok(rows[0].area>=60);
 assert.equal(judgeFlicker(rows,{bigAlone:100}).ok,false);
});
test('a patch that moves smoothly (a real object) is never a blip',()=>{
 const f0=flat(100),f1=patch(f0,10,10,30,200),f2=patch(f0,14,10,30,200),f3=patch(f0,18,10,30,200);
 assert.equal(flickerFrames([f1,f2,f3],{W,H}).length,0);
});
test('a one pixel wide line sweeping over the frame is a line blip, not an area',()=>{
 const line=(x)=>{const g=flat(100);for(let y=0;y<H;y++)g[y*W+x]=250;return g;};
 const r=blipRow(line(5),line(6),line(5),W,H);assert.ok(r.pixels>0);assert.equal(r.area,0);
});
test('a smooth fade (dissolve) is not a blip',()=>{
 const rows=flickerFrames([flat(100),flat(140),flat(180),flat(220)],{W,H});assert.equal(rows.length,0);
});
test('limits keep the calibrated values',()=>{assert.equal(LIMITS.minArea,60);assert.equal(LIMITS.minRun,4);assert.equal(LIMITS.maxFlaggedFrames,0);});

test('a z-fight lasts: four flagged frames in a row fail, two isolated short blips only make notes, one huge patch fails alone',()=>{
 const row=(frame,area)=>({frame,area,cx:1,cy:1});
 assert.equal(judgeFlicker([row(10,80),row(11,90),row(12,70),row(13,75)]).ok,false);
 const short=judgeFlicker([row(10,118),row(40,67),row(41,60)]);assert.equal(short.ok,true);assert.equal(short.notes.length,3);
 assert.equal(judgeFlicker([row(10,900)]).ok,false);
 assert.equal(judgeFlicker([row(10,80),row(13,80),row(16,80),row(19,80)]).ok,false,'gaps of up to 2 frames keep the run going');
});
