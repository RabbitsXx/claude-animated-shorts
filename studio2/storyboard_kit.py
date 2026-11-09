"""Drawing kit for storyboards: flat colour, thick dark outline, the film's character look (round head, squat body, stick limbs).
Coordinates are in panel pixels (origin top left); everything is drawn at 2x and scaled down for smooth edges."""
import math

from PIL import Image, ImageDraw, ImageFont

INK = (30, 18, 20)
SS = 2


def _font(size):
    for name in ('arialbd.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(name, size * SS)
        except OSError:
            pass
    return ImageFont.load_default()


class Panel:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.img = Image.new('RGB', (w * SS, h * SS), (255, 255, 255))
        self.d = ImageDraw.Draw(self.img)

    # ---- primitives (all outlined)
    def _s(self, v):
        return [x * SS for x in v]

    def rect(self, x, y, w, h, fill, r=0, lw=3):
        box = self._s([x, y, x + w, y + h])
        if r:
            self.d.rounded_rectangle(box, radius=r * SS, fill=fill, outline=INK, width=lw * SS)
        else:
            self.d.rectangle(box, fill=fill, outline=INK, width=lw * SS)

    def ell(self, cx, cy, rx, ry, fill, lw=3):
        self.d.ellipse(self._s([cx - rx, cy - ry, cx + rx, cy + ry]), fill=fill, outline=INK, width=lw * SS)

    def poly(self, pts, fill, lw=3):
        pts = [(x * SS, y * SS) for x, y in pts]
        self.d.polygon(pts, fill=fill)
        self.d.line(pts + [pts[0]], fill=INK, width=lw * SS, joint='curve')

    def line(self, p0, p1, w=3, col=INK):
        self.d.line(self._s([p0[0], p0[1], p1[0], p1[1]]), fill=col, width=int(w * SS))
        for p in (p0, p1):
            r = w * SS / 2
            self.d.ellipse([p[0] * SS - r, p[1] * SS - r, p[0] * SS + r, p[1] * SS + r], fill=col)

    def text(self, x, y, s, size=14, fill=(255, 255, 255), anchor='la'):
        self.d.text((x * SS, y * SS), s, font=_font(size), fill=fill, anchor=anchor)

    # ---- backgrounds
    def sky(self, top=(120, 186, 240), bottom=(214, 236, 255), horizon=330):
        for y in range(horizon * SS):
            k = y / (horizon * SS)
            c = tuple(int(top[i] + (bottom[i] - top[i]) * k) for i in range(3))
            self.d.line([(0, y), (self.w * SS, y)], fill=c)
        for cx, cy in ((60, 70), (190, 110), (120, 40)):
            for dx, dy, r in ((0, 0, 16), (16, 4, 13), (-16, 5, 12)):
                self.d.ellipse([(cx + dx - r) * SS, (cy + dy - r * .6) * SS, (cx + dx + r) * SS, (cy + dy + r * .6) * SS], fill=(255, 255, 255))

    def ground(self, y=330, col=(142, 203, 98)):
        self.d.rectangle([0, y * SS, self.w * SS, self.h * SS], fill=col)
        self.d.line([(0, y * SS), (self.w * SS, y * SS)], fill=INK, width=3 * SS)

    # ---- objects
    def pile(self, cx, base, w=200, h=120, k=1.0):
        w, h = w * k, h * k
        if k <= 0.02:
            return
        pts = [(cx - w / 2, base), (cx - w * .32, base - h * .55), (cx - w * .12, base - h * .92), (cx, base - h), (cx + w * .16, base - h * .88), (cx + w * .34, base - h * .5), (cx + w / 2, base)]
        self.poly(pts, (240, 188, 40))
        for i in range(int(26 * k)):
            a = (i * 2.399963) % 6.283
            x = cx + math.cos(a) * w * .36 * ((i % 7) / 7 + .2)
            y = base - h * .15 - (i * 37 % 100) / 100 * h * .75 * (1 - abs(x - cx) / (w / 2))
            self.ell(x, y, 7 * k + 2, 4 * k + 1.5, (250, 210, 70) if i % 3 else (214, 150, 20), lw=1)
        self.rect(cx - 16 * k, base - h * .55, 30 * k, 12 * k, (96, 168, 98), r=2, lw=1)

    def counter(self, x, y, value, w=96):
        self.rect(x, y, w, 30, (20, 24, 34), r=5, lw=3)
        self.text(x + w / 2, y + 15, value, size=15, fill=(255, 226, 90), anchor='mm')

    def counter_badge(self, value):
        if value is None:
            return
        self.rect(6, self.h - 40, 92, 30, (20, 24, 34), r=5, lw=2)
        self.text(52, self.h - 25, value, size=13, fill=(255, 226, 90), anchor='mm')

    def hero(self, x, base, s=1.0, face='smile', pose='hips', yaw=0, hat=False, shirt=(242, 188, 42), pants=(106, 160, 212), hair=(58, 42, 34)):
        # legs (short sticks), body (squat rounded box, narrow chest), head (round) with flat spiky hair
        top = base - 34 * s
        for dx in (-9, 9):
            self.line((x + dx * s, top + 6 * s), (x + dx * 1.3 * s, base - 3 * s), 3.2 * s)
            self.ell(x + dx * 1.3 * s + 3 * s, base - 1.5 * s, 7 * s, 3.5 * s, INK, lw=1)
        bw, bh = 38 * s, 44 * s
        self.rect(x - bw / 2, top - bh + 6 * s, bw, bh, shirt, r=int(12 * s))
        self.rect(x - bw / 2 + 1, top - bh * .42 + 6 * s, bw - 2, bh * .42, pants, r=int(10 * s), lw=2)
        self.rect(x - 8 * s, top - bh * .8 + 6 * s, 16 * s, bh * .45, pants, r=int(3 * s), lw=2)
        hx, hy, hr = x, top - bh - 22 * s, 31 * s
        # arms
        sh = (x - bw / 2 + 2 * s, top - bh * .75 + 6 * s), (x + bw / 2 - 2 * s, top - bh * .75 + 6 * s)
        hand = {
            'hips': ((x - bw / 2 - 12 * s, top - bh * .3), (x + bw / 2 + 12 * s, top - bh * .3)),
            'up': ((x - bw / 2 - 18 * s, hy - 10 * s), (x + bw / 2 + 18 * s, hy - 10 * s)),
            'shrug': ((x - bw / 2 - 14 * s, top - bh * .65), (x + bw / 2 + 14 * s, top - bh * .65)),
            'thumb': ((x - bw / 2 - 10 * s, top - bh * .25), (x + bw / 2 + 22 * s, hy + 8 * s)),
            'down': ((x - bw / 2 - 6 * s, top + 4 * s), (x + bw / 2 + 6 * s, top + 4 * s)),
            'out': ((x - bw / 2 - 22 * s, top - bh * .25), (x + bw / 2 + 22 * s, top - bh * .25)),
        }[pose]
        for (sx, sy), (hxp, hyp) in zip(sh, hand):
            mx, my = (sx + hxp) / 2 + (-6 if sx < x else 6) * s, (sy + hyp) / 2 + 2 * s
            self.line((sx, sy), (mx, my), 3.4 * s)
            self.line((mx, my), (hxp, hyp), 3.4 * s)
            self.ell(hxp, hyp, 5 * s, 5 * s, INK, lw=1)
        # hair (flat spikes), head, hat, face
        sp = [(hx - hr * .95, hy - hr * .1), (hx - hr * 1.0, hy - hr * .7), (hx - hr * .55, hy - hr * .95), (hx - hr * .55, hy - hr * 1.35), (hx - hr * .15, hy - hr * 1.0), (hx + hr * .05, hy - hr * 1.5), (hx + hr * .3, hy - hr * 1.0), (hx + hr * .7, hy - hr * 1.3), (hx + hr * .75, hy - hr * .85), (hx + hr * 1.05, hy - hr * .55), (hx + hr * .95, hy - hr * .1)]
        self.poly(sp, hair, lw=3)
        self.ell(hx, hy, hr, hr * .97, (244, 241, 234), lw=4)
        self.poly([(hx - hr * .95, hy - hr * .35), (hx - hr * .5, hy - hr * .72), (hx, hy - hr * .5), (hx + hr * .5, hy - hr * .74), (hx + hr * .95, hy - hr * .35), (hx + hr * .7, hy - hr * .55), (hx, hy - hr * .93), (hx - hr * .7, hy - hr * .55)], hair, lw=1)
        if hat:
            self.rect(hx - hr * .85, hy - hr * 1.15, hr * 1.7, hr * .55, (246, 243, 234), r=3, lw=3)
            self.rect(hx - hr * .9, hy - hr * .65, hr * 1.8, hr * .16, (36, 62, 99), r=2, lw=2)
        self._face(hx, hy, hr, face)
        return hx, hy, hr

    def _face(self, x, y, r, face):
        ey, ex = y - r * .02, r * .42
        def eye(cx, big=1.0):
            self.d.pieslice([(cx - 5.5 * big) * SS, (ey - 4 * big) * SS, (cx + 5.5 * big) * SS, (ey + 9 * big) * SS], 0, 180, fill=INK)
            self.line((cx - 7, ey - 3.5 * big), (cx + 7, ey - 3.5 * big), 1.8)
        def chev(cx, d):
            self.line((cx - d * 5, ey - 6), (cx + d * 4, ey), 2.4); self.line((cx + d * 4, ey), (cx - d * 5, ey + 6), 2.4)
        def mouth(kind):
            my = y + r * .45
            if kind in ('smile', 'proud', 'smug', 'relief'):
                self.d.arc([(x - 9) * SS, (my - 8) * SS, (x + 9) * SS, (my + 8) * SS], 20, 160, fill=INK, width=3 * SS)
            elif kind in ('grin', 'joy', 'laugh'):
                self.d.pieslice([(x - 11) * SS, (my - 10) * SS, (x + 11) * SS, (my + 12) * SS], 0, 180, fill=INK)
                self.d.rectangle([(x - 8) * SS, (my) * SS, (x + 8) * SS, (my + 3) * SS], fill=(255, 250, 240))
            elif kind in ('shock', 'scared'):
                self.ell(x, my + 2, 5, 7, INK, lw=1)
            elif kind == 'smirk':
                self.line((x - 8, my + 2), (x + 8, my - 3), 3)
            else:
                self.line((x - 8, my), (x + 8, my), 3)
        if face in ('laugh',):
            chev(x - ex, 1); chev(x + ex, -1)
        elif face in ('joy', 'relief'):
            for s in (-1, 1):
                self.d.arc([(x + s * ex - 6) * SS, (ey - 4) * SS, (x + s * ex + 6) * SS, (ey + 8) * SS], 200, 340, fill=INK, width=3 * SS)
        else:
            eye(x - ex, 1.3 if face in ('shock', 'scared') else 1.0); eye(x + ex, 1.3 if face in ('shock', 'scared') else 1.0)
        mouth(face)

    def finish(self):
        return self.img.resize((self.w, self.h), Image.LANCZOS)
