// usage: node studio2/new-episode.mjs <id> [--from time-machine-success]
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scaffold} from './lib/scaffold.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const a=process.argv.slice(2),id=a[0],from=a.includes('--from')?a[a.indexOf('--from')+1]:'time-machine-success';
if(!id){console.error('usage: node studio2/new-episode.mjs <id> [--from time-machine-success]');process.exit(2);}
console.log('created',scaffold({root:ROOT,from,id}));
