// Original hero props for "What If A Time Machine Actually Worked?" - all built from code (editable source).
// Units: metres, Y up. Each builder returns {root, ...handles} and is styled via kit.finish().
export function buildMachine(ctx,kit){
 const {THREE}=ctx,{M,mat,box,rbox,cyl,sph,torus,cone,tube,bolt,sign,signTexture,finish}=kit;
 const g=new THREE.Group();g.name='Time machine';
 const copper=()=>mat(M.copper,{metal:.45,rough:.4}),brass=()=>mat(M.brass,{metal:.6,rough:.35}),steel=()=>mat(M.steel,{metal:.5,rough:.4,name:'steel'}),wood=()=>mat(M.wood,{rough:.85}),woodD=()=>mat(M.woodDark,{rough:.9}),teal=()=>mat(M.teal,{rough:.5}),black=()=>mat('#2a2326',{rough:.9});
 const CY=1.95;
 // deck with boards, edge plates, bolts
 rbox(g,'deck',[0,.15,0],[5.4,.3,3.1],.04,wood());
 for(let i=0;i<10;i++)box(g,'plank gap',[-2.43+i*.54,.302,0],[.014,.002,3.0],woodD(),null,{noOutline:true});
 for(const z of [-1.57,1.57])rbox(g,'deck edge plate',[0,.15,z],[5.46,.22,.05],.015,steel());
 for(let i=0;i<9;i++)for(const z of [-1.6,1.6])bolt(g,[-2.4+i*.6,.2,z+(z>0?.03:-.03)],.02,steel(),[Math.PI/2,0,0]);
 // two stanchions, leg flanges
 for(const sx of [-1,1]){
  rbox(g,'stanchion',[sx*1.52,1.0,0],[.46,1.5,.56],.06,steel());
  rbox(g,'base plate',[sx*1.52,.36,0],[.7,.1,.86],.03,steel());
  for(const bx of [-.28,.28])for(const bz of [-.36,.36]){if(sx<0&&bx<0&&bz>0)continue;bolt(g,[sx*1.52+bx,.42,bz],.024,steel());}
  rbox(g,'ring cradle',[sx*1.4,1.78,0],[.52,.5,.66],.08,copper());
 }
 // ring + rim
 torus(g,'ring body',[0,CY,0],1.45,.21,copper(),[0,0,0]).scale.set(1,1,1.1);
 torus(g,'ring front rim',[0,CY,.19],1.45,.045,brass(),[0,0,0]);
 torus(g,'ring back rim',[0,CY,-.19],1.45,.045,brass(),[0,0,0]);
 torus(g,'inner steel rim',[0,CY,0],1.22,.05,steel(),[0,0,0]);
 // collars with bolts, coils between them
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+Math.PI/8,cx=Math.cos(a)*1.45,cy=CY+Math.sin(a)*1.45;
  rbox(g,'collar',[cx,cy,0],[.5,.2,.52],.05,brass(),[0,0,a]);
  for(const dz of [-.2,.2])for(const dr of [-.15,.15]){const bx=cx+Math.cos(a)*dr-Math.sin(a)*0,by=cy+Math.sin(a)*dr;bolt(g,[bx,by,dz*1.3],.022,steel(),[Math.PI/2,0,0]);}
 }
 for(const a0 of [30,150,210,330]){ // copper coils wound around the ring tube
  const a=a0*Math.PI/180,cx=Math.cos(a)*1.45,cy=CY+Math.sin(a)*1.45;
  const coil=new THREE.Group();coil.position.set(cx,cy,0);coil.rotation.z=a+Math.PI/2;g.add(coil);
  for(let k=-5;k<=5;k++)torus(coil,'coil wire',[k*.052,0,0],.3,.026,mat('#d98046',{metal:.55,rough:.35}),[0,Math.PI/2,0]);
  cyl(coil,'coil core cap',[-.31,0,0],.27,.27,.04,brass(),[0,0,Math.PI/2]);cyl(coil,'coil core cap',[.31,0,0],.27,.27,.04,brass(),[0,0,Math.PI/2]);
 }
 // bulbs around the front face
 const bulbs=[];
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,b=sph(g,'bulb',[Math.cos(a)*1.45,CY+Math.sin(a)*1.45,.3],.05,mat('#fff2b0',{rough:.3}),null,{emissive:'#ffcf5a',emissiveIntensity:.9,noOutline:true});bulbs.push(b);cyl(g,'bulb socket',[Math.cos(a)*1.45,CY+Math.sin(a)*1.45,.25],.034,.034,.06,brass(),[Math.PI/2,0,0],{noOutline:true},10);}
 // the last anchor bolt: front-left corner of the left base plate (hammered in the opening shot)
 const lastBolt=new THREE.Group();lastBolt.position.set(-1.80,.41,.36);g.add(lastBolt);
 cyl(lastBolt,'last bolt washer',[0,.012,0],.06,.06,.024,steel(),null,{noOutline:false},16);
 cyl(lastBolt,'last bolt head',[0,.06,0],.043,.043,.07,steel(),null,{noOutline:false},6);
 // control console
 const con=new THREE.Group();con.position.set(2.05,.3,.95);g.add(con);
 rbox(con,'console body',[0,.5,0],[.62,1.0,.56],.07,teal());
 rbox(con,'console panel',[0,1.04,-.02],[.58,.1,.58],.04,teal(),[-.45,0,0]);
 for(const x of [-.2,.2])for(const y of [.25,.55])bolt(con,[x,y,.285],.02,steel(),[Math.PI/2,0,0]);
 rbox(con,'console kick',[0,.06,.02],[.66,.12,.6],.03,steel());
 // dial (hour counter)
 const dialG=new THREE.Group();dialG.position.set(-.13,1.05,.1);dialG.rotation.x=-.45;con.add(dialG);
 cyl(dialG,'dial bezel',[0,.02,0],.15,.15,.05,brass(),null,{},32);
 const dialTex=signTexture(['1 HOUR'],{w:256,h:256,bg:'#f4ecd2',fg:'#2a2326',border:null,size:44});
 const dialFace=new THREE.Mesh(new THREE.CircleGeometry(.125,32),new THREE.MeshBasicMaterial({map:dialTex}));dialFace.rotation.x=-Math.PI/2;dialFace.position.y=.048;dialFace.userData.noOutline=true;dialFace.userData.basic=true;dialG.add(dialFace);
 const needle=new THREE.Group();needle.position.y=.052;dialG.add(needle);box(needle,'needle',[0,0,-.05],[.012,.006,.1],mat('#d8402c'),null,{noOutline:true});
 // readout screen (canvas, redrawn on demand)
 const scr=document.createElement('canvas');scr.width=512;scr.height=256;const sp=scr.getContext('2d'),scrTex=new THREE.CanvasTexture(scr);scrTex.colorSpace=THREE.SRGBColorSpace;
 const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(.3,.15),new THREE.MeshBasicMaterial({map:scrTex}));screenMesh.position.set(.12,1.06,.1);screenMesh.rotation.x=-Math.PI/2-.45;screenMesh.userData.noOutline=true;screenMesh.userData.basic=true;con.add(screenMesh);
 function screen(lines,{bg='#06241d',fg='#7dffb0',size=54}={}){sp.fillStyle=bg;sp.fillRect(0,0,512,256);sp.fillStyle=fg;sp.font='bold '+size+'px Consolas, monospace';sp.textAlign='center';sp.textBaseline='middle';const arr=Array.isArray(lines)?lines:[lines];arr.forEach((t,i)=>sp.fillText(t,256,128+(i-(arr.length-1)/2)*size*1.2));sp.strokeStyle=fg;sp.lineWidth=6;sp.strokeRect(3,3,506,250);scrTex.needsUpdate=true;}
 screen(['T-1','READY']);
 // lever
 const lever=new THREE.Group();lever.position.set(.17,.98,.2);con.add(lever);
 cyl(lever,'lever base',[0,.0,0],.07,.07,.08,steel(),[0,0,Math.PI/2]);
 const rod=new THREE.Group();lever.add(rod);cyl(rod,'lever rod',[0,.25,0],.022,.022,.5,steel(),null,{noOutline:true},10);sph(rod,'lever knob',[0,.52,0],.055,mat(M.red,{rough:.4}));
 rod.rotation.x=-.9;
 for(const x of [-.05,.0,.05])cyl(con,'toggle',[x-.2,1.1,-.12],.012,.012,.07,mat('#e8e0c8'),[-.4,0,0],{noOutline:true},8);
 // chair + cables
 const chair=new THREE.Group();chair.position.set(0,.3,.62);g.add(chair);
 rbox(chair,'chair seat',[0,.5,0],[.6,.07,.58],.03,wood());rbox(chair,'chair back',[0,.92,-.27],[.6,.8,.07],.03,wood(),[-.08,0,0]);
 for(const x of [-.25,.25])for(const z of [-.24,.24])cyl(chair,'chair leg',[x,.23,z],.03,.03,.46,woodD(),null,{noOutline:true},10);
 for(const x of [-.31,.31])rbox(chair,'chair arm',[x,.72,0],[.06,.05,.5],.02,wood());
 box(chair,'chair belt',[0,.57,.2],[.62,.04,.08],mat('#6a3f24'),null,{noOutline:true});
 tube(g,'cable',[[.9,.35,.7],[1.4,.33,1.0],[1.8,.33,1.0],[2.0,.35,.95]],.03,black(),{noOutline:true});
 tube(g,'cable',[[-1.4,.35,-.8],[-.4,.33,-1.1],[1.0,.33,-.9],[1.8,.4,.5],[2.0,.45,.9]],.028,black(),{noOutline:true});
 tube(g,'cable up',[[1.8,.4,.95],[1.7,1.5,.3],[1.2,2.3,.25],[1.0,2.8,.2],[.9,3.1,.0]],.026,black(),{noOutline:true});
 // portal disc (additive swirl); hidden when idle
 const portalMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:{t:{value:0},power:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float t,power;varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float r=length(p);if(r>1.)discard;float a=atan(p.y,p.x);float sw=sin(a*5.+r*9.-t*3.)*.5+.5;float rg=sin(r*26.-t*6.)*.5+.5;vec3 c=mix(vec3(.04,.30,.85),vec3(.55,.97,1.),sw*rg);float edge=smoothstep(1.,.80,r);float core=exp(-r*3.);gl_FragColor=vec4(c*(1.1+core*1.5),power*edge*(.30+.55*sw+core*.6));}'});
 const portal=new THREE.Mesh(new THREE.CircleGeometry(1.22,64),portalMat);portal.position.set(0,CY,.02);portal.visible=false;portal.userData.noOutline=true;
 finish(g,'prop');g.add(portal);
 return {root:g,portal,portalMat,bulbs,lastBolt,lever:rod,needle,dialTex,screen,chair,con,ringCenter:new THREE.Vector3(0,CY,0),
  boltTop(out=new THREE.Vector3()){return g.localToWorld(out.set(-1.80,.41+.095,.36));},seatBolt(k){lastBolt.position.y=.41+.055*(1-k);},
  setPortal(p,t){portal.visible=p>.01;portalMat.uniforms.power.value=p;portalMat.uniforms.t.value=t;}};
}
export function buildHammer(ctx,kit){
 const {THREE}=ctx,{M,mat,rbox,cyl,finish}=kit;const g=new THREE.Group();g.name='Sledge hammer';
 const steel=mat('#8f9aa3',{metal:.55,rough:.35,name:'steel'});
 rbox(g,'hammer head',[0,0,0],[.30,.13,.13],.025,steel);
 rbox(g,'hammer face left',[-.165,0,0],[.04,.15,.15],.02,mat('#6d7882',{metal:.6,rough:.3,name:'steel'}));rbox(g,'hammer face right',[.165,0,0],[.04,.15,.15],.02,mat('#6d7882',{metal:.6,rough:.3,name:'steel'}));
 cyl(g,'hammer handle',[0,-.5,0],.022,.026,1.0,mat('#c08a4d',{rough:.7}),null,{noOutline:false},14);
 cyl(g,'hammer grip',[0,-.78,0],.031,.031,.3,mat(M.red,{rough:.8}),null,{noOutline:true},14);
 cyl(g,'hammer butt',[0,-1.0,0],.034,.034,.03,mat('#6a3f24'),null,{noOutline:true},14);
 finish(g,'prop');
 const X=new THREE.Vector3(),Y=new THREE.Vector3(),Z=new THREE.Vector3(),Mx=new THREE.Matrix4();
 // head centre, U = unit butt->head along the handle, S = direction the leading end face should point
 return {root:g,place(head,U,S){Y.copy(U).normalize();X.copy(S).addScaledVector(Y,-S.dot(Y));if(X.lengthSq()<1e-6)X.set(1,0,0).addScaledVector(Y,-Y.x);X.normalize();Z.crossVectors(X,Y).normalize();Mx.makeBasis(X,Y,Z);g.quaternion.setFromRotationMatrix(Mx);g.position.copy(head);},
  headFromHand(h,U,L=.82){return h.clone().addScaledVector(U,L);}};
}
export function buildWallet(ctx,kit){
 const {THREE}=ctx,{M,mat,box,rbox,cyl,finish}=kit;const g=new THREE.Group();g.name='Wallet';
 const leather=mat('#7a4527',{rough:.8}),inner=mat('#efdfb6',{rough:.9}),stitch=mat('#f0dcae',{rough:.9});
 const L=new THREE.Group(),R=new THREE.Group();g.add(L,R);L.position.x=-.004;R.position.x=.004;
 rbox(L,'wallet left',[-.1,0,0],[.2,.02,.14],.008,leather);rbox(R,'wallet right',[.1,0,0],[.2,.02,.14],.008,leather);
 rbox(L,'pocket left',[-.1,.016,.012],[.18,.012,.1],.004,inner);rbox(R,'pocket right',[.1,.016,.012],[.18,.012,.1],.004,inner);
 rbox(L,'card slot',[-.1,.024,.045],[.17,.006,.025],.003,mat('#d9c08a'));
 for(let i=0;i<14;i++){box(L,'stitch',[-.19+i*.0135,.011,.065],[.008,.002,.004],stitch,null,{noOutline:true});box(R,'stitch',[.0095+i*.0135,.011,.065],[.008,.002,.004],stitch,null,{noOutline:true});box(L,'stitch',[-.19+i*.0135,.011,-.065],[.008,.002,.004],stitch,null,{noOutline:true});box(R,'stitch',[.0095+i*.0135,.011,-.065],[.008,.002,.004],stitch,null,{noOutline:true});}
 cyl(g,'wallet hinge',[0,0,0],.012,.012,.14,leather,[Math.PI/2,0,0],{noOutline:true},10);
 finish(g,'prop');
 return {root:g,L,R,open(k){L.rotation.z=(1-k)*Math.PI*.97;R.rotation.z=0;}};
}
export function buildMoth(ctx,kit){
 const {THREE}=ctx,{mat,sph,finish}=kit;const g=new THREE.Group();g.name='Moth';
 const wing=()=>{const m=new THREE.Mesh(new THREE.CircleGeometry(.035,14),new THREE.MeshBasicMaterial({color:'#e8dcc4',side:THREE.DoubleSide}));m.userData.noOutline=true;m.scale.set(1,.8,1);return m;};
 const body=sph(g,'moth body',[0,0,0],.012,mat('#8a6a4a'),[1,1,2.6],{noOutline:true});
 const wl=new THREE.Group(),wr=new THREE.Group();g.add(wl,wr);const a=wing();a.position.x=-.035;wl.add(a);const b=wing();b.position.x=.035;wr.add(b);
 finish(g,'prop');
 return {root:g,flap(t){const k=Math.sin(t*55)*.9;wl.rotation.z=k;wr.rotation.z=-k;}};
}
