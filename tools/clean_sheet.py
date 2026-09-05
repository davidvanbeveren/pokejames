#!/usr/bin/env python3
"""Turn a scaled-up / JPEG-compressed sprite sheet back into a clean 1x RGBA PNG with exact colours.
Usage: python3 tools/clean_sheet.py in.jpg out.png --scale 2 [--k 14] [--merge 26] [--bgtol 70]
- downsamples by averaging each scale x scale block
- flood-fills the background (near-white) from the image border -> transparent (interior whites survive)
- quantises the remaining colours to k clusters (k-means) and merges clusters closer than --merge
"""
import argparse, math, random
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--scale', type=int, default=2); ap.add_argument('--k', type=int, default=14); ap.add_argument('--merge', type=float, default=26); ap.add_argument('--bgtol', type=int, default=70)
a = ap.parse_args()
im = Image.open(a.inp).convert('RGB'); W, H = im.size; s = a.scale; w, h = W // s, H // s; px = im.load()
small = [[None] * w for _ in range(h)]
for y in range(h):
    for x in range(w):
        r = g = b = 0
        for dy in range(s):
            for dx in range(s):
                p = px[x * s + dx, y * s + dy]; r += p[0]; g += p[1]; b += p[2]
        n = s * s; small[y][x] = (r // n, g // n, b // n)
def dist(p, q): return math.sqrt(sum((p[i] - q[i]) ** 2 for i in range(3)))
# background flood fill from the border
bgc = (255, 255, 255)
bg = [[False] * w for _ in range(h)]
stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
while stack:
    x, y = stack.pop()
    if x < 0 or y < 0 or x >= w or y >= h or bg[y][x]: continue
    if dist(small[y][x], bgc) > a.bgtol: continue
    bg[y][x] = True; stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
pts = [small[y][x] for y in range(h) for x in range(w) if not bg[y][x]]
print(f'{w}x{h} logical pixels, {len(pts)} sprite pixels')
# k-means
random.seed(7)
centers = random.sample(pts, min(a.k, len(pts)))
for it in range(25):
    buckets = [[] for _ in centers]
    for p in pts:
        i = min(range(len(centers)), key=lambda i: dist(p, centers[i])); buckets[i].append(p)
    new = []
    for i, bk in enumerate(buckets):
        if bk: new.append(tuple(sum(q[c] for q in bk) // len(bk) for c in range(3)))
        else: new.append(centers[i])
    if new == centers: break
    centers = new
# merge close clusters (weighted by size)
sizes = [len(b) for b in buckets]
merged = True
while merged:
    merged = False
    for i in range(len(centers)):
        for j in range(i + 1, len(centers)):
            if dist(centers[i], centers[j]) < a.merge:
                n = sizes[i] + sizes[j]
                centers[i] = tuple((centers[i][c] * sizes[i] + centers[j][c] * sizes[j]) // n for c in range(3)); sizes[i] = n
                del centers[j]; del sizes[j]; merged = True; break
        if merged: break
print('palette:', ', '.join(f'#{c[0]:02x}{c[1]:02x}{c[2]:02x}' for c in centers))
out = Image.new('RGBA', (w, h), (0, 0, 0, 0)); op = out.load()
for y in range(h):
    for x in range(w):
        if bg[y][x]: continue
        p = small[y][x]; c = min(centers, key=lambda c: dist(p, c)); op[x, y] = (c[0], c[1], c[2], 255)
out.save(a.out); print('wrote', a.out)
