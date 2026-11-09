import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const THREE=await import(pathToFileURL(path.resolve(here,'../../../bridge-test/node_modules/three/build/three.module.js')).href);
const {createCollider}=await import('../runtime/collide.js');
const col=createCollider(THREE);

const solid=(name,geo,pos,scene,userData={})=>{const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial());m.name=name;m.position.set(...pos);Object.assign(m.userData,userData);scene.add(m);return m;};
const ell=(kind,pos,scale,extra={})=>({kind,name:extra.name||kind,matrix:new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion(),new THREE.Vector3(...scale)),...extra});
const actor=(name,ellipsoids)=>({name,collision:()=>({name,visible:true,ellipsoids})});
const run=(scene,actors,allow=[])=>{scene.updateMatrixWorld(true);return col.check({scene,actors,allow});};

test('a torso ellipsoid overlapping a box is reported with the box name and a depth',()=>{
 const scene=new THREE.Scene();solid('console',new THREE.BoxGeometry(.6,1,.5),[0,.5,0],scene);
 const hits=run(scene,[actor('hero',[ell('body',[0,.6,.3],[.17,.3,.12],{name:'torso'})])]);
 assert.equal(hits.length,1);assert.equal(hits[0].actor,'hero');assert.equal(hits[0].mesh,'console');assert.ok(hits[0].depth>.03);
});

test('a body standing clear of every prop produces no hits',()=>{
 const scene=new THREE.Scene();solid('console',new THREE.BoxGeometry(.6,1,.5),[0,.5,0],scene);
 assert.deepEqual(run(scene,[actor('hero',[ell('body',[1.2,.6,0],[.17,.3,.12])])]),[]);
});

test('a body completely inside a larger solid is still caught',()=>{
 const scene=new THREE.Scene();solid('big box',new THREE.BoxGeometry(4,4,4),[0,2,0],scene);
 const hits=run(scene,[actor('hero',[ell('body',[0,2,0],[.1,.1,.1])])]);
 assert.equal(hits.length,1);assert.equal(hits[0].mesh,'big box');
});

test('a thin pole passing through a body is caught even though no pole vertex is inside it',()=>{
 const scene=new THREE.Scene();solid('pole',new THREE.CylinderGeometry(.04,.04,3,10),[0,1.5,0],scene);
 const hits=run(scene,[actor('hero',[ell('body',[0,1.2,0],[.17,.3,.12])])]);
 assert.ok(hits.some(h=>h.mesh==='pole'));
});

test('limb spheres touching a prop at the hand tip are allowed, but a limb crossing it mid-arm is not',()=>{
 const scene=new THREE.Scene();solid('rail',new THREE.BoxGeometry(2,.1,.1),[0,1,0],scene);
 const tip=ell('limb',[0,1,.03],[.02,.02,.02],{tip:true,tipDist:.02});
 const mid=ell('limb',[0,1,0],[.02,.02,.02],{tipDist:.3});
 assert.deepEqual(run(scene,[actor('hero',[tip])]),[]);
 assert.equal(run(scene,[actor('hero',[mid])]).length,1);
});

test('hands may grip (small depth), shoes may rest on a floor, but deep overlap is still reported',()=>{
 const scene=new THREE.Scene();solid('deck',new THREE.BoxGeometry(5,.3,3),[0,.15,0],scene);
 assert.deepEqual(run(scene,[actor('hero',[ell('shoe',[0,.33,0],[.05,.032,.085])])]),[]);
 assert.equal(run(scene,[actor('hero',[ell('shoe',[0,.1,0],[.05,.032,.085])])]).length,1);
 assert.deepEqual(run(scene,[actor('hero',[ell('hand',[0,.33,0],[.036,.036,.036])])]),[]);
});

test('legs buried in a deck are reported (the feet-at-y0-inside-deck bug)',()=>{
 const scene=new THREE.Scene();solid('deck',new THREE.BoxGeometry(5,.3,3),[0,.15,0],scene);
 const lower=[0,.1,.2].map(y=>ell('limb',[0,y,0],[.02,.02,.02],{tipDist:.4}));
 assert.ok(run(scene,[actor('hero',lower)]).length>=1);
});

test('the allow list silences one named actor/mesh pair only',()=>{
 const scene=new THREE.Scene();solid('wooden chair',new THREE.BoxGeometry(.5,.5,.5),[0,.25,0],scene);
 const seat=[actor('dummy',[ell('body',[0,.45,0],[.14,.09,.1])])];
 assert.equal(run(scene,seat).length,1);
 assert.deepEqual(run(scene,seat,[['dummy','chair']]),[]);
 assert.equal(run(scene,[actor('hero',[ell('body',[0,.45,0],[.14,.09,.1])])],[['dummy','chair']]).length,1);
});

test('outline hulls, decals and nocollide meshes never count as solids',()=>{
 const scene=new THREE.Scene();
 solid('hull',new THREE.BoxGeometry(2,2,2),[0,1,0],scene,{outline:true});
 solid('decal',new THREE.PlaneGeometry(2,2),[0,1,0],scene);
 solid('hill',new THREE.BoxGeometry(2,2,2),[0,1,0],scene,{noCollide:true});
 assert.deepEqual(run(scene,[actor('hero',[ell('body',[0,1,0],[.17,.3,.12])])]),[]);
});

test('two actors whose torsos overlap are reported as an actor pair',()=>{
 const scene=new THREE.Scene();
 const a=actor('hero',[ell('body',[0,1,0],[.17,.3,.12],{name:'torso'})]),b=actor('rival',[ell('body',[.1,1,0],[.17,.3,.12],{name:'torso'})]);
 const hits=run(scene,[a,b]);
 assert.ok(hits.some(h=>h.actor==='hero'&&h.mesh==='actor:rival'));
});

test('an allow entry may be limited to one body part (a held tool may touch the limb but not the torso)',()=>{
 const scene=new THREE.Scene();solid('hammer grip',new THREE.BoxGeometry(.05,.4,.05),[0,1,0],scene);
 const limb=ell('limb',[0,1,0],[.02,.02,.02],{tipDist:.3}),torso=ell('body',[0,1,0],[.17,.3,.12],{name:'torso'});
 const allow=[['hero','hammer','limb']];
 assert.deepEqual(run(scene,[actor('hero',[limb])],allow),[]);
 assert.ok(run(scene,[actor('hero',[torso])],allow).length>=1);
});

// prop against prop (the rival's lever sitting on its dial bezel)
test('a rod that passes through a ring is reported as a prop-to-prop overlap',()=>{
 const scene=new THREE.Scene();
 solid('ring',new THREE.TorusGeometry(.14,.02,8,24),[0,0,0],scene);
 const rod=solid('rod',new THREE.CylinderGeometry(.022,.022,.56,10),[.14,0,0],scene);rod.rotation.x=Math.PI/2;
 const hits=col.checkPairs({scene,actors:[]});
 assert.ok(hits.some(h=>(h.part==='rod'&&h.mesh==='ring')||(h.part==='ring'&&h.mesh==='rod')),JSON.stringify(hits));
});

test('props that sit apart are not a prop-to-prop overlap',()=>{
 const scene=new THREE.Scene();
 solid('ring',new THREE.TorusGeometry(.14,.02,8,24),[0,0,0],scene);
 const rod=solid('rod',new THREE.CylinderGeometry(.022,.022,.56,10),[.4,0,0],scene);rod.rotation.x=Math.PI/2;
 assert.deepEqual(col.checkPairs({scene,actors:[]}),[]);
});

test('two meshes under one prop group are one assembly, not a prop-to-prop overlap',()=>{
 const scene=new THREE.Scene();
 const group=new THREE.Group();group.name='pod';scene.add(group);
 const a=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());a.name='pod body';a.position.set(0,.5,0);group.add(a);
 const b=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),new THREE.MeshBasicMaterial());b.name='pod nose';b.position.set(0,.5,.3);group.add(b);
 assert.deepEqual(col.checkPairs({scene,actors:[]}),[]);
});

test('two separate prop groups that interpenetrate are still reported',()=>{
 const scene=new THREE.Scene();
 const aGroup=new THREE.Group();aGroup.name='pod';scene.add(aGroup);
 const a=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());a.name='pod body';a.position.set(0,.5,0);aGroup.add(a);
 const bGroup=new THREE.Group();bGroup.name='pick';scene.add(bGroup);
 const b=new THREE.Mesh(new THREE.BoxGeometry(.6,.6,.6),new THREE.MeshBasicMaterial());b.name='pick head';b.position.set(0,.5,.3);bGroup.add(b);
 const hits=col.checkPairs({scene,actors:[]});
 assert.ok(hits.length>=1,JSON.stringify(hits));
});

test('a part nested inside its own parent mesh is not counted as a prop pair',()=>{
 const scene=new THREE.Scene();
 const parent=solid('parent',new THREE.BoxGeometry(1,1,1),[0,0,0],scene);
 const child=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial());child.name='child';parent.add(child);
 assert.deepEqual(col.checkPairs({scene,actors:[]}),[]);
});

test('an allow entry named as [props, mesh, part] silences that prop pair',()=>{
 const scene=new THREE.Scene();
 solid('ring',new THREE.TorusGeometry(.14,.02,8,24),[0,0,0],scene);
 const rod=solid('rod',new THREE.CylinderGeometry(.022,.022,.56,10),[.14,0,0],scene);rod.rotation.x=Math.PI/2;
 assert.deepEqual(col.checkPairs({scene,actors:[],allow:[['props','ring','rod']]}),[]);
});

// shot: the camera must show the subject, centred and unhidden
const shotCam={position:[0,1,5],target:[0,1,0],fov:40};
test('a shot with no declared subject is reported',()=>{
 const scene=new THREE.Scene();
 const hits=col.checkShot({scene,actors:[],camera:shotCam,subject:undefined});
 assert.equal(hits.length,1);assert.equal(hits[0].mesh,'none declared');
});

test('a subject at the centre of an empty frame is clean',()=>{
 const scene=new THREE.Scene();
 assert.deepEqual(col.checkShot({scene,actors:[],camera:shotCam,subject:[0,1,0]}),[]);
});

test('a subject outside the centre of the frame is reported as off-centre',()=>{
 const scene=new THREE.Scene();
 const hits=col.checkShot({scene,actors:[],camera:shotCam,subject:[1.2,1,0]});
 assert.equal(hits.length,1);assert.equal(hits[0].mesh,'off-centre');
});

test('an object between the camera and the subject is reported as hiding it',()=>{
 const scene=new THREE.Scene();
 solid('lever rod',new THREE.BoxGeometry(.1,.6,.1),[0,1,2.5],scene);
 const hits=col.checkShot({scene,actors:[],camera:shotCam,subject:[0,1,0]});
 assert.equal(hits.length,1);assert.equal(hits[0].mesh,'hidden by lever rod');
});

test('a subject at its own head/pod surface is not reported as hidden by that body',()=>{
 const scene=new THREE.Scene();
 solid('pod body',new THREE.SphereGeometry(.5,24,16),[0,1,0],scene);
 assert.deepEqual(col.checkShot({scene,actors:[],camera:shotCam,subject:[0,1,0]}),[]);
});

test('the actor the subject belongs to is not counted as hiding it, but another actor in front still is',()=>{
 const scene=new THREE.Scene();
 const own=new THREE.Group(),head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),new THREE.MeshBasicMaterial());head.name='Head';head.position.set(0,1,0);own.add(head);scene.add(own);
 const ownActor={name:'rival',root:own,collision:()=>({name:'rival',visible:true,ellipsoids:[ell('body',[0,1,0],[.2,.2,.2],{name:'Head'})]})};
 assert.deepEqual(col.checkShot({scene,actors:[ownActor],camera:shotCam,subject:[0,1,0]}),[]);
 const other=new THREE.Group(),blocker=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),new THREE.MeshBasicMaterial());blocker.name='Head';blocker.position.set(0,1,2.5);other.add(blocker);scene.add(other);
 const otherActor={name:'crowd',root:other,collision:()=>({name:'crowd',visible:true,ellipsoids:[ell('body',[0,1,2.5],[.3,.3,.3],{name:'Head'})]})};
 const hits=col.checkShot({scene,actors:[ownActor,otherActor],camera:shotCam,subject:[0,1,0]});
 assert.equal(hits.length,1);assert.equal(hits[0].mesh,'hidden by Head');
});

// camera inside a solid: the frame is black or one flat colour (happened 4 times in square-wheel: crowd member, cap, hill slab, wheel)
const hereCam={position:[0,1,0],target:[0,1,-5],fov:40};
test('a camera inside a solid prop is reported',()=>{
 const scene=new THREE.Scene();solid('crate',new THREE.BoxGeometry(2,2,2),[0,1,0],scene);
 const hits=col.checkShot({scene,actors:[],camera:hereCam,subject:[0,1,-5]});
 assert.ok(hits.some(h=>h.part==='camera'&&h.mesh==='camera inside crate'),JSON.stringify(hits));
});
test('a camera just outside a solid is not reported',()=>{
 const scene=new THREE.Scene();solid('crate',new THREE.BoxGeometry(2,2,2),[0,1,3],scene);
 const hits=col.checkShot({scene,actors:[],camera:hereCam,subject:[0,1,-5]});
 assert.ok(!hits.some(h=>h.part==='camera'),JSON.stringify(hits));
});
test('a camera inside an actor body is reported',()=>{
 const scene=new THREE.Scene();
 const a={name:'crowd3',root:new THREE.Group(),collision:()=>({name:'crowd3',visible:true,ellipsoids:[ell('body',[0,1,0],[.4,.5,.3],{name:'Rounded shirt'})]})};
 const hits=col.checkShot({scene,actors:[a],camera:hereCam,subject:[0,1,-5]});
 assert.ok(hits.some(h=>h.part==='camera'&&/camera inside crowd3/.test(h.mesh)),JSON.stringify(hits));
});
test('a camera inside a decor mesh (ground, hill) is still reported when it is solid geometry, unless allowed',()=>{
 const scene=new THREE.Scene();solid('crate',new THREE.BoxGeometry(2,2,2),[0,1,0],scene);
 const hits=col.checkShot({scene,actors:[],allow:[['shot','^crate$']],camera:hereCam,subject:[0,1,-5]});
 assert.ok(!hits.some(h=>h.part==='camera'),JSON.stringify(hits));
});
test('a camera inside a sky dome (a back-face sphere) is fine',()=>{
 const scene=new THREE.Scene();
 const dome=new THREE.Mesh(new THREE.SphereGeometry(120,16,8),new THREE.MeshBasicMaterial({side:THREE.BackSide}));dome.name='sky clouds';scene.add(dome);
 const huge=solid('far block',new THREE.BoxGeometry(90,90,90),[0,0,0],scene);
 const hits=col.checkShot({scene,actors:[],camera:hereCam,subject:[0,1,-5]});
 assert.ok(!hits.some(h=>h.part==='camera'),JSON.stringify(hits));
});

// ---- grips: a hand must be on the prop it is meant to hold; intents: the shot must show what the moment is about
test('checkGrips: a hand beyond its limit is one row with the distance as depth; a hand on the prop is silent',()=>{
 const h=col.checkGrips([{id:'pete-mug',err:.02,tol:.06},{id:'pete-lever',err:.31,tol:.06,at:[1,2,3]}]);
 assert.equal(h.length,1);assert.equal(h[0].actor,'grip');assert.equal(h[0].part,'pete-lever');assert.equal(h[0].depth,.31);assert.match(h[0].mesh,/hand is off the prop/);
 assert.deepEqual(col.checkGrips(undefined),[]);
});
const camAt=(pos,target,fov=40)=>({position:pos,target,fov,far:900});
const sphere=(name,pos,r,scene)=>solid(name,new THREE.SphereGeometry(r,16,12),pos,scene);
test('measureIntent: a thing in the title-safe middle, big enough and unhidden passes',()=>{
 const scene=new THREE.Scene();const ball=sphere('ball',[0,0,0],1,scene);
 const r=col.measureIntent({scene,camera:camAt([0,0,8],[0,0,0]),track:{ball:{obj:ball}},intent:{id:'t',primary:'ball',show:[{name:'ball'}]}});
 assert.equal(r.hits.length,0);assert.equal(r.rows[0].ok,true);assert.ok(r.rows[0].frac>.1);
});
test('measureIntent: off the middle, too small, hidden, not visible and not tracked each give a different reason',()=>{
 const scene=new THREE.Scene();const ball=sphere('ball',[0,0,0],1,scene),far=sphere('far',[0,0,-80],.3,scene);
 const run=(cam,track,show,primary)=>col.measureIntent({scene,camera:cam,track,intent:{id:'t',primary,show}}).hits.map(h=>h.mesh).join('|');
 assert.match(run(camAt([0,0,8],[8,0,0]),{ball:{obj:ball}},[{name:'ball'}],'ball'),/ball (off the title-safe middle|out of frame)/);
 assert.match(run(camAt([0,0,8],[0,0,0]),{far:{obj:far}},[{name:'far'}],'far'),/far too small/);
 sphere('wall',[0,0,4],1.6,scene).geometry.computeBoundingSphere();
 assert.match(run(camAt([0,0,8],[0,0,0]),{ball:{obj:ball}},[{name:'ball'}],'ball'),/ball hidden by wall/);
 ball.visible=false;assert.match(run(camAt([0,0,8],[0,0,0]),{ball:{obj:ball}},[{name:'ball'}],'ball'),/ball is not visible/);
 assert.match(run(camAt([0,0,8],[0,0,0]),{},[{name:'ghost'}],'ghost'),/ghost is not tracked/);
});

test('measureIntent: a big thing (a tower) counts by how much of the picture it covers, also when the camera is close to it',()=>{
 const scene=new THREE.Scene();const tower=solid('tower',new THREE.BoxGeometry(10,90,10),[0,45,0],scene);
 const run=(cam)=>col.measureIntent({scene,camera:cam,track:{tower:{obj:tower,big:true}},intent:{id:'t',primary:'tower',show:[{name:'tower'}]}});
 assert.equal(run(camAt([0,40,40],[0,45,0],50)).hits.length,0,'a tower filling the frame');
 const near=run(camAt([0,30,7],[0,30,0],50));assert.equal(near.hits.length,0);assert.ok(near.rows[0].frac>.5,'close to the facade it still covers the picture');
 assert.match(run(camAt([0,5,200],[0,5,0],20)).hits.map(h=>h.mesh).join(''),/tower covers only/);
});
