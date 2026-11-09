// Plan for ElevenLabs sound generation: what would be requested, nothing else. Pure functions, no network.
// A sound list is [{id, seconds, prompt, loop?}]. Every prompt must say "no voices" or "no intelligible words" so the model
// never returns speech. studio2/eleven.mjs uses this for `dry`, `baseline` and `sfx`, and caches each request by content hash.
export const requestBody=(e)=>({text:e.prompt,duration_seconds:e.seconds,prompt_influence:.65,model_id:'eleven_text_to_sound_v2',loop:!!e.loop});
export function validateList(list){
 const seen=new Set();
 for(const e of list){
  if(!e.id||!/^[a-z0-9][a-z0-9-]*$/.test(e.id))throw Error('bad id: '+e.id);
  if(seen.has(e.id))throw Error('duplicate id: '+e.id);seen.add(e.id);
  if(!e.prompt||e.prompt.length<12)throw Error(`${e.id}: missing prompt`);
  if(!(e.seconds>=.5&&e.seconds<=22))throw Error(`${e.id}: seconds must be 0.5 to 22 (got ${e.seconds})`);
  if(!/no voices|no intelligible words/i.test(e.prompt))throw Error(`${e.id}: prompt must say "no voices" or "no intelligible words"`);
 }
 return list;
}
// baseline: the shared studio list (assets/sfx); episode: this film's list. exists(id) says whether a baseline sound is already stored.
export function planSfx({baseline=[],episode=[],exists=()=>false}){
 validateList(baseline);validateList(episode);
 const b=baseline.filter(e=>!exists(e.id)),all=[...b,...episode];
 return {baseline:b,episode,requests:all.length,seconds:+all.reduce((s,e)=>s+e.seconds,0).toFixed(1)};
}
