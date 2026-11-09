// Thrown things: position of a projectile launched from p0 with velocity v0 at time t0 (gravity -9.8), stopping on the floor, and the
// velocity that hits a target after a given time. Pure functions; used for flying eggs, cakes, confetti, balls (studio2/tests/library.test.mjs).
export function ballistic(p0,v0,t0,t,floor=0){
 const g=-9.8,tau=Math.max(0,t-t0),disc=v0[1]*v0[1]+2*g*(floor-p0[1]),tl=disc<0?1e9:(-v0[1]-Math.sqrt(disc))/g;
 const k=Math.min(tau,tl);return {pos:[p0[0]+v0[0]*k,p0[1]+v0[1]*k+.5*g*k*k,p0[2]+v0[2]*k],landed:tau>=tl,tLand:t0+tl};
}
export const aimVelocity=(p0,p1,T)=>[(p1[0]-p0[0])/T,(p1[1]-p0[1]+.5*9.8*T*T)/T,(p1[2]-p0[2])/T];
