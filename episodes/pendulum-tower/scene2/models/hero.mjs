// Model 1: the winner. A 2D drawing standing in the 3D world (look 'ref').
import {makeActorFactory} from '/runtime/actor.js';
import {faceTrack} from '/runtime/face.js';
import {WINNER} from '../cast.mjs';
import {viewsFor} from '/repo/studio2/library/modelsheet.mjs';
export const info={id:'hero',name:'The winner'};
export async function build(ctx){
 const actor=makeActorFactory(ctx)(WINNER);
 return {root:actor.root,size:[.7,1.55,.4],focus:[0,1.0,0],
  views:(()=>{const v=viewsFor([.7,1.55,.4],[0,1.0,0]);const close=(y)=>({position:[0,1.27,2.0],target:[0,1.23,0],fov:34,subject:[0,1.23,0],shadow:8,solar:10});const side={position:[2.6,.95,0],target:[0,.95,0],fov:36,subject:[0,.95,0],shadow:8,solar:10};return [v[0],v[1],side,close()];})(),
  pose(t){actor.pose({pos:[0,0,0],yaw:0,face:faceTrack([[.5,'neutral'],[1.4,'neutral'],[1.5,'grin'],[2.4,'grin'],[2.5,'smirk'],[3.4,'smirk'],[3.5,'laugh']],t),hands:[{torso:[-.24,.12,.06]},{torso:[.24,.12,.06]}]});}};
}
