import test from 'node:test';
import assert from 'node:assert/strict';
import {penNoise,penWidth,taperProfile,quadPts} from '../runtime/pen.js';
import {LOOKS} from '../runtime/look.js';

const pts=[];for(let i=0;i<400;i++)pts.push([Math.sin(i*1.7)*.3,Math.cos(i*2.9)*.3,Math.sin(i*.7)*.2]);
test('pen noise stays in 0..1 and is deterministic',()=>{
 for(const p of pts){const a=penNoise(...p,3),b=penNoise(...p,3);assert.ok(a>=0&&a<=1);assert.equal(a,b);}
});
test('pen width varies a lot (heavy and light pressure) but never reaches zero or runs away',()=>{
 const base=.02,w=pts.map(p=>penWidth(base,p,[0,0,1],1));
 assert.ok(Math.min(...w)>=base*.3&&Math.max(...w)<=base*2.1,`${Math.min(...w)/base}..${Math.max(...w)/base}`);
 assert.ok(Math.max(...w)/Math.min(...w)>=1.8,'a visible difference between light and heavy');
 const mean=w.reduce((a,b)=>a+b)/w.length;assert.ok(mean>base*.8&&mean<base*1.25,'average thickness stays near the base');
});
test('pen width is smooth: points a millimetre apart differ by under 8 percent (no jitter, a hand-drawn wobble)',()=>{
 for(const p of pts.slice(0,100)){const a=penWidth(.02,p,[0,1,0],2),b=penWidth(.02,[p[0]+.001,p[1],p[2]],[0,1,0],2);assert.ok(Math.abs(a-b)/a<.08);}
});
test('lines are heavier on the lower right than on the upper left, like a pen pressed while pulling down (same position, flipped normal)',()=>{
 const p=[.1,.1,.05],lr=penWidth(.02,p,[.6,-.8,0],1),ul=penWidth(.02,p,[-.6,.8,0],1);assert.ok(lr>ul);
});
test('a stroke tapers: light at both ends, heavy in the middle',()=>{
 const t=taperProfile(21);assert.ok(t[0]<t[10]&&t[20]<t[10]);assert.ok(Math.min(...t)>0);
});
test('quadPts samples a curve from start to end',()=>{const q=quadPts([0,0],[5,10],[10,0],8);assert.equal(q.length,9);assert.deepEqual(q[0],[0,0]);assert.deepEqual(q[8],[10,0]);});
test('ref look turns hand-drawn line pressure on, classic keeps even lines',()=>{assert.equal(LOOKS.ref.handDrawn,true);assert.equal(LOOKS.classic.handDrawn,false);});
