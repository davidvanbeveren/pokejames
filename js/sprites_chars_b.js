// Overworld character sprites (batch B): man, woman, oldman, clerk, nurse, chef, hoodie.
// 16x16, Gen 1/2 Game Boy proportions: big head (~40% of height), 7px-wide body, feet on row 15.
// Palette keys (engine recolors these): k outline, s skin, h hair, t shirt/top, p pants, e shoes, w white, a accent.
(function () {
  const S = window.SPRITES = window.SPRITES || {};

  // ---- small helpers to build exact-length row strings without manual counting ----
  const D = n => '.'.repeat(n);               // n transparent chars
  const J = arr => arr.join('');               // join an array of 1-char tokens (mixed pattern rows)

  // ================= shared HEAD shapes (rows 0-7, 16 wide) =================
  // Front-facing head (used for 'down'), standard size, eyes visible.
  function headDownStd() {
    return [
      D(16),                                             // row0 (empty margin)
      D(5) + 'k'.repeat(6) + D(5),                        // row1 hair top taper
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4), // row2 hair
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4), // row3 hair
      D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4), // row4 forehead/sideburns
      D(4) + J(['k', 's', 'w', 's', 's', 'w', 's', 'k']) + D(4), // row5 eyes
      D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4), // row6 cheeks/chin
      D(5) + 'k'.repeat(6) + D(5),                        // row7 chin taper
    ];
  }
  // Back-of-head (used for 'up'), solid hair dome, no face.
  function headUpStd() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
      D(5) + 'k'.repeat(6) + D(5),
    ];
  }
  // Side (left-facing) head: face/nose bump toward the left edge, hair mass toward the back (right).
  function headLeftStd() {
    return [
      D(16),
      D(5) + 'k'.repeat(6) + D(5),                                     // row1
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),        // row2 hair
      D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),        // row3 hair
      D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),        // row4 face(left) / hair(back-right)
      D(3) + J(['k', 's', 'w', 's', 's', 'h', 'h', 'h', 'k']) + D(4),   // row5 nose bump + eye + hair back
      D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),        // row6 jaw / hair back
      D(5) + 'k'.repeat(6) + D(5),                                     // row7
    ];
  }

  // ================= shared TORSO (rows 8-11, width varies) =================
  // Row 11 uses 'g' (shirt shadow — an extra key, distinct from both 't' and 'p' in every era)
  // for a subtle 2-tone hem: light falls top-left, so the shirt reads darker along the bottom.
  function torsoStd() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),                    // row8 collar (8w)
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),                    // row9 shoulders (10w)
      D(3) + 's' + 't'.repeat(8) + 's' + D(3),                    // row10 arms/hands (10w)
      D(4) + 'k' + 'g'.repeat(6) + 'k' + D(4),                    // row11 waist taper, shadow tone (8w)
    ];
  }
  // Long-hair variant: hair spills over the shoulders (woman).
  function torsoLongHair() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
      D(2) + 'h' + 'k' + 't'.repeat(8) + 'k' + 'h' + D(2),
      D(2) + 'h' + 's' + 't'.repeat(8) + 's' + 'h' + D(2),
      D(4) + 'k' + 'g'.repeat(6) + 'k' + D(4),
    ];
  }

  // ================= shared PANTS + SHOES (rows 12-15) =================
  function pantsStd() {
    return [
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),   // row12 waist
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),   // row13 thighs
    ];
  }
  function shoesStand() {
    return [
      D(4) + 'k' + 'e'.repeat(6) + 'k' + D(4),   // row14 feet together
      D(5) + 'k'.repeat(6) + D(5),               // row15 sole
    ];
  }
  // Full walk leg block (rows 12-15): legs split apart with a real transparent gap (not just an
  // outline pixel) so the step reads in every era, including the 4-shade Game Boy mode where
  // outline and shoe color can share a shade. Front/planted foot is bigger and reaches row15;
  // back/tucked foot is smaller and lifts off the ground (no row15 pixels under it).
  function legsWalk() {
    return [
      D(4) + 'k' + 'p'.repeat(6) + 'k' + D(4),                                     // row12 hip (joined)
      D(4) + J(['k', 'p', 'p', '.', '.', 'p', 'p', 'k']) + D(4),                    // row13 thighs start to split
      D(4) + J(['k', 'e', 'e', 'e', '.', 'e', 'e', 'k']) + D(4),                    // row14 feet, gap between
      D(4) + 'k'.repeat(4) + D(8),                                                  // row15 sole only under planted foot
    ];
  }
  // Left-facing legs: whole leg block nudged left; walk = front foot forward+down, back foot tucked short.
  function legsLeftStand() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),   // row12
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),   // row13
      D(3) + 'k' + 'e'.repeat(6) + 'k' + D(5),   // row14
      D(4) + 'k'.repeat(6) + D(6),               // row15
    ];
  }
  function legsLeftWalk() {
    return [
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),                                   // row12 (waist unchanged)
      D(3) + 'k' + 'p'.repeat(6) + 'k' + D(5),                                   // row13 (thighs unchanged)
      D(2) + J(['k', 'e', 'e', 'e', 'e', 'k']) + D(2) + J(['k', 'e', 'e', 'k']) + D(2), // row14 front foot fwd, back foot tucked
      D(2) + 'k'.repeat(4) + D(10),                                              // row15 sole only under front foot
    ];
  }

  function assemble(...parts) {
    return [].concat(...parts);
  }

  // Overwrite a single column with `ch` across a row range — used for the old man's cane, which
  // is held just outside the (deliberately narrower) torso silhouette. Safe because every base
  // row this is applied to has that column transparent already.
  function withCol(rows, col, fromRow, toRow, ch) {
    const out = rows.slice();
    for (let r = fromRow; r <= toRow; r++) out[r] = out[r].slice(0, col) + ch + out[r].slice(col + 1);
    return out;
  }

  // ================= narrower torso (oldman: slighter, stooped build) =================
  function torsoThin() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),                          // row8 collar (8w)
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),                          // row9 shoulders, no flare (8w)
      D(4) + J(['s', 't', 't', 't', 't', 't', 't', 's']) + D(4),        // row10 arms close to body (8w)
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),                          // row11 waist (8w)
    ];
  }

  // ================= bigger torso (chef: broad build) =================
  function torsoChefBig() {
    return [
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),                                                    // row8 collar (10w)
      D(2) + 'k' + 't'.repeat(10) + 'k' + D(2),                                                    // row9 big shoulders (12w)
      D(2) + J(['s', 't', 't', 'a', 'a', 'a', 'a', 'a', 'a', 't', 't', 'n']) + D(2),                // row10 apron + tongs hand (12w)
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),                                                     // row11 apron waist (8w)
    ];
  }
  function torsoChefBigPlain() {
    return [
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),
      D(2) + 'k' + 't'.repeat(10) + 'k' + D(2),
      D(2) + 's' + 't'.repeat(10) + 's' + D(2),
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),
    ];
  }

  // ================= vest torso (clerk) =================
  function torsoVest() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),                                              // row8 shirt collar (8w)
      D(3) + J(['k', 't', 'a', 'a', 'a', 'a', 'a', 'a', 't', 'k']) + D(3),                   // row9 vest over shirt (10w)
      D(3) + J(['s', 't', 'a', 'a', 'a', 'a', 'a', 'a', 't', 's']) + D(3),                   // row10 vest + hands (10w)
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),                                               // row11 vest waist (8w)
    ];
  }

  // ================= apron torso (nurse) =================
  function torsoApron() {
    return [
      D(4) + 'k' + 't'.repeat(6) + 'k' + D(4),                                              // row8 dress collar (8w)
      D(3) + J(['k', 't', 'a', 'a', 'a', 'a', 'a', 'a', 't', 'k']) + D(3),                   // row9 apron bib (10w)
      D(3) + J(['s', 't', 'a', 'a', 'a', 'a', 'a', 'a', 't', 's']) + D(3),                   // row10 apron + hands (10w)
      D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),                                               // row11 apron waist (8w)
    ];
  }

  // ================= hoodie torso (headphones around the neck) =================
  function torsoHoodie() {
    return [
      D(3) + J(['a', 'k', 't', 't', 't', 't', 't', 't', 'k', 'a']) + D(3),   // row8 collar + headphone cups (10w)
      D(3) + 'k' + 't'.repeat(8) + 'k' + D(3),                              // row9 shoulders (10w)
      D(3) + 's' + 't'.repeat(8) + 's' + D(3),                              // row10 arms/hands (10w)
      D(4) + 'k' + 'g'.repeat(6) + 'k' + D(4),                              // row11 waist, shadow tone (8w)
    ];
  }

  // shade-vs-shade sanity note (kept as a comment, not code): every character below
  // uses k=0, w=3, s=3, with h/t/p/e/a spread across 0-2 so neighboring parts split apart in DMG.

  // =====================================================================
  // MAN — generic adult man, short brown hair, blue shirt, slate trousers.
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f8c088:3', h: '#6a4028:1', t: '#4878c0:2',
      p: '#585868:1', e: '#302018:0', w: '#f8f8f8:3', g: '#2c4878:0',
    };
    S['man_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoStd(), pantsStd(), shoesStand()) };
    S['man_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoStd(), legsWalk()) };
    S['man_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoStd(), pantsStd(), shoesStand()) };
    S['man_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoStd(), legsWalk()) };
    S['man_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftStd(), torsoStd(), legsLeftStand()) };
    S['man_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftStd(), torsoStd(), legsLeftWalk()) };
  }

  // =====================================================================
  // WOMAN — generic adult woman, long auburn hair, pink top, blue pants.
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f8c8a0:3', h: '#9a3828:1', t: '#d85888:2',
      p: '#4858a8:1', e: '#302018:0', w: '#f8f8f8:3', g: '#902850:0',
    };
    S['woman_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoLongHair(), pantsStd(), shoesStand()) };
    S['woman_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoLongHair(), legsWalk()) };
    S['woman_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoLongHair(), pantsStd(), shoesStand()) };
    S['woman_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoLongHair(), legsWalk()) };
    S['woman_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftStd(), torsoLongHair(), legsLeftStand()) };
    S['woman_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftStd(), torsoLongHair(), legsLeftWalk()) };
  }

  // =====================================================================
  // OLDMAN — elderly, white/gray hair, balding, cardigan, walks with a cane.
  // Body deliberately thinner (torsoThin) and a cane column added outside
  // the silhouette (col 12) from shoulder to ground, on every facing.
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f0c8a0:3', h: '#d0d0d0:2', t: '#8a6848:1',
      p: '#606878:2', e: '#302018:0', a: '#785838:1', w: '#f8f8f8:3',
    };
    // balding front head: less hair on row3 (skin shows through)
    function headDownOld() {
      const r = headDownStd();
      r[3] = D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4);
      return r;
    }
    function headLeftOld() {
      const r = headLeftStd();
      r[3] = D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4);
      return r;
    }
    const cane = rows => withCol(rows, 12, 9, 15, 'a');
    S['oldman_down_0'] = { w: 16, h: 16, pal, rows: cane(assemble(headDownOld(), torsoThin(), pantsStd(), shoesStand())) };
    S['oldman_down_1'] = { w: 16, h: 16, pal, rows: cane(assemble(headDownOld(), torsoThin(), legsWalk())) };
    S['oldman_up_0'] = { w: 16, h: 16, pal, rows: cane(assemble(headUpStd(), torsoThin(), pantsStd(), shoesStand())) };
    S['oldman_up_1'] = { w: 16, h: 16, pal, rows: cane(assemble(headUpStd(), torsoThin(), legsWalk())) };
    S['oldman_left_0'] = { w: 16, h: 16, pal, rows: cane(assemble(headLeftOld(), torsoThin(), legsLeftStand())) };
    S['oldman_left_1'] = { w: 16, h: 16, pal, rows: cane(assemble(headLeftOld(), torsoThin(), legsLeftWalk())) };
  }

  // =====================================================================
  // CLERK — shop clerk: blue vest + flat cap over a light shirt.
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f8c090:3', h: '#241c10:0', t: '#dce6ee:2',
      a: '#3868b0:1', p: '#40405c:2', e: '#241810:0', w: '#f8f8f8:3',
    };
    function headDownClerk() {
      return [
        D(16),
        D(3) + J(['k', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'k']) + D(3), // row1 cap brim (10w)
        D(4) + J(['k', 'a', 'a', 'a', 'a', 'a', 'a', 'k']) + D(4),          // row2 cap band
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),          // row3 hair under cap
        D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),          // row4 forehead
        D(4) + J(['k', 's', 'w', 's', 's', 'w', 's', 'k']) + D(4),          // row5 eyes
        D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),          // row6 chin
        D(5) + 'k'.repeat(6) + D(5),                                        // row7
      ];
    }
    function headUpClerk() {
      return [
        D(16),
        D(3) + 'k' + 'a'.repeat(8) + 'k' + D(3),
        D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    function headLeftClerk() {
      return [
        D(16),
        D(3) + 'k' + 'a'.repeat(8) + 'k' + D(3),
        D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
        D(3) + J(['k', 's', 'w', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    S['clerk_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownClerk(), torsoVest(), pantsStd(), shoesStand()) };
    S['clerk_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownClerk(), torsoVest(), legsWalk()) };
    S['clerk_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpClerk(), torsoVest(), pantsStd(), shoesStand()) };
    S['clerk_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpClerk(), torsoVest(), legsWalk()) };
    S['clerk_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftClerk(), torsoVest(), legsLeftStand()) };
    S['clerk_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftClerk(), torsoVest(), legsLeftWalk()) };
  }

  // =====================================================================
  // NURSE — sanctuary caretaker: pink/white outfit, little cap with a heart mark.
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f8c8a0:3', h: '#5a3820:1', t: '#f088a8:2',
      a: '#ffffff:3', p: '#c05878:1', e: '#f0f0f0:3', w: '#f8f8f8:3',
    };
    function headDownNurse() {
      return [
        D(16),
        D(5) + J(['a', 'a', 't', 't', 'a', 'a']) + D(5),           // row1 cap w/ tiny pink heart mark
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 'w', 's', 's', 'w', 's', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    function headUpNurse() {
      return [
        D(16),
        D(5) + J(['a', 'a', 't', 't', 'a', 'a']) + D(5),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    function headLeftNurse() {
      return [
        D(16),
        D(5) + J(['a', 'a', 't', 't', 'a', 'a']) + D(5),
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
        D(3) + J(['k', 's', 'w', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    S['nurse_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownNurse(), torsoApron(), pantsStd(), shoesStand()) };
    S['nurse_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownNurse(), torsoApron(), legsWalk()) };
    S['nurse_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpNurse(), torsoApron(), pantsStd(), shoesStand()) };
    S['nurse_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpNurse(), torsoApron(), legsWalk()) };
    S['nurse_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftNurse(), torsoApron(), legsLeftStand()) };
    S['nurse_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftNurse(), torsoApron(), legsLeftWalk()) };
  }

  // =====================================================================
  // CHEF — bigger build, tall white hat, apron, tongs in one hand.
  // Extra key: n = tongs (metal).
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f0b888:3', h: '#4a3018:1', t: '#d8d0c0:2',
      a: '#f8f8f8:3', p: '#484848:1', e: '#241810:0', n: '#a8a8b0:2', w: '#f8f8f8:3',
    };
    function headDownChef() {
      return [
        D(6) + 'a'.repeat(4) + D(6),                                  // row0 hat poof
        D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),                       // row1 hat band
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),     // row2 hair under hat
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),     // row3 hair
        D(4) + J(['k', 'h', 's', 's', 's', 's', 'h', 'k']) + D(4),     // row4 forehead
        D(4) + J(['k', 's', 'w', 's', 's', 'w', 's', 'k']) + D(4),     // row5 eyes
        D(4) + J(['k', 's', 's', 's', 's', 's', 's', 'k']) + D(4),     // row6 chin
        D(5) + 'k'.repeat(6) + D(5),                                   // row7
      ];
    }
    function headUpChef() {
      return [
        D(6) + 'a'.repeat(4) + D(6),
        D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(4) + 'k' + 'h'.repeat(6) + 'k' + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    function headLeftChef() {
      return [
        D(6) + 'a'.repeat(4) + D(6),
        D(4) + 'k' + 'a'.repeat(6) + 'k' + D(4),
        D(4) + J(['k', 'h', 'h', 'h', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
        D(3) + J(['k', 's', 'w', 's', 's', 'h', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
        D(4) + J(['k', 's', 's', 's', 's', 'h', 'h', 'k']) + D(4),
        D(5) + 'k'.repeat(6) + D(5),
      ];
    }
    S['chef_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownChef(), torsoChefBig(), pantsStd(), shoesStand()) };
    S['chef_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownChef(), torsoChefBig(), legsWalk()) };
    S['chef_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpChef(), torsoChefBigPlain(), pantsStd(), shoesStand()) };
    S['chef_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpChef(), torsoChefBigPlain(), legsWalk()) };
    S['chef_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftChef(), torsoChefBig(), legsLeftStand()) };
    S['chef_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftChef(), torsoChefBig(), legsLeftWalk()) };
  }

  // =====================================================================
  // HOODIE — developer/activist: purple hoodie (hood down), headphones
  // around the neck, jeans. The 'tech nonprofit' look.
  // =====================================================================
  {
    const pal = {
      k: '#000000:0', s: '#f0b888:3', h: '#2c2418:1', t: '#6840a0:1',
      p: '#3858a0:2', e: '#302018:0', a: '#484850:1', w: '#f8f8f8:3', g: '#402060:0',
    };
    S['hoodie_down_0'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoHoodie(), pantsStd(), shoesStand()) };
    S['hoodie_down_1'] = { w: 16, h: 16, pal, rows: assemble(headDownStd(), torsoHoodie(), legsWalk()) };
    S['hoodie_up_0'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoHoodie(), pantsStd(), shoesStand()) };
    S['hoodie_up_1'] = { w: 16, h: 16, pal, rows: assemble(headUpStd(), torsoHoodie(), legsWalk()) };
    S['hoodie_left_0'] = { w: 16, h: 16, pal, rows: assemble(headLeftStd(), torsoHoodie(), legsLeftStand()) };
    S['hoodie_left_1'] = { w: 16, h: 16, pal, rows: assemble(headLeftStd(), torsoHoodie(), legsLeftWalk()) };
  }
})();
