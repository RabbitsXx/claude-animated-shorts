// Parts promoted from square-wheel into studio2/library (phase B). Each one is tested here so a later film can import it unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ballistic,aimVelocity} from '../library/ballistic.mjs';
import {spacedLine,crowdSpec,crowdPose,VILLAGE} from '../library/crowd.mjs';
import {stripHeight,stripColumns} from '../library/dig-strip.mjs';
import {summarizeHistory,renderRetro} from '../lib/retro.mjs';
const sha=(o)=>createHash('sha256').update(JSON.stringify(o)).digest('hex');

// ---- ballistic
test('a thrown object follows a parabola and lands on the floor',()=>{
 const r=ballistic([0,1,0],[2,3,0],0,10,0);
 assert.ok(r.landed);assert.ok(Math.abs(r.pos[1])<1e-9);
 const mid=ballistic([0,1,0],[2,3,0],0,.2,0);assert.ok(Math.abs(mid.pos[0]-.4)<1e-9);assert.ok(Math.abs(mid.pos[1]-(1+3*.2-.5*9.8*.04))<1e-9);
 assert.equal(ballistic([0,1,0],[2,3,0],5,4,0).pos[0],0,'before launch it stays at the start');
});
test('aimVelocity lands the projectile on the target after the given time',()=>{
 const p0=[0,1.2,0],p1=[2,1.6,-1],T=.7,v=aimVelocity(p0,p1,T),b=ballistic(p0,v,0,T,-5);
 for(let i=0;i<3;i++)assert.ok(Math.abs(b.pos[i]-p1[i])<1e-9,`axis ${i}`);
});

// ---- spaced line
test('spacedLine never puts neighbours closer than the minimum spacing, for any range and count',()=>{
 for(const [n,x0,x1] of [[3,0,.5],[5,0,10],[9,-7,.6],[12,1,3],[2,4,4]]){
  const pts=spacedLine({n,x0,x1,z:2,minSpacing:.7,jitter:.1,seed:3});
  assert.equal(pts.length,n);
  for(let k=1;k<n;k++)assert.ok(Math.abs(pts[k].x-pts[k-1].x)>=.7-1e-9,`n=${n} k=${k} gap ${pts[k].x-pts[k-1].x}`);
 }
});
test('spacedLine is deterministic and keeps z close to the requested line',()=>{
 const a=spacedLine({n:6,x0:0,x1:6,z:3,minSpacing:.7,jitter:.1,seed:9}),b=spacedLine({n:6,x0:0,x1:6,z:3,minSpacing:.7,jitter:.1,seed:9});
 assert.deepEqual(a,b);for(const p of a)assert.ok(Math.abs(p.z-3)<=.1+1e-9);
});

// ---- crowd: moved code must reproduce the square-wheel village exactly
test('crowdSpec with the village palette reproduces the square-wheel crowd exactly',()=>{
 const specs=Array.from({length:36},(_,i)=>crowdSpec(i,{palette:VILLAGE}));
 assert.equal(sha(specs),'9111c7d77af8314cdb61b83e95042d50c23441b119cfdddfc225c792b701a0af');
});
test('crowdPose reproduces the square-wheel poses exactly for every mode',()=>{
 const modes=['idle','cheer','laugh','clap','gasp','point','wave'],poses=[];
 for(let i=0;i<12;i++)for(const mode of modes)poses.push(crowdPose({x:i*.7-3,z:2+i*.1,y:.2},1.37+i*.11,mode,i,[1,0,0]));
 assert.equal(sha(poses),'4a53efbe2fe04f818cb6b605e3acbb2a8d1f8a030e8dbadfe17efdfd723e28ef');
});

// ---- dig strip: heights come from a function and a dig progress
test('stripHeight scales a hump height by the column weight and the dig progress',()=>{
 const h=(x)=>.2*Math.sin(x);
 assert.equal(stripHeight(h,1,1,0),0);assert.equal(stripHeight(h,1,0,1),0);
 assert.ok(Math.abs(stripHeight(h,1,1,1)-h(1))<1e-12);assert.ok(Math.abs(stripHeight(h,1,.5,.5)-.25*h(1))<1e-12);
});
test('stripColumns flare the shoulders down and keep the middle',()=>{
 const c=stripColumns();assert.equal(c.across.length,c.shoulder.length);assert.equal(c.shoulder[0],0);assert.equal(c.shoulder[c.shoulder.length-1],0);assert.ok(c.shoulder.includes(1));
});

// ---- retro: what a film cost
test('summarizeHistory reports runs, runs to the first pass and the kinds that failed',()=>{
 const lines=[{at:'t1',ok:false,overlaps:57,kinds:['crowd x well ring','hidden by Head']},{at:'t2',ok:false,overlaps:12,kinds:['hidden by Head']},{at:'t3',ok:true,overlaps:0,kinds:[]},{at:'t4',ok:true,overlaps:0,kinds:[]}];
 const s=summarizeHistory(lines);
 assert.equal(s.runs,4);assert.equal(s.runsToFirstPass,3);assert.equal(s.firstOverlaps,57);assert.equal(s.kinds['hidden by Head'],2);assert.equal(s.lastOk,true);
 assert.deepEqual(summarizeHistory([]),{runs:0,runsToFirstPass:null,firstOverlaps:null,kinds:{},lastOk:null});
});
test('renderRetro writes a markdown report with the measured numbers and the open questions',()=>{
 const md=renderRetro({episode:'demo',gate:{ok:true,checkedFrames:1782,overlaps:[]},gateSummary:{runs:5,runsToFirstPass:5,firstOverlaps:57,kinds:{'hidden by Head':3},lastOk:true},renderRuns:2,story:{metrics:{lengthSeconds:58.8,cutsPerMinute:13.3}},qa:{formatDuration:59.4,integratedLUFS:'-14.0',truePeakDBFS:'-1.5'},candidates:['scene2/rig.mjs']});
 assert.match(md,/# Retro: demo/);assert.match(md,/gate runs: 5/);assert.match(md,/57/);assert.match(md,/scene2\/rig\.mjs/);assert.match(md,/Promote/i);assert.match(md,/DEFECTS\.json/);
});

// ---- retro: which scene files does the film really use? (the scaffold copies the whole previous scene, most of it dead)
import {reachableFiles} from '../lib/retro.mjs';
test('reachableFiles follows relative imports from the entry and ignores absolute runtime imports',()=>{
 const files={'main.mjs':"import {a} from './a.mjs';import b from './b.mjs';import {k} from '/runtime/kit.js';",'a.mjs':"import {c} from './c.mjs';",'b.mjs':'','c.mjs':"export const c=1;",'dead.mjs':"import './c.mjs';"};
 const r=reachableFiles((f)=>files[f],'main.mjs');
 assert.deepEqual([...r].sort(),['a.mjs','b.mjs','c.mjs','main.mjs']);
});
test('reachableFiles survives a missing file and an import cycle',()=>{
 const files={'main.mjs':"import './a.mjs';import './gone.mjs';",'a.mjs':"import './main.mjs';"};
 assert.deepEqual([...reachableFiles((f)=>files[f],'main.mjs')].sort(),['a.mjs','main.mjs']);
});
