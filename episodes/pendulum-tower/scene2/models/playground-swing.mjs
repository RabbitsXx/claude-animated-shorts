// Playground swing set (Blender): sculpted in episodes/pendulum-tower/blender/playground-swing.py, exported to scene2/models/glb/playground-swing.glb: steel A-frames with cross braces, apex plates, foot plates on concrete footings,
// a top bar 2.4 m high with bar clamps and swivel hangers, two swings with 1.8 m link chains, chain grips and rubber seats 0.45 m above the ground, a rubber safety surface, a low picket fence, a PLAYGROUND sign board (real lettering) and a bench.
// Pivot groups `Swing 1` (x -0.65) and `Swing 2` (x +0.65): the pivot is AT the top bar, rotate about X to swing (chains, grips and seat are inside). Floor `ground safety surface` (top at y 0.04). Origin = ground centre, +z toward the camera.
// Exports load() (await it once), buildSwing(ctx,kit) -> {root,swing1,swing2,pivotY,chain,seatY} and build(ctx,kit).
import {preloadGLB,glbInstance,find} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'playground-swing',name:'Playground swing set (Blender): A-frame, two swings, chains, rubber seats, safety surface, fence, sign and bench'};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/playground-swing.glb';
const fnode=(g,n)=>find(g,n)||find(g,n.replace(/ /g,'_')); // GLTFLoader turns spaces in node names into underscores
export const load=()=>preloadGLB([URL]);
export function buildSwing(ctx,kit){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Playground swing set';
 const swing1=fnode(g,'Swing 1'),swing2=fnode(g,'Swing 2');
 kit.finish(g,'prop');
 return {root:g,swing1,swing2,pivotY:2.4,chain:1.8,seatY:.45};
}
export async function build(ctx,kit){
 await load();
 const fig=scaleFigure(ctx,{pos:[-1.7,.04,1.2],yaw:.5}),m=buildSwing(ctx,kit);ctx.scene.add(m.root);
 const view=(p,t,f=36)=>({position:p,target:t,fov:f,subject:t,shadow:12,solar:14});
 return {root:m.root,size:[7.4,2.6,5.6],focus:[0,1.2,0],
  views:[view([1.2,1.7,9.2],[0,1.15,0],40),view([1.5,.95,2.6],[.65,.85,0],32),view([.5,2.9,2.4],[.65,2.25,0],30),view([-1.2,1.7,5.6],[-3.9,1.2,.9],44)],
  pose(t){fig.pose(t);m.swing1.rotation.x=.55*Math.sin(t*2.2);}};
}
