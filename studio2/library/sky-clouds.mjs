// The sky's clouds, sculpted in Blender (studio2/blender/clouds.py -> studio2/library/sky/*.glb): distinct puffy cumulus with a soft blue-grey belly like the reference, placed on a ring around the camera (owner 2026-11-09: fix the sky).
// The engine loads and drives them: loadSkyClouds() once, buildSkyClouds(THREE) -> {group, tint(top,shade)}; the group follows the camera, is drawn first with no depth write so every scene object covers it, and is hidden during the depth/shadow passes.
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
const URL=(n)=>`/repo/studio2/library/sky/${n}.glb`,NAMES=['cloud-a','cloud-b','cloud-c','cloud-d','cloud-wisp'];
export const loadSkyClouds=()=>preloadGLB(NAMES.map(URL));
const rnd=(seed)=>{let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};};
export function buildSkyClouds(THREE,{seed=7,count=22,radius=118}={}){
 const group=new THREE.Group(),R=rnd(seed),top=new THREE.MeshBasicMaterial({color:'#ffffff',fog:false,depthWrite:false,depthTest:false}),shade=new THREE.MeshBasicMaterial({color:'#b9d2ee',fog:false,depthWrite:false,depthTest:false});
 group.name='Sky clouds';group.userData.sky=true;
 for(let i=0;i<count;i++){
  let g;try{g=glbInstance(THREE,URL(i%5===4?'cloud-wisp':['cloud-a','cloud-b','cloud-c','cloud-d'][i%4]));}catch(e){return null;}
  g.traverse(o=>{if(o.isMesh){o.material=/shade|belly/i.test(o.material.name)?shade:top;o.castShadow=o.receiveShadow=false;o.renderOrder=-5;o.frustumCulled=false;o.userData.noOutline=true;o.userData.noCollide=true;}});
  const az=i/count*Math.PI*2+(R()-.5)*.35,el=.13+R()*.5,s=.95+R()*.95;
  g.position.set(Math.cos(el)*Math.sin(az),Math.sin(el),Math.cos(el)*Math.cos(az)).multiplyScalar(radius*(.85+R()*.2));
  g.rotation.y=az+Math.PI/2;g.scale.setScalar(s);g.name='Sky cloud';group.add(g);
 }
 const tint=(t,s)=>{top.color.set(t);shade.color.set(s);};
 return {group,tint};
}
