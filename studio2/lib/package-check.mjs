// The delivery package check (pure part of studio2/package.mjs). Measured things only; the rest goes to a person.
export function checkPackage({qa,files,channel={},post={},finalBytes=0}){
 const [lo,hi]=channel.lengthSeconds||[55,70],lufs=parseFloat(qa.integratedLUFS),peak=parseFloat(qa.truePeakDBFS);
 const checks={
  decode:qa.decodeErrors==='none',
  duration:qa.formatDuration>=lo&&qa.formatDuration<=hi,
  resolution:qa.width===1080&&qa.height===1920,
  black:qa.blackSegments===0,
  freeze:(qa.freezeSegments||[]).length===0,
  loudness:lufs>=-15&&lufs<=-13,
  peak:peak<=-1,
  title:typeof post.title==='string'&&post.title.trim().length>0&&post.title.length<=100,
  files:['final.mp4','cover.png','cover-small.jpg','post.txt'].every(f=>files.includes(f)),
 };
 const notes=[];if(finalBytes>30e6)notes.push(`final.mp4 is ${(finalBytes/1e6).toFixed(0)} MB: over 30 MB it cannot be sent through the chat`);
 return {ok:Object.values(checks).every(Boolean),checks,notes,
  personMustJudge:['watch the whole film and listen to the voice, the sounds and the music (nobody has)','judge whether the cover has no text and is the one you want','answer YouTube\'s altered or synthetic content question yourself when you upload','decide the title, description and keywords','check the survival advice against a real manual before relying on it']};
}
