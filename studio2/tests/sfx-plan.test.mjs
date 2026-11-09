// Paid sound generation must be predictable: the plan lists exactly what would be requested (0 API calls), skips what is already
// stored, rejects bad entries, and every prompt asks for no voices. The shared baseline list and each film's list are tested as data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {requestBody,planSfx,validateList} from '../lib/sfx-plan.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const readJson=(p)=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));

test('the request body is the documented sound-generation payload and is deterministic',()=>{
 const a=requestBody({id:'x',seconds:2,prompt:'A bell, no voices'}),b=requestBody({id:'x',seconds:2,prompt:'A bell, no voices'});
 assert.deepEqual(a,b);
 assert.deepEqual(a,{text:'A bell, no voices',duration_seconds:2,prompt_influence:.65,model_id:'eleven_text_to_sound_v2',loop:false});
 assert.equal(requestBody({id:'y',seconds:12,prompt:'Ambience, no voices',loop:true}).loop,true);
});
test('the plan skips stored sounds and counts the rest and their seconds',()=>{
 const list=[{id:'a',seconds:1,prompt:'One, no voices'},{id:'b',seconds:2,prompt:'Two, no voices'},{id:'c',seconds:3,prompt:'Three, no voices'}];
 const plan=planSfx({baseline:list,episode:[],exists:(id)=>id==='b'});
 assert.deepEqual(plan.baseline.map(e=>e.id),['a','c']);assert.equal(plan.requests,2);assert.equal(plan.seconds,4);
});
test('a bad entry is rejected: duplicate id, missing prompt, bad length, or a prompt that may produce voices',()=>{
 assert.throws(()=>validateList([{id:'a',seconds:1,prompt:'x, no voices'},{id:'a',seconds:1,prompt:'y, no voices'}]),/duplicate/);
 assert.throws(()=>validateList([{id:'a',seconds:1}]),/prompt/);
 assert.throws(()=>validateList([{id:'a',seconds:.1,prompt:'x, no voices'}]),/seconds/);
 assert.throws(()=>validateList([{id:'a',seconds:40,prompt:'x, no voices'}]),/seconds/);
 assert.throws(()=>validateList([{id:'a',seconds:1,prompt:'A bell ringing'}]),/no voices|intelligible/);
});
test('the baseline studio list and the square-wheel list are valid data and do not overlap',()=>{
 const base=readJson('studio2/lib/sfx-baseline.json'),film=readJson('episodes/square-wheel/audio/effects.json');
 validateList(base.effects);validateList(film.effects);
 assert.ok(base.effects.length>=15,'a real baseline: transitions, impacts, comedy, crowd, ambience');
 const ids=new Set(base.effects.map(e=>e.id));for(const e of film.effects)assert.ok(!ids.has(e.id),`${e.id} is already in the baseline`);
 assert.ok(film.music&&film.music.prompt&&/no vocals/i.test(film.music.prompt),'one instrumental score prompt');
});
