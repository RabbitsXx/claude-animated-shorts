// Hybrid cast: real 3D head/torso/costume, 2D face ink on the head surface, 2D stick limbs with fixed bone lengths.
// Everything is posed from absolute inputs on every call. Limbs never stretch: unreachable targets are clamped
// and reported in the returned `reach` so the scene author moves the blocking instead.
import {drawFace,faceParams,CANVAS} from './face.js';
import {resolveLook} from './look.js';
import {HAIR,PATCH,drawHair,hairZ} from './hair.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {BODY,paintFront,paintSide,bodyTaper,bodyLean,shoulderZ,weldedNormals} from './clothes.js';
import {taperStroke,quadPts} from './pen.js';
import {characterPart} from '/repo/studio2/library/character-parts.mjs';
const UPPER=.285,FORE=.255,THIGH0=.37,SHIN0=.37,H00=.73;
export function makeActorFactory(ctx){
 const {THREE,scene,style,INK}=ctx;
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
 const std=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:o.rough??.78,metalness:o.metal??0});
 const oval=(parent,name,p,s,material,rot)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),material);m.name=name;m.position.set(...p);m.scale.set(...s);if(rot)m.rotation.set(...rot);parent.add(m);return m;};
 const cone=(parent,name,p,r,h,material,rot)=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,16),material);m.name=name;m.position.set(...p);if(rot)m.rotation.set(...rot);parent.add(m);return m;};
 const cyl=(parent,name,p,rt,rb,h,material,rot,seg=24)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),material);m.name=name;m.position.set(...p);if(rot)m.rotation.set(...rot);parent.add(m);return m;};
 const torus=(parent,name,p,R,r,material,rot)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(R,r,12,28),material);m.name=name;m.position.set(...p);if(rot)m.rotation.set(...rot);parent.add(m);return m;};
 function solveTwo(a,b,pole,l1,l2){ // a root, b target, pole hint; returns {mid,end,err}
  const d=b.clone().sub(a);let dist=d.length(),err=0;const max=l1+l2-1e-4,min=Math.abs(l1-l2)+1e-3;
  if(dist>max){err=dist-max;d.setLength(max);dist=max;}else if(dist<min){err=min-dist;if(dist<1e-6)d.set(0,-1,0);d.setLength(min);dist=min;}
  const dir=d.clone().normalize(),end=a.clone().add(d);let bend=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if(bend.length()<1e-6){bend=Math.abs(dir.x)<.9?V(1,0,0):V(0,0,1);bend.sub(dir.clone().multiplyScalar(bend.dot(dir)));}
  bend.normalize();const along=(l1*l1-l2*l2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,l1*l1-along*along));
  return {mid:a.clone().add(dir.multiplyScalar(along)).add(bend.multiplyScalar(h)),end,err};
 }
 return function createActor(spec={}){
  const look=resolveLook(spec.look),s=spec.scale??1,headK=spec.headScale??look.headScale,THIGH=THIGH0*look.legK,SHIN=SHIN0*look.legK,H0=H00*look.legK; // short stick legs in the ref look
  const limbMat=look.flat?new THREE.MeshBasicMaterial({color:look.ink}):ctx.limbMat; // flat look: pure ink sticks, never shaded
  const root=new THREE.Group();root.name='Actor '+(spec.name||'');root.scale.setScalar(s);scene.add(root);
  const torso=new THREE.Group();torso.position.y=H0;root.add(torso);
  const vol=new THREE.Group();torso.add(vol);
  const skin=std(spec.skin||'#fffdf4'),shirt=std(spec.shirt||'#f2e8d0'),pants=std(spec.pants||'#3b5f73'),dark=std(spec.hair||'#4a3427'),white=std('#fff7e8');
  const trim=std(spec.trim||'#e8ac32');
  // ---- torso & clothes
  if(spec.dress){cone(vol,'Dress skirt',[0,-.2,0],.27,.6,std(spec.dress),[Math.PI,0,0]).scale.set(1,1,.78);oval(vol,'Dress top',[0,.3,-.01],[.168,.3,.12],std(spec.dress));}
  else if(look.oneBody){ // ONE rounded-square body: front face = detailed drawing, sides/back = the same two colours split at the same waist line
   const mkTex=(cv)=>{const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;return t;};
   const cf=document.createElement('canvas');cf.width=BODY.W;cf.height=BODY.H;
   const cols={shirt:spec.shirt||'#f2e8d0',pants:spec.pants||'#3b5f73',ink:look.ink};
   paintFront(cf.getContext('2d'),{...cols,outfit:spec.outfit||'tee',emblem:spec.emblem||null,symbol:spec.symbol||'$',jacket:spec.jacket,tie:spec.suitTie});
   const cs=document.createElement('canvas');cs.width=4;cs.height=256;const sideCols={...cols,shirt:spec.outfit==='suit'?(spec.jacket||cols.pants):cols.shirt}; // a jacket is jacket-coloured on the sides and back
   paintSide(cs.getContext('2d'),sideCols);
   const M=(t)=>new THREE.MeshStandardMaterial({map:t,roughness:.8}),side=M(mkTex(cs)),front=M(mkTex(cf)),top=new THREE.MeshStandardMaterial({color:sideCols.shirt,roughness:.8}),bottom=new THREE.MeshStandardMaterial({color:cols.pants,roughness:.8});
   const bodyGeo=new RoundedBoxGeometry(BODY.width,BODY.height,BODY.depth,5,BODY.radius),bp=bodyGeo.attributes.position;
   for(let i=0;i<bp.count;i++){const f=bodyTaper(bp.getY(i),BODY.height);bp.setX(i,bp.getX(i)*f);bp.setZ(i,bp.getZ(i)*f-bodyLean(bp.getY(i),BODY.height));} // narrow chest, wide hips
   bodyGeo.setAttribute('normal',new THREE.BufferAttribute(weldedNormals(bp.array,bodyGeo.index?bodyGeo.index.array:null),3));
   const bodyMesh=new THREE.Mesh(bodyGeo,[side,side,top,bottom,front,side]); // +x -x +y -y +z -z
   bodyMesh.name='Body (shirt and trousers)';bodyMesh.position.set(0,BODY.centerY,-.012);vol.add(bodyMesh);}
  else{oval(vol,'Rounded shirt',[0,.295,-.015],[.173,.305,.125],shirt);oval(vol,'Trouser seat',[0,.015+.02*(look.trousers-1),-.015],[.14*(1+.2*(look.trousers-1)),.09*look.trousers,.105*(1+.2*(look.trousers-1))],pants);}
  oval(vol,'Neck',[0,.61,0],[.065,.105,.062],skin); // hidden inside the head: no neck is visible (owner: head sits directly on the body)
  if(spec.sleeves&&look.shoulders)for(const side of [-1,1])oval(vol,'Sleeve',[side*.172,.5,0],[.05,.07,.05],std(spec.sleeves),[0,0,side*.5]);
  if(spec.vest)for(const side of [-1,1]){oval(vol,'Vest panel',[side*.112,.295,.07],[.064,.255,.073],std(spec.vest));oval(vol,'Vest button',[side*.087,.43,.137],[.012,.012,.009],std('#2a1c1c')).userData.noOutline=true;}
  if(spec.collar)for(const side of [-1,1])oval(vol,'Collar',[side*.058,.53,.085],[.042,.072,.029],white,[0,0,side*.5]).userData.noOutline=true;
  if(spec.apron){
   const ap=std(spec.apron);oval(vol,'Apron front',[0,.25,.085],[.15,.27,.052],ap);
   for(const side of [-1,1])oval(vol,'Apron strap',[side*.088,.5,.04],[.022,.15,.06],ap,[0,0,side*.18]);
   for(const side of [-1,1]){oval(vol,'Apron pocket',[side*.07,.12,.134],[.052,.062,.018],std(spec.apronPocket||'#a96f3a'));}
   oval(vol,'Apron patch',[.06,.30,.138],[.04,.04,.012],std('#6fa3c8')).userData.noOutline=true;
   cyl(vol,'Screwdriver handle',[-.07,.2,.152],.012,.012,.06,std('#d8402c'),[.35,0,.1],10);
   cyl(vol,'Screwdriver shaft',[-.071,.255,.158],.004,.004,.06,std('#bfc6cc',{metal:.5}),[.35,0,.1],8).userData.noOutline=true;
  }
  if(spec.bowTie){const bt=std(spec.bowTie);for(const side of [-1,1])cone(vol,'Bow tie wing',[side*.045,.56,.115],.036,.08,bt,[0,0,side*Math.PI/2*-1]).userData.noOutline=true;oval(vol,'Bow knot',[0,.56,.117],[.016,.016,.014],bt).userData.noOutline=true;}
  if(spec.tie){cone(vol,'Tie',[0,.4,.13],.03,.22,std(spec.tie),[Math.PI,0,0]).userData.noOutline=true;}
  if(spec.badge){oval(vol,'Badge',[.1,.4,.145],[.026,.026,.01],std(spec.badge)).userData.noOutline=true;}
  if(spec.scarf){torus(vol,'Scarf',[0,.58,0],.09,.036,std(spec.scarf),[Math.PI/2,0,0]);}
  // ---- head
  const head=new THREE.Group();head.name='Head';head.position.set(0,.76,0);head.scale.setScalar(headK);torso.add(head);
  oval(head,'Head',[0,-.02,0],[.218,.235,.19],skin);
  if(look.ears)for(const side of [-1,1])oval(head,'Ear',[side*.208,-.03,0],[.03,.045,.026],skin).userData.noOutline=true;
  const hs=spec.hairStyle||'tuft';
  const bhair=hs!=='bald'&&look.blenderParts!==false?characterPart(THREE,spec.cap?'hair-capped':'hair-'+hs,{hair:spec.hair||'#4a3427'}):null; // Blender-sculpted locks (library/character-parts.mjs); null -> the built-in parts below
  if(bhair){bhair.name='Hair (Blender '+hs+')';head.add(bhair);}
  const flatHair=look.flatHair&&!!HAIR[hs]&&!bhair;
  if(hs!=='bald'&&!flatHair&&!bhair){
   oval(head,'Hair back',[0,.065,-.065],[.221,.197,.158],dark);
   if(hs==='tuft'){for(const [x,y,r] of [[-.12,.22,.28],[-.03,.255,.1],[.07,.25,-.1],[.15,.2,-.3],[-.17,.16,.6]])cone(head,'Hair spike',[x,y,.02],.05,.13,dark,[0,0,-r]);}
   if(hs==='slick'){oval(head,'Slick hair',[0,.095,.01],[.226,.15,.2],dark);oval(head,'Hair part',[-.06,.15,.12],[.1,.05,.05],dark);}
   if(hs==='curly'){for(const [x,y,z] of [[-.15,.14,.05],[-.05,.2,.04],[.06,.21,.03],[.16,.14,.05],[0,.15,.13],[-.1,.1,.12],[.11,.1,.12]])oval(head,'Hair curl',[x,y,z],[.075,.075,.07],dark);}
   if(hs==='bob'){oval(head,'Bob hair',[0,-.06,-.04],[.245,.26,.2],dark);for(const x of [-.14,-.05,.04,.13])oval(head,'Fringe',[x,.12,.13],[.06,.055,.05],dark);}
   if(hs==='bun'){oval(head,'Bun',[0,.26,-.04],[.08,.08,.08],dark);for(const x of [-.14,-.05,.04,.13])oval(head,'Fringe',[x,.12,.13],[.06,.055,.05],dark);}
   if(hs==='fringe'){for(const x of [-.15,-.08,0,.08,.15])oval(head,'Fringe',[x,.115,.125],[.062,.06,.05],dark);}
  }
  const bcap=spec.cap&&look.blenderParts!==false?characterPart(THREE,'cap',{cap:spec.cap}):null;if(bcap){bcap.name='Cap (Blender)';head.add(bcap);}
  if(spec.cap&&!bcap){const c=std(spec.cap);oval(head,'Cap crown',[0,.15,-.015],[.23,.16,.19],c);oval(head,'Cap brim',[0,.13,.145],[.24,.023,.13],c);}
  if(spec.topHat){const c=std(spec.topHat);cyl(head,'Top hat crown',[0,.31,0],.14,.15,.23,c);cyl(head,'Top hat brim',[0,.19,0],.27,.27,.025,c);cyl(head,'Hat band',[0,.225,0],.152,.152,.04,std(spec.hatBand||'#c4402f')).userData.noOutline=true;}
  if(spec.straw){const c=std(spec.straw);cyl(head,'Straw brim',[0,.17,0],.31,.31,.02,c);cyl(head,'Straw crown',[0,.23,0],.15,.17,.11,c);}
  if(spec.beanie){const c=std(spec.beanie);oval(head,'Beanie',[0,.13,-.01],[.235,.17,.2],c);oval(head,'Beanie pom',[0,.3,0],[.05,.05,.05],std('#fff3d0'));}
  if(spec.partyHat){cone(head,'Party hat',[0,.36,0],.12,.3,std(spec.partyHat),[0,0,.08]);oval(head,'Party pom',[.02,.52,0],[.03,.03,.03],std('#ffe35a')).userData.noOutline=true;}
  if(spec.goggles){ // brass goggles pushed up over the forehead
   const brass=std('#c8923a',{metal:.55,rough:.4}),glass=std('#9fd6e6',{rough:.12});
   {const st=torus(head,'Goggle strap',[0,.11,-.01],.215,.02,std('#6a3f24'),[Math.PI/2,0,0]);st.scale.set(1,.9,1);st.userData.noOutline=true;}
   for(const x of [-.075,.075]){torus(head,'Goggle rim',[x,.135,.185],.06,.02,brass,[0,0,0]);const g=cyl(head,'Goggle glass',[x,.135,.185],.055,.055,.018,glass,[Math.PI/2,0,0]);g.userData.noOutline=true;}
   cyl(head,'Goggle bridge',[0,.135,.195],.012,.012,.07,brass,[0,0,Math.PI/2],8).userData.noOutline=true;
  }
  const addFlatHair=()=>{ // flat 2.5D hair sheet: hugs the head where it touches, flat plane above it (runtime/hair.js)
   const hc=document.createElement('canvas');hc.width=PATCH.canvas[0];hc.height=PATCH.canvas[1];
   drawHair(hc.getContext('2d'),hs,{hair:spec.hair||'#4a3427',ink:look.ink,K:look.faceInk/1.4,handDrawn:look.handDrawn});
   const ht=new THREE.CanvasTexture(hc);ht.colorSpace=THREE.SRGBColorSpace;ht.generateMipmaps=false;ht.minFilter=THREE.LinearFilter;
   const hg=new THREE.PlaneGeometry(PATCH.w,PATCH.h,48,40),hp=hg.attributes.position;
   for(let i=0;i<hp.count;i++){const x=hp.getX(i),y=hp.getY(i)+PATCH.cy,z=hairZ(.19*Math.sqrt(Math.max(0,1-(x/.218)**2-((y+.02)/.235)**2)));hp.setXYZ(i,x,y,z);}
   hg.computeVertexNormals();
   const hair=new THREE.Mesh(hg,new THREE.MeshBasicMaterial({map:ht,transparent:true,alphaTest:.05,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide}));
   hair.name='Flat hair sheet';hair.userData.noOutline=true;hair.castShadow=false;hair.receiveShadow=false;head.add(hair);
   for(const sg of [-1,1]){ // the same hair seen from the side: a sheet on each side of the head, so a profile is not a bald ball with a hair line
    const sgm=new THREE.PlaneGeometry(.38,PATCH.h,48,40),sp=sgm.attributes.position;
    for(let i=0;i<sp.count;i++){const z=sp.getX(i),y=sp.getY(i)+PATCH.cy,xs=.218*Math.sqrt(Math.max(0,1-(z/.19)**2-((y+.02)/.235)**2));sp.setXYZ(i,sg*(xs+.02*Math.min(1,xs/.03)),y,z);}
    sgm.computeVertexNormals();const sh=new THREE.Mesh(sgm,hair.material);sh.name='Flat hair side sheet';sh.userData.noOutline=true;sh.castShadow=false;sh.receiveShadow=false;head.add(sh);
   }
  };
  // ---- face patch (2D ink conforming to the head surface)
  const cv=document.createElement('canvas');cv.width=CANVAS.w;cv.height=CANVAS.h;
  const pen=cv.getContext('2d',{willReadFrequently:true}),tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.generateMipmaps=false;tex.minFilter=THREE.LinearFilter;
  const geo=new THREE.PlaneGeometry(.36,.29,40,32),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i)-.045,z=.19*Math.sqrt(Math.max(0,1-(x/.218)**2-((y+.02)/.235)**2))+.002;pos.setXYZ(i,x,y,z);}
  geo.computeVertexNormals();
  const face=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.01,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  face.name='2D facial ink';face.userData.noOutline=true;face.castShadow=false;face.receiveShadow=false;
  const sty={importance:'character',flat:look.flat,outline:look.flat?look.outline:null,inkColour:look.flat?look.ink:null,outlineWorld:look.outlineWorld,handDrawn:look.handDrawn};style(vol,sty);style(head,sty);head.add(face);head.traverse(o=>{if(o.isMesh&&/^Hair[ _]ink/.test(o.name)){o.material=new THREE.MeshBasicMaterial({color:look.ink,side:THREE.BackSide,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp,stencilZPass:THREE.KeepStencilOp});o.renderOrder=20;o.castShadow=o.receiveShadow=false;}}); // hair ink: drawn only OUTSIDE the head's screen footprint (the head writes stencil 1), so the line follows the outer contour and never shows where hair meets the face
  head.traverse(o=>{if(o.isMesh&&o.name==='Head'){const hm=o.material;hm.stencilWrite=true;hm.stencilRef=1;hm.stencilFunc=THREE.AlwaysStencilFunc;hm.stencilZPass=THREE.ReplaceStencilOp;o.renderOrder=-1;}});if(flatHair)addFlatHair(); // added after style(): these sheets keep their own transparent material
  root.traverse(o=>{if(o.isMesh)o.receiveShadow=false;});
  // ---- limbs & feet (2D sticks in world space)
  const limbs=[0,1].map(()=>({upper:ctx.stroke(),lower:ctx.stroke(),hand:new THREE.Mesh(new THREE.SphereGeometry(look.handRadius,14,10),limbMat)}));limbs.forEach(l=>{scene.add(l.hand);for(const m of [l.upper,l.lower]){m.scale.x=m.scale.z=look.armRadius;m.material=limbMat;}if(look.handDrawn){l.upper.geometry=new THREE.CylinderGeometry(.0105,.0135,1,8);l.lower.geometry=new THREE.CylinderGeometry(.0085,.0105,1,8);}});limbs.forEach(l=>{l.hand.userData.noCollide=true;});
  const legs=[0,1].map(()=>{const shoe=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),limbMat);shoe.scale.set(...look.shoeScale);shoe.userData.noCollide=true;scene.add(shoe);const g={upper:ctx.stroke(),lower:ctx.stroke(),shoe};for(const m of [g.upper,g.lower]){m.scale.x=m.scale.z=look.legRadius;m.material=limbMat;}if(look.handDrawn){g.upper.geometry=new THREE.CylinderGeometry(.0092,.0112,1,8);g.lower.geometry=new THREE.CylinderGeometry(.0072,.0092,1,8);}return g;});
  if(look.blenderParts!==false)for(const G of legs){const sn=characterPart(THREE,'sneaker');if(!sn)break;const ss=look.shoeScale;sn.name='Sneaker (Blender)';sn.scale.set(1/ss[0],1/ss[1],1/ss[2]);G.shoe.material=new THREE.MeshBasicMaterial({visible:false});style(sn,sty);G.shoe.add(sn);} // the ink ellipsoid stays as the collision proxy, the sneaker is what you see
  const blob=new THREE.Mesh(new THREE.CircleGeometry(.27,32),new THREE.MeshBasicMaterial({color:'#302335',transparent:true,opacity:.16,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.userData.noCollide=true;scene.add(blob);
  let lastFace='';
  const joints={arm:[null,null],leg:[null,null]};
  // targets: [x,y,z] world | Vector3 | {torso:[x,y,z]} | {root:[...]} | {head:[...]} (resolved AFTER this pose is applied -> seek-safe)
  const resolve=(t)=>Array.isArray(t)?V(...t):t.isVector3?t.clone():t.torso?torso.localToWorld(V(...t.torso)):t.root?root.localToWorld(V(...t.root)):t.head?head.localToWorld(V(...t.head)):(()=>{throw Error('bad target')})();
  const tmpQ=new THREE.Quaternion();
  function pose(p={}){
   const pos=p.pos||[0,0,0];root.position.set(pos[0],pos[1],pos[2]);root.rotation.y=p.yaw||0;
   root.visible=p.visible!==false;for(const l of limbs){l.upper.visible=l.lower.visible=l.hand.visible=root.visible;}for(const l of legs){l.upper.visible=l.lower.visible=l.shoe.visible=root.visible;}blob.visible=root.visible&&p.shadow!==false;
   torso.position.set(p.hipX||0,H0-(p.crouch||0),p.hipZ||0);torso.rotation.set(p.lean||0,p.twist||0,p.sway||0,'YXZ');
   head.rotation.set(p.headPitch||0,p.headYaw||0,p.headRoll||0,'YXZ');
   const f=faceParams(p.face),sig=JSON.stringify(f);if(sig!==lastFace){drawFace(pen,f,{ink:look.ink,inkScale:look.faceInk,darkEyes:look.darkEyes,eyeScale:look.eyeScale,mouthScale:look.mouthScale,...(spec.faceSpec||{})});tex.needsUpdate=true;lastFace=sig;}
   root.updateMatrixWorld(true);
   let reach=0;
   const rq=root.getWorldQuaternion(tmpQ.clone());
   for(let j=0;j<2;j++){
    const side=j?1:-1,target=p.hands?.[j];
    const sh=torso.localToWorld(V(side*look.shoulderX,look.shoulderY,look.oneBody&&!spec.dress?shoulderZ(look.shoulderY):0)),rest=torso.localToWorld(V(side*(look.shoulderX+.04),-.09,.02));
    const tgt=target?resolve(target):rest;
    const poleHint=p.poles?.[j]?(Array.isArray(p.poles[j])?V(...p.poles[j]):p.poles[j].clone()):V(side*1,-.65,-.15).applyQuaternion(torso.getWorldQuaternion(tmpQ.clone()));
    const arm=solveTwo(sh,tgt,poleHint,UPPER*s,FORE*s);reach=Math.max(reach,arm.err);
    joints.arm[j]=[sh.clone(),arm.mid.clone(),arm.end.clone()];
    const L=limbs[j];ctx.line(L.upper,sh,arm.mid);ctx.line(L.lower,arm.mid,arm.end);L.hand.position.copy(arm.end);
    const hip=torso.localToWorld(V(side*.085,0,0));
    const ft=p.feet?.[j],foot=ft?resolve(ft):root.localToWorld(V(side*.16*(p.stance??1),p.footLift?.[j]||0,p.footZ?.[j]||0));
    const fwd=V(0,0,1).applyQuaternion(rq).add(V(0,0,0));
    const leg=solveTwo(hip,foot,fwd,THIGH*s,SHIN*s);reach=Math.max(reach,leg.err*.5);
    joints.leg[j]=[hip.clone(),leg.mid.clone(),leg.end.clone()];
    const G=legs[j];ctx.line(G.upper,hip,leg.mid);ctx.line(G.lower,leg.mid,leg.end);G.shoe.position.copy(leg.end).add(V(0,.03*s,.03*s).applyQuaternion(rq));G.shoe.quaternion.copy(rq);G.shoe.scale.set(look.shoeScale[0]*s,look.shoeScale[1]*s,look.shoeScale[2]*s);
   }
   blob.position.set(root.position.x,.012+root.position.y*0,root.position.z);blob.scale.setScalar(s*(p.blob??1));
   return {reach};
  }
  function hide(){root.visible=false;for(const l of limbs){l.upper.visible=l.lower.visible=l.hand.visible=false;}for(const l of legs){l.upper.visible=l.lower.visible=l.shoe.visible=false;}blob.visible=false;}
  // collision proxies (see collide.js): ellipsoids for the 3D body, small spheres along each stick limb, hand and shoe
  function collision(){
   root.updateMatrixWorld(true);
   const ellipsoids=[],name=spec.name||'actor',unit=new THREE.Matrix4();
   const addMesh=(m,kind)=>{
    const g=m.geometry;let k;
    if(g.parameters&&g.parameters.width&&g.parameters.height&&g.parameters.depth){k=new THREE.Matrix4().makeScale(g.parameters.width/2,g.parameters.height/2,g.parameters.depth/2);}
    else if(g.type==='SphereGeometry'){const r=g.parameters.radius||1;k=new THREE.Matrix4().makeScale(r,r,r);}
    else if(g.type==='CylinderGeometry'){const r=(g.parameters.radiusTop+g.parameters.radiusBottom)/2,h=g.parameters.height/2;k=new THREE.Matrix4().makeScale(r,h,r);}
    else return;
    ellipsoids.push({kind,name:m.name,matrix:new THREE.Matrix4().multiplyMatrices(m.matrixWorld,k)});
   };
   root.traverse(m=>{if(m.isMesh&&!m.userData.outline&&!/2D facial ink|Hair|Goggle|Screwdriver|Apron pocket|Apron strap|Collar|Bow|Badge|Ear|Vest button|Sleeve/.test(m.name))addMesh(m,'body');});
   const sphereAt=(p,r,kind,tipDist)=>ellipsoids.push({kind,name:kind,tipDist,tip:tipDist<.03,matrix:new THREE.Matrix4().compose(p,new THREE.Quaternion(),new THREE.Vector3(r,r,r))});
   for(let j=0;j<2;j++){
    const A=joints.arm[j],G=joints.leg[j];
    if(A){const segs=[[A[0],A[1]],[A[1],A[2]]],total=A[0].distanceTo(A[1])+A[1].distanceTo(A[2]);let run=0;
     for(const [p,q] of segs){const len=p.distanceTo(q),n=Math.max(2,Math.ceil(len/.04));for(let i=0;i<=n;i++){const along=run+len*i/n;sphereAt(p.clone().lerp(q,i/n),.02*look.armRadius,'limb',total-along);}run+=len;}
     sphereAt(A[2],look.handRadius,'hand',0);}
    if(G){const segs=[[G[0],G[1]],[G[1],G[2]]],total=G[0].distanceTo(G[1])+G[1].distanceTo(G[2]);let run=0;
     for(const [p,q] of segs){const len=p.distanceTo(q),n=Math.max(2,Math.ceil(len/.04));for(let i=0;i<=n;i++){const along=run+len*i/n;sphereAt(p.clone().lerp(q,i/n),.02*look.legRadius,'limb',total-along);}run+=len;}
     const sh=legs[j].shoe;sh.updateMatrixWorld(true);ellipsoids.push({kind:'shoe',name:'shoe',matrix:sh.matrixWorld.clone()});}
   }
   return {name,visible:root.visible,ellipsoids};
  }
  const api={root,torso,head,pose,hide,spec,scale:s,collision,
   handWorld(side,out=V()){return torso.localToWorld(out.set(side*look.shoulderX,look.shoulderY,0));},
   hand(j,out=V()){return out.copy(limbs[j].hand.position);}, // world position of the end of arm j (after pose), for the grip check
   local(x,y,z){return root.localToWorld(V(x,y,z));},
   torsoLocal(x,y,z){return torso.localToWorld(V(x,y,z));},
   headLocal(x,y,z){return head.localToWorld(V(x,y,z));}};
  (ctx.actors=ctx.actors||[]).push(api);
  return api;
 };
}
