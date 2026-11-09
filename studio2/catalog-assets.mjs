// Catalogue of reusable sounds, music and props across all films, and a search over it.
//   node studio2/catalog-assets.mjs                      rebuild assets/CATALOG.json (run after a film adds sounds or props)
//   node studio2/catalog-assets.mjs --find "egg splat" [--kind sfx|music|prop]
// Reuse before you generate (ElevenLabs costs money and time) or rewrite (props live in episodes/<id>/scene2/props*.mjs).
// The props picture of square-wheel is studio2/library/catalog/props-square-wheel.jpg (made with studio2/library/props-sheet.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildCatalog,findEntries,propsFromSource} from './lib/catalog.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),OUT=path.join(ROOT,'assets/CATALOG.json');
const a=process.argv.slice(2),get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d;
if(a.includes('--find')){
 let c;try{c=JSON.parse(fs.readFileSync(OUT,'utf8'));}catch{console.error('no catalogue yet: run node studio2/catalog-assets.mjs');process.exit(1);}
 const r=findEntries(c,get('--find',''),{kind:get('--kind',null)});
 if(!r.length)console.log('nothing matches: generate it (needs the user\'s OK to spend) or write it');
 for(const e of r)console.log(`${e.kind.padEnd(5)} ${e.id}${e.seconds?`  ${e.seconds}s`:''}  ${e.path}  [${e.origin}]  ${e.tags.slice(0,6).join(' ')}${e.sig?`  (${e.sig})`:''}`);
 process.exit(0);
}
const rd=(f)=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'));}catch{return null;}};
const dur=(rel)=>{const p=path.join(ROOT,rel);if(!fs.existsSync(p))return null;const r=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',p],{encoding:'utf8'});const x=parseFloat(r.stdout);return Number.isFinite(x)?+x.toFixed(2):null;};
const sfx=[],music=[],props=[];
for(const e of (rd('studio2/lib/sfx-baseline.json')||{effects:[]}).effects){const p=`assets/sfx/${e.id}.wav`;if(fs.existsSync(path.join(ROOT,p)))sfx.push({id:e.id,seconds:dur(p),prompt:e.prompt,path:p,film:'studio'});}
const eps=fs.existsSync(path.join(ROOT,'episodes'))?fs.readdirSync(path.join(ROOT,'episodes')):[];
for(const ep of eps){
 const fx=rd(`episodes/${ep}/audio/effects.json`);
 if(fx){for(const e of fx.effects||[]){const p=`episodes/${ep}/audio/${e.id}.wav`;if(fs.existsSync(path.join(ROOT,p)))sfx.push({id:e.id,seconds:dur(p),prompt:e.prompt,path:p,film:ep});}
  const sp=`episodes/${ep}/audio/score.wav`;if(fx.music&&fs.existsSync(path.join(ROOT,sp)))music.push({id:`${ep}-score`,seconds:dur(sp),prompt:fx.music.prompt,path:sp,film:ep});}
 const sd=path.join(ROOT,'episodes',ep,'scene2');
 if(fs.existsSync(sd))for(const f of fs.readdirSync(sd).filter(f=>/^props.*\.mjs$/.test(f)))for(const p of propsFromSource(fs.readFileSync(path.join(sd,f),'utf8')))props.push({film:ep,file:`episodes/${ep}/scene2/${f}`,...p});
}
const c=buildCatalog({sfx,music,props});fs.writeFileSync(OUT,JSON.stringify(c,null,1));
console.log(`catalogue: ${sfx.length} sounds, ${music.length} music, ${props.length} props -> assets/CATALOG.json`);
