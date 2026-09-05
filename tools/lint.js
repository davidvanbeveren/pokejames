#!/usr/bin/env node
// Static consistency checks across maps, sprites, data, npcs and scripts. Exit code 1 on problems.
const { loadGame } = require('./headless');
const W = loadGame({ quiet: true });
const { MAPS, SPRITES, TILES, TILE_LEGEND, TILE_VARIANTS, DATA, TEAM, SCRIPTS, G } = W;
const problems = [], notes = [];
const P = (m) => problems.push(m), N = (m) => notes.push(m);
if (W.__missing.length) N('missing script files: ' + W.__missing.join(', '));
const has = n => !!SPRITES[n];
const MUSIC_IDS = W.AUDIO ? W.AUDIO.musicIds().concat(W.AUDIO.streamIds()) : [];
const charFrames = ['down_0', 'down_1', 'up_0', 'up_1', 'left_0', 'left_1'];
// tiles
for (const [id, t] of Object.entries(TILES)) for (const s of [].concat(t.sprite)) if (!has(s)) P(`tile ${id}: missing sprite ${s}`);
for (const [ch, id] of Object.entries(TILE_LEGEND)) { const [b, v] = id.split(':'); if (!TILES[b]) P(`legend '${ch}' -> unknown tile ${id}`); if (v && !TILE_VARIANTS[v]) P(`legend '${ch}' -> unknown variant ${v}`); }
// species
for (const [id, sp] of Object.entries(DATA.SPECIES)) {
  const k = id.toLowerCase();
  for (const s of ['front_' + k, 'back_' + k]) if (!has(s)) P(`species ${id}: missing ${s}`);
  for (const f of charFrames) if (!has(`ow_${k}_${f}`)) P(`species ${id}: missing ow_${k}_${f}`);
  for (const [lvl, mv] of sp.moves) if (!DATA.MOVES[mv]) P(`species ${id}: unknown move ${mv}`);
  if (sp.evolve && !DATA.SPECIES[sp.evolve.to]) P(`species ${id}: evolves into unknown ${sp.evolve.to}`);
  for (const f of Object.values(sp.foods)) if (!DATA.ITEMS[f]) P(`species ${id}: unknown food ${f}`);
}
for (const [id, sk] of Object.entries(DATA.SKEPTICS)) { if (!has(sk.sprite)) P(`skeptic ${id}: missing sprite ${sk.sprite}`); for (const f of charFrames) if (!has(`${sk.ow}_${f}`)) P(`skeptic ${id}: missing ow sprite ${sk.ow}_${f}`); }
for (const [id, enc] of Object.entries(DATA.ENCOUNTERS)) for (const r of enc.table) if (!DATA.SPECIES[r[0]]) P(`encounters ${id}: unknown species ${r[0]}`);
for (const s of ['hero', 'girl', 'boy', 'kid', 'man', 'woman', 'oldman', 'prof', 'mom', 'clerk', 'nurse', 'chef', 'hoodie']) for (const f of charFrames) if (!has(`${s}_${f}`)) P(`character ${s}: missing ${s}_${f}`);
for (const s of ['back_hero', 'item_ball', 'emote_alert', 'emote_heart', 'shadow_oval', 'badge_compassion', 'statue_pigeon']) if (!has(s)) P(`missing ui sprite ${s}`);
for (const [id, t] of Object.entries(TEAM)) for (const f of charFrames) if (!has(`${t.sprite}_${f}`)) P(`team ${id}: missing sprite ${t.sprite}_${f}`);
// maps
const walkable = (m, x, y) => { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false; const t = TILES[m.grid[y][x].base]; if (t.solid) return false; if (t.door && !(m.objects.some(o => o.type === 'warp' && o.x === x && o.y === y))) return false; return true; };
const mapIds = Object.keys(MAPS);
const compiled = {};
for (const id of mapIds) { try { compiled[id] = G.compileMap(id); } catch (e) { P(`map ${id}: compile failed: ${e.message}`); } }
const beanIds = new Set();
for (const [id, m] of Object.entries(compiled)) {
  const def = m.def;
  def.rows.forEach((r, y) => { if (r.length !== m.w) P(`map ${id}: row ${y} width ${r.length} != ${m.w}`); });
  if (m.music && !MUSIC_IDS.includes(m.music)) P(`map ${id}: unknown music ${m.music}`);
  if (def.encounters && typeof def.encounters === 'string' && !DATA.ENCOUNTERS[def.encounters]) P(`map ${id}: unknown encounter table ${def.encounters}`);
  const hasGrass = m.grid.some(r => r.some(t => TILES[t.base].grass));
  if (hasGrass && !m.encounters) N(`map ${id}: has tall grass but no encounters`);
  if (!hasGrass && m.encounters) N(`map ${id}: encounters but no tall grass`);
  for (const ex of m.exits) {
    if (!MAPS[ex.map]) { P(`map ${id}: exit to unknown map ${ex.map}`); continue; }
    const tm = G.compileMap(ex.map);
    for (let a = ex.from; a <= ex.to; a++) {
      const [x, y] = ex.edge === 'north' ? [a, 0] : ex.edge === 'south' ? [a, m.h - 1] : ex.edge === 'west' ? [0, a] : [m.w - 1, a];
      if (!walkable(m, x, y)) P(`map ${id}: exit ${ex.edge} tile (${x},${y}) not walkable`);
      const tx = ex.tx !== undefined ? ex.tx : (ex.edge === 'north' || ex.edge === 'south') ? a + (ex.offset || 0) : (ex.edge === 'west' ? tm.w - 1 : 0);
      const ty = ex.ty !== undefined ? ex.ty : (ex.edge === 'east' || ex.edge === 'west') ? a + (ex.offset || 0) : (ex.edge === 'north' ? tm.h - 1 : 0);
      if (!walkable(tm, tx, ty)) P(`map ${id}: exit ${ex.edge} x=${a} lands on non-walkable (${tx},${ty}) in ${ex.map}`);
    }
  }
  const ids = new Set();
  for (const o of m.objects) {
    if (o.id) { if (ids.has(o.id)) P(`map ${id}: duplicate object id ${o.id}`); ids.add(o.id); }
    if (o.x < 0 || o.y < 0 || o.x >= m.w || o.y >= m.h) P(`map ${id}: ${o.type} ${o.id || ''} out of bounds (${o.x},${o.y})`);
    if (o.type === 'warp') {
      if (!MAPS[o.map]) { P(`map ${id}: warp at (${o.x},${o.y}) to unknown map ${o.map}`); continue; }
      const tm = G.compileMap(o.map);
      if (!walkable(tm, o.tx, o.ty)) P(`map ${id}: warp (${o.x},${o.y}) -> ${o.map} (${o.tx},${o.ty}) lands on a solid tile`);
      const back = tm.objects.find(w => w.type === 'warp' && w.map === id);
      if (!back && !tm.exits.some(e => e.map === id)) N(`map ${id}: warp to ${o.map} has no way back`);
    }
    if (o.type === 'npc') {
      let d = o; if (o.team) { if (!TEAM[o.team]) P(`map ${id}: npc ${o.id} unknown team ${o.team}`); else d = Object.assign({}, TEAM[o.team], o); }
      if (!o.id && !o.team) P(`map ${id}: npc at (${o.x},${o.y}) has no id`);
      if (!walkable(m, o.x, o.y)) P(`map ${id}: npc ${o.id || o.team} stands on a solid tile (${o.x},${o.y})`);
      if (m.objects.some(w => w.type === 'warp' && w.x === o.x && w.y === o.y)) P(`map ${id}: npc ${o.id || o.team} stands on a warp`);
      for (const f of charFrames) if (!has(`${d.sprite}_${f}`)) { P(`map ${id}: npc ${o.id || o.team} missing sprite ${d.sprite}_${f}`); break; }
      if (d.trainer) { if (!DATA.SKEPTICS[d.trainer.class]) P(`map ${id}: npc ${o.id} unknown skeptic ${d.trainer.class}`); if (d.trainer.onWin && !SCRIPTS[d.trainer.onWin]) P(`map ${id}: npc ${o.id} onWin script ${d.trainer.onWin} missing`); }
      if (d.script && !SCRIPTS[d.script]) P(`map ${id}: npc ${o.id} references missing script ${d.script}`);
      if (d.gift && !DATA.ITEMS[d.gift.item]) P(`map ${id}: npc ${o.id} gifts unknown item ${d.gift.item}`);
      if (d.stock) for (const it of d.stock) if (!DATA.ITEMS[it]) P(`map ${id}: npc ${o.id} stocks unknown item ${it}`);
      if (!d.dialog && !d.script && !d.trainer && !d.gift) N(`map ${id}: npc ${o.id || o.team} has no dialog`);
    }
    if (o.type === 'item') {
      if (!DATA.ITEMS[o.item]) P(`map ${id}: item ${o.id} unknown item ${o.item}`);
      if (!o.id) P(`map ${id}: item at (${o.x},${o.y}) has no id`);
      if (o.item === 'VEGAN BEANS') { if (beanIds.has(o.id)) P(`duplicate bean id ${o.id}`); beanIds.add(o.id); }
      if (!walkable(m, o.x, o.y) && o.hidden) P(`map ${id}: hidden item ${o.id} on a solid tile (unreachable)`);
      if (!o.hidden && !walkable(m, o.x, o.y)) P(`map ${id}: visible item ${o.id} on a solid tile`);
    }
    if (o.type === 'trigger' && !SCRIPTS[o.script]) P(`map ${id}: trigger references missing script ${o.script}`);
    if (o.type === 'interact' && o.script && !SCRIPTS[o.script]) P(`map ${id}: interact references missing script ${o.script}`);
    if (o.type === 'sign' && !(TILES[m.grid[o.y][o.x].base] === TILES.sign)) N(`map ${id}: sign object at (${o.x},${o.y}) is not on a sign tile`);
    if (o.type === 'interact' && walkable(m, o.x, o.y)) N(`map ${id}: interact at (${o.x},${o.y}) is on a walkable tile (player must face a solid tile)`);
  }
  // reachability from the map's entry points (warps' targets pointing here + exits)
  const seeds = [];
  for (const [oid, om] of Object.entries(compiled)) for (const o of om.objects) if (o.type === 'warp' && o.map === id) seeds.push([o.tx, o.ty]);
  for (const ex of m.exits) for (let a = ex.from; a <= ex.to; a++) seeds.push(ex.edge === 'north' ? [a, 0] : ex.edge === 'south' ? [a, m.h - 1] : ex.edge === 'west' ? [0, a] : [m.w - 1, a]);
  if (id === 'player_house_2f') seeds.push([3, 4]);
  if (seeds.length) {
    const seen = new Set(); const q = seeds.filter(([x, y]) => walkable(m, x, y)); q.forEach(([x, y]) => seen.add(x + ',' + y));
    const ledgeOk = (fx, fy, tx, ty) => { const t = TILES[m.grid[ty][tx].base]; if (t.ledge) return ty > fy; return true; };
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = x + dx, ny = y + dy; const k = nx + ',' + ny; if (seen.has(k) || !walkable(m, nx, ny)) continue; const t = TILES[m.grid[ny][nx].base]; if (t.ledge) { if (dy !== 1) continue; const lx = nx, ly = ny + 1; if (walkable(m, lx, ly) && !seen.has(lx + ',' + ly)) { seen.add(lx + ',' + ly); q.push([lx, ly]); } continue; } seen.add(k); q.push([nx, ny]); } }
    const adj = (x, y) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
    for (const o of m.objects) {
      if (o.type === 'warp' && !seen.has(o.x + ',' + o.y)) P(`map ${id}: warp at (${o.x},${o.y}) unreachable from entrances`);
      if ((o.type === 'sign' || o.type === 'interact') && !adj(o.x, o.y)) P(`map ${id}: ${o.type} at (${o.x},${o.y}) unreachable`);
      if (o.type === 'item' && !(seen.has(o.x + ',' + o.y) || adj(o.x, o.y))) P(`map ${id}: item ${o.id} unreachable`);
      if (o.type === 'npc' && !(seen.has(o.x + ',' + o.y) || adj(o.x, o.y))) { const beyondCounter = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => { const cx = o.x + dx, cy = o.y + dy; return cx >= 0 && cy >= 0 && cx < m.w && cy < m.h && TILES[m.grid[cy][cx].base].counter && adj(cx, cy); }); if (!beyondCounter) P(`map ${id}: npc ${o.id || o.team} unreachable`); }
      if (o.type === 'trigger' && !seen.has(o.x + ',' + o.y)) N(`map ${id}: trigger ${o.script} at (${o.x},${o.y}) unreachable`);
    }
    for (const ex of m.exits) for (let a = ex.from; a <= ex.to; a++) { const [x, y] = ex.edge === 'north' ? [a, 0] : ex.edge === 'south' ? [a, m.h - 1] : ex.edge === 'west' ? [0, a] : [m.w - 1, a]; if (!seen.has(x + ',' + y)) P(`map ${id}: exit ${ex.edge} x=${a} unreachable from other entrances`); }
  }
}
// text width / glyph checks over every string the player can read
(function () {
  const glyphs = new Set(Object.keys(W.FONT ? W.FONT.glyphs : {}));
  const badChars = new Map(); const longWords = [];
  const check = (str, where) => { str = G.normalizeText(str); for (const ch of String(str)) if (ch !== ' ' && ch !== '\n' && !glyphs.has(ch)) { if (!badChars.has(ch)) badChars.set(ch, []); if (badChars.get(ch).length < 3) badChars.get(ch).push(where); } for (const w of String(str).split(/\s+/)) if (w.length > 18) longWords.push(`${where}: "${w}"`); };
  const walk = (v, where) => { if (typeof v === 'string') check(v, where); else if (Array.isArray(v)) v.forEach((x, i) => walk(x, where)); else if (typeof v === 'function') { try { walk(v(G), where + '(fn)'); } catch (e) { } } else if (v && typeof v === 'object') for (const k of ['text', 'dialog', 'lines', 'after', 'intro', 'taunt', 'win', 'entry', 'desc', 'msg']) if (v[k] !== undefined) walk(v[k], where + '.' + k); };
  G.state = G.newState(); G.state.flags = { starter: true, rival2: true };
  for (const [id, m] of Object.entries(MAPS)) for (const o of (m.objects || [])) { const d = o.team && TEAM[o.team] ? Object.assign({}, TEAM[o.team], o) : o; walk(d, `map ${id} ${o.type} ${o.id || o.team || ''}`); if (d.gift) walk(d.gift, `map ${id} gift ${o.id || ''}`); if (d.trainer) walk(d.trainer, `map ${id} trainer ${o.id || ''}`); }
  for (const [id, t] of Object.entries(TEAM)) walk(t, `team ${id}`);
  for (const [id, sp] of Object.entries(DATA.SPECIES)) { walk(sp.entry, `species ${id}`); const lines = G.wrapText(sp.entry, 18); if (lines.length > 7) P(`species ${id}: dex entry wraps to ${lines.length} lines (max 7)`); }
  for (const [id, it] of Object.entries(DATA.ITEMS)) walk(it.desc, `item ${id}`);
  for (const [id, sk] of Object.entries(DATA.SKEPTICS)) { walk([sk.taunt, sk.win, sk.after], `skeptic ${id}`); for (const a of sk.args) walk(a[2].replace('{S}', 'CHEESE LOVER MIA'), `skeptic ${id} arg`); }
  for (const [id, mv] of Object.entries(DATA.MOVES)) walk(mv.msg.replace('{A}', 'GRIBOUIL'), `move ${id}`);
  for (const [ch, where] of badChars) P(`character '${ch}' (U+${ch.codePointAt(0).toString(16)}) has no font glyph; used in ${where.join('; ')}`);
  for (const l of longWords) P(`word longer than 18 chars will be cut: ${l}`);
})();
for (const w of W.__warnings) N('console.warn: ' + w);
console.log(`maps: ${mapIds.length}, sprites: ${Object.keys(SPRITES).length}, beans: ${beanIds.size}`);
if (notes.length) console.log('NOTES:\n  ' + notes.join('\n  '));
if (problems.length) { console.log('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; } else console.log('lint: OK');
