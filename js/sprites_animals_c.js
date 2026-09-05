// Animal sprites: lamb -> sheep, kidgoat -> goat. Original Gen1/2-style farm-animal art.
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
  // LAMB (baby) — tiny fluffy white lamb, pink face, wobbly legs
  // ===================================================================
  const PAL_LAMB = {
    k: '#2a2018:0', // outline
    w: '#faf6ec:3', // wool main (near-white)
    d: '#d6cdb4:1', // wool shadow
    h: '#ffffff:3', // wool highlight (pure white puff)
    f: '#f3c9ba:2', // face/legs skin (pale pink)
    s: '#d99a88:1', // face shadow
    n: '#b5675a:1', // nose/mouth
  };

  sprite('front_lamb', 48, 48, PAL_LAMB, g => {
    // fluffy wool body (round puffball, several overlapping puffs for a cloud edge)
    ell(g, 23.5, 27, 15, 13.5, 'w');
    ell(g, 11, 22, 5.5, 5.5, 'w'); ell(g, 36, 22, 5.5, 5.5, 'w');
    ell(g, 12, 33, 5, 5, 'w'); ell(g, 35, 33, 5, 5, 'w');
    ell(g, 23.5, 15, 6.5, 5.5, 'w');
    // shadow (light from top-left -> shade bottom-right)
    ell(g, 30, 34, 9, 8.5, 'd');
    ell(g, 34, 24, 4.5, 4.5, 'd');
    // highlight puff top-left
    ell(g, 15, 18, 5, 4.5, 'h');
    // face patch (pink, small and low so it stays a lamb not a goat)
    ell(g, 23.5, 30, 7, 6, 'f');
    ell(g, 27, 33, 3.5, 3, 's');
    // ears (small floppy triangles at sides of face)
    ell(g, 15.5, 28, 2.6, 1.8, 'f'); ell(g, 31.5, 28, 2.6, 1.8, 'f');
    // legs, thin and a bit knock-kneed (wobbly)
    rect(g, 16, 38, 18, 44, 'f'); rect(g, 29, 39, 31, 44, 'f');
    rect(g, 17, 41, 18, 44, 's'); rect(g, 30, 42, 31, 44, 's');
    // eyes
    px(g, 20, 28, 'k'); px(g, 21, 28, 'k'); px(g, 20, 29, 'k'); px(g, 21, 29, 'k');
    px(g, 26, 28, 'k'); px(g, 27, 28, 'k'); px(g, 26, 29, 'k'); px(g, 27, 29, 'k');
    px(g, 20, 28, 'w'); px(g, 26, 28, 'w'); // sparkle
    ell(g, 23.5, 32, 1.4, 1, 'n');
    outline(g, 'k');
  });

  sprite('back_lamb', 48, 48, PAL_LAMB, g => {
    ell(g, 23.5, 29, 17, 15.5, 'w');
    ell(g, 9.5, 23, 5.8, 5.8, 'w'); ell(g, 37.5, 23, 5.8, 5.8, 'w');
    ell(g, 10, 35, 5.4, 5.2, 'w'); ell(g, 37, 35, 5.4, 5.2, 'w');
    ell(g, 23.5, 16.5, 5, 4.5, 'f'); // small ears/head peek from behind
    ell(g, 18.5, 16.5, 2, 1.6, 'f'); ell(g, 28.5, 16.5, 2, 1.6, 'f');
    ell(g, 31, 26, 5, 5, 'd');
    ell(g, 32, 38, 10, 9, 'd');
    ell(g, 14, 20, 5, 4.5, 'h');
    rect(g, 14, 41, 16, 46, 'f'); rect(g, 31, 41, 33, 46, 'f');
    rect(g, 14, 44, 16, 46, 's'); rect(g, 31, 44, 33, 46, 's');
    outline(g, 'k');
  });

  const lambOwPal = PAL_LAMB;
  function lambBase(g, cx) {
    ell(g, cx, 10, 4.4, 3.6, 'w');
    ell(g, cx - 3.6, 8, 1.8, 1.8, 'w'); ell(g, cx + 3.6, 8, 1.8, 1.8, 'w');
    ell(g, cx, 6.6, 3, 2.6, 'f'); // face
  }
  sprite('ow_lamb_down_0', 16, 16, lambOwPal, g => {
    lambBase(g, 7.5);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 8, 'n');
    px(g, 6, 13, 'f'); px(g, 9, 13, 'f');
    outline(g, 'k');
  });
  sprite('ow_lamb_down_1', 16, 16, lambOwPal, g => {
    lambBase(g, 7.5);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 8, 'n');
    px(g, 5, 12, 'f'); px(g, 10, 13, 'f');
    outline(g, 'k');
  });
  sprite('ow_lamb_up_0', 16, 16, lambOwPal, g => {
    lambBase(g, 7.5);
    px(g, 6, 13, 'f'); px(g, 9, 13, 'f');
    outline(g, 'k');
  });
  sprite('ow_lamb_up_1', 16, 16, lambOwPal, g => {
    lambBase(g, 7.5);
    px(g, 5, 12, 'f'); px(g, 10, 13, 'f');
    outline(g, 'k');
  });
  sprite('ow_lamb_left_0', 16, 16, lambOwPal, g => {
    ell(g, 8.4, 10, 4.6, 3.6, 'w');
    ell(g, 5.8, 7.6, 1.9, 1.9, 'w');
    ell(g, 7, 6.6, 2.8, 2.6, 'f');
    px(g, 4, 6, 'k');
    px(g, 4, 8, 'n');
    px(g, 6, 13, 'f'); px(g, 10, 13, 'f');
    outline(g, 'k');
  });
  sprite('ow_lamb_left_1', 16, 16, lambOwPal, g => {
    ell(g, 8.4, 10, 4.6, 3.6, 'w');
    ell(g, 5.8, 7.6, 1.9, 1.9, 'w');
    ell(g, 7, 6.6, 2.8, 2.6, 'f');
    px(g, 4, 6, 'k');
    px(g, 4, 8, 'n');
    px(g, 5, 12, 'f'); px(g, 11, 13, 'f');
    outline(g, 'k');
  });

  // ===================================================================
  // SHEEP (grown) — big woolly cloud-like sheep, calm expression
  // ===================================================================
  const PAL_SHEEP = {
    k: '#221a14:0',
    w: '#f3efe0:3',
    d: '#c9c0a4:1',
    h: '#ffffff:3',
    f: '#e8d4b0:2', // face (soft cream, not pink like the lamb)
    s: '#b89a68:1',
    n: '#5a4632:1',
  };

  sprite('front_sheep', 48, 48, PAL_SHEEP, g => {
    // big cloud-of-wool silhouette: many overlapping puffs
    ell(g, 23.5, 28, 17.5, 15, 'w');
    ell(g, 8, 20, 6.5, 6.5, 'w'); ell(g, 39, 20, 6.5, 6.5, 'w');
    ell(g, 6.5, 32, 6, 6, 'w'); ell(g, 40.5, 32, 6, 6, 'w');
    ell(g, 16, 12, 6.5, 5.5, 'w'); ell(g, 31, 12, 6.5, 5.5, 'w');
    ell(g, 23.5, 9, 6.5, 4.5, 'w');
    // shadow bottom-right
    ell(g, 32, 34, 11, 10, 'd');
    ell(g, 40, 22, 6, 5.5, 'd');
    ell(g, 33, 13, 5.5, 4.5, 'd');
    // highlight top-left
    ell(g, 13, 17, 6, 5, 'h');
    ell(g, 9, 30, 4.5, 4.5, 'h');
    // face (bigger, calmer, lower on the body than the lamb's)
    ell(g, 23.5, 33, 8, 7, 'f');
    ell(g, 28.5, 36, 4, 3.5, 's');
    // ears (a bit longer/droopier than the lamb)
    ell(g, 14.5, 31, 3, 2.2, 'f'); ell(g, 32.5, 31, 3, 2.2, 'f');
    ell(g, 13.5, 32.5, 1.6, 1.2, 's'); ell(g, 33.5, 32.5, 1.6, 1.2, 's');
    // sturdy legs
    rect(g, 14, 41, 17, 47, 'f'); rect(g, 30, 41, 33, 47, 'f');
    rect(g, 15, 44, 17, 47, 's'); rect(g, 31, 44, 33, 47, 's');
    // eyes (calmer half-lidded look — narrower)
    spans(g, [[32, 20, 21], [32, 26, 27]], 'k');
    px(g, 20, 32, 'w'); px(g, 26, 32, 'w');
    ell(g, 23.5, 36, 1.6, 1.1, 'n');
    outline(g, 'k');
  });

  sprite('back_sheep', 48, 48, PAL_SHEEP, g => {
    ell(g, 23.5, 30, 19, 17, 'w');
    ell(g, 6.5, 21, 7, 7, 'w'); ell(g, 40.5, 21, 7, 7, 'w');
    ell(g, 5, 34, 6.4, 6.4, 'w'); ell(g, 42, 34, 6.4, 6.4, 'w');
    ell(g, 15, 12, 7, 6, 'w'); ell(g, 32, 12, 7, 6, 'w');
    ell(g, 23.5, 9, 7, 5, 'w');
    ell(g, 23.5, 18, 5.5, 5, 'f'); // small head/ears peeking above the wool from behind
    ell(g, 17.5, 18.5, 2.4, 1.8, 'f'); ell(g, 29.5, 18.5, 2.4, 1.8, 'f');
    ell(g, 34, 24, 7, 6.5, 'd');
    ell(g, 34, 39, 12, 11, 'd');
    ell(g, 12, 16, 6, 5, 'h');
    rect(g, 12, 44, 15, 50, 'f'); rect(g, 32, 44, 35, 50, 'f');
    rect(g, 13, 47, 15, 50, 's'); rect(g, 33, 47, 35, 50, 's');
    outline(g, 'k');
  });

  const sheepOwPal = PAL_SHEEP;
  function sheepBase(g, cx) {
    ell(g, cx, 10.5, 5.4, 4.2, 'w');
    ell(g, cx - 4.6, 8, 2.2, 2.2, 'w'); ell(g, cx + 4.6, 8, 2.2, 2.2, 'w');
    ell(g, cx, 6.5, 3.6, 3, 'f'); // face
  }
  sprite('ow_sheep_down_0', 16, 16, sheepOwPal, g => {
    sheepBase(g, 7.5);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 8, 'n');
    px(g, 5, 14, 'f'); px(g, 10, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_sheep_down_1', 16, 16, sheepOwPal, g => {
    sheepBase(g, 7.5);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 8, 'n');
    px(g, 4, 13, 'f'); px(g, 11, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_sheep_up_0', 16, 16, sheepOwPal, g => {
    sheepBase(g, 7.5);
    px(g, 5, 14, 'f'); px(g, 10, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_sheep_up_1', 16, 16, sheepOwPal, g => {
    sheepBase(g, 7.5);
    px(g, 4, 13, 'f'); px(g, 11, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_sheep_left_0', 16, 16, sheepOwPal, g => {
    ell(g, 8.3, 10.5, 5.6, 4.2, 'w');
    ell(g, 4.6, 7.8, 2.3, 2.3, 'w');
    ell(g, 6.6, 6.5, 3.3, 3, 'f');
    px(g, 3, 6, 'k');
    px(g, 3, 8, 'n');
    px(g, 5, 14, 'f'); px(g, 10, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_sheep_left_1', 16, 16, sheepOwPal, g => {
    ell(g, 8.3, 10.5, 5.6, 4.2, 'w');
    ell(g, 4.6, 7.8, 2.3, 2.3, 'w');
    ell(g, 6.6, 6.5, 3.3, 3, 'f');
    px(g, 3, 6, 'k');
    px(g, 3, 8, 'n');
    px(g, 4, 13, 'f'); px(g, 11, 14, 'f');
    outline(g, 'k');
  });

  // ===================================================================
  // KIDGOAT (baby) — small goat kid, tiny horn nubs, floppy ears, mid-hop
  // ===================================================================
  const PAL_KIDGOAT = {
    k: '#241c14:0',
    b: '#e0c894:2', // coat main (tan)
    d: '#b89660:1', // coat shadow
    w: '#f8ecd0:3', // belly/muzzle highlight
    e: '#7a5a3a:1', // ear/hoof/horn (dark brown)
    n: '#4a3424:0', // nose/mouth
  };

  sprite('front_kidgoat', 48, 48, PAL_KIDGOAT, g => {
    // mid-hop pose: body tilted, all four legs tucked/kicked, off the ground
    ell(g, 24, 26, 12.5, 10.5, 'b');
    ell(g, 29.5, 30, 7.5, 7, 'd');
    ell(g, 24, 30, 6.5, 5.5, 'w'); // belly/chest
    // head, tilted up slightly (excited hop)
    ell(g, 24, 13, 8, 7.5, 'b');
    ell(g, 24, 17, 4.5, 3.2, 'w'); // muzzle
    // floppy ears, hung at the cheeks (not on top, so the head doesn't read as a bear's)
    ell(g, 14.5, 14, 2.6, 3.8, 'b'); ell(g, 33.5, 14, 2.6, 3.8, 'b');
    ell(g, 14.5, 15, 1.3, 2.5, 'd'); ell(g, 33.5, 15, 1.3, 2.5, 'd');
    // tiny horn nubs — small but solid so they survive the outline pass as visible brown bumps
    ell(g, 20, 6.3, 1.5, 1.6, 'e'); ell(g, 28, 6.3, 1.5, 1.6, 'e');
    // legs kicked out mid-hop: two forward/up (bent), two back/down
    ell(g, 14, 31, 2.6, 5, 'b'); ell(g, 34, 31, 2.6, 5, 'b');
    ell(g, 13, 36, 2, 1.6, 'e'); ell(g, 35, 36, 2, 1.6, 'e');
    ell(g, 19, 39, 2.4, 4.4, 'b'); ell(g, 29, 39, 2.4, 4.4, 'b');
    ell(g, 19, 43.5, 1.9, 1.5, 'e'); ell(g, 29, 43.5, 1.9, 1.5, 'e');
    // little tail flick
    ell(g, 34, 24, 1.8, 1.4, 'd');
    // face
    px(g, 20, 12, 'k'); px(g, 21, 12, 'k'); px(g, 20, 13, 'k'); px(g, 21, 13, 'k');
    px(g, 27, 12, 'k'); px(g, 28, 12, 'k'); px(g, 27, 13, 'k'); px(g, 28, 13, 'k');
    px(g, 20, 12, 'w'); px(g, 27, 12, 'w');
    ell(g, 24, 16, 1.2, 0.9, 'n');
    outline(g, 'k');
  });

  sprite('back_kidgoat', 48, 48, PAL_KIDGOAT, g => {
    ell(g, 23.5, 28, 14, 12, 'b');
    ell(g, 30, 33, 8.5, 8, 'd');
    ell(g, 23.5, 15, 8.5, 7.5, 'b');
    ell(g, 15, 14, 3.4, 4.8, 'd'); ell(g, 32, 14, 3.4, 4.8, 'd');
    ell(g, 15, 14.5, 1.7, 3, 'b'); ell(g, 32, 14.5, 1.7, 3, 'b');
    ell(g, 19, 8.4, 1.5, 1.6, 'e'); ell(g, 28, 8.4, 1.5, 1.6, 'e');
    ell(g, 23.5, 41, 5.5, 5, 'w');
    ell(g, 13.5, 33, 2.6, 5.2, 'b'); ell(g, 33.5, 33, 2.6, 5.2, 'b');
    ell(g, 12.5, 38, 2.1, 1.7, 'e'); ell(g, 34.5, 38, 2.1, 1.7, 'e');
    ell(g, 18.5, 40, 2.5, 4.5, 'b'); ell(g, 28.5, 40, 2.5, 4.5, 'b');
    ell(g, 18.5, 44.5, 2, 1.6, 'e'); ell(g, 28.5, 44.5, 2, 1.6, 'e');
    ell(g, 23.5, 20, 1.6, 1.6, 'd'); // little tail
    outline(g, 'k');
  });

  const kidgoatOwPal = PAL_KIDGOAT;
  function kidgoatBase(g, cx, hop) {
    const dy = hop ? -1 : 0;
    ell(g, cx, 11 + dy, 3.8, 3.1, 'b'); // body
    ell(g, cx, 6.6 + dy, 2.7, 2.5, 'b'); // head
    // small floppy ears at the cheeks, same height as the head so the
    // silhouette stays round (no pinched "vase neck")
    ell(g, cx - 2.6, 6.8 + dy, 1.05, 1.4, 'b'); ell(g, cx + 2.6, 6.8 + dy, 1.05, 1.4, 'b');
    ell(g, cx - 1, 4 + dy, 0.9, 1.0, 'e'); ell(g, cx + 1, 4 + dy, 0.9, 1.0, 'e'); // horn nubs
  }
  sprite('ow_kidgoat_down_0', 16, 16, kidgoatOwPal, g => {
    kidgoatBase(g, 7.5, false);
    px(g, 6, 7, 'k'); px(g, 9, 7, 'k');
    px(g, 7, 9, 'n');
    px(g, 6, 14, 'e'); px(g, 9, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_kidgoat_down_1', 16, 16, kidgoatOwPal, g => {
    kidgoatBase(g, 7.5, true);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 7, 8, 'n');
    px(g, 5, 13, 'e'); px(g, 10, 12, 'e');
    outline(g, 'k');
  });
  sprite('ow_kidgoat_up_0', 16, 16, kidgoatOwPal, g => {
    kidgoatBase(g, 7.5, false);
    px(g, 6, 14, 'e'); px(g, 9, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_kidgoat_up_1', 16, 16, kidgoatOwPal, g => {
    kidgoatBase(g, 7.5, true);
    px(g, 5, 13, 'e'); px(g, 10, 12, 'e');
    outline(g, 'k');
  });
  sprite('ow_kidgoat_left_0', 16, 16, kidgoatOwPal, g => {
    ell(g, 8.3, 11, 3.8, 3.1, 'b'); // body
    ell(g, 6.5, 6.6, 2.7, 2.5, 'b'); // head
    ell(g, 5.1, 6.9, 1.0, 1.3, 'b'); // near-side ear, at cheek height
    px(g, 6, 4, 'e'); // near-side horn nub
    px(g, 3, 6, 'k'); // eye
    px(g, 3, 8, 'n'); // nose
    px(g, 6, 14, 'e'); px(g, 10, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_kidgoat_left_1', 16, 16, kidgoatOwPal, g => {
    ell(g, 8.3, 10, 3.8, 3.1, 'b');
    ell(g, 6.5, 5.6, 2.7, 2.5, 'b');
    ell(g, 5.1, 5.9, 1.0, 1.3, 'b');
    px(g, 6, 3, 'e');
    px(g, 3, 5, 'k');
    px(g, 3, 7, 'n');
    px(g, 5, 13, 'e'); px(g, 11, 12, 'e');
    outline(g, 'k');
  });

  // ===================================================================
  // GOAT (grown) — curved horns, little beard, mischievous grin
  // ===================================================================
  const PAL_GOAT = {
    k: '#221a12:0',
    b: '#d8c090:2',
    d: '#a88858:1',
    w: '#f4e8c8:3',
    e: '#5e4228:1', // horn/hoof/beard
    n: '#3a281a:0',
  };

  sprite('front_goat', 48, 48, PAL_GOAT, g => {
    // sturdy standing body
    ell(g, 23.5, 33, 14.5, 11.5, 'b');
    ell(g, 30, 37, 8.5, 7.5, 'd');
    ell(g, 23.5, 36, 7.5, 6, 'w');
    // head, level, alert
    ell(g, 23.5, 18, 9, 8, 'b');
    ell(g, 23.5, 22.5, 5, 3.6, 'w'); // muzzle
    // ears
    ell(g, 13.5, 17, 3.6, 2.6, 'b'); ell(g, 33.5, 17, 3.6, 2.6, 'b');
    ell(g, 13, 17, 1.8, 1.4, 'd'); ell(g, 34, 17, 1.8, 1.4, 'd');
    // curved horns, rooted right on the head edge (each built from 3 overlapping
    // blobs so it reads as one continuous hook, not a floating squiggle)
    ell(g, 19, 11, 1.7, 1.9, 'e'); ell(g, 17.3, 7.5, 1.4, 1.7, 'e'); ell(g, 18.4, 5, 1.1, 1.3, 'e');
    ell(g, 28, 11, 1.7, 1.9, 'e'); ell(g, 29.7, 7.5, 1.4, 1.7, 'e'); ell(g, 28.6, 5, 1.1, 1.3, 'e');
    // beard, hanging below the chin onto the chest
    spans(g, [[27, 22, 25], [28, 22, 25], [29, 23, 24]], 'e');
    // mischievous grin — corners turned up
    spans(g, [[24, 20, 21], [25, 22, 25], [24, 26, 27]], 'n');
    // legs
    rect(g, 15, 41, 18, 46, 'b'); rect(g, 29, 41, 32, 46, 'b');
    rect(g, 15, 44, 18, 46, 'e'); rect(g, 29, 44, 32, 46, 'e');
    // eyes (slightly narrowed = mischievous)
    spans(g, [[17, 18, 20], [17, 27, 29]], 'k');
    px(g, 18, 17, 'w'); px(g, 27, 17, 'w');
    outline(g, 'k');
  });

  sprite('back_goat', 48, 48, PAL_GOAT, g => {
    ell(g, 23.5, 35, 16, 13, 'b');
    ell(g, 31, 40, 9.5, 8.5, 'd');
    ell(g, 23.5, 21, 9.5, 8.5, 'b');
    ell(g, 13, 20, 3.8, 2.8, 'd'); ell(g, 34, 20, 3.8, 2.8, 'd');
    ell(g, 13, 20, 2, 1.6, 'b'); ell(g, 34, 20, 2, 1.6, 'b');
    ell(g, 19, 13.5, 1.7, 1.9, 'e'); ell(g, 17.3, 10, 1.4, 1.7, 'e'); ell(g, 18.4, 7.5, 1.1, 1.3, 'e');
    ell(g, 28, 13.5, 1.7, 1.9, 'e'); ell(g, 29.7, 10, 1.4, 1.7, 'e'); ell(g, 28.6, 7.5, 1.1, 1.3, 'e');
    ell(g, 23.5, 47, 6.5, 4, 'w');
    ell(g, 23.5, 26, 2, 1.6, 'd'); // little tail flick, up top of rear view
    rect(g, 14, 44, 17, 49, 'b'); rect(g, 30, 44, 33, 49, 'b');
    rect(g, 14, 47, 17, 49, 'e'); rect(g, 30, 47, 33, 49, 'e');
    outline(g, 'k');
  });

  const goatOwPal = PAL_GOAT;
  function goatBase(g, cx) {
    ell(g, cx, 11, 4.6, 3.4, 'b'); // body
    ell(g, cx, 6.5, 3, 2.7, 'b'); // head
    // floppy ears at the SIDE of the head (cheek height, not on top) so it
    // doesn't read as a tall single bunny ear
    ell(g, cx - 3, 6.7, 1.3, 1.6, 'b'); ell(g, cx + 3, 6.7, 1.3, 1.6, 'b');
    ell(g, cx - 3, 7, 0.6, 0.9, 'd'); ell(g, cx + 3, 7, 0.6, 0.9, 'd');
    // small horn dots sitting right on the head's top edge (overlapping it)
    ell(g, cx - 1, 4, 0.6, 0.7, 'e'); ell(g, cx + 1, 4, 0.6, 0.7, 'e');
    ell(g, cx, 9, 0.6, 0.6, 'e'); // beard fleck
  }
  sprite('ow_goat_down_0', 16, 16, goatOwPal, g => {
    goatBase(g, 7.5);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 6, 14, 'e'); px(g, 9, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_goat_down_1', 16, 16, goatOwPal, g => {
    goatBase(g, 7.5);
    px(g, 6, 6, 'k'); px(g, 9, 6, 'k');
    px(g, 5, 13, 'e'); px(g, 10, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_goat_up_0', 16, 16, goatOwPal, g => {
    goatBase(g, 7.5);
    px(g, 6, 14, 'e'); px(g, 9, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_goat_up_1', 16, 16, goatOwPal, g => {
    goatBase(g, 7.5);
    px(g, 5, 13, 'e'); px(g, 10, 14, 'e');
    outline(g, 'k');
  });
  sprite('ow_goat_left_0', 16, 16, goatOwPal, g => {
    ell(g, 8.4, 11, 4.8, 3.4, 'b'); // body
    ell(g, 6.6, 6.5, 3, 2.7, 'b'); // head
    ell(g, 5.2, 6.8, 1.3, 1.6, 'b'); ell(g, 5.2, 7.1, 0.6, 0.9, 'd'); // near-side ear
    px(g, 6, 4, 'e'); // near-side horn dot on the head edge
    px(g, 3, 6, 'k'); // eye
    px(g, 3, 8, 'n'); // nose tip
    px(g, 5, 9, 'e'); // beard fleck
    px(g, 6, 14, 'e'); px(g, 10, 14, 'e'); // hooves
    outline(g, 'k');
  });
  sprite('ow_goat_left_1', 16, 16, goatOwPal, g => {
    ell(g, 8.4, 11, 4.8, 3.4, 'b');
    ell(g, 6.6, 6.5, 3, 2.7, 'b');
    ell(g, 5.2, 6.8, 1.3, 1.6, 'b'); ell(g, 5.2, 7.1, 0.6, 0.9, 'd');
    px(g, 6, 4, 'e');
    px(g, 3, 6, 'k');
    px(g, 3, 8, 'n');
    px(g, 5, 9, 'e');
    px(g, 5, 13, 'e'); px(g, 11, 14, 'e');
    outline(g, 'k');
  });
})();
