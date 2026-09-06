// Verdant Town and its interiors — the first town in COLOR.
(function () {
  const M = window.MAPS = window.MAPS || {};
  M.verdant = {
    name: 'VERDANT TOWN', era: 1, music: 'town2', border: 'tree',
    legend: {
      // SANCTUARY CENTER roof (pink)
      '7': 'roof_l:pink', '8': 'roof_m:pink', '9': 'roof_r:pink',
      'I': 'roof2_l:pink', 'J': 'roof2_m:pink', 'N': 'roof2_r:pink',
      // VEGAN MART roof (blue)
      'Y': 'roof_l:blue', 'Z': 'roof_m:blue', 'z': 'roof_r:blue',
      '!': 'roof2_l:blue', '@': 'roof2_m:blue', '$': 'roof2_r:blue',
      // house2 roof (green)
      '&': 'roof_l:green', '*': 'roof_m:green', '+': 'roof_r:green',
      // house3 roof (brown)
      '(': 'roof_l:brown', ')': 'roof_m:brown', '?': 'roof_r:brown',
    },
    rows: [
      'TTTTTTTTTTTTTT==TTTTTTTTTTTTTT',
      'T.............===............T',
      'T...788889.....==...YZZZZz...T',
      'T...IJJJJN.....==...!@@@@$...T',
      'T...[XCDX].....==...[XMDX]...T',
      'T..========================..T',
      'T..====S===============S===..T',
      'T..............==............T',
      'T..............==............T',
      'T.....ff.......==......ff....T',
      'T.....f....n...==..n...f.....T',
      'T............S.==............T',
      'T..............==............T',
      'T........ff....==...ff.......T',
      'T..............==............T',
      'T..............==............T',
      'T....=====================...T',
      'T....=====================...T',
      'T.|----S=----|.==.1223=&**+..T',
      'T.|f.....FFFF|.==.[XD]=[XD]..T',
      'T.|f%%%%%....|.==...=.=..=...T',
      'T.|.~~~~~nff.|.==.....=......T',
      'T.|.~~~~~n...|.==.())?=......T',
      'T.|ff.....f..|.==.[XD]=......T',
      'T.|----------|.==...=.=......T',
      'T.............L==L...........T',
      'TTTTTTTTTTTTTTT==TTTTTTTTTTTTT',
    ],
    exits: [
      { edge: 'south', from: 15, to: 16, map: 'route1', offset: -6 },
      { edge: 'north', from: 14, to: 15, map: 'route2', offset: -5 },
    ],
    objects: [
      // ---- warps into buildings
      { type: 'warp', x: 7, y: 4, map: 'verdant_center', tx: 5, ty: 7, dir: 'up' },
      { type: 'warp', x: 23, y: 4, map: 'verdant_mart', tx: 4, ty: 7, dir: 'up' },
      { type: 'warp', x: 20, y: 19, map: 'verdant_house1', tx: 4, ty: 7, dir: 'up' },
      { type: 'warp', x: 25, y: 19, map: 'verdant_house2', tx: 4, ty: 7, dir: 'up' },
      { type: 'warp', x: 20, y: 23, map: 'verdant_house3', tx: 4, ty: 7, dir: 'up' },

      // ---- signs
      { type: 'sign', x: 13, y: 11, text: ['VERDANT TOWN', 'Where the color comes from.'] },
      { type: 'sign', x: 7, y: 6, text: ['SANCTUARY CENTER', 'Tired animals welcome.'] },
      { type: 'sign', x: 23, y: 6, text: ['VEGAN MART', '100% plant-based, 0% guilt.'] },
      { type: 'sign', x: 7, y: 18, text: ['VH PLAYGROUND', 'Free tech for the animals. Free fun for everyone.'] },

      // ---- team members, wandering the plaza
      { type: 'npc', id: 'verdant_vikram', team: 'vikram', x: 5, y: 8, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'verdant_gabriele', team: 'gabriele', x: 9, y: 12, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'verdant_tobias', team: 'tobias', x: 12, y: 8, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'verdant_jeremy', team: 'jeremy', x: 19, y: 12, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', team: 'elizabeth', id: 'verdant_elizabeth', x: 21, y: 11, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'verdant_michael', team: 'michael', x: 25, y: 12, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'verdant_berliner', team: 'berliner', x: 21, y: 14, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'verdant_cinephile', team: 'cinephile', x: 4, y: 11, dir: 'down', move: 'wander', range: 2 },

      // ---- flavor NPCs
      { type: 'npc', id: 'verdant_woman', x: 14, y: 9, sprite: 'woman', dir: 'up', move: 'look',
        dialog: ['ROUTE 2 is north. I heard a DUCK fell asleep on the road. Poor thing looks hungry.', 'Bring OATS if you have it. Or just let her nap. She\'s earned it.'] },
      { type: 'npc', id: 'verdant_oldman', x: 12, y: 23, sprite: 'oldman', dir: 'left', move: 'look',
        dialog: ['In my day this town was black and white. Then the KIDS showed up with their COLORS.', 'Kids these days. Bringing joy wherever they go. Unbelievable.'] },
      { type: 'npc', id: 'verdant_kid', x: 11, y: 20, sprite: 'kid', dir: 'down', move: 'look',
        dialog: ['My CHICK follows me everywhere!', 'She thinks she\'s a dog. I haven\'t corrected her.'] },
      { type: 'npc', id: 'verdant_kid_chick', x: 12, y: 20, sprite: 'ow_chick', animal: true, dir: 'left', move: 'look', dialog: ['PEEP!'] },

      // ---- items
      { type: 'item', id: 'verdant_mooch', x: 12, y: 12, item: 'NOOCH', qty: 1 },
      { type: 'item', id: 'verdant_seeds', x: 6, y: 23, item: 'SEEDS', qty: 1, hidden: true },
      { type: 'item', id: 'verdant_bean1', x: 3, y: 20, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'verdant_bean2', x: 10, y: 23, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'verdant_bean3', x: 3, y: 23, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'verdant_bean4', x: 10, y: 13, item: 'VEGAN BEANS', hidden: true },
    ],
  };

  M.verdant_center = {
    name: 'SANCTUARY CENTER', era: 1, music: 'center', indoor: true, border: 'void',
    rows: [
      'wwxwwwvwwxww',
      'oqPoooooooqo',
      'ooooooooHooo',
      'kkkkkkkkkkkk',
      'oooooooooooo',
      'oosooooooqoo',
      'oooooooooooo',
      'ooooomoooooo',
    ],
    objects: [
      { type: 'warp', x: 5, y: 7, map: 'verdant', tx: 7, ty: 5, dir: 'down' },
      { type: 'npc', id: 'verdant_nurse', x: 5, y: 2, sprite: 'nurse', dir: 'down', move: 'static', script: 'center' },
      { type: 'npc', id: 'verdant_center_visitor', x: 3, y: 5, sprite: 'girl', dir: 'down', move: 'static',
        dialog: ['My CHICK sprained a wing doing the HAPPY DANCE. Overachiever.', 'The nurse says she\'ll be back to full FLUFF UP by tomorrow.'] },
    ],
  };

  M.verdant_mart = {
    name: 'VEGAN MART', era: 1, music: 'town2', indoor: true, border: 'void',
    rows: [
      'wwxwwvwwxw',
      'ohhhhhhhho',
      'oooooooooo',
      'kkkkkkkkkk',
      'oooooooooo',
      'ohooooooho',
      'oooooooooo',
      'oooomooooo',
    ],
    objects: [
      { type: 'warp', x: 4, y: 7, map: 'verdant', tx: 23, ty: 5, dir: 'down' },
      { type: 'npc', id: 'verdant_clerk', x: 5, y: 2, sprite: 'clerk', dir: 'down', move: 'static', script: 'mart',
        stock: ['NOOCH', 'CARROT', 'SEEDS', 'APPLE', 'HAY', 'LETTUCE', 'OATS'] },
      { type: 'npc', id: 'verdant_mart_shopper', x: 7, y: 4, sprite: 'man', dir: 'down', move: 'static',
        dialog: ['I buy OATS in bulk. My GOAT has opinions about freshness.', 'Strong opinions.'] },
    ],
  };

  M.verdant_house1 = {
    name: 'DISCORD HOUSE', era: 1, music: 'town2', indoor: true, border: 'void',
    rows: [
      'wvwwxwxw',
      'oPPPPooo',
      'Booooooo',
      'Eocaadoo',
      'oooooooo',
      'otooooho',
      'oooooooo',
      'oooomooo',
    ],
    objects: [
      { type: 'warp', x: 4, y: 7, map: 'verdant', tx: 20, ty: 20, dir: 'down' },
      { type: 'npc', id: 'verdant_house1_hoodie', x: 5, y: 4, sprite: 'hoodie', dir: 'down', move: 'static',
        dialog: ['I\'m working on my next trip playlist!', 'Have you heard the DRACULA song? I can\'t get it out of my head!'] },
    ],
  };

  M.verdant_house2 = {
    name: 'VERDANT HOUSE', era: 1, music: 'town2', indoor: true, border: 'void',
    rows: [
      'wwxwwxww',
      'ohooooho',
      'Booooooo',
      'Eocaadoo',
      'oooooooo',
      'otooooho',
      'oooooooo',
      'oooomooo',
    ],
    objects: [
      { type: 'warp', x: 4, y: 7, map: 'verdant', tx: 25, ty: 20, dir: 'down' },
      { type: 'npc', id: 'verdant_house2_mom', x: 5, y: 4, sprite: 'woman', dir: 'down', move: 'static',
        dialog: ['Welcome! The BUNNY runs this house, technically.', 'She\'s rescued, spoiled, and extremely judgmental about carrot quality.'] },
      { type: 'npc', id: 'verdant_house2_bunny', x: 3, y: 6, sprite: 'ow_bunny', animal: true, dir: 'down', move: 'wander', range: 1, dialog: ['BINKY!'] },
    ],
  };

  M.verdant_house3 = {
    name: 'VERDANT HOUSE', era: 1, music: 'town2', indoor: true, border: 'void',
    rows: [
      'wwxwwxww',
      'RQooooho',
      'oooooooo',
      'Boocaado',
      'Eooooooo',
      'ooooooto',
      'oooooooo',
      'oooomooo',
    ],
    objects: [
      { type: 'warp', x: 4, y: 7, map: 'verdant', tx: 20, ty: 24, dir: 'down' },
      { type: 'npc', id: 'verdant_house3_chef', x: 3, y: 6, sprite: 'chef', dir: 'down', move: 'static',
        dialog: ['I put NOOCH on everything. Pasta. Popcorn. Cereal. Don\'t judge.', 'Next experiment: NOOCH ice cream. Wish me luck.'] },
    ],
  };
})();
