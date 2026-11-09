// Realism layer (owner 2026-11-09: "the reference's models are very detailed and realistic in everything"). Measured on the first picture of double-weight-hourly: fine detail energy (Laplacian variance of the
// frame, 270x480) was 808 against the reference's 1399, and the share of strong edges .2 against .4: our props were flat colours. This gives every prop real surface: procedural wood grain, concrete,
// asphalt, brushed metal, fabric weave, tile grout, plaster and rubber, as a colour-tinted map plus a bump map, tiled at real-world size (metres per tile). Actors keep the flat reference look.
// texturize(root,{THREE}) walks a scene once after it is built; rules match the material name, then the mesh name. pickRule/tileRepeat are pure and tested.
export const RULES=[
 {id:'turf',re:/turf|^hill|meadow|lawn/i,tile:1.6,bump:.8,contrast:.7},
 {id:'cobble',re:/cobble/i,tile:.9,bump:2.0,contrast:.6},
 {id:'water',re:/water|sea water|river/i,tile:3,bump:3,contrast:.4},
 {id:'bark',re:/bark|trunk/i,tile:.7,bump:2.0,contrast:.6},
 {id:'paper',re:/box pink|box white|lid |ribbon|label|cardboard|paper|poster|advert|banner/i,tile:.4,bump:.12,contrast:.2},
 {id:'wood',re:/wood|plank|floor honey|floor dark|stair|deck|table top|stall|wicker|ply|nightstand|wardrobe|shelf|chair|bed frame|basket/i,tile:.35,bump:1.8,contrast:.55},
 {id:'asphalt',re:/asphalt|road|trench|lane/i,tile:0.75,bump:2,contrast:.7},
 {id:'concrete',re:/concrete|quay|cobble|abutment|footway|sidewalk|kerb|stone|fountain|slab|pavement|crack/i,tile:0.6,bump:2.2,contrast:.55},
 {id:'tile',re:/tile|checker/i,tile:0.3,bump:1.2,contrast:.4},
 {id:'metal',re:/steel|metal|rail|crane|bridge|container|hull|boom|girder|scooter|bike|bollard|lamp post|pole|lift|gangway|cargo/i,tile:0.4,bump:1,contrast:.5},
 {id:'fabric',re:/cloth|curtain|rug|blanket|pillow|awning|flag|mattress|towel|stripe|bunting/i,tile:0.125,bump:1.4,contrast:.35},
 {id:'rubber',re:/tyre|tire|fender|rubber|grip|sole/i,tile:0.2,bump:1.6,contrast:.5},
 {id:'plaster',re:/wall|facade|plaster|cream|peach|terracotta|ceiling|building|window frame|cornice|tower|apartment/i,tile:0.8,bump:0.8,contrast:.28},
];
// matte surfaces: a rough value per surface kills the glitter that normal-map noise gives under a specular highlight
export const ROUGH={turf:1,paper:.85,plaster:.95,concrete:.92,fabric:.93,wood:.74,asphalt:.95,cobble:.9,bark:1,rubber:.95,tile:.6,metal:.45};
export const pickRule=(materialName='',meshName='')=>RULES.find(r=>r.re.test(materialName))||RULES.find(r=>r.re.test(meshName))||null;
export const tileRepeat=(sizeMetres,tile)=>Math.max(1,Math.min(24,Math.round(sizeMetres/tile)));
let seed=12345;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function makePattern(id,n=512){const K=n/256;
 const GAIN={plaster:3,tile:1.8,wood:1.8,water:1.8,concrete:1.8,metal:1.7,asphalt:1.8,cobble:1.4,fabric:1.4}[id]||1;const mk=()=>{const c=document.createElement('canvas');c.width=c.height=n;return c;},c=mk(),q=c.getContext('2d');q.fillStyle='#ffffff';q.fillRect(0,0,n,n);
 const dots=(count,alpha,min,max,dark=true)=>{count*=K*K;min*=K;max*=K;alpha=Math.min(.95,alpha*2.1*GAIN);for(let i=0;i<count;i++){const v=dark?Math.floor(rnd()*110):255-Math.floor(rnd()*60);q.fillStyle=`rgba(${v},${v},${v},${alpha*(.4+rnd()*.6)})`;const s=min+rnd()*(max-min);q.fillRect(rnd()*n,rnd()*n,s,s);}};
 if(id==='wood'){for(let y=0;y<n;y+=2){const v=Math.floor(150+rnd()*90);q.fillStyle=`rgba(${v-70},${v-80},${v-100},${.1+rnd()*.28})`;q.fillRect(0,y,n,1+rnd()*2);}
  for(let k=0;k<6;k++){q.strokeStyle=`rgba(90,60,30,${.18+rnd()*.22})`;q.lineWidth=1+rnd()*1.5;q.beginPath();let y=rnd()*n;q.moveTo(0,y);for(let x=0;x<=n;x+=16){y+=(rnd()-.5)*5;q.lineTo(x,y);}q.stroke();}
  for(let k=0;k<2;k++){const x=rnd()*n,y=rnd()*n;for(let r=3;r<11;r+=2){q.strokeStyle=`rgba(80,50,25,${.35-r*.02})`;q.beginPath();q.ellipse(x,y,r*2.2,r,0,0,7);q.stroke();}}
  q.strokeStyle='rgba(60,40,20,.5)';q.lineWidth=2;q.beginPath();q.moveTo(0,0);q.lineTo(n,0);q.stroke();}
 else if(id==='concrete'||id==='asphalt'){dots(id==='asphalt'?9000:6000,.5,1,2.4);dots(id==='asphalt'?2600:900,.45,1,2.6,false);
  for(let k=0;k<9;k++){const g=q.createRadialGradient(rnd()*n,rnd()*n,2,rnd()*n,rnd()*n,50+rnd()*70);g.addColorStop(0,`rgba(90,90,90,${.12+rnd()*.12})`);g.addColorStop(1,'rgba(90,90,90,0)');q.fillStyle=g;q.fillRect(0,0,n,n);}
  for(let k=0;k<3;k++){q.strokeStyle='rgba(40,40,40,.45)';q.lineWidth=1;q.beginPath();let x=rnd()*n,y=rnd()*n;q.moveTo(x,y);for(let s=0;s<9;s++){x+=(rnd()-.5)*40;y+=rnd()*26;q.lineTo(x,y);}q.stroke();}}
 else if(id==='tile'){q.strokeStyle='rgba(70,70,70,.8)';q.lineWidth=5;q.strokeRect(0,0,n,n);dots(2200,.22,1,2);for(let k=0;k<4;k++){q.strokeStyle='rgba(60,60,60,.25)';q.lineWidth=1;q.beginPath();q.moveTo(rnd()*n,rnd()*n);q.lineTo(rnd()*n,rnd()*n);q.stroke();}}
 else if(id==='metal'){for(let y=0;y<n;y++){const v=170+Math.floor(rnd()*80);q.fillStyle=`rgba(${v},${v},${v},${.25+rnd()*.3})`;q.fillRect(0,y,n,1);}
  for(let k=0;k<26;k++){q.strokeStyle=`rgba(${rnd()<.5?40:255},${rnd()<.5?40:255},${rnd()<.5?40:255},.28)`;q.lineWidth=1;q.beginPath();const x=rnd()*n,y=rnd()*n;q.moveTo(x,y);q.lineTo(x+(rnd()-.5)*90,y+(rnd()-.5)*8);q.stroke();}dots(260,.4,1,3);
  for(let k=0;k<5;k++){const g=q.createRadialGradient(rnd()*n,rnd()*n,1,rnd()*n,rnd()*n,30);g.addColorStop(0,'rgba(120,70,30,.18)');g.addColorStop(1,'rgba(120,70,30,0)');q.fillStyle=g;q.fillRect(0,0,n,n);}}
 else if(id==='fabric'){q.lineWidth=1;for(let i=0;i<n;i+=3){q.strokeStyle=`rgba(120,120,120,${.28+rnd()*.15})`;q.beginPath();q.moveTo(i,0);q.lineTo(i,n);q.stroke();q.strokeStyle=`rgba(170,170,170,${.25+rnd()*.15})`;q.beginPath();q.moveTo(0,i);q.lineTo(n,i);q.stroke();}dots(900,.3,1,2);}
 else if(id==='cobble'){q.fillStyle='#ffffff';const st=n/5;for(let y=0;y<5;y++)for(let x=0;x<5;x++){const ox=(y%2)*st*.5,cx=x*st+ox+st*.5+(rnd()-.5)*6,cy=y*st+st*.5+(rnd()-.5)*6,v=170+Math.floor(rnd()*80);q.fillStyle=`rgb(${v},${v},${v})`;q.beginPath();q.ellipse(cx,cy,st*.46,st*.4,rnd()*.5,0,7);q.fill();}
  q.fillStyle='rgba(30,30,30,.55)';for(let i=0;i<5;i++){q.fillRect(0,i*st-2,n,4);q.fillRect(i*st-2,0,4,n);}dots(1800,.25,1,2);}
 else if(id==='water'){for(let k=0;k<190;k++){q.strokeStyle=`rgba(${rnd()<.5?255:60},${rnd()<.5?255:90},255,${.2+rnd()*.3})`;q.lineWidth=1+rnd()*2;q.beginPath();const x=rnd()*n,y=rnd()*n;q.moveTo(x,y);q.bezierCurveTo(x+30,y-10,x+60,y+10,x+(60+rnd()*60),y);q.stroke();}}
 else if(id==='bark'){for(let x=0;x<n;x+=3){const v=Math.floor(110+rnd()*110);q.fillStyle=`rgba(${v-60},${v-70},${v-80},${.18+rnd()*.3})`;q.fillRect(x,0,1+rnd()*2,n);}dots(1500,.3,1,3);}
 else if(id==='turf'){q.fillStyle='#c4c4c4';q.fillRect(0,0,n,n);for(let i=0;i<16000*K*K/2;i++){const x=rnd()*n,y=rnd()*n,l=3+rnd()*8*K,g=Math.floor(60+rnd()*195);q.strokeStyle=`rgba(${g-40},${g},${g-70},${.25+rnd()*.5})`;q.lineWidth=1;q.beginPath();q.moveTo(x,y);q.lineTo(x+(rnd()-.5)*4,y-l);q.stroke();}
  for(let k=0;k<26;k++){const g=q.createRadialGradient(rnd()*n,rnd()*n,2,rnd()*n,rnd()*n,60+rnd()*60);g.addColorStop(0,`rgba(60,90,30,${.15+rnd()*.15})`);g.addColorStop(1,'rgba(60,90,30,0)');q.fillStyle=g;q.fillRect(0,0,n,n);}}
 else if(id==='paper'){dots(500,.05,1,2);for(let k=0;k<70;k++){q.strokeStyle=`rgba(150,150,150,${.05+rnd()*.07})`;q.lineWidth=1;q.beginPath();const x=rnd()*n,y=rnd()*n;q.moveTo(x,y);q.lineTo(x+(rnd()-.5)*40,y+(rnd()-.5)*40);q.stroke();}}
 else if(id==='rubber'){dots(7000,.35,1,2);dots(1500,.3,1,2,false);}
 else{dots(5200,.2,1,2);dots(2400,.16,1,2,false);for(let k=0;k<7;k++){const g=q.createRadialGradient(rnd()*n,rnd()*n,2,rnd()*n,rnd()*n,60+rnd()*70);g.addColorStop(0,`rgba(110,100,90,${.1+rnd()*.12})`);g.addColorStop(1,'rgba(110,100,90,0)');q.fillStyle=g;q.fillRect(0,0,n,n);}
  const g2=q.createLinearGradient(0,0,0,n);g2.addColorStop(0,'rgba(80,70,60,0)');g2.addColorStop(1,'rgba(80,70,60,.16)');q.fillStyle=g2;q.fillRect(0,0,n,n);}
 if(GAIN>1.3){const c2=mk(),q2=c2.getContext('2d');q2.filter=`contrast(${(1+(GAIN-1)*.7).toFixed(2)})`;q2.drawImage(c,0,0);return c2;} // stronger surfaces: contrast stretch for the kinds that need it
 return c;
}
// height (luminance) -> tangent-space normal map: real surface relief that catches the light like a game material
export function normalFrom(c,k=2.2){const n=c.width,src=c.getContext('2d').getImageData(0,0,n,n).data,o=document.createElement('canvas');o.width=o.height=n;const oq=o.getContext('2d'),img=oq.createImageData(n,n),h=(x,y)=>{x=(x+n)%n;y=(y+n)%n;const i=(y*n+x)*4;return (src[i]+src[i+1]+src[i+2])/765;};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=(h(x+1,y)-h(x-1,y))*k,dy=(h(x,y+1)-h(x,y-1))*k,l=Math.hypot(dx,dy,1),i=(y*n+x)*4;img.data[i]=(-dx/l*.5+.5)*255;img.data[i+1]=(dy/l*.5+.5)*255;img.data[i+2]=(1/l*.5+.5)*255;img.data[i+3]=255;}
 oq.putImageData(img,0,0);return o;}
// walks the scene once; each textured mesh gets its own material clone (shared image, own repeat), a tinted map and a bump map
// denim twill and fibre noise multiplied into a costume's painted canvas (the reference's overalls and shirts have visible cloth, stitching stays on top)
export function weaveOverlay(canvas){const q=canvas.getContext('2d'),w=canvas.width,h=canvas.height;q.save();q.globalCompositeOperation='multiply';q.lineWidth=1;
 for(let i=-h;i<w;i+=3){q.strokeStyle=`rgba(40,40,60,${.1+rnd()*.1})`;q.beginPath();q.moveTo(i,0);q.lineTo(i+h,h);q.stroke();}
 for(let i=0;i<w*h/22;i++){const v=Math.floor(120+rnd()*120);q.fillStyle=`rgba(${v},${v},${v},.22)`;q.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1);}
 q.restore();}

// Blender GLBs carry cube-unwrap UVs (every face of a box gets the same small square, whatever its size): a 6 m wall and its 4 cm edge share one island, so surface maps turn into speckle.
// For GLB meshes the maps are re-projected in metres (box projection by the dominant normal axis), once per geometry, so one UV unit = one metre and tile sizes are real.
export function metreUV(geometry){
 if(geometry.userData.metreUV||!geometry.attributes.position||!geometry.attributes.normal)return;
 const p=geometry.attributes.position,n=geometry.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let u,v;
  if(ay>=ax&&ay>=az){u=p.getX(i);v=p.getZ(i);}else if(ax>=az){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getY(i);}
  uv[i*2]=u;uv[i*2+1]=v;}
 geometry.setAttribute('uv',new p.constructor(uv,2));geometry.userData.metreUV=true;
}
export function texturize(root,{THREE,skip=(o)=>false}={}){
 const cache={};let n=0;
 const tex=(id)=>{if(!cache[id]){const c=makePattern(id),t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;const b=new THREE.CanvasTexture(normalFrom(c));b.wrapS=b.wrapT=THREE.RepeatWrapping;b.anisotropy=4;cache[id]={t,b};}return cache[id];};
 root.traverse((o)=>{
  if(o.isMesh&&/^Body/.test(o.name||'')&&o.material&&o.material.map&&o.material.map.image&&o.material.map.image.getContext&&!o.material.map.userData.woven){weaveOverlay(o.material.map.image);o.material.map.userData.woven=true;o.material.map.needsUpdate=true;}
  if(!o.isMesh||o.isInstancedMesh||o.userData.outline||o.userData.noTexture||/^Actor /.test(o.name||'')||skip(o))return;
  const m=o.material;if(!m||Array.isArray(m)||!m.isMeshStandardMaterial||m.map||m.transparent)return;
  const rule=pickRule(m.name,o.name);if(!rule)return;
  o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox,sz=[bb.max.x-bb.min.x,bb.max.y-bb.min.y,bb.max.z-bb.min.z].map((v,i)=>v*Math.abs([o.scale.x,o.scale.y,o.scale.z][i]));
  const sorted=[...sz].sort((x,y)=>y-x),big=sorted[0];if(big<.12)return;
  if(o.userData.glb)metreUV(o.geometry);
  const {t,b}=tex(rule.id),rep=o.userData.glb?Math.max(1/big,Math.min(1/rule.tile,24/big)):tileRepeat(Math.sqrt(sorted[0]*sorted[1]),rule.tile),mm=m.clone(); // the mean of the two largest sizes keeps thin slabs (stripes, rails) from squeezing the pattern into glitter
  const tc=t.clone();tc.repeat.set(rep,rep);tc.needsUpdate=true;const bc=b.clone();bc.repeat.set(rep,rep);bc.needsUpdate=true;
  if(rule.id==='water'){bc.userData.water=true;tc.userData.water=true;mm.metalness=.1;mm.roughness=.08;mm.envMapIntensity=1.6;}
  mm.map=tc;if(o.userData.glb&&rule.id!=='water'){mm.normalMap=null;}else{mm.normalMap=bc;mm.normalScale=new THREE.Vector2(rule.bump*1.5,rule.bump*1.5);} // Blender models carry their own relief (bevels, joints, grooves): a procedural bump on top of metre UVs only added speckleif(rule.id!=='water'){mm.roughnessMap=tc;mm.roughness=ROUGH[rule.id]!==undefined?ROUGH[rule.id]:Math.min(1,mm.roughness+.12);}mm.envMapIntensity=mm.metalness>.3?1.4:(o.userData.glb?.35:.9);o.material=mm;n++; // sky reflections stay light on Blender props: a glossy floor indoors turned the pink tiles blue
 });
 return n;
}
