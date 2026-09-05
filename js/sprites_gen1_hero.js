// Hero overworld sprite after Kate's design: 16x20 FireRed-style trainer — red cap with white panel,
// brown hair, orange-brown jacket with backpack straps, navy trousers, dark boots. Full colour;
// Game Boy shades chosen so cap/jacket/trousers/skin separate cleanly.
(function () {
  const S = window.SPRITES = window.SPRITES || {};
  // k outline, h hair, a cap, c cap panel, s skin, t jacket, b backpack/straps, p trousers, e boots, w white
  const PAL = { k: '#282018:0', h: '#5a3018:0', a: '#d83030:1', c: '#f8f8f8:3', s: '#f8c890:3', t: '#d07838:2', b: '#f0c040:3', p: '#283890:1', e: '#282018:0', w: '#f8f8f8:3' };
  const def = (name, rows) => { S[name] = { w: 16, h: 20, pal: PAL, rows: rows.map(r => r.length > 16 ? r.slice(0, 16) : r.padEnd(16, '.')) }; };
  const DOWN_HEAD = [
    '......kkkk......',
    '....kkaaaakk....',
    '...kaaaaaaaak...',
    '...kaaccccaak...',
    '..kkaaccccaakk..',
    '..khkkkkkkkkhk..',
    '..khhssssssshk..',
    '..khsskssskshk..',
    '..khsssssssshk..',
    '...ksssssssssk..',
    '....kkkkkkkkk...',
  ];
  def('hero_down_0', DOWN_HEAD.concat([
    '...kkttttttkk...',
    '..kttbttttbttk..',
    '..kttbttttbttk..',
    '..kskkttttkksk..',
    '...kkppppppkk...',
    '....kppppppk....',
    '....kppkkppk....',
    '....kppkkppk....',
    '....kkk..kkk....',
  ]));
  def('hero_down_1', DOWN_HEAD.concat([
    '...kkttttttkk...',
    '..kttbttttbttk..',
    '..kttbttttbtkk..',
    '..kskkttttkks...',
    '...kkppppppkk...',
    '....kppppppk....',
    '....kppkkppk....',
    '....kppkkpk.....',
    '....kkk.kkk.....',
  ]));
  const UP_HEAD = [
    '......kkkk......',
    '....kkaaaakk....',
    '...kaaaaaaaak...',
    '...kaaaaaaaak...',
    '..kkaaaaaaaakk..',
    '..kkkkkkkkkkkk..',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '..khhhhhhhhhhk..',
    '...khhhhhhhhhk..',
    '....kkkkkkkkk...',
  ];
  def('hero_up_0', UP_HEAD.concat([
    '...kkttttttkk...',
    '..kttbbbbbbttk..',
    '..kttbbbbbbttk..',
    '..kskkbbbbkksk..',
    '...kkppppppkk...',
    '....kppppppk....',
    '....kppkkppk....',
    '....kppkkppk....',
    '....kkk..kkk....',
  ]));
  def('hero_up_1', UP_HEAD.concat([
    '...kkttttttkk...',
    '..kttbbbbbbttk..',
    '..kttbbbbbbtkk..',
    '..kskkbbbbkks...',
    '...kkppppppkk...',
    '....kppppppk....',
    '....kppkkppk....',
    '....kppkkpk.....',
    '....kkk.kkk.....',
  ]));
  const LEFT_HEAD = [
    '......kkkk......',
    '....kkaaaakk....',
    '...kaccaaaaak...',
    '...kaccaaaaak...',
    '.kkkkkkkkaaaak..',
    '...khsssshhhk...',
    '...khsssshhhhk..',
    '...kskssshhhhk..',
    '...ksssshhhhhk..',
    '....ksssshhhk...',
    '.....kkkkkkk....',
  ];
  def('hero_left_0', LEFT_HEAD.concat([
    '....kkttttkk....',
    '...kttkttttk....',
    '...kttkttttk....',
    '...kskkttttk....',
    '....kkppppkk....',
    '.....kppppk.....',
    '.....kppkpk.....',
    '.....kppkpk.....',
    '.....kkk.kk.....',
  ]));
  def('hero_left_1', LEFT_HEAD.concat([
    '....kkttttkk....',
    '...kttkttttk....',
    '....kkkttttk....',
    '....kskttttk....',
    '....kkppppkk....',
    '.....kppppk.....',
    '....kppkkppk....',
    '...kppk..kppk...',
    '...kkk....kkk...',
  ]));
})();
