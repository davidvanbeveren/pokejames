#!/usr/bin/env python3
"""Import a character sprite sheet PNG pixel-for-pixel into the game's sprite format.

Usage:
  python3 tools/import_sheet.py art/kate_hero.png --name hero --out js/sprites_hero_kate.js \
      [--cols 4 --rows 4] [--dirs down,left,right,up] [--frames 0,1,0,2] [--bg auto|transparent|#rrggbb]

The sheet is a grid of equal cells (cols x rows). Each row is one facing direction (default order
down, left, right, up — like most Pokemon-style sheets) and each column a frame (default: stand,
walk A, stand, walk B -> frames 0, 1, 0, 2). Every pixel becomes one game pixel; colours are kept
exactly; the Game Boy shade of each colour is derived from its luminance (override with --shades).
All frames share one crop box (the union of their content) so the character never jitters between frames.
"""
import argparse, os, sys
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('png'); ap.add_argument('--name', default='hero'); ap.add_argument('--out', required=True)
ap.add_argument('--cols', type=int, default=4); ap.add_argument('--rows', type=int, default=4)
ap.add_argument('--dirs', default='down,left,right,up'); ap.add_argument('--frames', default='0,1,0,2')
ap.add_argument('--bg', default='auto', help="'auto' (transparent, else the top-left pixel colour), 'transparent', or '#rrggbb'")
ap.add_argument('--width', type=int, default=16, help='output sprite width (content is centred in it)')
ap.add_argument('--tolerance', type=int, default=0, help='colour distance (0-255) below which a pixel counts as background')
ap.add_argument('--single', default=None, help='import the whole image as ONE sprite with this exact name (e.g. back_hero)')
args = ap.parse_args()
if args.single: args.cols = args.rows = 1; args.dirs = 'x'; args.frames = '0'

img = Image.open(args.png).convert('RGBA')
W, H = img.size
cw, ch = W // args.cols, H // args.rows
if cw * args.cols != W or ch * args.rows != H:
    print(f'warning: {W}x{H} does not divide evenly into {args.cols}x{args.rows} cells ({cw}x{ch}); trailing pixels ignored')
px = img.load()

# background detection
def is_transparent(p): return p[3] < 128
bg = None
if args.bg == 'transparent': bg = None
elif args.bg == 'auto':
    corner = px[0, 0]
    if not is_transparent(corner): bg = corner[:3]
else:
    h = args.bg.lstrip('#'); bg = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def is_bg(p):
    if is_transparent(p): return True
    if bg is None: return False
    return max(abs(p[0] - bg[0]), abs(p[1] - bg[1]), abs(p[2] - bg[2])) <= args.tolerance

dirs = args.dirs.split(','); frames = [int(f) for f in args.frames.split(',')]
assert len(dirs) == args.rows and len(frames) == args.cols, 'dirs must match rows and frames must match cols'

# union crop box across all cells (relative to the cell)
minx, miny, maxx, maxy = cw, ch, -1, -1
for r in range(args.rows):
    for c in range(args.cols):
        for y in range(ch):
            for x in range(cw):
                if not is_bg(px[c * cw + x, r * ch + y]):
                    minx, miny, maxx, maxy = min(minx, x), min(miny, y), max(maxx, x), max(maxy, y)
if maxx < 0: sys.exit('no non-background pixels found; check --bg')
cwid, chei = maxx - minx + 1, maxy - miny + 1
outw = max(args.width, cwid); outh = chei
xoff = (outw - cwid) // 2
print(f'cells {cw}x{ch}; content box {cwid}x{chei} at ({minx},{miny}); output sprites {outw}x{outh}')

# palette: exact colours -> single-char keys
colors = {}
letters = [c for c in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789']
def shade(rgb):
    l = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
    return 0 if l < 0.25 else 1 if l < 0.5 else 2 if l < 0.78 else 3
def key(rgb):
    if rgb not in colors:
        if len(colors) >= len(letters): sys.exit('too many colours (max 62)')
        colors[rgb] = letters[len(colors)]
    return colors[rgb]

sprites = {}
for r, d in enumerate(dirs):
    seen = set()
    for c, f in enumerate(frames):
        if f in seen: continue  # duplicate stand frame in the sheet
        seen.add(f)
        rows = []
        for y in range(miny, miny + chei):
            row = ['.'] * outw
            for x in range(minx, minx + cwid):
                p = px[c * cw + x, r * ch + y]
                if is_bg(p): continue
                row[xoff + x - minx] = key(p[:3])
            rows.append(''.join(row))
        sprites[args.single if args.single else f'{args.name}_{d}_{f}'] = rows

pal = ', '.join(f"'{k}': '#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}:{shade(rgb)}'" for rgb, k in colors.items())
out = ['// Imported pixel-for-pixel from ' + os.path.basename(args.png) + ' by tools/import_sheet.py', '(function () {', '  const S = window.SPRITES = window.SPRITES || {};', f'  const PAL = {{ {pal} }};']
for name, rows in sprites.items():
    out.append(f"  S['{name}'] = {{ w: {outw}, h: {outh}, pal: PAL, rows: [")
    for row in rows: out.append(f"    '{row}',")
    out.append('  ] };')
out.append('})();')
open(args.out, 'w').write('\n'.join(out) + '\n')
print(f'wrote {args.out}: {len(sprites)} sprites, {len(colors)} colours')
print('palette:', ', '.join(f"{k}=#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x} (shade {shade(rgb)})" for rgb, k in colors.items()))
