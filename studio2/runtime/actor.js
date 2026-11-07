// Hybrid cast: real 3D head/torso/costume, 2D face ink on the head surface, 2D stick limbs with fixed bone lengths.
// Everything is posed from absolute inputs on every call. Limbs never stretch: unreachable targets are clamped
// and reported in the returned `reach` so the scene author moves the blocking instead.
import {drawFace,faceParams,CANVAS} from './face.js';
const UPPER=.285,FORE=.255,THIGH=.37,SHIN=.37,H0=.73;
export function makeActorFactory(ctx){
 const {THREE,scene,style,limbMat,INK}=ctx;
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
  const s=spec.scale??1,headK=spec.headScale??1;
  const root=new THREE.Group();root.name='Actor '+(spec.name||'');root.scale.setScalar(s);scene.add(root);
  const torso=new THREE.Group();torso.position.y=H0;root.add(torso);
  const vol=new THREE.Group();torso.add(vol);
  const skin=std(spec.skin||'#fffdf4'),shirt=std(spec.shirt||'#f2e8d0'),pants=std(spec.pants||'#3b5f73'),dark=std(spec.hair||'#4a3427'),white=std('#fff7e8');
  const trim=std(spec.trim||'#e8ac32');
  // ---- torso & clothes
  if(spec.dress){cone(vol,'Dress skirt',[0,-.2,0],.27,.6,std(spec.dress),[Math.PI,0,0]).scale.set(1,1,.78);oval(vol,'Dress top',[0,.3,-.01],[.168,.3,.12],std(spec.dress));}
  else{oval(vol,'Rounded shirt',[0,.295,-.015],[.173,.305,.125],shirt);oval(vol,'Trouser seat',[0,.015,-.015],[.14,.09,.105],pants);}
  oval(vol,'Neck',[0,.61,0],[.065,.105,.062],skin);
  if(spec.sleeves)for(const side of [-1,1])oval(vol,'Sleeve',[side*.172,.5,0],[.05,.07,.05],std(spec.sleeves),[0,0,side*.5]);
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
  for(const side of [-1,1])oval(head,'Ear',[side*.208,-.03,0],[.03,.045,.026],skin).userData.noOutline=true;
  const hs=spec.hairStyle||'tuft';
  if(hs!=='bald'){
   oval(head,'Hair back',[0,.065,-.065],[.221,.197,.158],dark);
   if(hs==='tuft'){for(const [x,y,r] of [[-.12,.22,.28],[-.03,.255,.1],[.07,.25,-.1],[.15,.2,-.3],[-.17,.16,.6]])cone(head,'Hair spike',[x,y,.02],.05,.13,dark,[0,0,-r]);}
   if(hs==='slick'){oval(head,'Slick hair',[0,.095,.01],[.226,.15,.2],dark);oval(head,'Hair part',[-.06,.15,.12],[.1,.05,.05],dark);}
   if(hs==='curly'){for(const [x,y,z] of [[-.15,.14,.05],[-.05,.2,.04],[.06,.21,.03],[.16,.14,.05],[0,.15,.13],[-.1,.1,.12],[.11,.1,.12]])oval(head,'Hair curl',[x,y,z],[.075,.075,.07],dark);}
   if(hs==='bob'){oval(head,'Bob hair',[0,-.06,-.04],[.245,.26,.2],dark);for(const x of [-.14,-.05,.04,.13])oval(head,'Fringe',[x,.12,.13],[.06,.055,.05],dark);}
   if(hs==='bun'){oval(head,'Bun',[0,.26,-.04],[.08,.08,.08],dark);for(const x of [-.14,-.05,.04,.13])oval(head,'Fringe',[x,.12,.13],[.06,.055,.05],dark);}
   if(hs==='fringe'){for(const x of [-.15,-.08,0,.08,.15])oval(head,'Fringe',[x,.115,.125],[.062,.06,.05],dark);}
  }
  if(spec.cap){const c=std(spec.cap);oval(head,'Cap crown',[0,.15,-.015],[.23,.16,.19],c);oval(head,'Cap brim',[0,.13,.145],[.24,.023,.13],c);}
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
  // ---- face patch (2D ink conforming to the head surface)
  const cv=document.createElement('canvas');cv.width=CANVAS.w;cv.height=CANVAS.h;
  const pen=cv.getContext('2d',{willReadFrequently:true}),tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.generateMipmaps=false;tex.minFilter=THREE.LinearFilter;
  const geo=new THREE.PlaneGeometry(.36,.29,40,32),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i)-.045,z=.19*Math.sqrt(Math.max(0,1-(x/.218)**2-((y+.02)/.235)**2))+.002;pos.setXYZ(i,x,y,z);}
  geo.computeVertexNormals();
  const face=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.01,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  face.name='2D facial ink';face.userData.noOutline=true;face.castShadow=false;face.receiveShadow=false;
  style(vol,{importance:'character'});style(head,{importance:'character'});head.add(face);
  root.traverse(o=>{if(o.isMesh)o.receiveShadow=false;});
  // ---- limbs & feet (2D sticks in world space)
  const limbs=[0,1].map(()=>({upper:ctx.stroke(),lower:ctx.stroke(),hand:new THREE.Mesh(new THREE.SphereGeometry(.036,12,10),limbMat)}));limbs.forEach(l=>scene.add(l.hand));
  const legs=[0,1].map(()=>{const shoe=new THREE.Mesh(new THREE.SphereGeometry(1,14,10),limbMat);shoe.scale.set(.05,.032,.085);scene.add(shoe);return {upper:ctx.stroke(),lower:ctx.stroke(),shoe};});
  const blob=new THREE.Mesh(new THREE.CircleGeometry(.27,32),new THREE.MeshBasicMaterial({color:'#302335',transparent:true,opacity:.16,depthWrite:false}));blob.rotation.x=-Math.PI/2;scene.add(blob);
  let lastFace='';
  // targets: [x,y,z] world | Vector3 | {torso:[x,y,z]} | {root:[...]} | {head:[...]} (resolved AFTER this pose is applied -> seek-safe)
  const resolve=(t)=>Array.isArray(t)?V(...t):t.isVector3?t.clone():t.torso?torso.localToWorld(V(...t.torso)):t.root?root.localToWorld(V(...t.root)):t.head?head.localToWorld(V(...t.head)):(()=>{throw Error('bad target')})();
  const tmpQ=new THREE.Quaternion();
  function pose(p={}){
   const pos=p.pos||[0,0,0];root.position.set(pos[0],pos[1],pos[2]);root.rotation.y=p.yaw||0;
   root.visible=p.visible!==false;for(const l of limbs){l.upper.visible=l.lower.visible=l.hand.visible=root.visible;}for(const l of legs){l.upper.visible=l.lower.visible=l.shoe.visible=root.visible;}blob.visible=root.visible&&p.shadow!==false;
   torso.position.set(p.hipX||0,H0-(p.crouch||0),p.hipZ||0);torso.rotation.set(p.lean||0,p.twist||0,p.sway||0,'YXZ');
   head.rotation.set(p.headPitch||0,p.headYaw||0,p.headRoll||0,'YXZ');
   const f=faceParams(p.face),sig=JSON.stringify(f);if(sig!==lastFace){drawFace(pen,f,spec.faceSpec||{});tex.needsUpdate=true;lastFace=sig;}
   root.updateMatrixWorld(true);
   let reach=0;
   const rq=root.getWorldQuaternion(tmpQ.clone());
   for(let j=0;j<2;j++){
    const side=j?1:-1,target=p.hands?.[j];
    const sh=torso.localToWorld(V(side*.16,.42,0)),rest=torso.localToWorld(V(side*.20,-.09,.02));
    const tgt=target?resolve(target):rest;
    const poleHint=p.poles?.[j]?(Array.isArray(p.poles[j])?V(...p.poles[j]):p.poles[j].clone()):V(side*1,-.65,-.15).applyQuaternion(torso.getWorldQuaternion(tmpQ.clone()));
    const arm=solveTwo(sh,tgt,poleHint,UPPER*s,FORE*s);reach=Math.max(reach,arm.err);
    const L=limbs[j];ctx.line(L.upper,sh,arm.mid);ctx.line(L.lower,arm.mid,arm.end);L.hand.position.copy(arm.end);
    const hip=torso.localToWorld(V(side*.085,0,0));
    const ft=p.feet?.[j],foot=ft?resolve(ft):root.localToWorld(V(side*.16*(p.stance??1),p.footLift?.[j]||0,p.footZ?.[j]||0));
    const fwd=V(0,0,1).applyQuaternion(rq).add(V(0,0,0));
    const leg=solveTwo(hip,foot,fwd,THIGH*s,SHIN*s);reach=Math.max(reach,leg.err*.5);
    const G=legs[j];ctx.line(G.upper,hip,leg.mid);ctx.line(G.lower,leg.mid,leg.end);G.shoe.position.copy(leg.end).add(V(0,.03*s,.03*s).applyQuaternion(rq));G.shoe.quaternion.copy(rq);G.shoe.scale.set(.05*s,.032*s,.085*s);
   }
   blob.position.set(root.position.x,.012+root.position.y*0,root.position.z);blob.scale.setScalar(s*(p.blob??1));
   return {reach};
  }
  function hide(){root.visible=false;for(const l of limbs){l.upper.visible=l.lower.visible=l.hand.visible=false;}for(const l of legs){l.upper.visible=l.lower.visible=l.shoe.visible=false;}blob.visible=false;}
  return {root,torso,head,pose,hide,spec,scale:s,
   handWorld(side,out=V()){return torso.localToWorld(out.set(side*.16,.42,0));},
   local(x,y,z){return root.localToWorld(V(x,y,z));},
   torsoLocal(x,y,z){return torso.localToWorld(V(x,y,z));},
   headLocal(x,y,z){return head.localToWorld(V(x,y,z));}};
 };
}
