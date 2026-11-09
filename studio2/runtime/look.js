// Character look presets. 'ref' = the reference clip's characters (user request 2026-11-08): flat unlit colour,
// thick black outline, thick dark stick arms ending in round blob hands, thin leg sticks with small oval feet,
// a round face with heavy ink (dark oval eyes, heavy brows) - a 2D drawing standing in a 3D world.
// 'classic' = the earlier shaded toon look (kept so finished films can still be re-rendered).
export const LOOKS={
 ref:{flat:true,outline:12,outlineWorld:.023,ink:'#1e1214',armRadius:1.55,legRadius:1.25,handRadius:.045,shoeScale:[.052,.03,.082],faceInk:1.6,darkEyes:true,headScale:1.15,shoulders:false,eyeScale:1.3,ears:false,trousers:1.35,flatHair:true,oneBody:true,handDrawn:true,mouthScale:1.7,shoulderX:.15,shoulderY:.34,legK:.7},
 classic:{flat:false,outline:4.5,outlineWorld:0,ink:'#351f22',armRadius:1,legRadius:1,handRadius:.036,shoeScale:[.05,.032,.085],faceInk:1,darkEyes:false,headScale:1,shoulders:true,eyeScale:1,ears:true,trousers:1,flatHair:false,oneBody:false,handDrawn:false,mouthScale:1,shoulderX:.16,shoulderY:.42,legK:1},
};
export const DEFAULT_LOOK='ref';
export function resolveLook(name){
 const k=name??DEFAULT_LOOK;if(!LOOKS[k])throw Error('Unknown character look: '+k);return LOOKS[k];
}
