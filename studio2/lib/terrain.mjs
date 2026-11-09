// Landscape height: flat on the stage (radius flatR), then rolling foothills that grow into ridges and distant mountains toward the edge. Pure function of x,z.
const hash=(x,y,s)=>{let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2147483647);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296;};
const smooth=t=>t*t*(3-2*t);
function vnoise(x,z,s){const xi=Math.floor(x),zi=Math.floor(z),fx=smooth(x-xi),fz=smooth(z-zi),a=hash(xi,zi,s),b=hash(xi+1,zi,s),c=hash(xi,zi+1,s),d=hash(xi+1,zi+1,s);return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
export function terrainHeight(x,z,{flatR=20,seed=1,maxH=34}={}){
 const r=Math.hypot(x,z);if(r<=flatR)return 0;
 const k=smooth(Math.min(1,(r-flatR)/(flatR*2.4))),rise=Math.pow(Math.min(1,(r-flatR)/(flatR*4)),1.05);
 let n=0,amp=1,f=.018,tot=0;for(let o=0;o<5;o++){n+=amp*vnoise(x*f+seed*7,z*f-seed*3,seed+o);tot+=amp;amp*=.5;f*=2.05;}n/=tot;
 const ridge=1-Math.abs(vnoise(x*.012+seed,z*.012,seed+9)*2-1);
 const h=k*(maxH*.3*n+maxH*1.05*rise*(.35+.65*ridge)*(.35+n));
 return Math.max(0,Math.min(maxH,h));
}
