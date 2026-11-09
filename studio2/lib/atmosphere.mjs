// Per-shot atmosphere: fog (near, far, colour) and the sun colour. Distant things fade into haze; a low sun turns orange. Used by engine2.js frame().
export function fogFor({fogNear,fogFar,fogColor,night=0}={}){
 const near=fogNear??18,far=fogFar??65;
 if(!(near>=0)||!(far>near))throw Error(`fog needs 0 <= near < far, got ${near} and ${far}`);
 return {near,far,color:fogColor??(night>.5?'#18264a':'#b5d9d0')};
}
export function sunFor({sun=[-.42,.82,.5],sunColor,night=0}={}){
 if(sunColor)return {color:sunColor};
 if(night>.5)return {color:'#9db8ff'};
 const l=Math.hypot(...sun),elevation=sun[1]/l;
 return {color:elevation<.25?'#ffb070':'#fff0b8'};
}
// Key-light strength: full by day, easing down as the sun gets low (long soft shadows, warmer and calmer), dim moonlight at night; a shot can override it.
export function sunPower({sun=[-.42,.82,.5],night=0,sunIntensity}={}){
 if(sunIntensity!=null)return sunIntensity;if(night>.5)return 1.3;
 const e=sun[1]/Math.hypot(...sun);return +(e>=.5?3.8:2.6+(3.8-2.6)*Math.max(0,e-.05)/.45).toFixed(3);
}
