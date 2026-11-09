import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const THREE=await import(pathToFileURL(path.resolve(here,'../../../bridge-test/node_modules/three/build/three.module.js')).href);
const {measureDressing}=await import('../runtime/dressing.js');
const {judgeShot,judgeFilm,LIMITS}=await import('../lib/scene-quality.mjs');

// scene > zone > prop > part, as in every film: the camera sits at z=10 looking down -z
const cam={position:[0,1.5,10],target:[0,1.5,0],fov:50};
const part=(parent,name,pos,size,color='#888')=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color}));m.name=name;m.position.set(...pos);parent.add(m);return m;};
const prop=(zone,name,pos,size,n=1)=>{const g=new THREE.Group();g.name=name;g.position.set(...pos);zone.add(g);for(let i=0;i<n;i++)part(g,name+' part '+i,[0,i*.05,0],size);return g;};
const world=(spec)=>{const scene=new THREE.Scene(),zone=new THREE.Group();zone.name='zone';scene.add(zone);spec(zone,scene);scene.updateMatrixWorld(true);return scene;};

test('props are counted once each, by the prop group, not by their parts',()=>{
 const scene=world(z=>{prop(z,'booth',[-1.5,1,0],[1.4,2,1],6);prop(z,'lamp',[1.5,1,2],[.6,2,.6],3);});
 const m=measureDressing(THREE,{scene,camera:cam});
 assert.equal(m.count,2);assert.deepEqual(m.props.map(p=>p.name).sort(),['booth','lamp']);
});

test('a prop behind the camera or outside the frame is not counted',()=>{
 const scene=world(z=>{prop(z,'behind',[0,1,14],[2,2,2]);prop(z,'far left',[-60,1,0],[2,2,2]);prop(z,'visible',[0,1,0],[2,2,2]);});
 assert.deepEqual(measureDressing(THREE,{scene,camera:cam}).props.map(p=>p.name),['visible']);
});

test('depth bands: near, mid, far and very far props fill separate layers',()=>{
 const scene=world(z=>{prop(z,'near',[1.2,1,6],[1.4,2,1.4]);prop(z,'mid',[-2,2,-8],[3,4,3]);prop(z,'far',[0,5,-40],[20,10,4]);prop(z,'horizon',[0,10,-120],[120,30,4]);});
 const m=measureDressing(THREE,{scene,camera:cam});
 assert.equal(m.layers,4);assert.deepEqual(m.bands.map(b=>b>0),[true,true,true,true]);
});

test('a tiny speck is ignored: area under the minimum does not count as a prop',()=>{
 const scene=world(z=>{prop(z,'speck',[0,1.5,0],[.05,.05,.05]);});
 assert.equal(measureDressing(THREE,{scene,camera:cam}).count,0);
});

test('actors, the sky dome and outline hulls never count as props',()=>{
 const scene=world(z=>{prop(z,'booth',[0,1,0],[2,2,2]);const sky=part(z,'Sky dome',[0,0,0],[300,300,300]);sky.material.side=THREE.BackSide;const hull=prop(z,'booth outline',[0,1,0],[2.1,2.1,2.1]);hull.children[0].userData.outline=true;});
 const hero=new THREE.Group();hero.name='hero';part(hero,'Body',[0,1,3],[.4,1,.3]);scene.add(hero);scene.updateMatrixWorld(true);
 const m=measureDressing(THREE,{scene,camera:cam,actors:[{root:hero}]});
 assert.deepEqual(m.props.map(p=>p.name),['booth']);
});

test('terrain in view sets the backdrop flag; none does not',()=>{
 const withT=world(z=>{prop(z,'Terrain',[0,0,-50],[200,20,40]);prop(z,'booth',[0,1,0],[2,2,2]);});
 assert.equal(measureDressing(THREE,{scene:withT,camera:cam}).backdrop,true);
 const without=world(z=>{prop(z,'booth',[0,1,0],[2,2,2]);});
 assert.equal(measureDressing(THREE,{scene:without,camera:cam}).backdrop,false);
});

test('a camera inside a prop box is an interior and counts distinct part names',()=>{
 const scene=world(z=>{const room=prop(z,'cabin',[0,1.5,5],[12,6,30]);for(let i=0;i<12;i++)part(room,'seat '+i,[(i%4-1.5)*1.0,-1.2,(i/4|0)*-1.5-3],[.8,.6,.8]);});
 const m=measureDressing(THREE,{scene,camera:cam});
 assert.equal(m.interior,true);assert.ok(m.parts>=10,'parts '+m.parts);
});

const frame=(o)=>({count:7,layers:3,backdrop:true,interior:false,parts:40,bands:[2,3,1,1],...o});
test('judgeShot: a dressed outdoor shot passes, a bare one fails with reasons',()=>{
 assert.deepEqual(judgeShot(frame({}),{closeUp:false}),[]);
 const bad=judgeShot(frame({count:2,layers:1,backdrop:false}),{closeUp:false});
 assert.ok(bad.some(s=>/props/.test(s)));assert.ok(bad.some(s=>/depth layers/.test(s)));assert.ok(bad.some(s=>/backdrop/.test(s)));
});

test('judgeShot: a close-up needs fewer props but still two depth layers and a backdrop',()=>{
 assert.deepEqual(judgeShot(frame({count:LIMITS.close.minProps,layers:2}),{closeUp:true}),[]);
 assert.ok(judgeShot(frame({count:LIMITS.close.minProps-1,layers:2}),{closeUp:true}).length>0);
 assert.ok(judgeShot(frame({layers:1}),{closeUp:true}).some(s=>/depth layers/.test(s)));
});

test('judgeShot: an interior is judged on parts and layers, not on a backdrop',()=>{
 assert.deepEqual(judgeShot(frame({interior:true,backdrop:false,count:1,parts:LIMITS.interior.minParts}),{closeUp:false}),[]);
 assert.ok(judgeShot(frame({interior:true,backdrop:false,count:1,parts:3}),{closeUp:false}).some(s=>/parts/.test(s)));
});

test('judgeFilm: every beat key frame is judged and the failing beats are listed',()=>{
 const rows=[{t:1,dress:frame({})},{t:5,dress:frame({count:1,layers:1,backdrop:false})},{t:9,dress:frame({})}];
 const r=judgeFilm(rows,[{beat:1,t:1,closeUp:false},{beat:2,t:5,closeUp:false},{beat:3,t:9,closeUp:true}]);
 assert.equal(r.ok,false);assert.deepEqual(r.failures.map(f=>f.beat),[2]);
 assert.equal(judgeFilm(rows,[{beat:1,t:1}]).ok,true);
});

test('judgeFilm: a key time with no measured frame is a failure, not a silent pass',()=>{
 const r=judgeFilm([{t:1,dress:frame({})}],[{beat:1,t:1},{beat:2,t:50}]);
 assert.equal(r.ok,false);assert.match(r.failures[0].problems[0],/no measured frame/);
});

test('a prop cut by the near plane keeps its true small footprint instead of filling the frame',()=>{
 const scene=world(z=>{prop(z,'long fence',[.5,1,10.2],[.3,2,8]);prop(z,'booth',[0,1,0],[2,2,2]);});
 const fence=measureDressing(THREE,{scene,camera:cam}).props.find(p=>p.name==='long fence');
 assert.ok(fence&&fence.area<.6,'fence area '+(fence&&fence.area));
});

test('judgeShot: ten trees are one kind, a shot needs several kinds of prop',()=>{
 assert.ok(judgeShot(frame({count:10,kinds:1}),{closeUp:false}).some(s=>/kinds of prop/.test(s)));
 assert.deepEqual(judgeShot(frame({count:10,kinds:LIMITS.wide.minKinds}),{closeUp:false}),[]);
});

test('measuring an interior leaves every material side exactly as it was (shared materials)',()=>{
 const scene=world(z=>{const room=prop(z,'cabin',[0,1.5,5],[12,6,30]);const shared=room.children[0].material;for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),shared);m.position.set(i-1,-1,-2);room.add(m);}});
 const mats=new Set();scene.traverse(o=>{if(o.isMesh)mats.add(o.material);});
 measureDressing(THREE,{scene,camera:cam});
 for(const m of mats)assert.equal(m.side,THREE.FrontSide);
});

test('a huge set piece (over 20 m) is split into the props it contains, one level down',()=>{
 const scene=world(z=>{const block=new THREE.Group();block.name='Street block';z.add(block);for(const [n,x,zz] of [['Kiosk',-2,-6],['Lamp',2,-9],['Car',-1,-14],['Hedge',3,-20]]){const p=new THREE.Group();p.name=n;p.position.set(x,1,zz);block.add(p);part(p,n+' body',[0,0,0],[1.6,2,1.6]);}
  part(block,'long wall',[0,2,-60],[60,6,1]);});
 const m=measureDressing(THREE,{scene,camera:cam});
 assert.ok(['Kiosk','Lamp','Car','Hedge'].every(n=>m.props.some(p=>p.name===n)),JSON.stringify(m.props.map(p=>p.name)));
});

test('judgeShot: an interior close-up (hero fills the frame) needs fewer parts and one layer',()=>{
 assert.deepEqual(judgeShot(frame({interior:true,backdrop:false,count:1,layers:1,parts:LIMITS.interiorClose.minParts}),{closeUp:true}),[]);
 assert.ok(judgeShot(frame({interior:true,backdrop:false,count:1,layers:1,parts:LIMITS.interiorClose.minParts-1}),{closeUp:true}).some(s=>/parts/.test(s)));
});

test('backdrop: a far landmark that fills at least 2 % of the frame counts, a far speck does not',()=>{
 const big=world(z=>{prop(z,'tower',[0,15,-45],[12,30,12]);prop(z,'booth',[0,1,0],[2,2,2]);});
 assert.equal(measureDressing(THREE,{scene:big,camera:cam}).backdrop,true);
 const speck=world(z=>{prop(z,'far hut',[0,1.5,-45],[2,2,2]);prop(z,'booth',[0,1,0],[2,2,2]);});
 assert.equal(measureDressing(THREE,{scene:speck,camera:cam}).backdrop,false);
});

test('an awning or balcony over the camera is not a ceiling: only a roof over most of the area makes an interior',()=>{
 const scene=world(z=>{prop(z,'wall left',[-6,2,5],[.3,6,30]);prop(z,'wall right',[6,2,5],[.3,6,30]);prop(z,'wall back',[0,2,-10],[12,6,.3]);prop(z,'awning',[1.5,3.0,10],[.8,.1,4]);});
 assert.equal(measureDressing(THREE,{scene,camera:cam}).interior,false);
 const room=world(z=>{prop(z,'wall left',[-6,2,5],[.3,6,30]);prop(z,'wall right',[6,2,5],[.3,6,30]);prop(z,'wall back',[0,2,-10],[12,6,.3]);prop(z,'ceiling',[0,3.2,5],[12,.2,30]);});
 assert.equal(measureDressing(THREE,{scene:room,camera:cam}).interior,true);
});
