#!/usr/bin/env python3
"""Draw the 151 SANCTUARY creatures: front and back battle sprites.

Original pixel art, Game Boy era styling: 48x48, flat fills, one dark outline,
three tones per material. Every creature is built from a body plan plus
features (ears, tails, horns, wings, patterns), so an evolution line shares a
silhouette and grows into it.

    python3 tools/make_creatures.py            # writes creatures/ and creatures/back/
    python3 tools/make_creatures.py --only 1-9 # just those numbers
"""
import argparse, json, math, os, struct, zlib

W = H = 48

# ----------------------------------------------------------------- canvas ---

class Canvas:
    __slots__ = ('w', 'h', 'px')

    def __init__(self, w=W, h=H):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]

    def set(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            self.px[y][x] = c

    def get(self, x, y):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return None

    def ellipse(self, cx, cy, rx, ry, c):
        if rx <= 0 or ry <= 0:
            return
        for y in range(max(0, int(cy - ry - 1)), min(self.h, int(cy + ry + 2))):
            for x in range(max(0, int(cx - rx - 1)), min(self.w, int(cx + rx + 2))):
                dx, dy = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
                if dx * dx + dy * dy <= 1.0:
                    self.px[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.set(x, y, c)

    def line(self, x0, y0, x1, y1, c, thick=1):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx - dy
        while True:
            for oy in range(thick):
                for ox in range(thick):
                    self.set(x0 + ox, y0 + oy, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy; x0 += sx
            if e2 < dx:
                err += dx; y0 += sy

    def tri(self, p0, p1, p2, c):
        xs = [p0[0], p1[0], p2[0]]; ys = [p0[1], p1[1], p2[1]]
        def side(ax, ay, bx, by, px, py):
            return (bx - ax) * (py - ay) - (by - ay) * (px - ax)
        for y in range(max(0, int(min(ys))), min(self.h, int(max(ys)) + 1)):
            for x in range(max(0, int(min(xs))), min(self.w, int(max(xs)) + 1)):
                px, py = x + 0.5, y + 0.5
                d0 = side(p0[0], p0[1], p1[0], p1[1], px, py)
                d1 = side(p1[0], p1[1], p2[0], p2[1], px, py)
                d2 = side(p2[0], p2[1], p0[0], p0[1], px, py)
                if (d0 >= 0 and d1 >= 0 and d2 >= 0) or (d0 <= 0 and d1 <= 0 and d2 <= 0):
                    self.px[y][x] = c

    def blob(self, cx, cy, rx, ry, pal, lit=True):
        """A shaded round mass: shadow underneath, base body, highlight top-left."""
        self.ellipse(cx, cy, rx, ry, pal['dark'])
        self.ellipse(cx - max(0.5, rx * 0.06), cy - max(0.6, ry * 0.09), rx * 0.90, ry * 0.87, pal['base'])
        if lit and rx > 3 and ry > 3:
            self.ellipse(cx - rx * 0.34, cy - ry * 0.40, rx * 0.36, ry * 0.31, pal['light'])

    def outline(self, c=(24, 20, 28)):
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    continue
                for ox, oy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    if self.get(x + ox, y + oy) is not None and self.get(x + ox, y + oy) != c:
                        add.append((x, y)); break
        for x, y in add:
            self.px[y][x] = c

    def shadow_under(self, cx, cy, rx, c=(70, 62, 80)):
        for x in range(max(0, int(cx - rx)), min(self.w, int(cx + rx) + 1)):
            dx = (x + 0.5 - cx) / rx
            if dx * dx <= 1.0:
                for y in (int(cy), int(cy) + 1):
                    if self.get(x, y) is None:
                        self.set(x, y, c)

    def png(self):
        raw = bytearray()
        for row in self.px:
            raw.append(0)
            for p in row:
                raw += bytes(p) + b'\xff' if p else b'\x00\x00\x00\x00'
        def chunk(tag, data):
            return (struct.pack('>I', len(data)) + tag + data +
                    struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))
        ihdr = struct.pack('>IIBBBBB', self.w, self.h, 8, 6, 0, 0, 0)
        return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) +
                chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b''))

    def save(self, path):
        with open(path, 'wb') as f:
            f.write(self.png())


# --------------------------------------------------------------- palettes ---

def ramp(base, light=None, dark=None):
    def mix(c, t, target):
        return tuple(int(round(c[i] + (target[i] - c[i]) * t)) for i in range(3))
    return {
        'base': base,
        'light': light or mix(base, 0.36, (255, 252, 240)),
        'dark': dark or mix(base, 0.34, (30, 22, 44)),
    }

PAL = {
    'cream':   ramp((238, 222, 190)), 'white':  ramp((242, 240, 238)),
    'tan':     ramp((214, 172, 118)), 'brown':  ramp((160, 112, 68)),
    'cocoa':   ramp((116, 80, 54)),   'sand':   ramp((228, 198, 142)),
    'pink':    ramp((240, 168, 176)), 'rose':   ramp((214, 118, 138)),
    'red':     ramp((206, 88, 74)),   'rust':   ramp((190, 112, 62)),
    'orange':  ramp((232, 148, 66)),  'gold':   ramp((234, 194, 82)),
    'yellow':  ramp((240, 214, 108)), 'olive':  ramp((166, 168, 96)),
    'green':   ramp((124, 176, 96)),  'leaf':   ramp((96, 156, 88)),
    'forest':  ramp((72, 124, 82)),   'mint':   ramp((150, 206, 168)),
    'teal':    ramp((94, 176, 168)),  'sky':    ramp((140, 190, 226)),
    'blue':    ramp((104, 142, 208)), 'navy':   ramp((84, 104, 168)),
    'violet':  ramp((150, 124, 206)), 'plum':   ramp((132, 100, 152)),
    'lilac':   ramp((190, 168, 220)), 'grey':   ramp((166, 166, 178)),
    'slate':   ramp((122, 126, 144)), 'char':   ramp((84, 84, 100)),
    'ash':     ramp((198, 196, 200)), 'peach':  ramp((240, 194, 158)),
    'lime':    ramp((186, 210, 118)), 'aqua':   ramp((124, 200, 204)),
    'coral':   ramp((234, 146, 128)), 'wine':   ramp((150, 84, 104)),
    'moss':    ramp((132, 148, 96)),  'straw':  ramp((226, 206, 148)),
}
INK = (26, 22, 32)
EYE_W = (250, 250, 252)


# --------------------------------------------------------------- features ---

def eyes(c, cx, cy, spread, size=2, pal=None, sleepy=False, big=False):
    d = pal['dark'] if pal else INK
    for sx in (-1, 1):
        ex = cx + sx * spread
        if big:
            c.ellipse(ex, cy, size + 1.2, size + 1.4, EYE_W)
            c.ellipse(ex, cy + 0.4, size * 0.62, size * 0.78, INK)
            c.set(ex - size * 0.4, cy - size * 0.5, EYE_W)
        elif sleepy:
            c.line(ex - size, cy, ex + size, cy, INK)
        else:
            c.ellipse(ex, cy, size * 0.7, size * 0.85, INK)
            c.set(ex - 1, cy - 1, EYE_W)

def blush(c, cx, cy, spread, col=(238, 150, 158)):
    for sx in (-1, 1):
        c.set(cx + sx * spread, cy, col)
        c.set(cx + sx * spread + 1, cy, col)

def snout(c, cx, cy, w, h, pal):
    c.ellipse(cx, cy, w, h, pal['light'])
    c.set(cx - w * 0.45, cy, pal['dark']); c.set(cx + w * 0.45, cy, pal['dark'])

def beak(c, cx, cy, size, pal, back=False):
    if back:
        return
    c.tri((cx - size, cy - size * 0.5), (cx + size, cy - size * 0.5), (cx, cy + size * 0.9), pal['base'])
    c.tri((cx - size * 0.8, cy - size * 0.2), (cx + size * 0.8, cy - size * 0.2), (cx, cy + size * 0.7), pal['dark'])

def ear_long(c, cx, cy, h, w, pal, inner, tilt=0.35, back=False):
    for sx in (-1, 1):
        bx = cx + sx * w * 1.1
        tx = bx + sx * h * tilt
        c.ellipse((bx + tx) / 2, cy - h / 2, w, h / 2, pal['base'])
        c.ellipse((bx + tx) / 2 + sx * 0.3, cy - h / 2, w * 0.5, h * 0.36, pal['dark'] if back else inner)

def ear_round(c, cx, cy, r, pal, spread, inner=None, back=False):
    for sx in (-1, 1):
        c.ellipse(cx + sx * spread, cy, r, r, pal['base'])
        if inner and not back:
            c.ellipse(cx + sx * spread, cy + 0.3, r * 0.5, r * 0.5, inner)

def ear_point(c, cx, cy, r, pal, spread, inner=None, back=False):
    for sx in (-1, 1):
        bx = cx + sx * spread
        c.tri((bx - r, cy + r), (bx + r, cy + r), (bx + sx * r * 0.5, cy - r * 1.5), pal['base'])
        if inner and not back:
            c.tri((bx - r * 0.5, cy + r * 0.6), (bx + r * 0.5, cy + r * 0.6), (bx + sx * r * 0.3, cy - r * 0.6), inner)

def ear_floppy(c, cx, cy, r, pal, spread, back=False):
    for sx in (-1, 1):
        c.ellipse(cx + sx * spread * 1.06, cy + r * 0.45, r * 0.78, r * 1.30, pal['dark'])
        if not back:
            c.ellipse(cx + sx * spread * 1.06, cy + r * 0.30, r * 0.42, r * 0.80, pal['base'])

def horns(c, cx, cy, size, style, pal):
    hp = PAL['cream'] if style != 'antler' else PAL['tan']
    for sx in (-1, 1):
        bx = cx + sx * size * 1.3
        if style == 'nub':
            c.ellipse(bx, cy, size * 0.45, size * 0.5, hp['base'])
        elif style == 'curve':
            c.line(bx, cy, bx + sx * size * 0.9, cy - size * 1.1, hp['base'], 2)
            c.line(bx + sx * size * 0.9, cy - size * 1.1, bx + sx * size * 1.7, cy - size * 0.4, hp['base'], 2)
        elif style == 'antler':
            c.line(bx, cy, bx + sx * size * 0.7, cy - size * 1.8, hp['base'], 2)
            c.line(bx + sx * size * 0.4, cy - size, bx + sx * size * 1.6, cy - size * 1.3, hp['base'], 1)
            c.line(bx + sx * size * 0.6, cy - size * 1.5, bx + sx * size * 1.5, cy - size * 2.1, hp['base'], 1)
        elif style == 'spike':
            c.tri((bx - size * 0.5, cy + size * 0.4), (bx + size * 0.5, cy + size * 0.4),
                  (bx + sx * size * 0.4, cy - size * 1.6), hp['base'])

def wings(c, cx, cy, size, style, pal, back=False):
    for sx in (-1, 1):
        bx = cx + sx * size * 0.9
        if style == 'feather':
            c.ellipse(bx + sx * size * 0.5, cy, size * 0.55, size * 1.05, pal['dark'] if not back else pal['base'])
            if back:
                c.ellipse(bx + sx * size * 0.5, cy - size * 0.2, size * 0.35, size * 0.7, pal['light'])
        elif style == 'bat':
            c.tri((bx, cy - size), (bx + sx * size * 1.6, cy - size * 1.3), (bx + sx * size * 1.2, cy + size * 0.8), pal['dark'])
        elif style == 'bug':
            c.ellipse(bx + sx * size * 0.7, cy - size * 0.3, size * 0.8, size * 1.15, pal['light'])
            c.ellipse(bx + sx * size * 0.7, cy - size * 0.3, size * 0.55, size * 0.85, pal['base'])
        elif style == 'fan':
            pass  # handled by fan_tail(), which sits behind the whole body

def fan_tail(c, cx, cy, r, pal):
    """A spread of feathers arcing behind the body (turkeys, peacocks)."""
    for i in range(-4, 5):
        ang = math.radians(i * 21 - 90)
        fx = cx + math.cos(ang) * r
        fy = cy + math.sin(ang) * r * 0.92
        tone = pal['light'] if i % 2 else pal['base']
        c.ellipse(fx, fy, r * 0.20, r * 0.24, tone)
        c.ellipse(fx, fy, r * 0.09, r * 0.11, pal['dark'])


def tail(c, x, y, size, style, pal, back=False):
    if style == 'puff':
        c.blob(x, y, size * 0.8, size * 0.8, PAL['cream'])
    elif style == 'long':
        c.line(x, y, x + size * 1.6, y - size * 1.4, pal['base'], 2)
        c.ellipse(x + size * 1.7, y - size * 1.5, size * 0.5, size * 0.5, pal['light'])
    elif style == 'bushy':
        c.blob(x + size * 0.5, y - size * 0.4, size * 1.0, size * 1.5, pal)
        c.ellipse(x + size * 0.6, y - size * 1.3, size * 0.55, size * 0.6, PAL['cream']['base'])
    elif style == 'curl':
        c.line(x, y, x + size, y - size * 0.6, pal['dark'], 2)
        c.ellipse(x + size * 1.2, y - size * 0.2, size * 0.55, size * 0.55, pal['base'])
        c.ellipse(x + size * 1.2, y - size * 0.2, size * 0.25, size * 0.25, None)
    elif style == 'fin':
        c.tri((x, y), (x + size * 1.8, y - size * 1.2), (x + size * 1.8, y + size * 1.0), pal['light'])
    elif style == 'feathers':
        for i in range(3):
            c.ellipse(x + size * (0.4 + i * 0.45), y - size * (0.2 + i * 0.5), size * 0.42, size * 0.9,
                      pal['base'] if i % 2 == 0 else pal['dark'])

def pattern(c, cx, cy, rx, ry, style, pal):
    if style == 'spots':
        for ox, oy, r in ((-0.45, -0.1, 0.26), (0.38, 0.18, 0.3), (0.02, 0.42, 0.22)):
            c.ellipse(cx + rx * ox, cy + ry * oy, rx * r, ry * r, pal['dark'])
    elif style == 'patch':
        c.ellipse(cx + rx * 0.42, cy - ry * 0.1, rx * 0.44, ry * 0.5, pal['dark'])
    elif style == 'stripes':
        for i in range(-1, 2):
            c.rect(cx - rx * 0.75, cy + i * ry * 0.42 - 1, cx + rx * 0.75, cy + i * ry * 0.42, pal['dark'])
    elif style == 'belly':
        c.ellipse(cx, cy + ry * 0.34, rx * 0.62, ry * 0.55, pal['light'])
    elif style == 'shell':
        c.ellipse(cx, cy, rx * 0.86, ry * 0.86, pal['dark'])
        c.ellipse(cx, cy, rx * 0.66, ry * 0.66, pal['base'])
        c.ellipse(cx, cy, rx * 0.34, ry * 0.34, pal['light'])
    elif style == 'wool':
        for ox, oy in ((-0.55, -0.35), (0.0, -0.6), (0.55, -0.3), (-0.6, 0.2), (0.6, 0.25), (0.0, 0.15)):
            c.ellipse(cx + rx * ox, cy + ry * oy, rx * 0.38, ry * 0.38, pal['light'])
    elif style == 'spikes':
        for i in range(-2, 3):
            bx = cx + rx * i * 0.36
            c.tri((bx - rx * 0.13, cy - ry * 0.55), (bx + rx * 0.13, cy - ry * 0.55),
                  (bx, cy - ry * 1.15), pal['dark'])
    elif style == 'leaf':
        c.ellipse(cx - rx * 0.1, cy - ry * 1.05, rx * 0.30, ry * 0.5, PAL['leaf']['base'])
        c.ellipse(cx + rx * 0.3, cy - ry * 1.0, rx * 0.24, ry * 0.4, PAL['leaf']['light'])


# ------------------------------------------------------------- body plans ---

GROUND = 44

def feet(c, cx, y, spread, w, h, pal, pairs=1):
    for i in range(pairs):
        for sx in (-1, 1):
            c.ellipse(cx + sx * (spread + i * w * 1.6), y - h * 0.3, w, h, pal['dark' if i else 'base'])

def legs(c, cx, y, spread, w, h, pal):
    for sx in (-1, 1):
        c.rect(cx + sx * spread * 1.30 - w, y - h, cx + sx * spread * 1.30 + w, y, pal['dark'])
        c.ellipse(cx + sx * spread * 1.30, y, w + 0.4, h * 0.30, pal['dark'])
    for sx in (-1, 1):
        c.rect(cx + sx * spread - w, y - h, cx + sx * spread + w, y, pal['base'])
        c.ellipse(cx + sx * spread, y, w + 0.4, h * 0.30, pal['dark'])

def face(c, cx, cy, r, s, back):
    """Eyes, blush and whatever the spec asks for. Nothing at all from behind."""
    if back:
        return
    p = PAL[s['pal']]
    eyes(c, cx, cy, max(2.2, r * 0.42), max(1.6, r * 0.20),
         big=(s.get('eye') == 'big'), sleepy=(s.get('eye') == 'sleepy'))
    if s.get('beak'):
        beak(c, cx, cy + r * 0.44, max(2.0, r * 0.26), PAL[s.get('acc', 'gold')])
    elif s.get('snout'):
        snout(c, cx, cy + r * 0.46, max(2.4, r * 0.32), max(1.6, r * 0.21), PAL[s.get('acc', 'pink')])
    else:
        c.line(cx - 1, cy + r * 0.44, cx, cy + r * 0.44 + 1, INK)
        c.line(cx, cy + r * 0.44 + 1, cx + 1, cy + r * 0.44, INK)
    if s.get('blush', True):
        blush(c, cx, cy + r * 0.30, max(3.5, r * 0.68))

def plan_round(c, s, back):
    """Head and body one soft mass: rabbits, rodents, blobs, wool, plants."""
    p = PAL[s['pal']]; sz = s['size']
    r = 9.5 + sz * 6.5
    cy = GROUND - r * 0.94
    if s.get('tail'):
        tail(c, c.w / 2 + r * (0.62 if not back else 0.0), cy + r * 0.52, r * 0.30, s['tail'], p, back)
    c.blob(c.w / 2, cy, r, r * 1.03, p)
    if s.get('pat'):
        pattern(c, c.w / 2, cy, r, r, s['pat'], p)
    feet(c, c.w / 2, GROUND + 1, r * 0.46, r * 0.24, r * 0.17, PAL[s.get('acc', s['pal'])])
    if s.get('ears') == 'long':
        ear_long(c, c.w / 2, cy - r * 0.72, r * 1.15, r * 0.26, p, PAL[s.get('acc', 'pink')]['light'], back=back)
    elif s.get('ears') == 'round':
        ear_round(c, c.w / 2, cy - r * 0.80, r * 0.34, p, r * 0.66, PAL[s.get('acc', 'pink')]['light'], back)
    elif s.get('ears') == 'point':
        ear_point(c, c.w / 2, cy - r * 0.76, r * 0.34, p, r * 0.62, PAL[s.get('acc', 'pink')]['light'], back)
    elif s.get('ears') == 'floppy':
        ear_floppy(c, c.w / 2, cy - r * 0.42, r * 0.42, p, r * 0.92, back)
    if s.get('horns'):
        horns(c, c.w / 2, cy - r * 0.80, r * 0.30, s['horns'], p)
    if s.get('wings'):
        wings(c, c.w / 2, cy, r * 0.72, s['wings'], p, back)
    face(c, c.w / 2, cy + r * 0.04, r, s, back)

def plan_quad(c, s, back):
    """Four legs, head above the chest: farm animals, cats, dogs, deer."""
    p = PAL[s['pal']]; sz = s['size']
    bw = 9.0 + sz * 5.0
    bh = 6.0 + sz * 3.0
    by = GROUND - 9.5 - sz * 5.5
    hr = 5.5 + sz * 3.0
    hy = by - bh * 0.62 - hr * 0.62
    if s.get('tail'):
        tail(c, c.w / 2 + bw * (0.80 if not back else 0.0), by - bh * 0.30, hr * 0.42, s['tail'], p, back)
    legs(c, c.w / 2, GROUND + 1, bw * 0.60, max(1.4, bw * 0.15), 6 + sz * 3, p)
    c.blob(c.w / 2, by, bw, bh, p)
    if s.get('pat'):
        pattern(c, c.w / 2, by, bw, bh, s['pat'], p)
    if s.get('wings'):
        wings(c, c.w / 2, by - bh * 0.2, bw * 0.62, s['wings'], p, back)
    c.blob(c.w / 2, hy, hr, hr * 0.94, p)
    if back and s.get('pat') in ('spots', 'patch'):
        pattern(c, c.w / 2, hy, hr, hr, 'patch', p)
    if s.get('ears') == 'long':
        ear_long(c, c.w / 2, hy - hr * 0.62, hr * 1.05, hr * 0.24, p, PAL[s.get('acc', 'pink')]['light'], back=back)
    elif s.get('ears') == 'round':
        ear_round(c, c.w / 2, hy - hr * 0.72, hr * 0.36, p, hr * 0.70, PAL[s.get('acc', 'pink')]['light'], back)
    elif s.get('ears') == 'point':
        ear_point(c, c.w / 2, hy - hr * 0.66, hr * 0.36, p, hr * 0.64, PAL[s.get('acc', 'pink')]['light'], back)
    elif s.get('ears') == 'floppy':
        ear_floppy(c, c.w / 2, hy - hr * 0.28, hr * 0.44, p, hr * 0.94, back)
    if s.get('horns'):
        horns(c, c.w / 2, hy - hr * 0.74, hr * 0.32, s['horns'], p)
    face(c, c.w / 2, hy + hr * 0.06, hr, s, back)

def plan_bird(c, s, back):
    """Round body, head on top, beak and two feet: chickens, ducks, owls."""
    p = PAL[s['pal']]; sz = s['size']
    br = 8.0 + sz * 5.0
    by = GROUND - br * 0.92
    hr = 5.0 + sz * 3.0
    hy = by - br * 0.78 - hr * 0.42
    if s.get('wings') == 'fan':
        fan_tail(c, c.w / 2, by - br * 0.05, br * 1.75, p)
    if s.get('tail'):
        tail(c, c.w / 2 + br * (0.72 if not back else 0.0), by + br * 0.10, hr * 0.52, s['tail'], p, back)
    feet(c, c.w / 2, GROUND + 2, br * 0.40, br * 0.22, br * 0.15, PAL[s.get('acc', 'gold')])
    c.blob(c.w / 2, by, br, br * 1.02, p)
    if s.get('pat'):
        pattern(c, c.w / 2, by, br, br, s['pat'], p)
    wings(c, c.w / 2, by, br * 0.80, s.get('wings') or 'feather', p, back)
    c.blob(c.w / 2, hy, hr, hr * 0.96, p)
    if s.get('crest'):
        for i, ox in enumerate((-0.4, 0.0, 0.4)):
            c.ellipse(c.w / 2 + hr * ox, hy - hr * (1.0 + (0.18 if i == 1 else 0)), hr * 0.26, hr * 0.36,
                      PAL[s.get('acc', 'red')]['base'])
    if s.get('ears') == 'tuft':
        for sx in (-1, 1):
            c.tri((c.w / 2 + sx * hr * 0.55, hy - hr * 0.6), (c.w / 2 + sx * hr * 0.95, hy - hr * 0.5),
                  (c.w / 2 + sx * hr * 0.95, hy - hr * 1.35), p['dark'])
    s = dict(s); s['beak'] = True
    face(c, c.w / 2, hy + hr * 0.02, hr, s, back)

def plan_aquatic(c, s, back):
    """Fish, seals, turtles: one streamlined mass with fins."""
    p = PAL[s['pal']]; sz = s['size']
    bw = 10.0 + sz * 6.0
    bh = 7.5 + sz * 4.0
    by = GROUND - bh * 0.95
    if s.get('tail'):
        tail(c, c.w / 2 + bw * 0.62, by - bh * 0.1, bh * 0.44, s['tail'], p, back)
    c.blob(c.w / 2, by, bw, bh, p)
    if s.get('pat'):
        pattern(c, c.w / 2, by, bw, bh, s['pat'], p)
    for sx in (-1, 1):
        c.tri((c.w / 2 + sx * bw * 0.55, by + bh * 0.1), (c.w / 2 + sx * bw * 1.25, by + bh * 0.35),
              (c.w / 2 + sx * bw * 0.7, by + bh * 0.75), p['dark' if back else 'light'])
    if s.get('crest'):
        c.tri((c.w / 2 - bw * 0.35, by - bh * 0.85), (c.w / 2 + bw * 0.35, by - bh * 0.85),
              (c.w / 2, by - bh * 1.5), p['light'])
    face(c, c.w / 2, by - bh * 0.12, bh, s, back)

def plan_bug(c, s, back):
    """Segmented body with antennae, sometimes wings."""
    p = PAL[s['pal']]; sz = s['size']
    r = 5.5 + sz * 3.4
    cy = GROUND - r * 1.0
    segs = s.get('segs', 3)
    if s.get('wings'):
        wings(c, c.w / 2, cy - r * 0.2, r * 1.15, s['wings'], p, back)
    for i in range(segs - 1, 0, -1):
        c.blob(c.w / 2, cy + i * r * 0.78, r * (1.0 - i * 0.10), r * 0.72, p)
    c.blob(c.w / 2, cy - r * 0.30, r * 1.02, r * 0.98, p)
    if s.get('pat'):
        pattern(c, c.w / 2, cy + r * 0.6, r, r, s['pat'], p)
    for sx in (-1, 1):
        c.line(c.w / 2 + sx * r * 0.42, cy - r * 0.95, c.w / 2 + sx * r * 1.15, cy - r * 1.85, p['dark'], 1)
        c.ellipse(c.w / 2 + sx * r * 1.20, cy - r * 1.95, r * 0.22, r * 0.22, PAL[s.get('acc', 'gold')]['base'])
    face(c, c.w / 2, cy - r * 0.30, r, s, back)

PLANS = {'round': plan_round, 'quad': plan_quad, 'bird': plan_bird,
         'aquatic': plan_aquatic, 'bug': plan_bug}


def render(spec, back=False):
    c = Canvas()
    s = dict(spec)
    if back:
        s = dict(s, blush=False)
    PLANS[s['arch']](c, s, back)
    c.outline(INK)
    c.shadow_under(c.w / 2, GROUND + 3, 7 + s['size'] * 6)
    return c


# ------------------------------------------------------------- the roster ---

def C(name, arch, pal, size, **kw):
    return dict(name=name, arch=arch, pal=pal, size=size, **kw)

# Each inner list is one evolution family, in order. 20 three-stage lines,
# 35 two-stage lines, 21 that stand alone: 151 creatures.
FAMILIES = [
    [C('BUNNIP', 'round', 'cream', .10, ears='long', tail='puff', acc='pink', eye='big'),
     C('HOPPARD', 'round', 'tan', .45, ears='long', tail='puff', acc='pink'),
     C('LOPALOPE', 'quad', 'brown', .80, ears='floppy', tail='puff', acc='pink', pat='belly')],
    [C('CHIRPLET', 'bird', 'yellow', .08, acc='orange', eye='big'),
     C('PECKLIN', 'bird', 'gold', .42, acc='orange', crest=True, tail='feathers'),
     C('PLUMEHEN', 'bird', 'rust', .78, acc='red', crest=True, tail='feathers', pat='belly')],
    [C('PIGLIN', 'quad', 'pink', .12, ears='point', tail='curl', snout=True, acc='rose', eye='big'),
     C('SNOUTLE', 'quad', 'rose', .48, ears='floppy', tail='curl', snout=True, acc='pink'),
     C('HOGGARTH', 'quad', 'wine', .85, ears='floppy', tail='curl', snout=True, acc='pink', pat='patch')],
    [C('CALFKIN', 'quad', 'cream', .20, ears='round', tail='long', snout=True, acc='pink', pat='patch', eye='big'),
     C('MOOVEN', 'quad', 'white', .55, ears='round', tail='long', snout=True, acc='pink', pat='spots', horns='nub'),
     C('BELLOWE', 'quad', 'ash', .95, ears='round', tail='long', snout=True, acc='pink', pat='spots', horns='curve')],
    [C('LAMBKIN', 'round', 'white', .15, ears='floppy', pat='wool', acc='cream', eye='big'),
     C('WOOLIN', 'round', 'cream', .50, ears='floppy', pat='wool', acc='char'),
     C('FLEECIA', 'round', 'ash', .88, ears='floppy', pat='wool', acc='char', horns='curve')],
    [C('KIDLET', 'quad', 'sand', .15, ears='floppy', tail='puff', horns='nub', acc='cream', eye='big'),
     C('CLAMBER', 'quad', 'tan', .50, ears='floppy', tail='puff', horns='spike', acc='cream'),
     C('CAPRIX', 'quad', 'cocoa', .85, ears='floppy', tail='puff', horns='curve', acc='cream', pat='belly')],
    [C('DUCKLIN', 'bird', 'straw', .10, acc='orange', eye='big'),
     C('PADDLER', 'bird', 'cream', .45, acc='orange', tail='feathers'),
     C('MALLARCH', 'bird', 'forest', .80, acc='gold', tail='feathers', pat='belly', crest=True)],
    [C('GOSLET', 'bird', 'olive', .15, acc='gold', eye='big'),
     C('HONKLER', 'bird', 'ash', .52, acc='orange', tail='feathers'),
     C('GANDARE', 'bird', 'white', .90, acc='orange', tail='feathers', pat='belly')],
    [C('BEANLET', 'round', 'lime', .08, pat='leaf', acc='green', eye='big'),
     C('SPROUTOR', 'round', 'green', .45, pat='leaf', acc='leaf'),
     C('VERDANTHA', 'round', 'forest', .82, pat='leaf', acc='moss', horns='antler')],
    [C('NIBBLET', 'round', 'sand', .08, ears='round', tail='long', acc='pink', eye='big'),
     C('GNAWLIN', 'round', 'tan', .42, ears='round', tail='long', acc='pink', pat='belly'),
     C('BURROWL', 'quad', 'cocoa', .72, ears='round', tail='long', acc='pink', pat='belly')],
    [C('MEWLIN', 'quad', 'grey', .12, ears='point', tail='long', acc='pink', eye='big'),
     C('PURRAX', 'quad', 'slate', .48, ears='point', tail='long', acc='pink', pat='stripes'),
     C('VELVETTE', 'quad', 'char', .78, ears='point', tail='long', acc='pink', pat='stripes')],
    [C('PUPPLET', 'quad', 'straw', .12, ears='floppy', tail='bushy', snout=True, acc='cocoa', eye='big'),
     C('WOOFEN', 'quad', 'tan', .50, ears='floppy', tail='bushy', snout=True, acc='cocoa', pat='patch'),
     C('LOYALDO', 'quad', 'brown', .85, ears='floppy', tail='bushy', snout=True, acc='cream', pat='belly')],
    [C('FINLET', 'aquatic', 'sky', .10, tail='fin', eye='big', acc='blue'),
     C('SPLASHIN', 'aquatic', 'blue', .45, tail='fin', crest=True, acc='teal'),
     C('TIDALLE', 'aquatic', 'navy', .82, tail='fin', crest=True, pat='stripes', acc='aqua')],
    [C('GRUBLET', 'bug', 'lime', .08, segs=3, acc='gold', eye='big'),
     C('COCOONIE', 'round', 'moss', .35, pat='stripes', acc='olive', eye='sleepy'),
     C('FLUTTERA', 'bug', 'violet', .70, segs=2, wings='bug', acc='lilac')],
    [C('TADPOLL', 'aquatic', 'mint', .06, tail='fin', eye='big', acc='green'),
     C('HOPPLET', 'round', 'green', .38, eye='big', acc='lime', pat='spots'),
     C('RIBBITON', 'round', 'forest', .72, eye='big', acc='lime', pat='spots')],
    [C('SHELLET', 'aquatic', 'moss', .12, pat='shell', eye='big', acc='olive'),
     C('PADDLETOP', 'aquatic', 'olive', .48, pat='shell', acc='moss', tail='fin'),
     C('TERRAPINE', 'aquatic', 'forest', .85, pat='shell', acc='moss', tail='fin', crest=True)],
    [C('OWLET', 'bird', 'cocoa', .12, eye='big', acc='gold', ears='tuft'),
     C('HOOTLE', 'bird', 'brown', .48, eye='big', acc='gold', ears='tuft', pat='belly'),
     C('NOCTURNA', 'bird', 'plum', .82, eye='big', acc='gold', ears='tuft', pat='belly', tail='feathers')],
    [C('CUBBIN', 'quad', 'cocoa', .20, ears='round', snout=True, acc='tan', eye='big'),
     C('BRAMBLEAR', 'quad', 'brown', .60, ears='round', snout=True, acc='tan', pat='belly'),
     C('GRIZZLOAM', 'quad', 'char', .98, ears='round', snout=True, acc='sand', pat='belly')],
    [C('KITSLET', 'quad', 'orange', .12, ears='point', tail='bushy', snout=True, acc='cream', eye='big'),
     C('RUSSELLE', 'quad', 'rust', .50, ears='point', tail='bushy', snout=True, acc='cream'),
     C('VULPINA', 'quad', 'red', .80, ears='point', tail='bushy', snout=True, acc='cream', pat='belly')],
    [C('SPORELET', 'round', 'cream', .08, pat='spots', acc='rose', eye='big'),
     C('CAPPLIN', 'round', 'coral', .42, pat='spots', acc='cream'),
     C('MYCELIA', 'round', 'wine', .78, pat='spots', acc='cream', horns='nub')],

    [C('PRICKLET', 'round', 'tan', .15, pat='spikes', snout=True, acc='cocoa', eye='big'),
     C('HEDGEROW', 'round', 'cocoa', .55, pat='spikes', snout=True, acc='tan')],
    [C('FLITTLE', 'round', 'plum', .12, ears='point', wings='bat', acc='lilac', eye='big'),
     C('DUSKWING', 'round', 'violet', .55, ears='point', wings='bat', acc='lilac')],
    [C('PINCHLET', 'aquatic', 'coral', .12, eye='big', acc='red'),
     C('SHORECLAW', 'aquatic', 'red', .55, acc='coral', pat='shell')],
    [C('COILET', 'bug', 'lime', .15, segs=4, acc='green', eye='big'),
     C('MEADOWYRM', 'bug', 'leaf', .60, segs=5, acc='moss')],
    [C('COOLET', 'bird', 'ash', .15, acc='coral', eye='big'),
     C('CITYWING', 'bird', 'slate', .55, acc='coral', pat='belly', tail='feathers')],
    [C('TOFULET', 'round', 'white', .12, eye='big', acc='cream'),
     C('TEMPETH', 'round', 'straw', .55, pat='spots', acc='tan')],
    [C('KALEAF', 'round', 'forest', .15, pat='leaf', acc='leaf', eye='big'),
     C('KALESTRA', 'round', 'moss', .58, pat='leaf', acc='forest', horns='spike')],
    [C('OATLING', 'round', 'straw', .12, pat='leaf', acc='gold', eye='big'),
     C('OATERNAL', 'round', 'sand', .55, pat='leaf', acc='gold')],
    [C('BUZZLET', 'bug', 'gold', .10, wings='bug', pat='stripes', acc='char', eye='big'),
     C('POLLENAIRE', 'bug', 'yellow', .50, wings='bug', pat='stripes', acc='char')],
    [C('ANTLET', 'bug', 'rust', .08, segs=3, acc='cocoa', eye='big'),
     C('FORMICORE', 'bug', 'cocoa', .48, segs=3, acc='rust', horns='nub')],
    [C('BUBBLIN', 'aquatic', 'aqua', .10, tail='fin', eye='big', acc='sky'),
     C('GLIMMERFIN', 'aquatic', 'teal', .52, tail='fin', crest=True, acc='mint')],
    [C('SEALET', 'aquatic', 'ash', .18, eye='big', acc='grey', snout=True),
     C('SELKIE', 'aquatic', 'slate', .62, eye='big', acc='grey', snout=True, pat='belly')],
    [C('OTTERLET', 'quad', 'cocoa', .15, ears='round', tail='long', snout=True, acc='tan', eye='big'),
     C('RIVERSONG', 'quad', 'brown', .55, ears='round', tail='long', snout=True, acc='cream', pat='belly')],
    [C('SQUEAKLET', 'round', 'grey', .06, ears='round', tail='long', acc='pink', eye='big'),
     C('WHISKERO', 'round', 'slate', .40, ears='round', tail='long', acc='pink', pat='belly')],
    [C('ACORNIP', 'round', 'rust', .12, ears='point', tail='bushy', acc='tan', eye='big'),
     C('TUFTAIL', 'quad', 'brown', .52, ears='point', tail='bushy', acc='cream')],
    [C('FOALIN', 'quad', 'tan', .35, ears='point', tail='long', snout=True, acc='cocoa', eye='big'),
     C('GALLOPRA', 'quad', 'brown', .90, ears='point', tail='long', snout=True, acc='char', pat='patch')],
    [C('BRAYLET', 'quad', 'grey', .30, ears='long', tail='long', snout=True, acc='ash', eye='big'),
     C('BURRONNE', 'quad', 'slate', .75, ears='long', tail='long', snout=True, acc='ash', pat='belly')],
    [C('POULTLET', 'bird', 'cocoa', .20, acc='red', eye='big'),
     C('GOBBLARA', 'bird', 'brown', .72, acc='red', crest=True, tail='feathers', wings='fan')],
    [C('PEALET', 'bird', 'teal', .20, acc='gold', eye='big'),
     C('PLUMARIS', 'bird', 'navy', .78, acc='gold', crest=True, wings='fan', tail='feathers')],
    [C('CYGNIP', 'bird', 'ash', .20, acc='char', eye='big'),
     C('SWANESSA', 'bird', 'white', .82, acc='char', tail='feathers', pat='belly')],
    [C('SPOTLET', 'quad', 'sand', .18, ears='point', tail='puff', acc='cream', pat='spots', eye='big'),
     C('LYNXARA', 'quad', 'tan', .68, ears='point', tail='puff', acc='cream', pat='spots')],
    [C('WOLFLET', 'quad', 'grey', .22, ears='point', tail='bushy', snout=True, acc='ash', eye='big'),
     C('LUNARUFF', 'quad', 'slate', .82, ears='point', tail='bushy', snout=True, acc='ash', pat='belly')],
    [C('FAWNLET', 'quad', 'sand', .25, ears='point', tail='puff', acc='cream', pat='spots', eye='big'),
     C('ANTLERIA', 'quad', 'tan', .80, ears='point', tail='puff', acc='cream', horns='antler', pat='spots')],
    [C('PANDLET', 'quad', 'white', .25, ears='round', snout=True, acc='char', pat='patch', eye='big'),
     C('BAMBOOM', 'quad', 'ash', .88, ears='round', snout=True, acc='char', pat='patch')],
    [C('TRUFFLET', 'round', 'cocoa', .10, pat='spots', acc='tan', eye='big'),
     C('FUNGARO', 'round', 'plum', .50, pat='spots', acc='lilac')],
    [C('CARROTOT', 'round', 'orange', .10, pat='leaf', acc='green', eye='big'),
     C('ROOTARCH', 'round', 'rust', .55, pat='leaf', acc='forest', horns='spike')],
    [C('PUMPLET', 'round', 'orange', .15, pat='stripes', acc='leaf', eye='big'),
     C('GOURDIAN', 'round', 'gold', .70, pat='stripes', acc='forest', horns='nub')],
    [C('SPROUTIE', 'round', 'mint', .08, pat='leaf', acc='green', eye='big'),
     C('GREENGALE', 'round', 'green', .55, pat='leaf', acc='lime', wings='bug')],
    [C('LARVLET', 'bug', 'gold', .08, segs=3, acc='olive', eye='big'),
     C('PRISMWING', 'bug', 'sky', .55, segs=2, wings='bug', acc='lilac')],
    [C('NYMPHLET', 'bug', 'teal', .10, segs=3, acc='aqua', eye='big'),
     C('GLIDEWING', 'bug', 'aqua', .50, segs=2, wings='bug', acc='sky')],
    [C('TREEPLET', 'round', 'lime', .08, eye='big', acc='green'),
     C('CANOPPY', 'round', 'leaf', .50, eye='big', acc='lime', pat='spots')],
    [C('PADDLIN', 'aquatic', 'teal', .20, pat='shell', acc='aqua', eye='big'),
     C('OCEANOR', 'aquatic', 'navy', .85, pat='shell', acc='aqua', tail='fin')],
    [C('COCKLET', 'bird', 'cream', .15, acc='red', eye='big'),
     C('ROOSTAR', 'bird', 'rust', .68, acc='red', crest=True, tail='feathers')],
    [C('PENGLET', 'bird', 'ash', .18, acc='orange', eye='big', pat='belly'),
     C('TUXEDON', 'bird', 'char', .72, acc='orange', pat='belly')],
    [C('ALPACLET', 'round', 'cream', .20, ears='point', pat='wool', acc='tan', eye='big'),
     C('FLUFFANDO', 'quad', 'straw', .75, ears='point', pat='wool', acc='cocoa')],

    [C('PIGEONIS', 'bird', 'lilac', .95, acc='coral', crest=True, tail='feathers', pat='belly', wings='fan')],
    [C('MOOCHU', 'round', 'gold', .50, eye='big', acc='straw', pat='spots')],
    [C('BEANWISE', 'round', 'moss', .70, pat='leaf', acc='lime', horns='antler', eye='sleepy')],
    [C('TOFURION', 'round', 'white', .92, acc='ash', eye='sleepy', pat='belly')],
    [C('HAYWAIN', 'round', 'straw', .65, pat='stripes', acc='gold', horns='spike')],
    [C('CLOVERA', 'round', 'green', .35, pat='leaf', acc='lime', eye='big')],
    [C('SUNPETAL', 'round', 'yellow', .45, pat='leaf', acc='gold', horns='spike')],
    [C('DANDELUFF', 'round', 'cream', .30, pat='wool', acc='gold', eye='big')],
    [C('BADGERON', 'quad', 'ash', .62, ears='round', snout=True, acc='char', pat='stripes')],
    [C('MOLEKIN', 'round', 'slate', .28, snout=True, acc='pink', eye='sleepy')],
    [C('RACCOONA', 'quad', 'grey', .55, ears='point', tail='long', snout=True, acc='char', pat='stripes')],
    [C('POSSUMBER', 'quad', 'ash', .50, ears='round', tail='long', snout=True, acc='pink')],
    [C('FERRETTA', 'quad', 'sand', .45, ears='round', tail='bushy', snout=True, acc='cream', pat='patch')],
    [C('LLAMANDA', 'quad', 'cream', .85, ears='point', pat='wool', acc='tan')],
    [C('CAMELIA', 'quad', 'sand', .90, ears='round', tail='puff', snout=True, acc='tan', pat='belly')],
    [C('QUOKKINE', 'round', 'brown', .40, ears='round', tail='long', acc='pink', eye='big')],
    [C('CAPYBLISS', 'quad', 'cocoa', .80, ears='round', snout=True, acc='tan', eye='sleepy')],
    [C('SLOTHEA', 'quad', 'moss', .55, ears='round', snout=True, acc='olive', eye='sleepy', pat='patch')],
    [C('HERONESS', 'bird', 'sky', .80, acc='gold', crest=True, tail='feathers')],
    [C('ROBINETTE', 'bird', 'coral', .30, acc='gold', eye='big', pat='belly')],
    [C('STARLINGA', 'bird', 'plum', .45, acc='gold', pat='spots', tail='feathers')],
]


def roster():
    out, n = [], 0
    for fam in FAMILIES:
        for i, spec in enumerate(fam):
            n += 1
            out.append(dict(spec, num=n, stage=i + 1, stages=len(fam),
                            family=fam[0]['name'], evolves_into=fam[i + 1]['name'] if i + 1 < len(fam) else None))
    return out


# --------------------------------------------------------------------- io ---

def contact_sheet(cans, cols=13, cell=50):
    rows = (len(cans) + cols - 1) // cols
    sheet = Canvas(cols * cell, rows * cell)
    sheet.rect(0, 0, sheet.w - 1, sheet.h - 1, (58, 54, 70))
    for i, c in enumerate(cans):
        ox, oy = (i % cols) * cell + 1, (i // cols) * cell + 1
        for y in range(c.h):
            for x in range(c.w):
                if c.px[y][x] is not None:
                    sheet.set(ox + x, oy + y, c.px[y][x])
    return sheet


def main():
    ap = argparse.ArgumentParser(description="Draw the 151 sanctuary creatures.")
    ap.add_argument('--out', default='creatures', help="output folder (default: creatures)")
    ap.add_argument('--only', help="a number, list or range, e.g. 7 or 1,4,9 or 1-20")
    a = ap.parse_args()

    all_specs = roster()
    if len(all_specs) != 151:
        print(f"warning: roster holds {len(all_specs)} creatures, expected 151")

    picked = all_specs
    if a.only:
        want = set()
        for part in a.only.split(','):
            if '-' in part:
                lo, hi = part.split('-'); want.update(range(int(lo), int(hi) + 1))
            else:
                want.add(int(part))
        picked = [s for s in all_specs if s['num'] in want]

    os.makedirs(a.out, exist_ok=True)
    os.makedirs(os.path.join(a.out, 'back'), exist_ok=True)

    fronts, backs = [], []
    for s in picked:
        f = render(s, back=False)
        b = render(s, back=True)
        f.save(os.path.join(a.out, f"{s['num']}.png"))
        b.save(os.path.join(a.out, 'back', f"{s['num']}.png"))
        fronts.append(f); backs.append(b)

    with open(os.path.join(a.out, 'manifest.json'), 'w') as fh:
        json.dump([{k: v for k, v in s.items() if k in
                    ('num', 'name', 'family', 'stage', 'stages', 'evolves_into', 'arch', 'pal')}
                   for s in all_specs], fh, indent=1)

    lines = ["# The 151 sanctuary creatures", "",
             f"{sum(1 for f in FAMILIES if len(f) == 3)} three-stage lines, "
             f"{sum(1 for f in FAMILIES if len(f) == 2)} two-stage lines, "
             f"{sum(1 for f in FAMILIES if len(f) == 1)} that stand alone.", "",
             "| # | name | line | evolves into |", "|---|---|---|---|"]
    for s in all_specs:
        line = f"{s['stage']} of {s['stages']}" if s['stages'] > 1 else "single"
        lines.append(f"| {s['num']} | {s['name']} | {line} | {s['evolves_into'] or '-'} |")
    with open(os.path.join(a.out, 'ROSTER.md'), 'w') as fh:
        fh.write('\n'.join(lines) + '\n')

    contact_sheet(fronts).save(os.path.join(a.out, '_sheet_front.png'))
    contact_sheet(backs).save(os.path.join(a.out, '_sheet_back.png'))
    print(f"{len(picked)} creatures -> {a.out}/1.png .. {a.out}/{len(all_specs)}.png and {a.out}/back/")
    print(f"also wrote manifest.json, ROSTER.md, _sheet_front.png, _sheet_back.png")


if __name__ == '__main__':
    main()
