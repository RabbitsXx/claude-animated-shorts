// Model (Blender, episodes/pendulum-tower/blender/crane-winch.py -> glb/crane-winch.glb), two things in one file:
// (1) node Crane at the origin: yellow lattice-boom crawler crane (76-pad tracks, slewing ring, deck, counterweight blocks with hazard stripes, cab, A-frame mast), Boom 60 m up-left at 70 degrees (foot pin at x -2.9, y 3.0; the crane faces -x, operator side +z),
//     Hoist rope + Hook block (origin = top sheave, rests 9.5 m under the boom tip, safety-latch hook, throat 0.65 m), and a ground control station at (-9, 6.5) with the Control lever (pivot at its base axle y 0.24, grip top 1.05 m; pull = rotation.x).
// (2) node Winch 12 m to +x (stand-alone: set winch.position anywhere): frame, Winch drum (flanges 1.0 m, spins about x at y 1.0), Winch crank (pivot at the axle, arm 0.4 m, handle axis at 1.0 m when horizontal), Ratchet pawl (pivot on its pin), rope tail with a hook.
// Exports load() (await once), buildCraneWinch(ctx,kit) -> {root, crane, boom, hookBlock, hoistRope, lever, winch, drum, crank, pawl, setDrop(d), luff(rad), pull(a), spin(a)} and the sheet build.
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'crane-winch',name:'Crawler crane with hook block and ground control lever, and a hand-crank winch with drum, ratchet and crank'};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/crane-winch.glb';
export const load=()=>preloadGLB([URL]);
const findN=(g,name)=>{const want=name.replace(/ /g,'_');let f=null;g.traverse(o=>{if(!f&&(o.name===name||o.name===want))f=o;});return f;};
export const DROP=9.45;   // metres from the tip sheave to the top sheave of the hook block as exported
export function buildCraneWinch(ctx,kit){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Crane and winch';
 const N={crane:'Crane',boom:'Boom',hookBlock:'Hook block',hoistRope:'Hoist rope',lever:'Control lever',winch:'Winch',drum:'Winch drum',crank:'Winch crank',pawl:'Ratchet pawl'},o={root:g};
 for(const [k,n] of Object.entries(N)){o[k]=findN(g,n);if(!o[k])throw new Error('crane-winch: node missing '+n);}
 const topY=o.hoistRope.position.y;
 // lower or raise the hook block: d = metres below the tip sheave (rope stretches with it)
 o.setDrop=d=>{o.hookBlock.position.y=topY-d;o.hoistRope.scale.y=d/DROP;};
 o.luff=a=>{o.boom.rotation.z=a;};      // raises/lowers the boom about the foot pin (pendants and mast stay)
 o.pull=a=>{o.lever.rotation.x=a;};     // control lever: positive tilts the grip toward +z (toward the operator)
 o.spin=a=>{o.drum.rotation.x=a;o.crank.rotation.x=a;};
 kit.finish(g,'prop');
 return o;
}
export async function build(ctx,kit){
 await load();
 const f1=scaleFigure(ctx,{pos:[-10.4,0,7.3],yaw:.5}),f2=scaleFigure(ctx,{pos:[11.55,0,1.45],yaw:.6}),s=buildCraneWinch(ctx,kit);
 ctx.scene.add(s.root);
 const view=(p,t,f=34)=>({position:p,target:t,fov:f,subject:t,shadow:8,solar:10});
 return {root:s.root,size:[40,62,14],focus:[-5,25,0],
  views:[view([-11,30,125],[-11,30,0],34),view([-15,53,17],[-23.4,53,0],42),view([-6.2,1.3,10.2],[-9.3,.85,6.8],48),view([14.3,1.35,3.8],[12.3,.9,.6],34)],
  pose(t){f1.pose(t);f2.pose(t);}};
}
