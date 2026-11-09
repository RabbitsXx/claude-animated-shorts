// Music under the voice: the distance (dB) after ducking is judged, so music is never inaudible (square-wheel) or covering the voice.
import test from 'node:test';
import assert from 'node:assert/strict';
import {judgeMusicDistance,parseIntegrated} from '../lib/mixlevels.mjs';

test('about 9 to 14 dB under the voice is right (the reference sits near 10 to 14)',()=>{
 assert.equal(judgeMusicDistance(10).ok,true);assert.equal(judgeMusicDistance(13.5).ok,true);
});
test('under 8 dB the music fights the voice, over 16 dB it cannot be heard',()=>{
 const loud=judgeMusicDistance(6),quiet=judgeMusicDistance(20);
 assert.equal(loud.ok,false);assert.match(loud.message,/too loud/);assert.equal(quiet.ok,false);assert.match(quiet.message,/too quiet/);
});
test('parseIntegrated reads the last integrated loudness from ffmpeg ebur128 text',()=>{
 assert.equal(parseIntegrated('  I:         -16.0 LUFS\n  LRA: 3\n  I:         -24.4 LUFS\n'),-24.4);
 assert.equal(parseIntegrated('nothing'),null);
});
