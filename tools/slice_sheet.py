#!/usr/bin/env python3
"""Slice a sprite sheet into individual PNG files.

Two ways to describe the grid:

  fixed   you give --rows/--cols (and optionally --cell-width/--cell-height,
          --margin, --spacing) and the sheet is cut on those exact lines.
  auto    --auto finds the sprites itself by looking for the blank rows and
          columns between them, so uneven spacing and hand-made sheets work.

Examples
  python3 tools/slice_sheet.py sheet.png --rows 13 --cols 12
  python3 tools/slice_sheet.py sheet.png --cell-width 32 --cell-height 32 --margin 4 --spacing 2
  python3 tools/slice_sheet.py sheet.png --auto --trim --uniform --anchor bottom
  python3 tools/slice_sheet.py sheet.png --auto --bg "#ffffff" --tolerance 12 --out sprites

Output: sprites/001.png, sprites/002.png, ... (see --out, --prefix, --digits, --start).
Blank cells are skipped unless you pass --keep-blanks.
"""
import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install Pillow")


# ---------------------------------------------------------------- background

def parse_color(text):
    """'#rrggbb' or 'r,g,b' -> (r, g, b)."""
    text = text.strip().lstrip('#')
    if ',' in text:
        parts = [int(p) for p in text.split(',')]
        if len(parts) != 3:
            raise argparse.ArgumentTypeError("colour needs three parts: r,g,b")
        return tuple(parts)
    if len(text) == 3:                       # #abc -> #aabbcc
        text = ''.join(c * 2 for c in text)
    if len(text) != 6:
        raise argparse.ArgumentTypeError("colour must look like #rrggbb or r,g,b")
    return tuple(int(text[i:i + 2], 16) for i in (0, 2, 4))


def background_test(img, mode, tolerance):
    """Return a function px -> True when that pixel counts as background."""
    if mode == 'none':
        return lambda p: p[3] == 0

    if mode == 'auto':
        # Transparent sheets: alpha alone decides. Otherwise take the most
        # common colour along the outer border as the background.
        w, h = img.size
        px = img.load()
        if any(px[x, y][3] < 255 for x in range(w) for y in (0, h - 1)):
            return lambda p: p[3] < 128
        edge = {}
        for x in range(w):
            for y in (0, h - 1):
                edge[px[x, y][:3]] = edge.get(px[x, y][:3], 0) + 1
        for y in range(h):
            for x in (0, w - 1):
                edge[px[x, y][:3]] = edge.get(px[x, y][:3], 0) + 1
        colour = max(edge, key=edge.get)
    else:
        colour = parse_color(mode)

    def is_bg(p):
        if p[3] < 128:
            return True
        return max(abs(p[i] - colour[i]) for i in range(3)) <= tolerance

    return is_bg


# ------------------------------------------------------------------- slicing

def fixed_boxes(size, rows, cols, cell_w, cell_h, margin, spacing):
    """Cell rectangles for an evenly spaced grid."""
    w, h = size
    if cell_w is None:
        cell_w = (w - 2 * margin - spacing * (cols - 1)) // cols
    if cell_h is None:
        cell_h = (h - 2 * margin - spacing * (rows - 1)) // rows
    if cell_w <= 0 or cell_h <= 0:
        sys.exit("cell size came out at or below zero - check --rows/--cols/--margin/--spacing")

    used_w = 2 * margin + cols * cell_w + spacing * (cols - 1)
    used_h = 2 * margin + rows * cell_h + spacing * (rows - 1)
    if used_w > w or used_h > h:
        sys.exit(f"grid needs {used_w}x{used_h} but the sheet is only {w}x{h}")
    if used_w != w or used_h != h:
        print(f"note: grid covers {used_w}x{used_h} of a {w}x{h} sheet; "
              f"{w - used_w}px right and {h - used_h}px bottom ignored")

    boxes = []
    for r in range(rows):
        for c in range(cols):
            x = margin + c * (cell_w + spacing)
            y = margin + r * (cell_h + spacing)
            boxes.append((x, y, x + cell_w, y + cell_h))
    return boxes, cell_w, cell_h


def bands(flags, min_gap):
    """Turn a per-line 'has content' list into (start, end) content runs."""
    runs, start = [], None
    gap = 0
    for i, has in enumerate(flags):
        if has:
            if start is None:
                start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                runs.append((start, i - gap))
                start = None
                gap = 0
    if start is not None:
        runs.append((start, len(flags) - 1))
    return runs


def auto_boxes(img, is_bg, min_gap):
    """Find sprite cells from the blank rows and columns between them."""
    w, h = img.size
    px = img.load()
    content = [[not is_bg(px[x, y]) for x in range(w)] for y in range(h)]

    row_has = [any(row) for row in content]
    row_bands = bands(row_has, min_gap)
    if not row_bands:
        sys.exit("no sprites found - try --bg/--tolerance, or the sheet may be empty")

    boxes = []
    for top, bottom in row_bands:
        col_has = [any(content[y][x] for y in range(top, bottom + 1)) for x in range(w)]
        for left, right in bands(col_has, min_gap):
            boxes.append((left, top, right + 1, bottom + 1))
    return boxes, row_bands


# ------------------------------------------------------------------ per cell

def content_box(cell, is_bg):
    """Tight bounding box of the non-background pixels, or None if empty."""
    w, h = cell.size
    px = cell.load()
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if not is_bg(px[x, y]):
                x0 = min(x0, x); y0 = min(y0, y)
                x1 = max(x1, x); y1 = max(y1, y)
    if x1 < 0:
        return None
    return (x0, y0, x1 + 1, y1 + 1)


def clear_background(cell, is_bg):
    """Make background pixels transparent, leave everything else alone."""
    out = Image.new('RGBA', cell.size, (0, 0, 0, 0))
    src, dst = cell.load(), out.load()
    for y in range(cell.size[1]):
        for x in range(cell.size[0]):
            p = src[x, y]
            if not is_bg(p):
                dst[x, y] = p
    return out


def place(sprite, size, anchor):
    """Centre a sprite on a transparent canvas of the given size."""
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    x = (size[0] - sprite.size[0]) // 2
    y = size[1] - sprite.size[1] if anchor == 'bottom' else (size[1] - sprite.size[1]) // 2
    canvas.paste(sprite, (x, y))
    return canvas


# ---------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(
        description="Cut a sprite sheet into numbered PNG files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split('Examples', 1)[1] if 'Examples' in __doc__ else None)
    ap.add_argument('sheet', help="the sprite sheet image")
    ap.add_argument('--out', default='sprites', help="output folder (default: sprites)")

    grid = ap.add_argument_group('grid')
    grid.add_argument('--rows', type=int, help="number of rows")
    grid.add_argument('--cols', type=int, help="number of columns")
    grid.add_argument('--cell-width', type=int, help="cell width in pixels (else derived from the sheet)")
    grid.add_argument('--cell-height', type=int, help="cell height in pixels (else derived from the sheet)")
    grid.add_argument('--margin', type=int, default=0, help="blank border around the whole grid (default: 0)")
    grid.add_argument('--spacing', type=int, default=0, help="gap between cells (default: 0)")
    grid.add_argument('--auto', action='store_true', help="find the sprites instead of using a fixed grid")
    grid.add_argument('--min-gap', type=int, default=2,
                      help="with --auto, blank pixels needed to split two sprites (default: 2)")
    grid.add_argument('--order', choices=['row', 'column'], default='row',
                      help="numbering order for a fixed grid (default: row)")

    look = ap.add_argument_group('pixels')
    look.add_argument('--bg', default='auto',
                      help="background: auto (default), none, or a colour like '#ffffff'")
    look.add_argument('--tolerance', type=int, default=0,
                      help="how far a pixel may drift from the background colour and still count as background")
    look.add_argument('--keep-bg', action='store_true',
                      help="leave the background in place instead of making it transparent")
    look.add_argument('--trim', action='store_true', help="crop each sprite to its own content")
    look.add_argument('--uniform', action='store_true',
                      help="pad every sprite to the largest one so they share a size")
    look.add_argument('--anchor', choices=['center', 'bottom'], default='bottom',
                      help="where a sprite sits when padded (default: bottom)")
    look.add_argument('--scale', type=int, default=1, help="nearest-neighbour scale factor (default: 1)")
    look.add_argument('--keep-blanks', action='store_true', help="also write empty cells")

    name = ap.add_argument_group('naming')
    name.add_argument('--prefix', default='', help="filename prefix, e.g. 'creature_'")
    name.add_argument('--digits', type=int, default=3, help="zero padding (default: 3 -> 001.png)")
    name.add_argument('--start', type=int, default=1, help="first number (default: 1)")
    name.add_argument('--dry-run', action='store_true', help="report what would be written, write nothing")

    a = ap.parse_args()

    if not os.path.exists(a.sheet):
        sys.exit(f"no such file: {a.sheet}")
    img = Image.open(a.sheet).convert('RGBA')
    print(f"{os.path.basename(a.sheet)}: {img.size[0]}x{img.size[1]}")

    is_bg = background_test(img, a.bg, a.tolerance)

    if a.auto:
        boxes, row_bands = auto_boxes(img, is_bg, a.min_gap)
        print(f"auto grid: {len(row_bands)} rows, {len(boxes)} sprites")
    else:
        if not (a.rows and a.cols) and not (a.cell_width and a.cell_height):
            sys.exit("give --rows and --cols, or --cell-width and --cell-height, or use --auto")
        rows, cols = a.rows, a.cols
        if not rows:
            rows = (img.size[1] - 2 * a.margin + a.spacing) // (a.cell_height + a.spacing)
        if not cols:
            cols = (img.size[0] - 2 * a.margin + a.spacing) // (a.cell_width + a.spacing)
        boxes, cw, ch = fixed_boxes(img.size, rows, cols, a.cell_width, a.cell_height, a.margin, a.spacing)
        print(f"grid: {rows} rows x {cols} cols, cells {cw}x{ch}")
        if a.order == 'column':
            boxes = [boxes[r * cols + c] for c in range(cols) for r in range(rows)]

    # cut, clean, trim
    sprites = []
    for index, box in enumerate(boxes):
        cell = img.crop(box)
        box_content = content_box(cell, is_bg)
        if box_content is None and not a.keep_blanks:
            continue
        if not a.keep_bg:
            cell = clear_background(cell, is_bg)
        if a.trim and box_content:
            cell = cell.crop(box_content)
        sprites.append((index, box, cell))

    if not sprites:
        sys.exit("nothing to write - every cell looked empty")

    if a.uniform:
        size = (max(s.size[0] for _, _, s in sprites), max(s.size[1] for _, _, s in sprites))
        sprites = [(i, b, place(s, size, a.anchor)) for i, b, s in sprites]
        print(f"uniform size: {size[0]}x{size[1]} (anchor {a.anchor})")

    if a.scale != 1:
        sprites = [(i, b, s.resize((s.size[0] * a.scale, s.size[1] * a.scale), Image.NEAREST))
                   for i, b, s in sprites]

    skipped = len(boxes) - len(sprites)
    if skipped:
        print(f"skipped {skipped} empty cell{'s' if skipped != 1 else ''}")

    if a.dry_run:
        for n, (_, box, sprite) in enumerate(sprites, start=a.start):
            print(f"  {a.prefix}{n:0{a.digits}d}.png  from {box}  {sprite.size[0]}x{sprite.size[1]}")
        print(f"dry run: {len(sprites)} sprites, nothing written")
        return

    os.makedirs(a.out, exist_ok=True)
    for n, (_, _, sprite) in enumerate(sprites, start=a.start):
        sprite.save(os.path.join(a.out, f"{a.prefix}{n:0{a.digits}d}.png"))

    first = f"{a.prefix}{a.start:0{a.digits}d}.png"
    last = f"{a.prefix}{a.start + len(sprites) - 1:0{a.digits}d}.png"
    print(f"wrote {len(sprites)} sprites to {a.out}/  ({first} .. {last})")


if __name__ == '__main__':
    main()
