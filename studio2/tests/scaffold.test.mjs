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
