// Deterministic particles: every particle is a closed-form function of absolute time, so seeking is exact.
import {rand} from './tracks.js';
export function makeFx(ctx,{max=1500}={}){
 const {THREE,scene,camera}=ctx;
 const geo=new THREE.PlaneGeometry(1,1);
 const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d');
 const grad=g.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.45,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,64,64);
 const disc=new THREE.CanvasTexture(cv);disc.colorSpace=THREE.SRGBColorSpace;
 const mk=(map)=>{const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),max);m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.userData.noOutline=true;m.setColorAt(0,new THREE.Color('#fff'));scene.add(m);return m;};
 const soft=mk(disc),rect=mk(null);
 const bursts=[];const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),P=new THREE.Vector3(),S=new THREE.Vector3(),C=new THREE.Color();
 // kinds: spark (hot dots, gravity), dust (grow+fade), puff (soft smoke), star, confetti (tumbling rectangles)
 function burst(b){
  const o={t0:0,life:1,count:20,pos:[0,0,0],dir:[0,1,0],spread:.6,speed:[1,3],gravity:[0,-9.8,0],size:[.03,.06],colors:['#ffd45a'],kind:'spark',seed:1,drag:0,grow:0,spin:6,fade:true,...b};
  const r=rand(o.seed);o.items=Array.from({length:o.count},()=>{
   const d=new THREE.Vector3(...o.dir).normalize();const a=new THREE.Vector3(r()-.5,r()-.5,r()-.5).multiplyScalar(2*o.spread);const v=d.add(a).normalize().multiplyScalar(o.speed[0]+(o.speed[1]-o.speed[0])*r());
   return {v,size:o.size[0]+(o.size[1]-o.size[0])*r(),color:o.colors[Math.floor(r()*o.colors.length)],delay:(o.stagger||0)*r(),rot:[r()*6.28,r()*6.28,r()*6.28],spin:[(r()-.5)*o.spin,(r()-.5)*o.spin,(r()-.5)*o.spin],ox:[(r()-.5)*(o.area?.[0]||0),(r()-.5)*(o.area?.[1]||0),(r()-.5)*(o.area?.[2]||0)]};
  });
  bursts.push(o);return o;
 }
 function update(t){
  let ns=0,nr=0;
  for(const b of bursts){
   for(const it of b.items){
    const tau=t-b.t0-it.delay;if(tau<0||tau>b.life)continue;
    const k=b.drag>0?(1-Math.exp(-b.drag*tau))/b.drag:tau;
    P.set(b.pos[0]+it.ox[0]+it.v.x*k+.5*b.gravity[0]*tau*tau,b.pos[1]+it.ox[1]+it.v.y*k+.5*b.gravity[1]*tau*tau,b.pos[2]+it.ox[2]+it.v.z*k+.5*b.gravity[2]*tau*tau);
    const f=tau/b.life;let sz=it.size;
    if(b.kind==='spark')sz*=(1-f*f);else if(b.kind==='dust'||b.kind==='puff')sz*=(1+b.grow*f);else if(b.kind==='star')sz*=Math.sin(Math.min(1,f)*Math.PI);
    C.set(it.color);
    if(b.kind==='dust'||b.kind==='puff')C.multiplyScalar(1-.55*f);   // fade towards the sky colour (no alpha per instance)
    if(b.kind==='confetti'){if(nr>=max)continue;E.set(it.rot[0]+it.spin[0]*tau,it.rot[1]+it.spin[1]*tau,it.rot[2]+it.spin[2]*tau);Q.setFromEuler(E);S.set(sz,sz*1.7,1);M.compose(P,Q,S);rect.setMatrixAt(nr,M);rect.setColorAt(nr,C);nr++;}
    else{if(ns>=max)continue;Q.copy(camera.quaternion);S.set(sz,sz,1);M.compose(P,Q,S);soft.setMatrixAt(ns,M);soft.setColorAt(ns,C);ns++;}
   }
  }
  soft.count=ns;rect.count=nr;for(const m of [soft,rect]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 }
 return {burst,update,clear(){bursts.length=0;}};
}
