// Rooftop pool (Blender): hotel rooftop pool 12 m x 5 m, 1.5 m deep, on an 18 m x 9 m non-slip deck. Origin at the pool centre ON the deck surface (y=0 is the deck), front = +z.
// Sculpted in episodes/pendulum-tower/blender/rooftop-pool.py, exported to scene2/models/glb/rooftop-pool.glb: tiled basin with grid lines and swim lines, steel ladder, overflow gutter 'Splash rim' (0.3 m),
// 'Springboard' (root at the rear hinge, x=-7.7; 4.8 m board, top 1.0 m above the deck) > 'Board' (pivot at the hinge) > 'Board tip' (pivot 3.2 m out: rotate z to bend), handrails and non-slip tread,
// 'Lounger A'/'Lounger B' (each with a tilting 'Lounger back'), 'Parasol', 'Pool towels', and 'Water': a separate thin subdivided plane 11.8 x 4.8 at y=-0.1 (translucent turquoise) for ripples and tilt.
// Exports: info, load() (await once), buildPool(ctx,kit) -> {root,water,splashRim,springboard,board,tip,ladder,loungerA,loungerB,parasol}, build(ctx,kit) for the sheet.
import {preloadGLB,glbInstance,find} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={noGround:true,id:'rooftop-pool',name:'Rooftop pool (Blender): basin, springboard, deck, loungers, water surface and splash rim'};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/rooftop-pool.glb';
export const load=()=>preloadGLB([URL]);
const node=(g,n)=>find(g,n)||find(g,n.replace(/ /g,'_'));
export function buildPool(ctx,kit){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name='Rooftop pool';
 const o={root:g,water:node(g,'Water'),splashRim:node(g,'Splash rim'),springboard:node(g,'Springboard'),board:node(g,'Board'),tip:node(g,'Board tip'),ladder:node(g,'Pool ladder'),loungerA:node(g,'Lounger A'),loungerB:node(g,'Lounger B'),parasol:node(g,'Parasol')};
 kit.finish(g,'prop');
 if(o.water){o.water.material=new THREE.MeshStandardMaterial({name:'water turquoise',color:0x1fc2a6,emissive:0x0a9a80,emissiveIntensity:.6,roughness:.6,metalness:0,envMapIntensity:.1,transparent:true,opacity:.9,depthWrite:false});o.water.castShadow=false;o.water.receiveShadow=true;} // water is set after finish: a saturated turquoise, the surface layer would grey it
 return o;
}
export async function build(ctx,kit){
 await load();
 const fig=scaleFigure(ctx,{pos:[-3.9,1.0,0]}),p=buildPool(ctx,kit);
 ctx.scene.add(p.root);
 const roof=new ctx.THREE.Group();roof.name='Sheet roof';kit.rbox(roof,'ground roof',[0,-2.6,0],[22,1.3,13],.02,kit.mat('#8f8f9c',{rough:.9,name:'ground roof'}),null,{});ctx.scene.add(roof);
 const view=(pos,t,f=32)=>({position:pos,target:t,fov:f,subject:t,shadow:12,solar:10});
 return {root:p.root,size:[18,3,9],focus:[0,0,0],
  views:[view([9,12,16],[0,-.4,0],34),view([-5.3,1.9,23],[-5.3,1.1,0],30),view([4.0,1.6,-0.2],[2.9,-.4,-3.0],34),view([13,3.6,5.5],[7.2,.5,0],32)],
  pose(t){fig.pose(t);if(p.tip)p.tip.rotation.z=-.06*Math.sin(t*5);if(p.water)p.water.rotation.z=.01*Math.sin(t*2);}};
}
