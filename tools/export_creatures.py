#!/usr/bin/env python3
"""Turn the 151 creatures into the two files the game loads.

    js/creatures_art.js   every front and back sprite, run-length encoded,
                          plus overworld walking sprites derived from them
    js/creatures_data.js  species table: kind, stats, moves, evolution, dex entry

    python3 tools/export_creatures.py
"""
import hashlib, importlib.util, json, os

try:
    from PIL import Image
except ImportError:
    Image = None

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod

HERE = os.path.dirname(os.path.abspath(__file__))
mk = load('mk', os.path.join(HERE, 'make_creatures.py'))
lore = load('lore', os.path.join(HERE, 'creature_lore.py'))

ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+,;<=>?@[]^_`{|}~"


# --------------------------------------------------------------- png loading

def cutout_background(im):
    """Clear a flat opaque background so the sprite reads as a cut-out.

    The PNGs in creatures/ are saved with a solid white background and no alpha
    at all, which made every sprite built from one render as an opaque box. Only
    the background region touching the border is cleared, so white *inside* the
    creature (eyes, highlights, a white body) survives."""
    w, h = im.size
    px = im.load()
    if any(px[x, y][3] < 128 for y in range(h) for x in range(w)):
        return im                                    # already has real alpha: trust it
    bg = px[0, 0][:3]
    def matches(p):
        return max(abs(p[0] - bg[0]), abs(p[1] - bg[1]), abs(p[2] - bg[2])) <= 12
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    seen = [[False] * w for _ in range(h)]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            continue
        if not matches(px[x, y]):
            continue
        seen[y][x] = True
        px[x, y] = (0, 0, 0, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return im


def canvas_from_png(path):
    """Load a hand-edited sprite. Any size works: it is fitted into the 48x48
    frame, centred, standing on the same ground line as everything else."""
    im = cutout_background(Image.open(path).convert('RGBA'))
    if im.size[0] > 48 or im.size[1] > 48:
        scale = min(48 / im.size[0], 48 / im.size[1])
        im = im.resize((max(1, int(im.size[0] * scale)), max(1, int(im.size[1] * scale))), Image.NEAREST)
    w, h = im.size
    src = im.load()
    c = mk.Canvas(48, 48)
    if (w, h) == (48, 48):                       # already the right frame: use it exactly
        for y in range(48):
            for x in range(48):
                if src[x, y][3] >= 128:
                    c.px[y][x] = src[x, y][:3]
        return c
    xs = [(x, y) for y in range(h) for x in range(w) if src[x, y][3] >= 128]
    if not xs:
        return c
    x0 = min(p[0] for p in xs); x1 = max(p[0] for p in xs)
    y0 = min(p[1] for p in xs); y1 = max(p[1] for p in xs)
    ox = (48 - (x1 - x0 + 1)) // 2 - x0
    oy = 46 - (y1 - y0 + 1) - y0
    for x, y in xs:
        c.set(x + ox, y + oy, src[x, y][:3])
    return c


def sprites_for(c, art_dir):
    """The front and back art for one creature: whatever is in creatures/,
    falling back to drawing it."""
    front_png = os.path.join(art_dir, '%d.png' % c['num'])
    back_png = os.path.join(art_dir, 'back', '%d.png' % c['num'])
    if art_dir and Image and os.path.exists(front_png) and os.path.exists(back_png):
        return canvas_from_png(front_png), canvas_from_png(back_png), True
    return mk.render(c, back=False), mk.render(c, back=True), False


# ------------------------------------------------------------------- sprites

def shade_of(rgb):
    l = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
    return 0 if l < 0.22 else 1 if l < 0.48 else 2 if l < 0.76 else 3

GLOBAL = {}
def gidx(rgb):
    if rgb not in GLOBAL:
        GLOBAL[rgb] = len(GLOBAL)
    return GLOBAL[rgb]

def encode(canvas):
    """-> ([global palette indices], 'run length string')"""
    local, order = {}, []
    for row in canvas.px:
        for p in row:
            if p is not None and p not in local:
                local[p] = ALPHA[len(order)]; order.append(p)
    if len(order) > len(ALPHA):
        raise SystemExit('too many colours in one sprite')
    flat = [('.' if p is None else local[p]) for row in canvas.px for p in row]
    out, i = [], 0
    while i < len(flat):
        j = i
        while j < len(flat) and flat[j] == flat[i]:
            j += 1
        out.append(flat[i] + (str(j - i) if j - i > 1 else ''))
        i = j
    return [gidx(c) for c in order], ''.join(out)

def downsample(canvas, factor=3):
    """48x48 battle sprite -> 16x16 overworld sprite, keeping the common colour."""
    n = canvas.w // factor
    small = mk.Canvas(n, n)
    for y in range(n):
        for x in range(n):
            counts = {}
            for dy in range(factor):
                for dx in range(factor):
                    p = canvas.px[y * factor + dy][x * factor + dx]
                    if p is not None:
                        counts[p] = counts.get(p, 0) + 1
            if counts and sum(counts.values()) >= 3:
                small.px[y][x] = max(counts, key=counts.get)
    return small

def hop(canvas):
    """The same sprite lifted one pixel: the walk frame."""
    out = mk.Canvas(canvas.w, canvas.h)
    for y in range(1, canvas.h):
        out.px[y - 1] = list(canvas.px[y])
    return out


# ---------------------------------------------------------------------- data

WEIGHTS = {'quad': (.30, .24, .28, .18), 'round': (.28, .26, .24, .22),
           'bird': (.24, .26, .22, .28), 'aquatic': (.27, .25, .25, .23),
           'bug': (.22, .27, .21, .30)}
TOTALS = {(1, 3): 240, (2, 3): 340, (3, 3): 470, (1, 2): 260, (2, 2): 420, (1, 1): 380}
LEGENDARY = {'PIGEONIS', 'BEANWISE', 'TOFURION', 'MOOCHU'}

def jitter(name, salt, spread=0.06):
    h = int(hashlib.sha1((name + salt).encode()).hexdigest()[:8], 16)
    return 1.0 + ((h % 1000) / 1000.0 * 2 - 1) * spread

def stats_for(c):
    total = 530 if c['name'] in LEGENDARY else TOTALS[(c['stage'], c['stages'])]
    w = WEIGHTS[c['arch']]
    keys = ('hp', 'atk', 'def', 'spd')
    return {k: max(20, int(round(total * w[i] * jitter(c['name'], k)))) for i, k in enumerate(keys)}

def moves_for(kind, stage):
    out = []
    for lvl, mv in lore.KINDS[kind][3]:
        out.append([1 if (stage > 1 and lvl <= 10) else lvl, mv])
    return out

def build(art_dir):
    specs = mk.roster()
    art, data = {}, []
    from_png = 0
    for c in specs:
        kind, dex = lore.LORE[c['name']]
        key = c['name'].lower()
        front, back, used_png = sprites_for(c, art_dir)
        from_png += 1 if used_png else 0
        art['front_' + key] = encode(front)
        art['back_' + key] = encode(back)
        ow_front, ow_back = downsample(front), downsample(back)
        art['ow_%s_down_0' % key] = encode(ow_front)
        art['ow_%s_down_1' % key] = encode(hop(ow_front))
        art['ow_%s_left_0' % key] = encode(ow_front)
        art['ow_%s_left_1' % key] = encode(hop(ow_front))
        art['ow_%s_up_0' % key] = encode(ow_back)
        art['ow_%s_up_1' % key] = encode(hop(ow_back))

        fav, like, cry, _ = lore.KINDS[kind]
        entry = dict(num=c['num'], name=c['name'], kind=kind, entry=dex,
                     base=stats_for(c), moves=moves_for(kind, c['stage']),
                     foods={'fav': fav, 'like': like}, cry=cry,
                     height=round(0.15 + c['size'] * 1.5, 1),
                     weight=round(1 + c['size'] ** 2 * 600, 1),
                     baseExp=int(60 + c['size'] * 130 + (c['stage'] - 1) * 30))
        if c['name'] in LEGENDARY:
            entry['legendary'] = True
        if c['evolves_into']:
            entry['evolve'] = {'lvl': 16 if c['stages'] == 3 and c['stage'] == 1 else
                                      (32 if c['stages'] == 3 else 20),
                               'to': c['evolves_into']}
        data.append(entry)
    print(f"{from_png} of {len(specs)} taken from {art_dir}/, {len(specs) - from_png} drawn")
    return art, data


def main():
    import argparse
    ap = argparse.ArgumentParser(description="Rebuild the game's creature sprites and species table.")
    ap.add_argument('--art', default=os.path.join(HERE, '..', 'creatures'),
                    help="folder of sprite PNGs (default: creatures/)")
    ap.add_argument('--drawn', action='store_true', help="ignore the PNGs and redraw everything")
    a = ap.parse_args()
    art, data = build(None if a.drawn else a.art)
    js = os.path.join(HERE, '..', 'js')

    pal = [None] * len(GLOBAL)
    for rgb, i in GLOBAL.items():
        pal[i] = '#%02x%02x%02x:%d' % (rgb[0], rgb[1], rgb[2], shade_of(rgb))

    lines = ["// The 151 sanctuary creatures: battle and overworld sprites.",
             "// Generated by tools/export_creatures.py from tools/make_creatures.py - do not hand-edit.",
             "(function () {",
             "  const S = window.SPRITES = window.SPRITES || {};",
             "  const ALPHA = %s;" % json.dumps(ALPHA),
             "  const P = %s;" % json.dumps(pal),
             "  const D = {"]
    for name, (idxs, rle) in art.items():
        lines.append('    %s: [[%s], "%s"],' % (json.dumps(name), ','.join(map(str, idxs)), rle))
    lines += ["  };",
              "  // each entry unpacks into the {w, h, pal, rows} shape every other sprite uses",
              "  for (const name in D) {",
              "    const idxs = D[name][0], data = D[name][1];",
              "    const size = name.startsWith('ow_') ? 16 : 48;",
              "    const pal = {};",
              "    for (let i = 0; i < idxs.length; i++) pal[ALPHA[i]] = P[idxs[i]];",
              "    const out = []; let row = '';",
              "    for (let i = 0; i < data.length;) {",
              "      const ch = data[i++]; let n = '';",
              "      while (i < data.length && data[i] >= '0' && data[i] <= '9') n += data[i++];",
              "      let count = n ? parseInt(n, 10) : 1;",
              "      while (count-- > 0) { row += ch; if (row.length === size) { out.push(row); row = ''; } }",
              "    }",
              "    S[name] = { w: size, h: size, pal: pal, rows: out };",
              "  }",
              "  // the maps were written against the old animal names",
              "  const ALIAS = { bunny: 'bunnip', chick: 'chirplet', cow: 'mooven', duck: 'paddler',",
              "    goat: 'caprix', goose: 'honkler', piglet: 'piglin', pigeon: 'coolet', sheep: 'woolin',",
              "    lamb: 'lambkin', calf: 'calfkin', hen: 'plumehen', pig: 'hoggarth', rabbit: 'hoppard',",
              "    duckling: 'ducklin', gosling: 'goslet', kidgoat: 'kidlet', turkey: 'gobblara' };",
              "  for (const from in ALIAS) {",
              "    for (const suffix of ['down_0', 'down_1', 'up_0', 'up_1', 'left_0', 'left_1'])",
              "      if (S['ow_' + ALIAS[from] + '_' + suffix]) S['ow_' + from + '_' + suffix] = S['ow_' + ALIAS[from] + '_' + suffix];",
              "    for (const view of ['front_', 'back_'])",
              "      if (S[view + ALIAS[from]]) S[view + from] = S[view + ALIAS[from]];",
              "  }",
              "})();"]
    open(os.path.join(js, 'creatures_art.js'), 'w').write('\n'.join(lines) + '\n')

    out = ["// Species table for the 151 creatures. Generated by tools/export_creatures.py.",
           "window.CREATURES = ["]
    for e in data:
        out.append('  ' + json.dumps(e, separators=(',', ':')) + ',')
    out.append('];')
    open(os.path.join(js, 'creatures_data.js'), 'w').write('\n'.join(out) + '\n')

    kb = lambda p: os.path.getsize(os.path.join(js, p)) / 1024
    print(f"js/creatures_art.js   {kb('creatures_art.js'):6.0f} KB  ({len(art)} sprites, {len(GLOBAL)} colours)")
    print(f"js/creatures_data.js  {kb('creatures_data.js'):6.0f} KB  ({len(data)} species)")


if __name__ == '__main__':
    main()
