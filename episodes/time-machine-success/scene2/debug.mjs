// Debug wrapper: runs the real film but forces the camera from studio2/.tmp/debugcam.json
import {build as mainBuild} from './main.mjs';
export const authored=true;
export async function build(ctx,args){
 const cam=await(await fetch('/repo/studio2/.tmp/debugcam.json')).json();
 const s=await mainBuild(ctx,args);
 return {update(t){const r=s.update(t);r.camera={...cam};return r;},world:s.world};
}
