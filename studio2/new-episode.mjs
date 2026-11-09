// usage: node studio2/new-episode.mjs <id> --channel <channel-id> [--from <older-episode>]
// The channel is required: every film belongs to exactly one channel (channels/<id>/channel.json), see channels/README.md.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scaffold} from './lib/scaffold.mjs';
import {loadChannels} from './lib/channels.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),id=a[0],get=(k,d)=>a.includes(k)?a[a.indexOf(k)+1]:d,from=get('--from','stop-time-hour'),channel=get('--channel',null);
const known=Object.keys(loadChannels(ROOT));
if(!id||!channel){console.error(`usage: node studio2/new-episode.mjs <id> --channel <${known.join('|')}> [--from <older-episode>]`);process.exit(2);}
console.log('created',scaffold({root:ROOT,from,id,channel}));
