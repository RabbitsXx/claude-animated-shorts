// Build the delivery folder out/publish for a film, locally. Never uploads or posts anything.
//   node studio2/package.mjs --episode episodes/<id>
// Needs: out/final.mp4 and out/qa.json (assemble.mjs), POST.json (title, description, keywords), out/publish/cover.png (staged cover).
// Writes out/publish: final.mp4, cover-small.jpg, post.txt (one file, with the channel's footer, hashtags and AI disclosure),
// metadata.json, package-check.json. Exit 1 when a measured check fails.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadChannels} from './lib/channels.mjs';
import {composePost} from './lib/post.mjs';
import {checkPackage} from './lib/package-check.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/package.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),out=path.join(ep,'out'),pub=path.join(out,'publish');
const need=(f)=>{if(!fs.existsSync(f)){console.error('missing '+path.relative(ROOT,f));process.exit(2);}return f;};
const film=JSON.parse(fs.readFileSync(need(path.join(ep,'film.json')),'utf8')),channels=loadChannels(ROOT),channel=channels[film.channel];
if(!channel){console.error('film.json needs a valid channel');process.exit(2);}
const post=JSON.parse(fs.readFileSync(need(path.join(ep,'POST.json')),'utf8')),qa=JSON.parse(fs.readFileSync(need(path.join(out,'qa.json')),'utf8'));
need(path.join(out,'final.mp4'));need(path.join(pub,'cover.png'));fs.mkdirSync(pub,{recursive:true});
if(path.resolve(path.join(out,'final.mp4'))!==path.resolve(path.join(pub,'final.mp4')))fs.copyFileSync(path.join(out,'final.mp4'),path.join(pub,'final.mp4'));
spawnSync('python',['studio2/shrink.py',path.join(pub,'cover.png'),path.join(pub,'cover-small.jpg'),'--width','360'],{cwd:ROOT});
fs.writeFileSync(path.join(pub,'post.txt'),composePost(post,channel));
const files=fs.readdirSync(pub),chk=checkPackage({qa,files,channel,post,finalBytes:fs.statSync(path.join(pub,'final.mp4')).size});
fs.writeFileSync(path.join(pub,'metadata.json'),JSON.stringify({channel:film.channel,channelName:channel.name,title:post.title,description:post.description,keywords:post.keywords,coverText:false,imageGeneration:false,
 provenance:{cover:'Staged from the real film scene (scene2/cover.mjs): same world and actor, one hook moment, engine depth of field. No text, no image generation.',voiceAndSound:channel.disclosure},video:'out/final.mp4',cover:'out/publish/cover.png',qa,notPublished:true},null,1));
fs.writeFileSync(path.join(pub,'package-check.json'),JSON.stringify(chk,null,1));
for(const [k,v] of Object.entries(chk.checks))console.log(`${v?'PASS':'FAIL'}  ${k}`);
for(const n of chk.notes)console.log('NOTE  '+n);
console.log(chk.ok?'PACKAGE OK (local only; nothing published). A person must still: ':'PACKAGE NOT OK');
if(chk.ok)for(const p of chk.personMustJudge)console.log(' - '+p);
process.exit(chk.ok?0:1);
