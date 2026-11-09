import test from 'node:test';
import assert from 'node:assert/strict';
import {splitShots,shotTravel,judgeCameraPlan} from '../lib/camera-plan.mjs';

const still=(n,p=[0,1.5,5])=>Array.from({length:n},()=>({p:[...p],t:[0,1.5,0],fov:50}));
const push=(n,f)=>Array.from({length:n},(_,i)=>({p:[0,1.5,5*(1-f*i/(n-1))],t:[0,1.5,0],fov:50}));
const orbit=(n,rad)=>Array.from({length:n},(_,i)=>{const a=rad*i/(n-1);return {p:[5*Math.sin(a),1.5,5*Math.cos(a)],t:[0,1.5,0],fov:50};});

test('a hard cut splits the path into shots',()=>{
 const cams=[...still(60),...still(60,[20,1.5,5])];
 const shots=splitShots(cams);
 assert.equal(shots.length,2);assert.deepEqual(shots.map(s=>s.length),[60,60]);
});

test('a still shot has no travel; a push and an orbit have some',()=>{
 assert.ok(shotTravel(still(120),30)<.005);
 assert.ok(shotTravel(push(120,.1),30)>.02);
 assert.ok(shotTravel(orbit(120,.5),30)>.05);
});

test('a film of still shots fails and names the shot; a travelling film passes',()=>{
 const far=(a)=>a.map(c=>({...c,p:[c.p[0]+30,c.p[1],c.p[2]],t:[30,1.5,0]}));
 const bad=judgeCameraPlan([...still(120),...far(orbit(120,.5))],{fps:30,framing:false});
 assert.equal(bad.ok,false);
 assert.match(bad.problems[0],/0\.0 s/);
 const good=judgeCameraPlan([...orbit(120,.5),...orbit(120,-.5).map(c=>({...c,p:[c.p[0]+30,c.p[1],c.p[2]],t:[30,1.5,0]})),],{fps:30,framing:false});
 assert.equal(good.ok,true,good.problems.join(';'));
});

test('very short shots are ignored',()=>{
 assert.equal(judgeCameraPlan([...orbit(120,.5),...still(10,[40,1.5,5])],{fps:30,framing:false}).ok,true);
});

test('a hero that is a speck fails, a close hero passes',()=>{
 const far=judgeCameraPlan(orbit(120,.5),{fps:30}),near=judgeCameraPlan(Array.from({length:120},(_,i)=>{const a=.5*i/119;return {p:[2*Math.sin(a),1.5,2*Math.cos(a)],t:[0,1.5,0],fov:50};}),{fps:30});
 assert.ok(far.problems.some(p=>/too small/.test(p)));
 assert.ok(!near.problems.some(p=>/too small/.test(p)),near.problems.join(';'));
 assert.ok(near.head.median>.09);
});
