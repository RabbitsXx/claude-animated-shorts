// Automatic frame QA from ffmpeg signalstats: flat or black frames (a camera inside a solid), hard brightness jumps (to review) and the
// brightness swing between 5-second windows (the reference's day-night-day colour script swings 0.28; flat films swing about 0.1).
// Pure functions (studio2/tests/framecheck.test.mjs); studio2/framecheck.mjs and studio2/preflight.mjs run ffmpeg and call them.
export function parseSignalStats(text){
 const out=[];let cur=null;
 for(const line of text.split(/\r?\n/)){
  const f=line.match(/^frame:\s*\d+\s+pts:\s*-?\d+\s+pts_time:\s*(-?[\d.eE+-]+)/);
  if(f){cur={t:Number(f[1])};out.push(cur);continue;}
  const m=line.match(/^lavfi\.signalstats\.(\w+)=(-?[\d.eE+-]+)/);
  if(m&&cur)cur[m[1]]=Number(m[2]);
 }
 return out;
}
function ranges(stats,pick,minFrames){
 const out=[];let run=[];
 const flush=()=>{if(run.length>=minFrames)out.push({from:run[0].t,to:run[run.length-1].t,frames:run.length});run=[];};
 for(const s of stats){if(pick(s))run.push(s);else flush();}
 flush();return out;
}
export function analyzeFrames(stats,{flatRange=25,darkYavg=16,jump=45,minFrames=2}={}){
 const dark=ranges(stats,s=>s.YAVG<darkYavg,minFrames);
 const flat=ranges(stats,s=>s.YAVG>=darkYavg&&(s.YHIGH-s.YLOW)<flatRange,minFrames);
 const jumps=[];for(let i=1;i<stats.length;i++){const d=stats[i].YAVG-stats[i-1].YAVG;if(Math.abs(d)>jump)jumps.push({t:stats[i].t,delta:+d.toFixed(1)});}
 // a one-frame flash: a hard jump immediately undone (a wrong frame inside a dissolve or a cut)
 const flashes=[];for(let i=0;i+1<jumps.length;i++)if(Math.sign(jumps[i].delta)!==Math.sign(jumps[i+1].delta)&&jumps[i+1].t-jumps[i].t<=.1)flashes.push({at:jumps[i].t,delta:jumps[i].delta});
 return {flat,dark,jumps,flashes,ok:flat.length===0&&dark.length===0&&flashes.length===0,frames:stats.length};
}
export function lumSwing(stats,seconds=5){
 const win=new Map();
 for(const s of stats){const k=Math.floor(s.t/seconds),w=win.get(k)||{n:0,sum:0};w.n++;w.sum+=s.YAVG;win.set(k,w);}
 const keys=[...win.keys()].sort((a,b)=>a-b);
 const full=keys.filter(k=>win.get(k).n>=stats.length/Math.max(1,keys.length)*.5);
 if(full.length<2)return null;
 const means=full.map(k=>win.get(k).sum/win.get(k).n/255);
 return {swing:+(Math.max(...means)-Math.min(...means)).toFixed(3),windows:means.map(m=>+m.toFixed(3))};
}

// Sky-dominated frames: the fraction of sky-coloured pixels (blue, or white clouds) in the top 70% of a raw rgb24 frame of size w x h, and
// runs of frames above a limit that last long enough to be a shot of sky rather than a glimpse (a camera aimed at a hat or the horizon).
export function skyShare(rgb,w,h){
 const rows=Math.floor(h*.7);let n=0;
 for(let y=0;y<rows;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3,r=rgb[i],g=rgb[i+1],b=rgb[i+2];if(b>=r&&b>=g-12&&b>130)n++;}
 return n/(rows*w);
}
export function skyRuns(shares,fps,{limit=.8,minSeconds=.3}={}){
 const out=[];let start=-1;
 const flush=(end)=>{if(start>=0&&(end-start)/fps>=minSeconds)out.push({from:start/fps,to:(end-1)/fps,frames:end-start});start=-1;};
 shares.forEach((s,i)=>{if(s>=limit){if(start<0)start=i;}else flush(i);});
 flush(shares.length);return out;
}
