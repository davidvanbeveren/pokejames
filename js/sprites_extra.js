// Extra sprites: PIGEON — the legendary animal of this game. Gen1/2-style GB pixel art.
// Rock-dove gray body, iridescent green/purple-black neck collar, orange feet, red-orange eye.
// Built with the same small pixel-grid helpers used in sprites_animals_a.js (ellipse fill + outline pass);
// the final window.SPRITES entries are plain {w,h,pal,rows} data like every other sprite file.
(function () {
  const S = window.SPRITES = window.SPRITES || {};

  // ---------- pixel grid helpers ----------
  function grid(w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('.')); return g; }
  function set(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
  function get(g, x, y) { if (y < 0 || y >= g.length || x < 0 || x >= g[0].length) return '.'; return g[y][x]; }
  function ell(g, cx, cy, rx, ry, c) {
    const h = g.length, w = g[0].length;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(g, x, y, c);
    }
  }
  function rect(g, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(g, x, y, c); }
  function px(g, x, y, c) { set(g, x, y, c); }
  function spans(g, list, c) { for (const [y, x0, x1] of list) for (let x = x0; x <= x1; x++) set(g, x, y, c); }
  function outline(g, k) {
    const h = g.length, w = g[0].length, edges = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = g[y][x];
      if (c === '.' || c === k) continue;
      if (get(g, x - 1, y) === '.' || get(g, x + 1, y) === '.' || get(g, x, y - 1) === '.' || get(g, x, y + 1) === '.') edges.push([x, y]);
    }
    for (const [x, y] of edges) g[y][x] = k;
  }
  // like outline(), but for a sprite that fills the whole canvas (a background tile with no
  // transparency): outlines any cell matching isTarget that touches a cell matching isBg.
  // The canvas edge is never treated as background, so a seamless edge-to-edge fill doesn't
  // get framed in outline color — only the silhouette drawn *within* the tile does.
  function outlineAgainst(g, k, isTarget, isBg) {
    const h = g.length, w = g[0].length, edges = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = g[y][x];
      if (!isTarget(c)) continue;
      const nbs = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (const [nx, ny] of nbs) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        if (isBg(g[ny][nx])) { edges.push([x, y]); break; }
      }
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
  // PIGEON (legendary) — proud city rock-dove. Gray body, iridescent
  // green/purple-black neck collar, red-orange eye, orange feet.
  // ===================================================================
  const PAL_PIGEON = {
    k: '#17141a:0', // outline
    g: '#9d99a4:2', // body gray main
    d: '#6d6a76:1', // body gray shadow
    l: '#d2cfd6:3', // body gray highlight
    n: '#2f9060:1', // neck iridescent green
    v: '#4a2c62:0', // neck iridescent purple/black (collar)
    m: '#302c38:0', // wing bar / dark markings
    r: '#f3efe8:3', // white eye-ring / cere
    e: '#e0481c:1', // eye, red-orange
    f: '#e08a20:1', // feet / legs, orange (kept dark-shade in GB so they don't melt into the body gray)
    q: '#514a54:1', // beak, dark warm gray (distinct from the black outline)
  };

  // ---------------- battle sprites (48x48) ----------------
  sprite('front_pigeon', 48, 48, PAL_PIGEON, g => {
    // tail hint peeking out beneath the body, dark
    ell(g, 23.5, 44.5, 10.5, 4, 'd');
    // body — big puffed proud chest (drawn before the wings so the wings sit over its edges)
    ell(g, 23.5, 33, 13.5, 12.5, 'g');
    ell(g, 29.5, 39, 9, 8, 'd');
    ell(g, 21, 38, 5, 4.4, 'l');
    // folded wings, held slightly out — majestic, broad-shouldered stance
    ell(g, 10, 30, 5.6, 11.5, 'g');
    ell(g, 37, 30, 5.6, 11.5, 'g');
    ell(g, 9, 35, 3.4, 6.5, 'd');
    ell(g, 38.5, 35, 3.4, 6.5, 'd');
    // wing bars (two dark bands per wing), painted last so they stay on top
    spans(g, [[25, 5, 13], [26, 5, 13]], 'm');
    spans(g, [[32, 5, 13], [33, 5, 13]], 'm');
    spans(g, [[25, 34, 42], [26, 34, 42]], 'm');
    spans(g, [[32, 34, 42], [33, 34, 42]], 'm');
    // neck / iridescent collar, wraps under the head
    ell(g, 23.5, 24, 9.5, 5.5, 'v');
    ell(g, 23.5, 20.5, 9, 5, 'n');
    // head, held high
    ell(g, 23.5, 13.5, 7.6, 7, 'g');
    ell(g, 20, 10.5, 3.4, 2.8, 'l');
    ell(g, 27.5, 15.5, 2.8, 2.6, 'd');
    // cere (pale bump at the top of the beak) then a small neat beak point below it
    ell(g, 23.5, 16.8, 2.8, 1.6, 'r');
    spans(g, [[18, 22, 25], [19, 22, 24], [20, 23, 23]], 'q');
    // eyes — proud, slightly hooded look (thin brow, not a heavy scowl)
    ell(g, 18.7, 12.8, 2.2, 2, 'r'); ell(g, 28.3, 12.8, 2.2, 2, 'r');
    ell(g, 18.9, 13.1, 1.2, 1.2, 'e'); ell(g, 28.5, 13.1, 1.2, 1.2, 'e');
    px(g, 17, 11, 'd'); px(g, 18, 11, 'd');
    px(g, 29, 11, 'd'); px(g, 30, 11, 'd');
    px(g, 18, 12, 'l'); px(g, 28, 12, 'l');
    // feet, planted proud and wide
    rect(g, 15, 42, 17, 45, 'f'); rect(g, 30, 42, 32, 45, 'f');
    spans(g, [[46, 14, 18], [46, 29, 33]], 'f');
    outline(g, 'k');
  });

  sprite('back_pigeon', 48, 48, PAL_PIGEON, g => {
    // body, seen from behind — broad and rounded
    ell(g, 23.5, 30, 14.5, 13, 'g');
    ell(g, 30.5, 37, 10, 9, 'd');
    ell(g, 17, 24, 4.5, 5, 'l');
    // folded wings from behind
    ell(g, 10.5, 24, 5.6, 10.5, 'g');
    ell(g, 36.5, 24, 5.6, 10.5, 'g');
    spans(g, [[21, 6, 14], [22, 6, 14], [28, 6, 14], [29, 6, 14]], 'm');
    spans(g, [[21, 33, 41], [22, 33, 41], [28, 33, 41], [29, 33, 41]], 'm');
    // fanned tail feathers, spread wide beneath and behind the body (built from symmetric
    // ellipses + mirrored feather-gap lines so it stays even on both sides)
    ell(g, 23.5, 41, 15.5, 5.5, 'd');
    ell(g, 23.5, 40, 12.5, 3.6, 'l');
    for (const x of [15, 19, 28, 32]) spans(g, [[39, x, x], [40, x, x], [41, x, x], [42, x, x]], 'd');
    // nape iridescent patch, small sliver visible at the back of the neck
    ell(g, 23.5, 16, 7, 4, 'n');
    ell(g, 23.5, 13.5, 6, 3, 'v');
    // head, mostly hidden, crown visible
    ell(g, 23.5, 9.5, 7, 6.5, 'g');
    ell(g, 20.5, 7, 3, 2.4, 'l');
    // feet, peeking out beneath the fanned tail — a small shadow halo first so the outline
    // pass can't eat into the foot color (its edges touch a real color, not the background)
    rect(g, 15, 42, 18, 45, 'd'); rect(g, 29, 42, 32, 45, 'd');
    rect(g, 16, 43, 17, 44, 'f'); rect(g, 30, 43, 31, 44, 'f');
    outline(g, 'k');
  });

  // ---------------- overworld frames (16x16) ----------------
  const owPal = PAL_PIGEON;
  function pigeonBody(g, cx) {
    ell(g, cx, 11.5, 4.2, 3.4, 'g');
    ell(g, cx, 12.5, 2.6, 1.6, 'd');
  }
  sprite('ow_pigeon_down_0', 16, 16, owPal, g => {
    pigeonBody(g, 7.5);
    ell(g, 7.5, 6.6, 3, 2.8, 'g');
    ell(g, 7.5, 8.2, 2.6, 1.4, 'v');
    px(g, 6, 6, 'e'); px(g, 8, 6, 'e');
    px(g, 7, 8, 'k');
    px(g, 6, 14, 'f'); px(g, 9, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_pigeon_down_1', 16, 16, owPal, g => {
    pigeonBody(g, 7.5);
    ell(g, 7.5, 5.9, 3, 2.8, 'g');
    ell(g, 7.5, 7.5, 2.6, 1.4, 'v');
    px(g, 6, 5, 'e'); px(g, 8, 5, 'e');
    px(g, 7, 7, 'k');
    px(g, 5, 13, 'f'); px(g, 10, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_pigeon_up_0', 16, 16, owPal, g => {
    pigeonBody(g, 7.5);
    ell(g, 7.5, 6.6, 3, 2.8, 'g');
    ell(g, 7.5, 8.6, 2.4, 1.2, 'n');
    ell(g, 6.2, 6, 1, 0.9, 'l');
    px(g, 6, 14, 'f'); px(g, 9, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_pigeon_up_1', 16, 16, owPal, g => {
    pigeonBody(g, 7.5);
    ell(g, 7.5, 5.9, 3, 2.8, 'g');
    ell(g, 7.5, 7.9, 2.4, 1.2, 'n');
    ell(g, 6.2, 5.3, 1, 0.9, 'l');
    px(g, 5, 13, 'f'); px(g, 10, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_pigeon_left_0', 16, 16, owPal, g => {
    ell(g, 8.4, 11.5, 4.4, 3.4, 'g');
    ell(g, 8.4, 12.6, 2.6, 1.4, 'd');
    ell(g, 6.6, 6.6, 3, 2.6, 'g');
    ell(g, 7.6, 8.2, 1.6, 1.2, 'v');
    px(g, 4, 6, 'k');
    px(g, 3, 7, 'k');
    px(g, 6, 14, 'f'); px(g, 10, 14, 'f');
    outline(g, 'k');
  });
  sprite('ow_pigeon_left_1', 16, 16, owPal, g => {
    ell(g, 8.4, 11.5, 4.4, 3.4, 'g');
    ell(g, 8.4, 12.6, 2.6, 1.4, 'd');
    ell(g, 6.6, 5.9, 3, 2.6, 'g');
    ell(g, 7.6, 7.5, 1.6, 1.2, 'v');
    px(g, 4, 5, 'k');
    px(g, 3, 6, 'k');
    px(g, 5, 13, 'f'); px(g, 11, 14, 'f');
    outline(g, 'k');
  });

  // ---------------- statue_pigeon (16x16) ----------------
  const PAL_STATUE = {
    p: '#c9c9d2:3', // pavement base
    q: '#a3a3ae:2', // pavement grout line
    s: '#8c8c96:2', // pedestal stone main
    t: '#5b5b64:1', // pedestal stone shadow
    u: '#dcdce4:3', // pedestal stone highlight
    b: '#3a3742:1', // pigeon silhouette body, dark stone
    k: '#17141a:0', // outline / plaque groove
  };
  sprite('statue_pigeon', 16, 16, PAL_STATUE, g => {
    // pavement ground, fills the whole tile so it can sit edge-to-edge with plain pavement tiles
    rect(g, 0, 0, 15, 15, 'p');
    spans(g, [[1, 0, 15]], 'q'); // seam near the top, like tile_pavement's grid lines
    spans(g, [[0, 3, 3], [0, 12, 12]], 'q');
    // pedestal: cap, tapered shaft, flared base — stone gray, lit from the top-left
    spans(g, [[9, 4, 11]], 'u');
    spans(g, [[10, 4, 11]], 't');
    rect(g, 5, 11, 10, 13, 's');
    spans(g, [[11, 5, 5], [12, 5, 5], [13, 5, 5]], 'u');
    spans(g, [[11, 10, 10], [12, 10, 10], [13, 10, 10]], 't');
    spans(g, [[14, 3, 12]], 's');
    spans(g, [[14, 3, 4]], 'u');
    spans(g, [[14, 11, 12]], 't');
    spans(g, [[15, 3, 12]], 't');
    // pigeon silhouette perched on top, solid dark stone
    ell(g, 7.5, 6.6, 2.8, 2.5, 'b');   // body
    ell(g, 9.6, 7.6, 1.3, 1, 'b');     // small tail bump, merged into the body
    ell(g, 7, 3.2, 1.8, 1.7, 'b');     // head
    px(g, 5, 3, 'b'); px(g, 4, 3, 'b'); // beak nub
    outlineAgainst(g, 'k', c => c === 'b' || c === 's' || c === 't' || c === 'u', c => c === 'p' || c === 'q');
  });
})();
