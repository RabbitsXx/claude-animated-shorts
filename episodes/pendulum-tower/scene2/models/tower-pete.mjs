// Pete's skinny tower. Sculpted in Blender (episodes/pendulum-tower/blender/tower-pete.py), exported to scene2/models/glb/tower-pete.glb.
// Real size: 18 storeys of 4.0 m = 72 m, footprint 12 x 12 m (6:1), origin at ground centre, front toward +z. Glazing with mullions, teal spandrel bands, window-cleaning rails; lobby with a 2.0 x 2.2 m double glass door,
// canopy and house number 7; roof with mechanical box, AC units, gantry and a lightning rod; glass elevator shaft on the front right (x 2.25..4.55) with a moving cab (1.6 m inner width).
// Floor slabs 'Floor 01'..'Floor 18' (top of floor n at y = 4 (n-1), 0.35 thick). Slabs 16-18 have a 6.4 m round hole at the centre; 'Slab plug 16' and 'Slab plug 17' fill holes 16, 17. Roof underside y = 72 (the ball pivot).
// Nodes: Floors, Frame, Facade left|right|back, Facade front lower (storeys 2-14), Lobby (Door L, Door R with hinge pivots, Canopy), Cutaway front (front wall of storeys 15-18), Interior, Elevator shaft > Elevator car (origin at its floor, x 3.4, z 7.2),
// Banner mount (empty at x -1.7, y 6.05, z 6.25 on the front; a rail 5.8 m wide hangs 2.4 m tall banner), Roof equipment. GLTFLoader turns spaces into underscores: this module finds both spellings, the scene must too.
// Exports load() (await once), buildTower(ctx,kit,{cutaway:true}) -> {root,floors[1..18],floor(n),plugs:{16,17},setPlug(n,on),cutaway,setCutaway(on),elevator,setElevator(y),doorL,doorR,bannerMount,lobby,shaft}.
// cutaway:true hides the front wall of storeys 15-18 (interior shots); false keeps the closed facade. The facade frame (columns, slab edge fins) stays.
import {preloadGLB,glbInstance,find} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'tower-pete',name:"Pete's skinny tower: 18 storeys, cutaway top floors, lobby door, glass lift, drilled slab holes"};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/tower-pete.glb';
export const load=()=>preloadGLB([URL]);
export const STOREY=4,STOREYS=18,HEIGHT=72;
const nodeBy=(g,n)=>find(g,n)||find(g,n.replace(/ /g,'_'));
export const slabTop=(n)=>STOREY*(n-1);
export function buildTower(ctx,kit,{cutaway=true}={}){
 const {THREE}=ctx,g=glbInstance(THREE,URL);g.name="Pete's tower";
 // glass and lit parts are flagged before finish (finish honours userData.glass / userData.emissive)
 g.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(!m)return;
  if(/^glass/.test(m.name||'')){o.userData.glass=true;o.userData.glassOpacity=/cab/.test(m.name)?.3:.34;o.userData.noCollide=true;}
  else if(m.emissive&&m.emissive.getHex()>0){o.userData.emissive=m.emissive.getHex();o.userData.emissiveIntensity=1.5;}});
 const floors=[null];for(let n=1;n<=STOREYS;n++)floors.push(nodeBy(g,'Floor '+String(n).padStart(2,'0')));
 const plugs={16:nodeBy(g,'Slab plug 16'),17:nodeBy(g,'Slab plug 17')};
 const cut=nodeBy(g,'Cutaway front'),car=nodeBy(g,'Elevator car');
 kit.finish(g,'prop');
 const out={root:g,floors,floor:(n)=>floors[n],plugs,cutaway:cut,elevator:car,doorL:nodeBy(g,'Door L'),doorR:nodeBy(g,'Door R'),bannerMount:nodeBy(g,'Banner mount'),lobby:nodeBy(g,'Lobby'),shaft:nodeBy(g,'Elevator shaft')};
 out.setCutaway=(on)=>{cut.visible=!on;};   // on = cutaway view = front wall of storeys 15-18 hidden
 out.setPlug=(n,on)=>{if(plugs[n])plugs[n].visible=!!on;};
 out.setElevator=(y)=>{car.position.y=y;};
 out.setCutaway(cutaway);
 return out;
}
export async function build(ctx,kit){
 await load();
 const t=buildTower(ctx,kit,{cutaway:true});ctx.scene.add(t.root);
 const ground=new ctx.THREE.Group();ground.name='Sheet ground';
 kit.rbox(ground,'ground sheet slab',[0,-.2,6],[40,.4,40],.02,kit.mat('#b9b2a4',{rough:.9,name:'concrete sheet ground'}),null,{});ctx.scene.add(ground);
 const fig=scaleFigure(ctx,{pos:[-1.7,0,7.4]});
 t.setPlug(16,true);t.setPlug(17,true);
 const view=(p,tg,f=34)=>({position:p,target:tg,fov:f,subject:tg,shadow:8,solar:10});
 return {root:t.root,size:[12,75,12],focus:[0,36,0],
  views:[
   view([34,34,150],[0,35,0],30),                 // 1 full height, wide
   view([9,64,31],[0,64,0],38),                   // 2 top storeys, front wall hidden
   view([1.6,1.9,13.5],[-1.7,1.6,6.3],36),        // 3 lobby entrance with the 1.8 m figure
   view([10,7,16],[3.4,5.8,7.2],38)],             // 4 glass lift and cab
  pose(tm){fig.pose(tm);t.setElevator(4+3*Math.sin(tm*.8));const o=.5*(1-Math.cos(Math.min(1,tm/1.5)*Math.PI))*.9;t.doorL.rotation.y=-o;t.doorR.rotation.y=o;}};
}
