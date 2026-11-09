// Exact geometry of a square wheel (side s, half side a = s/2) rolling on flat ground and on a road of inverted-catenary humps.
// Pure functions, no browser imports, so Node tests and the scene use the same numbers (studio2/tests/squarewheel.test.mjs).
// Road: y(x') = a(sqrt2 - cosh(x'/a)) over |x'| <= a asinh(1); humps meet in 90-degree dips at y = 0. One hump has arc length s.
// Angle convention: radians, counter-clockwise positive, so a wheel rolling to +x turns clockwise (-90 degrees per hump or flat roll).
const R2=Math.SQRT2,ASINH1=Math.asinh(1);

export function humpRoad(s){
 const a=s/2,P=2*a*ASINH1;
 const local=x=>{const m=((x%P)+P)%P;return m-P/2;};
 return {a,s,width:P,height:a*(R2-1),axleHeight:a*R2,
  y:x=>a*(R2-Math.cosh(local(x)/a)),
  slope:x=>-Math.sinh(local(x)/a),
  arc:x=>a*(Math.sinh(local(x)/a)+1)};
}

// Wheel centre x is the independent variable. Hump k spans centre x in [kP,(k+1)P]; the contact abscissa xc is found by bisection
// because centre = contact + R(phi)(-w,a) with phi the road tangent angle and w = arc-length - a the contact position on the side.
export function rollOnHumps(s,xCenter){
 const r=humpRoad(s),{a,width:P}=r,k=Math.floor(xCenter/P),x0=k*P;
 const at=xc=>{const loc=xc-x0-P/2,phi=Math.atan(-Math.sinh(loc/a)),w=a*(Math.sinh(loc/a)+1)-a,c=Math.cos(phi),sn=Math.sin(phi);
  return {x:xc-w*c-a*sn,y:a*(R2-Math.cosh(loc/a))-w*sn+a*c,phi};};
 let lo=x0,hi=x0+P;
 for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(at(mid).x<xCenter)lo=mid;else hi=mid;}
 const p=at((lo+hi)/2);
 return {x:xCenter,y:p.y,angle:p.phi-k*Math.PI/2};
}

// Flat ground: the wheel pivots about its front bottom corner; centre = pivot + a(sin t - cos t, sin t + cos t), t in [0,90deg].
export function rollOnFlat(s,xCenter){
 const a=s/2,k=Math.round(xCenter/s),u=Math.max(-1,Math.min(1,(xCenter-k*s)/a)),t=Math.PI/4+Math.asin(u/R2);
 return {x:xCenter,y:a*(Math.sin(t)+Math.cos(t)),angle:Math.PI/2-t-k*Math.PI/2};
}

export function wheelCorners(s,pose){
 const a=s/2,c=Math.cos(pose.angle),sn=Math.sin(pose.angle);
 return [[-a,-a],[a,-a],[a,a],[-a,a]].map(([x,y])=>[pose.x+x*c-y*sn,pose.y+x*sn+y*c]);
}

// A round wheel of radius r rolling over the same humps: the axle rides at the highest of (road height + sqrt(r^2 - dx^2)) within
// reach, so it bounces a little over the humps (the film's rival). Angle is rolling without slipping on the baseline.
export function roundOnHumps(s,r,xCenter){
 const road=humpRoad(s),n=240;let best=-1e9;
 for(let i=-n;i<=n;i++){const dx=r*i/n,yy=road.y(xCenter+dx)+Math.sqrt(Math.max(0,r*r-dx*dx));if(yy>best)best=yy;}
 return {x:xCenter,y:best,angle:-xCenter/r};
}
