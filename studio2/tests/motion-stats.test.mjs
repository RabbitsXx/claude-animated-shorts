import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {frameDeltas,analyzeMotion,judgeMotion,LIMITS} from '../lib/motion-stats.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));

const flat=(v,n=64)=>new Uint8Array(n).fill(v);
test('frameDeltas: identical frames give 0 pixel delta and 0 histogram delta, a different frame gives both',()=>{
 const d=frameDeltas([flat(100),flat(100),flat(200)]);
 assert.deepEqual(d.pixel.slice(0,1),[0]);assert.equal(d.hist[0],0);
 assert.equal(d.pixel[1],100);assert.ok(d.hist[1]>.9,'all pixels moved to another histogram bin');
});

const series=(n,fn)=>Array.from({length:n},(_,i)=>fn(i));
test('analyzeMotion: single-frame spikes are hard cuts, multi-frame runs are soft transitions, quiet frames are counted',()=>{
 const hist=series(300,i=>i===60||i===150?.5:(i>=210&&i<220?.2:0)),pixel=series(300,i=>i<100?.5:12);
 const a=analyzeMotion({pixel,hist},{fps:30});
 assert.equal(a.hardCuts,2);assert.equal(a.softTransitions,1);
 assert.ok(Math.abs(a.staticShare-100/300)<.01,String(a.staticShare));
 assert.equal(a.windows.length,2);assert.ok(a.windows[0]<1&&a.windows[1]>5);
});

test('judgeMotion: a film that sits still between hard cuts fails on static share, window medians and soft transitions',()=>{
 const still=analyzeMotion({pixel:series(1800,()=>.3),hist:series(1800,i=>i%120===0&&i?.5:0)},{fps:30});
 const r=judgeMotion(still);assert.equal(r.ok,false);
 assert.ok(r.problems.some(p=>/near-still/.test(p)));assert.ok(r.problems.some(p=>/4 s window/.test(p)));assert.ok(r.problems.some(p=>/soft transitions/.test(p)));assert.ok(r.problems.some(p=>/hard cuts/.test(p)));
});

test('the reference clip passes its own limits (limits are derived from it, not invented)',()=>{
 const f=path.resolve(here,'../../reference/study/motion.json');
 const m=JSON.parse(fs.readFileSync(f,'utf8'));
 const a=analyzeMotion({pixel:m.map(x=>x.pixelDelta),hist:m.map(x=>x.histDelta)},{fps:30});
 const r=judgeMotion(a);assert.equal(r.ok,true,r.problems.join(' | ')+' '+JSON.stringify({s:a.staticShare,h:a.hardCuts,t:a.softTransitions,w:a.windows}));
 assert.ok(LIMITS.maxStaticShare>a.staticShare,'limit sits above the reference value');
});
