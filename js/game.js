// Story scripts, interactions, save/load, boot.
(function () {
  'use strict';
  const S = window.SCRIPTS = {};
  const A = () => window.AUDIO;
  const SAVE_KEY = 'hacktivists_violet_save_v1';
  const say = (l, o) => UI.say(l, o);

  // ---------- generic interactions ----------
  S.talk = function* (e) {
    if (e.faceOnTalk) G.faceEach(e, G.player);
    if (e.trainer && !G.state.defeated[e.id]) { yield* S.trainerBattle(e); return; }
    if (e.def && e.def.quote) { yield* S.sayQuote(e); return; }
    if (e.script && S[e.script]) { yield* S[e.script](e); return; }
    if (e.def && e.def.gift && !G.flag(e.def.gift.flag)) {
      yield* say(e.def.gift.lines || e.dialog || ['...']);
      const g = e.def.gift; G.addItem(g.item, g.qty || 1); G.flag(g.flag, true);
      if (A()) A().sfx('pickup');
      yield* say([G.state.name + ' received ' + (g.qty > 1 ? g.qty + ' ' : '') + g.item + '!']);
      if (g.after) yield* say(g.after);
      return;
    }
    let d = e.dialog;
    if (typeof d === 'function') d = d(G);
    if (e.trainer && G.state.defeated[e.id]) d = e.trainer.after || [DATA.SKEPTICS[e.trainer.class].after];
    if (!d && e.def && e.def.gift) d = e.def.gift.after || e.def.gift.lines;
    if (!d) d = ['...'];
    yield* say(d);
  };
  S.readSign = function* (o) { let t = o.text; if (typeof t === 'function') t = t(G); yield* say(t || ['...']); };
  S.pickItem = function* (o) {
    G.state.picked[o.id] = true;
    const qty = o.qty || 1;
    if (o.item === 'VEGAN BEANS') { G.addItem('VEGAN BEANS', qty); if (A()) A().sfx('beans'); yield* say([G.state.name + ' found VEGAN BEANS! (' + G.state.beans + '/' + DATA.TOTAL_BEANS + ')']); yield* S.beanRewards(); return; }
    G.addItem(o.item, qty); if (A()) A().sfx('pickup');
    yield* say([G.state.name + ' found ' + (qty > 1 ? qty + ' ' : '') + o.item + '!']);
  };
  S.beanRewards = function* () {
    const b = G.state.beans;
    if (b >= 10 && !G.flag('bike_reward')) { G.flag('bike_reward', true); G.state.bike = true; G.addItem('BIKE'); if (A()) A().sfx('levelup'); yield* say(['10 beans! A BIKE unfolded from... somewhere?', G.state.name + ' got the BIKE! Press SELECT or use it from the BAG to ride.']); }
    if (b >= DATA.TOTAL_BEANS && !G.flag('all_beans')) { G.flag('all_beans', true); G.state.money += 5000; if (A()) A().sfx('levelup'); yield* say(['ALL the VEGAN BEANS! The bean spirits are pleased.', G.state.name + ' found $5000 tucked in the bean jar!']); }
  };
  S.wildEncounter = function* (enc) {
    const total = enc.table.reduce((s, r) => s + r[3], 0); let r = Math.random() * total; let row = enc.table[0];
    for (const t of enc.table) { r -= t[3]; if (r <= 0) { row = t; break; } }
    const lvl = row[1] + Math.floor(Math.random() * (row[2] - row[1] + 1));
    yield* BATTLE.wild(row[0], lvl);
  };
  S.approach = function* (e) { // walk up to the player until adjacent
    let guard = 0;
    while (guard++ < 10) {
      const dx = G.player.x - e.x, dy = G.player.y - e.y;
      if (Math.abs(dx) + Math.abs(dy) <= 1) break;
      const free = (dir) => {   // never come to rest in a doorway or on a warp
        const [ddx, ddy] = G.DIRS[dir];
        return !G.warpAt(e.x + ddx, e.y + ddy) && G.startMove(e, dir, { force: true });
      };
      const first = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const second = Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 'down' : dy < 0 ? 'up' : null) : (dx > 0 ? 'right' : dx < 0 ? 'left' : null);
      if (!free(first) && !(second && free(second))) { e.dir = first; break; }
      while (e.moving) yield null;
    }
    G.faceEach(e, G.player); G.faceEach(G.player, e);
  };
  // Walk an entity to a tile, stepping around whatever is in the way and giving up
  // if it cannot get closer (someone standing on the target, usually).
  S.walkTo = function* (e, tx, ty, maxSteps) {
    let guard = 0;
    while ((e.x !== tx || e.y !== ty) && guard++ < (maxSteps || 24)) {
      const dx = tx - e.x, dy = ty - e.y;
      const h = dx > 0 ? 'right' : dx < 0 ? 'left' : null;
      const v = dy > 0 ? 'down' : dy < 0 ? 'up' : null;
      const order = Math.abs(dx) > Math.abs(dy) ? [h, v] : [v, h];
      let moved = false;
      for (const d of order) if (d && G.startMove(e, d, { force: true })) { moved = true; break; }
      if (!moved) break;
      while (e.moving) yield null;
    }
  };
  // Lead someone across a room: the follower steps into the tile the leader just
  // left. (A moving entity occupies both its tiles, so they cannot step at once.)
  S.leadAlong = function* (lead, dirs, follower) {
    for (const d of dirs) {
      const from = { x: lead.x, y: lead.y };
      if (!G.startMove(lead, d, { force: true })) { lead.dir = d; continue; }
      while (lead.moving) yield null;
      const fx = from.x - follower.x, fy = from.y - follower.y;
      const fd = fx === 1 ? 'right' : fx === -1 ? 'left' : fy === 1 ? 'down' : fy === -1 ? 'up' : null;
      if (fd && G.startMove(follower, fd, { force: true })) { while (follower.moving) yield null; }
    }
  };

  S.trainerSpot = function* (e) {
    G.showEmote(e, 'emote_alert', 40); if (A()) A().sfx('exclaim');
    yield* G.wait(30);
    yield* S.approach(e);
    yield* S.trainerBattle(e);
  };
  S.greetKey = e => 'greeted_' + (e.def.team || e.id);
  S.sayQuote = function* (e) { G.flag(S.greetKey(e), true); yield* say(e.def.quote); };
  S.greetSpot = function* (e) {
    G.showEmote(e, 'emote_heart', 45); if (A()) A().sfx('charm');
    yield* G.wait(30);
    yield* S.approach(e);
    yield* S.sayQuote(e);
  };
  S.trainerBattle = function* (e) {
    const t = e.trainer; const sk = DATA.SKEPTICS[t.class];
    if (!G.state.party.length) { yield* say(t.intro || [sk.taunt]); yield* say(['...but you have no animals to introduce. Come back later!']); return; }
    if (t.intro) yield* say(t.intro);
    const r = yield* BATTLE.trainer({ skeptic: t.class, name: t.name || sk.name, level: t.level, taunt: t.taunt, win: t.win, music: t.music, prizeMult: t.prizeMult });
    if (r === 'won') {
      G.state.defeated[e.id] = true;
      if (t.after) yield* say(t.after);
      if (t.onWin && S[t.onWin]) yield* S[t.onWin](e);
    }
  };

  // ---------- save / load ----------
  S.saveGame = function* () {
    const tb = yield* UI.sayHold(['Would you like to SAVE the game?']);
    const yes = yield* UI.yesNo(); G.pop(tb);
    if (!yes) return;
    yield* say(['SAVING... Don\'t turn off the power!'], { auto: 30 });
    if (!S.doSave()) { yield* say(['The save failed! Your browser may be blocking storage.']); return; }
    if (A()) A().sfx('save');
    yield* say([G.state.name + ' saved the game!']);
  };
  S.doSave = function () {
    const st = G.state; st.x = G.player.x; st.y = G.player.y; st.dir = G.player.dir; st.map = G.map.id;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); return true; } catch (e) { console.warn('save failed', e); return false; }
  };
  S.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  S.loadSave = () => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!s || typeof s !== 'object') return null;
      const base = G.newState(); const st = Object.assign(base, s);
      for (const k of ['flags', 'picked', 'defeated']) if (!st[k] || typeof st[k] !== 'object') st[k] = {};
      st.dex = Object.assign({ seen: {}, rescued: {} }, s.dex || {});
      st.options = Object.assign({ textSpeed: 2, sound: true, animations: true }, s.options || {});
      for (const k of ['items', 'party', 'sanctuary', 'badges']) if (!Array.isArray(st[k])) st[k] = [];
      S.lastLoadDropped = 0;
      for (const k of ['party', 'sanctuary']) {
        const kept = st[k].filter(a => a && DATA.SPECIES[a.species]);
        S.lastLoadDropped += st[k].length - kept.length;
        st[k] = kept;
      }
      return st;
    } catch (e) { return null; }
  };

  // ---------- sanctuary storage PC ----------
  S.usePC = function* () {
    if (A()) A().sfx('confirm');
    yield* say([G.state.name + ' turned on the PC.']);
    while (true) {
      const c = yield* UI.choose(['WITHDRAW', 'DEPOSIT', 'MAIL', 'LOG OFF'], { x: 0, y: 0 });
      if (c === 0) {
        if (!G.state.sanctuary.length) { yield* say(['No animals are resting in the SANCTUARY.']); continue; }
        if (G.state.party.length >= 6) { yield* say(['Your party is full!']); continue; }
        const r = yield* UI.chooseList(G.state.sanctuary.map((a, i) => ({ label: a.nick, right: 'L' + a.level, value: i })), { x: G.VW - 120, y: 0, w: 120, pageSize: 5, title: 'SANCTUARY' });
        if (!r) continue;
        const a = G.state.sanctuary.splice(r.value, 1)[0]; G.state.party.push(a); yield* say([a.nick + ' joined the party!']);
      } else if (c === 1) {
        if (G.state.party.length <= 1) { yield* say(['You need at least one animal with you!']); continue; }
        const i = yield* UI.party('select', { msg: 'Deposit which?' }); if (i === null) continue;
        const a = G.state.party.splice(i, 1)[0]; G.state.sanctuary.push(a); yield* say([a.nick + ' is resting at the SANCTUARY.']); G.refreshFollower();
      } else if (c === 2) {
        yield* say(['1 new mail!', 'From: THE WHOLE TEAM', 'Subject: Happy Birthday!!!', G.state.name + ', thank you for everything you do for the animals and for us. Now go rescue some friends!']);
      } else break;
    }
    yield* say([G.state.name + ' turned off the PC.']);
  };

  // ---------- Sanctuary Center ----------
  S.center = function* (e) {
    yield* say(['Welcome to our SANCTUARY CENTER!', 'We help tired animals feel fighting fit!']);
    const tb = yield* UI.sayHold(['Shall we look after your animals?']);
    const yes = yield* UI.yesNo(); G.pop(tb);
    if (!yes) { yield* say(['We hope to see you again!']); return; }
    if (!G.state.party.length) { yield* say(['...you have no animals with you! But you are always welcome.']); return; }
    yield* say(['OK, I\'ll take your animals for a few seconds.'], { auto: 30 });
    const prevDir = e.dir; e.dir = 'up';
    if (A()) { A().stopMusic(); A().sfx('heal'); }
    for (let i = 0; i < 4; i++) { G.flash = 0.6; yield* G.wait(22); }
    for (const a of G.state.party) { a.hp = a.maxHp; for (const m of a.moves) m.pp = m.maxPp; }
    e.dir = prevDir;
    if (A()) A().playMusic(G.map.music);
    G.state.lastCenter = { map: G.map.id, x: G.player.x, y: G.player.y, dir: 'down' };
    yield* say(['Thank you! Your animals are happy and healthy!', 'We hope to see you again!']);
  };

  // ---------- Vegan Mart ----------
  S.mart = function* (e) {
    const stock = (e.def && e.def.stock) || ['NOOCH', 'CARROT', 'SEEDS', 'LETTUCE', 'OATS'];
    yield* say(['Welcome to the VEGAN MART! Everything here is 100% plant-based. How may I help you?'], { auto: 0 });
    while (true) {
      const c = yield* UI.choose(['BUY', 'SELL', 'QUIT'], { x: 0, y: 0 });
      if (c === 0) {
        while (true) {
          const rows = stock.map(id => ({ label: id, right: '$' + DATA.ITEMS[id].price, value: id }));
          const tb = G.push(new UI.Textbox(['Take your time.'], { hold: true, instant: true }));
          const r = yield* UI.chooseList(rows, { x: 0, y: 0, w: G.VW, pageSize: 4, title: 'MONEY $' + G.state.money });
          G.pop(tb);
          if (!r) break;
          const item = DATA.ITEMS[r.value];
          const room = 99 - G.itemQty(r.value);
          if (room < 1) { yield* say(['You can\'t carry any more of those!']); continue; }
          const maxQ = Math.min(room, Math.floor(G.state.money / item.price));
          if (maxQ < 1) { yield* say(['You don\'t have enough money.']); continue; }
          const tb2 = G.push(new UI.Textbox([r.value + '? How many?'], { hold: true, instant: true }));
          const q = yield* UI.quantity(maxQ, item.price); G.pop(tb2);
          if (!q) continue;
          const tb3 = yield* UI.sayHold([r.value + '? That will be $' + (q * item.price) + '. OK?']);
          const ok = yield* UI.yesNo(); G.pop(tb3);
          if (!ok) continue;
          if (!G.state.cheats) G.state.money -= q * item.price;   // cheat money never drops
          G.addItem(r.value, q); if (A()) A().sfx('confirm');
          yield* say(['Here you are! Thank you!']);
        }
      } else if (c === 1) {
        while (true) {
          const rows = G.state.items.filter(it => !DATA.ITEMS[it.id].key && DATA.ITEMS[it.id].price > 0).map(it => ({ label: it.id, right: '×' + it.qty, value: it.id }));
          if (!rows.length) { yield* say(['You have nothing to sell.']); break; }
          const tb = G.push(new UI.Textbox(['What would you like to sell?'], { hold: true, instant: true }));
          const r = yield* UI.chooseList(rows, { x: 0, y: 0, w: G.VW, pageSize: 4, title: 'MONEY $' + G.state.money }); G.pop(tb);
          if (!r) break;
          const price = Math.floor(DATA.ITEMS[r.value].price / 2);
          const tb2 = G.push(new UI.Textbox([r.value + '? How many?'], { hold: true, instant: true }));
          const q = yield* UI.quantity(G.itemQty(r.value), price); G.pop(tb2);
          if (!q) continue;
          const tb3 = yield* UI.sayHold(['I can pay $' + (q * price) + '. OK?']);
          const ok = yield* UI.yesNo(); G.pop(tb3);
          if (!ok) continue;
          G.removeItem(r.value, q); G.state.money += q * price; if (A()) A().sfx('confirm');
          yield* say(['Thank you!']);
        }
      } else break;
    }
    yield* say(['Thank you! Come again!']);
  };

  // ---------- map hooks ----------
  S.onEnterMap = function (id) { };
  S.onEraUnlock = function* (prevEra, newEra) {
    if (G.flag('era' + newEra + '_seen')) { G.setEra(newEra); G.refreshFollower(); return; }
    G.setEra(prevEra);
    yield* G.fadeIn(12);
    if (newEra === 1) {
      yield* say(['...', 'Huh? Something feels different here...']);
      if (A()) A().sfx('levelup');
      G.flash = 1.2; G.setEra(1); yield* G.wait(20);
      yield* say(['The world is in COLOR!', 'VERDANT TOWN — where the color comes from.']);
    } else if (newEra === 2) {
      yield* say(['...', 'Whoa. The air feels crisper. The colors deeper.']);
      if (A()) A().sfx('levelup');
      G.flash = 1.2; G.setEra(2); yield* G.wait(20);
      yield* say(['Everything looks EVEN BETTER!', 'Welcome to VIOLET CITY. Hold B to run!']);
    }
    G.refreshFollower();
    G.flag('era' + newEra + '_seen', true);
    yield* G.fadeOut(1);
  };

  // ---------- story: intro ----------
  S.intro = function* () {
    G.state = G.newState(); G.follower = null;
    if (A()) A().playMusic('intro');
    // Intro portraits are drawn at a whole-number scale so they keep their shape.
    // They are 17x26 sprites; the old code forced them into a 48x48 box, which
    // stretched them 2.8x wide but only 1.9x tall -- hence the squashed professor.
    // 'prof_intro' is used when a dedicated portrait exists, else the overworld sprite.
    const portrait = (name, fallback) => function () {
      G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff');
      const c = G.getSprite(G.hasSprite(name) ? name : fallback);
      if (!c) return;
      const scale = Math.max(1, Math.floor(58 / c.height));
      const pw = c.width * scale, ph = c.height * scale;
      G.ctx.drawImage(c, Math.round(G.VW / 2 - pw / 2), Math.round(14 + (58 - ph) / 2), pw, ph);
    };
    const w = { fullscreen: true, draw: portrait('prof_intro', 'prof_down_0') };
    G.push(w); yield* G.fadeIn(12);
    yield* say(['Hello there! Welcome to the world of ANIMALS!', 'My name is OAT! People call me the ANIMAL PROF!']);
    yield* say(['This world is inhabited all over by creatures called ANIMALS!', 'For some people, animals are FOOD. For us... they are FRIENDS.']);
    yield* say(['Myself... I study them as a profession. And I love them. A lot.']);
    const tb = yield* UI.sayHold(['First, what is your name?']);
    const c = yield* UI.choose(['NEW NAME', 'JAMES', 'ED', 'NOOCH'], { x: 0, y: 0, cancel: false }); G.pop(tb);
    let name = ['', 'JAMES', 'ED', 'NOOCH'][c];
    if (c === 0) name = yield* UI.nameEntry('YOUR NAME?', 'JAMES');
    G.state.name = name;
    yield* say(['Right! So your name is ' + name + '!']);
    w.draw = portrait('rival_intro', 'hoodie_down_0');
    yield* say(['This is my grandson... no, wait. This is DAVID.', 'He used to be fun to hang out with but now all he does is talk about AI.']);
    yield* say(['He has been your rival since you were... hired. Erm, what was his name again?']);
    const tb2 = yield* UI.sayHold(['His name?']);
    const c2 = yield* UI.choose(['NEW NAME', 'DAVID', 'FOUNDER', 'BOSS'], { x: 0, y: 0, cancel: false }); G.pop(tb2);
    let rival = ['', 'DAVID', 'FOUNDER', 'BOSS'][c2];
    if (c2 === 0) rival = yield* UI.nameEntry('RIVAL NAME?', 'DAVID');
    G.state.rival = rival; DATA.SKEPTICS.RIVAL.name = rival;
    yield* say(['That\'s right! I remember now! His name is ' + rival + '!']);
    w.draw = portrait('hero_intro', 'hero_down_0');
    yield* say([name + '! Your very own tale of KINDNESS is about to unfold!', 'A world of animals awaits! Let\'s go!']);
    yield* G.fadeOut(20); G.pop(w);
    G.mode = 'game';
    G.loadMap('player_house_2f', 3, 4, 'down');
    yield* G.wait(10); yield* G.fadeIn(16);
  };

  // ---------- story: Pallet Town ----------
  S.prof_stop = function* (trig) {
    if (G.flag('starter')) return null;
    const p = G.player;
    yield* say(['PROF. OAT: Hey! Wait! Don\'t go out!']);
    // professor appears behind the player
    const prof = G.makeEntity({ id: 'prof_tmp', sprite: 'prof', x: p.x, y: p.y + 2, dir: 'up', move: 'static' });
    if (G.isSolid(prof.x, prof.y, prof) || G.entityAt(prof.x, prof.y, prof)) { prof.x = p.x + 1; prof.y = p.y + 1; }
    G.entities.push(prof);
    p.dir = 'down';
    yield* G.walk(prof, ['up']);
    G.faceEach(prof, p); G.faceEach(p, prof);
    yield* say(['PROF. OAT: It\'s unsafe! Wild ANIMALS live in tall grass!', 'They are hungry, scared, and they need a friend who knows what they\'re doing!']);
    yield* say(['PROF. OAT: I know! Here, come with me!']);
    yield* G.fadeOut(16);
    G.entities = G.entities.filter(e => e !== prof);
    G.loadMap('lab', 5, 8, 'up');
    const labProf = G.entities.find(e => e.id === 'prof');
    if (labProf) { labProf.x = 5; labProf.y = 7; labProf.dir = 'up'; }
    yield* G.fadeIn(16);
    yield* say(['PROF. OAT: Come on through. They are right over here.']);
    if (labProf) {
      yield* S.leadAlong(labProf, ['up', 'left'], G.player);   // he leads, you follow him to the table
      labProf.dir = 'up'; G.player.dir = 'up';
      yield* G.wait(12);
    }
    yield* say(['PROF. OAT: ' + G.state.name + '! Here, on the table, are 3 animals I rescued this morning.', 'They each need a home... and a friend. Go on! Choose one!']);
    G.flag('choose_starter', true);
    return true;
  };
  S.lab_prof = function* (e) {
    if (G.flag('starter')) { yield* say(['PROF. OAT: Head north to VERDANT TOWN! The SANCTUARY CENTER there heals tired animals.', 'And say hi to the team for me!']); return; }
    if (G.flag('choose_starter')) { yield* say(['PROF. OAT: Go on! Pick an animal from the table!']); return; }
    yield* say(['PROF. OAT: Oh, ' + G.state.name + '! I was about to come and find you.', 'Try heading north and I\'ll... no wait. Actually, come here. Look at the table!']);
    G.flag('choose_starter', true);
  };
  S.pick_starter = function* (o) {
    if (G.flag('starter')) { yield* say(['The basket is empty. Just some hay.']); return; }
    if (!G.flag('choose_starter')) { yield* say(['A little ' + DATA.SPECIES[o.species].name + ' is snoozing in the basket.']); return; }
    const sp = DATA.SPECIES[o.species];
    yield* say(['A little ' + sp.name + ' looks up at you.', sp.entry]);
    const tb = yield* UI.sayHold(['Do you want to take ' + sp.name + ' with you?']);
    const yes = yield* UI.yesNo(); G.pop(tb);
    if (!yes) return;
    const a = DATA.makeAnimal(o.species, 5);
    if (A()) A().sfx(sp.cry);
    yield* say(['PROF. OAT: This ' + sp.name + ' is really energetic!']);
    const tb2 = yield* UI.sayHold(['Give a nickname to ' + sp.name + '?']);
    const nn = yield* UI.yesNo(); G.pop(tb2);
    if (nn) a.nick = yield* UI.nameEntry(sp.name + "'s nickname?", sp.name, 8);
    G.state.party.push(a); G.state.dex.seen[o.species] = true; G.state.dex.rescued[o.species] = true;
    G.state.picked[o.id] = true;                       // its ball leaves the table for good
    if (A()) A().sfx('rescue');
    yield* say([G.state.name + ' received ' + a.nick + '!']);
    G.flag('starter', true); G.flag('starter_species', o.species);
    // rival takes another
    const rival = G.entities.find(e => e.id === 'rival');
    const others = ['TOAD', 'SALAMANDER', 'TURTLE'].filter(s => s !== o.species);
    const rs = others[Math.floor(Math.random() * others.length)];
    if (rival) {
      if (A()) A().playMusic('rival');
      yield* say([G.state.rival + ': Ha! Then I\'ll take ' + rs + '!']);
      const rBall = G.map.objects.find(x => x.type === 'item' && x.species === rs);
      if (rBall) {
        yield* S.walkTo(rival, rBall.x, rBall.y + 1);    // up to the table
        rival.dir = 'up';
        yield* G.wait(16);
        G.state.picked[rBall.id] = true;                 // and his ball is gone too
        if (A()) A().sfx('pickup');
        G.showEmote(rival, 'emote_heart', 40);
        yield* G.wait(24);
        yield* S.walkTo(rival, G.player.x, G.player.y + 1);
      }
      G.faceEach(rival, G.player);
      yield* say([G.state.rival + ': ' + G.state.name + '! Let\'s see whose animal is happier! Come on, I\'ll take you on!']);
      const r = yield* BATTLE.trainer({ skeptic: 'RIVAL', name: G.state.rival, level: 4, music: 'rival', taunt: 'Let\'s see whose animal is happier!', win: 'Okay, okay. Yours is happier. For now!' });
      if (A()) A().playMusic(G.map.music);
      if (r === 'won') {
        yield* say([G.state.rival + ': I\'m going to rescue WAY more animals than you!', G.state.rival + ': Smell ya later!']);
        yield* G.walk(rival, ['down', 'down', 'down', 'down', 'down']);
        rival.hidden = true;
      }
    }
    yield* say(['PROF. OAT: ' + G.state.name + ', take this too. It\'s the FRIENDDEX!', 'It records every animal you meet and rescue. It has 3 NOOCH tucked in the back pocket.']);
    G.flag('has_dex', true); G.addItem('NOOCH', 3); G.addItem('CARROT', 3); G.addItem('SEEDS', 3); G.addItem('APPLE', 2);
    if (A()) A().sfx('levelup');
    yield* say([G.state.name + ' got the FRIENDDEX, 3 NOOCH and some snacks!']);
    yield* say(['PROF. OAT: In tall grass you\'ll meet hungry animals. FEED them or HELP them until they trust you.', 'Some people will argue with you. Let your animal\'s charm do the talking!', 'Now go! Head north to VERDANT TOWN. The team is waiting!']);
    G.flag('choose_starter', false);
  };
  S.mom = function* (e) {
    if (!G.flag('starter')) { yield* say(['ABBIE: ' + G.state.name + '! You\'re finally up. I let you sleep in.', 'ABBIE: PROF. OAT next door was looking for you. Off you go!']); return; }
    yield* say(['ABBIE: All activists leave home someday. It\'s written in the bylaws.', 'ABBIE: Go on, save the world. I\'ll keep the kettle on.', 'ABBIE: Rest up before you go!'], { auto: 0 });
    if (G.state.party.length) { if (A()) A().sfx('heal'); for (const a of G.state.party) { a.hp = a.maxHp; for (const m of a.moves) m.pp = m.maxPp; } yield* say(['Your animals are happy and healthy!']); }
    yield* say(['ABBIE: Rescue lots of friends! And eat something — there are cookies in the jar. I made them.']);
  };

  // ---------- Route 2 sleeping cow ----------
  S.sleeping_cow = function* (e) {
    if (G.flag('cow_gone')) return;
    yield* say(['An enormous DUCK is fast asleep across the path. Zzz...']);
    if (!G.hasItem('OATS')) { yield* say(['It looks hungry, even in its sleep. Maybe the VEGAN MART sells something they would like.']); return; }
    const tb = yield* UI.sayHold(['Offer some OATS?']);
    const yes = yield* UI.yesNo(); G.pop(tb);
    if (!yes) return;
    G.removeItem('OATS');
    if (A()) A().sfx('cry_bunny');
    yield* say(['The DUCK sniffed... and woke up!', 'It yawns, enormously, and blinks down at you.']);
    const r = yield* BATTLE.wild('DUCK', 12, { intro: 'It looks like it needs a friend.' });
    G.flag('cow_gone', true);
    e.hidden = true;
    if (r !== 'rescued') yield* say(['The DUCK ambled off to nap somewhere quieter. The path is clear!']);
    else yield* say(['The path is clear!']);
  };

  // ---------- Rival on Route 2 ----------
  S.rival_route2 = function* (trig) {
    if (G.flag('rival2') || !G.flag('starter')) return null;
    G.flag('rival2', true);
    const p = G.player;
    if (A()) A().playMusic('rival');
    yield* say([G.state.rival + ': Hey! ' + G.state.name + '!']);
    const rival = G.makeEntity({ id: 'rival_tmp', sprite: 'hoodie', x: p.x, y: p.y - 4, dir: 'down', move: 'static' });
    G.entities.push(rival);
    yield* G.walk(rival, ['down', 'down', 'down']);
    p.dir = 'up';
    yield* say([G.state.rival + ': My animals are SO happy. They have their own Discord server.', G.state.rival + ': Let\'s see how yours are doing!']);
    const r = yield* BATTLE.trainer({ skeptic: 'RIVAL', name: G.state.rival, level: 9, music: 'rival', taunt: 'Let\'s see how yours are doing!', win: 'Okay... they do look happy. Fine!' });
    if (A()) A().playMusic(G.map.music);
    if (r === 'won') { yield* say([G.state.rival + ': Hmph. I\'ll be in VIOLET CITY. Something is happening there... you\'ll see!']); yield* G.walk(rival, ['up', 'up', 'up', 'up']); }
    G.entities = G.entities.filter(e => e !== rival);
    return true;
  };

  // ---------- Rival: the VH HQ ambush ----------
  S.rival_vh = function* (trig) {
    if (G.flag('rival3') || !G.flag('starter')) return null;
    G.flag('rival3', true);
    if (A()) A().playMusic('rival');
    yield* say([G.state.rival + ': ' + G.state.name + '! Don\'t you walk past me.']);
    const rival = G.makeEntity(Object.assign({}, window.TEAM && TEAM.david, {
      id: 'rival_hq', x: 6, y: 3, dir: 'down', move: 'static' }));
    G.entities.push(rival);
    yield* S.approach(rival);
    yield* say([G.state.rival + ': So you think you\'re hot stuff after your OPERATIONS DIRECTOR days?',
      G.state.rival + ': Let me offer you a slice of vegan humble pie!']);
    const r = yield* BATTLE.trainer({ skeptic: 'RIVAL', name: G.state.rival, level: 16, music: 'rival',
      taunt: 'Let me offer you a slice of vegan humble pie!',
      win: 'Okay. That pie was for me. I see that now.' });
    if (A()) A().playMusic(G.map.music);
    if (r === 'won') yield* say([G.state.rival + ': Fine. FINE. Not bad, but just so you know the sun was in my eyes!',
      G.state.rival + ': ...don\'t let that go to your head.']);
    rival.move = 'wander'; rival.range = 2;   // he sticks around to be talked to
    return true;
  };

  // ---------- Pigeon statue ----------
  S.pigeon_statue = function* (o) {
    if (G.flag('pigeon_done')) { yield* say(['A statue of a pigeon. The plaque reads: "Underrated. Unbothered."']); return; }
    yield* say(['A PIGEON is perched on the statue, looking iridescent and unbothered.']);
    if (!G.hasItem('SEEDS')) { yield* say(['It eyes your empty hands with disappointment.']); return; }
    const tb = yield* UI.sayHold(['Offer some SEEDS?']);
    const yes = yield* UI.yesNo(); G.pop(tb);
    if (!yes) return;
    const r = yield* BATTLE.wild('PLESIOSAUR', 30, { intro: 'It is judging you. Kindly.', music: 'gym' });
    if (r === 'rescued') { G.flag('pigeon_done', true); yield* say(['The legendary PIGEON chose you. The city will never be the same.']); }
    else yield* say(['The PIGEON returned to its statue. It will wait. Pigeons are patient.']);
  };

  // ---------- Gym ----------
  S.gym_win = function* (e) {
    G.state.badges.push('COMPASSION'); G.addItem('COMPASSION BADGE'); G.addItem('PARTY INVITE');
    if (A()) A().sfx('levelup');
    yield* say([G.state.name + ' received the COMPASSION BADGE!', 'CHEF: And take this... a PARTY INVITE. Everyone is waiting for you at the VIOLET HALL. Go on!']);
    G.flag('badge', true);
  };
  S.hall_door = function* (o) {
    if (G.flag('badge')) return null;
    yield* say(['The door is locked. A note reads: "Come back with the COMPASSION BADGE!"']);
    yield* G.walk(G.player, ['down']);
    return true;
  };

  // ---------- Finale ----------
  S.party_enter = function* (trig) {
    if (G.flag('party_done')) return null;
    G.flag('party_done', true);
    const p = G.player;
    G.fade.alpha = 0.75;
    if (A()) A().stopMusic();
    yield* say(['...', 'It\'s dark in here.']);
    yield* G.walk(p, ['up', 'up']);
    yield* say(['...?']);
    G.flash = 1.5; G.fade.alpha = 0;
    if (A()) { A().sfx('cake'); A().playMusic('party'); }
    yield* G.wait(20);
    yield* say(['EVERYONE: SURPRISE!!!', 'EVERYONE: HAPPY BIRTHDAY, ' + G.state.name + '!']);
    for (const e of G.entities) { if (e !== p && !e.follower) G.showEmote(e, 'emote_heart', 90); }
    yield* G.wait(60);
    yield* say(['KATE: We made you a game. It has ' + Object.keys(DATA.SPECIES).length + ' animals and zero nutritional value.']);
    yield* say([G.state.rival + ': I told you something was happening in VIOLET CITY!']);
    yield* say(['GABRIELĖ: The cake is vegan. The NOOCH is vegan. Even the pixels are vegan.']);
    yield* say(['VIKRAM: Bella says woof. That\'s "happy birthday" in dog.']);
    yield* say(['EVERYONE: Thank you for everything you do for the animals... and for us!']);
    // big banner window
    const w = { fullscreen: false, t: 0, update() { this.t++; }, draw() { const s = 2; const t1 = 'HAPPY BIRTHDAY'; const t2 = G.state.name + '!'; UI.drawTextScaled(t1, Math.round(G.VW / 2 - t1.length * 8), 12, s, G.era === 0 ? G.DMG[0] : (Math.floor(this.t / 10) % 2 ? '#c03060' : '#8a5cd6')); UI.drawTextScaled(t2, Math.round(G.VW / 2 - t2.length * 8), 34, s, G.era === 0 ? G.DMG[0] : '#8a5cd6'); } };
    G.push(w); yield* G.wait(200); G.pop(w);
    yield* say(['A birthday jingle plays. Someone is crying. It is DAVID.']);
    yield* S.credits();
    yield* say(['The party continues! Talk to everyone. Happy Birthday!']);
    return true;
  };
  S.credits = function* () {
    const lines = ['HACKTIVISTS', 'VIOLET VERSION', '', 'a birthday game for', 'JAMES MORGAN', 'Executive Director', 'Vegan Hacktivists', '', 'made with ♥ by', 'the Vegan Hacktivists', '& Violet Studios teams', '', 'STARRING', 'David van Beveren', 'Kate Rodman', 'Gabrielė Bernotaitė', 'Michael Webermann', 'Vikram Singh', 'Tobias Frohme', 'Jérémy Touati', 'Steven Rouk', 'Richie Manandhar-Richardson', 'Mike Wigmore', 'Aaron Cahill', 'Ximena Rodríguez', 'Elizabeth Leach', 'Thomas van den Heuvel', 'Luuly Truong', 'Lucas Barbosa', 'Chloë Cudaback', 'Dee Cox', '', 'and every animal', 'you rescued', '', 'No animals were harmed.', 'Several were fed.', '', 'HAPPY BIRTHDAY!', '♥ ♥ ♥'];
    const w = { fullscreen: true, t: 0, closed: false, update() { this.t += G.input.held('a') ? 3 : 1; if (this.t > lines.length * 14 + G.VH) this.closed = true; if (G.input.pressed('start')) this.closed = true; }, draw() { G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[0] : '#101018'); lines.forEach((l, i) => { const y = G.VH - this.t + i * 14; if (y > -10 && y < G.VH) G.drawText(l, Math.round(G.VW / 2 - l.length * 4), y, '#ffffff'); }); } };
    G.push(w); yield* G.fadeIn(1); while (!w.closed) yield null; G.pop(w);
  };

  // ---------- dev shortcut ----------
  // index.html?map=violet drops you straight into a map, kitted out, skipping the story.
  // Optional: &x=&y= to pick the tile, &party=TOAD,SALAMANDER &level=25 &name=JAMES
  S.findSpawn = function (m) {
    const prev = G.map; G.map = m;
    const cx = Math.floor(m.w / 2), cy = Math.floor(m.h / 2);
    let best = { x: 1, y: 1 };
    outer:
    for (let r = 0; r < Math.max(m.w, m.h); r++)
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 1 || y < 1 || x >= m.w - 1 || y >= m.h - 1) continue;
        if (!G.isSolid(x, y) && !G.warpAt(x, y) && !G.triggerAt(x, y)) { best = { x, y }; break outer; }
      }
    G.map = prev;
    return best;
  };
  S.devWarp = function* () {
    let q; try { q = new URLSearchParams(window.location.search); } catch (e) { return false; }
    const id = q.get('map');
    if (!id || !window.MAPS[id]) return false;
    G.state = G.newState(); G.follower = null;
    G.state.name = q.get('name') || 'JAMES';
    DATA.SKEPTICS.RIVAL.name = G.state.rival;
    G.flag('starter', true); G.flag('has_dex', true);
    const lvl = Math.max(2, Math.min(100, parseInt(q.get('level') || '20', 10) || 20));
    for (const sp of (q.get('party') || 'TOAD,SALAMANDER,TURTLE').split(','))
      if (DATA.SPECIES[sp]) G.state.party.push(DATA.makeAnimal(sp, lvl));
    for (const it of ['NOOCH', 'SUPER NOOCH', 'B12 SHOT', 'SEEDS', 'OATS', 'APPLE', 'CARROT']) G.addItem(it, 10);
    G.state.money = 9999;
    const m = G.compileMap(id);
    let x = parseInt(q.get('x'), 10), y = parseInt(q.get('y'), 10);
    if (!(x >= 0) || !(y >= 0)) { const p = S.findSpawn(m); x = p.x; y = p.y; }
    G.mode = 'game';
    G.loadMap(id, x, y, 'down');
    yield* G.wait(6); yield* G.fadeIn(16);
    yield* say(['DEV WARP: ' + (m.name || id) + '. Reload without ?map= to play properly.']);
    return true;
  };

  // ---------- main flow ----------
  S.main = function* () {
    if (yield* S.devWarp()) return;
    while (true) {
      G.mode = 'title'; G.setEra(G.era);
      if (A()) A().playMusic('intro');
      yield* UI.title();
      const has = S.hasSave() && !!S.loadSave();
      const items = has ? ['CONTINUE', 'NEW GAME', 'OPTION'] : ['NEW GAME', 'OPTION'];
      const c = yield* UI.choose(items, { x: 8, y: 8, cancel: true });
      const act = c < 0 ? null : items[c];
      if (act === 'OPTION') { yield* UI.options(); continue; }
      if (act === 'CONTINUE') {
        const st = S.loadSave();
        if (!st) { yield* say(['The save data could not be read. Please start a NEW GAME.']); continue; }
        DATA.SKEPTICS.RIVAL.name = st.rival || 'DAVID';
        st.options.sound = !G.mutePref();   // the M key's setting outlives the save
        yield* G.fadeOut(12);
        const prev = G.state; G.state = st; G.follower = null;
        let ok = true;
        try { G.loadMap(window.MAPS[st.map] ? st.map : 'player_house_2f', window.MAPS[st.map] ? st.x : 3, window.MAPS[st.map] ? st.y : 4, st.dir || 'down'); }
        catch (e) { console.warn('load failed', e); ok = false; }
        if (!ok) { G.state = prev; G.setEra(0); yield* G.fadeIn(6); yield* say(['The save data could not be loaded. Please start a NEW GAME.']); continue; }
        G.mode = 'game'; G.refreshFollower();
        yield* G.fadeIn(12);
        if (S.lastLoadDropped) yield* say([S.lastLoadDropped + (S.lastLoadDropped === 1 ? ' animal was' : ' animals were') + " left out of this save: the FRIENDDEX changed and they couldn't be found.", 'Everything else is just as you left it.']);
        return;
      }
      if (act === 'NEW GAME') {
        if (has) { const tb = yield* UI.sayHold(['Start a new game? The old save will be replaced when you next SAVE.'], { y: G.VH - 48 }); const ok = yield* UI.yesNo(); G.pop(tb); if (!ok) continue; }
        yield* G.fadeOut(12);
        yield* S.intro();
        return;
      }
    }
  };

  // ---------- boot ----------
  window.addEventListener('load', () => {
    // count beans across all maps
    let total = 0;
    for (const id of Object.keys(window.MAPS || {})) for (const o of (MAPS[id].objects || [])) if (o.type === 'item' && o.item === 'VEGAN BEANS') total += o.qty || 1;
    DATA.TOTAL_BEANS = total;
    G.start();
    G.applyMutePref();
    G.runScript(S.main());
    document.getElementById('loading').hidden = true;
  });
})();
