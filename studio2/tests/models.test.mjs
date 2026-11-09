import test from 'node:test';
import assert from 'node:assert/strict';
import {validateModels,nextModel,allPassed} from '../lib/models.mjs';

const P=(id,o={})=>({id,name:id,status:'passed',sheet:`out/models/${id}.jpg`,passedBy:'claude',checks:['silhouette reads','outline even','scale right'],...o});
const doc=(...models)=>({models});

test('an empty or missing list is not a pass: a film must name its models',()=>{
 assert.equal(validateModels({models:[]}).ok,false);assert.equal(validateModels(null).ok,false);
});
test('models pass one by one: a model cannot be passed while an earlier one is not',()=>{
 const r=validateModels(doc(P('hero',{status:'built'}),P('gold-pile')));
 assert.equal(r.ok,false);assert.match(r.problems.join(' '),/gold-pile.*hero/);
});
test('a passed model needs a sheet, who passed it and at least three written checks',()=>{
 for(const bad of [{sheet:undefined},{passedBy:undefined},{checks:['one','two']}]){
  const r=validateModels(doc(P('hero',bad)));assert.equal(r.ok,false,JSON.stringify(bad));
 }
});
test('only one model may be in the building state at a time',()=>{
 const r=validateModels(doc(P('a',{status:'building'}),P('b',{status:'building'})));assert.equal(r.ok,false);
});
test('unknown status and duplicate ids are rejected',()=>{
 assert.equal(validateModels(doc(P('a',{status:'done'}))).ok,false);
 assert.equal(validateModels(doc(P('a'),P('a'))).ok,false);
});
test('nextModel is the first one not passed; allPassed only when every model passed',()=>{
 const d=doc(P('a'),P('b',{status:'built'}),{id:'c',name:'c',status:'planned'});
 assert.equal(nextModel(d).id,'b');assert.equal(allPassed(d),false);
 assert.equal(allPassed(doc(P('a'),P('b'))),true);assert.equal(nextModel(doc(P('a'))),null);
});
test('a rejected model blocks everything after it',()=>{
 const r=validateModels(doc(P('a',{status:'rejected',rejectedBy:'user',reason:'face too small'}),P('b')));
 assert.equal(r.ok,false);
});

// DETAIL GATE (owner, 2026-11-08: every model as detailed as the spend-ten-million work): the sheet counts parts and different named parts
test('detail gate: a passed prop needs enough parts and named parts, or a written waiver',()=>{
 const ok=validateModels(doc(P('lamp',{meshes:40,names:12})),{detail:true});assert.equal(ok.ok,true,ok.problems.join(';'));
 const thin=validateModels(doc(P('remote',{meshes:20,names:12})),{detail:true});assert.equal(thin.ok,false);assert.match(thin.problems[0],/meshes/);
 const plain=validateModels(doc(P('box',{meshes:60,names:4})),{detail:true});assert.equal(plain.ok,false);assert.match(plain.problems[0],/named/);
 const waived=validateModels(doc(P('rain',{meshes:1,names:1,detailWaiver:'one instanced mesh of 80000 beads'})),{detail:true});assert.equal(waived.ok,true);
 const flimsy=validateModels(doc(P('rain',{meshes:1,names:1,detailWaiver:'tiny'})),{detail:true});assert.equal(flimsy.ok,false);
 assert.equal(validateModels(doc(P('remote',{meshes:20,names:12}))).ok,true,'films without detailGate are exempt');
});
test('detail gate: a model with no sheet measurement cannot be passed',()=>{
 const r=validateModels(doc(P('remote')),{detail:true});assert.equal(r.ok,false);assert.match(r.problems[0],/sheet again/);
});
