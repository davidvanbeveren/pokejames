// Animal sprites: piglet -> pig, calf -> cow. Original Gen1/2-style farm-animal art.
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
  // PIGLET (starter baby) — small pink piglet, snout, floppy ears, curly tail
  // ===================================================================
  const PAL_PIGLET = {
    k: '#2a1614:0', // outline
    b: '#f9bccb:2', // fur main pink
    d: '#dd8ba1:1', // fur shadow
    w: '#fde7ed:3', // fur highlight / belly
    s: '#ea7a95:1', // snout
    n: '#3a1c1c:0', // nostril
  };

  sprite('front_piglet', 48, 48, PAL_PIGLET, g => {
    // floppy ears, hanging from sides of head
    ell(g, 11.5, 18, 3.6, 6.5, 'b'); ell(g, 35.5, 18, 3.6, 6.5, 'b');
    ell(g, 11.8, 19.5, 1.7, 4.6, 'd'); ell(g, 35.2, 19.5, 1.7, 4.6, 'd');
    // head + body
    ell(g, 23.5, 21, 10.5, 9.5, 'b');
    ell(g, 23.5, 36, 14, 12, 'b');
    // body shadow (light from top-left; kept off the face so eyes stay clear)
    ell(g, 30, 41, 9, 8, 'd');
    // belly highlight
    ell(g, 23.5, 40, 7.5, 6, 'w');
    // trotters
    ell(g, 16.5, 46, 3.4, 2, 'd'); ell(g, 30.5, 46, 3.4, 2, 'd');
    // snout
    ell(g, 23.5, 25, 4.8, 3.6, 's');
    px(g, 21, 25, 'n'); px(g, 26, 25, 'n');
    // eyes
    px(g, 18, 19, 'k'); px(g, 19, 19, 'k'); px(g, 18, 20, 'k'); px(g, 19, 20, 'k');
    px(g, 28, 19, 'k'); px(g, 29, 19, 'k'); px(g, 28, 20, 'k'); px(g, 29, 20, 'k');
    px(g, 18, 19, 'w'); px(g, 28, 19, 'w'); // sparkle
    outline(g, 'k');
  });

  sprite('back_piglet', 48, 48, PAL_PIGLET, g => {
    ell(g, 12.5, 16, 3, 6, 'd'); ell(g, 34.5, 16, 3, 6, 'd');
    ell(g, 12.8, 17, 1.5, 4, 'b'); ell(g, 34.2, 17, 1.5, 4, 'b');
    ell(g, 23.5, 19, 10, 9, 'b');
    ell(g, 23.5, 37, 15, 14, 'b');
    ell(g, 30, 42, 10, 10, 'd');
    ell(g, 23.5, 45, 5, 3.5, 'w');
    // curly tail
    px(g, 24, 20, 'd'); px(g, 25, 20, 'd'); px(g, 25, 21, 'd'); px(g, 24, 22, 'd'); px(g, 23, 21, 'd');
    ell(g, 15, 47, 3.2, 1.6, 'd'); ell(g, 32, 47, 3.2, 1.6, 'd');
    outline(g, 'k');
  });

  const pigletOwPal = PAL_PIGLET;
  function pigletBase(g, cx) {
    ell(g, cx, 11.3, 3.6, 2.9, 'b');
    ell(g, cx, 7.4, 2.9, 2.6, 'b');
  }
  sprite('ow_piglet_down_0', 16, 16, pigletOwPal, g => {
    pigletBase(g, 7.5);
    ell(g, 4.6, 7.6, 1, 1.8, 'd'); ell(g, 10.4, 7.6, 1, 1.8, 'd');
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 's'); px(g, 8, 9, 's');
    px(g, 6, 14, 'd'); px(g, 9, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_piglet_down_1', 16, 16, pigletOwPal, g => {
    pigletBase(g, 7.5);
    ell(g, 4.6, 7.6, 1, 1.8, 'd'); ell(g, 10.4, 7.6, 1, 1.8, 'd');
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 's'); px(g, 8, 9, 's');
    px(g, 5, 13, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_piglet_up_0', 16, 16, pigletOwPal, g => {
    pigletBase(g, 7.5);
    ell(g, 4.6, 7.6, 1, 1.8, 'd'); ell(g, 10.4, 7.6, 1, 1.8, 'd');
    px(g, 7, 6, 'w'); px(g, 8, 6, 'w');
    px(g, 6, 14, 'd'); px(g, 9, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_piglet_up_1', 16, 16, pigletOwPal, g => {
    pigletBase(g, 7.5);
    ell(g, 4.6, 7.6, 1, 1.8, 'd'); ell(g, 10.4, 7.6, 1, 1.8, 'd');
    px(g, 7, 6, 'w'); px(g, 8, 6, 'w');
    px(g, 5, 13, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_piglet_left_0', 16, 16, pigletOwPal, g => {
    ell(g, 8.3, 11.3, 3.7, 2.9, 'b');
    ell(g, 6.6, 7.4, 3, 2.6, 'b');
    ell(g, 5.4, 8.4, 1.6, 1.6, 'd'); // floppy ear hanging on near side
    px(g, 4, 7, 'k');
    px(g, 3, 8, 's');
    px(g, 6, 14, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_piglet_left_1', 16, 16, pigletOwPal, g => {
    ell(g, 8.3, 11.3, 3.7, 2.9, 'b');
    ell(g, 6.6, 7.4, 3, 2.6, 'b');
    ell(g, 5.4, 8.4, 1.6, 1.6, 'd');
    px(g, 4, 7, 'k');
    px(g, 3, 8, 's');
    px(g, 5, 13, 'd'); px(g, 11, 14, 'd');
    outline(g, 'k');
  });

  // ===================================================================
  // PIG (grown) — big content pink pig, mud spot, happy face
  // ===================================================================
  const PAL_PIG = {
    k: '#241412:0',
    b: '#f2a3b8:2',
    d: '#cf7690:1',
    w: '#fbdbe4:3',
    s: '#df6483:1',
    n: '#2a1414:0',
    m: '#8a6a42:1', // mud spot
  };

  sprite('front_pig', 48, 48, PAL_PIG, g => {
    // small perky ears
    ell(g, 13, 12.5, 3.8, 4.6, 'b'); ell(g, 34, 12.5, 3.8, 4.6, 'b');
    ell(g, 13.3, 13.5, 1.8, 2.6, 'd'); ell(g, 33.7, 13.5, 1.8, 2.6, 'd');
    // head
    ell(g, 23.5, 19, 12, 10, 'b');
    // body — big, fills box
    ell(g, 23.5, 36, 16.5, 13, 'b');
    // body shadow (kept off the face so eyes stay clear)
    ell(g, 31, 41, 10, 9, 'd');
    // mud spot
    ell(g, 15, 32, 4.5, 3.6, 'm');
    // belly highlight
    ell(g, 23.5, 40, 8.5, 6.5, 'w');
    // trotters
    ell(g, 13, 45, 3.2, 2.4, 'd'); ell(g, 20, 46.5, 2.8, 1.8, 'd');
    ell(g, 27, 46.5, 2.8, 1.8, 'd'); ell(g, 34, 45, 3.2, 2.4, 'd');
    // snout
    ell(g, 23.5, 23, 5.6, 4, 's');
    px(g, 21, 23, 'n'); px(g, 26, 23, 'n');
    // content eyes (small, happy)
    px(g, 17, 18, 'k'); px(g, 18, 18, 'k'); px(g, 17, 19, 'k'); px(g, 18, 19, 'k');
    px(g, 29, 18, 'k'); px(g, 30, 18, 'k'); px(g, 29, 19, 'k'); px(g, 30, 19, 'k');
    px(g, 17, 18, 'w'); px(g, 29, 18, 'w');
    outline(g, 'k');
  });

  sprite('back_pig', 48, 48, PAL_PIG, g => {
    ell(g, 14, 11, 3.6, 4.4, 'd'); ell(g, 33, 11, 3.6, 4.4, 'd');
    ell(g, 14.3, 12, 1.7, 2.6, 'b'); ell(g, 32.7, 12, 1.7, 2.6, 'b');
    ell(g, 23.5, 17, 11, 9, 'b');
    ell(g, 23.5, 37, 17.5, 15, 'b');
    ell(g, 32, 43, 11, 10, 'd');
    ell(g, 32, 33, 4.5, 4, 'm');
    ell(g, 23.5, 45, 6, 4, 'w');
    // curly tail
    px(g, 24, 19, 'd'); px(g, 25, 19, 'd'); px(g, 25, 20, 'd'); px(g, 24, 21, 'd'); px(g, 23, 20, 'd');
    // trotters, cropped at bottom edge
    ell(g, 12, 47, 3, 1.6, 'd'); ell(g, 19, 47.5, 2.6, 1.2, 'd');
    ell(g, 28, 47.5, 2.6, 1.2, 'd'); ell(g, 35, 47, 3, 1.6, 'd');
    outline(g, 'k');
  });

  const pigOwPal = PAL_PIG;
  function pigBase(g, cx) {
    ell(g, cx, 11.2, 4.1, 3.2, 'b');
    ell(g, cx, 6.9, 3.3, 2.8, 'b');
  }
  sprite('ow_pig_down_0', 16, 16, pigOwPal, g => {
    pigBase(g, 7.5);
    ell(g, 3.9, 7, 1.1, 1.7, 'd'); ell(g, 11.1, 7, 1.1, 1.7, 'd');
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 's'); px(g, 8, 9, 's');
    ell(g, 5, 11, 1, 0.9, 'm');
    px(g, 5, 14, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_pig_down_1', 16, 16, pigOwPal, g => {
    pigBase(g, 7.5);
    ell(g, 3.9, 7, 1.1, 1.7, 'd'); ell(g, 11.1, 7, 1.1, 1.7, 'd');
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 's'); px(g, 8, 9, 's');
    ell(g, 5, 11, 1, 0.9, 'm');
    px(g, 4, 13, 'd'); px(g, 11, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_pig_up_0', 16, 16, pigOwPal, g => {
    pigBase(g, 7.5);
    ell(g, 3.9, 7, 1.1, 1.7, 'd'); ell(g, 11.1, 7, 1.1, 1.7, 'd');
    px(g, 7, 6, 'w'); px(g, 8, 6, 'w');
    px(g, 5, 14, 'd'); px(g, 10, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_pig_up_1', 16, 16, pigOwPal, g => {
    pigBase(g, 7.5);
    ell(g, 3.9, 7, 1.1, 1.7, 'd'); ell(g, 11.1, 7, 1.1, 1.7, 'd');
    px(g, 7, 6, 'w'); px(g, 8, 6, 'w');
    px(g, 4, 13, 'd'); px(g, 11, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_pig_left_0', 16, 16, pigOwPal, g => {
    ell(g, 8.4, 11.2, 4.3, 3.2, 'b');
    ell(g, 6.4, 6.9, 3.4, 2.8, 'b');
    ell(g, 5, 7.8, 1.7, 1.7, 'd');
    px(g, 3, 7, 'k');
    px(g, 2, 8, 's');
    ell(g, 11, 12, 1, 0.9, 'm');
    px(g, 5, 14, 'd'); px(g, 11, 14, 'd');
    outline(g, 'k');
  });
  sprite('ow_pig_left_1', 16, 16, pigOwPal, g => {
    ell(g, 8.4, 11.2, 4.3, 3.2, 'b');
    ell(g, 6.4, 6.9, 3.4, 2.8, 'b');
    ell(g, 5, 7.8, 1.7, 1.7, 'd');
    px(g, 3, 7, 'k');
    px(g, 2, 8, 's');
    ell(g, 11, 12, 1, 0.9, 'm');
    px(g, 4, 13, 'd'); px(g, 12, 14, 'd');
    outline(g, 'k');
  });

  // ===================================================================
  // CALF (baby) — small brown-and-white calf, big eyes, small ears
  // ===================================================================
  const PAL_CALF = {
    k: '#241a12:0', // outline
    w: '#f7efd8:3', // white fur main
    d: '#d9cca8:2', // white fur shadow
    b: '#a8703c:1', // brown patch
    q: '#5c3a1c:0', // ear inner / patch shadow
    n: '#e8a8ac:2', // muzzle pink
    m: '#7a3a3a:0', // nostril
  };

  sprite('front_calf', 48, 48, PAL_CALF, g => {
    // small rounded ears
    ell(g, 14, 14, 3, 3.4, 'b'); ell(g, 33, 14, 3, 3.4, 'b');
    ell(g, 14, 14.3, 1.3, 1.8, 'q'); ell(g, 33, 14.3, 1.3, 1.8, 'q');
    // head, mostly white
    ell(g, 23.5, 21, 10.5, 9.5, 'w');
    // patch over cheek (avoids eyes)
    ell(g, 30, 23, 4, 4.5, 'b');
    // body
    ell(g, 23.5, 36, 13, 11.5, 'w');
    ell(g, 29, 41, 8, 7, 'd');
    // patches on body
    ell(g, 16, 33, 5, 6, 'b');
    ell(g, 31, 39, 4.5, 5, 'b');
    // muzzle
    ell(g, 23.5, 26, 4.5, 3.2, 'n');
    px(g, 21, 26, 'm'); px(g, 26, 26, 'm');
    // big eyes (3x3 each, bigger than adult proportion)
    px(g, 16, 18, 'k'); px(g, 17, 18, 'k'); px(g, 18, 18, 'k');
    px(g, 16, 19, 'k'); px(g, 17, 19, 'k'); px(g, 18, 19, 'k');
    px(g, 16, 20, 'k'); px(g, 17, 20, 'k'); px(g, 18, 20, 'k');
    px(g, 29, 18, 'k'); px(g, 30, 18, 'k'); px(g, 31, 18, 'k');
    px(g, 29, 19, 'k'); px(g, 30, 19, 'k'); px(g, 31, 19, 'k');
    px(g, 29, 20, 'k'); px(g, 30, 20, 'k'); px(g, 31, 20, 'k');
    px(g, 16, 18, 'w'); px(g, 29, 18, 'w'); // sparkle
    // legs + hooves
    ell(g, 17, 45, 2.6, 2.2, 'b'); ell(g, 30, 45, 2.6, 2.2, 'b');
    spans(g, [[47, 15, 18], [47, 29, 32]], 'q');
    outline(g, 'k');
  });

  sprite('back_calf', 48, 48, PAL_CALF, g => {
    ell(g, 14, 13, 3, 3.3, 'b'); ell(g, 33, 13, 3, 3.3, 'b');
    ell(g, 14.3, 13.6, 1.2, 1.8, 'q'); ell(g, 32.7, 13.6, 1.2, 1.8, 'q');
    ell(g, 23.5, 19, 10, 9, 'w');
    ell(g, 30, 20, 4, 4, 'b');
    ell(g, 23.5, 37, 14, 13, 'w');
    ell(g, 29, 44, 7, 5, 'd');
    ell(g, 17, 34, 5, 6, 'b');
    ell(g, 31, 40, 4.5, 5, 'b');
    // small tail with tuft
    spans(g, [[30, 23, 24], [31, 23, 24], [32, 23, 24], [33, 23, 24], [34, 23, 24]], 'd');
    ell(g, 23.5, 36, 1.6, 1.8, 'q');
    ell(g, 16, 46, 2.6, 2, 'b'); ell(g, 31, 46, 2.6, 2, 'b');
    spans(g, [[47, 14, 17], [47, 30, 33]], 'q');
    outline(g, 'k');
  });

  const calfOwPal = PAL_CALF;
  function calfBase(g, cx) {
    ell(g, cx, 11.3, 3.6, 2.9, 'w');
    ell(g, cx, 7.3, 3, 2.7, 'w');
  }
  sprite('ow_calf_down_0', 16, 16, calfOwPal, g => {
    calfBase(g, 7.5);
    ell(g, 4.5, 6.6, 1, 1.4, 'b'); ell(g, 10.5, 6.6, 1, 1.4, 'b');
    ell(g, 9.5, 8.2, 1.3, 1.4, 'b'); // cheek patch
    px(g, 6, 7, 'k'); px(g, 6, 8, 'k'); px(g, 9, 7, 'k'); px(g, 9, 8, 'k');
    px(g, 7, 9, 'n'); px(g, 8, 9, 'n');
    px(g, 6, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_calf_down_1', 16, 16, calfOwPal, g => {
    calfBase(g, 7.5);
    ell(g, 4.5, 6.6, 1, 1.4, 'b'); ell(g, 10.5, 6.6, 1, 1.4, 'b');
    ell(g, 9.5, 8.2, 1.3, 1.4, 'b');
    px(g, 6, 7, 'k'); px(g, 6, 8, 'k'); px(g, 9, 7, 'k'); px(g, 9, 8, 'k');
    px(g, 7, 9, 'n'); px(g, 8, 9, 'n');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_calf_up_0', 16, 16, calfOwPal, g => {
    calfBase(g, 7.5);
    ell(g, 4.5, 6.6, 1, 1.4, 'b'); ell(g, 10.5, 6.6, 1, 1.4, 'b');
    ell(g, 9.5, 8.2, 1.3, 1.4, 'b');
    px(g, 7, 6, 'd'); px(g, 8, 6, 'd');
    px(g, 6, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_calf_up_1', 16, 16, calfOwPal, g => {
    calfBase(g, 7.5);
    ell(g, 4.5, 6.6, 1, 1.4, 'b'); ell(g, 10.5, 6.6, 1, 1.4, 'b');
    ell(g, 9.5, 8.2, 1.3, 1.4, 'b');
    px(g, 7, 6, 'd'); px(g, 8, 6, 'd');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_calf_left_0', 16, 16, calfOwPal, g => {
    ell(g, 8.3, 11.3, 3.7, 2.9, 'w');
    ell(g, 6.6, 7.3, 3.1, 2.7, 'w');
    ell(g, 5.3, 6.6, 1.2, 1.5, 'b');
    ell(g, 8, 8.6, 1.4, 1.4, 'b');
    px(g, 4, 7, 'k'); px(g, 4, 8, 'k');
    px(g, 3, 9, 'n');
    px(g, 6, 14, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_calf_left_1', 16, 16, calfOwPal, g => {
    ell(g, 8.3, 11.3, 3.7, 2.9, 'w');
    ell(g, 6.6, 7.3, 3.1, 2.7, 'w');
    ell(g, 5.3, 6.6, 1.2, 1.5, 'b');
    ell(g, 8, 8.6, 1.4, 1.4, 'b');
    px(g, 4, 7, 'k'); px(g, 4, 8, 'k');
    px(g, 3, 9, 'n');
    px(g, 5, 13, 'b'); px(g, 11, 14, 'b');
    outline(g, 'k');
  });

  // ===================================================================
  // COW (grown) — large black-and-white dairy cow, pink nose; biggest sprite
  // ===================================================================
  const PAL_COW = {
    k: '#140e0c:0', // outline
    b: '#2c2622:0', // black patch
    w: '#f7f2e2:3', // white main
    d: '#d9d0b8:2', // white shadow
    p: '#eaa8b0:2', // pink nose / udder
    r: '#c3717f:1', // pink shadow / nostril
    h: '#3c332c:1', // hooves / tail
  };

  sprite('front_cow', 48, 48, PAL_COW, g => {
    // ears
    ell(g, 11.5, 18, 3.6, 4.8, 'w'); ell(g, 36.5, 18, 3.6, 4.8, 'w');
    ell(g, 11.8, 19, 1.7, 3, 'd'); ell(g, 36.2, 19, 1.7, 3, 'd');
    // head (kept clean/white so the eyes and muzzle stay clear)
    ell(g, 23.5, 22, 11.5, 10.5, 'w');
    // small black ear-patch, high on the forehead away from both eyes
    ell(g, 24, 13, 3, 2.6, 'b');
    // body — big, fills most of the box
    ell(g, 23.5, 38, 18, 12, 'w');
    ell(g, 32, 43, 10, 8, 'd');
    // black patches
    ell(g, 14, 34, 5.5, 6.5, 'b');
    ell(g, 33, 41, 6, 7, 'b');
    ell(g, 20, 44, 4, 3, 'b');
    // muzzle
    ell(g, 23.5, 28, 6.2, 4.6, 'p');
    ell(g, 21, 28, 1, 1.3, 'r'); ell(g, 26, 28, 1, 1.3, 'r');
    // eyes
    px(g, 16, 19, 'k'); px(g, 17, 19, 'k'); px(g, 16, 20, 'k'); px(g, 17, 20, 'k');
    px(g, 30, 19, 'k'); px(g, 31, 19, 'k'); px(g, 30, 20, 'k'); px(g, 31, 20, 'k');
    px(g, 16, 19, 'w'); px(g, 30, 19, 'w'); // sparkle
    // front legs + hooves
    ell(g, 15, 44, 3, 3, 'w'); ell(g, 32, 44, 3, 3, 'w');
    spans(g, [[46, 13, 17], [46, 30, 34]], 'h');
    outline(g, 'k');
  });

  sprite('back_cow', 48, 48, PAL_COW, g => {
    ell(g, 12, 17, 3.4, 4.6, 'd'); ell(g, 35, 17, 3.4, 4.6, 'd');
    ell(g, 12.3, 18, 1.6, 2.8, 'w'); ell(g, 34.7, 18, 1.6, 2.8, 'w');
    ell(g, 23.5, 20, 10.5, 9, 'w');
    ell(g, 17, 18, 4.5, 5, 'b');
    // big rump filling the box, cropped at the bottom edge
    ell(g, 23.5, 39, 19, 16, 'w');
    ell(g, 33, 44, 11, 10, 'd');
    ell(g, 15, 35, 5.5, 7, 'b');
    ell(g, 33, 42, 6, 7, 'b');
    // udder hint
    ell(g, 23.5, 46, 4, 2.5, 'p');
    // tail
    px(g, 34, 21, 'h'); px(g, 35, 23, 'h'); px(g, 36, 25, 'h'); px(g, 36, 27, 'h');
    ell(g, 36, 29, 1.6, 1.8, 'b');
    spans(g, [[47, 12, 17], [47, 30, 35]], 'h');
    outline(g, 'k');
  });

  const cowOwPal = PAL_COW;
  function cowBase(g, cx) {
    ell(g, cx, 4.3, 3.7, 2.9, 'w'); // head
    ell(g, cx, 10.6, 5.6, 4.8, 'w'); // body, full height
  }
  sprite('ow_cow_down_0', 16, 16, cowOwPal, g => {
    cowBase(g, 7.5);
    ell(g, 4, 3.6, 1.1, 1.7, 'w'); ell(g, 11, 3.6, 1.1, 1.7, 'w');
    ell(g, 10.5, 9.5, 1.8, 2, 'b'); // patch
    ell(g, 4, 12, 2, 2.4, 'b'); // patch
    px(g, 6, 3, 'k'); px(g, 9, 3, 'k');
    px(g, 7, 5, 'p'); px(g, 8, 5, 'p');
    px(g, 4, 15, 'h'); px(g, 6, 15, 'h'); px(g, 9, 15, 'h'); px(g, 11, 15, 'h');
    outline(g, 'k');
  });
  sprite('ow_cow_down_1', 16, 16, cowOwPal, g => {
    cowBase(g, 7.5);
    ell(g, 4, 3.6, 1.1, 1.7, 'w'); ell(g, 11, 3.6, 1.1, 1.7, 'w');
    ell(g, 10.5, 9.5, 1.8, 2, 'b');
    ell(g, 4, 12, 2, 2.4, 'b');
    px(g, 6, 3, 'k'); px(g, 9, 3, 'k');
    px(g, 7, 5, 'p'); px(g, 8, 5, 'p');
    px(g, 3, 14, 'h'); px(g, 6, 15, 'h'); px(g, 9, 15, 'h'); px(g, 12, 14, 'h');
    outline(g, 'k');
  });
  sprite('ow_cow_up_0', 16, 16, cowOwPal, g => {
    cowBase(g, 7.5);
    ell(g, 4, 3.6, 1.1, 1.7, 'w'); ell(g, 11, 3.6, 1.1, 1.7, 'w');
    ell(g, 10.5, 9.5, 1.8, 2, 'b');
    ell(g, 4, 12, 2, 2.4, 'b');
    px(g, 7, 2, 'd'); px(g, 8, 2, 'd');
    px(g, 4, 15, 'h'); px(g, 6, 15, 'h'); px(g, 9, 15, 'h'); px(g, 11, 15, 'h');
    outline(g, 'k');
  });
  sprite('ow_cow_up_1', 16, 16, cowOwPal, g => {
    cowBase(g, 7.5);
    ell(g, 4, 3.6, 1.1, 1.7, 'w'); ell(g, 11, 3.6, 1.1, 1.7, 'w');
    ell(g, 10.5, 9.5, 1.8, 2, 'b');
    ell(g, 4, 12, 2, 2.4, 'b');
    px(g, 7, 2, 'd'); px(g, 8, 2, 'd');
    px(g, 3, 14, 'h'); px(g, 6, 15, 'h'); px(g, 9, 15, 'h'); px(g, 12, 14, 'h');
    outline(g, 'k');
  });
  sprite('ow_cow_left_0', 16, 16, cowOwPal, g => {
    ell(g, 8.2, 10.6, 5.9, 4.8, 'w');
    ell(g, 7, 4.3, 4, 2.9, 'w');
    ell(g, 6, 3, 1.4, 1.7, 'w');
    ell(g, 13, 9.5, 1.8, 2, 'b');
    ell(g, 5, 12.5, 2, 2.4, 'b');
    px(g, 3, 3, 'k');
    px(g, 2, 5, 'p'); px(g, 2, 6, 'p');
    px(g, 4, 15, 'h'); px(g, 7, 15, 'h'); px(g, 10, 15, 'h'); px(g, 13, 15, 'h');
    outline(g, 'k');
  });
  sprite('ow_cow_left_1', 16, 16, cowOwPal, g => {
    ell(g, 8.2, 10.6, 5.9, 4.8, 'w');
    ell(g, 7, 4.3, 4, 2.9, 'w');
    ell(g, 6, 3, 1.4, 1.7, 'w');
    ell(g, 13, 9.5, 1.8, 2, 'b');
    ell(g, 5, 12.5, 2, 2.4, 'b');
    px(g, 3, 3, 'k');
    px(g, 2, 5, 'p'); px(g, 2, 6, 'p');
    px(g, 3, 14, 'h'); px(g, 6, 15, 'h'); px(g, 10, 15, 'h'); px(g, 14, 14, 'h');
    outline(g, 'k');
  });
})();
