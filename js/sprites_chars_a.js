// Overworld character sprites (batch A): hero, girl, prof, mom, boy, kid.
// 16x16, Gen 1/2 Game Boy proportions: big head (~40% of height), ~7px-wide body, feet on row 15.
// Palette keys (engine recolors these): k outline, s skin, h hair, t shirt/top, p pants, e shoes, w white, a accent.
(function () {
  const S = window.SPRITES = window.SPRITES || {};

  // ---- small helpers to build exact-length row strings without manual counting ----
  const D = n => '.'.repeat(n);                 // n transparent chars
  const J = arr => arr.join('');                 // join an array of 1-char tokens (mixed pattern rows)
  const EYES_DOWN = J(['k', 's', 'k', 's', 's', 'k', 's', 'k']);            // 8 wide: two black-dot eyes on skin
  const EYES_LEFT = J(['k', 's', 'k', 's', 's', 'h', 'h', 'h', 'k']);       // 9 wide: single eye, profile

  // ================= shared HEAD shapes (rows 0-7, generic adult) =================
  function headDownStd() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),
      D(4) + EYES_DOWN + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headUpStd() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(5) + 'k' + 'h'.repeat(4) + 'k' + D(5),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headLeftStd() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
      D(3) + EYES_LEFT + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }

  // ================= shared TORSO / PANTS / SHOES (generic adult) =================
  function torsoStd() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),
      D(3) + 's' + 't'.repeat(8) + 's' + D(3),
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
    ];
  }
  function torsoLongHair() {           // long hair spills over shoulders + tiny white collar bow (girl)
    return [
      D(4) + 'k' + J(['t', 't', 'w', 'w', 't', 't']) + 'k' + D(4),
      D(2) + 'h' + 'k' + 't'.repeat(8) + 'k' + 'h' + D(2),
      D(2) + 'h' + 's' + 't'.repeat(8) + 's' + 'h' + D(2),
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
    ];
  }
  function pantsStd() {
    return [
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),
    ];
  }
  function shoesStand() {
    return [
      D(4) + 'k' + 'e'.repeat(6) + 'k' + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function shoesWalk() {
    return [
      D(4) + J(['k', 'e', 'e', 'e', 'k', 'e', 'e', 'k']) + D(4),
      D(5) + 'k'.repeat(3) + D(8),
    ];
  }
  function legsLeftStand() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'e'.repeat(6) + 'k' + D(5),
      D(4) + 'k'.repeat(6) + D(6),
    ];
  }
  function legsLeftWalk() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(2) + J(['k', 'e', 'e', 'e', 'e', 'k']) + D(2) + J(['k', 'e', 'e', 'k']) + D(2),
      D(2) + 'k'.repeat(4) + D(10),
    ];
  }

  function assemble(...parts) { return [].concat(...parts); }

  // =====================================================================
  // HERO — the player. Backwards red cap, dark hair, green hoodie (with
  // a small kangaroo-pocket accent stripe), blue jeans, sneakers with a
  // white sole highlight. This is the star sprite: kept extra clean.
  // =====================================================================
  function headDownCap() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),
      D(4) + EYES_DOWN + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headUpCap() {               // backwards cap: brim shows as a ledge poking out at the back
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(3) + 'k' + 'a'.repeat(8) + 'k' + D(3),
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headLeftCap() {             // brim nub pokes out the back (right side) of the cap
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 'a', 'a', 'a', 'a', 'a', 'a', 'k']) + D(4),
      D(4) + J(['k', 'a', 'a', 'a', 'a', 'a', 'a', 'k', 'a', 'k']) + D(2),
      D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
      D(3) + EYES_LEFT + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function torsoHoodie() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),
      D(3) + J(['s', 't', 't', 't', 'a', 'a', 't', 't', 't', 's']) + D(3),
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
    ];
  }
  function heroShoesStand() {
    return [
      D(4) + 'k' + J(['e', 'e', 'w', 'e', 'e', 'e']) + 'k' + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function heroShoesWalk() {
    return [
      D(4) + J(['k', 'e', 'w', 'e', 'k', 'e', 'e', 'k']) + D(4),
      D(5) + 'k'.repeat(3) + D(8),
    ];
  }
  function heroLegsLeftStand() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + J(['e', 'e', 'w', 'e', 'e', 'e']) + 'k' + D(5),
      D(4) + 'k'.repeat(6) + D(6),
    ];
  }
  function heroLegsLeftWalk() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(2) + J(['k', 'e', 'w', 'e', 'e', 'k']) + D(2) + J(['k', 'e', 'e', 'k']) + D(2),
      D(2) + 'k'.repeat(4) + D(10),
    ];
  }
  {
    const pal = {
      k: '#000000:0', s: '#f8c8a0:3', h: '#302018:1', t: '#58a848:2',
      p: '#3860a8:1', e: '#202020:0', w: '#f8f8f8:3', a: '#e04030:2',
    };
    S['hero_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownCap(), torsoHoodie(), pantsStd(), heroShoesStand()) };
    S['hero_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownCap(), torsoHoodie(), pantsStd(), heroShoesWalk()) };
    S['hero_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpCap(), torsoHoodie(), pantsStd(), heroShoesStand()) };
    S['hero_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpCap(), torsoHoodie(), pantsStd(), heroShoesWalk()) };
    S['hero_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftCap(), torsoHoodie(), heroLegsLeftStand()) };
    S['hero_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftCap(), torsoHoodie(), heroLegsLeftWalk()) };
  }

  // =====================================================================
  // GIRL — shoulder-length hair, dress top with a tiny white collar bow,
  // a flared skirt, and a small hair ribbon in profile. Original 'Lass'-
  // energy townsperson.
  // =====================================================================
  function headLeftGirl() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k', 'a']) + D(3),
      D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
      D(3) + EYES_LEFT + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function pantsSkirt() {              // flared skirt, wider than the bodice above it
    return [
      D(3) + 'k' + 'p'.repeat(8) + 'k' + D(3),
      D(3) + 'k' + 'p'.repeat(8) + 'k' + D(3),
    ];
  }
  {
    const pal = {
      k: '#000000:0', s: '#f8c8a0:3', h: '#8a4830:1', t: '#e05878:2',
      p: '#6858a8:1', e: '#302018:0', w: '#f8f8f8:3', a: '#f0c838:2',
    };
    S['girl_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoLongHair(), pantsSkirt(), shoesStand()) };
    S['girl_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoLongHair(), pantsSkirt(), shoesWalk()) };
    S['girl_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoLongHair(), pantsSkirt(), shoesStand()) };
    S['girl_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoLongHair(), pantsSkirt(), shoesWalk()) };
    S['girl_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftGirl(), torsoLongHair(), legsLeftStand()) };
    S['girl_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftGirl(), torsoLongHair(), legsLeftWalk()) };
  }

  // =====================================================================
  // PROF — the professor. Receding gray hair (bald crown on top and from
  // behind), a long white lab coat that covers most of the torso and
  // hangs past the waist, dark trousers peeking below the hem.
  // =====================================================================
  function headDownProf() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),   // bald top
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),   // hair only at the temples
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),
      D(4) + EYES_DOWN + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headUpProf() {              // gray hair with a small bald patch at the crown
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),   // bald patch peeking through
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(5) + 'k' + 'h'.repeat(4) + 'k' + D(5),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headLeftProf() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 's', 's', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 's', 's', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
      D(3) + EYES_LEFT + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function torsoCoat() {               // direction-agnostic: reused for down/up/left
    return [
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(3) + 'k' + 'a'.repeat(8) + 'k' + D(3),
      D(3) + 's' + 'a'.repeat(8) + 's' + D(3),
      D(3) + 'k' + J(['a', 'a', 'a', 'w', 'a', 'a', 'a', 'a']) + 'k' + D(3),
    ];
  }
  function pantsCoatHem() {            // coat hangs long; trousers only peek out below it
    return [
      D(3) + 'k' + 'a'.repeat(8) + 'k' + D(3),
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),
    ];
  }
  {
    const pal = {
      k: '#000000:0', s: '#f0c8a0:3', h: '#c8c8d0:1',
      p: '#484860:1', e: '#282030:0', w: '#f8f8f8:3', a: '#f0f0f0:2',
    };
    S['prof_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownProf(), torsoCoat(), pantsCoatHem(), shoesStand()) };
    S['prof_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownProf(), torsoCoat(), pantsCoatHem(), shoesWalk()) };
    S['prof_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpProf(), torsoCoat(), pantsCoatHem(), shoesStand()) };
    S['prof_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpProf(), torsoCoat(), pantsCoatHem(), shoesWalk()) };
    S['prof_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftProf(), torsoCoat(), legsLeftStand()) };
    S['prof_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftProf(), torsoCoat(), legsLeftWalk()) };
  }

  // =====================================================================
  // MOM — bun/updo hairstyle, an apron (with a small bow tied at the
  // front) worn over a dress. Warm, soft palette.
  // =====================================================================
  function headDownMom() {
    return [
      D(6) + 'h'.repeat(4) + D(6),                                  // bun peeking above the head
      D(5) + J(['k', 'h', 'h', 'h', 'h', 'k']) + D(5),               // bun band
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),
      D(4) + EYES_DOWN + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headUpMom() {
    return [
      D(6) + 'h'.repeat(4) + D(6),
      D(5) + J(['k', 'h', 'h', 'h', 'h', 'k']) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(5) + 'k' + 'h'.repeat(4) + 'k' + D(5),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headLeftMom() {
    return [
      D(6) + 'h'.repeat(4) + D(6),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
      D(3) + EYES_LEFT + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function torsoApron() {              // direction-agnostic: dress + apron bib with a bow
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),
      D(3) + 's' + J(['t', 't', 'a', 'a', 'a', 'a', 't', 't']) + 's' + D(3),
      D(4) + 'k' + J(['t', 'a', 'w', 'w', 'a', 't']) + 'k' + D(4),
    ];
  }
  function apronSkirt() {              // apron continues over the dress skirt, dress hem peeks below
    return [
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
    ];
  }
  function legsLeftMomStand() {
    return [
      D(3) + 'k' + 't'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 't'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'e'.repeat(6) + 'k' + D(5),
      D(4) + 'k'.repeat(6) + D(6),
    ];
  }
  function legsLeftMomWalk() {
    return [
      D(3) + 'k' + 't'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 't'.repeat(6) + 'k' + D(5),
      D(2) + J(['k', 'e', 'e', 'e', 'e', 'k']) + D(2) + J(['k', 'e', 'e', 'k']) + D(2),
      D(2) + 'k'.repeat(4) + D(10),
    ];
  }
  {
    const pal = {
      k: '#000000:0', s: '#f8c8a0:3', h: '#7a4838:1', t: '#c85850:2',
      a: '#f0e8d8:1', e: '#302018:0', w: '#f8f8f8:3',
    };
    S['mom_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownMom(), torsoApron(), apronSkirt(), shoesStand()) };
    S['mom_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownMom(), torsoApron(), apronSkirt(), shoesWalk()) };
    S['mom_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpMom(), torsoApron(), apronSkirt(), shoesStand()) };
    S['mom_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpMom(), torsoApron(), apronSkirt(), shoesWalk()) };
    S['mom_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftMom(), torsoApron(), legsLeftMomStand()) };
    S['mom_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftMom(), torsoApron(), legsLeftMomWalk()) };
  }

  // =====================================================================
  // BOY — youngster energy: spiky hair, a t-shirt with a white racing
  // stripe, shorts (bare knees before the shoes).
  // =====================================================================
  function spikeRow0Down() { return D(5) + J(['h', '.', 'h', '.', 'h', '.']) + D(5); }
  function spikeRow0Left() { return D(6) + J(['h', '.', 'h', '.', 'h']) + D(5); }
  function boyHeadDown() { const h = headDownStd(); h[0] = spikeRow0Down(); return h; }
  function boyHeadUp() { const h = headUpStd(); h[0] = spikeRow0Down(); return h; }
  function boyHeadLeft() { const h = headLeftStd(); h[0] = spikeRow0Left(); return h; }
  function boyTorso() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),
      D(3) + 's' + J(['t', 't', 't', 'w', 'w', 't', 't', 't']) + 's' + D(3),
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
    ];
  }
  function pantsShorts() {
    return [
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 's'.repeat(6) + 'k' + D(4),                       // bare knees below the shorts hem
    ];
  }
  function legsLeftShortsStand() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 's'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'e'.repeat(6) + 'k' + D(5),
      D(4) + 'k'.repeat(6) + D(6),
    ];
  }
  function legsLeftShortsWalk() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 's'.repeat(6) + 'k' + D(5),
      D(2) + J(['k', 'e', 'e', 'e', 'e', 'k']) + D(2) + J(['k', 'e', 'e', 'k']) + D(2),
      D(2) + 'k'.repeat(4) + D(10),
    ];
  }
  {
    const pal = {
      k: '#000000:0', s: '#f8c8a0:3', h: '#d87838:1', t: '#5878c8:2',
      p: '#c04838:1', e: '#302018:0', w: '#f8f8f8:3',
    };
    S['boy_down_0'] = { w: 16, h: 16, pal, rows: assemble(boyHeadDown(), boyTorso(), pantsShorts(), shoesStand()) };
    S['boy_down_1'] = { w: 16, h: 16, pal, rows: assemble(boyHeadDown(), boyTorso(), pantsShorts(), shoesWalk()) };
    S['boy_up_0'] = { w: 16, h: 16, pal, rows: assemble(boyHeadUp(), boyTorso(), pantsShorts(), shoesStand()) };
    S['boy_up_1'] = { w: 16, h: 16, pal, rows: assemble(boyHeadUp(), boyTorso(), pantsShorts(), shoesWalk()) };
    S['boy_left_0'] = { w: 16, h: 16, pal, rows: assemble(boyHeadLeft(), boyTorso(), legsLeftShortsStand()) };
    S['boy_left_1'] = { w: 16, h: 16, pal, rows: assemble(boyHeadLeft(), boyTorso(), legsLeftShortsWalk()) };
  }

  // =====================================================================
  // KID — small child, ~12px tall, oversized head, denim overalls with a
  // button, bare legs, positioned low in the frame (empty margin on top).
  // =====================================================================
  function kidMargin() { return [D(16), D(16), D(16), D(16)]; }
  function headDownKid() {
    return [
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),
      D(4) + EYES_DOWN + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headUpKid() {
    return [
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(5) + 'k' + 'h'.repeat(4) + 'k' + D(5),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function headLeftKid() {
    return [
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(4) + J(['k', 's', 's', 'h', 'h', 'h', 'h', 'k']) + D(4),
      D(3) + EYES_LEFT + D(4),
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  function torsoOveralls() {           // direction-agnostic: overalls with a button
    return [
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
      D(4) + J(['k', 'a', 'a', 'w', 'a', 'a', 'a', 'k']) + D(4),
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
    ];
  }
  function kidBareLeg() { return [D(4) + 'k' + 's'.repeat(6) + 'k' + D(4)]; }
  function legsLeftKidStand() {
    return [
      D(3) + 'k' + 's'.repeat(6) + 'k' + D(5),
      D(3) + 'k' + 'e'.repeat(6) + 'k' + D(5),
      D(4) + 'k'.repeat(6) + D(6),
    ];
  }
  function legsLeftKidWalk() {
    return [
      D(3) + 'k' + 's'.repeat(6) + 'k' + D(5),
      D(2) + J(['k', 'e', 'e', 'e', 'e', 'k']) + D(2) + J(['k', 'e', 'e', 'k']) + D(2),
      D(2) + 'k'.repeat(4) + D(10),
    ];
  }
  {
    const pal = {
      k: '#000000:0', s: '#f8d0a8:3', h: '#b06828:1',
      a: '#5878b0:2', e: '#302018:0', w: '#f8f8f8:3',
    };
    S['kid_down_0'] = { w: 16, h: 16, pal, rows: assemble(kidMargin(), headDownKid(), torsoOveralls(), kidBareLeg(), shoesStand()) };
    S['kid_down_1'] = { w: 16, h: 16, pal, rows: assemble(kidMargin(), headDownKid(), torsoOveralls(), kidBareLeg(), shoesWalk()) };
    S['kid_up_0'] = { w: 16, h: 16, pal, rows: assemble(kidMargin(), headUpKid(), torsoOveralls(), kidBareLeg(), shoesStand()) };
    S['kid_up_1'] = { w: 16, h: 16, pal, rows: assemble(kidMargin(), headUpKid(), torsoOveralls(), kidBareLeg(), shoesWalk()) };
    S['kid_left_0'] = { w: 16, h: 16, pal, rows: assemble(kidMargin(), headLeftKid(), torsoOveralls(), legsLeftKidStand()) };
    S['kid_left_1'] = { w: 16, h: 16, pal, rows: assemble(kidMargin(), headLeftKid(), torsoOveralls(), legsLeftKidWalk()) };
  }
})();
