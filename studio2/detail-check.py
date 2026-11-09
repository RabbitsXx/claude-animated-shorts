"""Fine-detail gate (owner 2026-11-09: the reference is far more detailed and realistic than flat-colour props).
Measures the Laplacian variance (fine detail energy) and the share of strong edges of a folder of frames at 270x480.
  python studio2/detail-check.py ref <frames folder> <out.json>       build the reference numbers (reference/study/detail-stats.json)
  python studio2/detail-check.py check <frames folder> <ref.json> <out.json>   exit 1 when the median is under 75% of the reference median
Measured 2026-11-09: reference median 1399 (p10 744, p90 2302), edge share .40; double-weight-hourly before the realism layer 808 and .20."""
import sys, os, json
import cv2, numpy as np
def stats(folder, step=1):
    files = [os.path.join(folder, f) for f in sorted(os.listdir(folder)) if f.lower().endswith(('.jpg', '.png'))][::step]
    v, e = [], []
    for p in files:
        g = cv2.resize(cv2.imread(p, cv2.IMREAD_GRAYSCALE), (270, 480), interpolation=cv2.INTER_AREA).astype(np.float32)
        v.append(float(cv2.Laplacian(g, cv2.CV_32F).var()))
        gx = cv2.Sobel(g, cv2.CV_32F, 1, 0); gy = cv2.Sobel(g, cv2.CV_32F, 0, 1)
        e.append(float((np.hypot(gx, gy) > 30).mean()))
    q = lambda a, k: round(float(np.percentile(a, k)), 3)
    return {'frames': len(files), 'lapvar': {k: q(v, k) for k in (10, 50, 90)}, 'edgeShare': {k: q(e, k) for k in (10, 50, 90)}}
mode = sys.argv[1]
if mode == 'ref':
    r = stats(sys.argv[2], 3); json.dump(r, open(sys.argv[3], 'w'), indent=1); print(json.dumps(r))
else:
    ref = json.load(open(sys.argv[3])); r = json.loads(json.dumps(stats(sys.argv[2])))
    need_v = ref['lapvar']['50'] * .75; need_e = ref['edgeShare']['50'] * .75
    ok = r['lapvar']['50'] >= need_v and r['edgeShare']['50'] >= need_e
    r.update(ok=ok, needLapvar=round(need_v, 1), needEdgeShare=round(need_e, 3)); json.dump(r, open(sys.argv[4], 'w'), indent=1)
    print(('PASS' if ok else 'FAIL'), 'detail: lapvar median', r['lapvar']['50'], 'need', round(need_v), '; edge share', r['edgeShare']['50'], 'need', round(need_e, 3))
    sys.exit(0 if ok else 1)
