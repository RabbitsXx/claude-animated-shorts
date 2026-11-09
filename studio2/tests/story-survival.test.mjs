// Survival story profile (channel Post Time Survival): a danger ladder with a choice, not facts and a carrier.
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSurvival} from '../lib/story-profiles.mjs';

const good=()=>({protagonist:'Mia, a night-shift bus driver',threat:'a fast-spreading zombie crowd in the tunnel',stakes:'the six passengers on her bus',rule:'noise draws them, silence and light keep them away',ending:'she survives by driving out dark and silent',
 beats:[{t0:0,t1:8,kind:'event',danger:1},{t0:8,t1:18,kind:'event',danger:2},{t0:18,t1:28,kind:'choice',danger:3},{t0:28,t1:40,kind:'event',danger:4},{t0:40,t1:52,kind:'event',danger:5},{t0:52,t1:60,kind:'reaction',danger:2}]});
test('a rising ladder with a choice and a peak late in the film passes',()=>{assert.deepEqual(auditSurvival(good()),[]);});
test('missing story fields are named',()=>{
 const s=good();delete s.threat;s.rule='x';const f=auditSurvival(s);
 assert.ok(f.some(x=>/threat/.test(x)));assert.ok(f.some(x=>/rule/.test(x)));
});
test('flat danger fails: the story must escalate at least three times',()=>{
 const s=good();s.beats.forEach(b=>b.danger=2);assert.ok(auditSurvival(s).some(x=>/escalat/i.test(x)));
});
test('a film that never gets truly dangerous fails (peak must be 4 or more)',()=>{
 const s=good();s.beats.forEach(b=>b.danger=Math.min(b.danger,3));assert.ok(auditSurvival(s).some(x=>/peak/i.test(x)));
});
test('the peak must sit between 55% and 90% of the film',()=>{
 const s=good();s.beats[0].danger=5;s.beats[4].danger=3;const f=auditSurvival(s);assert.ok(f.some(x=>/55%/.test(x)));
});
test('the hero must make at least one choice before the peak (agency)',()=>{
 const s=good();s.beats[2].kind='event';assert.ok(auditSurvival(s).some(x=>/choice/i.test(x)));
 const t=good();t.beats[2].kind='event';t.beats[5].kind='choice';assert.ok(auditSurvival(t).some(x=>/before the peak/i.test(x)));
});
test('every beat needs a danger number from 1 to 5',()=>{
 const s=good();s.beats[1].danger=9;delete s.beats[3].danger;assert.ok(auditSurvival(s).some(x=>/danger/.test(x)));
});

import {limitsFor} from '../lib/story-profiles.mjs';
test('a channel may set its own length range; every other limit stays the shared one',()=>{
 const base={lengthSeconds:[55,70],maxCutsPerMinute:14,minEventsPerMinute:14};
 const l=limitsFor(base,{lengthSeconds:[70,150]});
 assert.deepEqual(l.lengthSeconds,[70,150]);assert.equal(l.maxCutsPerMinute,14);assert.equal(l.minEventsPerMinute,14);
 assert.deepEqual(limitsFor(base,{}).lengthSeconds,[55,70]);assert.deepEqual(base.lengthSeconds,[55,70]);
});
test('a channel length range must stay within what YouTube Shorts allows (up to 180 s) and have min below max',()=>{
 assert.throws(()=>limitsFor({lengthSeconds:[55,70]},{lengthSeconds:[70,200]}),/180/);
 assert.throws(()=>limitsFor({lengthSeconds:[55,70]},{lengthSeconds:[90,80]}),/min/);
});
