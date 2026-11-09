# Two things in one model for the pendulum tower.
# (1) Node Crane (at the origin): a yellow lattice-boom crawler crane (tracks with 76 link pads each, slewing ring, deck with hood, counterweight blocks and cab, A-frame mast, 60 m four-chord lattice Boom pointing up-left at 70 degrees),
#     Hoist rope (pivot at the boom-tip sheave, falls run straight down), Hook block (origin = its top sheave, hangs 9.5 m under the boom tip, safety-latch hook), and a ground Control station with the Control lever (pivot at its base axle, grip top at 1.05 m).
#     The crane faces -x (boom foot at x=-2.9, y=3.0); the operator side is +z.
# (2) Node Winch (12 m to the +x side, works stand-alone at any position): floor frame, Winch drum (1.0 m flanges, wound rope, ratchet wheel; spins about the x axis at y=1.0), Winch crank (pivot at the axle, arm 0.4 m, handle axis at 1.0 m height when horizontal), Ratchet pawl (pivot on its pin), rope tail with a hook.
import sys, os, math, random
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector, Matrix
random.seed(7)
k.reset('crane-winch')

ORIG = {}
def G(name, world, parent=None):
    po = ORIG[parent.name] if parent else (0, 0, 0)
    g = k.sgroup(name, (world[0] - po[0], world[1] - po[1], world[2] - po[2]), parent); ORIG[g.name] = world; return g
def L(g, p):
    o = ORIG[g.name] if g else (0, 0, 0)
    return (p[0] - o[0], p[1] - o[1], p[2] - o[2])
def B(g, name, size, loc, m, rot=(0, 0, 0), bevel=.01, seg=2): return k.sbox(name, size, L(g, loc), rot, m, bevel, seg, g)
def C(g, name, r, h, loc, m, rot=(0, 0, 0), seg=24, r2=None): return k.scyl(name, r, h, L(g, loc), rot, m, seg, r2, 0, g)
def SP(g, name, r, loc, m, scale=(1, 1, 1), seg=20, rings=12): return k.ssphere(name, r, L(g, loc), scale, m, seg, rings, g)
def TO(g, name, R, r, loc, m, rot=(0, 0, 0), major=32, minor=8): return k.storus(name, R, r, L(g, loc), rot, m, major, minor, g)

class Acc:
    """Many tubes, boxes and rings of one material accumulated into ONE mesh (lattice booms, track chains, ropes): world scene numbers in, one named mesh out."""
    def __init__(s, g): s.g = g; s.bm = bmesh.new(); s.o = ORIG[g.name] if g else (0, 0, 0)
    def P(s, p): return Vector(k.S((p[0] - s.o[0], p[1] - s.o[1], p[2] - s.o[2])))
    def cyl(s, a, b, r, r2=None, seg=10):
        A, Bp = s.P(a), s.P(b); d = Bp - A
        if d.length < 1e-6: return
        M = Matrix.Translation((A + Bp) / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=d.length, matrix=M, calc_uvs=False)
    def box(s, c, size, rot=(0, 0, 0)):
        M = Matrix.Translation(s.P(c)) @ k._R(rot).to_matrix().to_4x4() @ Matrix.Diagonal((size[0], size[2], size[1], 1))
        bmesh.ops.create_cube(s.bm, size=1.0, matrix=M, calc_uvs=False)
    def ring(s, c, ax, R, r, major=40, minor=6):
        Rm = Vector((0, 0, 1)).rotation_difference(Vector(k.S(ax)).normalized()).to_matrix(); C0 = s.P(c); vs = []
        for i in range(major):
            a = i / major * math.tau
            for j in range(minor):
                b = j / minor * math.tau; q = (R + r * math.cos(b))
                vs.append(s.bm.verts.new(C0 + Rm @ Vector((q * math.cos(a), q * math.sin(a), r * math.sin(b)))))
        for i in range(major):
            for j in range(minor):
                s.bm.faces.new((vs[i * minor + j], vs[((i + 1) % major) * minor + j], vs[((i + 1) % major) * minor + (j + 1) % minor], vs[i * minor + (j + 1) % minor]))
    def make(s, name, m, smooth=False):
        bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces[:])
        me = bpy.data.meshes.new(name); s.bm.to_mesh(me); s.bm.free()
        o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
        o.data.materials.append(m); o.parent = s.g or k.ROOT
        for p in me.polygons: p.use_smooth = smooth
        return o

# ---- materials ----
cy = k.mat('crane yellow paint', '#ffc400', .45, .25); cb = k.mat('crane steel black', '#1a1b20', .55, .5); cw = k.mat('crane white paint', '#f2f2ee', .5, .2)
cg = k.mat('crane steel grey', '#767b85', .45, .7); cgl = k.mat('crane steel light', '#b9bec7', .3, .9); cwt = k.mat('crane counterweight grey', '#8a8e98', .7, .3)
ctr = k.mat('crane track steel', '#2b2c32', .6, .6); glass = k.mat('cab glass', '#3b6c8f', .08, .1); rope = k.mat('crane wire rope', '#3a3b40', .5, .6)
lamp = k.mat('crane lamp glow', '#fff1b8', .2, emit='#fff1b8', emit_strength=4); redl = k.mat('crane red light', '#ff2a2a', .3, emit='#ff2a2a', emit_strength=3)
red = k.mat('crane safety red', '#d8321f', .45, .3); rub = k.mat('crane rubber black', '#0f1013', .85)
wf = k.mat('winch frame red', '#d3361f', .5, .4); wst = k.mat('winch steel', '#9ba0aa', .35, .85); wrope = k.mat('winch rope hemp', '#c9a46a', .9); wwood = k.mat('winch handle wood', '#a8622c', .7)
slab = k.mat('ground winch slab', '#8d9097', .9)

# ================= CRANE =================
Crane = G('Crane', (0, 0, 0))
# ---- crawler tracks ----
def track_pts(xr, xf, cy_, r, n):
    straight = xr - xf; per = 2 * straight + 2 * math.pi * r; step = per / n; out = []
    for i in range(n):
        s = i * step
        if s < straight: x, y, th = xf + s, cy_ - r, 0
        elif s < straight + math.pi * r: a = (s - straight) / r; x, y, th = xr + r * math.sin(a), cy_ - r * math.cos(a), a
        elif s < 2 * straight + math.pi * r: x, y, th = xr - (s - straight - math.pi * r), cy_ + r, math.pi
        else: a = (s - 2 * straight - math.pi * r) / r; x, y, th = xf - r * math.sin(a), cy_ + r * math.cos(a), math.pi + a
        out.append((x, y, th))
    return out, step
XR, XF, TY, TR = 3.7, -3.7, .85, .775
for s in (1, -1):
    z0 = s * 3.1; pts, step = track_pts(XR, XF, TY, TR, 76)
    pads = Acc(Crane); ribs = Acc(Crane); pins = Acc(Crane)
    for (x, y, th) in pts:
        d = math.degrees(th); ox, oy = math.sin(th), -math.cos(th)
        pads.box((x, y, z0), (step * .93, .14, 1.3), (0, 0, d))
        ribs.box((x + ox * .095, y + oy * .095, z0), (.045, .055, 1.3), (0, 0, d))
        px, py = x - math.cos(th) * step / 2, y - math.sin(th) * step / 2
        pins.cyl((px, py, z0 - .7), (px, py, z0 + .7), .02, seg=8)
    pads.make('track pad chain', ctr); ribs.make('track grouser rib', cb); pins.make('track link pin', cgl)
    B(Crane, 'track frame beam', (7.6, .5, .5), (0, .98, z0), cy, bevel=.03, seg=3)
    B(Crane, 'track frame web', (7.0, .24, .62), (0, 1.0, z0), cb, bevel=.015)
    B(Crane, 'track guard', (8.4, .07, 1.62), (0, 1.9, z0), cy, bevel=.02, seg=2)
    B(Crane, 'track guard edge', (8.4, .14, .06), (0, 1.84, z0 + s * .82), cy, bevel=.01)
    for xx in (-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9): B(Crane, 'track guard rib', (.08, .12, 1.5), (xx, 1.84, z0), cb, bevel=.01, seg=1)
    # sprocket, idler, rollers
    C(Crane, 'track sprocket', .7, .34, (XR, TY, z0), cg, (90, 0, 0), 36)
    C(Crane, 'track sprocket hub', .28, .5, (XR, TY, z0), cgl, (90, 0, 0), 28)
    teeth = Acc(Crane)
    for i in range(14):
        a = i / 14 * math.tau; teeth.box((XR + math.cos(a) * .73, TY + math.sin(a) * .73, z0), (.14, .16, .34), (0, 0, math.degrees(a)))
    teeth.make('track sprocket tooth', cg)
    for i in range(8):
        a = i / 8 * math.tau; C(Crane, 'sprocket hub bolt', .03, .04, (XR + math.cos(a) * .2, TY + math.sin(a) * .2, z0 + s * .27), cb, (90, 0, 0), 6)
    C(Crane, 'track idler wheel', .74, .36, (XF, TY, z0), cg, (90, 0, 0), 40); C(Crane, 'track idler hub', .3, .5, (XF, TY, z0), cgl, (90, 0, 0), 28)
    TO(Crane, 'track idler rim', .74, .03, (XF, TY, z0 + .18), cb, (0, 0, 0), 40, 6); TO(Crane, 'track idler rim', .74, .03, (XF, TY, z0 - .18), cb, (0, 0, 0), 40, 6)
    B(Crane, 'track tension cylinder', (1.5, .16, .16), (XF + 1.0, TY, z0 + s * .0), cgl, bevel=.03)
    for i in range(7):
        x = -3.0 + i; C(Crane, 'track bottom roller', .17, .5, (x, .32, z0), cg, (90, 0, 0), 20)
        C(Crane, 'track roller flange', .22, .035, (x, .32, z0 + .13), cb, (90, 0, 0), 20); C(Crane, 'track roller flange', .22, .035, (x, .32, z0 - .13), cb, (90, 0, 0), 20)
        B(Crane, 'track roller bracket', (.34, .45, .16), (x, .62, z0 + s * .0), cb, bevel=.02)
    for x in (-1.6, 0, 1.6):
        C(Crane, 'track carrier roller', .12, .42, (x, 1.42, z0), cg, (90, 0, 0), 18)
        B(Crane, 'track carrier bracket', (.2, .22, .14), (x, 1.2, z0), cb, bevel=.015)
# ---- carbody and slewing ring ----
B(Crane, 'carbody box', (5.6, .95, 4.9), (0, 1.35, 0), cy, bevel=.05, seg=3)
for x in (-1.9, 1.9): B(Crane, 'carbody cross beam', (1.0, .7, 5.3), (x, 1.0, 0), cb, bevel=.04, seg=2)
for x in (-2.9, 2.9): B(Crane, 'carbody end plate', (.12, .8, 4.9), (x, 1.35, 0), cb, bevel=.02)
C(Crane, 'slewing ring base', 2.15, .14, (0, 1.89, 0), cg, seg=64)
teeth = Acc(Crane); bol = Acc(Crane)
for i in range(72):
    a = i / 72 * math.tau; teeth.box((math.cos(a) * 2.2, 1.9, math.sin(a) * 2.2), (.1, .12, .1), (0, -math.degrees(a), 0))
for i in range(36):
    a = i / 36 * math.tau; bol.cyl((math.cos(a) * 1.95, 2.0, math.sin(a) * 1.95), (math.cos(a) * 1.95, 2.05, math.sin(a) * 1.95), .035, seg=6)
teeth.make('slewing gear tooth', cb); bol.make('slewing ring bolt', cgl)
# ---- deck ----
B(Crane, 'deck plate', (7.4, .3, 4.6), (.3, 2.2, 0), cy, bevel=.03, seg=2)
B(Crane, 'deck edge skirt', (7.4, .25, .1), (.3, 2.06, 2.3), cb, bevel=.01); B(Crane, 'deck edge skirt', (7.4, .25, .1), (.3, 2.06, -2.3), cb, bevel=.01)
B(Crane, 'deck walkway grating', (2.2, .04, 1.1), (-.6, 2.37, .0), cb, bevel=.005, seg=1)
B(Crane, 'engine hood', (2.2, 1.7, 2.6), (1.4, 3.2, -.95), cy, bevel=.08, seg=4)
B(Crane, 'hood roof panel', (2.0, .08, 2.4), (1.4, 4.08, -.95), cb, bevel=.02)
for i in range(8):
    B(Crane, 'hood vent slat', (.9, .035, .025), (1.0, 2.9 + i * .08, .365), cb, bevel=.004, seg=1)
    B(Crane, 'hood vent slat', (.9, .035, .025), (1.0, 2.9 + i * .08, -2.265), cb, bevel=.004, seg=1)
for i in range(3): B(Crane, 'hood door seam', (.012, 1.45, .012), (.7 + i * .7, 3.2, .353), cb, bevel=.002, seg=1)
for i in range(2):
    C(Crane, 'exhaust stack', .13, 1.3, (2.0, 4.7, -.4 - i * .5), cb, seg=16); C(Crane, 'exhaust stack cap', .17, .06, (2.0, 5.38, -.4 - i * .5), cg, seg=16)
C(Crane, 'air cleaner', .22, 1.0, (.8, 4.5, -1.8), cg, seg=20); C(Crane, 'air cleaner cap', .24, .08, (.8, 5.04, -1.8), cb, seg=20)
k.stext('hood maker lettering', 'TITAN 300', .38, L(Crane, (1.42, 3.4, .365)), 0, cb, .01, Crane)
k.stext('hood maker lettering', 'TITAN 300', .38, L(Crane, (1.38, 3.4, -2.265)), 180, cb, .01, Crane)
for nm, x in (('main hoist drum', -1.4), ('boom hoist drum', -.3)):
    C(Crane, nm, .4, .85, (x, 3.0, -1.55), cg, (90, 0, 0), 28)
    for z in (-1.99, -1.11): C(Crane, nm + ' flange', .56, .05, (x, 3.0, z), cb, (90, 0, 0), 28)
    acc = Acc(Crane)
    for layer in range(2):
        for t in range(14): acc.ring((x, 3.0, -1.95 + t * .06 + layer * .03), (0, 0, 1), .43 + layer * .045, .025, 32, 6)
    acc.make(nm + ' wound rope', rope)
    B(Crane, nm + ' bracket', (.2, 1.2, .1), (x, 2.8, -2.05), cb, bevel=.02)
B(Crane, 'winch house frame', (2.2, .1, .1), (-.85, 3.7, -2.1), cb, bevel=.02)
# handrails along the deck edge
hr = Acc(Crane)
for z in (2.25, -2.25):
    for x in [-3.2 + i * 1.2 for i in range(7)]: hr.cyl((x, 2.35, z), (x, 3.4, z), .035)
    hr.cyl((-3.2, 3.4, z), (4.0, 3.4, z), .03); hr.cyl((-3.2, 2.9, z), (4.0, 2.9, z), .025)
hr.make('deck handrail', cy)
# counterweight
B(Crane, 'counterweight tray', (3.3, .4, 4.5), (4.95, 2.5, 0), cb, bevel=.03)
cw_sizes = [((2.9, .95, 4.3), 3.25), ((2.9, .95, 4.3), 4.22), ((2.4, .9, 3.6), 5.15)]
for i, (sz, yc) in enumerate(cw_sizes):
    B(Crane, 'counterweight block', sz, (4.95, yc, 0), cwt, bevel=.04, seg=2)
    C(Crane, 'counterweight lifting eye', .06, .05, (4.95, yc + sz[1] / 2 + .02, 0), cb, seg=12); TO(Crane, 'counterweight eye ring', .08, .018, (4.95, yc + sz[1] / 2 + .09, 0), cb, (90, 0, 0), 20, 6)
    hz = Acc(Crane); zb = sz[2] / 2 + .008
    for sgn in (1, -1):
        B(Crane, 'counterweight hazard base', (sz[0] - .1, .22, .012), (4.95, yc + sz[1] / 2 - .2, sgn * zb), cy, bevel=.003, seg=1)
        for j in range(int((sz[0] - .1) / .2)):
            hz.box((4.95 - (sz[0] - .1) / 2 + .1 + j * .2, yc + sz[1] / 2 - .2, sgn * (zb + .008)), (.09, .27, .012), (0, 0, 35))
    hz.make('counterweight hazard stripe', cb)
    for sx in (-1, 1):
        for sy in (-1, 1): C(Crane, 'counterweight bolt', .04, .03, (4.95 + sx * (sz[0] / 2 - .15), yc + sy * (sz[1] / 2 - .15), sz[2] / 2 + .014), cb, (90, 0, 0), 6)
# rear hazard (white and black) band
hb = Acc(Crane)
B(Crane, 'counterweight rear white band', (.012, .26, 4.2), (6.41, 3.25, 0), cw, bevel=.003, seg=1)
for j in range(21): hb.box((6.424, 3.25, -2.0 + j * .2), (.012, .27, .09), (0, 0, 0))
hb.make('counterweight rear black stripe', cb)
# ---- cab ----
B(Crane, 'cab shell', (1.8, 2.2, 1.5), (-2.2, 3.55, 1.85), cy, bevel=.07, seg=3)
B(Crane, 'cab floor bracket', (1.4, .22, 1.2), (-2.2, 2.5, 1.95), cb, bevel=.02)
B(Crane, 'cab windscreen', (.02, 1.15, 1.25), (-3.11, 3.95, 1.85), glass, bevel=.003, seg=1)
B(Crane, 'cab side window', (1.4, 1.0, .02), (-2.2, 3.95, 2.61), glass, bevel=.003, seg=1)
B(Crane, 'cab rear window', (.02, .9, 1.0), (-1.29, 3.95, 1.85), glass, bevel=.003, seg=1)
for x in (-2.9, -1.5): B(Crane, 'cab window post', (.07, 1.05, .035), (x, 3.95, 2.62), cb, bevel=.005, seg=1)
B(Crane, 'cab roof', (2.0, .12, 1.7), (-2.2, 4.69, 1.85), cb, bevel=.03)
B(Crane, 'cab air conditioner', (.8, .26, .6), (-1.8, 4.88, 1.85), cw, bevel=.04, seg=2)
for i, z in enumerate((1.45, 2.25)): C(Crane, 'cab work lamp', .09, .08, (-3.12, 4.6, z), lamp, (0, 0, 90), 16)
SP(Crane, 'cab beacon', 1, (-2.6, 4.8, 1.2), redl, (.08, .06, .08), 12, 8)
for i in range(3): B(Crane, 'cab step', (.8, .07, .3), (-2.2, 2.0 + i * .22, 2.75 + .0), cb, bevel=.01, seg=1)
for x in (-2.55, -1.85): C(Crane, 'cab ladder rail', .025, .9, (x, 2.5, 2.9), cb, seg=8)
B(Crane, 'cab mirror arm', (.03, .03, .3), (-3.05, 4.1, 2.75), cb, bevel=.004, seg=1); B(Crane, 'cab mirror', (.05, .22, .14), (-3.05, 4.1, 2.92), cb, bevel=.01)
B(Crane, 'cab wiper', (.012, .012, .7), (-3.125, 3.55, 1.85), cb, (0, 0, 0), bevel=.002, seg=1)
B(Crane, 'cab door handle', (.14, .03, .03), (-1.65, 3.6, 2.64), cb, bevel=.008)
# ---- mast (A-frame), falls, backstay ----
mast = Acc(Crane); mast_x = Acc(Crane)
for z in (1.4, -1.4):
    mast.cyl((.4, 2.4, z), (1.6, 12.8, z * .22), .11, .08, 8)
for i in range(1, 11):
    t = i / 11; y = 2.4 + t * 10.4; x = .4 + t * 1.2; zz = 1.4 * (1 - t) + (-1.4) * (1 - t) * 0
    zL, zR = 1.4 + (1.4 * .22 - 1.4) * t, -1.4 + (-1.4 * .22 + 1.4) * t
    mast_x.cyl((x, y, zL), (x, y, zR), .045, seg=6)
    if i < 10:
        t2 = (i + 1) / 11; y2 = 2.4 + t2 * 10.4; x2 = .4 + t2 * 1.2; zL2, zR2 = 1.4 + (1.4 * .22 - 1.4) * t2, -1.4 + (-1.4 * .22 + 1.4) * t2
        mast_x.cyl((x, y, zL), (x2, y2, zR2) , .035, seg=6); mast_x.cyl((x, y, zR), (x2, y2, zL2), .035, seg=6)
mast.make('mast leg', cy); mast_x.make('mast lacing', cy)
B(Crane, 'mast head block', (.7, .55, 1.0), (1.6, 12.85, 0), cb, bevel=.04)
for z in (-.35, 0, .35): C(Crane, 'mast head sheave', .3, .1, (1.6, 12.5, z), cg, (90, 0, 0), 24)
C(Crane, 'mast head pin', .05, 1.2, (1.6, 12.5, 0), cgl, (90, 0, 0), 12)
SP(Crane, 'mast aviation light', 1, (1.6, 13.25, 0), redl, (.1, .1, .1), 12, 8)
falls = Acc(Crane); back = Acc(Crane)
for z in (-.35, 0, .35):
    falls.cyl((1.3, 12.5, z), (2.95, 4.3, z * .8), .028, seg=8); falls.cyl((1.9, 12.5, z), (2.95, 4.3, z * .8), .028, seg=8)
for z in (-1, 1): back.cyl((1.6, 12.6, z * .3), (5.7, 5.62, z * 1.1), .032, seg=8)
falls.make('boom hoist fall', rope); back.make('mast backstay rope', rope)
B(Crane, 'boom hoist lower block', (.5, .7, 1.0), (2.95, 4.0, 0), cb, bevel=.04)
for z in (-.3, 0, .3): C(Crane, 'boom hoist lower sheave', .22, .09, (2.95, 4.1, z), cg, (90, 0, 0), 20)

# ---- boom ----
FX, FY = -2.9, 3.0
dv = Vector((-math.cos(math.radians(70)), math.sin(math.radians(70)), 0)); nv = Vector((dv.y, -dv.x, 0))
Boom = G('Boom', (FX, FY, 0), Crane)
def BP(s, t, u): return (FX + dv.x * s + nv.x * t, FY + dv.y * s + nv.y * t, u)
def hw(s):
    if s <= 8: return .9
    if s <= 56: return .9 - .4 * (s - 8) / 48
    return .5 - .08 * (s - 56) / 4
def corners(s):
    h = hw(s); return [BP(s, h, h), BP(s, h, -h), BP(s, -h, -h), BP(s, -h, h)]
ch = Acc(Boom); rg = Acc(Boom); lc = Acc(Boom); bk = Acc(Boom); bw = Acc(Boom); fl = Acc(Boom)
N = 40; ss = [i * 1.5 for i in range(N + 1)]
for i in range(N):
    ca, cb_ = corners(ss[i]), corners(ss[i + 1]); rr = .075 if ss[i] < 20 else (.06 if ss[i] < 45 else .048)
    for j in range(4):
        ch.cyl(ca[j], cb_[j], rr, seg=10)
        a, b = (ca[j], cb_[(j + 1) % 4]) if i % 2 == 0 else (ca[(j + 1) % 4], cb_[j])
        lc.cyl(a, b, .03, seg=6)
for i in range(N + 1):
    ca = corners(ss[i])
    for j in range(4): rg.cyl(ca[j], ca[(j + 1) % 4], .03, seg=6)
    if i % 4 == 0 and 0 < i < N:   # splice flange plates and white / black bands every 6 m
        for j in range(4):
            p = Vector(ca[j]); fl.cyl(tuple(p - dv * .02), tuple(p + dv * .02), .115, seg=14)
            tgt = bk if (i // 4) % 2 else bw
            tgt.cyl(tuple(p - dv * .3), tuple(p + dv * .3), .082 if ss[i] < 20 else .068, seg=12)
ch.make('boom chord tube', cy); rg.make('boom cross frame', cy); lc.make('boom lacing tube', cy); fl.make('boom splice flange', cg); bk.make('boom band black', cb); bw.make('boom band white', cw)
# butt: foot pin and lugs, tip head
C(Boom, 'boom foot pin', .08, 2.2, (FX, FY, 0), cgl, (90, 0, 0), 16)
for z in (-1.0, 1.0): B(Boom, 'boom foot lug', (.7, .6, .12), (FX + .05, FY - .1, z), cb, bevel=.03)
for z in (-1.14, 1.14): C(Boom, 'boom foot pin cap', .13, .06, (FX, FY, z), cg, (90, 0, 0), 16)
T = Vector(BP(60, 0, 0))
for z in (-.42, .42):
    B(Boom, 'boom tip cheek plate', (1.3, 1.2, .08), tuple(T - dv * .35), cb, (0, 0, 110), bevel=.03)
for z in (-.2, 0, .2): C(Boom, 'boom tip sheave', .5, .1, (T.x, T.y - .05, z), cg, (90, 0, 0), 28); C(Boom, 'boom tip sheave hub', .17, .13, (T.x, T.y - .05, z), cgl, (90, 0, 0), 16)
C(Boom, 'boom tip pin', .05, 1.0, (T.x, T.y - .05, 0), cgl, (90, 0, 0), 12)
for z in (-.46, .46): B(Boom, 'boom tip pendant lug', (.3, .3, .06), (T.x - dv.x * .0 + dv.x * .4, T.y + .45, z), cb, bevel=.02)
SP(Boom, 'boom tip aviation light', 1, (T.x - .1, T.y + .75, 0), redl, (.1, .1, .1), 12, 8)
pend = Acc(Boom)
for z in (-.46, .46): pend.cyl((T.x + dv.x * .4, T.y + .5, z), (1.45, 12.5, z * .7), .032, seg=8)
pend.make('boom pendant rope', rope)

# ---- Hoist rope and Hook block ----
HRX, HRY = T.x, T.y - .05
Hoist = G('Hoist rope', (HRX, HRY, 0), Crane)
hp = Acc(Hoist); DROP = 9.45
for x in (-.5, .5):
    for z in (-.2, .2): hp.cyl((HRX + x, HRY, z), (HRX + x, HRY - DROP, z), .028, seg=8)
hp.make('hoist rope fall', rope)
HB = G('Hook block', (HRX, HRY - DROP, 0), Crane)
hb = lambda x, y, z: (HRX + x, HRY - DROP + y, z)
for z in (-.2, 0, .2):
    C(HB, 'hook block sheave', .5, .1, hb(0, 0, z), cg, (90, 0, 0), 28); C(HB, 'hook block sheave hub', .16, .13, hb(0, 0, z), cgl, (90, 0, 0), 16)
C(HB, 'hook block sheave pin', .045, .9, hb(0, 0, 0), cgl, (90, 0, 0), 12)
for z in (-.33, .33):
    B(HB, 'hook block cheek plate', (1.25, 1.7, .07), hb(0, -.3, z), cy, bevel=.05, seg=3)
    for sx in (-1, 1):
        for sy in (-.0, -.6): C(HB, 'hook block plate bolt', .03, .03, hb(sx * .5, sy - .1, z * 1.13), cb, (90, 0, 0), 6)
    C(HB, 'hook block pin cap', .1, .04, hb(0, 0, z * 1.25), cg, (90, 0, 0), 16)
C(HB, 'hook block weight body', .4, .7, hb(0, -1.35, 0), cy, seg=36)
for yy in (-1.12, -1.58): TO(HB, 'hook block weight band', .405, .03, hb(0, yy, 0), cb, (90, 0, 0), 36, 6)
B(HB, 'hook block white band', (.7, .1, .01), hb(0, -1.35, .405), cw, bevel=.002, seg=1)
k.stext('hook block capacity lettering', 'SWL 250 t', .12, L(HB, hb(0, -1.35, .41)), 0, cb, .004, HB)
C(HB, 'hook block top yoke', .22, .22, hb(0, -.95, 0), cb, seg=24)
C(HB, 'hook swivel bearing', .27, .13, hb(0, -1.8, 0), cgl, seg=32); TO(HB, 'hook swivel race', .27, .02, hb(0, -1.8, 0), cb, (90, 0, 0), 32, 6)
C(HB, 'hook shank nut', .21, .16, hb(0, -1.95, 0), cb, seg=6); C(HB, 'hook shank', .095, .4, hb(0, -2.2, 0), cb, seg=18)
k.curve_tube('hook forged body', [L(HB, hb(0, -2.1, 0)), L(HB, hb(0, -2.65, 0)), L(HB, hb(.12, -3.05, 0)), L(HB, hb(.42, -3.2, 0)), L(HB, hb(.72, -3.05, 0)), L(HB, hb(.83, -2.7, 0)), L(HB, hb(.74, -2.42, 0))], [.095, .095, .1, .105, .09, .07, .04], cb, 7, HB)
SP(HB, 'hook point', 1, hb(.74, -2.4, 0), cgl, (.035, .05, .035), 12, 8)
C(HB, 'hook latch pin', .018, .14, hb(.07, -2.6, 0), cgl, (90, 0, 0), 12)
k.stube('hook safety latch', L(HB, hb(.07, -2.6, 0)), L(HB, hb(.66, -2.5, 0)), .022, red, 8, None, HB)
k.stube('hook latch spring', L(HB, hb(.1, -2.7, .06)), L(HB, hb(.2, -2.58, .03)), .008, cgl, 6, None, HB)
B(HB, 'hook latch tip', (.06, .05, .05), hb(.67, -2.5, 0), red, bevel=.01)

# ---- Control station on the ground (x=-9.0, z=6.5) with the Control lever ----
CXs, CZs = -9.0, 6.5; PY = .24
B(Crane, 'station base plate', (1.5, .04, 1.1), (CXs, .02, CZs), cwt, bevel=.01, seg=1)
for sx in (-1, 1):
    for sz in (-1, 1): C(Crane, 'station anchor bolt', .025, .03, (CXs + sx * .68, .055, CZs + sz * .48), cb, seg=6)
B(Crane, 'station gearbox', (.34, .3, .26), (CXs, .19, CZs - .1), cy, bevel=.03, seg=2)
B(Crane, 'station valve block', (.3, .22, .2), (CXs + .38, .15, CZs - .1), cb, bevel=.02)
for i in range(3): C(Crane, 'station hydraulic hose', .02, .3, (CXs + .26 + i * .1, .33, CZs - .1), rub, seg=8)
for sx in (-.085, .085):
    pl = Acc(Crane)
    for i in range(16):
        a0 = math.radians(-42 + i * 5.6); a1 = math.radians(-42 + (i + 1) * 5.6); R = .52
        pl.cyl((CXs + sx, PY + math.cos(a0) * R, CZs + math.sin(a0) * R), (CXs + sx, PY + math.cos(a1) * R, CZs + math.sin(a1) * R), .014, seg=6)
    pl.make('station quadrant arc', cgl)
    B(Crane, 'station quadrant web', (.012, .2, .5), (CXs + sx, PY + .06, CZs + .0), cg, bevel=.002, seg=1)
for i in range(7):
    a = math.radians(-36 + i * 12); C(Crane, 'station quadrant notch pin', .012, .17, (CXs, PY + math.cos(a) * .52, CZs + math.sin(a) * .52), cb, (0, 0, 90), 8)
C(Crane, 'station lever axle', .02, .5, (CXs, PY, CZs), cgl, (0, 0, 90), 12)
for sx in (-.26, .26): C(Crane, 'station axle cap', .03, .03, (CXs + sx, PY, CZs), cb, (0, 0, 90), 10)
Lever = G('Control lever', (CXs, PY, CZs), Crane)
lv = lambda y, z=0: (CXs, PY + y, CZs + z)
C(Lever, 'lever base boss', .04, .1, lv(0), cb, (0, 0, 90), 16)
C(Lever, 'lever shaft', .016, .66, lv(.35), cgl, seg=14)
C(Lever, 'lever grip handle', .024, .135, lv(.7425), rub, seg=18, r2=.028)
SP(Lever, 'lever grip dome', 1, lv(.805), rub, (.027, .01, .027), 14, 8)
B(Lever, 'lever latch trigger', (.014, .08, .02), lv(.72, .03), red, bevel=.004)
C(Lever, 'lever shaft collar', .028, .03, lv(.66), cb, seg=14)
C(Crane, 'station cabinet post', .03, .9, (CXs + 1.0, .45, CZs - .2), cb, seg=10)
B(Crane, 'station cabinet', (.38, .45, .22), (CXs + 1.0, .95, CZs - .2), cy, bevel=.02)
C(Crane, 'station emergency stop', .035, .035, (CXs + 1.0, 1.07, CZs - .085), red, (90, 0, 0), 16); C(Crane, 'station emergency base', .05, .015, (CXs + 1.0, 1.07, CZs - .09), cy, (90, 0, 0), 16)
for i, m in enumerate((k.mat('station led green', '#3dff6b', .3, emit='#3dff6b', emit_strength=3), redl, lamp)): C(Crane, 'station indicator lamp', .013, .012, (CXs + .91 + i * .09, .9, CZs - .085), m, (90, 0, 0), 10)
k.curve_tube('station control cable', [L(Crane, (CXs + 1.0, .75, CZs - .2)), L(Crane, (CXs + 1.0, .04, CZs - .5)), L(Crane, (CXs + 3.0, .04, CZs - 1.2)), L(Crane, (-5.5, .04, 5.0)), L(Crane, (-3.6, .04, 4.4)), L(Crane, (-3.5, .6, 3.85))], [.02] * 6, rub, 4, Crane)

# ================= WINCH (12 m to the +x side) =================
WXo = 12.0
Winch = G('Winch', (WXo, 0, 0))
w = lambda x, y, z: (WXo + x, y, z)
AY = 1.0   # axle height
B(Winch, 'ground winch slab', (2.1, .05, 1.8), w(0, .025, .1), slab, bevel=.01, seg=1)
for z in (-.55, .55): B(Winch, 'winch floor beam', (1.7, .13, .15), w(0, .115, z), wf, bevel=.012)
for x in (-.7, .7): B(Winch, 'winch cross beam', (.15, .13, 1.25), w(x, .115, 0), wf, bevel=.012)
for sx in (-1, 1):
    for sz in (-1, 1):
        B(Winch, 'winch anchor plate', (.24, .025, .24), w(sx * .72, .19, sz * .55), wst, bevel=.004, seg=1)
        for j in range(4): C(Winch, 'winch anchor bolt', .017, .03, w(sx * .72 + (j % 2 - .5) * .15, .21, sz * .55 + (j // 2 - .5) * .15), cb, seg=6)
for sx in (-1, 1):
    X = sx * .43
    for sz in (-1, 1):
        k.sbar('winch frame leg', L(Winch, w(X, .18, sz * .52)), L(Winch, w(X, AY + .05, sz * .08)), (.055, .12), wf, .008, Winch)
    B(Winch, 'winch frame tie bar', (.055, .09, .96), w(X, .38, 0), wf, bevel=.008)
    B(Winch, 'winch pillow block', (.12, .24, .26), w(X * 1.0, AY, 0), wst, bevel=.02)
    C(Winch, 'winch bearing collar', .08, .04, w(X + sx * .08, AY, 0), wst, (0, 0, 90), 20)
    for j in range(4): C(Winch, 'winch pillow bolt', .014, .018, w(X + sx * .066, AY + (j % 2 * 2 - 1) * .09, (j // 2 * 2 - 1) * .1), cb, (0, 0, 90), 6)
    C(Winch, 'winch grease nipple', .008, .03, w(X, AY + .15, 0), cgl, seg=8)
for z in (-.5, .5): B(Winch, 'winch cross brace', (.86, .07, .07), w(0, .3, z), wf, bevel=.008)
B(Winch, 'winch top spreader', (.86, .08, .1), w(0, AY + .27, 0), wf, bevel=.01)
for sz in (-1, 1): k.stube('winch diagonal rod', L(Winch, w(-.43, .22, sz * .5)), L(Winch, w(.43, .5, sz * .5)), .014, wst, 8, None, Winch)
# fairlead
for sx in (-.07, .07): C(Winch, 'winch fairlead roller', .035, .24, w(-.2 + sx, .24, 1.0), wst, seg=14)
B(Winch, 'winch fairlead base', (.3, .04, .22), w(-.2, .05, 1.0), wf, bevel=.006); B(Winch, 'winch fairlead cap', (.3, .03, .2), w(-.2, .38, 1.0), wf, bevel=.006)
# rope tail with thimble and hook
k.curve_tube('winch rope tail', [L(Winch, w(-.2, AY - .38, 0)), L(Winch, w(-.2, .55, .25)), L(Winch, w(-.2, .15, .7)), L(Winch, w(-.2, .06, 1.0)), L(Winch, w(-.2, .03, 1.8)), L(Winch, w(-.15, .03, 2.6))], [.021] * 6, wrope, 5, Winch)
TO(Winch, 'winch rope thimble', .035, .008, w(-.15, .035, 2.66), wst, (90, 0, 0), 20, 6)
k.curve_tube('winch rope hook', [L(Winch, w(-.15, .035, 2.7)), L(Winch, w(-.15, .035, 2.78)), L(Winch, w(-.1, .03, 2.86)), L(Winch, w(-.05, .03, 2.8))], [.012, .014, .014, .008], cb, 6, Winch)
# drum (spins about x)
Drum = G('Winch drum', (WXo, AY, 0), Winch)
dm = lambda x, y=0, z=0: (WXo + x, AY + y, z)
C(Drum, 'winch drum core', .26, .5, dm(0), wst, (0, 0, 90), 40)
C(Drum, 'winch axle', .04, 1.3, dm(.06), wst, (0, 0, 90), 16)
for sx in (-1, 1):
    C(Drum, 'winch drum flange', .5, .035, dm(sx * .265), wst, (0, 0, 90), 48)
    TO(Drum, 'winch flange rim', .5, .014, dm(sx * .265), wf, (0, 90, 0), 48, 6)
    for i in range(8):
        a = i / 8 * math.tau; C(Drum, 'winch flange hole plug', .055, .004, dm(sx * (.265 + .02), math.cos(a) * .38, math.sin(a) * .38), cb, (0, 0, 90), 14)
    C(Drum, 'winch flange hub', .1, .05, dm(sx * .3), cgl, (0, 0, 90), 20)
wr = Acc(Drum)
for layer in range(3):
    for t in range(12 if layer < 2 else 6):
        wr.ring(dm(-.22 + t * .04 + (.0 if layer < 2 else .1), 0, 0), (1, 0, 0), .26 + .02 + layer * .04, .02, 40, 6)
wr.make('winch wound rope', wrope)
# ratchet wheel on the -x end of the drum
C(Drum, 'winch ratchet wheel', .16, .03, dm(-.35), wst, (0, 0, 90), 36)
rt = Acc(Drum)
for i in range(18):
    a = i / 18 * math.tau; rt.box(dm(-.35, math.cos(a) * .17, math.sin(a) * .17), (.03, .045, .04), (math.degrees(a) - 55, 0, 0))
rt.make('winch ratchet tooth', wst)
C(Drum, 'winch axle nut', .05, .04, dm(-.5), cb, (0, 0, 90), 6)
# pawl: pivot on its pin above the ratchet
PXp, PYp, PZp = WXo - .35, AY + .31, .2
Pawl = G('Ratchet pawl', (PXp, PYp, PZp), Winch)
C(Pawl, 'pawl pivot pin', .016, .09, (PXp, PYp, PZp), cb, (0, 0, 90), 12)
k.sbar('pawl arm', L(Pawl, (PXp, PYp, PZp)), L(Pawl, (PXp, AY + .175, .02)), (.03, .045), wf, .004, Pawl)
B(Pawl, 'pawl tip', (.032, .05, .04), (PXp, AY + .17, .015), wst, (-35, 0, 0), bevel=.004, seg=1)
B(Pawl, 'pawl counter tail', (.03, .04, .09), (PXp, PYp + .02, PZp + .07), wf, bevel=.006)
k.stube('pawl spring', L(Pawl, (PXp, PYp + .05, PZp + .12)), L(Pawl, (PXp, PYp + .2, PZp + .12)), .007, cgl, 6, None, Pawl)
B(Winch, 'pawl bracket', (.035, .22, .06), w(-.35, AY + .22, .25), wf, bevel=.006)
# crank at the +x axle end
CRX = WXo + .56
Crank = G('Winch crank', (CRX, AY, 0), Winch)
cr = lambda x=0, y=0, z=0: (CRX + x, AY + y, z)
C(Crank, 'crank hub', .075, .09, cr(0), wst, (0, 0, 90), 24)
B(Crank, 'crank arm', (.04, .075, .47), cr(0, 0, .17), wf, bevel=.012)
C(Crank, 'crank hub key bolt', .018, .03, cr(.06), cb, (0, 0, 90), 6)
C(Crank, 'crank handle pin', .014, .3, cr(.145, 0, .4), wst, (0, 0, 90), 12)
C(Crank, 'crank handle grip', .024, .26, cr(.145, 0, .4), wwood, (0, 0, 90), 20)
for dx in (-.115, .115): C(Crank, 'crank handle end cap', .03, .012, cr(.145 + dx, 0, .4), wst, (0, 0, 90), 16)
B(Crank, 'crank arm counterweight', (.04, .09, .07), cr(0, 0, -.06), wf, bevel=.012)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/crane-winch.glb'))
P = os.environ['PREVIEW_DIR']
k.preview(P, size=(420, 560), target=(-11, 0, 29), dist=95, views=[(0, -1, .05), (.9, -.6, .15)], prefix='a')
k.preview(P, size=(420, 560), target=(-2, -1, 5), dist=26, views=[(.3, -1, .35), (-.9, -.7, .5)], prefix='b')
k.preview(P, size=(420, 560), target=(12, 0, 1.0), dist=4.6, views=[(.35, -1, .25), (1, -.4, .3)], prefix='c')
