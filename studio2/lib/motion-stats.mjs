// Editing and motion gate (owner request 2026-11-09: quality and editing comparable to the reference clip).
// Measured on frame-to-frame differences of the finished video (studio2/motion-check.mjs decodes it at 108x192) and compared with the same numbers
// taken from the reference clip (reference/study/motion.json, 1894 frames at 30 fps):
//   reference: 9 % of frames nearly still (pixel delta under 2), 61 % clearly moving (over 8), every 4 s window has a median pixel delta of 3.6 to 19,
//   about 16 soft transitions (runs of 4 or more frames of large histogram change: dissolves and fast camera moves) and 2 hard cuts (at 21 s and 61 s, measured 2026-11-09) (one frame).
//   stop-time-hour take 1: 60 % of frames nearly still, windows down to 0.0, 12 hard cuts and no dissolves.
// Honest limits: the pixel delta mixes camera motion and character motion, and a soft transition cannot be told from a fast camera move; a person still watches the cut.
export const LIMITS={
 stillBelow:2,          // a frame pair under this pixel delta (0-255 scale) is nearly still
 maxStaticShare:.25,    // reference .09
 windowSeconds:4,
 minWindowMedian:3,     // reference minimum 3.6
 cutHist:.12,           // a frame pair above this histogram change is part of an edit event
 hardCutMaxFrames:2,hardCutMinSum:.25,
 softMinFrames:4,softMinSum:.5,
 minSoftTransitions:6,  // reference 2 in 63 s (at 21 s and 61 s, measured 2026-11-09)6
 maxHardCutsPerMinute:4 // reference 2 in 63 s (at 21 s and 61 s, measured 2026-11-09)
};
export function frameDeltas(frames){ // frames: array of gray Uint8Array of equal size
 const pixel=[],hist=[],B=32,hs=(f)=>{const h=new Float64Array(B);for(let i=0;i<f.length;i++)h[Math.min(B-1,f[i]>>3)]++;for(let k=0;k<B;k++)h[k]/=f.length;return h;};
 let prevH=frames.length?hs(frames[0]):null;
 for(let i=1;i<frames.length;i++){
  const a=frames[i-1],b=frames[i];let s=0;for(let k=0;k<a.length;k++)s+=Math.abs(a[k]-b[k]);pixel.push(s/a.length);
  const h=hs(b);let d=0;for(let k=0;k<B;k++)d+=Math.abs(h[k]-prevH[k]);hist.push(d/2);prevH=h;
 }
 return {pixel,hist};
}
const median=(a)=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
export function analyzeMotion({pixel,hist},{fps=30}={}){
 const n=pixel.length,L=LIMITS;
 const staticShare=n?pixel.filter(v=>v<L.stillBelow).length/n:1;
 const wf=Math.round(L.windowSeconds*fps),windows=[];for(let i=0;i+wf<=n;i+=wf)windows.push(+median(pixel.slice(i,i+wf)).toFixed(2));
 const events=[];for(let i=0;i<hist.length;){if(hist[i]>L.cutHist){let j=i,sum=0;while(j<hist.length&&hist[j]>L.cutHist){sum+=hist[j];j++;}events.push({at:i/fps,frames:j-i,sum});i=j;}else i++;}
 const hard=events.filter(e=>e.frames<=L.hardCutMaxFrames&&e.sum>=L.hardCutMinSum),soft=events.filter(e=>e.frames>=L.softMinFrames&&e.sum>=L.softMinSum);
 return {seconds:+(n/fps).toFixed(2),staticShare:+staticShare.toFixed(3),windows,hardCuts:hard.length,softTransitions:soft.length,hardAt:hard.map(e=>+e.at.toFixed(2)),softAt:soft.map(e=>+e.at.toFixed(2)),medianPixel:+median(pixel).toFixed(2)};
}
export function judgeMotion(a){
 const L=LIMITS,problems=[],minutes=Math.max(.1,a.seconds/60);
 if(a.staticShare>L.maxStaticShare)problems.push(`${Math.round(a.staticShare*100)}% of the frames are near-still, the limit is ${Math.round(L.maxStaticShare*100)}% (reference 9%): keep the camera travelling and let the characters act in every beat`);
 a.windows.forEach((w,i)=>{if(w<L.minWindowMedian)problems.push(`the ${L.windowSeconds} s window at ${i*L.windowSeconds} s is nearly static (median pixel delta ${w}, minimum ${L.minWindowMedian}): add a camera push or orbit and an action`);});
 if(a.softTransitions<L.minSoftTransitions)problems.push(`only ${a.softTransitions} soft transitions (dissolves or fast moves), the reference has about 16 and the limit is ${L.minSoftTransitions}: dissolve between beats instead of cutting`);
 const perMin=a.hardCuts/minutes;if(perMin>L.maxHardCutsPerMinute)problems.push(`${a.hardCuts} hard cuts (${perMin.toFixed(1)} per minute), the limit is ${L.maxHardCutsPerMinute} (reference 2): keep hard cuts for the strongest story breaks`);
 return {ok:problems.length===0,problems};
}
