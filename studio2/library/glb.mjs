// Models made in Blender and exported as GLB (owner order 2026-11-09: every model is sculpted in Blender and exported). Preload once at the start of build(), then take instances synchronously.
//   await preloadGLB([url,...]);   const g=glbInstance(THREE,url);   kit.finish(g,'prop') adds the outline and shadows like any other prop.
// Names of the Blender objects and materials survive the export, so the detail gate, the collision allow-list and realism.mjs (surface rules by material name) keep working.
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const cache=new Map();
const DECOR=/advert|seam|groove|stencil|text|label|print|decal|tick|stitch|sticker|bracket|capacity|crack|chip|digit|numeral|lettering/i; // thin surface decoration (lettering, seams, grooves, brackets) never counts as a solid for the collision gate
export async function preloadGLB(urls){await Promise.all(urls.filter(u=>!cache.has(u)).map(async u=>{const a=await new GLTFLoader().loadAsync(u);cache.set(u,a.scene);}));}
export function glbInstance(THREE,url){
 const src=cache.get(url);if(!src)throw new Error('GLB not preloaded: '+url);
 const g=src.clone(true);g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.castShadow=true;o.receiveShadow=true;o.userData.glb=true;if(DECOR.test(o.name))o.userData.noCollide=true;}});return g;
}
export const find=(g,name)=>{let f=null;g.traverse(o=>{if(!f&&o.name===name)f=o;});return f;};
