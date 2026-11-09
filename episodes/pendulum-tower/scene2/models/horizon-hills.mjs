// Model 14 (Blender): the horizon (Ref frames: hills layered to the horizon under a blue sky, small clouds): rings of rolling hills in three depths with noise-displaced relief, tree lines, grass tufts, a far skyline with lit windows, a lighthouse and wind turbines,
// so every close shot has a far landmark behind it. Sculpted in Blender (episodes/double-weight-hourly/blender/horizon-hills.py -> glb/horizon-street, -market, -bridge, -dusk, -night: about 7 MB each, same-name same-material meshes merged).
// Real sizes: hills 15-40 m high at 90-180 m, trees 6-12 m, skyline towers 25-70 m at 120 m, lighthouse 30 m tall at 200 m, turbine tower 60 m with 40 m blades. One instance per zone, centred on the zone origin.
// Exports load() and buildHorizon(ctx,kit,{palette:'day'|'dusk'|'night',coast,skyline,seed}) -> {root}; the variant is picked from palette and seed (day 3 street, day 5 market, day 8 bridge, dusk 11, night 11).
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'horizon-hills',name:'Horizon: rolling hill rings, tree lines, a far skyline, a lighthouse and wind turbines (Blender)'};
const D='/repo/episodes/double-weight-hourly/scene2/models/glb/',FILES={'day:3':'horizon-street','day:5':'horizon-market','day:8':'horizon-bridge','dusk:11':'horizon-dusk','night:11':'horizon-night'};
export const load=()=>preloadGLB(Object.values(FILES).map(f=>D+f+'.glb'));
export function buildHorizon(ctx,kit,{palette='day',coast=false,skyline=true,seed=7}={}){
 const {THREE}=ctx,key=palette+':'+seed,file=FILES[key]||(palette==='day'?(skyline?'horizon-street':'horizon-bridge'):FILES[palette+':11']);
 const g=glbInstance(THREE,D+file+'.glb');g.name='Horizon';
 g.traverse(o=>{if(o.isMesh){o.userData.noCollide=true;o.userData.noOutline=true;}});
 kit.finish(g,'prop');
 return {root:g};
}
export async function build(ctx,kit){
 await load();
 const h=buildHorizon(ctx,kit,{palette:'day',seed:3});ctx.scene.add(h.root);const fig=scaleFigure(ctx,{pos:[0,0,4],yaw:3.14});
 const view=(p,t,f=50)=>({position:p,target:t,fov:f,subject:t,shadow:30,solar:60});
 return {root:h.root,size:[360,70,360],focus:[0,15,0],views:[view([0,3,12],[0,18,-100],56),view([0,3,12],[110,20,-60],56),view([0,3,12],[-120,20,50],56),view([0,2,5],[0,4,-30],40)],pose(t){fig.pose(t);}};
}
