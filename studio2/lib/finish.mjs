// Delivery chain for a finished scene: the pure part of studio2/finish.mjs (order, what stops the chain, the report, package notes).
// assemble.mjs refuses without a collision report for the current code, so the gate always runs right before it.
export const FINISH_STEPS=[
 {name:'unit tests',stopOnFail:true},
 {name:'collision gate',stopOnFail:true},
 {name:'intent check',stopOnFail:true},
 {name:'flicker check',stopOnFail:true},
 {name:'assemble',stopOnFail:true},
 {name:'frame check',stopOnFail:true},
 {name:'motion check',stopOnFail:true},
 {name:'retro',stopOnFail:false},
];
export function summarize(results,steps=FINISH_STEPS){
 const ran=new Set(results.map(r=>r.name)),failed=results.filter(r=>!r.ok),lines=[];
 for(const r of failed)lines.push(`FAIL  ${r.name}${r.detail?'  - '+r.detail:''}`);
 for(const r of results.filter(r=>r.ok))lines.push(`PASS  ${r.name}${r.detail?'  - '+r.detail:''}`);
 const notRun=steps.filter(s=>!ran.has(s.name)).map(s=>s.name);
 if(notRun.length)lines.push(`not run: ${notRun.join(', ')}`);
 const blocking=failed.some(r=>(steps.find(s=>s.name===r.name)||{stopOnFail:true}).stopOnFail);
 return {ok:!blocking&&notRun.length===0,lines};
}
export function packageNotes({finalBytes,files}){
 const notes=[];
 if(finalBytes>30e6)notes.push(`final.mp4 is ${(finalBytes/1e6).toFixed(0)} MB: over 30 MB it cannot be sent to a phone through the chat; re-encode only if the user asks`);
 for(const f of ['cover.png','cover-small.jpg','post.txt'])if(!files.includes(f))notes.push(`missing ${f} in out/publish`);
 return notes;
}
