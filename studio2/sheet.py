"""Build a contact sheet (JPEG grid) from a directory of numbered frames.

Usage:
    python studio2/sheet.py DIR OUT.jpg [--cols 6] [--width 270] [--every 1] [--start 0] [--count 0]

DIR holds f00000.jpg, f00001.jpg, ... and optionally manifest.json whose
"meta" list gives {"file": ..., "t": ...} in frame order. With a manifest the
labels are the time in seconds; without one they are the file names.
"""

import argparse
import glob
import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

GAP = 4
BG = (16, 16, 16)
LABEL_PAD = 4


def load_font(size=14):
    for name in ("arial.ttf", "Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def collect_frames(directory):
    """Return a list of (file_name, label) in frame order."""
    manifest_path = os.path.join(directory, "manifest.json")
    if os.path.isfile(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as fh:
            meta = json.load(fh).get("meta", [])
        return [(m["file"], f'{float(m["t"]):.2f}s') for m in meta]
    names = sorted(os.path.basename(p) for p in glob.glob(os.path.join(directory, "f*.jpg")))
    return [(n, n) for n in names]


def build_sheet(directory, out_path, cols, width, every, start, count):
    frames = collect_frames(directory)
    frames = frames[start:][::max(1, every)]
    if count > 0:
        frames = frames[:count]
    if not frames:
        raise SystemExit("no frames selected")

    font = load_font(14)
    thumbs = []
    for file_name, label in frames:
        with Image.open(os.path.join(directory, file_name)) as im:
            im = im.convert("RGB")
            h = round(im.height * width / im.width)
            thumb = im.resize((width, h), Image.LANCZOS)
        draw = ImageDraw.Draw(thumb)
        left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
        box_w = right - left + 2 * LABEL_PAD
        box_h = bottom - top + 2 * LABEL_PAD
        overlay = Image.new("RGBA", thumb.size, (0, 0, 0, 0))
        ImageDraw.Draw(overlay).rectangle([0, 0, box_w, box_h], fill=(0, 0, 0, 170))
        thumb = Image.alpha_composite(thumb.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(thumb)
        draw.text((LABEL_PAD - left, LABEL_PAD - top), label, font=font, fill=(255, 255, 255))
        thumbs.append(thumb)

    cols = max(1, cols)
    rows = math.ceil(len(thumbs) / cols)
    row_heights = []
    for r in range(rows):
        row = thumbs[r * cols:(r + 1) * cols]
        row_heights.append(max(t.height for t in row))
    sheet_w = cols * width + (cols - 1) * GAP
    sheet_h = sum(row_heights) + (rows - 1) * GAP
    sheet = Image.new("RGB", (sheet_w, sheet_h), BG)

    y = 0
    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            if idx >= len(thumbs):
                break
            sheet.paste(thumbs[idx], (c * (width + GAP), y))
        y += row_heights[r] + GAP

    sheet.save(out_path, "JPEG", quality=90)
    print(f"{out_path} {sheet.width}x{sheet.height} {len(thumbs)} frames")


def main():
    parser = argparse.ArgumentParser(description="Contact sheet from numbered frames.")
    parser.add_argument("dir")
    parser.add_argument("out")
    parser.add_argument("--cols", type=int, default=6)
    parser.add_argument("--width", type=int, default=270)
    parser.add_argument("--every", type=int, default=1)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--count", type=int, default=0)
    args = parser.parse_args()
    build_sheet(args.dir, args.out, args.cols, args.width, args.every, args.start, args.count)


if __name__ == "__main__":
    main()
