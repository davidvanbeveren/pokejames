// ROUTE 2 — VERDANT TOWN ↔ VIOLET CITY.
(function () {
  const M = window.MAPS = window.MAPS || {};
  M.route2 = {
    name: 'ROUTE 2', era: 1, music: 'route', border: 'tree',
    rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'TT.......==.......TT',
    'TT.......==.......TT',
    'TT.......==.......TT',
    'TT.f.....==.....f.TT',
    'TT.......==.......TT',
    'TT......,,,.f.....TT',
    'TT.....,,,,,......TT',
    'TT......,,,,,.....TT',
    'TT.......,,,......TT',
    'TT.r.....==.......TT',
    'TT.......==...,,,.TT',
    'TT.......==..,,,,.TT',
    'TT.......==...,,,.TT',
    'TT....r..==.......TT',
    'TT.f......==......TT',
    'TT...,,,..==......TT',
    'TT..,,,,...==...r.TT',
    'TT..,,,....==.__..TT',
    'TT...,,,..==......TT',
    'TT.b.....,,,......TT',
    'TT..___.,,,.......TT',
    'TT......,,,,......TT',
    'TT......,,,.....r.TT',
    'TT.......==.....b.TT',
    'TT.......==....r..TT',
    'TTTTTTTrr=rrTTTTTTTT',
    'TT..,,,..==.......TT',
    'TT..,,,,.==.......TT',
    'TT...,,..==S....f.TT',
    'TT........==.%%%%.TT',
    'TT........==.~~~~rTT',
    'TT.........==~~~~.TT',
    'TT.....f...==~~~~.TT',
    'TT........==.~~~~.TT',
    'TT........==,,,...TT',
    'TT.......==.,,,,..TT',
    'TT.,,,...==..,,...TT',
    'TT.,,,...==S......TT',
    'TTTTTTTTT==TTTTTTTTT',
    ],
    exits: [
      { edge: 'south', from: 9, to: 10, map: 'verdant', offset: 5 },
      { edge: 'north', from: 9, to: 10, map: 'violet', offset: 10 },
    ],
    encounters: 'route2',
    objects: [
      // ---- signs
      { type: 'sign', x: 11, y: 38, text: ['ROUTE 2 —', 'VERDANT TOWN ↔ VIOLET CITY'] },
      { type: 'sign', x: 11, y: 29, text: ['SLOW DOWN:', 'FRIENDS CROSSING'] },

      // ---- the sleeping DUCK chokepoint (about a third of the way north)
      // ids and the cow_gone flag keep their old names so saves made before the swap still work
      { type: 'npc', id: 'sleeping_cow', sprite: 'ow_duck', animal: true, x: 9, y: 26, dir: 'left', move: 'static', script: 'sleeping_cow', unless: 'cow_gone' },
      { type: 'item', id: 'route2_hay', x: 11, y: 28, item: 'OATS', qty: 1 },
      { type: 'npc', id: 'route2_oldman', sprite: 'oldman', x: 7, y: 29, dir: 'right', move: 'look',
        dialog: ['GERARD: I need to merge a PR in the next town but this DUCK is in the way!', 'GERARD: Grrr. But he\'s so cute...'] },

      // ---- rival battle, about two thirds of the way north
      { type: 'trigger', id: 'rival2', x: 9, y: 13, w: 2, h: 1, script: 'rival_route2' },

      // ---- skeptic trainers
      { type: 'npc', id: 'r2_influencer', sprite: 'girl', x: 13, y: 11, dir: 'left', move: 'static',
        trainer: { class: 'INFLUENCER', name: 'INFLUENCER', level: 10, sight: 4,
          intro: ['INFLUENCER: Ew, is that a FARM ANIMAL? My followers would NOT approve.'],
          after: ['INFLUENCER: Okay... that was actually kind of cute. Don\'t tell my followers.'] } },
      { type: 'npc', id: 'r2_gymbro', sprite: 'man', x: 13, y: 21, dir: 'left', move: 'static',
        trainer: { class: 'GYM_BRO', name: 'GYM BRO', level: 8, sight: 4,
          intro: ['GYM BRO: Bro. Where\'s the PROTEIN. I don\'t see any PROTEIN.'],
          after: ['GYM BRO: Bro... your animal is SHREDDED. Respect.'] } },
      { type: 'npc', id: 'r2_cheese', sprite: 'woman', x: 7, y: 31, dir: 'right', move: 'static',
        trainer: { class: 'CHEESE_LOVER', name: 'CHEESE FAN', level: 9, sight: 3,
          intro: ['CHEESE LOVER: Life without cheese? Sounds miserable, honestly.'],
          after: ['CHEESE LOVER: Hm. Your animal seems happier than my fridge.'] } },

      // ---- friendly NPCs
      { type: 'npc', team: 'elizabeth', id: 'route2_elizabeth', x: 6, y: 17, dir: 'down', move: 'wander', range: 2 },
      { type: 'npc', id: 'route2_kid', sprite: 'kid', x: 13, y: 7, dir: 'left', move: 'wander', range: 2,
        dialog: ['ANNIKA: Have you met my little EZRA?', 'ANNIKA: Pay the belly rub tax now, or face the consequences.'] },

      // ---- pond animals
      { type: 'npc', id: 'route2_duck', sprite: 'ow_duck', animal: true, x: 9, y: 32, dir: 'down', move: 'wander', range: 2, dialog: ['QUACK!'] },
      { type: 'npc', id: 'route2_goat', sprite: 'ow_goat', animal: true, x: 17, y: 32, dir: 'left', move: 'wander', range: 2,
        dialog: ['The GOAT is standing on a rock. Of course it is.'] },

      // ---- items
      { type: 'item', id: 'route2_mooch', x: 12, y: 37, item: 'NOOCH', qty: 1 },
      { type: 'item', id: 'route2_supermooch', x: 8, y: 16, item: 'SUPER NOOCH', qty: 1 },
      { type: 'item', id: 'route2_apple1', x: 9, y: 33, item: 'APPLE', qty: 1 },
      { type: 'item', id: 'route2_apple2', x: 12, y: 12, item: 'APPLE', qty: 1 },
      { type: 'item', id: 'route2_nooch', x: 11, y: 22, item: 'B12 SHOT', qty: 1, hidden: true },

      // ---- vegan beans (mix visible / hidden)
      { type: 'item', id: 'route2_bean1', x: 12, y: 38, item: 'VEGAN BEANS' },
      { type: 'item', id: 'route2_bean2', x: 10, y: 8, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'route2_bean3', x: 12, y: 30, item: 'VEGAN BEANS' },
      { type: 'item', id: 'route2_bean4', x: 5, y: 18, item: 'VEGAN BEANS', hidden: true },
      { type: 'item', id: 'route2_bean5', x: 13, y: 9, item: 'VEGAN BEANS' },
    ],
  };
})();
