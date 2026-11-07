// Absolute-time animation helpers. Every value is a pure function of time (seek-safe, no accumulation).
const c1=1.70158,c3=c1+1;
export const ease={
 lin:x=>x,
 in:x=>x*x,
 in3:x=>x*x*x,
 out:x=>1-(1-x)*(1-x),
 out3:x=>1-(1-x)**3,
 io:x=>x<.5?2*x*x:1-2*(1-x)*(1-x),
 smooth:x=>x*x*(3-2*x),
 // overshoot past the target then settle (follow-through)
 back:x=>1+c3*(x-1)**3+c1*(x-1)**2,
 // pull the opposite way first (anticipation) then go
 backIn:x=>c3*x*x*x-c1*x*x,
 // fast start, bounce settle
 bounce:x=>{const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375;},
 hold:x=>x<1?0:1,
};
const lerp=(a,b,k)=>a+(b-a)*k;
const mix=(a,b,k)=>Array.isArray(a)?a.map((v,i)=>lerp(v,b[i],k)):lerp(a,b,k);
// keys: [[time,value,easeName?], ...]; easeName shapes the segment that ARRIVES at this key.
export function key(keys,t){
 if(!keys.length)throw Error('empty track');
 if(t<=keys[0][0])return keys[0][1];
 const n=keys.length;if(t>=keys[n-1][0])return keys[n-1][1];
 let i=1;while(i<n-1&&t>keys[i][0])i++;
 const [t0,v0]=keys[i-1],[t1,v1,e='io']=keys[i];const f=ease[e];if(!f)throw Error('unknown ease '+e);
 return mix(v0,v1,f((t-t0)/(t1-t0)));
}
export const clamp01=x=>Math.max(0,Math.min(1,x));
// 0->1 between a and b with an ease
export const ramp=(t,a,b,e='io')=>ease[e](clamp01((t-a)/(b-a)));
// bell: 0 -> 1 -> 0 (rise a..b, hold to c, fall c..d)
export const bell=(t,a,b,c,d,e='io')=>ramp(t,a,b,e)*(1-ramp(t,c,d,e));
// deterministic noise in [-1,1]
export const noise=(t,seed=0)=>{const x=t*1.0+seed*17.31;return (Math.sin(x*12.9898+seed)*.5+Math.sin(x*7.233+seed*2.1)*.3+Math.sin(x*3.77+seed*.7)*.2);};
export function rand(seed){let s=(seed>>>0)||1;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
// words: [{word,start,end}] -> time of the nth occurrence of a word (case/punct-insensitive)
export const norm=s=>s.toLowerCase().replace(/[^a-z0-9']/g,'');
export function anchors(words){
 // T('word',n) or T('two word phrase',n): start time of the nth occurrence
 return (q,n=1)=>{const parts=q.split(/\s+/).map(norm);let c=0;for(let i=0;i+parts.length<=words.length;i++){if(parts.every((p,k)=>norm(words[i+k].word)===p)){c++;if(c===n)return words[i].start;}}throw Error('No word anchor '+q+'/'+n);};
}
