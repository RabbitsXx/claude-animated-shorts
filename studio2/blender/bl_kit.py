"""Blender kit for the film models (owner order 2026-11-09: sculpt every model in Blender and export it, never build models from code primitives in three.js).
Run headless:  F:/Blender/blender.exe -b --python episodes/<id>/blender/<model>.py   (or node studio2/blender-build.mjs --episode episodes/<id> --model <id>)
Conventions: metres, Z up in Blender (the glTF exporter turns it into Y up), the FRONT of a model faces -Y in Blender (it becomes +Z in the scene), origin on the floor under the middle.
Every object gets a descriptive name (the detail gate counts different names), every material a name that studio2/library/realism.mjs knows (wood, concrete, metal, fabric, ...).
Only our own geometry: no downloaded models, no downloaded textures, no generated 3D."""
import bpy, bmesh, math, os, sys, colorsys
from mathutils import Vector, Euler

ROOT = None

def reset(name):
    global ROOT, _MATS
    _MATS = {}
    if bpy.app.background:
        bpy.ops.wm.read_factory_settings(use_empty=True)
    else:  # a live Blender (the MCP session): clear our data but keep the add-ons and the server running
        for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
        for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.textures, bpy.data.cameras, bpy.data.images):
            for x in list(coll): coll.remove(x)
    bpy.context.scene.unit_settings.system = 'METRIC'
    ROOT = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(ROOT)
    return ROOT

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
    return (f(c[0]), f(c[1]), f(c[2]), 1.0)

_MATS = {}
def mat(name, color, rough=.6, metal=0.0, emit=None, emit_strength=1.0, alpha=1.0):
    if name in _MATS: return _MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = lin(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    m.diffuse_color = lin(color); m.roughness = rough; m.metallic = metal  # viewport colour, used by the Workbench preview
    if emit:
        b.inputs['Emission Color'].default_value = lin(emit); b.inputs['Emission Strength'].default_value = emit_strength
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    _MATS[name] = m
    return m

def _finish(o, name, material, parent, bevel, seg, smooth, loc, rot):
    o.name = name
    o.location = loc; o.rotation_euler = Euler([math.radians(a) for a in rot])
    if material is not None:
        o.data.materials.clear(); o.data.materials.append(material)
    if bevel and bevel > 0:
        m = o.modifiers.new('Bevel', 'BEVEL'); m.width = bevel; m.segments = seg; m.limit_method = 'ANGLE'; m.harden_normals = True
    o.parent = parent or ROOT
    for p in o.data.polygons: p.use_smooth = smooth
    return o

def box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), material=None, bevel=.004, seg=2, parent=None, smooth=True):
    """size = (x, y, z) full dimensions; loc is the CENTRE of the box."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, name, material, parent, bevel, seg, smooth, loc, rot)

def cyl(name, r, h, loc=(0, 0, 0), rot=(0, 0, 0), material=None, seg=24, r2=None, bevel=0, parent=None, smooth=True):
    """Cylinder or cone frustum along Z, centred on loc."""
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=(r if r2 is None else r2), depth=h)
    o = bpy.context.active_object
    return _finish(o, name, material, parent, bevel, 2, smooth, loc, rot)

def sphere(name, r, loc=(0, 0, 0), scale=(1, 1, 1), material=None, seg=24, rings=14, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=rings)
    o = bpy.context.active_object; o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, name, material, parent, 0, 1, True, loc, rot)

def torus(name, R, r, loc=(0, 0, 0), rot=(0, 0, 0), material=None, major=40, minor=12, parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=major, minor_segments=minor)
    o = bpy.context.active_object
    return _finish(o, name, material, parent, 0, 1, True, loc, rot)

def plane(name, w, h, loc=(0, 0, 0), rot=(0, 0, 0), material=None, parent=None):
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, name, material, parent, 0, 1, False, loc, rot)

def text(name, s, size, loc=(0, 0, 0), rot=(90, 0, 0), material=None, extrude=.001, parent=None, align='CENTER', bold=False):
    """Real 3D lettering (a font curve converted to a mesh): printed labels and signs are geometry too."""
    c = bpy.data.curves.new(name, 'FONT'); c.body = s; c.size = size; c.extrude = extrude; c.resolution_u = 2; c.align_x = align; c.align_y = 'CENTER'
    o = bpy.data.objects.new(name, c); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    return _finish(o, name, material, parent, 0, 1, False, loc, rot)

def group(name, parent=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(e)
    e.parent = parent or ROOT; e.location = loc
    return e

def array(o, count, offset, name='Array'):
    m = o.modifiers.new(name, 'ARRAY'); m.count = count; m.use_relative_offset = False; m.use_constant_offset = True; m.constant_offset_displace = offset
    return o

def mirror(o, axis='X'):
    m = o.modifiers.new('Mirror', 'MIRROR'); m.use_axis[0] = axis == 'X'; m.use_axis[1] = axis == 'Y'; m.use_axis[2] = axis == 'Z'
    return o

def subsurf(o, levels=1):
    m = o.modifiers.new('Subsurf', 'SUBSURF'); m.levels = levels; m.render_levels = levels
    for p in o.data.polygons: p.use_smooth = True
    return o

def displace_noise(o, strength=.01, scale=.05, subdiv=3):
    """Real surface relief (cobbles, rock, bark): subdivide then displace by noise; exported with the geometry."""
    s = o.modifiers.new('Subdivide', 'SUBSURF'); s.subdivision_type = 'SIMPLE'; s.levels = subdiv; s.render_levels = subdiv
    t = bpy.data.textures.new(o.name + ' noise', 'CLOUDS'); t.noise_scale = scale
    d = o.modifiers.new('Displace', 'DISPLACE'); d.texture = t; d.strength = strength
    return o

def stats():
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    names = {''.join(ch for ch in o.name.split('.')[0] if not ch.isdigit()).strip() for o in meshes}
    return len(meshes), len(names)

def export(path):
    import logging, io, contextlib
    logging.getLogger('io_scene_gltf2').setLevel(logging.ERROR)  # the exporter logs one INFO line per object: silence it (a live MCP session returns all output)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with contextlib.redirect_stdout(io.StringIO()):
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True, export_cameras=False, export_lights=False, export_materials='EXPORT')
    n, k = stats()
    print('EXPORTED', path, os.path.getsize(path), 'meshes', n, 'names', k)

def preview(folder, size=(420, 560), views=None, target=(0, 0, .5), dist=3.0, scale_figure=False, prefix='v'):
    """Workbench renders of the model from four sides plus a 1.8 m reference post: front (-Y), three-quarter, side, back."""
    os.makedirs(folder, exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x, sc.render.resolution_y = size
    sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'; sc.display.shading.show_cavity = True; sc.display.shading.cavity_type = 'BOTH'
    if not sc.world: sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = False; sc.world.color = (.62, .78, .95)
    if scale_figure:  # a 1.8 m grey post with a head: the scale reference
        cyl('scale post', .14, 1.5, (dist * .0 + 0, 0, .75), material=mat('scale grey', '#9a9aa2', .8))
    cam = bpy.data.objects.get('cam') or bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 40
    views = views or [(0, -1, .25), (.8, -.8, .45), (1, 0, .3), (-.3, 1, .4)]
    for i, v in enumerate(views):
        d = Vector(v).normalized() * dist
        cam.location = Vector(target) + d
        look = (Vector(target) - cam.location).to_track_quat('-Z', 'Y'); cam.rotation_euler = look.to_euler()
        sc.render.filepath = os.path.join(folder, f'{prefix}{i}.png'); bpy.ops.render.render(write_still=True)
    print('PREVIEW', folder)


# ---- scene-coordinate helpers: write a model with the SAME numbers as the scene (x right, y up, z toward the camera) and let the kit convert to Blender (x, -z, y) ----
from mathutils import Matrix
_M = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0)))   # Blender -> scene (x, z, -y)
def S(p): return (p[0], -p[2], p[1])                # scene point -> Blender point
def _R(rot_deg_scene, pre=None):
    rs = Euler([math.radians(a) for a in rot_deg_scene], 'XYZ').to_matrix()
    rb = _M.transposed() @ rs @ _M
    if pre is not None: rb = rb @ pre
    return rb.to_euler()
def sbox(name, size, loc, rot=(0, 0, 0), material=None, bevel=.004, seg=2, parent=None, smooth=True):
    """Scene numbers: size (sx, sy, sz), loc centre, rot in degrees about scene x, y, z (three.js XYZ order)."""
    o = box(name, (size[0], size[2], size[1]), S(loc), (0, 0, 0), material, bevel, seg, parent, smooth); o.rotation_euler = _R(rot); return o
def scyl(name, r, h, loc, rot=(0, 0, 0), material=None, seg=24, r2=None, bevel=0, parent=None, smooth=True):
    o = cyl(name, r, h, S(loc), (0, 0, 0), material, seg, r2, bevel, parent, smooth); o.rotation_euler = _R(rot); return o
def ssphere(name, r, loc, scale=(1, 1, 1), material=None, seg=24, rings=14, parent=None):
    return sphere(name, r, S(loc), (scale[0], scale[2], scale[1]), material, seg, rings, parent)
def storus(name, R, r, loc, rot=(0, 0, 0), material=None, major=40, minor=12, parent=None):
    """A ring whose axis is the scene z axis (like THREE.TorusGeometry), then rotated by rot."""
    o = torus(name, R, r, S(loc), (0, 0, 0), material, major, minor, parent)
    pre = Euler((math.radians(90), 0, 0)).to_matrix()   # Blender Z axis -> Blender -Y = scene z
    o.rotation_euler = _R(rot, pre); return o
def stext(name, s, size, loc, rot_y=0, material=None, extrude=.001, parent=None):
    """Lettering facing the scene +z, optionally turned about the vertical axis (degrees)."""
    o = text(name, s, size, S(loc), (90, 0, 0), material, extrude, parent)
    o.rotation_euler = _R((0, rot_y, 0), Euler((math.radians(90), 0, 0)).to_matrix()); return o
def sgroup(name, loc=(0, 0, 0), parent=None):
    return group(name, parent, S(loc))

def stube(name, a, b, r=.016, material=None, seg=12, r2=None, parent=None):
    """A round tube between two SCENE points (bike frames, struts, rails, cables)."""
    A, B = Vector(S(a)), Vector(S(b)); d = B - A
    o = cyl(name, r, d.length, tuple((A + B) / 2), (0, 0, 0), material, seg, r2, 0, parent)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); return o

def sbar(name, a, b, size, material=None, bevel=.003, parent=None):
    """A square bar (w x h cross-section) between two SCENE points, h along the world-up-ish side."""
    A, B = Vector(S(a)), Vector(S(b)); d = B - A
    o = box(name, (size[0], size[1], d.length), tuple((A + B) / 2), (0, 0, 0), material, bevel, 2, parent)
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); return o

def curve_tube(name, pts, radii, material=None, res=5, parent=None):
    """A smooth tapered tube through SCENE points with a radius per point (hair locks, spikes, cables, stems). One clean mesh."""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 1.0; cu.bevel_resolution = res; cu.use_fill_caps = True; cu.resolution_u = 8
    sp = cu.splines.new('NURBS'); sp.points.add(len(pts) - 1); sp.order_u = min(4, len(pts)); sp.use_endpoint_u = True
    for p, q, r in zip(sp.points, pts, radii):
        b = S(q); p.co = (b[0], b[1], b[2], 1); p.radius = r
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o = bpy.context.active_object
    if material is not None: o.data.materials.clear(); o.data.materials.append(material)
    o.name = name; o.parent = parent or ROOT
    for p in o.data.polygons: p.use_smooth = True
    return o

def shell(name, center, radii, keep, thickness=.012, material=None, seg=40, rings=24, parent=None, bevel=0, inflate=None):
    """A piece of an ellipsoid (scene coordinates) kept where keep(x,y,z) is true, given thickness: hair caps, hats, helmets."""
    import bmesh
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    for v in bm.verts:
        v.co = Vector(S((center[0] + v.co.x * radii[0], center[1] + v.co.z * radii[1], center[2] - v.co.y * radii[2])))  # unit-sphere (x,y,z) -> scene (x,y up,z) then to Blender
    if inflate:   # per-vertex radial offset in metres (scene coordinates): an ink hull that tucks inside the head where the hair touches it
        cb = Vector(S(center))
        for v in bm.verts:
            sx, sy, sz = _sc(v.co); off = inflate(sx, sy, sz); d = v.co - cb
            if d.length > 1e-6: v.co = v.co + d.normalized() * off
    dead = [f for f in bm.faces if not keep(*_sc(f.calc_center_median()))]
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if material is not None: o.data.materials.append(material)
    if thickness:
      m = o.modifiers.new('Solidify', 'SOLIDIFY'); m.thickness = thickness; m.offset = -1
    if bevel and thickness:
        b = o.modifiers.new('Bevel', 'BEVEL'); b.width = bevel; b.segments = 3; b.limit_method = 'ANGLE'; b.angle_limit = math.radians(40)   # a rolled edge: the ink outline of a thin open shell turned into hatch lines
    o.parent = parent or ROOT
    for p in me.polygons: p.use_smooth = True
    return o

def _sc(v):
    """Blender point -> scene point."""
    return (v.x, v.z, -v.y)

def _base(n):
    return n.split('.')[0].rstrip('0123456789 ') or n

def merge(min_group=4):
    """City-scale models: join every group of meshes that share a base name AND a material into one mesh (modifiers applied), so a 100-building vista is a few hundred draw calls, not thousands."""
    bpy.context.view_layer.update()
    groups = {}
    for o in list(bpy.data.objects):
        if o.type != 'MESH' or not o.data.materials or o.data.materials[0] is None: continue
        if o.parent is not None and o.parent is not ROOT: continue   # animated / grouped parts keep their own nodes
        groups.setdefault((_base(o.name), o.data.materials[0].name), []).append(o)
    n = 0
    for (name, matn), objs in groups.items():
        if len(objs) < min_group: continue
        dg = bpy.context.evaluated_depsgraph_get()
        for o in objs:
            if o.modifiers:
                me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); o.modifiers.clear(); o.data = me
        with bpy.context.temp_override(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs):
            bpy.ops.object.join()
        objs[0].name = name; n += 1
    return n


def orient(o, X, Z):
    """Rotate an object (already created at its place) so its local x follows the SCENE vector X and its local z follows the SCENE vector Z (Gram-Schmidt)."""
    from mathutils import Vector as V
    x = V(X).normalized(); z = V(Z); z = (z - x * z.dot(x)).normalized(); y = z.cross(x)
    rs = Matrix(((x.x, y.x, z.x), (x.y, y.y, z.y), (x.z, y.z, z.z)))
    rb = _M.transposed() @ rs @ _M
    o.rotation_euler = rb.to_euler(); return o
