// Partial re-render: find which stretches of a finished render are out of date, so only those frames are rendered again.
import test from 'node:test';
import assert from 'node:assert/strict';
import {dirtyRanges,sampleFrameIndex,coverage} from '../lib/dirty-ranges.mjs';

const opt={fps:2,videoFps:30,totalFrames:1782,threshold:.3,margin:1,mergeGap:15};
const clean=(n)=>Array(n).fill(0);

test('sample k at 2 fps matches frame k*15 of a 30 fps render',()=>{
 assert.equal(sampleFrameIndex(0,2,30),0);assert.equal(sampleFrameIndex(20,2,30),300);assert.equal(sampleFrameIndex(3,4,30),22.5|0);
});
test('nothing changed: nothing to render',()=>{
 assert.deepEqual(dirtyRanges(clean(120),opt),[]);
});
test('one changed sample re-renders the stretch around it (one sample step each side)',()=>{
 const s=clean(120);s[20]=5;// t=10.0 s -> frame 300
 assert.deepEqual(dirtyRanges(s,opt),[{from:285,to:315}]);
});
test('a change just under the threshold is ignored, just over is not',()=>{
 const s=clean(120);s[40]=.29;assert.deepEqual(dirtyRanges(s,opt),[]);s[40]=.31;assert.equal(dirtyRanges(s,opt).length,1);
});
test('neighbouring changes merge into one range, far ones stay apart',()=>{
 const s=clean(120);s[20]=2;s[22]=2;s[80]=2;
 assert.deepEqual(dirtyRanges(s,opt),[{from:285,to:345},{from:1185,to:1215}]);
});
test('ranges are clamped to the film',()=>{
 const s=clean(120);s[0]=9;s[119]=9;
 const r=dirtyRanges(s,opt);assert.equal(r[0].from,0);assert.equal(r.at(-1).to,1782);
});
test('coverage says how much of the film is dirty, so a mostly-dirty film is rendered in full',()=>{
 assert.equal(coverage([{from:0,to:891}],1782),.5);assert.equal(coverage([],1782),0);
});
