// Hand-drawn line quality (look 'ref'): ink that is pressed hard in some places and lightly in others.
// penWidth() varies a stroke's thickness smoothly with position (a slow wobble, no jitter) and a little with direction (heavier on the
// lower right, as a pen pressed while pulling down); taper strokes are light at both ends and heavy in the middle.
export function penNoise(x,y,z,seed=0){
 const a=Math.sin(x*13.1+seed*1.7)*Math.cos(y*11.3+seed*2.3),b=Math.sin(z*9.7+x*5.1+seed*3.1)*Math.cos(y*7.9-z*6.3+seed);
 return Math.max(0,Math.min(1,(a+b+2)/4));
}
export function penWidth(base,pos,normal,seed=0,{min=.45,max=1.6}={}){
 const n=penNoise(pos[0],pos[1],pos[2],seed),bias=.25*(normal[0]*.55-normal[1]*.8);
 return base*(min+(max-min)*n)*(1+bias);
}
export function taperProfile(n,{end=.35}={}){return Array.from({length:n},(_,i)=>{const t=n<2?.5:i/(n-1);return end+(1-end)*Math.pow(Math.sin(Math.PI*t),.6)+1e-3;});}
export function quadPts(p0,c,p1,n=14){return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return [u*u*p0[0]+2*u*t*c[0]+t*t*p1[0],u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]];});}
// Fill a polyline as a pressed pen stroke: width follows the taper profile and a slow wobble.
export function taperStroke(pen,pts,width,{seed=0,end=.35}={}){
 const n=pts.length,prof=taperProfile(n,{end}),L=[],R=[];
 for(let i=0;i<n;i++){
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const w=width*prof[i]*(.85+.3*penNoise(pts[i][0]*.02,pts[i][1]*.02,i*.1,seed))/2;
  L.push([pts[i][0]+nx*w,pts[i][1]+ny*w]);R.push([pts[i][0]-nx*w,pts[i][1]-ny*w]);
 }
 pen.beginPath();pen.moveTo(...L[0]);for(const p of L)pen.lineTo(...p);for(let i=n-1;i>=0;i--)pen.lineTo(...R[i]);pen.closePath();pen.fill();
 for(const i of [0,n-1]){const w=width*prof[i]/2;pen.beginPath();pen.arc(pts[i][0],pts[i][1],w,0,7);pen.fill();}
}
// A closed or open outline drawn as many short segments whose width wobbles along the path.
export function varStroke(pen,pts,width,{seed=0,closed=false}={}){
 const n=pts.length,m=closed?n:n-1;pen.lineCap='round';
 for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];pen.lineWidth=width*(.55+.9*penNoise(a[0]*.02,a[1]*.02,i*.3,seed));pen.beginPath();pen.moveTo(...a);pen.lineTo(...b);pen.stroke();}
}
