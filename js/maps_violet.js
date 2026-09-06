// Violet City — the GBA-era "even better" city. Purple-themed HQ of Violet Studios,
// paved roads, a park with tall grass in the north-east, and the party venue: Violet Hall.
(function () {
  const M = window.MAPS = window.MAPS || {};
  const W = 40, H = 36;

  // ---- roof color legend chars ----
  // This map is outdoor-only, so it is safe to repurpose default legend chars that are only ever
  // used by INDOOR tiles (floor, rug, wall_in, poster, banner, bed, pc, tv, table, chair, shelf...):
  // none of those tiles are needed here. Red keeps the default '1'-'6' chars (house1).
  const ROOF = {
    purple: { l: 'I', m: 'J', r: 'N', l2: 'Y', m2: 'Z', r2: 'z' }, // Violet Studios HQ
    green: { l: '7', m: '8', r: '9', l2: '!', m2: '@', r2: '$' }, // VH HQ
    pink: { l: '&', m: '(', r: ')', l2: '*', m2: '+', r2: '?' }, // Sanctuary Center
    blue: { l: '{', m: '}', r: 'o', l2: 'O', m2: 'u', r2: 'p' }, // Vegan Mart
    gray: { l: 'w', m: 'x', r: 'v', l2: 'y', m2: '<', r2: '^' }, // Outreach Gym
    yellow: { l: '>', m: 'B', r: 'E', l2: 'P', m2: 't', r2: 'a' }, // Violet Hall
    teal: { l: 'c', m: 'd', r: 'h' }, // house2 (small, roof row only)
  };
  const legend = {};
  for (const color in ROOF) {
    const c = ROOF[color];
    legend[c.l] = 'roof_l:' + color; legend[c.m] = 'roof_m:' + color; legend[c.r] = 'roof_r:' + color;
    if (c.l2) { legend[c.l2] = 'roof2_l:' + color; legend[c.m2] = 'roof2_m:' + color; legend[c.r2] = 'roof2_r:' + color; }
  }

  // ---- grid helpers ----
  const grid = Array.from({ length: H }, () => Array(W).fill('.'));
  const rect = (x, y, w, h, ch) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) grid[yy][xx] = ch; };
  const put = (x, y, ch) => { grid[y][x] = ch; };

  // 6-wide x 3-tall building. signCh null => plain window row (Violet Hall).
  function tallBuilding(bx, by, color, signCh) {
    const c = ROOF[color];
    put(bx, by, c.l); for (let i = 1; i < 5; i++) put(bx + i, by, c.m); put(bx + 5, by, c.r);
    put(bx, by + 1, c.l2); for (let i = 1; i < 5; i++) put(bx + i, by + 1, c.m2); put(bx + 5, by + 1, c.r2);
    put(bx, by + 2, '['); put(bx + 1, by + 2, 'X'); put(bx + 2, by + 2, signCh || 'X'); put(bx + 3, by + 2, 'D'); put(bx + 4, by + 2, 'X'); put(bx + 5, by + 2, ']');
    return { door: { x: bx + 3, y: by + 2 }, sign: { x: bx + 2, y: by + 2 } };
  }
  // 4-wide x 2-tall house.
  function smallHouse(bx, by, color) {
    const c = color === 'red' ? { l: '1', m: '2', r: '3' } : ROOF[color];
    put(bx, by, c.l); put(bx + 1, by, c.m); put(bx + 2, by, c.m); put(bx + 3, by, c.r);
    put(bx, by + 1, '['); put(bx + 1, by + 1, 'X'); put(bx + 2, by + 1, 'D'); put(bx + 3, by + 1, ']');
    return { door: { x: bx + 2, y: by + 1 } };
  }

  // ---- terrain ----
  rect(0, 0, W, 2, 'T'); rect(0, H - 1, W, 1, 'T'); // north border (2 deep), south border row
  rect(0, 0, 2, H, 'T'); rect(W - 2, 0, 2, H, 'T'); // west/east border (2 deep)
  put(19, H - 1, '#'); put(20, H - 1, '#'); // south opening to route2

  // roads: North St, South St, main Avenue, town-square Plaza
  rect(3, 9, 34, 2, '#'); // North St, y9-10
  rect(3, 28, 34, 2, '#'); // South St, y28-29
  rect(19, 9, 2, 27, '#'); // Avenue, x19-20, y9-35
  rect(14, 14, 12, 6, '#'); // Plaza, x14-25, y14-19

  // ---- park (north-east): pond + tall grass patches ----
  rect(28, 4, 6, 1, '%'); rect(28, 5, 6, 3, '~'); // pond, x28-33, y4-7
  // irregular tall-grass patches (north region, above the plaza)
  rect(23, 9, 4, 4, ','); put(22, 10, ','); put(22, 11, ','); put(26, 12, ','); // patch A
  rect(30, 9, 6, 4, ','); put(36, 10, ','); put(29, 11, ','); // patch B (wraps the pond)
  // patch C (east of the plaza, same band, where the scientist lurks)
  rect(27, 15, 7, 4, ','); put(26, 16, ','); put(34, 17, ',');
  // clearings inside the grass so it reads as irregular, not a solid block
  put(24, 10, '.'); put(25, 11, '.'); put(32, 11, '.'); put(33, 10, '.'); put(30, 17, '.'); put(31, 18, '.');
  // a little decorative greenery
  put(21, 4, 'b'); put(36, 3, 'b'); put(27, 8, 'f'); put(35, 8, 'f'); put(23, 6, 'T'); put(24, 6, 'T'); put(34, 4, 'T');

  // ---- plaza (Pigeon Plaza) ----
  put(22, 17, 'r'); // pigeon statue
  put(23, 17, 'S'); // plaza sign
  put(14, 14, 'L'); put(25, 14, 'L'); put(14, 19, 'L'); put(25, 19, 'L'); // lamps at plaza corners
  put(16, 19, 'n'); put(23, 14, 'n'); // benches
  put(18, 14, 'F'); put(21, 19, 'F'); // flowerbeds

  // ---- buildings ----
  const studio = tallBuilding(5, 3, 'purple', 'U');
  const vh = tallBuilding(13, 3, 'green', 'V');
  const center = tallBuilding(5, 23, 'pink', 'C');
  const mart = tallBuilding(13, 23, 'blue', 'M');
  const gym = tallBuilding(22, 23, 'gray', 'G');
  const hall = tallBuilding(30, 23, 'yellow', null);
  const house1 = smallHouse(6, 30, 'red');
  const house2 = smallHouse(13, 30, 'teal');

  // ---- yard decoration (west + south flavor, kept clear of doors/paths) ----
  put(3, 7, 'f'); put(20, 7, 'f'); put(3, 26, 'f'); put(20, 26, 'f');
  put(11, 8, 'F'); put(11, 27, 'F');
  put(9, 32, 'b'); put(17, 32, 'b');
  put(21, 32, 'S'); // welcome sign near the south approach
  put(10, 7, 'S'); put(17, 7, 'S'); // Violet Studios / VH HQ signs
  put(24, 21, 'S'); put(32, 21, 'S'); // Outreach Gym / Violet Hall signs

  const rows = grid.map(r => r.join(''));

  M.violet = {
    name: 'VIOLET CITY', era: 2, music: 'town3', border: 'tree', indoor: false,
    legend,
    rows,
    exits: [{ edge: 'south', from: 19, to: 20, map: 'route2', offset: -10 }],
    encounters: 'violet_park',
    objects: [
      // ---- building warps ----
      { type: 'warp', x: studio.door.x, y: studio.door.y, map: 'violet_studios', tx: 7, ty: 9, dir: 'up' },
      { type: 'warp', x: vh.door.x, y: vh.door.y, map: 'vh_hq', tx: 6, ty: 9, dir: 'up' },
      { type: 'warp', x: center.door.x, y: center.door.y, map: 'violet_center', tx: 6, ty: 7, dir: 'up' },
      { type: 'warp', x: mart.door.x, y: mart.door.y, map: 'violet_mart', tx: 4, ty: 7, dir: 'up' },
      { type: 'warp', x: gym.door.x, y: gym.door.y, map: 'violet_gym', tx: 6, ty: 11, dir: 'up' },
      { type: 'warp', x: hall.door.x, y: hall.door.y, map: 'violet_hall', tx: 8, ty: 11, dir: 'up' },
      { type: 'trigger', x: hall.door.x, y: hall.door.y + 1, w: 1, h: 1, script: 'hall_door' },
      // the doorman blocks the hall until you've seen both headquarters, then steps aside
      { type: 'npc', id: 'hall_doorman', x: hall.door.x, y: hall.door.y + 1, sprite: 'man', pal: { t: '#303040:1', h: '#8a5a30:1' }, dir: 'down', move: 'static', unless: 'hq_tour_done',
        dialog: ['Have you seen the VH and VIOLET headquarters? No?', 'Then you can\'t come in here yet!'] },
      { type: 'npc', id: 'hall_doorman_ok', x: hall.door.x + 1, y: hall.door.y + 1, sprite: 'man', pal: { t: '#303040:1', h: '#8a5a30:1' }, dir: 'left', move: 'static', if: 'hq_tour_done',
        dialog: ['Pretty cool, right? You can go in now!', 'Sorry, I was grumpy because my PIGEON pooped on the couch again!'] },
      { type: 'warp', x: house1.door.x, y: house1.door.y, map: 'violet_house1', tx: 4, ty: 7, dir: 'up' },
      { type: 'warp', x: house2.door.x, y: house2.door.y, map: 'violet_house2', tx: 4, ty: 7, dir: 'up' },

      // ---- signs ----
      { type: 'sign', x: 23, y: 17, text: ['PIGEON PLAZA', 'In honor of the most underrated bird.'] },
      { type: 'sign', x: 10, y: 7, text: ['VIOLET STUDIOS', 'Creativity for a kinder world.'] },
      { type: 'sign', x: 17, y: 7, text: ['VEGAN HACKTIVISTS HQ', 'Free tech for the animal protection movement.'] },
      { type: 'sign', x: 24, y: 21, text: ['OUTREACH GYM', 'LEADER: CHEF. Convince him with kindness.'] },
      { type: 'sign', x: 32, y: 21, text: ['VIOLET HALL', 'Closed for a private event. (Bring your BADGE.)'] },
      { type: 'sign', x: 21, y: 32, text: ['VIOLET CITY', 'Everything looks even better from here.'] },

      // ---- pigeon statue ----
      { type: 'interact', x: 22, y: 17, script: 'pigeon_statue' },

      // ---- team members, scattered around the city rather than clustered on the plaza.
      // Every spot is within a couple of tiles of a road, so you pass them as you explore.
      { type: 'npc', team: 'kate', x: 7, y: 7, dir: 'down', move: 'wander', range: 2 },      // outside VIOLET STUDIOS
      { type: 'npc', team: 'thomas', x: 21, y: 12, dir: 'down', move: 'wander', range: 2 },  // north, by the park
      { type: 'npc', team: 'chloe', x: 12, y: 20, dir: 'right', move: 'wander', range: 2 },  // west of the plaza
      { type: 'npc', team: 'luuly', x: 27, y: 26, dir: 'left', move: 'wander', range: 2 },   // south-east, near the gym
      { type: 'npc', team: 'lucas', x: 37, y: 7, dir: 'down', move: 'wander', range: 2 },    // east, by the pond
      { type: 'npc', team: 'dee', x: 2, y: 31, dir: 'right', move: 'wander', range: 2 },     // south-west, near the centre
      { type: 'npc', team: 'pigeonfan', x: 21, y: 18, dir: 'up', move: 'wander' },           // stays at the statue

      // ---- flavor NPCs ----
      { type: 'npc', id: 'violet_girl', x: 18, y: 30, sprite: 'girl', pal: { t: '#e070a0' }, dir: 'down', move: 'wander', range: 2,
        dialog: ['Hold B to RUN! Running shoes are so GBA.'] },
      { type: 'npc', id: 'violet_man', x: 23, y: 22, sprite: 'man', pal: { t: '#606068' }, dir: 'down', move: 'wander', range: 2,
        dialog: ['The GYM LEADER is a celebrity CHEF. He has never met a vegetable he respected. Yet.'] },
      { type: 'npc', id: 'violet_pigeon1', x: 16, y: 17, sprite: 'ow_pigeon', animal: true, dir: 'down', move: 'wander', range: 2, dialog: ['Coo.'] },
      { type: 'npc', id: 'violet_pigeon2', x: 23, y: 16, sprite: 'ow_pigeon', animal: true, dir: 'left', move: 'wander', range: 2, dialog: ['Coo.'] },

      // ---- skeptic trainer ----
      { type: 'npc', id: 'violet_scientist', x: 30, y: 16, sprite: 'prof', dir: 'left', move: 'static',
        trainer: { class: 'SCIENTIST', name: 'SCIENTIST', level: 12, sight: 4,
          intro: ['SCIENTIST: Fascinating. A trainer, in MY park?', 'SCIENTIST: I require peer-reviewed evidence before I believe in kindness.'],
          after: ['SCIENTIST: The data... is compelling. I am writing a paper on animal sentience now.'] } },

      // ---- items ----
      { type: 'item', id: 'violet_super_mooch', x: 11, y: 26, item: 'SUPER NOOCH', qty: 1 },
      { type: 'item', id: 'violet_cookie', x: 17, y: 19, item: 'COOKIE', qty: 1 },
      { type: 'item', id: 'violet_seeds1', x: 21, y: 16, item: 'SEEDS', qty: 1, hidden: true },
      { type: 'item', id: 'violet_seeds2', x: 32, y: 18, item: 'SEEDS', qty: 1, hidden: true },
      { type: 'item', id: 'violet_nooch', x: 31, y: 18, item: 'B12 SHOT', qty: 1 },

      // ---- vegan beans ----
      { type: 'item', id: 'violet_bean1', x: 12, y: 7, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'violet_bean2', x: 12, y: 27, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'violet_bean3', x: 34, y: 11, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'violet_bean4', x: 22, y: 20, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'violet_bean5', x: 10, y: 32, item: 'VEGAN BEANS' },
    ],
  };
})();
