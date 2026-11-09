// Pauses between narration paragraphs, added locally (free) so the picture has room to play its silent gags: the voice take is cut in the
// silence between paragraphs and each cut gets a gap of silence. Word timings shift with it. film.json `voiceGaps` lists one gap (seconds)
// per paragraph, the last one is the tail. Used by studio2/voicegaps.mjs.
export function paragraphCounts(scriptMd){
 return scriptMd.split(/\r?\n/).filter(l=>l.startsWith('> ')).map(l=>l.slice(2).trim().split(/\s+/).filter(Boolean).length);
}
export function planGaps(words,counts,gaps){
 const n=counts.length;
 if(counts.reduce((a,b)=>a+b,0)!==words.length)throw Error(`paragraph word counts (${counts.reduce((a,b)=>a+b,0)}) do not match the words (${words.length})`);
 if(gaps.length!==n||gaps.some(g=>!(g>=0)))throw Error(`need one gap of 0 or more seconds per paragraph (${n}), got ${JSON.stringify(gaps)}`);
 const first=[],last=[];let i=0;for(const c of counts){first.push(i);last.push(i+c-1);i+=c;}
 const cut=k=>(words[last[k]].end+words[first[k+1]].start)/2; // k = the paragraph before the cut
 const segments=counts.map((_,k)=>({from:k?cut(k-1):0,to:k<n-1?cut(k):words[last[k]].end,gap:gaps[k]}));
 const out=[];let offset=0;
 for(let k=0;k<n;k++){for(let j=first[k];j<=last[k];j++)out.push({...words[j],start:words[j].start+offset,end:words[j].end+offset});offset+=gaps[k];}
 return {words:out,segments,total:words[words.length-1].end+offset};
}
