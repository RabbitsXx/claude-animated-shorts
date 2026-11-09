// Camera plan gate: every shot must travel (owner order 2026-11-09, skill animated-3d-story-video: net travel in every shot, about 10% of the frame width per second,
// push about half, crane a third, track a fifth). Works on the per-frame camera path that collide.mjs records (out/collide.json cameras), so it runs BEFORE any render.
// "Travel" = how far the world moves across the 9:16 frame between the first and last frame of a shot, in frame widths per second:
// the larger of the apparent shift of a background point 6 m behind the subject (orbit, track, crane), the push (change of distance) and the zoom (change of fov).
// Calibration (2026-11-09, studio2/ref-camera.py on the reference frames, reference/study/camera-travel.json): the reference's shots travel 3.5% (p10), 13.5% (median) and 27% (p90) of the frame width per second, so the floor is its p10 and anything over 40% is a whip, not a move.
// Honest limit: the reference numbers come from pictures (dense optical flow on 4 fps sample frames, cuts from motion.json); this formula works from the camera path. A check on stop-time-hour rain frames could not pair them (the picture estimator fails on thin falling-rain detail), so the floor is enforced and the cap only warns. motion-check.mjs on the finished video is the calibrated judge.
// Framing (measured 2026-11-09 by eye on 6 reference frames vs 6 of stop-time-hour take 1, nobody else judged): the reference hero's head is about 0.1-0.5 of the frame height (median about 0.2), ours was about 0.04-0.12 (median about 0.06). Head height = 0.24 m (the rig), subject = the camera target.
export const FRAMING={headMetres:.24,minMedianHead:.09,bigHead:.12,minBigShare:.4};
export const CAMERA_LIMITS={minTravelPerSecond:.03,maxTravelPerSecond:.4,minShotSeconds:1.5,jumpMetres:1.5,jumpDegrees:20,hfovAspect:9/16};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=(a)=>Math.hypot(...a),norm=(a)=>{const l=len(a)||1;return [a[0]/l,a[1]/l,a[2]/l];};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function splitShots(cams,{jumpMetres,jumpDegrees}=CAMERA_LIMITS){
 const shots=[];let cur=[];
 for(const c of cams){
  const prev=cur[cur.length-1];
  if(prev&&c&&(len(sub(c.p,prev.p))>jumpMetres||Math.acos(Math.max(-1,Math.min(1,dot(norm(sub(c.t,c.p)),norm(sub(prev.t,prev.p))))))*180/Math.PI>jumpDegrees)){shots.push(cur);cur=[];}
  if(c)cur.push(c);
 }
 if(cur.length)shots.push(cur);
 return shots;
}
const frameX=(cam,w)=>{ // where the world point w lands across the frame, in frame widths from the centre
 const f=norm(sub(cam.t,cam.p)),r=norm(cross(f,[0,1,0])),v=sub(w,cam.p),z=dot(v,f)||1e-6;
 const hfov=2*Math.atan(Math.tan(cam.fov*Math.PI/360)*CAMERA_LIMITS.hfovAspect);
 return dot(v,r)/z/(2*Math.tan(hfov/2));
};
export function shotTravel(shot,fps=30){
 const a=shot[0],b=shot[shot.length-1],sec=Math.max(1/fps,(shot.length-1)/fps);
 const bg=(c)=>{const f=norm(sub(c.t,c.p));return [a.t[0]+f[0]*6,a.t[1]+f[1]*6,a.t[2]+f[2]*6];};
 const bgw=bg(a),rot=Math.abs(frameX(b,bgw)-frameX(a,bgw)); // the background decides: a tracking shot keeps its subject centred, the world behind it slides
 const da=len(sub(a.t,a.p)),db=len(sub(b.t,b.p)),push=Math.abs(Math.log(da/db)),zoom=Math.abs(Math.log(Math.tan(a.fov*Math.PI/360)/Math.tan(b.fov*Math.PI/360)));
 return Math.max(rot,push,zoom)/sec;
}
export function headFractions(cams){return cams.filter(Boolean).map(c=>FRAMING.headMetres/(2*Math.max(.3,len(sub(c.t,c.p)))*Math.tan(c.fov*Math.PI/360)));}
export function judgeCameraPlan(cams,{fps=30,framing=true}={}){
 const L=CAMERA_LIMITS,problems=[],warnings=[],shots=splitShots(cams.filter(Boolean)),report=[];let t=0;
 for(const s of shots){
  const sec=s.length/fps;
  if(sec>=L.minShotSeconds){const tr=shotTravel(s,fps);report.push({from:+t.toFixed(2),seconds:+sec.toFixed(2),travelPerSecond:+tr.toFixed(3)});
   if(tr>L.maxTravelPerSecond)warnings.push(`shot at ${t.toFixed(1)} s travels ${(tr*100).toFixed(0)}% of the frame width per second, the reference's 90th percentile is 27% and the cap is ${L.maxTravelPerSecond*100}%: slow the move or split it (warning only: this formula is not yet calibrated against our own renders)`);
   if(tr<L.minTravelPerSecond)problems.push(`shot at ${t.toFixed(1)} s (${sec.toFixed(1)} s long) travels ${(tr*100).toFixed(1)}% of the frame width per second, the floor is ${L.minTravelPerSecond*100}% (target about 10%): add an eased push, orbit, crane or track`);}
  t+=sec;
 }
 let head=null;
 if(framing){const h=headFractions(cams).sort((a,b)=>a-b),med=h[h.length>>1]||0,big=h.filter(x=>x>=FRAMING.bigHead).length/Math.max(1,h.length);head={median:+med.toFixed(3),bigShare:+big.toFixed(2)};
  if(med<FRAMING.minMedianHead||big<FRAMING.minBigShare)problems.push(`the hero is too small: median head height ${(med*100).toFixed(0)}% of the frame (floor ${FRAMING.minMedianHead*100}%), only ${Math.round(big*100)}% of the frames have a head over ${FRAMING.bigHead*100}% (need ${FRAMING.minBigShare*100}%); the reference fills the frame with the face (about 20% median): move the camera closer or use a longer lens, keep wide shots for the establishing beat`);}
 return {ok:problems.length===0,problems,warnings,shots:report,head};
}
