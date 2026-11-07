import {makeKit} from '/runtime/kit.js';
import {makeActorFactory} from '/runtime/actor.js';
import {buildMachine,buildHammer,buildWallet} from './props.mjs';
import {buildSet} from './set.mjs';
export const authored=true;
export async function build(ctx){
 const kit=makeKit(ctx);
 const set=buildSet(ctx,kit);
 const machine=buildMachine(ctx,kit);ctx.scene.add(machine.root);machine.root.position.set(0,0,0);
 const createActor=makeActorFactory(ctx);
 const hero=createActor({name:'inventor',shirt:'#f3e6c8',pants:'#2f7f86',apron:'#c9863f',goggles:true,hairStyle:'tuft',hair:'#4a3427',sleeves:'#f3e6c8',faceSpec:{smudge:true}});
 const cams=[
  {position:[0,2.2,11],target:[0,1.6,-2],fov:55,shadow:20,solar:22},
  {position:[-2.8,1.5,4.8],target:[-0.6,1.4,0],fov:46,shadow:12,solar:14},
  {position:[3.5,1.2,3.4],target:[-.5,1.9,-.4],fov:50,shadow:12,solar:14},
  {position:[-9,3.4,9],target:[2,2.5,-6],fov:60,shadow:30,solar:34},
  {position:[1.6,1.5,2.8],target:[1.9,1.1,.9],fov:40,shadow:8,solar:10},
 ];
 return {update(t){
  const i=Math.min(cams.length-1,Math.floor(t));
  hero.pose({pos:[-2.4,0,1.2],yaw:.9,face:'proud'});
  machine.setPortal(i===2?.9:0,t*3);
  return {camera:cams[i],reach:0};
 }};
}
