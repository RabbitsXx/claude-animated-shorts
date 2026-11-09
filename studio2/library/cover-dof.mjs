// Depth of field for a cover frame, using the engine's own bokeh pass (camera options focus, aperture, maxblur in engine2.js).
// Real depth, not a 2D mask: far objects blur, the face and the key prop stay sharp. Approved on square-wheel (2026-11-08).
// Do not push the strength: stronger blur gives ghost taps and a glow around the sharp subject.
export const COVER_DOF={behindFace:.25,aperture:.0055,maxblur:.026,maxAperture:.008,maxMaxblur:.036};
const pt=(p,what)=>{if(Array.isArray(p)&&p.length>=3)return p;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z))return [p.x,p.y,p.z];throw new Error(`coverDof needs a ${what} as [x,y,z] or {x,y,z}`);};
export function coverDof(camPos,face,{strength=1,behindFace=COVER_DOF.behindFace}={}){
 const c=pt(camPos,'camera position'),f=pt(face,'face position'),dist=Math.hypot(c[0]-f[0],c[1]-f[1],c[2]-f[2]);
 return {focus:dist+behindFace,aperture:Math.min(COVER_DOF.maxAperture,COVER_DOF.aperture*strength),maxblur:Math.min(COVER_DOF.maxMaxblur,COVER_DOF.maxblur*strength)};
}
