// Channel registry. One repository, one way of making films, several YouTube channels that never mix brand, story rules or text.
// channels/<id>/channel.json is the machine profile, channels/<id>/CHANNEL.md the human one; episodes/<id>/film.json names its channel.
import fs from 'node:fs';
import path from 'node:path';
export const PROFILES=['explainer','survival'];
export function validateChannel(c){
 const p=[],str=(k)=>typeof c[k]==='string'&&c[k].trim().length>0;
 if(!/^[a-z0-9][a-z0-9-]*$/.test(c.id||''))p.push('id must be lowercase letters, digits and dashes');
 if(!(c.name===null||typeof c.name==='string'))p.push('name must be a string (or null while the channel has no name yet)');
 if(!PROFILES.includes(c.storyProfile))p.push(`storyProfile must be one of ${PROFILES.join(', ')}`);
 for(const k of ['descriptionFooter','disclosure','coverStyle'])if(!str(k))p.push(`${k} must be a non-empty string`);
 if(!Array.isArray(c.hashtags)||!c.hashtags.every(h=>/^#\w+$/.test(h)))p.push('hashtags must be an array of #words');
 if(c.lengthSeconds!==undefined&&!(Array.isArray(c.lengthSeconds)&&c.lengthSeconds.length===2&&c.lengthSeconds.every(Number.isFinite)&&c.lengthSeconds[0]<c.lengthSeconds[1]&&c.lengthSeconds[1]<=180))p.push('lengthSeconds must be [min, max] with min below max and max up to 180');
 return p;
}
export function loadChannels(root){
 const dir=path.join(root,'channels'),out={};
 if(!fs.existsSync(dir))return out;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,e.name,'channel.json');if(!e.isDirectory()||!fs.existsSync(f))continue;
  const c=JSON.parse(fs.readFileSync(f,'utf8'));
  if(c.id!==e.name)throw new Error(`channel id "${c.id}" differs from its folder "${e.name}"`);
  const p=validateChannel(c);if(p.length)throw new Error(`channels/${e.name}/channel.json: ${p.join('; ')}`);
  out[e.name]=c;
 }
 return out;
}
export function episodesByChannel(root){
 const channels=loadChannels(root),dir=path.join(root,'episodes'),g={unassigned:[],unknown:[]};
 for(const id of Object.keys(channels))g[id]=[];
 if(!fs.existsSync(dir))return g;
 for(const e of fs.readdirSync(dir).sort()){
  const f=path.join(dir,e,'film.json');if(!fs.existsSync(f))continue;
  const ch=JSON.parse(fs.readFileSync(f,'utf8')).channel;
  if(!ch)g.unassigned.push(e);else if(!channels[ch])g.unknown.push({episode:e,channel:ch});else g[ch].push(e);
 }
 return g;
}
