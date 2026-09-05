// Trainer battle sprites (48x48): the human "skeptic" opponents you win over with kindness,
// plus the player's own back sprite. Gen 1/2-style trainer-class portraits — gently comic,
// warm, never mean-looking. Big heads, clean 1px silhouette outline, 2-3 tones per material,
// light from the top-left. Built with the same small pixel-grid helpers used in
// sprites_animals_a.js / sprites_extra.js (ellipse/rect fill + outline pass); the final
// window.SPRITES entries are plain {w,h,pal,rows} data like every other sprite file.
(function () {
  const S = window.SPRITES = window.SPRITES || {};

  // ---------- pixel grid helpers (shared pattern across sprite files) ----------
  function grid(w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill('.')); return g; }
  function set(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
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
  function line(g, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      set(g, x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
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

  // =====================================================================
  // BBQ DAD — cheerful dad, apron over a polo, backwards cap, tongs in one
  // hand and a spatula in the other, held out proudly to the sides.
  // =====================================================================
  {
    const pal = {
      k: '#241a12:0', // outline
      s: '#f6c497:3', // skin
      d: '#d59a66:2', // skin shadow
      h: '#6b4326:1', // hair, short brown
      a: '#d94438:1', // cap, red (worn backwards)
      c: '#9c2c24:0', // cap brim / underside
      t: '#3f8f86:2', // polo shirt, teal
      u: '#2c6a63:1', // shirt shadow
      n: '#f2e4c4:3', // apron main, cream
      v: '#cbb98c:2', // apron shadow / neck strap
      p: '#39456b:1', // shorts, denim blue
      q: '#28304d:0', // shorts shadow
      e: '#f2f6f6:3', // shoes, white
      m: '#c7ced3:2', // tongs / spatula metal
      r: '#8b939a:1', // metal shadow
      w: '#fbf6ee:3', // eye sparkle / grin
    };
    sprite('front_bbqdad', 48, 48, pal, g => {
      // legs, planted apart
      rect(g, 16, 38, 21, 42, 'p'); rect(g, 27, 38, 32, 42, 'p');
      rect(g, 16, 42, 21, 45, 'e'); rect(g, 27, 42, 32, 45, 'e');
      spans(g, [[45, 16, 21], [45, 27, 32]], 'r');
      // torso (shirt) + apron bib over it
      rect(g, 15, 23, 33, 39, 't');
      rect(g, 15, 34, 33, 39, 'u');
      spans(g, [[22, 20, 27]], 'v'); // apron neck strap
      rect(g, 18, 25, 30, 39, 'n');
      spans(g, [[35, 18, 30], [36, 18, 30]], 'v'); // apron pocket band near hem
      px(g, 24, 30, 'v'); px(g, 24, 31, 'v'); px(g, 24, 32, 'v'); // apron string knot detail
      // neck
      rect(g, 21, 19, 27, 23, 's');
      // arms bent outward, holding tools up and out
      rect(g, 9, 24, 15, 32, 's'); rect(g, 33, 24, 39, 32, 's');
      ell(g, 12, 32, 3, 3, 'd'); ell(g, 36, 32, 3, 3, 'd');
      // spatula, left hand (paddle + handle)
      rect(g, 3, 23, 9, 27, 'm'); rect(g, 3, 23, 9, 24, 'r');
      line(g, 9, 25, 14, 29, 'r');
      // tongs, right hand (open V, two prongs)
      line(g, 39, 22, 45, 15, 'm'); line(g, 40, 24, 46, 20, 'm');
      rect(g, 37, 23, 40, 26, 'r');
      // head
      ell(g, 24, 12, 8, 8, 's');
      ell(g, 27, 16, 5, 4, 'd');
      // short hair fringe under the backwards cap
      spans(g, [[7, 18, 30]], 'h');
      spans(g, [[18, 17, 18], [18, 30, 31]], 'h');
      // backwards cap: dome over the crown, brim poking out at the back (right side)
      ell(g, 24, 8, 8.5, 6, 'a');
      rect(g, 16, 6, 32, 9, 'a');
      spans(g, [[10, 16, 32]], 'c');
      rect(g, 30, 7, 34, 9, 'c');
      // face — friendly, eyes closed-happy with a big grin
      spans(g, [[14, 20, 22], [14, 26, 28]], 'k');
      px(g, 20, 13, 'w'); px(g, 27, 13, 'w');
      spans(g, [[17, 21, 27]], 'k');
      spans(g, [[18, 22, 26]], 'w');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // GYM BRO — muscly, sleeveless tank top, one arm flexed in a big bicep
  // pose, the other holding a protein shaker up near his chest.
  // =====================================================================
  {
    const pal = {
      k: '#1c1410:0', // outline
      s: '#e8ac78:3', // skin
      d: '#c2835a:2', // skin shadow / muscle definition
      h: '#241c16:0', // hair, buzzed dark
      t: '#e0473a:2', // tank top, red
      u: '#a8342a:1', // tank shadow
      p: '#4a4a54:1', // shorts, gray
      q: '#33333c:0', // shorts shadow
      e: '#f2f6f6:3', // shoes, white
      c: '#dfe6ea:3', // shaker cup body
      l: '#8fa6b4:1', // shaker lid / cap
      w: '#fbf6ee:3', // eye sparkle / grin
    };
    sprite('front_gymbro', 48, 48, pal, g => {
      // legs, wide stance
      rect(g, 15, 37, 21, 42, 'p'); rect(g, 27, 37, 33, 42, 'p');
      rect(g, 15, 42, 21, 45, 'e'); rect(g, 27, 42, 33, 45, 'e');
      spans(g, [[45, 15, 21], [45, 27, 33]], 'q');
      // broad torso, tapered V to the waist
      rect(g, 12, 21, 36, 27, 't');
      rect(g, 15, 27, 33, 38, 't');
      rect(g, 15, 33, 33, 38, 'u');
      spans(g, [[25, 20, 27]], 'u'); // chest shading
      // neck, thick
      rect(g, 20, 18, 28, 22, 's');
      // right arm (viewer's right) — flexed bicep up near the shoulder
      ell(g, 38, 21, 5.5, 6, 's'); // big bicep bump
      ell(g, 40, 18, 3, 3.5, 'd');
      rect(g, 36, 24, 42, 30, 's'); // forearm curling up
      ell(g, 40, 15, 3, 3, 's'); // fist near shoulder
      // left arm — bent, holding shaker up at chest height
      rect(g, 8, 26, 14, 34, 's');
      ell(g, 10, 34, 3, 3, 'd');
      rect(g, 6, 18, 13, 27, 's'); // forearm angled up to the shaker
      // shaker cup
      rect(g, 4, 10, 12, 22, 'c'); rect(g, 4, 17, 12, 22, 'l');
      rect(g, 5, 8, 11, 10, 'l');
      // head
      ell(g, 24, 12, 8, 8, 's');
      ell(g, 27, 16, 5, 4, 'd');
      // buzzed hair cap
      ell(g, 24, 8, 8.2, 5, 'h');
      spans(g, [[10, 17, 31]], 'h');
      // face — determined but friendly, small grin
      spans(g, [[10, 18, 21], [10, 27, 30]], 'k'); // brows (not angry, just focused)
      px(g, 20, 13, 'k'); px(g, 21, 13, 'k'); px(g, 27, 13, 'k'); px(g, 28, 13, 'k');
      px(g, 20, 13, 'w'); px(g, 27, 13, 'w');
      spans(g, [[17, 21, 27]], 'k');
      spans(g, [[18, 22, 26]], 'w');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // CHEESE LOVER — hugging a big wheel of cheese with both arms, dreamy
  // half-closed eyes, rosy cheeks.
  // =====================================================================
  {
    const pal = {
      k: '#231a12:0', // outline
      s: '#f8c8a0:3', // skin
      d: '#d59f78:2', // skin shadow / blush base
      f: '#e8879a:2', // blush
      h: '#7a4a2c:1', // hair, wavy brown
      t: '#8a5aa8:2', // sweater, purple
      u: '#623c7c:1', // sweater shadow
      p: '#3a4560:1', // pants
      e: '#f2f6f6:3', // shoes
      y: '#f6cf5e:3', // cheese main, yellow
      o: '#e0a832:2', // cheese rind / shadow
      n: '#c78418:1', // cheese hole (deep)
      w: '#fbf6ee:3', // eye sparkle
    };
    sprite('front_cheeselover', 48, 48, pal, g => {
      // legs, feet peeking out under the cheese
      rect(g, 16, 40, 21, 44, 'p'); rect(g, 27, 40, 32, 44, 'p');
      rect(g, 16, 44, 21, 46, 'e'); rect(g, 27, 44, 32, 46, 'e');
      // torso (sweater) — mostly hidden by the cheese, shoulders visible
      rect(g, 13, 22, 35, 34, 't');
      rect(g, 13, 29, 35, 40, 'u');
      // arms wrapped around the wheel — visible at the sides, hands clasped in front
      rect(g, 9, 26, 15, 37, 's'); rect(g, 33, 26, 39, 37, 's');
      ell(g, 24, 39, 5, 3, 's'); // clasped hands, front-bottom of the wheel
      // the cheese wheel — big circle hugged against the chest
      ell(g, 24, 30, 15, 14, 'y');
      ell(g, 29, 35, 9, 8, 'o');
      ell(g, 19, 25, 6, 5, 'y');
      spans(g, [[20, 12, 35]], 'o'); // rind band, top rim
      // cheese holes
      ell(g, 19, 27, 1.6, 1.6, 'n'); ell(g, 28, 24, 1.4, 1.4, 'n');
      ell(g, 24, 33, 1.8, 1.8, 'n'); ell(g, 31, 29, 1.4, 1.4, 'n');
      ell(g, 17, 34, 1.4, 1.4, 'n');
      // neck + head peeking above the cheese
      rect(g, 21, 15, 27, 20, 's');
      ell(g, 24, 10, 8, 8, 's');
      ell(g, 27, 13, 5, 4, 'd');
      // wavy hair
      spans(g, [[3, 17, 31]], 'h');
      ell(g, 16, 8, 3, 5, 'h'); ell(g, 32, 8, 3, 5, 'h');
      spans(g, [[7, 15, 17], [7, 31, 33]], 'h');
      // dreamy face — half-closed eyes, blush, small smile
      spans(g, [[10, 19, 22], [10, 26, 29]], 'k');
      spans(g, [[9, 19, 22], [9, 26, 29]], 'w');
      ell(g, 18, 12, 1.6, 1.2, 'f'); ell(g, 30, 12, 1.6, 1.2, 'f');
      px(g, 23, 14, 'k'); px(g, 24, 14, 'k'); px(g, 25, 14, 'k');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // GRANDPA — sweet old man, cane in one hand, suspenders, slightly
  // hunched, kind smile. "My grandpa ate bacon and lived to 90."
  // =====================================================================
  {
    const pal = {
      k: '#241c16:0', // outline
      s: '#f0c8a0:3', // skin (a touch paler/older)
      d: '#cf9e74:2', // skin shadow
      h: '#e6e6e2:3', // hair, white/gray, horseshoe
      g: '#b8b8b2:2', // hair shadow
      t: '#e8dfc8:3', // shirt, cream plaid
      u: '#c2b896:2', // shirt shadow
      a: '#3a3630:0', // suspenders, dark
      p: '#5a4636:1', // trousers, brown
      q: '#3e3024:0', // trousers shadow
      e: '#3a2c20:0', // shoes, brown
      n: '#8a6238:1', // cane wood
      m: '#5e4326:0', // cane shadow / tip
      w: '#fbf6ee:3', // eye sparkle
    };
    sprite('front_grandpa', 48, 48, pal, g => {
      // legs — slightly bent, feet apart, one leaning on the cane side
      rect(g, 17, 37, 22, 42, 'p'); rect(g, 26, 37, 31, 42, 'p');
      rect(g, 17, 42, 22, 45, 'e'); rect(g, 26, 42, 31, 45, 'e');
      spans(g, [[45, 17, 22], [45, 26, 31]], 'm');
      // hunched torso, narrower than the younger trainers
      rect(g, 15, 24, 33, 37, 't');
      rect(g, 15, 31, 33, 37, 'u');
      // suspenders, two straps crossing down from the shoulders
      line(g, 18, 24, 22, 37, 'a'); line(g, 19, 24, 23, 37, 'a');
      line(g, 30, 24, 26, 37, 'a'); line(g, 29, 24, 25, 37, 'a');
      spans(g, [[36, 15, 33]], 'q'); // waistband shadow
      // neck, a little forward-hunched
      rect(g, 20, 20, 27, 25, 's');
      // near arm holds the cane straight down to the ground
      rect(g, 10, 25, 15, 35, 's');
      ell(g, 12, 35, 2.6, 2.6, 'd');
      line(g, 12, 34, 12, 47, 'n');
      ell(g, 12, 33, 2.2, 2, 'n'); // cane handle hook
      spans(g, [[47, 10, 14]], 'm'); // cane foot / base
      // far arm rests at the side
      rect(g, 33, 26, 38, 35, 's');
      ell(g, 35, 35, 2.6, 2.6, 'd');
      // head, leaning slightly forward
      ell(g, 25, 12, 7.5, 7.5, 's');
      ell(g, 28, 15, 4.5, 4, 'd');
      // horseshoe hairline — bald on top, gray sides
      ell(g, 19, 12, 2.6, 4.5, 'h'); ell(g, 31, 12, 2.6, 4.5, 'h');
      spans(g, [[15, 19, 31]], 'h');
      spans(g, [[16, 19, 20], [16, 30, 31]], 'g');
      // kind old-man face — small eyes, smile lines, moustache hint
      px(g, 22, 12, 'k'); px(g, 29, 12, 'k');
      px(g, 22, 12, 'w'); px(g, 29, 12, 'w');
      spans(g, [[15, 20, 22], [15, 28, 30]], 'd'); // smile-crinkle under eyes
      spans(g, [[17, 23, 27]], 'd'); // moustache
      spans(g, [[18, 23, 27]], 'k');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // INFLUENCER — sunglasses, selfie stick with phone held out, ring light
  // glowing behind the shoulder, trendy crop jacket, hip cocked.
  // =====================================================================
  {
    const pal = {
      k: '#221828:0', // outline
      s: '#f6c8a8:3', // skin
      d: '#d69c7c:2', // skin shadow
      h: '#3a2438:1', // hair, dark plum, sleek
      a: '#ff8fc0:1', // hair streak accent
      t: '#5ac8c0:2', // crop jacket, teal
      u: '#3a9a92:1', // jacket shadow
      p: '#2a2438:0', // trousers, near-black
      e: '#f2f6f6:3', // shoes
      g: '#241c28:0', // sunglasses
      l: '#fff6d8:3', // ring light, glowing
      o: '#e8c95a:2', // ring light stand
      c: '#d8dce2:2', // phone body
      w: '#fbf6ee:3', // eye sparkle (visible above the shades)
    };
    sprite('front_influencer', 48, 48, pal, g => {
      // ring light, glowing behind the shoulder (drawn first so the body overlaps it)
      ell(g, 38, 22, 8, 10, 'l');
      ell(g, 38, 22, 5.2, 7, 'o');
      ell(g, 38, 22, 3.4, 5, 'l');
      line(g, 38, 32, 38, 40, 'o'); // stand
      // legs, hip cocked to one side
      rect(g, 17, 38, 22, 42, 'p'); rect(g, 25, 37, 30, 42, 'p');
      rect(g, 17, 42, 22, 45, 'e'); rect(g, 25, 42, 30, 45, 'e');
      // torso, crop jacket, one hip out
      rect(g, 16, 23, 32, 36, 't');
      rect(g, 16, 30, 32, 36, 'u');
      spans(g, [[35, 15, 18]], 't'); // cocked-hip bump
      // neck
      rect(g, 21, 18, 27, 23, 's');
      // near arm holds the selfie stick up and out to the side
      rect(g, 34, 25, 39, 33, 's');
      ell(g, 37, 25, 2.6, 2.6, 'd');
      line(g, 39, 26, 46, 11, 'g');
      rect(g, 43, 6, 47, 15, 'c'); rect(g, 44, 7, 46, 9, 'l'); // phone + screen glow
      // far arm rests on the cocked hip
      rect(g, 9, 27, 14, 34, 's');
      ell(g, 11, 34, 2.6, 2.6, 'd');
      // head
      ell(g, 24, 12, 8, 8, 's');
      ell(g, 27, 16, 5, 4, 'd');
      // sleek hair with a bright streak
      spans(g, [[6, 17, 31]], 'h');
      ell(g, 16, 10, 3, 6, 'h'); ell(g, 32, 10, 3, 6, 'h');
      spans(g, [[8, 18, 20]], 'a');
      // sunglasses
      spans(g, [[12, 18, 22], [12, 26, 30], [13, 18, 22], [13, 26, 30]], 'g');
      spans(g, [[12, 23, 25]], 'g');
      // confident small smile
      spans(g, [[17, 22, 26]], 'k');
      spans(g, [[18, 22, 26]], 'w');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // SCIENTIST — lab coat, round glasses, clipboard held to the side,
  // one skeptical eyebrow raised.
  // =====================================================================
  {
    const pal = {
      k: '#1c1c22:0', // outline
      s: '#f4c8a4:3', // skin
      d: '#d2a078:2', // skin shadow
      h: '#3c3630:1', // hair, dark, neat side part
      t: '#6a7ea0:2', // shirt/tie under the coat
      c: '#f0f2f2:3', // lab coat, white
      f: '#c4cace:2', // coat shadow / fold
      p: '#3a3e4a:1', // trousers
      e: '#232320:0', // shoes
      g: '#2a2a2a:0', // glasses frame
      b: '#a4653a:1', // clipboard board, wood tan
      w: '#f4f4f4:3', // clipboard paper / eye sparkle
      m: '#5a3a26:0', // clipboard clip
    };
    sprite('front_scientist', 48, 48, pal, g => {
      // legs
      rect(g, 17, 38, 22, 42, 'p'); rect(g, 26, 38, 31, 42, 'p');
      rect(g, 17, 42, 22, 45, 'e'); rect(g, 26, 42, 31, 45, 'e');
      // lab coat, flares open slightly at the hem
      rect(g, 14, 23, 34, 38, 'c');
      spans(g, [[37, 12, 16], [37, 32, 36], [38, 11, 15], [38, 33, 37]], 'c'); // flared hem
      rect(g, 21, 23, 27, 38, 't'); // shirt visible down the middle
      spans(g, [[24, 22, 23], [24, 28, 29]], 'f'); // coat lapel fold shadow
      rect(g, 14, 32, 34, 38, 'f');
      rect(g, 21, 32, 27, 38, 't');
      // buttons
      px(g, 24, 27, 'g'); px(g, 24, 31, 'g'); px(g, 24, 35, 'g');
      // neck
      rect(g, 21, 19, 27, 23, 's');
      // near arm holds the clipboard against the hip
      rect(g, 9, 26, 15, 34, 's');
      ell(g, 11, 34, 2.6, 2.6, 'd');
      rect(g, 3, 22, 12, 33, 'b');
      rect(g, 4, 23, 11, 31, 'w');
      spans(g, [[24, 5, 10], [26, 5, 9], [28, 5, 10]], 'g'); // notes scribbles
      rect(g, 6, 20, 9, 23, 'm'); // clip
      // far arm rests at the side
      rect(g, 33, 25, 38, 33, 's');
      ell(g, 35, 33, 2.6, 2.6, 'd');
      // head
      ell(g, 24, 12, 8, 8, 's');
      ell(g, 27, 16, 5, 4, 'd');
      // neat side-part hair
      spans(g, [[6, 17, 31]], 'h');
      spans(g, [[7, 17, 22]], 'h');
      spans(g, [[7, 30, 31], [8, 30, 31]], 'h');
      // round glasses
      spans(g, [[12, 18, 22], [12, 26, 30], [13, 18, 22], [13, 26, 30]], 'k');
      rect(g, 19, 13, 21, 14, 'w'); rect(g, 27, 13, 29, 14, 'w');
      px(g, 20, 13, 'g'); px(g, 28, 13, 'g');
      spans(g, [[12, 23, 25]], 'g');
      // one skeptical raised eyebrow
      spans(g, [[9, 18, 22]], 'k');
      px(g, 26, 10, 'k'); px(g, 27, 10, 'k'); px(g, 28, 11, 'k'); px(g, 29, 11, 'k');
      spans(g, [[18, 22, 26]], 'k');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // CHEF — the gym leader. Tall celebrity-chef type: big poofy toque,
  // twirled moustache, arms folded, dramatic confident stance. Extra
  // detailed: bigger canvas footprint, sash, double-breasted jacket.
  // =====================================================================
  {
    const pal = {
      k: '#1a1512:0', // outline
      s: '#f0c090:3', // skin
      d: '#cc9560:2', // skin shadow
      h: '#241a14:0', // hair / moustache, near-black
      c: '#f7f4ea:3', // toque + jacket, white
      f: '#cfcabb:2', // toque / jacket shadow fold
      x: '#e9e4d4:3', // toque highlight band
      j: '#2a2a2a:0', // jacket buttons
      a: '#c8283a:1', // neckerchief / sash, red
      b: '#8f1c28:0', // sash shadow
      p: '#232323:0', // trousers, black
      e: '#141414:0', // shoes, black
      w: '#fbf6ee:3', // eye sparkle
    };
    sprite('front_chef', 48, 48, pal, g => {
      // wide, confident stance
      rect(g, 15, 39, 22, 43, 'p'); rect(g, 26, 39, 33, 43, 'p');
      rect(g, 15, 43, 22, 46, 'e'); rect(g, 26, 43, 33, 46, 'e');
      spans(g, [[46, 15, 22], [46, 26, 33]], 'k');
      // double-breasted jacket, broad and tall
      rect(g, 12, 22, 36, 40, 'c');
      rect(g, 12, 32, 36, 40, 'f');
      spans(g, [[24, 20, 27], [24, 28, 35]], 'f'); // lapel folds
      // button columns (double-breasted)
      px(g, 19, 26, 'j'); px(g, 19, 30, 'j'); px(g, 19, 34, 'j'); px(g, 19, 38, 'j');
      px(g, 29, 26, 'j'); px(g, 29, 30, 'j'); px(g, 29, 34, 'j'); px(g, 29, 38, 'j');
      // red sash/neckerchief at the collar
      spans(g, [[21, 19, 29], [22, 20, 28]], 'a');
      spans(g, [[22, 23, 25]], 'b');
      // neck
      rect(g, 20, 18, 28, 22, 's');
      // folded arms across the chest — dramatic, confident
      rect(g, 10, 28, 38, 35, 's');
      rect(g, 10, 33, 38, 36, 'd');
      rect(g, 10, 24, 17, 30, 'c'); rect(g, 31, 24, 38, 30, 'c'); // sleeves down to the fold
      rect(g, 10, 28, 17, 30, 'f'); rect(g, 31, 28, 38, 30, 'f');
      // head, held high
      ell(g, 24, 14, 8, 8, 's');
      ell(g, 27, 18, 5, 4, 'd');
      // twirled moustache
      spans(g, [[19, 15, 20], [19, 28, 33]], 'h');
      px(g, 14, 18, 'h'); px(g, 34, 18, 'h'); // curled tips
      // sideburns
      spans(g, [[10, 16, 16], [11, 16, 16], [10, 32, 32], [11, 32, 32]], 'h');
      // the toque — tall, poofy chef hat, extends near the top of the canvas
      rect(g, 17, 8, 31, 12, 'c'); // hatband
      spans(g, [[8, 17, 31]], 'f');
      ell(g, 20, 5, 4, 4.5, 'c'); ell(g, 24, 2, 4.4, 5, 'c'); ell(g, 28, 5, 4, 4.5, 'c');
      ell(g, 22, 3.5, 1.6, 2, 'x'); ell(g, 26, 3.5, 1.6, 2, 'x');
      // dramatic face — confident half-smile, sharp brow
      spans(g, [[13, 19, 22], [13, 27, 30]], 'k');
      px(g, 20, 15, 'k'); px(g, 21, 15, 'k'); px(g, 28, 15, 'k'); px(g, 29, 15, 'k');
      px(g, 20, 15, 'w'); px(g, 28, 15, 'w');
      spans(g, [[19, 22, 27]], 'k');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // RIVAL — friendly, purple hoodie, laptop held open in front, big grin.
  // =====================================================================
  {
    const pal = {
      k: '#201a2a:0', // outline
      s: '#f6c8a0:3', // skin
      d: '#d4996e:2', // skin shadow
      h: '#3a2c1e:1', // hair, messy brown
      t: '#7a4ec2:2', // hoodie, purple
      u: '#563690:1', // hoodie shadow / hood
      x: '#9a72dc:3', // hoodie drawstring highlight
      p: '#2a2a38:0', // trousers
      e: '#f2f6f6:3', // shoes
      c: '#c4cad0:2', // laptop lid/base
      l: '#bfe6f2:3', // laptop screen glow
      w: '#fbf6ee:3', // eye sparkle
    };
    sprite('front_rival', 48, 48, pal, g => {
      // legs
      rect(g, 17, 38, 22, 42, 'p'); rect(g, 26, 38, 31, 42, 'p');
      rect(g, 17, 42, 22, 45, 'e'); rect(g, 26, 42, 31, 45, 'e');
      // hood resting on the shoulders, behind the torso
      ell(g, 24, 22, 12, 6, 'u');
      // torso, hoodie with kangaroo pocket
      rect(g, 14, 22, 34, 39, 't');
      rect(g, 14, 31, 34, 39, 'u');
      rect(g, 18, 33, 30, 38, 'u');
      spans(g, [[33, 20, 28]], 'x'); // pocket highlight seam
      // drawstrings
      line(g, 21, 24, 21, 29, 'x'); line(g, 27, 24, 27, 29, 'x');
      // neck
      rect(g, 21, 19, 27, 23, 's');
      // near arm holds the laptop base
      rect(g, 9, 27, 14, 35, 's');
      ell(g, 11, 35, 2.6, 2.6, 'd');
      // laptop, open, screen glowing, held up in front of the torso
      rect(g, 12, 26, 30, 33, 'c'); rect(g, 13, 27, 29, 32, 'l');
      rect(g, 12, 33, 30, 36, 'c');
      // far arm rests on the other side of the laptop
      rect(g, 33, 27, 38, 35, 's');
      ell(g, 35, 35, 2.6, 2.6, 'd');
      // head
      ell(g, 24, 12, 8, 8, 's');
      ell(g, 27, 16, 5, 4, 'd');
      // messy hair
      spans(g, [[5, 18, 30]], 'h');
      spans(g, [[6, 16, 18], [6, 30, 32]], 'h');
      px(g, 15, 8, 'h'); px(g, 33, 8, 'h'); px(g, 24, 4, 'h');
      // big friendly grin
      spans(g, [[10, 18, 21], [10, 27, 30]], 'k');
      px(g, 19, 13, 'w'); px(g, 28, 13, 'w');
      spans(g, [[16, 20, 28]], 'k');
      spans(g, [[17, 21, 27]], 'w');
      outline(g, 'k');
    });
  }

  // =====================================================================
  // BACK_HERO — the player, seen from behind. Red cap, dark hair, green
  // hoodie, one arm raised pointing forward. Cropped at the bottom edge
  // like a Gen 1 back sprite: fills more of the canvas, no feet shown.
  // =====================================================================
  {
    const pal = {
      k: '#1a1610:0', // outline
      s: '#f0c090:3', // skin (ear/neck sliver)
      h: '#2c2018:1', // hair, dark, peeking under the cap
      a: '#d0362c:1', // cap, red
      c: '#8c241c:0', // cap shadow / back seam
      t: '#4a9a4a:2', // hoodie, green
      u: '#347034:1', // hoodie shadow
      x: '#78c878:3', // hoodie highlight (hood fold)
      p: '#3a3a44:1', // sleeve cuff / waistband
    };
    sprite('back_hero', 48, 48, pal, g => {
      // torso fills the lower two-thirds, cropped by the canvas edge (no legs/feet)
      rect(g, 12, 24, 36, 47, 't');
      rect(g, 12, 24, 36, 29, 'u'); // shoulder shading across the back
      rect(g, 12, 40, 36, 47, 'u'); // hem shading
      // hood, folded down across the upper back
      ell(g, 24, 24, 11, 5, 'x');
      spans(g, [[26, 15, 33]], 'u');
      // raised arm, bent at the elbow, pointing out to the side/forward
      rect(g, 34, 26, 40, 33, 't');
      rect(g, 37, 16, 42, 27, 't'); // upper arm raised
      rect(g, 37, 16, 42, 19, 'u');
      ell(g, 39, 15, 3, 3, 't'); // shoulder cap
      rect(g, 40, 12, 44, 17, 's'); // forearm/hand pointing forward, sleeve rolled a touch
      spans(g, [[17, 40, 44]], 'p'); // cuff
      // other arm, relaxed at the side
      rect(g, 10, 27, 15, 38, 't');
      rect(g, 10, 34, 15, 38, 'u');
      spans(g, [[38, 10, 15]], 'p');
      // neck + back of the head
      rect(g, 20, 16, 28, 21, 's');
      ell(g, 24, 11, 8, 8, 'h');
      // cap, worn forward (bill not visible from behind), back adjuster strap
      ell(g, 24, 7, 8.4, 6, 'a');
      rect(g, 16, 6, 32, 10, 'a');
      spans(g, [[13, 20, 28]], 'c'); // back seam / adjuster
      spans(g, [[18, 20, 28]], 'h'); // hair peeking out under the cap
      outline(g, 'k');
    });
  }
})();
