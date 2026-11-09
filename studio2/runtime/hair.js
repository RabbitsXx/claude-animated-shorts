// Flat 2.5D hair (look 'ref'): hair is flat artwork with a thick ink outline, painted on a sheet that hugs the head where it touches it
// and carries straight on in a flat plane where it rises above the head, so spikes and curls keep their 2D silhouette.
// Coordinates are normalised to the hair patch: u 0..1 across x in [-.28,.28], v 0..1 down y from .40 (top) to -.06 (head-local metres).
export const PATCH={w:.56,h:.46,cx:0,cy:.17,canvas:[560,460],headTopV:.402,browV:.64};
export const HAIR={
 tuft:{type:'poly',points:[[.16,.62],[.14,.46],[.18,.38],[.12,.26],[.26,.28],[.30,.12],[.40,.26],[.50,.05],[.58,.26],[.70,.13],[.72,.30],[.86,.24],[.84,.40],[.88,.50],[.84,.62],[.76,.52],[.66,.58],[.55,.50],[.44,.58],[.32,.50],[.24,.60]]},
 slick:{type:'poly',points:[[.16,.60],[.14,.46],[.20,.34],[.34,.27],[.52,.25],[.68,.28],[.80,.36],[.86,.48],[.84,.60],[.76,.50],[.62,.42],[.50,.41],[.36,.46],[.24,.58]]},
 curly:{type:'circles',circles:[[.2,.5,.1],[.2,.34,.1],[.3,.22,.1],[.43,.16,.1],[.57,.16,.1],[.7,.22,.1],[.8,.34,.1],[.8,.5,.1],[.5,.34,.13],[.35,.4,.1],[.65,.4,.1]]},
 bob:{type:'poly',points:[[.10,.92],[.08,.5],[.16,.26],[.34,.12],[.5,.10],[.66,.12],[.84,.26],[.92,.5],[.90,.92],[.82,.88],[.84,.50],[.74,.40],[.62,.48],[.50,.42],[.38,.48],[.26,.40],[.18,.50],[.18,.88]]},
 bun:{type:'circles',circles:[[.5,.13,.09],[.2,.5,.08],[.22,.36,.1],[.32,.26,.11],[.46,.22,.11],[.6,.22,.11],[.72,.28,.11],[.8,.4,.1],[.8,.52,.08],[.5,.36,.12],[.35,.4,.1],[.65,.4,.1]]},
 fringe:{type:'poly',points:[[.15,.58],[.14,.4],[.22,.26],[.38,.16],[.54,.14],[.72,.2],[.84,.34],[.86,.58],[.78,.5],[.74,.6],[.64,.5],[.58,.6],[.48,.5],[.4,.6],[.32,.5],[.24,.6]]},
};
export const hairZ=(surfaceZ)=>Math.max(surfaceZ+.02,.035); // in front of the head surface (no z-fight) and of the outline hull band that rings the head top
const edgePoints=h=>h.type==='circles'?h.circles.flatMap(([u,v,r])=>[[u-r,v-r],[u+r,v+r],[u,v-r],[u,v+r]]):h.points;
export function hairBounds(h){
 const p=edgePoints(h),centre=p.filter(([u])=>u>=.3&&u<=.7);
 return {minV:Math.min(...p.map(q=>q[1])),maxV:Math.max(...p.map(q=>q[1])),foreheadMaxV:Math.max(...centre.map(q=>q[1]))};
}
import {varStroke} from './pen.js';
export function drawHair(pen,name,{hair='#4a3427',ink='#1e1214',K=1,handDrawn=false}={}){
 const [W,H]=PATCH.canvas,h=HAIR[name];pen.clearRect(0,0,W,H);if(!h)return;
 pen.lineJoin=pen.lineCap='round';pen.lineWidth=20*K;pen.strokeStyle=ink;pen.fillStyle=hair;
 if(h.type==='circles'){for(const [u,v,r] of h.circles){pen.beginPath();pen.arc(u*W,v*H,r*W,0,7);pen.stroke();}for(const [u,v,r] of h.circles){pen.beginPath();pen.arc(u*W,v*H,r*W-pen.lineWidth*.3,0,7);pen.fill();}return;}
 pen.beginPath();h.points.forEach(([u,v],i)=>i?pen.lineTo(u*W,v*H):pen.moveTo(u*W,v*H));pen.closePath();pen.fill();
 if(handDrawn)varStroke(pen,h.points.map(([u,v])=>[u*W,v*H]),pen.lineWidth*1.15,{seed:3,closed:true});else pen.stroke();
}
