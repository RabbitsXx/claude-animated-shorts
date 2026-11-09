// Model-overlap checker. Every visible actor is described by ellipsoids (head, torso, neck, hat...), chains of small
// spheres along each stick limb, hands and shoes (actor.collision()). Each one is tested against the TRIANGLES of
// every visible solid prop in the scene (exact sphere/ellipsoid-vs-triangle test in the ellipsoid's own space, plus a
// ray-parity "completely inside" test) and against the other actors' bodies. Pure math: runs in the render page and
// in Node tests. A hit means a body part is inside a prop; it is a bug unless an allow-list pair says it is a contact.
const TOL={body:.02,limb:.035,hand:.11,shoe:.03,pair:.04,prop:.012,subjectLift:.9}; // limb = a stick centreline must be this deep inside a prop to count
const DECOR=/ground|dirt patch|hill|grass|sky|plank gap|slat|bunting|balloon string|shadow|felt|ruler|label|tag|rope|string|wheel spoke|moon|star/i;
export function createCollider(THREE){
 const V3=THREE.Vector3,M4=THREE.Matrix4;
 const isVisible=(o)=>{for(let p=o;p;p=p.parent)if(p.visible===false)return false;return true;};
 const isSolid=(m)=>{
  if(!m.isMesh||m.isInstancedMesh)return false;
  const u=m.userData;if(u.outline||u.noCollide)return false;
  const g=m.geometry;if(!g||!g.attributes||!g.attributes.position)return false;
  const t=g.type;if(t==='PlaneGeometry'||t==='CircleGeometry'||t==='RingGeometry')return false;
  const mat=m.material;if(!mat||mat.isShaderMaterial)return false;
  if(mat.transparent&&mat.opacity<.5)return false;
  if(DECOR.test(m.name))return false;
  return isVisible(m);
 };
 const worldBox=(m)=>{ // box of the transformed geometry bounding box
  const g=m.geometry;if(!g.boundingBox)g.computeBoundingBox();
  const b=g.boundingBox,box=new THREE.Box3(),v=new V3();
  for(let i=0;i<8;i++){v.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(m.matrixWorld);box.expandByPoint(v);}
  return box;
 };
 const worldTris=(m)=>{
  const g=m.geometry,pos=g.attributes.position,idx=g.index,n=idx?idx.count:pos.count,out=new Float64Array(n*3),e=m.matrixWorld.elements;
  for(let i=0;i<n;i++){const k=idx?idx.getX(i):i,x=pos.getX(k),y=pos.getY(k),z=pos.getZ(k);
   out[i*3]=e[0]*x+e[4]*y+e[8]*z+e[12];out[i*3+1]=e[1]*x+e[5]*y+e[9]*z+e[13];out[i*3+2]=e[2]*x+e[6]*y+e[10]*z+e[14];}
  return out;
 };
 // distance from the origin to triangle abc (Ericson, closest point on triangle)
 function distOriginTri(ax,ay,az,bx,by,bz,cx,cy,cz){
  const abx=bx-ax,aby=by-ay,abz=bz-az,acx=cx-ax,acy=cy-ay,acz=cz-az;
  const d1=-(abx*ax+aby*ay+abz*az),d2=-(acx*ax+acy*ay+acz*az);
  const len=(x,y,z)=>Math.sqrt(x*x+y*y+z*z);
  if(d1<=0&&d2<=0)return len(ax,ay,az);
  const bpx=-bx,bpy=-by,bpz=-bz,d3=abx*bpx+aby*bpy+abz*bpz,d4=acx*bpx+acy*bpy+acz*bpz;
  if(d3>=0&&d4<=d3)return len(bx,by,bz);
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);return len(ax+abx*v,ay+aby*v,az+abz*v);}
  const cpx=-cx,cpy=-cy,cpz=-cz,d5=abx*cpx+aby*cpy+abz*cpz,d6=acx*cpx+acy*cpy+acz*cpz;
  if(d6>=0&&d5<=d6)return len(cx,cy,cz);
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return len(ax+acx*w,ay+acy*w,az+acz*w);}
  const va=d3*d6-d5*d4;
  if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));return len(bx+(cx-bx)*w,by+(cy-by)*w,bz+(cz-bz)*w);}
  const den=1/(va+vb+vc),v=vb*den,w=vc*den;
  return len(ax+abx*v+acx*w,ay+aby*v+acy*w,az+abz*v+acz*w);
 }
 // ray from p along a slightly tilted +Y (never exactly through a triangle diagonal): Moller-Trumbore
 const DX=.00731,DY=1,DZ=.00419;
 function rayHitsUp(px,py,pz,t,o){
  const ax=t[o],ay=t[o+1],az=t[o+2],e1x=t[o+3]-ax,e1y=t[o+4]-ay,e1z=t[o+5]-az,e2x=t[o+6]-ax,e2y=t[o+7]-ay,e2z=t[o+8]-az;
  const hx=DY*e2z-DZ*e2y,hy=DZ*e2x-DX*e2z,hz=DX*e2y-DY*e2x,a=e1x*hx+e1y*hy+e1z*hz;
  if(Math.abs(a)<1e-12)return false;
  const f=1/a,sx=px-ax,sy=py-ay,sz=pz-az,u=f*(sx*hx+sy*hy+sz*hz);if(u<0||u>1)return false;
  const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,v=f*(DX*qx+DY*qy+DZ*qz);if(v<0||u+v>1)return false;
  return f*(e2x*qx+e2y*qy+e2z*qz)>1e-9;
 }
 const inside=(tris,p)=>{let n=0;for(let o=0;o<tris.length;o+=9)if(rayHitsUp(p.x,p.y,p.z,tris,o))n++;return (n&1)===1;};
 const extents=(m)=>{const e=m.elements;return [Math.hypot(e[0],e[4],e[8]),Math.hypot(e[1],e[5],e[9]),Math.hypot(e[2],e[6],e[10])];};
 const minScale=(m)=>{const e=m.elements;return Math.min(Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10]));};
 function exempt(el,depth){
  if(el.kind==='hand')return depth<TOL.hand;
  if(el.kind==='shoe')return depth<TOL.shoe;
  if(el.kind==='limb')return el.tip||el.tipDist<.09||depth<TOL.limb;
  return depth<TOL.body;
 }
 const allowed=(allow,actorName,meshName,part='')=>allow.some(([a,m,p])=>new RegExp(a,'i').test(actorName)&&new RegExp(m,'i').test(meshName)&&(!p||new RegExp(p,'i').test(part)));
 function check({scene,actors,allow=[]}){
  scene.updateMatrixWorld(true);
  const roots=new Set(actors.map(x=>x.root).filter(Boolean)),ofActor=(m)=>{for(let p=m;p;p=p.parent)if(roots.has(p))return true;return false;};
  const solids=[];scene.traverse(m=>{if(isSolid(m)&&!ofActor(m)){const box=worldBox(m),s=box.getSize(new V3());if(Math.max(s.x,s.y,s.z)<60)solids.push({m,box,tris:null});}});
  const best=new Map(),add=(actor,part,mesh,depth,at)=>{const k=actor+'|'+part+'|'+mesh,o=best.get(k);if(!o||depth>o.depth)best.set(k,{actor,part,mesh,depth:+depth.toFixed(3),at:at.map(v=>+v.toFixed(2))});};
  const live=actors.map(a=>({a,c:a.collision()})).filter(x=>x.c&&x.c.visible!==false);
  const inv=new M4(),tmp=new V3();
  for(const {c} of live){
   for(const el of c.ellipsoids){
    const center=new V3().setFromMatrixPosition(el.matrix),ext=extents(el.matrix),box=new THREE.Box3(new V3(center.x-ext[0],center.y-ext[1],center.z-ext[2]),new V3(center.x+ext[0],center.y+ext[1],center.z+ext[2]));
    inv.copy(el.matrix).invert();const ie=inv.elements,ms=minScale(el.matrix),part=el.name||el.kind;
    for(const s of solids){
     if(!s.box.intersectsBox(box))continue;
     const mn=s.m.name||'solid';if(allowed(allow,c.name,mn,part))continue;
     if(!s.tris)s.tris=worldTris(s.m);const t=s.tris;
     let worst=0,minD=Infinity;
     for(let o=0;o<t.length;o+=9){
      const f=(i)=>{const x=t[o+i],y=t[o+i+1],z=t[o+i+2];return [ie[0]*x+ie[4]*y+ie[8]*z+ie[12],ie[1]*x+ie[5]*y+ie[9]*z+ie[13],ie[2]*x+ie[6]*y+ie[10]*z+ie[14]];};
      const a=f(0),b=f(3),d=f(6),dist=distOriginTri(a[0],a[1],a[2],b[0],b[1],b[2],d[0],d[1],d[2]);
      if(dist<minD)minD=dist;
      if(dist<1){const depth=(1-dist)*ms;if(depth>worst)worst=depth;}
     }
     if(s.box.containsPoint(center)&&inside(t,center))worst=Math.max(worst,ms*(1+minD)); // centre inside: radius plus distance to the surface
     if(worst>0&&!exempt(el,worst))add(c.name,part,mn,worst,center.toArray());
    }
   }
  }
  // actor against actor: surface samples of one body ellipsoid inside the other
  const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1])dirs.push([sx*.577,sy*.577,sz*.577]);
  for(let i=0;i<live.length;i++)for(let j=0;j<live.length;j++){
   if(i===j)continue;const A=live[i].c,B=live[j].c;
   if(allowed(allow,A.name,'actor:'+B.name))continue;
   for(const ea of A.ellipsoids.filter(e=>e.kind==='body'))for(const eb of B.ellipsoids.filter(e=>e.kind==='body')){
    const ib=new M4().copy(eb.matrix).invert(),msb=minScale(eb.matrix);let worst=0;
    for(const d of dirs){tmp.set(d[0],d[1],d[2]).applyMatrix4(ea.matrix).applyMatrix4(ib);const r=tmp.length();if(r<1)worst=Math.max(worst,(1-r)*msb);}
    if(worst>TOL.pair)add(A.name,ea.name||ea.kind,'actor:'+B.name,worst,new V3().setFromMatrixPosition(ea.matrix).toArray());
   }
  }
  return [...best.values()].sort((x,y)=>y.depth-x.depth);
 }
 // prop against prop: sampled vertices of one solid inside the other (both directions); nested parts and parts of
 // the same prop root are skipped, so only contacts between two separate props are reported
 const propSolids=(scene,actors)=>{const roots=new Set(actors.map(x=>x.root).filter(Boolean)),ofActor=(m)=>{for(let p=m;p;p=p.parent)if(roots.has(p))return true;return false;};const out=[];scene.traverse(m=>{if(isSolid(m)&&!ofActor(m)){const box=worldBox(m),s=box.getSize(new V3());if(Math.max(s.x,s.y,s.z)<60)out.push({m,box,tris:null});}});return out;};
 const isAnc=(a,b)=>{for(let p=b;p;p=p.parent)if(p===a)return true;return false;};
 // A prop builder returns one group; its meshes are joints of that same object (pod body + nose, pick head + grip).
 // Contacts inside one top-level prop root are intended assembly contacts, not two props interpenetrating.
 const topRoot=(m)=>{let r=m;while(r.parent&&r.parent.type!=='Scene')r=r.parent;return r;};
 const samplePts=(m,max)=>{const pos=m.geometry.attributes.position,n=pos.count,step=Math.max(1,Math.ceil(n/max)),e=m.matrixWorld.elements,out=[];
  for(let i=0;i<n;i+=step){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);out.push([e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]]);}return out;};
 function penetration(pts,tris,box){let worst=0;for(const p of pts){if(!box.containsPoint(new V3(p[0],p[1],p[2])))continue;if(!inside(tris,{x:p[0],y:p[1],z:p[2]}))continue;
  let minD=Infinity;for(let o=0;o<tris.length;o+=9){const d=distOriginTri(tris[o]-p[0],tris[o+1]-p[1],tris[o+2]-p[2],tris[o+3]-p[0],tris[o+4]-p[1],tris[o+5]-p[2],tris[o+6]-p[0],tris[o+7]-p[1],tris[o+8]-p[2]);if(d<minD)minD=d;}
  if(minD>worst)worst=minD;}return worst;}
 // pair depths are cached by the two world matrices: static props are tested once, only moving pairs are re-tested
 const pairCache=new Map();
 const sig=(m)=>Array.from(m.matrixWorld.elements).join(',');
 // parts that move at any time in the film (a lever, a hammer, a spinning earth). Static props are one assembly and are
 // not compared with each other; a moving part must not pass through any other solid. Run trackMovers over every frame first.
 const movers=new Set(),lastM=new Map();
 function trackMovers(scene){scene.updateMatrixWorld(true);scene.traverse(m=>{if(!m.isMesh)return;const e=m.matrixWorld.elements,p=lastM.get(m);
  if(!p){lastM.set(m,Float64Array.from(e));return;}for(let i=0;i<16;i++)if(Math.abs(p[i]-e[i])>1e-6){movers.add(m);p.set(e);return;}});return movers;}
 function checkPairs({scene,actors=[],allow=[],onlyMovers=false}){
  scene.updateMatrixWorld(true);const list=propSolids(scene,actors),out=[];
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const A=list[i],B=list[j];if(isAnc(A.m,B.m)||isAnc(B.m,A.m))continue;
   if(topRoot(A.m)===topRoot(B.m))continue; // one built prop: its own parts are allowed to touch
   if(!A.box.intersectsBox(B.box))continue;
   if(onlyMovers&&!movers.has(A.m)&&!movers.has(B.m))continue;
   const an=A.m.name||'solid',bn=B.m.name||'solid';if(allowed(allow,'props',bn,an)||allowed(allow,'props',an,bn))continue;
   const key=A.m.uuid+'|'+B.m.uuid,sa=sig(A.m),sb=sig(B.m),c=pairCache.get(key);let depth;
   if(c&&c.sa===sa&&c.sb===sb)depth=c.depth;else{
    if(!A.tris)A.tris=worldTris(A.m);if(!B.tris)B.tris=worldTris(B.m);
    depth=Math.max(penetration(samplePts(A.m,120),B.tris,B.box),penetration(samplePts(B.m,120),A.tris,A.box));
    pairCache.set(key,{sa,sb,depth});
   }
   if(depth>TOL.prop)out.push({actor:'props',part:an,mesh:bn,depth:+depth.toFixed(3),at:B.box.getCenter(new V3()).toArray().map(v=>+v.toFixed(2))});
  }
  return out;
 }
 // shot: the subject must sit near the centre of the frame and nothing solid may stand between camera and subject
 function checkShot({scene,actors=[],allow=[],camera,subject}){
  if(!Array.isArray(subject)||subject.length!==3)return [{actor:'shot',part:'subject',mesh:'none declared',depth:1,at:[]}];
  scene.updateMatrixWorld(true);
  const cam=new THREE.PerspectiveCamera(camera.fov||40,1080/1920,.05,160);
  cam.position.fromArray(camera.position);cam.up.set(0,1,0);cam.lookAt(new V3(...camera.target));cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
  const p=new V3(...subject),toCam=cam.position.clone().sub(p),pd=toCam.length();
  // Test the near visible surface along the same view ray. A subject point at a head/torso/pod centre would otherwise
  // report the subject's own body as an occluder; a real prop in front of that surface is still caught.
  const view=pd>1e-6?p.clone().addScaledVector(toCam.normalize(),Math.min(TOL.subjectLift,pd*.35)):p.clone();
  const ndc=view.clone().project(cam),sx=(ndc.x+1)/2,sy=(1-ndc.y)/2,at=subject.map(v=>+v.toFixed(2)),hits=[];
  if(ndc.z>1||ndc.z<-1||sx<.2||sx>.8||sy<.2||sy>.62)hits.push({actor:'shot',part:'subject',mesh:'off-centre',depth:+(ndc.z>1?1:Math.max(.01,Math.abs(sx-.5)-.3,.2-sy,sy-.62)).toFixed(3),at});
  // The camera itself must not sit inside a solid or an actor body: the frame would be black or one flat colour.
  // Decor volumes (hill slabs, ground blocks) count here too, flat planes do not.
  {const cp=cam.position,camAt=[+cp.x.toFixed(2),+cp.y.toFixed(2),+cp.z.toFixed(2)];
   scene.traverse(m=>{
    if(!m.isMesh||m.isInstancedMesh||m.userData.outline||m.userData.noCollide)return;
    const g=m.geometry;if(!g||!g.attributes||!g.attributes.position)return;
    const t=g.type;if(t==='PlaneGeometry'||t==='CircleGeometry'||t==='RingGeometry')return;
    if(!m.material||m.material.isShaderMaterial||(m.material.transparent&&m.material.opacity<.5)||!isVisible(m))return;
    if(m.material.side===THREE.BackSide)return; // sky domes are meant to be seen from inside
    const n=m.name||'solid';if(allowed(allow,'shot',n))return;
    const bx=worldBox(m);if(Math.max(bx.max.x-bx.min.x,bx.max.y-bx.min.y,bx.max.z-bx.min.z)>=60||!bx.containsPoint(cp))return;
    if(inside(worldTris(m),cp))hits.push({actor:'shot',part:'camera',mesh:'camera inside '+n,depth:.1,at:camAt});
   });
   for(const a of actors){const c=a.collision&&a.collision();if(!c||c.visible===false)continue;if(allowed(allow,'shot',c.name||a.name||'actor'))continue;
    for(const el of c.ellipsoids){const inv=el.matrix.clone().invert(),q=cp.clone().applyMatrix4(inv);if(q.length()<1){hits.push({actor:'shot',part:'camera',mesh:'camera inside '+(c.name||a.name||'actor'),depth:.1,at:camAt});break;}}}}
  const dir=view.clone().sub(cam.position),dist=dir.length();dir.normalize();
  const cands=[];scene.traverse(m=>{if(isSolid(m))cands.push(m);});
  const rc=new THREE.Raycaster(cam.position.clone(),dir,.05,dist-.05);
  for(const h of rc.intersectObjects(cands,false)){const n=h.object.name||'solid';if(allowed(allow,'shot',n))continue;hits.push({actor:'shot',part:'subject',mesh:'hidden by '+n,depth:.05,at});break;}
  return hits;
 }
 // grips: [{id,err,tol,at}] measured by the scene (distance from the hand's end to the grip point of the prop it is meant to hold).
 // A hand that is not on its prop is a hit; the message is fixed so one problem is one row in the report (the distance is the depth).
 function checkGrips(grips=[]){
  return grips.filter(g=>g.err>g.tol).map(g=>({actor:'grip',part:g.id,mesh:'hand is off the prop it should hold (limit '+Math.round(g.tol*100)+' cm)',depth:+g.err.toFixed(3),at:g.at||[]}));
 }
 // intent: what this moment of the film is meant to show. {id, primary, show:[{name,min}]}; track: {name:{obj}|{p,r}} (the scene's tracked things).
 // For every shown thing: visible at all, inside the frame (the primary one inside the title-safe middle: caption sits at ~0.69), big enough
 // (projected height of its bounding sphere as a share of the frame height) and nothing solid between camera and it. Returns {rows,hits}.
 const FRAME={x:[.04,.96],y:[.04,.9],px:[.12,.88],py:[.1,.64],minPrimary:.06,minOther:.03};
 function measureIntent({scene,camera,track={},intent,allow=[]}){
  const rows=[],hits=[];if(!intent||!camera)return {rows,hits};
  scene.updateMatrixWorld(true);
  const cam=new THREE.PerspectiveCamera(camera.fov||40,1080/1920,.05,camera.far||900);
  cam.position.fromArray(camera.position);cam.up.set(0,1,0);cam.lookAt(new V3(...camera.target));cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
  const fh=Math.tan((camera.fov||40)*Math.PI/360)*2,cands=[];scene.traverse(m=>{if(isSolid(m))cands.push(m);});
  const fail=(name,why)=>hits.push({actor:'intent',part:intent.id,mesh:name+' '+why,depth:.05,at:[]});
  for(const it of intent.show){
   const name=it.name,tr=track[name],primary=name===intent.primary;
   if(!tr){fail(name,'is not tracked by the scene');continue;}
   if(tr.big&&tr.obj){ // a thing bigger than the frame (a tower): it counts when its projected box covers enough of the picture
    if(!isVisible(tr.obj)){rows.push({name,ok:false,why:'hidden'});fail(name,'is not visible');continue;}
    // coverage: one ray through the middle of each cell of a 10x10 picture grid; the share of cells whose ray hits the thing's bounding box
    // (a facade right in front of the lens fills the picture, a tower far away fills a strip)
    const bx=new THREE.Box3().setFromObject(tr.obj),rc2=new THREE.Raycaster(),cells=new Set();
    for(let i=0;i<10;i++)for(let j=0;j<10;j++){rc2.setFromCamera(new THREE.Vector2(((i+.5)/10)*2-1,1-((j+.5)/10)*2),cam);if(rc2.ray.intersectsBox(bx))cells.add(i*10+j);}
    const cover=cells.size/100;
    const row={name,primary,sx:.5,sy:.5,frac:+cover.toFixed(3),ok:cover>=(it.min??.3)};
    if(!row.ok){row.why='covers only '+Math.round(cover*100)+'% of the picture';fail(name,row.why);}
    rows.push(row);continue;
   }
   let p,r;
   if(tr.obj){if(!isVisible(tr.obj)){rows.push({name,ok:false,why:'hidden'});fail(name,'is not visible');continue;}
    const b=new THREE.Box3().setFromObject(tr.obj),c=b.getCenter(new V3()),sz=b.getSize(new V3());p=c;r=Math.max(sz.x,sz.y,sz.z)/2;}
   else{p=new V3(...tr.p);r=tr.r||.3;}
   const toP=p.clone().sub(cam.position),d=toP.length(),depth=toP.dot(cam.getWorldDirection(new V3()));
   const ndc=p.clone().project(cam),sx=(ndc.x+1)/2,sy=(1-ndc.y)/2,frac=depth>.05?2*r/(fh*depth):0;
   const [x0,x1]=primary?FRAME.px:FRAME.x,[y0,y1]=primary?FRAME.py:FRAME.y,min=it.min??(primary?FRAME.minPrimary:FRAME.minOther);
   const row={name,primary,sx:+sx.toFixed(3),sy:+sy.toFixed(3),frac:+frac.toFixed(3),ok:true};
   if(depth<=.05||sx<x0||sx>x1||sy<y0||sy>y1){row.ok=false;row.why=primary?'off the title-safe middle':'out of frame';fail(name,row.why);}
   else if(frac<min){row.ok=false;row.why='too small ('+Math.round(frac*100)+'% of the frame height, needs '+Math.round(min*100)+'%)';fail(name,row.why);}
   else{ // occlusion: look at the near surface of the thing, so its own body is not the blocker
    const lift=Math.min(r,d*.35),view=p.clone().addScaledVector(toP.clone().normalize(),-lift),dir=view.clone().sub(cam.position),dist=dir.length();dir.normalize();
    const rc=new THREE.Raycaster(cam.position.clone(),dir,.05,Math.max(.06,dist-.05));
    for(const h of rc.intersectObjects(cands,false)){
     let own=false;if(tr.obj)for(let o=h.object;o;o=o.parent)if(o===tr.obj){own=true;break;}
     const n=h.object.name||'solid';if(own||allowed(allow,'intent',n))continue;row.ok=false;row.why='hidden by '+n;fail(name,row.why);break;}
   }
   rows.push(row);
  }
  return {rows,hits};
 }
 return {check,checkPairs,checkShot,checkGrips,measureIntent,trackMovers,TOL};
}
