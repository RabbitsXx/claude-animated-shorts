import test from 'node:test';
import assert from 'node:assert/strict';
import {HAIR,hairBounds,PATCH} from '../runtime/hair.js';

const pts=h=>h.type==='circles'?h.circles.flatMap(([u,v,r])=>[[u-r,v-r],[u+r,v+r]]):h.points;
test('every hair style is flat artwork inside the hair patch',()=>{
 for(const [name,h] of Object.entries(HAIR))for(const [u,v] of pts(h)){assert.ok(u>=0&&u<=1&&v>=0&&v<=1,`${name} point ${u},${v} outside the patch`);}
});
test('hair never reaches the brows: the lowest centre-forehead edge stays above the brow line',()=>{
 for(const [name,h] of Object.entries(HAIR)){const b=hairBounds(h);assert.ok(b.foreheadMaxV<=PATCH.browV,`${name} forehead edge ${b.foreheadMaxV} is below ${PATCH.browV}`);}
});
test('the styles the cast uses all exist: tuft slick curly bob bun fringe',()=>{
 for(const n of ['tuft','slick','curly','bob','bun','fringe'])assert.ok(HAIR[n],n);
});
test('spiky and curly hair rises above the top of the head (silhouette matters in 2D)',()=>{
 for(const n of ['tuft','curly','bun'])assert.ok(hairBounds(HAIR[n]).minV<PATCH.headTopV,n);
});
import {hairZ} from '../runtime/hair.js';
test('the hair sheet always floats in front of the head surface and of the outline hull (no see-through, no z-fight specks)',()=>{
 for(const surface of [0,.02,.1,.19]){const z=hairZ(surface);assert.ok(z>=surface+.02,`surface ${surface}`);assert.ok(z>=.035,'in front of the outline band above the head');}
});
