// Story audit: run it on the written plan (episodes/<id>/STORY.json) BEFORE paid voice and before any scene work.
// It checks the shape of the story against limits taken from the reference clip (reference/study/story-limits.json):
// events per minute, cuts per minute, how much of the film is explainer-only, a want, stakes, a reversal, a payoff, gags,
// and whether the film can be followed with the sound off. Exit code 6 = the plan is weaker than the reference; fix the plan
// (not the thresholds). take 1 of reaction-time-10x skipped this step and was judged much weaker than the reference.
// usage: node studio2/story-audit.mjs --episode episodes/<id> [--story STORY.json]
//
// STORY.json: {want, stakes, reversal, payoff, beats:[{t0,t1,kind,inWorld,silent,cuts,event,consequence}]}
//   kind: event (a physical thing happens with a visible consequence) | gag | reveal (scale/world/rival shown) | reaction | choice (the hero decides, survival profile) | explain
//   explain = a widget or diagram that carries information with no character acting a stake. inWorld:false marks a floating widget.
//   cuts = number of shots inside the beat (default 1). silent:true = understandable with the sound off.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditSurvival,limitsFor} from './lib/story-profiles.mjs';
import {auditFun} from './lib/story-fun.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
const ep=path.join(ROOT,get('--episode','episodes/reaction-time-10x'));
const storyFile=get('--story','STORY.json');
let profile='explainer',channelCfg={};try{const film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8'));if(film.channel){channelCfg=JSON.parse(fs.readFileSync(path.join(ROOT,'channels',film.channel,'channel.json'),'utf8'));profile=channelCfg.storyProfile||'explainer';}}catch{}
const story=JSON.parse(fs.readFileSync(path.join(ep,storyFile),'utf8'));
const lim=JSON.parse(fs.readFileSync(path.join(ROOT,'reference/study/story-limits.json'),'utf8')),L=limitsFor(lim.limits,channelCfg),R=lim.reference;
const beats=story.beats||[];const fail=[],note=[];
const len=Math.max(...beats.map(b=>b.t1))-Math.min(...beats.map(b=>b.t0)),min=len/60;
const cuts=beats.reduce((s,b)=>s+(b.cuts??1),0); // cuts:0 = the same continuous shot carries on from the previous beat
const dur=(b)=>b.t1-b.t0,sum=(f)=>beats.filter(f).reduce((s,b)=>s+dur(b),0);
const explain=sum(b=>b.kind==='explain'),floating=sum(b=>b.kind==='explain'&&b.inWorld===false);
const eventful=beats.filter(b=>['event','gag','reveal','reaction','choice'].includes(b.kind)&&b.event&&b.consequence).length;
const gags=beats.filter(b=>b.kind==='gag').length,silent=beats.filter(b=>b.silent).length/Math.max(1,beats.length);
let run=0,maxRun=0,runAt=0;for(const b of beats){if(b.kind==='explain'){run+=dur(b);if(run>maxRun){maxRun=run;runAt=b.t0;}}else run=0;}
const m={lengthSeconds:+len.toFixed(1),beats:beats.length,shots:cuts,cutsPerMinute:+(cuts/min).toFixed(1),averageShotSeconds:+(len/cuts).toFixed(1),eventsPerMinute:+(eventful/min).toFixed(1),explainerShare:+(explain/len).toFixed(2),floatingWidgetShare:+(floating/len).toFixed(2),longestExplainRun:+maxRun.toFixed(1),silentReadableShare:+silent.toFixed(2),gags};
if(len<L.lengthSeconds[0]||len>L.lengthSeconds[1])fail.push(`length ${m.lengthSeconds}s is outside ${L.lengthSeconds[0]}-${L.lengthSeconds[1]}s`);
if(m.cutsPerMinute>L.maxCutsPerMinute)fail.push(`${m.cutsPerMinute} cuts/min is above ${L.maxCutsPerMinute} (reference ${R.cutsPerMinute}); use longer continuous camera moves in which things happen (${m.shots} shots, average ${m.averageShotSeconds}s; reference ${R.averageShotSeconds}s)`);
if(m.eventsPerMinute<L.minEventsPerMinute)fail.push(`${m.eventsPerMinute} events/min is below ${L.minEventsPerMinute} (reference ${R.editorialBeatsPerMinute}); an event is something that happens AND changes what we see`);
if(m.explainerShare>L.maxExplainerShare)fail.push(`${Math.round(m.explainerShare*100)}% of the film is explainer-only, above ${L.maxExplainerShare*100}% (reference ${R.explainerInsertShare*100}%); explain with things that happen to the character in the world`);
if(maxRun>L.maxExplainerRunSeconds)fail.push(`an explainer run lasts ${m.longestExplainRun}s from ${runAt}s, above ${L.maxExplainerRunSeconds}s; cut back to the story`);
if(m.silentReadableShare<L.minSilentReadableShare)fail.push(`only ${Math.round(m.silentReadableShare*100)}% of beats read with the sound off, below ${L.minSilentReadableShare*100}%`);
if(gags<L.minGags)fail.push(`${gags} gags, need at least ${L.minGags}`);
for(const k of L.requireFields)if(!story[k]||String(story[k]).trim().length<12)fail.push(`STORY.json is missing a real "${k}"`);
if(profile==='survival'){ // channel post-time-survival: a danger ladder with a choice instead of thesis, facts and carrier
 fail.push(...auditSurvival(story,beats));m.profile='survival';
}else{
// Clarity gate (take 1-3 of reaction-time-10x passed every shape limit and was still judged hard to follow):
// one sentence the viewer can repeat, at most 4 facts, and each fact carried by a big thing in the world.
const words=String(story.thesis||'').trim().split(/\s+/).filter(Boolean).length;
if(words<4||words>22)fail.push(`"thesis" must be one sentence of 4-22 words that the viewer can repeat after the film (has ${words})`);
const facts=Array.isArray(story.facts)?story.facts:[];
const maxFacts=L.maxFacts??2;
if(facts.length<1||facts.length>maxFacts)fail.push(`${facts.length} facts in "facts"; a 60 s short can land 1-${maxFacts} (the reference teaches ${R.factsTaught??1}; more is a lecture the viewer cannot follow)`);
// One carrier object that stays on screen and visibly changes while the fact is taught (reference: the loop, seen in about half the beats).
const carrier=story.carrier||{},cbeats=[...new Set((carrier.beats||[]).filter(n=>beats[(n|0)-1]))];
const carrierShare=cbeats.length/Math.max(1,beats.length);
if(String(carrier.object||'').trim().length<4)fail.push('"carrier.object" is missing: name the one object that carries the fact and stays on screen');
else if(carrierShare<(L.minCarrierShare??.4))fail.push(`carrier "${carrier.object}" appears in ${cbeats.length} of ${beats.length} beats (${Math.round(carrierShare*100)}%), below ${(L.minCarrierShare??.4)*100}% (reference ${Math.round((R.carrierShare??.5)*100)}%); keep it in view and let it change`);
m.carrierShare=+carrierShare.toFixed(2);
// Plant -> reveal: the consequence is shown early, the explanation arrives late, so the viewer is curious in between.
if(facts[0]){const f0=facts[0],b0=beats[(f0.beat|0)-1];
 if(b0){const at=(b0.t0-beats[0].t0)/len,[lo,hi]=L.factRevealRange??[.4,.8];
  if(at<lo||at>hi)fail.push(`the main fact is revealed at ${Math.round(at*100)}% of the film; reveal it between ${lo*100}% and ${hi*100}% (reference ${Math.round((R.factRevealAt??.65)*100)}%) so the viewer is curious first`);
  const pb=beats[(f0.plant|0)-1];
  if(!pb||f0.plant>=f0.beat)fail.push('the main fact needs a "plant": the beat number (before the reveal) that shows its consequence, e.g. the dummy crushed like a can');}}
const usedBeats=new Set();
facts.forEach((f,i)=>{const b=beats[(f.beat|0)-1];
 if(!b)return fail.push(`fact ${i+1} points at beat ${f.beat}, which does not exist`);
 if(usedBeats.has(f.beat))fail.push(`fact ${i+1} shares beat ${f.beat} with another fact; one fact per beat`);usedBeats.add(f.beat);
 if(b.kind==='explain'&&b.inWorld===false)fail.push(`fact ${i+1} ("${f.fact}") lands on a floating widget (beat ${f.beat}); carry it with an object in the world`);
 if(String(f.onScreen||'').trim().length<8)fail.push(`fact ${i+1} has no "onScreen": name the big object or action that shows it`);});
m.facts=facts.length;m.thesisWords=words;
 m.profile='explainer';
}
beats.forEach((b,i)=>{if(!b.event||!b.consequence)fail.push(`beat ${i+1} (${b.t0}-${b.t1}s) names no event or no visible consequence`);});
// Fun gate (owner rule 2026-11-08): films made after that date set film.json funGate:true; older films are exempt. See studio2/lib/story-fun.mjs.
let funGate=false;try{funGate=!!JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')).funGate;}catch{}
if(funGate){const ff=auditFun(story,beats);fail.push(...ff.map(x=>'FUN GATE: '+x));m.funGate=ff.length===0?'pass':'fail';}
console.log('story audit for',path.relative(ROOT,ep));console.log(JSON.stringify(m,null,1));console.log('reference:',JSON.stringify({cutsPerMinute:R.cutsPerMinute,averageShotSeconds:R.averageShotSeconds,eventsPerMinute:R.editorialBeatsPerMinute,explainerShare:R.explainerInsertShare}));
const ok=fail.length===0;fs.mkdirSync(path.join(ep,'out'),{recursive:true});fs.writeFileSync(path.join(ep,'out/story-audit.json'),JSON.stringify({ok,story:storyFile,metrics:m,failures:fail,checkedAt:new Date().toISOString()},null,1));
if(ok)console.log('STORY PASS');else{console.log('STORY FAIL: '+fail.length+' problem(s)');for(const f of fail)console.log(' - '+f);process.exit(6);}
