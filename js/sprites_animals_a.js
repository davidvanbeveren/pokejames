// Animal sprites: bunny -> rabbit, chick -> hen. Original Gen1/2-style farm-animal art.
// Built with small pixel-grid helpers (ellipse fill + outline pass) so shapes stay round/clean;
// the final window.SPRITES entries are plain {w,h,pal,rows} data like every other sprite file.
(function () {
  const S = window.SPRITES = window.SPRITES || {};

  // ---------- pixel grid helpers ----------
  function grid(w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('.')); return g; }
  function set(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
  function get(g, x, y) { if (y < 0 || y >= g.length || x < 0 || x >= g[0].length) return '.'; return g[y][x]; }
  // filled ellipse, pixel-center sampling
  function ell(g, cx, cy, rx, ry, c) {
    const h = g.length, w = g[0].length;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(g, x, y, c);
    }
  }
  function rect(g, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(g, x, y, c); }
  function px(g, x, y, c) { set(g, x, y, c); }
  // explicit row spans: [y, x0, x1]
  function spans(g, list, c) { for (const [y, x0, x1] of list) for (let x = x0; x <= x1; x++) set(g, x, y, c); }
  // silhouette outline: any non-'.'/non-outline pixel touching background (4-neighbour) becomes outline color
  function outline(g, k) {
    const h = g.length, w = g[0].length, edges = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = g[y][x];
      if (c === '.' || c === k) continue;
      if (get(g, x - 1, y) === '.' || get(g, x + 1, y) === '.' || get(g, x, y - 1) === '.' || get(g, x, y + 1) === '.') edges.push([x, y]);
    }
    for (const [x, y] of edges) g[y][x] = k;
  }
  function rowsOf(g) { return g.map(r => r.join('')); }
  function sprite(name, w, h, pal, build) {
    const g = grid(w, h);
    build(g);
    S[name] = { w, h, pal, rows: rowsOf(g) };
  }

  // ===================================================================
  // BUNNY (starter baby) — small round fluffy rabbit, cream/white, pink ears
  // ===================================================================
  const PAL_BUNNY = {
    k: '#1a1414:0', // outline (also eyes)
    b: '#e8d8b8:2', // fur main
    d: '#c0a878:1', // fur shadow
    w: '#fbf3e4:3', // fur highlight / belly / tail
    p: '#f6a8c0:3', // ear inner
    q: '#cf6a8c:1', // ear inner shadow
    n: '#d9607e:1', // nose
  };

  sprite('front_bunny', 48, 48, PAL_BUNNY, g => {
    // ears
    ell(g, 14.5, 9, 3.4, 8, 'b'); ell(g, 32.5, 9, 3.4, 8, 'b');
    ell(g, 14.5, 10, 1.6, 5.8, 'p'); ell(g, 32.5, 10, 1.6, 5.8, 'p');
    ell(g, 15.6, 12, 0.8, 4.2, 'q'); ell(g, 31.4, 12, 0.8, 4.2, 'q');
    // head + body
    ell(g, 23.5, 21, 11.5, 10.5, 'b');
    ell(g, 23.5, 35, 13.5, 11.5, 'b');
    // shadow (light from top-left -> shade bottom-right)
    ell(g, 29, 40, 9, 8, 'd');
    ell(g, 31, 22, 6, 7, 'd');
    // belly / chest highlight
    ell(g, 23.5, 39, 7.5, 6.5, 'w');
    // front paws
    ell(g, 17, 39, 2.6, 3, 'd'); ell(g, 30, 39, 2.6, 3, 'd');
    // feet
    ell(g, 17, 45, 3.6, 2.6, 'b'); ell(g, 30, 45, 3.6, 2.6, 'b');
    // face
    px(g, 18, 19, 'k'); px(g, 19, 19, 'k'); px(g, 18, 20, 'k'); px(g, 19, 20, 'k');
    px(g, 28, 19, 'k'); px(g, 29, 19, 'k'); px(g, 28, 20, 'k'); px(g, 29, 20, 'k');
    px(g, 18, 19, 'w'); px(g, 28, 19, 'w'); // sparkle
    ell(g, 23.5, 25, 1.6, 1.2, 'n');
    outline(g, 'k');
  });

  sprite('back_bunny', 48, 48, PAL_BUNNY, g => {
    ell(g, 17, 8, 3, 7.5, 'd'); ell(g, 30.5, 8, 3, 7.5, 'd');
    ell(g, 17, 9, 1.6, 5.4, 'b'); ell(g, 30.5, 9, 1.6, 5.4, 'b');
    ell(g, 23.5, 19, 11, 9.5, 'b');
    ell(g, 23.5, 36, 15.5, 14, 'b');
    ell(g, 30, 40, 11, 11, 'd');
    ell(g, 23.5, 44, 4.6, 4, 'w');
    ell(g, 15, 47, 3.4, 2.4, 'd'); ell(g, 32, 47, 3.4, 2.4, 'd');
    outline(g, 'k');
  });

  const bunnyOwPal = PAL_BUNNY;
  function bunnyBase(g, cx) {
    ell(g, cx, 11, 3.7, 3.2, 'b');
    ell(g, cx, 7, 3.3, 3, 'b');
  }
  sprite('ow_bunny_down_0', 16, 16, bunnyOwPal, g => {
    bunnyBase(g, 7.5);
    ell(g, 5.3, 3, 1.5, 2.6, 'b'); ell(g, 9.7, 3, 1.5, 2.6, 'b');
    ell(g, 5.3, 3.4, 0.65, 1.7, 'p'); ell(g, 9.7, 3.4, 0.65, 1.7, 'p');
    px(g, 5, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 5, 14, 'd'); px(g, 9, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_bunny_down_1', 16, 16, bunnyOwPal, g => {
    bunnyBase(g, 7.5);
    ell(g, 5.3, 3, 1.5, 2.6, 'b'); ell(g, 9.7, 3, 1.5, 2.6, 'b');
    ell(g, 5.3, 3.4, 0.65, 1.7, 'p'); ell(g, 9.7, 3.4, 0.65, 1.7, 'p');
    px(g, 5, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 5, 13, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_bunny_up_0', 16, 16, bunnyOwPal, g => {
    bunnyBase(g, 7.5);
    ell(g, 5.3, 3, 1.5, 2.6, 'b'); ell(g, 9.7, 3, 1.5, 2.6, 'b');
    ell(g, 5.7, 3.4, 0.65, 1.7, 'd'); ell(g, 9.3, 3.4, 0.65, 1.7, 'd');
    px(g, 7, 12, 'w'); px(g, 8, 12, 'w');
    px(g, 5, 14, 'd'); px(g, 9, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_bunny_up_1', 16, 16, bunnyOwPal, g => {
    bunnyBase(g, 7.5);
    ell(g, 5.3, 3, 1.5, 2.6, 'b'); ell(g, 9.7, 3, 1.5, 2.6, 'b');
    ell(g, 5.7, 3.4, 0.65, 1.7, 'd'); ell(g, 9.3, 3.4, 0.65, 1.7, 'd');
    px(g, 7, 12, 'w'); px(g, 8, 12, 'w');
    px(g, 5, 13, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_bunny_left_0', 16, 16, bunnyOwPal, g => {
    ell(g, 8.3, 11, 3.6, 3.2, 'b');
    ell(g, 6.6, 7, 3.1, 2.8, 'b');
    ell(g, 7.6, 3, 1.6, 2.7, 'b');
    ell(g, 7.6, 3.4, 0.65, 1.7, 'p');
    px(g, 4, 7, 'k');
    px(g, 3, 8, 'n');
    px(g, 6, 14, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_bunny_left_1', 16, 16, bunnyOwPal, g => {
    ell(g, 8.3, 11, 3.6, 3.2, 'b');
    ell(g, 6.6, 7, 3.1, 2.8, 'b');
    ell(g, 7.6, 3, 1.6, 2.7, 'b');
    ell(g, 7.6, 3.4, 0.65, 1.7, 'p');
    px(g, 4, 7, 'k');
    px(g, 3, 8, 'n');
    px(g, 5, 13, 'd'); px(g, 11, 14, 'd');
    outline(g, 'k');
  });

  // ===================================================================
  // RABBIT (grown) — larger, sleeker, tan/brown, confident stance
  // ===================================================================
  const PAL_RABBIT = {
    k: '#1a1210:0',
    b: '#cf9a5c:2',
    d: '#a4713a:1',
    w: '#f2ddb0:3',
    p: '#e997a8:3',
    q: '#c06a80:1',
    n: '#7a3a2a:1',
  };

  sprite('front_rabbit', 48, 48, PAL_RABBIT, g => {
    // long ears
    ell(g, 15, 8, 3, 10, 'b'); ell(g, 32, 6.5, 3, 10.5, 'b');
    ell(g, 15, 9, 1.3, 7.2, 'p'); ell(g, 32, 7.5, 1.3, 7.6, 'p');
    ell(g, 16, 12, 0.7, 5.2, 'q'); ell(g, 31, 10, 0.7, 5.4, 'q');
    // head
    ell(g, 23.5, 23, 9.5, 9, 'b');
    ell(g, 23.5, 28, 5.4, 3.8, 'w'); // muzzle
    // body (upright, broad shoulders)
    ell(g, 23.5, 38, 14.5, 12.5, 'b');
    ell(g, 30, 43, 10, 7, 'd');
    // haunches / legs
    ell(g, 15.5, 44, 4.4, 4, 'b'); ell(g, 31.5, 44, 4.4, 4, 'b');
    ell(g, 15.5, 46.5, 4, 2.2, 'd'); ell(g, 31.5, 46.5, 4, 2.2, 'd');
    // belly highlight
    ell(g, 23.5, 40, 7.5, 8, 'w');
    // paws
    ell(g, 17, 35, 2.6, 3, 'd'); ell(g, 30, 35, 2.6, 3, 'd');
    // face
    px(g, 18, 20, 'k'); px(g, 19, 20, 'k'); px(g, 18, 21, 'k'); px(g, 19, 21, 'k');
    px(g, 28, 20, 'k'); px(g, 29, 20, 'k'); px(g, 28, 21, 'k'); px(g, 29, 21, 'k');
    px(g, 18, 20, 'w'); px(g, 28, 20, 'w');
    ell(g, 23.5, 29, 1.8, 1.2, 'n');
    outline(g, 'k');
  });

  sprite('back_rabbit', 48, 48, PAL_RABBIT, g => {
    ell(g, 17, 6, 2.8, 9.5, 'd'); ell(g, 31, 5, 2.8, 10, 'd');
    ell(g, 17, 7, 1.4, 6.8, 'b'); ell(g, 31, 6, 1.4, 7.2, 'b');
    ell(g, 23.5, 18, 10, 9, 'b');
    ell(g, 23.5, 37, 16, 15, 'b');
    ell(g, 31, 42, 11, 11, 'd');
    ell(g, 23.5, 46, 4.8, 3.6, 'w');
    ell(g, 14, 47.5, 3.8, 2.2, 'd'); ell(g, 33, 47.5, 3.8, 2.2, 'd');
    outline(g, 'k');
  });

  const rabbitOwPal = PAL_RABBIT;
  function rabbitBase(g, cx) {
    ell(g, cx, 10.5, 4, 3.6, 'b');
    ell(g, cx, 6, 3.3, 3, 'b');
  }
  sprite('ow_rabbit_down_0', 16, 16, rabbitOwPal, g => {
    rabbitBase(g, 7.5);
    ell(g, 5.4, 1.6, 1.5, 3.4, 'b'); ell(g, 9.6, 1.6, 1.5, 3.4, 'b');
    ell(g, 5.4, 2, 0.65, 2.2, 'p'); ell(g, 9.6, 2, 0.65, 2.2, 'p');
    px(g, 5, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 5, 14, 'd'); px(g, 9, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_rabbit_down_1', 16, 16, rabbitOwPal, g => {
    rabbitBase(g, 7.5);
    ell(g, 5.4, 1.6, 1.5, 3.4, 'b'); ell(g, 9.6, 1.6, 1.5, 3.4, 'b');
    ell(g, 5.4, 2, 0.65, 2.2, 'p'); ell(g, 9.6, 2, 0.65, 2.2, 'p');
    px(g, 5, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 4, 13, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_rabbit_up_0', 16, 16, rabbitOwPal, g => {
    rabbitBase(g, 7.5);
    ell(g, 5.4, 1.6, 1.5, 3.4, 'b'); ell(g, 9.6, 1.6, 1.5, 3.4, 'b');
    ell(g, 5.7, 2, 0.65, 2.2, 'd'); ell(g, 9.3, 2, 0.65, 2.2, 'd');
    px(g, 7, 12, 'w'); px(g, 8, 12, 'w');
    px(g, 5, 14, 'd'); px(g, 9, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_rabbit_up_1', 16, 16, rabbitOwPal, g => {
    rabbitBase(g, 7.5);
    ell(g, 5.4, 1.6, 1.5, 3.4, 'b'); ell(g, 9.6, 1.6, 1.5, 3.4, 'b');
    ell(g, 5.7, 2, 0.65, 2.2, 'd'); ell(g, 9.3, 2, 0.65, 2.2, 'd');
    px(g, 7, 12, 'w'); px(g, 8, 12, 'w');
    px(g, 4, 13, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_rabbit_left_0', 16, 16, rabbitOwPal, g => {
    ell(g, 8.4, 10.5, 3.9, 3.6, 'b');
    ell(g, 6.5, 6, 3, 2.8, 'b');
    ell(g, 7.4, 1.6, 1.6, 3.4, 'b');
    ell(g, 7.4, 2, 0.65, 2.2, 'p');
    px(g, 4, 6, 'k');
    px(g, 3, 7, 'n');
    px(g, 5, 14, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_rabbit_left_1', 16, 16, rabbitOwPal, g => {
    ell(g, 8.4, 10.5, 3.9, 3.6, 'b');
    ell(g, 6.5, 6, 3, 2.8, 'b');
    ell(g, 7.4, 1.6, 1.6, 3.4, 'b');
    ell(g, 7.4, 2, 0.65, 2.2, 'p');
    px(g, 4, 6, 'k');
    px(g, 3, 7, 'n');
    px(g, 4, 13, 'd'); px(g, 11, 14, 'd');
    outline(g, 'k');
  });

  // ===================================================================
  // CHICK (starter baby) — tiny round yellow puffball, stub wings, orange beak
  // ===================================================================
  const PAL_CHICK = {
    k: '#241a08:0',
    y: '#f6cf3d:2',
    o: '#d19a1f:1',
    h: '#fdf0a8:3',
    e: '#f6902a:1',
  };

  sprite('front_chick', 48, 48, PAL_CHICK, g => {
    ell(g, 23.5, 27, 15.5, 14.5, 'y');
    ell(g, 10, 28, 3.8, 6, 'o'); ell(g, 37, 28, 3.8, 6, 'o'); // wing nubs
    ell(g, 29, 33, 8, 8, 'o'); // shadow bottom-right
    ell(g, 18, 18, 6.5, 6, 'h'); // highlight top-left
    // beak
    spans(g, [[24, 21, 26], [25, 20, 27], [26, 20, 27], [27, 21, 26], [28, 22, 25]], 'e');
    // feet
    ell(g, 17, 42, 2.4, 2.2, 'e'); ell(g, 30, 42, 2.4, 2.2, 'e');
    // eyes
    px(g, 15, 21, 'k'); px(g, 16, 21, 'k'); px(g, 15, 22, 'k'); px(g, 16, 22, 'k');
    px(g, 31, 21, 'k'); px(g, 32, 21, 'k'); px(g, 31, 22, 'k'); px(g, 32, 22, 'k');
    px(g, 15, 21, 'h'); px(g, 31, 21, 'h');
    outline(g, 'k');
  });

  sprite('back_chick', 48, 48, PAL_CHICK, g => {
    ell(g, 23.5, 30, 17, 16, 'y');
    ell(g, 8.5, 31, 3.6, 6, 'o'); ell(g, 38.5, 31, 3.6, 6, 'o');
    ell(g, 30, 34, 10, 10, 'o');
    ell(g, 17, 17, 6, 6, 'h');
    ell(g, 25, 15, 4.5, 4.5, 'h'); // small fluffy tuft, overlaps top of body
    ell(g, 16, 44, 2.6, 2.2, 'e'); ell(g, 31, 44, 2.6, 2.2, 'e');
    outline(g, 'k');
  });

  const chickOwPal = PAL_CHICK;
  function chickBase(g, cx) { ell(g, cx, 10, 3.5, 3, 'y'); ell(g, cx - 3.2, 10, 1, 1.6, 'o'); ell(g, cx + 3.2, 10, 1, 1.6, 'o'); }
  sprite('ow_chick_down_0', 16, 16, chickOwPal, g => {
    chickBase(g, 7.5);
    px(g, 5, 9, 'k'); px(g, 9, 9, 'k');
    px(g, 7, 11, 'e');
    px(g, 5, 13, 'e'); px(g, 9, 13, 'e');
    outline(g, 'k');
  });
  sprite('ow_chick_down_1', 16, 16, chickOwPal, g => {
    chickBase(g, 7.5);
    px(g, 5, 9, 'k'); px(g, 9, 9, 'k');
    px(g, 7, 11, 'e');
    px(g, 5, 13, 'e'); px(g, 10, 12, 'e');
    outline(g, 'k');
  });
  sprite('ow_chick_up_0', 16, 16, chickOwPal, g => {
    chickBase(g, 7.5);
    px(g, 7, 7, 'h'); px(g, 8, 7, 'h');
    px(g, 5, 13, 'e'); px(g, 9, 13, 'e');
    outline(g, 'k');
  });
  sprite('ow_chick_up_1', 16, 16, chickOwPal, g => {
    chickBase(g, 7.5);
    px(g, 7, 7, 'h'); px(g, 8, 7, 'h');
    px(g, 5, 13, 'e'); px(g, 10, 12, 'e');
    outline(g, 'k');
  });
  sprite('ow_chick_left_0', 16, 16, chickOwPal, g => {
    ell(g, 8, 10, 3.6, 3, 'y');
    ell(g, 11, 10, 0.9, 1.5, 'o');
    px(g, 4, 9, 'k');
    px(g, 3, 10, 'e');
    px(g, 6, 13, 'e'); px(g, 10, 13, 'e');
    outline(g, 'k');
  });
  sprite('ow_chick_left_1', 16, 16, chickOwPal, g => {
    ell(g, 8, 10, 3.6, 3, 'y');
    ell(g, 11, 10, 0.9, 1.5, 'o');
    px(g, 4, 9, 'k');
    px(g, 3, 10, 'e');
    px(g, 5, 13, 'e'); px(g, 11, 12, 'e');
    outline(g, 'k');
  });

  // ===================================================================
  // HEN (grown) — plump brown/white hen, red comb, motherly
  // ===================================================================
  const PAL_HEN = {
    k: '#201512:0',
    b: '#ecdcb8:2',
    d: '#c2a06a:1',
    w: '#faf2dc:3',
    r: '#d43c3c:0',
    u: '#ea6868:2',
    g: '#ee9a2c:1',
  };

  sprite('front_hen', 48, 48, PAL_HEN, g => {
    // body
    ell(g, 23.5, 31, 14.5, 13.5, 'b');
    ell(g, 30, 37, 9.5, 9, 'd');
    ell(g, 23.5, 40, 8, 6.5, 'w');
    ell(g, 14, 27, 4.6, 7.5, 'd'); ell(g, 33, 27, 4.6, 7.5, 'd'); // folded wings
    // head
    ell(g, 23.5, 15, 7, 6.5, 'b');
    // comb
    ell(g, 20, 7, 2, 2.6, 'r'); ell(g, 23.5, 5, 2.2, 3, 'r'); ell(g, 27, 7, 2, 2.6, 'r');
    // wattle + beak
    ell(g, 23.5, 21, 1.6, 2.2, 'u');
    spans(g, [[17, 21, 26], [18, 20, 27], [19, 21, 26]], 'g');
    // eyes
    px(g, 20, 14, 'k'); px(g, 21, 14, 'k'); px(g, 20, 15, 'k'); px(g, 21, 15, 'k');
    px(g, 26, 14, 'k'); px(g, 27, 14, 'k'); px(g, 26, 15, 'k'); px(g, 27, 15, 'k');
    px(g, 20, 14, 'w'); px(g, 26, 14, 'w');
    // legs + feet
    rect(g, 17, 40, 18, 44, 'g'); rect(g, 29, 40, 30, 44, 'g');
    spans(g, [[45, 15, 20], [45, 27, 32]], 'g');
    outline(g, 'k');
  });

  sprite('back_hen', 48, 48, PAL_HEN, g => {
    ell(g, 23.5, 33, 15.5, 14.5, 'b');
    ell(g, 31, 39, 10.5, 10, 'd');
    ell(g, 23.5, 43, 5.5, 4, 'w');
    ell(g, 13, 29, 4.4, 8, 'd'); ell(g, 34, 29, 4.4, 8, 'd');
    // small tail-feather flare merged into the body's rear silhouette (kept low/wide, not a separate tall blob)
    ell(g, 23.5, 21, 9.5, 5, 'd');
    ell(g, 23.5, 17, 7, 6.5, 'b');
    ell(g, 20.5, 9.5, 1.8, 2.4, 'r'); ell(g, 26.5, 9.5, 1.8, 2.4, 'r');
    spans(g, [[46, 15, 20], [46, 27, 32]], 'g');
    outline(g, 'k');
  });

  const henOwPal = PAL_HEN;
  function henBase(g, cx) { ell(g, cx, 10.5, 4.2, 3.8, 'b'); ell(g, cx, 6, 2.8, 2.6, 'b'); }
  function henComb(g, cx) { px(g, cx, 2, 'r'); px(g, cx - 1, 3, 'r'); px(g, cx, 3, 'r'); px(g, cx + 1, 3, 'r'); }
  sprite('ow_hen_down_0', 16, 16, henOwPal, g => {
    henBase(g, 7.5);
    henComb(g, 7);
    px(g, 5, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 7, 'g');
    px(g, 5, 14, 'g'); px(g, 9, 14, 'g');
    outline(g, 'k');
  });
  sprite('ow_hen_down_1', 16, 16, henOwPal, g => {
    henBase(g, 7.5);
    henComb(g, 7);
    px(g, 5, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 7, 'g');
    px(g, 5, 13, 'g'); px(g, 10, 14, 'g');
    outline(g, 'k');
  });
  sprite('ow_hen_up_0', 16, 16, henOwPal, g => {
    henBase(g, 7.5);
    henComb(g, 7);
    px(g, 5, 14, 'g'); px(g, 9, 14, 'g');
    outline(g, 'k');
  });
  sprite('ow_hen_up_1', 16, 16, henOwPal, g => {
    henBase(g, 7.5);
    henComb(g, 7);
    px(g, 5, 13, 'g'); px(g, 10, 14, 'g');
    outline(g, 'k');
  });
  sprite('ow_hen_left_0', 16, 16, henOwPal, g => {
    ell(g, 8.3, 10.5, 4, 3.8, 'b');
    ell(g, 6.5, 6, 2.6, 2.5, 'b');
    henComb(g, 6);
    px(g, 4, 6, 'k');
    px(g, 3, 6, 'g');
    px(g, 6, 14, 'g'); px(g, 10, 14, 'g');
    outline(g, 'k');
  });
  sprite('ow_hen_left_1', 16, 16, henOwPal, g => {
    ell(g, 8.3, 10.5, 4, 3.8, 'b');
    ell(g, 6.5, 6, 2.6, 2.5, 'b');
    henComb(g, 6);
    px(g, 4, 6, 'k');
    px(g, 3, 6, 'g');
    px(g, 5, 13, 'g'); px(g, 11, 14, 'g');
    outline(g, 'k');
  });
})();
