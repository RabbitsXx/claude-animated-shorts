// The town-fair field: terrain, trees, inventor's open workshop, scaffold + crane, rival site, distant fair.
// Coordinates: machine ring at origin; +z toward the default camera; workshop to -x; rival site to +x.
import {rand} from '/runtime/tracks.js';
export function buildSet(ctx,kit){
 const {THREE,scene}=ctx,{M,mat,box,rbox,cyl,sph,torus,cone,tube,bolt,sign,finish}=kit;
 const out={};
 // ---------- terrain
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500,1,1),new THREE.MeshStandardMaterial({color:'#70a82c'}));ground.name='continuous world ground';ground.rotation.x=-Math.PI/2;scene.add(ground);ctx.style(ground,{importance:'background'});
 const hills=new THREE.Group();scene.add(hills);
 const hill=(x,z,rx,ry,rz,c)=>{const m=sph(hills,'far hill',[x,0,z],1,mat(c,{rough:1}),[rx,ry,rz],{noOutline:true});return m;};
 hill(-70,-110,90,22,50,'#6fae35');hill(60,-130,110,30,60,'#7bb83a');hill(0,-170,160,40,70,'#82bf59');hill(-120,-40,60,16,60,'#68a830');hill(130,-60,70,20,55,'#6cab33');hill(10,-85,70,12,35,'#74b238');
 finish(hills,'background');
 // dirt patches / path
 const dirt=new THREE.Group();scene.add(dirt);
 let pi=0;const patch=(x,z,rx,rz,c,rot=0)=>{pi++;const m=new THREE.Mesh(new THREE.CircleGeometry(1,40),new THREE.MeshStandardMaterial({color:c,roughness:1,polygonOffset:true,polygonOffsetFactor:-pi,polygonOffsetUnits:-pi}));m.name='dirt patch';m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,.008+pi*.0015,z);m.scale.set(rx,rz,1);m.userData.noOutline=true;dirt.add(m);return m;};
 patch(0,.4,6.5,4.6,'#b99560');patch(-3,-1,3.4,2.4,'#a9854f',.3);patch(3.5,2.2,3.8,1.6,'#c2a06b',-.2);patch(11,-2,6.5,4.2,'#b99560',.1);patch(6,6,3,1.1,'#c2a06b',.4);
 for(let i=0;i<14;i++)patch(8+i*1.6,6.5+Math.sin(i*.6)*.35,1.4,1.0,'#c2a06b',i*.3);
 finish(dirt,'background');
 // grass tufts (instanced, no outlines)
 const tuftGeo=new THREE.ConeGeometry(.03,.2,5);tuftGeo.translate(0,.1,0);
 const tuft=new THREE.InstancedMesh(tuftGeo,new THREE.MeshStandardMaterial({color:'#4f9a26',roughness:1}),1800);tuft.userData.noOutline=true;tuft.name='grass tufts';
 {const r=rand(11),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();let n=0;
  while(n<1800){const x=(r()-.5)*70,z=(r()-.2)*60-2;if(Math.abs(x)<5.2&&z>-4&&z<4.6)continue;const s=.7+r()*1.2;e.set((r()-.5)*.5,r()*6.28,(r()-.5)*.5);q.setFromEuler(e);m4.compose(new THREE.Vector3(x,0,z),q,new THREE.Vector3(s,s*(.8+r()*.9),s));tuft.setMatrixAt(n,m4);c.setHSL(.24+r()*.05,.62,.26+r()*.14);tuft.setColorAt(n,c);n++;}}
 tuft.castShadow=false;tuft.receiveShadow=true;scene.add(tuft);
 // ---------- trees
 function tree(parent,x,z,h=4,kind='round',seed=1){
  const r=rand(seed),g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
  cyl(g,'trunk',[0,h*.3,0],.12*h/4,.2*h/4,h*.6,mat('#7a5233',{rough:1}),null,{},10);
  const leaf=(p,rad,sc)=>{const geo=new THREE.IcosahedronGeometry(rad,2);const pos=geo.attributes.position,cols=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){const y=pos.getY(i)/rad,b=.25+.55*(y*.5+.5)+(r()-.5)*.15;cols[i*3]=b;cols[i*3+1]=b;cols[i*3+2]=b;}geo.setAttribute('color',new THREE.BufferAttribute(cols,3));const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,color:'#fff'}));m.name='foliage blob';m.position.set(...p);if(sc)m.scale.set(...sc);g.add(m);};
  if(kind==='round'){leaf([0,h*.78,0],h*.3,[1,.85,1]);leaf([h*.18,h*.62,h*.05],h*.22);leaf([-h*.17,h*.64,-h*.04],h*.22);leaf([h*.03,h*.95,h*.04],h*.2);leaf([-h*.02,h*.66,h*.17],h*.2);}
  else if(kind==='pine'){for(let i=0;i<5;i++){const rad=h*.28*(1-i*.17);cone(g,'foliage tier',[0,h*.42+i*h*.14,0],rad,h*.3,mat('#2f7d32',{rough:1}),null,{},10);}}
  else {leaf([0,h*.65,0],h*.2,[.7,2.2,.7]);}
  return g;
 }
 const trees=new THREE.Group();scene.add(trees);
 [[-9,-9,5,'round'],[-17,-9,6,'round'],[-14,-14,7,'pine'],[8,-12,6,'round'],[16,-10,7,'pine'],[24,-6,6,'round'],[-18,-8,5,'round'],[3,-16,8,'pine'],[-5,-16,6,'round'],[30,-14,7,'pine'],[-24,-18,8,'pine'],[12,-18,6,'round'],[-8,18,4,'round'],[-16,4,5,'round'],[20,5,5,'round'],[27,0,6,'pine'],[-3,-24,7,'round'],[18,-24,7,'pine']].forEach(([x,z,h,k],i)=>tree(trees,x,z,h,k,i+3));
 finish(trees,'background');
 // ---------- inventor's open workshop (x -9..-4, z -4..-8)
 const W=new THREE.Group();W.position.set(-7.5,0,-6);scene.add(W);
 const wood=mat(M.wood,{rough:.85}),woodD=mat(M.woodDark,{rough:.9}),roofM=mat('#8a5a3a',{rough:.8}),steel=mat(M.steel,{metal:.5,rough:.45,name:'steel'});
 rbox(W,'shed floor',[0,.05,0],[6.2,.1,4.4],.03,mat('#a98a62',{rough:1}));
 for(const [x,z] of [[-3,-2],[3,-2],[-3,2],[3,2]])rbox(W,'shed post',[x,1.5,z],[.22,3,.22],.04,woodD);
 rbox(W,'shed back wall',[0,1.5,-2.15],[6.2,3,.12],.02,wood);
 for(let i=0;i<12;i++)box(W,'wall plank gap',[-2.85+i*.52,1.5,-2.08],[.012,2.95,.004],woodD,null,{noOutline:true});
 // roof: sloped sheets with ribs
 const roof=new THREE.Group();roof.position.set(0,3.2,0);roof.rotation.x=.22;W.add(roof);
 rbox(roof,'roof sheet',[0,0,0],[6.9,.1,5.2],.03,roofM);
 for(let i=0;i<14;i++)box(roof,'roof rib',[-3.2+i*.5,.07,0],[.08,.05,5.2],mat('#9c6a45',{rough:.8}),null,{noOutline:true});
 // workbench with vise & tools
 rbox(W,'workbench top',[-.6,1.0,-1.5],[3.2,.1,.9],.03,wood);for(const x of [-2.0,.8])for(const z of [-1.85,-1.15])rbox(W,'bench leg',[x,.5,z],[.12,1.0,.12],.02,woodD);
 rbox(W,'bench shelf',[-.6,.42,-1.5],[3.0,.06,.8],.02,woodD);
 rbox(W,'vise body',[1.0,1.15,-1.5],[.3,.2,.25],.03,mat('#4a5560',{metal:.4,rough:.5,name:'steel'}));cyl(W,'vise handle',[1.0,1.3,-1.3],.012,.012,.3,steel,[0,0,Math.PI/2],{noOutline:true},8);
 // pegboard with hanging tools
 rbox(W,'pegboard',[-.6,1.95,-2.07],[3.4,1.1,.05],.02,mat('#7e6a4a',{rough:1}));
 for(let i=0;i<9;i++){const x=-2.1+i*.42;const t=i%3;if(t===0){cyl(W,'wrench shaft',[x,1.95,-2.02],.016,.016,.5,steel,null,{noOutline:true},8);torus(W,'wrench jaw',[x,2.22,-2.02],.045,.016,steel,[0,0,0],{noOutline:true},Math.PI*1.5);}
  else if(t===1){cyl(W,'hammer handle',[x,1.95,-2.02],.014,.014,.5,mat('#c08a4d'),null,{noOutline:true},8);rbox(W,'hammer head',[x,2.2,-2.02],[.16,.07,.05],.01,steel);}
  else{cyl(W,'saw blade',[x,1.95,-2.02],.07,.07,.01,steel,[Math.PI/2,0,0],{noOutline:true},16);}}
 // hanging lamp
 cyl(W,'lamp cord',[1.6,2.7,-.8],.008,.008,.8,mat('#2a2326'),null,{noOutline:true},6);cone(W,'lamp shade',[1.6,2.25,-.8],.25,.2,mat('#4a7d6b',{rough:.6}),[Math.PI,0,0]);sph(W,'lamp bulb',[1.6,2.18,-.8],.07,mat('#fff2b0'),null,{emissive:'#ffcf5a',emissiveIntensity:1.3,noOutline:true});
 // shelves with jars & gears
 rbox(W,'shelf',[2.55,1.9,-1.6],[.9,.06,.6],.02,wood);rbox(W,'shelf low',[2.55,1.3,-1.6],[.9,.06,.6],.02,wood);
 for(let i=0;i<4;i++){cyl(W,'jar',[2.2+i*.2,2.05,-1.6],.07,.07,.2,mat('#a8d9e0',{rough:.1}),null,{glass:true,noOutline:true},14);}
 kit.gear(W,'gear',[2.45,1.52,-1.5],10,.16,.12,.05,mat(M.brass,{metal:.6,rough:.35}),[0,0,0]);kit.gear(W,'gear',[2.8,1.45,-1.5],8,.12,.09,.05,mat(M.copper,{metal:.5,rough:.4}),[0,0,0.2]);
 // barrels, crates, anvil, toolbox
 const barrel=(x,z,c)=>{cyl(W,'barrel',[x,.5,z],.34,.31,1.0,mat(c,{rough:.7}),null,{},20);for(const y of [.2,.8])torus(W,'barrel hoop',[x,y,z],.335,.022,steel,[Math.PI/2,0,0],{noOutline:true});};
 barrel(-3.5,-1.4,'#4f6d8a');barrel(-3.1,-.6,'#a85a3a');barrel(3.5,-1.0,'#4f6d8a');
 rbox(W,'crate',[3.5,.35,.2],[.8,.7,.8],.04,wood);for(const [x,y,z] of [[3.5,.35,.6],[3.5,.35,-.2]])box(W,'crate slat',[x,y,z],[.82,.12,.02],woodD,null,{noOutline:true});
 rbox(W,'crate',[3.5,1.0,.2],[.6,.6,.6],.04,wood,[0,.3,0]);
 rbox(W,'anvil base',[-2.9,.3,1.0],[.5,.5,.4],.04,woodD);rbox(W,'anvil body',[-2.9,.7,1.0],[.8,.2,.3],.04,mat('#3d444b',{metal:.5,rough:.5,name:'steel'}));cone(W,'anvil horn',[-2.4,.72,1.0],.12,.35,mat('#3d444b',{metal:.5,rough:.5,name:'steel'}),[0,0,-Math.PI/2]);
 rbox(W,'toolbox',[1.7,.18,1.6],[.7,.3,.3],.04,mat(M.red,{rough:.5}));rbox(W,'toolbox lid',[1.7,.36,1.6],[.7,.07,.32],.03,mat('#a8301f',{rough:.5}));cyl(W,'toolbox handle',[1.7,.46,1.6],.012,.012,.3,steel,[0,0,Math.PI/2],{noOutline:true},8);
 // easel with a blueprint
 const easel=new THREE.Group();easel.position.set(.6,0,.4);easel.rotation.y=.2;W.add(easel);
 for(const x of [-.5,.5])cyl(easel,'easel leg',[x,.95,0],.025,.025,1.9,woodD,[.1,0,x*-.1],{},8);rbox(easel,'blueprint board',[0,1.3,.05],[1.1,.8,.04],.02,mat('#2e5f86',{rough:.9}));
 {const bp=document.createElement('canvas');bp.width=512;bp.height=360;const g=bp.getContext('2d');g.fillStyle='#2e6fa0';g.fillRect(0,0,512,360);g.strokeStyle='#e8f4ff';g.lineWidth=4;g.beginPath();g.arc(256,160,100,0,7);g.stroke();g.beginPath();g.arc(256,160,70,0,7);g.stroke();g.strokeRect(140,260,232,36);g.font='bold 34px Arial';g.fillStyle='#e8f4ff';g.textAlign='center';g.fillText('T-1  TIME MACHINE',256,334);for(let i=0;i<8;i++){const a=i/8*6.28;g.beginPath();g.moveTo(256+Math.cos(a)*100,160+Math.sin(a)*100);g.lineTo(256+Math.cos(a)*128,160+Math.sin(a)*128);g.stroke();}const t=new THREE.CanvasTexture(bp);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.7),new THREE.MeshBasicMaterial({map:t}));m.position.set(0,1.3,.075);m.userData.noOutline=true;m.userData.basic=true;easel.add(m);}
 // ---------- scaffold + A-frame crane beside the machine
 const S=new THREE.Group();S.position.set(3.9,0,-2.6);scene.add(S);
 const pipe=(a,b,r=.035)=>{const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),10),mat('#8f9aa3',{metal:.5,rough:.45,name:'steel'}));m.name='scaffold pipe';m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.userData.noOutline=false;S.add(m);return m;};
 for(const x of [-1.2,1.2])for(const z of [-.6,.6]){pipe([x,0,z],[x,4.2,z]);}
 for(const y of [1.4,2.8,4.2]){pipe([-1.2,y,-.6],[1.2,y,-.6]);pipe([-1.2,y,.6],[1.2,y,.6]);pipe([-1.2,y,-.6],[-1.2,y,.6]);pipe([1.2,y,-.6],[1.2,y,.6]);}
 pipe([-1.2,0,.6],[1.2,2.8,.6],.025);pipe([1.2,0,.6],[-1.2,2.8,.6],.025);
 for(const y of [1.4,2.8])rbox(S,'scaffold plank',[0,y+.04,0],[2.5,.06,1.2],.01,wood);
 // ladder
 for(const x of [-.2,.2])cyl(S,'ladder rail',[x+1.9,1.4,.7],.025,.025,2.9,wood,[.18,0,0],{noOutline:true},8);for(let i=0;i<9;i++)cyl(S,'ladder rung',[1.9,.3+i*.28,.7+(.3+i*.28)*-.0],.016,.016,.42,wood,[0,0,Math.PI/2],{noOutline:true},8);
 // crane: tall A-frame, jib, pulley, rope, hanging coil
 const C=new THREE.Group();C.position.set(-3.2,0,-5.0);scene.add(C);
 const cp=(a,b,r=.07)=>{const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),10),mat('#d8a43a',{metal:.2,rough:.55}));m.name='crane beam';m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());C.add(m);return m;};
 cp([-.8,0,-.4],[0,5.4,0]);cp([.8,0,-.4],[0,5.4,0]);cp([0,0,.9],[0,5.4,0]);cp([0,5.4,0],[2.6,6.3,0],.06);cp([0,5.4,0],[-.9,5.2,0],.05);cp([2.6,6.3,0],[0,6.0,0],.03);
 cyl(C,'crane pulley',[2.6,6.15,0],.14,.14,.06,mat('#4a5560',{metal:.4,name:'steel'}),[Math.PI/2,0,0]);
 cyl(C,'crane rope',[2.6,5.1,0],.012,.012,2.1,mat('#d9c28a',{rough:1}),null,{noOutline:true},6);
 const hook=new THREE.Group();hook.position.set(2.6,3.9,0);C.add(hook);torus(hook,'hook',[0,-.12,0],.1,.02,steel,[0,0,0],{},Math.PI*1.4);
 const hanging=new THREE.Group();hanging.position.set(2.6,3.4,0);C.add(hanging);for(let k=-4;k<=4;k++)torus(hanging,'hanging coil wire',[0,k*.05,0],.22,.028,mat('#d98046',{metal:.55,rough:.35}),[Math.PI/2,0,0]);
 // ---------- rival site (x +10..+18): bigger unfinished ring + sponsor banner
 const R=new THREE.Group();R.position.set(14,0,-3.5);scene.add(R);
 rbox(R,'rival deck',[0,.2,1.2],[8.5,.4,6.6],.05,mat('#c9c2b6',{rough:.9}));
 torus(R,'rival ring body',[0,3.2,0],2.7,.3,mat('#b9bfc7',{metal:.55,rough:.35,name:'steel'}),[0,0,0],{},Math.PI*1.35).rotation.z=-.4;
 for(const sx of [-1,1])rbox(R,'rival stanchion',[sx*2.6,1.6,0],[.6,2.4,.8],.08,mat('#9aa4ae',{metal:.5,rough:.4,name:'steel'}));
 const bannerPole=(x)=>cyl(R,'banner pole',[x,3.2,-2.4],.06,.06,6.4,mat('#ddd'),null,{},10);bannerPole(-3.6);bannerPole(3.6);
 sign(R,'sponsor banner',[0,5.6,-2.3],[7.0,1.4],['ZORPCO  TIME, SORTED.'],{bg:'#5b2a86',fg:'#ffe35a',border:'#2a1040',w:1024,size:84});
 // big crane
 const RC=new THREE.Group();RC.position.set(21,0,-5);scene.add(RC);
 cyl(RC,'rival crane mast',[0,5,0],.14,.2,10,mat('#e5e0d6',{rough:.6}),null,{},12);box(RC,'rival jib',[-3,10,0],[8,.22,.3],mat('#e5e0d6',{rough:.6}));box(RC,'rival counter',[2.2,10,0],[2.4,.4,.5],mat('#4a5560'));
 // ---------- far fair silhouette (ferris wheel, tents, flags)
 const F=new THREE.Group();F.position.set(34,0,-34);scene.add(F);
 torus(F,'wheel rim',[0,10,0],8,.18,mat('#e8453c',{rough:.5}),[0,0,0]);torus(F,'wheel rim inner',[0,10,0],5.2,.1,mat('#f4c542',{rough:.5}),[0,0,0]);
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;cyl(F,'wheel spoke',[Math.cos(a)*4,10+Math.sin(a)*4,0],.06,.06,8,mat('#d8d2c4'),[0,0,a+Math.PI/2],{noOutline:true},6);rbox(F,'gondola',[Math.cos(a)*8,10+Math.sin(a)*8-.7,0],[1.1,.9,.9],.15,mat(['#3d8bd6','#f0c23a','#4caf50','#e987a5'][i%4],{rough:.5}));}
 cyl(F,'wheel hub',[0,10,0],.5,.5,.8,mat('#d8d2c4'),[Math.PI/2,0,0]);cyl(F,'wheel leg',[-3,4.6,0],.2,.2,10.2,mat('#d8d2c4'),[0,0,-.55],{noOutline:true});cyl(F,'wheel leg',[3,4.6,0],.2,.2,10.2,mat('#d8d2c4'),[0,0,.55],{noOutline:true});
 for(const [x,z,c] of [[-14,6,'#e8453c'],[-8,10,'#3d8bd6'],[-22,12,'#f4c542'],[8,8,'#4caf50']]){const t=new THREE.Group();t.position.set(x,0,z);F.add(t);cyl(t,'tent wall',[0,1.4,0],2.4,2.4,2.8,mat('#f4efe0',{rough:.9}),null,{},16);cone(t,'tent roof',[0,3.6,0],3.1,1.8,mat(c,{rough:.7}),null,{},16);}
 // ---------- foreground dressing (near-camera depth layers)
 const FG=new THREE.Group();scene.add(FG);
 {const crate=(x,z,r,sc=1)=>{const body=rbox(FG,'fg crate',[x,.4*sc,z],[.8*sc,.8*sc,.8*sc],.05,wood,[0,r,0]);for(const dy of [-.2,.2])box(FG,'crate slat',[x,.4*sc+dy*sc,z],[.82*sc,.1*sc,.82*sc],woodD,[0,r,0],{noOutline:true});return body;};
  crate(-4.4,6.2,.4);crate(-3.5,6.7,-.2,.8);crate(-4.1,6.4,.1,.7).position.y=1.1;
  
  for(const x of [-2.6,-.9,.9,2.6]){cyl(FG,'fence post',[x,.55,5.6],.06,.07,1.1,woodD,null,{},10);}
  for(let i=0;i<3;i++){const x0=[-2.6,-.9,.9][i],x1=[-.9,.9,2.6][i];tube(FG,'fence rope',[[x0,1.0,5.6],[(x0+x1)/2,.82,5.6],[x1,1.0,5.6]],.022,mat('#d9c28a',{rough:1}),{noOutline:true});}
  sign(FG,'keep out sign',[0,.62,5.62],[1.2,.5],['T-1 TEST AREA','KEEP CLEAR'],{bg:'#f0c23a',fg:'#2a2326',border:'#2a2326',w:512,size:58});}
 finish(W,'prop');finish(FG,'prop');finish(S,'prop');finish(C,'prop');finish(R,'prop');finish(RC,'background');finish(F,'background');
 // ---------- bunting between poles (fair feel in the yard)
 const bunting=new THREE.Group();scene.add(bunting);
 function string(a,b,sag,count,colors){
  const pts=[];for(let i=0;i<=16;i++){const k=i/16;pts.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k-Math.sin(k*Math.PI)*sag,a[2]+(b[2]-a[2])*k]);}
  tube(bunting,'bunting string',pts,.012,mat('#d9c28a',{rough:1}),{noOutline:true});
  for(let i=1;i<count;i++){const k=i/count,p=[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k-Math.sin(k*Math.PI)*sag,a[2]+(b[2]-a[2])*k];const m=new THREE.Mesh(new THREE.ConeGeometry(.16,.4,3),new THREE.MeshStandardMaterial({color:colors[i%colors.length],roughness:.8,side:THREE.DoubleSide}));m.name='bunting flag';m.position.set(p[0],p[1]-.2,p[2]);m.rotation.z=Math.PI;m.rotation.y=Math.PI/2;m.userData.noOutline=true;bunting.add(m);}
 }
 string([-7,3.2,-2.2],[-1.4,3.8,-1.2],.5,10,['#e8453c','#f4c542','#3d8bd6','#4caf50']);
 string([3.8,4.4,-3.2],[9.5,4.8,-3.4],.6,10,['#e987a5','#f4c542','#3d8bd6','#e8453c']);
 finish(bunting,'background');
 Object.assign(out,{ground,W,S,C,R,hook,hanging,tuft,hills,dirt,trees,RC,F,FG,bunting});
 return out;
}
