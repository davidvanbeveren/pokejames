#!/usr/bin/env node
// Preview tool: renders sprites from one or more sprite JS files to PNGs.
// Usage: node tools/render.js js/sprites_outdoor.js [js/other.js ...] [--only name1,name2] [--scale 6]
// Output: tools/out/<file-basename>/<sprite>.png  (color version on the left, Game Boy 4-shade version on the right)
//         tools/out/<file-basename>/_sheet.png     (contact sheet of every sprite, color)
//         tools/out/<file-basename>/_sheet_dmg.png (contact sheet, Game Boy shades)
// Also validates the sprite definitions and prints problems.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { Canvas } = require('./png');

const args = process.argv.slice(2);
let only = null, scale = 6;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only') only = args[++i].split(',');
  else if (args[i] === '--scale') scale = parseInt(args[++i], 10);
  else files.push(args[i]);
}
if (!files.length) { console.error('usage: node tools/render.js <sprites.js> [...]'); process.exit(1); }

const DMG = [[0, 0, 0], [85, 85, 85], [170, 170, 170], [255, 255, 255]];
function parseColor(spec, key, name, problems) {
  const m = /^#([0-9a-fA-F]{6})(?::([0-3]))?$/.exec(String(spec).trim());
  if (!m) { problems.push(`${name}: palette key '${key}' has invalid color '${spec}' (want '#rrggbb' or '#rrggbb:shade0-3')`); return { rgb: [255, 0, 255], shade: 0 }; }
  const rgb = [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  let shade;
  if (m[2] !== undefined) shade = parseInt(m[2], 10);
  else { const l = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255; shade = l < 0.22 ? 0 : l < 0.48 ? 1 : l < 0.76 ? 2 : 3; }
  return { rgb, shade };
}

function loadSprites(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(code, sandbox, { filename: file });
  return sandbox.window.SPRITES || {};
}

function validate(name, def, problems) {
  if (!def || typeof def !== 'object') { problems.push(`${name}: not an object`); return false; }
  if (!Number.isInteger(def.w) || !Number.isInteger(def.h)) { problems.push(`${name}: w/h must be integers`); return false; }
  if (!Array.isArray(def.rows) || def.rows.length !== def.h) { problems.push(`${name}: expected ${def.h} rows, got ${def.rows ? def.rows.length : 'none'}`); return false; }
  let ok = true;
  def.rows.forEach((r, i) => { if (typeof r !== 'string' || r.length !== def.w) { problems.push(`${name}: row ${i} has length ${r ? r.length : 'n/a'}, expected ${def.w}`); ok = false; } });
  if (!def.pal || typeof def.pal !== 'object') { problems.push(`${name}: missing pal`); return false; }
  const used = new Set();
  for (const r of def.rows) for (const c of r) used.add(c);
  for (const c of used) if (c !== '.' && !(c in def.pal)) { problems.push(`${name}: char '${c}' used in rows but not in pal`); ok = false; }
  for (const k of Object.keys(def.pal)) { if (k.length !== 1) { problems.push(`${name}: palette key '${k}' must be a single character`); ok = false; } if (!used.has(k)) problems.push(`${name}: (note) palette key '${k}' is unused`); }
  return ok;
}

function drawSprite(canvas, def, ox, oy, sc, mode, problems, name) {
  const cols = {};
  for (const k of Object.keys(def.pal)) cols[k] = parseColor(def.pal[k], k, name, problems);
  for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
    const c = def.rows[y][x];
    if (c === '.') continue;
    const col = cols[c]; if (!col) continue;
    const rgb = mode === 'dmg' ? DMG[col.shade] : col.rgb;
    canvas.rect(ox + x * sc, oy + y * sc, sc, sc, rgb[0], rgb[1], rgb[2]);
  }
}
function checker(canvas, x, y, w, h, sc) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const v = (xx + yy) % 2 ? 214 : 190; canvas.rect(x + xx * sc, y + yy * sc, sc, sc, v, v, 230); }
}

for (const file of files) {
  const problems = [];
  let sprites;
  try { sprites = loadSprites(file); } catch (e) { console.error(`FAILED to load ${file}: ${e.message}`); process.exitCode = 1; continue; }
  const base = path.basename(file, '.js');
  const outDir = path.join(__dirname, 'out', base);
  fs.mkdirSync(outDir, { recursive: true });
  let names = Object.keys(sprites);
  if (only) names = names.filter(n => only.includes(n));
  console.log(`${file}: ${names.length} sprites`);
  const valid = [];
  for (const name of names) {
    const def = sprites[name];
    const pre = problems.length;
    if (!validate(name, def, problems)) continue;
    valid.push(name);
    const gap = 2 * scale;
    const cv = new Canvas(def.w * scale * 2 + gap, def.h * scale);
    cv.fill(40, 40, 40);
    checker(cv, 0, 0, def.w, def.h, scale);
    checker(cv, def.w * scale + gap, 0, def.w, def.h, scale);
    drawSprite(cv, def, 0, 0, scale, 'color', problems, name);
    drawSprite(cv, def, def.w * scale + gap, 0, scale, 'dmg', problems, name);
    fs.writeFileSync(path.join(outDir, name + '.png'), cv.toPNG());
  }
  // contact sheets
  for (const mode of ['color', 'dmg']) {
    const cols = 8, sc = 3, pad = 4;
    const cellW = Math.max(16, ...valid.map(n => sprites[n].w)) * sc + pad, cellH = Math.max(16, ...valid.map(n => sprites[n].h)) * sc + pad;
    const rows = Math.ceil(valid.length / cols) || 1;
    const sheet = new Canvas(cols * cellW + pad, rows * cellH + pad);
    sheet.fill(60, 60, 70);
    valid.forEach((n, i) => {
      const def = sprites[n];
      const x = pad + (i % cols) * cellW, y = pad + Math.floor(i / cols) * cellH;
      checker(sheet, x, y, def.w, def.h, sc);
      drawSprite(sheet, def, x, y, sc, mode, [], n);
    });
    fs.writeFileSync(path.join(outDir, mode === 'color' ? '_sheet.png' : '_sheet_dmg.png'), sheet.toPNG());
  }
  console.log('sheet order (row-major, 8 per row): ' + valid.map((n, i) => `${i}:${n}`).join(' '));
  const errs = problems.filter(p => !p.includes('(note)'));
  const notes = problems.filter(p => p.includes('(note)'));
  if (errs.length) { console.log('PROBLEMS:\n  ' + errs.join('\n  ')); process.exitCode = 1; } else console.log('validation: OK');
  if (notes.length) console.log('notes:\n  ' + notes.join('\n  '));
  console.log('output: ' + outDir);
}
