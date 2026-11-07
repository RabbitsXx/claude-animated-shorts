import {makeActorFactory} from '/runtime/actor.js';
import {faceTrack} from '/runtime/face.js';
export const authored=true;
export async function build(ctx){
 const {THREE,scene}=ctx;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#70a82c'}));ground.name='continuous world ground';ground.rotation.x=-Math.PI/2;scene.add(ground);ctx.style(ground,{importance:'background'});
 const createActor=makeActorFactory(ctx);
 const hero=createActor({name:'inventor',skin:'#fffdf4',shirt:'#f3e6c8',pants:'#2f7f86',apron:'#c9863f',goggles:true,hairStyle:'tuft',hair:'#4a3427',sleeves:'#f3e6c8',faceSpec:{smudge:true}});
 return {update(t){
  const names=['neutral','proud','tired','shock','think','smug','laugh','strain'];
  const i=Math.floor(t)%names.length;
  const face=faceTrack([[0,names[i]],[1,names[(i+1)%names.length],'io']],t%1);
  const r=hero.pose({pos:[0,0,0],yaw:.5,face:t%1<.5?names[i]:names[(i+1)%names.length],hands:[hero.local(-.3,.9,.2),hero.local(.3,1.1,.3)],headYaw:.2*Math.sin(t)});
  return {camera:{position:[1.2,1.55,2.1],target:[0,1.25,0],fov:38,shadow:6,solar:8},reach:r.reach};
 }};
}
