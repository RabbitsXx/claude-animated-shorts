// Story profiles per channel. The explainer profile is the clarity gate inside studio2/story-audit.mjs (thesis, facts, carrier).
// The survival profile (channel post-time-survival) replaces it: a threat, a danger ladder that rises, a choice by the hero, a late peak.
// The numbers are a design for a channel that has no measured reference clip yet (borrowed shape limits from the explainer reference
// still apply: cuts, events, length). Revise them after the first survival film is measured.
export const SURVIVAL={minRises:3,minPeak:4,peakRange:[.55,.9],fieldChars:12};
const FIELDS=['protagonist','threat','stakes','rule','ending'];
export function auditSurvival(story,beats=story.beats||[]){
 const fail=[];
 for(const k of FIELDS)if(!story[k]||String(story[k]).trim().length<SURVIVAL.fieldChars)fail.push(`STORY.json is missing a real "${k}"`);
 const bad=[];beats.forEach((b,i)=>{if(!Number.isInteger(b.danger)||b.danger<1||b.danger>5)bad.push(i+1);});
 if(bad.length)fail.push(`danger must be a whole number 1-5 on every beat (beats ${bad.join(', ')})`);
 if(bad.length||!beats.length)return fail;
 const rises=beats.filter((b,i)=>i>0&&b.danger>beats[i-1].danger).length;
 if(rises<SURVIVAL.minRises)fail.push(`the story escalates ${rises} times; a survival story needs at least ${SURVIVAL.minRises} steps up in danger`);
 const max=Math.max(...beats.map(b=>b.danger)),pi=beats.findIndex(b=>b.danger===max);
 if(max<SURVIVAL.minPeak)fail.push(`peak danger is ${max}; it must reach ${SURVIVAL.minPeak} or 5`);
 const t0=beats[0].t0,len=beats.at(-1).t1-t0,at=(beats[pi].t0-t0)/len,[lo,hi]=SURVIVAL.peakRange;
 if(at<lo||at>hi)fail.push(`the peak is at ${Math.round(at*100)}% of the film; put it between ${Math.round(lo*100)}% and ${Math.round(hi*100)}% so there is a climb and a release`);
 if(!beats.slice(0,pi).some(b=>b.kind==='choice'))fail.push('the hero makes no choice before the peak (add a beat with kind "choice": the hero decides, it is not luck)');
 return fail;
}
export const survivalTemplate=()=>({
 protagonist:'',threat:'',stakes:'',rule:'',ending:'',want:'',reversal:'',payoff:'',
 beats:[1,2,2,3,4,5,3].map((d,i)=>({t0:i*9,t1:i*9+9,kind:i===3?'choice':'event',danger:d,silent:true,cuts:1,event:'',consequence:''})),
});

// A channel may set its own length range (channel.json lengthSeconds); every other limit stays the shared one.
// YouTube Shorts may run up to 180 s (3 minutes, since October 2024); longer films cost more render time and voice.
export function limitsFor(base,channel={}){
 const l={...base};
 if(channel.lengthSeconds){
  const [lo,hi]=channel.lengthSeconds;
  if(!(lo<hi))throw new Error('channel lengthSeconds: min must be below max');
  if(hi>180)throw new Error('channel lengthSeconds: a Short cannot be longer than 180 s');
  l.lengthSeconds=[lo,hi];
 }
 return l;
}
