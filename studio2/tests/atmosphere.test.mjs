import test from 'node:test';
import assert from 'node:assert/strict';
import {fogFor,sunFor} from '../lib/atmosphere.mjs';

test('fog defaults: day fog starts at 18 m and is solid at 65 m, a pale haze colour; night is dark blue',()=>{
 assert.deepEqual(fogFor({}),{near:18,far:65,color:'#b5d9d0'});
 assert.equal(fogFor({night:1}).color,'#18264a');
});
test('shots can set their own fog: near, far and colour (distant mountains fade into haze)',()=>{
 assert.deepEqual(fogFor({fogNear:10,fogFar:48,fogColor:'#d9e6f2'}),{near:10,far:48,color:'#d9e6f2'});
});
test('fog near must be below far and positive',()=>{assert.throws(()=>fogFor({fogNear:50,fogFar:40}),/fog/);assert.throws(()=>fogFor({fogNear:-1,fogFar:40}),/fog/);});
test('sun colour: warm white by day, orange when the sun is low, blue at night',()=>{
 assert.equal(sunFor({sun:[-.4,.8,.5]}).color,'#fff0b8');
 assert.equal(sunFor({sun:[-.9,.12,.4]}).color,'#ffb070');
 assert.equal(sunFor({sun:[-.4,.8,.5],sunColor:'#ffffff'}).color,'#ffffff');
 assert.equal(sunFor({sun:[0,.5,0],night:1}).color,'#9db8ff');
});
import {sunPower} from '../lib/atmosphere.mjs';
test('sun power: 3.8 by day, weaker when the sun is low, 1.3 at night, and a shot can set it',()=>{
 assert.equal(sunPower({sun:[-.4,.8,.5]}),3.8);assert.ok(sunPower({sun:[-.9,.12,.4]})<3.8&&sunPower({sun:[-.9,.12,.4]})>2);
 assert.equal(sunPower({night:1}),1.3);assert.equal(sunPower({sunIntensity:5}),5);
});
