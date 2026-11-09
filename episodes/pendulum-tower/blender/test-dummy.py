# Crash-test dummy (Hybrid III style), yellow and black, 1.75 m tall, JOINTED: every joint is a named group with its pivot at the joint, so the scene can pose and fling it.
# Nodes: Pelvis (root, pivot at the hip y=0.92) > Torso > Neck > Head ; Torso > Arm L > Forearm L, Arm R > Forearm R ; Pelvis > Thigh L > Shin L, Thigh R > Shin R. L = the dummy's own left = +x in the scene (it faces +z).
# Exported pose: standing, arms hanging. Real sizes: height 1.75 m, shoulder 1.38 m, elbow 1.08 m, hip 0.92 m, knee 0.50 m, ankle 0.10 m, seated hip height = seat 0.46 + 0.075.
import sys, os, math
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector, Euler
k.reset('test-dummy')

# ---- local helpers: write every part with WORLD scene numbers, the helper turns them into the group's local frame ----
ORIG = {}
def G(name, world, parent=None):
    po = ORIG[parent.name] if parent else (0, 0, 0)
    g = k.sgroup(name, (world[0] - po[0], world[1] - po[1], world[2] - po[2]), parent); ORIG[g.name] = world; return g
def L(g, p):
    o = ORIG[g.name] if g else (0, 0, 0)
    return (p[0] - o[0], p[1] - o[1], p[2] - o[2])
def B(g, name, size, loc, m, rot=(0, 0, 0), bevel=.004, seg=2): return k.sbox(name, size, L(g, loc), rot, m, bevel, seg, g)
def C(g, name, r, h, loc, m, rot=(0, 0, 0), seg=24, r2=None): return k.scyl(name, r, h, L(g, loc), rot, m, seg, r2, 0, g)
def SP(g, name, r, loc, m, scale=(1, 1, 1), seg=24, rings=14): return k.ssphere(name, r, L(g, loc), scale, m, seg, rings, g)
def TO(g, name, R, r, loc, m, rot=(0, 0, 0), major=36, minor=8): return k.storus(name, R, r, L(g, loc), rot, m, major, minor, g)
def SB(g, name, a, b, size, m, bevel=.002): return k.sbar(name, L(g, a), L(g, b), size, m, bevel, g)

def pie(g, name, r, a0, a1, t, loc, yaw, m):
    """A flat wedge of a disc (scene-local x-y plane, normal +z), turned about the vertical axis: the black quarters of a target."""
    n = max(2, int(abs(a1 - a0) / 12)); Rm = Euler((0, math.radians(yaw), 0)).to_matrix(); bm = bmesh.new()
    V = lambda x, y, z: bm.verts.new(Vector(k.S(tuple(Rm @ Vector((x, y, z))))))
    c0, c1 = V(0, 0, 0), V(0, 0, t); b = []; tp = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n); b.append(V(r * math.cos(a), r * math.sin(a), 0)); tp.append(V(r * math.cos(a), r * math.sin(a), t))
    for i in range(n):
        bm.faces.new((c0, b[i + 1], b[i])); bm.faces.new((c1, tp[i], tp[i + 1])); bm.faces.new((b[i], b[i + 1], tp[i + 1], tp[i]))
    bm.faces.new((c0, b[0], tp[0], c1)); bm.faces.new((c0, c1, tp[n], b[n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(m); o.location = k.S(L(g, loc)); o.parent = g
    for p in me.polygons: p.use_smooth = False
    return o

NORM = {'z+': ((0, 0, 1), 0), 'z-': ((0, 0, -1), 180), 'x+': ((1, 0, 0), 90), 'x-': ((-1, 0, 0), -90)}
def target(g, name, center, normal, r, t=.008):
    """Quartered black-and-yellow crash-test target disc stuck on a surface (centre = point on the surface)."""
    (nx, ny, nz), yaw = NORM[normal]
    c = (center[0] + nx * t / 2, center[1], center[2] + nz * t / 2)
    rot = (90, 0, 0) if normal[0] == 'z' else (0, 0, 90)
    C(g, name + ' yellow', r, t, c, yel, rot, 40)
    pie(g, name + ' black quarter', r, 0, 90, t + .003, center, yaw, blk); pie(g, name + ' black quarter', r, 180, 270, t + .003, center, yaw, blk)
    TO(g, name + ' rim', r, .0035, (c[0] + nx * t * .3, c[1], c[2] + nz * t * .3), blk, (0, 90, 0) if normal[0] == 'x' else (0, 0, 0), 40, 6)

def bolts(g, name, center, axis, R, n, r, h, m, phase=0):
    """A ring of hex bolt heads around a point, in the plane perpendicular to axis ('x','y','z')."""
    for i in range(n):
        a = phase + i / n * math.tau; ca, sa = math.cos(a) * R, math.sin(a) * R
        if axis == 'x': C(g, name, r, h, (center[0], center[1] + ca, center[2] + sa), m, (0, 0, 90), 6)
        elif axis == 'z': C(g, name, r, h, (center[0] + ca, center[1] + sa, center[2]), m, (90, 0, 0), 6)
        else: C(g, name, r, h, (center[0] + ca, center[1], center[2] + sa), m, (0, 0, 0), 6)

def eband(g, name, cx, y, cz, rx, rz, w, t, m, n=24, a0=0, a1=360):
    """A band lying on an ellipse (scene x-z plane) as n short boxes: harness belts, seams, ribs. Angle from +z toward +x."""
    pts = [(cx + rx * math.sin(math.radians(a0 + (a1 - a0) * i / n)), cz + rz * math.cos(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    for i in range(n):
        (x0, z0), (x1, z1) = pts[i], pts[i + 1]; dx, dz = x1 - x0, z1 - z0; ln = math.hypot(dx, dz)
        B(g, name, (ln * 1.06, w, t), ((x0 + x1) / 2, y, (z0 + z1) / 2), m, (0, math.degrees(math.atan2(-dz, dx)), 0), bevel=min(.0015, t / 3), seg=1)

# ---- materials (after the reset) ----
yel = k.mat('dummy vinyl yellow', '#ffc400', .42); blk = k.mat('dummy rubber black', '#17171b', .72); stl = k.mat('dummy steel', '#c2c6ce', .32, .9)
wht = k.mat('dummy eye white', '#f6f3ea', .35); red = k.mat('harness webbing red', '#d8321f', .75); dark = k.mat('dummy dark slot', '#050506', .9)
HX, SX = .095, .245   # hip and shoulder offsets

# ---- the joint tree ----
Pelvis = G('Pelvis', (0, .92, 0)); Torso = G('Torso', (0, .98, 0), Pelvis); Neck = G('Neck', (0, 1.47, 0), Torso); Head = G('Head', (0, 1.56, 0), Neck)
side = {1: 'L', -1: 'R'}
Arm = {s: G('Arm ' + side[s], (s * SX, 1.38, 0), Torso) for s in (1, -1)}
Fore = {s: G('Forearm ' + side[s], (s * SX, 1.08, 0), Arm[s]) for s in (1, -1)}
Thigh = {s: G('Thigh ' + side[s], (s * HX, .92, 0), Pelvis) for s in (1, -1)}
Shin = {s: G('Shin ' + side[s], (s * HX, .50, 0), Thigh[s]) for s in (1, -1)}

# ---- Pelvis ----
B(Pelvis, 'pelvis shell', (.31, .13, .20), (0, .91, 0), yel, bevel=.035, seg=4)
SP(Pelvis, 'pelvis rear pad', 1, (0, .90, -.045), yel, (.15, .07, .085))
B(Pelvis, 'pelvis flesh block', (.12, .05, .12), (0, .845, .02), blk, bevel=.015, seg=3)
eband(Pelvis, 'lap belt', 0, .99, 0, .162, .112, .05, .012, red, 28)
B(Pelvis, 'lap belt buckle', (.075, .055, .016), (0, .99, .122), stl, bevel=.004); B(Pelvis, 'lap belt buckle slot', (.04, .016, .006), (0, .99, .131), dark, bevel=.001, seg=1)
B(Pelvis, 'lap belt tongue', (.03, .05, .006), (.065, .99, .121), stl, bevel=.002)
for s in (1, -1):
    C(Pelvis, 'hip joint cylinder', .062, .17, (s * HX, .92, 0), blk, (0, 0, 90), 32)
    C(Pelvis, 'hip joint pin', .018, .21, (s * HX, .92, 0), stl, (0, 0, 90), 16)
    C(Pelvis, 'hip pin cap', .03, .012, (s * (HX + .105), .92, 0), stl, (0, 0, 90), 6)
    bolts(Pelvis, 'hip cap bolt', (s * (HX + .092), .92, 0), 'x', .045, 6, .007, .008, stl)
    B(Pelvis, 'iliac wing plate', (.012, .09, .14), (s * .158, .955, 0), stl, bevel=.003)
    bolts(Pelvis, 'iliac plate bolt', (s * .165, .955, 0), 'x', .03, 4, .006, .007, stl, .7)

# ---- Torso ----
for i in range(5):  # lumbar rubber column with steel plates
    C(Torso, 'lumbar rubber disc', .088, .018, (0, .99 + i * .022, 0), blk, seg=32)
    C(Torso, 'lumbar steel plate', .092, .004, (0, 1.0 + i * .022, 0), stl, seg=32)
SP(Torso, 'ribcage shell', 1, (0, 1.265, 0), yel, (.175, .205, .115), 40, 24)
SP(Torso, 'upper chest cap', 1, (0, 1.38, -.01), yel, (.17, .09, .105), 36, 16)
B(Torso, 'shoulder yoke', (.37, .075, .15), (0, 1.405, 0), yel, bevel=.03, seg=4)
for s in (1, -1):
    B(Torso, 'shoulder mount block', (.055, .125, .15), (s * .185, 1.385, 0), yel, bevel=.014, seg=3)
    C(Torso, 'shoulder bolted plate', .068, .012, (s * .217, 1.38, 0), stl, (0, 0, 90), 32)
    bolts(Torso, 'shoulder plate bolt', (s * .226, 1.38, 0), 'x', .052, 6, .0075, .009, stl)
    SB(Torso, 'collar bone tube', (s * .03, 1.425, .075), (s * .17, 1.425, .06), (.028, .028), yel, .008)
    SP(Torso, 'trapezius pad', 1, (s * .11, 1.452, -.01), yel, (.075, .03, .08))
target(Torso, 'chest target', (0, 1.30, .1135), 'z+', .078)
target(Torso, 'back target', (0, 1.30, -.1135), 'z-', .07)
for yy in [1.13 + i * .045 for i in range(7)]:
    t = (yy - 1.265) / .205; f = math.sqrt(max(.05, 1 - t * t))
    eband(Torso, 'rib seam', 0, yy, 0, .175 * f + .002, .115 * f + .002, .007, .005, blk, 9, -78, 78)
    eband(Torso, 'rib seam back', 0, yy, 0, .175 * f + .002, .115 * f + .002, .007, .005, blk, 9, 102, 258)
def front_z(x, y):
    t = (y - 1.265) / .205; u = x / .175
    return .115 * math.sqrt(max(0.02, 1 - t * t - u * u)) + .005
for s, name in ((1, 'harness strap L'), (-1, 'harness strap R')):   # shoulder strap from this shoulder to the opposite lap, crossing on the chest
    P = []
    for i in range(11):
        u = i / 10; x = s * (.095 - .19 * u); y = 1.405 - .395 * u
        P.append((x, y, front_z(x, y) if y > 1.08 else .112))
    for a, b in zip(P[:-1], P[1:]): SB(Torso, name, a, b, (.045, .008), red, .0015)
    C(Torso, 'strap shoulder bolt', .012, .012, (s * .095, 1.41, front_z(s * .095, 1.41) + .005), stl, (90, 0, 0), 6)
B(Torso, 'harness buckle plate', (.085, .095, .016), (0, 1.205, .1215), stl, bevel=.005); B(Torso, 'harness buckle window', (.05, .05, .006), (0, 1.205, .13), dark, bevel=.001, seg=1)
B(Torso, 'harness release button', (.03, .022, .012), (0, 1.17, .132), red, bevel=.004)
C(Torso, 'harness buckle rivet', .007, .008, (-.032, 1.245, .13), stl, (90, 0, 0), 8); C(Torso, 'harness buckle rivet', .007, .008, (.032, 1.245, .13), stl, (90, 0, 0), 8)
B(Torso, 'sternum plate', (.06, .14, .01), (0, 1.38, .1125), stl, bevel=.004)
bolts(Torso, 'sternum plate bolt', (0, 1.38, .118), 'z', .028, 4, .006, .006, stl, .4)

# ---- Neck: segmented rubber ----
C(Neck, 'neck base plate', .056, .008, (0, 1.474, 0), stl, seg=32)
bolts(Neck, 'neck base bolt', (0, 1.481, 0), 'y', .042, 6, .006, .007, stl)
for i in range(4):
    C(Neck, 'neck rubber segment', .048, .017, (0, 1.488 + i * .021, 0), blk, seg=32)
    C(Neck, 'neck steel ring', .052, .004, (0, 1.499 + i * .021, 0), stl, seg=32)
C(Neck, 'neck top plate', .056, .008, (0, 1.575, 0), stl, seg=32)
bolts(Neck, 'neck top bolt', (0, 1.58, 0), 'y', .042, 6, .006, .007, stl, .5)

# ---- Head ----
SP(Head, 'skull shell', 1, (0, 1.655, 0), yel, (.083, .098, .092), 40, 26)
SP(Head, 'jaw block', 1, (0, 1.595, .018), yel, (.062, .042, .07), 28, 14)
SP(Head, 'cheek pad', 1, (.045, 1.625, .055), yel, (.03, .03, .03), 16, 8); SP(Head, 'cheek pad', 1, (-.045, 1.625, .055), yel, (.03, .03, .03), 16, 8)
B(Head, 'brow ridge', (.125, .02, .035), (0, 1.692, .083), yel, bevel=.009, seg=3)
SP(Head, 'nose', 1, (0, 1.652, .094), yel, (.014, .022, .02), 16, 10)
for s in (1, -1):
    SP(Head, 'eye white', 1, (s * .034, 1.672, .084), wht, (.0165, .0165, .008), 18, 10)
    SP(Head, 'eye pupil', 1, (s * .034, 1.672, .0905), blk, (.0085, .0085, .004), 14, 8)
    target(Head, 'head target ' + side[s], (s * .0815, 1.662, 0), 'x+' if s > 0 else 'x-', .054)
    C(Head, 'head side bolt', .008, .01, (s * .0835, 1.662, 0), stl, (0, 0, 90), 6)
B(Head, 'mouth slot', (.06, .008, .012), (0, 1.606, .086), dark, bevel=.002, seg=1)
eband(Head, 'head split seam', 0, 1.7, 0, .0765, .0845, .005, .004, blk, 32)
eband(Head, 'head jaw seam', 0, 1.627, 0.012, .071, .08, .004, .004, blk, 32, -140, 140)
C(Head, 'head top bolt', .011, .01, (0, 1.7505, 0), stl, seg=6)
C(Head, 'head accelerometer cap', .02, .01, (0, 1.597, -.07), blk, (90, 0, 0), 20)

# ---- Arms ----
for s in (1, -1):
    x = s * SX; A = Arm[s]; F = Fore[s]
    SP(A, 'shoulder ball joint', 1, (x, 1.38, 0), blk, (.056, .056, .056), 24, 14)
    C(A, 'upper arm shell', .037, .27, (x, 1.225, 0), yel, r2=.043, seg=28)
    for yy in (1.31, 1.16): C(A, 'arm rubber band', .0445, .012, (x, yy, 0), blk, seg=28)
    C(A, 'arm joint pin boss', .02, .012, (x + s * .052, 1.33, 0), stl, (0, 0, 90), 8)
    bolts(A, 'upper arm bolt', (x, 1.115, .0), 'y', .035, 5, .006, .006, stl, .3)
    C(A, 'elbow joint cylinder', .047, .095, (x, 1.08, 0), blk, (0, 0, 90), 28)
    C(A, 'elbow joint pin', .014, .13, (x, 1.08, 0), stl, (0, 0, 90), 14)
    C(A, 'elbow pin cap', .026, .01, (x + s * .068, 1.08, 0), stl, (0, 0, 90), 6)
    C(F, 'forearm shell', .031, .245, (x, .93, 0), yel, r2=.039, seg=28)
    C(F, 'forearm rubber band', .04, .011, (x, 1.005, 0), blk, seg=28)
    C(F, 'wrist joint ring', .034, .028, (x, .797, 0), blk, seg=24)
    C(F, 'wrist cuff', .037, .008, (x, .775, 0), stl, seg=24)
    SP(F, 'hand mitt', 1, (x, .73, 0), blk, (.043, .065, .03), 24, 14)
    SP(F, 'hand mitt thumb', 1, (x - s * .036, .745, .016), blk, (.016, .035, .017), 14, 8)
    B(F, 'mitt finger seam', (.004, .05, .003), (x, .70, .029), dark, bevel=.0005, seg=1)

# ---- Legs ----
for s in (1, -1):
    x = s * HX; T = Thigh[s]; S_ = Shin[s]
    C(T, 'thigh shell', .056, .36, (x, .70, 0), yel, r2=.071, seg=32)
    for yy in (.80, .60): C(T, 'thigh rubber band', .0725 if yy > .7 else .062, .014, (x, yy, 0), blk, seg=32)
    SP(T, 'thigh hip cap', 1, (x, .885, 0), yel, (.071, .02, .071), 24, 8)
    bolts(T, 'thigh plate bolt', (x, .56, .0), 'y', .045, 6, .006, .006, stl)
    C(T, 'knee joint cylinder', .056, .125, (x, .50, 0), blk, (0, 0, 90), 32)
    C(T, 'knee joint pin', .016, .16, (x, .50, 0), stl, (0, 0, 90), 14)
    C(T, 'knee pin cap', .03, .012, (x + s * .084, .50, 0), stl, (0, 0, 90), 6)
    bolts(T, 'knee cap bolt', (x + s * .067, .50, 0), 'x', .038, 5, .006, .007, stl, .2)
    SP(T, 'knee cap', 1, (x, .50, .052), yel, (.04, .045, .02), 18, 10)
    C(S_, 'shin shell', .041, .345, (x, .30, 0), yel, r2=.052, seg=32)
    C(S_, 'shin rubber band', .0545, .012, (x, .43, 0), blk, seg=28); C(S_, 'shin rubber band', .046, .012, (x, .2, 0), blk, seg=28)
    SP(S_, 'ankle ball joint', 1, (x, .105, 0), blk, (.045, .045, .045), 20, 12)
    C(S_, 'ankle pin', .012, .12, (x, .105, 0), stl, (0, 0, 90), 12); C(S_, 'ankle pin cap', .02, .008, (x + s * .062, .105, 0), stl, (0, 0, 90), 6)
    B(S_, 'shoe sole', (.108, .032, .285), (x, .016, .05), blk, bevel=.012, seg=3)
    B(S_, 'shoe upper', (.098, .06, .225), (x, .062, .035), yel, bevel=.022, seg=4)
    SP(S_, 'shoe toe cap', 1, (x, .052, .15), yel, (.05, .034, .065), 22, 12)
    B(S_, 'shoe heel block', (.1, .026, .05), (x, .035, -.07), blk, bevel=.01, seg=2)
    B(S_, 'shoe ankle strap', (.11, .018, .08), (x, .098, .018), red, bevel=.006)
    for i in range(4): B(S_, 'shoe lace bar', (.07, .004, .008), (x, .092 + i * .0, .075 + i * .02), blk, bevel=.001, seg=1)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/test-dummy.glb'))
k.preview(os.environ['PREVIEW_DIR'], size=(360, 640), target=(0, 0, .88), dist=3.4, views=[(0, -1, .15), (.8, -.8, .2), (1, 0, .15), (-.3, 1, .2)])
