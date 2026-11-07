// Original cast specs + crowd generation. Heads/torsos are real 3D; faces are 2D ink; limbs are sticks.
import {rand} from '/runtime/tracks.js';
export const INVENTOR={name:'inventor',skin:'#fffdf4',shirt:'#f3e6c8',pants:'#2f7f86',apron:'#c9863f',goggles:true,hairStyle:'tuft',hair:'#4a3427',faceSpec:{smudge:true}};
export const RIVAL={name:'rival',scale:1.12,skin:'#fffdf4',shirt:'#f7f1e3',pants:'#3a3340',vest:'#6b2d5c',collar:true,bowTie:'#c4402f',badge:'#f4c542',hairStyle:'slick',hair:'#8a7a5a',faceSpec:{moustache:'#8a7a5a'}};
export const DUMMY={name:'dummy',skin:'#f2c230',shirt:'#f2c230',pants:'#f2c230',hairStyle:'bald',faceSpec:{dummy:true,ink:'#2a2326'}};
const SKINS=['#fffdf4','#fbe3c4','#e8b98a','#c58c5f','#8d5a3c'];
const SHIRTS=['#e8453c','#3d8bd6','#4caf50','#f4c542','#e987a5','#9a5fd0','#2f7f86','#f08a3c','#f3e6c8','#6fa3c8'];
const PANTS=['#2e3a4f','#4a3f35','#3b5f73','#5a4a6a','#2a2326','#6b7a4a'];
const HAIR=['#2a2326','#4a3427','#8a5a2a','#d9b45a','#b8472f','#6b6b70'];
export function crowdSpec(i,{kids=.22}={}){
 const r=rand(900+i*37);const pick=a=>a[Math.floor(r()*a.length)];
 const kid=r()<kids,s=kid?.62+r()*.12:.9+r()*.2;
 const spec={name:'crowd'+i,scale:s,headScale:kid?1.18:1,skin:pick(SKINS),shirt:pick(SHIRTS),pants:pick(PANTS),hair:pick(HAIR),hairStyle:pick(['tuft','curly','bob','bun','fringe','slick','curly']),faceSpec:{}};
 const roll=r();
 if(!kid&&roll<.18)spec.straw='#e6c36a';else if(roll<.3)spec.cap=pick(SHIRTS);else if(roll<.4)spec.beanie=pick(SHIRTS);else if(kid&&roll<.7)spec.partyHat=pick(SHIRTS);else if(roll<.5)spec.topHat='#3a3340';
 if(!kid&&r()<.25)spec.dress=pick(SHIRTS);
 if(r()<.2)spec.scarf=pick(SHIRTS);
 if(!kid&&r()<.15)spec.faceSpec.glasses=true;
 return spec;
}
// crowd layout: [x,z,yaw] around the machine yard, facing the machine/stage
export function crowdLayout(n,{cx=0,cz=3.2,rx=7.5,rz=3.6}={}){
 const r=rand(4242),out=[];
 for(let i=0;i<n;i++){const a=Math.PI*(.08+.84*(i/(n-1)))+(r()-.5)*.06,row=i%3,d=1+row*.22;const x=cx+Math.cos(a)*rx*d*-1,z=cz+Math.sin(a)*rz*d;out.push({x,z,a,row});}
 return out;
}
// idle / reaction poses for crowd members; returns args for actor.pose (all pure functions of t)
export function crowdPose(p,t,mode,i,target=[0,0,-1]){
 const ph=i*1.7,x=p.x,z=p.z,yaw=Math.atan2(target[0]-x,target[2]-z);
 const bob=Math.sin(t*3+ph)*.012;
 const base={pos:[x,0,z],yaw:yaw+Math.sin(t*.7+ph)*.08,crouch:.02+bob,lean:Math.sin(t*1.3+ph)*.02,headYaw:Math.sin(t*.9+ph)*.2,face:'grin'};
 if(mode==='cheer'){const up=.5+.5*Math.sin(t*7+ph);return {...base,crouch:.03+.05*up,face:'joy',hands:[{torso:[-.26,.52+up*.22,.1]},{torso:[.26,.52+(1-up)*.22,.1]}],headPitch:-.2};}
 if(mode==='clap'){const k=.5+.5*Math.sin(t*9+ph);return {...base,face:'grin',hands:[{torso:[-.04-.14*k,.28,.3]},{torso:[.04+.14*k,.28,.3]}]};}
 if(mode==='gasp'){return {...base,face:'gasp',lean:-.12,headPitch:-.12,hands:[{head:[-.2,-.12,.16]},{head:[.2,-.12,.16]}],crouch:.0};}
 if(mode==='point'){return {...base,face:'shock',hands:[{torso:[-.2,.1,.4]},{torso:[.4,.6,.4]}]};}
 if(mode==='wave'){const k=Math.sin(t*8+ph);return {...base,face:'joy',hands:[{torso:[-.2,.1,.1]},{torso:[.32+.08*k,.7,.1]}]};}
 return {...base,face:i%3===0?'grin':'neutral'};
}
