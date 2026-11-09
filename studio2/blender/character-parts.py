# Character parts for the flat Ref look, sculpted in Blender (owner 2026-11-09: characters go through Blender too, hair and parts must look better). Shared by every film.
# Exports into studio2/library/characters/: hair-tuft, hair-slick, hair-fringe, hair-bob, hair-curly, hair-bun, cap, sneaker (GLB). The actor (runtime/actor.js) attaches them to the rig, tints the materials named 'hair' / 'cap'
# and restyles everything flat with the thick ink outline, so the Ref look stays: flat colour + outline, but the hair is real locks with taper and volume instead of one flat sheet.
# Hair and caps are in HEAD-LOCAL metres (the head ellipsoid is centred (0,-.02,0) with radii .218 x .235 x .19; face toward +z; scene axes x right, y up, z forward). The sneaker is centred on the shoe point, toe toward +z.
import sys, os, math, random
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
OUT = os.path.join(os.environ['STUDIO_ROOT'], 'studio2/library/characters/')
HC, HR = (0, -.02, 0), (.218, .235, .19)
def mats():
    global hair, cap, capD, white, ink, lace, sole
    hair = k.mat('hair', '#4a3427', .6); cap = k.mat('cap', '#12b5a5', .6); capD = k.mat('cap trim', '#ffffff', .6)
    white = k.mat('sneaker white', '#f4f4f0', .6); ink = k.mat('sneaker ink', '#1e1214', .7); lace = k.mat('sneaker lace', '#ffffff', .5); sole = k.mat('sneaker sole', '#e9e6dc', .8)
def norm(v):
    l = math.sqrt(sum(a * a for a in v)) or 1; return tuple(a / l for a in v)
def surf(ax, ay, az, grow=1.0):
    """A point on the head surface in the direction (ax, ay, az) from the head centre."""
    d = norm((ax / HR[0], ay / HR[1], az / HR[2])); return (HC[0] + d[0] * HR[0] * grow, HC[1] + d[1] * HR[1] * grow, HC[2] + d[2] * HR[2] * grow)
def lock(name, base, dirv, length, r0, r1=.004, bend=(0, .0, 0), seg=6):
    """A tapered curved lock growing from a scalp point."""
    d = norm(dirv); pts, rad = [], []
    for i in range(seg):
        t = i / (seg - 1); pts.append((base[0] + d[0] * length * t + bend[0] * t * t, base[1] + d[1] * length * t + bend[1] * t * t, base[2] + d[2] * length * t + bend[2] * t * t)); rad.append(r0 + (r1 - r0) * (t ** .8))
    return k.curve_tube(name, pts, rad, hair, 5)
def hair_cap(name, keep, grow=1.07, thick=.014):
    return k.shell(name, HC, (HR[0] * grow + .008, HR[1] * grow + .006, HR[2] * grow + .006), keep, thick, hair, 160, 96)
def hairline(x, y, z, base=.085, curve=-.16): return y > max(-.09, base + curve * (abs(x) / .2) ** 2)  # a natural hairline: high on the forehead, running down to the temples
def sideburn(x, y, z): return abs(x) > .15 and y > -.07 and z > -.15
def back(x, y, z): return z < -.02 and y > -.055 + .05 * (abs(x) / .2)
def top_keep(x, y, z): return hairline(x, y, z) or back(x, y, z)
def part(name, build):
    k.reset(name); mats(); build(); k.export(OUT + name + '.glb')
# Natural everyday hairstyles (owner 2026-11-09, twice): hair is a solid cap with a rolled edge plus a few chunky clumps lying ALONG the head (flattened ellipsoids), never spiky and never spaghetti curls.
def hair_cap(name, keep, grow=1.07, thick=.024):
    return k.shell(name, HC, (HR[0] * grow + .01, HR[1] * grow + .008, HR[2] * grow + .008), keep, thick, hair, 288, 176, bevel=.008)
def chunk(name, p, X, ln, wd, th, grow=1.07):
    """A hair clump: a flattened ellipsoid lying on the head at the surface point p=(x,y,z), its long axis along the scene direction X."""
    pt = surf(*p, grow); n = norm(((pt[0] - HC[0]) / HR[0] ** 2, (pt[1] - HC[1]) / HR[1] ** 2, (pt[2] - HC[2]) / HR[2] ** 2))
    c = (pt[0] + n[0] * th * .12, pt[1] + n[1] * th * .12, pt[2] + n[2] * th * .12)
    o = k.ssphere(name, 1.0, c, (min(ln * 1.1, .115) / 2, wd / 2 * 1.25, th / 2 * .5), material=hair, seg=22, rings=14)   # flat, wide clumps no longer than 11.5 cm: a longer flat ellipsoid leaves the curved head by 2 cm and pokes through the ink line (owner: it overflowed)
    return k.orient(o, X, n)
def sides(x_, dy=0.0):
    for s_ in (-1, 1): chunk('Hair sideburn', (s_ * .2, -.015 + dy, .0), (0, -1, 0), .09, .05, .045, 1.05)
def smooth(a, b, v):
    t = max(0.0, min(1.0, (v - a) / (b - a))); return t * t * (3 - 2 * t)
def ink_w(x, y, z, base):
    """0 where the hair touches the face (the hairline, the sideburn edge), 1 on the free outer contour (crown, back): the outline of hair is drawn only there."""
    front = smooth(-.04, .02, z); hl = max(-.09, base - .16 * (abs(x) / .2) ** 2)
    return (1 - front) + front * smooth(0.0, .07, y - hl)
def hair_ink(keep, base, grow=1.07, weight=None):
    """The hair's ink line as an inflated back-face shell (the engine draws it black, back faces only): full 1.4 cm outside the hair on the free contour, tucked inside the head where the hair meets the face, so no black line at the hairline."""
    w = weight or (lambda x, y, z: ink_w(x, y, z, base))
    return k.shell('Hair ink', HC, (HR[0] * grow + .01, HR[1] * grow + .008, HR[2] * grow + .008), keep, 0, k.mat('hair ink', '#1e1214', 1.0), 160, 96, inflate=lambda x, y, z: .022)   # full width everywhere: the engine hides it inside the head's screen footprint with a stencil, so no line where hair touches the face
# ---- tuft = short natural cut: full crown, the top swept forward and to one side, a few clumps over the forehead, tidy sides
def tuft():
    kp = lambda x, y, z: hairline(x, y, z, .085) or back(x, y, z)
    hair_cap('Hair crown', kp); hair_ink(kp, .085)
    for i, (x, y, z) in enumerate([(-.12, .2, -.05), (0, .225, .0), (.12, .2, -.02), (-.07, .21, .08), (.06, .215, .09), (-.15, .14, .05)]):
        chunk('Hair top clump %d' % i, (x, y, z), (.55, -.12, .8), .17, .085, .06, 1.06)
    for i, x in enumerate((-.12, -.04, .04, .12)): chunk('Hair front clump %d' % i, (x, .125, .16), (x * .5 + .55, -.45, .45), .1, .07, .05, 1.07)
    sides(0)
# ---- slick = neat side-parted business cut
def slick():
    kp = lambda x, y, z: hairline(x, y, z, .05) or back(x, y, z)
    hair_cap('Hair slick mass', kp, 1.08, .024); hair_ink(kp, .05, 1.08)
    for i in range(6): chunk('Hair side sweep %d' % i, (-.05, .205, .12 - i * .045), (1, -.06, -.25), .21, .08, .055, 1.06)
    chunk('Hair front wave', (-.03, .17, .15), (.9, -.25, .25), .18, .1, .06, 1.07); chunk('Hair top volume', (.06, .215, .03), (1, 0, .1), .18, .11, .06, 1.06)
    sides(0)
# ---- fringe = plain straight fringe with ear-length sides
def fringe():
    kp = lambda x, y, z: hairline(x, y, z, .12) or back(x, y, z)
    hair_cap('Hair crown', kp); hair_ink(kp, .12)
    for i in range(9): x = -.17 + i * .0425; chunk('Hair fringe %d' % i, (x, .14 - .04 * (abs(x) / .18) ** 2, .165), (x * .25, -1, .12), .105, .05, .042, 1.07)
    for s_ in (-1, 1):
        for j in range(2): chunk('Hair side', (s_ * .205, .03 - j * .055, -.01), (0, -1, 0), .1, .07, .045, 1.05)
# ---- bob = chin-length bob with a side-swept fringe
def bob():
    k.shell('Hair bob mass', (0, -.06, -.005), (.262, .3, .228), lambda x, y, z: (z < .03) or (abs(x) > .17 and z < .12) or (y > .06), .034, hair, 200, 120, bevel=.01)
    bk = lambda x, y, z: (z < .03) or (abs(x) > .17 and z < .12) or (y > .06)
    bw = lambda x, y, z: (1.0 if z < .0 else min(smooth(0.0, .05, abs(x) - .17), smooth(0.0, .06, y - .06)))
    k.shell('Hair ink', (0, -.06, -.005), (.262, .3, .228), bk, 0, k.mat('hair ink', '#1e1214', 1.0), 160, 96, inflate=lambda x, y, z: .022)
    for i in range(6): x = -.15 + i * .06; chunk('Hair bang %d' % i, (x, .16, .125), (x * .3 + .9, -.5, .3), .13, .075, .05, 1.08)
    for s_ in (-1, 1):
        for j in range(3): chunk('Hair curtain', (s_ * (.238 + j * .004), .03 - j * .09, -.01 - j * .04), (0, -1, 0), .13, .1, .05, 1.0)
# ---- curly = natural close curls in a rounded crown
def curly():
    hair_cap('Hair crown', lambda x, y, z: hairline(x, y, z, .1) or back(x, y, z), 1.07, .024)
    random.seed(3)
    for i in range(30):
        a = random.random() * math.tau; e = .25 + random.random() * .7
        p = surf(math.cos(a) * math.cos(e) * HR[0], math.sin(e) * HR[1], math.sin(a) * math.cos(e) * HR[2], 1.13)
        if p[1] < .06 and p[2] > .0: continue
        k.ssphere('Hair curl', .05 + random.random() * .018, p, (1, .95, 1), material=hair, seg=16, rings=10)
# ---- bun = hair pulled back from a natural hairline into a neat bun with a band
def bun():
    kp = lambda x, y, z: hairline(x, y, z, .1) or back(x, y, z)
    hair_cap('Hair crown', kp, 1.07, .024); hair_ink(kp, .1)
    for i in range(5): x = -.12 + i * .06; chunk('Hair pulled back %d' % i, (x, .16, .1), (x * .3, .45, -1), .2, .07, .05, 1.07)
    k.ssphere('Hair bun', .075, (0, .25, -.1), material=hair, seg=28, rings=16)
    k.storus('Hair bun band', .076, .011, (0, .205, -.1), (80, 0, 0), material=k.mat('hair band', '#ff5a8a', .6), major=28, minor=8)
    sides(0)
# ---- capped = the hair that shows under a cap (nape, sideburns, a short fringe below the cap rim); the actor uses it when the character wears a cap
def capped():
    hair_cap('Hair nape', lambda x, y, z: z < -.02 and -.14 < y < -.02, 1.07, .024)
    for s_ in (-1, 1):
        for j in range(2): chunk('Hair side', (s_ * .2, -.035 - j * .05, -.02), (0, -1, 0), .09, .06, .045, 1.07)
    for i in range(8): x = -.15 + i * .043; chunk('Hair fringe %d' % i, (x, .06, .155), (x * .2, -1, .2), .06, .045, .035, 1.13)
# ---- cap: crown with six panels, button, stitched brim, sweatband, logo patch
def capf():
    k.shell('Cap crown', (0, .008, -.015), (.242, .232, .212), lambda x, y, z: y > .085 or (z < -.04 and y > -.02), .012, cap, 96, 56)
    for a in range(-2, 3): k.stube('Cap panel seam', (a * .09, .12, .185), (a * .045, .2, .0), .003, k.mat('cap trim', '#ffffff', .6), 6)
    k.ssphere('Cap button', .014, (0, .2, -.015), material=cap, seg=12, rings=8)
    k.shell('Cap brim', (0, .095, .12), (.235, .02, .26), lambda x, y, z: z > .06 and y > .0, .012, cap, 40, 14)
    k.sbox('Cap logo patch', (.07, .06, .006), (0, .16, .215), (-10, 0, 0), material=k.mat('cap trim', '#ffffff', .6), bevel=.004)
    k.storus('Cap sweatband', .222, .008, (0, .088, -.015), (90, 0, 0), material=k.mat('cap trim', '#ffffff', .6), major=48, minor=6)
# ---- sneaker: sole with tread edge, toe cap, upper, tongue, heel tab, laces (centred on the shoe point, toe toward +z; about 0.17 long, 0.1 wide, 0.07 high)
def sneaker():
    k.sbox('Sneaker sole', (.104, .02, .17), (0, -.025, 0), material=sole, bevel=.008, seg=3)
    k.ssphere('Sneaker upper', .06, (0, .005, -.005), (.82, .62, 1.25), material=ink, seg=24, rings=14)
    k.ssphere('Sneaker toe cap', .05, (0, -.008, .06), (.95, .55, .95), material=white, seg=20, rings=12)
    k.sbox('Sneaker heel tab', (.05, .03, .014), (0, .02, -.083), (-12, 0, 0), material=white, bevel=.005)
    k.sbox('Sneaker tongue', (.04, .045, .012), (0, .035, .015), (-30, 0, 0), material=ink, bevel=.005)
    for i in range(3): k.sbox('Sneaker lace', (.046, .004, .005), (0, .033 - i * .004, .0 + i * .017), (-18, 0, 0), material=lace, bevel=.001)
    k.sbox('Sneaker stripe', (.003, .02, .07), (.045, .0, -.01), (0, 0, 0), material=white, bevel=.001); k.sbox('Sneaker stripe', (.003, .02, .07), (-.045, .0, -.01), material=white, bevel=.001)
for nm, fn in (('hair-tuft', tuft), ('hair-slick', slick), ('hair-fringe', fringe), ('hair-bob', bob), ('hair-curly', curly), ('hair-bun', bun), ('hair-capped', capped), ('cap', capf), ('sneaker', sneaker)): part(nm, fn)
