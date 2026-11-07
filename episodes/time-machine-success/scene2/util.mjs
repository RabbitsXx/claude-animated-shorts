// Small authoring helpers shared by all beats (pure functions of time).
import {key,ramp,ease,clamp01} from '/runtime/tracks.js';
export {key,ramp,ease,clamp01};
// camera path from keyed positions/targets/fov
export const camPath=(pos,tgt,fov,extra={})=>(t)=>({position:key(pos,t),target:key(tgt,t),fov:typeof fov==='number'?fov:key(fov,t),shadow:8,solar:10,...extra});
// walk from a to b over [t0,t1]; returns root pos, yaw and foot/hand targets for actor.pose (world-space, seek-safe)
export function gait(a,b,t0,t1,t,{stride=.3,rate=7,lift=.11,swing=.22,y=0}={}){
 const k=clamp01((t-t0)/(t1-t0)),x=a[0]+(b[0]-a[0])*k,z=a[2]+(b[2]-a[2])*k,dx=b[0]-a[0],dz=b[2]-a[2],yaw=Math.atan2(dx,dz);
 const moving=k>0&&k<1,ph=(t-t0)*rate,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
 const foot=(side,off)=>{const s=moving?Math.sin(ph+off):0,c=moving?Math.cos(ph+off):0;const f=c*stride,up=Math.max(0,s)*lift;return [x+rx*side*.16+fx*f,y+up,z+rz*side*.16+fz*f];};
 const sw=moving?Math.sin(ph):0;
 return {pos:[x,y,z],yaw,moving,feet:[foot(-1,0),foot(1,Math.PI)],crouch:moving?.025*Math.abs(Math.cos(ph)):0,hands:[{root:[-.2,.7,-sw*swing]},{root:[.2,.7,sw*swing]}],lean:moving?.08:0,k};
}
export const lerp3=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
