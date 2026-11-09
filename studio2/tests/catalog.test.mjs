// Asset catalogue: sounds, music and props that earlier films made, searchable, so a new film reuses instead of regenerating or rewriting.
import test from 'node:test';
import assert from 'node:assert/strict';
import {tagsFrom,buildCatalog,findEntries,propsFromSource} from '../lib/catalog.mjs';

test('tagsFrom keeps the useful words of the id and the prompt, no filler, no duplicates',()=>{
 const t=tagsFrom('sw-egg-splat','A wet egg splat on a cobblestone floor, comedic, no voices');
 assert.ok(t.includes('egg')&&t.includes('splat')&&t.includes('cobblestone'));
 assert.ok(!t.includes('the')&&!t.includes('voices')&&!t.includes('comedic'));assert.equal(new Set(t).size,t.length);
});
test('propsFromSource lists exported builders with their signature and the comment above them',()=>{
 const src=`// ---------- wheels\nexport function buildWheel(ctx,kit,{kind='square',s=S}={}){\n}\n// A cake.\nexport function buildCake(ctx,kit){\n}\nexport const S=.8;`;
 const p=propsFromSource(src);
 assert.deepEqual(p.map(x=>x.name),['buildWheel','buildCake']);
 assert.match(p[0].sig,/kind='square'/);assert.equal(p[1].comment,'A cake.');
});
test('buildCatalog gives every entry a kind, an id, a path and tags, and marks where it came from',()=>{
 const c=buildCatalog({
  sfx:[{id:'whoosh-soft',seconds:1,prompt:'A soft airy whoosh',path:'assets/sfx/whoosh-soft.wav',film:'studio'}],
  music:[{id:'sw-score',seconds:59.8,prompt:'playful pizzicato village comedy',path:'episodes/square-wheel/audio/score.wav',film:'square-wheel'}],
  props:[{film:'square-wheel',file:'episodes/square-wheel/scene2/props.mjs',name:'buildEgg',sig:'ctx,kit,{shell}',comment:''}]});
 assert.deepEqual(c.entries.map(e=>e.kind),['sfx','music','prop']);
 assert.ok(c.entries.every(e=>e.id&&e.path&&Array.isArray(e.tags)&&e.origin));
});
test('findEntries ranks by shared tags and can filter by kind',()=>{
 const c=buildCatalog({sfx:[{id:'egg-splat',seconds:1,prompt:'wet egg splat',path:'a.wav',film:'x'},{id:'door-creak',seconds:2,prompt:'old wooden door creak',path:'b.wav',film:'x'}],music:[{id:'score',seconds:60,prompt:'playful egg comedy',path:'c.wav',film:'x'}],props:[]});
 assert.equal(findEntries(c,'egg splat')[0].id,'egg-splat');
 assert.deepEqual(findEntries(c,'egg',{kind:'music'}).map(e=>e.id),['score']);
 assert.deepEqual(findEntries(c,'spaceship'),[]);
});
