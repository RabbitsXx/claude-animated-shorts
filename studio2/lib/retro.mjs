// End-of-film retro: what a film cost and what to promote or log. Pure functions; studio2/retro.mjs reads the files and calls these.
// History lines come from collide.mjs (out/gate-history.jsonl): {at, ok, overlaps, frames, kinds[]}.
export function summarizeHistory(lines){
 if(!lines.length)return {runs:0,runsToFirstPass:null,firstOverlaps:null,kinds:{},lastOk:null};
 const kinds={};for(const l of lines)for(const k of l.kinds||[])kinds[k]=(kinds[k]||0)+1;
 const firstPass=lines.findIndex(l=>l.ok);
 return {runs:lines.length,runsToFirstPass:firstPass<0?null:firstPass+1,firstOverlaps:lines[0].overlaps,kinds,lastOk:lines[lines.length-1].ok};
}
export function renderRetro({episode,gate,gateSummary,renderRuns,story,qa,candidates,dead=[]}){
 const g=gateSummary,top=Object.entries(g.kinds||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const m=(story&&story.metrics)||{};
 return `# Retro: ${episode}

Measured by studio2/retro.mjs from the film's own files. Nobody has watched or listened unless the user says so.

## What it cost (the number to push down from film to film)
- gate runs: ${g.runs}${g.runsToFirstPass?` (first pass on run ${g.runsToFirstPass}; run 1 had ${g.firstOverlaps} overlaps)`:' (no pass recorded yet)'}
- full renders: ${renderRuns??'unknown (no render history)'}
- last gate: ${gate?(gate.ok?'PASS':'FAIL'):'none'}${gate?`, ${gate.checkedFrames} frames, ${(gate.overlaps||[]).length} overlaps`:''}

## What failed most often at the gate
${top.length?top.map(([k,n])=>`- ${k}: ${n} run(s)`).join('\n'):'- nothing recorded'}

## Result
- length ${qa?qa.formatDuration:'?'} s, ${m.cutsPerMinute??'?'} cuts per minute, loudness ${qa?qa.integratedLUFS:'?'} LUFS, true peak ${qa?qa.truePeakDBFS:'?'} dBFS

## To do now (a retro is not finished until these are done)
1. Log every defect that cost a retry in docs/DEFECTS.json (symptom, cause, rule, how it is caught). A defect seen twice gets a check before the next film starts.
2. Promote what proved itself. Candidates in this film's scene code that are not in studio2/library/INDEX.json yet:
${candidates&&candidates.length?candidates.map(c=>`   - ${c}`).join('\n'):'   - (none found)'}
   Promote = move to studio2/library with a test (and a golden check if it was moved from episode code), then add it to INDEX.json.
3. Write down the number above in HANDOFF.md and compare it with the previous film.
4. Dead files (the scaffold copied them from the previous film; main.mjs never reaches them). Move them to an archive folder so the next session does not read them:
${dead.length?dead.map(c=>`   - ${c}`).join('\n'):'   - (none)'}
`;
}

// Files of a scene reachable from its entry by relative imports (./x.mjs). readFile(name) returns the source or undefined.
// Absolute imports (/runtime/..., /repo/...) are shared code, not scene files. Used by retro.mjs to tell promotion candidates
// from dead files the scaffold copied from the previous film.
export function reachableFiles(readFile,entry){
 const seen=new Set(),todo=[entry];
 while(todo.length){
  const f=todo.pop();if(seen.has(f))continue;
  const src=readFile(f);if(src===undefined)continue;
  seen.add(f);
  for(const m of src.matchAll(/(?:from\s*|import\s*)['"]\.\/([^'"]+)['"]/g))todo.push(m[1]);
 }
 return seen;
}
