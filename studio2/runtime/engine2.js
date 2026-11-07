import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {BokehShader} from 'three/addons/shaders/BokehShader.js';
import {clamp,smooth} from './timeline.mjs';
const W=1080,H=1920,INK='#351f22',realistic=true,vibrant=false,enhanced=true;
export async function createEngine(canvas,{mode='preview'}={}){
 const r=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});r.setSize(W,H);r.outputColorSpace=THREE.SRGBColorSpace;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFShadowMap;r.shadowMap.autoUpdate=false;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#a8bfd5');scene.fog=new THREE.Fog('#a8bfd5',18,65);
 const camera=new THREE.PerspectiveCamera(80,W/H,.05,160);
 const hemi=new THREE.HemisphereLight('#a9b9e9','#62517f',1.45);scene.add(hemi);
 const key=new THREE.DirectionalLight('#ffe2b4',2.25);key.position.set(-8,8,6);key.castShadow=true;key.shadow.mapSize.set(4096,4096);key.shadow.camera.left=key.shadow.camera.bottom=-8;key.shadow.camera.right=key.shadow.camera.top=8;key.shadow.normalBias=.012;key.target.position.set(-4,1,0);scene.add(key,key.target);
 const band=new THREE.DataTexture(new Uint8Array([140,212,255]),3,1,THREE.RedFormat);band.minFilter=band.magFilter=THREE.NearestFilter;band.generateMipmaps=false;band.needsUpdate=true;
 const ink=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{res:{value:new THREE.Vector2(W,H)},th:{value:realistic?.9:1.65},colour:{value:new THREE.Color(INK)}},vertexShader:'uniform vec2 res;uniform float th;void main(){vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);vec2 d=(projectionMatrix*vec4(normalize(normalMatrix*normal),0.)).xy;d=length(d)>.0001?normalize(d):vec2(0.);p.xy+=d*th*2./res*p.w;gl_Position=p;}',fragmentShader:'uniform vec3 colour;void main(){gl_FragColor=vec4(colour,1.);}'});
 const outlines={character:ink,prop:ink.clone(),background:ink.clone()};
 outlines.character.uniforms.th.value=4.5;outlines.prop.uniforms.th.value=2.6;outlines.background.uniforms.th.value=1.1;
 function style(root,{importance='background'}={}){if(!outlines[importance])throw Error('Unknown outline importance: '+importance);const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 for(const mesh of meshes){
  const old=Array.isArray(mesh.material)?mesh.material:[mesh.material];const mats=old.map(m=>importance==='character'?new THREE.MeshToonMaterial({color:m.color,map:m.map,gradientMap:band,side:THREE.FrontSide}):realistic?new THREE.MeshStandardMaterial({color:m.color,map:m.map,roughness:/glass/i.test(m.name)?.18:/chrome/i.test(m.name)?.24:(m.roughness??.82),metalness:/chrome/i.test(m.name)?.7:/steel/i.test(m.name)?.45:(m.metalness??0),vertexColors:!!mesh.geometry.attributes.color,side:THREE.FrontSide}):new THREE.MeshToonMaterial({color:m.color,gradientMap:band,map:/glass|paint|saffron/i.test(m.name)?null:m.map,vertexColors:!!mesh.geometry.attributes.color,side:THREE.FrontSide}));mesh.material=Array.isArray(mesh.material)?mats:mats[0];mesh.castShadow=mesh.receiveShadow=true;
  if(!mesh.userData.noOutline&&!/individual.leaf|leaf.canopy|grass.blades|joint|marking|continuous|cloth|seam|tread|LED|speaker|spoke|lug/i.test(mesh.name)){const contour=new THREE.Mesh(mesh.geometry,outlines[importance]);contour.userData.outline=true;contour.name='Outline '+importance;contour.castShadow=contour.receiveShadow=false;mesh.add(contour);}
 }
 if(realistic){
  const grassCanvas=document.createElement('canvas');grassCanvas.width=grassCanvas.height=256;const grassPen=grassCanvas.getContext('2d');grassPen.fillStyle='#6c9e2e';grassPen.fillRect(0,0,256,256);let seed=247;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const shades=['#67972c','#74a432','#6fa42e','#7cab37','#608f2b'];for(let i=0;i<9000;i++){grassPen.fillStyle=shades[Math.floor(random()*shades.length)];const x=Math.floor(random()*256),y=Math.floor(random()*256);grassPen.fillRect(x,y,1+Math.floor(random()*3),1+Math.floor(random()*2));}const grassTexture=new THREE.CanvasTexture(grassCanvas);grassTexture.colorSpace=THREE.SRGBColorSpace;grassTexture.wrapS=grassTexture.wrapT=THREE.RepeatWrapping;grassTexture.repeat.set(100,100);grassTexture.anisotropy=8;
  const emerald=new THREE.Color('#137c3b'),lime=new THREE.Color('#a3d337');
  for(const mesh of meshes){const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   for(const m of mats){
    if(/Street_asphalt|Street_pavement|Street_wood/i.test(mesh.name)){const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');g.fillStyle=/wood/i.test(mesh.name)?'#a87950':'#b6b9b4';g.fillRect(0,0,256,256);let s=59;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};for(let k=0;k<7000;k++){g.fillStyle=k%2?'#bfc3ba':'#969d97';g.globalAlpha=.22;g.fillRect(rand()*256,rand()*256,1+rand(),/wood/i.test(mesh.name)?8:1.2);}g.globalAlpha=1;const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(8,8);tx.anisotropy=8;m.map=tx;}
    if(/leaf|foliage/i.test(mesh.name)){m.color.set('#ffffff');const colours=mesh.geometry.attributes.color;if(colours){for(let i=0;i<colours.count;i++){const brightness=clamp((colours.getX(i)+colours.getY(i)+colours.getZ(i))/.9);const c=emerald.clone().lerp(lime,brightness);colours.setXYZ(i,c.r,c.g,c.b);}colours.needsUpdate=true;}else m.color.set('#3caa3a');}
    if(/grass|vegetation|world.ground/i.test(mesh.name))m.color.set('#70a82c');if(/continuous.world.ground/i.test(mesh.name)){m.color.set('#ffffff');m.map=grassTexture;m.roughness=1;}
   }
  }
 }
 }
 const composer=new EffectComposer(r);composer.addPass(new RenderPass(scene,camera));
 const depthRT=new THREE.WebGLRenderTarget(W,H,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
 if(realistic){
  const contactAO=new ShaderPass({uniforms:{tDiffuse:{value:null},tDepth:{value:depthRT.texture},inverseProjection:{value:camera.projectionMatrixInverse},resolution:{value:new THREE.Vector2(W,H)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
   #include <packing>
   uniform sampler2D tDiffuse,tDepth;uniform mat4 inverseProjection;uniform vec2 resolution;varying vec2 vUv;
   vec3 viewPos(vec2 uv){float d=unpackRGBAToDepth(texture2D(tDepth,uv));vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
   void main(){vec4 c=texture2D(tDiffuse,vUv);float depth=unpackRGBAToDepth(texture2D(tDepth,vUv));if(depth>.99998){gl_FragColor=c;return;}vec3 p=viewPos(vUv),n=normalize(cross(dFdx(p),dFdy(p)));if(n.z<0.)n=-n;float ao=0.;vec2 radius=vec2(.22*1144.)/resolution/max(.1,-p.z);for(int i=0;i<16;i++){float a=float(i)*2.399963;float r=sqrt((float(i)+.5)/16.);vec3 d=viewPos(clamp(vUv+vec2(cos(a),sin(a))*radius*r,vec2(.001),vec2(.999)))-p;float l=length(d);ao+=max(0.,dot(n,d/max(.0001,l))-.08)*max(0.,1.-l/.22);}float shade=1.-min(.32,ao*.22);gl_FragColor=vec4(c.rgb*shade,c.a);}`});contactAO.uniforms.tDepth.value=depthRT.texture;composer.addPass(contactAO);
 }
 // Camera-depth and sun-depth ray marching makes the yellow shafts respect 3D occluders.
 const solarDepth=new THREE.WebGLRenderTarget(2048,2048,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
 const solarCamera=new THREE.OrthographicCamera(-12,12,12,-12,.1,70),solarMatrix=new THREE.Matrix4(),sunDirection=new THREE.Vector3(-.55,.78,-.30).normalize();
 let sunRays;
 if(realistic){
  sunRays=new ShaderPass({uniforms:{tDiffuse:{value:null},tDepth:{value:null},tSunDepth:{value:null},inverseProjection:{value:null},cameraWorld:{value:null},solarMatrix:{value:null},sunDirection:{value:sunDirection},strength:{value:.15},sunScreen:{value:new THREE.Vector2()}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
   #include <packing>
   uniform sampler2D tDiffuse,tDepth,tSunDepth;uniform mat4 inverseProjection,cameraWorld,solarMatrix;uniform vec3 sunDirection;uniform float strength;varying vec2 vUv;
   float visibility(vec3 world){vec4 q=solarMatrix*vec4(world,1.);vec3 uv=q.xyz/q.w*.5+.5;if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.||uv.z<0.||uv.z>1.)return 1.;float shadow=unpackRGBAToDepth(texture2D(tSunDepth,uv.xy));return step(uv.z-.0015,shadow);}
   void main(){vec4 c=texture2D(tDiffuse,vUv);float depth=unpackRGBAToDepth(texture2D(tDepth,vUv));vec4 v=inverseProjection*vec4(vUv*2.-1.,depth*2.-1.,1.);vec3 endpoint=v.xyz/v.w;float rayLength=min(length(endpoint),42.);vec3 origin=cameraWorld[3].xyz,dir=normalize(mat3(cameraWorld)*endpoint);float mu=clamp(dot(dir,sunDirection),-1.,1.);float phase=.18+.42*(1.-.55*.55)/pow(1.+.55*.55-1.1*mu,1.5);float jitter=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);float ds=rayLength/64.,scatter=0.,transmittance=1.;for(int i=0;i<64;i++){vec3 world=origin+dir*(float(i)+jitter)*ds;float density=.008*exp(-max(world.y,0.)*.14);float extinction=exp(-density*ds);scatter+=visibility(world)*transmittance*(1.-extinction);transmittance*=extinction;}vec3 haze=vec3(.23,.33,.42)*(1.-transmittance);vec3 golden=vec3(1.,.80,.18)*scatter*phase*strength*1.9;gl_FragColor=vec4(c.rgb*mix(1.,transmittance,.45)+haze+golden,c.a);}`});
  Object.assign(sunRays.uniforms.tDepth,{value:depthRT.texture});Object.assign(sunRays.uniforms.tSunDepth,{value:solarDepth.texture});sunRays.uniforms.inverseProjection.value=camera.projectionMatrixInverse;sunRays.uniforms.cameraWorld.value=camera.matrixWorld;sunRays.uniforms.solarMatrix.value=solarMatrix;composer.addPass(sunRays);
 }
 const dof=new ShaderPass(BokehShader,'tColor');Object.assign(dof.uniforms.tDepth,{value:depthRT.texture});dof.uniforms.focus.value=2.0;dof.uniforms.aspect.value=W/H;dof.uniforms.aperture.value=.00055;dof.uniforms.maxblur.value=.002;dof.uniforms.nearClip.value=camera.near;dof.uniforms.farClip.value=camera.far;composer.addPass(dof);
 const vignette=new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float f=1.-.18*dot((vUv-.5)*1.5,(vUv-.5)*1.5);gl_FragColor=vec4(c.rgb*f,c.a);}'});composer.addPass(vignette);if(enhanced){r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.18;if(vibrant)composer.addPass(new UnrealBloomPass(new THREE.Vector2(W,H),.18,.45,1.1));}composer.addPass(new OutputPass());if(realistic){composer.addPass(new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float y=dot(c.rgb,vec3(.2126,.7152,.0722));vec3 rgb=mix(vec3(y),c.rgb,1.27);rgb=(rgb-.5)*1.045+.5;gl_FragColor=vec4(clamp(rgb,0.,1.),c.a);}'}));}composer.setSize(W,H);

 if(vibrant){
  r.shadowMap.type=THREE.PCFSoftShadowMap;key.intensity=3.0;key.color.set('#ffdda0');hemi.intensity=1.75;hemi.color.set('#9cbff3');hemi.groundColor.set('#7e6f8a');scene.fog=new THREE.Fog('#cddbd8',22,80);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(120,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=clamp(d.y,0.,1.);vec3 c=mix(vec3(.80,.79,.65),vec3(.22,.46,.78),pow(h,.48));float a=max(dot(d,normalize(vec3(-.55,.60,-.58))),0.);c+=vec3(1.,.65,.28)*(.20*pow(a,20.)+1.6*pow(a,1600.));gl_FragColor=vec4(c,1.);}'}));scene.add(sky);scene.background=null;
 }
 let atmosphere;
 if(realistic){
  r.shadowMap.type=THREE.PCFSoftShadowMap;r.toneMappingExposure=.85;key.color.set('#fff0b8');key.intensity=3.8;key.shadow.normalBias=.006;key.shadow.bias=-.00012;hemi.intensity=.55;hemi.color.set('#9cc7ff');hemi.groundColor.set('#759948');scene.fog=new THREE.FogExp2('#b5d9d0',.004);
  atmosphere=new Sky();atmosphere.scale.setScalar(1000);atmosphere.material.fragmentShader=atmosphere.material.fragmentShader.replace('vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );','vec3 texColor = mix(vec3(.17,.43,.90),vec3(.012,.12,.65),smoothstep(0.,.60,direction.y)); texColor += vec3(1.,.92,.62) * (sundisc * 7. + exp((cosTheta-1.)*180.)*.35);').replace('vec3 skyAmbient = Lin * 0.04 + vec3( 0.0, 0.0003, 0.00075 );','vec3 skyAmbient = vec3(.55,.64,.82);').replace('vec3 sunColor = vSunE * Fex * 0.22 * 0.04;','vec3 sunColor = vec3(1.3,1.20,.91);').replace('vec3 cloudAerial = mix( texColor, cloudColor, Fex );','vec3 cloudAerial = cloudColor;');const a=atmosphere.material.uniforms;a.turbidity.value=2.0;a.rayleigh.value=2.6;a.mieCoefficient.value=.004;a.mieDirectionalG.value=.8;a.sunPosition.value.set(-.55,.78,-.30).normalize();a.cloudScale.value=.00035;a.cloudCoverage.value=.46;a.cloudDensity.value=.95;a.cloudElevation.value=.30;a.time.value=0;scene.add(atmosphere);scene.background=null;
  const environmentScene=new THREE.Scene();const copy=atmosphere.clone();environmentScene.add(copy);a.showSunDisc.value=false;const pmrem=new THREE.PMREMGenerator(r);scene.environment=pmrem.fromScene(environmentScene,.04,.1,1500).texture;scene.environmentIntensity=.40;a.showSunDisc.value=true;pmrem.dispose();
 }
 // night: star dome + moon, toggled per frame by frame({night})
 const nightDome=new THREE.Mesh(new THREE.SphereGeometry(140,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{moon:{value:new THREE.Vector3(.45,.5,.74).normalize()}},vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 d;uniform vec3 moon;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec3 n=normalize(d);float y=clamp(abs(n.y),0.,1.);vec3 c=mix(vec3(.10,.17,.38),vec3(.02,.04,.14),pow(y,.55));vec2 q=vec2(atan(n.x,n.z)*70.,abs(n.y)*140.);vec2 g=floor(q);vec2 fr=fract(q)-.5;float s=step(.9955,h(g))*smoothstep(.22,.0,length(fr));c+=vec3(1.,.95,.8)*s*1.6*smoothstep(.05,.3,y);float m=max(dot(n,moon),0.);c+=vec3(.92,.96,1.)*(smoothstep(.9988,.9993,m)*1.4+pow(m,40.)*.3);gl_FragColor=vec4(c,1.);}'}));nightDome.visible=false;nightDome.userData.noOutline=true;scene.add(nightDome);
 const vec=a=>new THREE.Vector3(...a),limbMat=new THREE.MeshBasicMaterial({color:INK});
 function stroke(){const m=new THREE.Mesh(new THREE.CylinderGeometry(.010,.010,1,8),limbMat);m.castShadow=true;scene.add(m);return m;}
 function line(m,a,b){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=Math.max(.001,d.length());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}

 const depthMaterials=new Map();
 function prepare(){scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.isMesh&&!depthMaterials.has(o)){const make=m=>new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:m.map,clippingPlanes:m.clippingPlanes,clipShadows:true,alphaTest:m.transparent?.04:0,side:m.side});depthMaterials.set(o,Array.isArray(o.material)?o.material.map(make):make(o.material));}});}
 function frame({position,target,fov=80,focus,strokeOrigin,up=[0,1,0],shadow=8,solar=12,aperture=.00055,maxblur=.002,sun=[-.42,.82,.50],night=0,studio=0},beforeRender){
  const nt=night>.5,st=studio>.5;if(atmosphere)atmosphere.visible=!(nt||st);nightDome.visible=nt||st;
  key.color.set(nt?'#9db8ff':'#fff0b8');key.intensity=nt?1.3:3.8;hemi.intensity=nt?.28:.55;hemi.color.set(nt?'#6f86d6':'#9cc7ff');hemi.groundColor.set(nt?'#2a3a60':'#759948');scene.environmentIntensity=nt?.1:.4;if(scene.fog)scene.fog.color.set(nt?'#18264a':'#b5d9d0');if(sunRays)sunRays.uniforms.strength.value=nt?0:.15;r.toneMappingExposure=nt?1.0:.85;
  sunDirection.set(...sun).normalize();if(atmosphere)atmosphere.material.uniforms.sunPosition.value.copy(sunDirection);
  key.shadow.camera.left=key.shadow.camera.bottom=-shadow;key.shadow.camera.right=key.shadow.camera.top=shadow;key.shadow.camera.far=Math.max(60,shadow*4);key.shadow.camera.updateProjectionMatrix();
  solarCamera.left=solarCamera.bottom=-solar;solarCamera.right=solarCamera.top=solar;solarCamera.updateProjectionMatrix();dof.uniforms.aperture.value=aperture;dof.uniforms.maxblur.value=maxblur;
  camera.fov=fov;camera.position.fromArray(position);camera.up.fromArray(up);camera.lookAt(new THREE.Vector3(...target));camera.updateProjectionMatrix();camera.updateMatrixWorld(true);if(beforeRender)beforeRender();nightDome.position.copy(camera.position);scene.updateMatrixWorld(true);
  // Fixed screen-pixel hierarchy stays readable when the camera moves or rolls.
  ink.uniforms.th.value=4.5;
  const aim=new THREE.Vector3(...target);key.target.position.copy(aim);key.position.copy(aim).addScaledVector(sunDirection,24);key.target.updateMatrixWorld(true);r.shadowMap.needsUpdate=true;dof.uniforms.focus.value=focus||camera.position.distanceTo(aim);
  solarCamera.position.copy(aim).addScaledVector(sunDirection,25);solarCamera.lookAt(aim);solarCamera.updateMatrixWorld(true);solarMatrix.multiplyMatrices(solarCamera.projectionMatrix,solarCamera.matrixWorldInverse);
  prepare();const saved=[];scene.traverse(o=>{if(o.isMesh){saved.push([o,o.material]);o.material=depthMaterials.get(o);}});const bg=scene.background;scene.background=new THREE.Color('white');r.setRenderTarget(solarDepth);r.clear();r.render(scene,solarCamera);r.setRenderTarget(depthRT);r.clear();r.render(scene,camera);r.setRenderTarget(null);scene.background=bg;for(const[o,m]of saved)o.material=m;composer.render();
 }
 async function loadGLB(url,importance='background'){const asset=await new GLTFLoader().loadAsync(url);style(asset.scene,{importance});scene.add(asset.scene);return asset.scene;}
 return {THREE,scene,camera,renderer:r,loadGLB,style,frame,prepare,ink,limbMat,key,hemi,atmosphere,stroke,line,vec,INK,band,constants:{width:W,height:H}};
}
