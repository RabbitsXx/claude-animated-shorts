// Storyboard rule (owner, 2026-11-08): before any model or scene work the owner sees an illustrated storyboard, one panel per story beat,
// and approves it. episodes/<id>/STORYBOARD.json lists the panels; studio2/storyboard.py draws the sheet (own code art, no image generation).
export const SCENES_REQUIRED=['story (STORY.json)','storyboard sheet (out/storyboard.jpg)','spending on paid voice, music and effects'];
export function validateStoryboard(sb,story){
 const problems=[],panels=sb&&Array.isArray(sb.panels)?sb.panels:null,beats=story&&story.beats?story.beats:[];
 if(!panels)return {ok:false,problems:['STORYBOARD.json needs panels: [...]']};
 if(panels.length!==beats.length)problems.push(`${panels.length} panels for ${beats.length} story beats: one panel per beat`);
 panels.forEach((p,i)=>{
  if(p.beat!==i+1)problems.push(`panel ${i+1} is for beat ${p.beat}: panels must follow the beats in order`);
  for(const k of ['scene','camera','action'])if(!String(p[k]||'').trim())problems.push(`panel ${i+1}: ${k} is empty`);
  if(!String(p.narration||'').trim()&&!p.silent)problems.push(`panel ${i+1}: no narration (mark it silent if the picture carries it)`);
 });
 return {ok:problems.length===0,problems};
}
// The storyboard the owner approves is made of REAL frames rendered from the built scene (owner, 2026-11-08), one per beat, taken a little
// after the beat starts so the cut has settled and the action is readable.
export function keyframeTimes(story){return (story.beats||[]).map(b=>+(b.t0+(b.t1-b.t0)*.65).toFixed(2));}
