// Automatic frame QA (studio2/lib/framecheck.mjs): the defects a person used to catch by looking at contact sheets.
// Flat or black frames (camera inside a solid), hard brightness jumps, and a day/night colour script that is too flat.
import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSignalStats,analyzeFrames,lumSwing} from '../lib/framecheck.mjs';

const frame=(t,o={})=>({t,YAVG:120,YLOW:40,YHIGH:210,SATAVG:60,...o});

test('parseSignalStats reads ffmpeg signalstats metadata into one record per frame',()=>{
 const text=`frame:0    pts:0       pts_time:0
lavfi.signalstats.YLOW=30
lavfi.signalstats.YHIGH=220
lavfi.signalstats.YAVG=118.5
lavfi.signalstats.SATAVG=64.2
frame:1    pts:1       pts_time:0.0333333
lavfi.signalstats.YLOW=5
lavfi.signalstats.YHIGH=9
lavfi.signalstats.YAVG=6.1
lavfi.signalstats.SATAVG=2`;
 const s=parseSignalStats(text);
 assert.equal(s.length,2);assert.equal(s[0].YAVG,118.5);assert.ok(Math.abs(s[1].t-.0333333)<1e-6);assert.equal(s[1].YHIGH,9);
});
test('a run of nearly uniform frames is reported as flat with its time range',()=>{
 const stats=[];for(let i=0;i<60;i++)stats.push(frame(i/30,i>=20&&i<30?{YLOW:95,YHIGH:104}:{}));
 const r=analyzeFrames(stats);
 assert.equal(r.flat.length,1);assert.ok(Math.abs(r.flat[0].from-20/30)<1e-9);assert.ok(Math.abs(r.flat[0].to-29/30)<1e-9);assert.equal(r.flat[0].frames,10);assert.equal(r.ok,false);
});
test('black frames are reported separately from flat colour',()=>{
 const stats=[];for(let i=0;i<30;i++)stats.push(frame(i/30,i>=10&&i<14?{YAVG:4,YLOW:2,YHIGH:6}:{}));
 const r=analyzeFrames(stats);assert.equal(r.dark.length,1);assert.equal(r.dark[0].frames,4);assert.equal(r.ok,false);
});
test('a single frame spike is a hard jump to review, but a smooth fade is not',()=>{
 const spike=[];for(let i=0;i<30;i++)spike.push(frame(i/30,i===15?{YAVG:210}:{}));
 assert.equal(analyzeFrames(spike).jumps.length,2,'up and back down');
 const rs=analyzeFrames(spike);assert.equal(rs.flashes.length,1,'a one-frame flash is a defect');assert.equal(rs.ok,false);assert.ok(Math.abs(rs.flashes[0].at-15/30)<1e-9);
 const fade=[];for(let i=0;i<30;i++)fade.push(frame(i/30,{YAVG:60+i*4}));
 assert.equal(analyzeFrames(fade).jumps.length,0);
 assert.equal(analyzeFrames(fade).flashes.length,0);
});
test('a normal film passes',()=>{
 const stats=[];for(let i=0;i<90;i++)stats.push(frame(i/30,{YAVG:110+10*Math.sin(i/9)}));
 const r=analyzeFrames(stats);assert.equal(r.ok,true);assert.equal(r.flat.length+r.dark.length,0);
});
test('lumSwing is the spread of the 5-second window means',()=>{
 const stats=[];for(let i=0;i<300;i++)stats.push(frame(i/30,{YAVG:i<150?140:70}));
 const s=lumSwing(stats,5);assert.ok(Math.abs(s.swing-(140-70)/255)<.01,`swing ${s.swing}`);assert.equal(s.windows.length,2);
});
test('lumSwing with too little footage returns null instead of guessing',()=>{
 assert.equal(lumSwing([frame(0),frame(1/30)],5),null);
});

// ---- sky-dominated frames (found by eye in square-wheel: a camera pointing at a hat and the sky for almost a second)
import {skyShare,skyRuns} from '../lib/framecheck.mjs';
const rgbFrame=(w,h,fn)=>{const a=new Uint8Array(w*h*3);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const [r,g,b]=fn(x,y);const i=(y*w+x)*3;a[i]=r;a[i+1]=g;a[i+2]=b;}return a;};
test('skyShare is the fraction of sky-coloured (blue or white cloud) pixels in the top 70% of the frame',()=>{
 assert.equal(skyShare(rgbFrame(10,10,()=>[40,120,230]),10,10),1);
 assert.equal(skyShare(rgbFrame(10,10,()=>[240,240,240]),10,10),1,'clouds count');
 assert.equal(skyShare(rgbFrame(10,10,()=>[128,128,128]),10,10),0);
 assert.equal(skyShare(rgbFrame(10,10,(x,y)=>y<7?[40,120,230]:[120,160,60]),10,10),1,'sky above, grass below is a normal wide shot, only the top 70% counts');
 assert.ok(Math.abs(skyShare(rgbFrame(10,10,(x,y)=>y<3?[40,120,230]:[120,160,60]),10,10)-3/7)<1e-9);
});
test('skyRuns reports only long runs of sky-dominated frames, with their time range',()=>{
 const shares=[];for(let i=0;i<90;i++)shares.push(i>=30&&i<42?.93:.2);   // 12 frames at 30 fps = 0.4 s of sky
 const r=skyRuns(shares,30,{limit:.8,minSeconds:.3});
 assert.equal(r.length,1);assert.ok(Math.abs(r[0].from-1)<1e-9);assert.equal(r[0].frames,12);
 assert.deepEqual(skyRuns(shares,30,{limit:.8,minSeconds:.5}),[],'a shorter glimpse of sky is fine');
});
