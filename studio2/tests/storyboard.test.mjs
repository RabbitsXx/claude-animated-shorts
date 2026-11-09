import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStoryboard,SCENES_REQUIRED} from '../lib/storyboard.mjs';

const story={beats:[{t0:0,t1:4},{t0:4,t1:8}]};
const P=(beat,o={})=>({beat,scene:'hook',face:'grin',narration:'He won.',camera:'low front, slow push in',action:'he poses',counter:'10,000,000',...o});
test('a storyboard needs one panel per story beat, in order',()=>{
 assert.equal(validateStoryboard({panels:[P(1),P(2)]},story).ok,true);
 assert.equal(validateStoryboard({panels:[P(1)]},story).ok,false);
 assert.equal(validateStoryboard({panels:[P(2),P(1)]},story).ok,false);
});
test('every panel says what it shows: scene, camera, action; narration may be empty only for silent beats',()=>{
 for(const k of ['scene','camera','action']){const r=validateStoryboard({panels:[P(1),P(2,{[k]:''})]},story);assert.equal(r.ok,false,k);}
 assert.equal(validateStoryboard({panels:[P(1),P(2,{narration:'',silent:true})]},story).ok,true);
 assert.equal(validateStoryboard({panels:[P(1),P(2,{narration:''})]},story).ok,false);
});
test('the approval gate lists what the owner must answer',()=>{assert.ok(SCENES_REQUIRED.length>=3);});
import {keyframeTimes} from '../lib/storyboard.mjs';
test('storyboard keyframes are real frames of the built scene: one time per beat, inside the beat, after its first cut settles',()=>{
 const t=keyframeTimes({beats:[{t0:0,t1:4},{t0:4,t1:8},{t0:8,t1:12}]});
 assert.equal(t.length,3);
 t.forEach((x,i)=>{assert.ok(x>i*4+1&&x<(i+1)*4,`beat ${i+1} keyframe ${x}`);});
});
