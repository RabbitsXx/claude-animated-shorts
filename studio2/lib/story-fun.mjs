// FUN GATE (owner rule 2026-11-08): the story must be fun BEFORE anyone shows it to the owner. The owner had to catch a flat middle in stop-time-hour (the want was met
// at 40%, every beat was a low-stakes prank, the rival appeared at 53%, the ending was sad). The shape limits of story-audit.mjs cannot see that, so a story with film.json
// "funGate": true must also carry these fields, and this pure function fails it when the fun is missing. It checks that the author did the thinking, not that the jokes are good:
// a person still judges the jokes, but a story that fails here must never reach a person.
//
// STORY.json additions:
//   retell            the one sentence a viewer tells a friend (8+ words)
//   antagonist        {who, firstBeat}  the rival or threat is on screen by beat 2 (15% of the film)
//   wantResolvedAt    beat number where the want is finally won or lost: no earlier than 70% of the film (no relief in the middle)
//   twist             {plantBeat, payoffBeat}  planted by 55% of the film, paid in the last two beats, at least 3 beats apart
//   endingTone        'funny' | 'warm' | 'twist'  (never 'sad')
//   weakestBeat       {beat, fix}  the red-team record: the author named the weakest beat and what was done about it
//   every beat        funny (what makes the viewer laugh or gasp, 3+ words), pressure (1-5, how much is at stake), and for kind 'gag' fromRule (true when the joke
//                     comes from the premise's own rule, not a generic prank)
export function auditFun(story,beats=story.beats||[]){
 const fail=[],n=beats.length,words=(s)=>String(s||'').trim().split(/\s+/).filter(Boolean).length,at=(i)=>i/Math.max(1,n);
 if(words(story.retell)<8)fail.push('"retell" is missing: write the one sentence (8+ words) a viewer would tell a friend; if you cannot, the story is not clear or not fun yet');
 const an=story.antagonist||{};
 if(words(an.who)<1)fail.push('"antagonist.who" is missing: name the rival or threat that pushes back');
 const lastEarly=Math.max(2,Math.ceil(n*.15));
 if(!Number.isInteger(an.firstBeat)||an.firstBeat<1||an.firstBeat>lastEarly)fail.push(`the antagonist must be on screen by beat ${lastEarly} (15% of the film), not beat ${an.firstBeat}; plant the pressure early`);
 const wr=story.wantResolvedAt;
 if(!Number.isInteger(wr)||wr<1||wr>n)fail.push('"wantResolvedAt" must be the beat number where the want is won or lost');
 else if(wr<Math.ceil(n*.7))fail.push(`the want is resolved at beat ${wr} of ${n} (${Math.round(wr/n*100)}%); keep it open until at least 70% or the middle has no tension`);
 const tw=story.twist||{};
 if(!Number.isInteger(tw.plantBeat)||!Number.isInteger(tw.payoffBeat))fail.push('"twist" needs plantBeat and payoffBeat: a surprise that is planted early and pays off at the end');
 else{
  if(tw.payoffBeat<n-1)fail.push(`the twist pays off at beat ${tw.payoffBeat}; it must land in the last two beats (${n-1}-${n})`);
  if(tw.plantBeat>Math.floor(n*.55))fail.push(`the twist is planted at beat ${tw.plantBeat}, after 55% of the film; plant it earlier so the end feels earned`);
  if(tw.payoffBeat-tw.plantBeat<3)fail.push('the twist payoff must come at least 3 beats after its plant');
 }
 if(!['funny','warm','twist'].includes(story.endingTone))fail.push('"endingTone" must be funny, warm or twist: a sad ending is not allowed in a comedy short');
 const wb=story.weakestBeat||{};
 if(!Number.isInteger(wb.beat)||wb.beat<1||wb.beat>n||words(wb.fix)<4)fail.push('"weakestBeat" {beat, fix} is missing: name the weakest beat and what you changed to make it stronger (red-team yourself before showing the owner)');
 beats.forEach((b,i)=>{
  if(words(b.funny)<3)fail.push(`beat ${i+1} has no "funny": say in a few words what makes the viewer laugh or gasp here; if you cannot, rewrite the beat`);
  if(!Number.isInteger(b.pressure)||b.pressure<1||b.pressure>5)fail.push(`beat ${i+1} needs "pressure" 1-5 (how much is at stake right now)`);
 });
 const p=beats.map(b=>b.pressure);
 if(p.every(Number.isInteger)&&n>=6){
  let ups=0;for(let i=1;i<n;i++)if(p[i]>p[i-1])ups++;
  if(ups<3)fail.push(`pressure only rises ${ups} time(s); it must step up at least 3 times (a flat middle is a list of gags, not a story)`);
  let run=1,worst=1;for(let i=1;i<n;i++){run=p[i]===p[i-1]?run+1:1;worst=Math.max(worst,run);}
  if(worst>=4)fail.push(`pressure stays the same for ${worst} beats in a row; change what is at stake`);
  const peak=Math.max(...p),first=p.indexOf(peak)+1;
  if(peak<4)fail.push('the story never reaches pressure 4 or 5');
  const lo=Math.ceil(n*.55),hi=Math.ceil(n*.9),inWin=p.some((v,i)=>v===peak&&i+1>=lo&&i+1<=hi);
  if(peak>=4&&!inWin)fail.push(`the peak pressure first appears at beat ${first}; it must fall between beats ${lo} and ${hi} (55-90% of the film)`);
 }
 const gags=beats.filter(b=>b.kind==='gag');
 if(gags.length&&gags.filter(b=>b.fromRule===true).length/gags.length<.7)fail.push('fewer than 70% of the gags come from the premise\'s own rule (fromRule:true); generic pranks are not funny enough: let the rule of this world make the joke');
 return fail;
}
