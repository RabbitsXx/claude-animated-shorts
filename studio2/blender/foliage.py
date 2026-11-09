# Trees, bush and grass tuft sculpted in Blender (replaces the code-built studio2/library/foliage.mjs primitives; owner 2026-11-09). Shared by every film: studio2/library/foliage.mjs loads these GLBs, clones them with a seed, scales to a height and tints the 'crown' / 'bush' materials per palette.
# Exports to studio2/library/foliage/: tree-a, tree-b, tree-c (7 m tall, origin at the foot), bush (r 1 m), tuft (one grass tuft 0.3 m, instanced by the scene), palm-free, no leaf cards: lobes are noise-displaced spheres in five greens, branches and trunk are tapered tubes with root flare.
import sys, os, math, random
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
OUT = os.path.join(os.environ['STUDIO_ROOT'], 'studio2/library/foliage/')
GREENS = ['#2c8f3e', '#3fae4a', '#1f7a38', '#58bf52', '#2a8a45']
def tree(name, seed, h=7.0, lobes=16, lean=0.0):
    R = random.Random(seed); k.reset(name)
    bark = k.mat('bark trunk', '#6a4a2e', 1.0); barkD = k.mat('bark dark', '#4f3620', 1.0)
    k.curve_tube('tree trunk', [(0, 0, 0), (lean * .3, h * .2, 0), (lean * .5, h * .42, 0), (lean * .6, h * .58, 0)], [h * .05, h * .04, h * .03, h * .02], bark, 8)
    for i in range(5): a = i / 5 * math.tau; k.curve_tube('tree root flare', [(math.cos(a) * h * .1, .02, math.sin(a) * h * .1), (math.cos(a) * h * .05, h * .04, math.sin(a) * h * .05), (0, h * .09, 0)], [h * .012, h * .016, h * .03], bark, 4)
    for i in range(5):
        a = i * 1.3 + R.random(); y = h * (.42 + R.random() * .16); l = h * (.16 + R.random() * .12)
        k.curve_tube('tree branch', [(lean * .5, y, 0), (lean * .5 + math.cos(a) * l * .5, y + l * .3, math.sin(a) * l * .5), (lean * .5 + math.cos(a) * l, y + l * .65, math.sin(a) * l)], [h * .018, h * .012, h * .006], barkD, 5)
    for i in range(lobes):
        a = R.random() * math.tau; rr = h * (.08 + R.random() * .2); y = h * (.5 + R.random() * .42); s = h * (.12 + R.random() * .09)
        m = k.mat('crown %d' % (i % 5), GREENS[i % 5], 1.0); b = k.ssphere('crown blob', s, (lean * .6 + math.cos(a) * rr, y, math.sin(a) * rr), (1, .8 + R.random() * .4, 1), material=m, seg=14, rings=9)
        k.displace_noise(b, s * .22, .35, 1)
    k.export(OUT + name + '.glb')
tree('tree-a', 1, lobes=15); tree('tree-b', 7, lobes=18, lean=.25); tree('tree-c', 13, lobes=13, lean=-.2)
# bush: eight lumpy blobs and a few blossoms
k.reset('bush'); R = random.Random(3)
for i in range(8):
    a = R.random() * math.tau; d = .5 * R.random(); m = k.mat('bush %d' % (i % 5), GREENS[i % 5], 1.0)
    b = k.ssphere('bush blob', .35 + R.random() * .2, (math.cos(a) * d, .35 + R.random() * .15, math.sin(a) * d), (1, .8, 1), material=m, seg=14, rings=9); k.displace_noise(b, .06, .3, 1)
for i in range(6):
    a = R.random() * math.tau; d = .42; k.ssphere('bush flower', .05, (math.cos(a) * d * .8, .55 + R.random() * .2, math.sin(a) * d * .8), material=k.mat('flower %d' % (i % 3), ['#ffd23a', '#ff5a8a', '#ffffff'][i % 3], .6), seg=8, rings=5)
k.export(OUT + 'bush.glb')
# grass tuft: five tapered curved blades (0.3 m), origin at the foot, one material 'grass tuft'
k.reset('tuft'); gm = k.mat('grass tuft', '#3f9a42', 1.0)
for i in range(5):
    a = i / 5 * math.tau + .3; l = .22 + .1 * (i % 2); bend = .06
    k.curve_tube('tuft blade', [(0, 0, 0), (math.cos(a) * bend * .5, l * .5, math.sin(a) * bend * .5), (math.cos(a) * bend * 1.6, l, math.sin(a) * bend * 1.6)], [.014, .01, .002], gm, 3)
k.export(OUT + 'tuft.glb')
