// Town dressing pack (Blender): sculpted in episodes/pendulum-tower/blender/town-dressing.py, exported to scene2/models/glb/town-dressing.glb (359 parts, 166 names): eleven separate named groups, never merged, origin of each at its base.
// `Banner OPENING TOMORROW` 6 x 1.2 m (waved subdivided red cloth, white lettering lying flat on it, grommets, rope ties), `Banner GRAND OPENING` 8 x 1.5 m (gold on royal blue, fringe, rod and two poles),
// `Sign TOP FLOOR FOR SALE` 1.6 x 1.0 m on a stake (child group `Cross-out`: hide or show it), `Street lamp` 4.5 m, `Queue barrier` 1.0 x 2.0 m (hand-lettered tape), `Balloon` and `Balloon bunch` (1.5 m string, knot, weight),
// `Windsock` 3 m pole (child group `Windsock cone` pivots at the ring: yaw about y, droop about z), `Hoarding panel` 2.4 x 2.4 m (posts, kick plate, hazard stripes, posters), `Bunting` 6 m with 12 flags (origin on the string line) and a `Bunting pole`,
// `Pigeon` 0.3 m and `Pigeon fainted` (on its back, X eyes), `Wallet` (open, empty slot, panels 0.12 m wide) and `Fly` 0.015 m (child groups `Fly wing L` / `Fly wing R`, pivots at the thorax).
// Exports load() (await once) and one builder per item (each returns {root, ...nodes}); every builder takes its own copy of the group, centred on its origin unless {layout:true}. +z toward the camera.
import {preloadGLB,glbInstance,find} from '/repo/studio2/library/glb.mjs';
import {scaleFigure} from './_scale.mjs';
export const info={id:'town-dressing',name:'Town dressing (Blender): banners, sign, lamp, queue barrier, balloons, windsock, hoarding, bunting, pigeon, wallet and fly',noGround:true};
const URL='/repo/episodes/pendulum-tower/scene2/models/glb/town-dressing.glb';
const fnode=(g,n)=>find(g,n)||find(g,n.replace(/ /g,'_')); // GLTFLoader turns spaces in node names into underscores
export const load=()=>preloadGLB([URL]);
let proto=null; // one parsed copy of the whole pack; every item is cloned out of it (materials cloned so kit.finish can restyle each item on its own)
function item(THREE,name,{layout=false}={}){
 if(!proto)proto=glbInstance(THREE,URL);
 const src=fnode(proto,name);if(!src)throw new Error('town-dressing: no group '+name);
 const g=src.clone(true);g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.castShadow=true;o.receiveShadow=true;}});
 if(!layout){g.position.set(0,0,0);g.rotation.set(0,0,0);}
 return g;
}
const make=(ctx,kit,name,o,extra)=>{const g=item(ctx.THREE,name,o);kit.finish(g,'prop');return {root:g,...(extra?extra(g):{})};};
export const buildBannerOpening=(ctx,kit,o)=>make(ctx,kit,'Banner OPENING TOMORROW',o,()=>({size:[6,1.2]}));
export const buildBannerGrand=(ctx,kit,o)=>make(ctx,kit,'Banner GRAND OPENING',o,()=>({size:[8.6,3.45]}));
export const buildSign=(ctx,kit,{crossed=true,...o}={})=>make(ctx,kit,'Sign TOP FLOOR FOR SALE',o,g=>{const cross=fnode(g,'Cross-out');if(cross)cross.visible=crossed;return {cross,size:[1.6,1.0]};});
export const buildLamp=(ctx,kit,o)=>make(ctx,kit,'Street lamp',o,g=>({lampHead:[.95,4.0,0],height:4.5}));
export const buildBarrier=(ctx,kit,o)=>make(ctx,kit,'Queue barrier',o,()=>({size:[2.0,1.0]}));
export const buildBalloon=(ctx,kit,o)=>make(ctx,kit,'Balloon',o,()=>({knot:[0,1.55,0],stringLength:1.5}));
export const buildBalloonBunch=(ctx,kit,o)=>make(ctx,kit,'Balloon bunch',o,()=>({tie:[0,1.0,0]}));
export const buildWindsock=(ctx,kit,o)=>make(ctx,kit,'Windsock',o,g=>({cone:fnode(g,'Windsock cone'),pivot:[0,3.0,0]})); // cone.rotation.z=-1.2 droops it, rotation.y turns it into the wind
export const buildHoarding=(ctx,kit,o)=>make(ctx,kit,'Hoarding panel',o,()=>({size:[2.4,2.4]}));
export const buildBunting=(ctx,kit,o)=>make(ctx,kit,'Bunting',o,()=>({length:6,flags:12}));
export const buildBuntingPole=(ctx,kit,o)=>make(ctx,kit,'Bunting pole',o,()=>({top:[0,3.15,0]}));
export function buildPigeon(ctx,kit,{fainted=false,layout=false}={}){
 const {THREE}=ctx,root=new THREE.Group();root.name='Pigeon pair';
 const standing=item(THREE,'Pigeon',{layout}),down=item(THREE,'Pigeon fainted',{layout});
 root.add(standing,down);kit.finish(root,'prop');
 const set=f=>{standing.visible=!f;down.visible=!!f;};set(fainted);
 return {root,standing,fainted:down,set};
}
export const buildWallet=(ctx,kit,o)=>make(ctx,kit,'Wallet',o,()=>({size:[.126,.095]}));
export const buildFly=(ctx,kit,o)=>make(ctx,kit,'Fly',o,g=>({wingL:fnode(g,'Fly wing L'),wingR:fnode(g,'Fly wing R'),size:.015}));
export async function build(ctx,kit){
 await load();
 const {THREE}=ctx;
 const slab=(name,size,pos,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:1}));m.name=name;m.position.set(...pos);m.receiveShadow=true;m.userData.noCollide=true;ctx.scene.add(m);return m;};
 slab('ground strip',[34,.05,26],[0,-.026,-5],'#a9cc86');
 const X0=.2,Z0=4.4; // small things stand on a low plinth near the camera, staggered in depth so a tall (portrait) frame shows all of them
 slab('ground plinth',[1.7,.1,1.3],[X0,.05,Z0],'#d8d2c4');
 const fig=scaleFigure(ctx,{pos:[3.1,0,1.8],yaw:.25});
 const put=(b,x,y,z)=>{b.root.position.set(x,y,z);ctx.scene.add(b.root);return b;};
 put(buildHoarding(ctx,kit),-4.5,0,-3);
 put(buildBuntingPole(ctx,kit),-8.2,0,2.4);put(buildBuntingPole(ctx,kit),-1.8,0,2.4);put(buildBunting(ctx,kit),-5.0,3.0,2.4);put(buildBalloonBunch(ctx,kit),-5.4,0,1.0);
 put(buildSign(ctx,kit),-.5,0,-3);put(buildBannerOpening(ctx,kit),0,3.5,-6);put(buildBannerGrand(ctx,kit),0,0,-9);
 put(buildLamp(ctx,kit),3.8,0,-3);put(buildWindsock(ctx,kit),6.2,0,-3);put(buildBarrier(ctx,kit),1.2,0,.8);put(buildBalloon(ctx,kit),-3.0,0,1.0);
 put(buildPigeon(ctx,kit),X0-.4,.1,Z0-.28);put(buildPigeon(ctx,kit,{fainted:true}),X0+.3,.1,Z0-.3);
 put(buildWallet(ctx,kit),X0,.1,Z0+.28);put(buildFly(ctx,kit),X0+.063,.21,Z0+.3);
 const view=(p,t,f=40,extra={})=>({position:p,target:t,fov:f,subject:t,shadow:16,solar:20,...extra});
 return {root:ctx.scene,size:[18,4.8,14],focus:[0,1.8,-3],
  views:[view([0,6.0,27],[0,1.9,-3],64,{shadow:30,solar:34}),view([-.5,3.0,6.0],[-.5,2.8,-3],54,{shadow:20}),view([X0,1.45,Z0+2.5],[X0,.12,Z0],40,{near:.02,shadow:3,solar:5}),view([4,2.3,10],[-5,1.7,0],60)],
  pose(t){fig.pose(t);}};
}
