// The narration is only sped up (never slowed), toward the film's own length target; old films keep their 64 s target.
import test from 'node:test';
import assert from 'node:assert/strict';
import {voiceTempo} from '../lib/voice-tempo.mjs';

test('without a target the old 64 s target applies, so earlier films are unchanged',()=>{
 assert.equal(voiceTempo(64,{}),1);assert.ok(Math.abs(voiceTempo(70,{})-70/64)<1e-9);assert.equal(voiceTempo(200,{}),1.18);
});
test('a film with voiceTargetSeconds is sped up only when its take is longer than that target',()=>{
 assert.equal(voiceTempo(110,{voiceTargetSeconds:115}),1);
 assert.ok(Math.abs(voiceTempo(126.5,{voiceTargetSeconds:115})-1.1)<1e-9);
});
test('the speed-up is capped at 1.18 and never below 1',()=>{
 assert.equal(voiceTempo(300,{voiceTargetSeconds:115}),1.18);assert.equal(voiceTempo(20,{voiceTargetSeconds:115}),1);
});
