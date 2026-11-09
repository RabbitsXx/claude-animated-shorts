import {auditFidelity} from './model-fidelity.mjs';
// Per-model gate (user rule 2026-11-08): every model of a film is sculpted and checked ONE BY ONE, and only a passed model lets
// the next one start. episodes/<id>/MODELS.json lists the models in build order:
//   {id, name, status: planned|building|built|passed|rejected, sheet, passedBy, checks:[...], rejectedBy, reason}
// 'passed' means a model sheet was rendered and looked at, with at least three written checks. The owner can reject any model.
// DETAIL GATE (owner 2026-11-08: every model as detailed as the spend-ten-million work). models.mjs --sheet counts the parts of the model (meshes) and its different named parts
// (names) and stores both; a film with film.json detailGate:true cannot pass a model with fewer than DETAIL.minMeshes parts or DETAIL.minNames different named parts,
// unless the model carries a written detailWaiver (an actor rig, one instanced mesh, a terrain surface). Counts are a floor, not proof: a person still judges how real it looks.
export const DETAIL={minMeshes:30,minNames:10};
export function auditDetail(m){
 const id=m.id||'?',w=String(m.detailWaiver||'').trim().split(/\s+/).filter(Boolean).length;
 if(w>=4)return [];
 if(!Number.isFinite(m.meshes)||!Number.isFinite(m.names))return [`${id}: no part count from the model sheet; render the sheet again (models.mjs --sheet ${id})`];
 const out=[];
 if(m.meshes<DETAIL.minMeshes)out.push(`${id}: ${m.meshes} meshes, the detail gate wants ${DETAIL.minMeshes}: add the real details (seams, trim, fasteners, labels, wear) or write a detailWaiver`);
 if(m.names<DETAIL.minNames)out.push(`${id}: only ${m.names} different named parts, the detail gate wants ${DETAIL.minNames}: name and build the distinct parts a real one has`);
 return out;
}
export const STATUSES=['planned','building','built','passed','rejected'];
export function validateModels(doc,opts={}){
 const problems=[],list=doc&&Array.isArray(doc.models)?doc.models:null;
 if(!list||list.length===0)return {ok:false,problems:['MODELS.json must list the models of the film (models: [...])']};
 const seen=new Set();let building=0;
 list.forEach((m,i)=>{
  if(!m.id){problems.push(`model #${i+1} has no id`);return;}
  if(seen.has(m.id))problems.push(`duplicate model id ${m.id}`);seen.add(m.id);
  if(!STATUSES.includes(m.status))problems.push(`${m.id}: unknown status ${m.status}`);
  if(m.status==='building')building++;
  if(m.status==='passed'){
   if(!m.sheet)problems.push(`${m.id}: passed without a model sheet`);
   if(!m.passedBy)problems.push(`${m.id}: passed without saying who passed it`);
   if(!Array.isArray(m.checks)||m.checks.filter(c=>String(c).trim()).length<3)problems.push(`${m.id}: passed with fewer than 3 written checks`);
  }
  if(m.status==='rejected'&&!(m.rejectedBy&&m.reason))problems.push(`${m.id}: rejected without who and why`);
  if(m.status==='passed'&&opts.detail)problems.push(...auditDetail(m));
  if(m.status==='passed'&&opts.fidelity)problems.push(...auditFidelity(m)); // film.json fidelityGate: real-world numbers at every interaction point (studio2/lib/model-fidelity.mjs)
  if(m.status==='passed'){const before=list.slice(0,i).find(p=>p.status!=='passed');if(before)problems.push(`${m.id} is passed but ${before.id} before it is not (models pass one by one)`);}
 });
 if(building>1)problems.push('more than one model is in the building state');
 return {ok:problems.length===0,problems};
}
export const nextModel=doc=>(doc.models||[]).find(m=>m.status!=='passed')||null;
export const allPassed=doc=>Array.isArray(doc.models)&&doc.models.length>0&&doc.models.every(m=>m.status==='passed');
