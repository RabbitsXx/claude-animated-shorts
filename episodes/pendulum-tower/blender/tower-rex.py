# Rex's tower, modelled in Blender: the sleek 'perfect' glass tower. 20 storeys of 4.2 m (84 m) on a 16 m x 16 m footprint, origin at the ground centre, front = scene +Z.
# Rounded-corner storeys (slab, spandrel, curved glass, fritted band, mullion fins), a stepped cantilevered crown with a rooftop terrace deck at y=84 (railing 1.1 m, machine room, gold string lights),
# a grand lobby with a revolving door (2.3 m), canopy, planters and a blank GRAND OPENING banner frame, and two exterior glass elevators on the front face.
# Nodes the scene uses: 'Floor 01'..'Floor 20', 'Elevator car A' / 'Elevator car B' (origin = cab floor, move in Y; inner width 1.8 m), 'Roof railing' (1.1 m), 'Pool mount' (empty at the roof centre, y=84),
# 'Revolving door' > 'Door wings' (turns about Y), 'Banner frame' > 'Banner cloth blank', 'Crown lights', 'Machine room'. No golden ball: this is the perfect copy.
import sys, os, math
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy, bmesh
from mathutils import Vector

k.reset('tower-rex')
S = k.S
# ---------------- materials (created after the reset) ----------------
teal = k.mat('glass teal', '#1fb7b0', .08, .35)
plum_g = k.mat('glass plum', '#8a2f8e', .08, .35)
plum = k.mat('spandrel plum', '#6d2373', .45, .1)
white = k.mat('slab white trim', '#f8f6ff', .5)
frit = k.mat('frit band teal', '#b9f1ea', .35, .1)
fin = k.mat('mullion white', '#eef0f7', .4, .3)
goldm = k.mat('gold trim', '#f2b92a', .25, .9)
bulb = k.mat('string bulb gold', '#ffd25a', .3, 0, emit='#ffc83a', emit_strength=6)
steel = k.mat('steel brushed', '#aeb6c4', .3, .85)
dsteel = k.mat('steel dark', '#3a3f4c', .4, .8)
lglass = k.mat('lobby glass', '#a8f0ee', .05, .1, alpha=.28)
sglass = k.mat('shaft glass', '#9fe9f0', .05, .1, alpha=.25)
cglass = k.mat('cab glass', '#c8f6f6', .05, .1, alpha=.3)
conc = k.mat('concrete slab roof', '#c9c7cf', .85)
plinth = k.mat('stone plinth', '#d8d3da', .8)
plaza = k.mat('ground plaza paving', '#d9d2c4', .85)
seam = k.mat('paving seam dark', '#8c867c', .9)
deckm = k.mat('terrace deck wood', '#a8734a', .7)
decks = k.mat('deck seam dark', '#4a2f1c', .9)
floor_t = k.mat('lobby floor tile', '#efe7da', .25, .05)
floor_d = k.mat('lobby floor tile dark', '#5a2a60', .25, .05)
glowm = k.mat('light panel warm', '#fff0c0', .4, 0, emit='#ffe49a', emit_strength=3)
cloth = k.mat('banner cloth blank', '#fff7e6', .85)
soil = k.mat('planter soil', '#3b2a1d', 1)
leaf = k.mat('shrub leaf green', '#2e9a45', .8)
leaf2 = k.mat('shrub leaf light', '#59c25a', .8)
trunk = k.mat('trunk bark brown', '#6a4529', .9)
sofa = k.mat('sofa velvet plum', '#7c2c80', .8)
rug = k.mat('lobby rug teal', '#17a4a0', .95)
mirror = k.mat('cab mirror steel', '#cfdbe6', .08, 1)
button = k.mat('cab button lit', '#fff2b8', .3, 0, emit='#ffd24a', emit_strength=4)
louver = k.mat('louver grey', '#8b93a1', .5, .6)
paint = k.mat('machine room paint', '#e6e3ee', .7)

# ---------------- geometry helpers ----------------
def rr_pts(w, d, r, n=6):
    """Rounded rectangle outline in scene (x, z): front is +z."""
    hx, hz = w / 2 - r, d / 2 - r; pts = []
    for cx, cz, a0 in [(hx, hz, 0), (-hx, hz, 90), (-hx, -hz, 180), (hx, -hz, 270)]:
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts

def _mesh_obj(name, bm, material, parent, smooth):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    me.materials.append(material); o.parent = parent or k.ROOT
    for p in me.polygons: p.use_smooth = smooth and abs(p.normal.z) < .9
    return o

def prism(name, pts, y0, y1, material, parent=None, smooth=True):
    """A closed polygon (scene x,z) extruded between two heights. Own cap vertices keep the curved sides smooth and the caps flat."""
    area = sum(S((pts[i][0], 0, pts[i][1]))[0] * S((pts[(i + 1) % len(pts)][0], 0, pts[(i + 1) % len(pts)][1]))[1] - S((pts[(i + 1) % len(pts)][0], 0, pts[(i + 1) % len(pts)][1]))[0] * S((pts[i][0], 0, pts[i][1]))[1] for i in range(len(pts))) / 2
    if area < 0: pts = pts[::-1]
    N = len(pts); bm = bmesh.new()
    vb = [bm.verts.new(S((x, y0, z))) for x, z in pts]; vt = [bm.verts.new(S((x, y1, z))) for x, z in pts]
    for i in range(N): bm.faces.new((vb[i], vb[(i + 1) % N], vt[(i + 1) % N], vt[i]))
    bm.faces.new([bm.verts.new(S((x, y1, z))) for x, z in pts])
    bm.faces.new([bm.verts.new(S((x, y0, z))) for x, z in reversed(pts)])
    return _mesh_obj(name, bm, material, parent, smooth)

def rprism(name, w, d, r, y0, y1, material, parent=None, cx=0, cz=0):
    return prism(name, [(x + cx, z + cz) for x, z in rr_pts(w, d, r)], y0, y1, material, parent)

def arc_wall(name, cx, cz, R, a0, a1, y0, y1, material, parent=None, thick=.03, n=8):
    outer = [(cx + R * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + R * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    inner = [(cx + (R - thick) * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cz + (R - thick) * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    return prism(name, outer + inner[::-1], y0, y1, material, parent)

def resample(pts, step, closed=True):
    """Points every ~step metres along a closed polyline."""
    P = pts + [pts[0]] if closed else pts
    seg = [math.dist(P[i], P[i + 1]) for i in range(len(P) - 1)]; total = sum(seg); n = max(3, round(total / step))
    out = []; acc = 0; j = 0; t = 0
    for m in range(n):
        target = total * m / n
        while acc + seg[j] < target - 1e-9: acc += seg[j]; j += 1
        f = (target - acc) / seg[j]; out.append((P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f))
    return out

def yaw_of(a, b):  # scene rotation about Y (degrees) that turns local +x along a->b in the xz plane
    return math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0]))

FH = 4.2; NF = 20; ROOFY = FH * NF

# ---------------- ground: plinth, plaza, entrance apron ----------------
rprism('ground plinth', 17.6, 17.6, 3.0, 0, .12, plinth)
k.sbox('ground plaza', (26, .12, 13.5), (0, .06, 14.75), material=plaza, bevel=.01)
k.array(k.sbox('plaza paving seam long', (26, .004, .03), (0, .122, 8.3), material=seam, bevel=0), 7, (0, -2.0, 0))
k.array(k.sbox('plaza paving seam cross', (.03, .004, 13.5), (-12, .122, 14.75), material=seam, bevel=0), 13, (2.0, 0, 0))
k.sbox('ground entrance apron', (7.4, .14, 3.8), (0, .07, 9.9), material=k.mat('ground apron dark', '#7b7384', .5), bevel=.01)
for s in (-1, 1):
    k.sbox('plaza kerb trim', (.12, .16, 13.5), (s * 13, .08, 14.75), material=white, bevel=.01)
k.sbox('plaza kerb trim front', (26.12, .16, .12), (0, .08, 21.5), material=white, bevel=.01)

# ---------------- storeys ----------------
for i in range(NF):
    y0 = FH * i; n = i + 1
    k.ROOT  # noqa
    rprism('Floor %02d' % n, 16.0, 16.0, 2.6, y0, y0 + .35, white)
    if i == 0:
        rprism('lobby glass wall', 15.4, 15.4, 2.3, y0 + .35, y0 + FH, lglass)
        continue
    top = y0 + FH if i < NF - 1 else y0 + 3.8
    g = plum_g if i % 5 == 4 else teal
    rprism('glass pane curved', 15.4, 15.4, 2.3, y0 + .35, top, g)
    rprism('spandrel band', 15.5, 15.5, 2.35, y0 + .35, y0 + 1.0, plum)
    if i < NF - 1:
        rprism('frit band', 15.46, 15.46, 2.33, y0 + 2.85, y0 + 3.5, frit)
rprism('ground sill band', 15.7, 15.7, 2.45, 0.12, .5, white)

# mullion fins around the whole perimeter (full height from the first storey up)
fin_path = resample(rr_pts(15.8, 15.8, 2.5, 8), 1.25)
n_f = len(fin_path)
for j, (x, z) in enumerate(fin_path):
    a = fin_path[(j + 1) % n_f]; b = fin_path[j - 1]
    yaw = yaw_of(b, a)
    k.sbox('mullion fin', (.09, 78.6, .16), (x, FH + .35 + 39.3, z), rot=(0, yaw, 0), material=fin, bevel=.01)
# fin caps on the top row
for j, (x, z) in enumerate(fin_path):
    k.sbox('mullion cap', (.14, .12, .22), (x, ROOFY - .22, z), rot=(0, yaw_of(fin_path[j - 1], fin_path[(j + 1) % n_f]), 0), material=goldm, bevel=.01)

# ---------------- stepped cantilever crown and the roof terrace ----------------
rprism('Crown step A', 17.0, 16.1, 2.6, ROOFY - 1.2, ROOFY - .9, white)
rprism('Crown step B', 18.8, 16.35, 2.6, ROOFY - .9, ROOFY - .6, plum)
rprism('Crown step C cornice', 20.7, 16.8, 2.65, ROOFY - .6, ROOFY - .42, white)
rprism('Roof slab', 20.4, 16.6, 2.6, ROOFY - .42, ROOFY - .03, conc)
rprism('Roof terrace decking', 19.8, 16.0, 2.3, ROOFY - .03, ROOFY, deckm)
k.array(k.sbox('deck plank seam', (.012, .004, 11.0), (-9.6, ROOFY + .002, 0), material=decks, bevel=0), 65, (.3, 0, 0))
for s in (-1, 1):  # cantilever brackets under the roof overhang
    for z in (-6, -2, 2, 6):
        k.sbar('crown bracket', (s * 8.0, ROOFY - 1.2, z), (s * 9.9, ROOFY - .6, z), (.16, .5), material=goldm)
for s in (-1, 1):
    for t in (-1, 1):
        k.sbar('crown corner fin', (s * 7.9, ROOFY - 1.0, t * 7.9), (s * 8.9, ROOFY - .55, t * 7.4), (.2, .3), material=white)

# railing, 1.1 m, node 'Roof railing'
rail = k.sgroup('Roof railing', (0, ROOFY, 0))
rpath = resample(rr_pts(19.9, 16.1, 2.3, 8), 1.2)
nr = len(rpath)
for j, p in enumerate(rpath):
    q = rpath[(j + 1) % nr]
    k.sbox('railing post', (.06, 1.1, .06), (p[0], .55, p[1]), material=steel, bevel=.01, parent=rail)
    k.sbox('railing post foot', (.14, .04, .14), (p[0], .02, p[1]), material=dsteel, bevel=.005, parent=rail)
    mid = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2); L = math.dist(p, q); yw = yaw_of(p, q)
    k.sbox('railing handrail', (L, .05, .05), (mid[0], 1.1 - .025, mid[1]), rot=(0, yw, 0), material=goldm, bevel=.012, parent=rail)
    k.sbox('railing mid rail', (L, .02, .02), (mid[0], .55, mid[1]), rot=(0, yw, 0), material=steel, bevel=.004, parent=rail)
    k.sbox('railing glass panel', (L - .08, .86, .012), (mid[0], .53, mid[1]), rot=(0, yw, 0), material=cglass, bevel=0, parent=rail)

# gold string lights along the crown: a swag over each railing span, a straight row under the cornice
crown_lights = k.sgroup('Crown lights')
sw = resample(rr_pts(19.9, 16.1, 2.3, 8), 1.2)
ptsw = []
for j, p in enumerate(sw):
    q = sw[(j + 1) % len(sw)]
    for t in (0, .25, .5, .75):
        x = p[0] + (q[0] - p[0]) * t; z = p[1] + (q[1] - p[1]) * t; y = ROOFY + 1.02 - .22 * math.sin(math.pi * t) if t else ROOFY + 1.02
        ptsw.append((x, y, z))
        if t: k.ssphere('string bulb', .045, (x, y - .05, z), material=bulb, seg=8, rings=5, parent=crown_lights)
k.curve_tube('string light wire swag', ptsw, [.012] * len(ptsw), material=dsteel, res=2, parent=crown_lights)
for x, z in resample(rr_pts(20.7, 16.8, 2.65, 8), .8):
    k.ssphere('crown edge bulb', .06, (x, ROOFY - .66, z), material=bulb, seg=8, rings=5, parent=crown_lights)
# four spires at the corners, gold tipped
for sx in (-1, 1):
    for sz in (-1, 1):
        x, z = sx * 9.0, sz * 7.2
        k.scyl('crown spire', .12, 4.6, (x, ROOFY + 2.3, z), r2=.04, material=white, seg=14, bevel=0)
        k.ssphere('crown spire ball', .2, (x, ROOFY + 4.7, z), material=bulb, seg=12, rings=8, parent=crown_lights)
        k.storus('crown spire ring', .22, .025, (x, ROOFY + 3.4, z), (90, 0, 0), material=goldm, major=24, minor=8)
        k.scyl('crown spire base', .22, .2, (x, ROOFY + .1, z), material=steel, seg=16)

# pool mount: where the rooftop-pool model sits (flat deck, 18 m x 9 m clear)
k.sgroup('Pool mount', (0, ROOFY, 0))

# roof machine room and plant
mr = k.sgroup('Machine room', (6.9, ROOFY, -6.2))
k.sbox('machine room wall', (4.2, 3.0, 2.6), (0, 1.5, 0), material=paint, bevel=.015, parent=mr)
k.sbox('machine room roof', (4.5, .2, 2.9), (0, 3.1, 0), material=conc, bevel=.015, parent=mr)
k.sbox('machine room roof trim', (4.6, .06, 3.0), (0, 3.22, 0), material=white, bevel=.01, parent=mr)
k.sbox('machine room door', (.9, 2.1, .06), (-1.2, 1.05, 1.32), material=plum, bevel=.01, parent=mr)
k.sbox('machine room door frame', (1.05, 2.2, .04), (-1.2, 1.1, 1.3), material=steel, bevel=.01, parent=mr)
k.sbox('machine room door handle', (.04, .3, .05), (-.9, 1.05, 1.37), material=goldm, bevel=.008, parent=mr)
k.array(k.sbox('machine room louver', (1.4, .05, .04), (.9, .6, 1.31), material=louver, bevel=.005, parent=mr), 12, (0, 0, .12))
k.array(k.sbox('machine room side louver', (.04, .05, 1.2), (2.11, .6, 0), material=louver, bevel=.005, parent=mr), 12, (0, 0, .12))
k.scyl('machine room vent fan', .35, .22, (.8, 3.36, 0), material=dsteel, seg=20, parent=mr)
k.scyl('machine room fan hub', .1, .26, (.8, 3.4, 0), material=steel, seg=12, parent=mr)
for a in range(4):
    k.sbox('machine room fan blade', (.3, .01, .07), (.8 + math.cos(a * math.pi / 2) * .17, 3.47, math.sin(a * math.pi / 2) * .17), rot=(0, -a * 90, 0), material=steel, bevel=0, parent=mr)
k.stube('roof antenna', (-1.4, 3.2, 0), (-1.4, 5.2, 0), .025, steel, 8, parent=mr)
k.stube('roof antenna arm', (-1.9, 4.7, 0), (-.9, 4.7, 0), .018, steel, 8, parent=mr)
k.ssphere('roof beacon', .08, (-1.4, 5.28, 0), material=bulb, seg=10, rings=6, parent=mr)
for x in (-6.9, -4.6):
    k.sbox('rooftop AC unit', (1.8, 1.0, 1.2), (x, ROOFY + .5, -6.8), material=louver, bevel=.02)
    k.scyl('rooftop AC fan', .42, .06, (x, ROOFY + 1.03, -6.8), material=dsteel, seg=20)
    k.sbox('rooftop AC grille', (1.6, .03, .02), (x, ROOFY + .6, -6.19), material=steel, bevel=0)
    k.stube('rooftop AC pipe', (x + .6, ROOFY + 1.0, -6.8), (x + .6, ROOFY + 1.9, -6.8), .04, steel, 8)
for sx in (-1, 1):
    for sz in (-1, 1):
        k.scyl('deck bollard light', .08, .45, (sx * 9.4, ROOFY + .23, sz * 6.4), material=steel, seg=12)
        k.ssphere('deck bollard lamp', .1, (sx * 9.4, ROOFY + .48, sz * 6.4), material=glowm, seg=10, rings=6)

# ---------------- grand lobby: the revolving door, canopy, interior ----------------
LY = .12
door = k.sgroup('Revolving door', (0, 0, 8.05))
for s in (-1, 1):
    a0, a1 = (-52, 52) if s == 1 else (128, 232)
    arc_wall('door drum glass', 0, 0, 1.2, a0, a1, LY + .08, 2.3, lglass, door, thick=.03)
    for a in (a0, a1):
        x, z = 1.2 * math.cos(math.radians(a)), 1.2 * math.sin(math.radians(a))
        k.scyl('door drum post', .045, 2.3 - LY, (x, (2.3 + LY) / 2, z), material=steel, seg=12, parent=door)
k.scyl('door drum canopy disc', 1.3, .22, (0, 2.4, 0), material=white, seg=48, parent=door)
k.scyl('door drum canopy trim', 1.34, .05, (0, 2.52, 0), material=goldm, seg=48, parent=door)
k.scyl('door drum floor ring', 1.3, .04, (0, LY + .02, 0), material=dsteel, seg=48, parent=door)
k.scyl('door drum canopy light', .25, .02, (0, 2.285, 0), material=glowm, seg=24, parent=door)
wings = k.sgroup('Door wings', (0, LY, 0), parent=door)
k.scyl('door wing hub post', .06, 2.15, (0, 1.08, 0), material=steel, seg=14, parent=wings)
for a in range(4):
    th = a * 90 + 45
    c, s_ = math.cos(math.radians(th)), math.sin(math.radians(th))
    mid = (c * .55, s_ * .55); yw = math.degrees(math.atan2(-s_, c))
    k.sbox('door wing glass', (1.08, 1.98, .02), (mid[0], 1.1, mid[1]), rot=(0, yw, 0), material=lglass, bevel=0, parent=wings)
    k.sbox('door wing top rail', (1.1, .1, .05), (mid[0], 2.1, mid[1]), rot=(0, yw, 0), material=steel, bevel=.01, parent=wings)
    k.sbox('door wing bottom rail', (1.1, .12, .05), (mid[0], .09, mid[1]), rot=(0, yw, 0), material=steel, bevel=.01, parent=wings)
    k.stube('door wing push bar', (c * .35 - s_ * .04, .95, s_ * .35 + c * .04), (c * .95 - s_ * .04, .95, s_ * .95 + c * .04), .02, goldm, 8, parent=wings)
    k.sbox('door wing seal', (.03, 1.98, .05), (c * 1.1, 1.1, s_ * 1.1), rot=(0, yw, 0), material=dsteel, bevel=.005, parent=wings)
# flanking swing doors and the lobby front frame
for s in (-1, 1):
    x = s * 2.0
    k.sbox('lobby door frame steel', (1.1, 2.4, .08), (x, 1.32, 8.0), material=steel, bevel=.01)
    k.sbox('lobby door glass', (.98, 2.28, .02), (x, 1.3, 8.08), material=lglass, bevel=0)
    k.sbox('lobby door handle', (.03, .6, .05), (x - s * .38, 1.1, 8.14), material=goldm, bevel=.006)
# entrance canopy
can = k.sgroup('Entrance canopy', (0, 3.5, 9.6))
k.sbox('canopy plate', (5.4, .16, 3.8), (0, 0, 0), material=white, bevel=.03, parent=can)
k.sbox('canopy plum edge', (5.5, .1, .1), (0, -.02, 1.95), material=plum, bevel=.01, parent=can)
for s in (-1, 1):
    k.sbox('canopy plum edge', (.1, .1, 3.8), (s * 2.75, -.02, 0), material=plum, bevel=.01, parent=can)
    k.stube('canopy tie rod', (s * 2.4, .02, 1.8), (s * 2.4, 2.4, -1.9), .03, steel, 10, parent=can)
    k.stube('canopy tie rod', (s * 1.0, .02, 1.8), (s * 1.0, 2.4, -1.9), .03, steel, 10, parent=can)
for x in (-2.0, -.7, .7, 2.0):
    for z in (-.6, .9):
        k.scyl('canopy downlight', .1, .02, (x, -.09, z), material=glowm, seg=16, parent=can)
k.sbox('canopy gutter', (5.4, .06, .1), (0, -.1, -1.88), material=dsteel, bevel=.005, parent=can)
# interior (seen through the translucent glass)
k.sbox('lobby floor tile', (15.0, .03, 15.0), (0, LY + .015, 0), material=floor_t, bevel=.003)
for i in range(5):
    for j in range(5):
        if (i + j) % 2 == 0: k.sbox('lobby floor tile dark', (2.2, .005, 2.2), (-4.4 + i * 2.2, LY + .032, 5.0 - j * 2.2), material=floor_d, bevel=0)
k.scyl('lobby rug', 2.6, .02, (0, LY + .045, 3.2), material=rug, seg=40)
k.storus('lobby rug ring', 2.6, .03, (0, LY + .05, 3.2), (90, 0, 0), material=goldm, major=48, minor=8)
for x in (-5, -1.8, 1.8, 5):
    for z in (-2.5, 4.5):
        k.scyl('lobby column', .32, 3.9, (x, LY + 1.95, z), material=white, seg=24)
        k.scyl('lobby column ring', .38, .08, (x, LY + 3.7, z), material=goldm, seg=24)
        k.scyl('lobby column base', .4, .16, (x, LY + .08, z), material=plum, seg=24)
k.sbox('lobby reception desk', (5.2, 1.1, .9), (0, LY + .55, -3.4), material=plum, bevel=.03)
k.sbox('lobby reception desktop', (5.4, .08, 1.05), (0, LY + 1.14, -3.4), material=white, bevel=.015)
k.sbox('lobby reception glow strip', (4.8, .06, .02), (0, LY + .25, -2.93), material=glowm, bevel=0)
k.sbox('lobby back wall panel', (8, 3.2, .1), (0, LY + 1.6, -7.2), material=plum, bevel=.02)
for x in (-2.5, 0, 2.5):
    k.sbox('lobby wall light panel', (1.6, 2.2, .04), (x, LY + 1.7, -7.12), material=glowm, bevel=.005)
for s in (-1, 1):
    k.sbox('lobby sofa seat', (2.2, .45, .9), (s * 5.5, LY + .3, 1.0), material=sofa, bevel=.06)
    k.sbox('lobby sofa back', (2.2, .5, .25), (s * 5.5, LY + .75, .6), material=sofa, bevel=.05)
    k.sbox('lobby sofa arm', (.2, .55, .9), (s * 5.5 - 1.1, LY + .45, 1.0), material=sofa, bevel=.05)
    k.sbox('lobby sofa arm', (.2, .55, .9), (s * 5.5 + 1.1, LY + .45, 1.0), material=sofa, bevel=.05)
    k.scyl('lobby side table', .4, .5, (s * 3.3, LY + .27, 1.2), material=goldm, seg=20)
# chandelier
ch = k.sgroup('Lobby chandelier', (0, 3.7, 3.2))
k.stube('chandelier rod', (0, 0, 0), (0, .5, 0), .03, steel, 8, parent=ch)
for r_, yy in [(1.1, -.2), (.75, 0), (.4, .2)]:
    k.storus('chandelier ring', r_, .03, (0, yy, 0), (90, 0, 0), material=goldm, major=40, minor=8, parent=ch)
    for a in range(12):
        t = a / 12 * math.tau
        k.ssphere('chandelier bulb', .06, (math.cos(t) * r_, yy + .02, math.sin(t) * r_), material=bulb, seg=8, rings=5, parent=ch)
# planters and shrubs on the plaza
for s in (-1, 1):
    for (x, z, w, d) in [(s * 7.4, 9.6, 2.4, 1.2), (s * 1.9, 10.9, 1.5, .8)]:
        k.sbox('planter box white', (w, .6, d), (x, .42, z), material=white, bevel=.03)
        k.sbox('planter rim gold', (w + .08, .05, d + .08), (x, .74, z), material=goldm, bevel=.01)
        k.sbox('planter soil', (w - .12, .04, d - .12), (x, .74, z), material=soil, bevel=0)
        for q in range(int(w / .5)):
            xx = x - w / 2 + .3 + q * .5
            k.ssphere('shrub ball', .26, (xx, .98, z), (1, .9, 1), material=leaf if q % 2 else leaf2, seg=12, rings=8)
    k.scyl('topiary trunk', .06, 1.4, (s * 7.4, 1.4, 9.6), material=trunk, seg=10)
    k.ssphere('topiary ball', .55, (s * 7.4, 2.35, 9.6), material=leaf, seg=16, rings=10)
    k.ssphere('topiary ball top', .3, (s * 7.4, 2.9, 9.6), material=leaf2, seg=12, rings=8)

# banner frame: a blank GRAND OPENING banner on a free-standing frame in front of the lobby
bf = k.sgroup('Banner frame', (0, 0, 13.4))
for s in (-1, 1):
    k.sbox('banner post', (.3, 8.9, .3), (s * 5.0, 4.45, 0), material=plum, bevel=.03, parent=bf)
    k.sbox('banner post cap', (.4, .1, .4), (s * 5.0, 8.95, 0), material=goldm, bevel=.01, parent=bf)
    k.sbox('banner foot plate', (1.0, .1, 2.2), (s * 5.0, .05, 0), material=dsteel, bevel=.01, parent=bf)
    k.stube('banner brace', (s * 5.0, 5.5, -.1), (s * 5.0, .1, -1.0), .05, steel, 10, parent=bf)
    k.stube('banner brace', (s * 5.0, 5.5, .1), (s * 5.0, .1, 1.0), .05, steel, 10, parent=bf)
k.sbox('banner top beam', (10.4, .28, .3), (0, 8.3, 0), material=white, bevel=.03, parent=bf)
k.sbox('banner bottom beam', (10.4, .22, .26), (0, 4.9, 0), material=white, bevel=.03, parent=bf)
k.sbox('banner cloth blank', (9.6, 3.1, .05), (0, 6.6, .02), material=cloth, bevel=.01, parent=bf)
for yy in (8.05, 5.15):
    k.array(k.scyl('banner grommet', .035, .02, (-4.5, yy, .06), (90, 0, 0), material=goldm, seg=12, parent=bf), 10, (1.0, 0, 0))
for s in (-4.5, -2.5, -.5, 1.5, 3.5):
    k.stube('banner cord', (s, 8.05, .06), (s, 5.15, .06), .008, dsteel, 6, parent=bf)
for x in (-3.3, 0, 3.3):
    k.sbox('banner spotlight body', (.3, .2, .3), (x, 8.6, .35), (-30, 0, 0), material=dsteel, bevel=.02, parent=bf)
    k.scyl('banner spotlight lens', .09, .03, (x, 8.55, .52), (60, 0, 0), material=glowm, seg=14, parent=bf)

# ---------------- two exterior glass elevators on the front face ----------------
def shaft_and_car(tag, x0):
    sh = k.sgroup('Elevator shaft ' + tag, (x0, 0, 9.4))      # origin at the shaft floor, z = shaft middle
    H = ROOFY + 2.4
    for sx in (-1, 1):
        for sz in (-1, 1):
            k.sbox('shaft corner post', (.14, H, .14), (sx * 1.2, H / 2, sz * 1.3), material=white, bevel=.015, parent=sh)
    k.sbox('shaft glass front', (2.4, H - .2, .03), (0, H / 2 + .1, 1.3), material=sglass, bevel=0, parent=sh)
    for sx in (-1, 1):
        k.sbox('shaft glass side', (.03, H - .2, 2.5), (sx * 1.2, H / 2 + .1, 0), material=sglass, bevel=0, parent=sh)
    k.array(k.sbox('shaft transom front', (2.5, .1, .1), (0, .0 + FH, 1.3), material=plum, bevel=.01, parent=sh), 20, (0, 0, FH))
    for sx in (-1, 1):
        k.array(k.sbox('shaft transom side', (.1, .1, 2.6), (sx * 1.2, FH, 0), material=plum, bevel=.01, parent=sh), 20, (0, 0, FH))
    for sx in (-1, 1):  # guide rails and their brackets
        k.sbox('guide rail', (.08, H - .4, .1), (sx * 1.05, H / 2, 0), material=steel, bevel=.008, parent=sh)
        k.sbox('guide rail web', (.025, H - .4, .16), (sx * 1.05, H / 2, 0), material=steel, bevel=0, parent=sh)
        k.array(k.sbox('guide rail bracket', (.15, .08, .12), (sx * 1.125, 1.0, 0), material=dsteel, bevel=.005, parent=sh), 40, (0, 0, 2.1))
    k.sbox('shaft back frame', (2.5, H, .06), (0, H / 2, -1.28), material=dsteel, bevel=.01, parent=sh)
    k.sbox('shaft head', (2.8, .5, 2.9), (0, H + .25, 0), material=white, bevel=.03, parent=sh)
    k.sbox('shaft head gold trim', (2.86, .06, 2.96), (0, H + .52, 0), material=goldm, bevel=.01, parent=sh)
    k.scyl('shaft sheave', .45, .12, (0, H - .3, 0), (0, 0, 90), material=steel, seg=28, parent=sh)
    k.sbox('shaft pit base', (2.8, .22, 2.9), (0, .11, 0), material=dsteel, bevel=.02, parent=sh)
    k.sbox('shaft entry sill', (1.8, .06, .2), (0, .25, -1.15), material=steel, bevel=.005, parent=sh)
    # the car: origin = cab floor, moves in Y; inner width 1.8 m, 2.3 m inner height
    car = k.sgroup('Elevator car ' + tag, (x0, .25, 9.4))
    k.sbox('cab floor plate', (1.98, .08, 1.98), (0, -.04, 0), material=dsteel, bevel=.01, parent=car)
    k.sbox('cab floor mat', (1.7, .01, 1.7), (0, .005, 0), material=floor_d, bevel=0, parent=car)
    for sx in (-1, 1):
        for sz in (-1, 1):
            k.sbox('cab post', (.07, 2.4, .07), (sx * .935, 1.2, sz * .935), material=steel, bevel=.01, parent=car)
    k.sbox('cab roof', (2.0, .12, 2.0), (0, 2.46, 0), material=white, bevel=.02, parent=car)
    k.sbox('cab roof trim', (2.05, .04, 2.05), (0, 2.54, 0), material=goldm, bevel=.01, parent=car)
    k.sbox('cab glass front', (1.8, 2.3, .015), (0, 1.15, .95), material=cglass, bevel=0, parent=car)
    for sx in (-1, 1):
        k.sbox('cab glass side', (.015, 2.3, 1.8), (sx * .95, 1.15, 0), material=cglass, bevel=0, parent=car)
    k.sbox('cab back panel', (1.8, 2.3, .04), (0, 1.15, -.95), material=plum, bevel=.01, parent=car)
    k.sbox('cab mirror', (1.2, 1.4, .01), (0, 1.3, -.92), material=mirror, bevel=0, parent=car)
    for sx in (-1, 1):
        k.sbox('cab handrail', (.04, .04, 1.4), (sx * .88, .95, 0), material=goldm, bevel=.01, parent=car)
    k.sbox('cab handrail back', (1.4, .04, .04), (0, .95, -.88), material=goldm, bevel=.01, parent=car)
    k.sbox('cab control panel', (.05, .5, .22), (.9, 1.15, .6), material=dsteel, bevel=.01, parent=car)
    for q in range(5): k.ssphere('cab button', .022, (.875, .95 + q * .09, .6), material=button, seg=8, rings=5, parent=car)
    k.scyl('cab ceiling light', .3, .02, (0, 2.39, 0), material=glowm, seg=24, parent=car)
    k.sbox('cab LED strip', (1.6, .02, .03), (0, 2.37, -.8), material=glowm, bevel=0, parent=car)
    k.sbox('cab door header', (1.8, .1, .08), (0, 2.35, .93), material=steel, bevel=.01, parent=car)
    k.sbox('cab door frame', (.05, 2.3, .05), (0, 1.15, .96), material=steel, bevel=.005, parent=car)
    for sx in (-1, 1):
        for yy in (.25, 2.2):
            k.sbox('cab guide shoe', (.16, .18, .14), (sx * 1.0, yy, 0), material=dsteel, bevel=.01, parent=car)
    k.sbox('cab crosshead', (1.4, .08, .1), (0, 2.63, 0), material=steel, bevel=.01, parent=car)
    k.stube('cab hanger', (0, 2.6, 0), (0, 3.3, 0), .04, steel, 8, parent=car)
    k.sbox('cab apron', (1.8, .3, .04), (0, -.23, .9), material=dsteel, bevel=.005, parent=car)
shaft_and_car('A', -4.4)
shaft_and_car('B', 4.4)

# ---------------- export and previews ----------------
k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/tower-rex.glb'))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cam.data.clip_end = 1000
if os.environ.get('PREVIEW_DIR'):
    k.preview(os.environ['PREVIEW_DIR'], size=(420, 560), target=S((0, 42, 0)), dist=112, views=[(.7, -1, .12)], prefix='a')
    k.preview(os.environ['PREVIEW_DIR'], size=(420, 560), target=S((0, 82, 0)), dist=40, views=[(.7, -1, .3)], prefix='b')
    k.preview(os.environ['PREVIEW_DIR'], size=(420, 560), target=S((0, 2.3, 9)), dist=14, views=[(.2, -1, .15)], prefix='c')
    k.preview(os.environ['PREVIEW_DIR'], size=(420, 560), target=S((-4.4, 3, 9.4)), dist=9, views=[(-.5, -1, .25)], prefix='d')
