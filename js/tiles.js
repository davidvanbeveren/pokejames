// Tile registry + default map legend. Map files reference tile ids (optionally with a ':variant' palette suffix).
(function () {
  const T = window.TILES = {};
  const solid = (sprite, extra) => Object.assign({ sprite, solid: true }, extra || {});
  const walk = (sprite, extra) => Object.assign({ sprite, solid: false }, extra || {});
  // ---- outdoor
  T.grass = walk('tile_grass');
  T.tallgrass = walk('tile_tallgrass', { grass: true });
  T.path = walk('tile_path');
  T.pavement = walk('tile_pavement');
  T.sand = walk('tile_sand');
  T.grass_edge_dirt = walk('tile_grass_edge_dirt');
  T.flower = walk(['tile_flower_0', 'tile_flower_1'], { anim: 40 });
  T.flowerbed = solid('tile_flowerbed');
  T.tree = solid('tile_tree');
  T.water = solid(['tile_water_0', 'tile_water_1'], { anim: 30, water: true });
  T.water_edge = solid('tile_water_edge', { water: true });
  T.fence_h = solid('tile_fence_h');
  T.fence_v = solid('tile_fence_v');
  T.sign = solid('tile_sign');
  T.ledge = walk('tile_ledge', { ledge: 'down' });
  T.rock = solid('tile_rock');
  T.bush = solid('tile_bush');
  T.lamp = solid('tile_lamp');
  T.bench = solid('tile_bench');
  // ---- buildings (recolorable via ':variant')
  for (const id of ['roof_l', 'roof_m', 'roof_r', 'roof2_l', 'roof2_m', 'roof2_r', 'wall', 'wall_l', 'wall_r', 'window',
    'sign_mart', 'sign_center', 'sign_lab', 'sign_gym', 'sign_vh', 'sign_violet']) T[id] = solid('tile_' + id, { building: true });
  T.door = walk('tile_door', { door: true, building: true }); // solid unless a warp object sits on it
  // ---- indoor
  T.floor = walk('tile_floor');
  T.floor_tile = walk('tile_floor_tile');
  T.rug = walk('tile_rug');
  T.carpet_purple = walk('tile_carpet_purple');
  T.mat = walk('tile_mat');
  T.void = solid('tile_void');
  for (const id of ['wall_in', 'window_in', 'poster_vh', 'poster_violet', 'banner_l', 'banner_m', 'banner_r', 'bed_top', 'bed_bot', 'pc', 'tv',
    'table', 'chair_l', 'chair_r', 'shelf', 'plant', 'desk', 'machine', 'lab_table', 'lab_table_item', 'cake', 'balloon', 'present', 'sofa', 'fridge', 'stove']) T[id] = solid('tile_' + id);
  T.counter = solid('tile_counter', { counter: true });
  T.stairs_up = walk('tile_stairs_up', { stairs: true });
  T.stairs_down = walk('tile_stairs_down', { stairs: true });

  // Palette variants for recolorable building tiles (keys r/q/x = roof, w/v = wall, d = door).
  window.TILE_VARIANTS = {
    red: {},
    blue: { r: '#5878e0', q: '#3850a8', x: '#90a8f8' },
    purple: { r: '#9058c8', q: '#603890', x: '#c090f0' },
    green: { r: '#50a850', q: '#307030', x: '#88d888' },
    pink: { r: '#f080a8', q: '#c05080', x: '#f8b0d0' },
    gray: { r: '#909098', q: '#606068', x: '#c0c0c8' },
    yellow: { r: '#e8c040', q: '#b08820', x: '#f8e080' },
    brown: { r: '#a87048', q: '#704828', x: '#d0a078' },
    teal: { r: '#40a8a0', q: '#287068', x: '#80d8d0' },
    orange: { r: '#e88840', q: '#b05820', x: '#f8b880' },
  };

  // Default legend: single character -> tile id. Maps may override/extend with their own `legend`.
  window.TILE_LEGEND = {
    '.': 'grass', ',': 'tallgrass', '=': 'path', '#': 'pavement', ':': 'sand', ';': 'grass_edge_dirt',
    'f': 'flower', 'F': 'flowerbed', 'T': 'tree', '~': 'water', '%': 'water_edge',
    '-': 'fence_h', '|': 'fence_v', 'S': 'sign', '_': 'ledge', 'r': 'rock', 'b': 'bush', 'L': 'lamp', 'n': 'bench',
    // red-roofed house pieces
    '1': 'roof_l:red', '2': 'roof_m:red', '3': 'roof_r:red', '4': 'roof2_l:red', '5': 'roof2_m:red', '6': 'roof2_r:red',
    'W': 'wall', '[': 'wall_l', ']': 'wall_r', 'X': 'window', 'D': 'door',
    'M': 'sign_mart', 'C': 'sign_center', 'A': 'sign_lab', 'G': 'sign_gym', 'V': 'sign_vh', 'U': 'sign_violet',
    // indoor
    '0': 'void', 'o': 'floor', 'O': 'floor_tile', 'u': 'rug', 'p': 'carpet_purple', 'm': 'mat',
    'w': 'wall_in', 'x': 'window_in', 'v': 'poster_vh', 'y': 'poster_violet', '<': 'banner_l', '^': 'banner_m', '>': 'banner_r',
    'B': 'bed_top', 'E': 'bed_bot', 'P': 'pc', 't': 'tv', 'a': 'table', 'c': 'chair_l', 'd': 'chair_r', 'h': 'shelf', 'k': 'counter',
    '/': 'stairs_up', '\\': 'stairs_down', 'q': 'plant', 'e': 'desk', 'H': 'machine', 'l': 'lab_table', 'i': 'lab_table_item',
    'K': 'cake', 'j': 'balloon', 'g': 'present', 's': 'sofa', 'R': 'fridge', 'Q': 'stove',
  };
})();
