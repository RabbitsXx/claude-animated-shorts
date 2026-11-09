// studio2 renderer: no approval gates. Serves the runtime, drives headless Edge/Chrome on the hardware GPU,
// captures JPEG frames of a scene module at requested times.
// usage: node studio2/render.mjs --scene episodes/<id>/scene2/main.mjs --times 1,2.5 --out DIR
//        node studio2/render.mjs --scene ... --from 0 --to 8 [--fps 30] --out DIR [--captions] [--words words.json]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args={};for(let i=2;i<process.argv.length;i++){const a=process.argv[i];if(a.startsWith('--')){const k=a.slice(2),v=process.argv[i+1];if(!v||v.startsWith('--'))args[k]=true;else{args[k]=v;i++;}}}
if(!args.scene||!args.out){console.error('need --scene and --out');process.exit(2);}
const three=process.env.STAGE_THREE||path.resolve(ROOT,'../bridge-test/node_modules/three');
if(!fs.existsSync(path.join(three,'package.json')))throw Error('three missing at '+three);
const browser=[process.env.FILM_BROWSER,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean).find(fs.existsSync);
if(!browser)throw Error('Edge/Chrome missing');
// ---- timing words (estimated from SCRIPT.md unless --words is given)
function estimateWords(scriptPath,wpm=Number(args.wpm||222)){
 const txt=fs.readFileSync(scriptPath,'utf8').split('## Narration')[1].split('## Delivery')[0];
 const paras=txt.split('\n').filter(l=>l.startsWith('>')).map(l=>l.slice(1).trim());
 const words=[];let t=0;const per=60/wpm;
 for(const p of paras){for(const w of p.split(/\s+/)){const len=Math.max(1,w.replace(/[^a-z0-9]/gi,'').length);const d=per*(.6+len/8);words.push({word:w,start:t,end:t+d});t+=d;if(/[.!?]$/.test(w))t+=.22;else if(/,$/.test(w))t+=.1;}t+=.18;}
 return words;
}
let words;
if(args.words)words=JSON.parse(fs.readFileSync(path.resolve(args.words),'utf8'));
else{const m=args.scene.match(/^(episodes\/[^/]+)\//);if(!m)throw Error('no episode in scene path; pass --words');words=estimateWords(path.join(ROOT,m[1],'SCRIPT.md'));}
const duration=words.at(-1).end+.6;
const fps=Number(args.fps||30);
let times;
if(args.times)times=String(args.times).split(',').map(Number);
else{const from=Number(args.from??0),to=Number(args.to??duration);times=[];for(let f=Math.round(from*fps);f<Math.round(to*fps);f++)times.push(f/fps);}
const out=path.resolve(args.out);fs.mkdirSync(out,{recursive:true});
const token=randomBytes(24).toString('hex');
const collideMode=args['collide-only']?'only':args.collide?'check':null;
const filmJson=(()=>{const m=String(args.scene).match(/^(episodes\/[^/]+)\//),f=m&&path.join(ROOT,m[1],'film.json');return f&&fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};})();
const config={collide:collideMode,scene:args.scene,times,words,duration,captions:!!args.captions,captionWords:filmJson.captionWords||3,token,indexBase:Number(args.indexBase||0),quality:Number(args.quality||.95)};
let resolve,reject,count=0;const done=new Promise((a,b)=>{resolve=a;reject=b;});
const types={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const roots=[['/vendor/',three],['/runtime/',path.join(ROOT,'studio2/runtime')],['/repo/',ROOT]];
const server=http.createServer((req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname,send=(code,data,type='text/plain')=>{res.writeHead(code,{'content-type':type});res.end(data);};
 if(route==='/')return send(200,'<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222}canvas{height:100vh;width:auto}</style><script>function rep(m){fetch("/config.json").then(r=>r.json()).then(c=>fetch("/done",{method:"POST",headers:{"x-render-token":c.token},body:JSON.stringify({error:m})}));}addEventListener("error",e=>rep(e.message));addEventListener("unhandledrejection",e=>rep(String(e.reason&&e.reason.stack||e.reason)));</script><script type="importmap">{"imports":{"three":"/vendor/build/three.module.js","three/addons/":"/vendor/examples/jsm/"}}</script><script type="module" src="/runtime/bootstrap.js"></script>','text/html');
 if(route==='/config.json')return send(200,JSON.stringify(config),'application/json');
 if(route==='/favicon.ico')return send(204,'');
 if(route==='/capture'||route==='/done'){
  if(req.method!=='POST'||req.headers['x-render-token']!==token)return send(403,'Forbidden');const chunks=[];
  req.on('data',c=>chunks.push(c));
  req.on('end',()=>{try{const d=JSON.parse(Buffer.concat(chunks));if(route==='/capture'){if(!/^f\d{5}\.jpg$/.test(d.file))throw Error('bad file');fs.writeFileSync(path.join(out,d.file),Buffer.from(d.data.split(',')[1],'base64'));count++;if(count%60===0)console.log('frames',count,'/',times.length);}else{if(d.error)throw Error(d.error);fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(d,null,1));resolve(d);}send(200,'ok');}catch(e){send(500,String(e));reject(e);}});return;
 }
 const match=roots.find(([p])=>route.startsWith(p));if(!match)return send(404,'Missing');
 const file=path.resolve(match[1],decodeURIComponent(route.slice(match[0].length)));if(!file.startsWith(path.resolve(match[1])))return send(403,'Forbidden path');
 const ext=path.extname(file);if(!types[ext]||/\.\.|\.env|\.git/i.test(route))return send(403,'Unsupported');
 fs.readFile(file,(e,b)=>send(e?404:200,e?'Missing '+route:b,types[ext]));
});
const port=await new Promise(r=>server.listen(0,'127.0.0.1',()=>r(server.address().port)));
const logs=path.join(ROOT,'studio2/.runs');fs.mkdirSync(logs,{recursive:true});
const child=spawn(browser,['--headless=new','--use-angle=d3d11','--ignore-gpu-blocklist','--no-first-run','--disable-extensions','--disable-background-timer-throttling','--disable-renderer-backgrounding',`--user-data-dir=${path.join(logs,'b-'+Date.now())}`,`http://127.0.0.1:${port}/`],{stdio:['ignore','ignore','pipe']});
child.stderr.on('data',b=>fs.appendFileSync(path.join(logs,'browser.log'),b));child.on('error',reject);child.on('exit',c=>reject(Error('browser exited '+c)));
const timer=setTimeout(()=>reject(Error('render timeout')),Number(args.timeout||1800)*1000);
try{const r=await done;
 if(args['meta-out']){fs.mkdirSync(path.dirname(path.resolve(args['meta-out'])),{recursive:true});fs.writeFileSync(path.resolve(args['meta-out']),JSON.stringify(r.meta));}
 if(collideMode){
  const bad=r.meta.filter(m=>m.hits&&m.hits.length),groups=new Map();
  for(const m of bad)for(const h of m.hits){const k=h.actor+' '+h.part+' x '+h.mesh,g=groups.get(k)||{n:0,t0:m.t,t1:m.t,max:0,at:h.at};g.n++;g.t1=m.t;g.max=Math.max(g.max,h.depth);groups.set(k,g);}
  const rows=[...groups].map(([k,g])=>({what:k,from:+g.t0.toFixed(2),to:+g.t1.toFixed(2),frames:g.n,maxDepthM:g.max,at:g.at})).sort((a,b)=>a.from-b.from);
  for(const r of rows)console.log('OVERLAP',r.what,`t=${r.from}-${r.to}s`,`frames=${r.frames}`,`depth<=${r.maxDepthM}m`,'at',JSON.stringify(r.at));
  if(args['collide-out']){fs.mkdirSync(path.dirname(path.resolve(args['collide-out'])),{recursive:true});fs.writeFileSync(path.resolve(args['collide-out']),JSON.stringify({checkedFrames:r.meta.length,times:[times[0],times.at(-1)],step:times.length>1?+(times[1]-times[0]).toFixed(4):0,overlaps:rows,cameras:r.meta.map(m=>m.cam||null),dressing:r.meta.filter(m=>m.dress).map(m=>({t:m.t,dress:m.dress})),intent:r.meta.filter(m=>m.intent).map(m=>({t:m.t,...m.intent})),ok:rows.length===0,checkedAt:new Date().toISOString(),sourceHash:args['source-hash']||null},null,1));}
  if(args['collide-out']){ // one line per gate run: studio2/retro.mjs turns these into "how many runs did this film need"
   const kinds=rows.map(x=>x.what.replace(/crowd\d+/g,'crowd').replace(/ \d+(\.\d+)?$/,''));
   fs.appendFileSync(path.join(path.dirname(path.resolve(args['collide-out'])),'gate-history.jsonl'),JSON.stringify({at:new Date().toISOString(),ok:rows.length===0,overlaps:rows.length,frames:r.meta.length,kinds})+String.fromCharCode(10));}
  console.log(rows.length?`COLLIDE FAIL: ${rows.length} overlap(s) in ${bad.length}/${r.meta.length} frames`:`COLLIDE PASS: ${r.meta.length} frames, no overlaps`);
  if(rows.length)process.exitCode=3;
 }
if(!collideMode&&args.from!==undefined){ // full renders are logged next to the frames folder
 try{fs.appendFileSync(path.join(path.dirname(path.resolve(args.out)),'render-history.jsonl'),JSON.stringify({at:new Date().toISOString(),frames:count,from:Number(args.from),to:Number(args.to),quality:Number(args.quality||0)})+String.fromCharCode(10));}catch{}}
for(const m of r.meta)if(m.reach>.03)console.log('reach',m.t.toFixed(2),m.reach.toFixed(3),m.note);console.log(`PASS ${count} frames; gpu=${r.gpu}; max reach err=${Math.max(0,...r.meta.map(m=>m.reach)).toFixed(4)}`);}
catch(e){console.error('FAIL',e.message||e);process.exitCode=1;}
finally{clearTimeout(timer);if(child.pid)spawnSync('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore'});server.close();}
