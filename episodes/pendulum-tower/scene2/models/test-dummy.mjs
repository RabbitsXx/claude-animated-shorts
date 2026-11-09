// Model (Blender, episodes/pendulum-tower/blender/test-dummy.py -> glb/test-dummy.glb): the yellow and black crash-test dummy, 1.75 m, jointed. Quartered target discs on head and chest, segmented rubber neck, red chest harness with buckle,
// hip and knee joint cylinders with pins, bolted shoulder plates, round hand mitts. Origin on the floor under the feet, faces +z. L = the dummy's own left = +x.
// Exports load() (await once), buildDummy(ctx,kit) -> {root, joints:{pelvis,torso,neck,head,armL,forearmL,armR,forearmR,thighL,shinL,thighR,shinR}, rest, seated(h), stand()}, and the sheet build.
// Rotate joints (rotation.x bends forward/back, z swings sideways); pelvis.position.y is the hip height (standing 0.92).
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'test-dummy',name:'Crash-test dummy (jointed, yellow and black): standing, seated on a 0.46 m seat, head target, joints'};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/test-dummy.glb';
export const load=()=>preloadGLB([URL]);
const findN=(g,name)=>{const want=name.replace(/ /g,'_');let f=null;g.traverse(o=>{if(!f&&(o.name===name||o.name===want))f=o;});return f;};
export const HIP_Y=.92,SEAT_H=.46,SEATED_HIP=SEAT_H+.075;
export function buildDummy(ctx,kit){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Test dummy';
 const J={pelvis:'Pelvis',torso:'Torso',neck:'Neck',head:'Head',armL:'Arm L',forearmL:'Forearm L',armR:'Arm R',forearmR:'Forearm R',thighL:'Thigh L',shinL:'Shin L',thighR:'Thigh R',shinR:'Shin R'},joints={};
 for(const [k,n] of Object.entries(J)){joints[k]=findN(g,n);if(!joints[k])throw new Error('test-dummy: node missing '+n);}
 const rest={};for(const k of Object.keys(joints))rest[k]={p:joints[k].position.clone(),r:joints[k].rotation.clone()};
 const stand=()=>{for(const k of Object.keys(joints)){joints[k].position.copy(rest[k].p);joints[k].rotation.copy(rest[k].r);}};
 // seated at a seat of height h (default 0.46 m): thighs forward, shins down, torso upright, hands on the knees. The hip sits 0.075 m above the seat (thigh radius).
 const seated=(h=SEAT_H)=>{stand();const j=joints;j.pelvis.position.y=h+.075;j.thighL.rotation.x=j.thighR.rotation.x=-Math.PI/2;j.shinL.rotation.x=j.shinR.rotation.x=Math.PI/2;j.armL.rotation.x=j.armR.rotation.x=-.5;j.forearmL.rotation.x=j.forearmR.rotation.x=-.9;return h+.075;};
 kit.finish(g,'prop');
 return {root:g,joints,rest,seated,stand};
}
export async function build(ctx,kit){
 await load();
 const {THREE}=ctx,fig=scaleFigure(ctx,{pos:[-1.1,0,0]});
 const a=buildDummy(ctx,kit),b=buildDummy(ctx,kit);a.root.position.set(-.35,0,0);b.root.position.set(.75,0,.02);
 // a plain 0.46 m box for the seated view; the seated dummy sits at its back half
 const box=new THREE.Group();box.name='Seat box';kit.rbox(box,'seat box',[0,.23,0],[.5,.46,.46],.01,kit.mat('#8a8f99',{rough:.7,name:'seat box'}),null,{});box.position.set(.75,0,.17);
 b.seated();b.root.position.z=0;ctx.scene.add(box,a.root,b.root);
 const view=(p,t,f=34)=>({position:p,target:t,fov:f,subject:t,shadow:8,solar:10});
 return {root:a.root,size:[3,1.8,1.4],focus:[0,.9,0],
  views:[view([-.2,1.0,4.0],[-.3,.88,0],32),view([2.3,1.0,2.4],[.75,.72,.2],34),view([-.35+.55,1.68,.95],[-.35,1.66,0],26),view([-.35+.7,1.0,1.1],[-.35+.095,.78,0],30)],
  pose(t){fig.pose(t);}};
}
