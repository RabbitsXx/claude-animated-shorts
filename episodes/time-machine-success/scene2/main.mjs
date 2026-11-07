// What If A Time Machine Actually Worked? - the whole film as pure functions of absolute time.
import {makeKit} from '/runtime/kit.js';
import {makeActorFactory} from '/runtime/actor.js';
import {makeFx} from '/runtime/fx.js';
import {key,ramp,noise} from '/runtime/tracks.js';
import {faceTrack,faceParams} from '/runtime/face.js';
import {buildMachine,buildHammer,buildWallet,buildMoth} from './props.mjs';
import {buildFigurine,buildRunway,buildToyTrain,buildOrrery,buildBinoculars,buildTracker,buildRivalRig,buildBalloons,buildStage,buildBowTie,buildWrench,buildFlag,buildLabel} from './props2.mjs';
import {buildSet} from './set.mjs';
import {INVENTOR,RIVAL,DUMMY,crowdSpec,crowdLayout} from './cast.mjs';
import {makeBeats} from './beats.mjs';
export const authored=true;
export async function build(ctx,{T,words,duration}){
 const {THREE}=ctx,kit=makeKit(ctx);
 const V=(a)=>new THREE.Vector3(...a);
 const H=.95;
 const set=buildSet(ctx,kit);
 const machine=buildMachine(ctx,kit);ctx.scene.add(machine.root);
 const hammer=buildHammer(ctx,kit);ctx.scene.add(hammer.root);
 const wallet=buildWallet(ctx,kit);ctx.scene.add(wallet.root);
 const moth=buildMoth(ctx,kit);ctx.scene.add(moth.root);
 const fx=makeFx(ctx);
 const createActor=makeActorFactory(ctx);
 const world={reach:0};
 const hash=(s)=>[...s].reduce((x,c)=>x+c.charCodeAt(0),0);
 const blinkAt=(t,seed)=>{const per=3.3+(seed%7)*.23,ph=(t+seed*.61)%per;return ph<.15?Math.sin(ph/.15*Math.PI):0;};
 const track=(a)=>{const o=a.pose,seed=hash(a.spec.name);a.pose=(p)=>{const f=faceParams(p.face);f.blink=Math.max(f.blink,blinkAt(world.t,seed));p={...p,face:f,crouch:(p.crouch||0)+.004*Math.sin(world.t*2.4+seed),sway:(p.sway||0)+.012*Math.sin(world.t*1.15+seed*.3),headRoll:(p.headRoll||0)+.02*Math.sin(world.t*.9+seed*.5)};const r=o(p);if(r.reach>world.reach){world.reach=r.reach;world.worst=a.spec.name;}return r;};return a;};
 const hero=track(createActor(INVENTOR)),rival=track(createActor(RIVAL)),dummyA=track(createActor(DUMMY)),dummyB=track(createActor({...DUMMY,name:'dummyB'}));
 const N=40,crowdPos=crowdLayout(N,{cx:3,cz:3.4,rx:7.5,rz:3.8}),crowd=crowdPos.map((p,i)=>track(createActor(crowdSpec(i))));
 // ---- model runways (A in the workshop, B at the fair), toy rail, orrery
 const runA=buildRunway(ctx,kit);runA.root.position.set(-11.3,0,-3.0);ctx.scene.add(runA.root);
 const runB=buildRunway(ctx,kit);runB.root.position.set(-9.5,0,2.2);ctx.scene.add(runB.root);
 runA.back.visible=false;runB.back.visible=false;
 const trainOrigin=new THREE.Vector3(-7.2,H,-3.0);
 const train=buildToyTrain(ctx,kit);train.root.position.copy(trainOrigin);ctx.scene.add(train.root);
 const tb=new THREE.Group();tb.position.set(-6.2,0,-3.0);kit.rbox(tb,'train table top',[0,H-.05,0],[2.4,.08,.9],.02,kit.mat(kit.M.wood,{rough:.85}));for(const x of [-1.1,1.1])for(const z of [-.38,.38])kit.rbox(tb,'train table leg',[x,(H-.05)/2,z],[.1,H-.05,.1],.02,kit.mat(kit.M.woodDark));kit.finish(tb,'prop');ctx.scene.add(tb);
 const orrery=buildOrrery(ctx,kit);orrery.root.position.set(-4.6,.9,-2.6);ctx.scene.add(orrery.root);
 const dr=new THREE.Group();dr.position.set(-4.6,0,-2.6);kit.cyl(dr,'orrery drum',[0,.45,0],.5,.55,.9,kit.mat('#6b4a2e',{rough:.9}),null,{},28);kit.finish(dr,'prop');ctx.scene.add(dr);
 const stage=buildStage(ctx,kit);stage.root.position.set(0,0,-7.2);ctx.scene.add(stage.root);
 const rivalRig=buildRivalRig(ctx,kit);rivalRig.root.position.set(14,.4,-1.4);ctx.scene.add(rivalRig.root);
 const tracker=buildTracker(ctx,kit);tracker.root.position.set(3.6,0,.6);ctx.scene.add(tracker.root);
 const balloons=buildBalloons(ctx,kit,[[-4,2.4,4],[-2.5,3.0,6],[-1,2.6,3],[1.5,3.2,5],[3,2.5,7],[5,3.4,4.5],[7,2.8,6.5],[8.5,3.1,3],[-6,3.0,2.5],[10,2.9,5],[4.2,3.6,2]]);ctx.scene.add(balloons.root);
 const figDummy=buildFigurine(ctx,kit,{body:'#f2c230',head:'#f2c230',marks:true});ctx.scene.add(figDummy.root);
 const figRival=buildFigurine(ctx,kit,{body:'#f7f1e3',bowTie:'#c4402f',scale:1});ctx.scene.add(figRival.root);
 const trainFig=buildFigurine(ctx,kit,{body:'#f2c230',head:'#f2c230',marks:true,scale:.7});ctx.scene.add(trainFig.root);
 const binos=buildBinoculars(ctx,kit);ctx.scene.add(binos.root);
 const wrench=buildWrench(ctx,kit);ctx.scene.add(wrench.root);
 const flag=buildFlag(ctx,kit);ctx.scene.add(flag.root);
 const bowTie=buildBowTie(ctx,kit);ctx.scene.add(bowTie.root);
 const mkTag=(lines,w,h,o={})=>{const g=new THREE.Group();g.name='Tag';const px=Math.round(512*h/w),tex=kit.signTexture(lines,{w:512,h:px,bg:o.bg||'#f3e6c8',fg:o.fg||'#2a2326',border:'#2a2326',size:o.size||Math.round(px*.56)});const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.userData.noOutline=true;m.userData.basic=true;m.name='tag';g.add(m);ctx.scene.add(g);return {root:g,w,h};};
 const tags={earth:mkTag(['EARTH'],.15,.05),dist1:mkTag(['107,208 km'],.34,.1),dist2:mkTag(['2,573,000 km'],.4,.1),sun:mkTag(['SUN'],.2,.07,{bg:'#ffe08a'}),orb:mkTag(['EARTH'],.2,.07),ago:mkTag(['1 MIN AGO'],.3,.075,{bg:'#ffe08a'})};
 const labelA=tags.dist1;
 const lamps=[[-7.5,2.7,-3.2,18,'#ffcf8a'],[1.6,2.9,2.6,16,'#ffd9a0'],[0,2.2,1.5,0,'#7fd8ff']].map(([x,y,z,k,c])=>{const l=new THREE.PointLight(c,0,16,2);l.position.set(x,y,z);l.userData.k=k;ctx.scene.add(l);return l;});
 const realPortal=machine.setPortal;machine.setPortal=(p,t)=>{world.portalP=p;realPortal(p,t);};
 const flashAt=(t,t0,dur)=>t<t0?0:Math.max(0,1-(t-t0)/dur)**1.6;
 Object.assign(world,{tags,hero,rival,dummyA,dummyB,crowd,crowdPos,machine,hammer,wrench,wallet,moth,runA,runB,figDummy,figRival,binos,tracker,rivalRig,balloons,orrery,train,trainFig,trainOrigin,flag,bowTie,labelA,fx,flashAt,H,duration,camera:ctx.camera});
 // ---- opening beats (hand-tuned hammer / reveal / wallet)
 const tHit=.66,tReveal=1.05,tWallet=T('It',1)-.25;
 const boltTop=machine.boltTop();
 fx.burst({t0:tHit,life:.65,count:44,pos:boltTop.toArray(),dir:[0,1,.1],spread:.95,speed:[1.8,5.2],gravity:[0,-9.8,0],size:[.035,.075],colors:['#ffd45a','#fff1a8','#ff9a3a'],kind:'spark',seed:7});
 fx.burst({t0:tHit,life:.14,count:1,pos:boltTop.toArray(),dir:[0,1,0],spread:0,speed:[0,0],gravity:[0,0,0],size:[.45,.45],colors:['#fff7c0'],kind:'star',seed:2});
 fx.burst({t0:tHit,life:.7,count:7,pos:[boltTop.x,.45,boltTop.z],dir:[0,.4,.5],spread:1,speed:[.3,.9],gravity:[0,.2,0],size:[.07,.12],colors:['#e4d9bf'],kind:'dust',seed:3,grow:2.2});
 const heroRoot1=[-2.55,.3,.3];
 const U=(a)=>V(a).normalize();
 const hand1=[[0,[-2.46,1.08,.38]],[.10,[-2.55,1.20,.30]],[.26,[-2.52,1.34,.22]],[.40,[-2.50,1.38,.20]],[.47,[-2.50,1.38,.20]],[tHit,[-2.46,1.04,.38],'in3'],[.74,[-2.50,1.14,.40],'out'],[1.05,[-2.52,1.10,.40]]];
 const dirU=[[0,[.55,-.6,-.1]],[.10,[-.05,.5,-.4]],[.26,[-.1,.7,-.6]],[.40,[-.1,.75,-.65]],[.47,[-.1,.75,-.65]],[tHit,[.8,-.6,0],'in3'],[.74,[.65,-.35,0],'out'],[1.05,[.6,-.55,0]]];
 const strike=[[0,[0,-1,0]],[.40,[.8,-.1,0]],[tHit,[0,-1,.2],'in3'],[1.05,[0,-1,.2]]];
 function hammerPoseHit(t){const h1=V(key(hand1,t)),u=U(key(dirU,t)),s=V(key(strike,t));hammer.place(hammer.headFromHand(h1,u),u,s);return {h1,h2:h1.clone().addScaledVector(u,.27)};}
 const heroS1=(t)=>({
  crouch:key([[0,.03],[.1,.1],[.26,0],[.40,0],[tHit,.15,'in'],[.8,.06],[1.05,.03]],t),
  lean:key([[0,.12],[.1,.0],[.40,-.4],[tHit,.45,'in3'],[.85,.1,'out'],[1.05,.05]],t),
  twist:key([[0,.1],[.40,.35],[tHit,-.25,'in3'],[1.05,-.05]],t),
  face:faceTrack([[0,'determined'],[.18,'effort'],[.40,'strain'],[tHit,'strain'],[.80,'proud','out'],[1.05,'grin']],t)});
 const cam1=(t)=>{const p=key([[0,[-.9,1.45,4.5]],[tHit,[-1.0,1.4,4.4]],[tReveal,[-1.05,1.4,4.4]]],t),tg=key([[0,[-2.15,1.3,.3]],[tReveal,[-2.15,1.2,.3]]],t);const sh=t>=tHit?.02*Math.max(0,1-(t-tHit)/.25):0;return {position:[p[0]+sh*noise(t*40,1),p[1]+sh*noise(t*40,2),p[2]],target:tg,fov:40,shadow:9,solar:11};};
 const cam2=(t)=>{const keys=[[tReveal,[-1.05,1.4,4.4]],[2.0,[-.5,1.7,5.6],'io'],[3.4,[-.6,2.4,10.6],'io'],[tWallet,[-.6,2.45,11.0],'out']];const tk=[[tReveal,[-2.15,1.2,.3]],[2.0,[-1.0,1.4,0]],[3.4,[-.9,1.7,-1.4]],[tWallet,[-.9,1.7,-1.4]]];return {position:key(keys,t),target:key(tk,t),fov:key([[tReveal,40],[3.4,52],[tWallet,52]],t),shadow:22,solar:26};};
 const cam3=(t)=>{const tau=t-tWallet;return {position:key([[0,[.2,1.45,4.4]],[2.8,[.1,1.4,3.8]]],tau),target:[0,1.25,2.2],fov:34,shadow:5,solar:7};};
 const beats=makeBeats({THREE,T,V,world});
 const tBeats=beats[0].start;
 function hideAll(){for(const a of [hero,rival,dummyA,dummyB,...crowd])a.hide();for(const p of [hammer,wallet,moth,wrench,binos,figDummy,figRival,trainFig,flag,bowTie,balloons,...Object.values(tags)])p.root.visible=false;}
 const envObjs=[set.ground,set.hills,set.dirt,set.tuft,set.trees,set.W,set.S,set.C,set.R,set.RC,set.F,set.FG,set.bunting,stage.root,machine.root,tracker.root,rivalRig.root,tb,dr];
 const studioProps=[runA.root,runB.root,train.root,orrery.root];
 function update(t){
  world.t=t;world.reach=0;world.worst='';for(const o of envObjs)o.visible=true;for(const o of studioProps)o.visible=true;hideAll();stage.root.visible=t>=T('Opening')-.3;
  let r={};
  world.portalP=0;machine.seatBolt(ramp(t,tHit,tHit+.04,'out'));machine.setPortal(0,t);machine.lever.rotation.x=0;machine.needle.rotation.y=0;
  runA.earth.position.x=0;runA.setString(0);runB.setString(0);machine.screen(['T-1','READY']);
  tracker.root.visible=t>=T('So')-.1;if(tracker.root.visible)tracker.spin(t);
  runA.spin(t);runB.spin(t);orrery.orbit(t,1.3);
  if(t<tWallet){
   hammer.root.visible=true;
   if(t<tReveal){const {h1,h2}=hammerPoseHit(t),s=heroS1(t);
    hero.pose({pos:heroRoot1,yaw:.38,crouch:s.crouch,lean:s.lean,twist:s.twist,face:s.face,hands:[h1,h2],headPitch:key([[0,.1],[.4,-.2],[tHit,.35,'in'],[1.05,0]],t),headYaw:-.1,feet:[[-2.72,.3,.34],[-2.38,.3,.22]]});
    r.camera=cam1(t);
   }else{
    const h1=V([-2.50,.98,.46]),u=U([.3,-.95,.05]);hammer.place(hammer.headFromHand(h1,u),u,V([0,-1,.2]));
    const bob=Math.sin(t*3.1)*.012;
    hero.pose({pos:heroRoot1,yaw:.38+.35*ramp(t,1.6,2.4),crouch:.02+bob,lean:.05,face:faceTrack([[tReveal,'grin'],[1.8,'proud'],[tWallet,'proud']],t),hands:[h1,{torso:[.22,-.05,.07]}],headYaw:-.1+.3*ramp(t,1.6,2.4),headPitch:-.05,feet:[[-2.72,.3,.34],[-2.38,.3,.22]]});
    r.camera=cam2(t);}
  }else if(t<tBeats){
   const tau=t-tWallet;wallet.root.visible=true;
   const pos=key([[0,[-.05,.86,2.3]],[.5,[0,1.12,2.45],'out'],[2.8,[0,1.10,2.46]]],tau);
   wallet.root.position.set(pos[0],pos[1],pos[2]);wallet.root.rotation.set(Math.PI/2-.25,0,0);wallet.open(ramp(tau,.55,.95,'back'));wallet.root.updateMatrixWorld(true);
   const hl=wallet.root.localToWorld(V([-.2,-.01,0])).add(V([0,0,-.02])),hr=wallet.root.localToWorld(V([.2,-.01,0])).add(V([0,0,-.02]));
   const face=faceTrack([[0,'proud'],[.5,'grin'],[.9,'proud'],[1.15,'deadpan'],[1.6,'tired'],[2.2,'tired'],[2.8,'sad']],tau);
   const lk=key([[0,[0,0]],[.5,[0,-.3]],[.9,[0,-.8]],[1.2,[.1,0]],[1.6,[.5,.8]],[2.0,[.7,.5]],[2.5,[0,-.7]]],tau);face.lookX=lk[0];face.lookY=lk[1];
   hero.pose({pos:[0,0,2.1],yaw:.12,crouch:.02,lean:.1+.1*ramp(tau,.5,1.2),hands:[hl,hr],face,headPitch:.05+.3*ramp(tau,.5,1.0)-.1*ramp(tau,1.6,2.2),headYaw:.08*Math.sin(tau*1.5)+.25*ramp(tau,1.5,1.9),feet:[[-.16,0,2.1],[.16,0,2.1]]});
   const mp=[[1.0,[0,1.12,2.46]],[1.35,[.15,1.35,2.55],'out'],[1.7,[.45,1.62,2.5]],[2.1,[.1,1.85,2.62]],[2.6,[.7,1.9,2.4]]];
   if(tau>=1.0){moth.root.visible=true;moth.root.position.set(...key(mp,tau));moth.flap(t);moth.root.rotation.y=Math.PI;}
   r.camera=cam3(t);
  }else{
   let b=beats[0];for(const x of beats)if(t>=x.start)b=x;
   r=b.run(t)||{};r.note=b.id;
  }
  if(!r.camera)throw Error('no camera at t='+t);
  if(r.camera.studio){for(const o of envObjs)o.visible=false;const keep=new Set(r.keep||[]);for(const o of studioProps)o.visible=keep.has(o);}
  const night=r.camera.night?1:0;lamps[0].intensity=night*lamps[0].userData.k;lamps[1].intensity=night*lamps[1].userData.k;lamps[2].intensity=(world.portalP||0)*(night?36:25);
  if(t>.42&&t<.78)r.blur=.04;
  const cm=r.camera,dr=(x,y,z,s)=>[x+.012*noise(t*.6,s),y+.01*noise(t*.55,s+1),z];const camera={...cm,position:dr(...cm.position,1),target:[cm.target[0]+.01*noise(t*.5,5),cm.target[1]+.008*noise(t*.45,6),cm.target[2]]};
  return {camera,blur:r.blur||0,reach:world.reach,note:(r.note||'open')+(night?' NIGHT':'')+(world.reach>.005?' '+world.worst:''),flash:r.flash||0,beforeRender:()=>fx.update(t)};
 }
 return {update,T,world,beats};
}
