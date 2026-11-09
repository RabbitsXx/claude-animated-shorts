# Head-through-hair check (run headless: blender -b --python check-hair.py): for every hair/cap GLB, shoot rays from the head centre; where the part has material along a ray, its outer surface must lie beyond the head surface
# (the head ellipsoid centred (0,-.02,0), radii .218 x .235 x .19). Prints FAIL lines with the direction and how far the head sticks out, and PASS when no head surface pokes through any part.
import bpy, math, os, sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT = os.environ.get('STUDIO_ROOT', 'F:/Create Cartoon/claude-animated-shorts'); D = ROOT + '/studio2/library/characters/'
HC, HR = (0, -.02, 0), (.218, .235, .19)
S = lambda p: Vector((p[0], -p[2], p[1]))
bad_total = 0
for name in ['hair-tuft', 'hair-slick', 'hair-fringe', 'hair-bob', 'hair-curly', 'hair-bun', 'cap']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=D + name + '.glb')
    deps = bpy.context.evaluated_depsgraph_get(); meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and 'Hair ink' not in o.name]   # the ink hull is drawn black back-face only and tucks inside the head by design
    trees = []
    for o in meshes:
        me = o.to_mesh(); me.transform(o.matrix_world); trees.append(BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [p.vertices[:] for p in me.polygons]))
    c = S(HC); bad = []; covered = 0
    for iy in range(0, 36):
        el = -10 + iy * 5                       # elevation -10..170 degrees from the horizontal plane, top included
        for ia in range(0, 72):
            az = ia * 5
            d = (math.cos(math.radians(el)) * math.cos(math.radians(az)), math.sin(math.radians(el)), math.cos(math.radians(el)) * math.sin(math.radians(az)))
            if el > 90: continue
            dn = Vector((d[0] * 1, d[1] * 1, d[2] * 1)).normalized()      # scene direction (x, y up, z front)
            t = 1 / math.sqrt((dn.x / HR[0]) ** 2 + (dn.y / HR[1]) ** 2 + (dn.z / HR[2]) ** 2)   # distance to the head surface along dn
            far = 0.0; hit = False
            for tr in trees:
                p = c.copy(); dirb = S(dn).normalized()
                for _ in range(8):
                    h = tr.ray_cast(p, dirb)
                    if h[0] is None: break
                    hit = True; far = max(far, (h[0] - c).length); p = h[0] + dirb * 1e-4
            if hit:
                covered += 1
                if far < t - .0005: bad.append((el, az, round((t - far) * 1000, 1)))
    bad_total += len(bad)
    print('CHECK', name, 'covered rays', covered, 'head pokes through', len(bad), bad[:6])
print('PASS' if bad_total == 0 else 'FAIL total %d' % bad_total)

# ---- hair under a cap: the 'hair-capped' part must lie outside the head surface (no poke) AND stay clear of the cap crown (its outer surface may not go beyond the cap's inner surface where they overlap)
def tree_of(path_name, name_filter=None):
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=D + path_name + '.glb'); out = []
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and 'Hair ink' not in o.name]:
        if name_filter and name_filter not in o.name: continue
        me = o.to_mesh(); me.transform(o.matrix_world); out.append(BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [p.vertices[:] for p in me.polygons]))
    return out
capt = tree_of('cap', 'Cap crown'); ht = tree_of('hair-capped'); c0 = S(HC); bad = []; head_bad = []
for el in range(-10, 91, 5):
    for az in range(0, 360, 5):
        dn = Vector((math.cos(math.radians(el)) * math.cos(math.radians(az)), math.sin(math.radians(el)), math.cos(math.radians(el)) * math.sin(math.radians(az)))); db = S(dn).normalized()
        t = 1 / math.sqrt((dn.x / HR[0]) ** 2 + (dn.y / HR[1]) ** 2 + (dn.z / HR[2]) ** 2)
        far = 0.0; p = c0.copy(); hit = False
        for tr in ht:
            p = c0.copy()
            for _ in range(6):
                h = tr.ray_cast(p, db)
                if h[0] is None: break
                hit = True; far = max(far, (h[0] - c0).length); p = h[0] + db * 1e-4
        if hit and far < t - .0005: head_bad.append((el, az, round((t - far) * 1000, 2)))
        capnear = None; p = c0.copy()
        for _ in range(6):
            h = capt[0].ray_cast(p, db)
            if h[0] is None: break
            d_ = (h[0] - c0).length; capnear = d_ if capnear is None else min(capnear, d_); p = h[0] + db * 1e-4
        if capnear is not None and hit and far > capnear + .0005: bad.append((el, az, round((far - capnear) * 1000, 1)))
print('CAPPED hair: head pokes through', len(head_bad), head_bad[:6], '; pokes through the cap', len(bad), bad[:5])
print('CAP PASS' if not bad and not head_bad else 'CAP FAIL')
