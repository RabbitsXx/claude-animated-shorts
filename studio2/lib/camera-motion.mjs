// Camera motion checks on the per-frame camera path the collision gate records ({p:[x,y,z], t:[x,y,z]} per frame).
// A whip-pan is the view direction turning fast for several frames in a row (sweeping through empty space between two subjects).
// One giant jump between two still shots (a single frame) is a hard cut and is allowed; a quick move that turns the view less than
// minTotalDeg in total is allowed. The square-wheel defect was about 100 degrees in 3 frames.
const dir=(c)=>{const v=[c.t[0]-c.p[0],c.t[1]-c.p[1],c.t[2]-c.p[2]],n=Math.hypot(...v)||1;return [v[0]/n,v[1]/n,v[2]/n];};
export function lookAngles(cams){
 const out=[];let prev=null;
 for(const c of cams){
  if(!c||!c.p||!c.t){prev=null;out.push(null);continue;}
  const d=dir(c);
  out.push(prev?Math.acos(Math.max(-1,Math.min(1,prev[0]*d[0]+prev[1]*d[1]+prev[2]*d[2])))*180/Math.PI:null);
  prev=d;
 }
 return out.slice(1).map(x=>x);
}
export function findWhips(cams,{step=1/30,maxDegPerFrame=4,minFrames=2,minTotalDeg=45}={}){
 const ang=lookAngles(cams),runs=[];let cur=null;
 ang.forEach((a,i)=>{ // ang[i] is the turn from frame i to frame i+1
  if(a!=null&&a>maxDegPerFrame){if(!cur)cur={i,frames:0,max:0,total:0};cur.frames++;cur.total+=a;cur.max=Math.max(cur.max,a);}
  else if(cur){runs.push(cur);cur=null;}
 });
 if(cur)runs.push(cur);
 // a run of one frame is a hard cut; a short move that turns the view less than minTotalDeg is just a quick camera move
 return runs.filter(r=>r.frames>=minFrames&&r.total>=minTotalDeg).map(r=>({from:r.i*step,to:(r.i+r.frames)*step,frames:r.frames,totalDeg:r.total,maxDegPerFrame:r.max}));
}
