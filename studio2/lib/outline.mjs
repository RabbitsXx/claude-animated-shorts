// World-space outline: the hull is pushed out along the object-space normal, so the offset must be divided by the mesh's world scale
// to come out as the same thickness in metres on a flat oval, a rounded box or a scaled actor.
export function objectOutline(worldThickness,scale){
 const [x,y,z]=scale;if(!(x>0&&y>0&&z>0))throw Error('outline needs a positive scale, got '+scale);
 return worldThickness/((x+y+z)/3);
}
