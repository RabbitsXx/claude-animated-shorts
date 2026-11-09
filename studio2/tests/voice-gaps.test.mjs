import test from 'node:test';
import assert from 'node:assert/strict';
import {planGaps,paragraphCounts} from '../lib/voice-gaps.mjs';

// 6 words in 3 paragraphs of 2 words each; words are 0.5 s long with 0.1 s between them
const W=Array.from({length:6},(_,i)=>({word:'w'+i,start:i*.6,end:i*.6+.5}));
test('paragraph word counts come from the "> " lines of SCRIPT.md',()=>{
 assert.deepEqual(paragraphCounts('# T\n\n> One two three.\n\n> Four five.\n\nnotes\n> Six.'),[3,2,1]);
});
test('gaps shift every later word by the sum of the gaps before it, and the tail gap lengthens the film',()=>{
 const r=planGaps(W,[2,2,2],[1,2,3]);
 assert.deepEqual(r.words.map(w=>+w.start.toFixed(3)),[0,.6,1.2+1,1.8+1,2.4+3,3+3]);
 assert.equal(+r.total.toFixed(3),+(3.5+6).toFixed(3));
});
test('cuts fall in the silence between paragraphs and the segments cover the whole source without overlap',()=>{
 const r=planGaps(W,[2,2,2],[1,1,1]);
 assert.equal(r.segments.length,3);
 for(const [i,s] of r.segments.entries()){assert.ok(s.to>s.from);if(i)assert.equal(s.from,r.segments[i-1].to);}
 assert.ok(r.segments[0].to>W[1].end&&r.segments[0].to<W[2].start,'cut 1 is between word 1 and word 2');
 assert.equal(r.segments[0].from,0);assert.ok(r.segments.at(-1).to>=W.at(-1).end);
});
test('a paragraph count that does not match the words, or a missing gap, is an error',()=>{
 assert.throws(()=>planGaps(W,[2,2],[1,1]),/words/);
 assert.throws(()=>planGaps(W,[2,2,2],[1,1]),/gap/);
 assert.throws(()=>planGaps(W,[2,2,2],[1,-1,1]),/gap/);
});
