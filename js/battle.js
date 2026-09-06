// Encounters: wild animals (feed / help / rescue) and outreach debates with skeptics.
(function () {
  'use strict';
  const B = window.BATTLE = {};
  const A = () => window.AUDIO;
  const rnd = n => Math.floor(Math.random() * n);

  function damage(level, power, atk, def, mult) {
    const base = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * power * atk / Math.max(1, def)) / 50) + 2;
    return Math.max(1, Math.floor(base * mult * (0.85 + Math.random() * 0.15)));
  }
  function styleMult(style, sk) { if (!sk) return 1; if (sk.weak === style) return 2; if (sk.resist === style) return 0.75; return 1; }

  // ---------- screen ----------
  class BattleScreen {
    constructor(S) { this.S = S; this.fullscreen = true; }
    draw() {
      const S = this.S; const VW = G.VW, VH = G.VH;
      G.fillRect(0, 0, VW, VH, G.era === 0 ? G.DMG[3] : '#ffffff');
      if (G.era === 2) { // GBA: soft ground ellipses
        G.fillRect(0, 0, VW, VH, '#f0f4f8');
        const c = G.ctx; c.fillStyle = '#cfe0c0';
        c.beginPath(); c.ellipse(VW - 40, 50, 36, 6, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(40, VH - 50, 44, 7, 0, 0, Math.PI * 2); c.fill();
      }
      // enemy sprite
      if (S.enemyVisible) {
        const ex = VW - 56 - 8 + S.enemyOff;
        G.drawSprite(S.enemySprite, ex, 4, { alpha: S.enemyAlpha });
      }
      // enemy info
      if (S.enemyInfo) {
        const maxName = Math.floor((VW - 72) / 8);
        G.drawText(S.enemyName.length > maxName ? S.enemyName.slice(0, maxName) : S.enemyName, 8, 6);
        G.drawText('L' + S.enemy.level, 8, 16);
        if (S.kind === 'wild') UI.drawHPBar(40, 18, 48, S.trustShown / 100, { fill: G.era === 0 ? undefined : '#e060a0' });
        else UI.drawHPBar(40, 18, 48, S.enemyHpShown / S.enemyMaxHp);
        G.fillRect(8, 35, 88, 1, G.era === 0 ? G.DMG[0] : '#000000');
      }
      // player side
      if (S.heroVisible) { const bd = window.SPRITES.back_hero; const bw = bd ? bd.w : 48, bh = bd ? bd.h : 48; const bx0 = Math.max(0, Math.min(8, VW - 96 - bw - 2)); const by0 = Math.max(40, VH - 48 - bh + 10); /* lowest rows tuck under the text box */ G.drawSprite('back_hero', bx0 + S.heroOff, by0); }
      if (S.mineVisible && S.mine) G.drawSprite(S.mineSprite, 8 + S.mineOff, VH - 48 - 48, { alpha: S.mineAlpha });
      if (S.mineInfo && S.mine) {
        const bx = VW - 96;
        G.drawText(S.mine.nick, bx + 8, VH - 90); G.drawText('L' + S.mine.level, bx + 56, VH - 80);
        G.drawText('HP', bx + 8, VH - 72); UI.drawHPBar(bx + 32, VH - 70, 48, S.mineHpShown / S.mine.maxHp);
        G.drawText(String(Math.round(S.mineHpShown)).padStart(3, ' ') + '/' + String(S.mine.maxHp).padStart(3, ' '), bx + 24, VH - 62);
        G.fillRect(bx, VH - 52, 96, 1, G.era === 0 ? G.DMG[0] : '#000000');
      }
      // persistent message box background
      G.drawBox(0, VH - 48, VW, 48);
    }
  }

  // ---------- helpers ----------
  function* animateBar(S, key, target, speed) {
    speed = speed || 1;
    while (Math.abs(S[key] - target) > 0.01) { S[key] += Math.sign(target - S[key]) * Math.min(Math.abs(target - S[key]), speed); yield null; }
    S[key] = target;
  }
  function* msg(S, text, opts) { yield* UI.say([text], Object.assign({ auto: 40 }, opts || {})); }
  function* msgWait(S, text) { yield* UI.say([text]); }
  function activeIdx() { return G.state.party.findIndex(a => a.hp > 0); }
  function* sendOut(S, a, first) {
    S.mine = a; S.mineSprite = 'back_' + a.species.toLowerCase(); S.mineHpShown = a.hp; S.mineInfo = false; S.mineVisible = false;
    if (first) { yield* msg(S, 'Go! ' + a.nick + '!'); for (let i = 0; i <= 8; i++) { S.heroOff = -i * 8; yield null; } S.heroVisible = false; }
    else yield* msg(S, 'Go! ' + a.nick + '!');
    S.mineVisible = true; S.mineOff = 0; S.mineAlpha = 1; for (let i = 0; i < 6; i++) { S.mineAlpha = i % 2 ? 1 : 0.3; yield null; yield null; } S.mineAlpha = 1;
    S.mineInfo = true; const spOut = DATA.SPECIES[a.species]; if (A() && spOut) A().sfx(spOut.cry); yield* G.wait(12);
  }
  function* recallMine(S, text) { yield* msg(S, text); S.mineVisible = false; S.mineInfo = false; yield* G.wait(6); }
  function* gainExp(S, amount) {
    const a = S.mine; if (!a || a.hp <= 0) return;
    a.exp += amount; if (A()) A().sfx('charm');
    yield* msg(S, a.nick + ' gained ' + amount + ' VEGAN XP!');
    while (a.level < 100 && a.exp >= DATA.expForLevel(a.level + 1)) {
      a.level++; DATA.recalcStats(a); S.mineHpShown = a.hp; if (A()) A().sfx('levelup');
      yield* msgWait(S, a.nick + ' grew to level ' + a.level + '!');
      yield* B.learnMoves(a, S);
    }
  }
  B.learnMoves = function* (a, S) {
    const sp = DATA.SPECIES[a.species];
    if (!sp) return;
    for (const [lvl, mv] of sp.moves) {
      if (lvl !== a.level || a.moves.some(m => m.id === mv)) continue;
      if (a.moves.length < 4) { a.moves.push({ id: mv, pp: DATA.MOVES[mv].pp, maxPp: DATA.MOVES[mv].pp }); if (A()) A().sfx('pickup'); yield* msgWait(S, a.nick + ' learned ' + mv + '!'); continue; }
      yield* msgWait(S, a.nick + ' wants to learn ' + mv + ', but it already knows 4 charms.');
      const tb = yield* UI.sayHold(['Forget a charm to make room for ' + mv + '?']);
      const yes = yield* UI.yesNo(); G.pop(tb);
      if (!yes) { yield* msgWait(S, a.nick + ' did not learn ' + mv + '.'); continue; }
      const r = yield* UI.chooseList(a.moves.map(m => ({ label: m.id, value: m.id })), { x: G.VW - 120, y: 0, w: 120, pageSize: 4, title: 'Forget which?' });
      if (!r) { yield* msgWait(S, a.nick + ' did not learn ' + mv + '.'); continue; }
      const i = a.moves.findIndex(m => m.id === r.value); a.moves[i] = { id: mv, pp: DATA.MOVES[mv].pp, maxPp: DATA.MOVES[mv].pp };
      yield* msgWait(S, '1, 2 and... Poof! ' + a.nick + ' forgot ' + r.value + ' and learned ' + mv + '!');
    }
  };
  function* useCharm(S, move, target) {
    // returns damage dealt (trainer) or trust gained (wild)
    const md = DATA.MOVES[move.id]; move.pp = Math.max(0, move.pp - 1);
    yield* msg(S, md.msg.replace('{A}', S.mine.nick));
    if (A()) A().sfx('charm');
    // little bounce animation
    for (let i = 0; i < 8; i++) { S.mineOff = (i % 2 ? 2 : -2); yield null; } S.mineOff = 0;
    if (S.kind === 'wild') {
      let gain = Math.floor(md.power / 2) + 6;
      const ek = DATA.SPECIES[S.enemy.species], mk = DATA.SPECIES[S.mine.species];
      if (ek && mk && ek.kind === mk.kind) gain += 10;
      return gain;
    }
    const mult = styleMult(md.style, S.skeptic);
    const dmg = damage(S.mine.level, md.power, S.mine.atk, S.enemyDef, mult);
    for (let i = 0; i < 6; i++) { S.enemyOff = i % 2 ? 3 : -3; yield null; yield null; } S.enemyOff = 0;
    if (A()) A().sfx('hit');
    return { dmg, mult };
  }

  // ---------- transition ----------
  B.transition = function* () {
    if (A()) A().sfx('exclaim');
    for (let i = 0; i < 3; i++) { G.invert = true; yield* G.wait(4); G.invert = false; yield* G.wait(4); }
    yield* G.fadeOut(12);
  };

  // ---------- wild encounter ----------
  B.wild = function* (speciesId, level, opts) {
    opts = opts || {};
    const st = G.state;
    const enemy = DATA.makeAnimal(speciesId, level);
    const sp = DATA.SPECIES[speciesId];
    st.dex.seen[speciesId] = true;
    const S = { kind: 'wild', enemy, enemySprite: 'front_' + speciesId.toLowerCase(), enemyName: sp.name, trust: 0, trustShown: 0, enemyOff: 60, enemyAlpha: 1, enemyVisible: true, enemyInfo: false, heroVisible: true, heroOff: -60, mineVisible: false, mineInfo: false, mineOff: 0, mineAlpha: 1, turn: 0 };
    const screen = new BattleScreen(S);
    yield* B.transition();
    const prevMusic = A() ? A().currentMusic() : null;
    if (A()) A().playMusic(opts.music || 'wild');
    G.push(screen); yield* G.fadeIn(10);
    for (let i = 0; i <= 15; i++) { S.enemyOff = 60 - i * 4; S.heroOff = -60 + i * 4; yield null; }
    S.enemyOff = 0; S.heroOff = 0; S.enemyInfo = true;
    if (A()) A().sfx(sp.cry);
    yield* msgWait(S, (sp.legendary ? 'A legendary ' : 'A wild ') + sp.name + ' appeared!');
    yield* msg(S, opts.intro || ['It looks hungry!', 'It looks a little lost.', 'It seems scared.', 'It looks like it needs a friend.'][rnd(4)]);
    let idx = activeIdx(); if (idx < 0) idx = 0;
    if (idx !== 0) { const t = st.party[0]; st.party[0] = st.party[idx]; st.party[idx] = t; }
    yield* sendOut(S, st.party[0], true);
    let outcome = null; // 'rescued' | 'fled' | 'wandered'
    while (!outcome) {
      S.turn++;
      const c = yield* UI.chooseGrid(['FEED', 'HELP', 'ANIMAL', 'RUN'], { x: G.VW - 112, y: G.VH - 48, w: 112, h: 48, cursor: S.lastCursor || 0 });
      S.lastCursor = c < 0 ? 0 : c;
      let acted = false;
      if (c === 0) {
        const food = yield* UI.bag({ pick: true, filter: d => d.use === 'food', title: 'FOOD', emptyMsg: 'You have no food to give!' });
        if (food) {
          G.removeItem(food);
          const rel = sp.foods.fav === food ? 'fav' : sp.foods.like === food ? 'like' : 'other';
          const gain = DATA.FOOD_TRUST[rel];
          yield* msg(S, st.name + ' offered ' + food + '.');
          if (A()) A().sfx(sp.cry);
          yield* msg(S, rel === 'fav' ? sp.name + ' LOVES it! Its favorite!' : rel === 'like' ? sp.name + ' happily munched it.' : sp.name + ' nibbled politely.');
          S.trust = Math.min(100, S.trust + gain); yield* animateBar(S, 'trustShown', S.trust, 2); acted = true;
        }
      } else if (c === 1) {
        const mv = yield* B.chooseMove(S);
        if (mv) { const gain = yield* useCharm(S, mv); yield* msg(S, sp.name + ' relaxed a little.'); S.trust = Math.min(100, S.trust + gain); yield* animateBar(S, 'trustShown', S.trust, 2); acted = true; }
      } else if (c === 2) {
        const i = yield* UI.party('battle', { msg: 'Send out which?' });
        if (i !== null && i !== 0) { if (st.party[i].hp <= 0) { yield* msg(S, st.party[i].nick + ' is too tired!'); } else { const t = st.party[0]; st.party[0] = st.party[i]; st.party[i] = t; yield* recallMine(S, 'Come back, ' + S.mine.nick + '!'); yield* sendOut(S, st.party[0], false); acted = true; } }
      } else if (c === 3) {
        yield* msg(S, st.name + ' quietly stepped away.'); outcome = 'fled'; break;
      }
      if (!acted) continue;
      if (S.trust >= 100) {
        if (A()) A().sfx('rescue');
        for (let i = 0; i < 8; i++) { S.enemyAlpha = i % 2 ? 1 : 0.4; yield* G.wait(3); } S.enemyAlpha = 1;
        yield* msgWait(S, sp.name + ' trusts you now!');
        outcome = 'rescued'; break;
      }
      // wild animal's turn
      const flavor = [sp.name + ' twitched. It is watching you.', sp.name + ' looks a little less scared.', sp.name + ' made a small sound.', sp.name + ' sniffed the air.', sp.name + ' tilted its head curiously.'];
      if (S.turn >= 6 && S.trust < 50 && Math.random() < 0.3) { yield* msgWait(S, sp.name + ' wandered off...'); outcome = 'wandered'; break; }
      yield* msg(S, flavor[rnd(flavor.length)]);
    }
    if (outcome === 'rescued') {
      st.dex.rescued[speciesId] = true;
      yield* msgWait(S, sp.name + ' joined your SANCTUARY!');
      const donation = Math.max(5, Math.round((8 + level * 2.5) / 5) * 5);
      st.money += donation;
      yield* msgWait(S, 'A grateful passer-by donated $' + donation + ' to the sanctuary!');
      const expGain = Math.floor(sp.baseExp * level / 7 * 1.6) + 10; yield* gainExp(S, expGain);
      const tb = yield* UI.sayHold(['Give a nickname to ' + sp.name + '?']);
      const yes = yield* UI.yesNo(); G.pop(tb);
      if (yes) { const n = yield* UI.nameEntry(sp.name + "'s nickname?", sp.name, 8); enemy.nick = n; }
      if (st.party.length < 6) st.party.push(enemy); else { st.sanctuary.push(enemy); yield* msgWait(S, 'Your party is full. ' + enemy.nick + ' was sent to the SANCTUARY.'); }
      if (opts.onRescue) opts.onRescue();
    }
    yield* G.fadeOut(10); G.pop(screen);
    if (A()) A().playMusic(prevMusic || (G.map && G.map.music));
    yield* B.afterBattle();
    G.refreshFollower();
    yield* G.fadeIn(10);
    return outcome;
  };

  B.chooseMove = function* (S) {
    const a = S.mine;
    if (a.moves.every(m => m.pp <= 0)) { yield* msg(S, a.nick + ' has no charm left in it...'); return { id: 'TIRED SMILE', pp: 1, maxPp: 1 }; }
    // The cursor is remembered between turns, but switching to an animal with fewer
    // charms left it pointing past the end -- and draw() runs outside the script's
    // try/catch, so that took the whole render loop down. Clamp it on the way in.
    const w = { cursor: Math.min(S.moveCursor || 0, a.moves.length - 1), closed: false, result: null, update() {
      const n = a.moves.length;
      if (G.input.repeat('up')) { this.cursor = (this.cursor + n - 1) % n; A() && A().sfx('select'); }
      else if (G.input.repeat('down')) { this.cursor = (this.cursor + 1) % n; A() && A().sfx('select'); }
      else if (G.input.pressed('a')) { const m = a.moves[this.cursor]; if (m.pp <= 0) { A() && A().sfx('bump'); return; } this.result = m; this.closed = true; A() && A().sfx('confirm'); }
      else if (G.input.pressed('b')) { this.closed = true; A() && A().sfx('cancel'); }
    }, draw() {
      const x = G.VW - 128, y = G.VH - 48;
      G.drawBox(x, y, 128, 48);
      a.moves.forEach((m, i) => G.drawText(m.id, x + 16, y + 6 + i * 10, m.pp <= 0 ? '#888888' : undefined));
      G.drawText('▶', x + 8, y + 6 + this.cursor * 10);
      const cur = a.moves[Math.min(this.cursor, a.moves.length - 1)];
      const md = DATA.MOVES[cur.id];
      G.drawBox(0, y - 32, 96, 32); G.drawText('TYPE/' + md.style, 8, y - 24); G.drawText('PP ' + String(cur.pp).padStart(2) + '/' + String(cur.maxPp).padStart(2), 8, y - 14);
    } };
    G.push(w); while (!w.closed) yield null; G.pop(w); S.moveCursor = w.cursor;
    return w.result;
  };

  // ---------- skeptic (trainer) battle ----------
  B.trainer = function* (cfg) {
    // cfg: {skeptic:'BBQ_DAD', name:'BBQ DAD BILL', level, id, music, taunt, win, prizeMult}
    const st = G.state;
    const sk = DATA.SKEPTICS[cfg.skeptic];
    const level = cfg.level;
    const enemy = { level, hp: DATA.calcMaxHp({ hp: sk.base.hp }, level), atk: DATA.calcStat(sk.base.atk, level), def: DATA.calcStat(sk.base.def, level), spd: DATA.calcStat(50, level) };
    enemy.maxHp = enemy.hp;
    const S = { kind: 'trainer', enemy, skeptic: sk, enemySprite: sk.sprite, enemyName: cfg.name || sk.name, enemyHpShown: enemy.hp, enemyMaxHp: enemy.maxHp, enemyDef: enemy.def, enemyOff: 60, enemyAlpha: 1, enemyVisible: true, enemyInfo: false, heroVisible: true, heroOff: -60, mineVisible: false, mineInfo: false, mineOff: 0, mineAlpha: 1, turn: 0 };
    const screen = new BattleScreen(S);
    yield* B.transition();
    const prevMusic = A() ? A().currentMusic() : null;
    if (A()) A().playMusic(cfg.music || 'trainer');
    G.push(screen); yield* G.fadeIn(10);
    for (let i = 0; i <= 15; i++) { S.enemyOff = 60 - i * 4; S.heroOff = -60 + i * 4; yield null; }
    S.enemyOff = 0; S.heroOff = 0;
    yield* msgWait(S, S.enemyName + ' wants to debate!');
    S.enemyInfo = true;
    yield* msgWait(S, S.enemyName + ': ' + (cfg.taunt || sk.taunt));
    let idx = activeIdx(); if (idx < 0) idx = 0;
    if (idx !== 0) { const t = st.party[0]; st.party[0] = st.party[idx]; st.party[idx] = t; }
    yield* sendOut(S, st.party[0], true);
    let outcome = null;
    while (!outcome) {
      S.turn++;
      const c = yield* UI.chooseGrid(['CHARM', 'BAG', 'ANIMAL', 'RUN'], { x: G.VW - 112, y: G.VH - 48, w: 112, h: 48, cursor: S.lastCursor || 0 });
      S.lastCursor = c < 0 ? 0 : c;
      let action = null;
      if (c === 0) { const mv = yield* B.chooseMove(S); if (mv) action = { type: 'move', mv }; }
      else if (c === 1) { const item = yield* UI.bag({ pick: true, filter: d => d.use === 'heal' || d.use === 'revive', title: 'BAG', emptyMsg: 'You have no items to use!' }); if (item) { const used = yield* UI.useItem(item, true); if (used) { S.mineHpShown = S.mine.hp; action = { type: 'item' }; } } }
      else if (c === 2) { const i = yield* UI.party('battle', { msg: 'Send out which?' }); if (i !== null && i !== 0) { if (st.party[i].hp <= 0) { yield* msg(S, st.party[i].nick + ' is too tired!'); } else { const t = st.party[0]; st.party[0] = st.party[i]; st.party[i] = t; yield* recallMine(S, 'Come back, ' + S.mine.nick + '!'); yield* sendOut(S, st.party[0], false); action = { type: 'switch' }; } } }
      else if (c === 3) { yield* msg(S, "No! You can't leave a conversation halfway!"); continue; }
      if (!action) continue;
      // order: player first unless slower (only matters for moves)
      const playerFirst = action.type !== 'move' || S.mine.spd >= enemy.spd || Math.random() < 0.2;
      const doPlayer = function* () {
        if (action.type !== 'move') return;
        const r = yield* useCharm(S, action.mv);
        enemy.hp = Math.max(0, enemy.hp - r.dmg); yield* animateBar(S, 'enemyHpShown', enemy.hp, 2);
        if (r.mult > 1) yield* msg(S, "It's super effective!"); else if (r.mult < 1) yield* msg(S, "It's not very effective...");
      };
      const doEnemy = function* () {
        if (enemy.hp <= 0 || S.mine.hp <= 0) return;
        const arg = sk.args[rnd(sk.args.length)];
        yield* msg(S, arg[2].replace('{S}', S.enemyName));
        for (let i = 0; i < 6; i++) { S.enemyOff = i % 2 ? -2 : 2; yield null; } S.enemyOff = 0;
        const dmg = Math.max(1, Math.round(damage(level, arg[1], enemy.atk, S.mine.def, 1) * 0.8));
        if (A()) A().sfx('hit');
        for (let i = 0; i < 6; i++) { S.mineAlpha = i % 2 ? 1 : 0.3; yield null; yield null; } S.mineAlpha = 1;
        S.mine.hp = Math.max(0, S.mine.hp - dmg); yield* animateBar(S, 'mineHpShown', S.mine.hp, 2);
        yield* msg(S, S.mine.nick + "'s morale dropped!");
      };
      if (playerFirst) { yield* doPlayer(); yield* doEnemy(); } else { yield* doEnemy(); if (S.mine.hp > 0) yield* doPlayer(); }
      if (enemy.hp <= 0) {
        if (A()) A().sfx('faint');
        for (let i = 0; i < 12; i++) { S.enemyAlpha = 1 - i / 12; yield null; yield null; } S.enemyVisible = false;
        yield* msgWait(S, S.enemyName + ' was won over!');
        if (!sk.rival) st.converted++;
        if (A()) A().playMusic(cfg.victoryMusic || 'victory');
        yield* msgWait(S, S.enemyName + ': ' + (cfg.win || sk.win));
        const prize = Math.floor(sk.prize * level * (cfg.prizeMult || 1) / 10) * 5;
        st.money += prize; yield* msgWait(S, st.name + ' got $' + prize + ' for the outreach!');
        yield* gainExp(S, Math.floor(90 * level / 7 * 2.2) + 20);
        outcome = 'won';
      } else if (S.mine.hp <= 0) {
        if (A()) A().sfx('faint');
        yield* msgWait(S, S.mine.nick + ' is too tired to go on!');
        S.mineVisible = false; S.mineInfo = false;
        const next = activeIdx();
        if (next < 0) { yield* msgWait(S, st.name + ' is out of animals with energy!'); outcome = 'lost'; }
        else { const i = yield* UI.party('battle', { msg: 'Send out which?' }); let pick = i; if (pick === null || st.party[pick].hp <= 0) pick = next; const t = st.party[0]; st.party[0] = st.party[pick]; st.party[pick] = t; yield* sendOut(S, st.party[0], false); }
      }
    }
    yield* G.fadeOut(10); G.pop(screen);
    if (outcome === 'won') { if (A()) A().playMusic(prevMusic || G.map.music); yield* B.afterBattle(); G.refreshFollower(); yield* G.fadeIn(10); }
    else { yield* B.whiteout(); }
    return outcome;
  };

  // evolution ("growing up") after battle
  B.afterBattle = function* () {
    for (const a of G.state.party) {
      const sp = DATA.SPECIES[a.species];
      if (!sp || !sp.evolve || a.level < sp.evolve.lvl || a.hp <= 0) continue;
      yield* B.evolve(a);
    }
  };
  B.evolve = function* (a) {
    const from = DATA.SPECIES[a.species], to = DATA.SPECIES[from.evolve.to];
    const S = { from: 'front_' + a.species.toLowerCase(), to: 'front_' + from.evolve.to.toLowerCase(), t: 0, phase: 0 };
    const w = { fullscreen: true, draw() { G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff'); const cx = Math.round(G.VW / 2 - 24), cy = Math.round(G.VH / 2 - 40); const flip = S.phase === 2 || (S.phase === 1 && Math.floor(S.t / (S.t > 60 ? 2 : 8)) % 2 === 1); G.drawSprite(flip ? S.to : S.from, cx, cy, { alpha: S.phase === 1 ? 0.9 : 1 }); if (S.phase === 1 && G.era > 0) { G.ctx.globalCompositeOperation = 'lighter'; G.fillRect(cx, cy, 48, 48, 'rgba(255,255,255,0.35)'); G.ctx.globalCompositeOperation = 'source-over'; } G.drawBox(0, G.VH - 48, G.VW, 48); } };
    G.push(w); yield* G.fadeIn(8);
    if (A()) A().playMusic('evolve');
    yield* UI.say(['What? ' + a.nick + ' is growing up!'], { auto: 60 });
    S.phase = 1; for (S.t = 0; S.t < 120; S.t++) yield null; S.phase = 2;
    const wasNick = a.nick === from.name;
    a.species = from.evolve.to; if (wasNick) a.nick = to.name;
    DATA.recalcStats(a); G.state.dex.seen[a.species] = true; G.state.dex.rescued[a.species] = true;
    if (A()) { A().sfx(to.cry); A().playMusic('victory'); }
    yield* UI.say([from.name + ' grew up into ' + to.name + '!']);
    yield* B.learnMoves(a, null);
    yield* G.fadeOut(8); G.pop(w);
    if (A()) A().playMusic(G.map && G.map.music);
  };

  B.whiteout = function* () {
    const st = G.state;
    for (const a of st.party) a.hp = a.maxHp;
    const c = st.lastCenter || { map: 'player_house_2f', x: 3, y: 4, dir: 'down' };
    const home = !st.lastCenter;   // no SANCTUARY CENTER visited yet: you wake up back at the house
    G.loadMap(c.map, c.x, c.y, c.dir || 'down');
    G.refreshFollower();
    // Fade in BEFORE speaking. The battle leaves the screen fully faded out and
    // G.drawFade paints over every window, so a message shown here used to be an
    // invisible textbox on a black screen -- indistinguishable from a hang.
    yield* G.fadeIn(12);
    yield* UI.say([st.name + "'s animals need a rest!", st.name + (home ? ' hurried back home to ABBIE...' : ' hurried back to the SANCTUARY CENTER...')]);
  };
})();
