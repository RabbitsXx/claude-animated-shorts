import {createEngine} from './engine2.js';
import {anchors} from './tracks.js';
const config=await(await fetch('/config.json')).json();
const post=async(route,value)=>{const r=await fetch(route,{method:'POST',headers:{'x-render-token':config.token},body:JSON.stringify(value)});if(!r.ok)throw Error(await r.text());};
try{
 const canvas=document.createElement('canvas');document.body.appendChild(canvas);
 const ctx=await createEngine(canvas,{mode:'preview'});
 const story=await import('/repo/'+config.scene);
 const words=config.words,T=anchors(words);
 const build=await story.build(ctx,{words,T,duration:config.duration});
 if(typeof build.update!=='function')throw Error('scene must return {update(t)}');
 const {THREE}=ctx;
 // screen-space overlay (flash / tint / captions) drawn after the 3D composer
 const overlay=document.createElement('canvas');overlay.width=1080;overlay.height=1920;const pen=overlay.getContext('2d');
 const texture=new THREE.CanvasTexture(overlay);texture.colorSpace=THREE.SRGBColorSpace;
 const hud=new THREE.Scene(),hudCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 hud.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false})));
 // Captions: short white phrases with a heavy dark outline in the lower-middle frame (reference: y ~ 0.69H).
 function chunkAt(t){
  const a=words.findIndex(w=>t>=w.start&&t<w.end+.12);if(a<0)return null;
  let first=0;for(let i=0;i<a;i++)if(/[.!?,:]$/.test(words[i].word)||i-first>=2)first=i+1;
  let end=first;while(end<words.length&&end-first<3){const w=words[end++].word;if(/[.!?,:]$/.test(w))break;}
  return words.slice(first,end).map(w=>w.word).join(' ');
 }
 function drawOverlay(t,state){
  pen.clearRect(0,0,1080,1920);
  if(state.flash>0){pen.fillStyle=state.flashColor||'#ffffff';pen.globalAlpha=Math.min(1,state.flash);pen.fillRect(0,0,1080,1920);pen.globalAlpha=1;}
  if(state.fade>0){pen.fillStyle='#000';pen.globalAlpha=Math.min(1,state.fade);pen.fillRect(0,0,1080,1920);pen.globalAlpha=1;}
  if(config.captions&&state.captions!==false){
   const text=chunkAt(t);
   if(text){pen.font='900 74px "Arial Black", Arial, sans-serif';pen.textAlign='center';pen.textBaseline='middle';pen.lineJoin='round';
    let scale=1;const mw=pen.measureText(text).width;if(mw>940)scale=940/mw;pen.save();pen.translate(540,1325);pen.scale(scale,scale);
    pen.strokeStyle='#17120f';pen.lineWidth=16;pen.strokeText(text,0,0);pen.fillStyle='#fffdf5';pen.fillText(text,0,0);pen.restore();}
  }
  if(state.overlay)state.overlay(pen,{width:1080,height:1920});
  texture.needsUpdate=true;
 }
 function render(t){
  const state=build.update(t)||{};if(!state.camera?.position||!state.camera?.target)throw Error('update() must return camera.position/target at t='+t);
  ctx.frame(state.camera,state.beforeRender);
  drawOverlay(t,state);ctx.renderer.autoClear=false;ctx.renderer.clearDepth();ctx.renderer.render(hud,hudCam);ctx.renderer.autoClear=true;
  return state;
 }
 const times=config.times;
 const blurCanvas=document.createElement('canvas');blurCanvas.width=1080;blurCanvas.height=1920;
 const state0blur=(t)=>build.update(t).blur||0;
 // warm-up + determinism check on the first requested time
 render(times[0]);render(times[0]+.5);render(times[0]);const a=canvas.toDataURL('image/png');render(times[0]+1);render(times[0]);const b=canvas.toDataURL('image/png');
 if(a!==b)throw Error('Non-deterministic seek at t='+times[0]);
 const meta=[];
 for(let i=0;i<times.length;i++){
  const t=times[i];let state=render(t);let dataUrl;
  if((state.blur||0)>0){const N=6,acc=blurCanvas.getContext('2d');for(let k=0;k<N;k++){state=render(t+(k/(N-1)-.5)*state0blur(t));acc.globalAlpha=1/(k+1);acc.drawImage(canvas,0,0);}acc.globalAlpha=1;dataUrl=blurCanvas.toDataURL('image/jpeg',config.quality||.95);}
  else dataUrl=canvas.toDataURL('image/jpeg',config.quality||.95);
  const file=`f${String(config.indexBase+i).padStart(5,'0')}.jpg`;
  await post('/capture',{file,data:dataUrl});
  meta.push({file,t,reach:state.reach||0,note:state.note||''});
 }
 const gl=ctx.renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'unreported';
 if(/swiftshader|llvmpipe|software/i.test(gpu))throw Error('Hardware GPU required: '+gpu);
 await post('/done',{pass:true,gpu,count:meta.length,meta});
}catch(error){await post('/done',{error:String(error.stack||error)});}
