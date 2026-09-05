// Bot helpers for headless play-testing (used by playtest.js and ad-hoc scripts).
const { loadGame } = require('./headless');
const verbose = process.argv.includes('--verbose');
const W = loadGame({ quiet: true });
const { G, DATA, SCRIPTS, MAPS, TILES } = W;
const log = (...a) => console.log(...a);
const vlog = (...a) => { if (verbose) console.log('   ', ...a); };
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const top = () => G.top();
const P = () => G.player;

// ---------- UI driver ----------
let rescueBudget = 3; // rescue this many wild animals, run from the rest
let lastTexts = [];
function questionText() { const w = G.ui[G.ui.length - 2]; return (w && w.pages) ? w.pages.join(' ') : ''; }
function chooseIndex(m, idx) { let g = 0; while (m.cursor !== idx && g++ < 20) { G.press(idx > m.cursor ? 'down' : 'up'); G.tick(2); } G.press('a'); G.tick(8); }
function chooseGrid(m, idx) { let g = 0; while (m.cursor !== idx && g++ < 10) { const c = m.cursor; if (Math.floor(idx / 2) > Math.floor(c / 2)) G.press('down'); else if (Math.floor(idx / 2) < Math.floor(c / 2)) G.press('up'); else if (idx % 2 > c % 2) G.press('right'); else G.press('left'); G.tick(2); } G.press('a'); G.tick(8); }
const wantBuy = { item: null };
function handleUI() {
  const t = top(); if (!t) { G.tick(5); return; }
  if (t.pages) { const p = t.pages[t.pageIdx]; if (p && lastTexts[lastTexts.length - 1] !== p) { lastTexts.push(p); vlog('TEXT', p.slice(0, 70)); } G.press('a'); G.tick(20); return; }
  if (Array.isArray(t.items) && t.cols === 2) { // battle grid
    const S = G.ui.find(w => w.S) && G.ui.find(w => w.S).S;
    const items = t.items;
    if (items[0] === 'FEED') { if (rescueBudget > 0 && G.state.items.some(i => DATA.ITEMS[i.id].use === 'food')) chooseGrid(t, 0); else chooseGrid(t, 3); return; }
    const mine = G.state.party[0];
    if (mine && mine.hp < mine.maxHp * 0.45 && (G.hasItem('NOOCH') || G.hasItem('SUPER NOOCH'))) { chooseGrid(t, 1); return; }
    chooseGrid(t, 0); return;
  }
  if (Array.isArray(t.items)) {
    const items = t.items; const q = questionText();
    if (items[0] === 'YES') { const no = /nickname|new game\?|sell|forget/i.test(q); chooseIndex(t, no ? 1 : 0); return; }
    if (items[0] === 'NEW NAME') { chooseIndex(t, 1); return; }
    if (items[0] === 'BUY') { if (wantBuy.item) { chooseIndex(t, 0); } else chooseIndex(t, 2); return; }
    if (items[0] === 'WITHDRAW') { chooseIndex(t, 3); return; }
    if (items.includes('CANCEL')) { chooseIndex(t, items.indexOf('CANCEL')); return; }
    chooseIndex(t, 0); return;
  }
  if (t.rows) { // list
    if (wantBuy.item) { const i = t.rows.findIndex(r => r.label === wantBuy.item); if (i >= 0) { chooseIndex(t, i); wantBuy.item = null; return; } }
    const food = t.rows.findIndex(r => r.value && DATA.ITEMS[r.value] && DATA.ITEMS[r.value].use === 'food');
    if (t.opts && t.opts.title === 'FOOD' && food >= 0) { chooseIndex(t, food); return; }
    const mooch = t.rows.findIndex(r => r.value === 'SUPER NOOCH' || r.value === 'NOOCH'); if (t.opts && t.opts.title === 'BAG' && mooch >= 0) { chooseIndex(t, mooch); return; }
    G.press('b'); G.tick(5); return;
  }
  if (t.qty !== undefined) { G.press('a'); G.tick(5); return; }
  if (t.msg !== undefined) { // party window
    const i = G.state.party.findIndex(a => a.hp > 0); chooseIndex(t, Math.max(0, i)); return;
  }
  if (t.name !== undefined && t.cx !== undefined) { G.press('start'); G.tick(5); return; }
  if (t.closed !== undefined && G.state.party[0] && G.ui.some(w => w.S)) { // move list: pick the best move by style vs the skeptic
    const S = G.ui.find(w => w.S).S; const a = G.state.party[0];
    const mult = md => !S.skeptic ? 1 : (S.skeptic.weak === md.style ? 2 : S.skeptic.resist === md.style ? 0.75 : 1);
    let best = 0, bestV = -1; a.moves.forEach((m, i) => { const md = DATA.MOVES[m.id]; const v = m.pp > 0 ? md.power * mult(md) : -1; if (v > bestV) { bestV = v; best = i; } });
    let g = 0; while (t.cursor !== best && g++ < 8) { G.press(best > t.cursor ? 'down' : 'up'); G.tick(2); }
    G.press('a'); G.tick(10); return;
  }
  if (t.closed !== undefined) { G.press('a'); G.tick(10); return; }
  G.press('a'); G.tick(10);
}
function settle(maxIter) { let it = 0; while (it++ < (maxIter || 600) && (G.ui.length || G.script.cur)) handleUI(); if (G.ui.length || G.script.cur) fail('UI did not settle: ' + G.ui.map(w => w.items ? w.items.join('/') : (w.pages ? 'text' : 'win')).join(' | ')); return it; }

// ---------- movement ----------
function walkable(m, x, y) { if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false; const t = TILES[m.grid[y][x].base]; if (t.solid) return false; if (t.door && !G.warpAt(x, y)) return false; if (G.map.objects.some(o => o.type === 'item' && o.x === x && o.y === y && !o.hidden && !G.state.picked[o.id])) return false; if (G.entities.some(e => e !== P() && !e.follower && !e.hidden && (e.move === 'static' || e.move === 'look') && e.x === x && e.y === y)) return false; return true; }
function bfs(tx, ty, allowTarget) {
  const m = G.map; const sx = P().x, sy = P().y; const key = (x, y) => x + ',' + y;
  const prev = new Map(); prev.set(key(sx, sy), null); const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift(); if (x === tx && y === ty) break;
    for (const [dx, dy, d] of [[0, 1, 'down'], [0, -1, 'up'], [1, 0, 'right'], [-1, 0, 'left']]) {
      let nx = x + dx, ny = y + dy;
      if (nx === tx && ny === ty && allowTarget) { if (!prev.has(key(nx, ny))) { prev.set(key(nx, ny), [x, y, d]); q.push([nx, ny]); } continue; }
      if (!walkable(m, nx, ny)) continue;
      const t = TILES[m.grid[ny][nx].base];
      if (t.ledge) { if (d !== 'down') continue; const lx = nx, ly = ny + 1; if (!walkable(m, lx, ly) || prev.has(key(lx, ly))) continue; prev.set(key(lx, ly), [x, y, d]); q.push([lx, ly]); continue; }
      if (prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), [x, y, d]); q.push([nx, ny]);
    }
  }
  if (!prev.has(key(tx, ty))) return null;
  const path = []; let cur = key(tx, ty);
  while (prev.get(cur)) { const [px, py, d] = prev.get(cur); path.push(d); cur = key(px, py); }
  return path.reverse();
}
function stepDir(d) { const x = P().x, y = P().y, map = G.map.id; let g = 0; G.input.set(d, true); while (g++ < 30 && P().x === x && P().y === y && !P().moving && !P().jumping && !G.script.cur && G.map.id === map) G.tick(1); G.input.set(d, false); let h = 0; while (h++ < 60 && (P().moving || P().jumping)) G.tick(1); G.tick(2); return !(P().x === x && P().y === y && G.map.id === map); }
function goTo(tx, ty, opts) {
  opts = opts || {}; const startMap = G.map.id; let tries = 0;
  while (tries++ < 60) {
    if (G.map.id !== startMap) return 'warped';
    if (P().x === tx && P().y === ty) return 'arrived';
    const path = bfs(tx, ty, opts.stopAdjacent);
    if (!path) { fail(`no path on ${G.map.id} from ${P().x},${P().y} to ${tx},${ty}`); return 'nopath'; }
    const steps = opts.stopAdjacent ? path.slice(0, -1) : path;
    if (!steps.length) return 'arrived';
    let interrupted = false;
    for (const d of steps) {
      const moved = stepDir(d);
      if (G.script.cur || G.ui.length) { vlog('event on', G.map.id, P().x + ',' + P().y); settle(); interrupted = true; break; }
      if (G.map.id !== startMap) return 'warped';
      if (!moved) { G.tick(30); interrupted = true; break; } // blocked by a wandering NPC: wait and re-plan
    }
    if (!interrupted && P().x === tx && P().y === ty) return 'arrived';
  }
  const ents = G.entities.filter(e => e !== P()).map(e => `${e.id}@${e.x},${e.y}`).join(' ');
  fail(`could not reach ${tx},${ty} on ${G.map.id}; player at ${P().x},${P().y} facing ${P().dir}; entities: ${ents}`); return 'stuck';
}
function faceAndPress(x, y) { const dx = x - P().x, dy = y - P().y; P().dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); G.tick(1); G.press('a'); G.tick(5); settle(); }
function findObj(pred) { return G.map.objects.find(pred); }
function findEnt(id) { return G.entities.find(e => e.id === id || (e.def && e.def.team === id)); }
function talkTo(ent) { // stand adjacent (or across a counter) and press A
  const cands = [];
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const x = ent.x + dx, y = ent.y + dy; if (walkable(G.map, x, y)) cands.push([x, y, ent.x, ent.y]); const t = TILES[G.map.grid[y] && G.map.grid[y][x] ? G.map.grid[y][x].base : 'void']; if (t.counter) { const x2 = x + dx, y2 = y + dy; if (walkable(G.map, x2, y2)) cands.push([x2, y2, ent.x, ent.y]); } }
  for (const [x, y, ex, ey] of cands) { const r = goTo(x, y); if (r === 'arrived') { faceAndPress(ex, ey); return true; } }
  fail('cannot reach npc ' + ent.id); return false;
}
function exitVia(edge) { const ex = G.map.exits.find(e => e.edge === edge); if (!ex) { fail('no ' + edge + ' exit on ' + G.map.id); return; } const x = ex.from, y = edge === 'north' ? 0 : G.map.h - 1; const from = G.map.id; goTo(x, y); if (G.map.id === from) { stepDir(edge === 'north' ? 'up' : 'down'); settle(); } if (G.map.id === from) fail('exit ' + edge + ' from ' + from + ' did not warp'); }
function enterDoor(targetMap) { const w = findObj(o => o.type === 'warp' && o.map === targetMap); if (!w) { fail('no door to ' + targetMap + ' on ' + G.map.id); return false; } goTo(w.x, w.y); settle(); if (G.map.id !== targetMap) { fail('door to ' + targetMap + ' did not warp (at ' + G.map.id + ')'); return false; } return true; }
function leaveInterior() { const w = findObj(o => o.type === 'warp' && MAPS[o.map] && !MAPS[o.map].indoor); if (!w) { fail('no exit warp on ' + G.map.id); return; } const from = G.map.id; goTo(w.x, w.y); settle(); if (G.map.id === from) fail('exit warp on ' + from + ' did not fire'); }
function healAtCenter(town) { if (G.map.id !== town + '_center') { if (G.map.id !== town) travelTo(town); if (!enterDoor(town + '_center')) return; } const nurse = G.entities.find(e => e.def && e.def.script === 'center'); if (!nurse) { fail('no nurse in ' + G.map.id); leaveInterior(); return; } talkTo(nurse); const ok = G.state.party.every(a => a.hp === a.maxHp); if (!ok) fail('center did not heal'); else vlog('healed at', G.map.id); leaveInterior(); }
function buyAtMart(town, item) { if (G.map.id !== town) travelTo(town); if (!enterDoor(town + '_mart')) return; const clerk = G.entities.find(e => e.def && e.def.script === 'mart'); if (!clerk) { fail('no clerk in ' + G.map.id); leaveInterior(); return; } const before = G.itemQty(item); wantBuy.item = item; talkTo(clerk); wantBuy.item = null; if (G.itemQty(item) <= before) fail('could not buy ' + item + ' at ' + G.map.id); else vlog('bought', item); leaveInterior(); }
const CHAIN = ['pallet', 'route1', 'verdant', 'route2', 'violet'];
function travelTo(mapId) { let guard = 0; while (G.map.id !== mapId && guard++ < 8) { if (G.map.indoor) { leaveInterior(); continue; } const i = CHAIN.indexOf(G.map.id), j = CHAIN.indexOf(mapId); if (i < 0 || j < 0) { fail('cannot travel from ' + G.map.id + ' to ' + mapId); return false; } if (i === j) break; exitVia(j > i ? 'north' : 'south'); } return G.map.id === mapId; }
function party() { return G.state.party.map(a => `${a.nick} L${a.level} ${a.hp}/${a.maxHp}`).join(', '); }


module.exports = { travelTo, W, G, DATA, SCRIPTS, MAPS, TILES, log, vlog, fail, top, P, handleUI, settle, walkable, bfs, stepDir, goTo, faceAndPress, findObj, findEnt, talkTo, exitVia, enterDoor, leaveInterior, healAtCenter, buyAtMart, party, setRescueBudget: n => { rescueBudget = n; }, wantBuy, newGame: () => { G.tick(5); G.press('start'); G.tick(10); const menu = top(); chooseIndex(menu, menu.items.indexOf('NEW GAME')); settle(); }, chooseIndex, lastTexts };
