// Trees, bushes and grass tufts for the realistic world (owner 2026-11-09: game-level environment, flat characters), sculpted in Blender (studio2/blender/foliage.py -> studio2/library/foliage/*.glb):
// three tree variants (tapered trunk with root flare, branch tubes, 13-18 noise-displaced crown lobes in five greens), a bush with blossoms and a five-blade grass tuft.
// loadFoliage() once (await it from the model's load()); buildTree(ctx,kit,{seed,height,palette}) -> Group; buildBush(ctx,kit,{seed,r}) -> Group; tuftField(ctx,{n,seed,place,colors}) -> InstancedMesh (placement of the Blender tuft, not new modelling).
// Part names avoid 'leaf', 'grass' and 'ground' in the engine's recolour rules; all noCollide. 'crown *' and 'bush *' materials are tinted per palette.
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const URL=(n)=>`/repo/studio2/library/foliage/${n}.glb`,NAMES=['tree-a','tree-b','tree-c','bush','tuft'];
export const loadFoliage=()=>preloadGLB(NAMES.map(URL));
const rnd=(seed)=>{let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};};
const PAL={day:['#2c8f3e','#3fae4a','#1f7a38','#58bf52','#2a8a45'],dusk:['#5a6a4a','#6a7a52','#4a5a42','#7a8a5a'],night:['#142a30','#1a3238','#102428']};
const prep=(g)=>{g.traverse(o=>{if(o.isMesh)o.userData.noCollide=true;});return g;};
export function buildTree(ctx,kit,{seed=1,height=7,palette='day'}={}){
 const {THREE}=ctx,R=rnd(seed),g=prep(glbInstance(THREE,URL(['tree-a','tree-b','tree-c'][seed%3]))),P=PAL[palette]||PAL.day;g.name='Tree';
 g.traverse(o=>{if(o.isMesh&&/^crown/i.test(o.material.name)){const i=parseInt(o.material.name.replace(/\D/g,''))||0;o.material.color.set(P[i%P.length]);o.userData.noOutline=true;}});
 g.scale.setScalar(height/7);g.rotation.y=R()*Math.PI*2;return g;
}
export function buildBush(ctx,kit,{seed=1,r=1}={}){
 const {THREE}=ctx,R=rnd(seed),g=prep(glbInstance(THREE,URL('bush')));g.name='Bush';
 g.traverse(o=>{if(o.isMesh)o.userData.noOutline=true;});g.scale.setScalar(r);g.rotation.y=R()*Math.PI*2;return g;
}
let tuftGeo=null;
export function tuftField(ctx,{n=2000,seed=1,place,colors=['#2c7f38','#3f9a42','#256a30','#4fae4a'],name='tuft field',scale=[.7,1.7]}={}){
 const {THREE}=ctx;
 if(!tuftGeo){const src=glbInstance(THREE,URL('tuft')),parts=[];src.updateMatrixWorld(true);src.traverse(o=>{if(o.isMesh){const gm=o.geometry.clone();gm.applyMatrix4(o.matrixWorld);for(const k of Object.keys(gm.attributes))if(!['position','normal'].includes(k))gm.deleteAttribute(k);parts.push(gm);}});tuftGeo=mergeGeometries(parts,false);}
 const R=rnd(seed),inst=new THREE.InstancedMesh(tuftGeo,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,side:THREE.DoubleSide}),n),dm=new THREE.Object3D(),col=new THREE.Color();
 for(let i=0;i<n;i++){const p=place(R,i);dm.position.set(p[0],p[1],p[2]);dm.rotation.set((R()-.5)*.4,R()*6,(R()-.5)*.4);dm.scale.setScalar(scale[0]+R()*(scale[1]-scale[0]));dm.updateMatrix();inst.setMatrixAt(i,dm.matrix);inst.setColorAt(i,col.set(colors[i%colors.length]));}
 inst.instanceMatrix.needsUpdate=true;inst.instanceColor.needsUpdate=true;inst.name=name;inst.userData.noCollide=true;inst.userData.noOutline=true;inst.frustumCulled=false;return inst;
}
