# Rooftop pool, modelled in Blender: a hotel rooftop pool 12 m x 5 m, 1.5 m deep, on an 18 m x 9 m non-slip deck. Origin at the pool centre ON the deck surface (y=0 is the deck), front = scene +Z.
# Real sizes: springboard 4.8 m long with its top 1.0 m above the deck, overflow gutter rim 0.3 m, tiled basin with swim lines, steel ladder, two loungers, parasol, towels.
# Nodes the scene uses: 'Water' (flat translucent subdivided plane 11.8 x 4.8 at y=-0.1, animate it), 'Splash rim' (the gutter), 'Springboard' (root at the rear hinge end) > 'Board' (pivot at the hinge, top of the board at y=1.0) > 'Board tip' (pivot 3.2 m out: bend it),
# 'Pool ladder', 'Lounger A' / 'Lounger B' (each with 'Lounger back'), 'Parasol', 'Pool towels'.
import sys, os, math
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector

k.reset('rooftop-pool')
S = k.S
# ---------------- materials (created after the reset) ----------------
tileb = k.mat('pool tile blue', '#0aa9e6', .22, .05)
tilef = k.mat('pool tile floor light', '#25d2f0', .22, .05)
tband = k.mat('pool tile band navy', '#1246b8', .25, .05)
grout = k.mat('pool grout dark', '#1d86ad', .6)
swim = k.mat('pool swim line black', '#171b2c', .4)
pconc = k.mat('pool paving concrete', '#f0bd78', .85)
pcdark = k.mat('pool basin concrete', '#b9b6bd', .9)
groove = k.mat('paving groove dark', '#b5742f', .9)
rim = k.mat('rim white stone', '#fff1d6', .6)
channel = k.mat('gutter channel dark', '#2c3a4d', .5, .5)
grate = k.mat('gutter grate steel', '#c3cbd8', .3, .9)
steel = k.mat('steel stainless', '#cfd6e2', .22, .95)
dsteel = k.mat('steel dark', '#3a3f4c', .4, .8)
water = k.mat('water turquoise', '#19b8c9', .06, 0, emit='#0e9db5', emit_strength=1.2, alpha=.8)
lampm = k.mat('pool light lens', '#fff7d6', .3, 0, emit='#fff1b0', emit_strength=5)
boardm = k.mat('board fibreglass cream', '#f7efd8', .35)
boardt = k.mat('board tread grey', '#6f7684', .9)
boardb = k.mat('board blue edge', '#1b5fc4', .4)
teak = k.mat('lounger slat teak wood', '#b97a45', .65)
lframe = k.mat('lounger frame steel', '#f1f4f8', .35, .6)
cush = k.mat('lounger cushion cloth stripe', '#ff7b54', .85)
cush2 = k.mat('lounger cushion cloth white', '#fff6ea', .85)
tyre = k.mat('lounger wheel rubber', '#262a33', .9)
canopy = k.mat('parasol cloth coral', '#ff5d4f', .8)
canopy2 = k.mat('parasol cloth cream', '#fff1d9', .8)
tw1 = k.mat('towel pink', '#ff8fb3', .95)
tw2 = k.mat('towel yellow', '#ffd23a', .95)
tw3 = k.mat('towel blue', '#3d8bff', .95)
soil = k.mat('planter soil', '#3b2a1d', 1)
leaf = k.mat('shrub leaf green', '#2e9a45', .8)
leaf2 = k.mat('shrub leaf light', '#59c25a', .8)
plantw = k.mat('planter box white', '#fbf8f1', .6)
ringr = k.mat('life ring red', '#ee2d3b', .5)
ringw = k.mat('life ring white', '#ffffff', .5)
wood = k.mat('pole wood', '#7b5233', .8)

def arr(o, n, dx=0, dy=0, dz=0):
    """Array with SCENE steps."""
    return k.array(o, n, (dx, -dz, dy))

# ---------------- basin ----------------
PX, PZ, PD = 6.0, 2.5, 1.5            # half length, half width, depth
# floor and concrete shell
k.sbox('pool base concrete', (13.0, .3, 6.0), (0, -PD - .18, 0), material=pcdark, bevel=.01)
k.sbox('pool tile floor', (12.0, .04, 5.0), (0, -PD - .02, 0), material=tilef, bevel=.002)
for s in (-1, 1):
    k.sbox('pool wall concrete long', (12.6, PD + .2, .27), (0, -(PD - .2) / 2 - .0, s * (PZ + .165)), material=pcdark, bevel=.01)
    k.sbox('pool wall concrete end', (.27, PD + .2, 5.0), (s * (PX + .165), -(PD - .2) / 2, 0), material=pcdark, bevel=.01)
    k.sbox('pool tile wall long', (12.0, PD - .0, .03), (0, -PD / 2, s * (PZ + .015)), material=tileb, bevel=.002)
    k.sbox('pool tile wall end', (.03, PD, 5.0), (s * (PX + .015), -PD / 2, 0), material=tileb, bevel=.002)
    k.sbox('pool tile band long', (12.0, .36, .035), (0, -.2, s * (PZ - .0 + .0)), material=tband, bevel=0)
    k.sbox('pool tile band end', (.035, .36, 5.0), (s * PX, -.2, 0), material=tband, bevel=0)
# tile grid lines (floor and walls): arrays of thin dark strips
arr(k.sbox('pool tile grid floor x', (12.0, .004, .018), (0, -PD + .002, -2.5), material=grout, bevel=0), 11, dz=.5)
arr(k.sbox('pool tile grid floor z', (.018, .004, 5.0), (-6.0, -PD + .002, 0), material=grout, bevel=0), 25, dx=.5)
for s in (-1, 1):
    zf = s * (PZ - .002)
    arr(k.sbox('pool tile grid wall h', (12.0, .018, .004), (0, -.55, zf), material=grout, bevel=0), 3, dy=-.4)
    arr(k.sbox('pool tile grid wall v', (.018, 1.1, .004), (-6.0, -.95, zf), material=grout, bevel=0), 25, dx=.5)
    xf = s * (PX - .002)
    arr(k.sbox('pool tile grid end h', (.004, .018, 5.0), (xf, -.55, 0), material=grout, bevel=0), 3, dy=-.4)
    arr(k.sbox('pool tile grid end v', (.004, 1.1, .018), (xf, -.95, -2.5), material=grout, bevel=0), 11, dz=.5)
# swim lines with T marks, and lane end targets
for z in (-1.25, 0, 1.25):
    k.sbox('pool swim line', (10.6, .004, .22), (0, -PD + .004, z), material=swim, bevel=0)
    for x in (-5.4, 5.4):
        k.sbox('pool swim line T', (.22, .004, .9), (x, -PD + .004, z), material=swim, bevel=0)
for s in (-1, 1):
    for z in (-1.25, 1.25):
        k.sbox('pool wall target', (.01, .5, .22), (s * (PX - .003), -.9, z), material=swim, bevel=0)
# underwater lights and inlet jets
for s in (-1, 1):
    arr(k.scyl('pool light lens', .09, .03, (-4.5, -.95, s * (PZ - .012)), (90, 0, 0), material=lampm, seg=16), 4, dx=3.0)
    arr(k.scyl('pool light ring', .12, .02, (-4.5, -.95, s * (PZ - .005)), (90, 0, 0), material=steel, seg=16), 4, dx=3.0)
arr(k.scyl('pool inlet jet', .045, .03, (-5.0, -1.1, -PZ + .012), (90, 0, 0), material=steel, seg=12), 6, dx=2.0)
arr(k.scyl('pool drain cover', .22, .02, (-3.0, -PD + .012, 0), material=steel, seg=20), 2, dx=6.0)

# ---------------- water: a flat, thin, subdivided plane the scene can ripple and tilt ----------------
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=47, y_segments=19, size=1.0)
for v in bm.verts: v.co.x *= 11.8 / 2; v.co.y *= 4.8 / 2
me = bpy.data.meshes.new('Water'); bm.to_mesh(me); bm.free()
wo = bpy.data.objects.new('Water', me); bpy.context.scene.collection.objects.link(wo)
wo.location = S((0, -.1, 0)); wo.parent = k.ROOT; me.materials.append(water)
sol = wo.modifiers.new('Solidify', 'SOLIDIFY'); sol.thickness = .02; sol.offset = 0
for p in me.polygons: p.use_smooth = True

# ---------------- deck ----------------
DT = .22
k.sbox('deck slab left', (2.7, DT, 9.0), (-7.65, -DT / 2, 0), material=pconc, bevel=.008)
k.sbox('deck slab right', (2.7, DT, 9.0), (7.65, -DT / 2, 0), material=pconc, bevel=.008)
k.sbox('deck slab front', (12.6, DT, 1.7), (0, -DT / 2, 3.65), material=pconc, bevel=.008)
k.sbox('deck slab back', (12.6, DT, 1.7), (0, -DT / 2, -3.65), material=pconc, bevel=.008)
k.sbox('deck edge trim front', (18.0, .06, .05), (0, -.03, 4.5), material=rim, bevel=.005)
k.sbox('deck edge trim back', (18.0, .06, .05), (0, -.03, -4.5), material=rim, bevel=.005)
for s in (-1, 1): k.sbox('deck edge trim side', (.05, .06, 9.0), (s * 9.0, -.03, 0), material=rim, bevel=.005)
# non-slip pattern: fine grooves (run across the strips) plus raised dots grid on the front strip
for s in (-1, 1):
    arr(k.sbox('deck non-slip groove side', (2.6, .004, .012), (s * 7.65, .002, -4.45), material=groove, bevel=0), 46, dz=.2)
arr(k.sbox('deck non-slip groove front', (.012, .004, 1.6), (-6.2, .002, 3.65), material=groove, bevel=0), 63, dx=.2)
arr(k.sbox('deck non-slip groove back', (.012, .004, 1.6), (-6.2, .002, -3.65), material=groove, bevel=0), 63, dx=.2)
arr(k.sbox('deck expansion joint', (.03, .006, 9.0), (-6.3, .003, 0), material=channel, bevel=0), 2, dx=12.6)
for j in range(5):
    arr(k.sbox('deck anti-slip dot row', (.04, .006, .04), (-6.1, .003, 3.1 + j * .3), material=groove, bevel=0), 62, dx=.2)

# ---------------- gutter rim 0.3 m: node 'Splash rim' ----------------
sr = k.sgroup('Splash rim')
for s in (-1, 1):
    k.sbox('gutter lip long', (12.6, .12, .09), (0, -.04, s * (PZ + .045)), material=rim, bevel=.01, parent=sr)
    k.sbox('gutter channel long', (12.6, .02, .2), (0, -.07, s * (PZ + .19)), material=channel, bevel=0, parent=sr)
    arr(k.sbox('gutter grate bar long', (.025, .02, .2), (-6.25, -.02, s * (PZ + .19)), material=grate, bevel=.003, parent=sr), 126, dx=.1)
    k.sbox('gutter lip end', (.09, .12, 5.6), (s * (PX + .045), -.04, 0), material=rim, bevel=.01, parent=sr)
    k.sbox('gutter channel end', (.2, .02, 5.6), (s * (PX + .19), -.07, 0), material=channel, bevel=0, parent=sr)
    arr(k.sbox('gutter grate bar end', (.2, .02, .025), (s * (PX + .19), -.02, -2.75), material=grate, bevel=.003, parent=sr), 56, dz=.1)
    k.sbox('gutter outer coping long', (12.6, .05, .015), (0, -.02, s * (PZ + .295)), material=steel, bevel=0, parent=sr)
    k.sbox('gutter outer coping end', (.015, .05, 5.6), (s * (PX + .295), -.02, 0), material=steel, bevel=0, parent=sr)

# ---------------- steel ladder over the back wall ----------------
lad = k.sgroup('Pool ladder')
for x in (2.55, 3.15):
    k.curve_tube('pool ladder rail', [(x, -1.05, -PZ + .12), (x, -.2, -PZ + .12), (x, .35, -PZ + .12), (x, .78, -PZ - .05), (x, .78, -PZ - .45), (x, .45, -PZ - .62), (x, .0, -PZ - .66)],
                 [.022] * 7, material=steel, res=6, parent=lad)
    k.scyl('pool ladder anchor cup', .055, .03, (x, .015, -PZ - .66), material=steel, seg=16, parent=lad)
    k.scyl('pool ladder wall bracket', .04, .08, (x, -.9, -PZ + .045), (90, 0, 0), material=steel, seg=12, parent=lad)
    k.scyl('pool ladder wall bracket', .04, .08, (x, -.25, -PZ + .045), (90, 0, 0), material=steel, seg=12, parent=lad)
for y in (-.3, -.6, -.9):
    k.sbox('pool ladder step', (.58, .035, .15), (2.85, y, -PZ + .15), material=steel, bevel=.012, parent=lad)
    k.sbox('pool ladder step tread', (.5, .005, .1), (2.85, y + .02, -PZ + .15), material=boardt, bevel=0, parent=lad)

# ---------------- springboard: root at the rear hinge end (x=-7.7), board 4.8 m, top surface 1.0 m above the deck ----------------
sb = k.sgroup('Springboard', (-7.7, 0, 0))
k.sbox('springboard base plate', (2.7, .06, 1.1), (-.05, .03, 0), material=dsteel, bevel=.01, parent=sb)
for x in (-1.2, -.3, .6, 1.1):
    for z in (-.45, .45): k.scyl('springboard anchor bolt', .028, .035, (x, .075, z), material=steel, seg=8, parent=sb)
k.sbox('springboard platform', (1.96, .06, .96), (.22, .9, 0), material=steel, bevel=.012, parent=sb)
for x in (-.65, 1.1):
    for z in (-.42, .42): k.stube('springboard stand leg', (x, .06, z), (x, .88, z), .035, steel, 12, parent=sb)
for z in (-.42, .42):
    k.stube('springboard stand brace', (-.65, .1, z), (1.1, .85, z), .02, steel, 8, parent=sb)
    k.stube('springboard stand brace', (-.65, .85, z), (1.1, .1, z), .02, steel, 8, parent=sb)
k.sbox('springboard stand crossbar', (.05, .05, .9), (1.1, .45, 0), material=steel, bevel=.005, parent=sb)
k.sbox('springboard stand crossbar', (.05, .05, .9), (-.65, .45, 0), material=steel, bevel=.005, parent=sb)
for z in (-.4, .4):
    k.sbar('springboard stair stringer', (-1.3, .0, z), (-.76, .93, z), (.04, .1), material=steel, parent=sb)
for i, x in enumerate((-1.165, -.895)):
    k.sbox('springboard stair tread', (.28, .035, .8), (x, .31 * (i + 1) - .018, 0), material=steel, bevel=.008, parent=sb)
    arr(k.sbox('springboard tread non-slip', (.022, .004, .7), (x - .1, .31 * (i + 1) + .002, 0), material=boardt, bevel=0, parent=sb), 5, dx=.05)
# handrails: along both sides of the stair and the platform
rp = [(-1.35, .0, .9), (-.7, .93, 1.83), (1.2, .93, 1.83)]
for z in (-.45, .45):
    pts = [(-1.35, .92), (-.7, 1.83), (1.2, 1.83)]
    for a, b in zip(pts, pts[1:]):
        k.stube('springboard handrail', (a[0], a[1], z), (b[0], b[1], z), .022, steel, 10, parent=sb)
        k.stube('springboard mid rail', (a[0], a[1] - .45, z), (b[0], b[1] - .45, z), .014, steel, 8, parent=sb)
    for x, y0, y1 in [(-1.35, .0, .92), (-.7, .93, 1.83), (.25, .93, 1.83), (1.2, .93, 1.83)]:
        k.stube('springboard rail post', (x, y0, z), (x, y1, z), .022, steel, 10, parent=sb)
        k.ssphere('springboard rail cap', .03, (x, y1 + .01, z), material=steel, seg=10, rings=6, parent=sb)
# the board: pivot at the rear hinge, a tip pivot 3.2 m out so the end can bend
board = k.sgroup('Board', (0, .93, 0), parent=sb)
k.sbox('board deck main', (3.2, .07, .5), (1.6, .035, 0), material=boardm, bevel=.012, parent=board)
k.sbox('board edge stripe left', (3.2, .02, .03), (1.6, .062, -.235), material=boardb, bevel=0, parent=board)
k.sbox('board edge stripe right', (3.2, .02, .03), (1.6, .062, .235), material=boardb, bevel=0, parent=board)
arr(k.sbox('board tread non-slip', (.035, .004, .38), (.25, .072, 0), material=boardt, bevel=0, parent=board), 16, dx=.19)
k.sbox('board hinge block', (.3, .12, .55), (.1, -.06, 0), material=dsteel, bevel=.015, parent=board)
k.scyl('board hinge pin', .02, .6, (.1, -.02, 0), (90, 0, 0), material=steel, seg=10, parent=board)
k.scyl('board fulcrum roller', .09, .5, (1.25, -.1, 0), (90, 0, 0), material=steel, seg=20, parent=board)
for z in (-.27, .27): k.scyl('board fulcrum flange', .12, .02, (1.25, -.1, z), (90, 0, 0), material=dsteel, seg=20, parent=board)
tip = k.sgroup('Board tip', (3.2, 0, 0), parent=board)
k.sbox('board deck tip', (1.6, .07, .5), (.8, .035, 0), material=boardm, bevel=.012, parent=tip)
k.sbox('board edge stripe left tip', (1.6, .02, .03), (.8, .062, -.235), material=boardb, bevel=0, parent=tip)
k.sbox('board edge stripe right tip', (1.6, .02, .03), (.8, .062, .235), material=boardb, bevel=0, parent=tip)
arr(k.sbox('board tread non-slip tip', (.035, .004, .38), (.05, .072, 0), material=boardt, bevel=0, parent=tip), 8, dx=.19)
k.sbox('board nose cap', (.06, .075, .5), (1.6, .035, 0), material=boardb, bevel=.02, parent=tip)

# ---------------- loungers (length along z), parasol, towels ----------------
def lounger(tag, x, z, towel_mat, towel_pos):
    g = k.sgroup('Lounger ' + tag, (x, 0, z))
    for sx in (-1, 1):
        for zz in (.88, -.12):
            k.stube('lounger leg', (sx * .33, 0.0, zz), (sx * .33, .34, zz), .02, lframe, 8, parent=g)
        k.stube('lounger side rail', (sx * .34, .36, 1.0), (sx * .34, .36, -.2), .018, lframe, 8, parent=g)
        k.scyl('lounger wheel', .06, .04, (sx * .36, .06, .86), (0, 0, 90), material=tyre, seg=14, parent=g)
        k.stube('lounger foot rail', (sx * .33, .0, .88), (sx * .33, .0, -.12), .014, lframe, 8, parent=g)
    arr(k.sbox('lounger slat', (.62, .022, .055), (0, .35, .95), material=teak, bevel=.004, parent=g), 15, dz=-.08)
    k.sbox('lounger cushion', (.62, .07, 1.15), (0, .415, .4), material=cush, bevel=.03, parent=g)
    k.sbox('lounger cushion stripe', (.14, .005, 1.15), (0, .452, .4), material=cush2, bevel=0, parent=g)
    back = k.sgroup('Lounger back', (0, .36, -.2), parent=g); back.rotation_euler = k._R((55, 0, 0))
    for sx in (-1, 1): k.stube('lounger back rail', (sx * .34, 0, 0), (sx * .34, 0, -.85), .018, lframe, 8, parent=back)
    arr(k.sbox('lounger back slat', (.62, .022, .055), (0, 0, -.05), material=teak, bevel=.004, parent=back), 11, dz=-.08)
    k.sbox('lounger back cushion', (.62, .07, .85), (0, .045, -.45), material=cush, bevel=.03, parent=back)
    k.sbox('lounger back stripe', (.14, .005, .85), (0, .082, -.45), material=cush2, bevel=0, parent=back)
    k.stube('lounger back strut', (0, .04, -.7), (0, -.2, -.3), .014, lframe, 8, parent=back)
    k.sbox('towel folded', (.42, .05, .34), towel_pos, material=towel_mat, bevel=.02, parent=g)
    return g
lounger('A', 7.1, -1.5, tw1, (0, .49, .7))
lounger('B', 7.1, 1.5, tw2, (0, .49, .7))
k.scyl('lounger side table', .26, .5, (7.25, .25, 0), material=steel, seg=20)
k.scyl('lounger side table top', .3, .03, (7.25, .52, 0), material=rim, seg=24)
tt = k.sgroup('Pool towels', (7.25, .55, 0))
for i, m in enumerate((tw3, tw1, tw2)):
    k.sbox('towel stack layer', (.34, .045, .24), (0, .025 + i * .05, 0), (0, i * 12, 0), material=m, bevel=.015, parent=tt)
par = k.sgroup('Parasol', (8.2, 0, 0))
k.scyl('parasol base', .35, .1, (0, .05, 0), material=pcdark, seg=24, parent=par)
k.scyl('parasol base ring', .38, .03, (0, .11, 0), material=steel, seg=24, parent=par)
k.stube('parasol pole', (0, .1, 0), (0, 2.55, 0), .03, steel, 12, parent=par)
k.scyl('parasol canopy cloth', 1.75, .5, (0, 2.4, 0), material=canopy, r2=.04, seg=16, parent=par)
k.scyl('parasol canopy cream cap', .6, .2, (0, 2.62, 0), material=canopy2, r2=.04, seg=16, parent=par)
k.storus('parasol valance ring', 1.75, .022, (0, 2.15, 0), (90, 0, 0), material=canopy2, major=32, minor=6, parent=par)
for a in range(8):
    t = a / 8 * math.tau
    k.stube('parasol rib', (0, 2.62, 0), (math.cos(t) * 1.75, 2.15, math.sin(t) * 1.75), .01, steel, 6, parent=par)
k.ssphere('parasol finial', .05, (0, 2.68, 0), material=steel, seg=10, rings=6, parent=par)

# deck extras: planters, life ring, outdoor shower
for i, x in enumerate((-4.5, -3.0, -1.5)):
    k.sbox('planter box white', (1.2, .55, .5), (x, .275, -3.9), material=plantw, bevel=.03)
    k.sbox('planter soil', (1.08, .03, .38), (x, .55, -3.9), material=soil, bevel=0)
    for q in range(3): k.ssphere('shrub ball', .22, (x - .38 + q * .38, .75, -3.9), (1, .95, 1), material=leaf if (i + q) % 2 else leaf2, seg=12, rings=8)
k.scyl('life ring post', .035, 1.4, (3.9, .7, 3.95), material=wood, seg=10)
k.sbox('life ring hook arm', (.05, .04, .3), (3.9, 1.3, 3.8), material=steel, bevel=.005)
k.storus('life ring', .3, .075, (3.9, 1.05, 3.66), (0, 0, 0), material=ringr, major=32, minor=10)
for a in range(4):
    t = a / 4 * math.tau + .4
    k.sbox('life ring white block', (.1, .1, .1), (3.9 + math.cos(t) * .3, 1.05 + math.sin(t) * .3, 3.66), (0, 0, math.degrees(t)), material=ringw, bevel=.01)
k.scyl('pool shower base', .25, .04, (-8.2, .02, -3.8), material=dsteel, seg=20)
k.stube('pool shower pole', (-8.2, .04, -3.8), (-8.2, 2.3, -3.8), .03, steel, 10)
k.stube('pool shower arm', (-8.2, 2.3, -3.8), (-7.95, 2.3, -3.8), .02, steel, 8)
k.scyl('pool shower head', .13, .03, (-7.95, 2.28, -3.8), material=steel, seg=16)
k.sbox('pool shower valve', (.08, .06, .1), (-8.2, 1.1, -3.74), material=dsteel, bevel=.01)
k.sbox('pool shower tray', (.7, .02, .7), (-8.2, .01, -3.8), material=grate, bevel=.003)

# ---------------- export and previews ----------------
k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/rooftop-pool.glb'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cam.data.clip_end = 500
if os.environ.get('PREVIEW_DIR'):
    k.preview(os.environ['PREVIEW_DIR'], size=(560, 420), target=S((0, -.5, 0)), dist=24, views=[(.5, -1, .8)], prefix='a')
    k.preview(os.environ['PREVIEW_DIR'], size=(560, 420), target=S((-6, .8, 0)), dist=9, views=[(-.2, -1, .15)], prefix='b')
    k.preview(os.environ['PREVIEW_DIR'], size=(560, 420), target=S((3, -.3, -2.6)), dist=5, views=[(.1, -1, .7)], prefix='c')
    k.preview(os.environ['PREVIEW_DIR'], size=(560, 420), target=S((7.5, .6, 0)), dist=9, views=[(-1, -.6, .5)], prefix='d')
