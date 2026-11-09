# The golden pendulum ball rig (the carrier of the film), modelled in Blender.
# Real sizes: ball 5.5 m diameter (Taipei 101 damper is about 5.5 m), cable bundle 11.5 m long (long state), four hydraulic dampers 2.8 m long (pad tip to clevis).
# Nodes (all inside Pivot, which sits at the CEILING MOUNT POINT, the roof underside):
#   Pivot > Mount ring (ceiling plate, flange, ring, head block, clamps) | Cables (built at the long length 11.5 m, origin at the Pivot, the module scales it in Y)
#         | Ball (origin = ball centre; seam belts with bolts, bumper ring, hatch, data plate; child Hook lug > Anchor block) | Damper 1..4 (origin = ball centre, +x = radial, piston at the bumper ring)
# Ball centre hangs DROP = rope + CAPH + R below the Pivot (rope = visible cable length, CAPH = 1.55 m of lug, shackle and anchor block above the ball top).
import sys, os, math
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector, Matrix

k.reset('golden-ball-rig')
R = 2.75; ROPE = 11.5; CAPH = 1.55; DROP = ROPE + CAPH + R   # 15.8 m from the Pivot to the ball centre (long state)

# ---- materials (after the reset) ----
gold = k.mat('gold polished', '#ffbe1a', .24, .92)
gold_belt = k.mat('gold seam belt', '#ffd23a', .3, .9)
gold_bolt = k.mat('gold bolt', '#e19a0c', .34, .9)
steel = k.mat('steel galvanized', '#aab4be', .42, .85)
steel_d = k.mat('steel dark', '#4b5663', .45, .8)
steel_c = k.mat('steel chrome', '#dfe5ec', .16, .95)
cable_m = k.mat('steel cable', '#8f9ba7', .36, .85)
bumper = k.mat('rubber bumper', '#ee5a1c', .8)
hose_m = k.mat('rubber hose', '#22262c', .8)
blue = k.mat('damper blue', '#2a6fd8', .42, .35)
red = k.mat('damper accumulator red', '#d9382c', .45, .3)
dial = k.mat('gauge face', '#f4f4ee', .5)
dark_hole = k.mat('lug hole dark', '#16191e', .8)
hatch_m = k.mat('gold hatch', '#f0ad14', .3, .9)

def B2S(b): return (b[0], b[2], -b[1])                         # Blender local point -> scene point (for stube / curve_tube)
def bt(name, a, b, r, mat, parent, seg=12): return k.stube(name, B2S(a), B2S(b), r, mat, seg, None, parent)

def scatter(name, add_fn, mats, material, parent, smooth=False):
    """One mesh object made of many copies of a small shape (bolt heads, studs, ferrules)."""
    bm = bmesh.new()
    for M in mats: add_fn(bm, M)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material); o.parent = parent
    for p in me.polygons: p.use_smooth = smooth
    return o

def cone_fn(r1, r2, h, seg=6):
    def f(bm, M): bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h, matrix=M)
    return f

def frame(p, n):
    """Matrix at point p whose local z follows direction n."""
    n = Vector(n).normalized()
    return Matrix.Translation(p) @ Vector((0, 0, 1)).rotation_difference(n).to_matrix().to_4x4()

def sph_pt(r, lat, psi):
    la, ps = math.radians(lat), math.radians(psi)
    return Vector((r * math.cos(la) * math.cos(ps), r * math.cos(la) * math.sin(ps), r * math.sin(la)))

def place(o, p, n):
    """Put object o at p with its z axis along n."""
    M = frame(p, n); o.location = M.to_translation(); o.rotation_euler = M.to_euler(); return o

def belt(name, lat, half_m, bump, material, parent, seg=120, steps=16):
    """A raised belt that follows the sphere (seam ring / bumper): revolved profile, flush at the edges."""
    ha = half_m / R; p0, p1 = math.radians(lat) - ha, math.radians(lat) + ha
    bm = bmesh.new(); rows = []
    for i in range(steps + 1):
        t = i / steps; phi = p0 + (p1 - p0) * t
        h = bump * (1 - abs(2 * t - 1) ** 3) ** .7 - .012 * (1 - (1 - abs(2 * t - 1) ** 3) ** .7)
        r = R + h
        rows.append([bm.verts.new((r * math.cos(phi) * math.cos(2 * math.pi * j / seg), r * math.cos(phi) * math.sin(2 * math.pi * j / seg), r * math.sin(phi))) for j in range(seg)])
    for i in range(steps):
        for j in range(seg):
            j2 = (j + 1) % seg
            bm.faces.new((rows[i][j], rows[i][j2], rows[i + 1][j2], rows[i + 1][j]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material); o.parent = parent
    for p in me.polygons: p.use_smooth = True
    return o

def boolean_cut(o, cutter):
    m = o.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cutter; m.solver = 'EXACT'
    with bpy.context.temp_override(object=o, active_object=o):
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

# ================= Pivot =================
piv = k.sgroup('Pivot')

# ---- Mount ring: ceiling plate, flange, eye ring, head block, ferrules and bundle clamps (fixed to the Pivot, never scaled) ----
mount = k.sgroup('Mount ring', parent=piv)
k.sbox('mount ceiling plate', (3.2, .35, 3.2), (0, .175, 0), material=steel_d, bevel=.02, parent=mount)
k.sbox('mount plate rib', (3.4, .12, .16), (0, .41, 0), material=steel, bevel=.02, parent=mount)
k.sbox('mount plate rib', (.16, .12, 3.4), (0, .41, 0), material=steel, bevel=.02, parent=mount)
nuts = [Matrix.Translation((x, y, -.045)) for x in (-1.35, 0, 1.35) for y in (-1.35, 0, 1.35) if (x or y)]
nuts += [Matrix.Translation((x, y, -.045)) for x, y in ((-.68, -1.35), (.68, -1.35), (-.68, 1.35), (.68, 1.35), (-1.35, -.68), (1.35, -.68), (-1.35, .68), (1.35, .68))]
scatter('mount plate nut', cone_fn(.1, .1, .09), nuts, steel, mount)
k.cyl('mount flange', .95, .28, k.S((0, -.14, 0)), material=steel, seg=48, bevel=.02, parent=mount)
k.cyl('mount flange step', .72, .1, k.S((0, -.33, 0)), material=steel_d, seg=48, bevel=.01, parent=mount)
scatter('mount flange bolt', cone_fn(.07, .07, .08), [Matrix.Translation((.83 * math.cos(a), .83 * math.sin(a), -.31)) for a in [i * math.tau / 12 for i in range(12)]], gold_bolt, mount)
k.storus('mount eye ring', .72, .1, (0, -.62, 0), (90, 0, 0), steel_c, major=48, minor=16, parent=mount)
for i in range(4):
    a = i * 90; x, z = .72 * math.cos(math.radians(a)), .72 * math.sin(math.radians(a))
    k.sbox('mount ring hanger', (.2, .34, .2), (x, -.44, z), (0, -a, 0), material=steel_d, bevel=.015, parent=mount)
    bt('mount ring spoke', (x * .62, -.62, -z * .62), (x * .75, -.62, -z * .75), .045, steel, mount, 10)
k.scyl('mount head block', .46, .45, (0, -.72, 0), material=steel_d, seg=40, bevel=.015, parent=mount)
k.scyl('mount head cone', .3, .25, (0, -1.07, 0), material=steel, seg=40, r2=.46, parent=mount)
scatter('mount head bolt', cone_fn(.045, .045, .06), [Matrix.Translation((.37 * math.cos(a), .37 * math.sin(a), -.49)) for a in [i * math.tau / 8 for i in range(8)]], gold_bolt, mount)
fer = []
for i in range(12):
    a = i * math.tau / 12; fer.append(Matrix.Translation((.2 * math.cos(a), .2 * math.sin(a), -1.28)))
scatter('cable ferrule', cone_fn(.082, .082, .2, 12), fer, steel, mount, True)
scatter('cable thimble cap', cone_fn(.08, .055, .06, 12), [Matrix.Translation((m.to_translation().x, m.to_translation().y, -1.4)) for m in fer], steel_d, mount, True)
for y in (-1.7, -2.15, -2.6):
    k.storus('bundle clamp band', .295, .042, (0, y, 0), (90, 0, 0), steel_d, major=40, minor=10, parent=mount)
    for s in (-1, 1):
        k.sbox('bundle clamp block', (.2, .16, .09), (s * .33, y, 0), material=steel, bevel=.012, parent=mount)
        k.scyl('bundle clamp bolt', .022, .26, (s * .33, y, 0), (0, 0, 90), material=gold_bolt, seg=8, parent=mount)
        k.scyl('bundle clamp nut', .04, .035, (s * .33 + s * .12, y, 0), (0, 0, 90), material=steel_c, seg=6, parent=mount)

# ---- Cables: the bundle, built at the LONG length (11.5 m) from the Pivot down; the module scales this group in Y ----
cab = k.sgroup('Cables', parent=piv)
k.stube('steel cable core', (0, 0, 0), (0, -ROPE, 0), .15, cable_m, 16, None, cab)
for i in range(12):
    a = i * math.tau / 12; x, z = .2 * math.cos(a), .2 * math.sin(a)
    k.stube('steel cable', (x, 0, z), (x, -ROPE, z), .05, cable_m, 10, None, cab)
for y in (-3.3, -5.5, -7.7, -9.9):
    k.storus('bundle band', .285, .038, (0, y, 0), (90, 0, 0), steel_d, major=40, minor=10, parent=cab)
    for s in (-1, 1):
        k.sbox('bundle band block', (.17, .14, .08), (s * .32, y, 0), material=steel, bevel=.01, parent=cab)
        k.scyl('bundle band bolt', .02, .22, (s * .32, y, 0), (0, 0, 90), material=gold_bolt, seg=8, parent=cab)

# ================= Ball =================
ball = k.sgroup('Ball', loc=(0, -DROP, 0), parent=piv)
k.sphere('gold sphere', R, (0, 0, 0), material=gold, seg=96, rings=48, parent=ball)
# seam belts (lat degrees, half width m, bump m)
BELTS = [('equator', 0, .26, .075), ('upper', 34, .17, .055), ('crown', 62, .15, .05), ('lower', -50, .17, .055)]
for nm, lat, hw, bp in BELTS:
    belt('seam belt ' + nm, lat, hw, bp, gold_belt, ball)
    n = max(10, round(54 * math.cos(math.radians(lat))))
    r_b = R + bp + .018
    mats = []
    for j in range(n):
        psi = j * 360 / n + (3 if lat > 0 else 0)
        P = sph_pt(r_b, lat, psi); mats.append(frame(P, P))
    scatter('seam belt bolt ' + nm, cone_fn(.062, .054, .05), mats, gold_bolt, ball)
    for sgn in (-1, 1):
        la = math.radians(lat) + sgn * (hw / R)
        k.torus('seam ridge ' + nm, R * math.cos(la) + .004, .02, (0, 0, R * math.sin(la)), material=gold_belt, major=120, minor=8, parent=ball)
# bumper ring: orange rubber belt the damper pads push on, with steel studs
BL = -24
belt('bumper ring', BL, .3, .17, bumper, ball)
r_s = R + .17 + .012
scatter('bumper stud', cone_fn(.07, .045, .05, 8), [frame(sph_pt(r_s, BL, j * 360 / 36), sph_pt(r_s, BL, j * 360 / 36)) for j in range(36)], steel_c, ball, True)
for sgn in (-1, 1):
    la = math.radians(BL) + sgn * (.31 / R)
    k.torus('bumper rim band', R * math.cos(la) + .008, .03, (0, 0, R * math.sin(la)), material=steel_d, major=120, minor=10, parent=ball)
# meridian weld seams (twelve lines pole to pole)
for i in range(6):
    k.torus('weld seam meridian', R + .004, .016, (0, 0, 0), (90, 0, i * 30), gold_belt, major=120, minor=6, parent=ball)
# inspection hatch (front left) and data plate
la, ps = 17, -112
P = sph_pt(R, la, ps)
h = k.cyl('hatch disc', .42, .06, P * 1.0, material=hatch_m, seg=48, bevel=.006, parent=ball); place(h, P * (1 + .015 / R), P)
t = k.torus('hatch rim', .42, .035, P, material=gold_belt, major=48, minor=10, parent=ball); place(t, P * (1 + .05 / R), P)
for i in range(8):
    a = i * math.tau / 8
    X = Vector((-math.sin(math.radians(ps)), math.cos(math.radians(ps)), 0)); Y = P.normalized().cross(X)
    q = P + (X * math.cos(a) + Y * math.sin(a)) * .34
    q = q.normalized() * (R + .075)
    b = k.cyl('hatch bolt', .045, .05, q, material=gold_bolt, seg=6, parent=ball); place(b, q, q)
hnd = k.torus('hatch handle', .1, .022, P, material=steel_c, major=24, minor=8, parent=ball); place(hnd, P.normalized() * (R + .1), P)
hp = sph_pt(R, -11.5, -72)
dp = k.box('data plate', (.52, .3, .02), hp, material=steel_c, bevel=.004, parent=ball)
M = frame(hp * (1 + .012 / R), hp); Xt = Vector((-math.sin(math.radians(-72)), math.cos(math.radians(-72)), 0)); n = hp.normalized(); Yt = n.cross(Xt)
dp.matrix_basis = Matrix(((Xt.x, Yt.x, n.x, hp.x * (1 + .012 / R)), (Xt.y, Yt.y, n.y, hp.y * (1 + .012 / R)), (Xt.z, Yt.z, n.z, hp.z * (1 + .012 / R)), (0, 0, 0, 1)))
for sx in (-1, 1):
    for sy in (-1, 1):
        q = hp + Xt * (sx * .21) + Yt * (sy * .11); q = q.normalized() * (R + .028)
        b = k.cyl('data plate rivet', .02, .02, q, material=gold_bolt, seg=8, parent=ball); place(b, q, q)

# ---- Hook lug (child of Ball, origin at the ball centre): base flange, lug eye, shackle; Anchor block = cable socket (hide it for the crane shot) ----
hook = k.group('Hook lug', ball)
k.cyl('hook lug flange', .62, .12, (0, 0, R + .02), material=gold_belt, seg=48, bevel=.012, parent=hook)
k.cyl('hook lug skirt', .78, .06, (0, 0, R - .03), material=gold_belt, seg=48, bevel=.01, parent=hook)
scatter('hook lug bolt', cone_fn(.06, .06, .08), [Matrix.Translation((.5 * math.cos(a), .5 * math.sin(a), R + .115)) for a in [i * math.tau / 10 for i in range(10)]], gold_bolt, hook)
zh = R + .4   # eye hole centre height above the ball centre: 3.15
k.box('hook lug boss', (.3, .62, .33), (0, 0, R + .13 + .165), material=gold_belt, bevel=.015, parent=hook)
lug = k.cyl('hook lug eye plate', .34, .3, (0, 0, zh), (0, 90, 0), material=gold_belt, seg=48, bevel=.012, parent=hook)
cutter = k.cyl('cutter', .18, .6, (0, 0, zh), (0, 90, 0), material=gold_belt, seg=32, parent=hook)
boolean_cut(lug, cutter)
k.torus('hook lug bush', .18, .035, (0, 0, zh), (0, 90, 0), steel_d, major=32, minor=8, parent=hook)
for sx in (-1, 1):
    k.cyl('hook lug gusset', .05, .02, (sx * .16, 0, zh), (0, 90, 0), steel_d, seg=16, parent=hook)
    k.box('hook lug gusset plate', (.05, .5, .22), (sx * .17, 0, R + .22), material=gold_belt, bevel=.01, parent=hook)
# shackle: a ring in the xy plane through the lug hole (and later through the anchor block eye)
k.torus('shackle bow', .3, .07, (0, 0, zh + .3), (90, 0, 90), steel_c, major=40, minor=14, parent=hook)
k.cyl('shackle pin', .045, .5, (0, 0, zh + .3 - .3 + .0), (0, 90, 0), material=steel_d, seg=12, parent=hook).location = (0, 0, zh + .6)
anch = k.group('Anchor block', hook)
k.torus('anchor eye', .17, .055, (0, 0, zh + .6), (0, 90, 0), steel_d, major=32, minor=12, parent=anch)
k.cyl('anchor eye neck', .12, .16, (0, 0, zh + .83), material=steel_d, seg=24, bevel=.008, parent=anch)
k.cyl('anchor cone', .15, .45, (0, 0, R + 1.15 + .15), material=steel, seg=40, r2=.42, bevel=.01, parent=anch)
k.cyl('anchor collar', .45, .1, (0, 0, R + CAPH - .04), material=steel_d, seg=40, bevel=.01, parent=anch)
scatter('anchor collar bolt', cone_fn(.04, .04, .05), [Matrix.Translation((.39 * math.cos(a), .39 * math.sin(a), R + CAPH + .02)) for a in [i * math.tau / 16 for i in range(16)] if abs(math.cos(a - 0)) < 2], gold_bolt, anch)
scatter('cable socket', cone_fn(.088, .075, .14, 12), [Matrix.Translation((.2 * math.cos(i * math.tau / 12), .2 * math.sin(i * math.tau / 12), R + CAPH + .02)) for i in range(12)], steel, anch, True)
scatter('cable socket core', cone_fn(.18, .16, .14, 16), [Matrix.Translation((0, 0, R + CAPH + .02))], steel_d, anch, True)

# ================= Dampers: four hydraulic pistons on trestles, pads at the bumper ring =================
zA = R * math.sin(math.radians(BL))   # piston axis height relative to the ball centre (-1.12)
FOOT = zA - 3.0
def damper(i, ang):
    g = k.sgroup('Damper %d' % i, loc=(0, -DROP, 0), parent=piv); g.rotation_euler = (0, 0, math.radians(-ang))
    k.cyl('damper pad', .3, .14, (2.87, 0, zA), (0, 90, 0), bumper, 40, bevel=.012, parent=g)
    k.cyl('damper pad plate', .26, .05, (2.965, 0, zA), (0, 90, 0), steel_d, 32, bevel=.006, parent=g)
    k.cyl('damper rod', .1, .92, (3.43, 0, zA), (0, 90, 0), steel_c, 24, parent=g)
    k.cyl('damper gland', .2, .16, (3.92, 0, zA), (0, 90, 0), steel_d, 32, bevel=.01, parent=g)
    k.cyl('damper flange', .31, .08, (4.04, 0, zA), (0, 90, 0), steel, 40, bevel=.01, parent=g)
    scatter('damper flange bolt', cone_fn(.04, .04, .06), [frame((3.995, .25 * math.cos(a), zA + .25 * math.sin(a)), (-1, 0, 0)) for a in [j * math.tau / 8 for j in range(8)]], gold_bolt, g)
    k.cyl('damper cylinder', .24, 1.28, (4.68, 0, zA), (0, 90, 0), blue, 40, bevel=.006, parent=g)
    for x in (4.25, 4.68, 5.11):
        k.torus('damper cylinder band', .247, .02, (x, 0, zA), (0, 90, 0), steel_d, 40, 10, parent=g)
    k.cyl('damper rear flange', .3, .08, (5.3, 0, zA), (0, 90, 0), steel, 40, bevel=.01, parent=g)
    k.sphere('damper cap dome', .24, (5.33, 0, zA), (.6, 1, 1), blue, 32, 12, g)
    k.box('damper clevis', (.16, .3, .26), (5.5, 0, zA), material=steel_d, bevel=.01, parent=g)
    k.cyl('damper clevis pin', .045, .5, (5.55, 0, zA), (90, 0, 0), steel_c, 16, parent=g)
    for s in (-1, 1):
        k.box('damper clevis plate', (.34, .05, .36), (5.67, s * .14, zA), material=steel_d, bevel=.008, parent=g)
    # trestle: back post, foot plate with anchor studs, front uprights, saddle, braces
    k.box('damper back post', (.28, .7, zA + .9 - FOOT), (5.9, 0, (FOOT + zA + .9) / 2), material=steel_d, bevel=.015, parent=g)
    k.box('damper foot plate', (2.1, 1.7, .1), (5.35, 0, FOOT - .05), material=steel, bevel=.012, parent=g)
    studs = [Matrix.Translation((x, y, FOOT + .05)) for x in (4.5, 5.0, 5.7, 6.2) for y in (-.7, .7)]
    scatter('damper anchor nut', cone_fn(.07, .07, .07), studs, steel_c, g)
    for s in (-1, 1):
        k.box('damper upright', (.2, .2, zA - .3 - FOOT), (4.45, s * .52, (FOOT + zA - .3) / 2), material=steel_d, bevel=.012, parent=g)
        bt('damper brace', (5.9, s * .3, FOOT + .4), (4.5, s * .52, zA - .55), .055, steel, g, 10)
        k.box('damper gusset', (.5, .05, .5), (5.6, s * .38, FOOT + .25), (0, 45, 0), material=steel, bevel=.008, parent=g)
    k.box('damper saddle beam', (.3, 1.3, .14), (4.45, 0, zA - .31), material=steel_d, bevel=.012, parent=g)
    for x in (4.45,):
        k.torus('damper saddle clamp', .27, .03, (x, 0, zA), (0, 90, 0), steel_d, 40, 10, parent=g)
    # accumulator bottle with hose, gauge
    k.cyl('damper accumulator', .17, 1.6, (5.5, .72, FOOT + .85), material=red, seg=32, bevel=.006, parent=g)
    k.sphere('damper accumulator dome', .17, (5.5, .72, FOOT + 1.65), (1, 1, .7), red, 24, 10, g)
    for z in (FOOT + .35, FOOT + 1.35):
        k.torus('damper accumulator strap', .18, .018, (5.5, .72, z), material=steel_d, major=32, minor=8, parent=g)
    k.curve_tube('damper hose', [B2S(p) for p in [(4.55, .12, zA + .22), (4.7, .38, zA + .3), (5.2, .72, zA + .1), (5.5, .72, FOOT + 1.75)]], [.035] * 4, hose_m, parent=g)
    k.cyl('damper gauge stem', .02, .12, (4.3, 0, zA + .3), material=steel_c, seg=8, parent=g)
    k.cyl('damper gauge dial', .085, .05, (4.3, -.03, zA + .38), (90, 0, 0), steel_c, 24, parent=g)
    k.cyl('damper gauge face', .068, .01, (4.3, -.06, zA + .38), (90, 0, 0), dial, 24, parent=g)
    k.box('damper gauge needle', (.006, .004, .05), (4.3, -.067, zA + .395), material=red, bevel=0, parent=g)
    return g
for i, a in enumerate((45, 135, 225, 315)):
    damper(i + 1, a)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/golden-ball-rig.glb'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cam.data.clip_end = 2000
k.preview(os.environ['PREVIEW_DIR'], size=(360, 640), target=(0, 0, -9.5), dist=44, views=[(.25, -1, .1), (-.7, -.8, .12)], prefix='a')
k.preview(os.environ['PREVIEW_DIR'], size=(520, 640), target=(0, 0, -DROP + .6), dist=11, views=[(0, -1, .2), (.9, -.6, .5)], prefix='b')
k.preview(os.environ['PREVIEW_DIR'], size=(420, 640), target=(0, 0, -1.4), dist=6, views=[(.6, -1, .15)], prefix='c')
k.preview(os.environ['PREVIEW_DIR'], size=(520, 640), target=(3.6, -3.6, -DROP - 2.2), dist=9, views=[(1, -1.5, .25)], prefix='d')
