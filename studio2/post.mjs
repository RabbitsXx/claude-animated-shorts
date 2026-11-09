// Write out/publish/post.txt for a film from its POST.json and its channel's profile. Never publishes anything.
//   node studio2/post.mjs --episode episodes/<id>
// episodes/<id>/POST.json: {"title": "...", "description": "...", "keywords": ["...", ...]}  (the film's own words)
// The channel (film.json "channel") adds its AI disclosure, description footer and hashtags (channels/<channel>/channel.json).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadChannels} from './lib/channels.mjs';
import {composePost} from './lib/post.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),epRel=a.includes('--episode')?a[a.indexOf('--episode')+1]:null;
if(!epRel){console.error('usage: node studio2/post.mjs --episode episodes/<id>');process.exit(2);}
const ep=path.join(ROOT,epRel),film=JSON.parse(fs.readFileSync(path.join(ep,'film.json'),'utf8')),channels=loadChannels(ROOT);
if(!film.channel||!channels[film.channel]){console.error(`film.json needs "channel": one of ${Object.keys(channels).join(', ')}`);process.exit(2);}
if(!fs.existsSync(path.join(ep,'POST.json'))){console.error('write episodes/<id>/POST.json first: {"title","description","keywords"}');process.exit(2);}
const text=composePost(JSON.parse(fs.readFileSync(path.join(ep,'POST.json'),'utf8')),channels[film.channel]);
fs.mkdirSync(path.join(ep,'out/publish'),{recursive:true});fs.writeFileSync(path.join(ep,'out/publish/post.txt'),text);
console.log(`post.txt written for channel ${film.channel} (title ${text.split(String.fromCharCode(10))[0].length} characters). Nothing was published.`);
