// Flat clothing artwork for the one-piece, rounded-square body (look 'ref'). The body is ONE rounded box: its front face carries the
// detailed drawing (this file), the sides and back carry the same two colours split at the same waist line, so shirt and trousers
// never separate. Canvas v: 1 = top, 0 = bottom; x is measured from the centre of the front face.
export const BODY={splitV:.4,W:256,H:317,width:.38,height:.47,depth:.22,radius:.1,centerY:.215};
export const bodyTaper=(y,height)=>.95+(-y/height)*.34; // width factor: .78 at the top (chest), 1.12 at the bottom (hips)
export const bodyLean=(y,height)=>0*Math.pow((y+height/2)/height,2); // how far the body top tucks back behind the head, so the head's chin outline is in front of it
export const shoulderZ=(torsoY)=>-bodyLean(torsoY-BODY.centerY,BODY.height)-.012; // arm roots sit on the (tucked back) body surface, not in front of it
// Smooth normals welded by position: vertices duplicated at a seam (the faces of a box) share one normal, so an outline pushed along
// them has no gap and a deformed body (taper, lean) keeps a correct outline.
export function weldedNormals(positions,index=null){
 const n=positions.length/3,idx=index||Array.from({length:n},(_,i)=>i),key=i=>`${positions[i*3].toFixed(5)},${positions[i*3+1].toFixed(5)},${positions[i*3+2].toFixed(5)}`,acc=new Map();
 for(let t=0;t<idx.length;t+=3){
  const [a,b,c]=[idx[t],idx[t+1],idx[t+2]],P=i=>[positions[i*3],positions[i*3+1],positions[i*3+2]],A=P(a),B=P(b),C=P(c);
  const u=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],v=[C[0]-A[0],C[1]-A[1],C[2]-A[2]],f=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  for(const i of [a,b,c]){const k=key(i),s=acc.get(k)||[0,0,0];s[0]+=f[0];s[1]+=f[1];s[2]+=f[2];acc.set(k,s);}
 }
 const out=new Float32Array(n*3);
 for(let i=0;i<n;i++){const s=acc.get(key(i)),l=Math.hypot(...s)||1;out[i*3]=s[0]/l;out[i*3+1]=s[1]/l;out[i*3+2]=s[2]/l;}
 return out;
}
export const OVERALLS_STYLE={bibHalf:70};
export function shirtMarks(){ // a plain tee: collar, hem stitch, two sleeve seams at the edges, a chest emblem
 return {sleeveSeamX:[-1,1],vertical:[['collar',.88,1],['hem',.43,.47],['sleeve seam',.6,.82],['emblem',.54,.70]]};
}
export function overallsMarks(){ // dungarees over a shirt: bib, straps, buttons, a stitched pocket and a patch side by side
 return {bibHalf:OVERALLS_STYLE.bibHalf,bib:[.4,.86],straps:[.86,1],buttons:[.82,.86],pocket:[.48,.74],patch:[.5,.72],strapX:[-52,52],buttonX:[-52,52],pocketX:[-58,-8],patchX:[8,58]};
}
export function suitMarks(){ // jacket over a white shirt and a tie: open V, tie, two buttons, a pocket square
 return {vee:[.55,1],veeHalf:34,tie:[.5,.93],buttons:[.43,.52],pocket:[.66,.72]};
}
export function shade(hex,k){
 const n=parseInt(hex.slice(1),16),c=[n>>16&255,n>>8&255,n&255].map(x=>Math.max(0,Math.min(255,Math.round(x*k))));
 return '#'+c.map(x=>x.toString(16).padStart(2,'0')).join('');
}
const rr=(g,x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();};
// two colours split at the waist: used for the sides and back of the body
export function paintSide(g,{shirt,pants,ink='#1e1214',W=4,H=256}={}){
 const sy=(1-BODY.splitV)*H;g.fillStyle=shirt;g.fillRect(0,0,W,H);g.fillStyle=pants;g.fillRect(0,sy,W,H-sy);g.fillStyle=ink;g.globalAlpha=.55;g.fillRect(0,sy-1,W,3);g.globalAlpha=1;
}
// fine woven texture under the painted marks: twill lines and fibre speckle, multiplied into the flat colours (owner 2026-11-09: realistic detail, flat characters)
function cloth(g,W,H,sy){let sd=7;const r=()=>{sd=(Math.imul(sd,1664525)+1013904223)>>>0;return sd/4294967296;};g.save();g.globalCompositeOperation='multiply';g.lineWidth=1.2;
 for(let i=-H;i<W;i+=3){g.strokeStyle=`rgba(70,70,90,${.16+r()*.14})`;g.beginPath();g.moveTo(i,sy);g.lineTo(i+(H-sy),H);g.stroke();}
 for(let x=0;x<W;x+=4){g.strokeStyle=`rgba(90,90,100,${.1+r()*.1})`;g.beginPath();g.moveTo(x,0);g.lineTo(x,sy);g.stroke();}
 for(let i=0;i<W*H/14;i++){const v=Math.floor(110+r()*130);g.fillStyle=`rgba(${v},${v},${v},.3)`;g.fillRect(r()*W,r()*H,1+r()*2,1+r()*1.5);}
 g.restore();}
export function paintFront(g,{shirt='#f2e8d0',pants='#3b5f73',ink='#1e1214',outfit='tee',emblem=null,symbol='$',trim='#f1c24a',jacket=null,tie=null}={}){
 const {W,H,splitV}=BODY,y=v=>(1-v)*H,cx=W/2,sy=y(splitV);
 g.lineCap=g.lineJoin='round';g.fillStyle=shirt;g.fillRect(0,0,W,H);g.fillStyle=pants;g.fillRect(0,sy,W,H-sy);
 cloth(g,W,H,sy); // real cloth under the paint (denim twill on the trousers, knit on the shirt), then every mark below is drawn on top
 g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.moveTo(0,sy);g.lineTo(W,sy);g.stroke();
 const gold=(x,yy,r)=>{g.fillStyle='#e8b02c';g.strokeStyle=ink;g.lineWidth=4;g.beginPath();g.arc(x,yy,r,0,7);g.fill();g.stroke();g.fillStyle='#fff3b0';g.beginPath();g.arc(x-r*.3,yy-r*.3,r*.22,0,7);g.fill();};
 const coin=(x,yy,r)=>{g.fillStyle=emblem;g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.arc(x,yy,r,0,7);g.fill();g.stroke();g.fillStyle=ink;g.font=`bold ${Math.round(r*1.35)}px Arial`;g.textAlign='center';g.textBaseline='middle';g.fillText(symbol,x,yy+r*.06);};
 if(outfit==='suit'){
  const m=suitMarks(),coat=jacket||pants,vy=y(m.vee[0]);
  g.fillStyle=coat;g.fillRect(0,0,W,sy);g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.moveTo(0,sy);g.lineTo(W,sy);g.stroke();
  g.fillStyle=shirt;g.beginPath();g.moveTo(cx-m.veeHalf,0);g.lineTo(cx,vy);g.lineTo(cx+m.veeHalf,0);g.closePath();g.fill();
  g.strokeStyle=ink;g.lineWidth=5;g.beginPath();g.moveTo(cx-m.veeHalf,0);g.lineTo(cx,vy);g.lineTo(cx+m.veeHalf,0);g.stroke();
  g.strokeStyle=shade(coat,.7);g.lineWidth=4;g.beginPath();g.moveTo(cx-m.veeHalf-16,0);g.lineTo(cx-8,vy+22);g.moveTo(cx+m.veeHalf+16,0);g.lineTo(cx+8,vy+22);g.stroke();
  g.fillStyle=tie||'#a6362c';g.strokeStyle=ink;g.lineWidth=4;g.beginPath();g.moveTo(cx-9,y(m.tie[1]));g.lineTo(cx+9,y(m.tie[1]));g.lineTo(cx+13,y(.8));g.lineTo(cx,y(m.tie[0]));g.lineTo(cx-13,y(.8));g.closePath();g.fill();g.stroke();
  g.fillStyle=ink;for(const v of [.5,.44]){g.beginPath();g.arc(cx+14,y(v),6,0,7);g.fill();}
  g.fillStyle='#fffaf0';g.strokeStyle=ink;g.lineWidth=3;g.beginPath();g.moveTo(cx-60,y(m.pocket[1]));g.lineTo(cx-34,y(m.pocket[1]));g.lineTo(cx-34,y(m.pocket[0]));g.lineTo(cx-60,y(m.pocket[0]));g.closePath();g.fill();g.stroke();
  return;
 }
 if(outfit==='overalls'){
  const o=overallsMarks(),bt=y(o.bib[1]),B=o.bibHalf;
  g.fillStyle=pants;g.strokeStyle=ink;g.lineWidth=6;
  for(const sx of o.strapX){g.beginPath();g.rect(cx+sx-9,0,18,bt+8);g.fill();g.stroke();}
  rr(g,cx-B,bt,B*2,sy-bt+4,14);g.fill();g.stroke();
  g.setLineDash([9,7]);g.strokeStyle=trim;g.lineWidth=4;rr(g,cx-B+9,bt+9,B*2-18,sy-bt-12,9);g.stroke();
  for(const sx of o.strapX){g.beginPath();g.moveTo(cx+sx-4,0);g.lineTo(cx+sx-4,bt-4);g.stroke();}
  g.setLineDash([]);
  for(const bx of o.buttonX)gold(cx+bx,y(.84),11);
  const px=cx+o.pocketX[0],pw=o.pocketX[1]-o.pocketX[0],pt=y(o.pocket[1]),ph=y(o.pocket[0])-pt;
  g.fillStyle=pants;g.strokeStyle=ink;g.lineWidth=5;rr(g,px,pt,pw,ph,7);g.fill();g.stroke();
  g.setLineDash([7,6]);g.strokeStyle=trim;g.lineWidth=3.5;rr(g,px+6,pt+6,pw-12,ph-12,5);g.stroke();g.setLineDash([]);
  const ax=cx+o.patchX[0],aw=o.patchX[1]-o.patchX[0],at=y(o.patch[1]),ah=y(o.patch[0])-at;
  if(emblem)coin(ax+aw/2,at+ah/2,Math.min(aw,ah)/2);
  else{g.fillStyle='#c63b3b';g.strokeStyle=ink;g.lineWidth=5;rr(g,ax,at,aw,ah,5);g.fill();g.stroke();g.strokeStyle='#e57a6a';g.lineWidth=3;for(let i=1;i<4;i++){g.beginPath();g.moveTo(ax,at+ah*i/4);g.lineTo(ax+aw,at+ah*i/4);g.stroke();}
   g.strokeStyle='#fffaf0';g.lineWidth=3;for(const [qx,qy] of [[ax,at],[ax+aw,at],[ax,at+ah],[ax+aw,at+ah]]){g.beginPath();g.moveTo(qx-6,qy-6);g.lineTo(qx+6,qy+6);g.moveTo(qx+6,qy-6);g.lineTo(qx-6,qy+6);g.stroke();}}
  return;
 }
 // tee: ribbed collar band, stitched hem band, sleeve seams, optional chest emblem
 g.fillStyle=shade(shirt,.78);g.fillRect(0,0,W,y(.9));g.strokeStyle=ink;g.lineWidth=6;g.beginPath();g.moveTo(0,y(.9));g.lineTo(W,y(.9));g.stroke();
 g.fillStyle=shade(shirt,.86);g.fillRect(0,y(.47),W,y(.42)-y(.47));g.lineWidth=4;g.setLineDash([12,9]);g.strokeStyle=shade(shirt,.55);g.beginPath();g.moveTo(0,y(.445));g.lineTo(W,y(.445));g.stroke();
 g.lineWidth=5;g.strokeStyle=shade(shirt,.5);for(const s of shirtMarks().sleeveSeamX){const x=cx+s*(W/2-26);g.beginPath();g.moveTo(x,y(.82));g.quadraticCurveTo(x-s*22,y(.72),x,y(.6));g.stroke();}
 g.setLineDash([]);
 if(emblem)coin(cx,y(.62),34);
}
