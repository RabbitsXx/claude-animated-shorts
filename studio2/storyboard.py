"""Draw an illustrated storyboard sheet from episodes/<id>/STORYBOARD.json (own code art, no image generation).

Usage: python studio2/storyboard.py episodes/<id> [--cols 5] [--frames DIR]
With --frames DIR the panels are REAL frames of the built scene (f00000.jpg ... in beat order, rendered by studio2/storyboard-frames.mjs);
without it they are code-drawn sketches (planning aid only: the owner approves the real frames).
Writes episodes/<id>/out/storyboard.jpg. One flat, thick-outlined sketch per panel, in the film's character look, with the beat, time,
narration, camera, action and counter under it. The scene drawers live in studio2/storyboard_kit.py (shapes and the hero figure)
and in episodes/<id>/storyboard_scenes.py (one function per scene name used in the JSON).
"""
import importlib.util
import json
import os
import sys
import textwrap

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import storyboard_kit as K  # noqa: E402


def load_font(size):
    for name in ('arialbd.ttf', 'arial.ttf', 'Arial.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def main():
    ep = sys.argv[1]
    cols = int(sys.argv[sys.argv.index('--cols') + 1]) if '--cols' in sys.argv else 5
    sb = json.load(open(os.path.join(ep, 'STORYBOARD.json'), encoding='utf8'))
    frames = sys.argv[sys.argv.index('--frames') + 1] if '--frames' in sys.argv else None
    scenes = None
    if not frames:
        spec = importlib.util.spec_from_file_location('scenes', os.path.join(ep, 'storyboard_scenes.py'))
        scenes = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(scenes)
    PW, PH, CAP = 270, 480, 150
    panels = sb['panels']
    rows = (len(panels) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (PW + 10) + 10, rows * (PH + CAP + 10) + 10), (24, 24, 28))
    f1, f2 = load_font(14), load_font(12)
    for i, p in enumerate(panels):
        if frames:
            img = Image.open(os.path.join(frames, 'f%05d.jpg' % i)).convert('RGB').resize((PW, PH), Image.LANCZOS)
        else:
            k = K.Panel(PW, PH)
            getattr(scenes, 'scene_' + p['scene'])(k, p)
            k.counter_badge(p.get('counter'))
            img = k.finish()
        x, y = 10 + (i % cols) * (PW + 10), 10 + (i // cols) * (PH + CAP + 10)
        sheet.paste(img, (x, y))
        d = ImageDraw.Draw(sheet)
        d.text((x, y + PH + 4), '%d  %s  %s' % (p['beat'], p['time'], '(silent)' if p.get('silent') else ''), font=f1, fill=(255, 220, 120))
        ty = y + PH + 24
        for label, text, col in (('say', p.get('narration') or '-', (255, 255, 255)), ('cam', p['camera'], (150, 200, 255)), ('do', p['action'], (190, 255, 190))):
            for line in textwrap.wrap(label + ': ' + text, 40)[:3]:
                d.text((x, ty), line, font=f2, fill=col)
                ty += 14
    out = os.path.join(ep, 'out')
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, 'storyboard-frames.jpg' if frames else 'storyboard.jpg')
    sheet.save(path, quality=88)
    print(path, sheet.size)


if __name__ == '__main__':
    main()
