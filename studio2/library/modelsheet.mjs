// One model, four views, nothing else in the frame: the sheet every model must pass before the next model starts (studio2/models.mjs).
// A model module exports: info {id,name}, build(ctx,kit) -> {root, size:[w,h,d], pose?(t), focus?:[x,y,z]}.
// Views (one per second): front, three-quarter, high side, close detail. Render times 0.5 / 1.5 / 2.5 / 3.5.
import {makeKit} from '/runtime/kit.js';
export function viewsFor(size=[1,1,1],focus=null,at=[0,0,0]){
 const [w,h,d]=size,f=focus||[0,h*.5,0],R=Math.max(w,h,d),dist=Math.max(1.6,R*2.2);
 const P=(x,y,z)=>[at[0]+x,at[1]+y,at[2]+z],T=(x,y,z)=>[at[0]+x,at[1]+y,at[2]+z];
 return [
  {position:P(f[0],f[1]+R*.1,dist),target:T(...f),fov:38},
  {position:P(f[0]+dist*.72,f[1]+R*.3,dist*.72),target:T(...f),fov:38},
  {position:P(f[0]-dist*.8,f[1]+R*1.1,dist*.5),target:T(...f),fov:38},
  {position:P(f[0]+dist*.2,f[1]+R*.15,dist*.45),target:T(f[0],f[1]+h*.1,f[2]),fov:34},
 ].map(v=>({...v,subject:v.target,shadow:8,solar:10}));
}
import {texturize} from '/repo/studio2/library/realism.mjs';
export function sheetScene(model){
 return async function build(ctx){
  const kit=makeKit(ctx),{THREE}=ctx;
  const ground=model.info.noGround?new THREE.Object3D():new THREE.Mesh(new THREE.CylinderGeometry(6,6,.05,64),new THREE.MeshStandardMaterial({color:'#cfd6c8',roughness:1}));ground.position.y=-.026;ground.receiveShadow=true;ground.userData.noCollide=true;if(!model.info.noGround)ctx.scene.add(ground);
  const m=await model.build(ctx,kit),views=m.views||viewsFor(m.size,m.focus);
  texturize(ctx.scene,{THREE}); // the film runs the surface layer on every prop: the sheet must show the same surfaces (a speckled wall was invisible on untextured sheets)
  const detail=(()=>{const names=new Set();let meshes=0;const walk=(o)=>{if(/^Actor /.test(o.name||'')||o===ground)return;if(o.isMesh&&!o.userData.outline&&!/^ground/.test(o.name||'')){meshes++;names.add(String(o.name||'part').replace(/[0-9]+/g,'').trim());}for(const c of o.children)walk(c);};walk(ctx.scene);return {meshes,names:names.size};})(); // detail meter: how many parts and how many different named parts the model has (studio2/lib/models.mjs auditDetail)
  return {update(t){const k=Math.min(views.length-1,Math.floor(t));m.pose?.(t);return {camera:views[k],reach:0,note:`${model.info.id} view ${k} meshes ${detail.meshes} names ${detail.names}`};}};
 };
}
