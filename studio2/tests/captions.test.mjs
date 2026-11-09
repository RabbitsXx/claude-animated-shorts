// Captions: which words are on screen at time t. The reference shows one or two words at a time; older films use up to three.
// chunkAt(words,t,max) must (a) never show more than max words, (b) break after punctuation, (c) cover every spoken word exactly once,
// and (d) with max=3 behave exactly like the original bootstrap code so films made earlier do not change.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chunkAt,chunksOf} from '../lib/captions.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const words=JSON.parse(fs.readFileSync(path.join(ROOT,'episodes/square-wheel/voice/words.json'),'utf8'));

// the original code, copied verbatim from bootstrap.js before this change
function originalChunkAt(words,t){
 const a=words.findIndex(w=>t>=w.start&&t<w.end+.12);if(a<0)return null;
 let first=0;for(let i=0;i<a;i++)if(/[.!?,:]$/.test(words[i].word)||i-first>=2)first=i+1;
 let end=first;while(end<words.length&&end-first<3){const w=words[end++].word;if(/[.!?,:]$/.test(w))break;}
 return words.slice(first,end).map(w=>w.word).join(' ');
}

test('with max 3 the chunks are identical to the original code at every 10 ms of the real film',()=>{
 for(let t=0;t<59.5;t+=.01)assert.equal(chunkAt(words,t,3),originalChunkAt(words,t),`t=${t.toFixed(2)}`);
});
test('with max 2 no chunk ever has more than two words, at every 10 ms',()=>{
 for(let t=0;t<59.5;t+=.01){const c=chunkAt(words,t,2);if(c)assert.ok(c.split(' ').length<=2,`t=${t.toFixed(2)} "${c}"`);}
});
test('with max 1 every chunk is a single word',()=>{
 for(let t=0;t<59.5;t+=.05){const c=chunkAt(words,t,1);if(c)assert.equal(c.split(' ').length,1,`"${c}"`);}
});
test('chunksOf covers every word exactly once, in order, and breaks after punctuation',()=>{
 for(const max of [1,2,3]){
  const cs=chunksOf(words,max),flat=cs.flatMap(c=>c.words);
  assert.deepEqual(flat.map(w=>w.word),words.map(w=>w.word),`max=${max} covers all words`);
  for(const c of cs){assert.ok(c.words.length<=max);for(const w of c.words.slice(0,-1))assert.ok(!/[.!?,:]$/.test(w.word),`"${w.word}" ends a phrase but is inside a chunk (max ${max})`);}
 }
});
test('the opening line is shown two words at a time with max 2',()=>{
 assert.equal(chunkAt(words,.05,2),'He put');
 assert.equal(chunkAt(words,.55,2),'square wheels');
});

// ---- "auto": one or two words as fits the phrase (film.json captionWords: "auto")
const FUNCTION_WORDS=new Set('the a an of to in on at and but so his her its with for from he she it they we you i was were is had has no not'.split(' '));
const clean=(w)=>w.toLowerCase().replace(/[^a-z']/g,'');
test('auto: never more than two words, every word exactly once, breaks after punctuation',()=>{
 const cs=chunksOf(words,'auto'),flat=cs.flatMap(c=>c.words);
 assert.deepEqual(flat.map(w=>w.word),words.map(w=>w.word));
 for(const c of cs){assert.ok(c.words.length>=1&&c.words.length<=2);for(const w of c.words.slice(0,-1))assert.ok(!/[.!?,:]$/.test(w.word),`"${w.word}" inside a chunk`);}
});
const DET=new Set('the a an his her its their my your'.split(' ')),LINK=new Set('of to in on at and but so with for from as than'.split(' '));
test('auto: an article or possessive never stands alone before its noun, and a two-word chunk never ends on a linking word',()=>{
 const cs=chunksOf(words,'auto');
 cs.forEach((c,i)=>{const last=c.words[c.words.length-1],next=cs[i+1]&&cs[i+1].words[0];
  const text=c.words.map(w=>w.word).join(' ');
  if(c.words.length===2&&!/[.!?,:]$/.test(last.word))assert.ok(!DET.has(clean(last.word))&&!LINK.has(clean(last.word)),`"${text}" ends on a linking word`);
  if(c.words.length===1&&DET.has(clean(last.word))&&next&&!/[.!?,:]$/.test(last.word))assert.ok(next.start-last.end>.25,`"${text}" is a lonely determiner (gap ${(next.start-last.end).toFixed(2)})`);
 });
});
test('auto: it really is a mix of one and two words, and a long word stands alone',()=>{
 const cs=chunksOf(words,'auto'),ones=cs.filter(c=>c.words.length===1).length;
 assert.ok(ones/cs.length>.15&&ones/cs.length<.75,`share of one-word chunks ${ones}/${cs.length}`);
 for(const c of cs)if(c.words.length===2){const lens=c.words.map(w=>clean(w.word).length);if(Math.max(...lens)>=9)assert.ok(DET.has(clean(c.words[0].word)),`a long word only shares a chunk with its article: "${c.words.map(w=>w.word).join(' ')}"`);}
});
test('auto: the opening line reads as phrases',()=>{
 assert.deepEqual(chunksOf(words,'auto').slice(0,4).map(c=>c.words.map(w=>w.word).join(' ')),['He put','square wheels','on','a cart,']);
});
test('auto: chunkAt shows the chunk that contains the spoken word, for any time',()=>{
 const cs=chunksOf(words,'auto');
 for(let t=0;t<59.5;t+=.01){const c=chunkAt(words,t,'auto');if(!c)continue;assert.ok(cs.some(x=>x.words.map(w=>w.word).join(' ')===c),`t=${t.toFixed(2)} "${c}"`);assert.ok(c.split(' ').length<=2);}
});
