"""Shrink an image before looking at it (an image costs tokens by its size and stays in the conversation).

Usage: python studio2/shrink.py IN.jpg [OUT.jpg] [--width 540]
Default OUT is studio2/.tmp/view/<name>.jpg; the path is printed. Look at the small copy while iterating, the full-size file only for the final check.
For many frames use studio2/sheet.py (one image for dozens of frames) instead of looking at frames one by one.
"""
import os
import sys

from PIL import Image

args = [a for a in sys.argv[1:] if not a.startswith("--")]
width = 540
if "--width" in sys.argv:
    width = int(sys.argv[sys.argv.index("--width") + 1])
    args = [a for a in args if a != str(width)]
src = args[0]
out = args[1] if len(args) > 1 else os.path.join("studio2", ".tmp", "view", os.path.splitext(os.path.basename(src))[0] + ".jpg")
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
im = Image.open(src).convert("RGB")
im.resize((width, round(im.height * width / im.width)), Image.LANCZOS).save(out, quality=88)
print(out)
