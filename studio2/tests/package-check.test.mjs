// The delivery package check: what can be measured about final.mp4, the cover and the text, and what is left to a person.
import test from 'node:test';
import assert from 'node:assert/strict';
import {checkPackage} from '../lib/package-check.mjs';

const qa=(o={})=>({decodeErrors:'none',formatDuration:115.6,width:1080,height:1920,blackSegments:0,freezeSegments:[],integratedLUFS:'-14.0',truePeakDBFS:'-1.8',...o});
const files=['final.mp4','cover.png','cover-small.jpg','post.txt'];
const post={title:'A fine title'};
const ch={lengthSeconds:[70,150]};
test('a clean film with all files passes and says what only a person can judge',()=>{
 const r=checkPackage({qa:qa(),files,channel:ch,post});
 assert.equal(r.ok,true);assert.ok(r.personMustJudge.some(x=>/watch/i.test(x)));assert.ok(r.personMustJudge.some(x=>/cover/i.test(x)));
});
test('length outside the channel range fails; the default range is 55-70 s',()=>{
 assert.equal(checkPackage({qa:qa({formatDuration:160}),files,channel:ch,post}).checks.duration,false);
 assert.equal(checkPackage({qa:qa({formatDuration:115}),files,channel:{},post}).checks.duration,false);
 assert.equal(checkPackage({qa:qa({formatDuration:60}),files,channel:{},post}).checks.duration,true);
});
test('decode errors, black or frozen segments, wrong size, loud or hot audio each fail',()=>{
 for(const [k,o] of [['decode',{decodeErrors:'x'}],['black',{blackSegments:2}],['freeze',{freezeSegments:[{a:1}]}],['resolution',{width:720}],['loudness',{integratedLUFS:'-10.0'}],['peak',{truePeakDBFS:'-0.2'}]])
  assert.equal(checkPackage({qa:qa(o),files,channel:ch,post}).checks[k],false,k);
});
test('missing files and a title over 100 characters fail; a big file is only a note',()=>{
 assert.equal(checkPackage({qa:qa(),files:['final.mp4'],channel:ch,post}).checks.files,false);
 assert.equal(checkPackage({qa:qa(),files,channel:ch,post:{title:'x'.repeat(101)}}).checks.title,false);
 const r=checkPackage({qa:qa(),files,channel:ch,post,finalBytes:79e6});assert.equal(r.ok,true);assert.ok(r.notes.some(x=>/30 MB/.test(x)));
});
