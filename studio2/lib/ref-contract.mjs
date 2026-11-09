// The Ref contract (owner order 2026-11-09): every new film must reach the reference clip's quality WITHOUT the owner repeating the rules.
// One list of gates (scaffold turns them all on, preflight fails a film that dropped one) and one ordered list of steps
// (studio2/next-step.mjs prints the first undone step; the session briefing prints it for the active film). Old films are exempt.
export const REQUIRED_GATES=['funGate','fidelityGate','sceneGate','detailGate','motionGate','cameraGate'];
export const gateFlags=()=>Object.fromEntries(REQUIRED_GATES.map(k=>[k,true]));
const LEGACY=new Set(['time-machine-success','reaction-time-10x','square-wheel','ten-million','spend-ten-million','stranded-island','stop-time-hour']);
export const isLegacy=(id)=>LEGACY.has(id);
export const contractProblems=(film,id)=>isLegacy(id)?[]:REQUIRED_GATES.filter(k=>film[k]!==true).map(k=>`film.json "${k}" must be true (Ref contract, studio2/lib/ref-contract.mjs): a gate cannot be dropped`);
const E='--episode episodes/<id>';
export const STEPS=[
 {id:'topic',title:'topic approved by the owner',why:'the owner picks the topic; record the real quote in approvals.json',owner:true,commands:[],done:s=>!!s.approvals?.topic?.quote},
 {id:'contract',title:'all gates on in film.json',why:'a dropped gate lets a known defect through; scaffold sets them all',commands:['set every gate in film.json (studio2/lib/scaffold.mjs does it for new films)'],done:s=>contractProblems(s.film,s.id||'new').length===0},
 {id:'script',title:'SCRIPT.md: sourced facts, fiction labelled, 55-70 s narration',why:'every spoken action needs something to see; numbers need sources',commands:['skill explainer-script'],done:s=>s.narrationLines>0},
 {id:'spec',title:'SPEC-BEATS.md with Flavour and Reuse / new',why:'each film gets its own look from its topic',commands:['skill shot-design'],done:s=>!!(s.spec&&s.spec.flavour&&s.spec.reuse)},
 {id:'hook',title:'HOOK.md: first 3 seconds',why:'the opening decides the first take; write it before any paid voice',commands:['skill shorts-hook'],done:s=>!!s.hook},
 {id:'story',title:'STORY.json passes story-audit (clarity + FUN GATE)',why:'a flat or unclear story is never shown, modelled or voiced',commands:[`node studio2/story-audit.mjs ${E}`],done:s=>!!s.storyOk},
 {id:'models',title:'every model sculpted in Blender, exported as GLB and passed one by one (fidelity + detail gates)',why:'owner order 2026-11-09: models are made in Blender, never from code primitives; real size at touch points, game-level detail',commands:[`node studio2/blender-build.mjs ${E} --model <modelId>`,`node studio2/models.mjs ${E} --status`],done:s=>!!s.models&&s.models.total>0&&s.models.passed===s.models.total},
 {id:'scene',title:'scene assembled: collide, scene quality and camera plan pass',why:'models never overlap; every beat dressed like the Ref; every shot travels (push/orbit/track, eased)',commands:[`node studio2/collide.mjs ${E} --step 0.2`,`node studio2/scene-quality.mjs ${E}`,`node studio2/camera-plan.mjs ${E}`],done:s=>!!(s.collideOk&&s.sceneQualityOk&&s.cameraPlanOk)},
 {id:'frames',title:'real frames shown; the owner quotes approval',why:'the owner approves frames and spending, not Claude',owner:true,commands:[`node studio2/storyboard-frames.mjs ${E}`],done:s=>!!s.approvals?.frames?.quote},
 {id:'sound',title:'voice, effects and score (needs the owner OK to spend)',why:'paid generation is cached; ask first, record scope in approvals.json',owner:true,commands:[`node studio2/eleven.mjs dry ${E}`],done:s=>!!s.voiceReal},
 {id:'preflight',title:'preflight PASS',why:'catches known defects in 3 minutes instead of after a 15-minute render',commands:[`node studio2/preflight.mjs ${E}`],done:s=>!!s.preflightOk},
 {id:'render',title:'full render',why:'only after preflight; later changes use render-smart',commands:[`node studio2/render-smart.mjs ${E}`],done:s=>!!s.fullRender},
 {id:'finish',title:'finish: tests, collide, assemble, frame check, motion check',why:'the motion gate compares with the Ref (still share, windows, dissolves, hard cuts)',commands:[`node studio2/finish.mjs ${E}`],done:s=>!!s.finishOk},
 {id:'package',title:'package in out/publish (never uploads)',why:'cover, post.txt with the channel footer and AI disclosure',commands:[`node studio2/package.mjs ${E}`],done:s=>!!s.packageOk},
];
export const nextStep=(state)=>STEPS.find(s=>!s.done(state))||null;
