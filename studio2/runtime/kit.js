// Prop-building kit: rounded/bevelled primitives, tubes, lathes, in-world signs. Original geometry, all code.
// Flags set on mesh.userData are honoured by finish(): glass, emissive(+emissiveIntensity), basic, noOutline.
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export function makeKit(ctx){
 const {THREE,scene,style}=ctx;
 const mats=new Map();
 const mat=(color,o={})=>{const key=color+JSON.stringify(o);if(!mats.has(key)){const m=new THREE.MeshStandardMaterial({color,roughness:o.rough??.7,metalness:o.metal??0});if(o.name)m.name=o.name;mats.set(key,m);}return mats.get(key).clone();};
 const M={ // shared palette
  wood:'#b98954',woodDark:'#7f5a38',woodLight:'#d8b27a',steel:'#a9b4bd',copper:'#c9743a',brass:'#d0a03c',red:'#d8402c',teal:'#1f9d8f',cream:'#f3e6c8',
  navy:'#27415c',plum:'#6b2d5c',white:'#f7f1e3',black:'#2a2326',yellow:'#f0c23a',orange:'#ec8a2b',blue:'#3d8bd6',green:'#4caf50',pink:'#e987a5'
 };
 function add(parent,geo,material,name,p=[0,0,0],rot=null,scale=null,flags={}){
  const m=new THREE.Mesh(geo,material);m.name=name||'part';m.position.set(...p);if(rot)m.rotation.set(...rot);if(scale)m.scale.set(...scale);Object.assign(m.userData,flags);parent.add(m);return m;
 }
 const box=(parent,name,p,size,material,rot,flags)=>add(parent,new THREE.BoxGeometry(...size),material,name,p,rot,null,flags);
 const rbox=(parent,name,p,size,r,material,rot,flags)=>add(parent,new RoundedBoxGeometry(size[0],size[1],size[2],4,Math.min(r,Math.min(...size)/2-1e-3)),material,name,p,rot,null,flags);
 const cyl=(parent,name,p,rt,rb,h,material,rot,flags,seg=28)=>add(parent,new THREE.CylinderGeometry(rt,rb,h,seg),material,name,p,rot,null,flags);
 const sph=(parent,name,p,r,material,scale,flags)=>add(parent,new THREE.SphereGeometry(r,28,20),material,name,p,null,scale,flags);
 const torus=(parent,name,p,R,r,material,rot,flags,arc=Math.PI*2)=>add(parent,new THREE.TorusGeometry(R,r,14,Math.max(8,Math.round(48*arc/(Math.PI*2))),arc),material,name,p,rot,null,flags);
 const cone=(parent,name,p,r,h,material,rot,flags,seg=24)=>add(parent,new THREE.ConeGeometry(r,h,seg),material,name,p,rot,null,flags);
 const tube=(parent,name,pts,r,material,flags,closed=false)=>add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),closed),Math.max(12,pts.length*14),r,10,closed),material,name,[0,0,0],null,null,flags);
 const lathe=(parent,name,p,profile,material,flags,seg=36)=>add(parent,new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),seg),material,name,p,null,null,flags);
 // bolt/rivet head
 const bolt=(parent,p,r=.018,material,rot)=>cyl(parent,'bolt head',p,r,r,r*.7,material||mat(M.steel,{metal:.5,rough:.4,name:'steel'}),rot,{noOutline:true},8);
 function gear(parent,name,p,teeth,rOuter,rInner,thick,material,rot){
  const sh=new THREE.Shape(),n=teeth*4;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=(i%4===1||i%4===2)?rOuter:rInner;i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  const hole=new THREE.Path();hole.absarc(0,0,rInner*.35,0,Math.PI*2,true);sh.holes.push(hole);
  const g=new THREE.ExtrudeGeometry(sh,{depth:thick,bevelEnabled:true,bevelSize:thick*.12,bevelThickness:thick*.12,bevelSegments:2});g.translate(0,0,-thick/2);
  return add(parent,g,material,name,p,rot);
 }
 // in-world sign / label: canvas texture on a plane (this is world text, not a caption)
 function signTexture(lines,{w=512,h=256,bg='#f3e6c8',fg='#2a2326',border='#2a2326',font='bold 64px Arial',size=null,mono=false}={}){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  g.fillStyle=bg;g.fillRect(0,0,w,h);if(border){g.strokeStyle=border;g.lineWidth=h*.035;g.strokeRect(g.lineWidth/2,g.lineWidth/2,w-g.lineWidth,h-g.lineWidth);}
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
  const arr=Array.isArray(lines)?lines:[lines];const fs=size||Math.min(h/(arr.length+.6),w/Math.max(...arr.map(s=>s.length))*1.5);g.font=(mono?'bold ':'bold ')+Math.round(fs)+'px '+(mono?'Consolas, monospace':'Arial');
  arr.forEach((t,i)=>g.fillText(t,w/2,h/2+(i-(arr.length-1)/2)*fs*1.15));
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
 }
 function sign(parent,name,p,size,lines,opts={},rot){
  const tex=signTexture(lines,{w:opts.w||512,h:Math.round((opts.w||512)*size[1]/size[0]),...opts});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size[0],size[1]),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.name=name;m.position.set(...p);if(rot)m.rotation.set(...rot);m.userData.noOutline=true;m.userData.basic=true;parent.add(m);return m;
 }
 // style a group and apply per-mesh flags (glass / emissive / basic) that style() would erase
 function finish(group,importance='prop'){
  style(group,{importance});
  group.traverse(o=>{
   if(!o.isMesh||o.userData.outline)return;
   if(o.userData.glass){const old=o.material;o.material=new THREE.MeshStandardMaterial({color:old.color,roughness:.08,metalness:.1,transparent:true,opacity:o.userData.glassOpacity??.38,depthWrite:false});o.castShadow=false;for(const c of [...o.children])if(c.userData.outline)o.remove(c);}
   if(o.userData.basic){const old=o.material;o.material=new THREE.MeshBasicMaterial({map:old.map,color:old.color});o.castShadow=false;}
   if(o.userData.emissive){const old=o.material;o.material=new THREE.MeshStandardMaterial({color:old.color,emissive:new THREE.Color(o.userData.emissive),emissiveIntensity:o.userData.emissiveIntensity??1.4,roughness:.5});}
  });
  return group;
 }
 return {M,mat,add,box,rbox,cyl,sph,torus,cone,tube,lathe,bolt,gear,sign,signTexture,finish};
}
