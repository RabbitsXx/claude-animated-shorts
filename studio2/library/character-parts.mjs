// Character parts sculpted in Blender (studio2/blender/character-parts.py -> library/characters/*.glb): six hair styles made of tapered locks, a six-panel cap and a sneaker. Owner 2026-11-09: characters go through Blender too.
// The actor (runtime/actor.js) calls characterPart() while it builds the head and the shoes; a scene must `await loadCharacterParts()` once at the top of build() (like any GLB). Not loaded -> null and the actor falls back to its built-in parts.
// Materials named 'hair' and 'cap' are tinted from the cast spec; everything else keeps its own colour; the actor restyles all of it flat with the thick ink outline.
import {preloadGLB,glbInstance} from '/repo/studio2/library/glb.mjs';
const URL=(n)=>`/repo/studio2/library/characters/${n}.glb`;
export const PART_NAMES=['hair-tuft','hair-slick','hair-fringe','hair-bob','hair-curly','hair-bun','hair-capped','cap','sneaker'];
export const loadCharacterParts=()=>preloadGLB(PART_NAMES.map(URL));
export function characterPart(THREE,name,{hair,cap}={}){
 let g;try{g=glbInstance(THREE,URL(name));}catch(e){return null;}
 g.traverse(o=>{if(!o.isMesh)return;o.userData.noCollide=true;const m=o.material;if(m.name==='hair'&&hair)m.color.set(hair);if(m.name==='cap'&&cap)m.color.set(cap);});
 // hair that ships an 'Hair ink' hull gets its outline ONLY from that hull (back faces, black, tucked inside the head where the hair meets the face): no black line at the hairline or between clumps
 let ink=false;g.traverse(o=>{if(o.isMesh&&/^Hair[ _]ink/.test(o.name))ink=true;});
 if(ink)g.traverse(o=>{if(o.isMesh&&/^Hair/.test(o.name)&&!/curl/i.test(o.name))o.userData.noOutline=true;});
 return g;
}
