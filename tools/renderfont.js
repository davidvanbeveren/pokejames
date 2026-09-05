#!/usr/bin/env node
// Preview tool for js/font.js — renders sample text lines and a full glyph catalog to
// tools/out/font.png at 4x scale so the bitmap font can be eyeballed for legibility.
// Usage: node tools/renderfont.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const { Canvas } = require('./png');

const FONT_FILE = path.join(__dirname, '..', 'js', 'font.js');
const OUT_DIR = path.join(__dirname, 'out');
const OUT_FILE = path.join(OUT_DIR, 'font.png');

function loadFont(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(code, sandbox, { filename: file });
  return sandbox.window.FONT;
}

const FONT = loadFont(FONT_FILE);
const problems = [];
if (!FONT || FONT.w !== 8 || FONT.h !== 8) problems.push('FONT.w/h must both be 8');
const glyphs = (FONT && FONT.glyphs) || {};
for (const [ch, rows] of Object.entries(glyphs)) {
  if (!Array.isArray(rows) || rows.length !== 8) { problems.push(`glyph '${ch}': expected 8 rows, got ${rows ? rows.length : 'none'}`); continue; }
  rows.forEach((r, i) => {
    if (typeof r !== 'string' || r.length !== 8) problems.push(`glyph '${ch}' row ${i}: expected 8 chars, got '${r}'`);
    else if (!/^[X.]+$/.test(r)) problems.push(`glyph '${ch}' row ${i}: invalid chars '${r}' (only 'X' and '.' allowed)`);
  });
}

const INK = [40, 32, 24];      // near-black ink, warm dark brown-black like GB Pokemon text
const PAPER = [248, 248, 224]; // off-white paper background (also used as glyph-cell padding)
const GRID = [225, 225, 205];  // faint cell-grid line for the catalog
const SCALE = 4;

function drawGlyph(canvas, ch, ox, oy, scale) {
  const rows = glyphs[ch];
  if (!rows) { // missing-glyph box so gaps are obvious in the preview
    canvas.rect(ox, oy, 8 * scale, 8 * scale, 255, 0, 255);
    return;
  }
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if (rows[y][x] === 'X') canvas.rect(ox + x * scale, oy + y * scale, scale, scale, INK[0], INK[1], INK[2]);
  }
}
function drawString(canvas, str, ox, oy, scale) {
  for (let i = 0; i < str.length; i++) drawGlyph(canvas, str[i], ox + i * 8 * scale, oy, scale);
}
function measure(str) { return str.length * 8; }

const sampleLines = [
  'THE QUICK BROWN FOX 0123456789',
  'the quick brown fox jumps!?',
  "NOOCH x3 $200 ▶ ▼ ♥ é…",
  'PACK: 12/20  HP 34/34  LV.9',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'abcdefghijklmnopqrstuvwxyz',
  '.,!?\'":;-()/&+*%$#=<>[]_~@',
  '♂ ♀ × ★ → ←  1+1=2  50% off!',
];

// Full glyph catalog, in a fixed reading order (space, digits, upper, lower, punctuation, specials).
const catalogOrder = (' 0123456789' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz' +
  '.,!?\'":;-()/&+*%$#=<>[]_~@').split('')
  .concat(['▶', '▼', '▲', '♥', '♂', '♀', 'é', '…', '×', '★', '→', '←']);

// missing / extra glyph check
const have = new Set(Object.keys(glyphs));
const want = new Set(catalogOrder);
for (const ch of want) if (!have.has(ch)) problems.push(`missing required glyph: '${ch}' (U+${ch.codePointAt(0).toString(16)})`);

const pad = 8;
const lineH = 8 * SCALE + 6;
const sampleBlockH = pad + sampleLines.length * lineH + pad;
const catCols = 16;
const catCellW = 8 * SCALE + 10, catCellH = 8 * SCALE + 14;
const catRows = Math.ceil(catalogOrder.length / catCols);
const catBlockH = pad + catRows * catCellH + pad;
const maxLineW = Math.max(...sampleLines.map(measure)) * SCALE;
const W = Math.max(pad * 2 + maxLineW, pad * 2 + catCols * catCellW);
const H = sampleBlockH + catBlockH;

const cv = new Canvas(W, H);
cv.fill(PAPER[0], PAPER[1], PAPER[2]);

let y = pad;
for (const line of sampleLines) { drawString(cv, line, pad, y, SCALE); y += lineH; }
y += pad;

// simple 5x7 label glyphs aren't available, so labels below each catalog cell reuse the font itself at scale 1
function drawStringSmall(canvas, str, ox, oy) {
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], rows = glyphs[ch];
    if (!rows) continue;
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) if (rows[yy][xx] === 'X') canvas.set(ox + i * 8 + xx, oy + yy, 120, 120, 120);
  }
}

catalogOrder.forEach((ch, i) => {
  const cx = pad + (i % catCols) * catCellW, cy = y + Math.floor(i / catCols) * catCellH;
  cv.rect(cx, cy, catCellW - 2, catCellH - 2, GRID[0], GRID[1], GRID[2]);
  cv.rect(cx + 1, cy + 1, catCellW - 4, 8 * SCALE + 4, PAPER[0], PAPER[1], PAPER[2]);
  drawGlyph(cv, ch, cx + 5, cy + 3, SCALE);
  const label = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  drawStringSmall(cv, label, cx + 2, cy + 8 * SCALE + 6);
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, cv.toPNG());

console.log(`glyphs defined: ${Object.keys(glyphs).length}`);
if (problems.length) { console.log('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
else console.log('validation: OK');
console.log('output: ' + OUT_FILE);
