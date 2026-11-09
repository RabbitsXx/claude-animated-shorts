// Channels: two YouTube channels share one way of making films but never share brand, story rules or text.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadChannels,validateChannel,episodesByChannel} from '../lib/channels.mjs';

const ch=(o={})=>({id:'demo',name:'Demo',storyProfile:'survival',language:'en',descriptionFooter:'Hello.',hashtags:['#Shorts'],coverStyle:'danger',disclosure:'AI voice.',...o});
const fake=()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'chan-'));
 const w=(f,t)=>{fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.writeFileSync(path.join(root,f),typeof t==='string'?t:JSON.stringify(t));};
 w('channels/a/channel.json',ch({id:'a',storyProfile:'explainer'}));w('channels/b/channel.json',ch({id:'b'}));
 w('episodes/e1/film.json',{id:'e1',channel:'a'});w('episodes/e2/film.json',{id:'e2',channel:'b'});w('episodes/e3/film.json',{id:'e3',channel:'b'});w('episodes/e4/film.json',{id:'e4'});
 return root;
};
test('validateChannel accepts a complete profile',()=>{assert.deepEqual(validateChannel(ch()),[]);});
test('validateChannel names every missing or wrong field',()=>{
 const p=validateChannel({id:'Bad Id',storyProfile:'poem',hashtags:'x'});
 assert.ok(p.some(x=>/id/.test(x)));assert.ok(p.some(x=>/storyProfile/.test(x)));assert.ok(p.some(x=>/hashtags/.test(x)));assert.ok(p.some(x=>/descriptionFooter/.test(x)));assert.ok(p.some(x=>/disclosure/.test(x)));
});
test('loadChannels reads every channels/<id>/channel.json and rejects an id that differs from its folder',()=>{
 const root=fake();const c=loadChannels(root);assert.deepEqual(Object.keys(c).sort(),['a','b']);assert.equal(c.b.storyProfile,'survival');
 fs.writeFileSync(path.join(root,'channels/b/channel.json'),JSON.stringify(ch({id:'zzz'})));
 assert.throws(()=>loadChannels(root),/folder/);
});
test('episodesByChannel groups episodes by film.json channel and lists the ones with no channel',()=>{
 const g=episodesByChannel(fake());
 assert.deepEqual(g.a,['e1']);assert.deepEqual(g.b,['e2','e3']);assert.deepEqual(g.unassigned,['e4']);
});
test('an episode that names an unknown channel is reported, not silently filed',()=>{
 const root=fake();fs.writeFileSync(path.join(root,'episodes/e4/film.json'),JSON.stringify({id:'e4',channel:'nope'}));
 const g=episodesByChannel(root);assert.deepEqual(g.unknown,[{episode:'e4',channel:'nope'}]);
});

test('a channel lengthSeconds, when given, must be two numbers with min below max',()=>{
 assert.deepEqual(validateChannel(ch({lengthSeconds:[70,150]})),[]);
 assert.ok(validateChannel(ch({lengthSeconds:[150,70]})).some(x=>/lengthSeconds/.test(x)));
 assert.ok(validateChannel(ch({lengthSeconds:'long'})).some(x=>/lengthSeconds/.test(x)));
});
