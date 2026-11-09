import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainHeight} from '../lib/terrain.mjs';

test('terrain is flat on the stage and rises beyond it',()=>{
 for(const [x,z] of [[0,0],[5,3],[-9,6],[12,-4]])assert.ok(Math.abs(terrainHeight(x,z,{flatR:20,seed:3}))<1e-6,`${x},${z}`);
 let up=0;for(let a=0;a<12;a++){const x=Math.cos(a)*70,z=Math.sin(a)*70;if(terrainHeight(x,z,{flatR:20,seed:3})>1)up++;}assert.ok(up>=8,'most far points are hills');
});
test('terrain height is deterministic, smooth and bounded',()=>{
 const o={flatR:20,seed:5,maxH:36};assert.equal(terrainHeight(50,10,o),terrainHeight(50,10,o));
 for(let x=-100;x<=100;x+=7)for(let z=-100;z<=100;z+=9){const h=terrainHeight(x,z,o);assert.ok(h>=0&&h<=o.maxH+1e-6);assert.ok(Math.abs(terrainHeight(x+.1,z,o)-h)<.35,'smooth');}
});
test('different seeds give different landscapes',()=>{assert.notEqual(terrainHeight(60,30,{flatR:20,seed:1}),terrainHeight(60,30,{flatR:20,seed:2}));});
