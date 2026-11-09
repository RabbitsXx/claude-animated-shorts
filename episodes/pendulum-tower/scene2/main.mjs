// Why a Skyscraper Hangs a Giant Golden Ball: the whole film as pure functions of absolute time (STORY.json, 16 beats, 63.5 s).
// One world (a hill town building site): Pete's skinny tower on the left with the golden ball in its top floors, Rex's sleek tower on the right with a rooftop pool,
// a crane, a playground and the opening-day queue. Every prop comes from a passed model (MODELS.json). Light: day (0-13.2 s), night (13.2-29 s), bright morning (29-63.5 s).
// World rule: a tall tower sways slowly; a heavy ball on a long enough rope swings against the sway and cancels it. The ball hangs 4.3 m below its rope, so rope 4.5 / 6.5 / 8.5 m = short / Pete's half-fix / Rex's crank.
import {makeKit} from '/runtime/kit.js';
import {makeActorFactory} from '/runtime/actor.js';
import {faceTrack} from '/runtime/face.js';
import {dissolveK} from '/runtime/tracks.js';
import {makeFx} from '/runtime/fx.js';
import {coverDof} from '/repo/studio2/library/cover-dof.mjs';
import {PETE,REX,REX_SUIT} from './cast.mjs';
import {buildBall,load as loadBall} from './models/golden-ball-rig.mjs';
import {buildTower as buildPete,load as loadPete} from './models/tower-pete.mjs';
import {buildTower as buildRex,load as loadRex} from './models/tower-rex.mjs';
import {buildPool,load as loadPool} from './models/rooftop-pool.mjs';
import {buildSwing,load as loadSwing} from './models/playground-swing.mjs';
import {buildDummy,load as loadDummy} from './models/test-dummy.mjs';
import {buildSet,load as loadSet} from './models/top-floor-set.mjs';
import {buildCraneWinch,load as loadCrane} from './models/crane-winch.mjs';
import * as TD from './models/town-dressing.mjs';
import {buildHorizon,load as loadHorizon} from './models/horizon-hills.mjs';
import {buildTree,buildBush,tuftField,loadFoliage} from '/repo/studio2/library/foliage.mjs';
import {crowdSpec,crowdPose} from '/repo/studio2/library/crowd.mjs';
import {loadCharacterParts} from '/repo/studio2/library/character-parts.mjs';
import {texturize,RULES} from '/repo/studio2/library/realism.mjs';
export const authored=true;
const clamp01=x=>Math.max(0,Math.min(1,x)),sm=x=>{x=clamp01(x);return x*x*(3-2*x);},lerp=(a,b,k)=>a+(b-a)*k,lerpA=(a,b,k)=>a.map((v,i)=>lerp(v,b[i],k)),ph=(t,a,b)=>clamp01((t-a)/(b-a));
const A=[0,3.2,6.4,9.4,13.2,17,21,23.5,29,32,36.4,40.6,46.4,52,56,60,63.5];
const ATM={
 day:{sky:[[.62,.80,.98],[.10,.38,.92]],sun:[-.4,.8,.5],sunColor:'#fff4d8',fogColor:'#cfe3f5',fogNear:60,fogFar:420,exposure:1.0},
 night:{sky:[[.05,.07,.2],[.01,.02,.1]],sun:[-.3,.5,.3],sunColor:'#8fa2ff',fogColor:'#26305e',fogNear:40,fogFar:260,exposure:.8},
 morning:{sky:[[.98,.80,.62],[.14,.42,.92]],sun:[.5,.6,.6],sunColor:'#fff0d0',fogColor:'#f0dcc2',fogNear:60,fogFar:420,exposure:1.0},
};
const TP=[-22,0,0],TR=[24,0,-4],CR=[1.4,0,9.5],SW=[2,0,30];            // Pete's tower, Rex's tower, crane, swing set
const ROPE=[4.5,6.5,8.5];                                                // short, Pete's half-fix, Rex's crank (the ball hangs 4.3 m below the rope)
const SLAB=n=>4*(n-1);
export async function build(ctx,{T,words,duration}){
 const {THREE}=ctx,kit=makeKit(ctx),create=makeActorFactory(ctx),V=(x,y,z)=>new THREE.Vector3(x,y,z),fx=makeFx(ctx);
 await Promise.all([loadBall(),loadPete(),loadRex(),loadPool(),loadSwing(),loadDummy(),loadSet(),loadCrane(),TD.load(),loadHorizon(),loadFoliage(),loadCharacterParts()]);
 // ---------------- ground and far world
 const PW0=(grp,p)=>{grp.updateMatrixWorld(true);return grp.localToWorld(new THREE.Vector3(...p)).toArray();};
 const mk=(geo,matName,color,name,pos,rough=1)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:rough,name:matName}));m.material.name=matName;m.name=name;m.position.set(...pos);m.receiveShadow=true;ctx.scene.add(m);return m;};
 const lawn=mk(new THREE.PlaneGeometry(900,900),'meadow lawn','#4fae35','ground meadow',[0,0,0]);lawn.rotation.x=-Math.PI/2;lawn.userData.noOutline=true;
 const plaza=mk(new THREE.BoxGeometry(150,.12,46),'concrete pavement','#d9cfc0','ground plaza',[0,.06,12]);plaza.userData.noOutline=true;
 {const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  g.fillStyle='#d9cfc0';g.fillRect(0,0,256,256);
  for(let i=0;i<64;i++){g.fillStyle=`rgba(${150+((i*37)%40)},${140+((i*53)%40)},${125+((i*29)%40)},.28)`;g.fillRect(((i*89)%240),((i*131)%240),22,22);}
  g.fillStyle='#6f665a';g.fillRect(0,0,256,7);g.fillRect(0,0,7,256);g.fillRect(0,125,256,5);g.fillRect(125,0,5,256);
  const tx=new THREE.CanvasTexture(cv);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(75,23);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
  plaza.material.map=tx;plaza.material.color.set('#ffffff');plaza.material.name='paving slabs plaza';plaza.userData.noTexture=true;}
 const road=mk(new THREE.BoxGeometry(900,.1,9),'asphalt road','#4a4d56','ground road',[0,.05,40]);road.userData.noOutline=true;
 const hz={day:buildHorizon(ctx,kit,{palette:'day',seed:3}),night:buildHorizon(ctx,kit,{palette:'night',coast:true,seed:11})};ctx.scene.add(hz.day.root,hz.night.root);
 {let s=3;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  for(let i=0;i<46;i++){const a=r()*Math.PI*2,d=62+r()*70,x=Math.cos(a)*d,z=Math.sin(a)*d-20;if(z>8&&z<46&&Math.abs(x)<80)continue;if(x>-45&&x<55&&z>36&&z<108)continue;const t=buildTree(ctx,kit,{seed:i+1,height:8+r()*7});t.position.set(x,0,z);ctx.scene.add(t);}
  for(let i=0;i<14;i++){const b=buildBush(ctx,kit,{seed:i+3,r:1+r()*.8});b.position.set(-70+r()*140,0,-10-r()*12);ctx.scene.add(b);}
  ctx.scene.add(tuftField(ctx,{n:7000,seed:7,place:(rr)=>{for(;;){const x=-90+rr()*180,z=-60+rr()*130;if(z>-3&&z<36&&Math.abs(x)<66)continue;if(Math.abs(x-TP[0])<9&&Math.abs(z-TP[2])<9)continue;return [x,.05,z];}}}));}
 // ---------------- Pete's tower with everything that sways with it
 const pete=buildPete(ctx,kit,{cutaway:true}),ball=buildBall(ctx,kit,{ropeLength:ROPE[0]}),set=buildSet(ctx,kit),dummy=buildDummy(ctx,kit),cw=buildCraneWinch(ctx,kit);
 const twP=new THREE.Group();twP.position.set(...TP);twP.name='Pete tower group';ctx.scene.add(twP);twP.add(pete.root);
 ball.root.position.set(0,72,0);twP.add(ball.root);
 set.root.position.set(-3.7,SLAB(18)+.02,3.6);twP.add(set.root);
 twP.add(dummy.root);dummy.root.position.set(-3.7,SLAB(18)+.02,3.6);
 pete.setPlug(17,false);pete.setPlug(16,true);
 const haul=buildBall(ctx,kit,{ropeLength:.5});ctx.scene.add(haul.root);haul.mount.visible=false;for(const d of haul.dampers)d.visible=false;
 const lampInt=new THREE.PointLight('#ffd9a8',0,34,1.4),lampLow=new THREE.PointLight('#ffd9a8',0,34,1.4);lampInt.position.set(0,SLAB(18)+3.4,2.2);lampLow.position.set(0,SLAB(16)+3.4,2.2);const lampBall=new THREE.PointLight('#ffe2b0',0,40,1.3);lampBall.position.set(0,64,6.5);twP.add(lampInt,lampLow,lampBall);
 cw.root.position.set(...CR);ctx.scene.add(cw.root);
 const winch=cw.winch;twP.add(winch);winch.position.set(-4.5,SLAB(18)+.02,-.8);winch.rotation.y=Math.PI/2;
 // ---------------- Rex's tower and the rooftop pool
 const rex=buildRex(ctx,kit),twR=new THREE.Group();twR.position.set(...TR);twR.name='Rex tower group';ctx.scene.add(twR);twR.add(rex.root);
 const pool=buildPool(ctx,kit);pool.root.position.set(0,85.62,0);twR.add(pool.root);
 for(const [w,d,x,z] of [[2.8,9.4,-7.8,0],[2.8,9.4,7.8,0],[12.8,1.8,0,-3.8],[12.8,1.8,0,3.8]]){const pl=mk(new THREE.BoxGeometry(w,1.52,d),'concrete pool plinth','#cfc8bc','ground pool plinth',[x,84.8,z]);twR.add(pl);pl.position.set(x,84.78,z);}
 for(const g of ctx.scene.children)if(/Elevator car/.test(g.name))g.visible=true;
 // ---------------- town dressing, playground, crowd, cast
 const place=(g,p,ry=0,s=1)=>{g.position.set(...p);g.rotation.y=ry;g.scale.setScalar(s);ctx.scene.add(g);return g;};
 const bannerT=TD.buildBannerOpening(ctx,kit).root;place(bannerT,[TP[0]-1.7,6.05,TP[2]+6.35],0);
 const bannerG=TD.buildBannerGrand(ctx,kit).root;place(bannerG,[TR[0]-12,0,TR[2]+13],0);
 const sign=TD.buildSign(ctx,kit,{crossed:true}).root;place(sign,[TP[0]+8,0,TP[2]+9],-.3);
 const lamps=[-34,-12,10,32].map(x=>place(TD.buildLamp(ctx,kit).root,[x,0,22],0));
 const barriers=Array.from({length:14},(_,i)=>place(TD.buildBarrier(ctx,kit).root,[TR[0]-22+i*2.2,0,TR[2]+24],0));
 const barriers2=Array.from({length:14},(_,i)=>place(TD.buildBarrier(ctx,kit).root,[TR[0]-22+i*2.2,0,TR[2]+27.5],0));
 const hoard=Array.from({length:6},(_,i)=>place(TD.buildHoarding(ctx,kit).root,[TP[0]-16-i*2.5,0,TP[2]+5],0));
 const bunch=place(TD.buildBalloonBunch(ctx,kit).root,[TR[0]+10,0,TR[2]+14],0);
 const sadBalloon=place(TD.buildBalloon(ctx,kit).root,[TP[0]-4,0,TP[2]+9],0);
 const sock=place(TD.buildWindsock(ctx,kit).root,[8,0,18],0);
 const bunting=place(TD.buildBunting(ctx,kit).root,[TR[0]-9,6,TR[2]+16],0);
 const pig=TD.buildPigeon(ctx,kit,{fainted:false});ctx.scene.add(pig.root);
 const wallet=TD.buildWallet(ctx,kit).root,fly=TD.buildFly(ctx,kit).root;ctx.scene.add(wallet,fly);
 const swing=buildSwing(ctx,kit);place(swing.root,SW,Math.PI,1);
 // a foreground belt near the wide cameras (lamps, hoardings, trees, bushes, barriers): every wide shot gets props in front of the towers
 const LOWCAM=[];for(const [a,b] of [[[8,78],[-4,72]],[[8,86],[-2,84]],[[4,78],[-8,74]],[[-14,45.5],[-2.6,95.5]],[[-20,27.5],[-14,45.5]]])for(let q=0;q<=12;q++)LOWCAM.push([lerp(a[0],b[0],q/12),lerp(a[1],b[1],q/12)]);
 for(const [x,z,k] of [[-9,68,'h'],[-5.6,70.5,'h'],[-2,73,'h'],[-14,66,'l'],[-24,76,'l'],[16,72,'t'],[22,66,'t'],[-18,74,'t'],[8,62,'b'],[-6,62,'b'],[14,58,'b'],[11,66,'r'],[-1,66,'r'],[-27,44,'l'],[-30,40,'b'],[-34,48,'t'],[6,44,'r'],[9,40,'b'],[8,50,'l'],[-26,52,'h'],[12,47,'h'],[-17.3,44.6,'l'],[-11.2,43.5,'h'],[-10,41,'r'],[9,72,'l'],[7.1,64.0,'t'],[-0.7,67.0,'t'],[3.9,56.3,'t'],[-3.5,59.2,'t'],[7.2,70.9,'t'],[-0.8,73.6,'t'],[4.0,62.3,'t'],[-3.6,65.0,'t'],[3.8,64.2,'t'],[-4.1,66.8,'t'],[1.0,56.5,'t'],[-6.6,59.0,'t'],[-1.6,79.4,'t'],[-9.8,81.1,'t'],[-3.7,69.9,'t'],[-11.6,71.5,'t'],[-11.9,38.9,'t'],[-13.5,31.1,'t']]){
  if(LOWCAM.some(([cx,cz])=>Math.hypot(cx-x,cz-z)<7))continue;
  const o=k==='h'?TD.buildHoarding(ctx,kit).root:k==='l'?TD.buildLamp(ctx,kit).root:k==='t'?buildTree(ctx,kit,{seed:Math.round(x+z),height:11}):k==='b'?buildBush(ctx,kit,{seed:z,r:1.4}):TD.buildBarrier(ctx,kit).root;
  place(o,[x,0,z],(x*.37)%3.1,1);}
 for(const [x,z,k] of [[3.4,-2.6,'plant'],[-4.6,-3.4,'lamp'],[4.4,2.8,'plant'],[-1.8,-4.8,'lamp']]){const o=(k==='plant'?set.plant:set.lamp).clone(true);o.visible=true;o.position.set(x,SLAB(16)+.02,z);twP.add(o);}
 for(const [x,y,z,ry] of [[TR[0]-8,5.2,TR[2]+30,0],[TR[0]+6,5.2,TR[2]+30,0],[TR[0]-2,5.6,TR[2]+31.5,0],[TR[0]+12,5.0,TR[2]+30,0],[TR[0]-14,5.0,TR[2]+30,0],[TR[0]+2,6.2,TR[2]+26,.05],[TR[0]-10,6.2,TR[2]+26,-.05],[TR[0]+9,6.2,TR[2]+26,0]]){
  const o=TD.buildBunting(ctx,kit).root;place(o,[x,y,z],ry,1.4);}
 for(const [x,z] of [[TR[0]-5,TR[2]+33],[TR[0]+8,TR[2]+33],[TR[0]-12,TR[2]+33],[TR[0]+16,TR[2]+33]]){const o=TD.buildBalloonBunch(ctx,kit).root;place(o,[x,0,z],0,1.3);}
 for(const fl of [16,18])for(const [x,z,ry] of [[-3.4,-5.35,0],[0,-5.35,0],[3.4,-5.35,0],[-5.4,-2.2,Math.PI/2],[-5.4,2.0,Math.PI/2]]){
  if(fl===18&&x<-5)continue;
  const o=TD.buildHoarding(ctx,kit).root;o.position.set(x,SLAB(fl)+.02,z);o.rotation.y=ry;o.scale.setScalar(.9);twP.add(o);}
 {const hole=PW0(twP,[-3.5,SLAB(16)+.02,.4]),wpool=PW0(twR,[-5,85.8,0]);
  for(let k=0;k<16;k++)fx.burst({t0:17+k*.12,life:.5,count:6,pos:hole,dir:[0,1,0],spread:.9,speed:[.6,1.8],size:[.03,.07],colors:['#e8e0d0'],kind:'dust',seed:k+1});
  for(let k=0;k<9;k++)fx.burst({t0:58.6+k*.14,life:2.2,count:10,pos:wpool,dir:[-.5,-1,.6],spread:.8,speed:[1,3],size:[.8,1.6],colors:['#5ad4e6','#9be8f2'],kind:'puff',seed:k+31,grow:1.5,gravity:[0,-12,0]});}
 const hero=create(PETE),rexA=create(REX),rexS=create(REX_SUIT),girl=create({...crowdSpec(40),name:'girl',scale:.66,headScale:1.18,dress:undefined,shirt:'#ff7ab0',pants:'#2f6fd0',hairStyle:'bun'}),dad=create({...crowdSpec(41),name:'dad',scale:1.05,dress:undefined,shirt:'#3d6a8a',pants:'#3a3f4a'});
 const crowd=Array.from({length:22},(_,i)=>create({...crowdSpec(i+1),dress:undefined})); // no cone-shaped dresses on anyone: everybody wears a shirt and trousers
 const actors=[hero,rexA,rexS,girl,dad,...crowd];
 for(const r of RULES)if(['plaster','concrete','turf','asphalt','wood','tile','metal'].includes(r.id))r.contrast=Math.min(.95,r.contrast*2.1); // a stronger surface pattern (this film only): more fine detail in walls, ground and hills
 texturize(ctx.scene,{THREE});
 for(const car of [rex.carA,rex.carB,pete.elevator])car.traverse(m=>{if(m.isMesh&&/glass/i.test(m.name)){m.material=m.material.clone();m.material.transparent=true;m.material.opacity=.2;m.material.depthWrite=false;}});
 rex.root.traverse(m=>{if(m.isMesh&&/^(shaft[ _]glass|cab[ _]glass)/i.test(m.name))m.visible=false;});rex.banner.visible=false;pete.root.traverse(m=>{if(m.isMesh&&/glass|glaz/i.test(m.name)&&!/shaft/i.test(m.name)){m.material=m.material.clone();m.material.color.offsetHSL(-.09,0,0);}});rex.root.traverse(m=>{if(m.isMesh&&/glass[ _]pane|frit[ _]band/i.test(m.name)){m.material=m.material.clone();m.material.color.offsetHSL(-.09,0,0);}});rex.root.traverse(m=>{if(m.isMesh&&/^(shaft[ _]transom|cab[ _]door[ _]frame)/i.test(m.name))m.visible=false;});pete.elevator.traverse(m=>{if(m.isMesh&&/(glass|^car[ _]door)/i.test(m.name))m.visible=false;});pete.root.traverse(m=>{if(m.isMesh&&/shaft[ _]glass|shaft[ _]glaz/i.test(m.name))m.visible=false;});
 // texturize turns materials; re-apply the water look after it (the pool module also sets it when built)
 // ---------------- helpers
 const F=(yaw)=>[Math.sin(yaw),0,Math.cos(yaw)],R=(yaw)=>[Math.cos(yaw),0,-Math.sin(yaw)];
 const at=(p,yaw,dx,dy,dz)=>{const f=F(yaw),r=R(yaw);return [p[0]+r[0]*dx+f[0]*dz,p[1]+dy,p[2]+r[2]*dx+f[2]*dz];};
 const faceAt=(t,keys,seed=3)=>{const f=faceTrack(keys,t);const per=3.1+(seed%5)*.3,p=(t+seed*.7)%per;f.blink=Math.max(f.blink||0,p<.14?Math.sin(p/.14*Math.PI):0);return f;};
 const idleL={torso:[-.24,.12,.06]},idleR={torso:[.24,.12,.06]};
 const PW=(grp,p)=>{grp.updateMatrixWorld(true);return grp.localToWorld(V(...p)).toArray();};     // a point of a swaying tower in world space
 const W3=(o,p=[0,0,0])=>{o.updateMatrixWorld(true);return o.localToWorld(V(...p)).toArray();};
 const toLocal=(grp,w)=>{grp.updateMatrixWorld(true);return grp.worldToLocal(V(...w)).toArray();};
 const yawTo=(a,b)=>Math.atan2(b[0]-a[0],b[2]-a[2]);
 const standing=(a,pos,yaw,face,t,seed=1,extra={})=>a.pose({pos,yaw,lean:.012*Math.sin(t*2+seed),sway:.02*Math.sin(t*1.3+seed),face,hands:[idleL,idleR],...extra});
 // Grips: a hand that must hold a prop is driven by the prop's own grip point (HOLD returns the world target) and measured after the pose
 // (studio2/runtime/collide.js checkGrips: more than tol metres between the end of the arm and the grip point = a gate failure). Call HOLD only while the prop is held.
 const near=(from,to,d)=>{const dx=from[0]-to[0],dz=from[2]-to[2],l=Math.hypot(dx,dz)||1;return [to[0]+dx/l*d,from[1],to[2]+dz/l*d];}; // stand d metres from a target so the arm can reach it
 const GRIPS=[];let REACH=0;const nodeCache=new Map();
 const nodeOf=(root,re)=>{const k=root.uuid+re.source;if(!nodeCache.has(k)){let f=null;root.traverse(o=>{if(!f&&re.test(o.name))f=o;});if(!f)throw Error('grip node missing: '+re);nodeCache.set(k,f);}return nodeCache.get(k);};
 const gripPoint=(g)=>{if(g.node){g.node.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(g.node).getCenter(V());}g.prop.updateMatrixWorld(true);return g.prop.localToWorld(V(...g.local));};
 const HOLD=(id,actor,j,prop,local,tol=.06)=>{const g={id,actor,j,prop,local,tol};GRIPS.push(g);return gripPoint(g).toArray();};      // a point typed in the prop's own frame
 const HOLDN=(id,actor,j,root,re,tol=.06)=>{const g={id,actor,j,node:nodeOf(root,re),tol};GRIPS.push(g);return gripPoint(g).toArray();}; // a named node of the model: the real grip
 for(const a of actors){const p0=a.pose;a.pose=(o)=>{const r=p0(o);REACH=Math.max(REACH,(r&&r.reach)||0);return r;};} // the arm that cannot reach its target is clamped: report it
 const peteTransoms=[];pete.root.traverse(m=>{if(m.isMesh&&/^shaft[ _]transom/i.test(m.name))peteTransoms.push(m);}); // thin ties across the glass shaft: hidden only while the camera rides the lift (the head would pass behind each one)
 // the lift's panes wash the close shots of Pete in blue-green (and read as sky to the sky check): hidden only in the two lift beats, restored every frame
 const peteGlass=[];pete.root.traverse(m=>{if(m.isMesh&&/glass|glaz/i.test(m.name)&&m.visible)peteGlass.push(m);});
 const hideAll=()=>{for(const a of actors)a.hide();haul.root.visible=false;pig.root.visible=wallet.visible=fly.visible=false;dummy.root.visible=false;};
 const OM=2*Math.PI/7.2;
 const swayP=(amp,t)=>{twP.rotation.z=amp*Math.sin(OM*t);twP.updateMatrixWorld(true);};
 const swayR=(amp,t)=>{twR.rotation.z=amp*Math.sin(OM*1.05*t);twR.updateMatrixWorld(true);};
 const swingBall=(rel,rel2=0)=>{ball.pivot.rotation.z=rel;ball.pivot.rotation.x=rel2;};
 // chair and dummy
 const chairL=toLocal(twP,W3(set.chair));dummy.root.position.set(chairL[0],chairL[1],chairL[2]);dummy.root.rotation.y=Math.PI;
 const mugHome=set.mug.position.clone(),mugParent=set.mug.parent;
 const crowdPlace=(i,n)=>[TR[0]-20+i*(26/Math.max(1,n-1)),0,TR[2]+25.8+((i*37)%5-2)*.2];
 // ---------------- the camera: piecewise smooth keys; a segment may start with a dissolve (d:true)
 const SEG=[];const seg=(t0,t1,keys,o={})=>SEG.push({t0,t1,keys,...o});
 const camAt=(t,foc)=>{let s=SEG[0];for(const g of SEG)if(t>=g.t0)s=g;
  if(s.face&&foc){const u=sm(ph(t,s.t0,s.t1)),L=(r)=>lerp(r[0],r[1],u),yaw=foc.yaw+L(s.face.rot),f=F(yaw),dd=L(s.face.d);return {position:[foc.p[0]+f[0]*dd,foc.p[1]+L(s.face.h),foc.p[2]+f[2]*dd],target:[foc.p[0],foc.p[1]-.04,foc.p[2]],fov:L(s.face.f),seg:s};}
  const K=s.keys.length?s.keys:[{t:s.t0,p:[0,2,10],g:[0,2,0],f:40}];let i=0;for(let k=0;k<K.length-1;k++)if(t>=K[k].t)i=k;
  const a=K[i],b=K[Math.min(K.length-1,i+1)],u=a===b?0:sm(ph(t,a.t,b.t));
  return {position:lerpA(a.p,b.p,u),target:lerpA(a.g,b.g,u),fov:lerp(a.f,b.f,u),seg:s};};
 const k_=(t,p,g,f=46)=>({t,p,g,f});
 const HOOKX=TP[0],HOOKZ=CR[2],Lw=cw.lever.getWorldPosition(new THREE.Vector3()).toArray();
 const cabY=(t)=>lerp(.25,70,sm(ph(t,32.4,36.2)));
 const FC=(d,rot,f,h)=>({d,rot,f,h});   // a face camera: distance (m) from the face, turn from the way he faces (rad), lens, height above the face
 // b1: low at the crane, the lens tilts up with the ball as it is hauled (ball centre rises from about 17 m to 31 m)
 seg(0,3.2,[k_(0,[HOOKX+6,1.5,HOOKZ+15],[HOOKX,15,HOOKZ],54),k_(1.6,[HOOKX+6.5,1.6,HOOKZ+16],[HOOKX,21.5,HOOKZ],54),k_(3.2,[HOOKX+5,2.2,HOOKZ+18],[HOOKX,28.5,HOOKZ],52)],{sub:.34});
 // b2: pull-back from the end of b1 (low, so the ground stays in the foreground), then Pete's face for the line about tomorrow
 seg(3.2,5.2,[k_(3.2,[HOOKX+5,2.2,HOOKZ+18],[HOOKX,28.5,HOOKZ],52),k_(4.1,[HOOKX+7,3.5,HOOKZ+34],[HOOKX,30,TP[2]],40),k_(5.2,[HOOKX+10,3,HOOKZ+44],[HOOKX+1,34,TP[2]],34)],{sub:.34});
 seg(5.2,6.4,[],{d:true,face:FC([3.42,3.3],[.25,.05],[32,32],[.05,.05])});
 seg(6.4,9.4,[],{d:true,face:FC([3.42,3.3],[.2,.05],[32,32],[.05,0])});
 seg(9.4,11.2,[],{d:true,face:FC([3.42,3.3],[.5,.9],[32,32],[.2,.3])});
 seg(11.2,13.2,[k_(11.2,[TR[0]-8.5,87.6,TR[2]+6.0],[TR[0]+.5,84.8,TR[2]-.5],52),k_(13.2,[TR[0]-4,88.0,TR[2]+7.0],[TR[0]+2.5,84.6,TR[2]-.5],48)],{d:true,subjAt:[TR[0]+.5,86.1,TR[2]]});
 // b5: night wind test, side-on at ball level (the ball hangs in the floors below the top slab, which hides it from above), pushing in
 seg(13.2,15.4,[k_(13.2,[TP[0]+4,67,TP[2]+24],[TP[0]-.5,66,TP[2]],46),k_(15.4,[TP[0]+3,66.5,TP[2]+17],[TP[0]-.8,65.5,TP[2]],44)],{d:true});
 seg(15.4,17,[k_(15.4,[TP[0]+30,3,TP[2]+78],[TP[0],40,TP[2]],54),k_(17,[TP[0]+18,3.4,TP[2]+72],[TP[0],47,TP[2]],48)],{d:true});
 seg(17,19.4,[],{d:true,face:FC([3.5,3.1],[-2.05,-1.4],[32,32],[.3,.2])});
 seg(19.4,21,[k_(19.4,[TP[0]+.6,61.4,TP[2]+8.4],[TP[0]-3.4,61.2,TP[2]+1.0],50),k_(21,[TP[0]+.2,61.5,TP[2]+7.0],[TP[0]-3.4,61.0,TP[2]+1.0],42)],{d:true});
 seg(21,23.5,[],{d:true,face:FC([3.42,3.3],[0,-.2],[32,32],[0,0])});
 // b8: side-on to Rex at the crank: his profile, the crank handle going round and the drum beside him (cranking the winch is the gag)
 seg(23.5,26.2,[k_(23.5,[TP[0]-1.4,69.6,-.7],[TP[0]-4.5,68.9,-1.5],44),k_(26.2,[TP[0]-1.9,69.6,-.55],[TP[0]-4.5,68.9,-1.5],40)],{d:true});
 seg(26.2,27.4,[],{d:true,face:FC([3.4,3.2],[.5,.3],[32,32],[.05,.05])});   // Rex grins and tiptoes off (foc follows him)
 seg(27.4,29,[k_(27.4,[TP[0]-2.2,62.6,TP[2]+6.5],[TP[0],59.8,TP[2]],54),k_(29,[TP[0]+1.6,61.8,TP[2]+6.4],[TP[0],59.8,TP[2]],50)],{d:true,sub:.5});
 // b9: high crane shot down the queue (29-30.6), then the kids' faces
 seg(29,30.6,[k_(29,[TR[0]-24,30,TR[2]+66],[TR[0]-6,6,TR[2]+24],44),k_(30.6,[TR[0]-18,24,TR[2]+58],[TR[0]-5,5,TR[2]+24],40)],{d:true});
 seg(30.6,32,[],{d:true,face:FC([3.42,3.3],[.2,0],[32,32],[.1,.1])});
 // b10: close side track up the glass lifts, easing in as they rise: Rex's lift first (cab 0.25 to 70 m, 32.4-36.2), then Pete's (4 to 56 m, 32.4-36.4)
 seg(32,34.4,[],{d:true,face:FC([3.4,3.1],[-.6,-.2],[32,32],[.3,.3])});   // follows Rex's head up in his cab (foc)
 seg(34.4,36.4,[],{d:true,face:FC([3.4,3.1],[1.1,.9],[32,32],[.4,.4])});   // follows Pete's head up in his lift (foc)
 // b11: the lift stops at floor 16 and Pete sees the ball hanging deep: from outside, looking across his lift to the ball (inside the cab the blue panels and the floor-16 landing hide it), pushing in
 seg(36.4,38.6,[k_(36.4,[-27,58.5,24],[-20.4,59.6,3.5],52),k_(38.6,[-26,58.8,21],[-21.8,60.2,2.5],50)],{d:true});
 seg(38.6,40.6,[],{d:true,face:FC([3.5,2.8],[1.3,1.0],[32,32],[.05,.05])});   // then Pete's face as the ball arrives
 seg(40.6,43.3,[],{d:true,face:FC([3.42,3.3],[.2,-.2],[32,32],[.1,.1])});
 seg(43.3,46.4,[k_(43.3,[TP[0]+26,3,TP[2]+78],[TP[0],46,TP[2]],40),k_(46.4,[TP[0]+14,3,TP[2]+74],[TP[0],54,TP[2]],36)],{d:true,sub:.5});
 // b13: ghost replay parallel to the rope, at ball level from outside, pulling back to the wide exterior at 52 s
 seg(46.4,52,[k_(46.4,[TP[0]+2.5,66,TP[2]+16],[TP[0]-.8,65,TP[2]],46),k_(49,[TP[0]+8,66,TP[2]+26],[TP[0]-1,65.5,TP[2]],44),k_(52,[TP[0]+20,66,TP[2]+34],[TP[0],64,TP[2]],42)],{d:true,sub:.75});
 seg(52,56,[],{d:true,face:FC([3.42,3.3],[.3,0],[32,32],[.05,.1])});
 seg(56,60,[k_(56,[TR[0]-12,2.0,TR[2]+34],[TR[0],22,TR[2]],54),k_(60,[TR[0]-8,2.0,TR[2]+30],[TR[0],8,TR[2]+10],50)],{d:true});
 seg(60,63.5,[],{d:true,face:FC([3.42,3.3],[.35,0],[32,32],[0,0])});
 // ---------------- the world state at time t
 const fling=(lt,a,b)=>{ // dummy thrown out of the chair between lt a..b and back
  const k=ph(lt,a,a+.5),r=ph(lt,b,b+.9);return {k,r,on:lt>=a};};
 function state(t){GRIPS.length=0;REACH=0;for(const m of peteTransoms)m.visible=true;for(const m of peteGlass)m.visible=true;
  hideAll();
  const i=A.findIndex((a,k)=>t>=a&&t<A[k+1]),lt=t-A[i];
  const night=t>=A[4]&&t<A[8];
  hz.day.root.visible=!night;hz.night.root.visible=night;
  swayP(0,t);swayR(.003,t);swingBall(0,0);pool.water.scale.set(1,1,1);twR.rotation.z=0;
  swing.swing1.rotation.x=0;swing.swing2.rotation.x=0;pool.water.rotation.z=0;pool.water.position.y=-.1;cw.spin(0);cw.pull(0);cw.setDrop(0);set.curtain.rotation.set(0,0,0);set.windowFrame.rotation.set(0,0,0);set.sign.rotation.set(0,0,0);haul.pivot.rotation.set(0,0,0);
  const rope=t<A[5]+1.6?ROPE[0]:t<A[7]?lerp(ROPE[0],ROPE[1],sm(ph(t,A[5]+1.6,A[5]+3.4))):t<A[8]?lerp(ROPE[1],ROPE[2],sm(ph(t,A[7]+.4,A[7]+3.4))):ROPE[2];
  ball.root.visible=true;cw.crane.visible=t<6.6||(t>=26.2&&t<29);cw.hookBlock.visible=cw.hoistRope.visible=!(t>=26.2&&t<29);for(const dp of ball.dampers)dp.visible=!(t>=17&&t<21);
  ball.setRope(rope);pete.setPlug(16,t<A[5]+1.9);
  pete.setElevator(4);rex.carA.position.y=.25;rex.carB.position.y=.25;
  sign.visible=t<A[7];bunch.visible=t>=A[8];bannerG.visible=t>=A[8];sadBalloon.visible=t>=A[8];
  barriers.forEach(b=>b.visible=t>=A[8]);barriers2.forEach(b=>b.visible=t>=A[8]);
  lampBall.intensity=night?70:0;lampInt.intensity=night?(t<A[7]&&t>=A[4]?55:40):0;lampLow.intensity=night&&t>=A[5]&&t<A[7]?50:0;
  mugParent.add(set.mug);set.mug.position.copy(mugHome);set.sign.visible=false;set.drill.visible=false;set.curtain.visible=false;set.windowFrame.visible=false;
  winch.visible=true;
  const swayBall=(amp,rel,w=1)=>{swayP(amp,t);swingBall(rel*Math.sin(OM*w*t+.9));};
  let foc=null;const Pete16=()=>PW(twP,[-3.7,SLAB(16)+.02,1.2]);
  switch(i){
   case 0:{ // Pete hauls the golden ball up the tower's side
    const y=lerp(12,26,sm(ph(t,0,3.2)));cw.setDrop(49.9-(y+3.6));ball.root.visible=false;haul.root.visible=true;
    const sw=t<1.7?0:.17*Math.sin(Math.min(1,(t-1.7)/.9)*Math.PI*.5)*Math.exp(-(t-1.7)*.6);
    haul.root.position.set(TP[0],y+4.8,HOOKZ-.15-sw*3);haul.pivot.rotation.x=sw*.4;
    cw.pull(.1+.25*Math.sin(t*3));
    const lp=HOLDN('pete-lever',hero,0,cw.lever,/^lever[ _]grip[ _]handle/),lp2=HOLDN('pete-lever-low',hero,1,cw.lever,/^lever[ _]grip[ _]dome/),ppos=near([Lw[0]+.55,0,Lw[2]+.5],lp,.4);
    standing(hero,ppos,yawTo(ppos,lp),faceAt(t,[[0,'determined'],[1.7,'effort'],[2.2,'shock'],[3,'ugh']]),t,1,{lean:.25*Math.exp(-lt*.4),hands:[lp,lp2]});
    foc={p:[ppos[0],1.62,ppos[2]],yaw:yawTo(ppos,lp)};
    pig.root.visible=true;if(t>2.1){pig.set(true);pig.root.position.set(TP[0]-3,lerp(12,6,ph(t,2.1,3.2)),TP[2]+6.8);pig.root.rotation.set(0,0,Math.PI*ph(t,2.1,3.2));}else{pig.set(false);pig.root.position.set(TP[0]-3,12,TP[2]+6.4);pig.root.rotation.set(0,0,0);}
    break;}
   case 1:{
    const y=lerp(26,50,sm(ph(t,3.2,5.2)));cw.setDrop(49.9-(y+3.6));cw.pull(.4);
    if(t<4.6){ball.root.visible=false;haul.root.visible=true;haul.root.position.set(TP[0],y+4.8,HOOKZ);haul.pivot.rotation.x=0;}else{ball.root.visible=true;}
    const lp=HOLDN('pete-lever',hero,0,cw.lever,/^lever[ _]grip[ _]handle/),lp2=HOLDN('pete-lever-low',hero,1,cw.lever,/^lever[ _]grip[ _]dome/),ppos=near([Lw[0]+.55,0,Lw[2]+.5],lp,.4);
    standing(hero,ppos,yawTo(ppos,lp),faceAt(t,[[A[1],'proud'],[A[1]+1.5,'grin']]),t,1,{hands:[lp,lp2]});
    crowd.slice(16,22).forEach((a,k)=>{const cp=[TR[0]-6+k*2.6,0,TR[2]+27+(k%2)*1.4];a.pose(crowdPose({x:cp[0],z:cp[2]},t,k%2?'laugh':'clap',k+3,[TR[0]+2,0,TR[2]+20]));});
    const rp=[TR[0]+2,0,TR[2]+20];foc={p:[rp[0],1.68,rp[2]],yaw:Math.PI};standing(rexA,rp,Math.PI,faceAt(t,[[A[1],'smug'],[A[1]+1.4,'smirk']],5),t,5,{hands:[{torso:[-.14,.42,.3]},{torso:[.3+.12*Math.sin(t*9),.38,.36]}],headPitch:.1,headRoll:.12});
    break;}
   case 2:{
    wallet.visible=true;fly.visible=true;
    const ppos=[TP[0]+1.4,0,TP[2]+9.4],ft=[TP[0]+1.4,1.3,TP[2]+9.8];wallet.position.set(...ft);wallet.rotation.set(0,Math.PI,0);const w1=HOLD('pete-wallet',hero,0,wallet,[0,0,0]),w2=HOLD('pete-wallet-edge',hero,1,wallet,[-.14,.05,0]);standing(hero,ppos,0,faceAt(t,[[A[2],'proud'],[A[2]+1.1,'sad'],[A[2]+2.2,'tired']]),t,1,{hands:[w1,w2],headPitch:.05});
    foc={p:[ppos[0],1.62,ppos[2]],yaw:0};fly.position.set(ft[0]+.1+.3*Math.sin(t*5),ft[1]+.25+.1*Math.sin(t*7),ft[2]+.1+.2*Math.cos(t*5));
    break;}
   case 3:{
    const ts=ph(lt,0,1.2),tj=ph(lt,1.2,2.6),bx=-7.2,tipx=-2.9;
    const x=lt<1.2?lerp(bx,tipx,sm(ts)):lerp(tipx,tipx+4.5,tj),y=lt<1.2?86.65:86.65+1.1*Math.sin(Math.min(1,tj*1.2)*Math.PI)-3.1*tj*tj*tj;
    const rp=PW(twR,[x,0,0]);rp[1]=Math.max(84.6,y);
    rexA.pose({pos:rp,yaw:Math.PI/2,lean:lt<1.2?0:lerp(0,1.35,sm(tj)),face:faceAt(t,[[A[3],'smug'],[A[3]+1.2,'joy']],5),hands:lt<1.2?[idleL,idleR]:[at(rp,Math.PI/2,-.1,1.8,.3),at(rp,Math.PI/2,.1,1.8,.3)]});
    pool.water.rotation.z=.01*Math.sin(t*2);foc={p:[rp[0],rp[1]+1.68,rp[2]],yaw:Math.PI/2};
    break;}
   case 4:{
    const f=fling(lt,1.15,2.7);swayBall(.019*sm(ph(lt,.3,1.2)),.2*sm(ph(lt,.2,1.0)),1.18);
    dummy.root.visible=true;dummy.seated(.46);
    if(f.on&&f.r<1){const e=f.k*(1-f.r);dummy.root.position.set(chairL[0]+2.6*sm(f.k)*(1-f.r),chairL[1]+1.6*Math.sin(f.k*Math.PI)*(1-f.r),chairL[2]);dummy.root.rotation.set(0,Math.PI,-1.2*e+.5*Math.sin(f.k*5)*(1-f.r));}
    else{dummy.root.position.set(chairL[0],chairL[1],chairL[2]);dummy.root.rotation.set(0,Math.PI,0);}
    if(f.r>=1){dummy.root.rotation.z=.12*Math.sin(t*3);const dl2=dummy.root.position;set.curtain.visible=true;set.windowFrame.visible=true;const cl=toLocal(set.root,[dl2.x+TP[0]*0+0,dl2.y+1.1,dl2.z]);const cl2=toLocal(set.root,[dl2.x,dl2.y+1.25,dl2.z]);set.curtain.position.set(cl[0],cl[1]+.9,cl[2]);set.windowFrame.position.set(cl2[0],cl2[1],cl2[2]);set.windowFrame.rotation.set(Math.PI/2,0,0);}
    break;}
   case 5:{ // night: Pete drills through the floor and lets the rope out
    swayBall(.004,.05,1);
    const hole=PW(twP,[-3.5,SLAB(16)+.02,.4]),pp=near(Pete16(),hole,.38);
    const dz=lt<1.9?.12*Math.sin(t*38):0;
    set.drill.visible=true;const dl=toLocal(set.root,[hole[0]+dz*.2,hole[1]+.35,hole[2]]);set.drill.position.set(dl[0],dl[1],dl[2]);set.drill.rotation.set(0,0,0);const d1=HOLDN('pete-drill',hero,0,set.drill,/^drill[ _]handle[ _]grip/,.09),d2=HOLDN('pete-drill-2',hero,1,set.drill,/^drill[ _]gearbox/,.09);standing(hero,pp,yawTo(pp,hole),faceAt(t,[[A[5],'determined'],[A[5]+1.8,'effort'],[A[5]+2.2,'shock'],[A[5]+3.2,'ugh']]),t,1,{lean:.4+(lt<1.9?.05*Math.sin(t*30):0),headYaw:.25*Math.sin(t*1.7),hands:[d1,d2]});foc={p:[pp[0],pp[1]+1.32,pp[2]],yaw:yawTo(Pete16(),PW(twP,[-1.4,SLAB(16)+.02,.4]))};
    break;}
   case 6:{
    swayBall(.004,.05,1);
    const pp=Pete16(),camTo=PW(twP,[-3.4,SLAB(16)+1.4,6.8]);
    standing(hero,pp,0,faceAt(t,[[A[6],'think'],[A[6]+1.2,'smirk'],[A[6]+1.6,'deadpan']]),t,1,{hands:[at(pp,0,-.3,1.35,.3),at(pp,0,.3,1.35,.3)]});
    foc={p:[pp[0],pp[1]+1.62,pp[2]],yaw:0};
    set.sign.visible=true;const sl=toLocal(set.root,at(pp,0,0,1.3,.5));set.sign.position.set(sl[0],sl[1],sl[2]);set.sign.rotation.set(0,0,lt>1.3?Math.PI:0);
    break;}
   case 7:{ // night: Rex sneaks in and cranks the winch; the ball sinks to exactly the right length
    swayBall(.003,lt<3?.1:.16,lt<3?1:1);
    cw.spin(lt*5);const wp=W3(winch);
    // the handle goes round in a circle: Rex rocks with it (steps to its side, bends to its height) so his hand stays on it
    const hw=gripPoint({node:nodeOf(cw.crank,/^crank[ _]handle[ _]grip/)}).toArray(),fl=PW(twP,[-3.2,SLAB(18)+.02,.9])[1];
    const rpos=[hw[0]-.05,fl,hw[2]-.44],crk=Math.max(0,Math.min(.55,.8*rexA.scale-(hw[1]-fl)+.1)); // standing shoulder is about .8 x scale above the floor
    foc={p:[rpos[0],rpos[1]+1.62-crk,rpos[2]],yaw:yawTo(rpos,wp)};
    if(lt<2.7){const cp=HOLDN('rex-crank',rexA,0,cw.crank,/^crank[ _]handle[ _]grip/),cp2=HOLDN('rex-crank-2',rexA,1,cw.crank,/^crank[ _]handle[ _]grip/);standing(rexA,rpos,yawTo(rpos,wp),faceAt(t,[[A[7],'smug'],[A[7]+1.2,'smirk']],5),t,5,{lean:0,crouch:crk,hands:[cp,cp2]});}
    else{const dx=lerp(0,-3.6,sm(ph(lt,2.7,5.4))),p=[TP[0]-1.4+dx,0,TP[2]+10.2];standing(rexA,p,Math.PI*.5,faceAt(t,[[A[7]+2.7,'smug']],5),t,5,{feet:undefined});foc={p:[p[0],p[1]+1.62,p[2]],yaw:Math.PI*.5};}
    break;}
   case 8:{ // bright morning: the town queues at Rex's pool tower
    swayBall(.004,.12,1);
    const n=16;crowd.slice(0,n).forEach((a,k)=>{const p=crowdPlace(k,n),tg=[TR[0],0,TR[2]+8];const o=crowdPose({x:p[0],z:p[2]},t,k%3===0?'point':k%3===1?'cheer':'idle',k,tg);a.pose(o);});
    {const kp=crowdPlace(3,n);foc={p:[kp[0],1.28,kp[2]],yaw:Math.atan2(TR[0]-kp[0],TR[2]+8-kp[2])};}
    rexS.pose({pos:[TR[0]+3,0,TR[2]+11.5],yaw:Math.PI*.4,face:faceAt(t,[[A[8],'proud']],5),hands:[idleL,{torso:[.3,.6,.1]}]});
    break;}
   case 9:{ // Rex rides his lift up first; Pete steps into his
    for(const m of peteTransoms)m.visible=false;for(const m of peteGlass)m.visible=false;
    swayBall(.004,.12,1);
    const cy=cabY(t);rex.carA.position.y=cy;pete.setElevator(lerp(4,56.1,sm(ph(t,32.4,36.4))));
    const cab=W3(rex.carA,[0,.02,0]);standing(rexS,cab,0,faceAt(t,[[A[9],'smug'],[A[9]+2,'joy']],5),t,5,{hands:[idleL,{torso:[.3,.75+.08*Math.sin(t*8),.1]}],headYaw:.35*Math.sin(t*2.1),headRoll:.08*Math.sin(t*3.3),lean:.05*Math.sin(t*2.7)});
    const pc=W3(pete.elevator,[0,.02,0]);standing(hero,pc,-Math.PI/2,faceAt(t,[[A[9],'neutral'],[A[9]+2.2,'scared']]),t,1,{hands:[at(pc,-Math.PI/2,-.1,1.0,.25),idleR]});
    {const hp=at(pc,-Math.PI/2,-.1,1.0,.25);ctx.scene.add(set.mug);set.mug.position.set(...hp);}
    foc=t<34.4?{p:[cab[0],cab[1]+1.65,cab[2]],yaw:0}:{p:[pc[0],pc[1]+1.62,pc[2]],yaw:0}; // the camera follows Rex's head, then Pete's
    break;}
   case 10:{ // inside Pete's lift: the tower leans, the ball hangs deep and swings slowly
    for(const m of peteGlass)m.visible=false;
    swayBall(.004,.16*sm(ph(lt,.2,1.2)),1);
    pete.setElevator(56.1);const pc=W3(pete.elevator,[0,.02,0]);
    standing(hero,pc,-Math.PI/2,faceAt(t,[[A[10],'scared'],[A[10]+2,'gasp']]),t,1,{hands:[at(pc,-Math.PI/2,-.1,1.0,.3),idleR],lean:.05+.04*Math.sin(t*6),headYaw:.4*Math.sin(t*1.9),headRoll:.1*Math.sin(t*4.1),sway:.05*Math.sin(t*5)});ctx.scene.add(set.mug);set.mug.position.set(...at(pc,-Math.PI/2,-.1,1.0,.3));foc={p:[pc[0],pc[1]+1.62,pc[2]],yaw:-Math.PI/2};
    break;}
   case 11:{ // the swing: pushed in time it flies, pushed back it stops
    swayBall(.004,.16,1);
    const push=lt<1.5?1:lt<2.3?1.2:0;const amp=lt<1.5?lerp(.15,.5,ph(lt,0,1.5)):lt<2.3?.55:.55*(1-sm(ph(lt,2.3,2.7)))+.35*sm(ph(lt,2.3,2.7))*(1-ph(lt,2.7,3.6));
    const a=lt<2.3?amp*Math.sin(lt*3.2):.35*Math.sin(2.3*3.2)*(1-ph(lt,2.3,2.6));
    swing.swing1.rotation.x=a;swing.root.updateMatrixWorld(true);
    const seat=W3(swing.swing1,[0,-1.95,0]);
    foc={p:[seat[0],seat[1]+.66,seat[2]],yaw:Math.PI};
    girl.pose({pos:[seat[0],seat[1]-.02,seat[2]],yaw:Math.PI,crouch:.2,lean:-a*.3,face:faceAt(t,[[A[11],'joy']],4),feet:[at(seat,Math.PI,-.1,-.32,.1),at(seat,Math.PI,.1,-.32,.1)],hands:[HOLD('girl-chain-L',girl,0,swing.swing1,[-.28,-1.3,0],.08),HOLD('girl-chain-R',girl,1,swing.swing1,[.28,-1.3,0],.08)]});
    const pushing=lt<1.9,dp=[seat[0]+(pushing?0:.1),0,seat[2]+(pushing?.8:-.55)],dzz=pushing?-.3:.3; // the swing set's local z points away from the girl's back (its group is turned half a circle)standing(dad,dp,pushing?Math.PI:0,faceAt(t,[[A[11],'grin'],[A[11]+2,'laugh']],6),t,6,{hands:[HOLD(pushing?'dad-push-L':'dad-stop-L',dad,0,swing.swing1,[-.2,-1.0,dzz],.1),HOLD(pushing?'dad-push-R':'dad-stop-R',dad,1,swing.swing1,[.2,-1.0,dzz],.1)]});
    break;}
   case 12:{ // ghost replay: the short rope flings the dummy, the long rope lands it
    const bad=lt<2.6;const rel=bad?.2*Math.sin(OM*1.18*t+.9):.16*Math.sin(OM*t+.9);
    swayP(bad?.019:.004,t);swingBall(rel,bad?.08*Math.sin(OM*1.7*t):0);ball.setRope(bad?ROPE[0]:ROPE[2]);
    dummy.root.visible=true;dummy.seated(.46);
    const f=fling(lt,1.0,2.0);
    if(bad&&f.on&&f.r<1){const e=f.k*(1-f.r);dummy.root.position.set(chairL[0]+2.6*sm(f.k)*(1-f.r),chairL[1]+1.6*Math.sin(f.k*Math.PI)*(1-f.r),chairL[2]);dummy.root.rotation.set(0,Math.PI,-1.2*e+.5*Math.sin(f.k*5)*(1-f.r));}
    else{dummy.root.position.set(chairL[0],chairL[1],chairL[2]);dummy.root.rotation.set(0,Math.PI,0);}
    break;}
   case 13:{ // coffee does not spill
    swayBall(.004,.16,1);
    const dp=PW(twP,[-3.7,SLAB(18)+.02,5.2]);dummy.root.visible=false;
    const d=W3(set.desk),pp=[d[0]+1.5,d[1],d[2]+.9],sip=ph(lt,2.0,3.0);
    // the mug stays within arm's reach (the arm is about .54 long, the shoulder about .85 up) and above the caption band
    foc={p:[pp[0],pp[1]+1.62,pp[2]],yaw:0};const mp=at(pp,0,-.12,1.12+.22*sm(sip),.2);if(lt>1.6){ctx.scene.add(set.mug);set.mug.position.set(...mp);set.mug.updateMatrixWorld(true);const hc=gripPoint({node:nodeOf(set.mug,/^mug[ _]handle/)});set.mug.position.add(V(mp[0]-hc.x,mp[1]-hc.y,mp[2]-hc.z));}standing(hero,pp,0,faceAt(t,[[A[13],'smirk'],[A[13]+2,'relief']]),t,1,{hands:[lt>1.6?HOLDN('pete-mug',hero,0,set.mug,/^mug[ _]handle/,.09):mp,idleR]});
    break;}
   case 14:{ // Rex's tower with no ball: the sway grows and the pool slops over
    const g=sm(ph(lt,0,3.4)),amp=lerp(.004,.03,g);swayR(amp,t);
    const sl=Math.sin(OM*1.05*t);pool.water.rotation.z=-.22*sl*g;pool.water.position.y=-.1;
    if(lt>2.6){pool.water.scale.set(1,1,1-.9*sm(ph(lt,2.6,3.6)));}
    const n=16;crowd.slice(0,n).forEach((a,k)=>{const p=crowdPlace(k,n);a.pose(crowdPose({x:p[0],z:p[2]},t,lt>2?'gasp':'point',k,[TR[0],70,TR[2]+8]));});
    rexS.pose({pos:[TR[0]-1,0,TR[2]+9.4],yaw:Math.PI*.5,face:faceAt(t,[[A[14],'proud'],[A[14]+2.4,'shock']],5),hands:[idleL,idleR],headPitch:-.3});
    break;}
   case 15:{ // Rex soaked and seasick, Pete winks in the background
    swayR(.012*Math.max(0,1-lt/3),t);
    crowd.slice(0,16).forEach((a,k)=>{const p=[TR[0]-7+k*.9,0,TR[2]+22.1+(k%2)*.9];a.pose(crowdPose({x:p[0],z:p[2]},t,k%3===0?'laugh':k%3===1?'point':'cheer',k,[TR[0]+.2,0,TR[2]+20]));});
    const rp=[TR[0]+.2,0,TR[2]+20];foc={p:[rp[0],1.68,rp[2]],yaw:Math.PI};rexS.pose({pos:rp,yaw:Math.PI,lean:.08*Math.sin(t*2.4),sway:.1*Math.sin(t*2.4),crouch:.05+.03*Math.abs(Math.sin(t*2.4)),face:faceAt(t,[[A[15],'ugh'],[A[15]+1.4,'tired']],5),hands:[idleL,idleR]});
    const pp=[TR[0]+6.5,0,TR[2]+23.5];standing(hero,pp,Math.PI*1.05,faceAt(t,[[A[15],'smirk'],[A[15]+1.6,'joy']]),t,1,{hands:[at(pp,Math.PI,-.1,1.1,.2),idleR]});
    fx.update(t);
    break;}
   default:break;
  }
  fx.update(t);
  return {i,lt,night,foc};
 }
 const DISS=.4;
 // What each key moment must show (storyboard camera and action). Checked on every frame of the window: the shown things are visible, in frame,
 // big enough and not hidden; the primary one sits in the title-safe middle. studio2/intent-sheet.py draws the result for a person to look at.
 const INTENTS=[
  {t0:.4,t1:3.0,id:'b1-ball-hauled',primary:'ball',show:['ball']},
  {t0:3.8,t1:5.1,id:'b2-tower-scale',primary:'tower',show:['tower']},
  {t0:6.9,t1:9.0,id:'b3-pete-wallet',primary:'hero',show:['hero','wallet']},
  {t0:9.9,t1:12.8,id:'b4-rex-tower',primary:'rexTower',show:['rexTower']},
  {t0:13.8,t1:16.6,id:'b5-night-test',primary:'ball',show:['ball']},
  {t0:17.5,t1:20.6,id:'b6-drilling',primary:'hero',show:['hero']},
  {t0:21.4,t1:23.2,id:'b7-i-think',primary:'hero',show:['hero']},
  {t0:24.0,t1:26.0,id:'b8-rex-cranks',primary:'rex',show:['rex','crank']},
  {t0:29.5,t1:30.5,id:'b9-queue',primary:'rexTower',show:['rexTower']},
  {t0:32.6,t1:34.2,id:'b10a-rex-lift',primary:'rexCar',show:['rexCar']},
  {t0:34.8,t1:36.2,id:'b10b-pete-lift',primary:'peteCar',show:['peteCar']},
  {t0:36.9,t1:38.5,id:'b11-pov-ball',primary:'ball',show:['ball']},
  {t0:41.0,t1:43.1,id:'b12a-swing',primary:'girl',show:['girl']},
  {t0:44.0,t1:46.2,id:'b12b-whip-up-tower',primary:'tower',show:['tower']},
  {t0:46.8,t1:51.6,id:'b13-ghost-replay',primary:'ball',show:['ball']},
  {t0:52.5,t1:55.6,id:'b14-coffee',primary:'mug',show:['mug']},
  {t0:56.5,t1:59.6,id:'b15-rex-tower-sways',primary:'rexTower',show:['rexTower']},
  {t0:60.5,t1:63.2,id:'b16-rex-soaked',primary:'rex',show:['rex']}];
 for(const it of INTENTS)it.show=it.show.map(n=>typeof n==='string'?{name:n}:n);
 const trackNow=()=>{const O=(o)=>({obj:o});return {ball:O(haul.root.visible?haul.root:ball.root),hero:O(hero.root),rex:O(rexA.root.visible?rexA.root:rexS.root),tower:{obj:twP,big:true},rexTower:{obj:twR,big:true},wallet:O(wallet),mug:O(set.mug),winch:O(winch),crank:O(nodeOf(cw.crank,/^crank[ _]handle[ _]grip/)),dummy:O(dummy.root),girl:O(girl.root),dad:O(dad.root),peteCar:{p:W3(pete.elevator,[0,1.2,0]),r:1.4}, // the cab only (the elevator group includes the whole shaft)
  rexCar:O(rex.carA)};};
 function update(t,opt={}){
  const c0=camAt(t);let dk;
  if(c0.seg.d&&t<c0.seg.t0+DISS&&c0.seg.t0>0)dk=dissolveK(t,c0.seg.t0,DISS);
  const te=(opt.outgoing&&dk!==undefined)?c0.seg.t0-.02:t,st=state(te),c=camAt(te,st.foc);
  const atmKey=st.night?'night':te<A[4]?'day':'morning',a=ATM[atmKey];
  const cam0={position:[c.position[0]+.05*Math.sin(te*1.3),c.position[1]+.04*Math.sin(te*1.7),c.position[2]],target:c.target,fov:c.fov};
  // captions sit at about 0.69 of the frame height: aim a little low so the subject (face, key object) rides in the upper half and the caption crosses the body or the ground
  const ddist=Math.hypot(cam0.position[0]-cam0.target[0],cam0.position[1]-cam0.target[1],cam0.position[2]-cam0.target[2]),fh=2*ddist*Math.tan(cam0.fov*Math.PI/360),lift=(c.seg.face?.2:.11)*fh;
  const cam={position:cam0.position,target:[cam0.target[0],cam0.target[1]-lift,cam0.target[2]],fov:cam0.fov};
  const dist=Math.hypot(cam.position[0]-cam.target[0],cam.position[1]-cam.target[1],cam.position[2]-cam.target[2]),hd=Math.hypot(cam.position[0]-cam.target[0],cam.position[2]-cam.target[2]),frac=c.seg.sub??(dist>20?Math.min(.75,15/Math.max(hd,1)):.14),subj=c.seg.subjAt?c.seg.subjAt:((c.seg.face||c.seg.subFoc)&&st.foc)?st.foc.p:[0,1,2].map(k=>cam.target[k]+(cam.position[k]-cam.target[k])*frac);
  return {camera:{...cam,far:900,...a,skyLow:a.sky[0],skyHigh:a.sky[1],...coverDof(cam.position,cam.target,{strength:0}),saturation:1.5,night:st.night?1:0,subject:subj},subject:subj,blur:(te>=32.8&&te<=34.6)?.035:0,reach:REACH,grips:GRIPS.map(g=>{const gp=gripPoint(g);return {id:g.id,err:gp.distanceTo(g.actor.hand(g.j)),tol:g.tol,at:gp.toArray().map(v=>+v.toFixed(2))};}),track:trackNow(),intent:INTENTS.find(x=>te>=x.t0&&te<=x.t1),note:'beat '+(st.i+1)+(globalThis.__dbg?' '+JSON.stringify(globalThis.__dbg()):''),dissolveK:opt.outgoing?undefined:dk};
 }
 globalThis.__dbg=()=>({chair:toLocal(twP,W3(set.chair)).map(v=>+v.toFixed(2)),desk:toLocal(twP,W3(set.desk)).map(v=>+v.toFixed(2)),win:toLocal(twP,W3(set.windowFrame)).map(v=>+v.toFixed(2)),curtain:toLocal(twP,W3(set.curtain)).map(v=>+v.toFixed(2)),winch:toLocal(twP,W3(winch)).map(v=>+v.toFixed(2)),dummy:dummy.root.position.toArray().map(v=>+v.toFixed(2)),elev:toLocal(pete.root,W3(pete.elevator)).map(v=>+v.toFixed(2)),mug:toLocal(twP,W3(set.mug)).map(v=>+v.toFixed(2)),core:0});
 const collide={allow:[
  ['rex','^(Water|water)',''],['rex','^(ground|plaza)',''],['pete','^station_base_plate','^shoe'],['pete','^mug_',''],['pete','^(drill_|lever_|wallet|mug_)',''],['rex','^crank_',''],
  ['(pete|rex|rex-suit)','^(ground|floor|Floor|slab|cab_floor|car_floor|floor_finish|landing_sill|plaza)',''],['crowd[0-9]+','^(ground|plaza)',''],['girl','^(swing|seat|chain|ground)',''],['dad','^(swing|seat|chain|ground)',''],
 ]};
 return {update,T,collide,beats:A};
}
