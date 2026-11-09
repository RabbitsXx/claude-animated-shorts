// A catalogue picture of a film's props: every builder placed on a grid, scaled to the same cell, with its name drawn under it.
// One image tells the next Claude which props exist and what they look like, so nobody reads 13 KB of prop code to find a wheel.
// Use from a scene module:  export const build=(ctx)=>makePropSheet(ctx,makeKit(ctx),[{name:'square wheel',make:()=>buildWheel(ctx,kit,{kind:'square'})},...]);
// Render:  node studio2/render.mjs --scene episodes/<id>/scene2/propsheet.mjs --words episodes/<id>/voice/words.json --times 0 --out studio2/.tmp/props
export function makePropSheet(ctx,kit,items,{cols=3,cell=1.5,fov=34}={}){
 const {THREE}=ctx,rows=Math.ceil(items.length/cols),cells=[];
 items.forEach((it,i)=>{
  const made=it.make(),root=made.root||made;ctx.scene.add(root);
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());
  const k=cell*.8/Math.max(size.x,size.y,size.z,1e-6),c=i%cols,r=Math.floor(i/cols);
  root.scale.multiplyScalar(k);root.updateMatrixWorld(true);
  const b2=new THREE.Box3().setFromObject(root),c2=b2.getCenter(new THREE.Vector3());
  root.position.add(new THREE.Vector3((c-(cols-1)/2)*cell-c2.x,((rows-1)/2-r)*cell*1.15+0-c2.y,-c2.z));
  cells.push({name:it.name,x:(c-(cols-1)/2)*cell,y:((rows-1)/2-r)*cell*1.15,labelY:((rows-1)/2-r)*cell*1.15-cell*.5});
 });
 const th=Math.tan(fov*Math.PI/360),dist=Math.max(cols*cell/(2*th*(1080/1920)),rows*cell*1.15/(2*th))*1.12,cam={position:[0,0,dist],target:[0,0,0],fov,studio:1,shadow:6,solar:6};
 const pc=new THREE.PerspectiveCamera(fov,1080/1920,.05,500);pc.position.set(...cam.position);pc.lookAt(0,0,0);pc.updateMatrixWorld(true);pc.updateProjectionMatrix();
 return {update(){return {camera:{...cam,subject:[0,0,0]},reach:0,note:'props sheet',flash:0,
  overlay(pen,{width:W,height:H}){pen.save();pen.font='bold 34px sans-serif';pen.textAlign='center';pen.fillStyle='#ffffff';pen.strokeStyle='#000000';pen.lineWidth=7;
   for(const c of cells){const p=new THREE.Vector3(c.x,c.labelY,0).project(pc),x=(p.x*.5+.5)*W,y=(-p.y*.5+.5)*H;pen.strokeText(c.name,x,y);pen.fillText(c.name,x,y);}pen.restore();}};}};
}
