// Route 1 — Pallet Town to Verdant Town. A winding dirt path through grass, ledges and a small pond.
(function () {
  const M = window.MAPS = window.MAPS || {};
  M.route1 = {
    name: 'ROUTE 1', era: 0, music: 'route1', border: 'tree', encounters: 'route1',
    rows: [
      'TTTTTTTTT..TTTTTTTTT',
      'TTTTTTTTT..TTTTTTTTT',
      'TT.......==.......TT',
      'TT.......==....f..TT',
      'TT.......==...f...TT',
      'TT..,,,..==..,,,..TT',
      'TT..,,,..==..,,,..TT',
      'TT..,,,..==.......TT',
      'TT.r.....==.......TT',
      'TT......f==...b...TT',
      'TT.f...====....f..TT',
      'TT.....==.........TT',
      'TT...,,==,........TT',
      'TT...,,==,,,......TT',
      'TT..,,,==,,,...r..TT',
      'TT..,,,==,,,......TT',
      'TT..,,,==,,,...b..TT',
      'TT...,,==,,.......TT',
      'TT...._==S_.......TT',
      'TT.....======...,,TT',
      'TT.........==...,,TT',
      'TT.....____==__...TT',
      'TT....%%%%.==f....TT',
      'TT....~~~~.==.,,,.TT',
      'TT....~~~~.==.,,,.TT',
      'TT..r......==.,,..TT',
      'TT.........==..f..TT',
      'TT.b......===.....TT',
      'TT........==......TT',
      'TT.......,==,,....TT',
      'TT....f,,,==,,,...TT',
      'TT.....,,,==,,,f..TT',
      'TT......__==_.....TT',
      'TT......S.==......TT',
      'TTTTTTTTTT==TTTTTTTT',
      'TTTTTTTTTT==TTTTTTTT',
    ],
    exits: [
      { edge: 'south', from: 10, to: 11, map: 'pallet', offset: 0 },
      { edge: 'north', from: 9, to: 10, map: 'verdant', offset: 6 },
    ],
    objects: [
      // ---- signs
      { type: 'sign', x: 8, y: 33, text: ['ROUTE 1', 'PALLET TOWN <-> VERDANT TOWN'] },
      { type: 'sign', x: 9, y: 18, text: ['WILD ANIMALS LIVE IN TALL GRASS.', 'THEY ARE HUNGRY, NOT DANGEROUS.'] },

      // ---- skeptic trainers (beside the path, sight lines cross both path tiles)
      { type: 'npc', id: 'r1_bbqdad', x: 10, y: 15, sprite: 'chef', dir: 'left', move: 'static',
        trainer: { class: 'BBQ_DAD', level: 4, sight: 3,
          intro: ["BBQ DAD: Whoa there! You look like a TOFU DOG sneaking past my grill.", "BBQ DAD: Let's see if your animal's got more heart than my BARBECUE!"],
          after: ["BBQ DAD: ...okay, that IS a cute animal.", "BBQ DAD: Fine, I'll grill up a BEYOND BURGER. Don't tell the guys at the lodge."] } },
      { type: 'npc', id: 'r1_grandpa', x: 14, y: 23, sprite: 'oldman', dir: 'left', move: 'static',
        trainer: { class: 'GRANDPA', level: 5, sight: 3,
          intro: ['GRANDPA: Back in MY day we ate what we were given, no questions asked!', "GRANDPA: Let's see if your fancy plant-fed critter can keep up."],
          after: ["GRANDPA: Well, aren't you a sweetheart.", 'GRANDPA: My grandkids would love that little one. Come by anytime.'] } },

      // ---- friendly NPCs
      { type: 'npc', id: 'r1_clerk', x: 12, y: 30, sprite: 'clerk', dir: 'left', move: 'look',
        gift: { item: 'NOOCH', qty: 1, flag: 'r1_sample',
          lines: ['Hi! I work at the VEGAN MART in VERDANT TOWN.', 'Here, have a free sample of NOOCH! It heals tired animals.'],
          after: ['NOOCH is nutritional yeast. Cheesy, nutty, and 100% vegan.'] } },
      { type: 'npc', id: 'r1_boy', x: 11, y: 18, sprite: 'boy', dir: 'up', move: 'static',
        dialog: ['You can hop DOWN ledges to take shortcuts!', "You can't climb back up, though. Choose your path wisely!"] },
      { type: 'npc', team: 'swimmer', id: 'r1_swimmer', x: 10, y: 23, dir: 'left', move: 'wander' },

      // ---- wandering animal, tucked in the grass away from the path
      { type: 'npc', id: 'r1_bunny', x: 3, y: 14, sprite: 'ow_bunny', animal: true, dir: 'down', move: 'wander', range: 2, dialog: ['...twitch twitch.'] },

      // ---- vegan beans (2 visible, 2 hidden)
      { type: 'item', id: 'route1_bean1', x: 7, y: 29, item: 'VEGAN BEANS' },
      { type: 'item', id: 'route1_bean2', x: 13, y: 30, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'route1_bean3', x: 15, y: 25, item: 'VEGAN BEANS' },
      { type: 'item', id: 'route1_bean4', x: 4, y: 13, item: 'VEGAN BEANS', hidden: true },

      // ---- items
      { type: 'item', id: 'route1_carrot1', x: 12, y: 4, item: 'CARROT', qty: 1 },
      { type: 'item', id: 'route1_carrot2', x: 6, y: 32, item: 'CARROT', qty: 1 },
      { type: 'item', id: 'route1_seeds', x: 16, y: 25, item: 'SEEDS', qty: 1, hidden: true },
      { type: 'item', id: 'route1_oats', x: 14, y: 31, item: 'OATS', qty: 1 },
    ],
  };
})();
