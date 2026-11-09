# Pete's skinny tower, modelled in Blender. Real size: 18 storeys of 4.0 m = 72 m, footprint 12 m x 12 m (slenderness 6:1), origin at ground centre, front (+z in the scene) faces the camera.
# Floor slabs 'Floor 01'..'Floor 18' (slab top of floor n at y = 4 (n-1), 0.35 m thick). Slabs 16, 17, 18 have a round 6.4 m hole in the middle; 'Slab plug 16' and 'Slab plug 17' fill holes 16 and 17 (hide them when Pete drills through).
# The roof slab underside is at y = 72 (the golden ball hangs from a pivot there, centre of the plan).
# Groups: Frame (columns, edge fins, roof), Floors, Facade left/right/back, Facade front lower (storeys 2-14), Lobby (storey 1 front, Door L, Door R, Canopy), Cutaway front (front wall of storeys 15-18: hide it for interior shots),
#   Elevator shaft (glass shaft on the front right, x 2.25..4.55) with Elevator car (origin at its floor, 1.6 m inner width), Banner mount (empty anchor on the front at y 6.05), Roof equipment (mechanical box, lightning rod).
import sys, os, math
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector, Matrix

k.reset('tower-pete')
FH = 4.0; ST = .35; N = 18
Y = lambda n: FH * (n - 1)       # slab top of floor n

# ---- materials (after the reset) ----
cream = k.mat('concrete cream', '#f1e2c0', .85)
slabc = k.mat('concrete slab grey', '#a9afb6', .9)
roofc = k.mat('concrete roof', '#8f959c', .9)
spand = k.mat('plaster teal spandrel', '#1f8f94', .6)
glass = k.mat('glass blue', '#8fd4f2', .08, .1)
glass_d = k.mat('glass door', '#a6e0f6', .08, .1)
glass_c = k.mat('glass cab', '#b6e6f8', .08, .1)
glass_s = k.mat('glass shaft', '#8fd4f2', .08, .1)
mull = k.mat('metal mullion dark', '#2b3441', .45, .6)
alu = k.mat('metal aluminium frame', '#b9c2cc', .35, .8)
steel = k.mat('steel galvanized', '#aab4be', .42, .85)
steel_d = k.mat('steel dark', '#4b5663', .45, .8)
steel_c = k.mat('steel chrome', '#dfe5ec', .16, .95)
floorh = k.mat('floor honey', '#d9a45f', .6)
floord = k.mat('floor dark', '#7d5a3d', .7)
tile = k.mat('tile lobby floor', '#ece4d2', .35)
canopy_m = k.mat('metal canopy red', '#e03a2e', .45, .5)
gold = k.mat('gold numeral', '#ffc12a', .28, .9)
sign_lit = k.mat('sign lit', '#d6ffe0', .5, emit='#5dff94', emit_strength=2.2)
light_lit = k.mat('light panel lit', '#fff3d0', .5, emit='#ffe9b0', emit_strength=1.6)
btn_lit = k.mat('button lit', '#ffd27a', .5, emit='#ffb640', emit_strength=2.0)
rubber = k.mat('rubber door mat', '#2a2d33', .9)
wood = k.mat('wood reception', '#8a5a34', .7)
plasterw = k.mat('plaster lobby wall', '#f4efe6', .85)
leafm = k.mat('plant leaf', '#3fae5a', .6)
potm = k.mat('plant pot', '#d46a3a', .7)
benchm = k.mat('fabric lobby bench', '#2f6fd0', .9)
red = k.mat('steel paint red', '#d9382c', .45, .3)
yellow = k.mat('steel paint yellow', '#f0b821', .5, .3)

def B2S(b): return (b[0], b[2], -b[1])
def cut(o, cutter):
    m = o.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cutter; m.solver = 'EXACT'
    with bpy.context.temp_override(object=o, active_object=o):
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
def arr(o, n, off, name='Array'): return k.array(o, n, off, name)
UP = (0, 0, FH)

frame = k.sgroup('Frame'); floors = k.sgroup('Floors')
fl = k.sgroup('Facade left'); fr_ = k.sgroup('Facade right'); fb = k.sgroup('Facade back'); ff = k.sgroup('Facade front lower')
lobby = k.sgroup('Lobby'); cutg = k.sgroup('Cutaway front'); shaft = k.sgroup('Elevator shaft'); roofg = k.sgroup('Roof equipment')
interior = k.sgroup('Interior')

# ---- floor slabs ----
for n in range(1, N + 1):
    s = k.sbox('Floor %02d' % n, (12, ST, 12), (0, Y(n) - ST / 2, 0), material=slabc, bevel=0 if n >= 16 else .006, parent=floors)
    if n >= 16: cut(s, k.scyl('cutter', 3.2, 1.0, (0, Y(n) - ST / 2, 0), material=slabc, seg=64))
# floor finishes: lobby tile, office floors 2-14 (dark boards), top storeys 15-18 (honey boards, visible in the cutaway)
k.sbox('lobby tile floor', (11.7, .02, 11.7), (0, .01, 0), material=tile, bevel=0, parent=floors)
arr(k.sbox('office floor finish', (11.7, .03, 11.7), (0, Y(2) + .015, 0), material=floord, bevel=0, parent=floors), 13, (0, 0, FH))
for n in range(15, N + 1):
    f = k.sbox('floor finish %02d' % n, (11.7, .03, 11.7), (0, Y(n) + .015, 0), material=floorh, bevel=0, parent=floors)
    if n >= 16: cut(f, k.scyl('cutter', 3.2, 1.0, (0, Y(n), 0), material=floorh, seg=64))
for n in (16, 17, 18):
    k.storus('hole collar', 3.22, .05, (0, Y(n) + .03, 0), (90, 0, 0), steel, major=96, minor=10, parent=floors)
    if n == 18:
        for j in range(12):
            a = j * math.tau / 12
            k.scyl('hole collar bolt', .04, .04, (3.4 * math.cos(a), Y(n) + .02, 3.4 * math.sin(a)), material=steel_d, seg=6, parent=floors)
for n in (16, 17):
    pg = k.sgroup('Slab plug %d' % n)
    k.scyl('slab plug disc', 3.18, ST, (0, Y(n) - ST / 2, 0), material=slabc, seg=64, bevel=.004, parent=pg)
    k.scyl('slab plug finish', 3.18, .03, (0, Y(n) + .015, 0), material=floorh, seg=64, parent=pg)
    k.storus('slab plug mark', 1.4, .015, (0, Y(n) + .035, 0), (90, 0, 0), steel_d, major=64, minor=6, parent=pg)
    k.sbox('slab plug mark', (2.6, .012, .04), (0, Y(n) + .036, 0), material=steel_d, bevel=0, parent=pg)
    k.sbox('slab plug mark', (.04, .012, 2.6), (0, Y(n) + .036, 0), material=steel_d, bevel=0, parent=pg)

# ---- frame: corner columns, slab edge fins, plinth, roof slab, fascia, parapet ----
for sx in (-1, 1):
    for sz in (-1, 1):
        k.sbox('corner column', (.55, 72.4, .55), (sx * 5.725, 36.2, sz * 5.725), material=cream, bevel=.01, parent=frame)
arr(k.sbox('slab edge fin front', (12.24, .5, .14), (0, -.2, 6.07), material=cream, bevel=.01, parent=frame), N, UP)
arr(k.sbox('slab edge fin back', (12.24, .5, .14), (0, -.2, -6.07), material=cream, bevel=.01, parent=frame), N, UP)
arr(k.sbox('slab edge fin left', (.14, .5, 12.24), (-6.07, -.2, 0), material=cream, bevel=.01, parent=frame), N, UP)
arr(k.sbox('slab edge fin right', (.14, .5, 12.24), (6.07, -.2, 0), material=cream, bevel=.01, parent=frame), N, UP)
k.sbox('facade plinth', (11, .5, .16), (0, .25, -5.96), material=cream, bevel=.01, parent=frame)
k.sbox('facade plinth', (.16, .5, 11), (-5.96, .25, 0), material=cream, bevel=.01, parent=frame)
k.sbox('facade plinth', (.16, .5, 11), (5.96, .25, 0), material=cream, bevel=.01, parent=frame)
k.sbox('lobby plinth', (2.8, .5, .16), (-4.1, .25, 5.96), material=cream, bevel=.01, parent=lobby)
k.sbox('lobby plinth', (6.2, .5, .16), (2.4, .25, 5.96), material=cream, bevel=.01, parent=lobby)
k.sbox('Roof slab', (12, .4, 12), (0, 72.2, 0), material=roofc, bevel=.01, parent=frame)
for nm, sz, loc in [('roof fascia front', (12.3, .85, .2), (0, 71.975, 6.05)), ('roof fascia back', (12.3, .85, .2), (0, 71.975, -6.05)),
                    ('roof fascia left', (.2, .85, 12.3), (-6.05, 71.975, 0)), ('roof fascia right', (.2, .85, 12.3), (6.05, 71.975, 0))]:
    k.sbox(nm, sz, loc, material=cream, bevel=.01, parent=frame)
for nm, sz, loc in [('parapet front', (11.4, .9, .3), (0, 72.85, 5.85)), ('parapet back', (11.4, .9, .3), (0, 72.85, -5.85)),
                    ('parapet left', (.3, .9, 11.4), (-5.85, 72.85, 0)), ('parapet right', (.3, .9, 11.4), (5.85, 72.85, 0))]:
    k.sbox(nm, sz, loc, material=cream, bevel=.01, parent=roofg)
for nm, sz, loc in [('parapet coping front', (12.2, .08, .5), (0, 73.34, 5.9)), ('parapet coping back', (12.2, .08, .5), (0, 73.34, -5.9)),
                    ('parapet coping left', (.5, .08, 11.4), (-5.9, 73.34, 0)), ('parapet coping right', (.5, .08, 11.4), (5.9, 73.34, 0))]:
    k.sbox(nm, sz, loc, material=slabc, bevel=.008, parent=roofg)
for sx in (-1, 1):
    for sz in (-1, 1):
        k.sbox('parapet corner post', (.5, 1.1, .5), (sx * 5.75, 72.95, sz * 5.75), material=cream, bevel=.012, parent=roofg)

# ---- facades. Per storey n (slab top y = Y(n)): spandrel y+.05..y+.9, glass y+.9..y+3.55, mullions every 1.375 m, sills ----
def facade(face, g, n0, count, glass_name):
    y0 = Y(n0)
    if face in ('front', 'back'):
        z = 6 if face == 'front' else -6; s = 1 if face == 'front' else -1
        arr(k.sbox('spandrel panel ' + face, (11, .85, .14), (0, y0 + .475, s * 5.95), material=spand, bevel=.006, parent=g), count, UP)
        arr(k.sbox(glass_name + face, (11, 2.65, .04), (0, y0 + 2.225, s * 5.97), material=glass, bevel=0, parent=g), count, UP)
        m = k.sbox('mullion ' + face, (.07, 2.65, .12), (-5.5 + 1.375, y0 + 2.225, s * 6.03), material=mull, bevel=.004, parent=g)
        arr(m, 7, (1.375, 0, 0), 'ArrayX'); arr(m, count, UP, 'ArrayZ')
        arr(k.sbox('window sill ' + face, (11.1, .05, .22), (0, y0 + .925, s * 6.04), material=steel, bevel=.004, parent=g), count, UP)
        arr(k.sbox('window head ' + face, (11.1, .07, .16), (0, y0 + 3.52, s * 6.02), material=mull, bevel=.004, parent=g), count, UP)
    else:
        x = 6 if face == 'right' else -6; s = 1 if face == 'right' else -1
        arr(k.sbox('spandrel panel ' + face, (.14, .85, 11), (s * 5.95, y0 + .475, 0), material=spand, bevel=.006, parent=g), count, UP)
        arr(k.sbox(glass_name + face, (.04, 2.65, 11), (s * 5.97, y0 + 2.225, 0), material=glass, bevel=0, parent=g), count, UP)
        m = k.sbox('mullion ' + face, (.12, 2.65, .07), (s * 6.03, y0 + 2.225, -5.5 + 1.375), material=mull, bevel=.004, parent=g)
        arr(m, 7, (0, -1.375, 0), 'ArrayX'); arr(m, count, UP, 'ArrayZ')
        arr(k.sbox('window sill ' + face, (.22, .05, 11.1), (s * 6.04, y0 + .925, 0), material=steel, bevel=.004, parent=g), count, UP)
        arr(k.sbox('window head ' + face, (.16, .07, 11.1), (s * 6.02, y0 + 3.52, 0), material=mull, bevel=.004, parent=g), count, UP)
facade('left', fl, 1, N, 'glazing pane '); facade('right', fr_, 1, N, 'glazing pane '); facade('back', fb, 1, N, 'glazing pane ')
facade('front', ff, 2, 13, 'glazing pane '); facade('front', cutg, 15, 4, 'glazing pane ')
# window-cleaning rails (vertical steel tubes on stand-offs) on every face; the front ones are split at storey 15 (the upper piece belongs to the cutaway)
def rail(name, a, b, g):
    k.stube(name, a, b, .03, steel_c, 12, None, g)
    k.ssphere(name + ' cap', .045, a, material=steel_c, seg=12, rings=8, parent=g); k.ssphere(name + ' cap', .045, b, material=steel_c, seg=12, rings=8, parent=g)
for x in (-5.15, 1.6):
    rail('window cleaning rail', (x, 3.9, 6.35), (x, 55.6, 6.35), ff)
    rail('window cleaning rail', (x, 55.7, 6.35), (x, 72.9, 6.35), cutg)
    arr(k.sbox('rail standoff', (.06, .06, .26), (x, Y(2) + 2.2, 6.22), material=steel, bevel=.004, parent=ff), 13, UP)
    arr(k.sbox('rail standoff', (.06, .06, .26), (x, Y(15) + 2.2, 6.22), material=steel, bevel=.004, parent=cutg), 4, UP)
for z in (-4.2, 4.2):
    rail('window cleaning rail', (6.35, 3.9, z), (6.35, 72.9, z), fr_); rail('window cleaning rail', (-6.35, 3.9, z), (-6.35, 72.9, z), fl)
    arr(k.sbox('rail standoff', (.26, .06, .06), (6.22, 2.2, z), material=steel, bevel=.004, parent=fr_), N, UP)
    arr(k.sbox('rail standoff', (.26, .06, .06), (-6.22, 2.2, z), material=steel, bevel=.004, parent=fl), N, UP)
    rail('window cleaning rail', (z, 3.9, -6.35), (z, 72.9, -6.35), fb)
    arr(k.sbox('rail standoff', (.06, .06, .26), (z, 2.2, -6.22), material=steel, bevel=.004, parent=fb), N, UP)

# ---- interior: service core in the back left corner, ceiling lights (storeys 1-15) ----
arr(k.sbox('interior core wall', (2.6, 3.55, .16), (-4.6, 1.775, -4.4), material=plasterw, bevel=.006, parent=interior), N, UP)
arr(k.sbox('interior core wall', (.16, 3.55, 1.6), (-3.3, 1.775, -5.2), material=plasterw, bevel=.006, parent=interior), N, UP)
arr(k.sbox('interior core door', (.9, 2.1, .06), (-4.6, 1.05, -4.3), material=steel, bevel=.006, parent=interior), N, UP)
arr(k.sbox('interior core door frame', (1.0, .06, .08), (-4.6, 2.13, -4.34), material=steel_d, bevel=.004, parent=interior), N, UP)
lp = k.sbox('ceiling light panel', (1.4, .04, .45), (-3, 3.55, -2.4), material=light_lit, bevel=.004, parent=interior)
arr(lp, 2, (6, 0, 0), 'ArrayX'); arr(lp, 2, (0, -4.8, 0), 'ArrayY'); arr(lp, 15, UP, 'ArrayZ')

# ---- lobby front (storey 1): glazing, transom, door opening x -2.7..-0.7 (2.0 wide, 2.2 high), double glass door, canopy, number ----
DX = -1.7
k.sbox('lobby glazing pane left', (2.8, 3.05, .04), (-4.1, 2.025, 5.97), material=glass, bevel=0, parent=lobby)
k.sbox('lobby glazing pane right', (6.2, 3.05, .04), (2.4, 2.025, 5.97), material=glass, bevel=0, parent=lobby)
k.sbox('lobby glazing pane transom', (2.0, 1.3, .04), (DX, 2.9, 5.97), material=glass, bevel=0, parent=lobby)
k.sbox('lobby transom bar', (11, .1, .14), (0, 2.3, 6.04), material=mull, bevel=.005, parent=lobby)
k.sbox('lobby head bar', (11, .08, .14), (0, 3.52, 6.04), material=mull, bevel=.005, parent=lobby)
k.sbox('lobby sill bar', (4.8, .06, .14), (-3.1, .53, 6.04), material=mull, bevel=.005, parent=lobby)
for x in (-4.1, .7, 2.1, 3.5, -2.7, -.7):
    k.sbox('lobby mullion', (.08, 3.05 if x not in (-2.7, -.7) else 1.2, .14), (x, 2.025 if x not in (-2.7, -.7) else 2.9, 6.04), material=mull, bevel=.005, parent=lobby)
for x in (-2.7, -.7):
    k.sbox('door jamb', (.1, 2.25, .18), (x, 1.125, 6.03), material=alu, bevel=.006, parent=lobby)
k.sbox('door header', (2.1, .1, .18), (DX, 2.25, 6.03), material=alu, bevel=.006, parent=lobby)
k.sbox('door threshold', (2.0, .03, .34), (DX, .015, 6.1), material=steel, bevel=.004, parent=lobby)
k.sbox('door mat', (1.7, .015, .9), (DX, .008, 6.75), material=rubber, bevel=.004, parent=lobby)
def leaf(name, hx, sgn):
    g = k.sgroup(name, loc=(hx, 0, 6.03), parent=lobby)
    w = .95
    cx = sgn * w / 2
    k.sbox('door leaf stile', (.08, 2.2, .06), (sgn * .04, 1.1, 0), material=alu, bevel=.004, parent=g)
    k.sbox('door leaf stile', (.08, 2.2, .06), (sgn * (w - .04), 1.1, 0), material=alu, bevel=.004, parent=g)
    k.sbox('door leaf top rail', (w, .1, .06), (cx, 2.15, 0), material=alu, bevel=.004, parent=g)
    k.sbox('door leaf kick plate', (w, .3, .07), (cx, .15, 0), material=steel_c, bevel=.004, parent=g)
    k.sbox('door leaf mid rail', (w, .06, .06), (cx, 1.0, 0), material=alu, bevel=.004, parent=g)
    k.sbox('glass door pane', (w - .12, 1.7, .025), (cx, 1.2, 0), material=glass_d, bevel=0, parent=g)
    hxp = sgn * (w - .14)
    k.stube('door push handle', (hxp, .75, .1), (hxp, 1.35, .1), .018, steel_c, 12, None, g)
    for y in (.8, 1.3): k.sbox('door handle post', (.03, .03, .1), (hxp, y, .05), material=steel_c, bevel=.003, parent=g)
    k.sbox('door hinge', (.05, .12, .08), (sgn * .02, .3, 0), material=steel_d, bevel=.003, parent=g)
    k.sbox('door hinge', (.05, .12, .08), (sgn * .02, 1.9, 0), material=steel_d, bevel=.003, parent=g)
leaf('Door L', -2.7 + .02, 1); leaf('Door R', -.7 - .02, -1)
cn = k.sgroup('Canopy', parent=lobby)
k.sbox('canopy top plate', (5.4, .14, 2.7), (DX, 3.0, 7.35), material=canopy_m, bevel=.01, parent=cn)
k.sbox('canopy fascia', (5.4, .45, .12), (DX, 3.0, 8.7), material=canopy_m, bevel=.01, parent=cn)
for s in (-1, 1): k.sbox('canopy fascia side', (.12, .45, 2.7), (DX + s * 2.7, 3.0, 7.35), material=canopy_m, bevel=.01, parent=cn)
k.sbox('canopy wall plate', (5.4, .3, .1), (DX, 3.1, 6.12), material=steel_d, bevel=.006, parent=cn)
for x in (DX - 2.4, DX + 2.4):
    k.stube('canopy hanger rod', (x, 4.1, 6.12), (x, 3.05, 8.55), .028, steel_c, 12, None, cn)
    k.ssphere('canopy hanger eye', .05, (x, 4.1, 6.12), material=steel_c, seg=12, rings=8, parent=cn)
for x in (DX - 1.6, DX, DX + 1.6): k.scyl('canopy downlight lamp', .1, .03, (x, 2.92, 7.6), material=light_lit, seg=20, parent=cn)
k.sbox('house number plate', (1.0, .5, .05), (DX, 3.02, 8.76), material=steel_d, bevel=.008, parent=cn)
k.stext('house numeral 7', '7', .4, (DX, 2.9, 8.8), 0, gold, .03, cn)
# lobby fittings seen through the glass
k.sbox('reception desk panel', (2.8, 1.0, .8), (-3.4, .5, 2.6), material=wood, bevel=.01, parent=lobby)
k.sbox('reception desk top', (3.0, .06, 1.0), (-3.4, 1.03, 2.6), material=plasterw, bevel=.006, parent=lobby)
k.sbox('lobby bench seat', (2.0, .1, .55), (.9, .45, 4.5), material=benchm, bevel=.02, parent=lobby)
for x in (-.05, 1.85): k.sbox('lobby bench leg', (.06, .4, .45), (x, .2, 4.5), material=steel_d, bevel=.004, parent=lobby)
for x in (-5.0, 1.2):
    k.scyl('lobby plant pot', .3, .55, (x, .275, 4.7), material=potm, r2=.22, seg=24, parent=lobby)
    for dx, dz, r in ((0, 0, .5), (.18, .1, .35), (-.15, -.1, .38)): k.ssphere('lobby plant leaf', r, (x + dx, 1.05 + r * .3, 4.7 + dz), (1, .9, 1), leafm, 14, 10, lobby)

# ---- banner mount: an empty anchor at the front, y 6.05, plus the rail hardware ----
bm = k.sgroup('Banner mount', loc=(DX, 6.05, 6.25))
k.sbox('banner rail top', (5.8, .08, .1), (0, 1.2, 0), material=steel_d, bevel=.005, parent=bm)
k.sbox('banner rail bottom', (5.8, .06, .06), (0, -1.2, 0), material=steel_d, bevel=.005, parent=bm)
for x in (-2.7, -1.35, 0, 1.35, 2.7):
    k.sbox('banner standoff', (.06, .06, .2), (x, 1.2, -.1), material=steel, bevel=.004, parent=bm)
for x in (-2.8, -1.4, 0, 1.4, 2.8):
    k.storus('banner eyelet', .04, .012, (x, 1.12, .06), (0, 0, 0), steel_c, major=16, minor=6, parent=bm)
    k.storus('banner eyelet', .04, .012, (x, -1.12, .06), (0, 0, 0), steel_c, major=16, minor=6, parent=bm)

# ---- glass elevator shaft on the front right (outer x 2.25..4.55, z 6.1..8.3), top at y 73.4 ----
SX, SZ = 3.4, 7.2
for x in (2.33, 4.47):
    for z in (6.18, 8.22):
        k.sbox('shaft post', (.16, 73.3, .16), (x, 36.65, z), material=mull, bevel=.006, parent=shaft)
k.sbox('shaft base plinth', (2.5, .3, 2.4), (SX, .15, SZ), material=cream, bevel=.01, parent=shaft)
k.sbox('shaft roof slab', (2.5, .25, 2.4), (SX, 73.43, SZ), material=roofc, bevel=.01, parent=shaft)
k.sbox('shaft roof cap', (2.7, .1, 2.6), (SX, 73.62, SZ), material=steel_d, bevel=.01, parent=shaft)
arr(k.sbox('shaft glazing pane front', (2.1, 3.2, .03), (SX, 2.0, 8.25), material=glass_s, bevel=0, parent=shaft), N, UP)
for x in (2.27, 4.53): arr(k.sbox('shaft glazing pane side', (.03, 3.2, 1.9), (x, 2.0, SZ), material=glass_s, bevel=0, parent=shaft), N, UP)
arr(k.sbox('shaft transom front', (2.3, .12, .18), (SX, 0.35, 8.25), material=mull, bevel=.004, parent=shaft), N, UP)
for x in (2.27, 4.53): arr(k.sbox('shaft transom side', (.18, .12, 2.1), (x, .35, SZ), material=mull, bevel=.004, parent=shaft), N, UP)
arr(k.sbox('shaft transom front', (2.3, .12, .18), (SX, 3.65, 8.25), material=mull, bevel=.004, parent=shaft), N, UP)
k.sbox('shaft mullion', (.06, 73, .1), (SX, 36.5, 8.27), material=mull, bevel=.004, parent=shaft)
for x in (2.25, 4.55): k.sbox('shaft mullion', (.1, 73, .06), (x, 36.5, SZ), material=mull, bevel=.004, parent=shaft)
for x in (2.43, 4.37):
    k.sbox('elevator guide rail', (.06, 73, .14), (x, 36.6, SZ), material=steel, bevel=.004, parent=shaft)
    arr(k.sbox('elevator rail bracket', (.1, .1, .6 if False else .3), (x + (.04 if x < 3.4 else -.04), 1.2, SZ), material=steel_d, bevel=.004, parent=shaft), N, UP)
    arr(k.sbox('elevator rail fishplate', (.09, .5, .18), (x, 3.0, SZ), material=steel_d, bevel=.004, parent=shaft), N, UP)
arr(k.sbox('landing door frame', (1.2, 2.2, .08), (SX, 1.1, 6.26), material=steel_d, bevel=.006, parent=shaft), N, UP)
arr(k.sbox('landing door panel', (1.0, 2.1, .05), (SX, 1.05, 6.31), material=steel, bevel=.006, parent=shaft), N, UP)
arr(k.sbox('landing call panel', (.12, .24, .03), (SX + .75, 1.1, 6.3), material=steel_c, bevel=.004, parent=shaft), N, UP)
arr(k.scyl('landing call button', .02, .02, (SX + .75, 1.14, 6.32), (90, 0, 0), btn_lit, seg=12, parent=shaft), N, UP)
k.sbox('lift door sign board', (1.0, .38, .06), (SX, 2.8, 8.36), material=steel_d, bevel=.008, parent=shaft)
k.sbox('lift door sign lit panel', (.9, .3, .02), (SX, 2.8, 8.4), material=sign_lit, bevel=.004, parent=shaft)
k.stext('lift sign text', 'LIFT', .17, (SX - .15, 2.8, 8.41), 0, steel_d, .006, shaft)
k.sbox('lift sign arrow', (.12, .12, .006), (SX + .32, 2.8, 8.415), (0, 0, 45), steel_d, bevel=0, parent=shaft)
for y in (73.9,):
    k.sbox('lift motor housing', (1.6, .6, 1.4), (SX, 74.0, SZ), material=steel_d, bevel=.015, parent=shaft)
    k.scyl('lift sheave', .35, .2, (SX, 74.55, SZ), (0, 0, 90), steel_c, 32, parent=shaft)

# ---- Elevator car: origin at its floor, 1.6 m inner width, moved in Y by the scene ----
car = k.sgroup('Elevator car', loc=(SX, 0, SZ), parent=shaft)
k.sbox('car floor plate', (1.8, .08, 1.6), (0, -.04, 0), material=steel_d, bevel=.006, parent=car)
k.sbox('car floor mat', (1.55, .01, 1.3), (0, .005, 0), material=rubber, bevel=0, parent=car)
for x in (-.88, .88):
    for z in (-.78, .78): k.sbox('car corner post', (.06, 2.45, .06), (x, 1.225, z), material=alu, bevel=.004, parent=car)
for s in (-1, 1):
    k.sbox('car glazing pane side', (.03, 2.3, 1.5), (s * .87, 1.2, 0), material=glass_c, bevel=0, parent=car)
    k.sbox('car side rail', (.05, .06, 1.6), (s * .88, 1.15, 0), material=alu, bevel=.003, parent=car)
k.sbox('car glazing pane back', (1.7, 2.3, .03), (0, 1.2, .79), material=glass_c, bevel=0, parent=car)
for s in (-1, 1):
    k.sbox('car door panel', (.76, 2.1, .04), (s * .39, 1.05, -.79), material=steel, bevel=.005, parent=car)
    k.sbox('car door glass strip', (.2, 1.3, .045), (s * .39, 1.3, -.79), material=glass_c, bevel=0, parent=car)
k.sbox('car door sill', (1.7, .04, .12), (0, .02, -.78), material=steel_c, bevel=.003, parent=car)
k.sbox('car ceiling', (1.8, .08, 1.6), (0, 2.45, 0), material=steel_d, bevel=.006, parent=car)
k.sbox('car ceiling light panel', (1.0, .02, .7), (0, 2.405, 0), material=light_lit, bevel=0, parent=car)
k.sbox('car display lit', (.28, .1, .03), (0, 2.25, -.78), material=sign_lit, bevel=.003, parent=car)
for s in (-1, 1): k.stube('car handrail', (s * .82, .95, -.6), (s * .82, .95, .7), .02, steel_c, 12, None, car)
k.stube('car handrail', (-.82, .95, .72), (.82, .95, .72), .02, steel_c, 12, None, car)
for s in (-1, 1):
    for z in (-.5, .6): k.sbox('car handrail bracket', (.06, .02, .02), (s * .84, .95, z), material=steel_c, bevel=.002, parent=car)
k.sbox('car control panel', (.03, .7, .24), (.84, 1.2, -.55), material=steel_c, bevel=.004, parent=car)
for i in range(6): k.scyl('car button lit', .022, .015, (.855, 1.0 + (i // 2) * .13 + .06, -.62 + (i % 2) * .09), (0, 0, 90), btn_lit, seg=12, parent=car)
k.sbox('car crosshead', (1.9, .2, .3), (0, 2.65, 0), material=yellow, bevel=.01, parent=car)
for s in (-1, 1):
    k.stube('car hanger rod', (s * .8, 2.45, 0), (s * .5, 2.9, 0), .025, steel, 10, None, car)
    k.sbox('car guide shoe', (.12, .26, .22), (s * .92, 2.2, 0), material=steel_d, bevel=.005, parent=car)
    k.sbox('car guide shoe', (.12, .26, .22), (s * .92, .2, 0), material=steel_d, bevel=.005, parent=car)
for dx in (-.15, .15): k.stube('car suspension rope', (dx, 2.75, 0), (dx, 4.4, 0), .018, steel_c, 8, None, car)

# ---- roof equipment: mechanical box, louvers, AC units, stacks, antenna, lightning rod, cleaning gantry ----
MB = (-2.0, 72.4, -2.2)
k.sbox('mechanical box', (5.4, 2.8, 3.4), (MB[0], MB[1] + 1.4, MB[2]), material=slabc, bevel=.02, parent=roofg)
k.sbox('mechanical box cap', (5.7, .16, 3.7), (MB[0], MB[1] + 2.88, MB[2]), material=cream, bevel=.01, parent=roofg)
k.sbox('mechanical box base', (5.6, .3, 3.6), (MB[0], MB[1] + .15, MB[2]), material=cream, bevel=.01, parent=roofg)
lv = k.sbox('mechanical louver', (2.2, .07, .09), (MB[0] - 1.1, MB[1] + 1.0, MB[2] + 1.74), material=steel_d, bevel=.004, parent=roofg); arr(lv, 10, (0, 0, .15))
k.sbox('mechanical door', (.95, 2.0, .06), (MB[0] + 1.6, MB[1] + 1.15, MB[2] + 1.72), material=steel, bevel=.006, parent=roofg)
k.sbox('mechanical door frame', (1.1, 2.1, .04), (MB[0] + 1.6, MB[1] + 1.15, MB[2] + 1.7), material=steel_d, bevel=.006, parent=roofg)
k.sbox('mechanical door handle', (.04, .16, .06), (MB[0] + 1.25, MB[1] + 1.1, MB[2] + 1.77), material=steel_c, bevel=.004, parent=roofg)
for x, z in ((3.0, -3.8), (3.0, -1.4)):
    k.scyl('rooftop AC unit', .9, .8, (x, 72.8, z), material=steel, seg=40, bevel=.01, parent=roofg)
    k.storus('AC fan ring', .8, .04, (x, 73.22, z), (90, 0, 0), steel_d, major=40, minor=8, parent=roofg)
    k.scyl('AC fan hub', .12, .08, (x, 73.24, z), material=steel_d, seg=16, parent=roofg)
    for j in range(8):
        k.sbox('AC fan blade', (.7, .02, .09), (x + .4 * math.cos(j * math.pi / 4), 73.23, z + .4 * math.sin(j * math.pi / 4)), (0, -j * 45, 0), material=steel_d, bevel=0, parent=roofg)
    k.stube('AC supply pipe', (MB[0] + 2.7, 73.1, z), (x - .9, 73.1, z), .08, steel_c, 12, None, roofg)
for x in (-4.0, -3.0):
    k.scyl('vent stack', .15, 1.0, (x, MB[1] + 3.4, MB[2] - 1.0), material=steel, seg=16, parent=roofg)
    k.scyl('vent stack cap', .26, .05, (x, MB[1] + 3.95, MB[2] - 1.0), material=steel_d, seg=16, r2=.1, parent=roofg)
k.stube('antenna mast', (-4.3, MB[1] + 2.9, -3.3), (-4.3, 77.6, -3.3), .04, steel_c, 10, None, roofg)
k.ssphere('antenna dish', .35, (-4.3, 76.6, -3.0), (1, 1, .22), steel_c, 20, 10, roofg)
# lightning rod
LR = (-2.0, 75.3, -2.2)
k.scyl('lightning rod base', .22, .35, (LR[0], 75.1, LR[2]), material=steel_d, seg=20, r2=.14, parent=roofg)
k.stube('lightning rod', (LR[0], 75.2, LR[2]), (LR[0], 80.6, LR[2]), .05, steel_c, 12, .016, roofg)
k.ssphere('lightning rod tip', .07, (LR[0], 80.65, LR[2]), material=gold, seg=12, rings=8, parent=roofg)
for y in (76.4, 78.0): k.scyl('lightning rod ring', .12, .04, (LR[0], y, LR[2]), material=steel_d, seg=16, parent=roofg)
for a in (0, 120, 240):
    k.stube('lightning rod guy', (LR[0], 77.3, LR[2]), (LR[0] + 1.1 * math.cos(math.radians(a)), 75.2, LR[2] + 1.1 * math.sin(math.radians(a))), .012, steel, 6, None, roofg)
    k.ssphere('lightning rod guy anchor', .04, (LR[0] + 1.1 * math.cos(math.radians(a)), 75.2, LR[2] + 1.1 * math.sin(math.radians(a))), material=steel_d, seg=8, rings=6, parent=roofg)
# window-cleaning gantry parked at the front right of the roof
gx, gz = 0.0, 4.6
k.sbox('cleaning gantry body', (2.0, .7, 1.1), (gx, 72.4 + .65, gz), material=yellow, bevel=.02, parent=roofg)
for sx in (-1, 1):
    for sz in (-1, 1): k.scyl('cleaning gantry wheel', .18, .12, (gx + sx * .8, 72.58, gz + sz * .5), (0, 0, 90), steel_d, 20, parent=roofg)
k.sbox('cleaning gantry track', (3.6, .08, .12), (gx, 72.44, gz + .5), material=steel_d, bevel=.004, parent=roofg)
k.sbox('cleaning gantry track', (3.6, .08, .12), (gx, 72.44, gz - .5), material=steel_d, bevel=.004, parent=roofg)
k.stube('cleaning gantry boom', (gx, 73.1, gz + .3), (gx, 73.7, 6.9), .07, steel_d, 12, None, roofg)
k.sbox('cleaning gantry counterweight', (.7, .4, .5), (gx, 73.1, gz - .45), material=steel_d, bevel=.01, parent=roofg)
k.sbox('cleaning gantry cabinet', (.5, .6, .06), (gx - .55, 73.1, gz + .56), material=red, bevel=.01, parent=roofg)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/tower-pete.glb'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cam.data.clip_end = 2000
k.preview(os.environ['PREVIEW_DIR'], size=(360, 640), target=(0, -3, 38), dist=125, views=[(.25, -1, .12), (-.8, -.9, .15)], prefix='a')
k.preview(os.environ['PREVIEW_DIR'], size=(520, 640), target=(-1.5, -6, 2.0), dist=15, views=[(-.2, -1, .15)], prefix='b')
k.preview(os.environ['PREVIEW_DIR'], size=(520, 640), target=(3.4, -7.2, 14), dist=34, views=[(.7, -1, .2)], prefix='c')
for o in bpy.data.objects:
    if o.parent is cutg: o.hide_render = True
k.preview(os.environ['PREVIEW_DIR'], size=(520, 640), target=(0, 0, 64), dist=36, views=[(.15, -1, .25), (.6, -.9, .5)], prefix='d')
k.preview(os.environ['PREVIEW_DIR'], size=(420, 640), target=(-1.5, 0, 74), dist=22, views=[(.5, -1, .3)], prefix='e')
