// Post-load tweaks: recolour the hero's battle back-sprite to Kate's outfit (orange-brown jacket, brown hair).
(function () {
  const S = window.SPRITES = window.SPRITES || {};
  if (S.back_hero) S.back_hero.pal = Object.assign({}, S.back_hero.pal, { h: '#5a3018:1', t: '#d07838:2', u: '#a05828:1', x: '#f0a860:3' });
})();
