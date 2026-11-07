// 2D facial ink drawn onto a texture that sits on the 3D head surface. All parameters are continuous
// so brows, lids, pupils and mouth can be keyed on independent timings.
export const FACE0={eyeL:1,eyeR:1,lookX:0,lookY:0,browL:0,browR:0,angL:0,angR:0,smile:0,open:0,width:1,teeth:0,round:0,smirk:0,squint:0,blush:0,sweat:0,blink:0,tongue:0};
export const FACES={
 neutral:{},
 deadpan:{eyeL:.55,eyeR:.55,browL:-.25,browR:-.25,smile:-.05,width:.8},
 proud:{squint:.45,browL:.35,browR:.35,smile:.8,open:.15,teeth:1,blush:.25,lookY:-.1},
 grin:{squint:.35,browL:.2,browR:.35,smile:1,open:.25,teeth:1},
 laugh:{squint:1,browL:.45,browR:.45,smile:1,open:.9,teeth:1,width:1.15,blush:.4},
 effort:{eyeL:.35,eyeR:.35,browL:-.35,browR:-.35,angL:.9,angR:.9,smile:-.1,open:.35,teeth:1,width:1.1,sweat:1},
 strain:{squint:.9,browL:-.45,browR:-.45,angL:.8,angR:.8,smile:-.6,open:.3,teeth:1,width:1.2,sweat:1},
 tired:{eyeL:.5,eyeR:.5,browL:.1,browR:.1,angL:-.6,angR:-.6,smile:-.55,width:.85,lookY:-.5,sweat:.4},
 sad:{eyeL:.85,eyeR:.85,browL:.35,browR:.35,angL:-1,angR:-1,smile:-.8,width:.85,lookY:-.35},
 shock:{eyeL:1.35,eyeR:1.35,browL:.9,browR:.9,open:.8,round:.7,width:.7,smile:0},
 scared:{eyeL:1.25,eyeR:1.25,browL:.6,browR:.6,angL:-.8,angR:-.8,open:.55,round:.4,smile:-.4,teeth:1,sweat:1,lookY:.1},
 think:{eyeL:.8,eyeR:.8,browL:.25,browR:-.2,angL:-.3,angR:.5,smile:-.1,width:.7,lookX:.6,lookY:.5,smirk:.3},
 determined:{eyeL:.75,eyeR:.75,browL:-.3,browR:-.3,angL:.7,angR:.7,smile:.15,width:.95,teeth:0,smirk:.2},
 smug:{eyeL:.6,eyeR:.6,browL:.1,browR:.5,angR:-.2,smile:.55,smirk:.9,width:.9,squint:.2},
 smirk:{eyeL:.7,eyeR:.7,browL:-.1,browR:.35,smile:.45,smirk:1,width:.9},
 relief:{squint:.7,browL:.3,browR:.3,angL:-.4,angR:-.4,smile:.7,open:.35,round:.2,blush:.15},
 joy:{squint:.7,browL:.5,browR:.5,smile:1,open:.6,teeth:1,blush:.5},
 gasp:{eyeL:1.2,eyeR:1.2,browL:.8,browR:.8,open:.5,round:1,width:.55},
 ugh:{squint:.8,browL:-.3,browR:-.3,angL:.5,angR:.5,smile:-.9,open:.2,teeth:1,width:1.1},
};
export function faceParams(p){
 if(typeof p==='string'){if(!FACES[p])throw Error('Unknown face '+p);return {...FACE0,...FACES[p]};}
 return {...FACE0,...(p||{})};
}
export function mixFace(a,b,k){const A=faceParams(a),B=faceParams(b),o={};for(const n of Object.keys(FACE0))o[n]=A[n]+(B[n]-A[n])*k;return o;}
// keys: [[t,faceNameOrParams,ease?]...] -> params at t (ease arrives at key)
import {ease} from './tracks.js';
export function faceTrack(keys,t){
 if(t<=keys[0][0])return faceParams(keys[0][1]);
 const n=keys.length;if(t>=keys[n-1][0])return faceParams(keys[n-1][1]);
 let i=1;while(i<n-1&&t>keys[i][0])i++;
 const [t0,a]=keys[i-1],[t1,b,e='io']=keys[i];return mixFace(a,b,ease[e]((t-t0)/(t1-t0)));
}
export const CANVAS={w:512,h:420};
export function drawFace(pen,f,spec={}){
 const INK=spec.ink||'#351f22',W=512,H=420;
 pen.clearRect(0,0,W,H);pen.strokeStyle=INK;pen.fillStyle=INK;pen.lineCap=pen.lineJoin='round';
 if(spec.dummy){ // crash-test dummy: quartered target discs, stitched mouth
  for(const x of [150,362]){const y=150;pen.fillStyle='#fffaee';pen.lineWidth=8;pen.beginPath();pen.arc(x,y,52*(.8+Math.min(1.4,(x<256?f.eyeL:f.eyeR))*.2),0,7);pen.fill();pen.stroke();pen.fillStyle=INK;pen.beginPath();pen.moveTo(x,y);pen.arc(x,y,48*(.8+Math.min(1.4,(x<256?f.eyeL:f.eyeR))*.2),0,Math.PI/2);pen.fill();pen.beginPath();pen.moveTo(x,y);pen.arc(x,y,48*(.8+Math.min(1.4,(x<256?f.eyeL:f.eyeR))*.2),Math.PI,Math.PI*1.5);pen.fill();}
  pen.lineWidth=9;pen.beginPath();pen.moveTo(190,300);pen.lineTo(322,300+f.smile*-14);pen.stroke();for(let i=0;i<5;i++){pen.lineWidth=5;pen.beginPath();pen.moveTo(206+i*26,290);pen.lineTo(206+i*26,312);pen.stroke();}
  return;}
 const blinkClose=Math.max(0,Math.min(1,f.blink));
 // blush
 if(f.blush>0){pen.save();pen.globalAlpha=.5*Math.min(1,f.blush);pen.fillStyle='#f08a8a';for(const x of [92,420]){pen.beginPath();pen.ellipse(x,232,34,20,0,0,7);pen.fill();}pen.restore();}
 // eyes + brows
 for(const [i,x] of [145,367].entries()){
  const left=i===0,open=(left?f.eyeL:f.eyeR),bh=left?f.browL:f.browR,ang=left?f.angL:f.angR;
  const lid=Math.max(0,open*(1-blinkClose)*(1-.6*Math.min(1,f.squint)));
  const rx=36*Math.min(1.1,.9+open*.12),ry=36*lid;
  pen.lineWidth=7;
  if(f.squint>.85||lid<.09){ // happy arc or closed lid line
   pen.beginPath();
   if(f.squint>.85&&blinkClose<.5){pen.lineWidth=9;pen.arc(x,152,30,Math.PI*1.12,Math.PI*1.88);}
   else{pen.moveTo(x-34,150);pen.quadraticCurveTo(x,156,x+34,150);}
   pen.stroke();
  }else{
   pen.fillStyle='#fffaee';pen.beginPath();pen.ellipse(x,145,rx,Math.max(3,ry),0,0,7);pen.fill();pen.stroke();
   const px=x+Math.max(-1,Math.min(1,f.lookX))*(rx-17),py=145+Math.max(-1,Math.min(1,f.lookY))*Math.max(0,ry-13)*-1;
   pen.fillStyle=INK;pen.beginPath();pen.ellipse(px,py,Math.min(13,rx*.37),Math.min(Math.max(3,ry)*.7,16),0,0,7);pen.fill();
   // eyelid shadow when partly closed
   if(f.eyeL<.8||f.eyeR<.8||f.squint>.1){pen.lineWidth=8;pen.beginPath();pen.moveTo(x-rx,145-ry*.55);pen.quadraticCurveTo(x,145-ry*.85,x+rx,145-ry*.55);pen.stroke();}
  }
  // brow: inner end is toward the nose
  const inner=left?1:-1,y0=84-bh*34;pen.lineWidth=11;pen.beginPath();
  const iy=y0+ang*16,oy=y0-ang*10;pen.moveTo(x-inner*40,oy);pen.quadraticCurveTo(x,(iy+oy)/2-5,x+inner*40,iy);pen.stroke();
 }
 // glasses
 if(spec.glasses){pen.lineWidth=7;for(const x of [145,367]){pen.beginPath();pen.ellipse(x,146,52,50,0,0,7);pen.stroke();}pen.beginPath();pen.moveTo(197,142);pen.quadraticCurveTo(256,126,315,142);pen.stroke();}
 // nose
 pen.lineWidth=7;pen.beginPath();pen.moveTo(256,186);pen.lineTo(244,226);pen.lineTo(268,230);pen.stroke();
 // mouth
 const w=52*f.width,cy=300,smile=f.smile,open=f.open,sm=f.smirk;
 const lc=[256-w,cy-8-smile*10+sm*10],rc=[256+w,cy-8-smile*10-sm*14];
 pen.lineWidth=9;
 if(open>.04){
  const o=open*44,mid=cy+smile*18;
  pen.beginPath();
  if(f.round>0){const rr=w*(1-f.round)+22*f.round;pen.ellipse(256,cy+10,rr,Math.max(8,o*(.7+f.round*.5)),0,0,7);}
  else{pen.moveTo(...lc);pen.quadraticCurveTo(256,mid-6,...rc);pen.quadraticCurveTo(256,mid+o*1.35,...lc);}
  pen.closePath();pen.fillStyle='#6b2f37';pen.fill();
  pen.save();pen.clip();
  if(f.teeth>0){pen.fillStyle='#fffaf0';pen.fillRect(256-w-6,cy-26,w*2+12,12+open*10);}
  if(f.tongue>0||open>.5){pen.fillStyle='#e86c6c';pen.beginPath();pen.ellipse(256,cy+o*.95,w*.5,o*.35,0,0,7);pen.fill();}
  pen.restore();pen.stroke();
  if(f.teeth>0){pen.lineWidth=4;pen.beginPath();pen.moveTo(256-w+8,cy-12+open*10);pen.lineTo(256+w-8,cy-12+open*10);pen.stroke();}
 }else{
  pen.beginPath();pen.moveTo(...lc);pen.quadraticCurveTo(256,cy+smile*34+(smile<0?-6:2),...rc);pen.stroke();
  if(smile>.6){pen.lineWidth=5;for(const c of [lc,rc]){pen.beginPath();pen.moveTo(c[0]+(c===lc?-6:6),c[1]-12);pen.lineTo(c[0],c[1]);pen.stroke();}}
 }
 // moustache
 if(spec.moustache){pen.fillStyle=spec.moustache;pen.lineWidth=6;for(const s of [-1,1]){pen.beginPath();pen.moveTo(256,262);pen.bezierCurveTo(256+s*38,242,256+s*96,250,256+s*112,284);pen.bezierCurveTo(256+s*84,270,256+s*44,276,256,274);pen.closePath();pen.fill();pen.stroke();}}
 // soot smudge
 if(spec.smudge){pen.save();pen.globalAlpha=.28;pen.fillStyle=INK;pen.beginPath();pen.ellipse(120,200,26,14,.3,0,7);pen.fill();pen.beginPath();pen.ellipse(390,250,18,10,-.2,0,7);pen.fill();pen.restore();}
 // sweat drop
 if(f.sweat>0){pen.save();pen.globalAlpha=Math.min(1,f.sweat);pen.fillStyle='#8fd6f0';pen.lineWidth=6;const sx=spec.sweatX||450,sy=60+(1-Math.min(1,f.sweat))*10;pen.beginPath();pen.moveTo(sx,sy);pen.quadraticCurveTo(sx-26,sy+44,sx,sy+54);pen.quadraticCurveTo(sx+26,sy+44,sx,sy);pen.fill();pen.stroke();pen.restore();}
}
