#!/usr/bin/env python3
"""Turn an upscaled pixel-art PNG into a clean, correctly sized sprite PNG.

Downloaded trainer sprites are usually pixel art blown up by an integer factor
(a 61px character stored as a 512x512 image). This finds that factor, undoes it,
crops to the character, scales it to the target height, and centres it on a
transparent canvas with the feet on the bottom row — the shape js/sprites_*.js
battle sprites use. Feed the result to tools/import_sheet.py --single.

  python3 tools/fit_sprite.py ~/Downloads/foo.png art/gymbro.png --size 48

Downscaling picks the most common colour in each source block rather than point
sampling, which keeps 1px outlines from dropping out. No new colours are ever
invented, so the palette stays small enough for the sprite format.
"""
import argparse, collections, math, sys
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--size', type=int, default=48, help='output canvas, square (default 48)')
ap.add_argument('--height', type=int, default=0, help='character height in px (default: fill the canvas)')
ap.add_argument('--scale', type=int, default=0, help='override the detected upscale factor')
ap.add_argument('--pad-bottom', type=int, default=0, help='empty rows to leave under the feet')
ap.add_argument('--colors', type=int, default=0, help='quantise to at most N colours (for resampled/anti-aliased art)')
args = ap.parse_args()

im = Image.open(args.src).convert('RGBA')
box = im.getbbox()
if not box: sys.exit('image is fully transparent')
im = im.crop(box)
W, H = im.size
px = im.load()

# ---- detect the integer upscale factor from run lengths of identical pixels
def detect_scale():
    runs = []
    for y in range(0, H, max(1, H // 60)):
        prev, run = px[0, y], 1
        for x in range(1, W):
            c = px[x, y]
            if c == prev: run += 1
            else: runs.append(run); run = 1; prev = c
        runs.append(run)
    for x in range(0, W, max(1, W // 60)):
        prev, run = px[x, 0], 1
        for y in range(1, H):
            c = px[x, y]
            if c == prev: run += 1
            else: runs.append(run); run = 1; prev = c
        runs.append(run)
    g = 0
    for r in runs: g = math.gcd(g, r)
    return max(1, g)

scale = args.scale or detect_scale()
nw, nh = max(1, round(W / scale)), max(1, round(H / scale))
print(f'source {W}x{H} (cropped), upscale factor {scale} -> native {nw}x{nh}')

def resample(src, sw, sh, tw, th):
    """Block-mode downsample: each target pixel takes the commonest colour under it."""
    out = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    o = out.load(); s = src.load()
    for ty in range(th):
        y0, y1 = int(ty * sh / th), max(int(ty * sh / th) + 1, int((ty + 1) * sh / th))
        for tx in range(tw):
            x0, x1 = int(tx * sw / tw), max(int(tx * sw / tw) + 1, int((tx + 1) * sw / tw))
            counts = collections.Counter()
            for y in range(y0, min(y1, sh)):
                for x in range(x0, min(x1, sw)):
                    p = s[x, y]
                    counts[p if p[3] >= 128 else None] += 1
            best, n = counts.most_common(1)[0]
            # a block that is mostly transparent stays transparent
            if best is None: continue
            o[tx, ty] = best
    return out

native = resample(im, W, H, nw, nh)

target_h = args.height or (args.size - args.pad_bottom)
scale = target_h / nh
if round(nw * scale) > args.size:                 # wider than tall: fit the width instead
    scale = args.size / nw
target_w, target_h = max(1, round(nw * scale)), max(1, round(nh * scale))
if (target_w, target_h) != (nw, nh):
    native = resample(native, nw, nh, target_w, target_h)
print(f'fitted to {target_w}x{target_h}')

canvas = Image.new('RGBA', (args.size, args.size), (0, 0, 0, 0))
canvas.paste(native, ((args.size - target_w) // 2, args.size - args.pad_bottom - target_h))
if args.colors:
    # Screenshots of sprites are anti-aliased into hundreds of near-identical shades;
    # the sprite format allows 62. Quantise the opaque pixels and keep alpha binary.
    alpha = canvas.getchannel('A')
    flat = Image.new('RGB', canvas.size, (255, 0, 255))
    flat.paste(canvas.convert('RGB'), (0, 0), alpha)
    q = flat.quantize(colors=args.colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    canvas = q.convert('RGBA')
    canvas.putalpha(alpha.point(lambda v: 255 if v >= 128 else 0))
canvas.save(args.dst)
cols = len({p for p in canvas.convert("RGBA").getdata() if p[3] >= 128})
print(f'wrote {args.dst}: {args.size}x{args.size} canvas, {cols} colours')
