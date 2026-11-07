// Beats 4-15 of the film. Each beat: {id,start,end,run(t)->{camera,beforeRender?,flash?,note?}}.
// env: {THREE,T,V,world,hideAll}. Everything is a pure function of absolute time.
import {key,ramp,ease,clamp01,camPath,gait,lerp3} from './util.mjs';
import {faceTrack} from '/runtime/face.js';
import {crowdPose} from './cast.mjs';
export function makeBeats(env){
 const {THREE,T,V,world}=env;const {tags,hero,rival,dummyA,dummyB,crowd,crowdPos,machine,hammer,wrench,wallet,moth,runA,runB,figDummy,figRival,binos,tracker,rivalRig,balloons,orrery,train,trainFig,flag,bowTie,labelA,fx,flashAt}=world;
 const heroStd={yaw:0,face:'neutral'};
 const poseCrowd=(t,mode,target,cam,pick)=>{crowd.forEach((c,i)=>{const p=crowdPos[i];if(cam){const dx=p.x-cam.position[0],dz=p.z-cam.position[2],dy=1.0-cam.position[1];if(Math.hypot(dx,dz)<2.4&&Math.abs(dy)<3)return;}c.pose(crowdPose(p,t,pick?pick(i):mode,i,target));});};
 const out=[];
 const camDist=(c)=>Math.hypot(c.position[0]-c.target[0],c.position[1]-c.target[1],c.position[2]-c.target[2]);
 const putTag=(tag,x,yBottom,z,cam,s=1)=>{const r=tag.root;r.visible=true;r.scale.setScalar(s);r.position.set(x,yBottom+tag.h*s/2,z);r.lookAt(V(cam.position));};
 const tagScale=(cam)=>Math.min(5,Math.max(1,camDist(cam)/1.25));
 const add=(id,start,end,run)=>out.push({id,start,end,run});
 const H=world.H; // table height
 // ============================================================ 4. rival introduced
 {
  const a=T('Across')-.15,b=T('first test')-.12,mid=a+(b-a)*.55;
  const wide=camPath([[a,[7.5,2.6,7.0]],[mid,[8.6,2.4,5.8]]],[[a,[12.6,1.7,-2.8]],[mid,[13.0,1.6,-2.2]]],[[a,50],[mid,44]],{shadow:24,solar:28});
  const close=camPath([[mid,[11.3,1.98,2.0]],[b,[11.6,1.94,1.7]]],[[mid,[12.5,1.96,-1.0]],[b,[12.4,1.94,-1.0]]],40,{shadow:8,solar:10});
  add('rival',a,b,(t)=>{
   const c=t<mid?wide(t):close(t);
   const sm=ramp(t,mid-.3,mid+.5);
   const face=faceTrack([[a,'deadpan'],[mid-.2,'think'],[mid+.4,'smug'],[b,'smirk']],t);
   rival.pose({pos:[12.4,.4,-1.0],yaw:.2+.35*ramp(t,mid-.4,mid+.2),crouch:.01,lean:-.04+.03*Math.sin(t*2),face,headYaw:.18*ramp(t,mid-.5,mid)-.1,headPitch:-.06,
    hands:[{torso:[-.2,.1,.06]},t<mid?{torso:[.22,.1,.06]}:{torso:[.02,.56,.16]}],feet:[[12.24,.4,-.98],[12.56,.4,-1.06]]});
   return {camera:c};
  });
 }
 // ============================================================ 5. first test
 {
  const a=T('first test')-.12,hum=T('hummed'),fl=T('flashed')+.02,van=T('vanished'),b=T('His')-.05;
  const camA=camPath([[a,[1.3,1.8,5.6]],[hum,[1.0,1.7,5.0]]],[[a,[.8,1.2,.6]],[hum,[.5,1.25,.6]]],44,{night:1,shadow:12,solar:14});
  const camDial=camPath([[a+.7,[4.6,2.1,5.0]],[hum-.1,[4.2,2.0,4.6]]],[[a+.7,[1.0,1.15,.9]],[hum-.1,[1.0,1.15,.9]]],46,{night:1,shadow:14,solar:16});
  const camReact=camPath([[van-.15,[3.7,1.75,3.6]],[b,[3.5,1.7,3.3]]],[[van-.15,[2.0,1.45,1.5]],[b,[2.0,1.45,1.5]]],34,{night:1,shadow:8,solar:10});
  const camPush=camPath([[hum,[.7,1.5,4.2]],[fl,[.2,1.35,3.2]],[b,[.1,1.35,3.4]]],[[hum,[.1,1.2,.6]],[fl,[0,1.1,.6]],[b,[.1,1.15,.6]]],[[hum,40],[fl,34],[b,38]],{night:1,shadow:10,solar:12});
  add('test1',a,b,(t)=>{
   // dummy sits in the machine chair
   const seated=t<fl+.18;
   if(seated)dummyA.pose({pos:[0,.17,.66],yaw:0,face:t<hum?'neutral':'scared',hands:[[-.31,1.02,.66],[.31,1.02,.66]],feet:[[-.16,.3,1.03],[.16,.3,1.03]],headYaw:.25*Math.sin(t*1.4)*(t<hum?1:.3),headRoll:t>hum?.05*Math.sin(t*30):0});else dummyA.hide();
   // dial insert, then lever pull
   const pull=ramp(t,hum-.55,hum-.05,'out');
   const leverRot=pull*.65;machine.lever.rotation.x=leverRot;
   const knob=machine.lever.localToWorld(V([0,.52,0]));
   const dialK=ramp(t,a+.5,a+1.0,'back');machine.needle.rotation.y=dialK*2.2;
   const react=t>=van-.15,rk=ramp(t,van-.15,van+.2,'out');
   if(!react)hero.pose({pos:[2.0,.3,1.25],yaw:2.5,crouch:.04,lean:.5,twist:.2,face:t<hum?'determined':t<fl?'think':'shock',
    hands:[t<hum-.6?null:knob,{torso:[.12,.1,.1]}],headYaw:.7*ramp(t,hum-.8,hum-.3),headPitch:-.45});
   else hero.pose({pos:[2.0,.3,1.25],yaw:2.5-1.6*rk,crouch:.05+.04*Math.abs(Math.sin((t-van)*9)),lean:.05,face:faceTrack([[van-.15,'shock'],[van+.25,'joy']],t),
    hands:[{torso:[-.26,.56+.12*Math.sin((t-van)*9),.12]},{torso:[.26,.56+.12*Math.cos((t-van)*9),.12]}],headYaw:.2*rk,headPitch:-.1*rk});
   // portal swells with the hum, bulbs pulse
   const p=ramp(t,hum,hum+.9,'out')*(t<fl?1:Math.max(0,1-ramp(t,fl,fl+.35)));machine.setPortal(p,t);
   machine.screen(t<hum?['T-1','READY']:t<fl?['T-1','HUM...']:['T-1','SENT'],{});
   for(const [i,bu] of machine.bulbs.entries())if(bu.material)bu.material.emissiveIntensity=.9+(t>hum?1.6*Math.abs(Math.sin(t*12+i)):0);
   const c=react?camReact(t):t<a+.7?camA(t):t<hum-.1?camDial(t):t<hum?camDial(hum-.1):camPush(t);
   return {camera:c,flash:flashAt(t,fl,.45),blur:(t>hum-.55&&t<hum-.05)?.04:0};
  });
  world.fx.burst({t0:fl,life:.9,count:46,pos:[0,1.2,.66],dir:[0,1,.2],spread:1,speed:[1.5,5],gravity:[0,-2,0],size:[.04,.09],colors:['#9fe3ff','#ffffff','#b5a8ff'],kind:'spark',seed:21});
  world.fx.burst({t0:fl,life:.18,count:1,pos:[0,1.4,.9],dir:[0,1,0],spread:0,speed:[0,0],gravity:[0,0,0],size:[2.4,2.4],colors:['#d8f4ff'],kind:'star',seed:2});
 }
 // ============================================================ 6. model says: empty space (studio cutaway)
 {
  const a=T('His')-.05,hund=T('hundred'),emp=T('empty'),b=T('Because')-.1;
  const E=runA.root.localToWorld(V([0,H+.085,0])),figX=runA.kmToX(107208),Fx=E.x+figX,mid=E.x+figX/2;
  const st={studio:1,shadow:3,solar:4,aperture:.0008,maxblur:.002};
  const camClose=camPath([[a,[mid+.10,E.y+.34,E.z+1.65]],[hund+.3,[mid+.06,E.y+.30,E.z+1.5]]],[[a,[mid,E.y+.09,E.z]],[hund+.3,[mid,E.y+.09,E.z]]],34,st);
  const camOut=camPath([[hund+.3,[mid+.06,E.y+.30,E.z+1.5]],[emp+.3,[mid+.55,E.y+.40,E.z+2.8]]],[[hund+.3,[mid,E.y+.09,E.z]],[emp+.3,[mid+.05,E.y+.07,E.z]]],[[hund+.3,34],[emp+.3,36]],st);
  const heroCam=camPath([[emp+.3,[-10.2,1.6,.2]],[b,[-10.3,1.55,0]]],[[emp+.3,[-12.3,1.45,-2.5]],[b,[-12.3,1.45,-2.5]]],36,{shadow:8,solar:10});
  add('model',a,b,(t)=>{
   const showHero=t>emp+.3;
   const cam6=showHero?heroCam(t):t<hund+.3?camClose(t):camOut(t);
   if(showHero){
    hero.pose({pos:[-12.3,0,-2.5],yaw:.9,crouch:.03,face:faceTrack([[emp+.3,'shock'],[b-.4,'tired']],t),hands:[{head:[-.2,-.1,.17]},{head:[.2,-.1,.17]}],headPitch:-.1,headYaw:.15*Math.sin(t*3)});
    return {camera:cam6};
   }
   figDummy.root.visible=true;figDummy.root.position.set(Fx,H+.05+.004*Math.sin(t*2.3),E.z);figDummy.root.rotation.set(0,-.35+.2*Math.sin(t*.8),.05*Math.sin(t*1.7));
   runA.setString(Math.max(0,(figX-.05)*ramp(t,hund-.3,hund+.5)));
   const s=tagScale(cam6);
   putTag(tags.earth,E.x-.03-.02*s,E.y+.055+.012*s,E.z,cam6,s);
   putTag(tags.dist1,mid,E.y+.36,E.z,cam6,Math.max(1,s*.9));
   return {camera:cam6,keep:[runA.root]};
  });
 }
 // ============================================================ 7. rival laughs, orrery, old spot
 {
  const a=T('Because')-.1,rac=T('races')-.08,go=T('Go back')-.1,b=T('It\'s like')-.1,sits=T('sits')+.1;
  const camRival=camPath([[a,[11.2,1.95,1.9]],[sits+.4,[11.3,1.92,1.7]]],[[a,[12.4,1.98,-1.0]],[sits+.4,[12.4,1.96,-1.0]]],38,{shadow:8,solar:10});
  const camOrr=camPath([[rac,[-4.6,2.0,-.4]],[go,[-4.6,1.9,-.6]]],[[rac,[-4.6,1.15,-2.6]],[go,[-4.6,1.15,-2.6]]],[[rac,52],[go,50]],{studio:1,shadow:4,solar:5});
  const earthW=runA.root.localToWorld(V([0,H+.085,0]));
  const camOld=camPath([[go,[earthW.x+.45,earthW.y+.45,earthW.z+3.0]],[b,[earthW.x+.48,earthW.y+.5,earthW.z+3.1]]],[[go,[earthW.x+.45,earthW.y,earthW.z]],[b,[earthW.x+.45,earthW.y,earthW.z]]],42,{studio:1,shadow:4,solar:5});
  add('orbit',a,b,(t)=>{
   if(t<rac){ // rival with binoculars, then laughing
    const up=ramp(t,a+.1,a+.55,'back'),down=ramp(t,a+.95,a+1.25);
    const lift=up*(1-down);
    binos.root.visible=lift>.02;
    const hp=rival.headLocal(0,-.02,.28);binos.root.position.copy(hp);binos.root.quaternion.copy(rival.head.getWorldQuaternion(new THREE.Quaternion()));
    const face=faceTrack([[a,'smug'],[a+.7,'deadpan'],[a+1.0,'laugh'],[rac,'laugh']],t);
    rival.pose({pos:[12.4,.4,-1.0],yaw:.45,crouch:.01+.04*down,lean:-.1*down-.05*Math.sin((t-a-1.1)*22)*down*(t>a+1.1?1:0),face,headPitch:-.15*down,headYaw:.25,
     hands:[{head:[-.07,-.02,.2*lift+.05*(1-lift)]},{head:[.07,-.02,.2*lift+.05*(1-lift)]}].map((h,i)=>lift>.02?h:{torso:[(i?1:-1)*.2,.1,.06]}),feet:[[12.24,.4,-.98],[12.56,.4,-1.06]]});
    return {camera:camRival(t)};
   }
   if(t<go){ // orrery: Earth races round the Sun
    orrery.orbit(t,3.2);orrery.root.updateMatrixWorld(true);
    const c=camOrr(t),ew=orrery.earth.getWorldPosition(V([0,0,0])),oc=orrery.root.position;
    {const dx=c.position[0]-oc.x,dz=c.position[2]-oc.z,dl=Math.hypot(dx,dz);putTag(tags.sun,oc.x+dx/dl*.14,oc.y+.4-.035,oc.z+dz/dl*.14,c);putTag(tags.orb,ew.x,ew.y+.17,ew.z,c);tags.sun.root.children[0].material.depthTest=false;tags.sun.root.renderOrder=5;}
    return {camera:c,keep:[orrery.root]};
   }
   // marble slides away from the old spot flag
   const k=ramp(t,go+.2,b-.2,'io'),dist=.9*k;
   const cO=camOld(t);runA.earth.position.x=dist;flag.root.visible=true;flag.root.scale.setScalar(2.0);flag.root.position.set(earthW.x+.06,H+.045,earthW.z+.12);
   putTag(tags.earth,earthW.x+dist+.13,H+.1,earthW.z,cO,2.0);
   return {camera:cO,keep:[runA.root]};
  });
 }
 // ============================================================ 8. toy train
 {
  const a=T('It\'s like')-.1,step=T('stepping'),goes=T('going'),land=T('landing'),b=T('So')-.1;
  const camTf=(t)=>{const x0=world.trainOrigin.x,xA=ramp(t,a,b,'in')*1.55+.2,f=1-ramp(t,goes-.3,goes+.25),tx=(x0+.6)+((x0+xA-.38)-(x0+.6))*f;return {position:[tx+.55,1.55,world.trainOrigin.z+2.5],target:[tx,H+.12,world.trainOrigin.z],fov:32,shadow:5,solar:6,studio:1};};
  add('train',a,b,(t)=>{
   const x0=world.trainOrigin.x,z0=world.trainOrigin.z,xAt=(tt)=>ramp(tt,a,b,'in')*1.55+.2;
   train.place(xAt(t));
   const top=H+.09;
   trainFig.root.visible=true;
   if(t<step+.05){trainFig.root.position.set(x0+xAt(t)-.4,top,z0);trainFig.root.scale.setScalar(1);}
   else if(t<goes){ // steps off sideways onto the table beside the track
    const k=ramp(t,step+.05,step+.4,'out');trainFig.root.position.set(x0+xAt(step+.05)-.4+.12*k,top-.05*k+.1*Math.sin(k*Math.PI),z0+.22*k);
   }else if(t<land){trainFig.root.visible=false;}
   else{ // lands on the empty rail where the train was a minute ago
    const pop=ramp(t,land,land+.25,'back');trainFig.root.position.set(x0+.6,top-.07,z0);trainFig.root.scale.setScalar(.6+.4*pop);}
   const cT=camTf(t);
   if(t>land-.15)putTag(tags.ago,x0+.6,H+.27,z0,cT,1);
   return {camera:cT,keep:[train.root]};
  });
 }
 // ============================================================ 9. decision + planet tracker (he bolts the base plate down, head well below the dish)
 {
  const a=T('So')-.1,bolted=T('bolted'),b=T('next')-.1;
  const camFace=camPath([[a,[3.1,1.5,4.3]],[bolted-.4,[3.3,1.35,3.8]]],[[a,[3.45,1.2,.6]],[bolted-.4,[3.45,1.05,.6]]],46,{shadow:6,solar:8});
  const camBolt=camPath([[bolted-.4,[3.3,1.35,3.8]],[b,[3.5,1.2,3.4]]],[[bolted-.4,[3.45,1.05,.6]],[b,[3.5,.95,.6]]],46,{shadow:6,solar:8});
  add('tracker',a,b,(t)=>{
   const turn=ramp(t,bolted-.15,bolted+.2,'out');
   const face=faceTrack([[a,'shock'],[a+.5,'think'],[bolted-.5,'determined'],[bolted+.3,'proud']],t);
   tracker.root.updateMatrixWorld(true);const wp=tracker.root.localToWorld(V([.1,.85,0]));wrench.root.visible=true;const wd=V([.6,-.7,.2]).normalize();wrench.place(wp.clone().add(V([.02,-.03*turn,0])),wd,turn*.6);
   hero.pose({pos:[3.15,0,.6],yaw:1.57,crouch:.02+.02*turn,lean:.1+.06*turn,twist:-.1,face,hands:[wp.clone().addScaledVector(wd,-.3),{torso:[.2,.0,.2]}],headYaw:.15,headPitch:.1,feet:[[3.15,0,.77],[3.15,0,.43]]});
   tracker.root.visible=true;tracker.spin(t);
   const c=t<bolted-.4?camFace(t):camBolt(t);
   return {camera:c};
  });
  world.fx.burst({t0:T('bolted'),life:.5,count:26,pos:[3.72,.95,.62],dir:[0,1,.2],spread:.9,speed:[1,3.4],gravity:[0,-9.8,0],size:[.03,.06],colors:['#ffd45a','#fff1a8','#ff9a3a'],kind:'spark',seed:31});
 }
 // ============================================================ 10. the second dummy arrives early
 {
  const a=T('next')-.1,arr=T('arrived'),two=T('Now there'),b=T('Opening')-.15;
  const cam=camPath([[a,[.5,2.1,6.6]],[arr,[.2,2.1,6.3]],[two,[.1,2.0,5.7]],[b,[.1,1.9,5.3]]],[[a,[0,1.05,1.0]],[arr,[-.1,1.05,1.0]],[two,[-.1,1.1,1.1]],[b,[-.1,1.15,1.2]]],[[a,60],[two,56],[b,52]],{shadow:14,solar:16});
  add('test2',a,b,(t)=>{
   tracker.root.visible=true;tracker.spin(t);
   dummyA.pose({pos:[0,.17,.66],yaw:0,face:t>arr?'shock':'neutral',hands:[[-.31,1.02,.66],[.31,1.02,.66]],feet:[[-.16,.3,1.03],[.16,.3,1.03]],headYaw:t>arr?-.8*ramp(t,arr+.25,arr+.6):0});
   machine.setPortal(0,t);
   if(t>arr+.05){const wave=Math.sin(t*9);dummyB.pose({pos:[-1.25,.3,1.35],yaw:.5,crouch:.03+.03*Math.abs(wave),face:t>two?'grin':'neutral',hands:[{torso:[-.2,.1,.1]},{torso:[.38,.78+.1*wave,.1]}],headYaw:.15*Math.sin(t*2)});}
   const hf=t<two?'shock':t<two+.6?'think':'joy';
   hero.pose({pos:[.75,.3,1.3],yaw:-.4,crouch:.02,lean:-.1*ramp(t,arr,arr+.3),face:hf,hands:t<two+.6?[{torso:[-.2,.5,.15]},{torso:[.2,.5,.15]}]:[{torso:[-.3,.62+.12*Math.sin(t*8),.12]},{torso:[.3,.62+.12*Math.cos(t*8),.12]}],headYaw:-.5*ramp(t,arr,arr+.3),headPitch:-.1,feet:[[.59,.3,1.3],[.91,.3,1.26]]});
   return {camera:cam(t),flash:flashAt(t,arr,.35)};
  });
  world.fx.burst({t0:T('arrived'),life:.8,count:40,pos:[-1.25,1.2,1.35],dir:[0,1,0],spread:1,speed:[1,4],gravity:[0,-2,0],size:[.04,.09],colors:['#9fe3ff','#ffffff','#b5a8ff'],kind:'spark',seed:41});
 }
 // ============================================================ 11. opening day
 {
  const a=T('Opening')-.15,bal=T('Balloons'),crd=T('crowd'),b=T('rival went')-.1;
  const crane=camPath([[a,[2,12,19]],[bal-.2,[2.5,5.5,14.5]],[crd-.3,[3,2.6,11.8]]],[[a,[3,1.0,4]],[bal-.2,[3,1.8,3.5]],[crd-.3,[3,1.7,3]]],[[a,55],[crd-.3,52]],{shadow:30,solar:34});
  const faces=camPath([[crd-.3,[-1.4,1.7,2.0]],[b,[.6,1.7,2.6]]],[[crd-.3,[3.2,1.55,6.4]],[b,[3.0,1.55,6.4]]],52,{shadow:20,solar:24});
  add('opening',a,b,(t)=>{
   const mode=t<bal?'wave':t<crd+.3?'cheer':'cheer';
   crowd.forEach((c,i)=>c.pose(crowdPose(crowdPos[i],t,i%4===0&&t>bal?'wave':mode,i,[3,0,-1.5])));
   hero.pose({pos:[-1.0,0,1.9],yaw:.5,face:'joy',crouch:.03,hands:[{torso:[-.3,.62+.12*Math.sin(t*6),.12]},{torso:[.3,.1,.1]}],headYaw:.3});
   balloons.root.visible=true;balloons.bob(t);tracker.root.visible=true;tracker.spin(t);
   return {camera:t<crd-.3?crane(t):faces(t)};
  });
  world.fx.burst({t0:T('Balloons'),life:2.4,count:140,pos:[0,3.6,2.5],dir:[0,1,.4],spread:1.4,speed:[2.5,7],gravity:[0,-2.4,0],size:[.05,.09],colors:['#e8453c','#f4c542','#3d8bd6','#4caf50','#e987a5','#ffffff'],kind:'confetti',seed:51,drag:.8,spin:12,stagger:.2});
 }
 // ============================================================ 12. the rival boards
 {
  const a=T('rival went')-.1,one=T('one whole'),notr=T('no tracker'),pat=T('no patience'),b=T('Lever')-.1;
  const rigW=V([14,.4,-1.4]);
  const camBoard=camPath([[a,[9.6,2.0,5.2]],[one-.1,[12.4,1.8,3.6]]],[[a,[12,1.2,.4]],[one-.1,[13.6,1.2,-1.2]]],[[a,44],[one-.1,38]],{shadow:14,solar:16});
  const camPOV=camPath([[one-.1,[14.1,2.15,-.8]],[notr-.1,[14.3,2.1,-.85]]],[[one-.1,[14.75,1.3,-1.2]],[notr-.1,[14.75,1.32,-1.2]]],[[one-.1,46],[notr-.1,38]],{shadow:6,solar:8});
  const camHero=camPath([[notr-.1,[.8,1.6,4.6]],[pat-.1,[.7,1.55,4.0]]],[[notr-.1,[1.4,1.4,1.7]],[pat-.1,[1.4,1.4,1.7]]],30,{shadow:6,solar:8});
  const camRivalFace=camPath([[pat-.1,[12.3,1.8,.9]],[b,[12.9,1.78,.7]]],[[pat-.1,[13.9,1.55,-1.4]],[b,[14.0,1.5,-1.4]]],30,{shadow:6,solar:8});
  add('rivalboard',a,b,(t)=>{
   crowd.forEach((c,i)=>c.pose(crowdPose(crowdPos[i],t,'clap',i,[10,0,0])));
   rivalRig.root.visible=true;
   const g=gait([12.2,.4,.6],[13.8,.4,-.5],a+.1,one-.1,t,{y:.4,stride:.22,rate:8});
   const seated=t>=one-.1;
   if(!seated)rival.pose({pos:g.pos,yaw:g.yaw,crouch:g.crouch,lean:g.lean,face:'grin',feet:g.feet,hands:g.hands,headYaw:0});
   else{const grip=ramp(t,one,one+.25);const knob=rivalRig.lever.localToWorld(V([0,.58,0]));
    rival.pose({pos:[14,.41,-1.35],yaw:0,crouch:0,lean:.04+.3*grip,face:t<pat?'smirk':'laugh',feet:[[13.84,.4,-.98],[14.16,.4,-.98]],hands:[{torso:[-.3,.3,.3]},grip>0?knob:{torso:[.3,.3,.3]}],headYaw:-.3*ramp(t,one+.1,one+.5),headPitch:.05});}
   const hero2=t>=notr-.1&&t<pat;if(hero2)hero.pose({pos:[1.6,.3,1.3],yaw:-.2,face:'scared',lean:-.15,crouch:.01,hands:[{head:[.0,-.12,.19]},{torso:[.3,.1,.1]}],headYaw:.6,headPitch:.1});
   const c=t<one-.1?camBoard(t):t<notr-.1?camPOV(t):t<pat-.1?camHero(t):camRivalFace(t);
   return {camera:c};
  });
 }
 // ============================================================ 13. lever, flash, silence
 {
  const a=T('Lever')-.1,lev=T('Lever'),fl=T('Flash'),sil=T('Silence'),b=T('On the model')-.1;
  const camLev=camPath([[a,[12.4,1.95,1.1]],[fl,[12.7,1.95,.8]]],[[a,[14.0,1.85,-1.4]],[fl,[14.0,1.85,-1.4]]],36,{shadow:8,solar:10});
  const camWide=camPath([[fl+.25,[7.2,2.0,9.6]],[b,[7.8,2.0,9.0]]],[[fl+.25,[14,1.5,-1.4]],[b,[14,1.5,-1.4]]],[[fl+.25,38],[b,36]],{shadow:22,solar:26});
  add('lever',a,b,(t)=>{
   rivalRig.root.visible=true;const pull=ramp(t,lev+.05,lev+.35,'in');rivalRig.lever.rotation.x=-.35+pull*.9;
   const knob=rivalRig.lever.localToWorld(V([0,.58,0]));
   if(t<fl+.12)rival.pose({pos:[14,.41,-1.35],yaw:0,lean:.34+.1*pull,face:t<fl?'grin':'scared',feet:[[13.84,.4,-.98],[14.16,.4,-.98]],hands:[{torso:[-.3,.3,.3]},knob],headYaw:-.3}); else rival.hide();
   const camL=t<fl+.25?camLev(t):camWide(t);poseCrowd(t,t<fl?'cheer':'gasp',[10,0,0],camL);
   if(t>fl+.2){bowTie.root.visible=true;const k=t-fl-.2;bowTie.root.position.set(14+.25*Math.sin(k*3),Math.max(.45,1.7-.75*k)+0,-1.2+.1*Math.cos(k*2));bowTie.root.rotation.set(k*2,k*3,k);bowTie.root.scale.setScalar(2.4);}
   return {camera:camL,flash:flashAt(t,fl,.5),blur:(t>lev+.05&&t<lev+.4)?.04:0};
  });
  world.fx.burst({t0:T('Flash'),life:.8,count:50,pos:[14,1.4,-1.35],dir:[0,1,0],spread:1,speed:[1.5,5],gravity:[0,-2,0],size:[.04,.09],colors:['#c9a8ff','#ffffff','#ffe35a'],kind:'spark',seed:61});
  world.fx.burst({t0:T('Flash'),life:.18,count:1,pos:[14,1.5,-.8],dir:[0,1,0],spread:0,speed:[0,0],gravity:[0,0,0],size:[2.6,2.6],colors:['#f0e0ff'],kind:'star',seed:2});
 }
 // ============================================================ 14. payoff on the model (studio: tiny man, pull back to the marble)
 {
  const a=T('On the model')-.1,tiny=T('tiny'),flo=T('floated'),mar=T('marble'),b=T('The inventor')-.1;
  const E=runB.root.localToWorld(V([0,H+.085,0])),endX=runB.kmToX(2573000),F=V([E.x+endX,H+.13,E.z]),mid=(E.x+F.x)/2;
  const st={studio:1,shadow:10,solar:12,aperture:.0008,maxblur:.002};
  const cam=camPath([[a,[F.x-.45,F.y+.15,F.z+2.3]],[flo,[F.x-.7,F.y+.22,F.z+2.7]],[mar-1.9,[mid,F.y+.9,F.z+8.6]],[mar-.6,[mid,F.y+.9,F.z+8.6]],[mar+.15,[E.x+.9,E.y+.3,E.z+1.6]]],[[a,[F.x,F.y+.08,F.z]],[flo,[F.x-.1,F.y+.05,F.z]],[mar-1.9,[mid,E.y+.1,E.z]],[mar-.6,[mid,E.y+.1,E.z]],[mar+.15,[E.x+.1,E.y+.03,E.z]]],[[a,34],[flo,34],[mar-1.9,52],[mar-.6,52],[mar+.15,34]],st);
  add('payoff',a,b,(t)=>{
   const c=cam(t);runB.setString(endX*ramp(t,a,a+.3));
   figRival.root.visible=true;figRival.root.position.set(F.x,F.y+.02*Math.sin(t*1.9),F.z);figRival.root.rotation.set(.12*Math.sin(t*1.3),-.5+.5*Math.sin(t*.7),.2*Math.sin(t*1.1)+.08*Math.sin(t*3.1));
   const s=tagScale(c);
   if(t>=mar-1.9)putTag(tags.dist2,mid,E.y+.28+.06*s,E.z,c,Math.max(1,s*.9));
   putTag(tags.earth,E.x,E.y+.05+.012*s,E.z,c,s);
   return {camera:c,keep:[runB.root]};
  });
 }
 // ============================================================ 15. finale: callback to the opening hammer shot
 {
  const a=T('The inventor')-.1,look=T('looked'),tight=T('tightened'),end=world.duration;
  const cam=camPath([[a,[-.6,1.35,3.9]],[tight,[-.9,1.25,3.6]],[end,[-1.2,1.3,3.1]]],[[a,[-2.2,1.15,.35]],[end,[-2.3,1.3,.35]]],[[a,40],[end,34]],{shadow:9,solar:11});
  add('finale',a,end,(t)=>{
   const turn=ramp(t,tight+.1,tight+.55,'out');
   const wp=V([-1.80,.5,.36]);wrench.root.visible=true;wrench.place(wp.clone().add(V([0,.06*turn,0])),V([.6,.75,.3]),turn*.7);
   const face=faceTrack([[a,'deadpan'],[look+.2,'think'],[look+.9,'smug'],[tight+.4,'smirk'],[end,'smirk']],t);
   hero.pose({pos:[-2.2,.3,.5],yaw:.38-.3*ramp(t,look,look+.8),crouch:.16+.04*turn,lean:.32+.1*turn-.3*ramp(t,tight+.6,tight+.9),face,hands:[wp.clone().add(V([-.18,.45,.12])),{torso:[.24,.0,.1]}],headYaw:-.1-.5*ramp(t,look,look+.6)+.55*ramp(t,look+.6,look+1.0)+.05*ramp(t,tight,tight+.2)-.2*ramp(t,tight+.2,tight+.45)+.2*ramp(t,tight+.55,tight+.8),headPitch:.25*ramp(t,tight,tight+.25)-.25*ramp(t,tight+.5,tight+.8),feet:[[-2.38,.3,.52],[-2.02,.3,.4]]});
   const c=cam(t);
   return {camera:c};
  });
  world.fx.burst({t0:T('tightened')+.35,life:.4,count:14,pos:[-1.80,.5,.36],dir:[0,1,.2],spread:.8,speed:[.8,2.2],gravity:[0,-9.8,0],size:[.02,.04],colors:['#ffd45a','#fff1a8'],kind:'spark',seed:71});
 }
 return out;
}
