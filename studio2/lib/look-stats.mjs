// Colour gate (2026-11-09): the reference is clearly more saturated than stop-time-hour take 1. Measured on 85 reference sample frames vs 60 frames of take 1 (HSV saturation, 108x192):
// median saturation .474 vs .291, share of pixels with saturation over .5: .469 vs .248 (reference p10 .306 and .124). Contrast (std of value) was the same (.19 vs .19), so only colour is gated.
// The floors sit between the two films: a film at or under take 1's colour fails. A person still judges taste; this only stops washed-out frames before a render.
export const LOOK={minMedianSat:.38,minMedianSatShare:.33};
export function frameSat(rgb,W,H){let s=0,hi=0,n=0;for(let i=0;i<W*H;i++){const r=rgb[i*3],g=rgb[i*3+1],b=rgb[i*3+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0;s+=sat;if(sat>.5)hi++;n++;}return {sat:s/n,share:hi/n};}
const median=(a)=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[s.length>>1]:0;};
export function judgeLook(frames){
 const sat=median(frames.map(f=>f.sat)),share=median(frames.map(f=>f.share)),problems=[];
 if(sat<LOOK.minMedianSat)problems.push(`median saturation ${sat.toFixed(2)} is under ${LOOK.minMedianSat} (reference .47, stop-time-hour take 1 .29): the colours are washed out; push the palette and light colour`);
 if(share<LOOK.minMedianSatShare)problems.push(`only ${(share*100).toFixed(0)}% of the pixels are strongly coloured (need ${LOOK.minMedianSatShare*100}%, reference 47%): use bolder colour in the set`);
 return {ok:problems.length===0,problems,sat:+sat.toFixed(3),share:+share.toFixed(3)};
}
