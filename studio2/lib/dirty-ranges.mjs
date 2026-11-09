// Partial re-render planning (pure part of studio2/render-smart.mjs).
// scores[k] = mean absolute difference between a fresh render of the film at time k/fps and the same frame of the finished render.
// A sample over the threshold marks the stretch around it (one sample step each side) as out of date; near stretches merge.
export const sampleFrameIndex=(k,fps,videoFps=30)=>Math.floor(k*videoFps/fps);
export function dirtyRanges(scores,{fps=2,videoFps=30,totalFrames,threshold=.3,margin=1,mergeGap=15}){
 const stepFrames=videoFps/fps,raw=[];
 scores.forEach((s,k)=>{
  if(!(s>threshold))return;
  const f=sampleFrameIndex(k,fps,videoFps);
  raw.push({from:Math.max(0,Math.round(f-margin*stepFrames)),to:Math.min(totalFrames,Math.round(f+margin*stepFrames))});
 });
 const out=[];
 for(const r of raw){const last=out[out.length-1];if(last&&r.from-last.to<=mergeGap)last.to=Math.max(last.to,r.to);else out.push({...r});}
 return out;
}
export const coverage=(ranges,totalFrames)=>ranges.reduce((a,r)=>a+(r.to-r.from),0)/totalFrames;
