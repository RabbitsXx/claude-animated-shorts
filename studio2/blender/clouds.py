# Cumulus clouds for the sky dome, sculpted in Blender (owner 2026-11-09: fix the sky; the Ref has a few distinct puffy white clouds with a soft blue-grey underside, not the procedural streaks).
# Exports to studio2/library/sky/: cloud-a, cloud-b, cloud-c, cloud-d, cloud-wisp (GLB, about 1 unit = 1 m, origin at the cloud's flat base centre, 20 m wide). Materials 'cloud top' (white) and 'cloud shade' (blue-grey) are tinted by the engine per time of day.
import sys, os, math, random
sys.path.insert(0, os.path.join(os.environ['STUDIO_ROOT'], 'studio2/blender')); import bl_kit as k
OUT = os.path.join(os.environ['STUDIO_ROOT'], 'studio2/library/sky/')
def cloud(name, seed, n, width, height, flat=.55):
    R = random.Random(seed); k.reset(name)
    top = k.mat('cloud top', '#ffffff', 1.0); shade = k.mat('cloud shade', '#b9d2ee', 1.0)
    blobs = []
    for i in range(n):
        t = i / (n - 1) if n > 1 else .5; x = (t - .5) * width + (R.random() - .5) * width * .08
        bulge = math.sin(t * math.pi) ** .7; r = (1.8 + 4.2 * bulge * (.6 + R.random() * .6)); y = r * .55 + height * .25 * bulge * R.random()
        z = (R.random() - .5) * width * .22; blobs.append((x, y, z, r))
    for (x, y, z, r) in blobs:
        for j, (dy, m, s) in enumerate(((0, top, 1.0), (-.42, shade, .92))):   # a white body and a blue-grey belly sitting lower and slightly smaller
            b = k.ssphere('cloud puff' if m is top else 'cloud belly', r * s, (x, y + dy * r, z), (1.0, flat, .9), material=m, seg=18, rings=12)
            k.displace_noise(b, r * .12, 2.0, 1)
    for i in range(4):   # small satellite puffs on top for the cartoon cauliflower edge
        x, y, z, r = blobs[R.randrange(len(blobs))]; k.ssphere('cloud cap', r * .55, (x + (R.random() - .5) * r, y + r * .55, z), (1, .8, .9), material=top, seg=14, rings=9)
    k.export(OUT + name + '.glb')
cloud('cloud-a', 1, 7, 20, 6); cloud('cloud-b', 5, 9, 26, 7); cloud('cloud-c', 9, 5, 14, 5); cloud('cloud-d', 13, 8, 22, 5.5)
# a thin wisp for dusk and night: three long flat lobes
k.reset('cloud-wisp'); top = k.mat('cloud top', '#ffffff', 1.0)
for i in range(3): b = k.ssphere('cloud wisp', 6, (i * 7 - 7, 1 + i % 2, 0), (2.4, .22, .7), material=top, seg=18, rings=10); k.displace_noise(b, .5, 2.0, 1)
k.export(OUT + 'cloud-wisp.glb')
