# Art & data contract — "James Birthday Game" (Pokémon Red-style browser RPG)

All art is authored as text pixel maps in plain JavaScript files under `js/`. The engine compiles them
into canvases at load time and renders three "eras": Game Boy (4 grays), Game Boy Color (15-bit color),
and GBA (full color + effects). One piece of art serves all three eras.

## Sprite file format

Each file is an IIFE that adds entries to `window.SPRITES`:

```js
(function () {
  const S = window.SPRITES = window.SPRITES || {};
  S['tile_grass'] = {
    w: 16, h: 16,
    // char -> '#rrggbb' or '#rrggbb:N' where N (0-3) is the Game Boy shade: 0 = black, 1 = dark gray, 2 = light gray, 3 = white.
    // If ':N' is omitted the shade is derived from luminance. ALWAYS give explicit shades for characters and animals.
    pal: { 'a': '#88c070:2', 'b': '#58a048:1', 'k': '#000000:0' },
    rows: [
      'aaaaaaaaaaaaaaaa',   // exactly w characters per row, exactly h rows
      // ...
    ]
  };
})();
```

Rules:
- `'.'` is always transparent. Every other character used in `rows` must exist in `pal`. Palette keys are single characters.
- Sizes: tiles 16x16, overworld characters/animals 16x16, battle sprites 48x48.
- Style: Gen 1/Gen 2 Game Boy pixel art. 1-pixel dark outlines on characters and animals, 2-3 tones of shading per material,
  light from the top-left, big readable silhouettes, cute rounded shapes. Tiles are seamless where they repeat (grass, path, water, pavement).
- Game Boy readability: the right half of every preview PNG shows the 4-shade version. Adjacent materials must land on
  different shades (e.g. outline 0, hair 1, skin 3, shirt 2). Check it.
- No copyrighted sprites. Original art in the same spirit only.

Preview loop (mandatory, do it at least twice):
```
node tools/render.js js/<yourfile>.js            # validates + writes tools/out/<yourfile>/<sprite>.png and _sheet.png
```
Then use the Read tool on the PNGs (each shows color on the left, Game Boy shades on the right) and fix what looks wrong.
Validation errors (row length, unknown chars) must be zero when you finish.

## Semantic palette keys (engine recolors these)

Characters (all 16x16): `k` outline, `s` skin, `h` hair, `t` shirt/top, `p` pants, `e` shoes, `w` white (eyes/teeth),
`a` accent (cap, bag, apron, coat trim). Use exactly these keys so NPCs can be recolored.
Building tiles: `r` roof main, `q` roof shadow, `x` roof highlight, `w` wall, `v` wall shadow, `k` outline, `g` glass/window,
`d` door. Extra keys are allowed for details.

## Naming

- Tiles: `tile_<name>`; animated tiles `tile_<name>_0`, `tile_<name>_1`.
- Characters: `<char>_down_0` (standing, facing camera), `<char>_down_1` (walking frame; the engine mirrors it for the other foot),
  `<char>_up_0`, `<char>_up_1`, `<char>_left_0`, `<char>_left_1` (right is mirrored by the engine). Feet on the bottom row,
  head starting around row 1-2; sprites are 16x16 but characters look ~14 px tall.
- Animals overworld: `ow_<species>_down_0/1`, `ow_<species>_up_0/1`, `ow_<species>_left_0/1` (same convention).
- Battle sprites: `front_<species>` (48x48, the animal seen from the front, as the wild/enemy side; feet near the bottom,
  centered), `back_<species>` (48x48, seen from behind at a slight angle, as your own animal shown bottom-left; can be cropped
  at the bottom edge). Skeptic humans: `front_<class>` 48x48. Player: `back_hero` 48x48.

## Map file format (for map authors)

```js
(function () {
  const M = window.MAPS = window.MAPS || {};
  M['pallet'] = {
    name: 'PALLET TOWN', era: 0, music: 'pallet', border: 'tree', indoor: false,
    legend: { 'Q': 'roof_l:red' },      // per-map overrides/additions to the default legend (see js/tiles.js)
    rows: [ 'TTTTTTTTTTTTTTTTTTTT', /* ... h rows of w chars */ ],
    exits: [ { edge: 'north', from: 9, to: 10, map: 'route1', offset: 0 } ],   // walking off the north edge at x in [9,10] warps to route1 at (x+offset, bottom)
    objects: [
      { type: 'warp', x: 5, y: 6, map: 'player_house_1f', tx: 3, ty: 7, dir: 'up' },   // stepping on (x,y) warps
      { type: 'sign', x: 8, y: 9, text: ['PALLET TOWN', 'Shades of your journey await!'] },
      { type: 'npc', id: 'pallet_girl', x: 12, y: 8, sprite: 'girl', pal: { t: '#e04848' }, dir: 'down', move: 'wander', range: 3, dialog: ['Hi!'] },
      { type: 'item', id: 'pallet_bean1', x: 3, y: 14, item: 'BEANS', qty: 1, hidden: true },
      { type: 'trigger', x: 10, y: 0, w: 2, h: 1, script: 'prof_stop' },
    ],
    encounters: { rate: 0.12, table: [['BUNNY', 2, 4, 50], ['CHICK', 2, 4, 50]] },   // only for maps with tall grass
  };
})();
```
The default tile legend and the list of tile ids live in `js/tiles.js`. Map preview: `node tools/rendermap.js js/maps_x.js <mapid>`.
