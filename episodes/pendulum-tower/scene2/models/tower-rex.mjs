// Rex's tower (Blender): the sleek 'perfect' glass tower, 20 storeys x 4.2 m = 84 m on a 16 m x 16 m footprint, origin at the ground centre, front = +z.
// Sculpted in episodes/pendulum-tower/blender/tower-rex.py, exported to scene2/models/glb/tower-rex.glb: rounded-corner storeys ('Floor 01'..'Floor 20'), curved glass with fritted bands and mullion fins,
// stepped cantilever crown, rooftop terrace deck at y=84 ('Roof railing' 1.1 m, 'Pool mount' empty at the roof centre, 'Machine room', gold string lights 'Crown lights'), lobby with 'Revolving door' (2.3 m, wings turn in 'Door wings'),
// 'Entrance canopy', planters, 'Banner frame' with a blank 'banner cloth blank', and two glass elevators on the front face: 'Elevator car A' (x=-4.4) and 'Elevator car B' (x=+4.4), origin at the cab floor (move them in Y), inner width 1.8 m.
// Exports: info, load() (await once), buildTower(ctx,kit) -> {root,carA,carB,railing,poolMount,doorWings,banner}, build(ctx,kit) for the sheet.
import {preloadGLB,glbInstance,find} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'tower-rex',name:"Rex's sleek glass tower (Blender): 20 floors, glass elevators, rooftop deck and grand lobby"};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/tower-rex.glb';
export const load=()=>preloadGLB([URL]);
const node=(g,n)=>find(g,n)||find(g,n.replace(/ /g,'_'));
export function buildTower(ctx,kit){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Rex tower';
 const carA=node(g,'Elevator car A'),carB=node(g,'Elevator car B'),railing=node(g,'Roof railing'),poolMount=node(g,'Pool mount'),doorWings=node(g,'Door wings'),banner=node(g,'Banner frame');
 kit.finish(g,'prop');
 g.traverse(o=>{if(o.isMesh&&o.material&&/lobby[ _]glass|shaft[ _]glass|cab[ _]glass/.test(o.material.name||'')){o.material.transparent=true;o.material.opacity=/shaft/.test(o.material.name)?.25:.3;o.material.depthWrite=false;o.castShadow=false;}}); // glass is set after finish
 return {root:g,carA,carB,railing,poolMount,doorWings,banner};
}
export async function build(ctx,kit){
 await load();
 const fig=scaleFigure(ctx,{pos:[0,.12,9.9]}),t=buildTower(ctx,kit);
 ctx.scene.add(t.root);
 const view=(p,tg,f=34)=>({position:p,target:tg,fov:f,subject:tg,shadow:60,solar:30});
 return {root:t.root,size:[26,90,24],focus:[0,42,9],
  views:[view([60,50,135],[0,40,0],34),view([24,93,32],[0,84,0],36),view([2.6,1.8,17],[0,1.6,8.6],34),view([-4.4,3.2,22],[-4.4,3.0,9.4],34)],
  pose(tt){fig.pose(tt);if(t.doorWings)t.doorWings.rotation.y=tt*.9;if(t.carA)t.carA.position.y=.25+3.5*(.5-.5*Math.cos(tt*1.2));if(t.carB)t.carB.position.y=.25+2.0*(.5-.5*Math.cos(tt*.8+1));}};
}
