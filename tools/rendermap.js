#!/usr/bin/env node
// Map preview: node tools/rendermap.js js/maps_pallet.js [mapId ...] [--scale 2]
// Renders each map (or all maps in the file) to tools/out/maps/<mapId>.png using the tile sprites,
// overlaying object markers: N = npc, W = warp, S = sign, I = item, T = trigger, X = interact.
// Also validates legend characters, tile ids, exits and object positions.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { Canvas } = require('./png');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
let scale = 2; const files = []; const only = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--scale') scale = parseInt(args[++i], 10); else if (args[i].endsWith('.js')) files.push(args[i]); else only.push(args[i]); }
if (!files.length) { console.error('usage: node tools/rendermap.js js/maps_x.js [mapId]'); process.exit(1); }

const sandbox = { window: {}, console }; sandbox.window.window = sandbox.window;
const load = f => { const p = path.isAbsolute(f) ? f : path.join(ROOT, f); if (fs.existsSync(p)) vm.runInNewContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p }); };
for (const f of fs.readdirSync(path.join(ROOT, 'js'))) if (f.startsWith('sprites_')) load('js/' + f);
load('js/tiles.js'); load('js/data.js');
for (const f of files) load(f);
const W = sandbox.window;
const SPR = W.SPRITES || {}, TILES = W.TILES, LEGEND = W.TILE_LEGEND, VARIANTS = W.TILE_VARIANTS;
function parseColor(spec) { const m = /^#([0-9a-fA-F]{6})/.exec(String(spec)); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : [255, 0, 255]; }
function drawSprite(cv, name, ox, oy, sc, pal) {
  const def = SPR[name];
  if (!def) { cv.rect(ox, oy, 16 * sc, 16 * sc, 255, 0, 255); return false; }
  const cols = {}; for (const k of Object.keys(def.pal)) cols[k] = parseColor(pal && pal[k] ? pal[k] : def.pal[k]);
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) { const c = def.rows[y][x]; if (c === '.' || !cols[c]) continue; cv.rect(ox + x * sc, oy + y * sc, sc, sc, ...cols[c]); }
  return true;
}
// tiny 3x5 marker font
const MARK = { N: ['X.X', 'XXX', 'X.X', 'X.X', 'X.X'], W: ['X.X', 'X.X', 'XXX', 'XXX', 'X.X'], S: ['XXX', 'X..', 'XXX', '..X', 'XXX'], I: ['XXX', '.X.', '.X.', '.X.', 'XXX'], T: ['XXX', '.X.', '.X.', '.X.', '.X.'], X: ['X.X', 'X.X', '.X.', 'X.X', 'X.X'], E: ['XXX', 'X..', 'XXX', 'X..', 'XXX'] };
function mark(cv, ch, x, y, sc) { const g = MARK[ch]; if (!g) return; cv.rect(x, y, 5 * sc, 7 * sc, 0, 0, 0); for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 3; xx++) if (g[yy][xx] === 'X') cv.rect(x + (xx + 1) * sc, y + (yy + 1) * sc, sc, sc, 255, 255, 0); }

const MAPS = W.MAPS || {};
let ids = Object.keys(MAPS); if (only.length) ids = ids.filter(i => only.includes(i));
fs.mkdirSync(path.join(ROOT, 'tools/out/maps'), { recursive: true });
let problems = 0;
for (const id of ids) {
  const m = MAPS[id]; const legend = Object.assign({}, LEGEND, m.legend || {});
  const h = m.rows.length, w = Math.max(...m.rows.map(r => r.length));
  const issues = [];
  m.rows.forEach((r, y) => { if (r.length !== w) issues.push(`row ${y} has length ${r.length}, expected ${w}`); });
  const cv = new Canvas(w * 16 * scale, h * 16 * scale); cv.fill(255, 0, 255);
  const missingSprites = new Set();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = m.rows[y][x]; const tid = legend[ch];
    if (tid === undefined) { issues.push(`unknown legend char '${ch}' at (${x},${y})`); continue; }
    const [base, variant] = tid.split(':'); const td = TILES[base];
    if (!td) { issues.push(`unknown tile '${tid}' at (${x},${y})`); continue; }
    if (variant && !VARIANTS[variant]) issues.push(`unknown variant '${variant}' at (${x},${y})`);
    let name = Array.isArray(td.sprite) ? td.sprite[0] : td.sprite;
    if (!drawSprite(cv, name, x * 16 * scale, y * 16 * scale, scale, variant ? VARIANTS[variant] : null)) missingSprites.add(name);
    if (td.door && !(m.objects || []).some(o => o.type === 'warp' && o.x === x && o.y === y)) issues.push(`door at (${x},${y}) has no warp object`);
  }
  for (const o of (m.objects || [])) {
    if (o.x < 0 || o.y < 0 || o.x >= w || o.y >= h) issues.push(`object ${o.type} ${o.id || ''} out of bounds at (${o.x},${o.y})`);
    const ch = { npc: 'N', warp: 'W', sign: 'S', item: 'I', trigger: 'T', interact: 'X' }[o.type] || 'X';
    mark(cv, ch, o.x * 16 * scale + 1, o.y * 16 * scale + 1, scale);
    if (o.type === 'npc') {
      const tid = legend[m.rows[o.y] && m.rows[o.y][o.x]]; const td = tid && TILES[tid.split(':')[0]];
      if (td && td.solid) issues.push(`npc ${o.id} stands on solid tile '${tid}' at (${o.x},${o.y})`);
      if (o.sprite && !SPR[o.sprite + '_down_0'] && !o.animal) issues.push(`npc ${o.id} uses unknown sprite '${o.sprite}'`);
      if (o.trainer && !W.DATA.SKEPTICS[o.trainer.class]) issues.push(`npc ${o.id} has unknown skeptic class ${o.trainer.class}`);
    }
    if (o.type === 'warp' && !MAPS[o.map] && files.length) { /* target may be in another file */ }
    if (o.type === 'item' && !W.DATA.ITEMS[o.item]) issues.push(`item ${o.id} has unknown item '${o.item}'`);
  }
  for (const ex of (m.exits || [])) { const edgeY = ex.edge === 'north' ? 0 : ex.edge === 'south' ? h - 1 : null; if (edgeY !== null) for (let x = ex.from; x <= ex.to; x++) { const tid = legend[m.rows[edgeY][x]]; const td = tid && TILES[tid.split(':')[0]]; if (td && td.solid) issues.push(`exit ${ex.edge} x=${x} is blocked by solid tile '${tid}'`); mark(cv, 'E', x * 16 * scale + 1, edgeY * 16 * scale + 1, scale); } }
  fs.writeFileSync(path.join(ROOT, 'tools/out/maps', id + '.png'), cv.toPNG());
  console.log(`${id}: ${w}x${h}, ${(m.objects || []).length} objects -> tools/out/maps/${id}.png`);
  if (missingSprites.size) console.log('  missing tile sprites (drawn magenta): ' + [...missingSprites].join(', '));
  if (issues.length) { problems += issues.length; console.log('  PROBLEMS:\n    ' + issues.join('\n    ')); }
}
if (problems) process.exitCode = 1; else console.log('validation: OK');
