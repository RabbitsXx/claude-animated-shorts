"""Camera travel measured from PICTURES (no camera path needed): the same estimator for the reference and for our own frames, so the two are comparable.
usage: python studio2/ref-camera.py <frames folder, names f<frame>.jpg> <fps> <out.json> [motion.json]
Between neighbouring frames it computes dense optical flow (Farneback) and fits a global shift + zoom by least squares on the slow-moving 80% of the picture, and reports
shift (fraction of the frame width) and zoom (log scale). Cuts and dissolves are taken from motion.json (per-frame histogram change above 0.12 inside the pair) when given. Works on flat-colour footage like the reference; it fails on frames with thin falling-rain detail (pixel noise between samples). A shot's travel = net shift/zoom between its first and last frame,
per second (the number the camera plan gate estimates from the camera path). Limits of the method: it mixes camera and large-object motion, and 4 fps sampling misses very fast moves."""
import sys, os, re, json, math
import cv2, numpy as np
src, fps, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
mot = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None
hist = {m['frame']: m['histDelta'] for m in mot} if mot else {}
files = sorted(f for f in os.listdir(src) if re.match(r'f\d+\.jpg$', f))
idx = [int(re.findall(r'\d+', f)[0]) for f in files]
W, H = 135, 240
def load(f): return cv2.resize(cv2.imread(os.path.join(src, f), cv2.IMREAD_GRAYSCALE), (W, H), interpolation=cv2.INTER_AREA)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); xc, yc = xx - W / 2, yy - H / 2
prev = load(files[0]); pairs = []
for i in range(1, len(files)):
    cur = load(files[i]); dt = (idx[i] - idx[i-1]) / fps
    rec = {'t': round(idx[i-1] / fps, 3), 'dt': round(dt, 3), 'cut': True, 'dx': 0, 'dy': 0, 'zoom': 0, 'inliers': 0}
    fl = cv2.calcOpticalFlowFarneback(prev, cur, None, .5, 5, 25, 4, 7, 1.5, 0)
    # global similarity from the flow (least squares on a robust subset): dx = tx + a*xc, dy = ty + a*yc  (a = zoom)
    mag = np.hypot(fl[..., 0], fl[..., 1]); keep = mag < np.percentile(mag, 80) * 2.5 + .5
    A = np.stack([np.ones(keep.sum()), xc[keep]], 1); tx, a1 = np.linalg.lstsq(A, fl[..., 0][keep], rcond=None)[0]
    A2 = np.stack([np.ones(keep.sum()), yc[keep]], 1); ty, a2 = np.linalg.lstsq(A2, fl[..., 1][keep], rcond=None)[0]
    z = (a1 + a2) / 2
    mx, my = xx + tx + z * xc, yy + ty + z * yc
    warped = cv2.remap(prev, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    base = float(np.mean(np.abs(prev.astype(np.float32) - cur))); res = float(np.mean(np.abs(warped.astype(np.float32) - cur)))
    cut = any(hist.get(k, 0) > .12 for k in range(idx[i-1] + 1, idx[i] + 1)) if mot else (base > 12 and res > .85 * base)
    if not cut: rec.update(cut=False, dx=round(float(tx) / W, 4), dy=round(float(ty) / W, 4), zoom=round(float(math.log(max(1 + z, 1e-3))), 4), inliers=int(keep.sum()))
    rec['base'] = round(base, 1); rec['res'] = round(res, 1); pairs.append(rec); prev = cur
shots = []; cur = []
for p in pairs:
    if p['cut']:
        if cur: shots.append(cur)
        cur = []
    else: cur.append(p)
if cur: shots.append(cur)
rep = []
for s in shots:
    sec = sum(p['dt'] for p in s)
    if sec < 1.0: continue
    net = math.hypot(sum(p['dx'] for p in s), sum(p['dy'] for p in s)) + abs(sum(p['zoom'] for p in s))  # net sideways shift (frame widths) + net zoom
    path = sum(math.hypot(p['dx'], p['dy']) + abs(p['zoom']) for p in s)
    rep.append({'from': s[0]['t'], 'seconds': round(sec, 2), 'netPerSecond': round(net / sec, 3), 'pathPerSecond': round(path / sec, 3)})
speeds = [math.hypot(p['dx'], p['dy']) / p['dt'] + abs(p['zoom']) / p['dt'] for p in pairs if not p['cut']]
q = lambda v, k: round(float(np.percentile(v, k)), 3) if v else None
res = {'fps': fps, 'detail': pairs, 'pairs': len(pairs), 'cuts': sum(p['cut'] for p in pairs), 'shots': rep,
       'netPerSecond': {k: q([r['netPerSecond'] for r in rep], k) for k in (10, 25, 50, 75, 90)},
       'speedPerSecond': {k: q(speeds, k) for k in (10, 25, 50, 75, 90)}}
json.dump(res, open(out, 'w'), indent=1)
print('shots', len(rep), 'cut-pairs', res['cuts'], 'net/s p10/50/90', res['netPerSecond'][10], res['netPerSecond'][50], res['netPerSecond'][90], 'speed/s p50/90', res['speedPerSecond'][50], res['speedPerSecond'][90])
