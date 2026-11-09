// Which caption words are on screen at time t. The reference shows one or two words at a time. film.json "captionWords":
//   3 (default, the original behaviour), 2, 1 = fixed maximum; "auto" = one or two words as fits the phrase.
// A chunk never runs past punctuation. Pure functions shared by the browser renderer (bootstrap.js) and the tests.
const stops=/[.!?,:]$/;
const clean=(w)=>w.toLowerCase().replace(/[^a-z']/g,'');
const DET=new Set('the a an his her its their my your'.split(' '));          // an article or possessive always goes with its noun
const LINK=new Set('of to in on at and but so with for from as than'.split(' ')); // prepositions and conjunctions
const PRON=new Set('he she it they we you i'.split(' '));
const AUX=new Set('was were is are had has have do did no not'.split(' '));
const isLong=(w)=>clean(w.word).length>=9||(w.end-w.start)>.55;           // long or slowly spoken words stand alone
// auto grouping: left to right, pair two words only when they read as a unit
function autoChunks(words){
 const out=[];let i=0;
 while(i<words.length){
  const w=words[i],nx=words[i+1],one=()=>{out.push({words:[w]});i+=1;};
  if(!nx||stops.test(w.word)||isLong(w)||nx.start-w.end>.25||(isLong(nx)&&!DET.has(clean(w.word)))){one();continue;}
  const a=clean(w.word),b=clean(nx.word);let pair=false;
  if(DET.has(a))pair=true;                                                    // the | whole -> "the whole"
  else if(LINK.has(a))pair=!(DET.has(b)||PRON.has(b)||LINK.has(b)||AUX.has(b));                        // "on | a cart", "so | he grabbed" stand apart
  else if(PRON.has(a)||AUX.has(a))pair=!(DET.has(b)||LINK.has(b));            // "he put", "had spent"
  else pair=!(DET.has(b)||LINK.has(b)||PRON.has(b)||AUX.has(b))&&a.length<=7&&b.length<=7&&(nx.end-w.start)<=.9; // two short content words
  if(pair){out.push({words:[w,nx]});i+=2;}else one();
 }
 return out;
}
function fixedChunks(words,max){
 const out=[];let cur=[];
 for(const w of words){cur.push(w);if(stops.test(w.word)||cur.length>=max){out.push({words:cur});cur=[];}}
 if(cur.length)out.push({words:cur});
 return out;
}
export const chunksOf=(words,mode=3)=>mode==='auto'?autoChunks(words):fixedChunks(words,Number(mode)||3);
const memo=new WeakMap();
export function chunkAt(words,t,mode=3){
 const a=words.findIndex(w=>t>=w.start&&t<w.end+.12);if(a<0)return null;
 let byMode=memo.get(words);if(!byMode){byMode=new Map();memo.set(words,byMode);}
 let cs=byMode.get(mode);if(!cs){cs=chunksOf(words,mode);byMode.set(mode,cs);}
 // the chunk that contains word a (words are the same objects in both lists)
 for(const c of cs)if(c.words.includes(words[a]))return c.words.map(w=>w.word).join(' ');
 return null;
}
