// Staged text-free cover (not an actual video frame): inventor smirking in front of the glowing ring, a tiny
// bow-tie man floating in deep space inside it, plus a code-drawn flat clock icon. No text, no image generation.
import {makeKit} from '/runtime/kit.js';
import {makeActorFactory} from '/runtime/actor.js';
import {buildMachine,buildHammer} from './props.mjs';
import {buildFigurine,buildWrench} from './props2.mjs';
import {buildSet} from './set.mjs';
import {INVENTOR} from './cast.mjs';
export const authored=true;
export async function build(ctx){
 const {THREE}=ctx,kit=makeKit(ctx),V=(a)=>new THREE.Vector3(...a);
 buildSet(ctx,kit);
 const machine=buildMachine(ctx,kit);ctx.scene.add(machine.root);
 // deep-space disc just behind the portal, with the tiny rival floating in it
 const cv=document.createElement('canvas');cv.width=512;cv.height=512;const p=cv.getContext('2d');p.fillStyle='#07102a';p.fillRect(0,0,512,512);let z=7;const rr=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296;};for(let i=0;i<160;i++){p.fillStyle='rgba(255,255,'+(190+Math.floor(rr()*65))+','+(.4+rr()*.6)+')';p.beginPath();p.arc(rr()*512,rr()*512,.8+rr()*2.4,0,7);p.fill();}
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const disc=new THREE.Mesh(new THREE.CircleGeometry(1.25,64),new THREE.MeshBasicMaterial({map:tex}));disc.position.set(0,1.95,-.35);ctx.scene.add(disc);
 const rival=buildFigurine(ctx,kit,{body:'#f7f1e3',bowTie:'#c4402f',scale:3.2});rival.root.position.set(.25,1.65,-.15);rival.root.rotation.set(.35,-.5,.45);ctx.scene.add(rival.root);
 const earth=new THREE.Mesh(new THREE.SphereGeometry(.09,24,18),new THREE.MeshStandardMaterial({color:'#2f78d0',roughness:.5}));earth.position.set(-.8,2.6,-.2);ctx.scene.add(earth);
 const create=makeActorFactory(ctx);const hero=create(INVENTOR);
 const wrench=buildWrench(ctx,kit);ctx.scene.add(wrench.root);
 machine.setPortal(.55,0);machine.chair.visible=false;
 return {update(t){
  const wp=V([.35,1.2,2.45]);wrench.root.visible=true;wrench.place(wp,V([.45,.9,.1]),.3);
  hero.pose({pos:[-.2,0,2.4],yaw:.12,crouch:.03,lean:.04,face:'smug',headYaw:.08,headPitch:-.02,hands:[V([.2,.97,2.43]),{torso:[.24,.0,.12]}],feet:[[-.36,0,2.4],[-.04,0,2.4]]});
  return {camera:{position:[.1,1.45,5.0],target:[0,1.65,0],fov:50,shadow:12,solar:14,sun:[-.3,.8,.6]},
   overlay(pen){ // flat clock with a rewind arrow, top-left (code-drawn, no text)
    const cx=210,cy=250,R=118;pen.save();pen.lineJoin=pen.lineCap='round';
    pen.fillStyle='#fff7e8';pen.strokeStyle='#2a1f22';pen.lineWidth=16;pen.beginPath();pen.arc(cx,cy,R,0,7);pen.fill();pen.stroke();
    pen.lineWidth=11;pen.beginPath();pen.moveTo(cx,cy);pen.lineTo(cx,cy-78);pen.moveTo(cx,cy);pen.lineTo(cx-52,cy+22);pen.stroke();
    pen.strokeStyle='#e8453c';pen.lineWidth=20;pen.beginPath();pen.arc(cx,cy,R+34,Math.PI*.15,Math.PI*1.25);pen.stroke();
    pen.fillStyle='#e8453c';pen.beginPath();pen.moveTo(cx-125,cy-20);pen.lineTo(cx-175,cy+55);pen.lineTo(cx-70,cy+50);pen.closePath();pen.fill();
    pen.restore();}};
 }};
}
