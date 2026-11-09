// A ground strip whose heights come from a function of x and a dig progress per position, with a glowing ribbon over the part that is
// changing (the reference film has a golden glow along the rail). Road-local coordinates: x along the strip, z across, y up. The caller puts it
// in a tilted group if the ground is tilted. stripHeight/stripColumns are pure and tested; buildDigStrip only displays them.
const clamp01=x=>Math.max(0,Math.min(1,x));
export const stripHeight=(heightFn,x,weight,progress)=>heightFn(x)*weight*progress;
export const stripColumns=()=>({across:[-2.1,-1.7,-1.0,0,1.0,1.7,2.1],shoulder:[0,0,1,1,1,0,0]});
export function buildDigStrip(ctx,{heightFn,maxHeight=1,length=44,step=.02,dirt='#7d5630',crest='#ebbd7c',name='dig strip ground'}){
 const {THREE}=ctx,{across,shoulder}=stripColumns(),n=Math.round(length/step)+1,cols=across.length;
 const geo=new THREE.BufferGeometry(),pos=new Float32Array(n*cols*3),col=new Float32Array(n*cols*3),idx=[];
 const c0=new THREE.Color(dirt),c1=new THREE.Color(crest);
 for(let i=0;i<n;i++)for(let j=0;j<cols;j++){const o=(i*cols+j)*3;pos[o]=i*step;pos[o+2]=across[j];}
 for(let i=0;i<n-1;i++)for(let j=0;j<cols-1;j++){const a=i*cols+j,b=a+1,c=a+cols,d=c+1;idx.push(a,c,b,b,c,d);}
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setIndex(idx);
 const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));mesh.name=name;mesh.receiveShadow=true;mesh.userData.noOutline=true;
 let sig='';
 function setDig(progress,key){ // the strip is rebuilt only when the signature changes
  if(key===sig)return;sig=key;
  for(let i=0;i<n;i++){const x=i*step,p=clamp01(progress(x));
   for(let j=0;j<cols;j++){const o=(i*cols+j)*3,y=stripHeight(heightFn,x,shoulder[j],p)+(shoulder[j]?0:-.02);pos[o+1]=y;
    const k=maxHeight?clamp01(stripHeight(heightFn,x,1,p)/maxHeight):0,m=c0.clone().lerp(c1,k*.8);col[o]=m.r;col[o+1]=m.g;col[o+2]=m.b;}}
  geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
 }
 const GN=240,gp=new Float32Array(GN*2*3),gi=[];for(let i=0;i<GN-1;i++){const a=i*2;gi.push(a,a+1,a+2,a+1,a+3,a+2);}
 const ggeo=new THREE.BufferGeometry();ggeo.setAttribute('position',new THREE.BufferAttribute(gp,3));ggeo.setIndex(gi);
 const glow=new THREE.Mesh(ggeo,new THREE.MeshBasicMaterial({color:'#ffd36a',transparent:true,opacity:.9,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));glow.name='road glow tag';glow.userData.noOutline=true;glow.frustumCulled=false;
 function setGlow(xa,xb,progress,visible=true){
  glow.visible=visible&&xb>xa;if(!glow.visible)return;
  for(let i=0;i<GN;i++){const x=xa+(xb-xa)*i/(GN-1),y=stripHeight(heightFn,x,1,clamp01(progress(x)))+.03;
   for(let j=0;j<2;j++){const o=(i*2+j)*3;gp[o]=x;gp[o+1]=y;gp[o+2]=j?.16:-.16;}}
  ggeo.attributes.position.needsUpdate=true;ggeo.computeBoundingSphere();
 }
 const group=new THREE.Group();group.name='Hill road';group.add(mesh,glow);
 return {root:group,mesh,setDig,setGlow,length,step,heightAt:(x,p=1)=>stripHeight(heightFn,x,1,p)};
}
