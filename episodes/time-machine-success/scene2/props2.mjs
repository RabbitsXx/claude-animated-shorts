// More original props: model runway (the inventor's scale model), orrery, toy train, figurines, binoculars,
// planet tracker, rival seat rig, balloons, fair stage and bow tie.
export function buildFigurine(ctx,kit,{body='#f2c230',head='#fff6e6',bowTie=null,marks=false,scale=1}={}){
 const {THREE}=ctx,{mat,cone,sph,cyl,box,torus,finish}=kit;const g=new THREE.Group();g.name='Figurine';
 const s=.16*scale;
 cone(g,'fig body',[0,s*.55,0],s*.34,s*1.1,mat(body,{rough:.6}),null,{emissive:body,emissiveIntensity:.5},16);
 sph(g,'fig head',[0,s*1.32,0],s*.3,mat(head,{rough:.6}),null,{emissive:head,emissiveIntensity:.5});
 for(const x of [-1,1])cyl(g,'fig arm',[x*s*.33,s*.7,0],s*.05,s*.05,s*.42,mat(body,{rough:.6}),[0,0,x*.55],{noOutline:true},8);
 if(marks){for(const x of [-1,1]){torus(g,'fig target',[x*s*.11,s*1.36,s*.27],s*.07,s*.012,mat('#2a2326'),[0,0,0],{noOutline:true});sph(g,'fig target dot',[x*s*.11,s*1.36,s*.28],s*.025,mat('#2a2326'),null,{noOutline:true});}}
 else{for(const x of [-1,1])sph(g,'fig eye',[x*s*.1,s*1.36,s*.26],s*.03,mat('#2a2326'),null,{noOutline:true});}
 for(const x of [-1,1]){sph(g,'fig mitt',[x*s*.445,s*.525,0],s*.09,mat('#2a2326'),null,{noOutline:true});sph(g,'fig foot',[x*s*.16,s*.04,s*.1],s*.11,mat('#2a2326'),[1,.6,1.4],{noOutline:true});}
 if(bowTie){const b=mat(bowTie);for(const x of [-1,1])cone(g,'fig bow',[x*s*.14,s*1.02,s*.2],s*.12,s*.26,b,[0,0,-x*Math.PI/2],{noOutline:true},3);sph(g,'fig bow knot',[0,s*1.02,s*.22],s*.04,b,null,{noOutline:true});}
 finish(g,'prop');return {root:g,height:s*1.62};
}
// the inventor's scale model of the Earth's motion: long felt "space" board with ruler (1 m = 677,000 km)
export function buildRunway(ctx,kit,{length=3.8}={}){
 const {THREE}=ctx,{M,mat,box,rbox,cyl,sph,torus,sign,signTexture,finish}=kit;const g=new THREE.Group();g.name='Model runway';
 const wood=()=>mat(M.wood,{rough:.85}),woodD=()=>mat(M.woodDark,{rough:.9});
 const H=.95,W=1.0,L=length+.7;
 rbox(g,'bench top',[L/2-.35,H,0],[L,.08,W],.02,wood());
 const legs=new THREE.Group();g.add(legs);
 for(const x of [-.1,L-.5])for(const z of [-.4,.4])rbox(legs,'bench leg',[x,H/2,z],[.1,H,.1],.02,woodD());
 rbox(legs,'bench rail',[L/2-.35,.5,0],[L-.3,.06,.06],.015,woodD());
 // black felt with stars
 const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const p=cv.getContext('2d');p.fillStyle='#244a86';p.fillRect(0,0,1024,256);
 let s=17;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 for(let i=0;i<220;i++){p.fillStyle=`rgba(255,255,${200+Math.floor(r()*55)},${.35+r()*.65})`;const rr=.6+r()*1.8;p.beginPath();p.arc(r()*1024,r()*256,rr,0,7);p.fill();}
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const felt=new THREE.Mesh(new THREE.PlaneGeometry(length,.8),new THREE.MeshBasicMaterial({map:tex}));felt.rotation.x=-Math.PI/2;felt.position.set(length/2,H+.042,0);felt.name='felt';felt.userData.noOutline=true;felt.userData.basic=true;g.add(felt);
 const back=new THREE.Group();g.add(back);
 // upright starry backdrop so the model reads as deep space against the field
 {const bc=document.createElement('canvas');bc.width=1536;bc.height=512;const bp=bc.getContext('2d');const gr=bp.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#050a1c');gr.addColorStop(1,'#14224a');bp.fillStyle=gr;bp.fillRect(0,0,1536,512);let z=91;const rr=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296;};for(let i=0;i<420;i++){bp.fillStyle='rgba(255,255,'+(190+Math.floor(rr()*65))+','+(.3+rr()*.7)+')';bp.beginPath();bp.arc(rr()*1536,rr()*512,.6+rr()*2.2,0,7);bp.fill();}const bt=new THREE.CanvasTexture(bc);bt.colorSpace=THREE.SRGBColorSpace;const bd=new THREE.Mesh(new THREE.PlaneGeometry(length+.5,1.5),new THREE.MeshBasicMaterial({map:bt}));bd.position.set(length/2,H+.82,-.44);bd.name='space backdrop';bd.userData.noOutline=true;bd.userData.basic=true;back.add(bd);rbox(back,'backdrop frame bottom',[length/2,H+.07,-.44],[length+.56,.06,.05],.01,woodD());}
 // ruler along the front edge with tick marks and km labels
 const rv=document.createElement('canvas');rv.width=2048;rv.height=64;const q=rv.getContext('2d');q.fillStyle='#f3e6c8';q.fillRect(0,0,2048,64);q.fillStyle='#2a2326';q.font='bold 22px Arial';q.textAlign='center';
 for(let i=0;i<=40;i++){const x=i/40*2048;q.fillRect(x-1,0,2,i%5===0?30:16);if(i%10===0&&i>0)q.fillText(Math.round(i/40*2573)+'k',x,52);}q.fillText('0',14,52);
 const rt=new THREE.CanvasTexture(rv);rt.colorSpace=THREE.SRGBColorSpace;const ruler=new THREE.Mesh(new THREE.PlaneGeometry(length,.09),new THREE.MeshBasicMaterial({map:rt}));ruler.rotation.x=-Math.PI/2;ruler.position.set(length/2,H+.045,.46);ruler.userData.noOutline=true;ruler.userData.basic=true;g.add(ruler);
 // Earth marble on a little stand at the start
 const ec=document.createElement('canvas');ec.width=256;ec.height=128;const e=ec.getContext('2d');e.fillStyle='#2f78d0';e.fillRect(0,0,256,128);e.fillStyle='#4aa34a';for(const [x,y,w,h] of [[30,30,50,40],[120,50,70,50],[200,20,40,40],[60,85,40,28],[170,95,60,24]]){e.beginPath();e.ellipse(x,y,w/2,h/2,0,0,7);e.fill();}e.fillStyle='rgba(255,255,255,.7)';for(const [x,y] of [[40,20],[150,40],[210,70],[90,100]]){e.beginPath();e.ellipse(x,y,26,6,0,0,7);e.fill();}
 const et=new THREE.CanvasTexture(ec);et.colorSpace=THREE.SRGBColorSpace;
 const earth=new THREE.Mesh(new THREE.SphereGeometry(.04,32,24),new THREE.MeshStandardMaterial({map:et,roughness:.5}));earth.position.set(0,H+.045+.04,0);earth.name='Earth marble';g.add(earth);
 cyl(g,'marble stand',[0,H+.055,0],.02,.026,.02,mat(M.brass,{metal:.6,rough:.35}),null,{noOutline:true},16);
 // taut string from the marble along the board (shown by length param in the scene via scale)
 const string=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1,6),new THREE.MeshBasicMaterial({color:'#e8453c'}));string.rotation.z=Math.PI/2;string.position.set(0,H+.085,0);string.userData.noOutline=true;string.visible=false;g.add(string);
 function setString(len){string.visible=len>.01;string.scale.y=Math.max(.001,len);string.position.x=len/2;}
 // slots for figurines: x position in metres along the board from the Earth marble
 const kmToX=(km)=>km/2573000*(length-.25);
 finish(g,'prop');
 return {root:g,earth,H,length,legs,back,kmToX,setString,spin(t){earth.rotation.y=t*1.2;}};
}
// toy train on a rail with a stepping-off figure; track along +x
export function buildToyTrain(ctx,kit,{length=2.0}={}){
 const {THREE}=ctx,{M,mat,rbox,box,cyl,sph,torus,finish}=kit;const g=new THREE.Group();g.name='Toy rail';
 const steel=()=>mat('#8f9aa3',{metal:.5,rough:.4,name:'steel'}),wood=()=>mat('#8a5a3a',{rough:.9});
 rbox(g,'track bed',[length/2,-.012,0],[length+.12,.03,.24],.01,mat('#6b4a2e',{rough:.95}));
 for(const z of [-.05,.05])rbox(g,'rail',[length/2,.012,z],[length,.02,.016],.004,steel());
 for(let i=0;i<=24;i++)rbox(g,'sleeper',[i/24*length,.004,0],[.04,.012,.16],.003,wood());
 const train=new THREE.Group();g.add(train);
 const loco=new THREE.Group();train.add(loco);
 rbox(loco,'loco body',[0,.1,0],[.34,.12,.14],.03,mat('#c4402f',{rough:.5}));cyl(loco,'loco boiler',[.06,.15,0],.065,.065,.2,mat('#2f6f9f',{rough:.5}),[0,0,Math.PI/2],{},18);cyl(loco,'loco chimney',[.15,.24,0],.025,.03,.09,mat('#2a2326'),null,{noOutline:true},10);
 rbox(loco,'loco cab',[-.12,.2,0],[.1,.12,.15],.02,mat('#f0c23a',{rough:.5}));
 for(const x of [-.1,.02,.12])for(const z of [-.075,.075])cyl(loco,'loco wheel',[x,.045,z],.04,.04,.02,mat('#2a2326'),[Math.PI/2,0,0],{noOutline:true},14);
 const car=new THREE.Group();car.position.x=-.4;train.add(car);
 rbox(car,'flatcar',[0,.06,0],[.34,.04,.15],.01,mat('#5a6d8a'));for(const x of [-.1,.1])for(const z of [-.075,.075])cyl(car,'car wheel',[x,.03,z],.03,.03,.02,mat('#2a2326'),[Math.PI/2,0,0],{noOutline:true},12);
 finish(g,'prop');
 return {root:g,train,length,place(x){train.position.x=x;},carLocal:new THREE.Vector3(-.4,.1,0)};
}
export function buildOrrery(ctx,kit){
 const {THREE}=ctx,{M,mat,rbox,cyl,sph,torus,sign,finish}=kit;const g=new THREE.Group();g.name='Orrery';
 cyl(g,'orrery base',[0,.02,0],.5,.55,.04,mat(M.woodDark,{rough:.9}),null,{},32);
 cyl(g,'orrery post',[0,.2,0],.035,.035,.4,mat(M.brass,{metal:.6,rough:.35}),null,{noOutline:true},12);
 const sun=sph(g,'orrery sun',[0,.4,0],.11,mat('#ffd24a',{rough:.4}),null,{emissive:'#ffb020',emissiveIntensity:1.2,noOutline:false});
 torus(g,'orbit ring',[0,.4,0],.38,.007,mat(M.brass,{metal:.6,rough:.35}),[Math.PI/2,0,0],{noOutline:true});
 const arm=new THREE.Group();arm.position.y=.4;g.add(arm);
 const ec=document.createElement('canvas');ec.width=64;ec.height=32;const e=ec.getContext('2d');e.fillStyle='#2f78d0';e.fillRect(0,0,64,32);e.fillStyle='#4aa34a';e.fillRect(8,8,18,12);e.fillRect(36,14,16,10);
 const et=new THREE.CanvasTexture(ec);et.colorSpace=THREE.SRGBColorSpace;
 const earth=new THREE.Mesh(new THREE.SphereGeometry(.05,24,18),new THREE.MeshStandardMaterial({map:et,roughness:.5}));earth.position.x=.38;earth.name='orrery earth';arm.add(earth);
 const trail=new THREE.Group();g.add(trail);
 sign(g,'speed plaque',[0,.09,.5],[.5,.14],['29.78 km/s'],{bg:'#f3e6c8',fg:'#2a2326',border:'#2a2326',w:256,size:44},[-.5,0,0]);
 finish(g,'prop');
 return {root:g,arm,earth,orbit(t,speed=1.3){arm.rotation.y=-t*speed;}};
}
export function buildBinoculars(ctx,kit){
 const {THREE}=ctx,{mat,cyl,rbox,finish}=kit;const g=new THREE.Group();g.name='Binoculars';
 const body=mat('#3a3f46',{rough:.5}),lens=mat('#9fd6e6',{rough:.1});
 for(const x of [-.045,.045]){cyl(g,'bino tube',[x,0,0],.036,.04,.14,body,[Math.PI/2,0,0],{},16);cyl(g,'bino lens',[x,0,.075],.034,.034,.012,lens,[Math.PI/2,0,0],{glass:true,noOutline:true},16);cyl(g,'bino eyepiece',[x,0,-.08],.028,.028,.03,mat('#c4402f'),[Math.PI/2,0,0],{noOutline:true},12);}
 rbox(g,'bino bridge',[0,0,0],[.07,.04,.06],.012,body);
 finish(g,'prop');return {root:g};
}
export function buildTracker(ctx,kit){
 const {THREE}=ctx,{M,mat,rbox,cyl,sph,torus,cone,bolt,finish}=kit;const g=new THREE.Group();g.name='Planet tracker';
 const brass=()=>mat(M.brass,{metal:.6,rough:.35}),steel=()=>mat(M.steel,{metal:.5,rough:.4,name:'steel'});
 cyl(g,'tracker pole',[0,1.05,0],.04,.05,2.1,steel(),null,{noOutline:false},14);
 rbox(g,'tracker plate',[0,.02,0],[.3,.04,.3],.01,steel());for(const x of [-.11,.11])for(const z of [-.11,.11])bolt(g,[x,.05,z],.02,steel());
 cyl(g,'tracker clamp',[0,.85,0],.075,.075,.1,brass(),null,{},20);bolt(g,[.092,.85,0],.026,steel(),[0,0,Math.PI/2]);
 const gimbal=new THREE.Group();gimbal.position.y=2.15;g.add(gimbal);
 torus(gimbal,'gimbal ring a',[0,0,0],.17,.014,brass(),[0,0,0]);const ring2=torus(gimbal,'gimbal ring b',[0,0,0],.145,.014,brass(),[Math.PI/2,0,0]);
 const ec=document.createElement('canvas');ec.width=64;ec.height=32;const e=ec.getContext('2d');e.fillStyle='#2f78d0';e.fillRect(0,0,64,32);e.fillStyle='#4aa34a';e.fillRect(8,8,18,12);e.fillRect(36,14,16,10);
 const et=new THREE.CanvasTexture(ec);et.colorSpace=THREE.SRGBColorSpace;const earth=new THREE.Mesh(new THREE.SphereGeometry(.07,24,18),new THREE.MeshStandardMaterial({map:et,roughness:.5}));earth.name='tracker earth';gimbal.add(earth);
 const dish=new THREE.Group();dish.position.y=2.42;g.add(dish);cone(dish,'tracker dish',[0,0,0],.2,.1,mat('#e8e0c8',{rough:.5}),[Math.PI,0,0],{},24);cyl(dish,'dish feed',[0,.1,0],.012,.012,.18,steel(),null,{noOutline:true},8);sph(dish,'dish tip',[0,.2,0],.025,mat(M.red),null,{noOutline:true});
 finish(g,'prop');
 return {root:g,gimbal,dish,spin(t){gimbal.rotation.y=t*2.4;gimbal.rotation.x=Math.sin(t*1.7)*.3;ring2.rotation.x=Math.PI/2+t*1.3;dish.rotation.y=t*1.1;}};
}
// rival's seat + lever + dial rig (stands in front of the rival's big ring)
export function buildRivalRig(ctx,kit){
 const {THREE}=ctx,{M,mat,rbox,cyl,sph,box,torus,signTexture,sign,finish}=kit;const g=new THREE.Group();g.name='Rival rig';
 const steel=()=>mat('#aeb7c0',{metal:.5,rough:.4,name:'steel'}),leather=()=>mat('#7a2f5c',{rough:.6});
 rbox(g,'rival seat base',[0,.5,0],[.8,.2,.8],.05,steel());rbox(g,'rival seat cushion',[0,.68,0],[.7,.18,.7],.08,leather());rbox(g,'rival seat back',[0,1.2,-.32],[.7,.9,.14],.08,leather(),[-.08,0,0]);
 for(const x of [-.4,.4])rbox(g,'rival armrest',[x,.9,0],[.1,.07,.6],.03,steel());
 cyl(g,'seat pillar',[0,.25,0],.12,.16,.5,steel(),null,{},18);
 // pedestal with lever + dial
 const ped=new THREE.Group();ped.position.set(.5,0,.05);g.add(ped);
 rbox(ped,'pedestal',[0,.42,0],[.5,.84,.5],.06,mat('#7a2f9a',{rough:.5}));
 const lever=new THREE.Group();lever.position.set(0,.86,.1);ped.add(lever);cyl(lever,'lever base',[0,0,0],.07,.07,.08,steel(),[0,0,Math.PI/2],{noOutline:true});
 const rod=new THREE.Group();lever.add(rod);cyl(rod,'lever rod',[0,.28,0],.022,.022,.56,steel(),null,{noOutline:true},10);sph(rod,'lever knob',[0,.58,0],.06,mat('#ffd24a',{rough:.4}));rod.rotation.x=-.35;
 const tex=signTexture(['1 DAY'],{w:256,h:256,bg:'#f4ecd2',fg:'#2a2326',border:null,size:64});
 const face=new THREE.Mesh(new THREE.CircleGeometry(.13,32),new THREE.MeshBasicMaterial({map:tex}));face.position.set(-.1,.89,.12);face.rotation.x=-Math.PI/2+.5;face.userData.noOutline=true;face.userData.basic=true;ped.add(face);
 torus(ped,'dial bezel',[-.1,.87,.115],.14,.02,mat(M.brass,{metal:.6,rough:.35}),[-Math.PI/2+.5,0,0]);
 finish(g,'prop');
 return {root:g,lever:rod,ped,seatTop:new THREE.Vector3(0,.78,0)};
}
export function buildBalloons(ctx,kit,anchors,{seed=5}={}){
 const {THREE}=ctx,{mat,sph,cyl,tube,finish}=kit;const g=new THREE.Group();g.name='Balloons';
 const cols=['#e8453c','#f4c542','#3d8bd6','#4caf50','#e987a5','#9a5fd0'];const items=[];
 anchors.forEach((a,i)=>{const b=new THREE.Group();b.position.set(...a);g.add(b);const c=cols[i%cols.length];sph(b,'balloon',[0,.45,0],.2,mat(c,{rough:.3}),[1,1.2,1]);sph(b,'balloon tie',[0,.17,0],.03,mat(c),null,{noOutline:true});cyl(b,'balloon string',[0,-.35,0],.004,.004,1.0,mat('#e8e0c8'),null,{noOutline:true},4);items.push({b,base:new THREE.Vector3(...a),ph:i*1.3});});
 finish(g,'prop');
 return {root:g,bob(t){for(const it of items){it.b.position.y=it.base.y+Math.sin(t*1.6+it.ph)*.08;it.b.position.x=it.base.x+Math.sin(t*.9+it.ph*2)*.06;it.b.rotation.z=Math.sin(t*1.1+it.ph)*.08;}}};
}
export function buildStage(ctx,kit){
 const {THREE}=ctx,{M,mat,rbox,cyl,box,tube,sign,finish}=kit;const g=new THREE.Group();g.name='Fair stage';
 rbox(g,'stage deck',[0,.25,0],[9,.5,3],.05,mat('#a98a62',{rough:.9}));
 rbox(g,'stage skirt',[0,.18,1.52],[9,.34,.04],.01,mat('#c4402f',{rough:.8}));
 for(const x of [-4.4,4.4])cyl(g,'stage post',[x,2.4,-1.3],.1,.1,4.4,mat(M.woodDark,{rough:.9}),null,{},12);
 sign(g,'opening banner',[0,4.3,-1.25],[8.2,1.0],['OPENING DAY  -  T-1 TIME MACHINE'],{bg:'#f0c23a',fg:'#2a2326',border:'#2a2326',w:1024,size:68});
 rbox(g,'stage backdrop',[0,2.0,-1.45],[8.6,3.4,.1],.03,mat('#2f7f86',{rough:.8}));
 finish(g,'prop');return {root:g};
}
export function buildBowTie(ctx,kit){
 const {THREE}=ctx,{mat,cone,sph,finish}=kit;const g=new THREE.Group();g.name='Dropped bow tie';
 const b=mat('#c4402f',{rough:.6});for(const x of [-1,1])cone(g,'bow wing',[x*.07,0,0],.06,.14,b,[0,0,-x*Math.PI/2],{noOutline:true},3);sph(g,'bow knot',[0,0,0],.022,b,null,{noOutline:true});
 finish(g,'prop');return {root:g};
}
export function buildWrench(ctx,kit){
 const {THREE}=ctx,{mat,cyl,torus,rbox,finish}=kit;const g=new THREE.Group();g.name='Wrench';
 const steel=mat('#aeb7c0',{metal:.55,rough:.35,name:'steel'});
 cyl(g,'wrench shaft',[0,-.2,0],.016,.016,.4,steel,null,{},10);
 cyl(g,'wrench grip',[0,-.3,0],.021,.021,.18,mat('#d8402c',{rough:.7}),null,{noOutline:true},12);
 torus(g,'wrench jaw',[0,.03,0],.04,.016,steel,[0,0,0],{},Math.PI*1.6).rotation.z=Math.PI*.2;
 finish(g,'prop');
 const Y=new THREE.Vector3(),Q=new THREE.Quaternion(),U=new THREE.Vector3(0,1,0);
 // jaw (head) centre and handle direction butt->head
 return {root:g,place(head,dir,roll=0){Y.copy(dir).normalize();Q.setFromUnitVectors(U,Y);g.quaternion.copy(Q);g.rotateY(roll);g.position.copy(head);}};
}
export function buildFlag(ctx,kit,text=['OLD SPOT']){
 const {THREE}=ctx,{M,mat,cyl,sign,finish}=kit;const g=new THREE.Group();g.name='Marker flag';
 cyl(g,'flag pole',[0,.18,0],.006,.006,.36,mat('#e8e0c8'),null,{noOutline:true},6);
 sign(g,'flag cloth',[.1,.3,0],[.2,.1],text,{bg:'#e8453c',fg:'#fff7e8',border:null,w:256,size:34});
 finish(g,'prop');return {root:g};
}
export function buildLabel(ctx,kit,lines,{w=.5,h=.16,bg='#f3e6c8',fg='#2a2326'}={}){
 const {THREE}=ctx,{sign,finish}=kit;const g=new THREE.Group();g.name='Label';
 sign(g,'label',[0,0,0],[w,h],lines,{bg,fg,border:'#2a2326',w:512,size:Math.round(512*h/w*.5)});
 return {root:g};
}
