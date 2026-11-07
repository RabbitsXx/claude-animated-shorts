export const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const progress=(t,a,b)=>smooth((t-a)/(b-a));
export const normalize=s=>s.toLowerCase().replace(/[^a-z0-9']/g,'');
export function timeline(plan,words,duration){
 if(!plan.length||!words.length)throw Error('Shots and aligned words are required');
 const T=(word,occurrence=1)=>{const hit=words.filter(w=>normalize(w.word)===normalize(word))[occurrence-1];if(!hit)throw Error(`Missing word anchor ${word}/${occurrence}`);return hit.start;};
 const end=Math.ceil(Math.max(duration,words.at(-1).end)*30)/30;
 const shots=plan.map((s,i)=>({...s,start:i?T(s.anchor.word,s.anchor.occurrence):0}));
 shots.forEach((s,i)=>{s.end=shots[i+1]?.start??end;if(!(s.end>s.start))throw Error('Shots must have strictly increasing voice-word anchors');});
 return {shots,T,duration:end};
}
