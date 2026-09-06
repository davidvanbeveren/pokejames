// Game data: animal species, charm moves, items, skeptic (trainer) classes, encounter tables.
(function () {
  const D = window.DATA = {};

  // Charm styles: CUTE, LOGIC, HEART. Skeptics are weak to one and resist another.
  D.MOVES = {
    NUZZLE:      { name: 'NUZZLE',      style: 'CUTE',  power: 40, pp: 30, msg: '{A} nuzzled up close!' },
    HOP:         { name: 'HOP',         style: 'CUTE',  power: 35, pp: 35, msg: '{A} hopped around happily!' },
    'PUPPY EYES':{ name: 'PUPPY EYES',  style: 'HEART', power: 50, pp: 20, msg: '{A} made big puppy eyes!' },
    ZOOMIES:     { name: 'ZOOMIES',     style: 'CUTE',  power: 60, pp: 15, msg: '{A} did the ZOOMIES!' },
    BINKY:       { name: 'BINKY',       style: 'CUTE',  power: 80, pp: 10, msg: '{A} did a joyful BINKY jump!' },
    PEEP:        { name: 'PEEP',        style: 'CUTE',  power: 35, pp: 35, msg: '{A} peeped adorably!' },
    'TAP DANCE': { name: 'TAP DANCE',   style: 'CUTE',  power: 45, pp: 25, msg: '{A} tap-danced on tiny feet!' },
    'FLUFF UP':  { name: 'FLUFF UP',    style: 'HEART', power: 50, pp: 20, msg: '{A} fluffed up its feathers!' },
    'HAPPY DANCE':{ name:'HAPPY DANCE', style: 'CUTE',  power: 65, pp: 15, msg: '{A} did a HAPPY DANCE!' },
    'WING HUG':  { name: 'WING HUG',    style: 'HEART', power: 75, pp: 10, msg: '{A} gave a warm WING HUG!' },
    'MOTHER HEN':{ name: 'MOTHER HEN',  style: 'HEART', power: 90, pp: 5,  msg: '{A} tucked everyone under its wing!' },
    OINK:        { name: 'OINK',        style: 'CUTE',  power: 40, pp: 30, msg: '{A} let out a happy OINK!' },
    'MUD BATH':  { name: 'MUD BATH',    style: 'HEART', power: 50, pp: 20, msg: '{A} rolled in a cozy mud bath!' },
    'SNOUT BOOP':{ name: 'SNOUT BOOP',  style: 'CUTE',  power: 60, pp: 15, msg: '{A} booped with its snout!' },
    'BELLY FLOP':{ name: 'BELLY FLOP',  style: 'CUTE',  power: 75, pp: 10, msg: '{A} flopped over for belly rubs!' },
    'BIG SNUGGLE':{ name:'BIG SNUGGLE', style: 'HEART', power: 90, pp: 5,  msg: '{A} gave a BIG SNUGGLE!' },
    MOO:         { name: 'MOO',         style: 'CUTE',  power: 40, pp: 30, msg: '{A} mooed gently!' },
    'HEAD BONK': { name: 'HEAD BONK',   style: 'CUTE',  power: 50, pp: 25, msg: '{A} gave a friendly head bonk!' },
    LICK:        { name: 'LICK',        style: 'HEART', power: 55, pp: 20, msg: '{A} licked their hand!' },
    'MOO-D BOOST':{ name:'MOO-D BOOST', style: 'HEART', power: 80, pp: 10, msg: '{A} lifted the whole MOO-D!' },
    BAA:         { name: 'BAA',         style: 'CUTE',  power: 40, pp: 30, msg: '{A} said BAA!' },
    BOUNCE:      { name: 'BOUNCE',      style: 'CUTE',  power: 50, pp: 25, msg: '{A} bounced on springy legs!' },
    'WOOL HUG':  { name: 'WOOL HUG',    style: 'HEART', power: 70, pp: 15, msg: '{A} gave a soft WOOL HUG!' },
    'COUNT SHEEP':{ name:'COUNT SHEEP', style: 'LOGIC', power: 80, pp: 10, msg: '{A} counted itself. Very calming!' },
    BLEAT:       { name: 'BLEAT',       style: 'CUTE',  power: 40, pp: 30, msg: '{A} bleated cheerfully!' },
    'PLAY BUTT': { name: 'PLAY BUTT',   style: 'CUTE',  power: 50, pp: 25, msg: '{A} gave a playful little butt!' },
    CLIMB:       { name: 'CLIMB',       style: 'LOGIC', power: 60, pp: 15, msg: '{A} climbed onto something it should not!' },
    'GOAT YOGA': { name: 'GOAT YOGA',   style: 'HEART', power: 85, pp: 10, msg: '{A} led a GOAT YOGA session!' },
    QUACK:       { name: 'QUACK',       style: 'CUTE',  power: 40, pp: 30, msg: '{A} quacked!' },
    SPLASH:      { name: 'SPLASH',      style: 'CUTE',  power: 45, pp: 25, msg: '{A} splashed around!' },
    WADDLE:      { name: 'WADDLE',      style: 'HEART', power: 60, pp: 15, msg: '{A} waddled over adorably!' },
    PADDLE:      { name: 'PADDLE',      style: 'LOGIC', power: 75, pp: 10, msg: '{A} paddled in perfect circles!' },
    HONK:        { name: 'HONK',        style: 'LOGIC', power: 45, pp: 30, msg: '{A} HONKED with authority!' },
    'WING FLAP': { name: 'WING FLAP',   style: 'CUTE',  power: 55, pp: 20, msg: '{A} flapped its wings!' },
    'STARE DOWN':{ name: 'STARE DOWN',  style: 'LOGIC', power: 70, pp: 10, msg: '{A} stared. And stared.' },
    'PEACE HONK':{ name: 'PEACE HONK',  style: 'HEART', power: 90, pp: 5,  msg: '{A} honked for peace!' },
    GOBBLE:      { name: 'GOBBLE',      style: 'CUTE',  power: 45, pp: 30, msg: '{A} gobbled!' },
    'TAIL FAN':  { name: 'TAIL FAN',    style: 'CUTE',  power: 60, pp: 15, msg: '{A} fanned its magnificent tail!' },
    STRUT:       { name: 'STRUT',       style: 'LOGIC', power: 70, pp: 10, msg: '{A} strutted with confidence!' },
    GRATITUDE:   { name: 'GRATITUDE',   style: 'HEART', power: 95, pp: 5,  msg: '{A} showed pure GRATITUDE!' },
    COO:         { name: 'COO',         style: 'HEART', power: 60, pp: 20, msg: '{A} cooed softly!' },
    'HEAD BOB':  { name: 'HEAD BOB',    style: 'CUTE',  power: 70, pp: 15, msg: '{A} bobbed its head in rhythm!' },
    HOMING:      { name: 'HOMING',      style: 'LOGIC', power: 90, pp: 10, msg: '{A} found the way home. Always does.' },
    'CITY WISDOM':{ name:'CITY WISDOM', style: 'LOGIC', power: 110, pp: 5, msg: '{A} shared ancient CITY WISDOM!' },
    'GENTLE FACT':{ name:'GENTLE FACT', style: 'LOGIC', power: 50, pp: 20, msg: '{A} shared a gentle fact!' },
    'TIRED SMILE':{ name:'TIRED SMILE', style: 'HEART', power: 30, pp: 1,  msg: '{A} managed a tired little smile.' },
    'NOSE BOOP': { name: 'NOSE BOOP', style: 'CUTE', power: 38, pp: 30, msg: "{A} booped with its nose!" },
    'TAIL WAG': { name: 'TAIL WAG', style: 'CUTE', power: 45, pp: 25, msg: "{A} wagged its whole back half!" },
    PURR: { name: 'PURR', style: 'HEART', power: 58, pp: 20, msg: "{A} purred until the room felt softer." },
    'SLOW BLINK': { name: 'SLOW BLINK', style: 'HEART', power: 70, pp: 15, msg: "{A} gave a slow, trusting blink." },
    'BIG YAWN': { name: 'BIG YAWN', style: 'CUTE', power: 62, pp: 15, msg: "{A} yawned enormously. It is catching!" },
    'SLOW STROLL': { name: 'SLOW STROLL', style: 'LOGIC', power: 55, pp: 20, msg: "{A} ambled past, in no hurry at all." },
    RUSTLE: { name: 'RUSTLE', style: 'CUTE', power: 38, pp: 30, msg: "{A} rustled its leaves." },
    SUNSOAK: { name: 'SUNSOAK', style: 'HEART', power: 50, pp: 20, msg: "{A} soaked up the sun and shared the warmth." },
    'LEAF SHOWER': { name: 'LEAF SHOWER', style: 'CUTE', power: 62, pp: 15, msg: "{A} showered everyone in soft green leaves!" },
    'ROOT DOWN': { name: 'ROOT DOWN', style: 'LOGIC', power: 75, pp: 10, msg: "{A} rooted itself. It will not be moved." },
    BUBBLE: { name: 'BUBBLE', style: 'CUTE', power: 38, pp: 30, msg: "{A} blew a stream of bubbles!" },
    DIVE: { name: 'DIVE', style: 'CUTE', power: 70, pp: 12, msg: "{A} dived and surfaced, beaming." },
    ANTENNAE: { name: 'ANTENNAE', style: 'CUTE', power: 38, pp: 30, msg: "{A} waggled its antennae hello." },
    FLUTTER: { name: 'FLUTTER', style: 'CUTE', power: 50, pp: 25, msg: "{A} fluttered in a happy loop!" },
    'POLLEN PUFF': { name: 'POLLEN PUFF', style: 'HEART', power: 62, pp: 15, msg: "{A} puffed golden pollen everywhere!" },
    'SHELL HIDE': { name: 'SHELL HIDE', style: 'LOGIC', power: 48, pp: 25, msg: "{A} tucked in and waited it out." },
    SQUEAK: { name: 'SQUEAK', style: 'CUTE', power: 38, pp: 30, msg: "{A} let out a tiny squeak!" },
    'WARM GLOW': { name: 'WARM GLOW', style: 'HEART', power: 55, pp: 20, msg: "{A} glowed with a gentle warmth." },
    'SOFT HUM': { name: 'SOFT HUM', style: 'HEART', power: 68, pp: 15, msg: "{A} hummed a tune with no name." },
    'SHARE SNACK': { name: 'SHARE SNACK', style: 'HEART', power: 72, pp: 10, msg: "{A} shared its snack. Half each!" },
  };

  // base stats: hp, atk (charm), def (resilience), spd
  // The 151 creatures live in js/creatures_data.js; this turns them into species records.
  D.SPECIES = {};
  for (const c of (window.CREATURES || [])) {
    D.SPECIES[c.key] = {
      dex: c.num, name: c.name, kind: c.kind, base: c.base, baseExp: c.baseExp,
      moves: c.moves, foods: c.foods, cry: c.cry, entry: c.entry,
      height: c.height + ' m', weight: c.weight + ' kg',
      evolve: c.evolve || undefined, legendary: c.legendary || undefined,
    };
  }

  D.ITEMS = {
    NOOCH:        { name: 'NOOCH',        price: 300,  desc: 'Nutritious yeasty goodness. Restores 20 HP.', use: 'heal', amount: 20 },
    'SUPER NOOCH':{ name: 'SUPER NOOCH',  price: 700,  desc: 'Extra cheesy NOOCH. Restores 50 HP.', use: 'heal', amount: 50 },
    'FULL NOOCH': { name: 'FULL NOOCH',   price: 1500, desc: 'The whole jar. Fully restores HP.', use: 'heal', amount: 999 },
    'B12 SHOT':   { name: 'B12 SHOT',     price: 500,  desc: 'A shot of B12. A tired animal wakes up with half its HP.', use: 'revive' },
    COOKIE:       { name: 'COOKIE',       price: 200,  desc: 'A choc chip cookie. Restores 35 HP. Very British.', use: 'heal', amount: 35 },
    CARROT:       { name: 'CARROT',       price: 80,   desc: 'Crunchy and orange. Rabbits go wild for it.', use: 'food', trust: 15 },
    SEEDS:        { name: 'SEEDS',        price: 60,   desc: 'A handful of seeds. Birds of all kinds love them.', use: 'food', trust: 15 },
    APPLE:        { name: 'APPLE',        price: 100,  desc: 'A sweet apple. Pigs and goats approve.', use: 'food', trust: 15 },
    HAY:          { name: 'HAY',          price: 70,   desc: 'Fresh hay. A cow classic.', use: 'food', trust: 15 },
    LETTUCE:      { name: 'LETTUCE',      price: 50,   desc: 'Crisp lettuce. Universally liked.', use: 'food', trust: 15 },
    OATS:         { name: 'OATS',         price: 40,   desc: 'Rolled oats. Comfort food for everyone.', use: 'food', trust: 15 },
    'VEGAN BEANS':{ name: 'VEGAN BEANS',  price: 0,    desc: 'Mysterious beans hidden all over. Collect them all!', use: 'beans' },
    BIKE:         { name: 'BIKE',         price: 0,    desc: 'A folding bicycle. Press to ride fast!', use: 'bike', key: true },
    'PARTY INVITE':{ name:'PARTY INVITE', price: 0,    desc: 'An invitation to something in VIOLET CITY...', use: 'none', key: true },
    'COMPASSION BADGE': { name: 'COMPASSION BADGE', price: 0, desc: 'Proof that kindness wins debates.', use: 'none', key: true },
  };
  D.FOOD_TRUST = { fav: 55, like: 35, other: 15 };

  // Skeptic classes ("trainers" you win over with charm). weak: 2x, resist: 0.5x.
  D.SKEPTICS = {
    BBQ_DAD:     { name: 'BBQ DAD',      sprite: 'front_bbqdad',     ow: 'chef',    base: { hp: 62, atk: 48, def: 52 }, weak: 'CUTE',  resist: 'LOGIC', prize: 40,
      args: [['BUT BACON THO', 40, '{S} said "But bacon tho!"'], ['GRILL SEASON', 35, '{S} announced that it is GRILL SEASON!'], ['WHERE\'S THE BEEF', 45, '{S} asked where the beef is.']],
      taunt: 'Nobody tells me what to grill!', win: '...that is a very cute animal.', after: 'I got a BEYOND BURGER. Do not tell the guys.' },
    GYM_BRO:     { name: 'GYM BRO',      sprite: 'front_gymbro',     ow: 'man',     base: { hp: 55, atk: 55, def: 50 }, weak: 'LOGIC', resist: 'CUTE',  prize: 50,
      args: [['WHERE\'S UR PROTEIN', 45, '{S} asked where you get your protein.'], ['BRO SCIENCE', 35, '{S} cited some BRO SCIENCE.'], ['FLEX', 40, '{S} flexed. It was impressive.']],
      taunt: 'Bro. BRO. Do you even lift?', win: 'Wait, gorillas eat plants?', after: 'Pea protein hits different, bro.' },
    CHEESE_LOVER:{ name: 'CHEESE FAN',   sprite: 'front_cheeselover',ow: 'woman',   base: { hp: 66, atk: 52, def: 58 }, weak: 'HEART', resist: 'LOGIC', prize: 50,
      args: [['I COULD NEVER', 35, '{S} said "I could never give up cheese."'], ['BUT CHEESE', 50, '{S} whispered "...but cheese."'], ['MOZZARELLA MEMORIES', 40, '{S} reminisced about mozzarella.']],
      taunt: 'I could go vegan... except for cheese.', win: 'Have you tried cashew brie?!', after: 'Cashew brie changed my life.' },
    GRANDPA:     { name: 'GRANDPA',      sprite: 'front_grandpa',    ow: 'oldman',  base: { hp: 65, atk: 45, def: 65 }, weak: 'CUTE',  resist: 'LOGIC', prize: 60,
      args: [['BACK IN MY DAY', 35, '{S} started with "Back in my day..."'], ['LIVED TO 90', 40, '{S} said his grandpa ate meat and lived to 90.'], ['LIONS THO', 40, '{S} pointed out that lions eat meat.']],
      taunt: 'Back in my day we ate what we were given!', win: 'Well, aren\'t you a sweetheart.', after: 'My grandkids love the little one.' },
    INFLUENCER:  { name: 'INFLUENCER',   sprite: 'front_influencer', ow: 'girl',    base: { hp: 55, atk: 60, def: 45 }, weak: 'CUTE',  resist: 'HEART', prize: 70,
      args: [['CARNIVORE DIET', 45, '{S} promoted the CARNIVORE DIET.'], ['DO YOUR RESEARCH', 40, '{S} told you to do your research.'], ['RING LIGHT', 30, '{S} adjusted the ring light. Blinding!']],
      taunt: 'Smash that like button, plant people!', win: 'OMG this is SO going on my story.', after: 'My vegan content is doing NUMBERS.' },
    SCIENTIST:   { name: 'SCIENTIST',    sprite: 'front_scientist',  ow: 'prof',    base: { hp: 60, atk: 58, def: 60 }, weak: 'LOGIC', resist: 'CUTE',  prize: 80,
      args: [['WHAT ABOUT B12', 45, '{S} asked about B12.'], ['PLANTS FEEL PAIN', 40, '{S} claimed that plants feel pain.'], ['CITATION NEEDED', 40, '{S} demanded a citation.']],
      taunt: 'I will need to see peer-reviewed evidence.', win: 'The data... is compelling.', after: 'I am writing a paper on animal sentience now.' },
    CHEF:        { name: 'CHEF',         sprite: 'front_chef',       ow: 'chef',    base: { hp: 85, atk: 60, def: 65 }, weak: 'HEART', resist: 'CUTE',  prize: 200,
      args: [['MY RESTAURANT', 50, '{S} bellowed "In MY restaurant?!"'], ['FLAVOR IS KING', 55, '{S} declared that FLAVOR IS KING.'], ['BUTTER IN EVERYTHING', 60, '{S} put butter in everything.']],
      taunt: 'Vegan food? In MY kitchen? Not today!', win: 'This... this is the best dish I have ever tasted.', after: 'My new menu is 100% plant-based. Chef\'s kiss.' },
    RIVAL:       { name: 'DAVID',        sprite: 'front_rival',      ow: 'hoodie',  base: { hp: 55, atk: 55, def: 50 }, weak: null, resist: null, prize: 100, rival: true,
      args: [['BIG IDEA', 40, '{S} pitched a BIG IDEA at 2 AM.'], ['ONE MORE FEATURE', 45, '{S} asked for just one more feature.'], ['HANDPAN SOLO', 35, '{S} played a handpan solo.']],
      taunt: 'Let\'s see whose animal is happier!', win: 'Okay, okay. Yours is happier.', after: 'I still think mine is cuter.' },
  };

  // Encounter tables: [species, minLevel, maxLevel, weight]
  // [species, lowest level, highest level, how common]
  D.ENCOUNTERS = {
    route1: { rate: 0.13, table: [
      ['TOAD', 2, 4, 22], ['SALAMANDER', 2, 4, 20], ['DUGONG', 2, 4, 14], ['KANGAROO', 2, 4, 12],
      ['RAT', 3, 5, 10], ['PANGOLIN2', 3, 5, 10], ['PIKA', 3, 5, 6], ['CENTIPEDE', 3, 5, 4],
      ['RABBIT4', 2, 4, 2]] },
    route2: { rate: 0.13, table: [
      ['TURTLE', 6, 9, 14], ['SPARROW', 6, 9, 12], ['RHINOCEROS', 7, 10, 11], ['RHINOCEROS3', 7, 10, 11],
      ['CATERPILLAR', 7, 10, 10], ['HERON', 6, 9, 9], ['RHINOCEROS4', 6, 9, 8], ['SLUDGE2', 8, 11, 8],
      ['PONY', 6, 9, 7], ['PLATYPUS', 8, 11, 5], ['TADPOLE2', 8, 11, 3], ['RADISH', 6, 9, 2]] },
    violet_park: { rate: 0.12, table: [
      ['TOAD2', 13, 16, 12], ['CHAMELEON', 13, 16, 11], ['MUSKRAT', 13, 16, 10], ['RABBIT', 13, 16, 10],
      ['RABBIT3', 14, 17, 9], ['JERBOA2', 14, 17, 9], ['JERBOA', 13, 16, 8], ['MOLE', 15, 18, 7],
      ['PLANT2', 14, 17, 7], ['CLAM', 14, 17, 6], ['HORSE', 15, 18, 5], ['MACAQUE', 15, 18, 3],
      ['OSPREY', 15, 18, 2], ['MIME', 15, 18, 1]] },
  };

  // Stat helpers (Gen 1-flavored, simplified)
  D.calcMaxHp = (base, lvl) => Math.floor(base.hp * 2 * lvl / 100) + lvl + 10;
  D.calcStat = (b, lvl) => Math.floor(b * 2 * lvl / 100) + 5;
  D.expForLevel = lvl => lvl * lvl * lvl;
  D.levelForExp = exp => { let l = 1; while (l < 100 && D.expForLevel(l + 1) <= exp) l++; return l; };

  D.makeAnimal = function (speciesId, lvl, opts) {
    const sp = D.SPECIES[speciesId];
    const a = { species: speciesId, nick: (opts && opts.nick) || sp.name, level: lvl, exp: D.expForLevel(lvl), happiness: 70 };
    a.maxHp = D.calcMaxHp(sp.base, lvl); a.hp = a.maxHp;
    a.atk = D.calcStat(sp.base.atk, lvl); a.def = D.calcStat(sp.base.def, lvl); a.spd = D.calcStat(sp.base.spd, lvl);
    const learn = sp.moves.filter(m => m[0] <= lvl).map(m => m[1]);
    const uniq = [...new Set(learn)].slice(-4);
    a.moves = uniq.map(id => ({ id, pp: D.MOVES[id].pp, maxPp: D.MOVES[id].pp }));
    return a;
  };
  D.recalcStats = function (a) {
    const sp = D.SPECIES[a.species];
    const oldMax = a.maxHp;
    a.maxHp = D.calcMaxHp(sp.base, a.level);
    a.hp = Math.min(a.maxHp, a.hp + Math.max(0, a.maxHp - oldMax));
    a.atk = D.calcStat(sp.base.atk, a.level); a.def = D.calcStat(sp.base.def, a.level); a.spd = D.calcStat(sp.base.spd, a.level);
  };

  D.TOTAL_BEANS = 0; // computed at boot by counting item objects of VEGAN BEANS across maps
})();
