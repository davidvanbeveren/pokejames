// Animal sprites: duckling -> duck, gosling -> goose, turkey (rare wild). Original Gen1/2-style farm-animal art.
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
  // DUCKLING (baby) — tiny fluffy round yellow duckling, flat orange bill
  // ===================================================================
  const PAL_DUCKLING = {
    k: '#20180a:0', // outline / bill (small dark accent)
    y: '#f7d34a:2', // fluff main
    o: '#d9a52a:1', // fluff shadow / wingtips
    h: '#fdf0b8:3', // fluff highlight
    b: '#20180a:0', // bill + feet (shares outline shade so it always separates from fluff)
  };

  sprite('front_duckling', 48, 48, PAL_DUCKLING, g => {
    ell(g, 23.5, 29, 14, 12.5, 'y');
    ell(g, 10.5, 29, 3.2, 5.5, 'o'); ell(g, 36.5, 29, 3.2, 5.5, 'o'); // wing nubs
    ell(g, 29, 35, 8, 7.5, 'o'); // shadow, bottom-right
    ell(g, 17, 20, 6.5, 5.5, 'h'); // highlight, top-left
    ell(g, 30, 17, 2.6, 2.6, 'y'); // little fluff topknot
    // flat wide duck bill
    ell(g, 23.5, 32, 5, 2.4, 'b');
    // eyes
    px(g, 17, 23, 'k'); px(g, 18, 23, 'k'); px(g, 17, 24, 'k'); px(g, 18, 24, 'k');
    px(g, 29, 23, 'k'); px(g, 30, 23, 'k'); px(g, 29, 24, 'k'); px(g, 30, 24, 'k');
    px(g, 17, 23, 'h'); px(g, 29, 23, 'h'); // sparkle
    // webbed feet
    ell(g, 17, 41, 2.2, 2, 'b'); ell(g, 30, 41, 2.2, 2, 'b');
    outline(g, 'k');
  });

  sprite('back_duckling', 48, 48, PAL_DUCKLING, g => {
    ell(g, 23.5, 32, 16, 14.5, 'y');
    ell(g, 9, 33, 3.4, 6, 'o'); ell(g, 38, 33, 3.4, 6, 'o');
    ell(g, 30, 37, 9.5, 9, 'o');
    ell(g, 18, 19, 6, 6, 'h'); ell(g, 27, 17, 4.5, 4.5, 'h');
    ell(g, 23.5, 18, 3, 2.8, 'y');
    ell(g, 16, 45, 2.4, 2.2, 'b'); ell(g, 31, 45, 2.4, 2.2, 'b');
    outline(g, 'k');
  });

  const ducklingOwPal = PAL_DUCKLING;
  function ducklingBase(g, cx) {
    ell(g, cx, 10.3, 3.3, 2.8, 'y');
    ell(g, cx - 3.1, 10.3, 1, 1.6, 'o'); ell(g, cx + 3.1, 10.3, 1, 1.6, 'o');
  }
  sprite('ow_duckling_down_0', 16, 16, ducklingOwPal, g => {
    ducklingBase(g, 7.5);
    px(g, 5, 9, 'k'); px(g, 9, 9, 'k');
    px(g, 6, 12, 'b'); px(g, 7, 12, 'b'); px(g, 8, 12, 'b');
    px(g, 5, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duckling_down_1', 16, 16, ducklingOwPal, g => {
    ducklingBase(g, 7.5);
    px(g, 5, 9, 'k'); px(g, 9, 9, 'k');
    px(g, 6, 12, 'b'); px(g, 7, 12, 'b'); px(g, 8, 12, 'b');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duckling_up_0', 16, 16, ducklingOwPal, g => {
    ducklingBase(g, 7.5);
    px(g, 7, 7, 'h'); px(g, 8, 7, 'h');
    px(g, 5, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duckling_up_1', 16, 16, ducklingOwPal, g => {
    ducklingBase(g, 7.5);
    px(g, 7, 7, 'h'); px(g, 8, 7, 'h');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duckling_left_0', 16, 16, ducklingOwPal, g => {
    ell(g, 8, 10.3, 3.4, 2.9, 'y');
    ell(g, 11, 10.3, 0.9, 1.5, 'o');
    px(g, 4, 11, 'b'); px(g, 3, 11, 'b');
    px(g, 4, 9, 'k');
    px(g, 6, 14, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duckling_left_1', 16, 16, ducklingOwPal, g => {
    ell(g, 8, 10.3, 3.4, 2.9, 'y');
    ell(g, 11, 10.3, 0.9, 1.5, 'o');
    px(g, 4, 11, 'b'); px(g, 3, 11, 'b');
    px(g, 4, 9, 'k');
    px(g, 5, 13, 'b'); px(g, 11, 14, 'b');
    outline(g, 'k');
  });

  // ===================================================================
  // DUCK (grown) — white duck with a mallard-green head, waddling stance
  // ===================================================================
  const PAL_DUCK = {
    k: '#241a10:0', // outline
    w: '#f7f2e2:3', // body white
    d: '#c7c0a8:1', // body shadow
    g: '#4f8a5c:2', // head green
    n: '#2e5236:1', // head shadow
    r: '#8a4a2a:2', // chest rust patch
    b: '#20180a:0', // bill + feet (dark accent, always separates)
  };

  sprite('front_duck', 48, 48, PAL_DUCK, g => {
    ell(g, 23.5, 34, 15, 12, 'w');
    ell(g, 30, 39, 9, 8, 'd');
    ell(g, 13, 31, 4, 9, 'd'); ell(g, 34, 31, 4, 9, 'd'); // folded wings
    ell(g, 23.5, 29, 5.5, 4, 'r'); // chest patch
    ell(g, 23.5, 23, 5.5, 5, 'w'); // neck ring
    ell(g, 23.5, 16, 6.5, 6, 'g'); // head
    ell(g, 26.5, 18, 3.3, 3.5, 'n'); // head shade
    ell(g, 23.5, 22, 4.6, 2, 'b'); // bill
    px(g, 20, 14, 'k'); px(g, 21, 14, 'k'); px(g, 20, 15, 'k'); px(g, 21, 15, 'k');
    px(g, 26, 14, 'k'); px(g, 27, 14, 'k'); px(g, 26, 15, 'k'); px(g, 27, 15, 'k');
    px(g, 20, 14, 'w'); px(g, 26, 14, 'w');
    ell(g, 17, 44, 3.2, 2.4, 'b'); ell(g, 30, 44, 3.2, 2.4, 'b');
    outline(g, 'k');
  });

  sprite('back_duck', 48, 48, PAL_DUCK, g => {
    ell(g, 23.5, 35, 16, 14, 'w');
    ell(g, 32, 40, 10.5, 9.5, 'd');
    ell(g, 12, 31, 4.4, 10, 'd'); ell(g, 35, 31, 4.4, 10, 'd');
    ell(g, 23.5, 21, 4.5, 5, 'w'); // perked tail
    px(g, 27, 17, 'd'); px(g, 28, 17, 'd'); // curled drake feather
    ell(g, 23.5, 17, 5, 5, 'w'); // neck
    ell(g, 23.5, 11, 6, 5.5, 'g'); // head
    ell(g, 26, 13, 3, 3.3, 'n');
    ell(g, 15, 46, 3, 2.2, 'b'); ell(g, 32, 46, 3, 2.2, 'b');
    outline(g, 'k');
  });

  const duckOwPal = PAL_DUCK;
  function duckBase(g, cx) {
    ell(g, cx, 10.6, 4.3, 3.6, 'w');
    ell(g, cx, 6.2, 2.6, 2.4, 'g');
  }
  sprite('ow_duck_down_0', 16, 16, duckOwPal, g => {
    duckBase(g, 7.5);
    px(g, 7, 8, 'b'); px(g, 8, 8, 'b');
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 5, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duck_down_1', 16, 16, duckOwPal, g => {
    duckBase(g, 7.5);
    px(g, 7, 8, 'b'); px(g, 8, 8, 'b');
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duck_up_0', 16, 16, duckOwPal, g => {
    duckBase(g, 7.5);
    px(g, 7, 5, 'n'); px(g, 8, 5, 'n');
    px(g, 5, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duck_up_1', 16, 16, duckOwPal, g => {
    duckBase(g, 7.5);
    px(g, 7, 5, 'n'); px(g, 8, 5, 'n');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duck_left_0', 16, 16, duckOwPal, g => {
    ell(g, 8.4, 10.6, 4, 3.6, 'w');
    ell(g, 5.6, 6.4, 2.4, 2.3, 'g');
    px(g, 3, 7, 'b'); px(g, 2, 7, 'b');
    px(g, 4, 5, 'k');
    px(g, 6, 14, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_duck_left_1', 16, 16, duckOwPal, g => {
    ell(g, 8.4, 10.6, 4, 3.6, 'w');
    ell(g, 5.6, 6.4, 2.4, 2.3, 'g');
    px(g, 3, 7, 'b'); px(g, 2, 7, 'b');
    px(g, 4, 5, 'k');
    px(g, 5, 13, 'b'); px(g, 11, 14, 'b');
    outline(g, 'k');
  });

  // ===================================================================
  // GOSLING (baby) — small gray-yellow gosling, long neck starting to show
  // ===================================================================
  const PAL_GOSLING = {
    k: '#221d10:0',
    y: '#b4ad68:2', // fluff main, gray-olive
    o: '#867f4a:1', // fluff shadow
    h: '#ddd7a0:3', // fluff highlight
    b: '#20180a:0', // bill + feet
  };

  sprite('front_gosling', 48, 48, PAL_GOSLING, g => {
    ell(g, 23.5, 33, 12.5, 10.5, 'y');
    ell(g, 23.5, 21, 5.5, 8, 'y'); // emerging neck
    ell(g, 23.5, 13.5, 6, 5.5, 'y'); // head
    ell(g, 29, 37, 7, 6.5, 'o');
    ell(g, 26.5, 23, 2.4, 6, 'o'); // neck shade
    ell(g, 17, 28, 4.5, 5, 'h');
    ell(g, 23.5, 16.5, 2.8, 1.5, 'b'); // small bill
    px(g, 20.5, 12, 'k'); px(g, 21.5, 12, 'k'); px(g, 20.5, 13, 'k'); px(g, 21.5, 13, 'k');
    px(g, 25.5, 12, 'k'); px(g, 26.5, 12, 'k'); px(g, 25.5, 13, 'k'); px(g, 26.5, 13, 'k');
    px(g, 20.5, 12, 'h'); px(g, 25.5, 12, 'h');
    ell(g, 18, 42, 2, 1.8, 'b'); ell(g, 29, 42, 2, 1.8, 'b');
    outline(g, 'k');
  });

  sprite('back_gosling', 48, 48, PAL_GOSLING, g => {
    ell(g, 23.5, 35, 14.5, 12, 'y');
    ell(g, 23.5, 20, 5, 9, 'y');
    ell(g, 23.5, 11.5, 5.5, 5, 'y');
    ell(g, 30, 39, 8.5, 8, 'o');
    ell(g, 26, 22, 2.2, 7, 'o');
    ell(g, 18, 30, 5, 5.5, 'h');
    ell(g, 17, 45, 2.2, 2, 'b'); ell(g, 30, 45, 2.2, 2, 'b');
    outline(g, 'k');
  });

  const goslingOwPal = PAL_GOSLING;
  function goslingBase(g, cx) {
    ell(g, cx, 11, 3, 2.5, 'y');
    ell(g, cx, 7.8, 1.7, 2.2, 'y');
  }
  sprite('ow_gosling_down_0', 16, 16, goslingOwPal, g => {
    goslingBase(g, 7.5);
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 'b'); px(g, 8, 9, 'b');
    px(g, 5, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_gosling_down_1', 16, 16, goslingOwPal, g => {
    goslingBase(g, 7.5);
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 'b'); px(g, 8, 9, 'b');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_gosling_up_0', 16, 16, goslingOwPal, g => {
    goslingBase(g, 7.5);
    px(g, 7, 6, 'h'); px(g, 8, 6, 'h');
    px(g, 5, 14, 'b'); px(g, 9, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_gosling_up_1', 16, 16, goslingOwPal, g => {
    goslingBase(g, 7.5);
    px(g, 7, 6, 'h'); px(g, 8, 6, 'h');
    px(g, 5, 13, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_gosling_left_0', 16, 16, goslingOwPal, g => {
    ell(g, 8.3, 11, 3.4, 2.7, 'y');
    ell(g, 5.3, 7.9, 1.9, 2.3, 'y');
    px(g, 3, 8, 'b');
    px(g, 4, 6, 'k');
    px(g, 6, 14, 'b'); px(g, 10, 14, 'b');
    outline(g, 'k');
  });
  sprite('ow_gosling_left_1', 16, 16, goslingOwPal, g => {
    ell(g, 8.3, 11, 3.4, 2.7, 'y');
    ell(g, 5.3, 7.9, 1.9, 2.3, 'y');
    px(g, 3, 8, 'b');
    px(g, 4, 6, 'k');
    px(g, 5, 13, 'b'); px(g, 11, 14, 'b');
    outline(g, 'k');
  });

  // ===================================================================
  // GOOSE (grown) — big white goose, orange bill+knob, neck raised, honk
  // ===================================================================
  const PAL_GOOSE = {
    k: '#241c10:0',
    w: '#f5f1df:3', // body white
    d: '#c6c0a4:1', // shade
    b: '#20180a:0', // bill / feet (dark accent)
    n: '#8a3c08:0', // knob (bill-base bump), darker orange but same GB shade as bill
  };

  sprite('front_goose', 48, 48, PAL_GOOSE, g => {
    ell(g, 23.5, 37, 15.5, 10.5, 'w');
    ell(g, 30, 41, 9.5, 7, 'd');
    ell(g, 11.5, 33, 4.5, 10, 'd'); ell(g, 35.5, 33, 4.5, 10, 'd'); // wings
    ell(g, 23.5, 21, 6, 15, 'w'); // raised neck
    ell(g, 27, 23, 3, 11, 'd');
    ell(g, 23.5, 9, 6, 5.5, 'w'); // head
    ell(g, 25.5, 10.5, 3, 3.3, 'd');
    ell(g, 23.5, 10.5, 5.2, 2.2, 'b'); // bill
    ell(g, 23.5, 7.3, 1.6, 1.3, 'n'); // knob
    px(g, 20, 8, 'k'); px(g, 21, 8, 'k'); px(g, 20, 9, 'k'); px(g, 21, 9, 'k');
    px(g, 26, 8, 'k'); px(g, 27, 8, 'k'); px(g, 26, 9, 'k'); px(g, 27, 9, 'k');
    px(g, 20, 8, 'w'); px(g, 26, 8, 'w');
    ell(g, 17, 46, 3.4, 1.8, 'b'); ell(g, 30, 46, 3.4, 1.8, 'b');
    outline(g, 'k');
  });

  sprite('back_goose', 48, 48, PAL_GOOSE, g => {
    ell(g, 23.5, 38, 17, 11.5, 'w');
    ell(g, 33, 42, 11, 8.5, 'd');
    ell(g, 10.5, 33, 4.8, 11, 'd'); ell(g, 36.5, 33, 4.8, 11, 'd');
    ell(g, 22.5, 21, 6, 16, 'w'); // raised, slightly curved neck
    ell(g, 19, 23, 3, 11, 'd');
    ell(g, 22.5, 8, 5.5, 5, 'w'); // head
    ell(g, 24.5, 9.5, 2.8, 3, 'd');
    ell(g, 15, 46.5, 3, 1.5, 'b'); ell(g, 30, 46.5, 3, 1.5, 'b');
    outline(g, 'k');
  });

  const gooseOwPal = PAL_GOOSE;
  function gooseBase(g, cx) {
    ell(g, cx, 12.3, 4.4, 3.1, 'w');
    ell(g, cx, 7.3, 1.9, 4.3, 'w'); // neck
    ell(g, cx, 2.6, 2.1, 1.9, 'w'); // head
  }
  sprite('ow_goose_down_0', 16, 16, gooseOwPal, g => {
    gooseBase(g, 7.5);
    px(g, 7, 3, 'b'); px(g, 8, 3, 'b');
    px(g, 6, 2, 'k'); px(g, 9, 2, 'k');
    px(g, 9, 12, 'd');
    px(g, 5, 15, 'b'); px(g, 9, 15, 'b');
    outline(g, 'k');
  });
  sprite('ow_goose_down_1', 16, 16, gooseOwPal, g => {
    gooseBase(g, 7.5);
    px(g, 7, 3, 'b'); px(g, 8, 3, 'b');
    px(g, 6, 2, 'k'); px(g, 9, 2, 'k');
    px(g, 9, 12, 'd');
    px(g, 4, 14, 'b'); px(g, 10, 15, 'b');
    outline(g, 'k');
  });
  sprite('ow_goose_up_0', 16, 16, gooseOwPal, g => {
    gooseBase(g, 7.5);
    px(g, 7, 7, 'd');
    px(g, 5, 15, 'b'); px(g, 9, 15, 'b');
    outline(g, 'k');
  });
  sprite('ow_goose_up_1', 16, 16, gooseOwPal, g => {
    gooseBase(g, 7.5);
    px(g, 7, 7, 'd');
    px(g, 4, 14, 'b'); px(g, 10, 15, 'b');
    outline(g, 'k');
  });
  sprite('ow_goose_left_0', 16, 16, gooseOwPal, g => {
    ell(g, 8.3, 12.3, 4, 3.2, 'w');
    ell(g, 5.6, 7.3, 2.1, 4.4, 'w');
    ell(g, 4, 2.6, 1.9, 2, 'w');
    px(g, 2, 3, 'b'); px(g, 1, 3, 'b');
    px(g, 4, 2, 'k');
    px(g, 6, 15, 'b'); px(g, 10, 15, 'b');
    outline(g, 'k');
  });
  sprite('ow_goose_left_1', 16, 16, gooseOwPal, g => {
    ell(g, 8.3, 12.3, 4, 3.2, 'w');
    ell(g, 5.6, 7.3, 2.1, 4.4, 'w');
    ell(g, 4, 2.6, 1.9, 2, 'w');
    px(g, 2, 3, 'b'); px(g, 1, 3, 'b');
    px(g, 4, 2, 'k');
    px(g, 5, 14, 'b'); px(g, 11, 15, 'b');
    outline(g, 'k');
  });

  // ===================================================================
  // TURKEY (rare wild) — proud tom with fanned brown tail, red/blue head
  // ===================================================================
  const PAL_TURKEY = {
    k: '#201206:0', // outline / beak / eye
    b: '#7a4a28:2', // body + fan mid-band, brown
    d: '#4e2f18:1', // body shadow + fan dark band/tips
    t: '#e0c383:3', // fan light band + highlight + sparkle
    u: '#6a8ab8:1', // head/neck skin, blue
    r: '#20180a:0', // wattle/snood, dark red-black accent (reads as a dark dangle)
    v: '#c23838:2', // wattle red (a spot of red on the dangle)
    e: '#d89858:1', // legs/feet
  };

  sprite('front_turkey', 48, 48, PAL_TURKEY, g => {
    // tail fan, displayed forward (toms fan facing an audience)
    ell(g, 24, 20, 19, 15, 'd'); // dark base / tips
    ell(g, 24, 22, 15.5, 11.5, 'b'); // mid-brown fan body
    const spots = [[9, 23], [13, 13], [20, 7.5], [28, 7.5], [35, 13], [39, 23]];
    for (const [sx, sy] of spots) { ell(g, sx, sy, 3, 5, 't'); ell(g, sx, sy, 1.3, 2.2, 'd'); }
    // body
    ell(g, 24, 35, 10.5, 10, 'b');
    ell(g, 28.5, 38.5, 6, 6, 'd');
    ell(g, 19, 30, 4, 4, 't');
    // neck + head (tucked low, chest height, as a displaying tom holds it)
    ell(g, 24, 29, 3, 5, 'u');
    ell(g, 24, 25.5, 3.6, 3.4, 'u');
    ell(g, 26, 26.5, 1.6, 1.8, 'u');
    // wattle / snood dangling over the beak
    px(g, 24, 30, 'r'); px(g, 23.5, 29, 'rr'); px(g, 24, 29, 'rr');
    px(g, 24, 24, 'k'); // beak
    px(g, 22, 25, 'k'); px(g, 21, 25, 't'); // eye + sparkle
    // legs + feet
    rect(g, 21, 40, 22, 45, 'e'); rect(g, 26, 40, 27, 45, 'e');
    spans(g, [[46, 19, 24], [46, 25, 30]], 'e');
    outline(g, 'k');
  });

  sprite('back_turkey', 48, 48, PAL_TURKEY, g => {
    ell(g, 24, 22, 21, 18, 'd');
    ell(g, 24, 23, 17, 14, 'b');
    const spots = [[6, 26], [9, 15], [15, 7], [24, 4], [33, 7], [39, 15], [42, 26]];
    for (const [sx, sy] of spots) { ell(g, sx, sy, 3, 5, 't'); ell(g, sx, sy, 1.3, 2.2, 'd'); }
    ell(g, 24, 40, 7, 6, 'b');
    ell(g, 27, 42, 4, 4, 'd');
    rect(g, 21, 44, 22, 47, 'e'); rect(g, 26, 44, 27, 47, 'e');
    outline(g, 'k');
  });

  const turkeyOwPal = PAL_TURKEY;
  function turkeyBase(g, cx) {
    ell(g, cx, 11, 3.6, 2.9, 'b');
    ell(g, cx - 3.6, 11.5, 1.1, 2, 'd'); ell(g, cx + 3.6, 11.5, 1.1, 2, 'd'); // folded tail hint
    ell(g, cx, 7.3, 2.1, 2, 'u');
  }
  sprite('ow_turkey_down_0', 16, 16, turkeyOwPal, g => {
    turkeyBase(g, 7.5);
    px(g, 7, 9, 'rr'); px(g, 7, 8, 'k');
    px(g, 6, 7, 'k');
    px(g, 5, 14, 'e'); px(g, 9, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_turkey_down_1', 16, 16, turkeyOwPal, g => {
    turkeyBase(g, 7.5);
    px(g, 7, 9, 'rr'); px(g, 7, 8, 'k');
    px(g, 6, 7, 'k');
    px(g, 5, 13, 'e'); px(g, 10, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_turkey_up_0', 16, 16, turkeyOwPal, g => {
    turkeyBase(g, 7.5);
    px(g, 7, 6, 't'); px(g, 8, 6, 't');
    px(g, 5, 14, 'e'); px(g, 9, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_turkey_up_1', 16, 16, turkeyOwPal, g => {
    turkeyBase(g, 7.5);
    px(g, 7, 6, 't'); px(g, 8, 6, 't');
    px(g, 5, 13, 'e'); px(g, 10, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_turkey_left_0', 16, 16, turkeyOwPal, g => {
    ell(g, 8.4, 11, 3.4, 3, 'b');
    ell(g, 11.6, 11.5, 1.3, 2.2, 'd');
    ell(g, 5.3, 7.3, 2.2, 2, 'u');
    px(g, 4, 9, 'rr'); px(g, 4, 8, 'k');
    px(g, 4, 6, 'k');
    px(g, 6, 14, 'e'); px(g, 10, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_turkey_left_1', 16, 16, turkeyOwPal, g => {
    ell(g, 8.4, 11, 3.4, 3, 'b');
    ell(g, 11.6, 11.5, 1.3, 2.2, 'd');
    ell(g, 5.3, 7.3, 2.2, 2, 'u');
    px(g, 4, 9, 'rr'); px(g, 4, 8, 'k');
    px(g, 4, 6, 'k');
    px(g, 5, 13, 'e'); px(g, 11, 14, 'e');
    outline(g, 'k');
  });
  // normalize: guarantee exact row widths/heights for every sprite defined in this file
  for (const name of Object.keys(S)) { const d = S[name]; if (!d || !d.rows) continue; d.rows = d.rows.slice(0, d.h).map(r => r.length > d.w ? r.slice(0, d.w) : r.padEnd(d.w, '.')); while (d.rows.length < d.h) d.rows.push('.'.repeat(d.w)); }
})();
