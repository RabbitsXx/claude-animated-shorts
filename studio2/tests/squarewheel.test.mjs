// Exact geometry of a square wheel on a road of inverted-catenary humps (episodes/square-wheel).
// Written before the implementation; the film's wheel, road and axle trail all come from this module.
import test from 'node:test';
import assert from 'node:assert/strict';
import {humpRoad,rollOnHumps,rollOnFlat,wheelCorners,roundOnHumps} from '../library/wheelmath.mjs';

const s=1.2,road=humpRoad(s),a=s/2,near=(x,y,e=1e-9)=>Math.abs(x-y)<e;

test('hump road dimensions match the formula',()=>{
 assert.ok(near(road.width/s,0.88137359,1e-4));
 assert.ok(near(road.height/s,0.20710678,1e-4));
 assert.ok(near(road.axleHeight/s,0.70710678,1e-4));
 assert.ok(near(road.arc(road.width-1e-12),s,1e-6),'one hump has arc length equal to the wheel side');
});

test('axle height is constant on the humps',()=>{
 for(let i=0;i<=2000;i++){const x=i/2000*6*road.width;const p=rollOnHumps(s,x);assert.ok(near(p.y,road.axleHeight,1e-9),`x=${x} y=${p.y}`);assert.ok(near(p.x,x,1e-9));}
});

test('wheel never penetrates the hump road and touches it',()=>{
 for(let i=0;i<=200;i++){const x=i/200*4*road.width,p=rollOnHumps(s,x),c=wheelCorners(s,p);
  let touch=1e9;
  for(let e=0;e<4;e++){const A=c[e],B=c[(e+1)%4];
   for(let k=0;k<=4000;k++){const px=A[0]+(B[0]-A[0])*k/4000,py=A[1]+(B[1]-A[1])*k/4000,gap=py-road.y(px);
    assert.ok(gap>-1e-6,`penetration ${gap} at x=${x}`);touch=Math.min(touch,gap);}}
  assert.ok(touch<1e-6,`wheel floats ${touch} above the road at x=${x}`);}
});

test('axle height rises and falls on flat ground with period s',()=>{
 let lo=1e9,hi=-1e9;for(let i=0;i<=4000;i++){const p=rollOnFlat(s,i/4000*3*s);lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);}
 assert.ok(near(lo,a,1e-6));assert.ok(near(hi,a*Math.SQRT2,1e-6));
 assert.ok(near(rollOnFlat(s,.3).y,rollOnFlat(s,.3+s).y,1e-9));
});

test('wheel never goes below flat ground',()=>{
 for(let i=0;i<=2000;i++){const c=wheelCorners(s,rollOnFlat(s,i/2000*3*s));for(const [,y] of c)assert.ok(y>-1e-9);}
});

test('wheel turns clockwise 90 degrees per hump',()=>{
 for(const x of [0,.3,.77,1.9]){const d=rollOnHumps(s,x+road.width).angle-rollOnHumps(s,x).angle;assert.ok(near(d,-Math.PI/2,1e-6),`d=${d}`);}
 for(const x of [0,.3,.77,1.9]){const d=rollOnFlat(s,x+s).angle-rollOnFlat(s,x).angle;assert.ok(near(d,-Math.PI/2,1e-6),`flat d=${d}`);}
});

test('angle is continuous across humps and flat rolls',()=>{
 for(const f of [rollOnHumps,rollOnFlat]){let prev=f(s,0).angle;for(let i=1;i<=5000;i++){const x=i/5000*5,ang=f(s,x).angle;assert.ok(Math.abs(ang-prev)<0.02,`${f.name} jump at x=${x}`);prev=ang;}}
});

test('a round wheel on the humps never penetrates and its axle does move (it bounces)',()=>{
 const r=.3;let lo=1e9,hi=-1e9;
 for(let i=0;i<=1500;i++){const x=i/1500*3*road.width,p=roundOnHumps(s,r,x);lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);
  for(let k=-60;k<=60;k++){const px=x+r*k/60,gap=Math.hypot(px-x,road.y(px)-p.y)-r;if(Math.abs(px-x)<=r&&road.y(px)<=p.y)assert.ok(gap>-1e-3,`round wheel inside road gap=${gap} at x=${x}`);}}
 assert.ok(lo>=r-1e-9,'axle never below the wheel radius');
 assert.ok(hi-lo>.02,`axle bounce ${hi-lo} should be visible`);
 assert.ok(hi-lo<road.height,'bounce stays below the hump height');
});
test('a round wheel on the humps bounces while the square wheel does not',()=>{
 const sq=[],ro=[];for(let i=0;i<=400;i++){const x=i/400*2*road.width;sq.push(rollOnHumps(s,x).y);ro.push(roundOnHumps(s,.3,x).y);}
 const span=a=>Math.max(...a)-Math.min(...a);assert.ok(span(sq)<1e-9);assert.ok(span(ro)>.02);
});
