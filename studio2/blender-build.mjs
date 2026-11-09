// Build one model in Blender (headless) and export it as GLB: owner order 2026-11-09, every model is sculpted in Blender and exported, never built from code primitives.
//   node studio2/blender-build.mjs --episode episodes/<id> --model <modelId>
// Runs episodes/<id>/blender/<modelId>.py with studio2/blender/bl_kit.py, writes episodes/<id>/scene2/models/glb/<modelId>.glb and a four-view preview strip
// episodes/<id>/out/models/<modelId>-blender.jpg (Workbench renders; look at it before passing the model). Blender path: env BLENDER or F:/Blender/blender.exe.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),get=k=>a.includes(k)?a[a.indexOf(k)+1]:null,epRel=get('--episode'),model=get('--model');
if(!epRel||!model){console.error('usage: node studio2/blender-build.mjs --episode episodes/<id> --model <modelId>');process.exit(2);}
const blender=process.env.BLENDER||'F:/Blender/blender.exe',script=path.join(ROOT,epRel,'blender',model+'.py');
if(!fs.existsSync(blender)){console.error('Blender not found at '+blender+' (set BLENDER)');process.exit(2);}
if(!fs.existsSync(script)){console.error('missing '+path.relative(ROOT,script));process.exit(2);}
const out=path.join(ROOT,epRel,'out/models');fs.mkdirSync(out,{recursive:true});
const prev=path.join(ROOT,'studio2/.tmp','bl-'+model);fs.rmSync(prev,{recursive:true,force:true});
const r=spawnSync(blender,['-b','--python',script],{cwd:ROOT,encoding:'utf8',maxBuffer:1<<28,env:{...process.env,STUDIO_ROOT:ROOT,EPISODE:path.join(ROOT,epRel),MODEL:model,PREVIEW_DIR:prev}});
const lines=(r.stdout||'').split('\n').filter(l=>/EXPORTED|PREVIEW|Error|Traceback|error:/.test(l));
console.log(lines.join('\n')||(r.stderr||'').slice(-600));
if(r.status!==0||!lines.some(l=>l.startsWith('EXPORTED'))){console.error('BLENDER BUILD FAILED');console.error((r.stdout||'').split('\n').slice(-25).join('\n'));process.exit(1);}
if(fs.existsSync(prev)){
 const py=`from PIL import Image;import os,sys\nd=sys.argv[1];fs=sorted(f for f in os.listdir(d) if f.endswith('.png'));ims=[Image.open(os.path.join(d,f)).convert('RGB') for f in fs];w=sum(i.width for i in ims);s=Image.new('RGB',(w,ims[0].height));x=0\nfor i in ims:s.paste(i,(x,0));x+=i.width\ns.save(sys.argv[2],quality=88)`;
 spawnSync('python',['-c',py,prev,path.join(out,model+'-blender.jpg')],{cwd:ROOT});console.log('PREVIEW STRIP',path.relative(ROOT,path.join(out,model+'-blender.jpg')));
}
