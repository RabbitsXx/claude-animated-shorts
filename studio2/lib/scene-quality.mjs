// Scene quality gate (owner goal 2026-11-08: every film must reach the scene quality of the reference clip).
// Input: dressing measurements per frame (studio2/runtime/dressing.js, written into out/collide.json by collide.mjs) and the beat key times.
// The limits come from reading the 13 reference detail frames in reference/study/details and the whole-film sheets in reference/study/deep:
// every reference shot shows its hero in front of a layered world (a foreground piece, props at the hero, landmarks in the middle distance, hills
// or a skyline on the horizon). They are a floor, not the goal: a person still compares the real frames side by side with the reference.
export const LIMITS={
 wide:{minProps:6,minKinds:4,minLayers:3},        // a normal outdoor shot
 close:{minProps:3,minKinds:2,minLayers:2},       // hero close-up or medium close-up: the hero fills the frame, fewer props fit
 interior:{minParts:18,minLayers:2},   // the camera stands in a room: distinct detail parts instead of props and a backdrop
 interiorClose:{minParts:8,minLayers:1}, // interior close-up (camera within closeUpDist of the subject): the hero fills the frame, as in the reference's close-ups
 closeUpDist:3.5,                      // metres from camera to subject at or under which a shot counts as a close-up
};
export function judgeShot(d,{closeUp=false}={}){
 if(!d)return ['no dressing measurement'];
 const out=[];
 if(d.interior){
  const L=closeUp?LIMITS.interiorClose:LIMITS.interior;
  if(d.parts<L.minParts)out.push(`only ${d.parts} detail parts in view, need ${L.minParts}: dress the room (seats, windows, lamps, signs, clutter)`);
  if(d.layers<L.minLayers)out.push(`${d.layers} depth layers, need ${L.minLayers}: put something in the foreground and something at the back wall`);
  return out;
 }
 const L=closeUp?LIMITS.close:LIMITS.wide;
 if(d.count<L.minProps)out.push(`only ${d.count} props in view, need ${L.minProps}: dress the set (stalls, signs, lamps, planters, vehicles, people, trees)`);
 if(d.kinds!==undefined&&d.kinds<L.minKinds)out.push(`only ${d.kinds} different kinds of prop, need ${L.minKinds}: ten trees are one kind`);
 if(d.layers<L.minLayers)out.push(`${d.layers} depth layers, need ${L.minLayers}: add a foreground piece, props at the hero, a landmark in the distance`);
 if(!d.backdrop)out.push('no backdrop: show hills, mountains or a far landmark on the horizon');
 return out;
}
// frames: [{t, dress}] from collide.json; keys: [{beat, t, closeUp?}]. A key time is matched to the nearest measured frame within half a second.
export function judgeFilm(frames,keys){
 const failures=[];
 for(const k of keys){
  let best=null;for(const f of frames||[])if(f.dress&&(best===null||Math.abs(f.t-k.t)<Math.abs(best.t-k.t)))best=f;
  if(!best||Math.abs(best.t-k.t)>.5){failures.push({beat:k.beat,t:k.t,problems:[`no measured frame near t=${k.t}`]});continue;}
  const problems=judgeShot(best.dress,{closeUp:!!k.closeUp});
  if(problems.length)failures.push({beat:k.beat,t:k.t,problems,measured:{count:best.dress.count,layers:best.dress.layers,parts:best.dress.parts,backdrop:best.dress.backdrop,interior:best.dress.interior}});
 }
 return {ok:failures.length===0,checked:keys.length,failures};
}
