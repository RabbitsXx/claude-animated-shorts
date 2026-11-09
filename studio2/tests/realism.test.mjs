import test from 'node:test';
import assert from 'node:assert/strict';
import {RULES,pickRule,tileRepeat} from '../library/realism.mjs';

test('materials are matched by name, then by mesh name, and unknown ones are left alone',()=>{
 assert.equal(pickRule('floor honey','floor plank').id,'wood');
 assert.equal(pickRule('road','bridge road').id,'asphalt');
 assert.equal(pickRule('quay concrete','quay slab').id,'concrete');
 assert.equal(pickRule('','crane leg').id,'metal');
 assert.equal(pickRule('curtain','curtain').id,'fabric');
 assert.equal(pickRule('melon 0','melon'),null);
 assert.equal(pickRule('box pink','box stripe front').id,'paper');
 assert.equal(pickRule('actor skin','Head'),null);
 assert.equal(pickRule('cobble a','cobble patch').id,'cobble');
 assert.equal(pickRule('sea water','open sea').id,'water');
 assert.equal(pickRule('bark trunk','tree trunk').id,'bark');
 assert.equal(pickRule('bank turf','river bank').id,'turf');
 assert.equal(pickRule('hill 1','hill 0').id,'turf');
});

test('tile repeat follows real size and is bounded',()=>{
 assert.equal(tileRepeat(.05,1),1);
 assert.equal(tileRepeat(6,1),6);
 assert.equal(tileRepeat(200,1),24);
 assert.ok(RULES.every(r=>r.tile>0&&r.bump>0&&r.re instanceof RegExp));
});
