// Flicker and z-fight detector on rendered frames (pure functions, no I/O).
// A blip pixel: frame t differs strongly from BOTH neighbours in opposite directions while the neighbours agree with each other
// (t-1 and t+1 within T/2). Real motion does not come back to the same value one frame later, a z-fight does.
// A thin line sweeping over a pixel also makes a one-frame blip, so a blip only counts when its 15x15 neighbourhood is blipping as well
// (an AREA flips, not a line). Calibrated on pendulum-tower: thin paving joints, poles and hat edges give thousands of line blips (aliasing); only patches count.
// Calibrated limit: the worst patch on pendulum-tower is 56 px (a few specks on a water line); a model fighting another is hundreds.
// Dissolves, blur and camera moves change smoothly, so they never count.
export const LIMITS={T:36,R:7,minArea:60,minRun:4,bigAlone:400,maxFlaggedFrames:0};

// p,c,n: gray frames (W*H) at t-1,t,t+1. Returns {pixels (all blips), area (blips whose 15x15 neighbourhood all blip), cx, cy}.
export function blipRow(p,c,n,W,H,T=LIMITS.T){
 const half=T>>1,m=new Uint8Array(W*H);let pixels=0;
 for(let i=0;i<W*H;i++){
  const a=c[i]-p[i],b=n[i]-c[i];
  if(((a>T&&b<-T)||(a<-T&&b>T))){const d=n[i]-p[i];if(d<half&&d>-half){m[i]=1;pixels++;}}
 }
 if(!pixels)return {pixels:0,area:0,cx:0,cy:0};
 // area = pixels whose whole (2R+1)x(2R+1) neighbourhood blips (integral image): a patch at least 15 px thick at 270x480. Thin poles, paving
 // joints, pool edges and hat outlines are thinner and drop out; they shimmer (aliasing) but are not a model fighting another.
 const S=W+1,I=new Int32Array(S*(H+1));
 for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){row+=m[y*W+x];I[(y+1)*S+x+1]=I[y*S+x+1]+row;}}
 const R=LIMITS.R,full=(2*R+1)*(2*R+1);let area=0,sx=0,sy=0;
 for(let y=R;y<H-R;y++)for(let x=R;x<W-R;x++){
  if(!m[y*W+x])continue;
  const c=I[(y+R+1)*S+x+R+1]-I[(y-R)*S+x+R+1]-I[(y+R+1)*S+x-R]+I[(y-R)*S+x-R];
  if(c===full){area++;sx+=x;sy+=y;}}
 return {pixels,area,cx:area?Math.round(sx/area):0,cy:area?Math.round(sy/area):0};
}

// frames: array of gray frames. Returns one row per frame that has an area blip.
export function flickerFrames(frames,{W,H,T=LIMITS.T}){
 const out=[];
 for(let t=1;t<frames.length-1;t++){const r=blipRow(frames[t-1],frames[t],frames[t+1],W,H,T);if(r.area>0)out.push({frame:t,...r});}
 return out;
}

// A z-fight lasts as long as the two surfaces stay coplanar, so it blips on frame after frame; a shimmering pole edge or a sprite that pops
// shows up on one to three frames. A RUN of at least minRun flagged frames (gaps of up to 2 frames allowed) fails; one very large patch
// (bigAlone px) fails on its own; shorter runs are returned as `notes` for the report.
export function judgeFlicker(rows,{minArea=LIMITS.minArea,minRun=LIMITS.minRun,bigAlone=LIMITS.bigAlone,maxFlagged=LIMITS.maxFlaggedFrames}={}){
 const hot=rows.filter(r=>r.area>=minArea),runs=[];
 for(const r of hot){const last=runs.at(-1);if(last&&r.frame-last.at(-1).frame<=3)last.push(r);else runs.push([r]);}
 const bad=[],notes=[];
 for(const run of runs){const big=run.some(r=>r.area>=bigAlone);(run.length>=minRun||big?bad:notes).push(...run);}
 const say=(r)=>`frame ${r.frame} (t=${(r.frame/30).toFixed(2)}s): flickering area of ${r.area} pixels around x=${r.cx} y=${r.cy}`;
 return {ok:bad.length<=maxFlagged,flagged:bad,notes:notes.map(say),problems:bad.slice(0,12).map(say)};
}
