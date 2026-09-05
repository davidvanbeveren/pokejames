// UI windows: textbox, menus, lists, party, bag, dex, trainer card, options, name entry, title screen.
(function () {
  'use strict';
  const UI = window.UI = {};
  const A = () => window.AUDIO;

  // ---------- Textbox ----------
  class Textbox {
    constructor(pages, opts) {
      opts = opts || {};
      this.pages = (Array.isArray(pages) ? pages : [pages]).map(p => String(p));
      this.opts = opts;
      this.x = opts.x !== undefined ? opts.x : 0; this.y = opts.y !== undefined ? opts.y : G.VH - 48;
      this.w = opts.w || G.VW; this.h = opts.h || 48;
      this.cols = Math.floor((this.w - 16) / 8);
      this.pageIdx = -1; this.closed = false; this.finished = false; this.waiting = false; this.blink = 0;
      this.nextPage();
    }
    nextPage() {
      this.pageIdx++;
      if (this.pageIdx >= this.pages.length) { this.finished = true; if (!this.opts.hold) this.closed = true; return; }
      this.lines = G.wrapText(this.pages[this.pageIdx], this.cols);
      this.lineIdx = 0; this.shown = this.opts.instant ? 999 : 0; this.waiting = false;
    }
    visible() { return [this.lines[this.lineIdx] || '', this.lines[this.lineIdx + 1] || '']; }
    update() {
      if (this.closed || this.finished) { if (this.finished && this.opts.hold && G.input.pressed('a')) { /* stays */ } return; }
      // START (ESC) closes the whole conversation, mid-sentence or not.
      if (G.input.pressed('start')) { this.finished = true; if (!this.opts.hold) this.closed = true; if (A()) A().sfx('cancel'); return; }
      const [l1, l2] = this.visible(); const total = l1.length + l2.length;
      if (this.shown < total) {
        const sp = G.state.options.textSpeed; // 0 slow 1 mid 2 fast
        const fast = G.input.held('a') || G.input.held('b');
        const rate = fast ? 3 : (sp === 2 ? 1 : sp === 1 ? 0.5 : 0.34);
        this.acc = (this.acc || 0) + rate;
        while (this.acc >= 1 && this.shown < total) { this.acc -= 1; this.shown++; }
        if (this.shown >= total) this.waiting = true;
        return;
      }
      this.waiting = true; this.blink++;
      const more = this.lineIdx + 2 < this.lines.length || this.pageIdx + 1 < this.pages.length;
      const auto = this.opts.auto && this.blink > this.opts.auto;
      if (G.input.pressed('a') || G.input.pressed('b') || auto) {
        if (this.lineIdx + 2 < this.lines.length) { this.lineIdx++; this.shown = this.lines[this.lineIdx].length; this.waiting = false; this.blink = 0; }
        else if (this.pageIdx + 1 < this.pages.length) { this.nextPage(); this.blink = 0; }
        else { this.finished = true; if (!this.opts.hold) this.closed = true; }
        if (more && A()) A().sfx('select');
      }
    }
    draw() {
      G.drawBox(this.x, this.y, this.w, this.h);
      // ESC bails out of the conversation. Only hinted over the overworld: battles and
      // menus are fullscreen and use the top-left corner for their own readouts.
      if (!G.mapBanner && !G.ui.some(w => w.fullscreen)) G.drawText('ESC', 2, 2);
      if (this.pageIdx >= this.pages.length) return;
      const [l1, l2] = this.visible();
      const s1 = l1.slice(0, this.shown), s2 = l2.slice(0, Math.max(0, this.shown - l1.length));
      G.drawText(s1, this.x + 8, this.y + 12); G.drawText(s2, this.x + 8, this.y + 28);
      const more = this.lineIdx + 2 < this.lines.length || this.pageIdx + 1 < this.pages.length;
      if (this.waiting && more && !this.finished && Math.floor(this.blink / 16) % 2 === 0) G.drawText('▼', this.x + this.w - 16, this.y + this.h - 12);
    }
  }
  UI.Textbox = Textbox;
  UI.say = function* (pages, opts) { const tb = G.push(new Textbox(pages, opts)); while (!tb.closed) yield null; G.pop(tb); };
  // keeps the box open after the text; returns it (caller pops)
  UI.sayHold = function* (pages, opts) { const tb = G.push(new Textbox(pages, Object.assign({ hold: true }, opts || {}))); while (!tb.finished) yield null; return tb; };

  // ---------- Menu ----------
  class Menu {
    constructor(items, opts) {
      opts = opts || {};
      this.items = items; this.opts = opts; this.cursor = opts.cursor || 0; this.closed = false; this.result = null;
      const maxLen = Math.max(...items.map(i => i.length));
      this.w = opts.w || (maxLen * 8 + 24); this.h = opts.h || (items.length * 16 + 16);
      this.x = opts.x !== undefined ? opts.x : G.VW - this.w; this.y = opts.y !== undefined ? opts.y : 0;
      this.cancel = opts.cancel !== false; this.fullscreen = !!opts.fullscreen; this.disabled = opts.disabled || [];
    }
    update() {
      const n = this.items.length;
      if (G.input.repeat('up')) { this.cursor = (this.cursor + n - 1) % n; if (A()) A().sfx('select'); }
      else if (G.input.repeat('down')) { this.cursor = (this.cursor + 1) % n; if (A()) A().sfx('select'); }
      else if (G.input.pressed('a')) { if (this.disabled.includes(this.cursor)) { if (A()) A().sfx('bump'); return; } this.result = this.cursor; this.closed = true; if (A()) A().sfx('confirm'); }
      else if (G.input.pressed('b') && this.cancel) { this.result = -1; this.closed = true; if (A()) A().sfx('cancel'); }
      else if (G.input.pressed('start') && this.opts.startCloses) { this.result = -1; this.closed = true; }
    }
    draw() {
      G.drawBox(this.x, this.y, this.w, this.h);
      this.items.forEach((it, i) => G.drawText(it, this.x + 16, this.y + 8 + i * 16, this.disabled.includes(i) ? '#888888' : undefined));
      G.drawText('▶', this.x + 8, this.y + 8 + this.cursor * 16);
      if (this.opts.title) G.drawText(this.opts.title, this.x + 8, this.y - 8);
    }
  }
  UI.Menu = Menu;
  UI.choose = function* (items, opts) { const m = G.push(new Menu(items, opts)); while (!m.closed) yield null; G.pop(m); return m.result; };
  UI.yesNo = function* (opts) {
    opts = Object.assign({ x: 8, y: G.VH - 48 - 40, cursor: 0 }, opts || {});
    const r = yield* UI.choose(['YES', 'NO'], opts); return r === 0;
  };

  // ---------- Grid menu (2x2 battle actions) ----------
  class GridMenu {
    constructor(items, opts) { this.items = items; this.cols = 2; this.cursor = (opts && opts.cursor) || 0; this.closed = false; this.result = null; this.x = opts.x; this.y = opts.y; this.w = opts.w; this.h = opts.h; this.cancel = !!opts.cancel; }
    update() {
      const n = this.items.length;
      if (G.input.pressed('up') && this.cursor >= 2) { this.cursor -= 2; A() && A().sfx('select'); }
      else if (G.input.pressed('down') && this.cursor + 2 < n) { this.cursor += 2; A() && A().sfx('select'); }
      else if (G.input.pressed('left') && this.cursor % 2 === 1) { this.cursor--; A() && A().sfx('select'); }
      else if (G.input.pressed('right') && this.cursor % 2 === 0 && this.cursor + 1 < n) { this.cursor++; A() && A().sfx('select'); }
      else if (G.input.pressed('a')) { this.result = this.cursor; this.closed = true; A() && A().sfx('confirm'); }
      else if (G.input.pressed('b') && this.cancel) { this.result = -1; this.closed = true; A() && A().sfx('cancel'); }
    }
    draw() {
      G.drawBox(this.x, this.y, this.w, this.h);
      this.items.forEach((it, i) => { const cx = this.x + 16 + (i % 2) * 56, cy = this.y + 10 + Math.floor(i / 2) * 16; G.drawText(it, cx, cy); if (i === this.cursor) G.drawText('▶', cx - 8, cy); });
    }
  }
  UI.GridMenu = GridMenu;
  UI.chooseGrid = function* (items, opts) { const m = G.push(new GridMenu(items, opts)); while (!m.closed) yield null; G.pop(m); return m.result; };

  // ---------- List menu (scrollable rows with right-aligned text) ----------
  class ListMenu {
    constructor(rows, opts) {
      opts = opts || {};
      this.rows = rows; // [{label, right, value, disabled}]
      this.opts = opts; this.cursor = 0; this.scroll = 0; this.pageSize = opts.pageSize || 4; this.closed = false; this.result = null;
      this.x = opts.x !== undefined ? opts.x : 0; this.y = opts.y !== undefined ? opts.y : 0; this.w = opts.w || G.VW; this.h = opts.h || (this.pageSize * 16 + 24);
      this.fullscreen = !!opts.fullscreen; this.withCancel = opts.withCancel !== false;
      if (this.withCancel) this.rows = rows.concat([{ label: 'CANCEL', value: null, cancelRow: true }]);
    }
    update() {
      const n = this.rows.length;
      if (G.input.repeat('up') && this.cursor > 0) { this.cursor--; A() && A().sfx('select'); }
      else if (G.input.repeat('down') && this.cursor < n - 1) { this.cursor++; A() && A().sfx('select'); }
      else if (G.input.pressed('a')) { const r = this.rows[this.cursor]; if (r.cancelRow) { this.result = -1; } else if (r.disabled) { A() && A().sfx('bump'); return; } else this.result = this.cursor; this.closed = true; A() && A().sfx('confirm'); }
      else if (G.input.pressed('b')) { this.result = -1; this.closed = true; A() && A().sfx('cancel'); }
      if (this.cursor < this.scroll) this.scroll = this.cursor;
      if (this.cursor >= this.scroll + this.pageSize) this.scroll = this.cursor - this.pageSize + 1;
    }
    draw() {
      G.drawBox(this.x, this.y, this.w, this.h);
      if (this.opts.title) G.drawText(this.opts.title, this.x + 8, this.y + 4);
      const top = this.y + (this.opts.title ? 16 : 8);
      for (let i = 0; i < this.pageSize; i++) {
        const r = this.rows[this.scroll + i]; if (!r) break;
        const yy = top + i * 16;
        const maxChars = Math.max(1, Math.floor((this.w - 24 - (r.right ? r.right.length * 8 + 8 : 0)) / 8));
        G.drawText(r.label.length > maxChars ? r.label.slice(0, maxChars) : r.label, this.x + 16, yy, r.disabled ? '#888888' : undefined);
        if (r.right) G.drawText(r.right, this.x + this.w - 8 - r.right.length * 8, yy);
        if (this.scroll + i === this.cursor) G.drawText('▶', this.x + 8, yy);
      }
      if (this.scroll + this.pageSize < this.rows.length && Math.floor(G.frame / 16) % 2 === 0) G.drawText('▼', this.x + this.w - 16, this.y + this.h - 12);
    }
  }
  UI.ListMenu = ListMenu;
  UI.chooseList = function* (rows, opts) { const m = G.push(new ListMenu(rows, opts)); while (!m.closed) yield null; G.pop(m); return m.result < 0 ? null : m.rows[m.result]; };

  // ---------- Quantity selector ----------
  UI.quantity = function* (max, unitPrice, opts) {
    const w = { qty: 1, closed: false, result: 0, x: G.VW - 96, y: G.VH - 48 - 24, update() {
      if (G.input.repeat('up')) this.qty = this.qty >= max ? 1 : this.qty + 1;
      else if (G.input.repeat('down')) this.qty = this.qty <= 1 ? max : this.qty - 1;
      else if (G.input.pressed('a')) { this.result = this.qty; this.closed = true; A() && A().sfx('confirm'); }
      else if (G.input.pressed('b')) { this.result = 0; this.closed = true; A() && A().sfx('cancel'); }
    }, draw() { G.drawBox(this.x, this.y, 96, 24); G.drawText('×' + String(this.qty).padStart(2, '0') + ' $' + String(this.qty * unitPrice).padStart(5, ' '), this.x + 8, this.y + 8); } };
    G.push(w); while (!w.closed) yield null; G.pop(w); return w.result;
  };

  // ---------- HP bar ----------
  UI.drawHPBar = function (x, y, w, frac, opts) {
    frac = Math.max(0, Math.min(1, frac));
    const era = G.era;
    if (era === 0) { G.fillRect(x, y, w, 4, G.DMG[3]); G.fillRect(x, y, w, 1, G.DMG[0]); G.fillRect(x, y + 3, w, 1, G.DMG[0]); G.fillRect(x, y + 1, Math.round(w * frac), 2, G.DMG[0]); return; }
    G.fillRect(x - 1, y - 1, w + 2, 6, '#303030'); G.fillRect(x, y, w, 4, '#e8e8e8');
    const col = frac > 0.5 ? '#40c040' : frac > 0.2 ? '#f0c020' : '#f04040';
    G.fillRect(x, y, Math.round(w * frac), 4, col);
    if (opts && opts.fill) G.fillRect(x, y, Math.round(w * frac), 4, opts.fill);
  };
  UI.drawTextScaled = function (str, x, y, s, color, advance) {
    const ctx = G.ctx; advance = advance || 8;
    const F = window.FONT; if (!F) return;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]; if (ch === ' ') continue;
      const rows = F.glyphs[ch] || F.glyphs['?']; if (!rows) continue;
      ctx.fillStyle = color || G.textColor();
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) if (rows[yy][xx] === 'X') ctx.fillRect(x + (i * advance + xx) * s, y + yy * s, s, s);
    }
  };

  // ---------- Party screen ----------
  // mode: 'view' (summary/switch), 'select' (return index), 'battle' (switch during battle)
  UI.party = function* (mode, opts) {
    opts = opts || {};
    const party = G.state.party;
    if (!party.length) { yield* UI.say(['You have no animals yet!']); return null; }
    const w = { fullscreen: true, cursor: opts.cursor || 0, closed: false, result: null, msg: opts.msg || 'Choose an ANIMAL.',
      update() {
        const n = party.length;
        if (G.input.repeat('up')) { this.cursor = (this.cursor + n - 1) % n; A() && A().sfx('select'); }
        else if (G.input.repeat('down')) { this.cursor = (this.cursor + 1) % n; A() && A().sfx('select'); }
        else if (G.input.pressed('a')) { this.result = this.cursor; this.closed = true; A() && A().sfx('confirm'); }
        else if (G.input.pressed('b')) { this.result = -1; this.closed = true; A() && A().sfx('cancel'); }
      },
      draw() {
        G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff');
        party.forEach((a, i) => {
          const y = 4 + i * 20;
          const ow = 'ow_' + a.species.toLowerCase() + '_down_0';
          if (G.hasSprite(ow)) G.drawSprite(ow, 12, y - 2);
          G.drawText(a.nick, 32, y); G.drawText('L' + a.level, G.VW - 40, y);
          G.drawText('HP', 40, y + 10); UI.drawHPBar(56, y + 12, 48, a.hp / a.maxHp);
          if (a.hp > 0) G.drawText(String(a.hp).padStart(3, ' ') + '/' + String(a.maxHp).padStart(3, ' '), G.VW - 60, y + 10);
          else G.drawText('TIRED', G.VW - 60, y + 10);
          if (i === this.cursor) G.drawText('▶', 2, y + 4);
        });
        G.drawBox(0, G.VH - 24, G.VW, 24); G.drawText(this.msg, 8, G.VH - 16);
      } };
    G.push(w); while (!w.closed) yield null; G.pop(w);
    if (w.result < 0) return null;
    if (mode === 'select' || mode === 'battle') return w.result;
    // view mode: SUMMARY / SWITCH / CANCEL
    const a = party[w.result];
    const c = yield* UI.choose(['SUMMARY', 'SWITCH', 'CANCEL'], { x: G.VW - 72, y: G.VH - 64 });
    if (c === 0) { yield* UI.summary(a); return yield* UI.party(mode, { cursor: w.result }); }
    if (c === 1) {
      const j = yield* UI.party('select', { msg: 'Switch with which?', cursor: w.result });
      if (j !== null && j !== w.result) { const t = party[w.result]; party[w.result] = party[j]; party[j] = t; G.refreshFollower(); }
      return yield* UI.party(mode, { cursor: j === null ? w.result : j });
    }
    if (c === 2) return null;                              // CANCEL closes the party screen
    return yield* UI.party(mode, { cursor: w.result });    // B just backs out to the list
  };
  UI.summary = function* (a) {
    const sp = DATA.SPECIES[a.species] || { name: a.species, kind: '???' };
    const w = { fullscreen: true, closed: false, page: 0, update() { if (G.input.pressed('a') || G.input.pressed('right')) { if (this.page === 0) this.page = 1; else this.closed = true; } if (G.input.pressed('b') || G.input.pressed('left')) { if (this.page === 1) this.page = 0; else this.closed = true; } },
      draw() {
        G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff');
        const fs = 'front_' + a.species.toLowerCase();
        if (G.hasSprite(fs)) G.drawSprite(fs, 8, 8);
        G.drawText(a.nick, 64, 8); G.drawText('L' + a.level, 64, 18);
        G.drawText(sp.name + ' / ' + sp.kind, 64, 30);
        G.drawText('HP ' + a.hp + '/' + a.maxHp, 64, 42);
        if (this.page === 0) {
          G.drawBox(0, 60, G.VW, G.VH - 60);
          G.drawText('CHARM   ' + String(a.atk).padStart(3), 8, 68); G.drawText('CALM    ' + String(a.def).padStart(3), 8, 78); G.drawText('SPEED   ' + String(a.spd).padStart(3), 8, 88);
          G.drawText('EXP  ' + String(a.exp).padStart(6), 8, 100);
          const next = a.level < 100 ? DATA.expForLevel(a.level + 1) - a.exp : 0;
          G.drawText('NEXT ' + String(next).padStart(6), 8, 110);
          G.drawText('▶', G.VW - 16, G.VH - 12);
        } else {
          G.drawBox(0, 60, G.VW, G.VH - 60);
          a.moves.forEach((m, i) => { const md = DATA.MOVES[m.id]; G.drawText(md.name, 8, 68 + i * 16); G.drawText(md.style.slice(0, 5) + ' PP' + String(m.pp).padStart(3) + '/' + String(m.maxPp).padStart(2), 8, 76 + i * 16); });
        }
      } };
    G.push(w); while (!w.closed) yield null; G.pop(w);
  };

  // ---------- Bag ----------
  // returns chosen item id or null; if opts.inBattle the caller handles use; opts.filter fn(itemDef)
  UI.bag = function* (opts) {
    opts = opts || {};
    while (true) {
      const rows = G.state.items.filter(it => !opts.filter || opts.filter(DATA.ITEMS[it.id])).map(it => ({ label: it.id, right: DATA.ITEMS[it.id].key ? '' : '×' + String(it.qty).padStart(2, ' '), value: it.id }));
      if (G.state.beans > 0 && !opts.filter) rows.push({ label: 'VEGAN BEANS', right: '×' + String(G.state.beans).padStart(2, ' '), value: 'VEGAN BEANS' });
      if (!rows.length) { yield* UI.say([opts.emptyMsg || (opts.filter ? 'You have nothing useful for this!' : 'Your BAG is empty!')]); return null; }
      const r = yield* UI.chooseList(rows, { x: G.VW - 152, y: 0, w: 152, pageSize: 4, title: opts.title || 'BAG' });
      if (!r) return null;
      if (opts.pick) return r.value;
      const def = DATA.ITEMS[r.value];
      const c = yield* UI.choose(['USE', 'INFO', 'CANCEL'], { x: G.VW - 72, y: 72 });
      if (c === 1) { yield* UI.say([def.desc]); continue; }
      if (c !== 0) continue;
      const used = yield* UI.useItem(r.value, false);
      if (used) continue;
    }
  };
  UI.useItem = function* (id, inBattle) {
    const def = DATA.ITEMS[id];
    if (def.use === 'heal' || def.use === 'revive') {
      const i = yield* UI.party('select', { msg: 'Use on which animal?' });
      if (i === null) return false;
      const a = G.state.party[i];
      if (def.use === 'revive') { if (a.hp > 0) { yield* UI.say(["It won't have any effect."]); return false; } a.hp = Math.floor(a.maxHp / 2); G.removeItem(id); A() && A().sfx('heal'); yield* UI.say([a.nick + ' is back on its feet!']); return true; }
      if (a.hp >= a.maxHp) { yield* UI.say(["It won't have any effect."]); return false; }
      if (a.hp <= 0) { yield* UI.say([a.nick + ' is too tired. It needs a B12 SHOT.']); return false; }
      const before = a.hp; a.hp = Math.min(a.maxHp, a.hp + def.amount); G.removeItem(id); A() && A().sfx('heal');
      yield* UI.say([a.nick + ' recovered by ' + (a.hp - before) + ' HP!']); return true;
    }
    if (def.use === 'food') { yield* UI.say(['You should give that to a wild animal in need!']); return false; }
    if (def.use === 'bike') { if (G.map.indoor) { yield* UI.say(["Not inside!"]); return false; } G.bikeOn = !G.bikeOn; A() && A().sfx('confirm'); yield* UI.say([G.bikeOn ? G.state.name + ' hopped on the BIKE!' : G.state.name + ' folded up the BIKE.']); return true; }
    if (def.use === 'beans') { yield* UI.say(['You admire your VEGAN BEANS. ' + G.state.beans + ' of ' + DATA.TOTAL_BEANS + ' found.']); return false; }
    yield* UI.say([def.desc]); return false;
  };

  // ---------- Dex ----------
  UI.dex = function* () {
    const list = Object.values(DATA.SPECIES).sort((a, b) => a.dex - b.dex);
    const rows = list.map(sp => { const seen = G.state.dex.seen[sp.name]; const res = G.state.dex.rescued[sp.name]; return { label: String(sp.dex).padStart(3, '0') + ' ' + (seen ? sp.name : '-------'), right: res ? '♥' : '', value: sp.name, disabled: !seen }; });
    const seenN = Object.keys(G.state.dex.seen).length, resN = Object.keys(G.state.dex.rescued).length;
    while (true) {
      const r = yield* UI.chooseList(rows, { x: 0, y: 0, w: G.VW, h: G.VH, pageSize: Math.floor((G.VH - 40) / 16), fullscreen: true, title: 'SEEN ' + seenN + ' RESCUED ' + resN, withCancel: true });
      if (!r) return;
      const sp = DATA.SPECIES[r.value];
      const w = { fullscreen: true, closed: false, update() { if (G.input.pressed('a') || G.input.pressed('b')) this.closed = true; }, draw() {
        G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff'); G.drawBox(0, 0, G.VW, G.VH);
        const fs = 'front_' + sp.name.toLowerCase(); if (G.hasSprite(fs)) G.drawSprite(fs, 8, 8);
        G.drawText(sp.name, 64, 12); G.drawText(sp.kind + ' FRIEND', 64, 22); G.drawText('HT ' + sp.height, 64, 34); G.drawText('WT ' + sp.weight, 64, 44);
        G.drawText(G.state.dex.rescued[sp.name] ? 'RESCUED ♥' : 'SEEN', 64, 56);
        const lines = G.wrapText(sp.entry, Math.floor((G.VW - 16) / 8)); lines.forEach((l, i) => G.drawText(l, 8, 68 + i * 10));
      } };
      G.push(w); while (!w.closed) yield null; G.pop(w);
    }
  };

  // ---------- Trainer card ----------
  UI.card = function* () {
    const st = G.state;
    const w = { fullscreen: true, closed: false, update() { if (G.input.pressed('a') || G.input.pressed('b')) this.closed = true; }, draw() {
      G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff'); G.drawBox(0, 0, G.VW, G.VH);
      G.drawText('NAME/' + st.name, 8, 10);
      G.drawText('MONEY $' + st.money, 8, 24);
      G.drawText('BEANS ' + st.beans + '/' + DATA.TOTAL_BEANS, 8, 36);
      G.drawText('RESCUED ' + (st.party.length + st.sanctuary.length), 8, 48);
      G.drawText('CONVERTED ' + st.converted, 8, 60);
      const secs = Math.floor(st.playFrames / 60); G.drawText('TIME ' + Math.floor(secs / 3600) + ':' + String(Math.floor(secs / 60) % 60).padStart(2, '0'), 8, 72);
      G.drawSprite('hero_down_0', G.VW - 32, 8);
      G.drawText('BADGES', 8, 90);
      if (st.badges.length && G.hasSprite('badge_compassion')) G.drawSprite('badge_compassion', 8, 100); else G.drawText('(none yet)', 8, 102);
      if (st.flags.party_done) G.drawText('★ BIRTHDAY HERO ★', 8, G.VH - 20);
    } };
    G.push(w); while (!w.closed) yield null; G.pop(w);
  };

  // ---------- Options ----------
  UI.options = function* () {
    const o = G.state.options;
    const w = { fullscreen: true, closed: false, cursor: 0, update() {
      if (G.input.repeat('up')) this.cursor = (this.cursor + 2) % 3; else if (G.input.repeat('down')) this.cursor = (this.cursor + 1) % 3;
      else if (G.input.pressed('left') || G.input.pressed('right') || G.input.pressed('a')) {
        const d = G.input.pressed('left') ? -1 : 1;
        if (this.cursor === 0) o.textSpeed = (o.textSpeed + d + 3) % 3;
        else if (this.cursor === 1) { o.sound = !o.sound; G.setMutePref(!o.sound); if (A()) A().setMuted(!o.sound); }
        else if (this.cursor === 2) this.closed = true;
        A() && A().sfx('select');
      } else if (G.input.pressed('b') || G.input.pressed('start')) this.closed = true;
    }, draw() {
      G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff'); G.drawBox(0, 0, G.VW, 72);
      G.drawText('TEXT SPEED :' + ['SLOW', 'MID', 'FAST'][o.textSpeed], 16, 12);
      G.drawText('SOUND      :' + (o.sound ? 'ON' : 'OFF'), 16, 28);
      G.drawText('CANCEL', 16, 44);
      G.drawText('▶', 8, 12 + this.cursor * 16);
      G.drawBox(0, G.VH - 32, G.VW, 32); G.drawText('←→ change   B exit', 8, G.VH - 22);
    } };
    G.push(w); while (!w.closed) yield null; G.pop(w);
  };

  // ---------- Name entry ----------
  UI.nameEntry = function* (title, defaultName, maxLen) {
    maxLen = maxLen || 7;
    const rows = ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ -.!', 'abcdefghij', 'klmnopqrst', 'uvwxyz  ♥★', '0123456789'];
    const COLS = 10, CW = 14;
    const w = { fullscreen: true, closed: false, name: '', cx: 0, cy: 0, result: null, update() {
      const R = rows.length;
      if (G.input.repeat('up')) this.cy = (this.cy + R) % (R + 1); else if (G.input.repeat('down')) this.cy = (this.cy + 1) % (R + 1);
      else if (G.input.repeat('left')) { if (this.cy < R) this.cx = (this.cx + COLS - 1) % COLS; else this.cx = this.cx === 0 ? 1 : 0; }
      else if (G.input.repeat('right')) { if (this.cy < R) this.cx = (this.cx + 1) % COLS; else this.cx = this.cx === 0 ? 1 : 0; }
      else if (G.input.pressed('a')) {
        if (this.cy === R) { if (this.cx === 0) { this.name = this.name.slice(0, -1); } else { this.result = this.name.trim() || defaultName; this.closed = true; } }
        else if (this.name.length < maxLen) { this.name += rows[this.cy][this.cx]; if (this.name.length === maxLen) { this.cy = R; this.cx = 1; } }
        A() && A().sfx('select');
      } else if (G.input.pressed('b')) { this.name = this.name.slice(0, -1); A() && A().sfx('cancel'); }
      else if (G.input.pressed('start')) { this.result = this.name.trim() || defaultName; this.closed = true; }
      if (this.cy === R && this.cx > 1) this.cx = 1;
    }, draw() {
      G.fillRect(0, 0, G.VW, G.VH, G.era === 0 ? G.DMG[3] : '#ffffff'); G.drawBox(0, 0, G.VW, G.VH);
      G.drawText(title, 8, 8);
      let shown = ''; for (let i = 0; i < maxLen; i++) shown += this.name[i] || '_'; G.drawText(shown, 8, 24);
      rows.forEach((r, y) => { for (let x = 0; x < COLS; x++) G.drawText(r[x], 16 + x * CW, 40 + y * 10); });
      G.drawText('DEL', 16, 40 + rows.length * 10 + 2); G.drawText('END', 72, 40 + rows.length * 10 + 2);
      const cx = this.cy < rows.length ? 8 + this.cx * CW : (this.cx === 0 ? 8 : 64), cy = this.cy < rows.length ? 40 + this.cy * 10 : 40 + rows.length * 10 + 2;
      if (Math.floor(G.frame / 8) % 2 === 0) G.drawText('▶', cx, cy);
    } };
    G.push(w); while (!w.closed) yield null; G.pop(w); return w.result;
  };

  // ---------- Start menu ----------
  UI.startMenu = function* () {
    A() && A().sfx('confirm');
    let cursor = 0;
    while (true) {
      const items = []; const acts = [];
      if (G.flag('has_dex')) { items.push('FRIENDDEX'); acts.push('dex'); }
      if (G.state.party.length) { items.push('ANIMALS'); acts.push('party'); }
      items.push('BAG'); acts.push('bag');
      items.push(G.state.name); acts.push('card');
      items.push('SAVE'); acts.push('save');
      items.push('OPTION'); acts.push('options');
      items.push('EXIT'); acts.push('exit');
      const r = yield* UI.choose(items, { x: G.VW - 88, y: 0, w: 88, cursor, startCloses: true });
      if (r < 0) return; cursor = r;
      const act = acts[r];
      if (act === 'exit') return;
      if (act === 'dex') yield* UI.dex();
      else if (act === 'party') yield* UI.party('view');
      else if (act === 'bag') yield* UI.bag();
      else if (act === 'card') yield* UI.card();
      else if (act === 'options') yield* UI.options();
      else if (act === 'save') { yield* SCRIPTS.saveGame(); return; }
    }
  };

  // ---------- Title screen ----------
  UI.title = function* () {
    G.mode = 'title';
    const animals = ['front_bunny', 'front_chick', 'front_piglet', 'front_calf', 'front_lamb', 'front_duckling', 'front_kidgoat', 'front_pigeon'].filter(G.hasSprite);
    const w = { fullscreen: true, closed: false, t: 0, idx: 0, update() { this.t++; if (this.t % 150 === 0) this.idx = (this.idx + 1) % Math.max(1, animals.length); if (G.input.pressed('start') || G.input.pressed('a')) { this.closed = true; } },
      draw() {
        const bw = G.era === 0 ? G.DMG[3] : '#ffffff'; G.fillRect(0, 0, G.VW, G.VH, bw);
        const cx = G.VW / 2;
        // logo
        const title = 'HACKTIVISTS'; const s = 2; const adv = 7; const tw = ((title.length - 1) * adv + 7) * s;
        UI.drawTextScaled(title, Math.round(cx - tw / 2) + 2, 12, s, G.era === 0 ? G.DMG[1] : '#3a2a6a', adv);
        UI.drawTextScaled(title, Math.round(cx - tw / 2), 10, s, G.era === 0 ? G.DMG[0] : '#8a5cd6', adv);
        const sub = 'VIOLET VERSION'; G.drawText(sub, Math.round(cx - sub.length * 4), 30, G.era === 0 ? G.DMG[0] : '#5a3a9a');
        if (animals.length) { const spr = animals[this.idx]; G.drawSprite(spr, Math.round(cx - 24), 42); }
        if (G.hasSprite('hero_down_0')) G.drawSprite('hero_down_0', Math.round(cx - 44), 57);
        const bd = 'HAPPY BIRTHDAY'; G.drawText(bd, Math.round(cx - bd.length * 4), 94, G.era === 0 ? G.DMG[0] : '#c03060');
        const bd2 = '♥ JAMES ♥'; G.drawText(bd2, Math.round(cx - bd2.length * 4), 104, G.era === 0 ? G.DMG[0] : '#c03060');
        if (Math.floor(this.t / 30) % 2 === 0) { const ps = 'PRESS START'; G.drawText(ps, Math.round(cx - ps.length * 4), 118); }
        const cr = '2026 VH & VIOLET'; G.drawText(cr, Math.round(cx - cr.length * 4), G.VH - 12, G.era === 0 ? G.DMG[1] : '#606060');
      } };
    G.push(w); while (!w.closed) yield null; G.pop(w);
  };
})();
