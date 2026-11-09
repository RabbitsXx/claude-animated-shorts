import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {scaffold} from '../lib/scaffold.mjs';

const fake=()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'scaf-'));
 const ep=path.join(root,'episodes/base');
 fs.mkdirSync(path.join(ep,'scene2'),{recursive:true});
 for(const d of ['renders/full','voice/cache','audio','out']){fs.mkdirSync(path.join(ep,d),{recursive:true});fs.writeFileSync(path.join(ep,d,'x.bin'),'x');}
 fs.writeFileSync(path.join(ep,'scene2/main.mjs'),'export const authored=true;');
 fs.writeFileSync(path.join(ep,'film.json'),JSON.stringify({id:'base',voiceId:'V',fps:30}));
 fs.writeFileSync(path.join(ep,'SCRIPT.md'),'# base\n## Narration\n> old line\n');
 fs.writeFileSync(path.join(ep,'approvals.json'),'{"topic":{"quote":"x"}}');
 return root;
};

test('scaffold copies the scene code and film settings under the new id',()=>{
 const root=fake();
 const dest=scaffold({root,from:'base',id:'new-one'});
 assert.equal(dest,path.join(root,'episodes/new-one'));
 assert.ok(fs.existsSync(path.join(dest,'scene2/main.mjs')));
 const film=JSON.parse(fs.readFileSync(path.join(dest,'film.json'),'utf8'));
 assert.equal(film.id,'new-one');
 assert.equal(film.voiceId,'V');
});

test('scaffold never copies generated media or another film\'s approvals/script text',()=>{
 const root=fake();
 const dest=scaffold({root,from:'base',id:'new-two'});
 for(const d of ['renders','voice','audio','out'])assert.ok(!fs.existsSync(path.join(dest,d)),d+' must not be copied');
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dest,'approvals.json'),'utf8')),{});
 assert.ok(!fs.readFileSync(path.join(dest,'SCRIPT.md'),'utf8').includes('old line'));
});

test('scaffold refuses an existing destination and bad ids',()=>{
 const root=fake();
 scaffold({root,from:'base',id:'dup'});
 assert.throws(()=>scaffold({root,from:'base',id:'dup'}),/exists/);
 assert.throws(()=>scaffold({root,from:'base',id:'Bad Id'}),/id/);
 assert.throws(()=>scaffold({root,from:'nope',id:'ok-id'}),/source/);
});

test('scaffold with a channel writes it into film.json and refuses a channel that does not exist',()=>{
 const root=fake();fs.mkdirSync(path.join(root,'channels/pts'),{recursive:true});
 fs.writeFileSync(path.join(root,'channels/pts/channel.json'),JSON.stringify({id:'pts',storyProfile:'survival'}));
 const dest=scaffold({root,from:'base',id:'bus',channel:'pts'});
 assert.equal(JSON.parse(fs.readFileSync(path.join(dest,'film.json'),'utf8')).channel,'pts');
 assert.throws(()=>scaffold({root,from:'base',id:'bus2',channel:'nope'}),/channel/);
});
test('a survival film starts with a STORY.json that has the survival fields and a danger per beat',()=>{
 const root=fake();fs.mkdirSync(path.join(root,'channels/pts'),{recursive:true});
 fs.writeFileSync(path.join(root,'channels/pts/channel.json'),JSON.stringify({id:'pts',storyProfile:'survival'}));
 const dest=scaffold({root,from:'base',id:'bus',channel:'pts'}),s=JSON.parse(fs.readFileSync(path.join(dest,'STORY.json'),'utf8'));
 for(const k of ['protagonist','threat','stakes','rule','ending','want','reversal','payoff'])assert.ok(k in s,k);
 assert.ok(s.beats.every(b=>'danger' in b));
});

test('scaffold turns every Ref-contract gate on and drops the old voice timing',()=>{
 const root=fake();const p=path.join(root,'episodes/base/film.json');
 fs.writeFileSync(p,JSON.stringify({id:'base',voiceGaps:[1,2],mixSeconds:59.6,voiceTargetSeconds:64}));
 const film=JSON.parse(fs.readFileSync(path.join(scaffold({root,from:'base',id:'gated'}),'film.json'),'utf8'));
 for(const k of ['funGate','fidelityGate','sceneGate','detailGate','motionGate','cameraGate'])assert.equal(film[k],true,k);
 for(const k of ['voiceGaps','mixSeconds','voiceTargetSeconds'])assert.ok(!(k in film),k);
});
