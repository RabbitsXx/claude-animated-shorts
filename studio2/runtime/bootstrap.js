import {createEngine} from './engine2.js';
import {anchors,dissolving} from './tracks.js';
import {createCollider} from './collide.js';
import {measureDressing} from './dressing.js';
import {loadCharacterParts} from '/repo/studio2/library/character-parts.mjs';
import {chunkAt as chunkWords} from '/repo/studio2/lib/captions.mjs';
const config=await(await fetch('/config.json')).json();
const post=async(route,value)=>{const r=await fetch(route,{method:'POST',headers:{'x-render-token':config.token},body:JSON.stringify(value)});if(!r.ok)throw Error(await r.text());};
try{
 const canvas=document.createElement('canvas');document.body.appendChild(canvas);
 const ctx=await createEngine(canvas,{mode:'preview'});
 await loadCharacterParts().catch(e=>console.warn('character parts not loaded: '+e.message)); // Blender-sculpted hair, cap and sneaker for every actor of every film
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
 const chunkAt=(t)=>chunkWords(words,t,config.captionWords||3); // film.json captionWords: the reference shows 1-2 words at a time
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
 function render(t,opt){
  const state=build.update(t,opt)||{};if(!state.camera?.position||!state.camera?.target)throw Error('update() must return camera.position/target at t='+t);
  ctx.frame(state.camera,state.beforeRender);
  drawOverlay(t,state);ctx.renderer.autoClear=false;ctx.renderer.clearDepth();ctx.renderer.render(hud,hudCam);ctx.renderer.autoClear=true;
  return state;
 }
 const times=config.times;
 const collider=config.collide?createCollider(THREE):null,allow=(build.collide&&build.collide.allow)||[];
 const intentHits=(state)=>{state.intentRows=undefined;if(!state.intent||!collider)return [];const m=collider.measureIntent({scene:ctx.scene,camera:state.camera,track:state.track||{},intent:state.intent,allow});state.intentRows={id:state.intent.id,rows:m.rows,waive:state.intent.waive};return [];}; // advisory: judged per moment by studio2/intent-sheet.py (share of frames, waiver), never a collision row
 const hitsAt=(state)=>collider?[...collider.check({scene:ctx.scene,actors:ctx.actors||[],allow}),...collider.checkPairs({scene:ctx.scene,actors:ctx.actors||[],allow,onlyMovers:true}),...collider.checkShot({scene:ctx.scene,actors:ctx.actors||[],allow,camera:state.camera,subject:state.subject}),...collider.checkGrips(state.grips),...intentHits(state)]:[];
 if(collider)for(const t of times){build.update(t);collider.trackMovers(ctx.scene);} // pass 1 of the gate: which parts move during the film
 const blurCanvas=document.createElement('canvas');blurCanvas.width=1080;blurCanvas.height=1920;
 const state0blur=(t)=>build.update(t).blur||0;
 const isDissolving=(st)=>dissolving(st.dissolveK);
 if(config.collide==='only'){ // overlap check only: no image, no determinism pass, much faster
  const metaOnly=[];
  for(let i=0;i<times.length;i++){const t=times[i];let state=build.update(t)||{};const extra=[];
   if(isDissolving(state)){const o=build.update(t,{outgoing:true})||{};extra.push(...hitsAt(o));state=build.update(t)||{};}
   const cm=state.camera,r3=(a)=>a.map(x=>Math.round(x*1000)/1000);metaOnly.push({t,reach:state.reach||0,note:state.note||'',cam:cm&&cm.position&&cm.target?{p:r3(cm.position),t:r3(cm.target),fov:cm.fov||40}:null,dress:Math.abs(t/.2-Math.round(t/.2))<.01&&cm&&cm.position&&cm.target?measureDressing(THREE,{scene:ctx.scene,camera:cm}):undefined,hits:[...extra,...hitsAt(state)],intent:state.intentRows});}
  await post('/done',{pass:true,gpu:'n/a (collision check only)',count:metaOnly.length,meta:metaOnly});
  throw new Error('__collide_done__');
 }
 // warm-up + determinism check on the first requested time
 render(times[0]);render(times[0]+.5);render(times[0]);const a=canvas.toDataURL('image/png');render(times[0]+1);render(times[0]);const b=canvas.toDataURL('image/png');
 if(a!==b)throw Error('Non-deterministic seek at t='+times[0]);
 const meta=[];
 for(let i=0;i<times.length;i++){
  const t=times[i];let state=render(t);let dataUrl;let hits=hitsAt(state);
  if(isDissolving(state)){const k=state.dissolveK,acc=blurCanvas.getContext('2d');const outState=render(t,{outgoing:true});hits=[...hitsAt(outState),...hits];acc.globalAlpha=1;acc.drawImage(canvas,0,0);state=render(t);acc.globalAlpha=k;acc.drawImage(canvas,0,0);acc.globalAlpha=1;dataUrl=blurCanvas.toDataURL('image/jpeg',config.quality||.95);}
  else if((state.blur||0)>0){const N=6,acc=blurCanvas.getContext('2d');for(let k=0;k<N;k++){state=render(t+(k/(N-1)-.5)*state0blur(t));acc.globalAlpha=1/(k+1);acc.drawImage(canvas,0,0);}acc.globalAlpha=1;dataUrl=blurCanvas.toDataURL('image/jpeg',config.quality||.95);}
  else dataUrl=canvas.toDataURL('image/jpeg',config.quality||.95);
  const file=`f${String(config.indexBase+i).padStart(5,'0')}.jpg`;
  await post('/capture',{file,data:dataUrl});
  meta.push({file,t,reach:state.reach||0,note:state.note||'',hits});
 }
 const gl=ctx.renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info'),gpu=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'unreported';
 if(/swiftshader|llvmpipe|software/i.test(gpu))throw Error('Hardware GPU required: '+gpu);
 await post('/done',{pass:true,gpu,count:meta.length,meta});
}catch(error){if(!String(error&&error.message).includes('__collide_done__'))await post('/done',{error:String(error.stack||error)});}
