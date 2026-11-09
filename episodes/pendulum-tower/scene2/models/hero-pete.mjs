// Model 10: Pete the tower owner. Same rig, face and tuft as the passed heroes (look 'ref'); costume: red cap, cream shirt, blue overalls with a red P emblem. About 1.98 m x 1.1 / 1.12 = 1.77 m tall (scale 1.1).
import {makeActorFactory} from '/runtime/actor.js';
import {faceTrack} from '/runtime/face.js';
import {PETE} from '../cast.mjs';
import {viewsFor} from '/repo/studio2/library/modelsheet.mjs';
export const info={id:'hero-pete',name:'Pete the tower owner (red cap, cream shirt, blue overalls, red P emblem)'};
export async function build(ctx,kit){
 const actor=makeActorFactory(ctx)(PETE);
 return {root:actor.root,size:[.9,1.55,.5],focus:[.1,.95,0],
  views:(()=>{const v=viewsFor([.9,1.55,.5],[.1,.95,0]);const side={position:[2.6,.95,0],target:[0,.95,0],fov:36,subject:[0,.95,0],shadow:8,solar:10};const close={position:[.1,1.27,2.0],target:[.1,1.23,0],fov:34,subject:[.1,1.23,0],shadow:8,solar:10};return [v[0],v[1],side,close];})(),
  pose(t){actor.pose({pos:[0,0,0],yaw:0,face:faceTrack([[.5,'neutral'],[1.4,'neutral'],[1.5,'shock'],[2.4,'shock'],[2.5,'smirk'],[3.4,'smirk'],[3.5,'joy']],t),hands:[{torso:[-.24,.12,.06]},{torso:[.24,.12,.06]}]});}};
}
