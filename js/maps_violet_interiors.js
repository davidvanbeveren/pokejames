// Violet City interiors — Violet Studios, VH HQ, Sanctuary Center, Vegan Mart, Outreach Gym,
// Violet Hall (the party venue), and the two houses. All warp back to the door they came from.
(function () {
  const M = window.MAPS = window.MAPS || {};

  // ---- tiny room-builder helpers (mirrors the grid/rect/put pattern in maps_violet.js) ----
  function room(w, h, fill) {
    const g = Array.from({ length: h }, () => Array(w).fill(fill || 'o'));
    return {
      rect(x, y, rw, rh, ch) { for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) g[yy][xx] = ch; },
      put(x, y, ch) { g[y][x] = ch; },
      rows() { return g.map(r => r.join('')); },
    };
  }

  // =========================================================================
  // VIOLET STUDIOS — door (8,5) on 'violet', mat (7,9)
  // =========================================================================
  {
    const r = room(14, 10, 'p'); // purple carpet floor
    r.rect(0, 0, 14, 1, 'w');
    r.put(2, 0, 'x'); r.put(5, 0, 'y'); r.put(6, 0, 'y'); r.put(9, 0, 'x');
    r.put(1, 1, 'q'); r.put(12, 1, 'q');
    r.put(2, 2, 'e'); r.put(3, 2, 'P');
    r.put(6, 2, 'e'); r.put(7, 2, 'P');
    r.put(10, 2, 'e'); r.put(11, 2, 'P');
    r.put(7, 9, 'm');

    M.violet_studios = {
      name: 'VIOLET STUDIOS', era: 2, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 7, y: 9, map: 'violet', tx: 8, ty: 6, dir: 'down' },
        { type: 'npc', team: 'jennifer', id: 'vs_jennifer', x: 10, y: 6, dir: 'down', move: 'wander', range: 2 },
        { type: 'npc', id: 'vs_reception', sprite: 'woman', x: 7, y: 6, dir: 'down', move: 'static',
          dialog: ['Welcome to VIOLET STUDIOS!', 'Creativity for a kinder world. Take a sticker.'] },
        { type: 'interact', x: 2, y: 2, text: ['A moodboard. Every color on it is purple.'] },
        { type: 'interact', x: 6, y: 2, text: ['A sketch of a pigeon mascot. Revision four. It keeps getting cuter.'] },
        { type: 'interact', x: 10, y: 2, text: ['A sticky note on the monitor: "Ship it purple or don\'t ship it."'] },
      ],
    };
  }

  // =========================================================================
  // VH HQ — door (16,5) on 'violet', mat (6,9)
  // =========================================================================
  {
    const r = room(12, 10, 'o'); // wooden floor
    r.rect(0, 0, 12, 1, 'w');
    r.put(2, 0, 'x'); r.put(5, 0, 'v'); r.put(6, 0, 'v'); r.put(9, 0, 'x');
    r.put(1, 1, 'q'); r.put(10, 1, 'q');
    r.put(2, 2, 'e'); r.put(3, 2, 'P');
    r.put(7, 2, 'e'); r.put(8, 2, 'P');
    r.put(1, 3, 'h'); r.put(10, 3, 'H');
    r.put(6, 9, 'm');

    M.vh_hq = {
      name: 'VH HQ', era: 2, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 6, y: 9, map: 'violet', tx: 16, ty: 6, dir: 'down' },
        { type: 'npc', team: 'david', id: 'hq_david', x: 8, y: 6, dir: 'down', move: 'wander', range: 2, if: 'rival3' },
        { type: 'npc', id: 'hq_jim', x: 4, y: 6, sprite: 'man', pal: { t: '#5878e0:2', h: '#8a5a30:1' }, dir: 'down', move: 'wander', range: 2,
          dialog: G => ['JIM: Happy birthday ' + G.state.name + '!'] },
        { type: 'trigger', x: 4, y: 8, w: 5, h: 1, script: 'rival_vh' },
        { type: 'interact', x: 1, y: 3, text: ['A whiteboard: GRANTI, FLOCKWORK, FAST. Someone drew a pigeon in the corner.'] },
        { type: 'interact', x: 10, y: 3, text: ['A server rack hums. It is running 15 projects and one birthday game.'] },
      ],
    };
  }

  // =========================================================================
  // SANCTUARY CENTER — door (8,25) on 'violet', mat (6,7)
  // =========================================================================
  {
    const r = room(12, 8, 'o');
    r.rect(0, 0, 12, 1, 'w');
    r.put(2, 0, 'x'); r.put(6, 0, 'v'); r.put(9, 0, 'x');
    r.put(1, 1, 'P'); r.put(10, 1, 'q');
    r.put(7, 2, 'H');
    r.rect(0, 3, 12, 1, 'k'); // counter, gap-free
    r.put(2, 5, 's'); r.put(9, 5, 'q');
    r.put(6, 7, 'm');

    M.violet_center = {
      name: 'SANCTUARY CENTER', era: 2, music: 'center', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 6, y: 7, map: 'violet', tx: 8, ty: 26, dir: 'down' },
        { type: 'npc', id: 'violet_nurse', sprite: 'nurse', x: 6, y: 2, dir: 'down', move: 'static', script: 'center' },
        { type: 'npc', id: 'violet_center_v1', sprite: 'girl', x: 3, y: 5, dir: 'left', move: 'static',
          dialog: ['My CHICK overdid it at PIGEON PLAZA. Too much zoomies.', 'The nurse says she\'ll be back to full fluff by tonight.'] },
        { type: 'npc', id: 'violet_center_v2', sprite: 'kid', x: 9, y: 4, dir: 'down', move: 'wander', range: 1,
          dialog: ['My PIGLET got scared of a skateboard. Very brave otherwise.'] },
      ],
    };
  }

  // =========================================================================
  // VEGAN MART — door (16,25) on 'violet', mat (4,7)
  // =========================================================================
  {
    const r = room(10, 8, 'o');
    r.rect(0, 0, 10, 1, 'w');
    r.put(2, 0, 'x'); r.put(7, 0, 'x');
    r.rect(1, 1, 8, 1, 'h'); // shelves along the top wall
    r.rect(0, 3, 10, 1, 'k'); // counter, gap-free
    r.put(1, 5, 'h'); r.put(8, 5, 'h');
    r.put(4, 7, 'm');

    M.violet_mart = {
      name: 'VEGAN MART', era: 2, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 4, y: 7, map: 'violet', tx: 16, ty: 26, dir: 'down' },
        { type: 'npc', id: 'violet_clerk', sprite: 'clerk', x: 5, y: 2, dir: 'down', move: 'static', script: 'mart',
          stock: ['NOOCH', 'SUPER NOOCH', 'FULL NOOCH', 'B12 SHOT', 'COOKIE', 'CARROT', 'SEEDS', 'APPLE', 'HAY'] },
        { type: 'npc', id: 'violet_mart_shopper', sprite: 'man', x: 7, y: 4, dir: 'down', move: 'static',
          dialog: ['I stock up on SEEDS for the pigeons in the plaza.', 'The COOKIE here is shockingly good for something cruelty-free.'] },
      ],
    };
  }

  // =========================================================================
  // OUTREACH GYM — door (25,25) on 'violet', mat (6,11)
  // =========================================================================
  {
    const r = room(12, 12, 'O'); // tiled floor
    r.rect(0, 0, 12, 1, 'w');
    r.put(2, 0, 'x'); r.put(9, 0, 'x');
    r.put(1, 3, 'r'); // retired golden spatula
    r.put(4, 0, 'h'); r.put(7, 0, 'h'); // trophy shelves
    for (const [px, py] of [[0, 1], [11, 1], [0, 10], [11, 10]]) r.put(px, py, 'q'); // plants in the corners
    for (let y = 3; y <= 10; y++) for (let x = 5; x <= 7; x++) r.put(x, y, 'u'); // red carpet aisle to the leader
    r.put(6, 11, 'm');

    M.violet_gym = {
      name: 'OUTREACH GYM', era: 2, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 6, y: 11, map: 'violet', tx: 25, ty: 26, dir: 'down' },
        { type: 'interact', x: 1, y: 3, text: ['A golden spatula. Retired.'] },
        { type: 'npc', id: 'gym_cheese', sprite: 'woman', x: 4, y: 9, dir: 'right', move: 'static',
          trainer: { class: 'CHEESE_LOVER', name: 'CHEESE FAN MIA', level: 16, sight: 3,
            intro: ['MIA: Stop right there!', 'MIA: I could NEVER give up cheese. Fight me... gently.'],
            after: ['MIA: Wait... cashew brie is THAT good?', 'MIA: Fine. The CHEF is up ahead. Good luck.'] } },
        { type: 'npc', id: 'gym_sci', sprite: 'prof', x: 8, y: 5, dir: 'left', move: 'static',
          trainer: { class: 'SCIENTIST', name: 'SCIENTIST DR. B12', level: 18, sight: 3,
            intro: ['DR. B12: Halt. State your hypothesis.', 'DR. B12: I require peer-reviewed proof that kindness scales.'],
            after: ['DR. B12: The data is... undeniable.', 'DR. B12: The CHEF awaits. He is far less evidence-based than I am.'] } },
        { type: 'npc', id: 'gym_leader', sprite: 'chef', x: 6, y: 2, dir: 'down', move: 'static',
          trainer: { class: 'CHEF', name: 'CHEF', level: 22, sight: 0, music: 'gym', victoryMusic: 'gymvictory',
            requires: 'gym_sci', requiresLines: ['CHEF: You haven\'t even convinced DR. B12 yet.', 'CHEF: Come back when the SCIENCE is on your side.'],
            intro: ['CHEF: So. YOU are the one feeding my ingredients.', 'CHEF: In MY city? Prove that kindness has FLAVOR!'],
            after: ['CHEF: Plant-based. Chef\'s kiss. My new menu launches tonight.'], onWin: 'gym_win' } },
      ],
    };
  }

  // =========================================================================
  // VIOLET HALL — door (33,25) on 'violet', mat (8,11) — the party venue
  // =========================================================================
  {
    const r = room(16, 12, 'o');
    r.rect(0, 0, 16, 1, 'w'); // wall band
    r.put(2, 0, 'x'); r.put(13, 0, 'x');
    r.put(5, 0, '<'); r.put(6, 0, '^'); r.put(7, 0, '^'); r.put(8, 0, '^'); r.put(9, 0, '^'); r.put(10, 0, '>'); // banner
    r.put(2, 1, 'j'); r.put(13, 1, 'j'); // balloons
    r.rect(4, 4, 8, 7, 'u'); // festive rug under the gathering
    r.rect(4, 2, 8, 1, 'a'); r.put(8, 2, 'K'); // table + cake, centered
    r.put(1, 4, 'g'); r.put(14, 4, 'g'); r.put(1, 9, 'g'); r.put(14, 9, 'g'); // presents
    r.put(8, 11, 'm');

    // team members ringed around the room, well clear of the walk-in column (x=8, y=7..10)
    const guests = [
      ['kate', 5, 3, 'down'], ['david', 11, 3, 'down'],
      ['gabriele', 3, 4, 'right'], ['michael', 13, 4, 'left'], ['chloe', 6, 4, 'down'], ['dee', 10, 4, 'down'],
      ['vikram', 2, 5, 'right'], ['tobias', 14, 5, 'left'],
      ['jeremy', 2, 6, 'right'], ['steven', 14, 6, 'left'],
      ['richie', 3, 7, 'right'], ['mike', 13, 7, 'left'],
      ['aaron', 3, 8, 'right'], ['ximena', 13, 8, 'left'],
      ['elizabeth', 4, 9, 'up'], ['thomas', 12, 9, 'up'], ['jennifer', 6, 9, 'up'], ['lauren', 10, 9, 'up'],
      ['luuly', 5, 10, 'up'], ['lucas', 11, 10, 'up'], ['casey', 7, 10, 'up'],
    ];
    const guestObjects = guests.map(([team, x, y, dir]) => ({ type: 'npc', team, id: 'hall_' + team, x, y, dir, move: 'look' }));

    M.violet_hall = {
      name: 'VIOLET HALL', era: 2, noGreet: true, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 8, y: 11, map: 'violet', tx: 33, ty: 26, dir: 'down' },
        { type: 'trigger', x: 8, y: 9, w: 1, h: 1, script: 'party_enter' },
        { type: 'interact', x: 1, y: 4, text: G => ['A present. The tag reads: "To ' + G.state.name + ', from all of us."'] },
        { type: 'interact', x: 14, y: 9, text: ['A present that giggles slightly. It might contain a chick.'] },
        { type: 'interact', x: 8, y: 2, text: G => ['Wow, the cake is vegan!', 'Wait... ' + G.state.rival + ' already took the first slice...'] },
        ...guestObjects,
        { type: 'npc', id: 'hall_bunny', sprite: 'ow_bunny', animal: true, x: 5, y: 6, dir: 'down', move: 'wander', range: 1, dialog: ['Binky! (Wearing a tiny party hat.)'] },
        { type: 'npc', id: 'hall_piglet', sprite: 'ow_piglet', animal: true, x: 10, y: 6, dir: 'down', move: 'wander', range: 1, dialog: ['Oink! (It has a party hat.)'] },
        { type: 'npc', id: 'hall_chick', sprite: 'ow_chick', animal: true, x: 9, y: 5, dir: 'down', move: 'wander', range: 1, dialog: ['Peep! (Confetti in its feathers.)'] },
      ],
    };
  }

  // =========================================================================
  // HOUSE 1 (swimmer) — door (8,31) on 'violet', mat (4,7)
  // =========================================================================
  {
    const r = room(8, 8, 'o');
    r.rect(0, 0, 8, 1, 'w'); r.put(2, 0, 'x'); r.put(5, 0, 'x');
    r.put(1, 1, 'h'); r.put(6, 1, 'h');
    r.put(0, 2, 'B');
    r.put(0, 3, 'E'); r.put(2, 3, 'c'); r.put(3, 3, 'a'); r.put(4, 3, 'a'); r.put(5, 3, 'd');
    r.put(1, 5, 't'); r.put(6, 5, 'h');
    r.put(4, 7, 'm');

    M.violet_house1 = {
      name: "SWIMMER'S HOUSE", era: 2, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 4, y: 7, map: 'violet', tx: 8, ty: 32, dir: 'down' },
        { type: 'npc', team: 'swimmer', id: 'vh1_swimmer', x: 5, y: 4, dir: 'down', move: 'static',
          dialog: ['SWIMMER: The pool at AVA is heated!', 'SWIMMER: Jump in, just do it, it\'ll be fine!'] },
      ],
    };
  }

  // =========================================================================
  // HOUSE 2 (goose) — door (15,31) on 'violet', mat (4,7)
  // =========================================================================
  {
    const r = room(8, 8, 'o');
    r.rect(0, 0, 8, 1, 'w'); r.put(2, 0, 'x'); r.put(5, 0, 'x');
    r.put(1, 1, 'h'); r.put(6, 1, 'h');
    r.put(0, 2, 'B');
    r.put(0, 3, 'E'); r.put(2, 3, 'c'); r.put(3, 3, 'a'); r.put(4, 3, 'a'); r.put(5, 3, 'd');
    r.put(1, 5, 't'); r.put(6, 5, 'h');
    r.put(4, 7, 'm');

    M.violet_house2 = {
      name: 'GOOSE HOUSE', era: 2, music: 'town3', indoor: true, border: 'void',
      rows: r.rows(),
      objects: [
        { type: 'warp', x: 4, y: 7, map: 'violet', tx: 15, ty: 32, dir: 'down' },
        { type: 'npc', id: 'vh2_oldman', sprite: 'oldman', x: 5, y: 4, dir: 'down', move: 'static',
          dialog: ['The GOOSE runs this house. I just live here.', 'She honks, I comply. Simple system.'] },
        { type: 'npc', id: 'vh2_goose', sprite: 'ow_goose', animal: true, x: 3, y: 6, dir: 'down', move: 'wander', range: 1,
          dialog: ['HONK! (She is, in fact, always right.)'] },
      ],
    };
  }
})();
