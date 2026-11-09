// finish.mjs chains the delivery checks; the pure part decides the order, what stops the chain and what the report says.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FINISH_STEPS,summarize,packageNotes} from '../lib/finish.mjs';

test('order: tests, then the collision gate, then the intent check, then the flicker check, then assemble, then frame check, then the motion check, then retro (assemble refuses without a current gate)',()=>{
 const names=FINISH_STEPS.map(s=>s.name);
 assert.deepEqual(names,['unit tests','collision gate','intent check','flicker check','assemble','frame check','motion check','retro']);
});
test('only the retro may fail without stopping the chain',()=>{
 assert.deepEqual(FINISH_STEPS.filter(s=>!s.stopOnFail).map(s=>s.name),['retro']);
});
test('summarize lists failures first, says what was not run, and never claims a pass for a skipped step',()=>{
 const s=summarize([{name:'unit tests',ok:true,detail:'108 pass'},{name:'collision gate',ok:false,detail:'3 overlaps'}],FINISH_STEPS);
 assert.equal(s.ok,false);assert.match(s.lines[0],/FAIL/);assert.match(s.lines.join('\n'),/not run: intent check, flicker check, assemble, frame check, motion check, retro/);
});
test('all green gives ok and no not-run line',()=>{
 const r=FINISH_STEPS.map(s=>({name:s.name,ok:true,detail:''}));
 const s=summarize(r,FINISH_STEPS);assert.equal(s.ok,true);assert.ok(!/not run/.test(s.lines.join('\n')));
});
test('package notes warn when the film is too big to send to a phone and when a cover is missing',()=>{
 const n=packageNotes({finalBytes:79e6,files:['cover.png','post.txt']});
 assert.ok(n.some(x=>/30 MB/.test(x)));assert.ok(n.some(x=>/cover-small/.test(x)));
 assert.deepEqual(packageNotes({finalBytes:20e6,files:['cover.png','cover-small.jpg','post.txt','final.mp4']}),[]);
});
