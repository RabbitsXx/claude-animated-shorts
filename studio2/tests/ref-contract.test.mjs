import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIRED_GATES,gateFlags,isLegacy,contractProblems,STEPS,nextStep} from '../lib/ref-contract.mjs';

const full=()=>gateFlags();
const done={film:full(),approvals:{topic:{quote:'x'},frames:{quote:'z'}},narrationLines:12,spec:{flavour:true,reuse:true},hook:true,storyOk:true,
 models:{total:3,passed:3},collideOk:true,sceneQualityOk:true,cameraPlanOk:true,framesImage:true,voiceReal:true,preflightOk:true,fullRender:true,finishOk:true,packageOk:true};

test('every required gate is on in gateFlags',()=>{
 for(const k of REQUIRED_GATES)assert.equal(gateFlags()[k],true);
 assert.ok(REQUIRED_GATES.includes('cameraGate')&&REQUIRED_GATES.includes('motionGate'));
});

test('a new film that leaves a gate out is reported; old films are exempt',()=>{
 const film=full();delete film.motionGate;film.sceneGate=false;
 const p=contractProblems(film,'new-film');
 assert.equal(p.length,2);
 assert.deepEqual(contractProblems({},'square-wheel'),[]);
 assert.ok(isLegacy('spend-ten-million')&&!isLegacy('double-weight-hourly'));
});

test('nextStep follows the owner order and stops at the first undone step',()=>{
 const id=(o)=>nextStep({...done,...o}).id;
 assert.equal(id({approvals:{}}),'topic');
 assert.equal(id({film:{...full(),cameraGate:false}}),'contract');
 assert.equal(id({narrationLines:0}),'script');
 assert.equal(id({spec:{flavour:true,reuse:false}}),'spec');
 assert.equal(id({hook:false}),'hook');
 assert.equal(id({storyOk:false}),'story');
 assert.equal(id({models:{total:3,passed:2}}),'models');
 assert.equal(id({cameraPlanOk:false}),'scene');
 assert.equal(id({approvals:{topic:{quote:'x'}}}),'frames');
 assert.equal(id({voiceReal:false}),'sound');
 assert.equal(id({preflightOk:false}),'preflight');
 assert.equal(id({fullRender:false}),'render');
 assert.equal(id({finishOk:false}),'finish');
 assert.equal(id({packageOk:false}),'package');
 assert.equal(nextStep(done),null);
});

test('every step has a reason and a command or an owner decision',()=>{
 for(const s of STEPS){assert.ok(s.why.length>10,s.id);assert.ok(s.owner||s.commands.length,s.id);}
 assert.ok(STEPS.find(s=>s.id==='sound').owner&&STEPS.find(s=>s.id==='frames').owner);
});
