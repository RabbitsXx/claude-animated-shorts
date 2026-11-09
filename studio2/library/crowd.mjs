// Background people: clothing specs, reaction poses and a line-up helper that cannot overlap neighbours.
// crowdSpec(i,{palette}) is deterministic per index; VILLAGE is the earthy market palette of square-wheel (a film passes its own palette,
// the mechanics stay). crowdPose(p,t,mode,i,target) returns arguments for actor.pose; modes: idle cheer laugh clap gasp point wave.
// Keep neighbours at least 0.7 m apart (straw hats overlap below that): spacedLine guarantees it.
import {rand} from '../runtime/tracks.js';
export const VILLAGE={
 skins:['#fffdf4','#fbe3c4','#e8b98a','#c58c5f','#8d5a3c'],
 cloth:['#c9743a','#5b8c5a','#d8b25a','#3d6a8a','#a8493a','#e6dcc2','#7a5a8a','#4c7a6a'],
 pants:['#4a3f35','#3b4a5a','#5a4a3a','#2f3a2f','#5a3a3a','#2a2326'],
 hair:['#2a2326','#4a3427','#8a5a2a','#d9b45a','#b8472f','#6b6b70'],
};
export function crowdSpec(i,{kids=.22,palette=VILLAGE}={}){
 const r=rand(900+i*37);const pick=a=>a[Math.floor(r()*a.length)];
 const kid=r()<kids,s=kid?.62+r()*.12:.9+r()*.2;
 const spec={name:'crowd'+i,scale:s,headScale:kid?1.18:1,skin:pick(palette.skins),shirt:pick(palette.cloth),pants:pick(palette.pants),hair:pick(palette.hair),hairStyle:pick(['tuft','curly','bob','bun','fringe','slick','curly']),faceSpec:{}};
 const roll=r();
 if(roll<.3)spec.cap=pick(palette.cloth);else if(roll<.45)spec.straw='#d8b25a';else if(roll<.55)spec.beanie=pick(palette.cloth);
 if(!kid&&r()<.25)spec.dress=pick(palette.cloth);
 if(!kid&&r()<.3)spec.apron=pick(['#e6dcc2','#9a6a35','#d8b25a']);
 if(r()<.3)spec.scarf=pick(palette.cloth);
 if(!kid&&r()<.15)spec.faceSpec.glasses=true;
 return spec;
}
export function crowdPose(p,t,mode,i,target=[0,0,0]){
 const ph=i*1.7,x=p.x,z=p.z,y=p.y||0,yaw=Math.atan2(target[0]-x,target[2]-z);
 const bob=Math.sin(t*3+ph)*.012;
 const base={pos:[x,y,z],yaw:yaw+Math.sin(t*.7+ph)*.08,crouch:.02+bob,lean:Math.sin(t*1.3+ph)*.02,headYaw:Math.sin(t*.9+ph)*.2,face:'grin',feet:[[x-.1,y,z+.03],[x+.1,y,z+.03]]};
 if(mode==='cheer'){const up=.5+.5*Math.sin(t*7+ph);return {...base,crouch:.03+.05*up,face:'joy',hands:[{torso:[-.26,.52+up*.22,.1]},{torso:[.26,.52+(1-up)*.22,.1]}],headPitch:-.2};}
 if(mode==='laugh'){const k=Math.sin(t*11+ph);return {...base,face:'laugh',lean:-.1+.04*k,crouch:.03+.02*Math.abs(k),headPitch:-.25,hands:[{torso:[-.2,.18,.28]},{torso:[.2,.18,.28]}]};}
 if(mode==='clap'){const k=.5+.5*Math.sin(t*9+ph);return {...base,face:'grin',hands:[{torso:[-.04-.14*k,.28,.3]},{torso:[.04+.14*k,.28,.3]}]};}
 if(mode==='gasp'){return {...base,face:'shock',lean:-.12,headPitch:-.12,hands:[{head:[-.2,-.12,.16]},{head:[.2,-.12,.16]}],crouch:.0};}
 if(mode==='point'){return {...base,face:'shock',hands:[{torso:[-.2,.1,.4]},{torso:[.4,.6,.4]}]};}
 if(mode==='wave'){const k=Math.sin(t*8+ph);return {...base,face:'joy',hands:[{torso:[-.2,.1,.1]},{torso:[.32+.08*k,.7,.1]}]};}
 return {...base,face:i%3===0?'grin':'neutral'};
}
// n people along x from x0 toward x1 at depth z. The step is max(minSpacing, range/(n-1)) so neighbours never get closer than minSpacing
// (the line is extended past x1 when the range is too short); jitter is at most half the spare space so the guarantee holds.
export function spacedLine({n,x0,x1,z,minSpacing=.7,jitter=.1,seed=1}){
 const r=rand(seed*7919+n),step=n>1?Math.max(minSpacing,(x1-x0)/(n-1)):0,j=Math.max(0,Math.min(jitter,(step-minSpacing)/2));
 return Array.from({length:n},(_,k)=>({x:x0+k*step+(j>0?(r()*2-1)*j:0),z:z+(r()*2-1)*Math.min(jitter,.1)}));
}
