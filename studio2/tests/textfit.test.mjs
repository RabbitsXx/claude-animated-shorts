// In-world signs must never crop their own text, and authors must be able to compute how far the camera has to be for a sign to fit
// the narrow vertical frame. Both bugs happened in film after film (ROUND WHEELS, WHEELWRIGHT, MARKET RACE TOMORROW, ...).
import test from 'node:test';
import assert from 'node:assert/strict';
import {fitText,signDistance,horizontalFov} from '../lib/textfit.mjs';

const measure=(text,size)=>text.length*.62*size;      // a fixed-pitch stand-in for canvas measureText
const W=1024,H=256;

test('text that is too large for the sign is shrunk to fit its width',()=>{
 const r=fitText({lines:['ROUND WHEELS'],width:W,height:H,measure,size:150});
 assert.ok(r.size<150);
 for(const l of r.lines)assert.ok(measure(l,r.size)<=W*.88+1e-6,`line "${l}" is ${measure(l,r.size)} px wide`);
});
test('text that already fits keeps the requested size',()=>{
 const r=fitText({lines:['EXIT'],width:W,height:H,measure,size:90});
 assert.equal(r.size,90);assert.deepEqual(r.lines,['EXIT']);
});
test('a long line wraps onto two lines before it becomes unreadably small',()=>{
 const r=fitText({lines:['MARKET RACE TOMORROW'],width:W,height:H,measure,size:150});
 assert.equal(r.lines.length,2);assert.ok(r.size>=150*.6,`size ${r.size} after wrapping`);
});
test('the height of several lines is respected too',()=>{
 const r=fitText({lines:['ONE','TWO','THREE'],width:W,height:H,measure,size:150});
 assert.ok(r.lines.length*r.size*1.15<=H*.88+1e-6);
});
test('never overflows for any text length (property check)',()=>{
 for(let n=1;n<=40;n++){const text=Array.from({length:n},(_,i)=>'ABCDEFGH'[i%8]).join('').replace(/(.{5})/g,'$1 ').trim();
  const r=fitText({lines:[text],width:W,height:H,measure,size:150});
  for(const l of r.lines)assert.ok(measure(l,r.size)<=W*.88+1e-6,`n=${n} line "${l}"`);
  assert.ok(r.lines.length*r.size*1.15<=H*.88+1e-6,`n=${n} height`);}
});
test('horizontal field of view of the 9:16 frame is narrow',()=>{
 assert.ok(Math.abs(horizontalFov(60*Math.PI/180)*180/Math.PI-36.0)<1);
});
test('signDistance puts a sign of the given width inside the frame',()=>{
 const fov=60*Math.PI/180,d=signDistance(3.2,fov);
 const half=Math.tan(horizontalFov(fov)/2)*d;assert.ok(3.2/2<=half+1e-9&&3.2/2>=half*.85,`sign half width ${3.2/2} vs frame half width ${half}`);
});
