// The session briefing: what a new Claude must know in 15 lines, built from the repo's own files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBriefing,openDefects} from '../lib/briefing.mjs';

const defects=[{id:'a',check:{kind:'test'}},{id:'b',check:{kind:'none',why:'visual'}},{id:'c',check:{kind:'none',why:'script'}}];
test('openDefects returns only defects whose check is an honest none',()=>{
 assert.deepEqual(openDefects({defects}).map(d=>d.id),['b','c']);
});
test('briefing names the active episode, counts, and the standing autopilot rules',()=>{
 const t=buildBriefing({active:'square-wheel',handoffState:'Delivered locally; cover approved.',parts:[{name:'x',status:'proven'},{name:'y',status:'experimental'}],defects});
 assert.match(t,/square-wheel/);assert.match(t,/2 parts \(1 proven, 1 experimental\)/);assert.match(t,/2 defects without a check/);
 assert.match(t,/Haiku/);assert.match(t,/self-improve/);assert.match(t,/finish\.mjs/);assert.match(t,/Thai/);
});
test('briefing stays short enough to read every session',()=>{
 const t=buildBriefing({active:'x',handoffState:'y',parts:[],defects:[]});
 assert.ok(t.split('\n').length<=18);
});

import {humanChecklist} from '../lib/briefing.mjs';
test('humanChecklist turns the defects that no tool can catch into short look-for lines with their rules',()=>{
 const log={defects:[{id:'a',rule:'Rule A.',check:{kind:'test'}},{id:'b',rule:'Aim at the face.',check:{kind:'none'}},{id:'c',rule:'Look at frame 1.',check:{kind:'review'}}]};
 const l=humanChecklist(log);
 assert.equal(l.length,2);assert.match(l[0],/^b: Aim at the face\./);assert.match(l[1],/^c: Look at frame 1\./);
});

test('briefing lists the channels with their film counts and flags films without a valid channel',()=>{
 const t=buildBriefing({active:'x',handoffState:'y',parts:[],defects:[],channels:{'explainer-shorts':['a','b'],'post-time-survival':[],unassigned:['c'],unknown:[{episode:'d',channel:'zz'}]}});
 assert.match(t,/explainer-shorts \(2 films\)/);assert.match(t,/post-time-survival \(0 films\)/);assert.match(t,/no channel: c/);assert.match(t,/unknown channel: d->zz/);
 assert.ok(t.split(String.fromCharCode(10)).length<=19);
});
