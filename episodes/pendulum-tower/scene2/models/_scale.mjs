// Scale reference for every model sheet (docs/LESSONS.md section G): the real worker rig, about 1.8 m tall, standing beside the model.
import {makeActorFactory} from '/runtime/actor.js';
import {faceTrack} from '/runtime/face.js';
import {WORKER} from '../cast.mjs';
export function scaleFigure(ctx,{pos=[0,0,0],yaw=0}={}){
 const actor=makeActorFactory(ctx)(WORKER);
 return {actor,pose(t,o={}){actor.pose({pos:o.pos||pos,yaw:o.yaw??yaw,face:faceTrack([[0,o.face||'neutral']],t),hands:o.hands||[{torso:[-.24,.12,.06]},{torso:[.24,.12,.06]}],feet:o.feet});}};
}
