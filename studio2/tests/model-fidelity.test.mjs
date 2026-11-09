// The fidelity gate (studio2/lib/model-fidelity.mjs) and its hook in validateModels: a passed model must carry real-world numbers for every interaction point.
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFidelity} from '../lib/model-fidelity.mjs';
import {validateModels} from '../lib/models.mjs';

const good=()=>({id:'door',status:'passed',sheet:'x.jpg',passedBy:'me',checks:['a','b','c'],reference:'a standard interior door, 2.0 m by 0.8 m, from building codes',
 realDetails:['a lever handle at hip height','three hinges on one side','a raised panel pattern'],
 interaction:[{point:'door handle',action:'grabbed and pushed down',realRange:[.9,1.1],modeled:1.0,unit:'m',source:'building code, typical',sheetView:3},
  {point:'door opening',action:'walked through by the hero',realRange:[1.95,2.1],modeled:2.04,unit:'m',source:'building code, typical',sheetView:1}]});
test('a model with a reference, real details and in-range interaction points passes',()=>{assert.deepEqual(auditFidelity(good()),[]);});
test('a value outside the real range fails, an owner-approved exaggeration with a reason is allowed',()=>{
 const m=good();m.interaction[0].modeled=1.6;
 assert.match(auditFidelity(m).join('|'),/outside the real range 0.9-1.1/);
 m.exaggerations=[{point:'door handle',reason:'a giant handle reads at phone size',ownerApproved:'owner said yes in chat'}];
 assert.deepEqual(auditFidelity(m),[]);
});
test('missing reference, details and interaction points fail; scenery needs a reason',()=>{
 const f=auditFidelity({id:'wall'}).join('|');assert.match(f,/"reference"/);assert.match(f,/"realDetails"/);assert.match(f,/interaction/);
 assert.deepEqual(auditFidelity({id:'sky',reference:'the sky dome as seen from a street at noon',realDetails:['a pale horizon band','soft cloud shapes','a deeper blue overhead'],scenery:true,sceneryWhy:'nobody touches the sky'}),[]);
});
test('validateModels applies the gate only to films that ask for it',()=>{
 const doc={models:[{...good(),interaction:[]}]};
 assert.equal(validateModels(doc).ok,true);
 const v=validateModels(doc,{fidelity:true});assert.equal(v.ok,false);assert.match(v.problems.join('|'),/interaction/);
});
