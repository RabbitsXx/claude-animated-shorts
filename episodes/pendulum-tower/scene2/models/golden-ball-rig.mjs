// The golden pendulum ball rig (carrier of the film). Sculpted in Blender (episodes/pendulum-tower/blender/golden-ball-rig.py), exported to scene2/models/glb/golden-ball-rig.glb.
// Real sizes: ball 5.5 m across (gold, seam belts with bolts, orange bumper ring, hatch), 12-cable bundle on a ceiling mount ring (long state 11.5 m), lifting lug + shackle + anchor block on top,
// four hydraulic dampers 2.8 m long on trestles with pads at the bumper ring.
// Nodes (GLTFLoader turns spaces into underscores; this module finds both spellings): Pivot (origin = ceiling mount point, rotate it to swing the rig) > Mount ring, Cables, Ball > Hook lug > Anchor block, Damper 1..4.
// RULE: ropeLength = visible cable length from the Pivot down to the top of the anchor block (long state 11.5 m). The ball centre hangs ropeLength + 4.3 m below the Pivot (1.55 m lug/shackle/anchor + 2.75 m radius).
// Dampers keep the ball-centre height of the current rope (they swing with the Pivot; use scene.attach to keep them still).
// Exports load() (await once), buildBall(ctx,kit,{ropeLength}) -> {root,pivot,cables,ball,lug,anchor,mount,dampers,setRope(L),ballCentreY(L),ballBottomY(L),ropeLength}.
import {preloadGLB,glbInstance,find} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'golden-ball-rig',name:'Golden pendulum ball rig: 5.5 m gold ball, cable bundle on a ceiling mount, lifting lug, four hydraulic dampers'};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/golden-ball-rig.glb';
export const load=()=>preloadGLB([URL]);
export const LONG=11.5,BALL_R=2.75,CAP=1.55,DROP_EXTRA=BALL_R+CAP;
const nodeBy=(g,n)=>find(g,n)||find(g,n.replace(/ /g,'_'));
export const ballCentreY=(L)=>-(L+DROP_EXTRA);      // relative to the Pivot
export const ballBottomY=(L)=>ballCentreY(L)-BALL_R;
export function buildBall(ctx,kit,{ropeLength=LONG}={}){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Golden ball rig';
 const pivot=nodeBy(g,'Pivot'),cables=nodeBy(g,'Cables'),ball=nodeBy(g,'Ball'),lug=nodeBy(g,'Hook lug'),anchor=nodeBy(g,'Anchor block'),mount=nodeBy(g,'Mount ring');
 const dampers=[1,2,3,4].map(i=>nodeBy(g,'Damper '+i));
 const out={root:g,pivot,cables,ball,lug,anchor,mount,dampers,ropeLength,ballCentreY,ballBottomY};
 out.setRope=(L)=>{out.ropeLength=L;cables.scale.y=L/LONG;ball.position.y=ballCentreY(L);for(const d of dampers)d.position.y=ballCentreY(L);};
 out.setRope(ropeLength);
 kit.finish(g,'prop');
 return out;
}
export async function build(ctx,kit){
 await load();
 const fig=scaleFigure(ctx,{pos:[0,0,4.6]});
 const rig=buildBall(ctx,kit,{ropeLength:LONG});
 const top=-ballBottomY(LONG)+1.45;    // Pivot height: ball bottom 1.45 m above the floor, dampers on trestles on the floor
 // the ceiling plate rests on a sheet ceiling beam, the floor is a slab (the dampers stand on it)
 rig.root.position.set(0,top,0);ctx.scene.add(rig.root);
 const floor=new ctx.THREE.Group();floor.name='Sheet floor';
 kit.rbox(floor,'sheet floor slab',[0,-.15,0],[16,.3,16],.02,kit.mat('#b9b2a4',{rough:.9,name:'concrete sheet floor'}),null,{});
 kit.rbox(floor,'sheet ceiling slab',[0,top+.46,0],[7,.3,7],.02,kit.mat('#b9b2a4',{rough:.9,name:'concrete sheet ceiling'}),null,{noOutline:true});
 ctx.scene.add(floor);
 const view=(p,t,f=34)=>({position:p,target:t,fov:f,subject:t,shadow:8,solar:10});
 return {root:rig.root,size:[16,top+1,16],focus:[0,top*.5,0],
  views:[
   view([15,top*.52,39],[0,top*.5,0],34),                                  // 1 full rig with the figure
   view([4.5,top+ballCentreY(LONG)+.8,12.5],[0,top+ballCentreY(LONG)+.4,0],34), // 2 ball seam belts, bolts, hatch
   view([2.6,top-1.8,7.5],[0,top-2.2,0],38),                               // 3 mount ring and cables
   view([9.5,top+ballCentreY(LONG)-1.0,10.5],[3.9,top+ballCentreY(LONG)-2.4,3.9],38)], // 4 damper bracket
  pose(t){fig.pose(t);rig.pivot.rotation.z=Math.sin(t*1.1)*.01;}};
}
