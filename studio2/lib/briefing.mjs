// Session briefing text (printed by studio2/briefing.mjs at session start). Pure: the script feeds it the repo's own files.
export const openDefects=(log)=>(log.defects||[]).filter(d=>d.check&&d.check.kind==='none');
const channelLine=(c)=>{if(!c)return null;const ids=Object.keys(c).filter(k=>k!=='unassigned'&&k!=='unknown');const bits=ids.map(k=>`${k} (${c[k].length} film${c[k].length===1?'':'s'})`);if(c.unassigned&&c.unassigned.length)bits.push(`no channel: ${c.unassigned.join(', ')}`);if(c.unknown&&c.unknown.length)bits.push(`unknown channel: ${c.unknown.map(u=>`${u.episode}->${u.channel}`).join(', ')}`);return `Channels (separate brand, story rules, voice, text; shared method): ${bits.join('; ')}. Every film names its channel; see channels/README.md.`;};
export function buildBriefing({active,handoffState,parts,defects,channels}){
 const proven=parts.filter(p=>p.status==='proven').length,exp=parts.length-proven,open=openDefects({defects});
 return [
  'REPO BRIEFING (animated shorts, studio2). Reply to the user in Thai; code and file names in English.',
  `Active episode: ${active||'none'}. State: ${handoffState||'read its HANDOFF.md'}`,
  channelLine(channels),
  `Library: ${parts.length} parts (${proven} proven, ${exp} experimental) in studio2/library/INDEX.json - import, do not rewrite.`,
  `Defects log: ${open.length} defects without a check (${open.slice(0,4).map(d=>d.id).join(", ")||"none"}${open.length>4?" ...":""}) - fix or automate when you meet them.`,
  'Autopilot (no need to be asked): skill self-improve -> log defects, promote parts, update skills and memory after any correction; skill delegate-haiku -> easy mechanical tasks go to Haiku subagents in the background.',
  'Fast path: preflight.mjs before the first full render (look at its one-image sheet + LOOK FOR list); after it render-smart.mjs re-renders only changed stretches (sound-only: assemble.mjs); finish.mjs ends the film, package.mjs builds out/publish (never uploads). Search first: catalog-assets.mjs --find. Look at sheets or shrink.py copies, not full-size frames. Covers = hook frame + engine depth of field.',
  'Never without the user: ElevenLabs spend, publishing, deleting work, approvals, "watched/listened" claims. Say what was measured vs what a person must judge.',
 ].join('\n');
}
// Defects that no gate or test catches yet: the preflight prints them as the list a person (or Claude) must look for on the sample sheet.
export const humanChecklist=(log)=>(log.defects||[]).filter(d=>d.check&&(d.check.kind==='none'||d.check.kind==='review')).map(d=>`${d.id}: ${d.rule}`);
