// Start a new episode from a finished one: copies the scene code and film settings, never generated media,
// approvals or the other film's script text.
import fs from 'node:fs';
import path from 'node:path';
import {survivalTemplate} from './story-profiles.mjs';
import {gateFlags} from './ref-contract.mjs';
const SKIP=new Set(['renders','voice','audio','out','.history','node_modules']);
const copyTree=(src,dst)=>{
 fs.mkdirSync(dst,{recursive:true});
 for(const e of fs.readdirSync(src,{withFileTypes:true})){
  if(SKIP.has(e.name))continue;
  const s=path.join(src,e.name),d=path.join(dst,e.name);
  if(e.isDirectory())copyTree(s,d);else fs.copyFileSync(s,d);
 }
};
export function scaffold({root,from,id,channel}){
 if(!/^[a-z0-9][a-z0-9-]*$/.test(id||''))throw Error('id must be lowercase letters, digits and dashes: '+id);
 const src=path.join(root,'episodes',from),dest=path.join(root,'episodes',id);
 if(!fs.existsSync(path.join(src,'film.json')))throw Error('source episode not found: '+src);
 if(fs.existsSync(dest))throw Error('episode already exists: '+dest);
 copyTree(path.join(src,'scene2'),path.join(dest,'scene2'));
 let profile=null;
 if(channel){const cf=path.join(root,'channels',channel,'channel.json');if(!fs.existsSync(cf))throw Error('channel not found: '+channel+' (channels/<id>/channel.json)');profile=JSON.parse(fs.readFileSync(cf,'utf8')).storyProfile;}
 const old=JSON.parse(fs.readFileSync(path.join(src,'film.json'),'utf8'));for(const k of ['voiceGaps','mixSeconds','voiceTargetSeconds'])delete old[k]; // timing of the old film's voice, never valid for a new one
 const film={...old,id,...(channel?{channel}:{}),...gateFlags()}; // owner rules 2026-11-08: fun gate (studio2/lib/story-fun.mjs), real-at-touch-points gate, scene quality gate (studio2/lib/scene-quality.mjs)
 fs.writeFileSync(path.join(dest,'film.json'),JSON.stringify(film,null,1));
 fs.mkdirSync(path.join(dest,'blender'),{recursive:true});fs.writeFileSync(path.join(dest,'blender/README.md'),'# Blender models'+String.fromCharCode(10)+''+String.fromCharCode(10)+'One script per model: blender/<modelId>.py (uses studio2/blender/bl_kit.py), built with: node studio2/blender-build.mjs --episode episodes/<id> --model <modelId>. The GLB lands in scene2/models/glb/. Rule (owner 2026-11-09): every model is sculpted in Blender and exported, never built from code primitives.'+String.fromCharCode(10)+'');fs.writeFileSync(path.join(dest,'approvals.json'),'{}');
 fs.writeFileSync(path.join(dest,'topic.json'),JSON.stringify({selected:null,candidates:[]},null,1));
 fs.writeFileSync(path.join(dest,'SCRIPT.md'),`# TITLE\n\n## Facts and sources\n\n- (real facts with where they came from; mark fiction as fiction)\n\n## Narration\n\n> One sentence per line, each starting with "> ". 55-70 seconds in total.\n\n## Delivery\n\n- (voice notes)\n`);
 fs.writeFileSync(path.join(dest,'HANDOFF.md'),`# ${id} - handoff\n\nStarted from \`${from}\`. Follow docs/WORKFLOW.md. Nothing approved yet.\n`);
 if(profile==='survival')fs.writeFileSync(path.join(dest,'STORY.json'),JSON.stringify(survivalTemplate(),null,1));
 return dest;
}
