// Text that always fits its sign, and the camera distance at which a sign fits the narrow 9:16 frame.
// Pure functions (no canvas): the caller passes measure(text,size) -> pixel width, so Node tests and the browser kit share one rule.
// Why: in-world signs were cropped by their own text or by the frame in film after film; fix it once, here.
const MARGIN=.06,LEADING=1.15;

// Shrink the font until every line fits; if that makes it smaller than 60% of the request, wrap on spaces and try again.
export function fitText({lines,width,height,measure,size=96,minSize=12,margin=MARGIN}){
 const maxW=width*(1-2*margin),maxH=height*(1-2*margin);
 const fits=(ls,s)=>ls.every(l=>measure(l,s)<=maxW)&&ls.length*s*LEADING<=maxH;
 const best=(ls)=>{for(let s=Math.floor(size);s>=minSize;s--)if(fits(ls,s))return s;return minSize;};
 const split=(l)=>{const w=l.split(' ');if(w.length<2)return [l];let bi=1,bd=1e9;for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),b=w.slice(i).join(' '),d=Math.abs(measure(a,size)-measure(b,size));if(d<bd){bd=d;bi=i;}}return [w.slice(0,bi).join(' '),w.slice(bi).join(' ')];};
 let out=lines.slice(),s=best(out);
 if(s<size*.6){const wrapped=out.flatMap(l=>measure(l,s)>maxW||measure(l,size)>maxW?split(l):[l]);const s2=best(wrapped);if(s2>s){out=wrapped;s=s2;}}
 // last resort: if one unbreakable word still overflows at the minimum size, wrap inside it by shrinking more is impossible; report it
 return {lines:out,size:s,fits:fits(out,s)};
}
// horizontal field of view (radians) of a frame with the given vertical field of view; the film is 1080x1920
export const horizontalFov=(vfov,aspect=1080/1920)=>2*Math.atan(Math.tan(vfov/2)*aspect);
// distance at which a sign of `width` metres fills `fill` of the frame width (default 90%)
export const signDistance=(width,vfov,fill=.9,aspect=1080/1920)=>width/(fill*2*Math.tan(horizontalFov(vfov,aspect)/2));
