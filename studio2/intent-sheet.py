"""Contact sheets of the key moments, for the agent (or a person) to LOOK at: is this the picture the story meant to show?

usage: python studio2/intent-sheet.py --episode episodes/<id> [--frames renders/full]

Reads out/collide.json (the `intent` rows written by the collision pass: per frame, for every thing the moment must show, where it is in the frame,
how big it is, whether it passed) and the rendered frames. For each intent id it takes three frames (start, middle, end of the window), draws a
marker on every tracked thing (green = measured OK, red = failed, with the reason), and writes out/intent-sheet-N.jpg (4 intents per sheet).
Also prints one verdict per intent and writes out/intent.json: PASS when at least 60 % of the frames of the window pass, WAIVED when the scene's INTENTS
entry carries a written `waive` reason (the owner's or agent's decision to accept it), otherwise FAIL; exit code 3 when any moment FAILs. The measured part is visibility, frame position, size and occlusion; whether the
composition is GOOD is for the person (or agent) looking at the sheet, against the storyboard line printed under each row.
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--episode', default='episodes/pendulum-tower')
ap.add_argument('--frames', default='renders/full')
a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ep = os.path.join(ROOT, a.episode)
rep_path = os.path.join(ep, 'out/collide.json')
if not os.path.exists(rep_path):
    sys.exit('no out/collide.json: run collide.mjs first')
rep = json.load(open(rep_path, encoding='utf-8'))
fdir = os.path.join(ep, a.frames)
rows = rep.get('intent') or []
if not rows:
    sys.exit('collide.json has no intent rows: the scene declares no intents (or the report is old)')
story = {}
try:
    for p in json.load(open(os.path.join(ep, 'STORYBOARD.json'), encoding='utf-8'))['panels']:
        story[p['beat']] = p['camera']
except Exception:
    pass

by = {}
for r in rows:
    by.setdefault(r['id'], []).append(r)
ids = sorted(by, key=lambda k: by[k][0]['t'])
CW, CH = 240, 427
try:
    font = ImageFont.truetype('arial.ttf', 13)
except Exception:
    font = ImageFont.load_default()

def cell(r):
    fi = int(round(r['t'] * 30))
    path = os.path.join(fdir, 'f%05d.jpg' % fi)
    im = Image.open(path).convert('RGB') if os.path.exists(path) else Image.new('RGB', (1080, 1920), (40, 40, 40))
    W, H = im.size
    d = ImageDraw.Draw(im)
    for it in r['rows']:
        if 'sx' not in it:
            continue
        x, y = it['sx'] * W, it['sy'] * H
        rad = max(18, min(300, it['frac'] * H * .5))
        col = (40, 220, 90) if it['ok'] else (255, 40, 40)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], outline=col, width=8)
        d.line([x - 30, y, x + 30, y], fill=col, width=6)
        d.line([x, y - 30, x, y + 30], fill=col, width=6)
        d.text((x + rad + 6, y - 20), it['name'] + ('' if it['ok'] else ' ' + it.get('why', '')), fill=col, font=ImageFont.load_default())
    return im.resize((CW, CH))

lines = []
moments = []
THRESH = .6
sheets = [ids[i:i + 4] for i in range(0, len(ids), 4)]
for n, group in enumerate(sheets, 1):
    sheet = Image.new('RGB', (CW * 3, (CH + 18) * len(group)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for gi, iid in enumerate(group):
        rs = by[iid]
        pick = [rs[0], rs[len(rs) // 2], rs[-1]]
        for ci, r in enumerate(pick):
            sheet.paste(cell(r), (ci * CW, gi * (CH + 18) + 18))
        beat = int(iid.split('-')[0][1:]) if iid.startswith('b') and iid.split('-')[0][1:].isdigit() else 0
        okfr = sum(all(x['ok'] for x in r['rows']) for r in rs)
        bad = {}
        for r in rs:
            for x in r['rows']:
                if not x['ok']:
                    bad[x['name'] + ' ' + x.get('why', '')] = bad.get(x['name'] + ' ' + x.get('why', ''), 0) + 1
        worst = max(bad.items(), key=lambda kv: kv[1])[0] if bad else ''
        d.text((4, gi * (CH + 18) + 2), f"{iid}  t={rs[0]['t']:.1f}-{rs[-1]['t']:.1f}s  ok {okfr}/{len(rs)}  | storyboard: {story.get(beat, '')[:70]}", fill=(255, 255, 255), font=font)
        share = okfr / len(rs)
        waive = rs[0].get('waive')
        verdict = 'PASS' if share >= THRESH else ('WAIVED' if waive else 'FAIL')
        moments.append({'id': iid, 'from': rs[0]['t'], 'to': rs[-1]['t'], 'share': round(share, 2), 'verdict': verdict, 'worst': worst, 'waive': waive})
        lines.append(f"{verdict:6} {iid}: {okfr}/{len(rs)} frames pass" + (f" (worst: {worst})" if worst and verdict != 'PASS' else '') + (f" [waived: {waive}]" if verdict == 'WAIVED' else ''))
    out = os.path.join(ep, f'out/intent-sheet-{n}.jpg')
    sheet.save(out, quality=88)
    print('wrote', os.path.relpath(out, ROOT))
print('\n'.join(lines))
bad = [m for m in moments if m['verdict'] == 'FAIL']
json.dump({'ok': not bad, 'threshold': THRESH, 'moments': moments}, open(os.path.join(ep, 'out/intent.json'), 'w', encoding='utf-8'), indent=1)
print('INTENT CHECK ' + ('PASS' if not bad else f'FAIL: {len(bad)} moment(s) do not show what the story says; look at the sheets, then fix the camera or write a waive reason in INTENTS'))
sys.exit(0 if not bad else 3)

