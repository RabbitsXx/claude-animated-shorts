import test from 'node:test';
import assert from 'node:assert/strict';
import {BODY,shirtMarks,shade} from '../runtime/clothes.js';

test('every shirt mark sits on the shirt (above the trouser split), never on the trousers',()=>{
 const m=shirtMarks();
 for(const [name,v0,v1] of m.vertical)assert.ok(v0>=BODY.splitV&&v1<=1&&v0<v1,`${name} ${v0}-${v1}`);
});
test('a shirt has a collar, a hem stitch, two sleeve seams and a chest emblem',()=>{
 const m=shirtMarks(),names=m.vertical.map(x=>x[0]);
 for(const n of ['collar','hem','sleeve seam','emblem'])assert.ok(names.includes(n),n);
 assert.equal(m.sleeveSeamX.length,2);
});
test('the body is one rounded box, squarer than an ellipse (corner radius well below half the width)',()=>{
 assert.ok(BODY.radius>0&&BODY.radius<BODY.width/2*.6);assert.ok(BODY.width<=.42,'slim figure (owner: slimmer)');assert.ok(BODY.depth<BODY.width);
});
test('shade darkens a hex colour without leaving the 0-255 range',()=>{
 assert.equal(shade('#ffffff',.5),'#808080');assert.equal(shade('#000000',.5),'#000000');assert.equal(shade('#f2c230',0),'#000000');
});
import {overallsMarks} from '../runtime/clothes.js';
test('overalls (reference look): bib, two straps, two buttons, a stitched pocket and a patch, all above the trouser split',()=>{
 const o=overallsMarks();
 for(const n of ['bib','straps','buttons','pocket','patch']){const [v0,v1]=o[n];assert.ok(v0>=BODY.splitV&&v1<=1&&v0<v1,n);}
 assert.equal(o.strapX.length,2);assert.equal(o.buttonX.length,2);
});
test('overalls: pocket and patch sit side by side on the bib without overlapping, both inside the bib width',()=>{
 const o=overallsMarks();assert.ok(o.pocketX[1]<o.patchX[0],'pocket left of patch');
 assert.ok(o.pocketX[0]>=-o.bibHalf&&o.patchX[1]<=o.bibHalf,'inside the bib');
});
import {bodyTaper} from '../runtime/clothes.js';
test('the upper body is narrower than the lower body (owner: chest smaller than hips), smoothly and monotonically',()=>{
 const h=BODY.height,top=bodyTaper(h/2,h),mid=bodyTaper(0,h),bot=bodyTaper(-h/2,h);
 assert.ok(top<mid&&mid<bot);assert.ok(top/bot<=.75,'a clearly visible taper');assert.ok(top>=.6,'not a cone');
 let prev=Infinity;for(let y=-h/2;y<=h/2;y+=h/20){const f=bodyTaper(y,h);assert.ok(f<=prev+1e-9);prev=f;}
});
import {bodyLean} from '../runtime/clothes.js';
import {weldedNormals} from '../runtime/clothes.js';
test('welded normals: duplicated vertices at a seam get the same normal, so an outline pushed along them has no gap',()=>{
 // two triangles of a bent sheet: the shared edge is stored twice (one copy per triangle)
 const pos=[0,0,0, 1,0,0, 0,1,0,  1,0,0, 0,1,0, 1,1,1];
 const n=weldedNormals(pos,[0,1,2,3,4,5]);
 const at=i=>n.slice(i*3,i*3+3);
 assert.deepEqual(at(1).map(x=>+x.toFixed(6)),at(3).map(x=>+x.toFixed(6)));assert.deepEqual(at(2).map(x=>+x.toFixed(6)),at(4).map(x=>+x.toFixed(6)));
 for(let i=0;i<6;i++)assert.ok(Math.abs(Math.hypot(...at(i))-1)<1e-6);
});
import {shoulderZ} from '../runtime/clothes.js';
test('the arm root follows the body surface: it sits behind the chest by exactly the body lean at that height',()=>{
 const y=.42,local=y-BODY.centerY,z=shoulderZ(y);
 assert.ok(z<=0);assert.ok(Math.abs(z+bodyLean(local,BODY.height)+.012)<1e-9||Math.abs(z-(-bodyLean(local,BODY.height)-.012))<1e-9);
});


test('no neck: the body top sits just under the chin so the two outlines touch and merge (no overlap of the surfaces, no gap)',()=>{
 const headBottom=.76-(.02+.235)*1.15,bodyTop=BODY.centerY+BODY.height/2,gap=headBottom-bodyTop;
 assert.ok(gap>0,'the body surface must not reach into the head');assert.ok(gap<=.03,`gap ${gap.toFixed(3)} m must be smaller than the two outline bands together (0.046 m), so the lines meet`);
});
import {suitMarks} from '../runtime/clothes.js';
test('suit (banker): tie, buttons, pocket square and an open V of shirt all sit above the trouser split',()=>{
 const m=suitMarks();for(const n of ['tie','buttons','pocket','vee']){const [v0,v1]=m[n];assert.ok(v0>=BODY.splitV&&v1<=1&&v0<v1,n);}
 assert.ok(m.veeHalf>0&&m.veeHalf<BODY.W/2*.6,'the V opening is narrower than the chest');
});
