// Scene dressing meter (owner goal 2026-11-08: every film must reach the reference's scene quality). Pure geometry, no image: for ONE camera it
// projects every visible prop of the scene into the frame and reports how dressed the shot is - how many distinct props show, in how many depth
// layers (foreground / middle / far / horizon), whether a backdrop (terrain or a far landmark) is in view, how many distinct detail parts show, and
// whether the camera stands inside a room. Runs in the render page (collide-only pass) and in Node tests. Judged by studio2/lib/scene-quality.mjs.
// A prop = the group directly under a zone group (scene > zone > prop > part). Actors, the sky dome, outline hulls and ground slabs never count.
const SKIP_PROP=/^(sky|sun)|sky dome|terrain|ground|zone|grass|meadow|water surface|shadow/i;
const BACKDROP=/terrain|hill|mountain|ridge/i;
export const BANDS=[6,25,80]; // metres: near < 6 <= middle < 25 <= far < 80 <= horizon
export function measureDressing(THREE,{scene,camera,actors=[],minArea=.004,minPart=.0004}){
 const V3=THREE.Vector3;scene.updateMatrixWorld(true);
 const cam=new THREE.PerspectiveCamera(camera.fov||40,1080/1920,.05,400);
 cam.position.fromArray(camera.position);cam.up.set(0,1,0);cam.lookAt(new V3(...camera.target));cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
 const actorRoots=new Set(actors.map(a=>a.root).filter(Boolean));
 const visible=(o)=>{for(let p=o;p;p=p.parent)if(p.visible===false)return false;return true;};
 const insideActor=(o)=>{for(let p=o;p;p=p.parent)if(actorRoots.has(p)||/^Actor /.test(p.name||''))return true;return false;}; // every rig names its root 'Actor <name>'
 const rootOf=(m)=>{const chain=[];for(let p=m;p&&p!==scene;p=p.parent)chain.push(p);return chain.length>=2?chain[chain.length-2]:chain[chain.length-1]||m;};
 const rectOf=(box)=>{ // screen rectangle of a world box in 0..1, null when it cannot be seen (edges that cross the near plane are clipped to it)
  const cs=[],NEAR=-.05;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,any=false;
  for(let i=0;i<8;i++)cs.push(new V3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z));
  if(box.containsPoint(cam.position))return [0,0,1,1];
  const view=cs.map(v=>v.clone().applyMatrix4(cam.matrixWorldInverse)),pts=[];
  view.forEach((c,i)=>{if(c.z<=NEAR)pts.push(cs[i]);});
  for(let i=0;i<8;i++)for(const bit of [1,2,4]){const j=i^bit;if(j<i)continue;const a1=view[i],b1=view[j];if((a1.z<=NEAR)!==(b1.z<=NEAR)){const k=(NEAR-a1.z)/(b1.z-a1.z);pts.push(cs[i].clone().lerp(cs[j],k));}}
  for(const v of pts){const n=v.clone().project(cam),sx=(n.x+1)/2,sy=(1-n.y)/2;any=true;x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);}
  if(!any)return null;x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(1,x1);y1=Math.min(1,y1);if(x1<=x0||y1<=y0)return null;return [x0,y0,x1,y1];
 };
 const area=(r)=>(r[2]-r[0])*(r[3]-r[1]);
 const roots=new Map(),partNames=new Map(),partBands=[0,0,0],allSolid=[],items=[];let groundCover=false; // allSolid: every visible mesh near the camera, in frame or not (for the room test)
 scene.traverse(m=>{
  if(!m.isMesh||m.userData.outline||!visible(m)||insideActor(m))return;
  const mat=Array.isArray(m.material)?m.material[0]:m.material;if(mat&&mat.side===THREE.BackSide)return;
  if(m.isInstancedMesh){groundCover=true;return;}
  const g=m.geometry;if(!g||!g.attributes||!g.attributes.position)return;if(!g.boundingBox)g.computeBoundingBox();
  const b=g.boundingBox,box=new THREE.Box3(),v=new V3();
  for(let i=0;i<8;i++){v.set(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z).applyMatrix4(m.matrixWorld);box.expandByPoint(v);}
  {const rn=rootOf(m).name||m.name||'';if(!SKIP_PROP.test(rn)){const b=box,cp=cam.position,d=Math.hypot(Math.max(b.min.x-cp.x,0,cp.x-b.max.x),Math.max(b.min.y-cp.y,0,cp.y-b.max.y),Math.max(b.min.z-cp.z,0,cp.z-b.max.z));if(d<30)allSolid.push(m);}}
  const r=rectOf(box);if(!r)return;
  items.push({m,r,box});
 });

 // group the in-frame meshes into props: a prop is the group under the zone; a set piece over 20 m (a whole street block) is split one level further down
 {const big=new Map(),levelBelow=(m,root)=>{let p=m;while(p.parent&&p.parent!==root)p=p.parent;return p;};
  for(const it of items){const root=rootOf(it.m),b=big.get(root)||new THREE.Box3();b.union(it.box);big.set(root,b);}
  const unwrap=(r)=>{for(;;){const solid=r.children.filter(c=>c.isMesh&&!c.userData.noCollide).length,grp=r.children.filter(c=>!c.isMesh&&c.children.length>=3);if(solid===0&&grp.length===1)r=grp[0];else if(solid===0&&r.children.length===1&&!r.children[0].isMesh)r=r.children[0];else return r;}}; // look through wrappers (scene > root empty) and past effect meshes (light rods) that sit next to the real parts // a Blender GLB arrives as scene > root empty > parts: look through the single-child wrappers
  for(const it of items){const root0=rootOf(it.m),sz=big.get(root0).getSize(new V3()),inner=unwrap(root0),split=Math.max(sz.x,sz.y,sz.z)>20&&inner.children.length>=3,root=split?levelBelow(it.m,inner):root0,name=root.name||it.m.name||'prop',e=roots.get(root)||{name,rect:[1,1,0,0],box:new THREE.Box3(),meshes:[]};
   e.rect=[Math.min(e.rect[0],it.r[0]),Math.min(e.rect[1],it.r[1]),Math.max(e.rect[2],it.r[2]),Math.max(e.rect[3],it.r[3])];e.box.union(it.box);e.meshes.push(it.m);roots.set(root,e);
   if(area(it.r)>=minPart&&!SKIP_PROP.test(name)){const k=name+'/'+(it.m.name||'');partNames.set(k,(partNames.get(k)||0)+1);const dd=it.box.getCenter(new V3()).distanceTo(cam.position);partBands[dd<1.5?0:dd<4?1:2]++;}}}
 const props=[],bands=[0,0,0,0];let backdrop=false;
 for(const [root,e] of roots){
  const a=area(e.rect),c=e.box.getCenter(new V3()),sz=e.box.getSize(new V3()),huge=Math.max(sz.x,sz.z)>60,dist=huge?200:Math.max(.3,c.distanceTo(cam.position)-sz.length()*.25); // a merged landscape mesh (horizon rings, city vista) spans 100s of metres around the camera, so its centre is NOT its distance: anything over 60 m wide is the far band
  if((BACKDROP.test(e.name)||huge)&&a>=(huge?.02:minArea))backdrop=true;
  if(SKIP_PROP.test(e.name)||a<minArea)continue;
  const band=dist<BANDS[0]?0:dist<BANDS[1]?1:dist<BANDS[2]?2:3;props.push({name:e.name,area:+a.toFixed(4),dist:+dist.toFixed(1),band});bands[band]++;
 }
 if(props.some(p=>p.band>=2&&p.area>=.02))backdrop=true; // a far landmark or skyline that fills at least 2 % of the frame
 props.sort((p,q)=>q.area-p.area);
 // interior: ceiling within 8 m above the camera and walls within 25 m on at least three of four sides, tested against every solid prop near the camera
 // (a room may be built from loose parts or from one model, so the test is not per prop)
 let interior=false;
 {const near=allSolid;
  if(near.length){
   const orig=new Map(); // materials are shared between meshes: remember each one's side once, restore every one afterwards
   for(const m of near)for(const x of (Array.isArray(m.material)?m.material:[m.material]))if(!orig.has(x)){orig.set(x,x.side);x.side=THREE.DoubleSide;}
   const rc=new THREE.Raycaster(),dirs=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]],side=dirs.map(d=>{rc.set(cam.position,new V3(...d));rc.far=25;return rc.intersectObjects(near,false).length>0;}),up=[[0,0],[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]].map(([dx,dz])=>{rc.set(new V3(cam.position.x+dx,cam.position.y,cam.position.z+dz),new V3(0,1,0));rc.far=5;return rc.intersectObjects(near,false).length>0;}),hit=[up.filter(Boolean).length>=4,...side];
   for(const [x,side] of orig)x.side=side;
   interior=hit[0]&&hit.slice(1).filter(Boolean).length>=3;
  }}
 const kinds=new Set(props.map(p=>p.name)).size;
 return {count:props.length,kinds,layers:interior?partBands.filter(n=>n>=2).length:bands.filter(n=>n>0).length,bands:interior?partBands:bands,props:props.slice(0,40),backdrop,interior,parts:partNames.size,groundCover};
}
