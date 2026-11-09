# Playground swing set, modelled in Blender. Real size: steel A-frame set, top bar 2.4 m high and 3.7 m long, two swings with 1.8 m link chains and rubber seats 0.45 m above the ground,
# swivel hangers on bar clamps, cross braces, foot plates on concrete footings, a rubber safety surface (6.8 x 5.0 m), a low picket fence, a PLAYGROUND sign board and a bench.
# Nodes: `Swing 1` and `Swing 2` (pivot AT the top bar, rotate about X to swing: swivel, chains, grips and seat inside), `ground safety surface`. Front = -Y in Blender (+Z in the scene). Origin = ground centre of the set.
import sys, os, math
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
import bpy
k.reset('playground-swing')
BAR = 2.4; AX = 1.8; FOOT = 1.15; PATCH_TOP = .04
frame = k.mat('swing frame steel blue', '#1f78e0', .35, .55); apexm = k.mat('apex plate steel', '#9aa6b4', .4, .8); chainm = k.mat('chain steel', '#c9d1d9', .3, .9)
seatm = k.mat('seat rubber red', '#e32d2d', .7); seatdark = k.mat('seat core rubber', '#2a2a2e', .85); gripm = k.mat('chain grip rubber', '#ffc61a', .65); boot = k.mat('leg boot rubber', '#202226', .85)
footing = k.mat('footing concrete', '#b9b5ad', .95); bolt = k.mat('bolt steel', '#6e7783', .4, .9)
surf = k.mat('safety surface rubber', '#c5472f', .95); seam = k.mat('surface seam rubber', '#8f3322', .95); curb = k.mat('curb timber wood', '#8a5a33', .85)
picket = k.mat('picket wood white', '#f7f2e6', .8); postw = k.mat('fence post wood', '#d9b56d', .85); tip = k.mat('picket tip wood', '#f2eadb', .8)
signb = k.mat('sign board green', '#27a35a', .55); signf = k.mat('sign frame yellow', '#ffcc1f', .45, .2); letters = k.mat('sign letters white', '#fffdf2', .5); signp = k.mat('sign post wood', '#a87035', .85)
benchw = k.mat('bench slat wood', '#e0963e', .8); benchm = k.mat('bench frame steel', '#2b3138', .4, .8)

def freeze(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def lerp(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

# ---- safety surface: a raised rubber patch with tile seams and a timber curb ----
k.sbox('ground safety surface', (6.8, PATCH_TOP, 5.0), (0, PATCH_TOP / 2, -.2), material=surf, bevel=.012)
for i, (nm, size, loc) in enumerate([('ground curb back', (6.96, .09, .08), (0, .045, -2.74)), ('ground curb front', (6.96, .09, .08), (0, .045, 2.34)), ('ground curb left', (.08, .09, 5.0), (-3.44, .045, -.2)), ('ground curb right', (.08, .09, 5.0), (3.44, .045, -.2))]):
    k.sbox(nm, size, loc, material=curb, bevel=.01)
s1 = k.sbox('tile seam groove x', (.012, .004, 5.0), (-3.0, PATCH_TOP + .001, -.2), material=seam, bevel=0, seg=1); k.array(s1, 6, (1.0, 0, 0))
s2 = k.sbox('tile seam groove z', (6.8, .004, .012), (0, PATCH_TOP + .001, -2.2), material=seam, bevel=0, seg=1); k.array(s2, 5, (0, 1.0, 0))

# ---- steel A-frames ----
for s in (-1, 1):
    x = s * AX
    for zz in (-1, 1):
        foot = (x, .075, zz * FOOT); apex = (x, BAR - .1, 0)
        k.stube('frame leg', apex, foot, .045, frame, seg=16)
        k.stube('leg boot rubber', foot, lerp(foot, apex, .1), .053, boot, seg=16)
        k.sbox('foot footing concrete', (.42, .12, .42), (x, .01, zz * FOOT), material=footing, bevel=.012)
        k.sbox('foot anchor plate', (.24, .012, .24), (x, .076, zz * FOOT), material=apexm, bevel=.003)
        for bx in (-1, 1):
            for bz in (-1, 1):
                k.scyl('anchor bolt', .009, .03, (x + bx * .085, .095, zz * FOOT + bz * .085), material=bolt, seg=8)
        k.scyl('anchor stake', .02, .5, (x + zz * .0, -.22, zz * FOOT), material=bolt, seg=10)
    for y in (.95, 1.7):
        t = (y - .075) / (BAR - .1 - .075); zb = FOOT * (1 - t)
        k.stube('frame cross brace', (x, y, -zb), (x, y, zb), .03, frame, seg=12)
        for zz in (-1, 1):
            k.sbox('brace clamp plate', (.09, .08, .035), (x, y, zz * zb), material=apexm, bevel=.004)
    for dx in (-.055, .055):
        k.sbox('apex plate steel', (.012, .3, .22), (x + dx, BAR - .1, 0), material=apexm, bevel=.004)
        for yy in (-.07, .07):
            k.scyl('apex bolt', .01, .03, (x + dx * 1.35, BAR - .1 + yy, 0), rot=(0, 0, 90), material=bolt, seg=8)
    k.sbox('apex cap', (.17, .05, .26), (x, BAR + .0, 0), material=frame, bevel=.01)
# ---- top bar ----
k.stube('top bar', (-AX - .12, BAR, 0), (AX + .12, BAR, 0), .038, frame, seg=20)
for s in (-1, 1):
    k.scyl('top bar end cap', .042, .03, (s * (AX + .13), BAR, 0), rot=(0, 0, 90), material=frame, seg=20, bevel=.004)

# ---- two swings: pivot group AT the top bar ----
def swing(idx, xs):
    g = k.sgroup('Swing %d' % idx, (xs, BAR, 0))
    for cx in (-.2, .2):
        # static clamp on the bar (outside the group)
        k.sbox('bar clamp top', (.075, .028, .1), (xs + cx, BAR + .05, 0), material=apexm, bevel=.006)
        k.sbox('bar clamp bottom', (.075, .028, .1), (xs + cx, BAR - .05, 0), material=apexm, bevel=.006)
        for bz in (-1, 1):
            k.scyl('clamp bolt', .008, .1, (xs + cx, BAR, bz * .042), material=bolt, seg=8)
        # swivel hanger, chains, grips (inside the group)
        k.scyl('hanger pivot pin', .014, .11, (cx, 0, 0), rot=(0, 0, 90), material=bolt, seg=12, parent=g)
        k.scyl('swivel barrel', .024, .07, (cx, -.055, 0), material=apexm, seg=18, parent=g, bevel=.003)
        k.storus('swivel eye', .018, .0055, (cx, -.107, 0), (0, 90, 0), material=apexm, major=24, minor=8, parent=g)
        for fam, (y0, rot) in enumerate([(-.12, (90, 0, 0)), (-.147, (90, 0, 90))]):
            o = k.torus('chain link' if fam == 0 else 'chain link cross', .016, .0042, (cx, 0, y0), rot, material=chainm, major=20, minor=8, parent=g)
            freeze(o); k.array(o, 33, (0, 0, -.054), name='Chain')
        k.scyl('chain grip rubber', .02, .24, (cx, -1.02, 0), material=gripm, seg=16, parent=g, bevel=.003)
        k.scyl('chain grip cap', .022, .014, (cx, -.895, 0), material=gripm, seg=16, parent=g)
        k.sbox('seat clip', (.05, .07, .06), (cx, -1.915, 0), material=apexm, bevel=.006, parent=g)
        k.scyl('seat clip pin', .01, .075, (cx, -1.915, 0), rot=(90, 0, 0), material=bolt, seg=10, parent=g)
    # rubber belt seat (curved in three pieces), end caps, steel core, tread ribs
    k.sbox('seat belt centre rubber', (.34, .045, .19), (0, -1.972, 0), material=seatm, bevel=.016, seg=3, parent=g)
    for sx in (-1, 1):
        k.sbox('seat belt wing rubber', (.16, .045, .19), (sx * .24, -1.964, 0), rot=(0, 0, sx * 7), material=seatm, bevel=.016, seg=3, parent=g)
    k.sbox('seat core steel plate', (.5, .008, .11), (0, -1.998, 0), material=seatdark, bevel=.002, parent=g)
    for j in range(5):
        k.sbox('seat groove rib', (.46, .005, .012), (0, -1.947, -.064 + j * .032), material=seatdark, bevel=.001, seg=1, parent=g)
    for sx in (-1, 1):
        k.sbox('seat end rubber', (.03, .05, .2), (sx * .325, -1.945, 0), rot=(0, 0, sx * -14), material=seatdark, bevel=.01, seg=2, parent=g)
    return g
swing(1, -.65); swing(2, .65)

# ---- low picket fence: back and both sides ----
def run(nm, pos, size, n, off, tipsize=.05, tipz=.82):
    o = k.sbox('fence picket', size, pos, material=picket, bevel=.004); k.array(o, n, off)
    t = k.sbox('picket tip wood', (tipsize, .02, tipsize), (pos[0], tipz, pos[2]), rot=(0, 0, 45), material=tip, bevel=.003); k.array(t, n, off)
FX = 3.6; FB = -2.9; FF = 2.34
run('back', (-FX + .12, .4, FB), (.07, .8, .02), 55, (.13, 0, 0))
run('left', (-FX, .4, FF - .12), (.02, .8, .07), 40, (0, .13, 0))
run('right', (FX, .4, FF - .12), (.02, .8, .07), 40, (0, .13, 0))
for rz in (.25, .62):
    k.sbox('fence rail wood', (7.3, .05, .04), (0, rz, FB - .03), material=postw, bevel=.006)
    for sx in (-FX, FX):
        k.sbox('fence rail wood', (.04, .05, FF - FB + .1), (sx + (.03 if sx < 0 else -.03), rz, (FF + FB) / 2), material=postw, bevel=.006)
for px, pz in [(-FX, FB), (0, FB), (FX, FB), (-FX, FF), (FX, FF), (-FX, -.3), (FX, -.3)]:
    k.sbox('fence post wood', (.1, .95, .1), (px, .475, pz), material=postw, bevel=.008)
    k.sbox('fence post cap', (.13, .03, .13), (px, .965, pz), material=postw, bevel=.008)

# ---- PLAYGROUND sign board on two posts (faces +Z) ----
SXC, SZ, SY = -4.5, 1.4, 2.0
for dx in (-.85, .85):
    k.sbox('sign post wood', (.1, 2.5, .1), (SXC + dx, 1.25, SZ - .07), material=signp, bevel=.008)
    k.sbox('sign post cap', (.13, .03, .13), (SXC + dx, 2.515, SZ - .07), material=signp, bevel=.008)
k.sbox('sign board green', (1.9, .56, .04), (SXC, SY, SZ), material=signb, bevel=.008)
for nm, sz, loc in [('sign frame top', (1.96, .035, .05), (SXC, SY + .295, SZ + .005)), ('sign frame bottom', (1.96, .035, .05), (SXC, SY - .295, SZ + .005)), ('sign frame left', (.035, .625, .05), (SXC - .965, SY, SZ + .005)), ('sign frame right', (.035, .625, .05), (SXC + .965, SY, SZ + .005))]:
    k.sbox(nm, sz, loc, material=signf, bevel=.005)
for dx, dy in [(-.88, .22), (.88, .22), (-.88, -.22), (.88, -.22)]:
    k.scyl('sign screw', .012, .01, (SXC + dx, SY + dy, SZ + .024), rot=(90, 0, 0), material=bolt, seg=8)
# lettering: fitted to the board, standing, facing +Z
probe = k.text('probe', 'PLAYGROUND', 1.0, (0, 0, 0), (90, 0, 0), material=letters, extrude=.001); dx_, dy_ = probe.dimensions.x, probe.dimensions.y
bpy.data.objects.remove(probe, do_unlink=True)
fit = min(1.66 / dx_, .3 / dy_)
k.stext('sign lettering PLAYGROUND', 'PLAYGROUND', fit, (SXC, SY, SZ + .028), material=letters, extrude=.012)

# ---- bench against the back fence, facing +Z ----
BX, BZ = 1.6, -2.55
for j in range(3):
    k.sbox('bench seat slat wood', (1.6, .035, .12), (BX, .45, BZ + .15 - j * .14), material=benchw, bevel=.008)
for j in range(3):
    k.sbox('bench back slat wood', (1.6, .12, .03), (BX, .7 + j * .14, BZ - .26 - j * .02), rot=(-8, 0, 0), material=benchw, bevel=.008)
for sx in (-1, 1):
    x = BX + sx * .72
    k.sbox('bench leg steel', (.04, .45, .05), (x, .225, BZ + .22), material=benchm, bevel=.006)
    k.sbox('bench leg steel', (.04, .45, .05), (x, .225, BZ - .22), material=benchm, bevel=.006)
    k.sbox('bench back post steel', (.04, .52, .04), (x, .72, BZ - .27), rot=(-8, 0, 0), material=benchm, bevel=.006)
    k.sbox('bench arm steel', (.045, .04, .52), (x, .68, BZ - .02), material=benchm, bevel=.008)
    k.sbox('bench base bar steel', (.04, .04, .5), (x, .12, BZ), material=benchm, bevel=.006)

k.export(os.path.join(os.environ['EPISODE'], 'scene2/models/glb/playground-swing.glb'))
k.preview(os.environ['PREVIEW_DIR'], size=(420, 420), target=(0, 0, 1.2), dist=9.5, views=[(0, -1, .25), (.8, -.8, .35), (1, 0, .2), (-.5, -1, .3)], prefix='a')
