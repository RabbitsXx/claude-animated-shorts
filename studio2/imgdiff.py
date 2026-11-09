"""Mean absolute difference (0-255, on a small greyscale copy) between a sample render and the matching frames of a finished render.

Usage: python studio2/imgdiff.py SAMPLE_DIR REF_DIR FPS [VIDEO_FPS]
SAMPLE_DIR holds f00000.jpg ... rendered at times k/FPS; REF_DIR holds the 30 fps frames. Prints a JSON list, one number per sample
(1000 when the reference frame is missing, so a missing frame always counts as out of date).
"""
import json
import os
import sys

from PIL import Image, ImageChops

sample_dir, ref_dir, fps = sys.argv[1], sys.argv[2], float(sys.argv[3])
video_fps = float(sys.argv[4]) if len(sys.argv) > 4 else 30.0
SIZE = (108, 192)


def small(path):
    return Image.open(path).convert("L").resize(SIZE, Image.BILINEAR)


out = []
k = 0
while True:
    a = os.path.join(sample_dir, "f%05d.jpg" % k)
    if not os.path.exists(a):
        break
    b = os.path.join(ref_dir, "f%05d.jpg" % int(k * video_fps / fps))
    if not os.path.exists(b):
        out.append(1000.0)
    else:
        d = ImageChops.difference(small(a), small(b))
        hist = d.histogram()
        out.append(round(sum(i * n for i, n in enumerate(hist)) / (SIZE[0] * SIZE[1]), 4))
    k += 1
print(json.dumps(out))
