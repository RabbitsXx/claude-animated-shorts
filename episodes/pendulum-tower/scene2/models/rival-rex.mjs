// Model 11: Rex the rival developer. Same rig and face as the passed rivals (look 'ref'); costume: slick dark hair, plum jacket, cream shirt, gold tie; a second costume (pale suit, red tie) for opening day. About 1.85 m tall (scale 1.16).
import {makeActorFactory} from '/runtime/actor.js';
import {faceTrack} from '/runtime/face.js';
import {REX,REX_SUIT} from '../cast.mjs';
import {viewsFor} from '/repo/studio2/library/modelsheet.mjs';
export const info={id:'rival-rex',name:'Rex the rival (slick dark hair, plum jacket, pale opening-day suit)'};
export async function build(ctx,kit){
 const make=makeActorFactory(ctx),actor=make(REX),alt=make(REX_SUIT);alt.root.position.set(.9,0,0);
 return {root:actor.root,size:[1.9,1.6,.5],focus:[.45,.95,0],
  views:(()=>{const v=viewsFor([1.9,1.6,.5],[.45,.95,0]);const side={position:[2.9,.95,0],target:[0,.95,0],fov:36,subject:[0,.95,0],shadow:8,solar:10};const close={position:[.1,1.32,2.0],target:[.1,1.28,0],fov:34,subject:[.1,1.28,0],shadow:8,solar:10};return [v[0],v[1],side,close];})(),
  pose(t){const f=faceTrack([[.5,'neutral'],[1.4,'smirk'],[2.5,'laugh'],[3.5,'joy']],t),h=[{torso:[-.24,.12,.06]},{torso:[.24,.12,.06]}];actor.pose({pos:[0,0,0],yaw:0,face:f,hands:h});alt.pose({pos:[.9,0,0],yaw:0,face:f,hands:h});}};
}
