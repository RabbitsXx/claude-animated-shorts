# Top-floor office furnishings for the pendulum tower (night cutaway): desk with drawers, monitor, keyboard, pen pot and papers; the coffee mug (with a Coffee disc), an office chair (seat 0.46 m),
# a full-height window frame with mullions, a curtain on a rail, a floor lamp, a plant pot, the I THINK cardboard sign on a stick and a corded hand drill.
# Origin = floor level, centre of the desk. Separate top-level nodes (each pivot is where the scene grabs or turns it):
#  Desk (floor under the middle) - Coffee mug (base centre) with mesh Coffee - Office chair (floor under the column, faces -z, seat 0.46 m) - Window frame (centre of the 1.2 x 3.2 m frame, 0.06 m deep)
#  Curtain (top centre, under the rail) - Curtain rail - Floor lamp - Plant pot - I THINK sign (the grip point on the stick) - Drill rig (the grip, 0.45 m long plus cable).
import sys, os, math, random
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector
random.seed(11)
k.reset('top-floor-set')

ORIG = {}
def G(name, world, parent=None):
    po = ORIG[parent.name] if parent else (0, 0, 0)
    g = k.sgroup(name, (world[0] - po[0], world[1] - po[1], world[2] - po[2]), parent); ORIG[g.name] = world; return g
def L(g, p):
    o = ORIG[g.name] if g else (0, 0, 0)
    return (p[0] - o[0], p[1] - o[1], p[2] - o[2])
def B(g, name, size, loc, m, rot=(0, 0, 0), bevel=.004, seg=2): return k.sbox(name, size, L(g, loc), rot, m, bevel, seg, g)
def C(g, name, r, h, loc, m, rot=(0, 0, 0), seg=24, r2=None): return k.scyl(name, r, h, L(g, loc), rot, m, seg, r2, 0, g)
def SP(g, name, r, loc, m, scale=(1, 1, 1), seg=20, rings=12): return k.ssphere(name, r, L(g, loc), scale, m, seg, rings, g)
def TO(g, name, R, r, loc, m, rot=(0, 0, 0), major=32, minor=8): return k.storus(name, R, r, L(g, loc), rot, m, major, minor, g)
def SB(g, name, a, b, size, m, bevel=.002): return k.sbar(name, L(g, a), L(g, b), size, m, bevel, g)
def TU(g, name, a, b, r, m, seg=12, r2=None):
    A, Bp = Vector(a), Vector(b)
    if abs((Bp - A).normalized().dot(Vector((0, 0, 1)))) > .98:   # a tube straight along scene z: kit.stube would have an undefined up axis, so use a z-axis cylinder
        return C(g, name, r, (Bp - A).length, tuple((A + Bp) / 2), m, (90, 0, 0), seg, r2)
    return k.stube(name, L(g, a), L(g, b), r, m, seg, r2, g)
def lathe(g, name, prof, loc, m, seg=32):
    """Surface of revolution about the vertical axis from a closed (radius, height) profile: cups, pots, lamp shades."""
    bm = bmesh.new(); vs = [bm.verts.new((r, 0, y)) for r, y in prof]; es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.tau, steps=seg, use_merge=True, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(m); o.location = k.S(L(g, loc)); o.parent = g
    for p in me.polygons: p.use_smooth = True
    return o
def rr(a, b): return random.uniform(a, b)

# ---- materials ----
oak = k.mat('desk wood top', '#c08a4a', .55); oakd = k.mat('desk wood carcass', '#8c5a2e', .6)
steel = k.mat('office steel', '#aeb3bc', .3, .9); blackp = k.mat('office black plastic', '#1d1f24', .5); blackr = k.mat('office black rubber', '#101114', .85)
screen = k.mat('monitor screen glow', '#2c7fe0', .3, emit='#2c7fe0', emit_strength=.9); bezel = k.mat('monitor bezel dark', '#15171b', .4)
keyc = k.mat('keycap grey', '#d9dde3', .5); keyd = k.mat('keycap dark', '#3a3e47', .5)
seatc = k.mat('seat cloth', '#c4302b', .9); backc = k.mat('back mesh cloth', '#262a33', .95)
paper = k.mat('paper white', '#f5f2ea', .8); pen_r = k.mat('pen red', '#e02b2b', .4); pen_b = k.mat('pen blue', '#2b5ee0', .4); pen_g = k.mat('pen green', '#2bb04a', .4)
mugw = k.mat('mug ceramic white', '#f8f6f0', .25); mugr = k.mat('mug ceramic red', '#e63a2e', .25); coffee = k.mat('coffee liquid', '#3d1f0f', .15)
winw = k.mat('window frame white', '#f4f1ea', .45); glass = k.mat('window glass', '#9fd0f0', .05, alpha=.3)
curt = k.mat('curtain cloth', '#1fa3a0', .95); curt2 = k.mat('curtain cloth dark', '#157a78', .95)
lampm = k.mat('lamp shade cloth', '#ffe9b0', .9, emit='#ffcf70', emit_strength=.4); lampb = k.mat('lamp bulb glow', '#fff4d0', .2, emit='#ffe9a0', emit_strength=3)
pot = k.mat('pot terracotta', '#c8643a', .8); soil = k.mat('pot soil', '#3a2616', 1); leafm = k.mat('plant leaf green', '#2fae4f', .55); leafd = k.mat('plant leaf dark', '#1f8a3b', .55)
card = k.mat('sign cardboard', '#b98b58', .95); cardw = k.mat('sign paper white', '#f3efe3', .9); ink = k.mat('sign marker black', '#0e0e12', .5); tape = k.mat('sign tape yellow', '#f2d24a', .5)
drill = k.mat('drill housing orange', '#ff7a1a', .45); drillg = k.mat('drill gear grey', '#4a4f5a', .5)

# ================= Desk =================
Desk = G('Desk', (0, 0, 0))
B(Desk, 'desk top', (1.6, .035, .8), (0, .7225, 0), oak, bevel=.008, seg=3)
B(Desk, 'desk edge trim', (1.6, .028, .012), (0, .7225, .406), oakd, bevel=.004)
B(Desk, 'desk side panel', (.03, .68, .76), (-.775, .355, 0), oakd, bevel=.004)
B(Desk, 'desk modesty panel', (1.2, .42, .018), (-.15, .48, -.36), oakd, bevel=.003)
B(Desk, 'desk top rail', (1.2, .06, .02), (-.15, .675, .33), oakd, bevel=.003)
B(Desk, 'drawer pedestal carcass', (.44, .68, .74), (.56, .36, 0), oakd, bevel=.004)
B(Desk, 'drawer pedestal plinth', (.44, .035, .74), (.56, .0175, 0), blackp, bevel=.003)
for i, y in enumerate((.60, .40, .20)):
    B(Desk, 'drawer front', (.40, .185, .018), (.56, y, .379), oak, bevel=.004)
    B(Desk, 'drawer handle', (.14, .014, .022), (.56, y + .045, .401), steel, bevel=.005)
    B(Desk, 'drawer handle post', (.012, .014, .02), (.5, y + .045, .392), steel, bevel=.001, seg=1); B(Desk, 'drawer handle post', (.012, .014, .02), (.62, y + .045, .392), steel, bevel=.001, seg=1)
    B(Desk, 'drawer label plate', (.07, .022, .003), (.56, y - .05, .389), paper, bevel=.0005, seg=1)
C(Desk, 'drawer lock', .009, .006, (.69, .60, .389), steel, (90, 0, 0), 16); B(Desk, 'drawer lock keyhole', (.002, .007, .002), (.69, .60, .393), blackp, bevel=.0003, seg=1)
for sx in (-.76, .76):
    for sz in (-.34, .34): C(Desk, 'desk leveller foot', .02, .02, (sx if sx < 0 else .56 + .2 * (1 if sx > 0 else -1), .01, sz), blackr, seg=12)
C(Desk, 'cable grommet', .028, .006, (-.55, .7415, -.28), blackp, seg=24); TO(Desk, 'cable grommet ring', .028, .004, (-.55, .7425, -.28), blackp, (90, 0, 0), 24, 6)
# monitor
C(Desk, 'monitor stand base', .09, .012, (-.1, .746, -.22), blackp, seg=32); B(Desk, 'monitor stand neck', (.05, .19, .03), (-.1, .84, -.27), blackp, bevel=.006)
B(Desk, 'monitor back cover', (.40, .22, .045), (-.1, 1.01, -.275), bezel, bevel=.02, seg=3)
B(Desk, 'monitor bezel', (.62, .37, .028), (-.1, 1.035, -.245), bezel, bevel=.008, seg=2)
B(Desk, 'monitor screen', (.585, .335, .004), (-.1, 1.035, -.2295), screen, bevel=.0003, seg=1)
for i in range(7): B(Desk, 'screen text line', (.12 + .04 * (i % 3), .008, .002), (-.27 + .03 * (i % 3), 1.13 - i * .03, -.2275), k.mat('screen line', '#d6ecff', .3, emit='#d6ecff', emit_strength=.8), bevel=.0003, seg=1)
C(Desk, 'monitor power led', .003, .003, (.12, .87, -.229), k.mat('led green', '#3dff6b', .3, emit='#3dff6b', emit_strength=3), (90, 0, 0), 8)
B(Desk, 'sticky note', (.07, .07, .002), (-.37, 1.19, -.229), k.mat('note yellow', '#ffe44a', .8), (0, 0, 8), bevel=.0003, seg=1)
B(Desk, 'sticky note', (.07, .07, .002), (-.37, 1.115, -.229), k.mat('note pink', '#ff7aa8', .8), (0, 0, -5), bevel=.0003, seg=1)
# keyboard and mouse
B(Desk, 'keyboard base', (.45, .018, .16), (-.1, .749, .15), blackp, bevel=.006)
for r in range(4):
    kk = B(Desk, 'keycap row', (.026, .012, .026), (-.1 - .195, .764, .09 + r * .033 + .0), keyc if r % 2 == 0 else keyd, bevel=.003); k.array(kk, 14, (.0285, 0, 0))
B(Desk, 'keyboard space bar', (.2, .012, .026), (-.1, .764, .207), keyc, bevel=.003)
B(Desk, 'mouse pad', (.22, .004, .19), (.22, .742, .15), blackr, bevel=.001, seg=1)
SP(Desk, 'mouse body', 1, (.22, .752, .16), blackp, (.032, .016, .052), 20, 10); B(Desk, 'mouse wheel', (.006, .004, .016), (.22, .768, .14), steel, bevel=.001, seg=1)
# pen pot, papers, phone, stapler
lathe(Desk, 'pen pot cup', [(0, 0), (.04, 0), (.043, .006), (.043, .1), (.039, .1), (.039, .01), (0, .01)], (.62, .74, -.27), blackp)
for i, (dx, dz, m) in enumerate([(-.015, -.01, pen_r), (.012, -.015, pen_b), (.02, .012, pen_g), (-.02, .016, pen_r), (0, 0, pen_b)]):
    TU(Desk, 'pen', (.62, .775, -.27), (.62 + dx * 2.2, .88 + i * .004, -.27 + dz * 2.2), .0045, m, 10);
    SP(Desk, 'pen cap', 1, (.62 + dx * 2.2, .885 + i * .004, -.27 + dz * 2.2), m, (.006, .006, .006), 10, 6)
for i in range(6): B(Desk, 'paper sheet', (.21, .0025, .297), (.28 + i * .004, .7425 + i * .0026, -.12 + i * .003), paper, (0, 4 + i * 5, 0), bevel=.0003, seg=1)
for i in range(5): B(Desk, 'paper text line', (.14 - i * .01, .0015, .006), (.28 + .024 + i * .004, .76, -.18 + i * .03), k.mat('paper ink', '#59606b', .8), (0, 4 + 5 * 5, 0), bevel=.0002, seg=1)
B(Desk, 'desk phone base', (.17, .05, .2), (.62, .765, .05), blackp, (0, -14, 0), bevel=.012, seg=3); B(Desk, 'desk phone handset', (.05, .035, .2), (.62, .805, .05), blackp, (0, -14, 0), bevel=.014, seg=3)
B(Desk, 'stapler body', (.15, .03, .04), (-.62, .757, -.28), steel, bevel=.01); B(Desk, 'stapler cap', (.14, .02, .035), (-.62, .78, -.28), blackp, bevel=.01)
B(Desk, 'notepad', (.14, .015, .2), (-.6, .7475, .1), k.mat('notepad yellow', '#ffe96b', .8), (0, 18, 0), bevel=.001); B(Desk, 'notepad binding', (.14, .017, .012), (-.64, .7485, .1 - .09), blackp, (0, 18, 0), bevel=.001, seg=1)

# ================= Coffee mug (separate node, 0.095 m high) =================
Mug = G('Coffee mug', (-.42, .74, .08))
lathe(Mug, 'mug body', [(0, 0), (.037, 0), (.0415, .004), (.0425, .09), (.0425, .095), (.0385, .095), (.0385, .008), (0, .008)], (-.42, .74, .08), mugw, 36)
C(Mug, 'mug band', .0435, .022, (-.42, .765, .08), mugr, seg=36)
TO(Mug, 'mug rim', .0405, .0022, (-.42, .0 + .74 + .095, .08), mugw, (90, 0, 0), 36, 6)
C(Mug, 'mug foot ring', .036, .004, (-.42, .742, .08), mugw, seg=32)
TO(Mug, 'mug handle', .0235, .0065, (-.42 + .062, .74 + .052, .08), mugw, (0, 0, 0), 28, 8)
C(Mug, 'Coffee', .0375, .004, (-.42, .74 + .082, .08), coffee, seg=36)

# ================= Office chair =================
CX, CZ = 0, .85
Chair = G('Office chair', (CX, 0, CZ))
C(Chair, 'chair hub', .05, .06, (CX, .105, CZ), blackp, seg=20)
for i in range(5):
    a = math.radians(72 * i + 15); ux, uz = math.sin(a), math.cos(a); R = .31
    SB(Chair, 'star base arm', (CX + ux * .03, .115, CZ + uz * .03), (CX + ux * R, .088, CZ + uz * R), (.05, .028), blackp, .008)
    C(Chair, 'caster stem', .009, .05, (CX + ux * R, .075, CZ + uz * R), steel, seg=10)
    B(Chair, 'caster fork', (.03, .026, .036), (CX + ux * R, .055, CZ + uz * R), blackp, (0, math.degrees(a), 0), bevel=.004, seg=1)
    for off in (-.011, .011):
        C(Chair, 'caster wheel', .027, .012, (CX + ux * R + uz * off * -1 * -1 * 1 * 0 + (-uz) * off * -1 * 0 + uz * off, .027, CZ + uz * R - ux * off), blackr, (0, 180 + math.degrees(a), 90), 18)
    C(Chair, 'caster axle', .004, .034, (CX + ux * R, .027, CZ + uz * R), steel, (0, 180 + math.degrees(a), 90), 8)
C(Chair, 'gas lift column', .03, .26, (CX, .26, CZ), steel, seg=20); C(Chair, 'gas lift cover', .044, .17, (CX, .22, CZ), blackp, seg=24, r2=.036)
C(Chair, 'gas lift piston', .022, .07, (CX, .36, CZ), steel, seg=16)
B(Chair, 'seat mechanism', (.30, .045, .27), (CX, .392, CZ), blackp, bevel=.012, seg=3)
SB(Chair, 'height lever', (CX + .15, .38, CZ + .0), (CX + .27, .365, CZ - .04), (.014, .014), steel, .003); SP(Chair, 'height lever knob', 1, (CX + .275, .365, CZ - .042), blackp, (.014, .014, .014), 12, 8)
B(Chair, 'seat pan', (.46, .018, .44), (CX, .408, CZ), blackp, bevel=.006)
B(Chair, 'seat cushion', (.5, .06, .5), (CX, .43, CZ - .0), seatc, bevel=.026, seg=4)
B(Chair, 'seat piping', (.47, .004, .004), (CX, .4595, CZ - .235), k.mat('seat piping dark', '#8e1f1b', .9), bevel=.001, seg=1); B(Chair, 'seat piping', (.47, .004, .004), (CX, .4595, CZ + .235), k.mat('seat piping dark', '#8e1f1b', .9), bevel=.001, seg=1)
B(Chair, 'seat piping', (.004, .004, .47), (CX - .235, .4595, CZ), k.mat('seat piping dark', '#8e1f1b', .9), bevel=.001, seg=1); B(Chair, 'seat piping', (.004, .004, .47), (CX + .235, .4595, CZ), k.mat('seat piping dark', '#8e1f1b', .9), bevel=.001, seg=1)
SB(Chair, 'back post', (CX, .39, CZ + .18), (CX, .66, CZ + .27), (.06, .035), blackp, .008)
B(Chair, 'backrest frame', (.48, .52, .04), (CX, .84, CZ + .305), blackp, (8, 0, 0), bevel=.014, seg=3)
B(Chair, 'backrest cushion', (.44, .46, .075), (CX, .84, CZ + .27), backc, (8, 0, 0), bevel=.03, seg=4)
B(Chair, 'lumbar support pad', (.32, .12, .045), (CX, .7, CZ + .233), seatc, (8, 0, 0), bevel=.02, seg=3)
for i in range(6): B(Chair, 'backrest stitch rib', (.4, .004, .004), (CX, .66 + i * .075, CZ + .233 + (i * .075) * .14 - .0 + .0), k.mat('seat piping dark', '#8e1f1b', .9), (8, 0, 0), bevel=.0008, seg=1)
for s in (-1, 1):
    B(Chair, 'armrest post', (.032, .22, .045), (CX + s * .265, .53, CZ + .02), blackp, bevel=.006)
    B(Chair, 'armrest pad', (.075, .035, .27), (CX + s * .265, .655, CZ - .03), blackr, bevel=.014, seg=3)
    B(Chair, 'armrest bracket', (.022, .02, .12), (CX + s * .24, .43, CZ + .03), blackp, bevel=.003)
    C(Chair, 'armrest bolt', .008, .008, (CX + s * .265, .525, CZ + .045), steel, (90, 0, 0), 6)

# ================= Window frame (centre of the frame) =================
WX, WY, WZ = 2.6, 1.6, -1.55
Win = G('Window frame', (WX, WY, WZ))
for s in (-1, 1): B(Win, 'frame stile', (.07, 3.2, .06), (WX + s * .565, WY, WZ), winw, bevel=.006)
for s in (-1, 1): B(Win, 'frame rail', (1.2, .07, .06), (WX, WY + s * 1.565, WZ), winw, bevel=.006)
B(Win, 'frame mullion', (.045, 3.06, .05), (WX, WY, WZ), winw, bevel=.004)
tr = (-.765, 0, .765)
for y in tr: B(Win, 'frame transom', (1.06, .045, .05), (WX, WY + y, WZ), winw, bevel=.004)
edges = [-1.53, -.765, 0, .765, 1.53]
for i in range(4):
    for sx in (-1, 1):
        B(Win, 'window glass pane', (.4925, edges[i + 1] - edges[i] - .02, .008), (WX + sx * .2688, WY + (edges[i] + edges[i + 1]) / 2, WZ), glass, bevel=.0005, seg=1)
B(Win, 'window sill', (1.3, .035, .13), (WX, WY - 1.6 - .0175, WZ + .035), winw, bevel=.008)
for s in (-1, 1):
    for y in (-1.2, 0, 1.2):
        C(Win, 'window hinge barrel', .013, .12, (WX + s * .583, WY + y, WZ + .025), steel, seg=10)
        B(Win, 'window hinge leaf', (.022, .1, .004), (WX + s * .575, WY + y, WZ + .032), steel, bevel=.001, seg=1)
for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
    B(Win, 'frame corner bracket', (.1, .1, .008), (WX + sx * .52, WY + sy * 1.52, WZ + .033), steel, bevel=.002)
    for j in range(4): C(Win, 'frame corner screw', .0045, .004, (WX + sx * .52 + (j % 2 - .5) * .06, WY + sy * 1.52 + (j // 2 - .5) * .06, WZ + .038), steel, (90, 0, 0), 6)
C(Win, 'window handle rose', .02, .01, (WX - .04, WY, WZ + .035), steel, (90, 0, 0), 20); B(Win, 'window handle lever', (.09, .014, .014), (WX - .0, WY, WZ + .048), steel, bevel=.004)
B(Win, 'window latch plate', (.03, .08, .006), (WX + .035, WY, WZ + .033), steel, bevel=.002)

# ================= Curtain rail and Curtain =================
RX, RY, RZ = 2.6, 3.1, -1.46
Rail = G('Curtain rail', (RX, RY, RZ))
TU(Rail, 'rail pole', (RX - 1.0, RY, RZ), (RX + 1.0, RY, RZ), .012, steel, 16)
for s in (-1, 1): SP(Rail, 'rail finial', 1, (RX + s * 1.04, RY, RZ), steel, (.026, .026, .026), 16, 10); C(Rail, 'rail finial neck', .01, .03, (RX + s * 1.0, RY, RZ), steel, (0, 0, 90), 10)
for x in (-.9, 0, .9):
    B(Rail, 'rail wall bracket', (.025, .025, .1), (RX + x, RY, RZ - .05), steel, bevel=.004)
    B(Rail, 'rail wall plate', (.05, .07, .01), (RX + x, RY, RZ - .105), steel, bevel=.002)
Curtain = G('Curtain', (RX, RY - .02, RZ + .0))
for i in range(15):
    x = RX - .91 + i * .13; zz = RZ + (.03 if i % 2 else -.03)
    B(Curtain, 'curtain fold', (.14, 2.93, .05), (x, RY - .02 - 1.465, zz), curt if i % 2 else curt2, (0, 0, rr(-.4, .4)), bevel=.022, seg=3)
    TO(Curtain, 'curtain ring', .02, .003, (x, RY - .006, RZ), steel, (90, 0, 0), 20, 6)
    B(Curtain, 'curtain hook tab', (.012, .035, .004), (x, RY - .04, RZ), steel, bevel=.0005, seg=1)
B(Curtain, 'curtain heading band', (1.98, .09, .07), (RX, RY - .065, RZ), curt2, bevel=.012, seg=2)
B(Curtain, 'curtain hem weight', (1.98, .05, .07), (RX, RY - 2.96, RZ), curt2, bevel=.012, seg=2)
B(Curtain, 'curtain hem stitch', (1.9, .004, .003), (RX, RY - 2.9, RZ + .06), k.mat('curtain stitch', '#e8e2c8', .8), bevel=.0005, seg=1)

# ================= Floor lamp =================
LX, LZ = -1.7, -.6
Lamp = G('Floor lamp', (LX, 0, LZ))
C(Lamp, 'lamp base disc', .18, .028, (LX, .014, LZ), blackp, seg=40); C(Lamp, 'lamp base cap', .06, .02, (LX, .038, LZ), steel, seg=24, r2=.03)
C(Lamp, 'lamp pole', .014, 1.5, (LX, .8, LZ), steel, seg=16); C(Lamp, 'lamp pole collar', .022, .035, (LX, 1.0, LZ), steel, seg=16)
B(Lamp, 'lamp switch box', (.035, .05, .03), (LX, .95, LZ + .03), blackp, bevel=.006); C(Lamp, 'lamp switch dial', .01, .01, (LX, .95, LZ + .052), steel, (90, 0, 0), 12)
lathe(Lamp, 'lamp shade', [(.22, 0), (.222, .002), (.14, .27), (.136, .27), (.215, 0.0)], (LX, 1.52, LZ), lampm, 40)
TO(Lamp, 'lamp shade bottom ring', .219, .004, (LX, 1.52, LZ), steel, (90, 0, 0), 40, 6); TO(Lamp, 'lamp shade top ring', .138, .004, (LX, 1.79, LZ), steel, (90, 0, 0), 40, 6)
for a in (0, 120, 240): TU(Lamp, 'lamp shade spoke', (LX, 1.74, LZ), (LX + math.sin(math.radians(a)) * .14, 1.79, LZ + math.cos(math.radians(a)) * .14), .003, steel, 6)
SP(Lamp, 'lamp bulb', 1, (LX, 1.68, LZ), lampb, (.045, .055, .045), 20, 12); C(Lamp, 'lamp bulb socket', .016, .04, (LX, 1.63, LZ), steel, seg=12)

# ================= Plant pot =================
PX, PZ = -2.05, -1.3
Plant = G('Plant pot', (PX, 0, PZ))
lathe(Plant, 'pot terracotta body', [(0, 0), (.1, 0), (.14, .28), (.15, .29), (.15, .33), (.135, .33), (.13, .31), (0, .31)], (PX, .03, PZ), pot, 40)
lathe(Plant, 'pot saucer', [(0, 0), (.13, 0), (.17, .03), (.15, .03), (.11, .006), (0, .006)], (PX, 0, PZ), pot, 40)
C(Plant, 'pot soil', .13, .02, (PX, .335, PZ), soil, seg=32)
TO(Plant, 'pot rim band', .143, .01, (PX, .35, PZ), pot, (90, 0, 0), 40, 8)
for i in range(7):
    a = i / 7 * math.tau + .3; h = rr(.45, .75); tx, tz = math.sin(a) * rr(.05, .17), math.cos(a) * rr(.05, .17)
    k.curve_tube('plant stem', [L(Plant, (PX, .34, PZ)), L(Plant, (PX + tx * .4, .34 + h * .55, PZ + tz * .4)), L(Plant, (PX + tx, .34 + h, PZ + tz))], [.008, .006, .004], leafd, 4, Plant)
    for j in range(3):
        la = a + j * 2.1 + rr(-.3, .3)
        lf = SP(Plant, 'plant leaf', 1, (PX + tx + math.sin(la) * .06, .34 + h - j * .02, PZ + tz + math.cos(la) * .06), leafm if (i + j) % 2 else leafd, (.075, .006, .03), 14, 8)
        lf.rotation_euler = k._R((rr(-30, 30), math.degrees(la) + 90, rr(-20, 20)))

# ================= I THINK sign: origin at the grip on the stick =================
SX_, SZ_, GRIP = -.72, .95, .45
Sign = G('I THINK sign', (SX_, GRIP, SZ_))
C(Sign, 'sign stick', .013, .98, (SX_, .49, SZ_ - .012), k.mat('sign stick wood', '#c79a5e', .7), seg=12); C(Sign, 'sign stick end cap', .014, .01, (SX_, .005, SZ_ - .012), blackr, seg=12)
B(Sign, 'sign cardboard board', (.5, .34, .012), (SX_, .86, SZ_), card, bevel=.004, seg=1)
B(Sign, 'sign paper face', (.47, .31, .003), (SX_, .86, SZ_ + .0075), cardw, bevel=.0005, seg=1)
for i in range(11): B(Sign, 'sign cardboard flute', (.5, .003, .001), (SX_, .70 + i * .03, SZ_ - .0065), k.mat('sign cardboard dark', '#a07848', .95), bevel=.0003, seg=1)
k.stext('sign lettering', 'I THINK', .105, L(Sign, (SX_, .865, SZ_ + .0095)), 0, ink, .004, Sign)
B(Sign, 'sign marker underline', (.34, .012, .004), (SX_ + .01, .78, SZ_ + .0095), ink, (0, 0, 1.5), bevel=.002, seg=1)
for s in (-1, 1): B(Sign, 'sign tape strip', (.045, .09, .003), (SX_ + s * .005, .73, SZ_ - .012), tape, (0, 0, s * 6), bevel=.0005, seg=1)
for c in ((-.22, .02), (.22, .02), (-.22, -.28 + .02), (.22, -.28 + .02)): C(Sign, 'sign staple', .004, .003, (SX_ + c[0], .86 + c[1] * .0 + (.14 if c[1] > 0 else -.14) * .95, SZ_ + .0095), steel, (90, 0, 0), 6)

# ================= Drill rig (hand drill with bit and cable; the grip is the origin) =================
DX, DY, DZ = 1.15, .11, .8
Drl = G('Drill rig', (DX, DY, DZ))
d = lambda x, y, z: (DX + x, DY + y, DZ + z)
B(Drl, 'drill handle grip', (.042, .15, .052), d(0, 0, -.012), drill, (-8, 0, 0), bevel=.016, seg=3)
for yy in (-.04, -.01, .02): B(Drl, 'drill grip band', (.045, .008, .056), d(0, yy, -.012 - yy * .14), blackr, (-8, 0, 0), bevel=.003, seg=1)
B(Drl, 'drill handle base', (.05, .018, .075), d(0, -.088, -.026), blackp, (-8, 0, 0), bevel=.006)
B(Drl, 'drill trigger', (.016, .042, .014), d(0, .035, .035), blackp, (12, 0, 0), bevel=.004); B(Drl, 'drill trigger guard', (.026, .008, .05), d(0, .008, .045), drill, bevel=.003)
C(Drl, 'drill motor housing', .055, .17, d(0, .125, -.045), drill, (90, 0, 0), 28, r2=.05)
C(Drl, 'drill rear cap', .052, .022, d(0, .125, -.14), blackp, (90, 0, 0), 28)
for i in range(7): B(Drl, 'drill vent slot', (.004, .03, .008), d(-.054 if i % 2 == 0 else .054, .125, -.1 + (i // 2) * .018), blackp, bevel=.0005, seg=1)
C(Drl, 'drill gearbox', .044, .1, d(0, .125, .075), drillg, (90, 0, 0), 24, r2=.036)
C(Drl, 'drill mode ring', .048, .012, d(0, .125, .045), blackp, (90, 0, 0), 24)
C(Drl, 'drill chuck body', .032, .06, d(0, .125, .15), steel, (90, 0, 0), 24, r2=.02)
for i in range(6): C(Drl, 'drill chuck rib', .0025, .05, d(math.sin(i * 1.047) * .031, .125 + math.cos(i * 1.047) * .031, .15), drillg, (90, 0, 0), 6)
C(Drl, 'drill bit shank', .006, .09, d(0, .125, .21), steel, (90, 0, 0), 12)
C(Drl, 'drill bit fluted', .0045, .1, d(0, .125, .26), steel, (90, 0, 0), 12, r2=.003)
for i in range(10): B(Drl, 'drill bit flute', (.011, .0025, .004), d(0, .125, .21 + i * .0092), steel, (0, 0, 30 + i * 36), bevel=.0002, seg=1)
C(Drl, 'drill bit tip', .0033, .008, d(0, .125, .31), steel, (90, 0, 0), 8, r2=.0005)
C(Drl, 'drill cord strain relief', .016, .035, d(0, -.105, -.03), blackr, seg=12, r2=.009)
k.curve_tube('drill cable', [L(Drl, d(0, -.115, -.03)), L(Drl, d(0, -.1, -.14)), L(Drl, d(-.16, -.105, -.3)), L(Drl, d(-.42, -.105, -.28)), L(Drl, d(-.62, -.105, -.08)), L(Drl, d(-.8, -.105, .12)), L(Drl, d(-1.0, -.105, .12))], [.007] * 7, blackr, 4, Drl)
B(Drl, 'drill cable plug', (.04, .02, .055), d(-1.04, -.1, .12), blackp, (0, 90, 0), bevel=.005)
for s in (-1, 1): B(Drl, 'drill plug pin', (.004, .004, .02), d(-1.075, -.1 + s * 0, .12 + s * .008), steel, (0, 90, 0), bevel=.0005, seg=1)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/top-floor-set.glb'))
k.preview(os.environ['PREVIEW_DIR'], size=(520, 520), target=(0.3, -.3, 1.2), dist=9.0, views=[(0, -1, .25), (.8, -.8, .4), (-.6, -.9, .3), (0, -1, 1.2)])
