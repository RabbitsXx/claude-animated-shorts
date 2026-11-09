// FIDELITY GATE (owner rule 2026-11-08): a model must be as good as the real thing wherever the character really interacts with it (touches, holds, presses, stands on, walks
// through, sits in, opens), and it must look like a real object that exists in the world. A real thing is the reference, not a cute guess: the jet was as tall as the hero, a remote
// button was twice a thumb, a watch was twice a wrist. The gate checks that the author wrote the real-world numbers down and that the modelled value sits inside the real range;
// a person still judges how it looks. For films with film.json "fidelityGate": true (set by new-episode.mjs) a model cannot be passed without these fields in MODELS.json:
//   reference     the real-world thing it copies and where its size comes from (5+ words)
//   realDetails   at least 3 real-world details (3+ words each) that make it look like the real thing
//   interaction   [{point, action, realRange:[min,max], modeled, unit, source, sheetView 1-4}]  every place the character touches, uses, stands on, walks through or sits in;
//                 `modeled` (the number in the model code) must lie inside `realRange`; `sheetView` says which sheet view shows the point next to the 1.8 m figure
//   scenery:true + sceneryWhy   only for a model the character never touches (a backdrop)
//   exaggerations [{point, reason, ownerApproved}]  a modelled value outside its real range is allowed only with the reason and the owner's quoted approval
export function auditFidelity(m){
 const fail=[],w=(s)=>String(s||'').trim().split(/\s+/).filter(Boolean).length,id=m.id||'?';
 if(w(m.reference)<5)fail.push(`${id}: "reference" must name the real-world thing it copies and where its size comes from (5+ words)`);
 if(!Array.isArray(m.realDetails)||m.realDetails.filter(x=>w(x)>=3).length<3)fail.push(`${id}: "realDetails" needs 3 real-world details (3+ words each) that make it look like the real thing`);
 const inter=Array.isArray(m.interaction)?m.interaction:[],ex=Array.isArray(m.exaggerations)?m.exaggerations:[];
 if(m.scenery){if(w(m.sceneryWhy)<4)fail.push(`${id}: "scenery" needs "sceneryWhy" (4+ words): why the character never touches it`);}
 else if(inter.length===0)fail.push(`${id}: list its "interaction" points (where the character touches, uses, stands on, walks through or sits in it) or mark it scenery with a reason`);
 inter.forEach((p,i)=>{
  const L=`${id} interaction ${i+1} (${p.point||'?'})`;
  if(w(p.point)<2||w(p.action)<3)fail.push(`${L}: needs "point" (2+ words) and "action" (3+ words)`);
  if(!Array.isArray(p.realRange)||p.realRange.length!==2||!(p.realRange[0]<p.realRange[1])||!p.realRange.every(Number.isFinite))fail.push(`${L}: "realRange" must be [min,max] in ${p.unit||'metres'}, taken from the real thing`);
  else if(!Number.isFinite(p.modeled))fail.push(`${L}: "modeled" must be the number used in the model code`);
  else if(p.modeled<p.realRange[0]||p.modeled>p.realRange[1]){
   const e=ex.find(x=>x.point===p.point&&w(x.reason)>=4&&w(x.ownerApproved)>=2);
   if(!e)fail.push(`${L}: modelled ${p.modeled} ${p.unit||'m'} is outside the real range ${p.realRange[0]}-${p.realRange[1]}; model it at real size, or list it in "exaggerations" with a reason and the owner's quoted approval`);
  }
  if(!p.unit||w(p.source)<2)fail.push(`${L}: needs "unit" and "source" (where the real range comes from: measurement, standard, product, or "estimate, verify")`);
  if(!Number.isInteger(p.sheetView)||p.sheetView<1||p.sheetView>4)fail.push(`${L}: "sheetView" (1-4) must say which sheet view shows it next to the 1.8 m figure`);
 });
 return fail;
}
