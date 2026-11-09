// post.txt for a channel: title, description, the channel's own footer and hashtags, keywords, AI disclosure; one file, never mixed between channels.
import test from 'node:test';
import assert from 'node:assert/strict';
import {composePost} from '../lib/post.mjs';

const channel={id:'pts',name:'Post Time Survival',descriptionFooter:'Subscribe and join our animated survival world!',hashtags:['#Shorts','#SurvivalCartoon'],disclosure:'Narration, sound effects and music were made with AI (ElevenLabs).'};
test('post text has the title first, then description, disclosure, footer, hashtags and keywords',()=>{
 const t=composePost({title:'The Bus That Drove Out Of The Dark',description:'A driver, a tunnel and one rule.',keywords:['zombie bus','survival cartoon']},channel);
 assert.equal(t.split('\n')[0],'The Bus That Drove Out Of The Dark');
 const at=(s)=>t.indexOf(s);
 assert.ok(at('A driver, a tunnel')<at('made with AI')&&at('made with AI')<at('Subscribe and join')&&at('Subscribe and join')<at('#SurvivalCartoon')&&at('#SurvivalCartoon')<at('zombie bus, survival cartoon'));
});
test('a title over 100 characters or an empty one is refused',()=>{
 assert.throws(()=>composePost({title:'x'.repeat(101),description:'d',keywords:[]},channel),/100/);
 assert.throws(()=>composePost({title:' ',description:'d',keywords:[]},channel),/title/);
});
test('the explainer channel text never leaks into the survival channel text',()=>{
 const t=composePost({title:'A title',description:'d',keywords:['k']},channel);assert.ok(!/Science|square wheel/i.test(t));
});
