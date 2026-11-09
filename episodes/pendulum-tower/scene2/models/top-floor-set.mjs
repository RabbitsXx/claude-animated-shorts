// Model (Blender, episodes/pendulum-tower/blender/top-floor-set.py -> glb/top-floor-set.glb): the top-floor furnishings. Desk 0.74 m high with three drawers, monitor, keyboard, pen pot, papers, phone;
// coffee mug 0.095 m with a Coffee disc; office chair (seat 0.46 m, gas lift, five-star base, casters); full-height window frame 1.2 x 3.2 m with mullions; curtain on a rail; floor lamp; plant pot; the I THINK cardboard sign (0.5 m) on a stick; corded hand drill 0.45 m.
// Origin = floor level, centre of the desk. Exports load() (await once), buildSet(ctx,kit) -> {root, desk, mug, coffee, chair, windowFrame, curtain, curtainRail, lamp, plant, sign, drill} and the sheet build.
// Node origins (the pivots): Coffee mug = base centre, Office chair = floor under the column (faces -z), Window frame = centre of the frame, Curtain = under the rail at the top centre, I THINK sign = grip point on the stick (y 0.45), Drill rig = the grip.
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'top-floor-set',name:'Top-floor furnishings: desk with mug, office chair, window frame, curtain, lamp, plant, I THINK sign, hand drill'};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/top-floor-set.glb';
export const load=()=>preloadGLB([URL]);
const findN=(g,name)=>{const want=name.replace(/ /g,'_');let f=null;g.traverse(o=>{if(!f&&(o.name===name||o.name===want))f=o;});return f;};
export function buildSet(ctx,kit){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Top floor set';
 const N={desk:'Desk',mug:'Coffee mug',coffee:'Coffee',chair:'Office chair',windowFrame:'Window frame',curtain:'Curtain',curtainRail:'Curtain rail',lamp:'Floor lamp',plant:'Plant pot',sign:'I THINK sign',drill:'Drill rig'},o={root:g};
 for(const [k,n] of Object.entries(N)){o[k]=findN(g,n);if(!o[k])throw new Error('top-floor-set: node missing '+n);}
 kit.finish(g,'prop');
 return o;
}
export async function build(ctx,kit){
 await load();
 const fig=scaleFigure(ctx,{pos:[.45,0,2.2],yaw:.3}),s=buildSet(ctx,kit);
 s.curtain.scale.x=.4;s.curtain.position.x=1.35;   // drawn aside so the window frame shows on the sheet
 ctx.scene.add(s.root);
 const view=(p,t,f=34)=>({position:p,target:t,fov:f,subject:t,shadow:8,solar:10});
 return {root:s.root,size:[6,3.2,3.2],focus:[1.0,1.0,0],
  views:[view([-.2,1.3,4.6],[-.2,.85,.6],46),view([1.9,1.15,2.8],[0,.5,.85],34),view([2.5,1.8,4.4],[2.4,1.6,-1.5],44),view([1.6,.5,1.65],[1.0,.14,.8],28)],
  pose(t){fig.pose(t);}};
}
