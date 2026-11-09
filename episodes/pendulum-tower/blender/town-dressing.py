# Town dressing pack, modelled in Blender: eleven separate named groups the scene places one by one (origin of every group at its base, never merged).
# Groups: `Banner OPENING TOMORROW` (6 x 1.2 m, waved cloth, lettering lying flat on the cloth), `Banner GRAND OPENING` (8 x 1.5 m on two poles), `Sign TOP FLOOR FOR SALE` (1.6 x 1.0 m board on a stake, child group `Cross-out`),
# `Street lamp` (4.5 m), `Queue barrier` (1.0 m x 2.0 m), `Balloon` and `Balloon bunch`, `Windsock` (3 m pole, child group `Windsock cone` pivots at the ring), `Hoarding panel` (2.4 x 2.4 m), `Bunting` (6 m, 12 flags) with two `Bunting pole`,
# `Pigeon` (0.3 m) and `Pigeon fainted`, `Wallet` (0.12 m panels) and `Fly` (0.015 m, child groups `Fly wing L/R`). The groups are laid out on a strip for the sheet; the scene moves each to its own place. Front = -Y in Blender (+Z in the scene).
import sys, os, math, random
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector, Euler, Matrix
random.seed(7)
k.reset('town-dressing')

M = k.mat
red_cloth = M('red cloth', '#d62a2a', .85); white_letters = M('banner letters white', '#fffdf4', .6); stitch_w = M('banner stitch seam white', '#f6f1e4', .8); brass = M('grommet brass metal', '#d9a33a', .35, .9)
rope_m = M('rope hemp', '#c8a96a', .95); blue_cloth = M('royal blue cloth', '#1c3fbf', .85); gold_letters = M('banner letters gold', '#f7c531', .35, .7); gold_trim = M('banner gold border cloth', '#f2bd2a', .6)
pole_w = M('banner pole wood', '#9a6a3a', .8); base_c = M('banner pole base concrete', '#b6b2a9', .95); gold_m = M('finial gold metal', '#f1b92b', .3, .9)
board_w = M('sign board white', '#fbfaf3', .6); sign_red = M('sign letters red', '#d9232b', .5); sign_navy = M('sign letters navy', '#1a2a63', .5); stake_w = M('sign stake wood', '#b07a3e', .85); batten_w = M('sign batten wood', '#8d5b2c', .85)
cross_red = M('cross-out bar red', '#e3151f', .4); grey_bar = M('sign agent line', '#c5c9d0', .7)
lamp_green = M('lamp post metal green', '#1d6b4a', .4, .6); lamp_dark = M('lamp base metal dark', '#22302b', .45, .7); glass_m = M('lamp glass', '#fff2c4', .1, 0, emit='#ffe9a8', emit_strength=1.5); bulb_m = M('lamp bulb', '#fff7d6', .2, 0, emit='#fff1c0', emit_strength=3); lamp_gold = M('lamp trim metal gold', '#d8a62f', .35, .9)
bar_steel = M('barrier steel galvanised', '#aab4be', .4, .85); bar_foot = M('barrier foot rubber', '#25272b', .85); tape_y = M('barrier tape yellow', '#ffd21f', .6); ink_black = M('tape ink black', '#16161a', .6); bar_red = M('barrier cap red', '#e0262d', .5)
balloon_r = M('balloon red', '#e8212b', .18); balloon_y = M('balloon yellow', '#ffc61a', .18); balloon_b = M('balloon blue', '#2f7de3', .18); shine = M('balloon shine white', '#ffffff', .1); string_m = M('balloon string', '#f3efe6', .9); weight_m = M('balloon weight foil', '#d6d9e0', .25, .9)
sock_r = M('windsock stripe red', '#e6282e', .7); sock_w = M('windsock stripe white', '#fbf8f0', .7); pole_steel = M('windsock pole steel', '#c4ccd6', .35, .85); ring_steel = M('windsock ring steel', '#8b95a1', .4, .9)
ply_blue = M('hoarding ply blue', '#2a6fd4', .7); kick_dark = M('hoarding kick plate wood', '#1f2f4d', .8); post_w = M('hoarding post wood', '#a4743e', .85); cap_w = M('hoarding cap wood', '#caa06a', .8)
haz_y = M('hoarding hazard yellow', '#ffcc12', .55); haz_k = M('hoarding hazard black', '#17171a', .6)
poster_a = M('poster paper white', '#f4f1e8', .8); poster_b = M('poster paper yellow', '#ffd53a', .8); poster_c = M('poster paper pink', '#ff6fa0', .8); poster_ink = M('poster ink blue', '#2342b5', .7); poster_red = M('poster ink red', '#dd2a2f', .7); poster_green = M('poster ink green', '#2faa57', .7)
bunt_r = M('bunting flag red cloth', '#e2332f', .85); bunt_y = M('bunting flag yellow cloth', '#ffc61a', .85); bunt_s = M('bunting string rope', '#efe6d0', .9)
pig_body = M('pigeon body feather', '#7f8aa0', .8); pig_dark = M('pigeon wing bar feather', '#3c4352', .8); pig_light = M('pigeon breast feather', '#b4bccb', .8); pig_neck = M('pigeon neck sheen', '#3fae92', .35)
pig_beak = M('pigeon beak', '#3b3436', .5); pig_cere = M('pigeon cere', '#f1ece4', .6); pig_eye = M('pigeon eye orange', '#ff8a1e', .3); pig_pupil = M('pigeon pupil', '#101014', .3); pig_leg = M('pigeon leg pink', '#e0507d', .6); pig_x = M('pigeon X eye ink', '#101014', .5); pig_star = M('pigeon dizzy star', '#ffd22b', .4)
leather = M('wallet leather brown', '#8a4a1e', .55); lining = M('wallet lining tan', '#d9b87e', .7); pocket = M('wallet pocket leather', '#6f3a17', .6); dark_slot = M('wallet slot dark', '#120b07', .9); thread = M('wallet stitch thread', '#f2dca0', .8); snap_m = M('wallet snap metal', '#cfd3da', .3, .9)
fly_body = M('fly body', '#25252b', .4); fly_eye = M('fly eye red', '#c8201e', .25); fly_wing = M('fly wing glass', '#dfe9f2', .15); fly_leg = M('fly leg', '#1b1b20', .5)

def freeze(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def lerp(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def mk_obj(name, me, material, parent, smooth=True, thick=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.parent = parent or k.ROOT; o.location = loc
    if material is not None: me.materials.append(material)
    for p in me.polygons: p.use_smooth = smooth
    if thick:
        m = o.modifiers.new('Solidify', 'SOLIDIFY'); m.thickness = thick; m.offset = 0
    return o

def cloth(name, x0, x1, z0, z1, nx, ny, wf, material, parent, off=0.0, thick=.004):
    """A subdivided cloth patch (scene xy, group coordinates), displaced toward the camera by wf(x,y)+off so lettering and trims can follow it exactly."""
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; y = z0 + (z1 - z0) * j / ny
            verts.append((x, -(wf(x, y) + off), y))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i; faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    return mk_obj(name, me, material, parent, True, thick)

def flat_mesh(name, polys, z, material, parent, thick=.003, smooth=False):
    """Flat polygons in the scene xy plane at depth z, facing +z (flags, poster art, hazard stripes)."""
    verts, faces = [], []
    for poly in polys:
        base = len(verts)
        for (x, y) in poly: verts.append((x, -z, y))
        faces.append(tuple(range(base, base + len(poly))))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    return mk_obj(name, me, material, parent, smooth, thick)

def tube_open(name, r1, r2, length, loc, material, parent, segs=24, thick=.006):
    """An open frustum along scene +x (r1 at -x end): windsock bands."""
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, cap_tris=False, segments=segs, radius1=r1, radius2=r2, depth=length)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = mk_obj(name, me, material, parent, True, thick, k.S(loc)); o.rotation_euler = (0, math.radians(90), 0)
    return o

def tassels(name, xs, yfun, wf, material, parent, r_top=.011, r_bot=.004, depth=.1):
    bm = bmesh.new()
    for x in xs:
        y, z = yfun(x)
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=6, radius1=r_bot, radius2=r_top, depth=depth, matrix=Matrix.Translation(Vector(k.S((x, y, z)))))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return mk_obj(name, me, material, parent, True)

def fit_size(s, maxw, maxh):
    p = k.text('probe', s, 1.0, (0, 0, 0), (90, 0, 0)); w, h = p.dimensions.x, p.dimensions.y
    bpy.data.objects.remove(p, do_unlink=True)
    return min(maxw / w, maxh / h)

def conform(o, wf):
    freeze(o)
    for v in o.data.vertices:
        v.co.y -= wf(v.co.x + o.location.x, v.co.z + o.location.z)

def lettering(name, s, center, maxw, maxh, material, extrude, parent, wf=None):
    o = k.stext(name, s, fit_size(s, maxw, maxh), center, 0, material, extrude, parent)
    if wf: conform(o, wf)
    return o

def hand_letters(name, s, cx, cy, z, size, material, parent, adv=.78):
    x = cx - (len(s) - 1) * size * adv / 2
    for c in s:
        if c != ' ':
            o = k.stext(name, c, size * (1 + random.uniform(-.08, .08)), (x, cy + random.uniform(-.006, .006), z), 0, material, .0012, parent)
            o.rotation_euler = k._R((0, 0, random.uniform(-6, 6)), Euler((math.radians(90), 0, 0)).to_matrix())
        x += size * adv

# ======================= 1. Banner OPENING TOMORROW (6 x 1.2 m, red cloth, white lettering lying flat on it) =======================
W1, H1 = 6.0, 1.2
wf1 = lambda x, y: .016 * (math.sin(x * 1.5 + .4) + .55 * math.sin(x * 3.7 + y * 1.6 + 1.1))
g = k.sgroup('Banner OPENING TOMORROW', (-4.5, 1.6, -4))
cloth('banner cloth red', -W1 / 2, W1 / 2, 0, H1, 96, 14, wf1, red_cloth, g)
for nm, (a, b, c, d) in [('banner border band top', (-W1/2 + .08, W1/2 - .08, H1 - .11, H1 - .07)), ('banner border band bottom', (-W1/2 + .08, W1/2 - .08, .07, .11))]:
    cloth(nm, a, b, c, d, 80, 1, wf1, stitch_w, g, off=.004, thick=.002)
cloth('banner border band left', -(W1/2 - .11), -(W1/2 - .07), .07, H1 - .07, 1, 12, wf1, stitch_w, g, off=.004, thick=.002)
cloth('banner border band right', W1/2 - .11, W1/2 - .07, .07, H1 - .07, 1, 12, wf1, stitch_w, g, off=.004, thick=.002)
for nm, y in [('banner hem seam top', H1 - .03), ('banner hem seam bottom', .03)]:
    cloth(nm, -W1 / 2 + .02, W1 / 2 - .02, y, y + .008, 80, 1, wf1, stitch_w, g, off=.003, thick=.0015)
lettering('banner lettering OPENING TOMORROW', 'OPENING TOMORROW', (0, H1 / 2, .007), W1 - 1.0, .56, white_letters, .006, g, wf1)
for (gx, gy) in [(-W1/2 + .12, .12), (W1/2 - .12, .12), (-W1/2 + .12, H1 - .12), (W1/2 - .12, H1 - .12), (-1.5, H1 - .12), (1.5, H1 - .12), (-1.5, .12), (1.5, .12)]:
    z = wf1(gx, gy) + .004
    k.storus('banner grommet', .022, .005, (gx, gy, z), material=brass, major=22, minor=8, parent=g)
for sx in (-1, 1):
    for (ty, sy) in [(.12, -1), (H1 - .12, 1)]:
        gx = sx * (W1 / 2 - .12); z = wf1(gx, ty) + .01
        k.curve_tube('banner rope tie', [(gx, ty, z), (gx + sx * .05, ty + sy * .05, z + .05), (gx + sx * .2, ty + sy * .16, z + .09), (gx + sx * .38, ty + sy * .3, z + .05)], [.011, .011, .01, .009], rope_m, parent=g)
        k.ssphere('banner rope knot', .02, (gx + sx * .03, ty + sy * .02, z + .03), (1, .8, 1), rope_m, 12, 8, g)

# ======================= 2. Banner GRAND OPENING (8 x 1.5 m, gold on royal blue, two poles) =======================
W2, H2, BOT2 = 8.0, 1.5, 1.7
wf2 = lambda x, y: .02 * (math.sin(x * 1.1 + 2.0) + .5 * math.sin(x * 2.9 + (y - BOT2) * 1.3))
g = k.sgroup('Banner GRAND OPENING', (4.5, 0, -4))
cloth('banner cloth blue', -W2 / 2, W2 / 2, BOT2, BOT2 + H2, 120, 16, wf2, blue_cloth, g)
cloth('banner gold border top', -W2/2 + .1, W2/2 - .1, BOT2 + H2 - .14, BOT2 + H2 - .09, 100, 1, wf2, gold_trim, g, off=.004, thick=.002)
cloth('banner gold border bottom', -W2/2 + .1, W2/2 - .1, BOT2 + .09, BOT2 + .14, 100, 1, wf2, gold_trim, g, off=.004, thick=.002)
cloth('banner gold border left', -W2/2 + .1, -W2/2 + .15, BOT2 + .09, BOT2 + H2 - .09, 1, 14, wf2, gold_trim, g, off=.004, thick=.002)
cloth('banner gold border right', W2/2 - .15, W2/2 - .1, BOT2 + .09, BOT2 + H2 - .09, 1, 14, wf2, gold_trim, g, off=.004, thick=.002)
cloth('banner sleeve seam', -W2/2, W2/2, BOT2 + H2 - .22, BOT2 + H2 - .2, 100, 1, wf2, gold_trim, g, off=.003, thick=.0015)
lettering('banner lettering GRAND OPENING', 'GRAND OPENING', (0, BOT2 + H2 / 2 - .02, .01), W2 - 1.4, .78, gold_letters, .008, g, wf2)
for sx in (-1, 1):
    o = k.scyl('banner star ornament', .1, .012, (sx * 3.35, BOT2 + H2 / 2, wf2(sx * 3.35, BOT2 + H2 / 2) + .014), (90, 0, 0), material=gold_letters, seg=5, parent=g)
    o2 = k.scyl('banner star ornament', .05, .014, (sx * 3.35, BOT2 + H2 / 2, wf2(sx * 3.35, BOT2 + H2 / 2) + .016), (90, 0, 0), material=gold_trim, seg=5, parent=g)
k.stube('banner top rod', (-4.3, BOT2 + H2 + .02, -.04), (4.3, BOT2 + H2 + .02, -.04), .02, pole_steel, parent=g)
for i in range(9):
    x = -3.8 + i * .95
    k.storus('banner ring', .032, .006, (x, BOT2 + H2 + .02, -.04), (0, 90, 0), material=brass, major=20, minor=8, parent=g)
tassels('banner fringe tassel', [-W2 / 2 + .06 + i * .1 for i in range(80)], lambda x: (BOT2 - .05, wf2(x, BOT2) + .004), wf2, gold_trim, g)
for sx in (-1, 1):
    px = sx * 4.3
    k.scyl('banner pole base concrete', .24, .14, (px, .07, 0), material=base_c, seg=24, bevel=.01, parent=g)
    k.stube('banner pole', (px, .12, 0), (px, 3.35, 0), .05, pole_w, seg=16, r2=.04, parent=g)
    k.scyl('banner pole collar', .07, .05, (px, .2, 0), material=gold_m, seg=20, parent=g)
    k.ssphere('banner pole finial', .075, (px, 3.43, 0), (1, 1.2, 1), gold_m, 20, 12, g)
    k.scyl('banner pole finial neck', .045, .05, (px, 3.37, 0), material=gold_m, seg=16, parent=g)
    for ang in (0, 120, 240):
        k.stube('banner pole stay', (px, 1.5, 0), (px + .55 * math.cos(math.radians(ang + (90 if sx > 0 else 0))), .1, .55 * math.sin(math.radians(ang + (90 if sx > 0 else 0)))), .012, bar_steel, seg=8, parent=g)

# ======================= 3. Sign TOP FLOOR FOR SALE (1.6 x 1.0 m board on a wooden stake) =======================
g = k.sgroup('Sign TOP FLOOR FOR SALE', (-6.5, 0, -1.5))
SY = 1.65
k.sbox('sign stake wood', (.09, 2.3, .06), (0, 1.0, -.075), material=stake_w, bevel=.006, parent=g)
k.scyl('sign stake tip wood', .05, .22, (0, -.1, -.075), rot=(180, 0, 0), material=stake_w, seg=4, r2=.005, parent=g)
for dy in (-.38, .38):
    k.sbox('sign batten wood', (1.5, .07, .035), (0, SY + dy, -.04), material=batten_w, bevel=.006, parent=g)
k.sbox('sign board white', (1.6, 1.0, .03), (0, SY, 0), material=board_w, bevel=.01, parent=g)
for nm, sz, loc in [('sign border red top', (1.5, .035, .006), (0, SY + .455, .017)), ('sign border red bottom', (1.5, .035, .006), (0, SY - .455, .017)), ('sign border red left', (.035, .93, .006), (-.7675, SY, .017)), ('sign border red right', (.035, .93, .006), (.7675, SY, .017))]:
    k.sbox(nm, sz, loc, material=sign_red, bevel=.002, seg=1, parent=g)
lettering('sign lettering TOP FLOOR', 'TOP FLOOR', (0, SY + .23, .018), 1.25, .27, sign_navy, .006, g)
lettering('sign lettering FOR SALE', 'FOR SALE', (0, SY - .05, .018), 1.2, .27, sign_red, .006, g)
for i, wlen in enumerate((.9, .6)):
    k.sbox('sign agent line', (wlen, .03, .005), (0, SY - .29 - i * .08, .017), material=grey_bar, bevel=.001, seg=1, parent=g)
for dx, dy in [(-.72, .46), (.72, .46), (-.72, -.46), (.72, -.46)]:
    k.scyl('sign screw', .011, .01, (dx, SY + dy, .019), rot=(90, 0, 0), material=brass, seg=8, parent=g)
cg = k.sgroup('Cross-out', (0, SY, .03), parent=g)
k.sbox('Cross-out bar', (1.86, .11, .02), (0, 0, 0), rot=(0, 0, -32), material=cross_red, bevel=.006, parent=cg)
k.sbox('Cross-out bar edge', (1.88, .125, .008), (0, 0, -.009), rot=(0, 0, -32), material=stitch_w, bevel=.003, parent=cg)
k.sbox('Cross-out bar sheen', (1.7, .02, .004), (0, .028, .012), rot=(0, 0, -32), material=M('cross-out sheen red', '#ff6a70', .3), bevel=.001, seg=1, parent=cg)

# ======================= 4. Street lamp (4.5 m high: plinth, shaft, rings, arm, hanging glass lantern, base plate) =======================
g = k.sgroup('Street lamp', (-3.2, 0, -1.5))
k.sbox('lamp base plate metal', (.46, .02, .46), (0, .01, 0), material=lamp_dark, bevel=.004, parent=g)
for bx in (-1, 1):
    for bz in (-1, 1):
        k.scyl('lamp base bolt', .02, .035, (bx * .185, .035, bz * .185), material=lamp_gold, seg=8, parent=g)
k.scyl('lamp plinth metal', .17, .56, (0, .3, 0), material=lamp_dark, r2=.1, seg=24, bevel=.004, parent=g)
k.storus('lamp plinth ring metal', .105, .025, (0, .6, 0), (90, 0, 0), material=lamp_gold, major=28, minor=8, parent=g)
k.scyl('lamp post metal', .075, 3.6, (0, 2.4, 0), material=lamp_green, r2=.05, seg=24, parent=g)
for y in (1.0, 1.9, 3.2):
    k.storus('lamp post ring metal', .075 - (y - .6) * .0069, .014, (0, y, 0), (90, 0, 0), material=lamp_gold, major=24, minor=8, parent=g)
k.scyl('lamp post collar metal', .068, .1, (0, 4.15, 0), material=lamp_gold, r2=.058, seg=20, parent=g)
k.curve_tube('lamp arm metal', [(0, 4.16, 0), (0, 4.32, 0), (.16, 4.44, 0), (.5, 4.5, 0), (.82, 4.42, 0), (.95, 4.32, 0)], [.05, .045, .04, .033, .028, .026], lamp_green, res=6, parent=g)
k.stube('lamp arm scroll', (.0, 4.2, 0), (.38, 4.43, 0), .014, lamp_gold, seg=8, parent=g)
k.stube('lamp head hanger metal', (.95, 4.34, 0), (.95, 4.24, 0), .022, lamp_green, parent=g)
k.scyl('lamp head cap metal', .2, .1, (.95, 4.2, 0), material=lamp_green, r2=.05, seg=24, bevel=.003, parent=g)
k.ssphere('lamp head finial', .03, (.95, 4.27, 0), (1, 1.1, 1), lamp_gold, 12, 8, g)
k.scyl('lamp glass', .15, .27, (.95, 3.99, 0), material=glass_m, r2=.12, seg=24, parent=g)
k.ssphere('lamp bulb', .06, (.95, 4.0, 0), (1, 1.2, 1), bulb_m, 14, 10, g)
k.scyl('lamp glass bottom metal', .13, .03, (.95, 3.84, 0), material=lamp_green, seg=24, parent=g)
for a in range(4):
    ang = a * math.pi / 2 + math.pi / 4
    k.stube('lamp glass rib metal', (.95 + .15 * math.cos(ang), 3.86, .15 * math.sin(ang)), (.95 + .11 * math.cos(ang), 4.13, .11 * math.sin(ang)), .008, lamp_green, seg=8, parent=g)

# ======================= 5. Queue barrier (1.0 m high, 2.0 m long, feet, rails, hand-lettered tape) =======================
g = k.sgroup('Queue barrier', (-2.4, 0, 1.4))
for sx in (-1, 1):
    k.sbox('barrier foot rubber', (.07, .035, .72), (sx * .95, .0175, 0), material=bar_foot, bevel=.006, parent=g)
    k.stube('barrier upright steel', (sx * .95, .03, 0), (sx * .95, 1.0, 0), .019, bar_steel, seg=14, parent=g)
    k.ssphere('barrier cap red', .026, (sx * .95, 1.01, 0), (1, .8, 1), bar_red, 12, 8, g)
    k.stube('barrier foot brace steel', (sx * .95, .4, 0), (sx * .95, .035, .3), .011, bar_steel, seg=8, parent=g)
    k.stube('barrier foot brace steel', (sx * .95, .4, 0), (sx * .95, .035, -.3), .011, bar_steel, seg=8, parent=g)
for nm, y in [('barrier rail steel top', .96), ('barrier rail steel mid', .56), ('barrier rail steel bottom', .14)]:
    k.stube(nm, (-.95, y, 0), (.95, y, 0), .015, bar_steel, seg=12, parent=g)
vb = k.scyl('barrier vertical bar steel', .009, .82, (-.84, .55, 0), material=bar_steel, seg=8, parent=g); k.array(vb, 13, (.14, 0, 0))
k.sbox('barrier tape yellow', (1.86, .15, .006), (0, .72, .026), material=tape_y, bevel=.002, seg=1, parent=g)
for nm, y in [('barrier tape edge red top', .7975 + .0), ('barrier tape edge red bottom', .6425)]:
    k.sbox(nm, (1.86, .008, .008), (0, y, .028), material=bar_red, bevel=.001, seg=1, parent=g)
hand_letters('barrier tape lettering', 'QUEUE HERE', 0, .72, .03, .085, ink_black, g)
for sx in (-1, 1):
    k.stube('barrier tape tie', (sx * .93, .76, .0), (sx * .93, .66, .03), .006, bar_red, seg=6, parent=g)

# ======================= 6. Balloon and Balloon bunch (helium balloon on a 1.5 m string with a knot and a weight) =======================
def balloon(parent, knot, material, scale=1.0):
    """A helium balloon hanging its knot at `knot` (group coordinates): body above, nozzle and knot at the bottom."""
    kx, ky, kz = knot
    cx, cy, cz = kx, ky + .19 * scale, kz
    k.ssphere('balloon body', .14 * scale, (cx, cy, cz), (.93, 1.1, .93), material, 28, 18, parent)
    k.ssphere('balloon shine', .03 * scale, (cx - .06 * scale, cy + .07 * scale, cz + .105 * scale), (.8, 1.5, .4), shine, 10, 8, parent)
    k.scyl('balloon neck', .016 * scale, .03, (cx, cy - .162 * scale, cz), material=material, r2=.007, seg=14, parent=parent, rot=(180, 0, 0))
    k.ssphere('balloon knot', .012 * scale, (kx, ky + .004, kz), (1, .8, 1), material, 10, 8, parent)
g = k.sgroup('Balloon', (-6.0, 0, 1.4))
k.scyl('balloon weight foil', .035, .05, (0, .025, 0), material=weight_m, r2=.028, seg=12, parent=g)
k.storus('balloon weight loop', .015, .004, (0, .056, 0), (90, 0, 0), material=weight_m, major=14, minor=6, parent=g)
knot = (0, 1.55, 0)
balloon(g, knot, balloon_r)
k.curve_tube('balloon string', [(0, .06, 0), (.03, .45, .02), (-.02, .95, -.015), (.015, 1.35, .01), knot], [.0018] * 5, string_m, res=4, parent=g)
g = k.sgroup('Balloon bunch', (-4.7, 0, 1.4))
k.scyl('balloon weight foil', .04, .06, (0, .03, 0), material=weight_m, r2=.032, seg=12, parent=g)
k.storus('balloon weight loop', .017, .0045, (0, .066, 0), (90, 0, 0), material=weight_m, major=14, minor=6, parent=g)
tie = (0, 1.0, 0)
k.curve_tube('balloon string', [(0, .07, 0), (.02, .35, .01), (-.01, .7, -.01), tie], [.002] * 4, string_m, res=4, parent=g)
k.ssphere('balloon tie knot', .014, tie, (1, 1, 1), string_m, 10, 8, g)
for (kx, ky, kz, m) in [(-.2, 1.42, .02, balloon_r), (.18, 1.52, -.03, balloon_y), (0, 1.66, .05, balloon_b)]:
    balloon(g, (kx, ky, kz), m, .95)
    k.curve_tube('balloon string', [tie, (kx * .4, 1.0 + (ky - 1.0) * .4, kz * .4), (kx, ky, kz)], [.0016] * 3, string_m, res=4, parent=g)

# ======================= 7. Windsock (3 m pole, red-white striped cone, `Windsock cone` pivots at the ring) =======================
g = k.sgroup('Windsock', (-0.6, 0, -1.5))
k.scyl('windsock base plate steel', .2, .025, (0, .0125, 0), material=ring_steel, seg=24, bevel=.003, parent=g)
for a in range(4):
    ang = a * math.pi / 2 + math.pi / 4
    k.scyl('windsock base bolt', .014, .03, (.14 * math.cos(ang), .035, .14 * math.sin(ang)), material=pole_steel, seg=8, parent=g)
k.stube('windsock pole steel', (0, .02, 0), (0, 3.0, 0), .05, pole_steel, seg=20, r2=.032, parent=g)
k.scyl('windsock pole sleeve steel', .062, .35, (0, .2, 0), material=ring_steel, seg=20, parent=g, bevel=.003)
k.scyl('windsock swivel steel', .05, .09, (0, 3.03, 0), material=ring_steel, seg=16, parent=g)
k.ssphere('windsock pole cap', .042, (0, 3.1, 0), (1, .8, 1), ring_steel, 14, 8, g)
cone = k.sgroup('Windsock cone', (0, 3.0, 0), parent=g)
k.storus('windsock ring steel', .245, .011, (.01, 0, 0), (0, 90, 0), material=ring_steel, major=36, minor=8, parent=cone)
k.stube('windsock ring arm steel', (0, 0, 0), (.01, 0, 0), .02, ring_steel, seg=10, parent=cone)
for a in range(3):
    ang = a * 2 * math.pi / 3 + .3
    k.stube('windsock ring spoke steel', (0, 0, 0), (.01, .245 * math.sin(ang), .245 * math.cos(ang)), .005, ring_steel, seg=6, parent=cone)
L = 1.35; N = 7; rbig, rsmall = .245, .085
for i in range(N):
    r1 = rbig + (rsmall - rbig) * i / N; r2 = rbig + (rsmall - rbig) * (i + 1) / N; seg = L / N
    tube_open('windsock band red' if i % 2 == 0 else 'windsock band white', r1, r2, seg + .003, (.03 + seg * (i + .5), 0, 0), sock_r if i % 2 == 0 else sock_w, cone)
k.storus('windsock hem ring', rsmall + .002, .006, (.03 + L, 0, 0), (0, 90, 0), material=sock_r, major=28, minor=6, parent=cone)

# ======================= 8. Hoarding panel (2.4 m x 2.4 m: posts, kick plate, plywood, caps, posters, hazard stripes) =======================
g = k.sgroup('Hoarding panel', (-9.5, 0, -1.5))
k.sbox('hoarding kick plate wood', (2.4, .26, .035), (0, .13, .015), material=kick_dark, bevel=.004, parent=g)
k.sbox('hoarding ply blue', (2.36, 2.08, .026), (0, 1.3, 0), material=ply_blue, bevel=.004, parent=g)
k.sbox('hoarding cap rail wood', (2.5, .07, .12), (0, 2.365, -.005), material=cap_w, bevel=.01, parent=g)
for sx in (-1, 1):
    k.sbox('hoarding post wood', (.11, 2.5, .11), (sx * 1.2, 1.25, -.09), material=post_w, bevel=.008, parent=g)
    k.sbox('hoarding post foot concrete', (.3, .09, .36), (sx * 1.2, .045, -.07), material=base_c, bevel=.01, parent=g)
    k.stube('hoarding post strut wood', (sx * 1.2, 1.7, -.09), (sx * 1.2, .06, -.75), .035, post_w, seg=10, parent=g)
for ry in (.7, 1.45, 2.15):
    k.sbox('hoarding rail wood', (2.4, .09, .045), (0, ry, -.04), material=post_w, bevel=.006, parent=g)
for gx in (-.4, .4):
    k.sbox('hoarding ply seam groove', (.008, 2.08, .003), (gx, 1.3, .0145), material=kick_dark, bevel=0, seg=1, parent=g)
# hazard band (diagonal stripes cut to the band) on the plywood
polys = []
x = -1.18
while x < 1.18:
    a, b = x, x + .095; shift = .2
    quad = [(a, .27), (b, .27), (b + shift, .47), (a + shift, .47)]
    quad = [(min(max(px, -1.18), 1.18), py) for px, py in quad]
    polys.append(quad); x += .19
flat_mesh('hoarding hazard band black', [[(-1.18, .27), (1.18, .27), (1.18, .47), (-1.18, .47)]], .0145, haz_k, g, thick=.003)
flat_mesh('hoarding hazard stripe yellow', polys, .0165, haz_y, g, thick=.003)
# posters
flat_mesh('poster paper white', [[(-.95, 1.0), (-.38, 1.0), (-.38, 1.95), (-.95, 1.95)]], .0152, poster_a, g)
flat_mesh('poster art blue stripe', [[(-.9, 1.1), (-.43, 1.1), (-.43, 1.3), (-.9, 1.3)], [(-.9, 1.4), (-.43, 1.4), (-.43, 1.5), (-.9, 1.5)]], .0164, poster_ink, g)
k.scyl('poster art red disc', .12, .004, (-.665, 1.74, .0175), rot=(90, 0, 0), material=poster_red, seg=24, parent=g)
flat_mesh('poster paper yellow', [[(.08, 1.05), (.75, 1.05), (.75, 1.9), (.08, 1.9)]], .0154, poster_b, g)
flat_mesh('poster warning triangle black', [[(.415, 1.82), (.205, 1.34), (.625, 1.34)]], .0168, haz_k, g)
flat_mesh('poster warning triangle yellow', [[(.415, 1.76), (.26, 1.39), (.57, 1.39)]], .0178, haz_y, g)
k.stext('poster lettering exclamation', '!', .24, (.415, 1.56, .019), 0, haz_k, .004, g)
flat_mesh('poster art green bar', [[(.14, 1.1), (.69, 1.1), (.69, 1.2), (.14, 1.2)]], .0166, poster_green, g)
flat_mesh('poster paper pink', [[(.92, 1.3), (1.12, 1.3), (1.12, 1.75), (.92, 1.75)]], .0156, poster_c, g)
flat_mesh('poster paper white small', [[(-1.1, 1.45), (-1.0, 1.45), (-1.0, 1.75), (-1.1, 1.75)]], .0156, poster_a, g)
flat_mesh('poster curl corner', [[(.75, 1.9), (.61, 1.9), (.75, 1.76)]], .0184, poster_a, g)
for sx in (-1, 1):
    for ry in (.7, 1.45, 2.15):
        k.scyl('hoarding screw', .012, .008, (sx * 1.12, ry, .015), rot=(90, 0, 0), material=bar_steel, seg=8, parent=g)

# ======================= 9. Bunting (6 m string, 12 triangular flags in 2 colours) and two display poles =======================
g = k.sgroup('Bunting', (13.0, 3.0, 1.4))
sag = lambda x: -.3 * (1 - (x / 3.0) ** 2)
k.curve_tube('bunting string rope', [(-3 + i * .5, sag(-3 + i * .5), 0) for i in range(13)], [.008] * 13, bunt_s, res=4, parent=g)
for i in range(12):
    cx = -2.75 + i * .5; xl, xr = cx - .17, cx + .17
    tri = [(xl, sag(xl) - .01), (cx, sag(cx) - .36), (xr, sag(xr) - .01)]
    flat_mesh('bunting flag red' if i % 2 == 0 else 'bunting flag yellow', [tri], .0, bunt_r if i % 2 == 0 else bunt_y, g, thick=.004, smooth=True)
    k.sbox('bunting flag hem seam', (.34, .012, .002), (cx, sag(cx) - .02, .004), material=bunt_s, bevel=0, seg=1, parent=g)
for sx in (-1, 1):
    k.storus('bunting end loop', .03, .007, (sx * 3.0, .0, 0), (0, 90, 0), material=bunt_s, major=14, minor=6, parent=g)
for nm, px in [('Bunting pole', 10.0), ('Bunting pole', 16.0)]:
    pg = k.sgroup(nm, (px, 0, 1.4))
    k.stube('bunting pole wood', (0, 0, 0), (0, 3.15, 0), .045, pole_w, seg=14, r2=.034, parent=pg)
    k.scyl('bunting pole base concrete', .2, .12, (0, .06, 0), material=base_c, seg=20, bevel=.008, parent=pg)
    k.ssphere('bunting pole finial', .06, (0, 3.2, 0), (1, 1, 1), gold_m, 16, 10, pg)

# ======================= 10. Pigeon (0.3 m long) and Pigeon fainted (on its back, X eyes) =======================
def pigeon_standing(g):
    k.ssphere('pigeon body', 1, (0, .13, 0), (.055, .06, .1), pig_body, 24, 14, g)
    k.ssphere('pigeon breast', 1, (0, .14, .055), (.05, .052, .06), pig_light, 18, 12, g)
    k.ssphere('pigeon neck', 1, (0, .19, .09), (.034, .045, .036), pig_body, 14, 10, g)
    k.ssphere('pigeon head', .032, (0, .228, .108), (1, 1, 1.05), pig_body, 18, 12, g)
    for sx in (-1, 1):
        k.ssphere('pigeon neck sheen', 1, (sx * .024, .2, .092), (.014, .026, .022), pig_neck, 10, 8, g)
        k.ssphere('pigeon eye orange', .0078, (sx * .0245, .235, .118), (.7, 1, 1), pig_eye, 10, 8, g)
        k.ssphere('pigeon pupil', .0038, (sx * .029, .235, .12), (.5, 1, 1), pig_pupil, 8, 6, g)
        k.ssphere('pigeon wing', 1, (sx * .053, .14, -.015), (.014, .05, .092), pig_body, 14, 10, g)
        for j in range(2):
            k.sbox('pigeon wing bar feather', (.004, .012, .05), (sx * .0665, .15 - j * .022, -.02 - j * .012), material=pig_dark, bevel=.001, seg=1, parent=g)
        k.ssphere('pigeon wing tip', 1, (sx * .045, .118, -.098), (.011, .014, .04), pig_dark, 10, 8, g)
        k.stube('pigeon leg', (sx * .025, .1, .0), (sx * .025, .012, .015), .0062, pig_leg, seg=8, parent=g)
        for ang in (-.5, 0, .5):
            k.stube('pigeon toe', (sx * .025, .008, .015), (sx * .025 + math.sin(ang) * .03, .003, .015 + math.cos(ang) * .03), .0036, pig_leg, seg=6, parent=g)
        k.stube('pigeon toe back', (sx * .025, .008, .015), (sx * .025, .003, -.012), .0034, pig_leg, seg=6, parent=g)
    k.stube('pigeon beak', (0, .226, .134), (0, .221, .17), .0078, pig_beak, seg=8, r2=.0022, parent=g)
    k.ssphere('pigeon cere', .0075, (0, .231, .141), (1, .6, 1), pig_cere, 8, 6, g)
    k.sbox('pigeon tail', (.06, .008, .105), (0, .12, -.16), rot=(-8, 0, 0), material=pig_body, bevel=.003, parent=g)
    k.sbox('pigeon tail band feather', (.058, .009, .02), (0, .115, -.205), rot=(-8, 0, 0), material=pig_dark, bevel=.002, parent=g)
g = k.sgroup('Pigeon', (-9.6, 0, 1.4)); pigeon_standing(g)
g = k.sgroup('Pigeon fainted', (-8.8, 0, 1.4))
k.ssphere('pigeon body', 1, (0, .06, 0), (.055, .06, .1), pig_body, 24, 14, g)
k.ssphere('pigeon breast', 1, (0, .085, .0), (.046, .04, .085), pig_light, 18, 12, g)
k.ssphere('pigeon neck', 1, (0, .045, .115), (.034, .036, .045), pig_body, 14, 10, g)
k.ssphere('pigeon head', .032, (0, .04, .162), (1, 1, 1.05), pig_body, 18, 12, g)
k.stube('pigeon beak', (0, .052, .188), (0, .078, .216), .0075, pig_beak, seg=8, r2=.002, parent=g)
k.stube('pigeon beak lower', (0, .04, .188), (0, .052, .212), .0055, pig_beak, seg=8, r2=.002, parent=g)
k.ssphere('pigeon cere', .0075, (0, .066, .194), (1, .6, 1), pig_cere, 8, 6, g)
for sx in (-1, 1):
    k.ssphere('pigeon eye white', .0095, (sx * .02, .066, .156), (1, .55, 1), pig_cere, 10, 8, g)
    for r in (45, -45):
        k.sbox('pigeon X eye ink', (.02, .003, .0042), (sx * .02, .0725, .156), rot=(0, r, 0), material=pig_x, bevel=0, seg=1, parent=g)
    k.ssphere('pigeon neck sheen', 1, (sx * .024, .05, .108), (.014, .02, .02), pig_neck, 10, 8, g)
    k.ssphere('pigeon wing', 1, (sx * .125, .014, -.01), (.07, .012, .09), pig_body, 16, 10, g)
    for j in range(2):
        k.sbox('pigeon wing bar feather', (.05, .004, .01), (sx * (.12 + j * .012), .026, -.02 - j * .028), material=pig_dark, bevel=.001, seg=1, parent=g)
    k.ssphere('pigeon wing tip', 1, (sx * .185, .012, -.02), (.035, .01, .04), pig_dark, 10, 8, g)
    k.stube('pigeon leg', (sx * .025, .105, .0), (sx * .03, .225, .012), .0062, pig_leg, seg=8, parent=g)
    for ang in (-.5, 0, .5):
        k.stube('pigeon toe', (sx * .03, .225, .012), (sx * .03 + math.sin(ang) * .028, .245, .012 + math.cos(ang) * .026), .0036, pig_leg, seg=6, parent=g)
k.sbox('pigeon tail', (.06, .008, .105), (0, .012, -.165), material=pig_body, bevel=.003, parent=g)
k.sbox('pigeon tail band feather', (.058, .009, .02), (0, .013, -.215), material=pig_dark, bevel=.002, parent=g)
for ang in (0, 120, 240):
    a = math.radians(ang + 20)
    k.scyl('pigeon dizzy star', .018, .004, (.09 * math.cos(a), .19 + .02 * math.sin(a * 2), .16 + .07 * math.sin(a)), rot=(60, 0, 0), material=pig_star, seg=5, parent=g)

# ======================= 11. Wallet (0.12 m panels, empty open slot) and Fly (0.015 m) =======================
g = k.sgroup('Wallet', (-7.8, 0, 1.4))
for sx, nm in [(-1, 'left'), (1, 'right')]:
    cx = sx * .063
    k.sbox('wallet panel outer ' + nm, (.12, .095, .006), (cx, .0475, 0), material=leather, bevel=.002, parent=g)
    k.sbox('wallet lining ' + nm, (.113, .088, .002), (cx, .0475, .004), material=lining, bevel=.0005, seg=1, parent=g)
    s = k.sbox('wallet stitch top', (.006, .0016, .0013), (cx - .052, .0905, .0055), material=thread, bevel=0, seg=1, parent=g); k.array(s, 17, (.0062, 0, 0))
    s = k.sbox('wallet stitch bottom', (.006, .0016, .0013), (cx - .052, .0045, .0055), material=thread, bevel=0, seg=1, parent=g); k.array(s, 17, (.0062, 0, 0))
    s = k.sbox('wallet stitch side', (.0016, .006, .0013), (cx + sx * .0545, .008, .0055), material=thread, bevel=0, seg=1, parent=g); k.array(s, 14, (0, 0, .0062))
k.scyl('wallet spine', .004, .095, (0, .0475, .0), material=leather, seg=10, parent=g)
for j in range(3):
    y = .018 + j * .026
    k.sbox('wallet card slot pocket', (.108, .024, .003), (-.063, y, .0075), material=pocket, bevel=.0008, seg=1, parent=g)
    k.sbox('wallet slot dark gap', (.106, .0025, .0012), (-.063, y + .0125, .0062), material=dark_slot, bevel=0, seg=1, parent=g)
k.sbox('wallet empty slot interior', (.108, .058, .0014), (.063, .043, .0052), material=dark_slot, bevel=0, seg=1, parent=g)
k.sbox('wallet bill pocket flap', (.108, .036, .003), (.063, .024, .0085), material=pocket, bevel=.0008, seg=1, parent=g)
k.sbox('wallet slot lip', (.108, .004, .004), (.063, .043, .0085), material=leather, bevel=.001, seg=1, parent=g)
k.scyl('wallet snap', .0055, .003, (.108, .04, .0072), rot=(90, 0, 0), material=snap_m, seg=14, parent=g)
g = k.sgroup('Fly', (-7.0, .05, 1.4))
k.ssphere('fly abdomen', 1, (0, .0042, -.0036), (.0022, .0021, .0043), fly_body, 12, 8, g)
for j in range(2):
    k.storus('fly abdomen stripe', .0021, .0003, (0, .0042, -.0036 - j * .002 + .0015), (90, 0, 0), material=M('fly stripe grey', '#6a6a72', .5), major=12, minor=4, parent=g)
k.ssphere('fly thorax', 1, (0, .0052, .0007), (.0026, .0026, .0026), fly_body, 12, 8, g)
k.ssphere('fly head', .0019, (0, .005, .0036), (1.1, 1, 1), fly_body, 12, 8, g)
for sx in (-1, 1):
    k.ssphere('fly eye red', .0015, (sx * .0013, .0054, .0042), (1, 1.1, 1), fly_eye, 10, 8, g)
    wg = k.sgroup('Fly wing ' + ('L' if sx < 0 else 'R'), (sx * .0016, .0076, .0004), parent=g)
    k.ssphere('fly wing glass', 1, (sx * .0028, .0002, -.0032), (.0035, .00025, .0066), fly_wing, 10, 6, wg)
    for i, zl in enumerate((.0012, 0, -.0014)):
        k.stube('fly leg', (sx * .0012, .0042, zl), (sx * .0034, .0018, zl + .001), .00028, fly_leg, seg=5, parent=g)
        k.stube('fly leg lower', (sx * .0034, .0018, zl + .001), (sx * .0042, .0, zl + .0016), .00022, fly_leg, seg=5, parent=g)
k.stube('fly proboscis', (0, .0046, .0052), (0, .0036, .0066), .00025, fly_leg, seg=5, parent=g)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/town-dressing.glb'))
PV = os.environ['PREVIEW_DIR']
k.preview(PV, size=(640, 360), target=(1, 2, 1.6), dist=30, views=[(0, -1, .1)], prefix='a')
k.preview(PV, size=(640, 360), target=(-9.2, -1.4, .12), dist=1.3, views=[(.3, -1, .4)], prefix='b')
k.preview(PV, size=(640, 360), target=(-7.8, -1.4, .05), dist=.4, views=[(.2, -1, .5)], prefix='c')
k.preview(PV, size=(640, 360), target=(-8, 1.5, 1.4), dist=8, views=[(.2, -1, .15)], prefix='d')
k.preview(PV, size=(640, 360), target=(4.5, 4, 2.4), dist=9, views=[(.3, -1, .1)], prefix='e')
