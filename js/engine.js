// Core engine: canvas, eras, sprites, text, input, maps, entities, camera, rendering, script coroutines.
(function () {
  'use strict';
  const G = window.G = {};
  const TILE = 16;
  G.TILE = TILE;
  const ERA_VIEW = [[160, 144], [160, 144], [240, 160]];
  const DMG = ['#000000', '#555555', '#aaaaaa', '#ffffff'];
  G.DMG = DMG;
  G.era = 0;
  G.frame = 0;
  G.debug = false;

  // ---------- canvas ----------
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  G.ctx = ctx;
  G.canvas = canvas;
  function fitCanvas() {
    const wrap = document.getElementById('game');
    const availW = wrap.clientWidth || window.innerWidth;
    const availH = wrap.clientHeight || window.innerHeight;
    let scale = Math.floor(Math.min(availW / G.VW, availH / G.VH));
    if (scale < 1) scale = Math.min(availW / G.VW, availH / G.VH);
    canvas.style.width = Math.floor(G.VW * scale) + 'px';
    canvas.style.height = Math.floor(G.VH * scale) + 'px';
  }
  G.setEra = function (era) {
    G.era = era;
    const [w, h] = ERA_VIEW[era];
    G.VW = w; G.VH = h;
    canvas.width = w; canvas.height = h;
    ctx.imageSmoothingEnabled = false;
    fitCanvas();
    document.body.setAttribute('data-era', String(era));
    if (window.AUDIO) AUDIO.setEra(era);
  };
  window.addEventListener('resize', fitCanvas);

  // ---------- colors ----------
  const colorCache = new Map();
  function parseColor(spec) {
    if (colorCache.has(spec)) return colorCache.get(spec);
    const m = /^#([0-9a-fA-F]{6})(?::([0-3]))?$/.exec(String(spec).trim());
    let out;
    if (!m) out = { rgb: [255, 0, 255], shade: 0 };
    else {
      const rgb = [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
      let shade;
      if (m[2] !== undefined) shade = parseInt(m[2], 10);
      else { const l = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255; shade = l < 0.22 ? 0 : l < 0.48 ? 1 : l < 0.76 ? 2 : 3; }
      out = { rgb, shade, hasShade: m[2] !== undefined };
    }
    colorCache.set(spec, out);
    return out;
  }
  G.parseColor = parseColor;
  function eraRGB(col, era) {
    if (era === 0) { const v = [0, 85, 170, 255][col.shade]; return [v, v, v]; }
    if (era === 1) {
      // 15-bit color + slight desaturation, GBC-ish
      const q = v => Math.round(Math.round(v / 255 * 31) / 31 * 255);
      const [r, g, b] = col.rgb; const l = 0.3 * r + 0.59 * g + 0.11 * b; const k = 0.85;
      return [q(r * k + l * (1 - k)), q(g * k + l * (1 - k)), q(b * k + l * (1 - k))];
    }
    return col.rgb;
  }
  G.eraHex = function (hex, era) { const c = parseColor(hex); const [r, g, b] = eraRGB(c, era === undefined ? G.era : era); return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); };

  // ---------- sprites ----------
  const spriteCache = new Map();
  const missing = new Set();
  function compileSprite(name, era, pal, flip) {
    const def = window.SPRITES && window.SPRITES[name];
    if (!def) { if (!missing.has(name)) { missing.add(name); console.warn('missing sprite', name); } return null; }
    const c = document.createElement('canvas'); c.width = def.w; c.height = def.h;
    const x = c.getContext('2d'); const img = x.createImageData(def.w, def.h); const d = img.data;
    const cols = {};
    for (const k of Object.keys(def.pal)) {
      const base = parseColor(def.pal[k]);
      if (pal && pal[k]) { const o = parseColor(pal[k]); cols[k] = { rgb: o.rgb, shade: o.hasShade ? o.shade : base.shade }; }
      else cols[k] = base;
    }
    for (const k of Object.keys(cols)) cols[k].era = eraRGB(cols[k], era);
    for (let yy = 0; yy < def.h; yy++) {
      const row = def.rows[yy] || '';
      for (let xx = 0; xx < def.w; xx++) {
        const ch = row[xx]; if (!ch || ch === '.') continue;
        const col = cols[ch]; if (!col) continue;
        const px = flip ? def.w - 1 - xx : xx;
        const i = (yy * def.w + px) * 4;
        d[i] = col.era[0]; d[i + 1] = col.era[1]; d[i + 2] = col.era[2]; d[i + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  G.getSprite = function (name, opts) {
    const era = (opts && opts.era !== undefined) ? opts.era : G.era;
    const pal = opts && opts.pal; const flip = !!(opts && opts.flip);
    const key = name + '|' + era + '|' + (pal ? JSON.stringify(pal) : '') + '|' + (flip ? 1 : 0);
    let c = spriteCache.get(key);
    if (c === undefined) { c = compileSprite(name, era, pal, flip); spriteCache.set(key, c); }
    return c;
  };
  G.hasSprite = name => !!(window.SPRITES && window.SPRITES[name]);
  G.drawSprite = function (name, x, y, opts) {
    const c = G.getSprite(name, opts);
    if (!c) { if (G.debug) { ctx.fillStyle = '#f0f'; ctx.fillRect(x, y, 16, 16); } return; }
    if (opts && opts.alpha !== undefined) { ctx.globalAlpha = opts.alpha; ctx.drawImage(c, Math.round(x), Math.round(y)); ctx.globalAlpha = 1; }
    else if (opts && opts.scale) ctx.drawImage(c, Math.round(x), Math.round(y), c.width * opts.scale, c.height * opts.scale);
    else ctx.drawImage(c, Math.round(x), Math.round(y));
  };

  // ---------- text ----------
  const glyphCache = new Map();
  function glyph(ch, color) {
    const key = ch + '|' + color;
    let c = glyphCache.get(key);
    if (c) return c;
    const F = window.FONT; const rows = (F && (F.glyphs[ch] || F.glyphs['?'])) || null;
    c = document.createElement('canvas'); c.width = 8; c.height = 8;
    if (rows) {
      const x = c.getContext('2d'); x.fillStyle = color;
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) if (rows[yy] && rows[yy][xx] === 'X') x.fillRect(xx, yy, 1, 1);
    }
    glyphCache.set(key, c);
    return c;
  }
  // characters the 8x8 font lacks are mapped to close equivalents (Gen 1 had no accents either)
  const FALLBACK = { 'Ė': 'E', 'É': 'E', 'È': 'E', 'Ë': 'E', 'ė': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'À': 'A', 'Á': 'A', 'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'Í': 'I', 'í': 'i', 'ï': 'i', 'Ó': 'O', 'ó': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o', 'Ú': 'U', 'ú': 'u', 'ü': 'u', 'Ü': 'U', 'ß': 'ss', 'ñ': 'n', 'Ñ': 'N', 'ç': 'c', 'Ç': 'C', '¡': '!', '¿': '?', '—': '-', '–': '-', '↔': '<->', '“': '"', '”': '"', '‘': "'", '’': "'", '©': '(C)', '·': '.', '\u00a0': ' ' };
  G.normalizeText = function (str) {
    let out = '';
    for (const ch of String(str)) {
      if (FALLBACK[ch] !== undefined) { out += FALLBACK[ch]; continue; }
      const cp = ch.codePointAt(0);
      if (cp > 0xffff || cp === 0xfe0f || cp === 0x200d || (cp >= 0x2600 && cp <= 0x27bf && ch !== '★' && ch !== '♥' && ch !== '♂' && ch !== '♀')) continue; // emoji and pictographs have no glyph
      out += ch;
    }
    return out.replace(/ {2,}/g, ' ').replace(/ +([,.!?])/g, '$1').trim();
  };
  G.textColor = function () { return G.era === 2 ? '#303038' : '#000000'; };
  G.drawText = function (str, x, y, color) {
    str = G.normalizeText(str);
    color = color || G.textColor();
    x = Math.round(x); y = Math.round(y);
    if (G.era === 2 && !(color === '#ffffff')) { // GBA text shadow
      for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch !== ' ') ctx.drawImage(glyph(ch, '#c0c0c8'), x + i * 8 + 1, y + 1); }
    }
    for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch !== ' ') ctx.drawImage(glyph(ch, color), x + i * 8, y); }
  };
  G.wrapText = function (str, maxChars) {
    const out = [];
    for (const para of G.normalizeText(str).split('\n')) {
      const words = para.split(' '); let line = '';
      for (const w of words) {
        if (!line.length) { line = w; continue; }
        if (line.length + 1 + w.length <= maxChars) line += ' ' + w;
        else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out.map(l => l.length > maxChars ? l.slice(0, maxChars) : l);
  };

  // ---------- frames / boxes ----------
  G.drawBox = function (x, y, w, h, opts) {
    const era = G.era;
    if (era === 2) {
      ctx.fillStyle = '#f8f8f8'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#5070b0'; ctx.fillRect(x, y + 1, 1, h - 2); ctx.fillRect(x + w - 1, y + 1, 1, h - 2); ctx.fillRect(x + 1, y, w - 2, 1); ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
      ctx.fillStyle = '#a8c0f0'; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
      ctx.fillStyle = '#98b0e0'; ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1); ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
      return;
    }
    const black = era === 0 ? DMG[0] : '#000000';
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = black;
    // classic double line: outer line inset 1, inner line inset 3 (Gen 1 look)
    ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
    ctx.fillRect(x + 3, y + 3, w - 6, 1); ctx.fillRect(x + 3, y + h - 4, w - 6, 1); ctx.fillRect(x + 3, y + 3, 1, h - 6); ctx.fillRect(x + w - 4, y + 3, 1, h - 6);
    // notch corners for the rounded look
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + w - 2, y + 1, 1, 1); ctx.fillRect(x + 1, y + h - 2, 1, 1); ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
    ctx.fillStyle = black; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + w - 3, y + 2, 1, 1); ctx.fillRect(x + 2, y + h - 3, 1, 1); ctx.fillRect(x + w - 3, y + h - 3, 1, 1);
  };
  G.fillRect = function (x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

  // ---------- input ----------
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a', KeyK: 'a', KeyX: 'b', Backspace: 'b', KeyJ: 'b', Enter: 'start', Escape: 'back', ShiftLeft: 'select', ShiftRight: 'select', Tab: 'select' };
  const held = {}, pressed = {}, heldFrames = {};
  const Input = G.input = {
    held: k => !!held[k],
    pressed: k => !!pressed[k] || (k === 'b' && !!pressed.back),   // ESC backs out of menus like B

    heldFrames: k => heldFrames[k] || 0,
    // menu-style repeat: fires on press, then every 6 frames after 14 held frames
    repeat: k => pressed[k] || (held[k] && heldFrames[k] > 14 && (heldFrames[k] % 6 === 0)),
    any: () => Object.keys(pressed).some(k => pressed[k]),
    set: (k, v) => { if (v && !held[k]) { pressed[k] = true; heldFrames[k] = 0; } held[k] = v; if (!v) heldFrames[k] = 0; },
    endFrame: () => { for (const k in pressed) pressed[k] = false; for (const k in held) if (held[k]) heldFrames[k] = (heldFrames[k] || 0) + 1; },
    clear: () => { for (const k in pressed) pressed[k] = false; },
  };
  const KEYMAP_KEY = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    z: 'a', Z: 'a', ' ': 'a', k: 'a', K: 'a', x: 'b', X: 'b', Backspace: 'b', j: 'b', J: 'b', Enter: 'start', Escape: 'back', Shift: 'select', Tab: 'select' };
  const keyOf = e => KEYMAP[e.code] || KEYMAP_KEY[e.key];
  G.toast = null;
  const MUTE_KEY = 'hacktivists_muted';
  // Kept out of the save so it survives a refresh, a NEW GAME, and the title screen.
  G.mutePref = () => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } };
  G.setMutePref = m => { try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) {} };
  G.applyMutePref = function () {
    const m = G.mutePref();
    G.state.options.sound = !m;
    if (window.AUDIO) AUDIO.setMuted(m);
  };
  // ---------- cheats (press 0) ----------
  G.CHEAT_MONEY = 999999;
  G.cheats = function () {
    if (G.mode !== 'game' || !G.state.party) { G.toast = { text: 'NOT IN GAME', t: 90 }; return; }
    const st = G.state;
    st.cheats = true;
    for (const a of st.party.concat(st.sanctuary || [])) {
      a.level = 99;
      a.exp = DATA.expForLevel(99);
      DATA.recalcStats(a);
      a.hp = a.maxHp;
      for (const m of a.moves) m.pp = m.maxPp;
    }
    st.money = G.CHEAT_MONEY;
    if (window.AUDIO) AUDIO.sfx('levelup');
    G.toast = { text: 'CHEATS ON', t: 120 };
    if (window.UI) G.runScript(UI.say(['CHEATS MODE ACTIVATED!',
      'Every animal is now level 99, and your money is locked at $' + G.CHEAT_MONEY + '.']));
  };

  const LOFI_KEY = 'hacktivists_lofi';
  G.lofiPref = () => { try { return localStorage.getItem(LOFI_KEY) === '1'; } catch (e) { return false; } };
  G.toggleLofi = function () {
    if (!window.AUDIO || !AUDIO.setLofi) return;
    const on = !AUDIO.isLofi();
    AUDIO.setLofi(on);
    try { localStorage.setItem(LOFI_KEY, on ? '1' : '0'); } catch (e) {}
    if (!on) AUDIO.playMusic(G.map && G.map.music);   // back to whatever this place plays
    G.toast = { text: on ? 'LOFI ON' : 'LOFI OFF', t: 100 };
  };

  G.toggleMute = function () {
    const o = G.state.options; o.sound = !o.sound;
    G.setMutePref(!o.sound);
    if (window.AUDIO) AUDIO.setMuted(!o.sound);
    G.toast = { text: o.sound ? 'SOUND ON' : 'SOUND OFF', t: 75 };
  };
  window.addEventListener('keydown', e => {
    if (!e.repeat && (e.code === 'KeyM' || e.key === 'm' || e.key === 'M')) { G.userGesture(); G.toggleMute(); e.preventDefault(); return; }
    if (!e.repeat && (e.code === 'Digit0' || e.key === '0')) { G.userGesture(); G.cheats(); e.preventDefault(); return; }
    if (!e.repeat && (e.code === 'KeyL' || e.key === 'l' || e.key === 'L')) { G.userGesture(); G.toggleLofi(); e.preventDefault(); return; }
    const k = keyOf(e); if (!k) return;
    if (e.code === 'Tab' || e.code === 'Space' || e.code === 'Backspace' || e.code.startsWith('Arrow')) e.preventDefault();
    if (!e.repeat) Input.set(k, true);
    G.userGesture();
  });
  window.addEventListener('keyup', e => { const k = keyOf(e); if (k) Input.set(k, false); });
  window.addEventListener('blur', () => { for (const k in held) Input.set(k, false); });
  G.userGesture = function () { if (window.AUDIO) { AUDIO.init(); } };
  // touch buttons
  document.querySelectorAll('[data-key]').forEach(el => {
    const k = el.getAttribute('data-key');
    const down = e => { e.preventDefault(); Input.set(k, true); G.userGesture(); el.classList.add('down'); };
    const up = e => { e.preventDefault(); Input.set(k, false); el.classList.remove('down'); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
  });

  // ---------- state ----------
  G.newState = function () {
    return {
      name: 'JAMES', rival: 'DAVID', map: 'player_house_2f', x: 3, y: 4, dir: 'down', money: 500,
      items: [], party: [], sanctuary: [], flags: {}, picked: {}, defeated: {}, dex: { seen: {}, rescued: {} },
      badges: [], beans: 0, playFrames: 0, options: { textSpeed: 2, sound: true, animations: true }, lastCenter: null,
      maxEra: 0, converted: 0, bike: false, version: 1,
    };
  };
  G.state = G.newState();
  G.flag = (k, v) => { if (v === undefined) return !!G.state.flags[k]; G.state.flags[k] = v; return v; };
  G.addItem = function (id, qty) {
    qty = qty || 1;
    if (id === 'VEGAN BEANS') { G.state.beans += qty; return true; }
    const it = G.state.items.find(i => i.id === id);
    if (it) { it.qty = Math.min(99, it.qty + qty); } else G.state.items.push({ id, qty });
    return true;
  };
  G.removeItem = function (id, qty) {
    qty = qty || 1;
    const i = G.state.items.findIndex(x => x.id === id); if (i < 0) return false;
    G.state.items[i].qty -= qty; if (G.state.items[i].qty <= 0) G.state.items.splice(i, 1); return true;
  };
  G.hasItem = id => G.state.items.some(i => i.id === id && i.qty > 0);
  G.itemQty = id => { const it = G.state.items.find(i => i.id === id); return it ? it.qty : 0; };

  // ---------- maps ----------
  G.maps = {};       // compiled maps by id
  G.map = null;      // current compiled map
  G.entities = [];   // runtime entities on current map (includes player)
  G.player = null;
  function parseTileId(id) {
    const [base, variant] = id.split(':');
    return { base, variant: variant || null };
  }
  G.compileMap = function (id) {
    if (G.maps[id]) return G.maps[id];
    const def = window.MAPS[id];
    if (!def) throw new Error('unknown map ' + id);
    const legend = Object.assign({}, window.TILE_LEGEND, def.legend || {});
    const h = def.rows.length, w = Math.max(...def.rows.map(r => r.length));
    const grid = [];
    for (let y = 0; y < h; y++) {
      const row = []; const src = def.rows[y];
      for (let x = 0; x < w; x++) {
        const ch = src[x] === undefined ? ' ' : src[x];
        let tid = legend[ch];
        if (tid === undefined) { if (ch !== ' ') console.warn(`map ${id}: unknown legend char '${ch}' at ${x},${y}`); tid = def.indoor ? 'void' : 'grass'; }
        const p = parseTileId(tid);
        if (!window.TILES[p.base]) { console.warn(`map ${id}: unknown tile '${tid}'`); p.base = 'grass'; }
        row.push(p);
      }
      grid.push(row);
    }
    const m = { id, def, w, h, grid, name: def.name || '', era: def.era || 0, indoor: !!def.indoor, border: def.border || (def.indoor ? 'void' : 'tree'), music: def.music || null, objects: def.objects || [], exits: def.exits || [], encounters: def.encounters ? (typeof def.encounters === 'string' ? DATA.ENCOUNTERS[def.encounters] : def.encounters) : null };
    G.maps[id] = m;
    return m;
  };
  G.tileAt = function (x, y, map) {
    map = map || G.map;
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return { base: map.border, variant: null, oob: true };
    return map.grid[y][x];
  };
  G.tileDef = (x, y) => window.TILES[G.tileAt(x, y).base];
  G.objectsAt = function (x, y, type) { return G.map.objects.filter(o => (!type || o.type === type) && o.x === x && o.y === y); };
  G.warpAt = function (x, y) { return G.map.objects.find(o => o.type === 'warp' && o.x === x && o.y === y) || null; };
  G.triggerAt = function (x, y) { return G.map.objects.find(o => o.type === 'trigger' && x >= o.x && x < o.x + (o.w || 1) && y >= o.y && y < o.y + (o.h || 1)) || null; };
  G.entityAt = function (x, y, except) {
    for (const e of G.entities) {
      if (e === except || e.hidden) continue;
      if (e.x === x && e.y === y) return e;
      if (e.moving && e.x + e.dx === x && e.y + e.dy === y) return e;
      if (e.jumping && e.x + e.dx * 2 === x && e.y + e.dy * 2 === y) return e;
    }
    return null;
  };
  G.isSolid = function (x, y, ent) {
    const t = G.tileAt(x, y);
    if (t.oob) return true;
    const td = window.TILES[t.base];
    if (td.solid) return true;
    if (td.door && !G.warpAt(x, y)) return true;
    if (td.ledge) return !(ent && ent.dir === td.ledge && ent === G.player);
    // visible items are solid
    if (G.map.objects.some(o => o.type === 'item' && o.x === x && o.y === y && !o.hidden && !G.state.picked[o.id])) return true;
    return false;
  };

  // ---------- entities ----------
  G.makeEntity = function (o) {
    const e = {
      id: o.id, kind: o.kind || 'char', sprite: o.sprite, pal: o.pal || null, x: o.x, y: o.y, dir: o.dir || 'down', frame: 0, animT: 0,
      moving: false, jumping: false, dx: 0, dy: 0, progress: 0, speed: 1, move: o.move || 'static', range: o.range === undefined ? 2 : o.range, home: { x: o.x, y: o.y },
      dialog: o.dialog, script: o.script, trainer: o.trainer || null, wait: 30 + Math.floor(Math.random() * 60), hidden: !!o.hidden, def: o, emote: null, emoteT: 0,
      path: o.path || null, pathI: 0, follower: !!o.follower, faceOnTalk: o.faceOnTalk !== false,
    };
    return e;
  };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  G.DIRS = DIRS;
  G.opposite = d => ({ up: 'down', down: 'up', left: 'right', right: 'left' })[d];
  G.startMove = function (e, dir, opts) {
    e.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = e.x + dx, ny = e.y + dy;
    const t = G.tileAt(nx, ny); const td = window.TILES[t.base];
    if (e === G.player && td.ledge && dir === td.ledge) {
      // hop over the ledge: land 2 tiles away
      const lx = e.x + dx * 2, ly = e.y + dy * 2;
      if (!G.isSolid(lx, ly, e) && !G.entityAt(lx, ly, e) && !window.TILES[G.tileAt(lx, ly).base].ledge) {
        e.jumping = true; e.moving = false; e.dx = dx; e.dy = dy; e.progress = 0; e.speed = 1;
        if (window.AUDIO) AUDIO.sfx('ledge');
        return true;
      }
      return false;
    }
    if (G.isSolid(nx, ny, e)) return false;
    if (e !== G.player && !(opts && opts.force)) {
      if (G.warpAt(nx, ny) || td.grass && e.kind === 'char' && e.move === 'wander' && false) return false;
      if (td.ledge || td.door) return false;
      if (e.move === 'wander' && (Math.abs(nx - e.home.x) > e.range || Math.abs(ny - e.home.y) > e.range)) return false;
    }
    const occ = G.entityAt(nx, ny, e);
    if (occ && !(e === G.player && occ.follower)) return false;
    e.moving = true; e.dx = dx; e.dy = dy; e.progress = 0;
    e.speed = (opts && opts.speed) || 1;
    return true;
  };
  G.entityPixel = function (e) {
    let px = e.x * TILE, py = e.y * TILE;
    if (e.moving) { px += e.dx * e.progress; py += e.dy * e.progress; }
    if (e.jumping) { const p = e.progress; px += e.dx * p * 2; py += e.dy * p * 2 - Math.round(Math.sin(p / 16 * Math.PI) * 8); }
    return [px, py];
  };
  G.stepEntity = function (e) {
    if (e.moving) {
      e.progress += 2 * e.speed;
      e.animT += e.speed;
      if (e.progress >= TILE) { e.lastFrom = { x: e.x, y: e.y }; e.x += e.dx; e.y += e.dy; e.moving = false; e.progress = 0; e.stepped = true; }
    } else if (e.jumping) {
      e.progress += 1;
      e.animT += 1;
      if (e.progress >= TILE) { e.lastFrom = { x: e.x, y: e.y }; e.x += e.dx * 2; e.y += e.dy * 2; e.jumping = false; e.progress = 0; e.stepped = true; }
    }
    if (e.emoteT > 0) { e.emoteT--; if (!e.emoteT) e.emote = null; }
  };
  G.showEmote = function (e, name, frames) { e.emote = name; e.emoteT = frames || 40; };
  // NPC AI (called only when the overworld is active)
  G.updateNPC = function (e) {
    if (e.moving || e.jumping || e === G.player || e.hidden) return;
    if (e.move === 'static') return;
    if (e.wait > 0) { e.wait--; return; }
    e.wait = 40 + Math.floor(Math.random() * 90);
    const dirs = ['up', 'down', 'left', 'right'];
    if (e.move === 'look') { e.dir = dirs[Math.floor(Math.random() * 4)]; return; }
    if (e.move === 'wander') {
      const dx = e.x - e.home.x, dy = e.y - e.home.y;
      if (Math.abs(dx) > e.range || Math.abs(dy) > e.range) {   // strayed (usually after walking over to talk): head back
        const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'up' : 'down');
        if (!G.startMove(e, d, { force: true })) e.dir = d;
        return;
      }
      const d = dirs[Math.floor(Math.random() * 4)]; if (!G.startMove(e, d)) e.dir = d; return;
    }
    if (e.move === 'walk_h' || e.move === 'walk_v') {
      const opts = e.move === 'walk_h' ? ['left', 'right'] : ['up', 'down'];
      const d = opts[Math.floor(Math.random() * 2)]; if (!G.startMove(e, d)) e.dir = d; return;
    }
    if (e.move === 'path' && e.path && e.path.length) {
      const d = e.path[e.pathI % e.path.length];
      if (G.startMove(e, d, { force: true })) e.pathI++; else e.dir = d;
    }
  };
  G.spriteFrame = function (e) {
    const hasRight = G.hasSprite(`${e.sprite}_right_0`);
    const face = (e.dir === 'right' && !hasRight) ? 'left' : e.dir;
    const flip = e.dir === 'right' && !hasRight;
    let f = 0, flipStep = false;
    if (e.moving || e.jumping) {
      const step = Math.floor(e.animT / 4) % 4; // 0 stand, 1 walk A, 2 stand, 3 walk B
      if (step === 1) f = 1;
      else if (step === 3) { if (G.hasSprite(`${e.sprite}_${face}_2`)) f = 2; else { f = 1; flipStep = true; } }
    }
    const name = `${e.sprite}_${face}_${f}`;
    let fl = flip;
    if (flipStep && (face === 'down' || face === 'up')) fl = !fl; // mirror walk A for the other foot when no walk B exists
    return { name, flip: fl };
  };

  // ---------- map loading ----------
  G.loadMap = function (id, px, py, dir) {
    const m = G.compileMap(id);
    G.map = m;
    G.entities = [];
    const st = G.state;
    st.map = id; if (px !== undefined) { st.x = px; st.y = py; } if (dir) st.dir = dir;
    G.player = G.makeEntity({ id: 'player', sprite: 'hero', x: st.x, y: st.y, dir: st.dir, move: 'static' });
    G.entities.push(G.player);
    for (let o of m.objects) {
      if (o.type !== 'npc') continue;
      if (o.team && window.TEAM && window.TEAM[o.team]) o = Object.assign({}, window.TEAM[o.team], o);
      if (o.if && !G.flag(o.if)) continue;
      if (o.unless && G.flag(o.unless)) continue;
      if (o.trainer && G.state.defeated[o.id] && o.trainer.vanish) continue;
      const e = G.makeEntity(Object.assign({ kind: o.animal ? 'animal' : 'char' }, o));
      G.entities.push(e);
    }
    if (m.era !== G.era) G.setEra(m.era);
    if (G.follower) G.spawnFollower();
    if (m.era > st.maxEra) st.maxEra = m.era;
    G.mapBanner = (m.era >= 1 && !m.indoor && m.name) ? { text: m.name, t: 100 } : null;
    if (window.AUDIO && m.music) AUDIO.playMusic(m.music);
    G.animFrame = 0;
    if (window.SCRIPTS && SCRIPTS.onEnterMap) SCRIPTS.onEnterMap(id);
  };
  // follower (your first animal walks behind you in the color eras) — off; flip to re-enable
  G.follower = null;
  G.followerEnabled = false;
  G.spawnFollower = function () {
    if (!G.followerEnabled) { G.follower = null; return; }
    const lead = G.state.party.find(a => a.hp > 0) || G.state.party[0];
    if (!lead || G.era < 1 || G.map.indoor && G.map.def.noFollower) { G.follower = null; return; }
    const sp = DATA.SPECIES[lead.species];
    const owName = 'ow_' + lead.species.toLowerCase();
    if (!G.hasSprite(owName + '_down_0')) { G.follower = null; return; }
    const [bx, by] = G.DIRS[G.opposite(G.player.dir)];
    const f = G.makeEntity({ id: 'follower', kind: 'animal', sprite: owName, x: G.player.x + bx, y: G.player.y + by, dir: G.player.dir, move: 'static' });
    if (G.isSolid(f.x, f.y, f)) { f.x = G.player.x; f.y = G.player.y; }
    f.follower = true; f.noBlock = true;
    G.follower = f; G.entities.push(f);
  };
  G.refreshFollower = function () {
    if (G.follower) { G.entities = G.entities.filter(e => e !== G.follower); G.follower = null; }
    if (G.player) G.spawnFollower();
  };

  // ---------- camera & rendering ----------
  G.animFrame = 0;
  G.mapBanner = null;
  G.fade = { alpha: 0 };
  G.flash = 0;
  G.invert = false;
  G.particles = [];
  function tileSprite(t) {
    const td = window.TILES[t.base];
    let name = td.sprite;
    if (Array.isArray(name)) name = name[Math.floor(G.frame / td.anim) % name.length];
    const pal = t.variant ? window.TILE_VARIANTS[t.variant] : null;
    return { name, pal };
  }
  G.camera = function () {
    const p = G.player; const [px, py] = G.entityPixel(p);
    let cx = Math.round(px + 8 - G.VW / 2), cy = Math.round(py + 8 - G.VH / 2);
    if (G.map.indoor) { // clamp camera to small interiors so they stay centered
      const mw = G.map.w * TILE, mh = G.map.h * TILE;
      if (mw <= G.VW) cx = Math.round((mw - G.VW) / 2); if (mh <= G.VH) cy = Math.round((mh - G.VH) / 2);
    }
    return [cx, cy];
  };
  G.drawWorld = function () {
    const m = G.map; if (!m) return;
    const [cx, cy] = G.camera();
    const x0 = Math.floor(cx / TILE) - 1, y0 = Math.floor(cy / TILE) - 1, x1 = Math.ceil((cx + G.VW) / TILE) + 1, y1 = Math.ceil((cy + G.VH) / TILE) + 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = G.tileAt(x, y); const s = tileSprite(t);
      G.drawSprite(s.name, x * TILE - cx, y * TILE - cy, { pal: s.pal });
    }
    // visible items
    for (const o of m.objects) {
      if (o.type !== 'item' || o.hidden || G.state.picked[o.id]) continue;
      G.drawSprite('item_ball', o.x * TILE - cx, o.y * TILE - cy);
    }
    // drop shadows (GBA era)
    const ents = G.entities.filter(e => !e.hidden).sort((a, b) => G.entityPixel(a)[1] - G.entityPixel(b)[1]);
    if (G.era === 2) for (const e of ents) { const [px, py] = G.entityPixel(e); if (G.hasSprite('shadow_oval')) G.drawSprite('shadow_oval', px - cx, py - cy + 9, { alpha: 0.35 }); }
    // entities
    for (const e of ents) {
      const [px, py] = G.entityPixel(e);
      const fr = G.spriteFrame(e);
      const sd = window.SPRITES[fr.name];
      // characters stand with their feet on the tile bottom; taller sprites poke above the tile
      const yoff = e.kind === 'char' ? (sd ? 16 - sd.h : -4) : (sd && sd.h > 16 ? 16 - sd.h : 0);
      const xoff = sd && sd.w !== 16 ? Math.floor((16 - sd.w) / 2) : 0;
      G.drawSprite(fr.name, px - cx + xoff, py - cy + yoff, { flip: fr.flip, pal: e.pal });
    }
    // tall grass overlay hides the lower half of sprites standing in grass
    for (const e of ents) {
      const tiles = [[e.x, e.y]]; if (e.moving) tiles.push([e.x + e.dx, e.y + e.dy]);
      for (const [tx, ty] of tiles) {
        const t = G.tileAt(tx, ty); if (!window.TILES[t.base].grass) continue;
        const c = G.getSprite(window.TILES[t.base].sprite, {}); if (!c) continue;
        ctx.drawImage(c, 0, 8, 16, 8, tx * TILE - cx, ty * TILE - cy + 8, 16, 8);
      }
    }
    // emotes
    for (const e of ents) if (e.emote) { const [px, py] = G.entityPixel(e); G.drawSprite(e.emote, px - cx, py - cy - 20); }
    // particles (GBA era)
    if (G.era === 2) G.drawParticles(cx, cy);
    // map banner (color eras)
    if (G.mapBanner) {
      const b = G.mapBanner; const w = b.text.length * 8 + 16;
      const slide = b.t > 90 ? (b.t - 90) * 4 : (b.t < 10 ? (10 - b.t) * 4 : 0);
      G.drawBox(4, 4 - slide * 2, w, 24); G.drawText(b.text, 12, 12 - slide * 2);
    }
  };
  G.drawParticles = function (cx, cy) {
    if (G.map.indoor) return;
    if (G.particles.length < 6 && Math.random() < 0.03) G.particles.push({ x: cx + Math.random() * G.VW, y: cy - 8, vx: 0.3 + Math.random() * 0.4, vy: 0.4 + Math.random() * 0.4, t: 0, c: Math.random() < 0.5 ? '#f8b0d0' : '#c0e890' });
    for (const p of G.particles) { p.x += p.vx + Math.sin(p.t / 20) * 0.5; p.y += p.vy; p.t++; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), 2, 2); }
    G.particles = G.particles.filter(p => p.y - cy < G.VH + 8 && p.x - cx < G.VW + 8);
  };
  G.drawFade = function () {
    if (G.fade.alpha > 0) {
      let a = G.fade.alpha;
      if (G.era < 2) a = Math.ceil(a * 4) / 4; // stepped palette fade
      ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, G.VW, G.VH);
    }
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, G.flash)})`; ctx.fillRect(0, 0, G.VW, G.VH); }
    if (G.invert) { ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, G.VW, G.VH); ctx.globalCompositeOperation = 'source-over'; }
  };

  // ---------- UI stack ----------
  G.ui = [];
  G.push = w => { G.ui.push(w); Input.clear(); return w; };
  G.pop = w => { if (w) { const i = G.ui.indexOf(w); if (i >= 0) G.ui.splice(i, 1); } else G.ui.pop(); Input.clear(); };
  G.top = () => G.ui[G.ui.length - 1] || null;

  // ---------- script coroutines ----------
  G.script = { cur: null, queue: [] };
  G.runScript = function (gen) { if (G.script.cur) { G.script.queue.push(gen); return; } G.script.cur = gen; Input.clear(); };
  G.scriptActive = () => !!G.script.cur;
  function stepScript() {
    const s = G.script.cur; if (!s) return;
    let r;
    try { r = s.next(); } catch (err) { console.error('script error', err); G.script.cur = null; G.ui.length = 0; G.fade.alpha = 0; return; }
    if (r.done) { G.script.cur = G.script.queue.shift() || null; }
  }
  // generator helpers
  G.wait = function* (n) { for (let i = 0; i < n; i++) yield null; };
  G.fadeOut = function* (frames) { frames = frames || 16; for (let i = 1; i <= frames; i++) { G.fade.alpha = i / frames; yield null; } G.fade.alpha = 1; };
  G.fadeIn = function* (frames) { frames = frames || 16; for (let i = frames - 1; i >= 0; i--) { G.fade.alpha = i / frames; yield null; } G.fade.alpha = 0; };
  G.walk = function* (e, dirs, speed) {
    for (const d of dirs) {
      if (d === 'wait') { yield* G.wait(16); continue; }
      let tries = 0;
      while (!G.startMove(e, d, { force: true, speed: speed || 1 })) { e.dir = d; tries++; if (tries > 120) break; yield null; }
      while (e.moving) yield null;
    }
  };
  G.face = function* (e, dir) { e.dir = dir; yield null; };
  G.faceEach = (a, b) => { // make a face b
    const dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else a.dir = dy > 0 ? 'down' : 'up';
  };
  G.warpTo = function* (map, x, y, dir, opts) {
    opts = opts || {};
    if (!opts.noFade) yield* G.fadeOut(opts.fast ? 8 : 14);
    const prevEra = G.era;
    G.loadMap(map, x, y, dir);
    if (G.era !== prevEra && G.era > prevEra && window.SCRIPTS && SCRIPTS.onEraUnlock) { yield* SCRIPTS.onEraUnlock(prevEra, G.era); }
    if (!opts.noFade) yield* G.fadeIn(opts.fast ? 8 : 14);
  };

  // ---------- overworld update ----------
  G.holdDir = null; G.holdT = 0;
  function overworldUpdate() {
    const p = G.player;
    // arrival handling (after a step completes)
    if (p.stepped) { p.stepped = false; onPlayerArrive(); if (G.script.cur) return; }
    if (p.moving || p.jumping) return;
    if (Input.pressed('start')) { if (window.UI) G.runScript(UI.startMenu()); return; }
    if (Input.pressed('a')) { interact(); return; }
    if (Input.pressed('select') && G.state.bike) { G.bikeOn = !G.bikeOn; if (window.AUDIO) AUDIO.sfx('select'); }
    let dir = null;
    for (const d of ['up', 'down', 'left', 'right']) if (Input.held(d)) { dir = d; break; }
    if (!dir) { G.holdDir = null; G.holdT = 0; return; }
    if (dir !== p.dir) { p.dir = dir; G.holdDir = dir; G.holdT = 0; return; }
    if (G.holdDir === dir && G.holdT < 3) { G.holdT++; return; }
    const run = (G.era === 2 && Input.held('b')) || G.bikeOn;
    if (!G.startMove(p, dir, { speed: run ? 2 : 1 })) {
      const [ddx, ddy] = DIRS[dir]; const tx = p.x + ddx, ty = p.y + ddy;
      if (tx < 0 || ty < 0 || tx >= G.map.w || ty >= G.map.h) { const ex = findExit(p.x, p.y, dir); if (ex) { G.runScript(doEdgeExit(ex)); return; } const w = G.warpAt(p.x, p.y); if (w && G.map.indoor) { G.runScript(doWarp(w)); return; } }
      if (!p.bumpT) { if (window.AUDIO) AUDIO.sfx('bump'); } p.bumpT = (p.bumpT || 0) + 1; if (p.bumpT > 20) p.bumpT = 0;
    } else p.bumpT = 0;
  }
  function onPlayerArrive() {
    const p = G.player; const x = p.x, y = p.y;
    if (G.follower) followerStep();
    // exits (map edges)
    if (x < 0 || y < 0 || x >= G.map.w || y >= G.map.h) { /* not reachable: oob is solid */ }
    const warp = G.warpAt(x, y);
    if (warp) { G.runScript(doWarp(warp)); return; }
    // edge connections (auto-trigger when arriving on the edge tile while walking outward)
    const exArr = findExit(x, y, p.dir);
    if (exArr && exArr.auto !== false) { G.runScript(doEdgeExit(exArr)); return; }
    const trig = G.triggerAt(x, y);
    if (trig && window.SCRIPTS && SCRIPTS[trig.script]) { const gen = SCRIPTS[trig.script](trig); if (gen) { G.runScript(gen); return; } }
    // trainers looking
    for (const e of G.entities) {
      if (!e.trainer || e.hidden || G.state.defeated[e.id]) continue;
      if (seesPlayer(e)) { G.runScript(SCRIPTS.trainerSpot(e)); return; }
    }
    // birthday greeters: team members who notice you passing by (once each)
    if (!G.map.def.noGreet) for (const e of G.entities) {
      if (e === p || e.hidden || !e.def || !e.def.greet || !e.def.quote) continue;
      const key = 'greeted_' + (e.def.team || e.id);
      if (G.state.flags[key]) continue;
      if (Math.abs(e.x - p.x) + Math.abs(e.y - p.y) <= (e.def.greetRadius || 3)) { G.runScript(SCRIPTS.greetSpot(e)); return; }
    }
    // wild encounter
    const td = G.tileDef(x, y);
    if (td.grass && G.map.encounters && G.state.party.length && Math.random() < G.map.encounters.rate) {
      G.runScript(SCRIPTS.wildEncounter(G.map.encounters));
    }
  }
  function findExit(x, y, dir) {
    for (const ex of G.map.exits) {
      const onEdge = (ex.edge === 'north' && y === 0 && dir === 'up') || (ex.edge === 'south' && y === G.map.h - 1 && dir === 'down') ||
        (ex.edge === 'west' && x === 0 && dir === 'left') || (ex.edge === 'east' && x === G.map.w - 1 && dir === 'right');
      if (!onEdge) continue;
      const along = (ex.edge === 'north' || ex.edge === 'south') ? x : y;
      if (ex.from !== undefined && (along < ex.from || along > ex.to)) continue;
      return ex;
    }
    return null;
  }
  function seesPlayer(e) {
    const p = G.player; const [dx, dy] = DIRS[e.dir]; const sight = e.trainer.sight || 4;
    for (let i = 1; i <= sight; i++) {
      const tx = e.x + dx * i, ty = e.y + dy * i;
      if (tx === p.x && ty === p.y) return true;
      if (G.isSolid(tx, ty)) return false;
      if (G.entityAt(tx, ty, e)) return false;
    }
    return false;
  }
  function followerStep() {
    const f = G.follower; const p = G.player;
    // follower moves into the tile the player just left (hopping ledges the same way the player did)
    const from = p.lastFrom || { x: p.x - p.dx, y: p.y - p.dy };
    const prevX = from.x, prevY = from.y;
    if (f.x === prevX && f.y === prevY) return;
    const ddx = prevX - f.x, ddy = prevY - f.y;
    if (Math.abs(ddx) + Math.abs(ddy) === 1) {
      const d = ddx === 1 ? 'right' : ddx === -1 ? 'left' : ddy === 1 ? 'down' : 'up';
      f.dir = d; f.moving = true; f.dx = ddx; f.dy = ddy; f.progress = 0; f.speed = p.speed || 1;
    } else if ((ddx === 0 && Math.abs(ddy) === 2) || (ddy === 0 && Math.abs(ddx) === 2)) {
      const sx = Math.sign(ddx), sy = Math.sign(ddy);
      const mid = G.tileAt(f.x + sx, f.y + sy); const midDef = window.TILES[mid.base];
      if (midDef.ledge) { f.dir = sx === 1 ? 'right' : sx === -1 ? 'left' : sy === 1 ? 'down' : 'up'; f.jumping = true; f.moving = false; f.dx = sx; f.dy = sy; f.progress = 0; }
      else { f.x = prevX; f.y = prevY; f.dir = p.dir; }
    } else { f.x = prevX; f.y = prevY; f.dir = p.dir; }
  }
  function* doWarp(w) {
    if (window.AUDIO && (G.tileDef(G.player.x, G.player.y).door || G.tileDef(G.player.x, G.player.y).stairs)) AUDIO.sfx('door');
    yield* G.warpTo(w.map, w.tx, w.ty, w.dir || G.player.dir, { fast: true });
    if (w.walk) { yield* G.walk(G.player, [w.dir || G.player.dir]); }
  }
  function* doEdgeExit(ex) {
    const p = G.player;
    let tx = ex.tx, ty = ex.ty;
    const target = G.compileMap(ex.map);
    if (tx === undefined) tx = (ex.edge === 'north' || ex.edge === 'south') ? p.x + (ex.offset || 0) : (ex.edge === 'west' ? target.w - 1 : 0);
    if (ty === undefined) ty = (ex.edge === 'east' || ex.edge === 'west') ? p.y + (ex.offset || 0) : (ex.edge === 'north' ? target.h - 1 : 0);
    yield* G.warpTo(ex.map, tx, ty, p.dir, { fast: true });
  }
  function interact() {
    const p = G.player; const [dx, dy] = DIRS[p.dir];
    let fx = p.x + dx, fy = p.y + dy;
    let ent = G.entityAt(fx, fy, p);
    if (ent && ent.follower) ent = null;
    if (!ent && G.tileDef(fx, fy).counter) { ent = G.entityAt(fx + dx, fy + dy, p); if (ent && ent.follower) ent = null; }
    if (ent) { if (ent.moving) return; G.runScript(SCRIPTS.talk(ent)); return; }
    const sign = G.map.objects.find(o => o.type === 'sign' && o.x === fx && o.y === fy);
    if (sign) { G.runScript(SCRIPTS.readSign(sign)); return; }
    const item = G.map.objects.find(o => o.type === 'item' && o.x === fx && o.y === fy && !G.state.picked[o.id]);
    if (item) { const g = (item.script && SCRIPTS[item.script]) ? SCRIPTS[item.script](item) : SCRIPTS.pickItem(item); if (g) G.runScript(g); return; }
    const obj = G.map.objects.find(o => o.type === 'interact' && o.x === fx && o.y === fy);
    if (obj) { const gen = SCRIPTS[obj.script] ? SCRIPTS[obj.script](obj) : SCRIPTS.readSign(obj); if (gen) G.runScript(gen); return; }
    const td = G.tileDef(fx, fy);
    if (td === window.TILES.pc && window.SCRIPTS.usePC) { G.runScript(SCRIPTS.usePC()); return; }
    if (td === window.TILES.tv) { G.runScript(SCRIPTS.readSign({ text: ['A film is playing. Someone in it is crying beautifully in black and white.'] })); return; }
  }

  // ---------- main loop ----------
  let last = 0, acc = 0;
  const STEP = 1000 / 60;
  function update() {
    G.frame++;
    if (G.mode === 'game') G.state.playFrames++;
    if (G.mapBanner && --G.mapBanner.t <= 0) G.mapBanner = null;
    if (G.flash > 0) G.flash -= 0.1;
    if (G.script.cur) stepScript();
    const top = G.top();
    if (top && top.update) top.update();
    else if (!G.script.cur && G.mode === 'game') overworldUpdate();
    if (G.mode === 'game' && G.map) {
      for (const e of G.entities) {
        if (e !== G.player && !e.follower && !G.script.cur && !top) G.updateNPC(e);
        G.stepEntity(e);
      }
      if (G.follower && G.follower.stepped) G.follower.stepped = false;
    }
    Input.endFrame();
  }
  function render() {
    ctx.fillStyle = G.era === 0 ? DMG[3] : '#ffffff'; ctx.fillRect(0, 0, G.VW, G.VH);
    // find the topmost fullscreen window
    let start = 0;
    for (let i = G.ui.length - 1; i >= 0; i--) if (G.ui[i].fullscreen) { start = i; break; }
    const fullscreenTop = G.ui.length && G.ui[start].fullscreen;
    if (!fullscreenTop && G.mode === 'game') G.drawWorld();
    for (let i = start; i < G.ui.length; i++) if (G.ui[i].draw) G.ui[i].draw();
    if (G.toast) { const w = G.toast.text.length * 8 + 16; G.drawBox(G.VW - w - 4, 4, w, 24); G.drawText(G.toast.text, G.VW - w + 4, 12); if (--G.toast.t <= 0) G.toast = null; }
    G.drawFade();
    if (G.debug) { G.drawText(`${G.state.map} ${G.player ? G.player.x + ',' + G.player.y : ''}`, 2, G.VH - 10, '#ff0000'); }
  }
  function step(ts) {
    if (!last) last = ts;
    acc += Math.min(200, ts - last); last = ts;
    let n = 0;
    while (acc >= STEP && n < (document.hidden ? 12 : 4)) { update(); acc -= STEP; n++; }
    if (acc >= STEP) acc = 0;
    render();
  }
  function rafLoop(ts) { requestAnimationFrame(rafLoop); if (!document.hidden) step(ts); }
  // test helpers: run n logic frames synchronously; simulate a one-frame press
  G.tick = function (n) { for (let i = 0; i < (n || 1); i++) update(); render(); };
  G.press = function (k, holdFrames) { Input.set(k, true); for (let i = 0; i < (holdFrames || 1); i++) update(); Input.set(k, false); render(); };
  G.start = function () {
    G.setEra(0); G.mode = 'title'; requestAnimationFrame(rafLoop);
    // keep ticking when the tab is hidden (rAF pauses); throttled but the game stays responsive
    setInterval(() => { if (document.hidden) step(performance.now()); }, 16);
  };
  G.mode = 'boot';
})();
