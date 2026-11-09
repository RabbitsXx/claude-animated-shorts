"""Reference parity metrics for set dressing and image richness.
usage:
  python studio2/parity.py ref   <reference frames dir> <out metrics.json>      # measure the reference clip once
  python studio2/parity.py check <our frames dir> <reference metrics.json> <out report.json> [worst-sheet.jpg]
Every frame is reduced to 270x480 and the caption band (rows 60-78 %) is ignored. Metrics:
  empty    fraction of 12x12 blocks with almost no luminance change (flat voids)       -> must NOT be higher than the reference
  detail   mean absolute luminance gradient (edges, texture, ink lines)                -> must NOT be lower
  hues     number of hue bins (of 12) holding >= 1.5 % of the saturated pixels          -> must NOT be lower
  minband  detail of the emptiest third of the frame (top / middle / bottom)           -> must NOT be lower (no dead third)
  contrast luminance P95 - P5 (glow, shadow, highlights)                                -> must NOT be lower
Limits are the reference's own 10th / 90th percentile. A frame passes when at most ONE metric is outside its limit.
The film passes when the share of passing frames is at least the reference's own share minus 10 points.
These are proxies for richness, not for taste; a person still has to look at the side-by-side sheet."""
import sys, json, glob, os
import numpy as np
from PIL import Image, ImageDraw

def load(path):
    im = Image.open(path).convert('RGB').resize((270, 480), Image.BILINEAR)
    return np.asarray(im, dtype=np.float32) / 255.0

def metrics(a):
    h = a.shape[0]
    keep = np.ones(h, bool)
    keep[int(h * .60):int(h * .78)] = False            # caption band
    L = a[..., 0] * .2126 + a[..., 1] * .7152 + a[..., 2] * .0722
    gy = np.abs(np.diff(L, axis=0))
    gx = np.abs(np.diff(L, axis=1))
    gyk = gy[keep[:-1]]
    gxk = gx[keep]
    detail = float((gyk.mean() + gxk.mean()) / 2 * 100)
    # empty blocks
    B = 12
    blocks = 0; empty = 0
    for y in range(0, h - B + 1, B):
        if not keep[y:y + B].all():
            continue
        for x in range(0, 270 - B + 1, B):
            blocks += 1
            if L[y:y + B, x:x + B].std() < .0125:
                empty += 1
    emptyf = empty / max(1, blocks)
    # hues
    mx = a.max(axis=2); mn = a.min(axis=2)
    s = (mx - mn) / np.maximum(mx, 1e-6)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = np.maximum(mx - mn, 1e-6)
    hh = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6.0
    sel = (s > .25) & (mx > .15) & keep[:, None]
    n = max(1, int(sel.sum()))
    bins = np.bincount(np.minimum(11, (hh[sel] * 12).astype(int)), minlength=12) / n
    hues = int((bins >= .015).sum())
    # thirds
    thirds = []
    for t in range(3):
        y0, y1 = int(h * t / 3), int(h * (t + 1) / 3)
        m = keep[y0:y1]
        sub_y = np.abs(np.diff(L[y0:y1], axis=0))[m[:-1]] if m.sum() > 2 else np.zeros(1)
        sub_x = np.abs(np.diff(L[y0:y1], axis=1))[m]
        thirds.append(float((sub_y.mean() + sub_x.mean()) / 2 * 100))
    p5, p95 = np.percentile(L[keep], [5, 95])
    return {'empty': round(emptyf, 4), 'detail': round(detail, 3), 'hues': hues, 'minband': round(min(thirds), 3), 'contrast': round(float(p95 - p5), 4)}

def files(d):
    return sorted(glob.glob(os.path.join(d, '*.jpg')) + glob.glob(os.path.join(d, '*.png')))

def limits(ref):
    q = lambda k, p: float(np.percentile([m[k] for m in ref], p))
    return {'empty': q('empty', 90), 'detail': q('detail', 10), 'hues': q('hues', 10), 'minband': q('minband', 10), 'contrast': q('contrast', 10)}

def failing(m, lim):
    f = []
    if m['empty'] > lim['empty']: f.append('empty')
    if m['detail'] < lim['detail']: f.append('detail')
    if m['hues'] < lim['hues']: f.append('hues')
    if m['minband'] < lim['minband']: f.append('minband')
    if m['contrast'] < lim['contrast']: f.append('contrast')
    return f

def main():
    mode = sys.argv[1]
    if mode == 'ref':
        fs = files(sys.argv[2])
        ms = [dict(metrics(load(p)), file=os.path.basename(p)) for p in fs]
        lim = limits(ms)
        own = sum(1 for m in ms if len(failing(m, lim)) <= 1) / len(ms)
        out = {'frames': len(ms), 'limits': lim, 'selfPassShare': round(own, 3), 'median': {k: float(np.median([m[k] for m in ms])) for k in ('empty', 'detail', 'hues', 'minband', 'contrast')}, 'samples': ms}
        json.dump(out, open(sys.argv[3], 'w'), indent=1)
        print(json.dumps({k: out[k] for k in ('frames', 'limits', 'selfPassShare', 'median')}, indent=1))
    elif mode == 'check':
        ref = json.load(open(sys.argv[3]))
        lim = ref['limits']; need = round(ref['selfPassShare'] - .10, 3)
        fs = files(sys.argv[2])
        rows = []
        for p in fs:
            m = metrics(load(p)); f = failing(m, lim)
            rows.append(dict(m, file=os.path.basename(p), failing=f, ok=len(f) <= 1))
        share = sum(1 for r in rows if r['ok']) / max(1, len(rows))
        med = {k: float(np.median([r[k] for r in rows])) for k in ('empty', 'detail', 'hues', 'minband', 'contrast')}
        counts = {k: sum(1 for r in rows if k in r['failing']) for k in ('empty', 'detail', 'hues', 'minband', 'contrast')}
        rep = {'frames': len(rows), 'passShare': round(share, 3), 'needShare': need, 'ok': share >= need, 'limits': lim, 'median': med, 'failCounts': counts, 'referenceMedian': ref['median'], 'rows': rows}
        json.dump(rep, open(sys.argv[4], 'w'), indent=1)
        print(json.dumps({k: rep[k] for k in ('frames', 'passShare', 'needShare', 'ok', 'median', 'referenceMedian', 'failCounts')}, indent=1))
        if len(sys.argv) > 5:
            worst = sorted(rows, key=lambda r: (-len(r['failing']), -r['empty']))[:12]
            W, H = 240, 427
            sheet = Image.new('RGB', (W * 6, H * 2), (16, 16, 16))
            d = ImageDraw.Draw(sheet)
            for i, r in enumerate(worst):
                im = Image.open(os.path.join(sys.argv[2], r['file'])).convert('RGB').resize((W, H))
                x, y = (i % 6) * W, (i // 6) * H
                sheet.paste(im, (x, y)); d.text((x + 4, y + 4), r['file'] + ' ' + ','.join(r['failing']), fill=(255, 255, 0))
            sheet.save(sys.argv[5], quality=88)
        sys.exit(0 if rep['ok'] else 5)

main()
